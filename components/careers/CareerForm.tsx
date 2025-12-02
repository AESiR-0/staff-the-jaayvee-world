"use client";

import { useState, useEffect } from "react";
import { Save, X, Loader2 } from "lucide-react";
import { CareerData, CareerFormData } from "@/lib/api/careers";

interface CareerFormProps {
  career?: CareerData | null;
  onSave: (data: CareerFormData) => Promise<void>;
  onCancel: () => void;
  saving: boolean;
}

const defaultFormData: CareerFormData = {
  title: '',
  type: 'Full-time',
  location: '',
  experience: '',
  duration: '',
  description: '',
  tagColor: 'bg-blue-500',
  isActive: true,
};

export default function CareerForm({ career, onSave, onCancel, saving }: CareerFormProps) {
  const [formData, setFormData] = useState<CareerFormData>(defaultFormData);

  // Update form data when career prop changes
  useEffect(() => {
    if (career) {
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
    } else {
      setFormData(defaultFormData);
    }
  }, [career]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.type || !formData.location || !formData.description) {
      return;
    }

    await onSave(formData);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">
        {career ? 'Edit Career Position' : 'Create New Career Position'}
      </h2>

      <form onSubmit={handleSubmit}>
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
                onChange={(e) => setFormData({ ...formData, type: e.target.value as CareerFormData['type'] })}
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
              type="submit"
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
                  {career ? 'Update Career' : 'Create Career'}
                </>
              )}
            </button>
            <button
              type="button"
              onClick={onCancel}
              disabled={saving}
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-3 rounded-lg transition-all duration-200 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <X className="h-5 w-5" />
              Cancel
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

