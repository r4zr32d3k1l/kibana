import React from 'react';
import { css } from '@emotion/react';
import {
  EuiBadge,
  EuiButtonEmpty,
  EuiButtonIcon,
  EuiCodeBlock,
  EuiFlexGroup,
  EuiFlexItem,
  EuiFlyoutBody,
  EuiFlyoutFooter,
  EuiFlyoutHeader,
  EuiHealth,
  EuiHorizontalRule,
  EuiIcon,
  EuiLink,
  EuiMarkdownFormat,
  EuiPanel,
  EuiSpacer,
  EuiText,
  EuiTitle,
  useEuiTheme,
} from '@elastic/eui';
import type { Alert } from '../../data/alerts';
import { HOSTS, RULES, SEVERITY_COLOR, SEVERITY_LABEL, USERS } from '../../data/alerts';
import { useAlertsState } from '../../state/alerts_state';
import { type PreviewPanelState, useFlyoutApi } from '../flyout_context';
import { KeyValueList } from '../shared/flyout_blocks';
import { TakeActionButton } from '../shared/take_action_button';
import { formatDate, RiskLevelBadge, StatusBadge, criticalityLabel } from '../../components/formatters';

const BANNER: Record<PreviewPanelState['kind'], { title: string; color: 'warning' | 'primary' | 'accent' }> = {
  rule: { title: 'Preview rule details', color: 'warning' },
  host: { title: 'Preview host details', color: 'warning' },
  user: { title: 'Preview user details', color: 'warning' },
  alertReason: { title: 'Preview alert reason', color: 'warning' },
  alert: { title: 'Preview alert details', color: 'warning' },
};

/* ------------------------------------------------------------ rule preview */

const RulePreview: React.FC<{ ruleId: string }> = ({ ruleId }) => {
  const rule = Object.values(RULES).find((r) => r.id === ruleId);
  if (!rule) return null;
  return (
    <>
      <EuiTitle size="s">
        <h3>{rule.name}</h3>
      </EuiTitle>
      <EuiSpacer size="xs" />
      <EuiFlexGroup gutterSize="s" alignItems="center" responsive={false}>
        <EuiFlexItem grow={false}>
          <EuiHealth color="success" textSize="xs">
            Enabled
          </EuiHealth>
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiText size="xs" color="subdued">
            Last updated {formatDate(new Date(Date.now() - 86_400_000 * 3).toISOString())} · v{rule.version}
          </EuiText>
        </EuiFlexItem>
      </EuiFlexGroup>
      <EuiSpacer size="m" />
      <EuiPanel hasBorder hasShadow={false}>
        <EuiTitle size="xs">
          <h4>About</h4>
        </EuiTitle>
        <EuiSpacer size="s" />
        <EuiText size="s">{rule.description}</EuiText>
        <EuiSpacer size="s" />
        <KeyValueList
          items={[
            { label: 'Author', value: rule.author.join(', ') },
            { label: 'Severity', value: <EuiBadge color={SEVERITY_COLOR['high']} css={{ color: '#fff' }}>{SEVERITY_LABEL.high}</EuiBadge> },
            { label: 'Risk score', value: '73' },
            { label: 'License', value: rule.license },
            { label: 'Tags', value: <EuiFlexGroup gutterSize="xs" wrap responsive={false}>{rule.tags.map((t) => <EuiFlexItem grow={false} key={t}><EuiBadge color="hollow">{t}</EuiBadge></EuiFlexItem>)}</EuiFlexGroup> },
            { label: 'False positives', value: rule.falsePositives.join(' ') },
            { label: 'References', value: rule.references.length ? rule.references.map((r) => <div key={r}><EuiLink href={r} target="_blank" external>{r}</EuiLink></div>) : '—' },
          ]}
        />
      </EuiPanel>
      <EuiSpacer size="m" />
      <EuiPanel hasBorder hasShadow={false}>
        <EuiTitle size="xs">
          <h4>Definition</h4>
        </EuiTitle>
        <EuiSpacer size="s" />
        <KeyValueList
          items={[
            { label: 'Index patterns', value: rule.index.join(', ') },
            { label: 'Rule type', value: rule.type === 'eql' ? 'Event Correlation' : rule.type === 'machine_learning' ? 'Machine Learning' : 'Custom query' },
            { label: 'MITRE ATT&CK', value: `${rule.tactic.name} (${rule.tactic.id}) › ${rule.technique.name} (${rule.technique.id})` },
          ]}
        />
        <EuiSpacer size="s" />
        <EuiText size="xs" color="subdued">
          Custom query
        </EuiText>
        <EuiCodeBlock language="sql" fontSize="s" paddingSize="s" isCopyable>
          {rule.query}
        </EuiCodeBlock>
      </EuiPanel>
      <EuiSpacer size="m" />
      <EuiPanel hasBorder hasShadow={false}>
        <EuiTitle size="xs">
          <h4>Schedule</h4>
        </EuiTitle>
        <EuiSpacer size="s" />
        <KeyValueList
          items={[
            { label: 'Runs every', value: rule.interval },
            { label: 'Additional look-back time', value: rule.from.replace('now-', '') },
          ]}
        />
      </EuiPanel>
      <EuiSpacer size="m" />
      <EuiPanel hasBorder hasShadow={false}>
        <EuiTitle size="xs">
          <h4>Investigation guide</h4>
        </EuiTitle>
        <EuiSpacer size="s" />
        <EuiMarkdownFormat textSize="s">{rule.investigationGuide}</EuiMarkdownFormat>
      </EuiPanel>
    </>
  );
};

