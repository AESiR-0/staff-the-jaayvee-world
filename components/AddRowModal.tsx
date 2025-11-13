'use client';

import { useState, useEffect } from 'react';
import { X, Loader2, AlertCircle } from 'lucide-react';

interface AddRowModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (row: { [key: string]: string | null }) => void;
  headers: string[];
  loading?: boolean;
}

export default function AddRowModal({ isOpen, onClose, onAdd, headers, loading = false }: AddRowModalProps) {
  const [rowData, setRowData] = useState<{ [key: string]: string }>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      // Initialize row data with empty strings for all headers
      const initialData: { [key: string]: string } = {};
      headers.forEach(header => {
        initialData[header] = '';
      });
      setRowData(initialData);
      setError(null);
    }
  }, [isOpen, headers]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Convert to the format expected (string | null)
    const formattedRow: { [key: string]: string | null } = {};
    headers.forEach(header => {
      formattedRow[header] = rowData[header]?.trim() || null;
    });

    // Check if at least one field has data
    const hasData = Object.values(formattedRow).some(value => value !== null);
    if (!hasData) {
      setError('At least one field must have data');
      return;
    }

    onAdd(formattedRow);
    
    // Reset form
    const initialData: { [key: string]: string } = {};
    headers.forEach(header => {
      initialData[header] = '';
    });
    setRowData(initialData);
    onClose();
  };

  const handleClose = () => {
    if (!loading) {
      const initialData: { [key: string]: string } = {};
      headers.forEach(header => {
        initialData[header] = '';
      });
      setRowData(initialData);
      setError(null);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white">
          <h2 className="text-xl font-semibold">Add New Row</h2>
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {headers.map((header) => (
              <div key={header}>
                <label htmlFor={`row-${header}`} className="block text-sm font-medium text-gray-700 mb-1">
                  {header}
                </label>
                <input
                  id={`row-${header}`}
                  type="text"
                  value={rowData[header] || ''}
                  onChange={(e) => setRowData({ ...rowData, [header]: e.target.value })}
                  disabled={loading}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                  placeholder={`Enter ${header.toLowerCase()}`}
                />
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
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
                  Adding...
                </>
              ) : (
                'Add Row'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

