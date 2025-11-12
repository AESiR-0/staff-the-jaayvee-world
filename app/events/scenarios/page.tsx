"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { TrendingUp, BarChart3, RefreshCw, ExternalLink, Loader2, Filter } from "lucide-react";
import { authenticatedFetch, getStaffSession } from "@/lib/auth-utils";
import { isSuperAdmin } from "@/lib/rbac";

interface Event {
  id: string;
  title: string;
  startDate: string;
  endDate: string | null;
  status: string;
  published: boolean;
}

interface FinancialCalculations {
  expenses: {
    totalExpenses: number;
  };
  income: {
    ticketIncome: number;
    sponsorIncome: number;
    otherIncome: number;
    totalIncome: number;
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

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "https://thejaayveeworld.com";

  useEffect(() => {
    const checkAuthorization = async () => {
      const session = getStaffSession();
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
  }, [router]);

  // Auto-refresh every 10 seconds
  useEffect(() => {
    if (!authorized) return;

    const interval = setInterval(() => {
      fetchEvents(true);
    }, 10000); // 10 seconds

    return () => clearInterval(interval);
  }, [authorized]);

  const fetchEvents = async (silent = false) => {
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

      // Fetch financial data and live metrics for each event
      const eventsWithData = await Promise.all(
        eventsList.map(async (event) => {
          const eventData: EventWithData = { ...event };

          try {
            // Fetch financials
            const financialsRes = await authenticatedFetch(
              `${API_BASE_URL}/api/events/${event.id}/financials`
            );
            if (financialsRes.ok) {
              const financialsData = await financialsRes.json();
              if (financialsData.success && financialsData.data?.financials) {
                eventData.financials = financialsData.data.financials;
              }
            }

            // Fetch calculations
            const calcRes = await authenticatedFetch(
              `${API_BASE_URL}/api/events/${event.id}/financials/calculate`
            );
            if (calcRes.ok) {
              const calcData = await calcRes.json();
              if (calcData.success && calcData.data) {
                eventData.calculations = calcData.data;
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
  };

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
          {filteredEvents.map((event) => (
            <div key={event.id} className="card">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-xl font-semibold text-primary-fg">{event.title}</h2>
                  <div className="flex items-center gap-4 mt-2">
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

              {/* Live Metrics */}
              {event.liveMetrics && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
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

              {/* Financial Scenarios */}
              {event.calculations?.suggestions?.scenarios && event.calculations.suggestions.scenarios.length > 0 ? (
                <div>
                  <h3 className="text-lg font-semibold text-primary-fg mb-4">Top Scenarios</h3>
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
                </div>
              ) : (
                <div className="text-center py-8 text-primary-muted">
                  <p>No financial scenarios available. Configure financial planning for this event.</p>
                </div>
              )}

              {/* Expenses Breakdown */}
              {event.calculations && event.calculations.expenses && (
                <div className="mt-6 pt-6 border-t border-primary-border">
                  <h3 className="text-lg font-semibold text-primary-fg mb-4">Expenses Breakdown</h3>
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
                </div>
              )}

              {/* Financial Summary */}
              {event.calculations && (
                <div className="mt-6 pt-6 border-t border-primary-border">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <div className="text-sm text-primary-muted mb-1">Total Expenses</div>
                      <div className="text-lg font-semibold text-primary-fg">
                        {formatCurrency(event.calculations.expenses.totalExpenses)}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-primary-muted mb-1">Total Income</div>
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
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