/* ---------------------------------------------------------- entity previews */

const HostPreview: React.FC<{ hostName: string }> = ({ hostName }) => {
  const host = HOSTS[hostName];
  const { alerts } = useAlertsState();
  if (!host) return null;
  const hostAlerts = alerts.filter((a) => a.host.name === hostName);
  return (
    <>
      <EuiFlexGroup gutterSize="s" alignItems="center" responsive={false}>
        <EuiFlexItem grow={false}>
          <EuiIcon type="storage" size="l" />
        </EuiFlexItem>
        <EuiFlexItem>
          <EuiTitle size="s">
            <h3>{host.name}</h3>
          </EuiTitle>
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <RiskLevelBadge level={host.riskLevel} />
        </EuiFlexItem>
      </EuiFlexGroup>
      <EuiText size="xs" color="subdued">
        Last seen {formatDate(host.lastSeen)}
      </EuiText>
      <EuiSpacer size="m" />
      <EuiPanel hasBorder hasShadow={false}>
        <EuiTitle size="xs">
          <h4>Host risk summary</h4>
        </EuiTitle>
        <EuiSpacer size="s" />
        <EuiFlexGroup gutterSize="m" responsive={false}>
          <EuiFlexItem>
            <EuiText size="xs" color="subdued">Risk score</EuiText>
            <EuiTitle size="m"><span>{host.riskScore}</span></EuiTitle>
          </EuiFlexItem>
          <EuiFlexItem>
            <EuiText size="xs" color="subdued">Alerts</EuiText>
            <EuiTitle size="m"><span>{hostAlerts.length}</span></EuiTitle>
          </EuiFlexItem>
          <EuiFlexItem>
            <EuiText size="xs" color="subdued">Asset criticality</EuiText>
            <EuiSpacer size="xs" />
            <EuiBadge color="hollow">{criticalityLabel(host.criticality)}</EuiBadge>
          </EuiFlexItem>
        </EuiFlexGroup>
      </EuiPanel>
      <EuiSpacer size="m" />
      <EuiPanel hasBorder hasShadow={false}>
        <EuiTitle size="xs">
          <h4>Observed data</h4>
        </EuiTitle>
        <EuiSpacer size="s" />
        <KeyValueList
          items={[
            { label: 'Host ID', value: host.id },
            { label: 'First seen', value: formatDate(host.firstSeen) },
            { label: 'Last seen', value: formatDate(host.lastSeen) },
            { label: 'IP addresses', value: host.ip.join(', ') },
            { label: 'MAC addresses', value: host.mac.join(', ') },
            { label: 'Platform', value: host.os.family },
            { label: 'Operating system', value: `${host.os.name} ${host.os.version}` },
            { label: 'Agent status', value: <EuiHealth color={host.agentStatus === 'Healthy' ? 'success' : 'warning'} textSize="xs">{host.agentStatus}</EuiHealth> },
            { label: 'Integration policy', value: host.policy },
          ]}
        />
      </EuiPanel>
    </>
  );
};

