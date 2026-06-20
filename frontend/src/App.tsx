import React, { useState, useEffect } from "react";
import axios from "axios";
import { PredictPage } from "./pages/PredictPage";
import { Sidebar } from "./components/Sidebar";

import { Activity, LayoutDashboard, Users, Database, Search, Settings, ShieldAlert, CheckCircle, FileText } from "lucide-react";

// Modern Placeholder Pages with medical workstation aesthetic
const DashboardPage = () => {
  const [stats, setStats] = useState({ total_scans: 0, high_risk_detections: 0, system_accuracy: "Loading..." });

  useEffect(() => {
    axios.get("http://127.0.0.1:8000/api/v1/dashboard-stats").then(res => setStats(res.data)).catch(console.error);
  }, []);

  return (
    <div className="flex-1 p-8 bg-[#070b14] text-slate-300 font-sans flex flex-col h-screen overflow-hidden">
      <div className="flex items-center gap-3 mb-8 border-b border-[#1e293b] pb-4">
        <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded"><LayoutDashboard className="w-6 h-6" /></div>
        <div>
          <h1 className="text-2xl font-bold text-slate-100 tracking-wide uppercase">System Dashboard</h1>
          <p className="text-slate-400 text-sm">රෝහලේ සමස්ත AI පද්ධතියේ ක්‍රියාකාරිත්වය සහ Analytics (Real-Time from MongoDB)</p>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-6">
        <div className="bg-[#131826] p-6 rounded-md border border-[#1e293b] shadow-lg">
          <h3 className="text-slate-400 font-bold uppercase tracking-wider text-xs mb-2">Total Scans Analyzed</h3>
          <p className="text-3xl font-mono text-blue-400">{stats.total_scans}</p>
        </div>
        <div className="bg-[#131826] p-6 rounded-md border border-[#1e293b] shadow-lg">
          <h3 className="text-slate-400 font-bold uppercase tracking-wider text-xs mb-2">High Risk Detections</h3>
          <p className="text-3xl font-mono text-rose-400">{stats.high_risk_detections}</p>
        </div>
        <div className="bg-[#131826] p-6 rounded-md border border-[#1e293b] shadow-lg">
          <h3 className="text-slate-400 font-bold uppercase tracking-wider text-xs mb-2">System Accuracy Status</h3>
          <p className="text-3xl font-mono text-emerald-400">{stats.system_accuracy}</p>
        </div>
      </div>
      <div className="mt-8 bg-[#131826] border border-[#1e293b] flex-1 rounded-md shadow-lg flex items-center justify-center">
        <div className="text-center text-slate-500">
           <LayoutDashboard className="w-16 h-16 mx-auto mb-4 opacity-20" />
           <p className="uppercase tracking-widest text-xs font-bold">More Analytics Coming Soon</p>
        </div>
      </div>
    </div>
  );
};

const UsersPage = () => {
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
                  <td className="p-2 font-mono text-blue-400 text-sm">{p.pseudo_id}</td>
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

function App() {
  const [activePage, setActivePage] = useState("activity");

  const renderPage = () => {
    switch (activePage) {
      case "activity": return <PredictPage />;
      case "dashboard": return <DashboardPage />;
      case "users": return <UsersPage />;
      case "database": return <DatabasePage />;
      case "search": return <SearchPage />;
      case "settings": return <SettingsPage />;
      default: return <PredictPage />;
    }
  };

  return (
    <div className="flex min-h-screen bg-[#070b14] text-slate-300 font-sans selection:bg-blue-500/30">
      <Sidebar activePage={activePage} setActivePage={setActivePage} />
      {renderPage()}
    </div>
  );
}

export default App;
