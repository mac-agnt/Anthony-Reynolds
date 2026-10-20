import { useState } from "react";
import { A, cname, eur, fmtDate, standingCost, useDerived, type Doc } from "./store";
import { COMPANIES, ORDER_BOOK_NEXT, type Vehicle } from "./fixtures";
import { Portal, Bar, Btn, CLink, Card, Chip, Empty, Field, Flag, Head, JLink, Metric, Note, NumInput, Page, RoleHidden, Seg, Table, VLink, canSeeCost } from "./ui";
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

function StockCard({ v, onEdit, onSell }: { v: Vehicle; onEdit: () => void; onSell: () => void }) {
  const [s] = useDerived();
  return (
    <article className="stock-card">
      <div className="stock-img" role="img" aria-label={`No photo supplied for ${v.id}, Renault ${v.model} ${v.variant}`}>
        <span className="model">{v.model}</span>
        <div><div style={{ fontWeight: 600 }}>Renault {v.model}</div><div className="alt">Photo not supplied · placeholder</div></div>
      </div>
      <div className="stock-body">
        <div className="d-row" style={{ gap: 6 }}><b style={{ fontSize: 15 }}>{v.id}</b><span className="d-muted">{v.variant}</span><span className="d-grow" />{statusChip(v)}</div>
        <div className="d-mono d-muted" style={{ fontSize: 10.5 }}>{v.vin ?? "VIN not yet issued"} · {v.svo}{v.reg ? ` · ${v.reg}` : ""}</div>
        <div className="d-muted">{v.colour} · {v.gearbox}{v.power ? ` · ${v.power}` : ""} · {v.status === "incoming" ? "inbound" : v.location}</div>
        <div className="d-row" style={{ gap: 6 }}>{specChip(v)}{v.reviewFlag && <Chip tone="warn">Review required</Chip>}</div>
        {(v.customer || v.promisedTo || v.jobRef) && <div className="d-muted">{v.customer ? <>For <CLink id={v.customer} /></> : v.promisedTo ? <>Promised to <CLink id={v.promisedTo} /></> : null}{v.jobRef ? <> · <JLink id={v.jobRef} /></> : null}</div>}
        {canSeeCost(s) && <div className="d-row"><span className="d-muted d-grow">Standing cost</span><b>{eur(standingCost(v))}</b></div>}
        {v.notes && <div className="d-faint" style={{ fontSize: 11.5 }}>{v.notes}</div>}
      </div>
      <div className="stock-actions">
        <Btn sm onClick={() => { A.focus("specVehicle", v.id); go("Stock", "specs"); }}>Open specification</Btn>
        <Btn sm onClick={onEdit}>Edit details</Btn>
        <Btn sm onClick={() => { A.newQuote(v.id); go("Sales", "quote"); }}>Create quote</Btn>
        <Btn sm kind="ghost" onClick={() => A.open("vehicle", v.id)}>Record</Btn>
        {v.status !== "incoming" && <Btn sm kind="ghost" onClick={onSell}>Confirm sale…</Btn>}
      </div>
    </article>
  );
}

