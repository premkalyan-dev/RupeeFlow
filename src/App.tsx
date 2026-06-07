/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Suspense, lazy, useEffect, useMemo, useRef, useState } from 'react';
import { AppProvider, useApp } from './context/AppContext.tsx';
import { MainLogo } from './components/Logo.tsx';
import { getCategoryMeta, formatINR, formatDate, EXPENSE_CATEGORIES } from './utils.ts';
import { Transaction, UserConfig } from './types.ts';
import {
  Plus,
  Search,
  ArrowUpRight,
  ArrowDownRight,
  Calculator,
  Trash2,
  Edit2,
  LayoutDashboard,
  Target,
  PieChart as PieIcon,
  LogOut,
  Sun,
  Moon,
  Crown,
  Settings,
  ChevronRight,
  TrendingUp,
  Receipt,
  Grid,
  Menu,
  X,
  Info,
  Mail,
  Shield,
} from 'lucide-react';

type PublicRoute = '/' | '/about' | '/contact' | '/privacy-policy' | '/tools';
type CalculatorRoute =
  | '/emi-calculator'
  | '/sip-calculator'
  | '/savings-goal-calculator'
  | '/fd-calculator'
  | '/rd-calculator'
  | '/budget-planner';
type AppRoute = PublicRoute | CalculatorRoute;
type AppTheme = NonNullable<UserConfig['theme']>;

const AuthPage = lazy(() => import('./components/AuthPage.tsx').then((module) => ({ default: module.AuthPage })));
const TransactionModal = lazy(() =>
  import('./components/TransactionModal.tsx').then((module) => ({ default: module.TransactionModal }))
);
const SavingsGoals = lazy(() =>
  import('./components/SavingsGoals.tsx').then((module) => ({ default: module.SavingsGoals }))
);
const BudMeter = lazy(() => import('./components/BudMeter.tsx').then((module) => ({ default: module.BudMeter })));
const AnalyticsCharts = lazy(() =>
  import('./components/AnalyticsCharts.tsx').then((module) => ({ default: module.AnalyticsCharts }))
);
const AdUnit = lazy(() => import('./components/AdUnit.tsx'));
const PrivacyPolicy = lazy(() =>
  import('./pages/PrivacyPolicy.tsx').then((module) => ({ default: module.PrivacyPolicy }))
);
const AboutUs = lazy(() => import('./pages/AboutUs.tsx').then((module) => ({ default: module.AboutUs })));
const ContactUs = lazy(() => import('./pages/ContactUs.tsx').then((module) => ({ default: module.ContactUs })));
const Tools = lazy(() => import('./pages/Tools.tsx').then((module) => ({ default: module.Tools })));
const calculatorPages = {
  '/emi-calculator': lazy(() =>
    import('./pages/CalculatorPages.tsx').then((module) => ({ default: module.EmiCalculator }))
  ),
  '/sip-calculator': lazy(() =>
    import('./pages/CalculatorPages.tsx').then((module) => ({ default: module.SipCalculator }))
  ),
  '/savings-goal-calculator': lazy(() =>
    import('./pages/CalculatorPages.tsx').then((module) => ({ default: module.SavingsGoalCalculator }))
  ),
  '/fd-calculator': lazy(() =>
    import('./pages/CalculatorPages.tsx').then((module) => ({ default: module.FdCalculator }))
  ),
  '/rd-calculator': lazy(() =>
    import('./pages/CalculatorPages.tsx').then((module) => ({ default: module.RdCalculator }))
  ),
  '/budget-planner': lazy(() =>
    import('./pages/CalculatorPages.tsx').then((module) => ({ default: module.BudgetPlanner }))
  ),
} satisfies Record<CalculatorRoute, React.LazyExoticComponent<React.FC>>;

const SITE_URL = 'https://paiseflow.in';

const routeSeo: Record<AppRoute, { title: string; description: string; canonical: string }> = {
  '/': {
    title: 'PaiseFlow - Expense & Savings Tracker for India',
    description:
      "Track daily expenses, savings goals, and monthly budgets with PaiseFlow, India's simplest personal finance tracker.",
    canonical: `${SITE_URL}/`,
  },
  '/about': {
    title: 'About PaiseFlow - Free Personal Finance Tracker for India',
    description:
      'Learn about PaiseFlow, a free personal finance tracker for Indians to manage expenses, budgets, and savings goals.',
    canonical: `${SITE_URL}/about`,
  },
  '/contact': {
    title: 'Contact PaiseFlow - Personal Finance Tracker Support',
    description: 'Contact the PaiseFlow team for support, questions, privacy requests, and personal finance app help.',
    canonical: `${SITE_URL}/contact`,
  },
  '/privacy-policy': {
    title: 'Privacy Policy - PaiseFlow',
    description:
      'Read how PaiseFlow protects account, expense, budget, and savings goal data for personal finance tracker users.',
    canonical: `${SITE_URL}/privacy-policy`,
  },
  '/tools': {
    title: 'Financial Calculators - EMI, SIP, FD, RD & Savings Goal | PaiseFlow',
    description:
      'Free online financial calculators including EMI Calculator, SIP Calculator, FD Calculator, RD Calculator, Budget Planner, and Savings Goal Calculator.',
    canonical: `${SITE_URL}/tools`,
  },
  '/emi-calculator': {
    title: 'EMI Calculator - Monthly Loan EMI Calculator | PaiseFlow',
    description: 'Calculate monthly EMI, total interest, and total repayment for loans with the free PaiseFlow EMI Calculator.',
    canonical: `${SITE_URL}/emi-calculator`,
  },
  '/sip-calculator': {
    title: 'SIP Calculator - Estimate Mutual Fund Returns | PaiseFlow',
    description: 'Estimate future value, invested amount, and expected returns from monthly SIP investments.',
    canonical: `${SITE_URL}/sip-calculator`,
  },
  '/savings-goal-calculator': {
    title: 'Savings Goal Calculator - Monthly Savings Planner | PaiseFlow',
    description: 'Find how much you need to save every month to reach your savings goal on time.',
    canonical: `${SITE_URL}/savings-goal-calculator`,
  },
  '/fd-calculator': {
    title: 'FD Calculator - Fixed Deposit Maturity Calculator | PaiseFlow',
    description: 'Calculate fixed deposit maturity value and interest earned with the free PaiseFlow FD Calculator.',
    canonical: `${SITE_URL}/fd-calculator`,
  },
  '/rd-calculator': {
    title: 'RD Calculator - Recurring Deposit Calculator | PaiseFlow',
    description: 'Estimate recurring deposit maturity amount, total deposits, and interest earned.',
    canonical: `${SITE_URL}/rd-calculator`,
  },
  '/budget-planner': {
    title: 'Budget Planner - Monthly Budget Calculator | PaiseFlow',
    description: 'Plan monthly needs, wants, and savings allocations using the free PaiseFlow Budget Planner.',
    canonical: `${SITE_URL}/budget-planner`,
  },
};

