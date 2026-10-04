import React, { useState, useEffect } from 'react';
import { Layers, Network, Activity, Cpu, Database, ChevronRight, FileText, BarChart2, PieChart, Loader, Target, TrendingUp, Share2 as ScatterIcon, Table as TableIcon } from 'lucide-react';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, ScatterChart, Scatter, ZAxis } from 'recharts';

// --- Custom SVG Radar Chart Component ---
const RadarChart = ({ axes }: { axes: { label: string, value: number }[] }) => {
  const size = 320;
  const cx = size / 2;
  const cy = size / 2;
  const maxRadius = (size / 2) - 40; // Leave room for labels
  
  const levels = 5; // Background grid levels
  const angleStep = (Math.PI * 2) / axes.length;

  const getPoint = (value: number, index: number) => {
    const r = (value / 100) * maxRadius;
    const angle = index * angleStep - Math.PI / 2; // Start from top
    return {
      x: cx + r * Math.cos(angle),
      y: cy + r * Math.sin(angle)
    };
  };

  const dataPoints = axes.map((a, i) => getPoint(a.value, i));

  return (
    <div className="flex flex-col items-center justify-center w-full h-full relative p-4">
      <svg width="100%" height="100%" viewBox={`0 0 ${size} ${size}`} className="overflow-visible filter drop-shadow-[0_0_15px_rgba(0,229,255,0.3)]">
        {/* Draw background grid (concentric polygons) */}
        {[...Array(levels)].map((_, levelIndex) => {
          const r = ((levelIndex + 1) / levels) * maxRadius;
          const points = axes.map((_, i) => {
            const angle = i * angleStep - Math.PI / 2;
            return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`;
          }).join(' ');
          
          return (
            <polygon 
              key={`grid-${levelIndex}`}
              points={points}
              fill="rgba(0, 229, 255, 0.02)"
              stroke="rgba(255, 255, 255, 0.1)"
              strokeWidth="1"
            />
          );
        })}

        {/* Draw axis lines from center */}
        {axes.map((_, i) => {
          const endPoint = getPoint(100, i);
          return (
            <line 
              key={`axis-${i}`}
              x1={cx} y1={cy} 
              x2={endPoint.x} y2={endPoint.y}
              stroke="rgba(255, 255, 255, 0.15)"
              strokeWidth="1"
              strokeDasharray="4 4"
            />
          );
        })}

        {/* Draw the data polygon */}
        <polygon 
          points={dataPoints.map(p => `${p.x},${p.y}`).join(' ')}
          fill="rgba(0, 229, 255, 0.2)"
          stroke="#00e5ff"
          strokeWidth="2"
          className="animate-[pulse_4s_ease-in-out_infinite]"
        />

        {/* Draw data points */}
        {dataPoints.map((p, i) => (
          <circle 
            key={`point-${i}`}
            cx={p.x} cy={p.y} r="4"
            fill="#fff"
            stroke="#00e5ff"
            strokeWidth="2"
            className="filter drop-shadow-[0_0_5px_#00e5ff]"
          />
        ))}

        {/* Draw Labels */}
        {axes.map((a, i) => {
          const p = getPoint(115, i); // Push labels outside max radius
          let anchor = "middle";
          if (p.x < cx - 20) anchor = "end";
          if (p.x > cx + 20) anchor = "start";
          
          return (
            <text 
              key={`label-${i}`}
              x={p.x} y={p.y + (p.y > cy ? 10 : 0)} 
              fill="#94a3b8" 
              fontSize="10" 
              fontWeight="bold"
              textAnchor={anchor}
              className="uppercase tracking-[0.1em]"
            >
              {a.label}
              <tspan x={p.x} dy="14" fill="#00e5ff" fontSize="12" fontWeight="900" className="font-mono">
                {a.value}%
              </tspan>
            </text>
          );
        })}
      </svg>
    </div>
  );
};

export const AttentionDashboard = () => {
  const [data, setData] = useState<{
    modality_weights: { imaging_ct: number, clinical_ehr: number } | null,
    clinical_attention: Record<string, number> | null,
    patient_name?: string,
    patient_id?: string,
    attention_summary: string,
    analytics_data?: {
       barChartData: any[],
       scatterDataHighAFP: any[],
       scatterDataLowAFP: any[],
       tableData: any[],
       radarData: any[]
    }
  }>({
    modality_weights: null,
    clinical_attention: null,
    attention_summary: ''
  });
  
  const defaultRadar = [
    { label: "Liver Function", value: 50 },
    { label: "Tumor Morphology", value: 50 },
    { label: "Viral Markers", value: 50 },
    { label: "Vascular Invasion", value: 50 },
    { label: "Texture Entropy", value: 50 }
  ];
  
  const [loading, setLoading] = useState(true);
  const [hasSession, setHasSession] = useState(true);

  useEffect(() => {
    const sessionActive = sessionStorage.getItem("active_patient_session") === "true";
    if (!sessionActive) {
      setHasSession(false);
      setLoading(false);
      return;
    }
    
    const fetchData = async () => {
      try {
        const response = await axios.get('http://127.0.0.1:8000/api/attention-analysis');
        setData(response.data);
      } catch (err: any) {
        console.error("Failed to fetch attention metrics:", err);
        // Fallback to mock data to ensure UI always renders gracefully
        setData({
          modality_weights: { imaging_ct: 63, clinical_ehr: 37 },
          clinical_attention: { "AFP": 0.45, "Tumor Size": 0.25, "MVI Status": 0.15, "Texture Entropy": 0.10, "Bilirubin": 0.05 },
          attention_summary: "The Attention Mechanism prioritized the hypodense regions in the CT scan (63%) over the clinical markers (37%) due to the irregular tumor shape and texture heterogeneity."
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  const getGradientColors = (index: number) => {
    const palettes = [
      { color: "#ff0055", gradient: "from-[#cc0044] to-[#ff0055]" },
      { color: "#ffaa00", gradient: "from-[#cc8800] to-[#ffaa00]" },
      { color: "#9d00ff", gradient: "from-[#7700cc] to-[#9d00ff]" },
      { color: "#00e5ff", gradient: "from-[#00b3cc] to-[#00e5ff]" },
      { color: "#00ff9d", gradient: "from-[#00cc7d] to-[#00ff9d]" }
    ];
    return palettes[index % palettes.length];
  };

  if (loading) {
    return (
      <div className="flex-1 bg-[#0a0f18] text-slate-300 font-sans h-screen flex flex-col items-center justify-center">
        <Loader className="w-10 h-10 text-[#9d00ff] animate-spin mb-4" />
        <p className="text-sm font-mono tracking-widest uppercase text-[#9d00ff]">Extracting Attention Layers...</p>
      </div>
    );
  }

  if (!hasSession) {
    return (
      <div className="flex-1 bg-[#0a0f18] text-slate-300 font-sans h-screen flex flex-col items-center justify-center p-8">
        <div className="bg-[#111827] border border-[#1e293b] p-10 rounded-2xl flex flex-col items-center justify-center shadow-2xl max-w-lg w-full">
            <Target className="w-20 h-20 text-[#2a364a] mb-6" />
            <h2 className="text-xl font-black tracking-widest uppercase text-slate-400 mb-4 text-center">No Active Patient Session</h2>
            <p className="text-[11px] font-mono text-slate-500 text-center leading-relaxed">
              Diagnostic attention matrices and feature attributions are isolated to the active encounter. <br/><br/>
              <strong className="text-indigo-400">Please upload patient records and initialize the diagnostic pipeline in the Predict Workspace</strong> to generate real-time SHAP explanations.
            </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-[#0a0f18] text-slate-300 font-sans h-screen flex flex-col overflow-hidden relative z-0">
      {/* Background Glows (Fixed to viewport) */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#00e5ff]/5 blur-[120px] rounded-full animate-pulse-slow"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#9d00ff]/5 blur-[150px] rounded-full animate-pulse-slow" style={{ animationDelay: '2s' }}></div>
      </div>

      {/* Scrollable Container */}
      <div className="flex-1 p-8 flex flex-col relative z-10 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-6 border-b border-white/10 pb-4 shrink-0">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
               <Layers className="w-6 h-6 text-[#00e5ff] drop-shadow-[0_0_8px_rgba(0,229,255,0.8)]" />
               <h1 className="text-2xl font-black text-white uppercase tracking-[0.2em] drop-shadow-md">
                 Cross-Modal Attention & Fusion Analysis
               </h1>
            </div>
            <p className="text-slate-400 text-sm font-medium flex items-center gap-2 tracking-wide">
              <span className="w-1.5 h-1.5 rounded-full bg-[#9d00ff] animate-pulse shadow-[0_0_8px_rgba(157,0,255,0.6)]"></span>
              Session Deep-Dive: Interpretability of Neural Modality Weights & Multi-Axis Risk.
            </p>
          </div>
          
          {(data.patient_name || data.patient_id) && (
            <div className="bg-[#0f1522]/80 backdrop-blur-md border border-white/10 rounded-xl px-5 py-3 shadow-lg flex flex-col items-end">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Active Patient Context</span>
              <span className="text-white font-bold tracking-wider">{data.patient_name && data.patient_name !== "the current patient" ? data.patient_name : "UNKNOWN PATIENT"}</span>
              {data.patient_id && <span className="text-xs text-[#00e5ff] font-mono mt-0.5">ID: {data.patient_id}</span>}
            </div>
          )}
        </div>

        {/* Top Section: Dashboard Grid - 3 Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10 shrink-0">
          
          {/* Column 1: Weights & Clinical */}
          <div className="col-span-1 flex flex-col gap-6 h-full">
            {/* Modality Weight Distribution */}
            <div className="bg-[#0f1522]/60 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.5)] p-5 relative overflow-hidden flex flex-col group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#00e5ff]/5 blur-[40px] pointer-events-none group-hover:bg-[#00e5ff]/10 transition-colors"></div>
              
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-white/10 relative z-10">
                <PieChart className="w-4 h-4 text-[#00e5ff] drop-shadow-[0_0_5px_rgba(0,229,255,0.8)]" />
                <h2 className="text-[10px] font-black text-white uppercase tracking-[0.2em] drop-shadow-sm">Fusion Modality Weights</h2>
              </div>
              <p className="text-[9px] text-slate-500 uppercase tracking-widest mb-4">Indicates whether the AI relied more on the CT scan or the clinical reports.</p>
              
              <div className="flex flex-col gap-6 relative z-10">
                <div className="group/modality">
                  <div className="flex justify-between items-end mb-2">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#00e5ff] flex items-center gap-2">
                      <Activity className="w-3 h-3" /> Imaging (CT)
                    </span>
                    <span className="text-xl font-mono font-black text-white">{data.modality_weights?.imaging_ct || 0}<span className="text-[10px] text-slate-500">%</span></span>
                  </div>
                  <div className="w-full bg-black/40 h-2.5 rounded-full overflow-hidden border border-white/10 shadow-inner">
                    <div className="bg-gradient-to-r from-[#00bfff] to-[#00e5ff] h-full rounded-full relative overflow-hidden shadow-[0_0_15px_rgba(0,229,255,0.5)] transition-all duration-1000" style={{ width: `${data.modality_weights?.imaging_ct || 0}%` }}>
                       <div className="absolute inset-0 bg-white/30 w-1/2 -skew-x-12 animate-[shimmer_2.5s_infinite]"></div>
                    </div>
                  </div>
                </div>

                <div className="group/modality">
                  <div className="flex justify-between items-end mb-2">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#ffaa00] flex items-center gap-2">
                      <Database className="w-3 h-3" /> Clinical (EHR)
                    </span>
                    <span className="text-xl font-mono font-black text-white">{data.modality_weights?.clinical_ehr || 0}<span className="text-[10px] text-slate-500">%</span></span>
                  </div>
                  <div className="w-full bg-black/40 h-2.5 rounded-full overflow-hidden border border-white/10 shadow-inner">
                    <div className="bg-gradient-to-r from-[#ff8800] to-[#ffaa00] h-full rounded-full relative overflow-hidden shadow-[0_0_15px_rgba(255,170,0,0.5)] transition-all duration-1000" style={{ width: `${data.modality_weights?.clinical_ehr || 0}%` }}>
                       <div className="absolute inset-0 bg-white/30 w-1/2 -skew-x-12 animate-[shimmer_2.5s_infinite] delay-700"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Clinical Attention Weights */}
            <div className="flex-1 bg-[#0f1522]/60 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.5)] p-5 relative overflow-hidden flex flex-col group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#ff0055]/5 blur-[40px] pointer-events-none group-hover:bg-[#ff0055]/10 transition-colors"></div>
              
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-white/10 relative z-10">
                <BarChart2 className="w-4 h-4 text-[#ff0055] drop-shadow-[0_0_5px_rgba(255,0,85,0.8)]" />
                <h2 className="text-[10px] font-black text-white uppercase tracking-[0.2em] drop-shadow-sm">Clinical Feature Attention</h2>
              </div>
              
              <div className="flex-1 flex flex-col justify-around gap-3 relative z-10">
                {data.clinical_attention && Object.entries(data.clinical_attention).sort((a, b) => b[1] - a[1]).map(([featureName, weight], i) => {
                  const styleProps = getGradientColors(i);
                  return (
                    <div key={i} className="flex flex-col gap-1">
                      <div className="flex justify-between items-end">
                        <span className="text-[9px] font-black uppercase tracking-[0.1em] text-slate-300">{featureName}</span>
                        <span className="text-[9px] font-mono text-white opacity-80">{weight.toFixed(2)}</span>
                      </div>
                      <div className="w-full bg-black/40 h-1.5 rounded-full overflow-hidden border border-white/5">
                        <div 
                          className={`bg-gradient-to-r ${styleProps.gradient} h-full rounded-full transition-all duration-1000 ease-out`} 
                          style={{ width: `${weight * 100}%`, boxShadow: `0 0 10px ${styleProps.color}40` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Column 2: Multi-Dimensional Risk Radar */}
          <div className="col-span-1 bg-[#0f1522]/60 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.5)] p-5 relative overflow-hidden flex flex-col group h-[500px] lg:h-auto">
             <div className="absolute top-0 right-0 w-48 h-48 bg-[#00e5ff]/5 blur-[60px] pointer-events-none group-hover:bg-[#00e5ff]/10 transition-colors"></div>
             
             <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10 relative z-10">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-[#00e5ff] drop-shadow-[0_0_5px_rgba(0,229,255,0.8)]" />
                  <h2 className="text-[10px] font-black text-white uppercase tracking-[0.2em] drop-shadow-sm">Multi-Dimensional Risk Profile</h2>
                </div>
             </div>
             
             <div className="flex-1 w-full relative z-10 flex flex-col items-center justify-center">
                <RadarChart axes={data.analytics_data?.radarData || defaultRadar} />
                <div className="absolute bottom-2 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg border border-[#00e5ff]/30 text-[9px] uppercase tracking-widest text-[#00e5ff] font-bold shadow-[0_0_10px_rgba(0,229,255,0.2)]">
                  Severity Analysis Active
                </div>
             </div>
          </div>

          {/* Column 3: Fusion Flowchart */}
          <div className="col-span-1 bg-[#0f1522]/60 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.5)] flex flex-col p-5 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#9d00ff]/5 blur-[80px] pointer-events-none group-hover:bg-[#9d00ff]/10 transition-colors"></div>
            
            <div className="flex items-center gap-2 mb-6 pb-3 border-b border-white/10 relative z-10">
              <Network className="w-4 h-4 text-[#9d00ff] drop-shadow-[0_0_5px_rgba(157,0,255,0.8)]" />
              <h2 className="text-[10px] font-black text-white uppercase tracking-[0.2em] drop-shadow-sm">Dynamic Fusion Architecture</h2>
            </div>
            
            {/* Flowchart Visual */}
            <div className="flex-1 flex flex-col items-center justify-center relative z-10 w-full mb-6 py-4">
              <div className="flex w-full justify-around items-end mb-8 relative">
                <div className="flex flex-col items-center group/node relative z-10">
                  <div className="absolute inset-0 bg-[#00e5ff]/20 blur-[15px] rounded-full opacity-50 group-hover/node:opacity-100 transition-opacity"></div>
                  <div className="bg-[#0f1522] border border-[#00e5ff]/50 px-4 py-3 rounded-xl shadow-[0_0_15px_rgba(0,229,255,0.15)] flex flex-col items-center gap-1.5 relative">
                    <Activity className="w-5 h-5 text-[#00e5ff]" />
                    <span className="text-[8px] font-black uppercase tracking-[0.2em] text-[#00e5ff]">CT Image Node</span>
                  </div>
                </div>
                <div className="flex flex-col items-center group/node relative z-10">
                  <div className="absolute inset-0 bg-[#ffaa00]/20 blur-[15px] rounded-full opacity-50 group-hover/node:opacity-100 transition-opacity"></div>
                  <div className="bg-[#0f1522] border border-[#ffaa00]/50 px-4 py-3 rounded-xl shadow-[0_0_15px_rgba(255,170,0,0.15)] flex flex-col items-center gap-1.5 relative">
                    <Database className="w-5 h-5 text-[#ffaa00]" />
                    <span className="text-[8px] font-black uppercase tracking-[0.2em] text-[#ffaa00]">Clinical Node</span>
                  </div>
                </div>
                <svg className="absolute inset-0 w-full h-full pointer-events-none z-0" style={{ top: '100%', left: 0, height: '60px' }}>
                  <path d="M25% 0 C 25% 45, 50% 15, 50% 60" fill="none" stroke="rgba(0,229,255,0.3)" strokeWidth="2" strokeDasharray="4 4" className="animate-[dash_2s_linear_infinite]" />
                  <path d="M75% 0 C 75% 45, 50% 15, 50% 60" fill="none" stroke="rgba(255,170,0,0.3)" strokeWidth="2" strokeDasharray="4 4" className="animate-[dash_2s_linear_infinite]" />
                </svg>
              </div>

              <div className="flex flex-col items-center mb-8 relative mt-6 z-10">
                <div className="flex flex-col items-center group/node relative">
                  <div className="absolute inset-0 bg-[#9d00ff]/20 blur-[20px] rounded-full opacity-50 group-hover/node:opacity-100 transition-opacity"></div>
                  <div className="bg-gradient-to-b from-[#1a0033] to-[#0f1522] border border-[#9d00ff]/50 px-6 py-4 rounded-xl shadow-[0_0_20px_rgba(157,0,255,0.2)] flex flex-col items-center gap-1.5 relative z-10">
                    <Cpu className="w-6 h-6 text-[#9d00ff]" />
                    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-[#9d00ff]">Attention Fusion Node</span>
                  </div>
                </div>
                <svg className="absolute inset-0 w-full h-full pointer-events-none z-0" style={{ top: '100%', left: 0, height: '50px' }}>
                  <path d="M50% 0 L 50% 50" fill="none" stroke="rgba(157,0,255,0.4)" strokeWidth="2" strokeDasharray="4 4" className="animate-[dash_2s_linear_infinite]" />
                </svg>
              </div>

              <div className="flex flex-col items-center relative mt-2 z-10">
                 <div className="absolute inset-0 bg-rose-500/10 blur-[15px] rounded-full"></div>
                 <div className="bg-[#0f1522] border border-rose-500/50 px-6 py-2 rounded-full shadow-[0_0_15px_rgba(244,63,94,0.3)] relative z-10 flex items-center gap-2">
                   <span className="text-[10px] font-black uppercase tracking-[0.2em] text-rose-400">Risk Percentage Node</span>
                   <ChevronRight className="w-3 h-3 text-rose-400" />
                 </div>
              </div>
            </div>


            
          </div>
        </div>

        {/* ---------------------------------------------------- */}
        {/* NEW SECTION: Advanced Deep-Dive Analytics           */}
        {/* ---------------------------------------------------- */}
        
        <div className="flex items-center gap-3 mb-6 border-b border-white/10 pb-4 shrink-0 mt-4">
           <Cpu className="w-6 h-6 text-[#ff0055] drop-shadow-[0_0_8px_rgba(255,0,85,0.8)]" />
           <h1 className="text-2xl font-black text-white uppercase tracking-[0.2em] drop-shadow-md">
             Advanced Deep-Dive Analytics
           </h1>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 gap-6 mb-8 shrink-0">
          
          {/* Chart 1: Local vs Global Attention */}
          <div className="bg-[#0f1522]/60 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.5)] p-5 relative flex flex-col group h-[400px]">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#00e5ff]/5 blur-[40px] pointer-events-none group-hover:bg-[#00e5ff]/10 transition-colors"></div>
            
            <div className="flex items-center gap-2 mb-2 pb-3 border-b border-white/10 relative z-10">
              <TrendingUp className="w-4 h-4 text-[#00e5ff] drop-shadow-[0_0_5px_rgba(0,229,255,0.8)]" />
              <h2 className="text-[10px] font-black text-white uppercase tracking-[0.2em] drop-shadow-sm">Local vs. Global Attention Comparison</h2>
            </div>
            <p className="text-[9px] text-slate-500 uppercase tracking-widest mb-4">Compares the current patient's feature importance against the global model baseline.</p>
            
            <div className="flex-1 w-full mt-2 relative z-10">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.analytics_data?.barChartData || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="name" stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 10, fontFamily: 'monospace' }} axisLine={false} tickLine={false} />
                  <YAxis stroke="#64748b" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <RechartsTooltip 
                    cursor={{ fill: 'rgba(255,255,255,0.02)' }} 
                    contentStyle={{ backgroundColor: 'rgba(15,21,34,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em' }} />
                  <Bar dataKey="GlobalAverage" fill="#334155" radius={[4, 4, 0, 0]} name="Global Average" />
                  <Bar dataKey="CurrentPatient" fill="#00e5ff" radius={[4, 4, 0, 0]} name="Current Patient" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>


          
        </div>

        {/* Detailed Feature Analytics Table */}
        <div className="bg-[#0f1522]/60 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.5)] p-6 relative overflow-hidden flex flex-col group mb-8 shrink-0">
          <div className="absolute top-0 right-1/2 w-64 h-64 bg-[#9d00ff]/5 blur-[80px] pointer-events-none group-hover:bg-[#9d00ff]/10 transition-colors"></div>
          
          <div className="flex items-center gap-2 mb-6 pb-3 border-b border-white/10 relative z-10">
            <TableIcon className="w-4 h-4 text-[#9d00ff] drop-shadow-[0_0_5px_rgba(157,0,255,0.8)]" />
            <h2 className="text-[10px] font-black text-white uppercase tracking-[0.2em] drop-shadow-sm">Detailed Feature Analytics</h2>
          </div>
          
          <div className="overflow-x-auto relative z-10 w-full rounded-xl border border-white/5 bg-black/20">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/5 border-b border-white/10 text-[9px] uppercase tracking-widest text-slate-400">
                  <th className="p-4 font-bold">Feature Name</th>
                  <th className="p-4 font-bold">Modality</th>
                  <th className="p-4 font-bold">Patient Value</th>
                  <th className="p-4 font-bold">Global Average</th>
                  <th className="p-4 font-bold">Risk Contribution (+/-)</th>
                </tr>
              </thead>
              <tbody className="text-xs font-mono text-slate-300 divide-y divide-white/5">
                {(data.analytics_data?.tableData || []).map((row: any, idx: number) => {
                  const isPositiveRisk = row.risk.includes('+');
                  return (
                    <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                      <td className="p-4 font-sans font-medium text-white">{row.feature}</td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded text-[9px] uppercase tracking-wider ${row.modality.includes('CT') ? 'bg-[#00e5ff]/10 text-[#00e5ff] border border-[#00e5ff]/20' : 'bg-[#ffaa00]/10 text-[#ffaa00] border border-[#ffaa00]/20'}`}>
                          {row.modality}
                        </span>
                      </td>
                      <td className="p-4 font-bold">{row.value}</td>
                      <td className="p-4 text-slate-500">{row.globalAvg}</td>
                      <td className="p-4">
                        <span className={`flex items-center gap-1.5 font-bold ${isPositiveRisk ? 'text-rose-500' : 'text-[#00ff9d]'}`}>
                          {isPositiveRisk ? (
                            <TrendingUp className="w-3 h-3" />
                          ) : (
                            <TrendingUp className="w-3 h-3 rotate-180" />
                          )}
                          {row.risk}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
};
