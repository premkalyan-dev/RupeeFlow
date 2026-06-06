/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { MainLogo } from '../components/Logo.tsx';

interface LegalPageLayoutProps {
  title: string;
  eyebrow: string;
  children: React.ReactNode;
}

export const LegalPageLayout: React.FC<LegalPageLayoutProps> = ({ title, eyebrow, children }) => {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans px-4 py-6 sm:py-10">
      <main className="max-w-[600px] mx-auto">
        <div className="flex items-center justify-between gap-4 mb-6">
          <MainLogo size={32} showSubtitle={true} className="shrink-0" />
          <a
            href="/"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-100 dark:border-slate-800 text-[11px] font-bold text-slate-500 dark:text-slate-400 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Home</span>
          </a>
        </div>

        <section className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-5 sm:p-7 shadow-sm">
          <p className="text-[10px] uppercase tracking-widest font-bold text-emerald-600 dark:text-emerald-400 mb-2">
            {eyebrow}
          </p>
          <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-slate-950 dark:text-white tracking-tight mb-5">
            {title}
          </h1>
          <div className="space-y-5 text-sm leading-6 text-slate-600 dark:text-slate-300">
            {children}
          </div>
        </section>

        <footer className="py-6 text-center text-[11px] font-medium text-slate-400 dark:text-slate-500">
          © 2026 PaiseFlow / SpendWise India
        </footer>
      </main>
    </div>
  );
};

export const LegalSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <section>
    <h2 className="font-heading text-base font-bold text-slate-900 dark:text-white mb-2">{title}</h2>
    {children}
  </section>
);
