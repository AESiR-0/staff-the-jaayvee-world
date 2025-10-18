"use client";
import { useState } from "react";
import { QrCode, Users, MousePointer, TrendingUp, Copy, ExternalLink } from "lucide-react";

interface ReferralStats {
  referralCode: string;
  totalClicks: number;
  totalSignups: number;
  conversionRate: number;
  recentClicks: number;
  recentSignups: number;
}

interface ClickEvent {
  id: string;
  timestamp: string;
  source: string;
  userAgent: string;
  ip: string;
}

export default function ReferralsPage() {
  const [activeTab, setActiveTab] = useState<"overview" | "clicks" | "analytics">("overview");
  
  // Mock data
  const mockStats: ReferralStats = {
    referralCode: "TJ2024-STAFF-001",
    totalClicks: 156,
    totalSignups: 23,
    conversionRate: 14.7,
    recentClicks: 12,
    recentSignups: 3,
  };

  const mockClicks: ClickEvent[] = [
    {
      id: "1",
      timestamp: "2024-02-10T14:30:00Z",
      source: "Direct",
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      ip: "192.168.1.100",
    },
    {
      id: "2",
      timestamp: "2024-02-10T13:45:00Z", 
      source: "Social Media",
      userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X)",
      ip: "10.0.0.50",
    },
    {
      id: "3",
      timestamp: "2024-02-10T12:20:00Z",
      source: "Email",
      userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
      ip: "172.16.0.25",
    },
  ];

  const copyReferralCode = () => {
    navigator.clipboard.writeText(mockStats.referralCode);
    // You could add a toast notification here
  };

  const shareReferralLink = () => {
    const link = `https://jaayvee.world/ref/${mockStats.referralCode}`;
    navigator.clipboard.writeText(link);
    // You could add a toast notification here
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-primary-fg mb-2">Referral Management</h1>
        <p className="text-primary-muted">Track your referral performance and analytics</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-primary-accent-light p-1 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab("overview")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === "overview"
              ? "bg-white text-primary-accent shadow-soft"
              : "text-primary-muted hover:text-primary-fg"
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab("clicks")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === "clicks"
              ? "bg-white text-primary-accent shadow-soft"
              : "text-primary-muted hover:text-primary-fg"
          }`}
        >
          Click History
        </button>
        <button
          onClick={() => setActiveTab("analytics")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === "analytics"
              ? "bg-white text-primary-accent shadow-soft"
              : "text-primary-muted hover:text-primary-fg"
          }`}
        >
          Analytics
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="card">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary-accent-light rounded-xl flex items-center justify-center">
                  <QrCode className="text-primary-accent" size={20} />
                </div>
                <div>
                  <p className="text-sm text-primary-muted">Referral Code</p>
                  <p className="text-lg font-bold text-primary-fg">{mockStats.referralCode}</p>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary-accent-light rounded-xl flex items-center justify-center">
                  <MousePointer className="text-primary-accent" size={20} />
                </div>
                <div>
                  <p className="text-sm text-primary-muted">Total Clicks</p>
                  <p className="text-2xl font-bold text-primary-fg">{mockStats.totalClicks}</p>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary-accent-light rounded-xl flex items-center justify-center">
                  <Users className="text-primary-accent" size={20} />
                </div>
                <div>
                  <p className="text-sm text-primary-muted">Total Signups</p>
                  <p className="text-2xl font-bold text-primary-fg">{mockStats.totalSignups}</p>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary-accent-light rounded-xl flex items-center justify-center">
                  <TrendingUp className="text-primary-accent" size={20} />
                </div>
                <div>
                  <p className="text-sm text-primary-muted">Conversion Rate</p>
                  <p className="text-2xl font-bold text-primary-fg">{mockStats.conversionRate}%</p>
                </div>
              </div>
            </div>
          </div>

          {/* Referral Code Card */}
          <div className="card">
            <h2 className="text-lg font-semibold text-primary-fg mb-4">Your Referral Code</h2>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <p className="text-sm text-primary-muted mb-1">Referral Code</p>
                  <p className="text-primary-accent font-bold text-2xl font-mono">{mockStats.referralCode}</p>
                </div>
                <button
                  onClick={copyReferralCode}
                  className="btn-primary flex items-center gap-2"
                >
                  <Copy size={16} />
                  Copy Code
                </button>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <p className="text-sm text-primary-muted mb-1">Referral Link</p>
                  <p className="text-primary-fg font-mono text-sm">
                    https://jaayvee.world/ref/{mockStats.referralCode}
                  </p>
                </div>
                <button
                  onClick={shareReferralLink}
                  className="border border-primary-border text-primary-fg px-4 py-2 rounded-xl hover:bg-primary-accent-light transition-colors flex items-center gap-2"
                >
                  <ExternalLink size={16} />
                  Copy Link
                </button>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="card">
            <h2 className="text-lg font-semibold text-primary-fg mb-4">Recent Activity</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-primary-fg">Recent Clicks (24h)</p>
                  <p className="text-xs text-primary-muted">Last 24 hours</p>
                </div>
                <p className="text-lg font-semibold text-primary-accent">{mockStats.recentClicks}</p>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-primary-fg">Recent Signups (24h)</p>
                  <p className="text-xs text-primary-muted">Last 24 hours</p>
                </div>
                <p className="text-lg font-semibold text-primary-accent">{mockStats.recentSignups}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "clicks" && (
        <div className="card">
          <h2 className="text-lg font-semibold text-primary-fg mb-4">Click History</h2>
          <div className="space-y-4">
            {mockClicks.map((click) => (
              <div key={click.id} className="border border-primary-border rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-medium text-primary-fg">
                    {new Date(click.timestamp).toLocaleString()}
                  </p>
                  <span className="px-2 py-1 bg-primary-accent-light text-primary-accent rounded-full text-xs font-medium">
                    {click.source}
                  </span>
                </div>
                <div className="text-sm text-primary-muted space-y-1">
                  <p>IP: {click.ip}</p>
                  <p className="truncate">User Agent: {click.userAgent}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "analytics" && (
        <div className="space-y-6">
          <div className="card">
            <h2 className="text-lg font-semibold text-primary-fg mb-4">Performance Metrics</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-primary-accent-light rounded-xl">
                <p className="text-3xl font-bold text-primary-accent">{mockStats.totalClicks}</p>
                <p className="text-sm text-primary-muted">Total Clicks</p>
              </div>
              <div className="text-center p-4 bg-primary-accent-light rounded-xl">
                <p className="text-3xl font-bold text-primary-accent">{mockStats.totalSignups}</p>
                <p className="text-sm text-primary-muted">Total Signups</p>
              </div>
              <div className="text-center p-4 bg-primary-accent-light rounded-xl">
                <p className="text-3xl font-bold text-primary-accent">{mockStats.conversionRate}%</p>
                <p className="text-sm text-primary-muted">Conversion Rate</p>
              </div>
            </div>
          </div>

          <div className="card">
            <h2 className="text-lg font-semibold text-primary-fg mb-4">Conversion Funnel</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-primary-fg">Clicks</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 bg-border rounded-full h-2">
                    <div className="bg-primary-accent h-2 rounded-full w-full" />
                  </div>
                  <span className="text-sm font-medium text-primary-fg">{mockStats.totalClicks}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-primary-fg">Signups</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 bg-border rounded-full h-2">
                    <div 
                      className="bg-primary-accent h-2 rounded-full" 
                      style={{ width: `${(mockStats.totalSignups / mockStats.totalClicks) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-primary-fg">{mockStats.totalSignups}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
