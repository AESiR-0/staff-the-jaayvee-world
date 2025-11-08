"use client";

import { useState, useEffect } from "react";
import { Bell, Check, CheckCheck, X, CheckSquare, TrendingUp, Wallet, Info, Loader2, Filter, Trash2 } from "lucide-react";
import { authenticatedFetch } from "@/lib/auth-utils";
import { API_BASE_URL } from "@/lib/api";
import { formatDistanceToNow, format } from "date-fns";

interface Notification {
  id: string;
  type: 'update' | 'task' | 'referral_earning' | 'wallet_transaction';
  title: string;
  message: string;
  isRead: boolean;
  metadata?: any;
  createdAt: string;
  readAt?: string | null;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'update' | 'task' | 'referral_earning' | 'wallet_transaction'>('all');

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await authenticatedFetch(`${API_BASE_URL}/api/notifications?limit=100`);
      const data = await response.json();
      
      if (data.success) {
        setNotifications(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  // Mark notification as read
  const markAsRead = async (notificationId: string) => {
    try {
      const url = `${API_BASE_URL}/api/notifications`;
      console.log('Marking notification as read:', url, notificationId);
      
      const response = await authenticatedFetch(url, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ notificationIds: [notificationId] }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to mark as read:', response.status, errorText);
        throw new Error(`Failed to mark notification as read: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        // Update local state immediately for better UX
        setNotifications(prev =>
          prev.map(n =>
            n.id === notificationId
              ? { ...n, isRead: true, readAt: new Date().toISOString() }
              : n
          )
        );
      } else {
        console.error('API returned error:', data.error);
        throw new Error(data.error || 'Failed to mark notification as read');
      }
    } catch (error: any) {
      console.error('Error marking notification as read:', error);
      alert(`Error: ${error.message || 'Failed to mark notification as read'}`);
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      const url = `${API_BASE_URL}/api/notifications`;
      console.log('Marking all notifications as read:', url);
      
      const response = await authenticatedFetch(url, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ markAllAsRead: true }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to mark all as read:', response.status, errorText);
        throw new Error(`Failed to mark all as read: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        // Refresh notifications to get updated data from server
        await fetchNotifications();
      } else {
        console.error('API returned error:', data.error);
        throw new Error(data.error || 'Failed to mark all notifications as read');
      }
    } catch (error: any) {
      console.error('Error marking all as read:', error);
      alert(`Error: ${error.message || 'An error occurred while marking notifications as read'}`);
    }
  };

  // Get icon for notification type
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'task':
        return <CheckSquare className="h-5 w-5" />;
      case 'referral_earning':
        return <TrendingUp className="h-5 w-5" />;
      case 'wallet_transaction':
        return <Wallet className="h-5 w-5" />;
      case 'update':
        return <Info className="h-5 w-5" />;
      default:
        return <Bell className="h-5 w-5" />;
    }
  };

  // Get color for notification type
  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'task':
        return 'bg-blue-100 text-blue-600';
      case 'referral_earning':
        return 'bg-green-100 text-green-600';
      case 'wallet_transaction':
        return 'bg-purple-100 text-purple-600';
      case 'update':
        return 'bg-yellow-100 text-yellow-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  // Get type label
  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'task':
        return 'Task';
      case 'referral_earning':
        return 'Referral Earnings';
      case 'wallet_transaction':
        return 'Wallet Transaction';
      case 'update':
        return 'Update';
      default:
        return 'Notification';
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  // Filter notifications
  const filteredNotifications = notifications.filter(n => {
    if (filter === 'unread' && n.isRead) return false;
    if (filter === 'read' && !n.isRead) return false;
    if (typeFilter !== 'all' && n.type !== typeFilter) return false;
    return true;
  });

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="card">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-primary-fg flex items-center gap-2">
              <Bell className="h-6 w-6" />
              Notifications
            </h1>
            <p className="text-primary-muted mt-1">
              {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}` : 'All caught up!'}
            </p>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="btn-primary flex items-center gap-2"
            >
              <CheckCheck className="h-4 w-4" />
              Mark all as read
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-primary-muted" />
            <span className="text-sm font-medium text-primary-fg">Status:</span>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className="px-3 py-1.5 border border-primary-border rounded-lg bg-primary-bg text-primary-fg text-sm focus:outline-none focus:ring-2 focus:ring-primary-accent"
            >
              <option value="all">All</option>
              <option value="unread">Unread</option>
              <option value="read">Read</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-primary-fg">Type:</span>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as any)}
              className="px-3 py-1.5 border border-primary-border rounded-lg bg-primary-bg text-primary-fg text-sm focus:outline-none focus:ring-2 focus:ring-primary-accent"
            >
              <option value="all">All Types</option>
              <option value="update">Updates</option>
              <option value="task">Tasks</option>
              <option value="referral_earning">Referral Earnings</option>
              <option value="wallet_transaction">Wallet Transactions</option>
            </select>
          </div>
        </div>

        {/* Notifications List */}
        {loading ? (
          <div className="text-center py-12">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary-accent" />
            <p className="text-primary-muted">Loading notifications...</p>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="text-center py-12">
            <Bell className="h-12 w-12 mx-auto mb-4 text-primary-muted" />
            <p className="text-primary-fg font-medium mb-1">No notifications</p>
            <p className="text-primary-muted text-sm">
              {filter !== 'all' || typeFilter !== 'all'
                ? 'No notifications match your filters'
                : 'You\'re all caught up!'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-4 border rounded-lg transition-colors ${
                  !notification.isRead
                    ? 'border-primary-accent bg-blue-50'
                    : 'border-primary-border bg-primary-bg hover:bg-primary-accent-light'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`p-2.5 rounded-lg ${getNotificationColor(notification.type)} flex-shrink-0`}>
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className={`font-semibold ${!notification.isRead ? 'text-primary-fg' : 'text-primary-muted'}`}>
                            {notification.title}
                          </h3>
                          <span className="text-xs px-2 py-0.5 bg-primary-accent-light text-primary-accent rounded">
                            {getTypeLabel(notification.type)}
                          </span>
                        </div>
                        <p className="text-sm text-primary-muted mb-2">
                          {notification.message}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-primary-muted">
                          <span>
                            {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                          </span>
                          <span>
                            {format(new Date(notification.createdAt), 'MMM d, yyyy h:mm a')}
                          </span>
                          {notification.isRead && notification.readAt && (
                            <span className="text-green-600">
                              Read {formatDistanceToNow(new Date(notification.readAt), { addSuffix: true })}
                            </span>
                          )}
                        </div>
                      </div>
                      {!notification.isRead && (
                        <button
                          onClick={() => markAsRead(notification.id)}
                          className="p-2 hover:bg-primary-accent-light rounded-lg transition-colors flex-shrink-0"
                          title="Mark as read"
                        >
                          <Check className="h-4 w-4 text-primary-muted" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

