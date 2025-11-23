"use client";

import { Plus, Edit2, Trash2, Save, X, Loader2 } from "lucide-react";
import ExpenseModal from "./ExpenseModal";
import type { ExpenseTemplate, EventExpense, ExpenseFormData, FinancialCalculations, FinancialsFormData } from "./types";

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

interface ExpensesManagementProps {
  templates: ExpenseTemplate[];
  expenses: EventExpense[];
  expenseForm: ExpenseFormData;
  setExpenseForm: React.Dispatch<React.SetStateAction<ExpenseFormData>>;
  editingExpense: EventExpense | null;
  setEditingExpense: React.Dispatch<React.SetStateAction<EventExpense | null>>;
  showExpenseForm: boolean;
  setShowExpenseForm: React.Dispatch<React.SetStateAction<boolean>>;
  bulkAddMode: boolean;
  setBulkAddMode: React.Dispatch<React.SetStateAction<boolean>>;
  bulkExpenses: BulkExpense[];
  setBulkExpenses: React.Dispatch<React.SetStateAction<BulkExpense[]>>;
  saving: boolean;
  savingBulk: boolean;
  calculations: FinancialCalculations | null;
  projectedTicketIncome: number;
  totalProjectedIncome: number;
  onAddFromTemplate: (template: ExpenseTemplate) => void;
  onSaveExpense: () => Promise<void>;
  onSaveBulkExpenses: () => Promise<void>;
  onDeleteExpense: (expenseId: string) => Promise<void>;
  onStartEdit: (expense: EventExpense) => void;
}

