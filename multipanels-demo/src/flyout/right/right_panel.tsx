import React, { useMemo, useState } from 'react';
import { css } from '@emotion/react';
import {
  EuiAvatar,
  EuiBadge,
  EuiButtonEmpty,
  EuiButtonIcon,
  EuiCodeBlock,
  EuiFieldSearch,
  EuiFlexGroup,
  EuiFlexItem,
  EuiFlyoutBody,
  EuiFlyoutFooter,
  EuiFlyoutHeader,
  EuiHorizontalRule,
  EuiIcon,
  EuiInMemoryTable,
  EuiLink,
  EuiPanel,
  EuiPopover,
  EuiSelectable,
  EuiSpacer,
  EuiTab,
  EuiTabs,
  EuiText,
  EuiTitle,
  EuiToolTip,
  useEuiTheme,
  type EuiBasicTableColumn,
  type EuiSelectableOption,
} from '@elastic/eui';
import type { Alert } from '../../data/alerts';
import { alertToDocument, HIGHLIGHTED_FIELDS, SEVERITY_COLOR, SEVERITY_LABEL, USERS_DIRECTORY } from '../../data/alerts';
import { useAlertsState } from '../../state/alerts_state';
import { type RightPanelState, type RightTab, useFlyoutApi } from '../flyout_context';
import { FlyoutNavigation } from '../shared/flyout_navigation';
import { ExpandableSection, FlyoutHeaderBlock, InsightsSummaryRow, KeyValueList, SectionTitleAction } from '../shared/flyout_blocks';
import { TakeActionButton } from '../shared/take_action_button';
import { formatDate, RiskLevelBadge, StatusBadge, criticalityLabel } from '../../components/formatters';
import { useToasts } from '../../components/toasts';

const TABS: Array<{ id: RightTab; name: string }> = [
  { id: 'overview', name: 'Overview' },
  { id: 'table', name: 'Table' },
  { id: 'json', name: 'JSON' },
];

/* ------------------------------------------------------------------ header */

const AssigneesBlock: React.FC<{ alert: Alert }> = ({ alert }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { setAssignees } = useAlertsState();
  const options: EuiSelectableOption[] = Object.values(USERS_DIRECTORY).map((user) => ({
    key: user.uid,
    label: user.fullName,
    checked: alert.assignees.includes(user.uid) ? 'on' : undefined,
    prepend: <EuiAvatar name={user.fullName} initials={user.initials} color={user.color} size="s" />,
  }));

  return (
    <FlyoutHeaderBlock title="Assignees" data-test-subj="securitySolutionFlyoutHeaderAssignees">
      <EuiFlexGroup gutterSize="xs" alignItems="center" responsive={false}>
        {alert.assignees.map((uid) => {
          const user = USERS_DIRECTORY[uid];
          return user ? (
            <EuiFlexItem grow={false} key={uid}>
              <EuiToolTip content={user.fullName}>
                <EuiAvatar name={user.fullName} initials={user.initials} color={user.color} size="s" />
              </EuiToolTip>
            </EuiFlexItem>
          ) : null;
        })}
        <EuiFlexItem grow={false}>
          <EuiPopover
            button={
              <EuiToolTip content="Assign alert">
                <EuiButtonIcon
                  iconType="plusCircle"
                  aria-label="Assign alert"
                  color="text"
                  size="xs"
                  onClick={() => setIsOpen((open) => !open)}
                />
              </EuiToolTip>
            }
            isOpen={isOpen}
            closePopover={() => setIsOpen(false)}
            panelPaddingSize="none"
          >
            <EuiSelectable
              searchable
              searchProps={{ placeholder: 'Search users', compressed: true }}
              options={options}
              onChange={(next) => setAssignees(alert.id, next.filter((o) => o.checked === 'on').map((o) => o.key as string))}
              listProps={{ bordered: false }}
              css={css`
                width: 260px;
              `}
            >
              {(list, search) => (
                <>
                  <div css={css`padding: 8px;`}>{search}</div>
                  {list}
                </>
              )}
            </EuiSelectable>
          </EuiPopover>
        </EuiFlexItem>
      </EuiFlexGroup>
    </FlyoutHeaderBlock>
  );
};

