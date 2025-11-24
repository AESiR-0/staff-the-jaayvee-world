"use client";

import { useEffect, useState } from "react";
import { CheckSquare, Plus, Clock, PlayCircle, X, User, Calendar, Edit2, Trash2, GripVertical, Search, Filter, ArrowUpDown, ArrowUp, ArrowDown, MessageSquare, Send } from "lucide-react";
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
  submissionDeadline: string | null; // Submission deadline for assignee
  deadline: string | null; // Presentation deadline for creator
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

interface TaskRemark {
  id: string;
  taskId: string;
  userId: string;
  remark: string;
  createdAt: string;
  userName: string | null;
  userEmail: string | null;
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [teamUsers, setTeamUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [viewingTask, setViewingTask] = useState<Task | null>(null);
  const [canCreate, setCanCreate] = useState(false);
  const [loadingPermissions, setLoadingPermissions] = useState(true);
  const [creatingTask, setCreatingTask] = useState(false);
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [apiQueue, setApiQueue] = useState<Array<{ taskId: string; status: 'not_started' | 'in_progress' | 'completed'; timestamp: number }>>([]);
  const [isProcessingQueue, setIsProcessingQueue] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterAssignee, setFilterAssignee] = useState('');
  const [sortBy, setSortBy] = useState<'createdAt' | 'updatedAt' | 'deadline' | 'assignedAt'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [isAdmin, setIsAdmin] = useState(false);
  
