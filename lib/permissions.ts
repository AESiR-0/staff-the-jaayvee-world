'use server';

/**
 * Server-side function to check if a user has access to a resource
 * Fetches directly from the main API
 */

export interface HasAccessResult {
  hasAccess: boolean;
  reason: 'super_admin' | 'rbac_permission' | 'no_permission' | 'user_not_found';
}

/**
 * Check if user is super admin (with fallback)
 * @param email - User email
 * @returns Promise with admin status
 */
async function checkIsSuperAdmin(email: string): Promise<boolean> {
  try {
    // Dynamic import to avoid SSR issues
    const { isSuperAdmin } = await import('@/lib/rbac');
    return await isSuperAdmin(email);
  } catch (error) {
    console.error('Error checking super admin:', error);
    return false;
  }
}

/**
 * Server action to check if a user has access to a specific resource
 * Checks super admin first, then RBAC permissions
 * @param email - User email
 * @param resource - Resource name (e.g., 'careers', 'gallery', 'layouts', 'whatsapp-bulk', 'events', 'tasks', 'sellers', 'downline')
 * @param token - Authentication token
 * @param requireSuperAdmin - If true, only super admins can access (for admin-only pages)
 * @returns Promise with access result
 */
export async function checkHasAccess(
  email: string,
  resource: string,
  token: string,
  requireSuperAdmin: boolean = false
): Promise<HasAccessResult> {
  try {
    // First check if user is super admin
    const isAdmin = await checkIsSuperAdmin(email);
    
    if (isAdmin) {
      return { hasAccess: true, reason: 'super_admin' };
    }
    
    // If page requires super admin, deny access
    if (requireSuperAdmin) {
      return { hasAccess: false, reason: 'no_permission' };
    }

    // Check RBAC permissions via API
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://talaash.thejaayveeworld.com';
    
    const response = await fetch(
      `${API_BASE_URL}/api/has-access?email=${encodeURIComponent(email)}&resource=${encodeURIComponent(resource)}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        // Add cache for better performance
        next: { revalidate: 300 }, // Cache for 5 minutes
      }
    );

    if (!response.ok) {
      console.error('Failed to check access:', response.status, response.statusText);
      return { hasAccess: false, reason: 'no_permission' };
    }

    const data = await response.json();
    
    if (data.success && data.data) {
      return {
        hasAccess: data.data.hasAccess,
        reason: data.data.reason || 'no_permission',
      };
    }

    return { hasAccess: false, reason: 'no_permission' };
  } catch (error) {
    console.error('Error checking access:', error);
    return { hasAccess: false, reason: 'no_permission' };
  }
}

/**
 * Client-side function to check access (uses browser fetch)
 * Checks super admin first, then RBAC permissions
 * @param email - User email
 * @param resource - Resource name
 * @param token - Authentication token
 * @param requireSuperAdmin - If true, only super admins can access
 * @returns Promise with access result
 */
export async function checkHasAccessClient(
  email: string,
  resource: string,
  token: string,
  requireSuperAdmin: boolean = false
): Promise<HasAccessResult> {
  try {
    // First check if user is super admin
    const { isSuperAdmin } = await import('@/lib/rbac');
    const isAdmin = await isSuperAdmin(email);
    
    if (isAdmin) {
      return { hasAccess: true, reason: 'super_admin' };
    }
    
    // If page requires super admin, deny access
    if (requireSuperAdmin) {
      return { hasAccess: false, reason: 'no_permission' };
    }

    // Check RBAC permissions via API
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://talaash.thejaayveeworld.com';
    
    const response = await fetch(
      `${API_BASE_URL}/api/has-access?email=${encodeURIComponent(email)}&resource=${encodeURIComponent(resource)}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      console.error('Failed to check access:', response.status, response.statusText);
      return { hasAccess: false, reason: 'no_permission' };
    }

    const data = await response.json();
    
    if (data.success && data.data) {
      return {
        hasAccess: data.data.hasAccess,
        reason: data.data.reason || 'no_permission',
      };
    }

    return { hasAccess: false, reason: 'no_permission' };
  } catch (error) {
    console.error('Error checking access:', error);
    return { hasAccess: false, reason: 'no_permission' };
  }
}

