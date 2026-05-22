import React from 'react';
import { ShieldCheck, ClipboardList, Check } from 'lucide-react';
import { motion } from 'motion/react';
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
  const [copiedField, setCopiedField] = React.useState<string | null>(null);

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    if (onCopySuccess) onCopySuccess(`${field} copied to clipboard`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <div className="p-8 space-y-6">
      <div className="p-5 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl space-y-5">
        <div className="flex items-center gap-3 text-emerald-500">
          <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
            <ShieldCheck size={20} />
          </div>
          <div>
            <h3 className="text-sm font-bold uppercase tracking-widest">Credentials Secured</h3>
            <p className="text-[10px] text-text-dim">Generated system credentials for the new account</p>
          </div>
        </div>

        <p className="text-[11px] text-text-secondary leading-relaxed bg-surface/50 p-3 rounded-lg border border-border-dim/30">
          Please share these credentials with the user securely. The password will not be shown again once you close this window.
        </p>
        
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[9px] text-text-dim uppercase tracking-widest font-black ml-1">Username</label>
            <div className="group relative flex items-center bg-surface-2 p-3.5 rounded-xl border border-border-bright transition-all hover:border-amber-primary/30">
              <span className="font-mono text-sm text-text-primary flex-1">{credentials.username}</span>
              <button 
                onClick={() => handleCopy(credentials.username, 'Username')}
                className="ml-3 p-2 rounded-lg bg-surface hover:bg-amber-primary/10 text-text-dim hover:text-amber-primary transition-all"
                title="Copy Username"
              >
                {copiedField === 'Username' ? <Check size={16} className="text-emerald-500" /> : <ClipboardList size={16} />}
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[9px] text-text-dim uppercase tracking-widest font-black ml-1">Temporary Password</label>
            <div className="group relative flex items-center bg-surface-2 p-3.5 rounded-xl border border-border-bright transition-all hover:border-amber-primary/30">
              <span className="font-mono text-sm text-text-primary flex-1">
                {credentials.password || credentials.temporaryPassword}
              </span>
              <button 
                onClick={() => handleCopy(credentials.password || credentials.temporaryPassword || '', 'Password')}
                className="ml-3 p-2 rounded-lg bg-surface hover:bg-amber-primary/10 text-text-dim hover:text-amber-primary transition-all"
                title="Copy Password"
              >
                {copiedField === 'Password' ? <Check size={16} className="text-emerald-500" /> : <ClipboardList size={16} />}
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <button 
        onClick={onDone}
        className="w-full bg-zinc-900 text-white py-4 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] shadow-lg hover:shadow-xl hover:bg-black transition-all transform active:scale-[0.98]"
      >
        Finalize & Close
      </button>
    </div>
  );
};
