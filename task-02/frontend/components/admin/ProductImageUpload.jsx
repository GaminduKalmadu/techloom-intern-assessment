'use client';

import React, { useState, useRef, useCallback } from 'react';
import {
  UploadCloud,
  Image as ImageIcon,
  Trash2,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  RefreshCw,
  FileImage,
} from 'lucide-react';

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 Megabytes

/**
 * Format bytes to readable human string (e.g. "4.25 MB")
 */
function formatFileSize(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

export default function ProductImageUpload({
  imageUrl = '',
  onChange,
  onError,
  className = '',
}) {
  const [activeTab, setActiveTab] = useState(imageUrl && !imageUrl.startsWith('data:') ? 'url' : 'device');
  const [isDragging, setIsDragging] = useState(false);
  const [fileError, setFileError] = useState('');
  const [fileInfo, setFileInfo] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef(null);

  const processSelectedFile = useCallback(
    (file) => {
      setFileError('');
      if (onError) onError('');

      if (!file) return;

      // 1. Validate file type
      if (!file.type.startsWith('image/')) {
        const err = 'Invalid file type. Please upload an image file (PNG, JPG, WEBP, GIF, or SVG).';
        setFileError(err);
        if (onError) onError(err);
        return;
      }

      // 2. Validate maximum file size (Must not exceed 10 MB)
      if (file.size > MAX_FILE_SIZE_BYTES) {
        const formattedSize = formatFileSize(file.size);
        const err = `Image size exceeds the 10 MB limit (Selected file: ${formattedSize}). Please choose an image smaller than 10 MB.`;
        setFileError(err);
        if (onError) onError(err);
        return;
      }

      setIsProcessing(true);

      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target.result;
        setFileInfo({
          name: file.name,
          size: formatFileSize(file.size),
          rawBytes: file.size,
          type: file.type,
        });
        if (onChange) {
          onChange(dataUrl);
        }
        setIsProcessing(false);
      };

      reader.onerror = () => {
        const err = 'Failed to read the selected image file. Please try again.';
        setFileError(err);
        if (onError) onError(err);
        setIsProcessing(false);
      };

      reader.readAsDataURL(file);
    },
    [onChange, onError]
  );

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      processSelectedFile(files[0]);
    }
  };

  const handleFileChange = (e) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processSelectedFile(files[0]);
    }
    // Reset input so re-uploading the same file still triggers onChange
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveImage = () => {
    setFileInfo(null);
    setFileError('');
    if (onChange) onChange('');
    if (onError) onError('');
  };

  const isDataUrl = imageUrl && imageUrl.startsWith('data:');

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Header & Source Mode Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
          Product Image
        </label>

        <div className="inline-flex rounded-xl bg-slate-100 p-1 self-start sm:self-auto border border-slate-200/60">
          <button
            type="button"
            onClick={() => {
              setActiveTab('device');
              setFileError('');
            }}
            className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-lg transition-all ${
              activeTab === 'device'
                ? 'bg-white text-purple-700 shadow-sm'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <UploadCloud className="w-3.5 h-3.5" />
            Upload from Device
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('url');
              setFileError('');
            }}
            className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-lg transition-all ${
              activeTab === 'url'
                ? 'bg-white text-purple-700 shadow-sm'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Image URL
          </button>
        </div>
      </div>

      {/* Hidden native file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Error Banner */}
      {fileError && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-start gap-2.5 animate-in fade-in">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-bold block text-rose-800">Upload Validation Error</span>
            <p className="font-medium text-rose-700">{fileError}</p>
          </div>
        </div>
      )}

      {/* Mode 1: Upload from Device */}
      {activeTab === 'device' && (
        <div>
          {imageUrl ? (
            /* Active Image Preview Card */
            <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/90 shadow-sm transition-all hover:border-slate-300">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                {/* Image Thumbnail */}
                <div className="relative h-24 w-24 sm:h-28 sm:w-28 rounded-xl bg-white border border-slate-200 overflow-hidden shrink-0 shadow-inner flex items-center justify-center group">
                  <img
                    src={imageUrl}
                    alt="Product preview"
                    className="h-full w-full object-contain p-1"
                  />
                </div>

                {/* Metadata & Actions */}
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      Ready to Save
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800">
                      {isDataUrl ? 'Device Upload' : 'Web Image'}
                    </span>
                  </div>

                  <p className="text-xs font-bold text-slate-800 truncate">
                    {fileInfo?.name || (isDataUrl ? 'Uploaded device image' : imageUrl)}
                  </p>

                  <div className="flex items-center gap-4 text-[11px] text-slate-500 font-medium">
                    {fileInfo?.size && (
                      <span>
                        Size: <strong className="text-slate-700">{fileInfo.size}</strong> (Max 10 MB)
                      </span>
                    )}
                    <span>Image format: {fileInfo?.type || 'Standard image'}</span>
                  </div>

                  {/* Actions */}
                  <div className="pt-1 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isProcessing}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200/80 rounded-lg transition-colors cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      Replace Image
                    </button>
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200/80 rounded-lg transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Drag & Drop Upload Zone */
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`relative border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center transition-all cursor-pointer group ${
                isDragging
                  ? 'border-purple-600 bg-purple-50/70 ring-4 ring-purple-600/10'
                  : 'border-slate-300 hover:border-purple-500 bg-slate-50/50 hover:bg-purple-50/20'
              }`}
            >
              <div className="flex flex-col items-center justify-center space-y-3">
                <div
                  className={`h-12 w-12 rounded-2xl flex items-center justify-center transition-all ${
                    isDragging
                      ? 'bg-purple-600 text-white scale-110 shadow-lg shadow-purple-600/30'
                      : 'bg-purple-100 text-purple-700 group-hover:scale-105 group-hover:bg-purple-600 group-hover:text-white'
                  }`}
                >
                  <UploadCloud className="w-6 h-6" />
                </div>

                <div className="space-y-1">
                  <p className="text-xs font-bold text-slate-800">
                    <span className="text-purple-600 underline underline-offset-2">
                      Click to browse from your device
                    </span>{' '}
                    or drag & drop
                  </p>
                  <p className="text-[11px] text-slate-500">
                    PNG, JPG, WEBP, GIF or SVG • <strong className="text-slate-700">Strict Max 10 MB</strong>
                  </p>
                </div>

                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-200/70 text-slate-600">
                  <FileImage className="w-3 h-3" />
                  Files over 10 MB will be safely rejected
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Mode 2: External Image URL */}
      {activeTab === 'url' && (
        <div className="space-y-2">
          <div className="relative">
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
              <ImageIcon className="w-4 h-4" />
            </div>
            <input
              id="imageUrl"
              type="url"
              placeholder="https://images.unsplash.com/photo-..."
              value={imageUrl}
              onChange={(e) => {
                if (onChange) onChange(e.target.value);
                setFileError('');
              }}
              className="w-full rounded-xl border border-slate-200 pl-10 pr-4 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 outline-none transition-all focus:border-purple-600 focus:ring-4 focus:ring-purple-600/10"
            />
          </div>

          <p className="text-[11px] text-slate-400">
            Paste an existing public image URL or switch to &quot;Upload from Device&quot; to pick an image from your computer.
          </p>

          {/* Direct URL Preview */}
          {imageUrl && !isDataUrl && (
            <div className="mt-2 p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="h-12 w-12 rounded-lg bg-white border border-slate-200 overflow-hidden flex items-center justify-center shrink-0">
                  <img
                    src={imageUrl}
                    alt="Preview"
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
                <span className="text-[11px] text-slate-600 font-mono truncate max-w-sm">
                  {imageUrl}
                </span>
              </div>
              <button
                type="button"
                onClick={handleRemoveImage}
                className="text-xs text-rose-600 hover:text-rose-700 font-bold p-1 shrink-0"
              >
                Clear
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
