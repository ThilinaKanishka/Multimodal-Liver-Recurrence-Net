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
  QrCode,
  RotateCcw,
  Split,
  BookOpen,
  Clock,
  TrendingUp,
  Info
} from "lucide-react";
import axios from "axios";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import MprClinicalWorkstation from "../components/MprClinicalWorkstation";
import PhysicianVerificationNotes from "../components/PhysicianVerificationNotes";

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
  model_certainty_score?: number;
  clinical_narrative_summary?: string;
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
  estimated_recurrence_min_months?: number;
  estimated_recurrence_max_months?: number;
}

const InputField = ({ label, name, value, type="number", unit="", step="1", onChange, autoFilled }: any) => (
  <div className="flex flex-col group relative">
    <label className="text-[10px] uppercase tracking-widest text-slate-400 mb-1 flex justify-between items-center font-bold group-focus-within:text-[#00e5ff] transition-colors duration-300">
      {label}
      {autoFilled && <span className="text-[8px] text-[#00e5ff] bg-[#00e5ff]/10 px-1.5 py-0.5 rounded border border-[#00e5ff]/30 animate-pulse shadow-[0_0_8px_rgba(0,229,255,0.3)]">AUTO</span>}
    </label>
    <div className="relative flex">
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        step={step}
        className={`w-full text-xs font-mono ${autoFilled ? 'bg-[#00e5ff]/10 border-[#00e5ff]/50 text-cyan-100 shadow-[0_0_15px_rgba(0,229,255,0.15)]' : 'bg-[#0a0f18]/60 border-white/10 text-slate-200 hover:bg-[#0f1623]/80'} border rounded-lg py-2 pl-3 ${unit ? 'pr-10' : 'pr-3'} focus:border-[#00e5ff] focus:ring-1 focus:ring-[#00e5ff]/50 focus:bg-[#0a0f18] outline-none transition-all duration-300 backdrop-blur-sm`}
      />
      {unit && (
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
          <span className="text-slate-500 text-[10px] font-bold group-focus-within:text-[#00e5ff]/70 transition-colors">{unit}</span>
        </div>
      )}
    </div>
  </div>
);

