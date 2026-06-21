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
  Clock,
  User,
  Smartphone
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { PasswordStrengthMeter } from './PasswordStrengthMeter';

// --- Login Form ---
interface LoginFormProps {
  onLogin: (data: any) => Promise<void>;
  onForgotPassword: () => void;
  onRegister: () => void;
  isLoading: boolean;
  error?: string | null;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onLogin, onForgotPassword, onRegister, isLoading, error }) => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="space-y-2">
        <div className="space-y-0.5">
          <label className="text-[9px] text-text-dim uppercase tracking-widest font-black ml-1">Work Email</label>
          <div className="relative group">
            <Mail size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-dim group-focus-within:text-amber-primary transition-colors" />
            <input 
              required
              type="email"
              value={formData.email}
              onChange={e => setFormData({ ...formData, email: e.target.value })}
              className="w-full bg-surface border-3d shadow-3d-inset p-2.5 pl-10 rounded-[14px] text-xs text-text-primary focus:border-amber-primary outline-none transition-all placeholder:text-text-dim/50"
              placeholder="name@company.com"
            />
          </div>
        </div>

        <div className="space-y-0.5">
          <div className="flex justify-between items-center ml-1">
            <label className="text-[9px] text-text-dim uppercase tracking-widest font-black">Password</label>
            <button 
              type="button"
              onClick={onForgotPassword}
              className="text-[9px] text-amber-primary font-bold hover:underline tracking-tight"
            >
              Forgot?
            </button>
          </div>
          <div className="relative group">
            <Key size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-dim group-focus-within:text-amber-primary transition-colors" />
            <button 
              type="button"
              onMouseDown={() => setShowPassword(true)}
              onMouseUp={() => setShowPassword(false)}
              onMouseLeave={() => setShowPassword(false)}
              onTouchStart={() => setShowPassword(true)}
              onTouchEnd={() => setShowPassword(false)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-dim hover:text-text-primary transition-colors cursor-pointer select-none"
              title="Hold to reveal"
            >
              {showPassword ? <Eye size={13} className="text-amber-primary" /> : <Eye size={13} />}
            </button>
            <input 
              required
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={e => setFormData({ ...formData, password: e.target.value })}
              className="w-full bg-surface border-3d shadow-3d-inset p-2.5 pl-10 pr-10 rounded-[14px] font-mono text-xs text-text-primary focus:border-amber-primary outline-none transition-all placeholder:text-text-dim/50"
              placeholder="12+ chars + digit"
            />
          </div>
        </div>
      </div>

      {error && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 p-2 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-[9px] font-bold"
        >
          <AlertCircle size={11} />
          {error}
        </motion.div>
      )}

      <div className="space-y-2">
        <button 
          disabled={isLoading}
          className="group relative w-full bg-amber-primary text-bg py-3 rounded-[14px] text-[10px] font-black uppercase tracking-[0.2em] shadow-3d-button hover:bg-amber-secondary transition-all flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <div className="w-3 h-3 border-2 border-bg/30 border-t-bg rounded-full animate-spin" />
          ) : (
            <>
              Access System
              <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </>
          )}
        </button>

        <button 
          type="button"
          onClick={onRegister}
          className="w-full py-0.5 text-[9px] font-bold text-text-dim hover:text-amber-primary transition-colors uppercase tracking-[0.15em]"
        >
          First time? <span className="text-amber-primary ml-1">Register Now</span>
        </button>
      </div>
    </form>
  );
};

