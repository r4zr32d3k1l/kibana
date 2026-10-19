import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { ALERTS, type Alert, type AlertStatus } from '../data/alerts';

interface AlertsState {
  alerts: Alert[];
  getAlert: (id: string) => Alert | undefined;
  setStatus: (ids: string[], status: AlertStatus) => void;
  setAssignees: (id: string, assignees: string[]) => void;
  addNote: (id: string, note: string) => void;
}

const AlertsStateContext = createContext<AlertsState | null>(null);

/** In-memory "backend": status, assignee and note changes survive navigation but not a reload. */
export const AlertsStateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [alerts, setAlerts] = useState<Alert[]>(ALERTS);

  const getAlert = useCallback((id: string) => alerts.find((a) => a.id === id), [alerts]);

  const setStatus = useCallback((ids: string[], status: AlertStatus) => {
    const now = new Date().toISOString();
    setAlerts((prev) =>
      prev.map((a) => (ids.includes(a.id) ? { ...a, status, workflowStatusUpdatedAt: now } : a))
    );
  }, []);

  const setAssignees = useCallback((id: string, assignees: string[]) => {
    setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, assignees } : a)));
  }, []);

  const addNote = useCallback((id: string, note: string) => {
    setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, notes: [...a.notes, note] } : a)));
  }, []);

  const value = useMemo(
    () => ({ alerts, getAlert, setStatus, setAssignees, addNote }),
    [alerts, getAlert, setStatus, setAssignees, addNote]
  );

  return <AlertsStateContext.Provider value={value}>{children}</AlertsStateContext.Provider>;
};

export const useAlertsState = (): AlertsState => {
  const ctx = useContext(AlertsStateContext);
  if (!ctx) throw new Error('useAlertsState must be used inside AlertsStateProvider');
  return ctx;
};