const AlertHeaderTitle: React.FC<{ alert: Alert }> = ({ alert }) => {
  const { euiTheme } = useEuiTheme();
  const { openPreviewPanel, openLeftPanel } = useFlyoutApi();

  return (
    <>
      <EuiFlexGroup gutterSize="s" alignItems="center" responsive={false}>
        <EuiFlexItem grow={false}>
          <EuiBadge
            color={SEVERITY_COLOR[alert.severity]}
            css={css`
              color: ${alert.severity === 'medium' ? '#1a1c21' : '#fff'};
            `}
          >
            {SEVERITY_LABEL[alert.severity]}
          </EuiBadge>
        </EuiFlexItem>
        {alert.status === 'closed' && (
          <EuiFlexItem grow={false}>
            <EuiBadge color="hollow">Closed</EuiBadge>
          </EuiFlexItem>
        )}
      </EuiFlexGroup>
      <EuiSpacer size="m" />
      <EuiText size="s" color="subdued" data-test-subj="securitySolutionFlyoutHeaderTimestamp">
        {formatDate(alert.timestamp)}
      </EuiText>
      <EuiSpacer size="xs" />
      <EuiFlexGroup gutterSize="s" alignItems="center" responsive={false}>
        <EuiFlexItem>
          <EuiTitle size="s">
            <h2 data-test-subj="securitySolutionFlyoutHeaderTitle">{alert.rule.name}</h2>
          </EuiTitle>
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiToolTip content="Show rule summary">
            <EuiButtonIcon
              iconType="maximize"
              aria-label="Show rule summary"
              color="primary"
              size="xs"
              onClick={() => openPreviewPanel({ kind: 'rule', ruleId: alert.rule.id, alertId: alert.id })}
              data-test-subj="securitySolutionFlyoutAlertTitleRulePreviewButton"
            />
          </EuiToolTip>
        </EuiFlexItem>
      </EuiFlexGroup>
      <EuiSpacer size="m" />
      <div
        css={css`
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: ${euiTheme.size.s};
        `}
      >
        <FlyoutHeaderBlock title="Status" data-test-subj="securitySolutionFlyoutHeaderStatus">
          <StatusBadge status={alert.status} />
        </FlyoutHeaderBlock>
        <FlyoutHeaderBlock title="Risk score" data-test-subj="securitySolutionFlyoutHeaderRiskScore">
          <EuiText size="s">
            <strong>{alert.riskScore}</strong>
          </EuiText>
        </FlyoutHeaderBlock>
        <AssigneesBlock alert={alert} />
        <FlyoutHeaderBlock title="Notes" data-test-subj="securitySolutionFlyoutHeaderNotes">
          <EuiFlexGroup gutterSize="xs" alignItems="center" responsive={false}>
            <EuiFlexItem grow={false}>
              <EuiLink onClick={() => openLeftPanel({ tab: 'notes' })}>
                <EuiFlexGroup gutterSize="xs" alignItems="center" responsive={false}>
                  <EuiIcon type="editorComment" size="s" />
                  <span>{alert.notes.length}</span>
                </EuiFlexGroup>
              </EuiLink>
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <EuiToolTip content="Add note">
                <EuiButtonIcon
                  iconType="plusCircle"
                  aria-label="Add note"
                  color="text"
                  size="xs"
                  onClick={() => openLeftPanel({ tab: 'notes' })}
                />
              </EuiToolTip>
            </EuiFlexItem>
          </EuiFlexGroup>
        </FlyoutHeaderBlock>
      </div>
    </>
  );
};

/* ----------------------------------------------------------- overview tab */

