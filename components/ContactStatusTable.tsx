'use client';

import { useState, useEffect } from 'react';
import { Search, Filter, Download, RefreshCw, CheckCircle, XCircle, Clock, Loader2 } from 'lucide-react';
import { authenticatedFetch } from '@/lib/auth-utils';
import { API_BASE_URL } from '@/lib/api';

interface ContactStatus {
  id: string;
  phone: string;
  name: string | null;
  status: 'pending' | 'sending' | 'sent' | 'failed' | 'cancelled';
  error: string | null;
  sentAt: string | null;
  retryCount: number;
  lastRetryAt: string | null;
  createdAt: string;
}

interface ContactStatusTableProps {
  jobId: string;
  onResend?: (contactIds: string[]) => void;
}

export default function ContactStatusTable({ jobId, onResend }: ContactStatusTableProps) {
  const [contacts, setContacts] = useState<ContactStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedContacts, setSelectedContacts] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusCounts, setStatusCounts] = useState({
    pending: 0,
    sending: 0,
    sent: 0,
    failed: 0,
    cancelled: 0,
  });
  const [resending, setResending] = useState(false);

  useEffect(() => {
    if (jobId) {
      fetchContacts();
      // Poll for updates every 3 seconds while job might be running
      const interval = setInterval(() => {
        fetchContacts();
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [jobId, statusFilter, searchQuery, page]);

  const fetchContacts = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }
      if (searchQuery) {
        params.append('search', searchQuery);
      }
      params.append('page', page.toString());
      params.append('limit', '50');

      const response = await authenticatedFetch(
        `${API_BASE_URL}/api/whatsapp/jobs/${jobId}/contacts?${params.toString()}`
      );
      const data = await response.json();

      if (data.success) {
        setContacts(data.data.contacts || []);
        setTotalPages(data.data.pagination?.totalPages || 1);
        setStatusCounts(data.data.statusCounts || statusCounts);
      } else {
        setError(data.error || 'Failed to fetch contacts');
      }
    } catch (err: any) {
      console.error('Error fetching contacts:', err);
      setError(err.message || 'Failed to fetch contacts');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectContact = (id: string) => {
    setSelectedContacts((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    const failedContacts = contacts.filter(c => c.status === 'failed');
    if (selectedContacts.size === failedContacts.length) {
      setSelectedContacts(new Set());
    } else {
      setSelectedContacts(new Set(failedContacts.map(c => c.id)));
    }
  };

  const handleResend = async (contactIds?: string[]) => {
    const idsToResend = contactIds || Array.from(selectedContacts);
    if (idsToResend.length === 0) {
      alert('Please select contacts to resend');
      return;
    }

    if (!confirm(`Resend messages to ${idsToResend.length} contact(s)?`)) {
      return;
    }

    try {
      setResending(true);
      const response = await authenticatedFetch(
        `${API_BASE_URL}/api/whatsapp/jobs/${jobId}/resend`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contactIds: idsToResend,
          }),
        }
      );

      const data = await response.json();
      if (data.success) {
        alert(`Resend job created: ${data.data.newJobId}`);
        setSelectedContacts(new Set());
        if (onResend) {
          onResend(idsToResend);
        }
      } else {
        alert(data.error || 'Failed to resend messages');
      }
    } catch (err: any) {
      console.error('Error resending messages:', err);
      alert(err.message || 'Failed to resend messages');
    } finally {
      setResending(false);
    }
  };

  const handleExportFailed = () => {
    const failedContacts = contacts.filter(c => c.status === 'failed');
    if (failedContacts.length === 0) {
      alert('No failed contacts to export');
      return;
    }

    // Create CSV content
    const csvContent = [
      ['Phone', 'Name', 'Error', 'Retry Count'].join(','),
      ...failedContacts.map(c => [
        c.phone,
        c.name || '',
        `"${(c.error || '').replace(/"/g, '""')}"`,
        c.retryCount,
      ].join(','))
    ].join('\n');

    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `failed-contacts-${jobId}-${new Date().toISOString()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: 'bg-gray-100 text-gray-800',
      sending: 'bg-blue-100 text-blue-800',
      sent: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
      cancelled: 'bg-yellow-100 text-yellow-800',
    };
    return styles[status as keyof typeof styles] || styles.pending;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
        return <CheckCircle size={16} className="text-green-600" />;
      case 'failed':
        return <XCircle size={16} className="text-red-600" />;
      case 'sending':
        return <Loader2 size={16} className="animate-spin text-blue-600" />;
      case 'pending':
        return <Clock size={16} className="text-gray-600" />;
      default:
        return null;
    }
  };

  const filteredContacts = contacts.filter(c => {
    if (statusFilter !== 'all' && c.status !== statusFilter) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        c.phone.toLowerCase().includes(query) ||
        (c.name && c.name.toLowerCase().includes(query))
      );
    }
    return true;
  });

  const failedContacts = contacts.filter(c => c.status === 'failed');

  return (
    <div className="space-y-4">
      {/* Header with Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex-1 flex gap-2">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search by phone or name..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending ({statusCounts.pending})</option>
            <option value="sending">Sending ({statusCounts.sending})</option>
            <option value="sent">Sent ({statusCounts.sent})</option>
            <option value="failed">Failed ({statusCounts.failed})</option>
            <option value="cancelled">Cancelled ({statusCounts.cancelled})</option>
          </select>
        </div>

        <div className="flex gap-2">
          {failedContacts.length > 0 && (
            <>
              <button
                onClick={handleExportFailed}
                className="flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
              >
                <Download size={16} />
                Export Failed
              </button>
              <button
                onClick={() => handleResend()}
                disabled={resending || selectedContacts.size === 0}
                className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {resending ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <RefreshCw size={16} />
                )}
                Resend Selected ({selectedContacts.size})
              </button>
            </>
          )}
        </div>
      </div>

      {/* Status Summary */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="bg-gray-50 p-3 rounded-lg">
          <p className="text-xs text-gray-600 mb-1">Pending</p>
          <p className="text-lg font-semibold text-gray-900">{statusCounts.pending}</p>
        </div>
        <div className="bg-blue-50 p-3 rounded-lg">
          <p className="text-xs text-blue-600 mb-1">Sending</p>
          <p className="text-lg font-semibold text-blue-900">{statusCounts.sending}</p>
        </div>
        <div className="bg-green-50 p-3 rounded-lg">
          <p className="text-xs text-green-600 mb-1">Sent</p>
          <p className="text-lg font-semibold text-green-900">{statusCounts.sent}</p>
        </div>
        <div className="bg-red-50 p-3 rounded-lg">
          <p className="text-xs text-red-600 mb-1">Failed</p>
          <p className="text-lg font-semibold text-red-900">{statusCounts.failed}</p>
        </div>
        <div className="bg-yellow-50 p-3 rounded-lg">
          <p className="text-xs text-yellow-600 mb-1">Cancelled</p>
          <p className="text-lg font-semibold text-yellow-900">{statusCounts.cancelled}</p>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {failedContacts.length > 0 && (
                  <th scope="col" className="w-12 px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedContacts.size === failedContacts.length && failedContacts.length > 0}
                      onChange={handleSelectAll}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </th>
                )}
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Phone
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Name
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Error
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Retries
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Sent At
                </th>
                {failedContacts.length > 0 && (
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={failedContacts.length > 0 ? 8 : 7} className="px-4 py-8 text-center">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-blue-600" />
                  </td>
                </tr>
              ) : filteredContacts.length === 0 ? (
                <tr>
                  <td colSpan={failedContacts.length > 0 ? 8 : 7} className="px-4 py-8 text-center text-gray-500">
                    No contacts found
                  </td>
                </tr>
              ) : (
                filteredContacts.map((contact) => (
                  <tr key={contact.id} className="hover:bg-gray-50">
                    {failedContacts.length > 0 && (
                      <td className="px-4 py-3">
                        {contact.status === 'failed' && (
                          <input
                            type="checkbox"
                            checked={selectedContacts.has(contact.id)}
                            onChange={() => handleSelectContact(contact.id)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                        )}
                      </td>
                    )}
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(contact.status)}`}>
                        {getStatusIcon(contact.status)}
                        {contact.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">{contact.phone}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{contact.name || '(No name)'}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate" title={contact.error || ''}>
                      {contact.error || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{contact.retryCount}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {contact.sentAt
                        ? new Date(contact.sentAt).toLocaleString()
                        : '-'}
                    </td>
                    {failedContacts.length > 0 && contact.status === 'failed' && (
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleResend([contact.id])}
                          disabled={resending}
                          className="text-xs text-blue-600 hover:text-blue-700 disabled:opacity-50"
                        >
                          Resend
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50">
            <div className="text-sm text-gray-700">
              Page {page} of {totalPages}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