const UserPreview: React.FC<{ userName: string }> = ({ userName }) => {
  const user = USERS[userName];
  const { alerts } = useAlertsState();
  if (!user) return null;
  const userAlerts = alerts.filter((a) => a.user.name === userName);
  return (
    <>
      <EuiFlexGroup gutterSize="s" alignItems="center" responsive={false}>
        <EuiFlexItem grow={false}>
          <EuiIcon type="user" size="l" />
        </EuiFlexItem>
        <EuiFlexItem>
          <EuiTitle size="s">
            <h3>{user.name}</h3>
          </EuiTitle>
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <RiskLevelBadge level={user.riskLevel} />
        </EuiFlexItem>
      </EuiFlexGroup>
      <EuiText size="xs" color="subdued">
        Last seen {formatDate(user.lastSeen)}
      </EuiText>
      <EuiSpacer size="m" />
      <EuiPanel hasBorder hasShadow={false}>
        <EuiTitle size="xs">
          <h4>User risk summary</h4>
        </EuiTitle>
        <EuiSpacer size="s" />
        <EuiFlexGroup gutterSize="m" responsive={false}>
          <EuiFlexItem>
            <EuiText size="xs" color="subdued">Risk score</EuiText>
            <EuiTitle size="m"><span>{user.riskScore}</span></EuiTitle>
          </EuiFlexItem>
          <EuiFlexItem>
            <EuiText size="xs" color="subdued">Alerts</EuiText>
            <EuiTitle size="m"><span>{userAlerts.length}</span></EuiTitle>
          </EuiFlexItem>
          <EuiFlexItem>
            <EuiText size="xs" color="subdued">Asset criticality</EuiText>
            <EuiSpacer size="xs" />
            <EuiBadge color="hollow">{criticalityLabel(user.criticality)}</EuiBadge>
          </EuiFlexItem>
        </EuiFlexGroup>
      </EuiPanel>
      <EuiSpacer size="m" />
      <EuiPanel hasBorder hasShadow={false}>
        <EuiTitle size="xs">
          <h4>Observed data</h4>
        </EuiTitle>
        <EuiSpacer size="s" />
        <KeyValueList
          items={[
            { label: 'User ID', value: user.id },
            { label: 'Domain', value: user.domain },
            { label: 'Email', value: user.email },
            { label: 'Groups', value: user.roles.join(', ') },
            { label: 'First seen', value: formatDate(user.firstSeen) },
            { label: 'Last seen', value: formatDate(user.lastSeen) },
          ]}
        />
      </EuiPanel>
    </>
  );
};

/* ----------------------------------------------------- alert reason preview */

const AlertReasonPreview: React.FC<{ alert: Alert }> = ({ alert }) => (
  <>
    <EuiTitle size="s">
      <h3>Alert reason</h3>
    </EuiTitle>
    <EuiSpacer size="m" />
    <EuiText size="s">{alert.reason}</EuiText>
    <EuiSpacer size="m" />
    <EuiPanel hasBorder hasShadow={false} paddingSize="s">
      <KeyValueList
        items={[
          { label: 'event.category', value: alert.eventCategory.join(', ') },
          { label: 'event.action', value: alert.eventAction },
          ...(alert.process ? [{ label: 'process.name', value: alert.process.name }, { label: 'process.parent.name', value: alert.process.parent.name }] : []),
          ...(alert.file ? [{ label: 'file.name', value: alert.file.name }] : []),
          ...(alert.source ? [{ label: 'source.ip', value: `${alert.source.ip}:${alert.source.port}` }] : []),
          { label: 'user.name', value: alert.user.name },
          { label: 'host.name', value: alert.host.name },
        ]}
      />
    </EuiPanel>
  </>
);

