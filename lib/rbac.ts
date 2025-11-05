// Simple mail-based RBAC for staff dashboard tabs

export type TabKey = 'dashboard' | 'wallet' | 'qr' | 'referrals' | 'events' | 'coupons' | 'sellers' | 'downline' | 'tasks';

// Staff Permissions - List of all available permissions for staff
export const STAFF_PERMISSIONS = {
  dashboard: {
    action: 'access',
    resource: 'dashboard',
    description: 'Access to the main dashboard',
    tab: 'dashboard' as TabKey,
  },
  wallet: {
    action: 'access',
    resource: 'wallet',
    description: 'Access to wallet management',
    tab: 'wallet' as TabKey,
  },
  qr: {
    action: 'access',
    resource: 'qr',
    description: 'Access to QR code management',
    tab: 'qr' as TabKey,
  },
  referrals: {
    action: 'access',
    resource: 'referrals',
    description: 'Access to referrals management',
    tab: 'referrals' as TabKey,
  },
  events: {
    action: 'access',
    resource: 'events',
    description: 'Access to events management',
    tab: 'events' as TabKey,
  },
  coupons: {
    action: 'access',
    resource: 'coupons',
    description: 'Access to coupons management',
    tab: 'coupons' as TabKey,
  },
  sellers: {
    action: 'access',
    resource: 'sellers',
    description: 'Access to sellers management',
    tab: 'sellers' as TabKey,
  },
  downline: {
    action: 'access',
    resource: 'downline',
    description: 'Access to downline management',
    tab: 'downline' as TabKey,
  },
  tasks: {
    action: 'access',
    resource: 'tasks',
    description: 'Access to task management',
    tab: 'tasks' as TabKey,
  },
  creation: {
    action: 'access',
    resource: 'creation',
    description: 'Permission to create tasks',
    tab: 'tasks' as TabKey,
  },
} as const;

// Array of all permission keys for easy iteration
export const STAFF_PERMISSION_LIST = Object.values(STAFF_PERMISSIONS).map(perm => ({
  action: perm.action,
  resource: perm.resource,
  description: perm.description,
}));

// Map route to tab key
export const routeToTabKey: Record<string, TabKey> = {
  '/dashboard': 'dashboard',
  '/wallet': 'wallet',
  '/qr': 'qr',
  '/referrals': 'referrals',
  '/events': 'events',
  '/coupons': 'coupons',
  '/sellers/create': 'sellers',
  '/downline': 'downline',
  '/tasks': 'tasks',
};

// Access control list: list of emails allowed per tab.
// Use '*' to allow everyone.
export const ACCESS_CONTROL: Record<TabKey, string[] | ['*']> = {
  dashboard: ['*'],
  wallet: ['*'],
  qr: ['*'],
  referrals: ['*'],
  events: ['*'],
  coupons: ['*'],
  sellers: ['*'],
  downline: ['*'],
  tasks: ['*'],
};

// Optional deny list per tab (takes precedence over allow list)
const ACCESS_DENY: Partial<Record<TabKey, string[]>> = {
  events: ['v1sales.thejaayveeworld@gmail.com'],
  coupons: ['v1sales.thejaayveeworld@gmail.com'],
  qr: ['v1sales.thejaayveeworld@gmail.com'],
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


