'use client';

import { useState, useRef, useEffect } from 'react';
import { Trash2, ChevronLeft, ChevronRight, Search } from 'lucide-react';

export interface UniversalCSVRow {
  [key: string]: string | null;
}

interface UniversalCSVPreviewTableProps {
  rows: UniversalCSVRow[];
  headers: string[];
  onEdit: (index: number, row: UniversalCSVRow) => void;
  onDelete: (index: number) => void;
  loading?: boolean;
}

interface EditingCell {
  rowIndex: number;
  header: string;
}

export default function UniversalCSVPreviewTable({
  rows,
  headers,
  onEdit,
  onDelete,
  loading = false,
}: UniversalCSVPreviewTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingCell, setEditingCell] = useState<EditingCell | null>(null);
  const [editValue, setEditValue] = useState('');
  const [localRows, setLocalRows] = useState<UniversalCSVRow[]>(rows);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync local rows with props
  useEffect(() => {
    setLocalRows(rows);
  }, [rows]);

  // Focus input when editing starts
  useEffect(() => {
    if (editingCell && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingCell]);

  // Filter rows based on search
  const filteredRows = localRows.filter((row) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return Object.values(row).some(value => 
      value && value.toLowerCase().includes(query)
    );
  });

  // Pagination
  const totalPages = Math.ceil(filteredRows.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedRows = filteredRows.slice(startIndex, endIndex);

  const startEditing = (rowIndex: number, header: string) => {
    const actualIndex = startIndex + rowIndex;
    const row = localRows[actualIndex];
    setEditingCell({ rowIndex: actualIndex, header });
    setEditValue(row[header] || '');
  };

  const saveCell = () => {
    if (!editingCell) return;

    const { rowIndex, header } = editingCell;
    const updatedRows = [...localRows];
    updatedRows[rowIndex] = {
      ...updatedRows[rowIndex],
      [header]: editValue || null,
    };
    
    setLocalRows(updatedRows);
    onEdit(rowIndex, updatedRows[rowIndex]);
    setEditingCell(null);
    setEditValue('');
  };

  const cancelEditing = () => {
    setEditingCell(null);
    setEditValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!editingCell) return;

    if (e.key === 'Enter') {
      e.preventDefault();
      saveCell();
      
      // Move to next row, same column
      const nextRowIndex = editingCell.rowIndex + 1;
      if (nextRowIndex < localRows.length) {
        const displayIndex = nextRowIndex - startIndex;
        if (displayIndex >= 0 && displayIndex < paginatedRows.length) {
          setTimeout(() => startEditing(displayIndex, editingCell.header), 10);
        } else {
          // Move to next page if needed
          if (nextRowIndex < filteredRows.length) {
            setCurrentPage(Math.ceil((nextRowIndex + 1) / itemsPerPage));
            setTimeout(() => {
              const newStartIndex = (Math.ceil((nextRowIndex + 1) / itemsPerPage) - 1) * itemsPerPage;
              const newDisplayIndex = nextRowIndex - newStartIndex;
              startEditing(newDisplayIndex, editingCell.header);
            }, 100);
          }
        }
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      cancelEditing();
    } else if (e.key === 'Tab') {
      e.preventDefault();
      saveCell();
      
      // Move to next cell (right, or next row if at end)
      const currentHeaderIndex = headers.indexOf(editingCell.header);
      if (currentHeaderIndex < headers.length - 1) {
        // Move to next column
        setTimeout(() => {
          const displayIndex = editingCell.rowIndex - startIndex;
          startEditing(displayIndex, headers[currentHeaderIndex + 1]);
        }, 10);
      } else {
        // Move to first column of next row
        const nextRowIndex = editingCell.rowIndex + 1;
        if (nextRowIndex < localRows.length) {
          const displayIndex = nextRowIndex - startIndex;
          if (displayIndex >= 0 && displayIndex < paginatedRows.length) {
            setTimeout(() => startEditing(displayIndex, headers[0]), 10);
          } else {
            // Move to next page
            if (nextRowIndex < filteredRows.length) {
              setCurrentPage(Math.ceil((nextRowIndex + 1) / itemsPerPage));
              setTimeout(() => {
                const newStartIndex = (Math.ceil((nextRowIndex + 1) / itemsPerPage) - 1) * itemsPerPage;
                const newDisplayIndex = nextRowIndex - newStartIndex;
                startEditing(newDisplayIndex, headers[0]);
              }, 100);
            }
          }
        }
      }
    }
  };

  const handleDelete = (index: number) => {
    if (confirm('Are you sure you want to remove this row?')) {
      onDelete(index);
      // Adjust pagination if needed
      if (paginatedRows.length === 1 && currentPage > 1) {
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
              placeholder="Search rows..."
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
              {headers.map((header) => (
                <th
                  key={header}
                  scope="col"
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  {header}
                </th>
              ))}
              <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {paginatedRows.length === 0 ? (
              <tr>
                <td colSpan={headers.length + 1} className="px-4 py-8 text-center text-gray-500">
                  {loading ? 'Loading...' : searchQuery ? 'No rows found matching your search.' : 'No rows to display.'}
                </td>
              </tr>
            ) : (
              paginatedRows.map((row, displayIndex) => {
                const actualIndex = startIndex + displayIndex;
                const isRowBeingEdited = editingCell?.rowIndex === actualIndex;

                return (
                  <tr key={actualIndex} className="hover:bg-gray-50">
                    {headers.map((header) => {
                      const isEditing = isRowBeingEdited && editingCell?.header === header;
                      return (
                        <td
                          key={header}
                          className="px-4 py-3 whitespace-nowrap relative"
                          onClick={() => !isEditing && startEditing(displayIndex, header)}
                          onDoubleClick={() => startEditing(displayIndex, header)}
                        >
                          {isEditing ? (
                            <input
                              ref={inputRef}
                              type="text"
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              onBlur={saveCell}
                              onKeyDown={handleKeyDown}
                              className="w-full px-2 py-1 border-2 border-blue-500 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                              placeholder={header}
                            />
                          ) : (
                            <div className="text-sm text-gray-900 cursor-text hover:bg-blue-50 px-2 py-1 rounded min-h-[28px] flex items-center">
                              {row[header] || <span className="text-gray-400">—</span>}
                            </div>
                          )}
                        </td>
                      );
                    })}
                    <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleDelete(actualIndex)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete row"
                        disabled={loading || isRowBeingEdited}
                      >
                        <Trash2 size={16} />
                      </button>
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
            Showing {startIndex + 1} to {Math.min(endIndex, filteredRows.length)} of {filteredRows.length} rows
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

