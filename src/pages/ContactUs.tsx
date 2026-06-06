/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { LegalPageLayout, LegalSection } from './LegalPageLayout.tsx';

const contactDetails = [
  { label: 'Email', value: 'premkalyan2727@gmail.com', href: 'mailto:premkalyan2727@gmail.com' },
  { label: 'Location', value: 'Bangalore, India' },
  { label: 'Response Time', value: 'We typically respond within 24 hours' },
  { label: 'Support Hours', value: 'Monday to Saturday, 9 AM to 6 PM IST' },
];

const faqs = [
  {
    question: 'Is PaiseFlow free to use?',
    answer: 'Yes, PaiseFlow is completely free with no hidden charges.',
  },
  {
    question: 'Is my financial data safe?',
    answer: 'Yes, all data is stored securely in Firebase and is completely private to your account.',
  },
  {
    question: 'Can I delete my account?',
    answer: 'Yes, you can delete your account anytime and all your data will be permanently removed.',
  },
  {
    question: 'Does PaiseFlow work on mobile?',
    answer: 'Yes, PaiseFlow is fully responsive and works on all devices.',
  },
];

export const ContactUs: React.FC = () => {
  return (
    <LegalPageLayout title="Contact Us" eyebrow="We are here to help. Reach out anytime.">
      <LegalSection title="Contact Details">
        <div className="grid gap-3 sm:grid-cols-2">
          {contactDetails.map((detail) => (
            <div
              key={detail.label}
              className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-4"
            >
              <p className="text-[10px] uppercase tracking-widest font-bold text-slate-500 dark:text-slate-400 mb-1">
                {detail.label}
              </p>
              {detail.href ? (
                <a className="font-semibold text-indigo-600 dark:text-emerald-400 hover:underline" href={detail.href}>
                  {detail.value}
                </a>
              ) : (
                <p className="font-semibold text-slate-800 dark:text-slate-100">{detail.value}</p>
              )}
            </div>
          ))}
        </div>
      </LegalSection>

      <LegalSection title="Frequently Asked Questions">
        <div className="space-y-3">
          {faqs.map((faq) => (
            <div key={faq.question} className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-4">
              <h3 className="font-heading text-sm font-bold text-slate-900 dark:text-white mb-1">{faq.question}</h3>
              <p className="text-xs leading-5 text-slate-600 dark:text-slate-400">{faq.answer}</p>
            </div>
          ))}
        </div>
      </LegalSection>
    </LegalPageLayout>
  );
};
