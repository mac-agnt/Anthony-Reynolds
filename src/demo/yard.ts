/* Yard logic: turns the yard fixtures + the live store into the one vehicle
   model every screen reads. Nothing here keeps its own copy of a customer,
   job, part or balance. If it is not in the fixtures or the store it is
   derived here, so the Yard, Workshop, Parts, Finance, Records, the vehicle
   page, the MD view and the assistant cannot disagree. */
import { COMPANIES, RECEIVABLES, SERVICE_VEHICLES, STAFF, type Job } from "./fixtures";
import { A, cname, company, daysBetween, elapsed, eur, getState, handoverGates, person, pname, toMin, type State } from "./store";
import { go } from "./nav";
import {
  ANPR_EVENTS, COMMS, HERO_EVENTS, KEYLOOP, NOTICES, NOW_ISO, PAST_JOBS, RESERVED_PARTS, TODAY_ISO, YARD_ROWS, YESTERDAY,
  type AnprEvent, type Channel, type Comm, type Notice, type NoticeStage, type PastJob, type StoryEvent, type YardRow, type YardStatus,
} from "./yardData";

export { ANPR_EVENTS, COMMS, KEYLOOP, NOTICES, NOW_ISO, TODAY_ISO, YARD_ROWS, YESTERDAY, RESERVED_PARTS };
export type { AnprEvent, Channel, Comm, Notice, NoticeStage, StoryEvent, YardRow, YardStatus };

/* ── status presentation ─────────────────────────────────────────────── */
export type Tone = "ok" | "warn" | "bad" | "acc" | undefined;
export const STATUS: Record<YardStatus, { label: string; short: string; tone: Tone; order: number }> = {
  accounts_hold: { label: "ACCOUNTS HOLD", short: "Accounts hold", tone: "bad", order: 0 },
  cvrt_issue: { label: "CVRT ISSUE", short: "CVRT issue", tone: "bad", order: 1 },
  waiting_parts: { label: "WAITING FOR PART", short: "Waiting parts", tone: "warn", order: 2 },
  waiting_approval: { label: "WAITING APPROVAL", short: "Waiting approval", tone: "warn", order: 3 },
  unknown: { label: "UNKNOWN", short: "Unknown", tone: "bad", order: 4 },
  workshop: { label: "IN WORKSHOP", short: "Workshop", tone: "acc", order: 5 },
  ready: { label: "READY TO LEAVE", short: "Ready", tone: "ok", order: 6 },
};
export const BLOCKED: YardStatus[] = ["waiting_parts", "accounts_hold", "cvrt_issue"];
/** Overnight report buckets (brief §7). */
export const OVERNIGHT_BUCKET: Record<YardStatus, string> = {
  workshop: "Workshop", waiting_parts: "Waiting parts", accounts_hold: "Accounts hold", waiting_approval: "Awaiting customer", cvrt_issue: "CVRT repair", unknown: "Unknown", ready: "Ready",
};

/* ── time formatting ─────────────────────────────────────────────────── */
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const dt = (iso: string) => new Date(iso.length === 10 ? iso + "T00:00:00" : iso);
export const hhmmOf = (iso: string) => iso.slice(11, 16);
export const dayOf = (iso: string) => iso.slice(0, 10);
/** "28 Oct · 08:43" */
export const fmtEntered = (iso: string) => { const d = dt(iso); return `${d.getDate()} ${MONTHS[d.getMonth()]} · ${hhmmOf(iso)}`; };
/** "Thursday 17:00", "Today 15:00", "Tomorrow 10:00" */
export function fmtWhen(iso: string | null | undefined, long = false): string {
  if (!iso) return "—";
  const d = dt(iso), diff = Math.round((dt(dayOf(iso)).getTime() - dt(TODAY_ISO).getTime()) / 86400000);
  const time = iso.length > 10 ? " " + hhmmOf(iso) : "";
  if (diff === 0) return "Today" + time;
  if (diff === 1) return "Tomorrow" + time;
  if (diff === -1) return "Yesterday" + time;
  if (diff > 1 && diff < 7) return (long ? ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][d.getDay()] : DAYS[d.getDay()]) + time;
  return `${DAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}${time}`;
}
export const dayWord = (iso: string) => { const d = dt(iso); const diff = Math.round((dt(dayOf(iso)).getTime() - dt(TODAY_ISO).getTime()) / 86400000); return diff === 0 ? "today" : diff === -1 ? "yesterday" : "on " + ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][d.getDay()]; };
export const agoText = (mins: number) => mins < 1 ? "just now" : mins < 60 ? `${mins} mins ago` : mins < 1440 ? `${Math.floor(mins / 60)}h ${mins % 60 ? (mins % 60) + "m " : ""}ago`.replace("h  ", "h ") : `${Math.round(mins / 1440)} days ago`;
export const minsSince = (iso: string, clock: number) => Math.round((dt(TODAY_ISO + "T" + String(Math.floor(clock / 60)).padStart(2, "0") + ":" + String(clock % 60).padStart(2, "0")).getTime() - dt(iso).getTime()) / 60000);
export const clockIso = (clock: number) => `${TODAY_ISO}T${String(Math.floor(clock / 60)).padStart(2, "0")}:${String(clock % 60).padStart(2, "0")}`;

