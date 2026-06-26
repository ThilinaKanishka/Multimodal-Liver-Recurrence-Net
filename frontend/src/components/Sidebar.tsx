import React from "react";
import { Activity, LayoutDashboard, Users, Database, Search, Settings, Hexagon, LogOut, Split } from "lucide-react";

interface SidebarProps {
  activePage: string;
  setActivePage: (page: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activePage, setActivePage }) => {
  const getIconClass = (page: string) => {
    if (activePage === page) {
      return "w-full h-10 px-3 bg-blue-600/20 text-blue-400 rounded-md flex items-center gap-3 border border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.2)] cursor-pointer transition-all";
    }
    return "w-full h-10 px-3 text-slate-500 hover:text-slate-200 hover:bg-[#1e293b] rounded-md flex items-center gap-3 cursor-pointer transition-all";
  };

  return (
    <div className="w-[240px] flex-shrink-0 bg-[#0f141f] border-r border-[#1e293b] flex flex-col items-start py-4 z-10 shadow-2xl sticky top-0 h-full pb-8">
      
      <div className="px-5 w-full flex items-center gap-3 mb-8 pb-5 border-b border-[#1e293b]">
        <div className="bg-cyan-500/20 p-1.5 rounded-lg border border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.4)]">
           <Hexagon className="w-6 h-6 text-cyan-400" />
        </div>
        <span className="text-xl font-bold tracking-widest text-slate-100 uppercase">
          Hepato<span className="text-cyan-400">AI</span>
        </span>
      </div>

      <div className="px-3 w-full flex flex-col gap-2">
        <div className={getIconClass("activity")} onClick={() => setActivePage("activity")} title="Diagnostic Workspace">
          <Activity className="w-5 h-5 flex-shrink-0" />
          <span className="text-xs font-bold uppercase tracking-wider">Workspace</span>
        </div>
        <div className={getIconClass("longitudinal")} onClick={() => setActivePage("longitudinal")} title="Longitudinal Tracking (Compare Mode)">
          <Split className="w-5 h-5 flex-shrink-0" />
          <span className="text-xs font-bold uppercase tracking-wider">Compare</span>
        </div>
        <div className={getIconClass("dashboard")} onClick={() => setActivePage("dashboard")} title="System Dashboard">
          <LayoutDashboard className="w-5 h-5 flex-shrink-0" />
          <span className="text-xs font-bold uppercase tracking-wider">Dashboard</span>
        </div>
        <div className={getIconClass("users")} onClick={() => setActivePage("users")} title="Patient Directory">
          <Users className="w-5 h-5 flex-shrink-0" />
          <span className="text-xs font-bold uppercase tracking-wider">Directory</span>
        </div>
        <div className={getIconClass("database")} onClick={() => setActivePage("database")} title="EHR / Clinical Ledger">
          <Database className="w-5 h-5 flex-shrink-0" />
          <span className="text-xs font-bold uppercase tracking-wider">EHR Ledger</span>
        </div>
        <div className={getIconClass("search")} onClick={() => setActivePage("search")} title="Global Search">
          <Search className="w-5 h-5 flex-shrink-0" />
          <span className="text-xs font-bold uppercase tracking-wider">Search</span>
        </div>
      </div>
      
      <div className="mt-auto px-3 w-full flex flex-col gap-2">
        <div className={getIconClass("settings")} onClick={() => setActivePage("settings")} title="System Configuration">
          <Settings className="w-5 h-5 flex-shrink-0" />
          <span className="text-xs font-bold uppercase tracking-wider">Settings</span>
        </div>
        <div className="w-full h-10 px-3 text-rose-500 hover:text-white hover:bg-rose-600/80 rounded-md flex items-center gap-3 cursor-pointer transition-all border border-rose-500/30 hover:border-rose-500 mt-2 shadow-[0_0_10px_rgba(244,63,94,0.1)]" onClick={() => setActivePage("login")} title="Log Out / Exit Portal">
          <LogOut className="w-5 h-5 flex-shrink-0" />
          <span className="text-xs font-bold uppercase tracking-wider">Log Out</span>
        </div>
      </div>
    </div>
  );
};