const HighlightedFields: React.FC<{ alert: Alert }> = ({ alert }) => {
  const { openPreviewPanel } = useFlyoutApi();
  const doc = useMemo(() => alertToDocument(alert), [alert]);
  const rows = HIGHLIGHTED_FIELDS.filter((field) => doc[field] !== undefined).map((field) => ({
    field,
    value: doc[field],
  }));

  const renderValue = (field: string, value: unknown) => {
    const text = Array.isArray(value) ? value.join(', ') : String(value);
    if (field === 'host.name') {
      return <EuiLink onClick={() => openPreviewPanel({ kind: 'host', hostName: text, alertId: alert.id })}>{text}</EuiLink>;
    }
    if (field === 'user.name') {
      return <EuiLink onClick={() => openPreviewPanel({ kind: 'user', userName: text, alertId: alert.id })}>{text}</EuiLink>;
    }
    return <span className="eui-textBreakAll">{text}</span>;
  };

  const columns: Array<EuiBasicTableColumn<{ field: string; value: unknown }>> = [
    { field: 'field', name: 'Field', width: '35%', render: (field: string) => <EuiText size="xs">{field}</EuiText> },
    {
      field: 'value',
      name: 'Value',
      render: (value: unknown, row) => <EuiText size="xs">{renderValue(row.field, value)}</EuiText>,
    },
  ];

  return (
    <>
      <EuiTitle size="xxs">
        <h5>Highlighted fields</h5>
      </EuiTitle>
      <EuiSpacer size="xs" />
      <EuiInMemoryTable items={rows} columns={columns} compressed tableLayout="auto" />
    </>
  );
};

const AboutSection: React.FC<{ alert: Alert }> = ({ alert }) => {
  const { openPreviewPanel } = useFlyoutApi();
  return (
    <ExpandableSection title="About" data-test-subj="securitySolutionFlyoutAboutSection">
      <EuiTitle size="xxs">
        <h5>
          Rule description{' '}
          <EuiToolTip content="Show rule summary">
            <EuiButtonIcon
              iconType="maximize"
              aria-label="Show rule summary"
              size="xs"
              color="primary"
              onClick={() => openPreviewPanel({ kind: 'rule', ruleId: alert.rule.id, alertId: alert.id })}
            />
          </EuiToolTip>
        </h5>
      </EuiTitle>
      <EuiText size="s">{alert.rule.description}</EuiText>
      <EuiSpacer size="m" />
      <EuiTitle size="xxs">
        <h5>
          Alert reason{' '}
          <EuiToolTip content="Show full reason">
            <EuiButtonIcon
              iconType="maximize"
              aria-label="Show full reason"
              size="xs"
              color="primary"
              onClick={() => openPreviewPanel({ kind: 'alertReason', alertId: alert.id })}
            />
          </EuiToolTip>
        </h5>
      </EuiTitle>
      <EuiText size="s">{alert.reason}</EuiText>
      <EuiSpacer size="m" />
      <EuiTitle size="xxs">
        <h5>MITRE ATT&CK</h5>
      </EuiTitle>
      <EuiSpacer size="xs" />
      <EuiText size="s">
        <EuiLink href={alert.rule.tactic.reference} target="_blank" external>
          {alert.rule.tactic.name} ({alert.rule.tactic.id})
        </EuiLink>
        <ul css={css`margin: 4px 0 0 0;`}>
          <li>
            <EuiLink href={alert.rule.technique.reference} target="_blank" external>
              {alert.rule.technique.name} ({alert.rule.technique.id})
            </EuiLink>
          </li>
        </ul>
      </EuiText>
    </ExpandableSection>
  );
};

const InvestigationSection: React.FC<{ alert: Alert }> = ({ alert }) => {
  const { openLeftPanel } = useFlyoutApi();
  return (
    <ExpandableSection title="Investigation" data-test-subj="securitySolutionFlyoutInvestigationSection">
      <EuiButtonEmpty
        iconType="documentation"
        size="s"
        flush="left"
        onClick={() => openLeftPanel({ tab: 'investigation' })}
        data-test-subj="securitySolutionFlyoutInvestigationGuideButton"
      >
        Show investigation guide
      </EuiButtonEmpty>
      <EuiSpacer size="s" />
      <HighlightedFields alert={alert} />
    </ExpandableSection>
  );
};

