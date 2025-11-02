"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, MessageSquare, Plus, X, Save, Calendar } from "lucide-react";
import { authenticatedFetch, getAuthToken } from "@/lib/auth-utils";
import { API_BASE_URL } from "@/lib/api";

interface Event {
  id: string;
  title: string;
  slug: string;
}

interface ShareMessage {
  id?: string;
  eventId: string;
  message: string;
  platform: string | null;
  isActive: boolean;
  createdAt?: string;
}

export default function EventShareMessagesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>("");
  const [shareMessages, setShareMessages] = useState<ShareMessage[]>([]);
  const [editingMessage, setEditingMessage] = useState<ShareMessage | null>(null);
  const [newMessage, setNewMessage] = useState<ShareMessage>({
    eventId: "",
    message: "",
    platform: null,
    isActive: true,
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    if (selectedEventId) {
      fetchShareMessages(selectedEventId);
      setNewMessage({ ...newMessage, eventId: selectedEventId });
    }
  }, [selectedEventId]);

  const fetchEvents = async () => {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/api/events?all=true`);
      const data = await response.json();
      
      if (data.success || Array.isArray(data.data)) {
        const eventsList = Array.isArray(data.data) ? data.data : (data.data?.events || []);
        setEvents(eventsList);
        if (eventsList.length > 0 && !selectedEventId) {
          setSelectedEventId(eventsList[0].id);
        }
      }
    } catch (err: any) {
      console.error("Error fetching events:", err);
      setError("Failed to load events");
    } finally {
      setLoading(false);
    }
  };

  const fetchShareMessages = async (eventId: string) => {
    if (!eventId) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/events/${eventId}/share-messages`);
      const data = await response.json();
      
      if (data.success) {
        // Handle both single message and array response
        if (Array.isArray(data.allMessages)) {
          setShareMessages(data.allMessages);
        } else if (data.data) {
          setShareMessages([data.data].filter(Boolean));
        } else {
          setShareMessages([]);
        }
      }
    } catch (err: any) {
      console.error("Error fetching share messages:", err);
    }
  };

  const handleSaveMessage = async (message: ShareMessage) => {
    try {
      setError(null);
      setSuccess(null);

      if (!message.eventId || !message.message) {
        setError("Event and message are required");
        return;
      }

      const response = await authenticatedFetch(
        `${API_BASE_URL}/api/events/${message.eventId}/share-messages`,
        {
          method: "POST",
          body: JSON.stringify({
            message: message.message,
            platform: message.platform || null,
            isActive: message.isActive,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to save share message");
      }

      setSuccess("Share message saved successfully");
      setEditingMessage(null);
      setNewMessage({ eventId: selectedEventId, message: "", platform: null, isActive: true });
      fetchShareMessages(selectedEventId);
      
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error("Error saving share message:", err);
      setError(err.message || "Failed to save share message");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-primary-bg flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary-accent border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-primary-muted">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-primary-bg">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.push("/dashboard")}
            className="flex items-center gap-2 text-primary-muted hover:text-primary-fg transition-colors mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </button>
          <h1 className="text-3xl font-bold text-primary-fg mb-2">Event Share Messages</h1>
          <p className="text-primary-muted">Manage custom share messages for events</p>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-4 bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-sm text-green-800">{success}</p>
          </div>
        )}

        {/* Event Selector */}
        <div className="card mb-6">
          <label className="block text-sm font-medium text-primary-fg mb-2">
            Select Event
          </label>
          <select
            value={selectedEventId}
            onChange={(e) => setSelectedEventId(e.target.value)}
            className="w-full px-4 py-2 border border-primary-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-accent bg-primary-bg text-primary-fg"
          >
            <option value="">-- Select an event --</option>
            {events.map((event) => (
              <option key={event.id} value={event.id}>
                {event.title}
              </option>
            ))}
          </select>
        </div>

        {selectedEventId && (
          <>
            {/* Current Share Messages */}
            <div className="card mb-6">
              <h2 className="text-lg font-semibold text-primary-fg mb-4 flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Share Messages for {events.find(e => e.id === selectedEventId)?.title}
              </h2>

              {shareMessages.length === 0 ? (
                <p className="text-sm text-primary-muted">No share messages configured for this event.</p>
              ) : (
                <div className="space-y-4">
                  {shareMessages.map((msg) => (
                    <div
                      key={msg.id || `${msg.platform || 'general'}`}
                      className="border border-primary-border rounded-lg p-4"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <span className="text-sm font-medium text-primary-fg">
                            {msg.platform ? `${msg.platform.charAt(0).toUpperCase() + msg.platform.slice(1)} Message` : 'General Message'}
                          </span>
                          {!msg.isActive && (
                            <span className="ml-2 text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded">
                              Inactive
                            </span>
                          )}
                        </div>
                        <button
                          onClick={() => setEditingMessage(msg)}
                          className="text-sm text-primary-accent hover:underline"
                        >
                          Edit
                        </button>
                      </div>
                      <p className="text-sm text-primary-muted whitespace-pre-wrap">{msg.message}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Add/Edit Share Message */}
            <div className="card">
              <h2 className="text-lg font-semibold text-primary-fg mb-4 flex items-center gap-2">
                <Plus className="h-5 w-5" />
                {editingMessage ? 'Edit' : 'Add'} Share Message
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-primary-fg mb-2">
                    Platform
                  </label>
                  <select
                    value={editingMessage?.platform || newMessage.platform || ""}
                    onChange={(e) => {
                      const platform = e.target.value || null;
                      if (editingMessage) {
                        setEditingMessage({ ...editingMessage, platform });
                      } else {
                        setNewMessage({ ...newMessage, platform });
                      }
                    }}
                    className="w-full px-4 py-2 border border-primary-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-accent bg-primary-bg text-primary-fg"
                  >
                    <option value="">General (All Platforms)</option>
                    <option value="whatsapp">WhatsApp</option>
                    <option value="facebook">Facebook</option>
                    <option value="linkedin">LinkedIn</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-primary-fg mb-2">
                    Share Message *
                  </label>
                  <textarea
                    rows={6}
                    value={editingMessage?.message || newMessage.message}
                    onChange={(e) => {
                      const message = e.target.value;
                      if (editingMessage) {
                        setEditingMessage({ ...editingMessage, message });
                      } else {
                        setNewMessage({ ...newMessage, message });
                      }
                    }}
                    placeholder="Enter the message that will appear when users share this event..."
                    className="w-full px-4 py-2 border border-primary-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-accent resize-none bg-primary-bg text-primary-fg"
                  />
                  <p className="text-xs text-primary-muted mt-1">
                    This message will appear when users click the share button for this event. You can use event variables like {`{eventTitle}`} or {`{eventUrl}`}.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={editingMessage?.isActive !== false && newMessage.isActive !== false}
                    onChange={(e) => {
                      const isActive = e.target.checked;
                      if (editingMessage) {
                        setEditingMessage({ ...editingMessage, isActive });
                      } else {
                        setNewMessage({ ...newMessage, isActive });
                      }
                    }}
                    className="w-5 h-5 text-primary-accent border-primary-border rounded focus:ring-primary-accent"
                  />
                  <label htmlFor="isActive" className="text-sm text-primary-fg cursor-pointer">
                    Active (message will be used when sharing)
                  </label>
                </div>

                <div className="flex gap-3 pt-4 border-t border-primary-border">
                  {editingMessage && (
                    <button
                      onClick={() => {
                        setEditingMessage(null);
                        setNewMessage({ eventId: selectedEventId, message: "", platform: null, isActive: true });
                      }}
                      className="px-4 py-2 text-sm font-medium text-primary-fg bg-primary-border rounded-lg hover:bg-primary-accent-light transition-colors"
                    >
                      Cancel
                    </button>
                  )}
                  <button
                    onClick={() => {
                      const messageToSave = editingMessage || newMessage;
                      handleSaveMessage({ ...messageToSave, eventId: selectedEventId });
                    }}
                    className="px-4 py-2 text-sm font-medium text-white bg-primary-accent rounded-lg hover:bg-primary-accent-dark transition-colors flex items-center gap-2"
                  >
                    <Save className="h-4 w-4" />
                    {editingMessage ? 'Update' : 'Create'} Message
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}


interface Event {
  id: string;
  title: string;
  slug: string;
}

interface ShareMessage {
  id?: string;
  eventId: string;
  message: string;
  platform: string | null;
  isActive: boolean;
  createdAt?: string;
}

export default function EventShareMessagesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>("");
  const [shareMessages, setShareMessages] = useState<ShareMessage[]>([]);
  const [editingMessage, setEditingMessage] = useState<ShareMessage | null>(null);
  const [newMessage, setNewMessage] = useState<ShareMessage>({
    eventId: "",
    message: "",
    platform: null,
    isActive: true,
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    if (selectedEventId) {
      fetchShareMessages(selectedEventId);
      setNewMessage({ ...newMessage, eventId: selectedEventId });
    }
  }, [selectedEventId]);

  const fetchEvents = async () => {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/api/events?all=true`);
      const data = await response.json();
      
      if (data.success || Array.isArray(data.data)) {
        const eventsList = Array.isArray(data.data) ? data.data : (data.data?.events || []);
        setEvents(eventsList);
        if (eventsList.length > 0 && !selectedEventId) {
          setSelectedEventId(eventsList[0].id);
        }
      }
    } catch (err: any) {
      console.error("Error fetching events:", err);
      setError("Failed to load events");
    } finally {
      setLoading(false);
    }
  };

  const fetchShareMessages = async (eventId: string) => {
    if (!eventId) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/events/${eventId}/share-messages`);
      const data = await response.json();
      
      if (data.success) {
        // Handle both single message and array response
        if (Array.isArray(data.allMessages)) {
          setShareMessages(data.allMessages);
        } else if (data.data) {
          setShareMessages([data.data].filter(Boolean));
        } else {
          setShareMessages([]);
        }
      }
    } catch (err: any) {
      console.error("Error fetching share messages:", err);
    }
  };

  const handleSaveMessage = async (message: ShareMessage) => {
    try {
      setError(null);
      setSuccess(null);

      if (!message.eventId || !message.message) {
        setError("Event and message are required");
        return;
      }

      const response = await authenticatedFetch(
        `${API_BASE_URL}/api/events/${message.eventId}/share-messages`,
        {
          method: "POST",
          body: JSON.stringify({
            message: message.message,
            platform: message.platform || null,
            isActive: message.isActive,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to save share message");
      }

      setSuccess("Share message saved successfully");
      setEditingMessage(null);
      setNewMessage({ eventId: selectedEventId, message: "", platform: null, isActive: true });
      fetchShareMessages(selectedEventId);
      
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error("Error saving share message:", err);
      setError(err.message || "Failed to save share message");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-primary-bg flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary-accent border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-primary-muted">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-primary-bg">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.push("/dashboard")}
            className="flex items-center gap-2 text-primary-muted hover:text-primary-fg transition-colors mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </button>
          <h1 className="text-3xl font-bold text-primary-fg mb-2">Event Share Messages</h1>
          <p className="text-primary-muted">Manage custom share messages for events</p>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-4 bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-sm text-green-800">{success}</p>
          </div>
        )}

        {/* Event Selector */}
        <div className="card mb-6">
          <label className="block text-sm font-medium text-primary-fg mb-2">
            Select Event
          </label>
          <select
            value={selectedEventId}
            onChange={(e) => setSelectedEventId(e.target.value)}
            className="w-full px-4 py-2 border border-primary-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-accent bg-primary-bg text-primary-fg"
          >
            <option value="">-- Select an event --</option>
            {events.map((event) => (
              <option key={event.id} value={event.id}>
                {event.title}
              </option>
            ))}
          </select>
        </div>

        {selectedEventId && (
          <>
            {/* Current Share Messages */}
            <div className="card mb-6">
              <h2 className="text-lg font-semibold text-primary-fg mb-4 flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Share Messages for {events.find(e => e.id === selectedEventId)?.title}
              </h2>

              {shareMessages.length === 0 ? (
                <p className="text-sm text-primary-muted">No share messages configured for this event.</p>
              ) : (
                <div className="space-y-4">
                  {shareMessages.map((msg) => (
                    <div
                      key={msg.id || `${msg.platform || 'general'}`}
                      className="border border-primary-border rounded-lg p-4"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <span className="text-sm font-medium text-primary-fg">
                            {msg.platform ? `${msg.platform.charAt(0).toUpperCase() + msg.platform.slice(1)} Message` : 'General Message'}
                          </span>
                          {!msg.isActive && (
                            <span className="ml-2 text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded">
                              Inactive
                            </span>
                          )}
                        </div>
                        <button
                          onClick={() => setEditingMessage(msg)}
                          className="text-sm text-primary-accent hover:underline"
                        >
                          Edit
                        </button>
                      </div>
                      <p className="text-sm text-primary-muted whitespace-pre-wrap">{msg.message}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Add/Edit Share Message */}
            <div className="card">
              <h2 className="text-lg font-semibold text-primary-fg mb-4 flex items-center gap-2">
                <Plus className="h-5 w-5" />
                {editingMessage ? 'Edit' : 'Add'} Share Message
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-primary-fg mb-2">
                    Platform
                  </label>
                  <select
                    value={editingMessage?.platform || newMessage.platform || ""}
                    onChange={(e) => {
                      const platform = e.target.value || null;
                      if (editingMessage) {
                        setEditingMessage({ ...editingMessage, platform });
                      } else {
                        setNewMessage({ ...newMessage, platform });
                      }
                    }}
                    className="w-full px-4 py-2 border border-primary-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-accent bg-primary-bg text-primary-fg"
                  >
                    <option value="">General (All Platforms)</option>
                    <option value="whatsapp">WhatsApp</option>
                    <option value="facebook">Facebook</option>
                    <option value="linkedin">LinkedIn</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-primary-fg mb-2">
                    Share Message *
                  </label>
                  <textarea
                    rows={6}
                    value={editingMessage?.message || newMessage.message}
                    onChange={(e) => {
                      const message = e.target.value;
                      if (editingMessage) {
                        setEditingMessage({ ...editingMessage, message });
                      } else {
                        setNewMessage({ ...newMessage, message });
                      }
                    }}
                    placeholder="Enter the message that will appear when users share this event..."
                    className="w-full px-4 py-2 border border-primary-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-accent resize-none bg-primary-bg text-primary-fg"
                  />
                  <p className="text-xs text-primary-muted mt-1">
                    This message will appear when users click the share button for this event. You can use event variables like {`{eventTitle}`} or {`{eventUrl}`}.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={editingMessage?.isActive !== false && newMessage.isActive !== false}
                    onChange={(e) => {
                      const isActive = e.target.checked;
                      if (editingMessage) {
                        setEditingMessage({ ...editingMessage, isActive });
                      } else {
                        setNewMessage({ ...newMessage, isActive });
                      }
                    }}
                    className="w-5 h-5 text-primary-accent border-primary-border rounded focus:ring-primary-accent"
                  />
                  <label htmlFor="isActive" className="text-sm text-primary-fg cursor-pointer">
                    Active (message will be used when sharing)
                  </label>
                </div>

                <div className="flex gap-3 pt-4 border-t border-primary-border">
                  {editingMessage && (
                    <button
                      onClick={() => {
                        setEditingMessage(null);
                        setNewMessage({ eventId: selectedEventId, message: "", platform: null, isActive: true });
                      }}
                      className="px-4 py-2 text-sm font-medium text-primary-fg bg-primary-border rounded-lg hover:bg-primary-accent-light transition-colors"
                    >
                      Cancel
                    </button>
                  )}
                  <button
                    onClick={() => {
                      const messageToSave = editingMessage || newMessage;
                      handleSaveMessage({ ...messageToSave, eventId: selectedEventId });
                    }}
                    className="px-4 py-2 text-sm font-medium text-white bg-primary-accent rounded-lg hover:bg-primary-accent-dark transition-colors flex items-center gap-2"
                  >
                    <Save className="h-4 w-4" />
                    {editingMessage ? 'Update' : 'Create'} Message
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}



