"use client";

import { useState, useEffect } from "react";
import { Calendar, CheckCircle, Clock, AlertCircle, ArrowRight, Filter } from "lucide-react";
import { authenticatedFetch, getTeamSession } from "@/lib/auth-utils";
import { API_BASE_URL } from "@/lib/api";
import Link from "next/link";
import { format } from "date-fns";

interface EventTaskStats {
  total: number;
  completed: number;
  pending: number;
  overdue: number;
}

interface PlanOfActionEvent {
  id: string;
  title: string;
  startDate: string;
  endDate: string | null;
  status: string;
  createdAt: string;
  taskStats: EventTaskStats;
}

export default function PlanOfActionPage() {
  const [events, setEvents] = useState<PlanOfActionEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');

  useEffect(() => {
    fetchPlanOfAction();
  }, [filterStatus, dateFrom, dateTo]);

  const fetchPlanOfAction = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filterStatus !== 'all') params.append('status', filterStatus);
      if (dateFrom) params.append('dateFrom', dateFrom);
      if (dateTo) params.append('dateTo', dateTo);

      const response = await authenticatedFetch(`${API_BASE_URL}/api/team/plan-of-action?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setEvents(data.data || []);
        }
      }
    } catch (error) {
      console.error('Error fetching plan of action:', error);
    } finally {
      setLoading(false);
    }
  };

  const getProgressPercentage = (stats: EventTaskStats) => {
    if (stats.total === 0) return 0;
    return Math.round((stats.completed / stats.total) * 100);
  };

  const getStatusColor = (stats: EventTaskStats) => {
    if (stats.overdue > 0) return 'text-red-600 bg-red-100';
    if (stats.completed === stats.total && stats.total > 0) return 'text-green-600 bg-green-100';
    return 'text-yellow-600 bg-yellow-100';
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
        <h1 className="text-3xl font-bold text-primary-fg mb-2">Plan of Action</h1>
        <p className="text-primary-muted">View all events and their task progress</p>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-primary-fg mb-2">Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-4 py-2 border border-primary-border rounded-lg bg-primary-bg text-primary-fg"
            >
              <option value="all">All Status</option>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-primary-fg mb-2">From Date</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full px-4 py-2 border border-primary-border rounded-lg bg-primary-bg text-primary-fg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-primary-fg mb-2">To Date</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full px-4 py-2 border border-primary-border rounded-lg bg-primary-bg text-primary-fg"
            />
          </div>
        </div>
      </div>

      {/* Events List */}
      <div className="space-y-4">
        {events.length === 0 ? (
          <div className="card text-center py-12">
            <Calendar className="h-12 w-12 mx-auto text-primary-muted mb-4" />
            <p className="text-primary-muted">No events found</p>
          </div>
        ) : (
          events.map((event) => (
            <Link
              key={event.id}
              href={`/tasks?eventId=${event.id}`}
              className="card hover:shadow-lg transition-shadow block"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-primary-fg">{event.title}</h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(event.taskStats)}`}>
                      {event.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-primary-muted mb-3">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>{format(new Date(event.startDate), 'MMM dd, yyyy')}</span>
                    </div>
                    {event.endDate && (
                      <span>to {format(new Date(event.endDate), 'MMM dd, yyyy')}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm text-primary-fg">
                        {event.taskStats.completed}/{event.taskStats.total} Completed
                      </span>
                    </div>
                    {event.taskStats.pending > 0 && (
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-yellow-600" />
                        <span className="text-sm text-primary-fg">{event.taskStats.pending} Pending</span>
                      </div>
                    )}
                    {event.taskStats.overdue > 0 && (
                      <div className="flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-red-600" />
                        <span className="text-sm text-red-600 font-medium">{event.taskStats.overdue} Overdue</span>
                      </div>
                    )}
                  </div>
                  <div className="mt-3">
                    <div className="w-full bg-primary-border rounded-full h-2">
                      <div
                        className="bg-primary-accent h-2 rounded-full transition-all"
                        style={{ width: `${getProgressPercentage(event.taskStats)}%` }}
                      />
                    </div>
                    <p className="text-xs text-primary-muted mt-1">
                      {getProgressPercentage(event.taskStats)}% Complete
                    </p>
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-primary-muted ml-4" />
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}

