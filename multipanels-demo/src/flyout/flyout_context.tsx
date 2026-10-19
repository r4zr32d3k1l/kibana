import React, { createContext, useCallback, useContext, useMemo, useReducer } from 'react';

/**
 * A small re-implementation of the `@kbn/expandable-flyout` state model: a right panel, an optional
 * left (expanded) panel, a stack of preview panels drawn over the right panel, and a history of the
 * right panels visited so "back" navigation across alerts works.
 */

export type RightTab = 'overview' | 'table' | 'json';
export type LeftTab = 'visualize' | 'insights' | 'investigation' | 'response' | 'notes';
export type InsightsSubTab = 'entities' | 'threat_intelligence' | 'prevalence' | 'correlations';
export type VisualizeSubTab = 'session_view' | 'analyzer_graph' | 'graph';

export interface RightPanelState {
  alertId: string;
  tab: RightTab;
}

export interface LeftPanelState {
  tab: LeftTab;
  insightsSubTab?: InsightsSubTab;
  visualizeSubTab?: VisualizeSubTab;
}

export type PreviewPanelState =
  | { kind: 'rule'; ruleId: string; alertId: string }
  | { kind: 'host'; hostName: string; alertId: string }
  | { kind: 'user'; userName: string; alertId: string }
  | { kind: 'alertReason'; alertId: string }
  | { kind: 'alert'; alertId: string };

export interface FlyoutState {
  right?: RightPanelState;
  left?: LeftPanelState;
  previews: PreviewPanelState[];
  /** Right panels visited in this flyout session, most recent last (includes the current one). */
  history: RightPanelState[];
}

type Action =
  | { type: 'openRight'; alertId: string; tab?: RightTab; keepLeft?: boolean }
  | { type: 'setRightTab'; tab: RightTab }
  | { type: 'openLeft'; panel: LeftPanelState }
  | { type: 'closeLeft' }
  | { type: 'openPreview'; preview: PreviewPanelState }
  | { type: 'closePreview' }
  | { type: 'closeAllPreviews' }
  | { type: 'goToHistory'; index: number }
  | { type: 'close' };

const initialState: FlyoutState = { previews: [], history: [] };

const reducer = (state: FlyoutState, action: Action): FlyoutState => {
  switch (action.type) {
    case 'openRight': {
      const right: RightPanelState = { alertId: action.alertId, tab: action.tab ?? 'overview' };
      const sameAlert = state.right?.alertId === action.alertId;
      const history = sameAlert
        ? state.history
        : [...state.history.filter((h) => h.alertId !== action.alertId), right];
      return {
        right,
        left: action.keepLeft && sameAlert ? state.left : undefined,
        previews: [],
        history,
      };
    }
    case 'setRightTab':
      return state.right ? { ...state, right: { ...state.right, tab: action.tab } } : state;
    case 'openLeft':
      return state.right ? { ...state, left: { ...state.left, ...action.panel } } : state;
    case 'closeLeft':
      return { ...state, left: undefined };
    case 'openPreview':
      return { ...state, previews: [...state.previews, action.preview] };
    case 'closePreview':
      return { ...state, previews: state.previews.slice(0, -1) };
    case 'closeAllPreviews':
      return { ...state, previews: [] };
    case 'goToHistory': {
      const target = state.history[action.index];
      if (!target) return state;
      return {
        right: { ...target },
        left: undefined,
        previews: [],
        history: state.history,
      };
    }
    case 'close':
      return initialState;
    default:
      return state;
  }
};

export interface FlyoutApi {
  state: FlyoutState;
  isOpen: boolean;
  isExpanded: boolean;
  openRightPanel: (alertId: string, tab?: RightTab) => void;
  setRightTab: (tab: RightTab) => void;
  openLeftPanel: (panel: LeftPanelState) => void;
  closeLeftPanel: () => void;
  toggleLeftPanel: () => void;
  openPreviewPanel: (preview: PreviewPanelState) => void;
  closePreviewPanel: () => void;
  closeAllPreviews: () => void;
  goToHistory: (index: number) => void;
  closeFlyout: () => void;
}

const FlyoutContext = createContext<FlyoutApi | null>(null);

export const FlyoutProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initialState);

  const openRightPanel = useCallback((alertId: string, tab?: RightTab) => dispatch({ type: 'openRight', alertId, tab }), []);
  const setRightTab = useCallback((tab: RightTab) => dispatch({ type: 'setRightTab', tab }), []);
  const openLeftPanel = useCallback((panel: LeftPanelState) => dispatch({ type: 'openLeft', panel }), []);
  const closeLeftPanel = useCallback(() => dispatch({ type: 'closeLeft' }), []);
  const openPreviewPanel = useCallback((preview: PreviewPanelState) => dispatch({ type: 'openPreview', preview }), []);
  const closePreviewPanel = useCallback(() => dispatch({ type: 'closePreview' }), []);
  const closeAllPreviews = useCallback(() => dispatch({ type: 'closeAllPreviews' }), []);
  const goToHistory = useCallback((index: number) => dispatch({ type: 'goToHistory', index }), []);
  const closeFlyout = useCallback(() => dispatch({ type: 'close' }), []);
  const toggleLeftPanel = useCallback(() => {
    if (state.left) dispatch({ type: 'closeLeft' });
    else dispatch({ type: 'openLeft', panel: { tab: 'insights', insightsSubTab: 'entities' } });
  }, [state.left]);

  const value = useMemo<FlyoutApi>(
    () => ({
      state,
      isOpen: Boolean(state.right),
      isExpanded: Boolean(state.left),
      openRightPanel,
      setRightTab,
      openLeftPanel,
      closeLeftPanel,
      toggleLeftPanel,
      openPreviewPanel,
      closePreviewPanel,
      closeAllPreviews,
      goToHistory,
      closeFlyout,
    }),
    [state, openRightPanel, setRightTab, openLeftPanel, closeLeftPanel, toggleLeftPanel, openPreviewPanel, closePreviewPanel, closeAllPreviews, goToHistory, closeFlyout]
  );

  return <FlyoutContext.Provider value={value}>{children}</FlyoutContext.Provider>;
};

export const useFlyoutApi = (): FlyoutApi => {
  const ctx = useContext(FlyoutContext);
  if (!ctx) throw new Error('useFlyoutApi must be used inside FlyoutProvider');
  return ctx;
};
