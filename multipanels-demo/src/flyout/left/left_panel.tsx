import React, { useMemo, useState } from 'react';
import { css } from '@emotion/react';
import {
  EuiAvatar,
  EuiBadge,
  EuiButton,
  EuiButtonGroup,
  EuiCallOut,
  EuiCodeBlock,
  EuiComment,
  EuiCommentList,
  EuiEmptyPrompt,
  EuiFlexGroup,
  EuiFlexItem,
  EuiFlyoutBody,
  EuiFlyoutHeader,
  EuiHealth,
  EuiHorizontalRule,
  EuiIcon,
  EuiInMemoryTable,
  EuiLink,
  EuiMarkdownFormat,
  EuiPanel,
  EuiSpacer,
  EuiTab,
  EuiTabs,
  EuiText,
  EuiTextArea,
  EuiTitle,
  useEuiTheme,
  type EuiBasicTableColumn,
} from '@elastic/eui';
import type { Alert } from '../../data/alerts';
import { CURRENT_USER, SEVERITY_COLOR } from '../../data/alerts';
import { useAlertsState } from '../../state/alerts_state';
import { type InsightsSubTab, type LeftPanelState, type LeftTab, type VisualizeSubTab, useFlyoutApi } from '../flyout_context';
import { KeyValueList } from '../shared/flyout_blocks';
import { formatDate, RiskLevelBadge, SeverityBadge, StatusBadge, criticalityLabel } from '../../components/formatters';
import { useToasts } from '../../components/toasts';

const TABS: Array<{ id: LeftTab; name: string }> = [
  { id: 'visualize', name: 'Visualize' },
  { id: 'insights', name: 'Insights' },
  { id: 'investigation', name: 'Investigation' },
  { id: 'response', name: 'Response' },
  { id: 'notes', name: 'Notes' },
];

/* -------------------------------------------------------------- visualize */

const VISUALIZE_OPTIONS: Array<{ id: VisualizeSubTab; label: string }> = [
  { id: 'session_view', label: 'Session View' },
  { id: 'analyzer_graph', label: 'Analyzer Graph' },
  { id: 'graph', label: 'Graph' },
];

const SessionView: React.FC<{ alert: Alert }> = ({ alert }) => {
  const { euiTheme } = useEuiTheme();
  const lines = [
    { time: alert.originalTime, user: alert.user.name, cmd: alert.process?.parent.commandLine ?? `${alert.eventAction}`, alert: false },
    { time: alert.timestamp, user: alert.user.name, cmd: alert.process?.commandLine ?? alert.reason, alert: true },
    { time: alert.timestamp, user: alert.user.name, cmd: alert.destination ? `connect ${alert.destination.ip}:${alert.destination.port}` : 'exit 0', alert: false },
  ];
  return (
    <EuiPanel
      paddingSize="m"
      hasShadow={false}
      css={css`
        background: #1d1e24;
        color: #dfe5ef;
        font-family: ${euiTheme.font.familyCode};
        font-size: 12px;
        border-radius: ${euiTheme.border.radius.medium};
      `}
    >
      <div css={css`color: #98a2b3; margin-bottom: 8px;`}>
        session leader {alert.sessionId} · {alert.user.name}@{alert.host.name} · {alert.host.os.name}
      </div>
      {lines.map((line, i) => (
        <div
          key={i}
          css={css`
            display: grid;
            grid-template-columns: 170px 110px 1fr;
            gap: 12px;
            padding: 4px 6px;
            border-left: 3px solid ${line.alert ? SEVERITY_COLOR[alert.severity] : 'transparent'};
            background: ${line.alert ? 'rgba(231, 102, 76, 0.12)' : 'transparent'};
          `}
        >
          <span css={css`color: #98a2b3;`}>{formatDate(line.time)}</span>
          <span css={css`color: #6dccb1;`}>{line.user}</span>
          <span className="eui-textBreakAll">
            {line.alert && <EuiIcon type="warning" color={SEVERITY_COLOR[alert.severity]} size="s" css={css`margin-right: 6px;`} />}
            {line.cmd}
          </span>
        </div>
      ))}
    </EuiPanel>
  );
};

