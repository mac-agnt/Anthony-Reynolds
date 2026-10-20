import { useState, type DragEvent, type ReactNode } from "react";
import {
  A, BREAK, DAY_END, DAY_START, JOB_CARD_FACTS, RATE, blocksFor, cardFor, checkSlot, cname, dur, elapsed, eur, fridayIntervals, hhmm, hrs, mondayIntervals,
  pname, techNow, techs, toMin, useDerived, vehicleLabel, type Interval, type State, type TechNow,
} from "./store";
import { ATTENDANCE, COMPANIES, FRIDAY_INTERNAL, FRIDAY_UNALLOC, ON_CALL, type Job } from "./fixtures";
import { Portal, Avatar, Bar, Btn, CLink, Card, Chip, Empty, Field, Flag, Head, JLink, JobChip, Metric, Note, NumInput, Page, Seg, Table, VLink, canSeeMoney } from "./ui";
import { go } from "./nav";

/* ---- timeline geometry: default 07:30–17:30 axis ------------------------- */
const AX0 = toMin("07:30"), AX1 = toMin("17:30"), PX = 1.55;
const X = (m: number) => (Math.max(AX0, Math.min(AX1, m)) - AX0) * PX;
const W = (a: number, b: number) => Math.max(2, X(b) - X(a));
const TRACK = (AX1 - AX0) * PX;
const wtClass = (j: Job) => j.workType === "CVRT preparation" ? "cvrt" : j.workType === "Auto-electrical" ? "elec" : "";

function Axis() {
  const ticks: number[] = [];
  for (let m = AX0; m <= AX1; m += 30) ticks.push(m);
  return (
    <div className="tl-axis"><div className="tl-name" style={{ justifyContent: "center" }}><span className="d-eyebrow">Technician</span></div>
      <div className="tl-track" style={{ width: TRACK }}>{ticks.map(m => <span key={m} className="tl-tick" style={{ left: X(m), borderLeftStyle: m % 60 ? "dashed" : "solid" }}>{m % 60 ? "" : hhmm(m)}</span>)}</div>
    </div>
  );
}
function TrackBg({ now }: { now?: number }) {
  return <>
    <div className="tl-break" style={{ left: X(BREAK[0]), width: W(BREAK[0], BREAK[1]) }} title="Break 12:30–13:00" />
    {now !== undefined && <div className="tl-now" style={{ left: X(now) }} title={`Now ${hhmm(now)}`} />}
  </>;
}

/* ═════════════════════════ OVERVIEW ═════════════════════════ */
export function WorkshopOverview() {
  const [s, d] = useDerived();
  const statusParts: [number, string, string][] = [
    [d.queued.length, "var(--track)", `Queued ${d.queued.length}`], [d.inProgress.length, "var(--accent)", `In progress ${d.inProgress.length}`],
    [d.awaitingParts.length, "var(--warn)", `Awaiting parts ${d.awaitingParts.length}`], [d.awaitingQc.length, "#c8b4f0", `Awaiting QC ${d.awaitingQc.length}`],
  ];
  const exceptions: { k: string; tone: "bad" | "warn"; text: ReactNode; act: ReactNode }[] = [
    ...d.gaps.map(g => ({ k: "g" + g.id, tone: "bad" as const, text: <><b>{pname(g.id)}</b> present, no job clocking since {g.since} ({dur(g.gapMin ?? 0)}){g.reason ? ` — reason: ${g.reason}` : ""}</>, act: <Btn sm onClick={() => go("Workshop", "live")}>Live Board</Btn> })),
    ...d.budgetFlags.map(f => ({ k: "b" + f.j.id, tone: "warn" as const, text: <><b>{pname(f.j.tech)}</b> · <JLink id={f.j.id} /> has used {elapsed(f.j, s.clock)} of {f.j.budgetMin} min ({Math.round(f.pct)}% of budget)</>, act: <Btn sm onClick={() => go("Workshop", "live")}>Review</Btn> })),
    ...d.awaitingParts.filter(j => !j.partBlocker?.received).map(j => ({ k: "p" + j.id, tone: "warn" as const, text: <><JLink id={j.id} /> waiting on {j.partBlocker?.part} · ETA {j.partBlocker?.eta}</>, act: <Btn sm onClick={() => go("Workshop", "parts")}>Parts</Btn> })),
    ...d.blocked.map(j => ({ k: "w" + j.id, tone: "warn" as const, text: <><JLink id={j.id} /> completed — write-up blocked{canSeeMoney(s) ? ` (${eur(j.net ?? 0)})` : ""}</>, act: <Btn sm onClick={() => go("Workshop", "jobcards")}>Job Cards</Btn> })),
  ];
  const nextUp = s.jobs.filter(j => j.status === "queued" && j.plannedStart && toMin(j.plannedStart) >= s.clock).sort((a, b) => toMin(a.plannedStart!) - toMin(b.plannedStart!)).slice(0, 5);
  return (
    <Page>
      <Head title="Workshop today" sub={<>Monday 19 October · demo snapshot {hhmm(s.clock)} · source: sample AssetMinder export and sample Bizimply report</>}>
        <Btn kind="primary" onClick={() => go("Workshop", "live")}>Open Live Board</Btn>
      </Head>
      <div className="d-grid d-g5" style={{ marginBottom: 14 }}>
        <Metric label="On a job" value={`${d.counts.onJob} / 15`} hint={`${d.counts.unallocated} unallocated · ${d.counts.absent} absent · ${d.counts.training} training`} />
        <Metric label="Live gaps" value={d.gaps.length} tone={d.gaps.length ? "bad" : undefined} hint={`present, no job clocking > ${s.rules.gap} min`} />
        <Metric label="Budget warnings" value={d.budgetFlags.length} tone={d.budgetFlags.length ? "warn" : undefined} hint={`≥ ${s.rules.warn}% of approved time`} />
        <Metric label="Open jobs" value={d.open.length} hint={`${d.queued.length} queued · ${d.hopper.length} in hopper`} />
        <Metric label="Completed, not invoiced" value={d.completed.length} hint={`${d.ready.length} ready · ${d.blocked.length} need write-up`} />
      </div>
      <div className="d-split">
        <div className="d-grid">
          <Card title={<>Exceptions to act on <span className="d-muted">({exceptions.length})</span></>}>
            {exceptions.length ? <div className="d-list">{exceptions.map(e => <div className="d-li" key={e.k}><Chip tone={e.tone}>{e.tone === "bad" ? "Gap" : "Watch"}</Chip><div className="d-grow">{e.text}</div>{e.act}</div>)}</div> : <Empty>Nothing needs attention right now.</Empty>}
          </Card>
          <Card title="Mechanic load today" aside={<Btn sm kind="ghost" onClick={() => go("Workshop", "planner")}>Planner</Btn>}>
            <div className="d-grid" style={{ gap: 7 }}>{techs.map(t => {
              const tn = techNow(s, t.id); const load = blocksFor(s, t.id).reduce((a, b) => a + Math.min(b.to, DAY_END) - Math.max(b.from, DAY_START), 0) / 60;
              return <div key={t.id} className="d-row" style={{ gap: 10 }}><span style={{ width: 130 }} className="d-muted">{t.name}</span>
                <div className="d-grow"><Bar parts={tn.state === "absent" || tn.state === "training" ? [[1, "var(--track)", tn.state]] : [[load, "var(--accent)", "Loaded"], [Math.max(0, 8 - load), "var(--track)", "Spare"]]} /></div>
                <span className="d-mono" style={{ width: 92, textAlign: "right" }}>{tn.state === "absent" ? "Absent" : tn.state === "training" ? "Training" : `${load.toFixed(1)} / 8.0 h`}</span></div>;
            })}</div>
          </Card>
        </div>
        <div className="d-grid">
          <Card title="Job status (open)"><Bar parts={statusParts} /><div className="d-row" style={{ marginTop: 10, gap: 14 }}>{statusParts.map(p => <span key={p[2]} className="d-row" style={{ gap: 6 }}><i style={{ width: 8, height: 8, borderRadius: 3, background: p[1] }} /><span className="d-muted">{p[2]}</span></span>)}</div>
            <Note>{d.open.length} open = {d.queued.length} queued + {d.inProgress.length} in progress + {d.awaitingParts.length} awaiting parts + {d.awaitingQc.length} awaiting QC. Completed jobs counted separately.</Note></Card>
          <Card title="Coming up next">{nextUp.length ? <div className="d-list">{nextUp.map(j => <div className="d-li" key={j.id}><span className="d-mono">{j.plannedStart}</span><JLink id={j.id} /><span className="d-grow d-muted">{pname(j.tech)} · {cname(j.customer)}</span></div>)}</div> : <Empty>Nothing else scheduled today.</Empty>}</Card>
          <Card title="Vehicles arriving this week">{d.incoming.filter(v => v.eta && v.eta <= "2026-10-26").map(v => <div className="d-li" key={v.id}><VLink id={v.id} /><span className="d-grow d-muted">Renault {v.model} {v.variant}</span><span className="d-mono">{v.eta?.slice(5)}</span></div>)}</Card>
        </div>
      </div>
    </Page>
  );
}

