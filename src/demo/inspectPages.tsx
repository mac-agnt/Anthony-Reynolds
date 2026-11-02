/* Inspection and Service agent. Renault sends periodic inspection notices;
   Pulse reads each one, finds the customer and their usual channel, drafts the
   reminder and waits for a person to approve it. Nothing is ever sent without
   approval, and in this demo nothing leaves the screen. Derived from NOTICES
   + the store (yard.ts). */
import "./inspect.css";
import { useState, useSyncExternalStore } from "react";
import { A, company, toMin, useDemo, type State } from "./store";
import { SERVICE_VEHICLES } from "./fixtures";
import { go } from "./nav";
import { NOTICES, TODAY_ISO, fmtWhen, inspectionCounts, minsSince, noticeDays, noticeMessage, noticeState, noticeWindow, openVehicle, type Notice, type NoticeStage } from "./yard";
import { Btn, Card, Chip, CLink, Empty, Flag, Head, Metric, Note, Page, Plate, VLink } from "./ui";
import { Sheet, useIsMobile } from "./commsShared";

/* ── drafts prepared in bulk or edited by hand (kept while you move around the demo) ── */
const draftText: Record<string, string> = {};
const prepared = new Set<string>();
const subs = new Set<() => void>();
let ver = 0;
const bump = () => { ver++; subs.forEach(f => f()); };
const useDrafts = () => useSyncExternalStore(cb => { subs.add(cb); return () => { subs.delete(cb); }; }, () => ver, () => ver);
const setDraft = (id: string, text: string) => { draftText[id] = text; bump(); };
const prepareDrafts = (list: Notice[]) => { list.forEach(n => { prepared.add(n.id); draftText[n.id] ??= noticeMessage(n); }); bump(); };

/* ── small helpers ───────────────────────────────────────────────────── */
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const shortDate = (iso: string) => { const d = new Date(iso.slice(0, 10) + "T00:00:00"); return `${SHORT[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()].slice(0, 3)}`; };
const slotText = (iso: string) => `${shortDate(iso)} ${iso.slice(11, 16)}`;
const longDate = (iso: string) => { const d = new Date(iso + "T00:00:00"); return `${d.getDate()} ${MONTHS[d.getMonth()]}`; };
const daysText = (d: number) => (d < 0 ? `${-d} day${d === -1 ? "" : "s"} overdue` : d === 0 ? "due today" : `in ${d} day${d === 1 ? "" : "s"}`);
const daysTone = (d: number): "bad" | "warn" | "" => (d < 0 ? "bad" : d <= 14 ? "warn" : "");
const STAGE: Record<NoticeStage, { label: string; tone: "ok" | "warn" | "bad" | "acc" | undefined }> = {
  new: { label: "New notice", tone: "acc" }, contacted: { label: "Customer contacted", tone: "acc" }, awaiting: { label: "Awaiting response", tone: "warn" }, booked: { label: "Booked", tone: "ok" },
};
const elapsedText = (mins: number) => (mins < 60 ? `${Math.max(mins, 1)} min` : mins < 1440 ? `${Math.floor(mins / 60)} h` : `${Math.floor(mins / 1440)} days`);
const sendVerb = (ch: Notice["channel"]) => (ch === "Phone" ? "Phone the customer" : `Send ${ch === "WhatsApp" ? "WhatsApp" : "email"} reminder`);
const replyFor = (n: Notice) => (n.channel === "Email" ? "Yes please, book it in for Thursday morning" : "Yes please, Thursday morning");
const SLOTS: [string, string][] = [
  ["2026-10-21T08:30", "Wed 21 Oct, 08:30"], ["2026-10-22T08:30", "Thu 22 Oct, 08:30"], ["2026-10-23T08:30", "Fri 23 Oct, 08:30"], ["2026-10-26T08:30", "Mon 26 Oct, 08:30"],
];

