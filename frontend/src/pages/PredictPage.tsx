import React, { useState, useEffect, useRef } from "react";
import type { ChangeEvent, FormEvent } from "react";
import {
  Upload,
  Activity,
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
  RotateCcw,
  BookOpen,
  Clock,
  TrendingUp,
  Box
} from "lucide-react";
import axios from "axios";
import { renderKeyImages } from "../utils/dicomKeyImages";
import { buildClinicalReportPdf } from "../utils/clinicalReportPdf";
import type { ReportInput } from "../utils/clinicalReportPdf";
import MprClinicalWorkstation from "../components/MprClinicalWorkstation";
import PhysicianVerificationNotes from "../components/PhysicianVerificationNotes";
import { Three3DPacsViewer } from "../components/Three3DPacsViewer";
import { DiagnosticPipelineModal } from "../components/DiagnosticPipelineModal";
import { PatientVerificationPanel } from "../components/PatientVerificationPanel";
import { PatientVerificationToast } from "../components/PatientVerificationToast";
import type { VerificationData } from "../components/PatientVerificationPanel";
import { ClinicalAssessmentPanel } from "../components/ClinicalAssessmentPanel";
import { WhatIfSimulator } from "../components/WhatIfSimulator";
import { RecurrenceOutlookPanel } from "../components/RecurrenceOutlookPanel";
import { PrognosisSummary } from "../components/PrognosisSummary";
import { RadiologyRow, LabRow, FindingRow, StagingRow } from "../components/ExtractedDataRows";
import type { RowEvidence, OverrideOption, LabMeta, FindingMeta, ChildPughMeta } from "../components/ExtractedDataRows";
import { RiskExplanationPanel } from "../components/RiskExplanationPanel";
import type { RecurrenceOutlook } from "../components/RecurrenceOutlookPanel";
import type { ClinicalAssessment } from "../components/ClinicalAssessmentPanel";

export interface DiagnosticInput {
  tumor_size_cm: number | string;
  tumor_number: number | string;
  tumor_density_hu: number | string;
  tumor_shape_irregularity: number | string;
  tumor_texture_entropy: number | string;
  margin_definition: string;
  enhancement_pattern: string;
  afp_ngml: number | string;
  alp_iul: number | string;
  alt_iul: number | string;
  ast_iul: number | string;
  bilirubin_mgdl: number | string;
  albumin_gdl: number | string;
  platelet_k_ul: number | string;
  child_pugh_score: string;
  bclc_stage: string;
  cirrhosis_present: boolean | string;
  hepatitis_b: boolean | string;
  hepatitis_c: boolean | string;
  mvi_pathology: boolean | string;
  clinical_text_report: string;
  sources?: Record<string, string>;
  evidence?: Record<string, string>;
  lab_meta?: Record<string, LabMeta>;
  findings?: Record<string, FindingMeta>;
  radiology_meta?: Record<string, { value: unknown; display?: string; evidence: string }>;
  child_pugh?: ChildPughMeta | null;
  lirads_category?: string;
  report_date?: string | null;
}

