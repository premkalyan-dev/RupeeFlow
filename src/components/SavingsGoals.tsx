/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../context/AppContext.tsx';
import { SavingsGoal } from '../types.ts';
import { formatINR, formatDate } from '../utils.ts';
import { Target, Plus, Trash2, Edit2, Check, Calendar, TrendingUp, Sparkles, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const SavingsGoals: React.FC = () => {
  const { savingsGoals, addSavingsGoal, updateSavingsGoal, deleteSavingsGoal } = useApp();
  const [isExpanding, setIsExpanding] = useState(false);
  const [editingGoal, setEditingGoal] = useState<SavingsGoal | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('');
  const [category, setCategory] = useState('General');
  const [deadline, setDeadline] = useState('');
  const [error, setError] = useState<string | null>(null);

  const resetForm = () => {
    setName('');
    setTargetAmount('');
    setCurrentAmount('0');
    setCategory('General');
    setDeadline('');
    setEditingGoal(null);
    setError(null);
  };

  const handleOpenEdit = (goal: SavingsGoal) => {
    setEditingGoal(goal);
    setName(goal.name);
    setTargetAmount(goal.targetAmount.toString());
    setCurrentAmount(goal.currentAmount.toString());
    setCategory(goal.category);
    setDeadline(goal.deadline);
    setIsExpanding(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const parsedTarget = parseFloat(targetAmount);
    const parsedCurrent = parseFloat(currentAmount || '0');

    if (!name.trim()) {
      setError('Please provide a goal name.');
      return;
    }

    if (isNaN(parsedTarget) || parsedTarget <= 0) {
      setError('Please provide a valid target savings amount greater than ₹0.');
      return;
    }

    if (isNaN(parsedCurrent) || parsedCurrent < 0) {
      setError('Current savings amount cannot be negative.');
      return;
    }

    if (parsedCurrent > parsedTarget) {
      setError('Current saved amount cannot exceed the target goal.');
      return;
    }

    if (!deadline) {
      setError('Please select a target deadline.');
      return;
    }

    const payload = {
      name: name.trim(),
      targetAmount: parsedTarget,
      currentAmount: parsedCurrent,
      category,
      deadline,
    };

    try {
      if (editingGoal) {
        await updateSavingsGoal(editingGoal.id, payload);
      } else {
        await addSavingsGoal(payload);
      }
      setIsExpanding(false);
      resetForm();
    } catch (err: any) {
      setError(err?.message || 'Failed to update savings goal.');
    }
  };

  const handleQuickAddSavings = async (goal: SavingsGoal, amountToAdd: number) => {
    const newCurrent = Math.min(goal.targetAmount, goal.currentAmount + amountToAdd);
    try {
      await updateSavingsGoal(goal.id, { currentAmount: newCurrent });
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6 font-sans select-none" id="savings-goals-panel">
      
      {/* Header card with progress summaries */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold font-heading text-slate-900 dark:text-white flex items-center gap-2">
            <Target className="w-5 h-5 text-emerald-500" />
            <span>Savings Goals</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Build wealth systematically. Define, track, and complete savings targets in real-time.
          </p>
        </div>
        
        {!isExpanding && (
          <button
            onClick={() => {
              resetForm();
              setIsExpanding(true);
            }}
            className="flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-indigo-900 hover:bg-indigo-950 dark:bg-emerald-600 dark:hover:bg-emerald-500 hover:scale-102 cursor-pointer transition shadow-md"
            id="open-add-goal-btn"
          >
            <Plus className="w-4 h-4" />
            <span>Set New Target</span>
          </button>
        )}
      </div>

      <AnimatePresence>
        {isExpanding && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 rounded-3xl overflow-hidden shadow-lg p-5"
            id="savings-goals-editor-form"
          >
            <div className="flex items-center justify-between pb-4 border-b border-slate-50 dark:border-slate-800 mb-4">
              <h4 className="font-heading font-bold text-sm text-slate-900 dark:text-white">
                {editingGoal ? 'Revise Savings Target' : 'Create New Savings Target'}
              </h4>
              <button
                onClick={() => {
                  setIsExpanding(false);
                  resetForm();
                }}
                className="p-1 rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                type="button"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/20 rounded-xl border border-red-200 dark:border-red-900/30">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                    Goal Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. New Mac Studio, Goa Adventure"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 text-sm font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                    Bucket/Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-600/20 text-sm font-medium"
                  >
                    <option value="General">General Savings</option>
                    <option value="Gadgets">Gadgets & Tech</option>
                    <option value="Travel">Travel & Leisure</option>
                    <option value="Vehicles">Car or Bike</option>
                    <option value="Education">Tuitions & Books</option>
                    <option value="Investment">Mutual Funds / Stocks</option>
                    <option value="Emergency">Emergency Reserve</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                    Target Wealth (₹)
                  </label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 150000"
                    value={targetAmount}
                    onChange={(e) => setTargetAmount(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 text-sm font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                    Current Stashed Amount (₹)
                  </label>
                  <input
                    type="number"
                    placeholder="0"
                    value={currentAmount}
                    onChange={(e) => setCurrentAmount(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 text-sm font-medium"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                    Deadline Goal Target
                  </label>
                  <input
                    type="date"
                    required
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-600/20 text-sm font-medium"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setIsExpanding(false);
                    resetForm();
                  }}
                  className="px-4 py-2 font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-800 transition"
                >
                  Keep Layout
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl font-bold text-white bg-indigo-900 hover:bg-indigo-950 dark:bg-emerald-600 dark:hover:bg-emerald-500 shadow flex items-center gap-1"
                  id="save-savings-goal-btn"
                >
                  <Check className="w-4 h-4" />
                  <span>{editingGoal ? 'Commit Update' : 'Generate Goal'}</span>
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Grid of existing Savings Goals */}
      {savingsGoals.length === 0 ? (
        <div className="p-8 text-center bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl" id="empty-goals-placeholder">
          <TrendingUp className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
          <h4 className="text-sm font-bold text-slate-900 dark:text-white font-heading">
            No Savings Target Defined Yet
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
            Give yourself something to save for. Set a target like a new tech setup, a vehicle payment down, or an emergency pool!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4" id="goals-list-grid">
          {savingsGoals.map((goal) => {
            const pct = goal.targetAmount > 0 ? Math.round((goal.currentAmount / goal.targetAmount) * 100) : 0;
            const completed = pct >= 100;

            return (
              <motion.div
                layout
                key={goal.id}
                className={`p-5 bg-white dark:bg-slate-900 border ${
                  completed
                    ? 'border-emerald-200 dark:border-emerald-900/45 bg-emerald-50/5 dark:bg-emerald-950/5'
                    : 'border-slate-100 dark:border-slate-800'
                } rounded-3xl relative overflow-hidden transition duration-300 hover:shadow-md hover:border-slate-200 dark:hover:border-slate-750`}
              >
                {completed && (
                  <div className="absolute top-0 right-0 p-3 bg-emerald-100/60 dark:bg-emerald-900/25 rounded-bl-3xl flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400 animate-pulse" />
                  </div>
                )}

                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <span className="text-[10px] uppercase font-mono tracking-widest font-bold text-indigo-600 dark:text-emerald-400">
                      {goal.category}
                    </span>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white font-heading mt-0.5 line-clamp-1">
                      {goal.name}
                    </h3>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => handleOpenEdit(goal)}
                      className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 transition touch-manipulation cursor-pointer"
                      title="Edit Goal"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Are you sure you want to delete savings goal "${goal.name}"?`)) {
                          deleteSavingsGoal(goal.id);
                        }
                      }}
                      className="p-1.5 rounded-full hover:bg-red-50 dark:hover:bg-red-950/20 text-slate-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-400 transition touch-manipulation cursor-pointer"
                      title="Delete Goal"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Progress Stats */}
                <div className="flex items-end justify-between gap-2 mt-2">
                  <div>
                    <div className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wider">
                      Saved Progress
                    </div>
                    <div className="text-base font-bold text-slate-900 dark:text-white font-sans mt-0.5">
                      {formatINR(goal.currentAmount)}{' '}
                      <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 font-heading">
                        / {formatINR(goal.targetAmount)}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-[13px] font-extrabold text-indigo-900 dark:text-emerald-400 font-mono">
                      {pct}%
                    </div>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-950 rounded-full mt-3 overflow-hidden">
                  <motion.div
                    className={`h-full rounded-full ${
                      completed
                        ? 'bg-gradient-to-r from-emerald-500 to-green-400'
                        : 'bg-gradient-to-r from-indigo-700 to-emerald-500'
                    }`}
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(pct, 100)}%` }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                  />
                </div>

                <div className="flex items-center justify-between gap-1 mt-4 pt-3.5 border-t border-slate-50 dark:border-slate-800/80">
                  <div className="flex items-center gap-1.5 text-slate-400 dark:text-slate-500 text-[11px] font-medium leading-none">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Target: {formatDate(goal.deadline)}</span>
                  </div>

                  {/* Quick-add buttons (e.g. +₹100, +₹1,000, +₹5,000, +₹10,000) for fast tracking! */}
                  {!completed && (
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleQuickAddSavings(goal, 1000)}
                        className="px-2 py-1 rounded-lg text-[10px] font-bold bg-slate-50 hover:bg-slate-100 dark:bg-slate-950 dark:hover:bg-slate-800 border border-slate-100 dark:border-slate-850 text-slate-600 dark:text-emerald-400 transition"
                      >
                        +₹1k
                      </button>
                      <button
                        onClick={() => handleQuickAddSavings(goal, 10000)}
                        className="px-2 py-1 rounded-lg text-[10px] font-bold bg-slate-50 hover:bg-slate-100 dark:bg-slate-950 dark:hover:bg-slate-800 border border-slate-100 dark:border-slate-850 text-slate-600 dark:text-emerald-400 transition"
                      >
                        +₹10k
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};