const VisualizationsSection: React.FC<{ alert: Alert }> = ({ alert }) => {
  const { openLeftPanel } = useFlyoutApi();
  const { euiTheme } = useEuiTheme();
  return (
    <ExpandableSection title="Visualizations" initialIsOpen={false} data-test-subj="securitySolutionFlyoutVisualizationsSection">
      <EuiTitle size="xxs">
        <h5>Analyzer preview</h5>
      </EuiTitle>
      <EuiSpacer size="xs" />
      <EuiPanel hasBorder paddingSize="s" hasShadow={false}>
        <EuiFlexGroup direction="column" gutterSize="xs">
          {[
            alert.process?.parent.name ? `${alert.process.parent.name}` : 'parent process',
            alert.process?.name ?? alert.eventCategory[0],
            `${alert.ancestors} ancestors · ${alert.relatedAlertIds.length} related alerts`,
          ].map((label, depth) => (
            <EuiFlexItem key={label}>
              <EuiFlexGroup gutterSize="s" alignItems="center" responsive={false} css={css`padding-left: ${depth * 20}px;`}>
                <EuiFlexItem grow={false}>
                  <EuiIcon type={depth === 2 ? 'dot' : 'analyzeEvent'} color={depth === 1 ? euiTheme.colors.danger : 'subdued'} size="s" />
                </EuiFlexItem>
                <EuiFlexItem>
                  <EuiText size="xs">{label}</EuiText>
                </EuiFlexItem>
              </EuiFlexGroup>
            </EuiFlexItem>
          ))}
        </EuiFlexGroup>
        <EuiSpacer size="s" />
        <EuiButtonEmpty size="xs" flush="left" iconType="chevronLimitLeft" onClick={() => openLeftPanel({ tab: 'visualize', visualizeSubTab: 'analyzer_graph' })}>
          Open analyzer graph
        </EuiButtonEmpty>
      </EuiPanel>
      <EuiSpacer size="s" />
      <EuiTitle size="xxs">
        <h5>Session view preview</h5>
      </EuiTitle>
      <EuiSpacer size="xs" />
      <EuiPanel hasBorder paddingSize="s" hasShadow={false}>
        <EuiText size="xs" color="subdued">
          Session {alert.sessionId} · {alert.user.name}@{alert.host.name}
        </EuiText>
        <EuiCodeBlock language="bash" fontSize="s" paddingSize="s" transparentBackground>
          {alert.process?.commandLine ?? `${alert.eventAction} (${alert.eventCategory.join(', ')})`}
        </EuiCodeBlock>
        <EuiButtonEmpty size="xs" flush="left" iconType="chevronLimitLeft" onClick={() => openLeftPanel({ tab: 'visualize', visualizeSubTab: 'session_view' })}>
          Open session view
        </EuiButtonEmpty>
      </EuiPanel>
    </ExpandableSection>
  );
};

