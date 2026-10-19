import React, { useState } from 'react';
import { css } from '@emotion/react';
import {
  EuiAvatar,
  EuiButtonIcon,
  EuiContextMenuItem,
  EuiContextMenuPanel,
  EuiFieldSearch,
  EuiFlexGroup,
  EuiFlexItem,
  EuiHeader,
  EuiHeaderBreadcrumbs,
  EuiHeaderLogo,
  EuiHeaderSection,
  EuiHeaderSectionItem,
  EuiHeaderSectionItemButton,
  EuiIcon,
  EuiPopover,
  EuiText,
  EuiToolTip,
  useEuiTheme,
} from '@elastic/eui';
import { useChrome } from './chrome_context';
import { CURRENT_USER } from '../data/alerts';
import { HEADER_HEIGHT } from './constants';

const DemoOnly: React.FC<{ children: React.ReactElement; label: string }> = ({ children, label }) => (
  <EuiToolTip content={`${label} — not part of this demo`} position="bottom">
    {children}
  </EuiToolTip>
);

export const ServerlessHeader: React.FC = () => {
  const { euiTheme } = useEuiTheme();
  const { breadcrumbs, toggleNav } = useChrome();
  const [isUserMenuOpen, setUserMenuOpen] = useState(false);

  const crumbs = [
    {
      text: (
        <EuiFlexGroup gutterSize="xs" alignItems="center" responsive={false}>
          <EuiFlexItem grow={false}>
            <EuiIcon type="logoSecurity" size="m" />
          </EuiFlexItem>
          <EuiFlexItem grow={false}>Security</EuiFlexItem>
        </EuiFlexGroup>
      ),
      href: '#/alerts',
      'data-test-subj': 'breadcrumb-security',
    },
    ...breadcrumbs.map((crumb, index) => ({
      text: crumb.text,
      ...(crumb.href && index < breadcrumbs.length - 1 ? { href: `#${crumb.href}` } : {}),
    })),
  ];

  return (
    <EuiHeader
      position="static"
      css={css`
        height: ${HEADER_HEIGHT}px;
        box-shadow: none;
        border-bottom: ${euiTheme.border.thin};
        background: ${euiTheme.colors.body};
      `}
    >
      <EuiHeaderSection grow={false}>
        <EuiHeaderSectionItem>
          <EuiButtonIcon
            iconType="menu"
            color="text"
            aria-label="Toggle primary navigation"
            onClick={toggleNav}
            css={css`margin-inline: ${euiTheme.size.xs};`}
          />
        </EuiHeaderSectionItem>
        <EuiHeaderSectionItem>
          <EuiHeaderLogo href="#/alerts" iconTitle="Elastic" aria-label="Elastic home" />
        </EuiHeaderSectionItem>
        <EuiHeaderSectionItem>
          <EuiHeaderBreadcrumbs
            aria-label="Breadcrumbs"
            breadcrumbs={crumbs}
            max={4}
            truncate={false}
            css={css`margin-left: ${euiTheme.size.s};`}
          />
        </EuiHeaderSectionItem>
      </EuiHeaderSection>

      <EuiHeaderSection
        grow
        css={css`
          justify-content: center;
          align-items: center;
          padding-inline: ${euiTheme.size.l};
        `}
      >
        <EuiHeaderSectionItem css={css`width: min(100%, 560px);`}>
          <EuiFieldSearch
            fullWidth
            compressed
            placeholder="Find apps, content, and more. Ex: Discover"
            aria-label="Global search"
            append={
              <EuiText size="xs" color="subdued" css={css`padding-inline: ${euiTheme.size.xs}; white-space: nowrap;`}>
                ⌘/
              </EuiText>
            }
            onChange={() => {}}
          />
        </EuiHeaderSectionItem>
      </EuiHeaderSection>

      <EuiHeaderSection side="right" grow={false}>
        <EuiHeaderSectionItem>
          <DemoOnly label="Elastic AI Agent">
            <EuiHeaderSectionItemButton aria-label="Open Elastic AI Agent">
              <EuiIcon type="productAgent" size="m" />
            </EuiHeaderSectionItemButton>
          </DemoOnly>
        </EuiHeaderSectionItem>
        <EuiHeaderSectionItem>
          <DemoOnly label="Help">
            <EuiHeaderSectionItemButton aria-label="Help menu">
              <EuiIcon type="help" size="m" />
            </EuiHeaderSectionItemButton>
          </DemoOnly>
        </EuiHeaderSectionItem>
        <EuiHeaderSectionItem>
          <DemoOnly label="Newsfeed">
            <EuiHeaderSectionItemButton aria-label="Newsfeed" notification={2}>
              <EuiIcon type="megaphone" size="m" />
            </EuiHeaderSectionItemButton>
          </DemoOnly>
        </EuiHeaderSectionItem>
        <EuiHeaderSectionItem>
          <EuiPopover
            isOpen={isUserMenuOpen}
            closePopover={() => setUserMenuOpen(false)}
            anchorPosition="downRight"
            panelPaddingSize="none"
            button={
              <EuiHeaderSectionItemButton
                aria-label="Account menu"
                onClick={() => setUserMenuOpen((v) => !v)}
              >
                <EuiAvatar name={CURRENT_USER.fullName} size="s" color={CURRENT_USER.color} initials={CURRENT_USER.initials} />
              </EuiHeaderSectionItemButton>
            }
          >
            <div css={css`padding: ${euiTheme.size.m}; width: 260px;`}>
              <EuiFlexGroup gutterSize="s" alignItems="center" responsive={false}>
                <EuiFlexItem grow={false}>
                  <EuiAvatar name={CURRENT_USER.fullName} size="m" color={CURRENT_USER.color} initials={CURRENT_USER.initials} />
                </EuiFlexItem>
                <EuiFlexItem>
                  <EuiText size="s">
                    <strong>{CURRENT_USER.fullName}</strong>
                  </EuiText>
                  <EuiText size="xs" color="subdued">
                    {CURRENT_USER.email}
                  </EuiText>
                </EuiFlexItem>
              </EuiFlexGroup>
            </div>
            <EuiContextMenuPanel
              items={[
                <EuiContextMenuItem key="profile" icon="user" disabled>
                  Edit profile
                </EuiContextMenuItem>,
                <EuiContextMenuItem key="theme" icon="moon" disabled>
                  Appearance
                </EuiContextMenuItem>,
                <EuiContextMenuItem key="org" icon="spaces" disabled>
                  Manage organization
                </EuiContextMenuItem>,
                <EuiContextMenuItem key="logout" icon="logOut" disabled>
                  Log out
                </EuiContextMenuItem>,
              ]}
            />
          </EuiPopover>
        </EuiHeaderSectionItem>
      </EuiHeaderSection>
    </EuiHeader>
  );
};
