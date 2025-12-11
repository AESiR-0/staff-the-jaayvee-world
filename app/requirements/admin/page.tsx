"use client";

import { useState, useEffect } from "react";
import { FileText, CheckCircle, XCircle, Clock, MessageSquare, Calendar, Users, Send, Edit2 } from "lucide-react";
import { authenticatedFetch, getTeamSession } from "@/lib/auth-utils";
import { API_BASE_URL } from "@/lib/api";
import { isSuperAdmin } from "@/lib/rbac";

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

export default function AdminRequirementsPage() {
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved' | 'rejected' | 'converted_to_tasks'>('all');
  const [selectedRequirement, setSelectedRequirement] = useState<Requirement | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [reviewData, setReviewData] = useState({
    status: 'approved' as 'approved' | 'rejected',
    adminRemarks: '',
    deadline: '',
  });
  const [convertDeadline, setConvertDeadline] = useState('');
  const [processing, setProcessing] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    checkAdmin();
    fetchRequirements();
  }, []);

  const checkAdmin = async () => {
    const session = getTeamSession();
    const userId = session?.userId || session?.teamId || session?.staffId;
    if (userId) {
      const adminStatus = await isSuperAdmin(userId);
      setIsAdmin(adminStatus);
      if (!adminStatus) {
        // Redirect if not admin
        window.location.href = '/requirements';
      }
    }
  };

  const fetchRequirements = async () => {
    try {
      setLoading(true);
      const response = await authenticatedFetch(`${API_BASE_URL}/api/team/requirements?adminView=true`);
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

  const handleReview = (requirement: Requirement) => {
    setSelectedRequirement(requirement);
    setReviewData({
      status: requirement.status === 'rejected' ? 'rejected' : 'approved',
      adminRemarks: requirement.adminRemarks || '',
      deadline: requirement.deadline ? new Date(requirement.deadline).toISOString().split('T')[0] : '',
    });
    setShowReviewModal(true);
  };

  const handleSubmitReview = async () => {
    if (!selectedRequirement) return;

    if (reviewData.status === 'approved' && !reviewData.deadline) {
      alert('Please set a deadline for approved requirements');
      return;
    }

    try {
      setProcessing(true);
      const response = await authenticatedFetch(`${API_BASE_URL}/api/team/requirements/${selectedRequirement.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: reviewData.status,
          adminRemarks: reviewData.adminRemarks || null,
          deadline: reviewData.status === 'approved' ? reviewData.deadline : null,
        }),
      });

      const data = await response.json();
      if (data.success) {
        alert(`Requirement ${reviewData.status} successfully!`);
        setShowReviewModal(false);
        setSelectedRequirement(null);
        fetchRequirements();
      } else {
        alert(data.error || 'Failed to review requirement');
      }
    } catch (error) {
      console.error('Error reviewing requirement:', error);
      alert('Failed to review requirement');
    } finally {
      setProcessing(false);
    }
  };

  const handleConvertToTasks = (requirement: Requirement) => {
    if (requirement.status !== 'approved') {
      alert('Only approved requirements can be converted to tasks');
      return;
    }
    setSelectedRequirement(requirement);
    setConvertDeadline(requirement.deadline ? new Date(requirement.deadline).toISOString().split('T')[0] : '');
    setShowConvertModal(true);
  };

  const handleSubmitConvert = async () => {
    if (!selectedRequirement) return;

    if (!convertDeadline) {
      alert('Please set a deadline for the tasks');
      return;
    }

    try {
      setProcessing(true);
      const response = await authenticatedFetch(`${API_BASE_URL}/api/team/requirements/${selectedRequirement.id}/convert-to-tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          deadline: convertDeadline,
        }),
      });

      const data = await response.json();
      if (data.success) {
        alert(`Successfully created ${data.data.tasksCreated} tasks!`);
        setShowConvertModal(false);
        setSelectedRequirement(null);
        fetchRequirements();
      } else {
        alert(data.error || 'Failed to convert requirement to tasks');
      }
    } catch (error) {
      console.error('Error converting requirement:', error);
      alert('Failed to convert requirement to tasks');
    } finally {
      setProcessing(false);
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

  const filteredRequirements = filterStatus === 'all' 
    ? requirements 
    : requirements.filter(r => r.status === filterStatus);

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
        <h1 className="text-3xl font-bold text-primary-fg mb-2">Requirements Overview</h1>
        <p className="text-primary-muted">Review and manage requirements from all groups</p>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {(['all', 'pending', 'approved', 'rejected', 'converted_to_tasks'] as const).map((status) => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            className={`px-4 py-2 rounded-lg border transition-colors ${
              filterStatus === status
                ? 'bg-primary-accent text-white border-primary-accent'
                : 'bg-primary-bg border-primary-border text-primary-fg hover:bg-primary-bg/50'
            }`}
          >
            {status.replace('_', ' ').toUpperCase()}
          </button>
        ))}
      </div>

      {/* Requirements List */}
      <div className="space-y-4">
        {filteredRequirements.length === 0 ? (
          <div className="card text-center py-12">
            <FileText className="h-12 w-12 mx-auto text-primary-muted mb-4" />
            <p className="text-primary-muted">No requirements found</p>
          </div>
        ) : (
          filteredRequirements.map((req) => (
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-3">
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
                    {req.deadline && (
                      <div>
                        <p className="text-primary-muted">Deadline:</p>
                        <p className="text-primary-fg">
                          {new Date(req.deadline).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                  </div>
                  {req.adminRemarks && (
                    <div className="mb-3 p-3 bg-primary-bg rounded-lg border border-primary-border">
                      <p className="text-sm font-medium text-primary-fg mb-1 flex items-center gap-2">
                        <MessageSquare className="h-4 w-4" />
                        Admin Remarks:
                      </p>
                      <p className="text-sm text-primary-muted">{req.adminRemarks}</p>
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-2 ml-4">
                  {req.status === 'pending' && (
                    <button
                      onClick={() => handleReview(req)}
                      className="px-4 py-2 bg-primary-accent text-white rounded-lg hover:bg-primary-accent/90 flex items-center gap-2"
                    >
                      <Edit2 className="h-4 w-4" />
                      Review
                    </button>
                  )}
                  {req.status === 'approved' && !req.convertedToTasksAt && (
                    <button
                      onClick={() => handleConvertToTasks(req)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                    >
                      <Send className="h-4 w-4" />
                      Convert to Tasks
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Review Modal */}
      {showReviewModal && selectedRequirement && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold text-primary-fg">Review Requirement</h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <h3 className="font-medium text-primary-fg mb-1">{selectedRequirement.title}</h3>
                {selectedRequirement.description && (
                  <p className="text-sm text-primary-muted">{selectedRequirement.description}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-primary-fg mb-2">
                  Status <span className="text-red-500">*</span>
                </label>
                <select
                  value={reviewData.status}
                  onChange={(e) => setReviewData({ ...reviewData, status: e.target.value as 'approved' | 'rejected' })}
                  className="w-full px-4 py-2 border border-primary-border rounded-lg bg-primary-bg text-primary-fg"
                >
                  <option value="approved">Approve</option>
                  <option value="rejected">Reject</option>
                </select>
              </div>
              {reviewData.status === 'approved' && (
                <div>
                  <label className="block text-sm font-medium text-primary-fg mb-2">
                    Deadline <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={reviewData.deadline}
                    onChange={(e) => setReviewData({ ...reviewData, deadline: e.target.value })}
                    className="w-full px-4 py-2 border border-primary-border rounded-lg bg-primary-bg text-primary-fg"
                    required
                  />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-primary-fg mb-2">
                  Remarks (Optional)
                </label>
                <textarea
                  value={reviewData.adminRemarks}
                  onChange={(e) => setReviewData({ ...reviewData, adminRemarks: e.target.value })}
                  className="w-full px-4 py-2 border border-primary-border rounded-lg bg-primary-bg text-primary-fg"
                  rows={4}
                  placeholder="Add remarks or feedback..."
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  onClick={() => setShowReviewModal(false)}
                  className="px-4 py-2 border border-primary-border rounded-lg hover:bg-primary-bg"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitReview}
                  disabled={processing}
                  className="btn-primary px-4 py-2 disabled:opacity-50"
                >
                  {processing ? 'Processing...' : 'Submit Review'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Convert to Tasks Modal */}
      {showConvertModal && selectedRequirement && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold text-primary-fg">Convert to Tasks</h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <h3 className="font-medium text-primary-fg mb-1">{selectedRequirement.title}</h3>
                <p className="text-sm text-primary-muted">
                  This will create tasks for all members of <strong>{selectedRequirement.receiverGroup?.name}</strong>
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-primary-fg mb-2">
                  Task Deadline <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={convertDeadline}
                  onChange={(e) => setConvertDeadline(e.target.value)}
                  className="w-full px-4 py-2 border border-primary-border rounded-lg bg-primary-bg text-primary-fg"
                  required
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  onClick={() => setShowConvertModal(false)}
                  className="px-4 py-2 border border-primary-border rounded-lg hover:bg-primary-bg"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitConvert}
                  disabled={processing}
                  className="btn-primary px-4 py-2 disabled:opacity-50"
                >
                  {processing ? 'Creating Tasks...' : 'Convert to Tasks'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


