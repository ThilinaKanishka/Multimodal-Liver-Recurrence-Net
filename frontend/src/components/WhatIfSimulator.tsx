import React, { useCallback, useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { Activity, AlertTriangle, ArrowRight, Info, Loader2, RotateCcw } from 'lucide-react';

const SIMULATE_URL = 'http://127.0.0.1:8000/api/v1/simulate_risk';

interface ScenarioInputs {
  tumor_size_cm: number;
  afp_ngml: number;
  alp_iul: number;
  bilirubin_mgdl: number;
  bclc_stage: string;
  mvi_pathology: boolean;
  cirrhosis_present: boolean;
  metastasis_present: boolean;
}

interface Score {
  probability: number;
  confidence_interval: [number, number];
  certainty: number;
  confidence_status: string;
  risk_level: 'HIGH' | 'LOW' | 'ABSTAIN';
  survival: {
    rfs_2yr: { months: number; rfs: number; lower: number; upper: number };
    median_rfs: { months: number | null; lower: number | null; upper: number | null };
    risk_group: string;
  } | null;
}

interface Driver {
  feature: string;
  label: string;
  changed: boolean;
  shap_delta: number;
}

interface SimulationResponse {
  baseline_inputs: ScenarioInputs;
  training_ranges: Record<string, { min: number; max: number }>;
  baseline: Score;
  scenario: Score;
  delta: { probability: number; rfs_2yr: number | null };
  changed_features: string[];
  drivers: Driver[];
  warnings: { feature: string; message: string }[];
}

const simulate = (inferenceId: string, scenario: Partial<ScenarioInputs>) =>
  axios.post<SimulationResponse>(SIMULATE_URL, { inference_id: inferenceId, ...scenario }).then(res => res.data);

const errorMessage = (err: unknown) => {
  const detail = axios.isAxiosError(err) ? err.response?.data?.detail : undefined;
  return typeof detail === 'string' ? detail : 'Simulation service unavailable.';
};

type NumericKey = 'tumor_size_cm' | 'afp_ngml' | 'alp_iul' | 'bilirubin_mgdl';

interface SliderDef {
  key: NumericKey;
  label: string;
  unit: string;
  min: number;
  max: number;
  step: number;
  log?: boolean;
  decimals: number;
}

const SLIDERS: SliderDef[] = [
  { key: 'tumor_size_cm', label: 'Tumor size', unit: 'cm', min: 0.5, max: 20, step: 0.1, decimals: 1 },
  { key: 'afp_ngml', label: 'AFP', unit: 'ng/mL', min: 1, max: 10000, step: 0.001, log: true, decimals: 0 },
  { key: 'alp_iul', label: 'ALP', unit: 'IU/L', min: 20, max: 600, step: 1, decimals: 0 },
  { key: 'bilirubin_mgdl', label: 'Bilirubin', unit: 'mg/dL', min: 0.1, max: 10, step: 0.1, decimals: 1 },
];

const TOGGLES: { key: 'mvi_pathology' | 'cirrhosis_present' | 'metastasis_present'; label: string }[] = [
  { key: 'mvi_pathology', label: 'Microvascular invasion' },
  { key: 'cirrhosis_present', label: 'Cirrhosis' },
  { key: 'metastasis_present', label: 'Metastasis' },
];

// Slider position (0..1) <-> value, with optional log scale for wide-range labs like AFP
const toPos = (s: SliderDef, v: number) =>
  s.log ? (Math.log10(v) - Math.log10(s.min)) / (Math.log10(s.max) - Math.log10(s.min)) : (v - s.min) / (s.max - s.min);
const fromPos = (s: SliderDef, p: number) => {
  const raw = s.log ? Math.pow(10, Math.log10(s.min) + p * (Math.log10(s.max) - Math.log10(s.min))) : s.min + p * (s.max - s.min);
  const factor = Math.pow(10, s.decimals);
  return Math.round(raw * factor) / factor;
};
const clamp01 = (x: number) => Math.min(1, Math.max(0, x));

const riskTone = (level: string) =>
  level === 'HIGH'
    ? 'text-rose-400 bg-rose-500/10 border-rose-500/30'
    : level === 'LOW'
      ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
      : 'text-amber-400 bg-amber-500/10 border-amber-500/30';

const fmtSigned = (v: number, digits = 1, suffix = '') => `${v > 0 ? '+' : ''}${v.toFixed(digits)}${suffix}`;
const fmtMedian = (m: number | null) => (m === null ? 'not reached' : `${Math.round(m)} mo`);

const ScoreCard: React.FC<{ title: string; score: Score; muted?: boolean }> = ({ title, score, muted }) => (
  <div className={`flex-1 min-w-0 rounded-lg border px-3 py-2.5 ${muted ? 'border-slate-800 bg-slate-900/40' : 'border-slate-700 bg-slate-800/40'}`}>
    <div className="flex items-center justify-between gap-2">
      <span className="text-[10px] uppercase tracking-wider text-slate-500">{title}</span>
      <span className={`rounded border px-1.5 py-px text-[10px] font-semibold ${riskTone(score.risk_level)}`}>{score.risk_level}</span>
    </div>
    <div className={`mt-1 text-2xl font-semibold tabular-nums ${muted ? 'text-slate-300' : 'text-white'}`}>
      {score.probability.toFixed(1)}%
    </div>
    <div className="text-[10px] font-mono text-slate-500 tabular-nums">
      95% CI {score.confidence_interval[0].toFixed(1)}–{score.confidence_interval[1].toFixed(1)}%
    </div>
  </div>
);

/** Probability axis showing baseline and scenario estimates with their 95% intervals. */
const IntervalBar: React.FC<{ baseline: Score; scenario: Score }> = ({ baseline, scenario }) => {
  const band = (s: Score, cls: string, top: string) => (
    <div
      className={`absolute h-1.5 rounded-full ${cls}`}
      style={{ left: `${s.confidence_interval[0]}%`, width: `${Math.max(0.5, s.confidence_interval[1] - s.confidence_interval[0])}%`, top }}
    />
  );
  return (
    <div className="mt-3">
      <div className="relative h-7 rounded bg-slate-900 border border-slate-800">
        <div className="absolute inset-y-0 left-1/2 w-px bg-slate-700" title="Decision threshold (50%)" />
        {band(baseline, 'bg-slate-500/50', '6px')}
        <div className="absolute w-0.5 h-3 bg-slate-300 rounded" style={{ left: `calc(${baseline.probability}% - 1px)`, top: '3px' }} />
        {band(scenario, 'bg-cyan-500/40', '17px')}
        <div className="absolute w-0.5 h-3 bg-cyan-300 rounded transition-all duration-300" style={{ left: `calc(${scenario.probability}% - 1px)`, top: '14px' }} />
      </div>
      <div className="mt-1 flex justify-between text-[9px] font-mono text-slate-600">
        <span>0%</span>
        <span>50% threshold</span>
        <span>100%</span>
      </div>
    </div>
  );
};

export const WhatIfSimulator: React.FC<{ inferenceId?: string }> = ({ inferenceId }) => {
  const [baselineInputs, setBaselineInputs] = useState<ScenarioInputs | null>(null);
  const [inputs, setInputs] = useState<ScenarioInputs | null>(null);
  const [data, setData] = useState<SimulationResponse | null>(null);
  // Callers flag loading from event handlers; the initial load starts as loading
  const [loading, setLoading] = useState(!!inferenceId);
  const [error, setError] = useState<string | null>(null);
  const requestSeq = useRef(0);

  const run = useCallback(
    async (scenario: Partial<ScenarioInputs>) => {
      if (!inferenceId) return;
      const seq = ++requestSeq.current;
      try {
        const result = await simulate(inferenceId, scenario);
        if (seq !== requestSeq.current) return; // a newer request superseded this one
        setData(result);
        setError(null);
      } catch (err) {
        if (seq !== requestSeq.current) return;
        setError(errorMessage(err));
      } finally {
        if (seq === requestSeq.current) setLoading(false);
      }
    },
    [inferenceId],
  );

  // Load the patient's actual model inputs (incl. NLP-derived flags) as the starting point.
  // The parent keys this component by inference id, so a new prediction remounts it with fresh state.
  useEffect(() => {
    if (!inferenceId) return;
    const seq = ++requestSeq.current;
    simulate(inferenceId, {})
      .then(result => {
        if (seq !== requestSeq.current) return;
        setData(result);
        setBaselineInputs(result.baseline_inputs);
        setInputs(result.baseline_inputs);
      })
      .catch(err => {
        if (seq === requestSeq.current) setError(errorMessage(err));
      })
      .finally(() => {
        if (seq === requestSeq.current) setLoading(false);
      });
  }, [inferenceId]);

  // Re-score (debounced) whenever the scenario changes
  useEffect(() => {
    if (!inputs || !baselineInputs || inputs === baselineInputs) return;
    const t = setTimeout(() => run(inputs), 250);
    return () => clearTimeout(t);
  }, [inputs, baselineInputs, run]);

  const update = <K extends keyof ScenarioInputs>(key: K, value: ScenarioInputs[K]) => {
    setLoading(true);
    setInputs(prev => (prev ? { ...prev, [key]: value } : prev));
  };

  const reset = () => {
    if (baselineInputs) {
      setLoading(true);
      setInputs(baselineInputs);
      run(baselineInputs);
    }
  };

  const warningFor = (key: string) => data?.warnings.find(w => w.feature === key);
  const maxDriver = Math.max(0.01, ...(data?.drivers.map(d => Math.abs(d.shap_delta)) ?? [0]));

  return (
    <div className="p-5 bg-[#0a0e17]">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h4 className="text-[12px] font-bold text-blue-400 uppercase tracking-wider flex items-center gap-2">
            <Activity className="w-4 h-4" /> What-If Simulation
          </h4>
          <p className="mt-1 text-[11px] text-slate-500">
            Re-scores this patient's own model inputs, including their CT embedding, with the values you change.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {loading && <Loader2 className="w-3.5 h-3.5 text-slate-500 animate-spin" />}
          <button
            type="button"
            onClick={reset}
            disabled={!data || data.changed_features.length === 0}
            className="inline-flex items-center gap-1.5 rounded-md border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-[11px] font-medium text-slate-300 hover:bg-slate-800 hover:text-white disabled:opacity-40 disabled:pointer-events-none transition-colors"
          >
            <RotateCcw className="w-3 h-3" /> Reset
          </button>
        </div>
      </div>

      {!inferenceId && <p className="text-xs text-slate-500">Run an analysis to enable the simulator.</p>}

      {error && (
        <div className="mb-4 flex items-start gap-2 rounded-md border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-300">
          <AlertTriangle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" /> {error}
        </div>
      )}

      {data && inputs && (
        <div className="grid gap-5 lg:grid-cols-2">
          {/* Inputs */}
          <div className="flex flex-col gap-4">
            {SLIDERS.map(s => {
              const value = inputs[s.key];
              const base = baselineInputs![s.key];
              const range = data.training_ranges[s.key];
              const changed = Math.abs(value - base) > 1e-9;
              const outOfRange = !!warningFor(s.key);
              return (
                <div key={s.key}>
                  <div className="flex items-baseline justify-between text-[11px]">
                    <span className="text-slate-400">{s.label}</span>
                    <span className="font-mono tabular-nums">
                      {changed && <span className="text-slate-600">{base.toFixed(s.decimals)} → </span>}
                      <span className={outOfRange ? 'text-amber-400' : changed ? 'text-cyan-300' : 'text-slate-200'}>
                        {value.toFixed(s.decimals)}
                      </span>
                      <span className="text-slate-600"> {s.unit}</span>
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={s.log ? 0.001 : s.step / (s.max - s.min)}
                    value={clamp01(toPos(s, value))}
                    onChange={e => update(s.key, fromPos(s, parseFloat(e.target.value)))}
                    aria-label={s.label}
                    className={`mt-1 w-full cursor-pointer ${outOfRange ? 'accent-amber-400' : 'accent-cyan-400'}`}
                  />
                  {/* Training-data range and the patient's original value, aligned with the slider track */}
                  <div className="relative mx-2 h-2">
                    {range && (
                      <div
                        className="absolute top-0.5 h-1 rounded-full bg-slate-700"
                        style={{
                          left: `${clamp01(toPos(s, range.min)) * 100}%`,
                          width: `${(clamp01(toPos(s, range.max)) - clamp01(toPos(s, range.min))) * 100}%`,
                        }}
                      />
                    )}
                    <div
                      className="absolute top-0 h-2 w-0.5 -ml-px rounded bg-slate-300"
                      style={{ left: `${clamp01(toPos(s, base)) * 100}%` }}
                      title={`Patient value: ${base.toFixed(s.decimals)} ${s.unit}`}
                    />
                  </div>
                </div>
              );
            })}

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-[11px] text-slate-400 mr-1">BCLC</span>
              {['A', 'B', 'C'].map(stage => (
                <button
                  key={stage}
                  type="button"
                  onClick={() => update('bclc_stage', stage)}
                  className={`h-7 w-8 rounded-md border text-[11px] font-semibold transition-colors ${
                    inputs.bclc_stage === stage
                      ? 'border-cyan-400/60 bg-cyan-500/15 text-cyan-200'
                      : 'border-slate-700 bg-slate-900 text-slate-400 hover:text-white'
                  }`}
                >
                  {stage}
                </button>
              ))}
              <span className="text-[10px] text-slate-600" title="The model was trained on a stage C vs. not-C indicator">
                model uses C vs. A/B
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              {TOGGLES.map(t => {
                const on = inputs[t.key];
                const changed = on !== baselineInputs![t.key];
                return (
                  <button
                    key={t.key}
                    type="button"
                    role="switch"
                    aria-checked={on}
                    onClick={() => update(t.key, !on)}
                    className={`inline-flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-[11px] transition-colors ${
                      changed ? 'border-cyan-400/50 bg-cyan-500/10' : 'border-slate-700 bg-slate-900'
                    }`}
                  >
                    <span className={`relative h-3.5 w-6 rounded-full transition-colors ${on ? 'bg-cyan-500' : 'bg-slate-700'}`}>
                      <span className={`absolute top-0.5 h-2.5 w-2.5 rounded-full bg-white transition-all ${on ? 'left-3' : 'left-0.5'}`} />
                    </span>
                    <span className={on ? 'text-slate-200' : 'text-slate-400'}>{t.label}</span>
                  </button>
                );
              })}
            </div>

            <p className="flex items-center gap-1.5 text-[10px] text-slate-600">
              <span className="inline-block h-1 w-4 rounded-full bg-slate-700" /> training data range
              <span className="inline-block h-2 w-0.5 rounded bg-slate-300 ml-2" /> patient value
            </p>
          </div>

          {/* Outcome */}
          <div className="flex flex-col gap-3">
            <div className="flex gap-2">
              <ScoreCard title="Current patient" score={data.baseline} muted />
              <div className="flex items-center text-slate-600">
                <ArrowRight className="w-4 h-4" />
              </div>
              <ScoreCard title="Scenario" score={data.scenario} />
            </div>

            <div className="flex items-center justify-between rounded-md border border-slate-800 bg-slate-900/40 px-3 py-2 text-[11px]">
              <span className="text-slate-400">Change in recurrence probability</span>
              <span
                className={`font-mono font-semibold tabular-nums ${
                  data.delta.probability > 0.05 ? 'text-rose-400' : data.delta.probability < -0.05 ? 'text-emerald-400' : 'text-slate-400'
                }`}
              >
                {fmtSigned(data.delta.probability, 1, ' pts')}
              </span>
            </div>

            {data.baseline.survival && data.scenario.survival && (
              <div className="rounded-md border border-slate-800 bg-slate-900/40 px-3 py-2 text-[11px] flex flex-col gap-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-slate-400">2-yr recurrence-free survival</span>
                  <span className="font-mono tabular-nums text-slate-300">
                    {data.baseline.survival.rfs_2yr.rfs.toFixed(0)}% → <span className="text-slate-100">{data.scenario.survival.rfs_2yr.rfs.toFixed(0)}%</span>
                    <span className="text-slate-500"> ({data.scenario.survival.rfs_2yr.lower.toFixed(0)}–{data.scenario.survival.rfs_2yr.upper.toFixed(0)})</span>
                    {data.delta.rfs_2yr !== null && Math.abs(data.delta.rfs_2yr) >= 0.5 && (
                      <span className={data.delta.rfs_2yr < 0 ? 'text-rose-400' : 'text-emerald-400'}> {fmtSigned(data.delta.rfs_2yr, 0, ' pts')}</span>
                    )}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-slate-400">Median RFS · risk group</span>
                  <span className="font-mono tabular-nums text-slate-300">
                    {fmtMedian(data.baseline.survival.median_rfs.months)} → {fmtMedian(data.scenario.survival.median_rfs.months)}
                    <span className="text-slate-500"> · {data.scenario.survival.risk_group}</span>
                  </span>
                </div>
              </div>
            )}

            <IntervalBar baseline={data.baseline} scenario={data.scenario} />

            {data.drivers.length > 0 && (
              <div className="rounded-md border border-slate-800 bg-slate-900/40 px-3 py-2.5">
                <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-2">What moved the prediction</p>
                <div className="flex flex-col gap-1.5">
                  {data.drivers.slice(0, 6).map(d => {
                    const width = (Math.abs(d.shap_delta) / maxDriver) * 50;
                    const up = d.shap_delta > 0;
                    return (
                      <div key={d.feature} className="grid grid-cols-[minmax(0,1fr)_120px] items-center gap-2 text-[11px]">
                        <span className={`truncate ${d.changed ? 'text-slate-200' : 'text-slate-500'}`}>
                          {d.label}
                          {!d.changed && <span className="text-slate-600"> (indirect)</span>}
                        </span>
                        <div className="relative h-2 rounded bg-slate-800">
                          <div className="absolute inset-y-0 left-1/2 w-px bg-slate-600" />
                          <div
                            className={`absolute inset-y-0 rounded ${up ? 'bg-rose-500/70' : 'bg-emerald-500/70'}`}
                            style={up ? { left: '50%', width: `${width}%` } : { right: '50%', width: `${width}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
                <p className="mt-2 text-[10px] text-slate-600">Change in SHAP contribution (log-odds). Red raises risk, green lowers it.</p>
              </div>
            )}

            {data.warnings.length > 0 && (
              <div className="flex flex-col gap-1.5">
                {data.warnings.map(w => (
                  <div key={w.feature} className="flex items-start gap-2 rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-[11px] text-amber-200">
                    <AlertTriangle className="w-3.5 h-3.5 mt-px flex-shrink-0 text-amber-400" /> {w.message}
                  </div>
                ))}
              </div>
            )}

            <p className="flex items-start gap-1.5 text-[10px] leading-relaxed text-slate-500">
              <Info className="w-3 h-3 mt-px flex-shrink-0" />
              Model sensitivity analysis, not a causal treatment effect. Changing an input shows how the model's estimate
              responds; it does not predict what would happen if that value changed in the patient.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
