"use client";

import { useState, useEffect, useRef } from "react";
import { Bell, Check, CheckCheck, X, CheckSquare, TrendingUp, Wallet, Info, Loader2 } from "lucide-react";
import { authenticatedFetch } from "@/lib/auth-utils";
import { API_BASE_URL } from "@/lib/api";
import { formatDistanceToNow } from "date-fns";

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

export default function NotificationPanel() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const panelRef = useRef<HTMLDivElement>(null);

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      // Ensure URL is properly formatted (handle empty API_BASE_URL for relative URLs)
      const baseUrl = API_BASE_URL || (typeof window !== 'undefined' ? window.location.origin : '');
      const url = `${baseUrl}/api/notifications?limit=20`;
      console.log('Fetching notifications:', url);
      console.log('API_BASE_URL:', API_BASE_URL);
      console.log('Base URL used:', baseUrl);
      
      const response = await authenticatedFetch(url);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to fetch notifications:', response.status, errorText);
        throw new Error(`Failed to fetch notifications: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        setNotifications(data.data || []);
        setUnreadCount(data.unreadCount || 0);
      } else {
        console.error('API returned error:', data.error);
      }
    } catch (error: any) {
      console.error('Error fetching notifications:', error);
      // Log network errors with more detail
      if (error.message?.includes('Network error') || error.message?.includes('Failed to fetch')) {
        console.error('Network error - check API_BASE_URL configuration:', API_BASE_URL);
        console.error('Make sure NEXT_PUBLIC_API_BASE_URL is set correctly in .env.local');
      }
      // Don't show alert in dropdown, just log
    } finally {
      setLoading(false);
    }
  };

  // Mark notification as read
  const markAsRead = async (notificationId: string) => {
    try {
      const baseUrl = API_BASE_URL || (typeof window !== 'undefined' ? window.location.origin : '');
      const response = await authenticatedFetch(`${baseUrl}/api/notifications`, {
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
        setUnreadCount(prev => Math.max(0, prev - 1));
      } else {
        console.error('API returned error:', data.error);
      }
    } catch (error: any) {
      console.error('Error marking notification as read:', error);
      // Optionally show a toast notification here
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      const baseUrl = API_BASE_URL || (typeof window !== 'undefined' ? window.location.origin : '');
      const url = `${baseUrl}/api/notifications`;
      console.log('Marking all notifications as read:', url);
      console.log('API_BASE_URL:', API_BASE_URL);
      console.log('Base URL used:', baseUrl);
      
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
      // Show user-friendly error message
      if (error.message?.includes('Network error') || error.message?.includes('Failed to fetch')) {
        console.error('Network error - check API_BASE_URL configuration:', API_BASE_URL);
      }
      // Don't show alert in dropdown, just log
    }
  };

  // Get icon for notification type
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'task':
        return <CheckSquare className="h-4 w-4" />;
      case 'referral_earning':
        return <TrendingUp className="h-4 w-4" />;
      case 'wallet_transaction':
        return <Wallet className="h-4 w-4" />;
      case 'update':
        return <Info className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
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

  // Close panel when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Fetch notifications on mount and set up polling
  useEffect(() => {
    fetchNotifications();
    
    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell Icon Button */}
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) {
            fetchNotifications();
          }
        }}
        className="relative p-2 rounded-lg hover:bg-primary-accent-light transition-colors"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5 text-primary-fg" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Panel */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-primary-border rounded-lg shadow-lg z-50 max-h-96 flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-primary-border flex items-center justify-between">
            <h3 className="font-semibold text-primary-fg">Notifications</h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs text-primary-accent hover:text-primary-accent-dark flex items-center gap-1"
                  title="Mark all as read"
                >
                  <CheckCheck className="h-3 w-3" />
                  Mark all read
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-primary-accent-light rounded"
              >
                <X className="h-4 w-4 text-primary-muted" />
              </button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center">
                <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-primary-accent" />
                <p className="text-sm text-primary-muted">Loading notifications...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell className="h-8 w-8 mx-auto mb-2 text-primary-muted" />
                <p className="text-sm text-primary-muted">No notifications</p>
              </div>
            ) : (
              <div className="divide-y divide-primary-border">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 hover:bg-primary-accent-light transition-colors ${
                      !notification.isRead ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${getNotificationColor(notification.type)}`}>
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <p className={`text-sm font-medium ${!notification.isRead ? 'text-primary-fg' : 'text-primary-muted'}`}>
                              {notification.title}
                            </p>
                            <p className="text-xs text-primary-muted mt-1">
                              {notification.message}
                            </p>
                            <p className="text-xs text-primary-muted mt-1">
                              {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                            </p>
                          </div>
                          {!notification.isRead && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                markAsRead(notification.id);
                              }}
                              className="p-1 hover:bg-primary-accent rounded transition-colors"
                              title="Mark as read"
                            >
                              <Check className="h-3 w-3 text-primary-muted" />
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

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-3 border-t border-primary-border text-center">
              <a
                href="/notifications"
                className="text-xs text-primary-accent hover:text-primary-accent-dark inline-block"
              >
                View all notifications
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

