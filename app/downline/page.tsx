"use client";

import { useEffect, useState } from "react";
import { Users, UserCheck, Mail, Phone, Calendar, TrendingUp, Building2, Instagram, Youtube, Tag } from "lucide-react";
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
}

interface StaffDownline {
  staff: {
    id: string;
    email: string;
    fullName: string;
    referralCode: string;
  } | null;
  downline: DownlineUser[];
}

export default function DownlinePage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<StaffDownline | null>(null);
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);
  const [allStaff, setAllStaff] = useState<Array<{ id: string; email: string; fullName: string }>>([]);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const session = getStaffSession();
    const userEmail = session?.email?.toLowerCase();
    const admin = userEmail === 'md.thejaayveeworld@gmail.com' || 
                  userEmail === 'thejaayveeworldofficial@gmail.com';
    setIsAdmin(admin);

    // If admin, fetch all staff list
    if (admin) {
      fetchAllStaff();
    } else {
      // Regular staff fetch their own downline
      fetchDownline();
    }
  }, []);

  useEffect(() => {
    if (selectedStaffId) {
      fetchDownline(selectedStaffId);
    }
  }, [selectedStaffId]);

  const fetchAllStaff = async () => {
    try {
      // Fetch all staff members - you'll need to create this API endpoint
      // For now, we'll just show a message
      const response = await authenticatedFetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'https://talaash.thejaayveeworld.com'}/api/staff/list`);
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setAllStaff(result.data || []);
        }
      }
    } catch (err) {
      console.error('Error fetching staff list:', err);
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

      const response = await authenticatedFetch(url);
      
      if (!response.ok) {
        throw new Error('Failed to fetch downline');
      }

      const result = await response.json();
      if (result.success) {
        setData(result.data);
      } else {
        throw new Error(result.error || 'Failed to load downline');
      }
    } catch (err: any) {
      console.error('Error fetching downline:', err);
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

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Users className="h-6 w-6 text-primary-fg" />
          <h1 className="text-2xl font-bold text-primary-fg">Downline</h1>
        </div>
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

      {data?.staff && (
        <div className="card mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-primary-fg">{data.staff.fullName}</h3>
              <p className="text-sm text-primary-muted">{data.staff.email}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-primary-muted mb-1">Referral Code</p>
              <p className="font-mono text-sm font-semibold text-primary-accent">{data.staff.referralCode}</p>
            </div>
          </div>
        </div>
      )}

      <div className="mb-4">
        <p className="text-sm text-primary-muted">
          Total Downline: <span className="font-semibold text-primary-fg">{data?.downline.length || 0}</span>
        </p>
      </div>

      {data?.downline.length === 0 ? (
        <div className="card text-center py-12">
          <Users className="h-12 w-12 text-primary-muted mx-auto mb-4" />
          <p className="text-primary-muted">No downline members yet</p>
          <p className="text-sm text-primary-muted mt-2">
            Users you create through the Create User page will appear here
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {data?.downline.map((user) => (
            <div key={user.userId} className="card">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${getRoleBadgeClass(user.role)}`}>
                    {getRoleIcon(user.role)}
                  </div>
                  <div>
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
                  </div>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full border capitalize ${getRoleBadgeClass(user.role)}`}>
                  {user.role}
                </span>
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
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

