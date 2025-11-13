"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check if user is authenticated
    const checkAuth = async () => {
      try {
        // Check for authentication token or session
        const token = localStorage.getItem("authToken");
        const userSession = localStorage.getItem("userSession");
        
        if (token && userSession) {
          // User is authenticated, redirect to dashboard
          router.push("/dashboard");
        } else {
          // User is not authenticated, redirect to login
          router.push("/login");
        }
      } catch (error) {
        // If there's an error checking auth, redirect to login
        router.push("/login");
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [router]);

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

  return null; // Will redirect before this renders
}

