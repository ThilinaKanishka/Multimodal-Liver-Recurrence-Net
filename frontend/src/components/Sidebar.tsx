import React, { useState, useEffect } from "react";
import axios from "axios";
import { Activity, LayoutDashboard, Users, Database, Search, Settings, Hexagon, LogOut, Split, ChevronLeft, ChevronRight, MessageSquare } from "lucide-react";
import { getGravatarUrl } from "../utils/gravatar";

interface SidebarProps {
  activePage: string;
  setActivePage: (page: string) => void;
  user?: any;
}

export const Sidebar: React.FC<SidebarProps> = ({ activePage, setActivePage, user }) => {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [unreadSupportCount, setUnreadSupportCount] = useState(0);

  useEffect(() => {
    if (user && user.email) {
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
      return `w-full h-10 ${isCollapsed ? 'justify-center' : 'px-3'} bg-blue-600/20 text-blue-400 rounded-md flex items-center gap-3 border border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.2)] cursor-pointer transition-all`;
    }
    return `w-full h-10 ${isCollapsed ? 'justify-center' : 'px-3'} text-slate-500 hover:text-slate-200 hover:bg-[#1e293b] rounded-md flex items-center gap-3 cursor-pointer transition-all`;
  };

  return (
    <div className={`${isCollapsed ? 'w-[80px]' : 'w-[240px]'} transition-all duration-300 flex-shrink-0 bg-[#0f141f] border-r border-[#1e293b] flex flex-col items-center py-4 z-30 shadow-2xl sticky top-0 h-full pb-8 relative`}>
      
      {/* Collapse Toggle Button */}
      <button 
        onClick={toggleSidebar}
        className="absolute -right-3 top-6 bg-[#1e293b] border border-cyan-500/30 text-cyan-400 rounded-full p-1 hover:bg-[#2a364a] hover:text-cyan-300 transition-all shadow-[0_0_10px_rgba(6,182,212,0.2)] z-50 cursor-pointer"
      >
        {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>

      <div className={`w-full flex flex-col mb-8 pb-5 border-b border-[#1e293b] ${isCollapsed ? 'px-2 items-center' : 'px-5'}`}>
        <div className={`flex items-center gap-3 mb-4 ${isCollapsed ? 'justify-center' : ''}`}>
          <div className="bg-cyan-500/20 p-1.5 rounded-lg border border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.4)] flex-shrink-0">
             <Hexagon className="w-6 h-6 text-cyan-400" />
          </div>
          {!isCollapsed && (
            <span className="text-xl font-bold tracking-widest text-slate-100 uppercase truncate">
              Hepato<span className="text-cyan-400">AI</span>
            </span>
          )}
        </div>
        
        {user && (
          <div className={`bg-[#131826] border border-[#1e293b] rounded-xl flex flex-col hover:border-[#2a364a] transition-all mt-2 shadow-lg ${isCollapsed ? 'p-2 items-center' : 'p-3'}`}>
            <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3 flex-row'}`}>
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" className="w-9 h-9 rounded-full border border-cyan-500/30 flex-shrink-0 object-cover" />
              ) : (
                <div className="w-9 h-9 rounded-full bg-cyan-950/50 border border-cyan-500/30 flex items-center justify-center flex-shrink-0 text-cyan-400 font-bold shadow-inner text-sm">
                  {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
              )}
              {!isCollapsed && (
                <div className="flex flex-col min-w-0">
                   <span className="text-xs font-bold text-slate-200 truncate">Dr. {user.name}</span>
                   <span className="text-[10px] text-slate-400 truncate">{user.level || 'Clinician'}</span>
                   <span className="text-[9px] text-slate-500 font-mono mt-0.5">{user.id}</span>
                </div>
              )}
            </div>
            {!isCollapsed && (
              <div className="flex items-center gap-1.5 mt-3 pt-2 border-t border-[#1e293b]">
                 <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_5px_rgba(16,185,129,0.5)]"></div>
                 <span className="text-[9px] uppercase tracking-wider text-emerald-500/80 font-bold">Session Active</span>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="px-3 w-full flex flex-col gap-2">
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
        <div className={getIconClass("search")} onClick={() => setActivePage("search")} title="Patient Ledger & History">
          <Search className="w-5 h-5 flex-shrink-0" />
          {!isCollapsed && <span className="text-xs font-bold uppercase tracking-wider">Patient History</span>}
        </div>
        <div className={getIconClass("billing")} onClick={() => setActivePage("billing")} title="Workload & Billing Logs">
          <Database className="w-5 h-5 flex-shrink-0" />
          {!isCollapsed && <span className="text-xs font-bold uppercase tracking-wider">Workload Logs</span>}
        </div>

      </div>
      
      <div className="mt-auto px-3 w-full flex flex-col gap-2">
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
          className={`w-full h-10 ${isCollapsed ? 'justify-center' : 'px-3'} text-rose-500 hover:text-white hover:bg-rose-600/80 rounded-md flex items-center gap-3 cursor-pointer transition-all border border-rose-500/30 hover:border-rose-500 mt-2 shadow-[0_0_10px_rgba(244,63,94,0.1)]`}
          onClick={() => {
            if (user && user.id) {
              fetch("http://127.0.0.1:8000/api/logout", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: user.id })
              })
              .then(() => {
                localStorage.removeItem("hepatoai_current_user");
                setActivePage("login");
              })
              .catch((err) => {
                console.error(err);
                localStorage.removeItem("hepatoai_current_user");
                setActivePage("login");
              });
            } else {
              localStorage.removeItem("hepatoai_current_user");
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
  );
};
