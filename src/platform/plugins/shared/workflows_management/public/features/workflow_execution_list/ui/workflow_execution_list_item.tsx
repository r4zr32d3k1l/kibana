/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import type { EuiThemeComputed, UseEuiTheme } from '@elastic/eui';
import {
  EuiBadge,
  EuiFlexGroup,
  EuiFlexItem,
  EuiIcon,
  EuiIconTip,
  EuiPanel,
  EuiText,
  EuiToolTip,
  useEuiTheme,
} from '@elastic/eui';
import { css } from '@emotion/react';
import React, { useMemo } from 'react';
import { useMemoCss } from '@kbn/css-utils/public/use_memo_css';
import { i18n } from '@kbn/i18n';
import { FormattedMessage } from '@kbn/i18n-react';
import { ExecutionStatus } from '@kbn/workflows';
import { formatDuration } from '../../../shared/lib/format_duration';
import { getStatusLabel } from '../../../shared/translations';
import { FormattedRelativeEnhanced } from '../../../shared/ui/formatted_relative_enhanced/formatted_relative_enhanced';
import { getExecutionStatusColors, getExecutionStatusIcon } from '../../../shared/ui/status_badge';
import { useGetFormattedDateTime } from '../../../shared/ui/use_formatted_date';

/**
 * `'rejected'` is a display-only status (not part of the core ExecutionStatus
 * enum) for pre-run rejections like invalid credentials or missing required
 * inputs. It renders with an amber icon/pill.
 */
export type DisplayExecutionStatus = ExecutionStatus | 'rejected';

export const getExecutionTitleColor = (
  euiTheme: EuiThemeComputed,
  status: DisplayExecutionStatus
): string | undefined => {
  if (
    status === ExecutionStatus.FAILED ||
    status === ExecutionStatus.CANCELLED ||
    status === ExecutionStatus.TIMED_OUT
  ) {
    return getExecutionStatusColors(euiTheme, status).color;
  }
};

/** Icon + label + pill colors for a display status (handles the extra 'rejected'). */
const getDisplayStatusIcon = (euiTheme: EuiThemeComputed, status: DisplayExecutionStatus) => {
  if (status === 'rejected') {
    return <EuiIcon type="errorFill" color={euiTheme.colors.warning} aria-hidden={true} />;
  }
  return getExecutionStatusIcon(euiTheme, status);
};

const getDisplayStatusLabel = (status: DisplayExecutionStatus): string => {
  if (status === 'rejected') {
    return i18n.translate('workflows.workflowExecutionListItem.rejectedStatus', {
      defaultMessage: 'Rejected',
    });
  }
  return getStatusLabel(status);
};

