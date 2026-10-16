import React from 'react';
import { Info, ListTree } from 'lucide-react';

export interface RiskExplanation {
  horizon_months: number;
  base_risk: number;
  final_risk: number;
  base_definition: string;
  contributions: { feature: string; label: string; value: string | null; points: number; available: boolean }[];
  method: string;
}

const TOP_N = 6;

const ROW = 'grid grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)_44px] items-center gap-2 py-1.5';

/** Base / final risk marker on the waterfall axis; `at` is the 0-100 axis position. */
const Marker: React.FC<{ label: string; sub: string; value: number; at: number; strong?: boolean }> = ({ label, sub, value, at, strong }) => (
  <div className={ROW}>
    <div className="min-w-0">
      <div className={`truncate text-[12px] ${strong ? 'font-semibold text-slate-100' : 'text-slate-300'}`}>{label}</div>
      <div className="truncate text-[10px] text-slate-500">{sub}</div>
    </div>
    <div className="relative h-5">
      <div className="absolute inset-y-0 w-px bg-slate-500" style={{ left: `${at}%` }} />
      <div className={`absolute top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full ${strong ? 'bg-slate-100' : 'bg-slate-400'}`} style={{ left: `${at}%` }} />
    </div>
    <span className={`justify-self-end rounded px-1.5 py-0.5 text-[11px] font-mono tabular-nums ${strong ? 'bg-slate-100 text-slate-900 font-semibold' : 'bg-slate-800 text-slate-200'}`}>
      {value.toFixed(0)}%
    </span>
  </div>
);

const fmtPts = (p: number) => `${p > 0 ? '+' : p < 0 ? '−' : ''}${Math.abs(p).toFixed(1)}`;

/**
 * Waterfall of exact Shapley contributions (percentage points) from the average-profile
 * patient to this patient's 2-year recurrence risk. Contributions sum exactly to the final risk.
 */
export const RiskExplanationPanel: React.FC<{ explanation: RiskExplanation }> = ({ explanation }) => {
  const available = explanation.contributions.filter(c => c.available);
  const unavailable = explanation.contributions.filter(c => !c.available);
  const shown = available.slice(0, TOP_N);
  const rest = available.slice(TOP_N);
  const restPoints = rest.reduce((sum, c) => sum + c.points, 0);

  type Row = { key: string; label: string; value: string | null; points: number };
  const rows: Row[] = shown.map(c => ({ key: c.feature, label: c.label, value: c.value, points: c.points }));
  if (rest.length > 0) rows.push({ key: 'other', label: `${rest.length} other factor${rest.length > 1 ? 's' : ''}`, value: null, points: restPoints });

  // Cumulative path from base to final, and an axis that fits it
  const path: { start: number; end: number }[] = [];
  let running = explanation.base_risk;
  for (const row of rows) {
    path.push({ start: running, end: running + row.points });
    running += row.points;
  }
  const values = [explanation.base_risk, explanation.final_risk, ...path.flatMap(p => [p.start, p.end])];
  const span = Math.max(4, Math.max(...values) - Math.min(...values));
  const lo = Math.max(0, Math.min(...values) - span * 0.15);
  const hi = Math.min(100, Math.max(...values) + span * 0.15);
  const pos = (v: number) => ((v - lo) / (hi - lo)) * 100;

  return (
    <div className="mt-4 mb-2 flex flex-col">
      <div className="flex items-start justify-between gap-2 border-b border-[#1e293b] pb-2">
        <div>
          <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <ListTree className="w-4 h-4 text-indigo-400" /> Why this risk
          </h4>
          <p className="mt-0.5 text-[10px] text-slate-500">
            Contribution of each input to the {explanation.horizon_months / 12}-year recurrence risk (SHAP, % points)
          </p>
        </div>
      </div>

      <div className="mt-2 flex flex-col divide-y divide-white/5">
        <Marker label="Average-profile patient" sub="All inputs at cohort average" value={explanation.base_risk} at={pos(explanation.base_risk)} />

        {rows.map((row, i) => {
          const { start, end } = path[i];
          const up = row.points > 0;
          const left = pos(Math.min(start, end));
          const width = Math.max(0.8, Math.abs(pos(end) - pos(start)));
          return (
            <div key={row.key} className={ROW}>
              <div className="min-w-0">
                <div className="truncate text-[12px] text-slate-300">{row.label}</div>
                {row.value && <div className="truncate text-[10px] text-slate-500" title={row.value}>{row.value}</div>}
              </div>
              <div className="relative h-5">
                <div
                  className={`absolute top-1/2 h-3 -translate-y-1/2 rounded-sm ${up ? 'bg-rose-500/85' : 'bg-teal-400/85'}`}
                  style={{ left: `${left}%`, width: `${width}%` }}
                />
              </div>
              <span className={`justify-self-end text-[11px] font-mono font-semibold tabular-nums ${up ? 'text-rose-300' : 'text-teal-300'}`}>
                {fmtPts(row.points)}
              </span>
            </div>
          );
        })}

        <Marker label="This patient" sub={`${explanation.horizon_months / 12}-year recurrence risk`} value={explanation.final_risk} at={pos(explanation.final_risk)} strong />
      </div>

      <div className="mt-2 flex items-center gap-3 text-[9.5px] text-slate-500">
        <span className="flex items-center gap-1"><span className="inline-block h-2 w-3 rounded-sm bg-rose-500/80" /> raises risk</span>
        <span className="flex items-center gap-1"><span className="inline-block h-2 w-3 rounded-sm bg-teal-400/80" /> lowers risk</span>
      </div>

      {unavailable.length > 0 && (
        <p className="mt-2 text-[10px] leading-snug text-amber-300/80">
          Not available, no effect on this estimate: {unavailable.map(c => c.label).join(', ')}
        </p>
      )}

      <p className="mt-2 flex items-start gap-1.5 text-[9.5px] leading-relaxed text-slate-500">
        <Info className="w-3 h-3 mt-px flex-shrink-0" />
        Exact Shapley values of the survival model; contributions add up to this patient's risk. They show associations the
        model learned, not causes: changing a factor will not necessarily change the outcome.
      </p>
    </div>
  );
};
