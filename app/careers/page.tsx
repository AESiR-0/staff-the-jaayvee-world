"use client";

import { useEffect, useState, useCallback } from "react";
import { Briefcase, Plus, Edit2, Save, X, Loader2, Trash2 } from "lucide-react";
import { authenticatedFetch, getTeamSession } from "@/lib/auth-utils";

interface CareerData {
  id: string;
  title: string;
  type: "Full-time" | "Internship" | "Contract";
  location: string;
  experience: string | null;
  duration: string | null;
  description: string;
  tagColor: string;
  isActive: boolean;
  metadata: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function CareersPage() {
  const [careers, setCareers] = useState<CareerData[]>([]);
  const [loading, setLoading] = useState(true);
  const [canManage, setCanManage] = useState(false);
  const [editingCareer, setEditingCareer] = useState<CareerData | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [seeding, setSeeding] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    type: 'Full-time' as "Full-time" | "Internship" | "Contract",
    location: '',
    experience: '',
    duration: '',
    description: '',
    tagColor: 'bg-blue-500',
    isActive: true,
  });

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://talaash.thejaayveeworld.com';

  const checkPermission = useCallback(async () => {
    try {
      // Check RBAC permission
      const response = await authenticatedFetch(`${API_BASE_URL}/api/rbac?type=users`);
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data?.users) {
          const session = getTeamSession();
          const userEmail = session?.email;
          
          if (userEmail) {
            // Find current user in the users list
            const currentUser = data.data.users.find((u: any) => 
              u.email?.toLowerCase() === userEmail.toLowerCase()
            );
            
            if (currentUser && currentUser.permissions) {
              const hasCareerPermission = currentUser.permissions.some(
                (p: any) => p.permission?.resource === 'careers' && 
                           p.permission?.action === 'access' && 
                           p.isActive
              );
              setCanManage(hasCareerPermission);
              return;
            }
          }
        }
      }
      
      // Fallback: check if user is admin
      const session = getTeamSession();
      const userEmail = session?.email;
      const { isSuperAdmin } = require('@/lib/rbac');
      setCanManage(isSuperAdmin(userEmail));
    } catch (err) {
      console.error('Error checking permissions:', err);
      // Fallback: check if user is admin
      const session = getTeamSession();
      const userEmail = session?.email;
      const { isSuperAdmin } = require('@/lib/rbac');
      setCanManage(isSuperAdmin(userEmail));
    }
  }, [API_BASE_URL]);

  const fetchCareers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await authenticatedFetch(`${API_BASE_URL}/api/careers`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `HTTP ${response.status}: Failed to fetch careers`);
      }
      
      const result = await response.json();
      if (result.success) {
        setCareers(result.data || []);
      } else {
        throw new Error(result.error || 'Failed to load careers');
      }
    } catch (error: any) {
      console.error('Error fetching careers:', error);
      setError(error.message || 'Failed to load careers. Please make sure the database migration has been run.');
    } finally {
      setLoading(false);
    }
  }, [API_BASE_URL]);

  useEffect(() => {
    checkPermission();
    fetchCareers();
  }, [checkPermission, fetchCareers]);

  const handleEdit = (career: CareerData) => {
    setEditingCareer(career);
    setFormData({
      title: career.title,
      type: career.type,
      location: career.location,
      experience: career.experience || '',
      duration: career.duration || '',
      description: career.description,
      tagColor: career.tagColor,
      isActive: career.isActive,
    });
    setShowForm(true);
    setError(null);
    setSuccess(null);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this career position?')) {
      return;
    }

    try {
      setSaving(true);
      setError(null);
      const response = await authenticatedFetch(`${API_BASE_URL}/api/careers?id=${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Failed to delete career');
      }

      setSuccess('Career deleted successfully!');
      await fetchCareers();
      setTimeout(() => setSuccess(null), 3000);
    } catch (error: any) {
      console.error('Error deleting career:', error);
      setError(error.message || 'Failed to delete career');
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    if (!formData.title || !formData.type || !formData.location || !formData.description) {
      setError('Title, type, location, and description are required');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      if (editingCareer) {
        // Update existing career
        const response = await authenticatedFetch(`${API_BASE_URL}/api/careers`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            id: editingCareer.id,
            ...formData,
          }),
        });

        if (!response.ok) {
          const result = await response.json();
          throw new Error(result.error || 'Failed to update career');
        }

        setSuccess('Career updated successfully!');
      } else {
        // Create new career
        const response = await authenticatedFetch(`${API_BASE_URL}/api/careers`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        });

        if (!response.ok) {
          const result = await response.json();
          throw new Error(result.error || 'Failed to create career');
        }

        setSuccess('Career created successfully!');
      }

      await fetchCareers();
      setShowForm(false);
      setEditingCareer(null);
      setFormData({
        title: '',
        type: 'Full-time',
        location: '',
        experience: '',
        duration: '',
        description: '',
        tagColor: 'bg-blue-500',
        isActive: true,
      });
      setTimeout(() => setSuccess(null), 3000);
    } catch (error: any) {
      console.error('Error saving career:', error);
      setError(error.message || 'Failed to save career');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingCareer(null);
    setFormData({
      title: '',
      type: 'Full-time',
      location: '',
      experience: '',
      duration: '',
      description: '',
      tagColor: 'bg-blue-500',
      isActive: true,
    });
    setError(null);
    setSuccess(null);
  };

  const handleSeedData = async () => {
    if (!confirm('This will insert 7 dummy career positions. Continue?')) {
      return;
    }

    try {
      setSeeding(true);
      setError(null);
      const response = await authenticatedFetch(`${API_BASE_URL}/api/careers/seed`, {
        method: 'POST',
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Failed to seed careers');
      }

      const result = await response.json();
      if (result.success) {
        setSuccess(`Successfully seeded ${result.data?.length || 7} careers!`);
        await fetchCareers();
        setTimeout(() => setSuccess(null), 5000);
      } else {
        throw new Error(result.error || 'Failed to seed careers');
      }
    } catch (error: any) {
      console.error('Error seeding careers:', error);
      setError(error.message || 'Failed to seed careers');
    } finally {
      setSeeding(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-gray-600">Loading careers...</p>
        </div>
      </div>
    );
  }

  if (!canManage) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-red-800 mb-2">Access Denied</h2>
            <p className="text-red-600">You don&apos;t have permission to manage careers. Admin access required.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Briefcase className="h-8 w-8" />
              Career Positions
            </h1>
            <p className="text-gray-600 mt-2">Manage job positions and career opportunities</p>
          </div>
          {!showForm && (
            <div className="flex gap-3">
              {careers.length === 0 && (
                <button
                  onClick={handleSeedData}
                  disabled={seeding}
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {seeding ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Seeding...
                    </>
                  ) : (
                    <>
                      <Plus className="h-5 w-5" />
                      Seed Dummy Data
                    </>
                  )}
                </button>
              )}
              <button
                onClick={() => {
                  setShowForm(true);
                  setEditingCareer(null);
                  setFormData({
                    title: '',
                    type: 'Full-time',
                    location: '',
                    experience: '',
                    duration: '',
                    description: '',
                    tagColor: 'bg-blue-500',
                    isActive: true,
                  });
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 flex items-center gap-2"
              >
                <Plus className="h-5 w-5" />
                Add New Position
              </button>
            </div>
          )}
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg">
            {success}
          </div>
        )}

        {/* Form */}
        {showForm && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              {editingCareer ? 'Edit Career Position' : 'Create New Career Position'}
            </h2>

            <div className="space-y-4">
              {/* Title */}
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  required
                />
              </div>

              {/* Type and Location */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-2">
                    Type *
                  </label>
                  <select
                    id="type"
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as "Full-time" | "Internship" | "Contract" })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="Full-time">Full-time</option>
                    <option value="Internship">Internship</option>
                    <option value="Contract">Contract</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
                    Location *
                  </label>
                  <input
                    type="text"
                    id="location"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    required
                  />
                </div>
              </div>

              {/* Experience and Duration */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="experience" className="block text-sm font-medium text-gray-700 mb-2">
                    Experience (e.g., &quot;2+ years&quot;)
                  </label>
                  <input
                    type="text"
                    id="experience"
                    value={formData.experience}
                    onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="2+ years"
                  />
                </div>
                <div>
                  <label htmlFor="duration" className="block text-sm font-medium text-gray-700 mb-2">
                    Duration (for internships/contracts, e.g., &quot;3-6 months&quot;)
                  </label>
                  <input
                    type="text"
                    id="duration"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="3-6 months"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                  Description *
                </label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  required
                />
              </div>

              {/* Tag Color and Active Status */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="tagColor" className="block text-sm font-medium text-gray-700 mb-2">
                    Tag Color (Tailwind class)
                  </label>
                  <input
                    type="text"
                    id="tagColor"
                    value={formData.tagColor}
                    onChange={(e) => setFormData({ ...formData, tagColor: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="bg-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Examples: bg-blue-500, bg-yellow-500, bg-green-500</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                    />
                    <span className="text-sm text-gray-700">Active (visible on careers page)</span>
                  </label>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 pt-4">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-5 w-5" />
                      {editingCareer ? 'Update Career' : 'Create Career'}
                    </>
                  )}
                </button>
                <button
                  onClick={handleCancel}
                  disabled={saving}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-3 rounded-lg transition-all duration-200 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <X className="h-5 w-5" />
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Careers List */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">All Positions ({careers.length})</h2>
          
          {careers.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Briefcase className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p>No career positions found. Create your first position above.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {careers.map((career) => (
                <div
                  key={career.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{career.title}</h3>
                        <span className={`px-2 py-1 text-xs rounded ${career.tagColor} text-white`}>
                          {career.type}
                        </span>
                        {!career.isActive && (
                          <span className="px-2 py-1 text-xs rounded bg-gray-400 text-white">
                            Inactive
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{career.location}</p>
                      {career.experience && (
                        <p className="text-sm text-gray-500 mb-1">Experience: {career.experience}</p>
                      )}
                      {career.duration && (
                        <p className="text-sm text-gray-500 mb-2">Duration: {career.duration}</p>
                      )}
                      <p className="text-sm text-gray-700 line-clamp-2">{career.description}</p>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => handleEdit(career)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Edit2 className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(career.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete"
                        disabled={saving}
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


