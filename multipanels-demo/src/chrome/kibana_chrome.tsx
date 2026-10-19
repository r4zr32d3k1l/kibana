import React from 'react';
import { css } from '@emotion/react';
import { useEuiTheme } from '@elastic/eui';
import { ChromeProvider, useChrome } from './chrome_context';
import { ServerlessHeader } from './serverless_header';
import { SecuritySideNav } from './side_nav';
import { HEADER_HEIGHT } from './constants';


const ChromeLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { euiTheme } = useEuiTheme();
  const { isNavCollapsed } = useChrome();

  return (
    <div
      css={css`
        display: grid;
        grid-template-rows: ${HEADER_HEIGHT}px 1fr;
        grid-template-columns: ${isNavCollapsed ? 56 : 248}px 1fr;
        grid-template-areas:
          'header header'
          'nav app';
        height: 100vh;
        width: 100vw;
        overflow: hidden;
        background: ${euiTheme.colors.body};
        transition: grid-template-columns ${euiTheme.animation.fast} ease;
      `}
    >
      <div css={css`grid-area: header; z-index: 1000;`}>
        <ServerlessHeader />
      </div>
      <div
        css={css`
          grid-area: nav;
          min-height: 0;
          border-right: ${euiTheme.border.thin};
          background: ${euiTheme.colors.body};
        `}
      >
        <SecuritySideNav />
      </div>
      <main
        id="app-content"
        css={css`
          grid-area: app;
          min-height: 0;
          min-width: 0;
          overflow: auto;
          display: flex;
          flex-direction: column;
          background: ${euiTheme.colors.backgroundBasePlain};
          /* The real chrome exposes this so app layouts can size against the content viewport. */
          --kbn-application--content-height: calc(100vh - ${HEADER_HEIGHT}px);
        `}
      >
        {children}
      </main>
    </div>
  );
};

export const KibanaChrome: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ChromeProvider>
    <ChromeLayout>{children}</ChromeLayout>
  </ChromeProvider>
);
