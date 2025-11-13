'use client';

import { useState } from 'react';
import { Edit, Trash2, ChevronLeft, ChevronRight, Search } from 'lucide-react';

export interface Contact {
  phone: string;
  name: string | null;
}

interface CSVPreviewTableProps {
  contacts: Contact[];
  onEdit: (index: number, contact: Contact) => void;
  onDelete: (index: number) => void;
  loading?: boolean;
}

export default function CSVPreviewTable({
  contacts,
  onEdit,
  onDelete,
  loading = false,
}: CSVPreviewTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editPhone, setEditPhone] = useState('');
  const [editName, setEditName] = useState('');

  // Filter contacts based on search
  const filteredContacts = contacts.filter((contact) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      contact.phone.toLowerCase().includes(query) ||
      (contact.name && contact.name.toLowerCase().includes(query))
    );
  });

  // Pagination
  const totalPages = Math.ceil(filteredContacts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedContacts = filteredContacts.slice(startIndex, endIndex);

  const handleEdit = (index: number, contact: Contact) => {
    setEditingIndex(index);
    setEditPhone(contact.phone);
    setEditName(contact.name || '');
  };

  const handleSave = () => {
    if (editingIndex !== null) {
      onEdit(editingIndex, {
        phone: editPhone.trim(),
        name: editName.trim() || null,
      });
      setEditingIndex(null);
      setEditPhone('');
      setEditName('');
    }
  };

  const handleCancel = () => {
    setEditingIndex(null);
    setEditPhone('');
    setEditName('');
  };

  const handleDelete = (index: number) => {
    if (confirm('Are you sure you want to remove this contact?')) {
      onDelete(index);
      // Adjust pagination if needed
      if (paginatedContacts.length === 1 && currentPage > 1) {
        setCurrentPage(currentPage - 1);
      }
    }
  };

  // Reset to page 1 when search changes
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  return (
    <div className="space-y-4">
      {/* Search and Items Per Page */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search contacts..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="itemsPerPage" className="text-sm text-gray-700">
            Items per page:
          </label>
          <select
            id="itemsPerPage"
            value={itemsPerPage}
            onChange={(e) => {
              setItemsPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Phone
              </th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {paginatedContacts.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-4 py-8 text-center text-gray-500">
                  {loading ? 'Loading...' : searchQuery ? 'No contacts found matching your search.' : 'No contacts to display.'}
                </td>
              </tr>
            ) : (
              paginatedContacts.map((contact, displayIndex) => {
                const actualIndex = startIndex + displayIndex;
                const isEditing = editingIndex === actualIndex;

                return (
                  <tr key={actualIndex} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap">
                      {isEditing ? (
                        <input
                          type="text"
                          value={editPhone}
                          onChange={(e) => setEditPhone(e.target.value)}
                          className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
                        <div className="text-sm text-gray-900">{contact.phone}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {isEditing ? (
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Name (optional)"
                        />
                      ) : (
                        <div className="text-sm text-gray-900">{contact.name || <span className="text-gray-400">—</span>}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                      {isEditing ? (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={handleSave}
                            className="text-green-600 hover:text-green-900"
                            disabled={loading}
                          >
                            Save
                          </button>
                          <button
                            onClick={handleCancel}
                            className="text-gray-600 hover:text-gray-900"
                            disabled={loading}
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleEdit(actualIndex, contact)}
                            className="text-blue-600 hover:text-blue-900"
                            title="Edit"
                            disabled={loading}
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(actualIndex)}
                            className="text-red-600 hover:text-red-900"
                            title="Delete"
                            disabled={loading}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Showing {startIndex + 1} to {Math.min(endIndex, filteredContacts.length)} of {filteredContacts.length} contacts
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1 || loading}
              className="p-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-sm text-gray-700">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages || loading}
              className="p-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