const AnalyzerGraph: React.FC<{ alert: Alert }> = ({ alert }) => {
  const { euiTheme } = useEuiTheme();
  const nodes = [
    { x: 80, y: 150, label: alert.process?.parent.name ?? 'parent', sub: `pid ${alert.process?.parent.pid ?? '—'}`, alert: false },
    { x: 330, y: 150, label: alert.process?.name ?? alert.eventCategory[0], sub: `pid ${alert.process?.pid ?? '—'}`, alert: true },
    { x: 580, y: 70, label: alert.destination ? alert.destination.ip : 'child process', sub: alert.destination ? `port ${alert.destination.port}` : 'pid —', alert: false },
    { x: 580, y: 230, label: alert.file?.name ?? 'network', sub: alert.file ? 'file created' : alert.network?.protocol ?? '', alert: false },
  ];
  return (
    <EuiPanel hasBorder paddingSize="none" hasShadow={false} css={css`overflow: hidden; background: ${euiTheme.colors.backgroundBaseSubdued};`}>
      <svg viewBox="0 0 700 300" width="100%" height="300" role="img" aria-label="Analyzer graph">
        <defs>
          <marker id="arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
            <path d="M0,0 L8,4 L0,8 z" fill="#98a2b3" />
          </marker>
        </defs>
        <line x1={nodes[0].x + 70} y1={nodes[0].y} x2={nodes[1].x - 70} y2={nodes[1].y} stroke="#98a2b3" strokeWidth={2} markerEnd="url(#arrow)" />
        <line x1={nodes[1].x + 70} y1={nodes[1].y} x2={nodes[2].x - 70} y2={nodes[2].y} stroke="#98a2b3" strokeWidth={2} markerEnd="url(#arrow)" />
        <line x1={nodes[1].x + 70} y1={nodes[1].y} x2={nodes[3].x - 70} y2={nodes[3].y} stroke="#98a2b3" strokeWidth={2} markerEnd="url(#arrow)" />
        {nodes.map((node) => (
          <g key={node.label} transform={`translate(${node.x}, ${node.y})`}>
            <rect x={-70} y={-28} width={140} height={56} rx={8} fill={node.alert ? '#fff0ee' : '#fff'} stroke={node.alert ? SEVERITY_COLOR[alert.severity] : '#c9d4e2'} strokeWidth={node.alert ? 2 : 1} />
            <text x={0} y={-6} textAnchor="middle" fontSize={13} fontWeight={600} fill="#1a1c21">
              {node.label.length > 18 ? `${node.label.slice(0, 17)}…` : node.label}
            </text>
            <text x={0} y={14} textAnchor="middle" fontSize={11} fill="#69707d">
              {node.sub}
            </text>
          </g>
        ))}
        <g transform={`translate(${nodes[1].x - 70}, ${nodes[1].y - 44})`}>
          <rect width={64} height={18} rx={9} fill={SEVERITY_COLOR[alert.severity]} />
          <text x={32} y={13} textAnchor="middle" fontSize={11} fill="#fff" fontWeight={600}>
            1 alert
          </text>
        </g>
      </svg>
    </EuiPanel>
  );
};

const VisualizeTab: React.FC<{ alert: Alert; panel: LeftPanelState }> = ({ alert, panel }) => {
  const { openLeftPanel } = useFlyoutApi();
  const selected = panel.visualizeSubTab ?? 'session_view';
  return (
    <>
      <EuiButtonGroup
        legend="Visualize options"
        options={VISUALIZE_OPTIONS}
        idSelected={selected}
        onChange={(id) => openLeftPanel({ tab: 'visualize', visualizeSubTab: id as VisualizeSubTab })}
        color="primary"
        buttonSize="compressed"
      />
      <EuiSpacer size="m" />
      {selected === 'session_view' && <SessionView alert={alert} />}
      {selected === 'analyzer_graph' && <AnalyzerGraph alert={alert} />}
      {selected === 'graph' && (
        <EuiEmptyPrompt
          iconType="graphApp"
          title={<h3>Graph visualization</h3>}
          body={<p>The entity graph requires cloud asset data, which is not part of this demo.</p>}
        />
      )}
    </>
  );
};

/* --------------------------------------------------------------- insights */

const INSIGHTS_OPTIONS: Array<{ id: InsightsSubTab; label: string }> = [
  { id: 'entities', label: 'Entities' },
  { id: 'threat_intelligence', label: 'Threat intelligence' },
  { id: 'prevalence', label: 'Prevalence' },
  { id: 'correlations', label: 'Correlations' },
];

