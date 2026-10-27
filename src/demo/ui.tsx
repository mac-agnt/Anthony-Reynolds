import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { A, cname, company, daysBetween, dur, elapsed, eur, fmtDate, handoverGates, person, pname, quoteGates, quoteTotals, standingCost, useDemo, vehicleLabel, type State } from "./store";
import { RECEIVABLES, SERVICE_VEHICLES } from "./fixtures";
import { go } from "./nav";
import type { Job } from "./fixtures";


/* Overlays render outside <main> (its stacking context would trap them) but
   inside the themed root, so theme tokens still apply. */
export const Portal = ({ children }: { children: ReactNode }) => createPortal(children, document.getElementById("demo-portal") ?? document.body);

/* ---- layout primitives --------------------------------------------------- */
export const Page = ({ children }: { children: ReactNode }) => <div className="d-page">{children}</div>;
export function Head({ title, sub, children }: { title: string; sub?: ReactNode; children?: ReactNode }) {
  return (
    <div className="d-head">
      <div className="d-grow"><h1 className="d-title">{title}</h1>{sub && <p className="d-sub">{sub}</p>}</div>
      {children && <div className="d-row">{children}</div>}
    </div>
  );
}
export const Card = ({ title, aside, children, className, style }: { title?: ReactNode; aside?: ReactNode; children: ReactNode; className?: string; style?: CSSProperties }) => (
  <section className={"d-card " + (className ?? "")} style={style}>
    {(title || aside) && <h3><span className="d-grow">{title}</span>{aside}</h3>}
    {children}
  </section>
);
export const Metric = ({ label, value, hint, tone, onClick }: { label: string; value: ReactNode; hint?: ReactNode; tone?: "warn" | "bad"; onClick?: () => void }) => (
  <div className={"d-metric " + (tone ?? "")} onClick={onClick} style={onClick ? { cursor: "pointer" } : undefined} role={onClick ? "button" : undefined} tabIndex={onClick ? 0 : undefined}
    onKeyDown={onClick ? e => { if (e.key === "Enter") onClick(); } : undefined}>
    <div className="d-eyebrow">{label}</div>
    <div className="v">{value}</div>
    {hint && <div className="h">{hint}</div>}
  </div>
);
export const Chip = ({ tone, children, title }: { tone?: "ok" | "warn" | "bad" | "acc"; children: ReactNode; title?: string }) => <span className={"d-chip " + (tone ?? "")} title={title}>{children}</span>;
export const Btn = ({ kind, sm, children, ...p }: { kind?: "primary" | "ghost" | "danger"; sm?: boolean; children: ReactNode } & React.ButtonHTMLAttributes<HTMLButtonElement>) =>
  <button {...p} className={["d-btn", kind, sm && "sm", p.className].filter(Boolean).join(" ")}>{children}</button>;
