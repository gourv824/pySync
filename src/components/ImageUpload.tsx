import React, { useRef } from 'react';
import { Trash2, Upload, Image as ImageIcon } from 'lucide-react';

export interface ImageFile {
  name: string;
  size: number;
  data: string;
}

interface ImageUploadProps {
  images: ImageFile[];
  onChange: (images: ImageFile[]) => void;
  onError?: (message: string) => void;
  maxImages?: number;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({ images = [], onChange, onError, maxImages = 5 }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    if (images.length + Array.from(files).length > maxImages) {
      if (onError) onError(`You can only upload up to ${maxImages} images.`);
      else alert(`You can only upload up to ${maxImages} images.`);
      return;
    }

    const newImages: ImageFile[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.type.startsWith('image/')) {
        if (onError) onError(`File ${file.name} is not an image.`);
        else alert(`File ${file.name} is not an image.`);
        continue;
      }

      const reader = new FileReader();
      const data = await new Promise<string>((resolve) => {
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });

      newImages.push({
        name: file.name,
        size: file.size,
        data
      });
    }

    onChange([...images, ...newImages]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeImage = (index: number) => {
    const updated = [...images];
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
        <span className="text-xs font-bold text-text-secondary">Click to upload Images</span>
        <input 
          type="file" 
          ref={fileInputRef}
          onChange={handleFileChange} 
          accept="image/*" 
          className="hidden" 
          multiple
        />
      </div>
      
      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {images.map((img, idx) => (
            <div key={idx} className="relative group rounded-xl overflow-hidden border border-border-dim">
              <img src={img.data} alt={img.name} className="w-full h-24 object-cover" />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <button 
                  onClick={() => removeImage(idx)}
                  className="bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors"
                  aria-label={`Remove ${img.name}`}
                >
                  <Trash2 size={16} />
                </button>
              </div>
              <div className="absolute bottom-0 left-0 right-0 bg-black/60 p-1 text-[9px] text-white truncate text-center">
                {img.name}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