const ensureHeadElement = <T extends HTMLMetaElement | HTMLLinkElement>(
  selector: string,
  createElement: () => T
) => {
  const existingElement = document.querySelector(selector) as T | null;
  if (existingElement) return existingElement;

  const nextElement = createElement();
  document.head.appendChild(nextElement);
  return nextElement;
};

const setMetaContent = (selector: string, createElement: () => HTMLMetaElement, content: string) => {
  ensureHeadElement(selector, createElement).setAttribute('content', content);
};

const useSeoMetadata = (route: AppRoute) => {
  useEffect(() => {
    const metadata = routeSeo[route];
    document.title = metadata.title;

    setMetaContent('meta[name="description"]', () => {
      const element = document.createElement('meta');
      element.setAttribute('name', 'description');
      return element;
    }, metadata.description);

    setMetaContent('meta[property="og:title"]', () => {
      const element = document.createElement('meta');
      element.setAttribute('property', 'og:title');
      return element;
    }, metadata.title);

    setMetaContent('meta[property="og:description"]', () => {
      const element = document.createElement('meta');
      element.setAttribute('property', 'og:description');
      return element;
    }, metadata.description);

    setMetaContent('meta[property="og:url"]', () => {
      const element = document.createElement('meta');
      element.setAttribute('property', 'og:url');
      return element;
    }, metadata.canonical);

    setMetaContent('meta[name="twitter:title"]', () => {
      const element = document.createElement('meta');
      element.setAttribute('name', 'twitter:title');
      return element;
    }, metadata.title);

    setMetaContent('meta[name="twitter:description"]', () => {
      const element = document.createElement('meta');
      element.setAttribute('name', 'twitter:description');
      return element;
    }, metadata.description);

    ensureHeadElement('link[rel="canonical"]', () => {
      const element = document.createElement('link');
      element.setAttribute('rel', 'canonical');
      return element;
    }).setAttribute('href', metadata.canonical);

    setMetaContent('meta[property="og:image:alt"]', () => {
      const element = document.createElement('meta');
      element.setAttribute('property', 'og:image:alt');
      return element;
    }, 'PaiseFlow expense and savings tracker preview');

    setMetaContent('meta[name="twitter:image:alt"]', () => {
      const element = document.createElement('meta');
      element.setAttribute('name', 'twitter:image:alt');
      return element;
    }, 'PaiseFlow expense and savings tracker preview');
  }, [route]);
};

const calculatorRoutes: CalculatorRoute[] = [
  '/emi-calculator',
  '/sip-calculator',
  '/savings-goal-calculator',
  '/fd-calculator',
  '/rd-calculator',
  '/budget-planner',
];

const getCurrentPath = (): AppRoute => {
  const path = window.location.pathname;
  if (path === '/about' || path === '/contact' || path === '/privacy-policy' || path === '/tools') return path;
  if (calculatorRoutes.includes(path as CalculatorRoute)) return path as CalculatorRoute;
  return '/';
};

const navigateTo = (path: AppRoute) => {
  window.history.pushState({}, '', path);
  window.dispatchEvent(new PopStateEvent('popstate'));
};

const getYearMonthFromDate = (date: string) => {
  const [year, month] = date.split('-');
  if (!year || !month) return null;
  return { year, month };
};

const getCurrentYearMonth = () => {
  const now = new Date();
  return {
    year: String(now.getFullYear()),
    month: String(now.getMonth() + 1).padStart(2, '0'),
  };
};

const isCurrentMonthDate = (date: string) => {
  const parsedDate = getYearMonthFromDate(date);
  if (!parsedDate) return true;

  const currentDate = getCurrentYearMonth();
  return parsedDate.year === currentDate.year && parsedDate.month === currentDate.month;
};

interface TransactionTableProps {
  transactions: Transaction[];
  emptyMessage: string;
  onEdit: (tx: Transaction) => void;
  onDelete: (tx: Transaction) => void;
  emptyId: string;
  tableId: string;
}

interface DeleteRecordConfirmationModalProps {
  transaction: Transaction | null;
  isDeleting: boolean;
  error: string | null;
  onCancel: () => void;
  onConfirm: () => void;
}

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  isBusy?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

const getFocusableElements = (container: HTMLElement) =>
  Array.from(
    container.querySelectorAll<HTMLElement>(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )
  );

const DeleteRecordConfirmationModal: React.FC<DeleteRecordConfirmationModalProps> = ({
  transaction,
  isDeleting,
  error,
  onCancel,
  onConfirm,
}) => {
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const cancelButtonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!transaction) return;

    const previousActiveElement = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    cancelButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onCancel();
        return;
      }

      if (event.key !== 'Tab' || !dialogRef.current) return;

      const focusableElements = getFocusableElements(dialogRef.current);
      if (focusableElements.length === 0) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      previousActiveElement?.focus();
    };
  }, [onCancel, transaction]);

  if (!transaction) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm transition-opacity duration-200">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-record-title"
        aria-describedby="delete-record-message"
        className="w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[20px] shadow-2xl p-5 font-sans select-none transition-all duration-200"
      >
        <h3 id="delete-record-title" className="font-heading text-base font-bold text-slate-900 dark:text-white">
          Delete Record?
        </h3>
        <p id="delete-record-message" className="mt-2 text-xs leading-5 text-slate-500 dark:text-slate-400">
          This action cannot be undone.
        </p>

        {error && (
          <div className="mt-4 p-3 text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/20 rounded-xl border border-red-200 dark:border-red-900/30">
            {error}
          </div>
        )}

        <div className="mt-5 flex items-center justify-end gap-3">
          <button
            ref={cancelButtonRef}
            type="button"
            onClick={onCancel}
            disabled={isDeleting}
            className="min-h-11 px-4 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-800 hover:dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="min-h-11 px-5 rounded-xl text-xs font-bold bg-red-500 hover:bg-red-600 text-white shadow-md transition disabled:opacity-50"
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
};

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  title,
  message,
  confirmLabel,
  isBusy = false,
  onCancel,
  onConfirm,
}) => {
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const cancelButtonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const previousActiveElement = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    cancelButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onCancel();
        return;
      }

      if (event.key !== 'Tab' || !dialogRef.current) return;
      const focusableElements = getFocusableElements(dialogRef.current);
      if (focusableElements.length === 0) return;
      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      previousActiveElement?.focus();
    };
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm transition-opacity duration-200">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirmation-modal-title"
        aria-describedby="confirmation-modal-message"
        className="w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[20px] shadow-2xl p-5 font-sans select-none transition-all duration-200"
      >
        <h3 id="confirmation-modal-title" className="font-heading text-base font-bold text-slate-900 dark:text-white">
          {title}
        </h3>
        <p id="confirmation-modal-message" className="mt-2 text-xs leading-5 text-slate-500 dark:text-slate-400">
          {message}
        </p>

        <div className="mt-5 flex items-center justify-end gap-3">
          <button
            ref={cancelButtonRef}
            type="button"
            onClick={onCancel}
            disabled={isBusy}
            className="min-h-11 px-4 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-800 hover:dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isBusy}
            className="min-h-11 px-5 rounded-xl text-xs font-bold bg-red-500 hover:bg-red-600 text-white shadow-md transition disabled:opacity-50"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

