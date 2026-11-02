/* Vehicle Command Centre: the subject model. One Subject per page view, built
   from yard.ts + the store, so the page works for a yard vehicle, a service
   vehicle that is not on site, or a dealership stock id. Nothing is retyped:
   every sentence, number and name comes from the shared logic layer. */
import { SERVICE_VEHICLES, type CvrtBooking, type Job, type ServiceVehicle, type Vehicle } from "../fixtures";
import { cname, company, eur, handoverGates, pname, type State } from "../store";
import { NOTICES, PAST_JOBS, RECEIVED_POS, TODAY_ISO, type Notice, type PastJob } from "../yardData";
import {
  STATUS, applyFilter, commsFor, dayOf, financeFor, fmtWhen, hhmmOf, identityOf, noticeMessage, noticeState, storyFor, techName, tenQuestions, timelineFor, vehicleByKey, yardVehicles,
  type Answer, type Channel, type TimelineEvent, type YardFilter, type YardVehicle,
} from "../yard";

export type VKind = "yard" | "service" | "stock";
export interface Subject {
  key: string;
  kind: VKind;
  id: ReturnType<typeof identityOf>;
  v: YardVehicle | undefined;
  sv: ServiceVehicle | undefined;
  stock: Vehicle | undefined;
  /** Live jobs on this vehicle, current job first. */
  jobs: Job[];
  past: PastJob[];
  cvrt: CvrtBooking[];
  notice: Notice | undefined;
}

export function subjectOf(s: State, key: string): Subject {
  const v = vehicleByKey(s, key);
  const sv = SERVICE_VEHICLES.find(x => x.id === key);
  const stock = s.stock.find(x => x.id === key);
  const jobs = s.jobs.filter(j => j.vehicle === key).sort((a, b) => (a.id === v?.row.job ? -1 : b.id === v?.row.job ? 1 : 0));
  return {
    key, kind: v ? "yard" : stock ? "stock" : "service", id: identityOf(s, key), v, sv, stock, jobs,
    past: PAST_JOBS.filter(p => p.vehicle === key).sort((a, b) => (a.doneAt < b.doneAt ? 1 : -1)),
    cvrt: s.cvrt.filter(c => c.vehicle === key), notice: NOTICES.find(n => n.vehicle === key),
  };
}

export const partShort = (p: string) => p.replace(/ \(.*\)/, "");
export const supplierId = (name: string): string | null => (/renault/i.test(name) ? "s-renault" : /midland/i.test(name) ? "s-cvparts" : null);

/* ── search ──────────────────────────────────────────────────────────── */
type Tn = "ok" | "warn" | "bad" | "acc" | undefined;
export interface Hit { key: string; reg: string; model: string; customer: string; onSite: boolean; status: string; tone: Tn }
const norm = (x: string) => x.toLowerCase().replace(/[^a-z0-9]/g, "");
export function searchAll(s: State, q: string): Hit[] {
  const n = norm(q), t = q.trim().toLowerCase();
  if (!n) return [];
  const yard = yardVehicles(s).filter(v => norm(v.reg).includes(n) || v.customer.toLowerCase().includes(t) || (v.jobId ?? "").toLowerCase() === t || v.key.toLowerCase() === t);
  const hits: Hit[] = yard.map(v => ({ key: v.key, reg: v.reg, model: v.model, customer: v.customer, onSite: true, status: STATUS[v.status].short, tone: STATUS[v.status].tone }));
  const seen = new Set(hits.map(h => h.key));
  SERVICE_VEHICLES.forEach(sv => {
    if (seen.has(sv.id) || !sv.customer) return;
    if (norm(sv.reg).includes(n) || cname(sv.customer).toLowerCase().includes(t) || sv.id.toLowerCase() === t) {
      hits.push({ key: sv.id, reg: sv.reg, model: sv.model, customer: cname(sv.customer), onSite: false, status: "Not on site", tone: undefined }); seen.add(sv.id);
    }
  });
  s.stock.forEach(st => {
    if (seen.has(st.id)) return;
    if (st.id.toLowerCase() === t || (st.reg && norm(st.reg).includes(n))) {
      hits.push({ key: st.id, reg: st.reg || st.id, model: `Renault ${st.model} ${st.variant}`, customer: st.customer ? cname(st.customer) : "Dealership stock", onSite: false, status: "Stock: " + st.status, tone: undefined }); seen.add(st.id);
    }
  });
  return hits;
}

