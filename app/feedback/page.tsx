"use client";

import { useEffect, useState } from "react";
import { MessageSquare, Send, X, Search, Filter, Calendar, User, Mail } from "lucide-react";
import { authenticatedFetch, getTeamSession } from "@/lib/auth-utils";
import { API_BASE_URL } from "@/lib/api";
import { isSuperAdmin } from "@/lib/rbac";

interface Feedback {
  id: string;
  userId: string;
  userName: string | null;
  userEmail: string | null;
  message: string;
  source: string; // 'staff' | 'affiliate' | 'agent' | 'influencer' | 'talaash'
  createdAt: string;
  status?: 'new' | 'read' | 'archived';
}

export default function FeedbackPage() {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterSource, setFilterSource] = useState<string>("all");
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null); // null = checking, true/false = result

  const session = getTeamSession();
  const currentUserEmail = session?.email;

  useEffect(() => {
    checkAdminStatus();
  }, []);

  useEffect(() => {
    // Only fetch feedbacks if admin check is complete and user is admin
    if (isAdmin === true) {
      fetchFeedbacks();
    }
  }, [isAdmin]);

  const checkAdminStatus = async () => {
    try {
      const { getAuthToken } = require('@/lib/auth-utils');
      const { checkHasAccessClient } = require('@/lib/permissions');
      const token = getAuthToken();
      
      if (!token || !currentUserEmail) {
        setIsAdmin(false);
        return;
      }
      
      // Feedback requires super admin
      const result = await checkHasAccessClient(currentUserEmail, '', token, true);
      setIsAdmin(result.hasAccess && result.reason === 'super_admin');
    } catch (err) {
      console.error('Error checking admin status:', err);
      setIsAdmin(false);
    }
  };

  const fetchFeedbacks = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await authenticatedFetch(`${API_BASE_URL}/api/team/feedback`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch feedbacks');
      }

      const data = await response.json();
      if (data.success) {
        setFeedbacks(data.data || []);
      } else {
        setError(data.error || 'Failed to fetch feedbacks');
      }
    } catch (err: any) {
      console.error("Error fetching feedbacks:", err);
      setError(err.message || "Failed to fetch feedbacks");
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/api/team/feedback/${id}/read`, {
        method: 'PUT',
      });

      if (response.ok) {
        setFeedbacks(feedbacks.map(f => f.id === id ? { ...f, status: 'read' as const } : f));
      }
    } catch (err) {
      console.error('Error marking feedback as read:', err);
    }
  };

  const archiveFeedback = async (id: string) => {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/api/team/feedback/${id}/archive`, {
        method: 'PUT',
      });

      if (response.ok) {
        setFeedbacks(feedbacks.filter(f => f.id !== id));
      }
    } catch (err) {
      console.error('Error archiving feedback:', err);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const filteredFeedbacks = feedbacks.filter((feedback) => {
    const matchesSearch = 
      feedback.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
      feedback.userName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      feedback.userEmail?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesSource = filterSource === "all" || feedback.source === filterSource;
    
    return matchesSearch && matchesSource;
  });

  const sources = ['all', 'staff', 'affiliate', 'agent', 'influencer', 'talaash'];
  const sourceCounts = sources.reduce((acc, source) => {
    if (source === 'all') {
      acc[source] = feedbacks.length;
    } else {
      acc[source] = feedbacks.filter(f => f.source === source).length;
    }
    return acc;
  }, {} as Record<string, number>);

  // Show loading while checking admin status
  if (isAdmin === null) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary-accent border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-primary-muted">Checking access...</p>
        </div>
      </div>
    );
  }

  // Show access denied only after admin check is complete
  if (isAdmin === false) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-primary-fg mb-2">Access Denied</h1>
          <p className="text-primary-muted">Only administrators can view feedback.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary-accent border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-primary-muted">Loading feedback...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-primary-fg">Feedback</h1>
          <p className="text-primary-muted mt-1">View feedback from all users across platforms</p>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)}>
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="card p-4 space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-primary-muted" />
            <input
              type="text"
              placeholder="Search feedback..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-primary-border rounded-lg focus:ring-2 focus:ring-primary-accent focus:border-primary-accent outline-none bg-primary-bg text-primary-fg"
            />
          </div>

          {/* Source Filter */}
          <div className="flex gap-2 flex-wrap">
            {sources.map((source) => (
              <button
                key={source}
                onClick={() => setFilterSource(source)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filterSource === source
                    ? 'bg-primary-accent text-white'
                    : 'bg-primary-bg text-primary-fg border border-primary-border hover:bg-primary-accent-light'
                }`}
              >
                {source.charAt(0).toUpperCase() + source.slice(1)} ({sourceCounts[source] || 0})
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Feedbacks List */}
      {filteredFeedbacks.length === 0 ? (
        <div className="card p-12 text-center">
          <MessageSquare className="h-12 w-12 text-primary-muted mx-auto mb-4" />
          <p className="text-primary-muted">
            {searchQuery || filterSource !== "all" 
              ? "No feedback matches your filters." 
              : "No feedback yet."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredFeedbacks.map((feedback) => (
            <div
              key={feedback.id}
              className={`card p-4 ${
                feedback.status === 'new' ? 'border-l-4 border-l-primary-accent' : ''
              }`}
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <User className="h-4 w-4 text-primary-muted" />
                    <span className="font-semibold text-primary-fg">
                      {feedback.userName || 'Anonymous'}
                    </span>
                    {feedback.userEmail && (
                      <>
                        <Mail className="h-3 w-3 text-primary-muted ml-2" />
                        <span className="text-sm text-primary-muted">{feedback.userEmail}</span>
                      </>
                    )}
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      feedback.source === 'staff' ? 'bg-blue-100 text-blue-800' :
                      feedback.source === 'affiliate' ? 'bg-green-100 text-green-800' :
                      feedback.source === 'agent' ? 'bg-purple-100 text-purple-800' :
                      feedback.source === 'influencer' ? 'bg-pink-100 text-pink-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {feedback.source}
                    </span>
                    {feedback.status === 'new' && (
                      <span className="px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-800">
                        New
                      </span>
                    )}
                  </div>
                  <p className="text-primary-fg whitespace-pre-wrap">{feedback.message}</p>
                </div>
                <div className="flex gap-2 ml-4">
                  {feedback.status === 'new' && (
                    <button
                      onClick={() => markAsRead(feedback.id)}
                      className="px-3 py-1 text-sm bg-primary-accent-light text-primary-accent rounded hover:bg-primary-accent hover:text-white transition-colors"
                    >
                      Mark Read
                    </button>
                  )}
                  <button
                    onClick={() => archiveFeedback(feedback.id)}
                    className="px-3 py-1 text-sm bg-red-50 text-red-600 rounded hover:bg-red-100 transition-colors"
                  >
                    Archive
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs text-primary-muted mt-3 pt-3 border-t border-primary-border">
                <Calendar className="h-3 w-3" />
                <span>{formatDate(feedback.createdAt)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

