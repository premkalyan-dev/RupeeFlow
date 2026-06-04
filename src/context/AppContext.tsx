/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { isFirebaseConfigured, auth as fireAuth } from '../firebase.ts';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider,
} from 'firebase/auth';
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

// Local Storage Keys
const LOCAL_USERS_KEY = 'rupeeflow_local_users';
const LOCAL_ACTIVE_USER_KEY = 'rupeeflow_local_active_user';
const LOCAL_USER_CONFIGS_KEY = 'rupeeflow_local_user_configs';
const LOCAL_TRANSACTIONS_PREFIX = 'rupeeflow_local_tx_';
const LOCAL_GOALS_PREFIX = 'rupeeflow_local_goals_';

type AppUser = NonNullable<AuthState['user']>;

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [auth, setAuth] = useState<AuthState>({
    user: null,
    loading: true,
    isLocalFallback: true,
  });
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>([]);
  const [userConfig, setUserConfig] = useState<UserConfig | null>(null);
  const [loading, setLoading] = useState(true);

  const loadLocalDataForUser = (localUser: AppUser) => {
    const configsStr = localStorage.getItem(LOCAL_USER_CONFIGS_KEY) || '{}';
    const configs = JSON.parse(configsStr);
    let userConf = configs[localUser.uid];

    if (!userConf) {
      userConf = {
        email: localUser.email || '',
        monthlyBudget: 50000,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      configs[localUser.uid] = userConf;
      localStorage.setItem(LOCAL_USER_CONFIGS_KEY, JSON.stringify(configs));
    }
    setUserConfig(userConf);

    const txsStr = localStorage.getItem(`${LOCAL_TRANSACTIONS_PREFIX}${localUser.uid}`) || '[]';
    const tList = JSON.parse(txsStr) as Transaction[];
    tList.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    setTransactions(tList);

    const goalsStr = localStorage.getItem(`${LOCAL_GOALS_PREFIX}${localUser.uid}`) || '[]';
    const gList = JSON.parse(goalsStr) as SavingsGoal[];
    setSavingsGoals(gList);
    setLoading(false);
  };

  const clearUserState = (isLoading = false) => {
    setAuth({ user: null, loading: isLoading, isLocalFallback: true });
    setUserConfig(null);
    setTransactions([]);
    setSavingsGoals([]);
    setLoading(isLoading);
  };

  // Firebase Auth is preserved, while budgets, expenses, and savings stay in localStorage.
  useEffect(() => {
    if (isFirebaseConfigured && fireAuth) {
      const unsubscribeAuth = onAuthStateChanged(fireAuth, (user) => {
        if (user) {
          const appUser = {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
          };
          localStorage.setItem(LOCAL_ACTIVE_USER_KEY, JSON.stringify(appUser));
          setAuth({ user: appUser, loading: false, isLocalFallback: true });
          loadLocalDataForUser(appUser);
        } else {
          localStorage.removeItem(LOCAL_ACTIVE_USER_KEY);
          clearUserState(false);
        }
      });

      return () => {
        unsubscribeAuth();
      };
    }

    try {
      const activeUserStr = localStorage.getItem(LOCAL_ACTIVE_USER_KEY);
      if (activeUserStr) {
        const localUser = JSON.parse(activeUserStr) as AppUser;
        setAuth({ user: localUser, loading: false, isLocalFallback: true });
        loadLocalDataForUser(localUser);
      } else {
        clearUserState(false);
      }
    } catch {
      clearUserState(false);
    }
  }, []);

  // ---------------------------------------------------------
  // Auth Logic (Firebase Auth when configured, local auth otherwise)
  // ---------------------------------------------------------

  const login = async (email: string, password: string) => {
    if (isFirebaseConfigured && fireAuth) {
      await signInWithEmailAndPassword(fireAuth, email, password);
      return;
    }

    const usersStr = localStorage.getItem(LOCAL_USERS_KEY) || '[]';
    const usersList = JSON.parse(usersStr);
    const matched = usersList.find((u: any) => u.email === email && u.password === password);
    if (!matched) {
      throw new Error('Wrong email or password');
    }
    const localUser = { uid: matched.uid, email: matched.email, displayName: matched.displayName };
    localStorage.setItem(LOCAL_ACTIVE_USER_KEY, JSON.stringify(localUser));
    setAuth({ user: localUser, loading: false, isLocalFallback: true });
    loadLocalDataForUser(localUser);
  };

  const signup = async (email: string, password: string) => {
    if (isFirebaseConfigured && fireAuth) {
      await createUserWithEmailAndPassword(fireAuth, email, password);
      return;
    }

    const usersStr = localStorage.getItem(LOCAL_USERS_KEY) || '[]';
    const usersList = JSON.parse(usersStr);
    if (usersList.some((u: any) => u.email === email)) {
      throw new Error('This user already exists');
    }
    const newUid = 'local_' + Math.random().toString(36).substr(2, 9);
    const newUser = {
      uid: newUid,
      email,
      password,
      displayName: email.split('@')[0],
    };
    usersList.push(newUser);
    localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(usersList));

    const localUser = { uid: newUid, email, displayName: newUser.displayName };
    localStorage.setItem(LOCAL_ACTIVE_USER_KEY, JSON.stringify(localUser));
    setAuth({ user: localUser, loading: false, isLocalFallback: true });
    loadLocalDataForUser(localUser);
  };

  const loginWithGoogle = async () => {
    if (isFirebaseConfigured && fireAuth) {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(fireAuth, provider);
      return;
    }

    const localUser = {
      uid: 'local_google_user',
      email: 'user@rupeeflow.com',
      displayName: 'RupeeFlow User',
    };
    localStorage.setItem(LOCAL_ACTIVE_USER_KEY, JSON.stringify(localUser));
    setAuth({ user: localUser, loading: false, isLocalFallback: true });
    loadLocalDataForUser(localUser);
  };

  const resetPassword = async (email: string) => {
    if (isFirebaseConfigured && fireAuth) {
      await sendPasswordResetEmail(fireAuth, email);
      return;
    }

    const usersStr = localStorage.getItem(LOCAL_USERS_KEY) || '[]';
    const usersList = JSON.parse(usersStr);
    const found = usersList.some((u: any) => u.email === email);
    if (!found) {
      throw new Error('Email not found');
    }
  };

  const logout = async () => {
    if (isFirebaseConfigured && fireAuth) {
      await signOut(fireAuth);
      return;
    }

    localStorage.removeItem(LOCAL_ACTIVE_USER_KEY);
    clearUserState(false);
  };

  // ---------------------------------------------------------
  // Budget Operations
  // ---------------------------------------------------------

  const updateBudget = async (budget: number) => {
    if (!auth.user) return;
    const uid = auth.user.uid;

    const configsStr = localStorage.getItem(LOCAL_USER_CONFIGS_KEY) || '{}';
    const configs = JSON.parse(configsStr);
    const existingConfig = configs[uid] || {
      email: auth.user.email || '',
      monthlyBudget: 50000,
      createdAt: new Date().toISOString(),
    };

    configs[uid] = {
      ...existingConfig,
      monthlyBudget: budget,
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem(LOCAL_USER_CONFIGS_KEY, JSON.stringify(configs));
    setUserConfig({ ...configs[uid] });
  };

  // ---------------------------------------------------------
  // Transaction CRUD Operations
  // ---------------------------------------------------------

  const addTransaction = async (data: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!auth.user) return;
    const uid = auth.user.uid;
    const timestampStr = new Date().toISOString();
    const txKey = `${LOCAL_TRANSACTIONS_PREFIX}${uid}`;
    const txsStr = localStorage.getItem(txKey) || '[]';
    const txs = JSON.parse(txsStr) as Transaction[];
    const newTx: Transaction = {
      id: 'tx_' + Math.random().toString(36).substr(2, 9),
      ...data,
      createdAt: timestampStr,
      updatedAt: timestampStr,
    };
    txs.push(newTx);
    localStorage.setItem(txKey, JSON.stringify(txs));

    txs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    setTransactions([...txs]);
  };

  const updateTransaction = async (
    id: string,
    data: Partial<Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>>
  ) => {
    if (!auth.user) return;
    const uid = auth.user.uid;
    const timestampStr = new Date().toISOString();
    const txKey = `${LOCAL_TRANSACTIONS_PREFIX}${uid}`;
    const txsStr = localStorage.getItem(txKey) || '[]';
    let txs = JSON.parse(txsStr) as Transaction[];
    txs = txs.map((tx) => (tx.id === id ? { ...tx, ...data, updatedAt: timestampStr } : tx));
    localStorage.setItem(txKey, JSON.stringify(txs));

    txs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    setTransactions(txs);
  };

  const deleteTransaction = async (id: string) => {
    if (!auth.user) return;
    const uid = auth.user.uid;
    const txKey = `${LOCAL_TRANSACTIONS_PREFIX}${uid}`;
    const txsStr = localStorage.getItem(txKey) || '[]';
    let txs = JSON.parse(txsStr) as Transaction[];
    txs = txs.filter((tx) => tx.id !== id);
    localStorage.setItem(txKey, JSON.stringify(txs));
    setTransactions(txs);
  };

  // ---------------------------------------------------------
  // Savings Goals CRUD Operations
  // ---------------------------------------------------------

  const addSavingsGoal = async (data: Omit<SavingsGoal, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!auth.user) return;
    const uid = auth.user.uid;
    const timestampStr = new Date().toISOString();
    const goalKey = `${LOCAL_GOALS_PREFIX}${uid}`;
    const goalsStr = localStorage.getItem(goalKey) || '[]';
    const goals = JSON.parse(goalsStr) as SavingsGoal[];
    const newGoal: SavingsGoal = {
      id: 'goal_' + Math.random().toString(36).substr(2, 9),
      ...data,
      createdAt: timestampStr,
      updatedAt: timestampStr,
    };
    goals.push(newGoal);
    localStorage.setItem(goalKey, JSON.stringify(goals));
    setSavingsGoals([...goals]);
  };

  const updateSavingsGoal = async (
    id: string,
    data: Partial<Omit<SavingsGoal, 'id' | 'createdAt' | 'updatedAt'>>
  ) => {
    if (!auth.user) return;
    const uid = auth.user.uid;
    const timestampStr = new Date().toISOString();
    const goalKey = `${LOCAL_GOALS_PREFIX}${uid}`;
    const goalsStr = localStorage.getItem(goalKey) || '[]';
    let goals = JSON.parse(goalsStr) as SavingsGoal[];
    goals = goals.map((g) => (g.id === id ? { ...g, ...data, updatedAt: timestampStr } : g));
    localStorage.setItem(goalKey, JSON.stringify(goals));
    setSavingsGoals(goals);
  };

  const deleteSavingsGoal = async (id: string) => {
    if (!auth.user) return;
    const uid = auth.user.uid;
    const goalKey = `${LOCAL_GOALS_PREFIX}${uid}`;
    const goalsStr = localStorage.getItem(goalKey) || '[]';
    let goals = JSON.parse(goalsStr) as SavingsGoal[];
    goals = goals.filter((g) => g.id !== id);
    localStorage.setItem(goalKey, JSON.stringify(goals));
    setSavingsGoals(goals);
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
