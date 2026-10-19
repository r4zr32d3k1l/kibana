import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { KibanaChrome } from './chrome/kibana_chrome';
import { AlertsPage } from './pages/alerts/alerts_page';
import { AlertZeroPage } from './pages/alertzero/alertzero_page';
import { AgentBuilderApp } from './pages/agents/agent_builder_app';
import { AgentBuilderStateProvider } from './pages/agents/agent_builder_state';
import { FlyoutProvider } from './flyout/flyout_context';
import { ExpandableFlyout } from './flyout/expandable_flyout';
import { AlertsStateProvider } from './state/alerts_state';
import { ToastsProvider } from './components/toasts';

export const App: React.FC = () => (
  <ToastsProvider>
    <AlertsStateProvider>
      <AgentBuilderStateProvider>
        <FlyoutProvider>
          <KibanaChrome>
            <Routes>
              <Route path="/" element={<Navigate to="/alerts" replace />} />
              <Route path="/alerts" element={<AlertsPage />} />
              <Route path="/alertzero" element={<AlertZeroPage />} />
              <Route path="/agents/*" element={<AgentBuilderApp />} />
              <Route path="*" element={<Navigate to="/alerts" replace />} />
            </Routes>
          </KibanaChrome>
          <ExpandableFlyout />
        </FlyoutProvider>
      </AgentBuilderStateProvider>
    </AlertsStateProvider>
  </ToastsProvider>
);
