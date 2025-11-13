"use client";

import { useState } from "react";
import { X, Send, AlertCircle } from "lucide-react";
import { authenticatedFetch, getAuthToken } from "@/lib/auth-utils";

interface CreateUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  apiBaseUrl?: string;
}

export function CreateUpdateModal({ 
  isOpen, 
  onClose, 
  onSuccess, 
  apiBaseUrl = "https://thejaayveeworld.com"
}: CreateUpdateModalProps) {
  const [formData, setFormData] = useState({
    title: "",
    message: "",
    priority: "normal" as "low" | "normal" | "high" | "urgent",
    targetAudience: "all" as "all" | "staff" | "affiliates" | "influencer" | "agent",
    isActive: true,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await authenticatedFetch(`${apiBaseUrl}/api/staff/updates`, {
        method: "POST",
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to create update");
      }

      // Reset form
      setFormData({
        title: "",
        message: "",
        priority: "normal",
        targetAudience: "all",
        isActive: true,
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error("Error creating update:", err);
      setError(err.message || "Failed to create update");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-primary-bg rounded-2xl max-w-2xl w-full mx-4 shadow-xl border border-primary-border max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-primary-border">
          <h3 className="text-lg font-semibold text-primary-fg">Create Promotional Update</h3>
          <button
            onClick={onClose}
            className="text-primary-muted hover:text-primary-fg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-primary-fg mb-1">
              Title *
            </label>
            <input
              type="text"
              id="title"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 border border-primary-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-accent bg-primary-bg text-primary-fg"
              placeholder="Enter update title"
            />
          </div>

          {/* Message */}
          <div>
            <label htmlFor="message" className="block text-sm font-medium text-primary-fg mb-1">
              Message *
            </label>
            <textarea
              id="message"
              required
              rows={6}
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              className="w-full px-3 py-2 border border-primary-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-accent resize-none bg-primary-bg text-primary-fg"
              placeholder="Enter promotional message"
            />
          </div>

          {/* Priority */}
          <div>
            <label htmlFor="priority" className="block text-sm font-medium text-primary-fg mb-1">
              Priority
            </label>
            <select
              id="priority"
              value={formData.priority}
              onChange={(e) =>
                setFormData({ ...formData, priority: e.target.value as any })
              }
              className="w-full px-3 py-2 border border-primary-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-accent bg-primary-bg text-primary-fg"
            >
              <option value="low">Low</option>
              <option value="normal">Normal</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>

          {/* Target Audience */}
          <div>
            <label htmlFor="targetAudience" className="block text-sm font-medium text-primary-fg mb-1">
              Target Audience
            </label>
            <select
              id="targetAudience"
              value={formData.targetAudience}
              onChange={(e) =>
                setFormData({ ...formData, targetAudience: e.target.value as any })
              }
              className="w-full px-3 py-2 border border-primary-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-accent bg-primary-bg text-primary-fg"
            >
              <option value="all">All</option>
              <option value="staff">Team Only</option>
              <option value="affiliates">Affiliates Only</option>
              <option value="influencer">Influencer Only</option>
              <option value="agent">Agent Only</option>
            </select>
          </div>

          {/* Active Toggle */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) =>
                setFormData({ ...formData, isActive: e.target.checked })
              }
              className="w-4 h-4 text-primary-accent border-primary-border rounded focus:ring-primary-accent"
            />
            <label htmlFor="isActive" className="text-sm text-primary-fg">
              Active (visible to users)
            </label>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-primary-border">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-primary-fg bg-primary-border rounded-lg hover:bg-primary-accent-light transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-primary-accent rounded-lg hover:bg-primary-accent-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Creating...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Create Update
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


