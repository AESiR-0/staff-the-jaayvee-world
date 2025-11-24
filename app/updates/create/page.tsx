"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Send, AlertCircle, UserPlus, X } from "lucide-react";
import { authenticatedFetch, getTeamSession, getAuthToken } from "@/lib/auth-utils";

// Allowed emails for creating updates
const ALLOWED_EMAIL = [
  "sm2.thejaayveeworld@gmail.com",
  "sm13.thejaayveeworld@gmail.com",
  "md.thejaayveeworld@gmail.com",
  "thejaayveeworldofficial@gmail.com"
];

export default function CreateUpdatePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    message: "",
    priority: "normal" as "low" | "normal" | "high" | "urgent",
    targetAudience: "all" as "all" | "team" | "affiliates" | "influencer" | "agent",
    isActive: true,
    individualRecipients: [] as string[], // Array of email addresses
  });
  const [newRecipient, setNewRecipient] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // Check if user is authorized
    const checkAuthorization = async () => {
      try {
        const token = getAuthToken();
        if (!token) {
          router.push("/login");
          return;
        }

        // Verify user email from API
        const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "https://talaash.thejaayveeworld.com";
        const response = await authenticatedFetch(`${API_BASE_URL}/api/auth/me`);
        
        if (!response.ok) {
          router.push("/login");
          return;
        }

        const data = await response.json();
        const userEmail = data.data?.user?.email || data.data?.email || data.email;

        // Check if user is super admin first
        const { isSuperAdmin } = require('@/lib/rbac');
        const adminCheck = await isSuperAdmin(userEmail);
        if (adminCheck || ALLOWED_EMAIL.includes(userEmail?.toLowerCase() || '')) {
          setAuthorized(true);
        } else {
          // Unauthorized - redirect to dashboard
          console.log("Unauthorized access attempt by:", userEmail);
          router.push("/dashboard");
        }
      } catch (err) {
        console.error("Authorization check failed:", err);
        router.push("/login");
      } finally {
        setLoading(false);
      }
    };

    checkAuthorization();
  }, [router]);

  const addRecipient = () => {
    const email = newRecipient.trim().toLowerCase();
    if (email && email.includes('@') && !formData.individualRecipients.includes(email)) {
      setFormData({
        ...formData,
        individualRecipients: [...formData.individualRecipients, email]
      });
      setNewRecipient("");
    }
  };

  const removeRecipient = (email: string) => {
    setFormData({
      ...formData,
      individualRecipients: formData.individualRecipients.filter(e => e !== email)
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setSubmitting(true);

    try {
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "https://thejaayveeworld.com";
      
      // Convert targetAudience for backend
      const backendAudience = formData.targetAudience === "team" ? "staff" : formData.targetAudience;
      
      const payload = {
        ...formData,
        targetAudience: backendAudience,
        individualRecipients: formData.individualRecipients.length > 0 ? formData.individualRecipients : undefined,
      };

      const response = await authenticatedFetch(`${API_BASE_URL}/api/staff/updates`, {
        method: "POST",
        body: JSON.stringify(payload),
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
        individualRecipients: [],
      });
      setNewRecipient("");

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
      }, 3000);
    } catch (err: any) {
      console.error("Error creating update:", err);
      setError(err.message || "Failed to create update");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-primary-bg flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary-accent border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-primary-muted">Checking authorization...</p>
        </div>
      </div>
    );
  }

  if (!authorized) {
    return (
      <div className="min-h-screen bg-primary-bg flex items-center justify-center">
        <div className="text-center">
          <p className="text-primary-fg mb-4">Unauthorized Access</p>
          <p className="text-primary-muted mb-6">Only authorized team members can access this page.</p>
          <button
            onClick={() => router.push("/dashboard")}
            className="px-4 py-2 bg-primary-accent text-white rounded-lg hover:bg-primary-accent-dark transition-colors"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-primary-bg">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.push("/dashboard")}
            className="flex items-center gap-2 text-primary-muted hover:text-primary-fg transition-colors mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </button>
          <h1 className="text-3xl font-bold text-primary-fg mb-2">Create Promotional Update</h1>
          <p className="text-primary-muted">Post promotional messages for team, affiliates, influencers, agents, or individual people</p>
        </div>

        {/* Form */}
        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-800">Error</p>
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            )}

            {success && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
                <div className="h-5 w-5 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="h-3 w-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-green-800">Success!</p>
                  <p className="text-sm text-green-700">Update created successfully.</p>
                </div>
              </div>
            )}

            {/* Title */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-primary-fg mb-2">
                Title *
              </label>
              <input
                type="text"
                id="title"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-2 border border-primary-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-accent bg-primary-bg text-primary-fg"
                placeholder="Enter update title"
              />
            </div>

            {/* Message */}
            <div>
              <label htmlFor="message" className="block text-sm font-medium text-primary-fg mb-2">
                Message *
              </label>
              <textarea
                id="message"
                required
                rows={8}
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                className="w-full px-4 py-2 border border-primary-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-accent resize-none bg-primary-bg text-primary-fg"
                placeholder="Enter promotional message..."
              />
              <p className="text-xs text-primary-muted mt-1">This message will be displayed to the selected audience or individual recipients.</p>
            </div>

            {/* Priority and Target Audience Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Priority */}
              <div>
                <label htmlFor="priority" className="block text-sm font-medium text-primary-fg mb-2">
                  Priority
                </label>
                <select
                  id="priority"
                  value={formData.priority}
                  onChange={(e) =>
                    setFormData({ ...formData, priority: e.target.value as any })
                  }
                  className="w-full px-4 py-2 border border-primary-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-accent bg-primary-bg text-primary-fg"
                >
                  <option value="low">Low</option>
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>

              {/* Target Audience */}
              <div>
                <label htmlFor="targetAudience" className="block text-sm font-medium text-primary-fg mb-2">
                  Target Audience
                </label>
                <select
                  id="targetAudience"
                  value={formData.targetAudience}
                  onChange={(e) =>
                    setFormData({ ...formData, targetAudience: e.target.value as any })
                  }
                  className="w-full px-4 py-2 border border-primary-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-accent bg-primary-bg text-primary-fg"
                >
                  <option value="all">All Portals</option>
                  <option value="team">Team Only</option>
                  <option value="affiliates">Affiliates Only</option>
                  <option value="influencer">Influencer Only</option>
                  <option value="agent">Agent Only</option>
                </select>
              </div>
            </div>

            {/* Individual Recipients */}
            <div>
              <label className="block text-sm font-medium text-primary-fg mb-2">
                Individual Recipients (Optional)
              </label>
              <p className="text-xs text-primary-muted mb-2">
                Add specific email addresses to send this update to individual people. If recipients are added, they will receive this update regardless of the target audience setting.
              </p>
              <div className="flex gap-2 mb-2">
                <input
                  type="email"
                  value={newRecipient}
                  onChange={(e) => setNewRecipient(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addRecipient();
                    }
                  }}
                  placeholder="Enter email address"
                  className="flex-1 px-4 py-2 border border-primary-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-accent bg-primary-bg text-primary-fg"
                />
                <button
                  type="button"
                  onClick={addRecipient}
                  className="px-4 py-2 bg-primary-accent text-white rounded-lg hover:bg-primary-accent-dark transition-colors flex items-center gap-2"
                >
                  <UserPlus className="h-4 w-4" />
                  Add
                </button>
              </div>
              
              {formData.individualRecipients.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.individualRecipients.map((email) => (
                    <span
                      key={email}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-primary-accent-light rounded-full text-sm text-primary-fg"
                    >
                      {email}
                      <button
                        type="button"
                        onClick={() => removeRecipient(email)}
                        className="hover:text-red-600 transition-colors"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Active Toggle */}
            <div className="flex items-center gap-3 p-4 bg-primary-accent-light rounded-lg border border-primary-border">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) =>
                  setFormData({ ...formData, isActive: e.target.checked })
                }
                className="w-5 h-5 text-primary-accent border-primary-border rounded focus:ring-primary-accent"
              />
              <label htmlFor="isActive" className="text-sm text-primary-fg cursor-pointer">
                Active (visible to users immediately after creation)
              </label>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-4 pt-4 border-t border-primary-border">
              <button
                type="button"
                onClick={() => router.push("/dashboard")}
                className="px-6 py-2 text-sm font-medium text-primary-fg bg-primary-border rounded-lg hover:bg-primary-accent-light transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2 text-sm font-medium text-white bg-primary-accent rounded-lg hover:bg-primary-accent-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {submitting ? (
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

        {/* Info Box */}
        <div className="mt-6 card bg-primary-accent-light/50 border-primary-accent/20">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-primary-accent flex-shrink-0 mt-0.5" />
            <div className="text-sm text-primary-fg">
              <p className="font-medium mb-1">Note</p>
              <p className="text-primary-muted">
                If individual recipients are specified, they will receive the update even if they don&apos;t match the target audience. 
                If no individual recipients are specified, the update will be visible to all users in the selected target audience.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