export function InStock() {
  const [s, d] = useDerived();
  const [mode, setMode] = useState<"active" | "sold">("active");
  const [layout, setLayout] = useState<"cards" | "table">("cards");
  const [q, setQ] = useState("");
  const [closed, setClosed] = useState<Record<string, boolean>>({});
  const [edit, setEdit] = useState<Vehicle | null>(null);
  const [sell, setSell] = useState<Vehicle | null>(null);
  const [check, setCheck] = useState(false);
  const [restore, setRestore] = useState<{ id: string; reason: string } | null>(null);
  const match = (v: Vehicle) => !q || [v.id, v.vin ?? "", v.svo, v.reg, v.jobRef ?? "", v.model, v.variant].some(x => x.toLowerCase().includes(q.toLowerCase()));
  const rows = (mode === "active" ? d.active : d.sold).filter(match);
  const ranges = ["Master", "Trafic", "Trucks", "Used & trade-in"] as const;
  return (
    <Page>
      <Head title={mode === "active" ? "In stock" : "Sold archive"} sub={mode === "active" ? "Grouped by model range. Search by VIN, SVO / order reference, registration or job number." : "Confirmed sales only. Restoring a record needs a reason and keeps a reversible history entry."}>
        <Seg value={mode} onChange={setMode} options={[["active", `Active (${d.active.length})`], ["sold", `Sold (${d.sold.length})`]]} label="Stock view" />
        {mode === "active" && <Seg value={layout} onChange={setLayout} options={[["cards", "Cards"], ["table", "Compact list"]]} label="Layout" />}
        <input className="d-input" style={{ width: 230 }} placeholder="Search VIN, SVO, reg, job…" value={q} onChange={e => setQ(e.target.value)} aria-label="Search stock" />
        {mode === "active" && <Btn onClick={() => setCheck(true)}>Physical stock check</Btn>}
      </Head>
      {mode === "sold" ? (
        <Card className="flush">
          <Table rowKey={v => v.id} rows={rows} onRow={v => A.open("vehicle", v.id)} cols={[
            { key: "id", label: "Vehicle", render: v => <b>{v.id}</b>, sort: v => v.id },
            { key: "m", label: "Model", render: v => `${v.model} ${v.variant}` },
            { key: "b", label: "Buyer", render: v => <CLink id={v.sold?.buyer} /> },
            { key: "a", label: "Sale value", num: true, render: v => eur(v.sold?.amount ?? 0), sort: v => v.sold?.amount ?? 0 },
            { key: "d", label: "Date", render: v => fmtDate(v.sold!.date), sort: v => v.sold!.date },
            { key: "c", label: "Checklist", render: v => <div className="d-row" style={{ gap: 4 }}>{Object.entries(v.sold!.checklist).map(([k, ok]) => <button key={k} className={"d-chip " + (ok ? "ok" : "")} title="Toggle" onClick={e => { e.stopPropagation(); A.toggleChecklist(v.id, k); }}>{ok ? "✓ " : ""}{k}</button>)}</div> },
            { key: "r", label: "", render: v => <Btn sm kind="ghost" onClick={e => { e.stopPropagation(); setRestore({ id: v.id, reason: "" }); }}>Restore…</Btn> },
          ]} empty="No sold records match." />
          <div className="d-row" style={{ padding: 12, borderTop: "1px solid var(--border)" }}><Btn sm onClick={() => csv("sold-report-sample.csv", [["Vehicle", "Model", "Buyer", "Amount", "Date"], ...d.sold.map(v => [v.id, `${v.model} ${v.variant}`, cname(v.sold?.buyer), v.sold?.amount ?? 0, v.sold?.date ?? ""])])}>Export report</Btn><Note>DMS transfer is simulated and never marked done automatically.</Note></div>
        </Card>
      ) : layout === "table" ? (
        <Card className="flush"><Table rowKey={v => v.id} rows={rows} limit={15} onRow={v => A.open("vehicle", v.id)} cols={[
          { key: "id", label: "Vehicle", render: v => <b>{v.id}</b>, sort: v => v.id },
          { key: "m", label: "Model", render: v => `${v.model} ${v.variant}`, sort: v => v.model },
          { key: "v", label: "VIN / SVO", render: v => <span className="d-mono">{v.vin ?? v.svo}</span> },
          { key: "s", label: "Status", render: statusChip, sort: v => v.status },
          { key: "sp", label: "Spec", render: specChip, sort: v => v.specStatus },
          { key: "c", label: "Customer", render: v => <CLink id={v.customer ?? v.promisedTo} /> },
          ...(canSeeCost(s) ? [{ key: "sc", label: "Standing cost", num: true, render: (v: Vehicle) => eur(standingCost(v)), sort: (v: Vehicle) => standingCost(v) }] : []),
        ]} /></Card>
      ) : ranges.map(r => {
        const g = rows.filter(v => v.range === r);
        if (!g.length) return null;
        return <section key={r}>
          <button className="group-head" onClick={() => setClosed({ ...closed, [r]: !closed[r] })} aria-expanded={!closed[r]}><b>{r}</b><Chip>{g.length}</Chip><span className="d-muted">{closed[r] ? "Show" : "Hide"}</span></button>
          {!closed[r] && <div className="stock-grid">{g.map(v => <StockCard key={v.id} v={v} onEdit={() => setEdit(v)} onSell={() => setSell(v)} />)}</div>}
        </section>;
      })}
      {mode === "active" && !rows.length && <Empty>No vehicles match “{q}”.</Empty>}
      {edit && <Portal><EditVehicle v={edit} close={() => setEdit(null)} /></Portal>}
      {sell && <Portal><SellDialog v={sell} close={() => setSell(null)} /></Portal>}
      {check && <Portal><StockCheckDrawer close={() => setCheck(false)} /></Portal>}
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
