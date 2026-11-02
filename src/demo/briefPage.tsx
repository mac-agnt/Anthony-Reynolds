/* Morning Brief: what Anthony needs at 08:00, in one page. Every number is
   derived from the store, yard.ts or the yard fixtures, so it moves when a
   hold is released, a part is received or a message is confirmed. */
import { useEffect, useState } from "react";
import "./brief.css";
import { A, approvals, dur, eur, handoverGates, hhmm, pname, useDerived, type ApprovalItem, type Derived, type State } from "./store";
import { SNAPSHOT_DATE } from "./fixtures";
import { go } from "./nav";
import { Bar, Btn, Card, Chip, Page, Seg, VLink } from "./ui";
import { STATUS, YESTERDAY, commsCounts, fmtWhen, inspectionCounts, partsOverview, vehicleByKey, workshopOverview, yardCounts, type Tone } from "./yard";

/* One short phrase per open release gate, in the order a person would say it. */
const GATE_PHRASE: [string, string][] = [
  ["test", "failed CVRT"], ["parts", "rear caliper outstanding"], ["documents", "documents outstanding"], ["accounts", "accounts clearance required"],
];
const list = (xs: string[]) => xs.length <= 1 ? xs.join("") : xs.slice(0, -1).join(", ") + " and " + xs[xs.length - 1];
const n = (x: number, one: string, many = one + "s") => `${x} ${x === 1 ? one : many}`;

function model(s: State, d: Derived) {
  const c = yardCounts(s), w = workshopOverview(s), p = partsOverview(s), ins = inspectionCounts(s), cm = commsCounts(s);
  const gates = handoverGates(s, "V008");
  const open = gates.list.filter(g => !g.ok);
  const phrases = GATE_PHRASE.filter(([k]) => open.some(g => g.key === k)).map(([, t]) => t);
  const v8 = vehicleByKey(s, "V008");
  const unalloc = d.tn.filter(t => t.state === "unallocated");
  const util = Math.floor(d.allocationRate * 100);
  const decisions: { id: string; chip: string; title: string; why: string; label: string; run: () => void; approve?: boolean }[] = [
    ...approvals(s, d).map((a: ApprovalItem) => ({
      id: a.id, chip: a.queue, title: a.title.replace(" — ", ": "), why: a.consequence,
      label: a.queue === "Discount approval" ? "Approve" : "Review", approve: a.queue === "Discount approval",
      run: a.queue === "Discount approval" ? () => A.approveDiscount(a.record) : () => go("Work", "approvals"),
    })),
    ...(ins.new > 0 ? [{ id: "ins", chip: "Inspections", title: `${n(ins.new, "Renault notice")} with a reminder ready to send`, why: "Nothing goes to the customer until you approve it.", label: "Review", run: () => go("Inspections", "notices") }] : []),
    ...(cm.review > 0 ? [{ id: "comms", chip: "Messages", title: `${n(cm.review, "message")} Pulse could not match with confidence`, why: "Confirm the suggested vehicle or dismiss.", label: "Review", run: () => go("Comms", "inbox") }] : []),
    ...(c.approval.length > 0 ? [{ id: "appr", chip: "Customers", title: `${n(c.approval.length, "customer")} still to approve extra work`, why: c.approval.map(v => `${v.customer} (${v.reg})`).join(", "), label: "Open", run: () => go("Yard", "live") }] : []),
  ];
  return { c, w, p, ins, cm, gates, open, phrases, v8, unalloc, util, decisions, held: c.accounts };
}
type Model = ReturnType<typeof model>;

