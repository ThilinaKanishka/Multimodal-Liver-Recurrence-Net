import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import Dataset, DataLoader
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
import joblib

# ==========================================
# 1. DATA PREPROCESSING (REAL-WORLD PIPELINE)
# ==========================================

# Load the dataset from the data folder
df = pd.read_csv('data/liver_cancer_recurrence_dataset (2).csv')
 
# Remove unnecessary ID and target columns from features
drop_cols = ['patient_id', 'recurrence_within_2yr', 'time_to_recurrence_months', 'recurrence_probability']
X_raw = df.drop(columns=drop_cols)
y_raw = df['recurrence_within_2yr'].values

# Auto-encode categorical text columns (One-Hot Encoding)
X_encoded = pd.get_dummies(X_raw)

# Save feature column order to prevent mismatch during inference/API requests
feature_columns = list(X_encoded.columns)
joblib.dump(feature_columns, 'processed_feature_names.pkl')

# Split dataset into training and testing sets (80% / 20%)
X_train, X_test, y_train, y_test = train_test_split(
    X_encoded, y_raw, test_size=0.2, random_state=42, stratify=y_raw
)

# Standardize features to ensure stable gradients and fast convergence
scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled = scaler.transform(X_test)

# Save the scaler object for preprocessing upcoming inference data from React/API
joblib.dump(scaler, 'input_scaler.pkl')

# Calculate class weights to handle highly imbalanced target data
num_positives = np.sum(y_train)
num_negatives = len(y_train) - num_positives
pos_weight = torch.tensor([num_negatives / num_positives], dtype=torch.float32)

# ==========================================
# 2. PYTORCH CUSTOM DATASET LOADER
# ==========================================
class LiverDataset(Dataset):
    def __init__(self, X_data, y_labels):
        self.X = torch.tensor(X_data, dtype=torch.float32)
        self.y = torch.tensor(y_labels, dtype=torch.float32).unsqueeze(1)
        
    def __len__(self):
        return len(self.X)
    
    def __getitem__(self, idx):
        return self.X[idx], self.y[idx]

train_dataset = LiverDataset(X_train_scaled, y_train)
test_dataset = LiverDataset(X_test_scaled, y_test)

# Setup DataLoaders with a batch size of 64
train_loader = DataLoader(train_dataset, batch_size=64, shuffle=True)
test_loader = DataLoader(test_dataset, batch_size=64, shuffle=False)

# ==========================================
# 3. ADVANCED DEEP LEARNING ARCHITECTURE
# ==========================================
class AdvancedLiverMultimodalNN(nn.Module):
    def __init__(self, input_dim):
        super(AdvancedLiverMultimodalNN, self).__init__()
        
        # Multi-Layer Perceptron (Fully Connected Deep Neural Network)
        self.network = nn.Sequential(
            nn.Linear(input_dim, 256),
            nn.BatchNorm1d(256),  # Batch normalization for training stability
            nn.ReLU(),
            nn.Dropout(0.4),      # Dropout to prevent overfitting by deactivating 40% of neurons
            
            nn.Linear(256, 128),
            nn.BatchNorm1d(128),
            nn.ReLU(),
            nn.Dropout(0.3),
            
            nn.Linear(128, 64),
            nn.ReLU(),
            
            nn.Linear(64, 1),     # Output layer for binary classification
            nn.Sigmoid()          # Map output to a probability score between 0 and 1
        )
        
    def forward(self, x):
        return self.network(x)

# Initialize the network structure dynamically based on total input columns
input_features_count = X_train_scaled.shape[1]
device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
model = AdvancedLiverMultimodalNN(input_features_count).to(device)

print(f"Model successfully initialized. Training on device: [{device}]")

# Define optimization and weighted loss function for managing imbalanced data
criterion = nn.BCEWithLogitsLoss(pos_weight=pos_weight.to(device))
optimizer = optim.AdamW(model.parameters(), lr=0.001, weight_decay=1e-4)

# ==========================================
# 4. PRODUCTION TRAINING LOOP (EPOCHS)
# ==========================================
epochs = 50
print("Starting model training pipeline...")

for epoch in range(epochs):
    model.train()
    running_loss = 0.0
    
    for batch_X, batch_y in train_loader:
        batch_X, batch_y = batch_X.to(device), batch_y.to(device)
        
        optimizer.zero_grad()
        outputs = model(batch_X)
        loss = criterion(outputs, batch_y)
        loss.backward()
        optimizer.step()
        
        running_loss += loss.item() * batch_X.size(0)
        
    epoch_loss = running_loss / len(train_loader.dataset)
    
    # Evaluate testing accuracy every 10 epochs and on the first epoch
    if (epoch + 1) % 10 == 0 or epoch == 0:
        model.eval()
        correct = 0
        total = 0
        with torch.no_grad():
            for batch_X, batch_y in test_loader:
                batch_X, batch_y = batch_X.to(device), batch_y.to(device)
                outputs = model(batch_X)
                predicted = (outputs > 0.5).float()
                total += batch_y.size(0)
                correct += (predicted == batch_y).sum().item()
        
        accuracy = (correct / total) * 100
        print(f"Epoch [{epoch+1}/{epochs}] -> Training Loss: {epoch_loss:.4f} | Testing Accuracy: {accuracy:.2f}%")

# ==========================================
# 5. PRODUCTION MODEL EXPORT
# ==========================================
# Export network weights for production environment deployment
torch.save(model.state_dict(), 'advanced_liver_model_weights.pth')
print("Deep learning model weights successfully exported to 'advanced_liver_model_weights.pth'")

# ==========================================
# 6. SURVIVAL TIME-TO-RECURRENCE MODEL
# ==========================================
print("Training Survival Time-to-Recurrence Model...")
try:
    from xgboost import XGBRegressor
    # Use the full scaled features and the time_to_recurrence target
    y_survival = df['time_to_recurrence_months'].values
    survival_model = XGBRegressor(n_estimators=100, max_depth=4, learning_rate=0.05, random_state=42)
    # Train on the same scaled features as PyTorch
    survival_model.fit(X_train_scaled, y_survival[y_train.index] if hasattr(y_train, 'index') else y_survival[:len(X_train_scaled)])
except Exception as e:
    print(f"Exception during targeted training, falling back to whole dataset: {e}")
    # If the index fails or something else, train on the whole dataset
    survival_model = XGBRegressor(n_estimators=100, max_depth=4, learning_rate=0.05, random_state=42)
    survival_model.fit(scaler.transform(X_encoded), df['time_to_recurrence_months'].values)

joblib.dump(survival_model, 'survival_time_model.pkl')
print("Survival model weights successfully exported to 'survival_time_model.pkl'")