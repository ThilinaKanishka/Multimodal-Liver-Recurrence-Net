import React, { useState, useEffect } from "react";
import axios from "axios";
import { Server, Database, Activity, Users, ShieldAlert, Plus, Lock, RefreshCw, ArrowLeft, X, CheckCircle, Shield, Mail, Phone, Stethoscope, Award, FileText, Edit2, Trash2 } from "lucide-react";

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

  const handleDeleteClick = (userId: string, userName: string) => {
    if (window.confirm(`Are you sure you want to revoke and delete the account for ${userName} (${userId})?`)) {
      setLoading(true);
      axios.delete(`http://127.0.0.1:8000/api/v1/admin/users/${userId}`)
        .then(res => {
          fetchAdminData();
        })
        .catch(err => {
          console.error("Delete Error:", err);
          setLoading(false);
        });
    }
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
    <div className="flex-1 p-8 bg-[#1a1c2c] text-slate-200 font-sans flex flex-col h-full overflow-y-auto custom-scrollbar relative">
      
      {/* Top Header Section */}
      <div className="flex items-center justify-between mb-8 border-b border-gray-700 pb-4">
        <div className="flex items-center gap-4">
          {onBack && (
            <button 
              onClick={onBack} 
              className="p-2 bg-[#252841] border border-gray-700 hover:bg-gray-700 text-slate-300 rounded transition-all shadow-md group flex items-center gap-1.5 text-xs font-mono uppercase cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              Exit Console
            </button>
          )}
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
                        <button
                          onClick={() => handleDeleteClick(u.id, u.name)}
                          title="Revoke & Delete Account"
                          className="p-1.5 bg-[#131826] border border-gray-700 hover:border-rose-500 text-gray-300 hover:text-rose-400 rounded transition-colors cursor-pointer"
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
                    <td className="p-3 text-slate-400">{log.ip}</td>
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
  );
};
