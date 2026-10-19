import React, { useEffect, useState } from 'react';
import { css } from '@emotion/react';
import { EuiFlyout, useEuiTheme } from '@elastic/eui';
import { useFlyoutApi } from './flyout_context';
import { useAlertsState } from '../state/alerts_state';
import { RightPanel } from './right/right_panel';
import { LeftPanel } from './left/left_panel';
import { PreviewSection } from './preview/preview_section';

export const RIGHT_PANEL_WIDTH = 540;
const LEFT_MIN_WIDTH = 620;
const CHROME_LEFT_GUTTER = 300;

const useViewportWidth = () => {
  const [width, setWidth] = useState(window.innerWidth);
  useEffect(() => {
    const onResize = () => setWidth(window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  return width;
};

/**
 * Container that mirrors `@kbn/expandable-flyout`: one EuiFlyout whose width grows when the
 * left (expanded) panel is open; preview panels are drawn over the right section.
 */
export const ExpandableFlyout: React.FC = () => {
  const { euiTheme } = useEuiTheme();
  const { state, isOpen, isExpanded, closeFlyout } = useFlyoutApi();
  const { getAlert } = useAlertsState();
  const viewportWidth = useViewportWidth();

  const alert = state.right ? getAlert(state.right.alertId) : undefined;
  if (!isOpen || !alert || !state.right) return null;

  const leftWidth = Math.max(LEFT_MIN_WIDTH, Math.min(1000, viewportWidth - CHROME_LEFT_GUTTER - RIGHT_PANEL_WIDTH));
  const width = isExpanded ? RIGHT_PANEL_WIDTH + leftWidth : RIGHT_PANEL_WIDTH;

  return (
    <EuiFlyout
      onClose={closeFlyout}
      type="overlay"
      side="right"
      size={`${width}px`}
      maxWidth={false}
      paddingSize="none"
      ownFocus={false}
      hideCloseButton
      outsideClickCloses={false}
      aria-label="Alert details"
      data-test-subj="securitySolutionFlyout"
      css={css`
        max-inline-size: 100vw;
        transition: inline-size ${euiTheme.animation.normal} ease;
        box-shadow: 0 0 24px rgba(0, 0, 0, 0.18);
      `}
    >
      <div
        css={css`
          display: flex;
          height: 100%;
          width: 100%;
          overflow: hidden;
        `}
      >
        {isExpanded && state.left && (
          <section
            data-test-subj="securitySolutionFlyoutLeftSection"
            css={css`
              width: ${leftWidth}px;
              min-width: 0;
              height: 100%;
              display: flex;
              flex-direction: column;
              border-right: ${euiTheme.border.thin};
              background: ${euiTheme.colors.backgroundBaseSubdued};
            `}
          >
            <LeftPanel alert={alert} panel={state.left} />
          </section>
        )}
        <section
          data-test-subj="securitySolutionFlyoutRightSection"
          css={css`
            position: relative;
            width: ${RIGHT_PANEL_WIDTH}px;
            flex: 0 0 ${RIGHT_PANEL_WIDTH}px;
            height: 100%;
            display: flex;
            flex-direction: column;
            background: ${euiTheme.colors.emptyShade};
          `}
        >
          <RightPanel alert={alert} panel={state.right} />
          {state.previews.length > 0 && <PreviewSection previews={state.previews} />}
        </section>
      </div>
    </EuiFlyout>
  );
};
