"use client";

import { useEffect, useState, useMemo } from "react";
import { Users, UserCheck, Mail, Phone, Calendar, TrendingUp, Building2, Instagram, Youtube, Tag, Wallet, Search, Filter, ArrowUpDown, ChevronLeft, ChevronRight, X, Edit, Save, Award, CheckCircle2 } from "lucide-react";
import { authenticatedFetch, getStaffSession } from "@/lib/auth-utils";
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

interface StaffDownline {
  staff: {
    id: string;
    email: string;
    fullName: string;
    referralCode: string | null;
  } | null;
  downline: DownlineUser[];
  earningsBreakdown?: EarningsBreakdown | null;
}

export default function DownlinePage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<StaffDownline | null>(null);
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);
  const [allStaff, setAllStaff] = useState<Array<{ id: string; email: string; fullName: string }>>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  
  // Search, Filter, Sort, Pagination states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRole, setSelectedRole] = useState<string>("all");
  const [selectedTier, setSelectedTier] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  // Edit user state
  const [editingUser, setEditingUser] = useState<DownlineUser | null>(null);
  const [editForm, setEditForm] = useState({ fullName: '', email: '', phone: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      const session = getStaffSession();
      const userEmail = session?.email?.toLowerCase();
      const admin = userEmail === 'md.thejaayveeworld@gmail.com' || 
                    userEmail === 'thejaayveeworldofficial@gmail.com';
      setIsAdmin(admin);

      // If admin, fetch all staff list first, then downline
      if (admin) {
        await fetchAllStaff();
        // After fetching staff list, fetch own downline
        await fetchDownline();
      } else {
        // Regular staff fetch their own downline
        await fetchDownline();
      }
    };

    loadData();
  }, []);

  useEffect(() => {
    if (selectedStaffId && isAdmin) {
      fetchDownline(selectedStaffId);
    }
  }, [selectedStaffId, isAdmin]);

  const fetchAllStaff = async () => {
    try {
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://talaash.thejaayveeworld.com';
      const url = `${API_BASE_URL}/api/staff/list`;
      console.log('🔍 Fetching staff list from:', url);
      
      const response = await authenticatedFetch(url);
      console.log('📡 Staff list response status:', response.status);
      
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setAllStaff(result.data || []);
        } else {
          console.error('❌ Staff list error:', result.error);
        }
      } else {
        const errorText = await response.text();
        console.error('❌ Failed to fetch staff list:', response.status, errorText);
      }
    } catch (err) {
      console.error('❌ Error fetching staff list:', err);
    }
  };

  const fetchDownline = async (staffUserId?: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://talaash.thejaayveeworld.com';
      let url = `${API_BASE_URL}/api/staff/downline`;
      if (staffUserId) {
        url += `?staffUserId=${staffUserId}`;
      }
      // For admins, include nested downlines
      if (isAdmin) {
        url += staffUserId ? `&nested=true` : `?nested=true`;
      }

      console.log('🔍 Fetching downline from:', url);
      
      // Add timeout to prevent hanging
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
      
      try {
        const response = await authenticatedFetch(url, {
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);
        
        console.log('📡 Response status:', response.status, response.statusText);
        
        if (!response.ok) {
          let errorText = '';
          try {
            errorText = await response.text();
            const errorData = errorText ? JSON.parse(errorText) : {};
            console.error('❌ API error:', errorData);
            throw new Error(errorData.error || `Failed to fetch downline: ${response.status} ${response.statusText}`);
          } catch (parseError) {
            console.error('❌ Failed to parse error:', parseError, errorText);
            throw new Error(`Failed to fetch downline: ${response.status} ${response.statusText}`);
          }
        }

        const result = await response.json();
        console.log('✅ Downline data received:', result);
        console.log('📊 Downline count:', result.data?.downline?.length || 0);
        console.log('📋 Debug info:', result.data?.debug);
        
        if (result.success) {
          setData(result.data);
          if ((result.data?.downline?.length || 0) === 0) {
            console.log('⚠️ No downline users found. This could mean:');
            console.log('   1. No users have been created yet through this staff member');
            console.log('   2. userReferrals entries may not have been created');
            console.log('   3. The staff member may not have a referral code');
          }
        } else {
          throw new Error(result.error || 'Failed to load downline');
        }
      } catch (fetchError: any) {
        clearTimeout(timeoutId);
        if (fetchError.name === 'AbortError') {
          throw new Error('Request timeout - the server took too long to respond');
        }
        throw fetchError;
      }
    } catch (err: any) {
      console.error('❌ Error fetching downline:', err);
      setError(err.message || 'Failed to load downline');
    } finally {
      setLoading(false);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role.toLowerCase()) {
      case 'affiliate':
        return <Tag className="h-4 w-4" />;
      case 'agent':
        return <UserCheck className="h-4 w-4" />;
      case 'influencer':
        return <TrendingUp className="h-4 w-4" />;
      case 'seller':
        return <Building2 className="h-4 w-4" />;
      default:
        return <Users className="h-4 w-4" />;
    }
  };

  const getRoleBadgeClass = (role: string) => {
    switch (role.toLowerCase()) {
      case 'affiliate':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'agent':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'influencer':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'seller':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Get unique roles and tiers from data
  const uniqueRoles = useMemo(() => {
    if (!data?.downline) return [];
    const roles = new Set(data.downline.map(user => user.role.toLowerCase()));
    return Array.from(roles);
  }, [data]);

  const uniqueTiers = useMemo(() => {
    if (!data?.downline) return [];
    const tiers = new Set(data.downline.map(user => user.tier?.toLowerCase()).filter((tier): tier is string => Boolean(tier)));
    return Array.from(tiers);
  }, [data]);

  // Filter and sort data
  const filteredAndSortedData = useMemo(() => {
    if (!data?.downline) return [];

    let filtered = [...data.downline];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(user => 
        user.fullName?.toLowerCase().includes(query) ||
        user.email?.toLowerCase().includes(query) ||
        user.phone?.toLowerCase().includes(query) ||
        user.code?.toLowerCase().includes(query) ||
        user.referralCode?.toLowerCase().includes(query)
      );
    }

    // Apply role filter
    if (selectedRole !== "all") {
      filtered = filtered.filter(user => user.role.toLowerCase() === selectedRole);
    }

    // Apply tier filter
    if (selectedTier !== "all") {
      filtered = filtered.filter(user => user.tier?.toLowerCase() === selectedTier);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortBy) {
        case "name":
          aValue = a.fullName?.toLowerCase() || "";
          bValue = b.fullName?.toLowerCase() || "";
          break;
        case "email":
          aValue = a.email?.toLowerCase() || "";
          bValue = b.email?.toLowerCase() || "";
          break;
        case "role":
          aValue = a.role?.toLowerCase() || "";
          bValue = b.role?.toLowerCase() || "";
          break;
        case "createdAt":
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
          break;
        case "totalReferrals":
          aValue = a.totalReferrals ?? 0;
          bValue = b.totalReferrals ?? 0;
          break;
        case "totalEarnings":
          aValue = parseFloat(a.totalEarnings || "0");
          bValue = parseFloat(b.totalEarnings || "0");
          break;
        case "walletBalance":
          aValue = a.walletBalance ?? 0;
          bValue = b.walletBalance ?? 0;
          break;
        default:
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
      }

      if (aValue < bValue) return sortOrder === "asc" ? -1 : 1;
      if (aValue > bValue) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [data, searchQuery, selectedRole, selectedTier, sortBy, sortOrder]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedData.length / itemsPerPage);
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return filteredAndSortedData.slice(start, end);
  }, [filteredAndSortedData, currentPage, itemsPerPage]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedRole, selectedTier, sortBy, sortOrder]);

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedRole("all");
    setSelectedTier("all");
    setSortBy("createdAt");
    setSortOrder("desc");
    setCurrentPage(1);
  };

  const hasActiveFilters = searchQuery || selectedRole !== "all" || selectedTier !== "all";

  if (loading && !data) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-2 mb-6">
          <Users className="h-6 w-6 text-primary-fg" />
          <h1 className="text-2xl font-bold text-primary-fg">Downline</h1>
        </div>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-accent mx-auto"></div>
          <p className="text-sm text-primary-muted mt-4">Loading downline...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-2 mb-6">
          <Users className="h-6 w-6 text-primary-fg" />
          <h1 className="text-2xl font-bold text-primary-fg">Downline</h1>
        </div>
        <div className="text-center py-12">
          <p className="text-sm text-red-600">{error}</p>
          <button
            onClick={() => fetchDownline(selectedStaffId || undefined)}
            className="mt-4 px-4 py-2 bg-primary-accent text-white rounded-lg hover:bg-primary-accent/90"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const fixReferralCode = async () => {
    try {
      setLoading(true);
      setError(null);
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://talaash.thejaayveeworld.com';
      const response = await authenticatedFetch(`${API_BASE_URL}/api/staff/fix-staff-referral-codes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}), // Empty body = fix own referral code
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fix referral code');
      }

      const result = await response.json();
      if (result.success) {
        // Reload downline
        await fetchDownline(selectedStaffId || undefined);
        alert(`✅ Referral code created: ${result.data?.referralCode || 'N/A'}`);
      }
    } catch (err: any) {
      console.error('Error fixing referral code:', err);
      setError(err.message || 'Failed to fix referral code');
    } finally {
      setLoading(false);
    }
  };

  const handleEditUser = (user: DownlineUser) => {
    setEditingUser(user);
    setEditForm({
      fullName: user.fullName,
      email: user.email,
      phone: user.phone || ''
    });
  };

  const handleCancelEdit = () => {
    setEditingUser(null);
    setEditForm({ fullName: '', email: '', phone: '' });
  };

  const handleSaveUser = async () => {
    if (!editingUser) return;

    try {
      setSaving(true);
      setError(null);
      
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://talaash.thejaayveeworld.com';
      const response = await authenticatedFetch(`${API_BASE_URL}/api/staff/users/${editingUser.userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fullName: editForm.fullName,
          email: editForm.email,
          phone: editForm.phone || null
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update user');
      }

      const result = await response.json();
      if (result.success) {
        // Reload downline to show updated data
        await fetchDownline(selectedStaffId || undefined);
        setEditingUser(null);
        setEditForm({ fullName: '', email: '', phone: '' });
      }
    } catch (err: any) {
      console.error('Error updating user:', err);
      setError(err.message || 'Failed to update user');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Users className="h-6 w-6 text-primary-fg" />
          <h1 className="text-2xl font-bold text-primary-fg">Downline</h1>
        </div>
        <div className="flex items-center gap-4">
          {data?.staff && !data.staff.referralCode && (
            <button
              onClick={fixReferralCode}
              className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
            >
              Create Referral Code
            </button>
          )}
          {isAdmin && allStaff.length > 0 && (
            <select
              value={selectedStaffId || ''}
              onChange={(e) => setSelectedStaffId(e.target.value || null)}
              className="px-4 py-2 border border-primary-border rounded-lg bg-white text-primary-fg"
            >
              <option value="">Select Staff Member</option>
              {allStaff.map((staff) => (
                <option key={staff.id} value={staff.id}>
                  {staff.fullName} ({staff.email})
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {data?.staff && (
        <div className="card mb-6">
          <div className="flex items-center justify-between">
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
        </div>
      )}

      {/* Search, Filter, Sort Controls */}
      <div className="card mb-6 space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-primary-muted" />
          <input
            type="text"
            placeholder="Search by name, email, phone, or code..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-primary-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-accent text-primary-fg"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-primary-muted hover:text-primary-fg"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Filters and Sort Row */}
        <div className="flex flex-wrap gap-4 items-center">
          {/* Role Filter */}
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-primary-muted" />
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="px-3 py-2 border border-primary-border rounded-lg bg-white text-primary-fg text-sm focus:outline-none focus:ring-2 focus:ring-primary-accent"
            >
              <option value="all">All Roles</option>
              {uniqueRoles.map(role => (
                <option key={role} value={role}>{role.charAt(0).toUpperCase() + role.slice(1)}</option>
              ))}
            </select>
          </div>

          {/* Tier Filter */}
          {uniqueTiers.length > 0 && (
            <select
              value={selectedTier}
              onChange={(e) => setSelectedTier(e.target.value)}
              className="px-3 py-2 border border-primary-border rounded-lg bg-white text-primary-fg text-sm focus:outline-none focus:ring-2 focus:ring-primary-accent"
            >
              <option value="all">All Tiers</option>
              {uniqueTiers.map(tier => (
                <option key={tier} value={tier}>{tier.charAt(0).toUpperCase() + tier.slice(1)}</option>
              ))}
            </select>
          )}

          {/* Sort */}
          <div className="flex items-center gap-2 ml-auto">
            <ArrowUpDown className="h-4 w-4 text-primary-muted" />
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [field, order] = e.target.value.split("-");
                setSortBy(field);
                setSortOrder(order as "asc" | "desc");
              }}
              className="px-3 py-2 border border-primary-border rounded-lg bg-white text-primary-fg text-sm focus:outline-none focus:ring-2 focus:ring-primary-accent"
            >
              <option value="createdAt-desc">Newest First</option>
              <option value="createdAt-asc">Oldest First</option>
              <option value="name-asc">Name (A-Z)</option>
              <option value="name-desc">Name (Z-A)</option>
              <option value="email-asc">Email (A-Z)</option>
              <option value="email-desc">Email (Z-A)</option>
              <option value="role-asc">Role (A-Z)</option>
              <option value="role-desc">Role (Z-A)</option>
              <option value="totalReferrals-desc">Most Referrals</option>
              <option value="totalReferrals-asc">Least Referrals</option>
              <option value="totalEarnings-desc">Highest Earnings</option>
              <option value="totalEarnings-asc">Lowest Earnings</option>
              <option value="walletBalance-desc">Highest Wallet</option>
              <option value="walletBalance-asc">Lowest Wallet</option>
            </select>
          </div>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="px-3 py-2 text-sm text-primary-accent hover:bg-primary-accent-light rounded-lg transition-colors"
            >
              Clear Filters
            </button>
          )}
        </div>

        {/* Results Count */}
        <div className="flex items-center justify-between text-sm">
          <p className="text-primary-muted">
            Showing <span className="font-semibold text-primary-fg">
              {filteredAndSortedData.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1}
            </span> - <span className="font-semibold text-primary-fg">
              {Math.min(currentPage * itemsPerPage, filteredAndSortedData.length)}
            </span> of <span className="font-semibold text-primary-fg">{filteredAndSortedData.length}</span> results
            {data?.downline.length !== filteredAndSortedData.length && (
              <span className="text-primary-muted"> (filtered from {data?.downline.length || 0} total)</span>
            )}
          </p>
          <div className="flex items-center gap-2">
            <label className="text-primary-muted text-sm">Per page:</label>
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="px-2 py-1 border border-primary-border rounded bg-white text-primary-fg text-sm focus:outline-none focus:ring-2 focus:ring-primary-accent"
            >
              <option value="10">10</option>
              <option value="25">25</option>
              <option value="50">50</option>
              <option value="100">100</option>
            </select>
          </div>
        </div>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 border border-primary-border rounded-lg bg-white text-primary-fg hover:bg-primary-accent-light disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </button>
          
          <div className="flex items-center gap-2">
            {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
              let pageNum: number;
              if (totalPages <= 7) {
                pageNum = i + 1;
              } else if (currentPage <= 4) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 3) {
                pageNum = totalPages - 6 + i;
              } else {
                pageNum = currentPage - 3 + i;
              }

              if (pageNum < 1 || pageNum > totalPages) return null;

              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`px-3 py-1 rounded-lg transition-colors ${
                    currentPage === pageNum
                      ? "bg-primary-accent text-white"
                      : "border border-primary-border bg-white text-primary-fg hover:bg-primary-accent-light"
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>

          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="px-4 py-2 border border-primary-border rounded-lg bg-white text-primary-fg hover:bg-primary-accent-light disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Earnings Breakdown Section */}
      {data?.earningsBreakdown && data.earningsBreakdown.users.length > 0 && (
        <div className="card mb-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-5 w-5 text-green-600" />
            <h2 className="text-xl font-bold text-primary-fg">Upline Earnings Breakdown</h2>
          </div>
          
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
              <p className="text-sm text-green-700 mb-1">Total Earnings</p>
              <p className="text-2xl font-bold text-green-900">
                ₹{data.earningsBreakdown.totalEarnings.toLocaleString('en-IN', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })}
              </p>
            </div>
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <p className="text-sm text-blue-700 mb-1">Credited</p>
              <p className="text-2xl font-bold text-blue-900">
                ₹{data.earningsBreakdown.creditedEarnings.toLocaleString('en-IN', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })}
              </p>
            </div>
            <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
              <p className="text-sm text-yellow-700 mb-1">Pending</p>
              <p className="text-2xl font-bold text-yellow-900">
                ₹{data.earningsBreakdown.pendingEarnings.toLocaleString('en-IN', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })}
              </p>
            </div>
          </div>

          {/* Earnings per User */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-primary-fg mb-3">Earnings by User</h3>
            {data.earningsBreakdown.users.map((earningsUser) => {
              const downlineUser = data.downline.find(u => u.userId === earningsUser.userId);
              return (
                <div
                  key={earningsUser.userId}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    earningsUser.milestoneReached
                      ? 'bg-green-50 border-green-300 shadow-md'
                      : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-primary-fg">{earningsUser.userName}</h4>
                        {earningsUser.milestoneReached && (
                          <div className="flex items-center gap-1 bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                            <CheckCircle2 className="h-3 w-3" />
                            Milestone Reached
                          </div>
                        )}
                      </div>
                      {downlineUser && (
                        <p className="text-sm text-primary-muted mb-2">
                          {downlineUser.email} • {downlineUser.role}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
                    <div>
                      <p className="text-xs text-primary-muted mb-1">Total Earnings</p>
                      <p className="text-sm font-semibold text-primary-fg">
                        ₹{earningsUser.totalEarnings.toLocaleString('en-IN', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2
                        })}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-primary-muted mb-1">Credited</p>
                      <p className="text-sm font-semibold text-green-700">
                        ₹{earningsUser.creditedEarnings.toLocaleString('en-IN', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2
                        })}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-primary-muted mb-1">Pending</p>
                      <p className="text-sm font-semibold text-yellow-700">
                        ₹{earningsUser.pendingEarnings.toLocaleString('en-IN', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2
                        })}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-primary-muted mb-1">Tickets (This Month)</p>
                      <div className="flex items-center gap-1">
                        <p className={`text-sm font-semibold ${
                          earningsUser.ticketCount >= 50 ? 'text-green-700' : 'text-primary-fg'
                        }`}>
                          {earningsUser.ticketCount}
                        </p>
                        {earningsUser.ticketCount >= 50 && (
                          <Award className="h-4 w-4 text-green-600" />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {data?.downline.length === 0 ? (
        <div className="card text-center py-12">
          <Users className="h-12 w-12 text-primary-muted mx-auto mb-4" />
          <p className="text-primary-muted">No downline members yet</p>
          <p className="text-sm text-primary-muted mt-2">
            Users you create through the Create User page will appear here
          </p>
        </div>
      ) : filteredAndSortedData.length === 0 ? (
        <div className="card text-center py-12">
          <Users className="h-12 w-12 text-primary-muted mx-auto mb-4" />
          <p className="text-primary-muted">No downline members match your filters</p>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="mt-4 px-4 py-2 text-primary-accent hover:bg-primary-accent-light rounded-lg transition-colors"
            >
              Clear Filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-4">
          {paginatedData.map((user) => (
            <div key={user.userId} className="card">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-start gap-3 flex-1">
                  <div className={`p-2 rounded-lg ${getRoleBadgeClass(user.role)}`}>
                    {getRoleIcon(user.role)}
                  </div>
                  <div className="flex-1">
                    {editingUser?.userId === user.userId ? (
                      // Edit mode
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={editForm.fullName}
                          onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                          className="w-full px-3 py-2 border border-primary-border rounded-lg bg-primary-bg text-primary-fg text-sm"
                          placeholder="Full Name"
                          disabled={saving}
                        />
                        <input
                          type="email"
                          value={editForm.email}
                          onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                          className="w-full px-3 py-2 border border-primary-border rounded-lg bg-primary-bg text-primary-fg text-sm"
                          placeholder="Email"
                          disabled={saving}
                        />
                        <input
                          type="tel"
                          value={editForm.phone}
                          onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                          className="w-full px-3 py-2 border border-primary-border rounded-lg bg-primary-bg text-primary-fg text-sm"
                          placeholder="Phone (optional)"
                          disabled={saving}
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={handleSaveUser}
                            disabled={saving}
                            className="px-3 py-1 bg-primary-accent text-white rounded-lg text-sm hover:bg-primary-accent-dark transition-colors disabled:opacity-50 flex items-center gap-1"
                          >
                            <Save className="h-3 w-3" />
                            {saving ? 'Saving...' : 'Save'}
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            disabled={saving}
                            className="px-3 py-1 border border-primary-border text-primary-fg rounded-lg text-sm hover:bg-primary-accent-light transition-colors disabled:opacity-50"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      // View mode
                      <>
                        <h4 className="font-semibold text-primary-fg">{user.fullName}</h4>
                        <p className="text-sm text-primary-muted flex items-center gap-1 mt-1">
                          <Mail className="h-3 w-3" />
                          {user.email}
                        </p>
                        {user.phone && (
                          <p className="text-sm text-primary-muted flex items-center gap-1 mt-1">
                            <Phone className="h-3 w-3" />
                            {user.phone}
                          </p>
                        )}
                      </>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-1 rounded-full border capitalize ${getRoleBadgeClass(user.role)}`}>
                    {user.role}
                  </span>
                  {isAdmin && editingUser?.userId !== user.userId && (
                    <button
                      onClick={() => handleEditUser(user)}
                      className="p-1 hover:bg-primary-accent-light rounded transition-colors"
                      title="Edit user details"
                    >
                      <Edit className="h-4 w-4 text-primary-fg" />
                    </button>
                  )}
                </div>
              </div>

              <div className="border-t border-primary-border pt-3 mt-3">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-xs text-primary-muted mb-1">Created</p>
                    <p className="text-primary-fg flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(user.createdAt), "MMM dd, yyyy")}
                    </p>
                  </div>
                  {user.code && (
                    <div>
                      <p className="text-xs text-primary-muted mb-1">Affiliate Code</p>
                      <p className="font-mono text-xs text-primary-fg">{user.code}</p>
                    </div>
                  )}
                  {user.referralCode && (
                    <div>
                      <p className="text-xs text-primary-muted mb-1">Referral Code</p>
                      <p className="font-mono text-xs text-primary-fg">{user.referralCode}</p>
                    </div>
                  )}
                  {user.totalReferrals !== undefined && (
                    <div>
                      <p className="text-xs text-primary-muted mb-1">Total Referrals</p>
                      <p className="text-primary-fg font-semibold">{user.totalReferrals}</p>
                    </div>
                  )}
                  {user.totalMerchants !== undefined && (
                    <div>
                      <p className="text-xs text-primary-muted mb-1">Total Merchants</p>
                      <p className="text-primary-fg font-semibold">{user.totalMerchants}</p>
                    </div>
                  )}
                  {user.totalEarnings && (
                    <div>
                      <p className="text-xs text-primary-muted mb-1">Total Earnings</p>
                      <p className="text-primary-fg font-semibold">₹{parseFloat(user.totalEarnings).toFixed(2)}</p>
                    </div>
                  )}
                  {user.commissionEarned && (
                    <div>
                      <p className="text-xs text-primary-muted mb-1">Commission Earned</p>
                      <p className="text-primary-fg font-semibold">₹{parseFloat(user.commissionEarned).toFixed(2)}</p>
                    </div>
                  )}
                  {user.tier && (
                    <div>
                      <p className="text-xs text-primary-muted mb-1">Tier</p>
                      <p className="text-primary-fg font-semibold capitalize">{user.tier}</p>
                    </div>
                  )}
                  {user.instagramHandle && (
                    <div>
                      <p className="text-xs text-primary-muted mb-1 flex items-center gap-1">
                        <Instagram className="h-3 w-3" />
                        Instagram
                      </p>
                      <p className="text-primary-fg text-xs">@{user.instagramHandle}</p>
                    </div>
                  )}
                  {user.youtubeHandle && (
                    <div>
                      <p className="text-xs text-primary-muted mb-1 flex items-center gap-1">
                        <Youtube className="h-3 w-3" />
                        YouTube
                      </p>
                      <p className="text-primary-fg text-xs">{user.youtubeHandle}</p>
                    </div>
                  )}
                  {user.totalSignups !== undefined && (
                    <div>
                      <p className="text-xs text-primary-muted mb-1">Total Signups</p>
                      <p className="text-primary-fg font-semibold">{user.totalSignups}</p>
                    </div>
                  )}
                  {user.walletBalance !== undefined && (
                    <div>
                      <p className="text-xs text-primary-muted mb-1 flex items-center gap-1">
                        <Wallet className="h-3 w-3" />
                        Wallet Balance
                      </p>
                      <p className="text-primary-fg font-semibold">
                        {user.walletCurrency === 'INR' ? '₹' : user.walletCurrency + ' '}
                        {parseFloat(String(user.walletBalance)).toFixed(2)}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

