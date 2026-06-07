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
  DocumentData,
  doc,
  getDoc,
  getDocs,
  increment,
  limit,
  orderBy,
  query,
  QueryDocumentSnapshot,
  setDoc,
  startAfter,
  writeBatch,
} from 'firebase/firestore';
import { Transaction, SavingsGoal, UserConfig, AuthState, MonthlySummary } from '../types.ts';

type AppTheme = NonNullable<UserConfig['theme']>;

interface AppContextType {
  auth: AuthState;
  transactions: Transaction[];
  savingsGoals: SavingsGoal[];
  monthlySummary: MonthlySummary | null;
  hasMoreTransactions: boolean;
  loadingMoreTransactions: boolean;
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
  updateTheme: (theme: AppTheme) => Promise<void>;
  
  // Transaction CRUD
  addTransaction: (data: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateTransaction: (id: string, data: Partial<Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  loadMoreTransactions: () => Promise<void>;
  
  // Savings Goals CRUD
  addSavingsGoal: (data: Omit<SavingsGoal, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateSavingsGoal: (id: string, data: Partial<Omit<SavingsGoal, 'id' | 'createdAt' | 'updatedAt'>>) => Promise<void>;
  deleteSavingsGoal: (id: string) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

type AppUser = NonNullable<AuthState['user']>;
const THEME_STORAGE_KEY = 'paiseflow-theme';

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

const TRANSACTIONS_PAGE_SIZE = 50;

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
  const [monthlySummary, setMonthlySummary] = useState<MonthlySummary | null>(null);
  const [hasMoreTransactions, setHasMoreTransactions] = useState(false);
  const [loadingMoreTransactions, setLoadingMoreTransactions] = useState(false);
  const [userConfig, setUserConfig] = useState<UserConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const activeLoadIdRef = useRef(0);
  const lastTransactionSnapshotRef = useRef<QueryDocumentSnapshot<DocumentData> | null>(null);

  const requireFirestore = () => {
    if (!isFirebaseConfigured || !fireAuth || !db) {
      throw new Error('Firebase is not configured. Please check the Firebase config file.');
    }
    return db;
  };

  const userDocRef = (uid: string) => doc(requireFirestore(), 'users', uid);
  const transactionsCollectionRef = (uid: string) => collection(requireFirestore(), 'users', uid, 'transactions');
  const savingsGoalsCollectionRef = (uid: string) => collection(requireFirestore(), 'users', uid, 'savingsGoals');
  const monthlySummaryDocRef = (uid: string, summaryId: string) =>
    doc(requireFirestore(), 'users', uid, 'monthlySummaries', summaryId);

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

  const normalizeMonthlySummary = (id: string, data: Record<string, unknown>): MonthlySummary | null => {
    const expenseTotal = toNumber(data.expenseTotal);
    const savingTotal = toNumber(data.savingTotal);
    const transactionCount = toNumber(data.transactionCount);
    const updatedAt = toStringValue(data.updatedAt);

    if (!id || !Number.isFinite(expenseTotal) || !Number.isFinite(savingTotal) || !Number.isFinite(transactionCount)) {
      return null;
    }

    return {
      id,
      expenseTotal,
      savingTotal,
      transactionCount,
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

  const normalizeUserConfig = (appUser: AppUser, data: Record<string, unknown> | null): UserConfig => {
    const fallbackConfig = defaultUserConfig(appUser);
    const monthlyBudget = toNumber(data?.monthlyBudget);
    const theme =
      data?.theme === 'dark' || data?.theme === 'light' || data?.theme === 'gold'
        ? data.theme
        : fallbackConfig.theme;
    const createdAt = toStringValue(data?.createdAt) || fallbackConfig.createdAt;
    const updatedAt = toStringValue(data?.updatedAt) || fallbackConfig.updatedAt;

    return {
      email: toStringValue(data?.email) || fallbackConfig.email,
      monthlyBudget: Number.isFinite(monthlyBudget) && monthlyBudget > 0 ? monthlyBudget : fallbackConfig.monthlyBudget,
      theme,
      createdAt,
      updatedAt,
    };
  };

  const getSummaryIdFromDate = (date: string) => date.slice(0, 7);

  const getCurrentSummaryId = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  };

  const getSummaryDelta = (tx: Pick<Transaction, 'amount' | 'type'>, direction: 1 | -1) => ({
    expenseTotal: tx.type === 'expense' ? tx.amount * direction : 0,
    savingTotal: tx.type === 'saving' ? tx.amount * direction : 0,
    transactionCount: direction,
  });

  const applyMonthlySummaryDelta = (summaryId: string, delta: ReturnType<typeof getSummaryDelta>) => {
    setMonthlySummary((currentSummary) => {
      if (!currentSummary || currentSummary.id !== summaryId) return currentSummary;
      return {
        ...currentSummary,
        expenseTotal: Math.max(0, currentSummary.expenseTotal + delta.expenseTotal),
        savingTotal: Math.max(0, currentSummary.savingTotal + delta.savingTotal),
        transactionCount: Math.max(0, currentSummary.transactionCount + delta.transactionCount),
        updatedAt: new Date().toISOString(),
      };
    });
  };

  const loadFirestoreDataForUser = async (appUser: AppUser, loadId: number) => {
    setLoading(true);

    try {
      const [configSnap, txSnap, goalsSnap] = await Promise.all([
        getDoc(userDocRef(appUser.uid)),
        getDocs(query(transactionsCollectionRef(appUser.uid), orderBy('date', 'desc'), limit(TRANSACTIONS_PAGE_SIZE))),
        getDocs(query(savingsGoalsCollectionRef(appUser.uid), orderBy('deadline', 'asc'))),
      ]);

      let nextConfig: UserConfig;
      const userDocData = configSnap.exists() ? (configSnap.data() as UserDocumentData) : null;
      if (configSnap.exists()) {
        nextConfig = normalizeUserConfig(appUser, userDocData as unknown as Record<string, unknown>);
      } else {
        nextConfig = defaultUserConfig(appUser);
        await setDoc(userDocRef(appUser.uid), nextConfig);
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
      const currentSummaryId = getCurrentSummaryId();
      const summarySnap = await getDoc(monthlySummaryDocRef(appUser.uid, currentSummaryId));
      const nextMonthlySummary = summarySnap.exists()
        ? normalizeMonthlySummary(summarySnap.id, summarySnap.data())
        : null;

      if (activeLoadIdRef.current !== loadId) return;

      lastTransactionSnapshotRef.current = txSnap.docs[txSnap.docs.length - 1] ?? null;
      setUserConfig(nextConfig);
      setTransactions(nextTransactions);
      setSavingsGoals(nextSavingsGoals);
      setMonthlySummary(nextMonthlySummary);
      setHasMoreTransactions(txSnap.docs.length === TRANSACTIONS_PAGE_SIZE);
    } catch (error) {
      console.error('Could not load Firestore data', error);
      if (activeLoadIdRef.current !== loadId) return;

      setUserConfig(null);
      setTransactions([]);
      setSavingsGoals([]);
      setMonthlySummary(null);
      setHasMoreTransactions(false);
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
    setMonthlySummary(null);
    setHasMoreTransactions(false);
    lastTransactionSnapshotRef.current = null;
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
    if (!userConfig?.theme) return;
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(THEME_STORAGE_KEY, userConfig.theme);
    }
  }, [userConfig?.theme]);

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
    await setDoc(userDocRef(auth.user.uid), nextConfig);
    setUserConfig(nextConfig);
  };

  const updateTheme = async (theme: AppTheme) => {
    if (!auth.user) return;

    const existingConfig = userConfig || defaultUserConfig(auth.user);
    const nextConfig: UserConfig = {
      ...existingConfig,
      theme,
      updatedAt: new Date().toISOString(),
    };
    await setDoc(userDocRef(auth.user.uid), nextConfig);
    setUserConfig(nextConfig);

    if (typeof window !== 'undefined') {
      window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    }
  };

  // ---------------------------------------------------------
  // Transaction CRUD Operations
  // ---------------------------------------------------------

  const addTransaction = async (data: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!auth.user) return;
    const timestampStr = new Date().toISOString();
    const txId = newDocumentId();
    const txRef = doc(transactionsCollectionRef(auth.user.uid), txId);
    const summaryId = getSummaryIdFromDate(data.date);
    const summaryDelta = getSummaryDelta(data, 1);
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
    const batch = writeBatch(requireFirestore());
    batch.set(txRef, newTx);
    batch.set(
      monthlySummaryDocRef(auth.user.uid, summaryId),
      {
        expenseTotal: increment(summaryDelta.expenseTotal),
        savingTotal: increment(summaryDelta.savingTotal),
        transactionCount: increment(1),
        updatedAt: timestampStr,
      },
      { merge: true }
    );
    await batch.commit();

    setTransactions((currentTransactions) =>
      [...currentTransactions, newTx].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    );
    applyMonthlySummaryDelta(summaryId, summaryDelta);
  };

  const updateTransaction = async (
    id: string,
    data: Partial<Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>>
  ) => {
    if (!auth.user) return;
    const timestampStr = new Date().toISOString();
    const existingTransaction = transactions.find((tx) => tx.id === id);
    const txRef = doc(transactionsCollectionRef(auth.user.uid), id);
    const updatePayload = {
      ...data,
      updatedAt: timestampStr,
    };
    const nextTransaction = existingTransaction ? { ...existingTransaction, ...data, updatedAt: timestampStr } : null;
    const batch = writeBatch(requireFirestore());
    batch.set(txRef, updatePayload, { merge: true });

    if (existingTransaction && nextTransaction) {
      const previousSummaryId = getSummaryIdFromDate(existingTransaction.date);
      const nextSummaryId = getSummaryIdFromDate(nextTransaction.date);
      const previousDelta = getSummaryDelta(existingTransaction, -1);
      const nextDelta = getSummaryDelta(nextTransaction, 1);
      batch.set(
        monthlySummaryDocRef(auth.user.uid, previousSummaryId),
        {
          expenseTotal: increment(previousDelta.expenseTotal),
          savingTotal: increment(previousDelta.savingTotal),
          transactionCount: increment(-1),
          updatedAt: timestampStr,
        },
        { merge: true }
      );
      batch.set(
        monthlySummaryDocRef(auth.user.uid, nextSummaryId),
        {
          expenseTotal: increment(nextDelta.expenseTotal),
          savingTotal: increment(nextDelta.savingTotal),
          transactionCount: increment(1),
          updatedAt: timestampStr,
        },
        { merge: true }
      );
    }

    await batch.commit();

    setTransactions((currentTransactions) =>
      currentTransactions
        .map((tx) => (tx.id === id ? { ...tx, ...data, updatedAt: timestampStr } : tx))
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    );

    if (existingTransaction && nextTransaction) {
      applyMonthlySummaryDelta(getSummaryIdFromDate(existingTransaction.date), getSummaryDelta(existingTransaction, -1));
      applyMonthlySummaryDelta(getSummaryIdFromDate(nextTransaction.date), getSummaryDelta(nextTransaction, 1));
    }
  };

  const deleteTransaction = async (id: string) => {
    if (!auth.user) return;
    const existingTransaction = transactions.find((tx) => tx.id === id);
    const batch = writeBatch(requireFirestore());
    batch.delete(doc(transactionsCollectionRef(auth.user.uid), id));

    if (existingTransaction) {
      const summaryId = getSummaryIdFromDate(existingTransaction.date);
      const summaryDelta = getSummaryDelta(existingTransaction, -1);
      batch.set(
        monthlySummaryDocRef(auth.user.uid, summaryId),
        {
          expenseTotal: increment(summaryDelta.expenseTotal),
          savingTotal: increment(summaryDelta.savingTotal),
          transactionCount: increment(-1),
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
    }

    await batch.commit();
    setTransactions((currentTransactions) => currentTransactions.filter((tx) => tx.id !== id));

    if (existingTransaction) {
      applyMonthlySummaryDelta(getSummaryIdFromDate(existingTransaction.date), getSummaryDelta(existingTransaction, -1));
    }
  };

  const loadMoreTransactions = async () => {
    if (!auth.user || !lastTransactionSnapshotRef.current || loadingMoreTransactions || !hasMoreTransactions) return;

    setLoadingMoreTransactions(true);
    try {
      const nextSnap = await getDocs(
        query(
          transactionsCollectionRef(auth.user.uid),
          orderBy('date', 'desc'),
          startAfter(lastTransactionSnapshotRef.current),
          limit(TRANSACTIONS_PAGE_SIZE)
        )
      );
      const nextTransactions = nextSnap.docs
        .map((snapshot) => normalizeTransaction(snapshot.id, snapshot.data()))
        .filter((transaction): transaction is Transaction => transaction !== null);

      lastTransactionSnapshotRef.current = nextSnap.docs[nextSnap.docs.length - 1] ?? lastTransactionSnapshotRef.current;
      setHasMoreTransactions(nextSnap.docs.length === TRANSACTIONS_PAGE_SIZE);
      setTransactions((currentTransactions) =>
        mergeById(currentTransactions, nextTransactions).sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        )
      );
    } finally {
      setLoadingMoreTransactions(false);
    }
  };

  // ---------------------------------------------------------
  // Savings Goals CRUD Operations
  // ---------------------------------------------------------

  const addSavingsGoal = async (data: Omit<SavingsGoal, 'id' | 'createdAt' | 'updatedAt'>) => {
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

    setSavingsGoals((currentGoals) =>
      currentGoals.map((goal) => (goal.id === id ? { ...goal, ...data, updatedAt: timestampStr } : goal))
    );
  };

  const deleteSavingsGoal = async (id: string) => {
    if (!auth.user) return;
    await deleteDoc(doc(savingsGoalsCollectionRef(auth.user.uid), id));
    setSavingsGoals((currentGoals) => currentGoals.filter((goal) => goal.id !== id));
  };

  return (
    <AppContext.Provider
      value={{
        auth,
        transactions,
        savingsGoals,
        monthlySummary,
        hasMoreTransactions,
        loadingMoreTransactions,
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
        loadMoreTransactions,
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
