/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useApp } from '../context/AppContext.tsx';
import { getCategoryMeta, formatINR } from '../utils.ts';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  LineChart,
  Line,
} from 'recharts';
import { PieChartIcon, TrendingUp, BarChart2, Activity, Info } from 'lucide-react';

export const AnalyticsCharts: React.FC = () => {
  const { transactions, savingsGoals } = useApp();

  // 1. DATA PREPARATION: Category Expense Pie Chart
  const expenseTransactions = transactions.filter((tx) => tx.type === 'expense');
  const categoryTotals: Record<string, number> = {};
  
  expenseTransactions.forEach((tx) => {
    categoryTotals[tx.category] = (categoryTotals[tx.category] || 0) + tx.amount;
  });

  const categoryPieData = Object.entries(categoryTotals).map(([name, value]) => {
    const meta = getCategoryMeta(name as any);
    return {
      name,
      value,
      color: meta.color,
    };
  });

  // 2. DATA PREPARATION: Expense vs Savings Comparison
  // Retrieve last 5 months
  const monthlyComparisonMap: Record<string, { month: string; Expenses: number; Savings: number }> = {};
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  // Fill in active months
  transactions.forEach((tx) => {
    const d = new Date(tx.date);
    if (isNaN(d.getTime())) return;
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const formattedMonth = `${monthNames[d.getMonth()]} ${d.getFullYear().toString().substr(2, 2)}`;
    
    if (!monthlyComparisonMap[key]) {
      monthlyComparisonMap[key] = { month: formattedMonth, Expenses: 0, Savings: 0 };
    }
    
    if (tx.type === 'expense') {
      monthlyComparisonMap[key].Expenses += tx.amount;
    } else if (tx.type === 'saving') {
      monthlyComparisonMap[key].Savings += tx.amount;
    }
  });

  // Sort months chronologically
  const sortedMonthsData = Object.entries(monthlyComparisonMap)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([_, val]) => val)
    .slice(-5); // Get last 5 months

  // 3. DATA PREPARATION: Monthly Expense Trend (Current Month Daily Area chart)
  const dailyTrendMap: Record<string, number> = {};
  const now = new Date();
  
  transactions
    .filter((tx) => {
      if (tx.type !== 'expense') return false;
      const d = new Date(tx.date);
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    })
    .forEach((tx) => {
      const d = new Date(tx.date);
      const dayKey = String(d.getDate()).padStart(2, '0');
      dailyTrendMap[dayKey] = (dailyTrendMap[dayKey] || 0) + tx.amount;
    });

  const dailyTrendData = Object.entries(dailyTrendMap)
    .map(([day, amount]) => ({
      day: `Day ${day}`,
      Expenses: amount,
    }))
    .sort((a, b) => a.day.localeCompare(b.day));

  // 4. DATA PREPARATION: Savings Progress towards Goals
  const savingsGoalsData = savingsGoals.map((g) => ({
    name: g.name.length > 10 ? g.name.substring(0, 10) + '..' : g.name,
    Saved: g.currentAmount,
    Target: g.targetAmount,
  }));

  // Render Tooltip Formatting
  const renderTooltipContent = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="p-3 bg-slate-900 border border-slate-800 text-white rounded-xl shadow-xl text-xs space-y-1 font-sans">
          <p className="font-bold font-heading text-slate-300">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }}>
              <span className="font-semibold">{entry.name}:</span> {formatINR(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const hasData = transactions.length > 0;

  return (
    <div className="space-y-6 font-sans select-none" id="analytics-charts-panel">
      {!hasData ? (
        <div className="p-10 text-center bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 rounded-3xl" id="analytics-empty-state">
          <Activity className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-4" />
          <h4 className="font-heading font-bold text-slate-900 dark:text-white">
            No Chart Data Yet
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto leading-relaxed">
            Add a few records and your charts will show up here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6" id="analytics-reports-grid">
          
          {/* Chart 1: Monthly Expense Trend */}
          <div className="p-5 bg-white dark:bg-slate-900 border border-slate-105 dark:border-slate-800 rounded-3xl flex flex-col justify-between">
            <div className="mb-4">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white font-heading flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-indigo-900" />
                <span>Daily Spending</span>
              </h4>
              <p className="text-[10px] text-slate-400 dark:text-slate-500">
                Spending for each day this month.
              </p>
            </div>
            
            <div className="h-48 w-full" id="monthly-expense-trend-chart">
              {dailyTrendData.length === 0 ? (
                <div className="h-full flex items-center justify-center text-xs text-slate-400">
                  No expense records added yet this month.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={dailyTrendData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366F1" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#6366F1" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="day" tick={{ fontSize: 9 }} stroke="#888888" tickLine={false} />
                    <YAxis tick={{ fontSize: 9 }} stroke="#888888" tickLine={false} />
                    <Tooltip content={renderTooltipContent} />
                    <Area
                      type="monotone"
                      dataKey="Expenses"
                      stroke="#4F46E5"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorExpenses)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Chart 2: Category Expense Breakdown */}
          <div className="p-5 bg-white dark:bg-slate-900 border border-slate-105 dark:border-slate-800 rounded-3xl flex flex-col justify-between">
            <div className="mb-4">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white font-heading flex items-center gap-2">
                <PieChartIcon className="w-4 h-4 text-emerald-500" />
                <span>Spending by Category</span>
              </h4>
              <p className="text-[10px] text-slate-400 dark:text-slate-500">
                See where your money is going.
              </p>
            </div>

            <div className="h-48 w-full flex items-center justify-center" id="category-expense-piechart">
              {categoryPieData.length === 0 ? (
                <div className="text-xs text-slate-400">No spending records found.</div>
              ) : (
                <div className="w-full h-full flex flex-row items-center">
                  <div className="w-1/2 h-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={categoryPieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={45}
                          outerRadius={65}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {categoryPieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip content={renderTooltipContent} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  
                  {/* Customized Legend */}
                  <div className="w-1/2 max-h-full overflow-y-auto pr-1 space-y-1.5 scrollbar-thin">
                    {categoryPieData.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] font-semibold text-slate-700 dark:text-slate-300 truncate line-clamp-1">
                            {item.name}
                          </p>
                          <p className="text-[9px] text-slate-400 dark:text-slate-500 font-bold">
                            {formatINR(item.value)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Chart 3: Expense vs Savings Comparison */}
          <div className="p-5 bg-white dark:bg-slate-900 border border-slate-105 dark:border-slate-800 rounded-3xl flex flex-col justify-between">
            <div className="mb-4">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white font-heading flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-slate-950 dark:text-white" />
                <span>Spending vs Saving</span>
              </h4>
              <p className="text-[10px] text-slate-400 dark:text-slate-500">
                Compare how much you spent and saved each month.
              </p>
            </div>

            <div className="h-48 w-full" id="cashflow-comparison-chart">
              {sortedMonthsData.length === 0 ? (
                <div className="h-full flex items-center justify-center text-xs text-slate-400">
                  Add records for more than one month to see this chart.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={sortedMonthsData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                    <XAxis dataKey="month" stroke="#888888" tick={{ fontSize: 9 }} tickLine={false} />
                    <YAxis stroke="#888888" tick={{ fontSize: 9 }} tickLine={false} />
                    <Tooltip content={renderTooltipContent} />
                    <Legend iconSize={8} wrapperStyle={{ fontSize: 9, paddingTop: 10 }} />
                    <Bar dataKey="Expenses" fill="#4F46E5" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Savings" fill="#10B981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Chart 4: Savings Goals Progress */}
          <div className="p-5 bg-white dark:bg-slate-900 border border-slate-105 dark:border-slate-800 rounded-3xl flex flex-col justify-between">
            <div className="mb-4">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white font-heading flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-500" />
                <span>Savings Goal Progress</span>
              </h4>
              <p className="text-[10px] text-slate-400 dark:text-slate-500">
                Compare saved money with each goal amount.
              </p>
            </div>

            <div className="h-48 w-full animate-fade" id="savings-progress-chart">
              {savingsGoalsData.length === 0 ? (
                <div className="h-full flex items-center justify-center text-xs text-slate-400">
                  No savings goals yet. Add a goal in the Savings tab.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={savingsGoalsData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                    <XAxis dataKey="name" stroke="#888888" tick={{ fontSize: 9 }} tickLine={false} />
                    <YAxis stroke="#888888" tick={{ fontSize: 9 }} tickLine={false} />
                    <Tooltip content={renderTooltipContent} />
                    <Legend iconSize={8} wrapperStyle={{ fontSize: 9, paddingTop: 10 }} />
                    <Bar dataKey="Saved" fill="#10B981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Target" fill="#E2E8F0" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

        </div>
      )}
    </div>
  );
};
