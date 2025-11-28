"use client";

import { useState, useEffect } from "react";
import { User, MessageSquare } from "lucide-react";
import { authenticatedFetch } from "@/lib/auth-utils";
import { FeedbackForm } from "@/components/FeedbackForm";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://talaash.thejaayveeworld.com';

interface UserProfile {
  id: string;
  email: string;
  fullName?: string;
  phone?: string;
  role?: string;
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'profile' | 'feedback'>('profile');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await authenticatedFetch(`${API_BASE_URL}/api/auth/me`);
        if (response.ok) {
          const data = await response.json();
          setProfile(data.data?.user || data.data || data);
        }
      } catch (error) {
        console.error("Failed to fetch profile:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-primary-bg">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-accent mx-auto mb-4"></div>
            <p className="text-primary-muted">Loading profile...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-primary-bg">
      <main className="container max-w-4xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-primary-fg mb-2">Profile</h1>
          <p className="text-primary-muted">
            Manage your account and preferences
          </p>
        </div>

        {/* Tabs Navigation */}
        <div className="border-b border-primary-border mb-6">
          <nav className="flex space-x-1" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('profile')}
              className={`
                flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors
                ${
                  activeTab === 'profile'
                    ? 'border-b-2 border-primary-accent text-primary-accent'
                    : 'text-primary-muted hover:text-primary-fg'
                }
              `}
            >
              <User className="h-4 w-4" />
              Profile
            </button>
            <button
              onClick={() => setActiveTab('feedback')}
              className={`
                flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors
                ${
                  activeTab === 'feedback'
                    ? 'border-b-2 border-primary-accent text-primary-accent'
                    : 'text-primary-muted hover:text-primary-fg'
                }
              `}
            >
              <MessageSquare className="h-4 w-4" />
              Feedback
            </button>
          </nav>
        </div>

        {activeTab === 'feedback' ? (
          <div className="bg-primary-bg border border-primary-border rounded-lg p-6">
            <h2 className="text-xl font-semibold text-primary-fg mb-4 flex items-center">
              <MessageSquare className="h-5 w-5 mr-2" />
              Feedback
            </h2>
            <FeedbackForm source="staff" />
          </div>
        ) : (
          <div className="bg-primary-bg border border-primary-border rounded-lg p-6">
            <h2 className="text-xl font-semibold text-primary-fg mb-4 flex items-center">
              <User className="h-5 w-5 mr-2" />
              Profile Information
            </h2>
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-primary-accent-light rounded-full flex items-center justify-center">
                  <User className="h-8 w-8 text-primary-accent" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-primary-fg">
                    {profile?.fullName || profile?.email || "User"}
                  </h3>
                  <p className="text-primary-muted">{profile?.email}</p>
                  {profile?.phone && (
                    <p className="text-sm text-primary-muted">{profile.phone}</p>
                  )}
                  {profile?.role && (
                    <p className="text-sm text-primary-muted">Role: {profile.role}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

