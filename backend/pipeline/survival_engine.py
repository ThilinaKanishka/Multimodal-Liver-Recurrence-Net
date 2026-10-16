"""
Recurrence-free survival (RFS) engine.

Serves a Cox proportional-hazards model exported by
risk_modeling/04_survival_cox_model.py as plain JSON (coefficients, baseline
cumulative hazard and bootstrap replicates), so inference needs only numpy.

Outputs follow how clinical risk calculators report time-to-event risk:
RFS probability at fixed horizons with 95% CIs, median RFS (or "not reached"),
risk group against cohort Kaplan-Meier curves, and relative hazard vs. the
average cohort patient.
"""
import json
import math
import os

import numpy as np

MODEL_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "models", "recurrence_cox_model.json")
MILESTONE_MONTHS = (12, 24, 36, 60)

# Encoded model features: (name, label, raw input field)
CONTINUOUS = [
    ("tumor_size_cm", "Tumor size", "tumor_size_cm"),
    ("tumor_number", "Tumor count", "tumor_number"),
    ("log10_afp", "AFP", "afp_ngml"),
    ("alp_iul", "ALP", "alp_iul"),
    ("log10_bilirubin", "Bilirubin", "bilirubin_mgdl"),
    ("albumin_gdl", "Albumin", "albumin_gdl"),
    ("platelet_k_ul", "Platelets", "platelet_k_ul"),
    ("tumor_density_hu", "Tumor density", "tumor_density_hu"),
    ("tumor_shape_irregularity", "Shape irregularity", "tumor_shape_irregularity"),
    ("tumor_texture_entropy", "Texture entropy", "tumor_texture_entropy"),
]
BINARY = [
    ("mvi", "Microvascular invasion", "mvi_pathology"),
    ("cirrhosis", "Cirrhosis", "cirrhosis_present"),
    ("hepatitis_b", "Hepatitis B", "hepatitis_b"),
    ("hepatitis_c", "Hepatitis C", "hepatitis_c"),
]
# Categorical inputs as dummy groups: (group, label, raw field, reference level, levels)
CATEGORICAL = [
    ("child_pugh", "Child-Pugh class", "child_pugh_score", "A", ["B", "C"]),
    ("bclc", "BCLC stage", "bclc_stage", "A", ["0", "B", "C", "D"]),
    ("margin", "Tumor margin", "margin_definition", "well", ["ill", "irregular"]),
    ("enhancement", "Enhancement pattern", "enhancement_pattern", "arterial", ["washout", "portal", "delayed"]),
]

FEATURE_COLUMNS = (
    [c[0] for c in CONTINUOUS]
    + [b[0] for b in BINARY]
    + [f"{g[0]}_{lvl}" for g in CATEGORICAL for lvl in g[4]]
)
# Encoded column -> (group name, label, raw field) used to aggregate explanations
FEATURE_GROUPS = {c[0]: (c[0], c[1], c[2]) for c in CONTINUOUS + BINARY}
FEATURE_GROUPS.update({f"{g[0]}_{lvl}": (g[0], g[1], g[2]) for g in CATEGORICAL for lvl in g[4]})


def _num(value):
    try:
        x = float(value)
    except (TypeError, ValueError):
        return None
    return x if math.isfinite(x) else None


def _flag(value):
    if isinstance(value, bool):
        return float(value)
    if isinstance(value, (int, float)):
        return float(value != 0) if math.isfinite(value) else None
    text = str(value or "").strip().lower()
    if text in {"1", "true", "yes", "y", "present", "positive", "detected"}:
        return 1.0
    if text in {"0", "false", "no", "n", "absent", "negative", "not detected"}:
        return 0.0
    return None


def _level(group, value):
    """Map a raw categorical value (dataset or UI wording) to a model level, or None if unknown."""
    text = str(value or "").strip().lower()
    if not text or text in {"--", "unknown", "n/a", "none"}:
        return None
    if group == "child_pugh":
        letter = text[0].upper()
        return letter if letter in {"A", "B", "C"} else None
    if group == "bclc":
        letter = text.replace("bclc", "").strip(" -_:").upper()[:1]
        return letter if letter in {"0", "A", "B", "C", "D"} else None
    if group == "margin":
        if "ill" in text:
            return "ill"
        if "irregular" in text:
            return "irregular"
        return "well" if "well" in text else None
    if group == "enhancement":
        for key, level in (("washout", "washout"), ("portal", "portal"), ("delay", "delayed"), ("arterial", "arterial"), ("aphe", "arterial")):
            if key in text:
                return level
        return None
    return None


def encode_raw(raw: dict) -> dict:
    """Encode raw clinical inputs into model features. Missing or unparseable inputs become None."""
    out = {}
    for name, _, field in CONTINUOUS:
        x = _num(raw.get(field))
        if name.startswith("log10_"):
            x = math.log10(x) if x is not None and x > 0 else None
        out[name] = x
    for name, _, field in BINARY:
        out[name] = _flag(raw.get(field))
    for group, _, field, _, levels in CATEGORICAL:
        level = _level(group, raw.get(field))
        for lvl in levels:
            out[f"{group}_{lvl}"] = None if level is None else float(level == lvl)
    return out