/* ═════════════════════════ LIVE BOARD ═════════════════════════ */
function MoveDialog({ job, onClose }: { job: Job; onClose: () => void }) {
  const [s] = useDerived();
  const [tech, setTech] = useState(job.tech ?? techs[0].id);
  const [time, setTime] = useState(job.plannedStart ? hhmm(toMin(job.plannedStart) + 30) : "10:45");
  const [reason, setReason] = useState("Billy's brake investigation needs more time");
  const err = checkSlot(s, job.id, tech, toMin(time));
  return (
    <div className="d-modal-scrim" onClick={onClose}>
      <div className="d-modal" style={{ width: "min(520px,100%)" }} onClick={e => e.stopPropagation()} role="dialog" aria-label={`Move ${job.id}`}>
        <div className="d-drawer-head"><div className="d-grow"><div className="d-eyebrow">Reschedule</div><b style={{ fontSize: 18 }}>Move {job.id}</b><div className="d-muted">{cname(job.customer)} · {job.complaint}</div></div></div>
        <div className="d-drawer-body d-grid">
          <div className="d-grid d-g2">
            <Field label="Technician"><select className="d-select" value={tech} onChange={e => setTech(e.target.value)}>{techs.map(t => <option key={t.id} value={t.id}>{t.name}{ATTENDANCE[t.id] ? ` (${ATTENDANCE[t.id]})` : ""}</option>)}</select></Field>
            <Field label="Start"><input className="d-input" type="time" step={900} value={time} onChange={e => setTime(e.target.value)} /></Field>
          </div>
          <Field label="Reason (recorded in Activity)"><input className="d-input" value={reason} onChange={e => setReason(e.target.value)} /></Field>
          {err ? <Flag tone="bad">{err}</Flag> : <Flag tone="ok">Fits: {hhmm(toMin(time))}–{hhmm(toMin(time) + job.budgetMin)} with {pname(tech)}. Planner and morning meeting update together. Scheduling does not clock anyone on.</Flag>}
          <div className="d-row"><span className="d-grow" /><Btn onClick={onClose}>Cancel</Btn><Btn kind="primary" disabled={!!err || !reason.trim()} onClick={() => { if (!A.moveJob(job.id, tech, toMin(time), reason)) onClose(); }}>Move job</Btn></div>
        </div>
      </div>
    </div>
  );
}

function ReasonEditor({ tn }: { tn: TechNow }) {
  const [open, setOpen] = useState(false);
  const [r, setR] = useState("Waiting on a road test slot");
  if (tn.reason) return <div className="d-muted" style={{ fontSize: 11.5 }}>Reason recorded: {tn.reason}</div>;
  return open ? (
    <div className="d-row" style={{ gap: 6 }}>
      <select className="d-select" style={{ flex: 1 }} value={r} onChange={e => setR(e.target.value)} aria-label="Reason">
        {["Waiting on a road test slot", "Helping on another job (not clocked)", "Collecting parts from stores", "Waiting for job allocation", "Other — follow up"].map(x => <option key={x}>{x}</option>)}
      </select>
      <Btn sm kind="primary" onClick={() => { A.liveReason(tn.id, r); setOpen(false); }}>Save</Btn>
    </div>
  ) : <div className="d-row" style={{ gap: 6 }}><Btn sm onClick={() => setOpen(true)}>Record a reason</Btn><Btn sm kind="ghost" onClick={A.allocationTask}>Create review task</Btn></div>;
}

export function LiveTiles() {
  const [s, d] = useDerived();
  const [moving, setMoving] = useState<Job | null>(null);
  const order = (t: TechNow) => t.state === "unallocated" ? 0 : t.state === "on_job" ? (d.budgetFlags.some(f => f.j.id === t.job?.id) ? 1 : 2) : 3;
  const list = [...d.tn].sort((a, b) => order(a) - order(b));
  return (
    <>
      <div className="live-grid">{list.map(tn => {
        const p = techs.find(t => t.id === tn.id)!;
        const j = tn.job;
        const el = j ? elapsed(j, s.clock) : 0;
        const pct = j ? (el / j.budgetMin) * 100 : 0;
        const warn = j && pct >= s.rules.warn;
        const over = j && pct > s.rules.over;
        const gap = tn.state === "unallocated" && (tn.gapMin ?? 0) > s.rules.gap;
        return (
          <div key={tn.id} className={"tile " + (gap ? "gap" : warn ? "warn" : tn.state === "absent" || tn.state === "training" ? "off" : "")}>
            <div className="tile-head"><Avatar id={tn.id} /><div className="d-grow"><b>{p.name}</b><div className="d-muted" style={{ fontSize: 11 }}>{p.role}</div></div>
              {tn.state === "on_job" && <Chip tone={over ? "bad" : warn ? "warn" : "acc"}>{over ? "Over budget" : warn ? "Budget warning" : "On job"}</Chip>}
              {tn.state === "unallocated" && <Chip tone={gap ? "bad" : "warn"}>No job clocking</Chip>}
              {tn.state === "absent" && <Chip>Absent</Chip>}{tn.state === "training" && <Chip>Approved training</Chip>}
            </div>
            <div className="tile-cur">
              {j ? <>
                <div className="d-row" style={{ gap: 8 }}><b style={{ fontSize: 14 }}>{vehicleLabel(s, j.vehicle).reg}</b><span className="d-muted">{cname(j.customer)}</span></div>
                <div>{j.complaint}</div>
                <div className="d-row" style={{ gap: 8 }}><div className="d-grow"><Bar parts={[[Math.min(el, j.budgetMin), over ? "var(--bad)" : warn ? "var(--warn)" : "var(--accent)", "Used"], [Math.max(0, j.budgetMin - el), "var(--track)", "Remaining"]]} /></div>
                  <span className="d-mono">{el}/{j.budgetMin} min</span></div>
                <div className="d-muted" style={{ fontSize: 11 }}>{warn ? `${pct.toFixed(1)}% of approved time used — elapsed vs budget, not % of work done. ` : ""}<JLink id={j.id} /> · owner Jonathan Keenan · clocked {j.start}</div>
                {warn && <div className="d-row" style={{ gap: 6 }}><Btn sm onClick={() => A.extendBudget(j.id, 30, "Diagnosis needs more time — reviewed by service manager")}>Extend budget +30m</Btn>{tn.next && <Btn sm kind="primary" onClick={() => setMoving(tn.next!)}>Move next job</Btn>}</div>}
              </> : tn.state === "unallocated" ? <>
                <div style={{ fontSize: 14 }}><b>No job clocking</b> since {tn.since}</div>
                <div className="d-muted">{dur(tn.gapMin ?? 0)} present and unallocated · not on an approved break</div>
                <ReasonEditor tn={tn} />
              </> : <div className="d-muted">{tn.state === "absent" ? "Absent today — not counted as idle time. Reason not shown." : "Off-site approved training — not counted as idle time."}</div>}
            </div>
            <div className="tile-next">Next: {tn.next ? <><b style={{ color: "var(--ink)" }}>{tn.next.plannedStart}</b> <JLink id={tn.next.id} /> {cname(tn.next.customer)} · {vehicleLabel(s, tn.next.vehicle).reg}</> : "nothing scheduled"}</div>
          </div>
        );
      })}</div>
      {moving && <Portal><MoveDialog job={moving} onClose={() => setMoving(null)} /></Portal>}
    </>
  );
}

