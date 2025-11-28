"use client";

import { useState } from "react";
import { MessageSquare, Send, CheckCircle } from "lucide-react";

interface FeedbackFormProps {
  source: 'staff' | 'affiliate' | 'agent' | 'influencer' | 'talaash';
  className?: string;
}

export function FeedbackForm({ source, className = "" }: FeedbackFormProps) {
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim()) {
      setError("Please enter your feedback");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      
      const token = localStorage.getItem('authToken') || localStorage.getItem('tjw_auth_token');
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://talaash.thejaayveeworld.com';
      const response = await fetch(`${API_BASE_URL}/api/feedback`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          message: message.trim(),
          source: source,
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setMessage("");
        setSubmitted(true);
        setTimeout(() => {
          setSubmitted(false);
        }, 3000);
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

  return (
    <div className={className}>
      {submitted ? (
        <div className="text-center py-8">
          <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
          <p className="text-lg font-medium text-primary-fg mb-2">Thank you!</p>
          <p className="text-primary-muted">Your feedback has been submitted successfully.</p>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-primary-accent-light p-2 rounded-full">
              <MessageSquare className="h-6 w-6 text-primary-accent" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-primary-fg">We&apos;d Love Your Feedback!</h2>
              <p className="text-sm text-primary-muted">Help us improve your experience</p>
            </div>
          </div>

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
                rows={6}
                className="w-full px-4 py-2 border border-primary-border rounded-lg focus:ring-2 focus:ring-primary-accent focus:border-primary-accent outline-none resize-none bg-primary-bg text-primary-fg"
                required
              />
            </div>

            <button
              type="submit"
              disabled={submitting || !message.trim()}
              className="w-full px-4 py-2 text-white bg-primary-accent rounded-lg hover:bg-primary-accent-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Submit Feedback
                </>
              )}
            </button>
          </form>
        </>
      )}
    </div>
  );
}

