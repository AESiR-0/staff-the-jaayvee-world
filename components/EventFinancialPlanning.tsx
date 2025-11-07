"use client";

import { useState, useEffect, useCallback } from "react";
import { DollarSign, Calculator, TrendingUp, Download, Plus, Edit2, Trash2, Save, X, Loader2 } from "lucide-react";
import { authenticatedFetch } from "@/lib/auth-utils";

interface ExpenseTemplate {
  id: string;
  name: string;
  category: string;
  defaultAmount: number;
  isActive: boolean;
}

interface EventExpense {
  id: string;
  templateId?: string;
  name: string;
  category: string;
  expenseType: 'fixed' | 'per_person' | 'percentage' | 'calculated';
  amount?: number;
  percentage?: number;
  perPersonAmount?: number;
  numberOfInvitees?: number;
  isOptional: boolean;
}

interface EventFinancials {
  id: string;
  eventId: string;
  eventPrice: number;
  capacity: number;
  expectedProfit: number;
  referralPercentage: number;
  tjwPointsPercentage: number;
  tjwPointsMaxAmount: number;
  tjwVoucherPercentage: number;
  tjwVoucherMaxAmount: number;
  sponsorIncome: number;
  otherIncome: number;
  calculatedTotalExpenses: number;
  calculatedTotalIncome: number;
  calculatedProfit: number;
  calculatedProfitMargin: number;
}

interface FinancialCalculations {
  expenses: {
    fixedExpenses: number;
    perPersonExpenses: number;
    percentageExpenses: number;
    totalExpenses: number;
    breakdown: {
      fixed: Array<{ name: string; amount: number; category: string }>;
      perPerson: Array<{ name: string; amount: number; invitees: number }>;
      percentage: Array<{ name: string; amount: number; percentage: number }>;
    };
  };
  income: {
    ticketIncome: number;
    sponsorIncome: number;
    otherIncome: number;
    totalIncome: number;
  };
  profit: {
    totalExpenses: number;
    totalIncome: number;
    profit: number;
    profitMargin: number;
  };
  suggestions: {
    priceIncrease: {
      type: string;
      description: string;
      currentValue: number;
      requiredValue: number;
      increasePercentage: number;
    };
    capacityIncrease: {
      type: string;
      description: string;
      currentValue: number;
      requiredValue: number;
      increasePercentage: number;
    };
    breakEven: {
      breakEvenPrice: number;
      breakEvenCapacity: number;
    };
    scenarios: Array<{
      price: number;
      capacity: number;
      expectedIncome: number;
      expectedProfit: number;
      profitMargin: number;
    }>;
  };
}

interface EventFinancialPlanningProps {
  eventId: string;
  eventTitle?: string;
}

