/* Operational Helpers: the agents, described as people-shaped jobs. Each helper
   watches something, finds things, recommends, does safe preparation, and asks
   before anything leaves the building. Every line is derived from the store and
   yard.ts, so approving something moves the numbers on every other page. */
import { useState } from "react";
import "./helpers.css";
import { A, approvals, cname, dur, eur, handoverGates, pname, useDerived, type Derived, type State } from "./store";
import { SERVICE_VEHICLES } from "./fixtures";
import { go } from "./nav";
import { Btn, Card, Chip, Head, Page } from "./ui";
import {
  ANPR_EVENTS, COMMS, NOTICES, commStatus, commsCounts, identityOf, inspectionCounts, noticeMessage, noticeState, overnightSummaryText, partsOverview, workshopOverview, yardCounts,
} from "./yard";

interface Item {
  id: string;
  text: string;
  sub?: string;
  /** Button label and what it does. Real store actions where one exists, a toast where it does not. */
  label: string;
  run: () => void;
  /** True when the action only shows a toast (so the item is marked done locally). */
  sim?: boolean;
  dest: [string, string, string];
}
interface Helper { id: string; name: string; job: string; watches: string; found: string[]; recs: string[]; did: string[]; items: Item[] }

const n = (x: number, one: string, many = one + "s") => `${x} ${x === 1 ? one : many}`;
const names = (xs: string[]) => xs.length <= 1 ? xs.join("") : xs.slice(0, -1).join(", ") + " and " + xs[xs.length - 1];
const plain = (t: string) => t.replace(/\s*\([^)]*\)/g, "");
const clip = (t: string, k = 90) => t.length > k ? t.slice(0, k - 1).trimEnd() + "..." : t;

