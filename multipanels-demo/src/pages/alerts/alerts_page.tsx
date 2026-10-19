import React, { useCallback, useMemo, useState } from 'react';
import { css } from '@emotion/react';
import {
  EuiBadge,
  EuiButton,
  EuiButtonEmpty,
  EuiButtonGroup,
  EuiButtonIcon,
  EuiCheckbox,
  EuiContextMenuItem,
  EuiContextMenuPanel,
  EuiDataGrid,
  EuiFieldSearch,
  EuiFilterButton,
  EuiFilterGroup,
  EuiFlexGroup,
  EuiFlexItem,
  EuiFormControlLayout,
  EuiIcon,
  EuiInMemoryTable,
  EuiLink,
  EuiPanel,
  EuiPopover,
  EuiSelect,
  EuiSelectable,
  EuiSpacer,
  EuiSuperDatePicker,
  EuiText,
  EuiTitle,
  EuiToolTip,
  useEuiTheme,
  type EuiBasicTableColumn,
  type EuiDataGridCellValueElementProps,
  type EuiDataGridColumn,
  type EuiSelectableOption,
  type OnTimeChangeProps,
} from '@elastic/eui';
import { useBreadcrumbs } from '../../chrome/chrome_context';
import { AppHeader } from '../../components/app_header';
import { SecurityPageWrapper } from '../../components/page_wrapper';
import { AssigneeAvatars, RiskLevelBadge, SeverityBadge, StatusBadge, formatDate } from '../../components/formatters';
import { ChartLegend, DonutChart, StackedBars } from '../../components/charts';
import { useToasts } from '../../components/toasts';
import {
  ALERTS_BY_HOST,
  ALERTS_BY_RULE,
  ALERTS_BY_SEVERITY,
  DEMO_NOW,
  SEVERITY_COLOR,
  SEVERITY_LABEL,
  USERS_DIRECTORY,
  alertToDocument,
  type Alert,
  type AlertStatus,
  type Severity,
} from '../../data/alerts';
import { useAlertsState } from '../../state/alerts_state';
import { useFlyoutApi } from '../../flyout/flyout_context';

/* ------------------------------------------------------------------ filters */

type FilterKey = 'status' | 'severity' | 'user' | 'host';

interface Filters {
  status: AlertStatus[];
  severity: Severity[];
  user: string[];
  host: string[];
  assignees: string[];
  query: string;
}

const DEFAULT_FILTERS: Filters = { status: ['open', 'acknowledged'], severity: [], user: [], host: [], assignees: [], query: '' };

const FILTER_LABELS: Record<FilterKey, string> = { status: 'Status', severity: 'Severity', user: 'User', host: 'Host' };

const matchesQuery = (alert: Alert, query: string): boolean => {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const doc = alertToDocument(alert);
  // Support the common KQL shapes used in demos: `field: value`, `field:value`, or free text.
  const kql = q.match(/^([\w.@]+)\s*:\s*"?([^"]+)"?$/);
  if (kql) {
    const [, field, value] = kql;
    const actual = doc[field];
    if (actual === undefined) return false;
    const values = Array.isArray(actual) ? actual : [actual];
    return values.some((v) => String(v).toLowerCase().includes(value.trim()));
  }
  return Object.values(doc).some((v) => String(v).toLowerCase().includes(q));
};

const applyFilters = (alerts: Alert[], filters: Filters): Alert[] =>
  alerts.filter(
    (a) =>
      (filters.status.length === 0 || filters.status.includes(a.status)) &&
      (filters.severity.length === 0 || filters.severity.includes(a.severity)) &&
      (filters.user.length === 0 || filters.user.includes(a.user.name)) &&
      (filters.host.length === 0 || filters.host.includes(a.host.name)) &&
      (filters.assignees.length === 0 || filters.assignees.some((uid) => a.assignees.includes(uid))) &&
      matchesQuery(a, filters.query)
  );

