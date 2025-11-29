"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Users, Mail, Phone, Calendar, TrendingUp, Search, ChevronDown, ChevronUp, Filter, X, Wallet, ShoppingCart, UserPlus, DollarSign, CheckCircle2 } from "lucide-react";
import { authenticatedFetch, getTeamSession } from "@/lib/auth-utils";
import { format } from "date-fns";

interface UniversalDownlineUser {
  id: string;
  email: string;
  fullName: string;
  phone: string | null;
  roleName: string;
  createdAt: string;
  referralCode: string | null;
  partnerCode: string | null; // The referral code that referred this user
  totalSignups: number;
  totalCheckouts: number;
  totalEarnings: string;
  pendingEarnings: string;
}

interface CategoryStats {
  totalUsers: number;
  totalSignups: number;
  totalCheckouts: number;
  totalEarnings: number;
  pendingEarnings: number;
}

interface UniversalDownlineData {
  categories: Record<string, UniversalDownlineUser[]>;
  categoryStats: Record<string, CategoryStats>;
  uniquePartnerCodes: string[];
  totalUsers: number;
}

export default function UniversalDownlinePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<UniversalDownlineData | null>(null);
  
  // Filter states - initialize from URL params
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || "");
  const [roleFilter, setRoleFilter] = useState<string>(searchParams.get('role') || "");
  const [partnerCodeFilter, setPartnerCodeFilter] = useState<string>(searchParams.get('partnerCode') || "");
  const [dateFrom, setDateFrom] = useState<string>(searchParams.get('dateFrom') || "");
  const [dateTo, setDateTo] = useState<string>(searchParams.get('dateTo') || "");
  const [minCheckouts, setMinCheckouts] = useState<string>(searchParams.get('minCheckouts') || "");
  const [maxCheckouts, setMaxCheckouts] = useState<string>(searchParams.get('maxCheckouts') || "");
  const [minEarnings, setMinEarnings] = useState<string>(searchParams.get('minEarnings') || "");
  const [maxEarnings, setMaxEarnings] = useState<string>(searchParams.get('maxEarnings') || "");
  const [showFilters, setShowFilters] = useState(false);
  
  // Accordion state for categories
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [expandAll, setExpandAll] = useState(false);

  const toggleCategoryExpanded = (category: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(category)) {
        newSet.delete(category);
      } else {
        newSet.add(category);
      }
      return newSet;
    });
  };

  const toggleExpandAll = () => {
    if (expandAll) {
      setExpandedCategories(new Set());
      setExpandAll(false);
    } else {
      const allCategories = data ? Object.keys(data.categories) : [];
      setExpandedCategories(new Set(allCategories));
      setExpandAll(true);
    }
  };

  // Update URL params when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (searchQuery) params.set('search', searchQuery);
    if (roleFilter) params.set('role', roleFilter);
    if (partnerCodeFilter) params.set('partnerCode', partnerCodeFilter);
    if (dateFrom) params.set('dateFrom', dateFrom);
    if (dateTo) params.set('dateTo', dateTo);
    if (minCheckouts) params.set('minCheckouts', minCheckouts);
    if (maxCheckouts) params.set('maxCheckouts', maxCheckouts);
    if (minEarnings) params.set('minEarnings', minEarnings);
    if (maxEarnings) params.set('maxEarnings', maxEarnings);
    
    const newUrl = params.toString() ? `?${params.toString()}` : window.location.pathname;
    router.replace(newUrl, { scroll: false });
  }, [searchQuery, roleFilter, partnerCodeFilter, dateFrom, dateTo, minCheckouts, maxCheckouts, minEarnings, maxEarnings, router]);


  const fetchUniversalDownline = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://talaash.thejaayveeworld.com';
      const params = new URLSearchParams();
      
      if (roleFilter) params.append('role', roleFilter);
      if (partnerCodeFilter) params.append('partnerCode', partnerCodeFilter);
      if (searchQuery) params.append('search', searchQuery);
      if (dateFrom) params.append('dateFrom', dateFrom);
      if (dateTo) params.append('dateTo', dateTo);
      if (minCheckouts) params.append('minCheckouts', minCheckouts);
      if (maxCheckouts) params.append('maxCheckouts', maxCheckouts);
      if (minEarnings) params.append('minEarnings', minEarnings);
      if (maxEarnings) params.append('maxEarnings', maxEarnings);

      const url = `${API_BASE_URL}/api/team/universal-downline?${params.toString()}`;
      const response = await authenticatedFetch(url);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch universal downline: ${response.status} ${errorText}`);
      }

      const result = await response.json();
      if (result.success) {
        setData(result.data);
        // Auto-expand all categories on first load
        if (expandedCategories.size === 0 && !expandAll) {
          const allCategories = Object.keys(result.data.categories);
          setExpandedCategories(new Set(allCategories));
        }
      } else {
        setError(result.error || 'Failed to fetch universal downline');
      }
    } catch (err: any) {
      console.error('Error fetching universal downline:', err);
      setError(err.message || 'Failed to fetch universal downline');
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setSearchQuery("");
    setRoleFilter("");
    setPartnerCodeFilter("");
    setDateFrom("");
    setDateTo("");
    setMinCheckouts("");
    setMaxCheckouts("");
    setMinEarnings("");
    setMaxEarnings("");
  };

  const hasActiveFilters = searchQuery || roleFilter || partnerCodeFilter || dateFrom || dateTo || minCheckouts || maxCheckouts || minEarnings || maxEarnings;

  // Get unique roles from data
  const availableRoles = useMemo(() => {
    if (!data) return [];
    return Array.from(new Set(Object.keys(data.categories))).sort();
  }, [data]);

  if (loading) {
    return (
      <div className="min-h-screen bg-primary-bg flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary-accent border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-2 text-primary-muted">Loading universal downline...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-primary-bg flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={fetchUniversalDownline}
            className="px-4 py-2 bg-primary-accent text-white rounded-lg hover:bg-primary-accent/90"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-primary-bg flex items-center justify-center">
        <div className="text-center">
          <p className="text-primary-muted">No data available</p>
        </div>
      </div>
    );
  }

  const categories = Object.keys(data.categories).sort();

  return (
    <div className="min-h-screen bg-primary-bg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-6 w-6 text-primary-fg" />
            <h1 className="text-2xl font-bold text-primary-fg">Universal Downline</h1>
            <span className="px-3 py-1 bg-primary-accent/10 text-primary-accent rounded-full text-sm font-medium">
              {data.totalUsers} Users
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-4 py-2 border border-primary-border rounded-lg bg-white text-primary-fg hover:bg-primary-bg transition-colors flex items-center gap-2 ${
                showFilters ? 'bg-primary-accent/10 border-primary-accent' : ''
              }`}
            >
              <Filter className="h-4 w-4" />
              Filters
              {hasActiveFilters && (
                <span className="px-2 py-0.5 bg-primary-accent text-white rounded-full text-xs">
                  {[searchQuery, roleFilter, partnerCodeFilter, dateFrom, dateTo, minCheckouts, maxCheckouts, minEarnings, maxEarnings].filter(Boolean).length}
                </span>
              )}
            </button>
            <button
              onClick={toggleExpandAll}
              className="px-4 py-2 border border-primary-border rounded-lg bg-white text-primary-fg hover:bg-primary-bg transition-colors whitespace-nowrap"
            >
              {expandAll ? 'Collapse All' : 'Expand All'}
            </button>
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="card mb-6">
            <div className="p-4 border-b border-primary-border flex items-center justify-between">
              <h3 className="font-semibold text-primary-fg">Filters</h3>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="text-sm text-primary-accent hover:underline flex items-center gap-1"
                >
                  <X className="h-4 w-4" />
                  Clear All
                </button>
              )}
            </div>
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Search */}
              <div className="lg:col-span-3">
                <label className="block text-sm font-medium text-primary-fg mb-2">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-primary-muted" />
                  <input
                    type="text"
                    placeholder="Search by name, email, phone, or referral code..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-primary-border rounded-lg bg-white text-primary-fg focus:outline-none focus:ring-2 focus:ring-primary-accent"
                  />
                </div>
              </div>

              {/* Role Filter */}
              <div>
                <label className="block text-sm font-medium text-primary-fg mb-2">Category/Role</label>
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="w-full px-4 py-2 border border-primary-border rounded-lg bg-white text-primary-fg focus:outline-none focus:ring-2 focus:ring-primary-accent"
                >
                  <option value="">All Categories</option>
                  {availableRoles.map((role) => (
                    <option key={role} value={role}>
                      {role.charAt(0).toUpperCase() + role.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Partner Code Filter */}
              <div>
                <label className="block text-sm font-medium text-primary-fg mb-2">Partner Code</label>
                <select
                  value={partnerCodeFilter}
                  onChange={(e) => setPartnerCodeFilter(e.target.value)}
                  className="w-full px-4 py-2 border border-primary-border rounded-lg bg-white text-primary-fg focus:outline-none focus:ring-2 focus:ring-primary-accent"
                >
                  <option value="">All Partner Codes</option>
                  {data.uniquePartnerCodes.map((code) => (
                    <option key={code} value={code}>
                      {code}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date From */}
              <div>
                <label className="block text-sm font-medium text-primary-fg mb-2">Date From</label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-full px-4 py-2 border border-primary-border rounded-lg bg-white text-primary-fg focus:outline-none focus:ring-2 focus:ring-primary-accent"
                />
              </div>

              {/* Date To */}
              <div>
                <label className="block text-sm font-medium text-primary-fg mb-2">Date To</label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-full px-4 py-2 border border-primary-border rounded-lg bg-white text-primary-fg focus:outline-none focus:ring-2 focus:ring-primary-accent"
                />
              </div>

              {/* Min Checkouts */}
              <div>
                <label className="block text-sm font-medium text-primary-fg mb-2">Min Checkouts</label>
                <input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={minCheckouts}
                  onChange={(e) => setMinCheckouts(e.target.value)}
                  className="w-full px-4 py-2 border border-primary-border rounded-lg bg-white text-primary-fg focus:outline-none focus:ring-2 focus:ring-primary-accent"
                />
              </div>

              {/* Max Checkouts */}
              <div>
                <label className="block text-sm font-medium text-primary-fg mb-2">Max Checkouts</label>
                <input
                  type="number"
                  min="0"
                  placeholder="Any"
                  value={maxCheckouts}
                  onChange={(e) => setMaxCheckouts(e.target.value)}
                  className="w-full px-4 py-2 border border-primary-border rounded-lg bg-white text-primary-fg focus:outline-none focus:ring-2 focus:ring-primary-accent"
                />
              </div>

              {/* Min Earnings */}
              <div>
                <label className="block text-sm font-medium text-primary-fg mb-2">Min Earnings (₹)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={minEarnings}
                  onChange={(e) => setMinEarnings(e.target.value)}
                  className="w-full px-4 py-2 border border-primary-border rounded-lg bg-white text-primary-fg focus:outline-none focus:ring-2 focus:ring-primary-accent"
                />
              </div>

              {/* Max Earnings */}
              <div>
                <label className="block text-sm font-medium text-primary-fg mb-2">Max Earnings (₹)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Any"
                  value={maxEarnings}
                  onChange={(e) => setMaxEarnings(e.target.value)}
                  className="w-full px-4 py-2 border border-primary-border rounded-lg bg-white text-primary-fg focus:outline-none focus:ring-2 focus:ring-primary-accent"
                />
              </div>
            </div>
          </div>
        )}

        {/* Categories Accordion */}
        <div className="space-y-4">
          {categories.length === 0 ? (
            <div className="card">
              <div className="p-12 text-center">
                <Users className="h-12 w-12 text-primary-muted mx-auto mb-4" />
                <p className="text-primary-muted">No users found</p>
              </div>
            </div>
          ) : (
            categories.map((category) => {
              const users = data.categories[category];
              const stats = data.categoryStats[category];
              const isExpanded = expandedCategories.has(category) || expandAll;

              return (
                <div key={category} className="card">
                  {/* Category Header */}
                  <button
                    onClick={() => toggleCategoryExpanded(category)}
                    className="w-full p-6 flex items-center justify-between hover:bg-primary-bg/50 transition-colors"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      {isExpanded ? (
                        <ChevronUp className="h-5 w-5 text-primary-accent" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-primary-muted" />
                      )}
                      <div className="flex-1 text-left">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-semibold text-primary-fg">
                            {category.charAt(0).toUpperCase() + category.slice(1)}
                          </h3>
                          <span className="px-3 py-1 bg-primary-accent/10 text-primary-accent rounded-full text-sm font-medium">
                            {stats.totalUsers} {stats.totalUsers === 1 ? 'User' : 'Users'}
                          </span>
                        </div>
                        {/* Category Stats */}
                        <div className="flex items-center gap-6 text-sm text-primary-muted">
                          <div className="flex items-center gap-1">
                            <UserPlus className="h-4 w-4" />
                            {stats.totalSignups} Signups
                          </div>
                          <div className="flex items-center gap-1">
                            <ShoppingCart className="h-4 w-4" />
                            {stats.totalCheckouts} Checkouts
                          </div>
                          <div className="flex items-center gap-1">
                            <DollarSign className="h-4 w-4" />
                            ₹{stats.totalEarnings.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </div>
                          {stats.pendingEarnings > 0 && (
                            <div className="flex items-center gap-1 text-yellow-600">
                              <Wallet className="h-4 w-4" />
                              ₹{stats.pendingEarnings.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Pending
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>

                  {/* Category Content */}
                  {isExpanded && (
                    <div className="px-6 pb-6 border-t border-primary-border">
                      <div className="pt-4 space-y-3">
                        {users.map((user) => (
                          <div
                            key={user.id}
                            className="p-4 bg-primary-bg/50 rounded-lg border border-primary-border hover:border-primary-accent/30 transition-colors"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <h4 className="font-semibold text-primary-fg">{user.fullName}</h4>
                                  {user.partnerCode && (
                                    <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium border border-green-200">
                                      Partner: {user.partnerCode}
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-4 text-sm text-primary-muted mb-3">
                                  <div className="flex items-center gap-1">
                                    <Mail className="h-3 w-3" />
                                    {user.email}
                                  </div>
                                  {user.phone && (
                                    <div className="flex items-center gap-1">
                                      <Phone className="h-3 w-3" />
                                      {user.phone}
                                    </div>
                                  )}
                                  <div className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    {format(new Date(user.createdAt), "MMM dd, yyyy")}
                                  </div>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                  {user.referralCode && (
                                    <div className="bg-primary-accent/10 p-2 rounded">
                                      <p className="text-xs text-primary-muted mb-1">Referral Code</p>
                                      <p className="text-sm font-mono font-semibold text-primary-accent">
                                        {user.referralCode}
                                      </p>
                                    </div>
                                  )}
                                  <div className="bg-blue-50 p-2 rounded">
                                    <p className="text-xs text-primary-muted mb-1">Signups</p>
                                    <p className="text-sm font-bold text-primary-fg">{user.totalSignups || 0}</p>
                                  </div>
                                  <div className="bg-purple-50 p-2 rounded">
                                    <p className="text-xs text-primary-muted mb-1">Checkouts</p>
                                    <p className="text-sm font-bold text-primary-fg">{user.totalCheckouts || 0}</p>
                                  </div>
                                  <div className="bg-green-50 p-2 rounded">
                                    <p className="text-xs text-primary-muted mb-1">Earnings</p>
                                    <p className="text-sm font-bold text-green-600">
                                      ₹{parseFloat(user.totalEarnings || '0.00').toLocaleString('en-IN', {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2
                                      })}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

