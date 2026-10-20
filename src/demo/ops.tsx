import { useState } from "react";
import { A, RECEIVABLES, approvals, cname, daysBetween, dur, elapsed, eur, fmtDate, handoverGates, hhmm, hrs, pname, quoteGates, quoteTotals, toMin, useDerived, vehicleLabel } from "./store";
import { type CvrtBooking } from "./fixtures";
import { Avatar, Bar, Btn, CLink, Card, Chip, Empty, Flag, Head, JLink, Metric, Note, Page, RoleHidden, Table, VLink, canSeeMoney } from "./ui";
import { go } from "./nav";

const CV_LABEL: Record<CvrtBooking["status"], [string, "ok" | "warn" | "bad" | undefined]> = {
  scheduled: ["Scheduled", undefined], awaiting_repair: ["Awaiting repair", "bad"], awaiting_retest: ["Awaiting retest", "warn"], completed: ["Completed", "ok"],
};
const cvChip = (t: CvrtBooking) => <Chip tone={t.status === "completed" ? (t.result === "pass" ? "ok" : "bad") : CV_LABEL[t.status][1]}>{CV_LABEL[t.status][0]}{t.status === "completed" && t.result ? ` · ${t.result}` : ""}</Chip>;

/* ═════════════════════════ CVRT ═════════════════════════ */
export function CvrtOverview() {
  const [s, d] = useDerived();
  return (
    <Page>
      <Head title="CVRT today" sub="RSA-authorised test centre. Outcomes are recorded and reviewed by people — an agent never determines or certifies a pass." />
      <div className="d-grid d-g5" style={{ marginBottom: 14 }}>
        <Metric label="Bookings" value={s.cvrt.length} hint="= scheduled + repair + retest + completed" />
        <Metric label="Scheduled" value={d.cvrt.scheduled.length} />
        <Metric label="Awaiting repair" value={d.cvrt.repair.length} tone={d.cvrt.repair.length ? "bad" : undefined} />
        <Metric label="Awaiting retest" value={d.cvrt.retest.length} tone={d.cvrt.retest.length ? "warn" : undefined} />
        <Metric label="Completed" value={d.cvrt.done.length} hint={`${d.cvrt.done.filter(t => t.result === "pass").length} passed`} />
      </div>
      <div className="d-split">
        <Card title="Repair and retest exceptions">{[...d.cvrt.repair, ...d.cvrt.retest].map(t => <div className="d-li" key={t.id}>{cvChip(t)}<b style={{ fontWeight: 500 }}>{t.id}</b><VLink id={t.vehicle} /><span className="d-grow d-muted">{t.failItems?.join(", ")}{t.repairJob ? <> · repair <JLink id={t.repairJob} /></> : null}</span><Btn sm onClick={() => go("CVRT", "repairs")}>Open</Btn></div>)}</Card>
        <Card title="Lanes today">{["Lane 1", "Lane 2"].map(l => <div key={l} style={{ marginBottom: 10 }}><b>{l}</b><div className="d-row" style={{ gap: 5, marginTop: 6 }}>{s.cvrt.filter(t => t.lane === l).sort((a, b) => a.time.localeCompare(b.time)).map(t => <span key={t.id} title={`${t.id} ${cname(t.customer)}`}>{cvChip({ ...t, status: t.status })}</span>)}</div></div>)}
          <Note>Sample 30-minute slots — not statutory test durations.</Note></Card>
      </div>
    </Page>
  );
}
export function CvrtBookings() {
  const [s] = useDerived();
  return (
    <Page><Head title="Bookings" sub="Today's 12 bookings with the responsible person. Slot lengths are sample values." />
      <Card className="flush"><Table rowKey={t => t.id} rows={[...s.cvrt].sort((a, b) => a.time.localeCompare(b.time))} onRow={t => A.open("vehicle", t.vehicle)} cols={[
        { key: "t", label: "Time", render: t => <span className="d-mono">{t.time}</span>, sort: t => t.time },
        { key: "id", label: "Booking", render: t => t.id }, { key: "v", label: "Vehicle", render: t => <VLink id={t.vehicle} /> },
        { key: "c", label: "Customer", render: t => <CLink id={t.customer} />, sort: t => cname(t.customer) }, { key: "l", label: "Lane", render: t => t.lane },
        { key: "o", label: "Responsible", render: t => pname(t.owner) }, { key: "s", label: "Status", render: cvChip, sort: t => t.status },
      ]} /></Card></Page>
  );
}
export function CvrtResults() {
  const [s] = useDerived();
  const recorded = s.cvrt.filter(t => t.result);
  return (
    <Page><Head title="Results" sub="Recorded outcomes with evidence. Pass/fail is entered and reviewed by the CVRT team; a repair completing never changes a result." />
      <Card className="flush"><Table rowKey={t => t.id} rows={recorded} cols={[
        { key: "id", label: "Booking", render: t => t.id }, { key: "v", label: "Vehicle", render: t => <VLink id={t.vehicle} /> }, { key: "c", label: "Customer", render: t => cname(t.customer) },
        { key: "r", label: "Outcome", render: cvChip }, { key: "f", label: "Items", render: t => <span className="d-muted">{t.failItems?.join(", ") ?? "—"}</span> },
        { key: "e", label: "Evidence", render: t => <span className="d-muted">{t.evidence}</span> },
        { key: "a", label: "", render: t => t.status === "awaiting_retest" ? <span className="d-row" style={{ gap: 5 }}><Btn sm onClick={() => A.recordResult(t.id, "pass")}>Record pass</Btn><Btn sm kind="ghost" onClick={() => A.recordResult(t.id, "fail")}>Record fail</Btn></span> : null },
      ]} /></Card>
      <div style={{ marginTop: 10 }}><Note>Recording an outcome writes the reviewer into the evidence and the activity log. Agents can summarise results; they cannot set them.</Note></div>
    </Page>
  );
}
export function CvrtRepairs() {
  const [s] = useDerived();
  const items = s.cvrt.filter(t => t.repairJob && (t.status !== "scheduled"));
  return (
    <Page><Head title="Repair handovers" sub="Failed test → related job → parts → customer update draft → retest. Each step needs its own explicit action." />
      <div className="d-grid">{items.map(t => {
        const j = s.jobs.find(x => x.id === t.repairJob)!;
        const repaired = j.status === "awaiting_qc" || j.status === "completed";
        const steps: [string, boolean, JSX.Element | null][] = [
          ["Test failed", true, <span className="d-muted">{t.failItems?.join(", ")}</span>],
          ["Repair job", true, <><JLink id={j.id} /> <span className="d-muted">{j.complaint}</span></>],
          ["Parts", !j.partBlocker || j.partBlocker.received, j.partBlocker && !j.partBlocker.received ? <><span className="d-muted">{j.partBlocker.part} · ETA {j.partBlocker.eta} · {pname(j.partBlocker.owner)}</span> <Btn sm onClick={() => A.receivePart(j.id)}>Mark received</Btn></> : null],
          ["Repair complete", repaired, !repaired && j.partBlocker?.received ? <Btn sm onClick={() => A.completeRepair(j.id)}>Repair complete (service review)</Btn> : null],
          ["Customer update (draft)", !!s.decisions["cc-" + t.vehicle], t.vehicle === "V008" ? <Btn sm kind="ghost" onClick={() => go("Work", "approvals")}>{s.decisions["cc-V008"] ? "Draft approved — not sent" : "Review draft"}</Btn> : <span className="d-faint">not drafted</span>],
          ["Retest", t.status === "completed" && t.result === "pass", t.status === "awaiting_repair" && repaired ? <Btn sm onClick={() => A.scheduleRetest(t.id)}>Schedule retest</Btn> : t.status === "awaiting_retest" ? <span className="d-row" style={{ gap: 5 }}><span className="d-muted">{t.time}</span><Btn sm onClick={() => A.recordResult(t.id, "pass")}>Record pass</Btn><Btn sm kind="ghost" onClick={() => A.recordResult(t.id, "fail")}>Record fail</Btn></span> : null],
        ];
        return <Card key={t.id} title={<>{t.id} · <VLink id={t.vehicle} /> <span className="d-muted">· {cname(t.customer)}</span></>} aside={cvChip(t)}>
          <div className="d-list">{steps.map(([l, ok, x]) => <div className="d-li" key={l}><Chip tone={ok ? "ok" : undefined}>{ok ? "Done" : "Open"}</Chip><b style={{ fontWeight: 500, width: 170 }}>{l}</b><div className="d-grow d-row" style={{ gap: 6 }}>{x}</div></div>)}</div>
          {t.vehicle === "V008" && <Note>V008's sale handover also waits on documents and accounts. See Sales → Handovers.</Note>}
        </Card>;
      })}</div>
    </Page>
  );
}
export const CVRT_PAGES: Record<string, () => JSX.Element> = { overview: CvrtOverview, bookings: CvrtBookings, results: CvrtResults, repairs: CvrtRepairs };

/* ═════════════════════════ FINANCE ═════════════════════════ */
function AccountsClearance() {
  const [s] = useDerived();
  return <Card title="Accounts clearance for handovers">{Object.keys(s.gates).map(id => <div className="d-li" key={id}><VLink id={id} /><span className="d-grow d-muted">{cname(s.stock.find(v => v.id === id)?.customer)}</span>
    <Chip tone={s.gates[id].accounts ? "ok" : "warn"}>{s.gates[id].accounts ? "Cleared" : "Pending"}</Chip><Btn sm kind="ghost" onClick={() => A.setGate(id, "accounts", !s.gates[id].accounts)}>{s.gates[id].accounts ? "Undo" : "Record clearance (demo review)"}</Btn></div>)}
    <Note>A review action, not a payment receipt. Nothing is posted to Sage or Keyloop.</Note></Card>;
}
export function FinanceOverview() {
  const [s, d] = useDerived();
  if (!canSeeMoney(s)) return <Page><Head title="Finance" /><RoleHidden what="Finance" /></Page>;
  return (
    <Page>
      <Head title="Finance visibility" sub="Two different things, never added together: net values of completed workshop jobs, and imported invoice balances from the sample Sage snapshot." />
      <div className="d-eyebrow" style={{ marginBottom: 8 }}>Workshop pipeline · net values from job records</div>
      <div className="d-grid d-g3" style={{ marginBottom: 18 }}>
        <Metric label="Completed, awaiting invoicing" value={eur(d.completedNet)} hint={`${d.completed.length} jobs`} onClick={() => go("Finance", "readiness")} />
        <Metric label="Invoice-ready" value={eur(d.readyNet)} hint={`${d.ready.length} jobs · not invoiced revenue`} />
        <Metric label="Write-up blocked" value={eur(d.blockedNet)} tone={d.blocked.length ? "warn" : undefined} hint={`${d.blocked.length} jobs`} />
      </div>
      <div className="d-eyebrow" style={{ marginBottom: 8 }}>Imported balances · sample Sage snapshot</div>
      <div className="d-grid d-g3" style={{ marginBottom: 18 }}>
        <Metric label="Outstanding" value={eur(d.receivables)} hint={`${RECEIVABLES.length} invoices`} onClick={() => go("Finance", "receivables")} />
        <Metric label="Overdue" value={eur(d.overdueTotal)} tone="bad" hint={`${d.overdue.length} invoices · aged from 19 Oct`} />
        <Metric label="Exports prepared" value={s.invoiceExports.length} hint="prepared in demo — not posted" />
      </div>
      <AccountsClearance />
    </Page>
  );
}
export function InvoiceReadiness() {
  const [s, d] = useDerived();
  const [sel, setSel] = useState<string[]>([]);
  if (!canSeeMoney(s)) return <Page><Head title="Invoice readiness" /><RoleHidden what="Invoice values" /></Page>;
  const download = (ids: string[]) => {
    const rows = [["Job", "Customer", "Net", "Status"], ...ids.map(id => { const j = s.jobs.find(x => x.id === id)!; return [id, cname(j.customer), String(j.net), "Prepared in demo — not posted to accounting"]; })];
    const blob = new Blob(["# SAMPLE EXPORT — prepared in the Reynolds demo, not posted to accounting\n" + rows.map(r => r.join(",")).join("\n")], { type: "text/csv" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "invoice-export-sample.csv"; a.click();
  };
  return (
    <Page>
      <Head title="Invoice readiness" sub={`${d.completed.length} completed jobs · ${eur(d.completedNet)} net. Ready ${d.ready.length} / ${eur(d.readyNet)} · blocked ${d.blocked.length} / ${eur(d.blockedNet)}.`}>
        <Btn kind="primary" disabled={!sel.length} onClick={() => { A.prepareExport(sel); download(sel); setSel([]); }}>Prepare invoice export ({sel.length})</Btn>
      </Head>
      <Card className="flush"><Table rowKey={j => j.id} rows={d.completed} cols={[
        { key: "x", label: "", render: j => j.invoice === "ready" ? <input type="checkbox" aria-label={`Select ${j.id}`} checked={sel.includes(j.id)} onChange={e => setSel(e.target.checked ? [...sel, j.id] : sel.filter(x => x !== j.id))} /> : null },
        { key: "j", label: "Job", render: j => <JLink id={j.id} /> }, { key: "c", label: "Customer", render: j => cname(j.customer), sort: j => cname(j.customer) },
        { key: "n", label: "Net", num: true, render: j => eur(j.net ?? 0), sort: j => j.net ?? 0 },
        { key: "s", label: "Status", render: j => <Chip tone={j.invoice === "ready" ? "ok" : "warn"}>{s.invoiceExports.includes(j.id) ? "Export prepared" : j.invoice === "ready" ? "Ready" : "Write-up blocked"}</Chip>, sort: j => j.invoice ?? "" },
        { key: "m", label: "Missing evidence", render: j => j.invoice === "blocked" ? <span className="d-muted">{s.jobcards[j.id]?.techConfirmed ? "Service approval" : "Technician confirmation"}</span> : <span className="d-faint">—</span> },
        { key: "r", label: "Reviewer", render: j => j.invoice === "blocked" ? (s.jobcards[j.id]?.techConfirmed ? "Jonathan Keenan" : pname(j.tech)) : "—" },
        { key: "a", label: "", render: j => <Btn sm kind="ghost" onClick={() => go("Workshop", "jobcards")}>Job card</Btn> },
      ]} /></Card>
      <div style={{ marginTop: 10 }}><Note>“Prepare invoice export” creates a local review item and a sample CSV labelled “Prepared in demo — not posted to accounting”. Invoice-ready is not invoiced revenue or cash.</Note></div>
    </Page>
  );
}
export function Receivables() {
  const [s, d] = useDerived();
  if (!canSeeMoney(s)) return <Page><Head title="Receivables" /><RoleHidden what="Receivables" /></Page>;
  return (
    <Page>
      <Head title="Receivables" sub={`Imported total balances from the sample Sage snapshot — ${eur(d.receivables)} outstanding, ${eur(d.overdueTotal)} overdue. Tax/net split is not inferred.`} />
      <Card className="flush"><Table rowKey={r => r.id} rows={RECEIVABLES} cols={[
        { key: "i", label: "Invoice", render: r => r.id }, { key: "c", label: "Customer", render: r => <CLink id={r.customer} /> },
        { key: "a", label: "Balance", num: true, render: r => eur(r.amount), sort: r => r.amount },
        { key: "d", label: "Due", render: r => fmtDate(r.due), sort: r => r.due },
        { key: "g", label: "Aging", render: r => { const n = daysBetween(r.due); return n > 0 ? <Chip tone="bad">{n} days overdue</Chip> : <Chip>Due in {-n} days</Chip>; }, sort: r => daysBetween(r.due) },
        { key: "o", label: "Owner", render: r => pname(r.owner) },
        { key: "f", label: "Follow-up", render: r => s.followUps[r.id] ? <Chip tone="acc">Draft — not sent</Chip> : daysBetween(r.due) > 0 ? <Btn sm onClick={() => A.draftFollowUp(r.id)}>Draft reminder</Btn> : <span className="d-faint">—</span> },
      ]} /></Card>
      {Object.entries(s.followUps).map(([id, txt]) => <Card key={id} style={{ marginTop: 12 }} title={<>Draft reminder · {id} <Chip>not sent</Chip></>}><p style={{ margin: 0 }}>{txt}</p></Card>)}
      <div style={{ marginTop: 14 }}><AccountsClearance /></div>
    </Page>
  );
}
export const FINANCE_PAGES: Record<string, () => JSX.Element> = { overview: FinanceOverview, readiness: InvoiceReadiness, receivables: Receivables };

/* ═════════════════════════ DASHBOARD ═════════════════════════ */
export function DashExecutive() {
  const [s, d] = useDerived();
  const ap = approvals(s, d);
  const v8 = handoverGates(s, "V008");
  return (
    <div className="d-page">
      <div className="d-split">
        <div className="d-grid">
          <Card title={<>Decisions needed <span className="d-muted">({ap.length})</span></>} aside={<Btn sm onClick={() => go("Work", "approvals")}>Approvals</Btn>}>
            {ap.length ? ap.slice(0, 6).map(a => <div className="d-li" key={a.id}><Chip tone="warn">{a.queue}</Chip><span className="d-grow">{a.title}</span><Avatar id={a.reviewer} size={22} /></div>) : <Empty>Nothing waiting.</Empty>}
          </Card>
          <Card title="Labour exceptions" aside={<span className="d-muted">today, live</span>}>
            {d.gaps.map(g => <div className="d-li" key={g.id}><Chip tone="bad">Gap</Chip><span className="d-grow">{pname(g.id)} unallocated since {g.since} · {dur(g.gapMin ?? 0)}</span></div>)}
            {d.budgetFlags.map(f => <div className="d-li" key={f.j.id}><Chip tone="warn">Budget</Chip><span className="d-grow">{pname(f.j.tech)} · {f.j.id} at {elapsed(f.j, s.clock)}/{f.j.budgetMin} min</span></div>)}
            {!d.gaps.length && !d.budgetFlags.length && <Empty>No live labour exceptions.</Empty>}
            <div className="d-divider" />
            <div className="d-muted">Friday 16 Oct (complete day): {hrs(d.fri.unallocated)} unallocated{canSeeMoney(s) ? ` · ${eur(d.fri.unallocated * 80)} potential billing equivalent — investigate` : ""}.</div>
          </Card>
        </div>
        <div className="d-grid">
          {canSeeMoney(s) && <Card title="Invoicing readiness"><Bar parts={[[d.readyNet, "var(--ok)", "Ready"], [d.blockedNet, "var(--warn)", "Blocked"]]} /><div className="d-muted" style={{ marginTop: 8 }}>{eur(d.readyNet)} ready · {eur(d.blockedNet)} blocked · {eur(d.completedNet)} completed (net)</div></Card>}
          <Card title="Handover blockers">{v8.ready ? <Flag tone="ok">V008 gates clear.</Flag> : <><b>V008</b> <span className="d-muted">· Midlands Parcel Services</span>{v8.list.filter(x => !x.ok).map(x => <div className="d-li" key={x.key}><Chip tone="bad">Open</Chip><span className="d-grow">{x.label}</span><span className="d-muted">{pname(x.owner)}</span></div>)}</>}</Card>
          <Card title="Incoming vehicles">{d.incoming.filter(v => (v.eta ?? "") <= "2026-10-31").map(v => <div className="d-li" key={v.id}><VLink id={v.id} /><span className="d-grow d-muted">{v.model} {v.variant}</span><span className="d-mono">{v.eta ? fmtDate(v.eta) : ""}</span></div>)}</Card>
        </div>
      </div>
    </div>
  );
}
export function DashWorkshop() {
  const [s, d] = useDerived();
  return (
    <div className="d-page"><div className="d-grid d-g2">
      <Card title="Friday 16 Oct · labour reconciliation" aside={<Chip>complete day</Chip>}>
        <Bar parts={[[d.fri.job, "var(--accent)", "Job"], [d.fri.breaks, "var(--track)", "Breaks"], [d.fri.internal, "#9fd6f0", "Internal"], [d.fri.explained, "#c8b4f0", "Reviewed"], [d.fri.unallocated, "var(--bad)", "Unallocated"]]} />
        <dl className="d-kv" style={{ marginTop: 12 }}><dt>Paid attendance</dt><dd>{hrs(d.fri.paid)}</dd><dt>Job-allocated</dt><dd>{hrs(d.fri.job)}</dd><dt>Breaks</dt><dd>{hrs(d.fri.breaks)}</dd><dt>Internal</dt><dd>{hrs(d.fri.internal)}</dd>{d.fri.explained > 0 && <><dt>Reviewed, explained</dt><dd>{hrs(d.fri.explained)}</dd></>}<dt>Unallocated</dt><dd>{hrs(d.fri.unallocated)}</dd>
          <dt>Allocation rate</dt><dd title="Job hours ÷ (paid − breaks)">{(d.allocationRate * 100).toFixed(1)}% <span className="d-faint">= 94.0 ÷ (120.0 − 7.5)</span></dd></dl>
      </Card>
      <Card title={`Monday 19 Oct · live to ${hhmm(s.clock)}`} aside={<Chip>partial day</Chip>}>
        <Bar parts={[[d.counts.onJob, "var(--accent)", "On job"], [d.counts.unallocated, "var(--bad)", "Unallocated"], [d.counts.absent, "var(--track)", "Absent"], [d.counts.training, "#9fd6f0", "Training"]]} />
        <div className="d-muted" style={{ margin: "8px 0 12px" }}>{d.counts.onJob} on job · {d.counts.unallocated} unallocated · {d.counts.absent} absent · {d.counts.training} training = 15</div>
        <b>Budget warnings</b>{d.budgetFlags.length ? d.budgetFlags.map(f => <div className="d-li" key={f.j.id}><JLink id={f.j.id} /><span className="d-grow d-muted">{pname(f.j.tech)} · {cname(f.j.customer)}</span><span className="d-mono">{elapsed(f.j, s.clock)}/{f.j.budgetMin} min</span></div>) : <div className="d-muted">None</div>}
        <Note>Friday's full day and Monday's partial day are never compared directly. No productivity score is shown.</Note>
      </Card>
    </div></div>
  );
}
export function DashSalesStock() {
  const [s, d] = useDerived();
  const stages = ["Enquiry", "Quoted", "Approval", "Reserved", "Won"].map(st => ({ st, qs: s.quotes.filter(q => q.stage === st) }));
  return (
    <div className="d-page"><div className="d-grid d-g2">
      <Card title="Active stock composition"><Bar parts={[[d.available.length, "var(--ok)", "Available"], [d.reserved.length, "var(--accent)", "Reserved"], [d.preparation.length, "var(--warn)", "Prep"], [d.incoming.length, "var(--track)", "Incoming"]]} />
        <div className="d-muted" style={{ marginTop: 8 }}>{d.active.length} active = {d.onSite.length} on site + {d.incoming.length} incoming · {d.sold.length} sold archived</div></Card>
      <Card title="Document coverage"><Bar parts={[[d.active.length - d.missingSpec.length, "var(--ok)", "Approved"], [d.missingSpec.length, "var(--bad)", "Missing"]]} /><div className="d-muted" style={{ marginTop: 8 }}>{d.missingSpec.length} active vehicles without an approved spec</div></Card>
      <Card title="Quote stages (net values)">{stages.map(x => <div className="d-li" key={x.st}><span style={{ width: 90 }}>{x.st}</span><span className="d-grow d-muted">{x.qs.length} quotes</span><span className="d-mono">{eur(x.qs.reduce((t, q) => t + quoteTotals(q).net, 0))}</span></div>)}</Card>
      <Card title="Follow-ups and arrivals">{s.tasks.filter(t => t.dept === "Sales" && t.status === "open").map(t => <div className="d-li" key={t.id}><Chip tone="warn">{t.due}</Chip><span className="d-grow">{t.title}</span></div>)}
        {d.incoming.slice(0, 4).map(v => <div className="d-li" key={v.id}><VLink id={v.id} /><span className="d-grow d-muted">arrives</span><span className="d-mono">{v.eta ? fmtDate(v.eta) : ""}</span></div>)}
        <Note>Q-1042 status: {quoteGates(s, s.quotes[0]).ready ? "ready for customer" : "gates open"}.</Note></Card>
    </div></div>
  );
}
export function DashHandover() {
  const [s] = useDerived();
  const ids = Object.keys(s.gates).filter(id => !s.gates[id].handedOver);
  const gateNames = ["Parts", "Repair readiness", "CVRT result", "Documents", "Accounts clearance"];
  return (
    <div className="d-page">
      <Card className="flush" title={undefined}><div style={{ padding: "14px 16px 4px" }}><b>Handovers in progress — current workload</b> <span className="d-muted">(no historical completion times are seeded, so none are shown)</span></div>
        <Table rowKey={id => id} rows={ids} onRow={id => A.open("vehicle", id)} cols={[
          { key: "v", label: "Vehicle", render: id => <b>{id}</b> }, { key: "c", label: "Customer", render: id => cname(s.stock.find(v => v.id === id)?.customer) },
          ...gateNames.map(gn => ({ key: gn, label: gn, render: (id: string) => { const g = handoverGates(s, id).list.find(x => x.label === gn); return g ? <Chip tone={g.ok ? "ok" : "bad"}>{g.ok ? "Clear" : pname(g.owner).split(" ")[0]}</Chip> : <span className="d-faint">n/a</span>; } })),
          { key: "age", label: "Oldest blocker", render: id => id === "V008" ? `since 09:30 · ${dur(s.clock - toMin("09:30"))}` : id === "V014" ? "since 8 Oct" : "—" },
        ]} />
      </Card>
    </div>
  );
}
export const DASH_PAGES: Record<string, () => JSX.Element> = { executive: DashExecutive, workshop: DashWorkshop, salesstock: DashSalesStock, handover: DashHandover };
export { vehicleLabel };
