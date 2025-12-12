'use client';

import { useState, useEffect } from 'react';
import { X, Loader2, Clock, ToggleLeft, ToggleRight } from 'lucide-react';
import WhatsAppRichTextEditor from './WhatsAppRichTextEditor';
import CSVListTable, { type CSVListItem } from './CSVListTable';
import { authenticatedFetch } from '@/lib/auth-utils';
import { API_BASE_URL } from '@/lib/api';

interface ScheduledMessage {
  id?: string;
  name: string;
  messageTemplate: string;
  csvListIds: string[];
  scheduledTime: string;
  isActive: boolean;
  isLocked?: boolean;
  csvListNames?: string[];
  totalContacts?: number;
}

interface ScheduledMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  scheduledMessage?: ScheduledMessage | null;
  csvLists: CSVListItem[];
}

export default function ScheduledMessageModal({
  isOpen,
  onClose,
  onSuccess,
  scheduledMessage,
  csvLists,
}: ScheduledMessageModalProps) {
  const [name, setName] = useState('');
  const [messageTemplate, setMessageTemplate] = useState('');
  const [selectedCsvIds, setSelectedCsvIds] = useState<string[]>([]);
  const [scheduledTime, setScheduledTime] = useState('09:00');
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize form when scheduledMessage changes
  useEffect(() => {
    if (scheduledMessage) {
      setName(scheduledMessage.name || '');
      setMessageTemplate(scheduledMessage.messageTemplate || '');
      setSelectedCsvIds(scheduledMessage.csvListIds || []);
      setScheduledTime(scheduledMessage.scheduledTime || '09:00');
      setIsActive(scheduledMessage.isActive !== undefined ? scheduledMessage.isActive : true);
    } else {
      // Reset form for new message
      setName('');
      setMessageTemplate('');
      setSelectedCsvIds([]);
      setScheduledTime('09:00');
      setIsActive(true);
    }
    setError(null);
  }, [scheduledMessage, isOpen]);

  const handleSelectCsv = (id: string) => {
    setSelectedCsvIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      setSelectedCsvIds(csvLists.map((csv) => csv.id));
    } else {
      setSelectedCsvIds([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!name.trim()) {
      setError('Name is required');
      return;
    }

    if (!messageTemplate.trim()) {
      setError('Message template is required');
      return;
    }

    if (selectedCsvIds.length === 0) {
      setError('Please select at least one CSV list');
      return;
    }

    // Validate time format (HH:MM)
    const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(scheduledTime)) {
      setError('Scheduled time must be in HH:MM format (24-hour)');
      return;
    }

    setLoading(true);

    try {
      const url = scheduledMessage?.id
        ? `${API_BASE_URL}/api/whatsapp/scheduled/${scheduledMessage.id}`
        : `${API_BASE_URL}/api/whatsapp/scheduled`;

      const method = scheduledMessage?.id ? 'PUT' : 'POST';

      const response = await authenticatedFetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name.trim(),
          messageTemplate: messageTemplate.trim(),
          csvListIds: selectedCsvIds,
          scheduledTime: scheduledTime,
          isActive: isActive,
        }),
      });

      const data = await response.json();

      if (data.success) {
        onSuccess();
        onClose();
      } else {
        setError(data.error || 'Failed to save scheduled message');
      }
    } catch (err: any) {
      console.error('Error saving scheduled message:', err);
      setError(err.message || 'Failed to save scheduled message');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const isEditMode = !!scheduledMessage?.id;
  const isLocked = scheduledMessage?.isLocked === true;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            {isEditMode ? 'Edit Scheduled Message' : 'Create Scheduled Message'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            disabled={loading}
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          {/* Name Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={loading || isLocked}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              placeholder="e.g., Daily Morning Greeting"
              required
            />
          </div>

          {/* Message Template */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Message Template <span className="text-red-500">*</span>
            </label>
            <WhatsAppRichTextEditor
              value={messageTemplate}
              onChange={setMessageTemplate}
              placeholder="Enter your message here. Use {name} as a placeholder for contact names."
              rows={6}
              disabled={loading || isLocked}
            />
          </div>

          {/* CSV List Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select CSV Lists <span className="text-red-500">*</span>
            </label>
            <div className="border border-gray-300 rounded-md p-4 max-h-64 overflow-y-auto">
              {csvLists.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">
                  No CSV lists available. Please upload CSV lists first.
                </p>
              ) : (
                <CSVListTable
                  csvLists={csvLists}
                  selectedIds={selectedCsvIds}
                  onSelect={handleSelectCsv}
                  onSelectAll={handleSelectAll}
                  onEdit={() => {}} // Disable edit in modal
                  onDelete={() => {}} // Disable delete in modal
                  onPreview={() => {}} // Disable preview in modal
                  loading={loading}
                />
              )}
            </div>
            {selectedCsvIds.length > 0 && (
              <p className="text-sm text-gray-600 mt-2">
                {selectedCsvIds.length} CSV list{selectedCsvIds.length > 1 ? 's' : ''} selected
              </p>
            )}
          </div>

          {/* Scheduled Time */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Scheduled Time <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center gap-3">
              <Clock size={20} className="text-gray-400" />
              <input
                type="time"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                disabled={loading || isLocked}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                required
              />
              <span className="text-sm text-gray-500">(24-hour format)</span>
            </div>
          </div>

          {/* Active Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Active
              </label>
              <p className="text-xs text-gray-500">
                When active, the message will be sent at the scheduled time daily
              </p>
            </div>
            <button
              type="button"
              onClick={() => !isLocked && setIsActive(!isActive)}
              disabled={loading || isLocked}
              className="flex items-center gap-2"
            >
              {isActive ? (
                <ToggleRight size={40} className="text-blue-600" />
              ) : (
                <ToggleLeft size={40} className="text-gray-400" />
              )}
            </button>
          </div>

          {isLocked && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-sm text-yellow-800">
                This scheduled message is locked and cannot be edited. Unlock it first to make changes.
              </p>
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t bg-gray-50">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={loading || isLocked}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Saving...
              </>
            ) : (
              isEditMode ? 'Update' : 'Create'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