/** The brief as plain sentences: for the read-aloud mode, copy and print. */
function script(d: Derived, m: Model): string[] {
  const y = YESTERDAY;
  const risk = m.c.atRisk.map(v => `${v.reg} for ${v.customer} (${fmtWhen(v.promised)})`);
  const out = [
    "Good morning Anthony.",
    `Yesterday the workshop completed ${y.jobsCompleted} jobs. ${eur(d.readyNet)} across ${n(d.ready.length, "job")} is ready for invoicing. ${y.arrived} vehicles arrived and ${y.departed} departed. Technician utilisation was ${m.util}%.`,
    `Today there are ${m.w.openJobs} open jobs and ${m.p.open.length} are blocked by parts, which puts about ${m.p.lostHours.toFixed(1)} hours of workshop capacity at risk. ${n(m.c.atRisk.length, "vehicle")} promised today ${m.c.atRisk.length === 1 ? "is" : "are"} at risk${risk.length ? `: ${list(risk)}` : ""}. ${n(m.unalloc.length, "technician")} ${m.unalloc.length === 1 ? "is" : "are"} unallocated${m.unalloc.length ? `: ${list(m.unalloc.map(t => pname(t.id)))}` : ""}. ${n(m.ins.awaiting, "inspection customer")} ${m.ins.awaiting === 1 ? "has" : "have"} not replied yet.`,
    m.open.length ? `Priority: V008, ${m.v8?.reg ?? ""} for ${m.v8?.customer ?? ""}, cannot be released because of ${list(m.phrases)}.` : `Priority: V008 is clear for handover.`,
    m.decisions.length ? `${n(m.decisions.length, "decision")} for you: ${list(m.decisions.map(x => x.title))}.` : "There are no decisions waiting for you.",
    `On site: ${m.c.onSite} vehicles. ${m.c.readyN} ready to leave, ${m.c.blockedN} blocked, ${m.c.overnightN} staying tonight and ${n(m.c.unknownN, "unknown vehicle")}.`,
  ];
  return out;
}

const toneVar = (t: Tone, k?: string) => k === "waiting_approval" ? "var(--faint)" : t === "bad" ? "var(--bad)" : t === "warn" ? "var(--warn)" : t === "ok" ? "var(--ok)" : "var(--accent)";

function Fig({ v, l, hint, tone, on }: { v: string | number; l: string; hint?: string; tone?: "ok" | "warn" | "bad"; on?: () => void }) {
  const inner = <><span className="b-fig-v">{v}</span><span className="b-fig-l">{l}</span>{hint && <span className="b-fig-h">{hint}</span>}</>;
  return on ? <button className={"b-fig " + (tone ?? "")} onClick={on}>{inner}</button> : <div className={"b-fig " + (tone ?? "")}>{inner}</div>;
}

