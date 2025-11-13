"use client";

import { useState, useEffect } from "react";
import { Calendar as CalendarIcon, Plus, Edit, Trash2, Save, X, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { authenticatedFetch, getTeamSession } from "@/lib/auth-utils";
import { useRouter } from "next/navigation";
import { API_BASE_URL } from "@/lib/api";

interface CalendarBlock {
  id: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  date: string;
  type: 'event' | 'festival' | 'block';
  color?: string;
  createdBy?: string;
}

interface Festival {
  id: string;
  name: string;
  date: string;
  description?: string;
  isRecurring: boolean;
}

export default function CalendarPage() {
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [blocks, setBlocks] = useState<CalendarBlock[]>([]);
  const [festivals, setFestivals] = useState<Festival[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBlockForm, setShowBlockForm] = useState(false);
  const [editingBlock, setEditingBlock] = useState<CalendarBlock | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [blockForm, setBlockForm] = useState({
    title: "",
    description: "",
    startTime: "",
    endTime: "",
    date: "",
    type: "block" as "event" | "festival" | "block",
    color: "#3b82f6"
  });
  const [showFestivalForm, setShowFestivalForm] = useState(false);
  const [festivalForm, setFestivalForm] = useState({
    name: "",
    date: "",
    description: "",
    isRecurring: false
  });

  // API base URL is imported from lib/api.ts (uses localhost:3000 in dev, talaash.thejaayveeworld.com in prod)

  useEffect(() => {
    fetchBlocks();
    fetchFestivals();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentDate]);

  const fetchBlocks = async () => {
    try {
      setLoading(true);
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1;
      const baseUrl = API_BASE_URL || (typeof window !== 'undefined' ? window.location.origin : '');
      const response = await authenticatedFetch(`${baseUrl}/api/calendar/blocks?year=${year}&month=${month}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setBlocks(data.data || []);
        }
      }
    } catch (error) {
      console.error("Error fetching blocks:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFestivals = async () => {
    try {
      const baseUrl = API_BASE_URL || (typeof window !== 'undefined' ? window.location.origin : '');
      const response = await authenticatedFetch(`${baseUrl}/api/calendar/festivals`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setFestivals(data.data || []);
        }
      }
    } catch (error) {
      console.error("Error fetching festivals:", error);
    }
  };

  const handleSaveBlock = async () => {
    try {
      const baseUrl = API_BASE_URL || (typeof window !== 'undefined' ? window.location.origin : '');
      const url = editingBlock
        ? `${baseUrl}/api/calendar/blocks/${editingBlock.id}`
        : `${baseUrl}/api/calendar/blocks`;
      
      const method = editingBlock ? "PUT" : "POST";
      
      const response = await authenticatedFetch(url, {
        method,
        body: JSON.stringify(blockForm),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to save block");
      }

      setShowBlockForm(false);
      setEditingBlock(null);
      setBlockForm({
        title: "",
        description: "",
        startTime: "",
        endTime: "",
        date: "",
        type: "block",
        color: "#3b82f6"
      });
      fetchBlocks();
    } catch (error: any) {
      console.error("Error saving block:", error);
      alert(error.message || "Failed to save block");
    }
  };

  const handleDeleteBlock = async (id: string) => {
    if (!confirm("Are you sure you want to delete this block?")) return;

    try {
      const baseUrl = API_BASE_URL || (typeof window !== 'undefined' ? window.location.origin : '');
      const response = await authenticatedFetch(`${baseUrl}/api/calendar/blocks/${id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to delete block");
      }

      fetchBlocks();
    } catch (error: any) {
      console.error("Error deleting block:", error);
      alert(error.message || "Failed to delete block");
    }
  };

  const handleSaveFestival = async () => {
    try {
      const baseUrl = API_BASE_URL || (typeof window !== 'undefined' ? window.location.origin : '');
      const response = await authenticatedFetch(`${baseUrl}/api/calendar/festivals`, {
        method: "POST",
        body: JSON.stringify(festivalForm),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to save festival");
      }

      setShowFestivalForm(false);
      setFestivalForm({
        name: "",
        date: "",
        description: "",
        isRecurring: false
      });
      fetchFestivals();
    } catch (error: any) {
      console.error("Error saving festival:", error);
      alert(error.message || "Failed to save festival");
    }
  };

  const startEditBlock = (block: CalendarBlock) => {
    setEditingBlock(block);
    setBlockForm({
      title: block.title,
      description: block.description || "",
      startTime: block.startTime,
      endTime: block.endTime,
      date: block.date,
      type: block.type,
      color: block.color || "#3b82f6"
    });
    setShowBlockForm(true);
  };

  const openBlockForm = (date: string) => {
    setSelectedDate(date);
    setBlockForm({
      title: "",
      description: "",
      startTime: "09:00",
      endTime: "10:00",
      date: date,
      type: "block",
      color: "#3b82f6"
    });
    setEditingBlock(null);
    setShowBlockForm(true);
  };

  const navigateMonth = (direction: number) => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + direction, 1));
  };

  const getDaysInMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }
    return days;
  };

  const formatDate = (day: number) => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1;
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  };

  const getBlocksForDate = (date: string) => {
    return blocks.filter(b => b.date === date);
  };

  const getFestivalsForDate = (date: string) => {
    const [year, month, day] = date.split('-').map(Number);
    return festivals.filter(f => {
      if (f.isRecurring) {
        const festivalDate = new Date(f.date);
        return festivalDate.getMonth() + 1 === month && festivalDate.getDate() === day;
      }
      return f.date === date;
    });
  };

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-primary-fg">Calendar</h1>
          <p className="text-primary-muted mt-1">Schedule blocks and mark festivals</p>
        </div>
        <div className="flex gap-2">
         
          <button
            onClick={() => setShowFestivalForm(true)}
            className="btn-secondary flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Festival
          </button>
          <button
            onClick={() => openBlockForm(selectedDate || formatDate(new Date().getDate()))}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Block
          </button>
        </div>
      </div>

      {/* Calendar */}
      <div className="card">
        <div className="flex justify-between items-center mb-6">
          <button
            onClick={() => navigateMonth(-1)}
            className="p-2 hover:bg-primary-accent-light rounded-lg"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-semibold text-primary-fg">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h2>
            {loading && <Loader2 className="h-4 w-4 animate-spin text-primary-muted" />}
          </div>
          <button
            onClick={() => navigateMonth(1)}
            className="p-2 hover:bg-primary-accent-light rounded-lg"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-2">
          {/* Day headers */}
          {dayNames.map(day => (
            <div key={day} className="text-center text-sm font-semibold text-primary-muted py-2">
              {day}
            </div>
          ))}

          {/* Calendar days */}
          {getDaysInMonth().map((day, idx) => {
            if (day === null) {
              return <div key={`empty-${idx}`} className="aspect-square" />;
            }

            const date = formatDate(day);
            const dayBlocks = getBlocksForDate(date);
            const dayFestivals = getFestivalsForDate(date);
            const today = new Date();
            const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
            const isToday = date === todayStr;

            return (
              <div
                key={day}
                onClick={() => {
                  setSelectedDate(date);
                  openBlockForm(date);
                }}
                className={`aspect-square border border-primary-border rounded-lg p-2 cursor-pointer hover:bg-primary-accent-light transition-colors ${
                  isToday ? "bg-blue-50 border-blue-300" : ""
                }`}
              >
                <div className={`text-sm font-medium mb-1 ${isToday ? "text-blue-600" : "text-primary-fg"}`}>
                  {day}
                </div>
                <div className="space-y-1">
                  {dayFestivals.map(festival => (
                    <div
                      key={festival.id}
                      className="text-xs px-1 py-0.5 bg-yellow-100 text-yellow-800 rounded truncate"
                      title={festival.name}
                    >
                      🎉 {festival.name}
                    </div>
                  ))}
                  {dayBlocks.slice(0, 2).map(block => (
                    <div
                      key={block.id}
                      className="text-xs px-1 py-0.5 rounded truncate"
                      style={{ backgroundColor: block.color + "20", color: block.color }}
                      title={block.title}
                      onClick={(e) => {
                        e.stopPropagation();
                        startEditBlock(block);
                      }}
                    >
                      {block.title}
                    </div>
                  ))}
                  {dayBlocks.length > 2 && (
                    <div className="text-xs text-primary-muted">
                      +{dayBlocks.length - 2} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Block Form Modal */}
      {showBlockForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-primary-fg mb-4">
              {editingBlock ? "Edit Block" : "Add Block"}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-primary-fg mb-2">Title *</label>
                <input
                  type="text"
                  value={blockForm.title}
                  onChange={(e) => setBlockForm({ ...blockForm, title: e.target.value })}
                  className="w-full px-4 py-2 border border-primary-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-accent bg-primary-bg text-primary-fg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-primary-fg mb-2">Date *</label>
                <input
                  type="date"
                  value={blockForm.date}
                  onChange={(e) => setBlockForm({ ...blockForm, date: e.target.value })}
                  className="w-full px-4 py-2 border border-primary-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-accent bg-primary-bg text-primary-fg"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-primary-fg mb-2">Start Time *</label>
                  <input
                    type="time"
                    value={blockForm.startTime}
                    onChange={(e) => setBlockForm({ ...blockForm, startTime: e.target.value })}
                    className="w-full px-4 py-2 border border-primary-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-accent bg-primary-bg text-primary-fg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-primary-fg mb-2">End Time *</label>
                  <input
                    type="time"
                    value={blockForm.endTime}
                    onChange={(e) => setBlockForm({ ...blockForm, endTime: e.target.value })}
                    className="w-full px-4 py-2 border border-primary-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-accent bg-primary-bg text-primary-fg"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-primary-fg mb-2">Description</label>
                <textarea
                  rows={3}
                  value={blockForm.description}
                  onChange={(e) => setBlockForm({ ...blockForm, description: e.target.value })}
                  className="w-full px-4 py-2 border border-primary-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-accent bg-primary-bg text-primary-fg resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-primary-fg mb-2">Color</label>
                <input
                  type="color"
                  value={blockForm.color}
                  onChange={(e) => setBlockForm({ ...blockForm, color: e.target.value })}
                  className="w-full h-10 border border-primary-border rounded-lg"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => {
                    setShowBlockForm(false);
                    setEditingBlock(null);
                  }}
                  className="px-4 py-2 text-primary-fg border border-primary-border rounded-lg hover:bg-primary-accent-light"
                >
                  Cancel
                </button>
                {editingBlock && (
                  <button
                    onClick={() => handleDeleteBlock(editingBlock.id)}
                    className="px-4 py-2 text-red-600 border border-red-300 rounded-lg hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4 inline mr-1" />
                    Delete
                  </button>
                )}
                <button
                  onClick={handleSaveBlock}
                  disabled={!blockForm.title || !blockForm.date || !blockForm.startTime || !blockForm.endTime}
                  className="btn-primary flex items-center gap-2 disabled:opacity-50"
                >
                  <Save className="h-4 w-4" />
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Festival Form Modal */}
      {showFestivalForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-primary-fg mb-4">Add Festival</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-primary-fg mb-2">Festival Name *</label>
                <input
                  type="text"
                  value={festivalForm.name}
                  onChange={(e) => setFestivalForm({ ...festivalForm, name: e.target.value })}
                  className="w-full px-4 py-2 border border-primary-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-accent bg-primary-bg text-primary-fg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-primary-fg mb-2">Date *</label>
                <input
                  type="date"
                  value={festivalForm.date}
                  onChange={(e) => setFestivalForm({ ...festivalForm, date: e.target.value })}
                  className="w-full px-4 py-2 border border-primary-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-accent bg-primary-bg text-primary-fg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-primary-fg mb-2">Description</label>
                <textarea
                  rows={3}
                  value={festivalForm.description}
                  onChange={(e) => setFestivalForm({ ...festivalForm, description: e.target.value })}
                  className="w-full px-4 py-2 border border-primary-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-accent bg-primary-bg text-primary-fg resize-none"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isRecurring"
                  checked={festivalForm.isRecurring}
                  onChange={(e) => setFestivalForm({ ...festivalForm, isRecurring: e.target.checked })}
                  className="w-4 h-4"
                />
                <label htmlFor="isRecurring" className="text-sm text-primary-fg">
                  Recurring (same date every year)
                </label>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowFestivalForm(false)}
                  className="px-4 py-2 text-primary-fg border border-primary-border rounded-lg hover:bg-primary-accent-light"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveFestival}
                  disabled={!festivalForm.name || !festivalForm.date}
                  className="btn-primary flex items-center gap-2 disabled:opacity-50"
                >
                  <Save className="h-4 w-4" />
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


