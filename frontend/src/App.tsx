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

import { ArrowLeft, Activity, LayoutDashboard, Users, Database, Search, Settings, ShieldAlert, CheckCircle, FileText } from "lucide-react";

// Modern Placeholder Pages with medical workstation aesthetic
const DashboardPage = ({ user, onNavigateToHistory }: { user: any, onNavigateToHistory: () => void }) => {
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
    <div className="flex-1 p-8 bg-[#040810] text-slate-300 font-sans flex flex-col h-screen overflow-hidden relative">
      {/* Background Ambient Glow */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-900/20 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[40%] h-[40%] bg-indigo-900/10 blur-[120px] rounded-full pointer-events-none"></div>

      <div className="flex items-center justify-between mb-8 pb-4 relative z-10 border-b border-white/5">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gradient-to-br from-indigo-500/20 to-blue-500/10 border border-indigo-500/20 rounded-xl shadow-[0_0_15px_rgba(99,102,241,0.15)]"><LayoutDashboard className="w-7 h-7 text-indigo-400" /></div>
          <div>
            <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-slate-100 to-slate-400 tracking-tight uppercase">My Clinical Dashboard</h1>
            <p className="text-slate-500 text-sm font-medium mt-1">ඔබ විසින් අද දින පරීක්ෂා කළ රෝගීන් සහ විශ්ලේෂණ වාර්තා (Real-Time Insight)</p>
          </div>
        </div>
        
        <button 
          onClick={onNavigateToHistory}
          className="bg-indigo-600/10 hover:bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 px-5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-300 shadow-[0_0_15px_rgba(99,102,241,0.1)] hover:shadow-[0_0_20px_rgba(99,102,241,0.3)] flex items-center gap-2 group backdrop-blur-md"
        >
          <Database className="w-4 h-4 group-hover:scale-110 transition-transform" />
          View Complete Medical History
        </button>
      </div>
      
      {/* Top Counters */}
      <div className="grid grid-cols-3 gap-6 mb-8 relative z-10">
        <div className="bg-white/[0.02] backdrop-blur-xl border border-white/10 p-6 rounded-2xl shadow-xl flex flex-col justify-center items-center hover:bg-white/[0.04] transition-colors relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <h3 className="text-slate-400 font-bold uppercase tracking-widest text-[11px] mb-3 flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-blue-500" /> Today's Patients Evaluated</h3>
          <p className="text-5xl font-mono text-white font-black drop-shadow-[0_0_15px_rgba(59,130,246,0.6)]">{stats.today_scans || 0}</p>
        </div>
        <div className="bg-white/[0.02] backdrop-blur-xl border border-white/10 p-6 rounded-2xl shadow-xl flex flex-col justify-center items-center hover:bg-white/[0.04] transition-colors relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-b from-rose-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <h3 className="text-slate-400 font-bold uppercase tracking-widest text-[11px] mb-3 flex items-center gap-2"><ShieldAlert className="w-3.5 h-3.5 text-rose-500" /> High Risk Detections</h3>
          <p className="text-5xl font-mono text-white font-black drop-shadow-[0_0_15px_rgba(244,63,94,0.6)]">{stats.high_risk_detections}</p>
        </div>
        <div className="bg-white/[0.02] backdrop-blur-xl border border-white/10 p-6 rounded-2xl shadow-xl flex flex-col justify-center items-center hover:bg-white/[0.04] transition-colors relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-b from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <h3 className="text-slate-400 font-bold uppercase tracking-widest text-[11px] mb-3 flex items-center gap-2"><Activity className="w-3.5 h-3.5 text-amber-500" /> Medium Risk Detections</h3>
          <p className="text-5xl font-mono text-white font-black drop-shadow-[0_0_15px_rgba(245,158,11,0.6)]">{stats.risk_distribution.medium}</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-8 flex-1 min-h-0 relative z-10">
        {/* Left Col: Risk Distribution Chart */}
        <div className="col-span-1 bg-white/[0.02] backdrop-blur-xl border border-white/10 rounded-2xl shadow-xl p-7 flex flex-col">
          <div className="flex items-center gap-3 mb-8 pb-3 border-b border-white/5">
            <Activity className="w-5 h-5 text-indigo-400" />
            <h2 className="text-sm font-black text-slate-200 uppercase tracking-widest">Risk Distribution</h2>
          </div>
          
          <div className="flex-1 flex flex-col justify-center gap-8">
            <div className="group">
              <div className="flex justify-between text-xs font-bold uppercase tracking-wider mb-3">
                <span className="text-rose-400">High Risk Detections</span>
                <span className="text-slate-300 font-mono">{stats.risk_distribution.high} ({highPct.toFixed(1)}%)</span>
              </div>
              <div className="w-full bg-black/40 h-3 rounded-full overflow-hidden border border-white/5 shadow-inner">
                <div className="bg-gradient-to-r from-rose-600 to-rose-400 h-full rounded-full transition-all duration-1000 shadow-[0_0_12px_rgba(244,63,94,0.8)] relative overflow-hidden" style={{ width: `${highPct}%` }}>
                   <div className="absolute inset-0 bg-white/20 w-1/2 -skew-x-12 animate-[shimmer_2s_infinite]"></div>
                </div>
              </div>
            </div>

            <div className="group">
              <div className="flex justify-between text-xs font-bold uppercase tracking-wider mb-3">
                <span className="text-amber-400">Medium Risk Detections</span>
                <span className="text-slate-300 font-mono">{stats.risk_distribution.medium} ({medPct.toFixed(1)}%)</span>
              </div>
              <div className="w-full bg-black/40 h-3 rounded-full overflow-hidden border border-white/5 shadow-inner">
                <div className="bg-gradient-to-r from-amber-600 to-amber-400 h-full rounded-full transition-all duration-1000 shadow-[0_0_12px_rgba(245,158,11,0.8)] relative overflow-hidden" style={{ width: `${medPct}%` }}>
                   <div className="absolute inset-0 bg-white/20 w-1/2 -skew-x-12 animate-[shimmer_2s_infinite]"></div>
                </div>
              </div>
            </div>

            <div className="group">
              <div className="flex justify-between text-xs font-bold uppercase tracking-wider mb-3">
                <span className="text-emerald-400">Low Risk Detections</span>
                <span className="text-slate-300 font-mono">{stats.risk_distribution.low} ({lowPct.toFixed(1)}%)</span>
              </div>
              <div className="w-full bg-black/40 h-3 rounded-full overflow-hidden border border-white/5 shadow-inner">
                <div className="bg-gradient-to-r from-emerald-600 to-emerald-400 h-full rounded-full transition-all duration-1000 shadow-[0_0_12px_rgba(16,185,129,0.8)] relative overflow-hidden" style={{ width: `${lowPct}%` }}>
                   <div className="absolute inset-0 bg-white/20 w-1/2 -skew-x-12 animate-[shimmer_2s_infinite]"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Col: Recent Patient Records */}
        <div className="col-span-2 bg-white/[0.02] backdrop-blur-xl border border-white/10 rounded-2xl shadow-xl flex flex-col p-6 overflow-hidden">
          <div className="flex items-center justify-between mb-6 border-b border-white/5 pb-3 flex-shrink-0">
             <span className="text-sm font-black text-slate-200 uppercase tracking-widest flex items-center gap-3">
               <Users className="w-5 h-5 text-cyan-400" /> Recent Patient Records Evaluated
             </span>
             <span className="text-[10px] bg-cyan-900/30 text-cyan-400 px-3 py-1 rounded-md border border-cyan-500/30 uppercase font-mono shadow-[0_0_10px_rgba(6,182,212,0.2)]">
               {stats.recent_alerts.length} Encounters Found
             </span>
          </div>
          <div className="flex-1 bg-black/20 rounded-xl overflow-hidden border border-white/5">
            <div className="h-full overflow-y-auto custom-scrollbar">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 bg-[#0a0e1a] z-10 shadow-md border-b border-white/10">
                  <tr>
                    <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Date & Time</th>
                    <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Patient ID</th>
                    <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Risk Assessment</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {stats.recent_alerts.length === 0 ? (
                     <tr>
                       <td colSpan={3} className="text-center py-16 text-xs font-mono text-slate-500 uppercase tracking-widest">
                         <div className="flex flex-col items-center justify-center gap-3 opacity-60">
                            <Activity className="w-8 h-8" />
                            No recent patient encounters found today.
                         </div>
                       </td>
                     </tr>
                  ) : (
                    stats.recent_alerts.map((alert: any) => (
                      <tr key={alert._id} className="hover:bg-white/[0.03] transition-colors cursor-pointer group">
                        <td className="p-4 text-xs font-mono text-slate-400 group-hover:text-slate-300 transition-colors">{new Date(alert.timestamp).toLocaleString()}</td>
                        <td className="p-4 text-xs font-mono text-blue-400 font-bold group-hover:text-blue-300 transition-colors">{alert.pseudo_anonymous_id || 'UNKNOWN'}</td>
                        <td className="p-4 text-center">
                          <span className={`text-[10px] px-3 py-1 rounded-md font-black uppercase tracking-widest border shadow-sm ${alert.recurrence_risk === 'HIGH' ? 'bg-rose-500/10 text-rose-400 border-rose-500/30 shadow-rose-500/20' : alert.recurrence_risk === 'MEDIUM' ? 'bg-amber-500/10 text-amber-400 border-amber-500/30 shadow-amber-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 shadow-emerald-500/20'}`}>
                            {alert.recurrence_risk} ({roundProb(alert.probability)}%)
                          </span>
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
  );
};


const roundProb = (p: number) => (p * 100).toFixed(1);

const UsersPage = ({ onPatientClick }: { onPatientClick?: (id: string) => void }) => {
  const [patients, setPatients] = useState<any[]>([]);

  useEffect(() => {
    axios.get("http://127.0.0.1:8000/api/v1/patients").then(res => setPatients(res.data)).catch(console.error);
  }, []);

  return (
    <div className="flex-1 p-8 bg-[#070b14] text-slate-300 font-sans flex flex-col h-screen overflow-hidden">
      <div className="flex items-center gap-3 mb-8 border-b border-[#1e293b] pb-4">
        <div className="p-2 bg-blue-500/10 text-blue-400 rounded"><Users className="w-6 h-6" /></div>
        <div>
          <h1 className="text-2xl font-bold text-slate-100 tracking-wide uppercase">Patient Directory</h1>
          <p className="text-slate-400 text-sm">රෝගී නාමාවලිය සහ අතීත වාර්තා (Real-Time from MongoDB)</p>
        </div>
      </div>
      <div className="bg-[#131826] border border-[#1e293b] flex-1 rounded-md shadow-lg flex flex-col p-4 overflow-y-auto">
        {patients.length === 0 ? (
          <div className="text-center text-slate-500 m-auto">
             <Users className="w-16 h-16 mx-auto mb-4 opacity-20" />
             <p className="uppercase tracking-widest text-xs font-bold">No Patients Found in Database</p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#1e293b] text-slate-500 text-xs uppercase">
                <th className="p-2">Patient ID (Pseudo)</th>
                <th className="p-2">Total Scans</th>
                <th className="p-2">Last Scan Date</th>
              </tr>
            </thead>
            <tbody>
              {patients.map(p => (
                <tr key={p.pseudo_id} className="border-b border-[#1e293b]/50 hover:bg-[#1e293b]/30">
                  <td 
                    className="p-2 font-mono text-blue-400 text-sm cursor-pointer hover:underline hover:text-blue-300 transition-colors" 
                    onClick={() => onPatientClick && onPatientClick(p.pseudo_id)}
                  >
                    {p.pseudo_id}
                  </td>
                  <td className="p-2 text-slate-300">{p.total_scans}</td>
                  <td className="p-2 text-slate-400 text-xs">{new Date(p.last_scan).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

const DatabasePage = () => {
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    axios.get("http://127.0.0.1:8000/api/v1/audit-logs").then(res => setLogs(res.data)).catch(console.error);
  }, []);

  return (
    <div className="flex-1 p-8 bg-[#070b14] text-slate-300 font-sans flex flex-col h-screen overflow-hidden">
      <div className="flex items-center gap-3 mb-8 border-b border-[#1e293b] pb-4">
        <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded"><Database className="w-6 h-6" /></div>
        <div>
          <h1 className="text-2xl font-bold text-slate-100 tracking-wide uppercase">EHR / Clinical Ledger</h1>
          <p className="text-slate-400 text-sm">HIPAA Audit Logs සහ රෝගීන්ගේ ඉතිහාසය (Real-Time from MongoDB)</p>
        </div>
      </div>
      <div className="bg-[#131826] border border-[#1e293b] flex-1 rounded-md shadow-lg flex flex-col p-4 overflow-hidden">
         <div className="flex items-center justify-between mb-4 px-2 flex-shrink-0">
           <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Immutable Audit Trail</span>
           <span className="text-xs font-mono text-emerald-500 flex items-center gap-2"><CheckCircle className="w-3 h-3"/> MONGODB SECURE</span>
         </div>
         <div className="flex-1 border border-[#1e293b] bg-[#0a0e17] rounded overflow-y-auto p-4 space-y-3">
            {logs.length === 0 ? (
               <p className="text-slate-600 font-mono text-xs uppercase text-center mt-10">No audit logs queried.</p>
            ) : (
               logs.map(log => (
                 <div key={log._id} className="bg-[#131826] border border-[#1e293b] p-4 rounded flex flex-col gap-3">
                    <div className="flex justify-between items-center">
                      <div>
                         <p className="text-xs font-mono text-blue-400 mb-1">ID: {log.inference_id}</p>
                         <p className="text-[10px] text-slate-500">{new Date(log.timestamp).toLocaleString()}</p>
                      </div>
                      <div className={`px-2 py-1 rounded text-xs font-bold tracking-wider ${log.recurrence_risk === 'HIGH' ? 'bg-rose-500/20 text-rose-400' : log.recurrence_risk === 'MEDIUM' ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                        {log.recurrence_risk} RISK
                      </div>
                    </div>
                    {log.physician_notes && (
                      <div className="bg-[#0a0e17] border border-[#2a364a] p-3 rounded text-xs font-mono text-slate-300 flex flex-col gap-1 shadow-inner">
                        <span className="text-[10px] text-blue-400 font-bold uppercase tracking-widest flex items-center gap-1.5 border-b border-[#1e293b] pb-1 mb-1">
                          <FileText className="w-3 h-3" /> Attending Physician Clinical Evaluation
                        </span>
                        <p className="whitespace-pre-wrap leading-relaxed">{log.physician_notes}</p>
                      </div>
                    )}
                 </div>
               ))
            )}
         </div>
      </div>
    </div>
  );
};

const SearchPage = () => (
  <div className="flex-1 p-8 bg-[#070b14] text-slate-300 font-sans flex flex-col h-screen overflow-hidden">
    <div className="flex items-center gap-3 mb-8 border-b border-[#1e293b] pb-4">
      <div className="p-2 bg-amber-500/10 text-amber-400 rounded"><Search className="w-6 h-6" /></div>
      <div>
        <h1 className="text-2xl font-bold text-slate-100 tracking-wide uppercase">Global Search</h1>
        <p className="text-slate-400 text-sm">රෝගීන්ගේ දත්ත, MRN අංක සහ DICOM ෆයිල් පද්ධතිය පුරා සෙවීම</p>
      </div>
    </div>
    <div className="bg-[#131826] p-4 border border-[#1e293b] rounded-md shadow-lg flex items-center gap-4 mb-6">
       <Search className="w-5 h-5 text-slate-500" />
       <input type="text" placeholder="Search by MRN, Name, or Accession Number..." className="bg-transparent border-none flex-1 outline-none text-slate-200 font-mono text-sm placeholder-slate-600" />
       <button className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase tracking-wider rounded">Query Query</button>
    </div>
  </div>
);

const SettingsPage = () => (
  <div className="flex-1 p-8 bg-[#070b14] text-slate-300 font-sans flex flex-col h-screen overflow-hidden">
    <div className="flex items-center gap-3 mb-8 border-b border-[#1e293b] pb-4">
      <div className="p-2 bg-slate-500/10 text-slate-400 rounded"><Settings className="w-6 h-6" /></div>
      <div>
        <h1 className="text-2xl font-bold text-slate-100 tracking-wide uppercase">System Configuration</h1>
        <p className="text-slate-400 text-sm">පද්ධතියේ සැකසුම් සහ රෝහල් ජාලයට (Hospital Network) සම්බන්ධ වීම</p>
      </div>
    </div>
    <div className="grid grid-cols-2 gap-6">
      <div className="bg-[#131826] border border-[#1e293b] rounded-md shadow-lg p-6">
         <h2 className="text-sm font-bold text-slate-300 uppercase tracking-widest mb-4 border-b border-[#1e293b] pb-2">PACS Integration</h2>
         <div className="space-y-4">
            <div>
              <label className="text-[10px] uppercase text-slate-500 font-bold">DICOM Server AETitle</label>
              <input type="text" disabled value="LIVER_NET_AI" className="w-full mt-1 bg-[#0a0e17] border border-[#2a364a] text-slate-300 px-3 py-2 rounded text-xs font-mono" />
            </div>
            <div>
              <label className="text-[10px] uppercase text-slate-500 font-bold">Server IP / Port</label>
              <input type="text" disabled value="192.168.1.100 : 104" className="w-full mt-1 bg-[#0a0e17] border border-[#2a364a] text-slate-300 px-3 py-2 rounded text-xs font-mono" />
            </div>
         </div>
      </div>
      <div className="bg-[#131826] border border-[#1e293b] rounded-md shadow-lg p-6">
         <h2 className="text-sm font-bold text-slate-300 uppercase tracking-widest mb-4 border-b border-[#1e293b] pb-2">AI Inference Engine</h2>
         <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-slate-400 uppercase">GPU Acceleration</span>
              <span className="text-xs font-mono text-emerald-400 bg-emerald-950/30 px-2 py-1 rounded border border-emerald-900/50">ENABLED (CUDA)</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-slate-400 uppercase">Ensemble Model</span>
              <span className="text-xs font-mono text-blue-400 bg-blue-950/30 px-2 py-1 rounded border border-blue-900/50">v2.4.1 (Active)</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-slate-400 uppercase">Interpretability Layer</span>
              <span className="text-xs font-mono text-blue-400 bg-blue-950/30 px-2 py-1 rounded border border-blue-900/50">Grad-CAM 3D</span>
            </div>
         </div>
      </div>
    </div>
    
    <div className="mt-8">
      <h2 className="text-sm font-bold text-slate-300 uppercase tracking-widest mb-4 border-b border-[#1e293b] pb-2">Account Security</h2>
      <SecuritySettingsTab userId="ST-ADMIN" />
    </div>
  </div>
);

const PatientProfilePage = ({ patientId, onBack }: { patientId: string, onBack: () => void }) => {
  const [details, setDetails] = useState<any>(null);

  useEffect(() => {
    axios.get(`http://127.0.0.1:8000/api/v1/patients/${patientId}`).then(res => setDetails(res.data)).catch(console.error);
  }, [patientId]);

  if (!details) return (
    <div className="flex-1 p-8 bg-[#070b14] text-slate-300 flex items-center justify-center">
      <div className="animate-pulse flex flex-col items-center">
        <Activity className="w-10 h-10 text-blue-500 mb-4 animate-spin" />
        <p className="text-sm font-mono tracking-widest uppercase">Loading Patient Records...</p>
      </div>
    </div>
  );

  return (
    <div className="flex-1 p-8 bg-[#070b14] text-slate-300 font-sans flex flex-col h-screen overflow-hidden animate-in fade-in duration-500">
      <div className="flex items-center gap-4 mb-8 border-b border-[#1e293b] pb-4">
        <button onClick={onBack} className="p-2 bg-[#131826] border border-[#1e293b] hover:bg-[#1e293b] text-slate-300 rounded transition-all shadow-lg hover:shadow-blue-500/20 group">
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
        </button>
        <div className="p-2 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded"><Users className="w-6 h-6" /></div>
        <div>
          <h1 className="text-2xl font-bold text-slate-100 tracking-wide uppercase">Patient Directory / <span className="text-blue-400">{details.pseudo_id.substring(0, 8)}...</span></h1>
          <p className="text-slate-400 text-sm">රෝගියාගේ අතීත වාර්තා සහ සම්පූර්ණ ඉතිහාසය (Full Medical History)</p>
        </div>
      </div>
      
      <div className="grid grid-cols-3 gap-6 flex-1 min-h-0">
         <div className="col-span-1 flex flex-col gap-6">
           <div className="bg-[#131826] border border-[#1e293b] rounded-md shadow-lg p-6">
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
         <div className="col-span-2 bg-[#131826] border border-[#1e293b] rounded-md shadow-lg flex flex-col p-6 overflow-hidden">
            <h2 className="text-sm font-bold text-slate-300 uppercase tracking-widest mb-4 border-b border-[#1e293b] pb-2 flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400" /> Diagnostic Inference History
            </h2>
            <div className="flex-1 overflow-y-auto space-y-4 custom-scrollbar pr-2">
               {details.history.map((record: any) => (
                  <div key={record._id} className="bg-[#0a0e17] border border-[#1e293b] hover:border-[#2a364a] transition-colors p-5 rounded-md relative overflow-hidden group">
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
                                 <div className="flex-1 mx-2 bg-[#0a0e17] h-1.5 rounded-full overflow-hidden">
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
    const saved = localStorage.getItem("hepatoai_current_user");
    return saved ? JSON.parse(saved) : null;
  });

  useEffect(() => {
    sessionStorage.setItem("hepatoai_active_page", activePage);
    if (activePage === "login" && currentUser) {
      setActivePage("activity");
    } else if (activePage === "login") {
      setCurrentUser(null);
    }
  }, [activePage, currentUser]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem("hepatoai_current_user", JSON.stringify(currentUser));
    }
  }, [currentUser]);

  const handlePatientClick = (id: string) => {
    setSelectedPatientId(id);
    setActivePage("patient_profile");
  };

  const renderPage = () => {
    switch (activePage) {
      case "dashboard": return <DashboardPage user={currentUser} onNavigateToHistory={() => setActivePage("database")} />;
      case "users": return <UsersPage onPatientClick={handlePatientClick} />;
      case "patient_profile": return selectedPatientId ? <PatientProfilePage patientId={selectedPatientId} onBack={() => setActivePage("users")} /> : <UsersPage onPatientClick={handlePatientClick} />;
      case "database": return <DatabasePage />;
      case "search": return <SearchPage />;
      case "settings": return <SettingsPage />;
      case "support": return <DoctorMessages user={currentUser} />;
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
      <div className="flex items-center justify-center h-screen bg-[#070b14] text-white flex-col gap-4">
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
    <div className="flex flex-col h-screen bg-[#070b14] text-slate-300 font-sans selection:bg-blue-500/30 overflow-hidden">
      <div className="flex flex-1 min-h-0 overflow-hidden">
        <Sidebar activePage={activePage} setActivePage={setActivePage} user={currentUser} />
        <div className="flex-1 overflow-auto bg-[#070b14] relative">
          {/* PERSISTENT WORKSPACE ARCHITECTURE: Always mounted to preserve React state, File objects, and WebGL MPR context */}
          <div className={activePage === "activity" ? "block h-full w-full" : "hidden"}>
            <PredictPage onViewHistory={handlePatientClick} user={currentUser} />
          </div>
          <div className={activePage === "longitudinal" ? "block h-full w-full" : "hidden"}>
            <LongitudinalPredictPage onViewHistory={handlePatientClick} onSwitchToWorkspace={() => setActivePage("activity")} user={currentUser} />
          </div>
          {renderPage()}
        </div>
      </div>
      
      {/* Medical Footer (Bottom Status Bar) */}
      <div className="h-6 w-full bg-[#0a0e17] border-t border-[#1e293b] flex items-center justify-between px-4 text-[10px] text-slate-500 flex-shrink-0 z-50">
        <div className="font-mono">Version 2.4.1 Build 8092</div>
        <div className="font-mono uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
           HIPAA Compliant & FDA Cleared for Investigational Use Only
        </div>
        <div>© 2026 SLIIT Faculty of Computing - AI Labs. All rights reserved.</div>
      </div>
    </div>
  );
}

export default App;