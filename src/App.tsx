/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext.tsx';
import { AuthPage } from './components/AuthPage.tsx';
import { MainLogo } from './components/Logo.tsx';
import { TransactionModal } from './components/TransactionModal.tsx';
import { SavingsGoals } from './components/SavingsGoals.tsx';
import { BudMeter } from './components/BudMeter.tsx';
import { AnalyticsCharts } from './components/AnalyticsCharts.tsx';
import { getCategoryMeta, formatINR, formatDate, EXPENSE_CATEGORIES } from './utils.ts';
import { Transaction, TransactionType, TransactionCategory } from './types.ts';
import {
  Plus,
  Search,
  Filter,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Trash2,
  Edit2,
  LayoutDashboard,
  Target,
  PieChart as PieIcon,
  LogOut,
  Sun,
  Moon,
  ChevronRight,
  TrendingUp,
  Receipt,
  Download,
  Grid,
} from 'lucide-react';

const DashboardContent: React.FC = () => {
  const {
    auth,
    transactions,
    savingsGoals,
    userConfig,
    logout,
    deleteTransaction,
  } = useApp();

  // Navigation tabs state
  const [activeTab, setActiveTab] = useState<'dashboard' | 'goals' | 'analytics' | 'history'>('dashboard');
  
  // Modal controllers
  const [modalOpen, setModalOpen] = useState(false);
  const [editTx, setEditTx] = useState<Transaction | null>(null);

  // Search & Filter parameters for context auditing
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [typeFilter, setTypeFilter] = useState<'All' | 'expense' | 'saving'>('All');

  // Dark theme control
  const [isDark, setIsDark] = useState<boolean>(() => {
    return localStorage.getItem('rupeeflow_theme') === 'dark';
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('rupeeflow_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('rupeeflow_theme', 'light');
    }
  }, [isDark]);

  // Calculations
  const totalExpenses = transactions
    .filter((tx) => tx.type === 'expense')
    .reduce((sum, tx) => sum + tx.amount, 0);

  const totalSavings = transactions
    .filter((tx) => tx.type === 'saving')
    .reduce((sum, tx) => sum + tx.amount, 0);

  // Compute expenses for active month
  const currentMonthExpenses = transactions
    .filter((tx) => {
      if (tx.type !== 'expense') return false;
      const now = new Date();
      const txDate = new Date(tx.date);
      return txDate.getFullYear() === now.getFullYear() && txDate.getMonth() === now.getMonth();
    })
    .reduce((sum, tx) => sum + tx.amount, 0);

  const budgetLimit = userConfig?.monthlyBudget || 50000;
  const remainingBudget = Math.max(0, budgetLimit - currentMonthExpenses);

  // Math calculation for savings progress percent average
  const totalGoalsTarget = savingsGoals.reduce((sum, g) => sum + g.targetAmount, 0);
  const totalGoalsSaved = savingsGoals.reduce((sum, g) => sum + g.currentAmount, 0);
  const aggregateGoalsPct = totalGoalsTarget > 0 ? Math.round((totalGoalsSaved / totalGoalsTarget) * 100) : 0;

  // Recent transactions mapping (limit to 10 for dashboard)
  const last10Transactions = transactions.slice(0, 10);

  const handleOpenEditTx = (tx: Transaction) => {
    setEditTx(tx);
    setModalOpen(true);
  };

  const handleOpenAddTx = () => {
    setEditTx(null);
    setModalOpen(true);
  };

  // Filter list data for Full Ledger History tab
  const filteredTransactions = transactions.filter((tx) => {
    const matchesSearch =
      tx.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'All' || tx.category === categoryFilter;
    const matchesType = typeFilter === 'All' || tx.type === typeFilter;
    return matchesSearch && matchesCategory && matchesType;
  });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col font-sans select-none pb-24 md:pb-6">
      
      {/* 1. Global Navigation Top Header */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-100 dark:border-slate-800/80 transition">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          
          <MainLogo size={28} showSubtitle={false} className="shrink-0" />

          <div className="hidden lg:flex items-center gap-2">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 truncate max-w-[150px]">
              {auth.user?.email}
            </span>
          </div>

          {/* Action Header controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* Theme sliding toggle */}
            <button
              onClick={() => setIsDark((current) => !current)}
              className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400 transition cursor-pointer flex items-center justify-center touch-manipulation"
              title="Toggle Theme"
            >
              {isDark ? <Sun className="w-4.5 h-4.5 text-amber-400" /> : <Moon className="w-4.5 h-4.5 text-indigo-950" />}
            </button>

            <button
              onClick={() => {
                if (confirm('Are you sure you want to sign out of RupeeFlow SpendWise?')) {
                  logout();
                }
              }}
              className="p-2.5 rounded-xl bg-red-50 hover:bg-red-100 dark:bg-red-950/15 border border-red-100/50 dark:border-red-900/30 text-red-600 dark:text-red-400 transition cursor-pointer flex items-center justify-center touch-manipulation"
              title="Sign Out"
            >
              <LogOut className="w-4.5 h-4.5" />
            </button>
          </div>
        </div>
      </header>

      {/* 2. Primary Layout Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">

        {/* 3. Desktops Tabs (Navigation Side-by-side) */}
        <div className="hidden md:flex items-center gap-1.5 p-1 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 max-w-lg mb-6">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer ${
              activeTab === 'dashboard'
                ? 'bg-indigo-900 text-white dark:bg-emerald-600'
                : 'text-slate-500 hover:text-slate-800 hover:dark:text-slate-200'
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span>Dashboard</span>
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer ${
              activeTab === 'history'
                ? 'bg-indigo-900 text-white dark:bg-emerald-600'
                : 'text-slate-500 hover:text-slate-800 hover:dark:text-slate-200'
            }`}
          >
            <Receipt className="w-3.5 h-3.5" />
            <span>History</span>
          </button>
          <button
            onClick={() => setActiveTab('goals')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer ${
              activeTab === 'goals'
                ? 'bg-indigo-900 text-white dark:bg-emerald-600'
                : 'text-slate-500 hover:text-slate-800 hover:dark:text-slate-200'
            }`}
          >
            <Target className="w-3.5 h-3.5" />
            <span>Savings Goals</span>
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer ${
              activeTab === 'analytics'
                ? 'bg-indigo-900 text-white dark:bg-emerald-600'
                : 'text-slate-500 hover:text-slate-800 hover:dark:text-slate-200'
            }`}
          >
            <PieIcon className="w-3.5 h-3.5" />
            <span>Charts</span>
          </button>
        </div>

        {/* ----------------- VIEW 1: MAIN DASHBOARD ----------------- */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6" id="dashboard-tab-view">
            
            {/* Bento Grid Top Stats Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" id="bento-stats-grid">
              
              {/* Stat 1: Month Spends */}
              <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col justify-between relative overflow-hidden group hover:shadow-md transition">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wider">
                      Spending This Month
                    </p>
                    <h3 className="text-2xl font-extrabold text-indigo-950 dark:text-white font-sans mt-1">
                      {formatINR(currentMonthExpenses)}
                    </h3>
                  </div>
                  <div className="p-2.5 rounded-2xl bg-orange-50 dark:bg-orange-950/20 text-orange-500">
                    <ArrowUpRight className="w-5 h-5" />
                  </div>
                </div>
                <div className="flex items-center gap-1 mt-1 text-[11px] text-slate-400 dark:text-slate-500">
                  <span>Total spent:</span>
                  <strong className="text-slate-600 dark:text-slate-350">{formatINR(totalExpenses)}</strong>
                </div>
              </div>

              {/* Stat 2: Total Savings Stashed */}
              <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col justify-between relative overflow-hidden group hover:shadow-md transition">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wider">
                      Stashed Savings
                    </p>
                    <h3 className="text-2xl font-extrabold text-slate-950 dark:text-white font-sans mt-1">
                      {formatINR(totalSavings)}
                    </h3>
                  </div>
                  <div className="p-2.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 text-emerald-500">
                    <ArrowDownRight className="w-5 h-5" />
                  </div>
                </div>
                <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1 mt-1">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>Save money step by step</span>
                </p>
              </div>

              {/* Stat 3: Remaining Safe Budget */}
              <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm sm:col-span-2 lg:col-span-1 flex flex-col justify-between relative overflow-hidden group hover:shadow-md transition">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wider">
                      Money Left This Month
                    </p>
                    <h3 className={`text-2xl font-extrabold font-sans mt-1 ${remainingBudget <= 1000 ? 'text-red-500' : 'text-slate-900 dark:text-neutral-150'}`}>
                      {formatINR(remainingBudget)}
                    </h3>
                  </div>
                  <div className={`p-2.5 rounded-2xl ${remainingBudget <= 1000 ? 'bg-red-55 bg-opacity-10 text-red-500' : 'bg-indigo-50 dark:bg-slate-800 text-indigo-900 dark:text-white'}`}>
                    <Receipt className="w-5 h-5" />
                  </div>
                </div>
                <div className="flex items-center gap-1 text-[11px] text-slate-450 dark:text-slate-500">
                  <span>Monthly limit:</span>
                  <strong className="text-slate-650 dark:text-slate-350">{formatINR(budgetLimit)}</strong>
                </div>
              </div>

            </div>

            {/* Quick Record Float Trigger with massive CTA */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-gradient-to-r from-indigo-950 to-indigo-900 dark:from-slate-900 dark:to-slate-850 rounded-3xl text-white shadow-xl">
              <div>
                <h3 className="font-heading font-extrabold text-base tracking-tight">
                  Add your spending in 30 seconds
                </h3>
                <p className="text-xs text-indigo-200/80 dark:text-white/60 mt-1 max-w-sm">
                  Add daily costs, shopping, food, or savings quickly.
                </p>
              </div>
              <button
                onClick={handleOpenAddTx}
                className="py-3 px-5 text-sm font-bold bg-emerald-500 hover:bg-emerald-400 text-indigo-950 dark:text-white rounded-xl shadow-lg flex items-center justify-center gap-2 cursor-pointer transition hover:scale-102 uppercase tracking-wide"
                id="record-spend-dash-btn"
              >
                <Plus className="w-4.5 h-4.5" />
                <span>Add Spend / Saving</span>
              </button>
            </div>

            {/* Middle Split: Budget meter left, Savings summary right */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              <div className="lg:col-span-7">
                <BudMeter />
              </div>

              {/* Small Wealth Summary & Goals preview widget */}
              <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-5 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-2 pb-3 mb-2.5 border-b border-slate-50 dark:border-slate-800">
                    <h4 className="font-heading font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                      <Target className="w-4 h-4 text-emerald-500" />
                      <span>Savings Progress</span>
                    </h4>
                    <button
                      onClick={() => setActiveTab('goals')}
                      className="text-[10px] font-bold text-indigo-600 dark:text-emerald-400 hover:underline flex items-center gap-0.5"
                    >
                      <span>See All</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>

                  {savingsGoals.length === 0 ? (
                    <div className="py-8 text-center text-xs text-slate-400">
                      You have no savings goals yet. Add one from the Savings Goals tab.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-end justify-between">
                        <div>
                          <p className="text-[10px] uppercase font-mono tracking-wider font-semibold text-slate-400">
                            Total Saved
                          </p>
                          <h4 className="text-xl font-extrabold text-indigo-950 dark:text-white mt-1">
                            {formatINR(totalGoalsSaved)}{' '}
                            <span className="text-xs font-semibold text-slate-400">
                              / {formatINR(totalGoalsTarget)}
                            </span>
                          </h4>
                        </div>
                        <span className="text-base font-extrabold text-emerald-500 font-mono">
                          {aggregateGoalsPct}%
                        </span>
                      </div>

                      {/* Stack mini progress lines of top 2 goals */}
                      {savingsGoals.slice(0, 2).map((goal) => {
                        const targetVal = goal.targetAmount;
                        const savedVal = goal.currentAmount;
                        const fraction = targetVal > 0 ? Math.round((savedVal / targetVal) * 100) : 0;
                        return (
                          <div key={goal.id} className="text-xs">
                            <div className="flex items-center justify-between text-[11px] text-slate-650 dark:text-slate-400 mb-1">
                              <span className="font-semibold truncate max-w-[200px]">{goal.name}</span>
                              <span className="font-mono">{fraction}%</span>
                            </div>
                            <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-950 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-emerald-500 transition-all duration-350"
                                style={{ width: `${Math.min(fraction, 100)}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-slate-50 dark:border-slate-800/80 text-[10px] text-slate-400 leading-relaxed font-medium">
                  A simple habit: try to save some money every month.
                </div>
              </div>

            </div>

            {/* Recent list table ledger layout */}
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-5 rounded-3xl" id="recent-transactions-widget">
              <div className="flex items-center justify-between gap-4 pb-3 mb-4 border-b border-slate-100 dark:border-slate-800/80">
                <div>
                  <h4 className="font-heading font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                    <Receipt className="w-4 h-4 text-slate-400" />
                    <span>Recent Records (Last 10)</span>
                  </h4>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                    Check, edit, or delete your latest records here.
                  </p>
                </div>

                <button
                  onClick={() => setActiveTab('history')}
                  className="px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 dark:bg-slate-950 dark:hover:bg-slate-850 border border-slate-100 dark:border-slate-800 text-[10px] font-bold text-slate-500 hover:text-indigo-900 transition flex items-center gap-1 whitespace-nowrap"
                >
                  <Grid className="w-3.5 h-3.5" />
                  <span>Show All Records</span>
                </button>
              </div>

              {last10Transactions.length === 0 ? (
                <div className="py-10 text-center text-xs text-slate-400" id="empty-dashboard-transactions">
                  No records stored yet. Click the record button above to log your first spend or saver!
                </div>
              ) : (
                <div className="overflow-x-auto" id="dashboard-ledger-table-box">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-50 dark:border-slate-850 text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">
                        <th className="py-2.5 px-3">Date</th>
                        <th className="py-2.5 px-3">Category</th>
                        <th className="py-2.5 px-3">Note</th>
                        <th className="py-2.5 px-3">Kind</th>
                        <th className="py-2.5 px-3 text-right">Amount</th>
                        <th className="py-2.5 px-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 dark:divide-slate-850">
                      {last10Transactions.map((tx) => {
                        const meta = getCategoryMeta(tx.category);
                        return (
                          <tr
                            key={tx.id}
                            className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition group"
                          >
                            <td className="py-3 px-3 font-medium text-slate-550 dark:text-slate-400 whitespace-nowrap">
                              {formatDate(tx.date)}
                            </td>
                            <td className="py-3 px-3">
                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold text-semibold ${meta.bgClass} ${meta.textClass}`}>
                                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: meta.color }} />
                                {meta.name}
                              </span>
                            </td>
                            <td className="py-3 px-3 font-semibold text-slate-800 dark:text-slate-200 line-clamp-1 max-w-[150px] sm:max-w-[250px] truncate">
                              {tx.description}
                            </td>
                            <td className="py-3 px-3 whitespace-nowrap">
                              {tx.type === 'expense' ? (
                                <span className="text-red-500 dark:text-red-400 font-bold text-[10px] uppercase font-mono tracking-widest">
                                  Spending
                                </span>
                              ) : (
                                <span className="text-emerald-500 dark:text-emerald-400 font-bold text-[10px] uppercase font-mono tracking-widest">
                                  Saving
                                </span>
                              )}
                            </td>
                            <td className={`py-3 px-3 text-right font-bold text-sm whitespace-nowrap ${
                              tx.type === 'expense' ? 'text-red-550' : 'text-emerald-500 dark:text-emerald-400'
                            }`}>
                              {tx.type === 'expense' ? '-' : '+'}{formatINR(tx.amount)}
                            </td>
                            <td className="py-3 px-3 text-right">
                              <div className="flex items-center justify-end gap-1.5 opacity-80 group-hover:opacity-100 transition">
                                <button
                                  onClick={() => handleOpenEditTx(tx)}
                                  className="p-1 rounded-md text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-850 hover:text-slate-700 dark:hover:text-slate-200 transition touch-manipulation cursor-pointer"
                                  title="Quick Edit"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => {
                                    if (confirm(`Delete this record: "${tx.description}"?`)) {
                                      deleteTransaction(tx.id);
                                    }
                                  }}
                                  className="p-1 rounded-md text-slate-400 hover:bg-red-50 dark:hover:bg-red-950/20 hover:text-red-600 dark:hover:text-red-400 transition touch-manipulation cursor-pointer"
                                  title="Quick Delete"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          </div>
        )}

        {/* ----------------- VIEW 2: HISTORY ----------------- */}
        {activeTab === 'history' && (
          <div className="space-y-6" id="history-tab-view">
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-5 rounded-3xl" id="full-ledger-filter-card">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 mb-4 border-b border-slate-150 dark:border-slate-800">
                <div>
                  <h3 className="font-heading font-bold text-base text-slate-900 dark:text-white">
                    Full History
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Search and manage all your records.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleOpenAddTx}
                    className="py-2.5 px-4 text-xs font-bold bg-indigo-900 hover:bg-indigo-950 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white rounded-xl shadow-md flex items-center justify-center gap-1 cursor-pointer transition"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add New</span>
                  </button>
                </div>
              </div>

              {/* Filtering toolbox inline */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5">
                <div className="sm:col-span-5 relative text-slate-400 focus-within:text-indigo-900">
                  <Search className="w-4 h-4 absolute left-3 top-3" />
                  <input
                    type="text"
                    placeholder="Search note or category..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-205 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-indigo-900/30"
                  />
                </div>

                <div className="sm:col-span-3">
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-205 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:outline-none"
                  >
                    <option value="All">All Categories</option>
                    {EXPENSE_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                    <option value="Savings">Only Savings</option>
                  </select>
                </div>

                <div className="sm:col-span-4">
                  <div className="flex p-1 bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-500">
                    <button
                      onClick={() => setTypeFilter('All')}
                      className={`flex-1 py-1 text-[11px] font-bold rounded-lg text-center transition ${
                        typeFilter === 'All' ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow' : 'hover:text-slate-800'
                      }`}
                    >
                      All Types
                    </button>
                    <button
                      onClick={() => setTypeFilter('expense')}
                      className={`flex-1 py-1 text-[11px] font-bold rounded-lg text-center transition ${
                        typeFilter === 'expense' ? 'bg-white dark:bg-slate-800 text-red-500 dark:text-red-400 shadow' : 'hover:text-slate-800'
                      }`}
                    >
                      Spending
                    </button>
                    <button
                      onClick={() => setTypeFilter('saving')}
                      className={`flex-1 py-1 text-[11px] font-bold rounded-lg text-center transition ${
                        typeFilter === 'saving' ? 'bg-white dark:bg-slate-800 text-emerald-500 dark:text-emerald-400 shadow' : 'hover:text-slate-800'
                      }`}
                    >
                      Saved
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Structured tabular list */}
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-5 shadow-sm" id="full-ledger-table-card">
              {filteredTransactions.length === 0 ? (
                <div className="py-14 text-center text-xs text-slate-400" id="filtered-ledger-empty">
                  No records matching the selected search query or category filters list.
                </div>
              ) : (
                <div className="overflow-x-auto" id="full-ledger-table-box">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-50 dark:border-slate-850 text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">
                        <th className="py-2.5 px-3">Date</th>
                        <th className="py-2.5 px-3">Category</th>
                        <th className="py-2.5 px-3">Note</th>
                        <th className="py-2.5 px-3">Kind</th>
                        <th className="py-2.5 px-3 text-right">Amount</th>
                        <th className="py-2.5 px-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 dark:divide-slate-850">
                      {filteredTransactions.map((tx) => {
                        const meta = getCategoryMeta(tx.category);
                        return (
                          <tr
                            key={tx.id}
                            className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition group"
                          >
                            <td className="py-3 px-3 font-medium text-slate-550 dark:text-slate-400 whitespace-nowrap">
                              {formatDate(tx.date)}
                            </td>
                            <td className="py-3 px-3">
                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold text-semibold ${meta.bgClass} ${meta.textClass}`}>
                                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: meta.color }} />
                                {meta.name}
                              </span>
                            </td>
                            <td className="py-3 px-3 font-semibold text-slate-800 dark:text-slate-200 line-clamp-1 max-w-[200px] truncate">
                              {tx.description}
                            </td>
                            <td className="py-3 px-3">
                              {tx.type === 'expense' ? (
                                <span className="text-red-500 dark:text-red-400 font-bold text-[10px] uppercase font-mono tracking-widest">
                                  Spending
                                </span>
                              ) : (
                                <span className="text-emerald-500 dark:text-emerald-400 font-bold text-[10px] uppercase font-mono tracking-widest">
                                  Saving
                                </span>
                              )}
                            </td>
                            <td className={`py-3 px-3 text-right font-bold text-sm whitespace-nowrap ${
                              tx.type === 'expense' ? 'text-red-550' : 'text-emerald-500 dark:text-emerald-400'
                            }`}>
                              {tx.type === 'expense' ? '-' : '+'}{formatINR(tx.amount)}
                            </td>
                            <td className="py-3 px-3 text-right">
                              <div className="flex items-center justify-end gap-1.5 opacity-80 group-hover:opacity-100 transition">
                                <button
                                  onClick={() => handleOpenEditTx(tx)}
                                  className="p-1 rounded-md text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-850 hover:text-slate-700 dark:hover:text-slate-200 transition touch-manipulation cursor-pointer"
                                  title="Edit Entry"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => {
                                    if (confirm(`Delete this record: "${tx.description}"?`)) {
                                      deleteTransaction(tx.id);
                                    }
                                  }}
                                  className="p-1 rounded-md text-slate-400 hover:bg-red-50 dark:hover:bg-red-950/20 hover:text-red-650 dark:hover:text-red-400 transition touch-manipulation cursor-pointer"
                                  title="Delete Entry"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ----------------- VIEW 3: SAVINGS TARGETS ----------------- */}
        {activeTab === 'goals' && (
          <div id="goals-tab-view">
            <SavingsGoals />
          </div>
        )}

        {/* ----------------- VIEW 4: ANALYTICS CHARTS ----------------- */}
        {activeTab === 'analytics' && (
          <div className="space-y-6" id="analytics-tab-view">
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-5 rounded-3xl" id="analytics-header-card">
              <h3 className="font-heading font-bold text-base text-slate-900 dark:text-white">
                Money Overview
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                See your spending, savings, and goals in simple charts.
              </p>
            </div>
            
            <AnalyticsCharts />
          </div>
        )}

      </main>

      {/* 4. Global Floating Tab Bar (Mobile/Touch-first optimized) */}
      <footer className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/90 dark:bg-slate-900/95 backdrop-blur-lg border-t border-slate-100 dark:border-slate-850/80 px-4 py-2 transition-transform">
        <div className="flex items-center justify-between gap-1 max-w-md mx-auto">
          
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex-1 flex flex-col items-center justify-center py-2 gap-1 rounded-xl text-[10px] font-bold transition cursor-pointer ${
              activeTab === 'dashboard'
                ? 'text-indigo-900 dark:text-emerald-400 bg-slate-50 dark:bg-slate-950/80'
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <LayoutDashboard className="w-4.5 h-4.5" />
            <span>Dashboard</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`flex-1 flex flex-col items-center justify-center py-1.5 gap-1 rounded-xl text-[10px] font-bold transition cursor-pointer ${
              activeTab === 'history'
                ? 'text-indigo-900 dark:text-emerald-400 bg-slate-50 dark:bg-slate-950/80'
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <Receipt className="w-4.5 h-4.5" />
            <span>History</span>
          </button>

          <button
            onClick={() => setActiveTab('goals')}
            className={`flex-1 flex flex-col items-center justify-center py-1.5 gap-1 rounded-xl text-[10px] font-bold transition cursor-pointer ${
              activeTab === 'goals'
                ? 'text-indigo-900 dark:text-emerald-405 bg-slate-50 dark:bg-slate-950/80'
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <Target className="w-4.5 h-4.5" />
            <span>Goals</span>
          </button>

          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex-1 flex flex-col items-center justify-center py-1.5 gap-1 rounded-xl text-[10px] font-bold transition cursor-pointer ${
              activeTab === 'analytics'
                ? 'text-indigo-900 dark:text-emerald-400 bg-slate-50 dark:bg-slate-950/80'
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <PieIcon className="w-4.5 h-4.5" />
            <span>Charts</span>
          </button>

        </div>
      </footer>

      {/* 5. Record Modal */}
      <TransactionModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditTx(null);
        }}
        editTransaction={editTx}
      />

    </div>
  );
};

function AppConsumer() {
  const { auth, loading } = useApp();

  // If initial load in progress
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center font-sans gap-4 text-xs tracking-wider uppercase font-bold text-slate-400">
        <div className="w-8 h-8 border-2 border-indigo-900 dark:border-emerald-500 border-t-transparent rounded-full animate-spin" />
        <span>Loading...</span>
      </div>
    );
  }

  // Bind login view if not verified
  if (!auth.user) {
    return <AuthPage />;
  }

  return <DashboardContent />;
}

export default function App() {
  return (
    <AppProvider>
      <AppConsumer />
    </AppProvider>
  );
}