const EntitiesDetails: React.FC<{ alert: Alert }> = ({ alert }) => {
  const { alerts } = useAlertsState();
  const hostAlerts = alerts.filter((a) => a.host.name === alert.host.name);
  const userAlerts = alerts.filter((a) => a.user.name === alert.user.name);
  return (
    <EuiFlexGroup direction="column" gutterSize="m">
      <EuiFlexItem>
        <EuiPanel hasBorder hasShadow={false}>
          <EuiFlexGroup gutterSize="s" alignItems="center" responsive={false}>
            <EuiFlexItem grow={false}>
              <EuiIcon type="user" size="l" />
            </EuiFlexItem>
            <EuiFlexItem>
              <EuiTitle size="xs">
                <h4>{alert.user.name}</h4>
              </EuiTitle>
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <RiskLevelBadge level={alert.user.riskLevel} />
            </EuiFlexItem>
          </EuiFlexGroup>
          <EuiHorizontalRule margin="s" />
          <KeyValueList
            items={[
              { label: 'User ID', value: alert.user.id },
              { label: 'Domain', value: alert.user.domain },
              { label: 'Email', value: alert.user.email },
              { label: 'Groups', value: alert.user.roles.join(', ') },
              { label: 'First seen', value: formatDate(alert.user.firstSeen) },
              { label: 'Last seen', value: formatDate(alert.user.lastSeen) },
              { label: 'Risk score', value: `${alert.user.riskScore} (${alert.user.riskLevel})` },
              { label: 'Asset criticality', value: criticalityLabel(alert.user.criticality) },
              { label: 'Alerts', value: `${userAlerts.length} alerts in the selected time range` },
            ]}
          />
        </EuiPanel>
      </EuiFlexItem>
      <EuiFlexItem>
        <EuiPanel hasBorder hasShadow={false}>
          <EuiFlexGroup gutterSize="s" alignItems="center" responsive={false}>
            <EuiFlexItem grow={false}>
              <EuiIcon type="storage" size="l" />
            </EuiFlexItem>
            <EuiFlexItem>
              <EuiTitle size="xs">
                <h4>{alert.host.name}</h4>
              </EuiTitle>
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <RiskLevelBadge level={alert.host.riskLevel} />
            </EuiFlexItem>
          </EuiFlexGroup>
          <EuiHorizontalRule margin="s" />
          <KeyValueList
            items={[
              { label: 'Host ID', value: alert.host.id },
              { label: 'Operating system', value: `${alert.host.os.name} ${alert.host.os.version}` },
              { label: 'IP addresses', value: alert.host.ip.join(', ') },
              { label: 'MAC addresses', value: alert.host.mac.join(', ') },
              { label: 'Agent status', value: <EuiHealth color={alert.host.agentStatus === 'Healthy' ? 'success' : 'warning'} textSize="xs">{alert.host.agentStatus}</EuiHealth> },
              { label: 'Policy', value: alert.host.policy },
              { label: 'First seen', value: formatDate(alert.host.firstSeen) },
              { label: 'Last seen', value: formatDate(alert.host.lastSeen) },
              { label: 'Risk score', value: `${alert.host.riskScore} (${alert.host.riskLevel})` },
              { label: 'Asset criticality', value: criticalityLabel(alert.host.criticality) },
              { label: 'Alerts', value: `${hostAlerts.length} alerts in the selected time range` },
            ]}
          />
        </EuiPanel>
      </EuiFlexItem>
    </EuiFlexGroup>
  );
};

const ThreatIntelligenceDetails: React.FC<{ alert: Alert }> = ({ alert }) => {
  const indicators = alert.threatMatches
    ? [
        {
          indicator: alert.destination?.ip ?? alert.source?.ip ?? alert.process?.hash.sha256 ?? '—',
          type: alert.destination ? 'ipv4-addr' : 'file',
          feed: 'AbuseCH Feodo Tracker',
          firstSeen: alert.originalTime,
          matched: 'destination.ip',
        },
        ...(alert.threatMatches > 1
          ? [
              {
                indicator: alert.process?.hash.sha256 ?? alert.file?.hash.sha256 ?? '—',
                type: 'file',
                feed: 'Elastic Threat Intel',
                firstSeen: alert.originalTime,
                matched: 'process.hash.sha256',
              },
            ]
          : []),
      ]
    : [];

  if (indicators.length === 0) {
    return <EuiEmptyPrompt iconType="securityAnalyticsApp" title={<h3>No threat intelligence matches</h3>} body={<p>No fields in this alert matched an indicator from your threat intelligence sources.</p>} />;
  }

  return (
    <EuiFlexGroup direction="column" gutterSize="m">
      {indicators.map((item) => (
        <EuiFlexItem key={item.indicator}>
          <EuiPanel hasBorder hasShadow={false}>
            <EuiFlexGroup gutterSize="s" alignItems="center" responsive={false}>
              <EuiFlexItem grow={false}>
                <EuiBadge color="danger">Threat match</EuiBadge>
              </EuiFlexItem>
              <EuiFlexItem>
                <EuiText size="s" className="eui-textBreakAll">
                  <strong>{item.indicator}</strong>
                </EuiText>
              </EuiFlexItem>
            </EuiFlexGroup>
            <EuiHorizontalRule margin="s" />
            <KeyValueList
              items={[
                { label: 'Indicator type', value: item.type },
                { label: 'Matched field', value: item.matched },
                { label: 'Feed', value: item.feed },
                { label: 'Indicator first seen', value: formatDate(item.firstSeen) },
                { label: 'Confidence', value: 'High' },
              ]}
            />
          </EuiPanel>
        </EuiFlexItem>
      ))}
    </EuiFlexGroup>
  );
};