export default function EventFinancialPlanning({ eventId, eventTitle }: EventFinancialPlanningProps) {
  const [activeTab, setActiveTab] = useState<'settings' | 'expenses' | 'calculations'>('settings');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [financials, setFinancials] = useState<EventFinancials | null>(null);
  const [expenses, setExpenses] = useState<EventExpense[]>([]);
  const [templates, setTemplates] = useState<ExpenseTemplate[]>([]);
  const [calculations, setCalculations] = useState<FinancialCalculations | null>(null);

  // Form states
  const [financialsForm, setFinancialsForm] = useState({
    eventPrice: 0,
    capacity: 0,
    expectedProfit: 0,
    referralPercentage: 20,
    tjwPointsPercentage: 1,
    tjwPointsMaxAmount: 40,
    tjwVoucherPercentage: 1,
    tjwVoucherMaxAmount: 40,
    sponsorIncome: 0,
    otherIncome: 0,
  });

  const [expenseForm, setExpenseForm] = useState<{
    templateId?: string;
    name: string;
    category: string;
    expenseType: 'fixed' | 'per_person' | 'percentage';
    amount?: number;
    percentage?: number;
    perPersonAmount?: number;
    numberOfInvitees?: number;
    isOptional: boolean;
  }>({
    name: '',
    category: 'direct',
    expenseType: 'fixed',
    isOptional: false,
  });

  const [editingExpense, setEditingExpense] = useState<EventExpense | null>(null);
  const [showExpenseForm, setShowExpenseForm] = useState(false);

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://talaash.thejaayveeworld.com';

  // Fetch all data
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch financials
      const financialsRes = await authenticatedFetch(`${API_BASE_URL}/api/events/${eventId}/financials`);
      if (financialsRes.ok) {
        const financialsData = await financialsRes.json();
        if (financialsData.success && financialsData.data?.financials) {
          const fin = financialsData.data.financials;
          setFinancials(fin);
          setFinancialsForm({
            eventPrice: fin.eventPrice || 0,
            capacity: fin.capacity || 0,
            expectedProfit: fin.expectedProfit || 0,
            referralPercentage: fin.referralPercentage || 20,
            tjwPointsPercentage: fin.tjwPointsPercentage || 1,
            tjwPointsMaxAmount: fin.tjwPointsMaxAmount || 40,
            tjwVoucherPercentage: fin.tjwVoucherPercentage || 1,
            tjwVoucherMaxAmount: fin.tjwVoucherMaxAmount || 40,
            sponsorIncome: fin.sponsorIncome || 0,
            otherIncome: fin.otherIncome || 0,
          });
          if (financialsData.data.calculations) {
            setCalculations(financialsData.data.calculations);
          }
        }
      }

      // Fetch expenses
      const expensesRes = await authenticatedFetch(`${API_BASE_URL}/api/events/${eventId}/expenses`);
      if (expensesRes.ok) {
        const expensesData = await expensesRes.json();
        if (expensesData.success && expensesData.data) {
          setExpenses(expensesData.data);
        }
      }

      // Fetch templates
      const templatesRes = await authenticatedFetch(`${API_BASE_URL}/api/event-expense-templates?activeOnly=true`);
      if (templatesRes.ok) {
        const templatesData = await templatesRes.json();
        if (templatesData.success && templatesData.data) {
          setTemplates(templatesData.data);
        }
      }
    } catch (err: any) {
      console.error('Error fetching financial data:', err);
      setError(err.message || 'Failed to fetch financial data');
    } finally {
      setLoading(false);
    }
  }, [eventId, API_BASE_URL]);

  useEffect(() => {
    if (eventId) {
      fetchData();
    }
  }, [eventId, fetchData]);

  // Save financials
  const handleSaveFinancials = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const response = await authenticatedFetch(`${API_BASE_URL}/api/events/${eventId}/financials`, {
        method: 'POST',
        body: JSON.stringify(financialsForm),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to save financials');
      }

      setSuccess('Financial settings saved successfully!');
      await fetchData();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error('Error saving financials:', err);
      setError(err.message || 'Failed to save financial settings');
    } finally {
      setSaving(false);
    }
  };

  // Calculate financials
  const handleCalculate = async () => {
    try {
      setCalculating(true);
      setError(null);

      const response = await authenticatedFetch(`${API_BASE_URL}/api/events/${eventId}/financials/calculate`);

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to calculate financials');
      }

      setCalculations(data.data);
      setSuccess('Calculations updated successfully!');
      await fetchData();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error('Error calculating financials:', err);
      setError(err.message || 'Failed to calculate financials');
    } finally {
      setCalculating(false);
    }
  };

  // Export CSV
  const handleExportCSV = async () => {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/api/events/${eventId}/financials/export-csv`);

      if (!response.ok) {
        throw new Error('Failed to export CSV');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `event-financials-${eventTitle || eventId.substring(0, 8)}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setSuccess('CSV exported successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error('Error exporting CSV:', err);
      setError(err.message || 'Failed to export CSV');
    }
  };

  // Save expense
  const handleSaveExpense = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const url = editingExpense
        ? `${API_BASE_URL}/api/events/${eventId}/expenses/${editingExpense.id}`
        : `${API_BASE_URL}/api/events/${eventId}/expenses`;

      const response = await authenticatedFetch(url, {
        method: editingExpense ? 'PUT' : 'POST',
        body: JSON.stringify(expenseForm),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to save expense');
      }

      setSuccess(editingExpense ? 'Expense updated successfully!' : 'Expense added successfully!');
      setShowExpenseForm(false);
      setEditingExpense(null);
      setExpenseForm({
        name: '',
        category: 'direct',
        expenseType: 'fixed',
        isOptional: false,
      });
      await fetchData();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error('Error saving expense:', err);
      setError(err.message || 'Failed to save expense');
    } finally {
      setSaving(false);
    }
  };

  // Delete expense
  const handleDeleteExpense = async (expenseId: string) => {
    if (!confirm('Are you sure you want to delete this expense?')) {
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const response = await authenticatedFetch(`${API_BASE_URL}/api/events/${eventId}/expenses/${expenseId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to delete expense');
      }

      setSuccess('Expense deleted successfully!');
      await fetchData();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error('Error deleting expense:', err);
      setError(err.message || 'Failed to delete expense');
    } finally {
      setSaving(false);
    }
  };

  // Start editing expense
  const startEditExpense = (expense: EventExpense) => {
    setEditingExpense(expense);
    // Only allow editing of non-calculated expenses
    if (expense.expenseType === 'calculated') {
      return;
    }
    setExpenseForm({
      templateId: expense.templateId,
      name: expense.name,
      category: expense.category,
      expenseType: expense.expenseType as 'fixed' | 'per_person' | 'percentage',
      amount: expense.amount || undefined,
      percentage: expense.percentage || undefined,
      perPersonAmount: expense.perPersonAmount || undefined,
      numberOfInvitees: expense.numberOfInvitees || undefined,
      isOptional: expense.isOptional,
    });
    setShowExpenseForm(true);
  };

  // Add expense from template
  const addExpenseFromTemplate = (template: ExpenseTemplate) => {
    setExpenseForm({
      templateId: template.id,
      name: template.name,
      category: template.category,
      expenseType: 'fixed',
      amount: template.defaultAmount,
      isOptional: false,
    });
    setShowExpenseForm(true);
  };

  if (loading) {
    return (
      <div className="card p-8 text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary-accent" />
        <p className="text-primary-muted">Loading financial data...</p>
      </div>
    );
  }

  return (
    <div className="card">
      {/* Tabs */}
      <div className="border-b border-primary-border mb-6">
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'settings'
                ? 'text-primary-accent border-b-2 border-primary-accent'
                : 'text-primary-muted hover:text-primary-fg'
            }`}
          >
            <DollarSign className="h-4 w-4 inline mr-2" />
            Financial Settings
          </button>
          <button
            onClick={() => setActiveTab('expenses')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'expenses'
                ? 'text-primary-accent border-b-2 border-primary-accent'
                : 'text-primary-muted hover:text-primary-fg'
            }`}
          >
            <Calculator className="h-4 w-4 inline mr-2" />
            Expenses Management
          </button>
          <button
            onClick={() => setActiveTab('calculations')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'calculations'
                ? 'text-primary-accent border-b-2 border-primary-accent'
                : 'text-primary-muted hover:text-primary-fg'
            }`}
          >
            <TrendingUp className="h-4 w-4 inline mr-2" />
            Calculations & Suggestions
          </button>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 bg-green-50 border border-green-200 rounded-lg p-4 text-green-700 text-sm">
          {success}
        </div>
      )}

      {/* Financial Settings Tab */}
      {activeTab === 'settings' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-primary-fg mb-2">
                Event Price (per person) *
              </label>
              <input
                type="number"
                step="0.01"
                value={financialsForm.eventPrice}
                onChange={(e) => setFinancialsForm({ ...financialsForm, eventPrice: parseFloat(e.target.value) || 0 })}
                className="w-full px-4 py-2 border border-primary-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-accent bg-primary-bg text-primary-fg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-primary-fg mb-2">
                Capacity (Expected Occupancy) *
              </label>
              <input
                type="number"
                value={financialsForm.capacity}
                onChange={(e) => setFinancialsForm({ ...financialsForm, capacity: parseInt(e.target.value) || 0 })}
                className="w-full px-4 py-2 border border-primary-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-accent bg-primary-bg text-primary-fg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-primary-fg mb-2">
                Expected Profit
              </label>
              <input
                type="number"
                step="0.01"
                value={financialsForm.expectedProfit}
                onChange={(e) => setFinancialsForm({ ...financialsForm, expectedProfit: parseFloat(e.target.value) || 0 })}
                className="w-full px-4 py-2 border border-primary-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-accent bg-primary-bg text-primary-fg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-primary-fg mb-2">
                Sponsor Income
              </label>
              <input
                type="number"
                step="0.01"
                value={financialsForm.sponsorIncome}
                onChange={(e) => setFinancialsForm({ ...financialsForm, sponsorIncome: parseFloat(e.target.value) || 0 })}
                className="w-full px-4 py-2 border border-primary-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-accent bg-primary-bg text-primary-fg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-primary-fg mb-2">
                Other Income
              </label>
              <input
                type="number"
                step="0.01"
                value={financialsForm.otherIncome}
                onChange={(e) => setFinancialsForm({ ...financialsForm, otherIncome: parseFloat(e.target.value) || 0 })}
                className="w-full px-4 py-2 border border-primary-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-accent bg-primary-bg text-primary-fg"
              />
            </div>
          </div>

          <div className="border-t border-primary-border pt-4">
            <h3 className="text-lg font-semibold text-primary-fg mb-4">Customizable Percentages</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-primary-fg mb-2">
                  Referral Percentage (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={financialsForm.referralPercentage}
                  onChange={(e) => setFinancialsForm({ ...financialsForm, referralPercentage: parseFloat(e.target.value) || 0 })}
                  className="w-full px-4 py-2 border border-primary-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-accent bg-primary-bg text-primary-fg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-primary-fg mb-2">
                  TJW Points Percentage (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={financialsForm.tjwPointsPercentage}
                  onChange={(e) => setFinancialsForm({ ...financialsForm, tjwPointsPercentage: parseFloat(e.target.value) || 0 })}
                  className="w-full px-4 py-2 border border-primary-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-accent bg-primary-bg text-primary-fg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-primary-fg mb-2">
                  TJW Points Max Amount
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={financialsForm.tjwPointsMaxAmount}
                  onChange={(e) => setFinancialsForm({ ...financialsForm, tjwPointsMaxAmount: parseFloat(e.target.value) || 0 })}
                  className="w-full px-4 py-2 border border-primary-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-accent bg-primary-bg text-primary-fg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-primary-fg mb-2">
                  TJW Voucher Percentage (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={financialsForm.tjwVoucherPercentage}
                  onChange={(e) => setFinancialsForm({ ...financialsForm, tjwVoucherPercentage: parseFloat(e.target.value) || 0 })}
                  className="w-full px-4 py-2 border border-primary-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-accent bg-primary-bg text-primary-fg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-primary-fg mb-2">
                  TJW Voucher Max Amount
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={financialsForm.tjwVoucherMaxAmount}
                  onChange={(e) => setFinancialsForm({ ...financialsForm, tjwVoucherMaxAmount: parseFloat(e.target.value) || 0 })}
                  className="w-full px-4 py-2 border border-primary-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-accent bg-primary-bg text-primary-fg"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-4">
            <button
              onClick={handleSaveFinancials}
              disabled={saving}
              className="btn-primary flex items-center gap-2 disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save Settings
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Expenses Management Tab */}
      {activeTab === 'expenses' && (
        <div className="space-y-6">
          {/* Templates */}
          {templates.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-primary-fg mb-4">Expense Templates</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
                {templates.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => addExpenseFromTemplate(template)}
                    className="p-3 border border-primary-border rounded-lg hover:bg-primary-accent-light transition-colors text-left"
                  >
                    <div className="font-medium text-primary-fg">{template.name}</div>
                    <div className="text-sm text-primary-muted">₹{template.defaultAmount.toFixed(2)}</div>
                    <div className="text-xs text-primary-muted mt-1">{template.category}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Add/Edit Expense Form */}
          {showExpenseForm && (
            <div className="border border-primary-border rounded-lg p-4 bg-primary-accent-light">
              <h3 className="text-lg font-semibold text-primary-fg mb-4">
                {editingExpense ? 'Edit Expense' : 'Add Expense'}
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-primary-fg mb-2">Name *</label>
                  <input
                    type="text"
                    value={expenseForm.name}
                    onChange={(e) => setExpenseForm({ ...expenseForm, name: e.target.value })}
                    className="w-full px-4 py-2 border border-primary-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-accent bg-primary-bg text-primary-fg"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-primary-fg mb-2">Category *</label>
                    <select
                      value={expenseForm.category}
                      onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })}
                      className="w-full px-4 py-2 border border-primary-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-accent bg-primary-bg text-primary-fg"
                    >
                      <option value="direct">Direct</option>
                      <option value="indirect">Indirect</option>
                      <option value="marketing">Marketing</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-primary-fg mb-2">Type *</label>
                    <select
                      value={expenseForm.expenseType}
                      onChange={(e) => setExpenseForm({ ...expenseForm, expenseType: e.target.value as any })}
                      className="w-full px-4 py-2 border border-primary-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-accent bg-primary-bg text-primary-fg"
                    >
                      <option value="fixed">Fixed</option>
                      <option value="per_person">Per Person</option>
                      <option value="percentage">Percentage</option>
                    </select>
                  </div>
                </div>
                {expenseForm.expenseType === 'fixed' && (
                  <div>
                    <label className="block text-sm font-medium text-primary-fg mb-2">Amount *</label>
                    <input
                      type="number"
                      step="0.01"
                      value={expenseForm.amount || ''}
                      onChange={(e) => setExpenseForm({ ...expenseForm, amount: parseFloat(e.target.value) || undefined })}
                      className="w-full px-4 py-2 border border-primary-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-accent bg-primary-bg text-primary-fg"
                    />
                  </div>
                )}
                {expenseForm.expenseType === 'per_person' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-primary-fg mb-2">Per Person Amount *</label>
                      <input
                        type="number"
                        step="0.01"
                        value={expenseForm.perPersonAmount || ''}
                        onChange={(e) => setExpenseForm({ ...expenseForm, perPersonAmount: parseFloat(e.target.value) || undefined })}
                        className="w-full px-4 py-2 border border-primary-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-accent bg-primary-bg text-primary-fg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-primary-fg mb-2">Number of Invitees *</label>
                      <input
                        type="number"
                        value={expenseForm.numberOfInvitees || ''}
                        onChange={(e) => setExpenseForm({ ...expenseForm, numberOfInvitees: parseInt(e.target.value) || undefined })}
                        className="w-full px-4 py-2 border border-primary-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-accent bg-primary-bg text-primary-fg"
                      />
                    </div>
                  </>
                )}
                {expenseForm.expenseType === 'percentage' && (
                  <div>
                    <label className="block text-sm font-medium text-primary-fg mb-2">Percentage *</label>
                    <input
                      type="number"
                      step="0.1"
                      value={expenseForm.percentage || ''}
                      onChange={(e) => setExpenseForm({ ...expenseForm, percentage: parseFloat(e.target.value) || undefined })}
                      className="w-full px-4 py-2 border border-primary-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-accent bg-primary-bg text-primary-fg"
                    />
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isOptional"
                    checked={expenseForm.isOptional}
                    onChange={(e) => setExpenseForm({ ...expenseForm, isOptional: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <label htmlFor="isOptional" className="text-sm text-primary-fg">
                    Optional Expense
                  </label>
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => {
                      setShowExpenseForm(false);
                      setEditingExpense(null);
                      setExpenseForm({
                        name: '',
                        category: 'direct',
                        expenseType: 'fixed',
                        isOptional: false,
                      });
                    }}
                    className="px-4 py-2 text-primary-fg border border-primary-border rounded-lg hover:bg-primary-accent-light"
                  >
                    <X className="h-4 w-4 inline mr-2" />
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveExpense}
                    disabled={saving || !expenseForm.name}
                    className="btn-primary flex items-center gap-2 disabled:opacity-50"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Saving...
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
          )}

          {/* Expenses List */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-primary-fg">Event Expenses</h3>
              {!showExpenseForm && (
                <button
                  onClick={() => setShowExpenseForm(true)}
                  className="btn-primary flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add Expense
                </button>
              )}
            </div>
            {expenses.length === 0 ? (
              <p className="text-primary-muted text-center py-8">No expenses added yet. Add expenses from templates or create custom ones.</p>
            ) : (
              <div className="space-y-2">
                {expenses.map((expense) => (
                  <div
                    key={expense.id}
                    className="p-4 border border-primary-border rounded-lg flex justify-between items-center"
                  >
                    <div>
                      <div className="font-medium text-primary-fg">{expense.name}</div>
                      <div className="text-sm text-primary-muted">
                        {expense.category} • {expense.expenseType}
                        {expense.expenseType === 'fixed' && expense.amount && ` • ₹${expense.amount.toFixed(2)}`}
                        {expense.expenseType === 'per_person' && expense.perPersonAmount && expense.numberOfInvitees && ` • ₹${expense.perPersonAmount.toFixed(2)} × ${expense.numberOfInvitees}`}
                        {expense.expenseType === 'percentage' && expense.percentage && ` • ${expense.percentage}%`}
                        {expense.isOptional && ' • Optional'}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => startEditExpense(expense)}
                        className="p-2 text-primary-fg hover:bg-primary-accent-light rounded-lg"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteExpense(expense.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Calculations & Suggestions Tab */}
      {activeTab === 'calculations' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-primary-fg">Financial Calculations</h3>
            <div className="flex gap-2">
              <button
                onClick={handleCalculate}
                disabled={calculating || !financials}
                className="btn-primary flex items-center gap-2 disabled:opacity-50"
              >
                {calculating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Calculating...
                  </>
                ) : (
                  <>
                    <Calculator className="h-4 w-4" />
                    Recalculate
                  </>
                )}
              </button>
              <button
                onClick={handleExportCSV}
                disabled={!calculations}
                className="btn-primary flex items-center gap-2 disabled:opacity-50"
              >
                <Download className="h-4 w-4" />
                Export CSV
              </button>
            </div>
          </div>

          {!calculations ? (
            <div className="text-center py-8 text-primary-muted">
              <p>No calculations available. Please save financial settings and click &quot;Recalculate&quot;.</p>
            </div>
          ) : (
            <>
              {/* Expenses Breakdown */}
              <div className="border border-primary-border rounded-lg p-4">
                <h4 className="font-semibold text-primary-fg mb-4">Expenses Breakdown</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-primary-muted">Fixed Expenses:</span>
                    <span className="font-medium text-primary-fg">₹{calculations.expenses.fixedExpenses.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-primary-muted">Per-Person Expenses:</span>
                    <span className="font-medium text-primary-fg">₹{calculations.expenses.perPersonExpenses.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-primary-muted">Percentage Expenses:</span>
                    <span className="font-medium text-primary-fg">₹{calculations.expenses.percentageExpenses.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-primary-border font-semibold">
                    <span className="text-primary-fg">Total Expenses:</span>
                    <span className="text-primary-fg">₹{calculations.expenses.totalExpenses.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Income Breakdown */}
              <div className="border border-primary-border rounded-lg p-4">
                <h4 className="font-semibold text-primary-fg mb-4">Income Breakdown</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-primary-muted">Ticket Income:</span>
                    <span className="font-medium text-primary-fg">₹{calculations.income.ticketIncome.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-primary-muted">Sponsor Income:</span>
                    <span className="font-medium text-primary-fg">₹{calculations.income.sponsorIncome.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-primary-muted">Other Income:</span>
                    <span className="font-medium text-primary-fg">₹{calculations.income.otherIncome.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-primary-border font-semibold">
                    <span className="text-primary-fg">Total Income:</span>
                    <span className="text-primary-fg">₹{calculations.income.totalIncome.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Profit/Loss */}
              <div className={`border rounded-lg p-4 ${calculations.profit.profit >= 0 ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
                <h4 className="font-semibold mb-4">Profit/Loss Summary</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Total Expenses:</span>
                    <span className="font-medium">₹{calculations.profit.totalExpenses.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Income:</span>
                    <span className="font-medium">₹{calculations.profit.totalIncome.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t font-semibold text-lg">
                    <span>Profit/Loss:</span>
                    <span className={calculations.profit.profit >= 0 ? 'text-green-700' : 'text-red-700'}>
                      ₹{calculations.profit.profit.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Profit Margin:</span>
                    <span className={`font-medium ${calculations.profit.profitMargin >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                      {calculations.profit.profitMargin.toFixed(2)}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Suggestions */}
              <div className="border border-primary-border rounded-lg p-4">
                <h4 className="font-semibold text-primary-fg mb-4">Suggestions</h4>
                <div className="space-y-4">
                  <div>
                    <div className="text-sm text-primary-muted mb-1">Price Increase</div>
                    <div className="text-primary-fg">
                      Required Price: ₹{calculations.suggestions.priceIncrease.requiredValue.toFixed(2)} 
                      ({calculations.suggestions.priceIncrease.increasePercentage >= 0 ? '+' : ''}{calculations.suggestions.priceIncrease.increasePercentage.toFixed(2)}%)
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-primary-muted mb-1">Capacity Increase</div>
                    <div className="text-primary-fg">
                      Required Capacity: {Math.ceil(calculations.suggestions.capacityIncrease.requiredValue)} 
                      ({calculations.suggestions.capacityIncrease.increasePercentage >= 0 ? '+' : ''}{calculations.suggestions.capacityIncrease.increasePercentage.toFixed(2)}%)
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-primary-muted mb-1">Break-Even Analysis</div>
                    <div className="text-primary-fg">
                      Break-Even Price: ₹{calculations.suggestions.breakEven.breakEvenPrice.toFixed(2)} | 
                      Break-Even Capacity: {calculations.suggestions.breakEven.breakEvenCapacity}
                    </div>
                  </div>
                </div>
              </div>

              {/* Scenarios */}
              {calculations.suggestions.scenarios.length > 0 && (
                <div className="border border-primary-border rounded-lg p-4">
                  <h4 className="font-semibold text-primary-fg mb-4">Top Scenarios</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-primary-border">
                          <th className="text-left py-2 px-2 text-primary-muted">Price</th>
                          <th className="text-left py-2 px-2 text-primary-muted">Capacity</th>
                          <th className="text-right py-2 px-2 text-primary-muted">Income</th>
                          <th className="text-right py-2 px-2 text-primary-muted">Profit</th>
                          <th className="text-right py-2 px-2 text-primary-muted">Margin %</th>
                        </tr>
                      </thead>
                      <tbody>
                        {calculations.suggestions.scenarios.map((scenario, idx) => (
                          <tr key={idx} className="border-b border-primary-border">
                            <td className="py-2 px-2 text-primary-fg">₹{scenario.price.toFixed(2)}</td>
                            <td className="py-2 px-2 text-primary-fg">{scenario.capacity}</td>
                            <td className="py-2 px-2 text-right text-primary-fg">₹{scenario.expectedIncome.toFixed(2)}</td>
                            <td className={`py-2 px-2 text-right ${scenario.expectedProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              ₹{scenario.expectedProfit.toFixed(2)}
                            </td>
                            <td className={`py-2 px-2 text-right ${scenario.profitMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {scenario.profitMargin.toFixed(2)}%
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

