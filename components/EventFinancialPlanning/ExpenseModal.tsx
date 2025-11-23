"use client";

import { useState, useEffect } from "react";
import { X, Save, Loader2 } from "lucide-react";
import type { ExpenseTemplate, EventExpense, ExpenseFormData } from "./types";

interface BulkExpense {
  name: string;
  category: string;
  expenseType: 'fixed' | 'per_person' | 'percentage';
  amount?: number;
  perPersonAmount?: number;
  numberOfInvitees?: number;
  percentage?: number;
  isOptional: boolean;
}

interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  expense?: EventExpense | null;
  templates: ExpenseTemplate[];
  onSave: (formData: ExpenseFormData) => Promise<void>;
  saving: boolean;
}

export default function ExpenseModal({
  isOpen,
  onClose,
  expense,
  templates,
  onSave,
  saving,
}: ExpenseModalProps) {
  const [formData, setFormData] = useState<ExpenseFormData>({
    name: '',
    category: 'direct',
    expenseType: 'fixed',
    isOptional: false,
  });

  useEffect(() => {
    if (expense) {
      setFormData({
        name: expense.name,
        category: expense.category,
        expenseType: expense.expenseType,
        amount: expense.amount,
        perPersonAmount: expense.perPersonAmount,
        numberOfInvitees: expense.numberOfInvitees,
        percentage: expense.percentage,
        isOptional: expense.isOptional,
      });
    } else {
      setFormData({
        name: '',
        category: 'direct',
        expenseType: 'fixed',
        isOptional: false,
      });
    }
  }, [expense, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave(formData);
    onClose();
  };

  const handleTemplateSelect = (template: ExpenseTemplate) => {
    setFormData({
      name: template.name,
      category: template.category,
      expenseType: template.expenseType,
      amount: template.amount,
      perPersonAmount: template.perPersonAmount,
      percentage: template.percentage,
      isOptional: template.isOptional,
    });
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-primary-bg rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-primary-bg border-b border-primary-border p-6 flex items-center justify-between rounded-t-2xl">
          <h3 className="text-xl font-semibold text-primary-fg">
            {expense ? 'Edit Expense' : 'Add New Expense'}
          </h3>
          <button
            onClick={onClose}
            className="text-primary-muted hover:text-primary-fg transition-colors p-1 hover:bg-primary-bg rounded-lg"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Quick Templates */}
          {templates.length > 0 && !expense && (
            <div>
              <label className="block text-sm font-medium text-primary-fg mb-2">
                Quick Add from Templates
              </label>
              <div className="grid grid-cols-2 gap-2">
                {templates.slice(0, 4).map((template) => (
                  <button
                    key={template.id}
                    type="button"
                    onClick={() => handleTemplateSelect(template)}
                    className="p-3 border border-primary-border rounded-lg hover:border-primary-accent hover:bg-primary-accent-light transition-all text-left"
                  >
                    <div className="font-medium text-primary-fg text-sm">{template.name}</div>
                    <div className="text-xs text-primary-muted mt-1">
                      {template.expenseType === 'fixed' && template.amount
                        ? `₹${template.amount.toLocaleString('en-IN')}`
                        : template.expenseType === 'per_person' && template.perPersonAmount
                        ? `₹${template.perPersonAmount.toLocaleString('en-IN')}/person`
                        : template.percentage
                        ? `${template.percentage}%`
                        : 'Variable'}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Expense Name */}
          <div>
            <label className="block text-sm font-medium text-primary-fg mb-2">
              Expense Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              className="w-full px-4 py-2 border border-primary-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-accent bg-primary-bg text-primary-fg"
              placeholder="e.g., Venue Rental, Catering, Marketing"
            />
          </div>

          {/* Category and Type */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-primary-fg mb-2">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                required
                className="w-full px-4 py-2 border border-primary-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-accent bg-primary-bg text-primary-fg"
              >
                <option value="direct">Direct</option>
                <option value="indirect">Indirect</option>
                <option value="marketing">Marketing</option>
                <option value="operations">Operations</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-primary-fg mb-2">
                Expense Type <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.expenseType}
                onChange={(e) => setFormData({ ...formData, expenseType: e.target.value as 'fixed' | 'per_person' | 'percentage' })}
                required
                className="w-full px-4 py-2 border border-primary-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-accent bg-primary-bg text-primary-fg"
              >
                <option value="fixed">Fixed Amount</option>
                <option value="per_person">Per Person</option>
                <option value="percentage">Percentage</option>
              </select>
            </div>
          </div>

          {/* Amount Fields based on Type */}
          {formData.expenseType === 'fixed' && (
            <div>
              <label className="block text-sm font-medium text-primary-fg mb-2">
                Amount (₹) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.amount || ''}
                onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || undefined })}
                required
                className="w-full px-4 py-2 border border-primary-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-accent bg-primary-bg text-primary-fg"
                placeholder="0.00"
              />
            </div>
          )}

          {formData.expenseType === 'per_person' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-primary-fg mb-2">
                  Per Person Amount (₹) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.perPersonAmount || ''}
                  onChange={(e) => setFormData({ ...formData, perPersonAmount: parseFloat(e.target.value) || undefined })}
                  required
                  className="w-full px-4 py-2 border border-primary-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-accent bg-primary-bg text-primary-fg"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-primary-fg mb-2">
                  Number of Invitees
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.numberOfInvitees || ''}
                  onChange={(e) => setFormData({ ...formData, numberOfInvitees: parseInt(e.target.value) || undefined })}
                  className="w-full px-4 py-2 border border-primary-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-accent bg-primary-bg text-primary-fg"
                  placeholder="Optional"
                />
              </div>
            </div>
          )}

          {formData.expenseType === 'percentage' && (
            <div>
              <label className="block text-sm font-medium text-primary-fg mb-2">
                Percentage (%) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={formData.percentage || ''}
                onChange={(e) => setFormData({ ...formData, percentage: parseFloat(e.target.value) || undefined })}
                required
                className="w-full px-4 py-2 border border-primary-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-accent bg-primary-bg text-primary-fg"
                placeholder="0.00"
              />
            </div>
          )}

          {/* Optional Toggle */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="isOptional"
              checked={formData.isOptional}
              onChange={(e) => setFormData({ ...formData, isOptional: e.target.checked })}
              className="w-4 h-4 text-primary-accent border-primary-border rounded focus:ring-primary-accent"
            />
            <label htmlFor="isOptional" className="text-sm text-primary-fg cursor-pointer">
              Mark as optional expense
            </label>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-primary-border">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-primary-border rounded-lg hover:bg-primary-bg transition-colors text-primary-fg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !formData.name}
              className="flex-1 btn-primary flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  {expense ? 'Update Expense' : 'Add Expense'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

