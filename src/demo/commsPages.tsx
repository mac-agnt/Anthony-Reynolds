/* Unified communications: every operational message is read, classified and
   tied to the right vehicle, customer, job, part and employee. Everything is
   derived from COMMS + the store (yard.ts), nothing is retyped here. */
import "./comms.css";
import { useEffect, useState, type ReactNode } from "react";
import { A, cname, pname, useDemo, type State } from "./store";
import { STAFF } from "./fixtures";
import { go } from "./nav";
import {
  ANPR_EVENTS, COMMS, KEYLOOP, commStatus, commsCounts, fmtWhen, identityOf, normReg, openVehicle, searchVehicles, timelineFor, vehicleByKey, yardVehicles,
  type Comm, type YardVehicle,
} from "./yard";
import { Avatar, Bar, Btn, Card, Chip, CLink, Empty, Flag, Head, JLink, Metric, Note, Page, Plate, VLink } from "./ui";
import { ChMark, GROUPS, Sheet, firstName, groupOf, sortComms, timeLabel, useIsMobile, type Group } from "./commsShared";

type StatusFilter = "all" | Comm["status"];
const STATUS_LABEL: Record<Comm["status"], string> = { auto: "Auto matched", review: "Needs review", unmatched: "Unmatched" };
const STATUS_TONE: Record<Comm["status"], "ok" | "warn" | "bad"> = { auto: "ok", review: "warn", unmatched: "bad" };
const HERO_ID = "M-1043";
const shortPart = (p: string) => p.replace(/ \(.*\)/, "");

/* ── what Pulse understood about one message ─────────────────────────── */
interface Understood {
  status: Comm["status"];
  dismissed: boolean;
  resolvedBy: { by: string; at: string } | null;
  vehicleKey: string | null;
  vehicle: YardVehicle | undefined;
  customerId: string | null;
  jobId: string | null;
  part: string | null;
  employeeId: string | null;
  confidence: number;
}
function understand(s: State, c: Comm): Understood {
  const r = s.yard.commsResolved[c.id];
  const dismissed = !!r && r.key === null;
  const vehicleKey = dismissed ? null : r ? r.key : c.status === "auto" ? c.vehicle ?? null : null;
  const v = vehicleKey ? vehicleByKey(s, vehicleKey) : undefined;
  const idn = vehicleKey ? identityOf(s, vehicleKey) : null;
  const employeeId = dismissed ? null : c.employee ?? STAFF.find(p => p.name === c.from)?.id ?? null;
  return {
    status: commStatus(s, c), dismissed, resolvedBy: r ? { by: r.by, at: r.at } : null, vehicleKey, vehicle: v,
    customerId: dismissed ? null : idn?.customerId ?? c.customer ?? null,
    jobId: dismissed ? null : c.job ?? v?.jobId ?? null,
    part: dismissed ? null : c.part ?? v?.part?.part ?? null,
    employeeId, confidence: r ? 100 : c.status === "auto" ? c.confidence ?? 100 : c.suggestions?.[0]?.confidence ?? 0,
  };
}
interface Field { field: string; value: string; tone?: "warn" | "bad" }
function fieldsFor(s: State, c: Comm, u: Understood): Field[] {
  const base: Field[] = c.extracted ? c.extracted.map(e => ({ ...e })) : [
    { field: "Type", value: c.type }, ...(c.part ? [{ field: "Part", value: shortPart(c.part) }] : []),
    { field: "Sender", value: firstName(c.from) }, { field: "Source", value: groupOf(c) },
  ];
  const rest = base.filter(f => f.field !== "Vehicle");
  if (u.vehicleKey) return [{ field: "Vehicle", value: identityOf(s, u.vehicleKey).reg }, ...rest];
  return [{ field: "Vehicle", value: u.dismissed ? "Not operational" : c.suggestions?.length ? "Not certain" : "Not found", tone: c.suggestions?.length && !u.dismissed ? "warn" : "bad" }, ...rest];
}

