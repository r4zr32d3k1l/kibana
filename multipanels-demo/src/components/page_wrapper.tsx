import React from 'react';
import { css } from '@emotion/react';
import { useEuiTheme } from '@elastic/eui';

/** `SecuritySolutionPageWrapper` equivalent: full-height column with the standard page padding. */
export const SecurityPageWrapper: React.FC<{ children: React.ReactNode; noPadding?: boolean; 'data-test-subj'?: string }> = ({
  children,
  noPadding = false,
  ...rest
}) => {
  const { euiTheme } = useEuiTheme();
  return (
    <div
      {...rest}
      css={css`
        display: flex;
        flex-direction: column;
        flex: 1 1 auto;
        min-height: 0;
        padding: ${noPadding ? 0 : `0 ${euiTheme.size.l} ${euiTheme.size.l}`};
      `}
    >
      {children}
    </div>
  );
};
