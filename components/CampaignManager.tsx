'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Lock, Unlock, Clock, Users, Loader2, AlertCircle, Save, X, Upload } from 'lucide-react';
import WhatsAppRichTextEditor from './WhatsAppRichTextEditor';
import { authenticatedFetch } from '@/lib/auth-utils';
import { API_BASE_URL } from '@/lib/api';
import { type CSVListItem } from './CSVListTable';
import CSVListTable from './CSVListTable';
import CSVUploadModal from './CSVUploadModal';

interface CampaignMessage {
  id?: string;
  dayNumber: number;
  messageTemplate: string;
  isLocked: boolean;
}

interface Campaign {
  id?: string;
  name: string;
  csvListIds: string[];
  csvListNames?: string[];
  totalContacts?: number;
  scheduledTime: string;
  startDate: string;
  isActive: boolean;
  isLocked: boolean;
  messages: CampaignMessage[];
}

interface CampaignManagerProps {
  csvLists: CSVListItem[];
  onRefreshCsvLists?: () => void;
}

export default function CampaignManager({ csvLists, onRefreshCsvLists }: CampaignManagerProps) {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await authenticatedFetch(`${API_BASE_URL}/api/whatsapp/campaigns`);
      const data = await response.json();

      if (data.success) {
        setCampaigns(data.data || []);
      } else {
        setError(data.error || 'Failed to fetch campaigns');
      }
    } catch (err: any) {
      console.error('Error fetching campaigns:', err);
      setError(err.message || 'Failed to fetch campaigns');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    const newCampaign: Campaign = {
      name: '',
      csvListIds: [],
      scheduledTime: '09:00',
      startDate: new Date().toISOString().split('T')[0],
      isActive: true,
      isLocked: false,
      messages: Array.from({ length: 8 }, (_, i) => ({
        dayNumber: i + 1,
        messageTemplate: '',
        isLocked: false,
      })),
    };
    setEditingCampaign(newCampaign);
    setShowCreateModal(true);
  };

  const handleEdit = (campaign: Campaign) => {
    if (campaign.isLocked) {
      alert('This campaign is locked and cannot be edited. Unlock it first.');
      return;
    }
    setEditingCampaign({ ...campaign });
    setShowCreateModal(true);
  };

  const handleSave = async () => {
    if (!editingCampaign) return;

    // Validation
    if (!editingCampaign.name.trim()) {
      alert('Campaign name is required');
      return;
    }

    if (editingCampaign.csvListIds.length === 0) {
      alert('Please select at least one CSV list');
      return;
    }

    // Validate all 8 messages have content
    for (const msg of editingCampaign.messages) {
      if (!msg.messageTemplate.trim()) {
        alert(`Message for Day ${msg.dayNumber} is required`);
        return;
      }
    }

    setSaving(true);
    try {
      const url = editingCampaign.id
        ? `${API_BASE_URL}/api/whatsapp/campaigns/${editingCampaign.id}`
        : `${API_BASE_URL}/api/whatsapp/campaigns`;

      const method = editingCampaign.id ? 'PUT' : 'POST';

      const response = await authenticatedFetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: editingCampaign.name.trim(),
          csvListIds: editingCampaign.csvListIds,
          scheduledTime: editingCampaign.scheduledTime,
          startDate: editingCampaign.startDate,
          isActive: editingCampaign.isActive,
          messages: editingCampaign.messages.map(m => ({
            id: m.id,
            dayNumber: m.dayNumber,
            messageTemplate: m.messageTemplate.trim(),
          })),
        }),
      });

      const data = await response.json();

      if (data.success) {
        fetchCampaigns();
        setShowCreateModal(false);
        setEditingCampaign(null);
      } else {
        alert(data.error || 'Failed to save campaign');
      }
    } catch (err: any) {
      console.error('Error saving campaign:', err);
      alert(err.message || 'Failed to save campaign');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    const campaign = campaigns.find(c => c.id === id);
    if (!campaign) return;

    if (campaign.isLocked) {
      alert('This campaign is locked and cannot be deleted. Unlock it first.');
      return;
    }

    if (!confirm(`Are you sure you want to delete "${campaign.name}"?`)) {
      return;
    }

    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/api/whatsapp/campaigns/${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      if (data.success) {
        fetchCampaigns();
      } else {
        alert(data.error || 'Failed to delete campaign');
      }
    } catch (err: any) {
      console.error('Error deleting campaign:', err);
      alert(err.message || 'Failed to delete campaign');
    }
  };

  const handleLockToggle = async (id: string, currentLocked: boolean, messageId?: string, dayNumber?: number) => {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/api/whatsapp/campaigns/${id}/lock`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isLocked: !currentLocked,
          messageId: messageId,
          dayNumber: dayNumber,
        }),
      });

      const data = await response.json();
      if (data.success) {
        fetchCampaigns();
      } else {
        alert(data.error || 'Failed to update lock status');
      }
    } catch (err: any) {
      console.error('Error toggling lock:', err);
      alert(err.message || 'Failed to update lock status');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">8-Day Message Campaigns</h2>
          <p className="text-sm text-gray-600 mt-1">
            Create campaigns with 8 messages that send one per day to your selected CSV lists
          </p>
        </div>
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          <Plus size={20} />
          Create Campaign
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-red-800 font-medium">Error</p>
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Campaigns List */}
      <div className="space-y-4">
        {campaigns.map((campaign) => (
          <div
            key={campaign.id}
            className={`border rounded-lg p-6 ${
              campaign.isLocked
                ? 'border-yellow-300 bg-yellow-50'
                : 'border-gray-200 bg-white'
            }`}
          >
            {/* Campaign Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-semibold text-gray-900">{campaign.name}</h3>
                  {campaign.isLocked && (
                    <span className="inline-flex items-center gap-1 text-xs text-yellow-700 bg-yellow-100 px-2 py-1 rounded">
                      <Lock size={12} />
                      Locked
                    </span>
                  )}
                  {campaign.isActive ? (
                    <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">
                      Active
                    </span>
                  ) : (
                    <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs font-medium">
                      Inactive
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <Clock size={14} />
                    <span>{formatTime(campaign.scheduledTime)} daily</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users size={14} />
                    <span>
                      {campaign.totalContacts?.toLocaleString() || 0} contacts
                    </span>
                  </div>
                  <span>Starts: {formatDate(campaign.startDate)}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleLockToggle(campaign.id!, campaign.isLocked)}
                  className="text-gray-400 hover:text-gray-600"
                  title={campaign.isLocked ? 'Unlock' : 'Lock'}
                >
                  {campaign.isLocked ? <Lock size={18} /> : <Unlock size={18} />}
                </button>
                <button
                  onClick={() => handleEdit(campaign)}
                  disabled={campaign.isLocked}
                  className="px-3 py-1.5 text-sm bg-blue-50 text-blue-700 rounded hover:bg-blue-100 disabled:opacity-50"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(campaign.id!)}
                  disabled={campaign.isLocked}
                  className="px-3 py-1.5 text-sm bg-red-50 text-red-700 rounded hover:bg-red-100 disabled:opacity-50"
                >
                  Delete
                </button>
              </div>
            </div>

            {/* 8 Messages Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
              {campaign.messages.map((msg) => (
                <div
                  key={msg.dayNumber}
                  className={`border rounded-lg p-3 ${
                    msg.isLocked
                      ? 'border-yellow-300 bg-yellow-50'
                      : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Day {msg.dayNumber}</span>
                    {msg.isLocked && (
                      <Lock size={14} className="text-yellow-600" />
                    )}
                  </div>
                  <p className="text-xs text-gray-600 line-clamp-2">
                    {msg.messageTemplate.substring(0, 50)}
                    {msg.messageTemplate.length > 50 ? '...' : ''}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ))}

        {campaigns.length === 0 && (
          <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
            <p className="text-gray-500 mb-4">No campaigns yet</p>
            <button
              onClick={handleCreate}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Create Your First Campaign
            </button>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showCreateModal && editingCampaign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-900">
                {editingCampaign.id ? 'Edit Campaign' : 'Create Campaign'}
              </h2>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setEditingCampaign(null);
                }}
                className="text-gray-400 hover:text-gray-600"
                disabled={saving}
              >
                <X size={24} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Campaign Details */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Campaign Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={editingCampaign.name}
                    onChange={(e) =>
                      setEditingCampaign({ ...editingCampaign, name: e.target.value })
                    }
                    disabled={saving || editingCampaign.isLocked}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                    placeholder="e.g., Welcome Series"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Scheduled Time <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="time"
                    value={editingCampaign.scheduledTime}
                    onChange={(e) =>
                      setEditingCampaign({ ...editingCampaign, scheduledTime: e.target.value })
                    }
                    disabled={saving || editingCampaign.isLocked}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={editingCampaign.startDate}
                  onChange={(e) =>
                    setEditingCampaign({ ...editingCampaign, startDate: e.target.value })
                  }
                  disabled={saving || editingCampaign.isLocked}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                />
              </div>

              {/* CSV Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select CSV Lists <span className="text-red-500">*</span>
                </label>
                <div className="border border-gray-300 rounded-md p-4 max-h-64 overflow-y-auto">
                  <CSVListTable
                    csvLists={csvLists}
                    selectedIds={editingCampaign.csvListIds}
                    onSelect={(id) => {
                      const newIds = editingCampaign.csvListIds.includes(id)
                        ? editingCampaign.csvListIds.filter(i => i !== id)
                        : [...editingCampaign.csvListIds, id];
                      setEditingCampaign({ ...editingCampaign, csvListIds: newIds });
                    }}
                    onSelectAll={(selected) => {
                      setEditingCampaign({
                        ...editingCampaign,
                        csvListIds: selected ? csvLists.map(c => c.id) : [],
                      });
                    }}
                    onEdit={() => {}}
                    onDelete={() => {}}
                    onPreview={() => {}}
                    loading={false}
                  />
                </div>
              </div>

              {/* 8 Messages */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  8 Daily Messages <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {editingCampaign.messages.map((msg, index) => (
                    <div
                      key={msg.dayNumber}
                      className={`border rounded-lg p-4 ${
                        msg.isLocked ? 'border-yellow-300 bg-yellow-50' : 'border-gray-200'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-medium text-gray-700">
                          Day {msg.dayNumber} {msg.isLocked && <Lock size={14} className="inline text-yellow-600" />}
                        </label>
                        {!editingCampaign.isLocked && (
                          <button
                            onClick={() => {
                              const newMessages = [...editingCampaign.messages];
                              newMessages[index].isLocked = !newMessages[index].isLocked;
                              setEditingCampaign({ ...editingCampaign, messages: newMessages });
                            }}
                            className="text-gray-400 hover:text-gray-600"
                          >
                            {msg.isLocked ? <Lock size={16} /> : <Unlock size={16} />}
                          </button>
                        )}
                      </div>
                      <WhatsAppRichTextEditor
                        value={msg.messageTemplate}
                        onChange={(value) => {
                          const newMessages = [...editingCampaign.messages];
                          newMessages[index].messageTemplate = value;
                          setEditingCampaign({ ...editingCampaign, messages: newMessages });
                        }}
                        placeholder={`Message for day ${msg.dayNumber}...`}
                        rows={4}
                        disabled={saving || msg.isLocked || editingCampaign.isLocked}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t bg-gray-50">
              <button
                type="button"
                onClick={() => {
                  setShowCreateModal(false);
                  setEditingCampaign(null);
                }}
                disabled={saving}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving || editingCampaign.isLocked}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    {editingCampaign.id ? 'Update' : 'Create'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CSV Upload Modal */}
      <CSVUploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onSuccess={() => {
          if (onRefreshCsvLists) {
            onRefreshCsvLists();
          }
        }}
      />
    </div>
  );
}

