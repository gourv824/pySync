import React, { useState } from 'react';
import { 
  Key, 
  RefreshCw, 
  ShieldAlert, 
  Eye, 
  EyeOff, 
  Lock, 
  CheckCircle2, 
  AlertCircle,
  Clock,
  Activity
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { PasswordStrengthMeter } from './PasswordStrengthMeter';

interface CredentialManagerProps {
  user: {
    id: string;
    username: string;
    lastActive?: string;
  };
  onResetCredentials: () => Promise<void>;
  onPasswordChange?: (current: string, next: string) => Promise<void>;
}

export const CredentialManager: React.FC<CredentialManagerProps> = ({ 
  user, 
  onResetCredentials 
}) => {
  const [isResetting, setIsResetting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleReset = async () => {
    setIsResetting(true);
    try {
      await onResetCredentials();
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setShowConfirm(false);
      }, 3000);
    } catch (error) {
      console.error(error);
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Account Info Summary */}
      <div className="bg-surface-2 border border-border-bright rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-border-dim pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-amber-primary/10 flex items-center justify-center text-amber-primary">
              <Key size={16} />
            </div>
            <h3 className="text-xs font-black uppercase tracking-widest text-text-primary">Credentials Summary</h3>
          </div>
          <span className="text-[10px] font-mono text-text-dim px-2 py-0.5 rounded bg-surface border border-border-dim">
            ID: {user.id}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-[9px] text-text-dim uppercase tracking-widest font-bold">Username</p>
            <p className="text-xs font-medium text-text-primary">{user.username}</p>
          </div>
          <div className="space-y-1">
            <p className="text-[9px] text-text-dim uppercase tracking-widest font-bold">Password Status</p>
            <p className="text-xs text-emerald-500 font-medium flex items-center gap-1">
              <CheckCircle2 size={12} /> Encrypted
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-[9px] text-text-dim uppercase tracking-widest font-bold">Authentication</p>
            <div className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <p className="text-xs text-text-secondary">Standard (Local)</p>
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-[9px] text-text-dim uppercase tracking-widest font-bold">Last Activity</p>
            <p className="text-xs text-text-secondary">
              {user.lastActive ? new Date(user.lastActive).toLocaleDateString() : 'Never'}
            </p>
          </div>
        </div>
      </div>

      {/* Critical Actions */}
      <div className="space-y-3">
        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-text-dim flex items-center gap-2 px-1">
          <ShieldAlert size={12} /> Security Actions
        </h4>

        <div className="p-4 border border-red-500/20 bg-red-500/5 rounded-2xl space-y-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-red-500/10 text-red-500">
              <RefreshCw size={18} className={isResetting ? 'animate-spin' : ''} />
            </div>
            <div className="flex-1">
              <p className="text-xs font-bold text-text-primary">Credential Reset</p>
              <p className="text-[10px] text-text-dim leading-relaxed mt-1">
                Force a password reset and generate new temporary credentials for this user. This will invalidate their current session.
              </p>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {!showConfirm ? (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowConfirm(true)}
                className="w-full py-2.5 text-[10px] font-black uppercase tracking-widest text-red-500 border border-red-500/30 rounded-xl hover:bg-red-500 hover:text-white transition-all"
              >
                Reset Account Credentials
              </motion.button>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="space-y-3"
              >
                <div className="flex items-center gap-2 p-2 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-500 text-[9px] font-bold">
                  <AlertCircle size={14} />
                  Confirm Reset? This action cannot be undone.
                </div>
                <div className="flex gap-2">
                  <button
                    disabled={isResetting}
                    onClick={handleReset}
                    className="flex-1 py-3 bg-red-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-600 transition-all flex items-center justify-center gap-2"
                  >
                    {isResetting ? <RefreshCw size={14} className="animate-spin" /> : 'Yes, Reset Now'}
                  </button>
                  <button
                    disabled={isResetting}
                    onClick={() => setShowConfirm(false)}
                    className="flex-1 py-3 bg-surface border border-border-dim text-text-primary rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-surface-2 transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {success && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-2 text-emerald-500 text-[10px] font-bold justify-center py-2"
            >
              <CheckCircle2 size={16} />
              Credentials reset successfully!
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};
