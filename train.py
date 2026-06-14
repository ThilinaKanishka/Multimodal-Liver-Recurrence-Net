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

# Dataset එක Load කිරීම
df = pd.read_csv('data/liver_cancer_recurrence_dataset (2).csv')

# Predict කරන්න අවශ්‍ය නැති ID සහ Target columns අයින් කිරීම
drop_cols = ['patient_id', 'recurrence_within_2yr', 'time_to_recurrence_months', 'recurrence_probability']
X_raw = df.drop(columns=drop_cols)
y_raw = df['recurrence_within_2yr'].values

# Categorical text columns (String දත්ත) Auto-encode කිරීම
X_encoded = pd.get_dummies(X_raw)

# React App එකෙන් දත්ත එවද්දී columns මාරු නොවෙන්න මේ පිළිවෙල සේව් කරගන්නවා
feature_columns = list(X_encoded.columns)
joblib.dump(feature_columns, 'processed_feature_names.pkl')

# Train සහ Test වලට බෙදීම (80% / 20%)
X_train, X_test, y_train, y_test = train_test_split(
    X_encoded, y_raw, test_size=0.2, random_state=42, stratify=y_raw
)

# Real-world Feature Scaling (දත්ත එකම පරාසයකට ගැනීම)
scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled = scaler.transform(X_test)

# Scaler එක සේව් කරගන්නවා (React එකෙන් දත්ත එවපුවම scale කරන්න මේක ඕන වෙනවා)
joblib.dump(scaler, 'input_scaler.pkl')

# Imbalanced Data සඳහා Class Weights සෑදීම
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

# Batch size 64 බැගින් Shuffle කරමින් Model එකට දත්ත යැවීම
train_loader = DataLoader(train_dataset, batch_size=64, shuffle=True)
test_loader = DataLoader(test_dataset, batch_size=64, shuffle=False)

# ==========================================
# 3. ADVANCED DEEP LEARNING ARCHITECTURE
# ==========================================
class AdvancedLiverMultimodalNN(nn.Module):
    def __init__(self, input_dim):
        super(AdvancedLiverMultimodalNN, self).__init__()
        
        # Multi-Layer Perceptron Network එකක් (Fully Connected Layers)
        self.network = nn.Sequential(
            nn.Linear(input_dim, 256),
            nn.BatchNorm1d(256),  # Real-world training ස්ථාවර කරන්න බ්‍රේක් එකක්
            nn.ReLU(),
            nn.Dropout(0.4),      # Overfitting වැළැක්වීමට 40% ක් Neurons randomly නිවනවා
            
            nn.Linear(256, 128),
            nn.BatchNorm1d(128),
            nn.ReLU(),
            nn.Dropout(0.3),
            
            nn.Linear(128, 64),
            nn.ReLU(),
            
            nn.Linear(64, 1),     # Final Output Layer
            nn.Sigmoid()          # Output එක 0 සහ 1 අතර Probability එකක් කරන්න
        )
        
    def forward(self, x):
        return self.network(x)

# Model එක Initialize කිරීම (Input Dimension එක dynamic වෙනවා columns ගණන අනුව)
input_features_count = X_train_scaled.shape[1]
device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
model = AdvancedLiverMultimodalNN(input_features_count).to(device)

print(f"🤖 Model එක සාර්ථකව ගොඩනැගුවා. Training වෙන්නේ: [{device}] එකෙන්.")

# Optimization & Loss Functions
criterion = nn.BCEWithLogitsLoss(pos_weight=pos_weight.to(device)) # Imbalanced data වලට හොඳම loss එක
optimizer = optim.AdamW(model.parameters(), lr=0.001, weight_decay=1e-4)

# ==========================================
# 4. PRODUCTION TRAINING LOOP (EPOCHS)
# ==========================================
epochs = 50
print("🚀 Training එක ආරම්භ වුණා...")

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
    
    # හැම Epoch 10කටම සැරයක් Accuracy එක check කරලා බලනවා
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
        print(f"Epoch [{epoch+1}/{epochs}] -> Loss: {epoch_loss:.4f} | Testing Accuracy: {accuracy:.2f}%")

# ==========================================
# 5. PRODUCTION MODEL EXPORT
# ==========================================
# React / Backend API එකට පාවිච්චි කරන්න Model Weights ටික Save කිරීම
torch.save(model.state_dict(), 'advanced_liver_model_weights.pth')
print("\n✅ True Real-World Deep Learning Model එක 'advanced_liver_model_weights.pth' නමින් සාර්ථකව Save වුණා!")