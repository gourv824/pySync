import React from 'react';

interface PasswordStrengthMeterProps {
  password: string;
}

export const PasswordStrengthMeter: React.FC<PasswordStrengthMeterProps> = ({ password }) => {
  const calculateStrength = (p: string) => {
    let score = 0;
    if (!p) return score;
    if (p.length > 6) score++;
    if (p.length > 10) score++;
    if (/[A-Z]/.test(p)) score++;
    if (/[0-9]/.test(p)) score++;
    if (/[^A-Za-z0-9]/.test(p)) score++;
    return score;
  };

  const strength = calculateStrength(password);
  
  const getLabel = () => {
    if (!password) return '';
    if (strength <= 2) return 'Weak';
    if (strength <= 3) return 'Moderate';
    if (strength <= 4) return 'Strong';
    return 'Very Strong';
  };

  const getColor = () => {
    if (strength <= 2) return 'bg-red-500';
    if (strength <= 3) return 'bg-amber-500';
    if (strength <= 4) return 'bg-emerald-500';
    return 'bg-blue-500';
  };

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center text-[9px] font-bold uppercase tracking-widest">
        <span className="text-text-dim">Security Strength</span>
        <span className={strength <= 2 ? 'text-red-500' : strength <= 3 ? 'text-amber-500' : 'text-emerald-500'}>
          {getLabel()}
        </span>
      </div>
      <div className="h-1 w-full bg-surface-2 rounded-full overflow-hidden flex gap-1">
        {[1, 2, 3, 4, 5].map((level) => (
          <div 
            key={level}
            className={`h-full flex-1 transition-all duration-500 ${
              level <= strength ? getColor() : 'bg-border-dim'
            }`}
          />
        ))}
      </div>
    </div>
  );
};
