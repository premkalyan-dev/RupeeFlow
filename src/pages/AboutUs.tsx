/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { LegalPageLayout, LegalSection } from './LegalPageLayout.tsx';

export const AboutUs: React.FC = () => {
  return (
    <LegalPageLayout title="About Us" eyebrow="PaiseFlow / SpendWise India">
      <LegalSection title="About PaiseFlow">
        <p>
          PaiseFlow / SpendWise India is a free personal finance tracker that helps Indian users track budgets,
          expenses, and savings goals.
        </p>
      </LegalSection>

      <LegalSection title="Simple, Fast, Secure">
        <p>
          The app is designed to be simple, fast, and secure with no ads and no fees.
        </p>
      </LegalSection>

      <LegalSection title="Built By">
        <p>
          PaiseFlow is built by Premkalyan, a student developer. It is a student project built with React and Firebase.
        </p>
      </LegalSection>

      <LegalSection title="Mission">
        <p>
          Our mission is to make personal finance simple for every Indian.
        </p>
      </LegalSection>

      <LegalSection title="Contact">
        <p>
          Email{' '}
          <a className="font-semibold text-indigo-600 dark:text-emerald-400 hover:underline" href="mailto:premkalyan2727@gmail.com">
            premkalyan2727@gmail.com
          </a>
          .
        </p>
      </LegalSection>
    </LegalPageLayout>
  );
};
