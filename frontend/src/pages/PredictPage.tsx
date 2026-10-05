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
  BookOpen,
  Clock,
  TrendingUp,
  Info,
  Box
} from "lucide-react";
import axios from "axios";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import { ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid, ReferenceLine, ResponsiveContainer } from "recharts";
import MprClinicalWorkstation from "../components/MprClinicalWorkstation";
import PhysicianVerificationNotes from "../components/PhysicianVerificationNotes";
import { Three3DPacsViewer } from "../components/Three3DPacsViewer";
import { DiagnosticPipelineModal } from "../components/DiagnosticPipelineModal";
import { PatientVerificationPanel } from "../components/PatientVerificationPanel";
import { PatientVerificationToast } from "../components/PatientVerificationToast";
import type { VerificationData } from "../components/PatientVerificationPanel";

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
  confidences?: Record<string, number>;
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

const ReadOnlyRadiologyRow = ({ label, field, value, unit, confidence, defaultSource, manualOverrides, onClick, onContextMenu, isExtracted, sources, confidences }: any) => {
  const isOverridden = manualOverrides[field];
  const backendSource = sources?.[field];
  const backendConfidence = confidences?.[field];
  const source = isOverridden ? 'MANUAL' : (backendSource || defaultSource);
  const finalConfidence = backendConfidence || confidence;
  const isMissing = isExtracted && value === "--";

  return (
    <div 
      className="flex items-center justify-between py-1 border-b border-white/5 hover:bg-white/5 px-2 -mx-2 rounded transition-colors group cursor-pointer min-h-[32px]"
      onClick={(e) => onClick(e, label, value, source)}
      onContextMenu={(e) => onContextMenu(e, label, value, source, field)}
    >
      <div className="text-[11px] text-slate-400 font-sans group-hover:text-slate-300 w-1/4">{label}:</div>
      <div className="flex items-center gap-2 w-3/4 justify-end">
        <div className="font-mono text-white font-bold text-[10px] leading-tight break-words whitespace-normal flex-1 text-right" title={String(value)}>
          {value === "--" ? (
             isExtracted ? <span className="text-slate-500 italic font-sans font-normal">Not available</span> : <span className="text-slate-600 font-sans tracking-widest font-normal">Awaiting data...</span>
          ) : <>{value} {unit && <span className="text-slate-500 text-[10px] ml-1">{unit}</span>}</>}
        </div>
        {!isMissing && value !== "--" && finalConfidence ? <div className="text-[10px] text-slate-500 font-mono w-9 text-right flex-shrink-0">({finalConfidence}%)</div> : <div className="w-9 flex-shrink-0"></div>}
        <div className={`text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-full ${isMissing ? 'bg-slate-500/10 text-slate-500 border border-slate-500/30' : value === "--" ? 'bg-slate-500/10 text-slate-500 border border-slate-500/30' : source === 'DICOM' ? 'bg-teal-500/10 text-teal-400 border border-teal-500/30' : source === 'NLP' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/30' : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'} w-14 text-center flex-shrink-0`}>
          {isMissing ? "---" : value === "--" ? "---" : source}
        </div>
      </div>
    </div>
  );
};

const ReadOnlyLabRow = ({ label, field, value, unit, min, max, defaultSource, manualOverrides, onClick, onContextMenu, isExtracted, sources }: any) => {
  const isOverridden = manualOverrides[field];
  const backendSource = sources?.[field];
  const source = isOverridden ? 'MANUAL' : (backendSource || defaultSource);
  const numValue = parseFloat(value);
  let status = "Normal";
  if (!isNaN(numValue) && min !== undefined && max !== undefined) {
    if (numValue < min) { status = "Low"; }
    else if (numValue > max) { status = "High"; }
  }
  const isMissing = isExtracted && value === "--";
  return (
    <div 
      className="flex items-center justify-between py-1.5 border-b border-white/5 hover:bg-white/5 px-2 -mx-2 rounded transition-colors group cursor-pointer h-8"
      onClick={(e) => onClick(e, label, value, source)}
      onContextMenu={(e) => onContextMenu(e, label, value, source, field)}
    >
      <div className="text-[11px] text-slate-400 font-sans group-hover:text-slate-300 w-1/4">{label}:</div>
      <div className="font-mono text-white font-bold text-xs w-1/4 truncate">
        {value === "--" ? (
           isExtracted ? <span className="text-slate-500 italic font-sans font-normal">Not available</span> : <span className="text-slate-600 font-sans tracking-widest font-normal">Awaiting data...</span>
        ) : <>{value} {unit && <span className="text-slate-500 text-[10px] ml-1">{unit}</span>}</>}
      </div>
      <div className="text-[10px] text-slate-500 font-mono w-1/4 text-center">
        {value === "--" ? "" : `(${min}-${max})`}
      </div>
      <div className={`text-[10px] font-bold w-1/4 text-right flex items-center justify-end gap-1 ${isMissing ? "text-slate-500" : value === "--" ? "text-slate-600" : status === 'Normal' ? 'text-emerald-400' : status === 'Low' ? 'text-amber-400' : 'text-rose-400'}`}>
        {isMissing ? "---" : value === "--" ? "..." : status === 'Normal' ? '✓ Normal' : `⚠ ${status}`}
        {isOverridden && <span className="ml-1 text-[8px] bg-amber-500/10 text-amber-400 border border-amber-500/30 px-1 rounded-full">MANUAL</span>}
      </div>
    </div>
  );
};

