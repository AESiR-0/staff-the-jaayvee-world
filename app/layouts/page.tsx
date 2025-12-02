"use client";

import { useEffect, useState, useCallback } from "react";
import { authenticatedFetch } from "@/lib/auth-utils";
import { hasPermission } from "@/lib/rbac/actions";
import { SectionSidebar, SECTIONS, type SectionConfig } from "@/components/layouts/SectionSidebar";
import { LayoutForm } from "@/components/layouts/LayoutForm";
import { LayoutHeader } from "@/components/layouts/LayoutHeader";
import { MessageBanner } from "@/components/layouts/MessageBanner";
import { LayoutInfo } from "@/components/layouts/LayoutInfo";
import { LoadingState } from "@/components/layouts/LoadingState";
import { AccessDenied } from "@/components/layouts/AccessDenied";

interface LayoutData {
  id: string;
  name?: string;
  section?: string;
  pageName?: string;
  sectionName?: string;
  logoUrl: string | null;
  description: string | null;
  backgroundImageUrl: string | null;
  button1Text: string | null;
  button1Link: string | null;
  button2Text: string | null;
  button2Link: string | null;
  isVisible?: boolean;
  displayOrder?: number;
  settings?: any;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

type PageName = 'home' | 'event-detail';
type SectionName = 'hero' | 'events' | 'top-events' | 'about' | 'stats' | 'testimonials' | 'work-with-us' | 'marketing' | 'subscription-cta' | 'tickets';

export default function LayoutsPage() {
  const [selectedPage, setSelectedPage] = useState<PageName>('home');
  const [selectedSection, setSelectedSection] = useState<SectionName>('hero');
  const [layouts, setLayouts] = useState<LayoutData[]>([]);
  const [loading, setLoading] = useState(true);
  const [canManage, setCanManage] = useState(false);
  const [checkingPermission, setCheckingPermission] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // File upload state - files are stored but only uploaded on save
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [backgroundFile, setBackgroundFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [backgroundPreview, setBackgroundPreview] = useState<string | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    pageName: 'home' as PageName,
    sectionName: 'hero' as SectionName,
    logoUrl: '',
    description: '',
    backgroundImageUrl: '',
    backgroundType: 'image',
    backgroundColor: '',
    backgroundGradient: '',
    textAlignment: 'center',
    sectionHeight: 'full',
    animationType: 'fade',
    overlayOpacity: 0.5,
    customCss: '',
    displayOrder: 0,
    button1Text: 'Explore Events',
    button1Link: '/events',
    button2Text: 'Learn More',
    button2Link: '/about',
    isVisible: true,
  });

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://talaash.thejaayveeworld.com';

  const checkPermission = useCallback(async () => {
    try {
      setCheckingPermission(true);
      const hasAccess = await hasPermission('layouts', 'access');
      setCanManage(hasAccess);
    } catch (err) {
      console.error('Error checking permissions:', err);
      setCanManage(false);
    } finally {
      setCheckingPermission(false);
    }
  }, []);

