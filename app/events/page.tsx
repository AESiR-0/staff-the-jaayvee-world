import { EventTable } from "@/components/EventTable";
import { Calendar, Plus, Filter } from "lucide-react";
import { API_ENDPOINTS, API_BASE_URL } from "@/lib/api";
import { Event } from "@/lib/types";

export default async function EventsPage() {
  // Fetch real events data from API with error handling
  let events: Event[] = [];
  
  try {
    const url = `${API_BASE_URL}${API_ENDPOINTS.TALAASH_EVENTS_SUMMARY}`;
    const response = await fetch(url, {
      cache: 'no-store', // Ensure fresh data
    });
    if (response.ok) {
      const data = await response.json();
      // Handle different response formats
      events = Array.isArray(data) ? data : (data.data || data.events || []);
    }
  } catch (error) {
    console.error('Failed to fetch events:', error);
    // Use empty array as fallback
  }
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-primary-fg mb-2">Talaash Events</h1>
          <p className="text-primary-muted">Manage and track all events</p>
        </div>
        <div className="flex gap-3">
          <button className="border border-primary-border text-primary-fg px-4 py-2 rounded-xl hover:bg-primary-accent-light transition-colors flex items-center gap-2">
            <Filter size={16} />
            Filter
          </button>
          <button className="btn-primary flex items-center gap-2">
            <Plus size={16} />
            Create Event
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              <Calendar className="text-primary-accent" size={20} />
            </div>
            <div>
              <p className="text-sm text-primary-muted">Upcoming Events</p>
              <p className="text-2xl font-bold text-primary-fg">
                {events.filter((e: Event) => e.status === "upcoming").length}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-accent-light rounded-xl flex items-center justify-center">
              <Calendar className="text-primary-accent" size={20} />
            </div>
            <div>
              <p className="text-sm text-primary-muted">Total Attendees</p>
              <p className="text-2xl font-bold text-primary-fg">
                {events.reduce((sum: number, event: Event) => sum + event.attendees, 0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Events Table */}
      <EventTable events={events} />
    </div>
  );
}

