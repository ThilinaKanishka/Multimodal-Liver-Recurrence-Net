import React, { useState, useEffect } from "react";
import axios from "axios";
import { Server, Database, Activity, Users, ShieldAlert, Plus, Lock, RefreshCw, ArrowLeft, X, CheckCircle, Shield, Mail, Phone, Stethoscope, Award, FileText, Edit2, Ban, Trash2, LayoutDashboard, Settings, LogOut, Hexagon, AlertTriangle, UserCheck } from "lucide-react";

export const AdminDashboardPage: React.FC<{ onBack?: () => void }> = ({ onBack }) => {
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
    license_number: "SLMC-",
    dept: "Radiology",
    level: "Senior Consultant Radiologist",
    subspecialty: "Diagnostic Volumetric MPR",
    email: "",
    phone: "+94 7",
    extension: "Ext. 2100",
    status: "Active",
    mfa_required: true,
    password: ""
  });
  const [submitting, setSubmitting] = useState(false);

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
      license_number: "SLMC-",
      dept: "Radiology",
      level: "Senior Consultant Radiologist",
      subspecialty: "Diagnostic Volumetric MPR",
      email: "",
      phone: "+94 7",
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
      license_number: u.license_number || "SLMC-REG",
      dept: u.dept || "Radiology",
      level: u.level || "Attending",
      subspecialty: u.subspecialty || "General",
      email: u.email || "",
      phone: u.phone || "+94 77 000 0000",
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
      : axios.post("http://127.0.0.1:8000/api/v1/admin/users", formData);

    requestPromise
      .then(res => {
        setSubmitting(false);
        setShowModal(false);
        setIsEditMode(false);
        setEditingUserId(null);
        setFormData({
          id: `ST-${Math.floor(1000 + Math.random() * 9000)}`,
          name: "",
          credentials: "MD, FRCR",
          license_number: "SLMC-",
          dept: "Radiology",
          level: "Senior Consultant Radiologist",
          subspecialty: "Diagnostic Volumetric MPR",
          email: "",
          phone: "+94 7",
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
    <div className="flex h-screen bg-[#1a1c2c] overflow-hidden text-slate-200 font-sans">
      
      {/* FIXED LEFT ADMIN SIDEBAR */}
      <div className="w-64 bg-[#131524] border-r border-gray-800 flex flex-col justify-between flex-shrink-0 h-full shadow-2xl z-20">
        
        {/* Brand/Logo Section */}
        <div className="p-6 border-b border-gray-800/80 bg-[#131524]">
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-600 p-0.5 shadow-lg shadow-cyan-500/30 group">
              <div className="w-full h-full bg-[#131524] rounded-[10px] flex items-center justify-center">
                <Hexagon className="w-5 h-5 text-cyan-400 group-hover:rotate-12 transition-transform duration-300" />
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-200 to-indigo-400 font-sans">
                HEPATOAI
              </span>
              <span className="text-[10px] font-mono bg-rose-500/20 text-rose-300 border border-rose-500/30 px-2 py-0.5 rounded font-bold tracking-widest w-max mt-1">
                IT ADMIN CONSOLE
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Links (Admin Specific) */}
        <div className="flex-1 px-4 py-6 space-y-2 overflow-y-auto custom-scrollbar">
          <button className="w-full flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-cyan-600/20 to-blue-600/10 border-l-4 border-cyan-400 text-cyan-300 rounded-r-lg font-sans font-bold text-xs uppercase tracking-wider shadow-sm transition-all cursor-pointer">
            <LayoutDashboard className="w-4 h-4 text-cyan-400 flex-shrink-0" />
            Overview
          </button>

          <button className="w-full flex items-center gap-3 px-4 py-3 text-gray-400 hover:bg-[#1a1c2c]/60 hover:text-slate-200 rounded-lg font-sans font-semibold text-xs uppercase tracking-wider transition-all cursor-pointer">
            <Users className="w-4 h-4 text-gray-400 flex-shrink-0" />
            User Access
          </button>

          <button className="w-full flex items-center gap-3 px-4 py-3 text-gray-400 hover:bg-[#1a1c2c]/60 hover:text-slate-200 rounded-lg font-sans font-semibold text-xs uppercase tracking-wider transition-all cursor-pointer">
            <ShieldAlert className="w-4 h-4 text-gray-400 flex-shrink-0" />
            HIPAA Audits
          </button>

          <button className="w-full flex items-center gap-3 px-4 py-3 text-gray-400 hover:bg-[#1a1c2c]/60 hover:text-slate-200 rounded-lg font-sans font-semibold text-xs uppercase tracking-wider transition-all cursor-pointer">
            <Settings className="w-4 h-4 text-gray-400 flex-shrink-0" />
            System Config
          </button>
        </div>

        {/* Bottom Action */}
        <div className="p-4 border-t border-gray-800/80 bg-[#131524]">
          <button 
            onClick={onBack} 
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#1a1c2c] border border-gray-700 hover:bg-rose-950/40 hover:border-rose-800 text-gray-300 hover:text-rose-200 rounded-lg font-mono text-xs uppercase font-bold tracking-wider transition-all cursor-pointer shadow-md group"
          >
            <LogOut className="w-4 h-4 text-rose-400 group-hover:-translate-x-0.5 transition-transform" />
            Exit Console
          </button>
        </div>
      </div>

      {/* RIGHT SIDE MAIN DASHBOARD CONTENT */}
      <div className="flex-1 p-8 bg-[#1a1c2c] text-slate-200 font-sans flex flex-col h-full overflow-y-auto custom-scrollbar relative z-10">
        
        {/* Top Header Section */}
        <div className="flex items-center justify-between mb-8 border-b border-gray-700 pb-4">
          <div className="flex items-center gap-4">
            <div className="p-2.5 bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded shadow-inner">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-100 tracking-wide uppercase flex items-center gap-2">
                Hospital IT Admin Console
                <span className="text-[10px] font-mono bg-rose-500/20 text-rose-300 border border-rose-500/40 px-2 py-0.5 rounded font-bold tracking-widest">
                  MISSION CONTROL
                </span>
              </h1>
              <p className="text-gray-400 text-xs font-mono mt-0.5">Secure System Health, Enterprise Credentialing & Real-Time HIPAA Audit Engine</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={fetchAdminData}
              className="flex items-center gap-2 px-3 py-1.5 bg-[#252841] border border-gray-700 hover:bg-gray-700 rounded text-xs font-mono text-gray-300 shadow-sm transition-all cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${loading ? 'animate-spin' : ''}`} />
              <span>{loading ? "Syncing..." : "Live Sync Active"}</span>
            </button>
          </div>
        </div>

        {/* A. Top Stat Cards (System Health 🧠) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          
          {/* AI Server Status */}
          <div className="bg-[#252841] border border-gray-700 p-5 rounded-lg shadow-lg flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500"></div>
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                <Server className="w-4 h-4 text-emerald-400" /> AI Server Status
              </span>
              <span className="text-[10px] font-mono bg-emerald-950/50 border border-emerald-500/30 text-emerald-400 px-2 py-0.5 rounded flex items-center gap-1.5 font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                ONLINE
              </span>
            </div>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-lg font-mono font-bold text-slate-100">{stats.ai_server_status}</span>
              <div className="text-right">
                <span className="text-[10px] block text-gray-400 uppercase font-mono">API Latency</span>
                <span className="text-xl font-mono font-bold text-cyan-400">{stats.api_latency}</span>
              </div>
            </div>
          </div>

          {/* Database Status */}
          <div className="bg-[#252841] border border-gray-700 p-5 rounded-lg shadow-lg flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                <Database className="w-4 h-4 text-blue-400" /> Database Status
              </span>
              <span className="text-[10px] font-mono bg-blue-950/50 border border-blue-500/30 text-blue-400 px-2 py-0.5 rounded font-bold flex items-center gap-1">
                <CheckCircle className="w-3 h-3" /> Secure
              </span>
            </div>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-lg font-mono font-bold text-slate-100">{stats.database_status}</span>
              <div className="text-right">
                <span className="text-[10px] block text-gray-400 uppercase font-mono">Storage Usage</span>
                <span className="text-xl font-mono font-bold text-blue-400">{stats.storage_usage}</span>
              </div>
            </div>
          </div>

          {/* Processing Stats */}
          <div className="bg-[#252841] border border-gray-700 p-5 rounded-lg shadow-lg flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-purple-500"></div>
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-purple-400" /> Processing Stats
              </span>
              <span className="text-[10px] font-mono bg-purple-950/50 border border-purple-500/30 text-purple-400 px-2 py-0.5 rounded font-bold">
                Real-Time
              </span>
            </div>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-lg font-mono font-bold text-slate-100">Scans Processed Today</span>
              <span className="text-3xl font-mono font-bold text-purple-400">{stats.scans_processed_today}</span>
            </div>
          </div>

        </div>

        {/* B. Role-Based Access Control (RBAC) Section 👥 */}
        <div className="bg-[#252841] border border-gray-700 rounded-lg shadow-xl p-6 mb-8 flex flex-col">
          <div className="flex justify-between items-center mb-6 border-b border-gray-700 pb-3">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-cyan-400" />
              <div>
                <h2 className="text-sm font-bold text-slate-100 uppercase tracking-widest">Enterprise Hospital System Users & Access Management</h2>
                <p className="text-[10px] text-gray-400 font-mono mt-0.5">Comprehensive Medical Credentialing, Licensing & MFA Parameters (MongoDB Live Engine)</p>
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
                <tr className="border-b border-gray-700 text-gray-400 text-[11px] uppercase bg-[#1a1c2c]/50 tracking-wider">
                  <th className="p-3 font-bold">Physician Identity & Credentials</th>
                  <th className="p-3 font-bold">Staff ID & Licensure</th>
                  <th className="p-3 font-bold">Department & Focus Area</th>
                  <th className="p-3 font-bold">Secure Contact & Extension</th>
                  <th className="p-3 font-bold">Auth Engine</th>
                  <th className="p-3 font-bold">Account Status</th>
                  <th className="p-3 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="text-xs font-mono divide-y divide-gray-700/60">
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-gray-500 font-sans">
                      No active staff accounts provisioned in MongoDB. Click "+ Provision New Doctor" to enroll personnel.
                    </td>
                  </tr>
                ) : (
                  users.map((u) => (
                    <tr key={u._id || u.id} className="hover:bg-[#1a1c2c]/40 transition-colors">
                      <td className="p-3 font-sans">
                        <div className="font-bold text-slate-100 text-sm">{u.name}</div>
                        <div className="text-[10px] font-mono text-cyan-400 flex items-center gap-1 mt-0.5">
                          <Award className="w-3 h-3 text-amber-400" />
                          {u.credentials || "MD"} • {u.level}
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="font-bold text-cyan-400">{u.id}</div>
                        <div className="text-[10px] text-gray-400 font-mono flex items-center gap-1 mt-0.5">
                          <FileText className="w-3 h-3 text-slate-500" />
                          {u.license_number || "SLMC-REG"}
                        </div>
                      </td>
                      <td className="p-3 font-sans">
                        <div className="font-semibold text-gray-200">{u.dept}</div>
                        <div className="text-[10px] text-purple-300 font-mono mt-0.5">{u.subspecialty || "General Medicine"}</div>
                      </td>
                      <td className="p-3 font-sans">
                        <div className="text-gray-300 text-xs flex items-center gap-1.5">
                          <Mail className="w-3 h-3 text-cyan-400 flex-shrink-0" />
                          {u.email || `${u.id.toLowerCase()}@hospital.org`}
                        </div>
                        <div className="text-[10px] text-gray-400 font-mono flex items-center gap-1.5 mt-0.5">
                          <Phone className="w-3 h-3 text-emerald-400 flex-shrink-0" />
                          {u.phone || "+94 77 000 0000"} ({u.extension || "Ext. 1000"})
                        </div>
                      </td>
                      <td className="p-3">
                        {u.mfa_required !== false ? (
                          <span className="bg-slate-800 border border-cyan-600/50 text-cyan-300 px-2.5 py-1 rounded text-[10px] font-sans font-bold flex items-center gap-1 w-max">
                            <Shield className="w-3 h-3 text-cyan-400" />
                            2FA / Smart Card
                          </span>
                        ) : (
                          <span className="bg-slate-800 border border-gray-700 text-gray-400 px-2.5 py-1 rounded text-[10px] font-sans font-bold flex items-center gap-1 w-max">
                            Password Only
                          </span>
                        )}
                      </td>
                      <td className="p-3">
                        {u.status === "Active" ? (
                          <span className="bg-green-950 text-green-300 px-3 py-1 rounded-full text-[10px] font-bold tracking-wider font-sans uppercase inline-block border border-green-600 shadow-sm">
                            Active
                          </span>
                        ) : (
                          <span className="bg-red-950 text-red-300 px-3 py-1 rounded-full text-[10px] font-bold tracking-wider font-sans uppercase inline-block border border-red-600 shadow-sm">
                            Revoked
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-right font-sans">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleEditClick(u)}
                            title="Edit Account Details"
                            className="p-1.5 bg-[#131826] border border-gray-700 hover:border-cyan-500 text-gray-300 hover:text-cyan-400 rounded transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          
                          {/* REVOKE BUTTON: Shows for Active Users */}
                          {u.status !== "Revoked" ? (
                            <button
                              onClick={() => setConfirmAction({ type: 'revoke', userId: u.id, userName: u.name })}
                              title="Suspend Account / Revoke Access"
                              className="p-1.5 bg-[#131826] border border-gray-700 hover:border-amber-500 text-amber-500/80 hover:text-amber-400 rounded transition-colors cursor-pointer"
                            >
                              <Ban className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            /* REACTIVATE BUTTON: Shows for Revoked Users */
                            <button
                              onClick={() => setConfirmAction({ type: 'reactivate', userId: u.id, userName: u.name })}
                              title="Restore Access & Reactivate Account"
                              className="p-1.5 bg-[#131826] border border-gray-700 hover:border-emerald-500 text-emerald-500/80 hover:text-emerald-400 rounded transition-colors cursor-pointer"
                            >
                              <UserCheck className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* PERMANENT DELETE BUTTON: Always available to remove any account including Revoked ones */}
                          <button
                            onClick={() => setConfirmAction({ type: 'delete', userId: u.id, userName: u.name })}
                            title="Permanently Delete Account from Database"
                            className="p-1.5 bg-[#131826] border border-gray-700 hover:border-rose-500 text-rose-500/80 hover:text-rose-400 rounded transition-colors cursor-pointer"
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

        {/* C. HIPAA Audit Monitoring (Security Logs) 🔒 */}
        <div className="bg-[#252841] border border-gray-700 rounded-lg shadow-xl p-6 flex flex-col mb-4">
          <div className="flex justify-between items-center mb-6 border-b border-gray-700 pb-3">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-rose-400" />
              <div>
                <h2 className="text-sm font-bold text-slate-100 uppercase tracking-widest">Real-Time HIPAA Access Logs</h2>
                <p className="text-[10px] text-gray-400 font-mono mt-0.5">Immutable audit trail synchronized with MongoDB</p>
              </div>
            </div>
            <span className="text-xs font-mono text-rose-400 bg-rose-950/40 border border-rose-800/50 px-3 py-1 rounded flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
              IMMUTABLE SECURITY LEDGER
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-700 text-gray-400 text-xs uppercase bg-[#1a1c2c]/50">
                  <th className="p-3 font-bold">Timestamp</th>
                  <th className="p-3 font-bold">Staff ID</th>
                  <th className="p-3 font-bold">Action</th>
                  <th className="p-3 font-bold">IP Address</th>
                  <th className="p-3 font-bold">Severity</th>
                </tr>
              </thead>
              <tbody className="text-xs font-mono divide-y divide-gray-700/60">
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
                      className={`transition-colors ${log.suspicious ? 'bg-rose-950/30 border-l-4 border-rose-500 hover:bg-rose-900/40' : 'hover:bg-[#1a1c2c]/40'}`}
                    >
                      <td className="p-3 text-slate-400">{log.time}</td>
                      <td className="p-3 text-cyan-400 font-bold">{log.staffId}</td>
                      <td className="p-3 text-slate-200 font-sans">{log.action}</td>
                      <td className="p-3 text-emerald-400 font-semibold">{log.ip}</td>
                      <td className="p-3">
                        <span className={`px-2.5 py-1 rounded text-[10px] font-bold tracking-wider font-sans uppercase inline-block ${log.severity === 'Critical' ? 'bg-rose-900 text-rose-200 border border-rose-600' : log.severity === 'High' ? 'bg-amber-900 text-amber-200 border border-amber-600' : 'bg-slate-800 text-slate-300 border border-gray-700'}`}>
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

        {/* CUSTOM CONFIRMATION POP-UP MODAL (No window.confirm alert) */}
        {confirmAction && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-[#252841] border border-gray-700 rounded-xl shadow-2xl w-full max-w-md flex flex-col overflow-hidden my-8">
              <div className={`flex items-center justify-between p-5 border-b border-gray-700 ${confirmAction.type === 'revoke' ? 'bg-amber-950/30' : confirmAction.type === 'reactivate' ? 'bg-emerald-950/30' : 'bg-rose-950/30'}`}>
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg border ${confirmAction.type === 'revoke' ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' : confirmAction.type === 'reactivate' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-rose-500/10 border-rose-500/30 text-rose-400'}`}>
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-100 uppercase tracking-widest">
                      {confirmAction.type === 'revoke' ? "Suspend Staff Account" : confirmAction.type === 'reactivate' ? "Reactivate Staff Account" : "Permanent Account Deletion"}
                    </h3>
                    <p className="text-[10px] text-gray-400 font-mono mt-0.5">Authorization & Security Confirmation</p>
                  </div>
                </div>
                <button onClick={() => setConfirmAction(null)} className="text-gray-400 hover:text-white transition-colors cursor-pointer p-1 hover:bg-gray-800 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 bg-[#1a1c2c]/50 border-b border-gray-700/60">
                <p className="text-sm text-slate-200 font-sans leading-relaxed">
                  {confirmAction.type === 'revoke' 
                    ? `Are you sure you want to suspend the account and revoke access for ${confirmAction.userName} (${confirmAction.userId})?`
                    : confirmAction.type === 'reactivate'
                    ? `Are you sure you want to restore access and reactivate the account for ${confirmAction.userName} (${confirmAction.userId})?`
                    : `Are you sure you want to permanently delete the account for ${confirmAction.userName} (${confirmAction.userId})?`}
                </p>
                <div className={`mt-4 p-3 rounded text-xs font-mono border ${confirmAction.type === 'revoke' ? 'bg-amber-950/20 border-amber-600/30 text-amber-300' : confirmAction.type === 'reactivate' ? 'bg-emerald-950/20 border-emerald-600/30 text-emerald-300' : 'bg-rose-950/20 border-rose-600/30 text-rose-300'}`}>
                  {confirmAction.type === 'revoke' 
                    ? "Notice: This will disable clinical login tokens immediately, but preserve audit history."
                    : confirmAction.type === 'reactivate'
                    ? "Notice: This will restore hospital login tokens and grant full access to the clinical AI pipeline."
                    : "Warning: This action is irreversible. The staff profile will be permanently removed from MongoDB."}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 p-4 bg-[#131826]">
                <button
                  type="button"
                  onClick={() => setConfirmAction(null)}
                  className="px-4 py-2 bg-[#1a1c2c] border border-gray-700 hover:bg-gray-700 text-slate-300 rounded text-xs uppercase font-bold tracking-wider transition-all cursor-pointer shadow"
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

        {/* MODAL POPUP: Real-World Enterprise Hospital Physician Credentialing & Editing */}
        {showModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-200 overflow-y-auto">
            <div className="bg-[#252841] border border-gray-700 rounded-xl shadow-2xl w-full max-w-3xl flex flex-col overflow-hidden my-8">
              
              <div className="flex items-center justify-between p-6 border-b border-gray-700 bg-[#1a1c2c]">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 rounded-lg shadow-inner">
                    <Stethoscope className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-100 uppercase tracking-widest">
                      {isEditMode ? "Modify Physician Account Details" : "Enterprise Physician Onboarding & Credentialing"}
                    </h3>
                    <p className="text-xs text-gray-400 font-mono mt-0.5">
                      {isEditMode ? `Updating credentials & role for Staff ID ${editingUserId}` : "Official Staff Enrollment for HepatoAI Platform & Hospital Database"}
                    </p>
                  </div>
                </div>
                <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-white transition-colors cursor-pointer p-2 hover:bg-gray-800 rounded-lg">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleProvisionSubmit} className="p-8 flex flex-col gap-8 max-h-[80vh] overflow-y-auto custom-scrollbar">
                
                {/* SECTION 1: Personal & Professional Identity */}
                <div className="flex flex-col gap-4 bg-[#1a1c2c]/50 p-5 rounded-lg border border-gray-700/60">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-cyan-400 flex items-center gap-2 border-b border-gray-700/60 pb-2">
                    <Award className="w-4 h-4 text-cyan-400" />
                    1. Physician Identity & Professional Credentials
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex flex-col gap-1 md:col-span-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Physician Full Name & Title</label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        placeholder="e.g. Prof. Dr. Alexander Vance"
                        className="w-full bg-[#131826] border border-gray-700 rounded px-3 py-2.5 text-xs text-slate-200 placeholder-gray-600 focus:outline-none focus:border-cyan-500 font-sans font-bold"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Medical Credentials</label>
                      <input
                        type="text"
                        required
                        value={formData.credentials}
                        onChange={(e) => setFormData({...formData, credentials: e.target.value})}
                        placeholder="e.g. MD, PhD, FACS"
                        className="w-full bg-[#131826] border border-gray-700 rounded px-3 py-2.5 text-xs text-amber-400 font-mono focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Medical Council / Board Registration Number</label>
                    <input
                      type="text"
                      required
                      value={formData.license_number}
                      onChange={(e) => setFormData({...formData, license_number: e.target.value})}
                      placeholder="e.g. SLMC-89412 or GMC-70481"
                      className="w-full bg-[#131826] border border-gray-700 rounded px-3 py-2.5 text-xs text-slate-300 font-mono focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>

                {/* SECTION 2: Hospital Affiliation & Role */}
                <div className="flex flex-col gap-4 bg-[#1a1c2c]/50 p-5 rounded-lg border border-gray-700/60">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-cyan-400 flex items-center gap-2 border-b border-gray-700/60 pb-2">
                    <Stethoscope className="w-4 h-4 text-cyan-400" />
                    2. Hospital Affiliation & Clinical Assignment
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Assigned Staff ID {isEditMode && "(Immutable)"}</label>
                      <input
                        type="text"
                        required
                        disabled={isEditMode}
                        value={formData.id}
                        onChange={(e) => setFormData({...formData, id: e.target.value})}
                        className={`w-full bg-[#131826] border border-gray-700 rounded px-3 py-2.5 text-xs text-cyan-400 font-mono font-bold focus:outline-none focus:border-cyan-500 ${isEditMode ? 'opacity-75 cursor-not-allowed' : ''}`}
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Primary Department</label>
                      <select
                        value={formData.dept}
                        onChange={(e) => setFormData({...formData, dept: e.target.value})}
                        className="w-full bg-[#131826] border border-gray-700 rounded px-3 py-2.5 text-xs text-slate-200 font-sans font-semibold focus:outline-none focus:border-cyan-500"
                      >
                        <option value="Radiology">Radiology (Diagnostic & MPR)</option>
                        <option value="Oncology">Oncology (Cancer Institute)</option>
                        <option value="Hepatology">Hepatology & Hepatic Resection</option>
                        <option value="Interventional Radiology">Interventional Radiology</option>
                        <option value="Hepatobiliary Surgery">Hepatobiliary Surgery</option>
                      </select>
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Institutional Access Level</label>
                      <input
                        type="text"
                        required
                        value={formData.level}
                        onChange={(e) => setFormData({...formData, level: e.target.value})}
                        placeholder="e.g. Chief Oncologist"
                        className="w-full bg-[#131826] border border-gray-700 rounded px-3 py-2.5 text-xs text-purple-300 font-sans font-bold focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Subspecialty / AI Prognostic Focus Area</label>
                    <input
                      type="text"
                      required
                      value={formData.subspecialty}
                      onChange={(e) => setFormData({...formData, subspecialty: e.target.value})}
                      placeholder="e.g. Hepatic Recurrence Prognosis & 3D Volumetrics"
                      className="w-full bg-[#131826] border border-gray-700 rounded px-3 py-2.5 text-xs text-slate-300 font-sans focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>

                {/* SECTION 3: Contact & Secure Communications */}
                <div className="flex flex-col gap-4 bg-[#1a1c2c]/50 p-5 rounded-lg border border-gray-700/60">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-cyan-400 flex items-center gap-2 border-b border-gray-700/60 pb-2">
                    <Phone className="w-4 h-4 text-cyan-400" />
                    3. Secure Communication & 2FA Dispatch Parameters
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex flex-col gap-1 md:col-span-1">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Official Hospital Email</label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        placeholder="dr.name@hospital.org"
                        className="w-full bg-[#131826] border border-gray-700 rounded px-3 py-2.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                    <div className="flex flex-col gap-1 md:col-span-1">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Direct Mobile / WhatsApp (MFA OTP)</label>
                      <input
                        type="text"
                        required
                        value={formData.phone}
                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                        placeholder="+94 76 622 7387"
                        className="w-full bg-[#131826] border border-gray-700 rounded px-3 py-2.5 text-xs text-emerald-400 font-mono focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                    <div className="flex flex-col gap-1 md:col-span-1">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Hospital Intercom / Extension</label>
                      <input
                        type="text"
                        required
                        value={formData.extension}
                        onChange={(e) => setFormData({...formData, extension: e.target.value})}
                        placeholder="Ext. 4402"
                        className="w-full bg-[#131826] border border-gray-700 rounded px-3 py-2.5 text-xs text-slate-300 font-mono focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                  </div>
                </div>

                {/* SECTION 4: System Security & Audit Parameters */}
                <div className="flex flex-col gap-4 bg-[#1a1c2c]/50 p-5 rounded-lg border border-gray-700/60">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-cyan-400 flex items-center gap-2 border-b border-gray-700/60 pb-2">
                    <Shield className="w-4 h-4 text-cyan-400" />
                    4. Authentication, Compliance & Account Security
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Account Lifecycle Status</label>
                      <select
                        value={formData.status}
                        onChange={(e) => setFormData({...formData, status: e.target.value})}
                        className="w-full bg-[#131826] border border-gray-700 rounded px-3 py-2.5 text-xs text-green-400 font-sans font-bold focus:outline-none focus:border-cyan-500"
                      >
                        <option value="Active">Active & Fully Authorized</option>
                        <option value="Revoked">Revoked / Suspended Pending Audit</option>
                      </select>
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                        {isEditMode ? "New Login Password (Leave blank to keep current)" : "Initial Temporary Login Password"}
                      </label>
                      <input
                        type="password"
                        required={!isEditMode}
                        value={formData.password}
                        onChange={(e) => setFormData({...formData, password: e.target.value})}
                        placeholder={isEditMode ? "•••••••••••• (Unchanged)" : "••••••••••••"}
                        className="w-full bg-[#131826] border border-gray-700 rounded px-3 py-2.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 bg-[#131826] p-4 rounded border border-gray-700 mt-2">
                    <input 
                      type="checkbox" 
                      id="mfa_mandate"
                      checked={formData.mfa_required} 
                      onChange={(e) => setFormData({...formData, mfa_required: e.target.checked})}
                      className="w-4 h-4 accent-cyan-500 rounded cursor-pointer" 
                    />
                    <label htmlFor="mfa_mandate" className="text-xs text-gray-300 font-mono cursor-pointer select-none">
                      <span className="text-cyan-400 font-bold block mb-0.5 font-sans uppercase tracking-wider">MANDATE SMART CARD & 2FA MULTI-FACTOR AUTHENTICATION</span>
                      Enforce high-assurance hardware token verification upon first login to comply with HIPAA regulations.
                    </label>
                  </div>
                </div>

                {/* Confirm Action Button */}
                <div className="flex items-center justify-end gap-4 mt-2 border-t border-gray-700 pt-6">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-6 py-3 bg-[#131826] border border-gray-700 hover:bg-gray-700 text-slate-300 rounded text-xs uppercase font-bold tracking-widest transition-all cursor-pointer shadow"
                  >
                    Discard & Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-8 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded text-xs uppercase font-bold tracking-widest shadow-xl hover:shadow-cyan-500/40 transition-all flex items-center gap-2 cursor-pointer"
                  >
                    {submitting ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                        {isEditMode ? "Saving Modifications..." : "Executing Enrollment..."}
                      </>
                    ) : (
                      isEditMode ? "Confirm & Save Changes" : "Confirm Enterprise Provisioning"
                    )}
                  </button>
                </div>

              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