const FilterControl: React.FC<{
  label: string;
  options: Array<{ value: string; label: string; count: number }>;
  selected: string[];
  onChange: (next: string[]) => void;
}> = ({ label, options, selected, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { euiTheme } = useEuiTheme();
  const selectableOptions: EuiSelectableOption[] = options.map((o) => ({
    key: o.value,
    label: o.label,
    checked: selected.includes(o.value) ? 'on' : undefined,
    append: <EuiText size="xs" color="subdued">{o.count}</EuiText>,
  }));

  return (
    <EuiPopover
      button={
        <button
          type="button"
          onClick={() => setIsOpen((open) => !open)}
          data-test-subj={`optionsList-control-${label.toLowerCase()}`}
          css={css`
            display: flex;
            flex-direction: column;
            align-items: flex-start;
            min-width: 170px;
            height: 48px;
            padding: 4px 32px 4px 10px;
            background: ${euiTheme.colors.emptyShade};
            border: ${euiTheme.border.thin};
            border-radius: ${euiTheme.border.radius.medium};
            text-align: left;
            position: relative;
            cursor: pointer;
            &:hover {
              background: ${euiTheme.colors.lightestShade};
            }
          `}
        >
          <span css={css`font-size: 11px; color: ${euiTheme.colors.textSubdued}; font-weight: 600;`}>{label}</span>
          <span css={css`font-size: 13px; color: ${euiTheme.colors.textParagraph}; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%;`}>
            {selected.length === 0 ? 'Any' : selected.join(', ')}
          </span>
          {selected.length > 0 && (
            <span css={css`position: absolute; right: 8px; top: 15px;`}>
              <EuiBadge color="hollow">{selected.length}</EuiBadge>
            </span>
          )}
        </button>
      }
      isOpen={isOpen}
      closePopover={() => setIsOpen(false)}
      panelPaddingSize="none"
      anchorPosition="downLeft"
    >
      <EuiSelectable
        options={selectableOptions}
        searchable
        searchProps={{ compressed: true, placeholder: `Search ${label.toLowerCase()}` }}
        onChange={(next) => onChange(next.filter((o) => o.checked === 'on').map((o) => o.key as string))}
        css={css`
          width: 260px;
        `}
        listProps={{ bordered: false }}
      >
        {(list, search) => (
          <>
            {search && <div css={css`padding: 8px;`}>{search}</div>}
            {list}
            <div css={css`padding: 6px 8px; border-top: ${euiTheme.border.thin};`}>
              <EuiButtonEmpty size="xs" flush="left" onClick={() => onChange([])}>
                Clear selections
              </EuiButtonEmpty>
            </div>
          </>
        )}
      </EuiSelectable>
    </EuiPopover>
  );
};

const AssigneesFilter: React.FC<{ selected: string[]; onChange: (next: string[]) => void }> = ({ selected, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const options: EuiSelectableOption[] = Object.values(USERS_DIRECTORY).map((user) => ({
    key: user.uid,
    label: user.fullName,
    checked: selected.includes(user.uid) ? 'on' : undefined,
  }));
  return (
    <EuiPopover
      button={
        <EuiFilterGroup compressed>
          <EuiFilterButton iconType="chevronSingleDown" onClick={() => setIsOpen((open) => !open)} isSelected={isOpen} hasActiveFilters={selected.length > 0} numActiveFilters={selected.length || undefined} data-test-subj="alert-assignees-filter-popover-button">
            Assignees
          </EuiFilterButton>
        </EuiFilterGroup>
      }
      isOpen={isOpen}
      closePopover={() => setIsOpen(false)}
      panelPaddingSize="none"
    >
      <EuiSelectable options={options} onChange={(next) => onChange(next.filter((o) => o.checked === 'on').map((o) => o.key as string))} css={css`width: 240px;`} listProps={{ bordered: false }}>
        {(list) => list}
      </EuiSelectable>
    </EuiPopover>
  );
};

/* ------------------------------------------------------------------- charts */

type ChartView = 'counts' | 'trend' | 'treemap';

const CountsCharts: React.FC<{ alerts: Alert[] }> = ({ alerts }) => {
  const bySeverity = ALERTS_BY_SEVERITY(alerts);
  const byRule = ALERTS_BY_RULE(alerts);
  const byHost = ALERTS_BY_HOST(alerts);
  const [topBy, setTopBy] = useState('host');
  const topData = topBy === 'host' ? byHost : topBy === 'user' ? Object.entries(alerts.reduce<Record<string, number>>((acc, a) => ({ ...acc, [a.user.name]: (acc[a.user.name] ?? 0) + 1 }), {})).map(([key, count]) => ({ key, count })).sort((a, b) => b.count - a.count) : [];

  const severityColumns: Array<EuiBasicTableColumn<{ key: Severity; count: number }>> = [
    { field: 'key', name: 'Levels', render: (key: Severity) => <SeverityBadge severity={key} /> },
    { field: 'count', name: 'Count', align: 'right', width: '70px' },
  ];
  const countColumns = (name: string): Array<EuiBasicTableColumn<{ key: string; count: number }>> => [
    { field: 'key', name, truncateText: true, render: (key: string) => <EuiLink>{key}</EuiLink> },
    { field: 'count', name: 'Count', align: 'right', width: '70px' },
  ];
  const severityRows = (Object.keys(bySeverity) as Severity[]).map((key) => ({ key, count: bySeverity[key] }));

  return (
    <EuiFlexGroup gutterSize="m" responsive={false} data-test-subj="alertsCountsCharts">
      <EuiFlexItem>
        <EuiPanel hasBorder hasShadow={false} paddingSize="m" css={css`height: 100%;`}>
          <EuiTitle size="xs">
            <h3>Severity levels</h3>
          </EuiTitle>
          <EuiSpacer size="s" />
          <EuiFlexGroup gutterSize="m" alignItems="center" responsive={false}>
            <EuiFlexItem grow={false}>
              <DonutChart slices={severityRows.map((r) => ({ key: r.key, label: SEVERITY_LABEL[r.key], value: r.count, color: SEVERITY_COLOR[r.key] }))} subtitle="alerts" />
            </EuiFlexItem>
            <EuiFlexItem>
              <EuiInMemoryTable items={severityRows} columns={severityColumns} compressed />
            </EuiFlexItem>
          </EuiFlexGroup>
        </EuiPanel>
      </EuiFlexItem>
      <EuiFlexItem>
        <EuiPanel hasBorder hasShadow={false} paddingSize="m" css={css`height: 100%;`}>
          <EuiTitle size="xs">
            <h3>Alerts by name</h3>
          </EuiTitle>
          <EuiSpacer size="s" />
          <EuiInMemoryTable items={byRule.slice(0, 6)} columns={countColumns('Alert name')} compressed />
        </EuiPanel>
      </EuiFlexItem>
      <EuiFlexItem>
        <EuiPanel hasBorder hasShadow={false} paddingSize="m" css={css`height: 100%;`}>
          <EuiFlexGroup alignItems="center" gutterSize="s" responsive={false}>
            <EuiFlexItem grow={false}>
              <EuiTitle size="xs">
                <h3>Top alerts by</h3>
              </EuiTitle>
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <EuiSelect
                compressed
                options={[
                  { value: 'host', text: 'host' },
                  { value: 'user', text: 'user' },
                  { value: 'source', text: 'source' },
                  { value: 'destination', text: 'destination' },
                ]}
                value={topBy}
                onChange={(e) => setTopBy(e.target.value)}
                aria-label="Top alerts by"
              />
            </EuiFlexItem>
          </EuiFlexGroup>
          <EuiSpacer size="s" />
          {topData.length ? (
            <EuiInMemoryTable items={topData.slice(0, 6)} columns={countColumns(topBy === 'host' ? 'Host name' : 'User name')} compressed />
          ) : (
            <EuiText size="s" color="subdued">
              No items found
            </EuiText>
          )}
        </EuiPanel>
      </EuiFlexItem>
    </EuiFlexGroup>
  );
};

const TrendChart: React.FC<{ alerts: Alert[] }> = ({ alerts }) => {
  const [stackBy, setStackBy] = useState('kibana.alert.severity');
  const buckets = 24;
  const labels = Array.from({ length: buckets }, (_, i) => {
    const d = new Date(DEMO_NOW - (buckets - 1 - i) * 3_600_000);
    return `${String(d.getUTCHours()).padStart(2, '0')}:00`;
  });
  const series =
    stackBy === 'kibana.alert.severity'
      ? (['critical', 'high', 'medium', 'low'] as Severity[]).map((sev) => ({
          key: sev,
          label: SEVERITY_LABEL[sev],
          color: SEVERITY_COLOR[sev],
          values: labels.map((_, i) => alerts.filter((a) => a.severity === sev && Math.floor((DEMO_NOW - new Date(a.timestamp).getTime()) / 3_600_000) === buckets - 1 - i).length),
        }))
      : ALERTS_BY_RULE(alerts).map((r, idx) => ({
          key: r.key,
          label: r.key,
          color: ['#61A2FF', '#54B399', '#D6BF57', '#DA8B45', '#E7664C', '#BFA1E2'][idx % 6],
          values: labels.map((_, i) => alerts.filter((a) => a.rule.name === r.key && Math.floor((DEMO_NOW - new Date(a.timestamp).getTime()) / 3_600_000) === buckets - 1 - i).length),
        }));
  return (
    <EuiPanel hasBorder hasShadow={false} paddingSize="m" data-test-subj="alertsTrendChart">
      <EuiFlexGroup alignItems="center" justifyContent="spaceBetween" responsive={false}>
        <EuiFlexItem grow={false}>
          <EuiTitle size="xs">
            <h3>Trend</h3>
          </EuiTitle>
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiFlexGroup alignItems="center" gutterSize="s" responsive={false}>
            <EuiFlexItem grow={false}>
              <EuiText size="xs">Stack by</EuiText>
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <EuiSelect
                compressed
                options={[
                  { value: 'kibana.alert.severity', text: 'kibana.alert.severity' },
                  { value: 'kibana.alert.rule.name', text: 'kibana.alert.rule.name' },
                ]}
                value={stackBy}
                onChange={(e) => setStackBy(e.target.value)}
                aria-label="Stack by"
              />
            </EuiFlexItem>
          </EuiFlexGroup>
        </EuiFlexItem>
      </EuiFlexGroup>
      <EuiSpacer size="s" />
      <StackedBars series={series} labels={labels} height={180} ariaLabel="Alerts trend" />
      <EuiSpacer size="s" />
      <ChartLegend items={series.map((s) => ({ key: s.key, label: s.label, color: s.color, value: s.values.reduce((a, b) => a + b, 0) }))} />
    </EuiPanel>
  );
};

/* -------------------------------------------------------------------- table */

const COLUMNS: EuiDataGridColumn[] = [
  { id: '@timestamp', displayAsText: '@timestamp', initialWidth: 220, schema: 'datetime' },
  { id: 'kibana.alert.rule.name', displayAsText: 'Rule', initialWidth: 300 },
  { id: 'kibana.alert.severity', displayAsText: 'Severity', initialWidth: 110 },
  { id: 'kibana.alert.risk_score', displayAsText: 'Risk Score', initialWidth: 110 },
  { id: 'kibana.alert.reason', displayAsText: 'Reason', initialWidth: 420 },
  { id: 'host.name', displayAsText: 'host.name', initialWidth: 160 },
  { id: 'user.name', displayAsText: 'user.name', initialWidth: 140 },
  { id: 'host.risk.calculated_level', displayAsText: 'Host Risk Level', initialWidth: 140 },
  { id: 'process.name', displayAsText: 'process.name', initialWidth: 140 },
  { id: 'file.name', displayAsText: 'file.name', initialWidth: 140 },
  { id: 'source.ip', displayAsText: 'source.ip', initialWidth: 140 },
  { id: 'destination.ip', displayAsText: 'destination.ip', initialWidth: 140 },
  { id: 'kibana.alert.workflow_assignee_ids', displayAsText: 'Assignees', initialWidth: 120 },
  { id: 'kibana.alert.workflow_status', displayAsText: 'Status', initialWidth: 130 },
];

const DEFAULT_VISIBLE = COLUMNS.map((c) => c.id).filter((id) => !['process.name', 'file.name', 'source.ip', 'destination.ip', 'host.risk.calculated_level'].includes(id));

const AlertsTable: React.FC<{ alerts: Alert[]; filters: Filters }> = ({ alerts }) => {
  const { euiTheme } = useEuiTheme();
  const { openRightPanel, state: flyoutState } = useFlyoutApi();
  const { setStatus } = useAlertsState();
  const { addToast } = useToasts();
  const [visibleColumns, setVisibleColumns] = useState<string[]>(DEFAULT_VISIBLE);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 25 });
  const [sorting, setSorting] = useState<Array<{ id: string; direction: 'asc' | 'desc' }>>([{ id: '@timestamp', direction: 'desc' }]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkOpen, setBulkOpen] = useState(false);
  const [rowMenu, setRowMenu] = useState<string | null>(null);
  const [groupBy, setGroupBy] = useState('none');

  const sorted = useMemo(() => {
    const rows = [...alerts];
    for (const sort of [...sorting].reverse()) {
      rows.sort((a, b) => {
        const da = alertToDocument(a)[sort.id];
        const db = alertToDocument(b)[sort.id];
        const cmp = String(da ?? '').localeCompare(String(db ?? ''), undefined, { numeric: true });
        return sort.direction === 'asc' ? cmp : -cmp;
      });
    }
    return rows;
  }, [alerts, sorting]);

  const pageRows = sorted.slice(pagination.pageIndex * pagination.pageSize, (pagination.pageIndex + 1) * pagination.pageSize);
  const openAlertId = flyoutState.right?.alertId;

  const toggleSelected = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const bulkStatus = (status: AlertStatus) => {
    const ids = [...selected];
    setStatus(ids, status);
    setSelected(new Set());
    setBulkOpen(false);
    addToast({ title: `Successfully marked ${ids.length} alert${ids.length === 1 ? '' : 's'} as ${status}`, color: 'success', iconType: 'check' });
  };

  const renderCellValue = useCallback(
    ({ rowIndex, columnId }: EuiDataGridCellValueElementProps) => {
      const alert = pageRows[rowIndex];
      if (!alert) return null;
      switch (columnId) {
        case '@timestamp':
          return <span>{formatDate(alert.timestamp)}</span>;
        case 'kibana.alert.rule.name':
          return (
            <EuiLink onClick={() => openRightPanel(alert.id)} css={css`font-weight: ${euiTheme.font.weight.regular};`}>
              {alert.rule.name}
            </EuiLink>
          );
        case 'kibana.alert.severity':
          return <SeverityBadge severity={alert.severity} />;
        case 'kibana.alert.risk_score':
          return <span>{alert.riskScore}</span>;
        case 'kibana.alert.reason':
          return <span className="eui-textTruncate">{alert.reason}</span>;
        case 'host.name':
          return <span>{alert.host.name}</span>;
        case 'user.name':
          return <span>{alert.user.name}</span>;
        case 'host.risk.calculated_level':
          return <RiskLevelBadge level={alert.host.riskLevel} />;
        case 'process.name':
          return <span>{alert.process?.name ?? '—'}</span>;
        case 'file.name':
          return <span>{alert.file?.name ?? '—'}</span>;
        case 'source.ip':
          return <span>{alert.source?.ip ?? '—'}</span>;
        case 'destination.ip':
          return <span>{alert.destination?.ip ?? '—'}</span>;
        case 'kibana.alert.workflow_assignee_ids':
          return <AssigneeAvatars assignees={alert.assignees} />;
        case 'kibana.alert.workflow_status':
          return <StatusBadge status={alert.status} />;
        default:
          return <span>{String(alertToDocument(alert)[columnId] ?? '—')}</span>;
      }
    },
    [pageRows, openRightPanel, euiTheme.font.weight.regular]
  );

  const leadingControlColumns = [
    {
      id: 'selection',
      width: 32,
      headerCellRender: () => (
        <EuiCheckbox
          id="alerts-select-all"
          checked={pageRows.length > 0 && pageRows.every((a) => selected.has(a.id))}
          onChange={(e) => setSelected(e.target.checked ? new Set(pageRows.map((a) => a.id)) : new Set())}
          aria-label="Select all visible alerts"
        />
      ),
      rowCellRender: ({ rowIndex }: EuiDataGridCellValueElementProps) => {
        const alert = pageRows[rowIndex];
        return alert ? <EuiCheckbox id={`select-${alert.id}`} checked={selected.has(alert.id)} onChange={() => toggleSelected(alert.id)} aria-label={`Select alert ${alert.id}`} /> : null;
      },
    },
    {
      id: 'actions',
      width: 112,
      headerCellRender: () => <span className="euiScreenReaderOnly">Actions</span>,
      rowCellRender: ({ rowIndex }: EuiDataGridCellValueElementProps) => {
        const alert = pageRows[rowIndex];
        if (!alert) return null;
        return (
          <EuiFlexGroup gutterSize="none" alignItems="center" responsive={false} css={css`height: 100%;`}>
            <EuiFlexItem grow={false}>
              <EuiToolTip content="View details">
                <EuiButtonIcon iconType="maximize" size="xs" color="text" aria-label="View details" onClick={() => openRightPanel(alert.id)} data-test-subj="expand-event" />
              </EuiToolTip>
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <EuiToolTip content="Investigate in timeline">
                <EuiButtonIcon iconType="timelineWithArrow" size="xs" color="text" aria-label="Investigate in timeline" onClick={() => addToast({ title: 'Timeline is not part of this demo', color: 'primary' })} />
              </EuiToolTip>
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <EuiToolTip content="Analyze event">
                <EuiButtonIcon iconType="analyzeEvent" size="xs" color="text" aria-label="Analyze event" onClick={() => { openRightPanel(alert.id); }} />
              </EuiToolTip>
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <EuiPopover
                button={<EuiButtonIcon iconType="ellipsis" size="xs" color="text" aria-label="More actions" onClick={() => setRowMenu(rowMenu === alert.id ? null : alert.id)} />}
                isOpen={rowMenu === alert.id}
                closePopover={() => setRowMenu(null)}
                panelPaddingSize="none"
                anchorPosition="downLeft"
              >
                <EuiContextMenuPanel
                  items={(['open', 'acknowledged', 'closed'] as AlertStatus[])
                    .filter((s) => s !== alert.status)
                    .map((s) => (
                      <EuiContextMenuItem key={s} onClick={() => { setStatus([alert.id], s); setRowMenu(null); addToast({ title: `Successfully marked 1 alert as ${s}`, color: 'success', iconType: 'check' }); }}>
                        Mark as {s}
                      </EuiContextMenuItem>
                    ))
                    .concat([
                      <EuiContextMenuItem key="case" onClick={() => { setRowMenu(null); addToast({ title: 'Cases are not part of this demo', color: 'primary' }); }}>
                        Add to case
                      </EuiContextMenuItem>,
                      <EuiContextMenuItem key="exception" onClick={() => { setRowMenu(null); addToast({ title: 'Rule exceptions are not part of this demo', color: 'primary' }); }}>
                        Add rule exception
                      </EuiContextMenuItem>,
                    ])}
                />
              </EuiPopover>
            </EuiFlexItem>
          </EuiFlexGroup>
        );
      },
    },
  ];

  const rowClasses = useMemo(() => {
    const classes: Record<number, string> = {};
    pageRows.forEach((a, i) => {
      if (a.id === openAlertId) classes[i] = 'alertsTable__row--expanded';
      if (selected.has(a.id)) classes[i] = `${classes[i] ?? ''} alertsTable__row--selected`;
    });
    return classes;
  }, [pageRows, openAlertId, selected]);

  return (
    <EuiPanel hasBorder hasShadow={false} paddingSize="m" data-test-subj="alertsTablePanel">
      <EuiFlexGroup alignItems="center" justifyContent="spaceBetween" responsive={false} gutterSize="s">
        <EuiFlexItem grow={false}>
          <EuiFlexGroup alignItems="center" gutterSize="m" responsive={false}>
            <EuiFlexItem grow={false}>
              <EuiText size="s" data-test-subj="toolbar-alerts-count">
                <strong>{alerts.length}</strong> alerts
              </EuiText>
            </EuiFlexItem>
            {selected.size > 0 && (
              <>
                <EuiFlexItem grow={false}>
                  <EuiText size="s" color="subdued">
                    {selected.size} selected
                  </EuiText>
                </EuiFlexItem>
                <EuiFlexItem grow={false}>
                  <EuiPopover
                    button={
                      <EuiButtonEmpty size="s" iconType="chevronSingleDown" iconSide="right" onClick={() => setBulkOpen((open) => !open)} data-test-subj="selectedShowBulkActionsButton">
                        Selected {selected.size} alert{selected.size === 1 ? '' : 's'}
                      </EuiButtonEmpty>
                    }
                    isOpen={bulkOpen}
                    closePopover={() => setBulkOpen(false)}
                    panelPaddingSize="none"
                  >
                    <EuiContextMenuPanel
                      items={[
                        <EuiContextMenuItem key="open" onClick={() => bulkStatus('open')}>Mark as open</EuiContextMenuItem>,
                        <EuiContextMenuItem key="ack" onClick={() => bulkStatus('acknowledged')}>Mark as acknowledged</EuiContextMenuItem>,
                        <EuiContextMenuItem key="closed" onClick={() => bulkStatus('closed')}>Mark as closed</EuiContextMenuItem>,
                        <EuiContextMenuItem key="tags" onClick={() => { setBulkOpen(false); addToast({ title: 'Tags are not part of this demo', color: 'primary' }); }}>Apply alert tags</EuiContextMenuItem>,
                        <EuiContextMenuItem key="assign" onClick={() => { setBulkOpen(false); addToast({ title: 'Bulk assignment is not part of this demo', color: 'primary' }); }}>Assign alert</EuiContextMenuItem>,
                      ]}
                    />
                  </EuiPopover>
                </EuiFlexItem>
                <EuiFlexItem grow={false}>
                  <EuiButtonEmpty size="s" onClick={() => setSelected(new Set())}>
                    Clear selection
                  </EuiButtonEmpty>
                </EuiFlexItem>
              </>
            )}
          </EuiFlexGroup>
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiFlexGroup alignItems="center" gutterSize="s" responsive={false}>
            <EuiFlexItem grow={false}>
              <EuiButtonEmpty size="s" iconType="sparkles" onClick={() => addToast({ title: 'Select alerts and add them to an AI chat (demo)', color: 'primary' })}>
                Add to chat
              </EuiButtonEmpty>
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <EuiSelect
                compressed
                prepend="Group alerts by"
                aria-label="Group alerts by"
                options={[
                  { value: 'none', text: 'None' },
                  { value: 'kibana.alert.rule.name', text: 'Rule name' },
                  { value: 'host.name', text: 'Host name' },
                  { value: 'user.name', text: 'User name' },
                  { value: 'source.ip', text: 'Source IP' },
                ]}
                value={groupBy}
                onChange={(e) => {
                  setGroupBy(e.target.value);
                  if (e.target.value !== 'none') addToast({ title: 'Alert grouping is not part of this demo', color: 'primary' });
                }}
              />
            </EuiFlexItem>
          </EuiFlexGroup>
        </EuiFlexItem>
      </EuiFlexGroup>
      <EuiSpacer size="s" />
      <div
        css={css`
          .alertsTable__row--expanded [data-gridcell-column-id] {
            background: ${euiTheme.colors.backgroundBaseSubdued} !important;
          }
          .alertsTable__row--selected [data-gridcell-column-id] {
            background: ${euiTheme.colors.backgroundBasePrimary} !important;
          }
          .euiDataGridRowCell:hover [data-gridcell-column-id] {
            cursor: pointer;
          }
        `}
      >
        <EuiDataGrid
          aria-label="Alerts"
          data-test-subj="alertsTable"
          columns={COLUMNS}
          columnVisibility={{ visibleColumns, setVisibleColumns }}
          leadingControlColumns={leadingControlColumns}
          rowCount={alerts.length}
          renderCellValue={renderCellValue}
          sorting={{ columns: sorting, onSort: (cols) => setSorting(cols as Array<{ id: string; direction: 'asc' | 'desc' }>) }}
          inMemory={{ level: 'sorting' }}
          pagination={{
            ...pagination,
            pageSizeOptions: [10, 25, 50, 100],
            onChangeItemsPerPage: (pageSize) => setPagination({ pageIndex: 0, pageSize }),
            onChangePage: (pageIndex) => setPagination((p) => ({ ...p, pageIndex })),
          }}
          gridStyle={{ border: 'horizontal', header: 'underline', fontSize: 's', cellPadding: 's', stripes: false, rowHover: 'highlight', rowClasses }}
          toolbarVisibility={{
            showDisplaySelector: { allowDensity: true, allowRowHeight: true },
            showSortSelector: true,
            showColumnSelector: true,
            showFullScreenSelector: true,
            showKeyboardShortcuts: false,
          }}
          height={Math.min(680, 44 + pageRows.length * 36 + 60)}
        />
      </div>
    </EuiPanel>
  );
};

