import joblib, torch, sys
import pandas as pd
import numpy as np
sys.path.append('backend')
from main import model, scaler, feature_columns

raw_data = {
    'tumor_size_cm': 15.0, 'tumor_number': 3, 'tumor_density_hu': 40, 
    'tumor_shape_irregularity': 0.8, 'tumor_texture_entropy': 4.5, 
    'margin_definition': 'ill-defined', 'enhancement_pattern': 'arterial', 
    'afp_ngml': 400, 'alp_iul': 200, 'alt_iul': 150, 'ast_iul': 150, 
    'bilirubin_mgdl': 3.5, 'albumin_gdl': 2.5, 'platelet_k_ul': 100, 
    'child_pugh_score': 'C', 'bclc_stage': 'C', 'cirrhosis_present': True, 
    'hepatitis_b': True, 'hepatitis_c': False, 'mvi_pathology': True
}

df_input = pd.DataFrame([raw_data])
df_encoded = pd.get_dummies(df_input)

df_aligned = pd.DataFrame(columns=feature_columns)
df_aligned.loc[0] = scaler.mean_

for c in df_encoded.columns:
    if c in df_aligned.columns:
        df_aligned.at[0, c] = df_encoded.at[0, c]

X_scaled = scaler.transform(df_aligned)
tensor_input = torch.tensor(X_scaled, dtype=torch.float32)
prob = model(tensor_input).item() * 100
print('Prob with mean imputation:', prob)
