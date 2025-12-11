"use client";

import { useState, useEffect } from "react";
import { FileText, Send, Users, Calendar, CheckCircle, XCircle, Clock, MessageSquare } from "lucide-react";
import { authenticatedFetch, getTeamSession } from "@/lib/auth-utils";
import { API_BASE_URL } from "@/lib/api";

interface Group {
  id: string;
  name: string;
  description: string | null;
}

interface Requirement {
  id: string;
  title: string;
  description: string | null;
  senderUserId: string;
  sender: {
    id: string;
    email: string;
    fullName: string | null;
  } | null;
  senderGroupId: string | null;
  senderGroup: {
    id: string;
    name: string;
    description: string | null;
  } | null;
  receiverGroupId: string;
  receiverGroup: {
    id: string;
    name: string;
    description: string | null;
  } | null;
  status: 'pending' | 'approved' | 'rejected' | 'converted_to_tasks';
  adminRemarks: string | null;
  adminReviewedBy: string | null;
  adminReviewer: {
    id: string;
    email: string;
    fullName: string | null;
  } | null;
  adminReviewedAt: string | null;
  deadline: string | null;
  convertedToTasksAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function RequirementsPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    receiverGroupId: '',
    senderGroupId: '',
  });

  const session = getTeamSession();
  const currentUserId = session?.userId || session?.teamId || session?.staffId;

  useEffect(() => {
    fetchGroups();
    fetchRequirements();
  }, []);

  const fetchGroups = async () => {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/api/team/groups`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setGroups(data.data || []);
        }
      }
    } catch (error) {
      console.error('Error fetching groups:', error);
    }
  };

  const fetchRequirements = async () => {
    try {
      setLoading(true);
      const response = await authenticatedFetch(`${API_BASE_URL}/api/team/requirements`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setRequirements(data.data || []);
        }
      }
    } catch (error) {
      console.error('Error fetching requirements:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.receiverGroupId) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      setSubmitting(true);
      const response = await authenticatedFetch(`${API_BASE_URL}/api/team/requirements`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description || null,
          receiverGroupId: formData.receiverGroupId,
          senderGroupId: formData.senderGroupId || null,
        }),
      });

      const data = await response.json();
      if (data.success) {
        alert('Requirement sent successfully!');
        setShowCreateModal(false);
        setFormData({
          title: '',
          description: '',
          receiverGroupId: '',
          senderGroupId: '',
        });
        fetchRequirements();
      } else {
        alert(data.error || 'Failed to send requirement');
      }
    } catch (error) {
      console.error('Error sending requirement:', error);
      alert('Failed to send requirement');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'rejected':
        return <XCircle className="h-5 w-5 text-red-600" />;
      case 'converted_to_tasks':
        return <CheckCircle className="h-5 w-5 text-blue-600" />;
      default:
        return <Clock className="h-5 w-5 text-yellow-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'converted_to_tasks':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      default:
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-primary-fg mb-2">Requirements</h1>
          <p className="text-primary-muted">Send requirements to other departments/groups</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Send className="h-5 w-5" />
          Send Requirement
        </button>
      </div>

      {/* Requirements List */}
      <div className="space-y-4">
        {requirements.length === 0 ? (
          <div className="card text-center py-12">
            <FileText className="h-12 w-12 mx-auto text-primary-muted mb-4" />
            <p className="text-primary-muted">No requirements found</p>
            <p className="text-sm text-primary-muted mt-2">Click "Send Requirement" to create one</p>
          </div>
        ) : (
          requirements.map((req) => (
            <div key={req.id} className="card">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-primary-fg">{req.title}</h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(req.status)}`}>
                      {req.status.replace('_', ' ').toUpperCase()}
                    </span>
                    {getStatusIcon(req.status)}
                  </div>
                  {req.description && (
                    <p className="text-primary-muted mb-3">{req.description}</p>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-primary-muted">From:</p>
                      <p className="text-primary-fg font-medium">
                        {req.senderGroup?.name || req.sender?.fullName || req.sender?.email || 'Unknown'}
                      </p>
                    </div>
                    <div>
                      <p className="text-primary-muted">To:</p>
                      <p className="text-primary-fg font-medium">
                        {req.receiverGroup?.name || 'Unknown Group'}
                      </p>
                    </div>
                    <div>
                      <p className="text-primary-muted">Created:</p>
                      <p className="text-primary-fg">
                        {new Date(req.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    {req.adminReviewedAt && (
                      <div>
                        <p className="text-primary-muted">Reviewed:</p>
                        <p className="text-primary-fg">
                          {new Date(req.adminReviewedAt).toLocaleDateString()}
                          {req.adminReviewer && ` by ${req.adminReviewer.fullName || req.adminReviewer.email}`}
                        </p>
                      </div>
                    )}
                  </div>
                  {req.adminRemarks && (
                    <div className="mt-3 p-3 bg-primary-bg rounded-lg border border-primary-border">
                      <p className="text-sm font-medium text-primary-fg mb-1 flex items-center gap-2">
                        <MessageSquare className="h-4 w-4" />
                        Admin Remarks:
                      </p>
                      <p className="text-sm text-primary-muted">{req.adminRemarks}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-primary-fg">Send Requirement</h2>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-primary-muted hover:text-primary-fg"
                >
                  <XCircle className="h-5 w-5" />
                </button>
              </div>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-primary-fg mb-2">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2 border border-primary-border rounded-lg bg-primary-bg text-primary-fg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-primary-fg mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 border border-primary-border rounded-lg bg-primary-bg text-primary-fg"
                  rows={4}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-primary-fg mb-2">
                  Your Group (Optional)
                </label>
                <select
                  value={formData.senderGroupId}
                  onChange={(e) => setFormData({ ...formData, senderGroupId: e.target.value })}
                  className="w-full px-4 py-2 border border-primary-border rounded-lg bg-primary-bg text-primary-fg"
                >
                  <option value="">Select your group (optional)</option>
                  {groups.map((group) => (
                    <option key={group.id} value={group.id}>
                      {group.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-primary-fg mb-2">
                  Send To Group <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.receiverGroupId}
                  onChange={(e) => setFormData({ ...formData, receiverGroupId: e.target.value })}
                  className="w-full px-4 py-2 border border-primary-border rounded-lg bg-primary-bg text-primary-fg"
                  required
                >
                  <option value="">Select receiver group</option>
                  {groups.map((group) => (
                    <option key={group.id} value={group.id}>
                      {group.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-primary-border rounded-lg hover:bg-primary-bg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary px-4 py-2 disabled:opacity-50"
                >
                  {submitting ? 'Sending...' : 'Send Requirement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}


