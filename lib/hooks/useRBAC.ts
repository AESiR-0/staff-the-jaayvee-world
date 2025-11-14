import { useState, useEffect } from 'react';
import { fetchUserPermissions, Permission, canAccessRBAC } from '@/lib/rbac';

interface UseRBACResult {
  permissions: Permission[];
  loading: boolean;
  error: Error | null;
  hasPermission: (resource: string, action?: string) => boolean;
  canAccess: (tab: string) => Promise<boolean>;
  refresh: () => Promise<void>;
}

/**
 * React hook for RBAC permissions with loading states
 */
export function useRBAC(): UseRBACResult {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadPermissions = async () => {
    try {
      setLoading(true);
      setError(null);
      const perms = await fetchUserPermissions();
      setPermissions(perms);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to load permissions');
      setError(error);
      console.error('Error loading RBAC permissions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPermissions();
  }, []);

  const hasPermission = (resource: string, action: string = 'access'): boolean => {
    return permissions.some(
      p => p.resource === resource && p.action === action && p.isActive
    );
  };

  const canAccess = async (tab: string): Promise<boolean> => {
    return canAccessRBAC(tab as any);
  };

  const refresh = async () => {
    await loadPermissions();
  };

  return {
    permissions,
    loading,
    error,
    hasPermission,
    canAccess,
    refresh,
  };
}

