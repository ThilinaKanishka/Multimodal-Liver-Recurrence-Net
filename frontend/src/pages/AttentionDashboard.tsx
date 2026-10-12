import React, { useState, useEffect } from 'react';
import { Layers, Network, Activity, Cpu, Database, ChevronDown, Loader, Target, TrendingUp, Table as TableIcon, Info, AlertTriangle } from 'lucide-react';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';

// Diverging pair validated for CVD separation and contrast on the #0f1522 card surface
const RAISES_RISK = '#f43f5e';
const LOWERS_RISK = '#0891b2';

type Unavailable = { available: false; reason: string };

interface FeatureRow {
  key: string;
  feature: string;
  modality: string;
  value: string;
  source: 'patient' | 'derived' | 'mapped' | 'imputed';
  note: string;
  cohortReference: string;
  occlusionDelta: number;
  cohortMeanAbsDelta: number;
}

interface AttentionAnalysis {
  patient_name?: string;
  patient_id?: string;
  prediction_timestamp?: string;
  cmfa: Unavailable | {
    available: true;
    n_train: number;
    architecture: { image_inputs: number; clinical_inputs: number; tokens_per_modality: number; d_model: number; attention_heads: number; fused_dim: number };
  };
  feature_occlusion: FeatureRow[];
  percentile_profile: { label: string; value: number; patientValue: string }[];
  input_provenance: null | {
    counts: { patient: number; derived: number; mapped: number; imputed: number };
    total: number;
    imputed_features: string[];
    notes: Record<string, string>;
  };
}

