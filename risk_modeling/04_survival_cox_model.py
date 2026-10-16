"""
Train and export the recurrence-free survival (RFS) model served by
backend/pipeline/survival_engine.py.

- Cox proportional hazards (lifelines), censoring-aware.
- Internal validation on a 25% hold-out (stratified by event when possible): Harrell's C-index and
  calibration of predicted vs. Kaplan-Meier observed RFS at 12/24 months.
- Final model + bootstrap replicates refit on the full cohort; the replicates
  give per-patient 95% confidence bands at inference time.
- Exported as JSON (no pickle) to backend/models/recurrence_cox_model.json.

Run from the repository root (training needs `pip install lifelines`;
the backend only needs numpy to serve the exported JSON):
    python risk_modeling/04_survival_cox_model.py
"""
import json
import os
import sys
from datetime import datetime, timezone

import numpy as np
import pandas as pd
from lifelines import CoxPHFitter, KaplanMeierFitter
from lifelines.utils import concordance_index
from sklearn.model_selection import train_test_split

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "backend"))
from pipeline.survival_engine import FEATURE_COLUMNS, MODEL_PATH, encode_raw  # noqa: E402

DATA_PATH = os.path.join(ROOT, "data", "liver_cancer_recurrence_dataset (2).csv")
TIME_COL = "time_to_recurrence_months"
# The dataset has no explicit event column; follow-up ends at 60 months, so a
# time of 60 is treated as censored (recurrence-free at last follow-up).
EVENT_COL = "recurrence_event"
FOLLOW_UP_MONTHS = 60
PENALIZER = 0.01
N_BOOTSTRAP = 100
SEED = 42
GRID = np.arange(0, FOLLOW_UP_MONTHS + 1, 1.0)


def load_cohort() -> pd.DataFrame:
    df = pd.read_csv(DATA_PATH)
    if EVENT_COL not in df.columns:
        df[EVENT_COL] = (df[TIME_COL] < FOLLOW_UP_MONTHS).astype(int)
    encoded = pd.DataFrame([encode_raw(row) for row in df.to_dict("records")], columns=FEATURE_COLUMNS)
    if encoded.isna().any().any():
        missing = encoded.columns[encoded.isna().any()].tolist()
        raise ValueError(f"Unparseable values in training data for: {missing}")
    encoded["time"] = df[TIME_COL].values
    encoded["event"] = df[EVENT_COL].values
    return encoded


def fit(frame: pd.DataFrame) -> CoxPHFitter:
    return CoxPHFitter(penalizer=PENALIZER).fit(frame, duration_col="time", event_col="event")


def baseline_on_grid(cph: CoxPHFitter) -> np.ndarray:
    """Baseline cumulative hazard (at the covariate means) as a step function on the monthly grid."""
    bch = cph.baseline_cumulative_hazard_.iloc[:, 0]
    idx = np.searchsorted(bch.index.values, GRID, side="right") - 1
    return np.where(idx >= 0, bch.values[np.clip(idx, 0, None)], 0.0)


def survival(cph: CoxPHFitter, X: pd.DataFrame) -> np.ndarray:
    lp = (X[FEATURE_COLUMNS].values - cph._norm_mean.values) @ cph.params_.values
    return np.exp(-np.outer(np.exp(lp), baseline_on_grid(cph)))


def km_on_grid(times, events) -> list:
    km = KaplanMeierFitter().fit(times, events)
    return [round(float(v) * 100, 2) for v in km.survival_function_at_times(GRID).values]