/* ── resolved vehicle ────────────────────────────────────────────────── */
export interface YardVehicle {
  key: string;
  row: YardRow;
  reg: string;
  model: string;
  customerId: string | null;
  customer: string;
  status: YardStatus;
  location: string;
  arrived: string;
  arrivedToday: boolean;
  overnight: boolean;
  job: Job | null;
  past: PastJob | null;
  jobId: string | null;
  tech: string | null;
  promised: string | null;
  blocker: string | null;
  accounts: "clear" | "hold" | "review";
  balance: number;
  attention: boolean;
  atRisk: boolean;
  last: { who: string; channel: Channel; text: string; minsAgo: number };
  part: NonNullable<Job["partBlocker"]> | null;
  unresolved: boolean;
  /** ANPR event behind an unknown vehicle. */
  anprId: string | null;
}

const UNKNOWN_EVENT: Record<string, string> = { U001: "ANPR-0951", U002: "ANPR-1748" };

export function identityOf(s: State, key: string): { reg: string; model: string; customerId: string | null; stock: boolean } {
  const stock = s.stock.find(v => v.id === key);
  if (stock) return { reg: stock.reg || key, model: `Renault ${stock.model} ${stock.variant}`, customerId: stock.customer, stock: true };
  const eid = UNKNOWN_EVENT[key];
  const res = eid ? s.yard.anpr[eid] : undefined;
  if (res?.kind === "matched") return identityOf(s, res.key);
  const sv = SERVICE_VEHICLES.find(v => v.id === key);
  if (res?.kind === "created") return { reg: sv?.reg ?? key, model: res.model ?? "Commercial vehicle", customerId: res.customer ?? null, stock: false };
  if (sv) return { reg: sv.reg, model: sv.kind === "Unknown" ? sv.model : sv.model, customerId: sv.customer || null, stock: false };
  return { reg: key, model: "—", customerId: null, stock: false };
}

function liveStatus(s: State, row: YardRow, job: Job | null): YardStatus {
  switch (row.status) {
    case "waiting_parts": return job?.partBlocker?.received ? "workshop" : "waiting_parts";
    case "accounts_hold": return s.yard.released.includes(row.key) ? "ready" : "accounts_hold";
    case "waiting_approval": return s.yard.approved.includes(row.key) ? "workshop" : "waiting_approval";
    case "cvrt_issue": return row.key === "V008" && handoverGates(s, "V008").ready ? "ready" : "cvrt_issue";
    case "unknown": return s.yard.anpr[UNKNOWN_EVENT[row.key]] ? "workshop" : "unknown";
    default: return row.status;
  }
}

function liveBlocker(s: State, row: YardRow, job: Job | null, status: YardStatus): string | null {
  if (status === "ready") return null;
  if (row.status === "waiting_parts" && job?.partBlocker) {
    const p = job.partBlocker;
    return p.received ? null : `${p.part} on order from ${p.supplier} (${p.po}), ETA ${p.eta}. ${p.impact ?? ""}`.trim();
  }
  if (row.status === "unknown" && status === "workshop") return null;
  if (row.status === "waiting_approval" && status === "workshop") return null;
  if (row.key === "V008") {
    const open = handoverGates(s, "V008").list.filter(g => !g.ok).map(g => g.label.toLowerCase());
    return open.length ? `Open gates: ${open.join(", ")}.` : null;
  }
  return row.blocker;
}

/** Promised today but something is in the way (brief morning-brief "promised today at risk"). */
function riskOf(s: State, row: YardRow, job: Job | null, status: YardStatus): boolean {
  if (!row.promised || dayOf(row.promised) !== TODAY_ISO || status === "ready") return false;
  const due = toMin(hhmmOf(row.promised));
  if (status === "accounts_hold" || status === "cvrt_issue" || status === "waiting_parts" || status === "waiting_approval" || status === "unknown") return true;
  if (!job) return false;
  if (job.status === "in_progress" && job.start) {
    const used = elapsed(job, s.clock);
    if (used / job.budgetMin >= s.rules.warn / 100) return true;
  }
  if (job.partBlocker && !job.partBlocker.received) {
    const m = /(\d{1,2}):(\d{2})/.exec(job.partBlocker.eta);
    if (m && +m[1] * 60 + +m[2] + Math.max(0, job.budgetMin - elapsed(job, s.clock)) > due) return true;
  }
  if (job.status === "queued" && job.plannedStart && toMin(job.plannedStart) + job.budgetMin > due) return true;
  return false;
}

