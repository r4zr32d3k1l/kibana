/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';

import { TestComponent } from './test_component';
import { flushPopoverTimers } from './flush_popover_timers';
import { mockClientHeight } from './mock_client_height';
import type { NavigationStructure } from '../../types';

const primaryItemId = (id: string) => `kbnChromeNav-primaryItem-${id}`;
const footerItemId = (id: string) => `kbnChromeNav-footerItem-${id}`;
const sidePanelItemId = (id: string) => `kbnChromeNav-sidePanelItem-${id}`;
const popoverId = (label: string) => `side-nav-popover-${label}`;

const items: NavigationStructure = {
  primaryItems: [
    { id: 'alerts', label: 'Alerts', href: '/alerts', iconType: 'warning' },
    {
      id: 'discover',
      label: 'Discover',
      href: '/discover',
      iconType: 'discoverApp',
      isDisabled: true,
    },
    {
      id: 'rules',
      label: 'Rules',
      href: '/rules',
      iconType: 'securitySignal',
      isDisabled: true,
      sections: [
        {
          id: 'rules_section',
          items: [
            { id: 'rules_list', label: 'Detection rules', href: '/rules', isDisabled: true },
            { id: 'exceptions', label: 'Exceptions', href: '/exceptions', isDisabled: true },
          ],
        },
      ],
    },
    {
      id: 'investigations',
      label: 'Investigations',
      href: '/timelines',
      iconType: 'casesApp',
      sections: [
        {
          id: 'investigations_section',
          items: [
            { id: 'timelines', label: 'Timelines', href: '/timelines' },
            { id: 'notes', label: 'Notes', href: '/notes', isDisabled: true },
          ],
        },
      ],
    },
  ],
  footerItems: [
    { id: 'dev_tools', label: 'Dev tools', href: '/dev_tools', iconType: 'code', isDisabled: true },
  ],
};

describe('Disabled items', () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeAll(() => {
    mockClientHeight(51);
  });

  beforeEach(() => {
    user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime, pointerEventsCheck: 0 });
  });

  it('renders a disabled primary item as a disabled button instead of a link', () => {
    render(<TestComponent items={items} />);

    const alerts = screen.getByTestId(primaryItemId('alerts'));
    expect(alerts.tagName).toBe('A');
    expect(alerts).toHaveAttribute('href', '/alerts');

    const discover = screen.getByTestId(primaryItemId('discover'));
    expect(discover.tagName).toBe('BUTTON');
    expect(discover).toBeDisabled();
    expect(discover).toHaveAttribute('aria-disabled', 'true');
    expect(discover).not.toHaveAttribute('href');
    expect(discover).toHaveTextContent('Discover');
  });

  it('does not open the popover or the side panel of a disabled panel opener', async () => {
    render(<TestComponent items={items} />);

    const rules = screen.getByTestId(primaryItemId('rules'));
    expect(rules).toBeDisabled();
    expect(rules).not.toHaveAttribute('aria-haspopup', 'true');

    await user.hover(rules);
    flushPopoverTimers();

    expect(screen.queryByTestId(popoverId('Rules'))).not.toBeInTheDocument();
    expect(screen.queryByTestId(sidePanelItemId('rules_list'))).not.toBeInTheDocument();
  });

  it('keeps the side panel closed when the active item is a disabled panel opener', () => {
    render(<TestComponent items={items} initialActiveItemId="rules_list" />);

    expect(screen.queryByTestId(sidePanelItemId('rules_list'))).not.toBeInTheDocument();
  });

  it('renders disabled secondary items as disabled buttons inside an enabled panel', async () => {
    render(<TestComponent items={items} initialActiveItemId="timelines" />);

    const timelines = screen.getByTestId(sidePanelItemId('timelines'));
    expect(timelines.tagName).toBe('A');

    const notes = screen.getByTestId(sidePanelItemId('notes'));
    expect(notes.tagName).toBe('BUTTON');
    expect(notes).toBeDisabled();
  });

  it('renders a disabled footer item as a disabled button', () => {
    render(<TestComponent items={items} />);

    const devTools = screen.getByTestId(footerItemId('dev_tools'));
    expect(devTools.tagName).toBe('BUTTON');
    expect(devTools).toBeDisabled();
  });
});
