export type FinanceCategoryKind = 'income' | 'expense' | 'transfer' | 'savings' | 'investment' | 'debt' | 'other';
export type FinanceWalletType = 'cash' | 'checking' | 'savings' | 'credit' | 'investment' | 'other';
export type FinanceTransactionType = 'income' | 'expense' | 'transfer' | 'adjustment';
export type FinanceBudgetStatus = 'draft' | 'active' | 'paused' | 'completed';
export type FinanceGoalStatus = 'active' | 'paused' | 'completed' | 'cancelled';
export type FinanceRecurringFrequency = 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom';

export interface FinanceCategory {
  id: string;
  name: string;
  kind?: FinanceCategoryKind;
  color?: string | null;
  icon?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface FinanceWallet {
  id: string;
  name: string;
  type: FinanceWalletType;
  balance: number;
  currency: string;
  color?: string | null;
  icon?: string | null;
  goal_amount?: number | null;
  include_in_net_worth?: boolean;
  archived?: boolean;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface FinanceTransactionSplit {
  id: string;
  amount: number;
  category_id?: string | null;
  category_name?: string | null;
  notes?: string | null;
}

export interface FinanceTransaction {
  id: string;
  wallet_id: string;
  type: FinanceTransactionType;
  amount: number;
  currency: string;
  description?: string | null;
  notes?: string | null;
  category_id?: string | null;
  category_name?: string | null;
  tags?: string[];
  date: string;
  cleared?: boolean;
  destination_wallet_id?: string | null;
  recurrence_id?: string | null;
  attachments?: string[];
  splits?: FinanceTransactionSplit[];
  created_at?: string | null;
  updated_at?: string | null;
}

export interface FinanceBudget {
  id: string;
  title: string;
  amount: number;
  currency: string;
  period?: 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'custom';
  start_date: string;
  end_date?: string | null;
  category_ids?: string[];
  wallet_ids?: string[];
  spent_amount?: number;
  status?: FinanceBudgetStatus;
  alert_percentage?: number | null;
  tags?: string[];
  created_at?: string | null;
  updated_at?: string | null;
}

export interface FinanceGoal {
  id: string;
  title: string;
  target_amount: number;
  current_amount?: number;
  currency: string;
  target_date?: string | null;
  wallet_id?: string | null;
  color?: string | null;
  status?: FinanceGoalStatus;
  tags?: string[];
  notes?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface FinanceRecurringRule {
  id: string;
  wallet_id: string;
  type: FinanceTransactionType;
  amount: number;
  currency: string;
  description?: string | null;
  category_id?: string | null;
  tags?: string[];
  frequency?: FinanceRecurringFrequency;
  interval?: number;
  weekdays?: number[];
  day_of_month?: number | null;
  month_of_year?: number | null;
  next_run_at?: string | null;
  end_after_occurrences?: number | null;
  end_date?: string | null;
  destination_wallet_id?: string | null;
  auto_execute?: boolean;
  active?: boolean;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface FinanceSnapshot {
  wallets: FinanceWallet[];
  categories: FinanceCategory[];
  transactions: FinanceTransaction[];
  budgets: FinanceBudget[];
  goals: FinanceGoal[];
  recurring_rules: FinanceRecurringRule[];
}

export interface FinanceOverview {
  total_balance: number;
  monthly_income: number;
  monthly_expense: number;
  active_budget_count: number;
  active_goal_count: number;
  transactions_this_month: number;
  upcoming_recurring_count: number;
  latest_transactions: FinanceTransaction[];
}

export type FinanceCollectionName = 'wallets' | 'transactions' | 'budgets' | 'goals' | 'recurring_rules' | 'categories';

export interface FinanceEntityMap {
  wallets: FinanceWallet;
  transactions: FinanceTransaction;
  budgets: FinanceBudget;
  goals: FinanceGoal;
  recurring_rules: FinanceRecurringRule;
  categories: FinanceCategory;
}

export type FinanceEntityOf<T extends FinanceCollectionName> = FinanceEntityMap[T];

export const createEmptyFinanceSnapshot = (): FinanceSnapshot => ({
  wallets: [],
  categories: [],
  transactions: [],
  budgets: [],
  goals: [],
  recurring_rules: []
});