const PrevalenceDetails: React.FC<{ alert: Alert }> = ({ alert }) => {
  const { alerts } = useAlertsState();
  const totalHosts = new Set(alerts.map((a) => a.host.name)).size;
  const totalUsers = new Set(alerts.map((a) => a.user.name)).size;
  const rows = [
    { field: 'host.name', value: alert.host.name, alertCount: alerts.filter((a) => a.host.name === alert.host.name).length, docCount: 1240, hostPct: `${Math.round((1 / totalHosts) * 100)}%`, userPct: `${Math.round((1 / totalUsers) * 100)}%` },
    { field: 'user.name', value: alert.user.name, alertCount: alerts.filter((a) => a.user.name === alert.user.name).length, docCount: 318, hostPct: `${Math.round((1 / totalHosts) * 100)}%`, userPct: `${Math.round((1 / totalUsers) * 100)}%` },
    ...(alert.process ? [{ field: 'process.name', value: alert.process.name, alertCount: alerts.filter((a) => a.process?.name === alert.process?.name).length, docCount: 5891, hostPct: '60%', userPct: '40%' }] : []),
    ...(alert.destination ? [{ field: 'destination.ip', value: alert.destination.ip, alertCount: alerts.filter((a) => a.destination?.ip === alert.destination?.ip).length, docCount: 9, hostPct: '20%', userPct: '20%' }] : []),
  ];
  const columns: Array<EuiBasicTableColumn<(typeof rows)[number]>> = [
    { field: 'field', name: 'Field' },
    { field: 'value', name: 'Value', render: (v: string) => <span className="eui-textBreakAll">{v}</span> },
    { field: 'alertCount', name: 'Alert count', align: 'right' },
    { field: 'docCount', name: 'Document count', align: 'right' },
    { field: 'hostPct', name: 'Host prevalence', align: 'right' },
    { field: 'userPct', name: 'User prevalence', align: 'right' },
  ];
  return (
    <>
      <EuiCallOut size="s" title="Prevalence is computed over the last 30 days of alerts and events in this demo data set." iconType="info" />
      <EuiSpacer size="m" />
      <EuiInMemoryTable items={rows} columns={columns} compressed />
    </>
  );
};