// --- Register Form ---
interface RegisterFormProps {
  onRegister: (data: any) => Promise<void>;
  onBack: () => void;
  isLoading: boolean;
  error?: string | null;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({ onRegister, onBack, isLoading, error }) => {
  const [formData, setFormData] = useState({ 
    fullName: '', 
    email: '', 
    phoneNumber: '', 
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      return;
    }
    onRegister(formData);
  };

  return (
    <div className="space-y-3">
      <div className="space-y-0.5">
        <h3 className="text-lg font-bold text-text-primary uppercase tracking-tight">Create Account</h3>
        <p className="text-[10px] text-text-dim leading-tight opacity-70">Join the pySync network and manage projects.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-2.5">
        <div className="space-y-1.5">
          <div className="space-y-0.5">
            <label className="text-[9px] text-text-dim uppercase tracking-widest font-black ml-1">Full Name</label>
            <div className="relative group">
              <User size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-dim group-focus-within:text-amber-primary transition-colors" />
              <input 
                required
                type="text"
                value={formData.fullName}
                onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                className="w-full bg-surface border-3d shadow-3d-inset p-2 pl-10 rounded-[14px] text-xs text-text-primary focus:border-amber-primary outline-none transition-all"
                placeholder="John Doe"
              />
            </div>
          </div>

          <div className="space-y-0.5">
            <label className="text-[9px] text-text-dim uppercase tracking-widest font-black ml-1">Work Email</label>
            <div className="relative group">
              <Mail size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-dim group-focus-within:text-amber-primary transition-colors" />
              <input 
                required
                type="email"
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                className="w-full bg-surface border-3d shadow-3d-inset p-2 pl-10 rounded-[14px] text-xs text-text-primary focus:border-amber-primary outline-none transition-all"
                placeholder="name@company.com"
              />
            </div>
          </div>

          <div className="space-y-0.5">
            <label className="text-[9px] text-text-dim uppercase tracking-widest font-black ml-1">Phone Number</label>
            <div className="relative group">
              <Smartphone size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-dim group-focus-within:text-amber-primary transition-colors" />
              <input 
                required
                type="tel"
                value={formData.phoneNumber}
                onChange={e => setFormData({ ...formData, phoneNumber: e.target.value })}
                className="w-full bg-surface border-3d shadow-3d-inset p-2 pl-10 rounded-[14px] text-xs text-text-primary focus:border-amber-primary outline-none transition-all"
                placeholder="+91 98765 43210"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
             <div className="space-y-0.5">
              <label className="text-[9px] text-text-dim uppercase tracking-widest font-black ml-1">Password</label>
              <div className="relative group">
                <input 
                  required
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={e => setFormData({ ...formData, password: e.target.value })}
                  className="w-full bg-surface border-3d shadow-3d-inset p-2 pr-8 rounded-[14px] text-xs text-text-primary focus:border-amber-primary outline-none transition-all"
                  placeholder="12+ chars"
                />
                <button 
                  type="button"
                  onMouseDown={() => setShowPassword(true)}
                  onMouseUp={() => setShowPassword(false)}
                  onMouseLeave={() => setShowPassword(false)}
                  onTouchStart={() => setShowPassword(true)}
                  onTouchEnd={() => setShowPassword(false)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-dim hover:text-text-primary transition-colors cursor-pointer select-none"
                  title="Hold to reveal"
                >
                  {showPassword ? <Eye size={12} className="text-amber-primary" /> : <Eye size={12} />}
                </button>
              </div>
            </div>
            <div className="space-y-0.5">
              <label className="text-[9px] text-text-dim uppercase tracking-widest font-black ml-1">Confirm</label>
              <input 
                required
                type={showPassword ? 'text' : 'password'}
                value={formData.confirmPassword}
                onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })}
                className="w-full bg-surface border-3d shadow-3d-inset p-2 rounded-[14px] text-xs text-text-primary focus:border-amber-primary outline-none transition-all"
                placeholder="Match"
              />
            </div>
          </div>
        </div>

        {error && (
          <div className="p-2 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-[9px] font-bold">
            {error}
          </div>
        )}

        <div className="space-y-1.5 pt-0.5">
          <button 
            disabled={isLoading}
            className="w-full bg-amber-primary text-bg py-2.5 rounded-[14px] text-[10px] font-black uppercase tracking-[0.2em] shadow-3d-button hover:bg-amber-secondary transition-all"
          >
            {isLoading ? 'Creating Account...' : 'Register'}
          </button>
          <button 
            type="button"
            onClick={onBack}
            className="w-full py-1 text-[9px] font-bold text-text-dim hover:text-text-primary transition-colors uppercase tracking-widest"
          >
            Back to Login
          </button>
        </div>
      </form>
    </div>
  );
};

// --- Forgot Password ---
interface ForgotPasswordProps {
  onBack: () => void;
  onSendReset: (email: string) => Promise<void>;
  isLoading: boolean;
  message?: string | null;
  debugResetLink?: string | null;
  isError?: boolean;
}

export const ForgotPasswordForm: React.FC<ForgotPasswordProps> = ({ onBack, onSendReset, isLoading, message, debugResetLink, isError }) => {
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
              isError || message.toLowerCase().includes('failed') || message.toLowerCase().includes('error') || message.toLowerCase().includes('not found')
              ? 'bg-red-500/10 border-red-500/20 text-red-500'
              : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'
            }`}
          >
            {message}
          </motion.div>
        )}

        {debugResetLink && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-amber-500/10 border border-amber-500/20 text-amber-primary rounded-xl text-xs space-y-2 font-bold"
          >
            <p className="text-text-primary">🔧 Dev/Test Mode Option:</p>
            <p className="text-[10px] text-text-dim break-all bg-surface border-3d shadow-3d-inset p-3 rounded-xl text-text-primary select-all font-mono">
              {debugResetLink}
            </p>
            <a 
              href={debugResetLink}
              className="inline-block w-full text-center p-3 bg-3d border-3d shadow-3d-button text-amber-primary uppercase tracking-wider rounded-[20px] font-bold text-[11px] hover:text-white transition-all"
            >
              Reset Password Now
            </a>
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