function info(s: State, n: Notice) {
  const sv = SERVICE_VEHICLES.find(v => v.id === n.vehicle);
  const co = company(sv?.customer);
  const st = noticeState(s, n);
  const raw = s.yard.notices[n.id];
  const contactIso = raw?.sentAt ? `${TODAY_ISO}T${raw.sentAt}` : n.contactedAt ?? null;
  const sinceMins = raw?.sentAt ? Math.max(0, s.clock - toMin(raw.sentAt)) : contactIso ? minsSince(contactIso, s.clock) : 0;
  return { n, sv, co, st, raw, contactIso, sinceMins, days: noticeDays(n), reply: raw?.reply ?? n.reply ?? null, bookedFor: st.bookedFor ?? n.bookedFor ?? null };
}
type Info = ReturnType<typeof info>;

type Filter = "all" | "new" | "d30" | "d14" | "week" | "contacted" | "awaiting" | "booked" | "overdue";
function inFilter(s: State, n: Notice, f: Filter): boolean {
  const stage = noticeState(s, n).stage, d = noticeDays(n), open = stage !== "booked";
  switch (f) {
    case "new": return stage === "new";
    case "d30": return open && d >= 0 && d <= 30;
    case "d14": return open && d >= 0 && d <= 14;
    case "week": return open && d >= 0 && d <= 6;
    case "contacted": return stage === "contacted";
    case "awaiting": return stage === "awaiting";
    case "booked": return stage === "booked";
    case "overdue": return open && noticeWindow(n) === "overdue";
    default: return true;
  }
}

