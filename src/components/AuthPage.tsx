/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../context/AppContext.tsx';
import { MainLogo } from './Logo.tsx';
import { motion } from 'motion/react';
import { Mail, Lock, LogIn, UserPlus, Info, CheckCircle } from 'lucide-react';

export const AuthPage: React.FC = () => {
  const { login, loginWithGoogle, signup, resetPassword } = useApp();
  const [view, setView] = useState<'login' | 'signup' | 'forgot'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    if (view === 'signup' && password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      if (view === 'login') {
        await login(email, password);
      } else if (view === 'signup') {
        await signup(email, password);
      } else if (view === 'forgot') {
        await resetPassword(email);
        setSuccessMsg('Password reset email sent.');
      }
    } catch (err: any) {
      const isNotAllowed = err?.code === 'auth/operation-not-allowed' || err?.message?.includes('operation-not-allowed');
      if (isNotAllowed) {
        setError(
          'Email login is turned off. Please turn it on in Firebase, or use Google login.'
        );
      } else {
        setError(err?.message || 'Login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setSuccessMsg(null);
    setLoadingGoogle(true);
    try {
      await loginWithGoogle();
    } catch (err: any) {
      setError(err?.message || 'Google Sign-In failed. Please try again.');
    } finally {
      setLoadingGoogle(false);
    }
  };

  return (
    <div
      className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden font-sans select-none"
      id="spendwise-auth-container"
    >
      {/* Absolute decorative ambient glow blobs */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/10 dark:bg-emerald-500/5 blur-3xl rounded-full" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 bg-indigo-500/10 dark:bg-indigo-300/5 blur-3xl rounded-full" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="flex justify-center">
          <MainLogo size={48} showSubtitle={true} className="mb-6 transform hover:scale-102 transition duration-300" />
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mt-4 sm:mx-auto sm:w-full sm:max-w-md relative z-10"
        id="auth-card-frame"
      >
        <div className="bg-white dark:bg-slate-900 py-8 px-6 shadow-2xl rounded-3xl border border-slate-100 dark:border-slate-800/80 sm:px-10">
          
          <div className="mb-6 text-center">
            <h2 className="text-2xl font-bold font-heading text-slate-900 dark:text-white">
              {view === 'login' && 'Welcome back'}
              {view === 'signup' && 'Create your account'}
              {view === 'forgot' && 'Reset your password'}
            </h2>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 font-sans">
              {view === 'login' && 'Track budgets, expenses & savings in seconds.'}
              {view === 'signup' && 'Secure your financial flow on SpendWise India.'}
              {view === 'forgot' && "Enter your email and we'll send a reset link."}
            </p>
          </div>

          {error && (
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 text-xs flex items-center gap-2"
              id="auth-error-banner"
            >
              <Info className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </motion.div>
          )}

          {successMsg && (
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="mb-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2"
              id="auth-success-banner"
            >
              <CheckCircle className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-widest mb-1.5ClassName">
                Email Address
              </label>
              <div className="relative rounded-xl shadow-sm text-slate-400 focus-within:text-indigo-600 dark:focus-within:text-emerald-400">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-950 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600/30 dark:focus:ring-emerald-500/30 focus:border-indigo-600 dark:focus:border-emerald-500 text-sm transition"
                  placeholder="name@domain.com"
                />
              </div>
            </div>

            {view !== 'forgot' && (
              <div>
                <label htmlFor="password" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-widest mb-1.5">
                  Password
                </label>
                <div className="relative rounded-xl shadow-sm text-slate-400 focus-within:text-indigo-600 dark:focus-within:text-emerald-400">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Lock className="h-4 w-4" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-950 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600/30 dark:focus:ring-emerald-500/30 focus:border-indigo-600 dark:focus:border-emerald-500 text-sm transition"
                    placeholder="••••••••"
                  />
                </div>
              </div>
            )}

            {view === 'signup' && (
              <div>
                <label htmlFor="confirm-password" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-widest mb-1.5">
                  Confirm Password
                </label>
                <div className="relative rounded-xl shadow-sm text-slate-400 focus-within:text-indigo-600 dark:focus-within:text-emerald-400">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Lock className="h-4 w-4" />
                  </div>
                  <input
                    id="confirm-password"
                    name="confirm-password"
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="block w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-950 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600/30 dark:focus:ring-emerald-500/30 focus:border-indigo-600 dark:focus:border-emerald-500 text-sm transition"
                    placeholder="••••••••"
                  />
                </div>
              </div>
            )}

            {view === 'login' && (
              <div className="flex items-center justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setView('forgot');
                    setError(null);
                    setSuccessMsg(null);
                  }}
                  className="text-xs font-medium text-indigo-600 dark:text-emerald-400 hover:underline transition"
                >
                  Forgot password?
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-lg text-sm font-semibold text-white bg-indigo-900 hover:bg-indigo-950 dark:bg-emerald-600 dark:hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-emerald-400 transition cursor-pointer disabled:opacity-50"
              id="auth-submit-btn"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  {view === 'login' && (
                    <>
                      <LogIn className="w-4 h-4" />
                      <span>Sign In</span>
                    </>
                  )}
                  {view === 'signup' && (
                    <>
                      <UserPlus className="w-4 h-4" />
                      <span>Sign Up</span>
                    </>
                  )}
                  {view === 'forgot' && <span>Send Recovery Email</span>}
                </>
              )}
            </button>
          </form>

          {view !== 'forgot' && (
            <>
              <div className="relative my-5" id="auth-google-divider">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-100 dark:border-slate-800" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white dark:bg-slate-900 px-3 text-slate-400 dark:text-slate-500 font-medium">
                    Or use
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading || loadingGoogle}
                className="w-full flex justify-center items-center gap-2 py-3 px-4 rounded-xl border border-slate-200 dark:border-slate-800/80 bg-white hover:bg-slate-50 dark:bg-slate-950 dark:hover:bg-slate-900 text-sm font-semibold text-slate-700 dark:text-slate-300 transition cursor-pointer disabled:opacity-50"
                id="auth-google-btn"
              >
                {loadingGoogle ? (
                  <div className="w-5 h-5 border-2 border-indigo-600 dark:border-emerald-500 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-0.5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.84z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
                    </svg>
                    <span>Sign in with Google</span>
                  </>
                )}
              </button>
            </>
          )}

          <div className="mt-6 flex flex-col items-center justify-center gap-4 text-xs">
            {view === 'login' && (
              <div className="text-slate-500 dark:text-slate-400">
                New to SpendWise India?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setView('signup');
                    setError(null);
                    setSuccessMsg(null);
                  }}
                  className="font-semibold text-indigo-600 dark:text-emerald-400 hover:underline inline-block ml-1"
                >
                  Create an account
                </button>
              </div>
            )}

            {view === 'signup' && (
              <div className="text-slate-500 dark:text-slate-400">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setView('login');
                    setError(null);
                    setSuccessMsg(null);
                  }}
                  className="font-semibold text-indigo-600 dark:text-emerald-400 hover:underline inline-block ml-1"
                >
                  Sign in instead
                </button>
              </div>
            )}

            {view === 'forgot' && (
              <button
                type="button"
                onClick={() => {
                  setView('login');
                  setError(null);
                  setSuccessMsg(null);
                }}
                className="font-semibold text-indigo-600 dark:text-emerald-400 hover:underline"
              >
                Back to Sign In
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};