  const fetchLayouts = useCallback(async (page: PageName, section: SectionName) => {
    try {
      setLoading(true);
      setError(null);
      console.log(`[Layouts] Fetching layout for page: ${page}, section: ${section}`);
      
      const response = await authenticatedFetch(`${API_BASE_URL}/api/layouts/sections?page=${page}&section=${section}`);
      
      console.log(`[Layouts] Response status: ${response.status}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('[Layouts] Error response:', errorData);
        throw new Error(errorData.error || `HTTP ${response.status}: Failed to fetch layouts`);
      }
      
      const result = await response.json();
      console.log('[Layouts] Response data:', result);
      
      if (result.success) {
        // Handle both array and single object responses
        let layoutData = null;
        if (Array.isArray(result.data)) {
          layoutData = result.data.length > 0 ? result.data[0] : null;
        } else if (result.data) {
          layoutData = result.data;
        }
        
        console.log('[Layouts] Layout data:', layoutData);
        setLayouts(layoutData ? [layoutData] : []);
        
        // Pre-fill form with existing layout data
        if (layoutData) {
          const settings = layoutData.settings || {};
          console.log('[Layouts] Settings:', settings);
          setFormData({
            pageName: layoutData.pageName || page,
            sectionName: layoutData.sectionName || section,
            logoUrl: layoutData.logoUrl || '',
            description: layoutData.description || '',
            backgroundImageUrl: layoutData.backgroundImageUrl || '',
            backgroundType: layoutData.backgroundType || settings.backgroundType || 'image',
            backgroundColor: layoutData.backgroundColor || settings.backgroundColor || '',
            backgroundGradient: layoutData.backgroundGradient || settings.backgroundGradient || '',
            textAlignment: layoutData.textAlignment || settings.textAlignment || 'center',
            sectionHeight: layoutData.sectionHeight || settings.sectionHeight || 'full',
            animationType: layoutData.animationType || settings.animationType || 'fade',
            overlayOpacity: layoutData.overlayOpacity ? parseFloat(String(layoutData.overlayOpacity)) : (settings.overlayOpacity || 0.5),
            customCss: layoutData.customCss || '',
            displayOrder: layoutData.displayOrder || 0,
            button1Text: layoutData.button1Text || 'Explore Events',
            button1Link: layoutData.button1Link || '/events',
            button2Text: layoutData.button2Text || 'Learn More',
            button2Link: layoutData.button2Link || '/about',
            isVisible: layoutData.isVisible !== false,
          });
          console.log('[Layouts] Form data updated with layout data');
        } else {
          console.log('[Layouts] No layout data found, using defaults');
          // Reset form for new section
          setFormData({
            pageName: page,
            sectionName: section,
            logoUrl: '',
            description: '',
            backgroundImageUrl: '',
            backgroundType: 'image',
            backgroundColor: '',
            backgroundGradient: '',
            textAlignment: 'center',
            sectionHeight: 'full',
            animationType: 'fade',
            overlayOpacity: 0.5,
            customCss: '',
            displayOrder: 0,
            button1Text: 'Explore Events',
            button1Link: '/events',
            button2Text: 'Learn More',
            button2Link: '/about',
            isVisible: true,
          });
        }
        
        // Clear file selections and previews when loading existing data
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
      } else {
        throw new Error(result.error || 'Failed to load layouts');
      }
    } catch (error: any) {
      console.error('[Layouts] Error fetching layouts:', error);
      setError(error.message || 'Failed to load layouts.');
    } finally {
      setLoading(false);
    }
  }, [API_BASE_URL, logoPreview, backgroundPreview]);

  useEffect(() => {
    checkPermission();
  }, [checkPermission]);

  useEffect(() => {
    if (canManage) {
      fetchLayouts(selectedPage, selectedSection);
    }
  }, [canManage, selectedPage, selectedSection]);

  const handleSectionSelect = (page: PageName, section: SectionName) => {
    setSelectedPage(page);
    setSelectedSection(section);
  };

  const handleLogoSelect = (file: File | null) => {
    setLogoFile(file);
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file');
        return;
      }
      // Create blob preview
      if (logoPreview) {
        URL.revokeObjectURL(logoPreview);
      }
      const newUrl = URL.createObjectURL(file);
      setLogoPreview(newUrl);
    } else {
      if (logoPreview) {
        URL.revokeObjectURL(logoPreview);
      }
      setLogoPreview(null);
    }
  };

  const handleBackgroundSelect = (file: File | null) => {
    setBackgroundFile(file);
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file');
        return;
      }
      // Create blob preview
      if (backgroundPreview) {
        URL.revokeObjectURL(backgroundPreview);
      }
      const newUrl = URL.createObjectURL(file);
      setBackgroundPreview(newUrl);
    } else {
      if (backgroundPreview) {
        URL.revokeObjectURL(backgroundPreview);
      }
      setBackgroundPreview(null);
    }
  };

  const handleRemoveLogo = () => {
    setLogoFile(null);
    if (logoPreview) {
      URL.revokeObjectURL(logoPreview);
    }
    setLogoPreview(null);
    setFormData({ ...formData, logoUrl: '' });
  };

  const handleRemoveBackground = () => {
    setBackgroundFile(null);
    if (backgroundPreview) {
      URL.revokeObjectURL(backgroundPreview);
    }
    setBackgroundPreview(null);
    setFormData({ ...formData, backgroundImageUrl: '' });
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setUploading(true);
      setError(null);
      setSuccess(null);

      let logoUrl = formData.logoUrl;
      let backgroundImageUrl = formData.backgroundImageUrl;

      // Upload logo if file is selected (only uploads on save)
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

      // Upload background image if file is selected (only uploads on save)
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

      const activeLayout = layouts.find(l => l.isActive);
      
      // Use JSONB settings for section-specific data
      const settings: any = {
        backgroundType: formData.backgroundType,
        backgroundColor: formData.backgroundColor,
        backgroundGradient: formData.backgroundGradient,
        textAlignment: formData.textAlignment,
        sectionHeight: formData.sectionHeight,
        animationType: formData.animationType,
        overlayOpacity: formData.overlayOpacity,
      };

      const layoutPayload: any = {
        pageName: formData.pageName,
        sectionName: formData.sectionName,
        // Also include old format for backward compatibility
        name: `${formData.pageName}-${formData.sectionName}`,
        section: formData.sectionName,
        logoUrl: logoUrl || null,
        description: formData.description || null,
        backgroundImageUrl: backgroundImageUrl || null,
        backgroundType: formData.backgroundType,
        backgroundColor: formData.backgroundColor || null,
        backgroundGradient: formData.backgroundGradient || null,
        textAlignment: formData.textAlignment,
        sectionHeight: formData.sectionHeight,
        animationType: formData.animationType,
        overlayOpacity: formData.overlayOpacity,
        customCss: formData.customCss || null,
        displayOrder: formData.displayOrder,
        button1Text: formData.button1Text || null,
        button1Link: formData.button1Link || null,
        button2Text: formData.button2Text || null,
        button2Link: formData.button2Link || null,
        isVisible: formData.isVisible,
        isActive: true,
        settings: settings, // Store section-specific settings in JSONB
      };

      if (activeLayout) {
        // Update existing layout
        const response = await authenticatedFetch(`${API_BASE_URL}/api/layouts`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            id: activeLayout.id,
            ...layoutPayload,
          }),
        });

        if (!response.ok) {
          const result = await response.json();
          throw new Error(result.error || 'Failed to update layout');
        }

        setSuccess('Layout updated successfully!');
        
        // Trigger layout update event for homepage refresh
        if (typeof window !== 'undefined') {
          // Dispatch custom event for same-tab refresh
          window.dispatchEvent(new Event('layout-updated'));
          // Also set localStorage for cross-tab refresh
          localStorage.setItem('layout-updated', Date.now().toString());
        }
      } else {
        // Create new layout
        const response = await authenticatedFetch(`${API_BASE_URL}/api/layouts`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(layoutPayload),
        });

        if (!response.ok) {
          const result = await response.json();
          throw new Error(result.error || 'Failed to create layout');
        }

        setSuccess('Layout created successfully!');
        
        // Trigger layout update event for homepage refresh
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('layout-updated'));
          localStorage.setItem('layout-updated', Date.now().toString());
        }
      }

      // Clear file selections after successful save
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
      await fetchLayouts(selectedPage, selectedSection);
      
      setTimeout(() => setSuccess(null), 3000);
    } catch (error: any) {
      console.error('Error saving layout:', error);
      setError(error.message || 'Failed to save layout');
      setUploading(false);
    } finally {
      setSaving(false);
    }
  };

  if (checkingPermission || loading) {
    return <LoadingState message={checkingPermission ? 'Checking permissions...' : 'Loading layouts...'} />;
  }

  if (!canManage) {
    return <AccessDenied />;
  }

  const activeLayout = layouts.find(l => l.isActive);
  const currentSection = SECTIONS.find(s => s.name === selectedSection && s.page === selectedPage);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex h-screen">
        {/* Sidebar */}
        <SectionSidebar
          selectedPage={selectedPage}
          selectedSection={selectedSection}
          onSectionSelect={handleSectionSelect}
        />

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <LayoutHeader currentSection={currentSection} selectedPage={selectedPage} />

            {/* Messages */}
            {error && <MessageBanner type="error" message={error} onDismiss={() => setError(null)} />}
            {success && <MessageBanner type="success" message={success} onDismiss={() => setSuccess(null)} />}

            {/* Form */}
            <LayoutForm
              currentSection={currentSection}
              formData={formData}
              logoFile={logoFile}
              backgroundFile={backgroundFile}
              logoPreview={logoPreview}
              backgroundPreview={backgroundPreview}
              saving={saving}
              uploading={uploading}
              activeLayout={!!activeLayout}
              onFormChange={(data) => {
                const updatedData: any = { ...data };
                // Ensure sectionName is properly typed if provided
                if (updatedData.sectionName && typeof updatedData.sectionName === 'string') {
                  updatedData.sectionName = updatedData.sectionName as SectionName;
                }
                setFormData({ ...formData, ...updatedData });
              }}
              onLogoSelect={handleLogoSelect}
              onBackgroundSelect={handleBackgroundSelect}
              onRemoveLogo={handleRemoveLogo}
              onRemoveBackground={handleRemoveBackground}
              onSave={handleSave}
            />

            {/* Current Layout Info */}
            {activeLayout && (
              <LayoutInfo createdAt={activeLayout.createdAt} updatedAt={activeLayout.updatedAt} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
