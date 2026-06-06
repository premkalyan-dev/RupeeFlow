/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { LegalPageLayout, LegalSection } from './LegalPageLayout.tsx';

export const PrivacyPolicy: React.FC = () => {
  return (
    <LegalPageLayout title="Privacy Policy" eyebrow="Last updated: June 2026">
      <LegalSection title="What Data We Collect">
        <ul className="list-disc pl-5 space-y-1">
          <li>Email address through Firebase Authentication.</li>
          <li>Financial data including transactions, budgets, and savings goals.</li>
          <li>Usage data such as theme preference and monthly budget.</li>
        </ul>
      </LegalSection>

      <LegalSection title="How We Use Firebase">
        <ul className="list-disc pl-5 space-y-1">
          <li>Your data is stored securely in Firebase Firestore.</li>
          <li>Each user's data is private and isolated.</li>
          <li>Firebase Authentication is used for secure login.</li>
        </ul>
      </LegalSection>

      <LegalSection title="Data Protection">
        <ul className="list-disc pl-5 space-y-1">
          <li>We never sell user data to third parties.</li>
          <li>We never share data with advertisers.</li>
          <li>Data is only used to provide the app service.</li>
        </ul>
      </LegalSection>

      <LegalSection title="User Rights">
        <ul className="list-disc pl-5 space-y-1">
          <li>You can delete your account anytime.</li>
          <li>All data is permanently deleted on account deletion.</li>
          <li>You can export your data on request.</li>
        </ul>
      </LegalSection>

      <LegalSection title="Privacy Contact">
        <p>
          For privacy concerns, contact{' '}
          <a className="font-semibold text-indigo-600 dark:text-emerald-400 hover:underline" href="mailto:premkalyan2727@gmail.com">
            premkalyan2727@gmail.com
          </a>
          .
        </p>
      </LegalSection>
    </LegalPageLayout>
  );
};