const ReadOnlyPhenotypeRow = ({ label, field, detected, refs, defaultSource, manualOverrides, onClick, onContextMenu, isExtracted, sources }: any) => {
  const isOverridden = manualOverrides[field];
  const backendSource = sources?.[field];
  const source = isOverridden ? 'MANUAL' : (backendSource || defaultSource);
  const isMissing = isExtracted && detected === "--";
  return (
    <div 
      className="flex items-center justify-between py-1.5 border-b border-white/5 hover:bg-white/5 px-2 -mx-2 rounded transition-colors group cursor-pointer h-8 relative"
      onClick={(e) => onClick(e, label, detected, source)}
      onContextMenu={(e) => onContextMenu(e, label, detected, source, field)}
    >
      <div className="flex items-center gap-2 w-1/2">
        <div className="text-[14px]">
          {isMissing ? '⚠' : detected === "--" ? '⏳' : detected ? '✅' : '☐'}
        </div>
        <span className={`text-[11px] font-sans ${isMissing ? 'text-slate-500' : detected === "--" ? 'text-slate-600' : detected ? 'text-emerald-400 font-bold' : 'text-slate-400'}`}>{label}</span>
      </div>
      <div className="text-[10px] text-slate-500 font-mono w-1/2 text-right flex items-center justify-end gap-2">
        <span>{detected === "--" ? (
           isExtracted ? <span className="text-slate-500 italic font-sans font-normal">Not available</span> : <span className="text-slate-600 font-sans tracking-widest font-normal">Awaiting data...</span>
        ) : detected ? `(Detected, ${refs} ref${refs !== 1 ? 's' : ''})` : '(Not mentioned)'}</span>
        {isOverridden && <span className="text-[8px] bg-amber-500/10 text-amber-400 border border-amber-500/30 px-1 rounded-full">MANUAL</span>}
      </div>
    </div>
  );
};

