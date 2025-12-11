"use client";

import { useState, useEffect } from "react";
import { Bell } from "lucide-react";
import { authenticatedFetch } from "@/lib/auth-utils";
import { API_BASE_URL } from "@/lib/api";

interface Notification {
  id: string;
  taskId: string;
  task: {
    id: string;
    title: string;
    status: string;
  };
  notificationType: string;
  scheduledFor: string;
  isRead: boolean;
}

export default function TaskNotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000); // Check every minute
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    // Play sound for new notifications
    if (notifications.length > 0 && soundEnabled) {
      const unread = notifications.filter(n => !n.isRead);
      if (unread.length > 0) {
        playNotificationSound();
      }
    }
  }, [notifications, soundEnabled]);

  const fetchNotifications = async () => {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/api/team/tasks/notifications?unreadOnly=true`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setNotifications(data.data || []);
          setUnreadCount(data.unreadCount || 0);

          // Show browser notifications for new unread
          if (data.data && data.data.length > 0 && 'Notification' in window && Notification.permission === 'granted') {
            data.data.forEach((notification: Notification) => {
              if (!notification.isRead) {
                new Notification('Task Deadline Reminder', {
                  body: `Task "${notification.task.title}" deadline approaching`,
                  icon: '/favicon.ico',
                  tag: notification.id,
                });
              }
            });
          }
        }
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const playNotificationSound = () => {
    try {
      const audio = new Audio('/notification-sound.mp3'); // You'll need to add this sound file
      audio.play().catch(() => {
        // Fallback: use Web Audio API to generate a beep
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.value = 800;
        oscillator.type = 'sine';

        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.5);
      });
    } catch (error) {
      console.error('Error playing notification sound:', error);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/api/team/tasks/notifications/${notificationId}/mark-read`, {
        method: 'POST',
      });

      if (response.ok) {
        setNotifications(prev => prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n));
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="relative p-2 hover:bg-primary-bg rounded-lg transition-colors"
      >
        <Bell className="h-5 w-5 text-primary-fg" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {showDropdown && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-primary-border z-50 max-h-96 overflow-y-auto">
          <div className="p-4 border-b border-primary-border flex justify-between items-center">
            <h3 className="font-semibold text-primary-fg">Notifications</h3>
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="text-xs text-primary-muted hover:text-primary-fg"
            >
              {soundEnabled ? '🔊' : '🔇'}
            </button>
          </div>
          <div className="divide-y divide-primary-border">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-primary-muted text-sm">
                No notifications
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 hover:bg-primary-bg cursor-pointer ${!notification.isRead ? 'bg-blue-50' : ''}`}
                  onClick={() => {
                    markAsRead(notification.id);
                    window.location.href = `/tasks`;
                  }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-primary-fg">{notification.task.title}</p>
                      <p className="text-xs text-primary-muted mt-1">
                        Deadline: {new Date(notification.scheduledFor).toLocaleString()}
                      </p>
                    </div>
                    {!notification.isRead && (
                      <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1"></span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