export interface PredictionResult {
  recurrence_risk: "HIGH" | "LOW" | "ABSTAIN";
  probability: number;
  ai_insights: string[];
  clinical_text_report?: string;
  ui_rendering_state?: "STATE_NORMAL" | "STATE_DRIFT_WARNING" | "STATE_ABSTAIN_LOCK";
  model_certainty_score?: number;
  clinical_narrative_summary?: string;
  clinical_assessment?: ClinicalAssessment;
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
  /** 95% CI of median recurrence-free survival; null when not estimable */
  estimated_recurrence_min_months?: number | null;
  estimated_recurrence_max_months?: number | null;
  recurrence_outlook?: RecurrenceOutlook | null;
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

const EMPTY_FORM: DiagnosticInput = {
  tumor_size_cm: "--",
  tumor_number: "--",
  tumor_density_hu: "--",
  tumor_shape_irregularity: "--",
  tumor_texture_entropy: "--",
  margin_definition: "--",
  enhancement_pattern: "--",
  afp_ngml: "--",
  alp_iul: "--",
  alt_iul: "--",
  ast_iul: "--",
  bilirubin_mgdl: "--",
  albumin_gdl: "--",
  platelet_k_ul: "--",
  child_pugh_score: "--",
  bclc_stage: "--",
  cirrhosis_present: "--",
  hepatitis_b: "--",
  hepatitis_c: "--",
  mvi_pathology: "--",
  clinical_text_report: "",
  sources: {},
  evidence: {}
};

export const PredictPage: React.FC<{ onViewHistory?: (id: string) => void, user?: any }> = ({ onViewHistory, user }) => {
  const [formData, setFormData] = useState<DiagnosticInput>(EMPTY_FORM);

  const [patientInfo, setPatientInfo] = useState({
    name: "AWAITING DATA...",
    mrn: "---",
    dob: "---",
    age: "-",
    sex: "-",
    attending: "---"
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [showVerificationToast, setShowVerificationToast] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [dicomFileCount, setDicomFileCount] = useState<number>(0);
  const [allDicomFiles, setAllDicomFiles] = useState<File[]>([]);
  const [showViewerModal, setShowViewerModal] = useState<boolean>(false);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [extracting, setExtracting] = useState<boolean>(false);
  const [autoFilled, setAutoFilled] = useState<boolean>(false);
  const [extractionDone, setExtractionDone] = useState<boolean>(false);
  const [historyInfo, setHistoryInfo] = useState<{has_history: boolean, pseudo_id: string, count: number} | null>(null);
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [pipelineStep, setPipelineStep] = useState<"IDLE" | "STEP1" | "STEP2" | "STEP3" | "COMPLETE">("IDLE");
  const [progress, setProgress] = useState<number>(0);
  const [loadingText, setLoadingText] = useState<string>("");
  const [screenFlash, setScreenFlash] = useState<boolean>(false);
  const [showPipelineModal, setShowPipelineModal] = useState<boolean>(false);
  const [activeModalStep, setActiveModalStep] = useState<number>(0);
  const [modalOverallProgress, setModalOverallProgress] = useState<number>(0);
  const [verificationData, setVerificationData] = useState<VerificationData | null>(null);

  const resultsRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const [activePopup, setActivePopup] = useState<{
    type: 'source' | 'override',
    x: number,
    y: number,
    label: string,
    value: any,
    source: string,
    field?: string,
    evidence?: string,
    details?: string[],
    options?: OverrideOption[]
  } | null>(null);
  const [manualOverrides, setManualOverrides] = useState<Record<string, boolean>>({});

  const handleSourceClick = (e: React.MouseEvent, label: string, value: unknown, info: RowEvidence) => {
    setActivePopup({
      type: 'source',
      x: e.clientX,
      y: e.clientY,
      label,
      value,
      source: info.source,
      evidence: info.evidence,
      details: info.details
    });
  };

  const handleOverrideContext = (e: React.MouseEvent, label: string, value: unknown, field: string, options?: OverrideOption[]) => {
    e.preventDefault();
    setActivePopup({
      type: 'override',
      x: e.clientX,
      y: e.clientY,
      label,
      value,
      source: formData.sources?.[field] ?? '',
      field,
      options
    });
  };

  const submitOverride = (field: string, newValue: string | number | boolean) => {
    setFormData(prev => ({ ...prev, [field]: newValue === '' ? '--' : newValue }));
    setManualOverrides(prev => ({ ...prev, [field]: true }));
    setActivePopup(null);
  };

  const [pdfBusy, setPdfBusy] = useState(false);
  const handleDownloadPdf = async () => {
    if (!result) return;
    setPdfBusy(true);
    try {
      const files = allDicomFiles.length > 0 ? allDicomFiles : imageFile ? [imageFile] : [];
      const { images, sliceCount, note } = files.length > 0 ? await renderKeyImages(files) : { images: [], sliceCount: 0, note: undefined };
      const doc = buildClinicalReportPdf({
        patient: patientInfo,
        form: formData as unknown as ReportInput["form"],
        manualOverrides,
        outlook: result.recurrence_outlook,
        inferenceId: result.inference_id,
        modelVersion: result.recurrence_outlook?.model.version,
        identity: verificationData,
        dataDriftDetected: !!result.system_integrity?.data_drift_detected,
        keyImages: images,
        keyImageNote: note,
        sliceCount,
        reviewer: user,
      });
      const safeMrn = (patientInfo.mrn && patientInfo.mrn !== "---" ? patientInfo.mrn : "unknown").replace(/[^A-Za-z0-9_-]/g, "_");
      doc.save(`Recurrence_Risk_Report_${safeMrn}_${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (error) {
      console.error("PDF generation failed:", error);
      setErrorMessage("Could not generate the PDF report. See the browser console for details.");
    } finally {
      setPdfBusy(false);
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
    if (e.target.files && e.target.files.length > 0) {
      const allFiles = Array.from(e.target.files);
      // Filter to valid DICOM files (keep .dcm or extensionless files, exclude junk)
      const dicomFiles = allFiles.filter(f =>
        f.size > 128 &&
        !f.name.startsWith('.') &&
        !/\.(xml|txt|json|html|DS_Store|csv|pdf|png|jpg|jpeg)$/i.test(f.name)
      );

      if (dicomFiles.length === 0) {
        // Fallback: maybe user selected a single non-dcm image
        const file = allFiles[0];
        setImageFile(file);
        setDicomFileCount(1);
        if (file.name.toLowerCase().endsWith(".dcm")) {
          setImagePreview("DICOM_PLACEHOLDER");
        } else {
          setImagePreview(URL.createObjectURL(file));
        }
        return;
      }

      // Sort by filename (numeric) to get a consistent representative slice
      dicomFiles.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));

      // Use the first DICOM file as the representative file for the backend API
      const representative = dicomFiles[0];
      setImageFile(representative);
      setDicomFileCount(dicomFiles.length);
      setAllDicomFiles(dicomFiles);
      setImagePreview("DICOM_PLACEHOLDER");

      console.log(`[HepatoAI] Loaded ${dicomFiles.length} DICOM files from folder upload`);
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
      setExtractionDone(false);
      const payload = new FormData();
      if (imageFile) payload.append("dcm_file", imageFile);
      if (pdfFile) payload.append("pdf_file", pdfFile);
      
      try {
        const response = await axios.post("http://127.0.0.1:8000/api/extract-clinical-data", payload, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        const data = response.data;
        setFormData({ ...EMPTY_FORM, ...data });
        setManualOverrides({});
        
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
        
        if (data.verification_data) {
            setVerificationData(data.verification_data);
        }

        setAutoFilled(true);
        setExtractionDone(true);
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
    
    // Initialize Modal
    setShowPipelineModal(true);
    setActiveModalStep(0);
    setModalOverallProgress(0);

    const payload = new FormData();
    payload.append("clinical_data", JSON.stringify(formData));
    if (imageFile) payload.append("ct_scan", imageFile);
    if (pdfFile) payload.append("text_report_pdf", pdfFile);
    if (user && user.id) payload.append("doctor_id", user.id);

    // Start API request in parallel
    const apiPromise = axios.post("http://127.0.0.1:8000/api/v1/predict", payload, {
      headers: { "Content-Type": "multipart/form-data" },
    }).catch((error: any) => ({ error }));

    // --- Modal Animation Sequence ---
    
    // Step 0: DICOM Volume Loading (1000ms)
    setActiveModalStep(0);
    setModalOverallProgress(10);
    await new Promise(r => setTimeout(r, 1000));

    // Step 1: Clinical Report Parsing (1000ms)
    setActiveModalStep(1);
    setModalOverallProgress(25);
    await new Promise(r => setTimeout(r, 1000));

    // Step 2: Image Feature Extraction (1500ms)
    setPipelineStep("STEP1"); // sync old UI
    setActiveModalStep(2);
    setModalOverallProgress(40);
    await new Promise(r => setTimeout(r, 1500));

    // Step 3: Text Feature Extraction (1000ms)
    setPipelineStep("STEP2"); // sync old UI
    setActiveModalStep(3);
    setModalOverallProgress(60);
    await new Promise(r => setTimeout(r, 1000));

    // Step 4: Multimodal Fusion (1000ms)
    setPipelineStep("STEP3"); // sync old UI
    setActiveModalStep(4);
    setModalOverallProgress(75);
    await new Promise(r => setTimeout(r, 1000));

    // Step 5: Prediction & SHAP (1000ms)
    setActiveModalStep(5);
    setModalOverallProgress(85);
    await new Promise(r => setTimeout(r, 1000));

    // Wait for the actual API to finish before final explainability step
    const res: any = await apiPromise;

    // Step 6: Grad-CAM Heatmap (1500ms)
    setActiveModalStep(6);
    setModalOverallProgress(95);
    await new Promise(r => setTimeout(r, 1500));

    // Complete
    setModalOverallProgress(100);
    setActiveModalStep(7);
    
    // Hold completion state for 1 second before closing
    await new Promise(r => setTimeout(r, 1000));

    setLoading(false);
    setPipelineStep("COMPLETE");
    setShowPipelineModal(false);
    
    // Show toast after modal closes
    if (verificationData) {
      setTimeout(() => setShowVerificationToast(true), 300);
    }

    if (res?.error) {
      setErrorMessage(res.error.response?.data?.detail || "Backend communication failed.");
      setPipelineStep("IDLE");
    } else {
      sessionStorage.setItem("active_patient_session", "true");
      setResult(res.data);
      setScreenFlash(true);
      setTimeout(() => setScreenFlash(false), 400);
      setTimeout(() => {
        setPipelineStep("IDLE");
        setTimeout(() => {
          if (formRef.current && resultsRef.current) {
            const formTop = formRef.current.getBoundingClientRect().top;
            const resultsTop = resultsRef.current.getBoundingClientRect().top;
            formRef.current.scrollBy({ top: resultsTop - formTop, behavior: "smooth" });
          }
        }, 100);
      }, 500);
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

  const handleResetWorkspace = () => {
    sessionStorage.removeItem("active_patient_session");
    setShowVerificationToast(false);
    setFormData(EMPTY_FORM);
    setExtractionDone(false);
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
    setDicomFileCount(0);
    setAllDicomFiles([]);
    setPdfFile(null);
    setLoading(false);
    setExtracting(false);
    setAutoFilled(false);
    setHistoryInfo(null);
    setResult(null);
    setErrorMessage(null);
    setPipelineStep("IDLE");
    setProgress(0);
    setLoadingText("");
    setShowPipelineModal(false);
    setActiveModalStep(0);
    setModalOverallProgress(0);
    setVerificationData(null);
  };

  return (
    <div className="flex-1 flex flex-col h-full relative overflow-hidden bg-[#030712]">
      {showPipelineModal && (
        <DiagnosticPipelineModal
          isOpen
          activeStep={activeModalStep}
          overallProgress={modalOverallProgress}
          onCancel={() => setShowPipelineModal(false)}
        />
      )}
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
      <div className="absolute bottom-[-20%] right-[-10%] w-[40vw] h-[40vw] rounded-full bg-[radial-gradient(circle,rgba(16,185,129,0.06),transparent_60%)] blur-[100px] animate-[pulse_12s_ease-in-out_infinite_alternate-reverse] pointer-events-none z-0"></div>
      <div className="absolute top-[40%] left-[60%] w-[30vw] h-[30vw] rounded-full bg-[radial-gradient(circle,rgba(99,102,241,0.05),transparent_60%)] blur-[80px] animate-[pulse_15s_ease-in-out_infinite_alternate] pointer-events-none z-0"></div>
      
      {/* Holographic Grid Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none opacity-20 z-0"></div>

      {/* Subtle Screen Flash on Completion */}
      <div className={`absolute inset-0 bg-[#00e5ff] pointer-events-none transition-opacity duration-700 z-50 ${
        screenFlash ? "opacity-20 mix-blend-overlay" : "opacity-0"
      }`} />
      
      {/* TOP HEADER: Premium Glassmorphic Banner */}
      <div className="h-14 bg-[#0a0f18]/60 backdrop-blur-xl border-b border-white/10 flex items-center px-6 justify-between flex-shrink-0 shadow-[0_4px_30px_rgba(0,0,0,0.5)] relative z-40">
          <div className="flex items-center gap-3 lg:gap-5 text-xs flex-1 min-w-0 overflow-hidden pr-4">
            <div className="flex items-center gap-2 bg-black/40 px-3 py-1.5 rounded-lg border border-white/10 shadow-inner flex-shrink-0">
              <span className="text-slate-500 font-bold uppercase tracking-widest text-[9px] whitespace-nowrap">MRN</span>
              <span className="font-mono text-[#00e5ff] font-black tracking-wider text-xs drop-shadow-[0_0_5px_rgba(0,229,255,0.3)] whitespace-nowrap">{patientInfo.mrn}</span>
            </div>
            <span className="font-black text-slate-100 tracking-wider text-sm uppercase drop-shadow-md truncate">{patientInfo.name}</span>
            <span className="w-1 h-1 rounded-full bg-slate-600 flex-shrink-0 hidden md:block"></span>
            <span className="text-slate-400 font-mono text-[10px] uppercase font-bold tracking-widest flex items-center gap-1.5 whitespace-nowrap hidden md:flex flex-shrink-0"><Clock className="w-3.5 h-3.5 opacity-50"/> DOB: <span className="text-slate-300">{patientInfo.dob}</span> {patientInfo.age !== "-" ? <span className="bg-slate-800/50 px-1.5 py-0.5 rounded text-slate-200">{patientInfo.age}Y</span> : ""}</span>
            <span className="w-1 h-1 rounded-full bg-slate-600 flex-shrink-0 hidden xl:block"></span>
            <span className="text-slate-400 font-mono text-[10px] uppercase font-bold tracking-widest flex items-center gap-1.5 whitespace-nowrap hidden xl:flex flex-shrink-0"><Users className="w-3.5 h-3.5 opacity-50"/> Sex: <span className="text-slate-200">{patientInfo.sex}</span></span>
            <span className="w-1 h-1 rounded-full bg-slate-600 flex-shrink-0 hidden 2xl:block"></span>
            <span className="text-slate-400 font-mono text-[10px] uppercase font-bold tracking-widest flex items-center gap-1.5 whitespace-nowrap hidden 2xl:flex flex-shrink-0"><Stethoscope className="w-3.5 h-3.5 opacity-50"/> Attending: <span className="text-slate-200">{patientInfo.attending}</span></span>
          </div>
          <div className="flex items-center gap-2 lg:gap-4 flex-shrink-0">
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
        <form ref={formRef} onSubmit={handleSubmit} className="flex-1 p-6 flex flex-col gap-6 relative z-10 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent custom-scrollbar patient-verification-panel-anchor">
          
          {/* Patient Verification Panel */}
          <PatientVerificationPanel data={verificationData} />

          {/* Interactive Popups */}
          {activePopup && (
            <div 
              className="fixed inset-0 z-[100]"
              onClick={() => setActivePopup(null)}
              onContextMenu={(e) => { e.preventDefault(); setActivePopup(null); }}
            >
              <div 
                className="absolute bg-[#0f172a] border border-white/20 rounded-lg shadow-2xl p-4 w-64 text-slate-200 text-xs font-sans"
                style={{ 
                  left: Math.min(activePopup.x, window.innerWidth - 260), 
                  top: Math.min(activePopup.y, window.innerHeight - 200) 
                }}
                onClick={(e) => e.stopPropagation()}
              >
                {activePopup.type === 'source' ? (
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between border-b border-white/10 pb-2">
                      <span className="font-bold text-white uppercase tracking-wider">Source Evidence</span>
                      <span className={`text-[8px] px-1.5 py-0.5 rounded-full font-black ${activePopup.source === 'DICOM' ? 'bg-teal-500/20 text-teal-400' : activePopup.source === 'NLP' ? 'bg-purple-500/20 text-purple-400' : 'bg-amber-500/20 text-amber-400'}`}>
                        {activePopup.source}
                      </span>
                    </div>
                    <div className="text-slate-400 leading-relaxed">
                      <div className="mb-1"><strong className="text-slate-300">Field:</strong> {activePopup.label}</div>
                      <div className="mb-1"><strong className="text-slate-300">Value:</strong> {activePopup.value === '--' || activePopup.value === undefined ? 'Not available' : String(activePopup.value)}</div>
                      {activePopup.details?.map(d => <div key={d} className="mb-1">{d}</div>)}
                      {formData.report_date && activePopup.source !== 'MANUAL' && <div><strong className="text-slate-300">Report date:</strong> {formData.report_date}</div>}
                    </div>
                    {activePopup.evidence ? (
                      <div className="bg-black/50 p-2 rounded border border-white/5 text-[10.5px] text-slate-300 leading-relaxed mt-1">
                        <div className="text-[9px] uppercase tracking-wider text-slate-500 mb-1">Evidence from report</div>
                        “{activePopup.evidence}”
                      </div>
                    ) : (
                      <div className="bg-black/50 p-2 rounded border border-white/5 text-[10px] text-slate-500 italic mt-1">
                        {activePopup.source === 'MANUAL' ? 'Entered manually by the clinician.' : 'Not found in the uploaded report. Right-click the row to enter it manually.'}
                      </div>
                    )}
                    <div className="text-[9.5px] text-slate-500">Automatically extracted: verify against the source before use.</div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    <div className="font-bold text-white uppercase tracking-wider border-b border-white/10 pb-2 flex items-center gap-2">
                      <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                      Override Value
                    </div>
                    <div className="text-slate-400 mb-1 leading-relaxed">
                      Change the value for <strong className="text-white">{activePopup.label}</strong>. This will be logged in the audit trail.
                    </div>
                    {activePopup.options ? (
                      <div className="flex flex-wrap gap-2">
                        {activePopup.options.map(opt => (
                          <button key={String(opt.value)} onClick={() => submitOverride(activePopup.field!, opt.value)} className="flex-1 min-w-[56px] bg-slate-700 py-1.5 rounded hover:bg-slate-600 text-slate-200 font-bold uppercase tracking-wider text-[10px]">
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    ) : typeof activePopup.value === 'boolean' ? (
                      <div className="flex gap-2">
                        <button onClick={() => submitOverride(activePopup.field!, true)} className="flex-1 bg-emerald-500/20 text-emerald-400 py-1.5 rounded border border-emerald-500/30 hover:bg-emerald-500/30 font-bold uppercase tracking-wider text-[10px]">Set True</button>
                        <button onClick={() => submitOverride(activePopup.field!, false)} className="flex-1 bg-slate-700 py-1.5 rounded hover:bg-slate-600 text-slate-300 font-bold uppercase tracking-wider text-[10px]">Set False</button>
                      </div>
                    ) : (
                      <form onSubmit={(e) => { 
                        e.preventDefault(); 
                        const val = (e.currentTarget.elements.namedItem('overrideVal') as HTMLInputElement).value;
                        const numVal = Number(val);
                        submitOverride(activePopup.field!, isNaN(numVal) ? val : numVal); 
                      }} className="flex flex-col gap-2">
                        <input 
                          name="overrideVal" 
                          defaultValue={activePopup.value === '--' ? '' : activePopup.value} 
                          className="bg-black/50 border border-white/20 rounded px-2 py-1.5 text-white w-full font-mono outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50" 
                          autoFocus
                        />
                        <button type="submit" className="bg-amber-600 hover:bg-amber-500 text-white font-bold py-1.5 rounded uppercase tracking-wider text-[10px] w-full mt-1">
                          Confirm Override
                        </button>
                      </form>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TOP INPUT ROW */}
          <div className="flex flex-col xl:flex-row gap-6 w-full items-stretch flex-shrink-0">
            {/* LEFT COLUMN: Data Sources */}
            <div className="w-full xl:w-[420px] flex flex-col gap-6 flex-shrink-0">
              
              {/* Panel: Diagnostic Pipeline - Glassmorphic Redesign */}
              <div className="bg-[#0f1522]/60 backdrop-blur-2xl border border-white/10 rounded-2xl flex flex-col shadow-[0_8px_32px_rgba(0,0,0,0.5)] relative overflow-hidden h-full group">
                <div className="absolute inset-0 bg-gradient-to-br from-[#00e5ff]/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>
                
                <div className="bg-gradient-to-r from-black/40 to-transparent px-5 py-3 border-b border-white/10 flex items-center justify-between z-10 relative">
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
                    <input type="file" accept=".dcm,image/dicom,application/dicom,*/*" onChange={handleImageChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" disabled={loading} multiple {...({ webkitdirectory: 'true', directory: 'true' } as React.InputHTMLAttributes<HTMLInputElement>)} />
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
                            <span className="text-[11px] font-mono font-bold truncate max-w-[180px] text-white tracking-wider">{dicomFileCount > 1 ? `${dicomFileCount} DICOM slices loaded` : (imageFile?.name || "DICOM Loaded")}</span>
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
                      
                      <div className="w-full bg-[#0a0e17] h-3 rounded-full overflow-hidden border border-[#00b8d4]/40 relative z-10 shadow-inner">
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

                </div>
                <div className="p-4 bg-gradient-to-t from-black/80 to-transparent backdrop-blur-md border-t border-white/10 sticky bottom-0 z-20 rounded-b-2xl shadow-[0_-10px_30px_rgba(0,0,0,0.5)] mt-auto">
                  <button
                    type="submit"
                    disabled={loading || extracting || (!imageFile && !pdfFile) || (errorMessage !== null && errorMessage.includes('PATIENT MISMATCH'))}
                    className={`relative w-full h-14 rounded-xl flex items-center justify-center font-black text-xs uppercase tracking-[0.25em] transition-all duration-500 overflow-hidden group shadow-lg ${
                      loading || extracting || (!imageFile && !pdfFile) || (errorMessage !== null && errorMessage.includes('PATIENT MISMATCH'))
                        ? loading || extracting
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
                    
                    <div className={`relative z-10 flex items-center justify-center gap-3 h-full w-full transition-all duration-300 ${(loading || extracting) ? "text-[#00e5ff] drop-shadow-[0_0_10px_rgba(0,229,255,1)]" : "drop-shadow-md"}`}>
                      {(loading || extracting) ? (
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
                           <span>{!imageFile && !pdfFile ? "Upload Data Required" : "Initialize Diagnostic Pipeline"}</span>
                        </div>
                      )}
                    </div>
                  </button>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: Clinical Form */}
            <div className="flex-1 grid grid-cols-1 xl:grid-cols-3 gap-4 min-w-0 z-10 items-start">
              
              {/* Panel: Radiological Features */}
              <div className="bg-[#0f1522]/60 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.5)] overflow-hidden relative group">
                <div className="absolute inset-0 bg-gradient-to-bl from-indigo-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>
                <div className="bg-gradient-to-r from-black/40 to-transparent px-4 py-3 border-b border-white/10 relative flex justify-between items-center">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-indigo-400 to-purple-600 shadow-[0_0_10px_#818cf8]"></div>
                  <h2 className="text-[11px] uppercase tracking-[0.2em] text-white font-black flex items-center gap-2 drop-shadow-md">
                    <Microscope className="w-3.5 h-3.5 text-indigo-400 drop-shadow-[0_0_8px_rgba(99,102,241,0.6)]" />
                    2. Radiological Features
                  </h2>
                  <div className="text-[9px] text-slate-400 flex items-center gap-1.5 font-mono bg-black/30 px-2 py-1 rounded border border-white/5">
                    Source: Report{formData.lirads_category ? ` · ${formData.lirads_category}` : ''} <FileText className="w-3 h-3 text-teal-400" />
                  </div>
                </div>
                <div className="p-4 flex flex-col gap-1.5 relative z-10">
                  {([
                    ["Tumor Size", "tumor_size_cm", "cm"],
                    ["Tumor Number", "tumor_number", ""],
                    ["Tumor Density", "tumor_density_hu", "HU"],
                    ["Irregularity", "tumor_shape_irregularity", ""],
                    ["Entropy", "tumor_texture_entropy", ""],
                    ["Margin", "margin_definition", ""],
                    ["Enhancement", "enhancement_pattern", ""],
                  ] as const).map(([label, field, unit]) => (
                    <RadiologyRow
                      key={field}
                      label={label}
                      field={field}
                      value={formData[field]}
                      unit={unit}
                      display={formData[field] === "--" && !manualOverrides[field] ? formData.radiology_meta?.[field]?.display : undefined}
                      overridden={!!manualOverrides[field]}
                      extractionDone={extractionDone}
                      source={formData.sources?.[field]}
                      evidence={formData.evidence?.[field]}
                      onClick={handleSourceClick}
                      onOverride={handleOverrideContext}
                    />
                  ))}
                </div>
              </div>

              {/* Panel: Lab Markers */}
              <div className="bg-[#0f1522]/60 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.5)] overflow-hidden relative group">
                <div className="absolute inset-0 bg-gradient-to-bl from-emerald-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>
                <div className="bg-gradient-to-r from-black/40 to-transparent px-4 py-3 border-b border-white/10 relative flex justify-between items-center">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-emerald-400 to-teal-600 shadow-[0_0_10px_#34d399]"></div>
                  <h2 className="text-[11px] uppercase tracking-[0.2em] text-white font-black flex items-center gap-2 drop-shadow-md">
                    <Activity className="w-3.5 h-3.5 text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
                    3. Lab Markers
                  </h2>
                  <div className="text-[9px] text-slate-400 flex items-center gap-1.5 font-mono bg-black/30 px-2 py-1 rounded border border-white/5">
                    Source: PDF{formData.report_date ? ` · ${formData.report_date}` : ''} <FileText className="w-3 h-3 text-purple-400" />
                  </div>
                </div>
                <div className="p-4 flex flex-col gap-1.5 relative z-10">
                  {([
                    ["AFP", "afp_ngml", "ng/mL", 0, 10],
                    ["ALP", "alp_iul", "IU/L", 40, 120],
                    ["ALT", "alt_iul", "IU/L", 7, 56],
                    ["AST", "ast_iul", "IU/L", 10, 40],
                    ["Bilirubin", "bilirubin_mgdl", "mg/dL", 0.1, 1.2],
                    ["Albumin", "albumin_gdl", "g/dL", 3.5, 5.0],
                    ["Platelets", "platelet_k_ul", "k/µL", 150, 400],
                  ] as const).map(([label, field, unit, min, max]) => (
                    <LabRow
                      key={field}
                      label={label}
                      field={field}
                      value={formData[field]}
                      unit={unit}
                      typicalMin={min}
                      typicalMax={max}
                      meta={formData.lab_meta?.[field]}
                      overridden={!!manualOverrides[field]}
                      extractionDone={extractionDone}
                      evidence={formData.evidence?.[field]}
                      onClick={handleSourceClick}
                      onOverride={handleOverrideContext}
                    />
                  ))}
                </div>
              </div>

              {/* Panel: Phenotypes */}
              <div className="bg-[#0f1522]/60 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.5)] overflow-hidden relative group">
                <div className="absolute inset-0 bg-gradient-to-bl from-amber-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>
                <div className="bg-gradient-to-r from-black/40 to-transparent px-4 py-3 border-b border-white/10 relative flex justify-between items-center">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-amber-400 to-orange-600 shadow-[0_0_10px_#fbbf24]"></div>
                  <h2 className="text-[11px] uppercase tracking-[0.2em] text-white font-black flex items-center gap-2 drop-shadow-md">
                    <Users className="w-3.5 h-3.5 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]" />
                    4. Clinical Phenotypes
                  </h2>
                  <div className="text-[9px] text-slate-400 flex items-center gap-1.5 font-mono bg-black/30 px-2 py-1 rounded border border-white/5">
                    Source: NLP <FileText className="w-3 h-3 text-purple-400" />
                  </div>
                </div>
                <div className="p-4 flex flex-col gap-1.5 relative z-10">
                  {([
                    ["Cirrhosis", "cirrhosis_present"],
                    ["Microvascular invasion", "mvi_pathology"],
                    ["Hepatitis B", "hepatitis_b"],
                    ["Hepatitis C", "hepatitis_c"],
                  ] as const).map(([label, field]) => (
                    <FindingRow
                      key={field}
                      label={label}
                      field={field}
                      value={formData[field]}
                      meta={formData.findings?.[field]}
                      overridden={!!manualOverrides[field]}
                      extractionDone={extractionDone}
                      evidence={formData.evidence?.[field]}
                      onClick={handleSourceClick}
                      onOverride={handleOverrideContext}
                    />
                  ))}
                  <StagingRow
                    label="Child-Pugh"
                    field="child_pugh_score"
                    value={formData.child_pugh_score}
                    display={!manualOverrides.child_pugh_score && formData.child_pugh
                      ? `Class ${formData.child_pugh.class}${formData.child_pugh.score ? ` (${formData.child_pugh.score})` : ''}`
                      : formData.child_pugh_score !== "--" ? `Class ${String(formData.child_pugh_score).charAt(0)}` : undefined}
                    method={formData.child_pugh ? (formData.child_pugh.method === 'calculated' ? 'calculated from labs' : 'as reported') : undefined}
                    options={[{ label: 'A', value: 'A' }, { label: 'B', value: 'B' }, { label: 'C', value: 'C' }, { label: 'Unknown', value: '--' }]}
                    overridden={!!manualOverrides.child_pugh_score}
                    extractionDone={extractionDone}
                    evidence={formData.evidence?.child_pugh_score}
                    onClick={handleSourceClick}
                    onOverride={handleOverrideContext}
                  />
                  <StagingRow
                    label="BCLC stage"
                    field="bclc_stage"
                    value={formData.bclc_stage}
                    display={formData.bclc_stage !== "--" ? `Stage ${formData.bclc_stage}` : undefined}
                    options={["0", "A", "B", "C", "D"].map(v => ({ label: v, value: v })).concat([{ label: 'Unknown', value: '--' }])}
                    overridden={!!manualOverrides.bclc_stage}
                    extractionDone={extractionDone}
                    evidence={formData.evidence?.bclc_stage}
                    onClick={handleSourceClick}
                    onOverride={handleOverrideContext}
                  />
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
              <div className="bg-[#1a2235] px-4 py-2 border-b border-[#1e293b] flex items-center justify-between">
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
              <>
                <div ref={resultsRef} className="w-full bg-[#131826] border border-[#1e293b] rounded-md shadow-lg flex flex-col mt-4">
                  <div className="relative bg-[#0f172a] border-b border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.5)] group flex-shrink-0 z-10">
                    
                    <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6 p-4 md:px-8 md:py-6 bg-[#0a0f18]/60 backdrop-blur-3xl">
                      {/* Left Side: Prognosis (Cox PH recurrence-free survival model) */}
                      <div className="flex items-start w-full md:w-auto min-w-0">
                        <PrognosisSummary
                          outlook={result.recurrence_outlook}
                          classifier={{ probability: result.probability, confidenceInterval: result.confidence_interval }}
                          classifierAbstained={result.ui_rendering_state === "STATE_ABSTAIN_LOCK"}
                          dataDriftDetected={!!result.system_integrity?.data_drift_detected}
                          imagingAnalysed={!!result.interpretability_layer?.dicom_3d_matrix}
                        />
                      </div>
                      
                      {/* Right Side: Timeline & Actions */}
                      <div className="flex flex-col sm:flex-row items-center gap-6 w-full md:w-auto">
                        {/* Recurrence-free survival */}
                        {result.recurrence_outlook && <RecurrenceOutlookPanel outlook={result.recurrence_outlook} />}
                        
                        {/* Actions */}
                        <div className="flex flex-col gap-2 w-full sm:w-auto">
                          <button 
                            type="button" 
                            onClick={handleDownloadPdf}
                            disabled={pdfBusy}
                            className="disabled:opacity-60 disabled:cursor-wait group relative overflow-hidden bg-[#1e293b]/80 hover:bg-[#2a364a] text-slate-200 px-5 py-2.5 rounded-lg border border-[#334155] flex items-center justify-center gap-2 text-[10px] font-black tracking-[0.2em] uppercase transition-all w-full shadow-lg hover:shadow-[0_0_15px_rgba(79,70,229,0.3)] hover:border-indigo-500/50"
                          >
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                            <Download className={`w-4 h-4 text-indigo-400 ${pdfBusy ? 'animate-pulse' : ''}`} />
                            {pdfBusy ? 'GENERATING…' : 'EXPORT PDF'}
                          </button>
                          <div className="text-[9px] font-mono text-slate-500 flex items-center justify-center gap-1 bg-black/40 py-1 rounded border border-white/5">
                            ID: <span className="text-slate-400 font-bold truncate max-w-[120px]">{result.pseudo_anonymous_id}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <ClinicalAssessmentPanel assessment={result.clinical_assessment} fallbackSummary={result.clinical_narrative_summary} />

                  <div className="flex flex-col xl:flex-row bg-[#0a0e17]">
                      {/* Left Column */}
                      <div className="flex-1 flex flex-col min-w-[70%] border-b xl:border-b-0 xl:border-r border-[#1e293b]">
                        {/* MPR Viewer Area */}
                        <div id="mpr-workstation-capture" className="relative p-2 border-b border-[#1e293b] flex flex-col bg-black overflow-hidden" style={{ height: 'calc(max(80vh, 800px) - 200px)' }}>
                          {result?.interpretability_layer?.gradcam_3d_matrix ? (
                            <MprClinicalWorkstation 
                              base64Matrix={result.interpretability_layer.gradcam_3d_matrix} 
                              dicomBase64Matrix={result.interpretability_layer.dicom_3d_matrix}
                              dimensions={result.interpretability_layer.heatmap_spatial_shape} 
                              tumorTarget={result.interpretability_layer.tumor_target}
                              patientInfo={{ name: patientInfo.name, id: patientInfo.mrn }}
                              localDicomFiles={allDicomFiles}
                            />
                          ) : (
                            <div className="flex-1 flex items-center justify-center text-slate-700 font-mono text-xs uppercase">
                                NO VOLUMETRIC DATA RENDERED
                            </div>
                          )}
                        </div>
                        
                        <WhatIfSimulator key={result.inference_id} inferenceId={result.inference_id} />
                      </div>
                      
                      {/* SHAP & Metrics Sidebar */}
                      <div className="w-full xl:w-[350px] p-3 flex flex-col gap-2 bg-[#0a0e17] flex-shrink-0">
                        {dicomFileCount > 1 && (
                            <button
                              type="button"
                              onClick={(e) => { e.preventDefault(); setShowViewerModal(true); }}
                              className="group relative flex items-center justify-center w-full h-11 overflow-hidden rounded-lg bg-[#00e5ff]/10 border border-[#00e5ff]/40 hover:border-[#00e5ff] transition-all shadow-[0_0_15px_rgba(0,229,255,0.15)] hover:shadow-[0_0_25px_rgba(0,229,255,0.4)] cursor-pointer shrink-0 mb-2"
                            >
                              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#00e5ff]/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-in-out"></div>
                              <div className="flex items-center gap-2.5 relative z-10">
                                <Box className="w-4 h-4 text-[#00e5ff] group-hover:rotate-12 transition-transform duration-300" />
                                <span className="text-[10px] font-black text-white tracking-[0.2em] uppercase group-hover:text-[#00e5ff] transition-colors duration-300">
                                  OPEN ORIGINAL 3D PACS
                                </span>
                              </div>
                            </button>
                        )}
                        {result.ui_rendering_state === "STATE_ABSTAIN_LOCK" && (
                          <div className="p-3 bg-red-950/30 border border-red-500/30 rounded text-[10px] text-red-200">
                              <p className="font-bold text-red-400 mb-1 border-b border-red-500/20 pb-1">🛑 UNCERTAINTY BOUNDARY BREACHED</p>
                              <p className="mb-2">Physician manual review strictly required.</p>
                              <button onClick={() => handlePhysicianOverride("HIGH")} className="w-full py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded mb-1 font-bold shadow transition-colors">AUTHORIZE HIGH RISK</button>
                              <button onClick={() => handlePhysicianOverride("LOW")} className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-bold shadow transition-colors">AUTHORIZE LOW RISK</button>
                          </div>
                        )}

                        {result.recurrence_outlook?.explanation && (
                          <RiskExplanationPanel explanation={result.recurrence_outlook.explanation} />
                        )}


                      </div>
                  </div>
                </div>
                <PhysicianVerificationNotes inferenceId={result.inference_id} />
              </>
          ) : (
              <div className="w-full border border-dashed border-[#1e293b] rounded-md flex items-center justify-center bg-[#070b14] h-[300px] mt-4">
                <div className="text-center text-[#1e293b]">
                    <Activity className="w-16 h-16 mx-auto mb-2 opacity-50 text-cyan-500" />
                    <p className="text-xs font-mono uppercase tracking-widest font-bold text-slate-400">AWAITING INFERENCE EXECUTION</p>
                </div>
              </div>
          )}
          
      </form>
      
      
      {/* 3D MPR Viewer Modal */}
      {showViewerModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-6">
          <div className="w-full h-full max-w-[95vw] max-h-[95vh] flex flex-col relative rounded-2xl overflow-hidden shadow-2xl border border-white/20 bg-gray-900">
             <Three3DPacsViewer initialFiles={allDicomFiles} onClose={() => setShowViewerModal(false)} />
          </div>
        </div>
      )}

      {showVerificationToast && (
        <PatientVerificationToast 
          data={verificationData} 
          onClose={() => setShowVerificationToast(false)} 
        />
      )}
    </div>
  );
};
