"use client";

import { useState, useEffect } from "react";
import { CheckSquare, Clock, PlayCircle, ArrowRight } from "lucide-react";
import { authenticatedFetch } from "@/lib/auth-utils";
import { format, isToday, parseISO } from "date-fns";
import Link from "next/link";

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: 'not_started' | 'in_progress' | 'completed';
  assignedTo: string | null;
  assignedToName: string | null;
  assignedAt: string | null;
  deadline: string | null;
  createdBy: string;
  createdByName: string | null;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
}

export function TasksWidget() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://talaash.thejaayveeworld.com';
      const response = await authenticatedFetch(`${API_BASE_URL}/api/team/tasks`);

      if (!response.ok) {
        throw new Error('Failed to fetch tasks');
      }

      const result = await response.json();
      if (result.success) {
        const allTasks = result.data || [];
        
        // Filter tasks: today's deadline or in progress
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        const filteredTasks = allTasks.filter((task: Task) => {
          if (task.status === 'in_progress') {
            return true;
          }
          // Show tasks with deadline today
          if (task.deadline) {
            const deadlineDate = parseISO(task.deadline);
            const deadlineStart = new Date(deadlineDate);
            deadlineStart.setHours(0, 0, 0, 0);
            if (deadlineStart.getTime() === today.getTime()) {
              return true;
            }
          }
          // Show tasks completed today
          if (task.status === 'completed' && task.completedAt) {
            const completedDate = parseISO(task.completedAt);
            return isToday(completedDate);
          }
          return false;
        });

        // Sort: in_progress first, then by created date
        filteredTasks.sort((a: Task, b: Task) => {
          if (a.status === 'in_progress' && b.status !== 'in_progress') return -1;
          if (a.status !== 'in_progress' && b.status === 'in_progress') return 1;
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });

        // Limit to 5 most recent
        setTasks(filteredTasks.slice(0, 5));
      }
    } catch (err: any) {
      console.error('Error fetching tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'in_progress':
        return <PlayCircle className="h-4 w-4 text-blue-500" />;
      case 'completed':
        return <CheckSquare className="h-4 w-4 text-green-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'in_progress':
        return 'bg-blue-100 text-blue-600';
      case 'completed':
        return 'bg-green-100 text-green-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  if (loading) {
    return (
      <div className="card">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-primary-accent-light rounded-xl flex items-center justify-center">
            <CheckSquare className="text-primary-accent" size={20} />
          </div>
          <h2 className="text-lg font-semibold text-primary-fg">Tasks</h2>
        </div>
        <div className="text-center py-8">
          <div className="w-6 h-6 border-2 border-primary-accent border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-sm text-primary-muted">Loading tasks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary-accent-light rounded-xl flex items-center justify-center">
            <CheckSquare className="text-primary-accent" size={20} />
          </div>
          <h2 className="text-lg font-semibold text-primary-fg">Tasks</h2>
        </div>
        <Link
          href="/tasks"
          className="text-sm text-primary-accent hover:text-primary-accent-dark flex items-center gap-1"
        >
          View All
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      {tasks.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-sm text-primary-muted">No tasks due today or in progress</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tasks.map((task) => (
            <div
              key={task.id}
              className="border border-primary-border rounded-lg p-3 hover:bg-primary-accent-light/30 transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {getStatusIcon(task.status)}
                    <h3 className="font-semibold text-primary-fg text-sm truncate">{task.title}</h3>
                  </div>
                  {task.description && (
                    <p className="text-xs text-primary-muted line-clamp-1 mb-2">
                      {task.description}
                    </p>
                  )}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusBadge(task.status)}`}>
                      {task.status.replace('_', ' ')}
                    </span>
                    {task.assignedToName && (
                      <span className="text-xs text-primary-muted">
                        Assigned to: {task.assignedToName}
                        {task.assignedAt && (
                          <span className="ml-1">({format(parseISO(task.assignedAt), "MMM dd, HH:mm")})</span>
                        )}
                      </span>
                    )}
                    {task.deadline && (
                      <span className={`text-xs ${new Date(task.deadline) < new Date() && task.status !== 'completed' ? 'text-red-500 font-medium' : 'text-primary-muted'}`}>
                        Deadline: {format(parseISO(task.deadline), "MMM dd, HH:mm")}
                      </span>
                    )}
                    {task.completedAt && (
                      <span className="text-xs text-primary-muted">
                        Completed: {format(parseISO(task.completedAt), "HH:mm")}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