export function LiveBoard() {
  const [s, d] = useDerived();
  return (
    <Page>
      <Head title="Live Board" sub={<>Current time view from the same records as the Planner. Demo snapshot {hhmm(s.clock)}; data is frozen unless you advance the simulation.</>}>
        <Chip>Clock {hhmm(s.clock)}</Chip><Btn onClick={() => A.advance(15)}>Simulate +15 min</Btn>{s.clock !== 600 && <Btn kind="ghost" onClick={A.resetClock}>Back to 10:00</Btn>}
      </Head>
      <div className="d-grid d-g4" style={{ marginBottom: 14 }}>
        <Metric label="On a job" value={d.counts.onJob} /><Metric label="Present, unallocated" value={d.counts.unallocated} tone={d.gaps.length ? "bad" : undefined} />
        <Metric label="Absent" value={d.counts.absent} hint="not flagged as idle" /><Metric label="Approved training" value={d.counts.training} hint="not flagged as idle" />
      </div>
      <Note>Technician states sum to 15. Watchdog rules (configurable demo assumptions): gap over {s.rules.gap} min · warn at {s.rules.warn}% of approved budget · over budget above {s.rules.over}%.</Note>
      <div style={{ height: 12 }} />
      <LiveTiles />
    </Page>
  );
}

/* ═════════════════════════ PLANNER ═════════════════════════ */
function suggest(s: State) {
  const out: { job: Job; tech: string; start: number }[] = [];
  let sim = s;
  s.jobs.filter(j => j.hopper && !j.tech).forEach(job => {
    const start0 = Math.ceil(Math.max(s.clock, DAY_START) / 15) * 15;
    for (let st = start0; st < DAY_END; st += 15) {
      const t = techs.find(tt => !checkSlot(sim, job.id, tt.id, st));
      if (t) { out.push({ job, tech: t.id, start: st }); sim = { ...sim, jobs: sim.jobs.map(x => x.id === job.id ? { ...x, tech: t.id, plannedStart: hhmm(st) } : x) }; break; }
    }
  });
  return out;
}

