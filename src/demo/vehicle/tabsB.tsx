/* Vehicle page tabs, part 2: Job cards, Parts, CVRT, Communications, Documents, Finance, Activity, Timeline. */
import { useMemo, useState, type RefObject } from "react";
import { A, JOB_CARD_FACTS, cardFor, company, dur, elapsed, eur, pname, type State } from "../store";
import { Avatar, Btn, Card, Chip, CLink, Empty, Flag, JLink, JobChip, Metric, Seg, Table, canSeeMoney, type Col } from "../ui";
import { go } from "../nav";
import { COMMS, NOTICES, commsFor, dayOf, docsFor, financeFor, fmtWhen, hhmmOf, partsFor, type Channel, type DocItem } from "../yard";
import { ChannelBadge, DayHead } from "./bits";
import { ReleasePanel, type TabProps } from "./tabsA";
import { activityAll, draftUpdate, partShort, receivedFor, timelineAll, type Subject } from "./model";

/* ── JOB CARDS ───────────────────────────────────────────────────────── */
export function JobCardsTab({ s, sub }: TabProps) {
  const v = sub.v;
  const money = canSeeMoney(s);
  if (!sub.jobs.length && !sub.past.length) return <Empty>No job cards on this vehicle yet.</Empty>;
  return (
    <div className="v-stack">
      {sub.jobs.map((j, i) => {
        const facts = JOB_CARD_FACTS[j.id];
        const used = elapsed(j, s.clock);
        return (
          <Card key={j.id} title={<span className="d-row"><JLink id={j.id} />{i === 0 && <Chip tone="acc">Current</Chip>}</span>} aside={<JobChip j={j} />}>
            <p style={{ margin: "0 0 10px" }}>{j.complaint}</p>
            <dl className="d-kv v-facts">
              <dt>Technician</dt><dd>{j.tech ? pname(j.tech) : "Unassigned"}</dd>
              <dt>Time</dt><dd>{j.status === "queued" ? `Budget ${dur(j.budgetMin)}, not started` : `${dur(used)} of ${dur(j.budgetMin)} (${Math.round((used / j.budgetMin) * 1000) / 10}% of budget)`}</dd>
              {money && j.net !== undefined && <><dt>Net value</dt><dd>{eur(j.net)}</dd></>}
              {j.invoice && <><dt>Invoice</dt><dd><Chip tone={j.invoice === "ready" ? "ok" : "warn"}>{j.invoice === "ready" ? "Invoice-ready" : "Write-up awaiting confirmation"}</Chip></dd></>}
            </dl>
            {i === 0 && v && v.row.done.length > 0 && <><div className="d-eyebrow v-gap">Work recorded</div><ul className="v-check done">{v.row.done.map(x => <li key={x}>{x}</li>)}</ul></>}
            {facts && <><div className="d-eyebrow v-gap">Job card narrative</div><p className="v-quote" style={{ margin: 0 }}>{cardFor(s, j.id).narrative}</p></>}
            {j.notes && <><div className="d-eyebrow v-gap">Technician notes</div><p className="d-muted" style={{ margin: 0 }}>{j.notes}</p></>}
            <div className="d-row v-gap"><Btn sm onClick={() => { A.focus("job", j.id); go("Workshop", "jobcards"); }}>Open in Job Cards</Btn></div>
          </Card>
        );
      })}
      {sub.past.length > 0 && (
        <Card title="Past jobs" aside={<span className="d-muted">{sub.past.length}</span>}>
          <div className="d-list">{sub.past.map(p => (
            <div className="d-li v-pastjob" key={p.id}>
              <JLink id={p.id} /><div className="d-grow"><div>{p.complaint}</div><div className="d-muted">{pname(p.tech)}, {fmtWhen(p.doneAt)}</div></div>
              {money && p.net > 0 && <span>{eur(p.net)}</span>}<Chip tone={p.invoice === "n/a" ? undefined : "ok"}>{p.invoice === "n/a" ? "No charge" : p.invoice}</Chip>
            </div>))}</div>
        </Card>
      )}
    </div>
  );
}

