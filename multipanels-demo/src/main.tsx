import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import { EuiProvider } from '@elastic/eui';
import { App } from './app';

// HashRouter so the single-file build works when opened from disk (file://) or any static host.
// No React.StrictMode: EUI's `useObserver` (used by EuiAccordion's height ResizeObserver)
// disconnects on effect cleanup and never re-attaches, so StrictMode's simulated
// unmount/remount leaves accordions collapsed at 0px. Kibana does not use StrictMode either.
ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <EuiProvider colorMode="light">
    <HashRouter>
      <App />
    </HashRouter>
  </EuiProvider>
);
