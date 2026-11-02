/* Vehicle page tabs, part 1: Overview, Customer, Keyloop, Workshop. */
import { useState, type ReactNode } from "react";
import { A, company, daysBetween, elapsed, eur, handoverGates, pname, techNow, vehicleLabel, type State } from "../store";
import { Avatar, Btn, Card, Chip, CLink, Empty, Flag, JLink, JobChip, Plate, VLink } from "../ui";
import { KeyloopBadge } from "../keyloop";
import { go } from "../nav";
import { ANPR_EVENTS, BLOCKED, COMMS, KEYLOOP, STATUS, agoText, commsFor, dayOf, financeFor, fmtEntered, fmtWhen, keyloopFor, noticeMessage, noticeState, openVehicle, yardVehicles } from "../yard";
import { SERVICE_VEHICLES } from "../fixtures";
import { Dot } from "./bits";
import { linkedRecords, partShort, type LinkKind, type LinkNode, type Subject, type Target } from "./model";

export interface TabProps { s: State; sub: Subject; setTab: (t: string) => void; startDraft: () => void; docCount: number }

const KIND_ORDER: LinkKind[] = ["VEHICLE", "CUSTOMER", "JOB", "TECHNICIAN", "PART", "PO", "SUPPLIER", "COMMUNICATION", "INVOICE", "CVRT", "DOCUMENT"];

function openTarget(t: Target, setTab: (t: string) => void) {
  if (t.t === "company") A.open("company", t.id);
  else if (t.t === "job") A.open("job", t.id);
  else if (t.t === "tab") { setTab(t.tab); window.scrollTo({ top: 0 }); }
}

