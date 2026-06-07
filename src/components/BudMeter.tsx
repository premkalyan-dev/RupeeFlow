/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState, useEffect } from 'react';
import { useApp } from '../context/AppContext.tsx';
import { formatINR } from '../utils.ts';
import { Wallet, AlertTriangle, Check, Edit2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const getYearMonthFromDate = (date: string) => {
  const [year, month] = date.split('-');
  if (!year || !month) return null;
  return { year, month };
};

const getCurrentYearMonth = () => {
  const now = new Date();
  return {
    year: String(now.getFullYear()),
    month: String(now.getMonth() + 1).padStart(2, '0'),
  };
};

const isCurrentMonthDate = (date: string) => {
  const parsedDate = getYearMonthFromDate(date);
  if (!parsedDate) return true;

  const currentDate = getCurrentYearMonth();
  return parsedDate.year === currentDate.year && parsedDate.month === currentDate.month;
};

export const BudMeter: React.FC = () => {
  const { userConfig, updateBudget, transactions } = useApp();
  const [isEditing, setIsEditing] = useState(false);
  const [budgetVal, setBudgetVal] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (userConfig) {
      setBudgetVal(userConfig.monthlyBudget.toString());
    }
  }, [userConfig]);

  // Compute expenses for current month
  const currentMonthExpenses = useMemo(
    () =>
      transactions.reduce((sum, tx) => {
        if (tx.type !== 'expense' || !isCurrentMonthDate(tx.date)) return sum;
        return sum + tx.amount;
      }, 0),
    [transactions]
  );

  const budgetLimit = userConfig?.monthlyBudget || 50000;
  const remainingBudget = Math.max(0, budgetLimit - currentMonthExpenses);
  const percentUsed = budgetLimit > 0 ? Math.round((currentMonthExpenses / budgetLimit) * 100) : 0;
  const isOverspent = currentMonthExpenses > budgetLimit;
  const showWarning = percentUsed >= 85 && percentUsed <= 100;

  const handleSaveBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const parsed = parseFloat(budgetVal);
    if (isNaN(parsed) || parsed <= 0) {
      setError('Please enter a budget greater than Rs. 0.');
      return;
    }

    try {
      await updateBudget(parsed);
      setIsEditing(false);
    } catch (err: any) {
      setError(err?.message || 'Could not save your budget.');
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[20px] p-5 shadow-[0_14px_34px_-24px_rgba(15,23,42,0.45)] dark:shadow-[0_18px_44px_-26px_rgba(0,0,0,0.85)] hover:-translate-y-0.5 hover:shadow-[0_18px_42px_-24px_rgba(15,23,42,0.5)] dark:hover:shadow-[0_22px_52px_-28px_rgba(0,0,0,0.95)] transition-all duration-[250ms] ease-out font-sans select-none" id="budget-meter-panel">
      <div className="flex items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-900 dark:text-emerald-400">
            <Wallet className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-heading font-bold text-sm text-slate-900 dark:text-white">
              Monthly Budget
            </h3>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
              Set a limit and track your spending.
            </p>
          </div>
        </div>

        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="p-2 rounded-lg bg-slate-50 hover:bg-slate-100 dark:bg-slate-950 dark:hover:bg-slate-800 text-slate-400 dark:text-slate-500 hover:text-indigo-900 dark:hover:text-emerald-400 transition cursor-pointer flex items-center justify-center"
            title="Edit Budget"
            aria-label="Edit budget"
            id="edit-budget-trigger-btn"
          >
            <Edit2 className="w-4 h-4" />
          </button>
        )}
      </div>

      <AnimatePresence>
        {isEditing ? (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={handleSaveBudget}
            className="pb-4 border-b border-slate-100 dark:border-slate-800 mb-4 space-y-3"
            id="budget-editor-form"
          >
            {error && (
              <div className="p-2.5 text-xs text-red-650 bg-red-50 dark:bg-red-950/20 rounded-xl">
                {error}
              </div>
            )}
            
            <div>
              <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
                New Limit (Rs.)
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  required
                  placeholder="e.g. 50000"
                  value={budgetVal}
                  onChange={(e) => setBudgetVal(e.target.value)}
                  className="flex-1 px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-950 dark:text-white font-bold text-sm outline-none focus:ring-1 focus:ring-indigo-600 focus:border-indigo-700"
                  autoFocus
                />
                
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-900 hover:bg-indigo-950 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white rounded-xl shadow-md text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Update</span>
                </button>
                
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-600 dark:text-slate-400 rounded-xl text-xs font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          </motion.form>
        ) : null}
      </AnimatePresence>

      <div className="grid grid-cols-2 gap-4 my-2.5">
        <div>
          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wider">
            Monthly Limit
          </span>
          <p className="text-lg font-extrabold text-indigo-950 dark:text-white mt-0.5">
            {formatINR(budgetLimit)}
          </p>
        </div>

        <div>
          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wider">
            Expenses This Month
          </span>
          <p className={`text-lg font-extrabold mt-0.5 ${isOverspent ? 'text-red-500' : 'text-slate-900 dark:text-neutral-100'}`}>
            {formatINR(currentMonthExpenses)}
          </p>
        </div>
      </div>

      {/* Progress usage slider/meter */}
      <div className="mt-4">
        <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400 dark:text-slate-500 mb-1">
          <span>0%</span>
          <span className={`${isOverspent ? 'text-red-500 font-extrabold' : 'text-indigo-900 dark:text-emerald-400 font-bold'}`}>
            {percentUsed}% Used
          </span>
          <span>100%</span>
        </div>

        <div className="w-full h-3 bg-slate-100 dark:bg-slate-950 rounded-full overflow-hidden shadow-inner">
          <motion.div
            className={`h-full rounded-full ${
              isOverspent
                ? 'bg-gradient-to-r from-red-650 to-red-500'
                : showWarning
                ? 'bg-gradient-to-r from-amber-500 to-amber-400'
                : 'bg-gradient-to-r from-indigo-700 to-emerald-500'
            }`}
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(percentUsed, 100)}%` }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          />
        </div>
      </div>

      {/* Dynamic Spending Alerts with high-trust micro-layout */}
      <div className="mt-4">
        {isOverspent && (
          <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 rounded-2xl flex items-start gap-2.5">
            <AlertTriangle className="w-4.5 h-4.5 text-red-500 shrink-0 mt-0.5 animate-bounce" />
            <div className="text-[11px] leading-relaxed text-red-700 dark:text-red-400">
              <span className="font-bold">You spent too much.</span> You are over your monthly budget of {formatINR(budgetLimit)} by <span className="font-bold">{formatINR(currentMonthExpenses - budgetLimit)}</span>. Try to cut extra spending.
            </div>
          </div>
        )}

        {showWarning && (
          <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30 rounded-2xl flex items-start gap-2.5">
            <AlertTriangle className="w-4.5 h-4.5 text-amber-500 shrink-0 mt-0.5" />
            <div className="text-[11px] leading-relaxed text-amber-800 dark:text-amber-400">
              <span className="font-bold">Careful.</span> You have used <span className="font-bold">{percentUsed}%</span> of your budget. You have {formatINR(remainingBudget)} left for this month.
            </div>
          </div>
        )}

        {!isOverspent && !showWarning && (
          <div className="p-3 bg-emerald-50/50 dark:bg-emerald-950/15 border border-emerald-100 dark:border-emerald-900/20 rounded-2xl flex items-start gap-2.5">
            <Check className="w-4.5 h-4.5 text-emerald-500 shrink-0 mt-0.5" />
            <div className="text-[11px] leading-relaxed text-emerald-800 dark:text-emerald-400/80">
              <span className="font-bold">You are doing well.</span> You still have <span className="font-bold">{formatINR(remainingBudget)}</span> left this month. Great job!
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
