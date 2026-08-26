import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Copy, 
  Check, 
  Mail, 
  ExternalLink, 
  Key, 
  User, 
  Sparkles,
  CheckCircle2,
  Eye,
  EyeOff,
  Send,
  Shield,
  BadgeCheck,
  ArrowUpRight,
  Fingerprint
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { UserCredentials } from './types';

interface CredentialGenerationCardProps {
  credentials: UserCredentials;
  onDone: () => void;
  onCopySuccess?: (msg: string) => void;
}

export const CredentialGenerationCard: React.FC<CredentialGenerationCardProps> = ({ 
  credentials, 
  onDone,
  onCopySuccess 
}) => {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState<boolean>(true);

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    if (onCopySuccess) onCopySuccess(`${field} copied`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const loginLink = credentials.loginLink || (typeof window !== 'undefined' ? `${window.location.origin}/?user=${encodeURIComponent(credentials.username)}` : '');
  const pass = credentials.password || credentials.temporaryPassword || '';

  const handleCopyAll = () => {
    const summary = `pySync CRM Access Credentials\nUser: ${credentials.name || credentials.username}\nRole: ${credentials.role || 'Member'}\nUsername: ${credentials.username}\nPassword: ${pass}\nDirect Link: ${loginLink}`;
    handleCopy(summary, 'All Credentials');
  };

  return (
    <div className="p-6 space-y-5">
      {/* Visual Identity Pass Header */}
      <div className="relative rounded-2xl bg-gradient-to-br from-amber-500/15 via-surface-2 to-surface border border-amber-500/30 p-5 overflow-hidden shadow-lg">
        {/* Subtle decorative grid background */}
        <div className="absolute inset-0 bg-[radial-gradient(#f59e0b_1px,transparent_1px)] [background-size:16px_16px] opacity-15 pointer-events-none" />
        
        <div className="relative flex items-start justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-primary shadow-inner">
              <Fingerprint size={22} className="text-amber-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-text-primary tracking-tight">
                  {credentials.name || credentials.username}
                </h3>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-primary border border-amber-500/30 uppercase tracking-wider">
                  {credentials.role || 'Staff'}
                </span>
              </div>
              <p className="text-xs text-text-dim mt-0.5 flex items-center gap-1.5">
                <BadgeCheck size={13} className="text-emerald-400" /> Account Provisioned & Security Verified
              </p>
            </div>
          </div>

          <button
            onClick={handleCopyAll}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-surface hover:bg-surface-3 border border-border-dim hover:border-amber-primary/50 rounded-xl text-text-secondary hover:text-amber-primary transition-all shadow-sm shrink-0"
          >
            {copiedField === 'All Credentials' ? (
              <>
                <Check size={13} className="text-emerald-400" />
                <span className="text-emerald-400">Copied All</span>
              </>
            ) : (
              <>
                <Copy size={13} />
                <span>Copy Summary</span>
              </>
            )}
          </button>
        </div>

        {credentials.email && (
          <div className="mt-4 pt-3 border-t border-amber-500/20 flex items-center justify-between text-xs text-text-secondary">
            <span className="flex items-center gap-1.5 truncate">
              <Mail size={13} className="text-amber-primary shrink-0" />
              <span>Sent to: <strong className="text-text-primary font-mono">{credentials.email}</strong></span>
            </span>
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
              <span className="w-1 h-1 rounded-full bg-emerald-400 animate-ping" />
              Dispatched
            </span>
          </div>
        )}
      </div>

      {/* Modern Vault Card Style */}
      <div className="bg-surface-2/80 rounded-2xl border border-border-dim p-4 space-y-3">
        {/* Username */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-surface border border-border-dim/60 hover:border-amber-primary/40 transition-colors">
          <div className="space-y-0.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-text-dim flex items-center gap-1">
              <User size={11} className="text-amber-primary" /> Username ID
            </span>
            <div className="font-mono text-sm font-bold text-text-primary select-all">
              {credentials.username}
            </div>
          </div>
          <button
            onClick={() => handleCopy(credentials.username, 'Username')}
            className="p-2 rounded-lg bg-surface-2 hover:bg-amber-primary/10 border border-border-dim text-text-dim hover:text-amber-primary transition-all text-xs flex items-center gap-1"
            title="Copy username"
          >
            {copiedField === 'Username' ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
          </button>
        </div>

        {/* Temporary Password */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-surface border border-border-dim/60 hover:border-amber-primary/40 transition-colors">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-text-dim flex items-center gap-1">
                <Key size={11} className="text-amber-primary" /> Temporary Password
              </span>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-[10px] text-amber-primary hover:underline flex items-center gap-0.5 font-medium"
              >
                {showPassword ? <EyeOff size={10} /> : <Eye size={10} />}
                <span>{showPassword ? 'Mask' : 'Reveal'}</span>
              </button>
            </div>
            <div className="font-mono text-sm font-bold text-amber-primary tracking-wider select-all">
              {showPassword ? pass : '••••••••••••'}
            </div>
          </div>
          <button
            onClick={() => handleCopy(pass, 'Password')}
            className="p-2 rounded-lg bg-surface-2 hover:bg-amber-primary/10 border border-border-dim text-text-dim hover:text-amber-primary transition-all text-xs flex items-center gap-1"
            title="Copy password"
          >
            {copiedField === 'Password' ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
          </button>
        </div>

        {/* Login URL */}
        {loginLink && (
          <div className="flex items-center justify-between p-3 rounded-xl bg-surface border border-border-dim/60 hover:border-amber-primary/40 transition-colors">
            <div className="space-y-0.5 min-w-0 pr-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-text-dim flex items-center gap-1">
                <ExternalLink size={11} className="text-amber-primary" /> Direct Portal Link
              </span>
              <div className="font-mono text-xs text-text-secondary truncate select-all">
                {loginLink}
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => handleCopy(loginLink, 'Login Link')}
                className="p-2 rounded-lg bg-surface-2 hover:bg-amber-primary/10 border border-border-dim text-text-dim hover:text-amber-primary transition-all text-xs"
                title="Copy URL"
              >
                {copiedField === 'Login Link' ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
              </button>
              <a
                href={loginLink}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg bg-surface-2 hover:bg-surface-3 border border-border-dim text-text-dim hover:text-text-primary transition-all"
                title="Open in new tab"
              >
                <ArrowUpRight size={14} />
              </a>
            </div>
          </div>
        )}
      </div>

      {/* Security Disclaimer */}
      <div className="text-[11px] text-text-dim flex items-center justify-center gap-1.5 text-center">
        <Shield size={13} className="text-amber-primary shrink-0" />
        <span>The user will be prompted to replace this temporary password on initial sign in.</span>
      </div>

      {/* Action Footer */}
      <div className="pt-2 flex items-center gap-3">
        <button
          type="button"
          onClick={handleCopyAll}
          className="flex-1 py-3 bg-surface-2 hover:bg-surface-3 text-text-primary border border-border-dim rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 active:scale-[0.99]"
        >
          <Copy size={14} /> Copy Details
        </button>
        <button 
          type="button"
          onClick={onDone}
          className="flex-1 bg-amber-primary hover:bg-amber-primary/90 text-black py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md active:scale-[0.99] flex items-center justify-center gap-2"
        >
          <CheckCircle2 size={16} /> Complete
        </button>
      </div>
    </div>
  );
};
