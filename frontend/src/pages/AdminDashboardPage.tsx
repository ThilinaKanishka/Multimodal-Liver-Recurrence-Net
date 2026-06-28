import React, { useState, useEffect } from "react";
import axios from "axios";
import { Server, Database, Activity, Users, ShieldAlert, Plus, Lock, RefreshCw, ArrowLeft, X, CheckCircle, Shield, Mail, Phone, Stethoscope, Award, FileText, Edit2, Ban, Trash2, LayoutDashboard, Settings, LogOut, Hexagon, AlertTriangle, UserCheck, Sun, Moon, Eye, User, Calendar, Building2 } from "lucide-react";

export const AdminDashboardPage: React.FC<{ onBack?: () => void }> = ({ onBack }) => {
  // Tab Navigation State
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'USER_ACCESS' | 'HIPAA_AUDITS' | 'SYSTEM_CONFIG'>('OVERVIEW');
  // Theme Toggle State
  const [theme, setTheme] = useState<'DARK' | 'LIGHT'>('DARK');

  const [users, setUsers] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [stats, setStats] = useState({
    ai_server_status: "Python API: ONLINE",
    api_latency: "42ms",
    database_status: "MongoDB: Secure",
    storage_usage: "78% Capacity",
    scans_processed_today: 0,
    total_users: 0,
    active_users: 0
  });

  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [viewingUser, setViewingUser] = useState<any | null>(null);
  
  // Custom Pop-up Confirmation Modal State (No window.confirm alert)
  const [confirmAction, setConfirmAction] = useState<{
    type: 'revoke' | 'reactivate' | 'delete';
    userId: string;
    userName: string;
  } | null>(null);
  const [executingConfirm, setExecutingConfirm] = useState(false);

  // Real-world Enterprise Hospital Physician Credentialing State
  const [formData, setFormData] = useState({
    id: `ST-${Math.floor(1000 + Math.random() * 9000)}`,
    name: "",
    credentials: "MD, FRCR",
    license_number: "SLMC-74920",
    dept: "Radiology",
    level: "Consultant",
    subspecialty: "Diagnostic Volumetric MPR",
    email: "",
    phone: "+94 76 622 7387",
    extension: "Ext. 2100",
    status: "Active",
    mfa_required: true,
    password: ""
  });
  const [submitting, setSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const fetchAdminData = () => {
    setLoading(true);
    Promise.all([
      axios.get("http://127.0.0.1:8000/api/v1/admin/stats"),
      axios.get("http://127.0.0.1:8000/api/v1/admin/users"),
      axios.get("http://127.0.0.1:8000/api/v1/admin/audit-logs")
    ]).then(([statsRes, usersRes, logsRes]) => {
      setStats(statsRes.data);
      setUsers(usersRes.data);
      setLogs(logsRes.data);
      setLoading(false);
    }).catch(err => {
      console.error("Admin Fetch Error:", err);
      setLoading(false);
    });
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleAddNewClick = () => {
    setIsEditMode(false);
    setEditingUserId(null);
    setFormData({
      id: `ST-${Math.floor(1000 + Math.random() * 9000)}`,
      name: "",
      credentials: "MD, FRCR",
      license_number: "SLMC-74920",
      dept: "Radiology",
      level: "Consultant",
      subspecialty: "Diagnostic Volumetric MPR",
      email: "",
      phone: "+94 76 622 7387",
      extension: "Ext. 2100",
      status: "Active",
      mfa_required: true,
      password: ""
    });
    setShowModal(true);
  };

  const handleEditClick = (u: any) => {
    setIsEditMode(true);
    setEditingUserId(u.id);
    setFormData({
      id: u.id || `ST-${Math.floor(1000 + Math.random() * 9000)}`,
      name: u.name || "",
      credentials: u.credentials || "MD",
      license_number: u.license_number || "SLMC-74920",
      dept: u.dept || "Radiology",
      level: u.level || "Consultant",
      subspecialty: u.subspecialty || "General",
      email: u.email || "",
      phone: u.phone || "+94 76 622 7387",
      extension: u.extension || "Ext. 1000",
      status: u.status || "Active",
      mfa_required: u.mfa_required !== false,
      password: "" // Keep blank unless updating
    });
    setShowModal(true);
  };

  const handleConfirmActionExecute = () => {
    if (!confirmAction) return;
    setExecutingConfirm(true);

    let request;
    if (confirmAction.type === 'revoke') {
      request = axios.patch(`http://127.0.0.1:8000/api/v1/admin/users/${confirmAction.userId}/revoke`);
    } else if (confirmAction.type === 'reactivate') {
      request = axios.patch(`http://127.0.0.1:8000/api/v1/admin/users/${confirmAction.userId}/reactivate`);
    } else {
      request = axios.delete(`http://127.0.0.1:8000/api/v1/admin/users/${confirmAction.userId}`);
    }

    request
      .then(() => {
        setExecutingConfirm(false);
        setConfirmAction(null);
        fetchAdminData();
      })
      .catch(err => {
        console.error("Action Execution Error:", err);
        setExecutingConfirm(false);
        setConfirmAction(null);
      });
  };

  const handleProvisionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    
    const requestPromise = isEditMode && editingUserId
      ? axios.put(`http://127.0.0.1:8000/api/v1/admin/users/${editingUserId}`, formData)
      : axios.post("http://127.0.0.1:8000/api/provision-doctor", formData);

    requestPromise
      .then(res => {
        setSubmitting(false);
        setShowModal(false);
        if (!isEditMode) {
          setToastMessage("Doctor Provisioned & Credentials Emailed Successfully");
          setTimeout(() => setToastMessage(null), 4000);
        }
        setIsEditMode(false);
        setEditingUserId(null);
        setFormData({
          id: `ST-${Math.floor(1000 + Math.random() * 9000)}`,
          name: "",
          credentials: "MD, FRCR",
          license_number: "SLMC-74920",
          dept: "Radiology",
          level: "Consultant",
          subspecialty: "Diagnostic Volumetric MPR",
          email: "",
          phone: "+94 76 622 7387",
          extension: "Ext. 2100",
          status: "Active",
          mfa_required: true,
          password: ""
        });
        fetchAdminData(); // Live reload data
      })
      .catch(err => {
        console.error("Provision/Update Error:", err);
        setSubmitting(false);
      });
  };

  return (
    <div className={`flex h-screen overflow-hidden font-sans transition-colors duration-300 ${theme === 'DARK' ? 'bg-[#1a1c2c] text-slate-200' : 'bg-slate-100 text-slate-800'}`}>
      
      {/* FIXED LEFT ADMIN SIDEBAR */}
      <div className={`w-64 border-r flex flex-col justify-between flex-shrink-0 h-full shadow-2xl z-20 transition-colors duration-300 ${theme === 'DARK' ? 'bg-[#131524] border-gray-800' : 'bg-white border-gray-200'}`}>
        
        {/* Brand/Logo Section */}
        <div className={`p-6 border-b transition-colors duration-300 ${theme === 'DARK' ? 'border-gray-800/80 bg-[#131524]' : 'border-gray-100 bg-white'}`}>
          <div className="flex items-center gap-3">
            <div className="bg-cyan-500/20 p-1.5 rounded-lg border border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.4)] flex-shrink-0">
              <Hexagon className="w-6 h-6 text-cyan-500" />
            </div>
            <div className="flex flex-col">
              <span className={`text-xl font-bold tracking-widest uppercase ${theme === 'DARK' ? 'text-slate-100' : 'text-slate-900'}`}>
                Hepato<span className="text-cyan-500">AI</span>
              </span>
              <span className="text-[10px] font-mono bg-rose-500/20 text-rose-400 border border-rose-500/30 px-2 py-0.5 rounded font-bold tracking-widest w-max mt-1">
                IT ADMIN CONSOLE
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Links (Admin Specific) */}
        <div className="flex-1 px-4 py-6 space-y-2 overflow-y-auto custom-scrollbar">
          <button 
            onClick={() => setActiveTab('OVERVIEW')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-r-lg font-sans font-bold text-xs uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'OVERVIEW' 
                ? 'bg-gradient-to-r from-cyan-600/20 to-blue-600/10 border-l-4 border-cyan-500 text-cyan-500 shadow-sm' 
                : theme === 'DARK' ? 'text-gray-400 hover:bg-[#1a1c2c]/60 hover:text-slate-200' : 'text-gray-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <LayoutDashboard className={`w-4 h-4 flex-shrink-0 ${activeTab === 'OVERVIEW' ? 'text-cyan-500' : theme === 'DARK' ? 'text-gray-400' : 'text-gray-500'}`} />
            Overview
          </button>

          <button 
            onClick={() => setActiveTab('USER_ACCESS')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-r-lg font-sans font-bold text-xs uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'USER_ACCESS' 
                ? 'bg-gradient-to-r from-cyan-600/20 to-blue-600/10 border-l-4 border-cyan-500 text-cyan-500 shadow-sm' 
                : theme === 'DARK' ? 'text-gray-400 hover:bg-[#1a1c2c]/60 hover:text-slate-200' : 'text-gray-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <Users className={`w-4 h-4 flex-shrink-0 ${activeTab === 'USER_ACCESS' ? 'text-cyan-500' : theme === 'DARK' ? 'text-gray-400' : 'text-gray-500'}`} />
            User Access
          </button>

          <button 
            onClick={() => setActiveTab('HIPAA_AUDITS')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-r-lg font-sans font-bold text-xs uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'HIPAA_AUDITS' 
                ? 'bg-gradient-to-r from-cyan-600/20 to-blue-600/10 border-l-4 border-cyan-500 text-cyan-500 shadow-sm' 
                : theme === 'DARK' ? 'text-gray-400 hover:bg-[#1a1c2c]/60 hover:text-slate-200' : 'text-gray-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <ShieldAlert className={`w-4 h-4 flex-shrink-0 ${activeTab === 'HIPAA_AUDITS' ? 'text-cyan-500' : theme === 'DARK' ? 'text-gray-400' : 'text-gray-500'}`} />
            HIPAA Audits
          </button>

          <button 
            onClick={() => setActiveTab('SYSTEM_CONFIG')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-r-lg font-sans font-bold text-xs uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'SYSTEM_CONFIG' 
                ? 'bg-gradient-to-r from-cyan-600/20 to-blue-600/10 border-l-4 border-cyan-500 text-cyan-500 shadow-sm' 
                : theme === 'DARK' ? 'text-gray-400 hover:bg-[#1a1c2c]/60 hover:text-slate-200' : 'text-gray-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <Settings className={`w-4 h-4 flex-shrink-0 ${activeTab === 'SYSTEM_CONFIG' ? 'text-cyan-500' : theme === 'DARK' ? 'text-gray-400' : 'text-gray-500'}`} />
            System Config
          </button>
        </div>

        {/* Bottom Action */}
        <div className={`p-4 border-t transition-colors duration-300 ${theme === 'DARK' ? 'border-gray-800/80 bg-[#131524]' : 'border-gray-100 bg-white'}`}>
          <button 
            onClick={onBack} 
            className={`w-full flex items-center justify-center gap-2 px-4 py-3 border rounded-lg font-mono text-xs uppercase font-bold tracking-wider transition-all cursor-pointer shadow-md group ${
              theme === 'DARK' 
                ? 'bg-[#1a1c2c] border-gray-700 hover:bg-rose-950/40 hover:border-rose-800 text-gray-300 hover:text-rose-200' 
                : 'bg-slate-50 border-gray-200 hover:bg-rose-50 hover:border-rose-200 text-gray-700 hover:text-rose-600'
            }`}
          >
            <LogOut className="w-4 h-4 text-rose-500 group-hover:-translate-x-0.5 transition-transform" />
            Exit Console
          </button>
        </div>
      </div>

      {/* RIGHT SIDE MAIN DASHBOARD CONTENT */}
      <div className={`flex-1 p-8 font-sans flex flex-col h-full overflow-y-auto custom-scrollbar relative z-10 transition-colors duration-300 ${theme === 'DARK' ? 'bg-[#1a1c2c] text-slate-200' : 'bg-slate-100 text-slate-800'}`}>
        
        {/* Tailwind Success Toast / Alert */}
        {toastMessage && (
          <div className="mb-6 flex items-center gap-3 bg-emerald-500 text-white px-4 py-3 rounded-lg shadow-lg text-sm font-semibold animate-bounce">
            <CheckCircle className="w-5 h-5 flex-shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Top Header Section */}
        <div className={`flex items-center justify-between mb-8 border-b pb-4 transition-colors duration-300 ${theme === 'DARK' ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex items-center gap-4">
            <div className="p-2.5 bg-rose-500/10 border border-rose-500/30 text-rose-500 rounded shadow-inner">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <h1 className={`text-2xl font-bold tracking-wide uppercase flex items-center gap-2 ${theme === 'DARK' ? 'text-slate-100' : 'text-slate-900'}`}>
                Hospital IT Admin Console
                <span className="text-[10px] font-mono bg-rose-500/20 text-rose-500 border border-rose-500/40 px-2 py-0.5 rounded font-bold tracking-widest">
                  MISSION CONTROL
                </span>
              </h1>
              <p className={`text-xs font-mono mt-0.5 ${theme === 'DARK' ? 'text-gray-400' : 'text-gray-500'}`}>Secure System Health, Enterprise Credentialing & Real-Time HIPAA Audit Engine</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* THEME TOGGLE BUTTON */}
            <button
              onClick={() => setTheme(theme === 'DARK' ? 'LIGHT' : 'DARK')}
              className={`flex items-center gap-2 px-3 py-1.5 border rounded text-xs font-mono shadow-sm transition-all cursor-pointer ${
                theme === 'DARK'
                  ? 'bg-[#252841] border-gray-700 hover:bg-gray-700 text-amber-300'
                  : 'bg-white border-gray-300 hover:bg-gray-100 text-amber-600'
              }`}
              title="Toggle Theme (Dark / Light Mode)"
            >
              {theme === 'DARK' ? (
                <>
                  <Sun className="w-3.5 h-3.5 text-amber-400 animate-spin-slow" />
                  <span>Light Mode</span>
                </>
              ) : (
                <>
                  <Moon className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Dark Mode</span>
                </>
              )}
            </button>

            <button 
              onClick={fetchAdminData}
              className={`flex items-center gap-2 px-3 py-1.5 border rounded text-xs font-mono shadow-sm transition-all cursor-pointer ${
                theme === 'DARK' 
                  ? 'bg-[#252841] border-gray-700 hover:bg-gray-700 text-gray-300' 
                  : 'bg-white border-gray-300 hover:bg-gray-100 text-gray-700'
              }`}
            >
              <RefreshCw className={`w-3.5 h-3.5 text-cyan-500 ${loading ? 'animate-spin' : ''}`} />
              <span>{loading ? "Syncing..." : "Live Sync Active"}</span>
            </button>
          </div>
        </div>

        {/* TAB 1: OVERVIEW TAB */}
        {activeTab === 'OVERVIEW' && (
          <>
            {/* A. Top Stat Cards (System Health 🧠) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {/* AI Server Status */}
              <div className={`border p-5 rounded-lg shadow-md flex flex-col justify-between relative overflow-hidden transition-colors duration-300 ${theme === 'DARK' ? 'bg-[#252841] border-gray-700' : 'bg-white border-gray-200'}`}>
                <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500"></div>
                <div className="flex justify-between items-start mb-2">
                  <span className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${theme === 'DARK' ? 'text-gray-400' : 'text-gray-500'}`}>
                    <Server className="w-4 h-4 text-emerald-500" /> AI Server Status
                  </span>
                  <span className="text-[10px] font-mono bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded flex items-center gap-1.5 font-bold">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                    ONLINE
                  </span>
                </div>
                <div className="flex items-baseline justify-between mt-2">
                  <span className={`text-lg font-mono font-bold ${theme === 'DARK' ? 'text-slate-100' : 'text-slate-900'}`}>{stats.ai_server_status}</span>
                  <div className="text-right">
                    <span className={`text-[10px] block uppercase font-mono ${theme === 'DARK' ? 'text-gray-400' : 'text-gray-500'}`}>API Latency</span>
                    <span className="text-xl font-mono font-bold text-cyan-500">{stats.api_latency}</span>
                  </div>
                </div>
              </div>

              {/* Database Status */}
              <div className={`border p-5 rounded-lg shadow-md flex flex-col justify-between relative overflow-hidden transition-colors duration-300 ${theme === 'DARK' ? 'bg-[#252841] border-gray-700' : 'bg-white border-gray-200'}`}>
                <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
                <div className="flex justify-between items-start mb-2">
                  <span className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${theme === 'DARK' ? 'text-gray-400' : 'text-gray-500'}`}>
                    <Database className="w-4 h-4 text-blue-500" /> Database Status
                  </span>
                  <span className="text-[10px] font-mono bg-blue-500/10 border border-blue-500/30 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded font-bold flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" /> Secure
                  </span>
                </div>
                <div className="flex items-baseline justify-between mt-2">
                  <span className={`text-lg font-mono font-bold ${theme === 'DARK' ? 'text-slate-100' : 'text-slate-900'}`}>{stats.database_status}</span>
                  <div className="text-right">
                    <span className={`text-[10px] block uppercase font-mono ${theme === 'DARK' ? 'text-gray-400' : 'text-gray-500'}`}>Storage Usage</span>
                    <span className="text-xl font-mono font-bold text-blue-500">{stats.storage_usage}</span>
                  </div>
                </div>
              </div>

              {/* Processing Stats */}
              <div className={`border p-5 rounded-lg shadow-md flex flex-col justify-between relative overflow-hidden transition-colors duration-300 ${theme === 'DARK' ? 'bg-[#252841] border-gray-700' : 'bg-white border-gray-200'}`}>
                <div className="absolute top-0 left-0 w-1 h-full bg-purple-500"></div>
                <div className="flex justify-between items-start mb-2">
                  <span className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${theme === 'DARK' ? 'text-gray-400' : 'text-gray-500'}`}>
                    <Activity className="w-4 h-4 text-purple-500" /> Processing Stats
                  </span>
                  <span className="text-[10px] font-mono bg-purple-500/10 border border-purple-500/30 text-purple-600 dark:text-purple-400 px-2 py-0.5 rounded font-bold">
                    Real-Time
                  </span>
                </div>
                <div className="flex items-baseline justify-between mt-2">
                  <span className={`text-lg font-mono font-bold ${theme === 'DARK' ? 'text-slate-100' : 'text-slate-900'}`}>Scans Processed Today</span>
                  <span className="text-3xl font-mono font-bold text-purple-500">{stats.scans_processed_today}</span>
                </div>
              </div>
            </div>

            {/* Real-Time HIPAA Access Logs (Directly on Overview) */}
            <div className={`border rounded-lg shadow-md p-6 flex flex-col mb-4 transition-colors duration-300 ${theme === 'DARK' ? 'bg-[#252841] border-gray-700' : 'bg-white border-gray-200'}`}>
              <div className={`flex justify-between items-center mb-6 border-b pb-3 ${theme === 'DARK' ? 'border-gray-700' : 'border-gray-200'}`}>
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-rose-500" />
                  <div>
                    <h2 className={`text-sm font-bold uppercase tracking-widest ${theme === 'DARK' ? 'text-slate-100' : 'text-slate-900'}`}>Real-Time HIPAA Access Logs</h2>
                    <p className={`text-[10px] font-mono mt-0.5 ${theme === 'DARK' ? 'text-gray-400' : 'text-gray-500'}`}>Immutable audit trail synchronized with MongoDB</p>
                  </div>
                </div>
                <span className="text-xs font-mono text-rose-500 bg-rose-500/10 border border-rose-500/30 px-3 py-1 rounded flex items-center gap-1.5 font-bold">
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
                  IMMUTABLE SECURITY LEDGER
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className={`border-b text-xs uppercase tracking-wider ${theme === 'DARK' ? 'border-gray-700 text-gray-400 bg-[#1a1c2c]/50' : 'border-gray-200 text-gray-600 bg-slate-50'}`}>
                      <th className="p-3 font-bold">Timestamp</th>
                      <th className="p-3 font-bold">Staff ID</th>
                      <th className="p-3 font-bold">Action</th>
                      <th className="p-3 font-bold">IP Address</th>
                      <th className="p-3 font-bold">Severity</th>
                    </tr>
                  </thead>
                  <tbody className={`text-xs font-mono divide-y ${theme === 'DARK' ? 'divide-gray-700/60' : 'divide-gray-200'}`}>
                    {logs.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-gray-500 font-sans">
                          No audit logs recorded in MongoDB yet. Actions will be captured here in real-time.
                        </td>
                      </tr>
                    ) : (
                      logs.map((log) => (
                        <tr 
                          key={log._id || log.id} 
                          className={`transition-colors ${
                            log.suspicious 
                              ? 'bg-rose-500/10 border-l-4 border-rose-500 hover:bg-rose-500/20' 
                              : theme === 'DARK' ? 'hover:bg-[#1a1c2c]/40' : 'hover:bg-slate-50'
                          }`}
                        >
                          <td className={`p-3 ${theme === 'DARK' ? 'text-slate-400' : 'text-slate-600'}`}>{log.time}</td>
                          <td className="p-3 text-cyan-500 font-bold">{log.staffId}</td>
                          <td className={`p-3 font-sans ${theme === 'DARK' ? 'text-slate-200' : 'text-slate-900'}`}>{log.action}</td>
                          <td className="p-3 text-emerald-500 font-semibold">{log.ip}</td>
                          <td className="p-3">
                            <span className={`px-2.5 py-1 rounded text-[10px] font-bold tracking-wider font-sans uppercase inline-block ${
                              log.severity === 'Critical' 
                                ? 'bg-rose-500/20 text-rose-500 border border-rose-500/30' 
                                : log.severity === 'High' 
                                ? 'bg-amber-500/20 text-amber-500 border border-amber-500/30' 
                                : theme === 'DARK' ? 'bg-slate-800 text-slate-300 border border-gray-700' : 'bg-slate-200 text-slate-700 border border-gray-300'
                            }`}>
                              {log.severity}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* TAB 2: USER_ACCESS TAB */}
        {activeTab === 'USER_ACCESS' && (
          <div className={`border rounded-lg shadow-md p-6 mb-8 flex flex-col transition-colors duration-300 ${theme === 'DARK' ? 'bg-[#252841] border-gray-700' : 'bg-white border-gray-200'}`}>
            <div className={`flex justify-between items-center mb-6 border-b pb-3 ${theme === 'DARK' ? 'border-gray-700' : 'border-gray-200'}`}>
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-cyan-500" />
                <div>
                  <h2 className={`text-sm font-bold uppercase tracking-widest ${theme === 'DARK' ? 'text-slate-100' : 'text-slate-900'}`}>Enterprise Hospital System Users & Access Management</h2>
                  <p className={`text-[10px] font-mono mt-0.5 ${theme === 'DARK' ? 'text-gray-400' : 'text-gray-500'}`}>Comprehensive Medical Credentialing, Licensing & MFA Parameters (MongoDB Live Engine)</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleAddNewClick}
                className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs uppercase tracking-wider px-4 py-2 rounded shadow-md hover:shadow-cyan-500/20 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Provision New Doctor
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className={`border-b text-[11px] uppercase tracking-wider ${theme === 'DARK' ? 'border-gray-700 text-gray-400 bg-[#1a1c2c]/50' : 'border-gray-200 text-gray-600 bg-slate-50'}`}>
                    <th className="p-3 font-bold">Physician Identity & Credentials</th>
                    <th className="p-3 font-bold">Staff ID & Licensure</th>
                    <th className="p-3 font-bold">Department & Focus Area</th>
                    <th className="p-3 font-bold">Secure Contact & Extension</th>
                    <th className="p-3 font-bold">Auth Engine</th>
                    <th className="p-3 font-bold">Account Status</th>
                    <th className="p-3 font-bold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className={`text-xs font-mono divide-y ${theme === 'DARK' ? 'divide-gray-700/60' : 'divide-gray-200'}`}>
                  {users.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-gray-500 font-sans">
                        No active staff accounts provisioned in MongoDB. Click "+ Provision New Doctor" to enroll personnel.
                      </td>
                    </tr>
                  ) : (
                    users.map((u) => (
                      <tr key={u._id || u.id} className={`transition-colors ${theme === 'DARK' ? 'hover:bg-[#1a1c2c]/40' : 'hover:bg-slate-50'}`}>
                        <td className="p-3 font-sans">
                          <button
                            type="button"
                            onClick={() => setViewingUser(u)}
                            className={`font-bold text-sm hover:text-cyan-500 transition-colors text-left cursor-pointer focus:outline-none block group flex items-center gap-1.5 ${theme === 'DARK' ? 'text-slate-100' : 'text-slate-900'}`}
                            title="Click to view full doctor details"
                          >
                            <span>{u.name}</span>
                            <Eye className="w-3.5 h-3.5 text-gray-500 group-hover:text-cyan-500 transition-colors opacity-80" />
                          </button>
                          <div className="text-[10px] font-mono text-cyan-500 flex items-center gap-1 mt-0.5">
                            <Award className="w-3 h-3 text-amber-500" />
                            {u.credentials || "MD"} • {u.level}
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="font-bold text-cyan-500">{u.id}</div>
                          <div className={`text-[10px] font-mono flex items-center gap-1 mt-0.5 ${theme === 'DARK' ? 'text-gray-400' : 'text-gray-500'}`}>
                            <FileText className="w-3 h-3 text-slate-500" />
                            {u.license_number || "SLMC-74920"}
                          </div>
                        </td>
                        <td className="p-3 font-sans">
                          <div className={`font-semibold ${theme === 'DARK' ? 'text-gray-200' : 'text-gray-800'}`}>{u.dept}</div>
                          <div className={`text-[10px] font-mono mt-0.5 ${theme === 'DARK' ? 'text-purple-300' : 'text-purple-700'}`}>{u.subspecialty || "General Medicine"}</div>
                        </td>
                        <td className="p-3 font-sans">
                          <div className={`text-xs flex items-center gap-1.5 ${theme === 'DARK' ? 'text-gray-300' : 'text-gray-700'}`}>
                            <Mail className="w-3 h-3 text-cyan-500 flex-shrink-0" />
                            {u.email || `${u.id.toLowerCase()}@hospital.org`}
                          </div>
                          <div className={`text-[10px] font-mono flex items-center gap-1.5 mt-0.5 ${theme === 'DARK' ? 'text-gray-400' : 'text-gray-500'}`}>
                            <Phone className="w-3 h-3 text-emerald-500 flex-shrink-0" />
                            {u.phone || "+94 76 622 7387"} ({u.extension || "Ext. 1000"})
                          </div>
                        </td>
                        <td className="p-3">
                          {u.mfa_required !== false ? (
                            <span className={`border px-2.5 py-1 rounded text-[10px] font-sans font-bold flex items-center gap-1 w-max ${
                              theme === 'DARK' ? 'bg-slate-800 border-cyan-600/50 text-cyan-300' : 'bg-cyan-50 border-cyan-300 text-cyan-700'
                            }`}>
                              <Shield className="w-3 h-3 text-cyan-500" />
                              2FA / Smart Card
                            </span>
                          ) : (
                            <span className={`border px-2.5 py-1 rounded text-[10px] font-sans font-bold flex items-center gap-1 w-max ${
                              theme === 'DARK' ? 'bg-slate-800 border-gray-700 text-gray-400' : 'bg-slate-100 border-gray-300 text-gray-600'
                            }`}>
                              Password Only
                            </span>
                          )}
                        </td>
                        <td className="p-3">
                          {u.status === "Active" ? (
                            <span className="bg-emerald-500/10 text-emerald-500 px-3 py-1 rounded-full text-[10px] font-bold tracking-wider font-sans uppercase inline-block border border-emerald-500/30 shadow-sm">
                              Active
                            </span>
                          ) : (
                            <span className="bg-rose-500/10 text-rose-500 px-3 py-1 rounded-full text-[10px] font-bold tracking-wider font-sans uppercase inline-block border border-rose-500/30 shadow-sm">
                              Revoked
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-right font-sans">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setViewingUser(u)}
                              title="View Full Account Details"
                              className={`p-1.5 border rounded transition-colors cursor-pointer ${
                                theme === 'DARK' 
                                  ? 'bg-[#131826] border-gray-700 hover:border-cyan-500 text-gray-300 hover:text-cyan-400' 
                                  : 'bg-slate-100 border-gray-200 hover:border-cyan-500 text-gray-700 hover:text-cyan-600'
                              }`}
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleEditClick(u)}
                              title="Edit Account Details"
                              className={`p-1.5 border rounded transition-colors cursor-pointer ${
                                theme === 'DARK' 
                                  ? 'bg-[#131826] border-gray-700 hover:border-cyan-500 text-gray-300 hover:text-cyan-400' 
                                  : 'bg-slate-100 border-gray-200 hover:border-cyan-500 text-gray-700 hover:text-cyan-600'
                              }`}
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            
                            {/* REVOKE BUTTON: Shows for Active Users */}
                            {u.status !== "Revoked" ? (
                              <button
                                onClick={() => setConfirmAction({ type: 'revoke', userId: u.id, userName: u.name })}
                                title="Suspend Account / Revoke Access"
                                className={`p-1.5 border rounded transition-colors cursor-pointer ${
                                  theme === 'DARK' 
                                    ? 'bg-[#131826] border-gray-700 hover:border-amber-500 text-amber-500/80 hover:text-amber-400' 
                                    : 'bg-slate-100 border-gray-200 hover:border-amber-500 text-amber-600 hover:text-amber-700'
                                }`}
                              >
                                <Ban className="w-3.5 h-3.5" />
                              </button>
                            ) : (
                              /* REACTIVATE BUTTON: Shows for Revoked Users */
                              <button
                                onClick={() => setConfirmAction({ type: 'reactivate', userId: u.id, userName: u.name })}
                                title="Restore Access & Reactivate Account"
                                className={`p-1.5 border rounded transition-colors cursor-pointer ${
                                  theme === 'DARK' 
                                    ? 'bg-[#131826] border-gray-700 hover:border-emerald-500 text-emerald-500/80 hover:text-emerald-400' 
                                    : 'bg-slate-100 border-gray-200 hover:border-emerald-500 text-emerald-600 hover:text-emerald-700'
                                }`}
                              >
                                <UserCheck className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {/* PERMANENT DELETE BUTTON: Always available to remove any account including Revoked ones */}
                            <button
                              onClick={() => setConfirmAction({ type: 'delete', userId: u.id, userName: u.name })}
                              title="Permanently Delete Account from Database"
                              className={`p-1.5 border rounded transition-colors cursor-pointer ${
                                theme === 'DARK' 
                                  ? 'bg-[#131826] border-gray-700 hover:border-rose-500 text-rose-500/80 hover:text-rose-400' 
                                  : 'bg-slate-100 border-gray-200 hover:border-rose-500 text-rose-600 hover:text-rose-700'
                              }`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: HIPAA_AUDITS TAB */}
        {activeTab === 'HIPAA_AUDITS' && (
          <div className={`border rounded-lg shadow-md p-6 flex flex-col mb-4 transition-colors duration-300 ${theme === 'DARK' ? 'bg-[#252841] border-gray-700' : 'bg-white border-gray-200'}`}>
            <div className={`flex justify-between items-center mb-6 border-b pb-3 ${theme === 'DARK' ? 'border-gray-700' : 'border-gray-200'}`}>
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-rose-500" />
                <div>
                  <h2 className={`text-sm font-bold uppercase tracking-widest ${theme === 'DARK' ? 'text-slate-100' : 'text-slate-900'}`}>Enterprise HIPAA Security Audits & Activity Ledger</h2>
                  <p className={`text-[10px] font-mono mt-0.5 ${theme === 'DARK' ? 'text-gray-400' : 'text-gray-500'}`}>Full immutable audit history verified via MongoDB cryptographic ledger</p>
                </div>
              </div>
              <span className="text-xs font-mono text-rose-500 bg-rose-500/10 border border-rose-500/30 px-3 py-1 rounded flex items-center gap-1.5 font-bold">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
                IMMUTABLE SECURITY LEDGER
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className={`border-b text-xs uppercase ${theme === 'DARK' ? 'border-gray-700 text-gray-400 bg-[#1a1c2c]/50' : 'border-gray-200 text-gray-600 bg-slate-50'}`}>
                    <th className="p-3 font-bold">Timestamp</th>
                    <th className="p-3 font-bold">Staff ID</th>
                    <th className="p-3 font-bold">Action</th>
                    <th className="p-3 font-bold">IP Address</th>
                    <th className="p-3 font-bold">Severity</th>
                  </tr>
                </thead>
                <tbody className={`text-xs font-mono divide-y ${theme === 'DARK' ? 'divide-gray-700/60' : 'divide-gray-200'}`}>
                  {logs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-gray-500 font-sans">
                        No audit logs recorded in MongoDB yet. Actions will be captured here in real-time.
                      </td>
                    </tr>
                  ) : (
                    logs.map((log) => (
                      <tr 
                        key={log._id || log.id} 
                        className={`transition-colors ${
                          log.suspicious 
                            ? 'bg-rose-500/10 border-l-4 border-rose-500 hover:bg-rose-500/20' 
                            : theme === 'DARK' ? 'hover:bg-[#1a1c2c]/40' : 'hover:bg-slate-50'
                        }`}
                      >
                        <td className={`p-3 ${theme === 'DARK' ? 'text-slate-400' : 'text-slate-600'}`}>{log.time}</td>
                        <td className="p-3 text-cyan-500 font-bold">{log.staffId}</td>
                        <td className={`p-3 font-sans ${theme === 'DARK' ? 'text-slate-200' : 'text-slate-900'}`}>{log.action}</td>
                        <td className="p-3 text-emerald-500 font-semibold">{log.ip}</td>
                        <td className="p-3">
                          <span className={`px-2.5 py-1 rounded text-[10px] font-bold tracking-wider font-sans uppercase inline-block ${
                            log.severity === 'Critical' 
                              ? 'bg-rose-500/20 text-rose-500 border border-rose-500/30' 
                              : log.severity === 'High' 
                              ? 'bg-amber-500/20 text-amber-500 border border-amber-500/30' 
                              : theme === 'DARK' ? 'bg-slate-800 text-slate-300 border border-gray-700' : 'bg-slate-200 text-slate-700 border border-gray-300'
                          }`}>
                            {log.severity}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: SYSTEM_CONFIG TAB */}
        {activeTab === 'SYSTEM_CONFIG' && (
          <div className={`border rounded-lg shadow-md p-8 flex flex-col items-center justify-center min-h-[400px] text-center transition-colors duration-300 ${theme === 'DARK' ? 'bg-[#252841] border-gray-700 text-slate-200' : 'bg-white border-gray-200 text-slate-800'}`}>
            <Settings className="w-16 h-16 text-cyan-500 mb-4 animate-spin-slow" />
            <h2 className={`text-xl font-bold uppercase tracking-widest ${theme === 'DARK' ? 'text-slate-100' : 'text-slate-900'}`}>Enterprise System Engine Configuration</h2>
            <p className={`text-xs font-mono mt-2 max-w-lg leading-relaxed ${theme === 'DARK' ? 'text-gray-400' : 'text-gray-500'}`}>
              Global AI confidence intervals, MongoDB connection strings, and multi-factor WhatsApp messaging gateway parameters are currently locked for administrative override.
            </p>
            <div className={`mt-6 px-4 py-2 border text-xs font-mono rounded flex items-center gap-2 ${theme === 'DARK' ? 'bg-[#131826] border-gray-700 text-amber-400' : 'bg-amber-50 border-amber-200 text-amber-700'}`}>
              <Lock className="w-4 h-4 text-amber-500" />
              Requires Super-Admin Cryptographic Smart Card Authorization
            </div>
          </div>
        )}

        {/* CUSTOM CONFIRMATION POP-UP MODAL (No window.confirm alert) */}
        {confirmAction && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className={`border rounded-xl shadow-2xl w-full max-w-md flex flex-col overflow-hidden my-8 ${theme === 'DARK' ? 'bg-[#252841] border-gray-700' : 'bg-white border-gray-200'}`}>
              <div className={`flex items-center justify-between p-5 border-b ${theme === 'DARK' ? 'border-gray-700' : 'border-gray-200'} ${confirmAction.type === 'revoke' ? 'bg-amber-500/10' : confirmAction.type === 'reactivate' ? 'bg-emerald-500/10' : 'bg-rose-500/10'}`}>
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg border ${confirmAction.type === 'revoke' ? 'bg-amber-500/10 border-amber-500/30 text-amber-500' : confirmAction.type === 'reactivate' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500' : 'bg-rose-500/10 border-rose-500/30 text-rose-500'}`}>
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className={`text-sm font-bold uppercase tracking-widest ${theme === 'DARK' ? 'text-slate-100' : 'text-slate-900'}`}>
                      {confirmAction.type === 'revoke' ? "Suspend Staff Account" : confirmAction.type === 'reactivate' ? "Reactivate Staff Account" : "Permanent Account Deletion"}
                    </h3>
                    <p className={`text-[10px] font-mono mt-0.5 ${theme === 'DARK' ? 'text-gray-400' : 'text-gray-500'}`}>Authorization & Security Confirmation</p>
                  </div>
                </div>
                <button onClick={() => setConfirmAction(null)} className="text-gray-400 hover:text-gray-500 transition-colors cursor-pointer p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className={`p-6 border-b ${theme === 'DARK' ? 'bg-[#1a1c2c]/50 border-gray-700/60' : 'bg-slate-50 border-gray-200'}`}>
                <p className={`text-sm font-sans leading-relaxed ${theme === 'DARK' ? 'text-slate-200' : 'text-slate-800'}`}>
                  {confirmAction.type === 'revoke' 
                    ? `Are you sure you want to suspend the account and revoke access for ${confirmAction.userName} (${confirmAction.userId})?`
                    : confirmAction.type === 'reactivate'
                    ? `Are you sure you want to restore access and reactivate the account for ${confirmAction.userName} (${confirmAction.userId})?`
                    : `Are you sure you want to permanently delete the account for ${confirmAction.userName} (${confirmAction.userId})?`}
                </p>
                <div className={`mt-4 p-3 rounded text-xs font-mono border ${confirmAction.type === 'revoke' ? 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400' : confirmAction.type === 'reactivate' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400' : 'bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400'}`}>
                  {confirmAction.type === 'revoke' 
                    ? "Notice: This will disable clinical login tokens immediately, but preserve audit history."
                    : confirmAction.type === 'reactivate'
                    ? "Notice: This will restore hospital login tokens and grant full access to the clinical AI pipeline."
                    : "Warning: This action is irreversible. The staff profile will be permanently removed from MongoDB."}
                </div>
              </div>

              <div className={`flex items-center justify-end gap-3 p-4 ${theme === 'DARK' ? 'bg-[#131826]' : 'bg-slate-100'}`}>
                <button
                  type="button"
                  onClick={() => setConfirmAction(null)}
                  className={`px-4 py-2 border rounded text-xs uppercase font-bold tracking-wider transition-all cursor-pointer shadow ${
                    theme === 'DARK' ? 'bg-[#1a1c2c] border-gray-700 hover:bg-gray-700 text-slate-300' : 'bg-white border-gray-300 hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={executingConfirm}
                  onClick={handleConfirmActionExecute}
                  className={`px-5 py-2 text-white rounded text-xs uppercase font-bold tracking-wider shadow-xl transition-all flex items-center gap-2 cursor-pointer ${confirmAction.type === 'revoke' ? 'bg-amber-600 hover:bg-amber-500 shadow-amber-500/20' : confirmAction.type === 'reactivate' ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-500/20' : 'bg-rose-600 hover:bg-rose-500 shadow-rose-500/20'}`}
                >
                  {executingConfirm ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                      Executing...
                    </>
                  ) : (
                    confirmAction.type === 'revoke' ? "Confirm Suspension" : confirmAction.type === 'reactivate' ? "Confirm Reactivation" : "Confirm Permanent Deletion"
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL POPUP: Real-World Enterprise Hospital Physician Provisioning Modal (backdrop-blur-sm bg-black/50) */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200 overflow-y-auto">
            <div className={`border rounded-xl shadow-2xl w-full max-w-2xl flex flex-col overflow-hidden my-8 ${theme === 'DARK' ? 'bg-[#252841] border-gray-700' : 'bg-white border-gray-200'}`}>
              
              <div className={`flex items-center justify-between p-6 border-b ${theme === 'DARK' ? 'border-gray-700 bg-[#1a1c2c]' : 'border-gray-200 bg-slate-50'}`}>
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-cyan-500/10 border border-cyan-500/30 text-cyan-500 rounded-lg shadow-inner">
                    <Stethoscope className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className={`text-base font-bold uppercase tracking-widest ${theme === 'DARK' ? 'text-slate-100' : 'text-slate-900'}`}>
                      {isEditMode ? "Modify Clinical Staff Account" : "Provision Clinical Staff Account"}
                    </h3>
                    <p className={`text-xs font-mono mt-0.5 ${theme === 'DARK' ? 'text-gray-400' : 'text-gray-500'}`}>
                      {isEditMode ? `Updating credentials & access role for Staff ID ${editingUserId}` : "Official Staff Enrollment for HepatoAI Platform & Hospital Database"}
                    </p>
                  </div>
                </div>
                <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-500 transition-colors cursor-pointer p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleProvisionSubmit} className="p-8 flex flex-col gap-6 max-h-[80vh] overflow-y-auto custom-scrollbar">
                
                {/* SECTION 1: Identity & Licensing */}
                <div className={`flex flex-col gap-4 p-5 rounded-lg border ${theme === 'DARK' ? 'bg-[#1a1c2c]/50 border-gray-700/60' : 'bg-slate-50 border-gray-200'}`}>
                  <h4 className={`text-xs font-bold uppercase tracking-widest text-cyan-500 flex items-center gap-2 border-b pb-2 ${theme === 'DARK' ? 'border-gray-700/60' : 'border-gray-200'}`}>
                    <Award className="w-4 h-4 text-cyan-500" />
                    1. Physician Identity & Licensing
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1">
                      <label className={`text-[10px] font-bold uppercase tracking-widest ${theme === 'DARK' ? 'text-gray-400' : 'text-gray-600'}`}>Full Name</label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        placeholder="e.g. Prof. Dr. Alexander Vance"
                        className={`w-full border rounded px-3 py-2.5 text-xs focus:outline-none focus:border-cyan-500 font-sans font-bold ${
                          theme === 'DARK' ? 'bg-[#131826] border-gray-700 text-slate-200 placeholder-gray-600' : 'bg-white border-gray-300 text-slate-900 placeholder-gray-400'
                        }`}
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className={`text-[10px] font-bold uppercase tracking-widest ${theme === 'DARK' ? 'text-gray-400' : 'text-gray-600'}`}>Staff ID / License No</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          required
                          disabled={isEditMode}
                          value={formData.id}
                          onChange={(e) => setFormData({...formData, id: e.target.value})}
                          placeholder="ST-1234"
                          className={`w-1/2 border rounded px-3 py-2.5 text-xs text-cyan-500 font-mono font-bold focus:outline-none focus:border-cyan-500 ${
                            theme === 'DARK' ? 'bg-[#131826] border-gray-700' : 'bg-white border-gray-300'
                          } ${isEditMode ? 'opacity-75 cursor-not-allowed' : ''}`}
                        />
                        <input
                          type="text"
                          required
                          value={formData.license_number}
                          onChange={(e) => setFormData({...formData, license_number: e.target.value})}
                          placeholder="SLMC-74920"
                          className={`w-1/2 border rounded px-3 py-2.5 text-xs font-mono focus:outline-none focus:border-cyan-500 ${
                            theme === 'DARK' ? 'bg-[#131826] border-gray-700 text-slate-300' : 'bg-white border-gray-300 text-slate-800'
                          }`}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* SECTION 2: Institutional Assignment (Department & Access Role) */}
                <div className={`flex flex-col gap-4 p-5 rounded-lg border ${theme === 'DARK' ? 'bg-[#1a1c2c]/50 border-gray-700/60' : 'bg-slate-50 border-gray-200'}`}>
                  <h4 className={`text-xs font-bold uppercase tracking-widest text-cyan-500 flex items-center gap-2 border-b pb-2 ${theme === 'DARK' ? 'border-gray-700/60' : 'border-gray-200'}`}>
                    <Stethoscope className="w-4 h-4 text-cyan-500" />
                    2. Institutional Assignment
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1">
                      <label className={`text-[10px] font-bold uppercase tracking-widest ${theme === 'DARK' ? 'text-gray-400' : 'text-gray-600'}`}>Department</label>
                      <select
                        value={formData.dept}
                        onChange={(e) => setFormData({...formData, dept: e.target.value})}
                        className={`w-full border rounded px-3 py-2.5 text-xs font-sans font-semibold focus:outline-none focus:border-cyan-500 ${
                          theme === 'DARK' ? 'bg-[#131826] border-gray-700 text-slate-200' : 'bg-white border-gray-300 text-slate-900'
                        }`}
                      >
                        <option value="Radiology">Radiology</option>
                        <option value="Oncology">Oncology</option>
                        <option value="Hepatology">Hepatology</option>
                        <option value="Interventional Radiology">Interventional Radiology</option>
                        <option value="Hepatobiliary Surgery">Hepatobiliary Surgery</option>
                      </select>
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className={`text-[10px] font-bold uppercase tracking-widest ${theme === 'DARK' ? 'text-gray-400' : 'text-gray-600'}`}>Access Role</label>
                      <select
                        value={formData.level}
                        onChange={(e) => setFormData({...formData, level: e.target.value})}
                        className={`w-full border rounded px-3 py-2.5 text-xs font-sans font-bold focus:outline-none focus:border-cyan-500 ${
                          theme === 'DARK' ? 'bg-[#131826] border-gray-700 text-purple-300' : 'bg-white border-gray-300 text-purple-700'
                        }`}
                      >
                        <option value="Chief Physician">Chief Physician</option>
                        <option value="Consultant">Consultant</option>
                        <option value="Resident">Resident</option>
                        <option value="Attending Radiologist">Attending Radiologist</option>
                        <option value="Fellow">Fellow</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className={`text-[10px] font-bold uppercase tracking-widest ${theme === 'DARK' ? 'text-gray-400' : 'text-gray-600'}`}>Subspecialty Focus Area</label>
                    <input
                      type="text"
                      required
                      value={formData.subspecialty}
                      onChange={(e) => setFormData({...formData, subspecialty: e.target.value})}
                      placeholder="e.g. Hepatic Recurrence Prognosis & 3D Volumetrics"
                      className={`w-full border rounded px-3 py-2.5 text-xs font-sans focus:outline-none focus:border-cyan-500 ${
                        theme === 'DARK' ? 'bg-[#131826] border-gray-700 text-slate-300' : 'bg-white border-gray-300 text-slate-800'
                      }`}
                    />
                  </div>
                </div>

                {/* SECTION 3: Contact & Secure Communications */}
                <div className={`flex flex-col gap-4 p-5 rounded-lg border ${theme === 'DARK' ? 'bg-[#1a1c2c]/50 border-gray-700/60' : 'bg-slate-50 border-gray-200'}`}>
                  <h4 className={`text-xs font-bold uppercase tracking-widest text-cyan-500 flex items-center gap-2 border-b pb-2 ${theme === 'DARK' ? 'border-gray-700/60' : 'border-gray-200'}`}>
                    <Phone className="w-4 h-4 text-cyan-500" />
                    3. Secure Communication & MFA Parameters
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex flex-col gap-1 md:col-span-1">
                      <label className={`text-[10px] font-bold uppercase tracking-widest ${theme === 'DARK' ? 'text-gray-400' : 'text-gray-600'}`}>Hospital Email</label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        placeholder="dr.name@hospital.org"
                        className={`w-full border rounded px-3 py-2.5 text-xs font-mono focus:outline-none focus:border-cyan-500 ${
                          theme === 'DARK' ? 'bg-[#131826] border-gray-700 text-slate-200' : 'bg-white border-gray-300 text-slate-900'
                        }`}
                      />
                    </div>
                    <div className="flex flex-col gap-1 md:col-span-1">
                      <label className={`text-[10px] font-bold uppercase tracking-widest ${theme === 'DARK' ? 'text-gray-400' : 'text-gray-600'}`}>Mobile / WhatsApp (MFA)</label>
                      <input
                        type="text"
                        required
                        value={formData.phone}
                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                        placeholder="+94 76 622 7387"
                        className={`w-full border rounded px-3 py-2.5 text-xs text-emerald-500 font-mono focus:outline-none focus:border-cyan-500 ${
                          theme === 'DARK' ? 'bg-[#131826] border-gray-700' : 'bg-white border-gray-300'
                        }`}
                      />
                    </div>
                    <div className="flex flex-col gap-1 md:col-span-1">
                      <label className={`text-[10px] font-bold uppercase tracking-widest ${theme === 'DARK' ? 'text-gray-400' : 'text-gray-600'}`}>Extension</label>
                      <input
                        type="text"
                        required
                        value={formData.extension}
                        onChange={(e) => setFormData({...formData, extension: e.target.value})}
                        placeholder="Ext. 2100"
                        className={`w-full border rounded px-3 py-2.5 text-xs font-mono focus:outline-none focus:border-cyan-500 ${
                          theme === 'DARK' ? 'bg-[#131826] border-gray-700 text-slate-300' : 'bg-white border-gray-300 text-slate-800'
                        }`}
                      />
                    </div>
                  </div>
                </div>

                {/* SECTION 4: System Security & Audit Parameters */}
                <div className={`flex flex-col gap-4 p-5 rounded-lg border ${theme === 'DARK' ? 'bg-[#1a1c2c]/50 border-gray-700/60' : 'bg-slate-50 border-gray-200'}`}>
                  <h4 className={`text-xs font-bold uppercase tracking-widest text-cyan-500 flex items-center gap-2 border-b pb-2 ${theme === 'DARK' ? 'border-gray-700/60' : 'border-gray-200'}`}>
                    <Shield className="w-4 h-4 text-cyan-500" />
                    4. Account Security & Credentials
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1">
                      <label className={`text-[10px] font-bold uppercase tracking-widest ${theme === 'DARK' ? 'text-gray-400' : 'text-gray-600'}`}>Account Lifecycle Status</label>
                      <select
                        value={formData.status}
                        onChange={(e) => setFormData({...formData, status: e.target.value})}
                        className={`w-full border rounded px-3 py-2.5 text-xs text-emerald-500 font-sans font-bold focus:outline-none focus:border-cyan-500 ${
                          theme === 'DARK' ? 'bg-[#131826] border-gray-700' : 'bg-white border-gray-300'
                        }`}
                      >
                        <option value="Active">Active & Fully Authorized</option>
                        <option value="Revoked">Revoked / Suspended Pending Audit</option>
                      </select>
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className={`text-[10px] font-bold uppercase tracking-widest ${theme === 'DARK' ? 'text-gray-400' : 'text-gray-600'}`}>
                        {isEditMode ? "New Login Password (Leave blank to keep current)" : "Initial Temporary Login Password"}
                      </label>
                      <input
                        type="password"
                        required={!isEditMode}
                        value={formData.password}
                        onChange={(e) => setFormData({...formData, password: e.target.value})}
                        placeholder={isEditMode ? "•••••••••••• (Unchanged)" : "••••••••••••"}
                        className={`w-full border rounded px-3 py-2.5 text-xs font-mono focus:outline-none focus:border-cyan-500 ${
                          theme === 'DARK' ? 'bg-[#131826] border-gray-700 text-slate-200' : 'bg-white border-gray-300 text-slate-900'
                        }`}
                      />
                    </div>
                  </div>
                  
                  <div className={`flex items-center gap-3 p-4 rounded border mt-2 ${theme === 'DARK' ? 'bg-[#131826] border-gray-700' : 'bg-white border-gray-300'}`}>
                    <input 
                      type="checkbox" 
                      id="mfa_mandate"
                      checked={formData.mfa_required} 
                      onChange={(e) => setFormData({...formData, mfa_required: e.target.checked})}
                      className="w-4 h-4 accent-cyan-500 rounded cursor-pointer" 
                    />
                    <label htmlFor="mfa_mandate" className={`text-xs font-mono cursor-pointer select-none ${theme === 'DARK' ? 'text-gray-300' : 'text-gray-700'}`}>
                      <span className="text-cyan-500 font-bold block mb-0.5 font-sans uppercase tracking-wider">MANDATE SMART CARD & 2FA MULTI-FACTOR AUTHENTICATION</span>
                      Enforce high-assurance hardware token verification upon first login to comply with HIPAA regulations.
                    </label>
                  </div>
                </div>

                {/* Confirm Action Button */}
                <div className={`flex items-center justify-end gap-4 mt-2 border-t pt-6 ${theme === 'DARK' ? 'border-gray-700' : 'border-gray-200'}`}>
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className={`px-6 py-3 border rounded text-xs uppercase font-bold tracking-widest transition-all cursor-pointer shadow ${
                      theme === 'DARK' ? 'bg-[#131826] border-gray-700 hover:bg-gray-700 text-slate-300' : 'bg-white border-gray-300 hover:bg-gray-100 text-gray-700'
                    }`}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-8 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded text-xs uppercase font-bold tracking-widest shadow-xl hover:shadow-cyan-500/40 transition-all flex items-center gap-2 cursor-pointer"
                  >
                    {submitting ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                        {isEditMode ? "Saving Modifications..." : "Provisioning & Sending Email..."}
                      </>
                    ) : (
                      isEditMode ? "Authorize & Save Modifications" : "Authorize & Provision"
                    )}
                  </button>
                </div>

              </form>
            </div>
          </div>
        )}

        {/* DOCTOR DETAILS VIEW MODAL */}
        {viewingUser && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-200 overflow-y-auto">
            <div className={`border rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.8)] w-full max-w-3xl flex flex-col overflow-hidden my-8 ${theme === 'DARK' ? 'bg-[#252841] border-gray-700' : 'bg-white border-gray-200'}`}>
              
              {/* Modal Header */}
              <div className={`flex items-center justify-between p-6 border-b ${theme === 'DARK' ? 'border-gray-700 bg-gradient-to-r from-[#131524] to-[#1a1c2c]' : 'border-gray-200 bg-slate-100'}`}>
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-cyan-500/10 border border-cyan-500/30 text-cyan-500 rounded-xl shadow-inner">
                    <User className="w-8 h-8" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className={`text-xl font-bold tracking-wide font-sans ${theme === 'DARK' ? 'text-slate-100' : 'text-slate-900'}`}>{viewingUser.name}</h3>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider font-sans uppercase inline-block border ${viewingUser.status === 'Active' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30' : 'bg-rose-500/10 text-rose-500 border-rose-500/30'}`}>
                        {viewingUser.status || 'Active'}
                      </span>
                    </div>
                    <p className="text-xs text-cyan-500 font-mono mt-1 flex items-center gap-1.5">
                      <Award className="w-3.5 h-3.5 text-amber-500" /> {viewingUser.credentials || "MD, FRCR"} • {viewingUser.level || "Consultant"}
                    </p>
                  </div>
                </div>
                <button onClick={() => setViewingUser(null)} className="text-gray-400 hover:text-gray-500 transition-colors cursor-pointer p-2 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-xl">
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Modal Body */}
              <div className={`p-8 grid grid-cols-1 md:grid-cols-2 gap-6 overflow-y-auto custom-scrollbar max-h-[70vh] ${theme === 'DARK' ? 'bg-[#1a1c2c]/80' : 'bg-slate-50'}`}>
                
                {/* 1. Profile & Identity */}
                <div className={`p-5 rounded-xl border shadow-md flex flex-col gap-4 ${theme === 'DARK' ? 'bg-[#131524] border-gray-700/80' : 'bg-white border-gray-200'}`}>
                  <h4 className={`text-xs font-bold uppercase tracking-widest text-cyan-500 flex items-center gap-2 border-b pb-2.5 ${theme === 'DARK' ? 'border-gray-700/60' : 'border-gray-200'}`}>
                    <FileText className="w-4 h-4 text-cyan-500" />
                    Professional Identity
                  </h4>
                  <div className="flex flex-col gap-3 font-sans text-xs">
                    <div className={`flex justify-between items-center border-b pb-2 ${theme === 'DARK' ? 'border-gray-800' : 'border-gray-100'}`}>
                      <span className={`font-mono uppercase text-[10px] ${theme === 'DARK' ? 'text-gray-400' : 'text-gray-500'}`}>Staff ID</span>
                      <span className="font-mono font-bold text-cyan-500 bg-cyan-500/10 border border-cyan-500/30 px-2 py-0.5 rounded">{viewingUser.id}</span>
                    </div>
                    <div className={`flex justify-between items-center border-b pb-2 ${theme === 'DARK' ? 'border-gray-800' : 'border-gray-100'}`}>
                      <span className={`font-mono uppercase text-[10px] ${theme === 'DARK' ? 'text-gray-400' : 'text-gray-500'}`}>Medical License No</span>
                      <span className={`font-mono font-bold ${theme === 'DARK' ? 'text-slate-200' : 'text-slate-800'}`}>{viewingUser.license_number || "SLMC-74920"}</span>
                    </div>
                    <div className={`flex justify-between items-center border-b pb-2 ${theme === 'DARK' ? 'border-gray-800' : 'border-gray-100'}`}>
                      <span className={`font-mono uppercase text-[10px] ${theme === 'DARK' ? 'text-gray-400' : 'text-gray-500'}`}>Staff Designation</span>
                      <span className={`font-bold ${theme === 'DARK' ? 'text-slate-100' : 'text-slate-900'}`}>{viewingUser.level || "Consultant"}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className={`font-mono uppercase text-[10px] ${theme === 'DARK' ? 'text-gray-400' : 'text-gray-500'}`}>Credentials & Accreditations</span>
                      <span className="font-bold text-amber-500">{viewingUser.credentials || "MD, FRCR"}</span>
                    </div>
                  </div>
                </div>

                {/* 2. Institutional Assignment */}
                <div className={`p-5 rounded-xl border shadow-md flex flex-col gap-4 ${theme === 'DARK' ? 'bg-[#131524] border-gray-700/80' : 'bg-white border-gray-200'}`}>
                  <h4 className={`text-xs font-bold uppercase tracking-widest text-cyan-500 flex items-center gap-2 border-b pb-2.5 ${theme === 'DARK' ? 'border-gray-700/60' : 'border-gray-200'}`}>
                    <Building2 className="w-4 h-4 text-cyan-500" />
                    Department & Specialization
                  </h4>
                  <div className="flex flex-col gap-3 font-sans text-xs">
                    <div className={`flex justify-between items-center border-b pb-2 ${theme === 'DARK' ? 'border-gray-800' : 'border-gray-100'}`}>
                      <span className={`font-mono uppercase text-[10px] ${theme === 'DARK' ? 'text-gray-400' : 'text-gray-500'}`}>Primary Department</span>
                      <span className={`font-bold ${theme === 'DARK' ? 'text-slate-200' : 'text-slate-800'}`}>{viewingUser.dept || "Radiology"}</span>
                    </div>
                    <div className={`flex flex-col gap-1 border-b pb-2 ${theme === 'DARK' ? 'border-gray-800' : 'border-gray-100'}`}>
                      <span className={`font-mono uppercase text-[10px] ${theme === 'DARK' ? 'text-gray-400' : 'text-gray-500'}`}>Subspecialty Focus Area</span>
                      <span className={`font-semibold ${theme === 'DARK' ? 'text-purple-300' : 'text-purple-700'}`}>{viewingUser.subspecialty || "Diagnostic Volumetric MPR & Oncology"}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className={`font-mono uppercase text-[10px] ${theme === 'DARK' ? 'text-gray-400' : 'text-gray-500'}`}>Hospital Division</span>
                      <span className={`font-semibold ${theme === 'DARK' ? 'text-slate-300' : 'text-slate-700'}`}>Colombo Diagnostic Imaging Center</span>
                    </div>
                  </div>
                </div>

                {/* 3. Secure Contact Parameters */}
                <div className={`p-5 rounded-xl border shadow-md flex flex-col gap-4 ${theme === 'DARK' ? 'bg-[#131524] border-gray-700/80' : 'bg-white border-gray-200'}`}>
                  <h4 className={`text-xs font-bold uppercase tracking-widest text-cyan-500 flex items-center gap-2 border-b pb-2.5 ${theme === 'DARK' ? 'border-gray-700/60' : 'border-gray-200'}`}>
                    <Phone className="w-4 h-4 text-cyan-500" />
                    Secure Communication Gateways
                  </h4>
                  <div className="flex flex-col gap-3 font-sans text-xs">
                    <div className={`flex justify-between items-center border-b pb-2 ${theme === 'DARK' ? 'border-gray-800' : 'border-gray-100'}`}>
                      <span className={`font-mono uppercase text-[10px] flex items-center gap-1 ${theme === 'DARK' ? 'text-gray-400' : 'text-gray-500'}`}><Mail className="w-3 h-3 text-cyan-500" /> Email Address</span>
                      <span className={`font-mono font-semibold ${theme === 'DARK' ? 'text-cyan-300' : 'text-cyan-700'}`}>{viewingUser.email || `${viewingUser.id?.toLowerCase() || 'st-1000'}@hospital.org`}</span>
                    </div>
                    <div className={`flex justify-between items-center border-b pb-2 ${theme === 'DARK' ? 'border-gray-800' : 'border-gray-100'}`}>
                      <span className={`font-mono uppercase text-[10px] flex items-center gap-1 ${theme === 'DARK' ? 'text-gray-400' : 'text-gray-500'}`}><Phone className="w-3 h-3 text-emerald-500" /> Mobile / WhatsApp</span>
                      <span className="font-mono text-emerald-500 font-semibold">{viewingUser.phone || "+94 76 622 7387"}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className={`font-mono uppercase text-[10px] ${theme === 'DARK' ? 'text-gray-400' : 'text-gray-500'}`}>Hospital Intercom Extension</span>
                      <span className={`font-mono font-bold ${theme === 'DARK' ? 'text-slate-300' : 'text-slate-700'}`}>{viewingUser.extension || "Ext. 2100"}</span>
                    </div>
                  </div>
                </div>

                {/* 4. Auth Engine & Compliance */}
                <div className={`p-5 rounded-xl border shadow-md flex flex-col gap-4 ${theme === 'DARK' ? 'bg-[#131524] border-gray-700/80' : 'bg-white border-gray-200'}`}>
                  <h4 className={`text-xs font-bold uppercase tracking-widest text-cyan-500 flex items-center gap-2 border-b pb-2.5 ${theme === 'DARK' ? 'border-gray-700/60' : 'border-gray-200'}`}>
                    <Shield className="w-4 h-4 text-cyan-500" />
                    Authentication & HIPAA Engine
                  </h4>
                  <div className="flex flex-col gap-3 font-sans text-xs">
                    <div className={`flex justify-between items-center border-b pb-2 ${theme === 'DARK' ? 'border-gray-800' : 'border-gray-100'}`}>
                      <span className={`font-mono uppercase text-[10px] ${theme === 'DARK' ? 'text-gray-400' : 'text-gray-500'}`}>Multi-Factor Auth (MFA)</span>
                      {viewingUser.mfa_required !== false ? (
                        <span className={`border px-2 py-0.5 rounded text-[10px] font-sans font-bold flex items-center gap-1 ${
                          theme === 'DARK' ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300' : 'bg-emerald-50 border-emerald-300 text-emerald-700'
                        }`}>
                          <CheckCircle className="w-3 h-3 text-emerald-500" /> Mandatory 2FA Active
                        </span>
                      ) : (
                        <span className={`border px-2 py-0.5 rounded text-[10px] font-sans font-bold ${
                          theme === 'DARK' ? 'bg-slate-800 border-gray-700 text-gray-400' : 'bg-slate-100 border-gray-300 text-gray-600'
                        }`}>
                          Password Only
                        </span>
                      )}
                    </div>
                    <div className={`flex justify-between items-center border-b pb-2 ${theme === 'DARK' ? 'border-gray-800' : 'border-gray-100'}`}>
                      <span className={`font-mono uppercase text-[10px] ${theme === 'DARK' ? 'text-gray-400' : 'text-gray-500'}`}>Data Ledger Encryption</span>
                      <span className="font-mono text-emerald-500 font-bold">AES-256 (MongoDB Secure)</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className={`font-mono uppercase text-[10px] ${theme === 'DARK' ? 'text-gray-400' : 'text-gray-500'}`}>HIPAA Access Privileges</span>
                      <span className={`font-sans font-bold ${theme === 'DARK' ? 'text-cyan-300' : 'text-cyan-700'}`}>Granted (PACS & MPR Viewer)</span>
                    </div>
                  </div>
                </div>

              </div>

              {/* Modal Footer */}
              <div className={`flex items-center justify-between p-5 border-t ${theme === 'DARK' ? 'border-gray-700 bg-[#131524]' : 'border-gray-200 bg-slate-100'}`}>
                <div className={`text-[11px] font-mono flex items-center gap-2 ${theme === 'DARK' ? 'text-gray-400' : 'text-gray-500'}`}>
                  <Database className="w-3.5 h-3.5 text-blue-500" />
                  <span>Live Account State Verified via MongoDB • ID: {viewingUser._id || viewingUser.id}</span>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      const selectedUser = viewingUser;
                      setViewingUser(null);
                      handleEditClick(selectedUser);
                    }}
                    className="px-4 py-2 bg-cyan-600/20 border border-cyan-500/50 hover:bg-cyan-600 text-cyan-600 dark:text-cyan-300 hover:text-white rounded-lg text-xs uppercase font-bold tracking-wider transition-all cursor-pointer flex items-center gap-1.5 shadow"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    Modify Details
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewingUser(null)}
                    className={`px-5 py-2 border rounded-lg text-xs uppercase font-bold tracking-wider transition-all cursor-pointer shadow ${
                      theme === 'DARK' ? 'bg-[#1a1c2c] border-gray-700 hover:bg-gray-700 text-slate-300' : 'bg-white border-gray-300 hover:bg-gray-100 text-gray-700'
                    }`}
                  >
                    Close View
                  </button>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* FOOTER */}
        <footer className={`mt-auto pt-8 pb-4 border-t font-mono text-xs flex flex-col sm:flex-row items-center justify-between gap-4 transition-colors duration-300 ${theme === 'DARK' ? 'border-gray-800/80 text-gray-400' : 'border-gray-200 text-gray-500'}`}>
          <div className="flex items-center gap-2 text-[11px]">
            <Shield className="w-3.5 h-3.5 text-cyan-500" />
            <span>HepatoAI IT Administration Console • <span className={`font-bold ${theme === 'DARK' ? 'text-slate-300' : 'text-slate-700'}`}>HIPAA Compliant System</span></span>
          </div>
          <div className="flex items-center gap-6 text-[11px]">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Node: <span className="text-emerald-500 font-bold">PROD-SECURE-09</span>
            </span>
            <span>v2.4.0-prod</span>
            <span>© {new Date().getFullYear()} HepatoAI Enterprise</span>
          </div>
        </footer>

      </div>
    </div>
  );
};