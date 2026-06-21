import React, { useRef } from 'react';
import { Trash2, Upload, Video, Play } from 'lucide-react';

export interface VideoFile {
  name: string;
  size: number;
  src: string;
}

interface VideoUploadProps {
  videos: VideoFile[];
  onChange: (videos: VideoFile[]) => void;
  onError?: (message: string) => void;
  maxVideos?: number;
}

export const VideoUpload: React.FC<VideoUploadProps> = ({ 
  videos = [], 
  onChange, 
  onError, 
  maxVideos = 3 
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    if (videos.length + Array.from(files).length > maxVideos) {
      if (onError) onError(`You can only upload up to ${maxVideos} videos.`);
      return;
    }

    const newVideos: VideoFile[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      // Limit of 1GB
      const ONE_GB = 1024 * 1024 * 1024;
      if (file.size > ONE_GB) {
        if (onError) onError(`File ${file.name} exceeds the 1GB video size limit.`);
        continue;
      }

      // Check if video file (or has common video extensions)
      if (!file.type.startsWith('video/') && !file.name.match(/\.(mp4|mkv|mov|avi|wmv|webm|flv|3gp|mpeg|mpg|ogg)$/i)) {
        if (onError) onError(`File ${file.name} is not a valid video format.`);
        continue;
      }

      // Create a temporary local object URL for preview/playback without loading the actual file into RAM as base64
      const srcObj = URL.createObjectURL(file);

      newVideos.push({
        name: file.name,
        size: file.size,
        src: srcObj
      });
    }

    onChange([...videos, ...newVideos]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeVideo = (index: number) => {
    const updated = [...videos];
    // Revoke the object URL to avoid memory leaks
    try {
      URL.revokeObjectURL(updated[index].src);
    } catch (e) {
      console.warn("Failed to revoke video object URL", e);
    }
    updated.splice(index, 1);
    onChange(updated);
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-4">
      <div 
        className="border-2 border-dashed border-border-bright rounded-xl p-6 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-amber-primary/50 transition-colors bg-surface-2/30"
        onClick={() => fileInputRef.current?.click()}
      >
        <Upload className="text-amber-primary" size={24} />
        <span className="text-xs font-bold text-text-secondary">Click to upload Project Videos</span>
        <span className="text-[10px] text-text-dim">Supports all video formats up to 1GB limit</span>
        <input 
          type="file" 
          ref={fileInputRef}
          onChange={handleFileChange} 
          accept="video/*,.mp4,.mkv,.mov,.avi,.wmv,.webm,.flv" 
          className="hidden" 
          multiple
        />
      </div>
      
      {videos.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {videos.map((vid, idx) => (
            <div key={idx} className="relative group rounded-xl overflow-hidden border border-border-bright bg-surface-3 flex flex-col p-3 gap-2">
              <div className="relative aspect-video rounded-lg overflow-hidden bg-black/40 flex items-center justify-center">
                <video 
                  src={vid.src} 
                  controls 
                  className="w-full h-full object-cover" 
                  preload="metadata"
                />
              </div>
              <div className="flex items-center justify-between gap-2 mt-1">
                <div className="truncate text-left flex-1" style={{ minWidth: 0 }}>
                  <div className="text-xs font-bold truncate text-text-primary" title={vid.name}>
                    {vid.name}
                  </div>
                  <div className="text-[10px] text-text-dim">
                    {formatSize(vid.size)}
                  </div>
                </div>
                <button 
                  type="button"
                  onClick={() => removeVideo(idx)}
                  className="bg-red-500/10 hover:bg-red-500 hover:text-white text-red-400 p-2 rounded-xl transition-all shrink-0"
                  aria-label={`Remove ${vid.name}`}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
