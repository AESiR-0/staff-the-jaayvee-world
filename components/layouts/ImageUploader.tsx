"use client";

import { useState, useRef, useEffect } from "react";
import { Upload, X } from "lucide-react";

interface ImageUploaderProps {
  label: string;
  currentUrl?: string;
  onFileSelect: (file: File | null) => void;
  previewUrl?: string | null;
  onRemove?: () => void;
}

export function ImageUploader({ 
  label, 
  currentUrl, 
  onFileSelect, 
  previewUrl,
  onRemove 
}: ImageUploaderProps) {
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      return;
    }
    onFileSelect(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const displayUrl = previewUrl || currentUrl;

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>
      <div className="space-y-2">
        <div
          className={`relative border-2 border-dashed rounded-lg p-4 transition-colors ${
            dragActive
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-300 hover:border-gray-400'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleChange}
            className="hidden"
          />
          <div className="text-center">
            <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
            <p className="text-sm text-gray-600">
              Drag and drop an image, or{" "}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                browse
              </button>
            </p>
            <p className="text-xs text-gray-500 mt-1">
              PNG, JPG, GIF up to 10MB
            </p>
          </div>
        </div>

        {displayUrl && (
          <div className="relative mt-2">
            <div className="relative inline-block">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={displayUrl}
                alt="Preview"
                className={`${
                  label.toLowerCase().includes('logo')
                    ? 'max-h-20 object-contain'
                    : 'max-h-48 w-full object-cover'
                } border border-gray-200 rounded`}
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
              {previewUrl && (
                <div className="absolute top-1 right-1">
                  <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded">
                    New
                  </span>
                </div>
              )}
              {onRemove && (
                <button
                  type="button"
                  onClick={onRemove}
                  className="absolute top-1 left-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            {previewUrl && (
              <p className="text-xs text-gray-500 mt-1">
                Preview: Will be uploaded when you save
              </p>
            )}
            {currentUrl && !previewUrl && (
              <p className="text-xs text-gray-500 mt-1">
                Current: {currentUrl}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

