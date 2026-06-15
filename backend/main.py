import json
import torch
import torch.nn as nn
from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Literal, List
from PIL import Image
import io
import torchvision.transforms as transforms

app = FastAPI(
    title="Advanced Multimodal Cancer Predictor API",
    description="FastAPI backend utilizing PyTorch for 2-Year Liver Cancer Recurrence Risk Prediction",
    version="1.0.0"
)

# ==========================================
# 1. CORS CONFIGURATION (IMPORTANT FOR REACT INTERACTION)
# ==========================================
# React එක දුවන්නේ වෙනම Port එකක (5173) නිසා, Back-end එකට ඩේටා එවන්න අවසර දෙන්න ඕනේ.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Production වලදී මෙතනට React URL එක විතරක් දාන්න (e.g., ["http://localhost:5173"])
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==========================================
# 2. PYDANTIC SCHEMAS FOR DATA VALIDATION
# ==========================================
class DiagnosticInputSchema(BaseModel):
    tumor_size_cm: float = Field(..., description="Size of tumor in centimeters")
    tumor_number: int
    tumor_density_hu: float
    tumor_shape_irregularity: float
    tumor_texture_entropy: float
    margin_definition: Literal["well-defined", "ill-defined"]
    enhancement_pattern: Literal["arterial", "washout", "delayed"]
    afp_ngml: float
    alp_iul: float
    alt_iul: float
    ast_iul: float
    bilirubin_mgdl: float
    albumin_gdl: float
    platelet_k_ul: float
    child_pugh_score: Literal["A", "B", "C"]
    bclc_stage: Literal["0", "A", "B", "C", "D"]
    cirrhosis_present: bool
    hepatitis_b: bool
    hepatitis_c: bool
    mvi_pathology: bool
    clinical_text_report: str

# ==========================================
# 3. DUMMY NEURAL NETWORK FOR LOADING WEIGHTS
# ==========================================
# ඔයාගේ ඇත්තම PyTorch Architecture එක මෙතනට එන්න ඕනේ මචං.
class MultimodalPredictionModel(nn.Module):
    def __init__(self):
        super(MultimodalPredictionModel, self).__init__()
        # Tabular features (20) + Image features (දැනට Dummy layer එකක්)
        self.fc = nn.Linear(20, 2) 
        
    def forward(self, tab_data):
        return self.fc(tab_data)

# Model Instance එකක් හදාගමු
model = MultimodalPredictionModel()

# 💡 උඹේ ළඟ .pth ෆයිල් එක තියෙනවා නම් මේ කෝඩ් එක uncomment කරලා path එක දීපන්:
# try:
#     model.load_state_dict(torch.load("path_to_your_model/advanced_liver_model_weights.pth", map_strategy=torch.device('cpu')))
#     model.eval()
#     print("✅ PyTorch Model Weights Loaded Successfully!")
# except Exception as e:
#     print(f"⚠️ Model weight load error: {e}. Running on initialized weights.")
model.eval()

# Image Preprocessing Transform Pipeline (For CT Scans)
ct_transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
])

# ==========================================
# 4. API ENDPOINTS (THE PREDICT ROUTE)
# ==========================================
@app.get("/")
def read_root():
    return {"status": "online", "message": "Cancer Predictor Deep Learning API is running."}

@app.post("/api/v1/predict")
async def predict_recurrence(
    clinical_data: str = Form(..., description="JSON stringified DiagnosticInputSchema objects"),
    ct_scan: UploadFile = File(None)
):
    try:
        # 1. Parse and validate the stringified JSON from React Form Data
        data_dict = json.loads(clinical_data)
        validated_data = DiagnosticInputSchema(**data_dict)
        
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid JSON format in clinical_data form-field.")
    except Exception as err:
        raise HTTPException(status_code=420, detail=f"Validation Error: {str(err)}")

    # 2. Process Image (CT Scan) if uploaded
    if ct_scan:
        try:
            image_bytes = await ct_scan.read()
            image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
            image_tensor = ct_transform(image).unsqueeze(0) # Model එකට දාන්න Tensor එකක් කරනවා
            print(f"📷 Image processed successfully. Tensor Shape: {image_tensor.shape}")
        except Exception as img_err:
            raise HTTPException(status_code=400, detail=f"Invalid Image file or processing error: {str(img_err)}")
    
    # 3. AI Prediction Logic (PyTorch Inference Area)
    with torch.no_grad():
        # [Production Note]: මෙතනදී ඔයාValidated Data ටිකයි Image Tensor එකයි Model එකට Pass කරන්න ඕනේ.
        # දැනට අපි Dataset Indicators මත පදනම්ව නිවැරදි Inference Flow එකක් Mock කරමු:
        
        # Risk Indicators based on clinical research data
        is_high_risk = (
            validated_data.tumor_size_cm > 5.0 or 
            validated_data.mvi_pathology is True or 
            validated_data.bclc_stage in ["C", "D"]
        )
        
        if is_high_risk:
            recurrence_risk = "HIGH"
            probability = round(78.4 + (validated_data.tumor_size_cm * 1.2), 2)
            if probability > 99.0: probability = 99.0
            
            ai_insights = [
                f"Radiomics Module: Significant irregular tumor geometry identified ({validated_data.tumor_size_cm}cm).",
                "Pathology Module: Microvascular Invasion (MVI) indicates high structural vascular permeation.",
                f"Clinical Staging: BCLC Stage {validated_data.bclc_stage} correlates historically with shortened recurrence intervals."
            ]
        else:
            recurrence_risk = "LOW"
            probability = round(15.2 + (validated_data.tumor_size_cm * 0.5), 2)
            ai_insights = [
                "Radiomics Module: Well-defined tumor margins present minimal capsule infiltration signs.",
                "Biochemical Module: Serum AFP and liver enzyme metrics remain within localized boundary conditions."
            ]

    # 4. Return the standard response matching our React Frontend Expected Interfaces
    return {
        "recurrence_risk": recurrence_risk,
        "probability": probability,
        "ai_insights": ai_insights
    }