const CorrelationsDetails: React.FC<{ alert: Alert }> = ({ alert }) => {
  const { alerts } = useAlertsState();
  const { openPreviewPanel } = useFlyoutApi();
  const related = alerts.filter((a) => alert.relatedAlertIds.includes(a.id));
  const sameSession = alerts.filter((a) => a.sessionId === alert.sessionId && a.id !== alert.id);

  const columns: Array<EuiBasicTableColumn<Alert>> = [
    { field: 'timestamp', name: '@timestamp', render: (v: string) => formatDate(v), width: '220px' },
    {
      field: 'rule',
      name: 'Rule',
      render: (_: unknown, row: Alert) => (
        <EuiLink onClick={() => openPreviewPanel({ kind: 'alert', alertId: row.id })}>{row.rule.name}</EuiLink>
      ),
    },
    { field: 'severity', name: 'Severity', render: (s: Alert['severity']) => <SeverityBadge severity={s} />, width: '110px' },
    { field: 'status', name: 'Status', render: (s: Alert['status']) => <StatusBadge status={s} />, width: '130px' },
  ];

  const Section: React.FC<{ title: string; items: Alert[] }> = ({ title, items }) => (
    <EuiPanel hasBorder hasShadow={false}>
      <EuiTitle size="xs">
        <h4>
          {items.length} {title}
        </h4>
      </EuiTitle>
      <EuiSpacer size="s" />
      {items.length ? <EuiInMemoryTable items={items} columns={columns} compressed /> : <EuiText size="s" color="subdued">No related alerts.</EuiText>}
    </EuiPanel>
  );

  return (
    <EuiFlexGroup direction="column" gutterSize="m">
      <EuiFlexItem>
        <Section title="alerts related by ancestry" items={related} />
      </EuiFlexItem>
      <EuiFlexItem>
        <Section title="alerts related by session" items={sameSession} />
      </EuiFlexItem>
      <EuiFlexItem>
        <EuiPanel hasBorder hasShadow={false}>
          <EuiTitle size="xs">
            <h4>{alert.caseIds.length} related cases</h4>
          </EuiTitle>
          <EuiSpacer size="s" />
          {alert.caseIds.length ? (
            alert.caseIds.map((id) => (
              <EuiText size="s" key={id}>
                <EuiIcon type="casesApp" size="s" />{' '}
                <EuiLink>
                  #{id.replace('case-', '')} Finance workstation compromise (macro → PowerShell → LSASS dump)
                </EuiLink>{' '}
                <EuiBadge color="hollow">Open</EuiBadge>
              </EuiText>
            ))
          ) : (
            <EuiText size="s" color="subdued">
              This alert is not attached to any case.
            </EuiText>
          )}
        </EuiPanel>
      </EuiFlexItem>
    </EuiFlexGroup>
  );
};

const InsightsTab: React.FC<{ alert: Alert; panel: LeftPanelState }> = ({ alert, panel }) => {
  const { openLeftPanel } = useFlyoutApi();
  const selected = panel.insightsSubTab ?? 'entities';
  return (
    <>
      <EuiButtonGroup
        legend="Insights options"
        options={INSIGHTS_OPTIONS}
        idSelected={selected}
        onChange={(id) => openLeftPanel({ tab: 'insights', insightsSubTab: id as InsightsSubTab })}
        color="primary"
        buttonSize="compressed"
      />
      <EuiSpacer size="m" />
      {selected === 'entities' && <EntitiesDetails alert={alert} />}
      {selected === 'threat_intelligence' && <ThreatIntelligenceDetails alert={alert} />}
      {selected === 'prevalence' && <PrevalenceDetails alert={alert} />}
      {selected === 'correlations' && <CorrelationsDetails alert={alert} />}
    </>
  );
};

/* ---------------------------------------------------------- investigation */

const InvestigationTab: React.FC<{ alert: Alert }> = ({ alert }) => {
  const guide = alert.rule.investigationGuide
    .split('{{user.name}}').join(alert.user.name)
    .split('{{host.name}}').join(alert.host.name);
  return (
    <EuiPanel hasBorder hasShadow={false}>
      <EuiMarkdownFormat textSize="s">{guide}</EuiMarkdownFormat>
    </EuiPanel>
  );
};

/* ---------------------------------------------------------------- response */

const ResponseTab: React.FC<{ alert: Alert }> = ({ alert }) => {
  const { addToast } = useToasts();
  const actions = [
    { id: 'ra-1', action: 'isolate', status: 'Completed', time: alert.timestamp, by: `Rule: ${alert.rule.name}`, output: `Host ${alert.host.name} was isolated by Elastic Defend.` },
    { id: 'ra-2', action: 'kill-process', status: 'Completed', time: alert.timestamp, by: `Rule: ${alert.rule.name}`, output: `Terminated ${alert.process?.name ?? 'process'} (pid ${alert.process?.pid ?? '—'}).` },
  ];
  return (
    <>
      <EuiTitle size="xs">
        <h4>Automated response actions</h4>
      </EuiTitle>
      <EuiSpacer size="s" />
      <EuiFlexGroup direction="column" gutterSize="m">
        {actions.map((item) => (
          <EuiFlexItem key={item.id}>
            <EuiPanel hasBorder hasShadow={false}>
              <EuiFlexGroup alignItems="center" gutterSize="s" responsive={false}>
                <EuiFlexItem grow={false}>
                  <EuiHealth color="success" textSize="s">
                    {item.status}
                  </EuiHealth>
                </EuiFlexItem>
                <EuiFlexItem>
                  <EuiText size="s">
                    <code>{item.action}</code>
                  </EuiText>
                </EuiFlexItem>
                <EuiFlexItem grow={false}>
                  <EuiText size="xs" color="subdued">
                    {formatDate(item.time)}
                  </EuiText>
                </EuiFlexItem>
              </EuiFlexGroup>
              <EuiSpacer size="xs" />
              <EuiText size="xs" color="subdued">
                Submitted by {item.by}
              </EuiText>
              <EuiSpacer size="s" />
              <EuiCodeBlock fontSize="s" paddingSize="s" language="text">
                {item.output}
              </EuiCodeBlock>
            </EuiPanel>
          </EuiFlexItem>
        ))}
      </EuiFlexGroup>
      <EuiSpacer size="m" />
      <EuiButton iconType="consoleApp" size="s" onClick={() => addToast({ title: 'Response console is not part of this demo', color: 'primary' })}>
        Open response console
      </EuiButton>
    </>
  );
};