// --- Custom SVG Radar Chart Component ---
// Labels sit outside the plot radius inside a padded viewBox, so they are never clipped.
const RadarChart = ({ axes }: { axes: { label: string, value: number, patientValue: string }[] }) => {
  const size = 300;
  const pad = 115; // fits the longest label (~110px at 12px bold) on the left/right axes
  const cx = size / 2;
  const cy = size / 2;
  const maxRadius = size / 2 - 30;
  const levels = 4;
  const angleStep = (Math.PI * 2) / axes.length;

  const getPoint = (value: number, index: number) => {
    const r = (value / 100) * maxRadius;
    const angle = index * angleStep - Math.PI / 2;
    return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
  };

  const dataPoints = axes.map((a, i) => getPoint(a.value, i));

  return (
    <svg width="100%" viewBox={`${-pad} -40 ${size + pad * 2} ${size + 80}`} className="max-w-[480px] mx-auto block" role="img" aria-label="Patient percentile within the CMFA training cohort">
      {[...Array(levels)].map((_, levelIndex) => {
        const r = ((levelIndex + 1) / levels) * maxRadius;
        const points = axes.map((_, i) => {
          const angle = i * angleStep - Math.PI / 2;
          return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`;
        }).join(' ');
        return <polygon key={`grid-${levelIndex}`} points={points} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />;
      })}
      {axes.map((_, i) => {
        const end = getPoint(100, i);
        return <line key={`axis-${i}`} x1={cx} y1={cy} x2={end.x} y2={end.y} stroke="rgba(255,255,255,0.15)" strokeWidth="1" strokeDasharray="4 4" />;
      })}
      {/* 50th percentile reference ring = training-cohort median */}
      <polygon points={axes.map((_, i) => { const p = getPoint(50, i); return `${p.x},${p.y}`; }).join(' ')} fill="none" stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="2 3" />
      <polygon points={dataPoints.map(p => `${p.x},${p.y}`).join(' ')} fill="rgba(8,145,178,0.25)" stroke="#22d3ee" strokeWidth="2" />
      {dataPoints.map((p, i) => (
        <circle key={`point-${i}`} cx={p.x} cy={p.y} r="4" fill="#fff" stroke="#22d3ee" strokeWidth="2">
          <title>{`${axes[i].label}: ${axes[i].patientValue} — ${axes[i].value}th percentile`}</title>
        </circle>
      ))}
      {axes.map((a, i) => {
        const p = getPoint(118, i);
        let anchor: 'middle' | 'end' | 'start' = 'middle';
        if (p.x < cx - 10) anchor = 'end';
        if (p.x > cx + 10) anchor = 'start';
        const yOffset = p.y > cy + 10 ? 8 : p.y < cy - 10 ? -10 : 0;
        return (
          <text key={`label-${i}`} x={p.x} y={p.y + yOffset} fill="#cbd5e1" fontSize="12" fontWeight="700" textAnchor={anchor}>
            {a.label}
            <tspan x={p.x} dy="15" fill="#22d3ee" fontSize="12" fontWeight="800" fontFamily="monospace">P{a.value}</tspan>
          </text>
        );
      })}
    </svg>
  );
};

const NotAvailable = ({ reason }: { reason: string }) => (
  <div className="flex items-start gap-2 rounded-lg border border-amber-400/30 bg-amber-400/5 p-3">
    <AlertTriangle className="w-4 h-4 text-amber-300 shrink-0 mt-0.5" />
    <div>
      <p className="text-xs font-bold text-amber-200 uppercase tracking-wider">Not available</p>
      <p className="text-xs text-slate-300 mt-1 leading-relaxed">{reason}</p>
    </div>
  </div>
);

const Card = ({ icon, title, children, className = '' }: { icon: React.ReactNode, title: string, children: React.ReactNode, className?: string }) => (
  <div className={`bg-[#0f1522]/80 border border-white/10 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.5)] p-4 sm:p-5 flex flex-col min-w-0 ${className}`}>
    <div className="flex items-center gap-2 mb-3 pb-3 border-b border-white/10">
      {icon}
      <h2 className="text-[11px] sm:text-xs font-black text-white uppercase tracking-[0.15em]">{title}</h2>
    </div>
    {children}
  </div>
);

const SOURCE_STYLES: Record<FeatureRow['source'], string> = {
  patient: 'bg-emerald-400/10 text-emerald-300 border-emerald-400/30',
  derived: 'bg-sky-400/10 text-sky-300 border-sky-400/30',
  mapped: 'bg-violet-400/10 text-violet-300 border-violet-400/30',
  imputed: 'bg-amber-400/10 text-amber-300 border-amber-400/30',
};

const fmtPoints = (v: number) => `${v > 0 ? '+' : ''}${v.toFixed(1)}`;

export const AttentionDashboard = () => {
  const [data, setData] = useState<AttentionAnalysis | null>(null);
  const [hasSession, setHasSession] = useState(() => sessionStorage.getItem("active_patient_session") === "true");
  const [loading, setLoading] = useState(hasSession);

  useEffect(() => {
    if (!hasSession) return;

    // Scope the analysis to the logged-in clinician's latest prediction
    let doctorId: string | undefined;
    try {
      doctorId = JSON.parse(sessionStorage.getItem("hepatoai_current_user") || "null")?.id;
    } catch {
      doctorId = undefined;
    }

    const fetchData = async () => {
      try {
        const response = await axios.get('http://127.0.0.1:8000/api/attention-analysis', {
          params: doctorId ? { doctor_id: doctorId } : {}
        });
        setData(response.data);
      } catch (err) {
        console.error("Failed to fetch CMFA analysis:", err);
        setHasSession(false);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [hasSession]);

  if (loading) {
    return (
      <div className="flex-1 bg-[#0a0f18] text-slate-300 font-sans h-screen flex flex-col items-center justify-center">
        <Loader className="w-10 h-10 text-[#9d00ff] animate-spin mb-4" />
        <p className="text-sm font-mono tracking-widest uppercase text-[#c084fc]">Running CMFA analysis...</p>
      </div>
    );
  }

  if (!hasSession || !data) {
    return (
      <div className="flex-1 bg-[#0a0f18] text-slate-300 font-sans h-screen flex flex-col items-center justify-center p-4 sm:p-8">
        <div className="bg-[#111827] border border-[#1e293b] p-6 sm:p-10 rounded-2xl flex flex-col items-center justify-center shadow-2xl max-w-lg w-full">
          <Target className="w-16 h-16 text-slate-600 mb-6" />
          <h2 className="text-lg sm:text-xl font-black tracking-widest uppercase text-slate-300 mb-4 text-center">No Active Patient Session</h2>
          <p className="text-xs font-mono text-slate-400 text-center leading-relaxed">
            The cross-modal analysis uses the inputs of your most recent prediction. <br /><br />
            <strong className="text-indigo-300">Run a prediction in the Predict Workspace first</strong>, then return to this page.
          </p>
        </div>
      </div>
    );
  }

  const cmfa = data.cmfa.available ? data.cmfa : null;
  const provenance = data.input_provenance;
  const topOcclusion = data.feature_occlusion.filter(r => r.source !== 'imputed').slice(0, 10);

  return (
    <div className="flex-1 bg-[#0a0f18] text-slate-300 font-sans h-screen flex flex-col overflow-hidden relative z-0">
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#00e5ff]/5 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#9d00ff]/5 blur-[150px] rounded-full"></div>
      </div>

      <div className="flex-1 p-4 sm:p-8 flex flex-col gap-6 relative z-10 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4 shrink-0">
          <div className="flex flex-col gap-2 min-w-0">
            <div className="flex items-center gap-3">
              <Layers className="w-6 h-6 text-[#00e5ff] shrink-0" />
              <h1 className="text-lg sm:text-2xl font-black text-white uppercase tracking-[0.1em] sm:tracking-[0.2em]">
                Cross-Modal Attention & Fusion Analysis
              </h1>
            </div>
            <p className="text-slate-300 text-sm">
              Outputs of the trained CMFA model (Cross-Modal Feature Fusion with Attention) for your latest prediction.
            </p>
          </div>

          {(data.patient_name || data.patient_id) && (
            <div className="bg-[#0f1522]/80 border border-white/10 rounded-xl px-4 py-3 flex flex-col sm:items-end shrink-0">
              <span className="text-[11px] text-slate-400 font-bold uppercase tracking-widest mb-1">Active Patient Context</span>
              <span className="text-white font-bold tracking-wider">{data.patient_name || "Unnamed patient"}</span>
              {data.patient_id && <span className="text-xs text-[#67e8f9] font-mono mt-0.5">ID: {data.patient_id}</span>}
            </div>
          )}
        </div>

        {/* How to read this page */}
        <details className="group bg-[#0f1522]/80 border border-white/10 rounded-2xl p-4 sm:p-5 shrink-0">
          <summary className="flex items-center gap-2 cursor-pointer list-none select-none">
            <Info className="w-4 h-4 text-[#67e8f9]" />
            <span className="text-xs font-black text-white uppercase tracking-[0.15em]">How to read this page</span>
            <ChevronDown className="w-4 h-4 text-slate-400 ml-auto transition-transform group-open:rotate-180" />
          </summary>
          <ul className="mt-4 space-y-2 text-sm text-slate-300 leading-relaxed list-disc pl-5">
            <li><strong className="text-white">Attention weights are not clinical importance scores.</strong> They show how the model's internal tokens look at each other, not which findings matter for the patient.</li>
            <li><strong className="text-white">Input sensitivity:</strong> how many percentage points the estimate changes if one input is set to the training-cohort median. Red bars raise the estimate, blue bars lower it.</li>
            <li><strong className="text-white">Percentile profile:</strong> where this patient's measured values sit within the training cohort (P50 = median, dashed ring).</li>
            <li><strong className="text-white">Imputed inputs</strong> were not supplied by the clinician and were filled with the training-cohort median or most common value. Treat results with many imputed inputs with caution.</li>
          </ul>
        </details>

        {!cmfa && data.cmfa && !data.cmfa.available && (
          <NotAvailable reason={data.cmfa.reason} />
        )}

        {/* Percentile profile + architecture */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 shrink-0">
          <Card icon={<Target className="w-4 h-4 text-[#67e8f9]" />} title="Percentile vs Training Cohort">
            {data.percentile_profile.length > 0 ? (
              <>
                {data.percentile_profile.length >= 3 && <RadarChart axes={data.percentile_profile} />}
                <ul className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-sm">
                  {data.percentile_profile.map(p => (
                    <li key={p.label} className="flex justify-between gap-2 border-b border-white/5 py-1"><span className="text-slate-300">{p.label} <span className="text-slate-400">({p.patientValue})</span></span><span className="font-mono text-white">P{p.value}</span></li>
                  ))}
                </ul>
              </>
            ) : (
              <NotAvailable reason="None of the continuous inputs used for this profile were supplied for this patient." />
            )}
            {cmfa && (
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Percentile of each supplied value among the {cmfa.n_train} CMFA training patients. Dashed ring = cohort median (P50). Higher is not necessarily worse (e.g. albumin, platelets).
              </p>
            )}
          </Card>

          <Card icon={<Network className="w-4 h-4 text-[#c084fc]" />} title="CMFA Fusion Architecture">
            {cmfa ? (
              <div className="flex flex-col items-center gap-3 text-center py-2">
                <div className="grid grid-cols-2 gap-3 w-full">
                  <div className="border border-[#00e5ff]/40 rounded-xl p-3 bg-[#0f1522]">
                    <Activity className="w-5 h-5 text-[#67e8f9] mx-auto mb-1" />
                    <p className="text-xs font-bold text-[#67e8f9] uppercase tracking-wider">Imaging inputs</p>
                    <p className="text-xs text-slate-300 mt-1">{cmfa.architecture.image_inputs} features → {cmfa.architecture.tokens_per_modality} tokens × {cmfa.architecture.d_model}</p>
                  </div>
                  <div className="border border-[#ffaa00]/40 rounded-xl p-3 bg-[#0f1522]">
                    <Database className="w-5 h-5 text-[#fbbf24] mx-auto mb-1" />
                    <p className="text-xs font-bold text-[#fbbf24] uppercase tracking-wider">Clinical / report</p>
                    <p className="text-xs text-slate-300 mt-1">{cmfa.architecture.clinical_inputs} features → {cmfa.architecture.tokens_per_modality} tokens × {cmfa.architecture.d_model}</p>
                  </div>
                </div>
                <ChevronDown className="w-4 h-4 text-slate-400" />
                <div className="border border-[#9d00ff]/50 rounded-xl p-3 bg-[#1a0033]/60 w-full">
                  <Cpu className="w-5 h-5 text-[#c084fc] mx-auto mb-1" />
                  <p className="text-xs font-bold text-[#c084fc] uppercase tracking-wider">Bidirectional cross-attention</p>
                  <p className="text-xs text-slate-300 mt-1">{cmfa.architecture.attention_heads} heads each way (image → clinical, clinical → image), residual + LayerNorm</p>
                </div>
                <ChevronDown className="w-4 h-4 text-slate-400" />
                <div className="border border-white/15 rounded-xl p-3 bg-[#0f1522] w-full">
                  <p className="text-xs font-bold text-slate-200 uppercase tracking-wider">Mean-pool + fusion layer</p>
                  <p className="text-xs text-slate-300 mt-1">{cmfa.architecture.d_model * 2} → {cmfa.architecture.fused_dim}-D fused vector → classifier</p>
                </div>
                <ChevronDown className="w-4 h-4 text-slate-400" />
                <div className="border border-rose-500/50 rounded-full px-5 py-2 bg-[#0f1522]">
                  <p className="text-xs font-bold text-rose-300 uppercase tracking-wider">Recurrence probability</p>
                </div>
              </div>
            ) : (
              <NotAvailable reason={(data.cmfa as Unavailable).reason} />
            )}
          </Card>
        </div>

        {/* Input sensitivity (occlusion) */}
        {topOcclusion.length > 0 && (
          <Card icon={<TrendingUp className="w-4 h-4 text-[#67e8f9]" />} title="Input Sensitivity (CMFA occlusion)" className="shrink-0">
            <p className="text-xs text-slate-400 mb-3 leading-relaxed">
              Change in the CMFA estimate (percentage points) when each supplied input is replaced by the training-cohort median or most common value. Top 10 by size; imputed inputs are excluded because they already equal the reference.
            </p>
            <div className="flex flex-wrap gap-4 text-xs text-slate-300 mb-2">
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm" style={{ backgroundColor: RAISES_RISK }}></span>Raises estimate</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm" style={{ backgroundColor: LOWERS_RISK }}></span>Lowers estimate</span>
            </div>
            <div className="w-full" style={{ height: Math.max(220, topOcclusion.length * 34) }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topOcclusion} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" horizontal={false} />
                  <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="feature" width={130} tick={{ fill: '#cbd5e1', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <ReferenceLine x={0} stroke="#94a3b8" />
                  <RechartsTooltip
                    cursor={{ fill: 'rgba(255,255,255,0.04)' }}
                    formatter={(v) => [`${fmtPoints(Number(v))} points`, 'Effect on estimate']}
                    contentStyle={{ backgroundColor: 'rgba(15,21,34,0.95)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                  />
                  <Bar dataKey="occlusionDelta" barSize={16} radius={4}>
                    {topOcclusion.map(r => <Cell key={r.key} fill={r.occlusionDelta >= 0 ? RAISES_RISK : LOWERS_RISK} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        )}

        {/* Detailed table */}
        {data.feature_occlusion.length > 0 && (
          <Card icon={<TableIcon className="w-4 h-4 text-[#c084fc]" />} title="Detailed Input Analytics" className="shrink-0">
            <div className="overflow-x-auto w-full rounded-xl border border-white/5 bg-black/20">
              <table className="w-full text-left border-collapse min-w-[760px]">
                <thead>
                  <tr className="bg-white/5 border-b border-white/10 text-[11px] uppercase tracking-wider text-slate-300">
                    <th className="p-3 font-bold">Input</th>
                    <th className="p-3 font-bold">Modality</th>
                    <th className="p-3 font-bold">Value used</th>
                    <th className="p-3 font-bold">Source</th>
                    <th className="p-3 font-bold">Training cohort reference</th>
                    <th className="p-3 font-bold">Effect (points)</th>
                    <th className="p-3 font-bold">Cohort mean |effect|</th>
                  </tr>
                </thead>
                <tbody className="text-xs font-mono text-slate-200 divide-y divide-white/5">
                  {data.feature_occlusion.map(row => (
                    <tr key={row.key} className="hover:bg-white/[0.03]">
                      <td className="p-3 font-sans font-medium text-white">{row.feature}</td>
                      <td className="p-3 font-sans text-slate-300">{row.modality}</td>
                      <td className="p-3 font-bold">{row.value}</td>
                      <td className="p-3">
                        <span title={row.note || undefined} className={`px-2 py-0.5 rounded border text-[11px] uppercase tracking-wider font-sans ${SOURCE_STYLES[row.source]}`}>{row.source}</span>
                      </td>
                      <td className="p-3 text-slate-300">{row.cohortReference}</td>
                      <td className="p-3 font-bold" style={{ color: row.source === 'imputed' ? '#94a3b8' : row.occlusionDelta >= 0 ? '#fda4af' : '#67e8f9' }}>
                        {row.source === 'imputed' ? '—' : fmtPoints(row.occlusionDelta)}
                      </td>
                      <td className="p-3 text-slate-300">{row.cohortMeanAbsDelta.toFixed(1)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {provenance && Object.keys(provenance.notes).length > 0 && (
              <ul className="mt-3 space-y-1 text-xs text-slate-400">
                {Object.entries(provenance.notes).map(([k, v]) => <li key={k}><span className="text-slate-200">{k}:</span> {v}</li>)}
              </ul>
            )}
          </Card>
        )}

      </div>
    </div>
  );
};
