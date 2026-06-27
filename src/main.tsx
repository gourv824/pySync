import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// --- Global Error & Extension Noise Shield ---
if (typeof window !== 'undefined') {
  try {
    let currentFetch = window.fetch;
    Object.defineProperty(window, 'fetch', {
      get: () => currentFetch,
      set: (val) => {
        currentFetch = val;
      },
      configurable: true,
      enumerable: true
    });
  } catch (e) {
    // Safely ignore if non-configurable
  }

  const ignoreErrors = [
    'could not establish connection',
    'receiving end does not exist',
    'allowed',
    'allow',
    'only a getter',
    'cannot set property fetch'
  ];

  const shouldIgnore = (message: any): boolean => {
    if (!message) return false;
    const str = String(message).toLowerCase();
    return ignoreErrors.some(sub => str.includes(sub));
  };

  // Intercept standard window errors
  const originalOnError = window.onerror;
  window.onerror = function (message, source, lineno, colno, error) {
    const errorStr = String(message || '');
    const errorMsg = error?.message || '';
    if (shouldIgnore(errorStr) || shouldIgnore(errorMsg)) {
      return true; // prevent default firing
    }
    if (originalOnError) {
      return (originalOnError as any).apply(this, arguments as any);
    }
    return false;
  };

  // Capturing-phase error listener to catch injected script/extension errors early
  window.addEventListener('error', (event) => {
    const errorMsg = event.message || '';
    const errorObjMsg = event.error?.message || '';
    if (shouldIgnore(errorMsg) || shouldIgnore(errorObjMsg)) {
      event.stopImmediatePropagation();
      event.preventDefault();
    }
  }, { capture: true });

  // Intercept unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason;
    const reasonStr = reason ? String(reason.message || reason) : '';
    if (shouldIgnore(reasonStr)) {
      event.stopImmediatePropagation();
      event.preventDefault();
    }
  }, { capture: true });

  // Intercept standard console.error/warn
  const originalConsoleError = console.error;
  console.error = function (...args: any[]) {
    const message = args.map(arg => {
      if (arg instanceof Error) {
        return arg.message + '\n' + arg.stack;
      }
      if (typeof arg === 'object' && arg !== null) {
        try {
          return JSON.stringify(arg);
        } catch (_) {
          return String(arg);
        }
      }
      return String(arg);
    }).join(' ');

    if (shouldIgnore(message)) {
      return; // Do absolutely nothing for matched extension/loop noise
    }
    originalConsoleError.apply(console, args);
  };
}

// cache buster 1
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
