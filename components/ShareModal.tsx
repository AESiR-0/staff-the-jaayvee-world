"use client";
import { useState } from "react";
import { X, Copy, MessageCircle, Linkedin, Facebook, Check } from "lucide-react";

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  link: string;
  title: string;
}

export function ShareModal({ isOpen, onClose, link, title }: ShareModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleWhatsAppShare = () => {
    const text = `Check out: ${title}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text + ' ' + link)}`, '_blank');
  };

  const handleLinkedInShare = () => {
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(link)}`, '_blank');
  };

  const handleFacebookShare = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(link)}`, '_blank');
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-primary-bg rounded-2xl max-w-md w-full mx-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-primary-border">
          <h3 className="text-lg font-semibold text-primary-fg">Share Event</h3>
          <button onClick={onClose} className="text-primary-muted hover:text-primary-fg">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div>
            <p className="text-sm text-primary-muted mb-2">Event</p>
            <p className="text-primary-fg font-medium">{title}</p>
          </div>

          <div>
            <p className="text-sm text-primary-muted mb-2">Share Link</p>
            <div className="flex items-center gap-2 p-3 bg-primary-accent-light rounded-lg">
              <p className="text-sm text-primary-fg font-mono flex-1 truncate">{link}</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleCopy}
              className="flex items-center justify-center gap-2 p-4 border border-primary-border rounded-lg hover:bg-primary-accent-light transition-colors"
            >
              {copied ? (
                <>
                  <Check size={20} className="text-green-600" />
                  <span className="text-sm font-medium text-green-600">Copied!</span>
                </>
              ) : (
                <>
                  <Copy size={20} className="text-primary-muted" />
                  <span className="text-sm font-medium text-primary-fg">Copy Link</span>
                </>
              )}
            </button>

            <button
              onClick={handleWhatsAppShare}
              className="flex items-center justify-center gap-2 p-4 border border-primary-border rounded-lg hover:bg-green-50 transition-colors"
            >
              <MessageCircle size={20} className="text-green-600" />
              <span className="text-sm font-medium text-primary-fg">WhatsApp</span>
            </button>

            <button
              onClick={handleLinkedInShare}
              className="flex items-center justify-center gap-2 p-4 border border-primary-border rounded-lg hover:bg-blue-50 transition-colors"
            >
              <Linkedin size={20} className="text-blue-600" />
              <span className="text-sm font-medium text-primary-fg">LinkedIn</span>
            </button>

            <button
              onClick={handleFacebookShare}
              className="flex items-center justify-center gap-2 p-4 border border-primary-border rounded-lg hover:bg-blue-50 transition-colors"
            >
              <Facebook size={20} className="text-blue-600" />
              <span className="text-sm font-medium text-primary-fg">Facebook</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

