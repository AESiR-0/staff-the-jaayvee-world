"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { Users, Mail, Phone, Calendar, TrendingUp, Search, ChevronDown, ChevronUp, Wallet, Award, GitBranch } from "lucide-react";
import { authenticatedFetch, getTeamSession } from "@/lib/auth-utils";
import { format } from "date-fns";

interface DownlineUser {
  userId: string;
  email: string;
  fullName: string;
  phone: string | null;
  role: string;
  createdAt: string;
  code?: string;
  referralCode?: string;
  totalReferrals?: number;
  totalEarnings?: string;
  totalMerchants?: number;
  commissionEarned?: string;
  instagramHandle?: string;
  youtubeHandle?: string;
  tier?: string;
  totalSignups?: number;
  walletBalance?: number;
  walletCurrency?: string;
  downlines?: DownlineUser[]; // Nested downlines
}

interface EarningsUser {
  userId: string;
  userName: string;
  totalEarnings: number;
  creditedEarnings: number;
  pendingEarnings: number;
  ticketCount: number;
  milestoneReached: boolean;
}

interface EarningsBreakdown {
  totalEarnings: number;
  creditedEarnings: number;
  pendingEarnings: number;
  users: EarningsUser[];
}

interface TeamDownline {
  staff: {
    id: string;
    email: string;
    fullName: string;
    referralCode: string | null;
    totalReferrals?: number;
    totalSignups?: number;
    totalClicks?: number;
    commissionRate?: string;
    currentMilestone?: number;
    pendingEarnings?: string;
    commissionEarned?: string;
  } | null;
  downline: DownlineUser[];
  earningsBreakdown?: EarningsBreakdown | null;
}

