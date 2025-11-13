// Simple mail-based RBAC for team dashboard tabs

export type TabKey = 'dashboard' | 'wallet' | 'qr' | 'referrals' | 'events' | 'coupons' | 'sellers' | 'downline' | 'tasks' | 'gallery' | 'layouts' | 'careers';

// Permission type from API
export interface Permission {
  id: string;
  action: string;
  resource: string;
  isActive: boolean;
}

// Cache for user permissions
let userPermissionsCache: Permission[] | null = null;
let permissionsCacheTime: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Team Permissions - List of all available permissions for team
export const TEAM_PERMISSIONS = {
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
  gallery: {
    action: 'access',
    resource: 'gallery',
    description: 'Access to gallery management',
    tab: 'gallery' as TabKey,
  },
  layouts: {
    action: 'access',
    resource: 'layouts',
    description: 'Access to layout management',
    tab: 'layouts' as TabKey,
  },
  careers: {
    action: 'access',
    resource: 'careers',
    description: 'Access to career management',
    tab: 'careers' as TabKey,
  },
  'event-financials': {
    action: 'access',
    resource: 'event-financials',
    description: 'Access to event financial planning',
    tab: 'events' as TabKey,
  },
  'event-financials-edit': {
    action: 'edit',
    resource: 'event-financials',
    description: 'Edit event financial data',
    tab: 'events' as TabKey,
  },
  'event-financials-export': {
    action: 'export',
    resource: 'event-financials',
    description: 'Export event financial reports',
    tab: 'events' as TabKey,
  },
} as const;

// Array of all permission keys for easy iteration
export const TEAM_PERMISSION_LIST = Object.values(TEAM_PERMISSIONS).map(perm => ({
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
  '/gallery': 'gallery',
  '/layouts': 'layouts',
  '/careers': 'careers',
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
  gallery: ['*'],
  layouts: ['*'],
  careers: ['*'],
};

// Super admin emails - these have access to everything
const SUPER_ADMIN_EMAILS = [
  'thejaayveeworldofficial@gmail.com',
  'md.thejaayveeworld@gmail.com',
];

// Auto-ensure super admin has all permissions in database
let superAdminEnsured = false;
const ensureSuperAdminInDB = async () => {
  if (superAdminEnsured || typeof window === 'undefined') return;
  
  try {
    const { getTeamSession } = await import('@/lib/auth-utils');
    const session = getTeamSession();
    const userEmail = session?.email?.toLowerCase();
    
    if (userEmail === 'thejaayveeworldofficial@gmail.com' && !superAdminEnsured) {
      superAdminEnsured = true;
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://talaash.thejaayveeworld.com';
      const { authenticatedFetch } = await import('@/lib/auth-utils');
      
      // Call RBAC API which will auto-assign all permissions
      await authenticatedFetch(`${API_BASE_URL}/api/rbac?type=users`);
    }
  } catch (err) {
    // Silently fail - this is just a convenience feature
    console.debug('Auto-ensure super admin permissions:', err);
    superAdminEnsured = false; // Reset on error to retry
  }
};

// Optional deny list per tab (takes precedence over allow list)
const ACCESS_DENY: Partial<Record<TabKey, string[]>> = {
  events: ['v1sales.thejaayveeworld@gmail.com'],
  coupons: ['v1sales.thejaayveeworld@gmail.com'],
  qr: ['v1sales.thejaayveeworld@gmail.com'],
};

/**
 * Check if an email is a super admin
 */
export function isSuperAdmin(email?: string | null): boolean {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();
  return SUPER_ADMIN_EMAILS.map(e => e.toLowerCase()).includes(normalized);
}

/**
 * Fetch user permissions from RBAC API
 */
export async function fetchUserPermissions(): Promise<Permission[]> {
  // Auto-ensure super admin permissions before fetching
  await ensureSuperAdminInDB();
  
  // Check cache first
  const now = Date.now();
  if (userPermissionsCache && (now - permissionsCacheTime) < CACHE_DURATION) {
    return userPermissionsCache;
  }

  try {
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://talaash.thejaayveeworld.com';
    
    // Dynamic import to avoid SSR issues
    const { authenticatedFetch } = await import('@/lib/auth-utils');
    const response = await authenticatedFetch(`${API_BASE_URL}/api/rbac?type=users`);
    
    if (response.ok) {
      const data = await response.json();
      if (data.success && data.data?.users) {
        // Get current user's email
        const { getTeamSession } = await import('@/lib/auth-utils');
        const session = getTeamSession();
        const userEmail = session?.email;
        
        if (userEmail) {
          // Find current user in the users list
          const currentUser = data.data.users.find((u: any) => 
            u.email?.toLowerCase() === userEmail.toLowerCase()
          );
          
          if (currentUser && currentUser.permissions) {
            const permissions = currentUser.permissions.map((p: any) => ({
              id: p.id,
              action: p.action,
              resource: p.resource,
              isActive: p.isActive !== false
            }));
            userPermissionsCache = permissions;
            permissionsCacheTime = now;
            return permissions;
          }
        }
      }
    }
  } catch (err) {
    console.error('Error fetching user permissions:', err);
  }
  
  // Return empty array on error (fallback to email-based check)
  return [];
}

/**
 * Check if user has permission for a specific resource
 */
export async function hasPermission(resource: string): Promise<boolean> {
  const permissions = await fetchUserPermissions();
  return permissions.some(p => 
    p.resource === resource && 
    p.action === 'access' && 
    p.isActive
  );
}

/**
 * Clear permissions cache (useful after permission updates)
 */
export function clearPermissionsCache(): void {
  userPermissionsCache = null;
  permissionsCacheTime = 0;
}

export function canAccess(tab: TabKey, email?: string | null): boolean {
  // Super admins have access to everything
  if (isSuperAdmin(email)) {
    return true;
  }
  
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

/**
 * Check access using RBAC API (async version)
 */
export async function canAccessRBAC(tab: TabKey): Promise<boolean> {
  // First try to check via API permissions
  try {
    const permissions = await fetchUserPermissions();
    if (permissions.length > 0) {
      // Check if user has permission for this tab
      const hasAccess = permissions.some(p => 
        p.resource === tab && 
        p.action === 'access' && 
        p.isActive
      );
      return hasAccess;
    }
  } catch (err) {
    console.error('Error checking RBAC permissions, falling back to email-based check:', err);
  }
  
  // Fallback to email-based check
  if (typeof window !== 'undefined') {
    const { getTeamSession } = require('@/lib/auth-utils');
    const session = getTeamSession();
    return canAccess(tab, session?.email);
  }
  
  return false;
}



