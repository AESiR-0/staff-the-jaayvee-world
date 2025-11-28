"use client";

import { useEffect, useState } from "react";
import { FileText, Plus, Edit2, Trash2, Search, X, Save, XCircle } from "lucide-react";
import { authenticatedFetch, getTeamSession } from "@/lib/auth-utils";
import { API_BASE_URL } from "@/lib/api";

interface Note {
  id: string;
  title: string;
  content: string | null;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [formData, setFormData] = useState({
    title: "",
    content: "",
  });

  useEffect(() => {
    fetchNotes();
  }, []);

  const fetchNotes = async () => {
    try {
      setLoading(true);
      const response = await authenticatedFetch(`${API_BASE_URL}/api/team/notes`);
      const data = await response.json();

      if (data.success) {
        setNotes(data.data || []);
      } else {
        setError(data.error || "Failed to fetch notes");
      }
    } catch (err: any) {
      console.error("Error fetching notes:", err);
      setError(err.message || "Failed to fetch notes");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!formData.title.trim()) {
      setError("Title is required");
      return;
    }

    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/api/team/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.title,
          content: formData.content,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setNotes([data.data, ...notes]);
        setFormData({ title: "", content: "" });
        setShowCreateModal(false);
        setError(null);
      } else {
        setError(data.error || "Failed to create note");
      }
    } catch (err: any) {
      console.error("Error creating note:", err);
      setError(err.message || "Failed to create note");
    }
  };

  const handleUpdate = async () => {
    if (!editingNote || !formData.title.trim()) {
      setError("Title is required");
      return;
    }

    try {
      const response = await authenticatedFetch(
        `${API_BASE_URL}/api/team/notes/${editingNote.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: formData.title,
            content: formData.content,
          }),
        }
      );

      const data = await response.json();

      if (data.success) {
        setNotes(notes.map((n) => (n.id === editingNote.id ? data.data : n)));
        setEditingNote(null);
        setFormData({ title: "", content: "" });
        setError(null);
      } else {
        setError(data.error || "Failed to update note");
      }
    } catch (err: any) {
      console.error("Error updating note:", err);
      setError(err.message || "Failed to update note");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this note?")) {
      return;
    }

    try {
      const response = await authenticatedFetch(
        `${API_BASE_URL}/api/team/notes/${id}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (data.success) {
        setNotes(notes.filter((n) => n.id !== id));
        if (editingNote?.id === id) {
          setEditingNote(null);
          setFormData({ title: "", content: "" });
        }
      } else {
        setError(data.error || "Failed to delete note");
      }
    } catch (err: any) {
      console.error("Error deleting note:", err);
      setError(err.error || "Failed to delete note");
    }
  };

  const startEdit = (note: Note) => {
    setEditingNote(note);
    setFormData({
      title: note.title,
      content: note.content || "",
    });
    setShowCreateModal(true);
  };

  const cancelEdit = () => {
    setEditingNote(null);
    setFormData({ title: "", content: "" });
    setShowCreateModal(false);
  };

  const filteredNotes = notes.filter((note) =>
    note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (note.content && note.content.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary-accent border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-primary-muted">Loading notes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-primary-fg">My Notes</h1>
          <p className="text-primary-muted mt-1">Your personal notes (private, not shared)</p>
        </div>
        <button
          onClick={() => {
            setEditingNote(null);
            setFormData({ title: "", content: "" });
            setShowCreateModal(true);
          }}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          New Note
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)}>
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Search */}
      <div className="card p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-primary-muted" />
          <input
            type="text"
            placeholder="Search notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-primary-border rounded-lg focus:ring-2 focus:ring-primary-accent focus:border-primary-accent outline-none bg-primary-bg text-primary-fg"
          />
        </div>
      </div>

      {/* Notes Grid */}
      {filteredNotes.length === 0 ? (
        <div className="card p-12 text-center">
          <FileText className="h-12 w-12 text-primary-muted mx-auto mb-4" />
          <p className="text-primary-muted">
            {searchQuery ? "No notes match your search." : "No notes yet. Create your first note!"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredNotes.map((note) => (
            <div key={note.id} className="card p-4 hover:shadow-lg transition-shadow">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-lg font-semibold text-primary-fg flex-1 pr-2">
                  {note.title}
                </h3>
                <div className="flex gap-1">
                  <button
                    onClick={() => startEdit(note)}
                    className="p-1 rounded hover:bg-primary-accent-light text-primary-muted hover:text-primary-accent transition-colors"
                    title="Edit note"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(note.id)}
                    className="p-1 rounded hover:bg-red-50 text-primary-muted hover:text-red-600 transition-colors"
                    title="Delete note"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              {note.content && (
                <p className="text-sm text-primary-muted mb-3 line-clamp-3">
                  {note.content}
                </p>
              )}
              <div className="text-xs text-primary-muted border-t border-primary-border pt-2">
                Updated: {formatDate(note.updatedAt)}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-primary-border px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-bold text-primary-fg">
                {editingNote ? "Edit Note" : "Create New Note"}
              </h2>
              <button
                onClick={cancelEdit}
                className="p-1 rounded hover:bg-primary-accent-light text-primary-muted"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-primary-fg mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Note title"
                  className="w-full px-4 py-2 border border-primary-border rounded-lg focus:ring-2 focus:ring-primary-accent focus:border-primary-accent outline-none bg-primary-bg text-primary-fg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-primary-fg mb-2">
                  Content
                </label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Note content (supports markdown formatting)"
                  rows={10}
                  className="w-full px-4 py-2 border border-primary-border rounded-lg focus:ring-2 focus:ring-primary-accent focus:border-primary-accent outline-none resize-none bg-primary-bg text-primary-fg"
                  style={{ whiteSpace: 'pre-wrap' }}
                />
              </div>
            </div>
            <div className="sticky bottom-0 bg-gray-50 border-t border-primary-border px-6 py-4 flex justify-end gap-3">
              <button
                onClick={cancelEdit}
                className="btn-secondary flex items-center gap-2"
              >
                <XCircle className="h-4 w-4" />
                Cancel
              </button>
              <button
                onClick={editingNote ? handleUpdate : handleCreate}
                className="btn-primary flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                {editingNote ? "Update" : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


