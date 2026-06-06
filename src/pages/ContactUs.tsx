/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { LegalPageLayout, LegalSection } from './LegalPageLayout.tsx';

export const ContactUs: React.FC = () => {
  return (
    <LegalPageLayout title="Get in Touch" eyebrow="Contact Us">
      <LegalSection title="Email">
        <p>
          Reach us at{' '}
          <a className="font-semibold text-indigo-600 dark:text-emerald-400 hover:underline" href="mailto:premkalyan2727@gmail.com">
            premkalyan2727@gmail.com
          </a>
          .
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">We typically respond within 24 hours.</p>
      </LegalSection>
    </LegalPageLayout>
  );
};
