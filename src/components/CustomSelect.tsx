import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, Check, Search } from 'lucide-react';

export interface CustomSelectOption {
  value: string;
  label: string;
  desc?: string;
}

interface CustomSelectProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<CustomSelectOption | string>;
  className?: string;
  buttonClassName?: string;
  placeholder?: string;
  searchable?: boolean;
  disabled?: boolean;
  align?: 'left' | 'right';
  variant?: 'normal' | 'nested'; // 'normal' matching parent inputs, 'nested' for smaller inline selectors
  error?: boolean;
}

export const CustomSelect: React.FC<CustomSelectProps> = ({
  id,
  value,
  onChange,
  options,
  className = '',
  buttonClassName = '',
  placeholder = 'Select option...',
  searchable = false,
  disabled = false,
  align = 'left',
  variant = 'normal',
  error = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Normalize options to structured type
  const normalizedOptions: CustomSelectOption[] = options.map((opt) => {
    if (typeof opt === 'string') {
      return { value: opt, label: opt };
    }
    return opt;
  });

  const selectedOption = normalizedOptions.find((opt) => opt.value === value) || null;

  // Toggle dropdown
  const toggleDropdown = () => {
    if (disabled) return;
    setIsOpen(!isOpen);
    setSearchQuery('');
  };

  // Close when clicked outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Focus search input when opened
  useEffect(() => {
    if (isOpen && searchable && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
  }, [isOpen, searchable]);

  // Filter options based on search query
  const filteredOptions = normalizedOptions.filter((opt) =>
    opt.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (opt.desc && opt.desc.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleSelect = (val: string) => {
    onChange(val);
    setIsOpen(false);
    setSearchQuery('');
  };

  const isNested = variant === 'nested';

  return (
    <div id={id} ref={containerRef} className={`relative w-full ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={toggleDropdown}
        className={`w-full text-left transition-all duration-200 outline-none select-none flex items-center justify-between cursor-pointer rounded-xl border
          ${disabled ? 'opacity-55 cursor-not-allowed' : ''}
          ${isNested ? 'pl-3 pr-8 py-2 text-xs text-text-primary' : 'pl-4 pr-10 py-2.5 text-sm text-text-primary focus:bg-surface-3 shadow-sm'}
          ${error 
            ? 'border-red-500/50 bg-red-500/5 focus:border-red-500' 
            : `border-border-bright focus:border-amber-primary ${isNested ? 'bg-surface' : 'bg-surface-2'}`
          }
          ${buttonClassName}
        `}
      >
        <span className={`truncate ${!selectedOption ? 'text-text-dim' : 'text-text-primary'}`}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown 
          size={isNested ? 12 : 14} 
          className={`text-text-dim transition-transform duration-200 shrink-0 ${isOpen ? 'rotate-180 text-amber-primary' : ''}`}
        />
      </button>

      {/* Options Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.98 }}
            transition={{ duration: 0.12, ease: 'easeOut' }}
            className={`absolute z-[100] mt-1.5 w-full bg-surface-3 border border-border-bright rounded-xl shadow-2xl backdrop-blur-md overflow-hidden ${
              align === 'right' ? 'right-0' : 'left-0'
            }`}
          >
            {/* Search Input inline */}
            {searchable && (
              <div className="relative border-b border-border-dim px-3 py-2 bg-surface-2/40">
                <Search size={14} className="absolute left-6 top-1/2 -translate-y-1/2 text-text-dim" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search options..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-surface border border-border-dim rounded-lg pl-8 pr-3 py-1.5 text-xs text-text-primary outline-none focus:border-amber-primary focus:ring-1 focus:ring-amber-primary/20 transition-all font-mono"
                />
              </div>
            )}

            {/* List Option Wrapper */}
            <div className="max-h-60 overflow-y-auto custom-scrollbar p-1.5 space-y-0.5">
              {filteredOptions.length === 0 ? (
                <div className="text-center py-4 text-xs text-text-dim font-mono">
                  No options found
                </div>
              ) : (
                filteredOptions.map((opt) => {
                  const isSelected = opt.value === value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => handleSelect(opt.value)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-xs leading-relaxed flex items-center justify-between transition-all duration-150 cursor-pointer select-none group
                        ${isSelected 
                          ? 'bg-amber-primary/10 text-amber-primary font-medium' 
                          : 'text-text-secondary hover:bg-surface-2 hover:text-text-primary'
                        }
                      `}
                    >
                      <div className="flex flex-col min-w-0 pr-2">
                        <span className="truncate">{opt.label}</span>
                        {opt.desc && (
                          <span className={`text-[9px] mt-0.5 truncate transition-colors duration-150 ${
                            isSelected ? 'text-amber-secondary' : 'text-text-dim group-hover:text-text-secondary'
                          }`}>
                            {opt.desc}
                          </span>
                        )}
                      </div>
                      {isSelected && (
                        <Check size={12} className="text-amber-primary shrink-0 ml-1.5" />
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