export function Seg<T extends string>({ value, options, onChange, label }: { value: T; options: [T, string][]; onChange: (v: T) => void; label?: string }) {
  return <div className="d-seg" role="tablist" aria-label={label}>{options.map(([k, l]) => <button key={k} role="tab" aria-selected={value === k} className={value === k ? "on" : ""} onClick={() => onChange(k)}>{l}</button>)}</div>;
}
export const Avatar = ({ id, size = 28 }: { id: string | null | undefined; size?: number }) => {
  const p = person(id);
  return <span className="d-avatar" title={p?.name} style={{ width: size, height: size, background: p?.tint ?? "var(--track)", fontSize: size < 26 ? 9 : 10 }}>{p?.initials ?? "—"}</span>;
};
export const Note = ({ children }: { children: ReactNode }) => <div className="d-note"><span>{children}</span></div>;
export const Flag = ({ tone, children }: { tone?: "bad" | "ok"; children: ReactNode }) => (
  <div className={"d-flag " + (tone ?? "")}><span className="ico" style={{ background: tone === "bad" ? "var(--bad)" : tone === "ok" ? "var(--ok)" : "var(--warn)" }}>{tone === "ok" ? "✓" : "!"}</span><div>{children}</div></div>
);
export const Empty = ({ children }: { children: ReactNode }) => <div className="d-empty">{children}</div>;
export const Field = ({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) => <label className="d-field"><span>{label}</span>{children}{hint && <small>{hint}</small>}</label>;
export function NumInput({ value, onChange, edit = true, width = 110, step = 1, label }: { value: number; onChange: (n: number) => void; edit?: boolean; width?: number; step?: number; label?: string }) {
  return <input aria-label={label} type="number" step={step} className={"d-input num " + (edit ? "edit" : "")} style={{ width }} value={Number.isFinite(value) ? value : 0}
    onChange={e => { const n = parseFloat(e.target.value); onChange(Number.isFinite(n) ? n : 0); }} />;
}
export const Bar = ({ parts }: { parts: [number, string, string?][] }) => {
  const total = parts.reduce((t, p) => t + p[0], 0) || 1;
  return <div className="d-bar" role="img" aria-label={parts.map(p => `${p[2] ?? ""} ${p[0]}`).join(", ")}>{parts.map(([v, c, l], i) => <span key={i} title={l} style={{ width: `${(v / total) * 100}%`, background: c }} />)}</div>;
};
export const RoleHidden = ({ what }: { what: string }) => <Empty>{what} isn't visible in this role preview. Switch the role in Settings → Teams & Permissions. (Illustration only — not production security.)</Empty>;
export const canSeeMoney = (s: State) => s.role === "management" || s.role === "accounts";
export const canSeeCost = (s: State) => s.role === "management" || s.role === "sales" || s.role === "accounts";

/* ---- status chips ---------------------------------------------------------- */
const JOB_STATUS: Record<Job["status"], [string, "ok" | "warn" | "bad" | "acc" | undefined]> = {
  queued: ["Queued", undefined], in_progress: ["In progress", "acc"], awaiting_parts: ["Awaiting parts", "warn"], awaiting_qc: ["Awaiting QC", "warn"], completed: ["Completed", "ok"],
};
export const JobChip = ({ j }: { j: Job }) => {
  const [l, t] = JOB_STATUS[j.status];
  return <Chip tone={t}>{j.status === "queued" && j.hopper && !j.tech ? "Unassigned" : l}</Chip>;
};

/* ---- sortable table ------------------------------------------------------- */
export interface Col<T> { key: string; label: string; render: (r: T) => ReactNode; sort?: (r: T) => string | number; num?: boolean; width?: number }
export function Table<T>({ cols, rows, onRow, rowKey, limit, selected, empty }: { cols: Col<T>[]; rows: T[]; onRow?: (r: T) => void; rowKey: (r: T) => string; limit?: number; selected?: string | null; empty?: ReactNode }) {
  const [sort, setSort] = useState<{ k: string; dir: 1 | -1 } | null>(null);
  const [more, setMore] = useState(false);
  const sorted = useMemo(() => {
    if (!sort) return rows;
    const c = cols.find(x => x.key === sort.k);
    if (!c?.sort) return rows;
    return [...rows].sort((a, b) => { const x = c.sort!(a), y = c.sort!(b); return (x < y ? -1 : x > y ? 1 : 0) * sort.dir; });
  }, [rows, sort, cols]);
  const shown = limit && !more ? sorted.slice(0, limit) : sorted;
  if (!rows.length) return <div style={{ padding: 14 }}><Empty>{empty ?? "No matching records."}</Empty></div>;
  return (
    <div className="d-scroll">
      <table className="d-table">
        <thead><tr>{cols.map(c => (
          <th key={c.key} className={(c.sort ? "sortable " : "") + (c.num ? "num" : "")} style={c.width ? { width: c.width } : undefined}
            onClick={c.sort ? () => setSort(s => s?.k === c.key ? { k: c.key, dir: s.dir === 1 ? -1 : 1 } : { k: c.key, dir: 1 }) : undefined}
            aria-sort={sort?.k === c.key ? (sort.dir === 1 ? "ascending" : "descending") : undefined}>
            {c.label}{sort?.k === c.key ? (sort.dir === 1 ? " ↑" : " ↓") : ""}
          </th>))}</tr></thead>
        <tbody>{shown.map(r => (
          <tr key={rowKey(r)} className={(onRow ? "click " : "") + (selected === rowKey(r) ? "selrow" : "")} onClick={onRow ? () => onRow(r) : undefined}
            tabIndex={onRow ? 0 : undefined} onKeyDown={onRow ? e => { if (e.key === "Enter") onRow(r); } : undefined}>
            {cols.map(c => <td key={c.key} className={c.num ? "num" : ""}>{c.render(r)}</td>)}
          </tr>))}</tbody>
      </table>
      {limit && rows.length > limit && (
        <div className="d-row" style={{ padding: "10px 12px", borderTop: "1px solid var(--border)" }}>
          <span className="d-muted">Showing {shown.length} of {rows.length}</span>
          <Btn sm kind="ghost" onClick={() => setMore(m => !m)}>{more ? "Show fewer" : "Show all"}</Btn>
        </div>
      )}
    </div>
  );
}

/* ---- entity links --------------------------------------------------------- */
export const VLink = ({ id }: { id: string }) => {
  const s = useDemo();
  const v = vehicleLabel(s, id);
  return <button className="d-link" onClick={e => { e.stopPropagation(); A.open("vehicle", id); }}>{v.stock ? id : v.reg}</button>;
};
export const JLink = ({ id }: { id: string }) => <button className="d-link" onClick={e => { e.stopPropagation(); A.open("job", id); }}>{id}</button>;
export const CLink = ({ id }: { id: string | null | undefined }) => id ? <button className="d-link" onClick={e => { e.stopPropagation(); A.open("company", id); }}>{cname(id)}</button> : <span className="d-faint">—</span>;
export const QLink = ({ id }: { id: string }) => <button className="d-link" onClick={e => { e.stopPropagation(); A.open("quote", id); }}>{id}</button>;

/* ---- toast + global drawer ------------------------------------------------- */
export function Toast() {
  const s = useDemo();
  return s.toast ? <Portal><div className="d-toast" role="status" aria-live="polite">{s.toast}</div></Portal> : null;
}

export function EntityDrawer() {
  const s = useDemo();
  if (!s.drawer) return null;
  const { kind, id } = s.drawer;
  return (
    <div className="d-drawer-scrim" onClick={A.close} onKeyDown={e => { if (e.key === "Escape") A.close(); }}>
      <aside className="d-drawer" onClick={e => e.stopPropagation()} role="dialog" aria-label={`${kind} ${id}`}>
        {kind === "vehicle" && <VehicleDetail id={id} />}
        {kind === "job" && <JobDetail id={id} />}
        {kind === "company" && <CompanyDetail id={id} />}
        {kind === "quote" && <QuoteDetail id={id} />}
      </aside>
    </div>
  );
}
const DrawerHead = ({ eyebrow, title, sub, children }: { eyebrow: string; title: ReactNode; sub?: ReactNode; children?: ReactNode }) => (
  <div className="d-drawer-head">
    <div className="d-grow"><div className="d-eyebrow">{eyebrow}</div><div style={{ fontSize: 20, fontWeight: 600, letterSpacing: -.3, marginTop: 4 }}>{title}</div>{sub && <div className="d-muted" style={{ marginTop: 3 }}>{sub}</div>}{children}</div>
    <Btn sm kind="ghost" onClick={A.close} aria-label="Close">Close</Btn>
  </div>
);
const navTo = (page: string, sec?: string) => { A.close(); go(page, sec); };

function Timeline({ entity }: { entity: string[] }) {
  const s = useDemo();
  const evs = s.activity.filter(a => a.entity && entity.includes(a.entity));
  if (!evs.length) return <Empty>No recorded events for this record yet.</Empty>;
  return <div className="d-list">{evs.map(e => <div key={e.id} className="d-li"><span className="d-mono d-faint" style={{ width: 42 }}>{e.at}</span><div className="d-grow"><b style={{ fontWeight: 500 }}>{e.who}</b> <span className="d-muted">{e.text}</span></div></div>)}</div>;
}

function VehicleDetail({ id }: { id: string }) {
  const s = useDemo();
  const [tab, setTab] = useState("summary");
  const v = s.stock.find(x => x.id === id);
  const sv = SERVICE_VEHICLES.find(x => x.id === id);
  const lab = vehicleLabel(s, id);
  const jobs = s.jobs.filter(j => j.vehicle === id);
  const tests = s.cvrt.filter(c => c.vehicle === id);
  const quotes = s.quotes.filter(q => q.vehicle === id);
  const docs = s.docs.filter(d => d.vehicle === id);
  const hg = s.gates[id] ? handoverGates(s, id) : null;
  return (
    <>
      <DrawerHead eyebrow={v ? `Dealership stock · ${v.status}` : "Customer-owned service vehicle"} title={v ? `${id} · Renault ${v.model}` : lab.reg}
        sub={v ? `${v.variant} · ${v.reg || "Registration not assigned"}` : `${lab.model} · ${cname(sv?.customer)}`} />
      <div className="d-drawer-body">
        <div className="d-tabs">{["summary", "jobs", "tests", "sales", "documents", "timeline"].map(t => <button key={t} className={tab === t ? "on" : ""} onClick={() => setTab(t)}>{t[0].toUpperCase() + t.slice(1)}</button>)}</div>
        {tab === "summary" && (
          <div className="d-grid">
            {v?.reviewFlag && <Flag>{v.reviewFlag}. A missing order-book row is never treated as a sale.</Flag>}
            {hg && !hg.ready && <Flag tone="bad"><b>Handover blocked.</b> {hg.list.filter(g => !g.ok).map(g => `${g.label} (${pname(g.owner)})`).join(" · ")}</Flag>}
            {hg && hg.ready && <Flag tone="ok">All release gates clear — handover can be recorded.</Flag>}
            <dl className="d-kv">
              {v ? <>
                <dt>VIN / chassis</dt><dd className="d-mono">{v.vin ?? "Not yet issued — tracked by order reference"}</dd>
                <dt>SVO / order ref</dt><dd className="d-mono">{v.svo}</dd>
                <dt>Registration</dt><dd>{v.reg || "Unassigned"}</dd>
                <dt>Spec</dt><dd>{v.colour} · {v.gearbox} · {v.power || "power n/a"} <span className="d-faint">(sample data)</span></dd>
                <dt>Location</dt><dd>{v.status === "incoming" ? `Incoming · ETA ${v.eta ? fmtDate(v.eta) : "—"}` : v.location}</dd>
                <dt>Customer</dt><dd><CLink id={v.customer ?? v.promisedTo} />{v.promisedTo && !v.customer ? " (promised)" : ""}</dd>
                <dt>Workshop job</dt><dd>{v.jobRef ? <JLink id={v.jobRef} /> : "—"}</dd>
                <dt>Specification</dt><dd><Chip tone={v.specStatus === "approved" ? "ok" : v.specStatus === "review" ? "warn" : "bad"}>{v.specStatus === "approved" ? "Approved" : v.specStatus === "review" ? "In review" : "Missing"}</Chip></dd>
                {canSeeCost(s) && <><dt>Standing cost</dt><dd>{eur(standingCost(v))} <span className="d-faint">internal</span></dd></>}
                {v.sold && <><dt>Sold</dt><dd>{eur(v.sold.amount)} · {cname(v.sold.buyer)} · {fmtDate(v.sold.date)}</dd></>}
              </> : <>
                <dt>Registration</dt><dd>{lab.reg}</dd><dt>Model</dt><dd>{lab.model}</dd><dt>Owner</dt><dd><CLink id={sv?.customer} /></dd>
              </>}
            </dl>
            {hg && <Card title="Release gates"><div className="d-list">{hg.list.map(g => <div className="d-li" key={g.key}><Chip tone={g.ok ? "ok" : "bad"}>{g.ok ? "Clear" : "Open"}</Chip><div className="d-grow"><b style={{ fontWeight: 500 }}>{g.label}</b> <span className="d-muted">— {g.detail}</span></div><Avatar id={g.owner} size={22} /></div>)}</div>
              <div className="d-row" style={{ marginTop: 10 }}><Btn sm onClick={() => navTo("Sales", "handovers")}>Open in Handovers</Btn></div></Card>}
            <div className="d-row">
              {v && <Btn sm onClick={() => navTo("Stock", "specs")}>Open specification</Btn>}
              {v && v.status !== "sold" && <Btn sm onClick={() => navTo("Sales", "quote")}>Create / open quote</Btn>}
              {tests.length > 0 && <Btn sm onClick={() => navTo("CVRT", "repairs")}>Open CVRT</Btn>}
            </div>
          </div>
        )}
        {tab === "jobs" && (jobs.length ? <div className="d-list">{jobs.map(j => <div className="d-li" key={j.id}><JLink id={j.id} /><span className="d-grow d-muted">{j.complaint}</span><JobChip j={j} /></div>)}</div> : <Empty>No workshop jobs on this vehicle.</Empty>)}
        {tab === "tests" && (tests.length ? <div className="d-list">{tests.map(t => <div className="d-li" key={t.id}><b style={{ fontWeight: 500 }}>{t.id}</b><span className="d-grow d-muted">{t.time} · {t.failItems?.join(", ") ?? "—"}</span><Chip tone={t.result === "pass" ? "ok" : t.result === "fail" ? "bad" : undefined}>{t.status.replace("_", " ")}{t.result ? ` · ${t.result}` : ""}</Chip></div>)}</div> : <Empty>No CVRT bookings today.</Empty>)}
        {tab === "sales" && (quotes.length ? <div className="d-list">{quotes.map(q => <div className="d-li" key={q.id}><QLink id={q.id} /><span className="d-grow d-muted">{cname(q.customer)} · {q.stage}</span><span>{eur(quoteTotals(q).net)}</span></div>)}</div> : <Empty>No quotes against this vehicle.</Empty>)}
        {tab === "documents" && (docs.length ? <div className="d-list">{docs.map(d => <div className="d-li" key={d.id}><div className="d-grow"><b style={{ fontWeight: 500 }}>{d.title}</b><div className="d-muted">{d.scope} · {d.language} · {d.version} · {d.source}</div></div><Chip tone={d.status === "approved" ? "ok" : "warn"}>{d.status}</Chip></div>)}</div> : <Empty>No documents. {v ? "Attach a sample spec from Vehicle Stock → Specifications." : ""}</Empty>)}
        {tab === "timeline" && <Timeline entity={[id, ...jobs.map(j => j.id), ...quotes.map(q => q.id)]} />}
      </div>
    </>
  );
}

function JobDetail({ id }: { id: string }) {
  const s = useDemo();
  const j = s.jobs.find(x => x.id === id);
  if (!j) return <DrawerHead eyebrow="Job" title={id} sub="Not found" />;
  const el = elapsed(j, s.clock);
  return (
    <>
      <DrawerHead eyebrow={`Workshop job · ${j.workType}`} title={id} sub={j.complaint} />
      <div className="d-drawer-body d-grid">
        <div className="d-row"><JobChip j={j} />{j.invoice && <Chip tone={j.invoice === "ready" ? "ok" : "warn"}>{j.invoice === "ready" ? "Invoice-ready" : "Write-up blocked"}</Chip>}</div>
        <dl className="d-kv">
          <dt>Customer</dt><dd><CLink id={j.customer} /></dd>
          <dt>Vehicle</dt><dd><VLink id={j.vehicle} /> <span className="d-muted">{vehicleLabel(s, j.vehicle).model}</span></dd>
          <dt>Technician</dt><dd>{j.tech ? pname(j.tech) : "Unassigned (hopper)"}</dd>
          <dt>Approved budget</dt><dd>{dur(j.budgetMin)}</dd>
          <dt>Time used</dt><dd>{j.status === "queued" ? "Not started — scheduling does not clock on" : `${el} of ${j.budgetMin} min (${Math.round((el / j.budgetMin) * 100)}% of budget, not % complete)`}</dd>
          {j.plannedStart && <><dt>Planned start</dt><dd>{j.plannedStart}</dd></>}
          {j.start && j.status === "in_progress" && <><dt>Clocked on</dt><dd>{j.start}</dd></>}
          {j.partBlocker && <><dt>Part</dt><dd>{j.partBlocker.part} · {j.partBlocker.supplier} · {j.partBlocker.received ? "received" : `ETA ${j.partBlocker.eta}`} · {pname(j.partBlocker.owner)}</dd></>}
          {j.net !== undefined && canSeeMoney(s) && <><dt>Net value</dt><dd>{eur(j.net)}</dd></>}
          {j.notes && <><dt>Technician notes</dt><dd>“{j.notes}”</dd></>}
        </dl>
        <div className="d-row">
          <Btn sm onClick={() => navTo("Workshop", "planner")}>Open in Planner</Btn>
          {j.status === "completed" && <Btn sm onClick={() => navTo("Workshop", "jobcards")}>Open job card</Btn>}
          {j.status === "awaiting_parts" && <Btn sm onClick={() => navTo("Workshop", "parts")}>Parts & Blockers</Btn>}
        </div>
        <Card title="Timeline"><Timeline entity={[id]} /></Card>
      </div>
    </>
  );
}

function CompanyDetail({ id }: { id: string }) {
  const s = useDemo();
  const c = company(id);
  const vehicles = [...SERVICE_VEHICLES.filter(v => v.customer === id).map(v => v.id), ...s.stock.filter(v => v.customer === id || v.promisedTo === id || v.sold?.buyer === id).map(v => v.id)];
  const jobs = s.jobs.filter(j => j.customer === id);
  const tests = s.cvrt.filter(t => t.customer === id);
  const quotes = s.quotes.filter(q => q.customer === id);
  return (
    <>
      <DrawerHead eyebrow={c?.kind === "supplier" ? "Supplier" : "Customer · fictional demo company"} title={c?.name ?? id} sub={`${c?.type} · ${c?.contact} · ${c?.email}`} />
      <div className="d-drawer-body d-grid">
        <div className="d-grid d-g4">
          <Metric label="Vehicles" value={vehicles.length} /><Metric label="Live jobs" value={jobs.filter(j => j.status !== "completed").length} />
          <Metric label="Tests today" value={tests.length} /><Metric label="Quotes" value={quotes.length} />
        </div>
        <Card title="Vehicles">{vehicles.length ? <div className="d-row">{vehicles.map(v => <VLink key={v} id={v} />)}</div> : <span className="d-muted">None</span>}</Card>
        <Card title="Workshop jobs">{jobs.length ? <div className="d-list">{jobs.map(j => <div className="d-li" key={j.id}><JLink id={j.id} /><span className="d-grow d-muted">{j.complaint}</span><JobChip j={j} /></div>)}</div> : <span className="d-muted">None</span>}</Card>
        {quotes.length > 0 && <Card title="Sales activity"><div className="d-list">{quotes.map(q => <div className="d-li" key={q.id}><QLink id={q.id} /><span className="d-grow d-muted">{q.stage}</span>{eur(quoteTotals(q).net)}</div>)}</div></Card>}
        <Card title="Finance">{canSeeMoney(s) ? <FinanceFor id={id} /> : <RoleHidden what="Account balances" />}</Card>
        <Card title="Timeline"><Timeline entity={[id, ...jobs.map(j => j.id), ...quotes.map(q => q.id), ...vehicles]} /></Card>
      </div>
    </>
  );
}
function FinanceFor({ id }: { id: string }) {
  const balances = RECEIVABLES.filter(r => r.customer === id);
  return balances.length ? <div className="d-list">{balances.map(r => { const od = daysBetween(r.due); return <div className="d-li" key={r.id}><b style={{ fontWeight: 500 }}>{r.id}</b><span className="d-grow d-muted">due {fmtDate(r.due)} · imported balance</span><Chip tone={od > 0 ? "bad" : undefined}>{eur(r.amount)}{od > 0 ? ` · ${od} days overdue` : ""}</Chip></div>; })}</div> : <span className="d-muted">No outstanding imported balances.</span>;
}

function QuoteDetail({ id }: { id: string }) {
  const s = useDemo();
  const q = s.quotes.find(x => x.id === id)!;
  const t = quoteTotals(q);
  const g = quoteGates(s, q);
  return (
    <>
      <DrawerHead eyebrow={`Quote · ${q.stage}`} title={id} sub={`${cname(q.customer)} · ${pname(q.owner)}`} />
      <div className="d-drawer-body d-grid">
        <dl className="d-kv"><dt>Vehicle</dt><dd>{q.vehicle ? <VLink id={q.vehicle} /> : "Not matched yet"}</dd><dt>Net</dt><dd>{eur(t.net)} <span className="d-faint">net sample pricing; tax not calculated</span></dd>
          <dt>Discount</dt><dd>{eur(q.discount)} {g.needsDiscount && <Chip tone={g.discountOk ? "ok" : "warn"}>{g.discountOk ? "approved" : "needs approval"}</Chip>}</dd>
          <dt>Specification</dt><dd><Chip tone={g.specOk ? "ok" : "warn"}>{g.specOk ? "approved" : "not approved"}</Chip></dd>
          <dt>Next</dt><dd>{q.nextAction} · {q.due}</dd></dl>
        <div className="d-row"><Btn sm kind="primary" onClick={() => navTo("Sales", "quote")}>Open in Quote Builder</Btn></div>
      </div>
    </>
  );
}

/* ---- familiar pieces from Anthony's existing tools ------------------------- */
/** Irish registration plate badge, as on his planner and clocking boards. */
export const Plate = ({ reg }: { reg: string }) => <span className="ar-plate" title={reg}><i>IRL</i><b>{reg}</b></span>;

/** KPI tile in the style of his tracker and planner headers. */
export function Kpi({ label, value, unit, hint, aside, mark, tone, onClick, children }: {
  label: string; value: ReactNode; unit?: ReactNode; hint?: ReactNode; aside?: ReactNode; mark?: string; tone?: "acc" | "ok" | "warn" | "bad"; onClick?: () => void; children?: ReactNode;
}) {
  const c = tone === "ok" ? "var(--ok)" : tone === "warn" ? "var(--warn)" : tone === "bad" ? "var(--bad)" : "var(--accent)";
  const bg = tone === "ok" ? "var(--ok-soft)" : tone === "warn" ? "var(--warn-soft)" : tone === "bad" ? "var(--bad-soft)" : "var(--accent-soft)";
  return (
    <div className={"ar-kpi " + (onClick ? "click" : "")} onClick={onClick} role={onClick ? "button" : undefined} tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? e => { if (e.key === "Enter") onClick(); } : undefined}>
      <div className="k">{label}{mark && <i style={{ color: c, background: bg }} aria-hidden>{mark}</i>}</div>
      <div className="v" style={tone && tone !== "acc" ? { color: c } : undefined}>{value}{unit && <small>{unit}</small>}</div>
      {children}
      {(hint || aside) && <div className="h"><span>{hint}</span>{aside}</div>}
    </div>
  );
}