/* ── inbox page ───────────────────────────────────────────────────────── */
function Inbox() {
  const s = useDemo();
  const mobile = useIsMobile();
  const [status, setStatus] = useState<StatusFilter>("all");
  const [group, setGroup] = useState<"all" | Group>("all");
  const [source, setSource] = useState<string | null>(() => s.focus.commsSource || null);
  const [sel, setSel] = useState(HERO_ID);
  const [sheet, setSheet] = useState(false);
  const [touched, setTouched] = useState<string[]>([]);
  useEffect(() => { if (s.focus.commsSource) A.focus("commsSource", ""); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const counts = commsCounts(s);
  const byGroup = (g: Group) => COMMS.filter(c => groupOf(c) === g).length;
  const rows = sortComms(COMMS).filter(c =>
    (status === "all" || commStatus(s, c) === status || touched.includes(c.id)) && (group === "all" || groupOf(c) === group) && (!source || c.source === source));
  const cur = rows.find(c => c.id === sel) ?? rows[0];

  const tiles: [StatusFilter, string, number, string][] = [
    ["all", "All messages", counts.total, ""], ["auto", "Auto matched", counts.auto, "ok"],
    ["review", "Needs review", counts.review, "warn"], ["unmatched", "Unmatched", counts.unmatched, "bad"],
  ];
  const detail = cur ? <Detail key={cur.id} c={cur} onResolved={id => setTouched(t => (t.includes(id) ? t : [...t, id]))} /> : <Empty>No messages match these filters.</Empty>;

  return (
    <Page>
      <Head title="Communications" sub="Every operational message is read, classified and tied to the right vehicle, customer, job, part and employee." />

      <div className="c-ba" aria-label="Without Pulse and with Pulse">
        <div><div className="t">Without Pulse</div><p>4 WhatsApp groups, 2 mailboxes, Keyloop. Someone has to know where to look.</p></div>
        <div className="arrow" aria-hidden>→</div>
        <div className="with"><div className="t">With Pulse</div><p>One thread per vehicle.</p></div>
      </div>

      <div className="c-counts" role="group" aria-label="Filter by match status">
        {tiles.map(([k, label, n, tone]) => (
          <button key={k} className={`c-count ${tone} ${status === k ? "on" : ""}`} onClick={() => setStatus(k)} aria-pressed={status === k}>
            <div className="k">{label}</div><div className="v">{n}</div>
          </button>
        ))}
      </div>
      <div className="c-filters" role="group" aria-label="Filter by channel">
        <button className={"d-chip " + (group === "all" ? "sel" : "")} onClick={() => setGroup("all")}>All channels <span className="n">{COMMS.length}</span></button>
        {GROUPS.map(g => <button key={g} className={"d-chip " + (group === g ? "sel" : "")} onClick={() => setGroup(g)}>{g} <span className="n">{byGroup(g)}</span></button>)}
        {source && <button className="d-chip acc" onClick={() => setSource(null)} title="Clear source filter">{source} ×</button>}
      </div>

      <div className="c-split">
        <div className="c-list" role="list" aria-label="Messages">
          {rows.length === 0 && <div style={{ padding: 14 }}><Empty>No messages match these filters.</Empty></div>}
          {rows.map(c => {
            const st = commStatus(s, c);
            const dismissed = s.yard.commsResolved[c.id]?.key === null;
            const g = groupOf(c);
            return (
              <button key={c.id} role="listitem" className={"c-item " + (cur?.id === c.id ? "on" : "")} onClick={() => { setSel(c.id); if (mobile) setSheet(true); }}>
                <ChMark g={g} />
                <div style={{ minWidth: 0 }}>
                  <div className="top"><span className="who">{c.from}</span><span className="time">{timeLabel(c)}</span></div>
                  <div className="src">{g} · {c.source}</div>
                  <div className="ex">{c.subject ? <b>{c.subject}. </b> : null}{c.text}</div>
                  <div className="foot">
                    {dismissed ? <Chip>Dismissed</Chip> : <Chip tone={STATUS_TONE[st]}><span className="c-st">{STATUS_LABEL[st]}</span></Chip>}
                    <Chip>{c.type}</Chip>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
        {!mobile && <Card className="c-detail-card">{detail}</Card>}
      </div>
      {mobile && sheet && cur && <Sheet title={`${cur.from} · ${timeLabel(cur)}`} onClose={() => setSheet(false)}>{detail}</Sheet>}
      <div style={{ marginTop: 14 }}><Note>The WhatsApp, email, Renault, Keyloop and phone feeds are simulated in this demo.</Note></div>
    </Page>
  );
}

/* ── one message: original, what Pulse understood, actions ────────────── */
function Detail({ c, onResolved }: { c: Comm; onResolved: (id: string) => void }) {
  const s = useDemo();
  const u = understand(s, c);
  const g = groupOf(c);
  const st = u.status;
  const sugs = c.suggestions ?? [];
  const top = sugs[0];
  const [choose, setChoose] = useState(false);
  const [q, setQ] = useState("");
  const [asked, setAsked] = useState(false);
  const hits = q.trim().length >= 2 ? searchVehicles(s, q).slice(0, 5) : [];
  const attach = (key: string) => { A.resolveComm(c.id, key); onResolved(c.id); };
  const dismiss = () => { A.resolveComm(c.id, null); onResolved(c.id); };
  const fields = fieldsFor(s, c, u);
  const id = u.vehicleKey ? identityOf(s, u.vehicleKey) : null;
  const pipe: [string, "ok" | "warn" | "bad" | undefined][] = [
    ["Read", "ok"], [`Classified: ${c.type}`, "ok"],
    u.vehicleKey ? ["Matched to vehicle", "ok"] : u.dismissed ? ["Dismissed", undefined] : st === "review" ? ["Vehicle needs review", "warn"] : ["No vehicle found", "bad"],
    u.vehicleKey ? ["Added to timeline", "ok"] : ["Not on a timeline yet", undefined],
  ];
  const sugReg = top ? identityOf(s, top.key) : null;
  const emp = u.employeeId;

  return (
    <div className="c-detail">
      <div className="c-dhead">
        <ChMark g={g} />
        <div className="d-grow">
          <div className="nm">{c.from}</div>
          <div className="sub">{g} · {c.source} · {c.day === "Today" ? "Today" : c.day} {c.at} · {c.id}</div>
        </div>
        {u.dismissed ? <Chip>Dismissed</Chip> : <Chip tone={STATUS_TONE[st]}><span className="c-st">{STATUS_LABEL[st]}</span></Chip>}
      </div>

      <div className={"c-bubble " + (c.id === HERO_ID ? "hero" : "")}>
        {c.subject && <div className="sub">Subject: {c.subject}</div>}
        {c.text}
      </div>

      <div className="c-sec">
        <div className="c-sec-h"><b>What Pulse understood</b></div>
        <div className="c-pipe">{pipe.map(([l, t], i) => <Chip key={i} tone={t}>{t === "ok" ? "✓ " : ""}{l}</Chip>)}</div>
        <div className="c-fields">
          {fields.map(f => (
            <div key={f.field} className={"c-field " + (f.tone ?? "")}>
              <div className="k">{f.field}</div>
              <div className="val">{f.field === "Vehicle" && u.vehicleKey ? <Plate reg={f.value} /> : f.value}</div>
            </div>
          ))}
        </div>
        {!u.dismissed && (
          <div className="c-meter-row">
            <span>Match confidence</span>
            <div className={"c-meter " + (u.confidence >= 90 ? "" : u.confidence >= 50 ? "warn" : "bad")} role="img" aria-label={`${u.confidence} percent`}><i style={{ width: `${u.confidence}%` }} /></div>
            <b style={{ color: "var(--ink)" }}>{u.confidence}%</b>
            {u.resolvedBy && <span className="d-faint">confirmed by {firstName(u.resolvedBy.by)}, {u.resolvedBy.at}</span>}
          </div>
        )}
      </div>

      <div className="c-sec">
        <div className="c-sec-h"><b>Connected to</b></div>
        <div className="c-graph">
          <div className="c-msg"><ChMark g={g} /><b>{firstName(c.from)}</b><span>{timeLabel(c)}</span></div>
          <div className="c-links">
            <Node k="Vehicle" state={u.vehicleKey ? "linked" : top && !u.dismissed ? "suggested" : "none"}
              body={u.vehicleKey && id ? <><VLink id={u.vehicleKey} /><small>{id.model}</small></> : top && sugReg && !u.dismissed ? <>Likely {sugReg.reg}<small>{top.confidence}% confidence</small></> : "No vehicle found"} />
            <Node k="Customer" state={u.customerId ? "linked" : "none"} body={u.customerId ? <CLink id={u.customerId} /> : "No customer found"} />
            <Node k="Job" state={u.jobId ? "linked" : "none"} body={u.jobId ? <><JLink id={u.jobId} /><small>{u.vehicle?.job?.complaint ?? ""}</small></> : "No job found"} />
            <Node k="Part" state={u.part ? "linked" : "none"} body={u.part ? <>{shortPart(u.part)}<small>{u.vehicle?.part?.po ? `${u.vehicle.part.po}, ETA ${u.vehicle.part.eta}` : ""}</small></> : "No part mentioned"} />
            <Node k="Employee" state={emp ? "linked" : "ext"} body={emp ? <span className="d-row" style={{ gap: 8, flexWrap: "nowrap" }}><Avatar id={emp} size={22} />{pname(emp)}</span> : <>External sender<small>{c.from}</small></>} />
          </div>
        </div>
        {u.vehicleKey && id && (
          <>
            <Flag tone="ok">Added to the timeline of {id.reg}{u.jobId ? ` and ${u.jobId}` : ""}.</Flag>
            <div className="c-tl" aria-label="Vehicle timeline now">
              {timelineFor(s, u.vehicleKey).slice(0, 4).map((e, i) => {
                const mine = e.who === c.from && e.text === c.text;
                return <div key={i} className={mine ? "new" : ""}><span className="at">{fmtWhen(e.at)}</span><span><b>{e.who}</b> {e.channel}: {e.text}</span></div>;
              })}
            </div>
            <div className="c-actions"><Btn sm onClick={() => openVehicle(u.vehicleKey!, "timeline")}>Open vehicle timeline</Btn></div>
          </>
        )}
        {u.dismissed && <Note>Dismissed as not operational. It stays in the log and is not attached to any record.</Note>}
      </div>

      {st === "review" && !u.dismissed && (
        <div className="c-sec">
          <div className="c-sec-h"><b>Pulse needs a person</b></div>
          {sugs.map((sg, i) => {
            const sid = identityOf(s, sg.key);
            return (
              <div key={sg.key} className={"c-sug " + (i === 0 ? "top" : "")}>
                <div>
                  <div className="hd">{i === 0 ? "Likely vehicle" : "Also possible"} {sid.reg}, {sid.customerId ? cname(sid.customerId) : "unmatched"}, confidence {sg.confidence}%</div>
                  <div className="why">{sg.why}</div>
                  <div className="c-meter warn" role="img" aria-label={`${sg.confidence} percent`}><i style={{ width: `${sg.confidence}%` }} /></div>
                </div>
                <Btn kind={i === 0 ? "primary" : undefined} onClick={() => attach(sg.key)}>Confirm</Btn>
              </div>
            );
          })}
          <div className="c-actions">
            <Btn onClick={() => setChoose(v => !v)}>{choose ? "Hide search" : "Choose another vehicle"}</Btn>
            <Btn kind="ghost" onClick={dismiss}>Not operational</Btn>
          </div>
          {choose && <ManualMatch q={q} setQ={setQ} hits={hits} onPick={attach} />}
        </div>
      )}

      {st === "unmatched" && !u.dismissed && (
        <div className="c-sec">
          <div className="c-sec-h"><b>Pulse could not match this</b></div>
          <ManualMatch q={q} setQ={setQ} hits={hits} onPick={attach} />
          <div className="c-draft">
            <div className="d-eyebrow" style={{ marginBottom: 4 }}>Suggested: ask in {c.source}</div>
            {askText(c)}
            <div className="c-actions" style={{ marginTop: 8 }}>
              <Btn sm onClick={() => setAsked(true)} disabled={asked}>{asked ? "Question drafted" : "Draft question for the group"}</Btn>
              {asked && <span className="d-muted">Draft only. Nothing is posted in this demo.</span>}
            </div>
          </div>
          <div className="c-actions"><Btn kind="ghost" onClick={dismiss}>Not operational</Btn></div>
        </div>
      )}

      <Explained c={c} u={u} />
    </div>
  );
}

function askText(c: Comm): string {
  const who = firstName(c.from);
  return c.channel === "Phone"
    ? `A caller left a message for ${who} about an unregistered vehicle. Does anyone know who booked it in or dropped it at the gate on Friday evening?`
    : `${who} is asking about a vehicle with no registration. Can whoever booked it in on Friday evening reply here with the reg or the customer?`;
}

function Node({ k, state, body }: { k: string; state: "linked" | "suggested" | "none" | "ext"; body: ReactNode }) {
  return (
    <div className="c-link" data-s={state}>
      <span className="k">{k}</span>
      <div className="b">{body}</div>
      <span className="mk" aria-label={state}>{state === "linked" ? "✓" : state === "suggested" ? "?" : ""}</span>
    </div>
  );
}

function ManualMatch({ q, setQ, hits, onPick }: { q: string; setQ: (v: string) => void; hits: YardVehicle[]; onPick: (key: string) => void }) {
  return (
    <div className="c-search">
      <input className="d-input" value={q} onChange={e => setQ(e.target.value)} placeholder="Search by registration, customer or job" aria-label="Search vehicles" />
      {q.trim().length >= 2 && hits.length === 0 && <span className="d-muted">No vehicle on site matches that.</span>}
      {hits.map(h => (
        <div key={h.key} className="c-hit">
          <Plate reg={h.reg} />
          <span className="d-grow">{h.customer}<span className="d-faint"> · {h.model}</span></span>
          <Btn sm onClick={() => onPick(h.key)}>Attach</Btn>
        </div>
      ))}
    </div>
  );
}

function Explained({ c, u }: { c: Comm; u: Understood }) {
  const regInText = yardVehicles().some(v => normReg(c.text).includes(normReg(v.reg)));
  const signals: [boolean, string, string][] = [
    [regInText, "Registration text", "181G4471, 181 G 4471 and 181-G-4471 all read as the same plate."],
    [!!c.customer && !!c.part, "Customer plus open part", "A customer and a part in one message narrows it to the vehicle that has that part on order."],
    [!!u.employeeId?.startsWith("t-") && !!c.job, "Technician plus clocked job", "A technician writing about their own work points at the job they are clocked on."],
    [!!u.employeeId, "Sender history", "Who sends it and in which group: parts updates usually come from the parts desk."],
  ];
  return (
    <div className="c-explain">
      <h4>Matching explained</h4>
      <ul>{signals.map(([hit, t, d]) => <li key={t} className={hit ? "hit" : ""}><i aria-hidden>{hit ? "✓" : "·"}</i><span><b>{t}.</b> {d}</span></li>)}</ul>
      <p>Confidence is the strongest signal, lowered when more than one vehicle could fit. Pulse attaches a message on its own when one vehicle clearly fits and asks a person when it does not. Ticks show the signals found in this message.</p>
    </div>
  );
}

/* ── channels page ────────────────────────────────────────────────────── */
interface Tile { source: string; title: string; kind: string; g: Group; use: string }
const TILES: { head: string; tiles: Tile[] }[] = [
  { head: "WhatsApp groups", tiles: [
    { source: "Parts group", title: "Parts group", kind: "WhatsApp group", g: "WhatsApp", use: "Orders, ETAs and deliveries from the parts desk. Pulse ties each update to the vehicle, job and purchase order." },
    { source: "Workshop group", title: "Workshop group", kind: "WhatsApp group", g: "WhatsApp", use: "Technician progress, waiting-on-part notes and bay questions, matched to the job the technician is clocked on." },
    { source: "Service desk", title: "Service desk", kind: "WhatsApp group", g: "WhatsApp", use: "Quotes, customer approvals and booking changes from the front desk." },
    { source: "Yard group", title: "Yard group", kind: "WhatsApp group", g: "WhatsApp", use: "Vehicle movements and questions about unknown vehicles, usually without a registration." },
    { source: "Customer thread", title: "Customer threads", kind: "WhatsApp, per customer", g: "WhatsApp", use: "Messages to and from customers. Updates sent from Pulse land on the vehicle timeline." },
  ] },
  { head: "Mailboxes", tiles: [
    { source: "accounts@", title: "accounts@", kind: "Mailbox", g: "Email", use: "Payment claims and release requests. A claim never clears an accounts hold until Keyloop shows the money." },
    { source: "kevin@", title: "kevin@", kind: "Mailbox", g: "Email", use: "Customer questions to the service desk, such as ETA requests, flagged when a reply is needed." },
    { source: "Renault Trucks notices", title: "Renault Trucks notices", kind: "Mailbox", g: "Renault", use: "Periodic inspection notices. Each one starts the Inspection and Service agent." },
  ] },
];

function Channels() {
  const s = useDemo();
  const counts = commsCounts(s);
  const stat = (source: string) => {
    const list = COMMS.filter(c => c.source === source);
    const by = (k: Comm["status"]) => list.filter(c => commStatus(s, c) === k).length;
    const last = sortComms(list)[0];
    return { n: list.length, auto: by("auto"), review: by("review"), unmatched: by("unmatched"), last, rate: list.length ? Math.round((by("auto") / list.length) * 100) : 0 };
  };
  const openSource = (source: string) => { A.focus("commsSource", source); go("Comms", "inbox"); };
  const inbound = ANPR_EVENTS.filter(e => e.direction === "in");
  const anprMatched = inbound.filter(e => e.outcome === "matched" || e.outcome === "no_booking" || !!s.yard.anpr[e.id]).length;
  const anprLast = ANPR_EVENTS[0];
  const kl = stat("Keyloop sync");
  const phone = stat("Reception log");

  return (
    <Page>
      <Head title="Channels" sub="Where operational messages come from, how many Pulse has read and how many it could tie to a record without help." />
      <div className="d-grid d-g4" style={{ marginBottom: 6 }}>
        <Metric label="Messages read today" value={counts.total} hint="Across all feeds below" />
        <Metric label="Auto matched" value={counts.auto} hint={`${Math.round((counts.auto / counts.total) * 100)}% match rate`} />
        <Metric label="Needs review" value={counts.review} tone={counts.review ? "warn" : undefined} hint="Waiting for a person" onClick={() => { go("Comms", "inbox"); }} />
        <Metric label="Unmatched" value={counts.unmatched} tone={counts.unmatched ? "bad" : undefined} hint="No vehicle found" />
      </div>

      {TILES.map(sec => (
        <div key={sec.head}>
          <div className="c-sect">{sec.head}</div>
          <div className="c-tiles">
            {sec.tiles.map(t => {
              const x = stat(t.source);
              return (
                <ChannelTile key={t.source} title={t.title} kind={t.kind} g={t.g} use={t.use} n={x.n} rate={x.rate} auto={x.auto} review={x.review} unmatched={x.unmatched}
                  last={x.last ? `${timeLabel(x.last)} · ${firstName(x.last.from)}` : "None yet"} action={<Btn sm onClick={() => openSource(t.source)}>Open in inbox</Btn>} />
              );
            })}
          </div>
        </div>
      ))}

      <div className="c-sect">Other feeds</div>
      <div className="c-tiles">
        <ChannelTile title="Phone log" kind="Reception call log" g="Phone" n={phone.n} rate={phone.rate} auto={phone.auto} review={phone.review} unmatched={phone.unmatched}
          last={phone.last ? `${timeLabel(phone.last)} · ${firstName(phone.last.from)}` : "None yet"}
          use="Calls noted at reception. Callers rarely give a registration, so these need the most manual matching."
          action={<Btn sm onClick={() => openSource("Reception log")}>Open in inbox</Btn>} />
        <ChannelTile title="ANPR" kind="Gate cameras" g="Keyloop" mark="ANPR" n={ANPR_EVENTS.length} rate={Math.round((anprMatched / inbound.length) * 100)}
          auto={anprMatched} review={0} unmatched={inbound.length - anprMatched}
          last={`${anprLast.day} ${anprLast.at} · ${anprLast.read}`}
          use="Every plate read at the gate is matched to a vehicle, customer and booking, then added to the yard."
          action={<Btn sm onClick={() => go("Yard", "anpr")}>Open ANPR events</Btn>} />
        <ChannelTile title="Keyloop sync" kind="System of record" g="Keyloop" n={kl.n} rate={kl.rate} auto={kl.auto} review={kl.review} unmatched={kl.unmatched}
          last={`${KEYLOOP.lastSyncMinsAgo} mins ago`}
          use={`Jobs, purchase orders and invoices read from Keyloop. ${KEYLOOP.recordsToday.toLocaleString("en-IE")} records synced today.`}
          action={<Btn sm onClick={() => openSource("Keyloop sync")}>Open in inbox</Btn>} />
      </div>
      <div style={{ marginTop: 16 }}><Note>All feeds here are simulated. In production each channel connects through its own integration, and what is possible depends on the access Reynolds has for WhatsApp, the mailboxes, the ANPR cameras and Keyloop.</Note></div>
    </Page>
  );
}

function ChannelTile({ title, kind, g, mark, use, n, rate, auto, review, unmatched, last, action }: {
  title: string; kind: string; g: Group; mark?: string; use: string; n: number; rate: number; auto: number; review: number; unmatched: number; last: string; action: ReactNode;
}) {
  return (
    <section className="c-tile">
      <div className="hd">
        {mark ? <span className="c-mark" title={title}>{mark.slice(0, 3)}</span> : <ChMark g={g} />}
        <div className="d-grow"><b>{title}</b><small>{kind}</small></div>
        <Chip>Simulated</Chip>
      </div>
      <div className="stats">
        <div><div className="d-eyebrow">Messages</div><div className="v">{n}</div></div>
        <div><div className="d-eyebrow">Match rate</div><div className="v">{rate}%</div></div>
        <div><div className="d-eyebrow">Last</div><div className="v sm">{last}</div></div>
      </div>
      <div>
        <Bar parts={[[auto, "var(--ok)", "Matched"], [review, "var(--warn)", "Needs review"], [unmatched, "var(--bad)", "Unmatched"]]} />
        <div className="legend" style={{ marginTop: 6 }}>
          <span className="legend"><span><i style={{ background: "var(--ok)" }} />{auto} matched</span> <span><i style={{ background: "var(--warn)" }} />{review} review</span> <span><i style={{ background: "var(--bad)" }} />{unmatched} unmatched</span></span>
        </div>
      </div>
      <p className="use">{use}</p>
      <div className="d-row">{action}</div>
    </section>
  );
}

export const COMMS_PAGES: Record<string, () => JSX.Element> = { inbox: Inbox, channels: Channels };
