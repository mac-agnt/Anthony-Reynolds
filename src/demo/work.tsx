import { useEffect, useState, type ReactNode } from "react";
import { A, approvals, blocksFor, cname, dur, elapsed, eur, handoverGates, hhmm, pname, quoteGates, techNow, techs, toMin, useDerived, vehicleLabel, type State, type Task } from "./store";
import { ATTENDANCE, ON_CALL, SAFETY, STAFF } from "./fixtures";
import { Portal, Avatar, Btn, Card, Chip, Empty, Field, Flag, Head, JLink, Metric, Note, Page, Seg, Table, VLink, canSeeMoney } from "./ui";
import { go } from "./nav";

const recordLink = (r: string) => r.startsWith("JOB-") ? <JLink id={r} /> : /^V\d|^C\d/.test(r) ? <VLink id={r} /> : r.startsWith("Q-") ? <button className="d-link" onClick={() => { A.focus("quote", r); go("Sales", "quote"); }}>{r}</button> : <span className="d-muted">{r}</span>;

/* ═════════════════════════ TASKS ═════════════════════════ */
function Capture({ close }: { close: () => void }) {
  const [t, setT] = useState<Omit<Task, "id" | "status">>({ title: "", owner: "p-anthony", due: "This week", priority: "Medium", dept: "Workshop", record: "V019", kind: "improvement", acceptance: "" });
  const records = ["V019", "V024", "V008", "JOB-1041", "JOB-1042", "Q-1042", "LIVE", "FRIDAY", "meeting"];
  return (
    <div className="d-drawer-scrim" onClick={close}><aside className="d-drawer" onClick={e => e.stopPropagation()} role="dialog" aria-label="Capture request">
      <div className="d-drawer-head"><div className="d-grow"><div className="d-eyebrow">Capture in context</div><b style={{ fontSize: 18 }}>New request</b><div className="d-muted">Link it to the record it came from, name an owner and an acceptance example.</div></div><Btn sm kind="ghost" onClick={close}>Close</Btn></div>
      <div className="d-drawer-body d-grid">
        <Field label="Type"><Seg value={t.kind} onChange={k => setT({ ...t, kind: k })} options={[["improvement", "Improvement request"], ["task", "Task"]]} /></Field>
        <Field label="Title"><input className="d-input" value={t.title} onChange={e => setT({ ...t, title: e.target.value })} placeholder="e.g. Flag ETA changes against promised dates" /></Field>
        <div className="d-grid d-g2">
          <Field label="Related record"><select className="d-select" value={t.record} onChange={e => setT({ ...t, record: e.target.value })}>{records.map(r => <option key={r}>{r}</option>)}</select></Field>
          <Field label="Owner / reviewer"><select className="d-select" value={t.owner} onChange={e => setT({ ...t, owner: e.target.value })}>{STAFF.filter(p => p.kind === "support").map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></Field>
          <Field label="Department"><select className="d-select" value={t.dept} onChange={e => setT({ ...t, dept: e.target.value })}>{["Workshop", "Vehicle Stock", "Sales", "CVRT", "Parts", "Accounts", "Work"].map(x => <option key={x}>{x}</option>)}</select></Field>
          <Field label="Due"><input className="d-input" value={t.due} onChange={e => setT({ ...t, due: e.target.value })} /></Field>
        </div>
        <Field label="Acceptance example" hint="How will we know it works? One concrete example."><textarea className="d-textarea" rows={3} value={t.acceptance} onChange={e => setT({ ...t, acceptance: e.target.value })} /></Field>
        <Note>Captured requests are separate from implemented demo behaviour. Integration questions live in Settings → Systems.</Note>
        <div className="d-row"><span className="d-grow" /><Btn onClick={close}>Cancel</Btn><Btn kind="primary" disabled={!t.title.trim()} onClick={() => { A.capture(t); close(); }}>Capture</Btn></div>
      </div>
    </aside></div>
  );
}
export function Tasks() {
  const [s] = useDerived();
  const [f, setF] = useState<"open" | "improvement" | "mine" | "done">("open");
  const [cap, setCap] = useState(false);
  const rows = s.tasks.filter(t => f === "done" ? t.status === "done" : t.status === "open" && (f === "open" || (f === "improvement" ? t.kind === "improvement" : t.owner === "p-anthony")));
  return (
    <Page>
      <Head title="Tasks" sub="Owned, dated work linked to the record it came from.">
        <Seg value={f} onChange={setF} options={[["open", "All open"], ["improvement", "Improvement requests"], ["mine", "Mine"], ["done", "Done"]]} label="Filter" />
        <Btn kind="primary" onClick={() => setCap(true)}>Capture request</Btn>
      </Head>
      <Card className="flush"><Table rowKey={t => t.id} rows={rows} cols={[
        { key: "d", label: "", render: t => <input type="checkbox" aria-label={`Done: ${t.title}`} checked={t.status === "done"} onChange={() => A.toggleTask(t.id)} /> },
        { key: "t", label: "Task", render: t => <div><b style={{ fontWeight: 500 }}>{t.title}</b>{t.acceptance && <div className="d-muted" style={{ fontSize: 11.5 }}>Accept when: {t.acceptance}</div>}</div>, sort: t => t.title },
        { key: "k", label: "Type", render: t => <Chip tone={t.kind === "improvement" ? "acc" : undefined}>{t.kind === "improvement" ? "Improvement" : "Task"}</Chip> },
        { key: "o", label: "Owner", render: t => <span className="d-row" style={{ gap: 6 }}><Avatar id={t.owner} size={22} />{pname(t.owner)}</span>, sort: t => pname(t.owner) },
        { key: "du", label: "Due", render: t => t.due }, { key: "p", label: "Priority", render: t => <Chip tone={t.priority === "High" ? "warn" : undefined}>{t.priority}</Chip>, sort: t => t.priority },
        { key: "de", label: "Department", render: t => t.dept, sort: t => t.dept }, { key: "r", label: "Record", render: t => recordLink(t.record) },
        { key: "s", label: "Story", render: t => t.story ? <span className="d-mono">{t.story}</span> : "—" },
      ]} empty="No tasks in this view." /></Card>
      {cap && <Portal><Capture close={() => setCap(false)} /></Portal>}
    </Page>
  );
}

/* ═════════════════════════ APPROVALS ═════════════════════════ */
export function Approvals() {
  const [s, d] = useDerived();
  const items = approvals(s, d);
  const queues = ["All", "Technician confirmation", "Job-card review", "Discount approval", "Stock correction", "Customer communication"] as const;
  const [q, setQ] = useState<(typeof queues)[number]>("All");
  const shown = items.filter(i => q === "All" || i.queue === q);
  const decided = s.activity.filter(a => a.kind === "person" && /Approved|Confirmed|kept as tracked|Returned/.test(a.text)).slice(0, 8);
  const act = (i: (typeof items)[number]) => {
    const id = i.id.slice(3);
    switch (i.queue) {
      case "Technician confirmation": return <Btn sm kind="primary" onClick={() => { A.focus("job", id); go("Workshop", "jobcards"); }}>Answer and confirm</Btn>;
      case "Job-card review": return <Btn sm kind="primary" onClick={() => A.approveWriteup(id)}>Approve write-up</Btn>;
      case "Discount approval": return s.role === "management" ? <><Btn sm kind="primary" onClick={() => A.approveDiscount(id)}>Approve</Btn><Btn sm kind="ghost" onClick={() => A.rejectDiscount(id)}>Return</Btn></> : <span className="d-muted">needs Anthony</span>;
      case "Stock correction": return <Btn sm kind="primary" onClick={() => A.resolveStock(id, "Reviewed: still allocated, keep tracked incoming")}>Keep as incoming</Btn>;
      case "Customer communication": return <><Btn sm kind="primary" onClick={() => A.decide(i.id, "approved", "Approved V008 customer update draft — not sent from the demo")}>Approve draft</Btn><Btn sm kind="ghost" onClick={() => A.decide(i.id, "rejected", "Rejected V008 customer update draft")}>Reject</Btn></>;
    }
  };
  return (
    <Page>
      <Head title="Approvals" sub="Reviewer, evidence and consequence are visible before you decide. Approvals bind to the version reviewed." />
      <div className="d-row" style={{ marginBottom: 12 }}>{queues.map(x => <button key={x} className={"d-chip " + (q === x ? "sel" : "")} onClick={() => setQ(x)}>{x} · {x === "All" ? items.length : items.filter(i => i.queue === x).length}</button>)}</div>
      <div className="d-split">
        <div className="d-grid">{shown.length ? shown.map(i => (
          <Card key={i.id} title={<><Chip tone="warn">{i.queue}</Chip> {i.title}</>} aside={<span className="d-row" style={{ gap: 6 }}><Avatar id={i.reviewer} size={22} /><span className="d-muted">{pname(i.reviewer)}</span></span>}>
            <div className="d-list">{i.evidence.map(e => <div className="d-li" key={e}><span className="d-muted">Evidence</span><span className="d-grow">{e}</span></div>)}</div>
            <div className="d-muted" style={{ margin: "8px 0" }}><b style={{ color: "var(--ink)" }}>If approved:</b> {i.consequence}</div>
            <div className="d-row">{act(i)}<span className="d-grow" />{recordLink(i.record)}</div>
          </Card>)) : <Empty>Nothing waiting in this queue.</Empty>}</div>
        <Card title="Recently decided">{decided.length ? decided.map(a => <div className="d-li" key={a.id}><span className="d-mono d-faint">{a.at}</span><span className="d-grow"><b style={{ fontWeight: 500 }}>{a.who}</b> <span className="d-muted">{a.text}</span></span></div>) : <span className="d-muted">No decisions yet this session.</span>}</Card>
      </div>
    </Page>
  );
}

/* ═════════════════════════ WORKFLOWS ═════════════════════════ */
export function Workflows() {
  const [s, d] = useDerived();
  const [pick, setPick] = useState<{ wf: string; stage: string; items: ReactNode[] } | null>(null);
  const jc = (id: string) => s.jobcards[id];
  const v8 = handoverGates(s, "V008");
  const flows: { name: string; stages: [string, ReactNode[]][] }[] = [
    { name: "Completed job → invoice-ready", stages: [
      ["Completed", d.completed.map(j => <JLink key={j.id} id={j.id} />)],
      ["Technician confirmed", d.completed.filter(j => j.invoice === "ready" || jc(j.id)?.techConfirmed).map(j => <JLink key={j.id} id={j.id} />)],
      ["Invoice-ready", d.ready.map(j => <JLink key={j.id} id={j.id} />)],
      ["Export prepared (not posted)", s.invoiceExports.map(id => <JLink key={id} id={id} />)]] },
    { name: "Vehicle sale → handover", stages: [
      ["Quoted", s.quotes.filter(q => ["Quoted", "Approval"].includes(q.stage)).map(q => <span key={q.id}>{q.id}</span>)],
      ["Ready for customer", s.quotes.filter(q => q.vehicle && quoteGates(s, q).ready).map(q => <span key={q.id}>{q.id}</span>)],
      ["Reserved", d.reserved.map(v => <VLink key={v.id} id={v.id} />)],
      ["Gates clear", Object.keys(s.gates).filter(id => handoverGates(s, id).ready).map(id => <VLink key={id} id={id} />)],
      ["Handed over", Object.keys(s.gates).filter(id => s.gates[id].handedOver).map(id => <VLink key={id} id={id} />)]] },
    { name: "Failed test → retest", stages: [
      ["Failed, awaiting repair", d.cvrt.repair.map(t => <VLink key={t.id} id={t.vehicle} />)],
      ["Repair complete", s.cvrt.filter(t => t.repairJob && ["awaiting_qc", "completed"].includes(s.jobs.find(j => j.id === t.repairJob)?.status ?? "")).map(t => <VLink key={t.id} id={t.vehicle} />)],
      ["Retest scheduled", d.cvrt.retest.map(t => <VLink key={t.id} id={t.vehicle} />)],
      ["Passed (recorded)", s.cvrt.filter(t => t.repairJob && t.status === "completed" && t.result === "pass").map(t => <VLink key={t.id} id={t.vehicle} />)]] },
    { name: "Weekly order book reconciliation", stages: [
      ["File received", [<span key="f">renault-order-book-19-oct (sample)</span>]],
      ["Diff previewed", s.imports.previewOpen || s.imports.applied.length ? [<span key="d">2 added · 3 ETA · 1 missing</span>] : []],
      ["Applied", s.imports.applied.map(id => <span key={id}>{id}</span>)],
      ["Exceptions owned", s.tasks.filter(t => t.id === "TK-V019").map(t => <span key={t.id}>{t.title} · {pname(t.owner)}</span>)]] },
  ];
  return (
    <Page>
      <Head title="Workflows" sub="Each stage shows the records actually in it. Click a stage to inspect them." />
      <div className="d-grid">{flows.map(f => (
        <Card key={f.name} title={f.name}>
          <div className="d-row" style={{ gap: 8, alignItems: "stretch" }}>{f.stages.map(([st, items], i) => (
            <button key={st} onClick={() => setPick({ wf: f.name, stage: st, items })} className="d-card" style={{ flex: 1, minWidth: 140, padding: 12, cursor: "pointer", textAlign: "left", color: "inherit", background: pick?.stage === st && pick.wf === f.name ? "var(--accent-faint)" : "var(--surface-2)" }}>
              <div className="d-eyebrow">Step {i + 1}</div><div style={{ fontWeight: 500, marginTop: 3 }}>{st}</div><div style={{ fontSize: 22, fontWeight: 600, marginTop: 4 }}>{items.length}</div>
            </button>))}</div>
          {pick?.wf === f.name && <div style={{ marginTop: 12 }}><b>{pick.stage}</b><div className="d-row" style={{ marginTop: 6 }}>{pick.items.length ? pick.items : <span className="d-muted">No records at this stage.</span>}</div></div>}
        </Card>))}</div>
      {!v8.ready && <div style={{ marginTop: 12 }}><Note>V008 sits in “Failed test → retest” and “Vehicle sale → handover” at the same time — the same record, two workflows.</Note></div>}
    </Page>
  );
}

/* ═════════════════════════ SCHEDULES ═════════════════════════ */
export function Schedules() {
  const [s, d] = useDerived();
  const present = techs.filter(t => !ATTENDANCE[t.id]);
  return (
    <Page>
      <Head title="Schedules" sub="Attendance comes from the sample Bizimply report and stays separate from time charged to jobs. Absence reasons are never shown." />
      <div className="d-grid d-g4" style={{ marginBottom: 14 }}>
        <Metric label="Technicians present" value={`${present.length} / 15`} /><Metric label="Absent" value={d.counts.absent} /><Metric label="Approved training" value={d.counts.training} /><Metric label="Support staff" value="15" hint="incl. the 7 management/team contacts" />
      </div>
      <div className="d-grid d-g2">
        <Card title="Attendance today">{techs.map(t => <div className="d-li" key={t.id}><Avatar id={t.id} size={22} /><span className="d-grow">{t.name}</span><Chip tone={ATTENDANCE[t.id] === "absent" ? undefined : ATTENDANCE[t.id] ? "acc" : "ok"}>{ATTENDANCE[t.id] === "absent" ? "Absent" : ATTENDANCE[t.id] ? "Training (off-site)" : "Present"}</Chip></div>)}</Card>
        <div className="d-grid">
          <Card title="Technician availability (planned)">{present.map(t => { const load = blocksFor(s, t.id).reduce((a, b) => a + b.to - b.from, 0); return <div className="d-li" key={t.id}><span className="d-grow">{t.name}</span><span className="d-muted">{dur(Math.max(0, 480 - load))} free</span></div>; })}</Card>
          <Card title="Breakdown rota"><div className="d-li"><span className="d-grow">This week</span><b>{pname(ON_CALL.thisWeek)}</b></div><div className="d-li"><span className="d-grow">Next week</span><b>{pname(ON_CALL.nextWeek)}</b></div></Card>
          <Card title="Deadlines today">{s.tasks.filter(t => t.status === "open" && /Today|11:30|12:00/.test(t.due)).map(t => <div className="d-li" key={t.id}><Chip tone="warn">{t.due}</Chip><span className="d-grow">{t.title}</span></div>)}</Card>
          <Card title="Recurring"><div className="d-li"><span className="d-mono">07:00</span><span className="d-grow">Morning meeting prep · Briefing</span><Btn sm onClick={() => go("Work", "meeting")}>Open</Btn></div><div className="d-li"><span className="d-mono">Mon 09:00</span><span className="d-grow">Weekly order book import</span></div><div className="d-li"><span className="d-mono">16:00</span><span className="d-grow">Invoice readiness summary</span></div></Card>
        </div>
      </div>
    </Page>
  );
}

/* ═════════════════════════ MORNING MEETING ═════════════════════════ */
const previewTechs = (s: State) => techs.filter(t => !ATTENDANCE[t.id]);

function Panel({ label, children, tone }: { label: string; children: ReactNode; tone?: string }) {
  return <div className="pres-panel" style={tone ? { borderColor: tone } : undefined}><div className="d-eyebrow" style={{ fontSize: 12 }}>{label}</div><div style={{ marginTop: 12 }}>{children}</div></div>;
}
function JobPanel({ s, label, job }: { s: State; label: string; job?: import("./fixtures").Job }) {
  if (!job) return <Panel label={label}><div className="pres-mid d-muted">Nothing scheduled</div></Panel>;
  const v = vehicleLabel(s, job.vehicle);
  return <Panel label={label} tone={label === "Current Job" ? "var(--accent-line)" : undefined}>
    <div className="pres-big">{v.reg}</div><div className="pres-mid d-muted">{v.model}</div>
    <div className="pres-mid" style={{ marginTop: 14 }}><b>{cname(job.customer)}</b></div>
    <div className="pres-mid">{job.complaint}</div>
    <div className="pres-mid d-muted" style={{ marginTop: 12 }}>{job.id} · {job.status === "in_progress" ? `on since ${job.start} · ${elapsed(job, s.clock)}/${job.budgetMin} min` : `planned ${job.plannedStart} · ${dur(job.budgetMin)}`}</div>
  </Panel>;
}

function Slide({ id, s, techIdx }: { id: string; s: State; techIdx: number }) {
  const [, d] = useDerived();
  const note = s.meeting.notes[id];
  const N = note ? <div className="pres-mid d-muted">{note}</div> : null;
  switch (id) {
    case "greeting": return <><h2>Good morning, everyone</h2><div className="pres-big">Monday 19 October 2026</div>
      <div className="d-grid d-g2"><Panel label="Today's focus"><div className="pres-mid">Get V008 repaired and retested, and keep Billy's afternoon on time.</div></Panel><Panel label="Lean message"><div className="pres-mid">Small fixes, every day. If you're waiting on something, say so early.</div></Panel></div>{N}</>;
    case "events": return <><h2>Team celebrations &amp; events</h2><div className="d-grid d-g3">
      <Panel label="Anniversary"><div className="pres-mid">Ronan Keville — 5 years at Reynolds</div><div className="d-muted">Fictional example · shared with consent</div></Panel>
      <Panel label="Event"><div className="pres-mid">Workshop BBQ — Friday 16:30</div><div className="d-muted">Yard, weather permitting</div></Panel>
      <Panel label="Welcome"><div className="pres-mid">Gavin Tuohy joins sales admin full-time</div><div className="d-muted">Fictional example</div></Panel></div>{N}</>;
    case "downtime": return <><h2>Downtime and holds</h2><Note>Proposed composition — the recording shows the section name only.</Note><div className="d-grid d-g2">
      <Panel label="Parts holds">{d.awaitingParts.map(j => <div key={j.id} className="pres-mid">{j.id} · {j.partBlocker?.part} · ETA {j.partBlocker?.eta}</div>)}{!d.awaitingParts.length && <div className="pres-mid d-muted">None</div>}</Panel>
      <Panel label="Equipment"><div className="pres-mid">Brake roller lane 2 — calibration check 14:00 (sample)</div></Panel></div>{N}</>;
    case "updates": return <><h2>Department updates</h2><Note>Proposed composition.</Note><div className="d-grid d-g2">
      <Panel label="Parts · Darren"><div className="pres-mid">V008 rear caliper due 11:30.</div></Panel>
      <Panel label="Sales · Jack"><div className="pres-mid">V024 chassis cab arrives tomorrow; Q-1042 waiting on spec + discount.</div></Panel>
      <Panel label="CVRT · Elizabeth"><div className="pres-mid">{s.cvrt.length} bookings today · {d.cvrt.repair.length} awaiting repair · {d.cvrt.retest.length} retest.</div></Panel>
      <Panel label="Workshop · Jonathan"><div className="pres-mid">{d.hopper.length} jobs still to allocate from the hopper.</div></Panel></div>{N}</>;
    case "readiness": {
      const days = Math.round((new Date("2026-10-19").getTime() - new Date(SAFETY.lastIncident).getTime()) / 86400000);
      return <><h2>Readiness</h2><div className="d-grid d-g3">
        <Panel label="Workshop safety"><div className="pres-big">{days} days</div><div className="pres-mid">since the last recorded incident</div><div className="d-muted">{SAFETY.note}</div></Panel>
        <Panel label="On-call cover"><div className="pres-mid">This week: <b>{pname(ON_CALL.thisWeek)}</b></div><div className="pres-mid">Next week: <b>{pname(ON_CALL.nextWeek)}</b></div><div className="d-muted">{ON_CALL.van}</div></Panel>
        <Panel label="Absences today">{techs.filter(t => ATTENDANCE[t.id]).map(t => <div key={t.id} className="pres-mid">{t.name}{ATTENDANCE[t.id] === "training" ? " — training" : ""}</div>)}<div className="d-muted">From the sample Bizimply report. No reasons shown.</div></Panel></div>{N}</>;
    }
    case "preview": {
      const list = previewTechs(s); const t = list[techIdx % list.length]; const tn = techNow(s, t.id);
      return <><h2>Jobs review &amp; preview</h2>
        <div className="d-row" style={{ gap: 14 }}><span className="d-avatar" style={{ width: 48, height: 48, background: t.tint, fontSize: 15 }}>{t.initials}</span><div className="d-grow"><div className="pres-big">{t.name}</div><div className="pres-mid d-muted">{t.role}{tn.state === "unallocated" ? ` · no job clocking since ${tn.since}` : ""}</div></div>
          <Btn onClick={() => A.meetingTech((techIdx - 1 + list.length) % list.length)} aria-label="Previous technician">‹ Technician</Btn><span className="d-mono">{(techIdx % list.length) + 1} / {list.length}</span><Btn onClick={() => A.meetingTech((techIdx + 1) % list.length)} aria-label="Next technician">Technician ›</Btn></div>
        <div className="d-grid d-g2"><JobPanel s={s} label="Current Job" job={tn.job} /><JobPanel s={s} label="Next Job" job={tn.next} /></div>{N}</>;
    }
    case "photos": return <><h2>Sweep · Sort · Sustain</h2>
      <div role="img" aria-label="Illustrative 3S poster: Sweep, Sort, Sustain — keep bays clear, tools returned, standards kept" className="pres-panel" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 0, padding: 0, overflow: "hidden", minHeight: 280 }}>
        {[["SWEEP", "Bays clear at every job change", "#2034AB"], ["SORT", "Tools back on the board", "#13161f"], ["SUSTAIN", "Same standard tomorrow", "#6C8CFF"]].map(([a, b, c]) => <div key={a} style={{ background: c, padding: 28, display: "flex", flexDirection: "column", justifyContent: "flex-end", color: "#fff" }}><div style={{ fontSize: 40, fontWeight: 800, letterSpacing: 2 }}>{a}</div><div className="pres-mid">{b}</div></div>)}
      </div><div className="d-muted">Illustrative training poster (typographic) — replace with a team-approved workshop photo.</div>{N}</>;
    case "focus": { const t = s.tasks.find(x => x.kind === "improvement" && x.status === "open"); return <><h2>Focus this week</h2><Note>Proposed composition.</Note>
      {t ? <Panel label="One improvement action"><div className="pres-big">{t.title}</div><div className="pres-mid d-muted">Owner {pname(t.owner)} · due {t.due} · {t.status}</div></Panel> : <Empty>No open improvement.</Empty>}{N}</>; }
    case "board3s": return <><h2>3S Board</h2><Note>Proposed board — the recording shows the label and poster only.</Note><div className="d-grid d-g3">
      {[["Sweep", [["s1", "Bay 1–4 swept at changeover"], ["s2", "Oil spill kit restocked"]]], ["Sort", [["s3", "Red-tag shelf cleared"], ["o1", "Diagnostic leads labelled"]]], ["Sustain", [["o2", "Friday 10-minute audit"], ["u1", "Photo of standard posted"]]]].map(([h, items]) =>
        <Panel key={h as string} label={h as string}>{(items as [string, string][]).map(([k, l]) => <label key={k} className="pres-mid d-row" style={{ cursor: "pointer" }}><input type="checkbox" checked={!!s.meeting.board[k]} onChange={() => A.toggleBoard(k)} style={{ width: 20, height: 20 }} />{l}</label>)}</Panel>)}</div>{N}</>;
  }
  return null;
}

