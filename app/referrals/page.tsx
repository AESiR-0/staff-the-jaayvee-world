"use client";
import { useState, useEffect } from "react";
import { QrCode, Users, MousePointer, TrendingUp, Copy, ExternalLink, Calendar } from "lucide-react";
import { authenticatedFetch, getTeamSession } from "@/lib/auth-utils";
import { API_ENDPOINTS, API_BASE_URL } from "@/lib/api";
import { EventReferralLink } from "@/components/EventReferralLink";

interface ReferralStats {
  referralCode: string;
  totalClicks: number;
  totalSignups: number;
  conversionRate: number;
}

interface Event {
  id: string;
  name: string;
  date: string;
  location: string;
}

export default function ReferralsPage() {
  const [stats, setStats] = useState<ReferralStats>({
    referralCode: "",
    totalClicks: 0,
    totalSignups: 0,
    conversionRate: 0,
  });
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [eventsLoading, setEventsLoading] = useState(true);

  useEffect(() => {
    // Wait for page to load before fetching data
    const loadData = async () => {
      await fetchReferralData();
      await fetchEvents();
    };
    
    loadData();
  }, []);

  const fetchEvents = async () => {
    try {
      setEventsLoading(true);
      const response = await authenticatedFetch(`${API_BASE_URL}${API_ENDPOINTS.TALAASH_EVENTS_SUMMARY}`);
      if (response.ok) {
        const data = await response.json();
        console.log('📊 Events data:', data);
        
        // API response structure: data.data.summary.recentEvents or data.data.summary.upcomingEvents
        const recentEvents = data.data?.summary?.recentEvents || [];
        const upcomingEvents = data.data?.summary?.upcomingEvents || [];
        
        // Combine recent and upcoming events
        const allEvents = [...recentEvents, ...upcomingEvents];
        
        setEvents(allEvents.map((event: any) => ({
          id: event.id,
          name: event.title, // API uses "title" not "name"
          date: event.startDate,
          location: event.venue || event.venture?.name || 'TBD' // Use venture name as fallback
        })));
      }
    } catch (error) {
      console.error('Failed to fetch events:', error);
    } finally {
      setEventsLoading(false);
    }
  };

  const fetchReferralData = async () => {
    try {
      setLoading(true);
      const session = getTeamSession();
      
      console.log('📊 Fetching referral data...');
      console.log('Session:', session);

      // Fetch affiliate stats
      if (session?.staffId) {
        const url = `${API_BASE_URL}${API_ENDPOINTS.TEAM_AFFILIATE}`;
        console.log('🌐 Fetching from URL:', url);
        
        const affiliateRes = await authenticatedFetch(url);
        console.log('📡 Response status:', affiliateRes.status);
        
        if (affiliateRes.ok) {
          const data = await affiliateRes.json();
          console.log('✅ Response data:', data);
          
          const affiliateData = data.data;
          const affiliateCode = affiliateData?.referralCode || "";

          setStats({
            referralCode: affiliateCode,
            totalClicks: affiliateData?.totalClicks || 0,
            totalSignups: affiliateData?.totalSignups || 0,
            conversionRate: affiliateData?.totalClicks > 0
              ? (affiliateData.totalSignups / affiliateData.totalClicks) * 100
              : 0,
          });
        } else {
          const errorText = await affiliateRes.text();
          console.error('❌ API error:', affiliateRes.status, errorText);
        }
      } else {
        console.warn('⚠️ No session found');
      }
    } catch (error) {
      console.error('Failed to fetch referral data:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyReferralCode = () => {
    navigator.clipboard.writeText(stats.referralCode);
    // You could add a toast notification here
  };

  const shareReferralLink = () => {
    const link = `https://talaash.thejaayveeworld.com/auth/register?ref=${stats.referralCode}`;
    navigator.clipboard.writeText(link);
    // You could add a toast notification here
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-primary-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-primary-fg mb-2">Referral Management</h1>
        <p className="text-primary-muted">Share your referral link and track performance</p>
      </div>

      {/* Content */}
      <div className="space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="card">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary-accent-light rounded-xl flex items-center justify-center">
                <QrCode className="text-primary-accent" size={20} />
              </div>
              <div>
                <p className="text-sm text-primary-muted">Partner Code</p>
                <p className="text-lg font-bold text-primary-fg">{stats.referralCode || "No code"}</p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary-accent-light rounded-xl flex items-center justify-center">
                <MousePointer className="text-primary-accent" size={20} />
              </div>
              <div>
                <p className="text-sm text-primary-muted">Total Clicks</p>
                <p className="text-2xl font-bold text-primary-fg">{stats.totalClicks.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary-accent-light rounded-xl flex items-center justify-center">
                <Users className="text-primary-accent" size={20} />
              </div>
              <div>
                <p className="text-sm text-primary-muted">Total Signups</p>
                <p className="text-2xl font-bold text-primary-fg">{stats.totalSignups.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary-accent-light rounded-xl flex items-center justify-center">
                <TrendingUp className="text-primary-accent" size={20} />
              </div>
              <div>
                <p className="text-sm text-primary-muted">Conversion Rate</p>
                <p className="text-2xl font-bold text-primary-fg">{stats.conversionRate.toFixed(1)}%</p>
              </div>
            </div>
          </div>
        </div>

        {/* Referral Code Card */}
        <div className="card">
          <h2 className="text-lg font-semibold text-primary-fg mb-4">Your Partner Code</h2>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <p className="text-sm text-primary-muted mb-1">Referral Code</p>
                <p className="text-primary-accent font-bold text-2xl font-mono">{stats.referralCode || "No code"}</p>
              </div>
              <button
                onClick={copyReferralCode}
                className="btn-primary flex items-center gap-2"
              >
                <Copy size={16} />
                Copy Code
              </button>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex-1">
                <p className="text-sm text-primary-muted mb-1">Referral Link</p>
                <p className="text-primary-fg font-mono text-sm">
                  https://thejaayveeworld.com/ease?ref={stats.referralCode || "YOUR_CODE"}
                </p>
              </div>
              <button
                onClick={shareReferralLink}
                className="border border-primary-border text-primary-fg px-4 py-2 rounded-xl hover:bg-primary-accent-light transition-colors flex items-center gap-2"
              >
                <ExternalLink size={16} />
                Copy Link
              </button>
            </div>
          </div>
        </div>


        {/* Event Referral Links */}
        {!eventsLoading && events.length > 0 && (
          <div className="card">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-primary-accent-light rounded-xl flex items-center justify-center">
                <Calendar className="text-primary-accent" size={20} />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-primary-fg">Event Referral Links</h2>
                <p className="text-sm text-primary-muted">Share referral links for specific events</p>
              </div>
            </div>
            <div className="space-y-3">
              {events.map((event) => (
                <EventReferralLink
                  key={event.id}
                  eventId={event.id}
                  eventName={event.name}
                  affiliateCode={stats.referralCode}
                />
              ))}
            </div>
          </div>
        )}
        
        {eventsLoading && (
          <div className="card">
            <div className="flex items-center justify-center py-8">
              <div className="w-8 h-8 border-2 border-primary-accent border-t-transparent rounded-full animate-spin" />
              <span className="ml-3 text-primary-muted">Loading events...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 
