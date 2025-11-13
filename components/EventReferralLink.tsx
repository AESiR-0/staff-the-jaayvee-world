"use client";
import { useState } from "react";
import { Copy, Share2, ExternalLink } from "lucide-react";
import { ShareModal } from "./ShareModal";

interface EventReferralLinkProps {
  eventId: string;
  eventName: string;
  affiliateCode?: string;
}

export function EventReferralLink({ eventId, eventName, affiliateCode = "" }: EventReferralLinkProps) {
  const [showShareModal, setShowShareModal] = useState(false);

  const generateReferralLink = () => {
    // Use talaash subdomain for events
    const baseUrl = 'https://talaash.thejaayveeworld.com';
    return `${baseUrl}/events/${eventId}${affiliateCode ? `?ref=${affiliateCode}` : ''}`;
  };

  const link = generateReferralLink();

  return (
    <>
      <div className="border border-primary-border rounded-xl p-4 space-y-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h4 className="font-medium text-primary-fg mb-1">{eventName}</h4>
            <p className="text-sm text-primary-muted font-mono break-all">{link}</p>
          </div>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={() => setShowShareModal(true)}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-primary-accent text-white rounded-lg hover:bg-primary-accent/90 transition-colors"
          >
            <Share2 size={16} />
            <span className="text-sm font-medium">Share</span>
          </button>
        </div>
      </div>

      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        link={link}
        title={eventName}
      />
    </>
  );
}