/* ------------------------------------------------------------------- notes */

const NotesTab: React.FC<{ alert: Alert }> = ({ alert }) => {
  const [draft, setDraft] = useState('');
  const { addNote } = useAlertsState();
  const notes = useMemo(
    () =>
      alert.notes.map((note, i) => ({
        note,
        author: i === 0 && alert.assignees.length && alert.assignees[0] !== CURRENT_USER.uid ? 'Ana Ruiz' : CURRENT_USER.fullName,
        time: new Date(new Date(alert.timestamp).getTime() + (i + 1) * 90_000).toISOString(),
      })),
    [alert]
  );

  return (
    <>
      {notes.length === 0 ? (
        <EuiEmptyPrompt iconType="editorComment" titleSize="xs" title={<h3>No notes have been created for this alert</h3>} body={<p>Add a note below to document your findings.</p>} />
      ) : (
        <EuiCommentList aria-label="Alert notes">
          {notes.map((item, i) => (
            <EuiComment
              key={i}
              username={item.author}
              timestamp={`on ${formatDate(item.time)}`}
              event="added a note"
              timelineAvatar={<EuiAvatar name={item.author} size="m" />}
            >
              <EuiText size="s">
                <p>{item.note}</p>
              </EuiText>
            </EuiComment>
          ))}
        </EuiCommentList>
      )}
      <EuiSpacer size="m" />
      <EuiTextArea
        fullWidth
        placeholder="Add a note..."
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        rows={3}
        data-test-subj="securitySolutionFlyoutAddNoteTextArea"
      />
      <EuiSpacer size="s" />
      <EuiFlexGroup justifyContent="flexEnd" responsive={false}>
        <EuiFlexItem grow={false}>
          <EuiButton
            fill
            size="s"
            isDisabled={!draft.trim()}
            onClick={() => {
              addNote(alert.id, draft.trim());
              setDraft('');
            }}
            data-test-subj="securitySolutionFlyoutAddNoteButton"
          >
            Add note
          </EuiButton>
        </EuiFlexItem>
      </EuiFlexGroup>
    </>
  );
};

/* ------------------------------------------------------------------- panel */

export const LeftPanel: React.FC<{ alert: Alert; panel: LeftPanelState }> = ({ alert, panel }) => {
  const { euiTheme } = useEuiTheme();
  const { openLeftPanel } = useFlyoutApi();

  return (
    <>
      <EuiFlyoutHeader
        hasBorder
        css={css`
          padding: ${euiTheme.size.s} ${euiTheme.size.m} 0 ${euiTheme.size.m};
        `}
      >
        <EuiTabs size="s" bottomBorder={false}>
          {TABS.map((tab) => (
            <EuiTab key={tab.id} isSelected={tab.id === panel.tab} onClick={() => openLeftPanel({ tab: tab.id })} data-test-subj={`securitySolutionFlyout${tab.name}Tab`}>
              {tab.name}
            </EuiTab>
          ))}
        </EuiTabs>
      </EuiFlyoutHeader>
      <EuiFlyoutBody
        css={css`
          .euiFlyoutBody__overflowContent {
            padding: ${euiTheme.size.m};
          }
        `}
      >
        {panel.tab === 'visualize' && <VisualizeTab alert={alert} panel={panel} />}
        {panel.tab === 'insights' && <InsightsTab alert={alert} panel={panel} />}
        {panel.tab === 'investigation' && <InvestigationTab alert={alert} />}
        {panel.tab === 'response' && <ResponseTab alert={alert} />}
        {panel.tab === 'notes' && <NotesTab alert={alert} />}
      </EuiFlyoutBody>
    </>
  );
};
