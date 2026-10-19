# Kibana Serverless Security — multi-panel UI demo

A small, standalone Vite + React + `@elastic/eui` app that replicates the look and the key
interactions of Kibana Serverless **Security** on fake, in-browser data. It exists so the
multi-panel UI (alerts table → expandable flyout → left panel → preview panels, plus the
Agent Builder chat and the AlertZero queue) can be demoed without Elasticsearch or a Kibana
bootstrap.

It is **not** a Kibana plugin. It has its own `package.json` / `package-lock.json`, uses `npm`,
and is excluded from the repo-wide ESLint / Prettier configs (`/multipanels-demo` in the root
`.eslintignore` and `.prettierignore`). Nothing in Kibana's build picks it up.

## Running

```bash
cd multipanels-demo
npm install
npm run dev          # http://localhost:5173
```

Other scripts:

| Script                     | What it does                                                                 |
| -------------------------- | ---------------------------------------------------------------------------- |
| `npm run build`            | Regular static build → `dist/`                                               |
| `npm run build:singlefile` | Single self-contained `dist-singlefile/index.html` (JS/CSS inlined, works from `file://`) |
| `npm run preview`          | Serves `dist/` on http://localhost:4173                                      |
| `npm run typecheck`        | `tsc --noEmit`                                                               |

Routing uses a `HashRouter`, so the single-file build can be opened straight from disk:
`#/alerts`, `#/alertzero`, `#/agents`, `#/agents/manage/agents`, `#/agents/conversations/:id`.

## What is live

Only three navigation items route anywhere. Every other item in the Security side nav is
rendered with its real label and icon but is inert (a tooltip says so on hover).

| Page          | Replicates                                                                                  |
| ------------- | ------------------------------------------------------------------------------------------- |
| **Alerts**    | KQL bar, date picker, Status/Severity/User/Host filter controls, Severity/Alerts-by-name counts + trend chart, `EuiDataGrid` alerts table with bulk actions, and the full **expandable flyout**: right panel (header blocks, Overview/Table/JSON tabs, Take action), left panel (Visualize / Insights / Investigation / Response / Notes), preview panels (rule, host, user, alert reason, alert) with banner + back/close + history. |
| **Agents**    | Agent Builder: 300px unified sidebar (agent selector, New/Search, Customize, Pinned, Chats, Manage components), new-conversation prompt, conversations with tool-call steps and markdown answers (canned responses), and the manage view (agents table, agent overview). |
| **AlertZero** | The upstream `alertzero` plugin's proposals queue: greeting header with Watches/Workers, Respond/Investigate/Configure trend row, Impact pills, queue accordions with proposal cards, proposal flyout with evidence alerts (deep-links into the Alerts flyout), approve/dismiss/escalate moving items to Closed actions. |

Status, assignee and note changes, new chats, pinned chats and approved proposals are kept in
React state only; reloading resets everything.

## Shortcuts versus real Kibana

- Data is hand-written in `src/data/*.ts`; there is no backend and no search.
- Charts are small hand-drawn SVGs (`src/components/charts.tsx`), not `@elastic/charts`.
- The flyout is a purpose-built reimplementation of the `@kbn/expandable-flyout` model (right /
  left / preview sections with history) rather than the package itself.
- Timeline, cases, rule management, grouping, the treemap chart, agent/tool/skill creation and
  the global search are not implemented; the buttons show a toast instead.
- `react-router-dom` v6 (Kibana uses v5), `HashRouter` instead of `BrowserRouter`.
- Icons use `@elastic/eui` 123 names, which differ from some legacy names used in Kibana.
- `React.StrictMode` is intentionally off: EUI's `useObserver` (behind `EuiAccordion`'s resize
  observer) does not survive StrictMode's simulated remount and accordions stay at 0px.

## Layout

```
src/
  main.tsx, app.tsx           providers + routes
  chrome/                     serverless header, Security side nav (full nav tree), breadcrumbs
  pages/alerts/               alerts page (filters, charts, data grid)
  flyout/                     expandable flyout: context/reducer, right, left, preview, shared
  pages/agents/               Agent Builder (state provider, sidebar, conversation, manage views)
  pages/alertzero/            AlertZero proposals queue
  data/                       fake alerts, agents/conversations, proposals
  components/                 toasts, charts, formatters, page header
```