export function LinkedRecords({ nodes, setTab }: { nodes: LinkNode[]; setTab: (t: string) => void }) {
  return (
    <div className="v-links">
      {KIND_ORDER.map(k => {
        const items = nodes.filter(n => n.kind === k);
        return (
          <div key={k} className={"v-linkcol " + (items.length ? "" : "empty")}>
            <div className="d-eyebrow">{k}</div>
            <div className="v-linkitems">
              {items.length ? items.map((n, i) => n.target.t === "none"
                ? <span key={i} className="v-node static" title={n.hint}>{n.label}</span>
                : <button key={i} className="v-node" title={n.hint ?? "Open"} onClick={() => openTarget(n.target, setTab)}>{n.label}{n.hint && <small>{n.hint}</small>}</button>)
                : <span className="d-faint v-none">None</span>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

const Row = ({ k, children }: { k: string; children: ReactNode }) => <><dt>{k}</dt><dd>{children}</dd></>;

/* ── release / accounts panel (shown on the page and in Finance) ─────── */
export function ReleasePanel({ s, sub, onClear }: { s: State; sub: Subject; onClear: (kind: "release" | "clearance") => void }) {
  const v = sub.v;
  if (!v) return null;
  if (s.yard.released.includes(v.key)) {
    return <div className="v-release ok"><div><div className="v-release-t">RELEASE CLEARED</div><div className="v-release-s">Accounts approval recorded. The vehicle can leave. No payment was moved in this demo.</div></div></div>;
  }
  const gates = s.gates[v.key] ? handoverGates(s, v.key) : null;
  const claim = commsFor(s, v.key).find(c => c.type === "Release request");
  if (v.accounts === "hold") {
    return (
      <div className="v-release bad" role="alert">
        <div className="v-release-main">
          <div className="v-release-t">VEHICLE RELEASE BLOCKED</div>
          <div className="v-release-s">{v.blocker ?? "Accounts approval is required before this vehicle can leave."}</div>
          <dl className="v-release-kv"><div><dt>Balance</dt><dd>{eur(v.balance)}</dd></div><div><dt>Reason</dt><dd>Overdue balance, accounts approval required</dd></div><div><dt>Approver</dt><dd>Caroline Glynn, Financial Controller</dd></div></dl>
          {claim && <div className="v-claim"><b>Customer says:</b> "{claim.text}" <span className="d-muted">{claim.from}, {claim.channel}, {claim.at}.{claim.extracted?.find(e => e.field === "Claim") ? ` ${claim.extracted.find(e => e.field === "Claim")!.value}.` : ""}</span></div>}
        </div>
        <Btn kind="primary" onClick={() => onClear("release")}>Accounts approve release</Btn>
      </div>
    );
  }
  if (gates && !gates.ready) {
    const accOpen = gates.list.find(g => g.key === "accounts" && !g.ok);
    return (
      <div className="v-release bad" role="alert">
        <div className="v-release-main">
          <div className="v-release-t">VEHICLE RELEASE BLOCKED</div>
          <div className="v-release-s">Each gate is separate. A repair finishing does not pass the test.</div>
          <div className="v-gates">{gates.list.map(g => <span key={g.key} className={"v-gate " + (g.ok ? "ok" : "open")} title={g.detail}><Dot tone={g.ok ? "ok" : "bad"} />{g.label}<small>{g.ok ? "Clear" : pname(g.owner)}</small></span>)}</div>
        </div>
        {accOpen && <Btn onClick={() => onClear("clearance")}>Record accounts clearance</Btn>}
      </div>
    );
  }
  return null;
}

export function UnmatchedPanel({ sub, onMatch }: { sub: Subject; onMatch: () => void }) {
  const v = sub.v;
  if (!v?.unresolved) return null;
  const ev = v.anprId ? ANPR_EVENTS.find(e => e.id === v.anprId) : undefined;
  const sug = ev?.suggestion ? SERVICE_VEHICLES.find(x => x.id === ev.suggestion!.key) : undefined;
  return (
    <div className="v-release warn" role="alert">
      <div className="v-release-main">
        <div className="v-release-t">NEEDS A PERSON</div>
        <div className="v-release-s">{ev ? `ANPR read ${ev.read} at ${ev.confidence}% confidence. ${ev.note ?? ""}` : "This vehicle is not matched to a customer or a Keyloop record."}</div>
        {ev?.suggestion && <div className="v-release-s d-muted">Closest known vehicle: {ev.suggestion.why}.</div>}
      </div>
      <div className="d-row">
        {sug && <Btn kind="primary" onClick={onMatch}>Match to {sug.reg}</Btn>}
        <Btn kind="ghost" onClick={() => go("Yard", "anpr")}>Open ANPR events</Btn>
      </div>
    </div>
  );
}

/* ── OVERVIEW ────────────────────────────────────────────────────────── */
const todoTag = (s: State, sub: Subject, item: string, idx: number): { tone: "warn" | "bad"; text: string } | null => {
  const v = sub.v!;
  if (v.part?.stalled && idx === 0) return { tone: "warn", text: `Waiting for ${partShort(v.part.part)}` };
  if (v.accounts === "hold" && /accounts/i.test(item)) return { tone: "bad", text: "Blocked" };
  if (v.status === "waiting_approval" && /approval/i.test(item)) return { tone: "warn", text: "Waiting for customer" };
  if (s.gates[v.key] && /accounts clearance|retest/i.test(item)) return { tone: "warn", text: "Gate open" };
  return null;
};

export function OverviewTab(p: TabProps) {
  const { s, sub, setTab } = p;
  const v = sub.v;
  if (!v) return <OffSiteOverview {...p} />;
  const done = v.row.done, todo = v.row.todo, total = done.length + todo.length, pct = total ? Math.round((done.length / total) * 100) : 0;
  const j = v.job;
  const hard = BLOCKED.includes(v.status) || v.status === "unknown";
  const people: { id: string | null; name: string; role: string }[] = [];
  const add = (id: string | null | undefined, role: string) => { if (id && !people.some(x => x.id === id && x.role === role)) people.push({ id, name: pname(id), role }); };
  add(j?.tech, "Technician");
  if (v.part) add(v.part.owner, "Owns the part order");
  if (v.accounts !== "clear") add("p-caroline", "Accounts approval");
  if (s.gates[v.key]) handoverGates(s, v.key).list.filter(g => !g.ok).forEach(g => add(g.owner, `${g.label} gate`));
  const nodes = linkedRecords(s, sub, p.docCount);
  const co = company(v.customerId);
  return (
    <div className="v-stack">
      {v.status === "ready" ? <Flag tone="ok"><b>Nothing is blocking this vehicle.</b> {v.row.todo.length ? `Left to do: ${v.row.todo.join(", ").toLowerCase()}.` : ""}</Flag>
        : v.blocker ? <Flag tone={hard ? "bad" : undefined}><b>Main blocker.</b> {v.blocker}</Flag> : <Flag tone="ok"><b>No blocker recorded.</b> Work is progressing.</Flag>}
      <div className="v-grid2">
        <Card title="Progress" aside={<span className="d-muted">{done.length} of {total} steps</span>}>
          <div className="v-prog" role="img" aria-label={`${pct}% of steps done`}><span style={{ width: pct + "%" }} /></div>
          <div className="v-cols">
            <div>
              <div className="d-eyebrow">Work done</div>
              {done.length ? <ul className="v-check done">{done.map(x => <li key={x}>{x}</li>)}</ul> : <p className="d-muted v-empty-line">Nothing recorded yet.</p>}
            </div>
            <div>
              <div className="d-eyebrow">Still to do</div>
              {todo.length ? <ul className="v-check todo">{todo.map((x, i) => { const tg = todoTag(s, sub, x, i); return <li key={x}>{x}{tg && <Chip tone={tg.tone}>{tg.text}</Chip>}</li>; })}</ul> : <p className="d-muted v-empty-line">Nothing left.</p>}
            </div>
          </div>
        </Card>
        <Card title="Who is responsible">
          {people.length ? <div className="d-list">{people.map(x => <div className="d-li" key={x.id + x.role}><Avatar id={x.id} size={30} /><div className="d-grow"><b className="v-b">{x.name}</b><div className="d-muted">{x.role}</div></div></div>)}</div> : <p className="d-muted v-empty-line">Nobody is assigned yet.</p>}
          {co && <div className="d-li v-contact"><span className="d-avatar" style={{ background: "var(--track)", color: "var(--ink)" }} aria-hidden>{co.contact.split(" ").map(x => x[0]).join("").slice(0, 2)}</span><div className="d-grow"><b className="v-b">{co.contact}</b><div className="d-muted">Customer contact, {co.name}</div></div></div>}
          <div className="d-note v-lastnote"><span>Last update: {v.last.who === v.last.channel ? v.last.who : `${v.last.who}, ${v.last.channel}`}, {agoText(v.last.minsAgo)}. {v.last.text}</span></div>
        </Card>
      </div>
      <Card title="Key facts">
        <dl className="d-kv v-facts">
          <Row k="Reason">{v.row.reason.charAt(0).toUpperCase() + v.row.reason.slice(1)}</Row>
          <Row k="Location">{v.location}</Row>
          <Row k="Arrived">{fmtEntered(v.arrived)} <span className="d-faint">({daysBetween(dayOf(v.arrived)) === 0 ? "today" : `${daysBetween(dayOf(v.arrived))} days on site`})</span></Row>
          <Row k="Stays overnight">{v.overnight ? "Yes" : "No"}</Row>
          <Row k="Promised">{v.promised ? fmtWhen(v.promised, true) : "Not set"}</Row>
          <Row k="Job">{v.jobId ? <JLink id={v.jobId} /> : "None"}</Row>
          <Row k="Part">{v.part ? `${partShort(v.part.part)}, ${v.part.po}, ETA ${v.part.eta}` : "None outstanding"}</Row>
          <Row k="Accounts">{v.accounts === "hold" ? <Chip tone="bad">{eur(v.balance)} on hold</Chip> : v.accounts === "review" ? <Chip tone="warn">Clearance outstanding</Chip> : <Chip tone="ok">Clear</Chip>}</Row>
          <Row k="Customer updated">{v.row.customerUpdated ?? "No update recorded"}</Row>
        </dl>
      </Card>
      <Card title="Linked records" aside={<span className="d-muted">Every record points to the others</span>}><LinkedRecords nodes={nodes} setTab={setTab} /></Card>
    </div>
  );
}

function OffSiteOverview({ s, sub, setTab, docCount }: TabProps) {
  const n = sub.notice, st = sub.stock;
  const ns = n ? noticeState(s, n) : null;
  const gates = st && s.gates[sub.key] ? handoverGates(s, sub.key) : null;
  return (
    <div className="v-stack">
      <Flag><b>{st ? "Dealership stock." : "Not on site."}</b> {st ? `Status ${st.status}${st.status === "incoming" ? `, due ${st.eta ?? "to be confirmed"}` : `, at ${st.location}`}. It is not in the service yard.` : "This vehicle has no ANPR read in the yard."}</Flag>
      {n && ns && (
        <Card title="Renault notice" aside={<Chip tone={ns.stage === "booked" ? "ok" : ns.stage === "new" ? "acc" : "warn"}>{ns.stage === "new" ? "New" : ns.stage === "contacted" ? "Customer contacted" : ns.stage === "awaiting" ? "Awaiting response" : "Booked"}</Chip>}>
          <dl className="d-kv v-facts">
            <Row k="Notice">{n.id} from Renault Trucks Ireland</Row><Row k="Type">{n.kind}</Row><Row k="Due">{fmtWhen(n.due, true)}</Row><Row k="Received">{fmtWhen(n.received)}</Row>
            <Row k="Customer channel">{n.channel}</Row>{ns.bookedFor && <Row k="Booked for">{fmtWhen(ns.bookedFor, true)}</Row>}
          </dl>
          {ns.stage !== "booked" && <div className="v-quote"><div className="d-eyebrow">Suggested message (needs approval)</div>{ns.message ?? noticeMessage(n)}</div>}
          <div className="d-row" style={{ marginTop: 12 }}><Btn sm onClick={() => go("Inspections", "notices")}>Open in Inspections</Btn></div>
        </Card>
      )}
      {gates && <Card title="Release gates">{gates.list.map(g => <div className="d-li" key={g.key}><Chip tone={g.ok ? "ok" : "bad"}>{g.ok ? "Clear" : "Open"}</Chip><div className="d-grow"><b className="v-b">{g.label}</b> <span className="d-muted">{g.detail}</span></div><Avatar id={g.owner} size={22} /></div>)}</Card>}
      {st && <Card title="Stock record"><dl className="d-kv v-facts"><Row k="Stock id">{st.id}</Row><Row k="Order ref">{st.svo}</Row><Row k="Colour">{st.colour} <span className="d-faint">(sample data)</span></Row><Row k="Location">{st.location}</Row><Row k="Specification">{st.specStatus}</Row><Row k="Workshop job">{st.jobRef ? <JLink id={st.jobRef} /> : "None"}</Row></dl></Card>}
      {sub.past.length > 0 && <Card title="Past jobs">{sub.past.map(x => <div className="d-li" key={x.id}><JLink id={x.id} /><span className="d-grow d-muted">{x.complaint}</span><span className="d-muted">{fmtWhen(x.doneAt)}</span></div>)}</Card>}
      {!n && !st && sub.past.length === 0 && <Empty>No notice, job or message is open for this vehicle.</Empty>}
      <Card title="Linked records"><LinkedRecords nodes={linkedRecords(s, sub, docCount)} setTab={setTab} /></Card>
    </div>
  );
}

/* ── CUSTOMER ────────────────────────────────────────────────────────── */
export function CustomerTab({ s, sub, startDraft }: TabProps) {
  const v = sub.v;
  const cid = sub.id.customerId;
  const co = company(cid);
  const fin = financeFor(s, sub.key);
  const others = cid ? yardVehicles(s).filter(x => x.customerId === cid && x.key !== sub.key) : [];
  const fleet = cid ? SERVICE_VEHICLES.filter(x => x.customer === cid).length : 0;
  const msgs = cid ? COMMS.filter(c => c.customer === cid) : [];
  const ev = v?.anprId ? ANPR_EVENTS.find(e => e.id === v.anprId) : undefined;
  if (!co) {
    return (
      <div className="v-stack">
        <Flag tone="bad"><b>No customer matched.</b> {ev ? `ANPR read ${ev.read} at ${ev.confidence}% confidence.` : "Nobody has claimed this vehicle yet."}</Flag>
        {ev?.suggestion && (
          <Card title="Closest known vehicle">
            <p className="d-muted" style={{ margin: "0 0 10px" }}>{ev.suggestion.why}. Confidence {ev.suggestion.confidence}%. {ev.note}</p>
            <div className="d-row"><Btn kind="primary" onClick={() => A.anprMatch(ev.id, ev.suggestion!.key)}>Match to {SERVICE_VEHICLES.find(x => x.id === ev.suggestion!.key)?.reg}</Btn><Btn kind="ghost" onClick={() => go("Yard", "anpr")}>Open ANPR events</Btn></div>
          </Card>
        )}
        {!ev?.suggestion && <Empty>No candidate vehicle. Review it on the ANPR Events page.</Empty>}
      </div>
    );
  }
  return (
    <div className="v-stack">
      <div className="v-grid2">
        <Card title="Contact" aside={<Chip tone="acc">Prefers {co.channel ?? "email"}</Chip>}>
          <dl className="d-kv v-facts">
            <Row k="Customer"><CLink id={co.id} /></Row><Row k="Type">{co.type}</Row><Row k="Contact">{co.contact}</Row>
            <Row k="Phone">{co.phone ?? "Not on file"}</Row><Row k="Email">{co.email}</Row><Row k="Channel preference">{co.channel ?? "Email"}</Row>
          </dl>
          <div className="d-row" style={{ marginTop: 12 }}><Btn sm onClick={startDraft}>Update customer</Btn></div>
        </Card>
        <Card title="Account" aside={<KeyloopBadge />}>
          <dl className="d-kv v-facts">
            <Row k="Keyloop account">{co.account ?? "Not on file"}</Row>
            <Row k="Balance">{eur(fin.outstanding)}</Row>
            <Row k="Overdue">{fin.overdue > 0 ? <Chip tone="bad">{eur(fin.overdue)}</Chip> : <Chip tone="ok">None</Chip>}</Row>
            <Row k="Fleet with Reynolds">{fleet} vehicle{fleet === 1 ? "" : "s"}</Row>
            <Row k="Messages">{msgs.length} on file across all vehicles</Row>
          </dl>
        </Card>
      </div>
      <Card title={`Other vehicles on site (${others.length})`}>
        {others.length ? <div className="d-list">{others.map(o => <div className="d-li" key={o.key}><Plate reg={o.reg} /><button className="d-link" onClick={() => openVehicle(o.key)}>{o.model}</button><span className="d-grow" /><Chip tone={STATUS[o.status].tone}>{STATUS[o.status].short}</Chip></div>)}</div>
          : <p className="d-muted v-empty-line">No other vehicles for {co.name} are on site.</p>}
      </Card>
    </div>
  );
}

/* ── KEYLOOP ─────────────────────────────────────────────────────────── */
export function KeyloopTab({ s, sub }: TabProps) {
  const kl = keyloopFor(s, sub.key);
  const v = sub.v;
  const j = sub.jobs[0];
  const arr = ANPR_EVENTS.find(e => e.key === sub.key || (v?.anprId && e.id === v.anprId));
  const wa = commsFor(s, sub.key).filter(c => c.channel === "WhatsApp");
  const em = commsFor(s, sub.key).filter(c => c.channel === "Email");
  const log = s.yard.keyloopLog.filter(l => l.text.includes(sub.key) || (sub.jobs.some(x => l.text.includes(x.id))) || l.text.includes(sub.id.reg)).slice(0, 5);
  const adds: { cap: string; kl: string; pulse: string }[] = [
    { cap: "ANPR", kl: "No gate data", pulse: arr ? `Read ${arr.read} at ${arr.confidence}% on ${arr.camera}, ${arr.day === "Today" ? "today" : arr.day} ${arr.at}` : v ? `Entered the yard ${fmtEntered(v.arrived)}` : "No read on record" },
    { cap: "WhatsApp", kl: "Not captured", pulse: wa.length ? `${wa.length} message${wa.length === 1 ? "" : "s"} matched, latest from ${wa[wa.length - 1].from}` : "None matched to this vehicle" },
    { cap: "Email", kl: "Not captured", pulse: em.length ? `${em.length} email${em.length === 1 ? "" : "s"} matched` : "None matched to this vehicle" },
    { cap: "Renault notices", kl: "Not received", pulse: sub.notice ? `${sub.notice.kind} notice ${sub.notice.id}, due ${fmtWhen(sub.notice.due)}` : "No open notice" },
    { cap: "Parts ETA", kl: j?.partBlocker?.po ? `${j.partBlocker.po} raised` : "No open PO", pulse: j?.partBlocker && !j.partBlocker.received ? `${partShort(j.partBlocker.part)} due ${j.partBlocker.eta}, owner ${pname(j.partBlocker.owner)}` : "Nothing outstanding" },
    { cap: "Workshop clocking", kl: j ? `${j.id} status` : "No live job", pulse: j && j.status === "in_progress" ? `${elapsed(j, s.clock)} of ${j.budgetMin} min used, live` : j ? "Not on the clock" : "Not applicable" },
  ];
  return (
    <div className="v-stack">
      <Card title="Keyloop record" aside={<span className="d-row"><Chip tone="ok">Connected</Chip><KeyloopBadge mins={kl.syncedMinsAgo} /></span>}>
        <p className="d-muted" style={{ margin: "0 0 12px" }}>Keyloop is the system of record for this vehicle, customer, job, parts and invoices. Pulse reads it and adds what Keyloop does not hold.</p>
        <div className="v-ids">
          <div><div className="d-eyebrow">Vehicle record</div><div className="v-id">{kl.vehicleRecord}</div></div>
          <div><div className="d-eyebrow">Customer account</div><div className="v-id">{kl.account}</div></div>
          <div><div className="d-eyebrow">Job</div><div className="v-id">{kl.jobRef}</div></div>
          <div><div className="d-eyebrow">Records synced today</div><div className="v-id">{KEYLOOP.recordsToday.toLocaleString("en-IE")}</div></div>
        </div>
        <div className="d-scroll" style={{ marginTop: 12 }}>
          <table className="d-table"><thead><tr><th>Field</th><th>Value in Keyloop</th></tr></thead>
            <tbody>{kl.fields.map(([k, val]) => <tr key={k}><td className="d-muted">{k}</td><td>{val}</td></tr>)}</tbody></table>
        </div>
      </Card>
      <Card title="Two-way sync" aside={<Btn sm onClick={A.keyloopSync}>Sync now</Btn>}>
        <div className="v-grid2">{KEYLOOP.twoWay.map(t => <div key={t.text} className="kl-flow"><b>{t.from}</b><span aria-hidden>→</span><b>{t.to}</b><div className="d-muted">{t.text}</div></div>)}</div>
        <div className="d-eyebrow" style={{ margin: "14px 0 6px" }}>Recent sync activity for this vehicle</div>
        {log.length ? <div className="d-list">{log.map((l, i) => <div key={i} className="d-li"><span className="d-mono d-faint" style={{ width: 42 }}>{l.at}</span><Chip tone={l.dir === "Pulse to Keyloop" ? "acc" : undefined}>{l.dir}</Chip><span className="d-grow d-muted">{l.text}</span></div>)}</div>
          : <p className="d-muted v-empty-line">No sync events for this record today.</p>}
        <div className="d-note" style={{ marginTop: 12 }}><span>{KEYLOOP.note}</span></div>
      </Card>
      <Card title="What Pulse added on top of Keyloop">
        <div className="d-scroll">
          <table className="d-table"><thead><tr><th>Source</th><th>Keyloop alone</th><th>With Pulse</th></tr></thead>
            <tbody>{adds.map(a => <tr key={a.cap}><td><b className="v-b">{a.cap}</b></td><td className="d-muted">{a.kl}</td><td>{a.pulse}</td></tr>)}</tbody></table>
        </div>
      </Card>
    </div>
  );
}

/* ── WORKSHOP ────────────────────────────────────────────────────────── */
const STATUS_OPTS: [string, string][] = [["queued", "Queued"], ["in_progress", "In progress"], ["awaiting_parts", "Awaiting parts"], ["awaiting_qc", "Awaiting QC"], ["completed", "Completed"]];

function Budget({ s, used, budget }: { s: State; used: number; budget: number }) {
  const pct = (used / budget) * 100, shown = Math.round(pct * 10) / 10;
  const t = pct >= s.rules.over ? "bad" : pct >= s.rules.warn ? "warn" : "ok";
  return (
    <div className="v-budget">
      <div className="v-budget-top"><span><b className="v-big">{used}</b> <span className="d-muted">of {budget} min</span></span><Chip tone={t === "ok" ? "ok" : t}>{shown}% of budget</Chip></div>
      <div className="v-meter" role="img" aria-label={`${shown}% of time budget used`}>
        <span className={t} style={{ width: Math.min(100, pct) + "%" }} /><i style={{ left: s.rules.warn + "%" }} title={`Warning at ${s.rules.warn}%`} />
      </div>
      <div className="d-muted v-meter-note">Percentage of the approved time budget used, not percentage of work complete. Warning at {s.rules.warn}%.</div>
      {t !== "ok" && <Flag tone={t === "bad" ? "bad" : undefined}><b>{t === "bad" ? "Over time budget." : "Time budget warning triggered."}</b> {used} of {budget} minutes used ({shown}%). Ops Watchdog flagged it for the service manager.</Flag>}
    </div>
  );
}

export function WorkshopTab({ s, sub }: TabProps) {
  const [pick, setPick] = useState<string>("");
  const j = sub.jobs[0];
  const v = sub.v;
  if (!j) return <Empty>{v?.past ? `No live job. Last job ${v.past.id} was completed ${fmtWhen(v.past.doneAt)}.` : "No workshop job is open for this vehicle."}</Empty>;
  const used = elapsed(j, s.clock);
  const tn = j.tech ? techNow(s, j.tech) : null;
  const next = tn?.next && tn.next.id !== j.id ? tn.next : undefined;
  return (
    <div className="v-stack">
      <Card title={<span className="d-row"><span>Current job card</span><JLink id={j.id} /></span>} aside={<JobChip j={j} />}>
        <p style={{ margin: "0 0 12px" }}>{j.complaint}</p>
        <div className="v-grid2">
          <dl className="d-kv v-facts">
            <Row k="Technician">{j.tech ? <span className="d-row" style={{ gap: 8 }}><Avatar id={j.tech} size={22} />{pname(j.tech)}</span> : "Unassigned"}</Row>
            <Row k="Bay">{v?.location ?? sub.stock?.location ?? "Not on site"}</Row>
            <Row k="Work type">{j.workType}</Row>
            <Row k="Started">{j.status === "in_progress" && j.start ? `Clocked on at ${j.start}` : j.plannedStart ? `Planned ${j.plannedStart}, not yet on the clock` : "Not clocked on"}</Row>
            {j.partBlocker && !j.partBlocker.received && <Row k="Waiting for"><Chip tone="warn">{partShort(j.partBlocker.part)}</Chip> ETA {j.partBlocker.eta}</Row>}
          </dl>
          <div>
            <div className="d-eyebrow">Time budget against actual</div>
            {j.status === "queued" ? <p className="d-muted v-empty-line">Budget {j.budgetMin} min. Scheduling does not start the clock.</p> : <Budget s={s} used={used} budget={j.budgetMin} />}
          </div>
        </div>
      </Card>
      <div className="v-grid2">
        <Card title="Planned next steps">
          {v?.row.todo.length ? <ol className="v-steps">{v.row.todo.map(x => <li key={x}>{x}</li>)}</ol> : <p className="d-muted v-empty-line">No steps left on this vehicle.</p>}
          {next && <div className="d-note v-lastnote"><span>{j.tech ? pname(j.tech) : "Technician"} is next on {next.id} at {next.plannedStart}, {vehicleLabel(s, next.vehicle).reg}.</span></div>}
        </Card>
        <Card title="Job status" aside={<KeyloopBadge label="WRITES TO" />}>
          <p className="d-muted" style={{ margin: "0 0 10px" }}>Change the status here and Pulse writes it back to the Keyloop job.</p>
          <div className="d-row">
            <select className="d-select" aria-label="Job status" value={pick || j.status} onChange={e => setPick(e.target.value)}>{STATUS_OPTS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
            <Btn sm disabled={!pick || pick === j.status} onClick={() => { A.setJobStatus(j.id, pick as typeof j.status); setPick(""); }}>Update status</Btn>
          </div>
        </Card>
      </div>
    </div>
  );
}