/** Prev/next order: the filtered yard in the same order the Yard page lists (status severity, then promised time). */
export function yardOrder(s: State): YardVehicle[] {
  const f = (s.focus.yardFilter as YardFilter | undefined) ?? "all";
  return applyFilter(yardVehicles(s), f).sort((a, b) => STATUS[a.status].order - STATUS[b.status].order || (a.promised ?? "z").localeCompare(b.promised ?? "z") || a.reg.localeCompare(b.reg));
}

/* ── story + ten answers (yard from yard.ts, off site derived here) ──── */
export function storyLines(s: State, sub: Subject): string[] {
  if (sub.v) return storyFor(s, sub.key);
  const out: string[] = [sub.stock ? `${sub.id.reg} is dealership stock and is not in the service yard.` : `${sub.id.reg} is not on site${sub.id.customerId ? ` (${cname(sub.id.customerId)})` : ""}.`];
  if (sub.stock) {
    const st = sub.stock;
    out.push(`It is a ${st.model} ${st.variant}, status ${st.status}, ${st.status === "incoming" ? `due ${st.eta ?? "to be confirmed"}` : `at ${st.location}`}.`);
    if (st.customer || st.promisedTo) out.push(`It is ${st.customer ? "assigned to" : "promised to"} ${cname(st.customer ?? st.promisedTo)}.`);
    if (st.jobRef) out.push(`Workshop job ${st.jobRef} is linked to it.`);
    if (s.gates[sub.key]) { const g = handoverGates(s, sub.key); out.push(g.ready ? "All release gates are clear." : `Handover is waiting on: ${g.list.filter(x => !x.ok).map(x => x.label.toLowerCase()).join(", ")}.`); }
    out.push(st.specStatus === "approved" ? "An approved specification sheet is attached." : "No approved specification sheet is attached yet.");
    return out;
  }
  const n = sub.notice;
  if (n) {
    const st = noticeState(s, n);
    out.push(`Renault Trucks Ireland sent a ${n.kind.toLowerCase()} notice ${fmtWhen(n.received)}. It is due ${fmtWhen(n.due)}.`);
    out.push(st.stage === "new" ? "Nobody has contacted the customer yet." : st.stage === "contacted" ? `Pulse contacted the customer by ${n.channel}. No reply yet.` : st.stage === "awaiting" ? `The customer was contacted by ${n.channel} and has not replied.` : `The inspection is booked for ${fmtWhen(st.bookedFor ?? n.bookedFor)}.`);
  }
  const p = sub.past[0];
  if (p) out.push(`Last job on record: ${p.id}, ${p.complaint.toLowerCase()}, ${fmtWhen(p.doneAt)}.`);
  const fin = financeFor(s, sub.key);
  if (fin.overdue > 0) out.push(`${cname(sub.id.customerId)} has ${eur(fin.overdue)} overdue on account.`);
  if (out.length === 1) out.push("No job, notice or message is open for this vehicle.");
  return out;
}

