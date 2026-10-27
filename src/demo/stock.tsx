import { useRef, useState } from "react";
import { A, cname, eur, fmtDate, standingCost, useDerived, type Doc } from "./store";
import { COMPANIES, ORDER_BOOK_NEXT, type Vehicle } from "./fixtures";
import { Portal, Bar, Btn, CLink, Card, Chip, Empty, Field, Flag, Head, JLink, Kpi, Metric, Note, NumInput, Page, ReadDrop, RoleHidden, Seg, Table, VLink, canSeeCost } from "./ui";
import { go } from "./nav";

const PROMISE: Record<string, string> = { V019: "2026-10-28" };
const statusChip = (v: Vehicle) => {
  const m: Record<string, [string, "ok" | "warn" | "bad" | "acc" | undefined]> = { available: ["Available", "ok"], reserved: ["Reserved", "acc"], preparation: ["In preparation", "warn"], incoming: ["Incoming", undefined], sold: ["Sold", undefined] };
  const [l, t] = m[v.status];
  return <Chip tone={t}>{v.status === "incoming" && v.eta ? `ETA ${fmtDate(v.eta)}` : l}</Chip>;
};
const specChip = (v: Vehicle) => <Chip tone={v.specStatus === "approved" ? "ok" : v.specStatus === "review" ? "warn" : "bad"}>{v.specStatus === "approved" ? "Spec approved" : v.specStatus === "review" ? "Spec in review" : "No approved spec"}</Chip>;
const csv = (name: string, rows: (string | number)[][]) => {
  const blob = new Blob(["# SAMPLE DATA — Reynolds demo\n" + rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n")], { type: "text/csv" });
  const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = name; a.click();
};

/* ═════════════════════════ OVERVIEW ═════════════════════════ */
export function StockOverview() {
  const [s, d] = useDerived();
  const ageBuckets = [["0–14 days", 0, 14], ["15–30 days", 15, 30], ["31–60 days", 31, 60], ["60+ days", 61, 999]] as const;
  const onSite = d.onSite;
  return (
    <Page>
      <Head title="Vehicle stock" sub="Active stock reconciles as on-site + incoming. Confirmed sales sit in the Sold archive, outside active totals. Source: sample Renault order book + stock records.">
        <Btn kind="primary" onClick={() => go("Stock", "instock")}>Browse stock</Btn>
      </Head>
      <div className="d-grid d-g5" style={{ marginBottom: 14 }}>
        <Metric label="Active tracked" value={d.active.length} hint={`${onSite.length} on site + ${d.incoming.length} incoming`} />
        <Metric label="On site" value={onSite.length} hint={`${d.available.length} available · ${d.reserved.length} reserved · ${d.preparation.length} prep`} />
        <Metric label="Incoming" value={d.incoming.length} hint="on the order book" />
        <Metric label="Sold (archive)" value={d.sold.length} hint="confirmed, with evidence" onClick={() => go("Stock", "instock")} />
        <Metric label="Missing approved spec" value={d.missingSpec.length} tone={d.missingSpec.length ? "warn" : undefined} hint="active vehicles" onClick={() => go("Stock", "specs")} />
      </div>
      <div className="d-split">
        <div className="d-grid">
          <Card title="Standing cost of tracked stock" aside={<span className="d-muted">internal · capital, not revenue</span>}>
            {canSeeCost(s) ? <><div style={{ fontSize: 28, fontWeight: 600, letterSpacing: -.6 }}>{eur(d.standing)}</div>
              <div className="d-muted">across {d.active.length} active vehicles · rebates shown separately and never subtracted twice</div></> : <RoleHidden what="Standing cost" />}
          </Card>
          <Card title="Composition">
            <Bar parts={[[d.available.length, "var(--ok)", "Available"], [d.reserved.length, "var(--accent)", "Reserved"], [d.preparation.length, "var(--warn)", "Preparation"], [d.incoming.length, "var(--track)", "Incoming"]]} />
            <div className="d-row" style={{ marginTop: 9, gap: 14 }}>{[["Available", d.available.length, "var(--ok)"], ["Reserved", d.reserved.length, "var(--accent)"], ["Preparation", d.preparation.length, "var(--warn)"], ["Incoming", d.incoming.length, "var(--track)"]].map(([l, n, c]) => <span key={l as string} className="d-row" style={{ gap: 6 }}><i style={{ width: 8, height: 8, borderRadius: 3, background: c as string }} /><span className="d-muted">{l} {n}</span></span>)}</div>
          </Card>
          <Card title="Days on site (derived from receipt dates)">
            <div className="d-grid d-g4">{ageBuckets.map(([l, a, b]) => <Metric key={l} label={l} value={onSite.filter(v => (v.receivedDaysAgo ?? 0) >= a && (v.receivedDaysAgo ?? 0) <= b).length} />)}</div>
          </Card>
        </div>
        <div className="d-grid">
          <Card title="Next arrivals">{[...d.incoming].sort((a, b) => (a.eta ?? "").localeCompare(b.eta ?? "")).slice(0, 6).map(v => <div className="d-li" key={v.id}><VLink id={v.id} /><span className="d-grow d-muted">{v.model} {v.variant}{v.promisedTo ? ` · promised to ${cname(v.promisedTo)}` : ""}</span><span className="d-mono">{v.eta ? fmtDate(v.eta) : ""}</span></div>)}</Card>
          <Card title="Document coverage"><Bar parts={[[d.active.length - d.missingSpec.length, "var(--ok)", "Approved"], [d.missingSpec.length, "var(--bad)", "Missing / review"]]} />
            <div className="d-muted" style={{ marginTop: 8 }}>{d.active.length - d.missingSpec.length} of {d.active.length} active vehicles have an approved VIN-specific spec.</div></Card>
          {d.active.some(v => v.reviewFlag) && <Flag>{d.active.filter(v => v.reviewFlag).map(v => v.id).join(", ")} missing from the latest file — review required. <button className="d-link" onClick={() => go("Stock", "exceptions")}>Open exceptions</button></Flag>}
        </div>
      </div>
    </Page>
  );
}

/* ═════════════════════════ IN STOCK ═════════════════════════ */
function EditVehicle({ v, close }: { v: Vehicle; close: () => void }) {
  const [s] = useDerived();
  const [f, setF] = useState({ colour: v.colour, gearbox: v.gearbox, power: v.power, location: v.location, reg: v.reg, notes: v.notes, folderUrl: v.folderUrl, photo: "" });
  const doc = s.docs.find(x => x.vehicle === v.id && x.status !== "superseded");
  return (
    <div className="d-modal-scrim" onClick={close}>
      <div className="d-modal" onClick={e => e.stopPropagation()} role="dialog" aria-label={`Edit ${v.id}`}>
        <div className="d-drawer-head"><div className="d-grow"><div className="d-eyebrow">Edit vehicle</div><b style={{ fontSize: 18 }}>{v.id} · Renault {v.model} {v.variant}</b><div className="d-muted d-mono">{v.vin ?? "VIN not yet issued"} · {v.svo}</div></div><Btn sm kind="ghost" onClick={close}>Close</Btn></div>
        <div className="d-drawer-body d-grid">
          <Card title="1 · Identity and specification labels"><div className="d-grid d-g3">
            {(["reg", "colour", "gearbox", "power", "location"] as const).map(k => <Field key={k} label={k[0].toUpperCase() + k.slice(1)}><input className="d-input edit" value={f[k]} onChange={e => setF({ ...f, [k]: e.target.value })} /></Field>)}
            <Field label="Notes"><input className="d-input edit" value={f.notes} onChange={e => setF({ ...f, notes: e.target.value })} /></Field>
          </div><Note>Technical labels are sample data, not authoritative Renault specifications.</Note></Card>
          <Card title="2 · Standing cost and preparation extras">{canSeeCost(s) ? <>
            <div className="d-list">{v.costs.map((c, i) => <div className="d-li" key={c.label}><span className="d-grow">{c.label}</span><NumInput value={c.amount} onChange={n => A.editCost(v.id, i, n)} label={c.label} /></div>)}</div>
            <div className="d-row" style={{ marginTop: 8 }}><span className="d-grow"><b>Standing cost</b></span><b>{eur(standingCost(s.stock.find(x => x.id === v.id)!))}</b></div>
            <Note>Rebates/credits are a separate amount with an “included in standing cost” flag — never subtracted twice. None applied here.</Note></> : <RoleHidden what="Internal cost" />}</Card>
          <Card title="3 · Documents and links"><div className="d-grid d-g2">
            <Field label="Specification document"><span>{doc ? `${doc.title} · ${doc.status}` : "None attached"}</span></Field>
            <Field label="SharePoint folder link" hint="Reference link only — no connected account, nothing scraped"><input className="d-input edit" placeholder="https://…" value={f.folderUrl} onChange={e => setF({ ...f, folderUrl: e.target.value })} /></Field>
            <Field label="Photo URL" hint="Optional — card shows a labelled fallback without one"><input className="d-input edit" placeholder="https://…" value={f.photo} onChange={e => setF({ ...f, photo: e.target.value })} /></Field>
          </div></Card>
          <div className="d-row"><span className="d-grow" /><Btn onClick={close}>Cancel</Btn><Btn kind="primary" onClick={() => { A.editVehicle(v.id, { colour: f.colour, gearbox: f.gearbox, power: f.power, location: f.location, reg: f.reg, notes: f.notes, folderUrl: f.folderUrl }); close(); }}>Save</Btn></div>
        </div>
      </div>
    </div>
  );
}

function SellDialog({ v, close }: { v: Vehicle; close: () => void }) {
  const [buyer, setBuyer] = useState(v.customer ?? "c-galway");
  const [amount, setAmount] = useState(Math.round(standingCost(v) * 1.12 / 100) * 100);
  const [evidence, setEvidence] = useState("");
  return (
    <div className="d-modal-scrim" onClick={close}>
      <div className="d-modal" style={{ width: "min(480px,100%)" }} onClick={e => e.stopPropagation()} role="dialog" aria-label="Confirm sale">
        <div className="d-drawer-head"><div className="d-grow"><div className="d-eyebrow">Confirm sale</div><b style={{ fontSize: 18 }}>{v.id}</b></div></div>
        <div className="d-drawer-body d-grid">
          <Field label="Buyer"><select className="d-select" value={buyer} onChange={e => setBuyer(e.target.value)}>{COMPANIES.filter(c => c.kind === "customer").map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></Field>
          <Field label="Sale amount (net)"><NumInput value={amount} onChange={setAmount} width={140} /></Field>
          <Field label="Evidence (required)" hint="e.g. signed order form reference"><input className="d-input" value={evidence} onChange={e => setEvidence(e.target.value)} /></Field>
          <Note>Sold is an explicit, confirmed state. It is never inferred from a missing order-book row. Accounting posting is a separate event.</Note>
          <div className="d-row"><span className="d-grow" /><Btn onClick={close}>Cancel</Btn><Btn kind="primary" disabled={!evidence.trim()} onClick={() => { A.confirmSale(v.id, amount, buyer); close(); }}>Confirm sale</Btn></div>
        </div>
      </div>
    </div>
  );
}

function StockCheckDrawer({ close }: { close: () => void }) {
  const [s, d] = useDerived();
  const [res, setRes] = useState<Record<string, "found" | "not found" | "unchecked">>(Object.fromEntries(d.onSite.map(v => [v.id, "unchecked"])));
  return (
    <div className="d-drawer-scrim" onClick={close}>
      <aside className="d-drawer" onClick={e => e.stopPropagation()} role="dialog" aria-label="Physical stock check">
        <div className="d-drawer-head"><div className="d-grow"><div className="d-eyebrow">Physical stock check</div><b style={{ fontSize: 18 }}>{d.onSite.length} vehicles expected on site</b><div className="d-muted">Checker Gavin Tuohy · {s.focus ? "today" : ""}</div></div><Btn sm kind="ghost" onClick={close}>Close</Btn></div>
        <div className="d-drawer-body">
          <Table rowKey={v => v.id} rows={d.onSite} cols={[
            { key: "id", label: "Vehicle", render: v => v.id }, { key: "l", label: "Expected location", render: v => v.location },
            { key: "r", label: "Result", render: v => <Seg value={res[v.id]} onChange={r => setRes({ ...res, [v.id]: r })} options={[["found", "Found"], ["not found", "Not found"], ["unchecked", "Unchecked"]]} /> },
          ]} />
          <div style={{ margin: "12px 0" }}><Note>Records a stock-check session. A vehicle not found is flagged for follow-up — it is never deleted or treated as sold.</Note></div>
          <Btn kind="primary" onClick={() => { A.stockCheck(res); close(); }}>Save session</Btn>
          {s.stockChecks.length > 0 && <Card title="Previous sessions" style={{ marginTop: 14 }}>{s.stockChecks.map(c => <div className="d-li" key={c.id}><span className="d-mono">{c.at}</span><span className="d-grow">{c.by}</span><span className="d-muted">{Object.values(c.results).filter(r => r === "found").length} found · {Object.values(c.results).filter(r => r === "not found").length} not found</span></div>)}</Card>}
        </div>
      </aside>
    </div>
  );
}

/* Stock Delta & Tracker: the layout of Anthony's existing tracker, on the shared store. */
const SNAP = new Date("2026-10-19T10:00:00");
const ddmmyyyy = (d: Date) => `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
const arrived = (v: Vehicle) => ddmmyyyy(new Date(SNAP.getTime() - (v.receivedDaysAgo ?? 0) * 86400000));
const family = (v: Vehicle) => v.range === "Used & trade-in" ? "Used Vehicles" : v.model === "Master" ? "MASTER" : v.model === "Trafic" ? "TRAFIC"
  : v.model.startsWith("D") ? "D" : v.model.startsWith("T") ? "T" : v.model.startsWith("C") ? "C" : v.model.toUpperCase();
const FAMILY_TITLE: Record<string, [string, string]> = {
  C: ["Renault Trucks C Range", "C"], D: ["Renault Trucks D Range", "D"], T: ["Renault Trucks T Range", "T"],
  MASTER: ["Renault Master", "M"], TRAFIC: ["Renault Trafic", "TR"], "Used Vehicles": ["Used Vehicles", "U"],
};
const FAMILY_ORDER = ["C", "D", "MASTER", "T", "TRAFIC", "Used Vehicles"];
type StockView = "all" | "onsite" | "incoming" | "reserved" | "prep" | "sold";
const trackerChip = (v: Vehicle) => {
  if (v.status === "incoming") return <Chip>{v.eta ? `Due ${ddmmyyyy(new Date(v.eta))}` : "Due"}</Chip>;
  if (v.status === "reserved") return <Chip tone="acc">Reserved ({arrived(v)})</Chip>;
  if (v.status === "preparation") return <Chip tone="warn">In prep ({arrived(v)})</Chip>;
  if (v.status === "sold") return <Chip>Sold {v.sold ? ddmmyyyy(new Date(v.sold.date)) : ""}</Chip>;
  return <Chip tone="ok">In stock ({arrived(v)})</Chip>;
};
const priceOf = (v: Vehicle) => {
  const net = v.costs[0]?.amount ?? 0;
  const interest = v.costs.filter(c => /interest/i.test(c.label)).reduce((t, c) => t + c.amount, 0);
  const extras = v.costs.slice(1).reduce((t, c) => t + c.amount, 0) - interest;
  return { net, extras, interest, standing: standingCost(v) };
};

function TrackerCard({ v, onEdit, onSell }: { v: Vehicle; onEdit: () => void; onSell: () => void }) {
  const [s] = useDerived();
  const p = priceOf(v);
  return (
    <article className="ar-vcard">
      <div className="d-row" style={{ gap: 8, flexWrap: "nowrap" }}>
        <button className="d-link vin d-grow" style={{ minWidth: 0 }} onClick={() => A.open("vehicle", v.id)} title="Open record">{v.vin ?? v.svo}</button>{trackerChip(v)}
      </div>
      <div><div className="make">Renault{v.range === "Trucks" ? " Trucks" : ""}</div><b style={{ fontSize: 14 }}>{v.model}</b> <span className="d-muted">{v.variant}</span></div>
      {canSeeCost(s) ? <div className="ar-price">
        <div><div className="l">Dealer net price</div><div className="x">{eur(p.net)}</div></div>
        <div><div className="l acc">Extras cost</div><div className="x">{eur(p.extras)}</div></div>
        <div><div className="l amb">Stocking interest</div><div className="x">{eur(p.interest)}</div></div>
        <div className="stand"><div className="l">Standing price</div><div className="x" style={{ fontSize: 15 }}>{eur(p.standing)}</div></div>
      </div> : <RoleHidden what="Pricing" />}
      <dl className="ar-vkv">
        <dt>Location:</dt><dd>{v.status === "incoming" ? "Inbound" : v.location}</dd>
        <dt>Customer:</dt><dd>{v.customer ? <CLink id={v.customer} /> : v.promisedTo ? <><CLink id={v.promisedTo} /> (promised)</> : "---"}</dd>
        <dt>Job Number:</dt><dd>{v.jobRef ? <JLink id={v.jobRef} /> : "---"}</dd>
      </dl>
      {(v.reviewFlag || v.specStatus !== "approved") && <div className="d-row" style={{ gap: 5 }}>{v.reviewFlag && <Chip tone="warn">Missing from latest file</Chip>}{v.specStatus !== "approved" && specChip(v)}</div>}
      <div className="acts">
        <Btn sm onClick={onEdit}>Edit Details</Btn>
        {v.status === "sold" ? <Btn sm kind="ghost" onClick={() => A.open("vehicle", v.id)}>Record</Btn> : <Btn sm className="solid-bad" onClick={onSell} disabled={v.status === "incoming"} title={v.status === "incoming" ? "Not on site yet" : undefined}>Mark Sold</Btn>}
      </div>
    </article>
  );
}

function BackfillDialog({ close, sell }: { close: () => void; sell: (v: Vehicle) => void }) {
  const [, d] = useDerived();
  const [text, setText] = useState("");
  const keys = text.split(/[\s,;]+/).map(x => x.trim().toUpperCase()).filter(Boolean);
  const hits = keys.map(k => ({ k, v: d.active.find(v => (v.vin ?? "").toUpperCase() === k || v.svo.toUpperCase() === k || v.id === k) }));
  return (
    <div className="d-modal-scrim" onClick={close}><div className="d-modal" style={{ width: "min(600px,100%)" }} onClick={e => e.stopPropagation()} role="dialog" aria-label="Backfill sales by VIN">
      <div className="d-drawer-head"><div className="d-grow"><div className="d-eyebrow">Backfill sales</div><b style={{ fontSize: 18 }}>Match sold vehicles by VIN</b><div className="d-muted">Paste VINs or SVO numbers, one per line. Each match still needs a confirmed sale.</div></div><Btn sm kind="ghost" onClick={close}>Close</Btn></div>
      <div className="d-drawer-body d-grid">
        <textarea className="d-textarea" rows={4} value={text} onChange={e => setText(e.target.value)} placeholder={d.active.slice(0, 2).map(v => v.vin ?? v.svo).join("\n")} aria-label="VINs" />
        <Btn sm kind="ghost" onClick={() => setText(d.onSite.slice(0, 3).map(v => v.vin ?? v.svo).join("\n") + "\nVF6XXXXXXXXX00000")}>Paste sample VINs</Btn>
        {hits.length > 0 && <div className="d-list">{hits.map(({ k, v }) => <div className="d-li" key={k}>
          <span className="d-mono d-grow">{k}</span>
          {v ? <><span className="d-muted">{v.id} · {v.model} {v.variant}</span>{v.status === "incoming" ? <Chip>Not on site</Chip> : <Btn sm kind="primary" onClick={() => sell(v)}>Mark sold…</Btn>}</> : <Chip tone="warn">Not in active stock</Chip>}
        </div>)}</div>}
        <Note>No VIN is marked sold automatically. Unmatched VINs are listed, never guessed.</Note>
      </div>
    </div></div>
  );
}

function AddVehicleDialog({ close }: { close: () => void }) {
  const [s] = useDerived();
  const [f, setF] = useState({ model: "Master", variant: "LH35 panel van", vin: "", location: "Main yard", cost: 29500, eta: "", customer: "" });
  const dup = f.vin.trim() && s.stock.some(v => (v.vin ?? "").toUpperCase() === f.vin.trim().toUpperCase());
  return (
    <div className="d-modal-scrim" onClick={close}><div className="d-modal" style={{ width: "min(560px,100%)" }} onClick={e => e.stopPropagation()} role="dialog" aria-label="Add vehicle manually">
      <div className="d-drawer-head"><div className="d-grow"><div className="d-eyebrow">Add vehicle manually</div><b style={{ fontSize: 18 }}>New stock unit</b></div><Btn sm kind="ghost" onClick={close}>Close</Btn></div>
      <div className="d-drawer-body d-grid">
        <div className="d-grid d-g2">
          <Field label="Model"><select className="d-select" value={f.model} onChange={e => setF({ ...f, model: e.target.value })}>{["Master", "Trafic", "C380", "D14", "D18", "D Wide", "T480"].map(m => <option key={m}>{m}</option>)}</select></Field>
          <Field label="Variant"><input className="d-input" value={f.variant} onChange={e => setF({ ...f, variant: e.target.value })} /></Field>
          <Field label="VIN" hint="Leave blank if not issued yet"><input className="d-input d-mono" value={f.vin} onChange={e => setF({ ...f, vin: e.target.value })} /></Field>
          <Field label="Dealer net price (€)"><NumInput value={f.cost} onChange={n => setF({ ...f, cost: n })} width={140} /></Field>
          <Field label="Location"><select className="d-select" value={f.location} onChange={e => setF({ ...f, location: e.target.value })}>{["Main yard", "Front line", "Workshop", "Body shop"].map(m => <option key={m}>{m}</option>)}</select></Field>
          <Field label="Due date" hint="Set for an incoming unit"><input className="d-input" type="date" value={f.eta} onChange={e => setF({ ...f, eta: e.target.value })} /></Field>
          <Field label="Customer"><select className="d-select" value={f.customer} onChange={e => setF({ ...f, customer: e.target.value })}><option value="">None</option>{COMPANIES.filter(c => c.kind === "customer").map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></Field>
        </div>
        {dup && <Flag tone="bad">That VIN is already tracked. The tracker keeps one record per VIN.</Flag>}
        <div className="d-row"><span className="d-grow" /><Btn onClick={close}>Cancel</Btn>
          <Btn kind="primary" disabled={!!dup || !f.variant.trim() || f.cost <= 0} onClick={() => { A.addVehicle({ ...f, customer: f.customer || null }); close(); }}>Add vehicle</Btn></div>
      </div>
    </div></div>
  );
}

export function InStock() {
  const [s, d] = useDerived();
  const [view, setView] = useState<StockView>("all");
  const [fam, setFam] = useState("All");
  const [q, setQ] = useState("");
  const [closed, setClosed] = useState<Record<string, boolean>>({});
  const [edit, setEdit] = useState<Vehicle | null>(null);
  const [sell, setSell] = useState<Vehicle | null>(null);
  const [check, setCheck] = useState(false);
  const [backfill, setBackfill] = useState(false);
  const [adding, setAdding] = useState(false);
  const [how, setHow] = useState(false);
  const [restore, setRestore] = useState<{ id: string; reason: string } | null>(null);
  const restoreInput = useRef<HTMLInputElement>(null);
  const ob = ORDER_BOOK_NEXT;
  const applied = s.imports.applied.includes(ob.importId);
  const loaded = s.imports.previewOpen || applied;

  const match = (v: Vehicle) => !q || [v.id, v.vin ?? "", v.svo, v.reg, v.jobRef ?? "", v.model, v.variant, cname(v.customer ?? v.promisedTo)].some(x => x.toLowerCase().includes(q.toLowerCase()));
  const base: Vehicle[] = view === "sold" ? d.sold : view === "onsite" ? d.onSite : view === "incoming" ? d.incoming : view === "reserved" ? d.reserved : view === "prep" ? d.preparation : d.active;
  const searched = base.filter(match);
  const counts = FAMILY_ORDER.map(f => [f, searched.filter(v => family(v) === f).length] as const).filter(([, n]) => n > 0);
  const rows = fam === "All" ? searched : searched.filter(v => family(v) === fam);
  const value = d.active.reduce((t, v) => t + standingCost(v), 0);
  const rebates = d.active.reduce((t, v) => t + (v.rebate?.amount ?? 0), 0);
  const soldYear = d.sold.filter(v => v.sold?.date.startsWith("2026")).length;
  const download = (name: string, body: string, type: string) => { const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([body], { type })); a.download = name; a.click(); };

  return (
    <Page>
      <Head title="Stock Delta & Tracker" sub="Weekly order book in, delta out. Prices, locations, customers and sold records carry across every upload.">
        <div className="ar-tools">
          <Btn className="ok" onClick={() => setCheck(true)}>Physical Stock Check Audit</Btn>
          <Btn className="bad" onClick={() => setBackfill(true)}>Backfill Sales (by VIN)</Btn>
          <Btn onClick={() => download("reynolds-stock-backup-sample.json", JSON.stringify({ note: "SAMPLE DATA, Reynolds demo", stock: s.stock }, null, 2), "application/json")}>Backup</Btn>
          <Btn className="vio" onClick={() => restoreInput.current?.click()}>Restore</Btn>
          <input ref={restoreInput} type="file" hidden accept=".json" onChange={e => { const f = e.target.files?.[0]; if (f) A.toast(`${f.name} read. Restoring over live stock is switched off in the demo snapshot`); e.target.value = ""; }} />
          <Btn className="amb" onClick={A.previewImport}>Demo Data</Btn>
          <Btn onClick={() => csv("active-stock-sample.csv", [["Vehicle", "VIN", "SVO", "Model", "Status", "Location", "Customer", "Job", "Standing price"], ...d.active.map(v => [v.id, v.vin ?? "", v.svo, `${v.model} ${v.variant}`, v.status, v.location, cname(v.customer ?? v.promisedTo), v.jobRef ?? "", standingCost(v)])])}>Export Active Stock</Btn>
          <Btn className="bad" onClick={() => { if (window.confirm("Reset the whole demo back to the 10:00 snapshot?")) A.reset(); }}>Reset</Btn>
        </div>
      </Head>

      <div className="d-split" style={{ marginBottom: 14 }}>
        <Card title="Upload Weekly Excel Stock List">
          <p className="d-muted" style={{ margin: "0 0 12px" }}>Drag and drop the weekly spreadsheet. Model panels build from the model column and active stock value from the price column. Photos, locations, dates, customer details and sold records are preserved across uploads.</p>
          <ReadDrop accept=".xlsx,.xls,.csv" title="Click to browse or drop your weekly Excel stock file here" sub="Automatic SVO de-duplication and model classification"
            steps={["Reading rows", "De-duplicating SVO numbers", "Classifying models", "Comparing with last week"]}
            onRead={name => { A.previewImport(); A.toast(`${name} read. Showing the sample order book delta (files aren't parsed in the demo)`); }} />
          {loaded && <div className="d-row" style={{ marginTop: 12 }}>
            <Chip tone="acc">+{ob.added.length} new</Chip><Chip>{ob.etaChanges.length} ETA changes</Chip><Chip tone="warn">{ob.missing.length} missing from file</Chip>
            <span className="d-grow" />{applied ? <Chip tone="ok">Delta applied</Chip> : <Btn sm kind="primary" onClick={() => go("Stock", "orderbook")}>Review and apply delta</Btn>}
          </div>}
        </Card>
        <div className="ar-navy">
          <div className="d-row"><span className="d-eyebrow d-grow">Live tracker snapshot</span></div>
          <div className="row"><span className="muted">Previous stock list:</span><span className="box">{ob.previousFile.replace(" (sample)", "")} ({ob.previousDate})</span></div>
          <div className="row"><span className="muted">Current stock list:</span><span className="box" style={{ color: loaded ? "#7fe0a8" : undefined }}>{loaded ? `${ob.file.replace(" (sample)", "")} (${ob.date})` : "Waiting for this week's file"}</span></div>
          <div className="row"><span className="muted">Total tracked units:</span><b style={{ textAlign: "right" }}>{d.active.length + d.sold.length}</b></div>
          <div className="row"><span className="muted">SVO duplicates cleaned:</span><b style={{ textAlign: "right", color: "#f0c04b" }}>0</b></div>
          <div className="d-row" style={{ marginTop: 12, fontSize: 11 }}><span className="muted d-grow">Sync active · sample data</span><button className="d-link" onClick={() => setHow(h => !h)}>How delta works?</button></div>
          {how && <p className="muted" style={{ fontSize: 11.5, margin: "8px 0 0" }}>Each upload is matched to last week's by SVO and VIN. New rows become incoming units, changed dates update the ETA, and a row that disappears is flagged for review. It is never marked sold.</p>}
        </div>
      </div>

      <div className="d-grid d-g4" style={{ marginBottom: 14 }}>
        <Kpi label="In stock" mark="IN" value={d.onSite.length} hint={<span style={{ color: "var(--ok)" }}>Arrived on site</span>} onClick={() => { setView("onsite"); setFam("All"); }} />
        <Kpi label="Due / incoming" mark="ETA" tone="warn" value={d.incoming.length} hint={<span style={{ color: "var(--warn)" }}>Future ETA</span>} onClick={() => { setView("incoming"); setFam("All"); }} />
        <Kpi label="Sold vehicles" mark="€" tone="bad" value={d.sold.length} hint={<span style={{ color: "var(--bad)" }}>{soldYear} sold in 2026 (archive)</span>} onClick={() => { setView("sold"); setFam("All"); }} />
        <Kpi label="Active stock value" mark="€" tone="ok" value={canSeeCost(s) ? eur(value) : "Hidden"} hint={canSeeCost(s) ? `Avg: ${eur(value / Math.max(1, d.active.length))}` : "role preview"} aside={canSeeCost(s) ? <span style={{ color: "var(--warn)" }}>Rebates: {eur(rebates)}</span> : undefined} />
      </div>

      <Card title={<>Stock Breakdown</>} aside={<div className="d-row">
        <Btn sm className="amb" style={{ background: "var(--warn)", color: "#1b1406", borderColor: "transparent" }} onClick={() => setAdding(true)}>+ Add Vehicle Manually</Btn>
        <input className="d-input" style={{ width: 230 }} placeholder="Search SVO, reg, job no., customer" value={q} onChange={e => setQ(e.target.value)} aria-label="Search stock" />
        <select className="d-select" value={view} onChange={e => { setView(e.target.value as StockView); setFam("All"); }} aria-label="Stock filter">
          <option value="all">All Active Stock</option><option value="onsite">In Stock (on site)</option><option value="incoming">Due / Incoming</option>
          <option value="reserved">Reserved</option><option value="prep">In Preparation</option><option value="sold">Sold Archive</option>
        </select></div>}>
        <div className="d-divider" style={{ marginTop: 0 }} />
        <div className="ar-pills">
          <button className={"ar-pill " + (fam === "All" ? "on" : "")} onClick={() => setFam("All")}>All Models ({searched.length})</button>
          {counts.map(([f, n]) => <button key={f} className={"ar-pill " + (fam === f ? "on" : "")} onClick={() => setFam(f)}>{f} ({n})</button>)}
        </div>
      </Card>

      {view === "sold" ? (
        <Card className="flush" style={{ marginTop: 16 }}>
          <Table rowKey={v => v.id} rows={rows} onRow={v => A.open("vehicle", v.id)} cols={[
            { key: "id", label: "Vehicle", render: v => <b>{v.id}</b>, sort: v => v.id },
            { key: "m", label: "Model", render: v => `${v.model} ${v.variant}` },
            { key: "b", label: "Buyer", render: v => <CLink id={v.sold?.buyer} /> },
            { key: "a", label: "Sale value", num: true, render: v => canSeeCost(s) ? eur(v.sold?.amount ?? 0) : "—", sort: v => v.sold?.amount ?? 0 },
            { key: "d", label: "Date", render: v => fmtDate(v.sold!.date), sort: v => v.sold!.date },
            { key: "c", label: "Checklist", render: v => <div className="d-row" style={{ gap: 4 }}>{Object.entries(v.sold!.checklist).map(([k, ok]) => <button key={k} className={"d-chip " + (ok ? "ok" : "")} title="Toggle" onClick={e => { e.stopPropagation(); A.toggleChecklist(v.id, k); }}>{ok ? "✓ " : ""}{k}</button>)}</div> },
            { key: "r", label: "", render: v => <Btn sm kind="ghost" onClick={e => { e.stopPropagation(); setRestore({ id: v.id, reason: "" }); }}>Restore…</Btn> },
          ]} empty="No sold records match." />
          <div className="d-row" style={{ padding: 12, borderTop: "1px solid var(--border)" }}><Btn sm onClick={() => csv("sold-report-sample.csv", [["Vehicle", "Model", "Buyer", "Amount", "Date"], ...d.sold.map(v => [v.id, `${v.model} ${v.variant}`, cname(v.sold?.buyer), v.sold?.amount ?? 0, v.sold?.date ?? ""])])}>Export report</Btn><Note>Sold is always a confirmed state. DMS transfer is simulated and never ticked automatically.</Note></div>
        </Card>
      ) : FAMILY_ORDER.map(f => {
        const g = rows.filter(v => family(v) === f);
        if (!g.length) return null;
        const [title, mark] = FAMILY_TITLE[f];
        return <section key={f} className="ar-model">
          <button className="ar-model-head" onClick={() => setClosed({ ...closed, [f]: !closed[f] })} aria-expanded={!closed[f]}>
            <span className="ic">{mark}</span><span><b>{title}</b><small>{g.length} unit(s) currently tracked</small></span>
            <span className="n">{g.length} Units</span><span aria-hidden style={{ width: 16, textAlign: "center" }}>{closed[f] ? "+" : "–"}</span>
          </button>
          {!closed[f] && <div className="ar-vgrid">{g.map(v => <TrackerCard key={v.id} v={v} onEdit={() => setEdit(v)} onSell={() => setSell(v)} />)}</div>}
        </section>;
      })}
      {view !== "sold" && !rows.length && <div style={{ marginTop: 16 }}><Empty>No vehicles match{q ? ` “${q}”` : " this filter"}.</Empty></div>}
      {edit && <Portal><EditVehicle v={edit} close={() => setEdit(null)} /></Portal>}
      {sell && <Portal><SellDialog v={sell} close={() => setSell(null)} /></Portal>}
      {check && <Portal><StockCheckDrawer close={() => setCheck(false)} /></Portal>}
      {backfill && !sell && <Portal><BackfillDialog close={() => setBackfill(false)} sell={setSell} /></Portal>}
      {adding && <Portal><AddVehicleDialog close={() => setAdding(false)} /></Portal>}
      {restore && <Portal><div className="d-modal-scrim" onClick={() => setRestore(null)}><div className="d-modal" style={{ width: "min(460px,100%)" }} onClick={e => e.stopPropagation()}>
        <div className="d-drawer-body d-grid"><b style={{ fontSize: 17 }}>Restore {restore.id} to active stock</b>
          <Field label="Correction reason (required)"><input className="d-input" value={restore.reason} onChange={e => setRestore({ ...restore, reason: e.target.value })} placeholder="e.g. sale cancelled by customer" /></Field>
          <div className="d-row"><span className="d-grow" /><Btn onClick={() => setRestore(null)}>Cancel</Btn><Btn kind="primary" disabled={!restore.reason.trim()} onClick={() => { A.restoreSold(restore.id, restore.reason); setRestore(null); }}>Restore</Btn></div></div></div></div></Portal>}
    </Page>
  );
}

/* ═════════════════════════ ORDER BOOK ═════════════════════════ */
export function OrderBook() {
  const [s, d] = useDerived();
  const [sel, setSel] = useState({ added: true, eta: true, missing: true });
  const [file, setFile] = useState<string | null>(null);
  const applied = s.imports.applied.includes(ORDER_BOOK_NEXT.importId);
  const ob = ORDER_BOOK_NEXT;
  return (
    <Page>
      <Head title="Order book" sub="Weekly Renault order book: preview every difference before applying. A row that disappears is a question, never a sale.">
        <Btn onClick={() => csv("active-stock-sample.csv", [["Vehicle", "Model", "Status", "ETA", "VIN", "SVO"], ...d.active.map(v => [v.id, `${v.model} ${v.variant}`, v.status, v.eta ?? "", v.vin ?? "", v.svo])])}>Export active stock</Btn>
      </Head>
      <div className="d-grid d-g2" style={{ marginBottom: 14 }}>
        <Card title="Upload">
          <label className="d-empty" style={{ display: "block", cursor: "pointer" }} onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); setFile(e.dataTransfer.files[0]?.name ?? null); }}>
            <input type="file" hidden accept=".xlsx,.csv" onChange={e => setFile(e.target.files?.[0]?.name ?? null)} />
            {file ? <>{file} selected — local files aren't parsed in the demo. Use the sample to see the diff.</> : "Drop the weekly order book here, or click to choose"}
          </label>
          <div className="d-row" style={{ marginTop: 10 }}><Btn kind="primary" onClick={A.previewImport}>Load sample order book</Btn><span className="d-muted">{ob.file}</span></div>
        </Card>
        <Card title="Live tracker snapshot">
          <dl className="d-kv">
            <dt>Previous file</dt><dd>{ob.previousFile} · {ob.previousDate}</dd>
            <dt>Current file</dt><dd>{s.imports.previewOpen || applied ? `${ob.file} · ${ob.date}` : "Not loaded"}</dd>
            <dt>Rows in current file</dt><dd>{s.imports.previewOpen || applied ? ob.rows : "—"}</dd>
            <dt>Tracked active</dt><dd>{d.active.length} ({d.onSite.length} on site + {d.incoming.length} incoming)</dd>
            <dt>Duplicates</dt><dd>0 — rows dedupe on import id + vehicle id; a repeat import re-matches instead of adding</dd>
          </dl>
        </Card>
      </div>
      {s.imports.previewOpen && (
        <Card title={`Differences in ${ob.file}`} aside={applied ? <Chip tone="ok">Already applied</Chip> : <Chip tone="warn">Preview — not applied</Chip>}>
          <div className="d-grid d-g3">
            <div><label className="d-row"><input type="checkbox" checked={sel.added} onChange={e => setSel({ ...sel, added: e.target.checked })} /><b>Added ({ob.added.length})</b></label>
              {ob.added.map(a => <div className="d-li" key={a.id}><span className="d-mono">{a.id}</span><span className="d-grow d-muted">{a.model} {a.variant} · {a.svo}</span><span className="d-mono">{fmtDate(a.eta)}</span></div>)}</div>
            <div><label className="d-row"><input type="checkbox" checked={sel.eta} onChange={e => setSel({ ...sel, eta: e.target.checked })} /><b>ETA changed ({ob.etaChanges.length})</b></label>
              {ob.etaChanges.map(c => <div className="d-li" key={c.id}><VLink id={c.id} /><span className="d-grow d-muted">{fmtDate(c.from)} → {fmtDate(c.to)}</span></div>)}</div>
            <div><label className="d-row"><input type="checkbox" checked={sel.missing} onChange={e => setSel({ ...sel, missing: e.target.checked })} /><b>Missing from file ({ob.missing.length})</b></label>
              {ob.missing.map(m => { const v = s.stock.find(x => x.id === m)!; return <div className="d-li" key={m}><VLink id={m} /><span className="d-grow d-muted">{v.promisedTo ? `Promised to ${cname(v.promisedTo)} · ` : ""}flag for review</span></div>; })}</div>
          </div>
          <div className="d-divider" />
          <div className="d-row"><Note>Applying adds the new incoming vehicles (no spec yet), updates three ETAs and flags V019 “Missing from latest file · review required” with a reconciliation task for Jack. Nothing is marked sold.</Note><span className="d-grow" />
            <Btn kind="primary" onClick={() => A.applyImport(sel)}>{applied ? "Apply again (dedupe test)" : "Apply selected changes"}</Btn></div>
        </Card>
      )}
      <Card title="Import history" style={{ marginTop: 14 }}>{s.imports.history.map(h => <div className="d-li" key={h.id + h.at}><span className="d-mono">{h.id}</span><span className="d-grow d-muted">{h.summary}</span><span className="d-mono">{h.at}</span></div>)}</Card>
    </Page>
  );
}

/* ═════════════════════════ SPECIFICATIONS ═════════════════════════ */
function DocPreview({ doc, close }: { doc: Doc; close: () => void }) {
  const [s] = useDerived();
  const v = s.stock.find(x => x.id === doc.vehicle);
  return (
    <div className="d-modal-scrim" onClick={close}><div className="d-modal" style={{ width: "min(720px,100%)" }} onClick={e => e.stopPropagation()}>
      <div className="d-drawer-head"><div className="d-grow"><b>{doc.title}</b><div className="d-muted">{doc.scope} · {doc.language} · {doc.version}</div></div><Btn sm kind="ghost" onClick={close}>Close</Btn></div>
      <div className="d-drawer-body"><div className="doc-paper"><div className="doc-watermark">SAMPLE</div>
        <h4>{doc.title}</h4><div style={{ color: "#6b6f78" }}>Illustrative sample — not manufacturer specifications</div>
        <table><tbody>
          <tr><td>Identifier</td><td>{v?.vin ?? v?.svo ?? "Model range document"}</td></tr>
          <tr><td>Model</td><td>Renault {v ? `${v.model} ${v.variant}` : doc.range}</td></tr>
          <tr><td>Gearbox / power</td><td>{v ? `${v.gearbox} · ${v.power || "—"}` : "Varies by build"}</td></tr>
          <tr><td>Source</td><td>{doc.source}</td></tr><tr><td>Match</td><td>{doc.match}</td></tr>
        </tbody></table>
        <p style={{ color: "#6b6f78" }}>Values on this page are demo placeholders. Production would retrieve the authorised document through an approved route (access to confirm).</p>
      </div></div>
    </div></div>
  );
}

export function Specifications() {
  const [s, d] = useDerived();
  const vid = s.focus.specVehicle ?? "V024";
  const v = s.stock.find(x => x.id === vid) ?? d.active[0];
  const [preview, setPreview] = useState<Doc | null>(null);
  const docs = s.docs.filter(x => x.vehicle === v.id);
  const generic = s.docs.filter(x => x.scope === "Generic model sheet" && (x.range === v.range || (v.range === "Used & trade-in" && x.range === "Master")));
  return (
    <Page>
      <Head title="Specifications" sub="Open the correct document from the vehicle. VIN-specific sheets and generic model sheets are kept distinct.">
        <select className="d-select" value={v.id} onChange={e => A.focus("specVehicle", e.target.value)} aria-label="Vehicle">{d.active.map(x => <option key={x.id} value={x.id}>{x.id} · {x.model} {x.variant}{x.specStatus !== "approved" ? " · no approved spec" : ""}</option>)}</select>
      </Head>
      <Card style={{ marginBottom: 14 }}>
        <div className="d-row"><div className="d-grow"><div className="d-eyebrow">Vehicle</div><div style={{ fontSize: 17, fontWeight: 600 }}>{v.id} · Renault {v.model} {v.variant}</div>
          <div className="d-mono d-muted">VIN {v.vin ?? "not yet issued"} · {v.svo}{v.eta ? ` · ETA ${fmtDate(v.eta)}` : ""}</div></div>{specChip(v)}
          {!docs.length && <Btn kind="primary" onClick={() => A.attachSample(v.id)}>Attach sample specification</Btn>}</div>
      </Card>
      <Card className="flush" title={undefined}><div style={{ padding: "14px 16px 4px" }}><b>VIN-specific documents</b></div>
        <Table rowKey={x => x.id} rows={docs} empty={<>No VIN-specific specification for {v.id}. Attach the illustrative sample to demonstrate the flow — portal retrieval is a future workflow (access to confirm).</>} cols={[
          { key: "t", label: "Document", render: x => <b style={{ fontWeight: 500 }}>{x.title}</b> },
          { key: "ty", label: "Type", render: x => x.type }, { key: "l", label: "Language", render: x => x.language }, { key: "v", label: "Version", render: x => x.version },
          { key: "s", label: "Source", render: x => x.source }, { key: "m", label: "Identifier match", render: x => x.match },
          { key: "st", label: "Status", render: x => <Chip tone={x.status === "approved" ? "ok" : "warn"}>{x.status}</Chip> },
          { key: "a", label: "", render: x => <div className="d-row" style={{ gap: 5 }}><Btn sm onClick={() => setPreview(x)}>Open</Btn>{x.status === "review" && <Btn sm kind="primary" onClick={() => A.approveSpec(x.id)}>Review & approve</Btn>}</div> },
        ]} />
      </Card>
      <Card className="flush" style={{ marginTop: 14 }}><div style={{ padding: "14px 16px 4px" }}><b>Model-range documents</b> <span className="d-muted">— generic, not a VIN match</span></div>
        <Table rowKey={x => x.id} rows={generic} cols={[
          { key: "t", label: "Document", render: x => x.title }, { key: "ty", label: "Type", render: x => x.type }, { key: "l", label: "Language", render: x => x.language },
          { key: "v", label: "Version", render: x => x.version }, { key: "a", label: "", render: x => <Btn sm onClick={() => setPreview(x)}>Open</Btn> },
        ]} />
      </Card>
      <Card style={{ marginTop: 14 }} title={`Active vehicles without an approved spec (${d.missingSpec.length})`}>
        <div className="d-row">{d.missingSpec.map(x => <button key={x.id} className={"d-chip " + (x.id === v.id ? "sel" : "")} onClick={() => A.focus("specVehicle", x.id)}>{x.id}{x.specStatus === "review" ? " · review" : ""}</button>)}</div>
      </Card>
      {preview && <Portal><DocPreview doc={preview} close={() => setPreview(null)} /></Portal>}
    </Page>
  );
}

/* ═════════════════════════ EXCEPTIONS ═════════════════════════ */
export function StockExceptions() {
  const [s, d] = useDerived();
  const [reason, setReason] = useState("Confirmed with Renault: build slot moved, unit still allocated to us");
  const missing = d.active.filter(v => v.reviewFlag);
  const etaConflicts = d.active.filter(v => v.promisedTo && v.eta && PROMISE[v.id] && v.eta > PROMISE[v.id]);
  const noVin = d.incoming.filter(v => !v.vin);
  type Ex = { id: string; kind: string; v: Vehicle; owner: string; evidence: string; action: JSX.Element };
  const rows: Ex[] = [
    ...missing.map(v => ({ id: "m" + v.id, kind: "Missing from latest file", v, owner: "p-jack", evidence: `Absent from ${ORDER_BOOK_NEXT.file}; present in ${ORDER_BOOK_NEXT.previousFile}`, action: <Btn sm kind="primary" onClick={() => A.resolveStock(v.id, reason)}>Keep as incoming</Btn> })),
    ...etaConflicts.map(v => ({ id: "e" + v.id, kind: "ETA after promised date", v, owner: "p-jack", evidence: `ETA ${fmtDate(v.eta!)} vs promised ${fmtDate(PROMISE[v.id])}`, action: <Btn sm onClick={() => go("Work", "tasks")}>Task</Btn> })),
    ...d.missingSpec.map(v => ({ id: "s" + v.id, kind: v.specStatus === "review" ? "Spec awaiting review" : "Missing specification", v, owner: "p-jack", evidence: v.specStatus === "review" ? "Sample attached, not yet approved" : "No VIN-specific document", action: <Btn sm onClick={() => { A.focus("specVehicle", v.id); go("Stock", "specs"); }}>Open</Btn> })),
    ...noVin.map(v => ({ id: "n" + v.id, kind: "VIN not yet issued", v, owner: "p-s6", evidence: `Tracked by ${v.svo} until the VIN is known — no VIN invented`, action: <span className="d-muted">Matching on SVO</span> })),
  ];
  return (
    <Page>
      <Head title="Stock exceptions" sub="Each exception has an owner, source evidence and a resolution. Resolved in the canonical record — never by a second tracker." />
      {missing.length > 0 && <Card style={{ marginBottom: 14 }}><Field label="Reason recorded when keeping a missing vehicle as incoming"><input className="d-input" value={reason} onChange={e => setReason(e.target.value)} /></Field></Card>}
      <Card className="flush"><Table rowKey={r => r.id} rows={rows} cols={[
        { key: "k", label: "Exception", render: r => <Chip tone={r.kind.startsWith("Missing from") ? "bad" : "warn"}>{r.kind}</Chip>, sort: r => r.kind },
        { key: "v", label: "Vehicle", render: r => <VLink id={r.v.id} /> },
        { key: "e", label: "Evidence", render: r => <span className="d-muted">{r.evidence}</span> },
        { key: "o", label: "Owner", render: r => r.owner === "p-jack" ? "Jack Kelly" : "Gavin Tuohy" },
        { key: "a", label: "Resolution", render: r => r.action },
      ]} empty="No open stock exceptions." /></Card>
      <div className="d-grid d-g2" style={{ marginTop: 14 }}>
        <Card title="Duplicate identifiers"><span className="d-muted">0 duplicates. Imports dedupe by import id and vehicle id; repeat imports are recorded and skipped.</span></Card>
        <Card title="Correction history">{s.corrections.length ? s.corrections.map(c => <div className="d-li" key={c.id}><span className="d-mono">{c.at}</span><VLink id={c.vehicle} /><span className="d-grow d-muted">{c.reason}</span></div>) : <span className="d-muted">No corrections yet.</span>}</Card>
      </div>
    </Page>
  );
}

export const STOCK_PAGES: Record<string, () => JSX.Element> = { overview: StockOverview, instock: InStock, orderbook: OrderBook, specs: Specifications, exceptions: StockExceptions };
