'use client';

import { useState, useEffect } from 'react';
import { Copy, Check, Tag, Percent, Calendar, Users, Hash } from 'lucide-react';
import { fetchAPI, API_ENDPOINTS, API_BASE_URL } from '@/lib/api';

interface Coupon {
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
}

export default function CouponGeneratorPage() {
  const [generatedCoupons, setGeneratedCoupons] = useState<Coupon[]>([]);

  // Load existing coupons on mount
  useEffect(() => {
    const loadCoupons = async () => {
      try {
        console.log('Loading coupons from:', `${API_BASE_URL}${API_ENDPOINTS.COUPONS}`);
        const response = await fetchAPI(API_ENDPOINTS.COUPONS);
        if (response.success) {
          setGeneratedCoupons(response.data);
        }
      } catch (error) {
        console.error('Failed to load coupons:', error);
        // Load dummy data if API fails
        loadDummyCoupons();
      }
    };
    
    loadCoupons();
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
    name: '',
    discount: '',
    discountType: 'percentage' as 'percentage' | 'fixed',
    usageLimit: '',
    validFrom: new Date().toISOString().split('T')[0],
    validUntil: '',
    applicableTo: 'all' as 'all' | 'event' | 'category',
    eventId: '',
    category: '',
    quantity: '1',
    prefix: 'EVT',
    codeLength: '8',
  });

  const generateCouponCode = (prefix: string, length: string | number): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = prefix;
    const lengthNum = typeof length === 'string' ? parseInt(length) : length;
    for (let i = 0; i < lengthNum; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  const handleGenerate = async () => {
    const quantity = parseInt(formData.quantity) || 1;
    const newCoupons: Coupon[] = [];

    for (let i = 0; i < quantity; i++) {
      const code = generateCouponCode(
        formData.prefix,
        formData.codeLength || '8'
      );
      
      newCoupons.push({
        code,
        name: formData.name || `Coupon ${i + 1}`,
        discount: parseFloat(formData.discount) || 0,
        discountType: formData.discountType,
        usageLimit: parseInt(formData.usageLimit) || 100,
        usedCount: 0,
        validFrom: formData.validFrom,
        validUntil: formData.validUntil || formData.validFrom,
        applicableTo: formData.applicableTo,
        eventId: formData.eventId || undefined,
        category: formData.category || undefined,
      });
    }

    // Save to database via API
    try {
      for (const coupon of newCoupons) {
        await fetchAPI(API_ENDPOINTS.COUPONS, {
          method: 'POST',
          body: JSON.stringify(coupon),
        });
      }
      
      setGeneratedCoupons([...generatedCoupons, ...newCoupons]);
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
                        {coupon.name && (
                          <p className="text-sm text-primary-muted">{coupon.name}</p>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleCopy(coupon.code)}
                      className="p-2 hover:bg-primary-accent-light rounded-lg transition-colors"
                      title="Copy code"
                    >
                      <Copy size={16} className="text-primary-muted" />
                    </button>
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
            {/* Coupon Name */}
            <div>
              <label className="block text-sm font-medium text-primary-fg mb-2">
                Coupon Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 border border-primary-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-accent"
                placeholder="Enter coupon name (e.g., Summer Special)"
              />
            </div>

            {/* Discount Amount */}
            <div>
              <label className="block text-sm font-medium text-primary-fg mb-2">
                Discount Amount
              </label>
              <input
                type="number"
                value={formData.discount}
                onChange={(e) => setFormData({ ...formData, discount: e.target.value })}
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
                onChange={(e) => setFormData({ ...formData, usageLimit: e.target.value })}
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
                  onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })}
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
                  onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                  className="w-full px-4 py-2 border border-primary-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-accent"
                  min={formData.validFrom}
                />
              </div>
            </div>

         

            {/* Code Settings */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-primary-fg mb-2">
                  Code Prefix
                </label>
                <input
                  type="text"
                  value={formData.prefix}
                  onChange={(e) => setFormData({ ...formData, prefix: e.target.value })}
                  className="w-full px-4 py-2 border border-primary-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-accent"
                  placeholder="EVT"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-primary-fg mb-2">
                  Code Length
                </label>
                <input
                  type="number"
                  value={formData.codeLength}
                  onChange={(e) => setFormData({ ...formData, codeLength: e.target.value })}
                  className="w-full px-4 py-2 border border-primary-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-accent"
                  placeholder="8"
                  min="4"
                  max="12"
                />
              </div>
            </div>

            {/* Quantity */}
            <div>
              <label className="block text-sm font-medium text-primary-fg mb-2">
                Number of Codes to Generate
              </label>
              <input
                type="number"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                className="w-full px-4 py-2 border border-primary-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-accent"
                placeholder="1"
                min="1"
                max="100"
              />
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
    </div>
  );
}