/* ── PARTS ───────────────────────────────────────────────────────────── */
type POpen = ReturnType<typeof partsFor>["open"][number];
export function partRows(s: State, sub: Subject): { open: POpen[]; reserved: ReturnType<typeof partsFor>["reserved"] } {
  if (sub.v) return partsFor(s, sub.key);
  return { open: sub.jobs.filter(j => j.partBlocker).map(j => ({ ...j.partBlocker!, job: j.id })), reserved: [] };
}
export function PartsTab({ s, sub }: TabProps) {
  const { open, reserved } = partRows(s, sub);
  const got = receivedFor(sub.key);
  const waiting = open.filter(p => !p.received);
  const cols: Col<POpen>[] = [
    { key: "part", label: "Part", render: p => <b className="v-b">{partShort(p.part)}</b> },
    { key: "sup", label: "Supplier", render: p => p.supplier },
    { key: "po", label: "PO", render: p => <span className="d-mono">{p.po ?? "None"}</span> },
    { key: "ord", label: "Ordered", render: p => p.orderedAt ?? "Not recorded" },
    { key: "eta", label: "ETA", render: p => <Chip tone={p.received ? "ok" : "warn"}>{p.received ? "Received" : p.eta}</Chip> },
    { key: "own", label: "Owner", render: p => <span className="d-row" style={{ gap: 6, flexWrap: "nowrap" }}><Avatar id={p.owner} size={20} />{pname(p.owner).split(" ")[0]}</span> },
    { key: "imp", label: "Impact", render: p => <span className="v-wrap">{p.received ? "None, the part is here" : p.impact ?? "None"}</span> },
    { key: "act", label: "", render: p => <Btn sm disabled={p.received} onClick={() => A.receivePart(p.job)}>{p.received ? "Received" : "Mark received"}</Btn> },
  ];
  return (
    <div className="v-stack">
      {waiting.length > 0 && <Flag><b>{waiting.length === 1 ? "One part" : `${waiting.length} parts`} outstanding.</b> {waiting.map(p => `${partShort(p.part)} (${p.po ?? "no PO"}) due ${p.eta}`).join("; ")}. Customer impact: {waiting.map(p => (p.impact ?? "none").toLowerCase()).join("; ")}.</Flag>}
      <Card className="flush" title={<span className="v-pad">Purchase orders</span>} aside={<span className="v-pad"><Btn sm kind="ghost" onClick={() => go("Workshop", "parts")}>Open Parts and Blockers</Btn></span>}>
        <Table cols={cols} rows={open} rowKey={p => (p.po ?? p.part) + p.job} empty="No part orders on this vehicle." />
      </Card>
      <Card title="Reserved from stores">
        {reserved.length ? <div className="d-list">{reserved.map(r => <div className="d-li" key={r.part + r.job}><div className="d-grow"><b className="v-b">{r.part}</b><div className="d-muted">{r.supplier}, {r.job}</div></div><span className="d-muted">Qty {r.qty}</span><Chip tone="ok">{r.status}</Chip></div>)}</div>
          : <p className="d-muted v-empty-line">Nothing reserved or issued from stores for this vehicle.</p>}
      </Card>
      {got.length > 0 && <Card title="Recently received">{got.map(r => <div className="d-li" key={r.po}><span className="d-mono">{r.po}</span><div className="d-grow">{r.part} <span className="d-muted">from {r.supplier}</span></div><span className="d-muted">{r.received}</span></div>)}</Card>}
    </div>
  );
}

