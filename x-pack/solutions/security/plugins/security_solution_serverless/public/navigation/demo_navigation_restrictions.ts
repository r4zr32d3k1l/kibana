/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { NavigationTreeDefinition } from '@kbn/core-chrome-browser';

/** The subset of a navigation node definition that the restriction cares about. */
interface RestrictableNode {
  id?: string;
  link?: string;
  isDisabled?: boolean;
  children?: RestrictableNode[];
}

/**
 * Demo / kiosk mode for the Security side navigation (`xpack.securitySolutionServerless.navigationAllowlist`).
 *
 * Every node whose deep link id (or explicit id) is not in the allowlist is marked `isDisabled`, so the
 * side nav still renders its icon and label but it can neither be clicked nor open its panel. Nodes keep
 * their `link`, which is what stops core from pruning them. A group stays enabled when at least one of
 * its descendants is allowed, so the allowed page remains reachable through its panel.
 *
 * An empty or missing allowlist leaves the tree untouched.
 */
export const restrictNavigationTree = (
  navigationTree: NavigationTreeDefinition,
  navigationAllowlist?: string[]
): NavigationTreeDefinition => {
  if (!navigationAllowlist?.length) {
    return navigationTree;
  }

  const allowed = new Set(navigationAllowlist);

  const restrictNode = <T extends RestrictableNode>(node: T): T => {
    const children = node.children?.map(restrictNode);
    const isAllowed =
      (node.link !== undefined && allowed.has(node.link)) ||
      (node.id !== undefined && allowed.has(node.id));
    const hasEnabledChild = children?.some((child) => !child.isDisabled) ?? false;

    return {
      ...node,
      ...(children && { children }),
      isDisabled: !isAllowed && !hasEnabledChild,
    };
  };

  return {
    ...navigationTree,
    body: navigationTree.body.map(restrictNode),
    ...(navigationTree.footer && { footer: navigationTree.footer.map(restrictNode) }),
  };
};