/* --------------------------------------------------------------------- page */

export const AlertsPage: React.FC = () => {
  useBreadcrumbs([{ text: 'Alerts', href: '/alerts' }]);
  const { euiTheme } = useEuiTheme();
  const { alerts } = useAlertsState();
  const { addToast } = useToasts();
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [draftQuery, setDraftQuery] = useState('');
  const [time, setTime] = useState({ start: 'now-24h', end: 'now' });
  const [chartsOpen, setChartsOpen] = useState(true);
  const [chartView, setChartView] = useState<ChartView>('counts');

  const filtered = useMemo(() => applyFilters(alerts, filters), [alerts, filters]);
  const unfilteredByQuery = useMemo(() => applyFilters(alerts, { ...filters, status: [], severity: [], user: [], host: [] }), [alerts, filters]);

  const countBy = (key: FilterKey) => {
    const counts = new Map<string, number>();
    for (const a of unfilteredByQuery) {
      const value = key === 'status' ? a.status : key === 'severity' ? a.severity : key === 'user' ? a.user.name : a.host.name;
      counts.set(value, (counts.get(value) ?? 0) + 1);
    }
    const order = key === 'status' ? ['open', 'acknowledged', 'closed'] : key === 'severity' ? ['critical', 'high', 'medium', 'low'] : [...counts.keys()].sort();
    return order.map((value) => ({ value, label: value, count: counts.get(value) ?? 0 }));
  };

  const onTimeChange = ({ start, end }: OnTimeChangeProps) => setTime({ start, end });

  const setFilter = (key: FilterKey, next: string[]) => setFilters((f) => ({ ...f, [key]: next }));

  return (
    <SecurityPageWrapper data-test-subj="alertsPage">
      <AppHeader
        title="Alerts"
        spacing="largeBleed"
        docLink="https://www.elastic.co/guide/en/security/current/alerts-ui-manage.html"
        actions={
          <EuiFlexGroup gutterSize="s" alignItems="center" responsive={false}>
            <EuiFlexItem grow={false}>
              <EuiToolTip content="Rules — not part of this demo">
                <EuiButtonEmpty size="s" iconType="gear" onClick={() => addToast({ title: 'Rule management is not part of this demo', color: 'primary' })}>
                  Manage rules
                </EuiButtonEmpty>
              </EuiToolTip>
            </EuiFlexItem>
          </EuiFlexGroup>
        }
      />
      <EuiSpacer size="m" />
      <EuiPanel hasBorder={false} hasShadow={false} paddingSize="none" data-test-subj="filters-global-container">
        <EuiFlexGroup gutterSize="s" alignItems="center" responsive={false}>
          <EuiFlexItem>
            <EuiFormControlLayout
              fullWidth
              prepend={
                <EuiButtonEmpty size="xs" color="text" iconType="filter" css={css`height: 100%;`} onClick={() => addToast({ title: 'Saved queries are not part of this demo', color: 'primary' })}>
                  KQL
                </EuiButtonEmpty>
              }
            >
              <EuiFieldSearch
                fullWidth
                placeholder="Filter your data using KQL syntax"
                value={draftQuery}
                onChange={(e) => setDraftQuery(e.target.value)}
                onSearch={(value) => setFilters((f) => ({ ...f, query: value }))}
                isClearable
                data-test-subj="queryInput"
                css={css`
                  font-family: ${euiTheme.font.familyCode};
                `}
              />
            </EuiFormControlLayout>
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiSuperDatePicker
              start={time.start}
              end={time.end}
              onTimeChange={onTimeChange}
              showUpdateButton={false}
              compressed={false}
              width="auto"
            />
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiButton
              iconType={draftQuery !== filters.query ? 'kqlFunction' : 'refresh'}
              fill
              onClick={() => setFilters((f) => ({ ...f, query: draftQuery }))}
              data-test-subj="querySubmitButton"
            >
              {draftQuery !== filters.query ? 'Update' : 'Refresh'}
            </EuiButton>
          </EuiFlexItem>
        </EuiFlexGroup>
        <EuiSpacer size="s" />
        <EuiFlexGroup gutterSize="s" alignItems="center" responsive={false} wrap>
          <EuiFlexItem grow={false}>
            <AssigneesFilter selected={filters.assignees} onChange={(next) => setFilters((f) => ({ ...f, assignees: next }))} />
          </EuiFlexItem>
          {(['status', 'severity', 'user', 'host'] as FilterKey[]).map((key) => (
            <EuiFlexItem grow={false} key={key}>
              <FilterControl label={FILTER_LABELS[key]} options={countBy(key)} selected={filters[key]} onChange={(next) => setFilter(key, next)} />
            </EuiFlexItem>
          ))}
          <EuiFlexItem grow={false}>
            <EuiToolTip content="Add a filter control">
              <EuiButtonIcon iconType="plusCircle" aria-label="Add filter control" color="text" onClick={() => addToast({ title: 'Editing filter controls is not part of this demo', color: 'primary' })} />
            </EuiToolTip>
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiButtonEmpty size="xs" onClick={() => { setFilters(DEFAULT_FILTERS); setDraftQuery(''); }} data-test-subj="filterGroupResetButton">
              Reset
            </EuiButtonEmpty>
          </EuiFlexItem>
        </EuiFlexGroup>
      </EuiPanel>
      <EuiSpacer size="m" />
      <EuiFlexGroup alignItems="center" justifyContent="spaceBetween" responsive={false}>
        <EuiFlexItem grow={false}>
          <EuiButtonEmpty size="s" iconType={chartsOpen ? 'chevronSingleDown' : 'chevronSingleRight'} onClick={() => setChartsOpen((v) => !v)} data-test-subj="query-toggle-header">
            <EuiTitle size="xs">
              <h3 css={css`display: inline;`}>Charts</h3>
            </EuiTitle>
          </EuiButtonEmpty>
        </EuiFlexItem>
        {chartsOpen && (
          <EuiFlexItem grow={false}>
            <EuiButtonGroup
              legend="Chart type"
              buttonSize="compressed"
              color="primary"
              options={[
                { id: 'counts', label: 'Counts', iconType: 'visTable' },
                { id: 'trend', label: 'Trend', iconType: 'visBarVertical' },
                { id: 'treemap', label: 'Treemap', iconType: 'grid' },
              ]}
              idSelected={chartView}
              onChange={(id) => {
                if (id === 'treemap') addToast({ title: 'Treemap view is not part of this demo', color: 'primary' });
                else setChartView(id as ChartView);
              }}
            />
          </EuiFlexItem>
        )}
      </EuiFlexGroup>
      {chartsOpen && (
        <>
          <EuiSpacer size="s" />
          {chartView === 'counts' ? <CountsCharts alerts={filtered} /> : <TrendChart alerts={filtered} />}
        </>
      )}
      <EuiSpacer size="m" />
      <AlertsTable alerts={filtered} filters={filters} />
      <EuiSpacer size="s" />
      <EuiText size="xs" color="subdued">
        <EuiIcon type="info" size="s" /> Demo data: {alerts.length} fake alerts generated in the browser. Status, assignee and note changes are kept in memory only.
      </EuiText>
    </SecurityPageWrapper>
  );
};