/* ── CVRT ────────────────────────────────────────────────────────────── */
export function CvrtTab({ sub }: TabProps) {
  const next = sub.notice;
  return (
    <div className="v-stack">
      {sub.cvrt.length ? sub.cvrt.map(t => (
        <Card key={t.id} title={<span className="d-row"><b>{t.id}</b><span className="d-muted">{t.lane}, {t.time}</span></span>}
          aside={<Chip tone={t.result === "pass" ? "ok" : t.result === "fail" ? "bad" : t.status === "scheduled" ? "acc" : "warn"}>{t.result ? t.result.toUpperCase() : "SCHEDULED"}{t.result ? `, ${t.status.replace("_", " ")}` : ""}</Chip>}>
          <dl className="d-kv v-facts">
            <dt>Outcome</dt><dd>{t.result === "pass" ? "Passed and reviewed by a person" : t.result === "fail" ? "Failed" : "Not yet tested"}</dd>
            {t.failItems && <><dt>Fail items</dt><dd>{t.failItems.join("; ")}</dd></>}
            <dt>Repair job</dt><dd>{t.repairJob ? <JLink id={t.repairJob} /> : "None"}</dd>
            <dt>Result owner</dt><dd>{pname(t.owner)}</dd>
            {t.evidence && <><dt>Evidence</dt><dd>{t.evidence}</dd></>}
          </dl>
          {sub.v?.row.note && <div className="d-note" style={{ marginTop: 10 }}><span>{sub.v.row.note}</span></div>}
          <div className="d-row v-gap"><Btn sm onClick={() => go("CVRT", t.status === "scheduled" ? "bookings" : "repairs")}>Open in CVRT</Btn></div>
        </Card>
      )) : <Empty>No CVRT booking for this vehicle today.</Empty>}
      <Card title="Next inspection due">
        {next ? <dl className="d-kv v-facts"><dt>Type</dt><dd>{next.kind}</dd><dt>Due</dt><dd>{fmtWhen(next.due, true)}</dd><dt>Source</dt><dd>Renault notice {next.id}</dd></dl>
          : <p className="d-muted v-empty-line">No Renault inspection notice on file for this vehicle.</p>}
      </Card>
    </div>
  );
}

