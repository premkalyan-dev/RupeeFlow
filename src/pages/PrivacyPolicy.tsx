/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { LegalPageLayout, LegalSection } from './LegalPageLayout.tsx';

export const PrivacyPolicy: React.FC = () => {
  return (
    <LegalPageLayout title="Privacy Policy" eyebrow="Effective Date: June 6, 2026">
      <LegalSection title="Policy Details">
        <ul className="list-disc pl-5 space-y-1">
          <li>App Name: PaiseFlow</li>
          <li>Website: https://paiseflow.in</li>
          <li>Email: premkalyan2727@gmail.com</li>
          <li>Effective Date: June 6, 2026</li>
          <li>Last Updated: June 6, 2026</li>
        </ul>
      </LegalSection>

      <LegalSection title="Introduction">
        <p>
          PaiseFlow is a personal finance tracker that helps Indian users manage expenses, budgets, and savings goals.
          We take privacy seriously and are committed to protecting the information you share while using the app.
        </p>
      </LegalSection>

      <LegalSection title="Information We Collect">
        <ul className="list-disc pl-5 space-y-1">
          <li>Email address collected through Firebase Authentication for account login and identity verification.</li>
          <li>Financial data such as transactions, monthly budgets, savings goals, goal amounts, and goal deadlines.</li>
          <li>Usage data such as theme preference, monthly budget settings, and app preferences.</li>
          <li>Device information such as browser type and device type, which may be used for analytics and app improvements.</li>
        </ul>
      </LegalSection>

      <LegalSection title="How We Use Your Information">
        <ul className="list-disc pl-5 space-y-1">
          <li>To provide, maintain, and improve the PaiseFlow app service.</li>
          <li>To secure your account using Firebase Authentication.</li>
          <li>To store and display your financial data inside your private account.</li>
          <li>To analyze usage patterns so we can improve performance, usability, and features.</li>
        </ul>
      </LegalSection>

      <LegalSection title="Data Storage and Security">
        <ul className="list-disc pl-5 space-y-1">
          <li>All user data is stored securely in Firebase Firestore.</li>
          <li>Each user's data is private, isolated, and linked only to their authenticated account.</li>
          <li>Firebase security rules help prevent unauthorized access to private user data.</li>
          <li>We use HTTPS encryption for data transmission between your device and our services.</li>
        </ul>
      </LegalSection>

      <LegalSection title="Cookies and Tracking">
        <ul className="list-disc pl-5 space-y-1">
          <li>We use minimal cookies or browser storage needed for authentication and app functionality.</li>
          <li>We may use Google Analytics or similar tools for anonymous usage tracking.</li>
          <li>We do not use advertising cookies to personally track users inside PaiseFlow.</li>
        </ul>
      </LegalSection>

      <LegalSection title="Third Party Services">
        <ul className="list-disc pl-5 space-y-1">
          <li>We use Firebase by Google for authentication and data storage.</li>
          <li>We may display ads through Google AdSense or Media.net to support the free service.</li>
          <li>These ad networks may use cookies according to their own privacy policies.</li>
          <li>
            You can review the{' '}
            <a className="font-semibold text-indigo-600 dark:text-emerald-400 hover:underline" href="https://policies.google.com/privacy" target="_blank" rel="noreferrer">
              Google Privacy Policy
            </a>{' '}
            and the{' '}
            <a className="font-semibold text-indigo-600 dark:text-emerald-400 hover:underline" href="https://www.media.net/privacy-policy" target="_blank" rel="noreferrer">
              Media.net Privacy Policy
            </a>
            .
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="Your Rights">
        <ul className="list-disc pl-5 space-y-1">
          <li>You have the right to access the personal and financial data stored in your account.</li>
          <li>You have the right to delete your account and all associated data.</li>
          <li>You may request an export of your data by contacting us.</li>
          <li>
            For any data request, contact us at{' '}
            <a className="font-semibold text-indigo-600 dark:text-emerald-400 hover:underline" href="mailto:premkalyan2727@gmail.com">
              premkalyan2727@gmail.com
            </a>
            .
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="Children's Privacy">
        <p>
          PaiseFlow is not intended for children under 13 years of age. We do not knowingly collect personal data from
          children. If we learn that a child has provided personal information, we will take steps to delete it.
        </p>
      </LegalSection>

      <LegalSection title="Changes to This Policy">
        <p>
          We may update this Privacy Policy from time to time. When important changes are made, we may notify users by
          email or through the app. Continued use of PaiseFlow after updates means you accept the revised policy.
        </p>
      </LegalSection>

      <LegalSection title="Contact Us">
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
