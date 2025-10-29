// Simple mail-based RBAC for staff dashboard tabs

export type TabKey = 'dashboard' | 'qr' | 'referrals' | 'events' | 'coupons' | 'sellers';

// Map route to tab key
export const routeToTabKey: Record<string, TabKey> = {
  '/dashboard': 'dashboard',
  '/qr': 'qr',
  '/referrals': 'referrals',
  '/events': 'events',
  '/coupons': 'coupons',
  '/sellers/create': 'sellers',
};

// Access control list: list of emails allowed per tab.
// Use '*' to allow everyone.
export const ACCESS_CONTROL: Record<TabKey, string[] | ['*']> = {
  dashboard: ['*'],
  qr: ['*'],
  referrals: ['*'],
  events: ['*'],
  coupons: ['*'],
  sellers: ['*'],
};

// Optional deny list per tab (takes precedence over allow list)
const ACCESS_DENY: Partial<Record<TabKey, string[]>> = {
  events: ['v1sales.thejaayveeworld@gmail.com'],
  coupons: ['v1sales.thejaayveeworld@gmail.com'],
};

export function canAccess(tab: TabKey, email?: string | null): boolean {
  const allowed = ACCESS_CONTROL[tab];
  if (!allowed) return false;
  // Check deny list first
  if (email && ACCESS_DENY[tab]?.map(e => e.toLowerCase()).includes(email.trim().toLowerCase())) {
    return false;
  }
  if (allowed.length === 1 && allowed[0] === '*') return true;
  if (!email) return false;
  const normalized = email.trim().toLowerCase();
  return allowed.map(e => e.toLowerCase()).includes(normalized);
}


