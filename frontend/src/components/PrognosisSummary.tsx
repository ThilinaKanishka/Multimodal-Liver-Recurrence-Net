import React from 'react';
import { AlertTriangle, ShieldAlert, ShieldCheck, ShieldHalf } from 'lucide-react';
import type { RecurrenceOutlook } from './RecurrenceOutlookPanel';

interface PrognosisSummaryProps {
  outlook?: RecurrenceOutlook | null;
  /** Fallback when the survival model is unavailable: multimodal classifier output */
  classifier: { probability: number; confidenceInterval?: [number, number] };
  classifierAbstained: boolean;
  dataDriftDetected: boolean;
  imagingAnalysed: boolean;
}

const GROUP_TONE = {
  Low: { text: 'text-emerald-400', bar: 'bg-emerald-400', ring: 'border-emerald-500/40', icon: ShieldCheck },
  Intermediate: { text: 'text-amber-400', bar: 'bg-amber-400', ring: 'border-amber-500/40', icon: ShieldHalf },
  High: { text: 'text-rose-400', bar: 'bg-rose-400', ring: 'border-rose-500/40', icon: ShieldAlert },
} as const;

const ordinal = (n: number) => {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return `${n}${s[(v - 20) % 10] || s[v] || s[0]}`;
};

/** Risk scale with the 95% CI band, the patient's estimate and the cohort average. */
const RiskScale: React.FC<{ value: number; lower: number; upper: number; average?: number; barClass: string }> = ({ value, lower, upper, average, barClass }) => (
  <div className="relative mt-3 w-full max-w-[360px]" aria-hidden>
    <div className="relative h-2 rounded-full bg-slate-800">
      <div className={`absolute inset-y-0 rounded-full opacity-35 ${barClass}`} style={{ left: `${lower}%`, width: `${Math.max(1, upper - lower)}%` }} />
      <div className={`absolute -top-1 h-4 w-1 -ml-0.5 rounded-sm ${barClass}`} style={{ left: `${value}%` }} />
      {average !== undefined && <div className="absolute -top-0.5 h-3 w-px bg-slate-300" style={{ left: `${average}%` }} />}
    </div>
    <div className="relative mt-1 h-3 text-[9px] font-mono text-slate-500">
      <span className="absolute left-0">0%</span>
      {average !== undefined && (
        <span className="absolute -translate-x-1/2 whitespace-nowrap text-slate-400" style={{ left: `${average}%` }}>
          cohort avg {Math.round(average)}%
        </span>
      )}
      <span className="absolute right-0">100%</span>
    </div>
  </div>
);

export const PrognosisSummary: React.FC<PrognosisSummaryProps> = ({
  outlook,
  classifier,
  classifierAbstained,
  dataDriftDetected,
  imagingAnalysed,
}) => {
  const flags: string[] = [];
  if (outlook && outlook.imputed_inputs.length > 0) {
    flags.push(`${outlook.imputed_inputs.length} input${outlook.imputed_inputs.length > 1 ? 's' : ''} missing, set to cohort average (${outlook.imputed_inputs.slice(0, 3).join(', ')}${outlook.imputed_inputs.length > 3 ? ', …' : ''})`);
  }
  if (!imagingAnalysed) flags.push('No CT scan analysed: imaging-derived inputs not patient-specific');
  if (dataDriftDetected) flags.push("Imaging profile differs from the model's training population");
  if (classifierAbstained) flags.push('Multimodal AI classifier abstained (high uncertainty): manual review advised');

  if (!outlook && classifierAbstained) {
    return (
      <div className="flex flex-col min-w-0">
        <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-[0.2em]">Recurrence risk</span>
        <span className="mt-1 text-2xl font-semibold text-amber-300">Not estimated</span>
        <p className="mt-1 text-[11px] text-slate-400">Model uncertainty is too high for this patient. Manual oncologist review required.</p>
      </div>
    );
  }

  if (!outlook) {
    const ci = classifier.confidenceInterval;
    return (
      <div className="flex flex-col min-w-0">
        <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-[0.2em]">Recurrence probability</span>
        <div className="mt-1 flex items-baseline gap-3">
          <span className="text-4xl font-semibold tabular-nums text-slate-100">{Math.round(classifier.probability)}%</span>
          {ci && <span className="text-xs font-mono text-slate-400 tabular-nums">95% CI {Math.round(ci[0])}–{Math.round(ci[1])}%</span>}
        </div>
        <p className="mt-1 text-[11px] text-amber-300/80">Survival estimate unavailable for this patient: showing the experimental classifier output (no defined time horizon).</p>
      </div>
    );
  }

  const r = outlook.risk_2yr;
  const tone = GROUP_TONE[outlook.risk_group.label];

  const GroupIcon = tone.icon;

  return (
    <div className="flex items-start gap-5 min-w-0 w-full max-w-[480px]">
      {/* Risk-group emblem */}
      <div className="relative mt-1 flex-shrink-0">
        <div className={`absolute -inset-1 rounded-full blur-md opacity-40 ${tone.bar}`} />
        <div className={`relative flex h-14 w-14 items-center justify-center rounded-full border-2 bg-[#0a0f18] ${tone.ring}`}>
          <GroupIcon className={`h-6 w-6 ${tone.text}`} />
        </div>
      </div>

    <div className="flex flex-col min-w-0 flex-1">
      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.3em]">2-year recurrence risk</span>

      <div className="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h2 className={`text-2xl md:text-3xl font-black uppercase tracking-wide drop-shadow-md ${tone.text}`}>
          {outlook.risk_group.label} risk
        </h2>
        <span className="text-2xl md:text-3xl font-light text-slate-600">|</span>
        <span className={`text-2xl md:text-3xl font-black tabular-nums drop-shadow-md ${tone.text}`}>{Math.round(r.risk)}%</span>
        <span className="text-xs font-mono text-slate-400 tabular-nums" title={outlook.risk_group.definition}>
          95% CI {Math.round(r.lower)}–{Math.round(r.upper)}%
        </span>
      </div>

      <RiskScale value={r.risk} lower={r.lower} upper={r.upper} average={r.cohort_average} barClass={tone.bar} />

      <p className="mt-1.5 text-[11px] text-slate-400">
        Higher than <span className="text-slate-200 tabular-nums">{outlook.cohort_percentile}%</span> of patients in the reference cohort
        <span className="text-slate-600"> ({ordinal(outlook.cohort_percentile)} percentile)</span>
      </p>

      {flags.length > 0 && (
        <ul className="mt-2 flex flex-col gap-1">
          {flags.map(flag => (
            <li key={flag} className="flex items-start gap-1.5 text-[10.5px] leading-snug text-amber-300/90">
              <AlertTriangle className="w-3 h-3 mt-px flex-shrink-0" /> {flag}
            </li>
          ))}
        </ul>
      )}

      <p className="mt-2 text-[9.5px] text-slate-600">
        {outlook.model.name} · C-index {outlook.model.c_index_holdout.toFixed(2)} · internal validation only
      </p>
    </div>
    </div>
  );
};