function build(s: State, d: Derived): Helper[] {
  const c = yardCounts(s), w = workshopOverview(s), p = partsOverview(s), ins = inspectionCounts(s), cm = commsCounts(s);
  const unalloc = d.tn.filter(t => t.state === "unallocated");

  /* 1. Operations Watchdog */
  const flags = d.budgetFlags;
  const watchdog: Helper = {
    id: "watchdog", name: "Operations Watchdog", job: "Keeps an eye on the workshop floor so nothing slips quietly.",
    watches: `Clocking against job budgets (warning at ${s.rules.warn}%), attendance, and idle time over ${s.rules.gap} minutes.`,
    found: [
      ...flags.map(f => `${pname(f.j.tech)} on ${f.j.id} is at ${+f.pct.toFixed(1)}% of the time budget`),
      ...unalloc.filter(t => (t.gapMin ?? 0) > s.rules.gap).map(t => `${pname(t.id)} is present and unallocated for ${dur(t.gapMin ?? 0)}`),
    ],
    recs: [
      ...(flags[0] ? [`Check ${flags[0].j.id} with ${pname(flags[0].j.tech)} before it runs over`] : []),
      ...(unalloc.length ? [`Give ${names(unalloc.map(t => pname(t.id)))} their next job from the queue`] : []),
    ],
    did: [`Flagged ${n(flags.length, "job")} near or over budget and ${n(unalloc.length, "idle technician")} in the morning brief`, "Raw clocking left unchanged. Reasons are recorded by a person"],
    items: [
      ...(flags[0] ? [{ id: "wd-budget", text: `Send a budget warning for ${flags[0].j.id} to ${pname(flags[0].j.tech)}`, sub: `${+flags[0].pct.toFixed(1)}% of ${flags[0].j.budgetMin} minutes used`, label: "Approve", sim: true,
        run: () => A.toast(`Budget warning for ${flags[0].j.id} sent to ${pname(flags[0].j.tech)} (simulated)`), dest: ["Workshop", "live", "Live Board"] as [string, string, string] }] : []),
    ],
  };

  /* 2. Workshop Planner */
  const hop = d.hopper[0], free = unalloc[0];
  const planner: Helper = {
    id: "planner", name: "Workshop Planner", job: "Lines the day's jobs up against who is actually here.",
    watches: "Queued and unassigned jobs against technician attendance, training and skills.",
    found: [
      `${n(d.hopper.length, "job")} unassigned in the hopper and ${n(d.queued.length, "job")} queued`,
      `${n(w.activeTechs, "technician")} active today: ${d.counts.onJob} on a job, ${d.counts.unallocated} free`,
      `${d.counts.absent} absent and ${d.counts.training} in training`,
    ],
    recs: hop && free ? [`Give ${hop.id} (${dur(hop.budgetMin)}) to ${pname(free.id)}, who is free now`] : ["Nothing to move. Every present technician is on a job"],
    did: [`Laid out ${n(d.inProgress.length + d.queued.length, "job")} across today's lanes`, "Held parts-blocked jobs back until the part is in"],
    items: hop && free ? [{ id: "pl-alloc", text: `Move ${hop.id} to ${pname(free.id)}`, sub: `${hop.complaint}, ${dur(hop.budgetMin)}`, label: "Approve", sim: true,
      run: () => A.toast(`${hop.id} proposed to ${pname(free.id)} for Jonathan Keenan to confirm (simulated)`), dest: ["Workshop", "planner", "Planner"] }] : [],
  };

  /* 3. Parts Monitor */
  const chase = p.open.find(j => !j.tech) ?? p.open[0];
  const parts: Helper = {
    id: "parts", name: "Parts Monitor", job: "Follows every open purchase order until the part is on the bench.",
    watches: "Open purchase orders, supplier ETAs, and what each missing part is holding up.",
    found: [`${n(p.open.length, "job")} waiting on parts`, `${p.lostHours.toFixed(1)} h of workshop capacity at risk`, `${n(p.stalled.length, "job")} cannot move at all until the part arrives`],
    recs: chase?.partBlocker ? [`Chase ${chase.partBlocker.po ?? "the order"} (${plain(chase.partBlocker.part)}, ${chase.partBlocker.supplier}) for ${identityOf(s, chase.vehicle).reg}, due ${chase.partBlocker.eta}`] : ["No part is overdue"],
    did: [`Attached ${n(COMMS.filter(x => x.type === "Parts update" && commStatus(s, x) === "auto").length, "parts update")} from WhatsApp, email and Keyloop to the right vehicle and job`],
    items: chase?.partBlocker ? [{ id: "pm-chase", text: `Chase ${chase.partBlocker.po ?? "the order"} with ${chase.partBlocker.supplier}`, sub: `${plain(chase.partBlocker.part)} for ${identityOf(s, chase.vehicle).reg}. ${pname(chase.partBlocker.owner)} owns it`, label: "Approve", sim: true,
      run: () => A.toast(`Chase sent to ${chase.partBlocker!.supplier} for ${chase.partBlocker!.po ?? "the order"} (simulated)`), dest: ["Workshop", "parts", "Parts & Blockers"] }] : [],
  };

  /* 4. Inspection Coordinator */
  const fresh = NOTICES.filter(x => noticeState(s, x).stage === "new");
  const inspect: Helper = {
    id: "inspect", name: "Inspection Coordinator", job: "Turns Renault inspection notices into customer reminders and bookings.",
    watches: "Renault periodic inspection notices, customer replies and the bookings that follow.",
    found: [`${n(ins.new, "new notice")} received`, `${n(ins.awaiting, "customer")} awaiting a reply`, `${n(ins.due14, "notice")} due within 14 days${ins.overdue ? `, ${ins.overdue} overdue` : ""}`],
    recs: fresh.length ? [`Send a reminder for each new notice, using the channel the customer last used`] : ["Chase the customers who have not replied"],
    did: [fresh.length ? `Drafted reminders for ${n(fresh.length, "new notice")}: customer identified, contact details found, usual channel confirmed` : "No new notices to draft"],
    items: fresh.map(x => {
      const sv = SERVICE_VEHICLES.find(v => v.id === x.vehicle);
      return { id: "ic-" + x.id, text: `Send ${x.channel} reminder for ${sv?.reg ?? x.vehicle} (${cname(sv?.customer)})`, sub: noticeMessage(x), label: "Approve and send", run: () => A.noticeSend(x.id, noticeMessage(x)), dest: ["Inspections", "notices", "Notices"] as [string, string, string] };
    }),
  };

  /* 5. Sales Follow-Up */
  const openQ = s.quotes.filter(q => q.stage !== "Won");
  const disc = approvals(s, d).filter(a => a.queue === "Discount approval");
  const sales: Helper = {
    id: "sales", name: "Sales Follow-Up", job: "Keeps quotes and enquiries from going quiet.",
    watches: "Open quotes, discount approvals, reserved vehicles and promised handovers.",
    found: [`${n(openQ.length, "quote")} open, ${n(openQ.filter(q => q.due === "Today").length, "quote")} with a next action due today`, `${n(d.reserved.length, "vehicle")} reserved for customers`, `${n(disc.length, "discount")} waiting for approval`],
    recs: disc[0] ? [`Decide ${disc[0].title.replace(" — ", ": ")} so the quote can go out today`] : ["Nothing is waiting on you in sales"],
    did: [`Flagged ${n(openQ.filter(q => q.due === "Today").length, "quote")} due today for Jack Kelly`, "Nothing has been sent to a customer"],
    items: disc.map(a => ({ id: "sf-" + a.id, text: a.title.replace(" — ", ": "), sub: a.evidence[0], label: "Approve discount", run: () => A.approveDiscount(a.record), dest: ["Sales", "quote", "Quote Builder"] as [string, string, string] })),
  };

  /* 6. Invoice Readiness */
  const holdSum = c.accounts.reduce((t, v) => t + v.balance, 0);
  const todo = d.ready.filter(j => !s.invoiceExports.includes(j.id));
  const invoice: Helper = {
    id: "invoice", name: "Invoice Readiness", job: "Checks every finished job is safe to invoice and safe to release.",
    watches: "Completed jobs, write-up confirmation, accounts balances and release holds.",
    found: [`${n(d.ready.length, "job")}, ${eur(d.readyNet)}, ready to invoice`, `${n(d.blocked.length, "write-up")} (${eur(d.blockedNet)}) still waiting on a technician or service manager`, `${n(c.accounts.length, "accounts hold")} with ${eur(holdSum)} outstanding: release blocked`],
    recs: [todo.length ? `Prepare the Keyloop export for ${n(todo.length, "ready job")}` : "Every ready job has an export prepared", ...(c.accounts.length ? [`Do not release ${names(c.accounts.map(v => v.reg))} until accounts approve`] : [])],
    did: [`Checked ${n(d.completed.length, "completed job")} against write-up and accounts status`, `${n(s.invoiceExports.length, "export")} prepared so far. Nothing is posted to accounting`],
    items: [
      ...(todo.length ? [{ id: "ir-export", text: `Prepare the export for ${n(todo.length, "ready job")} (${eur(todo.reduce((t, j) => t + (j.net ?? 0), 0))})`, sub: "Creates a sample file in the demo. Not posted to accounting", label: "Approve", run: () => A.prepareExport(todo.map(j => j.id)), dest: ["Finance", "readiness", "Invoice Readiness"] as [string, string, string] }] : []),
      ...c.accounts.map(v => ({ id: "ir-" + v.key, text: `Accounts approval to release ${v.reg} (${v.customer})`, sub: `${eur(v.balance)} outstanding. Caroline Glynn decides`, label: "Ask Caroline", sim: true, run: () => A.toast(`Request to review ${v.reg} sent to Caroline Glynn (simulated)`), dest: ["Yard", "live", "Yard"] as [string, string, string] })),
    ],
  };

  /* 7. Handover Coordinator */
  const v8 = c.all.find(v => v.key === "V008");
  const hg = gatesOf(s);
  const ccPending = !s.decisions["cc-V008"];
  const handover: Helper = {
    id: "handover", name: "Handover Coordinator", job: "Makes sure a vehicle leaves only when every gate is closed.",
    watches: "Parts, repair, CVRT result, documents and accounts clearance on vehicles heading for handover.",
    found: hg.open.length ? [`V008 (${v8?.reg ?? ""}, ${v8?.customer ?? ""}) has ${hg.open.length} of ${hg.total} release gates open`, ...hg.open.map(g => `${g.label}: ${g.detail}`)] : ["V008 has every release gate closed"],
    recs: hg.open.length ? [`Close the gates in order: ${names(hg.open.map(g => `${g.label.replace(/^([A-Z])([a-z])/, (_m, a: string, b: string) => a.toLowerCase() + b)} (${pname(g.owner)})`))}`] : ["V008 can be handed over"],
    did: ["Listed each gate with its owner", "A repair finishing does not pass the test: the retest is a separate gate"],
    items: [
      ...(hg.open.some(g => g.key === "accounts") ? [{ id: "hc-acc", text: "Record accounts clearance for V008", sub: "Only after Caroline Glynn confirms. Release stays blocked until repair and retest are done", label: "Approve", run: () => A.setGate("V008", "accounts", true), dest: ["Sales", "handovers", "Handovers"] as [string, string, string] }] : []),
      ...(ccPending ? [{ id: "hc-cc", text: "Approve the customer update draft for V008", sub: "Prepared by this helper. No release date promised and no internal costs. It is not sent from the demo", label: "Approve draft", run: () => A.decide("cc-V008", "approved", "Approved the V008 customer update draft"), dest: ["Work", "approvals", "Approvals"] as [string, string, string] }] : []),
    ],
  };

  /* 8. Yard Monitor */
  const anpr = ANPR_EVENTS.filter(e => e.suggestion && !s.yard.anpr[e.id]);
  const unknownList = c.unknown;
  const yard: Helper = {
    id: "yard", name: "Yard Monitor", job: "Knows what is physically on the site and why it is there.",
    watches: "ANPR reads at both gates, the overnight yard, and vehicles with no booking or record.",
    found: [`${n(c.unknownN, "unknown vehicle")} not matched to a customer${unknownList.length ? ` (${names(unknownList.map(v => v.reg))})` : ""}`, `${c.arrivedToday} arrived today, ${c.overnightN} staying overnight`, `${c.readyN} ready to leave, ${c.blockedN} blocked`],
    recs: [...(anpr[0]?.suggestion ? [`Match ${anpr[0].read} (${anpr[0].confidence}% read) to ${anpr[0].suggestion.why}`] : []), ...(c.unknown.some(v => v.key === "U002") ? ["Ask the yard group who left the white Master in row C on Friday night"] : [])].concat(c.unknownN === 0 ? ["Nothing unmatched in the yard"] : []),
    did: [`Added ${n(c.arrivedToday, "arrival")} to the yard from the gate cameras`, s.yard.overnightSummary ? "Generated the overnight management summary" : "Drafted the overnight summary, ready to generate"],
    items: [
      ...anpr.map(e => ({ id: "ym-" + e.id, text: `Match ${e.read} to ${e.suggestion!.why.split(" · ")[0]}`, sub: `${e.confidence}% read confidence. ${e.suggestion!.why}`, label: "Approve match", run: () => A.anprMatch(e.id, e.suggestion!.key), dest: ["Yard", "anpr", "ANPR Events"] as [string, string, string] })),
      ...(!s.yard.overnightSummary ? [{ id: "ym-night", text: "Generate the overnight management summary", sub: clip(overnightSummaryText(s), 130), label: "Approve", run: () => A.overnightSummary(overnightSummaryText(s)), dest: ["Yard", "overnight", "Overnight"] as [string, string, string] }] : []),
    ],
  };

  /* 9. Communication Triage */
  const review = COMMS.filter(x => commStatus(s, x) === "review" && x.suggestions?.[0]);
  const triage: Helper = {
    id: "triage", name: "Communication Triage", job: "Reads the WhatsApp groups and mailboxes so you do not have to.",
    watches: "Parts, workshop and yard WhatsApp groups, shared mailboxes, Keyloop events and the phone log.",
    found: [`Matched ${n(cm.auto, "message")} to a vehicle, customer and job (${cm.total} read)`, `${cm.review} need review`, `${n(cm.unmatched, "message")} could not be matched at all`],
    recs: review.length ? [`Confirm the ${review.length} suggested matches, highest first (${Math.max(...review.map(x => x.suggestions![0].confidence))}%)`] : ["Every message that could be matched has been matched"],
    did: [`Extracted vehicle, part, ETA and sender from ${n(cm.auto, "message")}`, "Attached each one to the vehicle timeline and current job"],
    items: [...review].sort((a, b) => b.suggestions![0].confidence - a.suggestions![0].confidence).map(x => {
      const sug = x.suggestions![0];
      return { id: "ct-" + x.id, text: `${x.from}: "${clip(x.text, 70)}"`, sub: `Likely ${identityOf(s, sug.key).reg} (${sug.confidence}%). ${sug.why}`, label: "Confirm", run: () => A.resolveComm(x.id, sug.key), dest: ["Comms", "inbox", "Inbox"] as [string, string, string] };
    }),
  };

  return [watchdog, planner, parts, inspect, sales, invoice, handover, yard, triage];
}

