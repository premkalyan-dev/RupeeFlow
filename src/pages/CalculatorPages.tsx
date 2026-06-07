/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Calculator, IndianRupee, Landmark, PieChart, Target, TrendingUp } from 'lucide-react';
import { MainLogo } from '../components/Logo.tsx';

type FieldConfig = {
  id: string;
  label: string;
  suffix?: string;
  min?: number;
  step?: string;
};

type ResultItem = {
  label: string;
  value: string;
};

interface CalculatorLayoutProps {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  fields: FieldConfig[];
  values: Record<string, string>;
  onChange: (id: string, value: string) => void;
  results: ResultItem[];
}

const formatINR = (value: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number.isFinite(value) ? value : 0);

const formatPercent = (value: number) => `${Number.isFinite(value) ? value.toFixed(1) : '0.0'}%`;

const toNumber = (value: string) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const CalculatorLayout: React.FC<CalculatorLayoutProps> = ({
  title,
  description,
  icon: Icon,
  fields,
  values,
  onChange,
  results,
}) => {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 gold:bg-[#0B1120] text-slate-800 dark:text-slate-100 gold:text-[#F8FAFC] font-sans px-4 py-6 sm:py-10">
      <main className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between gap-4 mb-6">
          <MainLogo size={32} showSubtitle={true} className="shrink-0" />
          <a
            href="/tools"
            className="inline-flex items-center gap-1.5 min-h-11 px-3 rounded-xl bg-white hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800 gold:bg-[#111827] gold:hover:bg-[#1F2937] border border-slate-100 dark:border-slate-800 gold:border-[#D4AF37]/25 text-[11px] font-bold text-slate-500 dark:text-slate-400 gold:text-[#D4AF37] transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Tools</span>
          </a>
        </div>

        <section className="bg-white dark:bg-slate-900 gold:bg-[#111827] border border-slate-100 dark:border-slate-800 gold:border-[#D4AF37]/25 rounded-3xl p-5 sm:p-7 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-emerald-950/20 gold:bg-[#D4AF37]/12 text-indigo-900 dark:text-emerald-400 gold:text-[#D4AF37] flex items-center justify-center shrink-0">
              <Icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest font-bold text-emerald-600 dark:text-emerald-400 gold:text-[#D4AF37] mb-2">
                Financial Calculator
              </p>
              <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-slate-950 dark:text-white gold:text-[#F8FAFC] tracking-tight">
                {title}
              </h1>
              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300 gold:text-slate-300">
                {description}
              </p>
            </div>
          </div>

          <div className="mt-7 grid grid-cols-1 lg:grid-cols-2 gap-5">
            <form className="rounded-[20px] border border-slate-100 dark:border-slate-800 gold:border-[#D4AF37]/20 bg-slate-50 dark:bg-slate-950 gold:bg-[#0B1120] p-5 space-y-4">
              {fields.map((field) => (
                <label key={field.id} className="block">
                  <span className="block text-[10px] uppercase tracking-widest font-bold text-slate-500 dark:text-slate-400 mb-1.5">
                    {field.label}
                  </span>
                  <div className="relative">
                    <input
                      type="number"
                      min={field.min ?? 0}
                      step={field.step ?? '1'}
                      value={values[field.id]}
                      onChange={(event) => onChange(field.id, event.target.value)}
                      className="w-full min-h-11 px-3.5 pr-14 rounded-xl bg-white dark:bg-slate-900 gold:bg-[#111827] border border-slate-200 dark:border-slate-800 gold:border-[#D4AF37]/25 text-sm font-bold text-slate-950 dark:text-white gold:text-[#F8FAFC] outline-none focus:ring-2 focus:ring-indigo-600/20 dark:focus:ring-emerald-500/30 gold:focus:ring-[#D4AF37]/35"
                    />
                    {field.suffix && (
                      <span className="absolute inset-y-0 right-3 flex items-center text-xs font-bold text-slate-400 dark:text-slate-500">
                        {field.suffix}
                      </span>
                    )}
                  </div>
                </label>
              ))}
            </form>

            <div className="rounded-[20px] border border-slate-100 dark:border-slate-800 gold:border-[#D4AF37]/20 bg-slate-50 dark:bg-slate-950 gold:bg-[#0B1120] p-5 flex flex-col justify-between">
              <div>
                <h2 className="font-heading text-base font-bold text-slate-900 dark:text-white gold:text-[#F8FAFC]">
                  Results
                </h2>
                <div className="mt-4 space-y-3">
                  {results.map((result) => (
                    <div
                      key={result.label}
                      className="flex items-center justify-between gap-4 rounded-2xl bg-white dark:bg-slate-900 gold:bg-[#111827] border border-slate-100 dark:border-slate-800 gold:border-[#D4AF37]/20 p-4"
                    >
                      <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{result.label}</span>
                      <strong className="text-sm font-extrabold text-indigo-950 dark:text-white gold:text-[#D4AF37] text-right">
                        {result.value}
                      </strong>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export const EmiCalculator: React.FC = () => {
  const [values, setValues] = useState({ principal: '500000', rate: '10', tenure: '5' });
  const results = useMemo(() => {
    const principal = toNumber(values.principal);
    const monthlyRate = toNumber(values.rate) / 12 / 100;
    const months = toNumber(values.tenure) * 12;
    const emi = monthlyRate > 0 && months > 0
      ? (principal * monthlyRate * (1 + monthlyRate) ** months) / ((1 + monthlyRate) ** months - 1)
      : months > 0
      ? principal / months
      : 0;
    const totalPayment = emi * months;
    return [
      { label: 'Monthly EMI', value: formatINR(emi) },
      { label: 'Total Interest', value: formatINR(totalPayment - principal) },
      { label: 'Total Repayment', value: formatINR(totalPayment) },
    ];
  }, [values]);

  return (
    <CalculatorLayout
      title="EMI Calculator"
      description="Calculate monthly EMI, interest, and total repayment."
      icon={Landmark}
      fields={[
        { id: 'principal', label: 'Loan Amount', suffix: 'INR' },
        { id: 'rate', label: 'Annual Interest Rate', suffix: '%' },
        { id: 'tenure', label: 'Tenure', suffix: 'Years' },
      ]}
      values={values}
      onChange={(id, value) => setValues((current) => ({ ...current, [id]: value }))}
      results={results}
    />
  );
};

export const SipCalculator: React.FC = () => {
  const [values, setValues] = useState({ monthly: '5000', rate: '12', years: '10' });
  const results = useMemo(() => {
    const monthly = toNumber(values.monthly);
    const monthlyRate = toNumber(values.rate) / 12 / 100;
    const months = toNumber(values.years) * 12;
    const futureValue = monthlyRate > 0
      ? monthly * (((1 + monthlyRate) ** months - 1) / monthlyRate) * (1 + monthlyRate)
      : monthly * months;
    return [
      { label: 'Invested Amount', value: formatINR(monthly * months) },
      { label: 'Estimated Returns', value: formatINR(futureValue - monthly * months) },
      { label: 'Future Value', value: formatINR(futureValue) },
    ];
  }, [values]);

  return (
    <CalculatorLayout
      title="SIP Calculator"
      description="Estimate future value of your SIP investments."
      icon={TrendingUp}
      fields={[
        { id: 'monthly', label: 'Monthly Investment', suffix: 'INR' },
        { id: 'rate', label: 'Expected Return', suffix: '%' },
        { id: 'years', label: 'Investment Period', suffix: 'Years' },
      ]}
      values={values}
      onChange={(id, value) => setValues((current) => ({ ...current, [id]: value }))}
      results={results}
    />
  );
};

export const SavingsGoalCalculator: React.FC = () => {
  const [values, setValues] = useState({ goal: '200000', saved: '25000', months: '18' });
  const results = useMemo(() => {
    const goal = toNumber(values.goal);
    const saved = toNumber(values.saved);
    const months = toNumber(values.months);
    const remaining = Math.max(0, goal - saved);
    return [
      { label: 'Amount Remaining', value: formatINR(remaining) },
      { label: 'Monthly Saving Needed', value: formatINR(months > 0 ? remaining / months : 0) },
      { label: 'Progress', value: formatPercent(goal > 0 ? (saved / goal) * 100 : 0) },
    ];
  }, [values]);

  return (
    <CalculatorLayout
      title="Savings Goal Calculator"
      description="Find how much you need to save every month to reach your goal."
      icon={Target}
      fields={[
        { id: 'goal', label: 'Goal Amount', suffix: 'INR' },
        { id: 'saved', label: 'Already Saved', suffix: 'INR' },
        { id: 'months', label: 'Time Left', suffix: 'Months' },
      ]}
      values={values}
      onChange={(id, value) => setValues((current) => ({ ...current, [id]: value }))}
      results={results}
    />
  );
};

export const FdCalculator: React.FC = () => {
  const [values, setValues] = useState({ principal: '100000', rate: '7', years: '3' });
  const results = useMemo(() => {
    const principal = toNumber(values.principal);
    const rate = toNumber(values.rate) / 100;
    const years = toNumber(values.years);
    const maturity = principal * (1 + rate / 4) ** (4 * years);
    return [
      { label: 'Principal', value: formatINR(principal) },
      { label: 'Interest Earned', value: formatINR(maturity - principal) },
      { label: 'Maturity Value', value: formatINR(maturity) },
    ];
  }, [values]);

  return (
    <CalculatorLayout
      title="FD Calculator"
      description="Calculate fixed deposit maturity value and interest."
      icon={IndianRupee}
      fields={[
        { id: 'principal', label: 'Deposit Amount', suffix: 'INR' },
        { id: 'rate', label: 'Interest Rate', suffix: '%' },
        { id: 'years', label: 'Tenure', suffix: 'Years' },
      ]}
      values={values}
      onChange={(id, value) => setValues((current) => ({ ...current, [id]: value }))}
      results={results}
    />
  );
};

export const RdCalculator: React.FC = () => {
  const [values, setValues] = useState({ monthly: '5000', rate: '7', months: '24' });
  const results = useMemo(() => {
    const monthly = toNumber(values.monthly);
    const quarterlyRate = toNumber(values.rate) / 400;
    const months = toNumber(values.months);
    const maturity = Array.from({ length: Math.max(0, Math.floor(months)) }).reduce<number>((sum, _, index) => {
      const remainingMonths = months - index;
      return sum + monthly * (1 + quarterlyRate) ** (remainingMonths / 3);
    }, 0);
    return [
      { label: 'Total Deposits', value: formatINR(monthly * months) },
      { label: 'Interest Earned', value: formatINR(maturity - monthly * months) },
      { label: 'Maturity Amount', value: formatINR(maturity) },
    ];
  }, [values]);

  return (
    <CalculatorLayout
      title="RD Calculator"
      description="Estimate recurring deposit maturity amount."
      icon={Calculator}
      fields={[
        { id: 'monthly', label: 'Monthly Deposit', suffix: 'INR' },
        { id: 'rate', label: 'Interest Rate', suffix: '%' },
        { id: 'months', label: 'Tenure', suffix: 'Months' },
      ]}
      values={values}
      onChange={(id, value) => setValues((current) => ({ ...current, [id]: value }))}
      results={results}
    />
  );
};

export const BudgetPlanner: React.FC = () => {
  const [values, setValues] = useState({ income: '60000', needs: '50', wants: '30', savings: '20' });
  const results = useMemo(() => {
    const income = toNumber(values.income);
    const needsPct = toNumber(values.needs);
    const wantsPct = toNumber(values.wants);
    const savingsPct = toNumber(values.savings);
    return [
      { label: 'Needs Budget', value: formatINR((income * needsPct) / 100) },
      { label: 'Wants Budget', value: formatINR((income * wantsPct) / 100) },
      { label: 'Savings Target', value: formatINR((income * savingsPct) / 100) },
    ];
  }, [values]);

  return (
    <CalculatorLayout
      title="Budget Planner"
      description="Plan monthly spending and savings efficiently."
      icon={PieChart}
      fields={[
        { id: 'income', label: 'Monthly Income', suffix: 'INR' },
        { id: 'needs', label: 'Needs Allocation', suffix: '%' },
        { id: 'wants', label: 'Wants Allocation', suffix: '%' },
        { id: 'savings', label: 'Savings Allocation', suffix: '%' },
      ]}
      values={values}
      onChange={(id, value) => setValues((current) => ({ ...current, [id]: value }))}
      results={results}
    />
  );
};
