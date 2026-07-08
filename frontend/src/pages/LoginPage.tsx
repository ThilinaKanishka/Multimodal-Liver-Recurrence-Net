import React, { useState } from "react";
import { Hexagon, Lock, ShieldAlert, KeyRound, Cpu, Activity, Fingerprint, ChevronRight } from "lucide-react";
import axios from "axios";
import ForcedPasswordReset from "../components/ForcedPasswordReset";
import ForgotPassword from "../components/ForgotPassword";

export const LoginPage: React.FC<{ onLogin?: (user?: any) => void, onAdminLogin?: () => void }> = ({ onLogin, onAdminLogin }) => {
  const [credentials, setCredentials] = useState({ id: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [requiresReset, setRequiresReset] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [loggedInUser, setLoggedInUser] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.post("http://127.0.0.1:8000/api/login", {
        id: credentials.id,
        password: credentials.password
      });
      setLoading(false);
      if (response.data.message === "Login successful" && onLogin) {
        if (response.data.requires_reset) {
          setLoggedInUser(response.data.user);
          setRequiresReset(true);
        } else {
          onLogin(response.data.user);
        }
      }
    } catch (err: any) {
      setLoading(false);
      const errorMessage = err.response?.data?.detail || "Invalid login credentials";
      setError(errorMessage);
    }
  };

  if (requiresReset && loggedInUser) {
    return <ForcedPasswordReset user={loggedInUser} onComplete={() => onLogin && onLogin(loggedInUser)} />;
  }

  return (
    <div className="min-h-screen w-full bg-slate-950 flex text-slate-300 font-sans selection:bg-cyan-500/30 overflow-hidden relative">
      {showForgot && (
        <ForgotPassword 
          onCancel={() => setShowForgot(false)} 
          onSuccess={() => setShowForgot(false)} 
        />
      )}
      
      {/* Background ambient light */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-[400px] bg-cyan-600/10 rounded-[100%] blur-[120px] pointer-events-none"></div>
      
      {/* LEFT PANEL: Enterprise Branding & System Status */}
      <div className="hidden lg:flex w-[55%] relative flex-col justify-between overflow-hidden border-r border-slate-800/50 bg-[#020617]">
        
        {/* Subtle Grid Background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_20%,transparent_100%)] opacity-20 pointer-events-none"></div>
        
        {/* Glowing Orbs */}
        <div className="absolute top-20 left-20 w-72 h-72 bg-blue-600/20 rounded-full blur-[80px] pointer-events-none"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-cyan-600/10 rounded-full blur-[100px] pointer-events-none"></div>

        {/* Top Header */}
        <div className="relative z-10 p-12 flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-cyan-500/20 to-blue-600/20 rounded-xl border border-cyan-500/30 shadow-[0_0_30px_rgba(6,182,212,0.15)] backdrop-blur-md">
            <Hexagon className="w-8 h-8 text-cyan-400" strokeWidth={2} />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-wider text-white">Hepato<span className="text-cyan-400">AI</span></h1>
            <p className="text-xs font-mono text-cyan-500/70 tracking-widest uppercase">Enterprise Diagnostic Suite</p>
          </div>
        </div>

        {/* Center Content - Abstract Visualization */}
        <div className="relative z-10 flex-1 flex flex-col justify-center px-20">
          <h2 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-slate-100 to-slate-500 leading-tight mb-6">
            Next-Generation <br />
            Hepatic Analysis.
          </h2>
          <p className="text-lg text-slate-400 max-w-xl leading-relaxed font-light mb-10">
            Empowering clinicians with multimodal deep learning architectures for precise recurrence prognosis, 3D volumetric analysis, and real-time clinical insights.
          </p>
          
          {/* Feature Badges */}
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900/80 border border-slate-800 backdrop-blur-sm shadow-xl">
              <Activity className="w-4 h-4 text-emerald-400" />
              <span className="text-sm font-medium text-slate-300">99.9% Model Accuracy</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900/80 border border-slate-800 backdrop-blur-sm shadow-xl">
              <ShieldAlert className="w-4 h-4 text-blue-400" />
              <span className="text-sm font-medium text-slate-300">HIPAA Compliant</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900/80 border border-slate-800 backdrop-blur-sm shadow-xl">
              <Cpu className="w-4 h-4 text-purple-400" />
              <span className="text-sm font-medium text-slate-300">GPU Accelerated</span>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="relative z-10 p-12 flex justify-between items-center border-t border-slate-800/30 bg-slate-950/50 backdrop-blur-xl">
          <div className="flex items-center gap-3">
             <div className="relative flex h-3 w-3">
               <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
               <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
             </div>
             <span className="text-xs font-mono text-slate-400 uppercase tracking-widest">Core Systems Online</span>
          </div>
          <div className="text-xs text-slate-500 font-mono">v4.2.0-enterprise</div>
        </div>
      </div>

      {/* RIGHT PANEL: Authentication Form */}
      <div className="w-full lg:w-[45%] flex flex-col items-center justify-center p-6 relative z-10">
        
        <div className="w-full max-w-md">
          {/* Mobile Header (Hidden on Desktop) */}
          <div className="flex lg:hidden flex-col items-center mb-10">
            <div className="p-3 bg-gradient-to-br from-cyan-500/20 to-blue-600/20 rounded-xl border border-cyan-500/30 mb-4">
              <Hexagon className="w-10 h-10 text-cyan-400" />
            </div>
            <h1 className="text-3xl font-bold tracking-wider text-white">Hepato<span className="text-cyan-400">AI</span></h1>
          </div>

          {/* Form Container */}
          <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 sm:p-10 shadow-2xl relative overflow-hidden">
            
            {/* Inner Glow */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent"></div>

            <div className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-2">Physician Portal</h2>
              <p className="text-sm text-slate-400">Please authenticate with your clinical credentials.</p>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              {error && (
                <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm p-4 rounded-xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
                  <ShieldAlert className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <p>{error}</p>
                </div>
              )}
              
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Hospital ID / Email
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="w-4 h-4 text-slate-500 group-focus-within:text-cyan-400 transition-colors" />
                  </div>
                  <input
                    type="text"
                    required
                    value={credentials.id}
                    onChange={(e) => setCredentials({...credentials, id: e.target.value})}
                    className="w-full bg-slate-950/50 border border-slate-700/50 rounded-xl py-3 pl-11 pr-4 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500/50 focus:ring-4 focus:ring-cyan-500/10 transition-all font-mono shadow-inner"
                    placeholder="e.g. PT-40491"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Password
                  </label>
                  <button type="button" onClick={() => setShowForgot(true)} className="text-xs text-cyan-400 hover:text-cyan-300 font-medium transition-colors">
                    Forgot password?
                  </button>
                </div>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <KeyRound className="w-4 h-4 text-slate-500 group-focus-within:text-cyan-400 transition-colors" />
                  </div>
                  <input
                    type="password"
                    required
                    value={credentials.password}
                    onChange={(e) => setCredentials({...credentials, password: e.target.value})}
                    className="w-full bg-slate-950/50 border border-slate-700/50 rounded-xl py-3 pl-11 pr-4 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500/50 focus:ring-4 focus:ring-cyan-500/10 transition-all font-mono shadow-inner"
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
                     Sign In Securely
                     <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                   </>
                )}
              </button>
              
              <div className="relative flex items-center justify-center my-4">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-800"></div></div>
                <div className="relative bg-slate-900 px-4 text-xs text-slate-500 font-medium">or continue with</div>
              </div>

              <button
                type="button"
                className="w-full bg-slate-800/50 border border-slate-700 hover:bg-slate-800 text-slate-300 font-semibold text-sm py-3 rounded-xl transition-all flex justify-center items-center gap-3"
              >
                <Fingerprint className="w-5 h-5 text-cyan-400" />
                Biometric Login (MFA)
              </button>

            </form>
          </div>

          {/* Admin & Security Links */}
          <div className="mt-8 flex flex-col items-center gap-4">
            <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
              <ShieldAlert className="w-4 h-4 text-slate-600" />
              Protected by Enterprise Grade Encryption
            </div>
            
            <button
              type="button"
              onClick={onAdminLogin}
              className="text-xs text-slate-600 hover:text-cyan-400 font-mono transition-colors tracking-widest cursor-pointer inline-flex items-center gap-2"
            >
              <span>[</span> IT ADMIN CONSOLE <span>]</span>
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};
