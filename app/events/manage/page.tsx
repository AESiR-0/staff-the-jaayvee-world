"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, Edit, Trash2, Save, X, AlertCircle, CheckCircle, Upload, Image as ImageIcon, Search, Filter, ChevronDown, ChevronUp, FileText, Download, Loader2, Calendar, Send, Eye, EyeOff } from "lucide-react";
import { authenticatedFetch, getTeamSession, getAuthToken } from "@/lib/auth-utils";
import { utcToDateTimeLocal } from "@/lib/utils/timezone";
import { CategoryCombobox } from "@/components/CategoryCombobox";

// This page requires 'events' resource access or super admin

// Indian states and union territories
const INDIAN_STATES = [
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chhattisgarh',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
  'Andaman and Nicobar Islands',
  'Chandigarh',
  'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi',
  'Jammu and Kashmir',
  'Ladakh',
  'Lakshadweep',
  'Puducherry'
].sort();

interface Event {
  id: string;
  title: string;
  description: string | null;
  startDate: string;
  endDate: string | null;
  banner: string | null;
  thumbnail: string | null;
  category: string | null;
  venue: string | null;
  city: string | null;
  state: string | null;
  slug: string | null;
  published: boolean;
  status: string;
  scheduledPublishAt?: string | null;
  publishedAt?: string | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function ManageEventsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [events, setEvents] = useState<Event[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Event>>({});
  const [editTicketTypes, setEditTicketTypes] = useState<Array<{ id?: string; name: string; price: number; quantity: number; description?: string }>>([]);
  const [originalTicketTypes, setOriginalTicketTypes] = useState<Array<{ id: string; name: string; price: number; quantity: number; description?: string }>>([]);
  const [loadingTicketTypes, setLoadingTicketTypes] = useState(false);
  const [editSubscriberLimitsEnabled, setEditSubscriberLimitsEnabled] = useState(false);
  const [editSubscriberLimits, setEditSubscriberLimits] = useState({
    premium: 0,
    diamond: 0,
    exclusiveBlack: 0,
    student: 0,
  });
  const [originalBanner, setOriginalBanner] = useState<string | null>(null); // Track original banner URL for deletion
  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState({
    title: "",
    description: "",
    startDate: "",
    endDate: "",
    banner: "",
    thumbnail: "",
    category: "",
    venue: "",
    city: "",
    state: "",
    slug: "",
    published: false,
    status: "draft",
    ticketTypes: [] as Array<{ name: string; price: number; quantity: number; description?: string }>,
    subscriberLimitsEnabled: false,
    subscriberLimits: {
      premium: 0,
      diamond: 0,
      exclusiveBlack: 0,
      student: 0,
    },
    selectedTemplateId: "",
  });
  const [templates, setTemplates] = useState<any[]>([]);
  const [showTemplateCustomization, setShowTemplateCustomization] = useState(false);
  const [templateCustomizations, setTemplateCustomizations] = useState<any>({});
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [updatingTicketTypes, setUpdatingTicketTypes] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null); // Store selected file for create form
  const [selectedEditFile, setSelectedEditFile] = useState<File | null>(null); // Store selected file for edit form
  const [selectedThumbnailFile, setSelectedThumbnailFile] = useState<File | null>(null); // Store selected thumbnail file for create form
  const [selectedEditThumbnailFile, setSelectedEditThumbnailFile] = useState<File | null>(null); // Store selected thumbnail file for edit form
  const [previewUrl, setPreviewUrl] = useState<string | null>(null); // Preview URL for create form
  const [previewEditUrl, setPreviewEditUrl] = useState<string | null>(null); // Preview URL for edit form
  const [previewThumbnailUrl, setPreviewThumbnailUrl] = useState<string | null>(null); // Preview URL for thumbnail create form
  const [previewEditThumbnailUrl, setPreviewEditThumbnailUrl] = useState<string | null>(null); // Preview URL for thumbnail edit form
  const [availableCategories, setAvailableCategories] = useState<string[]>([]); // Available categories from events and global list
  const [shareMessages, setShareMessages] = useState<Record<string, { id?: string; message: string; platform: string | null }>>({
    general: { message: '', platform: null },
    whatsapp: { message: '', platform: 'whatsapp' },
    facebook: { message: '', platform: 'facebook' },
    linkedin: { message: '', platform: 'linkedin' },
  });
  const [loadingShareMessages, setLoadingShareMessages] = useState(false);
  const [savingShareMessages, setSavingShareMessages] = useState(false);
  const [searchQuery, setSearchQuery] = useState<string>(""); // Search query
  const [filterStatus, setFilterStatus] = useState<string>("all"); // Filter by status
  const [filterPublished, setFilterPublished] = useState<string>("all"); // Filter by published status
  const [publishingId, setPublishingId] = useState<string | null>(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleEventId, setScheduleEventId] = useState<string | null>(null);
  const [scheduledPublishTime, setScheduledPublishTime] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);
  const thumbnailInputRef = useRef<HTMLInputElement>(null);
  const editThumbnailInputRef = useRef<HTMLInputElement>(null);
  const csvInputRef = useRef<HTMLInputElement>(null);

  // Use relative path for same-origin requests, or API_BASE_URL if set
  // Default to talaash API if not set (ticket type APIs are in jaayvee-world/talaash)
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://talaash.thejaayveeworld.com';

  // Load available categories from database
  useEffect(() => {
    const loadCategories = () => {
      const eventCategories = new Set<string>();
      events.forEach(event => {
        if (event.category) {
          eventCategories.add(event.category);
        }
      });
      const allCategories = Array.from(eventCategories).sort();
      setAvailableCategories(allCategories);
    };
    loadCategories();
  }, [events]);

  // Cleanup preview URLs on unmount
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      if (previewEditUrl) {
        URL.revokeObjectURL(previewEditUrl);
      }
      if (previewThumbnailUrl) {
        URL.revokeObjectURL(previewThumbnailUrl);
      }
      if (previewEditThumbnailUrl) {
        URL.revokeObjectURL(previewEditThumbnailUrl);
      }
    };
  }, [previewUrl, previewEditUrl, previewThumbnailUrl, previewEditThumbnailUrl]);

  useEffect(() => {
    // Check if user is authorized
    const checkAuthorization = async () => {
      try {
        const session = getTeamSession();
        const userEmail = session?.email;
        
        if (!userEmail) {
          router.push("/login");
          return;
        }

        const token = getAuthToken();
        if (!token) {
          router.push("/login");
          return;
        }

        // Use centralized permission check
        const { checkHasAccessClient } = require('@/lib/permissions');
        const result = await checkHasAccessClient(userEmail, 'events', token);

        if (result.hasAccess) {
          setAuthorized(true);
          fetchEvents();
          fetchTemplates();
        } else {
          console.log("Unauthorized access attempt by:", userEmail);
          router.push("/dashboard");
        }
      } catch (err) {
        console.error("Authorization check failed:", err);
        router.push("/login");
      } finally {
        setLoading(false);
      }
    };

    checkAuthorization();
  }, [router]);

  const fetchEvents = async () => {
    try {
      // Fetch all events (published and unpublished) for admin
      const response = await authenticatedFetch(`${API_BASE_URL}/api/events?all=true`);
      if (response.ok) {
        const data = await response.json();
        // API returns { success: true, data: [...] }
        const eventsList = Array.isArray(data) ? data : (data.data || []);
        setEvents(eventsList);
      }
    } catch (err: any) {
      console.error("Failed to fetch events:", err);
      setError("Failed to fetch events");
    }
  };

  const fetchTemplates = async () => {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/api/team/event-templates`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setTemplates(data.data || []);
        }
      }
    } catch (err: any) {
      console.error("Failed to fetch templates:", err);
      // Don't set error state for templates as it's optional
    }
  };

  // Filter and search events
  const filteredEvents = useMemo(() => {
    return events.filter(event => {
      // Search filter - search in title, description, venue, and city
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesSearch = 
          event.title.toLowerCase().includes(query) ||
          event.description?.toLowerCase().includes(query) ||
          event.venue?.toLowerCase().includes(query) ||
          event.city?.toLowerCase().includes(query) ||
          event.slug?.toLowerCase().includes(query);
        if (!matchesSearch) return false;
      }

      // Status filter
      if (filterStatus !== "all" && event.status !== filterStatus) {
        return false;
      }

      // Published filter
      if (filterPublished !== "all") {
        const isPublished = filterPublished === "published";
        if (event.published !== isPublished) {
          return false;
        }
      }

      return true;
    });
  }, [events, searchQuery, filterStatus, filterPublished]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSubmitting(true);
    setUploadingImage(true);
    setUploadProgress('Uploading image...');

    try {
      let bannerUrl = createForm.banner || null;
      let thumbnailUrl = createForm.thumbnail || null;

      // Upload banner image if a file was selected
      if (selectedFile) {
        try {
          bannerUrl = await uploadImageFile(selectedFile);
          setUploadProgress('Banner image uploaded successfully!');
        } catch (err: any) {
          console.error('Banner image upload error:', err);
          setError(err.message || 'Failed to upload banner image');
          setUploadingImage(false);
          setUploadProgress(null);
          setSubmitting(false);
          return;
        }
      }

      // Upload thumbnail image if a file was selected
      if (selectedThumbnailFile) {
        try {
          setUploadProgress('Uploading thumbnail image...');
          thumbnailUrl = await uploadImageFile(selectedThumbnailFile);
          setUploadProgress('Thumbnail image uploaded successfully!');
        } catch (err: any) {
          console.error('Thumbnail image upload error:', err);
          setError(err.message || 'Failed to upload thumbnail image');
          setUploadingImage(false);
          setUploadProgress(null);
          setSubmitting(false);
          return;
        }
      }

      setUploadProgress('Creating event...');

      // Prepare attributes with subscriber limits if enabled
      const attributes: any = {};
      attributes.subscriberLimitsEnabled = createForm.subscriberLimitsEnabled;
      if (createForm.subscriberLimitsEnabled) {
        attributes.subscriberLimits = {
          premium: createForm.subscriberLimits.premium || 0,
          diamond: createForm.subscriberLimits.diamond || 0,
          exclusiveBlack: createForm.subscriberLimits.exclusiveBlack || 0,
          student: createForm.subscriberLimits.student || 0,
        };
      }

      const response = await authenticatedFetch(`${API_BASE_URL}/api/events`, {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: createForm.title,
          description: createForm.description || null,
          startDate: createForm.startDate,
          endDate: createForm.endDate || null,
          banner: bannerUrl,
          thumbnail: thumbnailUrl,
          category: createForm.category || null,
          venue: createForm.venue || null,
          city: createForm.city || null,
          state: createForm.state || null,
          slug: createForm.slug || null,
          published: createForm.published,
          status: createForm.status,
          ticketTypes: createForm.ticketTypes.length > 0 ? createForm.ticketTypes : undefined,
          attributes: Object.keys(attributes).length > 0 ? attributes : undefined,
          // ventureId will be auto-detected from Talaash venture
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to create event");
      }

      const createdEventId = data.data?.id;
      
      // Create ticket types if provided
      if (createForm.ticketTypes && createForm.ticketTypes.length > 0 && createdEventId) {
        try {
          setUploadProgress('Creating ticket types...');
          console.log('🎫 Creating ticket types for event:', createdEventId, createForm.ticketTypes);
          
          const ticketTypesData = createForm.ticketTypes.map(tt => ({
            name: tt.name,
            // Round price to 2 decimal places to avoid floating point precision issues
            price: Math.round((tt.price || 0) * 100) / 100,
            capacity: tt.quantity,
            admissionCount: 1,
            attributes: tt.description ? { description: tt.description } : null
          }));
          
          const ticketsResponse = await authenticatedFetch(`${API_BASE_URL}/api/events/${createdEventId}/tickets`, {
            method: "POST",
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              ticketTypes: ticketTypesData,
              generateTickets: false // Don't generate individual tickets, just create ticket types
            }),
          });
          
          const ticketsData = await ticketsResponse.json();
          
          if (!ticketsResponse.ok || !ticketsData.success) {
            console.error('Failed to create ticket types:', ticketsData);
            setError(`Event created but failed to add ticket types: ${ticketsData.error || 'Unknown error'}`);
          } else {
            console.log('✅ Ticket types created successfully:', ticketsData);
            setSuccess(`Event created successfully with ${createForm.ticketTypes.length} ticket type(s)!`);
          }
        } catch (ticketErr: any) {
          console.error('Error creating ticket types:', ticketErr);
          setError(`Event created but failed to add ticket types: ${ticketErr.message || 'Unknown error'}`);
        }
      } else {
      setSuccess("Event created successfully!");
      }
      
      // Apply template if selected
      if (createForm.selectedTemplateId && createdEventId) {
        try {
          setUploadProgress('Applying template...');
          const templateResponse = await authenticatedFetch(`${API_BASE_URL}/api/team/events/apply-template`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              eventId: createdEventId,
              templateId: createForm.selectedTemplateId,
              customizations: templateCustomizations,
            }),
          });
          
          if (templateResponse.ok) {
            const templateData = await templateResponse.json();
            if (templateData.success) {
              setSuccess(`Event created and template applied! ${templateData.data.tasksCreated} task(s) created.`);
            }
          }
        } catch (templateErr) {
          console.error('Error applying template:', templateErr);
          // Don't fail the event creation if template application fails
        }
      }
      
      // Clean up preview URLs
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      if (previewThumbnailUrl) {
        URL.revokeObjectURL(previewThumbnailUrl);
      }
      
      setCreateForm({
        title: "",
        description: "",
        startDate: "",
        endDate: "",
        banner: "",
        thumbnail: "",
        category: "",
        venue: "",
        city: "",
        state: "",
        slug: "",
        published: false,
        status: "upcoming",
        ticketTypes: [],
        subscriberLimitsEnabled: false,
        subscriberLimits: {
          premium: 0,
          diamond: 0,
          exclusiveBlack: 0,
          student: 0,
        },
        selectedTemplateId: "",
      });
      setSelectedFile(null);
      setSelectedThumbnailFile(null);
      setPreviewUrl(null);
      setPreviewThumbnailUrl(null);
      setTemplateCustomizations({});
      setShowTemplateCustomization(false);
      setCreating(false);
      fetchEvents();
      setTimeout(() => {
        setSuccess(null);
        setUploadProgress(null);
      }, 5000);
    } catch (err: any) {
      console.error("Error creating event:", err);
      setError(err.message || "Failed to create event");
      setUploadProgress(null);
    } finally {
      setUploadingImage(false);
      setSubmitting(false);
    }
  };

  const deleteImage = async (imageUrl: string) => {
    try {
      const token = getAuthToken();
      const response = await fetch(`${API_BASE_URL}/api/upload?url=${encodeURIComponent(imageUrl)}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        console.warn('Failed to delete image:', data.error);
        // Don't throw error - image deletion failure shouldn't block event update
      }
    } catch (err: any) {
      console.warn('Error deleting image:', err);
      // Don't throw error - image deletion failure shouldn't block event update
    }
  };

  const handleUpdate = async (id: string) => {
    setError(null);
    setSuccess(null);
    setUpdatingId(id);
    setUploadingImage(true);
    setUploadProgress('Processing...');

    try {
      let bannerUrl = editForm.banner || null;
      let thumbnailUrl = editForm.thumbnail || null;
      const originalThumbnail = editForm.thumbnail || null;

      // Upload new banner image if a file was selected
      if (selectedEditFile) {
        try {
          setUploadProgress('Uploading new banner image...');
          bannerUrl = await uploadImageFile(selectedEditFile);
          
          // Delete old image if it exists and is a Supabase URL
          if (originalBanner && originalBanner.trim() !== '' && originalBanner.includes('supabase.co/storage')) {
            await deleteImage(originalBanner);
          }
          
          setUploadProgress('Banner image uploaded successfully!');
        } catch (err: any) {
          console.error('Banner image upload error:', err);
          setError(err.message || 'Failed to upload banner image');
          setUploadingImage(false);
          setUploadProgress(null);
          return;
        }
      } else {
        // Check if banner was removed (had a value, now empty)
        const bannerWasRemoved = originalBanner && originalBanner.trim() !== '' && (!editForm.banner || editForm.banner.trim() === '');
        
        // Delete the old image if it was removed
        if (bannerWasRemoved) {
          // Only delete if it's a Supabase storage URL (to avoid deleting external URLs)
          if (originalBanner && originalBanner.includes('supabase.co/storage')) {
            setUploadProgress('Removing old banner image...');
            await deleteImage(originalBanner);
          }
        }
      }

      // Upload new thumbnail image if a file was selected
      if (selectedEditThumbnailFile) {
        try {
          setUploadProgress('Uploading new thumbnail image...');
          thumbnailUrl = await uploadImageFile(selectedEditThumbnailFile);
          
          // Delete old thumbnail if it exists and is a Supabase URL
          if (originalThumbnail && originalThumbnail.trim() !== '' && originalThumbnail.includes('supabase.co/storage')) {
            await deleteImage(originalThumbnail);
          }
          
          setUploadProgress('Thumbnail image uploaded successfully!');
        } catch (err: any) {
          console.error('Thumbnail image upload error:', err);
          setError(err.message || 'Failed to upload thumbnail image');
          setUploadingImage(false);
          setUploadProgress(null);
          return;
        }
      } else {
        // Check if thumbnail was removed
        const thumbnailWasRemoved = originalThumbnail && originalThumbnail.trim() !== '' && (!editForm.thumbnail || editForm.thumbnail.trim() === '');
        
        if (thumbnailWasRemoved && originalThumbnail.includes('supabase.co/storage')) {
          setUploadProgress('Removing old thumbnail image...');
          await deleteImage(originalThumbnail);
        }
      }

      setUploadProgress('Updating event...');

      // Prepare attributes with subscriber limits if enabled
      const attributes: any = {};
      attributes.subscriberLimitsEnabled = editSubscriberLimitsEnabled;
      if (editSubscriberLimitsEnabled) {
        attributes.subscriberLimits = {
          premium: editSubscriberLimits.premium || 0,
          diamond: editSubscriberLimits.diamond || 0,
          exclusiveBlack: editSubscriberLimits.exclusiveBlack || 0,
          student: editSubscriberLimits.student || 0,
        };
      }

      // Use relative path to hit proxy route (avoids CORS issues)
      const eventUpdateUrl = API_BASE_URL ? `${API_BASE_URL}/api/events/${id}` : `/api/events/${id}`;
      const response = await authenticatedFetch(eventUpdateUrl, {
        method: "PUT",
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...editForm,
          banner: bannerUrl,
          thumbnail: thumbnailUrl,
          attributes: Object.keys(attributes).length > 0 ? attributes : undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to update event");
      }

      // Update ticket types - consolidated into single batch operation
      // NOTE: Ticket type APIs are ONLY called here on Save button click, not on every action
      // All ticket type modifications (add/remove/edit) only update local state until Save is clicked
      setUpdatingTicketTypes(id);
      setUploadProgress('Updating ticket types...');
      try {
        // Prepare all ticket type operations in a single batch
        // Strategy: Delete removed ones, then send all current ticket types (updated + new) to tickets endpoint
        // This avoids CORS issues with individual PATCH requests
        
        // 1. Delete removed ticket types
        const deletedTicketTypes = originalTicketTypes.filter(
          original => !editTicketTypes.some(current => current.id === original.id)
        );

        const deletePromises = deletedTicketTypes.map(async (deletedType) => {
          try {
            const deleteUrl = API_BASE_URL ? `${API_BASE_URL}/api/ticket-types/${deletedType.id}` : `/api/ticket-types/${deletedType.id}`;
            const deleteRes = await authenticatedFetch(deleteUrl, {
              method: "DELETE",
            });
            if (!deleteRes.ok) {
              console.warn(`Failed to delete ticket type ${deletedType.id}`);
              return { success: false, name: deletedType.name, error: `HTTP ${deleteRes.status}` };
            }
            return { success: true, name: deletedType.name };
          } catch (deleteErr: any) {
            console.error(`Error deleting ticket type ${deletedType.id}:`, deleteErr);
            return { success: false, name: deletedType.name, error: deleteErr.message || 'Delete failed' };
        }
        });

        // Wait for all deletions to complete
        const deleteResults = await Promise.allSettled(deletePromises);
        const deleteErrors: string[] = [];
        deleteResults.forEach((result) => {
          if (result.status === 'fulfilled' && !result.value.success) {
            deleteErrors.push(`${result.value.name}: ${result.value.error}`);
          } else if (result.status === 'rejected') {
            deleteErrors.push(`Delete failed: ${result.reason?.message || 'Unknown error'}`);
          }
        });

        // 2. Prepare all current ticket types (both existing and new) for batch update
        // For existing ticket types, we'll delete and recreate them to avoid PATCH CORS issues
        // For new ticket types, we'll create them
        const allTicketTypesData = editTicketTypes.map(tt => ({
          name: tt.name,
          // Round price to 2 decimal places to avoid floating point precision issues
          price: Math.round((tt.price || 0) * 100) / 100,
          capacity: tt.quantity,
          admissionCount: 1,
          attributes: tt.description ? { description: tt.description } : null
        }));

        // 3. Delete all existing ticket types that need updating (to recreate them)
        const existingTicketTypes = editTicketTypes.filter(tt => tt.id);
        const deleteExistingPromises = existingTicketTypes.map(async (ticketType) => {
            try {
            const deleteUrl = API_BASE_URL ? `${API_BASE_URL}/api/ticket-types/${ticketType.id}` : `/api/ticket-types/${ticketType.id}`;
            const deleteRes = await authenticatedFetch(deleteUrl, {
              method: "DELETE",
              });
            if (!deleteRes.ok) {
              console.warn(`Failed to delete existing ticket type ${ticketType.id} for update`);
              return { success: false, name: ticketType.name, error: `HTTP ${deleteRes.status}` };
              }
            return { success: true, name: ticketType.name };
          } catch (deleteErr: any) {
            console.error(`Error deleting existing ticket type ${ticketType.id}:`, deleteErr);
            return { success: false, name: ticketType.name, error: deleteErr.message || 'Delete failed' };
            }
          });

        // Wait for existing ticket type deletions
        const deleteExistingResults = await Promise.allSettled(deleteExistingPromises);
        const deleteExistingErrors: string[] = [];
        deleteExistingResults.forEach((result) => {
            if (result.status === 'fulfilled' && !result.value.success) {
            deleteExistingErrors.push(`${result.value.name}: ${result.value.error}`);
            } else if (result.status === 'rejected') {
            deleteExistingErrors.push(`Delete failed: ${result.reason?.message || 'Unknown error'}`);
            }
          });

        // 4. Create all ticket types in one batch (both updated and new)
        let createError: string | null = null;
        if (allTicketTypesData.length > 0) {
          try {
            const createUrl = API_BASE_URL ? `${API_BASE_URL}/api/events/${id}/tickets` : `/api/events/${id}/tickets`;
            const createRes = await authenticatedFetch(createUrl, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                ticketTypes: allTicketTypesData,
                generateTickets: false
              }),
            });

            if (!createRes.ok) {
              const errorData = await createRes.json().catch(() => ({}));
              const errorMsg = errorData.error || errorData.details || `HTTP ${createRes.status}`;
              createError = `Failed to create ticket types: ${errorMsg}`;
              
              // If partial success, show warnings
              if (errorData.warnings && Array.isArray(errorData.warnings)) {
                createError += `\n${errorData.warnings.join('\n')}`;
              }
            } else {
              console.log(`✅ Successfully created/updated ${allTicketTypesData.length} ticket type(s)`);
            }
          } catch (createErr: any) {
            console.error("Error creating ticket types:", createErr);
            createError = `Failed to create ticket types: ${createErr.message || 'Unknown error'}`;
          }
        }

        // 5. Collect all errors
        const allErrors = [...deleteErrors, ...deleteExistingErrors];
        if (createError) {
          allErrors.push(createError);
        }

        // 6. Display errors if any occurred
        if (allErrors.length > 0) {
          // Check if errors are network/CORS related (might be false positives if API actually succeeded)
          const networkErrors = allErrors.filter(err => 
            err.includes('Failed to fetch') || 
            err.includes('Network error') || 
            err.includes('CORS')
          );
          
          // If all errors are network-related, they might be false positives
          if (networkErrors.length === allErrors.length && networkErrors.length > 0) {
            console.warn('⚠️ All ticket type update errors are network-related. The updates may have actually succeeded. Please verify in the event details.');
            const errorMessage = `Network errors occurred during ticket type updates, but they may have succeeded:\n${allErrors.join('\n')}\n\nPlease check the event details to verify if ticket types were actually updated.`;
            setError(errorMessage);
            setTimeout(() => setError(null), 15000);
          } else {
            // Real errors (not just network issues)
          const errorMessage = `Some ticket types failed to update:\n${allErrors.join('\n')}`;
          console.warn(errorMessage);
          setError(errorMessage);
          setTimeout(() => setError(null), 10000);
          }
        } else {
          console.log('✅ All ticket types updated successfully');
        }
      } catch (ticketErr) {
        console.error("Error updating ticket types:", ticketErr);
        setError(`Failed to update ticket types: ${ticketErr instanceof Error ? ticketErr.message : 'Unknown error'}`);
        setTimeout(() => setError(null), 10000);
      }

      setSuccess("Event updated successfully!");
      
      // Clean up preview URLs
      if (previewEditUrl) {
        URL.revokeObjectURL(previewEditUrl);
      }
      
      setEditingId(null);
      setEditForm({});
      setEditTicketTypes([]);
      setOriginalTicketTypes([]);
      setOriginalBanner(null);
      setSelectedEditFile(null);
      setPreviewEditUrl(null);
      fetchEvents();
      setTimeout(() => {
        setSuccess(null);
        setUploadProgress(null);
      }, 3000);
    } catch (err: any) {
      console.error("Error updating event:", err);
      setError(err.message || "Failed to update event");
      setUploadProgress(null);
    } finally {
      setUploadingImage(false);
      setUpdatingId(null);
      setUpdatingTicketTypes(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this event? This action cannot be undone.")) {
      return;
    }

    setDeletingId(id);
    setError(null);
    setSuccess(null);

    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/api/events/${id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to delete event");
      }

      setSuccess("Event deleted successfully!");
      fetchEvents();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error("Error deleting event:", err);
      setError(err.message || "Failed to delete event");
    } finally {
      setDeletingId(null);
    }
  };

  const handlePublish = async (eventId: string, scheduledPublishAt?: string) => {
    setPublishingId(eventId);
    setError(null);
    setSuccess(null);

    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/api/events/${eventId}/publish`, {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          scheduledPublishAt: scheduledPublishAt || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to publish event");
      }

      setSuccess(scheduledPublishAt ? `Event scheduled to publish at ${new Date(scheduledPublishAt).toLocaleString()}` : "Event published successfully!");
      fetchEvents();
      setTimeout(() => setSuccess(null), 5000);
      setShowScheduleModal(false);
      setScheduleEventId(null);
      setScheduledPublishTime("");
    } catch (err: any) {
      console.error("Error publishing event:", err);
      setError(err.message || "Failed to publish event");
    } finally {
      setPublishingId(null);
    }
  };

  const handleUnpublish = async (eventId: string) => {
    if (!confirm("Are you sure you want to unpublish this event? It will no longer be visible to users.")) return;
    setPublishingId(eventId);
    setError(null);
    setSuccess(null);

    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/api/events/${eventId}/publish`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to unpublish event");
      }

      setSuccess("Event unpublished and set to draft");
      fetchEvents();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error("Error unpublishing event:", err);
      setError(err.message || "Failed to unpublish event");
    } finally {
      setPublishingId(null);
    }
  };

  const openScheduleModal = (eventId: string) => {
    setScheduleEventId(eventId);
    setScheduledPublishTime("");
    setShowScheduleModal(true);
  };

  const startEdit = async (event: Event) => {
    setEditingId(event.id);
    setOriginalBanner(event.banner || null); // Store original banner URL
    setSelectedEditFile(null); // Clear any selected file
    setPreviewEditUrl(null); // Clear preview
    
    // Clean up any existing preview URL
    if (previewEditUrl) {
      URL.revokeObjectURL(previewEditUrl);
    }
    
    setEditForm({
      title: event.title,
      description: event.description || "",
      startDate: utcToDateTimeLocal(event.startDate),
      endDate: utcToDateTimeLocal(event.endDate),
      banner: event.banner || "",
      venue: event.venue || "",
      city: event.city || "",
      state: event.state || "",
      slug: event.slug || "",
      published: event.published,
      status: event.status
    });

    // Load subscriber limits from event attributes
    const eventWithAttrs = event as any;
    if (eventWithAttrs.attributes?.subscriberLimits) {
      const limits = eventWithAttrs.attributes.subscriberLimits;
      // If subscriberLimits exists, it means limits are enabled
      setEditSubscriberLimitsEnabled(true);
      setEditSubscriberLimits({
        premium: limits.premium || 0,
        diamond: limits.diamond || 0,
        exclusiveBlack: limits.exclusiveBlack || 0,
        student: limits.student || 0,
      });
    } else {
      setEditSubscriberLimitsEnabled(false);
      setEditSubscriberLimits({
        premium: 0,
        diamond: 0,
        exclusiveBlack: 0,
        student: 0,
      });
    }

    // Fetch existing ticket types
    setLoadingTicketTypes(true);
    try {
      const ticketsRes = await authenticatedFetch(`${API_BASE_URL}/api/events/${event.id}/tickets`);
      if (ticketsRes.ok) {
        const ticketsData = await ticketsRes.json();
        console.log('🎫 Fetched ticket types for event:', event.id, ticketsData);
        if (ticketsData.success && ticketsData.data?.ticketTypes) {
          const ticketTypes = ticketsData.data.ticketTypes.map((tt: any) => ({
            id: tt.id,
            name: tt.name,
            price: tt.price,
            quantity: tt.capacity,
            description: tt.attributes?.description || ""
          }));
          console.log('✅ Parsed ticket types:', ticketTypes);
          setEditTicketTypes(ticketTypes);
          // Store original ticket types for comparison
          setOriginalTicketTypes(ticketTypes.map((tt: any) => ({ ...tt })));
        } else {
          console.warn('⚠️ No ticket types found in response:', ticketsData);
          setEditTicketTypes([]);
          setOriginalTicketTypes([]);
        }
      } else {
        console.error('❌ Failed to fetch ticket types, status:', ticketsRes.status);
        setEditTicketTypes([]);
      }
    } catch (err) {
      console.error("Error fetching ticket types:", err);
      setEditTicketTypes([]);
    } finally {
      setLoadingTicketTypes(false);
      // Log final state
      setTimeout(() => {
        console.log('📋 Final editTicketTypes state:', editTicketTypes);
      }, 100);
    }

    // Fetch existing share messages
    setLoadingShareMessages(true);
    try {
      const platforms = ['whatsapp', 'facebook', 'linkedin', null];
      const messages: Record<string, { id?: string; message: string; platform: string | null }> = {
        general: { message: '', platform: null },
        whatsapp: { message: '', platform: 'whatsapp' },
        facebook: { message: '', platform: 'facebook' },
        linkedin: { message: '', platform: 'linkedin' },
      };

      for (const platform of platforms) {
        try {
          const url = platform 
            ? `${API_BASE_URL}/api/events/${event.id}/share-messages?platform=${platform}`
            : `${API_BASE_URL}/api/events/${event.id}/share-messages`;
          
          const response = await authenticatedFetch(url);
          const data = await response.json();
          
          if (data.success && data.data?.message) {
            const key = platform || 'general';
            messages[key] = {
              id: data.data.id,
              message: data.data.message,
              platform: data.data.platform,
            };
          }
        } catch (err) {
          // Silently fail for individual platforms
          console.log(`No share message for platform: ${platform}`);
        }
      }

      setShareMessages(messages);
    } catch (err) {
      console.error("Error fetching share messages:", err);
    } finally {
      setLoadingShareMessages(false);
    }
  };

  const handleImageSelect = (file: File, isEdit: boolean = false, isThumbnail: boolean = false) => {
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      setError('Invalid file type. Only JPEG, PNG, WebP, and GIF images are allowed.');
      return;
    }

    // Validate file size (max 8 MB for banner, max 5 MB for thumbnail)
    const maxSize = isThumbnail ? 5 * 1024 * 1024 : 8 * 1024 * 1024; // 5 MB for thumbnail, 8 MB for banner
    if (file.size > maxSize) {
      setError(`File size must not exceed ${maxSize / (1024 * 1024)} MB.`);
      return;
    }

    setError(null);

    // Create preview URL
    const preview = URL.createObjectURL(file);

    if (isEdit) {
      if (isThumbnail) {
        setSelectedEditThumbnailFile(file);
        setPreviewEditThumbnailUrl(preview);
        setEditForm({ ...editForm, thumbnail: '' });
      } else {
      setSelectedEditFile(file);
      setPreviewEditUrl(preview);
      setEditForm({ ...editForm, banner: '' });
      }
    } else {
      if (isThumbnail) {
        setSelectedThumbnailFile(file);
        setPreviewThumbnailUrl(preview);
        setCreateForm({ ...createForm, thumbnail: '' });
    } else {
      setSelectedFile(file);
      setPreviewUrl(preview);
      setCreateForm({ ...createForm, banner: '' });
      }
    }
  };

  const uploadImageFile = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', 'events');

    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}/api/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.error || 'Failed to upload image');
    }

    return data.data.url;
  };

  // Generate demo CSV file (horizontal format with multiple ticket types as columns)
  const generateDemoCSV = () => {
    // Generate header with 15 ticket types as example (supports unlimited)
    let header = 'Title,Description,Start Date,End Date,Venue,City,State,Slug,Published,Status,Banner';
    for (let i = 1; i <= 15; i++) {
      header += `,Ticket Type ${i} Name,Ticket Type ${i} Price,Ticket Type ${i} Quantity,Ticket Type ${i} Description`;
    }
    header += '\n';
    
    // Generate example row with 3 ticket types filled
    let exampleRow = 'Summer Music Festival,Join us for an amazing summer music festival with top artists,2024-06-15T18:00,2024-06-15T23:00,Central Park,New York,New York,summer-music-festival-2024,true,upcoming,https://example.com/banner.jpg';
    exampleRow += ',VIP,5000,100,Includes front row seats and backstage access';
    exampleRow += ',General Admission,2000,500,Standard entry ticket';
    exampleRow += ',Early Bird,1500,200,Discounted price for early buyers';
    // Fill remaining ticket types with empty values
    for (let i = 4; i <= 15; i++) {
      exampleRow += ',,,';
    }
    
    const csvContent = header + exampleRow;

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'event-template.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    setSuccess('CSV template downloaded! Fill in your event details and upload it.');
    setTimeout(() => setSuccess(null), 3000);
  };

  // Parse CSV and populate form (horizontal format)
  const handleCSVUpload = async (file: File) => {
    try {
      const text = await file.text();
      const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
      
      if (lines.length < 2) {
        setError('CSV file must have at least a header row and one data row');
        return;
      }

      // Parse header row
      const headers = parseCSVLine(lines[0]);
      const headerMap: { [key: string]: number } = {};
      headers.forEach((header, index) => {
        const normalized = header.toLowerCase().trim();
        headerMap[normalized] = index;
      });

      // Find first event data row (skip header)
      if (lines.length < 2) {
        setError('CSV file must have at least one event data row');
        return;
      }

      // Parse first event row (we'll use the first event for now, but could support multiple)
      const eventValues = parseCSVLine(lines[1]);
      
      if (!eventValues || eventValues.length < 3) {
        setError('Could not find valid event data in CSV');
        return;
      }

      // Helper to get value by header name (case-insensitive, handles variations)
      const getValue = (headerVariations: string[]): string => {
        for (const variation of headerVariations) {
          const normalized = variation.toLowerCase().trim();
          const index = headerMap[normalized];
          if (index !== undefined && eventValues[index]) {
            return eventValues[index].trim();
          }
        }
        return '';
      };

      // Parse event data
      const title = getValue(['title', 'event title', 'name']);
      const description = getValue(['description', 'desc']);
      const startDate = getValue(['start date', 'startdate', 'start']);
      const endDate = getValue(['end date', 'enddate', 'end']);
      const venue = getValue(['venue', 'location']);
      const city = getValue(['city']);
      const state = getValue(['state']);
      const slug = getValue(['slug']);
      const published = getValue(['published', 'publish']);
      const status = getValue(['status']);
      const banner = getValue(['banner', 'banner url', 'bannerurl', 'image']);

      // Parse ticket types (horizontal format: Ticket Type 1 Name, Ticket Type 1 Price, etc.)
      // Dynamically detect all ticket types - no limit
      const ticketTypes: Array<{ name: string; price: number; quantity: number; description?: string }> = [];
      
      // Find all ticket type columns by scanning headers
      // Map structure: ticketIndex -> Map<fieldType, columnIndex>
      const ticketTypeIndices = new Map<number, Map<'name' | 'price' | 'quantity' | 'description', number>>();
      
      headers.forEach((header, index) => {
        const normalized = header.toLowerCase().trim();
        // Match patterns like "ticket type 1 name", "ticket 2 price", "tickettype3quantity", etc.
        // Improved regex to handle all variations
        const patterns = [
          /ticket\s*type\s*(\d+)\s*(name|price|quantity|description)/i,
          /ticket\s*(\d+)\s*(name|price|quantity|description)/i,
          /tickettype\s*(\d+)\s*(name|price|quantity|description)/i,
          /tickettype(\d+)(name|price|quantity|description)/i
        ];
        
        for (const pattern of patterns) {
          const match = normalized.match(pattern);
        if (match) {
            const ticketIndex = parseInt(match[1] || '0', 10);
            const fieldType = (match[2] || '').toLowerCase() as 'name' | 'price' | 'quantity' | 'description';
          if (ticketIndex > 0 && ['name', 'price', 'quantity', 'description'].includes(fieldType)) {
            if (!ticketTypeIndices.has(ticketIndex)) {
              ticketTypeIndices.set(ticketIndex, new Map());
            }
            ticketTypeIndices.get(ticketIndex)!.set(fieldType, index);
              break; // Found a match, no need to check other patterns
            }
          }
        }
      });
      
      // Group by ticket index and parse
      const ticketTypeMap = new Map<number, { name?: string; price?: string; quantity?: string; description?: string }>();
      
      ticketTypeIndices.forEach((fieldMap, ticketIndex) => {
        if (!ticketTypeMap.has(ticketIndex)) {
          ticketTypeMap.set(ticketIndex, {});
        }
        const ticketData = ticketTypeMap.get(ticketIndex)!;
        
        fieldMap.forEach((columnIndex, fieldType) => {
          const value = eventValues[columnIndex]?.trim() || '';
          if (fieldType === 'name') {
            ticketData.name = value;
          } else if (fieldType === 'price') {
            ticketData.price = value;
          } else if (fieldType === 'quantity') {
            ticketData.quantity = value;
          } else if (fieldType === 'description') {
            ticketData.description = value;
          }
        });
      });
      
      // Convert map to array and validate (sort by ticket index)
      const sortedIndices = Array.from(ticketTypeMap.keys()).sort((a, b) => a - b);
      sortedIndices.forEach((index) => {
        const data = ticketTypeMap.get(index)!;
        if (data.name && data.name.trim()) {
          const price = parseFloat(data.price || '0') || 0;
          const quantity = parseInt(data.quantity || '0', 10) || 0;
          
          // Only add if we have at least a name (price and quantity can be 0, but should be set)
          // Round price to 2 decimal places to avoid floating point precision issues
          const roundedPrice = isNaN(price) ? 0 : Math.round(price * 100) / 100;
          ticketTypes.push({
            name: data.name.trim(),
            price: roundedPrice,
            quantity: isNaN(quantity) ? 0 : quantity,
            description: (data.description || '').trim() || undefined
          });
        }
      });
      
      console.log(`📦 Parsed ${ticketTypes.length} ticket types from pattern matching`);
      
      // Fallback: If no ticket types found via pattern matching, try sequential approach up to 100
      // Don't break on gaps - continue checking all ticket types up to the limit
      if (ticketTypes.length === 0) {
        let consecutiveEmpty = 0;
        const maxConsecutiveEmpty = 10; // Allow up to 10 consecutive empty slots before stopping
        
        for (let i = 1; i <= 100; i++) {
          const name = getValue([`ticket type ${i} name`, `ticket ${i} name`, `tickettype${i}name`]);
          const priceStr = getValue([`ticket type ${i} price`, `ticket ${i} price`, `tickettype${i}price`]);
          const quantityStr = getValue([`ticket type ${i} quantity`, `ticket ${i} quantity`, `tickettype${i}quantity`]);
          const description = getValue([`ticket type ${i} description`, `ticket ${i} description`, `tickettype${i}description`]);

          if (name && name.trim()) {
            consecutiveEmpty = 0; // Reset counter when we find a ticket type
            const price = parseFloat(priceStr) || 0;
            const quantity = parseInt(quantityStr) || 0;
            
            // Round price to 2 decimal places to avoid floating point precision issues
            const roundedPrice = isNaN(price) ? 0 : Math.round(price * 100) / 100;
            ticketTypes.push({
              name: name.trim(),
              price: roundedPrice,
              quantity: isNaN(quantity) ? 0 : quantity,
              description: (description || '').trim() || undefined
            });
          } else {
            consecutiveEmpty++;
            // Only stop if we've hit many consecutive empty slots
            if (consecutiveEmpty >= maxConsecutiveEmpty) {
            break;
            }
          }
        }
      }

      // Convert date format if needed
      let formattedStartDate = startDate;
      let formattedEndDate = endDate;
      
      if (startDate && !startDate.includes('T')) {
        if (startDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
          formattedStartDate = startDate + 'T00:00';
        } else if (startDate.match(/^\d{2}\/\d{2}\/\d{4}/)) {
          const parts = startDate.split('/');
          formattedStartDate = `${parts[2]}-${parts[0]}-${parts[1]}T00:00`;
        }
      }
      if (endDate && !endDate.includes('T')) {
        if (endDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
          formattedEndDate = endDate + 'T00:00';
        } else if (endDate.match(/^\d{2}\/\d{2}\/\d{4}/)) {
          const parts = endDate.split('/');
          formattedEndDate = `${parts[2]}-${parts[0]}-${parts[1]}T00:00`;
        }
      }

      // Filter and validate ticket types - only require name, allow price and quantity to be 0
      // This ensures ticket types are visible even if price/quantity need to be set manually
      const validTicketTypes = ticketTypes.filter(tt => tt.name && tt.name.trim());
      
      console.log('📊 CSV Import - Parsed ticket types:', ticketTypes);
      console.log('✅ CSV Import - Valid ticket types (after filtering):', validTicketTypes);
      
      if (validTicketTypes.length === 0 && ticketTypes.length > 0) {
        console.warn('⚠️ All ticket types were filtered out! Original ticket types:', ticketTypes);
      }
      
      setCreateForm(prevForm => ({
        ...prevForm,
        title: title || '',
        description: description || '',
        startDate: formattedStartDate,
        endDate: formattedEndDate || '',
        banner: banner || '',
        venue: venue || '',
        city: city || '',
        state: state || '',
        slug: slug || '',
        published: published.toLowerCase() === 'true' || published === '1' || false,
        status: status || 'upcoming',
        ticketTypes: validTicketTypes, // Set ticket types explicitly
        subscriberLimitsEnabled: false,
        subscriberLimits: {
          premium: 0,
          diamond: 0,
          exclusiveBlack: 0,
          student: 0,
        },
        selectedTemplateId: "",
      }));

      const eventCount = lines.length - 1; // Subtract header row
      const ticketCount = validTicketTypes.length;
      
      if (ticketCount > 0) {
        setSuccess(`CSV imported successfully! Loaded first event with ${ticketCount} ticket type(s). ${eventCount > 1 ? `(${eventCount} events found in CSV - only first event loaded)` : ''}`);
      } else {
        setSuccess(`CSV imported successfully! Event data loaded, but no ticket types found. ${eventCount > 1 ? `(${eventCount} events found in CSV - only first event loaded)` : ''}`);
        setError('No ticket types were found in the CSV. Please add ticket types manually or check your CSV format.');
        setTimeout(() => setError(null), 5000);
      }
      
      // Log the form state after setting it
      setTimeout(() => {
        console.log('📋 Create form state after CSV import - checking ticketTypes:', {
          title,
          ticketTypesCount: validTicketTypes.length,
          ticketTypes: validTicketTypes
        });
      }, 100);
      
      setTimeout(() => setSuccess(null), 8000);
    } catch (err: any) {
      console.error('CSV parsing error:', err);
      setError(err.message || 'Failed to parse CSV file');
    }
  };

  // Helper function to parse CSV line (handles quoted values)
  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    result.push(current.trim());
    return result;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-primary-bg flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary-accent border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-primary-muted">Checking authorization...</p>
        </div>
      </div>
    );
  }

  if (!authorized) {
    return (
      <div className="min-h-screen bg-primary-bg flex items-center justify-center">
        <div className="text-center">
          <p className="text-primary-fg mb-4">Unauthorized Access</p>
          <p className="text-primary-muted mb-6">Only authorized team members can access this page.</p>
          <button
            onClick={() => router.push("/dashboard")}
            className="px-4 py-2 bg-primary-accent text-white rounded-lg hover:bg-primary-accent-dark transition-colors"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-primary-bg">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.push("/dashboard")}
            className="flex items-center gap-2 text-primary-muted hover:text-primary-fg transition-colors mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-primary-fg mb-2">Manage Events</h1>
              <p className="text-primary-muted">Create, update, and delete events</p>
            </div>
            <button
              onClick={() => setCreating(!creating)}
              className="btn-primary flex items-center gap-2"
            >
              <Plus size={16} />
              {creating ? "Cancel" : "Create Event"}
            </button>
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-800">Error</p>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        )}

        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-green-800">Success</p>
              <p className="text-sm text-green-700">{success}</p>
            </div>
          </div>
        )}

        {/* Create Form */}
        {creating && (
          <div className="card mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-primary-fg">Create New Event</h2>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={generateDemoCSV}
                  className="btn-secondary flex items-center gap-2 text-sm"
                  title="Download CSV template"
                >
                  <Download className="h-4 w-4" />
                  Download CSV Template
                </button>
                <button
                  type="button"
                  onClick={() => csvInputRef.current?.click()}
                  className="btn-secondary flex items-center gap-2 text-sm"
                  title="Upload CSV file"
                >
                  <FileText className="h-4 w-4" />
                  Upload CSV
                </button>
                <input
                  ref={csvInputRef}
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      handleCSVUpload(file);
                    }
                    // Reset input
                    if (csvInputRef.current) {
                      csvInputRef.current.value = '';
                    }
                  }}
                />
              </div>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-primary-fg mb-2">Title *</label>
                  <input
                    type="text"
                    required
                    disabled={submitting}
                    value={createForm.title}
                    onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                    className="w-full px-4 py-2 border border-primary-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-accent bg-primary-bg text-primary-fg disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-primary-fg mb-2">Slug</label>
                  <input
                    type="text"
                    disabled={submitting}
                    value={createForm.slug}
                    onChange={(e) => setCreateForm({ ...createForm, slug: e.target.value })}
                    className="w-full px-4 py-2 border border-primary-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-accent bg-primary-bg text-primary-fg disabled:opacity-50 disabled:cursor-not-allowed"
                    placeholder="event-slug"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-primary-fg mb-2">Start Date *</label>
                  <input
                    type="datetime-local"
                    required
                    disabled={submitting}
                    value={createForm.startDate}
                    onChange={(e) => setCreateForm({ ...createForm, startDate: e.target.value })}
                    className="w-full px-4 py-2 border border-primary-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-accent bg-primary-bg text-primary-fg disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-primary-fg mb-2">End Date</label>
                  <input
                    type="datetime-local"
                    disabled={submitting}
                    value={createForm.endDate}
                    onChange={(e) => setCreateForm({ ...createForm, endDate: e.target.value })}
                    className="w-full px-4 py-2 border border-primary-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-accent bg-primary-bg text-primary-fg disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-primary-fg mb-2">Venue</label>
                  <input
                    type="text"
                    disabled={submitting}
                    value={createForm.venue}
                    onChange={(e) => setCreateForm({ ...createForm, venue: e.target.value })}
                    className="w-full px-4 py-2 border border-primary-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-accent bg-primary-bg text-primary-fg disabled:opacity-50 disabled:cursor-not-allowed"
                    placeholder="Enter venue address"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-primary-fg mb-2">City</label>
                  <input
                    type="text"
                    disabled={submitting}
                    value={createForm.city}
                    onChange={(e) => setCreateForm({ ...createForm, city: e.target.value })}
                    className="w-full px-4 py-2 border border-primary-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-accent bg-primary-bg text-primary-fg disabled:opacity-50 disabled:cursor-not-allowed"
                    placeholder="City (auto-detected from venue or enter manually)"
                  />
                  <p className="text-xs text-primary-muted mt-1">City will be auto-detected from venue address if not provided</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-primary-fg mb-2">State</label>
                  <div className="relative">
                    <select
                      disabled={submitting}
                      value={createForm.state}
                      onChange={(e) => setCreateForm({ ...createForm, state: e.target.value })}
                      className="w-full px-4 pr-8 py-2 border border-primary-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-accent bg-primary-bg text-primary-fg disabled:opacity-50 disabled:cursor-not-allowed appearance-none cursor-pointer"
                    >
                      <option value="">Select State</option>
                      {INDIAN_STATES.map((state) => (
                        <option key={state} value={state}>
                          {state}
                        </option>
                      ))}
                    </select>
                    <div className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none">
                      <svg className="w-4 h-4 text-primary-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                  <p className="text-xs text-primary-muted mt-1">State will be auto-detected from venue address if not provided</p>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-primary-fg mb-2">Banner Image</label>
                  <div className="space-y-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleImageSelect(file, false);
                      }}
                      className="hidden"
                    />
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadingImage || submitting}
                        className="px-4 py-2 border border-primary-border rounded-lg hover:bg-primary-accent-light transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Upload size={16} />
                        Select Image
                      </button>
                      {uploadProgress && (
                        <span className="text-sm text-primary-muted">{uploadProgress}</span>
                      )}
                    </div>
                    {(previewUrl || createForm.banner) && (
                      <div className="mt-2">
                        <img 
                          src={previewUrl ?? createForm.banner ?? ''} 
                          alt="Banner preview" 
                          className="max-w-full h-48 object-cover rounded-lg border border-primary-border"
                        />
                        <button
                          type="button"
                          disabled={submitting}
                          onClick={() => {
                            if (previewUrl) {
                              URL.revokeObjectURL(previewUrl);
                            }
                            setSelectedFile(null);
                            setPreviewUrl(null);
                            setCreateForm({ ...createForm, banner: "" });
                          }}
                          className="mt-2 text-sm text-red-600 hover:text-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Remove image
                        </button>
                      </div>
                    )}
                    <input
                      type="url"
                      disabled={submitting}
                      value={createForm.banner}
                      onChange={(e) => setCreateForm({ ...createForm, banner: e.target.value })}
                      placeholder="Or enter image URL manually"
                      className="w-full px-4 py-2 border border-primary-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-accent bg-primary-bg text-primary-fg disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-primary-fg mb-2">Status</label>
                  <select
                    disabled={submitting}
                    value={createForm.status}
                    onChange={(e) => setCreateForm({ ...createForm, status: e.target.value })}
                    className="w-full px-4 py-2 border border-primary-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-accent bg-primary-bg text-primary-fg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="upcoming">Upcoming</option>
                    <option value="ongoing">Ongoing</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>
              
              {/* Ticket Types Section */}
              <div className="border-t border-primary-border pt-4">
                <div className="flex justify-between items-center mb-4">
                  <label className="block text-sm font-medium text-primary-fg">Ticket Types</label>
                  <button
                    type="button"
                    onClick={() => {
                      setCreateForm({
                        ...createForm,
                        ticketTypes: [
                          ...createForm.ticketTypes,
                          { name: "", price: 0, quantity: 0, description: "" }
                        ]
                      });
                    }}
                    className="btn-secondary flex items-center gap-2 text-sm"
                    disabled={submitting}
                  >
                    <Plus className="h-4 w-4" />
                    Add Ticket Type
                  </button>
                </div>
                {createForm.ticketTypes.length === 0 ? (
                  <p className="text-sm text-primary-muted italic">No ticket types added. Click &quot;Add Ticket Type&quot; to add one.</p>
                ) : (
                  <div className="space-y-4">
                    {createForm.ticketTypes.map((ticketType, index) => (
                      <div key={index} className="border border-primary-border rounded-lg p-4 bg-primary-accent-light">
                        <div className="flex justify-between items-start mb-3">
                          <h4 className="text-sm font-medium text-primary-fg">Ticket Type {index + 1}</h4>
                          <button
                            type="button"
                            onClick={() => {
                              const newTicketTypes = createForm.ticketTypes.filter((_, i) => i !== index);
                              setCreateForm({ ...createForm, ticketTypes: newTicketTypes });
                            }}
                            className="text-red-600 hover:text-red-700"
                            disabled={submitting}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-medium text-primary-fg mb-1">
                              Name *
                            </label>
                            <input
                              type="text"
                              required
                              disabled={submitting}
                              value={ticketType.name}
                              onChange={(e) => {
                                const newTicketTypes = [...createForm.ticketTypes];
                                newTicketTypes[index] = { ...ticketType, name: e.target.value };
                                setCreateForm({ ...createForm, ticketTypes: newTicketTypes });
                              }}
                              placeholder="e.g., VIP, General, Early Bird"
                              className="w-full px-3 py-2 text-sm border border-primary-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-accent bg-primary-bg text-primary-fg disabled:opacity-50"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-primary-fg mb-1">
                              Price (₹) *
                            </label>
                            <input
                              type="number"
                              required
                              min="0"
                              step="0.01"
                              disabled={submitting}
                              value={ticketType.price !== undefined && ticketType.price !== null ? ticketType.price : ""}
                              onChange={(e) => {
                                const newTicketTypes = [...createForm.ticketTypes];
                                const inputValue = e.target.value;
                                // Handle empty input
                                if (inputValue === "" || inputValue === null || inputValue === undefined) {
                                  newTicketTypes[index] = { ...ticketType, price: 0 };
                                } else {
                                  // Parse as float, then round to 2 decimal places to avoid floating point precision issues
                                  const parsedPrice = parseFloat(inputValue);
                                  if (!isNaN(parsedPrice)) {
                                    // Round to 2 decimal places to avoid floating point precision issues
                                    const roundedPrice = Math.round(parsedPrice * 100) / 100;
                                    newTicketTypes[index] = { ...ticketType, price: roundedPrice };
                                  } else {
                                    newTicketTypes[index] = { ...ticketType, price: 0 };
                                  }
                                }
                                setCreateForm({ ...createForm, ticketTypes: newTicketTypes });
                              }}
                              onBlur={(e) => {
                                // Ensure value is properly rounded on blur
                                const newTicketTypes = [...createForm.ticketTypes];
                                const currentPrice = newTicketTypes[index].price;
                                if (currentPrice !== undefined && currentPrice !== null) {
                                  const roundedPrice = Math.round(currentPrice * 100) / 100;
                                  if (roundedPrice !== currentPrice) {
                                    newTicketTypes[index] = { ...ticketType, price: roundedPrice };
                                    setCreateForm({ ...createForm, ticketTypes: newTicketTypes });
                                  }
                                }
                              }}
                              className="w-full px-3 py-2 text-sm border border-primary-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-accent bg-primary-bg text-primary-fg disabled:opacity-50"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-primary-fg mb-1">
                              Quantity (Available Tickets) *
                            </label>
                            <input
                              type="number"
                              required
                              min="1"
                              disabled={submitting}
                              value={ticketType.quantity || ""}
                              onChange={(e) => {
                                const newTicketTypes = [...createForm.ticketTypes];
                                newTicketTypes[index] = { ...ticketType, quantity: parseInt(e.target.value) || 0 };
                                setCreateForm({ ...createForm, ticketTypes: newTicketTypes });
                              }}
                              className="w-full px-3 py-2 text-sm border border-primary-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-accent bg-primary-bg text-primary-fg disabled:opacity-50"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-primary-fg mb-1">
                              Description (Optional)
                            </label>
                            <textarea
                              rows={3}
                              disabled={submitting}
                              value={ticketType.description || ""}
                              onChange={(e) => {
                                const newTicketTypes = [...createForm.ticketTypes];
                                newTicketTypes[index] = { ...ticketType, description: e.target.value };
                                setCreateForm({ ...createForm, ticketTypes: newTicketTypes });
                              }}
                              placeholder="Brief description of this ticket type"
                              className="w-full px-3 py-2 text-sm border border-primary-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-accent resize-none bg-primary-bg text-primary-fg disabled:opacity-50 whitespace-pre-line"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Subscriber Limits Section */}
              <div className="border-t border-primary-border pt-4">
                <div className="flex items-center gap-3 p-4 bg-primary-accent-light rounded-lg border border-primary-border mb-4">
                  <input
                    type="checkbox"
                    id="subscriberLimitsEnabled"
                    disabled={submitting}
                    checked={createForm.subscriberLimitsEnabled}
                    onChange={(e) => setCreateForm({ ...createForm, subscriberLimitsEnabled: e.target.checked })}
                    className="w-5 h-5 text-primary-accent border-primary-border rounded focus:ring-primary-accent disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  <label htmlFor="subscriberLimitsEnabled" className="text-sm font-medium text-primary-fg cursor-pointer">
                    Enable Subscriber Limits (Free Access for Subscribers)
                  </label>
                </div>

                {createForm.subscriberLimitsEnabled && (
                  <div className="space-y-4">
                    <p className="text-sm text-primary-muted mb-4">
                      Set the maximum number of free tickets available for each subscriber tier. These tickets will be free and included in financial calculations.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-primary-fg mb-1">
                          Premium Subscribers
                        </label>
                        <input
                          type="number"
                          min="0"
                          disabled={submitting}
                          value={createForm.subscriberLimits.premium || ""}
                          onChange={(e) => setCreateForm({
                            ...createForm,
                            subscriberLimits: {
                              ...createForm.subscriberLimits,
                              premium: parseInt(e.target.value) || 0
                            }
                          })}
                          className="w-full px-3 py-2 text-sm border border-primary-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-accent bg-primary-bg text-primary-fg disabled:opacity-50"
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-primary-fg mb-1">
                          Diamond Subscribers
                        </label>
                        <input
                          type="number"
                          min="0"
                          disabled={submitting}
                          value={createForm.subscriberLimits.diamond || ""}
                          onChange={(e) => setCreateForm({
                            ...createForm,
                            subscriberLimits: {
                              ...createForm.subscriberLimits,
                              diamond: parseInt(e.target.value) || 0
                            }
                          })}
                          className="w-full px-3 py-2 text-sm border border-primary-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-accent bg-primary-bg text-primary-fg disabled:opacity-50"
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-primary-fg mb-1">
                          Exclusive Black Subscribers
                        </label>
                        <input
                          type="number"
                          min="0"
                          disabled={submitting}
                          value={createForm.subscriberLimits.exclusiveBlack || ""}
                          onChange={(e) => setCreateForm({
                            ...createForm,
                            subscriberLimits: {
                              ...createForm.subscriberLimits,
                              exclusiveBlack: parseInt(e.target.value) || 0
                            }
                          })}
                          className="w-full px-3 py-2 text-sm border border-primary-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-accent bg-primary-bg text-primary-fg disabled:opacity-50"
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-primary-fg mb-1">
                          Student Subscribers
                        </label>
                        <input
                          type="number"
                          min="0"
                          disabled={submitting}
                          value={createForm.subscriberLimits.student || ""}
                          onChange={(e) => setCreateForm({
                            ...createForm,
                            subscriberLimits: {
                              ...createForm.subscriberLimits,
                              student: parseInt(e.target.value) || 0
                            }
                          })}
                          className="w-full px-3 py-2 text-sm border border-primary-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-accent bg-primary-bg text-primary-fg disabled:opacity-50"
                          placeholder="0"
                        />
                      </div>
                    </div>
                    <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-xs text-blue-800">
                        <strong>Total Free Subscriber Tickets:</strong> {
                          createForm.subscriberLimits.premium +
                          createForm.subscriberLimits.diamond +
                          createForm.subscriberLimits.exclusiveBlack +
                          createForm.subscriberLimits.student
                        }
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-primary-fg mb-2">Description</label>
                <textarea
                  rows={4}
                  disabled={submitting}
                  value={createForm.description}
                  onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                  className="w-full px-4 py-2 border border-primary-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-accent resize-none bg-primary-bg text-primary-fg disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
              {/* Template Selection */}
              <div className="border-t border-primary-border pt-4">
                <label className="block text-sm font-medium text-primary-fg mb-2">
                  Apply Event Template (Optional)
                </label>
                <select
                  value={createForm.selectedTemplateId}
                  onChange={(e) => {
                    setCreateForm({ ...createForm, selectedTemplateId: e.target.value });
                    if (e.target.value) {
                      setShowTemplateCustomization(true);
                    } else {
                      setShowTemplateCustomization(false);
                      setTemplateCustomizations({});
                    }
                  }}
                  disabled={submitting}
                  className="w-full px-3 py-2 border border-primary-border rounded-lg bg-primary-bg text-primary-fg disabled:opacity-50"
                >
                  <option value="">No Template</option>
                  {templates.map((template) => (
                    <option key={template.id} value={template.id}>
                      {template.name} {template.festivalType ? `(${template.festivalType})` : ''}
                    </option>
                  ))}
                </select>
                {createForm.selectedTemplateId && (
                  <p className="text-xs text-primary-muted mt-1">
                    Template will be applied after event creation. Tasks will be created based on event start date.
                  </p>
                )}
              </div>

              <div className="flex items-center gap-3 p-4 bg-primary-accent-light rounded-lg border border-primary-border">
                <input
                  type="checkbox"
                  id="published"
                  disabled={submitting}
                  checked={createForm.published}
                  onChange={(e) => setCreateForm({ ...createForm, published: e.target.checked })}
                  className="w-5 h-5 text-primary-accent border-primary-border rounded focus:ring-primary-accent disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <label htmlFor="published" className="text-sm text-primary-fg cursor-pointer">
                  Published (visible to public)
                </label>
              </div>
              <div className="flex justify-end gap-4">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => {
                    // Clean up preview URL
                    if (previewUrl) {
                      URL.revokeObjectURL(previewUrl);
                    }
                    setCreating(false);
                    setCreateForm({
                      title: "",
                      description: "",
                      startDate: "",
                      endDate: "",
                      banner: "",
                      thumbnail: "",
                      category: "",
                      venue: "",
                      city: "",
                      state: "",
                      slug: "",
                      published: false,
                      status: "upcoming",
                      ticketTypes: [],
                      subscriberLimitsEnabled: false,
                      subscriberLimits: {
                        premium: 0,
                        diamond: 0,
                        exclusiveBlack: 0,
                        student: 0,
                      },
                      selectedTemplateId: "",
                    });
                    setTemplateCustomizations({});
                    setShowTemplateCustomization(false);
      setSelectedFile(null);
      setPreviewUrl(null);
                  }}
                  className="px-6 py-2 text-sm font-medium text-primary-fg bg-primary-border rounded-lg hover:bg-primary-accent-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2 text-sm font-medium text-white bg-primary-accent rounded-lg hover:bg-primary-accent-dark transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Create Event
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Events List */}
        <div className="card">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <h2 className="text-xl font-semibold text-primary-fg">All Events</h2>
            
            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-primary-muted" />
                <input
                  type="text"
                  placeholder="Search events..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-primary-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-accent bg-primary-bg text-primary-fg text-sm"
                />
              </div>

              {/* Status Filter */}
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-primary-muted pointer-events-none z-10" />
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="pl-10 pr-8 py-2 border border-primary-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-accent bg-primary-bg text-primary-fg text-sm appearance-none cursor-pointer min-w-[140px]"
                >
                  <option value="all">All Status</option>
                  <option value="upcoming">Upcoming</option>
                  <option value="ongoing">Ongoing</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none">
                  <svg className="w-4 h-4 text-primary-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>

              {/* Published Filter */}
              <div className="relative">
                <select
                  value={filterPublished}
                  onChange={(e) => setFilterPublished(e.target.value)}
                  className="px-4 pr-8 py-2 border border-primary-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-accent bg-primary-bg text-primary-fg text-sm cursor-pointer appearance-none min-w-[120px]"
                >
                  <option value="all">All</option>
                  <option value="published">Published</option>
                  <option value="draft">Draft</option>
                </select>
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none">
                  <svg className="w-4 h-4 text-primary-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Results Count */}
          <div className="mb-4 text-sm text-primary-muted">
            Showing {filteredEvents.length} of {events.length} event{events.length !== 1 ? 's' : ''}
            {(searchQuery || filterStatus !== "all" || filterPublished !== "all") && " (filtered)"}
          </div>

          {events.length === 0 ? (
            <div className="text-center py-8 text-primary-muted">
              <p>No events found. Create your first event!</p>
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="text-center py-8 text-primary-muted">
              <p>No events match your search or filter criteria.</p>
              <button
                onClick={() => {
                  setSearchQuery("");
                  setFilterStatus("all");
                  setFilterPublished("all");
                }}
                className="mt-2 text-sm text-primary-accent hover:underline"
              >
                Clear filters
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-primary-border">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-primary-fg">Title</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-primary-fg">Start Date</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-primary-fg">Status</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-primary-fg">Published</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-primary-fg">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEvents.map((event) => (
                    <>
                      <tr key={event.id} className="border-b border-primary-border hover:bg-primary-accent-light/50">
                      {editingId === event.id ? (
                        <>
                          <td colSpan={5} className="p-4">
                            <div className="space-y-4">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <label className="block text-sm font-medium text-primary-fg mb-2">Title *</label>
                                  <input
                                    type="text"
                                    required
                                    value={editForm.title || ""}
                                    onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                                    className="w-full px-4 py-2 border border-primary-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-accent bg-primary-bg text-primary-fg"
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-primary-fg mb-2">Slug</label>
                                  <input
                                    type="text"
                                    value={editForm.slug || ""}
                                    onChange={(e) => setEditForm({ ...editForm, slug: e.target.value })}
                                    className="w-full px-4 py-2 border border-primary-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-accent bg-primary-bg text-primary-fg"
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-primary-fg mb-2">Start Date *</label>
                                  <input
                                    type="datetime-local"
                                    required
                                    value={editForm.startDate || ""}
                                    onChange={(e) => setEditForm({ ...editForm, startDate: e.target.value })}
                                    className="w-full px-4 py-2 border border-primary-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-accent bg-primary-bg text-primary-fg"
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-primary-fg mb-2">End Date</label>
                                  <input
                                    type="datetime-local"
                                    value={editForm.endDate || ""}
                                    onChange={(e) => setEditForm({ ...editForm, endDate: e.target.value })}
                                    className="w-full px-4 py-2 border border-primary-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-accent bg-primary-bg text-primary-fg"
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-primary-fg mb-2">Venue</label>
                                  <input
                                    type="text"
                                    value={editForm.venue || ""}
                                    onChange={(e) => setEditForm({ ...editForm, venue: e.target.value })}
                                    className="w-full px-4 py-2 border border-primary-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-accent bg-primary-bg text-primary-fg"
                                    placeholder="Enter venue address"
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-primary-fg mb-2">City</label>
                                  <input
                                    type="text"
                                    value={editForm.city || ""}
                                    onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                                    className="w-full px-4 py-2 border border-primary-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-accent bg-primary-bg text-primary-fg"
                                    placeholder="City (auto-detected from venue or enter manually)"
                                  />
                                  <p className="text-xs text-primary-muted mt-1">City will be auto-detected from venue address if not provided</p>
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-primary-fg mb-2">State</label>
                                  <div className="relative">
                                    <select
                                      value={editForm.state || ""}
                                      onChange={(e) => setEditForm({ ...editForm, state: e.target.value })}
                                      className="w-full px-4 pr-8 py-2 border border-primary-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-accent bg-primary-bg text-primary-fg appearance-none cursor-pointer"
                                    >
                                      <option value="">Select State</option>
                                      {INDIAN_STATES.map((state) => (
                                        <option key={state} value={state}>
                                          {state}
                                        </option>
                                      ))}
                                    </select>
                                    <div className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none">
                                      <svg className="w-4 h-4 text-primary-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                      </svg>
                                    </div>
                                  </div>
                                  <p className="text-xs text-primary-muted mt-1">State will be auto-detected from venue address if not provided</p>
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-primary-fg mb-2">Status</label>
                                  <select
                                    value={editForm.status || "upcoming"}
                                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                                    className="w-full px-4 py-2 border border-primary-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-accent bg-primary-bg text-primary-fg"
                                  >
                                    <option value="upcoming">Upcoming</option>
                                    <option value="ongoing">Ongoing</option>
                                    <option value="completed">Completed</option>
                                    <option value="cancelled">Cancelled</option>
                                  </select>
                                </div>
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-primary-fg mb-2">Banner Image</label>
                                <div className="space-y-2">
                                  <input
                                    ref={editFileInputRef}
                                    type="file"
                                    accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleImageSelect(file, true);
                      }}
                                    className="hidden"
                                  />
                                  <div className="flex items-center gap-3">
                                    <button
                                      type="button"
                                      onClick={() => editFileInputRef.current?.click()}
                                      disabled={uploadingImage}
                                      className="px-4 py-2 border border-primary-border rounded-lg hover:bg-primary-accent-light transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                      <Upload size={16} />
                                      Select Image
                                    </button>
                                    {uploadProgress && (
                                      <span className="text-sm text-primary-muted">{uploadProgress}</span>
                                    )}
                                  </div>
                                  {(previewEditUrl || editForm.banner) && (
                                    <div className="mt-2">
                                      <img 
                                        src={previewEditUrl ?? editForm.banner ?? ''} 
                                        alt="Banner preview" 
                                        className="max-w-full h-48 object-cover rounded-lg border border-primary-border"
                                      />
                                      <button
                                        type="button"
                                        onClick={() => {
                                          if (previewEditUrl) {
                                            URL.revokeObjectURL(previewEditUrl);
                                          }
                                          setSelectedEditFile(null);
                                          setPreviewEditUrl(null);
                                          setEditForm({ ...editForm, banner: "" });
                                        }}
                                        className="mt-2 text-sm text-red-600 hover:text-red-700"
                                      >
                                        Remove image
                                      </button>
                                    </div>
                                  )}
                                  <input
                                    type="url"
                                    value={editForm.banner || ""}
                                    onChange={(e) => setEditForm({ ...editForm, banner: e.target.value })}
                                    placeholder="Or enter image URL manually"
                                    className="w-full px-4 py-2 border border-primary-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-accent bg-primary-bg text-primary-fg"
                                  />
                                </div>
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-primary-fg mb-2">Description</label>
                                <textarea
                                  rows={3}
                                  value={editForm.description || ""}
                                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                                  className="w-full px-4 py-2 border border-primary-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-accent resize-none bg-primary-bg text-primary-fg"
                                />
                              </div>

                              {/* Ticket Types Section for Edit */}
                              <div className="border-t border-primary-border pt-4">
                                <div className="flex justify-between items-center mb-4">
                                  <label className="block text-sm font-medium text-primary-fg">Ticket Types</label>
                                  {(loadingTicketTypes || updatingTicketTypes === event.id) ? (
                                    <span className="text-sm text-primary-muted flex items-center gap-2">
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                      {updatingTicketTypes === event.id ? 'Updating...' : 'Loading...'}
                                    </span>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setEditTicketTypes([
                                          ...editTicketTypes,
                                          { name: "", price: 0, quantity: 0, description: "" }
                                        ]);
                                      }}
                                      className="btn-secondary flex items-center gap-2 text-sm"
                                    >
                                      <Plus className="h-4 w-4" />
                                      Add Ticket Type
                                    </button>
                                  )}
                                </div>
                                {(loadingTicketTypes && editingId === event.id) || updatingTicketTypes === event.id ? (
                                  <p className="text-sm text-primary-muted italic flex items-center gap-2">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    {updatingTicketTypes === event.id ? 'Updating ticket types...' : 'Loading ticket types...'}
                                  </p>
                                ) : editingId === event.id && editTicketTypes.length === 0 ? (
                                  <p className="text-sm text-primary-muted italic">No ticket types added. Click &quot;Add Ticket Type&quot; to add one.</p>
                                ) : editingId === event.id && editTicketTypes.length > 0 ? (
                                  <div className="space-y-4">
                                    {editTicketTypes.map((ticketType, index) => (
                                      <div key={index} className="border border-primary-border rounded-lg p-4 bg-primary-accent-light">
                                        <div className="flex justify-between items-start mb-3">
                                          <h4 className="text-sm font-medium text-primary-fg">Ticket Type {index + 1}</h4>
                                          <button
                                            type="button"
                                            onClick={() => {
                                              const newTicketTypes = editTicketTypes.filter((_, i) => i !== index);
                                              setEditTicketTypes(newTicketTypes);
                                            }}
                                            className="text-red-600 hover:text-red-700"
                                          >
                                            <Trash2 className="h-4 w-4" />
                                          </button>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                          <div>
                                            <label className="block text-xs font-medium text-primary-fg mb-1">
                                              Name *
                                            </label>
                                            <input
                                              type="text"
                                              required
                                              value={ticketType.name}
                                              onChange={(e) => {
                                                const newTicketTypes = [...editTicketTypes];
                                                newTicketTypes[index] = { ...ticketType, name: e.target.value };
                                                setEditTicketTypes(newTicketTypes);
                                              }}
                                              placeholder="e.g., VIP, General, Early Bird"
                                              disabled={updatingTicketTypes === event.id}
                                              className="w-full px-3 py-2 text-sm border border-primary-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-accent bg-primary-bg text-primary-fg disabled:opacity-50 disabled:cursor-not-allowed"
                                            />
                                          </div>
                                          <div>
                                            <label className="block text-xs font-medium text-primary-fg mb-1">
                                              Price (₹) *
                                            </label>
                                            <input
                                              type="number"
                                              required
                                              min="0"
                                              step="0.01"
                                              value={ticketType.price !== undefined && ticketType.price !== null ? ticketType.price : ""}
                                              onChange={(e) => {
                                                const newTicketTypes = [...editTicketTypes];
                                                const inputValue = e.target.value;
                                                // Handle empty input
                                                if (inputValue === "" || inputValue === null || inputValue === undefined) {
                                                  newTicketTypes[index] = { ...ticketType, price: 0 };
                                                } else {
                                                  // Parse as float, then round to 2 decimal places to avoid floating point precision issues
                                                  const parsedPrice = parseFloat(inputValue);
                                                  if (!isNaN(parsedPrice)) {
                                                    // Round to 2 decimal places to avoid floating point precision issues
                                                    const roundedPrice = Math.round(parsedPrice * 100) / 100;
                                                    newTicketTypes[index] = { ...ticketType, price: roundedPrice };
                                                  } else {
                                                    newTicketTypes[index] = { ...ticketType, price: 0 };
                                                  }
                                                }
                                                setEditTicketTypes(newTicketTypes);
                                              }}
                                              onBlur={(e) => {
                                                // Ensure value is properly rounded on blur
                                                const newTicketTypes = [...editTicketTypes];
                                                const currentPrice = newTicketTypes[index].price;
                                                if (currentPrice !== undefined && currentPrice !== null) {
                                                  const roundedPrice = Math.round(currentPrice * 100) / 100;
                                                  if (roundedPrice !== currentPrice) {
                                                    newTicketTypes[index] = { ...ticketType, price: roundedPrice };
                                                    setEditTicketTypes(newTicketTypes);
                                                  }
                                                }
                                              }}
                                              disabled={updatingTicketTypes === event.id}
                                              className="w-full px-3 py-2 text-sm border border-primary-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-accent bg-primary-bg text-primary-fg disabled:opacity-50 disabled:cursor-not-allowed"
                                            />
                                          </div>
                                          <div>
                                            <label className="block text-xs font-medium text-primary-fg mb-1">
                                              Quantity (Available Tickets) *
                                            </label>
                                            <input
                                              type="number"
                                              required
                                              min="1"
                                              value={ticketType.quantity || ""}
                                              onChange={(e) => {
                                                const newTicketTypes = [...editTicketTypes];
                                                newTicketTypes[index] = { ...ticketType, quantity: parseInt(e.target.value) || 0 };
                                                setEditTicketTypes(newTicketTypes);
                                              }}
                                              disabled={updatingTicketTypes === event.id}
                                              className="w-full px-3 py-2 text-sm border border-primary-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-accent bg-primary-bg text-primary-fg disabled:opacity-50 disabled:cursor-not-allowed"
                                            />
                                          </div>
                                          <div>
                                            <label className="block text-xs font-medium text-primary-fg mb-1">
                                              Description (Optional)
                                            </label>
                                            <textarea
                                              rows={3}
                                              value={ticketType.description || ""}
                                              onChange={(e) => {
                                                const newTicketTypes = [...editTicketTypes];
                                                newTicketTypes[index] = { ...ticketType, description: e.target.value };
                                                setEditTicketTypes(newTicketTypes);
                                              }}
                                              placeholder="Brief description of this ticket type"
                                              disabled={updatingTicketTypes === event.id}
                                              className="w-full px-3 py-2 text-sm border border-primary-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-accent resize-none bg-primary-bg text-primary-fg disabled:opacity-50 disabled:cursor-not-allowed whitespace-pre-line"
                                            />
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                ) : null}
                              </div>

                              {/* Subscriber Limits Section for Edit */}
                              <div className="border-t border-primary-border pt-4">
                                <div className="flex items-center gap-3 p-4 bg-primary-accent-light rounded-lg border border-primary-border mb-4">
                                  <input
                                    type="checkbox"
                                    id="editSubscriberLimitsEnabled"
                                    checked={editSubscriberLimitsEnabled}
                                    onChange={(e) => setEditSubscriberLimitsEnabled(e.target.checked)}
                                    className="w-5 h-5 text-primary-accent border-primary-border rounded focus:ring-primary-accent"
                                  />
                                  <label htmlFor="editSubscriberLimitsEnabled" className="text-sm font-medium text-primary-fg cursor-pointer">
                                    Enable Subscriber Limits (Free Access for Subscribers)
                                  </label>
                                </div>

                                {editSubscriberLimitsEnabled && (
                                  <div className="space-y-4">
                                    <p className="text-sm text-primary-muted mb-4">
                                      Set the maximum number of free tickets available for each subscriber tier. These tickets will be free and included in financial calculations.
                                    </p>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                      <div>
                                        <label className="block text-xs font-medium text-primary-fg mb-1">
                                          Premium Subscribers
                                        </label>
                                        <input
                                          type="number"
                                          min="0"
                                          value={editSubscriberLimits.premium || ""}
                                          onChange={(e) => setEditSubscriberLimits({
                                            ...editSubscriberLimits,
                                            premium: parseInt(e.target.value) || 0
                                          })}
                                          className="w-full px-3 py-2 text-sm border border-primary-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-accent bg-primary-bg text-primary-fg"
                                          placeholder="0"
                                        />
                                      </div>
                                      <div>
                                        <label className="block text-xs font-medium text-primary-fg mb-1">
                                          Diamond Subscribers
                                        </label>
                                        <input
                                          type="number"
                                          min="0"
                                          value={editSubscriberLimits.diamond || ""}
                                          onChange={(e) => setEditSubscriberLimits({
                                            ...editSubscriberLimits,
                                            diamond: parseInt(e.target.value) || 0
                                          })}
                                          className="w-full px-3 py-2 text-sm border border-primary-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-accent bg-primary-bg text-primary-fg"
                                          placeholder="0"
                                        />
                                      </div>
                                      <div>
                                        <label className="block text-xs font-medium text-primary-fg mb-1">
                                          Exclusive Black Subscribers
                                        </label>
                                        <input
                                          type="number"
                                          min="0"
                                          value={editSubscriberLimits.exclusiveBlack || ""}
                                          onChange={(e) => setEditSubscriberLimits({
                                            ...editSubscriberLimits,
                                            exclusiveBlack: parseInt(e.target.value) || 0
                                          })}
                                          className="w-full px-3 py-2 text-sm border border-primary-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-accent bg-primary-bg text-primary-fg"
                                          placeholder="0"
                                        />
                                      </div>
                                      <div>
                                        <label className="block text-xs font-medium text-primary-fg mb-1">
                                          Student Subscribers
                                        </label>
                                        <input
                                          type="number"
                                          min="0"
                                          value={editSubscriberLimits.student || ""}
                                          onChange={(e) => setEditSubscriberLimits({
                                            ...editSubscriberLimits,
                                            student: parseInt(e.target.value) || 0
                                          })}
                                          className="w-full px-3 py-2 text-sm border border-primary-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-accent bg-primary-bg text-primary-fg"
                                          placeholder="0"
                                        />
                                      </div>
                                    </div>
                                    <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                      <p className="text-xs text-blue-800">
                                        <strong>Total Free Subscriber Tickets:</strong> {
                                          editSubscriberLimits.premium +
                                          editSubscriberLimits.diamond +
                                          editSubscriberLimits.exclusiveBlack +
                                          editSubscriberLimits.student
                                        }
                                      </p>
                                    </div>
                                  </div>
                                )}
                              </div>

                              {/* Share Messages Section */}
                              <div className="border-t border-primary-border pt-4">
                                <h3 className="text-sm font-semibold text-primary-fg mb-3">Share Messages (Update Messages)</h3>
                                <p className="text-xs text-primary-muted mb-4">
                                  Custom messages that appear when users share this event. Use {"{eventTitle}"} and {"{eventUrl}"} as placeholders.
                                </p>
                                
                                {loadingShareMessages ? (
                                  <p className="text-sm text-primary-muted italic flex items-center gap-2">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Loading share messages...
                                  </p>
                                ) : (
                                  <div className="space-y-4">
                                    {(['general', 'whatsapp', 'facebook', 'linkedin'] as const).map((platform) => (
                                      <div key={platform} className="border border-primary-border rounded-lg p-4 bg-primary-accent-light">
                                        <label className="block text-xs font-medium text-primary-fg mb-2 capitalize">
                                          {platform === 'general' ? 'General Message (Default)' : `${platform.charAt(0).toUpperCase() + platform.slice(1)} Message`}
                                        </label>
                                        <textarea
                                          value={shareMessages[platform]?.message || ''}
                                          onChange={(e) => {
                                            setShareMessages({
                                              ...shareMessages,
                                              [platform]: {
                                                ...shareMessages[platform],
                                                message: e.target.value,
                                              },
                                            });
                                          }}
                                          placeholder={platform === 'general' 
                                            ? '🎉 Don\'t miss out! Join us at {eventTitle}\n\n✨ Experience something amazing - Book your tickets now!\n\n🔗 {eventUrl}\n\n#TalaashEvents #JaayveeWorld'
                                            : 'Platform-specific message (optional)'
                                          }
                                          rows={4}
                                          className="w-full px-3 py-2 text-sm border border-primary-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-accent bg-primary-bg text-primary-fg resize-y"
                                        />
                                        <p className="text-xs text-primary-muted mt-1">
                                          {platform === 'general' ? 'This message will be used if no platform-specific message is set.' : 'Leave empty to use the general message.'}
                                        </p>
                                      </div>
                                    ))}
                                    <button
                                      type="button"
                                      onClick={async () => {
                                        setSavingShareMessages(true);
                                        try {
                                          for (const [platform, msg] of Object.entries(shareMessages)) {
                                            if (msg.message.trim()) {
                                              const response = await authenticatedFetch(`${API_BASE_URL}/api/events/${event.id}/share-messages`, {
                                                method: 'POST',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({
                                                  message: msg.message,
                                                  platform: msg.platform,
                                                  isActive: true,
                                                }),
                                              });
                                              const data = await response.json();
                                              if (data.success) {
                                                setSuccess(`Share messages saved successfully!`);
                                              }
                                            }
                                          }
                                        } catch (err: any) {
                                          setError(err.message || 'Failed to save share messages');
                                        } finally {
                                          setSavingShareMessages(false);
                                        }
                                      }}
                                      disabled={savingShareMessages}
                                      className="px-4 py-2 bg-primary-accent text-white rounded-lg hover:bg-primary-accent-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                    >
                                      {savingShareMessages ? (
                                        <>
                                          <Loader2 className="h-4 w-4 animate-spin" />
                                          Saving...
                                        </>
                                      ) : (
                                        <>
                                          <Save className="h-4 w-4" />
                                          Save Share Messages
                                        </>
                                      )}
                                    </button>
                                  </div>
                                )}
                              </div>

                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <input
                                    type="checkbox"
                                    id={`published-${event.id}`}
                                    checked={editForm.published ?? event.published}
                                    onChange={(e) => setEditForm({ ...editForm, published: e.target.checked })}
                                    className="w-5 h-5 text-primary-accent border-primary-border rounded focus:ring-primary-accent"
                                  />
                                  <label htmlFor={`published-${event.id}`} className="text-sm text-primary-fg cursor-pointer">
                                    Published
                                  </label>
                                </div>
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => {
                                      // Clean up preview URL
                                      if (previewEditUrl) {
                                        URL.revokeObjectURL(previewEditUrl);
                                      }
                                      setEditingId(null);
                                      setEditForm({});
                                      setEditTicketTypes([]);
                                      setOriginalTicketTypes([]);
                                      setOriginalBanner(null);
                                      setSelectedEditFile(null);
                                      setPreviewEditUrl(null);
                                    }}
                                    className="px-4 py-2 text-sm text-primary-fg bg-primary-border rounded-lg hover:bg-primary-accent-light transition-colors flex items-center gap-2"
                                  >
                                    <X className="h-4 w-4" />
                                    Cancel
                                  </button>
                                  <button
                                    onClick={() => handleUpdate(event.id)}
                                    disabled={updatingId === event.id || uploadingImage}
                                    className="px-4 py-2 text-sm text-white bg-primary-accent rounded-lg hover:bg-primary-accent-dark transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                  >
                                    {updatingId === event.id ? (
                                      <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        {uploadProgress || 'Saving...'}
                                      </>
                                    ) : (
                                      <>
                                        <Save className="h-4 w-4" />
                                        Save
                                      </>
                                    )}
                                  </button>
                                </div>
                              </div>
                            </div>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="py-3 px-4">
                            <div className="font-medium text-primary-fg">{event.title}</div>
                            {event.description && (
                              <div className="text-sm text-primary-muted mt-1 line-clamp-1 whitespace-pre-line">{event.description}</div>
                            )}
                          </td>
                          <td className="py-3 px-4 text-sm text-primary-fg">
                            {new Date(event.startDate).toLocaleString()}
                          </td>
                          <td className="py-3 px-4">
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              event.status === 'upcoming' ? 'bg-blue-100 text-blue-800' :
                              event.status === 'ongoing' ? 'bg-green-100 text-green-800' :
                              event.status === 'completed' ? 'bg-gray-100 text-gray-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {event.status}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex flex-col gap-1">
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              event.published ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                            }`}>
                                {event.published ? 'Published' : event.scheduledPublishAt ? 'Scheduled' : 'Draft'}
                            </span>
                              {event.scheduledPublishAt && !event.published && (
                                <span className="text-xs text-primary-muted">
                                  {new Date(event.scheduledPublishAt).toLocaleString()}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center justify-end gap-2">
                              {event.published ? (
                                <button
                                  onClick={() => handleUnpublish(event.id)}
                                  disabled={publishingId === event.id}
                                  className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors disabled:opacity-50"
                                  title="Unpublish"
                                >
                                  {publishingId === event.id ? (
                                    <Loader2 size={16} className="animate-spin" />
                                  ) : (
                                    <EyeOff size={16} />
                                  )}
                                </button>
                              ) : (
                                <>
                                  <button
                                    onClick={() => handlePublish(event.id)}
                                    disabled={publishingId === event.id}
                                    className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50"
                                    title="Publish Now"
                                  >
                                    {publishingId === event.id ? (
                                      <Loader2 size={16} className="animate-spin" />
                                    ) : (
                                      <Send size={16} />
                                    )}
                                  </button>
                                  <button
                                    onClick={() => openScheduleModal(event.id)}
                                    disabled={publishingId === event.id}
                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
                                    title="Schedule Publish"
                                  >
                                    <Calendar size={16} />
                                  </button>
                                </>
                              )}
                              <button
                                onClick={() => startEdit(event)}
                                className="p-2 text-primary-fg hover:bg-primary-accent-light rounded-lg transition-colors"
                                title="Edit"
                              >
                                <Edit size={16} />
                              </button>
                              <button
                                onClick={() => handleDelete(event.id)}
                                disabled={deletingId === event.id}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                                title="Delete"
                              >
                                {deletingId === event.id ? (
                                  <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                                ) : (
                                  <Trash2 size={16} />
                                )}
                              </button>
                            </div>
                          </td>
                        </>
                      )}
                    </tr>
                    </>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Schedule Publish Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => {
          setShowScheduleModal(false);
          setScheduleEventId(null);
          setScheduledPublishTime("");
        }}>
          <div className="bg-primary-bg rounded-lg p-6 max-w-md w-full mx-4 border border-primary-border shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-semibold text-primary-fg mb-4">Schedule Event Publish</h2>
            <div className="space-y-4">
              <div>
                <label htmlFor="schedule-publish-time" className="block text-sm font-medium text-primary-fg mb-2">
                  Publish Date & Time
                </label>
                <input
                  id="schedule-publish-time"
                  type="datetime-local"
                  value={scheduledPublishTime}
                  onChange={(e) => setScheduledPublishTime(e.target.value)}
                  min={new Date().toISOString().slice(0, 16)}
                  className="w-full px-4 py-2 border-2 border-primary-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-accent focus:border-primary-accent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  style={{ minHeight: '40px' }}
                />
                <p className="text-xs text-primary-muted mt-1">
                  Select when you want this event to be automatically published
                </p>
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => {
                    setShowScheduleModal(false);
                    setScheduleEventId(null);
                    setScheduledPublishTime("");
                  }}
                  className="px-4 py-2 text-sm text-primary-fg bg-primary-border rounded-lg hover:bg-primary-accent-light transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (scheduleEventId && scheduledPublishTime) {
                      handlePublish(scheduleEventId, scheduledPublishTime);
                    }
                  }}
                  disabled={!scheduledPublishTime || publishingId === scheduleEventId}
                  className="px-4 py-2 text-sm text-white bg-primary-accent rounded-lg hover:bg-primary-accent-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {publishingId === scheduleEventId ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Scheduling...
                    </>
                  ) : (
                    <>
                      <Calendar className="h-4 w-4" />
                      Schedule
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