export function yardVehicles(s: State = getState()): YardVehicle[] {
  return YARD_ROWS.map(row => {
    const job = row.job ? s.jobs.find(j => j.id === row.job) ?? null : null;
    const past = row.pastJob ? PAST_JOBS.find(p => p.id === row.pastJob) ?? null : null;
    const id = identityOf(s, row.key);
    const status = liveStatus(s, row, job);
    const eid = UNKNOWN_EVENT[row.key];
    const resolved = eid ? s.yard.anpr[eid] : undefined;
    const rec = id.customerId ? RECEIVABLES.filter(r => r.customer === id.customerId && daysBetween(r.due) > 0).reduce((t, r) => t + r.amount, 0) : 0;
    const held = row.status === "accounts_hold" && status === "accounts_hold";
    const blocker = liveBlocker(s, row, job, status);
    const cu = s.yard.customerUpdates[row.key];
    const asRow: YardRow = { ...row };
    return {
      key: row.key, row: asRow, reg: id.reg, model: id.model, customerId: id.customerId, customer: id.customerId ? cname(id.customerId) : "Unmatched",
      status, location: row.location, arrived: row.arrived, arrivedToday: dayOf(row.arrived) === TODAY_ISO,
      overnight: row.overnight && status !== "ready", job, past, jobId: row.job ?? row.pastJob ?? null, tech: job?.tech ?? past?.tech ?? null,
      promised: row.promised, blocker, accounts: held ? "hold" : row.accounts === "review" && status !== "ready" ? "review" : "clear",
      balance: held ? row.balance ?? rec : 0, attention: !!row.attention || (BLOCKED.includes(status) && !!row.attention),
      atRisk: riskOf(s, row, job, status),
      last: cu ? { who: "Anthony", channel: "WhatsApp", text: cu.text, minsAgo: 0 } : row.last,
      part: job?.partBlocker && !job.partBlocker.received ? job.partBlocker : null,
      unresolved: row.status === "unknown" && !resolved, anprId: eid ?? null,
    };
  });
}

export const vehicleByKey = (s: State, key: string): YardVehicle | undefined => yardVehicles(s).find(v => v.key === key);

/* ── headline counts ─────────────────────────────────────────────────── */
export function yardCounts(s: State = getState()) {
  const v = yardVehicles(s);
  const by = (st: YardStatus) => v.filter(x => x.status === st);
  const blocked = v.filter(x => BLOCKED.includes(x.status));
  const night = v.filter(x => x.overnight);
  const bucket: Record<string, YardVehicle[]> = {};
  night.forEach(x => (bucket[OVERNIGHT_BUCKET[x.status]] ??= []).push(x));
  return {
    all: v, onSite: v.length, arrivedToday: v.filter(x => x.arrivedToday).length, ready: by("ready"), readyN: by("ready").length,
    blocked, blockedN: blocked.length, overnight: night, overnightN: night.length, unknown: by("unknown"), unknownN: by("unknown").length,
    parts: by("waiting_parts"), approval: by("waiting_approval"), accounts: by("accounts_hold"), cvrt: by("cvrt_issue"), workshop: by("workshop"),
    atRisk: v.filter(x => x.atRisk), attention: blocked, bucket,
  };
}

export type YardFilter = "all" | "overnight" | "arrived" | "ready" | "parts" | "workshop" | "approval" | "accounts" | "cvrt" | "unknown";
export const FILTERS: [YardFilter, string][] = [
  ["all", "All vehicles"], ["overnight", "Overnight"], ["arrived", "Arrived today"], ["ready", "Ready"], ["parts", "Waiting parts"],
  ["workshop", "Workshop"], ["approval", "Waiting approval"], ["accounts", "Accounts hold"], ["cvrt", "CVRT issue"], ["unknown", "Unknown"],
];
export function applyFilter(list: YardVehicle[], f: YardFilter): YardVehicle[] {
  switch (f) {
    case "overnight": return list.filter(v => v.overnight);
    case "arrived": return list.filter(v => v.arrivedToday);
    case "ready": return list.filter(v => v.status === "ready");
    case "parts": return list.filter(v => v.status === "waiting_parts");
    case "workshop": return list.filter(v => v.status === "workshop");
    case "approval": return list.filter(v => v.status === "waiting_approval");
    case "accounts": return list.filter(v => v.status === "accounts_hold");
    case "cvrt": return list.filter(v => v.status === "cvrt_issue");
    case "unknown": return list.filter(v => v.status === "unknown");
    default: return list;
  }
}

/* ── navigation + search ─────────────────────────────────────────────── */
export function openVehicle(key: string, tab?: string) {
  A.focus("vehicle", key);
  if (tab) A.focus("vehicleTab", tab);
  go("Vehicle");
}
export const normReg = (x: string) => x.toLowerCase().replace(/[^a-z0-9]/g, "");
/** Registration, partial registration, customer name or job id. */
export function searchVehicles(s: State, q: string): YardVehicle[] {
  const n = normReg(q), t = q.trim().toLowerCase();
  if (!n) return [];
  return yardVehicles(s).filter(v => normReg(v.reg).includes(n) || v.customer.toLowerCase().includes(t) || (v.jobId ?? "").toLowerCase() === t || v.key.toLowerCase() === t);
}
export function findAnyVehicleKey(s: State, q: string): string | null {
  const n = normReg(q);
  if (!n) return null;
  const y = yardVehicles(s).find(v => normReg(v.reg) === n);
  if (y) return y.key;
  const sv = SERVICE_VEHICLES.find(v => normReg(v.reg) === n);
  if (sv) return sv.id;
  const st = s.stock.find(v => normReg(v.reg) === n);
  return st ? st.id : null;
}

