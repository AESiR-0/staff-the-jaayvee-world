'use client';

import { useState, useEffect, useRef } from 'react';
import { Upload, Send, Loader2, CheckCircle, XCircle } from 'lucide-react';
import WhatsAppQRCode from '@/components/WhatsAppQRCode';
import { parseCSV, type Contact } from '@/lib/csv-parser';

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
  const [messageTemplate, setMessageTemplate] = useState('');
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<JobStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [csvError, setCsvError] = useState<string | null>(null);
  const [serviceConfigured, setServiceConfigured] = useState<boolean | null>(null);
  const statusIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    checkServiceHealth();
    checkAuthStatus();
    return () => {
      if (statusIntervalRef.current) {
        clearInterval(statusIntervalRef.current);
      }
    };
  }, []);

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

  useEffect(() => {
    if (jobId && sending) {
      // Poll for status updates
      statusIntervalRef.current = setInterval(() => {
        fetchJobStatus();
      }, 2000); // Poll every 2 seconds

      return () => {
        if (statusIntervalRef.current) {
          clearInterval(statusIntervalRef.current);
        }
      };
    }
  }, [jobId, sending]);

  const checkAuthStatus = async () => {
    try {
      const response = await fetch('/api/whatsapp/auth?action=status');
      const data = await response.json();
      if (data.success && data.data.authenticated) {
        setIsAuthenticated(true);
      }
    } catch (err) {
      console.error('Failed to check auth status:', err);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      setCsvError('Please upload a CSV file');
      return;
    }

    setCsvFile(file);
    setCsvError(null);

    // Parse CSV immediately for preview
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const csvText = event.target?.result as string;
        const result = parseCSV(csvText);
        
        if (result.contacts.length === 0) {
          setCsvError('No valid contacts found in CSV file');
          setContacts([]);
          return;
        }

        setContacts(result.contacts);
        if (result.errors.length > 0) {
          console.warn('CSV parsing errors:', result.errors);
        }
      } catch (err: any) {
        setCsvError(err.message || 'Failed to parse CSV file');
        setContacts([]);
      }
    };
    reader.readAsText(file);
  };

  const handleSend = async () => {
    if (!messageTemplate.trim()) {
      setError('Please enter a message template');
      return;
    }

    if (contacts.length === 0) {
      setError('Please upload a CSV file with contacts');
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
      const formData = new FormData();
      if (csvFile) {
        formData.append('csv', csvFile);
      }
      formData.append('message', messageTemplate);

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
        // Update status to cancelled
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary-fg">WhatsApp Bulk Messaging</h1>
        <p className="text-primary-muted mt-1">Send messages to multiple contacts in batches</p>
      </div>

      {/* Service Configuration Warning */}
      {serviceConfigured === false && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800 font-medium">⚠️ WhatsApp service not configured</p>
          <p className="text-yellow-700 text-sm mt-1">
            Please set <code className="bg-yellow-100 px-1 rounded">WHATSAPP_SERVICE_URL</code> in your Vercel environment variables.
            See <code className="bg-yellow-100 px-1 rounded">WHATSAPP_SETUP_GUIDE.md</code> for instructions.
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
            <textarea
              value={messageTemplate}
              onChange={(e) => setMessageTemplate(e.target.value)}
              placeholder="Enter your message here. Use {name} as a placeholder for contact names."
              className="w-full px-4 py-3 border border-primary-border rounded-lg focus:ring-2 focus:ring-primary-accent focus:border-primary-accent outline-none resize-none"
              rows={6}
            />
            <p className="text-xs text-primary-muted mt-2">
              Use {'{name}'} as a placeholder for contact names. Example: &quot;Hi {'{name}'}, welcome to our service!&quot;
            </p>
          </div>

          {/* CSV Upload */}
          <div className="bg-white border border-primary-border rounded-lg p-6">
            <label className="block text-sm font-medium text-primary-fg mb-2">
              Upload CSV File
            </label>
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

          {/* Contacts Preview */}
          {contacts.length > 0 && (
            <div className="bg-white border border-primary-border rounded-lg p-6">
              <h3 className="text-sm font-medium text-primary-fg mb-4">
                Contacts Preview ({contacts.length} contacts)
              </h3>
              <div className="max-h-60 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-primary-fg">Phone</th>
                      <th className="px-4 py-2 text-left text-primary-fg">Name</th>
                    </tr>
                  </thead>
                  <tbody>
                    {contacts.slice(0, 10).map((contact, index) => (
                      <tr key={index} className="border-t border-primary-border">
                        <td className="px-4 py-2 text-primary-fg">{contact.phone}</td>
                        <td className="px-4 py-2 text-primary-fg">{contact.name || '(No name)'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {contacts.length > 10 && (
                  <p className="text-xs text-primary-muted mt-2 text-center">
                    Showing first 10 of {contacts.length} contacts
                  </p>
                )}
              </div>
            </div>
          )}

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
              disabled={loading || sending || contacts.length === 0 || !messageTemplate.trim()}
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
                  Start Sending
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
    </div>
  );
}

