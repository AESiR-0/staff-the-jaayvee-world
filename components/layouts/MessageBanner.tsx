"use client";

import { AlertCircle, CheckCircle, X } from "lucide-react";
import { useState } from "react";

interface MessageBannerProps {
  type: 'error' | 'success';
  message: string;
  onDismiss?: () => void;
}

export function MessageBanner({ type, message, onDismiss }: MessageBannerProps) {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  const handleDismiss = () => {
    setIsVisible(false);
    onDismiss?.();
  };

  const isError = type === 'error';
  const bgColor = isError ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200';
  const textColor = isError ? 'text-red-800' : 'text-green-800';
  const Icon = isError ? AlertCircle : CheckCircle;

  return (
    <div className={`${bgColor} border rounded-lg p-4 mb-6 flex items-start gap-3`}>
      <Icon className={`h-5 w-5 ${textColor} flex-shrink-0 mt-0.5`} />
      <p className={`flex-1 ${textColor}`}>{message}</p>
      {onDismiss && (
        <button
          onClick={handleDismiss}
          className={`${textColor} hover:opacity-70 transition-opacity`}
          aria-label="Dismiss"
        >
          <X className="h-5 w-5" />
        </button>
      )}
    </div>
  );
}