/* ── sentences ───────────────────────────────────────────────────────── */
const first = (name: string) => name.split(" ")[0];
const lc = (t: string) => (/^[A-Z][a-z]/.test(t) ? t.charAt(0).toLowerCase() + t.slice(1) : t);
const DONE_LINE: Record<string, string> = { C101: "Billy diagnosed an ECU fault and has finished all the work possible without the part." };

export function whenWords(iso: string): string {
  const d = dt(iso), diff = Math.round((dt(dayOf(iso)).getTime() - dt(TODAY_ISO).getTime()) / 86400000);
  const part = +hhmmOf(iso).slice(0, 2) < 12 ? "morning" : +hhmmOf(iso).slice(0, 2) < 17 ? "afternoon" : "evening";
  if (diff === 0) return `this ${part}`;
  const day = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][d.getDay()];
  return diff === -1 ? `yesterday ${part}` : `on ${day} ${part}`;
}

/** The natural-language "what's the story" paragraph. Sentences, so the page can lay them out. */
export function storyFor(s: State, key: string): string[] {
  const v = vehicleByKey(s, key);
  if (!v) return ["This vehicle is not on site. See the history below."];
  const out: string[] = [];
  if (v.status === "unknown") {
    out.push(`This vehicle ${v.arrivedToday ? "arrived today" : `arrived ${whenWords(v.arrived)}`} and ANPR read the plate as ${v.reg}.`);
    out.push(v.key === "U001" ? "The read is only 84% confident, so it has not been matched to a customer or a job." : "No Keyloop vehicle record exists, so there is no customer, job or booking attached.");
    out.push(v.key === "U001" ? "The closest known vehicle is 192-D-3411 (Murphy Transport). A person needs to confirm the match." : "Brian reported it on the Yard group this morning and nobody has claimed it yet.");
    return out;
  }
  const j = v.job;
  out.push(`This vehicle arrived ${whenWords(v.arrived)} for ${v.row.reason}.`);
  if (DONE_LINE[v.key]) out.push(DONE_LINE[v.key]);
  else if (v.row.done.length) out.push(`So far: ${v.row.done.map(lc).join("; ")}.`);
  if (v.part && j) {
    out.push(`${pname(v.part.owner)} ordered the ${v.part.part.replace(/ \(.*\)/, "")} from ${v.part.supplier}${v.part.orderedAt ? ` (${fmtOrdered(v.part.orderedAt)}, ${v.part.po})` : ""}.`);
    out.push(`Expected delivery is ${etaWords(v.part.eta)}.`);
    out.push(v.part.stalled ? `Work cannot continue until it arrives.` : `Work can continue on other tasks until it arrives.`);
  } else if (v.blocker && v.status !== "workshop") out.push(v.blocker);
  else if (v.blocker) out.push(`Held up by: ${lc(v.blocker)}`);
  if (v.row.customerUpdated) out.push(`${v.customer} was last updated ${updatedWords(v.row.customerUpdated)}.`);
  if (v.accounts === "hold") out.push(`Accounts: ${eur(v.balance)} is outstanding, so the vehicle cannot be released until accounts approve.`);
  else if (v.accounts === "review") out.push("Accounts clearance is still to be recorded before handover.");
  else out.push("There are no outstanding account restrictions.");
  if (v.status === "ready") out.push(`It is ready to leave${v.promised ? ` (${fmtWhen(v.promised)})` : ""}.`);
  else if (v.promised) out.push(`Current estimated completion: ${fmtWhen(v.promised, true)}.`);
  return out;
}
const fmtOrdered = (t: string) => t.replace("Fri 16 Oct", "Friday at").replace("Today", "today at");
const etaWords = (t: string) => t.replace(/^Thu 22 Oct 10:00$/, "Thursday morning (22 Oct, 10:00)").replace(/^Today (\d)/, "today at $1").replace(/^Tue 20 Oct (\d)/, "Tuesday at $1").replace(/^Wed 21 Oct (\d)/, "Wednesday at $1");
const updatedWords = (t: string) => {
  const [when, rest] = t.split(" · ");
  const w = when.replace("Fri 16 Oct", "on Friday at").replace("Today", "today at");
  const m = /^(\w+) \((.+)\)$/.exec(rest ?? "");
  return m ? `${w} by ${m[1]} (${m[2]})` : `${w}${rest ? ` by ${rest}` : ""}`;
};

