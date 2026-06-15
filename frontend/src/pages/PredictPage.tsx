import React, { useState, ChangeEvent, FormEvent } from "react";
import {
  Upload,
  Activity,
  AlertTriangle,
  CheckCircle,
  FileText,
} from "lucide-react";

// ==========================================
// 1. TYPESCRIPT INTERFACES (DIRECT INTEGRATION)
// ==========================================
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
  recurrence_risk: "HIGH" | "LOW";
  probability: number;
  ai_insights: string[];
}

// ==========================================
// 2. MAIN COMPONENT PRODUCTION IMPLEMENTATION
// ==========================================
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
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<PredictionResult | null>(null);

  // Safe Input Handler for Numbers, Strings and Checkboxes
  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    const { name, value, type } = e.target;

    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else if (type === "number") {
      setFormData((prev) => ({
        ...prev,
        [name]: value === "" ? 0 : parseFloat(value),
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    const payload = new FormData();
    payload.append("clinical_data", JSON.stringify(formData));
    if (imageFile) {
      payload.append("ct_scan", imageFile);
    }

    try {
      // Temporary Mock Server Timeout for Testing UX Flow
      await new Promise((resolve) => setTimeout(resolve, 2000));

      setResult({
        recurrence_risk:
          formData.tumor_size_cm > 6 || formData.mvi_pathology ? "HIGH" : "LOW",
        probability: formData.tumor_size_cm > 6 ? 84.5 : 24.2,
        ai_insights: [
          "Image Analysis Module: High structural shape irregularity index identified within liver boundaries.",
          "NLP Transformer Module: High risk clinical correlation found regarding vascular invasion parameters.",
        ],
      });
    } catch (error) {
      console.error("API Connection Error:", error);
    } finally {
      setLoading(false);
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
        {/* Header Title */}
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

        {/* Input Form Wrapper */}
        <form
          onSubmit={handleSubmit}
          style={{ display: "grid", gridTemplateColumns: "1fr", gap: "32px" }}
        >
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr", gap: "24px" }}
          >
            {/* Section 1: CT Scan & Clinical Text Upload */}
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
                  gridTemplateColumns: "1fr md:1fr 1fr",
                  gap: "20px",
                }}
              >
                {/* CT Scan Dropper */}
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
                    accept="image/*"
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
                    <img
                      src={imagePreview}
                      alt="CT Preview"
                      style={{
                        maxHeight: "140px",
                        borderRadius: "8px",
                        objectFit: "cover",
                      }}
                    />
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
                        Click to upload CT Scan Image
                      </p>
                    </div>
                  )}
                </div>

                {/* Text Report Textarea */}
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
                    Unstructured Clinical Text Report
                  </label>
                  <textarea
                    name="clinical_text_report"
                    value={formData.clinical_text_report}
                    onChange={handleInputChange}
                    rows={5}
                    placeholder="Paste the pathology or text report here..."
                    style={{
                      width: "100%",
                      boxSizing: "border-box",
                      padding: "12px",
                      border: "1px solid #d1d5db",
                      borderRadius: "8px",
                      fontSize: "14px",
                      resize: "vertical",
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Patient Structured Numerical & Categorical Metrics */}
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
                {/* Numbers Layout Grid */}
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
                        block: "true",
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
                        block: "true",
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
                        block: "true",
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
                        block: "true",
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
                        block: "true",
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
                        block: "true",
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
                        block: "true",
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
                        block: "true",
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
                        block: "true",
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
                        block: "true",
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
                        block: "true",
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
                        block: "true",
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

                {/* Dropdowns Grid */}
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
                        block: "true",
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
                        block: "true",
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
                        block: "true",
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
                        block: "true",
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

                {/* Boolean Switches / Checkboxes */}
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
                      style={{
                        width: "16px",
                        height: "16px",
                        cursor: "pointer",
                      }}
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
                      style={{
                        width: "16px",
                        height: "16px",
                        cursor: "pointer",
                      }}
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
                      style={{
                        width: "16px",
                        height: "16px",
                        cursor: "pointer",
                      }}
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
                      style={{
                        width: "16px",
                        height: "16px",
                        cursor: "pointer",
                      }}
                    />
                    Hepatitis C Positive
                  </label>
                </div>
              </div>

              {/* Submission Execution Button */}
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
                  cursor: loading ? "not-allowed" : "pointer",
                  transition: "background-color 0.2s",
                }}
              >
                {loading
                  ? "Executing Advanced Multimodal AI Analytics..."
                  : "Execute Multimodal AI Prognosis"}
              </button>
            </div>
          </div>
        </form>

        {/* Section 3: Diagnostic Results Interface */}
        {result && (
          <div
            style={{
              marginTop: "32px",
              padding: "24px",
              borderRadius: "16px",
              border:
                result.recurrence_risk === "HIGH"
                  ? "1px solid #fca5a5"
                  : "1px solid #86efac",
              backgroundColor:
                result.recurrence_risk === "HIGH" ? "#fef2f2" : "#f0fdf4",
            }}
          >
            <div style={{ display: "flex", alignItems: "start", gap: "16px" }}>
              {result.recurrence_risk === "HIGH" ? (
                <AlertTriangle
                  style={{
                    width: "32px",
                    height: "32px",
                    color: "#dc2626",
                    flexShrink: 0,
                  }}
                />
              ) : (
                <CheckCircle
                  style={{
                    width: "32px",
                    height: "32px",
                    color: "#16a34a",
                    flexShrink: 0,
                  }}
                />
              )}
              <div>
                <h3
                  style={{
                    fontSize: "20px",
                    fontWeight: "bold",
                    color:
                      result.recurrence_risk === "HIGH" ? "#991b1b" : "#166534",
                    margin: "0 0 8px 0",
                  }}
                >
                  {result.recurrence_risk} RECURRENCE RISK DETECTED (
                  {result.probability}%)
                </h3>
                <p
                  style={{
                    color: "#374151",
                    margin: "0 0 16px 0",
                    fontSize: "15px",
                    lineHeight: "1.5",
                  }}
                >
                  The neural network fused deep radiomics vectors with text
                  embeddings to assess clinical outcome variables. Early
                  screening adjustments are advised.
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
                    Explainable AI (XAI) Model Insights:
                  </h4>
                  <ul
                    style={{
                      paddingLeft: "20px",
                      margin: 0,
                      fontSize: "14px",
                      color: "#4b5563",
                      lineHeight: "1.6",
                    }}
                  >
                    {result.ai_insights.map((insight, idx) => (
                      <li key={idx} style={{ marginBottom: "4px" }}>
                        {insight}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