interface WorkflowExecutionListItemProps {
  status: DisplayExecutionStatus;
  isTestRun: boolean;
  startedAt: Date | null;
  duration: number | null;
  /** Short reason shown as a pill next to the status (sourced from the execution error). */
  reason?: string;
  executedBy?: string;
  triggeredBy?: string;
  showExecutor?: boolean;
  selected?: boolean;
  onClick?: () => void;
}
export const WorkflowExecutionListItem = React.memo<WorkflowExecutionListItemProps>(
  ({
    status,
    isTestRun,
    startedAt,
    duration,
    reason,
    executedBy,
    showExecutor = false,
    selected,
    onClick,
  }) => {
    const { euiTheme } = useEuiTheme();
    const styles = useMemoCss(componentStyles);
    const getFormattedDate = useGetFormattedDateTime();
    const formattedDate = startedAt ? getFormattedDate(startedAt) : null;
    const formattedDuration = useMemo(() => {
      if (duration) {
        return formatDuration(duration);
      }
      return null;
    }, [duration]);

    const panelCss = useMemo(() => {
      if (selected) {
        return styles.selectedContainer;
      }
      if (onClick) {
        return styles.selectableContainer;
      }
    }, [selected, onClick, styles]);

    return (
      <EuiPanel
        onClick={onClick}
        hasShadow={false}
        paddingSize="m"
        hasBorder
        css={panelCss}
        data-test-subj="workflowExecutionListItem"
      >
        <EuiFlexGroup
          gutterSize="m"
          alignItems="center"
          justifyContent="flexStart"
          responsive={false}
        >
          <EuiFlexItem grow={false}>{getDisplayStatusIcon(euiTheme, status)}</EuiFlexItem>
          <EuiFlexItem>
            <EuiFlexGroup direction="column" gutterSize="xs">
              <EuiFlexItem>
                <EuiFlexGroup gutterSize="s" alignItems="center" responsive={false} wrap={false}>
                  <EuiFlexItem grow={false}>
                    <EuiText
                      size="s"
                      css={{
                        fontWeight: 'bold',
                        color: getExecutionTitleColor(euiTheme, status),
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {getDisplayStatusLabel(status)}
                    </EuiText>
                  </EuiFlexItem>
                  {reason && (
                    <>
                      <EuiFlexItem grow={false}>
                        <EuiText size="xs" color="subdued" aria-hidden={true}>
                          {'·'}
                        </EuiText>
                      </EuiFlexItem>
                      <EuiFlexItem grow={false} css={{ minWidth: 0 }}>
                        <EuiBadge
                          color={status === 'rejected' ? 'warning' : 'danger'}
                          title={reason}
                          css={{ maxWidth: '100%' }}
                        >
                          {reason}
                        </EuiBadge>
                      </EuiFlexItem>
                    </>
                  )}
                </EuiFlexGroup>
              </EuiFlexItem>
              <EuiFlexItem>
                {startedAt ? (
                  <EuiToolTip position="left" content={formattedDate}>
                    <EuiText size="xs" tabIndex={0} color="subdued">
                      <FormattedRelativeEnhanced value={startedAt} />
                    </EuiText>
                  </EuiToolTip>
                ) : (
                  <EuiText size="xs" color="subdued">
                    <FormattedMessage
                      id="workflows.workflowExecutionListItem.notStarted"
                      defaultMessage="Not started"
                    />
                  </EuiText>
                )}
              </EuiFlexItem>
            </EuiFlexGroup>
          </EuiFlexItem>
          <EuiFlexItem grow={false} css={styles.metadataContainer}>
            <EuiFlexGroup alignItems="center" justifyContent="flexEnd" gutterSize="m" wrap={false}>
              {status === ExecutionStatus.WAITING_FOR_INPUT && (
                <EuiFlexItem grow={false}>
                  <EuiBadge color="warning" data-test-subj="actionRequiredBadge">
                    {i18n.translate('workflowsManagement.executionListItem.actionRequiredBadge', {
                      defaultMessage: 'Action is required',
                    })}
                  </EuiBadge>
                </EuiFlexItem>
              )}
              {showExecutor && executedBy && (
                <EuiFlexItem grow={false}>
                  <EuiIconTip
                    type="user"
                    color="subdued"
                    content={i18n.translate('workflows.workflowExecutionListItem.runByIconTitle', {
                      defaultMessage: 'Run by {name}',
                      values: { name: executedBy },
                    })}
                  />
                </EuiFlexItem>
              )}
              {isTestRun && (
                <EuiFlexItem grow={false}>
                  <EuiIconTip
                    type="flask"
                    color="subdued"
                    content={i18n.translate(
                      'workflows.workflowExecutionListItem.testRunIconTitle',
                      {
                        defaultMessage: 'Test run',
                      }
                    )}
                  />
                </EuiFlexItem>
              )}
              {((showExecutor && executedBy) || isTestRun) && formattedDuration && (
                <EuiFlexItem grow={false}>
                  <span css={styles.separator} />
                </EuiFlexItem>
              )}
              {formattedDuration && (
                <EuiFlexItem grow={false} css={styles.durationContainer}>
                  <EuiFlexGroup
                    alignItems="center"
                    justifyContent="flexEnd"
                    gutterSize="xs"
                    wrap={false}
                  >
                    <EuiFlexItem grow={false}>
                      <EuiIcon type="clock" color="subdued" aria-hidden={true} />
                    </EuiFlexItem>
                    <EuiFlexItem grow={false}>
                      <EuiText size="xs" color="subdued">
                        {formattedDuration}
                      </EuiText>
                    </EuiFlexItem>
                  </EuiFlexGroup>
                </EuiFlexItem>
              )}
              {onClick && (
                <EuiFlexItem grow={false}>
                  <EuiIcon type="arrowRight" color="subdued" aria-hidden={true} />
                </EuiFlexItem>
              )}
            </EuiFlexGroup>
          </EuiFlexItem>
        </EuiFlexGroup>
      </EuiPanel>
    );
  }
);
WorkflowExecutionListItem.displayName = 'WorkflowExecutionListItem';

const componentStyles = {
  selectedContainer: ({ euiTheme }: UseEuiTheme) =>
    css({
      backgroundColor: euiTheme.colors.backgroundBaseInteractiveSelect,
    }),
  selectableContainer: ({ euiTheme }: UseEuiTheme) =>
    css({
      '&:hover': {
        backgroundColor: euiTheme.colors.backgroundBaseInteractiveHover,
        // Prevent hover animation effect from affecting the panel
        boxShadow: 'none',
        transform: 'none',
      },
    }),
  metadataContainer: css({
    minWidth: '200px',
  }),
  durationContainer: css({
    minWidth: '70px',
    justifyContent: 'flex-end',
  }),
  separator: ({ euiTheme }: UseEuiTheme) =>
    css({
      display: 'inline-block',
      width: '1px',
      height: euiTheme.size.base,
      backgroundColor: euiTheme.colors.borderBaseSubdued,
    }),
};
