/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

/**
 * Canned OpenAI-compatible chat completions server for the multipanels demo.
 *
 * Kibana's preconfigured `.gen-ai` connector (`multipanels-mock-llm` in kibana.multipanels.yml)
 * points here, so Agent Builder, AlertZero and the alert flyout AI features work without a real
 * model. Nothing is "understood": the server picks a canned answer from the request shape.
 *
 *  - `tool_choice: { function: { name } }` (structured output, e.g. conversation titles) answers
 *    with a tool call to that function, filling the required arguments from the JSON schema.
 *  - A conversation that already contains a `tool` result gets a short wrap-up answer.
 *  - Anything else gets a markdown security analysis picked by keywords in the last user message.
 *
 * Streaming (`stream: true`, SSE) and non-streaming JSON responses are both supported.
 *
 *   node multipanels_kibana/mock_llm_server.mjs [port]      (default 18800)
 */

import { createServer } from 'node:http';
import { randomUUID } from 'node:crypto';

const port = Number(process.argv[2] ?? process.env.MOCK_LLM_PORT ?? 18800);
const model = 'gpt-4o';
const streamDelayMs = 12;

const answers = {
  alertSummary: `### Summary

The alert **Suspicious PowerShell Download Cradle** fired on host \`WKSTN-ACCT-0427\` for user \`j.doe\`. A \`powershell.exe\` child of \`winword.exe\` ran an encoded command that fetched a payload from \`hxxp://185.220.101[.]34/update.ps1\` and wrote it to \`%APPDATA%\\Roaming\\svchost.exe\`.

### Why it matters

- Office spawning PowerShell with \`-enc\` is a classic macro-based initial access pattern (MITRE **T1059.001**, **T1204.002**).
- The destination IP is listed in two threat-intel feeds as a Cobalt Strike team server.
- The dropped file name impersonates a system binary outside \`System32\`.

### Recommended next steps

1. Isolate \`WKSTN-ACCT-0427\` with Elastic Defend.
2. Reset credentials for \`j.doe\` and review recent sign-ins.
3. Search other endpoints for the same hash: \`sha256: 4f2e…b1a9\`.
4. Block \`185.220.101.34\` at the egress firewall.`,

  investigation: `I looked at the related events for this alert.

- **Process tree:** \`outlook.exe\` → \`winword.exe\` → \`powershell.exe\` (encoded command) → \`svchost.exe\` (dropped, unsigned).
- **Network:** 3 outbound connections to \`185.220.101.34:443\` within 40 seconds of the drop, JA3 fingerprint matches Cobalt Strike malleable profiles.
- **Persistence:** a new scheduled task \`\\Microsoft\\Windows\\UpdateOrchestrator\\Scan\` points at the dropped binary.
- **Lateral movement:** none observed yet; no SMB or WinRM traffic from the host.

Confidence that this is a true positive is **high**. I recommend escalating it as an incident and isolating the host.`,

  rules: `Here is what I found about the detection rules behind these alerts:

| Rule | Severity | Alerts (24h) | Noise estimate |
| --- | --- | --- | --- |
| Suspicious PowerShell Download Cradle | critical | 3 | low |
| Unusual Parent Process for cmd.exe | high | 14 | medium |
| Potential Credential Access via LSASS | high | 2 | low |
| Multiple Logon Failures Followed by Success | medium | 27 | high |

The *Multiple Logon Failures* rule is producing most of the volume from the Citrix gateway; adding an exception for \`source.ip: 10.20.0.0/16\` would remove ~80% of those alerts without losing coverage.`,

  generic: `Here is what I can tell you based on the data in this Security project:

- **38 open alerts** in the last 24 hours, 3 of them critical, all critical ones on \`WKSTN-ACCT-0427\`.
- The most active rule is *Multiple Logon Failures Followed by Success* (27 alerts), mostly from the Citrix gateway subnet.
- **2 escalations** are waiting in AlertZero, both tied to the same PowerShell download cradle campaign.
- No new hosts were onboarded today; endpoint coverage is unchanged at 412 hosts.

Ask me to summarise an alert, explain a rule, or draft a case description and I will go from there.`,

  afterTool: `I ran the requested lookup. The results are consistent with the earlier analysis: the activity traces back to a single phishing email delivered to \`j.doe\` at 08:42 UTC, and no other host has executed the dropped binary. I would treat this as a contained, high-confidence true positive and proceed with host isolation and credential reset.`,
};

const sampleValues = {
  title: 'Suspicious PowerShell download cradle on WKSTN-ACCT-0427',
  name: 'Suspicious PowerShell download cradle',
  summary:
    'Office-spawned encoded PowerShell fetched and ran an unsigned binary that beacons to a known Cobalt Strike server.',
  description:
    'Office-spawned encoded PowerShell fetched and ran an unsigned binary that beacons to a known Cobalt Strike server.',
  reasoning:
    'Parent/child process chain, threat-intel match on the destination IP and a masquerading dropped file together indicate a true positive.',
  severity: 'high',
  verdict: 'true_positive',
  confidence: 'high',
  query: 'FROM .alerts-security.alerts-default | WHERE host.name == "WKSTN-ACCT-0427" | LIMIT 50',
  esql: 'FROM .alerts-security.alerts-default | WHERE host.name == "WKSTN-ACCT-0427" | LIMIT 50',
};

const lastMessageText = (messages, role) => {
  for (let i = messages.length - 1; i >= 0; i--) {
    const message = messages[i];
    if (message.role !== role) continue;
    if (typeof message.content === 'string') return message.content;
    if (Array.isArray(message.content)) {
      return message.content
        .map((part) => (typeof part === 'string' ? part : part?.text ?? ''))
        .join(' ');
    }
    return '';
  }
  return '';
};

