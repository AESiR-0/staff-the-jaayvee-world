"use client";

import { useEffect, useState } from "react";
import { FileText, Plus, Edit2, Trash2, Search, X, Save, CheckSquare, Users, User, Calendar, GripVertical } from "lucide-react";
import { authenticatedFetch, getTeamSession } from "@/lib/auth-utils";
import { API_BASE_URL } from "@/lib/api";
import { isSuperAdmin } from "@/lib/rbac";
import { TemplateTaskEditor } from "@/components/TemplateTaskEditor";

interface TemplateTask {
  id: string;
  templateId: string;
  title: string;
  description: string | null;
  order: number;
  submissionDeadlineOffset: number | null;
  presentationDeadlineOffset: number | null;
  assignedToGroupId: string | null;
  assignedToUserId: string | null;
  assignedToGroupName?: string | null;
  assignedToUserName?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface EventTemplate {
  id: string;
  name: string;
  description: string | null;
  festivalType: string | null;
  isActive: boolean;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
  tasks?: TemplateTask[];
}

export default function EventTemplatesPage() {
  const [templates, setTemplates] = useState<EventTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<EventTemplate | null>(null);
  const [viewingTemplate, setViewingTemplate] = useState<EventTemplate | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    festivalType: "",
  });
  const [groups, setGroups] = useState<any[]>([]);
  const [teamUsers, setTeamUsers] = useState<any[]>([]);

  const session = getTeamSession();
  const currentUserEmail = session?.email;

  useEffect(() => {
    checkAdminStatus();
  }, []);

  useEffect(() => {
    if (isAdmin === true) {
      fetchTemplates();
      fetchGroups();
      fetchTeamUsers();
    }
  }, [isAdmin]);

  const checkAdminStatus = async () => {
    try {
      const adminStatus = await isSuperAdmin(currentUserEmail);
      setIsAdmin(adminStatus);
    } catch (err) {
      console.error('Error checking admin status:', err);
      setIsAdmin(false);
    }
  };

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await authenticatedFetch(`${API_BASE_URL}/api/team/event-templates`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch templates');
      }

      const data = await response.json();
      if (data.success) {
        setTemplates(data.data || []);
      } else {
        setError(data.error || 'Failed to fetch templates');
      }
    } catch (err: any) {
      console.error("Error fetching templates:", err);
      setError(err.message || "Failed to fetch templates");
    } finally {
      setLoading(false);
    }
  };

  const fetchGroups = async () => {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/api/rbac`);
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data?.groups) {
          setGroups(data.data.groups);
        }
      }
    } catch (err) {
      console.error('Error fetching groups:', err);
    }
  };

  const fetchTeamUsers = async () => {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/api/rbac`);
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data?.users) {
          setTeamUsers(data.data.users);
        }
      }
    } catch (err) {
      console.error('Error fetching team users:', err);
    }
  };

  const fetchTemplateWithTasks = async (templateId: string) => {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/api/team/event-templates/${templateId}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          return data.data;
        }
      }
    } catch (err) {
      console.error('Error fetching template with tasks:', err);
    }
    return null;
  };

  const handleCreate = async () => {
    if (!formData.name.trim()) {
      setError("Template name is required");
      return;
    }

    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/api/team/event-templates`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description || null,
          festivalType: formData.festivalType || null,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setTemplates([data.data, ...templates]);
        setFormData({ name: "", description: "", festivalType: "" });
        setShowCreateModal(false);
        setError(null);
      } else {
        setError(data.error || "Failed to create template");
      }
    } catch (err: any) {
      console.error("Error creating template:", err);
      setError(err.message || "Failed to create template");
    }
  };

  const handleEdit = async () => {
    if (!editingTemplate || !formData.name.trim()) {
      setError("Template name is required");
      return;
    }

    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/api/team/event-templates/${editingTemplate.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description || null,
          festivalType: formData.festivalType || null,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setTemplates(templates.map(t => t.id === editingTemplate.id ? data.data : t));
        setEditingTemplate(null);
        setFormData({ name: "", description: "", festivalType: "" });
        setError(null);
      } else {
        setError(data.error || "Failed to update template");
      }
    } catch (err: any) {
      console.error("Error updating template:", err);
      setError(err.message || "Failed to update template");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return;

    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/api/team/event-templates/${id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (data.success) {
        setTemplates(templates.filter(t => t.id !== id));
      } else {
        setError(data.error || "Failed to delete template");
      }
    } catch (err: any) {
      console.error("Error deleting template:", err);
      setError(err.message || "Failed to delete template");
    }
  };

  const handleViewTemplate = async (template: EventTemplate) => {
    const templateWithTasks = await fetchTemplateWithTasks(template.id);
    if (templateWithTasks) {
      setViewingTemplate(templateWithTasks);
    }
  };

  const filteredTemplates = templates.filter(template =>
    template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (template.festivalType && template.festivalType.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Show loading while checking admin status
  if (isAdmin === null) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary-accent border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-primary-muted">Checking access...</p>
        </div>
      </div>
    );
  }

  // Show access denied only after admin check is complete
  if (isAdmin === false) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-primary-fg mb-2">Access Denied</h1>
          <p className="text-primary-muted">Only administrators can manage event templates.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary-accent border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-primary-muted">Loading templates...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-primary-fg">Event Templates</h1>
          <p className="text-primary-muted mt-1">Create and manage festival event templates with pre-configured tasks</p>
        </div>
        <button
          onClick={() => {
            setShowCreateModal(true);
            setFormData({ name: "", description: "", festivalType: "" });
          }}
          className="px-4 py-2 bg-primary-accent hover:bg-primary-accent-dark text-white rounded-lg font-medium flex items-center gap-2"
        >
          <Plus size={20} />
          Create Template
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
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-primary-muted" />
        <input
          type="text"
          placeholder="Search templates..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-primary-border rounded-lg focus:ring-2 focus:ring-primary-accent focus:border-primary-accent outline-none bg-primary-bg text-primary-fg"
        />
      </div>

      {/* Templates List */}
      <div className="grid gap-4">
        {filteredTemplates.length === 0 ? (
          <div className="card text-center py-12">
            <FileText className="h-12 w-12 text-primary-muted mx-auto mb-4" />
            <p className="text-primary-muted">No templates found</p>
          </div>
        ) : (
          filteredTemplates.map((template) => (
            <div key={template.id} className="card p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <FileText className="h-5 w-5 text-primary-accent" />
                    <h3 className="text-lg font-semibold text-primary-fg">{template.name}</h3>
                    {template.festivalType && (
                      <span className="text-xs bg-primary-accent-light text-primary-accent px-2 py-1 rounded-full">
                        {template.festivalType}
                      </span>
                    )}
                  </div>
                  {template.description && (
                    <p className="text-primary-muted text-sm mb-3">{template.description}</p>
                  )}
                  <div className="flex items-center gap-4 text-xs text-primary-muted">
                    <span>Created: {new Date(template.createdAt).toLocaleDateString()}</span>
                    {template.tasks && (
                      <span>{template.tasks.length} task{template.tasks.length !== 1 ? 's' : ''}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleViewTemplate(template)}
                    className="px-3 py-1.5 text-sm border border-primary-border rounded-lg hover:bg-primary-bg text-primary-fg"
                  >
                    View Tasks
                  </button>
                  <button
                    onClick={() => {
                      setEditingTemplate(template);
                      setFormData({
                        name: template.name,
                        description: template.description || "",
                        festivalType: template.festivalType || "",
                      });
                    }}
                    className="p-2 text-primary-accent hover:bg-primary-accent-light rounded-lg"
                  >
                    <Edit2 size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(template.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create/Edit Modal */}
      {(showCreateModal || editingTemplate) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => {
                setShowCreateModal(false);
                setEditingTemplate(null);
                setFormData({ name: "", description: "", festivalType: "" });
              }}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>

            <h2 className="text-xl font-bold text-primary-fg mb-4">
              {editingTemplate ? "Edit Template" : "Create Template"}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-primary-fg mb-2">
                  Template Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-primary-border rounded-lg bg-primary-bg text-primary-fg"
                  placeholder="e.g., Diwali Festival Template"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-primary-fg mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-primary-border rounded-lg bg-primary-bg text-primary-fg"
                  placeholder="Template description..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-primary-fg mb-2">
                  Festival Type
                </label>
                <input
                  type="text"
                  value={formData.festivalType}
                  onChange={(e) => setFormData({ ...formData, festivalType: e.target.value })}
                  className="w-full px-3 py-2 border border-primary-border rounded-lg bg-primary-bg text-primary-fg"
                  placeholder="e.g., Diwali, Holi, Christmas"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setEditingTemplate(null);
                    setFormData({ name: "", description: "", festivalType: "" });
                  }}
                  className="flex-1 px-4 py-2 border border-primary-border rounded-lg text-primary-fg hover:bg-primary-bg"
                >
                  Cancel
                </button>
                <button
                  onClick={editingTemplate ? handleEdit : handleCreate}
                  className="flex-1 px-4 py-2 bg-primary-accent hover:bg-primary-accent-dark text-white rounded-lg font-medium"
                >
                  {editingTemplate ? "Update" : "Create"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Template Modal with Task Editor */}
      {viewingTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full p-6 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setViewingTemplate(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>

            <h2 className="text-xl font-bold text-primary-fg mb-2">{viewingTemplate.name}</h2>
            <p className="text-primary-muted mb-6">{viewingTemplate.description || "No description"}</p>

            <TemplateTaskEditor
              templateId={viewingTemplate.id}
              onClose={() => setViewingTemplate(null)}
              onUpdate={async () => {
                const updated = await fetchTemplateWithTasks(viewingTemplate.id);
                if (updated) {
                  setViewingTemplate(updated);
                }
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

