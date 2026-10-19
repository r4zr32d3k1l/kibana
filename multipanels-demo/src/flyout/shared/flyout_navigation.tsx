import React, { useState } from 'react';
import { css } from '@emotion/react';
import {
  EuiButtonEmpty,
  EuiButtonIcon,
  EuiContextMenuItem,
  EuiContextMenuPanel,
  EuiFlexGroup,
  EuiFlexItem,
  EuiPopover,
  EuiPopoverTitle,
  EuiText,
  EuiToolTip,
  useEuiTheme,
} from '@elastic/eui';
import { useFlyoutApi } from '../flyout_context';
import { useAlertsState } from '../../state/alerts_state';
import { SeverityFilledBadge } from '../../components/formatters';

interface FlyoutNavigationProps {
  /** When false the expand/collapse button is hidden (used by preview panels). */
  showExpand?: boolean;
  /** Extra actions rendered left of the close button. */
  actions?: React.ReactNode;
  onClose?: () => void;
}

/**
 * Top row of a flyout panel: "Expand details" / "Collapse details", history, share and close.
 * Mirrors `FlyoutNavigation` from the Security Solution flyout shared components.
 */
export const FlyoutNavigation: React.FC<FlyoutNavigationProps> = ({ showExpand = true, actions, onClose }) => {
  const { euiTheme } = useEuiTheme();
  const { state, isExpanded, toggleLeftPanel, goToHistory, closeFlyout } = useFlyoutApi();
  const { getAlert } = useAlertsState();
  const [historyOpen, setHistoryOpen] = useState(false);

  const history = state.history.slice().reverse();

  return (
    <EuiFlexGroup
      justifyContent="spaceBetween"
      alignItems="center"
      gutterSize="none"
      responsive={false}
      css={css`
        padding: ${euiTheme.size.s} ${euiTheme.size.m} 0 ${euiTheme.size.s};
        min-height: 40px;
      `}
    >
      <EuiFlexItem grow={false}>
        {showExpand && (
          <EuiButtonEmpty
            size="s"
            iconSide="left"
            iconType={isExpanded ? 'chevronLimitRight' : 'chevronLimitLeft'}
            onClick={toggleLeftPanel}
            data-test-subj={isExpanded ? 'securitySolutionFlyoutNavigationCollapseDetailButton' : 'securitySolutionFlyoutNavigationExpandDetailButton'}
          >
            {isExpanded ? 'Collapse details' : 'Expand details'}
          </EuiButtonEmpty>
        )}
      </EuiFlexItem>
      <EuiFlexItem grow={false}>
        <EuiFlexGroup gutterSize="xs" alignItems="center" responsive={false}>
          {actions && <EuiFlexItem grow={false}>{actions}</EuiFlexItem>}
          {history.length > 1 && (
            <EuiFlexItem grow={false}>
              <EuiPopover
                button={
                  <EuiToolTip content="Flyout history">
                    <EuiButtonIcon
                      iconType="clockCounter"
                      aria-label="Flyout history"
                      color="text"
                      onClick={() => setHistoryOpen((open) => !open)}
                    />
                  </EuiToolTip>
                }
                isOpen={historyOpen}
                closePopover={() => setHistoryOpen(false)}
                panelPaddingSize="none"
                anchorPosition="downRight"
              >
                <EuiPopoverTitle paddingSize="s">Flyout history</EuiPopoverTitle>
                <EuiContextMenuPanel
                  items={history.map((entry) => {
                    const alert = getAlert(entry.alertId);
                    const index = state.history.findIndex((h) => h.alertId === entry.alertId);
                    const isCurrent = state.right?.alertId === entry.alertId;
                    return (
                      <EuiContextMenuItem
                        key={entry.alertId}
                        icon={isCurrent ? 'check' : 'empty'}
                        onClick={() => {
                          goToHistory(index);
                          setHistoryOpen(false);
                        }}
                        css={css`
                          max-width: 420px;
                        `}
                      >
                        <EuiFlexGroup gutterSize="s" alignItems="center" responsive={false}>
                          {alert && (
                            <EuiFlexItem grow={false}>
                              <SeverityFilledBadge severity={alert.severity} />
                            </EuiFlexItem>
                          )}
                          <EuiFlexItem>
                            <EuiText size="s" className="eui-textTruncate">
                              {alert?.rule.name ?? entry.alertId}
                            </EuiText>
                          </EuiFlexItem>
                        </EuiFlexGroup>
                      </EuiContextMenuItem>
                    );
                  })}
                />
              </EuiPopover>
            </EuiFlexItem>
          )}
          <EuiFlexItem grow={false}>
            <EuiToolTip content="Share alert">
              <EuiButtonIcon iconType="share" aria-label="Share alert" color="text" />
            </EuiToolTip>
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiButtonIcon
              iconType="cross"
              aria-label="Close"
              color="text"
              onClick={onClose ?? closeFlyout}
              data-test-subj="euiFlyoutCloseButton"
            />
          </EuiFlexItem>
        </EuiFlexGroup>
      </EuiFlexItem>
    </EuiFlexGroup>
  );
};