  // Task remarks state
  const [taskRemarks, setTaskRemarks] = useState<TaskRemark[]>([]);
  const [newRemark, setNewRemark] = useState('');
  const [addingRemark, setAddingRemark] = useState(false);
  const [loadingRemarks, setLoadingRemarks] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    assignedTo: '',
    submissionDeadline: '',
    deadline: '', // presentation deadline
  });

  const session = getTeamSession();
  const currentUserId = session?.userId || session?.teamId || session?.staffId; // Backward compatibility

  useEffect(() => {
    fetchTasks();
    fetchTeamUsers();
    checkCreatePermission();
    
    // Check if user is admin
    const checkAdminStatus = async () => {
      const session = getTeamSession();
      const userEmail = session?.email;
      const adminStatus = await isSuperAdmin(userEmail);
      setIsAdmin(adminStatus);
    };
    checkAdminStatus();
  }, []);

  const checkCreatePermission = async () => {
    try {
      setLoadingPermissions(true);
      // Check if user is admin first (admins can always create tasks)
      const session = getTeamSession();
      const userEmail = session?.email;
      const isAdmin = await isSuperAdmin(userEmail);
      
      if (isAdmin) {
        setCanCreate(true);
        setLoadingPermissions(false);
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
    } finally {
      setLoadingPermissions(false);
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
      } else {
        console.warn('RBAC API returned non-OK status:', response.status);
      }
    } catch (err) {
      console.error('Error fetching staff users from RBAC API:', err);
      // Continue without team users - page will still function, just without assignee dropdown
    }
  };

  // Helper function to convert datetime-local to ISO string with timezone
  const convertToISO = (datetimeLocal: string): string => {
    if (!datetimeLocal) return '';
    // datetime-local format: "YYYY-MM-DDTHH:mm"
    // Create a date object in local timezone
    const localDate = new Date(datetimeLocal);
    // Return ISO string which includes timezone info
    return localDate.toISOString();
  };

  // Helper function to convert UTC ISO string back to datetime-local format
  const convertFromISO = (isoString: string): string => {
    if (!isoString) return '';
    // Parse the UTC ISO string and convert to local time
    const date = new Date(isoString);
    // Format as datetime-local (YYYY-MM-DDTHH:mm) in local timezone
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const handleCreateTask = async () => {
    if (creatingTask) return; // Prevent multiple clicks
    
    if (!formData.title.trim()) {
      setError('Task title is required');
      return;
    }

    try {
      setCreatingTask(true);
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
          deadline: formData.deadline ? convertToISO(formData.deadline) : null,
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
        setFormData({ title: '', description: '', assignedTo: '', submissionDeadline: '', deadline: '' });
      }
    } catch (err: any) {
      console.error('Error creating task:', err);
      setError(err.message || 'Failed to create task');
    } finally {
      setCreatingTask(false);
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
          deadline: formData.deadline ? convertToISO(formData.deadline) : null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update task');
      }

      await fetchTasks();
      setEditingTask(null);
      setFormData({ title: '', description: '', assignedTo: '', submissionDeadline: '', deadline: '' });
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
      submissionDeadline: task.submissionDeadline ? convertFromISO(task.submissionDeadline) : '',
      deadline: task.deadline ? convertFromISO(task.deadline) : '',
    });
  };

  const openViewModal = async (task: Task) => {
    setViewingTask(task);
    await fetchTaskRemarks(task.id);
  };

  const fetchTaskRemarks = async (taskId: string) => {
    try {
      setLoadingRemarks(true);
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://talaash.thejaayveeworld.com';
      const response = await authenticatedFetch(`${API_BASE_URL}/api/team/tasks/${taskId}/remarks`);

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setTaskRemarks(result.data || []);
        }
      }
    } catch (err) {
      console.error('Error fetching remarks:', err);
    } finally {
      setLoadingRemarks(false);
    }
  };

  const handleAddRemark = async () => {
    if (!viewingTask || !newRemark.trim() || addingRemark) return;

    try {
      setAddingRemark(true);
      setError(null);
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://talaash.thejaayveeworld.com';
      const response = await authenticatedFetch(`${API_BASE_URL}/api/team/tasks/${viewingTask.id}/remarks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ remark: newRemark.trim() }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add remark');
      }

      const result = await response.json();
      if (result.success) {
        setTaskRemarks(prev => [result.data, ...prev]);
        setNewRemark('');
      }
    } catch (err: any) {
      console.error('Error adding remark:', err);
      setError(err.message || 'Failed to add remark');
    } finally {
      setAddingRemark(false);
    }
  };

  const closeModal = () => {
    setShowCreateModal(false);
    setEditingTask(null);
    setViewingTask(null);
    setTaskRemarks([]);
    setNewRemark('');
    setFormData({ title: '', description: '', assignedTo: '', submissionDeadline: '', deadline: '' });
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
        {loadingPermissions ? (
          <button
            disabled
            className="flex items-center gap-2 px-4 py-2 bg-primary-accent/50 text-white rounded-lg cursor-not-allowed"
          >
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            Checking permissions...
          </button>
        ) : canCreate ? (
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary-accent text-white rounded-lg hover:bg-primary-accent-dark transition-colors"
          >
            <Plus className="h-4 w-4" />
            Create Task
          </button>
        ) : null}
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

            {/* Sort Order Toggle */}
            <div>
              <label className="block text-sm font-medium text-primary-fg mb-2">
                Order
              </label>
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="w-full px-3 py-2 border border-primary-border rounded-lg transition-colors flex items-center justify-center bg-primary-bg text-primary-fg hover:bg-primary-accent-light hover:border-primary-accent"
                title={sortOrder === 'asc' ? 'Sort Descending' : 'Sort Ascending'}
              >
                {sortOrder === 'asc' ? (
                  <ArrowUp className="h-5 w-5" />
                ) : (
                  <ArrowDown className="h-5 w-5" />
                )}
              </button>
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
                onView={openViewModal}
                isCreator={isCreator(task)}
                onDragStart={handleDragStart}
                getTimeTaken={getTimeTaken}
                isOverdue={isOverdue}
                draggedTask={draggedTask}
                currentUserId={currentUserId}
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
                onView={openViewModal}
                isCreator={isCreator(task)}
                onDragStart={handleDragStart}
                getTimeTaken={getTimeTaken}
                isOverdue={isOverdue}
                draggedTask={draggedTask}
                currentUserId={currentUserId}
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
                onView={openViewModal}
                isCreator={isCreator(task)}
                onDragStart={handleDragStart}
                getTimeTaken={getTimeTaken}
                isOverdue={isOverdue}
                draggedTask={draggedTask}
                currentUserId={currentUserId}
              />
            ))}
            {tasksByStatus.completed.length === 0 && (
              <p className="text-sm text-primary-muted text-center py-8">No tasks</p>
            )}
          </div>
        </div>
      </div>

      {/* View Task Modal */}
      {viewingTask && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-primary-bg rounded-lg border border-primary-border p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-primary-fg">Task Details</h2>
              <button
                onClick={closeModal}
                className="p-1 hover:bg-primary-accent-light rounded transition-colors"
              >
                <X className="h-5 w-5 text-primary-fg" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-primary-muted mb-1">
                  Title
                </label>
                <p className="text-lg font-semibold text-primary-fg">{viewingTask.title}</p>
              </div>

              {viewingTask.description && (
                <div>
                  <label className="block text-sm font-medium text-primary-muted mb-1">
                    Description
                  </label>
                  <p className="text-primary-fg whitespace-pre-wrap">{viewingTask.description}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-primary-muted mb-1">
                    Status
                  </label>
                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                    viewingTask.status === 'completed' 
                      ? 'bg-green-100 text-green-700' 
                      : viewingTask.status === 'in_progress'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-gray-100 text-gray-700'
                  }`}>
                    {viewingTask.status === 'completed' ? 'Completed' : 
                     viewingTask.status === 'in_progress' ? 'In Progress' : 'Not Started'}
                  </span>
                </div>

                {viewingTask.assignedToName && (
                  <div>
                    <label className="block text-sm font-medium text-primary-muted mb-1">
                      Assigned To
                    </label>
                    <p className="text-primary-fg">{viewingTask.assignedToName}</p>
                    {viewingTask.assignedToEmail && (
                      <p className="text-sm text-primary-muted">{viewingTask.assignedToEmail}</p>
                    )}
                    {viewingTask.assignedAt && (
                      <p className="text-xs text-primary-muted mt-1">
                        Assigned: {format(new Date(viewingTask.assignedAt), "MMM dd, yyyy HH:mm")}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Show submission deadline to assignee */}
              {viewingTask.submissionDeadline && viewingTask.assignedTo === currentUserId && (
                <div>
                  <label className="block text-sm font-medium text-primary-muted mb-1">
                    Submission Deadline
                  </label>
                  <p className={`text-primary-fg ${
                    new Date(viewingTask.submissionDeadline) < new Date() && viewingTask.status !== 'completed' 
                      ? 'text-red-500 font-medium' 
                      : ''
                  }`}>
                    {format(new Date(viewingTask.submissionDeadline), "MMM dd, yyyy 'at' HH:mm")}
                    {new Date(viewingTask.submissionDeadline) < new Date() && viewingTask.status !== 'completed' && (
                      <span className="ml-2 text-xs bg-red-100 text-red-700 px-2 py-1 rounded">Overdue</span>
                    )}
                  </p>
                </div>
              )}

              {/* Show presentation deadline only to creator */}
              {viewingTask.deadline && viewingTask.createdBy === currentUserId && (
                <div>
                  <label className="block text-sm font-medium text-primary-muted mb-1">
                    Presentation Deadline
                  </label>
                  <p className={`text-primary-fg ${
                    new Date(viewingTask.deadline) < new Date() && viewingTask.status !== 'completed' 
                      ? 'text-red-500 font-medium' 
                      : ''
                  }`}>
                    {format(new Date(viewingTask.deadline), "MMM dd, yyyy 'at' HH:mm")}
                    {new Date(viewingTask.deadline) < new Date() && viewingTask.status !== 'completed' && (
                      <span className="ml-2 text-xs bg-red-100 text-red-700 px-2 py-1 rounded">Overdue</span>
                    )}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-primary-border">
                <div>
                  <label className="block text-sm font-medium text-primary-muted mb-1">
                    Created
                  </label>
                  <p className="text-sm text-primary-fg">
                    {format(new Date(viewingTask.createdAt), "MMM dd, yyyy 'at' HH:mm")}
                  </p>
                  {viewingTask.createdByName && (
                    <p className="text-xs text-primary-muted mt-1">
                      By: {viewingTask.createdByName}
                      {viewingTask.createdByEmail && ` (${viewingTask.createdByEmail})`}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-primary-muted mb-1">
                    Last Updated
                  </label>
                  <p className="text-sm text-primary-fg">
                    {format(new Date(viewingTask.updatedAt), "MMM dd, yyyy 'at' HH:mm")}
                  </p>
                </div>
              </div>

              {viewingTask.status === 'completed' && viewingTask.completedAt && (
                <div>
                  <label className="block text-sm font-medium text-primary-muted mb-1">
                    Completed
                  </label>
                  <p className="text-sm text-green-600 font-medium">
                    {format(new Date(viewingTask.completedAt), "MMM dd, yyyy 'at' HH:mm")}
                  </p>
                </div>
              )}

              {/* Remarks Section */}
              <div className="pt-4 border-t border-primary-border">
                <div className="flex items-center gap-2 mb-4">
                  <MessageSquare className="h-5 w-5 text-primary-accent" />
                  <h3 className="text-lg font-semibold text-primary-fg">Remarks</h3>
                  <span className="text-sm text-primary-muted">({taskRemarks.length})</span>
                </div>

                {/* Add Remark Form */}
                <div className="mb-4">
                  <textarea
                    value={newRemark}
                    onChange={(e) => setNewRemark(e.target.value)}
                    placeholder="Add a remark or comment..."
                    rows={3}
                    className="w-full px-3 py-2 border border-primary-border rounded-lg bg-primary-bg text-primary-fg placeholder-primary-muted focus:outline-none focus:ring-2 focus:ring-primary-accent resize-none"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                        handleAddRemark();
                      }
                    }}
                  />
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-xs text-primary-muted">
                      Press Ctrl+Enter or Cmd+Enter to submit
                    </p>
                    <button
                      onClick={handleAddRemark}
                      disabled={!newRemark.trim() || addingRemark}
                      className="btn-primary flex items-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {addingRemark ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Adding...
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4" />
                          Add Remark
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Remarks List */}
                {loadingRemarks ? (
                  <div className="text-center py-4">
                    <div className="w-6 h-6 border-2 border-primary-accent border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    <p className="text-sm text-primary-muted">Loading remarks...</p>
                  </div>
                ) : taskRemarks.length === 0 ? (
                  <div className="text-center py-8 border border-primary-border rounded-lg bg-primary-bg/50">
                    <MessageSquare className="h-8 w-8 text-primary-muted mx-auto mb-2" />
                    <p className="text-sm text-primary-muted">No remarks yet. Be the first to add one!</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {taskRemarks.map((remark) => (
                      <div
                        key={remark.id}
                        className="border border-primary-border rounded-lg p-4 bg-primary-bg/50"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-primary-muted" />
                            <span className="font-medium text-primary-fg">
                              {remark.userName || remark.userEmail || 'Unknown User'}
                            </span>
                            {remark.userEmail && remark.userName && (
                              <span className="text-xs text-primary-muted">
                                ({remark.userEmail})
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-primary-muted">
                            {format(new Date(remark.createdAt), "MMM dd, yyyy 'at' HH:mm")}
                          </span>
                        </div>
                        <p className="text-sm text-primary-fg whitespace-pre-wrap">
                          {remark.remark}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-4 border-t border-primary-border">
                <button
                  onClick={closeModal}
                  className="flex-1 px-4 py-2 border border-primary-border text-primary-fg rounded-lg hover:bg-primary-accent-light transition-colors"
                >
                  Close
                </button>
                {isCreator(viewingTask) && (
                  <button
                    onClick={() => {
                      setViewingTask(null);
                      openEditModal(viewingTask);
                    }}
                    className="flex-1 px-4 py-2 bg-primary-accent text-white rounded-lg hover:bg-primary-accent-dark transition-colors"
                  >
                    Edit Task
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

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
                  Submission Deadline (for assignee)
                </label>
                <input
                  type="datetime-local"
                  value={formData.submissionDeadline}
                  onChange={(e) => setFormData({ ...formData, submissionDeadline: e.target.value })}
                  className="w-full px-3 py-2 border border-primary-border rounded-lg bg-primary-bg text-primary-fg"
                />
                <p className="text-xs text-primary-muted mt-1">Optional: When the assignee should submit the work</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-primary-fg mb-2">
                  Presentation Deadline (for creator - visible only to you)
                </label>
                <input
                  type="datetime-local"
                  value={formData.deadline}
                  onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                  className="w-full px-3 py-2 border border-primary-border rounded-lg bg-primary-bg text-primary-fg"
                />
                <p className="text-xs text-primary-muted mt-1">Optional: When you need to present/review the work (only visible to creator)</p>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={editingTask ? handleEditTask : handleCreateTask}
                  disabled={creatingTask}
                  className="flex-1 px-4 py-2 bg-primary-accent text-white rounded-lg hover:bg-primary-accent-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {creatingTask ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      {editingTask ? 'Updating...' : 'Creating...'}
                    </>
                  ) : (
                    editingTask ? 'Update' : 'Create'
                  )}
                </button>
                <button
                  onClick={closeModal}
                  disabled={creatingTask}
                  className="px-4 py-2 border border-primary-border text-primary-fg rounded-lg hover:bg-primary-accent-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
  onView,
  isCreator,
  onDragStart,
  getTimeTaken,
  isOverdue,
  draggedTask,
  currentUserId,
}: {
  task: Task;
  onStatusChange: (taskId: string, status: 'not_started' | 'in_progress' | 'completed') => void;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  onView: (task: Task) => void;
  isCreator: boolean;
  onDragStart: (e: React.DragEvent, task: Task) => void;
  getTimeTaken: (task: Task) => string | null;
  isOverdue: (task: Task) => boolean;
  draggedTask?: Task | null;
  currentUserId?: string;
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
      onClick={(e) => {
        // Don't open view modal if clicking on buttons or drag handle
        const target = e.target as HTMLElement;
        if (target.closest('button') || target.closest('.cursor-move')) {
          return;
        }
        onView(task);
      }}
      className={`border-2 rounded-lg p-3 bg-white hover:shadow-lg transition-all cursor-pointer select-none ${
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
        
        {/* Show submission deadline to assignee */}
        {task.submissionDeadline && task.assignedTo === currentUserId && (
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span className={new Date(task.submissionDeadline) < new Date() && task.status !== 'completed' ? 'text-red-500 font-medium' : ''}>
              Submission: {format(new Date(task.submissionDeadline), "MMM dd, yyyy HH:mm")}
            </span>
          </div>
        )}
        
        {/* Show presentation deadline only to creator */}
        {task.deadline && task.createdBy === currentUserId && (
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span className={new Date(task.deadline) < new Date() && task.status !== 'completed' ? 'text-red-500 font-medium' : ''}>
              Presentation: {format(new Date(task.deadline), "MMM dd, yyyy HH:mm")}
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