function Presentation({ start, close }: { start: number; close: () => void }) {
  const [s] = useDerived();
  const enabled = s.meeting.sections.filter(x => x.enabled);
  const [i, setI] = useState(Math.min(start, enabled.length - 1));
  const sec = enabled[Math.min(i, enabled.length - 1)];
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") setI(x => Math.min(enabled.length - 1, x + 1));
      else if (e.key === "ArrowLeft") setI(x => Math.max(0, x - 1));
      else if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", k); return () => window.removeEventListener("keydown", k);
  }, [enabled.length, close]);
  if (!sec) return null;
  return (
    <div className="pres" role="dialog" aria-label="Morning meeting presentation">
      <div className="pres-top"><b style={{ letterSpacing: 1 }}>REYNOLDS COMMERCIALS</b><span style={{ opacity: .8 }}>Morning meeting · Mon 19 Oct · {hhmm(s.clock)}</span><span className="d-grow" /><b style={{ fontSize: 18 }}>{sec.label}</b><span className="d-mono">{i + 1} of {enabled.length}</span><Btn sm onClick={A.refreshMeeting}>Refresh</Btn><Btn sm onClick={close}>Exit</Btn></div>
      <div className="pres-canvas">
        <button className="pres-arrow" style={{ left: 14 }} onClick={() => setI(Math.max(0, i - 1))} disabled={i === 0} aria-label="Previous slide">‹</button>
        <div className="pres-slide" key={sec.id}><Slide id={sec.id} s={s} techIdx={s.meeting.techIdx} /></div>
        <button className="pres-arrow" style={{ right: 14 }} onClick={() => setI(Math.min(enabled.length - 1, i + 1))} disabled={i === enabled.length - 1} aria-label="Next slide">›</button>
      </div>
      <div className="pres-foot">{enabled.map((x, k) => <button key={x.id} className={"pres-dot " + (k === i ? "on" : "")} onClick={() => setI(k)} aria-label={`Go to ${x.label}`} />)}<span className="d-faint" style={{ marginLeft: 12, fontSize: 11 }}>Refreshed {hhmm(s.meeting.refreshedAt)} · ← → to navigate · Esc to exit · filtered view: no debts, pay or absence reasons</span></div>
    </div>
  );
}

