"use client";

import { useState, useEffect } from "react";
import { X, Save, Plus, Edit2, Trash2, GripVertical, Users, User, Calendar } from "lucide-react";
import { authenticatedFetch } from "@/lib/auth-utils";
import { API_BASE_URL } from "@/lib/api";

interface TemplateTask {
  id: string;
  templateId: string;
  title: string;
  description: string | null;
  order: number;
  submissionDeadlineOffset: number | null;
  presentationDeadlineOffset: number | null;
  assignedToGroupId: string | null;
  assignedToUserId: string | null;
  assignedToGroupName?: string | null;
  assignedToUserName?: string | null;
  isActive: boolean;
}

interface TemplateTaskEditorProps {
  templateId: string;
  onClose: () => void;
  onUpdate: () => void;
}

export function TemplateTaskEditor({ templateId, onClose, onUpdate }: TemplateTaskEditorProps) {
  const [tasks, setTasks] = useState<TemplateTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingTask, setEditingTask] = useState<TemplateTask | null>(null);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [groups, setGroups] = useState<any[]>([]);
  const [teamUsers, setTeamUsers] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    order: 0,
    submissionDeadlineOffset: null as number | null,
    presentationDeadlineOffset: null as number | null,
    assignedToGroupId: "",
    assignedToUserId: "",
  });

  useEffect(() => {
    fetchTasks();
    fetchRBACData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [templateId]);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const response = await authenticatedFetch(`${API_BASE_URL}/api/team/event-templates/${templateId}/tasks`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setTasks(data.data || []);
        }
      }
    } catch (err: any) {
      console.error("Error fetching tasks:", err);
      setError(err.message || "Failed to fetch tasks");
    } finally {
      setLoading(false);
    }
  };

  const fetchRBACData = async () => {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/api/team/rbac?type=all`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setGroups(data.data?.groups || []);
          setTeamUsers(data.data?.users || []);
        }
      }
    } catch (err) {
      console.error('Error fetching RBAC data:', err);
    }
  };

  const handleCreateTask = async () => {
    if (!formData.title.trim()) {
      setError("Task title is required");
      return;
    }

    // Validate: cannot assign to both group and user
    if (formData.assignedToGroupId && formData.assignedToUserId) {
      setError("Task cannot be assigned to both a group and a user");
      return;
    }

    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/api/team/event-templates/${templateId}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description || null,
          order: formData.order || tasks.length,
          submissionDeadlineOffset: formData.submissionDeadlineOffset !== null ? formData.submissionDeadlineOffset : null,
          presentationDeadlineOffset: formData.presentationDeadlineOffset !== null ? formData.presentationDeadlineOffset : null,
          assignedToGroupId: formData.assignedToGroupId || null,
          assignedToUserId: formData.assignedToUserId || null,
        }),
      });

      const data = await response.json();
      if (data.success) {
        await fetchTasks();
        setFormData({
          title: "",
          description: "",
          order: tasks.length,
          submissionDeadlineOffset: null,
          presentationDeadlineOffset: null,
          assignedToGroupId: "",
          assignedToUserId: "",
        });
        setShowTaskForm(false);
        setError(null);
        onUpdate();
      } else {
        setError(data.error || "Failed to create task");
      }
    } catch (err: any) {
      console.error("Error creating task:", err);
      setError(err.message || "Failed to create task");
    }
  };

  const handleUpdateTask = async () => {
    if (!editingTask || !formData.title.trim()) {
      setError("Task title is required");
      return;
    }

    // Validate: cannot assign to both group and user
    if (formData.assignedToGroupId && formData.assignedToUserId) {
      setError("Task cannot be assigned to both a group and a user");
      return;
    }

    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/api/team/event-templates/${templateId}/tasks/${editingTask.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description || null,
          order: formData.order,
          submissionDeadlineOffset: formData.submissionDeadlineOffset !== null ? formData.submissionDeadlineOffset : null,
          presentationDeadlineOffset: formData.presentationDeadlineOffset !== null ? formData.presentationDeadlineOffset : null,
          assignedToGroupId: formData.assignedToGroupId || null,
          assignedToUserId: formData.assignedToUserId || null,
        }),
      });

      const data = await response.json();
      if (data.success) {
        await fetchTasks();
        setEditingTask(null);
        setFormData({
          title: "",
          description: "",
          order: 0,
          submissionDeadlineOffset: null,
          presentationDeadlineOffset: null,
          assignedToGroupId: "",
          assignedToUserId: "",
        });
        setError(null);
        onUpdate();
      } else {
        setError(data.error || "Failed to update task");
      }
    } catch (err: any) {
      console.error("Error updating task:", err);
      setError(err.message || "Failed to update task");
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return;

    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/api/team/event-templates/${templateId}/tasks/${taskId}`, {
        method: "DELETE",
      });

      const data = await response.json();
      if (data.success) {
        await fetchTasks();
        onUpdate();
      } else {
        setError(data.error || "Failed to delete task");
      }
    } catch (err: any) {
      console.error("Error deleting task:", err);
      setError(err.message || "Failed to delete task");
    }
  };

  const handleEditClick = (task: TemplateTask) => {
    setEditingTask(task);
    setFormData({
      title: task.title,
      description: task.description || "",
      order: task.order,
      submissionDeadlineOffset: task.submissionDeadlineOffset,
      presentationDeadlineOffset: task.presentationDeadlineOffset,
      assignedToGroupId: task.assignedToGroupId || "",
      assignedToUserId: task.assignedToUserId || "",
    });
    setShowTaskForm(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="w-6 h-6 border-2 border-primary-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)}>
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <div className="flex justify-between items-center">
        <h3 className="font-semibold text-primary-fg">Tasks ({tasks.length})</h3>
        <button
          onClick={() => {
            setShowTaskForm(true);
            setEditingTask(null);
            setFormData({
              title: "",
              description: "",
              order: tasks.length,
              submissionDeadlineOffset: null,
              presentationDeadlineOffset: null,
              assignedToGroupId: "",
              assignedToUserId: "",
            });
          }}
          className="px-3 py-1.5 text-sm bg-primary-accent hover:bg-primary-accent-dark text-white rounded-lg flex items-center gap-2"
        >
          <Plus size={16} />
          Add Task
        </button>
      </div>

      {/* Task Form */}
      {showTaskForm && (
        <div className="border border-primary-border rounded-lg p-4 bg-primary-bg">
          <h4 className="font-medium text-primary-fg mb-4">
            {editingTask ? "Edit Task" : "Add Task"}
          </h4>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-primary-fg mb-1">Title *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 border border-primary-border rounded-lg bg-white text-primary-fg"
                placeholder="Task title"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-primary-fg mb-1">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={2}
                className="w-full px-3 py-2 border border-primary-border rounded-lg bg-white text-primary-fg"
                placeholder="Task description"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-primary-fg mb-1">Submission Deadline Offset (days)</label>
                <input
                  type="number"
                  value={formData.submissionDeadlineOffset ?? ""}
                  onChange={(e) => setFormData({ ...formData, submissionDeadlineOffset: e.target.value ? parseInt(e.target.value) : null })}
                  className="w-full px-3 py-2 border border-primary-border rounded-lg bg-white text-primary-fg"
                  placeholder="e.g., -7 (7 days before)"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-primary-fg mb-1">Presentation Deadline Offset (days)</label>
                <input
                  type="number"
                  value={formData.presentationDeadlineOffset ?? ""}
                  onChange={(e) => setFormData({ ...formData, presentationDeadlineOffset: e.target.value ? parseInt(e.target.value) : null })}
                  className="w-full px-3 py-2 border border-primary-border rounded-lg bg-white text-primary-fg"
                  placeholder="e.g., 0 (on event day)"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-primary-fg mb-1">Assign to Group</label>
                <select
                  value={formData.assignedToGroupId}
                  onChange={(e) => {
                    setFormData({ ...formData, assignedToGroupId: e.target.value, assignedToUserId: "" });
                  }}
                  className="w-full px-3 py-2 border border-primary-border rounded-lg bg-white text-primary-fg"
                >
                  <option value="">None</option>
                  {groups.map((group) => (
                    <option key={group.id} value={group.id}>
                      {group.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-primary-fg mb-1">Assign to User</label>
                <select
                  value={formData.assignedToUserId}
                  onChange={(e) => {
                    setFormData({ ...formData, assignedToUserId: e.target.value, assignedToGroupId: "" });
                  }}
                  className="w-full px-3 py-2 border border-primary-border rounded-lg bg-white text-primary-fg"
                >
                  <option value="">None</option>
                  {teamUsers.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.fullName || user.email}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-primary-fg mb-1">Order</label>
              <input
                type="number"
                value={formData.order}
                onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-primary-border rounded-lg bg-white text-primary-fg"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowTaskForm(false);
                  setEditingTask(null);
                  setFormData({
                    title: "",
                    description: "",
                    order: tasks.length,
                    submissionDeadlineOffset: null,
                    presentationDeadlineOffset: null,
                    assignedToGroupId: "",
                    assignedToUserId: "",
                  });
                }}
                className="flex-1 px-4 py-2 border border-primary-border rounded-lg text-primary-fg hover:bg-primary-bg"
              >
                Cancel
              </button>
              <button
                onClick={editingTask ? handleUpdateTask : handleCreateTask}
                className="flex-1 px-4 py-2 bg-primary-accent hover:bg-primary-accent-dark text-white rounded-lg font-medium"
              >
                {editingTask ? "Update" : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tasks List */}
      <div className="space-y-2">
        {tasks.length === 0 ? (
          <p className="text-primary-muted text-sm text-center py-4">No tasks in this template</p>
        ) : (
          tasks
            .sort((a, b) => a.order - b.order)
            .map((task) => (
              <div key={task.id} className="border border-primary-border rounded-lg p-3 bg-primary-bg">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <GripVertical className="h-4 w-4 text-primary-muted" />
                      <h4 className="font-medium text-primary-fg">{task.title}</h4>
                    </div>
                    {task.description && (
                      <p className="text-sm text-primary-muted ml-6 mb-2">{task.description}</p>
                    )}
                    <div className="flex items-center gap-4 ml-6 text-xs text-primary-muted">
                      {task.assignedToGroupId && (
                        <span className="flex items-center gap-1">
                          <Users size={12} />
                          Group: {task.assignedToGroupName || "Unknown"}
                        </span>
                      )}
                      {task.assignedToUserId && (
                        <span className="flex items-center gap-1">
                          <User size={12} />
                          User: {task.assignedToUserName || "Unknown"}
                        </span>
                      )}
                      {task.submissionDeadlineOffset !== null && (
                        <span className="flex items-center gap-1">
                          <Calendar size={12} />
                          Submission: {task.submissionDeadlineOffset > 0 ? '+' : ''}{task.submissionDeadlineOffset} days
                        </span>
                      )}
                      {task.presentationDeadlineOffset !== null && (
                        <span className="flex items-center gap-1">
                          <Calendar size={12} />
                          Presentation: {task.presentationDeadlineOffset > 0 ? '+' : ''}{task.presentationDeadlineOffset} days
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleEditClick(task)}
                      className="p-1.5 text-primary-accent hover:bg-primary-accent-light rounded"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => handleDeleteTask(task.id)}
                      className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))
        )}
      </div>
    </div>
  );
}

