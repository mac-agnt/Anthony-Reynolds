import { useState } from "react";
import { A, AGENTS, approvals, cname, daysBetween, dur, elapsed, eur, fmtDate, hhmm, pname, useDerived, vehicleLabel, type Role } from "./store";
import { COMPANIES, COMPANY, RECEIVABLES, SERVICE_VEHICLES, SOURCES, STAFF } from "./fixtures";
import { Avatar, Btn, CLink, Card, Chip, Field, Flag, Head, JLink, Metric, Note, Page, Plate, Seg, Table, canSeeMoney } from "./ui";
import { RegLink as VLink } from "./recordNav";
import { getTheme, go, setTheme } from "./nav";
import { THEMES } from "../logic/data";
import { ANPR_EVENTS, COMMS, NOTICES, STATUS, agoText, attentionLine, attentionList, openVehicle, yardVehicles } from "./yard";
import { KeyloopBadge, KeyloopPanel } from "./keyloop";
import { PlateLink, openRecord } from "./recordNav";
import "./records2.css";

/* ═════════════════════════ RECORDS ═════════════════════════ */
/** The Records hero wash is a positioned layer at z-index 0, so Records pages sit above it explicitly. */
const RecordsPage = ({ children }: { children: React.ReactNode }) => <div style={{ position: "relative", zIndex: 1 }}><Page>{children}</Page></div>;
export function Companies() {
  const [s] = useDerived();
  const [k, setK] = useState<"customer" | "supplier" | "all">("customer");
  const [q, setQ] = useState("");
  const yv = yardVehicles(s);
  const rows = COMPANIES.filter(c => (k === "all" || c.kind === k) && (!q || (c.name + c.contact + (c.account ?? "")).toLowerCase().includes(q.toLowerCase()))).map(c => {
    const onSite = yv.filter(v => v.customerId === c.id);
    const recs = RECEIVABLES.filter(r => r.customer === c.id);
    return {
      c, onSite, total: SERVICE_VEHICLES.filter(v => v.customer === c.id).length + s.stock.filter(v => v.customer === c.id).length,
      jobs: s.jobs.filter(j => j.customer === c.id && j.status !== "completed"), bal: recs.reduce((t, r) => t + r.amount, 0), od: recs.filter(r => daysBetween(r.due) > 0).length,
      holds: onSite.filter(v => v.status === "accounts_hold"),
    };
  }).sort((a, b) => b.onSite.length - a.onSite.length || a.c.name.localeCompare(b.c.name));
  return (
    <RecordsPage><Head title="Companies" sub="Customers and suppliers, joined to the vehicles on site, open jobs, Keyloop account and balance. Customer names are fictional demo companies.">
      <KeyloopBadge />
      <Seg value={k} onChange={setK} options={[["customer", "Customers"], ["supplier", "Suppliers"], ["all", "All"]]} label="Kind" />
      <input className="d-input" style={{ width: 200 }} placeholder="Search company or account" value={q} onChange={e => setQ(e.target.value)} aria-label="Search companies" /></Head>
      <Card className="flush"><Table rowKey={r => r.c.id} rows={rows} onRow={r => A.open("company", r.c.id)} empty="No companies match." cols={[
        { key: "n", label: "Company", render: r => <div><b style={{ fontWeight: 500 }}>{r.c.name}</b><div className="d-muted" style={{ fontSize: 11 }}>{r.c.type}</div></div>, sort: r => r.c.name },
        { key: "ac", label: "Keyloop account", render: r => <span className="d-mono d-muted">{r.c.account ?? "-"}</span> },
        { key: "ch", label: "Preferred channel", render: r => r.c.channel ? <div><Chip>{r.c.channel}</Chip><div className="d-muted" style={{ fontSize: 11, marginTop: 3 }}>{r.c.contact}</div></div> : <span className="d-muted">{r.c.contact}</span> },
        { key: "v", label: "On site", render: r => r.onSite.length ? <div><b>{r.onSite.length}</b> <span className="d-muted">of {r.total}</span><div className="d-row" style={{ gap: 6, marginTop: 3 }}>{r.onSite.slice(0, 3).map(v => <VLink key={v.key} id={v.key} />)}{r.onSite.length > 3 && <span className="d-faint">+{r.onSite.length - 3}</span>}</div></div> : <span className="d-muted">{r.total ? `0 of ${r.total}` : "-"}</span>, sort: r => r.onSite.length },
        { key: "j", label: "Open jobs", num: true, render: r => r.jobs.length ? <span className="d-row" style={{ gap: 6, justifyContent: "flex-end" }}>{r.jobs.slice(0, 2).map(j => <JLink key={j.id} id={j.id} />)}{r.jobs.length > 2 && <span className="d-faint">+{r.jobs.length - 2}</span>}</span> : "0", sort: r => r.jobs.length },
        { key: "b", label: "Balance", num: true, render: r => canSeeMoney(s) ? (r.bal ? <span style={{ color: r.od ? "var(--bad)" : undefined }}>{eur(r.bal)}</span> : "-") : <span className="d-faint">hidden</span>, sort: r => r.bal },
        { key: "h", label: "Accounts", render: r => r.holds.length ? <Chip tone="bad">{r.holds.length} on hold</Chip> : r.od && canSeeMoney(s) ? <Chip tone="warn">{r.od} overdue</Chip> : r.c.kind === "customer" ? <Chip tone="ok">Clear</Chip> : <span className="d-faint">-</span>, sort: r => r.holds.length * 10 + r.od },
      ]} /></Card></RecordsPage>
  );
}

