import React, { useState } from "react";
import { Hexagon, Lock, ShieldAlert, KeyRound, Terminal, Mail, ArrowLeft, ShieldCheck, Database, Server, ChevronRight } from "lucide-react";
import ForgotPassword from "../components/ForgotPassword";

export const AdminLoginPage: React.FC<{ onLogin: () => void; onBack: () => void }> = ({ onLogin, onBack }) => {
  const [credentials, setCredentials] = useState({ username: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [otpRequired, setOtpRequired] = useState(false);
  const [otp, setOtp] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    fetch("http://localhost:8000/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: credentials.username, password: credentials.password })
    })
      .then((res) => res.json())
      .then((data) => {
        setLoading(false);
        if (data.detail) {
          const errorMsg = Array.isArray(data.detail) ? "Invalid input format." : data.detail;
          setError(errorMsg || "Invalid administrator credentials or revoked security key.");
        } else if (data.requires_otp) {
          setOtpRequired(true);
        } else {
          onLogin();
        }
      })
      .catch((err) => {
        setLoading(false);
        setError("Network error connecting to authentication server.");
      });
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    fetch("http://localhost:8000/api/login/verify-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: credentials.username, otp: otp })
    })
      .then((res) => res.json())
      .then((data) => {
        setLoading(false);
        if (data.detail) {
          setError(data.detail);
        } else {
          onLogin();
        }
      })
      .catch((err) => {
        setLoading(false);
        setError("Network error verifying OTP.");
      });
  };

  return (
    <div className="min-h-screen w-full bg-[#030712] flex text-slate-300 font-sans selection:bg-rose-500/30 overflow-hidden relative">
      
      {/* Background ambient light */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-[400px] bg-rose-900/10 rounded-[100%] blur-[120px] pointer-events-none"></div>
      
      {/* LEFT PANEL: Enterprise Branding & Mission Control */}
      <div className="hidden lg:flex w-[55%] relative flex-col justify-between overflow-hidden border-r border-slate-800/50 bg-[#020617]">
        
        {/* Subtle Grid Background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_20%,transparent_100%)] opacity-20 pointer-events-none"></div>
        
        {/* Glowing Orbs */}
        <div className="absolute top-10 left-10 w-96 h-96 bg-rose-600/10 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="absolute bottom-10 right-10 w-80 h-80 bg-purple-600/10 rounded-full blur-[90px] pointer-events-none"></div>

        {/* Top Header */}
        <div className="relative z-10 p-12 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-rose-500/20 to-purple-600/20 rounded-xl border border-rose-500/30 shadow-[0_0_30px_rgba(244,63,94,0.15)] backdrop-blur-md">
              <Hexagon className="w-8 h-8 text-rose-400" strokeWidth={2} />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-wider text-white">Hepato<span className="text-rose-400">AI</span></h1>
              <p className="text-xs font-mono text-rose-500/70 tracking-widest uppercase">Admin Mission Control</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-2 text-xs text-slate-400 hover:text-white font-medium transition-colors bg-slate-900/50 border border-slate-800 px-4 py-2 rounded-full backdrop-blur-md"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Portal
          </button>
        </div>

        {/* Center Content - Abstract Visualization */}
        <div className="relative z-10 flex-1 flex flex-col justify-center px-20">
          <div className="inline-flex items-center gap-2 bg-rose-950/40 border border-rose-800/50 text-rose-400 px-4 py-1.5 rounded-full text-xs font-mono font-bold w-fit mb-8">
            <ShieldCheck className="w-4 h-4" />
            LEVEL 5 CLEARANCE REQUIRED
          </div>
          <h2 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-slate-100 to-slate-400 leading-tight mb-6">
            System Governance <br />
            & Security Protocol.
          </h2>
          <p className="text-lg text-slate-400 max-w-xl leading-relaxed font-light mb-10">
            Advanced infrastructure management, clinical credential provisioning, and immutable real-time MongoDB auditing ledgers.
          </p>
          
          {/* Feature Badges */}
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900/80 border border-slate-800 backdrop-blur-sm shadow-xl">
              <Database className="w-4 h-4 text-purple-400" />
              <span className="text-sm font-medium text-slate-300">Encrypted Ledger</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900/80 border border-slate-800 backdrop-blur-sm shadow-xl">
              <Server className="w-4 h-4 text-emerald-400" />
              <span className="text-sm font-medium text-slate-300">Zero-Trust Network</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900/80 border border-slate-800 backdrop-blur-sm shadow-xl">
              <Terminal className="w-4 h-4 text-blue-400" />
              <span className="text-sm font-medium text-slate-300">Live Telemetry</span>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="relative z-10 p-12 flex justify-between items-center border-t border-slate-800/30 bg-slate-950/50 backdrop-blur-xl">
          <div className="flex items-center gap-3">
             <div className="relative flex h-3 w-3">
               <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
               <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
             </div>
             <span className="text-xs font-mono text-slate-400 uppercase tracking-widest">Multi-Tenant Gateway Active</span>
          </div>
          <div className="text-xs text-slate-500 font-mono">Build 1094.Admin</div>
        </div>
      </div>

      {/* RIGHT PANEL: Authentication Form */}
      <div className="w-full lg:w-[45%] flex flex-col items-center justify-center p-6 relative z-10">
        
        <div className="w-full max-w-md">
          {/* Mobile Header (Hidden on Desktop) */}
          <div className="flex lg:hidden flex-col items-center mb-10 relative">
            <button
              onClick={onBack}
              className="absolute left-0 top-0 p-2 text-slate-400 hover:text-white"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="p-3 bg-gradient-to-br from-rose-500/20 to-purple-600/20 rounded-xl border border-rose-500/30 mb-4">
              <Hexagon className="w-10 h-10 text-rose-400" />
            </div>
            <h1 className="text-3xl font-bold tracking-wider text-white">Hepato<span className="text-rose-400">AI</span></h1>
          </div>

          {/* Form Container */}
          <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 sm:p-10 shadow-2xl relative overflow-hidden">
            
            {/* Inner Glow */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-rose-500/50 to-transparent"></div>

            <div className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-2">Admin Authorization</h2>
              <p className="text-sm text-slate-400">
                {otpRequired ? "Enter the 6-digit security code sent to your email." : "Authenticate with IT system administrator credentials."}
              </p>
            </div>

            {!otpRequired ? (
              <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              {error && (
                <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm p-4 rounded-xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
                  <ShieldAlert className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <p>{error}</p>
                </div>
              )}
              
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Admin Email Address
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail className="w-4 h-4 text-slate-500 group-focus-within:text-rose-400 transition-colors" />
                  </div>
                  <input
                    type="email"
                    required
                    value={credentials.username}
                    onChange={(e) => setCredentials({...credentials, username: e.target.value})}
                    className="w-full bg-slate-950/50 border border-slate-700/50 rounded-xl py-3 pl-11 pr-4 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-rose-500/50 focus:ring-4 focus:ring-rose-500/10 transition-all font-mono shadow-inner"
                    placeholder="admin@HepatoAI.com"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Passphrase
                  </label>
                  <button type="button" onClick={() => setShowForgotPassword(true)} className="text-xs text-rose-400 hover:text-rose-300 font-medium transition-colors">
                    Forgot Passphrase?
                  </button>
                </div>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <KeyRound className="w-4 h-4 text-slate-500 group-focus-within:text-rose-400 transition-colors" />
                  </div>
                  <input
                    type="password"
                    required
                    value={credentials.password}
                    onChange={(e) => setCredentials({...credentials, password: e.target.value})}
                    className="w-full bg-slate-950/50 border border-slate-700/50 rounded-xl py-3 pl-11 pr-4 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-rose-500/50 focus:ring-4 focus:ring-rose-500/10 transition-all font-mono shadow-inner"
                    placeholder="••••••••••••"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-4 bg-white text-slate-950 hover:bg-slate-200 font-bold text-sm uppercase tracking-wider py-3.5 rounded-xl transition-all flex justify-center items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed group shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_25px_rgba(255,255,255,0.2)]"
              >
                {loading ? (
                   <span className="w-5 h-5 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin"></span>
                ) : (
                   <>
                     Authorize Session
                     <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                   </>
                )}
              </button>
              
            </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="flex flex-col gap-5">
                {error && (
                  <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm p-4 rounded-xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
                    <ShieldAlert className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <p>{error}</p>
                  </div>
                )}
                
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Security Code (OTP)
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <KeyRound className="w-4 h-4 text-slate-500 group-focus-within:text-rose-400 transition-colors" />
                    </div>
                    <input
                      type="text"
                      required
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                      className="w-full bg-slate-950/50 border border-slate-700/50 rounded-xl py-3 pl-11 pr-4 text-center text-2xl tracking-[0.5em] text-white placeholder-slate-600 focus:outline-none focus:border-rose-500/50 focus:ring-4 focus:ring-rose-500/10 transition-all font-mono shadow-inner"
                      placeholder="------"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-3 mt-4">
                  <button
                    type="submit"
                    disabled={loading || otp.length !== 6}
                    className="w-full bg-white text-slate-950 hover:bg-slate-200 font-bold text-sm uppercase tracking-wider py-3.5 rounded-xl transition-all flex justify-center items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed group shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_25px_rgba(255,255,255,0.2)]"
                  >
                    {loading ? (
                      <span className="w-5 h-5 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin"></span>
                    ) : (
                      <>
                        Verify Identity
                        <ShieldCheck className="w-4 h-4 group-hover:scale-110 transition-transform" />
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setOtpRequired(false); setOtp(""); setError(null); }}
                    className="text-xs text-slate-400 hover:text-white transition-colors py-2"
                  >
                    Cancel & Return to Login
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Legal Compliance Block */}
          <div className="mt-8 p-5 bg-rose-950/20 border border-rose-900/30 rounded-2xl flex items-start gap-4">
            <ShieldAlert className="w-6 h-6 text-rose-500 flex-shrink-0" />
            <p className="text-xs leading-relaxed text-slate-400 font-medium">
              <span className="text-rose-400 font-bold uppercase block mb-1">Strict System Governance</span>
              Every authentication attempt on the IT Admin Console is permanently cryptographically logged in the security ledger. Any unauthorized intrusion will be immediately escalated.
            </p>
          </div>

        </div>
      </div>
      
      {showForgotPassword && (
        <ForgotPassword 
          onCancel={() => setShowForgotPassword(false)} 
          onSuccess={() => {
            setShowForgotPassword(false);
            setError("Password successfully updated. Please login with your new credentials.");
          }} 
        />
      )}
    </div>
  );
};
