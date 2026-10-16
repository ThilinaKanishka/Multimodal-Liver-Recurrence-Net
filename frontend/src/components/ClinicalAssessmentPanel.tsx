import React from 'react';
import { Activity, TrendingUp, TrendingDown, ClipboardList, AlertTriangle } from 'lucide-react';

export interface AssessmentFactor {
  key: string;
  label: string;
  value: string;
  reference: string | null;
  abnormal: boolean;
  influence_pct: number;
  shap_value: number;
}

export interface ClinicalAssessment {
  risk: {
    level: 'HIGH' | 'LOW' | 'ABSTAIN';
    probability: number;
    confidence_interval: [number, number];
    certainty: number;
    confidence_status: string;
  };
  increasing_factors: AssessmentFactor[];
  decreasing_factors: AssessmentFactor[];
  summary: string;
  recommendations: string[];
  limitations: string[];
  model_version: string;
  generated_at: string;
}

const RISK_STYLES: Record<ClinicalAssessment['risk']['level'], string> = {
  HIGH: 'bg-rose-500/15 text-rose-300 border-rose-500/40',
  LOW: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40',
  ABSTAIN: 'bg-amber-500/15 text-amber-300 border-amber-500/40',
};

const FactorList = ({ title, factors, increasing }: { title: string; factors: AssessmentFactor[]; increasing: boolean }) => {
  const Icon = increasing ? TrendingUp : TrendingDown;
  const accent = increasing ? 'text-rose-400' : 'text-emerald-400';
  const bar = increasing ? 'bg-rose-500/70' : 'bg-emerald-500/70';

  return (
    <div className="flex-1 min-w-0">
      <h4 className={`text-[10px] font-bold uppercase tracking-widest mb-2 flex items-center gap-1.5 ${accent}`}>
        <Icon className="w-3.5 h-3.5" /> {title}
      </h4>
      {factors.length === 0 ? (
        <p className="text-xs text-slate-500 italic">None of significant influence</p>
      ) : (
        <ul className="space-y-2">
          {factors.map((f) => (
            <li key={f.key} className="text-xs">
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-slate-200 font-medium truncate">{f.label}</span>
                <span className="text-slate-400 font-mono text-[10px] flex-shrink-0">{f.influence_pct.toFixed(0)}%</span>
              </div>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className={`font-mono ${f.abnormal ? 'text-amber-300 font-semibold' : 'text-slate-300'}`}>{f.value}</span>
                {f.reference && <span className="text-[10px] text-slate-500">ref {f.reference}</span>}
              </div>
              <div className="h-1 bg-white/5 rounded mt-1 overflow-hidden">
                <div className={`h-full rounded ${bar}`} style={{ width: `${Math.min(100, f.influence_pct)}%` }} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export const ClinicalAssessmentPanel: React.FC<{ assessment?: ClinicalAssessment; fallbackSummary?: string }> = ({ assessment, fallbackSummary }) => {
  // Older history records only carry the plain narrative string
  if (!assessment) {
    if (!fallbackSummary) return null;
    return (
      <div className="bg-[#0f172a] border-b border-white/5 p-4 md:px-8">
        <div className="flex items-start gap-3 bg-[#1e293b]/40 rounded-lg p-4 border border-[#334155]/50 shadow-inner">
          <Activity className="w-5 h-5 text-indigo-400 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Automated Clinical Assessment</h3>
            <p className="text-sm text-slate-200 leading-relaxed font-light">{fallbackSummary}</p>
          </div>
        </div>
      </div>
    );
  }

  const { risk } = assessment;
  const abstained = risk.level === 'ABSTAIN';
  const generated = new Date(assessment.generated_at);

  return (
    <div className="bg-[#0f172a] border-b border-white/5 p-4 md:px-8">
      <div className="bg-[#1e293b]/40 rounded-lg border border-[#334155]/50 shadow-inner">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 border-b border-[#334155]/50">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-indigo-400 flex-shrink-0" />
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Automated Clinical Assessment</h3>
          </div>
          <span className="text-[10px] font-mono text-slate-500">
            Model v{assessment.model_version} · {isNaN(generated.getTime()) ? '' : generated.toLocaleString()}
          </span>
        </div>

        <div className="p-4 space-y-4">
          {/* Risk line */}
          <div className="flex flex-wrap items-center gap-3">
            <span className={`text-xs font-black tracking-widest uppercase px-2.5 py-1 rounded border ${RISK_STYLES[risk.level]}`}>
              {abstained ? 'Model abstained' : `${risk.level} risk`}
            </span>
            {!abstained && (
              <>
                <span className="text-lg font-semibold text-slate-100">{risk.probability.toFixed(0)}%</span>
                <span className="text-xs text-slate-400 font-mono">
                  95% CI {risk.confidence_interval[0].toFixed(0)}–{risk.confidence_interval[1].toFixed(0)}%
                </span>
                <span className="text-xs text-slate-400">
                  Certainty {risk.certainty.toFixed(0)}% · {risk.confidence_status === 'VERIFIED' ? 'Verified' : risk.confidence_status}
                </span>
              </>
            )}
          </div>

          {/* Summary */}
          <p className="text-sm text-slate-200 leading-relaxed font-light">{assessment.summary}</p>

          {/* Factors */}
          {!abstained && (
            <div className="flex flex-col md:flex-row gap-4 md:gap-6 bg-black/20 rounded-md p-3 border border-white/5">
              <FactorList title="Factors increasing risk" factors={assessment.increasing_factors} increasing />
              <div className="hidden md:block w-px bg-white/5" />
              <FactorList title="Factors decreasing risk" factors={assessment.decreasing_factors} increasing={false} />
            </div>
          )}

          {/* Recommendations */}
          {assessment.recommendations.length > 0 && (
            <div>
              <h4 className="text-[10px] font-bold uppercase tracking-widest mb-1.5 text-indigo-300 flex items-center gap-1.5">
                <ClipboardList className="w-3.5 h-3.5" /> Suggested considerations
              </h4>
              <ul className="list-disc pl-5 space-y-1 text-xs text-slate-300">
                {assessment.recommendations.map((r) => <li key={r}>{r}</li>)}
              </ul>
            </div>
          )}

          {/* Limitations */}
          <div className="border-t border-[#334155]/50 pt-3 space-y-1">
            {assessment.limitations.map((l) => (
              <p key={l} className="text-[11px] text-slate-500 flex items-start gap-1.5">
                <AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0 text-amber-500/70" /> {l}
              </p>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClinicalAssessmentPanel;
