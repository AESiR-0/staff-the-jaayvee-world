"use client";

import { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, Save, X, FileText } from "lucide-react";
import { authenticatedFetch, getTeamSession } from "@/lib/auth-utils";
import { API_BASE_URL } from "@/lib/api";
import { isSuperAdmin } from "@/lib/rbac";

interface Milestone {
  id?: string;
  title: string;
  description: string;
  milestoneType: string;
  targetValue: number;
  rewardType: string;
  rewardValue: number;
  order: number;
}

interface Task {
  id: string;
  title: string;
  description: string | null;
  influencerId: string;
  eventId: string | null;
  status: string;
  milestones: Milestone[];
  terms: {
    termsContent: string;
  } | null;
}

export default function InfluencerTasksAdminPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [influencers, setInfluencers] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    checkAdmin();
    fetchTasks();
    fetchInfluencers();
    fetchEvents();
  }, []);

  const checkAdmin = async () => {
    const session = getTeamSession();
    const userEmail = session?.email;
    if (userEmail) {
      const adminStatus = await isSuperAdmin(userEmail);
      setIsAdmin(adminStatus);
      if (!adminStatus) {
        window.location.href = '/dashboard';
      }
    }
  };

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const response = await authenticatedFetch(`${API_BASE_URL}/api/admin/influencer-tasks`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setTasks(data.data || []);
        }
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchInfluencers = async () => {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/api/influencers`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setInfluencers(data.data || []);
        }
      }
    } catch (error) {
      console.error('Error fetching influencers:', error);
    }
  };

  const fetchEvents = async () => {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/api/talaash/events/summary`);
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

  const handleCreateTask = async (formData: any) => {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/api/admin/influencer-tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        await fetchTasks();
        setShowCreateModal(false);
      }
    } catch (error) {
      console.error('Error creating task:', error);
      alert('Failed to create task');
    }
  };

  const handleUpdateTask = async (taskId: string, formData: any) => {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/api/admin/influencer-tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        await fetchTasks();
        setEditingTask(null);
      }
    } catch (error) {
      console.error('Error updating task:', error);
      alert('Failed to update task');
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return;

    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/api/admin/influencer-tasks/${taskId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchTasks();
      }
    } catch (error) {
      console.error('Error deleting task:', error);
      alert('Failed to delete task');
    }
  };

  if (!isAdmin) {
    return null;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-primary-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-primary-fg mb-2">Influencer Tasks</h1>
          <p className="text-primary-muted">Manage tasks and milestones for influencers</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="h-5 w-5" />
          Create Task
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            influencers={influencers}
            events={events}
            onEdit={setEditingTask}
            onDelete={handleDeleteTask}
            onUpdate={handleUpdateTask}
          />
        ))}
        {tasks.length === 0 && (
          <div className="card text-center py-12">
            <p className="text-primary-muted">No tasks found</p>
          </div>
        )}
      </div>

      {showCreateModal && (
        <TaskModal
          influencers={influencers}
          events={events}
          onSave={handleCreateTask}
          onClose={() => setShowCreateModal(false)}
        />
      )}

      {editingTask && (
        <TaskModal
          task={editingTask}
          influencers={influencers}
          events={events}
          onSave={(data) => handleUpdateTask(editingTask.id, data)}
          onClose={() => setEditingTask(null)}
        />
      )}
    </div>
  );
}

