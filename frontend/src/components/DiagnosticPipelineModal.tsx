import React, { useState, useEffect, useRef } from 'react';
import {
  Check,
  Loader2,
  ScanLine,
  FileText,
  Box,
  Brain,
  GitMerge,
  Activity,
  Flame,
  ShieldCheck,
  Terminal,
  Cpu,
  X,
  type LucideIcon,
} from 'lucide-react';

interface DiagnosticPipelineModalProps {
  isOpen: boolean;
  activeStep: number;
  overallProgress: number;
  onCancel?: () => void;
}

interface StageDef {
  title: string;
  description: string;
  model: string;
  icon: LucideIcon;
  logs: string[];
}

const STAGES: StageDef[] = [
  {
    title: 'DICOM Volume Loading',
    description: 'Reading series, resampling to 512×512×Z voxels',
    model: 'pydicom · SimpleITK',
    icon: ScanLine,
    logs: ['Parsing DICOM headers', 'Sorting slices by ImagePositionPatient', 'Resampling to isotropic spacing'],
  },
  {
    title: 'Clinical Report Parsing',
    description: 'Extracting AFP, MVI status and BCLC stage',
    model: 'PyMuPDF · spaCy',
    icon: FileText,
    logs: ['Extracting text from report', 'Resolving AFP, ALP, bilirubin values', 'Mapping BCLC stage & MVI status'],
  },
  {
    title: 'Image Feature Extraction',
    description: '3D CNN embedding of segmented liver volume',
    model: 'Volumetric 3D CNN',
    icon: Box,
    logs: ['Loading CNN weights to device', 'Normalizing HU intensities', 'Computing volume embedding'],
  },
  {
    title: 'Text Feature Extraction',
    description: 'Contextual embedding of clinical narrative',
    model: 'spaCy NLP',
    icon: Brain,
    logs: ['Tokenizing clinical narrative', 'Extracting clinical entities', 'Encoding text feature vector'],
  },
  {
    title: 'Multimodal Fusion',
    description: 'Cross-modal attention across image, text and tabular',
    model: 'CMFA',
    icon: GitMerge,
    logs: ['Projecting modalities to shared space', 'Applying cross-modal attention', 'Aggregating fused representation'],
  },
  {
    title: 'Risk Prediction & SHAP',
    description: 'Recurrence risk scoring with feature attribution',
    model: 'XGBoost · TreeSHAP',
    icon: Activity,
    logs: ['Computing recurrence probability', 'Estimating SHAP attributions', 'Calibrating risk category'],
  },
  {
    title: 'Grad-CAM Explainability',
    description: 'Generating volumetric attention heatmap',
    model: 'Grad-CAM',
    icon: Flame,
    logs: ['Back-propagating target gradients', 'Building 3D saliency map', 'Rendering overlay slices'],
  },
];

const formatDuration = (ms: number) => `${(ms / 1000).toFixed(1)}s`;

const formatClock = (ms: number) => {
  const total = Math.floor(ms / 1000);
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
};

interface LogLine {
  time: number;
  level: 'info' | 'success';
  text: string;
}

interface RunState {
  runId: string;
  startedAt: number;
  now: number;
  seenStep: number;
  stepStarts: Record<number, number>;
  durations: Record<number, number>;
  logs: LogLine[];
}

