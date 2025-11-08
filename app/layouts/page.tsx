"use client";

import { useEffect, useState, useCallback } from "react";
import { Layout, Upload, Edit2, Save, X, Loader2, Image as ImageIcon } from "lucide-react";
import { authenticatedFetch, getStaffSession } from "@/lib/auth-utils";
import RichTextEditor from "@/components/RichTextEditor";

interface LayoutData {
  id: string;
  name: string;
  section: string;
  logoUrl: string | null;
  description: string | null;
  backgroundImageUrl: string | null;
  button1Text: string | null;
  button1Link: string | null;
  button2Text: string | null;
  button2Link: string | null;
  isActive: boolean;
  metadata: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function LayoutsPage() {
  const [layouts, setLayouts] = useState<LayoutData[]>([]);
  const [loading, setLoading] = useState(true);
  const [canManage, setCanManage] = useState(false);
  const [editingLayout, setEditingLayout] = useState<LayoutData | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // File upload state
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [backgroundFile, setBackgroundFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [backgroundPreview, setBackgroundPreview] = useState<string | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: 'home-hero',
    section: 'hero',
    logoUrl: '',
    description: '',
    backgroundImageUrl: '',
    button1Text: 'Explore Events',
    button1Link: '/events',
    button2Text: 'Learn More',
    button2Link: '/about',
  });

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://talaash.thejaayveeworld.com';

