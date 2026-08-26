import React, { useRef, useState, useEffect } from 'react';
import { Trash2, AlertCircle, Loader2, Upload, Edit3, Highlighter, RotateCcw, X, Check, Eye, Sliders, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export interface PdfFile {
  name: string;
  size: number;
  data: string;
  annotations?: {
    type: 'pen' | 'highlighter';
    points: { x: number; y: number }[];
    color: string;
    width: number;
  }[];
}

interface PdfUploadProps {
  pdfs: PdfFile[];
  onChange: (pdfs: PdfFile[]) => void;
  onError?: (message: string) => void;
}

export const PdfUpload: React.FC<PdfUploadProps> = ({ pdfs = [], onChange, onError }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Annotation state
  const [annotatingIndex, setAnnotatingIndex] = useState<number | null>(null);
  const [strokes, setStrokes] = useState<any[]>([]);
  const [tool, setTool] = useState<'pen' | 'highlighter'>('pen');
  const [color, setColor] = useState<string>('#F59E0B'); // Default amber
  const [width, setWidth] = useState<number>(4);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [currentPoints, setCurrentPoints] = useState<{ x: number; y: number }[]>([]);

  const canvasRef = useRef<HTMLCanvasElement>(null);

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
        data,
        annotations: []
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

  // Open Annotation Studio
  const startAnnotating = (index: number) => {
    setAnnotatingIndex(index);
    setStrokes(pdfs[index].annotations || []);
    // Default tool settings
    setTool('pen');
    setColor('#F59E0B');
    setWidth(4);
  };

  // Redraw canvas helper
  const redrawCanvas = (canvas: HTMLCanvasElement, strokesList: any[]) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    strokesList.forEach((stroke) => {
      if (!stroke.points || stroke.points.length < 1) return;
      
      ctx.beginPath();
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.width;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      
      if (stroke.type === 'highlighter') {
        ctx.globalAlpha = 0.45;
      } else {
        ctx.globalAlpha = 1.0;
      }
      
      const [first, ...rest] = stroke.points;
      ctx.moveTo(first.x, first.y);
      
      if (rest.length === 0) {
        ctx.lineTo(first.x, first.y);
      } else {
        rest.forEach((pt: any) => {
          ctx.lineTo(pt.x, pt.y);
        });
      }
      ctx.stroke();
    });
    
    ctx.globalAlpha = 1.0;
  };

  // Redraw when strokes list changes
  useEffect(() => {
    if (annotatingIndex !== null && canvasRef.current) {
      redrawCanvas(canvasRef.current, strokes);
    }
  }, [strokes, annotatingIndex]);

  // Handle canvas drawing events
  const getCoordinates = (e: any) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    
    let clientX = 0;
    let clientY = 0;
    
    if (e.touches && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    
    // Scale coordinates based on canvas internal width/height vs bounds
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  };

  const handleStartDraw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const coords = getCoordinates(e);
    if (!coords) return;

    setIsDrawing(true);
    setCurrentPoints([coords]);

    // Draw active point immediately
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.beginPath();
        ctx.strokeStyle = color;
        ctx.lineWidth = width;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.globalAlpha = tool === 'highlighter' ? 0.45 : 1.0;
        ctx.moveTo(coords.x, coords.y);
        ctx.lineTo(coords.x, coords.y);
        ctx.stroke();
      }
    }
  };

  const handleDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    e.preventDefault();
    const coords = getCoordinates(e);
    if (!coords) return;

    const newPoints = [...currentPoints, coords];
    setCurrentPoints(newPoints);

    // Render ongoing stroke
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.beginPath();
        ctx.strokeStyle = color;
        ctx.lineWidth = width;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.globalAlpha = tool === 'highlighter' ? 0.45 : 1.0;
        
        const prev = currentPoints[currentPoints.length - 1];
        ctx.moveTo(prev.x, prev.y);
        ctx.lineTo(coords.x, coords.y);
        ctx.stroke();
      }
    }
  };

  const handleEndDraw = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    
    if (currentPoints.length > 0) {
      const newStroke = {
        type: tool,
        points: currentPoints,
        color,
        width
      };
      setStrokes([...strokes, newStroke]);
    }
    setCurrentPoints([]);
  };

  const undoLastStroke = () => {
    if (strokes.length === 0) return;
    setStrokes(strokes.slice(0, -1));
  };

  const clearStrokes = () => {
    setStrokes([]);
  };

  const saveAnnotations = () => {
    if (annotatingIndex === null) return;
    const updated = [...pdfs];
    updated[annotatingIndex] = {
      ...updated[annotatingIndex],
      annotations: strokes
    };
    onChange(updated);
    setAnnotatingIndex(null);
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
                  <span className="text-sm font-medium text-text-primary truncate max-w-[180px] md:max-w-xs">{pdf.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-text-secondary">{(pdf.size / 1024 / 1024).toFixed(2)} MB</span>
                    {pdf.annotations && pdf.annotations.length > 0 && (
                      <span className="bg-amber-primary/10 text-amber-primary text-[9px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5 animate-breathe-dot">
                        <Sparkles size={8} />
                        {pdf.annotations.length} {pdf.annotations.length === 1 ? 'annotation' : 'annotations'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => startAnnotating(idx)}
                  className="p-1.5 text-text-dim hover:text-amber-primary transition-colors hover:bg-amber-primary/10 rounded-lg cursor-pointer"
                  title="Annotate brochure schematic"
                  type="button"
                >
                  <Edit3 size={15} />
                </button>
                <button 
                  onClick={() => removePdf(idx)}
                  className="p-1.5 text-text-dim hover:text-red-500 transition-colors hover:bg-red-500/10 rounded-lg cursor-pointer"
                  aria-label={`Remove ${pdf.name}`}
                  type="button"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Persistent Beautiful Dialog for drawing */}
      <AnimatePresence>
        {annotatingIndex !== null && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setAnnotatingIndex(null)}
              className="absolute inset-0 bg-black/85 backdrop-blur-md"
            />

            {/* Modal Dialog container */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
              className="relative w-full max-w-4xl bg-surface border border-border-bright rounded-[32px] overflow-hidden shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] flex flex-col max-h-[90vh] md:max-h-[85vh] z-10"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-white/[0.04] bg-surface-2">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-amber-primary/10 text-amber-primary rounded-2xl border border-amber-primary/20">
                    <Sparkles size={18} />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-text-primary">Brochure Annotation Studio</h3>
                    <p className="text-xs text-text-dim truncate max-w-[250px] md:max-w-md">Annotating: {pdfs[annotatingIndex]?.name}</p>
                  </div>
                </div>
                <button
                  onClick={() => setAnnotatingIndex(null)}
                  className="p-2 text-text-dim hover:text-text-primary transition-colors bg-white/[0.02] border border-white/[0.04] rounded-full cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Main Workspace Body */}
              <div className="flex-1 overflow-y-auto flex flex-col md:flex-row min-h-0 bg-surface">
                
                {/* Left Sidebar Control Panel */}
                <div className="w-full md:w-64 p-6 border-b md:border-b-0 md:border-r border-white/[0.04] space-y-6 flex-shrink-0 bg-surface-2/30">
                  
                  {/* Tool Selection */}
                  <div className="space-y-2">
                    <span className="text-[9px] text-text-dim uppercase tracking-widest font-black block">Active Tool</span>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => setTool('pen')}
                        className={`py-2 px-3 rounded-[14px] text-xs font-bold transition-all border-3d flex items-center justify-center gap-2 cursor-pointer ${
                          tool === 'pen'
                            ? 'bg-amber-primary text-bg font-black border-amber-primary shadow-3d-button'
                            : 'bg-surface text-text-dim hover:text-text-primary border border-white/[0.04]'
                        }`}
                      >
                        <Edit3 size={13} />
                        <span>Pen</span>
                      </button>
                      <button
                        onClick={() => setTool('highlighter')}
                        className={`py-2 px-3 rounded-[14px] text-xs font-bold transition-all border-3d flex items-center justify-center gap-2 cursor-pointer ${
                          tool === 'highlighter'
                            ? 'bg-amber-primary text-bg font-black border-amber-primary shadow-3d-button'
                            : 'bg-surface text-text-dim hover:text-text-primary border border-white/[0.04]'
                        }`}
                      >
                        <Highlighter size={13} />
                        <span>Highlight</span>
                      </button>
                    </div>
                  </div>

                  {/* Preset Colors */}
                  <div className="space-y-2">
                    <span className="text-[9px] text-text-dim uppercase tracking-widest font-black block">Color Palette</span>
                    <div className="flex flex-wrap gap-2.5">
                      {[
                        '#F59E0B', // Amber
                        '#10B981', // Emerald
                        '#3B82F6', // Blue
                        '#EF4444', // Red
                        '#EC4899', // Pink
                        '#8B5CF6', // Purple
                        '#FFFFFF', // White
                      ].map((preset) => (
                        <button
                          key={preset}
                          onClick={() => setColor(preset)}
                          className={`w-7 h-7 rounded-full border-2 transition-all transform hover:scale-110 cursor-pointer flex items-center justify-center ${
                            color === preset ? 'border-amber-primary scale-110 shadow-lg' : 'border-transparent'
                          }`}
                          style={{ backgroundColor: preset }}
                        >
                          {color === preset && (
                            <span className={`w-1.5 h-1.5 rounded-full ${preset === '#FFFFFF' ? 'bg-black' : 'bg-white'}`} />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Stroke Width Slider */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] text-text-dim uppercase tracking-widest font-black block">Brush Size</span>
                      <span className="text-xs font-bold text-amber-primary">{width}px</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Sliders size={13} className="text-text-dim flex-shrink-0" />
                      <input
                        type="range"
                        min="2"
                        max="24"
                        value={width}
                        onChange={(e) => setWidth(parseInt(e.target.value))}
                        className="w-full accent-amber-primary cursor-pointer h-1.5 bg-surface-3 rounded-lg appearance-none"
                      />
                    </div>
                  </div>

                  {/* Actions (Undo/Reset) */}
                  <div className="space-y-2 pt-2 border-t border-white/[0.04]">
                    <button
                      onClick={undoLastStroke}
                      disabled={strokes.length === 0}
                      className="w-full py-2 px-3 bg-surface-3 hover:bg-surface border border-white/[0.04] text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer text-text-primary"
                    >
                      <RotateCcw size={13} />
                      <span>Undo Last Stroke</span>
                    </button>
                    <button
                      onClick={clearStrokes}
                      disabled={strokes.length === 0}
                      className="w-full py-2 px-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 border border-red-500/20 text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                      <Trash2 size={13} />
                      <span>Clear All Drawings</span>
                    </button>
                  </div>

                  <div className="p-3 bg-amber-primary/5 border border-amber-primary/15 rounded-2xl text-[10px] text-amber-primary/80 leading-relaxed space-y-1">
                    <span className="font-bold uppercase tracking-widest block text-[9px]">Designer Hint</span>
                    <p>Draw directly over the floor plan to highlight specific rooms, verify balcony layouts, or mark dimensions.</p>
                  </div>
                </div>

                {/* Right Interactive Canvas Workspace */}
                <div className="flex-1 p-6 flex items-center justify-center min-h-0 bg-surface-2/10 relative overflow-hidden">
                  
                  {/* Outer Frame with Blueprint Line Pattern Background */}
                  <div 
                    className="relative border border-border-bright rounded-[20px] shadow-[0_16px_32px_rgba(0,0,0,0.4)] overflow-hidden flex-shrink-0"
                    style={{
                      backgroundColor: '#0c111d',
                      backgroundImage: 'radial-gradient(rgba(245, 158, 11, 0.12) 1.2px, transparent 0)',
                      backgroundSize: '20px 20px',
                    }}
                  >
                    {/* SVG Blueprint Mockup Floorplan Background */}
                    <svg className="absolute inset-0 w-full h-full opacity-20 pointer-events-none p-10" viewBox="0 0 100 130" fill="none" stroke="#F59E0B">
                      <rect x="5" y="5" width="90" height="120" strokeWidth="1.2" strokeDasharray="3 3" />
                      
                      {/* Master Bed */}
                      <rect x="10" y="10" width="35" height="40" strokeWidth="0.8" />
                      <text x="27.5" y="32" fill="#F59E0B" fontSize="2.5" fontWeight="bold" textAnchor="middle" opacity="0.6">MASTER SUITE</text>
                      
                      {/* En Suite Bath */}
                      <rect x="10" y="50" width="20" height="20" strokeWidth="0.6" />
                      <text x="20" y="61" fill="#F59E0B" fontSize="2" fontWeight="bold" textAnchor="middle" opacity="0.5">BATHROOM</text>
                      
                      {/* Living & Dining */}
                      <rect x="45" y="10" width="45" height="60" strokeWidth="0.8" />
                      <text x="67.5" y="42" fill="#F59E0B" fontSize="2.5" fontWeight="bold" textAnchor="middle" opacity="0.6">LIVING & LOUNGE</text>
                      
                      {/* Kitchen */}
                      <rect x="45" y="70" width="45" height="30" strokeWidth="0.8" />
                      <text x="67.5" y="86" fill="#F59E0B" fontSize="2.5" fontWeight="bold" textAnchor="middle" opacity="0.5">OPEN KITCHEN</text>
                      
                      {/* Terrace / Balcony */}
                      <rect x="10" y="70" width="35" height="30" strokeWidth="0.8" strokeDasharray="2 2" />
                      <text x="27.5" y="86" fill="#F59E0B" fontSize="2.5" fontWeight="bold" textAnchor="middle" opacity="0.6">OUTDOOR DECK</text>

                      {/* Entry Lobby */}
                      <rect x="25" y="100" width="50" height="18" strokeWidth="0.8" />
                      <text x="50" y="110" fill="#F59E0B" fontSize="2" fontWeight="bold" textAnchor="middle" opacity="0.5">GRAND LOBBY ENTRY</text>

                      {/* Schematic Grid Details */}
                      <line x1="5" y1="110" x2="95" y2="110" strokeWidth="0.4" opacity="0.3" />
                      <line x1="45" y1="5" x2="45" y2="125" strokeWidth="0.4" opacity="0.3" />
                    </svg>

                    {/* Canvas drawing layer */}
                    <canvas
                      ref={canvasRef}
                      width={550}
                      height={715}
                      onMouseDown={handleStartDraw}
                      onMouseMove={handleDrawing}
                      onMouseUp={handleEndDraw}
                      onMouseLeave={handleEndDraw}
                      onTouchStart={handleStartDraw}
                      onTouchMove={handleDrawing}
                      onTouchEnd={handleEndDraw}
                      className="relative block cursor-crosshair z-10 w-[350px] h-[455px] sm:w-[480px] sm:h-[624px] md:w-[550px] md:h-[715px] select-none touch-none"
                    />
                  </div>

                </div>

              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-3 p-6 border-t border-white/[0.04] bg-surface-2">
                <button
                  type="button"
                  onClick={() => setAnnotatingIndex(null)}
                  className="py-3 px-5 text-xs font-bold text-text-dim hover:text-text-primary hover:bg-white/[0.02] border border-white/[0.04] rounded-2xl cursor-pointer transition-all"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={saveAnnotations}
                  className="py-3 px-5 bg-amber-primary text-bg font-black text-xs rounded-2xl flex items-center gap-2 cursor-pointer shadow-3d-button border-3d"
                >
                  <Check size={14} />
                  <span>Save Annotations</span>
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