/* ── the ten questions (final product test) ──────────────────────────── */
export interface Answer { q: string; a: string; tone?: Tone; go?: string }
export function tenQuestions(s: State, key: string): Answer[] {
  const v = vehicleByKey(s, key);
  if (!v) return [];
  const j = v.job;
  const left = v.row.todo.filter(t => !/collection|keys/i.test(t));
  const pn = v.part;
  return [
    { q: "Who owns it?", a: v.customerId ? `${v.customer}` : "Not known yet", tone: v.customerId ? undefined : "bad" },
    { q: "Why is it here?", a: v.row.reason.charAt(0).toUpperCase() + v.row.reason.slice(1) },
    { q: "What work has been done?", a: v.row.done.length ? v.row.done.slice(0, 3).join(". ") : "Nothing recorded yet" },
    { q: "What still needs doing?", a: left.length ? left.slice(0, 3).join(", ") : v.status === "ready" ? "Nothing. Driver collection only." : "Nothing recorded" },
    { q: "Who is responsible?", a: j?.tech ? `${pname(j.tech)} (technician)${pn ? `, ${pname(pn.owner)} (part)` : ""}` : pn ? pname(pn.owner) : v.tech ? pname(v.tech) : "Not assigned", tone: !j?.tech && v.status !== "ready" && v.status !== "unknown" ? "warn" : undefined },
    { q: "Waiting for a part?", a: pn ? `Yes: ${pn.part}` : "No", tone: pn ? "warn" : "ok" },
    { q: "When is the part arriving?", a: pn ? `${pn.eta} (${pn.po})` : "Not applicable" },
    { q: "Has the customer been updated?", a: v.row.customerUpdated ?? "No update recorded", tone: v.row.customerUpdated ? "ok" : "warn" },
    { q: "Any accounts issue?", a: v.accounts === "hold" ? `Yes: ${eur(v.balance)} outstanding` : v.accounts === "review" ? "Clearance outstanding" : "No", tone: v.accounts === "clear" ? "ok" : "bad" },
    { q: "When should it leave?", a: v.status === "ready" ? `Ready now${v.promised ? ` · ${fmtWhen(v.promised)}` : ""}` : v.promised ? fmtWhen(v.promised, true) : "Not set", tone: v.status === "ready" ? "ok" : undefined },
  ];
}

/* ── timeline ────────────────────────────────────────────────────────── */
export interface TimelineEvent { at: string; channel: Channel; who: string; text: string; kind: StoryEvent["kind"] | "comms" }
export function commsFor(s: State, key: string): Comm[] {
  return COMMS.filter(c => {
    const r = s.yard.commsResolved[c.id];
    if (r) return r.key === key;
    return c.status === "auto" && c.vehicle === key;
  });
}
export function timelineFor(s: State, key: string): TimelineEvent[] {
  const v = vehicleByKey(s, key);
  const ev: TimelineEvent[] = [];
  const hero = HERO_EVENTS[key];
  if (hero) ev.push(...hero);
  else if (v) {
    ev.push({ at: v.arrived, channel: "ANPR", who: "Gate 1 camera", text: v.customerId ? `${v.reg} read and matched to ${v.customer}. Added to the yard.` : `${v.reg} read at the gate. Not matched to a customer. Held for review.`, kind: "arrival" });
    if (v.job) ev.push({ at: `${dayOf(v.arrived)}T${hhmmOf(v.arrived) < "23:00" ? addMin(hhmmOf(v.arrived), 20) : "23:30"}`, channel: "Keyloop", who: "Service desk", text: `${v.job.id} opened: ${v.job.complaint}.`, kind: "job" });
    if (v.job?.status === "in_progress" && v.job.start) ev.push({ at: `${TODAY_ISO}T${v.job.start}`, channel: "Workshop", who: pname(v.job.tech), text: `Clocked on ${v.job.id}.`, kind: "workshop" });
    if (v.part?.orderedAt) ev.push({ at: orderedIso(v.part.orderedAt), channel: "Keyloop", who: pname(v.part.owner), text: `${v.part.po} raised for ${v.part.part} (${v.part.supplier}), ETA ${v.part.eta}.`, kind: "parts" });
  }
  // Messages Pulse matched to this vehicle (automatic or confirmed by a person).
  commsFor(s, key).forEach(c => ev.push({ at: (c.day === "Today" ? TODAY_ISO : "2026-10-16") + "T" + c.at, channel: c.channel, who: c.from, text: c.text, kind: "comms" }));
  if (v?.job?.status === "completed" && !hero) ev.push({ at: `${TODAY_ISO}T${addMin("08:00", 0)}`, channel: "Keyloop", who: pname(v.job.tech), text: `${v.job.id} completed${v.job.invoice === "ready" ? " and marked invoice-ready" : ", write-up awaiting confirmation"}.`, kind: "workshop" });
  const cu = s.yard.customerUpdates[key];
  if (cu) ev.push({ at: clockIso(s.clock), channel: "WhatsApp", who: "Anthony Reynolds", text: cu.text, kind: "comms" });
  if (s.yard.released.includes(key)) ev.push({ at: clockIso(s.clock), channel: "Pulse", who: "Caroline Glynn", text: "Accounts approval recorded. Release cleared.", kind: "finance" });
  if (s.yard.approved.includes(key)) ev.push({ at: clockIso(s.clock), channel: "Pulse", who: "Customer", text: "Customer approved the extra work. Job returned to the workshop.", kind: "workshop" });
  return ev.sort((a, b) => (a.at < b.at ? 1 : a.at > b.at ? -1 : 0));
}
const addMin = (hm: string, n: number) => { const t = toMin(hm) + n; return `${String(Math.floor(t / 60)).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`; };
const orderedIso = (t: string) => t.startsWith("Fri 16 Oct") ? `2026-10-16T${t.slice(-5)}` : `${TODAY_ISO}T${/\d{2}:\d{2}/.test(t) ? t.slice(-5) : "08:00"}`;