def _display_value(field, raw):
    value = raw.get(field)
    return None if value is None or str(value).strip() in {"", "--"} else value


class RecurrenceSurvivalModel:
    def __init__(self, spec: dict):
        self.spec = spec
        self.columns = spec["feature_columns"]
        self.beta = np.array(spec["coefficients"], dtype=float)
        self.means = np.array(spec["feature_means"], dtype=float)
        self.months = np.array(spec["time_grid_months"], dtype=float)
        self.h0 = np.array(spec["baseline_cumulative_hazard"], dtype=float)
        boot = spec["bootstrap"]
        self.boot_beta = np.array(boot["coefficients"], dtype=float)
        self.boot_means = np.array(boot["feature_means"], dtype=float)
        self.boot_h0 = np.array(boot["baseline_cumulative_hazard"], dtype=float)

    @classmethod
    def load(cls, path: str = MODEL_PATH) -> "RecurrenceSurvivalModel":
        with open(path, encoding="utf-8") as f:
            return cls(json.load(f))

    def _vector(self, raw: dict):
        encoded = encode_raw(raw)
        x = np.array([encoded[c] if encoded[c] is not None else np.nan for c in self.columns], dtype=float)
        missing = np.isnan(x)
        # A missing input is set to the cohort mean, so it neither raises nor lowers the estimate
        x[missing] = self.means[missing]
        imputed = sorted({FEATURE_GROUPS[c][1] for c, m in zip(self.columns, missing) if m})
        return x, imputed

    @staticmethod
    def _median(months, curve):
        below = np.nonzero(curve <= 0.5)[0]
        return float(months[below[0]]) if below.size else None

    def predict(self, raw: dict) -> dict:
        x, imputed = self._vector(raw)
        lp = float((x - self.means) @ self.beta)
        surv = np.exp(-self.h0 * math.exp(lp))

        boot_lp = np.einsum("bj,bj->b", x[None, :] - self.boot_means, self.boot_beta)
        boot_surv = np.exp(-self.boot_h0 * np.exp(boot_lp)[:, None])
        lower, upper = np.percentile(boot_surv, [2.5, 97.5], axis=0)

        def at(month):
            i = int(np.searchsorted(self.months, month, side="right") - 1)
            return {"months": month, "rfs": round(float(surv[i]) * 100, 1),
                    "lower": round(float(lower[i]) * 100, 1), "upper": round(float(upper[i]) * 100, 1)}

        boot_medians = [self._median(self.months, s) for s in boot_surv]
        reached = [m for m in boot_medians if m is not None]
        median = self._median(self.months, surv)
        median_rfs = {
            "months": median,
            # Upper bound is open when most bootstrap curves never fall below 50%
            "lower": float(np.percentile(reached, 2.5)) if reached else None,
            "upper": float(np.percentile(reached, 97.5)) if len(reached) >= 0.975 * len(boot_medians) else None,
        }

        groups = self.spec["risk_groups"]
        group = "Low" if lp < groups["cutpoints"][0] else "Intermediate" if lp < groups["cutpoints"][1] else "High"

        # Per-input contribution to the log-hazard, categorical dummies summed per input
        contrib = {}
        for c, value in zip(self.columns, (x - self.means) * self.beta):
            name, label, field = FEATURE_GROUPS[c]
            item = contrib.setdefault(name, {"feature": name, "label": label, "value": _display_value(field, raw), "log_hazard": 0.0})
            item["log_hazard"] += float(value)
        contributors = sorted(contrib.values(), key=lambda d: abs(d["log_hazard"]), reverse=True)
        for item in contributors:
            item["hazard_multiplier"] = round(math.exp(item["log_hazard"]), 3)
            item["log_hazard"] = round(item["log_hazard"], 4)

        return {
            "available": True,
            "curve": [
                {"month": float(m), "rfs": round(float(s) * 100, 2), "lower": round(float(lo) * 100, 2), "upper": round(float(up) * 100, 2)}
                for m, s, lo, up in zip(self.months, surv, lower, upper)
            ],
            "milestones": [at(m) for m in MILESTONE_MONTHS],
            "median_rfs": median_rfs,
            "relative_hazard": {
                "value": round(math.exp(lp), 2),
                "lower": round(float(np.exp(np.percentile(boot_lp, 2.5))), 2),
                "upper": round(float(np.exp(np.percentile(boot_lp, 97.5))), 2),
            },
            "risk_group": {"label": group, "definition": groups["definition"]},
            "cohort_curves": groups["km_curves"],
            "contributors": contributors[:6],
            "imputed_inputs": imputed,
            "model": self.spec["model_card"],
        }


_model = None


def get_model():
    """Lazy-load the exported model; returns None if it has not been trained/exported yet."""
    global _model
    if _model is None and os.path.exists(MODEL_PATH):
        _model = RecurrenceSurvivalModel.load()
    return _model


def predict_recurrence_outlook(raw: dict):
    model = get_model()
    return model.predict(raw) if model is not None else None