const EntityOverview: React.FC<{ alert: Alert }> = ({ alert }) => {
  const { openPreviewPanel } = useFlyoutApi();
  const { euiTheme } = useEuiTheme();
  return (
    <EuiFlexGroup direction="column" gutterSize="s">
      <EuiFlexItem>
        <EuiPanel hasBorder paddingSize="s" hasShadow={false}>
          <EuiFlexGroup gutterSize="s" alignItems="center" responsive={false}>
            <EuiFlexItem grow={false}>
              <EuiIcon type="storage" />
            </EuiFlexItem>
            <EuiFlexItem>
              <EuiLink onClick={() => openPreviewPanel({ kind: 'host', hostName: alert.host.name, alertId: alert.id })}>
                <strong>{alert.host.name}</strong>
              </EuiLink>
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <RiskLevelBadge level={alert.host.riskLevel} />
            </EuiFlexItem>
          </EuiFlexGroup>
          <EuiSpacer size="xs" />
          <div css={css`padding-left: ${euiTheme.size.l};`}>
            <KeyValueList
              items={[
                { label: 'Operating system', value: `${alert.host.os.name} ${alert.host.os.version}` },
                { label: 'Last seen', value: formatDate(alert.host.lastSeen) },
                { label: 'Asset criticality', value: criticalityLabel(alert.host.criticality) },
              ]}
            />
          </div>
        </EuiPanel>
      </EuiFlexItem>
      <EuiFlexItem>
        <EuiPanel hasBorder paddingSize="s" hasShadow={false}>
          <EuiFlexGroup gutterSize="s" alignItems="center" responsive={false}>
            <EuiFlexItem grow={false}>
              <EuiIcon type="user" />
            </EuiFlexItem>
            <EuiFlexItem>
              <EuiLink onClick={() => openPreviewPanel({ kind: 'user', userName: alert.user.name, alertId: alert.id })}>
                <strong>{alert.user.name}</strong>
              </EuiLink>
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <RiskLevelBadge level={alert.user.riskLevel} />
            </EuiFlexItem>
          </EuiFlexGroup>
          <EuiSpacer size="xs" />
          <div css={css`padding-left: ${euiTheme.size.l};`}>
            <KeyValueList
              items={[
                { label: 'Domain', value: alert.user.domain },
                { label: 'Last seen', value: formatDate(alert.user.lastSeen) },
                { label: 'Asset criticality', value: criticalityLabel(alert.user.criticality) },
              ]}
            />
          </div>
        </EuiPanel>
      </EuiFlexItem>
    </EuiFlexGroup>
  );
};

const InsightsSection: React.FC<{ alert: Alert }> = ({ alert }) => {
  const { openLeftPanel } = useFlyoutApi();
  const { alerts } = useAlertsState();
  const sameSession = alerts.filter((a) => a.sessionId === alert.sessionId && a.id !== alert.id).length;
  const sameHost = alerts.filter((a) => a.host.name === alert.host.name && a.id !== alert.id).length;
  const sameUser = alerts.filter((a) => a.user.name === alert.user.name && a.id !== alert.id).length;

  return (
    <ExpandableSection title="Insights" data-test-subj="securitySolutionFlyoutInsightsSection">
      <EuiFlexGroup alignItems="center" gutterSize="xs" responsive={false}>
        <EuiFlexItem grow={false}>
          <EuiTitle size="xxs">
            <h5>Entities</h5>
          </EuiTitle>
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <SectionTitleAction tooltip="Show all entities" onClick={() => openLeftPanel({ tab: 'insights', insightsSubTab: 'entities' })} />
        </EuiFlexItem>
      </EuiFlexGroup>
      <EuiSpacer size="xs" />
      <EntityOverview alert={alert} />
      <EuiSpacer size="m" />
      <EuiFlexGroup alignItems="center" gutterSize="xs" responsive={false}>
        <EuiFlexItem grow={false}>
          <EuiTitle size="xxs">
            <h5>Threat intelligence</h5>
          </EuiTitle>
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <SectionTitleAction tooltip="Show all threat intelligence" onClick={() => openLeftPanel({ tab: 'insights', insightsSubTab: 'threat_intelligence' })} />
        </EuiFlexItem>
      </EuiFlexGroup>
      <InsightsSummaryRow text={`${alert.threatMatches} threat match${alert.threatMatches === 1 ? '' : 'es'} detected`} count={alert.threatMatches} color={alert.threatMatches ? 'danger' : 'hollow'} onClick={() => openLeftPanel({ tab: 'insights', insightsSubTab: 'threat_intelligence' })} />
      <InsightsSummaryRow text="0 fields enriched with threat intelligence" count={0} />
      <EuiSpacer size="m" />
      <EuiFlexGroup alignItems="center" gutterSize="xs" responsive={false}>
        <EuiFlexItem grow={false}>
          <EuiTitle size="xxs">
            <h5>Correlations</h5>
          </EuiTitle>
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <SectionTitleAction tooltip="Show all correlations" onClick={() => openLeftPanel({ tab: 'insights', insightsSubTab: 'correlations' })} />
        </EuiFlexItem>
      </EuiFlexGroup>
      <InsightsSummaryRow text={`${alert.relatedAlertIds.length} alerts related by ancestry`} count={alert.relatedAlertIds.length} color={alert.relatedAlertIds.length ? 'warning' : 'hollow'} onClick={() => openLeftPanel({ tab: 'insights', insightsSubTab: 'correlations' })} />
      <InsightsSummaryRow text={`${sameSession} alerts related by session`} count={sameSession} color={sameSession ? 'warning' : 'hollow'} onClick={() => openLeftPanel({ tab: 'insights', insightsSubTab: 'correlations' })} />
      <InsightsSummaryRow text={`${alert.caseIds.length} related case${alert.caseIds.length === 1 ? '' : 's'}`} count={alert.caseIds.length} color={alert.caseIds.length ? 'primary' : 'hollow'} onClick={() => openLeftPanel({ tab: 'insights', insightsSubTab: 'correlations' })} />
      <EuiSpacer size="m" />
      <EuiFlexGroup alignItems="center" gutterSize="xs" responsive={false}>
        <EuiFlexItem grow={false}>
          <EuiTitle size="xxs">
            <h5>Prevalence</h5>
          </EuiTitle>
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <SectionTitleAction tooltip="Show all prevalence" onClick={() => openLeftPanel({ tab: 'insights', insightsSubTab: 'prevalence' })} />
        </EuiFlexItem>
      </EuiFlexGroup>
      <InsightsSummaryRow text={`host.name ${alert.host.name} is uncommon (${sameHost + 1} of ${alerts.length} alerts)`} onClick={() => openLeftPanel({ tab: 'insights', insightsSubTab: 'prevalence' })} />
      <InsightsSummaryRow text={`user.name ${alert.user.name} is uncommon (${sameUser + 1} of ${alerts.length} alerts)`} onClick={() => openLeftPanel({ tab: 'insights', insightsSubTab: 'prevalence' })} />
    </ExpandableSection>
  );
};

