"use client";

import { Calculator, Download, Loader2 } from "lucide-react";
import type { FinancialCalculations, EventFinancials, FinancialsFormData } from "./types";

interface CalculationsViewProps {
  calculations: FinancialCalculations | null;
  financials: EventFinancials | null;
  financialsForm: FinancialsFormData;
  calculating: boolean;
  loading: boolean;
  onCalculate: () => Promise<void>;
  onExportCSV: () => Promise<void>;
  onNavigateToSettings: () => void;
}

export default function CalculationsView({
  calculations,
  financials,
  financialsForm,
  calculating,
  loading,
  onCalculate,
  onExportCSV,
  onNavigateToSettings,
}: CalculationsViewProps) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-primary-fg">Financial Calculations</h3>
        <div className="flex gap-2">
          <button
            onClick={onCalculate}
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
              onClick={onExportCSV}
              disabled={!calculations}
              className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="h-4 w-4" />
              Export CSV
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8 text-primary-muted">
          <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
          <p>Loading financial data...</p>
        </div>
      ) : !financials ? (
        <div className="text-center py-8 text-primary-muted border border-primary-border rounded-lg p-6">
          <p className="mb-4">No financial settings found. Configure and save financial settings to get started.</p>
          <button
            onClick={onNavigateToSettings}
            className="px-4 py-2 bg-primary-accent text-white rounded-lg hover:bg-primary-accent-dark transition-colors"
          >
            Go to Financial Settings
          </button>
        </div>
      ) : !calculations ? (
        <div className="text-center py-8 text-primary-muted border border-primary-border rounded-lg p-6">
          <p className="mb-4">No calculations available. Click &quot;Calculate&quot; to generate financial calculations.</p>
          <button
            onClick={onCalculate}
            disabled={calculating}
            className="px-4 py-2 bg-primary-accent text-white rounded-lg hover:bg-primary-accent-dark transition-colors disabled:opacity-50 flex items-center gap-2 mx-auto"
          >
            {calculating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Calculating...
              </>
            ) : (
              <>
                <Calculator className="h-4 w-4" />
                Calculate Now
              </>
            )}
          </button>
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
              <h4 className="font-semibold text-primary-fg mb-4">Price & Capacity Scenarios</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-primary-border">
                      <th className="text-left py-2 px-2 text-primary-muted">Scenario</th>
                      <th className="text-left py-2 px-2 text-primary-muted">Fill Rate</th>
                      <th className="text-left py-2 px-2 text-primary-muted">Capacity</th>
                      <th className="text-right py-2 px-2 text-primary-muted">Income</th>
                      <th className="text-right py-2 px-2 text-primary-muted">Profit</th>
                      <th className="text-right py-2 px-2 text-primary-muted">Margin %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {calculations.suggestions.scenarios.map((scenario, idx) => {
                      // Calculate fill rate based on total capacity
                      const totalCapacity = financialsForm.capacity || 0;
                      const fillRatePercent = idx === 0 ? 100 : 75;
                      const scenarioName = idx === 0 ? 'All Tickets Sold' : 'Realistic Projection';
                      
                      return (
                        <tr key={idx} className="border-b border-primary-border">
                          <td className="py-2 px-2 text-primary-fg font-medium">{scenarioName}</td>
                          <td className="py-2 px-2 text-primary-fg">{fillRatePercent}%</td>
                          <td className="py-2 px-2 text-primary-fg">{scenario.capacity}</td>
                          <td className="py-2 px-2 text-right text-primary-fg">₹{scenario.expectedIncome.toFixed(2)}</td>
                          <td className={`py-2 px-2 text-right ${scenario.expectedProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            ₹{scenario.expectedProfit.toFixed(2)}
                          </td>
                          <td className={`py-2 px-2 text-right ${scenario.profitMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {scenario.profitMargin.toFixed(2)}%
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

