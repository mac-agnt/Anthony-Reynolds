import { useState } from "react";
import { A, DISCOUNT_THRESHOLD, cname, company, eur, fmtDate, handoverGates, pname, quoteGates, quoteTotals, standingCost, useDerived, type State } from "./store";
import { COMPANIES, SERVICE_VEHICLES, type Quote, type QuoteStage } from "./fixtures";
import { Avatar, Btn, CLink, Card, Chip, Empty, Field, Flag, Head, Metric, Note, NumInput, Page, QLink, RoleHidden, Seg, Table, VLink, canSeeCost, canSeeMoney } from "./ui";
import { go } from "./nav";
import { RECEIVABLES } from "./fixtures";
import { daysBetween } from "./store";

const STAGES: QuoteStage[] = ["Enquiry", "Quoted", "Approval", "Reserved", "Won"];
const statusOf = (s: State, q: Quote) => { const g = quoteGates(s, q); return g.ready ? "Ready for customer" : g.needsDiscount && !g.discountOk ? "Awaiting approval" : !g.specOk ? "Awaiting specification" : "Draft"; };

/* ═════════════════════════ PIPELINE ═════════════════════════ */
export function Pipeline() {
  const [s] = useDerived();
  const quotes = s.quotes;
  return (
    <Page>
      <Head title="Sales pipeline" sub="Operational stages with the next action and owner. Counts and values derive from the rows; no conversion rates without closed outcomes.">
        <Btn kind="primary" onClick={() => { A.focus("quote", "Q-1042"); go("Sales", "quote"); }}>Open Q-1042</Btn>
      </Head>
      <div className="d-grid d-g5">
        {STAGES.map(st => {
          const qs = quotes.filter(q => q.stage === st);
          return <div key={st} className="d-grid" style={{ gap: 10, alignContent: "start" }}>
            <div className="d-row"><b>{st}</b><Chip>{qs.length}</Chip><span className="d-grow" /><span className="d-mono d-muted">{eur(qs.reduce((t, q) => t + quoteTotals(q).net, 0))}</span></div>
            {qs.map(q => (
              <div key={q.id} className="d-card" style={{ padding: 12, cursor: "pointer" }} onClick={() => { A.focus("quote", q.id); go("Sales", "quote"); }}>
                <div className="d-row" style={{ gap: 6 }}><b>{q.id}</b><span className="d-grow" /><Avatar id={q.owner} size={22} /></div>
                <div style={{ fontWeight: 500, marginTop: 4 }}>{cname(q.customer)}</div>
                <div className="d-muted" style={{ fontSize: 11.5 }}>{q.vehicle ? `${q.vehicle} · ` : ""}{eur(quoteTotals(q).net)} net</div>
                <div className="d-muted" style={{ fontSize: 11.5, marginTop: 6 }}>Next: {q.nextAction} · {q.due}</div>
                {q.stage !== "Won" && q.stage !== "Enquiry" && <div style={{ marginTop: 6 }}><Chip tone={quoteGates(s, q).ready ? "ok" : "warn"}>{statusOf(s, q)}</Chip></div>}
              </div>))}
            {!qs.length && <Empty>None</Empty>}
          </div>;
        })}
      </div>
    </Page>
  );
}

