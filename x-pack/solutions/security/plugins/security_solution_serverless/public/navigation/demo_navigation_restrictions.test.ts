/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { NavigationTreeDefinition } from '@kbn/core-chrome-browser';
import { restrictNavigationTree } from './demo_navigation_restrictions';

const tree: NavigationTreeDefinition = {
  body: [
    { link: 'securitySolutionUI:attack_discovery', icon: 'bolt' },
    { link: 'securitySolutionUI:alerts', icon: 'warning' },
    { link: 'discover', icon: 'productDiscover' },
    {
      id: 'rules',
      title: 'Rules',
      renderAs: 'panelOpener',
      children: [
        {
          children: [
            { link: 'securitySolutionUI:rules' },
            { link: 'securitySolutionUI:exceptions' },
          ],
        },
      ],
    },
    {
      id: 'investigations',
      title: 'Investigations',
      renderAs: 'panelOpener',
      children: [
        {
          children: [
            { link: 'securitySolutionUI:timelines' },
            { link: 'securitySolutionUI:notes' },
          ],
        },
      ],
    },
  ],
  footer: [{ link: 'dev_tools', icon: 'code' }],
};

describe('restrictNavigationTree', () => {
  it('returns the same tree when there is no allowlist', () => {
    expect(restrictNavigationTree(tree)).toBe(tree);
    expect(restrictNavigationTree(tree, [])).toBe(tree);
  });

  it('keeps allowed links enabled and disables everything else', () => {
    const restricted = restrictNavigationTree(tree, [
      'securitySolutionUI:attack_discovery',
      'securitySolutionUI:alerts',
    ]);

    expect(restricted.body.map(({ id, link, isDisabled }) => ({ id, link, isDisabled }))).toEqual([
      { id: undefined, link: 'securitySolutionUI:attack_discovery', isDisabled: false },
      { id: undefined, link: 'securitySolutionUI:alerts', isDisabled: false },
      { id: undefined, link: 'discover', isDisabled: true },
      { id: 'rules', link: undefined, isDisabled: true },
      { id: 'investigations', link: undefined, isDisabled: true },
    ]);
    expect(restricted.footer?.[0]).toEqual(expect.objectContaining({ isDisabled: true }));
  });

  it('keeps a panel opener enabled when one of its descendants is allowed', () => {
    const restricted = restrictNavigationTree(tree, ['securitySolutionUI:timelines']);

    const investigations = restricted.body[4];
    expect(investigations.isDisabled).toBe(false);
    expect(investigations.children?.[0].isDisabled).toBe(false);
    expect(investigations.children?.[0].children).toEqual([
      { link: 'securitySolutionUI:timelines', isDisabled: false },
      { link: 'securitySolutionUI:notes', isDisabled: true },
    ]);

    expect(restricted.body[3].isDisabled).toBe(true);
    expect(restricted.body[3].children?.[0].children?.every((child) => child.isDisabled)).toBe(
      true
    );
  });

  it('matches explicit node ids as well as links', () => {
    const restricted = restrictNavigationTree(tree, ['rules']);

    expect(restricted.body[3].isDisabled).toBe(false);
    expect(restricted.body[3].children?.[0].children?.every((child) => child.isDisabled)).toBe(
      true
    );
  });

  it('does not mutate the input tree', () => {
    const snapshot = JSON.stringify(tree);
    restrictNavigationTree(tree, ['securitySolutionUI:attack_discovery']);
    expect(JSON.stringify(tree)).toBe(snapshot);
  });
});
