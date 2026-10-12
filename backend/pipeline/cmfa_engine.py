"""
CMFA (Cross-Modal Feature Fusion with Attention) inference engine.

Loads the trained CMFA model produced by CMFA/CMFA_v3.ipynb and exposes:
  - build_input_row(): maps stored form inputs onto the 38 CMFA inputs (imputing what is missing)
  - occlusion():       per-input probability change when that input is set to the training median/mode
  - percentile():      where a patient value sits within the training cohort

Artifacts (paths relative to the repository root):
  Model/cmfa_model.pth            - trained state_dict (Cell 16 of the notebook)
  Model/cmfa_preprocessors.pkl    - fitted ColumnTransformers + feature lists
  data/liver_cancer_recurrence_dataset (2).csv - dataset; the notebook's 70/15/15
                                    split (seed 42) is reproduced to recover the
                                    training cohort used as reference values.

Tensors are moved in and out of torch via Python lists (not torch.from_numpy / .numpy())
so the engine also works where the installed torch build cannot see NumPy 2.x.
"""
import os
import warnings
from typing import Any, Dict, List, Optional, Tuple

try:
    import numpy as np
    import pandas as pd
    import joblib
    import torch
    import torch.nn as nn
    from sklearn.model_selection import train_test_split
    CMFA_LIBS_AVAILABLE = True
except ImportError as e:
    print(f"Warning: CMFA dependencies not available ({e}).")
    CMFA_LIBS_AVAILABLE = False

REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
MODEL_PATH = os.path.join(REPO_ROOT, "Model", "cmfa_model.pth")
PREPROCESSOR_PATH = os.path.join(REPO_ROOT, "Model", "cmfa_preprocessors.pkl")
DATASET_PATH = os.path.join(REPO_ROOT, "data", "liver_cancer_recurrence_dataset (2).csv")

# Hyper-parameters from the notebook's cmfa_config (Cell 16)
D_MODEL = 128
NUM_HEADS = 4
NUM_TOKENS = 4
DROPOUT = 0.20
SEED = 42
AFP_ELEVATED_THRESHOLD = 400.0  # in the dataset, afp_elevated == 1 exactly when afp_ngml > 400

# Display name and unit for each CMFA input
FEATURE_LABELS: Dict[str, Tuple[str, str]] = {
    "tumor_size_cm": ("Tumor size", "cm"),
    "tumor_number": ("Tumor count", ""),
    "tumor_shape_irregularity": ("Shape irregularity", ""),
    "tumor_texture_entropy": ("Texture entropy", ""),
    "tumor_density_hu": ("Tumor density", "HU"),
    "margin_definition": ("Margin definition", ""),
    "vascular_invasion_imaging": ("Vascular invasion (imaging)", ""),
    "satellite_nodules": ("Satellite nodules", ""),
    "peritumoral_edema": ("Peritumoral edema", ""),
    "liver_volume_ml": ("Liver volume", "mL"),
    "tumor_liver_volume_ratio": ("Tumor/liver volume ratio", ""),
    "enhancement_pattern": ("Enhancement pattern", ""),
    "radiomics_shape_sphericity": ("Sphericity (radiomics)", ""),
    "radiomics_glcm_contrast": ("GLCM contrast (radiomics)", ""),
    "image_feature_vector_norm": ("Image feature vector norm", ""),
    "afp_ngml": ("AFP", "ng/mL"),
    "afp_elevated": ("AFP > 400", ""),
    "alp_iul": ("ALP", "IU/L"),
    "alt_iul": ("ALT", "IU/L"),
    "ast_iul": ("AST", "IU/L"),
    "bilirubin_mgdl": ("Bilirubin", "mg/dL"),
    "albumin_gdl": ("Albumin", "g/dL"),
    "creatinine_mgdl": ("Creatinine", "mg/dL"),
    "platelet_k_ul": ("Platelets", "k/uL"),
    "prothrombin_time_s": ("Prothrombin time", "s"),
    "child_pugh_score": ("Child-Pugh score", ""),
    "meld_score": ("MELD score", ""),
    "bclc_stage": ("BCLC stage", ""),
    "cirrhosis_present": ("Cirrhosis", ""),
    "hepatitis_b": ("Hepatitis B", ""),
    "hepatitis_c": ("Hepatitis C", ""),
    "alcohol_related": ("Alcohol-related", ""),
    "prior_tace": ("Prior TACE", ""),
    "prior_ablation": ("Prior ablation", ""),
    "mvi_pathology": ("MVI (pathology)", ""),
    "ner_vascular_invasion_text": ("Vascular invasion (report text)", ""),
    "ner_cirrhosis_mention": ("Cirrhosis mention (report text)", ""),
    "text_embedding_risk_score": ("Report text risk score", ""),
}

