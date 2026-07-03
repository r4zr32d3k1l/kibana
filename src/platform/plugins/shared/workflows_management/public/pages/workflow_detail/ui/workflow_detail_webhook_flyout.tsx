/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import {
  EuiBadge,
  EuiButton,
  EuiButtonEmpty,
  EuiButtonGroup,
  EuiCallOut,
  EuiCode,
  EuiCodeBlock,
  EuiCopy,
  EuiFieldPassword,
  EuiFieldText,
  EuiFlexGroup,
  EuiFlexItem,
  EuiFlyout,
  EuiFlyoutBody,
  EuiFlyoutFooter,
  EuiFlyoutHeader,
  EuiFormRow,
  EuiHorizontalRule,
  EuiIcon,
  EuiLoadingSpinner,
  EuiPanel,
  EuiSpacer,
  EuiSwitch,
  EuiTab,
  EuiTabs,
  EuiText,
  EuiTitle,
} from '@elastic/eui';
import React, { useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { i18n } from '@kbn/i18n';
import {
  closeWebhookFlyout,
  selectEditorWorkflowDefinition,
  selectIsEnabled,
  selectIsWebhookFlyoutOpen,
  selectWorkflow,
  selectWorkflowDefinition,
  selectWorkflowId,
} from '../../../entities/workflows/store';
import { useKibana } from '../../../hooks/use_kibana';

type AuthType = 'apiKey' | 'basic' | 'none';

interface WebhookInput {
  name: string;
  type: string;
  required: boolean;
}

interface ParsedWebhook {
  auth: AuthType;
  basic?: { username?: string; password?: string };
  inputs: WebhookInput[];
  methods: Array<'GET' | 'POST'>;
}

/** Loose shape of a parsed trigger node — enough to read the webhook config from. */
interface RawWebhookTrigger {
  type?: string;
  auth?: { type?: AuthType; username?: string; password?: string };
  inputs?: { properties?: Record<string, { type?: string; required?: boolean }> };
}

/** Pull the webhook trigger config out of the parsed workflow definition. */
function useParsedWebhook(): ParsedWebhook | null {
  // The editor-computed definition is only populated once the YAML has been
  // processed; fall back to the loaded workflow's definition so the flyout has
  // data the moment it opens (e.g. viewing a saved workflow without editing).
  const editorDefinition = useSelector(selectEditorWorkflowDefinition);
  const computedDefinition = useSelector(selectWorkflowDefinition);
  const workflow = useSelector(selectWorkflow);
  const definition = editorDefinition ?? computedDefinition ?? workflow?.definition;
  return useMemo(() => {
    const triggers = (definition?.triggers ?? []) as RawWebhookTrigger[];
    const webhook = triggers.find((t) => t?.type === 'webhook');
    if (!webhook) {
      return null;
    }
    const authType: AuthType = webhook.auth?.type ?? 'none';
    const properties = webhook.inputs?.properties ?? {};
    const inputs: WebhookInput[] = Object.entries(properties).map(([name, def]) => ({
      name,
      type: def?.type ?? 'string',
      required: Boolean(def?.required),
    }));
    return {
      auth: authType,
      basic:
        authType === 'basic'
          ? { username: webhook.auth?.username, password: webhook.auth?.password }
          : undefined,
      inputs,
      methods: ['GET', 'POST'],
    };
  }, [definition]);
}

const AUTH_LABEL: Record<AuthType, string> = {
  apiKey: 'API key',
  basic: 'Basic',
  none: 'None',
};

const AuthBadge: React.FC<{ auth: AuthType }> = ({ auth }) => {
  const color = auth === 'none' ? 'danger' : auth === 'basic' ? 'warning' : 'success';
  return (
    <EuiBadge color={color} iconType={auth === 'none' ? 'lockOpen' : 'lock'}>
      {AUTH_LABEL[auth]}
    </EuiBadge>
  );
};

const CopyableUrl: React.FC<{ label: string; url: string; hint?: string; test?: boolean }> = ({
  label,
  url,
  hint,
  test,
}) => (
  <EuiFormRow label={label} helpText={hint} fullWidth>
    <EuiFlexGroup gutterSize="s" responsive={false} alignItems="center">
      <EuiFlexItem>
        <EuiFieldText
          fullWidth
          readOnly
          value={url}
          prepend={
            <EuiBadge color={test ? 'hollow' : '#0077CC'}>{test ? 'TEST' : 'PROD'}</EuiBadge>
          }
        />
      </EuiFlexItem>
      <EuiFlexItem grow={false}>
        <EuiCopy textToCopy={url}>
          {(copy) => (
            <EuiButton size="s" iconType="copyClipboard" onClick={copy}>
              {'Copy'}
            </EuiButton>
          )}
        </EuiCopy>
      </EuiFlexItem>
    </EuiFlexGroup>
  </EuiFormRow>
);

function buildCurl(baseUrl: string, webhook: ParsedWebhook, method: 'GET' | 'POST'): string {
  const authFlag =
    webhook.auth === 'basic'
      ? `-u '${webhook.basic?.username ?? 'user'}:${webhook.basic?.password ?? 'password'}'`
      : webhook.auth === 'apiKey'
      ? `-H 'Authorization: ApiKey <your-api-key>'`
      : '';
  const sample = (name: string) =>
    name.toLowerCase().includes('message')
      ? 'hello from curl'
      : name.toLowerCase().includes('name')
      ? 'tal'
      : 'value';
  if (method === 'GET') {
    const query = webhook.inputs
      .map((i) => `${i.name}=${encodeURIComponent(sample(i.name))}`)
      .join('&');
    return ['curl', authFlag, `'${baseUrl}${query ? `?${query}` : ''}'`].filter(Boolean).join(' ');
  }
  const body = webhook.inputs.reduce<Record<string, string>>((acc, i) => {
    acc[i.name] = sample(i.name);
    return acc;
  }, {});
  return [
    `curl -X POST '${baseUrl}'`,
    authFlag,
    `-H 'Content-Type: application/json'`,
    `-d '${JSON.stringify(body)}'`,
  ]
    .filter(Boolean)
    .join(' \\\n  ');
}

type TabId = 'urls' | 'auth';

export const WorkflowDetailWebhookFlyout: React.FC = () => {
  const dispatch = useDispatch();
  const isOpen = useSelector(selectIsWebhookFlyoutOpen);
  const enabled = useSelector(selectIsEnabled);
  const workflowId = useSelector(selectWorkflowId) ?? 'my-workflow';
  const webhook = useParsedWebhook();
  const { http } = useKibana().services;

  const [tab, setTab] = useState<TabId>('urls');
  const [method, setMethod] = useState<'GET' | 'POST'>('POST');
  const [listenState, setListenState] = useState<'idle' | 'waiting' | 'received'>('idle');
  // Prototype: where Basic-auth credentials live — inline in the YAML, or in a
  // (future) secrets store managed from this flyout.
  const [storeInSecrets, setStoreInSecrets] = useState(false);
  const [secretUsername, setSecretUsername] = useState(webhook?.basic?.username ?? '');
  const [secretPassword, setSecretPassword] = useState(webhook?.basic?.password ?? '');

  const base = http?.basePath?.publicBaseUrl ?? 'https://<your-kibana>';
  const prodUrl = `${base}/api/workflows/${workflowId}/execute`;
  const testUrl = `${base}/api/workflows/${workflowId}/execute/test`;

  if (!isOpen) {
    return null;
  }

  const close = () => dispatch(closeWebhookFlyout());

  // Listen-for-event is a UX placeholder in this build — simulate a captured event.
  const startListening = () => {
    setTab('urls');
    setListenState('waiting');
    window.setTimeout(() => setListenState('received'), 1500);
  };

  return (
    <EuiFlyout onClose={close} size="m" ownFocus aria-labelledby="webhook-flyout-title">
      <EuiFlyoutHeader hasBorder={false}>
        <EuiFlexGroup alignItems="center" gutterSize="s" responsive={false}>
          <EuiFlexItem grow={false}>
            <EuiIcon type="logoWebhook" size="l" />
          </EuiFlexItem>
          <EuiFlexItem>
            <EuiTitle size="m">
              <h2 id="webhook-flyout-title">{'Webhook trigger'}</h2>
            </EuiTitle>
            <EuiText size="xs" color="subdued">
              {'Reflects the '}
              <EuiCode>{'type: webhook'}</EuiCode>
              {' trigger in your YAML'}
            </EuiText>
          </EuiFlexItem>
          {webhook && (
            <EuiFlexItem grow={false}>
              <AuthBadge auth={webhook.auth} />
            </EuiFlexItem>
          )}
        </EuiFlexGroup>
        <EuiSpacer size="s" />
        <EuiTabs>
          <EuiTab
            isSelected={tab === 'urls'}
            onClick={() => setTab('urls')}
            prepend={<EuiIcon type="link" />}
            append={listenState === 'waiting' ? <EuiLoadingSpinner size="s" /> : undefined}
          >
            {'URLs & testing'}
          </EuiTab>
          <EuiTab
            isSelected={tab === 'auth'}
            onClick={() => setTab('auth')}
            prepend={<EuiIcon type="lock" />}
          >
            {'Auth & inputs'}
          </EuiTab>
        </EuiTabs>
      </EuiFlyoutHeader>

      <EuiFlyoutBody>
        {!webhook && (
          <EuiCallOut color="warning" title="No webhook trigger found" iconType="help" size="s">
            <p>
              {'This flyout reflects a '}
              <EuiCode>{'type: webhook'}</EuiCode>
              {' trigger in the YAML. Add one to configure it here.'}
            </p>
          </EuiCallOut>
        )}

        {webhook && (
          <>
            {!enabled && (
              <>
                <EuiCallOut
                  size="s"
                  color="warning"
                  iconType="pause"
                  title="Workflow is disabled — the production URL returns 404"
                >
                  <p>
                    {
                      'Enable the workflow to accept production requests. The test URL still works while you build.'
                    }
                  </p>
                </EuiCallOut>
                <EuiSpacer />
              </>
            )}

            {tab === 'urls' && (
              <>
                <CopyableUrl
                  label="Test URL"
                  test
                  url={testUrl}
                  hint="Safe to hit while building. Tagged as a test run; never counts as production."
                />
                <CopyableUrl
                  label="Production URL"
                  url={prodUrl}
                  hint="Live endpoint. Only accepts requests when the workflow is enabled."
                />
                <EuiHorizontalRule margin="m" />
                <EuiFormRow label="Method">
                  <EuiButtonGroup
                    legend="method"
                    idSelected={method}
                    onChange={(id) => setMethod(id as 'GET' | 'POST')}
                    options={webhook.methods.map((m) => ({ id: m, label: m }))}
                  />
                </EuiFormRow>
                <EuiSpacer size="s" />
                <EuiCodeBlock language="bash" fontSize="m" paddingSize="m" isCopyable>
                  {buildCurl(method === 'GET' ? testUrl : testUrl, webhook, method)}
                </EuiCodeBlock>
                <EuiSpacer size="s" />
                <EuiText size="xs" color="subdued">
                  {
                    "Inputs come from the trigger's declared inputs. Required inputs missing from the request are rejected before any step runs."
                  }
                </EuiText>

                <EuiHorizontalRule margin="m" />
                <EuiTitle size="xs">
                  <h3>{'Listen for a test event'}</h3>
                </EuiTitle>
                <EuiSpacer size="s" />
                {listenState === 'idle' && (
                  <EuiPanel color="subdued" hasShadow={false} paddingSize="l">
                    <EuiText size="s">
                      <p>
                        {
                          'Start listening, then hit the test URL. The next request is captured here with its payload.'
                        }
                      </p>
                    </EuiText>
                    <EuiSpacer size="s" />
                    <EuiButton fill iconType="play" onClick={startListening}>
                      {'Start listening'}
                    </EuiButton>
                  </EuiPanel>
                )}
                {listenState === 'waiting' && (
                  <EuiPanel color="subdued" hasShadow={false} paddingSize="l">
                    <EuiFlexGroup alignItems="center" gutterSize="m" responsive={false}>
                      <EuiFlexItem grow={false}>
                        <EuiLoadingSpinner size="l" />
                      </EuiFlexItem>
                      <EuiFlexItem>
                        <EuiTitle size="xs">
                          <h3>{'Waiting for a test request…'}</h3>
                        </EuiTitle>
                        <EuiText size="s" color="subdued">
                          {'Listening on the test URL.'}
                        </EuiText>
                      </EuiFlexItem>
                    </EuiFlexGroup>
                  </EuiPanel>
                )}
                {listenState === 'received' && (
                  <>
                    <EuiCallOut size="s" color="success" iconType="check" title="Event received">
                      <p>{'Captured a test request and mapped it onto the declared inputs.'}</p>
                    </EuiCallOut>
                    <EuiSpacer />
                    <EuiTitle size="xs">
                      <h4>{'Received payload'}</h4>
                    </EuiTitle>
                    <EuiSpacer size="s" />
                    <EuiCodeBlock language="json" paddingSize="m" fontSize="m" isCopyable>
                      {JSON.stringify(
                        webhook.inputs.reduce<Record<string, string>>((acc, i) => {
                          acc[i.name] = i.name.toLowerCase().includes('message')
                            ? 'hello from curl'
                            : 'tal';
                          return acc;
                        }, {}),
                        null,
                        2
                      )}
                    </EuiCodeBlock>
                    <EuiSpacer />
                    <EuiButton iconType="refresh" onClick={startListening}>
                      {'Listen again'}
                    </EuiButton>
                  </>
                )}
              </>
            )}

            {tab === 'auth' && (
              <>
                <EuiText size="s">
                  <p>
                    {"Auth is configured in the YAML under the trigger's "}
                    <EuiCode>{'auth'}</EuiCode>
                    {
                      ' block. YAML is the source of truth — edit it there; this panel reflects the current setting.'
                    }
                  </p>
                </EuiText>
                <EuiSpacer size="s" />
                <EuiFlexGroup gutterSize="s" responsive={false} alignItems="center">
                  <EuiFlexItem grow={false}>
                    <EuiText size="s">{'Current method:'}</EuiText>
                  </EuiFlexItem>
                  <EuiFlexItem grow={false}>
                    <AuthBadge auth={webhook.auth} />
                  </EuiFlexItem>
                </EuiFlexGroup>
                <EuiSpacer size="m" />
                {webhook.auth === 'apiKey' && (
                  <EuiCallOut
                    size="s"
                    color="primary"
                    iconType="key"
                    title="Uses the existing workflows API key mechanism"
                  >
                    <p>
                      {'Callers send '}
                      <EuiCode>{'Authorization: ApiKey <key>'}</EuiCode>
                      {
                        '. Keys are managed outside the YAML, so nothing secret is written to the definition.'
                      }
                    </p>
                  </EuiCallOut>
                )}
                {webhook.auth === 'basic' && (
                  <>
                    <EuiSwitch
                      label={i18n.translate('workflows.webhookFlyout.storeInSecretsToggle', {
                        defaultMessage:
                          'Store credentials in the secrets store (instead of the YAML)',
                      })}
                      checked={storeInSecrets}
                      onChange={(e) => setStoreInSecrets(e.target.checked)}
                    />
                    <EuiSpacer size="m" />
                    {storeInSecrets ? (
                      <>
                        <EuiCallOut
                          size="s"
                          color="success"
                          iconType="lock"
                          title="Credentials are kept in the secrets store"
                        >
                          <p>
                            {
                              'The username and password are stored encrypted, outside the workflow YAML. The definition only references them by handle — nothing secret is written to the YAML.'
                            }
                          </p>
                        </EuiCallOut>
                        <EuiSpacer size="m" />
                        <EuiFormRow label="Username" fullWidth>
                          <EuiFieldText
                            fullWidth
                            value={secretUsername}
                            onChange={(e) => setSecretUsername(e.target.value)}
                          />
                        </EuiFormRow>
                        <EuiFormRow
                          label="Password"
                          fullWidth
                          helpText="Stored in the secrets store, not the workflow definition."
                        >
                          <EuiFieldPassword
                            type="dual"
                            fullWidth
                            value={secretPassword}
                            onChange={(e) => setSecretPassword(e.target.value)}
                          />
                        </EuiFormRow>
                      </>
                    ) : (
                      <EuiCallOut
                        size="s"
                        color="warning"
                        iconType="warning"
                        title="Credentials are stored in plaintext in the YAML"
                      >
                        <p>
                          {
                            'The username and password live in the workflow definition and are visible to anyone who can read it. Toggle above to keep them in the secrets store instead, or use an API key.'
                          }
                        </p>
                      </EuiCallOut>
                    )}
                  </>
                )}
                {webhook.auth === 'none' && (
                  <EuiCallOut
                    size="s"
                    color="danger"
                    iconType="warning"
                    title="Anyone with the URL can trigger this workflow"
                  >
                    <p>
                      {
                        'No authentication. Only use for throwaway tests; never enable a production URL with no auth.'
                      }
                    </p>
                  </EuiCallOut>
                )}

                <EuiHorizontalRule margin="l" />
                <EuiTitle size="xs">
                  <h3>{'Declared inputs'}</h3>
                </EuiTitle>
                <EuiSpacer size="s" />
                {webhook.inputs.length === 0 ? (
                  <EuiText size="s" color="subdued">
                    <p>
                      {'No inputs declared. Add them under '}
                      <EuiCode>{'inputs.properties'}</EuiCode>
                      {' in the YAML.'}
                    </p>
                  </EuiText>
                ) : (
                  webhook.inputs.map((input) => (
                    <EuiPanel
                      key={input.name}
                      hasShadow={false}
                      hasBorder
                      paddingSize="s"
                      style={{ marginBottom: 8 }}
                    >
                      <EuiFlexGroup alignItems="center" gutterSize="s" responsive={false}>
                        <EuiFlexItem grow={false}>
                          <EuiCode>{input.name}</EuiCode>
                        </EuiFlexItem>
                        <EuiFlexItem grow={false}>
                          <EuiBadge color="hollow">{input.type}</EuiBadge>
                        </EuiFlexItem>
                        <EuiFlexItem grow={false}>
                          {input.required ? (
                            <EuiBadge color="accent">{'required'}</EuiBadge>
                          ) : (
                            <EuiBadge color="default">{'optional'}</EuiBadge>
                          )}
                        </EuiFlexItem>
                      </EuiFlexGroup>
                    </EuiPanel>
                  ))
                )}
              </>
            )}
          </>
        )}
      </EuiFlyoutBody>

      <EuiFlyoutFooter>
        <EuiFlexGroup justifyContent="spaceBetween" responsive={false}>
          <EuiFlexItem grow={false}>
            <EuiButtonEmpty iconType="cross" onClick={close}>
              {i18n.translate('workflows.webhookFlyout.close', { defaultMessage: 'Close' })}
            </EuiButtonEmpty>
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiButton fill iconType="beaker" onClick={startListening} isDisabled={!webhook}>
              {i18n.translate('workflows.webhookFlyout.listen', {
                defaultMessage: 'Listen for test event',
              })}
            </EuiButton>
          </EuiFlexItem>
        </EuiFlexGroup>
      </EuiFlyoutFooter>
    </EuiFlyout>
  );
};
