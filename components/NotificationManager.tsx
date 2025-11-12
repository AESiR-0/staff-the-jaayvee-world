"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import NotificationPopup from "./NotificationPopup";
import { playNotificationSound } from "@/lib/sound-utils";
import { authenticatedFetch } from "@/lib/auth-utils";
import { API_BASE_URL } from "@/lib/api";
import { fetchTasksForReminders, getTaskReminders, formatTimeRemaining, TaskReminder } from "@/lib/task-reminder";

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

  // Fetch and process notifications
  const fetchNotifications = useCallback(async () => {
    try {
      // Use API_BASE_URL from lib/api.ts - notifications API is on the main site
      // For local dev: Set NEXT_PUBLIC_API_BASE_URL=http://localhost:3000 in .env.local
      const baseUrl = API_BASE_URL || 'https://thejaayveeworld.com';  
      console.log('📡 Fetching notifications from:', `${baseUrl}/api/notifications`);
      const response = await authenticatedFetch(`${baseUrl}/api/notifications?limit=10`);
      
      if (!response.ok) {
        console.log('❌ Failed to fetch notifications:', response.status);
        return;
      }

      const data = await response.json();
      if (!data.success || !data.data) return;

      const notifications = data.data as Notification[];
      const unreadNotifications = notifications.filter(n => !n.isRead);

      // Filter out notifications that have already been shown
      const newNotifications = unreadNotifications.filter(n => {
        const wasShown = shownIdsRef.current.has(n.id);
        const isActive = activeNotifications.some(active => active.id === n.id);
        return !wasShown && !isActive;
      });

      if (newNotifications.length > 0) {
        console.log('✨ Found', newNotifications.length, 'new notifications');
        
        // Mark as shown immediately
        newNotifications.forEach(n => {
          shownIdsRef.current.add(n.id);
        });
        saveShownIds();

        // Add to active notifications
        setActiveNotifications(prev => {
          const existingIds = new Set(prev.map(n => n.id));
          const toAdd = newNotifications.filter(n => !existingIds.has(n.id));
          return [...prev, ...toAdd];
        });

        // Play sound for each new notification
        newNotifications.forEach(() => playNotificationSound());
      }
    } catch (error) {
      console.error('❌ Error fetching notifications:', error);
    }
  }, [activeNotifications, saveShownIds]);

  // Check for task reminders
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

  // Fetch only on page load/refresh (no polling, no event listeners)
  useEffect(() => {
    if (!isInitializedRef.current) return;

    // Fetch once after a short delay to allow page to load
    const timeout = setTimeout(() => {
      console.log('🔄 Fetching notifications on page load');
      checkTaskReminders();
    }, 1000);

    return () => {
      clearTimeout(timeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isInitializedRef.current]); // Only run once when initialized

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
