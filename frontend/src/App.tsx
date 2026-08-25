import React, { useState, useEffect } from "react";
import axios from "axios";
import { PredictPage } from "./pages/PredictPage";
import { LongitudinalPredictPage } from "./pages/LongitudinalPredictPage";
import { LoginPage } from "./pages/LoginPage";
import { AdminDashboardPage } from "./pages/AdminDashboardPage";
import { AdminLoginPage } from "./pages/AdminLoginPage";
import { Sidebar } from "./components/Sidebar";
import { DoctorMessages } from "./components/DoctorMessages";
import MprClinicalWorkstation from "./components/MprClinicalWorkstation";
import SecuritySettingsTab from "./components/SecuritySettingsTab";
import PatientSearchPage from "./pages/PatientSearchPage";
import DoctorBillingPage from "./pages/DoctorBillingPage";
import { AttentionDashboard } from "./pages/AttentionDashboard";
import FeatureExtractionStudio from "./pages/FeatureExtractionStudio";

import { ArrowLeft, Activity, LayoutDashboard, Users, Database, Search, Settings, ShieldAlert, CheckCircle, FileText, Cpu, Server, Network, Cloud, Shield, CreditCard, Palette, Moon, Sun, Monitor, Eye } from "lucide-react";

// Modern Placeholder Pages with medical workstation aesthetic
const DashboardPage = ({ user, onViewPatientDirectory, onViewBilling }: { user: any, onViewPatientDirectory?: () => void, onViewBilling?: () => void }) => {
  const [stats, setStats] = useState<any>({ 
    total_scans: 0, 
    today_scans: 0,
    high_risk_detections: 0, 
    system_accuracy: "Loading...",
    risk_distribution: { high: 0, medium: 0, low: 0 },
    recent_alerts: []
  });

  useEffect(() => {
    const url = user?.id ? `http://127.0.0.1:8000/api/v1/dashboard-stats?doctor_id=${user.id}` : `http://127.0.0.1:8000/api/v1/dashboard-stats`;
    axios.get(url).then(res => setStats(res.data)).catch(console.error);
  }, [user]);

  const totalRisks = stats.risk_distribution.high + stats.risk_distribution.medium + stats.risk_distribution.low;
  const highPct = totalRisks ? (stats.risk_distribution.high / totalRisks) * 100 : 0;
  const medPct = totalRisks ? (stats.risk_distribution.medium / totalRisks) * 100 : 0;
  const lowPct = totalRisks ? (stats.risk_distribution.low / totalRisks) * 100 : 0;

  return (
    <div className="flex-1 bg-[#0a0f18] text-slate-300 font-sans h-screen flex flex-col overflow-hidden relative z-0">
      {/* Dynamic Background Effects matching Workspace */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-[#00e5ff]/5 blur-[120px] rounded-full animate-pulse-slow"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-[#00ff9d]/5 blur-[150px] rounded-full animate-pulse-slow" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="flex-1 p-8 flex flex-col relative z-10 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
        
        {/* Workspace Premium Header */}
        <div className="flex items-center justify-between mb-8 border-b border-white/10 pb-6 relative">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
               <LayoutDashboard className="w-6 h-6 text-[#00e5ff] drop-shadow-[0_0_8px_rgba(0,229,255,0.8)]" />
               <h1 className="text-2xl font-black text-white uppercase tracking-[0.2em] drop-shadow-md">
                 Clinical Intelligence Center
               </h1>
            </div>
            <p className="text-slate-400 text-sm font-medium flex items-center gap-2 tracking-wide">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00ff9d] animate-pulse shadow-[0_0_8px_rgba(0,255,157,0.6)]"></span>
              Real-time Physician Encounter Analytics & Patient Outcomes
            </p>
          </div>
          
          <div className="flex items-center gap-4 bg-[#0f1522]/60 border border-white/10 px-4 py-2 rounded-xl backdrop-blur-2xl shadow-[0_4px_15px_rgba(0,0,0,0.5)]">
            <div className="flex flex-col items-end border-r border-white/10 pr-4">
              <span className="text-[9px] uppercase font-black text-slate-400 tracking-[0.2em]">System Status</span>
              <span className="text-xs font-mono text-[#00ff9d] font-bold drop-shadow-[0_0_5px_rgba(0,255,157,0.5)]">OPTIMAL (1ms)</span>
            </div>
            <div className="flex flex-col items-start pl-2">
              <span className="text-[9px] uppercase font-black text-slate-400 tracking-[0.2em]">Active Shift</span>
              <span className="text-xs font-mono text-slate-200 font-bold">{new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }).toUpperCase()}</span>
            </div>
          </div>
        </div>

        {/* Premium KPI Metrics */}
        <div className="grid grid-cols-4 gap-6 mb-8">
        {[
          { label: "Today's Patient Volume", value: stats.today_scans || 0, icon: Users, color: "#00e5ff", trend: "+12%" },
          { label: "High Risk Detections", value: stats.high_risk_detections, icon: ShieldAlert, color: "#ff0055", trend: "+2" },
          { label: "Medium Risk Detections", value: stats.risk_distribution.medium, icon: Activity, color: "#ffaa00", trend: "-1" },
          { label: "Total Clinical Encounters", value: stats.total_scans, icon: Database, color: "#9d00ff", trend: "Steady" }
        ].map((kpi, i) => (
          <div key={i} className="bg-[#0f1522]/60 backdrop-blur-2xl border border-white/10 p-6 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.5)] hover:shadow-[0_8px_40px_rgba(0,229,255,0.15)] hover:border-[#00e5ff]/30 transition-all duration-500 relative overflow-hidden flex flex-col justify-between group">
            <div className="absolute top-0 right-0 w-24 h-24 rounded-full blur-[40px] opacity-20 group-hover:opacity-40 transition-opacity" style={{ backgroundColor: kpi.color }}></div>
            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none"></div>
            
            <div className="flex justify-between items-start mb-4 relative z-10">
              <div className="p-2.5 rounded-xl bg-black/40 border border-white/10 shadow-inner" style={{ color: kpi.color, borderColor: `${kpi.color}40` }}>
                <kpi.icon className="w-5 h-5 drop-shadow-[0_0_8px_currentColor]" />
              </div>
              <span className={`text-[9px] font-black px-2 py-1 rounded-md border tracking-[0.2em] uppercase ${kpi.trend.startsWith('+') ? 'text-[#00ff9d] border-[#00ff9d]/30 bg-[#00ff9d]/10 shadow-[0_0_10px_rgba(0,255,157,0.2)]' : kpi.trend.startsWith('-') ? 'text-[#00e5ff] border-[#00e5ff]/30 bg-[#00e5ff]/10 shadow-[0_0_10px_rgba(0,229,255,0.2)]' : 'text-slate-400 border-white/10 bg-white/5'}`}>
                {kpi.trend}
              </span>
            </div>
            
            <div className="relative z-10 mt-2">
              <p className="text-4xl font-mono font-black text-white drop-shadow-md mb-1">{kpi.value}</p>
              <h3 className="text-slate-400 font-bold uppercase tracking-[0.1em] text-[9px]">{kpi.label}</h3>
            </div>
            {i === 0 && onViewBilling && (
              <div className="absolute bottom-4 right-4 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={onViewBilling} className="text-[9px] bg-black/40 hover:bg-[#00e5ff]/20 hover:text-[#00e5ff] hover:border-[#00e5ff]/50 text-white px-2 py-1 rounded border border-white/20 flex items-center gap-1 font-black tracking-widest uppercase transition-colors shadow-lg">
                  <CreditCard className="w-3 h-3" /> View Logs
                </button>
              </div>
            )}
          </div>
        ))}
        </div>

      <div className="grid grid-cols-3 gap-8 flex-1 min-h-[400px]">
        {/* Left Col: Risk Distribution Chart */}
        <div className="col-span-1 bg-[#0f1522]/60 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.5)] p-7 flex flex-col relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#00e5ff]/5 blur-[40px] pointer-events-none"></div>
          <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/10 relative z-10">
            <div className="flex items-center gap-3">
              <Activity className="w-5 h-5 text-[#00e5ff] drop-shadow-[0_0_5px_rgba(0,229,255,0.8)]" />
              <h2 className="text-[11px] font-black text-white uppercase tracking-[0.2em] drop-shadow-sm">Risk Stratification</h2>
            </div>
          </div>
          
          <div className="flex-1 flex flex-col justify-center gap-10 relative z-10">
            {[
              { label: 'Critical / High Risk', count: stats.risk_distribution.high, pct: highPct, color: '#ff0055', gradient: 'from-[#ff0055] to-[#ff4d88]' },
              { label: 'Elevated / Medium Risk', count: stats.risk_distribution.medium, pct: medPct, color: '#ffaa00', gradient: 'from-[#ffaa00] to-[#ffd480]' },
              { label: 'Benign / Low Risk', count: stats.risk_distribution.low, pct: lowPct, color: '#00ff9d', gradient: 'from-[#00ff9d] to-[#66ffc2]' }
            ].map((risk, i) => (
              <div key={i} className="group/risk">
                <div className="flex justify-between items-end mb-3">
                  <div className="flex flex-col gap-1">
                    <span className="text-[9px] font-black uppercase tracking-[0.2em]" style={{ color: risk.color }}>{risk.label}</span>
                    <span className="text-2xl font-mono font-black text-white">{risk.count} <span className="text-[10px] text-slate-500 font-sans tracking-[0.1em] uppercase">Encounters</span></span>
                  </div>
                  <span className="text-sm font-mono font-black" style={{ color: risk.color }}>{risk.pct.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-black/40 h-3 rounded-full overflow-hidden border border-white/10 shadow-inner">
                  <div className={`bg-gradient-to-r ${risk.gradient} h-full rounded-full transition-all duration-1000 relative overflow-hidden shadow-[0_0_15px_rgba(0,0,0,0.5)]`} style={{ width: `${risk.pct}%` }}>
                     <div className="absolute inset-0 bg-white/30 w-1/2 -skew-x-12 animate-[shimmer_2.5s_infinite]"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Col: Recent Patient Records */}
        <div className="col-span-2 bg-[#0f1522]/60 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.5)] flex flex-col overflow-hidden relative">
          <div className="p-6 flex items-center justify-between border-b border-white/10 flex-shrink-0 bg-black/20">
             <div className="flex items-center gap-3">
               <div className="p-2 bg-[#00e5ff]/10 rounded-lg border border-[#00e5ff]/30 shadow-inner"><FileText className="w-4 h-4 text-[#00e5ff]" /></div>
               <h2 className="text-[11px] font-black text-white uppercase tracking-[0.2em] drop-shadow-sm">Recent Clinical Diagnostics</h2>
             </div>
             <div className="flex items-center gap-3">
               <span className="text-[9px] bg-black/40 text-[#00ff9d] px-3 py-1.5 rounded-lg border border-[#00ff9d]/30 uppercase font-black tracking-[0.2em] shadow-inner drop-shadow-[0_0_5px_rgba(0,255,157,0.3)]">
                 {stats.recent_alerts.length} Records Streamed
               </span>
               {onViewPatientDirectory && (
                 <button onClick={onViewPatientDirectory} className="text-[9px] bg-[#00e5ff]/10 text-[#00e5ff] px-3 py-1.5 rounded-lg border border-[#00e5ff]/30 uppercase font-black tracking-[0.2em] shadow-inner hover:bg-[#00e5ff]/20 hover:border-[#00e5ff]/50 transition-all flex items-center gap-2 group/btn">
                   <Search className="w-3 h-3 group-hover/btn:scale-110 transition-transform" />
                   View All History
                 </button>
               )}
             </div>
          </div>
          
          <div className="flex-1 overflow-hidden relative bg-black/10">
            <div className="absolute top-0 left-0 right-0 h-4 bg-gradient-to-b from-[#0f1522] to-transparent z-10 pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-t from-[#0f1522] to-transparent z-10 pointer-events-none"></div>
            
            <div className="h-full overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 bg-black/40 border-b border-white/10 z-20 shadow-md">
                  <tr>
                    <th className="py-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Timestamp</th>
                    <th className="py-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">Patient Identifier</th>
                    <th className="py-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">AI Prognosis</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {stats.recent_alerts.length === 0 ? (
                     <tr>
                       <td colSpan={3} className="text-center py-24 text-[10px] font-mono text-slate-500 uppercase tracking-[0.2em]">
                         <div className="flex flex-col items-center justify-center gap-4 opacity-50">
                            <div className="p-4 rounded-full bg-white/5 border border-white/10"><Activity className="w-6 h-6 text-slate-400" /></div>
                            No diagnostic evaluations performed during this shift.
                         </div>
                       </td>
                     </tr>
                  ) : (
                    stats.recent_alerts.map((alert: any) => (
                      <tr key={alert._id} className="hover:bg-white/5 transition-colors group">
                        <td className="py-4 px-6 text-xs font-mono text-slate-400 group-hover:text-[#00e5ff] transition-colors font-bold">
                          {new Date(alert.timestamp).toLocaleString('en-US', { month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="py-4 px-6 text-center">
                          <span className="text-xs font-mono text-[#00e5ff] font-bold bg-[#00e5ff]/5 px-4 py-2 rounded-lg border border-[#00e5ff]/20">
                            {alert.pseudo_anonymous_id || 'UNKNOWN'}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-right">
                          <div className={`inline-flex items-center gap-2 text-[10px] px-4 py-2 rounded-lg font-black uppercase tracking-[0.2em] border shadow-inner ${alert.recurrence_risk === 'HIGH' ? 'bg-[#ff0055]/10 text-[#ff0055] border-[#ff0055]/30 shadow-[0_0_10px_rgba(255,0,85,0.15)]' : alert.recurrence_risk === 'MEDIUM' ? 'bg-[#ffaa00]/10 text-[#ffaa00] border-[#ffaa00]/30 shadow-[0_0_10px_rgba(255,170,0,0.15)]' : 'bg-[#00ff9d]/10 text-[#00ff9d] border-[#00ff9d]/30 shadow-[0_0_10px_rgba(0,255,157,0.15)]'}`}>
                            <span className={`w-2 h-2 rounded-full ${alert.recurrence_risk === 'HIGH' ? 'bg-[#ff0055] shadow-[0_0_5px_#ff0055]' : alert.recurrence_risk === 'MEDIUM' ? 'bg-[#ffaa00] shadow-[0_0_5px_#ffaa00]' : 'bg-[#00ff9d] shadow-[0_0_5px_#00ff9d]'}`}></span>
                            {alert.recurrence_risk} <span className="opacity-60 ml-1">({roundProb(alert.probability)}%)</span>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
};


const roundProb = (p: number) => (p * 100).toFixed(1);



const SettingsPage = ({ cdssEnabled, onToggleCdss, activeTheme, onSetTheme }: { cdssEnabled: boolean; onToggleCdss: (val: boolean) => void; activeTheme: string; onSetTheme: (theme: string) => void }) => (
  <div className="flex-1 bg-[#0a0f18] text-slate-300 font-sans h-screen flex flex-col overflow-hidden relative z-0">
    {/* Dynamic Background Effects matching Workspace */}
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
      <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] bg-[#00e5ff]/5 blur-[120px] rounded-full animate-pulse-slow"></div>
      <div className="absolute bottom-[-20%] left-[-10%] w-[60%] h-[60%] bg-[#00ff9d]/5 blur-[150px] rounded-full animate-pulse-slow" style={{ animationDelay: '2s' }}></div>
    </div>

    <div className="flex-1 p-8 flex flex-col relative z-10 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
      
      {/* Premium Header */}
      <div className="flex flex-col gap-2 mb-8 border-b border-white/10 pb-6">
        <div className="flex items-center gap-3">
           <Settings className="w-6 h-6 text-[#00e5ff] drop-shadow-[0_0_8px_rgba(0,229,255,0.8)]" />
           <h1 className="text-2xl font-black text-white uppercase tracking-[0.2em] drop-shadow-md">
             System Configuration
           </h1>
        </div>
        <p className="text-slate-400 text-sm font-medium flex items-center gap-2 tracking-wide">
          <span className="w-1.5 h-1.5 rounded-full bg-[#00ff9d] animate-pulse shadow-[0_0_8px_rgba(0,255,157,0.6)]"></span>
          Personal Workstation & Network Integrations
        </p>
      </div>
      
      <div className="grid grid-cols-2 gap-6 flex-shrink-0">
        {/* PACS Integration Panel */}
        <div className="bg-[#0f1522]/60 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.5)] p-6 relative overflow-hidden group">
           <div className="absolute top-0 right-0 w-24 h-24 bg-[#00e5ff]/10 blur-[30px] group-hover:bg-[#00e5ff]/20 transition-colors"></div>
           <div className="flex items-center gap-3 mb-6 border-b border-white/10 pb-3 relative z-10">
             <Server className="w-5 h-5 text-[#00e5ff]" />
             <h2 className="text-[11px] font-black text-white uppercase tracking-[0.2em]">Hospital PACS Integration</h2>
           </div>
           <div className="space-y-4 relative z-10">
              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] uppercase tracking-[0.2em] text-slate-400 font-black">DICOM Server AETitle</label>
                <input type="text" disabled value="LIVER_NET_AI_NODE" className="w-full bg-black/40 border border-white/10 text-white px-4 py-3 rounded-xl text-xs font-mono shadow-inner opacity-80" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] uppercase tracking-[0.2em] text-slate-400 font-black">Server IP / Port Mapping</label>
                <input type="text" disabled value="10.24.1.100 : 104 (TLS)" className="w-full bg-black/40 border border-[#00ff9d]/30 text-[#00ff9d] px-4 py-3 rounded-xl text-xs font-mono shadow-[inset_0_0_10px_rgba(0,255,157,0.1)] opacity-90" />
              </div>
           </div>
        </div>

        {/* AI Inference Engine Panel */}
        <div className="bg-[#0f1522]/60 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.5)] p-6 relative overflow-hidden group">
           <div className="absolute top-0 right-0 w-24 h-24 bg-[#9d00ff]/10 blur-[30px] group-hover:bg-[#9d00ff]/20 transition-colors"></div>
           <div className="flex items-center gap-3 mb-6 border-b border-white/10 pb-3 relative z-10">
             <Cpu className="w-5 h-5 text-[#9d00ff] drop-shadow-[0_0_5px_rgba(157,0,255,0.6)]" />
             <h2 className="text-[11px] font-black text-white uppercase tracking-[0.2em]">Local Inference Engine</h2>
           </div>
           <div className="flex flex-col gap-3 relative z-10">
              <div className="flex justify-between items-center p-3 bg-black/40 rounded-xl border border-white/10">
                <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.1em] flex items-center gap-2"><Activity className="w-4 h-4 text-[#9d00ff]" /> GPU Acceleration</span>
                <span className="text-[9px] font-mono font-black text-[#00ff9d] bg-[#00ff9d]/10 px-2.5 py-1 rounded-md border border-[#00ff9d]/30 shadow-[0_0_10px_rgba(0,255,157,0.2)] tracking-widest">ENABLED (CUDA)</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-black/40 rounded-xl border border-white/10">
                <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.1em] flex items-center gap-2"><Network className="w-4 h-4 text-[#00e5ff]" /> Core Ensemble Model</span>
                <span className="text-[9px] font-mono font-black text-[#00e5ff] bg-[#00e5ff]/10 px-2.5 py-1 rounded-md border border-[#00e5ff]/30 shadow-[0_0_10px_rgba(0,229,255,0.2)] tracking-widest">v2.4.1 (Active)</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-black/40 rounded-xl border border-white/10">
                <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.1em] flex items-center gap-2"><Cloud className="w-4 h-4 text-emerald-400" /> Interpretability Layer</span>
                <span className="text-[9px] font-mono font-black text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/30 shadow-[0_0_10px_rgba(52,211,153,0.2)] tracking-widest">Grad-CAM 3D</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-black/40 rounded-xl border border-white/10">
                <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.1em] flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-400" /> Gen-AI CDSS Reporting
                </span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" checked={cdssEnabled} onChange={(e) => onToggleCdss(e.target.checked)} className="sr-only peer" />
                  <div className="w-9 h-5 bg-black border border-white/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#00e5ff] peer-checked:border-[#00e5ff] shadow-inner drop-shadow-[0_0_5px_rgba(0,229,255,0.4)]"></div>
                </label>
              </div>
           </div>
        </div>
      </div>
      
      <div className="mt-6 flex-shrink-0 bg-[#0f1522]/60 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.5)] p-6 relative overflow-hidden group">
         <div className="absolute top-0 right-0 w-32 h-32 bg-[#ff0055]/10 blur-[40px] group-hover:bg-[#ff0055]/20 transition-colors"></div>
         <div className="flex items-center gap-3 mb-6 border-b border-white/10 pb-3 relative z-10">
           <Palette className="w-5 h-5 text-[#ff0055]" />
           <h2 className="text-[11px] font-black text-white uppercase tracking-[0.2em]">Workspace Aesthetics & Theming</h2>
         </div>
         <div className="grid grid-cols-4 gap-4 relative z-10">
            {[
              { id: 'theme-radiology-dark', name: 'Deep Slate', icon: Moon, desc: 'Premium workspace dark mode', color: '#00e5ff' },
              { id: 'theme-clinical-light', name: 'Clinical Light', icon: Sun, desc: 'High contrast EMR style', color: '#ffaa00' },
              { id: 'theme-surgical-teal', name: 'Surgical Teal', icon: Monitor, desc: 'Calming OR environment', color: '#00ff9d' },
              { id: 'theme-amber-mono', name: 'Amber Mono', icon: Eye, desc: 'Low eye strain night shift', color: '#ffaa00' }
            ].map((theme) => (
              <button 
                key={theme.id}
                onClick={() => onSetTheme(theme.id)}
                className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-all duration-300 ${
                  activeTheme === theme.id 
                    ? `bg-black/60 border-[${theme.color}] shadow-[0_0_15px_rgba(0,0,0,0.5),inset_0_0_10px_1px_rgba(255,255,255,0.05)] scale-105` 
                    : 'bg-black/20 border-white/5 hover:bg-white/5'
                }`}
                style={{ borderColor: activeTheme === theme.id ? theme.color : undefined }}
              >
                <theme.icon className="w-6 h-6 mb-2" style={{ color: activeTheme === theme.id ? theme.color : '#64748b' }} />
                <span className={`text-[10px] font-black uppercase tracking-[0.2em] mb-1 ${activeTheme === theme.id ? 'text-white' : 'text-slate-500'}`}>{theme.name}</span>
                <span className="text-[8px] text-slate-500 text-center leading-tight uppercase font-bold tracking-widest">{theme.desc}</span>
              </button>
            ))}
         </div>
      </div>

      <div className="mt-6 flex-1 bg-[#0f1522]/60 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.5)] p-6 relative z-10">
        <div className="flex items-center gap-3 mb-6 border-b border-white/10 pb-3">
          <Shield className="w-5 h-5 text-[#ffaa00]" />
          <h2 className="text-[11px] font-black text-white uppercase tracking-[0.2em]">Account Security & Credentials</h2>
        </div>
        <div className="max-h-[300px] overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent pr-2">
          <SecuritySettingsTab userId="ST-ADMIN" />
        </div>
      </div>
    </div>
  </div>
);

const PatientProfilePage = ({ patientId, onBack }: { patientId: string, onBack: () => void }) => {
  const [details, setDetails] = useState<any>(null);

  useEffect(() => {
    axios.get(`http://127.0.0.1:8000/api/v1/patients/${patientId}`).then(res => setDetails(res.data)).catch(console.error);
  }, [patientId]);

  if (!details) return (
    <div className="flex-1 p-8 bg-[#030712] text-slate-300 flex items-center justify-center">
      <div className="animate-pulse flex flex-col items-center">
        <Activity className="w-10 h-10 text-blue-500 mb-4 animate-spin" />
        <p className="text-sm font-mono tracking-widest uppercase">Loading Patient Records...</p>
      </div>
    </div>
  );

  return (
    <div className="flex-1 p-8 bg-[#030712] text-slate-300 font-sans flex flex-col h-screen overflow-hidden animate-in fade-in duration-500">
      <div className="flex items-center gap-4 mb-8 border-b border-[#1e293b] pb-4">
        <button onClick={onBack} className="p-2 bg-gradient-to-b from-[#0a0f18]/60 to-[#060b15]/80 backdrop-blur-xl border border-white/10 hover:bg-[#1e293b]/50 text-slate-300 rounded transition-all shadow-lg hover:shadow-blue-500/20 group">
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
        </button>
        <div className="p-2 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded"><Activity className="w-6 h-6" /></div>
        <div>
          <h1 className="text-2xl font-bold text-slate-100 tracking-wide uppercase">Patient Record / <span className="text-blue-400">{details.pseudo_id.substring(0, 8)}...</span></h1>
          <p className="text-slate-400 text-sm">රෝගියාගේ අතීත වාර්තා සහ සම්පූර්ණ ඉතිහාසය (Full Medical History)</p>
        </div>
      </div>
      
      <div className="grid grid-cols-3 gap-6 flex-1 min-h-0">
         <div className="col-span-1 flex flex-col gap-6">
           <div className="bg-gradient-to-b from-[#0a0f18]/60 to-[#060b15]/80 backdrop-blur-xl border border-white/10 rounded-md shadow-lg p-6">
              <h2 className="text-sm font-bold text-slate-300 uppercase tracking-widest mb-4 border-b border-[#1e293b] pb-2 flex items-center gap-2">
                <FileText className="w-4 h-4 text-slate-400" /> Demographics
              </h2>
              <div className="space-y-4">
                 <div><span className="text-[10px] uppercase text-slate-500 block font-bold tracking-wider">Patient ID (Pseudo)</span><span className="font-mono text-blue-400 text-sm bg-blue-500/10 px-2 py-1 rounded inline-block mt-1 border border-blue-500/20">{details.pseudo_id}</span></div>
                 <div><span className="text-[10px] uppercase text-slate-500 block font-bold tracking-wider">Total Encounters</span><span className="text-slate-200 font-mono text-lg">{details.total_scans}</span></div>
                 <div><span className="text-[10px] uppercase text-slate-500 block font-bold tracking-wider">Last Encounter Date</span><span className="text-slate-300 text-xs font-mono">{new Date(details.last_scan).toLocaleString()}</span></div>
              </div>
           </div>
         </div>
         <div className="col-span-2 bg-gradient-to-b from-[#0a0f18]/60 to-[#060b15]/80 backdrop-blur-xl border border-white/10 rounded-md shadow-lg flex flex-col p-6 overflow-hidden">
            <h2 className="text-sm font-bold text-slate-300 uppercase tracking-widest mb-4 border-b border-[#1e293b] pb-2 flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400" /> Diagnostic Inference History
            </h2>
            <div className="flex-1 overflow-y-auto space-y-4 custom-scrollbar pr-2">
               {details.history.map((record: any) => (
                  <div key={record._id} className="bg-black/40 backdrop-blur-sm border border-[#1e293b] hover:border-[#2a364a] transition-colors p-5 rounded-md relative overflow-hidden group">
                     <div className="absolute top-0 left-0 w-1 h-full bg-slate-700 group-hover:bg-blue-500 transition-colors"></div>
                     <div className="flex justify-between items-center mb-4 border-b border-[#1e293b]/50 pb-3">
                        <span className="text-xs text-slate-400 font-mono flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                          {new Date(record.timestamp).toLocaleString()}
                        </span>
                        <span className={`text-[10px] px-3 py-1 rounded font-bold uppercase tracking-wider border ${record.recurrence_risk === 'HIGH' ? 'bg-rose-500/10 text-rose-400 border-rose-500/30' : record.recurrence_risk === 'MEDIUM' ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'}`}>
                           {record.recurrence_risk} RISK ({roundProb(record.probability)}%)
                        </span>
                     </div>
                     <div className="grid grid-cols-2 gap-6 text-xs mb-4">
                        <div className="bg-[#131826] rounded border border-[#1e293b] p-3 col-span-1">
                           <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest block mb-2 border-b border-[#1e293b] pb-1">Clinical Inputs</span>
                           <div className="grid grid-cols-2 gap-2 text-[10px]">
                             {Object.entries(record.clinical_inputs || {}).slice(0, 8).map(([k, v]) => (
                               <div key={k} className="flex flex-col">
                                 <span className="text-slate-500 truncate">{k.replace('_', ' ')}</span>
                                 <span className="text-slate-300 font-mono truncate">{String(v)}</span>
                               </div>
                             ))}
                           </div>
                        </div>
                        <div className="bg-[#131826] rounded border border-[#1e293b] p-3 col-span-1">
                           <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest block mb-2 border-b border-[#1e293b] pb-1">Key Drivers (SHAP)</span>
                           <div className="space-y-1">
                             {Object.entries(record.shap_weights || {})
                               .sort(([, a]: any, [, b]: any) => Math.abs(b) - Math.abs(a))
                               .slice(0, 4)
                               .map(([k, v]: [string, any]) => (
                               <div key={k} className="flex justify-between items-center text-[10px]">
                                 <span className="text-slate-400 truncate w-24">{k.replace('_', ' ')}</span>
                                 <div className="flex-1 mx-2 bg-black/40 backdrop-blur-sm h-1.5 rounded-full overflow-hidden">
                                    <div className={`h-full ${v > 0 ? 'bg-rose-500' : 'bg-blue-500'}`} style={{ width: `${Math.min(Math.abs(v)*20, 100)}%` }}></div>
                                 </div>
                                 <span className={`font-mono w-10 text-right ${v > 0 ? 'text-rose-400' : 'text-blue-400'}`}>{v > 0 ? '+' : ''}{v.toFixed(2)}</span>
                               </div>
                             ))}
                           </div>
                        </div>
                     </div>
                     {record.physician_notes && (
                       <div className="bg-[#131826] rounded border border-blue-500/30 p-4 mb-4 flex flex-col gap-1.5 shadow-inner">
                         <span className="text-[10px] text-blue-400 font-bold uppercase tracking-widest flex items-center gap-1.5 border-b border-[#1e293b] pb-1">
                           <FileText className="w-3.5 h-3.5" /> Attending Physician Clinical Evaluation
                         </span>
                         <p className="text-xs font-mono text-slate-200 mt-1 whitespace-pre-wrap leading-relaxed">{record.physician_notes}</p>
                       </div>
                     )}
                     <div className="bg-[#131826] rounded border border-[#1e293b] p-3 flex flex-col h-[400px]">
                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest block mb-2 border-b border-[#1e293b] pb-1 flex justify-between items-center">
                          <span>Archived Radiological Scan (MPR View)</span>
                          <span className="text-[8px] bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded">3D VOLUMETRIC</span>
                        </span>
                        <div className="flex-1 relative overflow-hidden rounded border border-[#1e293b]">
                           <MprClinicalWorkstation 
                             base64Matrix="MOCK"
                             dimensions={[32, 128, 128]}
                             tumorTarget={record.recurrence_risk === 'HIGH' ? { found: true, x: 65, y: 65, z: 15 } : undefined}
                             patientInfo={{ name: 'ARCHIVED PATIENT', id: details.pseudo_id.substring(0, 12) }}
                           />
                        </div>
                     </div>
                  </div>
               ))}
            </div>
         </div>
      </div>
    </div>
  );
};

function App() {
  const [activePage, setActivePage] = useState(() => {
    const saved = sessionStorage.getItem("hepatoai_active_page");
    return saved || "login";
  });
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(() => {
    const saved = sessionStorage.getItem("hepatoai_current_user");
    return saved ? JSON.parse(saved) : null;
  });
  
  const [cdssEnabled, setCdssEnabled] = useState(() => {
    const saved = localStorage.getItem("hepatoai_cdss_enabled");
    return saved !== null ? saved === 'true' : true;
  });

  const [activeTheme, setActiveTheme] = useState(() => {
    return localStorage.getItem("hepatoai_theme") || "theme-radiology-dark";
  });

  const [isRevoked, setIsRevoked] = useState(false);
  const [revokeCountdown, setRevokeCountdown] = useState(5);

  const handleToggleCdss = (val: boolean) => {
    setCdssEnabled(val);
    localStorage.setItem("hepatoai_cdss_enabled", val.toString());
  };

  const handleSetTheme = (theme: string) => {
    setActiveTheme(theme);
    localStorage.setItem("hepatoai_theme", theme);
  };

  useEffect(() => {
    sessionStorage.setItem("hepatoai_active_page", activePage);
  }, [activePage]);

  useEffect(() => {
    if (currentUser) {
      sessionStorage.setItem("hepatoai_current_user", JSON.stringify(currentUser));
    } else {
      sessionStorage.removeItem("hepatoai_current_user");
    }
  }, [currentUser]);

  // Session Auto-Timeout Mechanism (15 minutes)
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    const resetTimeout = () => {
      clearTimeout(timeoutId);
      if (currentUser) {
        timeoutId = setTimeout(() => {
          console.warn("Session expired due to inactivity.");
          setCurrentUser(null);
          setActivePage("login");
        }, 15 * 60 * 1000); // 15 mins
      }
    };

    if (currentUser) {
      window.addEventListener('mousemove', resetTimeout);
      window.addEventListener('keydown', resetTimeout);
      window.addEventListener('click', resetTimeout);
      window.addEventListener('scroll', resetTimeout);
      resetTimeout();
    }

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('mousemove', resetTimeout);
      window.removeEventListener('keydown', resetTimeout);
      window.removeEventListener('click', resetTimeout);
      window.removeEventListener('scroll', resetTimeout);
    };
  }, [currentUser]);

  // Real-time status check for auto-logout
  useEffect(() => {
    if (!currentUser || currentUser.level === 'IT Admin' || isRevoked) return;
    
    const checkStatus = async () => {
      try {
        const res = await axios.get(`http://127.0.0.1:8000/api/v1/users/${currentUser.id}/status`);
        if (res.data.status !== "Active") {
          console.warn("Account revoked or suspended.");
          setIsRevoked(true);
        }
      } catch (err) {
        console.error("Failed to check user status", err);
      }
    };
    
    const intervalId = setInterval(checkStatus, 3000);
    return () => clearInterval(intervalId);
  }, [currentUser, isRevoked]);

  useEffect(() => {
    if (!isRevoked) return;
    if (revokeCountdown <= 0) {
      setCurrentUser(null);
      setIsRevoked(false);
      setRevokeCountdown(5);
      setActivePage("login");
      return;
    }
    const timer = setTimeout(() => {
      setRevokeCountdown(prev => prev - 1);
    }, 1000);
    return () => clearTimeout(timer);
  }, [isRevoked, revokeCountdown]);

  const handlePatientClick = (id: string) => {
    setSelectedPatientId(id);
    setActivePage("patient_profile");
  };

  const renderPage = () => {
    switch (activePage) {
      case "dashboard": return <DashboardPage user={currentUser} onViewPatientDirectory={() => setActivePage("search")} onViewBilling={() => setActivePage("billing")} />;
      case "patient_profile": return selectedPatientId ? <PatientProfilePage patientId={selectedPatientId} onBack={() => setActivePage("dashboard")} /> : <DashboardPage user={currentUser} onViewPatientDirectory={() => setActivePage("search")} onViewBilling={() => setActivePage("billing")} />;
      case "search": return <PatientSearchPage onBack={() => setActivePage("dashboard")} />;
      case "billing": return <DoctorBillingPage user={currentUser} onBack={() => setActivePage("dashboard")} />;
      case "settings": return <SettingsPage cdssEnabled={cdssEnabled} onToggleCdss={handleToggleCdss} activeTheme={activeTheme} onSetTheme={handleSetTheme} />;
      case "support": return <DoctorMessages user={currentUser} />;
      case "attention": return <AttentionDashboard />;
      case "feature_extraction": return <FeatureExtractionStudio />;
      default: return null;
    }
  };

  if (activePage === "login") {
    return <LoginPage 
      onLogin={(user) => {
        if (user) setCurrentUser(user);
        setActivePage("activity");
      }} 
      onAdminLogin={() => setActivePage("admin_login")} 
    />;
  }

  if (activePage === "admin_login") {
    return <AdminLoginPage onLogin={() => setActivePage("admin")} onBack={() => setActivePage("login")} />;
  }

  if (activePage === "admin") {
    return <AdminDashboardPage onBack={() => setActivePage("login")} />;
  }

  // Protect all other routes: if no currentUser, force login
  if (!currentUser && activePage !== "login" && activePage !== "admin_login" && activePage !== "admin") {
    return (
      <div className="flex items-center justify-center h-screen bg-[#030712] text-white flex-col gap-4">
        <p>Your session has expired. Please log in again.</p>
        <button 
          onClick={() => setActivePage("login")}
          className="bg-blue-600 px-6 py-2 rounded font-bold"
        >
          Go to Login
        </button>
      </div>
    );
  }

  return (
    <>
      <style>{`
        .theme-clinical-light { filter: invert(1) hue-rotate(180deg) brightness(1.05) contrast(0.95); }
        .theme-clinical-light img, .theme-clinical-light canvas, .theme-clinical-light video { filter: invert(1) hue-rotate(180deg); }
        
        .theme-surgical-teal { filter: hue-rotate(-45deg) saturate(1.1); }
        
        .theme-amber-mono { filter: sepia(1) hue-rotate(-30deg) saturate(2) brightness(0.9); }
      `}</style>
      <div className={`flex flex-col h-screen bg-[#030712] text-slate-300 font-sans selection:bg-blue-500/30 overflow-hidden ${activeTheme}`}>
        <div className="flex flex-1 min-h-0 overflow-hidden">
        <Sidebar activePage={activePage} setActivePage={setActivePage} user={currentUser} onLogout={() => setCurrentUser(null)} />
        <div className="flex-1 overflow-auto bg-[#030712] relative">
          {/* PERSISTENT WORKSPACE ARCHITECTURE: Always mounted to preserve React state, File objects, and WebGL MPR context */}
          <div className={activePage === "activity" ? "block min-h-full w-full" : "hidden"}>
            <PredictPage onViewHistory={handlePatientClick} user={currentUser} cdssEnabled={cdssEnabled} />
          </div>
          <div className={activePage === "longitudinal" ? "block min-h-full w-full" : "hidden"}>
            <LongitudinalPredictPage onViewHistory={handlePatientClick} onSwitchToWorkspace={() => setActivePage("activity")} user={currentUser} cdssEnabled={cdssEnabled} />
          </div>
          {renderPage()}
        </div>
      </div>
      
      {/* Medical Footer (Bottom Status Bar) */}
      <div className="h-6 w-full bg-black/40 backdrop-blur-sm border-t border-[#1e293b] flex items-center justify-between px-4 text-[10px] text-slate-500 flex-shrink-0 z-50">
        <div className="font-mono">Version 2.4.1 Build 8092</div>
        <div className="font-mono uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
           HIPAA Compliant & FDA Cleared for Investigational Use Only
        </div>
        <div>© 2026 SLIIT Faculty of Computing - AI Labs. All rights reserved.</div>
      </div>
    </div>
      
      {isRevoked && (
        <div className="fixed inset-0 z-[9999] bg-black/90 backdrop-blur-xl flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-300">
          <ShieldAlert className="w-24 h-24 text-rose-500 mb-6 animate-pulse" />
          <h1 className="text-3xl font-black text-white uppercase tracking-widest mb-4">Account Suspended</h1>
          <p className="text-slate-300 text-lg max-w-md mb-8">
            Your account access has been revoked by an Administrator. You will be automatically logged out.
          </p>
          <div className="text-6xl font-mono font-black text-rose-500 mb-4">{revokeCountdown}</div>
          <p className="text-slate-500 font-mono text-sm uppercase tracking-[0.2em]">Seconds until logout</p>
        </div>
      )}
    </>
  );
}

export default App;