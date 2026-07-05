import React, { useState } from 'react';
import { Mail, KeyRound, ShieldCheck, ArrowRight, Loader2, ArrowLeft } from 'lucide-react';

interface ForgotPasswordProps {
  onCancel: () => void;
  onSuccess: () => void;
}

export default function ForgotPassword({ onCancel, onSuccess }: ForgotPasswordProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [email, setEmail] = useState('');
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:8000/api/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email, 
          recovery_email: email.toLowerCase() === "admin@hepatoai.com" ? recoveryEmail : undefined 
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || 'Failed to send OTP');
      
      setStep(2);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length === 6) {
      setError('');
      setStep(3);
    } else {
      setError('Please enter a valid 6-digit OTP.');
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }
    
    setLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:8000/api/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp, newPassword })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || 'Failed to reset password');
      
      onSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-[#1a1c2c] border border-gray-700/60 rounded-2xl shadow-2xl overflow-hidden relative">
        
        {/* Header */}
        <div className="bg-[#252841] p-6 text-center border-b border-gray-700/50">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-cyan-500/10 mb-4">
            <KeyRound className="w-6 h-6 text-cyan-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Password Recovery</h2>
          <p className="text-gray-400 text-sm">
            {step === 1 && "Enter your enterprise email to receive a recovery code."}
            {step === 2 && "Enter the 6-digit OTP sent to your email."}
            {step === 3 && "Create a new secure password for your account."}
          </p>
        </div>

        {/* Content */}
        <div className="p-8">
          {error && (
            <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm text-center">
              {error}
            </div>
          )}

          {step === 1 && (
            <form onSubmit={handleSendOTP} className="space-y-6">
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">Registered Email</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="w-5 h-5 text-gray-500" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-[#252841] border border-gray-600 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
                    placeholder="doctor@hospital.org"
                    required
                  />
                </div>
              </div>
              
              {email.toLowerCase() === "admin@hepatoai.com" && (
                <div className="animate-in fade-in slide-in-from-top-2">
                  <label className="block text-gray-300 text-sm font-medium mb-2">Your Personal Email (Where to send OTP)</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="w-5 h-5 text-gray-500" />
                    </div>
                    <input
                      type="email"
                      value={recoveryEmail}
                      onChange={(e) => setRecoveryEmail(e.target.value)}
                      className="w-full bg-[#252841] border border-gray-600 rounded-xl py-3 pl-10 pr-4 text-cyan-400 font-bold focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
                      placeholder="e.g. thilina@gmail.com"
                      required
                    />
                  </div>
                  <p className="text-[10px] text-gray-500 mt-1 font-mono">For security, the OTP will be sent here instead of the default admin address.</p>
                </div>
              )}
              
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={onCancel}
                  className="flex-1 py-3 px-4 rounded-xl font-medium text-gray-300 hover:text-white bg-[#252841] hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!email || (email.toLowerCase() === "admin@hepatoai.com" && !recoveryEmail) || loading}
                  className="flex-1 py-3 px-4 rounded-xl font-semibold bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Send OTP'}
                </button>
              </div>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleVerifyOTP} className="space-y-6">
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">6-Digit OTP</label>
                <div className="relative">
                  <input
                    type="text"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
                    className="w-full bg-[#252841] border border-gray-600 rounded-xl py-4 text-center text-2xl font-bold tracking-[0.5em] text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
                    placeholder="------"
                    required
                  />
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="py-3 px-4 rounded-xl text-gray-400 hover:text-white bg-[#252841] hover:bg-gray-700 transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <button
                  type="submit"
                  disabled={otp.length !== 6}
                  className="flex-1 py-3 px-4 rounded-xl font-semibold bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                >
                  Verify <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </form>
          )}

          {step === 3 && (
            <form onSubmit={handleResetPassword} className="space-y-5">
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">New Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <ShieldCheck className="w-5 h-5 text-gray-500" />
                  </div>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full bg-[#252841] border border-gray-600 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
                    placeholder="Minimum 8 characters"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">Confirm Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <ShieldCheck className="w-5 h-5 text-gray-500" />
                  </div>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-[#252841] border border-gray-600 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
                    placeholder="Re-enter new password"
                    required
                  />
                </div>
              </div>
              
              <button
                type="submit"
                disabled={loading || !newPassword || !confirmPassword}
                className="w-full mt-4 py-3 px-4 rounded-xl font-semibold bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white disabled:opacity-50 transition-all flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Reset Password'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
