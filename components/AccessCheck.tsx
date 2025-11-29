"use client";

import { useEffect, useState, ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { getTeamSession, getAuthToken } from "@/lib/auth-utils";
import { checkHasAccess } from "@/lib/permissions";

interface AccessCheckProps {
  resource?: string;
  children: ReactNode;
  fallback?: ReactNode;
  showLoading?: boolean;
  requireSuperAdmin?: boolean;
}

/**
 * Component that checks user access to a resource before rendering children
 * Shows loading state while checking, and access denied message if no access
 */
export default function AccessCheck({
  resource,
  children,
  fallback,
  showLoading = true,
  requireSuperAdmin = false,
}: AccessCheckProps) {
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkAccess = async () => {
      try {
        setChecking(true);
        const session = getTeamSession();
        const userEmail = session?.email;

        if (!userEmail) {
          setHasAccess(false);
          setChecking(false);
          return;
        }

        const token = getAuthToken();
        if (!token) {
          setHasAccess(false);
          setChecking(false);
          return;
        }

        // If no resource specified but requireSuperAdmin, just check admin status
        if (!resource && requireSuperAdmin) {
          const { isSuperAdmin } = await import('@/lib/rbac');
          const isAdmin = await isSuperAdmin(userEmail);
          setHasAccess(isAdmin);
          setChecking(false);
          return;
        }

        if (!resource) {
          setHasAccess(false);
          setChecking(false);
          return;
        }

        const { checkHasAccessClient } = await import('@/lib/permissions');
        const result = await checkHasAccessClient(userEmail, resource, token, requireSuperAdmin);
        setHasAccess(result.hasAccess);
      } catch (error) {
        console.error("Error checking access:", error);
        setHasAccess(false);
      } finally {
        setChecking(false);
      }
    };

    checkAccess();
  }, [resource, requireSuperAdmin]);

  if (checking && showLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-gray-600">Checking permissions...</p>
        </div>
      </div>
    );
  }

  if (!hasAccess) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-red-800 mb-2">Access Denied</h2>
            <p className="text-red-600">
              You don&apos;t have permission to access this page. Please contact an administrator.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

