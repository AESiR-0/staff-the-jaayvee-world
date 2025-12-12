'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Download, Edit, Trash2, Eye, Filter, X, FileDown } from 'lucide-react';
import CSVUploadModal from '@/components/CSVUploadModal';
import CSVEditModal from '@/components/CSVEditModal';
import CSVCreateModal from '@/components/CSVCreateModal';
import AddRowModal from '@/components/AddRowModal';
import CSVListTable, { type CSVListItem } from '@/components/CSVListTable';
import UniversalCSVPreviewTable, { type UniversalCSVRow } from '@/components/UniversalCSVPreviewTable';
import { authenticatedFetch } from '@/lib/auth-utils';
import { parseUniversalCSV, rowsToCSV } from '@/lib/universal-csv-parser';

export default function SalesPage() {
  // CSV Database state
  const [csvLists, setCsvLists] = useState<CSVListItem[]>([]);
  const [selectedCsvId, setSelectedCsvId] = useState<string | null>(null);
  const [selectedCsvRows, setSelectedCsvRows] = useState<UniversalCSVRow[]>([]);
  const [selectedCsvHeaders, setSelectedCsvHeaders] = useState<string[]>([]);
  const [loadingCsvLists, setLoadingCsvLists] = useState(false);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAddRowModal, setShowAddRowModal] = useState(false);
  const [editingCsv, setEditingCsv] = useState<CSVListItem | null>(null);
  const [previewingCsvId, setPreviewingCsvId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Filtering and pagination
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'createdAt' | 'totalContacts'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [categories, setCategories] = useState<string[]>([]);

  // Contact editing state
  const [editingContactIndex, setEditingContactIndex] = useState<number | null>(null);
  const [editingContact, setEditingContact] = useState<Record<string, any> | null>(null);

  useEffect(() => {
    fetchCsvLists();
  }, [categoryFilter, searchQuery, sortBy, sortOrder, currentPage]);

  useEffect(() => {
    if (previewingCsvId) {
      fetchCsvContacts(previewingCsvId);
    }
  }, [previewingCsvId]);

  const fetchCsvLists = useCallback(async () => {
    setLoadingCsvLists(true);
    setError(null);
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
      } else {
        setError(data.error || 'Failed to fetch CSV lists');
      }
    } catch (err: any) {
      console.error('Failed to fetch CSV lists:', err);
      setError(err.message || 'Failed to fetch CSV lists');
    } finally {
      setLoadingCsvLists(false);
    }
  }, [categoryFilter, searchQuery, sortBy, sortOrder, currentPage]);

  const fetchCsvContacts = async (csvId: string) => {
    setLoadingContacts(true);
    try {
      // Fetch the full CSV list to get headers and rows
      const response = await authenticatedFetch(`/api/csv-lists/${csvId}`);
      const data = await response.json();

      if (data.success && data.data) {
        const csvData = data.data;
        // For universal CSVs, contactsData contains rows with headers
        // Format: { headers: string[], rows: UniversalCSVRow[] }
        if (csvData.contactsData) {
          if (csvData.contactsData.headers && csvData.contactsData.rows) {
            // New format with headers and rows
            setSelectedCsvHeaders(csvData.contactsData.headers);
            setSelectedCsvRows(csvData.contactsData.rows);
          } else if (Array.isArray(csvData.contactsData)) {
            // Legacy format - try to infer headers from first row
            const rows = csvData.contactsData as UniversalCSVRow[];
            if (rows.length > 0) {
              const headers = Object.keys(rows[0]);
              setSelectedCsvHeaders(headers);
              setSelectedCsvRows(rows);
            } else {
              setSelectedCsvHeaders([]);
              setSelectedCsvRows([]);
            }
          }
        }
        setSelectedCsvId(csvId);
      }
    } catch (err: any) {
      console.error('Failed to fetch CSV data:', err);
      setError('Failed to fetch CSV data');
    } finally {
      setLoadingContacts(false);
    }
  };

  const handleEditCsv = (csv: CSVListItem) => {
    setEditingCsv(csv);
    setShowEditModal(true);
  };

  const handleDeleteCsv = async (id: string) => {
    if (!confirm('Are you sure you want to delete this CSV list?')) return;

    try {
      const response = await authenticatedFetch(`/api/csv-lists/${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      if (data.success) {
        if (previewingCsvId === id) {
          setPreviewingCsvId(null);
          setSelectedCsvRows([]);
          setSelectedCsvHeaders([]);
          setSelectedCsvId(null);
        }
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

  const handleEditSuccess = () => {
    fetchCsvLists();
    if (editingCsv && previewingCsvId === editingCsv.id) {
      // Refresh preview if currently viewing this CSV
      fetchCsvContacts(editingCsv.id);
    }
    setEditingCsv(null);
  };

  const handleEditRow = async (index: number, row: UniversalCSVRow) => {
    if (!selectedCsvId) return;

    try {
      // Update the row in local state immediately for better UX
      const updatedRows = [...selectedCsvRows];
      updatedRows[index] = row;
      setSelectedCsvRows(updatedRows);

      // Save to backend by updating the entire CSV
      await saveCsvToBackend(selectedCsvId, selectedCsvHeaders, updatedRows);
      fetchCsvLists(); // Update total count
    } catch (err) {
      console.error('Failed to update row:', err);
      // Revert on error
      fetchCsvContacts(selectedCsvId);
      alert('Failed to update row');
    }
  };

  const handleDeleteRow = async (index: number) => {
    if (!selectedCsvId) return;

    if (!confirm('Are you sure you want to remove this row?')) return;

    try {
      const updatedRows = selectedCsvRows.filter((_, i) => i !== index);
      setSelectedCsvRows(updatedRows);

      await saveCsvToBackend(selectedCsvId, selectedCsvHeaders, updatedRows);
      fetchCsvLists(); // Update total count
    } catch (err) {
      console.error('Failed to delete row:', err);
      fetchCsvContacts(selectedCsvId);
      alert('Failed to delete row');
    }
  };

  const saveCsvToBackend = async (csvId: string, headers: string[], rows: UniversalCSVRow[]) => {
    // Get CSV metadata
    const csvResponse = await authenticatedFetch(`/api/csv-lists/${csvId}`);
    const csvData = await csvResponse.json();

    if (!csvData.success) {
      throw new Error('Failed to fetch CSV metadata');
    }

    // Create CSV content
    const csvContent = rowsToCSV(headers, rows);
    const csvBlob = new Blob([csvContent], { type: 'text/csv' });
    const csvFile = new File([csvBlob], 'updated.csv', { type: 'text/csv' });

    const formData = new FormData();
    formData.append('name', csvData.data.name);
    formData.append('category', csvData.data.category);
    if (csvData.data.description) {
      formData.append('description', csvData.data.description);
    }
    formData.append('csv', csvFile);

    // Use PUT to update the CSV in place (no need to delete and recreate)
    const updateResponse = await authenticatedFetch(`/api/csv-lists/${csvId}`, {
      method: 'PUT',
      body: formData,
    });

    const updateData = await updateResponse.json();

    // Log detailed error for debugging
    if (!updateResponse.ok || !updateData.success) {
      console.error('❌ Failed to update CSV:', {
        status: updateResponse.status,
        statusText: updateResponse.statusText,
        responseData: updateData,
        csvMetadata: {
          name: csvData.data.name,
          category: csvData.data.category,
          description: csvData.data.description,
          rowCount: rows.length,
          headerCount: headers.length
        }
      });
      throw new Error(updateData.error || updateData.message || 'Failed to save CSV');
    }

    // CSV ID remains the same, just refresh the data
    fetchCsvContacts(csvId);
  };

  const handleExportCsv = async (csv: CSVListItem) => {
    try {
      // Use current rows if already loaded, otherwise fetch
      if (selectedCsvId === csv.id && selectedCsvRows.length > 0 && selectedCsvHeaders.length > 0) {
        exportRowsToCSV(selectedCsvHeaders, selectedCsvRows, csv.name);
      } else {
        // Fetch full CSV data
        const response = await authenticatedFetch(`/api/csv-lists/${csv.id}`);
        const data = await response.json();

        if (data.success && data.data?.contactsData) {
          const csvData = data.data.contactsData;
          let headers: string[];
          let rows: UniversalCSVRow[];

          if (csvData.headers && csvData.rows) {
            headers = csvData.headers;
            rows = csvData.rows;
          } else if (Array.isArray(csvData) && csvData.length > 0) {
            rows = csvData;
            headers = Object.keys(rows[0]);
          } else {
            alert('No data to export');
            return;
          }

          exportRowsToCSV(headers, rows, csv.name);
        } else {
          alert('Failed to fetch CSV data for export');
        }
      }
    } catch (err) {
      console.error('Failed to export CSV:', err);
      alert('Failed to export CSV');
    }
  };

  const exportRowsToCSV = (headers: string[], rows: UniversalCSVRow[], filename: string) => {
    if (rows.length === 0) {
      alert('No data to export');
      return;
    }

    const csvContent = rowsToCSV(headers, rows);

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `${filename.replace(/[^a-z0-9]/gi, '_')}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  };

  const handleAddNewRow = () => {
    if (!selectedCsvId || selectedCsvHeaders.length === 0) {
      alert('Please select a CSV to add rows to');
      return;
    }
    setShowAddRowModal(true);
  };

  const handleAddRow = async (newRow: UniversalCSVRow) => {
    if (!selectedCsvId) return;

    const updatedRows = [...selectedCsvRows, newRow];
    setSelectedCsvRows(updatedRows);

    try {
      await saveCsvToBackend(selectedCsvId, selectedCsvHeaders, updatedRows);
      fetchCsvLists();
    } catch (err) {
      console.error('Failed to add row:', err);
      fetchCsvContacts(selectedCsvId);
      alert('Failed to add row');
    }
  };

  const handleCreateNewCsv = () => {
    setShowCreateModal(true);
  };

  const handleCreateSuccess = (newCsvId?: string) => {
    fetchCsvLists();
    if (newCsvId) {
      // Open the new CSV for editing
      setPreviewingCsvId(newCsvId);
      fetchCsvContacts(newCsvId);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary-fg">Sales CSV Management</h1>
        <p className="text-primary-muted mt-1">Create, manage, and export sales contact lists</p>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <X className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-red-800 font-medium">Error</p>
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* CSV Library Section */}
      <div className="bg-white border border-primary-border rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-primary-fg">CSV Lists</h2>
          <div className="flex gap-2">
            <button
              onClick={handleCreateNewCsv}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              <Plus size={16} />
              Create New
            </button>
            <button
              onClick={() => setShowUploadModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              <Plus size={16} />
              Upload CSV
            </button>
          </div>
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
          selectedIds={previewingCsvId ? [previewingCsvId] : []}
          onSelect={(id) => {
            if (previewingCsvId === id) {
              setPreviewingCsvId(null);
              setSelectedCsvRows([]);
              setSelectedCsvHeaders([]);
              setSelectedCsvId(null);
            } else {
              handlePreviewCsv(id);
            }
          }}
          onSelectAll={() => { }}
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

      {/* Preview/Edit Section */}
      {previewingCsvId && (selectedCsvRows.length >= 0 || selectedCsvHeaders.length > 0) && (
        <div className="bg-white border border-primary-border rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-primary-fg">
              {csvLists.find(c => c.id === previewingCsvId)?.name || 'CSV Preview'}
              <span className="ml-2 text-sm font-normal text-gray-600">
                ({selectedCsvRows.length.toLocaleString()} rows)
              </span>
            </h3>
            <div className="flex gap-2">
              <button
                onClick={handleAddNewRow}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                <Plus size={16} />
                Add Row
              </button>
              {csvLists.find(c => c.id === previewingCsvId) && (
                <button
                  onClick={() => handleExportCsv(csvLists.find(c => c.id === previewingCsvId)!)}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                  disabled={selectedCsvRows.length === 0}
                >
                  <Download size={16} />
                  Export CSV
                </button>
              )}
              <button
                onClick={() => {
                  setPreviewingCsvId(null);
                  setSelectedCsvRows([]);
                  setSelectedCsvHeaders([]);
                  setSelectedCsvId(null);
                }}
                className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1"
              >
                <X size={16} />
                Close
              </button>
            </div>
          </div>
          {selectedCsvHeaders.length > 0 ? (
            <UniversalCSVPreviewTable
              rows={selectedCsvRows}
              headers={selectedCsvHeaders}
              onEdit={(index, row) => handleEditRow(index, row)}
              onDelete={(index) => handleDeleteRow(index)}
              loading={loadingContacts}
            />
          ) : (
            <div className="text-center py-8 text-gray-500">
              {loadingContacts ? 'Loading...' : 'No data available'}
            </div>
          )}
        </div>
      )}

      {/* Upload Modal */}
      <CSVUploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onSuccess={() => {
          fetchCsvLists();
        }}
      />

      {/* Edit Modal */}
      <CSVEditModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingCsv(null);
        }}
        onSuccess={handleEditSuccess}
        csv={editingCsv}
      />

      {/* Create Modal */}
      <CSVCreateModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => handleCreateSuccess()}
      />

      {/* Add Row Modal */}
      <AddRowModal
        isOpen={showAddRowModal}
        onClose={() => setShowAddRowModal(false)}
        onAdd={handleAddRow}
        headers={selectedCsvHeaders}
        loading={loadingContacts}
      />
    </div>
  );
}

