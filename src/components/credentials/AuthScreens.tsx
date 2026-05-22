import React, { useState } from 'react';
import { 
  Key, 
  Mail, 
  ShieldCheck, 
  Eye, 
  EyeOff, 
  ArrowRight,
  Unlock,
  AlertCircle,
  Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { PasswordStrengthMeter } from './PasswordStrengthMeter';

// --- Login Form ---
interface LoginFormProps {
  onLogin: (data: any) => Promise<void>;
  onForgotPassword: () => void;
  isLoading: boolean;
  error?: string | null;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onLogin, onForgotPassword, isLoading, error }) => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-[10px] text-text-dim uppercase tracking-widest font-black ml-1">Work Email</label>
          <div className="relative group">
            <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-dim group-focus-within:text-amber-primary transition-colors" />
            <input 
              required
              type="email"
              value={formData.email}
              onChange={e => setFormData({ ...formData, email: e.target.value })}
              className="w-full bg-surface border-3d shadow-3d-inset p-4 pl-12 rounded-[20px] text-sm text-text-primary focus:border-amber-primary outline-none transition-all placeholder:text-text-dim/50"
              placeholder="name@company.com"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex justify-between items-center ml-1">
            <label className="text-[10px] text-text-dim uppercase tracking-widest font-black">Secure Password</label>
            <button 
              type="button"
              onClick={onForgotPassword}
              className="text-[9px] text-amber-primary font-bold hover:underline tracking-tight"
            >
              Forgot Access?
            </button>
          </div>
          <div className="relative group">
            <Key size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-dim group-focus-within:text-amber-primary transition-colors" />
            <button 
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-text-dim hover:text-text-primary transition-colors"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
            <input 
              required
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={e => setFormData({ ...formData, password: e.target.value })}
              className="w-full bg-surface border-3d shadow-3d-inset p-4 pl-12 pr-12 rounded-[20px] font-mono text-sm text-text-primary focus:border-amber-primary outline-none transition-all placeholder:text-text-dim/50"
              placeholder="••••••••••••"
            />
          </div>
        </div>
      </div>

      {error && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-[11px] font-bold"
        >
          <AlertCircle size={14} />
          {error}
        </motion.div>
      )}

      <button 
        disabled={isLoading}
        className="group relative w-full bg-amber-primary text-bg py-4 rounded-[20px] text-xs font-black uppercase tracking-[0.25em] shadow-3d-button hover:bg-amber-secondary transition-all flex items-center justify-center gap-3"
      >
        {isLoading ? (
          <div className="w-5 h-5 border-2 border-bg/30 border-t-bg rounded-full animate-spin" />
        ) : (
          <>
            Access System
            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </>
        )}
      </button>
    </form>
  );
};

// --- Forgot Password ---
interface ForgotPasswordProps {
  onBack: () => void;
  onSendReset: (email: string) => Promise<void>;
  isLoading: boolean;
  message?: string | null;
}

export const ForgotPasswordForm: React.FC<ForgotPasswordProps> = ({ onBack, onSendReset, isLoading, message }) => {
  const [email, setEmail] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSendReset(email);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-lg font-bold text-text-primary flex items-center gap-2">
          <Unlock size={20} className="text-amber-primary" />
          Recovery Mode
        </h3>
        <p className="text-[11px] text-text-secondary leading-relaxed">
          Forgot your credentials? Enter your work email below and we'll send you a secure recovery link.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-1.5">
          <label className="text-[10px] text-text-dim uppercase tracking-widest font-black ml-1">Email for Recovery</label>
          <div className="relative">
            <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-dim" />
            <input 
              required
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full bg-surface border-3d shadow-3d-inset p-4 pl-12 rounded-[20px] text-sm text-text-primary focus:border-amber-primary outline-none transition-all"
              placeholder="name@company.com"
            />
          </div>
        </div>

        {message && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={`p-4 rounded-xl text-[11px] font-bold border ${
              message.toLowerCase().includes('failed') || message.toLowerCase().includes('error')
              ? 'bg-red-500/10 border-red-500/20 text-red-500'
              : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'
            }`}
          >
            {message}
          </motion.div>
        )}

        <div className="flex flex-col gap-3">
          <button 
            disabled={isLoading}
            className="w-full p-4 bg-3d border-3d shadow-3d-button text-amber-primary rounded-[20px] font-bold text-sm hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed group relative overflow-hidden flex justify-center items-center gap-2"
          >
            {isLoading ? 'Processing...' : 'Request Recovery Link'}
          </button>
          <button 
            type="button"
            onClick={onBack}
            className="w-full py-2 text-[10px] font-bold text-text-dim hover:text-text-primary transition-colors uppercase tracking-widest"
          >
            Back to Login
          </button>
        </div>
      </form>
    </div>
  );
};