/* ═════════════════════════ QUOTE BUILDER ═════════════════════════ */
export function QuoteBuilder() {
  const [s] = useDerived();
  const [mode, setMode] = useState<"workings" | "preview">("workings");
  const q = s.quotes.find(x => x.id === s.focus.quote) ?? s.quotes[0];
  const v = q.vehicle ? s.stock.find(x => x.id === q.vehicle) : undefined;
  const t = quoteTotals(q);
  const g = quoteGates(s, q);
  const cost = v ? standingCost(v) : 0;
  const status = statusOf(s, q);
  return (
    <Page>
      <Head title="Quote Builder" sub="One structured deal. Internal workings stay separate from what the customer sees.">
        <select className="d-select" value={q.id} onChange={e => A.focus("quote", e.target.value)} aria-label="Quote">{s.quotes.map(x => <option key={x.id} value={x.id}>{x.id} · {cname(x.customer)}</option>)}</select>
        <Seg value={mode} onChange={setMode} options={[["workings", "Workings"], ["preview", "Customer Preview"]]} label="Mode" />
      </Head>
      <div className="d-split">
        {mode === "workings" ? (
          <div className="d-grid">
            <Card title="Customer & salesperson"><div className="d-grid d-g3">
              <Field label="Company"><span><CLink id={q.customer} /></span></Field>
              <Field label="Contact"><span>{company(q.customer)?.contact} · {company(q.customer)?.email}</span></Field>
              <Field label="Address" hint="from customer record"><span className="d-muted">On file (sample — not shown)</span></Field>
              <Field label="Quote date"><span>{q.date}</span></Field><Field label="Salesperson"><span>{pname(q.owner)}</span></Field><Field label="Deal reference"><span className="d-mono">{q.id} · v{g.meta.version}</span></Field>
            </div></Card>
            <Card title="Vehicle & warranty">{v ? <div className="d-grid d-g3">
              <Field label="Vehicle"><span><VLink id={v.id} /> · Renault {v.model} {v.variant}</span></Field>
              <Field label="VIN / SVO"><span className="d-mono">{v.vin ?? "not yet issued"} · {v.svo}</span></Field>
              <Field label="Colour / gearbox"><span>{v.colour} · {v.gearbox}</span></Field>
              <Field label="Specification"><span>{g.specOk ? <Chip tone="ok">Approved</Chip> : <><Chip tone="warn">{v.specStatus === "review" ? "In review" : "Missing"}</Chip> <button className="d-link" onClick={() => { A.focus("specVehicle", v.id); go("Stock", "specs"); }}>Open</button></>}</span></Field>
              <Field label="ETA / location"><span>{v.eta ? fmtDate(v.eta) : v.location}</span></Field>
              <Field label="Warranty / service contract"><span>{q.warranty}</span></Field>
            </div> : <Empty>No vehicle matched yet.</Empty>}</Card>
            <Card title="Costs & options" aside={<span className="d-muted">tinted cells are editable</span>}>
              <div className="d-list">{q.lines.map(l => (
                <div className="d-li" key={l.id}><Chip>{l.group}</Chip>
                  <input className="d-input edit d-grow" value={l.label} onChange={e => A.editLine(q.id, l.id, { label: e.target.value })} aria-label="Line label" />
                  <NumInput value={l.amount} onChange={n => A.editLine(q.id, l.id, { amount: n })} label={l.label} />
                  {l.group !== "vehicle" && <Btn sm kind="ghost" onClick={() => A.removeLine(q.id, l.id)} aria-label="Remove line">✕</Btn>}
                </div>))}
                <div className="d-li"><span className="d-grow"><b>Discount</b> <span className="d-muted">above {eur(DISCOUNT_THRESHOLD)} needs approval (configurable demo policy)</span></span><NumInput value={q.discount} onChange={n => A.setDiscount(q.id, n)} label="Discount" /></div>
              </div>
              <div className="d-row" style={{ marginTop: 10 }}><Btn sm onClick={() => A.addLine(q.id, "options")}>Add option</Btn><Btn sm kind="ghost" onClick={() => A.addLine(q.id, "delivery")}>Add delivery extra</Btn></div>
            </Card>
            <Card title="Internal workings" aside={<Chip tone="bad">Internal — never in customer output</Chip>}>
              {canSeeCost(s) && v ? <div className="d-grid d-g2">
                <div className="d-list">{v.costs.map(c => <div className="d-li" key={c.label}><span className="d-grow d-muted">{c.label}</span>{eur(c.amount)}</div>)}<div className="d-li"><b className="d-grow">Standing cost</b><b>{eur(cost)}</b></div></div>
                <div className="d-grid" style={{ alignContent: "start", gap: 8 }}><Metric label="Net selling price" value={eur(t.net)} /><Metric label="Contribution before overheads" value={eur(t.net - cost)} tone={t.net - cost < 0 ? "bad" : undefined} hint="same standing cost as the stock record" /></div>
              </div> : v ? <RoleHidden what="Internal cost and contribution" /> : <Empty>Match a vehicle to see workings.</Empty>}
            </Card>
            <div className="d-grid d-g2">
              <Card title="Trade-in (optional)" aside={<input type="checkbox" checked={q.tradeIn.on} onChange={e => A.setTradeIn(q.id, { on: e.target.checked })} aria-label="Include trade-in" />}>
                {q.tradeIn.on ? <div className="d-grid" style={{ gap: 8 }}>
                  <div className="d-grid d-g2"><Field label="Registration"><input className="d-input edit" value={q.tradeIn.reg} onChange={e => A.setTradeIn(q.id, { reg: e.target.value })} /></Field><Field label="Model"><input className="d-input edit" value={q.tradeIn.model} onChange={e => A.setTradeIn(q.id, { model: e.target.value })} /></Field></div>
                  <div className="d-grid d-g2"><Field label="Allowance"><NumInput value={q.tradeIn.allowance} onChange={n => A.setTradeIn(q.id, { allowance: n })} /></Field><Field label="Settlement owed"><NumInput value={q.tradeIn.settlement} onChange={n => A.setTradeIn(q.id, { settlement: n })} /></Field></div>
                  <div className="d-muted">Net trade-in value {eur(q.tradeIn.allowance - q.tradeIn.settlement)} · balance after trade-in {eur(t.net - (q.tradeIn.allowance - q.tradeIn.settlement))}. The net quote total is unchanged.</div>
                </div> : <span className="d-muted">No trade-in on this version.</span>}
              </Card>
              <Card title="Finance (optional)" aside={<input type="checkbox" checked={q.finance.on} onChange={e => A.setFinance(q.id, { on: e.target.checked })} aria-label="Include finance" />}>
                {q.finance.on ? <div className="d-grid" style={{ gap: 8 }}>
                  <Field label="Provider / contact reference"><input className="d-input edit" value={q.finance.provider} onChange={e => A.setFinance(q.id, { provider: e.target.value })} /></Field>
                  <div className="d-grid d-g2"><Field label="Deposit"><NumInput value={q.finance.deposit} onChange={n => A.setFinance(q.id, { deposit: n })} /></Field><Field label="Amount financed"><NumInput value={q.finance.financed} onChange={n => A.setFinance(q.id, { financed: n })} /></Field>
                    <Field label="Term (months)"><NumInput value={q.finance.term} onChange={n => A.setFinance(q.id, { term: n })} /></Field><Field label="Repayment (entered)"><NumInput value={q.finance.repayment} onChange={n => A.setFinance(q.id, { repayment: n })} /></Field></div>
                  <Note>Figures as entered from the provider — not a lender quote or approval. No eligibility or repayment calculation.</Note>
                </div> : <span className="d-muted">No finance arrangement selected.</span>}
              </Card>
            </div>
          </div>
        ) : <CustomerPreview q={q} />}
        <div className="d-grid" style={{ position: "sticky", top: 10 }}>
          <Card title="Deal summary" aside={<Chip tone={g.ready ? "ok" : "warn"}>{status}</Chip>}>
            <dl className="d-kv"><dt>Vehicle</dt><dd>{eur(t.vehicle)}</dd><dt>Options</dt><dd>{eur(t.options)}</dd><dt>Delivery / prep</dt><dd>{eur(t.delivery)}</dd>
              <dt>Subtotal</dt><dd>{eur(t.subtotal)}</dd><dt>Discount</dt><dd>−{eur(q.discount)}</dd><dt><b>Net quote</b></dt><dd><b style={{ fontSize: 18 }}>{eur(t.net)}</b></dd></dl>
            <div className="d-faint" style={{ fontSize: 11, marginTop: 6 }}>Net sample pricing; tax not calculated.</div>
          </Card>
          <Card title="Review gates">
            <div className="d-list">
              <div className="d-li"><Chip tone={!g.needsDiscount || g.discountOk ? "ok" : "warn"}>{!g.needsDiscount ? "Not needed" : g.discountOk ? "Approved" : "Pending"}</Chip><span className="d-grow">Discount approval · Anthony</span>
                {g.needsDiscount && !g.discountOk && (s.role === "management" ? <Btn sm kind="primary" onClick={() => A.approveDiscount(q.id)}>Approve v{g.meta.version}</Btn> : <span className="d-muted">needs Anthony</span>)}</div>
              <div className="d-li"><Chip tone={g.specOk ? "ok" : "warn"}>{g.specOk ? "Approved" : "Open"}</Chip><span className="d-grow">Specification · Jack</span>{!g.specOk && v && <Btn sm onClick={() => { A.focus("specVehicle", v.id); go("Stock", "specs"); }}>Resolve</Btn>}</div>
            </div>
            {g.staleApproval && <Flag tone="bad">Edited after approval — v{g.meta.discountApproval?.version} approval no longer applies. Review required.</Flag>}
            <div className="d-row" style={{ marginTop: 10 }}><Btn onClick={() => go("Sales", "documents")}>Preview document pack</Btn><Btn kind="ghost" onClick={() => A.followUpTask(q.id)}>Create follow-up task</Btn></div>
          </Card>
          <Card title="Version history">{g.meta.history.map((h, i) => <div key={i} className="d-muted" style={{ fontSize: 11.5, padding: "3px 0" }}>{h}</div>)}</Card>
        </div>
      </div>
    </Page>
  );
}

