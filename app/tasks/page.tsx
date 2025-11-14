"use client";

import { useEffect, useState } from "react";
import { CheckSquare, Plus, Clock, PlayCircle, X, User, Calendar, Edit2, Trash2, GripVertical, Search, Filter, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { authenticatedFetch, getTeamSession } from "@/lib/auth-utils";
import { format, differenceInHours, differenceInDays, differenceInMinutes } from "date-fns";
import { isSuperAdmin } from "@/lib/rbac";

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

interface TeamUser {
  id: string;
  email: string;
  fullName: string;
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [teamUsers, setTeamUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [canCreate, setCanCreate] = useState(false);
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [apiQueue, setApiQueue] = useState<Array<{ taskId: string; status: 'not_started' | 'in_progress' | 'completed'; timestamp: number }>>([]);
  const [isProcessingQueue, setIsProcessingQueue] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterAssignee, setFilterAssignee] = useState('');
  const [sortBy, setSortBy] = useState<'createdAt' | 'updatedAt' | 'deadline' | 'assignedAt'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [isAdmin, setIsAdmin] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    assignedTo: '',
    deadline: '',
  });

  const session = getTeamSession();
  const currentUserId = session?.userId || session?.teamId || session?.staffId; // Backward compatibility

  useEffect(() => {
    fetchTasks();
    fetchTeamUsers();
    checkCreatePermission();
    
    // Check if user is admin
    const session = getTeamSession();
    const userEmail = session?.email;
    setIsAdmin(isSuperAdmin(userEmail));
  }, []);

  const checkCreatePermission = async () => {
    try {
      // Check if user is admin first (admins can always create tasks)
      const session = getTeamSession();
      const userEmail = session?.email;
      const isAdmin = isSuperAdmin(userEmail);
      
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
      const response = await authenticatedFetch(`${API_BASE_URL}/api/team/tasks`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || `Failed to fetch tasks (${response.status} ${response.statusText})`;
        throw new Error(errorMessage);
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

  const fetchTeamUsers = async () => {
    try {
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://talaash.thejaayveeworld.com';
      // Get staff list from RBAC API
      const response = await authenticatedFetch(`${API_BASE_URL}/api/rbac`);
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data?.users) {
          const staffList = data.data.users;
          setTeamUsers(staffList.map((u: any) => ({
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
            setTeamUsers(result.data.map((u: any) => ({
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
      const response = await authenticatedFetch(`${API_BASE_URL}/api/team/tasks`, {
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

  // Optimistically update task status in local state
  const updateTaskStatusOptimistically = (taskId: string, newStatus: 'not_started' | 'in_progress' | 'completed') => {
    setTasks(prevTasks => 
      prevTasks.map(task => {
        if (task.id === taskId) {
          const updatedTask = { ...task, status: newStatus };
          // Set completedAt if status is completed
          if (newStatus === 'completed' && !task.completedAt) {
            updatedTask.completedAt = new Date().toISOString();
          } else if (newStatus !== 'completed') {
            updatedTask.completedAt = null;
          }
          return updatedTask;
        }
        return task;
      })
    );
  };

  // Add API call to queue
  const queueStatusUpdate = (taskId: string, newStatus: 'not_started' | 'in_progress' | 'completed') => {
    setApiQueue(prev => [...prev, { taskId, status: newStatus, timestamp: Date.now() }]);
  };

  // Process API queue with rate limiting
  useEffect(() => {
    if (apiQueue.length === 0 || isProcessingQueue) return;

    const processQueue = async () => {
      setIsProcessingQueue(true);
      const queueToProcess = [...apiQueue]; // Copy queue to avoid closure issues
      
      // Process items one at a time with rate limiting (500ms delay between calls)
      for (let i = 0; i < queueToProcess.length; i++) {
        const item = queueToProcess[i];
        try {
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://talaash.thejaayveeworld.com';
      const response = await authenticatedFetch(`${API_BASE_URL}/api/team/tasks/${item.taskId}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ status: item.status }),
          });

          if (!response.ok) {
            console.error(`Failed to update task ${item.taskId}:`, await response.json());
            // Could revert optimistic update here if needed
          }
        } catch (err) {
          console.error(`Error updating task ${item.taskId}:`, err);
        }

        // Rate limiting: wait 500ms before next API call (except for last item)
        if (i < queueToProcess.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }

      // Clear queue after processing
      setApiQueue([]);
      setIsProcessingQueue(false);
    };

    processQueue();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiQueue.length]);

  const handleUpdateStatus = async (taskId: string, newStatus: 'not_started' | 'in_progress' | 'completed') => {
    // Optimistically update UI immediately
    updateTaskStatusOptimistically(taskId, newStatus);
    
    // Queue API call (will be processed with rate limiting)
    queueStatusUpdate(taskId, newStatus);
  };

  // Calculate time taken to complete (from createdAt to completedAt)
  const getTimeTaken = (task: Task): string | null => {
    if (task.status !== 'completed' || !task.completedAt) return null;
    
    const createdAt = new Date(task.createdAt);
    const completedAt = new Date(task.completedAt);
    const diffMinutes = differenceInMinutes(completedAt, createdAt);
    const diffHours = differenceInHours(completedAt, createdAt);
    const diffDays = differenceInDays(completedAt, createdAt);

    if (diffDays > 0) {
      return `${diffDays} day${diffDays > 1 ? 's' : ''}`;
    } else if (diffHours > 0) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''}`;
    } else {
      return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''}`;
    }
  };

  // Check if task was completed after deadline
  const isOverdue = (task: Task): boolean => {
    if (task.status !== 'completed' || !task.completedAt || !task.deadline) return false;
    return new Date(task.completedAt) > new Date(task.deadline);
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, task: Task) => {
    setDraggedTask(task);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetStatus: 'not_started' | 'in_progress' | 'completed') => {
    e.preventDefault();
    if (!draggedTask) return;

    // Only update if status changed
    if (draggedTask.status !== targetStatus) {
      handleUpdateStatus(draggedTask.id, targetStatus);
    }
    setDraggedTask(null);
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return;

    try {
      setError(null);
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://talaash.thejaayveeworld.com';
      const response = await authenticatedFetch(`${API_BASE_URL}/api/team/tasks/${taskId}`, {
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
      const response = await authenticatedFetch(`${API_BASE_URL}/api/team/tasks/${editingTask.id}`, {
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

  // Filter tasks by search query and assignee (admin only)
  let filteredTasks = tasks;
  
  // Apply search filter
  if (searchQuery.trim()) {
    const query = searchQuery.toLowerCase();
    filteredTasks = filteredTasks.filter(task => {
      return (
        task.title.toLowerCase().includes(query) ||
        (task.description && task.description.toLowerCase().includes(query)) ||
        (task.assignedToName && task.assignedToName.toLowerCase().includes(query)) ||
        (task.assignedToEmail && task.assignedToEmail.toLowerCase().includes(query)) ||
        (task.createdByName && task.createdByName.toLowerCase().includes(query)) ||
        (task.createdByEmail && task.createdByEmail.toLowerCase().includes(query)) ||
        task.status.toLowerCase().includes(query)
      );
    });
  }
  
  // Apply assignee filter (admin only)
  if (isAdmin && filterAssignee) {
    filteredTasks = filteredTasks.filter(task => task.assignedTo === filterAssignee);
  }
  
  // Sort tasks
  filteredTasks = [...filteredTasks].sort((a, b) => {
    let aValue: Date | null = null;
    let bValue: Date | null = null;
    
    switch (sortBy) {
      case 'createdAt':
        aValue = new Date(a.createdAt);
        bValue = new Date(b.createdAt);
        break;
      case 'updatedAt':
        aValue = new Date(a.updatedAt);
        bValue = new Date(b.updatedAt);
        break;
      case 'deadline':
        aValue = a.deadline ? new Date(a.deadline) : null;
        bValue = b.deadline ? new Date(b.deadline) : null;
        break;
      case 'assignedAt':
        aValue = a.assignedAt ? new Date(a.assignedAt) : null;
        bValue = b.assignedAt ? new Date(b.assignedAt) : null;
        break;
    }
    
    // Handle null values (put them at the end)
    if (!aValue && !bValue) return 0;
    if (!aValue) return 1;
    if (!bValue) return -1;
    
    const comparison = aValue.getTime() - bValue.getTime();
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  // Group tasks by status
  const tasksByStatus = {
    not_started: filteredTasks.filter(t => t.status === 'not_started'),
    in_progress: filteredTasks.filter(t => t.status === 'in_progress'),
    completed: filteredTasks.filter(t => t.status === 'completed'),
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

      {/* Search and Filters */}
      <div className="mb-6 space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-primary-muted" />
          <input
            type="text"
            placeholder="Search tasks by title, description, assignee, creator, or status..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-primary-border rounded-lg bg-primary-bg text-primary-fg placeholder-primary-muted focus:outline-none focus:ring-2 focus:ring-primary-accent focus:border-transparent"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 hover:bg-primary-accent-light rounded transition-colors"
              title="Clear search"
            >
              <X className="h-4 w-4 text-primary-muted" />
            </button>
          )}
        </div>

        {/* Admin Filters and Sort */}
        {isAdmin && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Filter by Assignee */}
            <div>
              <label className="block text-sm font-medium text-primary-fg mb-2">
                <Filter className="h-4 w-4 inline mr-1" />
                Filter by Assignee
              </label>
              <select
                value={filterAssignee}
                onChange={(e) => setFilterAssignee(e.target.value)}
                className="w-full px-3 py-2 border border-primary-border rounded-lg bg-primary-bg text-primary-fg focus:outline-none focus:ring-2 focus:ring-primary-accent"
              >
                <option value="">All Assignees</option>
                {teamUsers.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.fullName} ({user.email})
                  </option>
                ))}
              </select>
            </div>

            {/* Sort By */}
            <div>
              <label className="block text-sm font-medium text-primary-fg mb-2">
                <ArrowUpDown className="h-4 w-4 inline mr-1" />
                Sort By
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'createdAt' | 'updatedAt' | 'deadline' | 'assignedAt')}
                className="w-full px-3 py-2 border border-primary-border rounded-lg bg-primary-bg text-primary-fg focus:outline-none focus:ring-2 focus:ring-primary-accent"
              >
                <option value="createdAt">Created Date</option>
                <option value="updatedAt">Updated Date</option>
                <option value="deadline">Deadline</option>
                <option value="assignedAt">Assigned Date</option>
              </select>
            </div>

            {/* Sort Order */}
            <div>
              <label className="block text-sm font-medium text-primary-fg mb-2">
                Order
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => setSortOrder('desc')}
                  className={`flex-1 px-3 py-2 border rounded-lg transition-colors flex items-center justify-center gap-1 ${
                    sortOrder === 'desc'
                      ? 'bg-primary-accent text-white border-primary-accent'
                      : 'bg-primary-bg text-primary-fg border-primary-border hover:bg-primary-accent-light'
                  }`}
                >
                  <ArrowDown className="h-4 w-4" />
                  Descending
                </button>
                <button
                  onClick={() => setSortOrder('asc')}
                  className={`flex-1 px-3 py-2 border rounded-lg transition-colors flex items-center justify-center gap-1 ${
                    sortOrder === 'asc'
                      ? 'bg-primary-accent text-white border-primary-accent'
                      : 'bg-primary-bg text-primary-fg border-primary-border hover:bg-primary-accent-light'
                  }`}
                >
                  <ArrowUp className="h-4 w-4" />
                  Ascending
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Results Count */}
        {(searchQuery || (isAdmin && filterAssignee)) && (
          <p className="text-sm text-primary-muted">
            Found {filteredTasks.length} task{filteredTasks.length !== 1 ? 's' : ''}
            {searchQuery && ` matching "${searchQuery}"`}
            {isAdmin && filterAssignee && ` assigned to ${teamUsers.find(u => u.id === filterAssignee)?.fullName || 'selected user'}`}
          </p>
        )}
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Not Started Column */}
        <div 
          className="card transition-colors"
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, 'not_started')}
        >
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-primary-border">
            <Clock className="h-5 w-5 text-gray-500" />
            <h2 className="font-semibold text-primary-fg">Not Started</h2>
            <span className="ml-auto px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
              {tasksByStatus.not_started.length}
            </span>
          </div>
          <div className="space-y-3 min-h-[200px]">
            {tasksByStatus.not_started.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onStatusChange={handleUpdateStatus}
                onEdit={openEditModal}
                onDelete={handleDeleteTask}
                isCreator={isCreator(task)}
                onDragStart={handleDragStart}
                getTimeTaken={getTimeTaken}
                isOverdue={isOverdue}
                draggedTask={draggedTask}
              />
            ))}
            {tasksByStatus.not_started.length === 0 && (
              <p className="text-sm text-primary-muted text-center py-8">No tasks</p>
            )}
          </div>
        </div>

        {/* In Progress Column */}
        <div 
          className="card"
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, 'in_progress')}
        >
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-primary-border">
            <PlayCircle className="h-5 w-5 text-blue-500" />
            <h2 className="font-semibold text-primary-fg">In Progress</h2>
            <span className="ml-auto px-2 py-1 bg-blue-100 text-blue-600 rounded-full text-xs">
              {tasksByStatus.in_progress.length}
            </span>
          </div>
          <div className="space-y-3 min-h-[200px]">
            {tasksByStatus.in_progress.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onStatusChange={handleUpdateStatus}
                onEdit={openEditModal}
                onDelete={handleDeleteTask}
                isCreator={isCreator(task)}
                onDragStart={handleDragStart}
                getTimeTaken={getTimeTaken}
                isOverdue={isOverdue}
                draggedTask={draggedTask}
              />
            ))}
            {tasksByStatus.in_progress.length === 0 && (
              <p className="text-sm text-primary-muted text-center py-8">No tasks</p>
            )}
          </div>
        </div>

        {/* Completed Column */}
        <div 
          className="card"
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, 'completed')}
        >
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-primary-border">
            <CheckSquare className="h-5 w-5 text-green-500" />
            <h2 className="font-semibold text-primary-fg">Completed</h2>
            <span className="ml-auto px-2 py-1 bg-green-100 text-green-600 rounded-full text-xs">
              {tasksByStatus.completed.length}
            </span>
          </div>
          <div className="space-y-3 min-h-[200px]">
            {tasksByStatus.completed.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onStatusChange={handleUpdateStatus}
                onEdit={openEditModal}
                onDelete={handleDeleteTask}
                isCreator={isCreator(task)}
                onDragStart={handleDragStart}
                getTimeTaken={getTimeTaken}
                isOverdue={isOverdue}
                draggedTask={draggedTask}
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
                  {teamUsers.map((user) => (
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
  onDragStart,
  getTimeTaken,
  isOverdue,
  draggedTask,
}: {
  task: Task;
  onStatusChange: (taskId: string, status: 'not_started' | 'in_progress' | 'completed') => void;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  isCreator: boolean;
  onDragStart: (e: React.DragEvent, task: Task) => void;
  getTimeTaken: (task: Task) => string | null;
  isOverdue: (task: Task) => boolean;
  draggedTask?: Task | null;
}) {
  const timeTaken = getTimeTaken(task);
  const overdue = isOverdue(task);

  const getStatusButtons = () => {
    if (task.status === 'not_started') {
      return (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onStatusChange(task.id, 'in_progress');
          }}
          onMouseDown={(e) => e.stopPropagation()}
          className="px-3 py-1.5 bg-blue-500 text-white text-sm font-medium rounded-md hover:bg-blue-600 active:bg-blue-700 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
        >
          Start
        </button>
      );
    } else if (task.status === 'in_progress') {
      return (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onStatusChange(task.id, 'completed');
          }}
          onMouseDown={(e) => e.stopPropagation()}
          className="px-3 py-1.5 bg-green-500 text-white text-sm font-medium rounded-md hover:bg-green-600 active:bg-green-700 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-1"
        >
          Complete
        </button>
      );
    }
    return null;
  };

  return (
    <div 
      draggable
      onDragStart={(e) => onDragStart(e, task)}
      className={`border-2 rounded-lg p-3 bg-white hover:shadow-lg transition-all cursor-move select-none ${
        overdue 
          ? 'border-red-500 bg-red-50' 
          : 'border-primary-border hover:border-primary-accent'
      }`}
      style={{ opacity: draggedTask?.id === task.id ? 0.5 : 1 }}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2 flex-1">
          <GripVertical className="h-4 w-4 text-gray-400 cursor-move" />
          <h3 className="font-semibold text-primary-fg text-sm flex-1">{task.title}</h3>
        </div>
        <div className="flex gap-1">
          {isCreator && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(task);
                }}
                onMouseDown={(e) => e.stopPropagation()}
                className="p-1 hover:bg-primary-accent-light rounded transition-colors"
                title="Edit task"
              >
                <Edit2 className="h-3 w-3 text-primary-fg" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(task.id);
                }}
                onMouseDown={(e) => e.stopPropagation()}
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
          <div className={`flex items-center gap-1 font-medium ${overdue ? 'text-red-600' : 'text-green-600'}`}>
            <CheckSquare className="h-3 w-3" />
            <span>Completed: {format(new Date(task.completedAt), "MMM dd, yyyy HH:mm")}</span>
            {overdue && (
              <span className="ml-1 text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded">Overdue</span>
            )}
          </div>
        )}

        {/* Show time taken to complete */}
        {timeTaken && (
          <div className={`flex items-center gap-1 text-xs ${overdue ? 'text-red-600 font-medium' : 'text-primary-muted'}`}>
            <Clock className="h-3 w-3" />
            <span>Time taken: {timeTaken}</span>
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


