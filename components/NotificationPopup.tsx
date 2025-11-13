"use client";

import { useState, useEffect } from "react";
import { X, Bell, CheckSquare, TrendingUp, Wallet, Info } from "lucide-react";
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

interface NotificationPopupProps {
  notification: Notification;
  onClose: () => void;
  onMarkAsRead?: (id: string) => void;
}

export default function NotificationPopup({ notification, onClose, onMarkAsRead }: NotificationPopupProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Trigger animation
    setIsVisible(true);
    
    // Auto-close after 5 seconds
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300); // Wait for animation
    }, 5000);

    return () => clearTimeout(timer);
  }, [onClose]);

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

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'task':
        return 'bg-blue-100 text-blue-600 border-blue-200';
      case 'referral_earning':
        return 'bg-green-100 text-green-600 border-green-200';
      case 'wallet_transaction':
        return 'bg-purple-100 text-purple-600 border-purple-200';
      case 'update':
        return 'bg-yellow-100 text-yellow-600 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  const handleMarkAsRead = () => {
    if (onMarkAsRead) {
      onMarkAsRead(notification.id);
    }
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  return (
    <div
      className={`w-96 max-w-[calc(100vw-2rem)] transition-all duration-300 ${
        isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      }`}
    >
      <div className={`bg-white border-2 rounded-lg shadow-lg p-4 ${getNotificationColor(notification.type)}`}>
        <div className="flex items-start gap-3">
          <div className={`p-2 rounded-lg ${getNotificationColor(notification.type)} flex-shrink-0`}>
            {getNotificationIcon(notification.type)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <h4 className="font-semibold text-sm text-gray-900 mb-1">
                  {notification.title}
                </h4>
                <p className="text-sm text-gray-700 mb-2">
                  {notification.message}
                </p>
                <p className="text-xs text-gray-500">
                  {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                </p>
              </div>
              <div className="flex items-start gap-1">
                {!notification.isRead && onMarkAsRead && (
                  <button
                    onClick={handleMarkAsRead}
                    className="p-1 hover:bg-white/50 rounded transition-colors"
                    title="Mark as read"
                  >
                    <X className="h-4 w-4 text-gray-600" />
                  </button>
                )}
                <button
                  onClick={() => {
                    setIsVisible(false);
                    setTimeout(onClose, 300);
                  }}
                  className="p-1 hover:bg-white/50 rounded transition-colors"
                  title="Close"
                >
                  <X className="h-4 w-4 text-gray-600" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