function CustomerPreview({ q }: { q: Quote }) {
  const [s] = useDerived();
  const t = quoteTotals(q);
  const g = quoteGates(s, q);
  const v = q.vehicle ? s.stock.find(x => x.id === q.vehicle) : undefined;
  return (
    <div className="d-grid">
      <div className="doc-paper print-area">
        {!g.ready && <div className="doc-watermark">DRAFT</div>}
        <div style={{ display: "flex", justifyContent: "space-between" }}><div><h4>Reynolds Commercials</h4><div>Tones Road, Walderstown, Athlone, Co. Westmeath, N37 EH24</div></div><div style={{ textAlign: "right" }}><b>Quotation {q.id}</b><div>{q.date} · v{g.meta.version}</div></div></div>
        <p style={{ marginTop: 18 }}><b>{cname(q.customer)}</b><br />Attn: {company(q.customer)?.contact}</p>
        {v && <p>Renault {v.model} {v.variant} · {v.colour} · {v.gearbox}{v.vin ? ` · VIN ${v.vin}` : ""}<br /><span style={{ color: "#6b6f78" }}>{q.warranty}</span></p>}
        <table><thead><tr><th>Description</th><th className="num">Amount</th></tr></thead><tbody>
          {q.lines.map(l => <tr key={l.id}><td>{l.label}</td><td className="num">{eur(l.amount)}</td></tr>)}
          {q.discount > 0 && <tr><td>Discount</td><td className="num">−{eur(q.discount)}</td></tr>}
          <tr><td><b>Total (net)</b></td><td className="num"><b>{eur(t.net)}</b></td></tr></tbody></table>
        {q.tradeIn.on && <p>Trade-in {q.tradeIn.reg} {q.tradeIn.model}: allowance {eur(q.tradeIn.allowance)}.</p>}
        <p style={{ color: "#6b6f78", fontSize: 11 }}>Sample demo document. Net pricing; tax not calculated. Not an invoice or an offer of finance.</p>
      </div>
      <div className="d-row"><Btn onClick={() => window.print()}>Print / save PDF</Btn><Note>No internal cost, contribution or lender notes appear here.</Note></div>
    </div>
  );
}

