"use client";

import { useState, useEffect } from "react";
import { ArrowRight, GitBranch, CheckCircle, Clock, Lock } from "lucide-react";
import { authenticatedFetch, getTeamSession } from "@/lib/auth-utils";
import { API_BASE_URL } from "@/lib/api";
import Link from "next/link";

interface Dependency {
  id: string;
  taskId: string;
  task: {
    id: string;
    title: string;
    status: string;
  };
  isRequired: boolean;
}

export default function TaskDependenciesPage({ params }: { params: Promise<{ taskId: string }> }) {
  const [taskId, setTaskId] = useState<string>('');
  const [parentTasks, setParentTasks] = useState<Dependency[]>([]);
  const [childTasks, setChildTasks] = useState<Dependency[]>([]);
  const [currentTask, setCurrentTask] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    params.then((p) => setTaskId(p.taskId));
  }, [params]);

  useEffect(() => {
    if (taskId) {
      fetchDependencies();
    }
  }, [taskId]);

  const fetchDependencies = async () => {
    if (!taskId) return;
    try {
      setLoading(true);
      const response = await authenticatedFetch(`${API_BASE_URL}/api/team/tasks/${taskId}/dependencies`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setParentTasks(data.data.parentTasks || []);
          setChildTasks(data.data.childTasks || []);
        }
      }

      // Fetch current task details
      const taskResponse = await authenticatedFetch(`${API_BASE_URL}/api/team/tasks/${taskId}`);
      if (taskResponse.ok) {
        const taskData = await taskResponse.json();
        if (taskData.success) {
          setCurrentTask(taskData.data);
        }
      }
    } catch (error) {
      console.error('Error fetching dependencies:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'blocked':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-primary-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link href="/tasks" className="text-primary-accent hover:text-primary-accent-dark mb-4 inline-block">
          ← Back to Tasks
        </Link>
        <h1 className="text-3xl font-bold text-primary-fg mb-2">Task Dependencies</h1>
        {currentTask && (
          <p className="text-primary-muted">Viewing dependencies for: <strong>{currentTask.title}</strong></p>
        )}
      </div>

      {/* Dependency Graph */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Parent Tasks */}
        <div className="card">
          <h2 className="text-lg font-semibold text-primary-fg mb-4 flex items-center gap-2">
            <GitBranch className="h-5 w-5" />
            Parent Tasks ({parentTasks.length})
          </h2>
          <p className="text-sm text-primary-muted mb-4">
            Tasks that must be completed before this task can start
          </p>
          <div className="space-y-3">
            {parentTasks.length === 0 ? (
              <p className="text-sm text-primary-muted text-center py-4">No parent tasks</p>
            ) : (
              parentTasks.map((dep) => (
                <Link
                  key={dep.id}
                  href={`/tasks/${dep.taskId}/dependencies`}
                  className="block p-3 border border-primary-border rounded-lg hover:bg-primary-bg transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium text-primary-fg text-sm">{dep.task.title}</h3>
                      <span className={`inline-block mt-2 px-2 py-1 rounded text-xs ${getStatusColor(dep.task.status)}`}>
                        {dep.task.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                    {dep.task.status === 'completed' ? (
                      <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 ml-2" />
                    ) : (
                      <Lock className="h-5 w-5 text-yellow-600 flex-shrink-0 ml-2" />
                    )}
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Current Task */}
        <div className="card">
          <h2 className="text-lg font-semibold text-primary-fg mb-4">Current Task</h2>
          {currentTask ? (
            <div className="p-4 bg-primary-accent-light rounded-lg">
              <h3 className="font-semibold text-primary-fg mb-2">{currentTask.title}</h3>
              {currentTask.description && (
                <p className="text-sm text-primary-muted mb-3">{currentTask.description}</p>
              )}
              <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(currentTask.status)}`}>
                {currentTask.status.replace('_', ' ').toUpperCase()}
              </span>
            </div>
          ) : (
            <p className="text-sm text-primary-muted">Loading...</p>
          )}
        </div>

        {/* Child Tasks */}
        <div className="card">
          <h2 className="text-lg font-semibold text-primary-fg mb-4 flex items-center gap-2">
            <GitBranch className="h-5 w-5" />
            Child Tasks ({childTasks.length})
          </h2>
          <p className="text-sm text-primary-muted mb-4">
            Tasks that depend on this task
          </p>
          <div className="space-y-3">
            {childTasks.length === 0 ? (
              <p className="text-sm text-primary-muted text-center py-4">No child tasks</p>
            ) : (
              childTasks.map((dep) => (
                <Link
                  key={dep.id}
                  href={`/tasks/${dep.taskId}/dependencies`}
                  className="block p-3 border border-primary-border rounded-lg hover:bg-primary-bg transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium text-primary-fg text-sm">{dep.task.title}</h3>
                      <span className={`inline-block mt-2 px-2 py-1 rounded text-xs ${getStatusColor(dep.task.status)}`}>
                        {dep.task.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                    {dep.task.status === 'blocked' ? (
                      <Lock className="h-5 w-5 text-red-600 flex-shrink-0 ml-2" />
                    ) : (
                      <ArrowRight className="h-5 w-5 text-green-600 flex-shrink-0 ml-2" />
                    )}
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