export default function DownlinePage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<TeamDownline | null>(null);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [allTeam, setAllTeam] = useState<Array<{ id: string; email: string; fullName: string }>>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  
  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  
  // Accordion state for nested downlines
  const [expandedUsers, setExpandedUsers] = useState<Set<string>>(new Set());
  const [expandAll, setExpandAll] = useState(false);

  const toggleUserExpanded = (userId: string) => {
    setExpandedUsers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(userId)) {
        newSet.delete(userId);
      } else {
        newSet.add(userId);
      }
      return newSet;
    });
  };

  // Expand/collapse all downlines
  const toggleExpandAll = () => {
    if (expandAll) {
      setExpandedUsers(new Set());
      setExpandAll(false);
    } else {
      // Recursively collect all user IDs
      const allUserIds = new Set<string>();
      const collectUserIds = (users: DownlineUser[]) => {
        users.forEach(user => {
          allUserIds.add(user.userId);
          if (user.downlines && user.downlines.length > 0) {
            collectUserIds(user.downlines);
          }
        });
      };
      if (data?.downline) {
        collectUserIds(data.downline);
      }
      setExpandedUsers(allUserIds);
      setExpandAll(true);
    }
  };

  const fetchAllTeam = useCallback(async () => {
    try {
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://talaash.thejaayveeworld.com';
      const url = `${API_BASE_URL}/api/team/list`;
      
      const response = await authenticatedFetch(url);
      
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setAllTeam(result.data || []);
        }
      }
    } catch (err) {
      console.error('Error fetching team list:', err);
    }
  }, []);

  const fetchDownline = useCallback(async (teamUserId?: string) => {
    try {
      setLoading(true);
      setError(null);

      const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://talaash.thejaayveeworld.com';
      const params = new URLSearchParams();
      // Always fetch nested for industry-level MLM view (default behavior)
      // nested=true is the default, so we don't need to explicitly set it
      
      if (teamUserId && isAdmin) {
        params.append('staffUserId', teamUserId);
      }

      const url = `${API_BASE_URL}/api/team/downline?${params.toString()}`;
      const response = await authenticatedFetch(url);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch downline: ${response.status} ${errorText}`);
      }

      const result = await response.json();
      if (result.success) {
        setData(result.data);
      } else {
        setError(result.error || 'Failed to fetch downline');
      }
    } catch (err: any) {
      console.error('Error fetching downline:', err);
      setError(err.message || 'Failed to fetch downline');
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    const loadData = async () => {
      const session = getTeamSession();
      const userEmail = session?.email;
      
      if (!userEmail) {
        setLoading(false);
        return;
      }

      const { getAuthToken } = require('@/lib/auth-utils');
      const { checkHasAccessClient } = require('@/lib/permissions');
      const token = getAuthToken();
      
      if (!token) {
        setLoading(false);
        return;
      }
      
      // Check if user has access to downline resource
      const result = await checkHasAccessClient(userEmail, 'downline', token);
      const hasAccess = result.hasAccess;
      
      // Super admins can see all team downlines
      const isSuperAdminUser = result.reason === 'super_admin';
      setIsAdmin(isSuperAdminUser);

      if (hasAccess) {
        // If admin, fetch all team list first, then downline
        if (isSuperAdminUser) {
          await fetchAllTeam();
        }
        // Fetch own downline
        await fetchDownline();
      } else {
        setError('You do not have permission to access this page');
      }
      
      setLoading(false);
    };

    loadData();
  }, [fetchDownline, fetchAllTeam]);

  useEffect(() => {
    if (selectedTeamId && isAdmin) {
      fetchDownline(selectedTeamId);
    }
  }, [selectedTeamId, isAdmin, fetchDownline]);

    try {
      setLoading(true);
      setError(null);

      const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://talaash.thejaayveeworld.com';
      const params = new URLSearchParams();
      // Always fetch nested for industry-level MLM view (default behavior)
      // nested=true is the default, so we don't need to explicitly set it
      
      if (teamUserId && isAdmin) {
        params.append('staffUserId', teamUserId);
      }

      const url = `${API_BASE_URL}/api/team/downline?${params.toString()}`;
      const response = await authenticatedFetch(url);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch downline: ${response.status} ${errorText}`);
      }

      const result = await response.json();
      if (result.success) {
        setData(result.data);
      } else {
        setError(result.error || 'Failed to fetch downline');
      }
    } catch (err: any) {
      console.error('Error fetching downline:', err);
      setError(err.message || 'Failed to fetch downline');
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  // Recursive search function
  const searchInUser = useCallback((user: DownlineUser, query: string): boolean => {
    const lowerQuery = query.toLowerCase();
    const matches = 
      user.fullName?.toLowerCase().includes(lowerQuery) ||
      user.email?.toLowerCase().includes(lowerQuery) ||
      user.phone?.toLowerCase().includes(lowerQuery) ||
      user.role?.toLowerCase().includes(lowerQuery) ||
      user.referralCode?.toLowerCase().includes(lowerQuery);

    if (matches) return true;

    // Check nested downlines
    if (user.downlines && user.downlines.length > 0) {
      return user.downlines.some(downline => searchInUser(downline, query));
    }

    return false;
  }, []);

  // Recursive filter function
  const filterNestedDownlines = useCallback((downlines: DownlineUser[], query: string): DownlineUser[] => {
    if (!query) return downlines;

    return downlines
      .map(user => {
        const matches = searchInUser(user, query);
        if (!matches) return null;

        const filteredUser = { ...user };
        if (user.downlines && user.downlines.length > 0) {
          filteredUser.downlines = filterNestedDownlines(user.downlines, query);
        }
        return filteredUser;
      })
      .filter((user): user is DownlineUser => user !== null);
  }, [searchInUser]);

  // Filter and search downlines
  const filteredDownlines = useMemo(() => {
    if (!data?.downline) return [];
    if (!searchQuery) return data.downline;
    return filterNestedDownlines(data.downline, searchQuery);
  }, [data?.downline, searchQuery, filterNestedDownlines]);

  // Recursive render function for nested downlines
  const renderDownlineUser = (user: DownlineUser, depth: number = 0) => {
    const hasNested = user.downlines && user.downlines.length > 0;
    const isExpanded = expandedUsers.has(user.userId) || expandAll;
    const nestedCount = user.downlines?.length || 0;

    return (
      <div key={user.userId} className="mb-3">
        <div className="card p-4 hover:shadow-md transition-shadow border-l-4 border-primary-accent">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                {hasNested && (
                  <button
                    onClick={() => toggleUserExpanded(user.userId)}
                    className="p-1.5 hover:bg-primary-bg rounded transition-colors"
                    title={isExpanded ? 'Collapse' : 'Expand'}
                  >
                    {isExpanded ? (
                      <ChevronUp className="h-5 w-5 text-primary-accent" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-primary-muted" />
                    )}
                  </button>
                )}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-primary-fg text-lg">{user.fullName}</h4>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      user.role === 'affiliate' ? 'bg-green-100 text-green-800 border border-green-200' :
                      user.role === 'agent' ? 'bg-purple-100 text-purple-800 border border-purple-200' :
                      user.role === 'influencer' ? 'bg-pink-100 text-pink-800 border border-pink-200' :
                      user.role === 'staff' || user.role === 'team' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                      'bg-gray-100 text-gray-800 border border-gray-200'
                    }`}>
                      {user.role.toUpperCase()}
                    </span>
                    {hasNested && (
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-primary-accent/10 text-primary-accent border border-primary-accent/20">
                        {nestedCount} {nestedCount === 1 ? 'Downline' : 'Downlines'}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-primary-muted">
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
                </div>
              </div>

              {/* Earnings Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mt-4 pt-4 border-t border-primary-border">
                {user.totalEarnings !== undefined && (
                  <div className="bg-primary-bg/50 p-3 rounded-lg">
                    <p className="text-xs text-primary-muted mb-1 flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" />
                      Total Earnings
                    </p>
                    <p className="text-base font-bold text-primary-fg">
                      ₹{parseFloat(user.totalEarnings || '0').toLocaleString('en-IN', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                      })}
                    </p>
                  </div>
                )}
                {user.commissionEarned !== undefined && (
                  <div className="bg-green-50 p-3 rounded-lg">
                    <p className="text-xs text-primary-muted mb-1 flex items-center gap-1">
                      <Award className="h-3 w-3" />
                      Commission
                    </p>
                    <p className="text-base font-bold text-green-600">
                      ₹{parseFloat(user.commissionEarned || '0').toLocaleString('en-IN', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                      })}
                    </p>
                  </div>
                )}
                {user.totalReferrals !== undefined && (
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <p className="text-xs text-primary-muted mb-1 flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      Referrals
                    </p>
                    <p className="text-base font-bold text-primary-fg">
                      {user.totalReferrals}
                    </p>
                  </div>
                )}
                {user.referralCode && (
                  <div className="bg-primary-accent/10 p-3 rounded-lg">
                    <p className="text-xs text-primary-muted mb-1">Referral Code</p>
                    <p className="text-sm font-mono font-bold text-primary-accent">
                      {user.referralCode}
                    </p>
                  </div>
                )}
                {user.walletBalance !== undefined && (
                  <div className="bg-yellow-50 p-3 rounded-lg">
                    <p className="text-xs text-primary-muted mb-1 flex items-center gap-1">
                      <Wallet className="h-3 w-3" />
                      Wallet
                    </p>
                    <p className="text-base font-bold text-yellow-600">
                      ₹{parseFloat(user.walletBalance?.toString() || '0').toLocaleString('en-IN', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                      })}
                    </p>
                  </div>
                )}
                {user.totalSignups !== undefined && (
                  <div className="bg-purple-50 p-3 rounded-lg">
                    <p className="text-xs text-primary-muted mb-1">Signups</p>
                    <p className="text-base font-bold text-purple-600">
                      {user.totalSignups}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Nested Downlines */}
        {hasNested && isExpanded && (
          <div className="mt-3 ml-8 border-l-2 border-primary-accent/30 pl-6 space-y-2">
            {user.downlines!.map(nestedUser => renderDownlineUser(nestedUser, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-primary-bg flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary-accent border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-2 text-primary-muted">Loading downline...</p>
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
            onClick={() => fetchDownline(selectedTeamId || undefined)}
            className="px-4 py-2 bg-primary-accent text-white rounded-lg hover:bg-primary-accent/90"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-primary-bg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GitBranch className="h-6 w-6 text-primary-fg" />
            <h1 className="text-2xl font-bold text-primary-fg">MLM Downline</h1>
          </div>
          {isAdmin && allTeam.length > 0 && (
            <select
              value={selectedTeamId || ''}
              onChange={(e) => setSelectedTeamId(e.target.value || null)}
              className="px-4 py-2 border border-primary-border rounded-lg bg-white text-primary-fg focus:outline-none focus:ring-2 focus:ring-primary-accent"
            >
              <option value="">My Downline</option>
              {allTeam.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.fullName} ({team.email})
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Staff Info Card */}
        {data?.staff && (
          <div className="card mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-primary-fg">{data.staff.fullName}</h3>
                <p className="text-sm text-primary-muted">{data.staff.email}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-primary-muted mb-1">Referral Code</p>
                <p className="font-mono text-sm font-semibold text-primary-accent">
                  {data.staff.referralCode || 'Not assigned'}
                </p>
              </div>
            </div>
            
            {/* Staff Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-primary-border">
              <div>
                <p className="text-xs text-primary-muted mb-1">Total Referrals</p>
                <p className="text-lg font-bold text-primary-fg">
                  {data.staff.totalReferrals ?? 0}
                </p>
              </div>
              {data.staff.commissionRate && (
                <div>
                  <p className="text-xs text-primary-muted mb-1">Commission Rate</p>
                  <p className="text-lg font-bold text-green-600">
                    {parseFloat(data.staff.commissionRate).toFixed(2)}%
                  </p>
                </div>
              )}
              {data.staff.commissionEarned && (
                <div>
                  <p className="text-xs text-primary-muted mb-1">Total Commission</p>
                  <p className="text-lg font-bold text-primary-fg">
                    ₹{parseFloat(data.staff.commissionEarned).toLocaleString('en-IN', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    })}
                  </p>
                </div>
              )}
              {data.staff.pendingEarnings && parseFloat(data.staff.pendingEarnings) > 0 && (
                <div>
                  <p className="text-xs text-primary-muted mb-1">Pending Earnings</p>
                  <p className="text-lg font-bold text-yellow-600">
                    ₹{parseFloat(data.staff.pendingEarnings).toLocaleString('en-IN', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    })}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Earnings Breakdown */}
        {data?.earningsBreakdown && (
          <div className="card mb-6">
            <div className="p-6 border-b border-primary-border">
              <h2 className="text-xl font-semibold text-primary-fg flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Earnings Breakdown
              </h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div>
                  <p className="text-xs text-primary-muted mb-1">Total Earnings</p>
                  <p className="text-lg font-bold text-primary-fg">
                    ₹{data.earningsBreakdown.totalEarnings.toLocaleString('en-IN', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-primary-muted mb-1">Credited</p>
                  <p className="text-lg font-bold text-green-600">
                    ₹{data.earningsBreakdown.creditedEarnings.toLocaleString('en-IN', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-primary-muted mb-1">Pending</p>
                  <p className="text-lg font-bold text-yellow-600">
                    ₹{data.earningsBreakdown.pendingEarnings.toLocaleString('en-IN', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    })}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Search and Controls */}
        <div className="card mb-6">
          <div className="p-4 flex gap-4 items-center">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-primary-muted" />
              <input
                type="text"
                placeholder="Search downlines by name, email, phone, role, or referral code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-primary-border rounded-lg bg-white text-primary-fg focus:outline-none focus:ring-2 focus:ring-primary-accent"
              />
            </div>
            <button
              onClick={toggleExpandAll}
              className="px-4 py-2 border border-primary-border rounded-lg bg-white text-primary-fg hover:bg-primary-bg transition-colors whitespace-nowrap"
            >
              {expandAll ? 'Collapse All' : 'Expand All'}
            </button>
          </div>
        </div>

        {/* Downline List */}
        <div className="card">
          <div className="p-6 border-b border-primary-border">
            <h2 className="text-xl font-semibold text-primary-fg flex items-center gap-2">
              <Users className="h-5 w-5" />
              Downline Network ({filteredDownlines.length})
            </h2>
          </div>
          <div className="p-6">
            {filteredDownlines.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-primary-muted mx-auto mb-4" />
                <p className="text-primary-muted">No downlines found</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredDownlines.map(user => renderDownlineUser(user, 0))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
