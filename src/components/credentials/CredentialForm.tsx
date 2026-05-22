import React, { useState } from 'react';
import { User, Mail, Shield, UserPlus, Eye, EyeOff, Key } from 'lucide-react';
import { PasswordStrengthMeter } from './PasswordStrengthMeter';

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
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const generatePassword = () => {
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+";
    let retVal = "";
    for (let i = 0, n = charset.length; i < 12; ++i) {
      retVal += charset.charAt(Math.floor(Math.random() * n));
    }
    setFormData(prev => ({ ...prev, password: retVal }));
  };

  return (
    <form onSubmit={handleSubmit} className="p-8 space-y-6">
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-xs font-medium flex items-center gap-2">
          <Shield size={16} />
          {error}
        </div>
      )}

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-[10px] text-text-dim uppercase tracking-widest font-bold ml-1">Full Name</label>
            <div className="relative">
              <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim" />
              <input 
                required
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full bg-surface-2 border border-border-bright p-3 pl-10 rounded-xl text-xs text-text-primary focus:border-amber-primary outline-none transition-all placeholder:text-text-dim"
                placeholder="John Doe"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] text-text-dim uppercase tracking-widest font-bold ml-1">Role</label>
            <div className="relative">
              <Shield size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim" />
              <select 
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="w-full bg-surface-2 border border-border-bright p-3 pl-10 rounded-xl text-xs text-text-primary focus:border-amber-primary outline-none transition-all appearance-none"
              >
                <option value="employee">Employee</option>
                <option value="team_leader">Team Leader</option>
                <option value="admin">System Admin</option>
              </select>
            </div>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] text-text-dim uppercase tracking-widest font-bold ml-1">Email Address</label>
          <div className="relative">
            <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim" />
            <input 
              required
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full bg-surface-2 border border-border-bright p-3 pl-10 rounded-xl text-xs text-text-primary focus:border-amber-primary outline-none transition-all placeholder:text-text-dim"
              placeholder="john@example.com"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] text-text-dim uppercase tracking-widest font-bold ml-1">System Username</label>
          <div className="relative">
            <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim" />
            <input 
              required
              name="username"
              value={formData.username}
              onChange={handleChange}
              className="w-full bg-surface-2 border border-border-bright p-3 pl-10 rounded-xl font-mono text-xs text-text-primary focus:border-amber-primary outline-none transition-all placeholder:text-text-dim"
              placeholder="jdoe_admin"
            />
          </div>
        </div>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <div className="flex justify-between items-center ml-1">
              <label className="text-[10px] text-text-dim uppercase tracking-widest font-bold">Set Password</label>
              <button 
                type="button" 
                onClick={generatePassword}
                className="text-[9px] text-amber-primary font-bold hover:underline flex items-center gap-1"
              >
                <Key size={10} /> Generate Secure
              </button>
            </div>
            <div className="relative">
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-dim hover:text-text-primary transition-colors"
              >
                {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
              <input 
                required
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full bg-surface-2 border border-border-bright p-3 pr-10 rounded-xl font-mono text-xs text-text-primary focus:border-amber-primary outline-none transition-all placeholder:text-[10px]"
                placeholder="Secure Password"
              />
            </div>
          </div>
          <PasswordStrengthMeter password={formData.password} />
        </div>
      </div>

      <button 
        type="submit"
        disabled={isLoading}
        className="w-full bg-amber-primary text-bg py-4 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] shadow-lg shadow-amber-primary/20 hover:shadow-amber-primary/40 hover:bg-amber-secondary transition-all flex items-center justify-center gap-2 group"
      >
        {isLoading ? (
          <div className="w-4 h-4 border-2 border-bg/30 border-t-bg rounded-full animate-spin" />
        ) : (
          <>
            Create User Account
            <UserPlus size={16} className="group-hover:translate-x-0.5 transition-transform" />
          </>
        )}
      </button>
    </form>
  );
};
