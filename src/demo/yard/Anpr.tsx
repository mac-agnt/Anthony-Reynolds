import { useEffect, useMemo, useRef, useState } from "react";
import { A, cname, useDemo } from "../store";
import { Btn, Card, CLink, Field, Flag, Head, JLink, Page, Plate } from "../ui";
import { KeyloopBadge } from "../keyloop";
import { ANPR_EVENTS, anprPipeline, companyList, identityOf, openVehicle, vehicleByKey, type AnprEvent, type PipelineStep } from "../yard";
import { isNarrow, toneCls, useReducedMotion } from "./shared";
import type { State } from "../store";

type Tone = "ok" | "warn" | "bad" | "acc" | undefined;
const SIM_ID = "ANPR-0943";
const STEP_MS = 650;

interface View { pending: boolean; res: State["yard"]["anpr"][string] | undefined; reg: string | null; model: string | null; customerId: string | null; label: string; tone: Tone }

function viewOf(s: State, e: AnprEvent): View {
  const res = s.yard.anpr[e.id];
  const pending = (e.outcome === "unknown" || e.outcome === "unmatched") && !res;
  const id = e.direction === "in" && e.key && !pending ? identityOf(s, e.key) : null;
  let label = "MATCHED", tone: Tone = "ok";
  if (e.direction === "out") { label = "EXIT"; tone = undefined; }
  else if (pending) { label = e.outcome === "unknown" ? "UNKNOWN VEHICLE" : "UNMATCHED"; tone = "bad"; }
  else if (res?.kind === "matched") label = "MATCHED BY HAND";
  else if (res?.kind === "created") label = "VEHICLE CREATED";
  else if (e.outcome === "no_booking") { label = "MATCHED, NO BOOKING"; tone = "warn"; }
  return { pending, res, reg: id?.reg ?? null, model: id?.model ?? null, customerId: id?.customerId ?? null, label, tone };
}

const dayRank = (d: AnprEvent["day"]) => (d === "Today" ? 0 : 1);

/* ── pipeline stepper ─────────────────────────────────────────────────────── */
type StepView = PipelineStep["state"] | "run" | "wait";
const GLYPH: Record<StepView, string> = { ok: "✓", warn: "!", fail: "✕", skip: "-", run: "", wait: "" };
const STEP_TONE: Record<StepView, string> = { ok: "t-ok", warn: "t-warn", fail: "t-bad", skip: "t-n", run: "t-acc", wait: "t-n" };

function Stepper({ steps }: { steps: { label: string; detail: string; state: StepView }[] }) {
  return (
    <ol className="y-steps" aria-label="ANPR pipeline">
      {steps.map((st, i) => (
        <li key={st.label} className={`y-step ${STEP_TONE[st.state]} ${st.state}`} aria-current={st.state === "run" ? "step" : undefined}>
          <span className="y-node" aria-hidden>{GLYPH[st.state] || i + 1}</span>
          <div className="lb">{st.label}</div>
          <div className="dt">{st.state === "wait" ? "Waiting" : st.state === "run" ? "Working" : st.detail}</div>
        </li>
      ))}
    </ol>
  );
}

/* ── character diff for the review panel ──────────────────────────────────── */
const Diff = ({ a, b }: { a: string; b: string }) => <>{[...a].map((ch, i) => (b[i] !== ch ? <span key={i} className="d">{ch}</span> : <span key={i}>{ch}</span>))}</>;