/* ═════════════════════════ CUSTOMERS ═════════════════════════ */
export function Customers() {
  const [s] = useDerived();
  const rows = COMPANIES.filter(c => c.kind === "customer").map(c => ({
    c, vehicles: SERVICE_VEHICLES.filter(v => v.customer === c.id).length + s.stock.filter(v => v.customer === c.id).length,
    jobs: s.jobs.filter(j => j.customer === c.id && j.status !== "completed").length, tests: s.cvrt.filter(t => t.customer === c.id).length,
    quotes: s.quotes.filter(q => q.customer === c.id).length, bal: RECEIVABLES.filter(r => r.customer === c.id).reduce((a, r) => a + r.amount, 0),
    od: RECEIVABLES.filter(r => r.customer === c.id && daysBetween(r.due) > 0).length,
  }));
  return (
    <Page>
      <Head title="Customers" sub="Shared company view across workshop, CVRT and sales. All customers are fictional demo companies." />
      <Card className="flush"><Table rowKey={r => r.c.id} rows={rows} onRow={r => A.open("company", r.c.id)} cols={[
        { key: "n", label: "Company", render: r => <b style={{ fontWeight: 500 }}>{r.c.name}</b>, sort: r => r.c.name },
        { key: "t", label: "Type", render: r => r.c.type }, { key: "ct", label: "Contact", render: r => r.c.contact },
        { key: "v", label: "Vehicles", num: true, render: r => r.vehicles, sort: r => r.vehicles },
        { key: "j", label: "Live jobs", num: true, render: r => r.jobs, sort: r => r.jobs },
        { key: "te", label: "Tests today", num: true, render: r => r.tests, sort: r => r.tests },
        { key: "q", label: "Quotes", num: true, render: r => r.quotes, sort: r => r.quotes },
        { key: "b", label: "Imported balance", num: true, render: r => canSeeMoney(s) ? (r.bal ? <span style={{ color: r.od ? "var(--bad)" : undefined }}>{eur(r.bal)}{r.od ? " · overdue" : ""}</span> : "—") : <span className="d-faint">hidden</span>, sort: r => r.bal },
      ]} /></Card>
    </Page>
  );
}

