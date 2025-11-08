"use client";

import { useState, useEffect } from "react";
import { ReferralCard } from "@/components/ReferralCard";
import { TasksWidget } from "@/components/TasksWidget";
import { EventTable } from "@/components/EventTable";
import { MerchantQRManager } from "@/components/MerchantQRManager";
import { UpdatesPanel } from "@/components/UpdatesPanel";
import { Calendar, QrCode, Users, TrendingUp, Plus, Shield } from "lucide-react";
import Link from "next/link";
import { API_ENDPOINTS } from "@/lib/api";
import { Event, AffiliateStats } from "@/lib/types";
import { authenticatedFetch, getStaffSession } from "@/lib/auth-utils";

// Real data will be fetched from API

function DashboardContent() {
  const [refreshUpdates, setRefreshUpdates] = useState(0);
  const [canCreateUpdates, setCanCreateUpdates] = useState(false);
  const [canAccessRBAC, setCanAccessRBAC] = useState(false);
  
  // Get staff session (backend uses staffId)
  const session = typeof window !== 'undefined' ? getStaffSession() : null;
  const staffId = session?.staffId;
  
  // Fetch real data from API with error handling
  const [events, setEvents] = useState<Event[]>([]);
  const [affiliateStats, setAffiliateStats] = useState<AffiliateStats>({ 
    affiliateCode: "", 
    totalClicks: 0, 
    totalSignups: 0, 
    totalCommission: 0,
    recentClicks: 0,
    recentSignups: 0
  });
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get base URL from API configuration  
        const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://thejaayveeworld.com';
        
        // Check if user can create updates and access RBAC
        try {
          const meRes = await authenticatedFetch(`${API_BASE_URL}/api/auth/me`);
          if (meRes.ok) {
            const meData = await meRes.json();
            const userEmail = meData.data?.user?.email || meData.data?.email || meData.email;
            const { isSuperAdmin } = await import('@/lib/rbac');
            
            // Super admins can do everything
            if (isSuperAdmin(userEmail)) {
              setCanCreateUpdates(true);
              setCanAccessRBAC(true);
            } else {
              const allowedEmails = [
                "sm2.thejaayveeworld@gmail.com",
                "sm13.thejaayveeworld@gmail.com",
                "md.thejaayveeworld@gmail.com"
              ];
              if (allowedEmails.includes(userEmail?.toLowerCase() || '')) {
                setCanCreateUpdates(true);
              }
            }
          }
        } catch (err) {
          console.error('Failed to check update permissions:', err);
        }
        
        // Fetch events summary - convert to dashboard format
        const eventsRes = await fetch(`${API_BASE_URL}${API_ENDPOINTS.TALAASH_EVENTS_SUMMARY}`);
        if (eventsRes.ok) {
          const summaryData = await eventsRes.json();
          // Convert talaash summary format to dashboard format
          const fetchedEvents = summaryData.data?.upcomingEvents?.map((event: any) => ({
            id: event.id,
            name: event.title,
            date: event.startDate,
            location: event.venue || 'TBD',
            attendees: 0, // Will need actual attendee count from tickets
            maxAttendees: 100, // Default
            status: event.status || 'upcoming' as const,
          })) || [];
          setEvents(fetchedEvents);
        }
        
        // Fetch affiliate stats - pass staffId in request body if available
        if (staffId) {
          const affiliateRes = await authenticatedFetch(`${API_BASE_URL}${API_ENDPOINTS.STAFF_AFFILIATE}`);
          if (affiliateRes.ok) {
            const affiliateData = await affiliateRes.json();
            setAffiliateStats({
              affiliateCode: affiliateData.data?.referralCode || "",
              totalClicks: 0,
              totalSignups: 0,
              totalCommission: 0,
              recentClicks: 0,
              recentSignups: 0
            });
          }
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [staffId]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-primary-fg mb-2">Team Dashboard</h1>
          <p className="text-primary-muted">Welcome back! Here&apos;s your overview.</p>
        </div>
        {canAccessRBAC && (
          <Link
            href="/rbac"
            className="flex items-center gap-2 px-4 py-2 bg-primary-accent text-white rounded-lg hover:bg-primary-accent-dark transition-colors"
          >
            <Shield className="h-4 w-4" />
            RBAC Management
          </Link>
        )}
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

        {/* Tasks Widget - Replaces QR Tools */}
        <div className="lg:col-span-1">
          <TasksWidget />
        </div>
      </div>

      {/* Merchant QR Manager - Moved below */}
      <div>
        <MerchantQRManager />
      </div>

      {/* Updates Panel */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-primary-fg">Promotional Updates</h2>
          {canCreateUpdates && (
            <a
              href="/updates/create"
              className="flex items-center gap-2 px-4 py-2 bg-primary-accent text-white rounded-lg hover:bg-primary-accent-dark transition-colors"
            >
              <Plus className="h-4 w-4" />
              Create Update
            </a>
          )}
        </div>
        <UpdatesPanel 
          audience="team" 
          apiBaseUrl={process.env.NEXT_PUBLIC_API_BASE_URL || 'https://thejaayveeworld.com'}
          showHistory={true}
          key={refreshUpdates}
        />
      </div>

      {/* Events Table */}
      {/* <div>
        <EventTable events={events} />
      </div> */}
    </div>
  );
}

export default function DashboardPage() {
  return <DashboardContent />;
}

