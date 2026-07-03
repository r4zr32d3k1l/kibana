/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

/* eslint-disable @typescript-eslint/no-non-null-assertion */

import { useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';
import type { Document, Node } from 'yaml';
import { i18n } from '@kbn/i18n';
import { monaco } from '@kbn/monaco';
import { getTriggerNodes } from '../../../../../common/lib/yaml';
import { openWebhookFlyout } from '../../../../entities/workflows/store';
import { getMonacoRangeFromYamlNode } from '../../lib/utils';

interface UseWebhookTriggerDecorationsProps {
  editor: monaco.editor.IStandaloneCodeEditor | null;
  yamlDocument: Document | null;
  isEditorMounted: boolean;
  readOnly: boolean;
}

/**
 * For every `type: webhook` trigger, renders a clickable inline hint —
 * the standard webhook logo plus a "Click to view webhook details" message —
 * immediately to the right of the `webhook` value, and makes the value text
 * itself clickable too. Clicking the value, the hint, or the "Set up webhook"
 * link in the hover opens the webhook setup flyout via `openWebhookFlyout`,
 * mirroring the connector-as-trigger flyout affordance. The clickable region
 * spans from the start of the `webhook` value to the end of the line (where the
 * injected hint sits).
 */
export const useWebhookTriggerDecorations = ({
  editor,
  yamlDocument,
  isEditorMounted,
  readOnly,
}: UseWebhookTriggerDecorationsProps) => {
  const decorationCollectionRef = useRef<monaco.editor.IEditorDecorationsCollection | null>(null);
  const mouseDownDisposableRef = useRef<monaco.IDisposable | null>(null);
  // Line number -> first column of the `webhook` value (click target starts here).
  const webhookLinesRef = useRef<Map<number, number>>(new Map());
  const dispatch = useDispatch();

  useEffect(() => {
    const model = editor?.getModel() ?? null;

    if (decorationCollectionRef.current) {
      decorationCollectionRef.current.clear();
      decorationCollectionRef.current = null;
    }
    webhookLinesRef.current = new Map();

    if (!model || !yamlDocument || !isEditorMounted || readOnly || !editor) {
      return;
    }

    const webhookTriggers = getTriggerNodes(yamlDocument).filter(
      ({ triggerType }) => triggerType === 'webhook'
    );

    if (webhookTriggers.length === 0) {
      return;
    }

    const hoverMessage = {
      value: `**${i18n.translate('workflows.workflowDetail.yamlEditor.webhookTriggerGlyphTitle', {
        defaultMessage: 'Webhook trigger',
      })}**\n\n[${i18n.translate('workflows.workflowDetail.yamlEditor.webhookTriggerGlyphAction', {
        defaultMessage: 'Set up webhook',
      })}](command:workflows.editor.action.configureWebhook)`,
      // Required so Monaco renders the `command:` link as clickable.
      isTrusted: true,
      supportHtml: false,
    };

    const hintText = i18n.translate('workflows.workflowDetail.yamlEditor.webhookTriggerHint', {
      defaultMessage: 'Click the webhook to view its details and options',
    });

    const decorations = webhookTriggers
      .map(({ node, typePair }) => {
        let typeRange = getMonacoRangeFromYamlNode(model, typePair.value as Node);

        if (!typeRange) {
          const triggerRange = getMonacoRangeFromYamlNode(model, node);
          if (!triggerRange) {
            return null;
          }
          let typeLineNumber = triggerRange.startLineNumber;
          for (
            let lineNum = triggerRange.startLineNumber;
            lineNum <= triggerRange.endLineNumber;
            lineNum++
          ) {
            const lineContent = model.getLineContent(lineNum);
            if (lineContent.includes('type:') && lineContent.includes('webhook')) {
              typeLineNumber = lineNum;
              break;
            }
          }
          const idx = model.getLineContent(typeLineNumber).indexOf('webhook');
          typeRange = new monaco.Range(
            typeLineNumber,
            idx >= 0 ? idx + 1 : 1,
            typeLineNumber,
            idx >= 0 ? idx + 1 + 'webhook'.length : model.getLineMaxColumn(typeLineNumber)
          );
        }

        const lineNumber = typeRange!.startLineNumber;
        const lineEndColumn = model.getLineMaxColumn(lineNumber);
        webhookLinesRef.current.set(lineNumber, typeRange!.startColumn);

        // Make the `webhook` value read and behave like a clickable link.
        const clickableValueDecoration: monaco.editor.IModelDeltaDecoration = {
          range: new monaco.Range(
            lineNumber,
            typeRange!.startColumn,
            lineNumber,
            typeRange!.endColumn
          ),
          options: {
            inlineClassName: 'webhook-trigger-clickable',
            hoverMessage,
          },
        };

        // Gray description rendered right after the value (webhook icon + message).
        // Uses a full-line range with `after` — same pattern as the alert trigger's
        // after-text, which reliably injects at the end of the line.
        const hintDecoration: monaco.editor.IModelDeltaDecoration = {
          range: new monaco.Range(lineNumber, 1, lineNumber, lineEndColumn),
          options: {
            after: {
              content: hintText,
              inlineClassName: 'webhook-trigger-hint',
            },
            hoverMessage,
          },
        };

        return [clickableValueDecoration, hintDecoration];
      })
      .flat()
      .filter((d): d is monaco.editor.IModelDeltaDecoration => d !== null);

    if (decorations.length > 0) {
      decorationCollectionRef.current = editor.createDecorationsCollection(decorations);
    }

    // Open the flyout when the `webhook` value OR the inline hint after it is
    // clicked (anywhere from the value start to the end of that line).
    mouseDownDisposableRef.current?.dispose();
    mouseDownDisposableRef.current = editor.onMouseDown((e) => {
      const position = e.target.position;
      if (!position) {
        return;
      }
      const startColumn = webhookLinesRef.current.get(position.lineNumber);
      if (startColumn === undefined) {
        return;
      }
      if (position.column >= startColumn) {
        dispatch(openWebhookFlyout());
      }
    });

    return () => {
      mouseDownDisposableRef.current?.dispose();
      mouseDownDisposableRef.current = null;
    };
  }, [isEditorMounted, yamlDocument, readOnly, editor, dispatch]);

  return { decorationCollectionRef };
};
