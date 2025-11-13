'use client';

import { useState } from 'react';
import { X, Loader2, AlertCircle } from 'lucide-react';
import { authenticatedFetch } from '@/lib/auth-utils';

interface CSVCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CSVCreateModal({ isOpen, onClose, onSuccess }: CSVCreateModalProps) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [headers, setHeaders] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Name is required');
      return;
    }

    if (!category.trim()) {
      setError('Category is required');
      return;
    }

    if (!headers.trim()) {
      setError('Column headers are required');
      return;
    }

    const headersArray = headers.split(',').map(h => h.trim()).filter(h => h.length > 0);
    if (headersArray.length === 0) {
      setError('At least one header is required');
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('name', name.trim());
      formData.append('category', category.trim());
      if (description.trim()) {
        formData.append('description', description.trim());
      }

      // Create a minimal CSV with just headers
      const emptyCsv = headersArray.map(h => `"${h}"`).join(',') + '\n';
      const csvBlob = new Blob([emptyCsv], { type: 'text/csv' });
      const csvFile = new File([csvBlob], 'empty.csv', { type: 'text/csv' });
      formData.append('csv', csvFile);

      const response = await authenticatedFetch('/api/csv-lists', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to create CSV');
      }

      // Reset form
      setName('');
      setCategory('');
      setDescription('');
      setHeaders('');
      setError(null);

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('CSV creation error:', err);
      setError(err.message || 'Failed to create CSV');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setName('');
      setCategory('');
      setDescription('');
      setHeaders('');
      setError(null);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-semibold">Create New CSV List</h2>
          <button
            onClick={handleClose}
            disabled={loading}
            className="text-gray-500 hover:text-gray-700 disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded flex items-center gap-2">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label htmlFor="create-name" className="block text-sm font-medium text-gray-700 mb-1">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              id="create-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={loading}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              placeholder="e.g., Customer List Q1 2024"
            />
          </div>

          <div>
            <label htmlFor="create-category" className="block text-sm font-medium text-gray-700 mb-1">
              Category <span className="text-red-500">*</span>
            </label>
            <input
              id="create-category"
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              required
              disabled={loading}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              placeholder="e.g., Sales, Customers, Leads"
            />
          </div>

          <div>
            <label htmlFor="create-headers" className="block text-sm font-medium text-gray-700 mb-1">
              Column Headers <span className="text-red-500">*</span>
            </label>
            <input
              id="create-headers"
              type="text"
              value={headers}
              onChange={(e) => setHeaders(e.target.value)}
              required
              disabled={loading}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              placeholder="e.g., Name, Email, Phone, Company"
            />
            <p className="mt-1 text-xs text-gray-500">
              Enter column headers separated by commas
            </p>
          </div>

          <div>
            <label htmlFor="create-description" className="block text-sm font-medium text-gray-700 mb-1">
              Description (Optional)
            </label>
            <textarea
              id="create-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={loading}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              placeholder="Optional description for this CSV list"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Creating...
                </>
              ) : (
                'Create CSV'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

