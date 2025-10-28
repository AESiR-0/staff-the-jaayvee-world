import { Suspense } from "react";
import { ReferralCard } from "@/components/ReferralCard";
import { QrTools } from "@/components/QrTools";
import { EventTable } from "@/components/EventTable";
import { MerchantQRManager } from "@/components/MerchantQRManager";
import { Calendar, QrCode, Users, TrendingUp } from "lucide-react";
import { API_ENDPOINTS } from "@/lib/api";
import { Event, AffiliateStats } from "@/lib/types";
import { authenticatedFetch, getStaffSession } from "@/lib/auth-utils";

// Real data will be fetched from API

async function DashboardContent() {
  // Get staff session
  const session = typeof window !== 'undefined' ? getStaffSession() : null;
  const staffId = session?.staffId;
  
  // Fetch real data from API with error handling
  let events: Event[] = [];
  let affiliateStats: AffiliateStats = { 
    affiliateCode: "", 
    totalClicks: 0, 
    totalSignups: 0, 
    totalCommission: 0,
    recentClicks: 0,
    recentSignups: 0
  };
  
  try {
    // Get base URL from API configuration  
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://thejaayveeworld.com';
    
    // Fetch events summary - convert to dashboard format
    const eventsRes = await fetch(`${API_BASE_URL}${API_ENDPOINTS.TALAASH_EVENTS_SUMMARY}`);
    if (eventsRes.ok) {
      const summaryData = await eventsRes.json();
      // Convert talaash summary format to dashboard format
      events = summaryData.data?.upcomingEvents?.map((event: any) => ({
        id: event.id,
        name: event.title,
        date: event.startDate,
        location: event.venue || 'TBD',
        attendees: 0, // Will need actual attendee count from tickets
        maxAttendees: 100, // Default
        status: event.status || 'upcoming' as const,
      })) || [];
    }
    
    // Fetch affiliate stats - pass staffId in request body if available
    if (staffId) {
      const affiliateRes = await authenticatedFetch(`${API_BASE_URL}${API_ENDPOINTS.STAFF_AFFILIATE}`);
      if (affiliateRes.ok) {
        const affiliateData = await affiliateRes.json();
        affiliateStats = {
          affiliateCode: affiliateData.data?.referralCode || "",
          totalClicks: 0,
          totalSignups: 0,
          totalCommission: 0,
          recentClicks: 0,
          recentSignups: 0
        };
      }
    }
  } catch (error) {
    console.error('Failed to fetch data:', error);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-primary-fg mb-2">Staff Dashboard</h1>
        <p className="text-primary-muted">Welcome back! Here&apos;s your overview.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-accent-light rounded-xl flex items-center justify-center">
              <Calendar className="text-primary-accent" size={20} />
            </div>
            <div>
              <p className="text-sm text-primary-muted">Total Events</p>
              <p className="text-2xl font-bold text-primary-fg">{events.length}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-accent-light rounded-xl flex items-center justify-center">
              <Users className="text-primary-accent" size={20} />
            </div>
            <div>
              <p className="text-sm text-primary-muted">Total Attendees</p>
              <p className="text-2xl font-bold text-primary-fg">
                {events.reduce((sum: number, event: Event) => sum + event.attendees, 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="card">  
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-accent-light rounded-xl flex items-center justify-center">
              <QrCode className="text-primary-accent" size={20} />
            </div>
            <div>
              <p className="text-sm text-primary-muted">QR Codes Generated</p>
              <p className="text-2xl font-bold text-primary-fg">-</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-accent-light rounded-xl flex items-center justify-center">
              <TrendingUp className="text-primary-accent" size={20} />
            </div>
            <div>
              <p className="text-sm text-primary-muted">Referral Clicks</p>
              <p className="text-2xl font-bold text-primary-fg">{affiliateStats.totalClicks}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Referral Card */}
        <div>
          <ReferralCard data={affiliateStats} />
        </div>

        {/* Merchant QR Manager - Unified */}
        <div className="lg:col-span-1">
          <MerchantQRManager />
        </div>
      </div>

      {/* Events Table */}
      <div>
        <EventTable events={events} />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-primary-accent border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}