def main():
    cohort = load_cohort()
    print(f"Cohort: n={len(cohort)}, events={int(cohort.event.sum())}, censored={int((1 - cohort.event).sum())}")

    # --- Internal validation on a hold-out split ---
    can_stratify = cohort.event.value_counts().min() >= 2
    train, test = train_test_split(cohort, test_size=0.25, random_state=SEED, stratify=cohort.event if can_stratify else None)
    val_model = fit(train)
    c_train = float(val_model.concordance_index_)
    c_test = float(concordance_index(test.time, -val_model.predict_partial_hazard(test), test.event))
    print(f"C-index: train={c_train:.3f}  hold-out={c_test:.3f}")

    test_surv = survival(val_model, test)
    test_lp = np.log(val_model.predict_partial_hazard(test).values)
    tertiles = np.quantile(test_lp, [1 / 3, 2 / 3])
    calibration = []
    for horizon in (12, 24):
        h = int(horizon)
        for name, mask in (("Low", test_lp < tertiles[0]),
                           ("Intermediate", (test_lp >= tertiles[0]) & (test_lp < tertiles[1])),
                           ("High", test_lp >= tertiles[1])):
            observed = KaplanMeierFitter().fit(test.time[mask], test.event[mask]).survival_function_at_times(horizon).iloc[0]
            calibration.append({"months": horizon, "group": name,
                                "predicted_rfs": round(float(test_surv[mask, h].mean()) * 100, 1),
                                "observed_rfs": round(float(observed) * 100, 1)})
    for row in calibration:
        print(f"  calibration {row['months']}m {row['group']:<12} predicted {row['predicted_rfs']:5.1f}%  observed {row['observed_rfs']:5.1f}%")

    # --- Final model on the full cohort ---
    final = fit(cohort)
    h0 = baseline_on_grid(final)

    # Sanity check: our closed-form survival matches lifelines
    probe = cohort.iloc[:5]
    ref = final.predict_survival_function(probe[FEATURE_COLUMNS], times=GRID).values.T
    assert np.allclose(survival(final, probe), ref, atol=1e-3), "Exported survival does not match lifelines"

    lp_full = np.log(final.predict_partial_hazard(cohort).values)
    cutpoints = np.quantile(lp_full, [1 / 3, 2 / 3])
    groups = {"Low": lp_full < cutpoints[0],
              "Intermediate": (lp_full >= cutpoints[0]) & (lp_full < cutpoints[1]),
              "High": lp_full >= cutpoints[1]}
    km_curves = {name: km_on_grid(cohort.time[mask], cohort.event[mask]) for name, mask in groups.items()}

    # --- Bootstrap replicates for per-patient confidence bands ---
    rng = np.random.default_rng(SEED)
    boot_beta, boot_means, boot_h0 = [], [], []
    for b in range(N_BOOTSTRAP):
        sample = cohort.iloc[rng.integers(0, len(cohort), len(cohort))]
        m = fit(sample)
        boot_beta.append(np.round(m.params_.values, 6).tolist())
        boot_means.append(np.round(m._norm_mean.values, 6).tolist())
        boot_h0.append(np.round(baseline_on_grid(m), 6).tolist())
        if (b + 1) % 25 == 0:
            print(f"  bootstrap {b + 1}/{N_BOOTSTRAP}")

    summary = final.summary
    spec = {
        "model_type": "cox_proportional_hazards",
        "feature_columns": FEATURE_COLUMNS,
        "coefficients": np.round(final.params_.values, 6).tolist(),
        "feature_means": np.round(final._norm_mean.values, 6).tolist(),
        "time_grid_months": GRID.tolist(),
        "baseline_cumulative_hazard": np.round(h0, 6).tolist(),
        "bootstrap": {"n": N_BOOTSTRAP, "coefficients": boot_beta, "feature_means": boot_means, "baseline_cumulative_hazard": boot_h0},
        "risk_groups": {
            "cutpoints": cutpoints.round(6).tolist(),
            "definition": "Tertiles of the model's linear predictor in the training cohort",
            "km_curves": {"months": GRID.tolist(), **km_curves},
        },
        "model_card": {
            "name": "HCC recurrence-free survival (Cox PH)",
            "version": datetime.now(timezone.utc).strftime("%Y.%m.%d"),
            "dataset": os.path.basename(DATA_PATH),
            "n_patients": int(len(cohort)),
            "n_events": int(cohort.event.sum()),
            "follow_up_months": FOLLOW_UP_MONTHS,
            "c_index_holdout": round(c_test, 3),
            "c_index_train": round(c_train, 3),
            "validation": "Internal: random 25% hold-out (no external validation)",
            "calibration": calibration,
            "hazard_ratios": [
                {"feature": f, "hr": round(float(summary.loc[f, "exp(coef)"]), 3),
                 "lower": round(float(summary.loc[f, "exp(coef) lower 95%"]), 3),
                 "upper": round(float(summary.loc[f, "exp(coef) upper 95%"]), 3),
                 "p": float(summary.loc[f, "p"])}
                for f in FEATURE_COLUMNS
            ],
        },
    }
    os.makedirs(os.path.dirname(MODEL_PATH), exist_ok=True)
    with open(MODEL_PATH, "w", encoding="utf-8") as f:
        json.dump(spec, f, separators=(",", ":"))
    print(f"Exported {MODEL_PATH} ({os.path.getsize(MODEL_PATH) / 1024:.0f} KB)")


if __name__ == "__main__":
    main()
