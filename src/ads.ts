export type AdSlotId =
  | 'dashboard-desktop-banner'
  | 'dashboard-mobile-banner-top'
  | 'dashboard-desktop-rectangle'
  | 'dashboard-mobile-banner-after-transactions'
  | 'goals-mobile-banner-top';

export interface AdsterraIframeSlotConfig {
  id: AdSlotId;
  kind: 'adsterra-iframe';
  key: string;
  width: number;
  height: number;
  scriptSrc: string;
}

export type AdSlotConfig = AdsterraIframeSlotConfig;

const HIGH_PERFORMANCE_FORMAT_BASE = 'https://www.highperformanceformat.com';

export const AD_SLOTS: Record<AdSlotId, AdSlotConfig> = {
  'dashboard-desktop-banner': {
    id: 'dashboard-desktop-banner',
    kind: 'adsterra-iframe',
    key: 'REPLACE_WITH_728x90_ADSTERRA_KEY',
    width: 728,
    height: 90,
    scriptSrc: `${HIGH_PERFORMANCE_FORMAT_BASE}/REPLACE_WITH_728x90_ADSTERRA_KEY/invoke.js`,
  },
  'dashboard-mobile-banner-top': {
    id: 'dashboard-mobile-banner-top',
    kind: 'adsterra-iframe',
    key: 'd89d53cc56e73d31b70475c588eca0f3',
    width: 320,
    height: 50,
    scriptSrc: `${HIGH_PERFORMANCE_FORMAT_BASE}/d89d53cc56e73d31b70475c588eca0f3/invoke.js`,
  },
  'dashboard-desktop-rectangle': {
    id: 'dashboard-desktop-rectangle',
    kind: 'adsterra-iframe',
    key: 'd2b84cb53aefa11599a25c3c26bbaa1a',
    width: 300,
    height: 250,
    scriptSrc: `${HIGH_PERFORMANCE_FORMAT_BASE}/d2b84cb53aefa11599a25c3c26bbaa1a/invoke.js`,
  },
  'dashboard-mobile-banner-after-transactions': {
    id: 'dashboard-mobile-banner-after-transactions',
    kind: 'adsterra-iframe',
    key: 'd89d53cc56e73d31b70475c588eca0f3',
    width: 320,
    height: 50,
    scriptSrc: `${HIGH_PERFORMANCE_FORMAT_BASE}/d89d53cc56e73d31b70475c588eca0f3/invoke.js`,
  },
  'goals-mobile-banner-top': {
    id: 'goals-mobile-banner-top',
    kind: 'adsterra-iframe',
    key: 'd89d53cc56e73d31b70475c588eca0f3',
    width: 320,
    height: 50,
    scriptSrc: `${HIGH_PERFORMANCE_FORMAT_BASE}/d89d53cc56e73d31b70475c588eca0f3/invoke.js`,
  },
};
