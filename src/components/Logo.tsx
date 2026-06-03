/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

interface LogoProps {
  className?: string;
  size?: number;
}

/**
 * 4. SVG Version / Compact Logo
 * Upward arrow + Wallet + Rupee ₹ integrated elegantly
 */
export const LogoIcon: React.FC<LogoProps> = ({ className = '', size = 32 }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 512 512"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`text-emerald-500 dark:text-emerald-400 ${className}`}
      id="rupeeflow-logo-svg"
    >
      {/* Background Wallet / Shield Shape */}
      <rect
        x="64"
        y="128"
        width="384"
        height="288"
        rx="48"
        className="fill-indigo-900/10 dark:fill-white/5 stroke-indigo-900 dark:stroke-white"
        strokeWidth="24"
      />
      
      {/* Wallet flap */}
      <path
        d="M288 208H448V336H288C252.654 336 224 307.346 224 272C224 236.654 252.654 208 288 208Z"
        className="fill-indigo-600 dark:fill-indigo-500 stroke-indigo-900 dark:stroke-white"
        strokeWidth="24"
        strokeLinejoin="round"
      />
      
      {/* Wallet lock/button */}
      <circle
        cx="336"
        cy="272"
        r="24"
        className="fill-emerald-400 dark:fill-emerald-400 stroke-indigo-900 dark:stroke-white"
        strokeWidth="16"
      />

      {/* Upward Growth Arrow exploding from the wallet */}
      <path
        d="M280 120 L380 120 L380 220"
        stroke="currentColor"
        strokeWidth="32"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M120 380 L220 280 L290 320 L370 130"
        stroke="currentColor"
        strokeWidth="32"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Rupee Symbol ₹ Integrated Elegantly on the wallet body */}
      <g className="text-indigo-900 dark:text-emerald-300" transform="translate(110, 200) scale(1.4)">
        {/* Horizontal bars of ₹ */}
        <path
          d="M10 10 H40"
          stroke="currentColor"
          strokeWidth="6"
          strokeLinecap="round"
        />
        <path
          d="M10 20 H35"
          stroke="currentColor"
          strokeWidth="6"
          strokeLinecap="round"
        />
        {/* R shape */}
        <path
          d="M18 10 C35 10 35 28 18 28"
          stroke="currentColor"
          strokeWidth="6"
          strokeLinecap="round"
        />
        {/* Stem of ₹ */}
        <path
          d="M18 10 V48"
          stroke="currentColor"
          strokeWidth="6"
          strokeLinecap="round"
        />
        {/* Slanted leg of ₹ */}
        <path
          d="M18 28 L38 48"
          stroke="currentColor"
          strokeWidth="6"
          strokeLinecap="round"
        />
      </g>
    </svg>
  );
};

/**
 * 1. Main Logo
 * Horizontal full brand version containing standard text "SpendWise India"
 */
export const MainLogo: React.FC<LogoProps & { showSubtitle?: boolean }> = ({
  className = '',
  size = 36,
  showSubtitle = true,
}) => {
  return (
    <div className={`flex items-center gap-3 ${className}`} id="spendwise-main-logo">
      <LogoIcon size={size} />
      <div className="flex flex-col">
        <span className="font-heading font-bold text-xl tracking-tight text-slate-800 dark:text-white">
          Rupee<span className="text-emerald-600 dark:text-emerald-400">Flow</span>
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

/**
 * 2. Compact Logo
 * Compact circular representation of SpendWise India icon
 */
export const CompactLogo: React.FC<LogoProps> = ({ className = '', size = 48 }) => {
  return (
    <div
      className={`flex items-center justify-center p-2 rounded-2xl bg-indigo-950 text-white dark:bg-white/5 border border-slate-201 dark:border-slate-800/80 ${className}`}
      id="spendwise-compact-logo"
    >
      <LogoIcon size={size} />
    </div>
  );
};

/**
 * 3. Favicon Version (512x512 Source style)
 * Clean dark backdrop, centered floating wallet with rupee symbol & growth line
 */
export const FaviconVersion: React.FC<LogoProps> = ({ className = '', size = 256 }) => {
  return (
    <div
      className={`relative rounded-[25%] bg-indigo-950 flex items-center justify-center shadow-xl border border-white/10 overflow-hidden ${className}`}
      style={{ width: size, height: size }}
      id="spendwise-favicon"
    >
      {/* Decorative bg light glow */}
      <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/20 to-indigo-500/20 opacity-40 rounded-[25%]" />
      
      {/* Actual high-res Icon */}
      <LogoIcon size={size * 0.6} className="relative z-10" />
    </div>
  );
};
