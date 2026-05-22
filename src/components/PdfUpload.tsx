import React, { useRef } from 'react';
import { Trash2, AlertCircle, Loader2, Upload } from 'lucide-react';

export interface PdfFile {
  name: string;
  size: number;
  data: string;
}

interface PdfUploadProps {
  pdfs: PdfFile[];
  onChange: (pdfs: PdfFile[]) => void;
  onError?: (message: string) => void;
}

export const PdfUpload: React.FC<PdfUploadProps> = ({ pdfs = [], onChange, onError }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    if (pdfs.length + Array.from(files).length > 3) {
      if (onError) onError('You can only upload up to 3 PDF documents.');
      else alert('You can only upload up to 3 PDF documents.');
      return;
    }

    const newPdfs: PdfFile[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.type !== 'application/pdf') {
        if (onError) onError(`File ${file.name} is not a PDF.`);
        else alert(`File ${file.name} is not a PDF.`);
        continue;
      }

      const reader = new FileReader();
      const data = await new Promise<string>((resolve) => {
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });

      newPdfs.push({
        name: file.name,
        size: file.size,
        data
      });
    }

    onChange([...pdfs, ...newPdfs]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removePdf = (index: number) => {
    const updated = [...pdfs];
    updated.splice(index, 1);
    onChange(updated);
  };

  return (
    <div className="space-y-4">
      <div 
        className="border-2 border-dashed border-border-bright rounded-xl p-6 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-amber-primary/50 transition-colors"
        onClick={() => fileInputRef.current?.click()}
      >
        <Upload className="text-text-dim" size={24} />
        <span className="text-xs font-bold text-text-secondary">Click to upload PDF documents</span>
        <input 
          type="file" 
          ref={fileInputRef}
          onChange={handleFileChange} 
          accept="application/pdf" 
          className="hidden" 
          multiple
        />
      </div>
      
      {pdfs.length > 0 && (
        <div className="space-y-2">
          {pdfs.map((pdf, idx) => (
            <div key={idx} className="flex items-center justify-between p-3 bg-surface-2 border border-border-dim rounded-xl">
              <div className="flex items-center gap-3">
                <div className="bg-amber-primary/10 p-2 rounded text-amber-primary">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-text-primary truncate">{pdf.name}</span>
                  <span className="text-[10px] text-text-secondary">{(pdf.size / 1024 / 1024).toFixed(2)} MB</span>
                </div>
              </div>
              <button 
                onClick={() => removePdf(idx)}
                className="text-text-dim hover:text-red-500 transition-colors"
                aria-label={`Remove ${pdf.name}`}
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
