import json
from fastapi import FastAPI, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from pipeline.inference import MultimodalInferencePipeline
import PyPDF2
import io
import os

app = FastAPI(
    title="Advanced Multimodal Cancer Predictor API",
    description="Production-Grade FastAPI backend utilizing PyRadiomics, SciSpacy and Multimodal Fusion for Recurrence Risk",
    version="2.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize the End-to-End Pipeline
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
pipeline = MultimodalInferencePipeline(model_dir=os.path.join(os.path.dirname(BASE_DIR), "models"))

@app.get("/")
def read_root():
    return {"status": "online", "message": "Cancer Predictor Deep Learning API is running."}

@app.post("/api/v1/predict")
async def predict_recurrence(
    clinical_data: str = Form(...),
    ct_scan: UploadFile = File(None),
    text_report_pdf: UploadFile = File(None)
):
    # Parse incoming tabular JSON dynamically (Flexible validation)
    try:
        raw_tabular = json.loads(clinical_data)
    except Exception as e:
        print(f"Error parsing JSON: {e}")
        raw_tabular = {}
    
    # Read DICOM Image Bytes
    dicom_bytes = None
    if ct_scan and ct_scan.filename:
        try:
            dicom_bytes = await ct_scan.read()
        except Exception as e:
            print(f"Error reading image: {e}")
        
    # Read and Extract text from PDF
    clinical_text = raw_tabular.get("clinical_text_report", "")
    if text_report_pdf and text_report_pdf.filename:
        try:
            pdf_bytes = await text_report_pdf.read()
            reader = PyPDF2.PdfReader(io.BytesIO(pdf_bytes))
            extracted_text = []
            for page in reader.pages:
                text = page.extract_text()
                if text:
                    extracted_text.append(text)
            clinical_text += "\n" + "\n".join(extracted_text)
        except Exception as e:
            print(f"Error reading PDF: {e}")

    # Execute Full Master Pipeline
    result = pipeline.execute_pipeline(
        tabular_data=raw_tabular,
        dicom_bytes=dicom_bytes,
        clinical_text=clinical_text.strip()
    )
    
    return result