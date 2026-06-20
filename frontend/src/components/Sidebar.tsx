import React from "react";
import { Activity, LayoutDashboard, Users, Database, Search, Settings } from "lucide-react";

interface SidebarProps {
  activePage: string;
  setActivePage: (page: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activePage, setActivePage }) => {
  const getIconClass = (page: string) => {
    if (activePage === page) {
      return "w-8 h-8 bg-blue-600/20 text-blue-500 rounded flex items-center justify-center border border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.3)] cursor-pointer";
    }
    return "p-2 text-slate-500 hover:text-slate-200 hover:bg-[#1e293b] rounded cursor-pointer transition-colors relative flex items-center justify-center";
  };

  return (
    <div className="w-14 flex-shrink-0 bg-[#0f141f] border-r border-[#1e293b] flex flex-col items-center py-4 z-10 shadow-2xl sticky top-0 h-screen">
      <div className={getIconClass("activity")} onClick={() => setActivePage("activity")} title="Diagnostic Workspace">
        <Activity className="w-5 h-5" />
      </div>
      
      <div className="flex flex-col gap-5 w-full items-center mt-6">
        <div className={getIconClass("dashboard")} onClick={() => setActivePage("dashboard")} title="System Dashboard">
          <LayoutDashboard className="w-5 h-5" />
        </div>
        <div className={getIconClass("users")} onClick={() => setActivePage("users")} title="Patient Directory">
          <Users className="w-5 h-5" />
        </div>
        <div className={getIconClass("database")} onClick={() => setActivePage("database")} title="EHR / Clinical Ledger">
          <Database className="w-5 h-5" />
        </div>
        <div className={getIconClass("search")} onClick={() => setActivePage("search")} title="Global Search">
          <Search className="w-5 h-5" />
        </div>
      </div>
      
      <div className="mt-auto flex flex-col gap-4 w-full items-center">
        <div className={getIconClass("settings")} onClick={() => setActivePage("settings")} title="System Configuration">
          <Settings className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
};