/* ── COMMUNICATIONS ──────────────────────────────────────────────────── */
export function CommsTab({ s, sub, composeRef }: TabProps & { composeRef: RefObject<HTMLDivElement> }) {
  const list = commsFor(s, sub.key).slice().sort((a, b) => (a.day === b.day ? a.at.localeCompare(b.at) : a.day === "Today" ? 1 : -1));
  const sent = s.yard.customerUpdates[sub.key];
  const v = sub.v;
  const [draft, setDraft] = useState(() => draftUpdate(s, sub));
  const [stage, setStage] = useState<"edit" | "review">("edit");
  const co = company(sub.id.customerId);
  const nsent = sub.notice ? s.yard.notices[sub.notice.id] : undefined;
  const suggested = COMMS.filter(c => !s.yard.commsResolved[c.id] && c.status === "review" && c.suggestions?.[0]?.key === sub.key);
  return (
    <div className="v-stack">
      {suggested.length > 0 && (
        <Card title={`Suggested for this vehicle (${suggested.length})`} aside={<Chip tone="warn">Needs review</Chip>}>
          {suggested.map(c => (
            <div className="d-li v-sugg" key={c.id}>
              <ChannelBadge c={c.channel} />
              <div className="d-grow"><div><b className="v-b">{c.from}</b> <span className="d-faint">{c.channel}, {c.source}, {c.day} {c.at}</span></div><div className="v-bubble">{c.text}</div><div className="d-muted v-gap">{c.suggestions![0].why}. Confidence {c.suggestions![0].confidence}%.</div></div>
              <Btn sm kind="primary" onClick={() => A.resolveComm(c.id, sub.key)}>Confirm</Btn>
            </div>))}
        </Card>
      )}
      {v?.row.customerUpdated && <div className="d-note"><span>Last customer update: {v.row.customerUpdated}</span></div>}
      <Card title={`Thread (${list.length + (sent ? 1 : 0) + (nsent?.message ? 1 : 0)})`} aside={<Btn sm kind="ghost" onClick={() => go("Comms", "inbox")}>Open Communication Inbox</Btn>}>
        {list.length || sent || nsent?.message ? (
          <div className="v-thread">
            {list.map(c => (
              <div key={c.id} className="v-msg">
                <ChannelBadge c={c.channel} />
                <div className="v-msg-body">
                  <div className="v-msg-h"><b>{c.from}</b><span className="d-faint">{c.channel}, {c.source}</span><span className="d-mono d-faint v-msg-t">{c.day} {c.at}</span></div>
                  {c.subject && <div className="d-muted v-subj">{c.subject}</div>}
                  <div className="v-bubble">{c.text}</div>
                  {c.extracted && (
                    <div className="v-extract">
                      <div className="v-extract-h"><i aria-hidden />Pulse extracted</div>
                      <dl>{c.extracted.map(e => <div key={e.field}><dt>{e.field}</dt><dd>{e.value}</dd></div>)}</dl>
                      <div className="v-extract-f">Attached to: <b>{sub.id.reg}</b>{c.job && <>, <b>{c.job}</b></>}{c.part && <>, {partShort(c.part)}</>}{c.employee && <>, {pname(c.employee)}</>}{c.confidence ? <> <span className="d-faint">({c.confidence}% match)</span></> : null}</div>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {nsent?.message && (
              <div className="v-msg out">
                <ChannelBadge c={sub.notice!.channel} />
                <div className="v-msg-body"><div className="v-msg-h"><b>Anthony Reynolds</b><span className="d-faint">To {co?.contact ?? "customer"} by {sub.notice!.channel}, simulated send</span><span className="d-mono d-faint v-msg-t">Today {nsent.sentAt}</span></div><div className="v-bubble out">{nsent.message}</div></div>
              </div>
            )}
            {sent && (
              <div className="v-msg out">
                <ChannelBadge c={co?.channel ?? "WhatsApp"} />
                <div className="v-msg-body"><div className="v-msg-h"><b>Anthony Reynolds</b><span className="d-faint">To {co?.contact ?? "customer"} by {co?.channel ?? "WhatsApp"}, simulated send</span><span className="d-mono d-faint v-msg-t">Today {sent.at}</span></div><div className="v-bubble out">{sent.text}</div></div>
              </div>
            )}
          </div>
        ) : <Empty>No messages have been matched to this vehicle. Messages that mention the registration or the customer appear here automatically.</Empty>}
      </Card>
      <div ref={composeRef} id="v-compose">
        <Card title="Update the customer" aside={<Chip tone="acc">Drafted by Pulse</Chip>}>
          {!sub.id.customerId || !draft ? <p className="d-muted v-empty-line">{sub.id.customerId ? "There is nothing to draft for a vehicle that is not on site." : "No customer is matched to this vehicle, so there is nobody to update."}</p> : stage === "edit" ? (
            <>
              <textarea className="d-textarea" rows={7} aria-label="Customer update draft" value={draft} onChange={e => setDraft(e.target.value)} />
              <div className="d-row" style={{ marginTop: 10 }}>
                <Btn kind="primary" disabled={!draft.trim()} onClick={() => setStage("review")}>Send for approval</Btn>
                <Btn kind="ghost" onClick={() => setDraft(draftUpdate(s, sub))}>Redraft from live data</Btn>
                <span className="d-muted">To {co?.contact}, by {co?.channel ?? "email"}</span>
              </div>
            </>
          ) : (
            <>
              <Flag><b>Waiting for your approval.</b> Nothing is sent until you approve it.</Flag>
              <div className="v-bubble out v-preview">{draft}</div>
              <div className="d-row" style={{ marginTop: 10 }}>
                <Btn kind="primary" onClick={() => { if (!v && sub.notice) A.noticeSend(sub.notice.id, draft); else A.customerUpdate(sub.key, draft); setStage("edit"); }}>Approve and send</Btn>
                <Btn kind="ghost" onClick={() => setStage("edit")}>Back to edit</Btn>
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}

/* ── DOCUMENTS ───────────────────────────────────────────────────────── */
export function docsAll(s: State, sub: Subject): DocItem[] {
  if (sub.v) return docsFor(s, sub.key);
  const out: DocItem[] = [];
  const n = NOTICES.find(x => x.vehicle === sub.key);
  if (n) out.push({ id: n.id, title: `Renault periodic inspection notice ${n.id}`, type: "Renault notice", source: "Renault Trucks Ireland", when: fmtWhen(n.received) });
  sub.past.filter(p => p.invoice !== "n/a").forEach(p => out.push({ id: p.invoice, title: `Invoice ${p.invoice}`, type: "Invoice", source: "Keyloop", when: fmtWhen(p.doneAt) }));
  sub.jobs.forEach(j => out.push({ id: `JC-${j.id}`, title: `Job card ${j.id}`, type: "Job card", source: "Keyloop", when: "Today" }));
  sub.cvrt.forEach(t => out.push({ id: t.id, title: `CVRT test sheet ${t.id}`, type: "CVRT", source: "Reynolds CVRT lane", when: t.time, status: t.result ?? t.status }));
  commsFor(s, sub.key).filter(c => c.channel === "Email").forEach(c => out.push({ id: c.id, title: c.subject ?? "Email", type: "Email", source: c.source, when: `${c.day} ${c.at}` }));
  if (sub.stock) s.docs.filter(d => d.vehicle === sub.key).forEach(d => out.push({ id: d.id, title: d.title, type: d.type, source: d.source, when: d.version, status: d.status }));
  return out;
}
export function DocumentsTab({ s, sub }: TabProps) {
  const docs = docsAll(s, sub);
  if (!docs.length) return <Empty>No documents are attached to this vehicle.</Empty>;
  return (
    <Card>
      <div className="d-list v-docs">{docs.map(d => (
        <div className="d-li" key={d.id + d.title}>
          <span className="v-doc-type">{d.type}</span>
          <div className="d-grow"><b className="v-b">{d.title}</b><div className="d-muted">{d.source}, {d.when}</div></div>
          {d.status && <Chip tone={/pass|received|approved|ready/i.test(d.status) ? "ok" : /fail/i.test(d.status) ? "bad" : "warn"}>{d.status}</Chip>}
          <Btn sm kind="ghost" onClick={() => A.toast("Document preview is not part of the demo")}>View</Btn>
        </div>))}</div>
    </Card>
  );
}

/* ── FINANCE ─────────────────────────────────────────────────────────── */
export function FinanceTab({ s, sub, onClear }: TabProps & { onClear: (k: "release" | "clearance") => void }) {
  const fin = financeFor(s, sub.key);
  const v = sub.v;
  const money = canSeeMoney(s);
  const held = v?.accounts === "hold";
  return (
    <div className="v-stack">
      <ReleasePanel s={s} sub={sub} onClear={onClear} />
      {!money ? <Empty>Balances are not visible in this role preview. Switch the role in Settings.</Empty> : (
        <>
          <div className="d-grid d-g4 v-metrics">
            <Metric label="Invoice status" value={<span className="v-mv">{fin.invoice}</span>} hint={v?.jobId ?? sub.jobs[0]?.id} />
            <Metric label="Work in progress" value={eur(fin.wip)} hint="At the demo workshop rate" />
            <Metric label="Customer balance" value={eur(fin.outstanding)} hint={fin.customerId ? `${fin.recs.length} open invoice${fin.recs.length === 1 ? "" : "s"}` : "No customer"} />
            <Metric label="Overdue" value={eur(fin.overdue)} tone={fin.overdue > 0 ? "bad" : undefined} hint={held ? "Release on hold" : fin.overdue > 0 ? "On the customer account, vehicle not held" : "Nothing overdue"} />
          </div>
          <Card title="Customer invoices" aside={fin.customerId ? <CLink id={fin.customerId} /> : null}>
            {fin.recs.length ? <div className="d-list">{fin.recs.map(r => (
              <div className="d-li" key={r.id}><b className="v-b d-mono">{r.id}</b><span className="d-grow d-muted">Due {fmtWhen(r.due)}{r.overdue > 0 ? `, ${r.overdue} days overdue` : ""}</span><Chip tone={r.overdue > 0 ? "bad" : undefined}>{eur(r.amount)}</Chip></div>))}</div>
              : <p className="d-muted v-empty-line">No open invoices for this customer.</p>}
          </Card>
          <div className="d-note"><span>Keyloop holds the accounts. Pulse shows operational financial visibility only and does not post to the ledger.</span></div>
        </>
      )}
    </div>
  );
}

/* ── ACTIVITY ────────────────────────────────────────────────────────── */
export function ActivityTab({ s, sub }: TabProps) {
  const [f, setF] = useState<"all" | "people" | "system">("all");
  const all = useMemo(() => activityAll(s, sub, timelineAll(s, sub)), [s, sub]);
  const list = all.filter(a => f === "all" || (f === "people" ? a.kind === "Person" : a.kind !== "Person"));
  return (
    <Card title={`Activity (${list.length})`} aside={<Seg<"all" | "people" | "system"> value={f} onChange={setF} label="Filter activity" options={[["all", "All"], ["people", "People"], ["system", "System"]]} />}>
      {list.length ? <div className="d-list">{list.map((a, i) => (
        <div className="d-li v-act" key={i}>
          <span className="d-mono d-faint v-act-t">{dayOf(a.at) === "2026-10-19" ? hhmmOf(a.at) : `${fmtWhen(dayOf(a.at))} ${hhmmOf(a.at)}`}</span>
          <div className="d-grow"><b className="v-b">{a.who}</b> <span className="d-muted">{a.text}</span></div>
          <Chip tone={a.kind === "Agent" ? "acc" : undefined}>{a.kind}</Chip>
        </div>))}</div> : <Empty>No recorded actions on this vehicle yet.</Empty>}
    </Card>
  );
}

/* ── TIMELINE ────────────────────────────────────────────────────────── */
export function TimelineTab({ s, sub }: TabProps) {
  const [ch, setCh] = useState<Channel | "all">("all");
  const tl = useMemo(() => timelineAll(s, sub), [s, sub]);
  const channels = [...new Set(tl.map(e => e.channel))];
  const list = tl.filter(e => ch === "all" || e.channel === ch);
  const days = [...new Set(list.map(e => dayOf(e.at)))];
  return (
    <Card title={`Timeline (${list.length})`} aside={<span className="d-muted">Newest first</span>}>
      <div className="v-filter" role="group" aria-label="Filter by channel">
        <button className={"d-chip " + (ch === "all" ? "sel" : "")} onClick={() => setCh("all")}>All {tl.length}</button>
        {channels.map(c => <button key={c} className={"d-chip " + (ch === c ? "sel" : "")} onClick={() => setCh(c)}><ChannelBadge c={c} />{c} {tl.filter(e => e.channel === c).length}</button>)}
      </div>
      {list.length ? days.map(d => (
        <div key={d} className="v-tl-day">
          <DayHead day={d} />
          <ol className="v-tl">{list.filter(e => dayOf(e.at) === d).map((e, i) => (
            <li key={i}><ChannelBadge c={e.channel} /><div><div className="v-tl-h"><b>{e.who}</b><span className="d-mono d-faint">{hhmmOf(e.at)}</span><span className="d-faint">{e.channel}</span></div><div className="v-tl-t">{e.text}</div></div></li>))}</ol>
        </div>)) : <Empty>No events on this vehicle yet.</Empty>}
    </Card>
  );
}