/* ── per-vehicle record sections ─────────────────────────────────────── */
export function partsFor(s: State, key: string) {
  const v = vehicleByKey(s, key);
  const jobId = v?.jobId;
  const reserved = RESERVED_PARTS.filter(r => r.job === jobId);
  const open = v?.job?.partBlocker ? [{ ...v.job.partBlocker, job: v.job.id }] : [];
  return { open, reserved };
}
export function financeFor(s: State, key: string) {
  const v = vehicleByKey(s, key);
  const id = identityOf(s, key);
  const customerId = id.customerId;
  const recs = customerId ? RECEIVABLES.filter(r => r.customer === customerId).map(r => ({ ...r, overdue: daysBetween(r.due) })) : [];
  const j = v?.job ?? null;
  const wip = j && j.status !== "completed" ? Math.round((Math.min(elapsed(j, s.clock), j.budgetMin) / 60) * 80) : 0;
  return {
    customerId, recs, outstanding: recs.reduce((t, r) => t + r.amount, 0), overdue: recs.filter(r => r.overdue > 0).reduce((t, r) => t + r.amount, 0),
    invoice: j?.status === "completed" ? (j.invoice === "ready" ? "Ready to invoice" : "Write-up blocked") : v?.past && v.past.invoice !== "n/a" ? `Invoiced ${v.past.invoice}` : "Not yet invoiceable",
    net: j?.net ?? v?.past?.net ?? 0, wip, hold: v?.accounts === "hold", balance: v?.balance ?? 0,
  };
}
export interface DocItem { id: string; title: string; type: string; source: string; when: string; status?: string }
export function docsFor(s: State, key: string): DocItem[] {
  const v = vehicleByKey(s, key);
  const out: DocItem[] = [];
  if (!v) return out;
  if (v.job) out.push({ id: `JC-${v.job.id}`, title: `Job card ${v.job.id}`, type: "Job card", source: "Keyloop", when: fmtEntered(v.arrived) });
  if (v.part?.po) out.push({ id: v.part.po, title: `Purchase order ${v.part.po}: ${v.part.part}`, type: "Purchase order", source: "Keyloop", when: v.part.orderedAt ?? "—", status: v.part.received ? "Received" : "On order" });
  const t = s.cvrt.find(c => c.vehicle === key);
  if (t) out.push({ id: t.id, title: `CVRT test sheet ${t.id}`, type: "CVRT", source: "Reynolds CVRT lane", when: t.time, status: t.result ?? t.status });
  if (v.job?.status === "completed" && v.job.invoice === "ready") out.push({ id: `INV-${v.job.id}`, title: `Draft invoice for ${v.job.id}`, type: "Invoice (draft)", source: "Keyloop", when: "Today", status: "Ready" });
  if (v.past && v.past.invoice !== "n/a") out.push({ id: v.past.invoice, title: `Invoice ${v.past.invoice}`, type: "Invoice", source: "Keyloop", when: fmtWhen(v.past.doneAt) });
  commsFor(s, key).filter(c => c.channel === "Email").forEach(c => out.push({ id: c.id, title: c.subject ?? "Email", type: "Email", source: c.source, when: `${c.day} ${c.at}` }));
  const n = NOTICES.find(x => x.vehicle === key);
  if (n) out.push({ id: n.id, title: `Renault periodic inspection notice ${n.id}`, type: "Renault notice", source: "Renault Trucks Ireland", when: fmtWhen(n.received) });
  if (key === "C101") out.push({ id: "DOC-FC", title: "Fault code printout, ECU communication error", type: "Diagnostic", source: "Billy Murphy", when: "Fri 16 Oct 14:40" }, { id: "DOC-WA", title: "Customer thread export (WhatsApp)", type: "Communication", source: "Pulse", when: "Fri 16 Oct 16:22" });
  return out;
}
export function keyloopFor(s: State, key: string) {
  const v = vehicleByKey(s, key);
  const id = identityOf(s, key);
  const co = id.customerId ? company(id.customerId) : undefined;
  const n = Math.abs([...key].reduce((t, c) => t * 31 + c.charCodeAt(0), 7)) % 90000 + 10000;
  return {
    vehicleRecord: v?.unresolved ? "No Keyloop record" : `KL-V-${n}`, account: co?.account ?? "—", jobRef: v?.jobId ?? "—", syncedMinsAgo: KEYLOOP.lastSyncMinsAgo,
    fields: [
      ["Customer account", co?.account ?? "—"], ["Vehicle record", v?.unresolved ? "None" : `KL-V-${n}`], ["Job", v?.jobId ?? "—"],
      ["Job status in Keyloop", v?.job ? v.job.status.replace("_", " ") : v?.past ? "completed" : "—"],
      ["Invoice", financeFor(s, key).invoice], ["Last synced", `${KEYLOOP.lastSyncMinsAgo} mins ago`],
    ] as [string, string][],
  };
}