/* ------------------------------------------------------------ alert preview */

const AlertPreview: React.FC<{ alert: Alert }> = ({ alert }) => (
  <>
    <EuiBadge color={SEVERITY_COLOR[alert.severity]} css={{ color: alert.severity === 'medium' ? '#1a1c21' : '#fff' }}>
      {SEVERITY_LABEL[alert.severity]}
    </EuiBadge>
    <EuiSpacer size="s" />
    <EuiText size="s" color="subdued">
      {formatDate(alert.timestamp)}
    </EuiText>
    <EuiTitle size="s">
      <h3>{alert.rule.name}</h3>
    </EuiTitle>
    <EuiSpacer size="m" />
    <EuiFlexGroup gutterSize="s" responsive={false}>
      <EuiFlexItem>
        <EuiPanel hasBorder hasShadow={false} paddingSize="s">
          <EuiText size="xs" color="subdued">Status</EuiText>
          <StatusBadge status={alert.status} />
        </EuiPanel>
      </EuiFlexItem>
      <EuiFlexItem>
        <EuiPanel hasBorder hasShadow={false} paddingSize="s">
          <EuiText size="xs" color="subdued">Risk score</EuiText>
          <EuiText size="s"><strong>{alert.riskScore}</strong></EuiText>
        </EuiPanel>
      </EuiFlexItem>
    </EuiFlexGroup>
    <EuiHorizontalRule margin="m" />
    <EuiTitle size="xxs">
      <h5>Rule description</h5>
    </EuiTitle>
    <EuiText size="s">{alert.rule.description}</EuiText>
    <EuiSpacer size="m" />
    <EuiTitle size="xxs">
      <h5>Alert reason</h5>
    </EuiTitle>
    <EuiText size="s">{alert.reason}</EuiText>
    <EuiSpacer size="m" />
    <EuiTitle size="xxs">
      <h5>Highlighted fields</h5>
    </EuiTitle>
    <EuiSpacer size="xs" />
    <KeyValueList
      items={[
        { label: 'host.name', value: alert.host.name },
        { label: 'user.name', value: alert.user.name },
        ...(alert.process ? [{ label: 'process.name', value: alert.process.name }] : []),
        ...(alert.destination ? [{ label: 'destination.ip', value: alert.destination.ip }] : []),
      ]}
    />
  </>
);

/* ----------------------------------------------------------------- section */

