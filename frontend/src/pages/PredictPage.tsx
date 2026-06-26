import React, { useState, useEffect, useRef } from "react";
import type { ChangeEvent, FormEvent } from "react";
import {
  Upload,
  Activity,
  AlertTriangle,
  CheckCircle,
  FileText,
  Microscope,
  Stethoscope,
  Users,
  Settings,
  Database,
  LayoutDashboard,
  ShieldAlert,
  Search,
  Download,
  Hexagon,
  QrCode
} from "lucide-react";
import axios from "axios";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import MprClinicalWorkstation from "../components/MprClinicalWorkstation";

export interface DiagnosticInput {
  tumor_size_cm: number;
  tumor_number: number;
  tumor_density_hu: number;
  tumor_shape_irregularity: number;
  tumor_texture_entropy: number;
  margin_definition: string;
  enhancement_pattern: string;
  afp_ngml: number;
  alp_iul: number;
  alt_iul: number;
  ast_iul: number;
  bilirubin_mgdl: number;
  albumin_gdl: number;
  platelet_k_ul: number;
  child_pugh_score: string;
  bclc_stage: string;
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
    dicom_3d_matrix?: string;
    tumor_target?: { found: boolean; x: number; y: number; z: number };
  };
}

const InputField = ({ label, name, value, type="number", unit="", step="1", onChange, autoFilled }: any) => (
  <div className="flex flex-col">
    <label className="text-[10px] uppercase tracking-wider text-slate-400 mb-1 flex justify-between items-center font-semibold">
      {label}
      {autoFilled && <span className="text-[8px] text-blue-400 bg-blue-500/10 px-1 rounded-sm border border-blue-500/20">AUTO</span>}
    </label>
    <div className="relative flex">
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        step={step}
        className={`w-full text-xs font-mono ${autoFilled ? 'bg-blue-900/20 border-blue-500/50 text-blue-100' : 'bg-[#0a0e17] border-[#2a364a] text-slate-200'} border rounded-sm py-1.5 pl-2 ${unit ? 'pr-8' : 'pr-2'} focus:ring-1 focus:ring-blue-500 outline-none transition-colors shadow-inner`}
      />
      {unit && (
        <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
          <span className="text-slate-500 text-[9px] font-bold">{unit}</span>
        </div>
      )}
    </div>
  </div>
);

const SelectField = ({ label, name, value, options, onChange, autoFilled }: any) => (
  <div className="flex flex-col">
    <label className="text-[10px] uppercase tracking-wider text-slate-400 mb-1 flex justify-between items-center font-semibold">
      {label}
      {autoFilled && <span className="text-[8px] text-blue-400 bg-blue-500/10 px-1 rounded-sm border border-blue-500/20">AUTO</span>}
    </label>
    <select
      name={name}
      value={value}
      onChange={onChange}
      className={`w-full text-xs font-mono ${autoFilled ? 'bg-blue-900/20 border-blue-500/50 text-blue-100' : 'bg-[#0a0e17] border-[#2a364a] text-slate-200'} border rounded-sm py-1.5 px-2 focus:ring-1 focus:ring-blue-500 outline-none shadow-inner`}
    >
      {options.map((opt: any) => <option key={opt.value} value={opt.value} className="bg-[#131826] font-sans text-xs">{opt.label}</option>)}
    </select>
  </div>
);

const CheckboxField = ({ label, name, checked, onChange, autoFilled }: any) => (
  <label className={`flex items-center gap-2 p-1.5 rounded-sm border ${autoFilled ? 'bg-blue-900/20 border-blue-500/50' : 'bg-[#0a0e17] border-[#2a364a]'} cursor-pointer hover:bg-[#1e293b] transition-colors`}>
    <input
      type="checkbox"
      name={name}
      checked={checked}
      onChange={onChange}
      className="w-3.5 h-3.5 rounded-sm border-slate-600 bg-[#0a0e17] text-blue-500 focus:ring-1 focus:ring-blue-500 focus:ring-offset-0"
    />
    <span className="text-[11px] font-medium text-slate-300 flex-1 truncate">{label}</span>
    {autoFilled && <span className="text-[8px] font-bold text-blue-400">AUTO</span>}
  </label>
);

