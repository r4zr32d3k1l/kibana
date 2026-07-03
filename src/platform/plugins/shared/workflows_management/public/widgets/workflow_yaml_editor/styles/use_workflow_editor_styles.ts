/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import type { UseEuiTheme } from '@elastic/eui';
import { transparentize } from '@elastic/eui';
import { css } from '@emotion/react';
import { useMemoCss } from '@kbn/css-utils/public/use_memo_css';
import { EDITOR_SCROLLBAR_WIDTH_PX, FOCUSED_STEP_DECORATION_INSET_PX } from './constants';

export const EXECUTION_YAML_SNAPSHOT_CLASS = 'execution-yaml-snapshot';

const editorStyleMap = {
  actionsMenuPopoverPanel: ({ euiTheme }: UseEuiTheme) =>
    css({
      minInlineSize: '600px',
      maxInlineSize: '600px',
      maxBlockSize: '520px',
      borderRadius: euiTheme.border.radius.medium,
    }),

  container: ({ euiTheme }: UseEuiTheme) =>
    css({
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
      minHeight: 0,

      // Template variable decorations
      '.template-variable-info, .template-variable-valid': {
        backgroundColor: transparentize(euiTheme.colors.primary, 0.12),
        borderRadius: '2px',
      },
      '.template-variable-error': {
        backgroundColor: transparentize(euiTheme.colors.vis.euiColorVisWarning1, 0.24),
        color: euiTheme.colors.severity.danger,
        borderRadius: '2px',
      },
      '.template-variable-warning': {
        backgroundColor: transparentize(euiTheme.colors.vis.euiColorVisWarning1, 0.24),
        borderRadius: '2px',
      },
      '.workflow-name-decoration': {
        color: euiTheme.colors.textSubdued,
        fontStyle: 'italic',
      },
      '.after-text': {
        marginLeft: '10px',
        color: euiTheme.colors.textDisabled,
      },
      '.after-text + .after-text': {
        marginLeft: '0',
      },

      // Before-decoration badges
      '.connector-name-badge': {
        display: 'inline-block',
        backgroundColor: transparentize(euiTheme.colors.success, 0.1),
        color: euiTheme.colors.successText,
        padding: '2px 6px',
        borderRadius: '4px',
        marginRight: '8px',
        fontSize: '12px',
        fontWeight: 500,
        lineHeight: '1.4',
      },

      '.workflow-name-badge': {
        display: 'inline-block',
        backgroundColor: transparentize(euiTheme.colors.primary, 0.1),
        color: euiTheme.colors.primaryText,
        padding: '2px 6px',
        borderRadius: '4px',
        marginRight: '8px',
        fontSize: '12px',
        fontWeight: 500,
        lineHeight: '1.4',
      },

      // Step highlighting
      '.step-highlight': {
        backgroundColor: euiTheme.colors.backgroundBaseAccent,
        borderRadius: '2px',
      },
      '.dimmed': {
        opacity: 0.5,
      },

      // Alert trigger
      '.alert-trigger-glyph': {
        '&:before': {
          content: '""',
          display: 'block',
          width: '12px',
          height: '12px',
          backgroundColor: euiTheme.colors.warning,
          borderRadius: '50%',
        },
      },

      // Webhook trigger — a clickable hint (standard webhook logo + message)
      // rendered inline, just to the right of the `webhook` value. Opens the
      // setup flyout on click.
      '.webhook-trigger-hint': {
        cursor: 'pointer',
        color: euiTheme.colors.textSubdued,
        fontStyle: 'italic',
        marginLeft: '12px',
        '&:hover': {
          color: euiTheme.colors.link,
          textDecoration: 'underline',
        },
        '&:before': {
          content: '""',
          display: 'inline-block',
          verticalAlign: 'text-bottom',
          marginRight: '6px',
          width: '14px',
          height: '14px',
          backgroundImage: `url("data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20width%3D%2232%22%20height%3D%2232%22%20viewBox%3D%220%200%2032%2032%22%3E%3Cg%20fill%3D%22none%22%20transform%3D%22translate%280%201%29%22%3E%3Cpath%20fill%3D%22%23C73A63%22%20d%3D%22M14.9425%2C12.562875%20C13.61625%2C14.792375%2012.345625%2C16.951375%2011.0485%2C19.094125%20C10.715375%2C19.64425%2010.5505%2C20.092375%2010.816625%2C20.791625%20C11.551375%2C22.723375%2010.514875%2C24.60325%208.566875%2C25.1135%20C6.72975%2C25.594875%204.939875%2C24.3875%204.575375%2C22.420625%20C4.252375%2C20.67975%205.603375%2C18.973125%207.522875%2C18.701%20C7.683625%2C18.678%207.847875%2C18.675375%208.118125%2C18.655125%20L11.037875%2C13.759125%20C9.2015%2C11.933125%208.1085%2C9.79875%208.350375%2C7.15375%20C8.521375%2C5.284125%209.256625%2C3.668375%2010.600375%2C2.344125%20C13.174125%2C-0.191875%2017.100625%2C-0.6025%2020.131125%2C1.344%20C23.041625%2C3.21375%2024.374625%2C6.85575%2023.238375%2C9.972875%20C22.381625%2C9.740625%2021.518875%2C9.506375%2020.5705%2C9.249125%20C20.92725%2C7.516%2020.663375%2C5.95975%2019.4945%2C4.6265%20C18.72225%2C3.74625%2017.73125%2C3.284875%2016.6045%2C3.114875%20C14.3455%2C2.773625%2012.127625%2C4.224875%2011.4695%2C6.442125%20C10.7225%2C8.958375%2011.853125%2C11.014%2014.9425%2C12.563%20L14.9425%2C12.562875%20Z%22/%3E%3Cpath%20fill%3D%22%234B4B4B%22%20d%3D%22M18.730125%2C9.92625%20C19.6645%2C11.574625%2020.61325%2C13.247875%2021.5535%2C14.90575%20C26.306%2C13.435375%2029.88925%2C16.06625%2031.17475%2C18.882875%20C32.7275%2C22.28525%2031.666%2C26.315%2028.616625%2C28.414125%20C25.486625%2C30.568875%2021.52825%2C30.20075%2018.755125%2C27.43275%20C19.461875%2C26.841125%2020.172125%2C26.246875%2020.931%2C25.612%20C23.67%2C27.386%2026.065625%2C27.3025%2027.844125%2C25.20175%20C29.36075%2C23.409625%2029.327875%2C20.7375%2027.76725%2C18.983%20C25.96625%2C16.958375%2023.553875%2C16.896625%2020.637875%2C18.840125%20C19.42825%2C16.694125%2018.197625%2C14.56525%2017.02625%2C12.40375%20C16.63125%2C11.67525%2016.19525%2C11.2525%2015.305%2C11.098375%20C13.818375%2C10.840625%2012.858625%2C9.564%2012.801%2C8.13375%20C12.744375%2C6.71925%2013.57775%2C5.440625%2014.88025%2C4.9425%20C16.1705%2C4.448875%2017.684625%2C4.84725%2018.5525%2C5.94425%20C19.26175%2C6.8405%2019.487125%2C7.84925%2019.113875%2C8.954625%20C19.010125%2C9.262875%2018.87575%2C9.561125%2018.730125%2C9.926375%20L18.730125%2C9.92625%20Z%22/%3E%3Cpath%20fill%3D%22%234A4A4A%22%20d%3D%22M20.963375%2C23.40125%20L15.242125%2C23.40125%20C14.69375%2C25.65675%2013.50925%2C27.47775%2011.468375%2C28.63575%20C9.88175%2C29.53575%208.17175%2C29.840875%206.35175%2C29.547%20C3.00075%2C29.006625%200.26075%2C25.99%200.0195%2C22.59325%20C-0.2535%2C18.74525%202.391375%2C15.324875%205.91675%2C14.556625%20C6.160125%2C15.4405%206.406125%2C16.332875%206.6495%2C17.214625%20C3.415%2C16.864875%202.2955%2C20.944125%203.20075%2C23.544125%20C3.997625%2C25.832125%206.26125%2C27.08625%208.719125%2C26.60125%20C11.229125%2C26.106%2012.494625%2C24.02%2012.340125%2C20.67225%20C14.719625%2C20.67225%2017.101125%2C20.647625%2019.480875%2C20.684375%20C20.410125%2C20.699%2021.1275%2C20.602625%2021.8275%2C19.783375%20C22.98%2C18.435375%2025.101375%2C18.557%2026.342625%2C19.830125%20C27.611125%2C21.13125%2027.550375%2C23.22475%2026.208%2C24.471%20C24.912875%2C25.6735%2022.86675%2C25.60925%2021.655%2C24.3135%20C21.406%2C24.0465%2021.20975%2C23.729375%2020.963375%2C23.40125%20Z%22/%3E%3C/g%3E%3C/svg%3E")`,
          backgroundSize: 'contain',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center',
        },
      },
      // The `type: webhook` value itself reads as a clickable link
      '.webhook-trigger-clickable': {
        cursor: 'pointer',
        textDecoration: 'underline',
        textDecorationStyle: 'dotted',
        textUnderlineOffset: '2px',
      },

      // Custom trigger `on.workflowEvents` (ignore / allow-all / avoid-loop)
      '.workflow-trigger-on-chain-glyph': {
        '&:before': {
          content: '""',
          display: 'block',
          width: '12px',
          height: '12px',
          backgroundColor: euiTheme.colors.warning,
          borderRadius: '50%',
        },
      },
      '.alert-trigger-highlight': {
        backgroundColor: euiTheme.colors.backgroundLightWarning,
      },

      // Error highlighting
      '.duplicate-step-name-error': {
        backgroundColor: euiTheme.colors.backgroundLightDanger,
      },
      '.duplicate-step-name-error-margin': {
        backgroundColor: euiTheme.colors.backgroundLightDanger,
        position: 'relative',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: euiTheme.colors.backgroundLightDanger,
          zIndex: 1000,
        },
        color: 'transparent',
        textShadow: 'none',
        fontSize: 0,
      },

      // Step execution
      '.elasticsearch-step-glyph': {
        '&:before': {
          content: '""',
          display: 'block',
          width: '12px',
          height: '12px',
          backgroundColor: euiTheme.colors.vis.euiColorVis1,
          borderRadius: '50%',
        },
      },
      '.elasticsearch-step-type-highlight': {
        backgroundColor: 'rgba(0, 120, 212, 0.1)',
        borderLeft: `2px solid ${euiTheme.colors.vis.euiColorVis1}`,
      },
      '.elasticsearch-step-block-highlight': {
        backgroundColor: 'rgba(0, 120, 212, 0.08)',
        borderLeft: `2px solid ${euiTheme.colors.vis.euiColorVis1}`,
      },
      '.elasticsearch-step-background': {
        backgroundColor: 'rgba(0, 120, 212, 0.08)',
        borderLeft: `2px solid ${euiTheme.colors.vis.euiColorVis1}`,
      },
      '.workflow-step-highlight': {
        backgroundColor: 'rgba(0, 120, 212, 0.1)',
        borderLeft: `3px solid ${euiTheme.colors.vis.euiColorVis1}`,
      },
      '.workflow-step-line-highlight': {
        backgroundColor: 'rgba(0, 120, 212, 0.05)',
        borderLeft: `2px solid ${euiTheme.colors.vis.euiColorVis1}`,
      },

      // Diff highlighting
      '.changed-line-highlight': {
        backgroundColor: euiTheme.colors.backgroundLightWarning,
        borderLeft: `2px solid ${euiTheme.colors.warning}`,
        opacity: 0.7,
      },
      '.changed-line-margin': {
        backgroundColor: euiTheme.colors.warning,
        width: '2px',
        opacity: 0.7,
      },
    }),

  editorContainer: ({ euiTheme }: UseEuiTheme) =>
    css({
      flex: '1 1 0',
      minWidth: 0,
      overflowY: 'auto',
      minHeight: 0,
      backgroundColor: euiTheme.colors.backgroundBaseSubdued,
      [`&.${EXECUTION_YAML_SNAPSHOT_CLASS}`]: {
        backgroundColor: euiTheme.colors.backgroundBasePlain,
      },
    }),

  validationErrorsContainer: css({
    flexShrink: 0,
    overflow: 'hidden',
    zIndex: 2, // overlay the editor flying action buttons
  }),

  stepActionsContainer: css({
    position: 'absolute',
    zIndex: 1002, // above the highlighting and pseudo-element
    transform: `translateY(${FOCUSED_STEP_DECORATION_INSET_PX}px) translateX(-${
      EDITOR_SCROLLBAR_WIDTH_PX + 2 * FOCUSED_STEP_DECORATION_INSET_PX
    }px)`, // scrollbar + twice decoration inset (outside and inside)
  }),

  downloadSchemaButton: ({ euiTheme }: UseEuiTheme) =>
    css({
      color: euiTheme.colors.textSubdued,
      '&:hover': {
        color: euiTheme.colors.textPrimary,
      },
      '&:hover:not(:disabled)::before': {
        backgroundColor: 'transparent',
      },
    }),
  agentBuilderSectionCss: (euiThemeContext: UseEuiTheme) =>
    css({
      position: 'absolute',
      top: euiThemeContext.euiTheme.size.xxs,
      right: euiThemeContext.euiTheme.size.m,
      zIndex: 10,
    }),
  hiddenButtonCss: css({ display: 'none' }),
};

export const useWorkflowEditorStyles = () => {
  return useMemoCss(editorStyleMap);
};
