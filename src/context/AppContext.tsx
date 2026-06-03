/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  isFirebaseConfigured,
  auth as fireAuth,
  db as fireDb,
  handleFirestoreError,
  OperationType,
} from '../firebase.ts';
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
  doc,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
} from 'firebase/firestore';
import { Transaction, SavingsGoal, UserConfig, AuthState, TransactionType, TransactionCategory } from '../types.ts';

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

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [auth, setAuth] = useState<AuthState>({
    user: null,
    loading: true,
    isLocalFallback: !isFirebaseConfigured,
  });
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>([]);
  const [userConfig, setUserConfig] = useState<UserConfig | null>(null);
  const [loading, setLoading] = useState(true);

  // Synchronize dynamic items inside Firebase or local storage
  useEffect(() => {
    let unsubscribeUser: () => void = () => {};
    let unsubscribeTx: () => void = () => {};
    let unsubscribeGoals: () => void = () => {};

    if (isFirebaseConfigured && fireAuth) {
      // Firebase Live Connection
      const unsubscribeAuth = onAuthStateChanged(fireAuth, (user) => {
        if (user) {
          const userId = user.uid;
          setAuth({
            user: {
              uid: userId,
              email: user.email,
              displayName: user.displayName,
            },
            loading: false,
            isLocalFallback: false,
          });

          // 1. Subscribe to User Configuration
          const userDocRef = doc(fireDb, 'users', userId);
          unsubscribeUser = onSnapshot(
            userDocRef,
            async (snapshot) => {
              if (snapshot.exists()) {
                setUserConfig(snapshot.data() as UserConfig);
              } else {
                // Initialize default user config if none exists
                const newConfig: UserConfig = {
                  email: user.email || '',
                  monthlyBudget: 50000, // Def 50k INR
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                };
                try {
                  await setDoc(userDocRef, newConfig);
                  setUserConfig(newConfig);
                } catch (err) {
                  // Follow Pillar 3 error format
                  handleFirestoreError(err, OperationType.WRITE, `users/${userId}`);
                }
              }
            },
            (error) => {
              handleFirestoreError(error, OperationType.GET, `users/${userId}`);
            }
          );

          // 2. Subscribe to Transactions
          const txCollectionRef = collection(fireDb, 'users', userId, 'transactions');
          unsubscribeTx = onSnapshot(
            txCollectionRef,
            (snapshot) => {
              const txList: Transaction[] = [];
              snapshot.forEach((docSnap) => {
                txList.push({ id: docSnap.id, ...docSnap.data() } as Transaction);
              });
              // Sort by date descending
              txList.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
              setTransactions(txList);
              setLoading(false);
            },
            (error) => {
              handleFirestoreError(error, OperationType.LIST, `users/${userId}/transactions`);
            }
          );

          // 3. Subscribe to Savings Goals
          const goalsCollectionRef = collection(fireDb, 'users', userId, 'savingsGoals');
          unsubscribeGoals = onSnapshot(
            goalsCollectionRef,
            (snapshot) => {
              const goalsList: SavingsGoal[] = [];
              snapshot.forEach((docSnap) => {
                goalsList.push({ id: docSnap.id, ...docSnap.data() } as SavingsGoal);
              });
              setSavingsGoals(goalsList);
            },
            (error) => {
              handleFirestoreError(error, OperationType.LIST, `users/${userId}/savingsGoals`);
            }
          );

        } else {
          // Logged Out State
          setAuth({ user: null, loading: false, isLocalFallback: false });
          setTransactions([]);
          setSavingsGoals([]);
          setUserConfig(null);
          setLoading(false);
        }
      });

      return () => {
        unsubscribeAuth();
        unsubscribeUser();
        unsubscribeTx();
        unsubscribeGoals();
      };
    } else {
      // -------------------------------------------------------
      // Offline / Local Mode (transparently stored in localStorage)
      // -------------------------------------------------------
      const loadLocalSession = () => {
        try {
          const activeUserStr = localStorage.getItem(LOCAL_ACTIVE_USER_KEY);
          if (activeUserStr) {
            const localUser = JSON.parse(activeUserStr);
            setAuth({
              user: localUser,
              loading: false,
              isLocalFallback: true,
            });

            // Load local configs
            const configsStr = localStorage.getItem(LOCAL_USER_CONFIGS_KEY) || '{}';
            const configs = JSON.parse(configsStr);
            let userConf = configs[localUser.uid];
            if (!userConf) {
              userConf = {
                email: localUser.email,
                monthlyBudget: 50000,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              };
              configs[localUser.uid] = userConf;
              localStorage.setItem(LOCAL_USER_CONFIGS_KEY, JSON.stringify(configs));
            }
            setUserConfig(userConf);

            // Load local Transactions
            const txsStr = localStorage.getItem(`${LOCAL_TRANSACTIONS_PREFIX}${localUser.uid}`) || '[]';
            const tList = JSON.parse(txsStr) as Transaction[];
            tList.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            setTransactions(tList);

            // Load local Savings Goals
            const goalsStr = localStorage.getItem(`${LOCAL_GOALS_PREFIX}${localUser.uid}`) || '[]';
            const gList = JSON.parse(goalsStr) as SavingsGoal[];
            setSavingsGoals(gList);
          } else {
            setAuth({
              user: null,
              loading: false,
              isLocalFallback: true,
            });
            setUserConfig(null);
            setTransactions([]);
            setSavingsGoals([]);
          }
          setLoading(false);
        } catch (e) {
          console.error('Error loading local session:', e);
          setLoading(false);
        }
      };

      loadLocalSession();
    }
  }, [auth.user?.uid]);

  // ---------------------------------------------------------
  // Auth Logic (Dynamically pivots on IsFirebaseConfigured)
  // ---------------------------------------------------------

  const login = async (email: string, password: string) => {
    if (isFirebaseConfigured && fireAuth) {
      await signInWithEmailAndPassword(fireAuth, email, password);
    } else {
      // Offline login
      const usersStr = localStorage.getItem(LOCAL_USERS_KEY) || '[]';
      const usersList = JSON.parse(usersStr);
      const matched = usersList.find((u: any) => u.email === email && u.password === password);
      if (!matched) {
        throw new Error('Invalid email or password in local credentials store');
      }
      const localUser = { uid: matched.uid, email: matched.email, displayName: matched.displayName };
      localStorage.setItem(LOCAL_ACTIVE_USER_KEY, JSON.stringify(localUser));
      setAuth({ user: localUser, loading: false, isLocalFallback: true });
    }
  };

  const signup = async (email: string, password: string) => {
    if (isFirebaseConfigured && fireAuth) {
      const cred = await createUserWithEmailAndPassword(fireAuth, email, password);
      // Create user settings document in Firestore immediately
      if (cred.user) {
        const userDocRef = doc(fireDb, 'users', cred.user.uid);
        const newConfig: UserConfig = {
          email: email,
          monthlyBudget: 50000,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        await setDoc(userDocRef, newConfig);
      }
    } else {
      // Offline signup
      const usersStr = localStorage.getItem(LOCAL_USERS_KEY) || '[]';
      const usersList = JSON.parse(usersStr);
      if (usersList.some((u: any) => u.email === email)) {
        throw new Error('User already exists in local database');
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

      // Authenticate auto-signup
      const localUser = { uid: newUid, email, displayName: newUser.displayName };
      localStorage.setItem(LOCAL_ACTIVE_USER_KEY, JSON.stringify(localUser));
      setAuth({ user: localUser, loading: false, isLocalFallback: true });
    }
  };

  const loginWithGoogle = async () => {
    if (isFirebaseConfigured && fireAuth) {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(fireAuth, provider);
    } else {
      // Offline helper
      const localUser = {
        uid: 'local_google_user',
        email: 'sandbox@rupeeflow.com',
        displayName: 'Sandbox User',
      };
      localStorage.setItem(LOCAL_ACTIVE_USER_KEY, JSON.stringify(localUser));
      setAuth({ user: localUser, loading: false, isLocalFallback: true });
    }
  };

  const resetPassword = async (email: string) => {
    if (isFirebaseConfigured && fireAuth) {
      await sendPasswordResetEmail(fireAuth, email);
    } else {
      // Offline simulator password reset
      const usersStr = localStorage.getItem(LOCAL_USERS_KEY) || '[]';
      const usersList = JSON.parse(usersStr);
      const found = usersList.some((u: any) => u.email === email);
      if (!found) {
        throw new Error('Email not found in local credentials');
      }
      // Simulate success
    }
  };

  const logout = async () => {
    if (isFirebaseConfigured && fireAuth) {
      await signOut(fireAuth);
    } else {
      // Offline logout
      localStorage.removeItem(LOCAL_ACTIVE_USER_KEY);
      setAuth({ user: null, loading: false, isLocalFallback: true });
      setUserConfig(null);
      setTransactions([]);
      setSavingsGoals([]);
    }
  };

  // ---------------------------------------------------------
  // Budget Operations
  // ---------------------------------------------------------

  const updateBudget = async (budget: number) => {
    if (!auth.user) return;
    const uid = auth.user.uid;

    if (isFirebaseConfigured && fireDb) {
      try {
        const userDocRef = doc(fireDb, 'users', uid);
        await updateDoc(userDocRef, {
          monthlyBudget: budget,
          updatedAt: new Date().toISOString(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `users/${uid}`);
      }
    } else {
      // Local storage edit
      const configsStr = localStorage.getItem(LOCAL_USER_CONFIGS_KEY) || '{}';
      const configs = JSON.parse(configsStr);
      if (configs[uid]) {
        configs[uid].monthlyBudget = budget;
        configs[uid].updatedAt = new Date().toISOString();
        localStorage.setItem(LOCAL_USER_CONFIGS_KEY, JSON.stringify(configs));
        setUserConfig({ ...configs[uid] });
      }
    }
  };

  // ---------------------------------------------------------
  // Transaction CRUD Operations
  // ---------------------------------------------------------

  const addTransaction = async (data: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!auth.user) return;
    const uid = auth.user.uid;
    const timestampStr = new Date().toISOString();

    if (isFirebaseConfigured && fireDb) {
      try {
        const txCollectionRef = collection(fireDb, 'users', uid, 'transactions');
        await addDoc(txCollectionRef, {
          ...data,
          createdAt: timestampStr,
          updatedAt: timestampStr,
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `users/${uid}/transactions`);
      }
    } else {
      // LocalStorage save
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

      // Update state sorted
      txs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setTransactions([...txs]);
    }
  };

  const updateTransaction = async (
    id: string,
    data: Partial<Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>>
  ) => {
    if (!auth.user) return;
    const uid = auth.user.uid;
    const timestampStr = new Date().toISOString();

    if (isFirebaseConfigured && fireDb) {
      try {
        const txDocRef = doc(fireDb, 'users', uid, 'transactions', id);
        await updateDoc(txDocRef, {
          ...data,
          updatedAt: timestampStr,
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `users/${uid}/transactions/${id}`);
      }
    } else {
      const txKey = `${LOCAL_TRANSACTIONS_PREFIX}${uid}`;
      const txsStr = localStorage.getItem(txKey) || '[]';
      let txs = JSON.parse(txsStr) as Transaction[];
      txs = txs.map((tx) => (tx.id === id ? { ...tx, ...data, updatedAt: timestampStr } : tx));
      localStorage.setItem(txKey, JSON.stringify(txs));

      // Update state sorted
      txs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setTransactions(txs);
    }
  };

  const deleteTransaction = async (id: string) => {
    if (!auth.user) return;
    const uid = auth.user.uid;

    if (isFirebaseConfigured && fireDb) {
      try {
        const txDocRef = doc(fireDb, 'users', uid, 'transactions', id);
        await deleteDoc(txDocRef);
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `users/${uid}/transactions/${id}`);
      }
    } else {
      const txKey = `${LOCAL_TRANSACTIONS_PREFIX}${uid}`;
      const txsStr = localStorage.getItem(txKey) || '[]';
      let txs = JSON.parse(txsStr) as Transaction[];
      txs = txs.filter((tx) => tx.id !== id);
      localStorage.setItem(txKey, JSON.stringify(txs));
      setTransactions(txs);
    }
  };

  // ---------------------------------------------------------
  // Savings Goals CRUD Operations
  // ---------------------------------------------------------

  const addSavingsGoal = async (data: Omit<SavingsGoal, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!auth.user) return;
    const uid = auth.user.uid;
    const timestampStr = new Date().toISOString();

    if (isFirebaseConfigured && fireDb) {
      try {
        const goalsCollectionRef = collection(fireDb, 'users', uid, 'savingsGoals');
        await addDoc(goalsCollectionRef, {
          ...data,
          createdAt: timestampStr,
          updatedAt: timestampStr,
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `users/${uid}/savingsGoals`);
      }
    } else {
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
    }
  };

  const updateSavingsGoal = async (
    id: string,
    data: Partial<Omit<SavingsGoal, 'id' | 'createdAt' | 'updatedAt'>>
  ) => {
    if (!auth.user) return;
    const uid = auth.user.uid;
    const timestampStr = new Date().toISOString();

    if (isFirebaseConfigured && fireDb) {
      try {
        const goalDocRef = doc(fireDb, 'users', uid, 'savingsGoals', id);
        await updateDoc(goalDocRef, {
          ...data,
          updatedAt: timestampStr,
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `users/${uid}/savingsGoals/${id}`);
      }
    } else {
      const goalKey = `${LOCAL_GOALS_PREFIX}${uid}`;
      const goalsStr = localStorage.getItem(goalKey) || '[]';
      let goals = JSON.parse(goalsStr) as SavingsGoal[];
      goals = goals.map((g) => (g.id === id ? { ...g, ...data, updatedAt: timestampStr } : g));
      localStorage.setItem(goalKey, JSON.stringify(goals));
      setSavingsGoals(goals);
    }
  };

  const deleteSavingsGoal = async (id: string) => {
    if (!auth.user) return;
    const uid = auth.user.uid;

    if (isFirebaseConfigured && fireDb) {
      try {
        const goalDocRef = doc(fireDb, 'users', uid, 'savingsGoals', id);
        await deleteDoc(goalDocRef);
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `users/${uid}/savingsGoals/${id}`);
      }
    } else {
      const goalKey = `${LOCAL_GOALS_PREFIX}${uid}`;
      const goalsStr = localStorage.getItem(goalKey) || '[]';
      let goals = JSON.parse(goalsStr) as SavingsGoal[];
      goals = goals.filter((g) => g.id !== id);
      localStorage.setItem(goalKey, JSON.stringify(goals));
      setSavingsGoals(goals);
    }
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