const pickAnswer = (body) => {
  const messages = Array.isArray(body.messages) ? body.messages : [];
  if (messages.some((message) => message.role === 'tool')) return answers.afterTool;

  const prompt = lastMessageText(messages, 'user').toLowerCase();
  if (/\b(rule|rules|noise|tun(e|ing)|exception)\b/.test(prompt)) return answers.rules;
  if (/\b(investigat|process tree|lateral|timeline|what happened|related)/.test(prompt)) {
    return answers.investigation;
  }
  if (/\b(alert|summar|explain|triage|incident)/.test(prompt)) return answers.alertSummary;
  return answers.generic;
};

/** Builds a plausible argument object for a JSON schema (structured outputs). */
const sampleForSchema = (schema, key = '') => {
  if (!schema || typeof schema !== 'object') return sampleValues[key] ?? 'demo';
  if (schema.enum?.length) return schema.enum[0];
  if (schema.const !== undefined) return schema.const;
  const type = Array.isArray(schema.type) ? schema.type[0] : schema.type;
  switch (type) {
    case 'object': {
      const properties = schema.properties ?? {};
      const required = new Set(schema.required ?? Object.keys(properties));
      return Object.fromEntries(
        Object.entries(properties)
          .filter(([propertyKey]) => required.has(propertyKey))
          .map(([propertyKey, propertySchema]) => [
            propertyKey,
            sampleForSchema(propertySchema, propertyKey),
          ])
      );
    }
    case 'array':
      return [sampleForSchema(schema.items, key)];
    case 'integer':
    case 'number':
      return 1;
    case 'boolean':
      return true;
    case 'string':
    default:
      return sampleValues[key] ?? sampleValues[key.toLowerCase()] ?? 'demo';
  }
};

const forcedToolCall = (body) => {
  const name = body.tool_choice?.function?.name;
  if (!name) return undefined;
  const tool = (body.tools ?? []).find((candidate) => candidate.function?.name === name);
  const args = sampleForSchema(tool?.function?.parameters ?? { type: 'object' });
  return {
    id: `call_${randomUUID()}`,
    type: 'function',
    function: { name, arguments: JSON.stringify(args) },
  };
};

const chunk = (delta, finishReason = null) => ({
  id: `chatcmpl-${randomUUID()}`,
  object: 'chat.completion.chunk',
  created: Math.floor(Date.now() / 1000),
  model,
  choices: [{ index: 0, delta, finish_reason: finishReason }],
});

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const writeSse = (res, payload) =>
  new Promise((resolve) => res.write(`data: ${JSON.stringify(payload)}\n\n`, resolve));

const respondStreaming = async (res, { content, toolCall }) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  });

  if (toolCall) {
    await writeSse(
      res,
      chunk({ role: 'assistant', content: null, tool_calls: [{ index: 0, ...toolCall }] })
    );
    await writeSse(res, chunk({}, 'tool_calls'));
  } else {
    await writeSse(res, chunk({ role: 'assistant', content: '' }));
    for (const word of content.split(/(?<=\s)/)) {
      await writeSse(res, chunk({ content: word }));
      await sleep(streamDelayMs);
    }
    await writeSse(res, chunk({}, 'stop'));
  }
  await new Promise((resolve) => res.write('data: [DONE]\n\n', resolve));
  res.end();
};

const respondJson = (res, { content, toolCall }) => {
  const message = toolCall
    ? { role: 'assistant', content: null, tool_calls: [toolCall], refusal: null }
    : { role: 'assistant', content, refusal: null };
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(
    JSON.stringify({
      id: `chatcmpl-${randomUUID()}`,
      object: 'chat.completion',
      created: Math.floor(Date.now() / 1000),
      model,
      choices: [
        { index: 0, message, logprobs: null, finish_reason: toolCall ? 'tool_calls' : 'stop' },
      ],
      usage: { prompt_tokens: 120, completion_tokens: 180, total_tokens: 300 },
    })
  );
};

const readBody = (req) =>
  new Promise((resolve, reject) => {
    const parts = [];
    req.on('data', (part) => parts.push(part));
    req.on('end', () => resolve(Buffer.concat(parts).toString('utf8')));
    req.on('error', reject);
  });

const server = createServer(async (req, res) => {
  if (req.method === 'GET' && (req.url === '/' || req.url === '/health')) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', model }));
    return;
  }
  if (req.method === 'GET' && req.url?.endsWith('/models')) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({ object: 'list', data: [{ id: model, object: 'model', owned_by: 'demo' }] })
    );
    return;
  }
  if (req.method !== 'POST') {
    res.writeHead(404);
    res.end();
    return;
  }

  let body;
  try {
    body = JSON.parse((await readBody(req)) || '{}');
  } catch (error) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: { message: `invalid JSON: ${error.message}` } }));
    return;
  }

  const toolCall = forcedToolCall(body);
  const answer = { toolCall, content: toolCall ? '' : pickAnswer(body) };
  const kind = toolCall ? `tool_call:${toolCall.function.name}` : 'text';
  process.stdout.write(
    `${new Date().toISOString()} ${req.url} stream=${Boolean(body.stream)} -> ${kind}\n`
  );

  if (body.stream) {
    await respondStreaming(res, answer);
  } else {
    respondJson(res, answer);
  }
});

server.listen(port, '127.0.0.1', () => {
  process.stdout.write(`mock LLM listening on http://127.0.0.1:${port}/v1/chat/completions\n`);
});