interface VRow { key: string; reg: string; kind: "On site" | "Dealership stock" | "Not on site"; model: string; custId: string | null; status: { label: string; tone: "ok" | "warn" | "bad" | "acc" | undefined; order: number }; job: string | null; location: string; last: string }
export function Vehicles() {
  const [s] = useDerived();
  const [f, setF] = useState<"all" | "site" | "stock" | "off">("all");
  const [q, setQ] = useState("");
  const yv = yardVehicles(s);
  const onYard = new Set(yv.map(v => v.key));
  const rows: VRow[] = [
    ...yv.map(v => ({ key: v.key, reg: v.reg, kind: "On site" as const, model: v.model, custId: v.customerId, status: { label: STATUS[v.status].label, tone: STATUS[v.status].tone, order: STATUS[v.status].order }, job: v.jobId, location: v.location, last: `${v.last.who}, ${v.last.channel}, ${agoText(v.last.minsAgo)}` })),
    ...s.stock.filter(v => !onYard.has(v.id)).map(v => ({ key: v.id, reg: v.reg || v.id, kind: "Dealership stock" as const, model: `Renault ${v.model} ${v.variant}`, custId: v.customer ?? v.sold?.buyer ?? v.promisedTo ?? null,
      status: { label: v.status.toUpperCase(), tone: v.status === "available" ? "ok" as const : v.status === "sold" ? undefined : v.status === "incoming" ? "acc" as const : "warn" as const, order: 20 + ["available", "reserved", "preparation", "incoming", "sold"].indexOf(v.status) },
      job: v.jobRef, location: v.status === "incoming" ? `Incoming${v.eta ? `, ETA ${fmtDate(v.eta)}` : ""}` : v.location, last: "Keyloop stock record" })),
    ...SERVICE_VEHICLES.filter(v => !onYard.has(v.id) && v.customer).map(v => { const n = NOTICES.find(x => x.vehicle === v.id); return { key: v.id, reg: v.reg, kind: "Not on site" as const, model: `${v.model} ${v.kind.toLowerCase()}`, custId: v.customer, status: { label: s.cvrt.some(t => t.vehicle === v.id) ? "CVRT TODAY" : n ? "NOTICE DUE" : "OFF SITE", tone: n ? "warn" as const : undefined, order: 40 }, job: s.jobs.find(j => j.vehicle === v.id && j.status !== "completed")?.id ?? null, location: n ? `Renault notice ${n.id}, due ${fmtDate(n.due)}` : "Customer yard", last: "Keyloop vehicle record" }; }),
  ].sort((a, b) => a.status.order - b.status.order).filter(r => (f === "all" || (f === "site" ? r.kind === "On site" : f === "stock" ? r.kind === "Dealership stock" : r.kind === "Not on site")) && (!q || (r.key + r.reg + r.model + cname(r.custId) + (r.job ?? "")).toLowerCase().replace(/-/g, "").includes(q.toLowerCase().replace(/-/g, ""))));
  const nSite = yv.length, nStock = s.stock.filter(v => !onYard.has(v.id)).length;
  return (
    <RecordsPage><Head title="Vehicles" sub={`${nSite} vehicles on site, ${nStock} dealership stock records and the customer fleet, one canonical record per vehicle. Open any registration for the full story.`}>
      <KeyloopBadge />
      <Seg value={f} onChange={setF} options={[["all", "All"], ["site", "On site"], ["stock", "Dealership stock"], ["off", "Not on site"]]} label="Filter" />
      <input className="d-input" style={{ width: 220 }} placeholder="Search reg, model, customer, job" value={q} onChange={e => setQ(e.target.value)} aria-label="Search vehicles" /></Head>
      <Card className="flush"><Table rowKey={r => r.key} rows={rows} limit={25} onRow={r => openRecord(s, r.key)} empty="No vehicles match." cols={[
        { key: "reg", label: "Registration", render: r => r.reg === r.key ? <VLink id={r.key} /> : <PlateLink s={s} id={r.key} reg={r.reg} />, sort: r => r.reg },
        { key: "m", label: "Vehicle", render: r => r.model, sort: r => r.model },
        { key: "c", label: "Customer", render: r => <CLink id={r.custId} />, sort: r => cname(r.custId) },
        { key: "s", label: "Status", render: r => <Chip tone={r.status.tone}>{r.status.label}</Chip>, sort: r => r.status.order },
        { key: "j", label: "Job", render: r => r.job ? <JLink id={r.job} /> : <span className="d-faint">-</span>, sort: r => r.job ?? "z" },
        { key: "l", label: "Location", render: r => <span className="d-muted">{r.location}</span>, sort: r => r.location },
        { key: "u", label: "Last update", render: r => <span className="d-muted">{r.last}</span> },
      ]} /></Card></RecordsPage>
  );
}

