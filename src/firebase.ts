/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import firebaseConfig from '../firebase-applet-config.json';

const hasFirebaseConfig = firebaseConfig.apiKey !== 'dummy-api-key';

export const isFirebaseConfigured = hasFirebaseConfig;

let app;
let auth: any = null;

if (isFirebaseConfigured) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);
  } catch {
    auth = null;
  }
}

export { auth };
