"use client";

import { useEffect, useState } from "react";
import { CheckSquare, Plus, Clock, PlayCircle, X, User, Calendar, Edit2, Trash2 } from "lucide-react";
import { authenticatedFetch, getStaffSession } from "@/lib/auth-utils";
import { format } from "date-fns";

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: 'not_started' | 'in_progress' | 'completed';
  assignedTo: string | null;
  assignedToName: string | null;
  assignedToEmail: string | null;
  assignedAt: string | null;
  deadline: string | null;
  createdBy: string;
  createdByName: string | null;
  createdByEmail: string | null;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
}

interface StaffUser {
  id: string;
  email: string;
  fullName: string;
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [staffUsers, setStaffUsers] = useState<StaffUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [canCreate, setCanCreate] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    assignedTo: '',
    deadline: '',
  });

  const session = getStaffSession();
  const currentUserId = session?.userId || session?.staffId;

  useEffect(() => {
    fetchTasks();
    fetchStaffUsers();
    checkCreatePermission();
  }, []);

  const checkCreatePermission = async () => {
    try {
      // Check if user is admin first (admins can always create tasks)
      const session = getStaffSession();
      const userEmail = session?.email?.toLowerCase();
      const isAdmin = userEmail === 'md.thejaayveeworld@gmail.com' || 
                     userEmail === 'thejaayveeworldofficial@gmail.com';
      
      if (isAdmin) {
        setCanCreate(true);
        return;
      }

      // For non-admins, check RBAC permission
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://talaash.thejaayveeworld.com';
      const response = await authenticatedFetch(`${API_BASE_URL}/api/rbac`);
      
      if (response.ok) {
        const data = await response.json();
        // Check if user has 'creation' permission
        const userPermissions = data.data?.userPermissions || [];
        const hasCreationPermission = userPermissions.some(
          (up: any) => up.permission?.resource === 'creation' && up.isActive
        );
        setCanCreate(hasCreationPermission);
      }
    } catch (err) {
      console.error('Error checking permissions:', err);
    }
  };

  const fetchTasks = async () => {
    try {
      setLoading(true);
      setError(null);
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://talaash.thejaayveeworld.com';
      const response = await authenticatedFetch(`${API_BASE_URL}/api/staff/tasks`);

      if (!response.ok) {
        throw new Error('Failed to fetch tasks');
      }

      const result = await response.json();
      if (result.success) {
        setTasks(result.data || []);
      } else {
        throw new Error(result.error || 'Failed to fetch tasks');
      }
    } catch (err: any) {
      console.error('Error fetching tasks:', err);
      setError(err.message || 'Failed to fetch tasks');
    } finally {
      setLoading(false);
    }
  };

  const fetchStaffUsers = async () => {
    try {
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://talaash.thejaayveeworld.com';
      // Get staff list from RBAC API
      const response = await authenticatedFetch(`${API_BASE_URL}/api/rbac`);
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data?.users) {
          const staffList = data.data.users;
          setStaffUsers(staffList.map((u: any) => ({
            id: u.id,
            email: u.email,
            fullName: u.fullName || u.email,
          })));
        }
      }
    } catch (err) {
      console.error('Error fetching staff users:', err);
      // Fallback: if RBAC fails, try to get from staff list endpoint
      try {
        const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://talaash.thejaayveeworld.com';
        const response = await authenticatedFetch(`${API_BASE_URL}/api/staff/list`);
        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data) {
            setStaffUsers(result.data.map((u: any) => ({
              id: u.id,
              email: u.email,
              fullName: u.fullName || u.email,
            })));
          }
        }
      } catch (fallbackErr) {
        console.error('Fallback staff list fetch also failed:', fallbackErr);
      }
    }
  };

  const handleCreateTask = async () => {
    if (!formData.title.trim()) {
      setError('Task title is required');
      return;
    }

    try {
      setError(null);
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://talaash.thejaayveeworld.com';
      const response = await authenticatedFetch(`${API_BASE_URL}/api/staff/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: formData.title.trim(),
          description: formData.description.trim() || null,
          assignedTo: formData.assignedTo || null,
          deadline: formData.deadline || null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create task');
      }

      const result = await response.json();
      if (result.success) {
        await fetchTasks();
        setShowCreateModal(false);
        setFormData({ title: '', description: '', assignedTo: '', deadline: '' });
      }
    } catch (err: any) {
      console.error('Error creating task:', err);
      setError(err.message || 'Failed to create task');
    }
  };

  const handleUpdateStatus = async (taskId: string, newStatus: 'not_started' | 'in_progress' | 'completed') => {
    try {
      setError(null);
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://talaash.thejaayveeworld.com';
      const response = await authenticatedFetch(`${API_BASE_URL}/api/staff/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update task');
      }

      await fetchTasks();
    } catch (err: any) {
      console.error('Error updating task:', err);
      setError(err.message || 'Failed to update task');
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return;

    try {
      setError(null);
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://talaash.thejaayveeworld.com';
      const response = await authenticatedFetch(`${API_BASE_URL}/api/staff/tasks/${taskId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete task');
      }

      await fetchTasks();
    } catch (err: any) {
      console.error('Error deleting task:', err);
      setError(err.message || 'Failed to delete task');
    }
  };

  const handleEditTask = async () => {
    if (!editingTask || !formData.title.trim()) {
      setError('Task title is required');
      return;
    }

    try {
      setError(null);
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://talaash.thejaayveeworld.com';
      const response = await authenticatedFetch(`${API_BASE_URL}/api/staff/tasks/${editingTask.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: formData.title.trim(),
          description: formData.description.trim() || null,
          assignedTo: formData.assignedTo || null,
          deadline: formData.deadline || null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update task');
      }

      await fetchTasks();
      setEditingTask(null);
      setFormData({ title: '', description: '', assignedTo: '', deadline: '' });
    } catch (err: any) {
      console.error('Error updating task:', err);
      setError(err.message || 'Failed to update task');
    }
  };

  const openEditModal = (task: Task) => {
    setEditingTask(task);
    setFormData({
      title: task.title,
      description: task.description || '',
      assignedTo: task.assignedTo || '',
      deadline: task.deadline ? format(new Date(task.deadline), "yyyy-MM-dd'T'HH:mm") : '',
    });
  };

  const closeModal = () => {
    setShowCreateModal(false);
    setEditingTask(null);
    setFormData({ title: '', description: '', assignedTo: '', deadline: '' });
  };

  // Group tasks by status
  const tasksByStatus = {
    not_started: tasks.filter(t => t.status === 'not_started'),
    in_progress: tasks.filter(t => t.status === 'in_progress'),
    completed: tasks.filter(t => t.status === 'completed'),
  };

  const isCreator = (task: Task) => task.createdBy === currentUserId;

  if (loading) {
    return (
      <div className="p-6">
        <div className="card text-center py-12">
          <Clock className="h-12 w-12 text-primary-muted mx-auto mb-4 animate-spin" />
          <p className="text-primary-muted">Loading tasks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <CheckSquare className="h-6 w-6 text-primary-accent" />
          <h1 className="text-2xl font-bold text-primary-fg">Tasks</h1>
        </div>
        {canCreate && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary-accent text-white rounded-lg hover:bg-primary-accent-dark transition-colors"
          >
            <Plus className="h-4 w-4" />
            Create Task
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500">
          {error}
        </div>
      )}

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Not Started Column */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-primary-border">
            <Clock className="h-5 w-5 text-gray-500" />
            <h2 className="font-semibold text-primary-fg">Not Started</h2>
            <span className="ml-auto px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
              {tasksByStatus.not_started.length}
            </span>
          </div>
          <div className="space-y-3">
            {tasksByStatus.not_started.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onStatusChange={handleUpdateStatus}
                onEdit={openEditModal}
                onDelete={handleDeleteTask}
                isCreator={isCreator(task)}
              />
            ))}
            {tasksByStatus.not_started.length === 0 && (
              <p className="text-sm text-primary-muted text-center py-8">No tasks</p>
            )}
          </div>
        </div>

        {/* In Progress Column */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-primary-border">
            <PlayCircle className="h-5 w-5 text-blue-500" />
            <h2 className="font-semibold text-primary-fg">In Progress</h2>
            <span className="ml-auto px-2 py-1 bg-blue-100 text-blue-600 rounded-full text-xs">
              {tasksByStatus.in_progress.length}
            </span>
          </div>
          <div className="space-y-3">
            {tasksByStatus.in_progress.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onStatusChange={handleUpdateStatus}
                onEdit={openEditModal}
                onDelete={handleDeleteTask}
                isCreator={isCreator(task)}
              />
            ))}
            {tasksByStatus.in_progress.length === 0 && (
              <p className="text-sm text-primary-muted text-center py-8">No tasks</p>
            )}
          </div>
        </div>

        {/* Completed Column */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-primary-border">
            <CheckSquare className="h-5 w-5 text-green-500" />
            <h2 className="font-semibold text-primary-fg">Completed</h2>
            <span className="ml-auto px-2 py-1 bg-green-100 text-green-600 rounded-full text-xs">
              {tasksByStatus.completed.length}
            </span>
          </div>
          <div className="space-y-3">
            {tasksByStatus.completed.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onStatusChange={handleUpdateStatus}
                onEdit={openEditModal}
                onDelete={handleDeleteTask}
                isCreator={isCreator(task)}
              />
            ))}
            {tasksByStatus.completed.length === 0 && (
              <p className="text-sm text-primary-muted text-center py-8">No tasks</p>
            )}
          </div>
        </div>
      </div>

      {/* Create/Edit Modal */}
      {(showCreateModal || editingTask) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-primary-bg rounded-lg border border-primary-border p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-primary-fg">
                {editingTask ? 'Edit Task' : 'Create Task'}
              </h2>
              <button
                onClick={closeModal}
                className="p-1 hover:bg-primary-accent-light rounded transition-colors"
              >
                <X className="h-5 w-5 text-primary-fg" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-primary-fg mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-primary-border rounded-lg bg-primary-bg text-primary-fg"
                  placeholder="Task title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-primary-fg mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-primary-border rounded-lg bg-primary-bg text-primary-fg"
                  placeholder="Task description"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-primary-fg mb-2">
                  Assign To
                </label>
                <select
                  value={formData.assignedTo}
                  onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                  className="w-full px-3 py-2 border border-primary-border rounded-lg bg-primary-bg text-primary-fg"
                >
                  <option value="">Unassigned</option>
                  {staffUsers.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.fullName} ({user.email})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-primary-fg mb-2">
                  Deadline
                </label>
                <input
                  type="datetime-local"
                  value={formData.deadline}
                  onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                  className="w-full px-3 py-2 border border-primary-border rounded-lg bg-primary-bg text-primary-fg"
                />
                <p className="text-xs text-primary-muted mt-1">Optional: Set a deadline for this task</p>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={editingTask ? handleEditTask : handleCreateTask}
                  className="flex-1 px-4 py-2 bg-primary-accent text-white rounded-lg hover:bg-primary-accent-dark transition-colors"
                >
                  {editingTask ? 'Update' : 'Create'}
                </button>
                <button
                  onClick={closeModal}
                  className="px-4 py-2 border border-primary-border text-primary-fg rounded-lg hover:bg-primary-accent-light transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Task Card Component
function TaskCard({
  task,
  onStatusChange,
  onEdit,
  onDelete,
  isCreator,
}: {
  task: Task;
  onStatusChange: (taskId: string, status: 'not_started' | 'in_progress' | 'completed') => void;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  isCreator: boolean;
}) {
  const getStatusButtons = () => {
    if (task.status === 'not_started') {
      return (
        <button
          onClick={() => onStatusChange(task.id, 'in_progress')}
          className="text-xs px-2 py-1 bg-blue-100 text-blue-600 rounded hover:bg-blue-200 transition-colors"
        >
          Start
        </button>
      );
    } else if (task.status === 'in_progress') {
      return (
        <button
          onClick={() => onStatusChange(task.id, 'completed')}
          className="text-xs px-2 py-1 bg-green-100 text-green-600 rounded hover:bg-green-200 transition-colors"
        >
          Complete
        </button>
      );
    }
    return null;
  };

  return (
    <div className="border border-primary-border rounded-lg p-3 bg-primary-bg hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-2">
        <h3 className="font-semibold text-primary-fg text-sm flex-1">{task.title}</h3>
        <div className="flex gap-1">
          {isCreator && (
            <>
              <button
                onClick={() => onEdit(task)}
                className="p-1 hover:bg-primary-accent-light rounded transition-colors"
                title="Edit task"
              >
                <Edit2 className="h-3 w-3 text-primary-fg" />
              </button>
              <button
                onClick={() => onDelete(task.id)}
                className="p-1 hover:bg-red-500/20 rounded transition-colors"
                title="Delete task"
              >
                <Trash2 className="h-3 w-3 text-red-500" />
              </button>
            </>
          )}
        </div>
      </div>

      {task.description && (
        <p className="text-xs text-primary-muted mb-2 line-clamp-2">{task.description}</p>
      )}

      <div className="space-y-1 text-xs text-primary-muted">
        {task.assignedToName && (
          <div className="flex items-center gap-1">
            <User className="h-3 w-3" />
            <span>{task.assignedToName}</span>
            {task.assignedAt && (
              <span className="text-primary-muted ml-1">
                (assigned {format(new Date(task.assignedAt), "MMM dd, HH:mm")})
              </span>
            )}
          </div>
        )}
        
        {task.deadline && (
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span className={new Date(task.deadline) < new Date() && task.status !== 'completed' ? 'text-red-500 font-medium' : ''}>
              Deadline: {format(new Date(task.deadline), "MMM dd, yyyy HH:mm")}
            </span>
          </div>
        )}
        
        <div className="flex items-center gap-1">
          <Calendar className="h-3 w-3" />
          <span>Created: {format(new Date(task.createdAt), "MMM dd, yyyy")}</span>
        </div>

        {isCreator && task.createdByName && (
          <div className="flex items-center gap-1">
            <span>By: {task.createdByName}</span>
          </div>
        )}

        {/* Show completion timestamp if completed */}
        {task.status === 'completed' && task.completedAt && (
          <div className="flex items-center gap-1 text-green-600 font-medium">
            <CheckSquare className="h-3 w-3" />
            <span>Completed: {format(new Date(task.completedAt), "MMM dd, yyyy HH:mm")}</span>
          </div>
        )}

        {/* Show creation timestamp for creator */}
        {isCreator && (
          <div className="flex items-center gap-1 text-xs text-primary-muted">
            <Clock className="h-3 w-3" />
            <span>Created: {format(new Date(task.createdAt), "MMM dd, yyyy HH:mm")}</span>
          </div>
        )}
      </div>

      <div className="mt-2 flex items-center justify-between">
        {getStatusButtons()}
        <div className="text-xs text-primary-muted">
          {task.status === 'completed' && task.completedAt
            ? `Completed ${format(new Date(task.completedAt), "MMM dd, HH:mm")}`
            : `Updated ${format(new Date(task.updatedAt), "MMM dd")}`}
        </div>
      </div>
    </div>
  );
}

