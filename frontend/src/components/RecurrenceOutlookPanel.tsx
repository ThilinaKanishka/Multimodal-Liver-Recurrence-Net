import React, { useMemo, useState } from 'react';
import { Area, CartesianGrid, ComposedChart, Line, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Clock, Info, X } from 'lucide-react';

export interface RecurrenceOutlook {
  available: boolean;
  curve: { month: number; rfs: number; lower: number; upper: number }[];
  milestones: { months: number; rfs: number; lower: number; upper: number }[];
  median_rfs: { months: number | null; lower: number | null; upper: number | null };
  relative_hazard: { value: number; lower: number; upper: number };
  risk_group: { label: 'Low' | 'Intermediate' | 'High'; definition: string };
  cohort_curves: { months: number[]; Low: number[]; Intermediate: number[]; High: number[] };
  contributors: { feature: string; label: string; value: unknown; hazard_multiplier: number }[];
  imputed_inputs: string[];
  model: {
    name: string;
    version: string;
    n_patients: number;
    n_events: number;
    follow_up_months: number;
    c_index_holdout: number;
    validation: string;
    calibration: { months: number; group: string; predicted_rfs: number; observed_rfs: number }[];
  };
}

const GROUP_STYLE = {
  Low: { pill: 'text-emerald-300 bg-emerald-500/10 border-emerald-500/30', stroke: '#34d399' },
  Intermediate: { pill: 'text-amber-300 bg-amber-500/10 border-amber-500/30', stroke: '#fbbf24' },
  High: { pill: 'text-rose-300 bg-rose-500/10 border-rose-500/30', stroke: '#fb7185' },
} as const;

const fmtMonths = (m: number | null) => (m === null ? '—' : `${Math.round(m)}`);
const fmtValue = (v: unknown) => (typeof v === 'boolean' ? (v ? 'Yes' : 'No') : String(v));

