import { useState } from "react";
import { A, AGENTS, approvals, cname, dur, elapsed, handoverGates, hhmm, pname, useDerived, vehicleLabel, type Role } from "./store";
import { COMPANIES, COMPANY, SERVICE_VEHICLES, SOURCES, STAFF } from "./fixtures";
import { Avatar, Btn, Card, Chip, Field, Flag, Head, JLink, Metric, Note, Page, Seg, Table, VLink, canSeeMoney } from "./ui";
import { getTheme, go, setTheme } from "./nav";
import { THEMES } from "../logic/data";

/* ═════════════════════════ RECORDS ═════════════════════════ */
export function Companies() {
  const [s] = useDerived();
  return (
    <Page><Head title="Companies" sub="Customers and suppliers. Customer names are fictional demo companies; Renault is shown as the manufacturer source." />
      <Card className="flush"><Table rowKey={c => c.id} rows={COMPANIES} onRow={c => A.open("company", c.id)} cols={[
        { key: "n", label: "Company", render: c => <b style={{ fontWeight: 500 }}>{c.name}</b>, sort: c => c.name },
        { key: "k", label: "Kind", render: c => <Chip tone={c.kind === "supplier" ? "acc" : undefined}>{c.kind}</Chip>, sort: c => c.kind },
        { key: "t", label: "Type", render: c => c.type }, { key: "c", label: "Contact", render: c => c.contact },
        { key: "v", label: "Vehicles", num: true, render: c => SERVICE_VEHICLES.filter(v => v.customer === c.id).length + s.stock.filter(v => v.customer === c.id).length },
        { key: "j", label: "Live jobs", num: true, render: c => s.jobs.filter(j => j.customer === c.id && j.status !== "completed").length },
      ]} /></Card></Page>
  );
}
export function Vehicles() {
  const [s] = useDerived();
  const [f, setF] = useState<"all" | "stock" | "customer">("all");
  const [q, setQ] = useState("");
  const rows = [
    ...s.stock.map(v => ({ id: v.id, reg: v.reg || "—", kind: "Dealership stock", model: `Renault ${v.model} ${v.variant}`, cust: v.customer ?? v.sold?.buyer ?? v.promisedTo ?? null, status: v.status })),
    ...SERVICE_VEHICLES.map(v => ({ id: v.id, reg: v.reg, kind: "Customer-owned", model: `${v.model} ${v.kind.toLowerCase()}`, cust: v.customer, status: s.jobs.some(j => j.vehicle === v.id && j.status !== "completed") ? "in workshop" : s.cvrt.some(t => t.vehicle === v.id) ? "CVRT today" : "—" })),
  ].filter(r => (f === "all" || (f === "stock" ? r.kind === "Dealership stock" : r.kind === "Customer-owned")) && (!q || (r.id + r.reg + r.model + cname(r.cust)).toLowerCase().includes(q.toLowerCase())));
  return (
    <Page><Head title="Vehicles" sub="One canonical record per physical vehicle — dealership stock and customer-owned service vehicles kept distinct.">
      <Seg value={f} onChange={setF} options={[["all", "All"], ["stock", "Dealership stock"], ["customer", "Customer-owned"]]} />
      <input className="d-input" style={{ width: 220 }} placeholder="Search id, reg, model, customer" value={q} onChange={e => setQ(e.target.value)} aria-label="Search vehicles" /></Head>
      <Card className="flush"><Table rowKey={r => r.id} rows={rows} limit={20} onRow={r => A.open("vehicle", r.id)} cols={[
        { key: "id", label: "Record", render: r => <b>{r.id}</b>, sort: r => r.id }, { key: "reg", label: "Registration", render: r => r.reg, sort: r => r.reg },
        { key: "k", label: "Kind", render: r => <Chip tone={r.kind === "Dealership stock" ? "acc" : undefined}>{r.kind}</Chip>, sort: r => r.kind },
        { key: "m", label: "Model", render: r => r.model, sort: r => r.model }, { key: "c", label: "Customer", render: r => cname(r.cust), sort: r => cname(r.cust) },
        { key: "s", label: "Status", render: r => r.status, sort: r => r.status },
      ]} empty="No vehicles match." /></Card></Page>
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
    const v8 = handoverGates(s, "V008");
    const rows = [
      ...d.gaps.map(g => ({ k: g.id, what: `${pname(g.id)} present, no job clocking since ${g.since} (${dur(g.gapMin ?? 0)})`, owner: "p-jonathan", go: () => go("Workshop", "live") })),
      ...d.budgetFlags.map(f => ({ k: f.j.id, what: `${f.j.id} at ${elapsed(f.j, s.clock)}/${f.j.budgetMin} min — ${pname(f.j.tech)}`, owner: "p-jonathan", go: () => go("Workshop", "live") })),
      ...(v8.ready ? [] : [{ k: "v8", what: `V008 handover blocked — ${v8.list.filter(x => !x.ok).length} gates open`, owner: "p-jack", go: () => go("Sales", "handovers") }]),
      ...ap.map(a => ({ k: a.id, what: `${a.queue}: ${a.title}`, owner: a.reviewer, go: () => go("Work", "approvals") })),
    ];
    return <Page><Head title="Needs attention" sub="Derived live from the current records — not a second, static alert list." />
      <Card className="flush"><Table rowKey={r => r.k} rows={rows} onRow={r => r.go()} cols={[
        { key: "w", label: "Item", render: r => r.what }, { key: "o", label: "Owner", render: r => <span className="d-row" style={{ gap: 6 }}><Avatar id={r.owner} size={22} />{pname(r.owner)}</span> },
      ]} empty="Nothing needs attention." /></Card></Page>;
  }
  const evs = s.activity.filter(a => tab === "all" || (tab === "people" ? a.kind === "person" : tab === "agents" ? a.kind === "agent" : true));
  const link = (e: string | undefined) => !e ? null : e.startsWith("JOB-") ? <JLink id={e} /> : /^V\d|^C\d/.test(e) ? <VLink id={e} /> : <span className="d-mono d-faint">{e}</span>;
  return <Page><Head title={{ all: "Everything", people: "People", agents: "Agents" }[tab] ?? "Activity"} sub="Human, agent, import and workflow events, newest first. Agent events are sample runs; nothing synced with Keyloop (planned)." />
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
  ["Keyloop", "Chosen future workshop/accounting core (Dec 2026)", "Planned · sample mappings only", "Exact product, modules, dealer consent, partner access, cost, entities, read/write permissions, update frequency"],
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
export function Integrations() {
  const [s] = useDerived();
  const srcs = [
    { n: "AssetMinder", label: SOURCES.assetminder, fresh: `${hhmm(s.clock - 10)} today`, state: "Read · sample", tone: "warn" as const, fields: ["Job number → Job", "Technician → Person", "Clock on/off → Time entry", "Registration → Vehicle"], rejected: 0, dups: 0 },
    { n: "Sage", label: SOURCES.sage, fresh: "07:00 today", state: "Read · sample", tone: "warn" as const, fields: ["Account → Company", "Invoice → Invoice snapshot", "Balance → Receivable (total)"], rejected: 1, dups: 0 },
    { n: "Bizimply", label: SOURCES.bizimply, fresh: "08:00 today", state: "Read · sample · API unconfirmed", tone: "warn" as const, fields: ["Employee → Person", "Status → Attendance (present/absent/training)", "Reason → not imported"], rejected: 0, dups: 0 },
    { n: "Renault order book", label: SOURCES.renault, fresh: s.imports.applied.length ? `${s.imports.history[0].at}` : "Mon 12 Oct", state: s.imports.applied.length ? "Applied · local" : "Diff pending", tone: s.imports.applied.length ? "ok" as const : "warn" as const, fields: ["SVO → Order reference", "VIN → Vehicle (when issued)", "ETA → Arrival date"], rejected: 0, dups: s.imports.history.filter(h => h.id.endsWith("repeat")).length },
    { n: "Keyloop", label: "Planned — December 2026", fresh: "—", state: "Planned · not connected", tone: undefined, fields: ["Mappings drafted from samples only"], rejected: 0, dups: 0 },
  ];
  return <Page><Head title="Integrations" sub="Simulated import histories. Source-specific states — not everything is green, and nothing here is a live connection." />
    <div className="d-grid d-g2">{srcs.map(x => <Card key={x.n} title={x.n} aside={<Chip tone={x.tone}>{x.state}</Chip>}>
      <dl className="d-kv"><dt>Source</dt><dd>{x.label}</dd><dt>Freshness</dt><dd>{x.fresh}</dd><dt>Rejected rows</dt><dd>{x.rejected}{x.rejected ? " — invoice with no matching account (sample)" : ""}</dd><dt>Duplicate warnings</dt><dd>{x.dups}{x.dups ? " repeat import skipped" : ""}</dd></dl>
      <div className="d-eyebrow" style={{ margin: "10px 0 4px" }}>Mapping preview</div>{x.fields.map(f => <div key={f} className="d-muted">· {f}</div>)}
      <div className="d-row" style={{ marginTop: 10 }}><Btn sm disabled={x.n === "Keyloop"} onClick={() => A.toast(`Retry preview: would re-read the ${x.label}. Nothing sent.`)}>Retry preview</Btn></div>
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
