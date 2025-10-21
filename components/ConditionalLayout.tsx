"use client";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";

interface ConditionalLayoutProps {
  children: React.ReactNode;
}

export default function ConditionalLayout({ children }: ConditionalLayoutProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const pathname = usePathname();

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
  }, [pathname]);

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

  // Don't show sidebar on login page
  if (pathname === "/login") {
    return <>{children}</>;
  }

  // Show sidebar for all other pages
  return (
    <div className="min-h-screen bg-primary-bg text-primary-fg">
      <Sidebar />
      <main className="lg:ml-64">
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
