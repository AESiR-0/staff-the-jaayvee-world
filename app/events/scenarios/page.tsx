"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { TrendingUp, BarChart3, RefreshCw, ExternalLink, Loader2, Filter, Info, ChevronDown, ChevronUp } from "lucide-react";
import { authenticatedFetch, getTeamSession } from "@/lib/auth-utils";
import { isSuperAdmin } from "@/lib/rbac";
import { API_BASE_URL } from "@/lib/api";

interface Event {
  id: string;
  title: string;
  startDate: string;
  endDate: string | null;
  status: string;
  published: boolean;
}

interface TicketTypeBreakdown {
  id: string;
  name: string;
  price: number;
  capacity: number;
  sold: number;
  available: number;
  revenue: number;
  revenuePercentage: number;
}

interface TicketTypeScenario {
  scenarioName: string;
  description: string;
  ticketTypeBreakdown: Array<{
    ticketTypeId: string;
    ticketTypeName: string;
    sold: number;
    capacity: number;
    price: number;
    revenue: number;
  }>;
  totalCapacity: number;
  totalSold: number;
  expectedIncome: number;
  expectedProfit: number;
  profitMargin: number;
}

interface FinancialCalculations {
  expenses: {
    totalExpenses: number;
    breakdown?: {
      fixed?: Array<{ name: string; amount: number }>;
      perPerson?: Array<{ name: string; amount: number; invitees: number }>;
      percentage?: Array<{ name: string; amount: number; percentage: number }>;
    };
  };
  income: {
    ticketIncome: number;
    sponsorIncome: number;
    otherIncome: number;
    totalIncome: number;
    ticketTypeBreakdown?: TicketTypeBreakdown[];
  };
  profit: {
    totalExpenses: number;
    totalIncome: number;
    profit: number;
    profitMargin: number;
  };
  suggestions: {
    scenarios: Array<{
      price: number;
      capacity: number;
      expectedIncome: number;
      expectedProfit: number;
      profitMargin: number;
    }>;
    ticketTypeScenarios?: TicketTypeScenario[];
  };
  subscriberLimitsBreakdown?: {
    enabled: boolean;
    premium: { limit: number; used: number };
    diamond: { limit: number; used: number };
    exclusiveBlack: { limit: number; used: number };
    student: { limit: number; used: number };
    total: { limit: number; used: number };
  };
}

interface EventFinancials {
  eventPrice: number;
  capacity: number;
  expectedProfit: number;
}

interface LiveMetrics {
  ticketsSold: number;
  totalCapacity: number;
  actualRevenue: number;
  projectedRevenue: number;
  actualProfit: number;
  projectedProfit: number;
  capacityUtilization: number;
}

interface EventWithData extends Event {
  financials?: EventFinancials;
  calculations?: FinancialCalculations;
  liveMetrics?: LiveMetrics;
}

