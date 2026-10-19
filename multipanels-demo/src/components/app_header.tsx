import React from 'react';
import { css } from '@emotion/react';
import { EuiFlexGroup, EuiFlexItem, EuiIcon, EuiLink, EuiTitle, useEuiTheme } from '@elastic/eui';

interface AppHeaderProps {
  title: React.ReactNode;
  /** Right-hand side actions (buttons, menus). */
  actions?: React.ReactNode;
  spacing?: 'compact' | 'largeBleed';
  docLink?: string;
  subtitle?: React.ReactNode;
}

/**
 * Replica of `@kbn/app-header`'s `AppHeaderView` used by Security pages (title row with
 * documentation link and action menu, sticky under the chrome header).
 */
export const AppHeader: React.FC<AppHeaderProps> = ({ title, actions, spacing = 'largeBleed', docLink, subtitle }) => {
  const { euiTheme } = useEuiTheme();
  const vertical = spacing === 'compact' ? euiTheme.size.s : euiTheme.size.m;
  return (
    <div
      data-test-subj="appHeader"
      css={css`
        position: sticky;
        top: 0;
        z-index: 100;
        background: ${euiTheme.colors.body};
        border-bottom: ${euiTheme.border.thin};
        padding: ${vertical} ${euiTheme.size.l};
      `}
    >
      <EuiFlexGroup alignItems="center" justifyContent="spaceBetween" gutterSize="m" responsive={false}>
        <EuiFlexItem grow={false}>
          <EuiFlexGroup alignItems="center" gutterSize="s" responsive={false}>
            <EuiFlexItem grow={false}>
              <EuiTitle size="s">
                <h1 css={css`font-weight: ${euiTheme.font.weight.semiBold};`}>{title}</h1>
              </EuiTitle>
            </EuiFlexItem>
            {docLink && (
              <EuiFlexItem grow={false}>
                <EuiLink href={docLink} target="_blank" external={false} aria-label="Documentation">
                  <EuiIcon type="documentation" size="m" />
                </EuiLink>
              </EuiFlexItem>
            )}
            {subtitle && <EuiFlexItem grow={false}>{subtitle}</EuiFlexItem>}
          </EuiFlexGroup>
        </EuiFlexItem>
        {actions && <EuiFlexItem grow={false}>{actions}</EuiFlexItem>}
      </EuiFlexGroup>
    </div>
  );
};