/* ═════════════════════════ HANDOVERS ═════════════════════════ */
export function Handovers() {
  const [s] = useDerived();
  const ids = Object.keys(s.gates);
  return (
    <Page>
      <Head title="Handovers" sub="Independent service, test, document and accounts checks. A commercial sale, a physical handover and an accounting posting are separate events." />
      <div className="d-grid">{ids.map(id => <HandoverCard key={id} id={id} />)}</div>
    </Page>
  );
}
function HandoverCard({ id }: { id: string }) {
  const [s] = useDerived();
  const h = handoverGates(s, id);
  const g = s.gates[id];
  const v = h.vehicle;
  const job = h.job, test = h.test;
  const act = (key: string) => {
    if (key === "parts" && job?.partBlocker && !job.partBlocker.received) return <Btn sm onClick={() => A.receivePart(job.id)}>Mark part received</Btn>;
    if (key === "repair" && job && job.partBlocker?.received && job.status === "queued") return <Btn sm onClick={() => A.completeRepair(job.id)}>Repair complete (service review)</Btn>;
    if (key === "test" && test) {
      if (test.status === "awaiting_repair") return (job?.status === "awaiting_qc" || job?.status === "completed") ? <Btn sm onClick={() => A.scheduleRetest(test.id)}>Schedule retest</Btn> : <span className="d-faint">after repair</span>;
      if (test.status === "awaiting_retest") return <span className="d-row" style={{ gap: 5 }}><Btn sm onClick={() => A.recordResult(test.id, "pass")}>Record pass</Btn><Btn sm kind="ghost" onClick={() => A.recordResult(test.id, "fail")}>Record fail</Btn></span>;
    }
    if (key === "documents") return <Btn sm kind="ghost" onClick={() => A.setGate(id, "documents", !g.documents)}>{g.documents ? "Undo" : "Mark checked"}</Btn>;
    if (key === "accounts") return canSeeMoney(s) ? <Btn sm kind="ghost" onClick={() => A.setGate(id, "accounts", !g.accounts)}>{g.accounts ? "Undo" : "Record clearance"}</Btn> : <span className="d-faint">accounts only</span>;
    return null;
  };
  return (
    <Card title={<><VLink id={id} /> <span className="d-muted">· Renault {v.model} {v.variant} · for <CLink id={v.customer} /></span></>} aside={g.handedOver ? <Chip tone="ok">Handed over</Chip> : h.ready ? <Chip tone="ok">Ready to hand over</Chip> : <Chip tone="bad">Blocked · {h.list.filter(x => !x.ok).length} open</Chip>}>
      {!h.ready && id === "V008" && <Flag tone="bad">V008 can't leave: {h.list.filter(x => !x.ok).map(x => x.label.toLowerCase()).join(", ")}. Next review 11:30 when the part is due. A repair finishing never passes the test on its own.</Flag>}
      <div className="d-list" style={{ marginTop: 8 }}>{h.list.map(x => (
        <div className="d-li" key={x.key}><Chip tone={x.ok ? "ok" : "bad"}>{x.ok ? "Clear" : "Open"}</Chip><div className="d-grow"><b style={{ fontWeight: 500 }}>{x.label}</b> <span className="d-muted">— {x.detail}</span></div><Avatar id={x.owner} size={22} /><span className="d-muted" style={{ width: 120 }}>{pname(x.owner)}</span>{act(x.key)}</div>))}</div>
      <div className="d-divider" />
      <div className="d-row">
        <span className="d-muted">Registration {v.reg || "unassigned"} · warranty {v.status === "reserved" ? "to register at handover" : "registered"} · signatures {g.documents ? "complete" : "outstanding"} · DMS transfer {g.dms ? "marked (simulated)" : "not done"}</span><span className="d-grow" />
        <Btn sm kind="ghost" onClick={() => A.setGate(id, "dms", !g.dms)}>{g.dms ? "Undo DMS mark" : "Mark DMS transfer (simulated)"}</Btn>
        <Btn sm kind="primary" disabled={!h.ready || g.handedOver} onClick={() => A.setGate(id, "handedOver", true)}>Record physical handover</Btn>
      </div>
    </Card>
  );
}

/* ═════════════════════════ DOCUMENTS ═════════════════════════ */
export function Documents() {
  const [s] = useDerived();
  const [tab, setTab] = useState<"deal" | "mfr" | "simi">("deal");
  const q = s.quotes.find(x => x.id === s.focus.quote) ?? s.quotes[0];
  const v = q.vehicle ? s.stock.find(x => x.id === q.vehicle) : undefined;
  const g = quoteGates(s, q);
  const t = quoteTotals(q);
  const c = company(q.customer);
  const missing = [!v?.vin && "VIN (not yet issued by manufacturer)", !v?.reg && "Registration number (assigned at registration)", "Customer registered address (to confirm on the actual template)", !g.specOk && "Approved specification", g.needsDiscount && !g.discountOk && "Discount approval"].filter(Boolean) as string[];
  return (
    <Page>
      <Head title="Documents" sub={`Three linked previews from one deal record: ${q.id} v${g.meta.version}. Sample layouts — not official forms, completed registrations or submissions.`}>
        <select className="d-select" value={q.id} onChange={e => A.focus("quote", e.target.value)} aria-label="Deal">{s.quotes.filter(x => x.vehicle).map(x => <option key={x.id} value={x.id}>{x.id} · {cname(x.customer)}</option>)}</select>
        <Btn onClick={() => window.print()}>Print / save PDF</Btn>
      </Head>
      <div className="d-split">
        <div>
          <div className="d-tabs">{([["deal", "Customer Dealsheet"], ["mfr", "Manufacturer / New Customer Information"], ["simi", "SIMI-related Draft"]] as const).map(([k, l]) => <button key={k} className={tab === k ? "on" : ""} onClick={() => setTab(k)}>{l}</button>)}</div>
          <div className="doc-paper print-area">
            {!g.ready && <div className="doc-watermark">DRAFT</div>}
            <div style={{ display: "flex", justifyContent: "space-between" }}><h4>{tab === "deal" ? "Customer Dealsheet" : tab === "mfr" ? "Manufacturer / New Customer Information (sample mapping)" : "SIMI-related draft — template slot"}</h4><span>{q.id} · v{g.meta.version}</span></div>
            <table><tbody>
              <tr><td>Customer</td><td>{c?.name}</td></tr><tr><td>Contact</td><td>{c?.contact} · {c?.email}</td></tr>
              <tr><td>Vehicle</td><td>Renault {v?.model} {v?.variant}</td></tr><tr><td>VIN</td><td>{v?.vin ?? "— not yet issued"}</td></tr>
              <tr><td>Order reference</td><td>{v?.svo}</td></tr><tr><td>Registration</td><td>{v?.reg || "— unassigned"}</td></tr>
              {tab === "deal" && <><tr><td>Salesperson</td><td>{pname(q.owner)}</td></tr>{q.lines.map(l => <tr key={l.id}><td>{l.label}</td><td className="num">{eur(l.amount)}</td></tr>)}<tr><td>Discount</td><td className="num">−{eur(q.discount)}</td></tr><tr><td><b>Net total</b></td><td className="num"><b>{eur(t.net)}</b></td></tr></>}
              {tab === "mfr" && <><tr><td>Customer type</td><td>{c?.type}</td></tr><tr><td>Colour / gearbox</td><td>{v?.colour} · {v?.gearbox}</td></tr><tr><td>Delivery date</td><td>{v?.eta ? fmtDate(v.eta) : "—"}</td></tr></>}
              {tab === "simi" && <tr><td colSpan={2} style={{ color: "#6b6f78", padding: "18px 4px" }}>Awaiting the approved actual template. Fields above are mapped from the same deal record; registration support fields only where the supplied mapping supports them. Nothing is submitted.</td></tr>}
            </tbody></table>
            <p style={{ color: "#6b6f78", fontSize: 11 }}>Generated in the demo from {q.id} v{g.meta.version}. Correct a field in the deal and every draft updates. No internal cost or lender notes.</p>
          </div>
        </div>
        <div className="d-grid">
          <Card title="Pack status" aside={<Chip tone={g.ready ? "ok" : "warn"}>{g.ready ? "Ready for customer" : "Draft"}</Chip>}><dl className="d-kv"><dt>Deal version</dt><dd>v{g.meta.version}</dd><dt>Net</dt><dd>{eur(t.net)}</dd><dt>Sent?</dt><dd>No — nothing is sent from the demo</dd></dl></Card>
          <Card title={`Missing fields (${missing.length})`}>{missing.map(m => <div className="d-li" key={m}><Chip tone="warn">Missing</Chip><span>{m}</span></div>)}</Card>
          <Card title="Follow-up"><Btn onClick={() => A.followUpTask(q.id)}>Create follow-up task for Jack</Btn></Card>
          <Card title="Workings"><Btn kind="ghost" onClick={() => go("Sales", "quote")}>Back to Quote Builder</Btn></Card>
          {!canSeeCost(s) && <RoleHidden what="Internal workings" />}
        </div>
      </div>
    </Page>
  );
}

export const SALES_PAGES: Record<string, () => JSX.Element> = { pipeline: Pipeline, quote: QuoteBuilder, customers: Customers, handovers: Handovers, documents: Documents };
export { QLink };