/** Drop zone that "reads" a document in a few visible steps, then calls onRead.
    Nothing is parsed: the demo swaps in a sample result and says so. */
export function ReadDrop({ title, sub, steps, accept, onRead, red, compact, button, trigger, sample }: {
  title: string; sub: string; steps: string[]; accept?: string; onRead: (fileName: string) => void; red?: boolean; compact?: boolean; button?: string;
  /** Bump to run a simulated drop of `sample` from outside (e.g. a "Simulate drop" button). */
  trigger?: number; sample?: string;
}) {
  const [over, setOver] = useState(false);
  const [run, setRun] = useState<{ name: string; i: number } | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const done = useRef(onRead);
  done.current = onRead;
  useEffect(() => {
    if (!run) return;
    if (run.i >= steps.length) { done.current(run.name); setRun(null); return; }
    const t = setTimeout(() => setRun(r => r && { ...r, i: r.i + 1 }), 520);
    return () => clearTimeout(t);
  }, [run, steps.length]);
  const start = (name: string) => setRun(r => r ?? { name, i: 0 });
  useEffect(() => { if (trigger) start(sample ?? "sample.pdf"); }, [trigger, sample]);
  return (
    <div className={"ar-drop " + (over ? "over " : "") + (red ? "red" : "")} style={compact ? { padding: 14 } : undefined}
      onClick={() => input.current?.click()} role="button" tabIndex={0} onKeyDown={e => { if (e.key === "Enter") input.current?.click(); }}
      onDragOver={e => { e.preventDefault(); setOver(true); }} onDragLeave={() => setOver(false)}
      onDrop={e => { e.preventDefault(); setOver(false); const f = e.dataTransfer.files[0]; if (f) start(f.name); }}>
      <input ref={input} type="file" hidden accept={accept} onChange={e => { const f = e.target.files?.[0]; if (f) start(f.name); e.target.value = ""; }} />
      {run ? <>
        <b>Reading {run.name}</b>
        <div className="ar-steps">{steps.map((x, i) => <div key={x} className={i < run.i ? "done" : i === run.i ? "on" : ""}>{x}</div>)}</div>
      </> : <>
        <span className="ic" aria-hidden>{accept?.includes("pdf") ? "PDF" : accept?.includes("xls") ? "XLS" : "UP"}</span>
        <b>{title}</b><span>{sub}</span>
        {button && <span className="d-btn sm" style={{ marginTop: 4 }}>{button}</span>}
      </>}
    </div>
  );
}
