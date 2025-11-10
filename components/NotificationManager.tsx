"use client";

import { useState, useEffect, useRef } from "react";
import NotificationPopup from "./NotificationPopup";
import { playNotificationSound } from "@/lib/sound-utils";
import { authenticatedFetch } from "@/lib/auth-utils";
import { API_BASE_URL } from "@/lib/api";
import { fetchTasksForReminders, getTaskReminders, formatTimeRemaining, TaskReminder } from "@/lib/task-reminder";
import { CheckSquare, Clock } from "lucide-react";

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

export default function NotificationManager({ onMarkAsRead }: NotificationManagerProps) {
  const [activeNotifications, setActiveNotifications] = useState<Notification[]>([]);
  const [taskReminders, setTaskReminders] = useState<TaskReminder[]>([]);
  const [shownReminderIds, setShownReminderIds] = useState<Set<string>>(new Set());
  const lastNotificationIds = useRef<Set<string>>(new Set());
  const lastReminderCheck = useRef<number>(0);

  // Fetch notifications and check for new ones
  const checkForNewNotifications = async () => {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/api/notifications?limit=5`);
      if (!response.ok) return;

      const data = await response.json();
      if (data.success && data.data) {
        const notifications = data.data as Notification[];
        const unreadNotifications = notifications.filter(n => !n.isRead);
        
        // Find new notifications that haven't been shown yet
        const newNotifications = unreadNotifications.filter(
          n => !lastNotificationIds.current.has(n.id)
        );

        // Add new notifications to active popups
        if (newNotifications.length > 0) {
          newNotifications.forEach(notification => {
            lastNotificationIds.current.add(notification.id);
            setActiveNotifications(prev => {
              // Avoid duplicates
              if (prev.some(n => n.id === notification.id)) {
                return prev;
              }
              return [...prev, notification];
            });
            // Play sound for new notification
            playNotificationSound();
          });
        }
      }
    } catch (error) {
      console.error('Error checking for new notifications:', error);
    }
  };

  // Check for task reminders
  const checkTaskReminders = async () => {
    try {
      const tasks = await fetchTasksForReminders();
      const reminders = getTaskReminders(tasks);
      
      // Filter reminders:
      // - Show new reminders (not shown before)
      // - Re-show urgent reminders even if shown before (to keep reminding)
      const remindersToShow = reminders.filter(
        r => {
          const wasShown = shownReminderIds.has(r.task.id);
          // Show if: not shown before, or urgent (re-show urgent reminders)
          return (!wasShown && (r.isUrgent || r.timeUntilDeadline <= 120)) || (wasShown && r.isUrgent);
        }
      );

      if (remindersToShow.length > 0) {
        remindersToShow.forEach(reminder => {
          // Only add to shown set if not urgent (urgent ones can be re-shown)
          if (!reminder.isUrgent) {
            setShownReminderIds(prev => new Set(prev).add(reminder.task.id));
          }
          
          // Check if a popup for this task already exists
          const reminderId = `task-reminder-${reminder.task.id}`;
          const alreadyShown = activeNotifications.some(n => n.id === reminderId);
          
          if (!alreadyShown) {
            // Create a notification-like popup for task reminder
            const reminderNotification: Notification = {
              id: reminderId,
              type: 'task',
              title: reminder.isUrgent ? '⚠️ Urgent Task Reminder' : '📋 Task Reminder',
              message: `${reminder.task.title} - Deadline in ${formatTimeRemaining(reminder.timeUntilDeadline)}`,
              isRead: false,
              metadata: { taskId: reminder.task.id, isReminder: true },
              createdAt: new Date().toISOString(),
            };

            setActiveNotifications(prev => {
              if (prev.some(n => n.id === reminderNotification.id)) {
                return prev;
              }
              return [...prev, reminderNotification];
            });
            
            // Play sound for task reminder
            playNotificationSound();
          }
        });
      }

      setTaskReminders(reminders);
    } catch (error) {
      console.error('Error checking task reminders:', error);
    }
  };

  // Remove notification from active popups
  const removeNotification = (id: string) => {
    setActiveNotifications(prev => prev.filter(n => n.id !== id));
  };

  // Handle mark as read
  const handleMarkAsRead = async (id: string) => {
    // Don't mark task reminders as read via API
    if (id.startsWith('task-reminder-')) {
      removeNotification(id);
      return;
    }

    try {
      // Mark notification as read via API
      const response = await authenticatedFetch(`${API_BASE_URL}/api/notifications`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ notificationIds: [id] }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // Also call the callback if provided
          if (onMarkAsRead) {
            onMarkAsRead(id);
          }
        }
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
    
    removeNotification(id);
  };

  // Set up polling for notifications and task reminders
  useEffect(() => {
    // Initial check after a short delay to allow page to load
    const initialTimeout = setTimeout(() => {
      checkForNewNotifications();
      checkTaskReminders();
    }, 2000);

    // Poll for new notifications every 30 seconds
    const notificationInterval = setInterval(checkForNewNotifications, 30000);

    // Check task reminders every 2 minutes (more frequent for better UX)
    const taskReminderInterval = setInterval(() => {
      const now = Date.now();
      // Check reminders every 2 minutes
      if (now - lastReminderCheck.current >= 2 * 60 * 1000) {
        lastReminderCheck.current = now;
        checkTaskReminders();
      }
    }, 60000); // Check every minute, but only process if 2 minutes passed

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(notificationInterval);
      clearInterval(taskReminderInterval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

