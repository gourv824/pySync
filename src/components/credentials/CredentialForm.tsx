import React, { useState } from 'react';
import { 
  User, 
  Mail, 
  Shield, 
  UserPlus, 
  Eye, 
  EyeOff, 
  Key, 
  Sparkles, 
  AlertCircle,
  Briefcase,
  Users,
  CheckCircle2,
  Lock,
  AtSign
} from 'lucide-react';
import { PasswordStrengthMeter } from './PasswordStrengthMeter';
import { CustomSelect } from '../CustomSelect';

interface CredentialFormProps {
  onSubmit: (formData: any) => Promise<void>;
  isLoading: boolean;
  error?: string | null;
}

export const CredentialForm: React.FC<CredentialFormProps> = ({ onSubmit, isLoading, error }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    username: '',
    password: '',
    role: 'employee' as 'admin' | 'employee' | 'team_leader'
  });
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const next = { ...prev, [name]: value };
      if (name === 'email' && !prev.username && value.includes('@')) {
        next.username = value.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '');
      }
      return next;
    });
  };

  const generatePassword = () => {
    const chars = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%&*";
    let retVal = "";
    for (let i = 0; i < 14; ++i) {
      retVal += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData(prev => ({ ...prev, password: retVal }));
  };

  const roleOptions = [
    {
      id: 'employee',
      label: 'Staff / Agent',
      desc: 'Browse inventory & create client inquiries',
      icon: User
    },
    {
      id: 'team_leader',
      label: 'Team Leader',
      desc: 'Supervise team leads & verify listings',
      icon: Users
    },
    {
      id: 'admin',
      label: 'Administrator',
      desc: 'Full access & configuration control',
      icon: Shield
    }
  ];

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-5">
      {error && (
        <div className="p-3.5 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-xs font-semibold flex items-center gap-2.5">
          <AlertCircle size={16} className="shrink-0 text-red-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Role Selection Grid Segment */}
      <div className="space-y-2">
        <label className="text-[11px] font-bold uppercase tracking-wider text-text-dim flex items-center gap-1.5">
          <Shield size={12} className="text-amber-primary" /> Member Authority Tier
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {roleOptions.map(r => {
            const Icon = r.icon;
            const isSelected = formData.role === r.id;
            return (
              <button
                key={r.id}
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, role: r.id as any }))}
                className={`p-3 rounded-xl border text-left transition-all relative overflow-hidden flex flex-col justify-between ${
                  isSelected 
                    ? 'bg-amber-primary/10 border-amber-primary text-text-primary shadow-sm ring-1 ring-amber-primary/30' 
                    : 'bg-surface-2 border-border-dim text-text-dim hover:text-text-primary hover:border-border-bright'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className={`p-1.5 rounded-lg ${isSelected ? 'bg-amber-primary text-black' : 'bg-surface text-text-dim'}`}>
                    <Icon size={14} />
                  </div>
                  {isSelected && (
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-primary animate-pulse" />
                  )}
                </div>
                <div>
                  <div className={`text-xs font-bold ${isSelected ? 'text-amber-primary' : 'text-text-primary'}`}>
                    {r.label}
                  </div>
                  <div className="text-[10px] text-text-dim leading-tight mt-0.5">
                    {r.desc}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Profile Details Container */}
      <div className="bg-surface-2/70 rounded-2xl border border-border-dim p-4 space-y-3.5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Full Name */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-text-secondary">Full Name</label>
            <div className="relative">
              <User size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim" />
              <input 
                required
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full bg-surface border border-border-dim hover:border-border-bright focus:border-amber-primary py-2 pl-8 pr-3 rounded-xl text-xs text-text-primary outline-none transition-all placeholder:text-text-dim/60"
                placeholder="e.g. Maya Lin"
              />
            </div>
          </div>

          {/* Email */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-text-secondary">Work Email</label>
            <div className="relative">
              <Mail size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim" />
              <input 
                required
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full bg-surface border border-border-dim hover:border-border-bright focus:border-amber-primary py-2 pl-8 pr-3 rounded-xl text-xs text-text-primary outline-none transition-all placeholder:text-text-dim/60"
                placeholder="maya.lin@company.com"
              />
            </div>
          </div>
        </div>

        {/* Username */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-semibold text-text-secondary">Assigned Username</label>
            {formData.email && !formData.username && (
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, username: prev.email.split('@')[0].toLowerCase() }))}
                className="text-[10px] text-amber-primary hover:underline"
              >
                Auto-fill from Email
              </button>
            )}
          </div>
          <div className="relative">
            <AtSign size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim" />
            <input 
              required
              name="username"
              value={formData.username}
              onChange={handleChange}
              className="w-full bg-surface border border-border-dim hover:border-border-bright focus:border-amber-primary py-2 pl-8 pr-3 rounded-xl font-mono text-xs text-text-primary outline-none transition-all placeholder:text-text-dim/60"
              placeholder="mayalin"
            />
          </div>
        </div>

        {/* Password */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center">
            <label className="text-[11px] font-semibold text-text-secondary">Initial Security Password</label>
            <button 
              type="button" 
              onClick={generatePassword}
              className="text-[11px] text-amber-primary hover:text-amber-primary/80 font-semibold hover:underline flex items-center gap-1 transition-colors"
            >
              <Sparkles size={11} /> Generate Secure
            </button>
          </div>
          <div className="relative">
            <Lock size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim" />
            <input 
              required
              type={showPassword ? 'text' : 'password'}
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full bg-surface border border-border-dim hover:border-border-bright focus:border-amber-primary py-2 pl-8 pr-9 rounded-xl font-mono text-xs text-text-primary outline-none transition-all placeholder:text-text-dim/60"
              placeholder="Create or generate password"
            />
            <button 
              type="button" 
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-dim hover:text-text-primary p-1 transition-colors"
            >
              {showPassword ? <EyeOff size={13} /> : <Eye size={13} />}
            </button>
          </div>
          <PasswordStrengthMeter password={formData.password} />
        </div>
      </div>

      {/* Submit Action Button */}
      <div className="pt-2">
        <button 
          type="submit"
          disabled={isLoading}
          className="w-full bg-amber-primary hover:bg-amber-primary/90 text-black py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-2 active:scale-[0.99] disabled:opacity-50"
        >
          {isLoading ? (
            <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
          ) : (
            <>
              <UserPlus size={16} />
              Provision Account & Dispatch Notice
            </>
          )}
        </button>
      </div>
    </form>
  );
};
