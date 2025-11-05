"use client";

import { useEffect, useState } from "react";
import { Image as ImageIcon, Upload, Edit2, Trash2, X, Save, Loader2, Download } from "lucide-react";
import { authenticatedFetch, getStaffSession } from "@/lib/auth-utils";

interface GalleryImage {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string;
  thumbnailUrl: string;
  category: string;
  eventId: string | null;
  photographer: string | null;
  tags: string | null;
  fileSize: number | null;
  dimensions: string | null;
  isActive: boolean;
  isFeatured: boolean;
  downloadCount: number;
  createdAt: string;
}

const CATEGORIES = ['event', 'behind-scenes', 'performances', 'crowd', 'venue'];

export default function GalleryPage() {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [editingImage, setEditingImage] = useState<GalleryImage | null>(null);
  const [canManage, setCanManage] = useState(false);
  
  // Upload form state
  const [uploadForm, setUploadForm] = useState({
    title: '',
    description: '',
    imageUrl: '',
    thumbnailUrl: '',
    category: 'event',
    photographer: '',
    tags: '',
    isFeatured: false,
  });

  // Edit form state
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    category: 'event',
    photographer: '',
    tags: '',
    isFeatured: false,
    isActive: true,
  });

  const session = getStaffSession();

  useEffect(() => {
    checkPermission();
    fetchImages();
  }, []);

  const checkPermission = async () => {
    try {
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://talaash.thejaayveeworld.com';
      const response = await authenticatedFetch(`${API_BASE_URL}/api/rbac`);
      
      if (response.ok) {
        const data = await response.json();
        const userPermissions = data.data?.userPermissions || [];
        const hasGalleryPermission = userPermissions.some(
          (up: any) => up.permission?.resource === 'gallery' && up.isActive
        );
        setCanManage(hasGalleryPermission);
      }
    } catch (err) {
      console.error('Error checking permissions:', err);
    }
  };

  const fetchImages = async () => {
    try {
      setLoading(true);
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://talaash.thejaayveeworld.com';
      const response = await authenticatedFetch(`${API_BASE_URL}/api/gallery`);
      
      if (!response.ok) throw new Error('Failed to fetch images');
      
      const result = await response.json();
      if (result.success) {
        setImages(result.data || []);
      }
    } catch (error) {
      console.error('Error fetching gallery:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async () => {
    if (!uploadForm.title || !uploadForm.imageUrl || !uploadForm.thumbnailUrl || !uploadForm.category) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://talaash.thejaayveeworld.com';
      const response = await authenticatedFetch(`${API_BASE_URL}/api/gallery`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(uploadForm),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to upload image');
      }

      await fetchImages();
      setShowUploadModal(false);
      setUploadForm({
        title: '',
        description: '',
        imageUrl: '',
        thumbnailUrl: '',
        category: 'event',
        photographer: '',
        tags: '',
        isFeatured: false,
      });
    } catch (error: any) {
      alert(error.message || 'Failed to upload image');
    }
  };

  const handleEdit = (image: GalleryImage) => {
    setEditingImage(image);
    setEditForm({
      title: image.title,
      description: image.description || '',
      category: image.category,
      photographer: image.photographer || '',
      tags: image.tags || '',
      isFeatured: image.isFeatured,
      isActive: image.isActive,
    });
  };

  const handleUpdate = async () => {
    if (!editingImage || !editForm.title) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://talaash.thejaayveeworld.com';
      const response = await authenticatedFetch(`${API_BASE_URL}/api/gallery/${editingImage.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update image');
      }

      await fetchImages();
      setEditingImage(null);
    } catch (error: any) {
      alert(error.message || 'Failed to update image');
    }
  };

  const handleDelete = async (imageId: string) => {
    if (!confirm('Are you sure you want to delete this image?')) return;

    try {
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://talaash.thejaayveeworld.com';
      const response = await authenticatedFetch(`${API_BASE_URL}/api/gallery/${imageId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete image');
      }

      await fetchImages();
    } catch (error: any) {
      alert(error.message || 'Failed to delete image');
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex justify-center items-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <ImageIcon className="h-6 w-6 text-primary-accent" />
          <h1 className="text-2xl font-bold text-primary-fg">Gallery Management</h1>
        </div>
        {canManage && (
          <button
            onClick={() => setShowUploadModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary-accent text-white rounded-lg hover:bg-primary-accent-dark transition-colors"
          >
            <Upload className="h-4 w-4" />
            Upload Image
          </button>
        )}
      </div>

      {/* Images Grid */}
      {images.length === 0 ? (
        <div className="text-center py-20">
          <ImageIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No images in gallery</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map((image) => (
            <div
              key={image.id}
              className="bg-white rounded-lg border border-primary-border overflow-hidden hover:shadow-md transition-shadow"
            >
              <div className="relative aspect-square">
                <img
                  src={image.thumbnailUrl}
                  alt={image.title}
                  className="w-full h-full object-cover"
                />
                {image.isFeatured && (
                  <div className="absolute top-2 right-2 bg-yellow-400 text-black px-2 py-1 rounded text-xs font-bold">
                    Featured
                  </div>
                )}
              </div>
              <div className="p-3">
                <h3 className="font-semibold text-sm text-primary-fg mb-1 line-clamp-1">{image.title}</h3>
                <div className="flex items-center justify-between text-xs text-primary-muted mb-2">
                  <span className="bg-gray-100 px-2 py-0.5 rounded">{image.category}</span>
                  <span>{image.downloadCount} downloads</span>
                </div>
                {canManage && (
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => handleEdit(image)}
                      className="flex-1 px-2 py-1 bg-blue-100 text-blue-600 rounded text-xs hover:bg-blue-200 transition-colors flex items-center justify-center gap-1"
                    >
                      <Edit2 className="h-3 w-3" />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(image.id)}
                      className="flex-1 px-2 py-1 bg-red-100 text-red-600 rounded text-xs hover:bg-red-200 transition-colors flex items-center justify-center gap-1"
                    >
                      <Trash2 className="h-3 w-3" />
                      Delete
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg border border-primary-border p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-primary-fg">Upload Image</h2>
              <button
                onClick={() => setShowUploadModal(false)}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-primary-fg mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  value={uploadForm.title}
                  onChange={(e) => setUploadForm({ ...uploadForm, title: e.target.value })}
                  className="w-full px-3 py-2 border border-primary-border rounded-lg"
                  placeholder="Image title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-primary-fg mb-2">
                  Description
                </label>
                <textarea
                  value={uploadForm.description}
                  onChange={(e) => setUploadForm({ ...uploadForm, description: e.target.value })}
                  className="w-full px-3 py-2 border border-primary-border rounded-lg"
                  placeholder="Image description"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-primary-fg mb-2">
                    High-Res Image URL *
                  </label>
                  <input
                    type="url"
                    value={uploadForm.imageUrl}
                    onChange={(e) => setUploadForm({ ...uploadForm, imageUrl: e.target.value })}
                    className="w-full px-3 py-2 border border-primary-border rounded-lg"
                    placeholder="https://..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-primary-fg mb-2">
                    Thumbnail URL *
                  </label>
                  <input
                    type="url"
                    value={uploadForm.thumbnailUrl}
                    onChange={(e) => setUploadForm({ ...uploadForm, thumbnailUrl: e.target.value })}
                    className="w-full px-3 py-2 border border-primary-border rounded-lg"
                    placeholder="https://..."
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-primary-fg mb-2">
                    Category *
                  </label>
                  <select
                    value={uploadForm.category}
                    onChange={(e) => setUploadForm({ ...uploadForm, category: e.target.value })}
                    className="w-full px-3 py-2 border border-primary-border rounded-lg"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat.charAt(0).toUpperCase() + cat.slice(1).replace('-', ' ')}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-primary-fg mb-2">
                    Photographer
                  </label>
                  <input
                    type="text"
                    value={uploadForm.photographer}
                    onChange={(e) => setUploadForm({ ...uploadForm, photographer: e.target.value })}
                    className="w-full px-3 py-2 border border-primary-border rounded-lg"
                    placeholder="Photographer name"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-primary-fg mb-2">
                  Tags (comma-separated)
                </label>
                <input
                  type="text"
                  value={uploadForm.tags}
                  onChange={(e) => setUploadForm({ ...uploadForm, tags: e.target.value })}
                  className="w-full px-3 py-2 border border-primary-border rounded-lg"
                  placeholder="tag1, tag2, tag3"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isFeatured"
                  checked={uploadForm.isFeatured}
                  onChange={(e) => setUploadForm({ ...uploadForm, isFeatured: e.target.checked })}
                  className="w-4 h-4"
                />
                <label htmlFor="isFeatured" className="text-sm text-primary-fg">
                  Mark as Featured
                </label>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={handleUpload}
                  className="flex-1 px-4 py-2 bg-primary-accent text-white rounded-lg hover:bg-primary-accent-dark transition-colors"
                >
                  Upload
                </button>
                <button
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 border border-primary-border text-primary-fg rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingImage && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg border border-primary-border p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-primary-fg">Edit Image</h2>
              <button
                onClick={() => setEditingImage(null)}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-primary-fg mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  className="w-full px-3 py-2 border border-primary-border rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-primary-fg mb-2">
                  Description
                </label>
                <textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  className="w-full px-3 py-2 border border-primary-border rounded-lg"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-primary-fg mb-2">
                    Category *
                  </label>
                  <select
                    value={editForm.category}
                    onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                    className="w-full px-3 py-2 border border-primary-border rounded-lg"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat.charAt(0).toUpperCase() + cat.slice(1).replace('-', ' ')}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-primary-fg mb-2">
                    Photographer
                  </label>
                  <input
                    type="text"
                    value={editForm.photographer}
                    onChange={(e) => setEditForm({ ...editForm, photographer: e.target.value })}
                    className="w-full px-3 py-2 border border-primary-border rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-primary-fg mb-2">
                  Tags (comma-separated)
                </label>
                <input
                  type="text"
                  value={editForm.tags}
                  onChange={(e) => setEditForm({ ...editForm, tags: e.target.value })}
                  className="w-full px-3 py-2 border border-primary-border rounded-lg"
                />
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="editIsFeatured"
                    checked={editForm.isFeatured}
                    onChange={(e) => setEditForm({ ...editForm, isFeatured: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <label htmlFor="editIsFeatured" className="text-sm text-primary-fg">
                    Featured
                  </label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="editIsActive"
                    checked={editForm.isActive}
                    onChange={(e) => setEditForm({ ...editForm, isActive: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <label htmlFor="editIsActive" className="text-sm text-primary-fg">
                    Active
                  </label>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={handleUpdate}
                  className="flex-1 px-4 py-2 bg-primary-accent text-white rounded-lg hover:bg-primary-accent-dark transition-colors"
                >
                  Update
                </button>
                <button
                  onClick={() => setEditingImage(null)}
                  className="px-4 py-2 border border-primary-border text-primary-fg rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