export function answers(s: State, sub: Subject): Answer[] {
  if (sub.v) return tenQuestions(s, sub.key);
  const n = sub.notice, ns = n ? noticeState(s, n) : null, st = sub.stock, fin = financeFor(s, sub.key), p = sub.past[0];
  const job = sub.jobs[0];
  return [
    { q: "Who owns it?", a: sub.id.customerId ? cname(sub.id.customerId) : "Reynolds Commercials stock" },
    { q: "Why is it here?", a: n ? `Not on site. A ${n.kind.toLowerCase()} is due ${fmtWhen(n.due)}` : "Not on site" },
    { q: "What work has been done?", a: p ? `${p.id}: ${p.complaint}` : job ? job.complaint : "Nothing recorded" },
    { q: "What still needs doing?", a: n && ns && ns.stage !== "booked" ? `${n.kind} due ${fmtWhen(n.due)}` : n ? `${n.kind} booked` : st?.status === "incoming" ? "Receive and prepare" : "Nothing open" },
    { q: "Who is responsible?", a: n ? "Inspection Coordinator, Anthony approves" : job?.tech ? pname(job.tech) : "Not assigned" },
    { q: "Waiting for a part?", a: job?.partBlocker && !job.partBlocker.received ? `Yes: ${partShort(job.partBlocker.part)}` : "No", tone: job?.partBlocker && !job.partBlocker.received ? "warn" : "ok" },
    { q: "When is the part arriving?", a: job?.partBlocker && !job.partBlocker.received ? job.partBlocker.eta : "Not applicable" },
    { q: "Has the customer been updated?", a: ns?.sentAt ? `Today ${ns.sentAt}` : n?.contactedAt ? fmtWhen(n.contactedAt) : "No update recorded", tone: ns?.sentAt || n?.contactedAt ? "ok" : "warn" },
    { q: "Any accounts issue?", a: fin.overdue > 0 ? `Customer has ${eur(fin.overdue)} overdue` : "No", tone: fin.overdue > 0 ? "warn" : "ok" },
    { q: "When should it leave?", a: "Not applicable" },
  ];
}

/* ── timeline + activity ─────────────────────────────────────────────── */
export function timelineAll(s: State, sub: Subject): TimelineEvent[] {
  const ev = timelineFor(s, sub.key).map(e => (sub.v?.unresolved && e.kind === "arrival" ? { ...e, text: `${sub.v.reg} read at the gate. No matching vehicle or customer, so it was held for review.` } : e));
  if (!sub.v) {
    const n = sub.notice;
    if (n) {
      const st = noticeState(s, n);
      ev.push({ at: n.received, channel: "Renault", who: "Renault Trucks Ireland", text: `${n.kind} notice ${n.id} received, due ${fmtWhen(n.due)}.`, kind: "comms" });
      if (n.contactedAt) ev.push({ at: n.contactedAt, channel: n.channel, who: "Inspection Coordinator", text: `Reminder sent to ${cname(sub.id.customerId)} by ${n.channel}.`, kind: "comms" });
      if (st.sentAt) ev.push({ at: `${TODAY_ISO}T${st.sentAt}`, channel: n.channel, who: "Anthony Reynolds", text: "Reminder approved and sent (simulated).", kind: "comms" });
      if (n.repliedAt) ev.push({ at: n.repliedAt, channel: n.channel, who: cname(sub.id.customerId), text: n.reply ?? "Customer replied.", kind: "comms" });
      if (st.bookedFor ?? n.bookedFor) ev.push({ at: `${(st.bookedFor ?? n.bookedFor)!.slice(0, 10)}T${hhmmOf(st.bookedFor ?? n.bookedFor!) || "08:00"}`, channel: "Pulse", who: "Inspection Coordinator", text: `Inspection booked for ${fmtWhen(st.bookedFor ?? n.bookedFor)}.`, kind: "job" });
    }
    sub.past.forEach(p => ev.push({ at: p.doneAt, channel: "Keyloop", who: pname(p.tech), text: `${p.id} completed: ${p.complaint}.${p.invoice !== "n/a" ? ` Invoiced ${p.invoice}.` : ""}`, kind: "workshop" }));
    sub.cvrt.forEach(t => ev.push({ at: `${TODAY_ISO}T${t.time}`, channel: "Workshop", who: pname(t.owner), text: `CVRT ${t.id} ${t.result ? t.result.toUpperCase() : t.status.replace("_", " ")}.`, kind: "cvrt" }));
    ev.sort((a, b) => (a.at < b.at ? 1 : a.at > b.at ? -1 : 0));
  }
  return ev;
}

