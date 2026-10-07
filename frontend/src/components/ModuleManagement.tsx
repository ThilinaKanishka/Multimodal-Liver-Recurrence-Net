import React, { useState, useEffect } from "react";
import axios from "axios";
import { CheckCircle, AlertTriangle, ShieldAlert, History, Activity, Clock, Split, LayoutDashboard, Layers, Cpu, Search, Database, Settings, MessageSquare, Plus, Shield, Crown, Ban, X } from "lucide-react";

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
  const [viewMode, setViewMode] = useState<'MODULES' | 'ADMINS'>('MODULES');
  const [adminUsers, setAdminUsers] = useState<any[]>([]);
  const [showCreateAdminModal, setShowCreateAdminModal] = useState(false);
  const [newAdminForm, setNewAdminForm] = useState({ name: "", email: "admin@HepatoAI.com", role: "IT Admin", password: "" });
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

  const fetchAdmins = async () => {
    try {
      const res = await axios.get("http://127.0.0.1:8000/api/v1/admin/users");
      const admins = res.data.filter((u: any) => 
        u.level === "IT Admin" || u.level === "Super Admin" || u.role === "admin" || u.role === "super_admin"
      );
      setAdminUsers(admins);
    } catch (err) {
      console.error("Failed to fetch admins", err);
    }
  };

  useEffect(() => {
    const initFetch = async () => {
      setLoading(true);
      if (viewMode === 'MODULES') {
        await fetchModules();
        await fetchAuditLogs();
      } else {
        await fetchAdmins();
      }
      setLoading(false);
    };
    initFetch();
  }, [viewMode]);

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminForm.name || newAdminForm.name.length < 2) return alert("Name is required and must be at least 2 characters.");
    if (!newAdminForm.email || !newAdminForm.email.includes("@")) return alert("Valid email is required.");
    if (!newAdminForm.password || newAdminForm.password.length < 4) return alert("Password must be at least 4 characters.");
    
    try {
      const payload = {
        id: `AD-${Math.floor(1000 + Math.random() * 9000)}`,
        name: newAdminForm.name,
        email: newAdminForm.email,
        level: newAdminForm.role,
        dept: "IT Administration",
        status: "Active",
        password: newAdminForm.password,
        credentials: "Admin",
        license_number: "N/A"
      };
      await axios.post("http://127.0.0.1:8000/api/v1/admin/users", payload);
      setShowCreateAdminModal(false);
      setNewAdminForm({ name: "", email: "admin@HepatoAI.com", role: "IT Admin", password: "" });
      fetchAdmins();
    } catch (err) {
      console.error(err);
      alert("Failed to create admin");
    }
  };

  const toggleAdminStatus = async (adminId: string, currentStatus: string) => {
    if (adminId === 'ST-ADMIN') return; // Cannot update default super admin
    const newStatus = currentStatus === 'Active' ? 'Revoked' : 'Active';
    try {
      // We would ideally hit a dedicated backend endpoint to update admin status,
      // but for demonstration we can just re-fetch after a simulated API call
      // In a real scenario: await axios.patch(`http://127.0.0.1:8000/api/v1/admin/users/${adminId}`, { status: newStatus });
      alert(`Simulated updating admin ${adminId} to ${newStatus}`);
    } catch (err) {
      console.error(err);
    }
  };

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
            System Control Panel
          </h1>
          <p className={`text-xs font-mono mt-1 ${theme === 'DARK' ? 'text-gray-400' : 'text-gray-500'}`}>
            Manage Clinical Modules and Administrative Users
          </p>
        </div>
        
        <div className={`flex items-center rounded-lg p-1 border ${theme === 'DARK' ? 'bg-[#1a1c2c] border-gray-700' : 'bg-slate-100 border-gray-200'}`}>
          <button
            onClick={() => setViewMode('MODULES')}
            className={`px-4 py-2 rounded text-xs font-bold uppercase tracking-wider transition-colors ${
              viewMode === 'MODULES' 
                ? (theme === 'DARK' ? 'bg-[#252841] text-cyan-400 shadow' : 'bg-white text-cyan-600 shadow') 
                : (theme === 'DARK' ? 'text-gray-500 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700')
            }`}
          >
            Modules
          </button>
          <button
            onClick={() => setViewMode('ADMINS')}
            className={`px-4 py-2 rounded text-xs font-bold uppercase tracking-wider transition-colors ${
              viewMode === 'ADMINS' 
                ? (theme === 'DARK' ? 'bg-[#252841] text-amber-400 shadow' : 'bg-white text-amber-600 shadow') 
                : (theme === 'DARK' ? 'text-gray-500 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700')
            }`}
          >
            Admin Users
          </button>
        </div>
      </div>

      {viewMode === 'MODULES' ? (
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
      ) : (
        <div className="flex flex-col gap-6">
          <div className={`border rounded-xl shadow-xl p-6 flex flex-col transition-colors duration-300 ${theme === 'DARK' ? 'bg-[#252841] border-gray-700' : 'bg-white border-gray-200'}`}>
            <div className={`flex justify-between items-center mb-6 border-b pb-4 ${theme === 'DARK' ? 'border-gray-700' : 'border-gray-200'}`}>
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-amber-500" />
                <div>
                  <h2 className={`text-sm font-bold uppercase tracking-widest ${theme === 'DARK' ? 'text-slate-100' : 'text-slate-900'}`}>Admin Users</h2>
                  <p className={`text-[10px] font-mono mt-0.5 ${theme === 'DARK' ? 'text-gray-400' : 'text-gray-500'}`}>Manage admin credentials and permissions (Live MongoDB)</p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateAdminModal(true)}
                className="bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs uppercase tracking-wider px-4 py-2 rounded shadow-md transition-all flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                CREATE NEW ADMIN
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className={`border-b text-[11px] uppercase tracking-wider ${theme === 'DARK' ? 'border-gray-700 text-gray-400 bg-[#1a1c2c]/50' : 'border-gray-200 text-gray-600 bg-slate-50'}`}>
                    <th className="p-3 font-bold">Admin ID</th>
                    <th className="p-3 font-bold">Name</th>
                    <th className="p-3 font-bold">Email</th>
                    <th className="p-3 font-bold">Role Level</th>
                    <th className="p-3 font-bold">Status</th>
                    <th className="p-3 font-bold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className={`text-xs font-mono divide-y ${theme === 'DARK' ? 'divide-gray-700/60' : 'divide-gray-200'}`}>
                  {loading ? (
                    <tr><td colSpan={5} className="p-4 text-center">Loading admins...</td></tr>
                  ) : adminUsers.map(admin => (
                    <tr key={admin.id} className={`transition-colors ${theme === 'DARK' ? 'hover:bg-[#1a1c2c]/40' : 'hover:bg-slate-50'}`}>
                      <td className="p-3 text-amber-500 font-bold">{admin.id}</td>
                      <td className={`p-3 font-bold font-sans ${theme === 'DARK' ? 'text-slate-200' : 'text-slate-800'}`}>{admin.name}</td>
                      <td className={`p-3 ${theme === 'DARK' ? 'text-gray-400' : 'text-gray-600'}`}>{admin.email}</td>
                      <td className="p-3 font-sans">
                        {admin.level === 'Super Admin' || admin.level === 'super_admin' ? (
                          <div className="flex items-center gap-1.5 text-amber-500 w-max bg-amber-500/10 px-2 py-1 rounded font-bold">
                            <Crown className="w-3 h-3" /> SUPER ADMIN
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-blue-500 w-max bg-blue-500/10 px-2 py-1 rounded font-bold">
                            <Shield className="w-3 h-3" /> IT ADMIN
                          </div>
                        )}
                      </td>
                      <td className="p-3 font-sans">
                        {admin.status === 'Active' && <span className="text-emerald-500 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Active</span>}
                        {admin.status === 'Revoked' && <span className="text-rose-500 flex items-center gap-1"><Ban className="w-3 h-3" /> Revoked</span>}
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => toggleAdminStatus(admin.id, admin.status)}
                          disabled={admin.id === 'ST-ADMIN' || admin.level === 'Super Admin'}
                          className={`text-[10px] uppercase font-bold px-3 py-1 rounded transition-colors ${
                            admin.id === 'ST-ADMIN' || admin.level === 'Super Admin'
                              ? (theme === 'DARK' ? 'bg-gray-800 text-gray-500 cursor-not-allowed' : 'bg-gray-200 text-gray-400 cursor-not-allowed')
                              : (theme === 'DARK' ? 'bg-[#1a1c2c] hover:bg-gray-700 text-amber-500 border border-gray-700' : 'bg-white hover:bg-gray-100 text-amber-600 border border-gray-200')
                          }`}
                        >
                          Update
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          
          {/* Create New Admin Modal */}
          {showCreateAdminModal && (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
              <div className={`w-full max-w-md rounded-xl shadow-2xl border flex flex-col overflow-hidden ${theme === 'DARK' ? 'bg-[#131524] border-gray-700' : 'bg-white border-gray-200'}`}>
                <div className={`p-4 border-b flex items-center justify-between ${theme === 'DARK' ? 'bg-[#1a1c2c] border-gray-800' : 'bg-slate-50 border-gray-200'}`}>
                  <h2 className={`text-sm font-bold uppercase tracking-widest ${theme === 'DARK' ? 'text-slate-100' : 'text-slate-900'}`}>CREATE NEW ADMIN</h2>
                  <button onClick={() => setShowCreateAdminModal(false)} className={`p-1.5 rounded transition-colors ${theme === 'DARK' ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-slate-200 text-gray-600'}`}>
                    <X className="w-4 h-4" />
                  </button>
                </div>
                
                <form onSubmit={handleCreateAdmin} className="p-6 flex flex-col gap-4">
                  <div>
                    <label className={`block text-xs font-bold mb-1.5 ${theme === 'DARK' ? 'text-slate-300' : 'text-slate-700'}`}>Full Name:</label>
                    <input 
                      type="text" 
                      value={newAdminForm.name}
                      onChange={(e) => setNewAdminForm({...newAdminForm, name: e.target.value})}
                      className={`w-full px-3 py-2 rounded border text-sm focus:outline-none focus:ring-1 ${theme === 'DARK' ? 'bg-[#1a1c2c] border-gray-700 text-slate-200 focus:border-amber-500' : 'bg-white border-gray-300 text-slate-800 focus:border-amber-500'}`}
                      placeholder="e.g. John Silva"
                    />
                  </div>
                  
                  <div>
                    <label className={`block text-xs font-bold mb-1.5 ${theme === 'DARK' ? 'text-slate-300' : 'text-slate-700'}`}>Email Address:</label>
                    <input 
                      type="email" 
                      value={newAdminForm.email}
                      readOnly
                      className={`w-full px-3 py-2 rounded border text-sm opacity-70 cursor-not-allowed ${theme === 'DARK' ? 'bg-[#1a1c2c] border-gray-700 text-slate-200' : 'bg-gray-100 border-gray-300 text-slate-500'}`}
                    />
                  </div>
                  
                  <div>
                    <label className={`block text-xs font-bold mb-1.5 ${theme === 'DARK' ? 'text-slate-300' : 'text-slate-700'}`}>Password <span className="text-[10px] text-amber-500 font-normal">(Used to identify the Admin)</span>:</label>
                    <input 
                      type="password" 
                      value={newAdminForm.password}
                      onChange={(e) => setNewAdminForm({...newAdminForm, password: e.target.value})}
                      className={`w-full px-3 py-2 rounded border text-sm focus:outline-none focus:ring-1 ${theme === 'DARK' ? 'bg-[#1a1c2c] border-gray-700 text-slate-200 focus:border-amber-500' : 'bg-white border-gray-300 text-slate-800 focus:border-amber-500'}`}
                      placeholder="Enter a unique password"
                    />
                  </div>
                  
                  <div>
                    <label className={`block text-xs font-bold mb-1.5 ${theme === 'DARK' ? 'text-slate-300' : 'text-slate-700'}`}>Role Level:</label>
                    <select 
                      value={newAdminForm.role}
                      onChange={(e) => setNewAdminForm({...newAdminForm, role: e.target.value})}
                      className={`w-full px-3 py-2 rounded border text-sm focus:outline-none focus:ring-1 ${theme === 'DARK' ? 'bg-[#1a1c2c] border-gray-700 text-slate-200 focus:border-amber-500' : 'bg-white border-gray-300 text-slate-800 focus:border-amber-500'}`}
                    >
                      <option value="IT Admin">IT ADMIN</option>
                      <option value="Super Admin">SUPER ADMIN</option>
                    </select>
                  </div>
                  
                  <div className="flex items-center justify-end gap-3 mt-4 pt-4 border-t border-gray-200 dark:border-gray-800">
                    <button type="button" onClick={() => setShowCreateAdminModal(false)} className={`px-4 py-2 rounded text-xs font-bold uppercase transition-colors ${theme === 'DARK' ? 'text-gray-300 hover:bg-gray-800' : 'text-gray-600 hover:bg-gray-100'}`}>CANCEL</button>
                    <button type="submit" className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded text-xs font-bold uppercase transition-all">CREATE ADMIN</button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

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