/* ═════════════════════════ AGENTS ═════════════════════════ */
export function Runs() {
  const [s] = useDerived();
  return (
    <Page><Head title="Agent runs" sub="Every run lists its inputs, source references and outputs. Runs use local fixtures — nothing is sent externally." />
      <Card title="Run a sample" style={{ marginBottom: 14 }}><div className="d-row">{AGENTS.map(a => <Btn key={a.id} sm onClick={() => A.runAgent(a.id)}>{a.name}</Btn>)}</div></Card>
      <div className="d-grid">{s.runs.map(r => {
        const a = AGENTS.find(x => x.id === r.agent);
        return <Card key={r.id} title={<>{a?.name} <span className="d-muted">· {r.id} · {r.at}</span></>} aside={<Chip tone={r.status === "Approved locally" ? "ok" : r.status === "Needs review" ? "warn" : "acc"}>{r.status}</Chip>}>
          <div className="d-grid d-g2"><div><div className="d-eyebrow">Inputs</div>{r.inputs.map(i => <div key={i} className="d-muted">· {i}</div>)}</div><div><div className="d-eyebrow">Outputs (draft)</div>{r.outputs.map(o => <div key={o}>· {o}</div>)}</div></div>
          {(r.status === "Needs review" || r.status === "Draft prepared") && <div className="d-row" style={{ marginTop: 10 }}><Btn sm onClick={() => A.approveRun(r.id)}>Approve locally</Btn><span className="d-faint">Sample run — not a real AI call</span></div>}
        </Card>;
      })}</div></Page>
  );
}
export function AiControls() {
  const [s] = useDerived();
  const R = s.rules;
  return (
    <Page><Head title="AI controls" sub="One configuration, shown in both Agents → Controls and Settings → AI Controls. Demo assumptions — configurable." />
      <div className="d-grid d-g2">
        <Card title="Ops Watchdog rules"><div className="d-grid d-g3">
          <Field label="Gap threshold (min)"><input className="d-input" type="number" value={R.gap} onChange={e => A.setRule("gap", +e.target.value)} /></Field>
          <Field label="Budget warning (%)"><input className="d-input" type="number" value={R.warn} onChange={e => A.setRule("warn", +e.target.value)} /></Field>
          <Field label="Over budget (%)"><input className="d-input" type="number" value={R.over} onChange={e => A.setRule("over", +e.target.value)} /></Field>
        </div><Note>Breaks, leave and approved training are always excluded. Stale data is never treated as proof someone is idle.</Note></Card>
        <Card title="Human review required for">{([["reviewWork", "Work descriptions on job cards"], ["reviewDiscount", "Discounts above the threshold"], ["reviewComms", "Customer communication"], ["reviewAccounts", "Accounting changes"], ["reviewSafety", "Safety-related and test outcomes"]] as const).map(([k, l]) =>
          <div className="d-li" key={k}><span className="d-grow">{l}</span><Chip tone="ok">Required</Chip></div>)}<Note>Locked on in this demo — no agent can approve, send, post or certify.</Note></Card>
        <Card title="Write-back to Keyloop" aside={<KeyloopBadge />} style={{ gridColumn: "1 / -1" }}>
          <div className="d-grid d-g2">
            <div>{[["Job status changed in Pulse", "Written back on change and logged", "ok"], ["Awaiting-parts flag with the PO number", "Written back automatically", "ok"], ["Release clearance note on the customer account", "Only after accounts approve", "warn"], ["New vehicle from an unmatched ANPR read", "Requested, then reviewed in Keyloop", "warn"]].map(([a, b, tone]) =>
              <div className="d-li" key={a}><span className="d-grow">{a}</span><Chip tone={tone as "ok" | "warn"}>{b}</Chip></div>)}</div>
            <div><div className="d-eyebrow" style={{ marginBottom: 6 }}>Latest sync log</div>{s.yard.keyloopLog.slice(0, 4).map((l, i) => <div className="d-li" key={i}><span className="d-mono d-faint" style={{ width: 42 }}>{l.at}</span><Chip tone={l.dir === "Pulse to Keyloop" ? "acc" : undefined}>{l.dir}</Chip><span className="d-grow d-muted">{l.text}</span></div>)}</div>
          </div>
          <Note>Demo representation of the intended integration. Agents never post invoices or change a ledger.</Note>
        </Card>
        <Card title="Agent permissions" style={{ gridColumn: "1 / -1" }}><Table rowKey={a => a.id} rows={AGENTS} cols={[
          { key: "n", label: "Agent", render: a => <b style={{ fontWeight: 500 }}>{a.name}</b> }, { key: "p", label: "Purpose", render: a => <span className="d-muted">{a.purpose}</span> },
          { key: "s", label: "Reads", render: a => a.sources.join(", ") }, { key: "w", label: "Writes", render: () => <Chip>Drafts only</Chip> }, { key: "e", label: "External", render: () => <Chip>None</Chip> },
          { key: "l", label: "Limit", render: a => <span className="d-muted">{a.limit}</span> },
        ]} /></Card>
      </div></Page>
  );
}