export interface ActItem { at: string; who: string; kind: "Person" | "Agent" | "Import" | "Workflow"; text: string; attention?: boolean }
export function activityAll(s: State, sub: Subject, tl: TimelineEvent[]): ActItem[] {
  const ids = new Set<string>([sub.key, ...sub.jobs.map(j => j.id), ...sub.past.map(p => p.id), ...(sub.v?.jobId ? [sub.v.jobId] : [])]);
  const mine = s.activity.filter(a => (a.entity && ids.has(a.entity)) || (sub.id.reg.length > 4 && a.text.includes(sub.id.reg)))
    .map<ActItem>(a => ({ at: `${TODAY_ISO}T${a.at}`, who: a.who, kind: a.kind === "person" ? "Person" : a.kind === "agent" ? "Agent" : a.kind === "import" ? "Import" : "Workflow", text: a.text, attention: a.attention }));
  const sig = (at: string, who: string) => `${at.slice(0, 16)}|${who.toLowerCase().split(" ")[0]}`;
  const seen = new Set(mine.map(m => sig(m.at, m.who)));
  const derived = tl.filter(e => (e.channel === "Keyloop" || e.channel === "Workshop" || e.channel === "Pulse") && !seen.has(sig(e.at, e.who)))
    .map<ActItem>(e => ({ at: e.at, who: e.who, kind: e.channel === "Pulse" ? "Agent" : e.channel === "Keyloop" && /sync|^Keyloop$/i.test(e.who) ? "Import" : "Person", text: e.text }));
  return [...mine, ...derived].sort((a, b) => (a.at < b.at ? 1 : a.at > b.at ? -1 : 0));
}

/* ── linked records (data model graph) ───────────────────────────────── */
export type LinkKind = "VEHICLE" | "CUSTOMER" | "JOB" | "TECHNICIAN" | "PART" | "PO" | "SUPPLIER" | "COMMUNICATION" | "INVOICE" | "CVRT" | "DOCUMENT";
export type Target = { t: "company"; id: string } | { t: "job"; id: string } | { t: "tab"; tab: string } | { t: "none" };
export interface LinkNode { kind: LinkKind; label: string; target: Target; hint?: string }
export function linkedRecords(s: State, sub: Subject, docCount: number): LinkNode[] {
  const out: LinkNode[] = [{ kind: "VEHICLE", label: sub.id.reg, target: { t: "none" }, hint: "this record" }];
  if (sub.id.customerId) out.push({ kind: "CUSTOMER", label: cname(sub.id.customerId), target: { t: "company", id: sub.id.customerId } });
  const jobs = [...sub.jobs.map(j => j.id), ...sub.past.map(p => p.id)];
  jobs.forEach(id => out.push({ kind: "JOB", label: id, target: { t: "job", id } }));
  const techs = new Set<string>();
  sub.jobs.forEach(j => j.tech && techs.add(j.tech)); sub.past.forEach(p => techs.add(p.tech));
  techs.forEach(t => out.push({ kind: "TECHNICIAN", label: pname(t), target: { t: "tab", tab: "workshop" } }));
  const pbs = sub.jobs.filter(j => j.partBlocker).map(j => j.partBlocker!);
  pbs.forEach(p => {
    out.push({ kind: "PART", label: partShort(p.part), target: { t: "tab", tab: "parts" }, hint: p.received ? "received" : `ETA ${p.eta}` });
    if (p.po) out.push({ kind: "PO", label: p.po, target: { t: "tab", tab: "parts" } });
    const sid = supplierId(p.supplier);
    out.push({ kind: "SUPPLIER", label: p.supplier, target: sid ? { t: "company", id: sid } : { t: "none" } });
  });
  const nComms = commsFor(s, sub.key).length;
  if (nComms) out.push({ kind: "COMMUNICATION", label: `${nComms} message${nComms === 1 ? "" : "s"}`, target: { t: "tab", tab: "comms" } });
  const fin = financeFor(s, sub.key);
  if (sub.v?.accounts === "hold") fin.recs.filter(r => r.overdue > 0).forEach(r => out.push({ kind: "INVOICE", label: r.id, target: { t: "tab", tab: "finance" }, hint: `${eur(r.amount)} overdue` }));
  sub.past.filter(p => p.invoice !== "n/a").forEach(p => out.push({ kind: "INVOICE", label: p.invoice, target: { t: "tab", tab: "finance" } }));
  if (sub.jobs[0]?.status === "completed" && sub.jobs[0].invoice === "ready") out.push({ kind: "INVOICE", label: "Draft invoice", target: { t: "tab", tab: "finance" }, hint: sub.jobs[0].id });
  sub.cvrt.forEach(t => out.push({ kind: "CVRT", label: t.id, target: { t: "tab", tab: "cvrt" }, hint: t.result ?? t.status.replace("_", " ") }));
  if (docCount) out.push({ kind: "DOCUMENT", label: `${docCount} document${docCount === 1 ? "" : "s"}`, target: { t: "tab", tab: "documents" } });
  return out;
}

