"use client";

import { useState, useEffect } from "react";
import { Plus, Search, Pin, Archive, Tag, Palette, Clock, X, Edit2, Trash2, Check, FileText } from "lucide-react";
import { authenticatedFetch, getTeamSession } from "@/lib/auth-utils";
import { API_BASE_URL } from "@/lib/api";
import { format } from "date-fns";

interface Note {
  id: string;
  title: string;
  content: string | null;
  color: string | null;
  isPinned: boolean;
  isArchived: boolean;
  tags: string[] | null;
  reminderDate: string | null;
  linkedTaskId: string | null;
  createdAt: string;
  updatedAt: string;
}

const NOTE_COLORS = [
  { value: null, label: 'Default', bg: 'bg-white' },
  { value: '#fef3c7', label: 'Yellow', bg: 'bg-yellow-100' },
  { value: '#dbeafe', label: 'Blue', bg: 'bg-blue-100' },
  { value: '#d1fae5', label: 'Green', bg: 'bg-green-100' },
  { value: '#fce7f3', label: 'Pink', bg: 'bg-pink-100' },
  { value: '#e9d5ff', label: 'Purple', bg: 'bg-purple-100' },
  { value: '#fecaca', label: 'Red', bg: 'bg-red-100' },
  { value: '#e5e7eb', label: 'Gray', bg: 'bg-gray-100' },
];

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    color: null as string | null,
    tags: [] as string[],
    reminderDate: '',
  });
  const [tagInput, setTagInput] = useState('');
  const [convertingNote, setConvertingNote] = useState<string | null>(null);

  useEffect(() => {
    fetchNotes();
  }, [showArchived]);

  const fetchNotes = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('archived', showArchived.toString());
      if (searchQuery) {
        params.append('search', searchQuery);
      }

      const response = await authenticatedFetch(`${API_BASE_URL}/api/team/notes?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setNotes(data.data || []);
        }
      }
    } catch (error) {
      console.error('Error fetching notes:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (searchQuery) {
      const timeoutId = setTimeout(() => {
        fetchNotes();
      }, 300);
      return () => clearTimeout(timeoutId);
    } else {
      fetchNotes();
    }
  }, [searchQuery, showArchived]);

  const handleCreateNote = async () => {
    if (!formData.title.trim()) {
      alert('Note title is required');
      return;
    }

    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/api/team/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          content: formData.content || null,
          color: formData.color,
          tags: formData.tags.length > 0 ? formData.tags : null,
          reminderDate: formData.reminderDate ? formData.reminderDate : null,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setShowCreateModal(false);
          setFormData({ title: '', content: '', color: null, tags: [], reminderDate: '' });
          fetchNotes();
        }
      }
    } catch (error) {
      console.error('Error creating note:', error);
      alert('Failed to create note');
    }
  };

  const handleUpdateNote = async (noteId: string, updates: Partial<Note>) => {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/api/team/notes/${noteId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (response.ok) {
        fetchNotes();
      }
    } catch (error) {
      console.error('Error updating note:', error);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!confirm('Are you sure you want to delete this note?')) return;

    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/api/team/notes/${noteId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchNotes();
      }
    } catch (error) {
      console.error('Error deleting note:', error);
    }
  };

  const handleConvertToTask = async (note: Note) => {
    setConvertingNote(note.id);
    try {
      const deadline = prompt('Enter deadline (YYYY-MM-DD):');
      if (!deadline) {
        setConvertingNote(null);
        return;
      }

      const response = await authenticatedFetch(`${API_BASE_URL}/api/team/notes/${note.id}/convert-to-task`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deadline: deadline,
          archiveNote: true,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          alert('Note converted to task successfully!');
          fetchNotes();
        }
      }
    } catch (error) {
      console.error('Error converting note to task:', error);
      alert('Failed to convert note to task');
    } finally {
      setConvertingNote(null);
    }
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData({ ...formData, tags: [...formData.tags, tagInput.trim()] });
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setFormData({ ...formData, tags: formData.tags.filter(t => t !== tag) });
  };

  const pinnedNotes = notes.filter(n => n.isPinned && !n.isArchived);
  const unpinnedNotes = notes.filter(n => !n.isPinned && !n.isArchived);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-primary-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-primary-fg mb-2">Notes</h1>
          <p className="text-primary-muted">Google Keep-style note taking</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowArchived(!showArchived)}
            className="px-4 py-2 border border-primary-border rounded-lg hover:bg-primary-bg flex items-center gap-2"
          >
            <Archive className="h-4 w-4" />
            {showArchived ? 'Show Active' : 'Show Archived'}
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="h-5 w-5" />
            New Note
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-primary-muted" />
        <input
          type="text"
          placeholder="Search notes..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-primary-border rounded-lg bg-primary-bg text-primary-fg"
        />
      </div>

      {/* Notes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {pinnedNotes.map((note) => (
          <NoteCard
            key={note.id}
            note={note}
            onUpdate={handleUpdateNote}
            onDelete={handleDeleteNote}
            onConvertToTask={handleConvertToTask}
            converting={convertingNote === note.id}
          />
        ))}
        {unpinnedNotes.map((note) => (
          <NoteCard
            key={note.id}
            note={note}
            onUpdate={handleUpdateNote}
            onDelete={handleDeleteNote}
            onConvertToTask={handleConvertToTask}
            converting={convertingNote === note.id}
          />
        ))}
        {notes.length === 0 && (
          <div className="col-span-full text-center py-12">
            <FileText className="h-12 w-12 mx-auto text-primary-muted mb-4" />
            <p className="text-primary-muted">No notes found</p>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {(showCreateModal || editingNote) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-primary-fg">
                  {editingNote ? 'Edit Note' : 'New Note'}
                </h2>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setEditingNote(null);
                    setFormData({ title: '', content: '', color: null, tags: [], reminderDate: '' });
                  }}
                  className="text-primary-muted hover:text-primary-fg"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <input
                  type="text"
                  placeholder="Title"
                  value={editingNote ? editingNote.title : formData.title}
                  onChange={(e) => {
                    if (editingNote) {
                      setEditingNote({ ...editingNote, title: e.target.value });
                    } else {
                      setFormData({ ...formData, title: e.target.value });
                    }
                  }}
                  className="w-full px-4 py-2 border border-primary-border rounded-lg bg-primary-bg text-primary-fg text-lg font-semibold"
                />
              </div>
              <div>
                <textarea
                  placeholder="Take a note..."
                  value={editingNote ? editingNote.content || '' : formData.content}
                  onChange={(e) => {
                    if (editingNote) {
                      setEditingNote({ ...editingNote, content: e.target.value });
                    } else {
                      setFormData({ ...formData, content: e.target.value });
                    }
                  }}
                  className="w-full px-4 py-2 border border-primary-border rounded-lg bg-primary-bg text-primary-fg"
                  rows={8}
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-primary-muted">Color:</span>
                <div className="flex gap-2">
                  {NOTE_COLORS.map((color) => (
                    <button
                      key={color.value || 'default'}
                      onClick={() => {
                        if (editingNote) {
                          setEditingNote({ ...editingNote, color: color.value });
                        } else {
                          setFormData({ ...formData, color: color.value });
                        }
                      }}
                      className={`w-8 h-8 rounded-full border-2 ${
                        (editingNote ? editingNote.color : formData.color) === color.value
                          ? 'border-primary-accent'
                          : 'border-transparent'
                      } ${color.bg}`}
                    />
                  ))}
                </div>
              </div>
              <div>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    placeholder="Add tag"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addTag()}
                    className="flex-1 px-4 py-2 border border-primary-border rounded-lg bg-primary-bg text-primary-fg"
                  />
                  <button
                    onClick={addTag}
                    className="px-4 py-2 bg-primary-accent text-white rounded-lg"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(editingNote ? editingNote.tags || [] : formData.tags).map((tag) => (
                    <span
                      key={tag}
                      className="px-3 py-1 bg-primary-accent-light text-primary-accent rounded-full text-sm flex items-center gap-2"
                    >
                      {tag}
                      <button
                        onClick={() => {
                          if (editingNote) {
                            setEditingNote({
                              ...editingNote,
                              tags: (editingNote.tags || []).filter(t => t !== tag),
                            });
                          } else {
                            removeTag(tag);
                          }
                        }}
                        className="hover:text-red-500"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-primary-fg mb-2">Reminder</label>
                <input
                  type="datetime-local"
                  value={editingNote ? (editingNote.reminderDate ? new Date(editingNote.reminderDate).toISOString().slice(0, 16) : '') : formData.reminderDate}
                  onChange={(e) => {
                    if (editingNote) {
                      setEditingNote({ ...editingNote, reminderDate: e.target.value ? new Date(e.target.value).toISOString() : null });
                    } else {
                      setFormData({ ...formData, reminderDate: e.target.value });
                    }
                  }}
                  className="w-full px-4 py-2 border border-primary-border rounded-lg bg-primary-bg text-primary-fg"
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setEditingNote(null);
                    setFormData({ title: '', content: '', color: null, tags: [], reminderDate: '' });
                  }}
                  className="px-4 py-2 border border-primary-border rounded-lg hover:bg-primary-bg"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    if (editingNote) {
                      await handleUpdateNote(editingNote.id, {
                        title: editingNote.title,
                        content: editingNote.content,
                        color: editingNote.color,
                        tags: editingNote.tags,
                        reminderDate: editingNote.reminderDate,
                      });
                      setEditingNote(null);
                    } else {
                      await handleCreateNote();
                    }
                  }}
                  className="btn-primary px-4 py-2"
                >
                  {editingNote ? 'Save' : 'Create'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function NoteCard({
  note,
  onUpdate,
  onDelete,
  onConvertToTask,
  converting,
}: {
  note: Note;
  onUpdate: (noteId: string, updates: Partial<Note>) => void;
  onDelete: (noteId: string) => void;
  onConvertToTask: (note: Note) => void;
  converting: boolean;
}) {
  const bgColor = note.color || '#ffffff';
  const textColor = note.color ? '#000000' : undefined;

  return (
    <div
      className="card hover:shadow-lg transition-shadow cursor-pointer relative"
      style={{ backgroundColor: bgColor }}
      onClick={() => {
        // Open edit modal - would need to pass editingNote state up
      }}
    >
      {note.isPinned && (
        <Pin className="h-4 w-4 text-primary-muted absolute top-2 right-2" />
      )}
      <div className="p-4">
        <h3 className="font-semibold text-primary-fg mb-2" style={{ color: textColor }}>
          {note.title}
        </h3>
        {note.content && (
          <p className="text-sm text-primary-muted mb-3 line-clamp-6" style={{ color: textColor }}>
            {note.content}
          </p>
        )}
        {note.tags && note.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {note.tags.map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 bg-primary-accent-light text-primary-accent rounded text-xs"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
        {note.reminderDate && (
          <div className="flex items-center gap-1 text-xs text-primary-muted mb-2">
            <Clock className="h-3 w-3" />
            <span>{format(new Date(note.reminderDate), 'MMM dd, yyyy HH:mm')}</span>
          </div>
        )}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-primary-border">
          <div className="flex gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onUpdate(note.id, { isPinned: !note.isPinned });
              }}
              className="p-1 hover:bg-primary-bg rounded"
              title={note.isPinned ? 'Unpin' : 'Pin'}
            >
              <Pin className={`h-4 w-4 ${note.isPinned ? 'text-primary-accent fill-current' : 'text-primary-muted'}`} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onUpdate(note.id, { isArchived: !note.isArchived });
              }}
              className="p-1 hover:bg-primary-bg rounded"
              title={note.isArchived ? 'Unarchive' : 'Archive'}
            >
              <Archive className={`h-4 w-4 ${note.isArchived ? 'text-primary-accent' : 'text-primary-muted'}`} />
            </button>
          </div>
          <div className="flex gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onConvertToTask(note);
              }}
              disabled={converting}
              className="p-1 hover:bg-primary-bg rounded text-primary-accent"
              title="Convert to Task"
            >
              <FileText className="h-4 w-4" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(note.id);
              }}
              className="p-1 hover:bg-red-500/20 rounded text-red-500"
              title="Delete"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