function TaskCard({
  task,
  influencers,
  events,
  onEdit,
  onDelete,
  onUpdate,
}: {
  task: Task;
  influencers: any[];
  events: any[];
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  onUpdate: (taskId: string, data: any) => void;
}) {
  const influencer = influencers.find(i => i.id === task.influencerId);
  const event = events.find(e => e.id === task.eventId);

  return (
    <div className="card">
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-xl font-semibold text-primary-fg mb-2">{task.title}</h3>
            {task.description && (
              <p className="text-primary-muted mb-2">{task.description}</p>
            )}
            <div className="flex gap-4 text-sm text-primary-muted">
              <span>Influencer: {influencer?.user?.fullName || 'N/A'}</span>
              {event && <span>Event: {event.title}</span>}
              <span className={`px-2 py-1 rounded ${
                task.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
              }`}>
                {task.status}
              </span>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => onEdit(task)}
              className="p-2 hover:bg-primary-bg rounded"
            >
              <Edit2 className="h-4 w-4" />
            </button>
            <button
              onClick={() => onDelete(task.id)}
              className="p-2 hover:bg-red-500/20 rounded text-red-500"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <h4 className="font-medium text-primary-fg">Milestones:</h4>
          {task.milestones.map((milestone, index) => (
            <div key={milestone.id || index} className="p-2 bg-primary-bg rounded text-sm">
              <span className="font-medium">{milestone.title}</span>
              {milestone.rewardValue > 0 && (
                <span className="text-primary-accent ml-2">+₹{milestone.rewardValue}</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function TaskModal({
  task,
  influencers,
  events,
  onSave,
  onClose,
}: {
  task?: Task;
  influencers: any[];
  events: any[];
  onSave: (data: any) => void;
  onClose: () => void;
}) {
  const [formData, setFormData] = useState({
    influencerId: task?.influencerId || '',
    eventId: task?.eventId || '',
    title: task?.title || '',
    description: task?.description || '',
    status: task?.status || 'active',
    milestones: task?.milestones || [] as Milestone[],
    termsContent: task?.terms?.termsContent || '',
  });

  const addMilestone = () => {
    setFormData({
      ...formData,
      milestones: [
        ...formData.milestones,
        {
          title: '',
          description: '',
          milestoneType: 'share_link',
          targetValue: 1,
          rewardType: '',
          rewardValue: 0,
          order: formData.milestones.length,
        },
      ],
    });
  };

  const updateMilestone = (index: number, updates: Partial<Milestone>) => {
    const updated = [...formData.milestones];
    updated[index] = { ...updated[index], ...updates };
    setFormData({ ...formData, milestones: updated });
  };

  const removeMilestone = (index: number) => {
    setFormData({
      ...formData,
      milestones: formData.milestones.filter((_, i) => i !== index),
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">{task ? 'Edit Task' : 'Create Task'}</h2>
            <button onClick={onClose} className="text-primary-muted hover:text-primary-fg">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Influencer *</label>
            <select
              value={formData.influencerId}
              onChange={(e) => setFormData({ ...formData, influencerId: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg"
              required
            >
              <option value="">Select Influencer</option>
              {influencers.map((inf) => (
                <option key={inf.id} value={inf.id}>
                  {inf.user?.fullName || inf.id}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Event (Optional)</label>
            <select
              value={formData.eventId || ''}
              onChange={(e) => setFormData({ ...formData, eventId: e.target.value || null })}
              className="w-full px-4 py-2 border rounded-lg"
            >
              <option value="">No Event</option>
              {events.map((event) => (
                <option key={event.id} value={event.id}>
                  {event.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Title *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg"
            >
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="expired">Expired</option>
            </select>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium">Milestones</label>
              <button
                onClick={addMilestone}
                className="text-sm text-primary-accent hover:text-primary-accent-dark"
              >
                + Add Milestone
              </button>
            </div>
            <div className="space-y-3">
              {formData.milestones.map((milestone, index) => (
                <div key={index} className="p-4 border rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-sm font-medium">Milestone {index + 1}</span>
                    <button
                      onClick={() => removeMilestone(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mb-2">
                    <input
                      type="text"
                      placeholder="Title"
                      value={milestone.title}
                      onChange={(e) => updateMilestone(index, { title: e.target.value })}
                      className="px-3 py-2 border rounded text-sm"
                    />
                    <select
                      value={milestone.milestoneType}
                      onChange={(e) => updateMilestone(index, { milestoneType: e.target.value })}
                      className="px-3 py-2 border rounded text-sm"
                    >
                      <option value="share_link">Share Link</option>
                      <option value="get_booking">Get Booking</option>
                    </select>
                  </div>
                  <textarea
                    placeholder="Description"
                    value={milestone.description}
                    onChange={(e) => updateMilestone(index, { description: e.target.value })}
                    className="w-full px-3 py-2 border rounded text-sm mb-2"
                    rows={2}
                  />
                  <div className="grid grid-cols-3 gap-2">
                    <input
                      type="number"
                      placeholder="Target"
                      value={milestone.targetValue}
                      onChange={(e) => updateMilestone(index, { targetValue: parseInt(e.target.value) || 1 })}
                      className="px-3 py-2 border rounded text-sm"
                    />
                    <input
                      type="number"
                      placeholder="Reward (₹)"
                      value={milestone.rewardValue}
                      onChange={(e) => updateMilestone(index, { rewardValue: parseInt(e.target.value) || 0 })}
                      className="px-3 py-2 border rounded text-sm"
                    />
                    <select
                      value={milestone.rewardType || ''}
                      onChange={(e) => updateMilestone(index, { rewardType: e.target.value || null })}
                      className="px-3 py-2 border rounded text-sm"
                    >
                      <option value="">No Reward</option>
                      <option value="wallet_credit">Wallet Credit</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Terms & Conditions</label>
            <textarea
              value={formData.termsContent}
              onChange={(e) => setFormData({ ...formData, termsContent: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg"
              rows={6}
              placeholder="Enter terms and conditions..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              onClick={onClose}
              className="px-4 py-2 border rounded-lg hover:bg-primary-bg"
            >
              Cancel
            </button>
            <button
              onClick={() => onSave(formData)}
              className="btn-primary px-4 py-2"
            >
              {task ? 'Update' : 'Create'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

