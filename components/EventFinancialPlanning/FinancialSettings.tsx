"use client";

import { useState } from "react";
import { Save, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import type { FinancialsFormData, EventFinancials } from "./types";

interface FinancialSettingsProps {
  financialsForm: FinancialsFormData;
  setFinancialsForm: React.Dispatch<React.SetStateAction<FinancialsFormData>>;
  averageTicketPrice: number | null;
  projectedTicketIncome: number;
  totalProjectedIncome: number;
  expandedSections: Set<string>;
  setExpandedSections: React.Dispatch<React.SetStateAction<Set<string>>>;
  saving: boolean;
  financials: EventFinancials | null;
  onSave: () => Promise<void>;
}

export default function FinancialSettings({
  financialsForm,
  setFinancialsForm,
  averageTicketPrice,
  projectedTicketIncome,
  totalProjectedIncome,
  expandedSections,
  setExpandedSections,
  saving,
  financials,
  onSave,
}: FinancialSettingsProps) {
  return (
    <div className="space-y-4">
      {/* Basic Information Accordion */}
      <div className="border border-primary-border rounded-lg">
        <button
          type="button"
          onClick={() => {
            setExpandedSections(prev => {
              const next = new Set(prev);
              if (next.has('basic')) {
                next.delete('basic');
              } else {
                next.add('basic');
              }
              return next;
            });
          }}
          className="w-full flex items-center justify-between p-4 bg-primary-bg/50 hover:bg-primary-bg rounded-lg transition-colors"
        >
          <h3 className="text-lg font-semibold text-primary-fg">Basic Information</h3>
          {expandedSections.has('basic') ? (
            <ChevronUp className="h-5 w-5 text-primary-muted" />
          ) : (
            <ChevronDown className="h-5 w-5 text-primary-muted" />
          )}
        </button>
        {expandedSections.has('basic') && (
          <div className="p-4 pt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-primary-fg mb-2">
                  Average Ticket Price (calculated from ticket types)
                </label>
                <input
                  type="text"
                  value={averageTicketPrice !== null ? `₹${averageTicketPrice.toFixed(2)}` : 'No ticket types'}
                  readOnly
                  disabled
                  className="w-full px-4 py-2 border border-primary-border rounded-lg bg-primary-bg/50 text-primary-fg/70 cursor-not-allowed"
                />
                <p className="text-xs text-primary-muted mt-1">
                  Automatically calculated from ticket types (weighted average)
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-primary-fg mb-2">
                  Capacity (Auto-calculated from Ticket Types) *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    value={financialsForm.capacity}
                    readOnly
                    className="w-full px-4 py-2 border border-primary-border rounded-lg bg-primary-accent-light text-primary-fg cursor-not-allowed"
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <span className="text-xs text-primary-muted bg-primary-bg px-2 py-1 rounded">Auto</span>
                  </div>
                </div>
                <p className="text-xs text-primary-muted mt-1">
                  Capacity is automatically calculated from the sum of all ticket type quantities
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-primary-fg mb-2">
                  Projected Ticket Income (Auto-calculated)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={isNaN(projectedTicketIncome) || !isFinite(projectedTicketIncome)
                      ? '₹0.00'
                      : `₹${projectedTicketIncome.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                    readOnly
                    className="w-full px-4 py-2 border border-primary-border rounded-lg bg-primary-accent-light text-primary-fg cursor-not-allowed"
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <span className="text-xs text-primary-muted bg-primary-bg px-2 py-1 rounded">Auto</span>
                  </div>
                </div>
                <p className="text-xs text-primary-muted mt-1">
                  {averageTicketPrice !== null && financialsForm.capacity > 0
                    ? `Average Price (₹${averageTicketPrice.toFixed(2)}) × Capacity (${financialsForm.capacity}) = Projected Income`
                    : 'Calculated from average ticket price × capacity'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-primary-fg mb-2">
                  Sponsor Income
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={financialsForm.sponsorIncome || ''}
                  onChange={(e) => setFinancialsForm({ ...financialsForm, sponsorIncome: parseFloat(e.target.value) || 0 })}
                  placeholder="0.00"
                  className="w-full px-4 py-2 border border-primary-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-accent bg-primary-bg text-primary-fg"
                />
                <p className="text-xs text-primary-muted mt-1">
                  Additional income from sponsors
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-primary-fg mb-2">
                  Other Income
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={financialsForm.otherIncome || ''}
                  onChange={(e) => setFinancialsForm({ ...financialsForm, otherIncome: parseFloat(e.target.value) || 0 })}
                  placeholder="0.00"
                  className="w-full px-4 py-2 border border-primary-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-accent bg-primary-bg text-primary-fg"
                />
                <p className="text-xs text-primary-muted mt-1">
                  Any other sources of income
                </p>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-primary-fg mb-2">
                  Total Projected Income (Auto-calculated)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={isNaN(totalProjectedIncome) || !isFinite(totalProjectedIncome) 
                      ? '₹0.00' 
                      : `₹${totalProjectedIncome.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                    readOnly
                    className="w-full px-4 py-2 border border-primary-border rounded-lg bg-primary-accent-light text-primary-fg font-semibold cursor-not-allowed"
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <span className="text-xs text-primary-muted bg-primary-bg px-2 py-1 rounded">Auto</span>
                  </div>
                </div>
                <p className="text-xs text-primary-muted mt-1">
                  Ticket Income (₹{projectedTicketIncome.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}) + Sponsor Income (₹{(financialsForm.sponsorIncome || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}) + Other Income (₹{(financialsForm.otherIncome || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-primary-fg mb-2">
                  Expected Profit
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={financialsForm.expectedProfit || ''}
                  onChange={(e) => setFinancialsForm({ ...financialsForm, expectedProfit: parseFloat(e.target.value) || 0 })}
                  placeholder="0.00"
                  className="w-full px-4 py-2 border border-primary-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-accent bg-primary-bg text-primary-fg"
                />
                <p className="text-xs text-primary-muted mt-1">
                  Target profit for this event
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Customizable Percentages Accordion */}
      <div className="border border-primary-border rounded-lg">
        <button
          type="button"
          onClick={() => {
            setExpandedSections(prev => {
              const next = new Set(prev);
              if (next.has('percentages')) {
                next.delete('percentages');
              } else {
                next.add('percentages');
              }
              return next;
            });
          }}
          className="w-full flex items-center justify-between p-4 bg-primary-bg/50 hover:bg-primary-bg rounded-lg transition-colors"
        >
          <h3 className="text-lg font-semibold text-primary-fg">Customizable Percentages</h3>
          {expandedSections.has('percentages') ? (
            <ChevronUp className="h-5 w-5 text-primary-muted" />
          ) : (
            <ChevronDown className="h-5 w-5 text-primary-muted" />
          )}
        </button>
        {expandedSections.has('percentages') && (
          <div className="p-4 pt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-primary-fg mb-2">
                  Referral Percentage (%)
                  <span className="text-xs font-normal text-primary-muted ml-2">(Default: 20%)</span>
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={financialsForm.referralPercentage ?? ''}
                  onChange={(e) => setFinancialsForm({ ...financialsForm, referralPercentage: parseFloat(e.target.value) || 20 })}
                  placeholder="20"
                  className="w-full px-4 py-2 border border-primary-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-accent bg-primary-bg text-primary-fg"
                />
                {(!financialsForm.referralPercentage || financialsForm.referralPercentage === 0) && (
                  <p className="text-xs text-primary-muted mt-1 italic">
                    Using default value: 20%
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-primary-fg mb-2">
                  TJW Coins Percentage (%)
                  <span className="text-xs font-normal text-primary-muted ml-2">(Default: 1%)</span>
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={financialsForm.tjwPointsPercentage ?? ''}
                  onChange={(e) => setFinancialsForm({ ...financialsForm, tjwPointsPercentage: parseFloat(e.target.value) || 1 })}
                  placeholder="1"
                  required
                  className="w-full px-4 py-2 border border-primary-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-accent bg-primary-bg text-primary-fg"
                />
                {(!financialsForm.tjwPointsPercentage || financialsForm.tjwPointsPercentage === 0) && (
                  <p className="text-xs text-primary-muted mt-1 italic">
                    Using default value: 1%
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-primary-fg mb-2">
                  TJW Coins Max Amount (₹)
                  <span className="text-xs font-normal text-primary-muted ml-2">(Default: ₹40)</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={financialsForm.tjwPointsMaxAmount ?? ''}
                  onChange={(e) => setFinancialsForm({ ...financialsForm, tjwPointsMaxAmount: parseFloat(e.target.value) || 40 })}
                  placeholder="40"
                  required
                  className="w-full px-4 py-2 border border-primary-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-accent bg-primary-bg text-primary-fg"
                />
                {(!financialsForm.tjwPointsMaxAmount || financialsForm.tjwPointsMaxAmount === 0) && (
                  <p className="text-xs text-primary-muted mt-1 italic">
                    Using default value: ₹40
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-primary-fg mb-2">
                  TJW Voucher Percentage (%)
                  <span className="text-xs font-normal text-primary-muted ml-2">(Default: 1%)</span>
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={financialsForm.tjwVoucherPercentage ?? ''}
                  onChange={(e) => setFinancialsForm({ ...financialsForm, tjwVoucherPercentage: parseFloat(e.target.value) || 1 })}
                  placeholder="1"
                  className="w-full px-4 py-2 border border-primary-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-accent bg-primary-bg text-primary-fg"
                />
                {(!financialsForm.tjwVoucherPercentage || financialsForm.tjwVoucherPercentage === 0) && (
                  <p className="text-xs text-primary-muted mt-1 italic">
                    Using default value: 1%
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-primary-fg mb-2">
                  TJW Voucher Max Amount (₹)
                  <span className="text-xs font-normal text-primary-muted ml-2">(Default: ₹40)</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={financialsForm.tjwVoucherMaxAmount ?? ''}
                  onChange={(e) => setFinancialsForm({ ...financialsForm, tjwVoucherMaxAmount: parseFloat(e.target.value) || 40 })}
                  placeholder="40"
                  className="w-full px-4 py-2 border border-primary-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-accent bg-primary-bg text-primary-fg"
                />
                {(!financialsForm.tjwVoucherMaxAmount || financialsForm.tjwVoucherMaxAmount === 0) && (
                  <p className="text-xs text-primary-muted mt-1 italic">
                    Using default value: ₹40
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {financialsForm.capacity <= 0 && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800 text-sm">
          ⚠️ Please add ticket types to set capacity before saving financial settings.
        </div>
      )}
    </div>
  );
}

