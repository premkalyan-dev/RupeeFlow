/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { ArrowLeft, BadgeIndianRupee, Banknote, CalendarDays, ChartNoAxesCombined, Landmark, PieChart, Target } from 'lucide-react';
import { MainLogo } from '../components/Logo.tsx';

const tools = [
  {
    title: 'EMI Calculator',
    path: '/emi-calculator',
    description: 'Calculate monthly EMI, interest, and total repayment.',
    icon: Landmark,
  },
  {
    title: 'SIP Calculator',
    path: '/sip-calculator',
    description: 'Estimate future value of your SIP investments.',
    icon: ChartNoAxesCombined,
  },
  {
    title: 'Savings Goal Calculator',
    path: '/savings-goal-calculator',
    description: 'Find how much you need to save every month to reach your goal.',
    icon: Target,
  },
  {
    title: 'Budget Planner',
    path: '/budget-planner',
    description: 'Plan monthly spending and savings efficiently.',
    icon: PieChart,
  },
  {
    title: 'FD Calculator',
    path: '/fd-calculator',
    description: 'Calculate fixed deposit maturity value and interest.',
    icon: Banknote,
  },
  {
    title: 'RD Calculator',
    path: '/rd-calculator',
    description: 'Estimate recurring deposit maturity amount.',
    icon: CalendarDays,
  },
];

export const Tools: React.FC = () => {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 gold:bg-[#0B1120] text-slate-800 dark:text-slate-100 gold:text-[#F8FAFC] font-sans px-4 py-6 sm:py-10">
      <main className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between gap-4 mb-6">
          <MainLogo size={32} showSubtitle={true} className="shrink-0" />
          <a
            href="/"
            className="inline-flex items-center gap-1.5 min-h-11 px-3 rounded-xl bg-white hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800 gold:bg-[#111827] gold:hover:bg-[#1F2937] border border-slate-100 dark:border-slate-800 gold:border-[#D4AF37]/25 text-[11px] font-bold text-slate-500 dark:text-slate-400 gold:text-[#D4AF37] transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Home</span>
          </a>
        </div>

        <section className="bg-white dark:bg-slate-900 gold:bg-[#111827] border border-slate-100 dark:border-slate-800 gold:border-[#D4AF37]/25 rounded-3xl p-5 sm:p-7 shadow-sm">
          <div className="max-w-2xl">
            <p className="text-[10px] uppercase tracking-widest font-bold text-emerald-600 dark:text-emerald-400 gold:text-[#D4AF37] mb-2">
              Free Finance Utilities
            </p>
            <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-slate-950 dark:text-white gold:text-[#F8FAFC] tracking-tight">
              Financial Tools & Calculators
            </h1>
            <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300 gold:text-slate-300">
              Plan smarter, save more, and make informed financial decisions with free calculators.
            </p>
          </div>

          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {tools.map((tool) => {
              const Icon = tool.icon;
              return (
                <article
                  key={tool.title}
                  className="h-full min-h-[210px] rounded-[20px] border border-slate-100 dark:border-slate-800 gold:border-[#D4AF37]/20 bg-slate-50 dark:bg-slate-950 gold:bg-[#0B1120] p-5 flex flex-col justify-between shadow-[0_14px_34px_-24px_rgba(15,23,42,0.45)] hover:-translate-y-0.5 hover:shadow-[0_18px_42px_-24px_rgba(15,23,42,0.5)] transition-all duration-[250ms] ease-out"
                >
                  <div>
                    <div className="w-11 h-11 rounded-2xl bg-indigo-50 dark:bg-emerald-950/20 gold:bg-[#D4AF37]/12 text-indigo-900 dark:text-emerald-400 gold:text-[#D4AF37] flex items-center justify-center mb-4">
                      <Icon className="w-5 h-5" />
                    </div>
                    <h2 className="font-heading text-base font-bold text-slate-900 dark:text-white gold:text-[#F8FAFC]">
                      {tool.title}
                    </h2>
                    <p className="mt-2 text-xs leading-5 text-slate-600 dark:text-slate-400 gold:text-slate-300">
                      {tool.description}
                    </p>
                  </div>

                  <a
                    href={tool.path}
                    className="mt-5 min-h-11 w-full rounded-xl bg-indigo-900 hover:bg-indigo-950 dark:bg-emerald-600 dark:hover:bg-emerald-500 gold:bg-[#D4AF37] gold:hover:bg-[#F4D03F] px-4 text-xs font-bold text-white gold:text-[#0B1120] shadow-md transition flex items-center justify-center gap-2"
                  >
                    <BadgeIndianRupee className="w-4 h-4" />
                    <span>Open Calculator</span>
                  </a>
                </article>
              );
            })}
          </div>
        </section>

        <footer className="py-6 text-center text-[11px] font-medium text-slate-400 dark:text-slate-500 gold:text-slate-500">
          © 2026 PaiseFlow / SpendWise India
        </footer>
      </main>
    </div>
  );
};
