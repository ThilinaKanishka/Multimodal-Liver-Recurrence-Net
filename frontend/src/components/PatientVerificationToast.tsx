import React, { useEffect, useState } from 'react';
import { CheckCircle, XCircle, X, Minus, Maximize2 } from 'lucide-react';
import type { VerificationData, VerificationField } from './PatientVerificationPanel';

interface PatientVerificationToastProps {
  data: VerificationData | null;
  onClose: () => void;
}

export const PatientVerificationToast: React.FC<PatientVerificationToastProps> = ({ data, onClose }) => {
  const [isClosing, setIsClosing] = useState(false);
  const [viewMode, setViewMode] = useState<'minimized' | 'normal' | 'maximized'>('normal');
  const [timeLeft, setTimeLeft] = useState(10000);
  const [isHovered, setIsHovered] = useState(false);
  const [autoDismissStopped, setAutoDismissStopped] = useState(false);

  useEffect(() => {
    if (!data) return;

    if (!data.is_mismatch && !autoDismissStopped && !isHovered && viewMode === 'normal') {
      if (timeLeft <= 0) {
        handleClose();
        return;
      }

      const timer = setInterval(() => {
        setTimeLeft(prev => prev - 50);
      }, 50);

      return () => clearInterval(timer);
    }
  }, [data, isHovered, autoDismissStopped, timeLeft, viewMode]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
    }, 200); 
  };

  const handleToastClick = () => {
    if (viewMode === 'minimized') {
      setViewMode('normal');
    }
  };

  if (!data) return null;

  if (viewMode === 'minimized') {
    return (
      <div 
        onClick={handleToastClick}
        className={`fixed top-6 right-6 w-80 h-[50px] bg-[#0f1522] border rounded-lg shadow-[0_10px_40px_rgba(0,0,0,0.5)] z-[9999] flex items-center justify-between px-4 cursor-pointer transition-all duration-300 animate-in fade-in ${isClosing ? 'translate-x-[400px] ease-in opacity-0' : 'translate-x-0'} ${data.is_mismatch ? 'border-amber-500/50' : 'border-[#00ff9d]/50'}`}
        style={{ transform: isClosing ? 'translateX(400px)' : 'translateX(0)' }}
      >
        <div className="flex items-center gap-3">
           {data.is_mismatch ? <XCircle className="w-5 h-5 text-amber-500 shrink-0" /> : <CheckCircle className="w-5 h-5 text-[#00ff9d] shrink-0" />}
           <span className={`text-[10px] font-black tracking-widest truncate max-w-[200px] ${data.is_mismatch ? 'text-amber-500' : 'text-[#00ff9d]'}`}>
             {data.is_mismatch ? '⚠ PATIENT MISMATCH' : `✅ VERIFIED — ${data.name?.dicom_value || "UNKNOWN"}`}
           </span>
        </div>
        <div className="flex gap-2 text-slate-500">
           <Maximize2 className="w-3.5 h-3.5 hover:text-white" onClick={(e) => { e.stopPropagation(); setViewMode('normal'); }} />
           <X className="w-4 h-4 hover:text-white" onClick={(e) => { e.stopPropagation(); handleClose(); }} />
        </div>
      </div>
    );
  }

  if (viewMode === 'maximized') {
    return (
      <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/80 backdrop-blur-sm p-6 animate-in fade-in duration-300">
        <div className={`w-full max-w-3xl bg-[#0f1522] border rounded-xl flex flex-col overflow-hidden ${data.is_mismatch ? 'border-amber-500/50 shadow-[0_0_60px_rgba(245,158,11,0.2)]' : 'border-[#00ff9d]/50 shadow-[0_0_60px_rgba(0,255,157,0.2)]'}`}>
          <div className="flex items-center justify-between p-5 border-b border-white/10 bg-black/40">
             <div className="flex items-center gap-3">
               {data.is_mismatch ? <XCircle className="w-6 h-6 text-amber-500" /> : <CheckCircle className="w-6 h-6 text-[#00ff9d]" />}
               <h2 className={`text-sm font-black tracking-widest ${data.is_mismatch ? 'text-amber-500' : 'text-[#00ff9d]'}`}>
                 {data.is_mismatch ? 'PATIENT MISMATCH DETECTED' : 'PATIENT VERIFIED'}
               </h2>
             </div>
             <div className="flex items-center gap-4 text-slate-500">
               <button onClick={() => setViewMode('normal')} className="hover:text-white transition-colors"><Minus className="w-5 h-5" /></button>
               <button onClick={handleClose} className="hover:text-white transition-colors"><X className="w-5 h-5" /></button>
             </div>
          </div>
          
          <div className="p-8 grid grid-cols-2 gap-10 text-sm text-slate-300 bg-[#0a0f18]/80">
             <div>
               <h4 className="text-white font-bold mb-5 border-b border-white/10 pb-2 flex items-center gap-2">
                 <span className="bg-white/10 px-2 py-1 rounded text-xs">SOURCE 1</span> DICOM METADATA
               </h4>
               <div className="space-y-4 font-mono text-[13px]">
                 <div className="flex justify-between"><span className="text-slate-500">Name:</span> <span className="text-white">{data.name?.dicom_value || "—"}</span></div>
                 <div className="flex justify-between"><span className="text-slate-500">MRN:</span> <span className="text-white">{data.mrn?.dicom_value || "—"}</span></div>
                 <div className="flex justify-between"><span className="text-slate-500">DOB:</span> <span className="text-white">{data.dob?.dicom_value || "—"}</span></div>
                 <div className="flex justify-between"><span className="text-slate-500">Age:</span> <span className="text-white">{data.age?.dicom_value || "—"}</span></div>
                 <div className="flex justify-between"><span className="text-slate-500">Sex:</span> <span className="text-white">{data.sex?.dicom_value || "—"}</span></div>
                 
                 <div className="pt-6 mt-6 border-t border-white/5 space-y-2">
                   <div className="flex justify-between"><span className="text-slate-500">Modality:</span> <span className="text-slate-400">CT</span></div>
                   <div className="flex justify-between"><span className="text-slate-500">Study Date:</span> <span className="text-slate-400">2026-09-15</span></div>
                   <div className="flex justify-between"><span className="text-slate-500">Series Info:</span> <span className="text-slate-400">PORTAL VENOUS PHASE</span></div>
                 </div>
               </div>
             </div>
             
             <div>
               <h4 className="text-white font-bold mb-5 border-b border-white/10 pb-2 flex items-center gap-2">
                 <span className="bg-white/10 px-2 py-1 rounded text-xs">SOURCE 2</span> CLINICAL REPORT
               </h4>
               <div className="space-y-4 font-mono text-[13px]">
                 <div className="flex justify-between"><span className="text-slate-500">Name:</span> <span className="text-white flex items-center gap-2">{data.name?.report_value || "—"} {!data.name?.match && data.is_mismatch && <XCircle className="w-4 h-4 text-rose-500"/>}</span></div>
                 <div className="flex justify-between"><span className="text-slate-500">MRN:</span> <span className="text-white flex items-center gap-2">{data.mrn?.report_value || "—"} {!data.mrn?.match && data.is_mismatch && <XCircle className="w-4 h-4 text-rose-500"/>}</span></div>
                 <div className="flex justify-between"><span className="text-slate-500">DOB:</span> <span className="text-white flex items-center gap-2">{data.dob?.report_value || "—"} {!data.dob?.match && data.is_mismatch && <XCircle className="w-4 h-4 text-rose-500"/>}</span></div>
                 <div className="flex justify-between"><span className="text-slate-500">Age:</span> <span className="text-white flex items-center gap-2">{data.age?.report_value || "—"} {!data.age?.match && data.is_mismatch && <XCircle className="w-4 h-4 text-rose-500"/>}</span></div>
                 <div className="flex justify-between"><span className="text-slate-500">Sex:</span> <span className="text-white flex items-center gap-2">{data.sex?.report_value || "—"} {!data.sex?.match && data.is_mismatch && <XCircle className="w-4 h-4 text-rose-500"/>}</span></div>
                 
                 <div className="pt-6 mt-6 border-t border-white/5 space-y-2">
                   <div className="flex justify-between"><span className="text-slate-500">Radiologist:</span> <span className="text-slate-400">Dr. Sarah Chen</span></div>
                   <div className="flex justify-between"><span className="text-slate-500">Referring:</span> <span className="text-slate-400">Dr. James Wilson</span></div>
                   <div className="flex justify-between"><span className="text-slate-500">Format:</span> <span className="text-slate-400">Unstructured PDF Text</span></div>
                 </div>
               </div>
             </div>
          </div>
          
          <div className="p-4 bg-black/40 flex justify-end">
            <button onClick={() => setViewMode('normal')} className="px-6 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded font-bold text-xs uppercase tracking-widest transition-colors">Close Detailed View</button>
          </div>
        </div>
      </div>
    );
  }

  // NORMAL STATE
  return (
    <div 
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`fixed top-6 right-6 w-80 bg-[#0f1522] border rounded-lg shadow-[0_10px_40px_rgba(0,0,0,0.5)] z-[9999] overflow-hidden transition-transform duration-${isClosing ? '200' : '300'} ${isClosing ? 'translate-x-[400px] ease-in opacity-0' : 'translate-x-0 ease-out animate-in slide-in-from-right-8 opacity-100'} ${data.is_mismatch ? 'border-amber-500/50' : 'border-[#00ff9d]/50'}`}
      style={{ transform: isClosing ? 'translateX(400px)' : 'translateX(0)' }}
    >
      <div className="flex items-start justify-between p-3 border-b border-white/5 bg-black/40">
        <div className="flex items-center gap-2">
          {data.is_mismatch ? (
            <XCircle className="w-5 h-5 text-amber-500" />
          ) : (
            <CheckCircle className="w-5 h-5 text-[#00ff9d]" />
          )}
          <div>
            <h3 className={`text-[11px] font-black tracking-wider ${data.is_mismatch ? 'text-amber-500' : 'text-[#00ff9d]'}`}>
              {data.is_mismatch ? '⚠ PATIENT MISMATCH' : '✅ PATIENT VERIFIED'}
            </h3>
            <p className="text-[10px] text-slate-400 font-mono">
              {data.is_mismatch ? 'Review required — fields differ' : 'DICOM ↔ Report Match'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-slate-500">
          <button 
            onClick={(e) => { e.stopPropagation(); setViewMode('minimized'); setAutoDismissStopped(true); }}
            className="hover:text-white transition-colors"
          ><Minus className="w-3.5 h-3.5" /></button>
          <button 
            onClick={(e) => { e.stopPropagation(); setViewMode('maximized'); setAutoDismissStopped(true); }}
            className="hover:text-white transition-colors"
          ><Maximize2 className="w-3.5 h-3.5" /></button>
          <button 
            onClick={handleClose}
            className="hover:text-rose-400 transition-colors ml-0.5"
          ><X className="w-4 h-4" /></button>
        </div>
      </div>

      <div className="p-3 bg-[#0a0f18]/80">
        <div className="space-y-1.5 text-[10px] font-mono">
          {['name', 'mrn', 'dob', 'sex', 'age'].map((key) => {
            const field = data[key as keyof VerificationData] as VerificationField;
            if (data.is_mismatch && field.match) return null; 
            
            const labelMap: Record<string, string> = {
              name: 'Name',
              mrn: 'MRN',
              dob: 'DOB',
              sex: 'Sex',
              age: 'Age'
            };

            return (
              <div key={key} className="flex justify-between items-center">
                <span className="text-slate-500">{labelMap[key]}:</span>
                <div className="flex items-center gap-1">
                  <span className="text-white font-bold truncate max-w-[150px]" title={field.dicom_value || field.report_value}>
                    {data.is_mismatch ? (field.dicom_value || "—") + ' ≠ ' + (field.report_value || "—") : (field.dicom_value || field.report_value || "—")}
                  </span>
                  {data.is_mismatch && !field.match && <XCircle className="w-3 h-3 text-rose-500 shrink-0" />}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex p-2 gap-2 border-t border-white/5 bg-black/40">
        <button 
          className="flex-1 bg-white/5 hover:bg-white/10 text-white text-[10px] font-bold py-1.5 rounded transition-colors"
          onClick={() => {
            setViewMode('maximized');
            setAutoDismissStopped(true);
          }}
        >
          View Details
        </button>
        <button 
          className="flex-1 bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 text-[10px] font-bold py-1.5 rounded transition-colors"
          onClick={handleClose}
        >
          Dismiss
        </button>
      </div>
      
      {!data.is_mismatch && (
        <div className="h-4 bg-black w-full relative flex items-center justify-center">
          <div 
            className="absolute left-0 top-0 bottom-0 bg-[#00ff9d]/30 transition-all duration-75 ease-linear"
            style={{ width: `${(timeLeft / 10000) * 100}%` }}
          />
          <span className="text-[8px] font-mono font-bold tracking-widest text-[#00ff9d] relative z-10">
            {autoDismissStopped ? 'AUTO-DISMISS PAUSED' : isHovered ? 'PAUSED' : `CLOSING IN ${Math.ceil(timeLeft / 1000)}s...`}
          </span>
        </div>
      )}
    </div>
  );
};