export function AnprEvents() {
  const s = useDemo();
  const reduced = useReducedMotion();
  const events = useMemo(() => [...ANPR_EVENTS].sort((a, b) => dayRank(a.day) - dayRank(b.day) || (a.at < b.at ? 1 : -1)), []);
  const [sel, setSel] = useState("ANPR-0951");
  const [panel, setPanel] = useState<"review" | "create" | null>(null);
  const [cust, setCust] = useState("");
  const [model, setModel] = useState("");
  const [sim, setSim] = useState<{ id: string; step: number; total: number } | null>(null);
  const detail = useRef<HTMLDivElement>(null);

  const e = events.find(x => x.id === sel) ?? events[0];
  const v = viewOf(s, e);
  const simOn = !!sim && sim.id === e.id;
  const simRunning = simOn && sim.step < sim.total;

  useEffect(() => {
    if (!sim || sim.step >= sim.total) return;
    const t = setTimeout(() => setSim(x => (x ? { ...x, step: x.step + 1 } : x)), STEP_MS);
    return () => clearTimeout(t);
  }, [sim]);

  const choose = (id: string) => {
    setSel(id); setPanel(null); setCust(""); setModel("");
    if (isNarrow() || window.innerWidth <= 1100) setTimeout(() => detail.current?.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" }), 30);
  };
  const simulate = () => {
    const ev = ANPR_EVENTS.find(x => x.id === SIM_ID);
    if (!ev) return;
    setSel(ev.id); setPanel(null);
    setSim({ id: ev.id, step: 0, total: anprPipeline(s, ev).length + 1 });
  };

  const real = anprPipeline(s, e);
  const all: { label: string; detail: string; state: PipelineStep["state"] }[] = [
    { label: "ANPR camera", detail: `${e.camera}, plate captured`, state: "ok" },
    ...real.map(p => ({ label: p.label, detail: p.detail, state: p.state })),
  ];
  const steps = all.map((st, i) => ({ ...st, state: (simOn && i >= sim.step ? (i === sim.step ? "run" : "wait") : st.state) as StepView }));

  const sug = e.suggestion;
  const sugId = sug ? identityOf(s, sug.key) : null;
  const unresolved = v.pending;
  const shows = (n: number) => !simRunning || (sim?.step ?? 0) >= n;
  const pend = <span className="y-faint">Matching</span>;
  const vehicle = e.key ? vehicleByKey(s, e.key) : undefined;
  const bookingJob = e.booking && /^JOB-/.test(e.booking.job) ? e.booking.job : null;
  const diffs = sugId ? [...e.read].map((ch, i) => ({ i, a: ch, b: sugId.reg[i] ?? "" })).filter(d => d.a !== d.b) : [];

  return (
    <Page>
      <Head title="ANPR Events" sub="Every plate read at the gates, matched against Keyloop, the customer and any open booking before the vehicle joins the yard.">
        <span className="y-live"><i aria-hidden />Gate 1 and Gate 2 connected</span>
        <KeyloopBadge />
      </Head>

      <div className="y-anpr">
        <Card title="Live feed" aside={<span className="d-muted">{events.length} reads</span>}>
          <div className="y-feed" role="listbox" aria-label="ANPR events">
            {events.map((x, i) => {
              const xv = viewOf(s, x);
              const processing = !!sim && sim.id === x.id && sim.step < sim.total;
              const lowConf = x.confidence < 90;
              const sub = x.direction === "out" ? x.note ?? "Departed" : xv.pending ? (x.suggestion ? "Closest match found, needs review" : "No vehicle record found") : `${xv.model ?? ""}${xv.customerId ? ", " + cname(xv.customerId) : ""}`;
              return (
                <div key={x.id} style={{ display: "contents" }}>
                  {(i === 0 || events[i - 1].day !== x.day) && <div className="y-day">{x.day === "Today" ? "Today, Mon 19 Oct" : x.day}</div>}
                  <button role="option" aria-selected={sel === x.id} className={"y-ev " + (sel === x.id ? "sel" : "")} onClick={() => choose(x.id)}>
                    <span className="tm">{x.at}<small>{x.direction === "in" ? "IN" : "OUT"}</small></span>
                    <span className="main"><Plate reg={x.read} /><span className={"cf " + (lowConf ? "low" : "")}>{x.confidence}%</span></span>
                    <span className="sub"><span className={"y-out " + (processing ? "t-acc" : toneCls(xv.tone))}>{processing ? "PROCESSING" : xv.label}</span><span className="tx" title={sub}>{sub}</span></span>
                  </button>
                </div>
              );
            })}
          </div>
        </Card>

        <div ref={detail} style={{ scrollMarginTop: 12 }}>
          <Card>
            <div className="y-det-head">
              <span className="big"><Plate reg={e.read} /></span>
              <span className={"y-out " + toneCls(v.tone)}>{v.label}</span>
              <span className="d-muted">{e.day === "Today" ? "Today" : e.day} {e.at}, {e.direction === "in" ? "inbound" : "outbound"}, {e.camera}</span>
            </div>

            {unresolved && (
              <Flag tone="bad"><b>{e.outcome === "unknown" ? "Unknown vehicle." : "Unmatched read."}</b> {e.note} The vehicle is held in the yard with no customer, job or Keyloop record until someone resolves it.</Flag>
            )}
            {!unresolved && v.res && (
              <Flag tone="ok"><b>{v.res.kind === "matched" ? "Matched by Anthony Reynolds." : "Vehicle created."}</b> {v.res.kind === "matched" ? `${v.reg} (${v.customerId ? cname(v.customerId) : "customer pending"}) is now a normal yard vehicle with its history attached.` : `${cname(v.res.customer)} · ${v.res.model}. A Keyloop record is requested on the next sync.`}</Flag>
            )}

            <dl className="d-kv" style={{ marginTop: 12 }}>
              <dt>Registration read</dt><dd><span className="d-mono">{e.read}</span> at <b style={{ color: e.confidence < 90 ? "var(--warn)" : undefined }}>{e.confidence}% confidence</b></dd>
              {e.direction === "in" && <>
                <dt>Vehicle</dt><dd>{!shows(3) ? pend : v.reg ? <>{v.reg} · {v.model}</> : <span style={{ color: "var(--bad)" }}>Unknown</span>}</dd>
                <dt>Customer</dt><dd>{!shows(4) ? pend : v.customerId ? <CLink id={v.customerId} /> : <span style={{ color: "var(--bad)" }}>Not matched</span>}</dd>
                <dt>Keyloop booking</dt><dd>{!shows(6) ? pend : e.booking ? <>{bookingJob ? <JLink id={bookingJob} /> : e.booking.job} · {e.booking.reason}</> : <span className="d-muted">None found</span>}</dd>
                {e.booking && shows(6) && <><dt>Assignment</dt><dd>{e.booking.assigned}</dd></>}
                {vehicle && !unresolved && shows(8) && <><dt>Location</dt><dd>{vehicle.location}</dd></>}
              </>}
              {e.note && !unresolved && <><dt>Note</dt><dd>{e.note}</dd></>}
            </dl>

            {unresolved && sug && sugId && (
              <div className="y-sug">
                <div className="d-grow">
                  <div className="d-eyebrow">Closest match in Keyloop</div>
                  <div style={{ marginTop: 5, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}><Plate reg={sugId.reg} /><span>{sugId.model}</span></div>
                  <div className="d-muted" style={{ marginTop: 4 }}>{sugId.customerId ? cname(sugId.customerId) : "No customer"}, {sug.confidence}% similar to the read</div>
                </div>
              </div>
            )}

            <div className="y-act">
              {unresolved && <Btn onClick={() => setPanel(p => (p === "review" ? null : "review"))} aria-expanded={panel === "review"}>Review</Btn>}
              {unresolved && sug && <Btn kind="primary" onClick={() => { A.anprMatch(e.id, sug.key); setPanel(null); }}>Match vehicle</Btn>}
              {unresolved && <Btn onClick={() => setPanel(p => (p === "create" ? null : "create"))} aria-expanded={panel === "create"}>Create vehicle</Btn>}
              {e.key && <Btn kind={unresolved ? "ghost" : "primary"} onClick={() => openVehicle(e.key!)}>{unresolved ? "Open held vehicle" : "Open vehicle page"}</Btn>}
            </div>

            {unresolved && panel === "review" && (
              <div className="y-sub-card">
                <div className="d-eyebrow" style={{ marginBottom: 8 }}>Read against candidate</div>
                <div className="y-vs">
                  <div className="y-side read">
                    <div className="d-eyebrow">Camera read, {e.confidence}%</div>
                    <div className="txt">{sugId ? <Diff a={e.read} b={sugId.reg} /> : e.read}</div>
                    <div className="d-muted">{e.camera}, {e.day === "Today" ? "today" : e.day} {e.at}</div>
                  </div>
                  <span aria-hidden>vs</span>
                  <div className="y-side">
                    <div className="d-eyebrow">Candidate in Keyloop</div>
                    {sugId ? <>
                      <div className="txt">{sugId.reg}</div>
                      <div className="d-muted">{sugId.model}, {sugId.customerId ? cname(sugId.customerId) : "no customer"}</div>
                    </> : <>
                      <div className="txt y-faint">None</div>
                      <div className="d-muted">No vehicle in Keyloop is close to this read.</div>
                    </>}
                  </div>
                </div>
                {sugId && diffs.length > 0 && <p className="d-muted" style={{ margin: "10px 0 0" }}>{diffs.length === 1 ? "One character differs" : `${diffs.length} characters differ`}: {diffs.map(d => `position ${d.i + 1} read as ${d.a}, Keyloop has ${d.b || "nothing"}`).join("; ")}.</p>}
                {!sugId && e.note && <p className="d-muted" style={{ margin: "10px 0 0" }}>{e.note}</p>}
                <div className="y-act">
                  {sug && <Btn kind="primary" onClick={() => { A.anprMatch(e.id, sug.key); setPanel(null); }}>Same vehicle, match it</Btn>}
                  <Btn onClick={() => setPanel("create")}>Different vehicle, create it</Btn>
                  <Btn kind="ghost" onClick={() => setPanel(null)}>Close</Btn>
                </div>
              </div>
            )}

            {unresolved && panel === "create" && (
              <div className="y-sub-card">
                <div className="d-eyebrow" style={{ marginBottom: 8 }}>New vehicle for {e.read}</div>
                <div className="y-form">
                  <Field label="Customer"><select className="d-select" value={cust} onChange={ev => setCust(ev.target.value)}>
                    <option value="">Choose a customer</option>
                    {companyList.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select></Field>
                  <Field label="Model"><input className="d-input" value={model} placeholder="Renault Trucks D Range" onChange={ev => setModel(ev.target.value)} /></Field>
                </div>
                <p className="d-muted" style={{ margin: "10px 0 0" }}>Pulse adds the vehicle to the yard now and asks Keyloop to create the record on the next sync.</p>
                <div className="y-act">
                  <Btn kind="primary" disabled={!cust || !model.trim()} onClick={() => { A.anprCreate(e.id, { customer: cust, model: model.trim() }); setPanel(null); }}>Create vehicle</Btn>
                  <Btn kind="ghost" onClick={() => setPanel(null)}>Cancel</Btn>
                </div>
              </div>
            )}

          </Card>
        </div>
      </div>

      <Card title={`Pipeline for ${e.read}`} aside={
        <Btn sm kind="primary" onClick={simulate} disabled={simRunning}>{simRunning ? "Simulating arrival" : "Simulate arrival at the gate"}</Btn>
      }>
        <Stepper steps={steps} />
        {simOn && !simRunning && vehicle && (
          <div className="y-res"><Flag tone="ok"><b>{vehicle.reg} added to the yard.</b> {vehicle.customer}, {vehicle.location}. {vehicle.row.customerUpdated ? `Customer notified: ${vehicle.row.customerUpdated}.` : ""}</Flag></div>
        )}
        {simRunning && <div className="y-res d-muted" role="status">Reading the plate, matching it against Keyloop and the open bookings.</div>}
        {!simOn && <div className="y-res d-muted">Simulation replays the 241-D-1821 arrival (Kelly Logistics) one step at a time. Nothing is written to Keyloop.</div>}
      </Card>
    </Page>
  );
}
