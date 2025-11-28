"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import NotificationPopup from "./NotificationPopup";
import { playNotificationSound } from "@/lib/sound-utils";
import { authenticatedFetch, getTeamSession } from "@/lib/auth-utils";
import { API_BASE_URL } from "@/lib/api";
import { fetchTasksForReminders, getTaskReminders, formatTimeRemaining, TaskReminder } from "@/lib/task-reminder";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

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

interface NotificationManagerProps {
  onMarkAsRead?: (id: string) => void;
}

// localStorage keys
const STORAGE_KEYS = {
  SHOWN_IDS: 'notification_shown_ids',
  DISMISSED_REMINDERS: 'notification_dismissed_reminders',
};

export default function NotificationManager({ onMarkAsRead }: NotificationManagerProps) {
  const [activeNotifications, setActiveNotifications] = useState<Notification[]>([]);
  const shownIdsRef = useRef<Set<string>>(new Set());
  const dismissedRemindersRef = useRef<Set<string>>(new Set());
  const isInitializedRef = useRef(false);
  const subscriptionRef = useRef<any>(null);

  // Load persisted data from localStorage
  const loadPersistedData = useCallback(() => {
    if (typeof window === 'undefined') return;

    try {
      // Load shown notification IDs
      const shownIdsStr = localStorage.getItem(STORAGE_KEYS.SHOWN_IDS);
      if (shownIdsStr) {
        const ids = JSON.parse(shownIdsStr);
        shownIdsRef.current = new Set(ids);
        console.log('📦 Loaded', ids.length, 'shown notification IDs');
      }

      // Load dismissed reminder IDs
      const dismissedStr = localStorage.getItem(STORAGE_KEYS.DISMISSED_REMINDERS);
      if (dismissedStr) {
        const ids = JSON.parse(dismissedStr);
        dismissedRemindersRef.current = new Set(ids);
        console.log('📦 Loaded', ids.length, 'dismissed reminder IDs');
      }
    } catch (error) {
      console.error('❌ Error loading persisted data:', error);
    }
  }, []);

  // Save shown IDs to localStorage
  const saveShownIds = useCallback(() => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEYS.SHOWN_IDS, JSON.stringify(Array.from(shownIdsRef.current)));
    } catch (error) {
      console.error('❌ Error saving shown IDs:', error);
    }
  }, []);

  // Save dismissed reminders to localStorage
  const saveDismissedReminders = useCallback(() => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEYS.DISMISSED_REMINDERS, JSON.stringify(Array.from(dismissedRemindersRef.current)));
    } catch (error) {
      console.error('❌ Error saving dismissed reminders:', error);
    }
  }, []);

  // Initialize on mount
  useEffect(() => {
    if (!isInitializedRef.current) {
      loadPersistedData();
      isInitializedRef.current = true;
    }
  }, [loadPersistedData]);

  // Mark notifications as popped in database
  const markAsPopped = useCallback(async (notificationIds: string[]) => {
    try {
      const baseUrl = API_BASE_URL || 'https://thejaayveeworld.com';
      const response = await authenticatedFetch(`${baseUrl}/api/notifications/pop`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationIds }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          console.log('✅ Marked', notificationIds.length, 'notifications as popped in DB');
        }
      }
    } catch (error) {
      console.error('❌ Error marking notifications as popped:', error);
    }
  }, []);

  // Fetch initial notifications on mount (one-time, not polling)
  const fetchInitialNotifications = useCallback(async () => {
    try {
      const baseUrl = API_BASE_URL || 'https://thejaayveeworld.com';  
      console.log('📡 Fetching initial unpopped notifications from:', `${baseUrl}/api/notifications`);
      const response = await authenticatedFetch(`${baseUrl}/api/notifications?limit=10&excludePopped=true`);
      
      if (!response.ok) {
        console.log('❌ Failed to fetch initial notifications:', response.status);
        return;
      }

      const data = await response.json();
      if (!data.success || !data.data) return;

      const notifications = data.data as Notification[];
      const unreadNotifications = notifications.filter(n => !n.isRead);

      if (unreadNotifications.length > 0) {
        console.log('✨ Found', unreadNotifications.length, 'initial unpopped notifications');
        
        // Mark as popped in database immediately
        const notificationIds = unreadNotifications.map(n => n.id);
        await markAsPopped(notificationIds);

        // Also mark in localStorage as backup
        unreadNotifications.forEach(n => {
          shownIdsRef.current.add(n.id);
        });
        saveShownIds();

        // Add to active notifications
        setActiveNotifications(prev => {
          const existingIds = new Set(prev.map(n => n.id));
          const toAdd = unreadNotifications.filter(n => !existingIds.has(n.id));
          return [...prev, ...toAdd];
        });

        // Play sound for each new notification
        unreadNotifications.forEach(() => playNotificationSound());
      }
    } catch (error) {
      console.error('❌ Error fetching initial notifications:', error);
    }
  }, [saveShownIds, markAsPopped]);

  // Check for task reminders (one-time on mount, not polling)
  const checkTaskReminders = useCallback(async () => {
    try {
      const tasks = await fetchTasksForReminders();
      const reminders = getTaskReminders(tasks);

      const remindersToShow = reminders.filter(r => {
        const wasDismissed = dismissedRemindersRef.current.has(r.task.id);
        const isActive = activeNotifications.some(n => n.id === `task-reminder-${r.task.id}`);
        return !wasDismissed && !isActive && (r.isUrgent || r.timeUntilDeadline <= 120);
      });

      if (remindersToShow.length > 0) {
        const reminderNotifications: Notification[] = remindersToShow.map(reminder => ({
          id: `task-reminder-${reminder.task.id}`,
          type: 'task' as const,
          title: reminder.isUrgent ? '⚠️ Urgent Task Reminder' : '📋 Task Reminder',
          message: `${reminder.task.title} - Deadline in ${formatTimeRemaining(reminder.timeUntilDeadline)}`,
          isRead: false,
          metadata: { taskId: reminder.task.id, isReminder: true },
          createdAt: new Date().toISOString(),
        }));

        setActiveNotifications(prev => {
          const existingIds = new Set(prev.map(n => n.id));
          const toAdd = reminderNotifications.filter(n => !existingIds.has(n.id));
          return [...prev, ...toAdd];
        });

        reminderNotifications.forEach(() => playNotificationSound());
      }
    } catch (error) {
      console.error('❌ Error checking task reminders:', error);
    }
  }, [activeNotifications]);

  // Remove notification
  const removeNotification = useCallback((id: string) => {
    console.log('🗑️ Removing notification:', id);
    
    setActiveNotifications(prev => prev.filter(n => n.id !== id));

    // Handle task reminders
    if (id.startsWith('task-reminder-')) {
      const taskId = id.replace('task-reminder-', '');
      dismissedRemindersRef.current.add(taskId);
      saveDismissedReminders();
      console.log('✅ Dismissed task reminder:', taskId);
    } else {
      // Regular notifications - mark as shown
      shownIdsRef.current.add(id);
      saveShownIds();
      console.log('✅ Marked notification as shown:', id);
    }
  }, [saveShownIds, saveDismissedReminders]);

  // Mark as read
  const handleMarkAsRead = useCallback(async (id: string) => {
    // Task reminders don't need API call
    if (id.startsWith('task-reminder-')) {
      removeNotification(id);
      return;
    }

    try {
      // Notifications API is on the main site
      const baseUrl = API_BASE_URL || 'https://thejaayveeworld.com';
      const response = await authenticatedFetch(`${baseUrl}/api/notifications/read`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationIds: [id] }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          shownIdsRef.current.add(id);
          saveShownIds();
          if (onMarkAsRead) onMarkAsRead(id);
        }
      }
    } catch (error) {
      console.error('❌ Error marking as read:', error);
    }

    removeNotification(id);
  }, [removeNotification, onMarkAsRead, saveShownIds]);

  // Set up Supabase Realtime subscription for notifications
  useEffect(() => {
    if (!isInitializedRef.current) return;

    const session = getTeamSession();
    const userId = session?.userId || session?.teamId || session?.staffId;
    
    if (!userId) {
      console.warn('⚠️ No userId found in session, cannot set up Realtime subscription');
      return;
    }

    // Check if Supabase is configured
    if (!isSupabaseConfigured || !supabase) {
      console.warn('⚠️ Supabase not configured. Realtime notifications require Supabase.');
      return;
    }

    console.log('🔌 Setting up Supabase Realtime subscription for user:', userId);

    // Fetch initial notifications once on mount
    fetchInitialNotifications();
    checkTaskReminders();

    // Set up Realtime subscription
    // Filter: userId matches AND poppedAt IS NULL AND isRead = false
    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        async (payload) => {
          const newNotification = payload.new as any;
          
          // Only process if not popped and not read
          if (newNotification.popped_at === null && !newNotification.is_read) {
            console.log('✨ New notification received via Realtime:', newNotification);
            
            const notification: Notification = {
              id: newNotification.id,
              type: newNotification.type,
              title: newNotification.title,
              message: newNotification.message,
              isRead: newNotification.is_read,
              metadata: newNotification.metadata,
              createdAt: newNotification.created_at,
              readAt: newNotification.read_at,
            };

            // Check if already shown
            if (shownIdsRef.current.has(notification.id)) {
              console.log('⏭️ Notification already shown, skipping:', notification.id);
              return;
            }

            // Check if already active
            setActiveNotifications(prev => {
              const isActive = prev.some(n => n.id === notification.id);
              if (isActive) {
                console.log('⏭️ Notification already active, skipping:', notification.id);
                return prev;
              }

              // Mark as popped in database
              markAsPopped([notification.id]);

              // Mark in localStorage
              shownIdsRef.current.add(notification.id);
              saveShownIds();

              // Play sound
              playNotificationSound();

              return [...prev, notification];
            });
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const updatedNotification = payload.new as any;
          
          // If notification was marked as read or popped, remove from active
          if (updatedNotification.is_read || updatedNotification.popped_at !== null) {
            setActiveNotifications(prev => 
              prev.filter(n => n.id !== updatedNotification.id)
            );
          }
        }
      )
      .subscribe((status, err) => {
        if (status === 'SUBSCRIBED') {
          console.log('✅ Successfully subscribed to notifications');
        } else if (status === 'CHANNEL_ERROR') {
          // Handle error gracefully - Supabase might not be configured or connection failed
          console.warn('⚠️ Realtime channel error - notifications will still work via polling', err);
          // Don't throw error, just log warning
        } else if (status === 'TIMED_OUT') {
          console.warn('⚠️ Realtime subscription timed out - notifications will still work via polling');
        } else if (status === 'CLOSED') {
          console.log('📡 Realtime subscription closed');
        }
      });

    subscriptionRef.current = channel;

    return () => {
      console.log('🔌 Cleaning up Realtime subscription');
      if (subscriptionRef.current && supabase) {
        supabase.removeChannel(subscriptionRef.current);
        subscriptionRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isInitializedRef.current]);

  return (
    <>
      {activeNotifications.map((notification, index) => (
        <div
          key={notification.id}
          className="fixed"
          style={{
            top: `${16 + index * 120}px`,
            right: '16px',
            zIndex: 50 - index,
          }}
        >
          <NotificationPopup
            notification={notification}
            onClose={() => removeNotification(notification.id)}
            onMarkAsRead={handleMarkAsRead}
          />
        </div>
      ))}
    </>
  );
}

