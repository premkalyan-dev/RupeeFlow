/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { isFirebaseConfigured, auth as fireAuth, db } from '../firebase.ts';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider,
} from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  setDoc,
} from 'firebase/firestore';
import { Transaction, SavingsGoal, UserConfig, AuthState } from '../types.ts';

interface AppContextType {
  auth: AuthState;
  transactions: Transaction[];
  savingsGoals: SavingsGoal[];
  userConfig: UserConfig | null;
  loading: boolean;
  
  // Auth Functions
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  
  // App Config & Budget
  updateBudget: (budget: number) => Promise<void>;
  updateTheme: (theme: 'light' | 'dark') => Promise<void>;
  
  // Transaction CRUD
  addTransaction: (data: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateTransaction: (id: string, data: Partial<Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  
  // Savings Goals CRUD
  addSavingsGoal: (data: Omit<SavingsGoal, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateSavingsGoal: (id: string, data: Partial<Omit<SavingsGoal, 'id' | 'createdAt' | 'updatedAt'>>) => Promise<void>;
  deleteSavingsGoal: (id: string) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

type AppUser = NonNullable<AuthState['user']>;
type UserDocumentData = UserConfig & {
  transactions?: unknown;
  savingsGoals?: unknown;
};

const TRANSACTION_CATEGORIES = [
  'Food',
  'Travel',
  'Shopping',
  'Rent',
  'Education',
  'Health',
  'Bills',
  'Entertainment',
  'Others',
  'Savings',
] as const;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === 'object';

const toNumber = (value: unknown) => {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') return Number(value);
  return NaN;
};

const toStringValue = (value: unknown) => (typeof value === 'string' ? value : '');

const newDocumentId = () => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `id_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [auth, setAuth] = useState<AuthState>({
    user: null,
    loading: true,
    isLocalFallback: false,
  });
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>([]);
  const [userConfig, setUserConfig] = useState<UserConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const activeLoadIdRef = useRef(0);

  const requireFirestore = () => {
    if (!isFirebaseConfigured || !fireAuth || !db) {
      throw new Error('Firebase is not configured. Please check the Firebase config file.');
    }
    return db;
  };

  const userDocRef = (uid: string) => doc(requireFirestore(), 'users', uid);
  const transactionsCollectionRef = (uid: string) => collection(requireFirestore(), 'users', uid, 'transactions');
  const savingsGoalsCollectionRef = (uid: string) => collection(requireFirestore(), 'users', uid, 'savingsGoals');

  const asArray = (value: unknown): Record<string, unknown>[] => {
    if (!Array.isArray(value)) return [];

    return value.filter(isRecord);
  };

  const mergeById = <T extends { id: string }>(primary: T[], fallback: T[]) => {
    const seenIds = new Set(primary.map((item) => item.id));
    return [...primary, ...fallback.filter((item) => !seenIds.has(item.id))];
  };

  const normalizeTransaction = (id: string, data: Record<string, unknown>): Transaction | null => {
    const amount = toNumber(data.amount);
    const type = data.type === 'expense' || data.type === 'saving' ? data.type : null;
    const rawCategory = toStringValue(data.category);
    const category = TRANSACTION_CATEGORIES.includes(rawCategory as Transaction['category'])
      ? (rawCategory as Transaction['category'])
      : 'Others';
    const description = toStringValue(data.description);
    const date = toStringValue(data.date);
    const createdAt = toStringValue(data.createdAt);
    const updatedAt = toStringValue(data.updatedAt);

    if (!id || !Number.isFinite(amount) || !type || !description || !date) {
      console.warn('[PaiseFlow Firestore] Skipping invalid transaction', { id, data });
      return null;
    }

    return {
      id,
      amount,
      type,
      category,
      description,
      date,
      createdAt,
      updatedAt,
    };
  };

  const normalizeSavingsGoal = (id: string, data: Record<string, unknown>): SavingsGoal | null => {
    const name = toStringValue(data.name);
    const targetAmount = toNumber(data.targetAmount);
    const currentAmount = toNumber(data.currentAmount);
    const category = toStringValue(data.category);
    const deadline = toStringValue(data.deadline);
    const createdAt = toStringValue(data.createdAt);
    const updatedAt = toStringValue(data.updatedAt);

    if (
      !id ||
      !name ||
      !Number.isFinite(targetAmount) ||
      !Number.isFinite(currentAmount) ||
      !category ||
      !deadline
    ) {
      console.warn('[PaiseFlow Firestore] Skipping invalid savings goal', { id, data });
      return null;
    }

    return {
      id,
      name,
      targetAmount,
      currentAmount,
      category,
      deadline,
      createdAt,
      updatedAt,
    };
  };

  const defaultUserConfig = (appUser: AppUser): UserConfig => {
    const now = new Date().toISOString();
    return {
      email: appUser.email || '',
      monthlyBudget: 50000,
      theme: 'light',
      createdAt: now,
      updatedAt: now,
    };
  };

  const loadFirestoreDataForUser = async (appUser: AppUser, loadId: number) => {
    setLoading(true);

    try {
      console.log('[PaiseFlow Firestore] Loading user data', {
        uid: appUser.uid,
        userDocPath: `users/${appUser.uid}`,
        transactionsPath: `users/${appUser.uid}/transactions`,
        savingsGoalsPath: `users/${appUser.uid}/savingsGoals`,
      });

      const [configSnap, txSnap, goalsSnap] = await Promise.all([
        getDoc(userDocRef(appUser.uid)),
        getDocs(transactionsCollectionRef(appUser.uid)),
        getDocs(savingsGoalsCollectionRef(appUser.uid)),
      ]);

      let nextConfig: UserConfig;
      const userDocData = configSnap.exists() ? (configSnap.data() as UserDocumentData) : null;
      if (configSnap.exists()) {
        const { transactions: _transactions, savingsGoals: _savingsGoals, ...configData } = userDocData as UserDocumentData;
        nextConfig = configData as UserConfig;
      } else {
        nextConfig = defaultUserConfig(appUser);
        await setDoc(userDocRef(appUser.uid), nextConfig, { merge: true });
      }

      const subcollectionTransactions = txSnap.docs
        .map((snapshot) => normalizeTransaction(snapshot.id, snapshot.data()))
        .filter((transaction): transaction is Transaction => transaction !== null);

      const embeddedTransactions = asArray(userDocData?.transactions)
        .map((transaction, index) =>
          normalizeTransaction(toStringValue(transaction.id) || `embedded_tx_${index}`, transaction)
        )
        .filter((transaction): transaction is Transaction => transaction !== null);
      const nextTransactions = mergeById(subcollectionTransactions, embeddedTransactions);
      nextTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      const subcollectionSavingsGoals = goalsSnap.docs
        .map((snapshot) => normalizeSavingsGoal(snapshot.id, snapshot.data()))
        .filter((goal): goal is SavingsGoal => goal !== null);

      const embeddedSavingsGoals = asArray(userDocData?.savingsGoals)
        .map((goal, index) => normalizeSavingsGoal(toStringValue(goal.id) || `embedded_goal_${index}`, goal))
        .filter((goal): goal is SavingsGoal => goal !== null);
      const nextSavingsGoals = mergeById(subcollectionSavingsGoals, embeddedSavingsGoals);

      console.log('[PaiseFlow Firestore] Loaded user data', {
        uid: appUser.uid,
        userDocExists: configSnap.exists(),
        subcollectionTransactions: subcollectionTransactions.length,
        embeddedTransactions: embeddedTransactions.length,
        appliedTransactions: nextTransactions.length,
        subcollectionSavingsGoals: subcollectionSavingsGoals.length,
        embeddedSavingsGoals: embeddedSavingsGoals.length,
        appliedSavingsGoals: nextSavingsGoals.length,
      });

      if (activeLoadIdRef.current !== loadId) return;

      setUserConfig(nextConfig);
      setTransactions(nextTransactions);
      setSavingsGoals(nextSavingsGoals);
      console.log('State after set:', nextTransactions);
      console.log('[PaiseFlow Firestore] Applied data to React state', {
        uid: appUser.uid,
        transactions: nextTransactions.length,
        savingsGoals: nextSavingsGoals.length,
      });
    } catch (error) {
      console.error('Could not load Firestore data', error);
      if (activeLoadIdRef.current !== loadId) return;

      setUserConfig(null);
      setTransactions([]);
      setSavingsGoals([]);
    } finally {
      if (activeLoadIdRef.current === loadId) {
        setLoading(false);
        setAuth((currentAuth) => {
          if (currentAuth.user?.uid !== appUser.uid) return currentAuth;
          return { ...currentAuth, loading: false };
        });
      }
    }
  };

  const clearUserState = (isLoading = false) => {
    activeLoadIdRef.current += 1;
    setAuth({ user: null, loading: isLoading, isLocalFallback: false });
    setUserConfig(null);
    setTransactions([]);
    setSavingsGoals([]);
    setLoading(isLoading);
  };

  // Auth owns identity; Firestore owns user-scoped app data.
  useEffect(() => {
    if (isFirebaseConfigured && fireAuth) {
      const unsubscribeAuth = onAuthStateChanged(fireAuth, (user) => {
        if (user) {
          const loadId = activeLoadIdRef.current + 1;
          activeLoadIdRef.current = loadId;
          const appUser = {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
          };
          setLoading(true);
          setAuth({ user: appUser, loading: false, isLocalFallback: false });
        } else {
          clearUserState(false);
        }
      });

      return () => {
        unsubscribeAuth();
      };
    }

    clearUserState(false);
  }, []);

  useEffect(() => {
    if (!auth.user) return;

    const loadId = activeLoadIdRef.current;
    void loadFirestoreDataForUser(auth.user, loadId);
  }, [auth.user?.uid]);

  useEffect(() => {
    console.log('[PaiseFlow State] transactions changed', {
      count: transactions.length,
      transactions,
    });
  }, [transactions]);

  useEffect(() => {
    console.log('[PaiseFlow State] savingsGoals changed', {
      count: savingsGoals.length,
      savingsGoals,
    });
  }, [savingsGoals]);

  // ---------------------------------------------------------
  // Auth Logic (Firebase Auth when configured, local auth otherwise)
  // ---------------------------------------------------------

  const login = async (email: string, password: string) => {
    if (isFirebaseConfigured && fireAuth) {
      await signInWithEmailAndPassword(fireAuth, email, password);
      return;
    }
    throw new Error('Firebase authentication is not configured.');
  };

  const signup = async (email: string, password: string) => {
    if (isFirebaseConfigured && fireAuth) {
      await createUserWithEmailAndPassword(fireAuth, email, password);
      return;
    }
    throw new Error('Firebase authentication is not configured.');
  };

  const loginWithGoogle = async () => {
    if (isFirebaseConfigured && fireAuth) {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(fireAuth, provider);
      return;
    }
    throw new Error('Firebase authentication is not configured.');
  };

  const resetPassword = async (email: string) => {
    if (isFirebaseConfigured && fireAuth) {
      await sendPasswordResetEmail(fireAuth, email);
      return;
    }
    throw new Error('Firebase authentication is not configured.');
  };

  const logout = async () => {
    if (isFirebaseConfigured && fireAuth) {
      await signOut(fireAuth);
      return;
    }

    clearUserState(false);
  };

  // ---------------------------------------------------------
  // Budget Operations
  // ---------------------------------------------------------

  const updateBudget = async (budget: number) => {
    if (!auth.user) return;

    const existingConfig = userConfig || defaultUserConfig(auth.user);
    const nextConfig: UserConfig = {
      ...existingConfig,
      monthlyBudget: budget,
      updatedAt: new Date().toISOString(),
    };
    await setDoc(userDocRef(auth.user.uid), nextConfig, { merge: true });
    setUserConfig(nextConfig);
  };

  const updateTheme = async (theme: 'light' | 'dark') => {
    if (!auth.user) return;

    const existingConfig = userConfig || defaultUserConfig(auth.user);
    const nextConfig: UserConfig = {
      ...existingConfig,
      theme,
      updatedAt: new Date().toISOString(),
    };
    await setDoc(userDocRef(auth.user.uid), nextConfig, { merge: true });
    setUserConfig(nextConfig);
  };

  // ---------------------------------------------------------
  // Transaction CRUD Operations
  // ---------------------------------------------------------

  const addTransaction = async (data: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!auth.user) return;
    const timestampStr = new Date().toISOString();
    const txId = newDocumentId();
    const txRef = doc(transactionsCollectionRef(auth.user.uid), txId);
    const newTx: Transaction = {
      id: txId,
      amount: data.amount,
      type: data.type,
      category: data.category,
      description: data.description,
      date: data.date,
      createdAt: timestampStr,
      updatedAt: timestampStr,
    };
    await setDoc(txRef, newTx);
    console.log('[PaiseFlow Firestore] Saved transaction', {
      path: `users/${auth.user.uid}/transactions/${txId}`,
      transaction: newTx,
    });

    setTransactions((currentTransactions) =>
      [...currentTransactions, newTx].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    );
  };

  const updateTransaction = async (
    id: string,
    data: Partial<Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>>
  ) => {
    if (!auth.user) return;
    const timestampStr = new Date().toISOString();
    const txRef = doc(transactionsCollectionRef(auth.user.uid), id);
    const updatePayload = {
      ...data,
      updatedAt: timestampStr,
    };
    await setDoc(txRef, updatePayload, { merge: true });
    console.log('[PaiseFlow Firestore] Updated transaction', {
      path: `users/${auth.user.uid}/transactions/${id}`,
      transaction: updatePayload,
    });

    setTransactions((currentTransactions) =>
      currentTransactions
        .map((tx) => (tx.id === id ? { ...tx, ...data, updatedAt: timestampStr } : tx))
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    );
  };

  const deleteTransaction = async (id: string) => {
    if (!auth.user) return;
    await deleteDoc(doc(transactionsCollectionRef(auth.user.uid), id));
    console.log('[PaiseFlow Firestore] Deleted transaction', {
      path: `users/${auth.user.uid}/transactions/${id}`,
    });
    setTransactions((currentTransactions) => currentTransactions.filter((tx) => tx.id !== id));
  };

  // ---------------------------------------------------------
  // Savings Goals CRUD Operations
  // ---------------------------------------------------------

  const addSavingsGoal = async (data: Omit<SavingsGoal, 'id' | 'createdAt' | 'updatedAt'>) => {
    console.log('[PaiseFlow Firestore] addSavingsGoal called', {
      uid: auth.user?.uid,
      data,
    });

    if (!auth.user) {
      console.warn('[PaiseFlow Firestore] Cannot save savings goal without an authenticated user');
      return;
    }

    const timestampStr = new Date().toISOString();
    const goalId = newDocumentId();
    const goalRef = doc(savingsGoalsCollectionRef(auth.user.uid), goalId);
    const newGoal: SavingsGoal = {
      id: goalId,
      name: data.name,
      targetAmount: data.targetAmount,
      currentAmount: data.currentAmount,
      category: data.category,
      deadline: data.deadline,
      createdAt: timestampStr,
      updatedAt: timestampStr,
    };
    await setDoc(goalRef, newGoal);
    console.log('[PaiseFlow Firestore] Saved savings goal', {
      path: `users/${auth.user.uid}/savingsGoals/${goalId}`,
      savingsGoal: newGoal,
    });
    setSavingsGoals((currentGoals) => [...currentGoals, newGoal]);
  };

  const updateSavingsGoal = async (
    id: string,
    data: Partial<Omit<SavingsGoal, 'id' | 'createdAt' | 'updatedAt'>>
  ) => {
    if (!auth.user) return;
    const timestampStr = new Date().toISOString();
    const goalRef = doc(savingsGoalsCollectionRef(auth.user.uid), id);
    const updatePayload = {
      ...data,
      updatedAt: timestampStr,
    };
    await setDoc(goalRef, updatePayload, { merge: true });
    console.log('[PaiseFlow Firestore] Updated savings goal', {
      path: `users/${auth.user.uid}/savingsGoals/${id}`,
      savingsGoal: updatePayload,
    });

    setSavingsGoals((currentGoals) =>
      currentGoals.map((goal) => (goal.id === id ? { ...goal, ...data, updatedAt: timestampStr } : goal))
    );
  };

  const deleteSavingsGoal = async (id: string) => {
    if (!auth.user) return;
    await deleteDoc(doc(savingsGoalsCollectionRef(auth.user.uid), id));
    console.log('[PaiseFlow Firestore] Deleted savings goal', {
      path: `users/${auth.user.uid}/savingsGoals/${id}`,
    });
    setSavingsGoals((currentGoals) => currentGoals.filter((goal) => goal.id !== id));
  };

  return (
    <AppContext.Provider
      value={{
        auth,
        transactions,
        savingsGoals,
        userConfig,
        loading: loading || auth.loading,
        login,
        loginWithGoogle,
        signup,
        resetPassword,
        logout,
        updateBudget,
        updateTheme,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        addSavingsGoal,
        updateSavingsGoal,
        deleteSavingsGoal,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used inside AppProvider');
  }
  return context;
};
