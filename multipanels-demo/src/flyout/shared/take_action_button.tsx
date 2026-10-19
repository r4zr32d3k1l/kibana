import React, { useState } from 'react';
import { EuiButton, EuiContextMenuItem, EuiContextMenuPanel, EuiHorizontalRule, EuiPopover } from '@elastic/eui';
import type { Alert, AlertStatus } from '../../data/alerts';
import { useAlertsState } from '../../state/alerts_state';
import { useFlyoutApi } from '../flyout_context';
import { useToasts } from '../../components/toasts';

/** "Take action" dropdown found in the flyout footer (and the alerts table bulk actions). */
export const TakeActionButton: React.FC<{ alert: Alert; fill?: boolean }> = ({ alert, fill = true }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { setStatus } = useAlertsState();
  const { openLeftPanel } = useFlyoutApi();
  const { addToast } = useToasts();

  const changeStatus = (status: AlertStatus) => {
    setStatus([alert.id], status);
    setIsOpen(false);
    addToast({
      title: `Successfully marked 1 alert as ${status}`,
      color: 'success',
      iconType: 'check',
    });
  };

  const notImplemented = (label: string) => () => {
    setIsOpen(false);
    addToast({ title: `${label} is not part of this demo`, color: 'primary', iconType: 'info' });
  };

  const statusItems: Array<{ key: AlertStatus; label: string }> = (
    [
      { key: 'open', label: 'Mark as open' },
      { key: 'acknowledged', label: 'Mark as acknowledged' },
      { key: 'closed', label: 'Mark as closed' },
    ] as const
  ).filter((item) => item.key !== alert.status);

  const items = [
    ...statusItems.map((item) => (
      <EuiContextMenuItem key={item.key} onClick={() => changeStatus(item.key)}>
        {item.label}
      </EuiContextMenuItem>
    )),
    <EuiHorizontalRule key="sep1" margin="none" />,
    <EuiContextMenuItem key="case-new" onClick={notImplemented('Add to new case')}>
      Add to new case
    </EuiContextMenuItem>,
    <EuiContextMenuItem key="case-existing" onClick={notImplemented('Add to existing case')}>
      Add to existing case
    </EuiContextMenuItem>,
    <EuiContextMenuItem
      key="note"
      onClick={() => {
        setIsOpen(false);
        openLeftPanel({ tab: 'notes' });
      }}
    >
      Add note
    </EuiContextMenuItem>,
    <EuiHorizontalRule key="sep2" margin="none" />,
    <EuiContextMenuItem key="isolate" onClick={notImplemented('Isolate host')}>
      Isolate host
    </EuiContextMenuItem>,
    <EuiContextMenuItem
      key="respond"
      onClick={() => {
        setIsOpen(false);
        openLeftPanel({ tab: 'response' });
      }}
    >
      Respond
    </EuiContextMenuItem>,
    <EuiHorizontalRule key="sep3" margin="none" />,
    <EuiContextMenuItem key="timeline" onClick={notImplemented('Investigate in timeline')}>
      Investigate in timeline
    </EuiContextMenuItem>,
    <EuiContextMenuItem key="exception" onClick={notImplemented('Add rule exception')}>
      Add rule exception
    </EuiContextMenuItem>,
    <EuiContextMenuItem key="endpoint-exception" onClick={notImplemented('Add Endpoint exception')}>
      Add Endpoint exception
    </EuiContextMenuItem>,
  ];

  return (
    <EuiPopover
      button={
        <EuiButton
          fill={fill}
          size="s"
          iconType="chevronSingleDown"
          iconSide="right"
          onClick={() => setIsOpen((open) => !open)}
          data-test-subj="take-action-dropdown-btn"
        >
          Take action
        </EuiButton>
      }
      isOpen={isOpen}
      closePopover={() => setIsOpen(false)}
      panelPaddingSize="none"
      anchorPosition="upRight"
    >
      <EuiContextMenuPanel items={items} />
    </EuiPopover>
  );
};