if CMFA_LIBS_AVAILABLE:
    class CMFA(nn.Module):
        """Identical to the CMFA class in CMFA/CMFA_v3.ipynb (Cell 7)."""

        def __init__(self, image_dim, text_dim, d_model=128, num_heads=4, num_tokens=4, dropout=0.20):
            super().__init__()
            self.num_tokens = num_tokens
            self.d_model = d_model

            self.image_projection = nn.Sequential(
                nn.Linear(image_dim, d_model * num_tokens),
                nn.LayerNorm(d_model * num_tokens),
                nn.GELU(),
                nn.Dropout(dropout)
            )
            self.text_projection = nn.Sequential(
                nn.Linear(text_dim, d_model * num_tokens),
                nn.LayerNorm(d_model * num_tokens),
                nn.GELU(),
                nn.Dropout(dropout)
            )
            self.image_to_text = nn.MultiheadAttention(
                embed_dim=d_model, num_heads=num_heads,
                dropout=dropout, batch_first=True
            )
            self.text_to_image = nn.MultiheadAttention(
                embed_dim=d_model, num_heads=num_heads,
                dropout=dropout, batch_first=True
            )
            self.image_norm = nn.LayerNorm(d_model)
            self.text_norm = nn.LayerNorm(d_model)
            self.fusion = nn.Sequential(
                nn.Linear(d_model * 2, d_model),
                nn.LayerNorm(d_model),
                nn.GELU(),
                nn.Dropout(dropout)
            )
            self.classifier = nn.Sequential(
                nn.Linear(d_model, 64),
                nn.GELU(),
                nn.Dropout(dropout),
                nn.Linear(64, 1)
            )

        def forward(self, image_x, text_x, return_attention=False):
            b = image_x.size(0)
            img = self.image_projection(image_x).view(b, self.num_tokens, self.d_model)
            txt = self.text_projection(text_x).view(b, self.num_tokens, self.d_model)

            img_attended, attn_i2t = self.image_to_text(query=img, key=txt, value=txt, need_weights=True)
            txt_attended, attn_t2i = self.text_to_image(query=txt, key=img, value=img, need_weights=True)

            img = self.image_norm(img + img_attended)
            txt = self.text_norm(txt + txt_attended)

            fused = self.fusion(torch.cat([img.mean(dim=1), txt.mean(dim=1)], dim=1))
            logits = self.classifier(fused)

            if return_attention:
                return logits, fused, attn_i2t, attn_t2i
            return logits, fused


def _is_missing(v: Any) -> bool:
    if v is None:
        return True
    if isinstance(v, str) and v.strip().lower() in ("", "--", "n/a", "na", "none", "null", "unknown", "nan"):
        return True
    try:
        return bool(pd.isna(v))
    except Exception:
        return False


def _to_number(v: Any) -> Optional[float]:
    if _is_missing(v):
        return None
    if isinstance(v, bool):
        return 1.0 if v else 0.0
    if isinstance(v, str):
        s = v.strip().lower()
        if s in ("true", "yes", "positive", "present", "detected"):
            return 1.0
        if s in ("false", "no", "negative", "absent", "not detected"):
            return 0.0
    try:
        return float(v)
    except (TypeError, ValueError):
        return None


