'use client';

import React, { useState, useEffect } from 'react';
import { Copy, Check, Tag, Percent, Calendar, Users, Hash, Edit, X, Trash2 } from 'lucide-react';
import { fetchAPI, API_ENDPOINTS, API_BASE_URL } from '@/lib/api';
import { authenticatedFetch } from '@/lib/auth-utils';

interface Coupon {
  id?: string;
  code: string;
  name: string;
  discount: number;
  discountType: 'percentage' | 'fixed';
  usageLimit: number;
  usedCount: number;
  validFrom: string;
  validUntil: string;
  applicableTo: 'all' | 'event' | 'category';
  eventId?: string;
  category?: string;
  onlyForStudent?: boolean;
  status?: string;
}

interface Event {
  id: string;
  title: string;
  slug?: string;
}

export default function CouponGeneratorPage() {
  const [generatedCoupons, setGeneratedCoupons] = useState<Coupon[]>([]);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [events, setEvents] = useState<Event[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(false);

  // Load existing coupons on mount
  useEffect(() => {
    const loadCoupons = async () => {
      try {
        console.log('Loading coupons from:', `${API_BASE_URL}${API_ENDPOINTS.COUPONS}`);
        const response = await authenticatedFetch(`${API_BASE_URL}${API_ENDPOINTS.COUPONS}`);
        const data = await response.json();
        if (data.success) {
          setGeneratedCoupons(data.data);
        }
      } catch (error) {
        console.error('Failed to load coupons:', error);
        // Load dummy data if API fails
        loadDummyCoupons();
      }
    };
    
    loadCoupons();
  }, []);

  // Load events for event-specific coupons
  useEffect(() => {
    const loadEvents = async () => {
      setLoadingEvents(true);
      try {
        const response = await authenticatedFetch(`${API_BASE_URL}/api/events?limit=1000`);
        const data = await response.json();
        if (data.success && data.data) {
          setEvents(data.data);
        }
      } catch (error) {
        console.error('Failed to load events:', error);
      } finally {
        setLoadingEvents(false);
      }
    };
    
    loadEvents();
  }, []);

  // Load dummy coupons for demonstration
  const loadDummyCoupons = () => {
    const dummyCoupons: Coupon[] = [
      {
        code: 'EVT2024SAVE',
        name: 'Event 2024 Special',
        discount: 20,
        discountType: 'percentage',
        usageLimit: 100,
        usedCount: 15,
        validFrom: new Date().toISOString().split('T')[0],
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        applicableTo: 'all',
        eventId: undefined,
        category: undefined,
      },
      {
        code: 'SUMMER50',
        name: 'Summer Festival Discount',
        discount: 50,
        discountType: 'fixed',
        usageLimit: 50,
        usedCount: 8,
        validFrom: new Date().toISOString().split('T')[0],
        validUntil: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        applicableTo: 'event',
        eventId: 'event-1',
        category: undefined,
      },
      {
        code: 'EARLYBIRD',
        name: 'Early Bird Workshop',
        discount: 15,
        discountType: 'percentage',
        usageLimit: 200,
        usedCount: 45,
        validFrom: new Date().toISOString().split('T')[0],
        validUntil: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        applicableTo: 'category',
        eventId: undefined,
        category: 'workshop',
      },
      {
        code: 'VIP100',
        name: 'VIP Exclusive Offer',
        discount: 100,
        discountType: 'fixed',
        usageLimit: 10,
        usedCount: 3,
        validFrom: new Date().toISOString().split('T')[0],
        validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        applicableTo: 'all',
        eventId: undefined,
        category: undefined,
      },
      {
        code: 'STUDENT25',
        name: 'Student Special',
        discount: 25,
        discountType: 'percentage',
        usageLimit: 500,
        usedCount: 120,
        validFrom: new Date().toISOString().split('T')[0],
        validUntil: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        applicableTo: 'all',
        eventId: undefined,
        category: undefined,
      }
    ];
    
    setGeneratedCoupons(dummyCoupons);
  };
  const [formData, setFormData] = useState({
    discount: '',
    discountType: 'percentage' as 'percentage' | 'fixed',
    usageLimit: '',
    validFrom: new Date().toISOString().split('T')[0],
    validUntil: '',
    applicableTo: 'all' as 'all' | 'event' | 'category',
    eventId: '',
    category: '',
    quantity: '1',
    onlyForStudent: false,
  });

  const generateCouponCode = (): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = 'EVT';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  const handleGenerate = async () => {
    const quantity = parseInt(formData.quantity) || 1;
    const newCoupons: Coupon[] = [];

    for (let i = 0; i < quantity; i++) {
      const code = generateCouponCode();
      
      newCoupons.push({
        code,
        name: code, // Use code as name
        discount: parseFloat(formData.discount) || 0,
        discountType: formData.discountType,
        usageLimit: parseInt(formData.usageLimit) || 100,
        usedCount: 0,
        validFrom: formData.validFrom,
        validUntil: formData.validUntil || formData.validFrom,
        applicableTo: formData.applicableTo,
        eventId: formData.eventId || undefined,
        category: formData.category || undefined,
        onlyForStudent: formData.onlyForStudent,
      } as any);
    }

    // Save to database via API
    try {
      for (const coupon of newCoupons) {
        const response = await authenticatedFetch(`${API_BASE_URL}${API_ENDPOINTS.COUPONS}`, {
          method: 'POST',
          body: JSON.stringify(coupon),
        });
        const data = await response.json();
        if (data.success && data.data) {
          // Update coupon with the ID from the response
          coupon.id = data.data.id;
        }
      }
      
      // Reload coupons from API to get all with IDs
      const response = await authenticatedFetch(`${API_BASE_URL}${API_ENDPOINTS.COUPONS}`);
      const data = await response.json();
      if (data.success) {
        setGeneratedCoupons(data.data);
      } else {
        setGeneratedCoupons([...generatedCoupons, ...newCoupons]);
      }
    } catch (error) {
      console.error('Failed to save coupons:', error);
      // If API fails, still add to local state for demonstration
      setGeneratedCoupons([...generatedCoupons, ...newCoupons]);
      console.log('Coupons added to local state (API unavailable)');
    }
  };

  const handleCopy = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const handleEdit = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    setIsEditModalOpen(true);
  };

  const handleUpdate = async () => {
    if (!editingCoupon || !editingCoupon.id) return;

    try {
      const updateData = {
        id: editingCoupon.id,
        name: editingCoupon.name,
        discount: editingCoupon.discount,
        discountType: editingCoupon.discountType,
        usageLimit: editingCoupon.usageLimit,
        validFrom: editingCoupon.validFrom,
        validUntil: editingCoupon.validUntil,
        applicableTo: editingCoupon.applicableTo,
        eventId: editingCoupon.eventId || null,
        category: editingCoupon.category || null,
        onlyForStudent: editingCoupon.onlyForStudent || false,
      };

      const response = await authenticatedFetch(`${API_BASE_URL}${API_ENDPOINTS.COUPONS}`, {
        method: 'PUT',
        body: JSON.stringify(updateData),
      });

      const data = await response.json();
      if (data.success) {
        // Update the coupon in the list
        setGeneratedCoupons(generatedCoupons.map(c => 
          c.id === editingCoupon.id ? data.data : c
        ));
        setIsEditModalOpen(false);
        setEditingCoupon(null);
      }
    } catch (error) {
      console.error('Failed to update coupon:', error);
      alert('Failed to update coupon. Please try again.');
    }
  };

  const handleDelete = async (coupon: Coupon) => {
    if (!confirm('Are you sure you want to delete this coupon? This action cannot be undone.')) {
      return;
    }

    // If coupon has an ID, delete from database
    if (coupon.id) {
      try {
        const response = await authenticatedFetch(`${API_BASE_URL}${API_ENDPOINTS.COUPONS}?id=${coupon.id}`, {
          method: 'DELETE',
        });

        const data = await response.json();
        if (data.success) {
          // Remove coupon from list
          setGeneratedCoupons(generatedCoupons.filter(c => c.id !== coupon.id));
          alert('Coupon deleted successfully');
        } else {
          alert(data.error || 'Failed to delete coupon');
        }
      } catch (error) {
        console.error('Failed to delete coupon:', error);
        alert('Failed to delete coupon. Please try again.');
      }
    } else {
      // If no ID, just remove from local state (not yet saved to database)
      setGeneratedCoupons(generatedCoupons.filter(c => c.code !== coupon.code));
      alert('Coupon removed');
    }
  };

  const handleExport = () => {
    const csv = [
      ['Code', 'Discount', 'Type', 'Usage Limit', 'Valid From', 'Valid Until', 'Applicable To'],
      ...generatedCoupons.map(c => [
        c.code,
        c.discount.toString(),
        c.discountType,
        c.usageLimit.toString(),
        c.validFrom,
        c.validUntil,
        c.applicableTo,
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'coupons.csv';
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-primary-fg mb-2">Coupon Code Generator</h1>
        <p className="text-primary-muted">Create discount codes for events and campaigns</p>
      </div>

      {/* Form */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Generated Coupons */}
        <div className="card space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-primary-fg flex items-center gap-2">
              <Check className="text-primary-accent" size={20} />
              Generated Coupons
            </h2>
            <div className="flex gap-2">
              {generatedCoupons.length === 0 && (
                <button
                  onClick={loadDummyCoupons}
                  className="px-4 py-2 bg-gray-500 text-white rounded-xl hover:bg-gray-600 transition-colors text-sm"
                >
                  Load Demo Data
                </button>
              )}
              {generatedCoupons.length > 0 && (
                <button
                  onClick={handleExport}
                  className="px-4 py-2 bg-primary-accent text-white rounded-xl hover:bg-primary-accent-dark transition-colors text-sm"
                >
                  Export CSV
                </button>
              )}
            </div>
          </div>

          {generatedCoupons.length === 0 ? (
            <div className="text-center py-12 text-primary-muted">
              <Tag size={48} className="mx-auto mb-4 opacity-20" />
              <p>No coupons generated yet</p>
              <p className="text-sm">Fill in the form and click &quot;Generate Coupons&quot;</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {generatedCoupons.map((coupon, index) => (
                <div
                  key={index}
                  className="border border-primary-border rounded-xl p-4 hover:bg-primary-accent-light transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Hash className="text-primary-accent" size={20} />
                      <div>
                        <code className="text-lg font-mono font-bold text-primary-fg">
                          {coupon.code}
                        </code>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {coupon.id && (
                        <button
                          onClick={() => handleEdit(coupon)}
                          className="p-2 hover:bg-primary-accent-light rounded-lg transition-colors"
                          title="Edit coupon"
                        >
                          <Edit size={16} className="text-primary-muted" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(coupon)}
                        className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                        title="Delete coupon"
                      >
                        <Trash2 size={16} className="text-red-500" />
                      </button>
                      <button
                        onClick={() => handleCopy(coupon.code)}
                        className="p-2 hover:bg-primary-accent-light rounded-lg transition-colors"
                        title="Copy code"
                      >
                        <Copy size={16} className="text-primary-muted" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Percent size={14} className="text-primary-accent" />
                      <span className="text-primary-fg">
                        {coupon.discount}
                        {coupon.discountType === 'percentage' ? '%' : '₹'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users size={14} className="text-primary-accent" />
                      <span className="text-primary-fg">
                        {coupon.usedCount}/{coupon.usageLimit} used
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar size={14} className="text-primary-accent" />
                      <span className="text-primary-muted">
                        From: {new Date(coupon.validFrom).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar size={14} className="text-primary-accent" />
                      <span className="text-primary-muted">
                        Until: {new Date(coupon.validUntil).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  {coupon.applicableTo === 'event' && coupon.eventId && (
                    <div className="mt-2 text-xs text-primary-muted flex items-center gap-1">
                      <Calendar size={12} />
                      Event-specific coupon
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column - Form */}
        <div className="card space-y-4">
          <h2 className="text-xl font-semibold text-primary-fg flex items-center gap-2">
            <Tag className="text-primary-accent" size={20} />
            Generate Coupons
          </h2>

          <div className="space-y-4">
            {/* Discount Amount */}
            <div>
              <label className="block text-sm font-medium text-primary-fg mb-2">
                Discount Amount
              </label>
              <input
                type="number"
                value={formData.discount}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, discount: e.target.value })}
                className="w-full px-4 py-2 border border-primary-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-accent"
                placeholder="Enter discount amount"
                min="0"
              />
            </div>

            {/* Discount Type */}
            <div>
              <label className="block text-sm font-medium text-primary-fg mb-2">
                Discount Type
              </label>
              <div className="flex gap-3">
                <button
                  onClick={() => setFormData({ ...formData, discountType: 'percentage' })}
                  className={`flex-1 px-4 py-2 rounded-xl border transition-colors ${
                    formData.discountType === 'percentage'
                      ? 'bg-primary-accent text-white'
                      : 'border-primary-border text-primary-fg'
                  }`}
                >
                  <Percent size={16} className="inline mr-2" />
                  Percentage
                </button>
                <button
                  onClick={() => setFormData({ ...formData, discountType: 'fixed' })}
                  className={`flex-1 px-4 py-2 rounded-xl border transition-colors ${
                    formData.discountType === 'fixed'
                      ? 'bg-primary-accent text-white'
                      : 'border-primary-border text-primary-fg'
                  }`}
                >
                  <Hash size={16} className="inline mr-2" />
                  Fixed Amount
                </button>
              </div>
            </div>

            {/* Usage Limit */}
            <div>
              <label className="block text-sm font-medium text-primary-fg mb-2">
                Usage Limit
              </label>
              <input
                type="number"
                value={formData.usageLimit}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, usageLimit: e.target.value })}
                className="w-full px-4 py-2 border border-primary-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-accent"
                placeholder="100"
                min="1"
              />
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-primary-fg mb-2">
                  Valid From
                </label>
                <input
                  type="date"
                  value={formData.validFrom}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, validFrom: e.target.value })}
                  className="w-full px-4 py-2 border border-primary-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-accent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-primary-fg mb-2">
                  Valid Until
                </label>
                <input
                  type="date"
                  value={formData.validUntil}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, validUntil: e.target.value })}
                  className="w-full px-4 py-2 border border-primary-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-accent"
                  min={formData.validFrom}
                />
              </div>
            </div>

            {/* Applicable To */}
            <div>
              <label className="block text-sm font-medium text-primary-fg mb-2">
                Applicable To
              </label>
              <div className="flex gap-3">
                <button
                  onClick={() => setFormData({ ...formData, applicableTo: 'all', eventId: '', category: '' })}
                  className={`flex-1 px-4 py-2 rounded-xl border transition-colors ${
                    formData.applicableTo === 'all'
                      ? 'bg-primary-accent text-white'
                      : 'border-primary-border text-primary-fg'
                  }`}
                >
                  All Events
                </button>
                <button
                  onClick={() => setFormData({ ...formData, applicableTo: 'event', category: '' })}
                  className={`flex-1 px-4 py-2 rounded-xl border transition-colors ${
                    formData.applicableTo === 'event'
                      ? 'bg-primary-accent text-white'
                      : 'border-primary-border text-primary-fg'
                  }`}
                >
                  Specific Event
                </button>
                <button
                  onClick={() => setFormData({ ...formData, applicableTo: 'category', eventId: '' })}
                  className={`flex-1 px-4 py-2 rounded-xl border transition-colors ${
                    formData.applicableTo === 'category'
                      ? 'bg-primary-accent text-white'
                      : 'border-primary-border text-primary-fg'
                  }`}
                >
                  Category
                </button>
              </div>
            </div>

            {/* Event Selection - Show when applicableTo is 'event' */}
            {formData.applicableTo === 'event' && (
              <div>
                <label className="block text-sm font-medium text-primary-fg mb-2">
                  Select Event *
                </label>
                {loadingEvents ? (
                  <div className="w-full px-4 py-2 border border-primary-border rounded-xl text-primary-muted">
                    Loading events...
                  </div>
                ) : (
                  <select
                    value={formData.eventId}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFormData({ ...formData, eventId: e.target.value })}
                    className="w-full px-4 py-2 border border-primary-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-accent bg-primary-bg text-primary-fg"
                    required
                  >
                    <option value="">-- Select an event --</option>
                    {events.map((event) => (
                      <option key={event.id} value={event.id}>
                        {event.title}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )}

            {/* Category Selection - Show when applicableTo is 'category' */}
            {formData.applicableTo === 'category' && (
              <div>
                <label className="block text-sm font-medium text-primary-fg mb-2">
                  Category
                </label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-2 border border-primary-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-accent"
                  placeholder="Enter category name"
                />
              </div>
            )}

            {/* Quantity */}
            <div>
              <label className="block text-sm font-medium text-primary-fg mb-2">
                Number of Codes to Generate
              </label>
              <input
                type="number"
                value={formData.quantity}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, quantity: e.target.value })}
                className="w-full px-4 py-2 border border-primary-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-accent"
                placeholder="1"
                min="1"
                max="100"
              />
            </div>

            {/* Only for Student Checkbox */}
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="onlyForStudent"
                checked={formData.onlyForStudent}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, onlyForStudent: e.target.checked })}
                className="w-5 h-5 border border-primary-border rounded focus:ring-2 focus:ring-primary-accent text-primary-accent"
              />
              <label htmlFor="onlyForStudent" className="text-sm font-medium text-primary-fg cursor-pointer">
                Only for Student (requires student ID verification)
              </label>
            </div>

            {/* Generate Button */}
            <button
              onClick={handleGenerate}
              className="w-full btn-primary flex items-center justify-center gap-2"
            >
              <Tag size={18} />
              Generate Coupons
            </button>
          </div>
        </div>

      </div>

      {/* Edit Modal */}
      {isEditModalOpen && editingCoupon && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-primary-bg rounded-xl p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-primary-fg flex items-center gap-2">
                <Edit className="text-primary-accent" size={24} />
                Edit Coupon
              </h2>
              <button
                onClick={() => {
                  setIsEditModalOpen(false);
                  setEditingCoupon(null);
                }}
                className="p-2 hover:bg-primary-accent-light rounded-lg transition-colors"
              >
                <X size={20} className="text-primary-muted" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Coupon Code (Read-only) */}
              <div>
                <label className="block text-sm font-medium text-primary-fg mb-2">
                  Coupon Code
                </label>
                <input
                  type="text"
                  value={editingCoupon.code}
                  disabled
                  className="w-full px-4 py-2 border border-primary-border rounded-xl bg-primary-bg/50 text-primary-muted cursor-not-allowed"
                />
                <p className="text-xs text-primary-muted mt-1">Coupon code cannot be changed</p>
              </div>

              {/* Coupon Name */}
              <div>
                <label className="block text-sm font-medium text-primary-fg mb-2">
                  Coupon Name
                </label>
                <input
                  type="text"
                  value={editingCoupon.name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditingCoupon({ ...editingCoupon, name: e.target.value })}
                  className="w-full px-4 py-2 border border-primary-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-accent"
                  placeholder="Enter coupon name"
                />
              </div>

              {/* Discount Amount */}
              <div>
                <label className="block text-sm font-medium text-primary-fg mb-2">
                  Discount Amount
                </label>
                <input
                  type="number"
                  value={editingCoupon.discount}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditingCoupon({ ...editingCoupon, discount: parseFloat(e.target.value) || 0 })}
                  className="w-full px-4 py-2 border border-primary-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-accent"
                  placeholder="Enter discount amount"
                  min="0"
                />
              </div>

              {/* Discount Type */}
              <div>
                <label className="block text-sm font-medium text-primary-fg mb-2">
                  Discount Type
                </label>
                <div className="flex gap-3">
                  <button
                    onClick={() => setEditingCoupon({ ...editingCoupon, discountType: 'percentage' })}
                    className={`flex-1 px-4 py-2 rounded-xl border transition-colors ${
                      editingCoupon.discountType === 'percentage'
                        ? 'bg-primary-accent text-white'
                        : 'border-primary-border text-primary-fg'
                    }`}
                  >
                    <Percent size={16} className="inline mr-2" />
                    Percentage
                  </button>
                  <button
                    onClick={() => setEditingCoupon({ ...editingCoupon, discountType: 'fixed' })}
                    className={`flex-1 px-4 py-2 rounded-xl border transition-colors ${
                      editingCoupon.discountType === 'fixed'
                        ? 'bg-primary-accent text-white'
                        : 'border-primary-border text-primary-fg'
                    }`}
                  >
                    <Hash size={16} className="inline mr-2" />
                    Fixed Amount
                  </button>
                </div>
              </div>

              {/* Usage Limit */}
              <div>
                <label className="block text-sm font-medium text-primary-fg mb-2">
                  Usage Limit
                </label>
                <input
                  type="number"
                  value={editingCoupon.usageLimit}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditingCoupon({ ...editingCoupon, usageLimit: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-2 border border-primary-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-accent"
                  placeholder="100"
                  min="1"
                />
                <p className="text-xs text-primary-muted mt-1">
                  Current usage: {editingCoupon.usedCount} / {editingCoupon.usageLimit}
                </p>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-primary-fg mb-2">
                    Valid From
                  </label>
                  <input
                    type="date"
                    value={typeof editingCoupon.validFrom === 'string' 
                      ? editingCoupon.validFrom.split('T')[0] 
                      : new Date(editingCoupon.validFrom).toISOString().split('T')[0]}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditingCoupon({ ...editingCoupon, validFrom: e.target.value })}
                    className="w-full px-4 py-2 border border-primary-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-accent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-primary-fg mb-2">
                    Valid Until
                  </label>
                  <input
                    type="date"
                    value={typeof editingCoupon.validUntil === 'string' 
                      ? editingCoupon.validUntil.split('T')[0] 
                      : new Date(editingCoupon.validUntil).toISOString().split('T')[0]}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditingCoupon({ ...editingCoupon, validUntil: e.target.value })}
                    className="w-full px-4 py-2 border border-primary-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-accent"
                    min={typeof editingCoupon.validFrom === 'string' 
                      ? editingCoupon.validFrom.split('T')[0] 
                      : new Date(editingCoupon.validFrom).toISOString().split('T')[0]}
                  />
                </div>
              </div>

              {/* Applicable To */}
              <div>
                <label className="block text-sm font-medium text-primary-fg mb-2">
                  Applicable To
                </label>
                <div className="flex gap-3">
                  <button
                    onClick={() => setEditingCoupon({ ...editingCoupon, applicableTo: 'all', eventId: undefined, category: undefined })}
                    className={`flex-1 px-4 py-2 rounded-xl border transition-colors ${
                      editingCoupon.applicableTo === 'all'
                        ? 'bg-primary-accent text-white'
                        : 'border-primary-border text-primary-fg'
                    }`}
                  >
                    All Events
                  </button>
                  <button
                    onClick={() => setEditingCoupon({ ...editingCoupon, applicableTo: 'event', category: undefined })}
                    className={`flex-1 px-4 py-2 rounded-xl border transition-colors ${
                      editingCoupon.applicableTo === 'event'
                        ? 'bg-primary-accent text-white'
                        : 'border-primary-border text-primary-fg'
                    }`}
                  >
                    Specific Event
                  </button>
                  <button
                    onClick={() => setEditingCoupon({ ...editingCoupon, applicableTo: 'category', eventId: undefined })}
                    className={`flex-1 px-4 py-2 rounded-xl border transition-colors ${
                      editingCoupon.applicableTo === 'category'
                        ? 'bg-primary-accent text-white'
                        : 'border-primary-border text-primary-fg'
                    }`}
                  >
                    Category
                  </button>
                </div>
              </div>

              {/* Event Selection - Show when applicableTo is 'event' */}
              {editingCoupon.applicableTo === 'event' && (
                <div>
                  <label className="block text-sm font-medium text-primary-fg mb-2">
                    Select Event *
                  </label>
                  {loadingEvents ? (
                    <div className="w-full px-4 py-2 border border-primary-border rounded-xl text-primary-muted">
                      Loading events...
                    </div>
                  ) : (
                    <select
                      value={editingCoupon.eventId || ''}
                      onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setEditingCoupon({ ...editingCoupon, eventId: e.target.value || undefined })}
                      className="w-full px-4 py-2 border border-primary-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-accent bg-primary-bg text-primary-fg"
                      required
                    >
                      <option value="">-- Select an event --</option>
                      {events.map((event) => (
                        <option key={event.id} value={event.id}>
                          {event.title}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )}

              {/* Category Selection - Show when applicableTo is 'category' */}
              {editingCoupon.applicableTo === 'category' && (
                <div>
                  <label className="block text-sm font-medium text-primary-fg mb-2">
                    Category
                  </label>
                  <input
                    type="text"
                    value={editingCoupon.category || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditingCoupon({ ...editingCoupon, category: e.target.value || undefined })}
                    className="w-full px-4 py-2 border border-primary-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-accent"
                    placeholder="Enter category name"
                  />
                </div>
              )}

              {/* Only for Student Checkbox */}
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="editOnlyForStudent"
                  checked={editingCoupon.onlyForStudent || false}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditingCoupon({ ...editingCoupon, onlyForStudent: e.target.checked })}
                  className="w-5 h-5 border border-primary-border rounded focus:ring-2 focus:ring-primary-accent text-primary-accent"
                />
                <label htmlFor="editOnlyForStudent" className="text-sm font-medium text-primary-fg cursor-pointer">
                  Only for Student (requires student ID verification)
                </label>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setEditingCoupon(null);
                  }}
                  className="flex-1 px-4 py-2 border border-primary-border rounded-xl text-primary-fg hover:bg-primary-accent-light transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdate}
                  className="flex-1 px-4 py-2 bg-primary-accent text-white rounded-xl hover:bg-primary-accent-dark transition-colors"
                >
                  Update Coupon
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