/** Advance the run timeline to `activeStep` at time `t`: closes finished stages and emits their log lines. */
const advanceRun = (prev: RunState | null, activeStep: number, t: number): RunState => {
  const run: RunState = prev ?? {
    runId: `RUN-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
    startedAt: t,
    now: t,
    seenStep: -1,
    stepStarts: {},
    durations: {},
    logs: [{ time: t, level: 'info', text: 'Pipeline initialized · secure inference session opened' }],
  };
  const complete = run.seenStep >= STAGES.length;
  if (activeStep === run.seenStep) return complete ? run : { ...run, now: t };

  const stepStarts = { ...run.stepStarts };
  const durations = { ...run.durations };
  const logs = [...run.logs];
  for (let i = Math.max(run.seenStep, 0); i < Math.min(activeStep, STAGES.length); i++) {
    if (durations[i] === undefined) {
      durations[i] = t - (stepStarts[i] ?? t);
      logs.push({ time: t, level: 'success', text: `${STAGES[i].title} completed in ${formatDuration(durations[i])}` });
    }
  }
  if (activeStep < STAGES.length) {
    stepStarts[activeStep] = t;
    logs.push({ time: t, level: 'info', text: `▸ ${STAGES[activeStep].title}` });
    STAGES[activeStep].logs.forEach((line, idx) => logs.push({ time: t + (idx + 1) * 250, level: 'info', text: `  ${line}` }));
  } else {
    logs.push({ time: t, level: 'success', text: 'All stages completed · results ready' });
  }
  return { ...run, now: t, seenStep: activeStep, stepStarts, durations, logs };
};

/** Mount only while the pipeline runs (render it conditionally) so each run starts with a fresh timeline. */
export const DiagnosticPipelineModal: React.FC<DiagnosticPipelineModalProps> = ({
  isOpen,
  activeStep,
  overallProgress,
  onCancel,
}) => {
  const [run, setRun] = useState<RunState | null>(null);
  const activeStepRef = useRef(activeStep);
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    activeStepRef.current = activeStep;
  }, [activeStep]);

  // One clock drives the timeline: elapsed time, stage durations and staged log output
  useEffect(() => {
    if (!isOpen) return;
    const tick = () => setRun(prev => advanceRun(prev, activeStepRef.current, Date.now()));
    const id = setInterval(tick, 100);
    return () => clearInterval(id);
  }, [isOpen]);

  // Keep the log console pinned to the bottom
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ block: 'nearest' });
  }, [run?.logs.length, run?.now]);

  if (!isOpen) return null;

  const isComplete = activeStep >= STAGES.length;
  const now = run?.now ?? 0;
  const startedAt = run?.startedAt ?? 0;
  const stepStarts = run?.stepStarts ?? {};
  const durations = run?.durations ?? {};
  const runId = run?.runId ?? 'RUN-······';
  const elapsed = now - startedAt;
  const visibleLogs = (run?.logs ?? []).filter(l => l.time <= now || isComplete);
  const currentStage = STAGES[Math.min(activeStep, STAGES.length - 1)];
  const CurrentIcon = currentStage.icon;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="pipeline-title"
        className="w-full max-w-[920px] max-h-[calc(100vh-2rem)] flex flex-col rounded-xl border border-slate-800 bg-[#0b1220] shadow-2xl shadow-black/60 overflow-hidden animate-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-4 px-5 py-4 border-b border-slate-800 flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-700 bg-slate-900">
              <Cpu className="h-4 w-4 text-cyan-400" />
            </div>
            <div className="min-w-0">
              <h2 id="pipeline-title" className="text-sm font-semibold text-slate-100 truncate">
                HepatoAI Diagnostic Pipeline
              </h2>
              <p className="text-xs text-slate-500 font-mono truncate">
                {runId} · multimodal inference
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <span className="hidden sm:inline text-xs font-mono text-slate-400 tabular-nums">{formatClock(elapsed)}</span>
            {isComplete ? (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-400">
                <Check className="h-3 w-3" /> Completed
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2.5 py-1 text-xs font-medium text-cyan-300">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-75" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-cyan-400" />
                </span>
                Running
              </span>
            )}
          </div>
        </div>

        {/* Overall progress */}
        <div className="px-5 pt-4 pb-3 flex-shrink-0">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="text-slate-400">
              {isComplete ? (
                <>All {STAGES.length} stages complete</>
              ) : (
                <>
                  Stage <span className="text-slate-200 font-medium">{activeStep + 1}</span> of {STAGES.length}
                  <span className="text-slate-600"> · </span>
                  <span className="text-slate-300">{currentStage.title}</span>
                </>
              )}
            </span>
            <span className="font-mono text-slate-200 tabular-nums">{overallProgress}%</span>
          </div>
          <div className="h-1 w-full rounded-full bg-slate-800 overflow-hidden">
            <div
              className={`h-full rounded-full transition-[width] duration-500 ease-out ${isComplete ? 'bg-emerald-500' : 'bg-cyan-500'}`}
              style={{ width: `${overallProgress}%` }}
            />
          </div>
        </div>

        {/* Body */}
        <div className="grid md:grid-cols-[1fr_minmax(0,340px)] gap-0 border-t border-slate-800 flex-1 min-h-0 overflow-y-auto md:overflow-hidden">
          {/* Stage timeline */}
          <ol className="px-5 py-4 md:overflow-y-auto">
            {STAGES.map((stage, index) => {
              const status = index < activeStep ? 'done' : index === activeStep ? 'running' : 'pending';
              const Icon = stage.icon;
              const isLast = index === STAGES.length - 1;
              const duration =
                status === 'done'
                  ? durations[index]
                  : status === 'running'
                    ? now - (stepStarts[index] ?? now)
                    : undefined;

              return (
                <li key={stage.title} className="relative flex gap-3 pb-3 last:pb-0">
                  {!isLast && (
                    <span
                      aria-hidden
                      className={`absolute left-[13px] top-7 bottom-0 w-px ${status === 'done' ? 'bg-emerald-500/40' : 'bg-slate-800'}`}
                    />
                  )}
                  <div
                    className={`relative z-10 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full border transition-colors duration-300 ${
                      status === 'done'
                        ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400'
                        : status === 'running'
                          ? 'border-cyan-400/60 bg-cyan-500/10 text-cyan-300'
                          : 'border-slate-700 bg-slate-900 text-slate-600'
                    }`}
                  >
                    {status === 'done' ? (
                      <Check className="h-3.5 w-3.5" />
                    ) : status === 'running' ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Icon className="h-3.5 w-3.5" />
                    )}
                  </div>
                  <div
                    className={`flex-1 min-w-0 rounded-lg px-3 py-1.5 -my-0.5 transition-colors duration-300 ${
                      status === 'running' ? 'bg-slate-800/50 ring-1 ring-slate-700' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span
                        className={`text-[13px] font-medium truncate ${
                          status === 'pending' ? 'text-slate-500' : 'text-slate-100'
                        }`}
                      >
                        {stage.title}
                      </span>
                      <span className="text-[11px] font-mono tabular-nums text-slate-500 flex-shrink-0">
                        {duration !== undefined ? formatDuration(duration) : status === 'pending' ? 'Queued' : ''}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <p className={`text-xs truncate ${status === 'pending' ? 'text-slate-600' : 'text-slate-400'}`}>
                        {stage.description}
                      </p>
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>

          {/* Side panel: current stage + live log */}
          <div className="flex flex-col min-h-0 border-t md:border-t-0 md:border-l border-slate-800 bg-[#080e1a]">
            <div className="px-4 py-3 border-b border-slate-800 flex-shrink-0">
              <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500 mb-2">Current stage</p>
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-md border ${
                    isComplete ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400' : 'border-slate-700 bg-slate-900 text-cyan-300'
                  }`}
                >
                  {isComplete ? <Check className="h-4 w-4" /> : <CurrentIcon className="h-4 w-4" />}
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-slate-100 truncate">{isComplete ? 'Analysis complete' : currentStage.title}</p>
                  <p className="text-xs text-slate-500 font-mono truncate">{isComplete ? 'Preparing results view' : currentStage.model}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 px-4 pt-3 pb-2 flex-shrink-0">
              <Terminal className="h-3.5 w-3.5 text-slate-500" />
              <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500">Activity log</p>
            </div>
            <div
              className="flex-1 min-h-[140px] max-h-[220px] md:max-h-none overflow-y-auto px-4 pb-3 font-mono text-[11px] leading-5"
              style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(148,163,184,0.2) transparent' }}
            >
              {visibleLogs.map((line, i) => (
                <div key={i} className="flex gap-2 animate-in fade-in duration-200">
                  <span className="text-slate-600 tabular-nums flex-shrink-0">
                    {formatClock(Math.max(0, line.time - startedAt))}
                  </span>
                  <span
                    className={`whitespace-pre-wrap break-words ${
                      line.level === 'success' ? 'text-emerald-400' : line.text.startsWith('▸') ? 'text-cyan-300' : 'text-slate-400'
                    }`}
                  >
                    {line.level === 'success' ? '✓ ' : ''}
                    {line.text}
                  </span>
                </div>
              ))}
              <div ref={logEndRef} />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-4 px-5 py-3 border-t border-slate-800 bg-[#0a101c] flex-shrink-0">
          <span className="inline-flex items-center gap-1.5 text-xs text-slate-500 min-w-0">
            <ShieldCheck className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
            <span className="truncate">AI-assisted analysis · requires clinician verification</span>
          </span>
          {onCancel && !isComplete && (
            <button
              type="button"
              onClick={onCancel}
              className="inline-flex items-center gap-1.5 rounded-md border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/50 transition-colors flex-shrink-0"
            >
              <X className="h-3.5 w-3.5" /> Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
