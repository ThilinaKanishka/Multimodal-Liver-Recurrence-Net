import React, { useState } from "react";
import { Hexagon, Lock, ShieldAlert, KeyRound, Cpu } from "lucide-react";
import axios from "axios";
import ForcedPasswordReset from "../components/ForcedPasswordReset";
import ForgotPassword from "../components/ForgotPassword";

export const LoginPage: React.FC<{ onLogin?: () => void, onAdminLogin?: () => void }> = ({ onLogin, onAdminLogin }) => {
  const [credentials, setCredentials] = useState({ id: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [requiresReset, setRequiresReset] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [loggedInUser, setLoggedInUser] = useState<any>(null);

  /*
   * BACKEND INTEGRATION NOTE:
   * --------------------------------------------------------
   * Authentication architecture must strictly use:
   * 1. bcrypt (or Argon2) for cryptographic password hashing.
   * 2. HTTP-Only secure cookies with JWT for session management.
   * 3. Rate-limiting to prevent brute-force attacks.
   * 4. Comprehensive audit logging for all auth attempts.
   */

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
        if (credentials.password.startsWith("Hepato-")) {
          setLoggedInUser(response.data.user);
          setRequiresReset(true);
        } else {
          onLogin();
        }
      }
    } catch (err: any) {
      setLoading(false);
      const errorMessage = err.response?.data?.detail || "Invalid login credentials";
      setError(errorMessage);
    }
  };

  if (requiresReset && loggedInUser) {
    return <ForcedPasswordReset user={loggedInUser} onComplete={() => onLogin && onLogin()} />;
  }

  return (
    <div className="min-h-screen w-full bg-[#070b14] flex text-slate-300 font-sans selection:bg-cyan-500/30 overflow-hidden">
      {showForgot && (
        <ForgotPassword 
          onCancel={() => setShowForgot(false)} 
          onSuccess={() => setShowForgot(false)} 
        />
      )}
      
      {/* LEFT PANEL: Branding & System Identity */}
      <div className="hidden lg:flex w-1/2 relative bg-[#0f141f] border-r border-[#1e293b] flex-col items-center justify-center overflow-hidden">
        {/* Background Decorative Elements */}
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-cyan-900/10 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] bg-blue-900/10 rounded-full blur-[100px] pointer-events-none"></div>
        
        {/* Logo & Identity */}
        <div className="relative z-10 flex flex-col items-center text-center max-w-md px-8">
          <div className="bg-gradient-to-br from-cyan-500/20 to-blue-600/10 p-6 rounded-2xl border border-cyan-500/30 shadow-[0_0_40px_rgba(6,182,212,0.15)] mb-8">
            <Hexagon className="w-20 h-20 text-cyan-400" strokeWidth={1.5} />
            <Cpu className="w-8 h-8 text-blue-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
          </div>
          
          <h1 className="text-5xl font-bold tracking-widest text-slate-100 uppercase mb-4">
            Hepato<span className="text-cyan-400">AI</span>
          </h1>
          <div className="h-px w-24 bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent mb-6"></div>
          <h2 className="text-lg font-mono text-cyan-500/80 tracking-widest uppercase font-bold">
            Clinical Diagnostic Pipeline
          </h2>
          <p className="mt-6 text-sm text-slate-500 leading-relaxed font-medium">
            Advanced multi-modal deep learning architecture for hepatic recurrence prognosis and 3D volumetric analysis. 
          </p>
        </div>

        {/* Footer info in left panel */}
        <div className="absolute bottom-8 left-8 flex items-center gap-2 text-[10px] text-slate-600 font-mono uppercase tracking-widest">
           <span className="w-2 h-2 rounded-full bg-emerald-500/50"></span>
           Node Secure Connection
        </div>
      </div>

      {/* RIGHT PANEL: Authentication Form */}
      <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-8 relative bg-gradient-to-b from-[#0a0e17] to-[#070b14]">
        
        <div className="w-full max-w-sm flex flex-col">
          
          <div className="mb-10 text-center lg:text-left">
            <h2 className="text-2xl font-bold text-slate-100 tracking-wide">Physician Portal</h2>
            <p className="text-sm text-slate-500 mt-2 font-mono">Authenticate to access patient directories.</p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {error && (
              <div className="bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs p-3 rounded text-center">
                {error}
              </div>
            )}
            
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 flex justify-between">
                Hospital ID / Staff Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="w-4 h-4 text-slate-600" />
                </div>
                <input
                  type="text"
                  required
                  value={credentials.id}
                  onChange={(e) => setCredentials({...credentials, id: e.target.value})}
                  className="w-full bg-[#131826] border border-[#1e293b] rounded-md py-2.5 pl-10 pr-4 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30 transition-all font-mono"
                  placeholder="e.g. PT-40491 or dr.name@hospital.org"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 flex justify-between">
                <span>Secure Password</span>
                <button type="button" onClick={() => setShowForgot(true)} className="text-cyan-400 hover:text-cyan-300">Forgot?</button>
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
                  className="w-full bg-[#131826] border border-[#1e293b] rounded-md py-2.5 pl-10 pr-4 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30 transition-all font-mono"
                  placeholder="••••••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs uppercase tracking-widest py-3 rounded-md shadow-[0_0_15px_rgba(6,182,212,0.3)] hover:shadow-[0_0_25px_rgba(6,182,212,0.5)] transition-all flex justify-center items-center h-11"
            >
              {loading ? (
                 <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
              ) : (
                 "Secure Login"
              )}
            </button>
            
            <div className="relative flex items-center justify-center my-2">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-[#1e293b]"></div></div>
              <div className="relative bg-[#070b14] px-4 text-[10px] font-mono text-slate-600 uppercase tracking-widest">Or</div>
            </div>

            <button
              type="button"
              className="w-full bg-[#131826] border border-[#2a364a] hover:border-slate-500 text-slate-300 font-bold text-xs uppercase tracking-widest py-2.5 rounded-md transition-all flex justify-center items-center gap-2"
            >
              <ShieldAlert className="w-4 h-4 text-amber-500" />
              Login via Smart Card / MFA
            </button>

          </form>

          {/* Legal Compliance Block */}
          <div className="mt-12 p-4 bg-rose-950/20 border border-rose-900/30 rounded flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-rose-500 flex-shrink-0 mt-0.5" />
            <p className="text-[10px] leading-relaxed text-slate-400 font-mono">
              <span className="text-rose-400 font-bold uppercase block mb-1">RESTRICTED SYSTEM</span>
              Unauthorized access is strictly prohibited and monitored. Compliant with HIPAA & Data Protection regulations. All authentication attempts are logged. Accounts are provisioned exclusively by IT Administration.
            </p>
          </div>

          {/* TASK 1: Subtle IT Admin Console Link */}
          <div className="mt-8 text-center">
            <button
              type="button"
              onClick={onAdminLogin}
              className="text-xs text-gray-500 hover:text-gray-400 font-mono transition-colors tracking-widest cursor-pointer inline-flex items-center gap-1.5"
            >
              🔒 IT Admin Console
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};