const ResponseSection: React.FC = () => {
  const { openLeftPanel } = useFlyoutApi();
  return (
    <ExpandableSection title="Response" initialIsOpen={false} data-test-subj="securitySolutionFlyoutResponseSection">
      <EuiButtonEmpty iconType="documentation" size="s" flush="left" onClick={() => openLeftPanel({ tab: 'response' })}>
        View response details
      </EuiButtonEmpty>
      <EuiText size="s" color="subdued">
        2 response actions were run automatically by the rule (isolate host, kill process).
      </EuiText>
    </ExpandableSection>
  );
};

const OverviewTab: React.FC<{ alert: Alert }> = ({ alert }) => (
  <EuiPanel hasBorder={false} hasShadow={false} paddingSize="none" aria-label="Overview">
    <AboutSection alert={alert} />
    <EuiHorizontalRule margin="m" />
    <InvestigationSection alert={alert} />
    <EuiHorizontalRule margin="m" />
    <VisualizationsSection alert={alert} />
    <EuiHorizontalRule margin="m" />
    <InsightsSection alert={alert} />
    <EuiHorizontalRule margin="m" />
    <ResponseSection />
  </EuiPanel>
);

/* -------------------------------------------------------------- table tab */

const TableTab: React.FC<{ alert: Alert }> = ({ alert }) => {
  const [query, setQuery] = useState('');
  const { addToast } = useToasts();
  const doc = useMemo(() => alertToDocument(alert), [alert]);
  const rows = useMemo(
    () =>
      Object.entries(doc)
        .filter(([field]) => !query || field.toLowerCase().includes(query.toLowerCase()))
        .map(([field, value]) => ({ field, value })),
    [doc, query]
  );

  const columns: Array<EuiBasicTableColumn<{ field: string; value: unknown }>> = [
    {
      field: 'field',
      name: 'Field',
      width: '45%',
      render: (field: string) => (
        <EuiFlexGroup gutterSize="xs" alignItems="center" responsive={false}>
          <EuiFlexItem grow={false}>
            <EuiIcon type={field.endsWith('ip') ? 'tokenIP' : typeof doc[field] === 'number' ? 'tokenNumber' : field === '@timestamp' ? 'tokenDate' : 'tokenString'} size="s" />
          </EuiFlexItem>
          <EuiFlexItem>
            <EuiText size="xs" className="eui-textBreakAll">
              {field}
            </EuiText>
          </EuiFlexItem>
        </EuiFlexGroup>
      ),
    },
    {
      field: 'value',
      name: 'Value',
      render: (value: unknown, row) => (
        <EuiFlexGroup gutterSize="xs" alignItems="center" responsive={false} className="flyoutTableRow">
          <EuiFlexItem>
            <EuiText size="xs" className="eui-textBreakAll">
              {Array.isArray(value) ? value.join(', ') : String(value)}
            </EuiText>
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiToolTip content="Filter for value">
              <EuiButtonIcon iconType="plusCircle" size="xs" color="text" aria-label="Filter for value" onClick={() => addToast({ title: `Filter ${row.field}: ${String(value)} added (demo)`, color: 'primary' })} />
            </EuiToolTip>
          </EuiFlexItem>
        </EuiFlexGroup>
      ),
    },
  ];

  return (
    <>
      <EuiFieldSearch
        placeholder="Filter by field, value, or description..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        compressed
        fullWidth
      />
      <EuiSpacer size="s" />
      <EuiInMemoryTable items={rows} columns={columns} compressed tableLayout="fixed" pagination={{ initialPageSize: 25, pageSizeOptions: [25, 50, 100] }} />
    </>
  );
};