export function Planner() {
  const [s, d] = useDerived();
  const [view, setView] = useState<"board" | "cards">("board");
  const [sel, setSel] = useState<Job | null>(null);
  const [tip, setTip] = useState<{ x: number; y: number; j: Job } | null>(null);
  const [dropRow, setDropRow] = useState<string | null>(null);
  const [file, setFile] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [nj, setNj] = useState({ customer: "c-corrib", complaint: "", mins: 60 });
  const [sugs, setSugs] = useState<ReturnType<typeof suggest> | null>(null);
  const [reason, setReason] = useState("Allocated from hopper");
  const present = techs.filter(t => !ATTENDANCE[t.id]);
  const loaded = present.reduce((a, t) => a + blocksFor(s, t.id).reduce((x, b) => x + Math.max(0, Math.min(b.to, DAY_END) - Math.max(b.from, DAY_START)), 0), 0) / 60;
  const avail = present.length * 8;

  const onDrop = (e: DragEvent, tech: string) => {
    e.preventDefault(); setDropRow(null);
    const id = e.dataTransfer.getData("text/job"); if (!id) return;
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const m = Math.round((AX0 + (e.clientX - rect.left) / PX) / 15) * 15;
    A.moveJob(id, tech, m, "Dragged onto planner");
  };
  return (
    <Page>
      <Head title="Workshop Loading Planner" sub="Allocate the Job Card Hopper onto the technician grid. Scheduling a job creates a planned block — it never starts a clocking.">
        <Chip>Mon 19 Oct</Chip>
        <Seg value={view} onChange={setView} options={[["board", "Timeline Board"], ["cards", "Team Cards"]]} label="Planner view" />
      </Head>
      <div className="d-grid d-g4" style={{ marginBottom: 14 }}>
        <Metric label="Capacity loaded" value={`${loaded.toFixed(1)} h`} hint={`of ${avail.toFixed(1)} h rostered (08:00–16:30)`} />
        <Metric label="Spare assignable" value={`${Math.max(0, avail - loaded).toFixed(1)} h`} hint="planned capacity — not unclocked time" />
        <Metric label="Unassigned jobs" value={d.hopper.length} tone={d.hopper.length ? "warn" : undefined} hint={`${d.queued.length} queued in total`} />
        <Metric label="Available roster" value={`${present.length} / 15`} hint={`${d.counts.absent} absent · ${d.counts.training} training`} />
      </div>
      {view === "cards" ? <LiveTiles /> : (
        <div className="d-side d-side-240">
          <aside className="d-grid" style={{ gap: 10 }}>
            <Card title={<>Job Card Hopper <span className="d-muted">({d.hopper.length})</span></>}>
              <div className="d-grid" style={{ gap: 8 }}>
                {d.hopper.map(j => (
                  <div key={j.id} draggable onDragStart={e => e.dataTransfer.setData("text/job", j.id)} className="d-card" style={{ padding: 10, cursor: "grab", borderRadius: 12, background: sel?.id === j.id ? "var(--accent-faint)" : "var(--surface-2)" }}>
                    <div className="d-row" style={{ gap: 6 }}><JLink id={j.id} /><span className="d-grow" /><span className="d-mono">{dur(j.budgetMin)}</span></div>
                    <div style={{ fontWeight: 500, marginTop: 3 }}>{cname(j.customer)} · {vehicleLabel(s, j.vehicle).reg}</div>
                    <div className="d-muted" style={{ fontSize: 11.5 }}>{j.complaint}</div>
                    <div className="d-row" style={{ gap: 5, marginTop: 5 }}><Chip>{j.workType}</Chip>{j.blockers && <Chip tone="warn" title={j.blockers}>Blocker</Chip>}</div>
                    <Btn sm style={{ marginTop: 7 }} onClick={() => setSel(j)}>Allocate…</Btn>
                  </div>
                ))}
                {!d.hopper.length && <Empty>Hopper empty — every job has a technician.</Empty>}
                <label className="d-empty" style={{ cursor: "pointer", padding: 12, fontSize: 11.5 }}
                  onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) setFile(f.name); }}>
                  <input type="file" hidden onChange={e => setFile(e.target.files?.[0]?.name ?? null)} />
                  {file ? <>{file} — not parsed in the demo. Add the job manually below.</> : "Drop a job card / workshop order (sample)"}
                </label>
                {adding ? <div className="d-grid" style={{ gap: 6 }}>
                  <select className="d-select" value={nj.customer} onChange={e => setNj({ ...nj, customer: e.target.value })}>{COMPANIES.filter(c => c.kind === "customer").map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
                  <input className="d-input" placeholder="Complaint / work" value={nj.complaint} onChange={e => setNj({ ...nj, complaint: e.target.value })} />
                  <div className="d-row"><NumInput value={nj.mins} onChange={n => setNj({ ...nj, mins: n })} width={80} label="Minutes" /><span className="d-muted">min</span></div>
                  <div className="d-row"><Btn sm onClick={() => setAdding(false)}>Cancel</Btn><Btn sm kind="primary" disabled={!nj.complaint.trim() || nj.mins <= 0} onClick={() => { A.addHopperJob(nj.customer, nj.complaint, nj.mins); setAdding(false); setNj({ ...nj, complaint: "" }); }}>Add</Btn></div>
                </div> : <Btn onClick={() => setAdding(true)}>Add job</Btn>}
                <Btn kind="ghost" onClick={() => setSugs(suggest(s))} disabled={!d.hopper.length}>Suggest allocation</Btn>
              </div>
            </Card>
          </aside>
          <div className="d-grid" style={{ gap: 10, minWidth: 0 }}>
            {sugs && <Card title="Suggested allocation (review before accepting)" aside={<Btn sm kind="ghost" onClick={() => setSugs(null)}>Dismiss</Btn>}>
              {sugs.length ? <div className="d-list">{sugs.filter(x => s.jobs.find(j => j.id === x.job.id)?.hopper).map(x => <div className="d-li" key={x.job.id}><JLink id={x.job.id} /><span className="d-grow d-muted">→ {pname(x.tech)} at {hhmm(x.start)} (earliest free, eligible technician)</span><Btn sm kind="primary" onClick={() => A.moveJob(x.job.id, x.tech, x.start, "Accepted suggested allocation")}>Accept</Btn></div>)}</div> : <Empty>No feasible slot found today.</Empty>}
              <Note>A simple earliest-free-slot rule respecting attendance, work type and overlaps — not an optimiser.</Note>
            </Card>}
            {sel && <Card title={<>Allocate {sel.id} <span className="d-muted">— accessible alternative to dragging</span></>} aside={<Btn sm kind="ghost" onClick={() => setSel(null)}>Close</Btn>}>
              <AllocateForm job={sel} reason={reason} setReason={setReason} onDone={() => setSel(null)} />
            </Card>}
            <div className="tl"><div className="tl-scroll"><div className="tl-inner" style={{ width: 168 + TRACK }}>
              <Axis />
              {techs.map(t => {
                const blocks = blocksFor(s, t.id); const att = ATTENDANCE[t.id];
                const load = blocks.reduce((x, b) => x + Math.max(0, Math.min(b.to, DAY_END) - Math.max(b.from, DAY_START)), 0) / 60;
                return (
                  <div className="tl-row" key={t.id}>
                    <div className="tl-name"><b>{t.name}</b><span>{att ? (att === "absent" ? "Absent" : "Training") : `${load.toFixed(1)} h loaded · ${Math.max(0, 8 - load).toFixed(1)} h free`}</span></div>
                    <div className={"tl-track " + (dropRow === t.id ? "tl-drop" : "")} style={{ width: TRACK, opacity: att ? .45 : 1 }}
                      onDragOver={e => { if (!att) { e.preventDefault(); setDropRow(t.id); } }} onDragLeave={() => setDropRow(null)} onDrop={e => onDrop(e, t.id)}>
                      <TrackBg now={s.clock} />
                      {att === "training" && <div className="tl-bar training" style={{ left: X(DAY_START), width: W(DAY_START, DAY_END) }}><b>Off-site training (approved)</b></div>}
                      {blocks.map(b => {
                        const pct = elapsed(b.job, s.clock) / b.job.budgetMin * 100;
                        return <button key={b.job.id} className={`tl-bar ${wtClass(b.job)} ${b.live ? (pct >= s.rules.warn ? "over" : "live") : ""}`} style={{ left: X(b.from), width: W(b.from, b.to) }}
                          draggable={!b.live} onDragStart={e => e.dataTransfer.setData("text/job", b.job.id)}
                          onMouseEnter={e => setTip({ x: e.clientX, y: e.clientY, j: b.job })} onMouseLeave={() => setTip(null)}
                          onFocus={e => { const r = e.currentTarget.getBoundingClientRect(); setTip({ x: r.left, y: r.bottom, j: b.job }); }} onBlur={() => setTip(null)}
                          onClick={() => b.live ? A.open("job", b.job.id) : setSel(b.job)} aria-label={`${b.job.id} ${hhmm(b.from)} to ${hhmm(b.to)}`}>
                          <b>{vehicleLabel(s, b.job.vehicle).reg} · {cname(b.job.customer)}</b><span>{dur(b.job.budgetMin)} · {b.job.complaint}</span>
                        </button>;
                      })}
                    </div>
                  </div>
                );
              })}
            </div></div></div>
            <div className="d-row" style={{ gap: 14 }}>
              {[["", "General workshop"], ["cvrt", "CVRT preparation"], ["elec", "Auto-electrical"]].map(([c, l]) => <span key={l} className="d-row" style={{ gap: 6 }}><i className={"tl-bar " + c} style={{ position: "static", display: "inline-block", width: 18, height: 10, padding: 0 }} /><span className="d-muted">{l}</span></span>)}
              <span className="d-muted">Left accent = clocked on now · hatched = break · line = current time</span>
            </div>
          </div>
        </div>
      )}
      {tip && <div className="tl-tip" style={{ left: tip.x + 12, top: tip.y + 12 }}><b>{tip.j.id}</b> · {tip.j.status === "in_progress" ? `clocked on ${tip.j.start}` : `planned ${tip.j.plannedStart}`}<br />{tip.j.complaint}<br />{pname(tip.j.tech)} · budget {dur(tip.j.budgetMin)}{tip.j.status === "in_progress" ? ` · used ${elapsed(tip.j, s.clock)} min` : ""}</div>}
    </Page>
  );
}

function AllocateForm({ job, reason, setReason, onDone }: { job: Job; reason: string; setReason: (r: string) => void; onDone: () => void }) {
  const [s] = useDerived();
  const [tech, setTech] = useState(job.tech ?? techs.find(t => !ATTENDANCE[t.id] && !checkSlot(s, job.id, t.id, 600 + 30))?.id ?? techs[1].id);
  const [time, setTime] = useState(job.plannedStart ?? "11:00");
  const err = checkSlot(s, job.id, tech, toMin(time));
  return (
    <div className="d-grid" style={{ gap: 10 }}>
      <div className="d-muted">{cname(job.customer)} · {job.complaint} · {dur(job.budgetMin)} · {job.workType}</div>
      <div className="d-grid d-g3">
        <Field label="Technician"><select className="d-select" value={tech} onChange={e => setTech(e.target.value)}>{techs.map(t => <option key={t.id} value={t.id}>{t.name} — {t.role}{ATTENDANCE[t.id] ? ` (${ATTENDANCE[t.id]})` : ""}</option>)}</select></Field>
        <Field label="Start"><input className="d-input" type="time" step={900} value={time} onChange={e => setTime(e.target.value)} /></Field>
        <Field label="Reason"><input className="d-input" value={reason} onChange={e => setReason(e.target.value)} /></Field>
      </div>
      {err ? <Flag tone="bad">{err}</Flag> : <Note>Creates a planned block {time}–{hhmm(toMin(time) + job.budgetMin)}. The job stays queued and is not clocked on.</Note>}
      <div className="d-row"><Btn kind="primary" disabled={!!err} onClick={() => { if (!A.moveJob(job.id, tech, toMin(time), reason || "Allocated")) onDone(); }}>Schedule</Btn><Btn kind="ghost" onClick={() => A.open("job", job.id)}>Open job</Btn></div>
    </div>
  );
}

