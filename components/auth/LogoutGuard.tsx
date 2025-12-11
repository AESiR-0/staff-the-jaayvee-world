"use client";

import { useEffect, useState } from "react";
import { X, CheckSquare, AlertCircle } from "lucide-react";
import { authenticatedFetch } from "@/lib/auth-utils";
import { API_BASE_URL } from "@/lib/api";
import { useRouter } from "next/navigation";

interface IncompleteTask {
  id: string;
  title: string;
  deadline: string;
}

export default function LogoutGuard() {
  const [incompleteTasks, setIncompleteTasks] = useState<IncompleteTask[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [checking, setChecking] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Intercept logout attempts
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      checkCurrentDayTasks(e);
    };

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // Check if clicking logout button/link
      if (target.closest('[href*="logout"]') || target.closest('[data-logout]')) {
        e.preventDefault();
        e.stopPropagation();
        checkCurrentDayTasks(e);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('click', handleClick, true);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('click', handleClick, true);
    };
  }, []);

  const checkCurrentDayTasks = async (e?: Event) => {
    try {
      setChecking(true);
      const response = await authenticatedFetch(`${API_BASE_URL}/api/team/tasks/current-day`);
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data.hasIncompleteTasks) {
          e?.preventDefault();
          setIncompleteTasks(data.data.tasks);
          setShowModal(true);
          
          // Prevent navigation
          if (e && 'returnValue' in e) {
            (e as any).returnValue = 'You have incomplete tasks with deadlines today. Please complete them before logging out.';
          }
        }
      }
    } catch (error) {
      console.error('Error checking current day tasks:', error);
    } finally {
      setChecking(false);
    }
  };

  const handleForceLogout = () => {
    // Allow logout but warn
    if (confirm('Are you sure you want to logout with incomplete tasks? This will be logged.')) {
      setShowModal(false);
      // Proceed with logout
      window.location.href = '/api/team/auth/logout';
    }
  };

  return (
    <>
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full">
            <div className="p-6 border-b">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-6 w-6 text-red-600" />
                <h2 className="text-xl font-semibold text-primary-fg">Cannot Logout</h2>
              </div>
            </div>
            <div className="p-6">
              <p className="text-primary-fg mb-4">
                You have incomplete tasks with deadlines today. Please complete them before logging out.
              </p>
              <div className="space-y-2 mb-4">
                {incompleteTasks.map((task) => (
                  <div key={task.id} className="flex items-center gap-2 p-2 bg-red-50 rounded">
                    <CheckSquare className="h-4 w-4 text-red-600" />
                    <span className="text-sm text-primary-fg">{task.title}</span>
                    <span className="text-xs text-red-600 ml-auto">
                      Due: {new Date(task.deadline).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowModal(false);
                    router.push('/tasks');
                  }}
                  className="px-4 py-2 bg-primary-accent text-white rounded-lg hover:bg-primary-accent-dark"
                >
                  Go to Tasks
                </button>
                <button
                  onClick={handleForceLogout}
                  className="px-4 py-2 border border-red-500 text-red-500 rounded-lg hover:bg-red-50"
                >
                  Force Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