export function receivedFor(key: string) { return RECEIVED_POS.filter(r => r.vehicle === key); }

/* ── draft customer update ───────────────────────────────────────────── */
export function draftUpdate(s: State, sub: Subject): string {
  const v = sub.v;
  const co = company(sub.id.customerId);
  const first = (co?.contact ?? "").split(" ")[0] || "there";
  if (!v && sub.notice) return noticeMessage(sub.notice);
  if (!v || v.unresolved) return "";
  const head = `Hi ${first}, an update on ${v.reg} (${v.model}).`;
  const tech = techName(v.job?.tech);
  const when = v.promised ? fmtWhen(v.promised, true) : null;
  let body = "";
  switch (v.status) {
    case "waiting_parts": body = v.part
      ? `${tech} has finished everything possible without the ${partShort(v.part.part)}. It is on order from ${v.part.supplier} (${v.part.po}) and due ${v.part.eta}.${when ? ` We expect the vehicle to be ready ${when}.` : ""} I will confirm as soon as it arrives.`
      : `The part has arrived and ${tech} is back on the job.${when ? ` We expect the vehicle to be ready ${when}.` : ""}`; break;
    case "accounts_hold": body = `The work is complete. The vehicle is on hold until the outstanding balance of ${eur(v.balance)} is cleared. Once accounts confirm, it can be collected.`; break;
    case "cvrt_issue": body = `It did not pass the CVRT test (rear brake imbalance). The repair is under way and a retest will be booked once it is done.${when ? ` Current estimate: ${when}.` : ""}`; break;
    case "waiting_approval": body = `We found extra work that needs your approval: ${v.row.todo.find(t => /approval/i.test(t))?.replace(/^Customer approval of /i, "") ?? "see the quote"}. Please reply to confirm and we will carry on.`; break;
    case "ready": body = `It is ready for collection${when ? ` (${when})` : ""}.`; break;
    default: body = `Work is in progress.${v.row.todo[0] ? ` Next: ${v.row.todo[0].charAt(0).toLowerCase() + v.row.todo[0].slice(1)}.` : ""}${when ? ` We expect it to be ready ${when}.` : ""}`;
  }
  return `${head} ${body}\n\nRegards,\nAnthony, Reynolds Commercials`;
}

export const noticePreview = (n: Notice) => noticeMessage(n);
export { dayOf, hhmmOf };
export type { Channel };
