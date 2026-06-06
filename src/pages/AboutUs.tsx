/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { LegalPageLayout, LegalSection } from './LegalPageLayout.tsx';

const features = [
  {
    title: 'Track Daily Expenses',
    description: 'Log your spending in seconds and keep a clear record of where your money goes each day.',
  },
  {
    title: 'Monthly Budget Management',
    description: 'Set monthly spending limits, monitor progress, and stay on track before expenses get out of hand.',
  },
  {
    title: 'Savings Goals',
    description: 'Create personal goals and watch your savings grow toward things that matter to you.',
  },
  {
    title: 'Spending Insights',
    description: 'Use visual charts to understand your habits and make better money decisions.',
  },
  {
    title: 'Secure & Private',
    description: 'Your data is yours only, protected through Firebase authentication and secure storage.',
  },
  {
    title: 'Completely Free',
    description: 'No fees, no premium plans, and no hidden charges for using the core app.',
  },
];

export const AboutUs: React.FC = () => {
  return (
    <LegalPageLayout title="About PaiseFlow" eyebrow="India's Simplest Free Personal Finance Tracker">
      <LegalSection title="About the App">
        <div className="space-y-3">
          <p>
            PaiseFlow is a free personal finance tracker built specifically for Indians to manage daily expenses,
            set monthly budgets, and achieve savings goals with ease.
          </p>
          <p>
            The app is designed to be simple, fast, and secure with no ads and no hidden fees. It focuses on the
            everyday money decisions that matter most, without making personal finance feel complicated.
          </p>
          <p>
            PaiseFlow is built with React and Firebase to provide a smooth, reliable, and responsive experience across
            devices.
          </p>
        </div>
      </LegalSection>

      <LegalSection title="Our Mission">
        <p>
          Our mission is to make personal finance simple, accessible, and stress-free for every Indian, whether you are
          a student, a working professional, or managing a household.
        </p>
      </LegalSection>

      <LegalSection title="What We Offer">
        <div className="grid gap-3 sm:grid-cols-2">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-4"
            >
              <h3 className="font-heading text-sm font-bold text-slate-900 dark:text-white mb-1">{feature.title}</h3>
              <p className="text-xs leading-5 text-slate-600 dark:text-slate-400">{feature.description}</p>
            </div>
          ))}
        </div>
      </LegalSection>

      <LegalSection title="Our Story">
        <div className="space-y-3">
          <p>
            PaiseFlow was created by Premkalyan, an MCA student at Lovely Professional University (LPU), Punjab,
            originally from Bangalore, India.
          </p>
          <p>
            As a student managing finances on a tight budget, Premkalyan wanted a simple tool that works for Indian
            users without complicated features or paywalls.
          </p>
          <p>
            PaiseFlow is the result of that idea, built with passion and a desire to help fellow Indians take control
            of their money.
          </p>
        </div>
      </LegalSection>

      <LegalSection title="Contact">
        <p>
          For any questions, reach us at{' '}
          <a className="font-semibold text-indigo-600 dark:text-emerald-400 hover:underline" href="mailto:premkalyan2727@gmail.com">
            premkalyan2727@gmail.com
          </a>
          .
        </p>
      </LegalSection>
    </LegalPageLayout>
  );
};
