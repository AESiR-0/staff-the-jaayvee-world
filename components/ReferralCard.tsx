import { QrCode, Users, MousePointer } from "lucide-react";

import { AffiliateStats } from "@/lib/types";

interface ReferralCardProps {
  data: AffiliateStats;
}

export function ReferralCard({ data }: ReferralCardProps) {
  return (
    <div className="card">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-primary-accent-light rounded-xl flex items-center justify-center">
          <QrCode className="text-primary-accent" size={20} />
        </div>
        <h2 className="text-lg font-semibold text-primary-fg">My Affiliate Code</h2>
      </div>
      
      <div className="space-y-4">
        <div>
          <p className="text-sm text-primary-muted mb-1">Affiliate Code</p>
          <p className="text-primary-accent font-bold text-2xl font-mono">{data.affiliateCode}</p>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            <MousePointer className="text-primary-muted" size={16} />
            <div>
              <p className="text-sm text-primary-muted">Clicks</p>
              <p className="font-semibold text-primary-fg">{data.totalClicks}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Users className="text-primary-muted" size={16} />
            <div>
              <p className="text-sm text-primary-muted">Signups</p>
              <p className="font-semibold text-primary-fg">{data.totalSignups}</p>
            </div>
          </div>
        </div>
        
        <div className="pt-2 border-t border-primary-border">
          <p className="text-xs text-primary-muted">
            Conversion Rate: {data.totalClicks > 0 ? ((data.totalSignups / data.totalClicks) * 100).toFixed(1) : 0}%
          </p>
        </div>
      </div>
    </div>
  );
}
