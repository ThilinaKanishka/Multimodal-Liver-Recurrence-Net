import React, { useState, useEffect } from "react";
import axios from "axios";
import { PredictPage } from "./pages/PredictPage";
import { LoginPage } from "./pages/LoginPage";
import { Sidebar } from "./components/Sidebar";
import MprClinicalWorkstation from "./components/MprClinicalWorkstation";

import { ArrowLeft, Activity, LayoutDashboard, Users, Database, Search, Settings, ShieldAlert, CheckCircle, FileText } from "lucide-react";

// Modern Placeholder Pages with medical workstation aesthetic
const DashboardPage = () => {
  const [stats, setStats] = useState<any>({ 
    total_scans: 0, 
    high_risk_detections: 0, 
    system_accuracy: "Loading...",
    risk_distribution: { high: 0, medium: 0, low: 0 },
    recent_alerts: []
  });

  useEffect(() => {
    axios.get("http://127.0.0.1:8000/api/v1/dashboard-stats").then(res => setStats(res.data)).catch(console.error);
  }, []);

  const totalRisks = stats.risk_distribution.high + stats.risk_distribution.medium + stats.risk_distribution.low;
  const highPct = totalRisks ? (stats.risk_distribution.high / totalRisks) * 100 : 0;
  const medPct = totalRisks ? (stats.risk_distribution.medium / totalRisks) * 100 : 0;
  const lowPct = totalRisks ? (stats.risk_distribution.low / totalRisks) * 100 : 0;

  return (
    <div className="flex-1 p-8 bg-[#070b14] text-slate-300 font-sans flex flex-col h-screen overflow-hidden">
      <div className="flex items-center gap-3 mb-8 border-b border-[#1e293b] pb-4">
        <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded"><LayoutDashboard className="w-6 h-6" /></div>
        <div>
          <h1 className="text-2xl font-bold text-slate-100 tracking-wide uppercase">System Dashboard</h1>
          <p className="text-slate-400 text-sm">රෝහලේ සමස්ත AI පද්ධතියේ ක්‍රියාකාරිත්වය සහ Analytics (Real-Time from MongoDB)</p>
        </div>
      </div>
      
      {/* Top Counters */}
      <div className="grid grid-cols-3 gap-6 mb-6">
        <div className="bg-[#131826] p-6 rounded-md border border-[#1e293b] shadow-lg flex flex-col justify-center items-center">
          <h3 className="text-slate-400 font-bold uppercase tracking-wider text-xs mb-2">Total Scans Analyzed</h3>
          <p className="text-4xl font-mono text-blue-400 font-bold drop-shadow-[0_0_10px_rgba(59,130,246,0.5)]">{stats.total_scans}</p>
        </div>
        <div className="bg-[#131826] p-6 rounded-md border border-[#1e293b] shadow-lg flex flex-col justify-center items-center">
          <h3 className="text-slate-400 font-bold uppercase tracking-wider text-xs mb-2">High Risk Detections</h3>
          <p className="text-4xl font-mono text-rose-400 font-bold drop-shadow-[0_0_10px_rgba(244,63,94,0.5)]">{stats.high_risk_detections}</p>
        </div>
        <div className="bg-[#131826] p-6 rounded-md border border-[#1e293b] shadow-lg flex flex-col justify-center items-center">
          <h3 className="text-slate-400 font-bold uppercase tracking-wider text-xs mb-2">System Accuracy Status</h3>
          <p className="text-4xl font-mono text-emerald-400 font-bold drop-shadow-[0_0_10px_rgba(16,185,129,0.5)]">{stats.system_accuracy}</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6 flex-1 min-h-0">
        {/* Left Col: Risk Distribution Chart */}
        <div className="col-span-2 bg-[#131826] border border-[#1e293b] rounded-md shadow-lg p-6 flex flex-col">
          <div className="flex items-center gap-2 mb-6 border-b border-[#1e293b] pb-2">
            <Activity className="w-5 h-5 text-indigo-400" />
            <h2 className="text-sm font-bold text-slate-300 uppercase tracking-widest">Risk Distribution Overview</h2>
          </div>
          
          <div className="flex-1 flex flex-col justify-center gap-6 px-4">
            <div>
              <div className="flex justify-between text-xs font-bold uppercase tracking-wider mb-2">
                <span className="text-rose-400">High Risk Detections</span>
                <span className="text-slate-300 font-mono">{stats.risk_distribution.high} ({highPct.toFixed(1)}%)</span>
              </div>
              <div className="w-full bg-[#0a0e17] h-4 rounded-full overflow-hidden border border-[#1e293b]">
                <div className="bg-rose-500 h-full rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(244,63,94,0.6)]" style={{ width: `${highPct}%` }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold uppercase tracking-wider mb-2">
                <span className="text-amber-400">Medium Risk Detections</span>
                <span className="text-slate-300 font-mono">{stats.risk_distribution.medium} ({medPct.toFixed(1)}%)</span>
              </div>
              <div className="w-full bg-[#0a0e17] h-4 rounded-full overflow-hidden border border-[#1e293b]">
                <div className="bg-amber-500 h-full rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(245,158,11,0.6)]" style={{ width: `${medPct}%` }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold uppercase tracking-wider mb-2">
                <span className="text-emerald-400">Low Risk Detections</span>
                <span className="text-slate-300 font-mono">{stats.risk_distribution.low} ({lowPct.toFixed(1)}%)</span>
              </div>
              <div className="w-full bg-[#0a0e17] h-4 rounded-full overflow-hidden border border-[#1e293b]">
                <div className="bg-emerald-500 h-full rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(16,185,129,0.6)]" style={{ width: `${lowPct}%` }}></div>
              </div>
            </div>
            <p className="text-center mt-4 text-[10px] text-slate-500 uppercase tracking-widest border-t border-[#1e293b] pt-4">Data automatically synchronized with Clinical Ledger</p>
          </div>
        </div>

        {/* Right Col: Critical Alerts */}
        <div className="col-span-1 bg-[#131826] border border-[#1e293b] rounded-md shadow-lg p-6 flex flex-col overflow-hidden">
          <div className="flex items-center gap-2 mb-4 border-b border-[#1e293b] pb-2 text-rose-400">
            <ShieldAlert className="w-5 h-5 animate-pulse" />
            <h2 className="text-sm font-bold uppercase tracking-widest">Critical Alerts</h2>
          </div>
          
          <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
            {stats.recent_alerts.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-500 flex-col">
                <CheckCircle className="w-10 h-10 mb-2 opacity-30 text-emerald-500" />
                <p className="text-xs uppercase tracking-widest font-bold">No Active High Risk Cases</p>
              </div>
            ) : (
              stats.recent_alerts.map((alert: any) => (
                <div key={alert._id} className="bg-rose-950/20 border border-rose-900/50 p-3 rounded-md hover:bg-rose-900/30 transition-colors cursor-pointer">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] font-bold uppercase text-slate-400">Patient ID</span>
                    <span className="text-[10px] bg-rose-500/20 text-rose-400 px-2 py-0.5 rounded font-mono font-bold">HIGH RISK ({roundProb(alert.probability)}%)</span>
                  </div>
                  <p className="font-mono text-xs text-blue-400 truncate mb-2">{alert.pseudo_anonymous_id}</p>
                  <p className="text-[9px] text-slate-500 uppercase">{new Date(alert.timestamp).toLocaleString()}</p>
                </div>
              ))
            )}
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
                 <div key={log._id} className="bg-[#131826] border border-[#1e293b] p-3 rounded flex justify-between items-center">
                    <div>
                       <p className="text-xs font-mono text-blue-400 mb-1">ID: {log.inference_id}</p>
                       <p className="text-[10px] text-slate-500">{new Date(log.timestamp).toLocaleString()}</p>
                    </div>
                    <div className={`px-2 py-1 rounded text-xs font-bold tracking-wider ${log.recurrence_risk === 'HIGH' ? 'bg-rose-500/20 text-rose-400' : log.recurrence_risk === 'MEDIUM' ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                      {log.recurrence_risk} RISK
                    </div>
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
  const [activePage, setActivePage] = useState("login");
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);

  const handlePatientClick = (id: string) => {
    setSelectedPatientId(id);
    setActivePage("patient_profile");
  };

  const renderPage = () => {
    switch (activePage) {
      case "login": return <LoginPage onLogin={() => setActivePage("activity")} />;
      case "activity": return <PredictPage onViewHistory={handlePatientClick} />;
      case "dashboard": return <DashboardPage />;
      case "users": return <UsersPage onPatientClick={handlePatientClick} />;
      case "patient_profile": return selectedPatientId ? <PatientProfilePage patientId={selectedPatientId} onBack={() => setActivePage("users")} /> : <UsersPage onPatientClick={handlePatientClick} />;
      case "database": return <DatabasePage />;
      case "search": return <SearchPage />;
      case "settings": return <SettingsPage />;
      default: return <PredictPage onViewHistory={handlePatientClick} />;
    }
  };

  if (activePage === "login") {
    return <LoginPage onLogin={() => setActivePage("activity")} />;
  }

  return (
    <div className="flex flex-col h-screen bg-[#070b14] text-slate-300 font-sans selection:bg-blue-500/30 overflow-hidden">
      <div className="flex flex-1 min-h-0 overflow-hidden">
        <Sidebar activePage={activePage} setActivePage={setActivePage} />
        <div className="flex-1 overflow-auto bg-[#070b14] relative">
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