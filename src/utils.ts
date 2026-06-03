/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { TransactionCategory, ExpenseCategory } from './types.ts';

/**
 * Formats a number to the Indian Currency format (e.g. ₹1,25,000)
 */
export const formatINR = (amount: number): string => {
  const formatter = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  });
  return formatter.format(amount);
};

/**
 * Formats an ISO string (YYYY-MM-DD or full date-time) to Indian standard DD/MM/YYYY
 */
export const formatDate = (dateStr: string): string => {
  if (!dateStr) return '';
  // Check if dateStr is YYYY-MM-DD
  const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (match) {
    return `${match[3]}/${match[2]}/${match[1]}`;
  }
  
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};

/**
 * Predefined list of standard Indian Expense Categories
 */
export const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  'Food',
  'Travel',
  'Shopping',
  'Rent',
  'Education',
  'Health',
  'Bills',
  'Entertainment',
  'Others',
];

/**
 * Predefined list of categories with nice colors and icons for mapping
 */
export interface CategoryMeta {
  name: TransactionCategory;
  color: string;
  icon: string;
  bgClass: string;
  textClass: string;
}

export const CATEGORIES_META: Record<TransactionCategory, CategoryMeta> = {
  Food: {
    name: 'Food',
    color: '#F59E0B', // Amber
    icon: 'Utensils',
    bgClass: 'bg-amber-50 dark:bg-amber-950/30',
    textClass: 'text-amber-600 dark:text-amber-400',
  },
  Travel: {
    name: 'Travel',
    color: '#3B82F6', // Blue
    icon: 'Car',
    bgClass: 'bg-blue-50 dark:bg-blue-950/30',
    textClass: 'text-blue-600 dark:text-blue-400',
  },
  Shopping: {
    name: 'Shopping',
    color: '#EC4899', // Pink
    icon: 'ShoppingBag',
    bgClass: 'bg-pink-50 dark:bg-pink-950/30',
    textClass: 'text-pink-600 dark:text-pink-400',
  },
  Rent: {
    name: 'Rent',
    color: '#8B5CF6', // Purple
    icon: 'Home',
    bgClass: 'bg-purple-50 dark:bg-purple-950/30',
    textClass: 'text-purple-600 dark:text-purple-400',
  },
  Education: {
    name: 'Education',
    color: '#10B981', // Emerald
    icon: 'BookOpen',
    bgClass: 'bg-emerald-50 dark:bg-emerald-950/30',
    textClass: 'text-emerald-600 dark:text-emerald-400',
  },
  Health: {
    name: 'Health',
    color: '#EF4444', // Red
    icon: 'Heart',
    bgClass: 'bg-red-50 dark:bg-red-950/30',
    textClass: 'text-red-600 dark:text-red-400',
  },
  Bills: {
    name: 'Bills',
    color: '#14B8A6', // Teal
    icon: 'Receipt',
    bgClass: 'bg-teal-50 dark:bg-teal-950/30',
    textClass: 'text-teal-600 dark:text-teal-400',
  },
  Entertainment: {
    name: 'Entertainment',
    color: '#6366F1', // Indigo
    icon: 'Tv',
    bgClass: 'bg-indigo-50 dark:bg-indigo-950/30',
    textClass: 'text-indigo-600 dark:text-indigo-400',
  },
  Others: {
    name: 'Others',
    color: '#6B7280', // Slate/Gray
    icon: 'Coins',
    bgClass: 'bg-slate-50 dark:bg-slate-950/30',
    textClass: 'text-slate-600 dark:text-slate-400',
  },
  Savings: {
    name: 'Savings',
    color: '#10B981', // Emerald Green hex
    icon: 'TrendingUp',
    bgClass: 'bg-emerald-50 dark:bg-emerald-950/30',
    textClass: 'text-emerald-600 dark:text-emerald-400',
  },
};

/**
 * Gets meta details for a category
 */
export const getCategoryMeta = (category: TransactionCategory): CategoryMeta => {
  return CATEGORIES_META[category] || CATEGORIES_META['Others'];
};
