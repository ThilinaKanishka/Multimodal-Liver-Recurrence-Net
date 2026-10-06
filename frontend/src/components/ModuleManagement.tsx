import React, { useState, useEffect } from "react";
import axios from "axios";
import { CheckCircle, AlertTriangle, ShieldAlert, History, Activity, Clock, Split, LayoutDashboard, Layers, Cpu, Search, Database, Settings, MessageSquare } from "lucide-react";

interface Module {
  id: string;
  name: string;
  enabled: boolean;
  disabledReason: string | null;
  disabledAt: string | null;
}

interface AuditLog {
  id: string;
  module: string;
  action: string;
  user: string;
  timestamp: string;
  reason: string;
}

export const ModuleManagement: React.FC<{ theme: 'DARK' | 'LIGHT' }> = ({ theme }) => {
  const [modules, setModules] = useState<Module[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [showToggleModal, setShowToggleModal] = useState(false);
  const [selectedModule, setSelectedModule] = useState<Module | null>(null);
  const [toggleReason, setToggleReason] = useState("");
  const [isToggling, setIsToggling] = useState(false);

  const fetchModules = async () => {
    try {
      const res = await axios.get("http://127.0.0.1:8000/api/modules");
      setModules(res.data);
    } catch (err) {
      console.error("Failed to fetch modules", err);
    }
  };

  const fetchAuditLogs = async () => {
    try {
      const res = await axios.get("http://127.0.0.1:8000/api/modules/audit");
      setAuditLogs(res.data);
    } catch (err) {
      console.error("Failed to fetch module audit logs", err);
    }
  };

  useEffect(() => {
    const initFetch = async () => {
      setLoading(true);
      await fetchModules();
      await fetchAuditLogs();
      setLoading(false);
    };
    initFetch();
  }, []);

  const handleToggleClick = (mod: Module) => {
    setSelectedModule(mod);
    setToggleReason("");
    setShowToggleModal(true);
  };

  const executeToggle = async () => {
    if (!selectedModule) return;
    setIsToggling(true);
    try {
      await axios.post(`http://127.0.0.1:8000/api/modules/${selectedModule.id}/toggle`, {
        enabled: !selectedModule.enabled,
        reason: toggleReason || "Maintenance"
      });
      await fetchModules();
      await fetchAuditLogs();
      setShowToggleModal(false);
    } catch (err) {
      console.error("Failed to toggle module", err);
    } finally {
      setIsToggling(false);
    }
  };

  return (
    <div className="w-full bg-transparent animate-fade-in pb-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className={`text-2xl font-black uppercase tracking-widest flex items-center gap-3 ${theme === 'DARK' ? 'text-slate-100' : 'text-slate-900'}`}>
            Module Management
          </h1>
          <p className={`text-xs font-mono mt-1 ${theme === 'DARK' ? 'text-gray-400' : 'text-gray-500'}`}>
            Temporarily enable or disable specific clinical modules for doctors without permanent removal.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Module Statuses */}
        <div className={`border rounded-xl shadow-xl overflow-hidden transition-colors duration-300 flex flex-col ${theme === 'DARK' ? 'bg-[#252841] border-gray-700' : 'bg-white border-gray-200'}`}>
          <div className={`p-5 flex items-center justify-between border-b ${theme === 'DARK' ? 'border-gray-700 bg-[#1a1c2c]/50' : 'border-gray-200 bg-slate-50'}`}>
            <h2 className={`text-sm font-bold uppercase tracking-widest flex items-center gap-2 ${theme === 'DARK' ? 'text-slate-100' : 'text-slate-900'}`}>
              <Activity className="w-4 h-4 text-cyan-500" /> Clinical Modules
            </h2>
          </div>
          <div className="p-4 flex flex-col gap-4">
            {loading ? (
              <div className="text-center text-sm p-4 text-gray-500">Loading modules...</div>
            ) : modules.length === 0 ? (
              <div className="text-center text-sm p-4 text-gray-500">No modules found.</div>
            ) : (
              modules.map(mod => (
                <div 
                  key={mod.id} 
                  className={`border rounded-lg p-4 flex items-center justify-between transition-colors ${theme === 'DARK' ? 'border-gray-700 bg-[#1a1c2c]/60 hover:bg-[#1a1c2c]' : 'border-gray-200 bg-slate-50 hover:bg-slate-100'}`}
                  title={`${mod.id} | ${mod.enabled ? 'Enabled' : `Disabled by admin at ${new Date(mod.disabledAt || '').toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`}`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-lg ${theme === 'DARK' ? 'bg-[#131524]' : 'bg-white'} border ${theme === 'DARK' ? 'border-gray-700' : 'border-gray-200'} shadow-sm`}>
                      {(() => {
                        const iconProps = { className: "w-5 h-5 text-cyan-500" };
                        switch (mod.id) {
                          case 'workspace': return <Activity {...iconProps} />;
                          case 'compare': return <Split {...iconProps} />;
                          case 'dashboard': return <LayoutDashboard {...iconProps} />;
                          case 'attention': return <Layers {...iconProps} />;
                          case 'features': return <Cpu {...iconProps} />;
                          case 'patient-history': return <Search {...iconProps} />;
                          case 'workload-logs': return <Database {...iconProps} />;
                          case 'settings': return <Settings {...iconProps} />;
                          case 'it-support': return <MessageSquare {...iconProps} />;
                          default: return <Activity {...iconProps} />;
                        }
                      })()}
                    </div>
                    <div>
                      <h3 className={`font-bold text-sm ${theme === 'DARK' ? 'text-slate-200' : 'text-slate-800'}`}>{mod.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        {mod.enabled ? (
                          <span className="text-[10px] font-bold uppercase tracking-widest bg-emerald-500/10 text-emerald-500 border border-emerald-500/30 px-2 py-0.5 rounded flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" /> Active
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold uppercase tracking-widest bg-amber-500/10 text-amber-500 border border-amber-500/30 px-2 py-0.5 rounded flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" /> Paused
                          </span>
                        )}
                        {!mod.enabled && mod.disabledAt && (
                          <span className={`text-[10px] font-mono ${theme === 'DARK' ? 'text-gray-400' : 'text-gray-500'}`}>
                            Paused at: {new Date(mod.disabledAt).toLocaleString()}
                          </span>
                        )}
                      </div>
                      {!mod.enabled && mod.disabledReason && (
                        <p className={`text-[10px] mt-2 font-mono ${theme === 'DARK' ? 'text-amber-400/70' : 'text-amber-700'}`}>
                          Reason: {mod.disabledReason}
                        </p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleToggleClick(mod)}
                    className={`px-4 py-2 rounded text-xs font-bold uppercase tracking-wider transition-colors border shadow-sm ${
                      mod.enabled 
                        ? (theme === 'DARK' ? 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 border-amber-500/30' : 'bg-amber-50 hover:bg-amber-100 text-amber-600 border-amber-200')
                        : (theme === 'DARK' ? 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 border-emerald-500/30' : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border-emerald-200')
                    }`}
                  >
                    {mod.enabled ? 'Pause Module' : 'Resume Module'}
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Audit Logs */}
        <div className={`border rounded-xl shadow-xl overflow-hidden transition-colors duration-300 flex flex-col ${theme === 'DARK' ? 'bg-[#252841] border-gray-700' : 'bg-white border-gray-200'}`}>
          <div className={`p-5 flex items-center justify-between border-b ${theme === 'DARK' ? 'border-gray-700 bg-[#1a1c2c]/50' : 'border-gray-200 bg-slate-50'}`}>
            <h2 className={`text-sm font-bold uppercase tracking-widest flex items-center gap-2 ${theme === 'DARK' ? 'text-slate-100' : 'text-slate-900'}`}>
              <History className="w-4 h-4 text-purple-500" /> Module Audit Logs
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className={`border-b text-[10px] uppercase tracking-wider ${theme === 'DARK' ? 'border-gray-700 text-gray-400 bg-[#1a1c2c]' : 'border-gray-200 text-gray-600 bg-slate-100'}`}>
                  <th className="p-3 font-black">Timestamp</th>
                  <th className="p-3 font-black">Module</th>
                  <th className="p-3 font-black">Action</th>
                  <th className="p-3 font-black">User</th>
                  <th className="p-3 font-black">Reason</th>
                </tr>
              </thead>
              <tbody className={`text-xs font-mono divide-y ${theme === 'DARK' ? 'divide-gray-700/60' : 'divide-gray-200'}`}>
                {loading ? (
                  <tr>
                    <td colSpan={5} className="p-4 text-center text-gray-500">Loading...</td>
                  </tr>
                ) : auditLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-4 text-center text-gray-500">No audit logs found.</td>
                  </tr>
                ) : (
                  auditLogs.map((log) => (
                    <tr key={log.id} className={`transition-colors ${theme === 'DARK' ? 'hover:bg-[#1a1c2c]/40' : 'hover:bg-slate-50'}`}>
                      <td className={`p-3 ${theme === 'DARK' ? 'text-slate-400' : 'text-slate-500'}`}>
                         <span className="flex items-center gap-1.5"><Clock className="w-3 h-3" /> {new Date(log.timestamp).toLocaleString()}</span>
                      </td>
                      <td className={`p-3 font-bold ${theme === 'DARK' ? 'text-slate-200' : 'text-slate-800'}`}>{log.module}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          log.action === 'Disabled' 
                            ? (theme === 'DARK' ? 'bg-amber-500/20 text-amber-500' : 'bg-amber-100 text-amber-700')
                            : (theme === 'DARK' ? 'bg-emerald-500/20 text-emerald-500' : 'bg-emerald-100 text-emerald-700')
                        }`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="p-3 text-cyan-500 font-bold">{log.user}</td>
                      <td className={`p-3 ${theme === 'DARK' ? 'text-gray-400' : 'text-gray-600'}`}>{log.reason || '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Toggle Modal */}
      {showToggleModal && selectedModule && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className={`w-full max-w-md rounded-xl shadow-2xl overflow-hidden border ${theme === 'DARK' ? 'bg-[#1a1c2c] border-gray-700' : 'bg-white border-gray-200'}`}>
            <div className={`px-5 py-4 border-b flex items-center gap-3 ${theme === 'DARK' ? 'border-gray-800 bg-[#131524]' : 'border-gray-100 bg-slate-50'}`}>
              <ShieldAlert className="w-5 h-5 text-rose-500" />
              <h3 className={`text-sm font-bold uppercase tracking-widest ${theme === 'DARK' ? 'text-slate-100' : 'text-slate-900'}`}>
                {selectedModule.enabled ? `Disable Module: ${selectedModule.name}` : `Enable Module: ${selectedModule.name}`}
              </h3>
            </div>
            
            <div className="p-5">
              <p className={`text-sm mb-4 ${theme === 'DARK' ? 'text-gray-300' : 'text-gray-700'}`}>
                {selectedModule.enabled 
                  ? "Are you sure you want to pause this module? It will become temporarily unavailable for all clinical staff." 
                  : "Are you sure you want to enable this module? It will become available to all clinical staff again."}
              </p>

              {selectedModule.enabled && (
                <div className="mb-4">
                  <label className={`block text-xs font-bold uppercase tracking-widest mb-2 ${theme === 'DARK' ? 'text-gray-400' : 'text-gray-600'}`}>Reason for disabling</label>
                  <select 
                    value={toggleReason}
                    onChange={(e) => setToggleReason(e.target.value)}
                    className={`w-full p-2.5 rounded border text-sm focus:outline-none focus:ring-1 focus:ring-cyan-500 ${theme === 'DARK' ? 'bg-[#131524] border-gray-700 text-white' : 'bg-white border-gray-300 text-slate-800'}`}
                  >
                    <option value="">Select a reason...</option>
                    <option value="Routine Maintenance">Routine Maintenance</option>
                    <option value="Critical Bug/Issue">Critical Bug/Issue</option>
                    <option value="System Upgrade">System Upgrade</option>
                    <option value="Under Review">Under Review</option>
                  </select>
                </div>
              )}

              <div className="flex gap-3 mt-6">
                <button 
                  onClick={() => setShowToggleModal(false)}
                  className={`flex-1 py-2 rounded text-xs font-bold uppercase tracking-wider transition-colors border ${theme === 'DARK' ? 'bg-gray-800 hover:bg-gray-700 border-gray-700 text-white' : 'bg-gray-100 hover:bg-gray-200 border-gray-200 text-gray-800'}`}
                >
                  Cancel
                </button>
                <button 
                  onClick={executeToggle}
                  disabled={isToggling || (selectedModule.enabled && !toggleReason)}
                  className={`flex-1 py-2 rounded text-xs font-bold uppercase tracking-wider transition-colors shadow-sm disabled:opacity-50 ${
                    selectedModule.enabled 
                      ? 'bg-amber-600 hover:bg-amber-500 text-white' 
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                  }`}
                >
                  {isToggling ? 'Processing...' : 'Confirm'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