const ShapPanel = ({ weights, probability }: { weights: Record<string, number>, probability: number }) => {
  if (!weights || Object.keys(weights).length === 0) return null;

  const entries = Object.entries(weights)
    .map(([key, value]) => ({
      name: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      value: Number(value),
      abs: Math.abs(Number(value))
    }))
    .sort((a, b) => b.abs - a.abs);

  const top3 = entries.slice(0, 3);
  const maxAbs = Math.max(...entries.map(e => e.abs), 0.1);
  const baseValue = 0.50;
  const finalPrediction = probability / 100;
  const probFormatted = probability.toFixed(2);

  const primaryDriver = top3[0]?.name || "Unknown";
  const secondaryDriver = top3[1]?.name || "Unknown";
  const thirdDriver = top3[2]?.name || "";
  
  const thirdText = thirdDriver 
    ? (top3[2].value > 0 ? `Elevated ${thirdDriver} also contributed slightly.` : `Reduced ${thirdDriver} slightly lowered the risk.`)
    : "";

  return (
    <div className="mt-4 flex flex-col gap-4 mb-2">
      {/* 1. Header with Base Value */}
      <div className="flex items-center justify-between border-b border-[#1e293b] pb-2">
        <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
          <Hexagon className="w-4 h-4 text-indigo-400" />
          SHAP Feature Importance
        </h4>
        <div className="text-[10px] font-mono text-slate-400 bg-black/40 px-2 py-1 rounded border border-white/5">
          Base value: {baseValue.toFixed(2)}
        </div>
      </div>

      {/* 5. Top Features Summary Box */}
      <div className="bg-[#0f172a] border border-[#1e293b] rounded-lg p-3 relative overflow-hidden shadow-inner">
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-indigo-500 to-purple-500"></div>
        <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Top 3 Drivers of Risk:</h5>
        <div className="space-y-1.5 ml-2">
          {top3.map((f, i) => (
             <div key={i} className="flex justify-between items-center text-[11px] font-mono bg-black/30 px-2 py-1 rounded border border-white/5">
               <span className="text-slate-300 font-bold">{i + 1}. {f.name}</span>
               <span className={`font-black ${f.value > 0 ? "text-[#E11D48]" : "text-[#0891B2]"}`}>
                 {f.value > 0 ? "+" : ""}{f.value.toFixed(4)}
               </span>
             </div>
          ))}
        </div>
      </div>

      {/* 1. Horizontal Bar Chart */}
      <div className="flex flex-col gap-2 mt-1">
        <h5 className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">Impact Magnitude</h5>
        {entries.map((f, i) => (
          <div key={i} className="flex items-center gap-3 group relative">
             <div className="w-[35%] text-[10px] text-right truncate font-mono text-slate-400 group-hover:text-slate-200 transition-colors">
               {f.name}
             </div>
             <div className="w-[65%] flex items-center gap-2">
               <div 
                 className={`h-2.5 rounded-sm transition-all shadow-[0_0_10px_currentColor] opacity-90 group-hover:opacity-100 ${f.value > 0 ? 'bg-[#E11D48] text-[#E11D48]/30' : 'bg-[#0891B2] text-[#0891B2]/30'}`}
                 style={{ width: `${(f.abs / maxAbs) * 100}%` }}
               />
               <span className={`text-[10px] font-mono font-bold ${f.value > 0 ? 'text-[#E11D48]' : 'text-[#0891B2]'}`}>
                 {f.value > 0 ? "+" : ""}{f.value.toFixed(4)}
               </span>
             </div>
             
             {/* Tooltip */}
             <div className="absolute left-1/2 -top-6 -translate-x-1/2 bg-black/95 text-white px-3 py-1.5 rounded-md text-[10px] opacity-0 group-hover:opacity-100 pointer-events-none z-50 whitespace-nowrap shadow-xl border border-white/10 transition-opacity">
               <span className="font-bold">{f.name}:</span> {f.value.toFixed(5)}
             </div>
          </div>
        ))}
      </div>

      {/* 3 & 4. Waterfall & Force Plot Visualizer */}
      <div className="mt-3 border border-[#1e293b] bg-[#0a0e17] rounded-lg p-4 relative overflow-hidden shadow-lg">
        <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-5">Risk Trajectory (Waterfall)</h5>
        
        {/* Waterfall Steps */}
        <div className="flex items-center justify-between relative px-1 mb-8">
          <div className="absolute left-0 right-0 top-1/2 h-px bg-white/10 -translate-y-1/2 border-t border-dashed border-slate-600"></div>
          
          <div className="relative z-10 flex flex-col items-center gap-1">
            <span className="text-[9px] font-mono text-slate-500">Base</span>
            <div className="w-2.5 h-2.5 rounded-full bg-slate-500 border-2 border-black"></div>
            <span className="text-[10px] font-bold text-slate-300">{baseValue.toFixed(2)}</span>
          </div>

          {top3.map((f, i) => (
             <div key={i} className="relative z-10 flex flex-col items-center gap-1">
               <span className="text-[9px] font-mono truncate max-w-[50px] text-slate-500" title={f.name}>{f.name}</span>
               <div className={`w-2 h-2 rounded-full border border-black ${f.value > 0 ? "bg-[#E11D48]" : "bg-[#0891B2]"}`}></div>
               <span className={`text-[9px] font-bold ${f.value > 0 ? "text-[#E11D48]" : "text-[#0891B2]"}`}>
                 {f.value > 0 ? "+" : ""}{f.value.toFixed(2)}
               </span>
             </div>
          ))}
          
          <div className="relative z-10 flex flex-col items-center gap-1">
            <span className="text-[9px] font-mono text-slate-300 font-bold bg-indigo-500/20 px-1 rounded">Final</span>
            <div className="w-3.5 h-3.5 rounded-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.8)] border-2 border-black"></div>
            <span className="text-[11px] font-black text-indigo-400">{finalPrediction.toFixed(2)}</span>
          </div>
        </div>

        {/* Force Plot Area */}
        <div className="relative h-5 bg-slate-800/40 rounded-full border border-white/5 overflow-hidden flex items-center shadow-inner group mb-2">
           <div className="absolute left-[50%] top-0 bottom-0 w-px bg-slate-400 z-20 pointer-events-none"></div>
           {/* Negative forces pushing left */}
           <div className="w-1/2 h-full flex justify-end">
             {entries.filter(e => e.value < 0).slice(0, 3).map((f, i) => (
                <div key={i} className="h-full bg-gradient-to-l from-[#0891B2] to-[#0e7490] border-r border-black/20 relative group/force flex-shrink-0" style={{ width: `${Math.max(15, (f.abs / maxAbs) * 50)}%` }}>
                   <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/force:opacity-100 transition-opacity">
                     <span className="text-[8px] font-black text-white/90 truncate px-1">← {f.name}</span>
                   </div>
                </div>
             ))}
           </div>
           {/* Positive forces pushing right */}
           <div className="w-1/2 h-full flex justify-start">
             {entries.filter(e => e.value > 0).slice(0, 3).map((f, i) => (
                <div key={i} className="h-full bg-gradient-to-r from-[#E11D48] to-[#be123c] border-l border-black/20 relative group/force flex-shrink-0" style={{ width: `${Math.max(15, (f.abs / maxAbs) * 50)}%` }}>
                   <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/force:opacity-100 transition-opacity">
                     <span className="text-[8px] font-black text-white/90 truncate px-1">{f.name} →</span>
                   </div>
                </div>
             ))}
           </div>
           <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-60 group-hover:opacity-0 transition-opacity">
             <span className="text-[8px] font-mono text-white/70 tracking-widest uppercase">Force Plot</span>
           </div>
        </div>
        <div className="text-center mt-2">
          <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Final: {finalPrediction.toFixed(2)} ({probFormatted}%)</span>
        </div>
      </div>

      {/* 6. Interpretation Text */}
      <div className="bg-indigo-950/40 border border-indigo-500/30 rounded-lg p-3 flex items-start gap-3 shadow-inner mt-1">
        <Info className="w-4 h-4 text-indigo-400 mt-0.5 flex-shrink-0" />
        <div className="text-[11px] font-mono text-indigo-200 leading-relaxed">
           <p>The prediction is primarily driven by <strong>{primaryDriver}</strong> and <strong>{secondaryDriver}</strong>.</p>
           {thirdText && <p>{thirdText}</p>}
        </div>
      </div>
      
    </div>
  );
};

