"use client";

import { Save, Loader2 } from "lucide-react";
import RichTextEditor from "@/components/RichTextEditor";
import { ImageUploader } from "./ImageUploader";
import { GradientBuilder } from "./GradientBuilder";
import { SectionConfig } from "./SectionSidebar";

interface LayoutFormData {
  pageName: 'home' | 'event-detail';
  sectionName: string;
  logoUrl: string;
  description: string;
  backgroundImageUrl: string;
  backgroundType: string;
  backgroundColor: string;
  backgroundGradient: string;
  textAlignment: string;
  sectionHeight: string;
  animationType: string;
  overlayOpacity: number;
  customCss: string;
  displayOrder: number;
  button1Text: string;
  button1Link: string;
  button2Text: string;
  button2Link: string;
  isVisible: boolean;
}

interface LayoutFormProps {
  currentSection: SectionConfig | undefined;
  formData: LayoutFormData;
  logoFile: File | null;
  backgroundFile: File | null;
  logoPreview: string | null;
  backgroundPreview: string | null;
  saving: boolean;
  uploading: boolean;
  activeLayout: boolean;
  onFormChange: (data: Partial<LayoutFormData>) => void;
  onLogoSelect: (file: File | null) => void;
  onBackgroundSelect: (file: File | null) => void;
  onRemoveLogo: () => void;
  onRemoveBackground: () => void;
  onSave: () => void;
}

