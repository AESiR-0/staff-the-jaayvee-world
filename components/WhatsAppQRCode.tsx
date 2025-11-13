'use client';

import { useState, useEffect } from 'react';
import { CheckCircle, Loader2 } from 'lucide-react';

interface WhatsAppQRCodeProps {
  onAuthenticated?: () => void;
}

export default function WhatsAppQRCode({ onAuthenticated }: WhatsAppQRCodeProps) {
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkAuthStatus();
    const interval = setInterval(checkAuthStatus, 3000); // Check every 3 seconds

    return () => clearInterval(interval);
  }, []);

  const checkAuthStatus = async () => {
    try {
      const response = await fetch('/api/whatsapp/auth?action=status');
      const data = await response.json();

      if (data.success) {
        if (data.data.authenticated) {
          setAuthenticated(true);
          setQrCode(null);
          setLoading(false);
          if (onAuthenticated) {
            onAuthenticated();
          }
        } else {
          // Not authenticated, get QR code
          if (!qrCode) {
            await fetchQRCode();
          }
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to check authentication status');
      setLoading(false);
    }
  };

  const fetchQRCode = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/whatsapp/auth?action=qr');
      const data = await response.json();

      if (data.success) {
        if (data.data.qr) {
          setQrCode(data.data.qr);
        }
        setAuthenticated(data.data.authenticated || false);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to get QR code');
    } finally {
      setLoading(false);
    }
  };

  if (authenticated) {
    return (
      <div className="flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-lg">
        <CheckCircle className="h-5 w-5 text-green-600" />
        <span className="text-green-800 font-medium">WhatsApp is authenticated and ready</span>
      </div>
    );
  }

  if (loading && !qrCode) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary-accent" />
        <span className="ml-2 text-primary-fg">Checking authentication...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-800">{error}</p>
        <button
          onClick={fetchQRCode}
          className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white border border-primary-border rounded-lg">
      <h3 className="text-lg font-semibold text-primary-fg mb-2">Scan QR Code to Authenticate</h3>
      <p className="text-sm text-primary-muted mb-4">
        Open WhatsApp on your phone, go to Settings → Linked Devices, and scan this QR code
      </p>
      {qrCode ? (
        <div className="flex justify-center">
          <img
            src={qrCode}
            alt="WhatsApp QR Code"
            className="border border-primary-border rounded-lg"
          />
        </div>
      ) : (
        <div className="flex items-center justify-center p-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary-accent" />
          <span className="ml-2 text-primary-fg">Loading QR code...</span>
        </div>
      )}
      <p className="text-xs text-primary-muted mt-4 text-center">
        The page will automatically update when authentication is complete
      </p>
    </div>
  );
}


