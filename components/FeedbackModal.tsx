"use client";

import { useState, useEffect } from "react";
import { X, MessageSquare, Send, CheckCircle } from "lucide-react";
import { authenticatedFetch } from "@/lib/auth-utils";
import { API_BASE_URL } from "@/lib/api";

interface FeedbackModalProps {
  source: 'staff' | 'affiliate' | 'agent' | 'influencer' | 'talaash';
}

export function FeedbackModal({ source }: FeedbackModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if user has already seen/dismissed the feedback modal
    const hasSeenModal = localStorage.getItem(`feedback-modal-${source}-seen`);
    
    // Only show on first visit (not seen before)
    if (!hasSeenModal) {
      // Small delay to let page load first
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 2000); // Show after 2 seconds

      return () => clearTimeout(timer);
    }
  }, [source]);

  const handleClose = () => {
    setIsOpen(false);
    // Mark as seen so it doesn't show again
    localStorage.setItem(`feedback-modal-${source}-seen`, 'true');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim()) {
      setError("Please enter your feedback");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      
      // Use authenticatedFetch for staff portal
      const response = await authenticatedFetch(`${API_BASE_URL}/api/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: message.trim(),
          source: source,
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setMessage("");
        setSubmitted(true);
        localStorage.setItem(`feedback-modal-${source}-seen`, 'true');
        setTimeout(() => {
          setIsOpen(false);
          setSubmitted(false);
        }, 2000);
      } else {
        setError(data.error || 'Failed to submit feedback');
      }
    } catch (err: any) {
      console.error('Error submitting feedback:', err);
      setError(err.message || 'Failed to submit feedback');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 relative">
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-blue-100 p-2 rounded-full">
            <MessageSquare className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-primary-fg">We&apos;d Love Your Feedback!</h2>
            <p className="text-sm text-primary-muted">Help us improve your experience</p>
          </div>
        </div>

        {submitted ? (
          <div className="text-center py-8">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <p className="text-lg font-medium text-primary-fg mb-2">Thank you!</p>
            <p className="text-primary-muted">Your feedback has been submitted successfully.</p>
          </div>
        ) : (
          <>
            <p className="text-primary-fg mb-4">
              We&apos;re constantly working to improve. Your thoughts and suggestions help us serve you better.
            </p>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg mb-4 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="feedback-message" className="block text-sm font-medium text-primary-fg mb-2">
                  Your Feedback
                </label>
                <textarea
                  id="feedback-message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Share your thoughts, suggestions, or report any issues..."
                  rows={4}
                  className="w-full px-4 py-2 border border-primary-border rounded-lg focus:ring-2 focus:ring-primary-accent focus:border-primary-accent outline-none resize-none bg-primary-bg text-primary-fg"
                  required
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex-1 px-4 py-2 border border-primary-border rounded-lg text-primary-fg hover:bg-primary-bg transition-colors"
                  disabled={submitting}
                >
                  Maybe Later
                </button>
                <button
                  type="submit"
                  disabled={submitting || !message.trim()}
                  className="flex-1 px-4 py-2 bg-primary-accent hover:bg-primary-accent-dark text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Submit
                    </>
                  )}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

