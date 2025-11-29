"use client";

import { useEffect, useState, useCallback } from "react";
import { LogIn, LogOut, User, Mail, Calendar, Clock, Search, Filter, AlertCircle, X } from "lucide-react";
import { authenticatedFetch, getTeamSession } from "@/lib/auth-utils";
import { API_BASE_URL } from "@/lib/api";
import { isSuperAdmin } from "@/lib/rbac";

interface UserActivity {
  id: string;
  userId: string;
  userName: string | null;
  userEmail: string | null;
  activityType: 'login' | 'logout';
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
  hasPendingTasks?: boolean;
  pendingTasksCount?: number;
}

export default function UserActivityPage() {
  const [activities, setActivities] = useState<UserActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null); // null = checking, true/false = result
  const [blockingLogout, setBlockingLogout] = useState<string | null>(null);

  const session = getTeamSession();
  const currentUserEmail = session?.email;

  useEffect(() => {
    checkAdminStatus();
  }, []);

  useEffect(() => {
    // Only fetch activities if admin check is complete and user is admin
    if (isAdmin === true) {
      fetchActivities();
    }
  }, [isAdmin]);

  const checkAdminStatus = useCallback(async () => {
    try {
      const { getAuthToken } = require('@/lib/auth-utils');
      const { checkHasAccessClient } = require('@/lib/permissions');
      const token = getAuthToken();
      
      if (!token || !currentUserEmail) {
        setIsAdmin(false);
        return;
      }
      
      // User activity requires super admin
      const result = await checkHasAccessClient(currentUserEmail, '', token, true);
      setIsAdmin(result.hasAccess && result.reason === 'super_admin');
    } catch (err) {
      console.error('Error checking admin status:', err);
      setIsAdmin(false);
    }
  }, [currentUserEmail]);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await authenticatedFetch(`${API_BASE_URL}/api/team/user-activity`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch user activities');
      }

      const data = await response.json();
      if (data.success) {
        setActivities(data.data || []);
      } else {
        setError(data.error || 'Failed to fetch user activities');
      }
    } catch (err: any) {
      console.error("Error fetching user activities:", err);
      setError(err.message || "Failed to fetch user activities");
    } finally {
      setLoading(false);
    }
  };

  const handleForceLogout = async (userId: string, userEmail: string) => {
    if (!confirm(`Are you sure you want to force logout ${userEmail}? This will end their current session.`)) {
      return;
    }

    try {
      // Check if user has pending tasks
      const tasksResponse = await authenticatedFetch(`${API_BASE_URL}/api/team/tasks?userId=${userId}`);
      if (tasksResponse.ok) {
        const tasksData = await tasksResponse.json();
        if (tasksData.success) {
          const pendingTasks = (tasksData.data || []).filter((task: any) => 
            task.status !== 'completed' && 
            (task.assignedTo === userId || task.createdBy === userId)
          );
          
          if (pendingTasks.length > 0) {
            setBlockingLogout(`${userEmail} has ${pendingTasks.length} pending task(s). Cannot force logout.`);
            setTimeout(() => setBlockingLogout(null), 5000);
            return;
          }
        }
      }

      // Proceed with force logout
      const response = await authenticatedFetch(`${API_BASE_URL}/api/team/user-activity/force-logout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          alert(`Successfully logged out ${userEmail}`);
          fetchActivities();
        } else {
          setError(data.error || 'Failed to force logout');
        }
      }
    } catch (err: any) {
      console.error('Error forcing logout:', err);
      setError(err.message || 'Failed to force logout');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const filteredActivities = activities.filter((activity) => {
    const matchesSearch = 
      activity.userName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      activity.userEmail?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      activity.ipAddress?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesType = filterType === "all" || activity.activityType === filterType;
    
    return matchesSearch && matchesType;
  });

  // Show loading while checking admin status
  if (isAdmin === null) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary-accent border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-primary-muted">Checking access...</p>
        </div>
      </div>
    );
  }

  // Show access denied only after admin check is complete
  if (isAdmin === false) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-primary-fg mb-2">Access Denied</h1>
          <p className="text-primary-muted">Only administrators can view user activity.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary-accent border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-primary-muted">Loading user activity...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-primary-fg">User Activity</h1>
          <p className="text-primary-muted mt-1">Track login and logout activities of all users</p>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)}>
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Blocking Message */}
      {blockingLogout && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          <span>{blockingLogout}</span>
        </div>
      )}

      {/* Filters */}
      <div className="card p-4 space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-primary-muted" />
            <input
              type="text"
              placeholder="Search by name, email, or IP address..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-primary-border rounded-lg focus:ring-2 focus:ring-primary-accent focus:border-primary-accent outline-none bg-primary-bg text-primary-fg"
            />
          </div>

          {/* Type Filter */}
          <div className="flex gap-2">
            {['all', 'login', 'logout'].map((type) => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filterType === type
                    ? 'bg-primary-accent text-white'
                    : 'bg-primary-bg text-primary-fg border border-primary-border hover:bg-primary-accent-light'
                }`}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Activities List */}
      {filteredActivities.length === 0 ? (
        <div className="card p-12 text-center">
          <Clock className="h-12 w-12 text-primary-muted mx-auto mb-4" />
          <p className="text-primary-muted">
            {searchQuery || filterType !== "all" 
              ? "No activities match your filters." 
              : "No user activities recorded yet."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredActivities.map((activity) => (
            <div
              key={activity.id}
              className={`card p-4 ${
                activity.activityType === 'login' 
                  ? 'border-l-4 border-l-green-500' 
                  : 'border-l-4 border-l-red-500'
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    {activity.activityType === 'login' ? (
                      <LogIn className="h-5 w-5 text-green-600" />
                    ) : (
                      <LogOut className="h-5 w-5 text-red-600" />
                    )}
                    <span className={`px-3 py-1 rounded text-sm font-medium ${
                      activity.activityType === 'login'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {activity.activityType.toUpperCase()}
                    </span>
                    {activity.hasPendingTasks && (
                      <span className="px-2 py-1 rounded text-xs font-medium bg-yellow-100 text-yellow-800 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {activity.pendingTasksCount} pending task(s)
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-4 mb-2">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-primary-muted" />
                      <span className="font-semibold text-primary-fg">
                        {activity.userName || 'Unknown User'}
                      </span>
                    </div>
                    {activity.userEmail && (
                      <div className="flex items-center gap-2">
                        <Mail className="h-3 w-3 text-primary-muted" />
                        <span className="text-sm text-primary-muted">{activity.userEmail}</span>
                      </div>
                    )}
                  </div>

                  {activity.ipAddress && (
                    <div className="text-sm text-primary-muted mb-1">
                      IP: {activity.ipAddress}
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-xs text-primary-muted mt-3 pt-3 border-t border-primary-border">
                    <Calendar className="h-3 w-3" />
                    <span>{formatDate(activity.createdAt)}</span>
                  </div>
                </div>

                {activity.activityType === 'login' && (
                  <button
                    onClick={() => handleForceLogout(activity.userId, activity.userEmail || 'user')}
                    className="ml-4 px-3 py-1 text-sm bg-red-50 text-red-600 rounded hover:bg-red-100 transition-colors"
                    title="Force logout this user (will check for pending tasks)"
                  >
                    Force Logout
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

