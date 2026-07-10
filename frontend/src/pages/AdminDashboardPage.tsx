import React, { useState, useEffect } from "react";
import axios from "axios";
import { getGravatarUrl } from "../utils/gravatar";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import ForgotPassword from "../components/ForgotPassword";
import { Server, Database, Activity, Users, ShieldAlert, Plus, Lock, RefreshCw, ArrowLeft, X, CheckCircle, Shield, Mail, Phone, Stethoscope, Award, FileText, Edit2, Ban, Trash2, LayoutDashboard, Settings, LogOut, Hexagon, AlertTriangle, UserCheck, Sun, Moon, Eye, User, Calendar, Building2, ChevronLeft, ChevronRight, Bell, ChevronDown, MessageSquare, Cpu, Cloud, Network } from "lucide-react";
import { AdminMessages } from "../components/AdminMessages";

export const AdminDashboardPage: React.FC<{ onBack?: () => void }> = ({ onBack }) => {
  // Tab Navigation State
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'USER_ACCESS' | 'HIPAA_AUDITS' | 'SYSTEM_CONFIG' | 'DOCTOR_ANALYTICS' | 'MESSAGES' | 'FINANCIAL_AUDIT'>(() => {
    return (sessionStorage.getItem("hepatoai_admin_active_tab") as any) || 'OVERVIEW';
  });

  useEffect(() => {
    sessionStorage.setItem("hepatoai_admin_active_tab", activeTab);
  }, [activeTab]);

  // Theme Toggle State with localStorage persistence
  const [theme, setTheme] = useState<'DARK' | 'LIGHT'>(() => {
    return (localStorage.getItem("hepatoai_admin_theme") as 'DARK' | 'LIGHT') || 'DARK';
  });

  useEffect(() => {
    localStorage.setItem("hepatoai_admin_theme", theme);
  }, [theme]);
  
  // Currency State with localStorage persistence
  const [currency, setCurrency] = useState<'USD' | 'LKR' | 'EUR'>(() => {
    return (localStorage.getItem("hepatoai_admin_currency") as 'USD' | 'LKR' | 'EUR') || 'USD';
  });

  useEffect(() => {
    localStorage.setItem("hepatoai_admin_currency", currency);
  }, [currency]);
  
  // Sidebar Collapse State
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    return sessionStorage.getItem("hepatoai_admin_sidebar_collapsed") === "true";
  });

  const toggleSidebar = () => {
    const newState = !isSidebarCollapsed;
    setIsSidebarCollapsed(newState);
    sessionStorage.setItem("hepatoai_admin_sidebar_collapsed", String(newState));
  };

  const [users, setUsers] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [adminPasswordInput, setAdminPasswordInput] = useState("");
  const [adminPasswordMsg, setAdminPasswordMsg] = useState("");
  
  // Real-time Clock State
  const [currentTime, setCurrentTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  const timeString = currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const dateString = currentTime.toLocaleDateString([], { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
  
  // Pagination State
  const [userCurrentPage, setUserCurrentPage] = useState(1);
  const [userItemsPerPage] = useState(5);
  const [auditCurrentPage, setAuditCurrentPage] = useState(1);
  const [auditItemsPerPage] = useState(6);

  // Derived Pagination Data
  const userTotalPages = Math.ceil(users.length / userItemsPerPage);
  const paginatedUsers = users.slice((userCurrentPage - 1) * userItemsPerPage, userCurrentPage * userItemsPerPage);

  const auditTotalPages = Math.ceil(logs.length / auditItemsPerPage);
  const paginatedLogs = logs.slice((auditCurrentPage - 1) * auditItemsPerPage, auditCurrentPage * auditItemsPerPage);

  const [overviewAuditCurrentPage, setOverviewAuditCurrentPage] = useState(1);
  const [overviewAuditItemsPerPage] = useState(5);
  const overviewAuditTotalPages = Math.ceil(logs.length / overviewAuditItemsPerPage);
  const paginatedOverviewLogs = logs.slice((overviewAuditCurrentPage - 1) * overviewAuditItemsPerPage, overviewAuditCurrentPage * overviewAuditItemsPerPage);

  const [doctorStats, setDoctorStats] = useState<any[]>([]);
  const [stats, setStats] = useState({
    ai_server_status: "Python API: ONLINE",
    api_latency: "42ms",
    database_status: "MongoDB: Secure",
    storage_usage: "78% Capacity",
    scans_processed_today: 0,
    total_users: 0,
    active_users: 0
  });

  const [unreadSupportCount, setUnreadSupportCount] = useState(0);

  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const res = await axios.get('http://127.0.0.1:8000/api/messages/conversations/ST-ADMIN');
        let count = 0;
        res.data.conversations.forEach((c: any) => {
          count += c.unread_count;
        });
        setUnreadSupportCount(count);
      } catch (err) {}
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 3000);
    return () => clearInterval(interval);
  }, []);

  const [loading, setLoading] = useState(false);
  // Modals state
  const [showModal, setShowModal] = useState(false);
  const [showProvisionModal, setShowProvisionModal] = useState(false);
  const [showAccountSettings, setShowAccountSettings] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
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
    phone: "",
    extension: "",
    status: "Active",
    mfa_required: true,
    password: "",
    signature: ""
  });
  const [submitting, setSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [processingPayment, setProcessingPayment] = useState<string | null>(null);
  const [processedPayments, setProcessedPayments] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (formData.email && formData.email.includes('@')) {
      getGravatarUrl(formData.email, 80).then(setAvatarPreview);
    } else {
      setAvatarPreview(null);
    }
  }, [formData.email]);

  const fetchAdminData = (showLoading = true) => {
    if (showLoading) setLoading(true);
    Promise.all([
      axios.get("http://127.0.0.1:8000/api/v1/admin/stats"),
      axios.get("http://127.0.0.1:8000/api/v1/admin/users"),
      axios.get("http://127.0.0.1:8000/api/v1/admin/audit-logs"),
      axios.get("http://127.0.0.1:8000/api/v1/admin/doctor-stats")
    ]).then(async ([statsRes, usersRes, logsRes, doctorStatsRes]) => {
      setStats(statsRes.data);
      
      const usersWithAvatars = await Promise.all(usersRes.data.map(async (u: any) => {
         u.avatar_url = await getGravatarUrl(u.email, 100, u.name);
         return u;
      }));
      setUsers(usersWithAvatars);
      
      setLogs(logsRes.data);
      
      const doctorsWithAvatars = await Promise.all(doctorStatsRes.data.map(async (doc: any) => {
         doc.avatar_url = await getGravatarUrl(doc.email, 100, doc.name);
         return doc;
      }));
      setDoctorStats(doctorsWithAvatars);
      if (showLoading) setLoading(false);
    }).catch(err => {
      console.error("Admin Fetch Error:", err);
      if (showLoading) setLoading(false);
    });
  };

  const downloadDoctorStatsCSV = () => {
    const headers = ["ID", "Name", "Department", "Scans Processed", "Accuracy Rate", "Status"];
    const csvContent = [
      headers.join(","),
      ...doctorStats.map(d => [d.id, d.name, d.dept, d.scans, d.accuracy, d.status].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `doctor_analytics_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const handleProcessPayroll = async (doc: any, amount: number) => {
    try {
      setProcessingPayment(doc.id);
      await axios.post("http://127.0.0.1:8000/api/v1/admin/process-payroll", {
        doctor_id: doc.id,
        doctor_name: doc.name,
        email: doc.email,
        patients_seen: doc.patients_seen,
        amount: amount,
        currency: currency
      });
      setProcessedPayments(prev => ({ ...prev, [doc.id]: true }));
      setToastMessage(`Payment processed for Dr. ${doc.name}`);
      setTimeout(() => setToastMessage(null), 3000);
      fetchAdminData(false); // Refresh logs
    } catch (err) {
      console.error(err);
      alert("Failed to process payment");
    } finally {
      setProcessingPayment(null);
    }
  };

  useEffect(() => {
    fetchAdminData(true);
    
    // Enable Real-Time polling for active staff and system logs
    const interval = setInterval(() => {
      fetchAdminData(false);
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);

  const handleForceLogout = async (userId: string) => {
    try {
      await axios.post("http://127.0.0.1:8000/api/logout", { id: userId });
      fetchAdminData(false);
    } catch (e) {
      console.error("Force logout failed", e);
    }
  };

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
      phone: "",
      extension: "Ext. 2100",
      status: "Active",
      mfa_required: true,
      password: "",
      signature: ""
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
      phone: u.phone || "",
      extension: u.extension || "Ext. 1000",
      status: u.status || "Active",
      mfa_required: u.mfa_required !== false,
      password: "", // Keep blank unless updating
      signature: u.signature || ""
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

  const handleProvisionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (isEditMode && editingUserId) {
        // ── Edit Mode: update existing user record ──────────────────────────
        await axios.put(
          `http://127.0.0.1:8000/api/v1/admin/users/${editingUserId}`,
          formData
        );
        setSubmitting(false);
        setShowModal(false);
        setIsEditMode(false);
        setEditingUserId(null);
        fetchAdminData();
      } else {
        // ── Provision Mode: create user + dispatch credential email ─────────
        await axios.post("http://127.0.0.1:8000/api/provision-doctor", formData);

        setSubmitting(false);
        setShowModal(false);

        // Success toast — confirms both DB write and email dispatch
        setToastMessage(
          `✅ Account provisioned & credential email dispatched to ${formData.email}`
        );
        setTimeout(() => setToastMessage(null), 5000);

        // Reset form to clean defaults
        setFormData({
          id: `ST-${Math.floor(1000 + Math.random() * 9000)}`,
          name: "",
          credentials: "MD, FRCR",
          license_number: "SLMC-74920",
          dept: "Radiology",
          level: "Consultant",
          subspecialty: "Diagnostic Volumetric MPR",
          email: "",
          phone: "",
          extension: "",
          status: "Active",
          mfa_required: true,
          password: "",
          signature: "",
        });
        fetchAdminData();
      }
    } catch (err: any) {
      setSubmitting(false);

      // Surface the backend error detail so the IT admin knows what failed
      const backendDetail: string =
        err?.response?.data?.detail ??
        err?.message ??
        "Unknown error. Check backend logs.";

      setToastMessage(`❌ Error: ${backendDetail}`);
      setTimeout(() => setToastMessage(null), 8000);
      console.error("Provision/Update Error:", err);
    }
  };

  return (
    <div className={`flex h-screen overflow-hidden font-sans transition-colors duration-300 ${theme === 'DARK' ? 'bg-[#1a1c2c] text-slate-200' : 'bg-slate-100 text-slate-800'}`}>
      
      {/* FIXED LEFT ADMIN SIDEBAR */}
      <div className={`${isSidebarCollapsed ? 'w-[80px]' : 'w-64'} border-r flex flex-col justify-between flex-shrink-0 h-full shadow-2xl z-20 transition-all duration-300 relative ${theme === 'DARK' ? 'bg-[#131524] border-gray-800' : 'bg-white border-gray-200'}`}>
        
        {/* Collapse Toggle Button */}
        <button 
          onClick={toggleSidebar}
          className={`absolute -right-3 top-6 border rounded-full p-1 z-50 transition-all cursor-pointer ${
            theme === 'DARK' ? 'bg-[#131524] border-cyan-500/30 text-cyan-400 hover:bg-[#1a1c2c] hover:text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.2)]' : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50 hover:text-cyan-600 shadow-md'
          }`}
        >
          {isSidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>

        {/* Brand/Logo Section */}
        <div className={`p-6 border-b transition-colors duration-300 flex items-center justify-center ${theme === 'DARK' ? 'border-gray-800/80 bg-[#131524]' : 'border-gray-100 bg-white'}`}>
          <div className={`flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3'}`}>
            <div className="bg-cyan-500/20 p-1.5 rounded-lg border border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.4)] flex-shrink-0">
              <Hexagon className="w-6 h-6 text-cyan-500" />
            </div>
            {!isSidebarCollapsed && (
              <div className="flex flex-col">
                <span className={`text-xl font-bold tracking-widest uppercase ${theme === 'DARK' ? 'text-slate-100' : 'text-slate-900'}`}>
                  Hepato<span className="text-cyan-500">AI</span>
                </span>
                <span className="text-[10px] font-mono bg-rose-500/20 text-rose-400 border border-rose-500/30 px-2 py-0.5 rounded font-bold tracking-widest w-max mt-1">
                  IT ADMIN CONSOLE
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Links (Admin Specific) */}
        <div className="flex-1 px-4 py-6 space-y-2 overflow-y-auto custom-scrollbar">
          <button 
            onClick={() => setActiveTab('OVERVIEW')}
            title="Overview"
            className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center p-3 rounded-lg' : 'gap-3 px-4 py-3 rounded-r-lg'} font-sans font-bold text-xs uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'OVERVIEW' 
                ? 'bg-gradient-to-r from-cyan-600/20 to-blue-600/10 border-l-4 border-cyan-500 text-cyan-500 shadow-sm' 
                : theme === 'DARK' ? 'text-gray-400 hover:bg-[#1a1c2c]/60 hover:text-slate-200' : 'text-gray-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <LayoutDashboard className={`w-4 h-4 flex-shrink-0 ${activeTab === 'OVERVIEW' ? 'text-cyan-500' : theme === 'DARK' ? 'text-gray-400' : 'text-gray-500'}`} />
            {!isSidebarCollapsed && "Overview"}
          </button>

          <button 
            onClick={() => setActiveTab('USER_ACCESS')}
            title="User Access"
            className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center p-3 rounded-lg' : 'gap-3 px-4 py-3 rounded-r-lg'} font-sans font-bold text-xs uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'USER_ACCESS' 
                ? 'bg-gradient-to-r from-cyan-600/20 to-blue-600/10 border-l-4 border-cyan-500 text-cyan-500 shadow-sm' 
                : theme === 'DARK' ? 'text-gray-400 hover:bg-[#1a1c2c]/60 hover:text-slate-200' : 'text-gray-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <Users className={`w-4 h-4 flex-shrink-0 ${activeTab === 'USER_ACCESS' ? 'text-cyan-500' : theme === 'DARK' ? 'text-gray-400' : 'text-gray-500'}`} />
            {!isSidebarCollapsed && "User Access"}
          </button>

          <button 
            onClick={() => setActiveTab('HIPAA_AUDITS')}
            title="HIPAA Audits"
            className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center p-3 rounded-lg' : 'gap-3 px-4 py-3 rounded-r-lg'} font-sans font-bold text-xs uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'HIPAA_AUDITS' 
                ? 'bg-gradient-to-r from-cyan-600/20 to-blue-600/10 border-l-4 border-cyan-500 text-cyan-500 shadow-sm' 
                : theme === 'DARK' ? 'text-gray-400 hover:bg-[#1a1c2c]/60 hover:text-slate-200' : 'text-gray-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <ShieldAlert className={`w-4 h-4 flex-shrink-0 ${activeTab === 'HIPAA_AUDITS' ? 'text-cyan-500' : theme === 'DARK' ? 'text-gray-400' : 'text-gray-500'}`} />
            {!isSidebarCollapsed && "HIPAA Audits"}
          </button>

          <button 
            onClick={() => setActiveTab('SYSTEM_CONFIG')}
            title="System Config"
            className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center p-3 rounded-lg' : 'gap-3 px-4 py-3 rounded-r-lg'} font-sans font-bold text-xs uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'SYSTEM_CONFIG' 
                ? 'bg-gradient-to-r from-cyan-600/20 to-blue-600/10 border-l-4 border-cyan-500 text-cyan-500 shadow-sm' 
                : theme === 'DARK' ? 'text-gray-400 hover:bg-[#1a1c2c]/60 hover:text-slate-200' : 'text-gray-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <Settings className={`w-4 h-4 flex-shrink-0 ${activeTab === 'SYSTEM_CONFIG' ? 'text-cyan-500' : theme === 'DARK' ? 'text-gray-400' : 'text-gray-500'}`} />
            {!isSidebarCollapsed && "System Config"}
          </button>

          <button 
            onClick={() => setActiveTab('DOCTOR_ANALYTICS')}
            title="Doctor Analytics"
            className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center p-3 rounded-lg' : 'gap-3 px-4 py-3 rounded-r-lg'} font-sans font-bold text-xs uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'DOCTOR_ANALYTICS' 
                ? 'bg-gradient-to-r from-cyan-600/20 to-blue-600/10 border-l-4 border-cyan-500 text-cyan-500 shadow-sm' 
                : theme === 'DARK' ? 'text-gray-400 hover:bg-[#1a1c2c]/60 hover:text-slate-200' : 'text-gray-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <Activity className={`w-4 h-4 flex-shrink-0 ${activeTab === 'DOCTOR_ANALYTICS' ? 'text-cyan-500' : theme === 'DARK' ? 'text-gray-400' : 'text-gray-500'}`} />
            {!isSidebarCollapsed && "Doctor Analytics"}
          </button>
          <button 
            onClick={() => setActiveTab('MESSAGES')}
            title="Support Inbox"
            className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center p-3 rounded-lg' : 'gap-3 px-4 py-3 rounded-r-lg'} font-sans font-bold text-xs uppercase tracking-wider transition-all cursor-pointer mt-2 ${
              activeTab === 'MESSAGES' 
                ? 'bg-gradient-to-r from-cyan-600/20 to-blue-600/10 border-l-4 border-cyan-500 text-cyan-500 shadow-sm' 
                : theme === 'DARK' ? 'text-gray-400 hover:bg-[#1a1c2c]/60 hover:text-slate-200' : 'text-gray-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <div className="relative">
              <MessageSquare className={`w-4 h-4 flex-shrink-0 ${activeTab === 'MESSAGES' ? 'text-cyan-500' : theme === 'DARK' ? 'text-gray-400' : 'text-gray-500'}`} />
              {unreadSupportCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5 items-center justify-center rounded-full bg-rose-500 text-[7px] font-bold text-white shadow-sm ring-1 ring-white/10 animate-pulse">
                  {unreadSupportCount > 9 ? '9+' : unreadSupportCount}
                </span>
              )}
            </div>
            {!isSidebarCollapsed && (
              <span className="flex-1 flex items-center justify-between pr-1">
                Support Inbox
                {unreadSupportCount > 0 && (
                  <span className="bg-rose-500 text-white text-[9px] px-1.5 py-0.5 rounded shadow-sm flex items-center justify-center">
                    {unreadSupportCount} NEW
                  </span>
                )}
              </span>
            )}
          </button>
          <button 
            onClick={() => setActiveTab('FINANCIAL_AUDIT')}
            title="Financial Audit & Payroll"
            className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center p-3 rounded-lg' : 'gap-3 px-4 py-3 rounded-r-lg'} font-sans font-bold text-xs uppercase tracking-wider transition-all cursor-pointer mt-2 ${
              activeTab === 'FINANCIAL_AUDIT' 
                ? 'bg-gradient-to-r from-emerald-600/20 to-teal-600/10 border-l-4 border-emerald-500 text-emerald-500 shadow-sm' 
                : theme === 'DARK' ? 'text-gray-400 hover:bg-[#1a1c2c]/60 hover:text-slate-200' : 'text-gray-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <Database className={`w-4 h-4 flex-shrink-0 ${activeTab === 'FINANCIAL_AUDIT' ? 'text-emerald-500' : theme === 'DARK' ? 'text-gray-400' : 'text-gray-500'}`} />
            {!isSidebarCollapsed && "Financial Audit"}
          </button>
        </div>

        {/* Bottom Action */}
        <div className={`p-4 border-t transition-colors duration-300 flex justify-center ${theme === 'DARK' ? 'border-gray-800/80 bg-[#131524]' : 'border-gray-100 bg-white'}`}>
          <button 
            onClick={onBack} 
            title="Exit Console"
            className={`w-full flex items-center justify-center ${isSidebarCollapsed ? 'p-3' : 'gap-2 px-4 py-3'} border rounded-lg font-mono text-xs uppercase font-bold tracking-wider transition-all cursor-pointer shadow-md group ${
              theme === 'DARK' 
                ? 'bg-[#1a1c2c] border-gray-700 hover:bg-rose-950/40 hover:border-rose-800 text-gray-300 hover:text-rose-200' 
                : 'bg-slate-50 border-gray-200 hover:bg-rose-50 hover:border-rose-200 text-gray-700 hover:text-rose-600'
            }`}
          >
            <LogOut className={`w-4 h-4 text-rose-500 ${!isSidebarCollapsed && 'group-hover:-translate-x-0.5'} transition-transform`} />
            {!isSidebarCollapsed && "Exit Console"}
          </button>
        </div>
      </div>

      {/* RIGHT SIDE MAIN DASHBOARD CONTENT */}
      <div className={`flex-1 p-8 font-sans flex flex-col h-full overflow-y-auto custom-scrollbar relative z-10 transition-colors duration-300 ${theme === 'DARK' ? 'bg-[#1a1c2c] text-slate-200' : 'bg-slate-100 text-slate-800'}`}>
        
        {/* Dynamic Success / Error Toast */}
        {toastMessage && (
          <div className={`mb-6 flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg text-sm font-semibold animate-bounce ${
            toastMessage.startsWith("❌")
              ? "bg-rose-600 text-white"
              : "bg-emerald-500 text-white"
          }`}>
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

          <div className="flex items-center gap-4">
            
            {/* Clock Widget */}
            <div className={`hidden md:flex flex-col items-end justify-center mr-2 ${theme === 'DARK' ? 'text-gray-400' : 'text-gray-500'}`}>
              <span className="text-xs font-bold font-mono tracking-wider">{timeString}</span>
              <span className="text-[9px] uppercase tracking-widest">{dateString}</span>
            </div>

            <div className={`h-6 w-px mx-1 hidden md:block ${theme === 'DARK' ? 'bg-gray-700' : 'bg-gray-300'}`}></div>
            
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
                  <span className="hidden xl:inline">Light Mode</span>
                </>
              ) : (
                <>
                  <Moon className="w-3.5 h-3.5 text-indigo-600" />
                  <span className="hidden xl:inline">Dark Mode</span>
                </>
              )}
            </button>

            <button 
              onClick={() => fetchAdminData(true)}
              className={`flex items-center gap-2 px-3 py-1.5 border rounded text-xs font-mono shadow-sm transition-all cursor-pointer hidden lg:flex ${
                theme === 'DARK' 
                  ? 'bg-[#252841] border-gray-700 hover:bg-gray-700 text-gray-300' 
                  : 'bg-white border-gray-300 hover:bg-gray-100 text-gray-700'
              }`}
            >
              <RefreshCw className={`w-3.5 h-3.5 text-cyan-500 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden xl:inline">{loading ? "Syncing..." : "Live Sync Active"}</span>
            </button>

            <div className={`h-6 w-px mx-1 ${theme === 'DARK' ? 'bg-gray-700' : 'bg-gray-300'}`}></div>

            {/* Notification Bell */}
            <div className="relative group pb-2 -mb-2 mr-1">
              <div className="relative cursor-pointer hover:scale-105 transition-transform mt-2">
                <Bell className={`w-5 h-5 ${theme === 'DARK' ? 'text-gray-400 group-hover:text-white' : 'text-gray-600 group-hover:text-black'} transition-colors`} />
                <span className="absolute -top-1.5 -right-1.5 bg-blue-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full shadow-sm">3</span>
              </div>
              
              {/* Notification Dropdown */}
              <div className={`absolute right-0 top-[100%] mt-2 w-72 border rounded-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 transform origin-top-right scale-95 group-hover:scale-100 ${theme === 'DARK' ? 'bg-[#131524] border-gray-700' : 'bg-white border-gray-200'}`}>
                <div className={`p-3 border-b flex justify-between items-center ${theme === 'DARK' ? 'border-gray-800' : 'border-gray-100'}`}>
                  <span className={`font-bold text-sm ${theme === 'DARK' ? 'text-slate-200' : 'text-slate-800'}`}>System Alerts</span>
                  <span className="text-[10px] bg-blue-500 text-white px-2 py-0.5 rounded-full">3 New</span>
                </div>
                <div className="max-h-64 overflow-y-auto custom-scrollbar">
                  <div className={`p-3 border-b cursor-pointer transition-colors ${theme === 'DARK' ? 'border-gray-800 hover:bg-[#1a1c2c]' : 'border-gray-100 hover:bg-slate-50'}`}>
                    <p className={`text-xs font-semibold ${theme === 'DARK' ? 'text-slate-200' : 'text-slate-800'}`}>Database Sync Completed</p>
                    <p className="text-[10px] text-slate-500 mt-1">All clinical records synchronized successfully.</p>
                    <p className="text-[9px] text-cyan-500 mt-1">2 mins ago</p>
                  </div>
                  <div className={`p-3 border-b cursor-pointer transition-colors ${theme === 'DARK' ? 'border-gray-800 hover:bg-[#1a1c2c]' : 'border-gray-100 hover:bg-slate-50'}`}>
                    <p className={`text-xs font-semibold ${theme === 'DARK' ? 'text-slate-200' : 'text-slate-800'}`}>New Doctor Provisioned</p>
                    <p className="text-[10px] text-slate-500 mt-1">Dr. Sarah Jenkins was added to the Radiology dept.</p>
                    <p className="text-[9px] text-cyan-500 mt-1">1 hour ago</p>
                  </div>
                  <div className={`p-3 cursor-pointer transition-colors ${theme === 'DARK' ? 'hover:bg-[#1a1c2c]' : 'hover:bg-slate-50'}`}>
                    <p className={`text-xs font-semibold ${theme === 'DARK' ? 'text-slate-200' : 'text-slate-800'}`}>Security Audit Logged</p>
                    <p className="text-[10px] text-slate-500 mt-1">Weekly HIPAA compliance check passed.</p>
                    <p className="text-[9px] text-cyan-500 mt-1">5 hours ago</p>
                  </div>
                </div>
                <div className={`p-2 border-t text-center ${theme === 'DARK' ? 'border-gray-800' : 'border-gray-100'}`}>
                  <button className="text-xs text-cyan-500 hover:text-cyan-600 font-bold transition-colors">Mark all as read</button>
                </div>
              </div>
            </div>

            <div className={`h-6 w-px mx-1 ${theme === 'DARK' ? 'bg-gray-700' : 'bg-gray-300'}`}></div>

            {/* Profile Dropdown */}
            <div className="relative group pb-2 -mb-2"> {/* Padding to prevent hover loss */}
              <div className="flex items-center gap-2 cursor-pointer pl-1">
                <div className="w-9 h-9 rounded-full border-2 border-emerald-400/60 bg-cyan-500/10 flex items-center justify-center overflow-hidden flex-shrink-0">
                   <User className="w-5 h-5 text-cyan-500" fill="currentColor" />
                </div>
                <div className="flex flex-col hidden sm:flex justify-center">
                  <span className={`text-sm font-bold ${theme === 'DARK' ? 'text-slate-200' : 'text-slate-800'} leading-none`}>Admin</span>
                  <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest mt-1 leading-none">ADMIN</span>
                </div>
                <ChevronDown className={`w-4 h-4 ${theme === 'DARK' ? 'text-gray-400' : 'text-gray-500'} ml-1 hidden sm:block`} />
              </div>

              {/* Dropdown Menu Container */}
              <div className={`absolute right-0 top-[100%] mt-2 w-64 border rounded-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 transform origin-top-right scale-95 group-hover:scale-100 ${theme === 'DARK' ? 'bg-[#131524] border-gray-700' : 'bg-white border-gray-200'}`}>
                
                {/* User Info Header */}
                <div className={`p-4 rounded-t-xl border-b m-1.5 ${theme === 'DARK' ? 'bg-[#1a1c2c]/80 border-gray-800' : 'bg-slate-50/80 border-gray-200'}`}>
                   <div className="flex items-center gap-3">
                     <div className="w-12 h-12 rounded-full border-2 border-emerald-400/50 bg-cyan-500/10 flex items-center justify-center flex-shrink-0">
                        <User className="w-7 h-7 text-cyan-500" fill="currentColor" />
                     </div>
                     <div className="flex flex-col min-w-0 justify-center">
                       <span className={`text-base font-bold truncate leading-tight ${theme === 'DARK' ? 'text-slate-100' : 'text-slate-800'}`}>Admin</span>
                       <span className={`text-xs truncate mt-0.5 ${theme === 'DARK' ? 'text-gray-400' : 'text-slate-500'}`}>admin@HepatoAI.com</span>
                       <div className="mt-1.5">
                         <span className="text-[10px] bg-blue-500 text-white px-2 py-0.5 rounded-full font-bold tracking-wider shadow-sm">ADMIN</span>
                       </div>
                     </div>
                   </div>
                </div>
                
                {/* Menu Options */}
                <div className="p-2">
                  <button onClick={() => setShowAccountSettings(true)} className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-semibold rounded-lg transition-colors cursor-pointer ${theme === 'DARK' ? 'text-gray-300 hover:bg-[#1a1c2c]' : 'text-gray-700 hover:bg-slate-100'}`}>
                    <Settings className="w-4 h-4 text-emerald-500" />
                    Account Settings
                  </button>
                </div>
                
                <div className={`p-2 border-t ${theme === 'DARK' ? 'border-gray-800' : 'border-gray-100'}`}>
                  <button onClick={onBack} className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm font-bold text-rose-600 rounded-lg transition-colors cursor-pointer shadow-sm ${theme === 'DARK' ? 'bg-rose-950/20 hover:bg-rose-900/30' : 'bg-rose-50 hover:bg-rose-100'}`}>
                    <LogOut className="w-4 h-4" />
                    Logout
                  </button>
                </div>
                
              </div>
            </div>

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

            {/* Currently Logged In Doctors */}
            <div className={`border rounded-lg shadow-md p-6 flex flex-col mb-4 transition-colors duration-300 ${theme === 'DARK' ? 'bg-[#252841] border-gray-700' : 'bg-white border-gray-200'}`}>
              <div className={`flex justify-between items-center mb-6 border-b pb-3 ${theme === 'DARK' ? 'border-gray-700' : 'border-gray-200'}`}>
                <div className="flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-emerald-500" />
                  <div>
                    <h2 className={`text-sm font-bold uppercase tracking-widest ${theme === 'DARK' ? 'text-slate-100' : 'text-slate-900'}`}>Currently Active Staff</h2>
                    <p className={`text-[10px] font-mono mt-0.5 ${theme === 'DARK' ? 'text-gray-400' : 'text-gray-500'}`}>Medical personnel actively logged into the clinical workstation</p>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                {doctorStats.filter(d => d.is_logged_in).length === 0 ? (
                   <div className="col-span-3 text-center text-sm text-gray-500 font-sans p-4">No medical staff are currently active in the system.</div>
                ) : (
                  doctorStats.filter(d => d.is_logged_in).map(doc => (
                    <div key={doc.id} className={`border rounded p-3 flex items-center justify-between gap-3 ${theme === 'DARK' ? 'bg-[#1a1c2c] border-gray-700' : 'bg-slate-50 border-gray-200'}`}>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-cyan-950/50 flex items-center justify-center text-cyan-500 font-bold overflow-hidden flex-shrink-0">
                          {doc.avatar_url ? (
                            <img src={doc.avatar_url} alt={doc?.name || "User"} className="w-full h-full object-cover" />
                          ) : (
                            (doc?.name || "?").charAt(0).toUpperCase()
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className={`font-bold text-sm truncate ${theme === 'DARK' ? 'text-slate-200' : 'text-slate-800'}`}>{doc.name}</div>
                          <div className="text-[10px] text-emerald-500 uppercase font-bold flex items-center gap-1 mt-0.5"><span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span> Active Session</div>
                        </div>
                      </div>
                      <button 
                        onClick={() => handleForceLogout(doc.id)}
                        title="Force Terminate Session"
                        className="px-2.5 py-1.5 bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white border border-rose-500/30 rounded text-[9px] uppercase font-bold tracking-widest transition-colors cursor-pointer flex-shrink-0 shadow-sm"
                      >
                        Revoke
                      </button>
                    </div>
                  ))
                )}
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
                    {paginatedOverviewLogs.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-gray-500 font-sans">
                          No audit logs recorded in MongoDB yet. Actions will be captured here in real-time.
                        </td>
                      </tr>
                    ) : (
                      paginatedOverviewLogs.map((log) => (
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

              {/* Overview Pagination Controls */}
              {overviewAuditTotalPages > 1 && (
                <div className={`mt-4 pt-4 border-t flex items-center justify-end gap-2 ${theme === 'DARK' ? 'border-slate-700/50' : 'border-gray-200'}`}>
                  <button
                    onClick={() => setOverviewAuditCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={overviewAuditCurrentPage === 1}
                    className={`px-3 py-1.5 rounded text-xs font-bold transition-all ${
                      overviewAuditCurrentPage === 1 
                        ? 'opacity-50 cursor-not-allowed text-gray-500' 
                        : theme === 'DARK' ? 'text-gray-400 hover:bg-slate-800 hover:text-white' : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    Previous
                  </button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: overviewAuditTotalPages }).map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setOverviewAuditCurrentPage(idx + 1)}
                        className={`w-7 h-7 flex items-center justify-center rounded text-xs font-bold transition-all ${
                          overviewAuditCurrentPage === idx + 1
                            ? theme === 'DARK' ? 'bg-blue-600/20 text-blue-400 border border-blue-500/50' : 'bg-blue-100 text-blue-600 border border-blue-300'
                            : theme === 'DARK' ? 'text-gray-400 hover:bg-slate-800' : 'text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        {idx + 1}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => setOverviewAuditCurrentPage(prev => Math.min(prev + 1, overviewAuditTotalPages))}
                    disabled={overviewAuditCurrentPage === overviewAuditTotalPages}
                    className={`px-3 py-1.5 rounded text-xs font-bold transition-all ${
                      overviewAuditCurrentPage === overviewAuditTotalPages 
                        ? 'opacity-50 cursor-not-allowed text-gray-500' 
                        : theme === 'DARK' ? 'text-gray-400 hover:bg-slate-800 hover:text-white' : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    Next
                  </button>
                </div>
              )}
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
                  {paginatedUsers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-gray-500 font-sans">
                        No active staff accounts provisioned in MongoDB. Click "+ Provision New Doctor" to enroll personnel.
                      </td>
                    </tr>
                  ) : (
                    paginatedUsers.map((u) => (
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
                            {u.email || "No Email Provided"}
                          </div>
                          <div className={`text-[10px] font-mono flex items-center gap-1.5 mt-0.5 ${theme === 'DARK' ? 'text-gray-400' : 'text-gray-500'}`}>
                            <Phone className="w-3 h-3 text-emerald-500 flex-shrink-0" />
                            {u.phone || "No Mobile"} ({u.extension || "No Ext"})
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

            {/* Pagination Controls */}
            {userTotalPages > 1 && (
              <div className={`mt-4 pt-4 border-t flex items-center justify-end gap-2 ${theme === 'DARK' ? 'border-slate-700/50' : 'border-gray-200'}`}>
                <button
                  onClick={() => setUserCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={userCurrentPage === 1}
                  className={`px-3 py-1.5 rounded text-xs font-bold transition-all ${
                    userCurrentPage === 1 
                      ? 'opacity-50 cursor-not-allowed text-gray-500' 
                      : theme === 'DARK' ? 'text-gray-400 hover:bg-slate-800 hover:text-white' : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  Previous
                </button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: userTotalPages }).map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setUserCurrentPage(idx + 1)}
                      className={`w-7 h-7 flex items-center justify-center rounded text-xs font-bold transition-all ${
                        userCurrentPage === idx + 1
                          ? theme === 'DARK' ? 'bg-blue-600/20 text-blue-400 border border-blue-500/50' : 'bg-blue-100 text-blue-600 border border-blue-300'
                          : theme === 'DARK' ? 'text-gray-400 hover:bg-slate-800' : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      {idx + 1}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setUserCurrentPage(prev => Math.min(prev + 1, userTotalPages))}
                  disabled={userCurrentPage === userTotalPages}
                  className={`px-3 py-1.5 rounded text-xs font-bold transition-all ${
                    userCurrentPage === userTotalPages 
                      ? 'opacity-50 cursor-not-allowed text-gray-500' 
                      : theme === 'DARK' ? 'text-gray-400 hover:bg-slate-800 hover:text-white' : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  Next
                </button>
              </div>
            )}
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
                  {paginatedLogs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-gray-500 font-sans">
                        No audit logs recorded in MongoDB yet. Actions will be captured here in real-time.
                      </td>
                    </tr>
                  ) : (
                    paginatedLogs.map((log) => (
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

            {/* Pagination Controls */}
            {auditTotalPages > 1 && (
              <div className={`mt-4 pt-4 border-t flex items-center justify-end gap-2 ${theme === 'DARK' ? 'border-slate-700/50' : 'border-gray-200'}`}>
                <button
                  onClick={() => setAuditCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={auditCurrentPage === 1}
                  className={`px-3 py-1.5 rounded text-xs font-bold transition-all ${
                    auditCurrentPage === 1 
                      ? 'opacity-50 cursor-not-allowed text-gray-500' 
                      : theme === 'DARK' ? 'text-gray-400 hover:bg-slate-800 hover:text-white' : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  Previous
                </button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: auditTotalPages }).map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setAuditCurrentPage(idx + 1)}
                      className={`w-7 h-7 flex items-center justify-center rounded text-xs font-bold transition-all ${
                        auditCurrentPage === idx + 1
                          ? theme === 'DARK' ? 'bg-blue-600/20 text-blue-400 border border-blue-500/50' : 'bg-blue-100 text-blue-600 border border-blue-300'
                          : theme === 'DARK' ? 'text-gray-400 hover:bg-slate-800' : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      {idx + 1}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setAuditCurrentPage(prev => Math.min(prev + 1, auditTotalPages))}
                  disabled={auditCurrentPage === auditTotalPages}
                  className={`px-3 py-1.5 rounded text-xs font-bold transition-all ${
                    auditCurrentPage === auditTotalPages 
                      ? 'opacity-50 cursor-not-allowed text-gray-500' 
                      : theme === 'DARK' ? 'text-gray-400 hover:bg-slate-800 hover:text-white' : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: SYSTEM_CONFIG TAB */}
        {activeTab === 'SYSTEM_CONFIG' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 animate-in fade-in duration-500">
            
            {/* AI Model Parameters */}
            <div className={`border rounded-lg shadow-md p-6 flex flex-col transition-colors duration-300 relative overflow-hidden group ${theme === 'DARK' ? 'bg-[#252841] border-gray-700 hover:border-cyan-500/50' : 'bg-white border-gray-200 hover:border-cyan-400'}`}>
              <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 blur-[40px] pointer-events-none group-hover:bg-cyan-500/10 transition-colors"></div>
              <div className={`flex justify-between items-center mb-6 border-b pb-3 relative z-10 ${theme === 'DARK' ? 'border-gray-700' : 'border-gray-200'}`}>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-cyan-500/10 rounded-lg border border-cyan-500/20"><Settings className="w-5 h-5 text-cyan-400" /></div>
                  <div>
                    <h2 className={`text-sm font-black uppercase tracking-widest ${theme === 'DARK' ? 'text-slate-100' : 'text-slate-900'}`}>Core AI Parameters</h2>
                    <p className={`text-[10px] font-mono mt-0.5 ${theme === 'DARK' ? 'text-gray-400' : 'text-gray-500'}`}>Inference Confidence Thresholds</p>
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-5 flex-1 relative z-10">
                <div className="flex flex-col gap-2">
                  <label className={`text-[10px] font-bold uppercase tracking-widest ${theme === 'DARK' ? 'text-slate-300' : 'text-slate-700'}`}>High-Risk Confidence Gate</label>
                  <input type="range" min="0" max="100" defaultValue="75" className="enterprise-slider" />
                  <div className={`flex justify-between text-[10px] font-mono ${theme === 'DARK' ? 'text-slate-500' : 'text-slate-400'}`}>
                    <span>Aggressive (50%)</span>
                    <span className="text-cyan-500 font-bold bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">75%</span>
                    <span>Conservative (90%)</span>
                  </div>
                </div>
                
                <div className="flex flex-col gap-2">
                  <label className={`text-[10px] font-bold uppercase tracking-widest ${theme === 'DARK' ? 'text-slate-300' : 'text-slate-700'}`}>Max Inference Batch Size</label>
                  <select className={`w-full border rounded px-3 py-2.5 text-xs font-mono focus:outline-none transition-all shadow-inner ${theme === 'DARK' ? 'bg-[#131826] border-[#1a1c2c] text-slate-300 focus:border-cyan-500/50' : 'bg-slate-50 border-gray-300 text-slate-800 focus:border-cyan-400'}`}>
                    <option>16 Volumes / Batch</option>
                    <option>32 Volumes / Batch</option>
                    <option>64 Volumes / Batch (VRAM Intensive)</option>
                  </select>
                </div>
              </div>
              <div className="mt-6 pt-4 border-t border-dashed border-gray-500/30">
                 <button className={`w-full py-2.5 rounded font-bold text-[10px] uppercase tracking-widest transition-all shadow-md flex items-center justify-center gap-2 ${theme === 'DARK' ? 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-cyan-900/50' : 'bg-cyan-500 hover:bg-cyan-600 text-white shadow-cyan-200'}`}>
                   Save AI Settings
                 </button>
              </div>
            </div>

            {/* Hardware Allocations */}
            <div className={`border rounded-lg shadow-md p-6 flex flex-col transition-colors duration-300 relative overflow-hidden group ${theme === 'DARK' ? 'bg-[#252841] border-gray-700 hover:border-purple-500/50' : 'bg-white border-gray-200 hover:border-purple-400'}`}>
              <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 blur-[40px] pointer-events-none group-hover:bg-purple-500/10 transition-colors"></div>
              <div className={`flex justify-between items-center mb-6 border-b pb-3 relative z-10 ${theme === 'DARK' ? 'border-gray-700' : 'border-gray-200'}`}>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-500/10 rounded-lg border border-purple-500/20"><Cpu className="w-5 h-5 text-purple-400" /></div>
                  <div>
                    <h2 className={`text-sm font-black uppercase tracking-widest ${theme === 'DARK' ? 'text-slate-100' : 'text-slate-900'}`}>Hardware Allocation</h2>
                    <p className={`text-[10px] font-mono mt-0.5 ${theme === 'DARK' ? 'text-gray-400' : 'text-gray-500'}`}>GPU & TensorRT Optimization</p>
                  </div>
                </div>
                <span className="text-[9px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/30 font-bold tracking-widest flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_5px_#10b981]"></div> CUDA OK</span>
              </div>
              <div className="flex flex-col gap-5 flex-1 relative z-10">
                <div className="flex flex-col gap-2">
                  <label className={`text-[10px] font-bold uppercase tracking-widest ${theme === 'DARK' ? 'text-slate-300' : 'text-slate-700'}`}>Active Compute Unit</label>
                  <select className={`w-full border rounded px-3 py-2.5 text-xs font-mono focus:outline-none transition-all shadow-inner ${theme === 'DARK' ? 'bg-[#131826] border-[#1a1c2c] text-slate-300' : 'bg-slate-50 border-gray-300 text-slate-800'}`}>
                    <option>Auto-Detect (CUDA 0)</option>
                    <option>NVIDIA RTX 4090 (Primary)</option>
                    <option>NVIDIA RTX 3090 (Fallback)</option>
                    <option>CPU Only (Slow)</option>
                  </select>
                </div>
                <div className="flex flex-col gap-2">
                  <label className={`text-[10px] font-bold uppercase tracking-widest ${theme === 'DARK' ? 'text-slate-300' : 'text-slate-700'}`}>Precision Mode</label>
                  <select className={`w-full border rounded px-3 py-2.5 text-xs font-mono focus:outline-none transition-all shadow-inner ${theme === 'DARK' ? 'bg-[#131826] border-[#1a1c2c] text-slate-300' : 'bg-slate-50 border-gray-300 text-slate-800'}`}>
                    <option>FP16 (Tensor Cores - Fast)</option>
                    <option>FP32 (High Accuracy)</option>
                    <option>INT8 (Quantized - Ultra Fast)</option>
                  </select>
                </div>
              </div>
              <div className="mt-6 pt-4 border-t border-dashed border-gray-500/30">
                 <button className={`w-full py-2.5 rounded font-bold text-[10px] uppercase tracking-widest transition-all shadow-md flex items-center justify-center gap-2 ${theme === 'DARK' ? 'bg-purple-600/20 hover:bg-purple-600/30 text-purple-400 border border-purple-500/30' : 'bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200'}`}>
                   Restart Compute Engine
                 </button>
              </div>
            </div>

            {/* Cloud & Archival */}
            <div className={`border rounded-lg shadow-md p-6 flex flex-col transition-colors duration-300 relative overflow-hidden group ${theme === 'DARK' ? 'bg-[#252841] border-gray-700 hover:border-blue-500/50' : 'bg-white border-gray-200 hover:border-blue-400'}`}>
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-[40px] pointer-events-none group-hover:bg-blue-500/10 transition-colors"></div>
              <div className={`flex justify-between items-center mb-6 border-b pb-3 relative z-10 ${theme === 'DARK' ? 'border-gray-700' : 'border-gray-200'}`}>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500/10 rounded-lg border border-blue-500/20"><Cloud className="w-5 h-5 text-blue-400" /></div>
                  <div>
                    <h2 className={`text-sm font-black uppercase tracking-widest ${theme === 'DARK' ? 'text-slate-100' : 'text-slate-900'}`}>DICOM Archival</h2>
                    <p className={`text-[10px] font-mono mt-0.5 ${theme === 'DARK' ? 'text-gray-400' : 'text-gray-500'}`}>AWS S3 / Local Retention</p>
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-5 flex-1 relative z-10">
                <div className="flex flex-col gap-2">
                  <label className={`text-[10px] font-bold uppercase tracking-widest ${theme === 'DARK' ? 'text-slate-300' : 'text-slate-700'}`}>Storage Strategy</label>
                  <select className={`w-full border rounded px-3 py-2.5 text-xs font-mono focus:outline-none transition-all shadow-inner ${theme === 'DARK' ? 'bg-[#131826] border-[#1a1c2c] text-slate-300' : 'bg-slate-50 border-gray-300 text-slate-800'}`}>
                    <option>Hybrid (Local + S3 Glacier)</option>
                    <option>Local Only (NAS Storage)</option>
                    <option>Cloud Only (AWS S3 Std)</option>
                  </select>
                </div>
                <div className="flex flex-col gap-2">
                  <label className={`text-[10px] font-bold uppercase tracking-widest ${theme === 'DARK' ? 'text-slate-300' : 'text-slate-700'}`}>Auto-Delete Local Cache</label>
                  <select className={`w-full border rounded px-3 py-2.5 text-xs font-mono focus:outline-none transition-all shadow-inner ${theme === 'DARK' ? 'bg-[#131826] border-[#1a1c2c] text-slate-300' : 'bg-slate-50 border-gray-300 text-slate-800'}`}>
                    <option>After 30 Days</option>
                    <option>After 90 Days</option>
                    <option>Never (Manual Purge)</option>
                  </select>
                </div>
              </div>
              <div className="mt-6 pt-4 border-t border-dashed border-gray-500/30">
                 <button className={`w-full py-2.5 rounded font-bold text-[10px] uppercase tracking-widest transition-all shadow-md flex items-center justify-center gap-2 ${theme === 'DARK' ? 'bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30' : 'bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200'}`}>
                   Sync Archive Now
                 </button>
              </div>
            </div>

            {/* Network & HL7 Interfaces */}
            <div className={`border rounded-lg shadow-md p-6 flex flex-col transition-colors duration-300 relative overflow-hidden group ${theme === 'DARK' ? 'bg-[#252841] border-gray-700 hover:border-emerald-500/50' : 'bg-white border-gray-200 hover:border-emerald-400'}`}>
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-[40px] pointer-events-none group-hover:bg-emerald-500/10 transition-colors"></div>
              <div className={`flex justify-between items-center mb-6 border-b pb-3 relative z-10 ${theme === 'DARK' ? 'border-gray-700' : 'border-gray-200'}`}>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-500/10 rounded-lg border border-emerald-500/20"><Network className="w-5 h-5 text-emerald-400" /></div>
                  <div>
                    <h2 className={`text-sm font-black uppercase tracking-widest ${theme === 'DARK' ? 'text-slate-100' : 'text-slate-900'}`}>EHR / HL7 Gateway</h2>
                    <p className={`text-[10px] font-mono mt-0.5 ${theme === 'DARK' ? 'text-gray-400' : 'text-gray-500'}`}>Hospital API Integration</p>
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-4 flex-1 relative z-10">
                <div className="flex flex-col gap-1">
                  <label className={`text-[10px] font-bold uppercase tracking-widest ${theme === 'DARK' ? 'text-slate-300' : 'text-slate-700'}`}>EHR Endpoint URL</label>
                  <input type="text" defaultValue="https://epic.hospital.internal/api/v1/hl7" className={`w-full border rounded px-3 py-2 text-xs font-mono focus:outline-none transition-all shadow-inner ${theme === 'DARK' ? 'bg-[#131826] border-[#1a1c2c] text-emerald-400/80' : 'bg-white border-gray-300 text-slate-800'}`} />
                </div>
                <div className="flex flex-col gap-1">
                  <label className={`text-[10px] font-bold uppercase tracking-widest ${theme === 'DARK' ? 'text-slate-300' : 'text-slate-700'}`}>API Auth Token</label>
                  <input type="password" defaultValue="*************************" className={`w-full border rounded px-3 py-2 text-xs font-mono focus:outline-none transition-all shadow-inner ${theme === 'DARK' ? 'bg-[#131826] border-[#1a1c2c] text-slate-500' : 'bg-white border-gray-300 text-slate-800'}`} />
                </div>
                <div className="flex items-center justify-between mt-2">
                   <span className={`text-[10px] font-bold uppercase tracking-widest ${theme === 'DARK' ? 'text-slate-400' : 'text-slate-600'}`}>Auto-Push Reports</span>
                   <label className="relative inline-flex items-center cursor-pointer">
                     <input type="checkbox" defaultChecked className="sr-only peer" />
                     <div className="w-9 h-5 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500 shadow-inner"></div>
                   </label>
                </div>
              </div>
            </div>

            {/* Security Policies */}
            <div className={`border rounded-lg shadow-md p-6 flex flex-col transition-colors duration-300 relative overflow-hidden group ${theme === 'DARK' ? 'bg-[#252841] border-gray-700 hover:border-amber-500/50' : 'bg-white border-gray-200 hover:border-amber-400'}`}>
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 blur-[40px] pointer-events-none group-hover:bg-amber-500/10 transition-colors"></div>
              <div className={`flex justify-between items-center mb-6 border-b pb-3 relative z-10 ${theme === 'DARK' ? 'border-gray-700' : 'border-gray-200'}`}>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-500/10 rounded-lg border border-amber-500/20"><Shield className="w-5 h-5 text-amber-400" /></div>
                  <div>
                    <h2 className={`text-sm font-black uppercase tracking-widest ${theme === 'DARK' ? 'text-slate-100' : 'text-slate-900'}`}>Security Engine</h2>
                    <p className={`text-[10px] font-mono mt-0.5 ${theme === 'DARK' ? 'text-gray-400' : 'text-gray-500'}`}>Sessions & Biometrics</p>
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-5 flex-1 relative z-10">
                <div className="flex flex-col gap-2">
                  <label className={`text-[10px] font-bold uppercase tracking-widest ${theme === 'DARK' ? 'text-slate-300' : 'text-slate-700'}`}>Session Idle Timeout</label>
                  <select className={`w-full border rounded px-3 py-2.5 text-xs font-mono focus:outline-none transition-all shadow-inner ${theme === 'DARK' ? 'bg-[#131826] border-[#1a1c2c] text-slate-300' : 'bg-slate-50 border-gray-300 text-slate-800'}`}>
                    <option>15 Minutes (HIPAA Strict)</option>
                    <option>30 Minutes (Standard)</option>
                    <option>60 Minutes (Low Risk)</option>
                  </select>
                </div>
                <div className="flex items-center justify-between">
                   <span className={`text-[10px] font-bold uppercase tracking-widest ${theme === 'DARK' ? 'text-slate-400' : 'text-slate-600'}`}>Require Biometric Face ID</span>
                   <label className="relative inline-flex items-center cursor-pointer">
                     <input type="checkbox" defaultChecked className="sr-only peer" />
                     <div className="w-9 h-5 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500 shadow-inner"></div>
                   </label>
                </div>
                 <div className="flex items-center justify-between">
                   <span className={`text-[10px] font-bold uppercase tracking-widest ${theme === 'DARK' ? 'text-slate-400' : 'text-slate-600'}`}>Force 2FA For All Staff</span>
                   <label className="relative inline-flex items-center cursor-pointer">
                     <input type="checkbox" defaultChecked className="sr-only peer" />
                     <div className="w-9 h-5 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500 shadow-inner"></div>
                   </label>
                </div>
              </div>
            </div>

            {/* Email Gateway Config */}
            <div className={`border rounded-lg shadow-md p-6 flex flex-col transition-colors duration-300 relative overflow-hidden group ${theme === 'DARK' ? 'bg-[#252841] border-gray-700 hover:border-indigo-500/50' : 'bg-white border-gray-200 hover:border-indigo-400'}`}>
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 blur-[40px] pointer-events-none group-hover:bg-indigo-500/10 transition-colors"></div>
              <div className={`flex justify-between items-center mb-6 border-b pb-3 relative z-10 ${theme === 'DARK' ? 'border-gray-700' : 'border-gray-200'}`}>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-500/10 rounded-lg border border-indigo-500/20"><Mail className="w-5 h-5 text-indigo-400" /></div>
                  <div>
                    <h2 className={`text-sm font-black uppercase tracking-widest ${theme === 'DARK' ? 'text-slate-100' : 'text-slate-900'}`}>SMTP Gateway</h2>
                    <p className={`text-[10px] font-mono mt-0.5 ${theme === 'DARK' ? 'text-gray-400' : 'text-gray-500'}`}>Email Alerts & OTP Config</p>
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-4 flex-1 relative z-10">
                <div className="flex flex-col gap-1">
                  <label className={`text-[10px] font-bold uppercase tracking-widest ${theme === 'DARK' ? 'text-slate-300' : 'text-slate-700'}`}>SMTP Server</label>
                  <input type="text" defaultValue="smtp.gmail.com" disabled className={`w-full border rounded px-3 py-2 text-xs font-mono opacity-70 cursor-not-allowed ${theme === 'DARK' ? 'bg-[#131826] border-[#1a1c2c] text-slate-500' : 'bg-slate-100 border-gray-300 text-slate-500'}`} />
                </div>
                <div className="flex flex-col gap-1">
                  <label className={`text-[10px] font-bold uppercase tracking-widest ${theme === 'DARK' ? 'text-slate-300' : 'text-slate-700'}`}>Admin Support Email</label>
                  <input type="text" defaultValue="thilinakanishka20010313@gmail.com" className={`w-full border rounded px-3 py-2 text-xs font-mono focus:outline-none transition-all shadow-inner ${theme === 'DARK' ? 'bg-[#131826] border-[#1a1c2c] text-slate-300 focus:border-indigo-500/50' : 'bg-white border-gray-300 text-slate-800 focus:border-indigo-400'}`} />
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-dashed border-gray-500/30">
                 <button className={`w-full py-2.5 rounded font-bold text-[10px] uppercase tracking-widest transition-all shadow-md flex items-center justify-center gap-2 ${theme === 'DARK' ? 'bg-[#131826] hover:bg-[#1a2235] text-indigo-400 border border-indigo-500/30' : 'bg-slate-50 hover:bg-slate-100 text-indigo-700 border border-indigo-200'}`}>
                   Test SMTP Connection
                 </button>
              </div>
            </div>

            {/* Financial System */}
            <div className={`border rounded-lg shadow-md p-6 flex flex-col transition-colors duration-300 relative overflow-hidden group ${theme === 'DARK' ? 'bg-[#252841] border-gray-700 hover:border-pink-500/50' : 'bg-white border-gray-200 hover:border-pink-400'}`}>
              <div className="absolute top-0 right-0 w-32 h-32 bg-pink-500/5 blur-[40px] pointer-events-none group-hover:bg-pink-500/10 transition-colors"></div>
              <div className={`flex justify-between items-center mb-6 border-b pb-3 relative z-10 ${theme === 'DARK' ? 'border-gray-700' : 'border-gray-200'}`}>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-pink-500/10 rounded-lg border border-pink-500/20"><Database className="w-5 h-5 text-pink-400" /></div>
                  <div>
                    <h2 className={`text-sm font-black uppercase tracking-widest ${theme === 'DARK' ? 'text-slate-100' : 'text-slate-900'}`}>Financial System</h2>
                    <p className={`text-[10px] font-mono mt-0.5 ${theme === 'DARK' ? 'text-gray-400' : 'text-gray-500'}`}>Payroll & Billing Config</p>
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-4 flex-1 relative z-10">
                <div className="flex flex-col gap-1">
                  <label className={`text-[10px] font-bold uppercase tracking-widest ${theme === 'DARK' ? 'text-slate-300' : 'text-slate-700'}`}>Default Payroll Currency</label>
                  <select 
                    value={currency} 
                    onChange={(e) => setCurrency(e.target.value as any)}
                    className={`w-full border rounded px-3 py-2 text-xs font-mono focus:outline-none transition-all shadow-inner ${theme === 'DARK' ? 'bg-[#131826] border-[#1a1c2c] text-slate-300 focus:border-pink-500/50' : 'bg-slate-50 border-gray-300 text-slate-800 focus:border-pink-400'}`}
                  >
                    <option value="USD">USD ($) - US Dollars</option>
                    <option value="LKR">LKR (Rs) - Sri Lankan Rupees</option>
                    <option value="EUR">EUR (€) - Euros</option>
                  </select>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* TAB 5: DOCTOR_ANALYTICS TAB */}
        {activeTab === 'DOCTOR_ANALYTICS' && (
          <div className={`border rounded-lg shadow-md p-6 flex flex-col mb-4 transition-colors duration-300 ${theme === 'DARK' ? 'bg-[#252841] border-gray-700' : 'bg-white border-gray-200'}`}>
            <div className={`flex justify-between items-center mb-6 border-b pb-3 ${theme === 'DARK' ? 'border-gray-700' : 'border-gray-200'}`}>
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-purple-500" />
                <div>
                  <h2 className={`text-sm font-bold uppercase tracking-widest ${theme === 'DARK' ? 'text-slate-100' : 'text-slate-900'}`}>Physician Activity & Analytics</h2>
                  <p className={`text-[10px] font-mono mt-0.5 ${theme === 'DARK' ? 'text-gray-400' : 'text-gray-500'}`}>Track clinical workflows, patient examinations, and AI inferences per doctor</p>
                </div>
              </div>
              <button
                type="button"
                onClick={downloadDoctorStatsCSV}
                className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs uppercase tracking-wider px-4 py-2 rounded shadow-md hover:shadow-cyan-500/20 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <FileText className="w-4 h-4" />
                Download Overall Report
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className={`border-b text-[11px] uppercase tracking-wider ${theme === 'DARK' ? 'border-gray-700 text-gray-400 bg-[#1a1c2c]/50' : 'border-gray-200 text-gray-600 bg-slate-50'}`}>
                    <th className="p-3 font-bold">Doctor Name & ID</th>
                    <th className="p-3 font-bold">Department</th>
                    <th className="p-3 font-bold text-center">Unique Patients Examined</th>
                    <th className="p-3 font-bold text-center">Total AI Inferences</th>
                    <th className="p-3 font-bold text-center">Last Active Session</th>
                    <th className="p-3 font-bold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className={`text-xs font-mono divide-y ${theme === 'DARK' ? 'divide-gray-700/60' : 'divide-gray-200'}`}>
                  {doctorStats.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-gray-500 font-sans">
                        No physician data available to analyze.
                      </td>
                    </tr>
                  ) : (
                    doctorStats.map((doc) => (
                      <tr key={doc.id} className={`transition-colors ${theme === 'DARK' ? 'hover:bg-[#1a1c2c]/40' : 'hover:bg-slate-50'}`}>
                        <td className="p-3">
                          <div className={`font-bold font-sans ${theme === 'DARK' ? 'text-slate-200' : 'text-slate-800'}`}>{doc.name}</div>
                          <div className="text-[10px] text-cyan-500">{doc.id}</div>
                        </td>
                        <td className={`p-3 font-sans ${theme === 'DARK' ? 'text-slate-400' : 'text-slate-600'}`}>{doc.dept} - {doc.level}</td>
                        <td className="p-3 text-center">
                           <span className="text-lg font-bold text-purple-500 bg-purple-500/10 px-3 py-1 rounded">
                              {doc.patients_seen}
                           </span>
                        </td>
                        <td className={`p-3 text-center font-bold ${theme === 'DARK' ? 'text-slate-300' : 'text-slate-700'}`}>{doc.total_inferences}</td>
                        <td className="p-3 text-center">
                          {doc.is_logged_in ? (
                             <span className="text-emerald-500 font-bold uppercase tracking-widest text-[10px]">🟢 Currently Online</span>
                          ) : (
                             <span className="text-gray-500">{doc.last_login ? new Date(doc.last_login).toLocaleString() : 'Never'}</span>
                          )}
                        </td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => {
                               const csvContent = `ID,Name,Department,Patients Seen,Total Inferences,Last Login\n${doc.id},${doc.name},${doc.dept},${doc.patients_seen},${doc.total_inferences},${doc.last_login}`;
                               const blob = new Blob([csvContent], { type: 'text/csv' });
                               const url = window.URL.createObjectURL(blob);
                               const a = document.createElement('a');
                               a.href = url;
                               a.download = `report_${doc.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`;
                               a.click();
                            }}
                            title="Download Individual Doctor Report"
                            className={`px-3 py-1.5 border rounded text-[10px] uppercase font-bold tracking-wider transition-colors cursor-pointer flex items-center gap-1.5 ml-auto ${theme === 'DARK' ? 'bg-[#131826] border-cyan-500/30 text-cyan-400 hover:bg-cyan-900/30' : 'bg-slate-50 border-cyan-200 text-cyan-600 hover:bg-cyan-50'}`}
                          >
                            <FileText className="w-3 h-3" />
                            Download Report
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
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
                      <div className="flex justify-between items-end">
                        <label className={`text-[10px] font-bold uppercase tracking-widest ${theme === 'DARK' ? 'text-gray-400' : 'text-gray-600'}`}>Doctor's Email Address</label>
                        {avatarPreview && (
                          <img src={avatarPreview} alt="Avatar Preview" className="w-6 h-6 rounded-full border border-cyan-500/50 object-cover shadow-sm -mb-1" />
                        )}
                      </div>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        placeholder="doctor@email.com"
                        className={`w-full border rounded px-3 py-2.5 text-xs font-mono focus:outline-none focus:border-cyan-500 ${
                          theme === 'DARK' ? 'bg-[#131826] border-gray-700 text-slate-200' : 'bg-white border-gray-300 text-slate-900'
                        }`}
                      />
                    </div>
                    <div className="flex flex-col gap-1 md:col-span-1">
                      <label className={`text-[10px] font-bold uppercase tracking-widest ${theme === 'DARK' ? 'text-gray-400' : 'text-gray-600'}`}>Doctor's Mobile Number</label>
                      <input
                        type="text"
                        required
                        value={formData.phone}
                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                        placeholder="+94 7X XXX XXXX"
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
                        placeholder="Ext. XXXX"
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
                        type={isEditMode ? "password" : "text"}
                        disabled={!isEditMode}
                        value={isEditMode ? formData.password : "AUTO-GENERATED SECURELY BY BACKEND"}
                        onChange={(e) => setFormData({...formData, password: e.target.value})}
                        placeholder={isEditMode ? "•••••••••••• (Unchanged)" : ""}
                        className={`w-full border rounded px-3 py-2.5 text-xs font-mono focus:outline-none focus:border-cyan-500 ${
                          !isEditMode 
                            ? (theme === 'DARK' ? 'bg-cyan-900/20 border-cyan-500/30 text-cyan-500 cursor-not-allowed' : 'bg-cyan-50 border-cyan-200 text-cyan-600 cursor-not-allowed')
                            : (theme === 'DARK' ? 'bg-[#131826] border-gray-700 text-slate-200' : 'bg-white border-gray-300 text-slate-900')
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

                {/* SECTION 5: Authorization E-Signature */}
                <div className={`flex flex-col gap-4 p-5 rounded-lg border ${theme === 'DARK' ? 'bg-[#1a1c2c]/50 border-gray-700/60' : 'bg-slate-50 border-gray-200'}`}>
                  <h4 className={`text-xs font-bold uppercase tracking-widest text-cyan-500 flex items-center gap-2 border-b pb-2 ${theme === 'DARK' ? 'border-gray-700/60' : 'border-gray-200'}`}>
                    <FileText className="w-4 h-4 text-cyan-500" />
                    5. Clinical Authorization E-Signature
                  </h4>
                  <div className="flex flex-col gap-2">
                    <label className={`text-[10px] font-bold uppercase tracking-widest ${theme === 'DARK' ? 'text-gray-400' : 'text-gray-600'}`}>
                      Upload Signature Image (Optional)
                    </label>
                    {formData.signature ? (
                      <div className="flex flex-col gap-3">
                        <img src={formData.signature} alt="E-Signature" className="max-h-24 w-auto self-start rounded border border-gray-300 dark:border-gray-700 p-2 bg-white" />
                        <button
                          type="button"
                          onClick={() => setFormData({...formData, signature: ""})}
                          className="text-[10px] font-bold text-rose-500 hover:text-rose-400 self-start uppercase tracking-wider transition-colors"
                        >
                          Remove Signature
                        </button>
                      </div>
                    ) : (
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              setFormData({...formData, signature: reader.result as string});
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                        className={`w-full text-xs file:mr-4 file:py-2.5 file:px-4 file:rounded file:border-0 file:text-xs file:font-bold file:bg-cyan-500/10 file:text-cyan-500 hover:file:bg-cyan-500/20 cursor-pointer ${theme === 'DARK' ? 'text-slate-300' : 'text-slate-700'}`}
                      />
                    )}
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
                  <div className="w-16 h-16 bg-cyan-500/10 border border-cyan-500/30 text-cyan-500 rounded-xl shadow-inner flex items-center justify-center overflow-hidden">
                    {viewingUser.avatar_url ? (
                      <img src={viewingUser.avatar_url} alt={viewingUser.name} className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-8 h-8" />
                    )}
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
                      <span className="font-mono text-emerald-500 font-semibold">{viewingUser.phone || "No Mobile"}</span>
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

                {/* 5. Authorization E-Signature */}
                {viewingUser.signature && (
                  <div className={`p-5 rounded-xl border shadow-md flex flex-col gap-4 md:col-span-2 ${theme === 'DARK' ? 'bg-[#131524] border-gray-700/80' : 'bg-white border-gray-200'}`}>
                    <h4 className={`text-xs font-bold uppercase tracking-widest text-cyan-500 flex items-center gap-2 border-b pb-2.5 ${theme === 'DARK' ? 'border-gray-700/60' : 'border-gray-200'}`}>
                      <FileText className="w-4 h-4 text-cyan-500" />
                      Clinical Authorization E-Signature
                    </h4>
                    <div className="flex justify-center bg-white p-3 rounded border border-gray-200 dark:border-gray-600">
                      <img src={viewingUser.signature} alt="E-Signature" className="max-h-24 w-auto object-contain" />
                    </div>
                  </div>
                )}

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

        {/* TAB 6: MESSAGES TAB */}
        {activeTab === 'MESSAGES' && (
           <AdminMessages theme={theme} />
        )}

        {/* TAB 7: FINANCIAL AUDIT TAB */}
        {activeTab === 'FINANCIAL_AUDIT' && (
          <div className="flex-1 flex flex-col min-h-0 bg-transparent animate-fade-in px-4">
             <div className="flex items-center justify-between mb-8">
                <div>
                   <h1 className={`text-2xl font-black uppercase tracking-widest flex items-center gap-3 ${theme === 'DARK' ? 'text-slate-100' : 'text-slate-900'}`}>
                     Financial Audit & Payroll
                   </h1>
                   <p className={`text-xs font-mono mt-1 ${theme === 'DARK' ? 'text-gray-400' : 'text-gray-500'}`}>Verify doctor workloads and calculated remuneration for hospital billing.</p>
                </div>
             </div>
             
             <div className={`border rounded-xl shadow-xl overflow-hidden transition-colors duration-300 flex-1 ${theme === 'DARK' ? 'bg-[#252841] border-gray-700' : 'bg-white border-gray-200'}`}>
                <div className={`p-5 flex items-center justify-between border-b ${theme === 'DARK' ? 'border-gray-700 bg-[#1a1c2c]/50' : 'border-gray-200 bg-slate-50'}`}>
                   <h2 className={`text-sm font-bold uppercase tracking-widest ${theme === 'DARK' ? 'text-slate-100' : 'text-slate-900'}`}>Physician Payroll Ledger</h2>
                   <span className="text-[10px] font-bold text-cyan-500 uppercase tracking-widest bg-cyan-500/10 border border-cyan-500/30 px-3 py-1.5 rounded shadow-sm">
                     Rate: {currency === 'LKR' ? 'Rs. 45,000' : currency === 'EUR' ? '€140' : '$150'} / Unique Patient
                   </span>
                </div>
                
                <div className="overflow-x-auto p-4">
                  <table className="w-full text-left border-collapse rounded-xl overflow-hidden shadow-sm">
                    <thead className={`${theme === 'DARK' ? 'bg-[#1a1c2c]' : 'bg-slate-100'}`}>
                      <tr>
                        <th className={`py-4 px-5 text-[10px] font-black uppercase tracking-widest border-b ${theme === 'DARK' ? 'text-gray-400 border-gray-700' : 'text-gray-500 border-gray-200'}`}>Physician</th>
                        <th className={`py-4 px-5 text-[10px] font-black uppercase tracking-widest border-b ${theme === 'DARK' ? 'text-gray-400 border-gray-700' : 'text-gray-500 border-gray-200'} text-center`}>Department</th>
                        <th className={`py-4 px-5 text-[10px] font-black uppercase tracking-widest border-b ${theme === 'DARK' ? 'text-gray-400 border-gray-700' : 'text-gray-500 border-gray-200'} text-center`}>Unique Patients Seen</th>
                        <th className={`py-4 px-5 text-[10px] font-black uppercase tracking-widest border-b ${theme === 'DARK' ? 'text-gray-400 border-gray-700' : 'text-gray-500 border-gray-200'} text-center`}>Total Inferences</th>
                        <th className={`py-4 px-5 text-[10px] font-black uppercase tracking-widest border-b ${theme === 'DARK' ? 'text-gray-400 border-gray-700' : 'text-gray-500 border-gray-200'} text-right`}>Estimated Remuneration</th>
                        <th className={`py-4 px-5 text-[10px] font-black uppercase tracking-widest border-b ${theme === 'DARK' ? 'text-gray-400 border-gray-700' : 'text-gray-500 border-gray-200'} text-center`}>Action</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm">
                      {doctorStats.map((doc, idx) => {
                        const rate = currency === 'LKR' ? 45000 : currency === 'EUR' ? 140 : 150;
                        const symbol = currency === 'LKR' ? 'Rs. ' : currency === 'EUR' ? '€' : '$';
                        const amountDue = doc.patients_seen * rate;
                        const isProcessed = processedPayments[doc.id] || amountDue === 0;
                        const isProcessing = processingPayment === doc.id;
                        
                        return (
                          <tr key={idx} className={`hover:bg-cyan-500/5 transition-colors ${theme === 'DARK' ? 'border-gray-700' : 'border-gray-100'} border-b last:border-0`}>
                            <td className="py-4 px-5">
                               <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-full bg-cyan-900/50 flex items-center justify-center text-cyan-500 font-bold overflow-hidden border border-cyan-500/30">
                                     {doc.avatar_url ? <img src={doc.avatar_url} alt="Dr." className="w-full h-full object-cover" /> : doc.name.charAt(0)}
                                  </div>
                                  <div>
                                    <p className={`font-bold ${theme === 'DARK' ? 'text-slate-200' : 'text-slate-800'}`}>Dr. {doc.name}</p>
                                    <p className={`text-[10px] font-mono mt-0.5 ${theme === 'DARK' ? 'text-gray-500' : 'text-gray-400'}`}>{doc.id}</p>
                                  </div>
                               </div>
                            </td>
                            <td className={`py-4 px-5 text-center font-semibold ${theme === 'DARK' ? 'text-slate-300' : 'text-slate-700'}`}>{doc.dept}</td>
                            <td className={`py-4 px-5 text-center font-black text-lg ${theme === 'DARK' ? 'text-slate-200' : 'text-slate-800'}`}>{doc.patients_seen}</td>
                            <td className={`py-4 px-5 text-center font-mono text-xs ${theme === 'DARK' ? 'text-gray-400' : 'text-gray-500'}`}>{doc.total_inferences} Scans</td>
                            <td className="py-4 px-5 text-right font-mono font-black text-emerald-500 text-lg">
                               {symbol}{amountDue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                            <td className="py-4 px-5 text-center">
                              {isProcessed ? (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-xs font-bold tracking-widest uppercase">
                                  <CheckCircle className="w-3.5 h-3.5" /> Settled
                                </span>
                              ) : (
                                <button
                                  onClick={() => handleProcessPayroll(doc, amountDue)}
                                  disabled={isProcessing}
                                  className="px-3 py-1.5 rounded bg-cyan-600 hover:bg-cyan-500 text-white text-[10px] font-bold tracking-widest uppercase transition-colors disabled:opacity-50"
                                >
                                  {isProcessing ? 'Processing...' : 'Process Payment'}
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                      {doctorStats.length === 0 && (
                        <tr>
                          <td colSpan={5} className="py-12 text-center text-gray-500 font-sans text-sm">No physician workload data available for payroll calculation.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
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
      {/* Render Forgot Password Modal */}
      {showForgotPassword && (
        <ForgotPassword 
          onCancel={() => setShowForgotPassword(false)} 
          onSuccess={() => setShowForgotPassword(false)} 
        />
      )}

      {/* Admin Account Settings Modal */}
      {showAccountSettings && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className={`w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border ${theme === 'DARK' ? 'bg-[#1a1c2c] border-gray-700' : 'bg-white border-gray-200'}`}>
            <div className={`px-6 py-4 border-b flex items-center justify-between ${theme === 'DARK' ? 'border-gray-800 bg-[#131524]' : 'border-gray-100 bg-slate-50'}`}>
              <h3 className={`text-lg font-bold flex items-center gap-2 ${theme === 'DARK' ? 'text-white' : 'text-slate-900'}`}>
                <Settings className="w-5 h-5 text-cyan-500" />
                Account Settings
              </h3>
              <button onClick={() => setShowAccountSettings(false)} className={`p-1.5 rounded-lg transition-colors ${theme === 'DARK' ? 'hover:bg-gray-800 text-gray-400 hover:text-white' : 'hover:bg-gray-200 text-gray-500 hover:text-black'}`}>
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6">
              <div className="flex flex-col items-center mb-6">
                <div className="w-20 h-20 rounded-full border-4 border-cyan-500/20 bg-cyan-500/10 flex items-center justify-center mb-3">
                  <User className="w-10 h-10 text-cyan-500" fill="currentColor" />
                </div>
                <h4 className={`text-lg font-bold ${theme === 'DARK' ? 'text-white' : 'text-slate-900'}`}>System Administrator</h4>
                <p className="text-sm text-gray-500 font-mono">admin@HepatoAI.com</p>
                <span className="mt-2 bg-blue-500/10 text-blue-500 border border-blue-500/20 px-3 py-1 rounded-full text-xs font-bold tracking-widest uppercase">Root Access</span>
              </div>
              
              <div className="space-y-4">
                <div className={`p-4 rounded-xl border ${theme === 'DARK' ? 'bg-[#131524] border-gray-800' : 'bg-slate-50 border-gray-200'}`}>
                  <h3 className={`text-xs font-bold uppercase tracking-widest mb-3 flex items-center gap-2 ${theme === 'DARK' ? 'text-slate-100' : 'text-slate-900'}`}>
                    <Shield className="w-4 h-4 text-rose-500" /> Admin Access Keys
                  </h3>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => {
                        setShowAccountSettings(false);
                        setShowForgotPassword(true);
                      }}
                      className="w-full px-4 py-3 bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 transition-colors text-white rounded font-bold uppercase tracking-widest text-xs flex items-center justify-center gap-2"
                    >
                      <Lock className="w-4 h-4" /> Change Administrative Password (OTP)
                    </button>
                  </div>
                  <p className="text-[10px] text-gray-500 mt-3 font-mono flex items-start gap-1">
                    <ShieldAlert className="w-3 h-3 flex-shrink-0 mt-0.5" /> 
                    Requires secure OTP verification sent to your personal email address.
                  </p>
                </div>
                
                <div className={`p-4 rounded-xl border ${theme === 'DARK' ? 'bg-[#131524] border-gray-800' : 'bg-slate-50 border-gray-200'} flex items-center justify-between`}>
                  <div>
                    <h5 className={`text-sm font-bold ${theme === 'DARK' ? 'text-slate-200' : 'text-slate-800'}`}>Two-Factor Authentication</h5>
                    <p className="text-xs text-gray-500">Hardware security key required.</p>
                  </div>
                  <div className="w-10 h-5 bg-emerald-500 rounded-full relative">
                    <div className="w-4 h-4 bg-white rounded-full absolute right-0.5 top-0.5 shadow"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};