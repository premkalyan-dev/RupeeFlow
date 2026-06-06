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

      <LegalSection title="Send a Message">
        <form className="space-y-4">
          <div>
            <label htmlFor="contact-name" className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
              Full Name
            </label>
            <input
              id="contact-name"
              type="text"
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 text-sm font-medium"
              placeholder="Your full name"
            />
          </div>

          <div>
            <label htmlFor="contact-email" className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
              Email Address
            </label>
            <input
              id="contact-email"
              type="email"
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 text-sm font-medium"
              placeholder="name@example.com"
            />
          </div>

          <div>
            <label htmlFor="contact-subject" className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
              Subject
            </label>
            <input
              id="contact-subject"
              type="text"
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 text-sm font-medium"
              placeholder="How can we help?"
            />
          </div>

          <div>
            <label htmlFor="contact-message" className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
              Message
            </label>
            <textarea
              id="contact-message"
              rows={5}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 text-sm font-medium resize-none"
              placeholder="Write your message"
            />
          </div>

          <button
            type="button"
            className="w-full py-3 px-4 rounded-xl text-sm font-bold text-white bg-indigo-900 hover:bg-indigo-950 dark:bg-emerald-600 dark:hover:bg-emerald-500 shadow-md transition cursor-pointer"
          >
            Send Message
          </button>

          <p className="text-xs text-slate-500 dark:text-slate-400">
            This contact form is for user interface purposes only and does not send messages yet.
          </p>
        </form>
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