/* ── notices page ─────────────────────────────────────────────────────── */
function Notices() {
  const s = useDemo();
  useDrafts();
  const mobile = useIsMobile();
  const c = inspectionCounts(s);
  const [filter, setFilter] = useState<Filter>("all");
  const [sel, setSel] = useState(() => s.focus.noticeSel || "N-3301");
  const [sheet, setSheet] = useState(false);

  const strip: [Filter, string, number, string][] = [
    ["all", "All notices", c.total, ""], ["new", "New notices", c.new, ""], ["d30", "Due in 30 days", c.due30, ""], ["d14", "Due in 14 days", c.due14, "warn"],
    ["week", "Due this week", c.week, "warn"], ["contacted", "Customer contacted", c.contacted, ""], ["awaiting", "Awaiting response", c.awaiting, "warn"],
    ["booked", "Booked", c.booked, "ok"], ["overdue", "Overdue", c.overdue, "bad"],
  ];
  const rows = NOTICES.filter(n => inFilter(s, n, filter)).map(n => info(s, n))
    .sort((a, b) => Number(a.st.stage === "booked") - Number(b.st.stage === "booked") || a.days - b.days);
  const cur = rows.find(r => r.n.id === sel) ?? rows[0];
  const newOnes = NOTICES.filter(n => noticeState(s, n).stage === "new");
  const draftedNew = newOnes.filter(n => prepared.has(n.id)).length;
  const detail = cur ? <NoticeDetail key={cur.n.id} i={cur} /> : <Empty>No notices in this view.</Empty>;

  return (
    <Page>
      <Head title="Inspection and Service agent" sub="Renault sends the periodic inspection notices. Pulse reads each one, finds the customer and how Reynolds usually reaches them, drafts the reminder and waits for approval." />

      <div className="i-strip" role="group" aria-label="Filter notices by stage">
        {strip.map(([k, label, n, tone]) => (
          <button key={k} className={`i-stage ${tone} ${filter === k ? "on" : ""}`} onClick={() => setFilter(k)} aria-pressed={filter === k}>
            <div className="k">{label}</div><div className="v">{n}</div>
          </button>
        ))}
      </div>

      <div className="i-split">
        <div className="i-listwrap">
          <div className="i-bulk">
            <div className="d-row">
              <Btn sm onClick={() => prepareDrafts(newOnes)} disabled={newOnes.length === 0}>Draft reminders for all new notices</Btn>
              <span className="d-faint">{newOnes.length} new</span>
            </div>
            {draftedNew > 0
              ? <Flag tone="ok"><b>{draftedNew} draft{draftedNew === 1 ? "" : "s"} prepared.</b> Nothing has been sent. Open each notice to read, edit and approve it.</Flag>
              : <span className="d-note"><span>Drafting only prepares the messages. Sending always needs your approval on each notice.</span></span>}
          </div>
          <div className="i-list" role="list" aria-label="Notices">
            {rows.length === 0 && <div style={{ padding: 14 }}><Empty>No notices in this view.</Empty></div>}
            {rows.map(r => {
              const stage = STAGE[r.st.stage];
              return (
                <button key={r.n.id} role="listitem" className={"i-row " + (cur?.n.id === r.n.id ? "on" : "")} onClick={() => { setSel(r.n.id); if (mobile) setSheet(true); }}>
                  <div className="l1"><Plate reg={r.sv?.reg ?? r.n.vehicle} /><span className="co">{r.co?.name ?? "Unknown customer"}</span><span className="i-ch" title="Usual channel">{r.n.channel}</span></div>
                  <div className="l2"><span>{r.n.kind}, due {shortDate(r.n.due)}</span><span className={"days " + (r.st.stage === "booked" ? "" : daysTone(r.days))}>{r.st.stage === "booked" ? "booked" : daysText(r.days)}</span></div>
                  <div className="l3">
                    <Chip tone={stage.tone}>{stage.label}</Chip>
                    {r.days < 0 && r.st.stage !== "booked" && <Chip tone="bad">Overdue</Chip>}
                    {r.st.stage === "new" && prepared.has(r.n.id) && <Chip>Draft ready</Chip>}
                    {r.reply && r.st.stage !== "booked" && <Chip tone="ok">Replied</Chip>}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
        {!mobile && <Card>{detail}</Card>}
      </div>
      {mobile && sheet && cur && <Sheet title={`${cur.sv?.reg ?? cur.n.vehicle} · ${cur.co?.name ?? ""}`} onClose={() => setSheet(false)}>{detail}</Sheet>}
    </Page>
  );
}

/* ── one notice: what arrived, what Pulse did, what needs approval ─────── */
function NoticeDetail({ i }: { i: Info }) {
  useDrafts();
  const { n, sv, co, st } = i;
  const [busy, setBusy] = useState(false);
  const [slot, setSlot] = useState(SLOTS[1][0]);
  const text = draftText[n.id] ?? noticeMessage(n);
  const stages: NoticeStage[] = ["new", "contacted", "awaiting", "booked"];
  const idx = stages.indexOf(st.stage);
  const labels = ["Notice received", "Customer contacted", "Awaiting response", "Booked"];
  const phone = n.channel === "Phone";
  const sentLabel = i.raw?.sentAt ? `Today ${i.raw.sentAt}` : i.contactIso ? fmtWhen(i.contactIso) : "";
  const simulate = () => {
    if (st.stage === "contacted") A.noticeAwait(n.id);
    setBusy(true);
    setTimeout(() => { A.noticeReply(n.id, replyFor(n)); setBusy(false); }, 1200);
  };
  const steps: [string, string][] = [
    ["Customer identified", `${co?.name ?? "Unknown"}${co?.account ? `, Keyloop account ${co.account}` : ""}`],
    ["Contact details found", co ? `${co.contact}, ${n.channel === "Email" ? co.email : co.phone}` : "None on file"],
    ["Previous communication channel identified", `${n.channel}${co ? `, usually how ${co.contact.split(" ")[0]} is reached` : ""}`],
  ];

  return (
    <div className="i-detail">
      <div className="i-notice">
        <div className="d-eyebrow">Renault notice received</div>
        <div className="ln"><span>Vehicle</span><span className="d-row" style={{ gap: 8 }}><VLink id={n.vehicle} /><span className="d-muted">{sv?.model}</span></span></div>
        <div className="ln"><span>Customer</span><span><CLink id={sv?.customer} /></span></div>
        <div className="big">{n.kind} due {longDate(n.due)}</div>
        <div className="d-muted">{n.id} · received {fmtWhen(n.received)} · Renault Trucks notices mailbox · {st.stage === "booked" ? "booked" : daysText(i.days)}</div>
      </div>

      <div className="i-track" aria-label="Stage">
        {labels.map((l, k) => <div key={l} className={k < idx ? "done" : k === idx ? "now" : ""}>{k < idx ? "✓ " : ""}{l}</div>)}
      </div>

      <div className="i-sec">
        <div className="i-h"><b>Pulse action</b></div>
        <div className="i-steps">
          {steps.map(([t, d]) => <div key={t} className="i-step"><i aria-hidden>✓</i><div><b>{t}</b><small>{d}</small></div></div>)}
        </div>
      </div>

      {st.stage === "new" && (
        <div className="i-sec">
          <div className="i-h"><b>Suggested action</b></div>
          <div className="i-suggest"><b>{sendVerb(n.channel)}</b>{prepared.has(n.id) && <Chip>Draft prepared by Pulse</Chip>}</div>
          <label className="d-field"><span>{phone ? "Call script" : "Message preview"} (you can edit it)</span>
            <textarea className="d-textarea i-msg" value={text} onChange={e => setDraft(n.id, e.target.value)} aria-label="Message preview" /></label>
          <div className="i-approve">
            <div className="req">Approval required before anything is sent.</div>
            <div className="d-row">
              <Btn kind="primary" onClick={() => A.noticeSend(n.id, text)}>{phone ? "Approve and log the call" : "Approve and send"}</Btn>
              <Btn kind="ghost" onClick={() => setDraft(n.id, noticeMessage(n))}>Reset text</Btn>
            </div>
            <span className="d-muted">Demo only: the message is simulated and nothing leaves Pulse.</span>
          </div>
        </div>
      )}

      {st.stage !== "new" && (
        <div className="i-sec">
          <div className="i-h"><b>{phone ? "Call logged" : "Reminder sent"}</b></div>
          <div className="i-bubble out"><small>{n.channel} · {sentLabel} · approved by Anthony</small>{st.message ?? noticeMessage(n)}</div>
          {i.reply
            ? <div className="i-bubble"><small>{co?.contact ?? "Customer"} replied{i.raw?.repliedAt ? ` · today ${i.raw.repliedAt}` : n.repliedAt ? ` · ${fmtWhen(n.repliedAt)}` : ""}</small>{i.reply}</div>
            : <>
                <Flag>{busy ? "Reply arriving" : `No reply yet. Waiting ${elapsedText(i.sinceMins)} since contact.`}</Flag>
                <div className="d-row"><Btn onClick={simulate} disabled={busy}>Simulate customer reply</Btn><span className="d-muted">Demo control: stands in for the customer answering.</span></div>
              </>}
        </div>
      )}

      {st.stage === "awaiting" && i.reply && (
        <div className="i-sec">
          <div className="i-h"><b>Next step</b></div>
          <div className="i-slot">
            <select className="d-select" value={slot} onChange={e => setSlot(e.target.value)} aria-label="Workshop slot">{SLOTS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
            <Btn kind="primary" onClick={() => A.noticeBook(n.id, slot)}>Book into workshop</Btn>
          </div>
        </div>
      )}

      {st.stage === "booked" && (
        <div className="i-sec">
          <Flag tone="ok"><b>Booked{i.bookedFor ? ` for ${slotText(i.bookedFor)}` : ""}.</b> The workshop planner entry and the Keyloop job are created (simulated).</Flag>
          <div className="d-row"><Btn sm onClick={() => go("Workshop", "planner")}>Open workshop planner</Btn></div>
        </div>
      )}

      <div className="d-row">
        <Btn sm onClick={() => openVehicle(n.vehicle)}>Open vehicle page</Btn>
        {co && <span className="d-faint">{co.name}, {co.type}</span>}
      </div>
    </div>
  );
}

/* ── sent and replies ─────────────────────────────────────────────────── */
function chaseFor(r: Info) {
  const overdue = r.days < 0, urgent = r.days <= 7;
  const ch: Notice["channel"] = overdue || urgent ? "Phone" : r.n.channel;
  const who = r.co?.contact ?? "the customer";
  const why = overdue ? `Overdue by ${-r.days} day${r.days === -1 ? "" : "s"}. Ring ${who} today.`
    : urgent ? `Due ${daysText(r.days)} and no reply after ${elapsedText(r.sinceMins)}. Ring ${who} today.`
    : `No reply after ${elapsedText(r.sinceMins)}. Chase ${who} by ${r.n.channel === "WhatsApp" ? "WhatsApp" : r.n.channel === "Email" ? "email" : "phone"}.`;
  const first = who.split(" ")[0];
  const reg = r.sv?.reg ?? r.n.vehicle;
  const text = ch === "Phone"
    ? `Call script: Hi ${first}, it is Reynolds Commercials. We sent a reminder on ${r.contactIso ? longDate(r.contactIso.slice(0, 10)) : "an earlier date"} about the ${r.n.kind} on ${reg}, due ${longDate(r.n.due)}. Can we book it in this week?`
    : `Hi ${first}, just checking you saw our note about the ${r.n.kind} for ${reg}, due ${longDate(r.n.due)}. Shall we book it in?`;
  return { ch, why, text, tone: overdue ? "bad" : "" };
}

function Replies() {
  const s = useDemo();
  const c = inspectionCounts(s);
  const all = NOTICES.map(n => info(s, n));
  const awaiting = all.filter(r => r.st.stage === "awaiting").sort((a, b) => a.days - b.days);
  const contacted = all.filter(r => r.st.stage === "contacted");
  const booked = all.filter(r => r.st.stage === "booked");
  const replied = all.filter(r => r.reply);
  const sentN = all.filter(r => r.st.stage !== "new").length;
  const [open, setOpen] = useState<string[]>([]);
  const [chaseEdit, setChaseEdit] = useState<Record<string, string>>({});
  const toggle = (id: string) => setOpen(o => (o.includes(id) ? o.filter(x => x !== id) : [...o, id]));
  const waiting = awaiting.filter(r => !r.reply);

  const openNotice = (id: string) => { A.focus("noticeSel", id); go("Inspections", "notices"); };
  const head = (r: Info) => (
    <div className="l1">
      <Plate reg={r.sv?.reg ?? r.n.vehicle} /><span className="co">{r.co?.name}</span>
      <Chip tone={STAGE[r.st.stage].tone}>{STAGE[r.st.stage].label}</Chip>
      <span className="d-grow" /><span className="i-ch">{r.n.channel}</span>
    </div>
  );

  return (
    <Page>
      <Head title="Sent and replies" sub="Reminders Pulse has prepared and you have approved, who has answered, and who needs a chase. Chasers are drafts only." />
      <div className="d-grid d-g4">
        <Metric label="Reminders sent" value={sentN} hint="Approved by a person" />
        <Metric label="Awaiting replies" value={c.awaiting} tone={c.awaiting ? "warn" : undefined} hint="Customers who have not answered" />
        <Metric label="Replies received" value={replied.length} hint="Including booked" />
        <Metric label="Booked" value={c.booked} tone={undefined} hint="In the workshop planner" />
      </div>

      <div className="i-sect">
        <h2>Awaiting replies</h2><Chip tone="warn">{awaiting.length}</Chip><span className="d-grow" />
        <Btn sm disabled={waiting.length === 0} onClick={() => setOpen(waiting.map(r => r.n.id))}>Draft chasers for all</Btn>
      </div>
      {open.length > 0 && <div style={{ marginBottom: 10 }}><Note>Chasers are drafts. Nothing is sent without your approval on the notice.</Note></div>}
      <div className="i-cards">
        {awaiting.length === 0 && <Empty>Nobody is waiting on a reply.</Empty>}
        {awaiting.map(r => {
          const ch = chaseFor(r);
          return (
            <section key={r.n.id} className="i-card">
              {head(r)}
              <div className="meta">
                <span>{r.n.kind}, due <b>{shortDate(r.n.due)}</b> ({daysText(r.days)})</span>
                <span>Contacted <b>{r.contactIso ? fmtWhen(r.contactIso) : "today"}</b> by {r.n.channel}</span>
                <span>Waiting <b>{elapsedText(r.sinceMins)}</b></span>
              </div>
              {r.reply
                ? <div className="d-row"><span className="i-reply">{r.reply}</span><Btn sm onClick={() => openNotice(r.n.id)}>Book it in</Btn></div>
                : <>
                    <div className={"chase " + ch.tone}>
                      <span><b>Chase suggestion:</b> {ch.why}</span>
                      <Btn sm onClick={() => toggle(r.n.id)}>{open.includes(r.n.id) ? "Hide draft" : "Draft chaser"}</Btn>
                      <Btn sm kind="ghost" onClick={() => openNotice(r.n.id)}>Open notice</Btn>
                    </div>
                    {open.includes(r.n.id) && (
                      <div className="i-draft">
                        <textarea className="d-textarea" rows={3} aria-label={`Chaser draft for ${r.sv?.reg}`} value={chaseEdit[r.n.id] ?? ch.text} onChange={e => setChaseEdit(v => ({ ...v, [r.n.id]: e.target.value }))} />
                        <span className="d-muted">Draft only. It is not sent, and sending would still need your approval.</span>
                      </div>
                    )}
                  </>}
            </section>
          );
        })}
      </div>

      <div className="i-sect"><h2>Sent, no reply yet</h2><Chip>{contacted.length}</Chip></div>
      <div className="i-cards">
        {contacted.length === 0 && <Empty>Nothing sent and waiting. Approve a reminder on the Notices tab and it appears here.</Empty>}
        {contacted.map(r => (
          <section key={r.n.id} className="i-card">
            {head(r)}
            <div className="meta"><span>{r.n.kind}, due <b>{shortDate(r.n.due)}</b> ({daysText(r.days)})</span><span>Sent <b>{r.contactIso ? fmtWhen(r.contactIso) : "today"}</b></span><span>Elapsed <b>{elapsedText(r.sinceMins)}</b></span></div>
            <div className="d-row"><Btn sm onClick={() => openNotice(r.n.id)}>Open notice</Btn></div>
          </section>
        ))}
      </div>

      <div className="i-sect"><h2>Replies received and booked</h2><Chip tone="ok">{booked.length}</Chip></div>
      <div className="i-cards">
        {booked.map(r => (
          <section key={r.n.id} className="i-card">
            {head(r)}
            {r.reply && <span className="i-reply">{r.reply}</span>}
            <div className="meta"><span>{r.n.kind}, due <b>{shortDate(r.n.due)}</b></span>{r.bookedFor && <span>Booked for <b>{slotText(r.bookedFor)}</b></span>}<span>Contacted <b>{r.contactIso ? fmtWhen(r.contactIso) : "today"}</b></span></div>
            <div className="d-row"><VLink id={r.n.vehicle} /><Btn sm onClick={() => go("Workshop", "planner")}>Workshop planner</Btn></div>
          </section>
        ))}
      </div>
    </Page>
  );
}

export const INSPECTION_PAGES: Record<string, () => JSX.Element> = { notices: Notices, replies: Replies };