export default function EventScenariosPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [events, setEvents] = useState<EventWithData[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [expandedEvents, setExpandedEvents] = useState<Set<string>>(new Set());
  const [expandedMetrics, setExpandedMetrics] = useState<Set<string>>(new Set());
  const [expandedSections, setExpandedSections] = useState<Map<string, Set<string>>>(new Map()); // eventId -> Set of section keys
  const [loadingCalculations, setLoadingCalculations] = useState<Set<string>>(new Set());
  const [loadedCalculations, setLoadedCalculations] = useState<Set<string>>(new Set());

  const fetchEvents = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);

    try {
      // Fetch all events
      const eventsRes = await authenticatedFetch(`${API_BASE_URL}/api/events?all=true`);
      const eventsData = await eventsRes.json();

      if (!eventsRes.ok || !eventsData.success) {
        throw new Error(eventsData.error || "Failed to fetch events");
      }

      const eventsList: Event[] = eventsData.data || [];

      // Only fetch basic financials and live metrics (not calculations)
      const eventsWithData = await Promise.all(
        eventsList.map(async (event) => {
          const eventData: EventWithData = { ...event };

          try {
            // Fetch financials (basic info only)
            const financialsRes = await authenticatedFetch(
              `${API_BASE_URL}/api/events/${event.id}/financials`
            );
            if (financialsRes.ok) {
              const financialsData = await financialsRes.json();
              if (financialsData.success && financialsData.data?.financials) {
                eventData.financials = financialsData.data.financials;
              }
            }

            // Fetch live metrics (ticket sales, revenue)
            const metricsRes = await authenticatedFetch(
              `${API_BASE_URL}/api/events/${event.id}/metrics`
            );
            if (metricsRes.ok) {
              const metricsData = await metricsRes.json();
              if (metricsData.success && metricsData.data) {
                eventData.liveMetrics = metricsData.data;
              }
            }

            // Only fetch calculations if already loaded before
            if (loadedCalculations.has(event.id)) {
              const calcRes = await authenticatedFetch(
                `${API_BASE_URL}/api/events/${event.id}/financials/calculate`
              );
              if (calcRes.ok) {
                const calcData = await calcRes.json();
                if (calcData.success && calcData.data) {
                  eventData.calculations = calcData.data;
                }
              }
            }
          } catch (err) {
            console.error(`Error fetching data for event ${event.id}:`, err);
          }

          return eventData;
        })
      );

      setEvents(eventsWithData);
      setLastRefresh(new Date());
    } catch (error: any) {
      console.error("Error fetching events:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [loadedCalculations]);

  const fetchEventCalculations = useCallback(async (eventId: string) => {
    // Don't fetch if already loading or already loaded
    if (loadingCalculations.has(eventId) || loadedCalculations.has(eventId)) {
      return;
    }

    setLoadingCalculations(prev => new Set(prev).add(eventId));

    try {
      const calcRes = await authenticatedFetch(
        `${API_BASE_URL}/api/events/${eventId}/financials/calculate`
      );
      
      if (calcRes.ok) {
        const calcData = await calcRes.json();
        if (calcData.success && calcData.data) {
          setEvents(prev => prev.map(event => 
            event.id === eventId 
              ? { ...event, calculations: calcData.data }
              : event
          ));
          setLoadedCalculations(prev => new Set(prev).add(eventId));
        }
      }
    } catch (error) {
      console.error(`Error fetching calculations for event ${eventId}:`, error);
    } finally {
      setLoadingCalculations(prev => {
        const next = new Set(prev);
        next.delete(eventId);
        return next;
      });
    }
  }, [loadingCalculations, loadedCalculations]);

  const toggleEventExpanded = useCallback((eventId: string) => {
    setExpandedEvents(prev => {
      const next = new Set(prev);
      if (next.has(eventId)) {
        next.delete(eventId);
      } else {
        next.add(eventId);
        // Fetch calculations when expanding
        if (!loadedCalculations.has(eventId)) {
          fetchEventCalculations(eventId);
        }
      }
      return next;
    });
  }, [loadedCalculations, fetchEventCalculations]);

  const toggleMetricsExpanded = useCallback((eventId: string) => {
    setExpandedMetrics(prev => {
      const next = new Set(prev);
      if (next.has(eventId)) {
        next.delete(eventId);
      } else {
        next.add(eventId);
      }
      return next;
    });
  }, []);

  const toggleSectionExpanded = useCallback((eventId: string, sectionKey: string) => {
    setExpandedSections(prev => {
      const next = new Map(prev);
      const sections = next.get(eventId) || new Set<string>();
      const newSections = new Set(sections);
      
      if (newSections.has(sectionKey)) {
        newSections.delete(sectionKey);
      } else {
        newSections.add(sectionKey);
      }
      
      next.set(eventId, newSections);
      return next;
    });
  }, []);

  const isSectionExpanded = useCallback((eventId: string, sectionKey: string) => {
    return expandedSections.get(eventId)?.has(sectionKey) || false;
  }, [expandedSections]);

  useEffect(() => {
    const checkAuthorization = async () => {
      const session = getTeamSession();
      if (!session?.email) {
        router.push("/login");
        return;
      }

      if (!isSuperAdmin(session.email)) {
        setAuthorized(false);
        setLoading(false);
        return;
      }

      setAuthorized(true);
      await fetchEvents();
    };

    checkAuthorization();
  }, [router, fetchEvents]);

  // Auto-refresh every 10 seconds
  useEffect(() => {
    if (!authorized) return;

    const interval = setInterval(() => {
      fetchEvents(true);
    }, 60000); // 10 seconds

    return () => clearInterval(interval);
  }, [authorized, fetchEvents]);

  const filteredEvents = events.filter((event) => {
    if (filterStatus === "all") return true;
    return event.status === filterStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "upcoming":
        return "bg-blue-100 text-blue-800";
      case "ongoing":
        return "bg-green-100 text-green-800";
      case "completed":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary-accent" />
      </div>
    );
  }

  if (!authorized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-primary-fg mb-2">Access Denied</h1>
          <p className="text-primary-muted">This page is only accessible to administrators.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-primary-fg">Event Financial Scenarios</h1>
          <p className="text-primary-muted mt-1">Live tracking of all event financial scenarios</p>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => fetchEvents()}
            disabled={refreshing}
            className="btn-primary flex items-center gap-2 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
          <div className="text-xs text-primary-muted">
            Last updated: {lastRefresh.toLocaleTimeString()}
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="card p-4">
        <div className="flex items-center gap-4">
          <Filter className="h-4 w-4 text-primary-muted" />
          <label className="text-sm font-medium text-primary-fg">Filter by Status:</label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-primary-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-accent bg-primary-bg text-primary-fg"
          >
            <option value="all">All Events</option>
            <option value="upcoming">Upcoming</option>
            <option value="ongoing">Ongoing</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </div>

      {/* Events List */}
      {filteredEvents.length === 0 ? (
        <div className="card p-8 text-center">
          <p className="text-primary-muted">No events found.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredEvents.map((event) => {
            const isExpanded = expandedEvents.has(event.id);
            const isLoadingCalc = loadingCalculations.has(event.id);
            const hasCalculations = !!event.calculations;

            return (
              <div key={event.id} className="card">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          toggleEventExpanded(event.id);
                        }}
                        className="p-1 hover:bg-primary-bg rounded transition-colors"
                        aria-label={isExpanded ? "Collapse" : "Expand"}
                      >
                        {isExpanded ? (
                          <ChevronUp className="h-5 w-5 text-primary-muted" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-primary-muted" />
                        )}
                      </button>
                      <h2 className="text-xl font-semibold text-primary-fg">{event.title}</h2>
                    </div>
                    <div className="flex items-center gap-4 mt-2 ml-7">
                      <span className={`text-xs px-2 py-1 rounded ${getStatusColor(event.status)}`}>
                        {event.status}
                      </span>
                      <span className="text-sm text-primary-muted">
                        {new Date(event.startDate).toLocaleDateString()}
                      </span>
                      {!event.published && (
                        <span className="text-xs px-2 py-1 rounded bg-yellow-100 text-yellow-800">
                          Draft
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => router.push(`/events/manage`)}
                    className="btn-secondary flex items-center gap-2 text-sm"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Manage Event
                  </button>
                </div>

              {/* Live Metrics - Accordion */}
              {event.liveMetrics && (
                <div className="mb-6">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      toggleMetricsExpanded(event.id);
                    }}
                    className="w-full flex items-center justify-between p-4 bg-primary-bg/50 hover:bg-primary-bg rounded-lg border border-primary-border transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <TrendingUp className="h-5 w-5 text-primary-accent" />
                      <div className="text-left">
                        <div className="font-semibold text-primary-fg">Live Financial Metrics</div>
                        <div className="text-xs text-primary-muted mt-0.5">
                          {event.liveMetrics.ticketsSold} tickets sold • {formatCurrency(event.liveMetrics.actualRevenue)} revenue
                        </div>
                      </div>
                    </div>
                    {expandedMetrics.has(event.id) ? (
                      <ChevronUp className="h-5 w-5 text-primary-muted" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-primary-muted" />
                    )}
                  </button>
                  
                  {expandedMetrics.has(event.id) && (
                    <div className="mt-3 grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="border border-primary-border rounded-lg p-4">
                        <div className="text-sm text-primary-muted mb-1">Tickets Sold</div>
                        <div className="text-2xl font-bold text-primary-fg">
                          {event.liveMetrics.ticketsSold} / {event.liveMetrics.totalCapacity}
                        </div>
                        <div className="text-xs text-primary-muted mt-1">
                          {event.liveMetrics.capacityUtilization.toFixed(1)}% capacity
                        </div>
                      </div>
                      <div className="border border-primary-border rounded-lg p-4">
                        <div className="text-sm text-primary-muted mb-1">Revenue</div>
                        <div className="text-2xl font-bold text-primary-fg">
                          {formatCurrency(event.liveMetrics.actualRevenue)}
                        </div>
                        <div className="text-xs text-primary-muted mt-1">
                          Projected: {formatCurrency(event.liveMetrics.projectedRevenue)}
                        </div>
                      </div>
                      <div className="border border-primary-border rounded-lg p-4">
                        <div className="text-sm text-primary-muted mb-1">Profit</div>
                        <div
                          className={`text-2xl font-bold ${
                            event.liveMetrics.actualProfit >= 0 ? "text-green-600" : "text-red-600"
                          }`}
                        >
                          {formatCurrency(event.liveMetrics.actualProfit)}
                        </div>
                        <div className="text-xs text-primary-muted mt-1">
                          Projected: {formatCurrency(event.liveMetrics.projectedProfit)}
                        </div>
                      </div>
                      <div className="border border-primary-border rounded-lg p-4">
                        <div className="text-sm text-primary-muted mb-1">Performance</div>
                        <div
                          className={`text-2xl font-bold ${
                            event.liveMetrics.actualRevenue >= event.liveMetrics.projectedRevenue
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          {event.liveMetrics.projectedRevenue > 0
                            ? (
                                (event.liveMetrics.actualRevenue / event.liveMetrics.projectedRevenue) *
                                100
                              ).toFixed(1)
                            : 0}
                          %
                        </div>
                        <div className="text-xs text-primary-muted mt-1">vs Projection</div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Financial Calculations - Accordion Content */}
              {isExpanded && (
                <div className="mt-6 pt-6 border-t border-primary-border">
                  {isLoadingCalc ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-6 w-6 animate-spin text-primary-accent mr-3" />
                      <span className="text-primary-muted">Loading financial calculations...</span>
                    </div>
                  ) : hasCalculations ? (
                    <>
                      {/* Summary Cards */}
                      {event.calculations && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                          <div>
                            <div className="text-sm text-primary-muted mb-1">Total Expenses</div>
                            <div className="text-lg font-semibold text-primary-fg">
                              {formatCurrency(event.calculations.expenses.totalExpenses)}
                            </div>
                          </div>
                          <div>
                            <div className="text-sm text-primary-muted mb-1 flex items-center gap-1">
                              Total Income
                              <div className="group relative">
                                <Info className="h-3 w-3 cursor-help text-primary-muted" />
                                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block z-10">
                                  <div className="bg-primary-fg text-primary-bg text-xs rounded-lg p-3 shadow-lg min-w-[200px]">
                                    <div className="font-semibold mb-2">Income Breakdown:</div>
                                    <div className="space-y-1">
                                      <div className="flex justify-between">
                                        <span>Ticket Income:</span>
                                        <span className="font-medium">{formatCurrency(event.calculations.income.ticketIncome)}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span>Sponsor Income:</span>
                                        <span className="font-medium">{formatCurrency(event.calculations.income.sponsorIncome)}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span>Other Income:</span>
                                        <span className="font-medium">{formatCurrency(event.calculations.income.otherIncome)}</span>
                                      </div>
                                      <div className="border-t border-primary-bg/20 pt-1 mt-1 flex justify-between font-semibold">
                                        <span>Total:</span>
                                        <span>{formatCurrency(event.calculations.income.totalIncome)}</span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className="text-lg font-semibold text-primary-fg">
                              {formatCurrency(event.calculations.income.totalIncome)}
                            </div>
                          </div>
                          <div>
                            <div className="text-sm text-primary-muted mb-1">Profit Margin</div>
                            <div
                              className={`text-lg font-semibold ${
                                event.calculations.profit.profitMargin >= 0
                                  ? "text-green-600"
                                  : "text-red-600"
                              }`}
                            >
                              {event.calculations.profit.profitMargin.toFixed(2)}%
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Subscriber Limits Breakdown - Accordion */}
                      {event.calculations?.subscriberLimitsBreakdown && event.calculations.subscriberLimitsBreakdown.enabled && (
                        <div className="mt-6 pt-6 border-t border-primary-border">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              toggleSectionExpanded(event.id, 'subscriber-limits');
                            }}
                            className="w-full flex items-center justify-between p-4 bg-primary-bg/50 hover:bg-primary-bg rounded-lg border border-primary-border transition-colors mb-4"
                          >
                            <h3 className="text-lg font-semibold text-primary-fg">Subscriber Free Tickets</h3>
                            {isSectionExpanded(event.id, 'subscriber-limits') ? (
                              <ChevronUp className="h-5 w-5 text-primary-muted" />
                            ) : (
                              <ChevronDown className="h-5 w-5 text-primary-muted" />
                            )}
                          </button>
                          
                          {isSectionExpanded(event.id, 'subscriber-limits') && (
                          <div className="bg-primary-bg/50 rounded-lg p-4">
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
                              <div>
                                <div className="text-xs text-primary-muted mb-1">Premium</div>
                                <div className="text-sm font-semibold text-primary-fg">
                                  {event.calculations.subscriberLimitsBreakdown.premium.used} / {event.calculations.subscriberLimitsBreakdown.premium.limit}
                                </div>
                                <div className="text-xs text-primary-muted mt-1">
                                  {event.calculations.subscriberLimitsBreakdown.premium.limit > 0
                                    ? `${Math.round((event.calculations.subscriberLimitsBreakdown.premium.used / event.calculations.subscriberLimitsBreakdown.premium.limit) * 100)}% used`
                                    : 'Not set'}
                                </div>
                              </div>
                              <div>
                                <div className="text-xs text-primary-muted mb-1">Diamond</div>
                                <div className="text-sm font-semibold text-primary-fg">
                                  {event.calculations.subscriberLimitsBreakdown.diamond.used} / {event.calculations.subscriberLimitsBreakdown.diamond.limit}
                                </div>
                                <div className="text-xs text-primary-muted mt-1">
                                  {event.calculations.subscriberLimitsBreakdown.diamond.limit > 0
                                    ? `${Math.round((event.calculations.subscriberLimitsBreakdown.diamond.used / event.calculations.subscriberLimitsBreakdown.diamond.limit) * 100)}% used`
                                    : 'Not set'}
                                </div>
                              </div>
                              <div>
                                <div className="text-xs text-primary-muted mb-1">Exclusive Black</div>
                                <div className="text-sm font-semibold text-primary-fg">
                                  {event.calculations.subscriberLimitsBreakdown.exclusiveBlack.used} / {event.calculations.subscriberLimitsBreakdown.exclusiveBlack.limit}
                                </div>
                                <div className="text-xs text-primary-muted mt-1">
                                  {event.calculations.subscriberLimitsBreakdown.exclusiveBlack.limit > 0
                                    ? `${Math.round((event.calculations.subscriberLimitsBreakdown.exclusiveBlack.used / event.calculations.subscriberLimitsBreakdown.exclusiveBlack.limit) * 100)}% used`
                                    : 'Not set'}
                                </div>
                              </div>
                              <div>
                                <div className="text-xs text-primary-muted mb-1">Student</div>
                                <div className="text-sm font-semibold text-primary-fg">
                                  {event.calculations.subscriberLimitsBreakdown.student.used} / {event.calculations.subscriberLimitsBreakdown.student.limit}
                                </div>
                                <div className="text-xs text-primary-muted mt-1">
                                  {event.calculations.subscriberLimitsBreakdown.student.limit > 0
                                    ? `${Math.round((event.calculations.subscriberLimitsBreakdown.student.used / event.calculations.subscriberLimitsBreakdown.student.limit) * 100)}% used`
                                    : 'Not set'}
                                </div>
                              </div>
                              <div>
                                <div className="text-xs text-primary-muted mb-1">Total Free</div>
                                <div className="text-sm font-semibold text-primary-fg">
                                  {event.calculations.subscriberLimitsBreakdown.total.used} / {event.calculations.subscriberLimitsBreakdown.total.limit}
                                </div>
                                <div className="text-xs text-primary-muted mt-1">
                                  {event.calculations.subscriberLimitsBreakdown.total.limit > 0
                                    ? `${Math.round((event.calculations.subscriberLimitsBreakdown.total.used / event.calculations.subscriberLimitsBreakdown.total.limit) * 100)}% used`
                                    : 'Not set'}
                                </div>
                              </div>
                            </div>
                            <div className="text-xs text-primary-muted pt-3 border-t border-primary-border">
                              <p>
                                <strong>{event.calculations.subscriberLimitsBreakdown.total.used} of {event.calculations.subscriberLimitsBreakdown.total.limit}</strong> free tickets have been claimed. 
                                These free tickets are excluded from paid capacity calculations, 
                                reducing expected ticket income by approximately {formatCurrency(
                                  event.calculations.subscriberLimitsBreakdown.total.limit * 
                                  (event.calculations.income.ticketIncome / 
                                   Math.max(1, (event.financials?.capacity || 0) - event.calculations.subscriberLimitsBreakdown.total.limit))
                                )} (estimated based on average ticket price).
                              </p>
                            </div>
                          </div>
                          )}
                        </div>
                      )}

                      {/* Ticket Type Based Scenarios - Accordion */}
                      {event.calculations?.suggestions?.ticketTypeScenarios && event.calculations.suggestions.ticketTypeScenarios.length > 0 ? (
                        <div className={event.calculations?.subscriberLimitsBreakdown && event.calculations.subscriberLimitsBreakdown.enabled ? "mt-6 pt-6 border-t border-primary-border" : ""}>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              toggleSectionExpanded(event.id, 'ticket-type-scenarios');
                            }}
                            className="w-full flex items-center justify-between p-4 bg-primary-bg/50 hover:bg-primary-bg rounded-lg border border-primary-border transition-colors mb-4"
                          >
                            <h3 className="text-lg font-semibold text-primary-fg">Ticket Type Scenarios</h3>
                            {isSectionExpanded(event.id, 'ticket-type-scenarios') ? (
                              <ChevronUp className="h-5 w-5 text-primary-muted" />
                            ) : (
                              <ChevronDown className="h-5 w-5 text-primary-muted" />
                            )}
                          </button>
                          
                          {isSectionExpanded(event.id, 'ticket-type-scenarios') && (
                          <div className="space-y-4">
                            {event.calculations.suggestions.ticketTypeScenarios.map((scenario, idx) => (
                      <div key={idx} className="border border-primary-border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h4 className="font-semibold text-primary-fg">{scenario.scenarioName}</h4>
                            <p className="text-sm text-primary-muted mt-1">{scenario.description}</p>
                          </div>
                          <div className="text-right">
                            <div className="text-xs text-primary-muted mb-1">Profit Margin</div>
                            <div
                              className={`text-lg font-bold ${
                                scenario.profitMargin >= 0 ? "text-green-600" : "text-red-600"
                              }`}
                            >
                              {scenario.profitMargin.toFixed(2)}%
                            </div>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                          <div>
                            <div className="text-xs text-primary-muted mb-1">Total Sold</div>
                            <div className="text-sm font-semibold text-primary-fg">
                              {scenario.totalSold} / {scenario.totalCapacity}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-primary-muted mb-1">Expected Income</div>
                            <div className="text-sm font-semibold text-primary-fg">
                              {formatCurrency(scenario.expectedIncome)}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-primary-muted mb-1">Expected Profit</div>
                            <div
                              className={`text-sm font-semibold ${
                                scenario.expectedProfit >= 0 ? "text-green-600" : "text-red-600"
                              }`}
                            >
                              {formatCurrency(scenario.expectedProfit)}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-primary-muted mb-1">Utilization</div>
                            <div className="text-sm font-semibold text-primary-fg">
                              {scenario.totalCapacity > 0
                                ? ((scenario.totalSold / scenario.totalCapacity) * 100).toFixed(1)
                                : 0}%
                            </div>
                          </div>
                        </div>

                        <div className="mt-3 pt-3 border-t border-primary-border">
                          <div className="text-xs text-primary-muted mb-2">Ticket Type Breakdown:</div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                            {scenario.ticketTypeBreakdown.map((tt, ttIdx) => (
                              <div key={ttIdx} className="bg-primary-bg/50 p-2 rounded">
                                <div className="font-medium text-primary-fg">{tt.ticketTypeName}</div>
                                <div className="text-primary-muted">
                                  {tt.sold}/{tt.capacity} sold
                                </div>
                                <div className="text-primary-fg font-semibold">
                                  {formatCurrency(tt.revenue)}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                          )}
                        </div>
                      ) : null}

                      {/* Traditional Price/Capacity Scenarios - Accordion */}
                      {event.calculations?.suggestions?.scenarios && event.calculations.suggestions.scenarios.length > 0 ? (
                        <div className={event.calculations?.suggestions?.ticketTypeScenarios ? "mt-6 pt-6 border-t border-primary-border" : ""}>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              toggleSectionExpanded(event.id, 'price-capacity-scenarios');
                            }}
                            className="w-full flex items-center justify-between p-4 bg-primary-bg/50 hover:bg-primary-bg rounded-lg border border-primary-border transition-colors mb-4"
                          >
                            <h3 className="text-lg font-semibold text-primary-fg">Price & Capacity Scenarios</h3>
                            {isSectionExpanded(event.id, 'price-capacity-scenarios') ? (
                              <ChevronUp className="h-5 w-5 text-primary-muted" />
                            ) : (
                              <ChevronDown className="h-5 w-5 text-primary-muted" />
                            )}
                          </button>
                          
                          {isSectionExpanded(event.id, 'price-capacity-scenarios') && (
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="border-b border-primary-border">
                                  <th className="text-left py-2 px-2 text-primary-muted">Price</th>
                                  <th className="text-left py-2 px-2 text-primary-muted">Capacity</th>
                                  <th className="text-right py-2 px-2 text-primary-muted">Income</th>
                                  <th className="text-right py-2 px-2 text-primary-muted">Profit</th>
                                  <th className="text-right py-2 px-2 text-primary-muted">Margin %</th>
                                </tr>
                              </thead>
                              <tbody>
                                {event.calculations.suggestions.scenarios.map((scenario, idx) => (
                                  <tr key={idx} className="border-b border-primary-border">
                                    <td className="py-2 px-2 text-primary-fg">
                                      {formatCurrency(scenario.price)}
                                    </td>
                                    <td className="py-2 px-2 text-primary-fg">{scenario.capacity}</td>
                                    <td className="py-2 px-2 text-right text-primary-fg">
                                      {formatCurrency(scenario.expectedIncome)}
                                    </td>
                                    <td
                                      className={`py-2 px-2 text-right ${
                                        scenario.expectedProfit >= 0 ? "text-green-600" : "text-red-600"
                                      }`}
                                    >
                                      {formatCurrency(scenario.expectedProfit)}
                                    </td>
                                    <td
                                      className={`py-2 px-2 text-right ${
                                        scenario.profitMargin >= 0 ? "text-green-600" : "text-red-600"
                                      }`}
                                    >
                                      {scenario.profitMargin.toFixed(2)}%
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                          )}
                        </div>
                      ) : (
                        !event.calculations?.suggestions?.ticketTypeScenarios && (
                          <div className="text-center py-8 text-primary-muted">
                            <p>No financial scenarios available. Configure financial planning for this event.</p>
                          </div>
                        )
                      )}

                      {/* Expenses Breakdown - Accordion */}
                      {event.calculations && event.calculations.expenses && (
                        <div className="mt-6 pt-6 border-t border-primary-border">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              toggleSectionExpanded(event.id, 'expenses');
                            }}
                            className="w-full flex items-center justify-between p-4 bg-primary-bg/50 hover:bg-primary-bg rounded-lg border border-primary-border transition-colors mb-4"
                          >
                            <h3 className="text-lg font-semibold text-primary-fg">Expenses Breakdown</h3>
                            {isSectionExpanded(event.id, 'expenses') ? (
                              <ChevronUp className="h-5 w-5 text-primary-muted" />
                            ) : (
                              <ChevronDown className="h-5 w-5 text-primary-muted" />
                            )}
                          </button>
                          
                          {isSectionExpanded(event.id, 'expenses') && (
                          <div className="space-y-3">
                            {event.calculations.expenses.breakdown && (
                              <>
                                {event.calculations.expenses.breakdown.fixed && event.calculations.expenses.breakdown.fixed.length > 0 && (
                                  <div>
                                    <div className="text-sm font-medium text-primary-muted mb-2">Fixed Expenses</div>
                                    <div className="space-y-1">
                                      {event.calculations.expenses.breakdown.fixed.map((expense: any, idx: number) => (
                                        <div key={idx} className="flex justify-between text-sm">
                                          <span className="text-primary-fg">{expense.name}</span>
                                          <span className="text-primary-fg font-medium">{formatCurrency(expense.amount)}</span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                                {event.calculations.expenses.breakdown.perPerson && event.calculations.expenses.breakdown.perPerson.length > 0 && (
                                  <div>
                                    <div className="text-sm font-medium text-primary-muted mb-2">Per-Person Expenses</div>
                                    <div className="space-y-1">
                                      {event.calculations.expenses.breakdown.perPerson.map((expense: any, idx: number) => (
                                        <div key={idx} className="flex justify-between text-sm">
                                          <span className="text-primary-fg">{expense.name} ({expense.invitees} invitees)</span>
                                          <span className="text-primary-fg font-medium">{formatCurrency(expense.amount)}</span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                                {event.calculations.expenses.breakdown.percentage && event.calculations.expenses.breakdown.percentage.length > 0 && (
                                  <div>
                                    <div className="text-sm font-medium text-primary-muted mb-2">Percentage Expenses</div>
                                    <div className="space-y-1">
                                      {event.calculations.expenses.breakdown.percentage.map((expense: any, idx: number) => (
                                        <div key={idx} className="flex justify-between text-sm">
                                          <span className="text-primary-fg">{expense.name} ({expense.percentage}%)</span>
                                          <span className="text-primary-fg font-medium">{formatCurrency(expense.amount)}</span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </>
                            )}
                            <div className="pt-3 border-t border-primary-border">
                              <div className="flex justify-between">
                                <span className="text-sm font-semibold text-primary-fg">Total Expenses</span>
                                <span className="text-sm font-semibold text-primary-fg">
                                  {formatCurrency(event.calculations.expenses.totalExpenses)}
                                </span>
                              </div>
                            </div>
                          </div>
                          )}
                        </div>
                      )}

                      {/* Ticket Types Breakdown - Accordion */}
                      {event.calculations?.income?.ticketTypeBreakdown && event.calculations.income.ticketTypeBreakdown.length > 0 && (
                        <div className="mt-6 pt-6 border-t border-primary-border">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              toggleSectionExpanded(event.id, 'ticket-types');
                            }}
                            className="w-full flex items-center justify-between p-4 bg-primary-bg/50 hover:bg-primary-bg rounded-lg border border-primary-border transition-colors mb-4"
                          >
                            <h3 className="text-lg font-semibold text-primary-fg">Ticket Types Breakdown</h3>
                            {isSectionExpanded(event.id, 'ticket-types') ? (
                              <ChevronUp className="h-5 w-5 text-primary-muted" />
                            ) : (
                              <ChevronDown className="h-5 w-5 text-primary-muted" />
                            )}
                          </button>
                          
                          {isSectionExpanded(event.id, 'ticket-types') && (
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="border-b border-primary-border">
                                  <th className="text-left py-2 px-2 text-primary-muted">Ticket Type</th>
                                  <th className="text-right py-2 px-2 text-primary-muted">Price</th>
                                  <th className="text-right py-2 px-2 text-primary-muted">Capacity</th>
                                  <th className="text-right py-2 px-2 text-primary-muted">Sold</th>
                                  <th className="text-right py-2 px-2 text-primary-muted">Available</th>
                                  <th className="text-right py-2 px-2 text-primary-muted">Revenue</th>
                                  <th className="text-right py-2 px-2 text-primary-muted">% of Total</th>
                                </tr>
                              </thead>
                              <tbody>
                                {event.calculations.income.ticketTypeBreakdown.map((ticketType) => (
                                  <tr key={ticketType.id} className="border-b border-primary-border">
                                    <td className="py-2 px-2 text-primary-fg font-medium">{ticketType.name}</td>
                                    <td className="py-2 px-2 text-right text-primary-fg">
                                      {formatCurrency(ticketType.price)}
                                    </td>
                                    <td className="py-2 px-2 text-right text-primary-fg">{ticketType.capacity}</td>
                                    <td className="py-2 px-2 text-right text-primary-fg">{ticketType.sold}</td>
                                    <td className="py-2 px-2 text-right text-primary-fg">{ticketType.available}</td>
                                    <td className="py-2 px-2 text-right text-primary-fg font-semibold">
                                      {formatCurrency(ticketType.revenue)}
                                    </td>
                                    <td className="py-2 px-2 text-right text-primary-muted">
                                      {ticketType.revenuePercentage.toFixed(1)}%
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                              <tfoot>
                                <tr className="border-t-2 border-primary-border font-semibold">
                                  <td className="py-2 px-2 text-primary-fg">Total</td>
                                  <td className="py-2 px-2 text-right text-primary-fg">-</td>
                                  <td className="py-2 px-2 text-right text-primary-fg">
                                    {event.calculations.income.ticketTypeBreakdown.reduce((sum, tt) => sum + tt.capacity, 0)}
                                  </td>
                                  <td className="py-2 px-2 text-right text-primary-fg">
                                    {event.calculations.income.ticketTypeBreakdown.reduce((sum, tt) => sum + tt.sold, 0)}
                                  </td>
                                  <td className="py-2 px-2 text-right text-primary-fg">
                                    {event.calculations.income.ticketTypeBreakdown.reduce((sum, tt) => sum + tt.available, 0)}
                                  </td>
                                  <td className="py-2 px-2 text-right text-primary-fg">
                                    {formatCurrency(event.calculations.income.ticketIncome)}
                                  </td>
                                  <td className="py-2 px-2 text-right text-primary-fg">100%</td>
                                </tr>
                              </tfoot>
                            </table>
                          </div>
                          )}
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-8 text-primary-muted">
                      <p>Click to expand and load financial calculations.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