const JsonTab: React.FC<{ alert: Alert }> = ({ alert }) => {
  const doc = useMemo(() => alertToDocument(alert), [alert]);
  const nested = useMemo(() => {
    const out: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(doc)) {
      const parts = key.split('.');
      let cursor = out;
      parts.forEach((part, i) => {
        if (i === parts.length - 1) cursor[part] = value;
        else {
          cursor[part] = (cursor[part] as Record<string, unknown>) ?? {};
          cursor = cursor[part] as Record<string, unknown>;
        }
      });
    }
    return out;
  }, [doc]);
  return (
    <EuiCodeBlock language="json" isCopyable fontSize="s" paddingSize="s" overflowHeight="100%" lineNumbers>
      {JSON.stringify({ _index: '.alerts-security.alerts-default', _id: `${alert.id}-9e5f6a7b8c9d0e1f2a3b4c5d6e7f8091`, _source: nested }, null, 2)}
    </EuiCodeBlock>
  );
};

/* ------------------------------------------------------------------ panel */

export const RightPanel: React.FC<{ alert: Alert; panel: RightPanelState }> = ({ alert, panel }) => {
  const { euiTheme } = useEuiTheme();
  const { setRightTab } = useFlyoutApi();

  return (
    <>
      <FlyoutNavigation />
      <EuiFlyoutHeader
        hasBorder
        css={css`
          padding: ${euiTheme.size.s} ${euiTheme.size.m} 0 ${euiTheme.size.m};
        `}
      >
        <AlertHeaderTitle alert={alert} />
        <EuiSpacer size="m" />
        <EuiTabs size="s" bottomBorder={false}>
          {TABS.map((tab) => (
            <EuiTab key={tab.id} isSelected={tab.id === panel.tab} onClick={() => setRightTab(tab.id)} data-test-subj={`securitySolutionFlyout${tab.name}Tab`}>
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
        {panel.tab === 'overview' && <OverviewTab alert={alert} />}
        {panel.tab === 'table' && <TableTab alert={alert} />}
        {panel.tab === 'json' && <JsonTab alert={alert} />}
      </EuiFlyoutBody>
      <EuiFlyoutFooter
        css={css`
          padding: ${euiTheme.size.s} ${euiTheme.size.m};
        `}
      >
        <EuiFlexGroup justifyContent="flexEnd" alignItems="center" responsive={false}>
          <EuiFlexItem grow={false}>
            <TakeActionButton alert={alert} />
          </EuiFlexItem>
        </EuiFlexGroup>
      </EuiFlyoutFooter>
    </>
  );
};
