import { Suspense } from "react";
import { ReferralCard } from "@/components/ReferralCard";
import { QrTools } from "@/components/QrTools";
import { EventTable } from "@/components/EventTable";
import { Calendar, QrCode, Users, TrendingUp } from "lucide-react";
import { API_ENDPOINTS } from "@/lib/api";
import { Event, AffiliateStats } from "@/lib/types";

// Real data will be fetched from API

async function DashboardContent() {
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
    const [eventsRes, affiliateRes] = await Promise.all([
      fetch(API_ENDPOINTS.TALAASH_EVENTS_SUMMARY),
      fetch(API_ENDPOINTS.STAFF_AFFILIATE_GET),
    ]);
    
    if (eventsRes.ok) {
      events = await eventsRes.json() as Event[];
    }
    
    if (affiliateRes.ok) {
      affiliateStats = await affiliateRes.json() as AffiliateStats;
    }
  } catch (error) {
    console.error('Failed to fetch data:', error);
    // Use demo data as fallback for testing
    events = [
      {
        id: "1",
        name: "Talaash Workshop 2024",
        date: "2024-02-15T10:00:00Z",
        location: "Main Conference Hall",
        attendees: 45,
        maxAttendees: 50,
        status: "upcoming" as const,
      },
      {
        id: "2", 
        name: "Digital Marketing Masterclass",
        date: "2024-02-10T14:00:00Z",
        location: "Room 101",
        attendees: 30,
        maxAttendees: 30,
        status: "completed" as const,
      },
      {
        id: "3",
        name: "Networking Event",
        date: "2024-02-08T18:00:00Z", 
        location: "Lobby Area",
        attendees: 25,
        maxAttendees: 40,
        status: "ongoing" as const,
      },
    ];
    
    affiliateStats = {
      affiliateCode: "TJ2024-DEMO-001",
      totalClicks: 156,
      totalSignups: 23,
      totalCommission: 1250.50,
      recentClicks: 12,
      recentSignups: 3
    };
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
              <p className="text-2xl font-bold text-primary-fg">1,247</p>
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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Referral Card */}
        <div className="lg:col-span-1">
          <ReferralCard data={affiliateStats} />
        </div>

        {/* QR Tools */}
        <div className="lg:col-span-1">
          <QrTools />
        </div>

        {/* Quick Actions */}
        <div className="lg:col-span-1">
          <div className="card">
            <h3 className="text-lg font-semibold text-primary-fg mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <button className="w-full btn-primary flex items-center gap-2">
                <QrCode size={16} />
                Generate New QR Batch
              </button>
              <button className="w-full border border-primary-border text-primary-fg px-4 py-2 rounded-xl hover:bg-primary-accent-light transition-colors flex items-center gap-2">
                <Users size={16} />
                View Referral Stats
              </button>
              <button className="w-full border border-primary-border text-primary-fg px-4 py-2 rounded-xl hover:bg-primary-accent-light transition-colors flex items-center gap-2">
                <Calendar size={16} />
                Create New Event
              </button>
            </div>
          </div>
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
