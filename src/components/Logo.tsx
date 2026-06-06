/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

interface LogoProps {
  className?: string;
  size?: number;
}

const LOGO_SRC = '/paiseflow-logo.png';
const ICON_SRC = '/paiseflow-icon.png';

export const LogoIcon: React.FC<LogoProps> = ({ className = '', size = 32 }) => {
  return (
    <img
      src={LOGO_SRC}
      alt="PaiseFlow logo"
      width={Math.round(size * 1.35)}
      height={size}
      className={`block object-contain ${className}`}
      style={{ width: Math.round(size * 1.35), height: size }}
    />
  );
};

export const MainLogo: React.FC<LogoProps & { showSubtitle?: boolean }> = ({
  className = '',
  size = 36,
  showSubtitle = true,
}) => {
  return (
    <div className={`flex items-center gap-2.5 ${className}`} id="spendwise-main-logo">
      <LogoIcon size={size} />
      <div className="flex flex-col">
        <span className="font-heading font-bold text-xl tracking-tight text-slate-800 dark:text-white">
          Paise<span className="text-emerald-600 dark:text-emerald-400">Flow</span>
        </span>
        {showSubtitle && (
          <span className="font-mono text-[9px] uppercase tracking-widest text-slate-500 dark:text-slate-400">
            SPENDWISE INDIA
          </span>
        )}
      </div>
    </div>
  );
};

export const CompactLogo: React.FC<LogoProps> = ({ className = '', size = 48 }) => {
  return (
    <div
      className={`flex items-center justify-center p-2 rounded-2xl bg-indigo-950 text-white dark:bg-white/5 border border-slate-201 dark:border-slate-800/80 ${className}`}
      id="spendwise-compact-logo"
    >
      <img
        src={ICON_SRC}
        alt="PaiseFlow logo"
        width={size}
        height={size}
        className="block object-contain"
        style={{ width: size, height: size }}
      />
    </div>
  );
};

export const FaviconVersion: React.FC<LogoProps> = ({ className = '', size = 256 }) => {
  return (
    <div
      className={`relative rounded-[25%] bg-indigo-950 flex items-center justify-center shadow-xl border border-white/10 overflow-hidden ${className}`}
      style={{ width: size, height: size }}
      id="spendwise-favicon"
    >
      <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/20 to-indigo-500/20 opacity-40 rounded-[25%]" />
      <img
        src={ICON_SRC}
        alt="PaiseFlow logo"
        width={size * 0.72}
        height={size * 0.72}
        className="relative z-10 block object-contain"
      />
    </div>
  );
};
