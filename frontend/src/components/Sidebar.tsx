import React, { useState, useEffect } from "react";
import axios from "axios";
import { Activity, LayoutDashboard, Users, Database, Search, Settings, Hexagon, LogOut, Split, ChevronLeft, ChevronRight, MessageSquare, Layers, Cpu } from "lucide-react";
import { getGravatarUrl } from "../utils/gravatar";

interface SidebarProps {
  activePage: string;
  setActivePage: (page: string) => void;
  user?: any;
  onLogout?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activePage, setActivePage, user, onLogout }) => {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [unreadSupportCount, setUnreadSupportCount] = useState(0);

  useEffect(() => {
    if (user && user.picture) {
      setAvatarUrl(user.picture);
    } else if (user && user.email) {
      getGravatarUrl(user.email, 100).then(setAvatarUrl);
    } else {
      setAvatarUrl(null);
    }
  }, [user]);

  useEffect(() => {
    if (!user || !user.id) return;
    const fetchUnread = async () => {
      try {
        const res = await axios.get(`http://127.0.0.1:8000/api/messages/conversations/${user.id}`);
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
  }, [user]);

  const [isCollapsed, setIsCollapsed] = useState(() => {
    return sessionStorage.getItem("hepatoai_sidebar_collapsed") === "true";
  });

  const toggleSidebar = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    sessionStorage.setItem("hepatoai_sidebar_collapsed", String(newState));
  };

  const getIconClass = (page: string) => {
    if (activePage === page) {
      return `w-full h-10 ${isCollapsed ? 'justify-center' : 'px-4'} bg-gradient-to-r from-[#00e5ff]/20 to-transparent text-[#00e5ff] rounded-xl flex items-center gap-4 border-l-4 border-[#00e5ff] shadow-[inset_20px_0_20px_-20px_rgba(0,229,255,0.3)] cursor-pointer transition-all duration-300 font-black relative overflow-hidden`;
    }
    return `w-full h-10 ${isCollapsed ? 'justify-center' : 'px-4'} text-slate-400 hover:text-white hover:bg-white/5 rounded-xl flex items-center gap-4 border-l-4 border-transparent cursor-pointer transition-all duration-300 font-bold`;
  };

  return (
    <div className={`${isCollapsed ? 'w-[80px]' : 'w-[240px]'} transition-all duration-500 flex-shrink-0 z-30 sticky top-0 h-full relative`}>
      {/* Collapse Toggle Button */}
      <button 
        onClick={toggleSidebar}
        className="absolute -right-3.5 top-8 bg-black/60 backdrop-blur-md border border-[#00e5ff]/30 text-[#00e5ff] rounded-full p-1.5 hover:bg-[#00e5ff]/10 hover:text-white transition-all shadow-[0_0_15px_rgba(0,229,255,0.3)] z-50 cursor-pointer"
      >
        {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>

      <div className={`w-full h-full bg-[#0a0f18]/90 backdrop-blur-3xl border-r border-white/10 flex flex-col items-center py-4 pb-6 shadow-[4px_0_24px_rgba(0,0,0,0.4)] relative overflow-y-auto overflow-x-hidden scrollbar-none group/sidebar`}>
        {/* Ambient Edge Glow */}
        <div className="absolute top-0 right-0 bottom-0 w-px bg-gradient-to-b from-transparent via-[#00e5ff]/30 to-transparent"></div>
        <div className="absolute top-[-10%] left-[-20%] w-[150%] h-[30%] bg-[#00e5ff]/5 blur-[60px] pointer-events-none"></div>

      <div className={`w-full flex flex-col mb-4 pb-4 border-b border-white/10 relative ${isCollapsed ? 'px-2 items-center' : 'px-6'}`}>
        <div className={`flex items-center gap-3 mb-4 ${isCollapsed ? 'justify-center' : ''}`}>
          <div className="bg-gradient-to-br from-[#00e5ff]/20 to-blue-600/20 p-1.5 rounded-xl border border-[#00e5ff]/40 shadow-[0_0_20px_rgba(0,229,255,0.3)] flex-shrink-0 relative group">
             <div className="absolute inset-0 bg-[#00e5ff] rounded-xl opacity-0 group-hover:opacity-20 blur-md transition-opacity duration-500"></div>
             <Hexagon className="w-7 h-7 text-[#00e5ff]" />
          </div>
          {!isCollapsed && (
            <span className="text-xl font-black tracking-[0.1em] text-white uppercase whitespace-nowrap drop-shadow-md">
              Hepato<span className="text-[#00e5ff] drop-shadow-[0_0_10px_#00e5ff]">AI</span>
            </span>
          )}
        </div>
        
        {user && (
          <div className={`bg-[#0f1522]/80 backdrop-blur-xl border border-white/10 rounded-2xl flex flex-col hover:border-[#00e5ff]/40 transition-all duration-500 shadow-[0_8px_32px_rgba(0,0,0,0.5)] group/user ${isCollapsed ? 'p-2 items-center' : 'p-3'}`}>
            <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3 flex-row'}`}>
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" className="w-8 h-8 rounded-full border-2 border-[#00e5ff]/50 flex-shrink-0 object-cover shadow-[0_0_15px_rgba(0,229,255,0.3)] group-hover/user:border-[#00e5ff] transition-colors" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#00e5ff]/20 to-blue-600/20 border-2 border-[#00e5ff]/50 flex items-center justify-center flex-shrink-0 text-[#00e5ff] font-bold shadow-[0_0_15px_rgba(0,229,255,0.3)] text-sm group-hover/user:border-[#00e5ff] transition-colors">
                  {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
              )}
              {!isCollapsed && (
                <div className="flex flex-col min-w-0 justify-center">
                   <span className="text-xs font-black text-white truncate tracking-wide">DR. {user.name}</span>
                   <span className="text-[10px] text-[#00e5ff] uppercase tracking-widest truncate">{user.level || 'CLINICIAN'}</span>
                   <span className="text-[9px] text-slate-500 font-mono mt-0.5">{user.id}</span>
                </div>
              )}
            </div>
            {!isCollapsed && (
              <div className="flex items-center gap-2 mt-3 pt-2 border-t border-white/10">
                 <div className="w-2 h-2 rounded-full bg-[#00ff9d] animate-pulse shadow-[0_0_10px_#00ff9d]"></div>
                 <span className="text-[9px] uppercase tracking-[0.2em] text-[#00ff9d] font-black">SYSTEM CONNECTED</span>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="px-3 w-full flex flex-col gap-1">
        <div className={getIconClass("activity")} onClick={() => setActivePage("activity")} title="Diagnostic Workspace">
          <Activity className="w-5 h-5 flex-shrink-0" />
          {!isCollapsed && <span className="text-xs font-bold uppercase tracking-wider">Workspace</span>}
        </div>
        <div className={getIconClass("longitudinal")} onClick={() => setActivePage("longitudinal")} title="Longitudinal Tracking (Compare Mode)">
          <Split className="w-5 h-5 flex-shrink-0" />
          {!isCollapsed && <span className="text-xs font-bold uppercase tracking-wider">Compare</span>}
        </div>
        <div className={getIconClass("dashboard")} onClick={() => setActivePage("dashboard")} title="System Dashboard">
          <LayoutDashboard className="w-5 h-5 flex-shrink-0" />
          {!isCollapsed && <span className="text-xs font-bold uppercase tracking-wider">Dashboard</span>}
        </div>
        <div className={getIconClass("attention")} onClick={() => setActivePage("attention")} title="Attention & Fusion Analysis">
          <Layers className="w-5 h-5 flex-shrink-0" />
          {!isCollapsed && <span className="text-xs font-bold uppercase tracking-wider">Attention</span>}
        </div>
        <div className={getIconClass("feature_extraction")} onClick={() => setActivePage("feature_extraction")} title="Advanced Feature Extraction">
          <Cpu className="w-5 h-5 flex-shrink-0" />
          {!isCollapsed && <span className="text-xs font-bold uppercase tracking-wider">Features</span>}
        </div>
        <div className={getIconClass("search")} onClick={() => setActivePage("search")} title="Patient Ledger & History">
          <Search className="w-5 h-5 flex-shrink-0" />
          {!isCollapsed && <span className="text-xs font-bold uppercase tracking-wider">Patient History</span>}
        </div>
        <div className={getIconClass("billing")} onClick={() => setActivePage("billing")} title="Workload & Billing Logs">
          <Database className="w-5 h-5 flex-shrink-0" />
          {!isCollapsed && <span className="text-xs font-bold uppercase tracking-wider">Workload Logs</span>}
        </div>

      </div>
      
      <div className="mt-auto px-3 w-full flex flex-col gap-1">
        <div className={getIconClass("settings")} onClick={() => setActivePage("settings")} title="System Configuration">
          <Settings className="w-5 h-5 flex-shrink-0" />
          {!isCollapsed && <span className="text-xs font-bold uppercase tracking-wider">Settings</span>}
        </div>
        <div className={getIconClass("support")} onClick={() => setActivePage("support")} title="IT Support">
          <div className="relative">
            <MessageSquare className="w-5 h-5 flex-shrink-0" />
            {unreadSupportCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-3 w-3 items-center justify-center rounded-full bg-rose-500 text-[8px] font-bold text-white shadow-sm ring-1 ring-white/10 animate-pulse">
                {unreadSupportCount > 9 ? '9+' : unreadSupportCount}
              </span>
            )}
          </div>
          {!isCollapsed && (
            <span className="text-xs font-bold uppercase tracking-wider flex items-center justify-between flex-1 pr-1">
              IT Support
              {unreadSupportCount > 0 && (
                <span className="bg-rose-500 text-white text-[9px] px-1.5 py-0.5 rounded shadow-sm flex items-center justify-center">
                  {unreadSupportCount} NEW
                </span>
              )}
            </span>
          )}
        </div>
        <div 
          className={`w-full h-10 ${isCollapsed ? 'justify-center' : 'px-3'} text-rose-500 hover:text-white hover:bg-rose-600/80 rounded-md flex items-center gap-3 cursor-pointer transition-all border border-rose-500/30 hover:border-rose-500 mt-1 shadow-[0_0_10px_rgba(244,63,94,0.1)]`}
          onClick={() => {
            if (user && user.id) {
              fetch("http://127.0.0.1:8000/api/logout", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: user.id })
              })
              .then(() => {
                sessionStorage.removeItem("hepatoai_current_user");
                if (onLogout) onLogout();
                setActivePage("login");
              })
              .catch((err) => {
                console.error(err);
                sessionStorage.removeItem("hepatoai_current_user");
                if (onLogout) onLogout();
                setActivePage("login");
              });
            } else {
              sessionStorage.removeItem("hepatoai_current_user");
              if (onLogout) onLogout();
              setActivePage("login");
            }
          }} 
          title="Log Out / Exit Portal"
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {!isCollapsed && <span className="text-xs font-bold uppercase tracking-wider">Log Out</span>}
        </div>
      </div>
      </div>
    </div>
  );
};
