try:
    import pandas as pd
    import numpy as np
    import xgboost as xgb
    from imblearn.over_sampling import SMOTE
    from sklearn.model_selection import train_test_split
    from sklearn.preprocessing import StandardScaler
    import joblib
    ML_AVAILABLE = True
except ImportError as e:
    print(f"Warning: ML libraries not installed. {e}")
    ML_AVAILABLE = False

class MultiModalFusionModel:
    def __init__(self):
        if ML_AVAILABLE:
            self.classifier = xgb.XGBClassifier(
                n_estimators=200, 
                max_depth=5, 
                learning_rate=0.05, 
                use_label_encoder=False, 
                eval_metric='logloss'
            )
            self.scaler = StandardScaler()
        else:
            self.classifier = None
            self.scaler = None
        self.feature_columns = []

    def train_pipeline(self, tabular_df, target_col: str):
        if not ML_AVAILABLE:
            print("ML_AVAILABLE is False. Skipping train_pipeline.")
            return

        X = tabular_df.drop(columns=[target_col])
        y = tabular_df[target_col]
        self.feature_columns = list(X.columns)

        X_scaled = self.scaler.fit_transform(X)
        X_train, X_test, y_train, y_test = train_test_split(X_scaled, y, test_size=0.2, random_state=42, stratify=y)

        smote = SMOTE(random_state=42)
        X_train_balanced, y_train_balanced = smote.fit_resample(X_train, y_train)

        self.classifier.fit(X_train_balanced, y_train_balanced)

    def predict_risk(self, master_vector) -> tuple[float, bool]:
        if not ML_AVAILABLE:
            print("ML_AVAILABLE is False. Returning mock prediction.")
            return 85.0, True

        aligned_vector = master_vector.reindex(columns=self.feature_columns, fill_value=0)
        scaled_vector = self.scaler.transform(aligned_vector)
        probability = self.classifier.predict_proba(scaled_vector)[0][1] * 100.0
        
        is_high_risk = probability >= 50.0
        return probability, is_high_risk

    def save_artifacts(self, path: str):
        if ML_AVAILABLE:
            joblib.dump(self.classifier, f"{path}/xgboost_fusion_model.pkl")
            joblib.dump(self.scaler, f"{path}/fusion_scaler.pkl")
            joblib.dump(self.feature_columns, f"{path}/fusion_columns.pkl")
        
    def load_artifacts(self, path: str):
        if ML_AVAILABLE:
            self.classifier = joblib.load(f"{path}/xgboost_fusion_model.pkl")
            self.scaler = joblib.load(f"{path}/fusion_scaler.pkl")
            self.feature_columns = joblib.load(f"{path}/fusion_columns.pkl")