class CMFAEngine:
    def __init__(self):
        self.available = False
        self.reason = ""
        if not CMFA_LIBS_AVAILABLE:
            self.reason = "PyTorch / scikit-learn / pandas are not installed on the backend."
            return
        try:
            self._load()
            self.available = True
            print(f"✅ CMFA engine loaded (n_train={self.n_train}).")
        except Exception as e:
            self.reason = f"CMFA artifacts could not be loaded: {e}"
            print(f"Warning: {self.reason}")

    # ------------------------------------------------------------------
    # Loading
    # ------------------------------------------------------------------
    def _load(self):
        with warnings.catch_warnings():
            warnings.simplefilter("ignore")
            bundle = joblib.load(PREPROCESSOR_PATH)
            state_dict = torch.load(MODEL_PATH, map_location="cpu", weights_only=True)

        self.image_preprocessor = bundle["image_preprocessor"]
        self.text_preprocessor = bundle["text_preprocessor"]
        self.image_features: List[str] = list(bundle["image_features"])
        self.clinical_features: List[str] = list(bundle["clinical_text_features"])
        self.target = bundle["target"]
        self.all_features = self.image_features + self.clinical_features

        self.categorical_features = set()
        for pre in (self.image_preprocessor, self.text_preprocessor):
            for name, _, cols in pre.transformers_:
                if name == "cat":
                    self.categorical_features.update(cols)

        image_dim = state_dict["image_projection.0.weight"].shape[1]
        text_dim = state_dict["text_projection.0.weight"].shape[1]
        self.model = CMFA(image_dim, text_dim, D_MODEL, NUM_HEADS, NUM_TOKENS, DROPOUT)
        self.model.load_state_dict(state_dict, strict=True)
        self.model.eval()

        # Reproduce the notebook split (Cell 4) to recover the training cohort.
        df = pd.read_csv(DATASET_PATH)
        train_df, _ = train_test_split(df, test_size=0.30, random_state=SEED, stratify=df[self.target])
        self.train_df = train_df.reset_index(drop=True)
        self.n_train = len(train_df)

        # Reference value per input: median for numeric, mode for categorical (training cohort)
        self.reference: Dict[str, Any] = {}
        for c in self.all_features:
            if c in self.categorical_features:
                self.reference[c] = train_df[c].mode().iloc[0]
            else:
                self.reference[c] = float(train_df[c].median())
        self.category_levels = {c: sorted(train_df[c].astype(str).unique().tolist()) for c in self.categorical_features}
        self.binary_features = {
            c for c in self.all_features
            if c not in self.categorical_features and set(train_df[c].dropna().unique()).issubset({0, 1})
        }

        # Cohort mean |occlusion effect| per input (reference for the patient's occlusion values)
        base_train = self._probabilities(train_df)
        self.cohort_mean_abs_occlusion: Dict[str, float] = {}
        for c in self.all_features:
            occluded = train_df.copy()
            occluded[c] = self.reference[c]
            p = self._probabilities(occluded)
            self.cohort_mean_abs_occlusion[c] = float(np.mean(np.abs(np.array(base_train) - np.array(p))))

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------
    @staticmethod
    def _transform(preprocessor, frame) -> "torch.Tensor":
        arr = preprocessor.transform(frame)
        return torch.tensor(arr.tolist(), dtype=torch.float32)

    def _tensors(self, frame) -> Tuple["torch.Tensor", "torch.Tensor"]:
        return (self._transform(self.image_preprocessor, frame[self.image_features]),
                self._transform(self.text_preprocessor, frame[self.clinical_features]))

    def _forward(self, img_t, txt_t):
        with torch.no_grad():
            return self.model(img_t, txt_t, return_attention=True)

    def _probabilities(self, frame) -> List[float]:
        img_t, txt_t = self._tensors(frame)
        logits = self._forward(img_t, txt_t)[0]
        return torch.sigmoid(logits).squeeze(1).tolist()

    def _map_categorical(self, col: str, raw: Any) -> Tuple[Optional[str], Optional[str]]:
        """Returns (dataset level, note). note is set when the value had to be mapped."""
        if _is_missing(raw):
            return None, None
        levels = self.category_levels[col]
        s = str(raw).strip()
        if s in levels:
            return s, None
        low = s.lower()
        for lvl in levels:
            if low == lvl.lower():
                return lvl, None
        if col == "enhancement_pattern":
            for key, lvl in (("aphe", "arterial"), ("arterial", "arterial"), ("washout", "washout"),
                             ("portal", "portal"), ("delayed", "delayed")):
                if key in low and lvl in levels:
                    return lvl, f"'{s}' mapped to dataset level '{lvl}'"
        if col == "child_pugh_score" and low in ("a", "b", "c"):
            cls_levels = [l for l in levels if l.lower().startswith(low)]
            if cls_levels:
                lvl = self.train_df[self.train_df[col].isin(cls_levels)][col].mode().iloc[0]
                return lvl, f"class '{s}' given without a score; mapped to the most common class-{s.upper()} score in training ('{lvl}')"
        return None, None

    def build_input_row(self, clinical_inputs: Dict[str, Any]):
        """Converts stored form inputs into a one-row DataFrame of the 38 CMFA inputs."""
        row: Dict[str, Any] = {}
        provenance: Dict[str, str] = {}
        notes: Dict[str, str] = {}
        for c in self.all_features:
            raw = clinical_inputs.get(c)
            if c in self.categorical_features:
                val, note = self._map_categorical(c, raw)
                if val is not None:
                    row[c] = val
                    provenance[c] = "mapped" if note else "patient"
                    if note:
                        notes[c] = note
                    continue
            else:
                val = _to_number(raw)
                if c == "afp_elevated" and val is None:
                    afp = _to_number(clinical_inputs.get("afp_ngml"))
                    if afp is not None:
                        row[c] = 1.0 if afp > AFP_ELEVATED_THRESHOLD else 0.0
                        provenance[c] = "derived"
                        notes[c] = f"derived from AFP > {AFP_ELEVATED_THRESHOLD:g} ng/mL"
                        continue
                if val is not None:
                    row[c] = val
                    provenance[c] = "patient"
                    continue
            row[c] = self.reference[c]
            provenance[c] = "imputed"
        return pd.DataFrame([row], columns=self.all_features), provenance, notes

    def format_value(self, col: str, value: Any) -> str:
        if col in self.categorical_features:
            return str(value)
        v = _to_number(value)
        if v is None:
            return "—"
        if col in self.binary_features:
            return "Yes" if v >= 0.5 else "No"
        unit = FEATURE_LABELS.get(col, (col, ""))[1]
        text = f"{v:g}" if float(v).is_integer() else f"{v:.2f}"
        return f"{text} {unit}".strip()

    def format_reference(self, col: str) -> str:
        if col in self.binary_features:
            return f"{self.train_df[col].mean() * 100:.0f}% yes"
        if col in self.categorical_features:
            return f"{self.reference[col]} (mode)"
        return f"{self.format_value(col, self.reference[col])} (median)"

    def percentile(self, col: str, value: Any) -> Optional[float]:
        if col in self.categorical_features or col in self.binary_features:
            return None
        v = _to_number(value)
        if v is None:
            return None
        series = self.train_df[col]
        return float((series < v).mean() * 100.0 + (series == v).mean() * 50.0)

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------
    def occlusion(self, row) -> Dict[str, float]:
        """Probability(all inputs) - probability(input set to training median/mode), for each input."""
        base = self._probabilities(row)[0]
        batch = pd.concat([row] * len(self.all_features), ignore_index=True)
        for i, c in enumerate(self.all_features):
            batch.at[i, c] = self.reference[c]
        probs = self._probabilities(batch)
        return {c: float(base - probs[i]) for i, c in enumerate(self.all_features)}
