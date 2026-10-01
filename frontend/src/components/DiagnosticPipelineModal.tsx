import React, { useState, useEffect } from 'react';
import { CheckCircle } from 'lucide-react';

interface DiagnosticPipelineModalProps {
  isOpen: boolean;
  activeStep: number;
  overallProgress: number;
  onCancel?: () => void;
}

export const DiagnosticPipelineModal: React.FC<DiagnosticPipelineModalProps> = ({
  isOpen,
  activeStep,
  overallProgress,
  onCancel
}) => {
  // We want to animate the running step's progress from 0 to 90 (it hits 100 when done)
  const [runningStepProgress, setRunningStepProgress] = useState(0);

  useEffect(() => {
    setRunningStepProgress(0);
    if (!isOpen || activeStep >= 7) return;

    // Fast increment while running
    const interval = setInterval(() => {
      setRunningStepProgress(prev => {
        if (prev < 90) return prev + Math.floor(Math.random() * 5) + 2;
        return prev;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [activeStep, isOpen]);

  if (!isOpen) return null;

  const steps = [
    { title: "DICOM Volume Loading", subtitle: "Loaded slices, 512×512×Z voxels" },
    { title: "Clinical Report Parsing", subtitle: "Extracted AFP, MVI status, BCLC stage" },
    { title: "Image Feature Extraction", subtitle: "Running 3D CNN embedding..." },
    { title: "Text Feature Extraction", subtitle: "Running ClinicalBERT..." },
    { title: "Multimodal Fusion", subtitle: "Cross-modal attention..." },
    { title: "Prediction & SHAP", subtitle: "Generating risk score..." },
    { title: "Grad-CAM Heatmap", subtitle: "Computing explainability..." },
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[rgba(0,0,0,0.65)] backdrop-blur-[8px] transition-all duration-300 animate-in fade-in">
      <div className="bg-[rgba(15,23,42,0.95)] border border-[rgba(20,184,166,0.3)] rounded-2xl p-6 w-full max-w-[600px] shadow-[0_0_40px_rgba(20,184,166,0.15)] flex flex-col gap-6 relative overflow-hidden animate-in zoom-in-95 duration-300">
         {/* Top Gradient Line */}
         <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#00e5ff] via-indigo-500 to-[#00ff9d]"></div>
         
         {/* Header */}
         <div className="flex flex-col gap-1 items-center text-center mt-2">
           <h2 className="text-xl font-black text-white uppercase tracking-widest drop-shadow-md">HepatoAI Diagnostic Pipeline</h2>
           <p className="text-sm text-[#00e5ff] font-mono tracking-wide">Processing multimodal data...</p>
         </div>

         {/* Steps */}
         <div className="flex flex-col gap-3 max-h-[50vh] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
            {steps.map((step, index) => {
               const status = index < activeStep ? 'done' : index === activeStep ? 'running' : 'pending';
               
               let displayProgress = 0;
               if (status === 'done') displayProgress = 100;
               else if (status === 'running') displayProgress = runningStepProgress;

               return (
                 <div key={index} className={`flex items-start gap-4 p-3 rounded-lg border transition-all duration-500 ${
                   status === 'done' ? 'bg-[#00ff9d]/5 border-[#00ff9d]/30' :
                   status === 'running' ? 'bg-[#00e5ff]/10 border-[#00e5ff]/50 shadow-[0_0_15px_rgba(0,229,255,0.2)]' :
                   'bg-white/5 border-white/10 opacity-50'
                 }`}>
                    <div className="flex-shrink-0 mt-0.5">
                      {status === 'done' && <CheckCircle className="w-5 h-5 text-[#00ff9d]" />}
                      {status === 'running' && <div className="w-5 h-5 border-2 border-[#00e5ff] border-t-transparent rounded-full animate-spin" />}
                      {status === 'pending' && <div className="w-5 h-5 rounded-full border-2 border-slate-500" />}
                    </div>
                    <div className="flex-1 flex flex-col gap-1.5">
                       <div className="flex justify-between items-center text-sm font-bold tracking-wide">
                          <span className={status === 'done' ? 'text-white' : status === 'running' ? 'text-[#00e5ff]' : 'text-slate-400'}>
                             Step {index + 1}: {step.title}
                          </span>
                          <span className={status === 'done' ? 'text-[#00ff9d]' : status === 'running' ? 'text-[#00e5ff]' : 'text-slate-500'}>
                             {displayProgress}%
                          </span>
                       </div>
                       <p className="text-[11px] font-mono text-slate-400">{step.subtitle}</p>
                       
                       {/* Progress bar */}
                       <div className="h-1.5 w-full bg-black/50 rounded-full overflow-hidden">
                          <div 
                            className={`h-full transition-all duration-300 ease-out ${status === 'done' ? 'bg-[#00ff9d]' : 'bg-[#00e5ff]'}`}
                            style={{ width: `${displayProgress}%` }}
                          />
                       </div>
                    </div>
                 </div>
               )
            })}
         </div>

         {/* Footer */}
         <div className="flex flex-col gap-3 mt-2 pt-4 border-t border-white/10">
            <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              <span>Overall Progress</span>
              {activeStep >= 7 ? (
                <span className="text-[#00ff9d] animate-pulse">Complete!</span>
              ) : (
                <span>~8 seconds remaining</span>
              )}
            </div>
            <div className="flex items-center gap-4">
                <div className="h-2 flex-1 bg-black/50 rounded-full overflow-hidden border border-white/10">
                   <div className="h-full bg-gradient-to-r from-indigo-500 via-[#00e5ff] to-[#00ff9d] transition-all duration-500 ease-out shadow-[0_0_10px_#00e5ff]" style={{ width: `${overallProgress}%` }} />
                </div>
                <span className="text-xs font-black text-white w-10 text-right">{overallProgress}%</span>
            </div>
            {onCancel && (
              <button onClick={onCancel} className="mt-2 text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:text-white transition-colors self-center">
                Cancel
              </button>
            )}
         </div>
      </div>
    </div>
  );
};