export function BriefPage() {
  const [s, d] = useDerived();
  const [mode, setMode] = useState<"brief" | "read">("brief");
  const m = model(s, d);
  const text = script(d, m);
  const speak = typeof window !== "undefined" && "speechSynthesis" in window;

  // Scope the print rules to this page only while it is mounted.
  useEffect(() => { document.body.classList.add("b-printing"); return () => { document.body.classList.remove("b-printing"); window.speechSynthesis?.cancel(); }; }, []);
  const copy = async () => {
    try { await navigator.clipboard.writeText(text.join("\n\n")); A.toast("Brief copied. Paste it into WhatsApp or email."); } catch { A.toast("Copy is not available in this browser"); }
  };
  const read = () => { if (!speak) return; window.speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(text.join(" ")); u.lang = "en-IE"; window.speechSynthesis.speak(u); };

  return (
    <Page>
      <div className="b-sheet">
        <header className="b-head">
          <div className="d-grow">
            <div className="b-eyebrow">Management briefing · {SNAPSHOT_DATE} · 08:00</div>
            <h1 className="b-hello">GOOD MORNING ANTHONY</h1>
            <p className="b-lede">Live at {hhmm(s.clock)}. Keyloop figures, the yard, the workshop floor and your messages, in one place.</p>
          </div>
          <div className="b-tools d-row">
            <Seg value={mode} onChange={setMode} label="Layout" options={[["brief", "Brief"], ["read", "Read aloud"]]} />
            <Btn sm onClick={copy}>Copy text</Btn>
            <Btn sm onClick={() => window.print()}>Print</Btn>
          </div>
        </header>

        {mode === "read" ? (
          <section className="b-read" aria-label="Brief as spoken sentences">
            {text.map((t, i) => <p key={i} className={i === 0 ? "b-read-h" : ""}>{t}</p>)}
            {speak && <div className="d-row b-noprint"><Btn onClick={read}>Read it to me</Btn><Btn kind="ghost" onClick={() => window.speechSynthesis.cancel()}>Stop</Btn></div>}
          </section>
        ) : (
          <>
            <div className="d-grid d-g2 b-two">
              <Card title="Yesterday" aside={<span className="d-faint">Friday 16 October</span>}>
                <div className="b-figs">
                  <Fig v={YESTERDAY.jobsCompleted} l="workshop jobs completed" />
                  <Fig v={eur(d.readyNet)} l="ready for invoicing" hint={`${n(d.ready.length, "job")}`} on={() => go("Finance", "readiness")} />
                  <Fig v={YESTERDAY.arrived} l="vehicles arrived" />
                  <Fig v={YESTERDAY.departed} l="vehicles departed" />
                  <Fig v={`${m.util}%`} l="technician utilisation" hint={`${d.fri.job.toFixed(1)} of ${(d.fri.paid - d.fri.breaks).toFixed(1)} hours on jobs`} />
                </div>
              </Card>
              <Card title="Today" aside={<span className="d-faint">{n(m.c.onSite, "vehicle")} on site</span>}>
                <div className="b-figs">
                  <Fig v={m.w.openJobs} l="open jobs" on={() => go("Workshop", "overview")} />
                  <Fig v={m.p.open.length} l="blocked by parts" tone="warn" hint={`${m.p.lostHours.toFixed(1)} h capacity at risk`} on={() => go("Workshop", "parts")} />
                  <Fig v={m.c.atRisk.length} l="promised today, at risk" tone={m.c.atRisk.length ? "bad" : "ok"} on={() => document.getElementById("b-risk")?.scrollIntoView({ block: "start" })} />
                  <Fig v={m.unalloc.length} l="technicians unallocated" tone={m.unalloc.length ? "warn" : "ok"} on={() => go("Workshop", "live")} />
                  <Fig v={m.ins.awaiting} l="inspection customers awaiting replies" on={() => go("Inspections", "replies")} />
                </div>
              </Card>
            </div>

            <section className={"b-priority " + (m.open.length ? "bad" : "ok")} aria-labelledby="b-pri-h">
              <div className="b-pri-top"><span className="b-eyebrow" id="b-pri-h">Priority</span>{m.v8 && <VLink id="V008" />}</div>
              {m.open.length ? (
                <>
                  <h2>V008 ({m.v8?.reg}, {m.v8?.customer}) cannot be released because: {list(m.phrases)}.</h2>
                  <ul className="b-gates">
                    {m.gates.list.map(g => (
                      <li key={g.key} className={g.ok ? "ok" : "bad"}>
                        <Chip tone={g.ok ? "ok" : "bad"}>{g.ok ? "Clear" : "Open"}</Chip>
                        <b>{g.label}</b><span>{g.detail}</span><em>{pname(g.owner)}</em>
                      </li>
                    ))}
                  </ul>
                </>
              ) : <h2>V008 is clear for handover. Every release gate is closed.</h2>}
            </section>

            <div className="d-grid d-g2 b-two">
              <Card title="Decisions for you" aside={<Chip tone={m.decisions.length ? "warn" : "ok"}>{m.decisions.length}</Chip>}>
                {m.decisions.length === 0 && <p className="d-muted">Nothing is waiting on you.</p>}
                <div className="b-rows">
                  {m.decisions.map(x => (
                    <div key={x.id} className="b-row">
                      <div className="d-grow"><div className="b-row-t"><Chip>{x.chip}</Chip> {x.title}</div><div className="d-muted">{x.why}</div></div>
                      <Btn sm kind={x.approve ? "primary" : undefined} className="b-noprint" onClick={x.run}>{x.label}</Btn>
                    </div>
                  ))}
                </div>
              </Card>

              <Card title="Promised today and at risk" aside={<Chip tone={m.c.atRisk.length ? "bad" : "ok"}>{m.c.atRisk.length}</Chip>}>
                <div id="b-risk" />
                {m.c.atRisk.length === 0 && <p className="d-muted">Every promise for today is on track.</p>}
                <div className="b-rows">
                  {m.c.atRisk.map(v => (
                    <div key={v.key} className="b-row">
                      <div className="d-grow">
                        <div className="b-row-t"><VLink id={v.key} /> <span className="d-muted">{v.customer}</span></div>
                        <div className="d-muted">{v.blocker ?? `${STATUS[v.status].short}: ${v.row.reason}, close to the promised time`}</div>
                      </div>
                      <div className="b-when"><small>Promised</small><b>{fmtWhen(v.promised)}</b></div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            <div className="d-grid d-g3 b-three">
              <Card title="Unallocated technicians" aside={<Chip tone={m.unalloc.length ? "warn" : "ok"}>{m.unalloc.length}</Chip>}>
                {m.unalloc.length === 0 && <p className="d-muted">Everyone present is on a job.</p>}
                <div className="b-rows">
                  {m.unalloc.map(t => (
                    <div key={t.id} className="b-row">
                      <div className="d-grow"><div className="b-row-t">{pname(t.id)}</div><div className="d-muted">Present, off a job since {t.since}{t.next ? `. Next: ${t.next.id} at ${t.next.plannedStart}` : ". Nothing queued"}</div></div>
                      <div className="b-when"><small>Idle</small><b>{dur(t.gapMin ?? 0)}</b></div>
                    </div>
                  ))}
                </div>
                {m.unalloc.length > 0 && <div className="b-foot b-noprint"><Btn sm onClick={() => go("Workshop", "planner")}>Open planner</Btn></div>}
              </Card>

              <Card title="Accounts holds" aside={<Chip tone={m.held.length || m.open.some(g => g.key === "accounts") ? "bad" : "ok"}>{m.held.length + (m.open.some(g => g.key === "accounts") ? 1 : 0)}</Chip>}>
                {m.held.length === 0 && !m.open.some(g => g.key === "accounts") && <p className="d-muted">No vehicle is held by accounts.</p>}
                <div className="b-rows">
                  {m.held.map(v => (
                    <div key={v.key} className="b-row">
                      <div className="d-grow"><div className="b-row-t"><VLink id={v.key} /> <span className="d-muted">{v.customer}</span></div><div className="d-muted">Release needs Caroline Glynn</div></div>
                      <div className="b-when"><small>Owed</small><b>{eur(v.balance)}</b></div>
                    </div>
                  ))}
                  {m.open.some(g => g.key === "accounts") && m.v8 && (
                    <div className="b-row">
                      <div className="d-grow"><div className="b-row-t"><VLink id="V008" /> <span className="d-muted">{m.v8.customer}</span></div><div className="d-muted">Clearance still to be recorded</div></div>
                      <div className="b-when"><small>Status</small><b>Open</b></div>
                    </div>
                  )}
                </div>
              </Card>

              <Card title="Yard summary" aside={<Btn sm kind="ghost" className="b-noprint" onClick={() => go("Yard", "live")}>Open yard</Btn>}>
                <dl className="b-kv">
                  <dt>On site</dt><dd>{m.c.onSite}</dd>
                  <dt>Arrived today</dt><dd>{m.c.arrivedToday}</dd>
                  <dt>Ready to leave</dt><dd className="ok">{m.c.readyN}</dd>
                  <dt>Blocked</dt><dd className={m.c.blockedN ? "bad" : ""}>{m.c.blockedN}</dd>
                  <dt>Staying overnight</dt><dd>{m.c.overnightN}</dd>
                  <dt>Unknown or unmatched</dt><dd className={m.c.unknownN ? "warn" : ""}>{m.c.unknownN}</dd>
                </dl>
                <Bar parts={(["ready", "workshop", "waiting_approval", "waiting_parts", "cvrt_issue", "accounts_hold", "unknown"] as const).map(k => [m.c.all.filter(v => v.status === k).length, toneVar(STATUS[k].tone, k), STATUS[k].short] as [number, string, string])} />
                <div className="b-legend">{(["ready", "workshop", "waiting_approval", "waiting_parts", "cvrt_issue", "accounts_hold", "unknown"] as const).map(k => (
                  <span key={k}><i style={{ background: toneVar(STATUS[k].tone, k) }} />{STATUS[k].short} {m.c.all.filter(v => v.status === k).length}</span>
                ))}</div>
              </Card>
            </div>
          </>
        )}
      </div>
    </Page>
  );
}
