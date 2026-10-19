import React, { useState } from 'react';
import { css } from '@emotion/react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  EuiBadge,
  EuiButtonIcon,
  EuiFlexGroup,
  EuiFlexItem,
  EuiIcon,
  EuiText,
  EuiToolTip,
  useEuiTheme,
  type UseEuiTheme,
} from '@elastic/eui';
import { FOOTER_NAV, PRIMARY_NAV, type NavItem } from './nav_tree';
import { useChrome } from './chrome_context';

const rowStyles = ({ euiTheme }: UseEuiTheme, collapsed: boolean) => css`
  display: flex;
  align-items: center;
  gap: ${euiTheme.size.s};
  height: 32px;
  padding: 0 ${collapsed ? 0 : euiTheme.size.s};
  justify-content: ${collapsed ? 'center' : 'flex-start'};
  border-radius: ${euiTheme.border.radius.medium};
  color: ${euiTheme.colors.textParagraph};
  text-decoration: none;
  font-size: ${euiTheme.size.m};
  line-height: 1.2;
  width: 100%;
  box-sizing: border-box;
  white-space: nowrap;
  overflow: hidden;
`;

const liveRowStyles = ({ euiTheme }: UseEuiTheme) => css`
  cursor: pointer;
  &:hover {
    background: ${euiTheme.colors.backgroundBaseInteractiveHover};
    text-decoration: none;
  }
  &.active {
    background: ${euiTheme.colors.backgroundLightPrimary};
    color: ${euiTheme.colors.textPrimary};
    font-weight: ${euiTheme.font.weight.medium};
    .euiIcon {
      color: ${euiTheme.colors.textPrimary};
    }
  }
`;

const inertRowStyles = css`
  cursor: default;
  user-select: none;
`;

const RowLabel: React.FC<{ item: NavItem; collapsed: boolean }> = ({ item, collapsed }) => {
  const { euiTheme } = useEuiTheme();
  return (
    <>
      <EuiIcon type={item.icon} size="m" aria-hidden />
      {!collapsed && (
        <>
          <span
            css={css`
              flex: 1;
              overflow: hidden;
              text-overflow: ellipsis;
            `}
          >
            {item.label}
          </span>
          {item.badge && (
            <EuiBadge color="accent" css={css`font-size: 10px; line-height: 14px;`}>
              {item.badge === 'new' ? 'New' : 'Beta'}
            </EuiBadge>
          )}
          {item.renderAs === 'panelOpener' && (
            <EuiIcon type="chevronSingleRight" size="s" color={euiTheme.colors.textSubdued} aria-hidden />
          )}
          {item.renderAs === 'accordion' && (
            <EuiIcon type="chevronSingleDown" size="s" color={euiTheme.colors.textSubdued} aria-hidden />
          )}
        </>
      )}
    </>
  );
};

const NavRow: React.FC<{ item: NavItem; collapsed: boolean }> = ({ item, collapsed }) => {
  const theme = useEuiTheme();
  const base = rowStyles(theme, collapsed);

  const content = item.href ? (
    <NavLink to={item.href} css={[base, liveRowStyles(theme)]} aria-label={item.label} data-test-subj={`nav-${item.id}`}>
      <RowLabel item={item} collapsed={collapsed} />
    </NavLink>
  ) : (
    <div
      css={[base, inertRowStyles]}
      role="menuitem"
      aria-disabled="true"
      aria-label={item.label}
      data-test-subj={`nav-${item.id}`}
    >
      <RowLabel item={item} collapsed={collapsed} />
    </div>
  );

  const tooltip = item.href
    ? collapsed
      ? item.label
      : undefined
    : `${item.label} — not part of this demo`;

  return tooltip ? (
    <EuiToolTip content={tooltip} position="right">
      {content}
    </EuiToolTip>
  ) : (
    content
  );
};

const NavGroup: React.FC<{ items: NavItem[]; collapsed: boolean }> = ({ items, collapsed }) => (
  <EuiFlexGroup direction="column" gutterSize="none" responsive={false} css={css`gap: 2px;`}>
    {items.map((item) => (
      <EuiFlexItem key={item.id} grow={false}>
        <NavRow item={item} collapsed={collapsed} />
      </EuiFlexItem>
    ))}
  </EuiFlexGroup>
);

export const SecuritySideNav: React.FC = () => {
  const { euiTheme } = useEuiTheme();
  const { isNavCollapsed, toggleNav } = useChrome();
  const { pathname } = useLocation();
  const [hovered, setHovered] = useState(false);
  const collapsed = isNavCollapsed && !hovered;

  return (
    <nav
      aria-label="Security"
      data-test-subj="securitySideNav"
      data-active-path={pathname}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      css={css`
        display: flex;
        flex-direction: column;
        height: 100%;
        box-sizing: border-box;
        padding: ${euiTheme.size.s};
        width: ${collapsed ? 56 : 248}px;
        position: relative;
        z-index: 900;
        background: ${euiTheme.colors.body};
        ${isNavCollapsed && hovered ? `box-shadow: ${euiTheme.levels.flyout ? '4px 0 12px rgba(0,0,0,0.08)' : 'none'};` : ''}
        transition: width ${euiTheme.animation.fast} ease;
      `}
    >
      {!collapsed && (
        <EuiText
          size="xs"
          color="subdued"
          css={css`
            padding: ${euiTheme.size.xs} ${euiTheme.size.s} ${euiTheme.size.s};
            font-weight: ${euiTheme.font.weight.semiBold};
            text-transform: uppercase;
            letter-spacing: 0.04em;
            font-size: 10px;
          `}
        >
          Security
        </EuiText>
      )}
      <div
        css={css`
          flex: 1;
          min-height: 0;
          overflow-y: auto;
          overflow-x: hidden;
          scrollbar-width: thin;
        `}
      >
        <NavGroup items={PRIMARY_NAV} collapsed={collapsed} />
      </div>
      <div
        css={css`
          border-top: ${euiTheme.border.thin};
          padding-top: ${euiTheme.size.s};
          margin-top: ${euiTheme.size.s};
        `}
      >
        <NavGroup items={FOOTER_NAV} collapsed={collapsed} />
        <div css={css`display: flex; justify-content: ${collapsed ? 'center' : 'flex-end'}; padding-top: ${euiTheme.size.xs};`}>
          <EuiToolTip content={isNavCollapsed ? 'Expand side navigation' : 'Collapse side navigation'} position="right">
            <EuiButtonIcon
              iconType={isNavCollapsed ? 'transitionLeftOut' : 'transitionLeftIn'}
              color="text"
              size="s"
              aria-label={isNavCollapsed ? 'Expand side navigation' : 'Collapse side navigation'}
              onClick={toggleNav}
            />
          </EuiToolTip>
        </div>
      </div>
    </nav>
  );
};
