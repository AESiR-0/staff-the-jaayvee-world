"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { DollarSign, Calculator, TrendingUp, Download, Plus, Edit2, Trash2, Save, X, Loader2, ChevronDown, ChevronUp, BarChart3, Settings, Receipt } from "lucide-react";
import { authenticatedFetch } from "@/lib/auth-utils";
import { debounce } from "@/lib/utils/debounce";
import FinancialSettings from "./EventFinancialPlanning/FinancialSettings";
import ExpensesManagement from "./EventFinancialPlanning/ExpensesManagement";
import CalculationsView from "./EventFinancialPlanning/CalculationsView";
import type { ExpenseTemplate, EventExpense, EventFinancials, FinancialCalculations, FinancialsFormData, ExpenseFormData } from "./EventFinancialPlanning/types";

// Types are now imported from EventFinancialPlanning/types.ts

interface EventFinancialPlanningProps {
  eventId: string;
  eventTitle?: string;
}

type TabType = 'overview' | 'settings' | 'expenses' | 'calculations';

export default function EventFinancialPlanning({ eventId, eventTitle }: EventFinancialPlanningProps) {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [financials, setFinancials] = useState<EventFinancials | null>(null);
  const [templates, setTemplates] = useState<ExpenseTemplate[]>([]);
  const [expenses, setExpenses] = useState<EventExpense[]>([]);
  const [calculations, setCalculations] = useState<FinancialCalculations | null>(null);
  const [saving, setSaving] = useState(false);
  const [savingBulk, setSavingBulk] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['basic', 'percentages']));

  const [financialsForm, setFinancialsForm] = useState<FinancialsFormData>({
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

  const [expenseForm, setExpenseForm] = useState<ExpenseFormData>({
    name: '',
    category: 'direct',
    expenseType: 'fixed',
    isOptional: false,
  });

  const [editingExpense, setEditingExpense] = useState<EventExpense | null>(null);
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [bulkAddMode, setBulkAddMode] = useState(false);
  const [bulkExpenses, setBulkExpenses] = useState<Array<{
    name: string;
    category: string;
    expenseType: 'fixed' | 'per_person' | 'percentage';
    amount?: number;
    perPersonAmount?: number;
    numberOfInvitees?: number;
    percentage?: number;
    isOptional: boolean;
  }>>([{ name: '', category: 'direct', expenseType: 'fixed', isOptional: false }]);

  const [averageTicketPrice, setAverageTicketPrice] = useState<number | null>(null);

  // Use relative path for same-origin requests, or API_BASE_URL if set
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '';

  // OPTIMIZATION: Memoized expensive calculations
  const projectedTicketIncome = useMemo(() => {
    if (averageTicketPrice !== null && financialsForm.capacity > 0) {
      return averageTicketPrice * financialsForm.capacity;
    }
    return 0;
  }, [averageTicketPrice, financialsForm.capacity]);

  const totalProjectedIncome = useMemo(() => {
    const sponsor = Number(financialsForm.sponsorIncome) || 0;
    const other = Number(financialsForm.otherIncome) || 0;
    return projectedTicketIncome + sponsor + other;
  }, [projectedTicketIncome, financialsForm.sponsorIncome, financialsForm.otherIncome]);

  // Fetch all data - OPTIMIZED: Parallel API calls
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // OPTIMIZATION: Fetch all independent data in parallel
      const [financialsRes, templatesRes, ticketsRes, expensesRes] = await Promise.all([
        authenticatedFetch(`${API_BASE_URL}/api/events/${eventId}/financials`),
        authenticatedFetch(`${API_BASE_URL}/api/expense-templates`),
        authenticatedFetch(`${API_BASE_URL}/api/events/${eventId}/tickets`),
        authenticatedFetch(`${API_BASE_URL}/api/events/${eventId}/expenses`),
      ]);

      // Process financials
      if (financialsRes.ok) {
        const financialsData = await financialsRes.json();
        if (financialsData.success && financialsData.data) {
          if (financialsData.data !== null) {
            setFinancials(financialsData.data);
            setFinancialsForm({
              capacity: financialsData.data.capacity,
              expectedProfit: financialsData.data.expectedProfit || 0,
              referralPercentage: financialsData.data.referralPercentage ?? 20,
              tjwPointsPercentage: financialsData.data.tjwPointsPercentage ?? 1,
              tjwPointsMaxAmount: financialsData.data.tjwPointsMaxAmount ?? 40,
              tjwVoucherPercentage: financialsData.data.tjwVoucherPercentage ?? 1,
              tjwVoucherMaxAmount: financialsData.data.tjwVoucherMaxAmount ?? 40,
              sponsorIncome: financialsData.data.sponsorIncome || 0,
              otherIncome: financialsData.data.otherIncome || 0,
            });
            if (financialsData.data.calculations) {
              setCalculations(financialsData.data.calculations);
            }
          } else if (financialsData.data === null || financialsData.message?.includes('not found')) {
            // Financials don't exist yet - initialize with defaults
            setFinancials(null);
            setFinancialsForm({
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
            setCalculations(null);
          }
        }
      }

      // Process templates
      let templatesData: ExpenseTemplate[] = [];
      if (templatesRes.ok) {
        const templatesResult = await templatesRes.json();
        if (templatesResult.success && templatesResult.data) {
          templatesData = templatesResult.data;
          setTemplates(templatesData);
        }
      }

      // Process ticket types
      if (ticketsRes.ok) {
        const ticketsData = await ticketsRes.json();
        if (ticketsData.success && ticketsData.data?.ticketTypes) {
          const ticketTypes = ticketsData.data.ticketTypes;
          if (ticketTypes.length > 0) {
            // Calculate weighted average price and total capacity
            let totalPotentialRevenue = 0;
            let totalCapacity = 0;
            
            for (const ticketType of ticketTypes) {
              totalPotentialRevenue += ticketType.capacity * ticketType.price;
              totalCapacity += ticketType.capacity;
            }

            const weightedAveragePrice = totalCapacity > 0 ? totalPotentialRevenue / totalCapacity : 0;
            setAverageTicketPrice(weightedAveragePrice);
            
            // Update capacity in form
            setFinancialsForm(prev => ({
              ...prev,
              capacity: totalCapacity,
            }));
          } else {
            setAverageTicketPrice(null);
            setFinancialsForm(prev => ({
              ...prev,
              capacity: 0,
            }));
          }
        }
      }

      // Process expenses
      if (expensesRes.ok) {
        const expensesData = await expensesRes.json();
        if (expensesData.success && expensesData.data) {
          setExpenses(expensesData.data);
          
          // Also add virtual expenses from templates that aren't added yet
          const addedTemplateIds = new Set(expensesData.data.map((e: EventExpense) => e.templateId).filter(Boolean));
          const virtualExpenses = templatesData
            .filter(t => !addedTemplateIds.has(t.id))
            .map(t => ({
              id: `template-${t.id}`,
              templateId: t.id,
              name: t.name,
              category: t.category,
              expenseType: 'fixed' as const,
              amount: t.defaultAmount,
              isOptional: false,
            } as EventExpense));
          
          setExpenses([...expensesData.data, ...virtualExpenses]);
        }
      }
    } catch (err: any) {
      console.error('Error fetching financial data:', err);
      setError(err.message || 'Failed to load financial data');
    } finally {
      setLoading(false);
    }
  }, [eventId, API_BASE_URL]);

  // Update capacity from ticket types when they change
  useEffect(() => {
    const updateCapacity = async () => {
      try {
        const ticketsRes = await authenticatedFetch(`${API_BASE_URL}/api/events/${eventId}/tickets`);
        if (ticketsRes.ok) {
          const ticketsData = await ticketsRes.json();
          if (ticketsData.success && ticketsData.data?.ticketTypes) {
            const ticketTypes = ticketsData.data.ticketTypes;
            const totalCapacity = ticketTypes.reduce((sum: number, tt: any) => sum + (tt.capacity || 0), 0);
            setFinancialsForm(prev => ({
              ...prev,
              capacity: totalCapacity,
            }));
          }
        }
      } catch (err) {
        console.error('Error updating capacity from ticket types:', err);
      }
    };
    if (eventId) {
      updateCapacity();
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

      setFinancials(data.data);
      setSuccess('Financial settings saved successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error('Error saving financials:', err);
      setError(err.message || 'Failed to save financials');
    } finally {
      setSaving(false);
    }
  };

  // Save expense
  const handleSaveExpense = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const isVirtualExpense = editingExpense?.id.startsWith('template-');
      
      const response = await authenticatedFetch(`${API_BASE_URL}/api/events/${eventId}/expenses`, {
        method: (editingExpense && !isVirtualExpense) ? 'PUT' : 'POST',
        body: JSON.stringify({
          ...expenseForm,
          id: editingExpense?.id,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to save expense');
      }

      setSuccess('Expense saved successfully!');
      setShowExpenseForm(false);
      setEditingExpense(null);
      setExpenseForm({
        name: '',
        category: 'direct',
        expenseType: 'fixed',
        isOptional: false,
      });
      await fetchData();
      // OPTIMIZATION: Debounced auto-calculation instead of immediate
      debouncedCalculate();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error('Error saving expense:', err);
      setError(err.message || 'Failed to save expense');
    } finally {
      setSaving(false);
    }
  };

  // Save bulk expenses
  const handleSaveBulkExpenses = async () => {
    try {
      setSavingBulk(true);
      setError(null);
      setSuccess(null);

      // Validate all expenses
      const validExpenses = bulkExpenses.filter(exp => exp.name.trim());
      if (validExpenses.length === 0) {
        setError('Please add at least one expense with a name');
        return;
      }

      // Validate required fields for each expense
      for (const exp of validExpenses) {
        if (exp.expenseType === 'fixed' && !exp.amount) {
          setError(`${exp.name || 'An expense'} is missing amount`);
          return;
        }
        if (exp.expenseType === 'per_person' && (!exp.perPersonAmount || !exp.numberOfInvitees)) {
          setError(`${exp.name || 'An expense'} is missing per-person amount or number of invitees`);
          return;
        }
        if (exp.expenseType === 'percentage' && !exp.percentage) {
          setError(`${exp.name || 'An expense'} is missing percentage`);
          return;
        }
      }

      // Save all expenses
      const savePromises = validExpenses.map(expense =>
        authenticatedFetch(`${API_BASE_URL}/api/events/${eventId}/expenses`, {
          method: 'POST',
          body: JSON.stringify(expense),
        })
      );

      const results = await Promise.allSettled(savePromises);
      const errors: string[] = [];
      
      for (let i = 0; i < results.length; i++) {
        const result = results[i];
        if (result.status === 'rejected') {
          errors.push(`${validExpenses[i].name}: ${result.reason?.message || 'Failed to save'}`);
        } else {
          const response = result.value;
          const data = await response.json();
          if (!response.ok || !data.success) {
            errors.push(`${validExpenses[i].name}: ${data.error || 'Failed to save'}`);
          }
        }
      }

      if (errors.length > 0) {
        setError(`Some expenses failed to save:\n${errors.join('\n')}`);
      } else {
        setSuccess(`Successfully added ${validExpenses.length} expense(s)!`);
        setBulkExpenses([{ name: '', category: 'direct', expenseType: 'fixed', isOptional: false }]);
        setBulkAddMode(false);
        await fetchData();
        // OPTIMIZATION: Debounced auto-calculation instead of immediate
        debouncedCalculate();
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (err: any) {
      console.error('Error saving bulk expenses:', err);
      setError(err.message || 'Failed to save expenses');
    } finally {
      setSavingBulk(false);
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
      // OPTIMIZATION: Debounced auto-calculation instead of immediate
      debouncedCalculate();
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
    
    // If this is a virtual template expense (starts with 'template-'), create it first
    if (expense.id.startsWith('template-')) {
      // This is a template that hasn't been added as an expense yet
      // Create it when saving
      setExpenseForm({
        templateId: expense.templateId,
        name: expense.name,
        category: expense.category,
        expenseType: 'fixed' as 'fixed' | 'per_person' | 'percentage',
        amount: expense.amount || undefined,
        percentage: expense.percentage || undefined,
        perPersonAmount: expense.perPersonAmount || undefined,
        numberOfInvitees: expense.numberOfInvitees || undefined,
        isOptional: expense.isOptional,
      });
    } else {
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
    }
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

  // Calculate function - MUST be before early return to follow Rules of Hooks
  const handleCalculate = useCallback(async () => {
    try {
      setCalculating(true);
      setError(null);

      const response = await authenticatedFetch(`${API_BASE_URL}/api/events/${eventId}/financials/calculate`, {
        method: 'POST',
      });

      let data;
      try {
        data = await response.json();
      } catch (parseError) {
        // If response is not JSON, try to get text
        const text = await response.text();
        throw new Error(text || `HTTP ${response.status}: ${response.statusText}`);
      }

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to calculate financials');
      }

      setCalculations(data.data);
      setSuccess('Financial calculations updated!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error('Error calculating financials:', err);
      setError(err.message || 'Failed to calculate financials');
    } finally {
      setCalculating(false);
    }
  }, [eventId, API_BASE_URL]);

  // OPTIMIZATION: Debounced calculate function - MUST be before early return
  const debouncedCalculate = useMemo(
    () => debounce(handleCalculate, 500),
    [handleCalculate]
  );

  if (loading) {
    return (
      <div className="card p-8 text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary-accent" />
        <p className="text-primary-muted">Loading financial data...</p>
      </div>
    );
  }

  // Export CSV
  const handleExportCSV = async () => {
    if (!calculations) return;

    const csvRows = [
      ['Category', 'Item', 'Amount'],
      ['Expenses', 'Fixed Expenses', calculations.expenses.fixedExpenses.toFixed(2)],
      ['Expenses', 'Per-Person Expenses', calculations.expenses.perPersonExpenses.toFixed(2)],
      ['Expenses', 'Percentage Expenses', calculations.expenses.percentageExpenses.toFixed(2)],
      ['Expenses', 'Total Expenses', calculations.expenses.totalExpenses.toFixed(2)],
      ['Income', 'Ticket Income', calculations.income.ticketIncome.toFixed(2)],
      ['Income', 'Sponsor Income', calculations.income.sponsorIncome.toFixed(2)],
      ['Income', 'Other Income', calculations.income.otherIncome.toFixed(2)],
      ['Income', 'Total Income', calculations.income.totalIncome.toFixed(2)],
      ['Profit', 'Total Expenses', calculations.profit.totalExpenses.toFixed(2)],
      ['Profit', 'Total Income', calculations.profit.totalIncome.toFixed(2)],
      ['Profit', 'Profit/Loss', calculations.profit.profit.toFixed(2)],
      ['Profit', 'Profit Margin %', calculations.profit.profitMargin.toFixed(2)],
    ];

    const csvContent = csvRows.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const filename = eventTitle 
      ? `event-financials-${eventTitle.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.csv`
      : `event-financials-${eventId.substring(0, 8)}.csv`;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const tabs = [
    { id: 'overview' as TabType, label: 'Overview', icon: BarChart3 },
    { id: 'settings' as TabType, label: 'Settings', icon: Settings },
    { id: 'expenses' as TabType, label: 'Expenses', icon: Receipt },
    { id: 'calculations' as TabType, label: 'Calculations', icon: Calculator },
  ];

  return (
    <div className="space-y-6">
      {/* Error/Success Messages */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm animate-in fade-in slide-in-from-top-2">
          {error}
        </div>
      )}
      {success && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-800 text-sm animate-in fade-in slide-in-from-top-2">
          {success}
        </div>
      )}

      {/* Modern Tab Navigation */}
      <div className="border border-primary-border rounded-xl bg-primary-bg overflow-hidden">
        {/* Tab Headers */}
        <div className="flex border-b border-primary-border bg-primary-bg/50 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-4 font-medium transition-all duration-200 whitespace-nowrap ${
                  isActive
                    ? 'text-primary-accent border-b-2 border-primary-accent bg-primary-bg'
                    : 'text-primary-muted hover:text-primary-fg hover:bg-primary-bg/50'
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? 'text-primary-accent' : ''}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-left-2">
              {/* Quick Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="border border-primary-border rounded-xl p-5 bg-gradient-to-br from-blue-50 to-blue-100/50 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-xs font-medium text-primary-muted uppercase tracking-wide">Ticket Income</div>
                    <TrendingUp className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="text-2xl font-bold text-primary-fg mb-1">
                    {isNaN(projectedTicketIncome) || !isFinite(projectedTicketIncome)
                      ? '₹0.00'
                      : `₹${projectedTicketIncome.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                  </div>
                  <div className="text-xs text-primary-muted">Auto-calculated from tickets</div>
                </div>
                <div className="border border-primary-border rounded-xl p-5 bg-gradient-to-br from-green-50 to-green-100/50 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-xs font-medium text-primary-muted uppercase tracking-wide">Total Income</div>
                    <DollarSign className="h-4 w-4 text-green-600" />
                  </div>
                  <div className="text-2xl font-bold text-primary-fg mb-1">
                    {isNaN(totalProjectedIncome) || !isFinite(totalProjectedIncome)
                      ? '₹0.00'
                      : `₹${totalProjectedIncome.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                  </div>
                  <div className="text-xs text-primary-muted">Ticket + Sponsor + Other</div>
                </div>
                <div className="border border-primary-border rounded-xl p-5 bg-gradient-to-br from-orange-50 to-orange-100/50 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-xs font-medium text-primary-muted uppercase tracking-wide">Total Expenses</div>
                    <Receipt className="h-4 w-4 text-orange-600" />
                  </div>
                  <div className="text-2xl font-bold text-primary-fg mb-1">
                    {calculations
                      ? `₹${calculations.expenses.totalExpenses.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                      : '₹0.00'}
                  </div>
                  <div className="text-xs text-primary-muted">
                    {expenses.length} expense{expenses.length !== 1 ? 's' : ''} added
                  </div>
                </div>
                <div className={`border rounded-xl p-5 hover:shadow-md transition-shadow ${
                  calculations && calculations.profit.profit >= 0
                    ? 'bg-gradient-to-br from-green-50 to-green-100/50 border-green-200'
                    : calculations && calculations.profit.profit < 0
                    ? 'bg-gradient-to-br from-red-50 to-red-100/50 border-red-200'
                    : 'bg-gradient-to-br from-gray-50 to-gray-100/50 border-primary-border'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-xs font-medium text-primary-muted uppercase tracking-wide">Projected Profit</div>
                    <Calculator className={`h-4 w-4 ${
                      calculations && calculations.profit.profit >= 0
                        ? 'text-green-600'
                        : calculations && calculations.profit.profit < 0
                        ? 'text-red-600'
                        : 'text-primary-muted'
                    }`} />
                  </div>
                  <div className={`text-2xl font-bold mb-1 ${
                    calculations && calculations.profit.profit >= 0
                      ? 'text-green-700'
                      : calculations && calculations.profit.profit < 0
                      ? 'text-red-700'
                      : 'text-primary-fg'
                  }`}>
                    {calculations
                      ? `₹${calculations.profit.profit.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                      : 'Calculate to see'}
                  </div>
                  <div className="text-xs text-primary-muted">
                    {calculations ? `${calculations.profit.profitMargin.toFixed(2)}% margin` : 'Click Calculate'}
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  onClick={() => setActiveTab('settings')}
                  className="p-4 border border-primary-border rounded-xl hover:border-primary-accent hover:bg-primary-accent-light transition-all text-left group"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-primary-accent/10 rounded-lg group-hover:bg-primary-accent/20 transition-colors">
                      <Settings className="h-5 w-5 text-primary-accent" />
                    </div>
                    <h3 className="font-semibold text-primary-fg">Configure Settings</h3>
                  </div>
                  <p className="text-sm text-primary-muted">Set up financial parameters and percentages</p>
                </button>
                <button
                  onClick={() => setActiveTab('expenses')}
                  className="p-4 border border-primary-border rounded-xl hover:border-primary-accent hover:bg-primary-accent-light transition-all text-left group"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-primary-accent/10 rounded-lg group-hover:bg-primary-accent/20 transition-colors">
                      <Receipt className="h-5 w-5 text-primary-accent" />
                    </div>
                    <h3 className="font-semibold text-primary-fg">Manage Expenses</h3>
                  </div>
                  <p className="text-sm text-primary-muted">Add and track event expenses</p>
                </button>
                <button
                  onClick={() => setActiveTab('calculations')}
                  disabled={!calculations}
                  className="p-4 border border-primary-border rounded-xl hover:border-primary-accent hover:bg-primary-accent-light transition-all text-left group disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-primary-accent/10 rounded-lg group-hover:bg-primary-accent/20 transition-colors">
                      <Calculator className="h-5 w-5 text-primary-accent" />
                    </div>
                    <h3 className="font-semibold text-primary-fg">View Analysis</h3>
                  </div>
                  <p className="text-sm text-primary-muted">See financial calculations and scenarios</p>
                </button>
              </div>

              {/* Status Summary */}
              <div className="border border-primary-border rounded-xl p-5 bg-primary-bg/50">
                <h3 className="font-semibold text-primary-fg mb-4">Setup Status</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-primary-muted">Financial Settings</span>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      financials ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {financials ? 'Configured' : 'Not Set'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-primary-muted">Expenses</span>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      expenses.length > 0 ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {expenses.length} added
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-primary-muted">Calculations</span>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      calculations ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {calculations ? 'Ready' : 'Pending'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <div className="animate-in fade-in slide-in-from-left-2">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-primary-fg mb-1">Financial Settings</h2>
                  <p className="text-sm text-primary-muted">Configure your event&apos;s financial parameters</p>
                </div>
                <button
                  onClick={handleSaveFinancials}
                  disabled={saving || financialsForm.capacity <= 0}
                  className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      {financials ? 'Save Changes' : 'Create Settings'}
                    </>
                  )}
                </button>
              </div>
              <FinancialSettings
                financialsForm={financialsForm}
                setFinancialsForm={setFinancialsForm}
                averageTicketPrice={averageTicketPrice}
                projectedTicketIncome={projectedTicketIncome}
                totalProjectedIncome={totalProjectedIncome}
                expandedSections={expandedSections}
                setExpandedSections={setExpandedSections}
                saving={saving}
                financials={financials}
                onSave={handleSaveFinancials}
              />
            </div>
          )}

          {/* Expenses Tab */}
          {activeTab === 'expenses' && (
            <div className="animate-in fade-in slide-in-from-left-2">
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-primary-fg mb-1">Expenses Management</h2>
                <p className="text-sm text-primary-muted">Add and manage event expenses</p>
              </div>
              <ExpensesManagement
                templates={templates}
                expenses={expenses}
                expenseForm={expenseForm}
                setExpenseForm={setExpenseForm}
                editingExpense={editingExpense}
                setEditingExpense={setEditingExpense}
                showExpenseForm={showExpenseForm}
                setShowExpenseForm={setShowExpenseForm}
                bulkAddMode={bulkAddMode}
                setBulkAddMode={setBulkAddMode}
                bulkExpenses={bulkExpenses}
                setBulkExpenses={setBulkExpenses}
                saving={saving}
                savingBulk={savingBulk}
                calculations={calculations}
                projectedTicketIncome={projectedTicketIncome}
                totalProjectedIncome={totalProjectedIncome}
                onAddFromTemplate={addExpenseFromTemplate}
                onSaveExpense={handleSaveExpense}
                onSaveBulkExpenses={handleSaveBulkExpenses}
                onDeleteExpense={handleDeleteExpense}
                onStartEdit={startEditExpense}
              />
            </div>
          )}

          {/* Calculations Tab */}
          {activeTab === 'calculations' && (
            <div className="animate-in fade-in slide-in-from-left-2">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-primary-fg mb-1">Financial Calculations</h2>
                  <p className="text-sm text-primary-muted">View detailed financial analysis and scenarios</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleCalculate}
                    disabled={calculating || loading}
                    className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {calculating ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Calculating...
                      </>
                    ) : (
                      <>
                        <Calculator className="h-4 w-4" />
                        {calculations ? 'Recalculate' : 'Calculate'}
                      </>
                    )}
                  </button>
                  {calculations && (
                    <button
                      onClick={handleExportCSV}
                      className="btn-secondary flex items-center gap-2"
                    >
                      <Download className="h-4 w-4" />
                      Export CSV
                    </button>
                  )}
                </div>
              </div>
              <CalculationsView
                calculations={calculations}
                financials={financials}
                financialsForm={financialsForm}
                calculating={calculating}
                loading={loading}
                onCalculate={handleCalculate}
                onExportCSV={handleExportCSV}
                onNavigateToSettings={() => setActiveTab('settings')}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
