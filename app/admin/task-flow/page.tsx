"use client";

import { useState, useEffect } from "react";
import { Calendar, CheckCircle, Clock, AlertCircle, Filter, Download, GitBranch } from "lucide-react";
import { authenticatedFetch, getTeamSession } from "@/lib/auth-utils";
import { API_BASE_URL } from "@/lib/api";
import { format } from "date-fns";
import { isSuperAdmin } from "@/lib/rbac";

interface TaskFlowData {
  taskId: string;
  taskTitle: string;
  eventId: string;
  eventTitle: string;
  assignedToUserId: string | null;
  assignedToName: string | null;
  assignedToGroupId: string | null;
  assignedGroupName: string | null;
  status: string;
  deadline: string | null;
  completedAt: string | null;
  createdAt: string;
  isOverdue: boolean;
  isOnTime: boolean;
}

export default function AdminTaskFlowPage() {
  const [tasks, setTasks] = useState<TaskFlowData[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterEventId, setFilterEventId] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterUser, setFilterUser] = useState<string>('');
  const [events, setEvents] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    checkAdmin();
    fetchEvents();
    fetchTaskFlow();
  }, [filterEventId, filterStatus, filterUser]);

  const checkAdmin = async () => {
    const session = getTeamSession();
    const userEmail = session?.email;
    if (userEmail) {
      const adminStatus = await isSuperAdmin(userEmail);
      if (!adminStatus) {
        window.location.href = '/tasks';
      }
    }
  };

  const fetchEvents = async () => {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/api/team/plan-of-action`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setEvents(data.data || []);
        }
      }
    } catch (error) {
      console.error('Error fetching events:', error);
    }
  };

  const fetchTaskFlow = async () => {
    try {
      setLoading(true);
      let url = `${API_BASE_URL}/api/team/tasks`;
      
      if (filterEventId) {
        url = `${API_BASE_URL}/api/team/events/${filterEventId}/tasks`;
      }

      const response = await authenticatedFetch(url);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          const allTasks = filterEventId ? data.data : data.data || [];
          
          // Transform to flow data format
          const flowData: TaskFlowData[] = allTasks.map((task: any) => {
            const deadline = task.deadline || task.submissionDeadline;
            const now = new Date();
            const deadlineDate = deadline ? new Date(deadline) : null;
            const isOverdue = deadlineDate ? deadlineDate < now && task.status !== 'completed' : false;
            const isOnTime = deadlineDate ? deadlineDate >= now || task.status === 'completed' : true;

            return {
              taskId: filterEventId ? task.taskId : task.id,
              taskTitle: filterEventId ? task.task.title : task.title,
              eventId: filterEventId ? filterEventId : (task.eventId || ''),
              eventTitle: events.find(e => e.id === (filterEventId || task.eventId))?.title || 'N/A',
              assignedToUserId: filterEventId ? task.assignedToUserId : task.assignedTo,
              assignedToName: filterEventId ? task.assignedUser?.fullName : task.assignedToName,
              assignedToGroupId: filterEventId ? task.assignedToGroupId : null,
              assignedGroupName: filterEventId ? task.assignedGroup?.name : null,
              status: filterEventId ? task.status : task.status,
              deadline,
              completedAt: filterEventId ? task.completedAt : task.completedAt,
              createdAt: filterEventId ? task.createdAt : task.createdAt,
              isOverdue,
              isOnTime,
            };
          });

          // Apply filters
          let filtered = flowData;
          if (filterStatus !== 'all') {
            filtered = filtered.filter(t => t.status === filterStatus);
          }
          if (filterUser) {
            filtered = filtered.filter(t => t.assignedToUserId === filterUser);
          }

          setTasks(filtered);
        }
      }
    } catch (error) {
      console.error('Error fetching task flow:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (task: TaskFlowData) => {
    if (task.status === 'completed') return 'bg-green-100 text-green-800 border-green-300';
    if (task.isOverdue) return 'bg-red-100 text-red-800 border-red-300';
    if (task.status === 'in_progress') return 'bg-blue-100 text-blue-800 border-blue-300';
    return 'bg-yellow-100 text-yellow-800 border-yellow-300';
  };

  const exportReport = () => {
    const csv = [
      ['Task Title', 'Event', 'Assigned To', 'Status', 'Deadline', 'Completed At', 'Overdue', 'On Time'].join(','),
      ...tasks.map(t => [
        `"${t.taskTitle}"`,
        `"${t.eventTitle}"`,
        `"${t.assignedToName || t.assignedGroupName || 'Unassigned'}"`,
        t.status,
        t.deadline ? format(new Date(t.deadline), 'yyyy-MM-dd HH:mm') : '',
        t.completedAt ? format(new Date(t.completedAt), 'yyyy-MM-dd HH:mm') : '',
        t.isOverdue ? 'Yes' : 'No',
        t.isOnTime ? 'Yes' : 'No',
      ].join(',')),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `task-flow-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-primary-fg mb-2">Task Flow Overview</h1>
          <p className="text-primary-muted">View all tasks, delays, and on-time status</p>
        </div>
        <button
          onClick={exportReport}
          className="btn-primary flex items-center gap-2"
        >
          <Download className="h-5 w-5" />
          Export Report
        </button>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-primary-fg mb-2">Event</label>
            <select
              value={filterEventId}
              onChange={(e) => setFilterEventId(e.target.value)}
              className="w-full px-4 py-2 border border-primary-border rounded-lg bg-primary-bg text-primary-fg"
            >
              <option value="">All Events</option>
              {events.map((event) => (
                <option key={event.id} value={event.id}>
                  {event.title}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-primary-fg mb-2">Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-4 py-2 border border-primary-border rounded-lg bg-primary-bg text-primary-fg"
            >
              <option value="all">All Status</option>
              <option value="not_started">Not Started</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="blocked">Blocked</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-primary-fg mb-2">User</label>
            <select
              value={filterUser}
              onChange={(e) => setFilterUser(e.target.value)}
              className="w-full px-4 py-2 border border-primary-border rounded-lg bg-primary-bg text-primary-fg"
            >
              <option value="">All Users</option>
              {/* Would need to fetch users list */}
            </select>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card">
          <div className="text-2xl font-bold text-primary-fg">{tasks.length}</div>
          <div className="text-sm text-primary-muted">Total Tasks</div>
        </div>
        <div className="card">
          <div className="text-2xl font-bold text-green-600">
            {tasks.filter(t => t.status === 'completed').length}
          </div>
          <div className="text-sm text-primary-muted">Completed</div>
        </div>
        <div className="card">
          <div className="text-2xl font-bold text-red-600">
            {tasks.filter(t => t.isOverdue).length}
          </div>
          <div className="text-sm text-primary-muted">Overdue</div>
        </div>
        <div className="card">
          <div className="text-2xl font-bold text-yellow-600">
            {tasks.filter(t => t.status === 'in_progress').length}
          </div>
          <div className="text-sm text-primary-muted">In Progress</div>
        </div>
      </div>

      {/* Tasks Table */}
      <div className="card overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-primary-border">
              <th className="text-left p-4 text-sm font-medium text-primary-fg">Task</th>
              <th className="text-left p-4 text-sm font-medium text-primary-fg">Event</th>
              <th className="text-left p-4 text-sm font-medium text-primary-fg">Assigned To</th>
              <th className="text-left p-4 text-sm font-medium text-primary-fg">Status</th>
              <th className="text-left p-4 text-sm font-medium text-primary-fg">Deadline</th>
              <th className="text-left p-4 text-sm font-medium text-primary-fg">Completed</th>
              <th className="text-left p-4 text-sm font-medium text-primary-fg">Timeline</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map((task) => (
              <tr key={task.taskId} className="border-b border-primary-border hover:bg-primary-bg">
                <td className="p-4">
                  <div className="font-medium text-primary-fg">{task.taskTitle}</div>
                </td>
                <td className="p-4 text-primary-muted">{task.eventTitle}</td>
                <td className="p-4 text-primary-muted">
                  {task.assignedToName || task.assignedGroupName || 'Unassigned'}
                </td>
                <td className="p-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(task)}`}>
                    {task.status.replace('_', ' ').toUpperCase()}
                  </span>
                </td>
                <td className="p-4 text-primary-muted">
                  {task.deadline ? format(new Date(task.deadline), 'MMM dd, yyyy HH:mm') : 'N/A'}
                </td>
                <td className="p-4 text-primary-muted">
                  {task.completedAt ? format(new Date(task.completedAt), 'MMM dd, yyyy HH:mm') : '-'}
                </td>
                <td className="p-4">
                  {task.isOverdue ? (
                    <div className="flex items-center gap-1 text-red-600">
                      <AlertCircle className="h-4 w-4" />
                      <span className="text-sm">Delayed</span>
                    </div>
                  ) : task.isOnTime ? (
                    <div className="flex items-center gap-1 text-green-600">
                      <CheckCircle className="h-4 w-4" />
                      <span className="text-sm">On Time</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-yellow-600">
                      <Clock className="h-4 w-4" />
                      <span className="text-sm">Pending</span>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {tasks.length === 0 && (
          <div className="text-center py-12">
            <p className="text-primary-muted">No tasks found</p>
          </div>
        )}
      </div>
    </div>
  );
}

