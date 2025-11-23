// Shared types for EventFinancialPlanning components

export interface ExpenseTemplate {
  id: string;
  name: string;
  category: string;
  defaultAmount: number;
  isActive: boolean;
}

export interface EventExpense {
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

export interface EventFinancials {
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

export interface FinancialCalculations {
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

export interface FinancialsFormData {
  capacity: number;
  expectedProfit: number;
  referralPercentage: number;
  tjwPointsPercentage: number;
  tjwPointsMaxAmount: number;
  tjwVoucherPercentage: number;
  tjwVoucherMaxAmount: number;
  sponsorIncome: number;
  otherIncome: number;
}

export interface ExpenseFormData {
  templateId?: string;
  name: string;
  category: string;
  expenseType: 'fixed' | 'per_person' | 'percentage';
  amount?: number;
  percentage?: number;
  perPersonAmount?: number;
  numberOfInvitees?: number;
  isOptional: boolean;
}

