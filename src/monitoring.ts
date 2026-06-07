type ErrorEventPayload = {
  type: 'error' | 'unhandledrejection';
  message: string;
  stack?: string;
  href: string;
  timestamp: string;
};

const reportError = (payload: ErrorEventPayload) => {
  const isDev = Boolean((import.meta as unknown as { env?: { DEV?: boolean } }).env?.DEV);

  if (isDev) {
    console.error('[PaiseFlow monitoring]', payload);
    return;
  }

  // Replace this with Sentry, Firebase Crashlytics web logging, or a small first-party endpoint.
  console.error('[PaiseFlow production error]', payload);
};

const getErrorPayload = (type: ErrorEventPayload['type'], error: unknown): ErrorEventPayload => {
  const errorObject = error instanceof Error ? error : null;
  return {
    type,
    message: errorObject?.message || String(error || 'Unknown error'),
    stack: errorObject?.stack,
    href: window.location.href,
    timestamp: new Date().toISOString(),
  };
};

export const installProductionErrorMonitoring = () => {
  window.addEventListener('error', (event) => {
    reportError(getErrorPayload('error', event.error || event.message));
  });

  window.addEventListener('unhandledrejection', (event) => {
    reportError(getErrorPayload('unhandledrejection', event.reason));
  });
};
