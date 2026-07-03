import React, { useState } from 'react';
import { AlertTriangle, Lock, ShieldCheck, ArrowRight, Loader2, KeyRound, X } from 'lucide-react';

interface User {
  id: string;
  name?: string;
  email?: string;
}

interface ForcedPasswordResetProps {
  user: User;
  onComplete: () => void;
}

export default function ForcedPasswordReset({ user, onComplete }: ForcedPasswordResetProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otp, setOtp] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const passwordsMatch = newPassword === confirmPassword;
  const isSecure = newPassword.length >= 8;
  const isFormValid = currentPassword && newPassword && confirmPassword && passwordsMatch && isSecure;

  const handleSkip = async () => {
    try {
      await fetch('http://127.0.0.1:8000/api/skip-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: user.id })
      });
    } catch (e) {
      console.error("Failed to mark as skipped", e);
    }
    onComplete();
  };

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;
    
    // Fallback if no email is found in the user object
    if (!user.email) {
       return handleDirectChange();
    }

    setLoading(true);
    setError('');

    try {
      // Send OTP to email
      const response = await fetch('http://127.0.0.1:8000/api/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email })
      });
      
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || 'Failed to send OTP to your email.');

      setStep(2);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  const handleDirectChange = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://127.0.0.1:8000/api/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: user.id,
          currentPassword,
          newPassword
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || 'Failed to update credentials.');
      onComplete();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('http://127.0.0.1:8000/api/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: user.email,
          otp,
          newPassword
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || 'Invalid OTP or failed to update.');

      onComplete();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#1a1c2c] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#252841] border border-gray-700/50 rounded-2xl shadow-2xl overflow-hidden relative">
        
        {/* Skip Button */}
        <button 
          type="button"
          onClick={handleSkip}
          className="absolute top-4 right-4 text-gray-400 hover:text-white bg-gray-800/50 hover:bg-gray-700/50 p-2 rounded-full transition-all"
          title="Skip for now"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="bg-red-500/10 border-b border-red-500/20 p-6 flex items-start gap-4">
          <div className="bg-red-500/20 p-3 rounded-full mt-1">
            <AlertTriangle className="text-red-400 w-6 h-6" />
          </div>
          <div className="pr-6">
            <h2 className="text-xl font-bold text-white mb-1">HIPAA Compliance</h2>
            <p className="text-red-300/80 text-sm leading-relaxed">
              {step === 1 ? 'You should update your temporary credentials before accessing the dashboard.' : `An OTP has been sent to ${user.email}. Please verify to continue.`}
            </p>
          </div>
        </div>

        {/* Form */}
        <div className="p-6">
          {error && (
            <div className="mb-5 bg-red-500/10 border border-red-500/30 text-red-400 text-sm p-3 rounded-lg flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {step === 1 ? (
            <form onSubmit={handleSendOTP} className="space-y-5">
              <div>
                <label className="block text-gray-400 text-sm font-medium mb-2">Current Temporary Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="w-5 h-5 text-gray-500" />
                  </div>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full bg-[#1a1c2c] border border-gray-700 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
                    placeholder="Enter temporary password"
                    required
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-gray-700/50">
                <label className="block text-gray-400 text-sm font-medium mb-2">New Secure Password</label>
                <div className="relative mb-4">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <ShieldCheck className="w-5 h-5 text-gray-500" />
                  </div>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full bg-[#1a1c2c] border border-gray-700 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
                    placeholder="Minimum 8 characters"
                    required
                  />
                </div>

                <label className="block text-gray-400 text-sm font-medium mb-2">Confirm New Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <ShieldCheck className="w-5 h-5 text-gray-500" />
                  </div>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={`w-full bg-[#1a1c2c] border rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none transition-colors ${
                      confirmPassword && !passwordsMatch 
                        ? 'border-red-500 focus:border-red-500 focus:ring-red-500' 
                        : 'border-gray-700 focus:border-cyan-500 focus:ring-cyan-500'
                    }`}
                    placeholder="Re-enter new password"
                    required
                  />
                </div>
                
                {confirmPassword && !passwordsMatch && (
                  <p className="text-red-400 text-xs mt-2 ml-1">Passwords do not match.</p>
                )}
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={handleSkip}
                  className="flex-1 py-3.5 px-4 rounded-xl font-semibold bg-gray-700/50 hover:bg-gray-700 text-gray-300 transition-all duration-200"
                >
                  Skip
                </button>
                <button
                  type="submit"
                  disabled={!isFormValid || loading}
                  className={`flex-[2] flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl font-semibold transition-all duration-200 ${
                    isFormValid 
                      ? 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-lg shadow-cyan-900/20' 
                      : 'bg-gray-700/50 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      {user.email ? 'Send OTP' : 'Update'} <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleVerifyOTP} className="space-y-6 mt-4">
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-cyan-500/10 mb-4 border border-cyan-500/20">
                  <KeyRound className="w-8 h-8 text-cyan-400" />
                </div>
                <h3 className="text-lg font-bold text-white">Enter OTP Code</h3>
                <p className="text-gray-400 text-sm mt-1">Check your inbox for the 6-digit code.</p>
              </div>

              <div>
                <div className="relative">
                  <input
                    type="text"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
                    className="w-full bg-[#1a1c2c] border border-gray-600 rounded-xl py-4 text-center text-2xl font-bold tracking-[0.5em] text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
                    placeholder="------"
                    required
                  />
                </div>
              </div>
              
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="py-3 px-4 rounded-xl font-semibold bg-gray-700/50 hover:bg-gray-700 text-gray-300 transition-all duration-200"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={otp.length !== 6 || loading}
                  className="flex-1 py-3 px-4 rounded-xl font-semibold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/20"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Verify & Update'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