/* ── attention / overnight ───────────────────────────────────────────── */
export function attentionList(s: State = getState()): YardVehicle[] {
  return yardCounts(s).blocked.sort((a, b) => STATUS[a.status].order - STATUS[b.status].order || (a.promised ?? "z").localeCompare(b.promised ?? "z"));
}
export function attentionLine(v: YardVehicle): { head: string; sub: string } {
  switch (v.status) {
    case "waiting_parts": return { head: "WAITING PART", sub: `${v.part?.part.replace(/ \(.*\)/, "") ?? "Part"} · ETA ${v.part?.eta ?? "—"}` };
    case "accounts_hold": return { head: "ACCOUNTS HOLD", sub: `${eur(v.balance)} outstanding` };
    case "cvrt_issue": return { head: "CVRT FAILED", sub: "Rear brake imbalance" };
    default: return { head: STATUS[v.status].label, sub: v.blocker ?? "" };
  }
}
export function overnightSummaryText(s: State): string {
  const c = yardCounts(s);
  const parts = c.bucket["Waiting parts"]?.length ?? 0;
  const midday = `${"2026-10-20"}T12:00`;
  const early = c.overnight.filter(v => (v.status === "workshop" || v.status === "waiting_parts") && v.promised && v.promised <= midday
    && (!v.part || /Today|Tue 20 Oct (0|1[0-2])/.test(v.part.eta))).length;
  const attention = c.overnight.filter(v => v.status === "accounts_hold" || v.status === "cvrt_issue" || v.status === "unknown").length;
  const v8 = vehicleByKey(s, "V008");
  const n = (x: number, one: string, many: string) => `${x} ${x === 1 ? one : many}`;
  return `${c.overnightN} vehicles are remaining on site tonight. The main operational constraint is parts availability, affecting ${n(parts, "vehicle", "vehicles")}. ${n(early, "vehicle", "vehicles")} should be ready before midday tomorrow. V008 (${v8?.reg ?? "222-G-1984"}) ${v8?.status === "ready" ? "is now clear to release" : "remains blocked by both CVRT repair work and accounts clearance"}. ${n(attention, "vehicle requires", "vehicles require")} management attention tomorrow morning.`;
}

/* ── workshop / parts roll-ups used across modules ───────────────────── */
export function partsOverview(s: State = getState()) {
  const open = s.jobs.filter(j => j.partBlocker && !j.partBlocker.received);
  const stalled = open.filter(j => j.partBlocker!.stalled || j.status === "awaiting_parts");
  const lostMin = open.reduce((t, j) => t + Math.max(0, j.budgetMin - elapsed(j, s.clock)), 0);
  return { open, stalled, lostMin, lostHours: lostMin / 60 };
}
export function workshopOverview(s: State = getState()) {
  const open = s.jobs.filter(j => j.status !== "completed");
  const techs = STAFF.filter(p => p.kind === "technician");
  const ids = new Set(techs.map(t => t.id));
  const nowOn = new Set(s.jobs.filter(j => j.status === "in_progress" && j.tech).map(j => j.tech));
  const att = (id: string) => (id === "t-cian" || id === "t-luke" ? "absent" : id === "t-alan" ? "training" : "present");
  const active = techs.filter(t => att(t.id) === "present");
  const budget = s.jobs.filter(j => j.status === "in_progress" && elapsed(j, s.clock) / j.budgetMin >= s.rules.warn / 100);
  const ready = s.jobs.filter(j => j.status === "completed" && j.invoice === "ready");
  return {
    openJobs: open.length, activeTechs: active.length, utilisation: active.length ? Math.round(([...nowOn].filter(t => t && ids.has(t)).length / active.length) * 100) : 0,
    waitingParts: partsOverview(s).open.length, overBudget: budget.length, readyToInvoice: ready.length, readyNet: ready.reduce((t, j) => t + (j.net ?? 0), 0),
  };
}