const TransactionTable: React.FC<TransactionTableProps> = ({
  transactions,
  emptyMessage,
  onEdit,
  onDelete,
  emptyId,
  tableId,
}) => {
  if (transactions.length === 0) {
    return (
      <div className="py-10 text-center text-xs text-slate-400" id={emptyId}>
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto" id={tableId}>
      <table className="w-full text-left text-xs">
        <thead>
          <tr className="border-b border-slate-50 dark:border-slate-850 text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">
            <th scope="col" className="py-2.5 px-3">Date</th>
            <th scope="col" className="py-2.5 px-3">Category</th>
            <th scope="col" className="py-2.5 px-3">Note</th>
            <th scope="col" className="py-2.5 px-3">Kind</th>
            <th scope="col" className="py-2.5 px-3 text-right">Amount</th>
            <th scope="col" className="py-2.5 px-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50 dark:divide-slate-850">
          {transactions.map((tx) => {
            const meta = getCategoryMeta(tx.category);
            return (
              <tr key={tx.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition group">
                <td className="py-3 px-3 font-medium text-slate-550 dark:text-slate-400 whitespace-nowrap">
                  {formatDate(tx.date)}
                </td>
                <td className="py-3 px-3">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold text-semibold ${meta.bgClass} ${meta.textClass}`}>
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: meta.color }} />
                    {meta.name}
                  </span>
                </td>
                <td className="py-3 px-3 font-semibold text-slate-800 dark:text-slate-200 line-clamp-1 max-w-[150px] sm:max-w-[250px] truncate">
                  {tx.description}
                </td>
                <td className="py-3 px-3 whitespace-nowrap">
                  {tx.type === 'expense' ? (
                    <span className="text-red-500 dark:text-red-400 font-bold text-[10px] uppercase font-mono tracking-widest">
                      Spending
                    </span>
                  ) : (
                    <span className="text-emerald-500 dark:text-emerald-400 font-bold text-[10px] uppercase font-mono tracking-widest">
                      Saving
                    </span>
                  )}
                </td>
                <td className={`py-3 px-3 text-right font-bold text-sm whitespace-nowrap ${
                  tx.type === 'expense' ? 'text-red-550' : 'text-emerald-500 dark:text-emerald-400'
                }`}>
                  {tx.type === 'expense' ? '-' : '+'}{formatINR(tx.amount)}
                </td>
                <td className="py-3 px-3 text-right">
                  <div className="flex items-center justify-end gap-1.5 opacity-80 group-hover:opacity-100 transition">
                    <button
                      onClick={() => onEdit(tx)}
                      className="min-h-11 min-w-11 p-1 rounded-md text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-850 hover:text-slate-700 dark:hover:text-slate-200 transition touch-manipulation cursor-pointer inline-flex items-center justify-center"
                      title="Edit Entry"
                      aria-label={`Edit ${tx.description}`}
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDelete(tx)}
                      className="min-h-11 min-w-11 p-1 rounded-md text-slate-400 hover:bg-red-50 dark:hover:bg-red-950/20 hover:text-red-600 dark:hover:text-red-400 transition touch-manipulation cursor-pointer inline-flex items-center justify-center"
                      title="Delete Entry"
                      aria-label={`Delete ${tx.description}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

const RecentTransactionsList: React.FC<{
  onEdit: (tx: Transaction) => void;
  onDelete: (tx: Transaction) => void;
}> = ({ onEdit, onDelete }) => {
  const { transactions } = useApp();
  const recentTransactions = useMemo(() => {
    const currentMonthTransactions = transactions.filter((tx) => isCurrentMonthDate(tx.date));
    return (currentMonthTransactions.length > 0 ? currentMonthTransactions : transactions).slice(0, 10);
  }, [transactions]);

  return (
    <TransactionTable
      transactions={recentTransactions}
      emptyMessage="No records stored yet. Click the record button above to log your first spend or saver!"
      onEdit={onEdit}
      onDelete={onDelete}
      emptyId="empty-dashboard-transactions"
      tableId="dashboard-ledger-table-box"
    />
  );
};

const HistoryTransactionsList: React.FC<{
  searchQuery: string;
  categoryFilter: string;
  typeFilter: 'All' | 'expense' | 'saving';
  onEdit: (tx: Transaction) => void;
  onDelete: (tx: Transaction) => void;
}> = ({ searchQuery, categoryFilter, typeFilter, onEdit, onDelete }) => {
  const { transactions } = useApp();
  const validCategoryFilter =
    categoryFilter === 'All' ||
    categoryFilter === 'Savings' ||
    EXPENSE_CATEGORIES.includes(categoryFilter as any)
      ? categoryFilter
      : 'All';
  const validTypeFilter = typeFilter === 'expense' || typeFilter === 'saving' || typeFilter === 'All' ? typeFilter : 'All';
  const filteredTransactions = useMemo(() => {
    const normalizedSearch = searchQuery.trim().toLowerCase();
    return transactions.filter((tx) => {
      const matchesSearch =
        !normalizedSearch ||
        String(tx.description || '').toLowerCase().includes(normalizedSearch) ||
        String(tx.category || '').toLowerCase().includes(normalizedSearch);
      const isKnownCategory = tx.category === 'Savings' || EXPENSE_CATEGORIES.includes(tx.category as any);
      const isKnownType = tx.type === 'expense' || tx.type === 'saving';
      const matchesCategory = validCategoryFilter === 'All' || !isKnownCategory || tx.category === validCategoryFilter;
      const matchesType = validTypeFilter === 'All' || !isKnownType || tx.type === validTypeFilter;
      return matchesSearch && matchesCategory && matchesType;
    });
  }, [searchQuery, transactions, validCategoryFilter, validTypeFilter]);

  return (
    <TransactionTable
      transactions={filteredTransactions}
      emptyMessage={
        transactions.length === 0
          ? 'No records stored yet. Click Add New to log your first spend or saving.'
          : 'No records matching the selected search query or category filters list.'
      }
      onEdit={onEdit}
      onDelete={onDelete}
      emptyId="filtered-ledger-empty"
      tableId="full-ledger-table-box"
    />
  );
};

const DashboardContent: React.FC = () => {
  const {
    auth,
    transactions,
    savingsGoals,
    monthlySummary,
    hasMoreTransactions,
    loadingMoreTransactions,
    userConfig,
    logout,
    updateTheme,
    deleteTransaction,
    loadMoreTransactions,
  } = useApp();

  // Navigation tabs state
  const [activeTab, setActiveTab] = useState<'dashboard' | 'goals' | 'analytics' | 'history'>('dashboard');
  
  // Modal controllers
  const [modalOpen, setModalOpen] = useState(false);
  const [editTx, setEditTx] = useState<Transaction | null>(null);
  const [deleteTx, setDeleteTx] = useState<Transaction | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeletingTx, setIsDeletingTx] = useState(false);
  const [signOutPromptOpen, setSignOutPromptOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  // Search & Filter parameters for context auditing
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [typeFilter, setTypeFilter] = useState<'All' | 'expense' | 'saving'>('All');
  const [menuOpen, setMenuOpen] = useState(false);

  // Theme control
  const [selectedTheme, setSelectedTheme] = useState<AppTheme>(userConfig?.theme || 'light');

  useEffect(() => {
    setSelectedTheme(userConfig?.theme || 'light');
  }, [userConfig?.theme]);

  useEffect(() => {
    if (selectedTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    if (selectedTheme === 'gold') {
      document.documentElement.classList.add('gold');
    } else {
      document.documentElement.classList.remove('gold');
    }

    return () => {
      document.documentElement.classList.remove('gold');
    };
  }, [selectedTheme]);

  const applyTheme = (nextTheme: AppTheme) => {
    const previousTheme = selectedTheme;
    setSelectedTheme(nextTheme);
    updateTheme(nextTheme).catch((error) => {
      console.error('Could not save theme', error);
      setSelectedTheme(previousTheme);
    });
  };

  const cycleTheme = () => {
    const themeOrder: AppTheme[] = ['light', 'dark', 'gold'];
    const currentIndex = themeOrder.indexOf(selectedTheme);
    applyTheme(themeOrder[(currentIndex + 1) % themeOrder.length]);
  };

  const loadedTotals = useMemo(() => {
    return transactions.reduce(
      (totals, tx) => {
        if (tx.type === 'expense') {
          totals.totalExpenses += tx.amount;
          if (isCurrentMonthDate(tx.date)) {
            totals.currentMonthExpenses += tx.amount;
          }
        } else if (tx.type === 'saving') {
          totals.totalSavings += tx.amount;
        }
        return totals;
      },
      { totalExpenses: 0, totalSavings: 0, currentMonthExpenses: 0 }
    );
  }, [transactions]);
  const currentMonthExpenses = monthlySummary?.expenseTotal ?? loadedTotals.currentMonthExpenses;
  const totalExpenses = loadedTotals.totalExpenses;
  const totalSavings = loadedTotals.totalSavings;

  const configuredBudgetLimit = userConfig?.monthlyBudget;
  const budgetLimit =
    Number.isFinite(configuredBudgetLimit) && configuredBudgetLimit > 0 ? configuredBudgetLimit : 50000;
  const remainingBudget = Math.max(0, budgetLimit - currentMonthExpenses);

  const { totalGoalsTarget, totalGoalsSaved, aggregateGoalsPct } = useMemo(() => {
    const goalTotals = savingsGoals.reduce(
      (totals, goal) => {
        totals.totalGoalsTarget += goal.targetAmount;
        totals.totalGoalsSaved += goal.currentAmount;
        return totals;
      },
      { totalGoalsTarget: 0, totalGoalsSaved: 0 }
    );
    return {
      ...goalTotals,
      aggregateGoalsPct:
        goalTotals.totalGoalsTarget > 0
          ? Math.round((goalTotals.totalGoalsSaved / goalTotals.totalGoalsTarget) * 100)
          : 0,
    };
  }, [savingsGoals]);

  const handleOpenEditTx = (tx: Transaction) => {
    setEditTx(tx);
    setModalOpen(true);
  };

  const handleOpenAddTx = () => {
    setEditTx(null);
    setModalOpen(true);
  };

  const handleRequestDeleteTx = (tx: Transaction) => {
    setDeleteTx(tx);
    setDeleteError(null);
  };

  const handleCancelDeleteTx = () => {
    if (isDeletingTx) return;
    setDeleteTx(null);
    setDeleteError(null);
  };

  const handleConfirmDeleteTx = async () => {
    if (!deleteTx) return;

    setIsDeletingTx(true);
    setDeleteError(null);

    try {
      await deleteTransaction(deleteTx.id);
      setDeleteTx(null);
    } catch (error: any) {
      setDeleteError(error?.message || 'Could not delete this record.');
    } finally {
      setIsDeletingTx(false);
    }
  };

  const handlePublicNavigation = (path: AppRoute) => {
    setMenuOpen(false);
    navigateTo(path);
  };

  const handleConfirmSignOut = async () => {
    setIsSigningOut(true);
    try {
      await logout();
      setSignOutPromptOpen(false);
    } finally {
      setIsSigningOut(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 gold:bg-[#0B1120] text-slate-800 dark:text-slate-100 gold:text-[#F8FAFC] flex flex-col font-sans select-none pb-6">
      
      {/* 1. Global Navigation Top Header */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 gold:bg-[#111827]/90 backdrop-blur-md border-b border-slate-100 dark:border-slate-800/80 gold:border-[#D4AF37]/25 transition">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          
          <MainLogo size={28} showSubtitle={false} className="shrink-0" />

          <div className="hidden lg:flex items-center gap-2">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 truncate max-w-[150px]">
              {auth.user?.email}
            </span>
          </div>

          {/* Action Header controls */}
          <div className="relative flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => setMenuOpen((isOpen) => !isOpen)}
              className="min-h-11 min-w-11 p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400 transition cursor-pointer flex items-center justify-center touch-manipulation"
              title="Menu"
              aria-expanded={menuOpen}
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            >
              {menuOpen ? <X className="w-4.5 h-4.5" /> : <Menu className="w-4.5 h-4.5" />}
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-12 w-56 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-xl p-2 z-50">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('dashboard');
                    setMenuOpen(false);
                  }}
                  className="w-full min-h-11 flex items-center gap-2 px-3 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-950 transition"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Dashboard</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('history');
                    setMenuOpen(false);
                  }}
                  className="w-full min-h-11 flex items-center gap-2 px-3 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-950 transition"
                >
                  <Receipt className="w-4 h-4" />
                  <span>History</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('goals');
                    setMenuOpen(false);
                  }}
                  className="w-full min-h-11 flex items-center gap-2 px-3 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-950 transition"
                >
                  <Target className="w-4 h-4" />
                  <span>Savings Goals</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('analytics');
                    setMenuOpen(false);
                  }}
                  className="w-full min-h-11 flex items-center gap-2 px-3 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-950 transition"
                >
                  <PieIcon className="w-4 h-4" />
                  <span>Charts</span>
                </button>

                <div className="my-2 border-t border-slate-100 dark:border-slate-800" />

                <div className="px-3 pt-1.5 pb-1 flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold text-slate-400 dark:text-slate-500 gold:text-[#D4AF37]">
                  <Settings className="w-3.5 h-3.5" />
                  <span>Theme</span>
                </div>
                <div className="grid grid-cols-3 gap-1 px-1 pb-2">
                  {(['light', 'dark', 'gold'] as AppTheme[]).map((themeOption) => {
                    const isActiveTheme = selectedTheme === themeOption;
                    return (
                      <button
                        key={themeOption}
                        type="button"
                        onClick={() => {
                          applyTheme(themeOption);
                          setMenuOpen(false);
                        }}
                        className={`min-h-10 rounded-xl text-[10px] font-bold capitalize transition ${
                          isActiveTheme
                            ? 'bg-indigo-900 text-white dark:bg-emerald-600 gold:bg-[#D4AF37] gold:text-[#0B1120]'
                            : 'text-slate-500 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-950 gold:hover:bg-[#1F2937] gold:hover:text-[#F4D03F]'
                        }`}
                      >
                        {themeOption}
                      </button>
                    );
                  })}
                </div>

                <div className="my-2 border-t border-slate-100 dark:border-slate-800" />

                <button
                  type="button"
                  onClick={() => handlePublicNavigation('/tools')}
                  className="w-full min-h-11 flex items-center gap-2 px-3 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-950 transition"
                >
                  <Calculator className="w-4 h-4" />
                  <span>Tools</span>
                </button>
                <button
                  type="button"
                  onClick={() => handlePublicNavigation('/about')}
                  className="w-full min-h-11 flex items-center gap-2 px-3 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-950 transition"
                >
                  <Info className="w-4 h-4" />
                  <span>About Us</span>
                </button>
                <button
                  type="button"
                  onClick={() => handlePublicNavigation('/contact')}
                  className="w-full min-h-11 flex items-center gap-2 px-3 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-950 transition"
                >
                  <Mail className="w-4 h-4" />
                  <span>Contact Us</span>
                </button>
                <button
                  type="button"
                  onClick={() => handlePublicNavigation('/privacy-policy')}
                  className="w-full min-h-11 flex items-center gap-2 px-3 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-950 transition"
                >
                  <Shield className="w-4 h-4" />
                  <span>Privacy Policy</span>
                </button>
              </div>
            )}
            
            {/* Theme sliding toggle */}
            <button
              onClick={cycleTheme}
              className="min-h-11 min-w-11 p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400 transition cursor-pointer flex items-center justify-center touch-manipulation"
              title="Toggle Theme"
              aria-label={`Toggle theme, current theme is ${selectedTheme}`}
            >
              {selectedTheme === 'gold' ? (
                <Crown className="w-4.5 h-4.5 text-[#D4AF37]" />
              ) : selectedTheme === 'dark' ? (
                <Sun className="w-4.5 h-4.5 text-amber-400" />
              ) : (
                <Moon className="w-4.5 h-4.5 text-indigo-950" />
              )}
            </button>

            <button
              onClick={() => setSignOutPromptOpen(true)}
              className="min-h-11 min-w-11 p-2.5 rounded-xl bg-red-50 hover:bg-red-100 dark:bg-red-950/15 border border-red-100/50 dark:border-red-900/30 text-red-600 dark:text-red-400 transition cursor-pointer flex items-center justify-center touch-manipulation"
              title="Sign Out"
              aria-label="Sign out"
            >
              <LogOut className="w-4.5 h-4.5" />
            </button>
          </div>
        </div>
      </header>

      {/* 2. Primary Layout Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">

        {/* 3. Primary Tabs (Navigation Side-by-side) */}
        <div className="flex w-full items-center gap-1.5 p-1 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 max-w-lg mb-6">
          <button
            onClick={() => setActiveTab('dashboard')}
            aria-current={activeTab === 'dashboard' ? 'page' : undefined}
            className={`min-h-11 min-w-0 flex-1 py-2 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer ${
              activeTab === 'dashboard'
                ? 'bg-indigo-900 text-white dark:bg-emerald-600 gold:bg-[#D4AF37] gold:text-[#0B1120]'
                : 'text-slate-500 hover:text-slate-800 hover:dark:text-slate-200 gold:hover:text-[#F4D03F]'
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate whitespace-nowrap">Dashboard</span>
          </button>
          <button
            onClick={() => setActiveTab('history')}
            aria-current={activeTab === 'history' ? 'page' : undefined}
            className={`min-h-11 min-w-0 flex-1 py-2 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer ${
              activeTab === 'history'
                ? 'bg-indigo-900 text-white dark:bg-emerald-600 gold:bg-[#D4AF37] gold:text-[#0B1120]'
                : 'text-slate-500 hover:text-slate-800 hover:dark:text-slate-200 gold:hover:text-[#F4D03F]'
            }`}
          >
            <Receipt className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate whitespace-nowrap">History</span>
          </button>
          <button
            onClick={() => setActiveTab('goals')}
            aria-current={activeTab === 'goals' ? 'page' : undefined}
            className={`min-h-11 min-w-0 flex-1 py-2 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer ${
              activeTab === 'goals'
                ? 'bg-indigo-900 text-white dark:bg-emerald-600 gold:bg-[#D4AF37] gold:text-[#0B1120]'
                : 'text-slate-500 hover:text-slate-800 hover:dark:text-slate-200 gold:hover:text-[#F4D03F]'
            }`}
          >
            <Target className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate whitespace-nowrap">Goals</span>
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            aria-current={activeTab === 'analytics' ? 'page' : undefined}
            className={`min-h-11 min-w-0 flex-1 py-2 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer ${
              activeTab === 'analytics'
                ? 'bg-indigo-900 text-white dark:bg-emerald-600 gold:bg-[#D4AF37] gold:text-[#0B1120]'
                : 'text-slate-500 hover:text-slate-800 hover:dark:text-slate-200 gold:hover:text-[#F4D03F]'
            }`}
          >
            <PieIcon className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate whitespace-nowrap">Charts</span>
          </button>
        </div>

        {/* ----------------- VIEW 1: MAIN DASHBOARD ----------------- */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6" id="dashboard-tab-view">
            
            {/* Bento Grid Top Stats Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" id="bento-stats-grid">
              
              {/* Stat 1: Month Spends */}
              <div className="bg-white dark:bg-slate-900 p-5 rounded-[20px] border border-slate-100 dark:border-slate-800 shadow-[0_14px_34px_-24px_rgba(15,23,42,0.45)] dark:shadow-[0_18px_44px_-26px_rgba(0,0,0,0.85)] flex flex-col justify-between relative overflow-hidden group hover:-translate-y-0.5 hover:shadow-[0_18px_42px_-24px_rgba(15,23,42,0.5)] dark:hover:shadow-[0_22px_52px_-28px_rgba(0,0,0,0.95)] transition-all duration-[250ms] ease-out">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wider">
                      Spending This Month
                    </p>
                    <h3 className="text-2xl font-extrabold text-indigo-950 dark:text-white font-sans mt-1">
                      {formatINR(currentMonthExpenses)}
                    </h3>
                  </div>
                  <div className="p-2.5 rounded-2xl bg-orange-50 dark:bg-orange-950/20 text-orange-500">
                    <ArrowUpRight className="w-5 h-5" />
                  </div>
                </div>
                <div className="flex items-center gap-1 mt-1 text-[11px] text-slate-400 dark:text-slate-500">
                  <span>Total spent:</span>
                  <strong className="text-slate-600 dark:text-slate-350">{formatINR(totalExpenses)}</strong>
                </div>
              </div>

              {/* Stat 2: Total Savings Stashed */}
              <div className="bg-white dark:bg-slate-900 p-5 rounded-[20px] border border-slate-100 dark:border-slate-800 shadow-[0_14px_34px_-24px_rgba(15,23,42,0.45)] dark:shadow-[0_18px_44px_-26px_rgba(0,0,0,0.85)] flex flex-col justify-between relative overflow-hidden group hover:-translate-y-0.5 hover:shadow-[0_18px_42px_-24px_rgba(15,23,42,0.5)] dark:hover:shadow-[0_22px_52px_-28px_rgba(0,0,0,0.95)] transition-all duration-[250ms] ease-out">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wider">
                      Stashed Savings
                    </p>
                    <h3 className="text-2xl font-extrabold text-slate-950 dark:text-white font-sans mt-1">
                      {formatINR(totalSavings)}
                    </h3>
                  </div>
                  <div className="p-2.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 text-emerald-500">
                    <ArrowDownRight className="w-5 h-5" />
                  </div>
                </div>
                <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1 mt-1">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>Save money step by step</span>
                </p>
              </div>

              {/* Stat 3: Remaining Safe Budget */}
              <div className="bg-white dark:bg-slate-900 p-5 rounded-[20px] border border-slate-100 dark:border-slate-800 shadow-[0_14px_34px_-24px_rgba(15,23,42,0.45)] dark:shadow-[0_18px_44px_-26px_rgba(0,0,0,0.85)] sm:col-span-2 lg:col-span-1 flex flex-col justify-between relative overflow-hidden group hover:-translate-y-0.5 hover:shadow-[0_18px_42px_-24px_rgba(15,23,42,0.5)] dark:hover:shadow-[0_22px_52px_-28px_rgba(0,0,0,0.95)] transition-all duration-[250ms] ease-out">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wider">
                      Money Left This Month
                    </p>
                    <h3 className={`text-2xl font-extrabold font-sans mt-1 ${remainingBudget <= 1000 ? 'text-red-500' : 'text-slate-900 dark:text-white'}`}>
                      {formatINR(remainingBudget)}
                    </h3>
                  </div>
                  <div className={`p-2.5 rounded-2xl ${remainingBudget <= 1000 ? 'bg-red-55 bg-opacity-10 text-red-500' : 'bg-indigo-50 dark:bg-slate-800 text-indigo-900 dark:text-white'}`}>
                    <Receipt className="w-5 h-5" />
                  </div>
                </div>
                <div className="flex items-center gap-1 text-[11px] text-slate-450 dark:text-slate-500">
                  <span>Monthly limit:</span>
                  <strong className="text-slate-650 dark:text-slate-350">{formatINR(budgetLimit)}</strong>
                </div>
              </div>

            </div>

            <Suspense fallback={null}>
              <AdUnit slotId="dashboard-desktop-banner" visibility="desktop" />
              <AdUnit slotId="dashboard-mobile-banner-top" visibility="mobile" />
            </Suspense>

            {/* Quick Record Float Trigger with massive CTA */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-gradient-to-r from-indigo-950 to-indigo-900 dark:from-slate-900 dark:to-slate-850 rounded-[20px] text-white border border-white/10 shadow-[0_18px_44px_-24px_rgba(30,58,138,0.55)] dark:shadow-[0_22px_54px_-28px_rgba(0,0,0,0.95)] hover:-translate-y-0.5 transition-all duration-[250ms] ease-out">
              <div>
                <h3 className="font-heading font-extrabold text-base tracking-tight">
                  Add your spending in 30 seconds
                </h3>
                <p className="text-xs text-indigo-200/80 dark:text-white/60 mt-1 max-w-sm">
                  Add daily costs, shopping, food, or savings quickly.
                </p>
              </div>
              <button
                onClick={handleOpenAddTx}
                className="py-3 px-5 text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg flex items-center justify-center gap-2 cursor-pointer transition-all duration-[250ms] ease-out hover:scale-102 uppercase tracking-wide"
                id="record-spend-dash-btn"
              >
                <Plus className="w-4.5 h-4.5" />
                <span>Add Spend / Saving</span>
              </button>
            </div>

            {/* Middle Split: Budget meter left, Savings summary right */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              <div className="lg:col-span-7">
                <Suspense fallback={null}>
                  <BudMeter />
                </Suspense>
              </div>

              {/* Small Wealth Summary & Goals preview widget */}
              <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[20px] p-5 shadow-[0_14px_34px_-24px_rgba(15,23,42,0.45)] dark:shadow-[0_18px_44px_-26px_rgba(0,0,0,0.85)] flex flex-col justify-between hover:-translate-y-0.5 hover:shadow-[0_18px_42px_-24px_rgba(15,23,42,0.5)] dark:hover:shadow-[0_22px_52px_-28px_rgba(0,0,0,0.95)] transition-all duration-[250ms] ease-out">
                <div>
                  <div className="flex items-center justify-between gap-2 pb-3 mb-2.5 border-b border-slate-50 dark:border-slate-800">
                    <h4 className="font-heading font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                      <Target className="w-4 h-4 text-emerald-500" />
                      <span>Savings Progress</span>
                    </h4>
                    <button
                      onClick={() => setActiveTab('goals')}
                      className="text-[10px] font-bold text-indigo-600 dark:text-emerald-400 hover:underline flex items-center gap-0.5"
                    >
                      <span>See All</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>

                  {savingsGoals.length === 0 ? (
                    <div className="py-8 text-center text-xs text-slate-400">
                      You have no savings goals yet. Add one from the Savings Goals tab.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-end justify-between">
                        <div>
                          <p className="text-[10px] uppercase font-mono tracking-wider font-semibold text-slate-400">
                            Total Saved
                          </p>
                          <h4 className="text-xl font-extrabold text-indigo-950 dark:text-white mt-1">
                            {formatINR(totalGoalsSaved)}{' '}
                            <span className="text-xs font-semibold text-slate-400">
                              / {formatINR(totalGoalsTarget)}
                            </span>
                          </h4>
                        </div>
                        <span className="text-base font-extrabold text-emerald-500 font-mono">
                          {aggregateGoalsPct}%
                        </span>
                      </div>

                      {/* Stack mini progress lines of top 2 goals */}
                      {savingsGoals.slice(0, 2).map((goal) => {
                        const targetVal = goal.targetAmount;
                        const savedVal = goal.currentAmount;
                        const fraction = targetVal > 0 ? Math.round((savedVal / targetVal) * 100) : 0;
                        return (
                          <div key={goal.id} className="text-xs">
                            <div className="flex items-center justify-between text-[11px] text-slate-650 dark:text-slate-400 mb-1">
                              <span className="font-semibold truncate max-w-[200px]">{goal.name}</span>
                              <span className="font-mono">{fraction}%</span>
                            </div>
                            <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-950 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-emerald-500 transition-all duration-350"
                                style={{ width: `${Math.min(fraction, 100)}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-slate-50 dark:border-slate-800/80 text-[10px] text-slate-400 leading-relaxed font-medium">
                  A simple habit: try to save some money every month.
                </div>
              </div>

            </div>

            {/* Recent list table ledger layout */}
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-5 rounded-[20px] shadow-[0_14px_34px_-24px_rgba(15,23,42,0.45)] dark:shadow-[0_18px_44px_-26px_rgba(0,0,0,0.85)] hover:-translate-y-0.5 hover:shadow-[0_18px_42px_-24px_rgba(15,23,42,0.5)] dark:hover:shadow-[0_22px_52px_-28px_rgba(0,0,0,0.95)] transition-all duration-[250ms] ease-out" id="recent-transactions-widget">
              <div className="flex items-center justify-between gap-4 pb-3 mb-4 border-b border-slate-100 dark:border-slate-800/80">
                <div>
                  <h4 className="font-heading font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                    <Receipt className="w-4 h-4 text-slate-400" />
                    <span>Recent Records (Last 10)</span>
                  </h4>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                    Check, edit, or delete your latest records here.
                  </p>
                </div>

                <button
                  onClick={() => setActiveTab('history')}
                  className="px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 dark:bg-slate-950 dark:hover:bg-slate-850 border border-slate-100 dark:border-slate-800 text-[10px] font-bold text-slate-500 hover:text-indigo-900 transition flex items-center gap-1 whitespace-nowrap"
                >
                  <Grid className="w-3.5 h-3.5" />
                  <span>Show All Records</span>
                </button>
              </div>

              <RecentTransactionsList onEdit={handleOpenEditTx} onDelete={handleRequestDeleteTx} />
            </div>

            <Suspense fallback={null}>
              <AdUnit slotId="dashboard-desktop-rectangle" visibility="desktop" />
              <AdUnit slotId="dashboard-mobile-banner-after-transactions" visibility="mobile" />
            </Suspense>

          </div>
        )}

        {/* ----------------- VIEW 2: HISTORY ----------------- */}
        {activeTab === 'history' && (
          <div className="space-y-6" id="history-tab-view">
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-5 rounded-3xl" id="full-ledger-filter-card">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 mb-4 border-b border-slate-150 dark:border-slate-800">
                <div>
                  <h3 className="font-heading font-bold text-base text-slate-900 dark:text-white">
                    Full History
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Search and manage all your records.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleOpenAddTx}
                    className="py-2.5 px-4 text-xs font-bold bg-indigo-900 hover:bg-indigo-950 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white rounded-xl shadow-md flex items-center justify-center gap-1 cursor-pointer transition"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add New</span>
                  </button>
                </div>
              </div>

              {/* Filtering toolbox inline */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5">
                <div className="sm:col-span-5 relative text-slate-400 focus-within:text-indigo-900">
                  <Search className="w-4 h-4 absolute left-3 top-3" />
                  <input
                    type="text"
                    placeholder="Search note or category..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-205 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-indigo-900/30"
                  />
                </div>

                <div className="sm:col-span-3">
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-205 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:outline-none"
                  >
                    <option value="All">All Categories</option>
                    {EXPENSE_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                    <option value="Savings">Only Savings</option>
                  </select>
                </div>

                <div className="sm:col-span-4">
                  <div className="flex p-1 bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-500">
                    <button
                      onClick={() => setTypeFilter('All')}
                      className={`flex-1 py-1 text-[11px] font-bold rounded-lg text-center transition ${
                        typeFilter === 'All' ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow' : 'hover:text-slate-800'
                      }`}
                    >
                      All Types
                    </button>
                    <button
                      onClick={() => setTypeFilter('expense')}
                      className={`flex-1 py-1 text-[11px] font-bold rounded-lg text-center transition ${
                        typeFilter === 'expense' ? 'bg-white dark:bg-slate-800 text-red-500 dark:text-red-400 shadow' : 'hover:text-slate-800'
                      }`}
                    >
                      Spending
                    </button>
                    <button
                      onClick={() => setTypeFilter('saving')}
                      className={`flex-1 py-1 text-[11px] font-bold rounded-lg text-center transition ${
                        typeFilter === 'saving' ? 'bg-white dark:bg-slate-800 text-emerald-500 dark:text-emerald-400 shadow' : 'hover:text-slate-800'
                      }`}
                    >
                      Saved
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Structured tabular list */}
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-5 shadow-sm" id="full-ledger-table-card">
              <HistoryTransactionsList
                searchQuery={searchQuery}
                categoryFilter={categoryFilter}
                typeFilter={typeFilter}
                onEdit={handleOpenEditTx}
                onDelete={handleRequestDeleteTx}
              />
              {hasMoreTransactions && (
                <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 flex justify-center">
                  <button
                    type="button"
                    onClick={loadMoreTransactions}
                    disabled={loadingMoreTransactions}
                    className="min-h-11 px-5 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-950 dark:hover:bg-slate-850 border border-slate-100 dark:border-slate-800 text-xs font-bold text-slate-600 dark:text-slate-300 transition disabled:opacity-50"
                  >
                    {loadingMoreTransactions ? 'Loading...' : 'Load More Records'}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ----------------- VIEW 3: SAVINGS TARGETS ----------------- */}
        {activeTab === 'goals' && (
          <div className="space-y-6" id="goals-tab-view">
            <Suspense fallback={null}>
              <AdUnit slotId="goals-mobile-banner-top" visibility="mobile" />
            </Suspense>
            <Suspense fallback={null}>
              <SavingsGoals />
            </Suspense>
          </div>
        )}

        {/* ----------------- VIEW 4: ANALYTICS CHARTS ----------------- */}
        {activeTab === 'analytics' && (
          <div className="space-y-6" id="analytics-tab-view">
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-5 rounded-3xl" id="analytics-header-card">
              <h3 className="font-heading font-bold text-base text-slate-900 dark:text-white">
                Money Overview
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                See your spending, savings, and goals in simple charts.
              </p>
            </div>
            
            <Suspense fallback={null}>
              <AnalyticsCharts />
            </Suspense>
          </div>
        )}

      </main>

      {/* 5. Record Modal */}
      {modalOpen && (
        <Suspense fallback={null}>
          <TransactionModal
            isOpen={modalOpen}
            onClose={() => {
              setModalOpen(false);
              setEditTx(null);
            }}
            editTransaction={editTx}
          />
        </Suspense>
      )}

      <DeleteRecordConfirmationModal
        transaction={deleteTx}
        isDeleting={isDeletingTx}
        error={deleteError}
        onCancel={handleCancelDeleteTx}
        onConfirm={handleConfirmDeleteTx}
      />

      <ConfirmationModal
        isOpen={signOutPromptOpen}
        title="Sign Out?"
        message="You will need to sign in again to access your records."
        confirmLabel={isSigningOut ? 'Signing out...' : 'Sign Out'}
        isBusy={isSigningOut}
        onCancel={() => {
          if (!isSigningOut) setSignOutPromptOpen(false);
        }}
        onConfirm={handleConfirmSignOut}
      />

    </div>
  );
};

function AppConsumer() {
  const { auth, loading, userConfig } = useApp();
  const [currentPath, setCurrentPath] = useState<AppRoute>(getCurrentPath);
  const [selectedTheme, setSelectedTheme] = useState<AppTheme>(() => {
    const storedTheme = typeof window !== 'undefined' ? window.localStorage.getItem('paiseflow-theme') : null;
    return storedTheme === 'dark' || storedTheme === 'gold' || storedTheme === 'light' ? storedTheme : 'light';
  });

  useSeoMetadata(currentPath);

  useEffect(() => {
    const handleRouteChange = () => {
      setCurrentPath(getCurrentPath());
    };

    window.addEventListener('popstate', handleRouteChange);
    return () => {
      window.removeEventListener('popstate', handleRouteChange);
    };
  }, []);

  useEffect(() => {
    if (!userConfig?.theme) return;
    if (userConfig.theme !== selectedTheme) {
      setSelectedTheme(userConfig.theme);
    }
  }, [userConfig?.theme, selectedTheme]);

  useEffect(() => {
    const root = document.documentElement;

    if (selectedTheme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('gold');
    } else if (selectedTheme === 'gold') {
      root.classList.add('gold');
      root.classList.remove('dark');
    } else {
      root.classList.remove('dark');
      root.classList.remove('gold');
    }

    if (typeof window !== 'undefined') {
      window.localStorage.setItem('paiseflow-theme', selectedTheme);
    }

    return () => {
      root.classList.remove('dark', 'gold');
    };
  }, [selectedTheme]);

  if (currentPath === '/privacy-policy') {
    return (
      <Suspense fallback={null}>
        <PrivacyPolicy />
      </Suspense>
    );
  }

  if (currentPath === '/about') {
    return (
      <Suspense fallback={null}>
        <AboutUs />
      </Suspense>
    );
  }

  if (currentPath === '/contact') {
    return (
      <Suspense fallback={null}>
        <ContactUs />
      </Suspense>
    );
  }

  if (currentPath === '/tools') {
    return (
      <Suspense fallback={null}>
        <Tools />
      </Suspense>
    );
  }

  if (calculatorRoutes.includes(currentPath as CalculatorRoute)) {
    const CalculatorPage = calculatorPages[currentPath as CalculatorRoute];
    return (
      <Suspense fallback={null}>
        <CalculatorPage />
      </Suspense>
    );
  }

  // If initial load in progress
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center font-sans gap-4 text-xs tracking-wider uppercase font-bold text-slate-400">
        <div className="w-8 h-8 border-2 border-indigo-900 dark:border-emerald-500 border-t-transparent rounded-full animate-spin" />
        <span>Loading...</span>
      </div>
    );
  }

  // Bind login view if not verified
  if (!auth.user) {
    return (
      <Suspense fallback={null}>
        <AuthPage />
      </Suspense>
    );
  }

  return <DashboardContent />;
}

export default function App() {
  return (
    <AppProvider>
      <AppConsumer />
    </AppProvider>
  );
}
