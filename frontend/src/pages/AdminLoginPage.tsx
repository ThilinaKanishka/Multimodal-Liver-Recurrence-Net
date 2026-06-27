import React, { useState } from "react";
import { Hexagon, Lock, ShieldAlert, KeyRound, Cpu, ArrowLeft, ShieldCheck, Terminal } from "lucide-react";

export const AdminLoginPage: React.FC<{ onLogin: () => void; onBack: () => void }> = ({ onLogin, onBack }) => {
  const [credentials, setCredentials] = useState({ username: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Secure Admin Login verification simulation
    setTimeout(() => {
      if (credentials.username === "admin" && credentials.password === "wrong") {
        setError("Invalid administrator credentials or revoked security key.");
        setLoading(false);
        return;
      }
      setLoading(false);
      onLogin();
    }, 1200);
  };

  return (
    <div className="min-h-screen w-full bg-[#070b14] flex text-slate-300 font-sans selection:bg-rose-500/30 overflow-hidden animate-in fade-in duration-300">
      
      {/* LEFT PANEL: Branding & Admin Mission Control Identity */}
      <div className="hidden lg:flex w-1/2 relative bg-[#0f141f] border-r border-[#1e293b] flex-col items-center justify-center overflow-hidden">
        {/* Background Decorative Elements */}
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-rose-900/15 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] bg-cyan-900/10 rounded-full blur-[100px] pointer-events-none"></div>
        
        {/* Logo & Identity */}
        <div className="relative z-10 flex flex-col items-center text-center max-w-md px-8">
          <div className="bg-gradient-to-br from-rose-500/20 to-purple-600/10 p-6 rounded-2xl border border-rose-500/30 shadow-[0_0_40px_rgba(244,63,94,0.15)] mb-8">
            <Hexagon className="w-20 h-20 text-rose-400" strokeWidth={1.5} />
            <Terminal className="w-8 h-8 text-cyan-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
          </div>
          
          <h1 className="text-5xl font-bold tracking-widest text-slate-100 uppercase mb-4">
            Hepato<span className="text-cyan-400">AI</span>
          </h1>
          <div className="h-px w-24 bg-gradient-to-r from-transparent via-rose-500/50 to-transparent mb-6"></div>
          <h2 className="text-lg font-mono text-rose-400 tracking-widest uppercase font-bold">
            IT Admin Mission Control
          </h2>
          <p className="mt-6 text-sm text-slate-400 leading-relaxed font-medium">
            System health governance, real-time MongoDB auditing ledger, and enterprise medical staff credentialing engine.
          </p>
          
          <div className="mt-8 inline-flex items-center gap-2 bg-rose-950/40 border border-rose-800/50 text-rose-300 px-4 py-1.5 rounded-full text-xs font-mono font-bold shadow-lg">
            <ShieldCheck className="w-4 h-4 text-rose-400" />
            SUPER-USER LEVEL 5 CLEARANCE REQUIRED
          </div>
        </div>

        {/* Footer info in left panel */}
        <div className="absolute bottom-8 left-8 flex items-center gap-2 text-[10px] text-slate-500 font-mono uppercase tracking-widest">
           <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
           MongoDB Multi-Tenant Encrypted Gateway
        </div>
      </div>

      {/* RIGHT PANEL: Authentication Form */}
      <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-8 relative bg-gradient-to-b from-[#0a0e17] to-[#070b14]">
        
        <div className="w-full max-w-sm flex flex-col">
          
          {/* Back Button */}
          <button
            type="button"
            onClick={onBack}
            className="mb-8 flex items-center gap-2 text-xs text-slate-400 hover:text-slate-200 font-mono transition-colors w-fit group cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-cyan-400 group-hover:-translate-x-1 transition-transform" />
            Back to Physician Portal
          </button>

          <div className="mb-8 text-center lg:text-left">
            <h2 className="text-2xl font-bold text-slate-100 tracking-wide">Admin Authorization</h2>
            <p className="text-sm text-slate-500 mt-1 font-mono">Authenticate with IT system administrator credentials.</p>
          </div>

          {error && (
            <div className="mb-6 flex items-center gap-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 px-4 py-3 rounded-lg text-xs font-mono shadow-inner animate-in shake">
              <ShieldAlert className="w-5 h-5 flex-shrink-0 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 flex justify-between">
                Admin Username / Staff ID
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="w-4 h-4 text-slate-600" />
                </div>
                <input
                  type="text"
                  required
                  value={credentials.username}
                  onChange={(e) => setCredentials({...credentials, username: e.target.value})}
                  className="w-full bg-[#131826] border border-[#1e293b] rounded-md py-2.5 pl-10 pr-4 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-rose-500/50 focus:ring-1 focus:ring-rose-500/30 transition-all font-mono"
                  placeholder="e.g. ST-ADMIN"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 flex justify-between">
                Passphrase / Security Key
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <KeyRound className="w-4 h-4 text-slate-600" />
                </div>
                <input
                  type="password"
                  required
                  value={credentials.password}
                  onChange={(e) => setCredentials({...credentials, password: e.target.value})}
                  className="w-full bg-[#131826] border border-[#1e293b] rounded-md py-2.5 pl-10 pr-4 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-rose-500/50 focus:ring-1 focus:ring-rose-500/30 transition-all font-mono"
                  placeholder="••••••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 bg-gradient-to-r from-rose-600 to-purple-600 hover:from-rose-500 hover:to-purple-500 text-white font-bold text-xs uppercase tracking-widest py-3 rounded-md shadow-[0_0_15px_rgba(244,63,94,0.3)] hover:shadow-[0_0_25px_rgba(244,63,94,0.5)] transition-all flex justify-center items-center h-11 cursor-pointer"
            >
              {loading ? (
                 <>
                   <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></span>
                   Verifying Clearance...
                 </>
              ) : (
                 "Authorize Admin Console"
              )}
            </button>
            
          </form>

          {/* Legal Compliance Block */}
          <div className="mt-12 p-4 bg-rose-950/20 border border-rose-900/30 rounded flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-rose-500 flex-shrink-0 mt-0.5" />
            <p className="text-[10px] leading-relaxed text-slate-400 font-mono">
              <span className="text-rose-400 font-bold uppercase block mb-1">STRICT SYSTEM GOVERNANCE</span>
              Every authentication attempt on the IT Admin Console is permanently cryptographically logged in the MongoDB security ledger. Any unauthorized intrusion will be immediately escalated to the cybersecurity operations center.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
};