const SelectField = ({ label, name, value, options, onChange, autoFilled }: any) => (
  <div className="flex flex-col group relative">
    <label className="text-[10px] uppercase tracking-widest text-slate-400 mb-1 flex justify-between items-center font-bold group-focus-within:text-[#00e5ff] transition-colors duration-300">
      {label}
      {autoFilled && <span className="text-[8px] text-[#00e5ff] bg-[#00e5ff]/10 px-1.5 py-0.5 rounded border border-[#00e5ff]/30 animate-pulse shadow-[0_0_8px_rgba(0,229,255,0.3)]">AUTO</span>}
    </label>
    <div className="relative flex">
      <select
        name={name}
        value={value}
        onChange={onChange}
        className={`w-full text-xs font-mono ${autoFilled ? 'bg-[#00e5ff]/10 border-[#00e5ff]/50 text-cyan-100 shadow-[0_0_15px_rgba(0,229,255,0.15)]' : 'bg-[#0a0f18]/60 border-white/10 text-slate-200 hover:bg-[#0f1623]/80'} border rounded-lg py-2 pl-3 pr-8 focus:border-[#00e5ff] focus:ring-1 focus:ring-[#00e5ff]/50 focus:bg-[#0a0f18] outline-none transition-all duration-300 backdrop-blur-sm appearance-none cursor-pointer`}
      >
        {options.map((opt: any) => <option key={opt.value} value={opt.value} className="bg-[#0f1623] font-sans text-xs">{opt.label}</option>)}
      </select>
      <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none text-slate-500 group-focus-within:text-[#00e5ff] transition-colors">
        <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" fillRule="evenodd"></path></svg>
      </div>
    </div>
  </div>
);

const CheckboxField = ({ label, name, checked, onChange, autoFilled }: any) => (
  <label className={`flex items-center gap-2 p-2 rounded-lg border ${autoFilled ? 'bg-[#00e5ff]/10 border-[#00e5ff]/50 shadow-[0_0_15px_rgba(0,229,255,0.15)]' : 'bg-[#0a0f18]/60 border-white/10 hover:border-white/20 hover:bg-[#0f1623]/80'} cursor-pointer transition-all duration-300 backdrop-blur-sm group relative overflow-hidden`}>
    {checked && <div className="absolute inset-0 bg-gradient-to-r from-[#00e5ff]/10 to-transparent opacity-50"></div>}
    <div className="relative flex items-center justify-center flex-shrink-0">
      <input
        type="checkbox"
        name={name}
        checked={checked}
        onChange={onChange}
        className="peer sr-only"
      />
      <div className="w-3.5 h-3.5 rounded border border-slate-500 bg-black/50 peer-checked:bg-[#00e5ff] peer-checked:border-[#00e5ff] transition-all duration-300 flex items-center justify-center shadow-[inset_0_1px_3px_rgba(0,0,0,0.3)] peer-checked:shadow-[0_0_10px_rgba(0,229,255,0.5)]">
        <svg className={`w-2.5 h-2.5 text-black transform transition-transform duration-300 ${checked ? 'scale-100' : 'scale-0'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>
    </div>
    <span className={`text-[10px] font-bold tracking-wide flex-1 leading-tight transition-colors duration-300 z-10 ${checked ? 'text-[#00e5ff]' : 'text-slate-300 group-hover:text-slate-200'}`}>{label}</span>
    {autoFilled && <span className="text-[8px] font-black text-[#00e5ff] z-10">AUTO</span>}
  </label>
);

export const LongitudinalPredictPage: React.FC<{ onViewHistory?: (id: string) => void; onSwitchToWorkspace?: () => void, user?: any, cdssEnabled?: boolean }> = ({ onViewHistory, onSwitchToWorkspace, user, cdssEnabled = true }) => {
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
  const [pastRecords, setPastRecords] = useState<any[]>([]);
  const [selectedBaselineId, setSelectedBaselineId] = useState<string>("BASE-2026-JAN15-89412");
  const [baselineSearch, setBaselineSearch] = useState<string>("");
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [pipelineStep, setPipelineStep] = useState<"IDLE" | "STEP1" | "STEP2" | "STEP3" | "COMPLETE">("IDLE");
  const [progress, setProgress] = useState<number>(0);
  const [loadingText, setLoadingText] = useState<string>("");
  const [screenFlash, setScreenFlash] = useState<boolean>(false);
  const [showBaselineModal, setShowBaselineModal] = useState<boolean>(false);
  const [cdssReport, setCdssReport] = useState<any>(null);
  const [generatingCdss, setGeneratingCdss] = useState<boolean>(false);
  const reportRef = useRef<HTMLDivElement>(null);

  const handleGenerateCdss = async () => {
    if (!result) return;
    setGeneratingCdss(true);
    setCdssReport(null);
    try {
      const baselineRec = pastRecords.find(r => r._id === selectedBaselineId);
      const baselineRiskStr = baselineRec 
        ? `${(baselineRec.probability * 100).toFixed(1)}% (${baselineRec.recurrence_risk} RISK)`
        : undefined;

      const payload = {
        patient_age: patientInfo.age,
        patient_gender: patientInfo.sex,
        medical_history: formData.clinical_text_report || "No explicit history provided.",
        ai_predicted_risk: `${result.probability}% (${result.recurrence_risk} RISK)`,
        is_longitudinal: true,
        baseline_risk: baselineRiskStr
      };
      
      const res = await axios.post("http://127.0.0.1:8000/api/v1/generate-cdss-report", payload, {
        headers: { "Content-Type": "application/json" }
      });
      setCdssReport(res.data);
    } catch (e) {
      console.error(e);
      alert("Failed to generate CDSS Report.");
    } finally {
      setGeneratingCdss(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!reportRef.current) return;
    try {
      // 1. Capture the individual MPR views cleanly without web UI controls
      const axialFollowupEl = document.getElementById("pdf-axial-capture-followup");
      const coronalFollowupEl = document.getElementById("pdf-coronal-capture-followup");
      const sagittalFollowupEl = document.getElementById("pdf-sagittal-capture-followup");

      const axialBaselineEl = document.getElementById("pdf-axial-capture-baseline");
      const coronalBaselineEl = document.getElementById("pdf-coronal-capture-baseline");
      const sagittalBaselineEl = document.getElementById("pdf-sagittal-capture-baseline");
      
      if (axialFollowupEl) {
        const axialCanvas = await html2canvas(axialFollowupEl, { useCORS: true, backgroundColor: '#000000', scale: 2 });
        const reportAxialImg = document.getElementById("report-axial-img-followup") as HTMLImageElement;
        if (reportAxialImg) { reportAxialImg.src = axialCanvas.toDataURL('image/jpeg', 0.95); reportAxialImg.style.display = 'block'; }
      }

      if (coronalFollowupEl) {
        const coronalCanvas = await html2canvas(coronalFollowupEl, { useCORS: true, backgroundColor: '#000000', scale: 2 });
        const reportCoronalImg = document.getElementById("report-coronal-img-followup") as HTMLImageElement;
        if (reportCoronalImg) { reportCoronalImg.src = coronalCanvas.toDataURL('image/jpeg', 0.95); reportCoronalImg.style.display = 'block'; }
      }

      if (sagittalFollowupEl) {
        const sagittalCanvas = await html2canvas(sagittalFollowupEl, { useCORS: true, backgroundColor: '#000000', scale: 2 });
        const reportSagittalImg = document.getElementById("report-sagittal-img-followup") as HTMLImageElement;
        if (reportSagittalImg) { reportSagittalImg.src = sagittalCanvas.toDataURL('image/jpeg', 0.95); reportSagittalImg.style.display = 'block'; }
      }

      if (axialBaselineEl) {
        const axialCanvas = await html2canvas(axialBaselineEl, { useCORS: true, backgroundColor: '#000000', scale: 2 });
        const reportAxialImg = document.getElementById("report-axial-img-baseline") as HTMLImageElement;
        if (reportAxialImg) { reportAxialImg.src = axialCanvas.toDataURL('image/jpeg', 0.95); reportAxialImg.style.display = 'block'; }
      }

      if (coronalBaselineEl) {
        const coronalCanvas = await html2canvas(coronalBaselineEl, { useCORS: true, backgroundColor: '#000000', scale: 2 });
        const reportCoronalImg = document.getElementById("report-coronal-img-baseline") as HTMLImageElement;
        if (reportCoronalImg) { reportCoronalImg.src = coronalCanvas.toDataURL('image/jpeg', 0.95); reportCoronalImg.style.display = 'block'; }
      }

      if (sagittalBaselineEl) {
        const sagittalCanvas = await html2canvas(sagittalBaselineEl, { useCORS: true, backgroundColor: '#000000', scale: 2 });
        const reportSagittalImg = document.getElementById("report-sagittal-img-baseline") as HTMLImageElement;
        if (reportSagittalImg) { reportSagittalImg.src = sagittalCanvas.toDataURL('image/jpeg', 0.95); reportSagittalImg.style.display = 'block'; }
      }
      
      // Give DOM a tick to update the images
      await new Promise(r => setTimeout(r, 150));

      // Capture the full hidden A4 report
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
      pdf.save(`HepatoAI_Longitudinal_Report_${patientInfo.mrn || 'Unknown'}.pdf`);
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
        
        if (data.is_new_patient || (!data.has_history && !data.past_records?.length)) {
            alert("⚠️ NEW PATIENT DETECTED: No prior historical baseline records found for this patient. Automatically switching to primary Diagnostic Workspace.");
            if (onSwitchToWorkspace) {
                onSwitchToWorkspace();
            }
            setHistoryInfo(null);
            setPastRecords([]);
        } else if (data.has_history && data.pseudo_anonymous_id) {
            setHistoryInfo({ has_history: true, pseudo_id: data.pseudo_anonymous_id, count: data.total_past_scans || 1 });
            if (data.past_records && data.past_records.length > 0) {
                setPastRecords(data.past_records);
                setSelectedBaselineId(data.past_records[0].inference_id);
                setShowBaselineModal(true);
            }
        } else {
            setHistoryInfo(null);
            setPastRecords([]);
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
    setLoadingText("Aligning Historical Baseline Scan...");

    const payload = new FormData();
    payload.append("clinical_data", JSON.stringify(formData));
    if (imageFile) payload.append("ct_scan", imageFile);
    if (pdfFile) payload.append("text_report_pdf", pdfFile);
    if (user && user.id) payload.append("doctor_id", user.id);

    // Start API request in parallel
    const apiPromise = axios.post("http://127.0.0.1:8000/api/v1/predict", payload, {
      headers: { "Content-Type": "multipart/form-data" },
    }).catch((error: any) => ({ error }));

    // Step 1 (0s - 2s) - Image Processing
    await new Promise(r => setTimeout(r, 2000));
    
    // Step 2 (2s - 4s) - Text Processing
    setPipelineStep("STEP2");
    setProgress(66);
    setLoadingText("Computing Treatment Response Deltas...");
    await new Promise(r => setTimeout(r, 2000));

    // Step 3 (4s - 6s) - The Fusion
    setPipelineStep("STEP3");
    setProgress(100);
    setLoadingText("Registering Multi-Epoch 3D Volumetric Comparison...");
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
        physician_notes: "Manual diagnostic override due to epistemic uncertainty abstention in longitudinal assessment."
      });
      alert("Override successfully integrated into the immutable ledger.");
    } catch (error) {
      alert("Error saving override.");
    }
  };

  const handleResetWorkspace = () => {
    setFormData({
      tumor_size_cm: "",
      afp_ngml: "",
      alp_iul: "",
      bilirubin_mgdl: "",
      albumin_gdl: "",
      platelet_k_ul: "",
      alt_iul: "",
      ast_iul: "",
      bclc_stage: "A",
      child_pugh_score: "A",
      cirrhosis_present: false,
      mvi_pathology: false,
      hepatitis_b: false,
      hepatitis_c: false,
      enhancement_pattern: "Arterial Hyperenhancement (APHE)"
    } as any);
    setPatientInfo({
      mrn: "---",
      name: "NO PATIENT LOADED",
      dob: "---",
      age: "-",
      sex: "-",
      attending: "---"
    });
    setImageFile(null);
    setImagePreview(null);
    setPdfFile(null);
    setLoading(false);
    setExtracting(false);
    setAutoFilled(false);
    setHistoryInfo(null);
    setPastRecords([]);
    setResult(null);
    setErrorMessage(null);
    setPipelineStep("IDLE");
    setProgress(0);
    setLoadingText("");
    setShowBaselineModal(false);
  };

  return (
    <div className="flex-1 flex flex-col min-h-full relative">
      <style>{`
        @keyframes slideDown {
          0% { transform: translateY(-100%); opacity: 0; }
          50% { opacity: 1; }
          100% { transform: translateY(100%); opacity: 0; }
        }
        @keyframes slideUp {
          0% { transform: translateY(100%); opacity: 0; }
          50% { opacity: 1; }
          100% { transform: translateY(-100%); opacity: 0; }
        }
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
      
      {/* Immersive Animated Background */}
      <div className="absolute top-[-20%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-[radial-gradient(circle,rgba(0,184,212,0.08),transparent_60%)] blur-[100px] animate-[pulse_10s_ease-in-out_infinite_alternate] pointer-events-none z-0"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[40vw] h-[40vw] rounded-full bg-[radial-gradient(circle,rgba(0,255,157,0.05),transparent_60%)] blur-[120px] animate-[pulse_8s_ease-in-out_infinite_alternate-reverse] pointer-events-none z-0"></div>
      <div className="absolute top-[30%] left-[40%] w-[30vw] h-[30vw] rounded-full bg-[radial-gradient(circle,rgba(111,66,193,0.05),transparent_60%)] blur-[100px] animate-[pulse_12s_ease-in-out_infinite_alternate] pointer-events-none z-0"></div>

      {/* Subtle Screen Flash on Completion */}
      <div className={`fixed inset-0 bg-[#00b8d4] pointer-events-none transition-opacity duration-300 z-50 ${
        screenFlash ? "opacity-15" : "opacity-0"
      }`} />
      {/* TOP HEADER: Premium Glassmorphic Banner */}
      <div className="h-14 bg-[#0a0f18]/60 backdrop-blur-xl border-b border-white/10 flex items-center px-6 justify-between flex-shrink-0 shadow-[0_4px_30px_rgba(0,0,0,0.5)] sticky top-0 z-40">
          <div className="flex items-center gap-5 text-xs">
            <div className="flex items-center gap-2 bg-black/40 px-3 py-1.5 rounded-lg border border-white/10 shadow-inner">
              <span className="text-slate-500 font-bold uppercase tracking-widest text-[9px]">MRN</span>
              <span className="font-mono text-[#00e5ff] font-black tracking-wider text-xs drop-shadow-[0_0_5px_rgba(0,229,255,0.3)]">{patientInfo.mrn}</span>
            </div>
            <span className="font-black text-slate-100 tracking-wider text-sm uppercase drop-shadow-md">{patientInfo.name}</span>
            <span className="w-1 h-1 rounded-full bg-slate-600"></span>
            <span className="text-slate-400 font-mono text-[10px] uppercase font-bold tracking-widest flex items-center gap-2"><Clock className="w-3.5 h-3.5 opacity-50"/> DOB: <span className="text-slate-300">{patientInfo.dob}</span> {patientInfo.age !== "-" ? <span className="bg-slate-800/50 px-1.5 py-0.5 rounded text-slate-200">{patientInfo.age}Y</span> : ""}</span>
            <span className="w-1 h-1 rounded-full bg-slate-600"></span>
            <span className="text-slate-400 font-mono text-[10px] uppercase font-bold tracking-widest flex items-center gap-2"><Users className="w-3.5 h-3.5 opacity-50"/> Sex: <span className="text-slate-200">{patientInfo.sex}</span></span>
            <span className="w-1 h-1 rounded-full bg-slate-600"></span>
            <span className="text-slate-400 font-mono text-[10px] uppercase font-bold tracking-widest flex items-center gap-2"><Stethoscope className="w-3.5 h-3.5 opacity-50"/> Attending: <span className="text-slate-200">{patientInfo.attending}</span></span>
          </div>
          <div className="flex items-center gap-4">
             <button
               type="button"
               onClick={handleResetWorkspace}
               className="group relative overflow-hidden bg-[#0f1623] hover:bg-[#152033] text-slate-300 px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all duration-300 border border-white/10 shadow-lg flex items-center gap-2 hover:border-blue-500/50 hover:text-white hover:shadow-[0_0_15px_rgba(59,130,246,0.3)]"
               title="Clear active patient encounter and reset workspace"
             >
               <div className="absolute inset-0 bg-gradient-to-r from-blue-600/0 via-blue-500/10 to-blue-600/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
               <RotateCcw className="w-3.5 h-3.5 group-hover:-rotate-180 transition-transform duration-500" />
               NEW ENCOUNTER
             </button>
             <div className="flex items-center gap-2 text-[10px] font-mono font-black tracking-widest text-[#00ff9d] bg-[#00ff9d]/5 px-3 py-1.5 rounded-lg border border-[#00ff9d]/20 shadow-[0_0_15px_rgba(0,255,157,0.1)]">
                <div className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00ff9d] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00ff9d]"></span>
                </div>
                SYSTEM SECURE
             </div>
             <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 bg-black/40 px-3 py-1.5 rounded-lg border border-white/5">{new Date().toISOString().split('T')[0]}</div>
             <div className="h-6 w-px bg-gradient-to-b from-transparent via-white/10 to-transparent mx-2"></div>
             <div className="text-[11px] font-bold tracking-wide text-slate-200 flex items-center gap-2">
               <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center border border-white/20 shadow-md">
                 <span className="text-white text-[10px] font-black">{user?.name?.charAt(0) || "U"}</span>
               </div>
               <div className="flex flex-col">
                 <span>{user ? `Dr. ${user.name}` : "Unknown User"}</span>
                 <span className="text-[9px] text-blue-400 font-mono uppercase tracking-widest">{user?.level || "Clinician"}</span>
               </div>
             </div>
          </div>
        </div>

        {/* MAIN WORKSTATION GRID */}
        <form onSubmit={handleSubmit} className="flex-1 p-6 flex flex-col gap-6 relative z-10">
          
          {/* TOP INPUT ROW */}
          <div className="flex flex-col xl:flex-row gap-6 w-full items-stretch">
            {/* LEFT COLUMN: Data Sources */}
            <div className="w-full xl:w-[420px] flex flex-col gap-6 flex-shrink-0">
              
              {/* Panel: Diagnostic Input */}
              <div className="bg-[#0f1522]/60 backdrop-blur-2xl border border-white/10 rounded-2xl flex flex-col shadow-[0_8px_32px_rgba(0,0,0,0.5)] relative overflow-hidden h-full group"
                ><div className="absolute inset-0 bg-gradient-to-br from-[#00e5ff]/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>
                <div className="bg-gradient-to-r from-black/40 to-transparent px-5 py-4 border-b border-white/10 flex items-center justify-between z-10 relative">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-[#00e5ff] to-blue-600 shadow-[0_0_10px_#00e5ff]"></div>
                  <h2 className="text-[12px] uppercase tracking-[0.2em] text-white font-black flex items-center gap-3 drop-shadow-md">
                    <Database className="w-4 h-4 text-[#00e5ff] drop-shadow-[0_0_8px_rgba(0,229,255,0.6)]" />
                    1. Diagnostic Pipeline
                  </h2>
                </div>
                <div className="p-4 flex flex-col gap-4 flex-1 justify-start max-h-[calc(100vh-260px)] overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent relative z-10">
                  <div className={`border-2 rounded-xl p-4 min-h-[160px] flex flex-col items-center justify-center relative flex-1 transition-all duration-500 group/drop cursor-pointer overflow-hidden ${
                    pipelineStep === "STEP1" || pipelineStep === "STEP3"
                      ? "border-[#00e5ff] bg-[#00e5ff]/5 shadow-[0_0_30px_rgba(0,229,255,0.2),inset_0_0_20px_rgba(0,229,255,0.1)]"
                      : "border-dashed border-white/10 hover:border-[#00e5ff]/40 bg-black/30 hover:bg-[#00e5ff]/5"
                  }`}>
                    {/* Futuristic Scanning Effect */}
                    {(pipelineStep === "STEP1" || pipelineStep === "STEP3") && (
                      <>
                         <div className="absolute top-0 bottom-0 left-0 w-full bg-[linear-gradient(to_bottom,transparent,rgba(0,229,255,0.2),transparent)] animate-[pulse_1.5s_infinite]"></div>
                         <div className="absolute top-0 left-0 w-full h-[2px] bg-[#00e5ff] shadow-[0_0_15px_#00e5ff,0_0_30px_#00e5ff] animate-[ping_2s_infinite]"></div>
                      </>
                    )}
                    <input type="file" accept=".dcm,image/dicom,application/dicom,*/*" onChange={handleImageChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" disabled={loading} />
                    {imagePreview ? (
                      imagePreview === "DICOM_PLACEHOLDER" ? (
                        <div className={`flex flex-col items-center gap-3 transition-colors duration-500 relative z-10 ${pipelineStep === "STEP1" || pipelineStep === "STEP3" ? "text-[#00e5ff]" : "text-[#00b8d4]"}`}>
                          <div className="relative w-16 h-16 flex items-center justify-center mb-2">
                            {/* Orbital Rings */}
                            <svg className={`absolute inset-0 w-full h-full text-[#00e5ff] ${pipelineStep === "STEP1" ? 'animate-[spin_3s_linear_infinite] opacity-100' : 'opacity-30'}`} viewBox="0 0 100 100" fill="none">
                               <circle cx="50" cy="50" r="48" stroke="currentColor" strokeWidth="2" strokeDasharray="60 40" strokeLinecap="round" />
                               <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="1.5" strokeDasharray="30 70" strokeLinecap="round" className="animate-[spin_4s_linear_infinite_reverse]" />
                            </svg>
                            <Database className={`w-8 h-8 transition-all duration-500 ${pipelineStep === "STEP1" || pipelineStep === "STEP3" ? "animate-pulse drop-shadow-[0_0_15px_#00e5ff] scale-110" : "opacity-90"}`} />
                          </div>
                          <div className="flex items-center gap-2 bg-black/60 px-3 py-1.5 rounded-lg border border-white/10 shadow-lg backdrop-blur-md">
                            <CheckCircle className={`w-4 h-4 flex-shrink-0 ${pipelineStep === "STEP1" ? "animate-ping text-[#00e5ff]" : "text-[#00e5ff]"}`} />
                            <span className="text-[11px] font-mono font-bold truncate max-w-[180px] text-white tracking-wider">{imageFile?.name || "DICOM Loaded"}</span>
                          </div>
                          <span className={`text-[9px] font-black px-3 py-1 mt-1 rounded-md tracking-[0.2em] border transition-all ${pipelineStep === "STEP1" ? "bg-[#00e5ff]/20 text-[#00e5ff] border-[#00e5ff]/50 shadow-[0_0_15px_rgba(0,229,255,0.4)] animate-pulse" : "bg-cyan-950/60 text-cyan-300 border-cyan-800/50"}`}>
                            {pipelineStep === "STEP1" ? "EXTRACTING RADIOMICS..." : "3D VOLUME READY"}
                          </span>
                        </div>
                      ) : (
                        <div className="relative w-full flex justify-center z-10">
                          <img src={imagePreview} alt="Preview" className={`max-h-28 rounded-lg object-cover shadow-2xl transition-all duration-500 border border-white/10 ${pipelineStep === "STEP1" || pipelineStep === "STEP3" ? "ring-2 ring-[#00e5ff] ring-offset-2 ring-offset-[#0a0f18] shadow-[0_0_30px_rgba(0,229,255,0.5)] scale-105" : ""}`} />
                        </div>
                      )
                    ) : (
                      <div className="text-center text-slate-400 group-hover/drop:text-[#00e5ff] transition-all duration-300 transform group-hover/drop:-translate-y-1">
                        <div className="w-14 h-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-3 group-hover/drop:bg-[#00e5ff]/10 group-hover/drop:border-[#00e5ff]/30 group-hover/drop:shadow-[0_0_20px_rgba(0,229,255,0.2)] transition-all">
                          <Upload className="w-6 h-6 opacity-70 group-hover/drop:opacity-100 group-hover/drop:scale-110 transition-transform" />
                        </div>
                        <p className="text-[11px] uppercase tracking-[0.2em] font-black">Load DICOM Volume</p>
                        <p className="text-[9px] text-slate-500 mt-1 font-mono uppercase">Drag & Drop or Click</p>
                      </div>
                    )}
                  </div>

                  {/* High-Tech Data Fusion Connector */}
                  <div className="flex items-center justify-center -my-3 z-20 relative h-12">
                    <div className={`h-full transition-all duration-700 ${
                      pipelineStep === "STEP3" 
                        ? "w-[3px] bg-gradient-to-b from-[#00e5ff] via-[#00ff9d] to-[#00e5ff] shadow-[0_0_20px_#00e5ff] animate-pulse" 
                        : "w-px bg-white/10"
                    }`} />
                    {pipelineStep === "STEP3" && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        {/* Data flowing animation */}
                        <div className="absolute top-0 w-1.5 h-6 bg-gradient-to-b from-transparent via-[#00e5ff] to-transparent shadow-[0_0_15px_#00e5ff] animate-[slideDown_1s_ease-in-out_infinite]"></div>
                        <div className="absolute bottom-0 w-1.5 h-6 bg-gradient-to-t from-transparent via-[#00ff9d] to-transparent shadow-[0_0_15px_#00ff9d] animate-[slideUp_1s_ease-in-out_infinite_0.5s]"></div>
                        
                        <div className="bg-[#0f1623] border-2 border-[#00e5ff] text-[#00e5ff] text-[10px] font-black uppercase tracking-[0.2em] px-4 py-2 rounded-xl shadow-[0_0_30px_rgba(0,229,255,0.6)] flex items-center gap-3 z-30 backdrop-blur-md">
                          <Hexagon className="w-4 h-4 animate-spin-slow" /> 
                          <span>Data Fusion Active</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className={`border-2 rounded-xl p-4 min-h-[160px] flex flex-col justify-center items-center relative transition-all duration-500 group/drop cursor-pointer flex-1 overflow-hidden ${
                    pipelineStep === "STEP2" || pipelineStep === "STEP3"
                      ? "border-[#00ff9d] bg-[#00ff9d]/5 shadow-[0_0_30px_rgba(0,255,157,0.2),inset_0_0_20px_rgba(0,255,157,0.1)]"
                      : "border-dashed border-white/10 hover:border-[#00ff9d]/40 bg-black/30 hover:bg-[#00ff9d]/5"
                  }`}>
                    {/* Futuristic Scanning Effect */}
                    {(pipelineStep === "STEP2" || pipelineStep === "STEP3") && (
                      <>
                         <div className="absolute top-0 bottom-0 left-0 w-full bg-[linear-gradient(to_bottom,transparent,rgba(0,255,157,0.2),transparent)] animate-[pulse_1.5s_infinite]"></div>
                         <div className="absolute bottom-0 left-0 w-full h-[2px] bg-[#00ff9d] shadow-[0_0_15px_#00ff9d,0_0_30px_#00ff9d] animate-[ping_2s_infinite]"></div>
                      </>
                    )}
                    <input type="file" accept=".pdf" onChange={handlePdfChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" disabled={loading} />
                    {pdfFile ? (
                      <div className={`flex flex-col items-center gap-3 transition-colors duration-500 relative z-10 ${pipelineStep === "STEP2" || pipelineStep === "STEP3" ? "text-[#00ff9d]" : "text-emerald-400"}`}>
                        <div className="relative w-16 h-16 flex items-center justify-center mb-1">
                          {/* Orbital Rings */}
                          <svg className={`absolute inset-0 w-full h-full text-[#00ff9d] ${pipelineStep === "STEP2" ? 'animate-[spin_3s_linear_infinite_reverse] opacity-100' : 'opacity-30'}`} viewBox="0 0 100 100" fill="none">
                             <circle cx="50" cy="50" r="48" stroke="currentColor" strokeWidth="2" strokeDasharray="30 20 50 10" strokeLinecap="round" />
                             <polygon points="50,5 55,15 45,15" fill="currentColor" className="animate-pulse" />
                          </svg>
                          <FileText className={`w-7 h-7 transition-all duration-500 ${pipelineStep === "STEP2" || pipelineStep === "STEP3" ? "animate-pulse drop-shadow-[0_0_15px_#00ff9d] scale-110" : "opacity-90"}`} />
                        </div>
                        <div className="flex items-center gap-2 bg-black/60 px-3 py-1.5 rounded-lg border border-white/10 shadow-lg backdrop-blur-md">
                          <CheckCircle className={`w-4 h-4 ${pipelineStep === "STEP2" ? "animate-ping text-[#00ff9d]" : "text-[#00ff9d]"}`} />
                          <span className="text-[11px] font-mono font-bold truncate max-w-[200px] text-white tracking-wider">{pdfFile.name}</span>
                        </div>
                        {pipelineStep === "STEP2" && (
                          <span className="text-[9px] font-black px-3 py-1 mt-1 rounded-md tracking-[0.2em] border bg-[#00ff9d]/20 text-[#00ff9d] border-[#00ff9d]/50 shadow-[0_0_15px_rgba(0,255,157,0.4)] animate-pulse">
                            NLP EXTRACTION...
                          </span>
                        )}
                      </div>
                    ) : (
                      <div className="text-center text-slate-400 group-hover/drop:text-[#00ff9d] transition-all duration-300 transform group-hover/drop:-translate-y-1">
                         <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-2 group-hover/drop:bg-[#00ff9d]/10 group-hover/drop:border-[#00ff9d]/30 group-hover/drop:shadow-[0_0_20px_rgba(0,255,157,0.2)] transition-all">
                           <FileText className="w-5 h-5 opacity-70 group-hover/drop:opacity-100 group-hover/drop:scale-110 transition-transform" />
                         </div>
                         <p className="text-[11px] uppercase tracking-[0.2em] font-black">Load Clinical PDF</p>
                      </div>
                    )}
                  </div>
                  
                  {/* Technical Loading Status & Progress Bar */}
                  {loading && (
                    <div className="bg-[#040810] border border-[#00b8d4]/50 rounded-lg p-4 flex flex-col gap-3 shadow-[0_0_20px_rgba(0,184,212,0.15)] transition-all duration-300 mt-2 relative overflow-hidden">
                      {/* Background grid for high-tech feel */}
                      <div className="absolute inset-0 bg-[linear-gradient(to_right,#00b8d4_1px,transparent_1px),linear-gradient(to_bottom,#00b8d4_1px,transparent_1px)] bg-[size:1rem_1rem] opacity-10"></div>
                      
                      <div className="flex justify-between items-center text-[10px] font-mono relative z-10">
                        <span className="text-[#00e5ff] font-bold flex items-center gap-2 drop-shadow-[0_0_5px_rgba(0,229,255,0.8)] tracking-wide">
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00e5ff] opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00b8d4]"></span>
                          </span>
                          {loadingText}
                        </span>
                        <span className="text-[#00e5ff] font-black tracking-widest drop-shadow-[0_0_5px_#00e5ff] text-xs">{progress}%</span>
                      </div>
                      
                      <div className="w-full bg-black/40 backdrop-blur-sm h-3 rounded-full overflow-hidden border border-[#00b8d4]/40 relative z-10 shadow-inner">
                        {/* Progress Bar Fill */}
                        <div 
                          className="bg-gradient-to-r from-[#00b8d4] via-[#00e5ff] to-[#00b8d4] h-full transition-all duration-500 ease-out shadow-[0_0_15px_rgba(0,229,255,0.8)] relative"
                          style={{ width: `${progress}%` }}
                        >
                           {/* Inner shine */}
                           <div className="absolute top-0 bottom-0 left-0 right-0 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.6),transparent)] animate-[pulse_1.5s_infinite]"></div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Auto-Extract Status */}
                  {!loading && (
                    <div className="h-auto min-h-[32px] flex flex-col items-center justify-center gap-2 w-full">
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
                        <div className="w-full bg-[#0d121f] border border-indigo-500/40 rounded-md p-3 flex flex-col gap-3 shadow-2xl animate-in fade-in slide-in-from-top-2 duration-500">
                          <div className="flex items-center justify-between border-b border-indigo-500/30 pb-2">
                            <div className="flex items-center gap-2 text-indigo-300 text-[11px] font-bold tracking-wider uppercase">
                               <Activity className="w-4 h-4 text-indigo-400 animate-pulse" />
                               <span>Prior Baseline Records ({historyInfo.count})</span>
                            </div>
                            <button 
                               type="button"
                               onClick={(e) => { e.preventDefault(); onViewHistory?.(historyInfo.pseudo_id); }}
                               className="bg-indigo-600 hover:bg-indigo-500 text-white text-[9px] px-2.5 py-1 rounded shadow-md uppercase tracking-widest transition-colors font-bold"
                            >
                               EHR Ledger
                            </button>
                          </div>
                          
                          {/* Currently Selected Baseline Summary */}
                          {pastRecords.length > 0 && (
                            <div className="flex flex-col gap-2.5">
                              {pastRecords.find(r => r.inference_id === selectedBaselineId) && (
                                <div className="bg-indigo-950/60 border border-indigo-400/40 rounded p-2.5 flex flex-col gap-1.5 shadow">
                                  <div className="flex items-center justify-between border-b border-indigo-500/30 pb-1">
                                    <div className="flex items-center gap-1.5 overflow-hidden">
                                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-ping flex-shrink-0"></span>
                                      <span className="text-[11px] font-mono font-bold text-indigo-200 truncate">
                                        {pastRecords.find(r => r.inference_id === selectedBaselineId)?.scan_title}
                                      </span>
                                    </div>
                                    <span className="text-[9px] font-mono bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-1.5 py-0.5 rounded font-bold flex-shrink-0 ml-2">
                                      ACTIVE BASELINE
                                    </span>
                                  </div>
                                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-0.5">
                                    <span className="text-emerald-400 font-sans truncate mr-2">📄 {pastRecords.find(r => r.inference_id === selectedBaselineId)?.report_title}</span>
                                    <span className="flex-shrink-0">Tumor: {pastRecords.find(r => r.inference_id === selectedBaselineId)?.tumor_size_cm}cm | AFP: {pastRecords.find(r => r.inference_id === selectedBaselineId)?.afp_ngml}</span>
                                  </div>
                                </div>
                              )}

                              <button
                                type="button"
                                onClick={() => setShowBaselineModal(true)}
                                className="w-full py-2 bg-[#131826] hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/40 rounded text-xs font-bold tracking-wider transition-all shadow-md uppercase flex items-center justify-center gap-2"
                              >
                                <Search className="w-3.5 h-3.5" />
                                Change / Select Baseline Record
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                </div>
                <div className="p-4 bg-gradient-to-t from-black/80 to-transparent backdrop-blur-md border-t border-white/10 sticky bottom-0 z-20 rounded-b-2xl shadow-[0_-10px_30px_rgba(0,0,0,0.5)] mt-auto">
                  <button
                    type="submit"
                    disabled={loading || (!imageFile && !pdfFile) || (errorMessage !== null && errorMessage.includes('PATIENT MISMATCH'))}
                    className={`relative w-full h-14 rounded-xl flex items-center justify-center font-black text-xs uppercase tracking-[0.25em] transition-all duration-500 overflow-hidden group shadow-lg ${
                      loading || (!imageFile && !pdfFile) || (errorMessage !== null && errorMessage.includes('PATIENT MISMATCH'))
                        ? loading
                          ? "bg-black/50 border border-[#00e5ff] shadow-[0_0_30px_rgba(0,229,255,0.3),inset_0_0_20px_rgba(0,229,255,0.2)]"
                          : "bg-black/30 text-slate-600 cursor-not-allowed border border-white/5" 
                        : "bg-gradient-to-r from-blue-600 via-[#00e5ff] to-blue-600 bg-[length:200%_auto] hover:bg-[position:right_center] text-white border border-white/20 shadow-[0_0_25px_rgba(0,229,255,0.5)] hover:shadow-[0_0_40px_rgba(0,229,255,0.8)] hover:scale-[1.02] active:scale-[0.98]"
                    }`}
                  >
                    {loading && (
                      <>
                        <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.2)_50%,transparent_75%,transparent_100%)] bg-[length:250%_250%,100%_100%] animate-[shimmer_2s_infinite]"></div>
                        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#00e5ff] to-transparent shadow-[0_0_10px_#00e5ff] animate-[pulse_1s_infinite]"></div>
                        <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#00e5ff] to-transparent shadow-[0_0_10px_#00e5ff] animate-[pulse_1s_infinite_0.5s]"></div>
                      </>
                    )}
                    
                    <div className={`relative z-10 flex items-center justify-center gap-3 h-full w-full transition-all duration-300 ${loading ? "text-[#00e5ff] drop-shadow-[0_0_10px_rgba(0,229,255,1)]" : "drop-shadow-md"}`}>
                      {loading ? (
                        <>
                          <div className="relative flex items-center justify-center w-6 h-6">
                            <svg className="absolute w-full h-full text-[#00e5ff] animate-[spin_1.5s_linear_infinite]" viewBox="0 0 24 24" fill="none">
                              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2.5" strokeDasharray="15 85" strokeLinecap="round" />
                            </svg>
                            <svg className="absolute w-full h-full text-white animate-[spin_1s_linear_infinite_reverse] scale-75" viewBox="0 0 24 24" fill="none">
                              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeDasharray="20 40" strokeLinecap="round" />
                            </svg>
                            <div className="w-1.5 h-1.5 bg-white rounded-full shadow-[0_0_10px_white] animate-ping"></div>
                          </div>
                          <span className="animate-pulse">Processing Telemetry...</span>
                        </>
                      ) : (
                        <div className="flex items-center gap-3">
                           <Activity className="w-5 h-5 opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all duration-300" />
                           <span>{!imageFile && !pdfFile ? "Upload Data Required" : "Initialize Compare Pipeline"}</span>
                        </div>
                      )}
                    </div>
                  </button>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: Clinical Form */}
            <div className="flex-1 flex flex-col gap-6 min-w-0 z-10">
              
              <div className="flex flex-col xl:flex-row gap-6 flex-shrink-0">
                
                {/* Panel: Radiology Form - Glassmorphic Redesign */}
                <div className="flex-1 bg-[#0f1522]/60 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.5)] overflow-hidden relative group">
                  <div className="absolute inset-0 bg-gradient-to-bl from-indigo-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>
                  <div className="bg-gradient-to-r from-black/40 to-transparent px-5 py-4 border-b border-white/10 relative">
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-indigo-400 to-purple-600 shadow-[0_0_10px_#818cf8]"></div>
                    <h2 className="text-[12px] uppercase tracking-[0.2em] text-white font-black flex items-center gap-3 drop-shadow-md">
                      <Microscope className="w-4 h-4 text-indigo-400 drop-shadow-[0_0_8px_rgba(99,102,241,0.6)]" />
                      2. Radiological Features
                    </h2>
                  </div>
                  <div className="p-5 grid grid-cols-2 lg:grid-cols-3 gap-x-5 gap-y-5 relative z-10">
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

                {/* Panel: Lab Markers - Glassmorphic Redesign */}
                <div className="flex-1 bg-[#0f1522]/60 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.5)] overflow-hidden relative group">
                  <div className="absolute inset-0 bg-gradient-to-bl from-emerald-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>
                  <div className="bg-gradient-to-r from-black/40 to-transparent px-5 py-4 border-b border-white/10 relative">
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-emerald-400 to-teal-600 shadow-[0_0_10px_#34d399]"></div>
                    <h2 className="text-[12px] uppercase tracking-[0.2em] text-white font-black flex items-center gap-3 drop-shadow-md">
                      <Stethoscope className="w-4 h-4 text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
                      3. Lab Markers & Phenotypes
                    </h2>
                  </div>
                  <div className="p-5 relative z-10">
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
                    <div className="mt-4 grid grid-cols-2 gap-3 pt-4 border-t border-white/10 relative z-10">
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
            <div className="w-full bg-gradient-to-b from-[#0a0f18]/60 to-[#060b15]/80 backdrop-blur-xl border border-white/10 rounded-md shadow-lg overflow-hidden mt-2">
              <div className="bg-[#1a2235] px-4 py-2 border-b border-[#1e293b] flex items-center justify-between">
                <h2 className="text-[11px] uppercase tracking-wider text-slate-300 font-bold flex items-center gap-2">
                  <FileText className="w-3.5 h-3.5 text-amber-400" /> Clinical Report Log
                </h2>
                {cdssEnabled && (
                  <button
                    type="button"
                    onClick={handleGenerateCdss}
                    disabled={generatingCdss}
                    className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-[10px] px-3 py-1 rounded shadow uppercase tracking-widest font-bold flex items-center gap-1.5 transition-colors"
                  >
                    {generatingCdss ? (
                      <><span className="animate-spin inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full"></span> GENERATING AI REPORT...</>
                    ) : (
                      <><Stethoscope className="w-3.5 h-3.5" /> GENERATE GEN-AI CDSS REPORT</>
                    )}
                  </button>
                )}
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
                
                {/* Gen AI CDSS Report Render */}
                {cdssReport && (
                  <div className="mt-5 border border-indigo-500/40 bg-black/40 backdrop-blur-sm rounded-lg shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <div className="bg-gradient-to-r from-indigo-900/40 to-blue-900/20 px-5 py-3 border-b border-indigo-500/40 flex justify-between items-center">
                      <h3 className="text-indigo-300 font-black uppercase tracking-widest text-xs flex items-center gap-2">
                        <Hexagon className="w-4 h-4 text-indigo-400" /> Executive Clinical Summary
                      </h3>
                      <span className="text-[9px] font-mono bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded border border-indigo-500/30">
                        AI GENERATED
                      </span>
                    </div>
                    
                    <div className="p-5">
                      <div className="text-slate-300 text-xs leading-relaxed mb-6 bg-[#131826] p-4 rounded-md border border-[#1e293b] shadow-inner">
                        {cdssReport.clinical_summary}
                      </div>
                      
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                        {/* Recommendations */}
                        <div className="bg-gradient-to-b from-[#0a0f18]/60 to-[#060b15]/80 backdrop-blur-xl border border-white/10 rounded-md p-4 shadow-sm">
                          <h4 className="text-emerald-400 font-bold mb-3 uppercase tracking-wider text-[10px] flex items-center gap-2 border-b border-[#1e293b] pb-2">
                            <Activity className="w-3.5 h-3.5" /> Recommended Actions
                          </h4>
                          <ul className="space-y-2 text-slate-300">
                            {cdssReport.recommendations?.map((rec: string, i: number) => (
                              <li key={i} className="flex items-start gap-2 text-[11px] leading-tight">
                                <span className="text-emerald-500 mt-0.5">▸</span> {rec}
                              </li>
                            ))}
                          </ul>
                        </div>
                        
                        <div className="flex flex-col gap-4">
                          {/* Prognostic Drivers */}
                          <div className="bg-gradient-to-b from-[#0a0f18]/60 to-[#060b15]/80 backdrop-blur-xl border border-white/10 rounded-md p-4 shadow-sm flex-1">
                            <h4 className="text-amber-400 font-bold mb-3 uppercase tracking-wider text-[10px] flex items-center gap-2 border-b border-[#1e293b] pb-2">
                              <TrendingUp className="w-3.5 h-3.5" /> Key Prognostic Drivers
                            </h4>
                            <div className="space-y-2">
                              {cdssReport.prognostic_drivers?.map((driver: any, i: number) => (
                                <div key={i} className="flex justify-between items-center text-[10px] bg-black/40 backdrop-blur-sm px-2 py-1.5 rounded border border-[#1e293b]">
                                  <span className="text-slate-300 font-medium truncate pr-2">{driver.factor}</span>
                                  <span className={`font-mono font-bold px-1.5 py-0.5 rounded uppercase tracking-widest text-[8px] flex-shrink-0 ${
                                    driver.impact === 'HIGH_RISK' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 
                                    driver.impact === 'PROTECTIVE' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 
                                    'bg-slate-500/20 text-slate-400 border border-slate-500/30'
                                  }`}>
                                    {driver.impact.replace('_', ' ')}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Guidelines & Timeline */}
                          <div className="grid grid-cols-2 gap-4">
                             <div className="bg-gradient-to-b from-[#0a0f18]/60 to-[#060b15]/80 backdrop-blur-xl border border-white/10 rounded-md p-3 shadow-sm">
                                <h4 className="text-blue-400 font-bold mb-2 uppercase tracking-wider text-[9px] flex items-center gap-1.5">
                                  <BookOpen className="w-3 h-3" /> Guidelines
                                </h4>
                                <div className="flex flex-wrap gap-1.5">
                                  {cdssReport.guidelines_referenced?.map((g: string, i: number) => (
                                    <span key={i} className="text-[8px] font-mono bg-blue-500/10 text-blue-300 border border-blue-500/20 px-1.5 py-0.5 rounded">
                                      {g}
                                    </span>
                                  ))}
                                </div>
                             </div>
                             <div className="bg-gradient-to-b from-[#0a0f18]/60 to-[#060b15]/80 backdrop-blur-xl border border-white/10 rounded-md p-3 shadow-sm">
                                <h4 className="text-purple-400 font-bold mb-2 uppercase tracking-wider text-[9px] flex items-center gap-1.5">
                                  <Clock className="w-3 h-3" /> Follow-up
                                </h4>
                                <p className="text-[10px] text-slate-300 font-medium leading-tight">
                                  {cdssReport.follow_up_timeline}
                                </p>
                             </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-[9px] text-slate-500 uppercase flex items-start gap-2 bg-[#131826] p-3 rounded border border-rose-500/20 shadow-inner">
                        <Info className="w-4 h-4 flex-shrink-0 text-rose-400" />
                        <span className="leading-tight text-rose-200/70">{cdssReport.disclaimer}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* FULL WIDTH RESULTS AREA */}
          {result ? (
              <>
                <div className="w-full bg-gradient-to-b from-[#0a0f18]/60 to-[#060b15]/80 backdrop-blur-xl border border-white/10 rounded-md shadow-lg overflow-hidden flex flex-col mt-4" style={{ height: '80vh', minHeight: '850px' }}>
                  <div className="relative overflow-hidden bg-[#0f172a] border-b border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.5)] group flex-shrink-0 z-10">
                    <div className={`absolute inset-0 opacity-20 transition-opacity duration-700 group-hover:opacity-30 ${
                      result.recurrence_risk === "HIGH" 
                        ? "bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-rose-900/40 via-rose-600/10 to-transparent" 
                        : "bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-emerald-900/40 via-emerald-600/10 to-transparent"
                    }`}></div>
                    
                    <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6 p-4 md:px-8 md:py-6 bg-[#0a0f18]/60 backdrop-blur-3xl">
                      {/* Left Side: Diagnosis */}
                      <div className="flex items-center gap-6 w-full md:w-auto">
                        {/* Icon with glowing ring */}
                        <div className="relative flex-shrink-0">
                          <div className={`absolute -inset-1 rounded-full blur-md opacity-60 animate-pulse ${
                            result.recurrence_risk === "HIGH" ? "bg-rose-500" : "bg-emerald-500"
                          }`}></div>
                          <div className="relative w-14 h-14 bg-[#0a0f18] rounded-full border-2 border-white/10 flex items-center justify-center shadow-inner">
                            {result.recurrence_risk === "HIGH" ? <ShieldAlert className="w-6 h-6 text-rose-500" /> : <CheckCircle className="w-6 h-6 text-emerald-500" />}
                          </div>
                        </div>
                        
                        {/* Text block */}
                        <div className="flex flex-col">
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.3em] mb-1">
                            {result.ui_rendering_state === "STATE_ABSTAIN_LOCK" ? "SYSTEM ALERT" : "LONGITUDINAL PROGNOSIS"}
                          </span>
                          <h2 className={`font-black tracking-wide text-2xl md:text-3xl uppercase flex items-center gap-3 ${
                            result.recurrence_risk === "HIGH" ? "text-rose-400" : "text-emerald-400"
                          }`}>
                            <span className="relative inline-block">
                                <span className={`absolute inset-0 animate-pulse blur-[6px] opacity-80 ${result.recurrence_risk === "HIGH" ? "text-rose-500" : "text-emerald-500"}`}>
                                    {result.ui_rendering_state === "STATE_ABSTAIN_LOCK" ? "DIAGNOSTIC UNCERTAINTY" : `${result.recurrence_risk} RISK`}
                                </span>
                                <span className="relative drop-shadow-md">
                                    {result.ui_rendering_state === "STATE_ABSTAIN_LOCK" ? "DIAGNOSTIC UNCERTAINTY" : `${result.recurrence_risk} RISK`}
                                </span>
                            </span>
                            {result.ui_rendering_state !== "STATE_ABSTAIN_LOCK" && (
                              <>
                                <span className="opacity-40 font-normal">|</span>
                                <span className="relative inline-block">
                                   <span className={`absolute inset-0 animate-pulse blur-[6px] opacity-80 ${result.recurrence_risk === "HIGH" ? "text-rose-500" : "text-emerald-500"}`}>
                                       {result.probability}%
                                   </span>
                                   <span className="relative drop-shadow-md">
                                       {result.probability}%
                                   </span>
                                </span>
                              </>
                            )}
                          </h2>
                          {result.ui_rendering_state !== "STATE_ABSTAIN_LOCK" && (
                            <div className="flex items-center mt-2">
                              <div className="h-1.5 w-48 bg-black/50 rounded-full overflow-hidden border border-white/5 shadow-inner">
                                 <div className={`h-full ${result.recurrence_risk === "HIGH" ? "bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.8)]" : "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)]"}`} style={{ width: `${result.probability}%` }}></div>
                              </div>
                            </div>
                          )}
                          {result.model_certainty_score !== undefined && (
                            <div className="mt-3 flex items-center gap-2">
                              <div className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded flex items-center gap-1.5 ${
                                result.model_certainty_score >= 80 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' :
                                result.model_certainty_score >= 50 ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30' :
                                'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                              }`}>
                                <Activity className="w-3 h-3" />
                                Model Certainty: {result.model_certainty_score}%
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Right Side: Timeline & Actions */}
                      <div className="flex flex-col sm:flex-row items-center gap-6 w-full md:w-auto">
                        {/* Timeline box */}
                        {result.estimated_recurrence_min_months !== undefined && result.ui_rendering_state !== "STATE_ABSTAIN_LOCK" && (
                          <div className="flex flex-col items-end border-r border-white/10 pr-6">
                            <span className="text-[9px] text-slate-500 font-bold uppercase tracking-[0.2em] mb-1 flex items-center gap-1.5">
                              <Clock className="w-3 h-3 text-amber-500 animate-pulse" /> Predicted Timeline
                            </span>
                            <div className="flex items-baseline gap-1.5 relative">
                               <div className="absolute inset-0 animate-pulse blur-[8px] opacity-70 text-amber-500 font-mono font-black text-2xl md:text-3xl flex items-baseline gap-1.5 pointer-events-none">
                                 <span>{result.estimated_recurrence_min_months}</span>
                                 <span>-</span>
                                 <span>{result.estimated_recurrence_max_months}</span>
                               </div>
                               <span className="font-mono font-black text-2xl md:text-3xl text-amber-400 drop-shadow-md relative">{result.estimated_recurrence_min_months}</span>
                               <span className="text-amber-500/50 font-black text-lg relative">-</span>
                               <span className="font-mono font-black text-2xl md:text-3xl text-amber-400 drop-shadow-md relative">{result.estimated_recurrence_max_months}</span>
                               <span className="text-[10px] text-amber-500/80 font-bold ml-1 uppercase tracking-widest relative">Months</span>
                            </div>
                          </div>
                        )}
                        
                        {/* Actions */}
                        <div className="flex flex-col gap-2 w-full sm:w-auto">
                          <button 
                            type="button" 
                            onClick={handleDownloadPdf}
                            className="group relative overflow-hidden bg-[#1e293b]/80 hover:bg-[#2a364a] text-slate-200 px-5 py-2.5 rounded-lg border border-[#334155] flex items-center justify-center gap-2 text-[10px] font-black tracking-[0.2em] uppercase transition-all w-full shadow-lg hover:shadow-[0_0_15px_rgba(79,70,229,0.3)] hover:border-indigo-500/50"
                          >
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                            <Download className="w-4 h-4 text-indigo-400" />
                            EXPORT PDF
                          </button>
                          <div className="text-[9px] font-mono text-slate-500 flex items-center justify-center gap-1 bg-black/40 py-1 rounded border border-white/5">
                            ID: <span className="text-slate-400 font-bold truncate max-w-[120px]">{result.pseudo_anonymous_id}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {result.clinical_narrative_summary && (
                    <div className="bg-[#0f172a] border-b border-white/5 p-4 md:px-8">
                       <div className="flex items-start gap-3 bg-[#1e293b]/40 rounded-lg p-4 border border-[#334155]/50 shadow-inner">
                         <Activity className="w-5 h-5 text-indigo-400 mt-0.5 flex-shrink-0" />
                         <div>
                           <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Automated Clinical Assessment</h3>
                           <p className="text-sm text-slate-200 leading-relaxed font-light">{result.clinical_narrative_summary}</p>
                         </div>
                       </div>
                    </div>
                  )}

                  <div className="flex-1 flex flex-col xl:flex-row bg-black/40 backdrop-blur-sm overflow-hidden min-h-0">
                      {/* Split-Screen MPR Viewer Area */}
                      <div id="mpr-workstation-capture" className="flex-1 p-4 border-b xl:border-b-0 xl:border-r border-[#1e293b] flex flex-col bg-[#030712] min-w-[70%] min-h-0 overflow-y-auto">
                        
                        {/* Overall Header */}
                        <div className="mb-4 border-b border-[#1e293b] pb-3 flex flex-col gap-1 flex-shrink-0">
                           <h1 className="text-xl font-bold text-slate-100 tracking-wide">LONGITUDINAL PROGRESSION ASSESSMENT</h1>
                           <h2 className="text-sm font-semibold text-cyan-400 uppercase tracking-widest">LONGITUDINAL TRACKING (COMPARE MODE)</h2>
                        </div>

                        {result?.interpretability_layer?.gradcam_3d_matrix ? (
                          <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 min-h-[600px]">
                             
                             {/* Left Viewer: Historical Scan */}
                             <div className="flex flex-col bg-gradient-to-b from-[#0a0f18]/60 to-[#060b15]/80 backdrop-blur-xl border border-white/10 rounded-md overflow-hidden shadow-2xl">
                               <div className="bg-[#1a2235] px-4 py-2.5 border-b border-[#1e293b] flex items-center justify-between flex-shrink-0 shadow">
                                 <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2 truncate">
                                   <Activity className="w-4 h-4 text-amber-500 flex-shrink-0" />
                                   {pastRecords.find(r => r.inference_id === selectedBaselineId)?.scan_title || "HISTORICAL SCAN - JAN 15, 2026 (Baseline)"}
                                 </span>
                                 <span className="text-[10px] font-mono bg-amber-500/10 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded flex-shrink-0">
                                   {pastRecords.find(r => r.inference_id === selectedBaselineId)?.report_title || "BASELINE CT"}
                                 </span>
                               </div>
                               <div className="flex-1 relative bg-black min-h-[450px] flex flex-col">
                                 <MprClinicalWorkstation 
                                   base64Matrix={result.interpretability_layer.gradcam_3d_matrix} 
                                   dicomBase64Matrix={result.interpretability_layer.dicom_3d_matrix}
                                   dimensions={result.interpretability_layer.heatmap_spatial_shape} 
                                   tumorTarget={result.interpretability_layer.tumor_target}
                                   patientInfo={{ name: patientInfo.name, id: patientInfo.mrn }}
                                   longitudinalMode="baseline"
                                 />
                               </div>
                             </div>

                             {/* Right Viewer: Current Scan */}
                             <div className="flex flex-col bg-gradient-to-b from-[#0a0f18]/60 to-[#060b15]/80 backdrop-blur-xl border border-white/10 rounded-md overflow-hidden shadow-2xl">
                               <div className="bg-[#1a2235] px-4 py-2.5 border-b border-[#1e293b] flex items-center justify-between flex-shrink-0 shadow">
                                 <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                                   <Activity className="w-4 h-4 text-emerald-500" />
                                   CURRENT SCAN - JUN 23, 2026 (Follow-up)
                                 </span>
                                 <span className="text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded">
                                   FOLLOW-UP CT
                                 </span>
                               </div>
                               <div className="flex-1 relative bg-black min-h-[450px] flex flex-col">
                                 <MprClinicalWorkstation 
                                   base64Matrix={result.interpretability_layer.gradcam_3d_matrix} 
                                   dicomBase64Matrix={result.interpretability_layer.dicom_3d_matrix}
                                   dimensions={result.interpretability_layer.heatmap_spatial_shape} 
                                   tumorTarget={result.interpretability_layer.tumor_target}
                                   patientInfo={{ name: patientInfo.name, id: patientInfo.mrn }}
                                   longitudinalMode="followup"
                                 />
                               </div>
                             </div>

                          </div>
                        ) : (
                          <div className="flex-1 flex items-center justify-center text-slate-700 font-mono text-xs uppercase">
                              NO VOLUMETRIC DATA RENDERED
                          </div>
                        )}
                      </div>
                      
                      {/* SHAP & Metrics Sidebar */}
                      <div className="w-full xl:w-[350px] p-4 flex flex-col gap-4 bg-black/40 backdrop-blur-sm overflow-y-auto flex-shrink-0 border-l border-[#1e293b]">
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
                <PhysicianVerificationNotes inferenceId={result.inference_id} />
              </>
          ) : (
              <div className="w-full border border-dashed border-[#1e293b] rounded-md flex items-center justify-center bg-[#030712] h-[300px] mt-4">
                <div className="text-center text-[#1e293b]">
                    <Split className="w-16 h-16 mx-auto mb-2 opacity-50 text-cyan-500" />
                    <p className="text-xs font-mono uppercase tracking-widest font-bold text-slate-400">AWAITING LONGITUDINAL INFERENCE EXECUTION (COMPARE MODE)</p>
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
                <p className="text-[10px] text-slate-600 font-bold tracking-widest">LONGITUDINAL PROGRESSION ASSESSMENT</p>
              </div>
            </div>
            <div className="text-right text-xs font-mono text-slate-600">
              <p className="font-bold text-black text-sm mb-1">LONGITUDINAL TRACKING REPORT</p>
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
             
             <div className="border-t border-slate-200 pt-3 mt-1 flex justify-between items-start">
               <div>
                 <span className="font-bold text-[9px] text-slate-500 uppercase tracking-widest block mb-1">Accession Number</span>
                 <span className="font-mono text-xs font-bold text-slate-700">ACC-2026-89412</span>
               </div>
               <img src={`https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=https://pacs.hepatoai.local/patient/${patientInfo.mrn}`} alt="Secure PACS" className="w-9 h-9 border border-slate-300 p-0.5 rounded-sm opacity-90 mix-blend-multiply" />
             </div>
             <div className="border-t border-slate-200 pt-3 mt-1 col-span-2"><span className="font-bold text-[9px] text-slate-500 uppercase tracking-widest block mb-1">Referring Physician & Dept</span><span className="text-xs font-semibold text-slate-700">{patientInfo.attending !== "---" ? `Dr. ${patientInfo.attending}` : "Unknown Physician"}</span></div>
             <div className="border-t border-slate-200 pt-3 mt-1"><span className="font-bold text-[9px] text-slate-500 uppercase tracking-widest block mb-1">Attending Radiologist</span><span className="text-xs font-semibold text-slate-700">{user ? `Dr. ${user.name}, ${user.level || 'MD'}` : "Unknown Radiologist"}</span></div>
          </div>

          {/* Clinical Indication & Prior Exams */}
          <div className="mb-6 border border-slate-200 p-4 rounded-md bg-slate-50 text-xs">
             <div className="grid grid-cols-3 gap-4">
               <div className="col-span-2">
                 <span className="font-bold text-[10px] text-slate-500 uppercase tracking-widest block mb-1">Clinical Indication / Reason for Exam</span>
                 <p className="text-slate-800 font-medium">Longitudinal tracking (Compare Mode); evaluate treatment response between Baseline (Jan 15, 2026) and Follow-up (Jun 23, 2026).</p>
               </div>
               <div>
                 <span className="font-bold text-[10px] text-slate-500 uppercase tracking-widest block mb-1">Prior Baseline Exams</span>
                 <p className="text-slate-700 font-mono text-[11px]">{pastRecords.find(r => r.inference_id === selectedBaselineId)?.scan_title || "Historical baseline scan dated Jan 15, 2026."}</p>
               </div>
             </div>
          </div>

          {/* Prognosis Result */}
          {result && (
            <div className={`p-6 border-l-[6px] mb-6 shadow-sm rounded-r-md ${result.recurrence_risk === 'HIGH' ? 'bg-rose-50 border-rose-600 text-rose-900' : 'bg-emerald-50 border-emerald-600 text-emerald-900'}`}>
              <h2 className="text-xs font-bold uppercase tracking-widest mb-2 opacity-80">Longitudinal AI Inference Result</h2>
              <div className="text-2xl font-black uppercase tracking-wide">
                {result.recurrence_risk} RISK FOR HEPATIC RECURRENCE ({result.probability}%{result.confidence_interval ? ` (95% CI: ${result.confidence_interval[0]}% - ${result.confidence_interval[1]}%)` : ''})
              </div>
              {result.estimated_recurrence_min_months !== undefined && (
                <div className="text-sm font-bold uppercase tracking-wide text-amber-700 mt-1">
                  ESTIMATED TIME TO RECURRENCE: {result.estimated_recurrence_min_months} - {result.estimated_recurrence_max_months} MONTHS
                </div>
              )}
              <div className="text-[10px] mt-3 opacity-70 font-mono flex gap-4">
                 <span>Ref ID: {result.inference_id?.substring(0, 18)}...</span>
                 <span>Network Status: SECURE</span>
              </div>
            </div>
          )}

          {/* Radiological Imaging Output (Comparative Side-by-Side) */}
          <div className="mb-8">
             <div className="border-b-2 border-slate-300 pb-2 mb-4 flex justify-between items-end">
               <h3 className="text-xs font-bold uppercase tracking-widest text-slate-800">Section IV: Longitudinal Comparative MPR Imaging (Baseline vs Follow-up)</h3>
               <span className="text-[10px] font-mono text-slate-500 uppercase">AI Overlay: Grad-CAM Thermal Activation & RECIST ROI</span>
             </div>
             
             {/* 2-Column Comparative Layout (Baseline vs Follow-up) */}
             <div className="grid grid-cols-2 gap-6 mb-4">
                {/* Left Column: Baseline Scan */}
                <div className="flex flex-col bg-amber-50/40 border-2 border-amber-200/80 rounded p-4 shadow-sm">
                   <div className="mb-3 border-b-2 border-amber-200 pb-2 flex justify-between items-center bg-amber-100/50 -mx-4 -mt-4 p-3 rounded-t">
                     <span className="text-xs font-bold text-amber-900 uppercase tracking-wide flex items-center gap-1.5">
                       <Activity className="w-4 h-4 text-amber-600" />
                       Baseline Scan ({pastRecords.find(r => r.inference_id === selectedBaselineId)?.scan_title || "Jan 15, 2026"})
                     </span>
                     <span className="text-[9px] font-mono bg-amber-200 text-amber-800 px-2 py-0.5 rounded font-bold">PRIOR STUDY</span>
                   </div>
                   
                   {/* Baseline Images Grid */}
                   <div className="space-y-4">
                     <div>
                       <div className="flex justify-between text-[10px] font-bold text-slate-700 uppercase mb-1">
                         <span>Axial Plane (XY)</span>
                         <span className="font-mono text-[9px] text-amber-700">RECIST: 6.4cm</span>
                       </div>
                       <div className="bg-black flex items-center justify-center rounded overflow-hidden border border-slate-800 min-h-[160px]">
                         <img id="report-axial-img-baseline" className="w-full h-auto object-contain" style={{ display: 'none', maxHeight: '200px' }} />
                       </div>
                     </div>

                     <div>
                       <div className="flex justify-between text-[10px] font-bold text-slate-700 uppercase mb-1">
                         <span>Coronal Plane (XZ)</span>
                         <span className="font-mono text-[9px]">Transverse Extent</span>
                       </div>
                       <div className="bg-black flex items-center justify-center rounded overflow-hidden border border-slate-800 min-h-[160px]">
                         <img id="report-coronal-img-baseline" className="w-full h-auto object-contain" style={{ display: 'none', maxHeight: '200px' }} />
                       </div>
                     </div>

                     <div>
                       <div className="flex justify-between text-[10px] font-bold text-slate-700 uppercase mb-1">
                         <span>Sagittal Plane (YZ)</span>
                         <span className="font-mono text-[9px]">Sagittal Boundaries</span>
                       </div>
                       <div className="bg-black flex items-center justify-center rounded overflow-hidden border border-slate-800 min-h-[160px]">
                         <img id="report-sagittal-img-baseline" className="w-full h-auto object-contain" style={{ display: 'none', maxHeight: '200px' }} />
                       </div>
                     </div>
                   </div>
                   <p className="text-[10px] text-amber-900/80 mt-3 italic leading-tight border-t border-amber-200 pt-2">
                     Baseline evaluation demonstrates pronounced thermal Grad-CAM activation mass across all three reconstructed planes.
                   </p>
                </div>

                {/* Right Column: Follow-up Scan */}
                <div className="flex flex-col bg-emerald-50/40 border-2 border-emerald-200/80 rounded p-4 shadow-sm">
                   <div className="mb-3 border-b-2 border-emerald-200 pb-2 flex justify-between items-center bg-emerald-100/50 -mx-4 -mt-4 p-3 rounded-t">
                     <span className="text-xs font-bold text-emerald-900 uppercase tracking-wide flex items-center gap-1.5">
                       <Activity className="w-4 h-4 text-emerald-600" />
                       Current Scan (Jun 23, 2026 - Follow-up)
                     </span>
                     <span className="text-[9px] font-mono bg-emerald-200 text-emerald-800 px-2 py-0.5 rounded font-bold">LATEST STUDY</span>
                   </div>
                   
                   {/* Follow-up Images Grid */}
                   <div className="space-y-4">
                     <div>
                       <div className="flex justify-between text-[10px] font-bold text-slate-700 uppercase mb-1">
                         <span>Axial Plane (XY)</span>
                         <span className="font-mono text-[9px] text-emerald-700 font-bold">RECIST: 2.1cm (PR)</span>
                       </div>
                       <div className="bg-black flex items-center justify-center rounded overflow-hidden border border-slate-800 min-h-[160px]">
                         <img id="report-axial-img-followup" className="w-full h-auto object-contain" style={{ display: 'none', maxHeight: '200px' }} />
                       </div>
                     </div>

                     <div>
                       <div className="flex justify-between text-[10px] font-bold text-slate-700 uppercase mb-1">
                         <span>Coronal Plane (XZ)</span>
                         <span className="font-mono text-[9px]">Transverse Extent</span>
                       </div>
                       <div className="bg-black flex items-center justify-center rounded overflow-hidden border border-slate-800 min-h-[160px]">
                         <img id="report-coronal-img-followup" className="w-full h-auto object-contain" style={{ display: 'none', maxHeight: '200px' }} />
                       </div>
                     </div>

                     <div>
                       <div className="flex justify-between text-[10px] font-bold text-slate-700 uppercase mb-1">
                         <span>Sagittal Plane (YZ)</span>
                         <span className="font-mono text-[9px]">Sagittal Boundaries</span>
                       </div>
                       <div className="bg-black flex items-center justify-center rounded overflow-hidden border border-slate-800 min-h-[160px]">
                         <img id="report-sagittal-img-followup" className="w-full h-auto object-contain" style={{ display: 'none', maxHeight: '200px' }} />
                       </div>
                     </div>
                   </div>
                   <p className="text-[10px] text-emerald-900/80 mt-3 italic leading-tight border-t border-emerald-200 pt-2">
                     Follow-up evaluation visualizes a reduced tumor mass and contraction of the Grad-CAM thermal cluster, confirming positive therapeutic response.
                   </p>
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
             <h3 className="text-xs font-bold uppercase tracking-widest text-slate-800 mb-3">Section V: Structured Longitudinal Findings & Staging</h3>
             <div className="grid grid-cols-2 gap-6 text-xs">
               <div className="bg-slate-50 p-4 rounded border border-slate-200">
                 <h4 className="font-bold text-slate-700 uppercase text-[11px] mb-2 border-b border-slate-200 pb-1">Longitudinal Evaluation</h4>
                 <p className="mb-2"><strong>Selected Baseline ({pastRecords.find(r => r.inference_id === selectedBaselineId)?.scan_title || "Jan 15, 2026"}):</strong> Demonstrates baseline advanced tumor void with pronounced metabolic concentration across all three planes.</p>
                 <p><strong>Current Scan (Jun 23, 2026):</strong> Visualizes a smaller, reduced tumor mass reflecting successful treatment response and marked reduction in RECIST geometric boundaries.</p>
               </div>
               <div className="bg-slate-50 p-4 rounded border border-slate-200 flex flex-col justify-between">
                 <div>
                   <h4 className="font-bold text-slate-700 uppercase text-[11px] mb-2 border-b border-slate-200 pb-1">Formal Classification & Staging</h4>
                   <div className="mb-4">
                     <span className="text-slate-500 text-[10px] block uppercase font-bold mb-1">LI-RADS Classification</span>
                     <div className="font-mono font-bold text-slate-900 bg-slate-200 px-2 py-1 rounded text-[11px] inline-block">LR-TR Responding (HepatoAI Verification)</div>
                   </div>
                   <div>
                     <span className="text-slate-500 text-[10px] block uppercase font-bold mb-1">RECIST 1.1 Criteria Evaluation</span>
                     <p className="text-slate-800 text-[11px] leading-normal">Target lesion demonstrates partial response (PR) with significant reduction in activation maximum (v_max) and tumor void diameter.</p>
                   </div>
                 </div>
                 <div className="mt-4 pt-3 border-t border-slate-200 bg-blue-50/50 p-2 rounded border border-blue-100">
                   <span className="text-blue-900 font-bold text-[10px] uppercase block mb-1">Executive Impression & Recommendation</span>
                   <p className="text-slate-700 text-[11px] font-medium leading-normal whitespace-pre-line">
                     {(result?.probability ?? 0) > 70 ? (
                         "1. Due to high recurrence probability, an ultrasound-guided biopsy is recommended per AASLD guidelines.\n2. Multidisciplinary tumor board review required.\n3. Consider adjusting follow-up interval to 3 months."
                     ) : (result?.probability ?? 0) > 40 ? (
                         "1. Moderate recurrence probability detected.\n2. Recommend repeat multiphasic abdominal CT in 6 months.\n3. Close surveillance of AFP levels."
                     ) : (
                         "1. Low recurrence probability.\n2. Routine clinical follow-up in 12 months.\n3. Maintain standard of care surveillance."
                     )}
                   </p>
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
            <div className="col-span-3 text-center pl-2 flex flex-col items-center justify-end relative">
               {user?.signature ? (
                  <img src={user.signature} alt="Physician Signature" className="max-h-16 w-auto object-contain -mb-2" />
               ) : (
                  <div className="border-b border-black mb-2 border-dashed w-full h-8"></div>
               )}
               <span className="text-[10px] font-bold uppercase tracking-widest text-slate-800 block w-full border-t border-black pt-1 relative z-10">{user ? `Dr. ${user.name}` : "Physician Signature"}</span>
               <span className="text-[7px] font-mono text-slate-500 mt-1 block">Digitally Signed & Verified on: {new Date().toISOString().replace('T', ' ').split('.')[0]}</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* BASELINE SELECTION MODAL POPUP */}
      {showBaselineModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[#131826] border border-[#2a364a] rounded-lg shadow-[0_0_50px_rgba(0,0,0,0.9)] w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="bg-[#1a2235] px-6 py-4 border-b border-[#1e293b] flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-3">
                <Activity className="w-5 h-5 text-indigo-400 animate-pulse" />
                <div>
                  <h3 className="text-base font-bold text-slate-100 tracking-wide uppercase">Select Patient Historical Baseline Record</h3>
                  <p className="text-xs text-slate-400 font-mono">Select a prior CT study for 3D multi-epoch volumetric comparison</p>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => setShowBaselineModal(false)}
                className="text-slate-400 hover:text-white bg-black/40 backdrop-blur-sm hover:bg-rose-600/80 border border-[#2a364a] w-8 h-8 rounded flex items-center justify-center font-bold text-sm transition-all shadow"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 flex-1 flex flex-col gap-4 overflow-hidden bg-[#030712]">
              {/* Search/Filter input */}
              <div className="relative flex items-center flex-shrink-0">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
                <input 
                  type="text" 
                  value={baselineSearch}
                  onChange={(e) => setBaselineSearch(e.target.value)}
                  placeholder="Filter past baseline scans by date, report title, or clinical evaluation..."
                  className="w-full text-xs font-mono bg-black/40 backdrop-blur-sm border border-[#2a364a] rounded text-slate-200 py-2.5 pl-9 pr-3 focus:ring-1 focus:ring-indigo-500 outline-none transition-colors shadow-inner placeholder:text-slate-500"
                />
                {baselineSearch && (
                  <button 
                    type="button" 
                    onClick={() => setBaselineSearch("")}
                    className="absolute right-3 text-xs text-slate-400 hover:text-white font-bold bg-[#131826] px-2 py-1 rounded border border-[#2a364a]"
                  >
                    CLEAR
                  </button>
                )}
              </div>

              {/* Scrollable Records List */}
              <div className="flex-1 overflow-y-auto flex flex-col gap-3 pr-1 scrollbar-thin scrollbar-thumb-indigo-500/30 scrollbar-track-transparent min-h-[250px]">
                {pastRecords.filter(rec => 
                  rec.scan_title.toLowerCase().includes(baselineSearch.toLowerCase()) ||
                  rec.report_title.toLowerCase().includes(baselineSearch.toLowerCase()) ||
                  rec.timestamp.toLowerCase().includes(baselineSearch.toLowerCase())
                ).map((rec) => (
                  <div 
                    key={rec.inference_id}
                    onClick={() => setSelectedBaselineId(rec.inference_id)}
                    className={`flex flex-col p-4 rounded-lg border cursor-pointer transition-all ${
                      selectedBaselineId === rec.inference_id 
                        ? "bg-indigo-950/70 border-indigo-400 shadow-[0_0_20px_rgba(99,102,241,0.3)] text-slate-100" 
                        : "bg-black/40 backdrop-blur-sm border-[#2a364a] hover:border-slate-500 text-slate-300 hover:bg-[#131826]"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2 border-b border-[#1e293b] pb-2">
                      <div className="flex items-center gap-3 flex-1 overflow-hidden">
                        <input 
                          type="radio" 
                          name="modal_baseline_select" 
                          checked={selectedBaselineId === rec.inference_id}
                          onChange={() => setSelectedBaselineId(rec.inference_id)}
                          className="text-indigo-600 bg-[#030712] border-slate-600 focus:ring-0 w-4 h-4"
                        />
                        <span className="font-bold tracking-wide text-sm truncate">{rec.scan_title}</span>
                      </div>
                      <span className={`text-[10px] font-mono px-2.5 py-1 rounded font-bold flex-shrink-0 ml-4 ${rec.recurrence_risk === 'HIGH' ? 'bg-rose-950/80 text-rose-300 border border-rose-800' : 'bg-emerald-950/80 text-emerald-300 border border-emerald-800'}`}>
                        {rec.recurrence_risk} RISK
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs font-mono text-slate-400 pl-7">
                      <span className="text-emerald-400 font-sans truncate mr-4">📄 {rec.report_title}</span>
                      <span className="flex-shrink-0 text-slate-300">Tumor Size: <strong className="text-white">{rec.tumor_size_cm}cm</strong> | AFP: <strong className="text-white">{rec.afp_ngml} ng/ml</strong></span>
                    </div>
                  </div>
                ))}
                {pastRecords.filter(rec => 
                  rec.scan_title.toLowerCase().includes(baselineSearch.toLowerCase()) ||
                  rec.report_title.toLowerCase().includes(baselineSearch.toLowerCase()) ||
                  rec.timestamp.toLowerCase().includes(baselineSearch.toLowerCase())
                ).length === 0 && (
                  <div className="text-center py-12 text-slate-500 text-xs font-mono uppercase border border-dashed border-[#1e293b] rounded-lg bg-black/40 backdrop-blur-sm">
                    No matching baseline scans found
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-[#1a2235] px-6 py-4 border-t border-[#1e293b] flex items-center justify-between flex-shrink-0">
              <div className="text-xs font-mono text-slate-400 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-indigo-400 animate-ping"></span>
                <span>Selected: <strong className="text-white">{pastRecords.find(r => r.inference_id === selectedBaselineId)?.scan_title || "None"}</strong></span>
              </div>
              <button 
                type="button" 
                onClick={() => setShowBaselineModal(false)}
                className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2 rounded text-xs font-bold tracking-wider uppercase shadow-lg transition-all border border-indigo-400/50"
              >
                Confirm Baseline Selection
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