/* ── ANPR pipeline for an event ──────────────────────────────────────── */
export type StepState = "ok" | "warn" | "fail" | "skip";
export interface PipelineStep { label: string; detail: string; state: StepState }
export function anprPipeline(s: State, e: AnprEvent): PipelineStep[] {
  const res = s.yard.anpr[e.id];
  const key = res?.kind === "matched" ? res.key : e.key;
  const unknown = (e.outcome === "unknown" || e.outcome === "unmatched") && !res;
  if (e.direction === "out") return [
    { label: "Read registration", detail: `${e.read} · ${e.confidence}%`, state: "ok" }, { label: "Match vehicle", detail: "Matched", state: "ok" },
    { label: "Check release", detail: "Accounts clear, keys returned", state: "ok" }, { label: "Remove from yard", detail: "Departed", state: "ok" },
  ];
  const id = key && !unknown ? identityOf(s, key) : null;
  const v = key && !unknown ? vehicleByKey(s, key) : undefined;
  const conf = e.confidence;
  return [
    { label: "Read registration", detail: `${e.read} · ${conf}% confidence`, state: conf >= 90 ? "ok" : "warn" },
    { label: "Match vehicle", detail: id ? `${id.reg} · ${id.model}` : e.suggestion ? `Possible: ${e.suggestion.why}` : "No vehicle with this registration", state: id ? "ok" : e.suggestion ? "warn" : "fail" },
    { label: "Match customer", detail: id?.customerId ? cname(id.customerId) : "No customer", state: id?.customerId ? "ok" : unknown ? "fail" : "warn" },
    { label: "Check Keyloop", detail: id ? "Vehicle and account found (synced 2 mins ago)" : "No Keyloop record to attach", state: id ? "ok" : "fail" },
    { label: "Check active job", detail: e.booking ? `${e.booking.job} · ${e.booking.reason}` : id ? "No active job" : "Skipped", state: e.booking ? "ok" : id ? "warn" : "skip" },
    { label: "Load communication history", detail: key && !unknown ? `${COMMS.filter(c => c.vehicle === key).length} messages found` : "Nothing to load", state: unknown ? "skip" : "ok" },
    { label: "Add to yard", detail: v ? `${v.location}` : unknown ? "Held at the gate for review" : "Added", state: unknown ? "warn" : "ok" },
  ];
}

/* ── people helpers ──────────────────────────────────────────────────── */
export const techName = (id: string | null | undefined) => (id ? first(pname(id)) : "Unassigned");
export const personName = (id: string | null | undefined) => (id ? person(id)?.name ?? "—" : "—");
export const companyList = COMPANIES.filter(c => c.kind === "customer");
export type { PastJob };

/* ── communications + inspection roll-ups ────────────────────────────── */
/** Effective status of a message: resolved messages count as matched. */
export function commStatus(s: State, c: Comm): Comm["status"] {
  const r = s.yard.commsResolved[c.id];
  return r ? "auto" : c.status;
}
export function commsCounts(s: State = getState()) {
  const list = COMMS.map(c => commStatus(s, c));
  return { auto: list.filter(x => x === "auto").length, review: list.filter(x => x === "review").length, unmatched: list.filter(x => x === "unmatched").length, total: list.length };
}

export type NoticeWindow = "overdue" | "week" | "d14" | "d30" | "later";
export function noticeState(s: State, n: Notice): { stage: NoticeStage; sentAt?: string; message?: string; bookedFor?: string } {
  return s.yard.notices[n.id] ?? { stage: n.stage, bookedFor: n.bookedFor };
}
export function noticeWindow(n: Notice): NoticeWindow {
  const days = Math.round((dt(n.due).getTime() - dt(TODAY_ISO).getTime()) / 86400000);
  return days < 0 ? "overdue" : days <= 6 ? "week" : days <= 14 ? "d14" : days <= 30 ? "d30" : "later";
}
export const noticeDays = (n: Notice) => Math.round((dt(n.due).getTime() - dt(TODAY_ISO).getTime()) / 86400000);
/** Counts behind the Inspection & Service agent chips. Windows are cumulative and exclude booked notices. */
export function inspectionCounts(s: State = getState()) {
  const rows = NOTICES.map(n => ({ n, st: noticeState(s, n), w: noticeWindow(n) }));
  const open = rows.filter(r => r.st.stage !== "booked");
  const days = (r: { n: Notice }) => noticeDays(r.n);
  return {
    total: rows.length,
    new: rows.filter(r => r.st.stage === "new").length,
    due30: open.filter(r => days(r) >= 0 && days(r) <= 30).length,
    due14: open.filter(r => days(r) >= 0 && days(r) <= 14).length,
    week: open.filter(r => days(r) >= 0 && days(r) <= 6).length,
    contacted: rows.filter(r => r.st.stage === "contacted").length,
    awaiting: rows.filter(r => r.st.stage === "awaiting").length,
    booked: rows.filter(r => r.st.stage === "booked").length,
    overdue: open.filter(r => r.w === "overdue").length,
  };
}
/** Customer-facing reminder text for a notice (needs human approval before it is sent). */
export function noticeMessage(n: Notice): string {
  const sv = SERVICE_VEHICLES.find(v => v.id === n.vehicle);
  const co = sv?.customer ? company(sv.customer) : undefined;
  const first = (co?.contact ?? "there").split(" ")[0];
  const d = dt(n.due);
  const kind = n.kind === "Service due" ? "service" : n.kind === "13-week inspection" ? "13-week inspection" : "periodic inspection";
  return `Hi ${first}, your Renault ${sv?.reg} is due its ${kind} on ${d.getDate()} ${["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"][d.getMonth()]}. Would you like us to get it booked in?`;
}