export const PreviewSection: React.FC<{ previews: PreviewPanelState[] }> = ({ previews }) => {
  const { euiTheme } = useEuiTheme();
  const { closePreviewPanel, closeAllPreviews, openRightPanel } = useFlyoutApi();
  const { getAlert } = useAlertsState();
  const current = previews[previews.length - 1];
  const banner = BANNER[current.kind];
  const previewAlert = current.kind === 'alert' ? getAlert(current.alertId) : undefined;
  const contextAlert = getAlert(current.alertId);

  return (
    <div
      data-test-subj="securitySolutionFlyoutPreviewSection"
      css={css`
        position: absolute;
        inset: 0 0 0 ${euiTheme.size.l};
        display: flex;
        flex-direction: column;
        background: ${euiTheme.colors.emptyShade};
        box-shadow: -8px 0 16px rgba(0, 0, 0, 0.12);
        border-left: ${euiTheme.border.thin};
        z-index: 1;
      `}
    >
      <div
        css={css`
          background: ${euiTheme.colors.backgroundBaseWarning};
          color: ${euiTheme.colors.textWarning};
          font-size: ${euiTheme.size.m};
          font-weight: ${euiTheme.font.weight.semiBold};
          text-align: center;
          padding: 2px 0;
          border-bottom: 1px solid ${euiTheme.colors.borderBaseWarning};
        `}
        data-test-subj="securitySolutionFlyoutPreviewSectionBanner"
      >
        {banner.title}
      </div>
      <EuiFlexGroup
        justifyContent="spaceBetween"
        alignItems="center"
        gutterSize="none"
        responsive={false}
        css={css`
          padding: ${euiTheme.size.s} ${euiTheme.size.m} 0 ${euiTheme.size.s};
        `}
      >
        <EuiFlexItem grow={false}>
          {previews.length > 1 ? (
            <EuiButtonEmpty size="s" iconType="chevronSingleLeft" onClick={closePreviewPanel} data-test-subj="securitySolutionFlyoutPreviewSectionBackButton">
              Back
            </EuiButtonEmpty>
          ) : (
            <EuiButtonEmpty size="s" iconType="chevronSingleLeft" onClick={closePreviewPanel}>
              Back to alert
            </EuiButtonEmpty>
          )}
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiButtonIcon iconType="cross" aria-label="Close preview" color="text" onClick={closeAllPreviews} data-test-subj="securitySolutionFlyoutPreviewSectionCloseButton" />
        </EuiFlexItem>
      </EuiFlexGroup>
      <EuiFlyoutHeader
        hasBorder
        css={css`
          padding: ${euiTheme.size.xs} ${euiTheme.size.m} ${euiTheme.size.s} ${euiTheme.size.m};
        `}
      >
        <EuiText size="xs" color="subdued">
          {current.kind === 'rule' && 'Rule summary'}
          {current.kind === 'host' && 'Host summary'}
          {current.kind === 'user' && 'User summary'}
          {current.kind === 'alertReason' && 'Alert reason'}
          {current.kind === 'alert' && 'Alert summary'}
        </EuiText>
      </EuiFlyoutHeader>
      <EuiFlyoutBody
        css={css`
          .euiFlyoutBody__overflowContent {
            padding: ${euiTheme.size.m};
          }
        `}
      >
        {current.kind === 'rule' && <RulePreview ruleId={current.ruleId} />}
        {current.kind === 'host' && <HostPreview hostName={current.hostName} />}
        {current.kind === 'user' && <UserPreview userName={current.userName} />}
        {current.kind === 'alertReason' && contextAlert && <AlertReasonPreview alert={contextAlert} />}
        {current.kind === 'alert' && previewAlert && <AlertPreview alert={previewAlert} />}
      </EuiFlyoutBody>
      {current.kind === 'alert' && previewAlert && (
        <EuiFlyoutFooter
          css={css`
            padding: ${euiTheme.size.s} ${euiTheme.size.m};
          `}
          data-test-subj="securitySolutionFlyoutPreviewFooter"
        >
          <EuiFlexGroup justifyContent="flexEnd" alignItems="center" responsive={false}>
            <EuiFlexItem grow={false}>
              <EuiLink onClick={() => openRightPanel(previewAlert.id)} data-test-subj="securitySolutionFlyoutPreviewFooterLink">
                Show full alert details
              </EuiLink>
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <TakeActionButton alert={previewAlert} />
            </EuiFlexItem>
          </EuiFlexGroup>
        </EuiFlyoutFooter>
      )}
      {current.kind === 'rule' && (
        <EuiFlyoutFooter
          css={css`
            padding: ${euiTheme.size.s} ${euiTheme.size.m};
          `}
        >
          <EuiFlexGroup justifyContent="flexEnd" alignItems="center" responsive={false}>
            <EuiFlexItem grow={false}>
              <EuiLink>Show full rule details</EuiLink>
            </EuiFlexItem>
          </EuiFlexGroup>
        </EuiFlyoutFooter>
      )}
    </div>
  );
};
