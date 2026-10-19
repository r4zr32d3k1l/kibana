import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

export interface Breadcrumb {
  text: string;
  href?: string;
}

interface ChromeState {
  breadcrumbs: Breadcrumb[];
  setBreadcrumbs: (crumbs: Breadcrumb[]) => void;
  isNavCollapsed: boolean;
  toggleNav: () => void;
}

const ChromeContext = createContext<ChromeState | null>(null);

export const ChromeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [breadcrumbs, setBreadcrumbs] = useState<Breadcrumb[]>([]);
  const [isNavCollapsed, setNavCollapsed] = useState(false);
  const toggleNav = useCallback(() => setNavCollapsed((v) => !v), []);
  const value = useMemo(
    () => ({ breadcrumbs, setBreadcrumbs, isNavCollapsed, toggleNav }),
    [breadcrumbs, isNavCollapsed, toggleNav]
  );
  return <ChromeContext.Provider value={value}>{children}</ChromeContext.Provider>;
};

export const useChrome = (): ChromeState => {
  const ctx = useContext(ChromeContext);
  if (!ctx) throw new Error('useChrome must be used inside ChromeProvider');
  return ctx;
};

/** Pages call this to publish their breadcrumb trail (after the fixed "Security" root). */
export const useBreadcrumbs = (crumbs: Breadcrumb[]) => {
  const { setBreadcrumbs } = useChrome();
  const key = JSON.stringify(crumbs);
  useEffect(() => {
    setBreadcrumbs(crumbs);
    document.title = `${crumbs.map((c) => c.text).join(' - ')} - Elastic`;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, setBreadcrumbs]);
};