  const checkPermission = useCallback(async () => {
    try {
      // Check RBAC permission
      const response = await authenticatedFetch(`${API_BASE_URL}/api/rbac?type=users`);
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data?.users) {
          const session = getStaffSession();
          const userEmail = session?.email;
          
          if (userEmail) {
            // Find current user in the users list
            const currentUser = data.data.users.find((u: any) => 
              u.email?.toLowerCase() === userEmail.toLowerCase()
            );
            
            if (currentUser && currentUser.permissions) {
              const hasLayoutPermission = currentUser.permissions.some(
                (p: any) => p.permission?.resource === 'layouts' && 
                           p.permission?.action === 'access' && 
                           p.isActive
              );
              setCanManage(hasLayoutPermission);
              return;
            }
          }
        }
      }
      
      // Fallback: check if user is admin
      const session = getStaffSession();
      const userEmail = session?.email;
      const { isSuperAdmin } = require('@/lib/rbac');
      setCanManage(isSuperAdmin(userEmail));
    } catch (err) {
      console.error('Error checking permissions:', err);
      // Fallback: check if user is admin
      const session = getStaffSession();
      const userEmail = session?.email;
      const { isSuperAdmin } = require('@/lib/rbac');
      setCanManage(isSuperAdmin(userEmail));
    }
  }, [API_BASE_URL]);

  const fetchLayouts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await authenticatedFetch(`${API_BASE_URL}/api/layouts?name=home-hero&section=hero`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `HTTP ${response.status}: Failed to fetch layouts`);
      }
      
      const result = await response.json();
      if (result.success) {
        setLayouts(result.data || []);
        // If there's an active layout, pre-fill the form
        const activeLayout = result.data?.find((l: LayoutData) => l.isActive);
        if (activeLayout) {
          setFormData({
            name: activeLayout.name,
            section: activeLayout.section,
            logoUrl: activeLayout.logoUrl || '',
            description: activeLayout.description || '',
            backgroundImageUrl: activeLayout.backgroundImageUrl || '',
            button1Text: activeLayout.button1Text || 'Explore Events',
            button1Link: activeLayout.button1Link || '/events',
            button2Text: activeLayout.button2Text || 'Learn More',
            button2Link: activeLayout.button2Link || '/about',
          });
          // Clear any existing file selections when loading existing layout
          setLogoFile(null);
          setBackgroundFile(null);
          if (logoPreview) {
            URL.revokeObjectURL(logoPreview);
            setLogoPreview(null);
          }
          if (backgroundPreview) {
            URL.revokeObjectURL(backgroundPreview);
            setBackgroundPreview(null);
          }
        }
      } else {
        throw new Error(result.error || 'Failed to load layouts');
      }
    } catch (error: any) {
      console.error('Error fetching layouts:', error);
      setError(error.message || 'Failed to load layouts. Please make sure the database migration has been run.');
    } finally {
      setLoading(false);
    }
  }, [API_BASE_URL]);

  useEffect(() => {
    checkPermission();
    fetchLayouts();
  }, [checkPermission, fetchLayouts]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'background') => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file');
        return;
      }
      
      if (type === 'logo') {
        setLogoFile(file);
        const url = URL.createObjectURL(file);
        setLogoPreview(url);
      } else {
        setBackgroundFile(file);
        const url = URL.createObjectURL(file);
        setBackgroundPreview(url);
      }
    }
  };

  const handleSave = async () => {
    if (!formData.name || !formData.section) {
      setError('Name and section are required');
      return;
    }

    try {
      setSaving(true);
      setUploading(true);
      setError(null);
      setSuccess(null);

      let logoUrl = formData.logoUrl;
      let backgroundImageUrl = formData.backgroundImageUrl;

      // Upload logo if file is selected
      if (logoFile) {
        const logoFormData = new FormData();
        logoFormData.append('file', logoFile);
        logoFormData.append('folder', 'layouts');

        const logoUploadResponse = await authenticatedFetch(`${API_BASE_URL}/api/upload`, {
          method: 'POST',
          body: logoFormData,
        });

        if (!logoUploadResponse.ok) {
          const errorData = await logoUploadResponse.json();
          throw new Error(errorData.error || 'Failed to upload logo');
        }

        const logoResult = await logoUploadResponse.json();
        if (logoResult.success && logoResult.data) {
          logoUrl = logoResult.data.url;
        } else {
          throw new Error('Failed to get uploaded logo URL');
        }
      }

      // Upload background image if file is selected
      if (backgroundFile) {
        const bgFormData = new FormData();
        bgFormData.append('file', backgroundFile);
        bgFormData.append('folder', 'layouts');

        const bgUploadResponse = await authenticatedFetch(`${API_BASE_URL}/api/upload`, {
          method: 'POST',
          body: bgFormData,
        });

        if (!bgUploadResponse.ok) {
          const errorData = await bgUploadResponse.json();
          throw new Error(errorData.error || 'Failed to upload background image');
        }

        const bgResult = await bgUploadResponse.json();
        if (bgResult.success && bgResult.data) {
          backgroundImageUrl = bgResult.data.url;
        } else {
          throw new Error('Failed to get uploaded background image URL');
        }
      }

      setUploading(false);

      // Check if we're editing an existing layout
      const activeLayout = layouts.find(l => l.isActive);
      
      if (activeLayout) {
        // Update existing layout
        const response = await authenticatedFetch(`${API_BASE_URL}/api/layouts`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            id: activeLayout.id,
            name: formData.name,
            section: formData.section,
            logoUrl: logoUrl || null,
            description: formData.description || null,
            backgroundImageUrl: backgroundImageUrl || null,
            button1Text: formData.button1Text || null,
            button1Link: formData.button1Link || null,
            button2Text: formData.button2Text || null,
            button2Link: formData.button2Link || null,
            isActive: true,
          }),
        });

        if (!response.ok) {
          const result = await response.json();
          throw new Error(result.error || 'Failed to update layout');
        }

        setSuccess('Layout updated successfully!');
      } else {
        // Create new layout
        const response = await authenticatedFetch(`${API_BASE_URL}/api/layouts`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: formData.name,
            section: formData.section,
            logoUrl: logoUrl || null,
            description: formData.description || null,
            backgroundImageUrl: backgroundImageUrl || null,
            button1Text: formData.button1Text || null,
            button1Link: formData.button1Link || null,
            button2Text: formData.button2Text || null,
            button2Link: formData.button2Link || null,
            isActive: true,
          }),
        });

        if (!response.ok) {
          const result = await response.json();
          throw new Error(result.error || 'Failed to create layout');
        }

        setSuccess('Layout created successfully!');
      }

      // Clear file selections and previews
      setLogoFile(null);
      setBackgroundFile(null);
      if (logoPreview) {
        URL.revokeObjectURL(logoPreview);
        setLogoPreview(null);
      }
      if (backgroundPreview) {
        URL.revokeObjectURL(backgroundPreview);
        setBackgroundPreview(null);
      }

      // Refresh layouts
      await fetchLayouts();
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (error: any) {
      console.error('Error saving layout:', error);
      setError(error.message || 'Failed to save layout');
      setUploading(false);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-gray-600">Loading layouts...</p>
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
            <p className="text-red-600">You don&apos;t have permission to manage layouts. Admin access required.</p>
          </div>
        </div>
      </div>
    );
  }

  const activeLayout = layouts.find(l => l.isActive);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center gap-3 mb-2">
            <Layout className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold text-gray-900">Layout Management</h1>
          </div>
          <p className="text-gray-600">Manage home page hero section (logo, description, background image)</p>
        </div>

        {/* Messages */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <p className="text-green-800">{success}</p>
          </div>
        )}

        {/* Form */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            {activeLayout ? 'Edit Home Hero Layout' : 'Create Home Hero Layout'}
          </h2>

          <div className="space-y-6">
            {/* Logo Upload */}
            <div>
              <label htmlFor="logoFile" className="block text-sm font-medium text-gray-700 mb-2">
                Logo Image
              </label>
              <div className="space-y-2">
                <input
                  type="file"
                  id="logoFile"
                  accept="image/*"
                  onChange={(e) => handleFileSelect(e, 'logo')}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
                {(logoPreview || formData.logoUrl) && (
                  <div className="mt-2">
                    <p className="text-sm text-gray-600 mb-2">Preview:</p>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img 
                      src={logoPreview || formData.logoUrl || ''} 
                      alt="Logo preview" 
                      className="max-h-20 object-contain border border-gray-200 rounded"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                    {logoFile && (
                      <p className="text-xs text-gray-500 mt-1">New file selected: {logoFile.name}</p>
                    )}
                  </div>
                )}
                {formData.logoUrl && !logoFile && (
                  <p className="text-xs text-gray-500">Current logo: {formData.logoUrl}</p>
                )}
              </div>
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Description (Rich Text)
              </label>
              <RichTextEditor
                value={formData.description}
                onChange={(value) => setFormData({ ...formData, description: value })}
                placeholder="Enter hero section description..."
              />
              <p className="mt-2 text-xs text-gray-500">
                Use the toolbar to format your text with bold, italic, lists, and alignment.
              </p>
            </div>

            {/* Background Image Upload */}
            <div>
              <label htmlFor="backgroundFile" className="block text-sm font-medium text-gray-700 mb-2">
                Background Image
              </label>
              <div className="space-y-2">
                <input
                  type="file"
                  id="backgroundFile"
                  accept="image/*"
                  onChange={(e) => handleFileSelect(e, 'background')}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
                {(backgroundPreview || formData.backgroundImageUrl) && (
                  <div className="mt-2">
                    <p className="text-sm text-gray-600 mb-2">Preview:</p>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img 
                      src={backgroundPreview || formData.backgroundImageUrl || ''} 
                      alt="Background preview" 
                      className="max-h-48 w-full object-cover border border-gray-200 rounded"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                    {backgroundFile && (
                      <p className="text-xs text-gray-500 mt-1">New file selected: {backgroundFile.name}</p>
                    )}
                  </div>
                )}
                {formData.backgroundImageUrl && !backgroundFile && (
                  <p className="text-xs text-gray-500">Current background: {formData.backgroundImageUrl}</p>
                )}
              </div>
            </div>

            {/* Button 1 Configuration */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="button1Text" className="block text-sm font-medium text-gray-700 mb-2">
                  Button 1 Text
                </label>
                <input
                  type="text"
                  id="button1Text"
                  value={formData.button1Text}
                  onChange={(e) => setFormData({ ...formData, button1Text: e.target.value })}
                  placeholder="Explore Events"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
              <div>
                <label htmlFor="button1Link" className="block text-sm font-medium text-gray-700 mb-2">
                  Button 1 Link
                </label>
                <input
                  type="text"
                  id="button1Link"
                  value={formData.button1Link}
                  onChange={(e) => setFormData({ ...formData, button1Link: e.target.value })}
                  placeholder="/events"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
            </div>

            {/* Button 2 Configuration */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="button2Text" className="block text-sm font-medium text-gray-700 mb-2">
                  Button 2 Text
                </label>
                <input
                  type="text"
                  id="button2Text"
                  value={formData.button2Text}
                  onChange={(e) => setFormData({ ...formData, button2Text: e.target.value })}
                  placeholder="Learn More"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
              <div>
                <label htmlFor="button2Link" className="block text-sm font-medium text-gray-700 mb-2">
                  Button 2 Link
                </label>
                <input
                  type="text"
                  id="button2Link"
                  value={formData.button2Link}
                  onChange={(e) => setFormData({ ...formData, button2Link: e.target.value })}
                  placeholder="/about"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end gap-4 pt-4 border-t border-gray-200">
              <button
                onClick={handleSave}
                disabled={saving || uploading}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
              >
                {(saving || uploading) ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    {uploading ? 'Uploading images...' : 'Saving...'}
                  </>
                ) : (
                  <>
                    <Save className="h-5 w-5" />
                    {activeLayout ? 'Update Layout' : 'Create Layout'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Current Layout Info */}
        {activeLayout && (
          <div className="bg-white rounded-lg shadow-sm p-6 mt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Active Layout</h3>
            <div className="space-y-2 text-sm text-gray-600">
              <p><span className="font-medium">Created:</span> {new Date(activeLayout.createdAt).toLocaleString()}</p>
              <p><span className="font-medium">Last Updated:</span> {new Date(activeLayout.updatedAt).toLocaleString()}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