/* ═════════════════════════ CLOCKING ═════════════════════════ */
function intervalsFor(s: State, day: "fri" | "mon", tech: string) { return day === "fri" ? fridayIntervals(tech) : mondayIntervals(s, tech); }
function rowTotals(s: State, day: "fri" | "mon", tech: string) {
  const iv = intervalsFor(s, day, tech);
  const t = { att: 0, job: 0, brk: 0, internal: 0, explained: 0, gap: 0 };
  iv.forEach(x => {
    const h = (x.to - x.from) / 60;
    if (x.kind === "training") return;
    t.att += h;
    if (x.kind === "job" || x.kind === "running") t.job += h;
    else if (x.kind === "break") t.brk += h;
    else if (x.kind === "internal") t.internal += h;
    else if (x.kind === "gap") { const r = day === "fri" ? s.fridayReviews[x.gapId!] : undefined; if (r?.cls === "internal") t.internal += h; else if (r) t.explained += h; else t.gap += h; }
  });
  return t;
}

export function Clocking() {
  const [s, d] = useDerived();
  const [day, setDay] = useState<"fri" | "mon">("fri");
  const [view, setView] = useState<"timeline" | "matrix">("timeline");
  const [pick, setPick] = useState<{ tech: string; iv: Interval } | null>(null);
  const totals = techs.map(t => ({ t, r: rowTotals(s, day, t.id) }));
  const sum = totals.reduce((a, x) => ({ att: a.att + x.r.att, job: a.job + x.r.job, brk: a.brk + x.r.brk, internal: a.internal + x.r.internal, explained: a.explained + x.r.explained, gap: a.gap + x.r.gap }), { att: 0, job: 0, brk: 0, internal: 0, explained: 0, gap: 0 });
  const rate = sum.job / Math.max(0.01, sum.att - sum.brk);
  const running = day === "mon" ? d.inProgress.length : 0;

  const exportCsv = () => {
    const rows = [["Technician", "Attendance h", "Job h", "Breaks h", "Internal h", "Explained h", "Unexplained h"], ...totals.map(x => [x.t.name, x.r.att, x.r.job, x.r.brk, x.r.internal, x.r.explained, x.r.gap].map(v => typeof v === "number" ? v.toFixed(2) : v))];
    const blob = new Blob(["# SAMPLE DATA — Reynolds demo, not a payroll or accounting record\n" + rows.map(r => r.join(",")).join("\n")], { type: "text/csv" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `clocking-${day === "fri" ? "2026-10-16" : "2026-10-19-partial"}-sample.csv`; a.click();
  };
  return (
    <Page>
      <Head title="Technician Clockings" sub={day === "fri" ? "Friday 16 October — complete day. Retrospective view of the sample AssetMinder export." : `Monday 19 October — partial day to ${hhmm(s.clock)}. Not comparable with Friday's full day.`}>
        <Seg value={day} onChange={v => { setDay(v); setPick(null); }} options={[["fri", "Fri 16 Oct · complete"], ["mon", `Mon 19 Oct · to ${hhmm(s.clock)}`]]} label="Day" />
        <Seg value={view} onChange={setView} options={[["timeline", "Timeline"], ["matrix", "Matrix"]]} label="View" />
        <Btn onClick={() => A.toast("Sample AssetMinder export is already the loaded source — nothing new to import")}>Sample import</Btn>
        <Btn onClick={exportCsv}>Export CSV</Btn><Btn kind="ghost" onClick={() => window.print()}>Print</Btn>
      </Head>
      <div className="d-grid d-g4" style={{ marginBottom: 14 }}>
        <div title={`Job-allocated hours ÷ (attendance − approved breaks) = ${sum.job.toFixed(1)} ÷ (${sum.att.toFixed(1)} − ${sum.brk.toFixed(1)}). Internal work stays in the denominator.`}>
          <Metric label="Job allocation rate" value={(rate * 100).toFixed(1) + "%"} hint={`${sum.job.toFixed(1)} h ÷ (${sum.att.toFixed(1)} − ${sum.brk.toFixed(1)}) h · hover for formula`} /></div>
        <Metric label="Unallocated — review" value={hrs(sum.gap)} tone={sum.gap ? "bad" : undefined}
          hint={canSeeMoney(s) ? <>{eur(sum.gap * RATE)} potential labour billing equivalent at the demo €{RATE}/h — investigate. Not lost revenue.</> : "Investigate"} />
        <Metric label="Missing clock-offs" value={0} hint={day === "mon" ? `${running} live clockings running — not missing` : "complete day"} />
        <Metric label="Roster status" value={day === "fri" ? "15 / 15 attended" : `${15 - d.counts.absent - d.counts.training} present`} hint={day === "fri" ? "Sample Bizimply report" : `${d.counts.absent} absent · ${d.counts.training} training (not idle)`} />
      </div>
      {day === "fri" && <Card style={{ marginBottom: 14 }} title="Friday reconciliation" aside={<span className="d-muted">buckets sum to paid attendance</span>}>
        <Bar parts={[[sum.job, "var(--accent)", "Job"], [sum.brk, "var(--track)", "Breaks"], [sum.internal, "#9fd6f0", "Internal"], [sum.explained, "#c8b4f0", "Reviewed"], [sum.gap, "var(--bad)", "Unallocated"]]} />
        <div className="d-row" style={{ marginTop: 9, gap: 16 }}>
          <span>Paid <b>{sum.att.toFixed(1)}</b></span><span className="d-muted">= job {sum.job.toFixed(1)} + breaks {sum.brk.toFixed(1)} + internal {sum.internal.toFixed(1)}{sum.explained ? ` + reviewed ${sum.explained.toFixed(1)}` : ""} + unallocated {sum.gap.toFixed(1)}</span>
        </div>
        <Note>Reclassifying a gap moves it out of “unallocated” — it never becomes job time or billable work. Original clock events are kept.</Note>
      </Card>}
      <div className={pick ? "d-side d-side-r300" : "d-grid"}>
        {view === "timeline" ? (
          <div className="tl"><div className="tl-scroll"><div className="tl-inner" style={{ width: 168 + TRACK }}>
            <Axis />
            {techs.map(t => {
              const iv = intervalsFor(s, day, t.id); const r = rowTotals(s, day, t.id); const att = day === "mon" ? ATTENDANCE[t.id] : undefined;
              return <div className="tl-row" key={t.id}>
                <div className="tl-name"><b>{t.name}</b><span style={{ color: r.gap > 0 ? "var(--bad)" : undefined }}>{att === "absent" ? "Absent" : r.gap > 0 ? `${dur(r.gap * 60)} unexplained` : "No unexplained gaps"}</span></div>
                <div className="tl-track" style={{ width: TRACK }}>
                  <TrackBg now={day === "mon" ? s.clock : undefined} />
                  {iv.map((x, i) => {
                    const rev = x.gapId ? s.fridayReviews[x.gapId] : undefined;
                    const cls = x.kind === "gap" ? "gap" + (rev ? " reviewed" : "") : x.kind === "break" ? "breakbar" : x.kind === "running" ? "running live" : x.kind;
                    return <button key={i} className={"tl-bar " + cls} style={{ left: X(x.from), width: W(x.from, x.to) }} disabled={x.kind === "break"}
                      onClick={() => x.jobId ? A.open("job", x.jobId) : x.kind !== "break" ? setPick({ tech: t.id, iv: x }) : undefined} aria-label={`${x.kind} ${hhmm(x.from)}–${hhmm(x.to)}`}>
                      {x.kind === "gap" ? <><b>{dur(x.to - x.from)}</b><span>{rev ? `Reviewed: ${rev.cls}` : "Unexplained"}</span></>
                        : x.kind === "break" ? null : <><b>{x.label}</b><span>{hhmm(x.from)}–{x.kind === "running" ? "now" : hhmm(x.to)}</span></>}
                    </button>;
                  })}
                </div>
              </div>;
            })}
          </div></div></div>
        ) : (
          <Card className="flush">
            <Table rowKey={x => x.t.id} rows={totals} cols={[
              { key: "n", label: "Technician", render: x => x.t.name, sort: x => x.t.name },
              { key: "a", label: "Attendance", num: true, render: x => x.r.att.toFixed(2), sort: x => x.r.att },
              { key: "j", label: "Job time", num: true, render: x => x.r.job.toFixed(2), sort: x => x.r.job },
              { key: "b", label: "Breaks", num: true, render: x => x.r.brk.toFixed(2), sort: x => x.r.brk },
              { key: "i", label: "Internal", num: true, render: x => x.r.internal.toFixed(2), sort: x => x.r.internal },
              { key: "e", label: "Reviewed", num: true, render: x => x.r.explained.toFixed(2), sort: x => x.r.explained },
              { key: "g", label: "Unexplained", num: true, render: x => <span style={{ color: x.r.gap ? "var(--bad)" : undefined }}>{x.r.gap.toFixed(2)}</span>, sort: x => x.r.gap },
            ]} />
            <div className="d-row" style={{ padding: "10px 12px", borderTop: "1px solid var(--border)", fontWeight: 600 }}>
              <span className="d-grow">Total ({day === "fri" ? "reconciles with the timeline" : "partial day"})</span>
              <span className="d-mono">{sum.att.toFixed(1)} = {sum.job.toFixed(1)} + {sum.brk.toFixed(1)} + {sum.internal.toFixed(1)} + {sum.explained.toFixed(1)} + {sum.gap.toFixed(1)}</span>
            </div>
          </Card>
        )}
        {pick && <GapPanel day={day} pick={pick} close={() => setPick(null)} />}
      </div>
      {day === "fri" && <div style={{ marginTop: 10 }}><Note>Rows are reconstructed sample intervals that reproduce the Friday buckets exactly: {Object.values(FRIDAY_UNALLOC).reduce((a, b) => a + b, 0).toFixed(1)} h unallocated, {Object.values(FRIDAY_INTERNAL).reduce((a, b) => a + b, 0).toFixed(1)} h internal.</Note></div>}
    </Page>
  );
}

function GapPanel({ day, pick, close }: { day: "fri" | "mon"; pick: { tech: string; iv: Interval }; close: () => void }) {
  const [s] = useDerived();
  const [cls, setCls] = useState<"internal" | "explained">("explained");
  const [reason, setReason] = useState("Waiting for parts from stores — confirmed by technician");
  const { iv } = pick;
  const all = intervalsFor(s, day, pick.tech);
  const idx = all.indexOf(all.find(x => x.from === iv.from)!);
  const before = all[idx - 1], after = all[idx + 1];
  const rev = iv.gapId ? s.fridayReviews[iv.gapId] : undefined;
  return (
    <Card title={iv.kind === "gap" ? `Gap · ${pname(pick.tech)}` : `${iv.kind} · ${pname(pick.tech)}`} aside={<Btn sm kind="ghost" onClick={close}>Close</Btn>}>
      <dl className="d-kv"><dt>Interval</dt><dd>{hhmm(iv.from)}–{hhmm(iv.to)} ({dur(iv.to - iv.from)})</dd>
        {iv.kind === "gap" && <><dt>Clock-off</dt><dd className="d-mono">{hhmm(iv.from)} {before?.label ? `· ${before.label}` : ""}</dd><dt>Next clock-on</dt><dd className="d-mono">{after ? `${hhmm(after.from)} · ${after.label ?? after.kind}` : day === "mon" ? "none yet (live)" : "—"}</dd></>}
        <dt>Source</dt><dd>Sample AssetMinder export · raw events unchanged</dd></dl>
      <div className="d-divider" />
      {iv.kind !== "gap" ? <span className="d-muted">{iv.label}</span> : day === "mon" ? <><Note>Live gap — record a reason on the Live Board. Raw clocking stays as imported.</Note><Btn sm style={{ marginTop: 8 }} onClick={() => go("Workshop", "live")}>Open Live Board</Btn></> : rev ? (
        <div className="d-grid" style={{ gap: 8 }}><Flag tone="ok">Classified as {rev.cls === "internal" ? "internal work" : "explained non-job time"} by {rev.by} at {rev.at}: “{rev.reason}”</Flag><Btn sm onClick={() => A.undoFriday(iv.gapId!)}>Revert classification</Btn></div>
      ) : (
        <div className="d-grid" style={{ gap: 8 }}>
          <Field label="Classification"><Seg value={cls} onChange={setCls} options={[["explained", "Explained, non-job"], ["internal", "Internal work"]]} /></Field>
          <Field label="Reason"><input className="d-input" value={reason} onChange={e => setReason(e.target.value)} /></Field>
          <Btn kind="primary" disabled={!reason.trim()} onClick={() => A.reviewFriday(iv.gapId!, cls, reason)}>Save classification</Btn>
          <Note>Does not make the time billable or change the allocation numerator.</Note>
        </div>
      )}
    </Card>
  );
}

/* ═════════════════════════ JOB CARDS ═════════════════════════ */
export function JobCards() {
  const [s, d] = useDerived();
  const jobId = s.focus.job ?? "JOB-1041";
  const setJobId = (id: string) => A.focus("job", id);
  const [mode, setMode] = useState<"source" | "writeup" | "review">("review");
  const job = s.jobs.find(j => j.id === jobId)!;
  const jc = cardFor(s, jobId);
  const facts = JOB_CARD_FACTS[jobId];
  const listJobs = [...d.completed, ...d.awaitingQc, ...d.inProgress.slice(0, 3), ...d.hopper];
  const rows = jc.rows.map(r => { const unit = r.basis === "oem" ? r.oem : r.basis === "haynes" ? r.haynes : r.manual; const hours = unit * r.qty; return { ...r, unit, hours, labour: hours * RATE }; });
  const est = { hours: rows.reduce((a, r) => a + r.hours, 0), labour: rows.reduce((a, r) => a + r.labour, 0), parts: rows.reduce((a, r) => a + r.parts * r.qty, 0) };
  const answered = facts ? facts.questions.every((_, i) => jc.answers[i]) : true;
  return (
    <Page>
      <Head title="Job Cards" sub="One job record, three modes: estimate the work, write up what was actually done, then review. Estimates never become performed work.">
        <Seg value={mode} onChange={setMode} options={[["source", "Source & Estimate"], ["writeup", "Work Write-up"], ["review", "Review"]]} label="Mode" />
      </Head>
      <div className="d-side d-side-250">
        <Card className="flush" title={undefined}>
          <div style={{ padding: "12px 14px 6px" }} className="d-eyebrow">Jobs</div>
          <div className="d-list" style={{ padding: "0 8px 8px" }}>{listJobs.map(j => (
            <button key={j.id} onClick={() => setJobId(j.id)} className="d-li" style={{ border: 0, background: j.id === jobId ? "var(--accent-faint)" : "none", borderRadius: 10, padding: "8px 8px", cursor: "pointer", color: "inherit", textAlign: "left", width: "100%" }}>
              <div className="d-grow"><b style={{ fontWeight: 500 }}>{j.id}</b><div className="d-muted" style={{ fontSize: 11 }}>{cname(j.customer)}</div></div>
              {j.status === "completed" ? <Chip tone={j.invoice === "ready" ? "ok" : "warn"}>{j.invoice === "ready" ? "Ready" : "Write-up"}</Chip> : <JobChip j={j} />}
            </button>))}</div>
        </Card>
        <div className="d-grid" style={{ minWidth: 0 }}>
          <Card>
            <div className="d-row"><div className="d-grow"><div className="d-eyebrow">{job.workType}</div><div style={{ fontSize: 17, fontWeight: 600 }}>{job.id} · {cname(job.customer)} · {vehicleLabel(s, job.vehicle).reg}</div><div className="d-muted">{job.complaint} · technician {pname(job.tech)}</div></div>
              {job.status === "completed" ? <Chip tone={job.invoice === "ready" ? "ok" : "warn"}>{job.invoice === "ready" ? "Invoice-ready" : "Write-up blocked"}</Chip> : <JobChip j={job} />}</div>
          </Card>

          {mode === "source" && <>
            <Card title="Source document">
              <div className="d-row">
                <label className="d-btn" style={{ cursor: "pointer" }}><input type="file" hidden onChange={e => { const f = e.target.files?.[0]; if (f) A.noteFile(jobId, f.name); }} />Attach job card / inspection sheet</label>
                <Btn kind="primary" onClick={() => A.loadSample(jobId)}>Load sample job card</Btn>
                <span className="d-muted">{jc.sourceFile || "No source attached yet"}</span>
              </div>
            </Card>
            <Card title="Labour estimate" aside={<span className="d-row" style={{ gap: 8 }}>
              <span className="d-muted">Demo rate €{RATE}/h</span>
              <span className="d-muted">Surcharge €</span><NumInput value={jc.surcharge} onChange={n => A.setSurcharge(jobId, n)} width={80} label="Surcharge" />
              <Chip title="No tax rate configured in the demo">Tax: not configured · excluded</Chip></span>}>
              {rows.length ? (
                <div className="d-scroll"><table className="d-table">
                  <thead><tr><th>Operation</th><th>Note</th><th className="num">OEM ref (sample)</th><th className="num">Haynes ref (sample)</th><th>Basis</th><th className="num">Unit h</th><th className="num">Qty</th><th className="num">Total h</th><th className="num">Parts €</th><th className="num">Labour €</th><th /></tr></thead>
                  <tbody>{rows.map(r => (
                    <tr key={r.id}>
                      <td><input className="d-input edit" style={{ width: 200 }} value={r.op} onChange={e => A.editRow(jobId, r.id, { op: e.target.value })} aria-label="Operation" /></td>
                      <td><input className="d-input edit" style={{ width: 120 }} value={r.note} onChange={e => A.editRow(jobId, r.id, { note: e.target.value })} aria-label="Note" /></td>
                      <td className="num">{r.oem.toFixed(1)}</td><td className="num">{r.haynes.toFixed(1)}</td>
                      <td><select className="d-select" value={r.basis} onChange={e => A.editRow(jobId, r.id, { basis: e.target.value as "oem" })} aria-label="Time basis"><option value="oem">OEM</option><option value="haynes">Haynes</option><option value="manual">Manual</option></select></td>
                      <td className="num">{r.basis === "manual" ? <NumInput value={r.manual} step={0.1} width={70} onChange={n => A.editRow(jobId, r.id, { manual: n })} label="Unit hours" /> : r.unit.toFixed(1)}</td>
                      <td className="num"><NumInput value={r.qty} width={56} onChange={n => A.editRow(jobId, r.id, { qty: n })} label="Quantity" /></td>
                      <td className="num">{r.hours.toFixed(1)}</td>
                      <td className="num"><NumInput value={r.parts} width={80} onChange={n => A.editRow(jobId, r.id, { parts: n })} label="Parts" /></td>
                      <td className="num">{eur(r.labour)}</td>
                      <td><Btn sm kind="ghost" onClick={() => A.removeRow(jobId, r.id)} aria-label="Remove row">✕</Btn></td>
                    </tr>))}</tbody>
                </table></div>
              ) : <Empty>Load the sample job card or add an operation to build the estimate.</Empty>}
              <div className="d-row" style={{ marginTop: 10 }}><Btn sm onClick={() => A.addRow(jobId)}>Add operation</Btn></div>
            </Card>
            <div className="d-grid d-g2">
              <Card title="Estimate totals"><dl className="d-kv"><dt>Hours</dt><dd>{est.hours.toFixed(1)} h</dd><dt>Labour</dt><dd>{eur(est.labour)}</dd><dt>Parts</dt><dd>{eur(est.parts)}</dd><dt>Surcharge</dt><dd>{eur(jc.surcharge)}</dd><dt><b>Estimated total</b></dt><dd><b>{eur(est.labour + est.parts + jc.surcharge)}</b> <span className="d-faint">excl. tax</span></dd></dl></Card>
              <Card title="Actual (job record)">{facts && job.net !== undefined ? <dl className="d-kv"><dt>Labour</dt><dd>{facts.labourHours} h × €{RATE} = {eur(facts.labourHours * RATE)}</dd><dt>Parts</dt><dd>{eur(facts.partsNet)}</dd><dt><b>Net draft value</b></dt><dd><b>{eur(job.net)}</b></dd></dl> : <span className="d-muted">No actual time recorded yet. Clocked time: {elapsed(job, s.clock)} min.</span>}
                <Note>Estimated, actual and billable figures are kept separate. Editing the estimate never rewrites actual time or the approved record.</Note></Card>
            </div>
          </>}

          {mode === "writeup" && <div className="d-grid d-g2">
            <Card title="Technician notes (as recorded)"><p style={{ margin: 0, fontSize: 14 }}>“{job.notes ?? "No notes recorded yet."}”</p><Note>Source: job record. The assistant drafts from these words only.</Note></Card>
            <Card title="Performed-work checklist">
              {facts ? <div className="d-list">{facts.supported.map(x => <div className="d-li" key={x}><Chip tone="ok">Supported</Chip><span>{x}</span></div>)}
                {facts.questions.map((q, i) => <div className="d-li" key={q.q}><Chip tone="warn">Question</Chip><span className="d-grow">{q.q}</span><span className="d-muted">{jc.answers[i] ?? "unanswered"}</span></div>)}</div> : <Empty>No write-up needed for this job yet.</Empty>}
            </Card>
            <Card title={<>Customer narrative <span className="d-muted">v{jc.version}</span></>} style={{ gridColumn: "1 / -1" }}>
              <textarea className="d-textarea" rows={4} value={jc.narrative} onChange={e => A.editNarrative(jobId, e.target.value)} aria-label="Customer narrative" />
              <Note>Only confirmed work belongs here. Unconfirmed items stay as questions outside the customer-facing text. Editing after approval invalidates the approval.</Note>
            </Card>
          </div>}

          {mode === "review" && <div className="d-grid d-g2">
            <Card title="1 · Technician confirmation" aside={jc.techConfirmed ? <Chip tone="ok">Confirmed</Chip> : <Chip tone="warn">Pending</Chip>}>
              {facts ? <div className="d-grid" style={{ gap: 10 }}>
                {facts.questions.map((q, i) => <Field key={q.q} label={q.q}><Seg value={(jc.answers[i] ?? "") as string} onChange={v => A.answer(jobId, i, v)} options={q.options.map(o => [o, o] as [string, string])} /></Field>)}
                <Btn kind="primary" disabled={!answered || jc.techConfirmed} onClick={() => A.techConfirm(jobId)}>Confirm as {pname(job.tech)}</Btn>
              </div> : <span className="d-muted">This job doesn't need a write-up review.</span>}
            </Card>
            <Card title="2 · Service review" aside={jc.approved ? <Chip tone="ok">Approved v{jc.approvedVersion}</Chip> : <Chip>{jc.techConfirmed ? "Ready to review" : "Waiting on technician"}</Chip>}>
              <div className="d-grid" style={{ gap: 10 }}>
                <div className="d-card" style={{ background: "var(--surface-2)" }}><div className="d-eyebrow">Draft v{jc.version}</div><p style={{ margin: "6px 0 0" }}>{jc.narrative}</p></div>
                {canSeeMoney(s) && job.net !== undefined && <span className="d-muted">On approval: {job.id} ({eur(job.net)}) moves to invoice-ready. Invoice-ready {d.ready.length} / {eur(d.readyNet)} → {d.ready.length + (job.invoice === "blocked" ? 1 : 0)} / {eur(d.readyNet + (job.invoice === "blocked" ? job.net : 0))}. Total awaiting invoicing stays {eur(d.completedNet)}.</span>}
                <Btn kind="primary" disabled={!jc.techConfirmed || jc.approved} onClick={() => A.approveWriteup(jobId)}>Approve as Jonathan Keenan</Btn>
                <Note>The Job Card Assistant prepared this draft and cannot approve it. Approval binds to v{jc.version}.</Note>
              </div>
            </Card>
          </div>}
        </div>
      </div>
    </Page>
  );
}

/* ═════════════════════════ PARTS & BLOCKERS ═════════════════════════ */
export function Parts() {
  const [s, d] = useDerived();
  const reserved = [
    { part: "Brake pads, rear axle set", job: "JOB-1062", qty: 2, supplier: "Renault Genuine Parts", status: "Issued" },
    { part: "Timing belt kit", job: "JOB-1063", qty: 1, supplier: "Renault Genuine Parts", status: "Issued" },
    { part: "Airbag, rear suspension", job: "JOB-1065", qty: 2, supplier: "Midland CV Factors (fictional)", status: "Reserved" },
    { part: "Reversing camera kit", job: "JOB-1068", qty: 1, supplier: "Midland CV Factors (fictional)", status: "Reserved" },
  ];
  const blockers = s.jobs.filter(j => j.partBlocker);
  return (
    <Page>
      <Head title="Parts & Blockers" sub="Parts holding up live work, with an owner and the effect on delivery. Not a purchasing system." />
      <div className="d-grid d-g3" style={{ marginBottom: 14 }}>
        <Metric label="Jobs blocked by parts" value={d.awaitingParts.length} tone={d.awaitingParts.length ? "warn" : undefined} />
        <Metric label="Blocking a handover" value={blockers.filter(j => !j.partBlocker!.received && s.gates[j.vehicle]).length} hint="V008 waiting on the rear caliper" />
        <Metric label="Reserved for live jobs" value={reserved.length} />
      </div>
      <Card className="flush" title={undefined}>
        <div style={{ padding: "14px 16px 4px" }}><b>Blockers</b></div>
        <Table rowKey={j => j.id} rows={blockers} cols={[
          { key: "p", label: "Part", render: j => j.partBlocker!.part, sort: j => j.partBlocker!.part },
          { key: "j", label: "Job", render: j => <JLink id={j.id} /> },
          { key: "v", label: "Vehicle", render: j => <VLink id={j.vehicle} /> },
          { key: "s", label: "Source", render: j => j.partBlocker!.supplier },
          { key: "o", label: "Owner", render: j => pname(j.partBlocker!.owner) },
          { key: "e", label: "ETA", render: j => j.partBlocker!.received ? <Chip tone="ok">Received</Chip> : j.partBlocker!.eta, sort: j => j.partBlocker!.eta },
          { key: "f", label: "Effect", render: j => j.vehicle === "V008" ? "Blocks V008 repair, retest and handover" : j.id === "JOB-1048" ? "Blocks C104 CVRT retest" : "Customer vehicle off road until fitted" },
          { key: "a", label: "", render: j => !j.partBlocker!.received ? <Btn sm onClick={() => A.receivePart(j.id)}>Mark received</Btn> : <span className="d-muted">{j.status.replace("_", " ")}</span> },
        ]} />
      </Card>
      <div style={{ height: 14 }} />
      <Card className="flush"><div style={{ padding: "14px 16px 4px" }}><b>Reserved for jobs in progress</b></div>
        <Table rowKey={r => r.part} rows={reserved} cols={[
          { key: "p", label: "Part", render: r => r.part }, { key: "j", label: "Job", render: r => <JLink id={r.job} /> }, { key: "q", label: "Qty", num: true, render: r => r.qty },
          { key: "s", label: "Source", render: r => r.supplier }, { key: "st", label: "Status", render: r => <Chip>{r.status}</Chip> },
        ]} />
      </Card>
      <div style={{ marginTop: 10 }}><Note>Receiving a part only unblocks the repair. It never changes a CVRT result or releases a vehicle.</Note></div>
    </Page>
  );
}

/* ═════════════════════════ BREAKDOWN ═════════════════════════ */
export function Breakdown() {
  const [s] = useDerived();
  const calls = s.jobs.filter(j => j.complaint.startsWith("Breakdown"));
  const past = [
    { at: "Fri 16 Oct 18:40", what: "Tyre blow-out, M6 near Moate — tyre fitted roadside", cust: "c-mayo", tech: "t-shane" },
    { at: "Wed 14 Oct 07:15", what: "Non-start, customer depot — batteries replaced", cust: "c-shannon", tech: "t-robbie" },
  ];
  return (
    <Page>
      <Head title="Breakdown" sub="On-call cover and sample incidents. No maps, GPS tracking or dispatch integration in the demo."><Btn kind="primary" onClick={A.breakdownCall}>Log sample call</Btn></Head>
      <div className="d-grid d-g3" style={{ marginBottom: 14 }}>
        <Card title="On call this week"><div className="d-row"><Avatar id={ON_CALL.thisWeek} /><div><b>{pname(ON_CALL.thisWeek)}</b><div className="d-muted">{ON_CALL.van}</div></div></div></Card>
        <Card title="Next week"><div className="d-row"><Avatar id={ON_CALL.nextWeek} /><b>{pname(ON_CALL.nextWeek)}</b></div></Card>
        <Card title="Breakdown van"><div className="d-row"><Chip tone="ok">Available</Chip><span className="d-muted">{ON_CALL.van} · in yard</span></div></Card>
      </div>
      <Card title="Calls">
        <div className="d-list">
          {calls.map(j => <div className="d-li" key={j.id}><Chip tone="warn">Today</Chip><div className="d-grow">{j.complaint}<div className="d-muted"><CLink id={j.customer} /> · follow-up <JLink id={j.id} /> in the hopper</div></div></div>)}
          {past.map(p => <div className="d-li" key={p.at}><Chip>{p.at}</Chip><div className="d-grow">{p.what}<div className="d-muted"><CLink id={p.cust} /> · {pname(p.tech)}</div></div></div>)}
        </div>
      </Card>
    </Page>
  );
}

export const WORKSHOP: Record<string, () => JSX.Element> = { overview: WorkshopOverview, live: LiveBoard, planner: Planner, clocking: Clocking, jobcards: JobCards, parts: Parts, breakdown: Breakdown };
