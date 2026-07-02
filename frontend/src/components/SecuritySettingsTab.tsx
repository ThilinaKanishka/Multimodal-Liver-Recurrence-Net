import React, { useState } from 'react';
import { Lock, CheckCircle2, XCircle, Loader2 } from 'lucide-react';

interface SecuritySettingsTabProps {
  userId: string;
}

export default function SecuritySettingsTab({ userId }: SecuritySettingsTabProps) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const isFormValid = currentPassword.length > 0 && newPassword.length >= 8 && newPassword === confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;
    
    setLoading(true);
    setStatus('idle');
    setMessage('');

    try {
      const response = await fetch('http://localhost:8000/api/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: userId,
          currentPassword,
          newPassword
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.detail || 'Failed to change password');
      }

      setStatus('success');
      setMessage('Password updated successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      
    } catch (err: any) {
      setStatus('error');
      setMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#252841] border border-gray-700/60 rounded-2xl p-8 shadow-lg max-w-2xl mx-auto">
      <div className="mb-6 border-b border-gray-700/50 pb-6">
        <h3 className="text-xl font-semibold text-white flex items-center gap-2">
          <Lock className="w-5 h-5 text-cyan-500" />
          Security Settings
        </h3>
        <p className="text-gray-400 mt-2 text-sm">
          Update your enterprise login credentials. We recommend using a strong password with a mix of letters, numbers, and symbols.
        </p>
      </div>

      {status !== 'idle' && (
        <div className={`p-4 rounded-xl mb-6 flex items-start gap-3 ${
          status === 'success' ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-red-500/10 border border-red-500/20'
        }`}>
          {status === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
          ) : (
            <XCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          )}
          <p className={status === 'success' ? 'text-emerald-400' : 'text-red-400'}>
            {message}
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
          <label className="text-sm font-medium text-gray-300 md:text-right">Current Password</label>
          <div className="md:col-span-2">
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full bg-[#1a1c2c] border border-gray-600 rounded-lg py-2.5 px-4 text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
              placeholder="Enter current password"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
          <label className="text-sm font-medium text-gray-300 md:text-right">New Password</label>
          <div className="md:col-span-2">
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full bg-[#1a1c2c] border border-gray-600 rounded-lg py-2.5 px-4 text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
              placeholder="Minimum 8 characters"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
          <label className="text-sm font-medium text-gray-300 md:text-right">Confirm Password</label>
          <div className="md:col-span-2">
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={`w-full bg-[#1a1c2c] border rounded-lg py-2.5 px-4 text-white focus:outline-none transition-all ${
                confirmPassword && newPassword !== confirmPassword 
                  ? 'border-red-500 focus:border-red-500 focus:ring-red-500' 
                  : 'border-gray-600 focus:border-cyan-500 focus:ring-cyan-500'
              }`}
              placeholder="Re-enter new password"
              required
            />
          </div>
        </div>

        <div className="pt-4 flex justify-end">
          <button
            type="submit"
            disabled={!isFormValid || loading}
            className={`flex items-center justify-center gap-2 py-2.5 px-6 rounded-lg font-medium transition-all ${
              isFormValid
                ? 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-md shadow-cyan-900/30'
                : 'bg-gray-700 text-gray-500 cursor-not-allowed'
            }`}
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}
