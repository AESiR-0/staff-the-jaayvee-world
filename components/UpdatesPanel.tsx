"use client";

import { useEffect, useState } from "react";
import { Bell, AlertCircle, Info, AlertTriangle, Share2, MessageCircle, Linkedin, Facebook, Copy, Check } from "lucide-react";
import { format } from "date-fns";

interface Update {
  id: string;
  title: string;
  message: string;
  priority: "low" | "normal" | "high" | "urgent";
  targetAudience: string;
  createdByEmail: string;
  createdAt: string;
  isActive: boolean;
}

interface UpdatesPanelProps {
  audience: "team" | "affiliates" | "influencer" | "agent";
  apiBaseUrl?: string;
}

export function UpdatesPanel({ audience, apiBaseUrl = "https://thejaayveeworld.com" }: UpdatesPanelProps) {
  const [updates, setUpdates] = useState<Update[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    const fetchUpdates = async () => {
      try {
        setLoading(true);
        // Convert "team" to "staff" for backend API (UI shows team, backend uses staff)
        const backendAudience = audience === "team" ? "staff" : audience;
        const response = await fetch(`${apiBaseUrl}/api/updates?audience=${backendAudience}`);
        
        if (!response.ok) {
          throw new Error("Failed to fetch updates");
        }

        const data = await response.json();
        if (data.success) {
          setUpdates(data.data || []);
        }
      } catch (err: any) {
        console.error("Error fetching updates:", err);
        setError(err.message || "Failed to load updates");
      } finally {
        setLoading(false);
      }
    };

    fetchUpdates();
  }, [audience, apiBaseUrl]);

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case "urgent":
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case "high":
        return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case "low":
        return <Info className="h-4 w-4 text-blue-500" />;
      default:
        return <Bell className="h-4 w-4 text-gray-500" />;
    }
  };

  const getPriorityBadgeClass = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "bg-red-100 text-red-800 border-red-200";
      case "high":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "low":
        return "bg-blue-100 text-blue-800 border-blue-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const handleShare = (update: Update, platform: 'whatsapp' | 'facebook' | 'linkedin' | 'copy') => {
    const shareUrl = typeof window !== 'undefined' ? window.location.origin : apiBaseUrl;
    const updateUrl = `${shareUrl}/updates/${update.id}`;
    const shareText = `📢 ${update.title}\n\n${update.message}\n\n🔗 ${updateUrl}\n\n#JaayveeWorld #Updates`;

    switch (platform) {
      case 'whatsapp':
        window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, '_blank');
        break;
      case 'facebook':
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(updateUrl)}&quote=${encodeURIComponent(`${update.title}: ${update.message}`)}`, '_blank');
        break;
      case 'linkedin':
        window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(updateUrl)}&summary=${encodeURIComponent(`${update.title}: ${update.message}`)}`, '_blank');
        break;
      case 'copy':
        navigator.clipboard.writeText(updateUrl).then(() => {
          setCopiedId(update.id);
          setTimeout(() => setCopiedId(null), 2000);
        });
        break;
    }
  };

  if (loading) {
    return (
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <Bell className="h-5 w-5 text-primary-muted" />
          <h3 className="text-lg font-semibold text-primary-fg">Updates</h3>
        </div>
        <div className="text-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-accent mx-auto"></div>
          <p className="text-sm text-primary-muted mt-2">Loading updates...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <Bell className="h-5 w-5 text-primary-muted" />
          <h3 className="text-lg font-semibold text-primary-fg">Updates</h3>
        </div>
        <div className="text-center py-4">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  if (updates.length === 0) {
    return (
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <Bell className="h-5 w-5 text-primary-muted" />
          <h3 className="text-lg font-semibold text-primary-fg">Updates</h3>
        </div>
        <div className="text-center py-4">
          <p className="text-sm text-primary-muted">No updates at this time.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="flex items-center gap-2 mb-4">
        <Bell className="h-5 w-5 text-primary-fg" />
        <h3 className="text-lg font-semibold text-primary-fg">Latest Updates</h3>
      </div>
      
      <div className="space-y-4 max-h-96 overflow-y-auto">
        {updates.map((update) => (
          <div
            key={update.id}
            className="border border-primary-border rounded-lg p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                {getPriorityIcon(update.priority)}
                <h4 className="font-semibold text-primary-fg">{update.title}</h4>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full border ${getPriorityBadgeClass(update.priority)}`}
                >
                  {update.priority}
                </span>
              </div>
              <span className="text-xs text-primary-muted">
                {format(new Date(update.createdAt), "MMM dd, yyyy")}
              </span>
            </div>
            
            <p className="text-sm text-primary-muted whitespace-pre-wrap mb-2">
              {update.message}
            </p>
            
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-primary-border">
              <span className="text-xs text-primary-muted">
                From: {update.createdByEmail}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleShare(update, 'whatsapp')}
                  className="p-1.5 hover:bg-green-50 rounded-lg transition-colors"
                  title="Share on WhatsApp"
                >
                  <MessageCircle className="h-4 w-4 text-green-600" />
                </button>
                <button
                  onClick={() => handleShare(update, 'facebook')}
                  className="p-1.5 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Share on Facebook"
                >
                  <Facebook className="h-4 w-4 text-blue-600" />
                </button>
                <button
                  onClick={() => handleShare(update, 'linkedin')}
                  className="p-1.5 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Share on LinkedIn"
                >
                  <Linkedin className="h-4 w-4 text-blue-700" />
                </button>
                <button
                  onClick={() => handleShare(update, 'copy')}
                  className="p-1.5 hover:bg-gray-50 rounded-lg transition-colors"
                  title="Copy link"
                >
                  {copiedId === update.id ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4 text-primary-muted" />
                  )}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