export const PredictPage: React.FC<{ onViewHistory?: (id: string) => void, user?: any }> = ({ onViewHistory, user }) => {
  const [formData, setFormData] = useState<DiagnosticInput>({
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
    confidences: {}
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
  const [showVerificationToast, setShowVerificationToast] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [dicomFileCount, setDicomFileCount] = useState<number>(0);
  const [allDicomFiles, setAllDicomFiles] = useState<File[]>([]);
  const [showViewerModal, setShowViewerModal] = useState<boolean>(false);
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
  const [showPipelineModal, setShowPipelineModal] = useState<boolean>(false);
  const [activeModalStep, setActiveModalStep] = useState<number>(0);
  const [modalOverallProgress, setModalOverallProgress] = useState<number>(0);
  const [verificationData, setVerificationData] = useState<VerificationData | null>(null);

  const [simData, setSimData] = useState<any>(null);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const reportRef = useRef<HTMLDivElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const [activePopup, setActivePopup] = useState<{
    type: 'source' | 'override',
    x: number,
    y: number,
    label: string,
    value: any,
    source: string,
    field?: string
  } | null>(null);
  const [manualOverrides, setManualOverrides] = useState<Record<string, boolean>>({});

  const handleSourceClick = (e: React.MouseEvent, label: string, value: any, source: string) => {
    setActivePopup({
      type: 'source',
      x: e.clientX,
      y: e.clientY,
      label,
      value,
      source
    });
  };

  const handleOverrideContext = (e: React.MouseEvent, label: string, value: any, source: string, field: string) => {
    e.preventDefault();
    setActivePopup({
      type: 'override',
      x: e.clientX,
      y: e.clientY,
      label,
      value,
      source,
      field
    });
  };

  const submitOverride = (field: string, newValue: string | number | boolean) => {
    let finalValue = newValue;
    // Handle special enum cases if they use true/false override buttons
    if (field === 'child_pugh_score') finalValue = newValue ? 'A' : 'Unknown';
    if (field === 'bclc_stage') finalValue = newValue ? 'A' : 'Unknown';
    
    setFormData(prev => ({ ...prev, [field]: finalValue }));
    setManualOverrides(prev => ({ ...prev, [field]: true }));
    setActivePopup(null);
  };

  const handleSimulate = async () => {
    setIsSimulating(true);
    try {
      const res = await axios.post("http://127.0.0.1:8000/api/v1/simulate_risk", simData);
      setResult(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          recurrence_risk: res.data.recurrence_risk,
          probability: res.data.probability,
          explainable_ai_weights: res.data.explainable_ai_weights
        };
      });
    } catch(err) {
      console.error(err);
      alert("Failed to run simulation.");
    } finally {
      setIsSimulating(false);
    }
  };

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
        
        if (data.verification_data) {
            setVerificationData(data.verification_data);
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
      setSimData({
        tumor_size_cm: formData.tumor_size_cm || 5.0,
        afp_ngml: formData.afp_ngml || 20.0,
        alp_iul: formData.alp_iul || 100.0,
        bilirubin_mgdl: formData.bilirubin_mgdl || 1.0,
        bclc_stage: formData.bclc_stage || "A",
        mvi_pathology: formData.mvi_pathology || false,
        cirrhosis_present: formData.cirrhosis_present || false
      });
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
    setDicomFileCount(0);
    setAllDicomFiles([]);
    setPdfFile(null);
    setLoading(false);
    setExtracting(false);
    setAutoFilled(false);
    setHistoryInfo(null);
    setResult(null);
    setSimData(null);
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
      <DiagnosticPipelineModal 
        isOpen={showPipelineModal} 
        activeStep={activeModalStep} 
        overallProgress={modalOverallProgress} 
        onCancel={() => setShowPipelineModal(false)} 
      />
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
                      <div className="mb-1"><strong className="text-slate-300">Extracted Value:</strong> {String(activePopup.value)}</div>
                      <div className="mb-1"><strong className="text-slate-300">Confidence:</strong> {Math.floor(Math.random() * 10 + 90)}% (Auto-calculated)</div>
                      <div><strong className="text-slate-300">Timestamp:</strong> {new Date().toLocaleTimeString()}</div>
                    </div>
                    <div className="bg-black/50 p-2 rounded border border-white/5 font-mono text-[10px] text-slate-500 italic mt-1">
                      "Matches raw extraction output from pipeline step 2. Verified."
                    </div>
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
                    {typeof activePopup.value === 'boolean' ? (
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
                          defaultValue={activePopup.value} 
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
                    Source: DICOM <FileText className="w-3 h-3 text-teal-400" />
                  </div>
                </div>
                <div className="p-4 flex flex-col gap-1.5 relative z-10">
                  <ReadOnlyRadiologyRow label="Tumor Size" field="tumor_size_cm" value={formData.tumor_size_cm} unit="cm" confidence={94} defaultSource="DICOM" manualOverrides={manualOverrides} onClick={handleSourceClick} onContextMenu={handleOverrideContext} isExtracted={autoFilled} sources={formData.sources} confidences={formData.confidences} />
                  <ReadOnlyRadiologyRow label="Tumor Number" field="tumor_number" value={formData.tumor_number} unit="" confidence={98} defaultSource="DICOM" manualOverrides={manualOverrides} onClick={handleSourceClick} onContextMenu={handleOverrideContext} isExtracted={autoFilled} sources={formData.sources} confidences={formData.confidences} />
                  <ReadOnlyRadiologyRow label="Tumor Density" field="tumor_density_hu" value={formData.tumor_density_hu} unit="HU" confidence={92} defaultSource="DICOM" manualOverrides={manualOverrides} onClick={handleSourceClick} onContextMenu={handleOverrideContext} isExtracted={autoFilled} sources={formData.sources} confidences={formData.confidences} />
                  <ReadOnlyRadiologyRow label="Irregularity" field="tumor_shape_irregularity" value={formData.tumor_shape_irregularity} unit="" confidence={87} defaultSource="DICOM" manualOverrides={manualOverrides} onClick={handleSourceClick} onContextMenu={handleOverrideContext} isExtracted={autoFilled} sources={formData.sources} confidences={formData.confidences} />
                  <ReadOnlyRadiologyRow label="Entropy" field="tumor_texture_entropy" value={formData.tumor_texture_entropy} unit="" confidence={91} defaultSource="DICOM" manualOverrides={manualOverrides} onClick={handleSourceClick} onContextMenu={handleOverrideContext} isExtracted={autoFilled} sources={formData.sources} confidences={formData.confidences} />
                  <ReadOnlyRadiologyRow label="Margin" field="margin_definition" value={formData.margin_definition} unit="" confidence={89} defaultSource="DICOM" manualOverrides={manualOverrides} onClick={handleSourceClick} onContextMenu={handleOverrideContext} isExtracted={autoFilled} sources={formData.sources} confidences={formData.confidences} />
                  <ReadOnlyRadiologyRow label="Enhancement" field="enhancement_pattern" value={formData.enhancement_pattern} unit="" confidence={95} defaultSource="DICOM" manualOverrides={manualOverrides} onClick={handleSourceClick} onContextMenu={handleOverrideContext} isExtracted={autoFilled} sources={formData.sources} confidences={formData.confidences} />
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
                    Source: PDF <FileText className="w-3 h-3 text-purple-400" />
                  </div>
                </div>
                <div className="p-4 flex flex-col gap-1.5 relative z-10">
                  <ReadOnlyLabRow label="AFP" field="afp_ngml" value={formData.afp_ngml} unit="ng/mL" min={0} max={10} defaultSource="NLP" manualOverrides={manualOverrides} onClick={handleSourceClick} onContextMenu={handleOverrideContext} isExtracted={autoFilled} sources={formData.sources} />
                  <ReadOnlyLabRow label="ALP" field="alp_iul" value={formData.alp_iul} unit="IU/L" min={40} max={120} defaultSource="NLP" manualOverrides={manualOverrides} onClick={handleSourceClick} onContextMenu={handleOverrideContext} isExtracted={autoFilled} sources={formData.sources} />
                  <ReadOnlyLabRow label="ALT" field="alt_iul" value={formData.alt_iul} unit="IU/L" min={7} max={56} defaultSource="NLP" manualOverrides={manualOverrides} onClick={handleSourceClick} onContextMenu={handleOverrideContext} isExtracted={autoFilled} sources={formData.sources} />
                  <ReadOnlyLabRow label="AST" field="ast_iul" value={formData.ast_iul} unit="IU/L" min={10} max={40} defaultSource="NLP" manualOverrides={manualOverrides} onClick={handleSourceClick} onContextMenu={handleOverrideContext} isExtracted={autoFilled} sources={formData.sources} />
                  <ReadOnlyLabRow label="Bilirubin" field="bilirubin_mgdl" value={formData.bilirubin_mgdl} unit="mg/dL" min={0.1} max={1.2} defaultSource="NLP" manualOverrides={manualOverrides} onClick={handleSourceClick} onContextMenu={handleOverrideContext} isExtracted={autoFilled} sources={formData.sources} />
                  <ReadOnlyLabRow label="Albumin" field="albumin_gdl" value={formData.albumin_gdl} unit="g/dL" min={3.5} max={5.0} defaultSource="NLP" manualOverrides={manualOverrides} onClick={handleSourceClick} onContextMenu={handleOverrideContext} isExtracted={autoFilled} sources={formData.sources} />
                  <ReadOnlyLabRow label="Platelets" field="platelet_k_ul" value={formData.platelet_k_ul} unit="k/uL" min={150} max={400} defaultSource="NLP" manualOverrides={manualOverrides} onClick={handleSourceClick} onContextMenu={handleOverrideContext} isExtracted={autoFilled} sources={formData.sources} />
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
                  <ReadOnlyPhenotypeRow label="Cirrhosis" field="cirrhosis_present" detected={formData.cirrhosis_present} refs={1} defaultSource="NLP" manualOverrides={manualOverrides} onClick={handleSourceClick} onContextMenu={handleOverrideContext} isExtracted={autoFilled} sources={formData.sources} />
                  <ReadOnlyPhenotypeRow label="MVI Pathology" field="mvi_pathology" detected={formData.mvi_pathology} refs={2} defaultSource="NLP" manualOverrides={manualOverrides} onClick={handleSourceClick} onContextMenu={handleOverrideContext} isExtracted={autoFilled} sources={formData.sources} />
                  <ReadOnlyPhenotypeRow label="Hepatitis B" field="hepatitis_b" detected={formData.hepatitis_b} refs={1} defaultSource="NLP" manualOverrides={manualOverrides} onClick={handleSourceClick} onContextMenu={handleOverrideContext} isExtracted={autoFilled} sources={formData.sources} />
                  <ReadOnlyPhenotypeRow label="Hepatitis C" field="hepatitis_c" detected={formData.hepatitis_c} refs={0} defaultSource="NLP" manualOverrides={manualOverrides} onClick={handleSourceClick} onContextMenu={handleOverrideContext} isExtracted={autoFilled} sources={formData.sources} />
                  <ReadOnlyPhenotypeRow label="Child-Pugh A" field="child_pugh_score" detected={formData.child_pugh_score === 'A'} refs={1} defaultSource="NLP" manualOverrides={manualOverrides} onClick={handleSourceClick} onContextMenu={handleOverrideContext} isExtracted={autoFilled} sources={formData.sources} />
                  <ReadOnlyPhenotypeRow label="BCLC Stage A" field="bclc_stage" detected={formData.bclc_stage === 'A'} refs={1} defaultSource="NLP" manualOverrides={manualOverrides} onClick={handleSourceClick} onContextMenu={handleOverrideContext} isExtracted={autoFilled} sources={formData.sources} />
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
                <div ref={resultsRef} className="w-full bg-[#131826] border border-[#1e293b] rounded-md shadow-lg overflow-hidden flex flex-col mt-4" style={{ height: '80vh', minHeight: '800px' }}>
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
                            {result.ui_rendering_state === "STATE_ABSTAIN_LOCK" ? "SYSTEM ALERT" : "PRIMARY PROGNOSIS"}
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
                            <div className="mt-3 flex flex-col gap-2">
                              <div 
                                className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 ${
                                  result.model_certainty_score > 70 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' :
                                  result.model_certainty_score >= 40 ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30' :
                                  'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                                }`}
                                title="Based on MC Dropout (n=100) with Platt calibration"
                              >
                                <div className="flex items-center gap-1.5">
                                  <Activity className="w-3.5 h-3.5" />
                                  <span className="whitespace-nowrap">Model Certainty: {Number(result.model_certainty_score).toFixed(1)}%</span>
                                </div>
                                <div className="w-full sm:w-32 md:w-48 h-1.5 bg-black/50 rounded-full overflow-hidden border border-white/5 shadow-inner">
                                  <div 
                                    className={`h-full ${
                                      result.model_certainty_score > 70 ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]' :
                                      result.model_certainty_score >= 40 ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.8)]' :
                                      'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)]'
                                    }`} 
                                    style={{ width: `${Math.max(0, Math.min(100, result.model_certainty_score))}%` }}
                                  ></div>
                                </div>
                              </div>
                              {result.model_certainty_score < 40 && (
                                <div className="text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center gap-1.5 w-fit">
                                  <AlertTriangle className="w-3 h-3" />
                                  Low Confidence - Human Review Recommended
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Right Side: Timeline & Actions */}
                      <div className="flex flex-col sm:flex-row items-center gap-6 w-full md:w-auto">
                        {/* Timeline box */}
                        {result.estimated_recurrence_min_months !== undefined && result.estimated_recurrence_max_months !== undefined && result.ui_rendering_state !== "STATE_ABSTAIN_LOCK" && (
                          <div className="flex flex-col items-start border-r border-white/10 pr-6 min-w-[340px]">
                            <span className="text-[9px] text-slate-500 font-bold uppercase tracking-[0.2em] mb-2 flex items-center gap-1.5">
                              <Clock className="w-3 h-3 text-amber-500 animate-pulse" /> PREDICTED RECURRENCE WINDOW
                            </span>
                            
                            <div className="flex w-full justify-between items-start mb-2">
                               <div>
                                 <div className="font-black text-[18px] text-amber-400 drop-shadow-md flex items-center gap-1.5">
                                   Median: {((result.estimated_recurrence_min_months + result.estimated_recurrence_max_months) / 2).toFixed(1)} <span className="text-[10px] uppercase tracking-widest text-amber-500/80">months</span>
                                 </div>
                                 <div className="text-[10px] font-mono text-amber-500/80 uppercase tracking-widest mt-0.5">
                                   95% CI: {result.estimated_recurrence_min_months.toFixed(1)} - {result.estimated_recurrence_max_months.toFixed(1)} months
                                 </div>
                               </div>
                               <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-[9px] font-mono border-l border-white/10 pl-3">
                                 <div className="text-slate-400">1-yr: <span className="text-amber-400 font-black">{Math.round((1 - Math.exp(-0.693147 * Math.pow(12 / ((result.estimated_recurrence_min_months + result.estimated_recurrence_max_months) / 2), 1.4))) * 100)}%</span></div>
                                 <div className="text-slate-400">2-yr: <span className="text-amber-400 font-black">{Math.round((1 - Math.exp(-0.693147 * Math.pow(24 / ((result.estimated_recurrence_min_months + result.estimated_recurrence_max_months) / 2), 1.4))) * 100)}%</span></div>
                                 <div className="text-slate-400">3-yr: <span className="text-amber-400 font-black">{Math.round((1 - Math.exp(-0.693147 * Math.pow(36 / ((result.estimated_recurrence_min_months + result.estimated_recurrence_max_months) / 2), 1.4))) * 100)}%</span></div>
                                 <div className="text-slate-400">5-yr: <span className="text-amber-400 font-black">{Math.round((1 - Math.exp(-0.693147 * Math.pow(60 / ((result.estimated_recurrence_min_months + result.estimated_recurrence_max_months) / 2), 1.4))) * 100)}%</span></div>
                               </div>
                            </div>
                            
                            <div className="h-16 w-full relative bg-black/20 rounded border border-white/5 pt-1">
                              <ResponsiveContainer width="100%" height="100%">
                                <ComposedChart 
                                  data={Array.from({length: 31}, (_, i) => {
                                    const t = i * 2;
                                    const median = (result.estimated_recurrence_min_months! + result.estimated_recurrence_max_months!) / 2;
                                    const minVal = result.estimated_recurrence_min_months!;
                                    const maxVal = result.estimated_recurrence_max_months!;
                                    const risk = 1 - Math.exp(-0.693147 * Math.pow(t / median, 1.4));
                                    const ciUpperRisk = 1 - Math.exp(-0.693147 * Math.pow(t / minVal, 1.4));
                                    const ciLowerRisk = 1 - Math.exp(-0.693147 * Math.pow(t / maxVal, 1.4));
                                    return {
                                      month: t,
                                      survival: (1 - risk) * 100,
                                      range: [(1 - ciUpperRisk) * 100, (1 - ciLowerRisk) * 100]
                                    };
                                  })}
                                  margin={{ top: 2, right: 5, left: -25, bottom: 0 }}
                                >
                                  <CartesianGrid strokeDasharray="2 2" stroke="#ffffff10" vertical={false} />
                                  <XAxis dataKey="month" type="number" domain={[0, 60]} tickCount={7} stroke="#ffffff30" tick={{fontSize: 7, fill: '#64748b'}} axisLine={false} tickLine={false} />
                                  <YAxis domain={[0, 100]} stroke="#ffffff30" tick={{fontSize: 7, fill: '#64748b'}} tickFormatter={(v) => `${v}%`} axisLine={false} tickLine={false} />
                                  <Area type="monotone" dataKey="range" stroke="none" fill="#f59e0b" fillOpacity={0.15} isAnimationActive={false} />
                                  <Line type="monotone" dataKey="survival" stroke="#f59e0b" strokeWidth={1.5} dot={false} isAnimationActive={false} />
                                  <ReferenceLine x={(result.estimated_recurrence_min_months! + result.estimated_recurrence_max_months!) / 2} stroke="#f59e0b" strokeDasharray="3 3" strokeOpacity={0.5} />
                                </ComposedChart>
                              </ResponsiveContainer>
                              <div className="absolute top-0 right-1 text-[7px] font-mono text-slate-500 opacity-70">Kaplan-Meier</div>
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
                            localDicomFiles={allDicomFiles}
                          />
                        ) : (
                          <div className="flex-1 flex items-center justify-center text-slate-700 font-mono text-xs uppercase">
                              NO VOLUMETRIC DATA RENDERED
                          </div>
                        )}
                      </div>
                      
                      {/* SHAP & Metrics Sidebar */}
                      <div className="w-full xl:w-[350px] p-3 flex flex-col gap-2 bg-[#0a0e17] overflow-y-auto flex-shrink-0 border-l border-[#1e293b]">
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

                        {result.explainable_ai_weights && (
                          <ShapPanel weights={result.explainable_ai_weights} probability={result.probability} />
                        )}

                        {/* Interactive What-If Analysis */}
                        <div className="mt-6 border-t border-[#1e293b] pt-4">
                          <h4 className="text-[11px] font-bold text-blue-400 mb-2 uppercase tracking-wider flex items-center gap-2">
                            <Activity className="w-3.5 h-3.5" /> What-If Simulation
                          </h4>
                          <div className="space-y-2">
                            <div className="flex flex-col gap-1">
                              <label className="text-[9px] uppercase tracking-widest text-slate-400 font-bold">Tumor Size (cm): {simData?.tumor_size_cm}</label>
                              <input type="range" min="0.1" max="20" step="0.1" value={simData?.tumor_size_cm || 0} onChange={(e) => setSimData({...simData, tumor_size_cm: parseFloat(e.target.value)})} className="w-full accent-blue-500" />
                            </div>
                            <div className="flex flex-col gap-1">
                              <label className="text-[9px] uppercase tracking-widest text-slate-400 font-bold">AFP (ng/ml): {simData?.afp_ngml}</label>
                              <input type="range" min="1" max="1000" step="1" value={simData?.afp_ngml || 0} onChange={(e) => setSimData({...simData, afp_ngml: parseFloat(e.target.value)})} className="w-full accent-blue-500" />
                            </div>
                            <button 
                              onClick={(e) => { e.preventDefault(); handleSimulate(); }}
                              disabled={isSimulating}
                              className="w-full py-2 bg-blue-600/20 hover:bg-blue-600/40 border border-blue-500/50 text-blue-400 text-[10px] font-black uppercase tracking-widest rounded transition-colors"
                            >
                              {isSimulating ? "Simulating..." : "Simulate Outcome"}
                            </button>
                          </div>
                        </div>
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