export default function ExpensesManagement({
  templates,
  expenses,
  expenseForm,
  setExpenseForm,
  editingExpense,
  setEditingExpense,
  showExpenseForm,
  setShowExpenseForm,
  bulkAddMode,
  setBulkAddMode,
  bulkExpenses,
  setBulkExpenses,
  saving,
  savingBulk,
  calculations,
  projectedTicketIncome,
  totalProjectedIncome,
  onAddFromTemplate,
  onSaveExpense,
  onSaveBulkExpenses,
  onDeleteExpense,
  onStartEdit,
}: ExpensesManagementProps) {
  return (
    <div className="space-y-6">
      {/* Templates */}
      {templates.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-primary-fg mb-4">Expense Templates</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
            {templates.map((template) => (
              <button
                key={template.id}
                onClick={() => onAddFromTemplate(template)}
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

      {/* Expense Modal */}
      <ExpenseModal
        isOpen={showExpenseForm}
        onClose={() => {
          setShowExpenseForm(false);
          setEditingExpense(null);
          setExpenseForm({
            name: '',
            category: 'direct',
            expenseType: 'fixed',
            isOptional: false,
          });
        }}
        expense={editingExpense}
        templates={templates}
        onSave={async (formData) => {
          setExpenseForm(formData);
          await onSaveExpense();
          setShowExpenseForm(false);
          setEditingExpense(null);
        }}
        saving={saving}
      />

      {/* Quick Calculation Summary */}
      <div className="border border-primary-border rounded-lg p-4 bg-primary-accent-light/30 mb-6">
        <h3 className="text-sm font-semibold text-primary-fg mb-3">Quick Summary</h3>
        {calculations ? (
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <div className="text-primary-muted">Total Expenses</div>
              <div className="text-lg font-semibold text-primary-fg">
                ₹{calculations.expenses.totalExpenses.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
            <div>
              <div className="text-primary-muted">Total Income</div>
              <div className="text-lg font-semibold text-primary-fg">
                ₹{calculations.income.totalIncome.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
            <div>
              <div className="text-primary-muted">Profit</div>
              <div className={`text-lg font-semibold ${calculations.profit.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ₹{calculations.profit.profit.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <div className="text-primary-muted">Projected Ticket Income</div>
              <div className="text-lg font-semibold text-primary-fg">
                ₹{projectedTicketIncome.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className="text-xs text-primary-muted mt-1">Auto-calculated</div>
            </div>
            <div>
              <div className="text-primary-muted">Total Projected Income</div>
              <div className="text-lg font-semibold text-primary-fg">
                ₹{totalProjectedIncome.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className="text-xs text-primary-muted mt-1">Auto-calculated</div>
            </div>
            <div>
              <div className="text-primary-muted">Status</div>
              <div className="text-lg font-semibold text-primary-muted">
                Click Calculate
              </div>
              <div className="text-xs text-primary-muted mt-1">To see profit</div>
            </div>
          </div>
        )}
      </div>

      {/* Bulk Add Mode */}
      {bulkAddMode && (
        <div className="border border-primary-border rounded-lg p-4 bg-primary-accent-light mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-primary-fg">Bulk Add Expenses</h3>
            <button
              onClick={() => {
                setBulkAddMode(false);
                setBulkExpenses([{ name: '', category: 'direct', expenseType: 'fixed', isOptional: false }]);
              }}
              className="text-primary-muted hover:text-primary-fg"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {bulkExpenses.map((expense, index) => (
              <div key={index} className="border border-primary-border rounded-lg p-4 bg-primary-bg">
                <div className="grid grid-cols-12 gap-2 items-end">
                  <div className="col-span-4">
                    <label className="block text-xs font-medium text-primary-fg mb-1">Name *</label>
                    <input
                      type="text"
                      value={expense.name}
                      onChange={(e) => {
                        const newExpenses = [...bulkExpenses];
                        newExpenses[index].name = e.target.value;
                        setBulkExpenses(newExpenses);
                      }}
                      className="w-full px-2 py-1 text-sm border border-primary-border rounded focus:outline-none focus:ring-2 focus:ring-primary-accent bg-primary-bg text-primary-fg"
                      placeholder="Expense name"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-primary-fg mb-1">Category</label>
                    <select
                      value={expense.category}
                      onChange={(e) => {
                        const newExpenses = [...bulkExpenses];
                        newExpenses[index].category = e.target.value;
                        setBulkExpenses(newExpenses);
                      }}
                      className="w-full px-2 py-1 text-sm border border-primary-border rounded focus:outline-none focus:ring-2 focus:ring-primary-accent bg-primary-bg text-primary-fg"
                    >
                      <option value="direct">Direct</option>
                      <option value="indirect">Indirect</option>
                      <option value="marketing">Marketing</option>
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-primary-fg mb-1">Type</label>
                    <select
                      value={expense.expenseType}
                      onChange={(e) => {
                        const newExpenses = [...bulkExpenses];
                        newExpenses[index].expenseType = e.target.value as any;
                        setBulkExpenses(newExpenses);
                      }}
                      className="w-full px-2 py-1 text-sm border border-primary-border rounded focus:outline-none focus:ring-2 focus:ring-primary-accent bg-primary-bg text-primary-fg"
                    >
                      <option value="fixed">Fixed</option>
                      <option value="per_person">Per Person</option>
                      <option value="percentage">Percentage</option>
                    </select>
                  </div>
                  {expense.expenseType === 'fixed' && (
                    <div className="col-span-2">
                      <label className="block text-xs font-medium text-primary-fg mb-1">Amount *</label>
                      <input
                        type="number"
                        step="0.01"
                        value={expense.amount || ''}
                        onChange={(e) => {
                          const newExpenses = [...bulkExpenses];
                          newExpenses[index].amount = parseFloat(e.target.value) || undefined;
                          setBulkExpenses(newExpenses);
                        }}
                        className="w-full px-2 py-1 text-sm border border-primary-border rounded focus:outline-none focus:ring-2 focus:ring-primary-accent bg-primary-bg text-primary-fg"
                        placeholder="0.00"
                      />
                    </div>
                  )}
                  {expense.expenseType === 'per_person' && (
                    <>
                      <div className="col-span-1">
                        <label className="block text-xs font-medium text-primary-fg mb-1">Per Person *</label>
                        <input
                          type="number"
                          step="0.01"
                          value={expense.perPersonAmount || ''}
                          onChange={(e) => {
                            const newExpenses = [...bulkExpenses];
                            newExpenses[index].perPersonAmount = parseFloat(e.target.value) || undefined;
                            setBulkExpenses(newExpenses);
                          }}
                          className="w-full px-2 py-1 text-sm border border-primary-border rounded focus:outline-none focus:ring-2 focus:ring-primary-accent bg-primary-bg text-primary-fg"
                          placeholder="0.00"
                        />
                      </div>
                      <div className="col-span-1">
                        <label className="block text-xs font-medium text-primary-fg mb-1">Invitees *</label>
                        <input
                          type="number"
                          value={expense.numberOfInvitees || ''}
                          onChange={(e) => {
                            const newExpenses = [...bulkExpenses];
                            newExpenses[index].numberOfInvitees = parseInt(e.target.value) || undefined;
                            setBulkExpenses(newExpenses);
                          }}
                          className="w-full px-2 py-1 text-sm border border-primary-border rounded focus:outline-none focus:ring-2 focus:ring-primary-accent bg-primary-bg text-primary-fg"
                          placeholder="0"
                        />
                      </div>
                    </>
                  )}
                  {expense.expenseType === 'percentage' && (
                    <div className="col-span-2">
                      <label className="block text-xs font-medium text-primary-fg mb-1">Percentage *</label>
                      <input
                        type="number"
                        step="0.1"
                        value={expense.percentage || ''}
                        onChange={(e) => {
                          const newExpenses = [...bulkExpenses];
                          newExpenses[index].percentage = parseFloat(e.target.value) || undefined;
                          setBulkExpenses(newExpenses);
                        }}
                        className="w-full px-2 py-1 text-sm border border-primary-border rounded focus:outline-none focus:ring-2 focus:ring-primary-accent bg-primary-bg text-primary-fg"
                        placeholder="0.0"
                      />
                    </div>
                  )}
                  <div className="col-span-1 flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={expense.isOptional}
                      onChange={(e) => {
                        const newExpenses = [...bulkExpenses];
                        newExpenses[index].isOptional = e.target.checked;
                        setBulkExpenses(newExpenses);
                      }}
                      className="w-4 h-4"
                    />
                    <span className="text-xs text-primary-muted">Optional</span>
                  </div>
                  <div className="col-span-1 flex gap-1">
                    {bulkExpenses.length > 1 && (
                      <button
                        onClick={() => {
                          const newExpenses = bulkExpenses.filter((_, i) => i !== index);
                          setBulkExpenses(newExpenses);
                        }}
                        className="p-1 text-red-600 hover:bg-red-50 rounded"
                        title="Remove"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-between items-center mt-4">
            <button
              onClick={() => {
                setBulkExpenses([...bulkExpenses, { name: '', category: 'direct', expenseType: 'fixed', isOptional: false }]);
              }}
              className="text-sm text-primary-accent hover:text-primary-accent-dark flex items-center gap-1"
            >
              <Plus className="h-4 w-4" />
              Add Another Row
            </button>
            <button
              onClick={onSaveBulkExpenses}
              disabled={savingBulk}
              className="btn-primary flex items-center gap-2 disabled:opacity-50"
            >
              {savingBulk ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save All Expenses
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Expenses List */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-primary-fg">Event Expenses</h3>
          {!showExpenseForm && !bulkAddMode && (
            <div className="flex gap-2">
              <button
                onClick={() => setBulkAddMode(true)}
                className="btn-primary flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Bulk Add
              </button>
              <button
                onClick={() => setShowExpenseForm(true)}
                className="btn-primary flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Single
              </button>
            </div>
          )}
        </div>
        {expenses.length === 0 ? (
          <p className="text-primary-muted text-center py-8">No expenses added yet. Add expenses from templates or create custom ones.</p>
        ) : (
          <div className="space-y-2">
            {expenses.map((expense) => {
              const isTemplateExpense = !!expense.templateId;
              const isVirtualExpense = expense.id.startsWith('template-');
              
              return (
                <div
                  key={expense.id}
                  className={`p-4 border rounded-lg flex justify-between items-center ${
                    isTemplateExpense 
                      ? 'border-primary-accent bg-primary-accent-light/30' 
                      : 'border-primary-border'
                  }`}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <div className="font-medium text-primary-fg">{expense.name}</div>
                      {isTemplateExpense && (
                        <span className="text-xs px-2 py-0.5 bg-primary-accent text-primary-fg rounded">
                          Fixed Template
                        </span>
                      )}
                      {isVirtualExpense && (
                        <span className="text-xs px-2 py-0.5 bg-yellow-100 text-yellow-800 rounded">
                          Not Added Yet
                        </span>
                      )}
                    </div>
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
                      onClick={() => onStartEdit(expense)}
                      className="p-2 text-primary-fg hover:bg-primary-accent-light rounded-lg"
                      title={isTemplateExpense ? "Edit amount (label is fixed)" : "Edit expense"}
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    {!isVirtualExpense && (
                      <button
                        onClick={() => onDeleteExpense(expense.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                        title="Delete expense"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

