"use client";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Sidebar from "./Sidebar";
import NotificationPanel from "./NotificationPanel";
import NotificationManager from "./NotificationManager";
import { FeedbackModal } from "./FeedbackModal";
import LogoutGuard from "./auth/LogoutGuard";
import TaskNotificationBell from "./tasks/TaskNotificationBell";

interface ConditionalLayoutProps {
  children: React.ReactNode;
}

export default function ConditionalLayout({ children }: ConditionalLayoutProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    // Check if user is authenticated
    const checkAuth = () => {
      try {
        if (typeof window !== 'undefined') {
          const token = localStorage.getItem("authToken");
          const userSession = localStorage.getItem("userSession");
          
          if (token && userSession) {
            setIsAuthenticated(true);
          } else {
            setIsAuthenticated(false);
            // Redirect to login if not authenticated and not already on login page
            if (pathname !== "/login" && pathname !== "/auth") {
              router.push("/login");
            }
          }
        } else {
          setIsAuthenticated(false);
        }
      } catch (error) {
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [pathname, router]);

  // Show loading state briefly
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-primary-bg text-primary-fg">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-primary-accent border-t-transparent rounded-full animate-spin" />
          <p className="text-primary-muted">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't show sidebar on login/auth pages
  if (pathname === "/login" || pathname === "/auth") {
    return <>{children}</>;
  }

  // Show sidebar for all other pages
  return (
    <div className="min-h-screen bg-primary-bg text-primary-fg">
      <Sidebar />
      <main className="lg:ml-64">
        {/* Header with Notifications */}
        <div className="sticky top-0 z-30 bg-white border-b border-primary-border px-6 py-4 flex items-center justify-end gap-4">
          <TaskNotificationBell />
          <NotificationPanel />
        </div>
        <div className="p-6">
          {children}
        </div>
      </main>
      {/* Notification Popup Manager */}
      <NotificationManager />
      {/* Feedback Modal */}
      <FeedbackModal source="staff" />
      {/* Logout Guard */}
      <LogoutGuard />
    </div>
  );
}

