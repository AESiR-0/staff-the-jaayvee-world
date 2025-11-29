'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Upload, Send, Loader2, CheckCircle, XCircle, Plus, Filter, X } from 'lucide-react';
import WhatsAppQRCode from '@/components/WhatsAppQRCode';
import WhatsAppRichTextEditor from '@/components/WhatsAppRichTextEditor';
import CSVUploadModal from '@/components/CSVUploadModal';
import CSVListTable, { type CSVListItem } from '@/components/CSVListTable';
import CSVPreviewTable, { type Contact } from '@/components/CSVPreviewTable';
import { authenticatedFetch, getTeamSession } from '@/lib/auth-utils';
import { parseCSV } from '@/lib/csv-parser';

interface JobStatus {
  jobId: string;
  status: 'pending' | 'running' | 'completed' | 'cancelled' | 'error';
  progress: {
    totalContacts: number;
    contactsProcessed: number;
    messagesSent: number;
    messagesFailed: number;
    batchesCompleted: number;
    currentBatch: number;
  };
  errors: string[];
  startedAt?: string;
  completedAt?: string;
}

export default function WhatsAppBulkPage() {
  // Message and sending state
  const [messageTemplate, setMessageTemplate] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<JobStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [serviceConfigured, setServiceConfigured] = useState<boolean | null>(null);
  const statusIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // RBAC state
  const [canAccess, setCanAccess] = useState(false);
  const [checkingAccess, setCheckingAccess] = useState(true);

  // CSV Database state
  const [csvLists, setCsvLists] = useState<CSVListItem[]>([]);
  const [selectedCsvIds, setSelectedCsvIds] = useState<string[]>([]);
  const [combinedContacts, setCombinedContacts] = useState<Contact[]>([]);
  const [loadingCsvLists, setLoadingCsvLists] = useState(false);
  const [loadingCombined, setLoadingCombined] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [editingCsv, setEditingCsv] = useState<CSVListItem | null>(null);
  const [previewingCsvId, setPreviewingCsvId] = useState<string | null>(null);

  // Filtering and pagination
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'createdAt' | 'totalContacts'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [categories, setCategories] = useState<string[]>([]);

  // Legacy CSV upload (fallback)
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [legacyContacts, setLegacyContacts] = useState<Contact[]>([]);
  const [csvError, setCsvError] = useState<string | null>(null);

  const checkAccess = useCallback(async () => {
    try {
      setCheckingAccess(true);
      const session = getTeamSession();
      const userEmail = session?.email;
      
      if (!userEmail) {
        setCanAccess(false);
        setCheckingAccess(false);
        return;
      }

      const { getAuthToken } = require('@/lib/auth-utils');
      const { checkHasAccessClient } = require('@/lib/permissions');
      const token = getAuthToken();
      
      if (!token) {
        setCanAccess(false);
        setCheckingAccess(false);
        return;
      }
      
      const result = await checkHasAccessClient(userEmail, 'whatsapp-bulk', token);
      setCanAccess(result.hasAccess);
    } catch (err) {
      console.error('Error checking permissions:', err);
      setCanAccess(false);
    } finally {
      setCheckingAccess(false);
    }
  }, []);

  useEffect(() => {
    checkAccess();
    checkServiceHealth();
    checkAuthStatus();
    fetchCsvLists();
    return () => {
      if (statusIntervalRef.current) {
        clearInterval(statusIntervalRef.current);
      }
    };
  }, [checkAccess]);

  useEffect(() => {
    if (jobId && sending) {
      statusIntervalRef.current = setInterval(() => {
        fetchJobStatus();
      }, 2000);
      return () => {
        if (statusIntervalRef.current) {
          clearInterval(statusIntervalRef.current);
        }
      };
    }
  }, [jobId, sending]);

  useEffect(() => {
    if (selectedCsvIds.length > 0) {
      combineCsvLists();
    } else {
      setCombinedContacts([]);
    }
  }, [selectedCsvIds]);

  useEffect(() => {
    fetchCsvLists();
  }, [categoryFilter, searchQuery, sortBy, sortOrder, currentPage]);

  const checkServiceHealth = async () => {
    try {
      const response = await fetch('/api/whatsapp/health');
      const data = await response.json();
      setServiceConfigured(data.serviceUrl === 'configured');
      if (!data.healthy && data.serviceUrl === 'configured') {
        setError('WhatsApp service is not responding. Please check if the service is running.');
      }
    } catch (err) {
      console.error('Failed to check service health:', err);
    }
  };

  const checkAuthStatus = useCallback(async () => {
    try {
      const response = await fetch('/api/whatsapp/auth?action=status');
      const data = await response.json();
      if (data.success && data.data.authenticated) {
        setIsAuthenticated(true);
      }
    } catch (err) {
      console.error('Failed to check auth status:', err);
    }
  }, []);

  const fetchCsvLists = useCallback(async () => {
    setLoadingCsvLists(true);
    try {
      const params = new URLSearchParams();
      if (categoryFilter) params.append('category', categoryFilter);
      if (searchQuery) params.append('search', searchQuery);
      params.append('sortBy', sortBy);
      params.append('sortOrder', sortOrder);
      params.append('page', currentPage.toString());
      params.append('limit', '20');

      const response = await authenticatedFetch(`/api/csv-lists?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        setCsvLists(data.data.csvLists || []);
        setTotalPages(data.data.pagination?.totalPages || 1);
        setCategories(data.data.categories || []);
      }
    } catch (err: any) {
      console.error('Failed to fetch CSV lists:', err);
    } finally {
      setLoadingCsvLists(false);
    }
  };

  const combineCsvLists = async () => {
    if (selectedCsvIds.length === 0) {
      setCombinedContacts([]);
      return;
    }

    setLoadingCombined(true);
    try {
      const response = await authenticatedFetch('/api/csv-lists/combine', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          csvIds: selectedCsvIds,
          removeDuplicates: true,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setCombinedContacts(data.data.contacts || []);
      }
    } catch (err: any) {
      console.error('Failed to combine CSV lists:', err);
      setError('Failed to combine selected CSV lists');
    } finally {
      setLoadingCombined(false);
    }
  };

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

  const handleEditCsv = async (csv: CSVListItem) => {
    const newName = prompt('Enter new name:', csv.name);
    if (!newName || newName.trim() === csv.name) return;

    const newCategory = prompt('Enter new category:', csv.category);
    if (!newCategory || newCategory.trim() === csv.category) return;

    const newDescription = prompt('Enter new description (optional):', csv.description || '') || null;

    try {
      const response = await authenticatedFetch(`/api/csv-lists/${csv.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newName.trim(),
          category: newCategory.trim(),
          description: newDescription?.trim() || null,
        }),
      });

      const data = await response.json();
      if (data.success) {
        fetchCsvLists();
      } else {
        alert('Failed to update CSV list');
      }
    } catch (err) {
      console.error('Failed to update CSV:', err);
      alert('Failed to update CSV list');
    }
  };

  const handleDeleteCsv = async (id: string) => {
    if (!confirm('Are you sure you want to delete this CSV list?')) return;

    try {
      const response = await authenticatedFetch(`/api/csv-lists/${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      if (data.success) {
        setSelectedCsvIds((prev) => prev.filter((i) => i !== id));
        fetchCsvLists();
      } else {
        alert('Failed to delete CSV list');
      }
    } catch (err) {
      console.error('Failed to delete CSV:', err);
      alert('Failed to delete CSV list');
    }
  };

  const handlePreviewCsv = (id: string) => {
    setPreviewingCsvId(id);
  };

  const handleEditContact = async (csvId: string, contactIndex: number, contact: Contact) => {
    try {
      const response = await authenticatedFetch(`/api/csv-lists/${csvId}/contacts/${contactIndex}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(contact),
      });

      const data = await response.json();
      if (data.success) {
        // Refresh combined contacts if this CSV is selected
        if (selectedCsvIds.includes(csvId)) {
          combineCsvLists();
        }
        // If previewing, refresh preview
        if (previewingCsvId === csvId) {
          // The preview will need to be refreshed separately
        }
      }
    } catch (err) {
      console.error('Failed to update contact:', err);
    }
  };

  const handleDeleteContact = async (csvId: string, contactIndex: number) => {
    try {
      const response = await authenticatedFetch(`/api/csv-lists/${csvId}/contacts/${contactIndex}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      if (data.success) {
        // Refresh combined contacts if this CSV is selected
        if (selectedCsvIds.includes(csvId)) {
          combineCsvLists();
        }
        fetchCsvLists();
      }
    } catch (err) {
      console.error('Failed to delete contact:', err);
    }
  };

  // Legacy CSV upload handler
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      setCsvError('Please upload a CSV file');
      return;
    }

    setCsvFile(file);
    setCsvError(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const csvText = event.target?.result as string;
        const result = parseCSV(csvText);

        if (result.contacts.length === 0) {
          setCsvError('No valid contacts found in CSV file');
          setLegacyContacts([]);
          return;
        }

        setLegacyContacts(result.contacts);
        if (result.errors.length > 0) {
          console.warn('CSV parsing errors:', result.errors);
        }
      } catch (err: any) {
        setCsvError(err.message || 'Failed to parse CSV file');
        setLegacyContacts([]);
      }
    };
    reader.readAsText(file);
  };

  const handleSend = async () => {
    if (!messageTemplate.trim()) {
      setError('Please enter a message template');
      return;
    }

    // Use combined contacts from selected CSVs, or fallback to legacy contacts
    const contactsToSend = combinedContacts.length > 0 ? combinedContacts : legacyContacts;

    if (contactsToSend.length === 0) {
      setError('Please select CSV lists or upload a CSV file with contacts');
      return;
    }

    if (!isAuthenticated) {
      setError('Please authenticate WhatsApp first');
      return;
    }

    setLoading(true);
    setError(null);
    setSending(true);

    try {
      // Create a temporary CSV file from contacts
      const csvContent = contactsToSend.map(c => `${c.phone},${c.name || ''}`).join('\n');
      const csvBlob = new Blob([csvContent], { type: 'text/csv' });
      const csvFileToSend = new File([csvBlob], 'contacts.csv', { type: 'text/csv' });

      const formData = new FormData();
      formData.append('csv', csvFileToSend);
      const messageWithNewlines = messageTemplate.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
      formData.append('message', messageWithNewlines);

      const response = await fetch('/api/whatsapp/send', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        setJobId(data.data.jobId);
        setJobStatus({
          jobId: data.data.jobId,
          status: 'pending',
          progress: {
            totalContacts: data.data.totalContacts,
            contactsProcessed: 0,
            messagesSent: 0,
            messagesFailed: 0,
            batchesCompleted: 0,
            currentBatch: 0,
          },
          errors: data.data.errors || [],
        });
      } else {
        setError(data.error || 'Failed to start sending messages');
        setSending(false);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to send messages');
      setSending(false);
    } finally {
      setLoading(false);
    }
  };

  const fetchJobStatus = async () => {
    if (!jobId) return;

    try {
      const response = await fetch(`/api/whatsapp/status?jobId=${jobId}`);
      const data = await response.json();

      if (data.success) {
        setJobStatus(data.data);

        if (data.data.status === 'completed' || data.data.status === 'cancelled' || data.data.status === 'error') {
          setSending(false);
          if (statusIntervalRef.current) {
            clearInterval(statusIntervalRef.current);
          }
        }
      }
    } catch (err) {
      console.error('Failed to fetch job status:', err);
    }
  };

  const handleCancel = async () => {
    if (!jobId) return;

    try {
      const response = await fetch(`/api/whatsapp/cancel?jobId=${jobId}`, {
        method: 'POST',
      });

      const data = await response.json();
      if (data.success) {
        setSending(false);
        if (statusIntervalRef.current) {
          clearInterval(statusIntervalRef.current);
        }
        if (jobStatus) {
          setJobStatus({
            ...jobStatus,
            status: 'cancelled',
          });
        }
      }
    } catch (err) {
      console.error('Failed to cancel job:', err);
    }
  };

  const getProgressPercentage = () => {
    if (!jobStatus || jobStatus.progress.totalContacts === 0) return 0;
    return Math.round((jobStatus.progress.contactsProcessed / jobStatus.progress.totalContacts) * 100);
  };

  const activeContacts = combinedContacts.length > 0 ? combinedContacts : legacyContacts;

  if (checkingAccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-gray-600">Checking permissions...</p>
        </div>
      </div>
    );
  }

  if (!canAccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-red-800 mb-2">Access Denied</h2>
            <p className="text-red-600">You don&apos;t have permission to access WhatsApp bulk messaging. Please contact an administrator.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary-fg">WhatsApp Bulk Messaging</h1>
        <p className="text-primary-muted mt-1">Send messages to multiple contacts using saved CSV lists or upload a new CSV</p>
      </div>

      {/* Service Configuration Warning */}
      {serviceConfigured === false && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800 font-medium">⚠️ WhatsApp service not configured</p>
          <p className="text-yellow-700 text-sm mt-1">
            Please set <code className="bg-yellow-100 px-1 rounded">WHATSAPP_SERVICE_URL</code> in your Vercel environment variables.
          </p>
        </div>
      )}

      {/* Authentication Status */}
      {serviceConfigured !== false && !isAuthenticated && (
        <div className="bg-white border border-primary-border rounded-lg p-6">
          <WhatsAppQRCode onAuthenticated={() => setIsAuthenticated(true)} />
        </div>
      )}

      {isAuthenticated && (
        <>
          {/* Message Template */}
          <div className="bg-white border border-primary-border rounded-lg p-6">
            <label className="block text-sm font-medium text-primary-fg mb-2">
              Message Template
            </label>
            <WhatsAppRichTextEditor
              value={messageTemplate}
              onChange={setMessageTemplate}
              placeholder="Enter your message here. Use {name} as a placeholder for contact names."
              rows={6}
            />
          </div>

          {/* CSV Library Section */}
          <div className="bg-white border border-primary-border rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-primary-fg">CSV Library</h2>
              <button
                onClick={() => setShowUploadModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                <Plus size={16} />
                Upload CSV
              </button>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-4 mb-4">
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search CSV lists..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="min-w-[150px]">
                <select
                  value={categoryFilter}
                  onChange={(e) => {
                    setCategoryFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Categories</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
              <div className="min-w-[150px]">
                <select
                  value={`${sortBy}-${sortOrder}`}
                  onChange={(e) => {
                    const [newSortBy, newSortOrder] = e.target.value.split('-') as [typeof sortBy, typeof sortOrder];
                    setSortBy(newSortBy);
                    setSortOrder(newSortOrder);
                    setCurrentPage(1);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="createdAt-desc">Newest First</option>
                  <option value="createdAt-asc">Oldest First</option>
                  <option value="name-asc">Name A-Z</option>
                  <option value="name-desc">Name Z-A</option>
                  <option value="totalContacts-desc">Most Contacts</option>
                  <option value="totalContacts-asc">Fewest Contacts</option>
                </select>
              </div>
            </div>

            {/* CSV List Table */}
            <CSVListTable
              csvLists={csvLists}
              selectedIds={selectedCsvIds}
              onSelect={handleSelectCsv}
              onSelectAll={handleSelectAll}
              onEdit={handleEditCsv}
              onDelete={handleDeleteCsv}
              onPreview={handlePreviewCsv}
              loading={loadingCsvLists}
            />

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-gray-700">
                  Page {currentPage} of {totalPages}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Preview Section */}
          {activeContacts.length > 0 && (
            <div className="bg-white border border-primary-border rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-primary-fg">
                  Preview Contacts ({activeContacts.length.toLocaleString()} contacts)
                  {selectedCsvIds.length > 0 && (
                    <span className="ml-2 text-sm font-normal text-gray-600">
                      from {selectedCsvIds.length} selected CSV{selectedCsvIds.length > 1 ? 's' : ''}
                    </span>
                  )}
                </h3>
                {selectedCsvIds.length > 0 && (
                  <button
                    onClick={() => setSelectedCsvIds([])}
                    className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1"
                  >
                    <X size={16} />
                    Clear Selection
                  </button>
                )}
              </div>
              {combinedContacts.length > 0 ? (
                <CSVPreviewTable
                  contacts={combinedContacts}
                  onEdit={(index, contact) => {
                    // For combined contacts, we need to find which CSV it belongs to
                    // This is a simplified version - in a real scenario, you'd track the source CSV
                    console.warn('Editing combined contacts is not fully supported yet');
                  }}
                  onDelete={(index) => {
                    console.warn('Deleting from combined contacts is not fully supported yet');
                  }}
                  loading={loadingCombined}
                />
              ) : (
                <div className="text-sm text-gray-600">
                  <p>Showing {legacyContacts.length} contacts from uploaded CSV file</p>
                  <div className="mt-4 max-h-60 overflow-y-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left">Phone</th>
                          <th className="px-4 py-2 text-left">Name</th>
                        </tr>
                      </thead>
                      <tbody>
                        {legacyContacts.slice(0, 10).map((contact, index) => (
                          <tr key={index} className="border-t">
                            <td className="px-4 py-2">{contact.phone}</td>
                            <td className="px-4 py-2">{contact.name || '(No name)'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {legacyContacts.length > 10 && (
                      <p className="text-xs text-gray-500 mt-2 text-center">
                        Showing first 10 of {legacyContacts.length} contacts
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Legacy CSV Upload (Fallback) */}
          <div className="bg-white border border-primary-border rounded-lg p-6">
            <h3 className="text-sm font-medium text-primary-fg mb-2">Or Upload CSV File Directly</h3>
            <div className="border-2 border-dashed border-primary-border rounded-lg p-6 text-center">
              <Upload className="h-8 w-8 text-primary-muted mx-auto mb-2" />
              <input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="hidden"
                id="csv-upload"
              />
              <label
                htmlFor="csv-upload"
                className="cursor-pointer text-primary-accent hover:text-primary-accent/80 font-medium"
              >
                Click to upload CSV
              </label>
              <p className="text-xs text-primary-muted mt-2">
                CSV should have columns: phone, name (name is optional)
              </p>
            </div>
            {csvError && (
              <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-red-800 text-sm">
                {csvError}
              </div>
            )}
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
              <XCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-red-800 font-medium">Error</p>
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            </div>
          )}

          {/* Send Button */}
          <div className="flex gap-4">
            <button
              onClick={handleSend}
              disabled={loading || sending || activeContacts.length === 0 || !messageTemplate.trim()}
              className="flex items-center gap-2 px-6 py-3 bg-primary-accent text-white rounded-lg hover:bg-primary-accent/90 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Starting...
                </>
              ) : (
                <>
                  <Send className="h-5 w-5" />
                  Send to {activeContacts.length.toLocaleString()} Contact{activeContacts.length !== 1 ? 's' : ''}
                </>
              )}
            </button>
            {sending && jobId && (
              <button
                onClick={handleCancel}
                className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
              >
                Cancel
              </button>
            )}
          </div>

          {/* Job Status */}
          {jobStatus && (
            <div className="bg-white border border-primary-border rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-primary-fg">Sending Progress</h3>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  jobStatus.status === 'completed' ? 'bg-green-100 text-green-800' :
                  jobStatus.status === 'error' ? 'bg-red-100 text-red-800' :
                  jobStatus.status === 'cancelled' ? 'bg-gray-100 text-gray-800' :
                  'bg-blue-100 text-blue-800'
                }`}>
                  {jobStatus.status.toUpperCase()}
                </span>
              </div>

              {/* Progress Bar */}
              <div className="mb-4">
                <div className="flex justify-between text-sm text-primary-muted mb-2">
                  <span>Progress: {getProgressPercentage()}%</span>
                  <span>{jobStatus.progress.contactsProcessed} / {jobStatus.progress.totalContacts}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div
                    className="bg-primary-accent h-2.5 rounded-full transition-all duration-300"
                    style={{ width: `${getProgressPercentage()}%` }}
                  />
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="bg-blue-50 p-3 rounded-lg">
                  <p className="text-xs text-primary-muted mb-1">Messages Sent</p>
                  <p className="text-lg font-semibold text-primary-fg">{jobStatus.progress.messagesSent}</p>
                </div>
                <div className="bg-red-50 p-3 rounded-lg">
                  <p className="text-xs text-primary-muted mb-1">Failed</p>
                  <p className="text-lg font-semibold text-primary-fg">{jobStatus.progress.messagesFailed}</p>
                </div>
                <div className="bg-green-50 p-3 rounded-lg">
                  <p className="text-xs text-primary-muted mb-1">Batches Completed</p>
                  <p className="text-lg font-semibold text-primary-fg">{jobStatus.progress.batchesCompleted}</p>
                </div>
                <div className="bg-yellow-50 p-3 rounded-lg">
                  <p className="text-xs text-primary-muted mb-1">Current Batch</p>
                  <p className="text-lg font-semibold text-primary-fg">{jobStatus.progress.currentBatch}</p>
                </div>
              </div>

              {/* Errors */}
              {jobStatus.errors.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm font-medium text-primary-fg mb-2">Errors:</p>
                  <div className="max-h-40 overflow-y-auto bg-red-50 border border-red-200 rounded p-3">
                    {jobStatus.errors.map((err, index) => (
                      <p key={index} className="text-xs text-red-800 mb-1">{err}</p>
                    ))}
                  </div>
                </div>
              )}

              {jobStatus.status === 'completed' && (
                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <p className="text-green-800 font-medium">All messages sent successfully!</p>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Upload Modal */}
      <CSVUploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onSuccess={() => {
          fetchCsvLists();
        }}
      />
    </div>
  );
}