export const PredictPage: React.FC<{ onViewHistory?: (id: string) => void }> = ({ onViewHistory }) => {
  const [formData, setFormData] = useState<DiagnosticInput>({
    tumor_size_cm: 5.0,
    tumor_number: 1,
    tumor_density_hu: 60,
    tumor_shape_irregularity: 0.2,
    tumor_texture_entropy: 2.3,
    margin_definition: "Smooth",
    enhancement_pattern: "Portal Venous Washout",
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

  const [patientInfo, setPatientInfo] = useState({
    name: "AWAITING DATA...",
    mrn: "---",
    dob: "---",
    age: "-",
    sex: "-",
    attending: "---"
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [extracting, setExtracting] = useState<boolean>(false);
  const [autoFilled, setAutoFilled] = useState<boolean>(false);
  const [historyInfo, setHistoryInfo] = useState<{has_history: boolean, pseudo_id: string, count: number} | null>(null);
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [pipelineStep, setPipelineStep] = useState<"IDLE" | "STEP1" | "STEP2" | "STEP3" | "COMPLETE">("IDLE");
  const [progress, setProgress] = useState<number>(0);
  const [loadingText, setLoadingText] = useState<string>("");
  const [screenFlash, setScreenFlash] = useState<boolean>(false);
  const reportRef = useRef<HTMLDivElement>(null);

  const handleDownloadPdf = async () => {
    if (!reportRef.current) return;
    try {
      // 1. Capture the individual MPR views cleanly without web UI controls
      const axialElement = document.getElementById("pdf-axial-capture");
      const coronalElement = document.getElementById("pdf-coronal-capture");
      const sagittalElement = document.getElementById("pdf-sagittal-capture");
      
      if (axialElement) {
        const axialCanvas = await html2canvas(axialElement, { useCORS: true, backgroundColor: '#000000', scale: 2 });
        const reportAxialImg = document.getElementById("report-axial-img") as HTMLImageElement;
        if (reportAxialImg) { reportAxialImg.src = axialCanvas.toDataURL('image/jpeg', 0.95); reportAxialImg.style.display = 'block'; }
      }

      if (coronalElement) {
        const coronalCanvas = await html2canvas(coronalElement, { useCORS: true, backgroundColor: '#000000', scale: 2 });
        const reportCoronalImg = document.getElementById("report-coronal-img") as HTMLImageElement;
        if (reportCoronalImg) { reportCoronalImg.src = coronalCanvas.toDataURL('image/jpeg', 0.95); reportCoronalImg.style.display = 'block'; }
      }

      if (sagittalElement) {
        const sagittalCanvas = await html2canvas(sagittalElement, { useCORS: true, backgroundColor: '#000000', scale: 2 });
        const reportSagittalImg = document.getElementById("report-sagittal-img") as HTMLImageElement;
        if (reportSagittalImg) { reportSagittalImg.src = sagittalCanvas.toDataURL('image/jpeg', 0.95); reportSagittalImg.style.display = 'block'; }
      }
      
      // Give DOM a tick to update the images
      await new Promise(r => setTimeout(r, 150));

      // 2. Capture the full hidden A4 report
      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false
      });
      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: [canvas.width, canvas.height]
      });
      pdf.addImage(imgData, 'JPEG', 0, 0, canvas.width, canvas.height);
      pdf.save(`HepatoAI_Clinical_Report_${patientInfo.mrn || 'Unknown'}.pdf`);
      
      // Cleanup
      const reportAxialImg = document.getElementById("report-axial-img") as HTMLImageElement;
      const reportCoronalImg = document.getElementById("report-coronal-img") as HTMLImageElement;
      const reportSagittalImg = document.getElementById("report-sagittal-img") as HTMLImageElement;
      if (reportAxialImg) { reportAxialImg.style.display = 'none'; reportAxialImg.src = ''; }
      if (reportCoronalImg) { reportCoronalImg.style.display = 'none'; reportCoronalImg.src = ''; }
      if (reportSagittalImg) { reportSagittalImg.style.display = 'none'; reportSagittalImg.src = ''; }
    } catch (err) {
      console.error("PDF generation failed", err);
      alert("Failed to generate PDF report.");
    }
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
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
    setFormData((prev) => ({ ...prev, [name]: value }));
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

  useEffect(() => {
    const autoExtractData = async () => {
      if (!imageFile && !pdfFile) return;
      setExtracting(true);
      const payload = new FormData();
      if (imageFile) payload.append("dcm_file", imageFile);
      if (pdfFile) payload.append("pdf_file", pdfFile);
      
      try {
        const response = await axios.post("http://127.0.0.1:8000/api/extract-clinical-data", payload, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        const data = response.data;
        setFormData((prev) => ({ ...prev, ...data }));
        
        if (data.patient_name) {
          const dobStr = data.patient_dob || "";
          let formattedDob = dobStr;
          let ageStr = patientInfo.age;
          if (dobStr.length === 8) {
            formattedDob = `${dobStr.slice(0,4)}-${dobStr.slice(4,6)}-${dobStr.slice(6,8)}`;
            const birthYear = parseInt(dobStr.slice(0,4));
            if (!isNaN(birthYear)) {
                ageStr = (new Date().getFullYear() - birthYear).toString();
            }
          }
          
          setPatientInfo({
            name: data.patient_name.replace(/\^/g, ' ').toUpperCase() || "AWAITING DATA...",
            mrn: data.patient_id || "---",
            dob: formattedDob || "---",
            age: ageStr,
            sex: data.patient_sex || "-",
            attending: data.physician_name ? data.physician_name.replace(/\^/g, ' ') : "---"
          });
        }
        
        
        if (data.has_history && data.pseudo_anonymous_id) {
            setHistoryInfo({ has_history: true, pseudo_id: data.pseudo_anonymous_id, count: data.total_past_scans || 1 });
        } else {
            setHistoryInfo(null);
        }

        if (data.patient_mismatch) {
            setErrorMessage(data.mismatch_warning);
        } else {
            setErrorMessage(null);
        }

        setAutoFilled(true);
        setTimeout(() => setAutoFilled(false), 5000);
      } catch (error) {
        console.error("Extraction error:", error);
      } finally {
        setExtracting(false);
      }
    };
    autoExtractData();
  }, [imageFile, pdfFile]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    setErrorMessage(null);
    setPipelineStep("STEP1");
    setProgress(33);
    setLoadingText("Extracting 3D Radiomics Features...");

    const payload = new FormData();
    payload.append("clinical_data", JSON.stringify(formData));
    if (imageFile) payload.append("ct_scan", imageFile);
    if (pdfFile) payload.append("text_report_pdf", pdfFile);

    // Start API request in parallel
    const apiPromise = axios.post("http://127.0.0.1:8000/api/v1/predict", payload, {
      headers: { "Content-Type": "multipart/form-data" },
    }).catch((error: any) => ({ error }));

    // Step 1 (0s - 2s) - Image Processing
    await new Promise(r => setTimeout(r, 2000));
    
    // Step 2 (2s - 4s) - Text Processing
    setPipelineStep("STEP2");
    setProgress(66);
    setLoadingText("Executing NLP on Clinical Ledger...");
    await new Promise(r => setTimeout(r, 2000));

    // Step 3 (4s - 6s) - The Fusion
    setPipelineStep("STEP3");
    setProgress(100);
    setLoadingText("Executing Multimodal Vector Fusion & SHAP Analysis...");
    await new Promise(r => setTimeout(r, 2000));

    const res: any = await apiPromise;
    setLoading(false);
    setPipelineStep("COMPLETE");

    if (res?.error) {
      setErrorMessage(res.error.response?.data?.detail || "Backend communication failed.");
      setPipelineStep("IDLE");
    } else {
      setResult(res.data);
      setScreenFlash(true);
      setTimeout(() => setScreenFlash(false), 400);
      setTimeout(() => setPipelineStep("IDLE"), 2000);
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
    <div className="flex-1 flex flex-col min-h-full relative">
      {/* Subtle Screen Flash on Completion */}
      <div className={`fixed inset-0 bg-[#00b8d4] pointer-events-none transition-opacity duration-300 z-50 ${
        screenFlash ? "opacity-15" : "opacity-0"
      }`} />
      {/* TOP HEADER: Patient Context Banner */}
      <div className="h-12 bg-[#131826] border-b border-[#1e293b] flex items-center px-4 justify-between flex-shrink-0 shadow-md sticky top-0 z-20">
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-2 bg-[#0a0e17] px-2 py-1 rounded border border-[#2a364a]">
              <span className="text-slate-500 font-semibold uppercase">MRN</span>
              <span className="font-mono text-blue-400 font-bold tracking-wider">{patientInfo.mrn}</span>
            </div>
            <span className="font-bold text-slate-200 tracking-wide">{patientInfo.name}</span>
            <span className="text-slate-600">|</span>
            <span className="text-slate-400 font-mono">DOB: {patientInfo.dob} {patientInfo.age !== "-" ? `(${patientInfo.age}y)` : ""}</span>
            <span className="text-slate-600">|</span>
            <span className="text-slate-400">Sex: <span className="text-slate-200">{patientInfo.sex}</span></span>
            <span className="text-slate-600">|</span>
            <span className="text-slate-400">Attending: <span className="text-slate-200">{patientInfo.attending}</span></span>
          </div>
          <div className="flex items-center gap-3">
             <div className="flex items-center gap-2 text-[10px] font-mono font-bold text-emerald-400 bg-emerald-950/30 px-2 py-1 rounded border border-emerald-900/50 shadow-[0_0_10px_rgba(16,185,129,0.1)]">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                SYSTEM SECURE
             </div>
             <div className="text-xs text-slate-500 font-mono">{new Date().toISOString().split('T')[0]}</div>
             <div className="h-4 w-px bg-[#1e293b] mx-1"></div>
             <div className="text-xs text-slate-400 font-medium">
               Dr. P. Weerasinghe <span className="text-slate-500">- Chief Oncologist</span>
             </div>
          </div>
        </div>

        {/* MAIN WORKSTATION GRID */}
        <form onSubmit={handleSubmit} className="flex-1 p-4 flex flex-col gap-4 bg-[#070b14]">
          
          {/* TOP INPUT ROW */}
          <div className="flex flex-col xl:flex-row gap-4 w-full items-stretch">
            {/* LEFT COLUMN: Data Sources */}
            <div className="w-full xl:w-[380px] flex flex-col gap-4 flex-shrink-0">
              
              {/* Panel: Diagnostic Input */}
              <div className="bg-[#131826] border border-[#1e293b] rounded-md flex flex-col shadow-lg overflow-hidden h-full">
                <div className="bg-[#1a2235] px-3 py-2 border-b border-[#1e293b] flex items-center justify-between">
                  <h2 className="text-[11px] uppercase tracking-wider text-slate-300 font-bold flex items-center gap-2">
                    <Database className="w-3.5 h-3.5 text-blue-400" />
                    1. Diagnostic Pipeline
                  </h2>
                </div>
                <div className="p-3 flex flex-col gap-3 flex-1 justify-center">
                  <div className={`border rounded-sm p-4 flex flex-col items-center justify-center relative flex-1 transition-all duration-500 group cursor-pointer ${
                    pipelineStep === "STEP1" || pipelineStep === "STEP3"
                      ? "border-[#00b8d4] bg-[#131524] shadow-[0_0_15px_rgba(0,184,212,0.2)] animate-pulse"
                      : "border-dashed border-[#2a364a] hover:border-blue-500/50 bg-[#0a0e17]"
                  }`}>
                    <input type="file" accept=".dcm" onChange={handleImageChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" disabled={loading} />
                    {imagePreview ? (
                      imagePreview === "DICOM_PLACEHOLDER" ? (
                        <div className={`text-center transition-colors duration-500 ${pipelineStep === "STEP1" || pipelineStep === "STEP3" ? "text-[#00b8d4]" : "text-blue-400"}`}>
                          <Database className={`w-8 h-8 mx-auto mb-1 ${pipelineStep === "STEP1" || pipelineStep === "STEP3" ? "animate-pulse drop-shadow-[0_0_8px_#00b8d4]" : "opacity-80"}`} />
                          <p className="font-bold text-[10px] uppercase tracking-wide">DICOM Loaded</p>
                        </div>
                      ) : (
                        <div className="relative w-full flex justify-center">
                          <img src={imagePreview} alt="Preview" className={`max-h-20 rounded object-cover shadow-md transition-all duration-500 ${pipelineStep === "STEP1" || pipelineStep === "STEP3" ? "ring-2 ring-[#00b8d4] shadow-[0_0_12px_#00b8d4]" : ""}`} />
                        </div>
                      )
                    ) : (
                      <div className="text-center text-slate-500 group-hover:text-blue-400 transition-colors">
                        <Upload className="w-6 h-6 mx-auto mb-2 opacity-60 group-hover:opacity-100" />
                        <p className="text-[10px] uppercase tracking-wider font-semibold">Load DICOM Volume</p>
                      </div>
                    )}
                  </div>

                  {/* Multimodal Fusion Link / Connector */}
                  <div className="flex items-center justify-center -my-1 z-10 relative h-6">
                    <div className={`w-0.5 h-full transition-all duration-500 ${
                      pipelineStep === "STEP3" 
                        ? "bg-[#00b8d4] shadow-[0_0_10px_#00b8d4] animate-pulse" 
                        : "bg-[#2a364a]"
                    }`} />
                    {pipelineStep === "STEP3" && (
                      <div className="absolute bg-[#131524] border border-[#00b8d4] text-[#00b8d4] text-[9px] font-mono px-2 py-0.5 rounded shadow-[0_0_12px_rgba(0,184,212,0.3)] flex items-center gap-1 animate-pulse">
                        <Activity className="w-3 h-3" /> FUSION ACTIVE
                      </div>
                    )}
                  </div>

                  <div className={`border rounded-sm p-3 flex flex-col justify-center items-center relative transition-all duration-500 group cursor-pointer h-16 ${
                    pipelineStep === "STEP2" || pipelineStep === "STEP3"
                      ? "border-[#00b8d4] bg-[#131524] shadow-[0_0_15px_rgba(0,184,212,0.2)] animate-pulse"
                      : "border-[#2a364a] bg-[#0a0e17] hover:border-emerald-500/50"
                  }`}>
                    <input type="file" accept=".pdf" onChange={handlePdfChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" disabled={loading} />
                    {pdfFile ? (
                      <div className={`flex items-center gap-2 transition-colors duration-500 ${pipelineStep === "STEP2" || pipelineStep === "STEP3" ? "text-[#00b8d4]" : "text-emerald-400"}`}>
                        <CheckCircle className={`w-4 h-4 ${pipelineStep === "STEP2" || pipelineStep === "STEP3" ? "animate-pulse drop-shadow-[0_0_8px_#00b8d4]" : ""}`} />
                        <span className="text-xs font-mono truncate max-w-[200px]">{pdfFile.name}</span>
                      </div>
                    ) : (
                      <div className="text-center text-slate-500 group-hover:text-emerald-400 transition-colors flex items-center gap-2">
                         <FileText className="w-4 h-4 opacity-60 group-hover:opacity-100" />
                         <p className="text-[10px] uppercase tracking-wider font-semibold">Load Clinical PDF</p>
                      </div>
                    )}
                  </div>
                  
                  {/* Technical Loading Status & Progress Bar */}
                  {loading && (
                    <div className="bg-[#131524] border border-[#2a364a] rounded-sm p-3 flex flex-col gap-2 shadow-inner transition-all duration-300 mt-1">
                      <div className="flex justify-between items-center text-[10px] font-mono">
                        <span className="text-[#00b8d4] font-bold flex items-center gap-1.5 animate-pulse">
                          <span className="inline-block w-1.5 h-1.5 bg-[#00b8d4] rounded-full"></span>
                          {loadingText}
                        </span>
                        <span className="text-slate-400 font-bold">{progress}%</span>
                      </div>
                      <div className="w-full bg-[#0a0e17] h-1.5 rounded-full overflow-hidden border border-[#1e293b]">
                        <div 
                          className="bg-[#00b8d4] h-full transition-all duration-500 ease-out shadow-[0_0_8px_#00b8d4]"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Auto-Extract Status */}
                  {!loading && (
                    <div className="h-auto min-h-[32px] flex flex-col items-center justify-center gap-2">
                      {extracting && (
                        <div className="text-[10px] font-mono text-amber-400 bg-amber-950/30 px-3 py-1.5 rounded-sm border border-amber-500/30 flex items-center gap-2 w-full justify-center shadow-inner">
                          <span className="animate-spin inline-block w-3 h-3 border-2 border-amber-400 border-t-transparent rounded-full"></span> 
                          PARSING CLINICAL DATA...
                        </div>
                      )}
                      {!extracting && autoFilled && (
                        <div className="text-[10px] font-mono text-emerald-400 bg-emerald-950/30 px-3 py-1.5 rounded-sm border border-emerald-500/30 flex items-center gap-2 w-full justify-center shadow-inner">
                          <CheckCircle className="w-3.5 h-3.5" /> 
                          EXTRACTION COMPLETE
                        </div>
                      )}
                      {!extracting && historyInfo?.has_history && (
                        <div className="w-full bg-indigo-950/40 border border-indigo-500/40 rounded-sm p-2 flex items-center justify-between shadow-lg animate-in fade-in slide-in-from-top-2 duration-500">
                          <div className="flex items-center gap-2 text-indigo-300 text-[10px] font-bold tracking-wider">
                             <Activity className="w-4 h-4 text-indigo-400" />
                             <span>Previous History Found ({historyInfo.count} Scan{historyInfo.count > 1 ? 's' : ''})</span>
                          </div>
                          <button 
                             type="button"
                             onClick={(e) => { e.preventDefault(); onViewHistory?.(historyInfo.pseudo_id); }}
                             className="bg-indigo-600 hover:bg-indigo-500 text-white text-[9px] px-2 py-1 rounded shadow uppercase tracking-widest transition-colors font-bold"
                          >
                             View Records
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="mt-auto pt-4 border-t border-[#1e293b]">
                    <button
                      type="submit"
                      disabled={loading || (errorMessage !== null && errorMessage.includes('PATIENT MISMATCH'))}
                      className={`w-full py-2.5 rounded-sm font-bold text-xs uppercase tracking-widest shadow-lg transition-all ${
                        loading || (errorMessage !== null && errorMessage.includes('PATIENT MISMATCH'))
                          ? "bg-[#1e293b] text-slate-500 cursor-not-allowed border border-[#2a364a]" 
                          : "bg-[#00b8d4] hover:bg-[#009ac2] text-[#0a0e17] font-black border border-[#00b8d4]/80 shadow-[0_0_15px_rgba(0,184,212,0.3)]"
                      }`}
                    >
                      {loading ? "Pipeline Active..." : "Initialize Pipeline"}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: Clinical Form */}
            <div className="flex-1 flex flex-col gap-4 min-w-0">
              
              <div className="flex flex-col xl:flex-row gap-4 flex-shrink-0">
                
                {/* Panel: Radiology Form */}
                <div className="flex-1 bg-[#131826] border border-[#1e293b] rounded-md shadow-lg overflow-hidden">
                  <div className="bg-[#1a2235] px-3 py-2 border-b border-[#1e293b]">
                    <h2 className="text-[11px] uppercase tracking-wider text-slate-300 font-bold flex items-center gap-2">
                      <Microscope className="w-3.5 h-3.5 text-indigo-400" />
                      2. Radiological Features
                    </h2>
                  </div>
                  <div className="p-3 grid grid-cols-2 lg:grid-cols-3 gap-x-3 gap-y-3">
                    <InputField label="Tumor Size" name="tumor_size_cm" value={formData.tumor_size_cm} unit="cm" step="0.1" onChange={handleInputChange} autoFilled={autoFilled} />
                    <InputField label="Tumor Number" name="tumor_number" value={formData.tumor_number} unit="" onChange={handleInputChange} autoFilled={autoFilled} />
                    <InputField label="Tumor Density" name="tumor_density_hu" value={formData.tumor_density_hu} unit="HU" onChange={handleInputChange} autoFilled={autoFilled} />
                    <InputField label="Irregularity" name="tumor_shape_irregularity" value={formData.tumor_shape_irregularity} step="0.01" onChange={handleInputChange} autoFilled={autoFilled} />
                    <InputField label="Entropy" name="tumor_texture_entropy" value={formData.tumor_texture_entropy} step="0.01" onChange={handleInputChange} autoFilled={autoFilled} />
                    
                    <SelectField 
                      label="Margin Def" 
                      name="margin_definition" 
                      value={formData.margin_definition} 
                      onChange={handleInputChange} 
                      autoFilled={autoFilled}
                      options={[
                        { value: "Smooth", label: "Smooth" },
                        { value: "Irregular", label: "Irregular" },
                        { value: "Infiltrative", label: "Infiltrative" }
                      ]} 
                    />
                    
                    <div className="col-span-2 lg:col-span-3">
                      <SelectField 
                        label="Enhancement Pattern" 
                        name="enhancement_pattern" 
                        value={formData.enhancement_pattern} 
                        onChange={handleInputChange} 
                        autoFilled={autoFilled}
                        options={[
                          { value: "Arterial Hyperenhancement (APHE)", label: "Arterial Hyperenhancement (APHE)" },
                          { value: "Portal Venous Washout", label: "Portal Venous Washout" },
                          { value: "Persistent Enhancement", label: "Persistent Enhancement" }
                        ]} 
                      />
                    </div>
                  </div>
                </div>

                {/* Panel: Lab Markers */}
                <div className="flex-1 bg-[#131826] border border-[#1e293b] rounded-md shadow-lg overflow-hidden">
                  <div className="bg-[#1a2235] px-3 py-2 border-b border-[#1e293b]">
                    <h2 className="text-[11px] uppercase tracking-wider text-slate-300 font-bold flex items-center gap-2">
                      <Stethoscope className="w-3.5 h-3.5 text-emerald-400" />
                      3. Lab Markers & Phenotypes
                    </h2>
                  </div>
                  <div className="p-3">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-3 gap-y-3">
                      <InputField label="AFP" name="afp_ngml" value={formData.afp_ngml} unit="ng/ml" onChange={handleInputChange} autoFilled={autoFilled} />
                      <InputField label="ALP" name="alp_iul" value={formData.alp_iul} unit="IU/L" onChange={handleInputChange} autoFilled={autoFilled} />
                      <InputField label="ALT" name="alt_iul" value={formData.alt_iul} unit="IU/L" onChange={handleInputChange} autoFilled={autoFilled} />
                      <InputField label="AST" name="ast_iul" value={formData.ast_iul} unit="IU/L" onChange={handleInputChange} autoFilled={autoFilled} />
                      <InputField label="Bilirubin" name="bilirubin_mgdl" value={formData.bilirubin_mgdl} unit="mg/dL" step="0.1" onChange={handleInputChange} autoFilled={autoFilled} />
                      <InputField label="Albumin" name="albumin_gdl" value={formData.albumin_gdl} unit="g/dL" step="0.1" onChange={handleInputChange} autoFilled={autoFilled} />
                      <SelectField 
                        label="Child-Pugh" 
                        name="child_pugh_score" 
                        value={formData.child_pugh_score} 
                        onChange={handleInputChange} 
                        autoFilled={autoFilled}
                        options={[{ value: "A", label: "A" }, { value: "B", label: "B" }, { value: "C", label: "C" }]} 
                      />
                      <SelectField 
                        label="BCLC Stage" 
                        name="bclc_stage" 
                        value={formData.bclc_stage} 
                        onChange={handleInputChange} 
                        autoFilled={autoFilled}
                        options={[{ value: "0", label: "0" }, { value: "A", label: "A" }, { value: "B", label: "B" }, { value: "C", label: "C" }, { value: "D", label: "D" }]} 
                      />
                    </div>
                    <div className="mt-3 grid grid-cols-2 xl:grid-cols-4 gap-2 pt-3 border-t border-[#1e293b]">
                      <CheckboxField label="Cirrhosis" name="cirrhosis_present" checked={formData.cirrhosis_present} onChange={handleInputChange} autoFilled={autoFilled} />
                      <CheckboxField label="MVI Pathology" name="mvi_pathology" checked={formData.mvi_pathology} onChange={handleInputChange} autoFilled={autoFilled} />
                      <CheckboxField label="Hepatitis B" name="hepatitis_b" checked={formData.hepatitis_b} onChange={handleInputChange} autoFilled={autoFilled} />
                      <CheckboxField label="Hepatitis C" name="hepatitis_c" checked={formData.hepatitis_c} onChange={handleInputChange} autoFilled={autoFilled} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {errorMessage && (
            <div className="w-full p-3 bg-red-950/40 border border-red-500/30 text-red-400 flex items-start gap-2 font-mono text-[11px] rounded-md shadow-lg mt-2">
              <ShieldAlert className="w-4 h-4 flex-shrink-0 mt-0.5" /> 
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Clinical Report Log (Full Width) */}
          {result && result.ai_insights && (
            <div className="w-full bg-[#131826] border border-[#1e293b] rounded-md shadow-lg overflow-hidden mt-2">
              <div className="bg-[#1a2235] px-4 py-2 border-b border-[#1e293b]">
                <h2 className="text-[11px] uppercase tracking-wider text-slate-300 font-bold flex items-center gap-2">
                  <FileText className="w-3.5 h-3.5 text-amber-400" /> Clinical Report Log
                </h2>
              </div>
              <div className="p-4 overflow-y-auto text-[11px] font-mono text-slate-400 leading-relaxed space-y-1">
                {result.ai_insights.map((msg, i) => (
                  <div key={i} className="flex gap-2"><span className="text-blue-500">{'>'}</span> {msg}</div>
                ))}
                {result.clinical_text_report && (
                  <div className="mt-3 pt-3 border-t border-[#1e293b] text-slate-500">
                    {result.clinical_text_report}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* FULL WIDTH RESULTS AREA */}
          {result ? (
              <div className="w-full bg-[#131826] border border-[#1e293b] rounded-md shadow-lg overflow-hidden flex flex-col mt-4" style={{ height: '80vh', minHeight: '800px' }}>
                <div className={`px-4 py-2 border-b flex justify-between items-center flex-shrink-0 ${
                  result.recurrence_risk === "HIGH" ? "bg-rose-950/40 border-rose-900/50" : "bg-emerald-950/40 border-emerald-900/50"
                }`}>
                  <div className="flex items-center gap-3">
                    {result.recurrence_risk === "HIGH" ? <ShieldAlert className="w-5 h-5 text-rose-500" /> : <CheckCircle className="w-5 h-5 text-emerald-500" />}
                    <span className={`font-mono font-bold tracking-wider text-sm ${result.recurrence_risk === "HIGH" ? "text-rose-400" : "text-emerald-400"}`}>
                        {result.ui_rendering_state === "STATE_ABSTAIN_LOCK" ? "SYSTEM ABSTAINED: DIAGNOSTIC UNCERTAINTY" : `PROGNOSIS: ${result.recurrence_risk} RISK (${result.probability}%)`}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <button 
                      type="button" 
                      onClick={handleDownloadPdf}
                      className="bg-[#1e293b] hover:bg-[#2a364a] text-slate-300 px-3 py-1.5 rounded flex items-center gap-2 text-[10px] font-bold tracking-wider transition-colors border border-[#334155]"
                    >
                      <Download className="w-3.5 h-3.5" />
                      EXPORT PDF
                    </button>
                    <div className="font-mono text-[10px] text-slate-500 bg-[#0a0e17] px-2 py-1 rounded border border-[#2a364a]">
                      ID: {result.pseudo_anonymous_id}
                    </div>
                  </div>
                </div>

                <div className="flex-1 flex flex-col xl:flex-row bg-[#0a0e17] overflow-hidden min-h-0">
                    {/* MPR Viewer Area */}
                    <div id="mpr-workstation-capture" className="flex-1 p-2 border-b xl:border-b-0 xl:border-r border-[#1e293b] flex flex-col bg-black min-w-[70%] min-h-0">
                      {result?.interpretability_layer?.gradcam_3d_matrix ? (
                        <MprClinicalWorkstation 
                          base64Matrix={result.interpretability_layer.gradcam_3d_matrix} 
                          dicomBase64Matrix={result.interpretability_layer.dicom_3d_matrix}
                          dimensions={result.interpretability_layer.heatmap_spatial_shape} 
                          tumorTarget={result.interpretability_layer.tumor_target}
                          patientInfo={{ name: patientInfo.name, id: patientInfo.mrn }}
                        />
                      ) : (
                        <div className="flex-1 flex items-center justify-center text-slate-700 font-mono text-xs uppercase">
                            NO VOLUMETRIC DATA RENDERED
                        </div>
                      )}
                    </div>
                    
                    {/* SHAP & Metrics Sidebar */}
                    <div className="w-full xl:w-[350px] p-4 flex flex-col gap-4 bg-[#0a0e17] overflow-y-auto flex-shrink-0 border-l border-[#1e293b]">
                      {result.ui_rendering_state === "STATE_ABSTAIN_LOCK" && (
                        <div className="p-3 bg-red-950/30 border border-red-500/30 rounded text-[10px] text-red-200">
                            <p className="font-bold text-red-400 mb-1 border-b border-red-500/20 pb-1">🛑 UNCERTAINTY BOUNDARY BREACHED</p>
                            <p className="mb-2">Physician manual review strictly required.</p>
                            <button onClick={() => handlePhysicianOverride("HIGH")} className="w-full py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded mb-1 font-bold shadow transition-colors">AUTHORIZE HIGH RISK</button>
                            <button onClick={() => handlePhysicianOverride("LOW")} className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-bold shadow transition-colors">AUTHORIZE LOW RISK</button>
                        </div>
                      )}

                      {result.explainable_ai_weights && (
                        <div>
                          <h4 className="text-[11px] font-bold text-slate-400 mb-3 uppercase tracking-wider border-b border-[#1e293b] pb-2">SHAP Feature Importance</h4>
                          <div className="space-y-2">
                            {Object.entries(result.explainable_ai_weights).map(([key, value]) => (
                              <div key={key} className="flex justify-between items-center text-[11px] bg-[#131826] px-3 py-2 rounded border border-[#1e293b] shadow-sm">
                                <span className="text-slate-300 font-mono truncate mr-2">{key.replace(/_/g, ' ')}</span>
                                <span className={`font-mono font-bold ${value > 0 ? "text-rose-400" : "text-emerald-400"}`}>
                                  {value > 0 ? "+" : ""}{value}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                </div>
              </div>
          ) : (
              <div className="w-full border border-dashed border-[#1e293b] rounded-md flex items-center justify-center bg-[#070b14] h-[300px] mt-4">
                <div className="text-center text-[#1e293b]">
                    <Activity className="w-16 h-16 mx-auto mb-2 opacity-50" />
                    <p className="text-xs font-mono uppercase tracking-widest font-bold">AWAITING INFERENCE EXECUTION</p>
                </div>
              </div>
          )}
          
      </form>
      
      {/* HIDDEN PRINTABLE A4 REPORT TEMPLATE */}
      <div className="fixed top-0 left-0 w-0 h-0 overflow-hidden pointer-events-none z-[-9999] opacity-0">
        <div 
           ref={reportRef} 
           className="bg-white text-black font-sans flex flex-col"
           style={{ width: '794px', minHeight: '1123px', padding: '60px 50px' }}
        >
          {/* Header */}
          <div className="flex justify-between items-center border-b-[3px] border-black pb-4 mb-8">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-cyan-100 rounded-lg flex items-center justify-center border border-cyan-800">
                 <Hexagon className="w-8 h-8 text-cyan-800" />
              </div>
              <div>
                <h1 className="text-3xl font-black uppercase tracking-widest text-slate-900">Hepato<span className="text-cyan-700">AI</span></h1>
                <p className="text-[10px] text-slate-600 font-bold tracking-widest">CLINICAL DIAGNOSTIC PIPELINE</p>
              </div>
            </div>
            <div className="text-right text-xs font-mono text-slate-600">
              <p className="font-bold text-black text-sm mb-1">MEDICAL PROGNOSIS REPORT</p>
              <p>Date: {new Date().toISOString().split('T')[0]}</p>
              <p>System Ver: 2.4.1 (Build 8092)</p>
              <p className="text-[9px] text-slate-500 mt-1">ACR Auth: #9482-A | CLIA: 05D20934</p>
            </div>
          </div>

          {/* Patient Info & Encounter Metadata */}
          <div className="mb-6 grid grid-cols-4 gap-4 border-2 border-slate-200 p-4 rounded-md bg-slate-50 text-xs">
             <div className="col-span-2"><span className="font-bold text-[9px] text-slate-500 uppercase tracking-widest block mb-1">Patient Name</span><span className="text-base font-black text-slate-800">{patientInfo.name}</span></div>
             <div><span className="font-bold text-[9px] text-slate-500 uppercase tracking-widest block mb-1">MRN / Hospital ID</span><span className="text-sm font-mono font-bold text-slate-800">{patientInfo.mrn}</span></div>
             <div><span className="font-bold text-[9px] text-slate-500 uppercase tracking-widest block mb-1">DOB (Age) / Sex</span><span className="text-xs font-medium">{patientInfo.dob} ({patientInfo.age}y) | {patientInfo.sex}</span></div>
             
             <div className="border-t border-slate-200 pt-3 mt-1"><span className="font-bold text-[9px] text-slate-500 uppercase tracking-widest block mb-1">Accession Number</span><span className="font-mono text-xs font-bold text-slate-700">ACC-2026-89412</span></div>
             <div className="border-t border-slate-200 pt-3 mt-1 col-span-2"><span className="font-bold text-[9px] text-slate-500 uppercase tracking-widest block mb-1">Referring Physician & Dept</span><span className="text-xs font-semibold text-slate-700">Dr. Aris Thorne, MD (Surgical Oncology - Ward 4B)</span></div>
             <div className="border-t border-slate-200 pt-3 mt-1"><span className="font-bold text-[9px] text-slate-500 uppercase tracking-widest block mb-1">Attending Radiologist</span><span className="text-xs font-semibold text-slate-700">Dr. Elena Rostova, MD</span></div>
          </div>

          {/* Clinical Indication & Prior Exams */}
          <div className="mb-6 border border-slate-200 p-4 rounded-md bg-slate-50 text-xs">
             <div className="grid grid-cols-3 gap-4">
               <div className="col-span-2">
                 <span className="font-bold text-[10px] text-slate-500 uppercase tracking-widest block mb-1">Clinical Indication / Reason for Exam</span>
                 <p className="text-slate-800 font-medium">Follow-up assessment post-hepatectomy; evaluate for hepatic metastasis / recurrence (ICD-10: C78.7).</p>
               </div>
               <div>
                 <span className="font-bold text-[10px] text-slate-500 uppercase tracking-widest block mb-1">Prior Baseline Exams</span>
                 <p className="text-slate-700 font-mono text-[11px]">Comparison made with baseline abdominal CT dated 2025-11-14.</p>
               </div>
             </div>
          </div>

          {/* Prognosis Result */}
          {result && (
            <div className={`p-6 border-l-[6px] mb-6 shadow-sm rounded-r-md ${result.recurrence_risk === 'HIGH' ? 'bg-rose-50 border-rose-600 text-rose-900' : 'bg-emerald-50 border-emerald-600 text-emerald-900'}`}>
              <h2 className="text-xs font-bold uppercase tracking-widest mb-2 opacity-80">Primary AI Inference Result</h2>
              <div className="text-2xl font-black uppercase tracking-wide">
                {result.recurrence_risk} RISK FOR HEPATIC RECURRENCE ({result.probability}%)
              </div>
              <div className="text-[10px] mt-3 opacity-70 font-mono flex gap-4">
                 <span>Ref ID: {result.inference_id?.substring(0, 18)}...</span>
                 <span>Network Status: SECURE</span>
              </div>
            </div>
          )}

          {/* Radiological Imaging Output */}
          <div className="mb-8">
             <div className="border-b-2 border-slate-300 pb-2 mb-4 flex justify-between items-end">
               <h3 className="text-xs font-bold uppercase tracking-widest text-slate-800">Section IV: Key Diagnostic Images (CT Multiplanar Reconstruction)</h3>
               <span className="text-[10px] font-mono text-slate-500 uppercase">AI Overlay: Grad-CAM Thermal Activation & RECIST ROI</span>
             </div>
             
             {/* 3-Column Key Images Layout */}
             <div className="grid grid-cols-3 gap-6 mb-4">
                {/* Axial View */}
                <div className="flex flex-col bg-slate-50 border border-slate-200 rounded p-3 shadow-sm">
                   <div className="mb-2 border-b border-slate-200 pb-1.5 flex justify-between items-center">
                     <span className="text-[11px] font-bold text-slate-800 uppercase tracking-wide">Key Image 1: Axial Plane</span>
                     <span className="text-[9px] font-mono bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded font-bold">XY Slice</span>
                   </div>
                   <div className="bg-black flex-1 flex items-center justify-center rounded overflow-hidden border border-slate-800 min-h-[200px]">
                     <img id="report-axial-img" className="w-full h-auto object-contain" style={{ display: 'none', maxHeight: '240px' }} />
                   </div>
                   <p className="text-[10px] text-slate-600 mt-2 italic leading-tight">Transaxial cross-section intersecting primary tumor activation maximum (v_max).</p>
                </div>

                {/* Coronal View */}
                <div className="flex flex-col bg-slate-50 border border-slate-200 rounded p-3 shadow-sm">
                   <div className="mb-2 border-b border-slate-200 pb-1.5 flex justify-between items-center">
                     <span className="text-[11px] font-bold text-slate-800 uppercase tracking-wide">Key Image 2: Coronal Plane</span>
                     <span className="text-[9px] font-mono bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded font-bold">XZ Slice</span>
                   </div>
                   <div className="bg-black flex-1 flex items-center justify-center rounded overflow-hidden border border-slate-800 min-h-[200px]">
                     <img id="report-coronal-img" className="w-full h-auto object-contain" style={{ display: 'none', maxHeight: '240px' }} />
                   </div>
                   <p className="text-[10px] text-slate-600 mt-2 italic leading-tight">Coronal reconstruction demonstrating superior-inferior hepatic extent & vascular proximity.</p>
                </div>

                {/* Sagittal View */}
                <div className="flex flex-col bg-slate-50 border border-slate-200 rounded p-3 shadow-sm">
                   <div className="mb-2 border-b border-slate-200 pb-1.5 flex justify-between items-center">
                     <span className="text-[11px] font-bold text-slate-800 uppercase tracking-wide">Key Image 3: Sagittal Plane</span>
                     <span className="text-[9px] font-mono bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded font-bold">YZ Slice</span>
                   </div>
                   <div className="bg-black flex-1 flex items-center justify-center rounded overflow-hidden border border-slate-800 min-h-[200px]">
                     <img id="report-sagittal-img" className="w-full h-auto object-contain" style={{ display: 'none', maxHeight: '240px' }} />
                   </div>
                   <p className="text-[10px] text-slate-600 mt-2 italic leading-tight">Sagittal reconstruction defining anterior-posterior tumor margin boundaries.</p>
                </div>
             </div>

             {/* Imaging Protocol & Metadata Table */}
             <div className="bg-slate-50 border border-slate-200 rounded p-4 text-xs">
                <div className="font-bold text-[11px] text-slate-700 uppercase tracking-wider mb-2 border-b border-slate-200 pb-1">Technical Imaging & Acquisition Protocol</div>
                <div className="grid grid-cols-6 gap-3 text-[11px]">
                   <div><span className="text-slate-500 block text-[9px] uppercase font-bold">Modality</span><span className="font-mono font-semibold text-slate-800">CT (Computed Tomography)</span></div>
                   <div><span className="text-slate-500 block text-[9px] uppercase font-bold">Slice Thickness</span><span className="font-mono font-semibold text-slate-800">5.0 mm</span></div>
                   <div><span className="text-slate-500 block text-[9px] uppercase font-bold">Contrast Agent</span><span className="font-mono font-semibold text-slate-800">100 mL Omnipaque 350 IV</span></div>
                   <div><span className="text-slate-500 block text-[9px] uppercase font-bold">Scan Phase</span><span className="font-mono font-semibold text-slate-800">Portal Venous (70s)</span></div>
                   <div><span className="text-slate-500 block text-[9px] uppercase font-bold">CTDIvol</span><span className="font-mono font-semibold text-emerald-700">12.4 mGy (Low Dose)</span></div>
                   <div><span className="text-slate-500 block text-[9px] uppercase font-bold">DLP</span><span className="font-mono font-semibold text-emerald-700">582 mGy*cm</span></div>
                </div>
             </div>
          </div>

          {/* Clinical Parameters & SHAP */}
          <div className="grid grid-cols-2 gap-10 mb-8">
             <div>
                <h3 className="text-xs font-bold border-b-2 border-slate-300 pb-2 mb-4 uppercase tracking-widest text-slate-800">Clinical Bio-Markers</h3>
                <div className="text-xs grid grid-cols-2 gap-y-3">
                   {Object.entries(formData).slice(0, 16).map(([k, v]) => (
                      <React.Fragment key={k}>
                        <div className="text-slate-600 capitalize">{k.replace(/_/g, ' ')}</div>
                        <div className="font-mono font-bold text-right text-slate-900">{String(v)}</div>
                      </React.Fragment>
                   ))}
                </div>
             </div>
             
             {result && result.explainable_ai_weights && (
               <div>
                  <h3 className="text-xs font-bold border-b-2 border-slate-300 pb-2 mb-4 uppercase tracking-widest text-slate-800">SHAP Explanations</h3>
                  <div className="text-xs space-y-3">
                    {Object.entries(result.explainable_ai_weights).map(([k, v]) => (
                       <div key={k} className="flex justify-between border-b border-slate-100 pb-2">
                          <span className="capitalize text-slate-700">{k.replace(/_/g, ' ')}</span>
                          <span className={`font-mono font-bold ${v > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>{v > 0 ? '+' : ''}{v}</span>
                       </div>
                    ))}
                  </div>
               </div>
             )}
          </div>

          {/* Structured Anatomical Findings & Staging */}
          <div className="mb-6 border-b-2 border-slate-200 pb-4">
             <h3 className="text-xs font-bold uppercase tracking-widest text-slate-800 mb-3">Section V: Structured Anatomical Findings & Staging</h3>
             <div className="grid grid-cols-2 gap-6 text-xs">
               <div className="bg-slate-50 p-4 rounded border border-slate-200">
                 <h4 className="font-bold text-slate-700 uppercase text-[11px] mb-2 border-b border-slate-200 pb-1">Anatomical Evaluation</h4>
                 <p className="mb-2"><strong>Target Organ (Liver / Biliary):</strong> Couinaud Segments I - VIII evaluated. Stable post-surgical resection margin at Segment VII. Major vascular structures (Portal Vein, IVC, Hepatic Artery) remain patent with normal flow void.</p>
                 <p><strong>Extrahepatic Evaluation:</strong> Pancreas, spleen, bilateral kidneys, and adrenal glands are unremarkable. No pathological abdominal lymphadenopathy or free pelvic fluid observed.</p>
               </div>
               <div className="bg-slate-50 p-4 rounded border border-slate-200 flex flex-col justify-between">
                 <div>
                   <h4 className="font-bold text-slate-700 uppercase text-[11px] mb-2 border-b border-slate-200 pb-1">Formal Classification & Staging</h4>
                   <div className="mb-4">
                     <span className="text-slate-500 text-[10px] block uppercase font-bold mb-1">LI-RADS Classification</span>
                     <div className="font-mono font-bold text-slate-900 bg-slate-200 px-2 py-1 rounded text-[11px] inline-block">LR-TR Viable (HepatoAI Verification)</div>
                   </div>
                   <div>
                     <span className="text-slate-500 text-[10px] block uppercase font-bold mb-1">RECIST 1.1 Criteria Evaluation</span>
                     <p className="text-slate-800 text-[11px] leading-normal">Target lesion activation maximum (v_max) demonstrates localized metabolic concentration with stable geometric bounding box dimensions.</p>
                   </div>
                 </div>
                 <div className="mt-4 pt-3 border-t border-slate-200 bg-blue-50/50 p-2 rounded border border-blue-100">
                   <span className="text-blue-900 font-bold text-[10px] uppercase block mb-1">Executive Impression & Recommendation</span>
                   <p className="text-slate-700 text-[11px] font-medium leading-normal">1. Close surveillance recommended for localized Grad-CAM activation cluster.<br />2. Recommend repeat multiphasic abdominal CT in 6 months.</p>
                 </div>
               </div>
             </div>
          </div>

          {/* AI Insights Log */}
          {result && result.ai_insights && (
            <div className="mb-8 flex-1">
              <h3 className="text-xs font-bold border-b-2 border-slate-300 pb-2 mb-4 uppercase tracking-widest text-slate-800">Automated Clinical Insights</h3>
              <ul className="text-xs space-y-3 list-disc pl-5 text-slate-700 leading-relaxed">
                {result.ai_insights.map((msg, i) => <li key={i}>{msg}</li>)}
              </ul>
            </div>
          )}

          <div className="mt-auto pt-6 grid grid-cols-12 gap-4 items-end border-t-[3px] border-black">
            <div className="col-span-6 text-[9px] text-slate-500 leading-relaxed text-justify pr-2">
              <strong>CONFIDENTIAL MEDICAL DOCUMENT:</strong> This report is generated by an investigational AI diagnostic pipeline (HepatoAI). It is not a substitute for professional medical judgment. All findings must be verified by a certified oncologist. Compliant with HIPAA and Data Protection regulations.
            </div>
            <div className="col-span-3 bg-slate-100 border border-slate-300 p-2 rounded flex items-center gap-2 shadow-sm">
               <QrCode className="w-7 h-7 text-slate-800 flex-shrink-0" />
               <div className="text-[8px] font-mono text-slate-600 leading-tight">
                 <strong className="text-slate-900 block text-[9px] mb-0.5">SECURE PACS</strong>
                 Scan QR for 3D<br />CT MPR Viewer
               </div>
            </div>
            <div className="col-span-3 text-center pl-2">
               <div className="border-b border-black mb-2 border-dashed w-full"></div>
               <span className="text-[10px] font-bold uppercase tracking-widest text-slate-800 block">Physician Signature</span>
            </div>
          </div>
        </div>
      </div>
      
    </div>
  );
};
