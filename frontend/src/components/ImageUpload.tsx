import React, { useEffect, useState, useRef } from 'react';
import { UploadCloud, X, Image as ImageIcon, CheckCircle2, AlertCircle, RefreshCw, Loader2 } from 'lucide-react';
import { api, resolveMediaUrl } from '../services/api';

export interface ImageUploadProps {
  currentImage?: string;
  onImageSelected: (file: File, previewUrl: string) => void;
  onRemove: () => void;
  onUploadStateChange?: (isUploading: boolean) => void;
  onUploadError?: (message: string) => void;
  maxSize?: number; // In bytes (default: 5MB)
  acceptedFileTypes?: string[];
  label?: string;
  className?: string;
  aspectRatio?: 'video' | 'square' | 'wide' | 'auto';
  category?: 'POST' | 'AVATAR' | 'COMMUNITY' | 'PROJECT' | 'MESSAGE' | string;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
  currentImage,
  onImageSelected,
  onRemove,
  onUploadStateChange,
  onUploadError,
  maxSize = 5 * 1024 * 1024, // 5MB default
  acceptedFileTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'],
  label = 'Upload Image',
  className = '',
  aspectRatio = 'auto',
  category = 'POST',
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [localPreviewUrl, setLocalPreviewUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isUploadReady, setIsUploadReady] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileSize, setFileSize] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (localPreviewUrl) URL.revokeObjectURL(localPreviewUrl);
    };
  }, [localPreviewUrl]);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const processFile = (file: File) => {
    setErrorMessage(null);
    setIsUploadReady(false);

    // Validate type
    const isAccepted = acceptedFileTypes.some((type) => {
      if (type.includes('*')) {
        const prefix = type.split('/')[0];
        return file.type.startsWith(`${prefix}/`);
      }
      return file.type.toLowerCase() === type.toLowerCase();
    });

    if (!isAccepted) {
      setErrorMessage('Unsupported file format. Please upload a JPG, PNG, or WebP image.');
      return;
    }

    // Validate size
    if (file.size > maxSize) {
      setErrorMessage(`File is too large. Maximum allowed size is ${formatFileSize(maxSize)}.`);
      return;
    }

    setIsUploading(true);
    onUploadStateChange?.(true);
    setFileName(file.name);
    setFileSize(formatFileSize(file.size));
    const nextLocalPreviewUrl = URL.createObjectURL(file);
    if (localPreviewUrl) URL.revokeObjectURL(localPreviewUrl);
    setLocalPreviewUrl(nextLocalPreviewUrl);

    // Upload to real backend
    const formData = new FormData();
    formData.append('file', file);
    formData.append('category', category);

    api.post<{ success: boolean; file: { url: string } }>('/uploads', formData)
      .then((res) => {
        const uploadedUrl = resolveMediaUrl(res.file?.url);
        if (!uploadedUrl || uploadedUrl.startsWith('blob:')) {
          throw new Error('The upload completed without a permanent image URL.');
        }
        setIsUploading(false);
        onUploadStateChange?.(false);
        setIsUploadReady(true);
        onImageSelected(file, uploadedUrl);
      })
      .catch((err) => {
        setIsUploading(false);
        onUploadStateChange?.(false);
        const message = api.getFriendlyMessage(err);
        setErrorMessage(message);
        if (localPreviewUrl) {
          URL.revokeObjectURL(localPreviewUrl);
          setLocalPreviewUrl(null);
        }
        onUploadError?.(message);
      });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    setFileName(null);
    setFileSize(null);
    setErrorMessage(null);
    setIsUploadReady(false);
    setIsUploading(false);
    onUploadStateChange?.(false);
    if (localPreviewUrl) {
      URL.revokeObjectURL(localPreviewUrl);
      setLocalPreviewUrl(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onRemove();
  };

  const triggerSelect = () => {
    fileInputRef.current?.click();
  };

  const getAspectClass = () => {
    switch (aspectRatio) {
      case 'square':
        return 'h-40 sm:h-48 w-40 sm:w-48 mx-auto';
      case 'wide':
        return 'h-36 sm:h-44 w-full';
      case 'video':
        return 'aspect-video w-full';
      default:
        return 'h-48 w-full';
    }
  };

  return (
    <div className={`space-y-2.5 ${className}`}>
      {label && (
        <div className="flex items-center justify-between">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
            {label}
          </label>
          <span className="text-[11px] text-slate-400 font-medium">
            Max {formatFileSize(maxSize)}
          </span>
        </div>
      )}

      {/* Hidden native input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={acceptedFileTypes.join(',')}
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Preview State */}
      {(currentImage || localPreviewUrl) ? (
        <div className="space-y-2">
          <div className={`relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-900 group shadow-sm ${getAspectClass()}`}>
            <img
              src={currentImage || localPreviewUrl || undefined}
              alt="Preview"
              className="w-full h-full object-cover object-center transition-transform duration-300 group-hover:scale-105"
              onError={(event) => {
                if (localPreviewUrl && event.currentTarget.src !== localPreviewUrl) {
                  event.currentTarget.src = localPreviewUrl;
                  setErrorMessage('Uploaded image URL was unavailable. Showing the local preview.');
                }
              }}
            />

            {/* Hover Actions Overlay */}
            <div className="absolute inset-0 bg-slate-950/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-3 p-4">
              <button
                type="button"
                onClick={triggerSelect}
                className="bg-white/95 hover:bg-white text-slate-900 px-3 py-1.5 rounded-xl text-xs font-bold shadow flex items-center space-x-1.5 transition-all cursor-pointer hover:scale-105"
              >
                <RefreshCw className="w-3.5 h-3.5 text-indigo-600" />
                <span>Replace Image</span>
              </button>
              <button
                type="button"
                onClick={handleRemove}
                className="bg-rose-600 hover:bg-rose-700 text-white px-3 py-1.5 rounded-xl text-xs font-bold shadow flex items-center space-x-1.5 transition-all cursor-pointer hover:scale-105"
              >
                <X className="w-3.5 h-3.5" />
                <span>Remove</span>
              </button>
            </div>

            {/* Upload status indicator badge */}
            {isUploadReady && (
              <div className="absolute top-2.5 left-2.5 bg-emerald-600/90 backdrop-blur-xs text-white px-2.5 py-1 rounded-lg text-[10px] font-bold flex items-center space-x-1 shadow-sm">
                <CheckCircle2 className="w-3 h-3 text-emerald-200" />
                <span>Image ready</span>
              </div>
            )}
          </div>

          {/* Image Metadata Bar */}
          <div className="flex items-center justify-between px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs">
            <div className="flex items-center space-x-2 truncate">
              <ImageIcon className="w-4 h-4 text-indigo-600 shrink-0" />
              <span className="font-semibold text-slate-800 truncate max-w-[220px]">
                {fileName || 'Uploaded Media Preview'}
              </span>
              {fileSize && (
                <span className="text-slate-400 text-[11px] shrink-0 font-medium">
                  ({fileSize})
                </span>
              )}
            </div>

            <div className="flex items-center space-x-2 shrink-0">
              <button
                type="button"
                onClick={triggerSelect}
                className="text-indigo-600 hover:text-indigo-800 font-bold text-[11px] cursor-pointer"
              >
                Change
              </button>
              <span className="text-slate-300">|</span>
              <button
                type="button"
                onClick={handleRemove}
                className="text-rose-600 hover:text-rose-800 font-bold text-[11px] cursor-pointer"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Drag & Drop Upload Container */
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={triggerSelect}
          className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
            isDragging
              ? 'border-indigo-500 bg-indigo-50/60 scale-[0.99] shadow-inner'
              : 'border-slate-300 hover:border-indigo-400 bg-slate-50/70 hover:bg-indigo-50/20'
          }`}
        >
          {isUploading ? (
            <div className="flex flex-col items-center justify-center space-y-2 py-4">
              <div className="relative">
                <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
              </div>
              <p className="text-xs font-bold text-slate-800">Uploading...</p>
              <p className="text-[11px] text-slate-500 font-medium">Processing mock buffer</p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center space-y-2.5 py-2">
              <div className="w-11 h-11 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100 shadow-xs">
                <UploadCloud className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-bold text-slate-800">
                  <span className="text-indigo-600 underline underline-offset-2 hover:text-indigo-700">Choose Image</span> or drag & drop here
                </p>
                <p className="text-[11px] text-slate-500">
                  Supports JPG, JPEG, PNG, WebP up to {formatFileSize(maxSize)}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Error Alert Message */}
      {errorMessage && (
        <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center space-x-2 text-rose-700 text-xs font-medium animate-in fade-in">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{errorMessage}</span>
        </div>
      )}
    </div>
  );
};
