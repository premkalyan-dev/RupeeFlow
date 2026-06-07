/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type TransactionType = 'expense' | 'saving';

export type ExpenseCategory =
  | 'Food'
  | 'Travel'
  | 'Shopping'
  | 'Rent'
  | 'Education'
  | 'Health'
  | 'Bills'
  | 'Entertainment'
  | 'Others';

export type TransactionCategory = ExpenseCategory | 'Savings';

export interface Transaction {
  id: string;
  amount: number;
  type: TransactionType;
  category: TransactionCategory;
  description: string;
  date: string; // YYYY-MM-DD for consistency, formatted in UI as DD/MM/YYYY
  createdAt: string;
  updatedAt: string;
}

export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  category: string;
  deadline: string; // YYYY-MM-DD
  createdAt: string;
  updatedAt: string;
}

export interface UserConfig {
  email: string;
  monthlyBudget: number;
  theme?: 'light' | 'dark' | 'gold';
  createdAt: string;
  updatedAt: string;
}

export interface MonthlySummary {
  id: string; // YYYY-MM
  expenseTotal: number;
  savingTotal: number;
  transactionCount: number;
  updatedAt: string;
}

export interface AuthState {
  user: {
    uid: string;
    email: string | null;
    displayName: string | null;
  } | null;
  loading: boolean;
  isLocalFallback: boolean;
}
