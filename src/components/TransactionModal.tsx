/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState, useEffect } from 'react';
import { Transaction, TransactionType, TransactionCategory } from '../types.ts';
import { useApp } from '../context/AppContext.tsx';
import { EXPENSE_CATEGORIES } from '../utils.ts';
import { X, Check } from 'lucide-react';
import { motion } from 'motion/react';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  editTransaction?: Transaction | null;
}

const getFocusableElements = (container: HTMLElement) =>
  Array.from(
    container.querySelectorAll<HTMLElement>(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )
  );

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  editTransaction = null,
}) => {
  const { addTransaction, updateTransaction } = useApp();
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const [amount, setAmount] = useState<string>('');
  const [type, setType] = useState<TransactionType>('expense');
  const [category, setCategory] = useState<TransactionCategory>('Food');
  const [description, setDescription] = useState<string>('');
  const [date, setDate] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (editTransaction) {
      setAmount(editTransaction.amount.toString());
      setType(editTransaction.type);
      setCategory(editTransaction.category);
      setDescription(editTransaction.description);
      setDate(editTransaction.date);
    } else {
      // Setup Defaults
      setAmount('');
      setType('expense');
      setCategory('Food');
      setDescription('');
      
      // Default date to today in IST
      const todayISO = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD format
      setDate(todayISO);
    }
    setError(null);
  }, [editTransaction, isOpen]);

  // If Type shifts, pivot category selection
  useEffect(() => {
    if (type === 'saving') {
      setCategory('Savings');
    } else if (category === 'Savings') {
      setCategory('Food');
    }
  }, [type, category]);

  useEffect(() => {
    if (!isOpen) return;

    const previousActiveElement = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    dialogRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
        return;
      }

      if (event.key !== 'Tab' || !dialogRef.current) return;
      const focusableElements = getFocusableElements(dialogRef.current);
      if (focusableElements.length === 0) return;
      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      previousActiveElement?.focus();
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Please enter an amount greater than Rs. 0.');
      return;
    }

    if (!description.trim()) {
      setError('Please add a short note.');
      return;
    }

    if (!date) {
      setError('Please choose a date.');
      return;
    }

    const payload = {
      amount: parsedAmount,
      type,
      category,
      description: description.trim(),
      date,
    };

    try {
      if (editTransaction) {
        await updateTransaction(editTransaction.id, payload);
      } else {
        await addTransaction(payload);
      }
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Could not save this record.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm select-none">
      <motion.div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="transaction-modal-title"
        tabIndex={-1}
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden"
        id="transaction-modal-card"
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800">
          <h3 id="transaction-modal-title" className="text-lg font-bold text-slate-900 dark:text-white font-heading">
            {editTransaction ? 'Edit Record' : 'Add Record'}
          </h3>
          <button
            onClick={onClose}
            className="min-h-11 min-w-11 p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 dark:text-slate-500 hover:text-slate-700 hover:dark:text-slate-200 transition inline-flex items-center justify-center"
            aria-label="Close record form"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/20 rounded-xl border border-red-200 dark:border-red-900/30">
              {error}
            </div>
          )}

          {/* Choose spending or saving */}
          <div className="flex p-1 bg-slate-150 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800/60">
            <button
              type="button"
              onClick={() => setType('expense')}
              aria-pressed={type === 'expense'}
                className={`min-h-11 flex-1 py-2.5 text-xs font-semibold rounded-xl text-center transition cursor-pointer ${
                type === 'expense'
                  ? 'bg-indigo-900 text-white dark:bg-slate-800 shadow-md'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
              }`}
            >
              Spending
            </button>
            <button
              type="button"
              onClick={() => setType('saving')}
              aria-pressed={type === 'saving'}
                className={`min-h-11 flex-1 py-2.5 text-xs font-semibold rounded-xl text-center transition cursor-pointer ${
                type === 'saving'
                  ? 'bg-emerald-600 text-white dark:bg-emerald-600 shadow-md'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
              }`}
            >
              Saving
            </button>
          </div>

          {/* Amount Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
              Amount (Rs.)
            </label>
            <div className="relative rounded-xl shadow-sm">
              <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400 font-heading font-semibold text-base">
                Rs.
              </span>
              <input
                type="number"
                step="any"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="block w-full pl-8 pr-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-700 text-base font-semibold"
                placeholder="0"
                autoFocus
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Category Select */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                Category
              </label>
              {type === 'saving' ? (
                <div className="w-full px-3.5 py-3 bg-slate-100 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 rounded-xl text-sm font-semibold select-all">
                  Savings
                </div>
              ) : (
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as TransactionCategory)}
                  className="w-full px-3.5 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-700 text-sm font-medium"
                >
                  {EXPENSE_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Date Input */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                Date
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3.5 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-700 text-sm font-medium"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
              Note
            </label>
            <input
              type="text"
              required
              placeholder="e.g. lunch, petrol, groceries"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-700 text-sm"
            />
          </div>

          {/* Action button */}
          <div className="pt-2 flex items-center justify-end gap-3 text-sm">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-800 hover:dark:text-slate-200 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl font-bold text-white bg-indigo-900 hover:bg-indigo-950 dark:bg-emerald-600 dark:hover:bg-emerald-500 shadow-md flex items-center gap-1.5 cursor-pointer"
              id="save-transaction-btn"
            >
              <Check className="w-4 h-4" />
              <span>{editTransaction ? 'Save Changes' : 'Save Record'}</span>
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