function ControlCenter({ close }: { close: () => void }) {
  const [s] = useDerived();
  const [secs, setSecs] = useState(s.meeting.sections.map(x => ({ ...x })));
  const [notes, setNotes] = useState({ ...s.meeting.notes });
  const [sel, setSel] = useState("preview");
  const [tech, setTech] = useState(previewTechs(s)[0].id);
  const cur = secs.find(x => x.id === sel)!;
  const tn = techNow(s, tech);
  return (
    <div className="d-modal-scrim"><div className="d-modal" style={{ width: "min(1040px,100%)", height: "min(720px,100%)" }} role="dialog" aria-label="Control Center">
      <div className="d-drawer-head"><div className="d-grow"><div className="d-eyebrow">Control Center</div><b style={{ fontSize: 18 }}>Morning meeting sections</b><div className="d-muted">{secs.filter(x => x.enabled).length} of {secs.length} sections enabled. Hidden sections leave the slide count.</div></div></div>
      <div style={{ flex: 1, minHeight: 0, display: "grid", gridTemplateColumns: "230px 1fr" }}>
        <nav style={{ borderRight: "1px solid var(--border)", overflow: "auto", padding: 10 }} aria-label="Sections">
          {secs.map(x => <div key={x.id} className="d-row" style={{ padding: "7px 8px", borderRadius: 10, background: sel === x.id ? "var(--accent-faint)" : "none", cursor: "pointer" }} onClick={() => setSel(x.id)}>
            <input type="checkbox" checked={x.enabled} aria-label={`Show ${x.label}`} onClick={e => e.stopPropagation()} onChange={() => setSecs(secs.map(y => y.id === x.id ? { ...y, enabled: !y.enabled } : y))} />
            <span className="d-grow">{x.label}</span>{!x.observed && <span className="d-faint" style={{ fontSize: 10 }}>proposed</span>}</div>)}
        </nav>
        <div style={{ overflow: "auto", padding: 18 }} className="d-grid">
          <div className="d-row"><b style={{ fontSize: 16 }} className="d-grow">{cur.label}</b><label className="d-row"><input type="checkbox" checked={cur.enabled} onChange={() => setSecs(secs.map(y => y.id === cur.id ? { ...y, enabled: !y.enabled } : y))} />Visible in the deck</label></div>
          {sel === "preview" && <Card title="Technician — current and next job">
            <Field label="Technician"><select className="d-select" value={tech} onChange={e => setTech(e.target.value)}>{previewTechs(s).map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select></Field>
            <div className="d-grid d-g2" style={{ marginTop: 10 }}>
              <Field label="Current job (from Planner · read-only)"><input className="d-input" readOnly value={tn.job ? `${tn.job.id} · ${vehicleLabel(s, tn.job.vehicle).reg} · ${cname(tn.job.customer)} · ${tn.job.complaint}` : "No job clocking"} /></Field>
              <Field label="Next job (from Planner · read-only)"><input className="d-input" readOnly value={tn.next ? `${tn.next.id} · ${tn.next.plannedStart} · ${cname(tn.next.customer)} · ${tn.next.complaint}` : "Nothing scheduled"} /></Field>
            </div>
            <div className="d-row" style={{ marginTop: 10 }}><Btn sm onClick={() => { close(); go("Workshop", "planner"); }}>Edit in Planner</Btn><Note>A sample Excel job-card import/mapping exists as an option, but the planner is the source — no retyping.</Note></div>
          </Card>}
          <div className="pres-panel" style={{ transform: "scale(.82)", transformOrigin: "top left", width: "122%", pointerEvents: sel === "board3s" ? "auto" : "none" }}><Slide id={sel} s={s} techIdx={0} /></div>
          <Field label="Presentation-only note (local annotation, not written to any record)"><textarea className="d-textarea" rows={2} value={notes[sel] ?? ""} onChange={e => setNotes({ ...notes, [sel]: e.target.value })} /></Field>
        </div>
      </div>
      <div className="d-row" style={{ padding: 14, borderTop: "1px solid var(--border)" }}><span className="d-muted d-grow">Changes apply when you save.</span><Btn onClick={close}>Cancel</Btn><Btn kind="primary" onClick={() => { A.saveSections(secs, notes); close(); }}>Save</Btn></div>
    </div></div>
  );
}

export function MorningMeeting() {
  const [s, d] = useDerived();
  const [pres, setPres] = useState<number | null>(null);
  const [cc, setCc] = useState(false);
  const [peek, setPeek] = useState<string | null>(null);
  const enabled = s.meeting.sections.filter(x => x.enabled);
  const billy = techNow(s, "t-billy");
  return (
    <Page>
      <Head title="Morning Meeting" sub={`Built from the same records as the rest of Pulse. ${enabled.length} of ${s.meeting.sections.length} configurable sections enabled.`}>
        <Btn onClick={A.refreshMeeting}>Refresh from records · {hhmm(s.meeting.refreshedAt)}</Btn>
        <Btn onClick={() => setCc(true)}>Control Center</Btn>
        <Btn kind="primary" onClick={() => setPres(0)}>Start presentation · 1 of {enabled.length}</Btn>
      </Head>
      <div className="d-grid d-g3" style={{ marginBottom: 14 }}>
        <Metric label="Deck" value={`${enabled.length} slides`} hint="hidden sections are not counted" />
        <Metric label="Billy — current" value={billy.job?.id ?? "—"} hint={billy.job ? `${cname(billy.job.customer)} · ${elapsed(billy.job, s.clock)}/${billy.job.budgetMin} min` : ""} />
        <Metric label="Billy — next" value={billy.next ? `${billy.next.id} · ${billy.next.plannedStart}` : "—"} hint={billy.next ? cname(billy.next.customer) : ""} />
      </div>
      <div className="d-grid d-g3">{s.meeting.sections.map(x => {
        const n = enabled.findIndex(e => e.id === x.id);
        return <Card key={x.id} title={<>{x.label} {!x.observed && <span className="d-faint" style={{ fontWeight: 400, fontSize: 11 }}>proposed</span>}</>} aside={<Chip tone={x.enabled ? "ok" : undefined}>{x.enabled ? `Slide ${n + 1}` : "Hidden"}</Chip>}>
          <div className="d-row"><Btn sm onClick={() => setPeek(x.id)}>Preview</Btn><Btn sm kind="ghost" onClick={() => A.toggleSection(x.id)}>{x.enabled ? "Hide" : "Enable"}</Btn>{x.enabled && <Btn sm kind="ghost" onClick={() => setPres(n)}>Present from here</Btn>}</div>
        </Card>;
      })}</div>
      <div style={{ marginTop: 12 }}><Note>The deck is a filtered operational view: no debts, pay, private absence reasons or confidential customer details. {d.gaps.length} live gap(s) are not shown on slides.</Note></div>
      {pres !== null && <Portal><Presentation start={pres} close={() => setPres(null)} /></Portal>}
      {cc && <Portal><ControlCenter close={() => setCc(false)} /></Portal>}
      {peek && <Portal><div className="d-modal-scrim" onClick={() => setPeek(null)}><div className="d-modal" style={{ width: "min(1100px,100%)" }} onClick={e => e.stopPropagation()}>
        <div className="d-row" style={{ padding: 14, borderBottom: "1px solid var(--border)" }}><b className="d-grow">Preview · {s.meeting.sections.find(x => x.id === peek)?.label}</b><Btn sm onClick={() => setPeek(null)}>Close</Btn></div>
        <div style={{ padding: 26, overflow: "auto" }} className="pres-slide"><Slide id={peek} s={s} techIdx={s.meeting.techIdx} /></div></div></div></Portal>}
    </Page>
  );
}

export const WORK_PAGES: Record<string, () => JSX.Element> = { tasks: Tasks, approvals: Approvals, workflows: Workflows, schedules: Schedules, meeting: MorningMeeting };
export { Flag, eur, canSeeMoney, toMin };
