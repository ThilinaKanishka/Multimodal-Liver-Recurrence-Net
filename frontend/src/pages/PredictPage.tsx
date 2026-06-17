import React, { useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import {
  Upload,
  Activity,
  AlertTriangle,
  CheckCircle,
  FileText,
} from "lucide-react";
import axios from "axios";
import MprClinicalWorkstation from "../components/MprClinicalWorkstation";

export interface DiagnosticInput {
  tumor_size_cm: number;
  tumor_number: number;
  tumor_density_hu: number;
  tumor_shape_irregularity: number;
  tumor_texture_entropy: number;
  margin_definition: "well-defined" | "ill-defined";
  enhancement_pattern: "arterial" | "washout" | "delayed";
  afp_ngml: number;
  alp_iul: number;
  alt_iul: number;
  ast_iul: number;
  bilirubin_mgdl: number;
  albumin_gdl: number;
  platelet_k_ul: number;
  child_pugh_score: "A" | "B" | "C";
  bclc_stage: "0" | "A" | "B" | "C" | "D";
  cirrhosis_present: boolean;
  hepatitis_b: boolean;
  hepatitis_c: boolean;
  mvi_pathology: boolean;
  clinical_text_report: string;
}

export interface PredictionResult {
  recurrence_risk: "HIGH" | "LOW" | "ABSTAIN";
  probability: number;
  ai_insights: string[];
  clinical_text_report?: string;
  ui_rendering_state?: "STATE_NORMAL" | "STATE_DRIFT_WARNING" | "STATE_ABSTAIN_LOCK";
  explainable_ai_weights?: Record<string, number>;
  confidence_interval?: [number, number];
  system_integrity?: { data_drift_detected: boolean; confidence_status: string };
  inference_id?: string;
  pseudo_anonymous_id?: string;
  interpretability_layer?: {
    gradcam_engine: string;
    heatmap_spatial_shape: [number, number, number];
    gradcam_3d_matrix: string;
  };
}

export const PredictPage: React.FC = () => {
  const [formData, setFormData] = useState<DiagnosticInput>({
    tumor_size_cm: 5.0,
    tumor_number: 1,
    tumor_density_hu: 60,
    tumor_shape_irregularity: 0.2,
    tumor_texture_entropy: 2.3,
    margin_definition: "well-defined",
    enhancement_pattern: "washout",
    afp_ngml: 20,
    alp_iul: 90,
    alt_iul: 40,
    ast_iul: 40,
    bilirubin_mgdl: 1.0,
    albumin_gdl: 3.5,
    platelet_k_ul: 200,
    child_pugh_score: "A",
    bclc_stage: "A",
    cirrhosis_present: false,
    hepatitis_b: false,
    hepatitis_c: false,
    mvi_pathology: false,
    clinical_text_report: "",
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // 🔥 100% සුපිරියට වැඩ කරන ලෙස වෙනස් කරන ලද Input Handler එක
  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    const target = e.target;
    const name = target.name;

    let value: string | number | boolean;
    if (target instanceof HTMLInputElement && target.type === "checkbox") {
      value = target.checked;
    } else if (target.type === "number") {
      value = target.value === "" ? 0 : parseFloat(target.value);
    } else {
      value = target.value;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      if (file.name.toLowerCase().endsWith(".dcm")) {
        setImagePreview("DICOM_PLACEHOLDER");
      } else {
        setImagePreview(URL.createObjectURL(file));
      }
    }
  };

  const handlePdfChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setPdfFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    setErrorMessage(null);

    console.log("🚀 Backend එකට යන සිරාවටම අප්ඩේට් වුණු දත්ත:", formData);

    const payload = new FormData();
    payload.append("clinical_data", JSON.stringify(formData));
    if (imageFile) {
      payload.append("ct_scan", imageFile);
    }
    if (pdfFile) {
      payload.append("text_report_pdf", pdfFile);
    }

    try {
      const response = await axios.post(
        "http://127.0.0.1:8000/api/v1/predict",
        payload,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        },
      );
      setResult(response.data);
    } catch (error: unknown) {
      console.error("API Connection Error:", error);
      if (axios.isAxiosError(error)) {
        setErrorMessage(
          error.response?.data?.detail || "Backend එක වැඩ කරන්නේ නැහැ මචං!",
        );
      } else {
        setErrorMessage("Backend එක වැඩ කරන්නේ නැහැ මචං!");
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePhysicianOverride = async (overrideStatus: string) => {
    if (!result?.inference_id) return;
    try {
      await axios.post("http://127.0.0.1:8000/api/v1/audit", {
        inference_id: result.inference_id,
        physician_override_risk: overrideStatus,
        physician_notes: "Manual diagnostic override due to epistemic uncertainty abstention."
      });
      alert("Override successfully integrated into the immutable ledger.");
    } catch (error) {
      alert("Error saving override.");
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#f9fafb",
        padding: "24px",
        fontFamily: "sans-serif",
      }}
    >
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        <div style={{ marginBottom: "32px" }}>
          <h1
            style={{
              fontSize: "28px",
              fontWeight: "bold",
              color: "#030712",
              margin: "0 0 8px 0",
            }}
          >
            🏥 Advanced Multimodal Cancer Predictor
          </h1>
          <p style={{ color: "#4b5563", margin: 0 }}>
            Upload Patient CT Scan and input Clinical data to calculate 2-Year
            Recurrence Risk.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          style={{ display: "grid", gridTemplateColumns: "1fr", gap: "32px" }}
        >
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr", gap: "24px" }}
          >
            {/* Image & Text Section */}
            <div
              style={{
                backgroundColor: "#ffffff",
                padding: "24px",
                borderRadius: "16px",
                border: "1px solid #f3f4f6",
                boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
              }}
            >
              <h2
                style={{
                  fontSize: "18px",
                  fontWeight: "600",
                  color: "#111827",
                  marginBottom: "16px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <Upload
                  style={{ width: "20px", height: "20px", color: "#2563eb" }}
                />{" "}
                1. Multimodal Diagnostic Input
              </h2>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "20px",
                }}
              >
                <div
                  style={{
                    border: "2px dashed #e5e7eb",
                    borderRadius: "12px",
                    padding: "16px",
                    textAlign: "center",
                    position: "relative",
                    minHeight: "150px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <input
                    type="file"
                    accept=".dcm"
                    onChange={handleImageChange}
                    style={{
                      position: "absolute",
                      inset: 0,
                      opacity: 0,
                      cursor: "pointer",
                      width: "100%",
                      height: "100%",
                    }}
                  />
                  {imagePreview ? (
                    imagePreview === "DICOM_PLACEHOLDER" ? (
                      <div style={{ textAlign: "center", color: "#2563eb", padding: "20px" }}>
                        <FileText style={{ width: "48px", height: "48px", margin: "0 auto 8px auto" }} />
                        <p style={{ margin: 0, fontWeight: "bold" }}>DICOM File Selected</p>
                      </div>
                    ) : (
                      <img
                        src={imagePreview}
                        alt="CT Preview"
                        style={{
                          maxHeight: "140px",
                          borderRadius: "8px",
                          objectFit: "cover",
                        }}
                      />
                    )
                  ) : (
                    <div>
                      <Upload
                        style={{
                          width: "32px",
                          height: "32px",
                          color: "#9ca3af",
                          margin: "0 auto 8px auto",
                        }}
                      />
                      <p
                        style={{
                          fontSize: "14px",
                          color: "#6b7280",
                          margin: 0,
                        }}
                      >
                        Click to upload DICOM (.dcm)
                      </p>
                    </div>
                  )}
                </div>
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <label
                    style={{
                      fontSize: "14px",
                      fontWeight: "500",
                      color: "#374151",
                      marginBottom: "6px",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                    }}
                  >
                    <FileText style={{ width: "16px", height: "16px" }} />{" "}
                    Unstructured Clinical Text Report (PDF)
                  </label>
                  <div
                    style={{
                      border: "1px solid #d1d5db",
                      borderRadius: "8px",
                      padding: "12px",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                      gap: "10px",
                      flex: 1,
                      backgroundColor: "#f9fafb"
                    }}
                  >
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={handlePdfChange}
                      style={{
                        fontSize: "14px"
                      }}
                    />
                    {pdfFile && (
                      <span style={{ fontSize: "13px", color: "#059669", fontWeight: "500" }}>
                        ✅ Selected: {pdfFile.name}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Numerical Values Section */}
            <div
              style={{
                backgroundColor: "#ffffff",
                padding: "24px",
                borderRadius: "16px",
                border: "1px solid #f3f4f6",
                boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
              }}
            >
              <h2
                style={{
                  fontSize: "18px",
                  fontWeight: "600",
                  color: "#111827",
                  marginBottom: "20px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <Activity
                  style={{ width: "20px", height: "20px", color: "#2563eb" }}
                />{" "}
                2. Patient Lab Metrics & Clinical Phenotypes
              </h2>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr",
                  gap: "20px",
                }}
              >
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                    gap: "16px",
                  }}
                >
                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: "14px",
                        fontWeight: "500",
                        color: "#374151",
                        marginBottom: "6px",
                      }}
                    >
                      Tumor Size (cm)
                    </label>
                    <input
                      type="number"
                      name="tumor_size_cm"
                      value={formData.tumor_size_cm}
                      onChange={handleInputChange}
                      step="0.01"
                      style={{
                        width: "100%",
                        boxSizing: "border-box",
                        padding: "10px",
                        border: "1px solid #d1d5db",
                        borderRadius: "8px",
                      }}
                    />
                  </div>
                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: "14px",
                        fontWeight: "500",
                        color: "#374151",
                        marginBottom: "6px",
                      }}
                    >
                      Tumor Number
                    </label>
                    <input
                      type="number"
                      name="tumor_number"
                      value={formData.tumor_number}
                      onChange={handleInputChange}
                      style={{
                        width: "100%",
                        boxSizing: "border-box",
                        padding: "10px",
                        border: "1px solid #d1d5db",
                        borderRadius: "8px",
                      }}
                    />
                  </div>
                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: "14px",
                        fontWeight: "500",
                        color: "#374151",
                        marginBottom: "6px",
                      }}
                    >
                      Tumor Density (HU)
                    </label>
                    <input
                      type="number"
                      name="tumor_density_hu"
                      value={formData.tumor_density_hu}
                      onChange={handleInputChange}
                      style={{
                        width: "100%",
                        boxSizing: "border-box",
                        padding: "10px",
                        border: "1px solid #d1d5db",
                        borderRadius: "8px",
                      }}
                    />
                  </div>
                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: "14px",
                        fontWeight: "500",
                        color: "#374151",
                        marginBottom: "6px",
                      }}
                    >
                      Tumor Shape Irregularity
                    </label>
                    <input
                      type="number"
                      name="tumor_shape_irregularity"
                      value={formData.tumor_shape_irregularity}
                      onChange={handleInputChange}
                      step="0.01"
                      style={{
                        width: "100%",
                        boxSizing: "border-box",
                        padding: "10px",
                        border: "1px solid #d1d5db",
                        borderRadius: "8px",
                      }}
                    />
                  </div>
                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: "14px",
                        fontWeight: "500",
                        color: "#374151",
                        marginBottom: "6px",
                      }}
                    >
                      Tumor Texture Entropy
                    </label>
                    <input
                      type="number"
                      name="tumor_texture_entropy"
                      value={formData.tumor_texture_entropy}
                      onChange={handleInputChange}
                      step="0.01"
                      style={{
                        width: "100%",
                        boxSizing: "border-box",
                        padding: "10px",
                        border: "1px solid #d1d5db",
                        borderRadius: "8px",
                      }}
                    />
                  </div>
                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: "14px",
                        fontWeight: "500",
                        color: "#374151",
                        marginBottom: "6px",
                      }}
                    >
                      AFP Level (ng/ml)
                    </label>
                    <input
                      type="number"
                      name="afp_ngml"
                      value={formData.afp_ngml}
                      onChange={handleInputChange}
                      style={{
                        width: "100%",
                        boxSizing: "border-box",
                        padding: "10px",
                        border: "1px solid #d1d5db",
                        borderRadius: "8px",
                      }}
                    />
                  </div>
                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: "14px",
                        fontWeight: "500",
                        color: "#374151",
                        marginBottom: "6px",
                      }}
                    >
                      ALP Level (IU/L)
                    </label>
                    <input
                      type="number"
                      name="alp_iul"
                      value={formData.alp_iul}
                      onChange={handleInputChange}
                      style={{
                        width: "100%",
                        boxSizing: "border-box",
                        padding: "10px",
                        border: "1px solid #d1d5db",
                        borderRadius: "8px",
                      }}
                    />
                  </div>
                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: "14px",
                        fontWeight: "500",
                        color: "#374151",
                        marginBottom: "6px",
                      }}
                    >
                      ALT Level (IU/L)
                    </label>
                    <input
                      type="number"
                      name="alt_iul"
                      value={formData.alt_iul}
                      onChange={handleInputChange}
                      style={{
                        width: "100%",
                        boxSizing: "border-box",
                        padding: "10px",
                        border: "1px solid #d1d5db",
                        borderRadius: "8px",
                      }}
                    />
                  </div>
                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: "14px",
                        fontWeight: "500",
                        color: "#374151",
                        marginBottom: "6px",
                      }}
                    >
                      AST Level (IU/L)
                    </label>
                    <input
                      type="number"
                      name="ast_iul"
                      value={formData.ast_iul}
                      onChange={handleInputChange}
                      style={{
                        width: "100%",
                        boxSizing: "border-box",
                        padding: "10px",
                        border: "1px solid #d1d5db",
                        borderRadius: "8px",
                      }}
                    />
                  </div>
                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: "14px",
                        fontWeight: "500",
                        color: "#374151",
                        marginBottom: "6px",
                      }}
                    >
                      Bilirubin (mg/dL)
                    </label>
                    <input
                      type="number"
                      name="bilirubin_mgdl"
                      value={formData.bilirubin_mgdl}
                      onChange={handleInputChange}
                      step="0.1"
                      style={{
                        width: "100%",
                        boxSizing: "border-box",
                        padding: "10px",
                        border: "1px solid #d1d5db",
                        borderRadius: "8px",
                      }}
                    />
                  </div>
                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: "14px",
                        fontWeight: "500",
                        color: "#374151",
                        marginBottom: "6px",
                      }}
                    >
                      Albumin (g/dL)
                    </label>
                    <input
                      type="number"
                      name="albumin_gdl"
                      value={formData.albumin_gdl}
                      onChange={handleInputChange}
                      step="0.1"
                      style={{
                        width: "100%",
                        boxSizing: "border-box",
                        padding: "10px",
                        border: "1px solid #d1d5db",
                        borderRadius: "8px",
                      }}
                    />
                  </div>
                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: "14px",
                        fontWeight: "500",
                        color: "#374151",
                        marginBottom: "6px",
                      }}
                    >
                      Platelet Count (k/µL)
                    </label>
                    <input
                      type="number"
                      name="platelet_k_ul"
                      value={formData.platelet_k_ul}
                      onChange={handleInputChange}
                      style={{
                        width: "100%",
                        boxSizing: "border-box",
                        padding: "10px",
                        border: "1px solid #d1d5db",
                        borderRadius: "8px",
                      }}
                    />
                  </div>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                    gap: "16px",
                  }}
                >
                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: "14px",
                        fontWeight: "500",
                        color: "#374151",
                        marginBottom: "6px",
                      }}
                    >
                      Margin Definition
                    </label>
                    <select
                      name="margin_definition"
                      value={formData.margin_definition}
                      onChange={handleInputChange}
                      style={{
                        width: "100%",
                        boxSizing: "border-box",
                        padding: "10px",
                        border: "1px solid #d1d5db",
                        borderRadius: "8px",
                        backgroundColor: "#ffffff",
                      }}
                    >
                      <option value="well-defined">Well-defined</option>
                      <option value="ill-defined">Ill-defined</option>
                    </select>
                  </div>
                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: "14px",
                        fontWeight: "500",
                        color: "#374151",
                        marginBottom: "6px",
                      }}
                    >
                      Enhancement Pattern
                    </label>
                    <select
                      name="enhancement_pattern"
                      value={formData.enhancement_pattern}
                      onChange={handleInputChange}
                      style={{
                        width: "100%",
                        boxSizing: "border-box",
                        padding: "10px",
                        border: "1px solid #d1d5db",
                        borderRadius: "8px",
                        backgroundColor: "#ffffff",
                      }}
                    >
                      <option value="arterial">Arterial</option>
                      <option value="washout">Washout</option>
                      <option value="delayed">Delayed</option>
                    </select>
                  </div>
                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: "14px",
                        fontWeight: "500",
                        color: "#374151",
                        marginBottom: "6px",
                      }}
                    >
                      Child-Pugh Score
                    </label>
                    <select
                      name="child_pugh_score"
                      value={formData.child_pugh_score}
                      onChange={handleInputChange}
                      style={{
                        width: "100%",
                        boxSizing: "border-box",
                        padding: "10px",
                        border: "1px solid #d1d5db",
                        borderRadius: "8px",
                        backgroundColor: "#ffffff",
                      }}
                    >
                      <option value="A">Score A</option>
                      <option value="B">Score B</option>
                      <option value="C">Score C</option>
                    </select>
                  </div>
                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: "14px",
                        fontWeight: "500",
                        color: "#374151",
                        marginBottom: "6px",
                      }}
                    >
                      BCLC Stage
                    </label>
                    <select
                      name="bclc_stage"
                      value={formData.bclc_stage}
                      onChange={handleInputChange}
                      style={{
                        width: "100%",
                        boxSizing: "border-box",
                        padding: "10px",
                        border: "1px solid #d1d5db",
                        borderRadius: "8px",
                        backgroundColor: "#ffffff",
                      }}
                    >
                      <option value="0">Stage 0</option>
                      <option value="A">Stage A</option>
                      <option value="B">Stage B</option>
                      <option value="C">Stage C</option>
                      <option value="D">Stage D</option>
                    </select>
                  </div>
                </div>

                <div
                  style={{
                    marginTop: "12px",
                    backgroundColor: "#f9fafb",
                    padding: "16px",
                    borderRadius: "12px",
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                    gap: "16px",
                  }}
                >
                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      fontSize: "14px",
                      fontWeight: "500",
                      color: "#374151",
                      cursor: "pointer",
                    }}
                  >
                    <input
                      type="checkbox"
                      name="cirrhosis_present"
                      checked={formData.cirrhosis_present}
                      onChange={handleInputChange}
                      style={{ width: "16px", height: "16px" }}
                    />
                    Cirrhosis Condition Present
                  </label>
                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      fontSize: "14px",
                      fontWeight: "500",
                      color: "#374151",
                      cursor: "pointer",
                    }}
                  >
                    <input
                      type="checkbox"
                      name="mvi_pathology"
                      checked={formData.mvi_pathology}
                      onChange={handleInputChange}
                      style={{ width: "16px", height: "16px" }}
                    />
                    Microvascular Invasion (MVI)
                  </label>
                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      fontSize: "14px",
                      fontWeight: "500",
                      color: "#374151",
                      cursor: "pointer",
                    }}
                  >
                    <input
                      type="checkbox"
                      name="hepatitis_b"
                      checked={formData.hepatitis_b}
                      onChange={handleInputChange}
                      style={{ width: "16px", height: "16px" }}
                    />
                    Hepatitis B Positive
                  </label>
                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      fontSize: "14px",
                      fontWeight: "500",
                      color: "#374151",
                      cursor: "pointer",
                    }}
                  >
                    <input
                      type="checkbox"
                      name="hepatitis_c"
                      checked={formData.hepatitis_c}
                      onChange={handleInputChange}
                      style={{ width: "16px", height: "16px" }}
                    />
                    Hepatitis C Positive
                  </label>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: "100%",
                  marginTop: "24px",
                  backgroundColor: loading ? "#9ca3af" : "#2563eb",
                  color: "#ffffff",
                  fontWeight: "600",
                  padding: "12px 0",
                  border: "none",
                  borderRadius: "12px",
                  fontSize: "16px",
                  cursor: "pointer",
                }}
              >
                {loading
                  ? "Executing Multimodal AI Deep Learning Inference..."
                  : "Execute Multimodal AI Prognosis"}
              </button>
            </div>
          </div>
        </form>

        {errorMessage && (
          <div
            style={{
              marginTop: "24px",
              padding: "16px",
              borderRadius: "12px",
              backgroundColor: "#fee2e2",
              border: "1px solid #fca5a5",
              color: "#991b1b",
              fontSize: "14px",
            }}
          >
            ⚠️ {errorMessage}
          </div>
        )}

        {result && (
          <div
            style={{
              marginTop: "32px",
              padding: "24px",
              borderRadius: "16px",
              border:
                result.ui_rendering_state === "STATE_ABSTAIN_LOCK"
                  ? "2px solid #ef4444"
                  : result.ui_rendering_state === "STATE_DRIFT_WARNING"
                  ? "2px solid #f59e0b"
                  : result.recurrence_risk === "HIGH"
                  ? "1px solid #fca5a5"
                  : "1px solid #86efac",
              backgroundColor:
                result.ui_rendering_state === "STATE_ABSTAIN_LOCK"
                  ? "#fef2f2"
                  : result.ui_rendering_state === "STATE_DRIFT_WARNING"
                  ? "#fffbeb"
                  : result.recurrence_risk === "HIGH"
                  ? "#fef2f2"
                  : "#f0fdf4",
            }}
          >
            {result.ui_rendering_state === "STATE_DRIFT_WARNING" && (
              <div style={{ backgroundColor: "#fef3c7", padding: "12px", borderRadius: "8px", marginBottom: "16px", color: "#b45309", fontWeight: "bold" }}>
                ⚠️ STATE DRIFT WARNING: Patient radiological variance has shifted. Recalibration required. Proceed with manual verification.
              </div>
            )}
            
            <div style={{ display: "flex", alignItems: "start", gap: "16px" }}>
              {result.recurrence_risk === "HIGH" || result.recurrence_risk === "ABSTAIN" ? (
                <AlertTriangle
                  style={{ width: "32px", height: "32px", color: "#dc2626" }}
                />
              ) : (
                <CheckCircle
                  style={{ width: "32px", height: "32px", color: "#16a34a" }}
                />
              )}
              <div style={{ flex: 1 }}>
                <h3
                  style={{
                    fontSize: "20px",
                    fontWeight: "bold",
                    color:
                      result.recurrence_risk === "HIGH" || result.recurrence_risk === "ABSTAIN" ? "#991b1b" : "#166534",
                    margin: "0 0 8px 0",
                  }}
                >
                  {result.ui_rendering_state === "STATE_ABSTAIN_LOCK" 
                    ? "SYSTEM ABSTAINED: DIAGNOSTIC UNCERTAINTY TOO HIGH"
                    : `${result.recurrence_risk} RECURRENCE RISK DETECTED (${result.probability}%)`}
                </h3>

                {result.ui_rendering_state === "STATE_ABSTAIN_LOCK" && (
                  <div style={{ padding: "16px", backgroundColor: "#fee2e2", borderRadius: "8px", marginBottom: "16px" }}>
                    <p style={{ fontWeight: "bold", color: "#991b1b" }}>🛑 Uncertainty boundaries breached. AI Prediction masked to prevent diagnostic error.</p>
                    <p style={{ fontSize: "14px", color: "#7f1d1d" }}>Physician manual review strictly required. Please authorize override payload to audit ledger:</p>
                    <div style={{ display: "flex", gap: "12px", marginTop: "12px" }}>
                      <button onClick={() => handlePhysicianOverride("HIGH")} style={{ padding: "8px 16px", background: "#ef4444", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "bold" }}>Authorize HIGH Risk Override</button>
                      <button onClick={() => handlePhysicianOverride("LOW")} style={{ padding: "8px 16px", background: "#22c55e", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "bold" }}>Authorize LOW Risk Override</button>
                    </div>
                  </div>
                )}

                <p
                  style={{
                    color: "#374151",
                    margin: "0 0 16px 0",
                    fontSize: "15px",
                  }}
                >
                  {result.confidence_interval && `95% Confidence Interval: [${result.confidence_interval[0]}% - ${result.confidence_interval[1]}%] | Pseudo-ID: ${result.pseudo_anonymous_id}`}
                </p>
                <div>
                  <h4
                    style={{
                      fontSize: "14px",
                      fontWeight: "600",
                      color: "#111827",
                      margin: "0 0 8px 0",
                    }}
                  >
                    Explainable AI (XAI) Model Insights & System Integrity:
                  </h4>
                  <ul
                    style={{
                      paddingLeft: "20px",
                      margin: 0,
                      fontSize: "14px",
                      color: "#4b5563",
                      marginBottom: "16px"
                    }}
                  >
                    {result.ai_insights.map((insight, idx) => (
                      <li key={idx} style={{ marginBottom: "4px" }}>
                        {insight}
                      </li>
                    ))}
                  </ul>

                  {result.explainable_ai_weights && (
                    <div style={{ backgroundColor: "#f9fafb", padding: "16px", borderRadius: "8px", border: "1px solid #e5e7eb" }}>
                      <h4 style={{ fontSize: "14px", fontWeight: "600", marginBottom: "8px" }}>SHAP Feature Importance Analysis (Clinical Auditing)</h4>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "8px" }}>
                        {Object.entries(result.explainable_ai_weights).map(([key, value]) => (
                          <div key={key} style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
                            <span>{key}</span>
                            <span style={{ fontWeight: "bold", color: value > 0 ? "#ef4444" : "#22c55e" }}>{value > 0 ? "+" : ""}{value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 3D Grad-CAM Viewer Integration */}
                  {result?.interpretability_layer?.gradcam_engine === "ACTIVE" && 
                   result?.interpretability_layer?.gradcam_3d_matrix && (
                    <div style={{ marginTop: "24px", paddingTop: "16px", borderTop: "1px solid #e5e7eb" }}>
                      <h4 style={{ fontSize: "16px", fontWeight: "600", color: "#1f2937", marginBottom: "8px" }}>
                        Volumetric Hypervascular Tumor Topography
                      </h4>
                      <p style={{ fontSize: "13px", color: "#6b7280", marginBottom: "16px" }}>
                        Interactive slice-by-slice spatial heatmap mapped dynamically from the PyTorch 3D-CNN feature extractor.
                      </p>
                      
                      <MprClinicalWorkstation 
                        base64Matrix={result.interpretability_layer.gradcam_3d_matrix} 
                        dicomBase64Matrix={result.interpretability_layer.dicom_3d_matrix}
                        dimensions={result.interpretability_layer.heatmap_spatial_shape} 
                      />
                    </div>
                  )}

                </div>
                {result.clinical_text_report && (
                  <div style={{ marginTop: "16px" }}>
                    <h4
                      style={{
                        fontSize: "14px",
                        fontWeight: "600",
                        color: "#111827",
                        margin: "0 0 8px 0",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                    >
                      <FileText style={{ width: "16px", height: "16px" }} />
                      Extracted Clinical Text Report:
                    </h4>
                    <div
                      style={{
                        padding: "12px",
                        backgroundColor: "#f3f4f6",
                        borderRadius: "8px",
                        fontSize: "13px",
                        color: "#374151",
                        whiteSpace: "pre-wrap",
                        maxHeight: "200px",
                        overflowY: "auto",
                        border: "1px solid #e5e7eb",
                        lineHeight: "1.5",
                      }}
                    >
                      {result.clinical_text_report}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
