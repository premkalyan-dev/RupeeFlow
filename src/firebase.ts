/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import firebaseConfig from '../firebase-applet-config.json';

// Detect if we're using a real Firebase config or the placeholder dummy one.
const isPlaceholder = firebaseConfig.apiKey === 'dummy-api-key';

export const isFirebaseConfigured = !isPlaceholder;

let app;
let auth: any = null;

if (isFirebaseConfigured) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);
  } catch (error) {
    console.error('Failed to initialize Firebase Auth:', error);
  }
}

export { auth };