/** Recurrence-free survival summary in the style of clinical risk calculators (RFS at fixed horizons with 95% CI). */
export const RecurrenceOutlookPanel: React.FC<{ outlook: RecurrenceOutlook }> = ({ outlook }) => {
  const [showModelCard, setShowModelCard] = useState(false);
  const group = GROUP_STYLE[outlook.risk_group.label];

  const chartData = useMemo(() => {
    const cohort = outlook.cohort_curves;
    return outlook.curve.map((p, i) => ({
      month: p.month,
      rfs: p.rfs,
      band: [p.lower, p.upper] as [number, number],
      Low: cohort.Low[i],
      Intermediate: cohort.Intermediate[i],
      High: cohort.High[i],
    }));
  }, [outlook]);

  const median = outlook.median_rfs;
  const rh = outlook.relative_hazard;
  const card = outlook.model;
  const calibration24 = card.calibration.filter(c => c.months === 24);

  return (
    <div className="relative flex flex-col w-full min-w-[340px] max-w-[440px] border-r border-white/10 pr-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-[9px] text-slate-500 font-bold uppercase tracking-[0.2em] flex items-center gap-1.5">
          <Clock className="w-3 h-3 text-slate-400" /> Recurrence-free survival
        </span>
        <div className="flex items-center gap-1.5">
          <span className={`rounded border px-1.5 py-px text-[10px] font-semibold ${group.pill}`} title={outlook.risk_group.definition}>
            {outlook.risk_group.label} risk group
          </span>
          <button
            type="button"
            onClick={() => setShowModelCard(v => !v)}
            className="rounded p-0.5 text-slate-500 hover:text-slate-200 hover:bg-white/5"
            aria-label="Model information"
            aria-expanded={showModelCard}
          >
            <Info className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* RFS at fixed horizons */}
      <div className="grid grid-cols-4 gap-1.5">
        {outlook.milestones.map(m => (
          <div key={m.months} className="rounded-md border border-slate-800 bg-slate-900/50 px-2 py-1.5">
            <div className="text-[9px] uppercase tracking-wider text-slate-500">{m.months / 12} yr</div>
            <div className="text-[17px] font-semibold tabular-nums text-slate-100 leading-tight">{Math.round(m.rfs)}%</div>
            <div className="text-[9px] font-mono tabular-nums text-slate-500">
              {Math.round(m.lower)}–{Math.round(m.upper)}%
            </div>
          </div>
        ))}
      </div>

      <div className="mt-2 grid grid-cols-2 gap-x-3 text-[10.5px]">
        <div className="text-slate-400">
          Median RFS{' '}
          <span className="font-semibold text-slate-100 tabular-nums">
            {median.months === null ? 'not reached' : `${fmtMonths(median.months)} mo`}
          </span>
          {median.months !== null && (
            <span className="font-mono text-[9.5px] text-slate-500 tabular-nums">
              {' '}({fmtMonths(median.lower)}–{median.upper === null ? 'NR' : fmtMonths(median.upper)})
            </span>
          )}
        </div>
        <div className="text-slate-400 text-right" title="Hazard relative to the average patient in the training cohort">
          vs. avg patient{' '}
          <span className={`font-semibold tabular-nums ${rh.value > 1.05 ? 'text-rose-300' : rh.value < 0.95 ? 'text-emerald-300' : 'text-slate-100'}`}>
            {rh.value.toFixed(2)}×
          </span>
          <span className="font-mono text-[9.5px] text-slate-500 tabular-nums">
            {' '}({rh.lower.toFixed(2)}–{rh.upper.toFixed(2)})
          </span>
        </div>
      </div>

      {/* Patient curve vs. cohort risk groups */}
      <div className="mt-2 h-32 w-full rounded border border-white/5 bg-black/20 pt-1.5">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 2, right: 8, left: -22, bottom: 0 }}>
            <CartesianGrid strokeDasharray="2 2" stroke="#ffffff10" vertical={false} />
            <XAxis dataKey="month" type="number" domain={[0, 60]} ticks={[0, 12, 24, 36, 48, 60]} tick={{ fontSize: 8, fill: '#64748b' }} axisLine={false} tickLine={false} />
            <YAxis domain={[0, 100]} ticks={[0, 50, 100]} tick={{ fontSize: 8, fill: '#64748b' }} tickFormatter={v => `${v}%`} axisLine={false} tickLine={false} />
            <ReferenceLine y={50} stroke="#ffffff1f" strokeDasharray="3 3" />
            {(['Low', 'Intermediate', 'High'] as const).map(g => (
              <Line key={g} type="stepAfter" dataKey={g} stroke={GROUP_STYLE[g].stroke} strokeOpacity={0.35} strokeWidth={1} strokeDasharray="3 2" dot={false} isAnimationActive={false} />
            ))}
            <Area type="stepAfter" dataKey="band" stroke="none" fill="#22d3ee" fillOpacity={0.15} isAnimationActive={false} />
            <Line type="stepAfter" dataKey="rfs" stroke="#22d3ee" strokeWidth={2} dot={false} isAnimationActive={false} />
            <Tooltip
              cursor={{ stroke: '#ffffff30' }}
              contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 6, fontSize: 10, padding: '4px 8px' }}
              labelFormatter={m => `Month ${m}`}
              formatter={(value, name) => {
                if (name === 'band' && Array.isArray(value)) return [`${Number(value[0]).toFixed(0)}–${Number(value[1]).toFixed(0)}%`, '95% CI'];
                if (name === 'rfs') return [`${Number(value).toFixed(1)}%`, 'This patient'];
                return [`${Number(value).toFixed(0)}%`, `${name} group (observed)`];
              }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[9px] text-slate-500">
        <span className="flex items-center gap-1"><span className="inline-block h-0.5 w-3 bg-cyan-400" /> This patient (95% CI)</span>
        {(['Low', 'Intermediate', 'High'] as const).map(g => (
          <span key={g} className="flex items-center gap-1">
            <span className="inline-block w-3 border-t border-dashed" style={{ borderColor: GROUP_STYLE[g].stroke }} /> {g}
          </span>
        ))}
        <span className="text-slate-600">cohort Kaplan-Meier</span>
      </div>

      {/* Key factors */}
      {outlook.contributors.length > 0 && (
        <details className="mt-2 group">
          <summary className="cursor-pointer select-none text-[10px] text-slate-400 hover:text-slate-200">Key factors for this patient</summary>
          <div className="mt-1.5 flex flex-col gap-1">
            {outlook.contributors.slice(0, 5).map(c => (
              <div key={c.feature} className="flex items-center justify-between gap-2 text-[10.5px]">
                <span className="text-slate-300 truncate">
                  {c.label}
                  {c.value !== null && c.value !== undefined && <span className="text-slate-500"> · {fmtValue(c.value)}</span>}
                </span>
                <span className={`font-mono tabular-nums ${c.hazard_multiplier > 1.01 ? 'text-rose-300' : c.hazard_multiplier < 0.99 ? 'text-emerald-300' : 'text-slate-500'}`}>
                  {c.hazard_multiplier.toFixed(2)}× hazard
                </span>
              </div>
            ))}
          </div>
        </details>
      )}

      {outlook.imputed_inputs.length > 0 && (
        <p className="mt-1.5 text-[9.5px] leading-snug text-amber-300/80" title={outlook.imputed_inputs.join(', ')}>
          Not available, set to cohort average: {outlook.imputed_inputs.slice(0, 3).join(', ')}
          {outlook.imputed_inputs.length > 3 && ` +${outlook.imputed_inputs.length - 3} more`}
        </p>
      )}

      {/* Model card */}
      {showModelCard && (
        <div className="absolute right-6 top-6 z-30 w-72 rounded-lg border border-slate-700 bg-[#0b1220] p-3 shadow-2xl shadow-black/60 text-[10.5px]">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div>
              <p className="font-semibold text-slate-100">{card.name}</p>
              <p className="text-[9.5px] text-slate-500 font-mono">v{card.version}</p>
            </div>
            <button type="button" onClick={() => setShowModelCard(false)} className="text-slate-500 hover:text-white" aria-label="Close">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-slate-400">
            <dt>C-index</dt><dd className="text-slate-200 tabular-nums">{card.c_index_holdout.toFixed(3)} (hold-out)</dd>
            <dt>Cohort</dt><dd className="text-slate-200 tabular-nums">{card.n_patients.toLocaleString()} patients, {card.n_events.toLocaleString()} recurrences</dd>
            <dt>Follow-up</dt><dd className="text-slate-200">{card.follow_up_months} months</dd>
            <dt>Validation</dt><dd className="text-slate-200">{card.validation}</dd>
          </dl>
          {calibration24.length > 0 && (
            <div className="mt-2">
              <p className="text-[9.5px] uppercase tracking-wider text-slate-500 mb-1">Calibration at 2 years (RFS)</p>
              <table className="w-full text-[10px] tabular-nums">
                <thead><tr className="text-slate-500"><th className="text-left font-normal">Group</th><th className="text-right font-normal">Predicted</th><th className="text-right font-normal">Observed</th></tr></thead>
                <tbody>
                  {calibration24.map(c => (
                    <tr key={c.group} className="text-slate-300">
                      <td>{c.group}</td><td className="text-right">{c.predicted_rfs.toFixed(0)}%</td><td className="text-right">{c.observed_rfs.toFixed(0)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <p className="mt-2 text-[9.5px] leading-snug text-slate-500">
            Decision support only. Not externally validated; follow institutional surveillance protocol.
          </p>
        </div>
      )}
    </div>
  );
};
