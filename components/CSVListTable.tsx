'use client';

import { useState } from 'react';
import { Edit, Trash2, Eye, CheckSquare, Square } from 'lucide-react';

export interface CSVListItem {
  id: string;
  name: string;
  category: string;
  description: string | null;
  totalContacts: number;
  createdAt: string;
  updatedAt: string;
}

interface CSVListTableProps {
  csvLists: CSVListItem[];
  selectedIds: string[];
  onSelect: (id: string) => void;
  onSelectAll: (selected: boolean) => void;
  onEdit: (csv: CSVListItem) => void;
  onDelete: (id: string) => void;
  onPreview: (id: string) => void;
  loading?: boolean;
}

export default function CSVListTable({
  csvLists,
  selectedIds,
  onSelect,
  onSelectAll,
  onEdit,
  onDelete,
  onPreview,
  loading = false,
}: CSVListTableProps) {
  const allSelected = csvLists.length > 0 && csvLists.every(csv => selectedIds.includes(csv.id));
  const someSelected = selectedIds.length > 0 && !allSelected;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="w-12 px-4 py-3">
              <button
                onClick={() => onSelectAll(!allSelected)}
                className="flex items-center justify-center"
                disabled={loading}
              >
                {allSelected ? (
                  <CheckSquare size={20} className="text-blue-600" />
                ) : someSelected ? (
                  <div className="w-5 h-5 border-2 border-blue-600 bg-blue-100 rounded" />
                ) : (
                  <Square size={20} className="text-gray-400" />
                )}
              </button>
            </th>
            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Name
            </th>
            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Category
            </th>
            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Contacts
            </th>
            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Created
            </th>
            <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {csvLists.length === 0 ? (
            <tr>
              <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                {loading ? 'Loading...' : 'No CSV lists found. Upload your first CSV to get started.'}
              </td>
            </tr>
          ) : (
            csvLists.map((csv) => (
              <tr key={csv.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <button
                    onClick={() => onSelect(csv.id)}
                    className="flex items-center justify-center"
                    disabled={loading}
                  >
                    {selectedIds.includes(csv.id) ? (
                      <CheckSquare size={20} className="text-blue-600" />
                    ) : (
                      <Square size={20} className="text-gray-400" />
                    )}
                  </button>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{csv.name}</div>
                  {csv.description && (
                    <div className="text-sm text-gray-500 truncate max-w-xs">{csv.description}</div>
                  )}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                    {csv.category}
                  </span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                  {csv.totalContacts.toLocaleString()}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                  {formatDate(csv.createdAt)}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => onPreview(csv.id)}
                      className="text-blue-600 hover:text-blue-900"
                      title="Preview"
                      disabled={loading}
                    >
                      <Eye size={16} />
                    </button>
                    <button
                      onClick={() => onEdit(csv)}
                      className="text-gray-600 hover:text-gray-900"
                      title="Edit"
                      disabled={loading}
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => onDelete(csv.id)}
                      className="text-red-600 hover:text-red-900"
                      title="Delete"
                      disabled={loading}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