/** Release gates for V008 (the vehicle that carries the handover story). */
function gatesOf(s: State) {
  const list = handoverGates(s, "V008").list;
  return { total: list.length, open: list.filter(x => !x.ok) };
}

export function HelpersPage() {
  const [s, d] = useDerived();
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const [done, setDone] = useState<Record<string, boolean>>({});
  const all = build(s, d).map(h => ({ ...h, items: h.items.filter(i => !done[i.id]) }));
  const total = all.reduce((t, h) => t + h.items.length, 0);
  const allOpen = all.every(h => open[h.id]);
  const jump = (id: string) => { setOpen(o => ({ ...o, [id]: true })); requestAnimationFrame(() => document.getElementById("h-" + id)?.scrollIntoView({ block: "start" })); };
  const act = (i: Item) => { i.run(); if (i.sim) setDone(x => ({ ...x, [i.id]: true })); };

  return (
    <Page>
      <Head title="Operational Helpers" sub="Nine helpers watch the yard, workshop, parts, inspections and messages. They find things, recommend, and prepare the work. Nothing leaves the building without your approval.">
        <Btn sm kind="ghost" onClick={() => setOpen(Object.fromEntries(all.map(h => [h.id, !allOpen])))}>{allOpen ? "Collapse all" : "Expand all"}</Btn>
      </Head>

      <div className="h-summary" role="list" aria-label="Helpers and what needs approval">
        <div className="h-total" role="listitem"><b>{total}</b><span>{total === 1 ? "item needs" : "items need"} your approval</span></div>
        {all.map(h => (
          <button key={h.id} role="listitem" className={"h-pill " + (h.items.length ? "warn" : "ok")} onClick={() => jump(h.id)} title={h.job}>
            <span>{h.name}</span><i>{h.items.length ? h.items.length : "OK"}</i>
          </button>
        ))}
      </div>

      <div className="h-list">
        {all.map(h => {
          const isOpen = !!open[h.id];
          return (
            <Card key={h.id} className={"h-card " + (isOpen ? "open" : "")}>
              <div id={"h-" + h.id} className="h-anchor" />
              <button className="h-head" aria-expanded={isOpen} aria-controls={"hb-" + h.id} onClick={() => setOpen(o => ({ ...o, [h.id]: !o[h.id] }))}>
                <span className="h-name"><b>{h.name}</b><span className="d-muted">{h.job}</span></span>
                <span className="h-one">{h.found[0] ?? "Nothing to report"}</span>
                <Chip tone={h.items.length ? "warn" : "ok"}>{h.items.length ? `${h.items.length} to approve` : "Nothing to approve"}</Chip>
                <span className="h-caret" aria-hidden>{isOpen ? "Hide" : "Show"}</span>
              </button>
              {isOpen && (
                <div id={"hb-" + h.id} className="h-body">
                  <Block label="What it watches"><p>{h.watches}</p></Block>
                  <Block label="What it found">{h.found.length ? <ul>{h.found.map((x, i) => <li key={i}>{x}</li>)}</ul> : <p className="d-muted">Nothing to report.</p>}</Block>
                  <Block label="What it recommends"><ul>{h.recs.map((x, i) => <li key={i}>{x}</li>)}</ul></Block>
                  <Block label="What it did"><ul>{h.did.map((x, i) => <li key={i}>{x}</li>)}</ul></Block>
                  <Block label="What needs approval" wide tone={h.items.length ? "warn" : "ok"}>
                    {h.items.length === 0 && <p className="d-muted">Nothing is waiting on you.</p>}
                    <div className="h-items">
                      {h.items.map(i => (
                        <div key={i.id} className="h-item">
                          <div className="d-grow"><div className="h-item-t">{i.text}</div>{i.sub && <div className="d-muted">{i.sub}</div>}</div>
                          <div className="h-item-b">
                            <Btn sm kind="primary" onClick={() => act(i)}>{i.label}</Btn>
                            <Btn sm kind="ghost" onClick={() => go(i.dest[0], i.dest[1])}>Open {i.dest[2]}</Btn>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Block>
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </Page>
  );
}

function Block({ label, children, wide, tone }: { label: string; children: React.ReactNode; wide?: boolean; tone?: "warn" | "ok" }) {
  return <section className={"h-block " + (wide ? "wide " : "") + (tone ?? "")}><h4>{label}</h4>{children}</section>;
}