/* ═════════════════════════ ACTIVITY ═════════════════════════ */
export function ActivityPage({ tab }: { tab: string }) {
  const [s, d] = useDerived();
  if (tab === "attention") {
    const ap = approvals(s, d);
    const rows = [
      ...d.gaps.map(g => ({ k: g.id, what: `${pname(g.id)} present, no job clocking since ${g.since} (${dur(g.gapMin ?? 0)})`, owner: "p-jonathan", go: () => go("Workshop", "live") })),
      ...d.budgetFlags.map(f => ({ k: f.j.id, what: `${f.j.id} at ${elapsed(f.j, s.clock)}/${f.j.budgetMin} min — ${pname(f.j.tech)}`, owner: "p-jonathan", go: () => go("Workshop", "live") })),
      ...attentionList(s).map(v => { const l = attentionLine(v); return { k: "y-" + v.key, what: `${v.reg} ${v.customer}: ${l.head.charAt(0) + l.head.slice(1).toLowerCase().replace("cvrt", "CVRT")}, ${l.sub}`, owner: v.status === "accounts_hold" ? "p-caroline" : v.status === "cvrt_issue" ? "p-elizabeth" : v.part?.owner ?? "p-anthony", go: () => openVehicle(v.key) }; }),
      ...ap.map(a => ({ k: a.id, what: `${a.queue}: ${a.title}`, owner: a.reviewer, go: () => go("Work", "approvals") })),
    ];
    return <Page><Head title="Needs attention" sub="Derived live from the current records — not a second, static alert list." />
      <Card className="flush"><Table rowKey={r => r.k} rows={rows} onRow={r => r.go()} cols={[
        { key: "w", label: "Item", render: r => r.what }, { key: "o", label: "Owner", render: r => <span className="d-row" style={{ gap: 6 }}><Avatar id={r.owner} size={22} />{pname(r.owner)}</span> },
      ]} empty="Nothing needs attention." /></Card></Page>;
  }
  const evs = s.activity.filter(a => tab === "all" || (tab === "people" ? a.kind === "person" : tab === "agents" ? a.kind === "agent" : true));
  const link = (e: string | undefined) => !e ? null : e.startsWith("JOB-") ? <JLink id={e} /> : /^V\d|^C\d/.test(e) ? <VLink id={e} /> : <span className="d-mono d-faint">{e}</span>;
  return <Page><Head title={{ all: "Everything", people: "People", agents: "Agents" }[tab] ?? "Activity"} sub="Human, agent, import and workflow events, newest first. Agent events are sample runs. Keyloop sync events are shown with their source."><KeyloopBadge /></Head>
    <Card className="flush"><Table rowKey={e => e.id} rows={evs} limit={25} cols={[
      { key: "t", label: "Time", render: e => <span className="d-mono">{e.at}</span> },
      { key: "k", label: "Source", render: e => <Chip tone={e.kind === "agent" ? "acc" : e.kind === "import" ? "warn" : undefined}>{e.kind === "agent" ? "Agent · sample" : e.kind}</Chip> },
      { key: "w", label: "Who", render: e => e.who }, { key: "x", label: "What", render: e => e.text }, { key: "r", label: "Record", render: e => link(e.entity) },
    ]} /></Card></Page>;
}

