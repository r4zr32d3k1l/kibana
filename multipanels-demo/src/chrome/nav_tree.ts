/**
 * Mirror of the serverless Security navigation tree
 * (x-pack/solutions/security/plugins/security_solution_serverless/public/navigation/navigation_tree.ts
 * composed with @kbn/security-solution-navigation/navigation_tree) with the AlertZero advanced
 * setting on and Agent Builder pinned at the top. Only the three `href` items are routed.
 */
export interface NavChild {
  id: string;
  label: string;
  badge?: 'new' | 'beta';
  children?: NavChild[];
}

export interface NavItem {
  id: string;
  label: string;
  icon: string;
  /** Routed destination inside this demo; everything else is display-only. */
  href?: string;
  /** `panelOpener` items open a secondary panel listing their children in real Kibana. */
  renderAs?: 'item' | 'panelOpener' | 'accordion';
  badge?: 'new' | 'beta';
  children?: NavChild[];
}

export const PRIMARY_NAV: NavItem[] = [
  { id: 'agent_builder', label: 'Agents', icon: 'productAgent', href: '/agents' },
  { id: 'context_engine', label: 'Context Engine', icon: 'tableSparkles' },
  { id: 'inbox', label: 'Inbox', icon: 'mail' },
  { id: 'alertzero', label: 'AlertZero', icon: 'sun', href: '/alertzero' },
  { id: 'alertzero:escalations', label: 'Escalations', icon: 'flag' },
  { id: 'discover', label: 'Discover', icon: 'productDiscover' },
  {
    id: 'dashboards',
    label: 'Dashboards',
    icon: 'productDashboard',
    renderAs: 'accordion',
    children: [
      { id: 'overview', label: 'Overview' },
      { id: 'detection_response', label: 'Detection & Response' },
      { id: 'cloud_security_posture-dashboard', label: 'Cloud Security Posture' },
      { id: 'cloud_security_posture-vulnerability_dashboard', label: 'Cloud Native Vulnerability Management' },
      { id: 'data_quality', label: 'Data Quality' },
      { id: 'kubernetes', label: 'Kubernetes' },
    ],
  },
  { id: 'alertzero:watches', label: 'Watches', icon: 'eye' },
  {
    id: 'rules-landing',
    label: 'Rules',
    icon: 'radar',
    renderAs: 'panelOpener',
    children: [
      {
        id: 'management',
        label: 'Management',
        children: [
          { id: 'rules', label: 'Detection rules (SIEM)' },
          { id: 'cloud_security_posture-benchmarks', label: 'Benchmark rules' },
          { id: 'exceptions', label: 'Shared exception lists' },
          { id: 'alert_analysis_workflow', label: 'Alert analysis workflow' },
        ],
      },
      { id: 'discover', label: 'Discover', children: [{ id: 'coverage-overview', label: 'MITRE ATT&CK® coverage' }] },
    ],
  },
  { id: 'alerts', label: 'Alerts', icon: 'warning', href: '/alerts' },
  {
    id: 'workflows',
    label: 'Workflows',
    icon: 'workflow',
    renderAs: 'panelOpener',
    children: [
      { id: 'workflows-all', label: 'Workflows' },
      { id: 'workflows-executions', label: 'Executions' },
    ],
  },
  { id: 'attack_discovery', label: 'Attack discovery', icon: 'bolt' },
  { id: 'cloud_security_posture-findings', label: 'Findings', icon: 'bullseye' },
  {
    id: 'cases',
    label: 'Cases',
    icon: 'briefcase',
    renderAs: 'accordion',
    children: [
      { id: 'cases-all', label: 'Cases' },
      { id: 'cases_create', label: 'Create' },
      { id: 'cases_configure', label: 'Settings' },
    ],
  },
  { id: 'entity_analytics-home_page', label: 'Entity analytics', icon: 'chartBarVerticalStack', badge: 'new' },
  {
    id: 'explore',
    label: 'Explore',
    icon: 'globe',
    renderAs: 'panelOpener',
    children: [
      { id: 'hosts', label: 'Hosts' },
      { id: 'network', label: 'Network' },
      { id: 'users', label: 'Users' },
    ],
  },
  {
    id: 'investigations',
    label: 'Investigations',
    icon: 'inspect',
    renderAs: 'panelOpener',
    children: [
      { id: 'timelines', label: 'Timelines', children: [{ id: 'timelines-templates', label: 'Templates' }] },
      { id: 'notes', label: 'Notes' },
      { id: 'osquery', label: 'Osquery' },
    ],
  },
  { id: 'threat_intelligence', label: 'Intelligence', icon: 'processor' },
  { id: 'asset_inventory', label: 'Asset Inventory', icon: 'listCheck' },
  {
    id: 'assets',
    label: 'Assets',
    icon: 'display',
    renderAs: 'panelOpener',
    children: [
      {
        id: 'fleet',
        label: 'Fleet',
        children: [
          { id: 'fleet:agents', label: 'Agents' },
          { id: 'fleet:policies', label: 'Policies' },
          { id: 'fleet:enrollment_tokens', label: 'Enrollment tokens' },
          { id: 'fleet:uninstall_tokens', label: 'Uninstall tokens' },
          { id: 'fleet:data_streams', label: 'Data streams' },
          { id: 'fleet:settings', label: 'Settings' },
        ],
      },
      {
        id: 'endpoints',
        label: 'Endpoints',
        children: [
          { id: 'endpoints', label: 'Endpoints' },
          { id: 'policy', label: 'Policies' },
          { id: 'artifacts', label: 'Artifacts' },
          { id: 'response_actions_history', label: 'Response actions history' },
          { id: 'script_library', label: 'Script library' },
        ],
      },
    ],
  },
  {
    id: 'machine_learning-landing',
    label: 'Machine Learning',
    icon: 'productML',
    renderAs: 'panelOpener',
    children: [
      { id: 'ml:overview', label: 'Overview' },
      { id: 'ml:dataVisualizer', label: 'Data visualizer' },
      {
        id: 'anomaly_detection',
        label: 'Anomaly detection',
        children: [
          { id: 'management:anomaly_detection', label: 'Manage jobs' },
          { id: 'ml:anomalyExplorer', label: 'Anomaly explorer' },
          { id: 'ml:singleMetricViewer', label: 'Single metric viewer' },
        ],
      },
      {
        id: 'data_frame_analytics',
        label: 'Data frame analytics',
        children: [
          { id: 'ml:resultExplorer', label: 'Result explorer' },
          { id: 'ml:analyticsMap', label: 'Analytics map' },
        ],
      },
      {
        id: 'aiops_labs',
        label: 'AIOps labs',
        children: [
          { id: 'ml:logRateAnalysis', label: 'Log rate analysis' },
          { id: 'ml:logPatternAnalysis', label: 'Log pattern analysis' },
          { id: 'ml:changePointDetections', label: 'Change point detection' },
        ],
      },
    ],
  },
];

export const FOOTER_NAV: NavItem[] = [
  {
    id: 'launchpad',
    label: 'Launchpad',
    icon: 'rocket',
    renderAs: 'panelOpener',
    children: [
      { id: 'get_started', label: 'Get started' },
      { id: 'siem_readiness', label: 'SIEM readiness', badge: 'new' },
      { id: 'ai_value', label: 'Value report' },
      {
        id: 'migrations',
        label: 'Migrations',
        children: [
          { id: 'siem_migrations-manage', label: 'Manage migrations' },
          { id: 'siem_migrations-rules', label: 'Translated rules' },
          { id: 'siem_migrations-dashboards', label: 'Translated dashboards' },
        ],
      },
    ],
  },
  { id: 'dev_tools', label: 'Developer tools', icon: 'code' },
  {
    id: 'project_settings',
    label: 'Project Settings',
    icon: 'gear',
    renderAs: 'panelOpener',
    children: [
      { id: 'management', label: 'Management' },
      { id: 'integrations', label: 'Integrations' },
      { id: 'cloud', label: 'Project performance' },
    ],
  },
];

export const findNavItemByPath = (pathname: string): NavItem | undefined =>
  PRIMARY_NAV.find((item) => item.href && pathname.startsWith(item.href));