export function LayoutForm({
  currentSection,
  formData,
  logoFile,
  backgroundFile,
  logoPreview,
  backgroundPreview,
  saving,
  uploading,
  activeLayout,
  onFormChange,
  onLogoSelect,
  onBackgroundSelect,
  onRemoveLogo,
  onRemoveBackground,
  onSave,
}: LayoutFormProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">
        {activeLayout ? `Edit ${currentSection?.label}` : `Create ${currentSection?.label}`}
      </h2>

      <div className="space-y-6">
        {/* Visibility Toggle */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <label htmlFor="isVisible" className="text-sm font-medium text-gray-700">
              Section Visibility
            </label>
            <span className="text-xs text-gray-500">
              {formData.isVisible ? 'Visible on page' : 'Hidden from page'}
            </span>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={formData.isVisible}
            onClick={() => onFormChange({ isVisible: !formData.isVisible })}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
              formData.isVisible ? 'bg-blue-600' : 'bg-gray-200'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                formData.isVisible ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Logo Upload - TEXT (URL) type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Logo Image URL (TEXT)
          </label>
          <ImageUploader
            label="Logo Image"
            currentUrl={formData.logoUrl}
            previewUrl={logoPreview}
            onFileSelect={onLogoSelect}
            onRemove={logoFile || logoPreview ? onRemoveLogo : undefined}
          />
          <p className="text-xs text-gray-500 mt-1">TEXT - URL to logo image</p>
        </div>

        {/* Description - TEXT type */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
            Description (TEXT - Rich Text HTML)
          </label>
          <RichTextEditor
            value={formData.description}
            onChange={(value) => onFormChange({ description: value })}
            placeholder={`Enter ${currentSection?.label.toLowerCase()} description...`}
          />
          <p className="text-xs text-gray-500 mt-1">TEXT - HTML content stored as text</p>
        </div>

        {/* Background Image Upload - TEXT (URL) type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Background Image URL (TEXT)
          </label>
          <ImageUploader
            label="Background Image"
            currentUrl={formData.backgroundImageUrl}
            previewUrl={backgroundPreview}
            onFileSelect={onBackgroundSelect}
            onRemove={backgroundFile || backgroundPreview ? onRemoveBackground : undefined}
          />
          <p className="text-xs text-gray-500 mt-1">TEXT - URL to background image</p>
        </div>

        {/* Background Type - TEXT (enum) type */}
        <div>
          <label htmlFor="backgroundType" className="block text-sm font-medium text-gray-700 mb-2">
            Background Type (TEXT)
          </label>
          <select
            id="backgroundType"
            value={formData.backgroundType}
            onChange={(e) => onFormChange({ backgroundType: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            <option value="color">Color</option>
            <option value="gradient">Gradient</option>
            <option value="image">Image</option>
            <option value="video">Video</option>
          </select>
          <p className="text-xs text-gray-500 mt-1">TEXT - Enum: &apos;color&apos;, &apos;gradient&apos;, &apos;image&apos;, &apos;video&apos;</p>
        </div>

        {/* Background Color - TEXT type */}
        {formData.backgroundType === 'color' && (
          <div>
            <label htmlFor="backgroundColor" className="block text-sm font-medium text-gray-700 mb-2">
              Background Color (TEXT)
            </label>
            <div className="flex gap-2">
              <input
                type="color"
                id="backgroundColor"
                value={formData.backgroundColor || '#ffffff'}
                onChange={(e) => onFormChange({ backgroundColor: e.target.value })}
                className="h-10 w-20 border border-gray-300 rounded-lg cursor-pointer"
              />
              <input
                type="text"
                value={formData.backgroundColor || ''}
                onChange={(e) => onFormChange({ backgroundColor: e.target.value })}
                placeholder="#ffffff or rgb(255,255,255)"
                pattern="^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$|^rgb\(|^rgba\(|^hsl\(|^hsla\("
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">TEXT - Hex, RGB, RGBA, HSL, or HSLA color value</p>
          </div>
        )}

        {/* Background Gradient - TEXT type with Builder */}
        {formData.backgroundType === 'gradient' && (
          <div>
            <label htmlFor="backgroundGradient" className="block text-sm font-medium text-gray-700 mb-2">
              Background Gradient (TEXT)
            </label>
            <GradientBuilder
              value={formData.backgroundGradient || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'}
              onChange={(gradient) => onFormChange({ backgroundGradient: gradient })}
            />
            <p className="text-xs text-gray-500 mt-2">TEXT - CSS gradient string (auto-generated from builder)</p>
          </div>
        )}

        {/* Text Alignment - TEXT (enum) type */}
        <div>
          <label htmlFor="textAlignment" className="block text-sm font-medium text-gray-700 mb-2">
            Text Alignment (TEXT)
          </label>
          <select
            id="textAlignment"
            value={formData.textAlignment}
            onChange={(e) => onFormChange({ textAlignment: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            <option value="left">Left</option>
            <option value="center">Center</option>
            <option value="right">Right</option>
          </select>
          <p className="text-xs text-gray-500 mt-1">TEXT - Enum: &apos;left&apos;, &apos;center&apos;, &apos;right&apos;</p>
        </div>

        {/* Section Height - TEXT (enum) type */}
        <div>
          <label htmlFor="sectionHeight" className="block text-sm font-medium text-gray-700 mb-2">
            Section Height (TEXT)
          </label>
          <select
            id="sectionHeight"
            value={formData.sectionHeight}
            onChange={(e) => onFormChange({ sectionHeight: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            <option value="full">Full Screen</option>
            <option value="medium">Medium</option>
            <option value="small">Small</option>
            <option value="auto">Auto</option>
          </select>
          <p className="text-xs text-gray-500 mt-1">TEXT - Enum: &apos;full&apos;, &apos;medium&apos;, &apos;small&apos;, &apos;auto&apos;</p>
        </div>

        {/* Animation Type - TEXT (enum) type */}
        <div>
          <label htmlFor="animationType" className="block text-sm font-medium text-gray-700 mb-2">
            Animation Type (TEXT)
          </label>
          <select
            id="animationType"
            value={formData.animationType}
            onChange={(e) => onFormChange({ animationType: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            <option value="none">None</option>
            <option value="fade">Fade</option>
            <option value="slide">Slide</option>
            <option value="parallax">Parallax</option>
          </select>
          <p className="text-xs text-gray-500 mt-1">TEXT - Enum: &apos;none&apos;, &apos;fade&apos;, &apos;slide&apos;, &apos;parallax&apos;</p>
        </div>

        {/* Overlay Opacity - DECIMAL(3,2) type: 0.00 to 1.00 with 2 decimal places */}
        <div>
          <label htmlFor="overlayOpacity" className="block text-sm font-medium text-gray-700 mb-2">
            Overlay Opacity (0.00 - 1.00): {formData.overlayOpacity !== null && formData.overlayOpacity !== undefined ? formData.overlayOpacity.toFixed(2) : '0.50'}
          </label>
          <div className="flex gap-2 items-center">
            <input
              type="range"
              id="overlayOpacity"
              min="0"
              max="1"
              step="0.01"
              value={formData.overlayOpacity !== null && formData.overlayOpacity !== undefined ? formData.overlayOpacity : 0.5}
              onChange={(e) => {
                const value = parseFloat(e.target.value);
                // Round to 2 decimal places to match DECIMAL(3,2)
                const rounded = Math.round(value * 100) / 100;
                onFormChange({ overlayOpacity: rounded });
              }}
              className="flex-1"
            />
            <input
              type="number"
              min="0"
              max="1"
              step="0.01"
              value={formData.overlayOpacity !== null && formData.overlayOpacity !== undefined ? formData.overlayOpacity.toFixed(2) : '0.50'}
              onChange={(e) => {
                const value = parseFloat(e.target.value);
                if (!isNaN(value) && value >= 0 && value <= 1) {
                  const rounded = Math.round(value * 100) / 100;
                  onFormChange({ overlayOpacity: rounded });
                }
              }}
              className="w-20 px-2 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">DECIMAL(3,2) - Range: 0.00 to 1.00</p>
        </div>

        {/* Display Order - INTEGER type */}
        <div>
          <label htmlFor="displayOrder" className="block text-sm font-medium text-gray-700 mb-2">
            Display Order
          </label>
          <input
            type="number"
            id="displayOrder"
            min="0"
            step="1"
            value={formData.displayOrder !== null && formData.displayOrder !== undefined ? formData.displayOrder : 0}
            onChange={(e) => {
              const value = parseInt(e.target.value, 10);
              if (!isNaN(value) && value >= 0) {
                onFormChange({ displayOrder: value });
              } else if (e.target.value === '') {
                onFormChange({ displayOrder: 0 });
              }
            }}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          />
          <p className="text-xs text-gray-500 mt-1">INTEGER - Determines section order on page</p>
        </div>

        {/* Custom CSS - TEXT type */}
        <div>
          <label htmlFor="customCss" className="block text-sm font-medium text-gray-700 mb-2">
            Custom CSS (TEXT)
          </label>
          <textarea
            id="customCss"
            value={formData.customCss || ''}
            onChange={(e) => onFormChange({ customCss: e.target.value })}
            placeholder=".section { color: red; }"
            rows={4}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent font-mono text-sm"
          />
          <p className="text-xs text-gray-500 mt-1">TEXT - CSS code stored as text</p>
        </div>

        {/* Button 1 Configuration - TEXT type */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="button1Text" className="block text-sm font-medium text-gray-700 mb-2">
              Button 1 Text (TEXT)
            </label>
            <input
              type="text"
              id="button1Text"
              value={formData.button1Text}
              onChange={(e) => onFormChange({ button1Text: e.target.value })}
              placeholder="Explore Events"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">TEXT - Button label</p>
          </div>
          <div>
            <label htmlFor="button1Link" className="block text-sm font-medium text-gray-700 mb-2">
              Button 1 Link (TEXT)
            </label>
            <input
              type="url"
              id="button1Link"
              value={formData.button1Link}
              onChange={(e) => onFormChange({ button1Link: e.target.value })}
              placeholder="/events"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">TEXT - URL path or full URL</p>
          </div>
        </div>

        {/* Button 2 Configuration - TEXT type */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="button2Text" className="block text-sm font-medium text-gray-700 mb-2">
              Button 2 Text (TEXT)
            </label>
            <input
              type="text"
              id="button2Text"
              value={formData.button2Text}
              onChange={(e) => onFormChange({ button2Text: e.target.value })}
              placeholder="Learn More"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">TEXT - Button label</p>
          </div>
          <div>
            <label htmlFor="button2Link" className="block text-sm font-medium text-gray-700 mb-2">
              Button 2 Link (TEXT)
            </label>
            <input
              type="url"
              id="button2Link"
              value={formData.button2Link}
              onChange={(e) => onFormChange({ button2Link: e.target.value })}
              placeholder="/about"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">TEXT - URL path or full URL</p>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end gap-4 pt-4 border-t border-gray-200">
          <button
            onClick={onSave}
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
  );
}