/* ═════════════════════════ SETTINGS ═════════════════════════ */
export function Organisation() {
  return <Page><Head title="Organisation" sub="Verified public facts are separated from demo configuration." />
    <div className="d-grid d-g2">
      <Card title="Company"><dl className="d-kv"><dt>Name</dt><dd>{COMPANY.name}</dd><dt>Address</dt><dd>{COMPANY.address}</dd><dt>Website</dt><dd>{COMPANY.website}</dd><dt>Founded</dt><dd>{COMPANY.founded} by {COMPANY.founder}</dd><dt>Legal entity / registration</dt><dd className="d-muted">{COMPANY.legal}</dd><dt>Timezone</dt><dd>{COMPANY.timezone} · EUR · en-IE · 24-hour</dd></dl></Card>
      <Card title="Brand"><div className="d-row"><span className="d-avatar" style={{ width: 44, height: 44, borderRadius: 12, background: "linear-gradient(90deg,#2034AB,#6C8CFF)", color: "#fff", fontSize: 14 }}>RC</span><div><b>RC monogram</b><div className="d-muted">The official logo file can be dropped into <span className="d-mono">public/</span>; the app never hotlinks it.</div></div></div>
        <div className="d-row" style={{ marginTop: 12, gap: 6 }}>{["#2034AB", "#2C2C2C", "#F5F4F0", "#AAA9A5", "#6C8CFF"].map(c => <span key={c} className="d-chip"><i style={{ width: 10, height: 10, borderRadius: 3, background: c, border: "1px solid var(--border)" }} />{c}</span>)}</div>
        <Note>#2034AB verified on the website; #6C8CFF is a proposed adaptation for dark glass, not an official brand colour.</Note></Card>
      <Card title="Demo data notice" style={{ gridColumn: "1 / -1" }}><Flag>All jobs, balances, customers, documents, staff performance and forecasts are fictional demo scenarios, frozen at Monday 19 October 2026, 10:00 Europe/Dublin. They are not statements about real people or businesses. Staff emails are display-only.</Flag></Card>
    </div></Page>;
}
export function Teams() {
  const [s] = useDerived();
  const depts = ["Management", "Workshop", "Parts", "Sales", "CVRT", "Accounts"];
  return <Page><Head title="Teams & permissions" sub={`${STAFF.length} people · 15 technicians + 15 support (including the 7 management/team contacts).`}>
    <Field label="Role preview"><Seg value={s.role} onChange={(r: Role) => A.setRole(r)} options={[["management", "Management"], ["workshop", "Mechanic"], ["sales", "Sales"], ["accounts", "Accounts"]]} /></Field></Head>
    <Flag>Role preview illustrates visibility only — e.g. mechanics and sales don't see receivables or accounts detail. It is not production authorisation.</Flag>
    <div className="d-grid d-g3" style={{ margin: "14px 0" }}>{depts.map(dp => <Metric key={dp} label={dp} value={STAFF.filter(p => p.dept === dp).length} hint={STAFF.filter(p => p.dept === dp && p.verified).map(p => p.name).join(", ") || "fictional staff"} />)}</div>
    <Card className="flush"><Table rowKey={p => p.id} rows={STAFF} limit={12} cols={[
      { key: "n", label: "Name", render: p => <span className="d-row" style={{ gap: 7 }}><Avatar id={p.id} size={22} />{p.name}</span>, sort: p => p.name },
      { key: "r", label: "Role", render: p => p.role, sort: p => p.role }, { key: "d", label: "Team", render: p => p.dept, sort: p => p.dept },
      { key: "e", label: "Email", render: p => <span className="d-muted">{p.email}</span> },
      { key: "v", label: "Source", render: p => p.verified ? <Chip tone="ok">Public business contact</Chip> : <Chip>Fictional demo</Chip>, sort: p => String(p.verified) },
    ]} /></Card></Page>;
}
const SYSTEMS = [
  ["Keyloop", "System of record for customers, vehicles, jobs, parts, invoices and sales", "Demo representation, shown as connected", "Exact modules, partner API access, dealer consent, read and write permissions, update frequency"],
  ["WhatsApp groups", "Parts, workshop, yard and service desk groups hold daily operational detail", "Simulated, matched to vehicles", "Which groups and numbers may be read, and consent for customer threads"],
  ["Email mailboxes", "accounts@, service advisors and the Renault notices mailbox", "Simulated, matched to vehicles", "Mailbox access method and retention"],
  ["ANPR gate cameras", "Gate 1 in and out, Gate 2 CVRT", "Simulated, planned", "Camera vendor, event feed and plate-read confidence thresholds"],
  ["Renault notices", "Periodic inspection emails forwarded to customers by hand today", "Simulated, matched to customers", "Notice format and sender consistency"],
  ["AssetMinder", "Current workshop source", "Legacy sample export", "Which reports and identifiers remain available during migration?"],
  ["Sage", "Current accounts, version unknown", "Legacy sample snapshot", "Which historical balances need retaining after Keyloop migration?"],
  ["Bizimply", "Attendance, leave, HR information", "Sample report · API unconfirmed", "Which approved attendance/rota fields can be accessed, and how?"],
  ["Renault order book", "Weekly spreadsheet", "Local sample import + diff", "File format, stable IDs, status definitions, delivery method"],
  ["Renault portal / Bodybuilder", "Manual specification retrieval", "Sample attached document", "Authorised download/API route, identifier matching, permitted automation"],
  ["Excel", "Quotes and associated paperwork", "Sample mapping + generated preview", "Obtain the actual templates and required fields"],
  ["SharePoint", "Folder-link field on stock records", "Reference links only", "Storage location, permissions, approved access"],
  ["Gemini prototypes", "Anthony's disconnected tools", "Requirements reference only", "Which behaviours to retain? No production sync assumed"],
];
export function Systems() {
  const steps = ["Authorised source", "Validated import / sync", "Linked records", "Pulse workflows", "Human review", "Permitted export / write-back"];
  return <Page><Head title="Systems" sub="Pulse is the visibility, coordination and AI layer around Keyloop — not a replacement for it, Bizimply or payroll." />
    <Card title="Proposed data flow" style={{ marginBottom: 14 }}>
      <div className="d-row" style={{ gap: 6, alignItems: "stretch" }}>{steps.map((st, i) => <div key={st} className="d-row" style={{ gap: 6 }}>
        <div className="d-card" style={{ padding: "10px 12px", background: i === 0 || i === 5 ? "var(--surface-2)" : "var(--accent-faint)" }}><b style={{ fontWeight: 500 }}>{st}</b>{(i === 0 || i === 5) && <div><Chip tone="warn">Access to confirm</Chip></div>}</div>
        {i < steps.length - 1 && <span className="d-faint">→</span>}</div>)}</div>
      <Note>Explanatory view only. Proposed changes to external systems go to a review queue and never silently overwrite a source record.</Note>
    </Card>
    <Card className="flush" title={undefined}><Table rowKey={r => r[0]} rows={SYSTEMS} cols={[
      { key: "n", label: "System", render: r => <b style={{ fontWeight: 500 }}>{r[0]}</b> }, { key: "e", label: "Evidence from the call", render: r => r[1] },
      { key: "s", label: "Demo state", render: r => <Chip tone={r[0] === "Keyloop" ? "acc" : undefined}>{r[2]}</Chip> }, { key: "q", label: "Question to preserve", render: r => <span className="d-muted">{r[3]}</span> },
    ]} /></Card>
    <Card title="Suggested sequence (proposal)" style={{ marginTop: 14 }}>{["Before/around Keyloop go-live: confirm field coverage, identifiers, sample exports and allowed access; validate this demo with Anthony.", "First one or two months on Keyloop: observe real workflows and identify actual gaps.", "First integration slice: read-only operational visibility, labour reconciliation and morning meeting.", "Later, after access and workflow validation: reviewed job-card write-back, sales-document flow, additional approved actions."].map((t, i) => <div className="d-li" key={i}><Chip>{i + 1}</Chip><span>{t}</span></div>)}
      <Note>No fixed price, delivery promise or integration guarantee.</Note></Card>
  </Page>;
}
function tally<T>(list: T[], key: (x: T) => string): [string, T[]][] {
  const m = new Map<string, T[]>();
  list.forEach(x => { const k = key(x); m.set(k, [...(m.get(k) ?? []), x]); });
  return [...m.entries()];
}
function SourceCard({ title, rows, note, state = "Simulated" }: { title: string; rows: [string, string][]; note: string; state?: string }) {
  return (
    <Card title={title} aside={<Chip tone="acc">{state}</Chip>}>
      <div className="d-list">{rows.map(([a, b]) => <div className="d-li" key={a} style={{ flexDirection: "column", alignItems: "flex-start", gap: 2 }}><span>{a}</span><span className="d-muted">{b}</span></div>)}</div>
      <div style={{ marginTop: 8 }}><Note>{note}</Note></div>
    </Card>
  );
}
export function Integrations() {
  const [s] = useDerived();
  const today = COMMS.filter(c => c.day === "Today");
  const wa = tally(today.filter(c => c.channel === "WhatsApp"), c => c.source).map(([n, l]) => [n, `${l.length} ${l.length === 1 ? "message" : "messages"}, last ${l[0].at}`] as [string, string]);
  const mail = tally(today.filter(c => c.channel === "Email"), c => c.source).map(([n, l]) => [n, `${l.length} ${l.length === 1 ? "email" : "emails"}, last ${l[0].at}`] as [string, string]);
  const cams = tally(ANPR_EVENTS.filter(e => e.day === "Today"), e => e.camera).map(([n, l]) => [n, `${l.length} ${l.length === 1 ? "read" : "reads"}, lowest confidence ${Math.min(...l.map(e => e.confidence))}%`] as [string, string]);
  const srcs = [
    { n: "AssetMinder", label: SOURCES.assetminder, fresh: `${hhmm(s.clock - 10)} today`, state: "Legacy sample export", tone: "warn" as const, fields: ["Job number to Job", "Technician to Person", "Clock on/off to Time entry", "Registration to Vehicle"], rejected: 0, dups: 0 },
    { n: "Sage", label: SOURCES.sage, fresh: "07:00 today", state: "Legacy sample snapshot", tone: "warn" as const, fields: ["Account to Company", "Invoice to Invoice snapshot", "Balance to Receivable (total)"], rejected: 1, dups: 0 },
    { n: "Bizimply", label: SOURCES.bizimply, fresh: "08:00 today", state: "Sample report, API unconfirmed", tone: "warn" as const, fields: ["Employee to Person", "Status to Attendance (present, absent, training)", "Reason not imported"], rejected: 0, dups: 0 },
    { n: "Renault order book", label: SOURCES.renault, fresh: s.imports.applied.length ? `${s.imports.history[0].at}` : "Mon 12 Oct", state: s.imports.applied.length ? "Applied, local" : "Diff pending", tone: s.imports.applied.length ? "ok" as const : "warn" as const, fields: ["SVO to Order reference", "VIN to Vehicle (when issued)", "ETA to Arrival date"], rejected: 0, dups: s.imports.history.filter(h => h.id.endsWith("repeat")).length },
  ];
  return <Page><Head title="Integrations" sub="Keyloop is the system of record. Pulse joins it to the channels below. This is a demo representation of the intended architecture; nothing here is a live connection." />
    <div style={{ marginBottom: 14 }}><KeyloopPanel /></div>
    <div className="d-eyebrow" style={{ margin: "18px 0 8px" }}>Other sources Pulse reads (simulated)</div>
    <div className="r-src">
      <SourceCard title="WhatsApp groups" rows={wa} note="Messages are read, matched to a vehicle, customer and job, and filed on the timeline." />
      <SourceCard title="Email mailboxes" rows={mail} note="Shared mailboxes are matched the same way. Replies are drafted, never sent without approval." />
      <SourceCard title="ANPR gate cameras" rows={cams} note="Planned integration. Each read is matched against Keyloop and the active job before the vehicle joins the yard." state="Simulated, planned" />
      <SourceCard title="Renault notices" rows={[["Periodic inspection notices", `${NOTICES.length} on file`], ["Received today", `${NOTICES.filter(n => n.received.startsWith("2026-10-19")).length}`], ["Sender", "Renault Trucks Ireland"]]} note="Notices are matched to the customer and vehicle, then offered to Inspections for an approved reminder." />
    </div>
    <div className="d-eyebrow" style={{ margin: "22px 0 8px" }}>Legacy sample imports</div>
    <div className="d-grid d-g2">{srcs.map(x => <Card key={x.n} title={x.n} aside={<Chip tone={x.tone}>{x.state}</Chip>}>
      <dl className="d-kv"><dt>Source</dt><dd>{x.label}</dd><dt>Freshness</dt><dd>{x.fresh}</dd><dt>Rejected rows</dt><dd>{x.rejected}{x.rejected ? ", invoice with no matching account (sample)" : ""}</dd><dt>Duplicate warnings</dt><dd>{x.dups}{x.dups ? " repeat import skipped" : ""}</dd></dl>
      <div className="d-eyebrow" style={{ margin: "10px 0 4px" }}>Mapping preview</div>{x.fields.map(f => <div key={f} className="d-muted">· {f}</div>)}
      <div className="d-row" style={{ marginTop: 10 }}><Btn sm onClick={() => A.toast(`Retry preview: would re-read the ${x.label}. Nothing sent.`)}>Retry preview</Btn></div>
    </Card>)}</div></Page>;
}
export function Governance() {
  const [s] = useDerived();
  const [ret, setRet] = useState("1 year");
  const [exp, setExp] = useState(true);
  const reviews = s.activity.filter(a => a.kind === "person").slice(0, 8);
  return <Page><Head title="Governance" sub="Provenance, access examples, review history and export controls. No certification or legal compliance is claimed by a UI demo." />
    <div className="d-grid d-g2">
      <Card title="Source provenance">{Object.values(SOURCES).map(x => <div className="d-li" key={x}><Chip>Sample</Chip><span>{x}</span></div>)}<div className="d-li"><Chip tone="acc">Pulse</Chip><span>Local tasks, approvals, annotations and presentation state</span></div></Card>
      <Card title="Access examples"><div className="d-li"><span className="d-grow">Mechanic</span><span className="d-muted">Jobs, own clocking — no receivables, no costs</span></div><div className="d-li"><span className="d-grow">Sales</span><span className="d-muted">Stock, quotes, internal workings — no receivables</span></div><div className="d-li"><span className="d-grow">Accounts</span><span className="d-muted">Invoice readiness, balances, clearance</span></div><div className="d-li"><span className="d-grow">Management</span><span className="d-muted">Everything</span></div></Card>
      <Card title="Review history">{reviews.map(r => <div className="d-li" key={r.id}><span className="d-mono d-faint">{r.at}</span><span className="d-grow"><b style={{ fontWeight: 500 }}>{r.who}</b> <span className="d-muted">{r.text}</span></span></div>)}</Card>
      <Card title="Export controls & retention (sample configuration)">
        <label className="d-li"><input type="checkbox" checked={exp} onChange={e => setExp(e.target.checked)} /><span className="d-grow">Exports carry SAMPLE/DRAFT labels and need a named preparer</span></label>
        <Field label="Activity retention"><select className="d-select" value={ret} onChange={e => setRet(e.target.value)}>{["90 days", "1 year", "7 years"].map(x => <option key={x}>{x}</option>)}</select></Field>
        <Note>Local demo setting — not a policy.</Note></Card>
    </div></Page>;
}
export function Experience() {
  const [s] = useDerived();
  const [theme, setT] = useState(getTheme());
  const [notif, setNotif] = useState({ inbox: true, digest: true });
  return <Page><Head title="Experience" sub="Theme, notifications, demo clock and reset." />
    <div className="d-grid d-g2">
      <Card title="Theme"><div className="d-row">{(THEMES as { id: string; label: string; accent: string }[]).map(t => <button key={t.id} className={"d-chip " + (theme === t.id ? "sel" : "")} onClick={() => { setTheme(t.id); setT(t.id); }}><i style={{ width: 10, height: 10, borderRadius: 3, background: t.accent }} />{t.label}</button>)}</div></Card>
      <Card title="Demo clock"><div className="d-row"><Chip>Now {hhmm(s.clock)}</Chip><Btn sm onClick={() => A.advance(15)}>Simulate +15 min</Btn><Btn sm onClick={() => A.advance(60)}>+1 hour</Btn><Btn sm kind="ghost" onClick={A.resetClock}>Back to 10:00</Btn></div><Note>Frozen at the snapshot by default. Durations, alerts and the meeting follow this clock.</Note></Card>
      <Card title="Notifications"><label className="d-li"><input type="checkbox" checked={notif.inbox} onChange={e => setNotif({ ...notif, inbox: e.target.checked })} /><span>In-app inbox for items that need me</span></label><label className="d-li"><input type="checkbox" checked={notif.digest} onChange={e => setNotif({ ...notif, digest: e.target.checked })} /><span>Morning briefing at 07:00 (in app only)</span></label></Card>
      <Card title="Reset demo"><p className="d-muted" style={{ marginTop: 0 }}>Restores the complete canonical snapshot — every page, total and approval — not individual pages.</p><Btn kind="danger" onClick={A.reset}>Reset to 10:00 snapshot</Btn></Card>
    </div></Page>;
}
export function SettingsPage({ tab }: { tab: string }) {
  switch (tab) {
    case "teams": return <Teams />; case "systems": return <Systems />; case "integrations": return <Integrations />;
    case "governance": return <Governance />; case "ai": return <AiControls />; case "experience": return <Experience />;
    default: return <Organisation />;
  }
}
export { vehicleLabel, canSeeMoney };
