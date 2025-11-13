"use client";

import { useState, useEffect } from "react";
import { X, Download } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if already installed
    const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches;
    if (isStandaloneMode) {
      setIsStandalone(true);
      console.log('[PWA] Already in standalone mode');
      return;
    }

    // Check if iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIOSDevice);
    console.log('[PWA] iOS device:', isIOSDevice);

    // Check if prompt was previously dismissed
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    if (dismissed) {
      const dismissedTime = parseInt(dismissed, 10);
      const daysSinceDismissed = (Date.now() - dismissedTime) / (1000 * 60 * 60 * 24);
      console.log('[PWA] Dismissed', daysSinceDismissed, 'days ago');
      // Show again after 7 days
      if (daysSinceDismissed < 7) {
        console.log('[PWA] Not showing - dismissed recently');
        // Don't show if dismissed recently
        return;
      }
    }

    // For iOS, show immediately (they don't have beforeinstallprompt)
    if (isIOSDevice) {
      console.log('[PWA] Showing iOS prompt');
      setShowPrompt(true);
      return;
    }

    // Listen for the beforeinstallprompt event (Android/Chrome)
    const handleBeforeInstallPrompt = (e: Event) => {
      console.log('[PWA] beforeinstallprompt event received');
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Also show prompt after a delay if beforeinstallprompt hasn't fired
    // This helps if the event doesn't fire immediately or the app is installable
    const timeoutId = setTimeout(() => {
      console.log('[PWA] Timeout reached, showing prompt');
      // Show prompt even if beforeinstallprompt hasn't fired
      // Users can still install via browser menu
      setShowPrompt(true);
    }, 2000);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      clearTimeout(timeoutId);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      // Show the native install prompt
      try {
        await deferredPrompt.prompt();
        // Wait for the user to respond
        const { outcome } = await deferredPrompt.userChoice;

        if (outcome === 'accepted') {
          console.log('User accepted the install prompt');
          setShowPrompt(false);
        } else {
          console.log('User dismissed the install prompt');
        }

        // Clear the deferred prompt
        setDeferredPrompt(null);
      } catch (error) {
        console.error('Error showing install prompt:', error);
        // Fall through to manual install instructions
      }
    }
    
    // If no deferred prompt or it failed, show manual instructions
    // This is a fallback for browsers that support install but don't fire beforeinstallprompt
    setShowPrompt(false);
    alert('To install this app:\n\n1. Look for the install icon in your browser\'s address bar\n2. Or use the browser menu (three dots) and select "Install app" or "Add to Home Screen"');
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
  };

  // Don't show if already installed
  if (isStandalone) {
    return null;
  }

  // Don't show if prompt should not be shown
  if (!showPrompt) {
    return null;
  }

  if (isIOS) {
    return (
      <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-50">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-semibold text-gray-900">Install Jaayvee Staff</h3>
          <button
            onClick={handleDismiss}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <p className="text-sm text-gray-600 mb-3">
          Install Jaayvee Staff on your iOS device for a better experience:
        </p>
        <ol className="text-sm text-gray-700 space-y-1 mb-3 list-decimal list-inside">
          <li>Tap the Share button</li>
          <li>Scroll down and tap &quot;Add to Home Screen&quot;</li>
          <li>Tap &quot;Add&quot; to confirm</li>
        </ol>
        <button
          onClick={handleDismiss}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          Got it
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-50">
      <div className="flex items-start justify-between mb-2">
        <h3 className="font-semibold text-gray-900">Install Jaayvee Staff</h3>
        <button
          onClick={handleDismiss}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      <p className="text-sm text-gray-600 mb-3">
        Install Jaayvee Staff app on your device for quick access and a better experience.
      </p>
      <div className="flex gap-2">
        <button
          onClick={handleInstallClick}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          <Download className="h-4 w-4" />
          Install Now
        </button>
        <button
          onClick={handleDismiss}
          className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors text-sm font-medium"
        >
          Maybe Later
        </button>
      </div>
    </div>
  );
}


