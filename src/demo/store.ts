/* Demo store: one state object, local actions, derived selectors.
   Everything a screen shows is derived from this state, so an action in one
   module (e.g. approving JOB-1041) updates every list, KPI, approval and the
   activity log at once. Nothing here talks to a server. */
import { useSyncExternalStore } from "react";
import {
  AGENTS, ATTENDANCE, COMPANIES, CVRT, DISCOUNT_THRESHOLD, FRIDAY_INTERNAL, FRIDAY_UNALLOC, JOB_CARD_FACTS, JOBS,
  MEETING_SECTIONS, ORDER_BOOK_NEXT, QUOTES, RATE, RECEIVABLES, SAMPLE_OPERATIONS, SERVICE_VEHICLES, SNAPSHOT_MIN, STAFF, STOCK,
  type CvrtBooking, type Job, type Quote, type Vehicle,
} from "./fixtures";

/* ---- time + format helpers ---------------------------------------------- */
export const toMin = (t: string) => { const [h, m] = t.split(":").map(Number); return h * 60 + m; };
export const hhmm = (m: number) => String(Math.floor(m / 60)).padStart(2, "0") + ":" + String(Math.round(m % 60)).padStart(2, "0");
export const dur = (m: number) => { m = Math.round(m); const h = Math.floor(m / 60), r = m % 60; return h ? (r ? `${h}h ${r}m` : `${h}h`) : `${r}m`; };
export const eur = (n: number) => (n < 0 ? "−€" : "€") + Math.abs(Math.round(n)).toLocaleString("en-IE");
export const hrs = (n: number) => n.toFixed(1) + " h";
export const DEMO_DATE = new Date("2026-10-19T00:00:00");
export const daysBetween = (iso: string) => Math.round((DEMO_DATE.getTime() - new Date(iso + "T00:00:00").getTime()) / 86400000);
export const fmtDate = (iso: string) => new Date(iso + "T00:00:00").toLocaleDateString("en-IE", { day: "numeric", month: "short" });

/* ---- types ---------------------------------------------------------------- */
export type Role = "management" | "workshop" | "sales" | "accounts";
export interface Act { id: string; at: string; who: string; kind: "person" | "agent" | "import" | "workflow"; text: string; entity?: string; attention?: boolean }
export interface Task { id: string; title: string; owner: string; due: string; priority: "High" | "Medium" | "Low"; dept: string; status: "open" | "done"; record: string; story?: string; kind: "task" | "improvement"; acceptance?: string }
export interface Doc { id: string; vehicle: string | null; range?: string; title: string; type: string; scope: "VIN-specific" | "Generic model sheet"; language: string; version: string; source: string; match: string; status: "approved" | "review" | "superseded" }
export interface EstRow { id: string; op: string; note: string; oem: number; haynes: number; basis: "oem" | "haynes" | "manual"; manual: number; qty: number; parts: number }
export interface JobCard { rows: EstRow[]; surcharge: number; loaded: boolean; answers: Record<number, string>; techConfirmed: boolean; approved: boolean; narrative: string; version: number; approvedVersion: number | null; sourceFile: string }
export interface Run { id: string; agent: string; at: string; status: "Draft prepared" | "Needs review" | "Approved locally" | "Simulated export prepared"; inputs: string[]; outputs: string[] }
export interface GapReview { cls: "internal" | "explained"; reason: string; by: string; at: string }
export interface Gates { documents: boolean; accounts: boolean; handedOver: boolean; dms: boolean }
export interface StockCheck { id: string; at: string; by: string; results: Record<string, "found" | "not found" | "unchecked"> }

export interface State {
  clock: number;
  role: Role;
  jobs: Job[];
  stock: Vehicle[];
  cvrt: CvrtBooking[];
  quotes: Quote[];
  quoteMeta: Record<string, { version: number; discountApproval: { version: number; at: string } | null; history: string[] }>;
  docs: Doc[];
  tasks: Task[];
  activity: Act[];
  runs: Run[];
  meeting: { sections: { id: string; label: string; enabled: boolean; observed: boolean }[]; techIdx: number; notes: Record<string, string>; refreshedAt: number; board: Record<string, boolean> };
  fridayReviews: Record<string, GapReview>;
  liveReasons: Record<string, string>;
  lastOff: Record<string, string>;
  jobcards: Record<string, JobCard>;
  imports: { applied: string[]; previewOpen: boolean; history: { id: string; at: string; summary: string }[] };
  gates: Record<string, Gates>;
  retest: Record<string, { scheduled: boolean }>;
  stockChecks: StockCheck[];
  rules: { gap: number; warn: number; over: number; reviewWork: boolean; reviewDiscount: boolean; reviewComms: boolean; reviewAccounts: boolean; reviewSafety: boolean };
  decisions: Record<string, "approved" | "rejected">;
  invoiceExports: string[];
  followUps: Record<string, string>;
  corrections: { id: string; vehicle: string; reason: string; at: string }[];
  drawer: { kind: "vehicle" | "job" | "company" | "quote"; id: string } | null;
  toast: string | null;
  focus: Record<string, string>;
}

/* ---- initial state ---------------------------------------------------------- */
function seedDocs(stock: Vehicle[]): Doc[] {
  const docs: Doc[] = [];
  stock.filter(v => v.status !== "sold" && v.specStatus === "approved").forEach(v => {
    docs.push({ id: "D-" + v.id, vehicle: v.id, title: `${v.model} ${v.variant} — specification`, type: "Specification sheet", scope: "VIN-specific", language: "English",
      version: "v1 · 2026", source: "Sample Renault document", match: v.vin ? "Demo VIN matches" : "Matched on SVO (VIN not yet issued)", status: "approved" });
  });
  [["Master", "Master — body builder guide"], ["Master", "Master — technical data (FR)"], ["Trafic", "Trafic — body builder guide"], ["Trucks", "D range — technical data"]].forEach(([range, title], i) =>
    docs.push({ id: "G-" + i, vehicle: null, range, title, type: i === 1 || i === 3 ? "Technical data" : "Body builder guide", scope: "Generic model sheet",
      language: i === 1 ? "French" : "English", version: "2026 edition", source: "Sample Renault document", match: "Model range only — not a VIN match", status: "approved" }));
  return docs;
}

function initial(): State {
  const stock: Vehicle[] = structuredClone(STOCK);
  return {
    clock: SNAPSHOT_MIN,
    role: "management",
    jobs: structuredClone(JOBS),
    stock,
    cvrt: structuredClone(CVRT),
    quotes: structuredClone(QUOTES),
    quoteMeta: { "Q-1042": { version: 1, discountApproval: null, history: ["v1 created by Jack Kelly · 08:50"] } },
    docs: seedDocs(stock),
    tasks: [
      { id: "TK-1", title: "Flag ETA changes against promised delivery dates", owner: "p-anthony", due: "This week", priority: "Medium", dept: "Vehicle Stock", status: "open", record: "V019", story: "D", kind: "improvement", acceptance: "When V019's ETA moves past Mayo Logistics' promised 28 Oct date, Jack sees it the same day." },
      { id: "TK-2", title: "Confirm JOB-1041 work before invoicing", owner: "t-conor", due: "Today", priority: "High", dept: "Workshop", status: "open", record: "JOB-1041", story: "C", kind: "task" },
      { id: "TK-3", title: "V008 — chase rear caliper (ETA 11:30)", owner: "p-darren", due: "11:30", priority: "High", dept: "Parts", status: "open", record: "V008", story: "F", kind: "task" },
      { id: "TK-4", title: "Q-1042 — discount and specification review", owner: "p-anthony", due: "Today", priority: "High", dept: "Sales", status: "open", record: "Q-1042", story: "E", kind: "task" },
      { id: "TK-5", title: "Investigate Friday's unallocated hours", owner: "p-jonathan", due: "Today", priority: "Medium", dept: "Workshop", status: "open", record: "FRIDAY", story: "A", kind: "task" },
      { id: "TK-6", title: "Attach approved spec sheets for incoming vehicles", owner: "p-jack", due: "This week", priority: "Medium", dept: "Vehicle Stock", status: "open", record: "V024", story: "E", kind: "task" },
      { id: "TK-7", title: "Show parts ETA on the morning meeting Downtime slide", owner: "p-anthony", due: "Next sprint", priority: "Low", dept: "Work", status: "open", record: "JOB-1046", kind: "improvement", acceptance: "Downtime slide lists each awaiting-parts job with its part and ETA." },
    ],
    activity: [
      { id: "a1", at: "07:00", who: "Briefing", kind: "agent", text: "Prepared today's morning meeting (sample run)", entity: "meeting" },
      { id: "a2", at: "08:15", who: "Billy", kind: "import", text: "Clocked on JOB-1042 (sample AssetMinder export)", entity: "JOB-1042" },
      { id: "a3", at: "08:50", who: "Jack Kelly", kind: "person", text: "Created Q-1042 for Westway Electrical — €500 discount routed for approval", entity: "Q-1042", attention: true },
      { id: "a4", at: "09:10", who: "Job Card Assistant", kind: "agent", text: "Prepared JOB-1041 draft — two questions raised (sample run)", entity: "JOB-1041", attention: true },
      { id: "a5", at: "09:30", who: "Elizabeth Reynolds", kind: "person", text: "Recorded V008 CVRT fail — repair JOB-1046 linked", entity: "V008", attention: true },
      { id: "a6", at: "09:42", who: "Ops Watchdog", kind: "agent", text: "Flagged Seán Doyle unallocated since 09:25 (sample run)", entity: "t-sean" },
      { id: "a7", at: "10:00", who: "Ops Watchdog", kind: "agent", text: "Flagged JOB-1042 at 105/120 minutes (sample run)", entity: "JOB-1042", attention: true },
    ],
    runs: [
      { id: "R-1", agent: "briefing", at: "07:00", status: "Draft prepared", inputs: ["Sample AssetMinder export", "Sample Bizimply report", "Planner"], outputs: ["Morning meeting deck — 5 sections enabled"] },
      { id: "R-2", agent: "jobcard", at: "09:10", status: "Needs review", inputs: ["JOB-1041 notes", "JOB-1041 job record"], outputs: ["Draft narrative — 2 supported items", "2 questions for Conor Keane"] },
      { id: "R-3", agent: "watchdog", at: "10:00", status: "Needs review", inputs: ["Live clocking", "Attendance", "Job budgets"], outputs: ["JOB-1042 at 87.5% of budget", "2 present technicians unallocated"] },
    ],
    meeting: { sections: structuredClone(MEETING_SECTIONS), techIdx: 0, notes: {}, refreshedAt: SNAPSHOT_MIN, board: { s1: true, s2: false, s3: true, o1: false, o2: true, u1: false } },
    fridayReviews: {},
    liveReasons: {},
    lastOff: { "t-sean": "09:25", "t-rachel": "09:42" },
    jobcards: {},
    imports: { applied: [], previewOpen: false, history: [{ id: "RNL-OB-2026-10-12", at: "Mon 12 Oct 09:00", summary: "26 rows · 1 added · 0 missing" }] },
    gates: {
      V008: { documents: true, accounts: false, handedOver: false, dms: false },
      V012: { documents: true, accounts: true, handedOver: false, dms: false },
      V014: { documents: false, accounts: false, handedOver: false, dms: false },
      V013: { documents: true, accounts: true, handedOver: false, dms: false },
    },
    retest: {},
    stockChecks: [],
    rules: { gap: 15, warn: 85, over: 100, reviewWork: true, reviewDiscount: true, reviewComms: true, reviewAccounts: true, reviewSafety: true },
    decisions: {},
    invoiceExports: [],
    followUps: {},
    corrections: [],
    drawer: null,
    toast: null,
    focus: { quote: "Q-1042", specVehicle: "V024" },
  };
}

/* ---- store plumbing ----------------------------------------------------------- */
let state: State = initial();
const listeners = new Set<() => void>();
const emit = () => listeners.forEach(l => l());
export const getState = () => state;
export const subscribe = (cb: () => void) => { listeners.add(cb); return () => { listeners.delete(cb); }; };
export function useDemo(): State {
  return useSyncExternalStore(cb => { listeners.add(cb); return () => listeners.delete(cb); }, getState, getState);
}
let toastTimer: ReturnType<typeof setTimeout> | undefined;
function update(fn: (d: State) => void, toast?: string) {
  const prevToast = state.toast;
  const d = structuredClone(state);
  d.toast = null;
  fn(d);
  if (toast && !d.toast) d.toast = toast;
  state = d;
  emit();
  if (d.toast && d.toast !== prevToast) {
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { state = { ...state, toast: null }; emit(); }, 3400);
  }
}
let seq = 100;
const now = (d: State) => hhmm(d.clock);
function log(d: State, who: string, kind: Act["kind"], text: string, entity?: string, attention?: boolean) {
  d.activity.unshift({ id: "a" + seq++, at: now(d), who, kind, text, entity, attention });
}
const ME = "Anthony Reynolds";

/* ---- lookups --------------------------------------------------------------- */
export const person = (id: string | null | undefined) => STAFF.find(p => p.id === id);
export const pname = (id: string | null | undefined) => person(id)?.name ?? "—";
export const company = (id: string | null | undefined) => COMPANIES.find(c => c.id === id);
export const cname = (id: string | null | undefined) => company(id)?.name ?? "—";
export const techs = STAFF.filter(p => p.kind === "technician");
export function vehicleLabel(s: State, id: string): { reg: string; model: string; customer: string | null; stock: boolean } {
  const sv = SERVICE_VEHICLES.find(v => v.id === id);
  if (sv) return { reg: sv.reg, model: `${sv.model} ${sv.kind.toLowerCase()}`, customer: sv.customer, stock: false };
  const v = s.stock.find(x => x.id === id);
  if (v) return { reg: v.reg || v.id, model: `Renault ${v.model} ${v.variant}`, customer: v.customer, stock: true };
  return { reg: id, model: "—", customer: null, stock: false };
}

/* ---- derived ------------------------------------------------------------------- */
export const elapsed = (j: Job, clock: number) => j.status === "in_progress" && j.start ? Math.max(0, clock - toMin(j.start)) : j.stoppedElapsed ?? 0;
export const DAY_START = toMin("08:00"), DAY_END = toMin("16:30"), BREAK = [toMin("12:30"), toMin("13:00")] as const;

export interface Block { job: Job; from: number; to: number; live: boolean }
export function blocksFor(s: State, techId: string): Block[] {
  return s.jobs.filter(j => j.tech === techId && (j.status === "in_progress" || (j.status === "queued" && j.plannedStart)))
    .map(j => {
      const from = j.status === "in_progress" ? toMin(j.start!) : toMin(j.plannedStart!);
      return { job: j, from, to: from + j.budgetMin, live: j.status === "in_progress" };
    }).sort((a, b) => a.from - b.from);
}

export type TechState = "on_job" | "unallocated" | "absent" | "training";
export interface TechNow { id: string; state: TechState; job?: Job; next?: Job; since?: string; gapMin?: number; reason?: string }
export function techNow(s: State, id: string): TechNow {
  const att = ATTENDANCE[id];
  const queued = s.jobs.filter(j => j.tech === id && j.status === "queued" && j.plannedStart).sort((a, b) => toMin(a.plannedStart!) - toMin(b.plannedStart!));
  if (att === "absent") return { id, state: "absent", next: queued[0] };
  if (att === "training") return { id, state: "training", next: queued[0] };
  const job = s.jobs.find(j => j.tech === id && j.status === "in_progress");
  if (job) return { id, state: "on_job", job, next: queued[0] };
  const since = s.lastOff[id] ?? hhmm(DAY_START);
  return { id, state: "unallocated", since, gapMin: Math.max(0, s.clock - toMin(since)), next: queued[0], reason: s.liveReasons[id] };
}

export function derive(s: State) {
  const jobs = s.jobs;
  const by = (st: Job["status"]) => jobs.filter(j => j.status === st);
  const completed = by("completed");
  const ready = completed.filter(j => j.invoice === "ready");
  const blocked = completed.filter(j => j.invoice === "blocked");
  const sum = (a: Job[]) => a.reduce((t, j) => t + (j.net ?? 0), 0);
  const active = s.stock.filter(v => v.status !== "sold");
  const tn = techs.map(t => techNow(s, t.id));
  const budgetFlags = by("in_progress").map(j => ({ j, pct: (elapsed(j, s.clock) / j.budgetMin) * 100 }))
    .filter(x => x.pct >= s.rules.warn).sort((a, b) => b.pct - a.pct);
  const gaps = tn.filter(t => t.state === "unallocated" && (t.gapMin ?? 0) > s.rules.gap);
  const cv = (st: CvrtBooking["status"]) => s.cvrt.filter(c => c.status === st);
  const overdue = RECEIVABLES.filter(r => daysBetween(r.due) > 0);
  // Friday reconciliation with reviewed gaps moved out of "unallocated"
  let reviewedInternal = 0, explained = 0;
  const fridayGaps = fridayAllGaps();
  fridayGaps.forEach(g => {
    const r = s.fridayReviews[g.id];
    if (r?.cls === "internal") reviewedInternal += g.len / 60;
    else if (r?.cls === "explained") explained += g.len / 60;
  });
  const fri = { paid: 120, job: 94, breaks: 7.5, internal: 5.5 + reviewedInternal, explained, unallocated: 13 - reviewedInternal - explained };
  return {
    tn, gaps, budgetFlags,
    queued: by("queued"), hopper: jobs.filter(j => j.hopper && !j.tech), inProgress: by("in_progress"),
    awaitingParts: by("awaiting_parts"), awaitingQc: by("awaiting_qc"), completed, ready, blocked,
    open: jobs.filter(j => j.status !== "completed"),
    completedNet: sum(completed), readyNet: sum(ready), blockedNet: sum(blocked),
    active, sold: s.stock.filter(v => v.status === "sold"),
    onSite: active.filter(v => v.status !== "incoming"), incoming: active.filter(v => v.status === "incoming"),
    available: active.filter(v => v.status === "available"), reserved: active.filter(v => v.status === "reserved"),
    preparation: active.filter(v => v.status === "preparation"), missingSpec: active.filter(v => v.specStatus !== "approved"),
    standing: active.reduce((t, v) => t + standingCost(v), 0),
    cvrt: { scheduled: cv("scheduled"), repair: cv("awaiting_repair"), retest: cv("awaiting_retest"), done: cv("completed") },
    receivables: RECEIVABLES.reduce((t, r) => t + r.amount, 0), overdue, overdueTotal: overdue.reduce((t, r) => t + r.amount, 0),
    fri, allocationRate: fri.job / (fri.paid - fri.breaks),
    counts: {
      onJob: tn.filter(t => t.state === "on_job").length, unallocated: tn.filter(t => t.state === "unallocated").length,
      absent: tn.filter(t => t.state === "absent").length, training: tn.filter(t => t.state === "training").length,
    },
  };
}
export type Derived = ReturnType<typeof derive>;
let dCache: { s: State; d: Derived } | null = null;
export function useDerived(): [State, Derived] {
  const s = useDemo();
  if (!dCache || dCache.s !== s) dCache = { s, d: derive(s) };
  return [s, dCache.d];
}

export const standingCost = (v: Vehicle) => v.costs.reduce((t, c) => t + c.amount, 0) - (v.rebate && !v.rebate.includedInStanding ? v.rebate.amount : 0);

/* ---- Friday timeline (deterministic, reconciles to the four buckets) ---- */
export interface Interval { kind: "job" | "gap" | "break" | "internal" | "training" | "running"; from: number; to: number; label?: string; gapId?: string; jobId?: string }
const r5 = (n: number) => Math.round(n / 5) * 5;
export function fridayIntervals(techId: string): Interval[] {
  const i = techs.findIndex(t => t.id === techId);
  const U = Math.round((FRIDAY_UNALLOC[techId] ?? 0) * 60), I = Math.round((FRIDAY_INTERNAL[techId] ?? 0) * 60);
  const g1 = U ? r5(U * 0.6) : 0, g2 = U - g1;
  const mJobs = 270 - g1, jA = r5(mJobs * (0.45 + (i % 3) * 0.06)), jB = mJobs - jA;
  const aJobs = 180 - g2 - I, jC = r5(aJobs * 0.5), jD = aJobs - jC;
  const veh = (k: number) => SERVICE_VEHICLES[(i * 4 + k) % SERVICE_VEHICLES.length];
  const lab = (k: number) => { const v = veh(k); return `${v.reg} · ${cname(v.customer)}`; };
  const out: Interval[] = [];
  let t = DAY_START;
  const push = (kind: Interval["kind"], len: number, extra: Partial<Interval> = {}) => { if (len > 0) { out.push({ kind, from: t, to: t + len, ...extra }); t += len; } };
  push("job", jA, { label: lab(0) });
  push("gap", g1, { gapId: `F-${techId}-1` });
  push("job", jB, { label: lab(1) });
  push("break", 30, { label: "Break" });
  push("job", jC, { label: lab(2) });
  push("gap", g2, { gapId: `F-${techId}-2` });
  push("job", jD, { label: lab(3) });
  push("internal", I, { label: "Internal — workshop housekeeping" });
  return out;
}
export function fridayAllGaps() {
  return techs.flatMap(t => fridayIntervals(t.id).filter(x => x.kind === "gap").map(x => ({ id: x.gapId!, tech: t.id, from: x.from, len: x.to - x.from })));
}
export function mondayIntervals(s: State, techId: string): Interval[] {
  const tn = techNow(s, techId);
  if (tn.state === "absent") return [];
  if (tn.state === "training") return [{ kind: "training", from: DAY_START, to: DAY_END, label: "Off-site training (approved)" }];
  const out: Interval[] = [];
  if (tn.state === "on_job" && tn.job) {
    const S = toMin(tn.job.start!);
    if (S - DAY_START > 15) out.push({ kind: "job", from: DAY_START, to: S, label: "Earlier job (closed)" });
    out.push({ kind: "running", from: S, to: s.clock, label: `${vehicleLabel(s, tn.job.vehicle).reg} · ${cname(tn.job.customer)}`, jobId: tn.job.id });
  } else if (tn.state === "unallocated") {
    const since = toMin(tn.since!);
    out.push({ kind: "job", from: DAY_START, to: since, label: "Earlier job (closed)" });
    out.push({ kind: "gap", from: since, to: s.clock, gapId: "M-" + techId });
  }
  return out;
}

/* ---- quote helpers ---------------------------------------------------------------- */
export function quoteTotals(q: Quote) {
  const g = (k: string) => q.lines.filter(l => l.group === k).reduce((t, l) => t + l.amount, 0);
  const subtotal = q.lines.reduce((t, l) => t + l.amount, 0);
  return { vehicle: g("vehicle"), options: g("options"), delivery: g("delivery"), subtotal, net: subtotal - q.discount };
}
export function quoteGates(s: State, q: Quote) {
  const meta = s.quoteMeta[q.id] ?? { version: 1, discountApproval: null, history: [] };
  const v = q.vehicle ? s.stock.find(x => x.id === q.vehicle) : undefined;
  const needsDiscount = q.discount > DISCOUNT_THRESHOLD;
  const discountOk = !needsDiscount || meta.discountApproval?.version === meta.version;
  const specOk = !!v && v.specStatus === "approved";
  return { meta, needsDiscount, discountOk, specOk, ready: discountOk && specOk, staleApproval: !!meta.discountApproval && meta.discountApproval.version !== meta.version };
}

/* ---- handover gates --------------------------------------------------------------- */
export function handoverGates(s: State, vid: string) {
  const g = s.gates[vid];
  const v = s.stock.find(x => x.id === vid)!;
  const job = v?.jobRef ? s.jobs.find(j => j.id === v.jobRef) : undefined;
  const test = s.cvrt.find(c => c.vehicle === vid);
  const list: { key: string; label: string; owner: string; ok: boolean; detail: string }[] = [];
  if (job && job.partBlocker) list.push({ key: "parts", label: "Parts", owner: job.partBlocker.owner, ok: job.partBlocker.received, detail: job.partBlocker.received ? `${job.partBlocker.part} received` : `${job.partBlocker.part} · ETA ${job.partBlocker.eta}` });
  if (job) list.push({ key: "repair", label: "Repair readiness", owner: "p-jonathan", ok: job.status === "awaiting_qc" || job.status === "completed", detail: job.status === "awaiting_qc" || job.status === "completed" ? `${job.id} repair complete — QC` : `${job.id} ${job.status.replace("_", " ")}` });
  if (test) list.push({ key: "test", label: "CVRT result", owner: "p-elizabeth", ok: test.status === "completed" && test.result === "pass", detail: test.status === "completed" && test.result === "pass" ? `${test.id} passed (recorded, reviewed)` : test.status === "awaiting_retest" ? `${test.id} retest scheduled` : `${test.id} failed — retest after repair` });
  list.push({ key: "documents", label: "Documents", owner: "p-jack", ok: g?.documents ?? false, detail: g?.documents ? "Registration and handover pack checked" : "Documents outstanding" });
  list.push({ key: "accounts", label: "Accounts clearance", owner: "p-caroline", ok: g?.accounts ?? false, detail: g?.accounts ? "Cleared (demo review)" : "Awaiting accounts review" });
  return { list, ready: list.every(x => x.ok), vehicle: v, job, test };
}

/* ---- approvals (derived queue) -------------------------------------------------- */
export interface ApprovalItem { id: string; queue: "Technician confirmation" | "Job-card review" | "Discount approval" | "Stock correction" | "Customer communication"; title: string; reviewer: string; evidence: string[]; consequence: string; record: string }
export function approvals(s: State, d: Derived): ApprovalItem[] {
  const out: ApprovalItem[] = [];
  d.blocked.forEach(j => {
    const jc = s.jobcards[j.id];
    if (!jc?.techConfirmed) out.push({ id: "tc-" + j.id, queue: "Technician confirmation", title: `${j.id} — confirm work performed`, reviewer: j.tech!, record: j.id,
      evidence: [`Notes: “${j.notes ?? ""}”`, `${eur(j.net ?? 0)} net from the job record`], consequence: "Confirmed facts unlock the service review. Nothing is invoiced yet." });
    else if (!jc.approved) out.push({ id: "jr-" + j.id, queue: "Job-card review", title: `${j.id} — approve write-up`, reviewer: "p-jonathan", record: j.id,
      evidence: ["Technician confirmed the work", `Narrative v${jc.version}`], consequence: `Moves ${j.id} to invoice-ready (${eur(j.net ?? 0)}). Not posted to accounting.` });
  });
  s.quotes.forEach(q => {
    const g = quoteGates(s, q);
    if (g.needsDiscount && !g.discountOk) out.push({ id: "dq-" + q.id, queue: "Discount approval", title: `${q.id} — ${eur(q.discount)} discount`, reviewer: "p-anthony", record: q.id,
      evidence: [`Net ${eur(quoteTotals(q).net)} on ${q.vehicle}`, `Policy: discounts above ${eur(DISCOUNT_THRESHOLD)} need approval (demo setting)`, g.staleApproval ? "Previous approval invalidated by an edit" : `Version v${g.meta.version}`],
      consequence: "Binds to this exact quote version. A later price edit invalidates it." });
  });
  s.stock.filter(v => v.reviewFlag && !s.decisions["sc-" + v.id]).forEach(v => out.push({ id: "sc-" + v.id, queue: "Stock correction", title: `${v.id} — missing from latest order book`, reviewer: "p-anthony", record: v.id,
    evidence: [`Absent from ${ORDER_BOOK_NEXT.file}`, v.promisedTo ? `Promised to ${cname(v.promisedTo)}` : "No customer promise"], consequence: "Keeps the vehicle tracked as incoming with a review history entry. A missing row never becomes a sale." }));
  if (!s.decisions["cc-V008"]) out.push({ id: "cc-V008", queue: "Customer communication", title: "V008 — draft update to Midlands Parcel Services", reviewer: "p-anthony", record: "V008",
    evidence: ["Prepared by Handover Coordinator", "No release date promised; no internal costs"], consequence: "Approving marks the draft ready. It is not sent from the demo." });
  return out;
}

/* ════════════════════════════ ACTIONS ════════════════════════════ */
export const A = {
  reset: () => { state = initial(); state.toast = "Demo reset to the 10:00 snapshot"; emit(); setTimeout(() => { state = { ...state, toast: null }; emit(); }, 2600); },
  toast: (t: string) => update(() => {}, t),
  setRole: (r: Role) => update(d => { d.role = r; }, `Previewing as ${r} — visibility illustration only, not production security`),
  advance: (m: number) => update(d => { d.clock = Math.min(DAY_END, d.clock + m); log(d, "Demo clock", "workflow", `Simulation advanced ${m} min`); }, `Simulated time ${hhmm(Math.min(DAY_END, state.clock + m))}`),
  resetClock: () => update(d => { d.clock = SNAPSHOT_MIN; }, "Clock back to the 10:00 snapshot"),
  focus: (k: string, v: string) => update(d => { d.focus[k] = v; }),
  newQuote: (vid: string): string => {
    const existing = state.quotes.find(q => q.vehicle === vid);
    if (existing) { update(d => { d.focus.quote = existing.id; }); return existing.id; }
    const id = "Q-" + (1043 + state.quotes.filter(q => +q.id.slice(2) >= 1043).length);
    update(d => {
      const v = d.stock.find(x => x.id === vid)!;
      d.quotes.unshift({ id, customer: v.customer ?? "c-boyle", owner: "p-jack", vehicle: vid, stage: "Quoted", date: "19 Oct 2026",
        lines: [{ id: "l1", label: `Renault ${v.model} ${v.variant} (${vid}) — enter price`, amount: 0, group: "vehicle" }],
        discount: 0, warranty: "Manufacturer warranty (sample description)", nextAction: "Price and send for review", due: "Today",
        tradeIn: { on: false, reg: "", model: "", allowance: 0, settlement: 0 }, finance: { on: false, provider: "", deposit: 0, financed: 0, term: 0, repayment: 0 } });
      d.quoteMeta[id] = { version: 1, discountApproval: null, history: [`v1 created from stock card ${vid} · ${now(d)}`] };
      d.focus.quote = id;
      log(d, "Jack Kelly", "person", `Drafted ${id} from stock card ${vid}`, id);
    }, `${id} drafted from ${vid} — enter the selling price`);
    return id;
  },
  open: (kind: NonNullable<State["drawer"]>["kind"], id: string) => update(d => { d.drawer = { kind, id }; }),
  close: () => update(d => { d.drawer = null; }),

  /* Workshop — live */
  liveReason: (tech: string, reason: string) => update(d => { d.liveReasons[tech] = reason; log(d, "Jonathan Keenan", "person", `Recorded reason for ${pname(tech)}'s gap: ${reason}`, tech); }, "Reason recorded — raw clocking unchanged"),
  reviewFriday: (gapId: string, cls: GapReview["cls"], reason: string) => update(d => {
    d.fridayReviews[gapId] = { cls, reason, by: "Jonathan Keenan", at: now(d) };
    log(d, "Jonathan Keenan", "person", `Reclassified Friday gap ${gapId} as ${cls === "internal" ? "internal work" : "explained non-job time"}: ${reason}`, "FRIDAY");
  }, "Classification saved — original clock events kept"),
  undoFriday: (gapId: string) => update(d => { delete d.fridayReviews[gapId]; log(d, "Jonathan Keenan", "person", `Reverted classification on ${gapId}`, "FRIDAY"); }),
  allocationTask: () => update(d => {
    if (d.tasks.some(t => t.id === "TK-AR")) return;
    d.tasks.unshift({ id: "TK-AR", title: "Allocation review — Seán and Rachel gaps", owner: "p-jonathan", due: "Today 12:00", priority: "High", dept: "Workshop", status: "open", record: "LIVE", story: "A", kind: "task" });
    log(d, "Jonathan Keenan", "person", "Created allocation-review task", "LIVE");
  }, "Allocation-review task created"),
  extendBudget: (jobId: string, add: number, reason: string) => update(d => {
    const j = d.jobs.find(x => x.id === jobId)!; j.budgetMin += add;
    log(d, "Jonathan Keenan", "person", `Extended ${jobId} budget by ${add} min (${reason})`, jobId);
  }, `Budget now ${dur((state.jobs.find(j => j.id === jobId)?.budgetMin ?? 0) + add)}`),
  moveJob: (jobId: string, tech: string, start: number, reason: string): string | null => {
    const err = checkSlot(state, jobId, tech, start);
    if (err) { A.toast(err); return err; }
    update(d => {
      const j = d.jobs.find(x => x.id === jobId)!;
      const from = `${pname(j.tech)} ${j.plannedStart ?? ""}`.trim();
      j.tech = tech; j.plannedStart = hhmm(start); j.hopper = false;
      log(d, "Jonathan Keenan", "person", `Moved ${jobId} from ${from} to ${pname(tech)} ${hhmm(start)} — ${reason}`, jobId);
    }, `${jobId} scheduled ${pname(tech)} ${hhmm(start)} — not clocked on`);
    return null;
  },
  addHopperJob: (customer: string, complaint: string, minutes: number) => update(d => {
    const id = "JOB-" + (1080 + d.jobs.filter(j => +j.id.slice(4) >= 1080).length);
    d.jobs.push({ id, status: "queued", hopper: true, tech: null, customer, vehicle: "C134", complaint, workType: "General workshop", budgetMin: minutes });
    log(d, ME, "person", `Added ${id} to the job card hopper`, id);
  }, "Job added to the hopper"),
  breakdownCall: () => update(d => {
    const id = "JOB-" + (1080 + d.jobs.filter(j => +j.id.slice(4) >= 1080).length);
    d.jobs.push({ id, status: "queued", hopper: true, tech: null, customer: "c-galway", vehicle: "C132", complaint: "Breakdown recovery follow-up — air pressure warning, N6 Kinnegad (sample call)", workType: "General workshop", budgetMin: 90 });
    log(d, "Shane Carthy (on call)", "person", `Logged sample breakdown call — follow-up ${id} added to hopper`, id, true);
  }, "Sample call logged — follow-up job in the hopper"),

  /* Job cards */
  loadSample: (jobId: string) => update(d => {
    const jc = ensureCard(d, jobId);
    jc.rows = SAMPLE_OPERATIONS.map((o, i) => ({ id: "r" + i, op: o.op, note: o.note, oem: o.oem, haynes: o.haynes, basis: "oem", manual: o.oem, qty: 1, parts: i === 0 ? 180 : i === 2 ? 0 : i === 3 ? 45 : 0 }));
    jc.loaded = true; jc.sourceFile = "job-card-sample.pdf (sample — manual entry, no OCR)";
    log(d, ME, "import", `Loaded sample job card into ${jobId} estimate`, jobId);
  }, "Sample job card loaded — operation rows are editable"),
  noteFile: (jobId: string, name: string) => update(d => { ensureCard(d, jobId).sourceFile = `${name} — not parsed in the demo; use manual entry or the sample`; }, `${name} attached — not parsed (no OCR in the demo)`),
  editRow: (jobId: string, rowId: string, patch: Partial<EstRow>) => update(d => { const r = ensureCard(d, jobId).rows.find(x => x.id === rowId); if (r) Object.assign(r, patch); }),
  addRow: (jobId: string) => update(d => { const jc = ensureCard(d, jobId); jc.rows.push({ id: "r" + seq++, op: "New operation", note: "", oem: 0, haynes: 0, basis: "manual", manual: 1, qty: 1, parts: 0 }); }),
  removeRow: (jobId: string, rowId: string) => update(d => { const jc = ensureCard(d, jobId); jc.rows = jc.rows.filter(r => r.id !== rowId); }),
  setSurcharge: (jobId: string, v: number) => update(d => { ensureCard(d, jobId).surcharge = v; }),
  answer: (jobId: string, qi: number, a: string) => update(d => { const jc = ensureCard(d, jobId); jc.answers[qi] = a; jc.techConfirmed = false; }),
  editNarrative: (jobId: string, text: string) => update(d => { const jc = ensureCard(d, jobId); jc.narrative = text; jc.version++; if (jc.approved) { jc.approved = false; const j = d.jobs.find(x => x.id === jobId)!; j.invoice = "blocked"; log(d, ME, "workflow", `${jobId} write-up edited after approval — approval invalidated`, jobId, true); } }),
  techConfirm: (jobId: string) => update(d => {
    const jc = ensureCard(d, jobId); const facts = JOB_CARD_FACTS[jobId];
    if (facts && facts.questions.some((_, i) => !jc.answers[i])) return;
    jc.techConfirmed = true; const j = d.jobs.find(x => x.id === jobId)!;
    log(d, pname(j.tech), "person", `Confirmed performed work on ${jobId}`, jobId, true);
  }, "Technician confirmation recorded"),
  approveWriteup: (jobId: string) => update(d => {
    const jc = ensureCard(d, jobId); if (!jc.techConfirmed) return;
    jc.approved = true; jc.approvedVersion = jc.version;
    const j = d.jobs.find(x => x.id === jobId)!; j.invoice = "ready";
    log(d, "Jonathan Keenan", "person", `Approved ${jobId} write-up v${jc.version} — invoice-ready (${eur(j.net ?? 0)}), not posted`, jobId);
    d.tasks.forEach(t => { if (t.record === jobId) t.status = "done"; });
  }, `${jobId} is invoice-ready — not posted to accounting`),

  /* Stock + order book */
  previewImport: () => update(d => { d.imports.previewOpen = true; log(d, "Stock & Specification", "agent", "Prepared order-book diff: 2 added, 3 ETA changes, 1 missing (sample run)", "V019"); }),
  applyImport: (sel: { added: boolean; eta: boolean; missing: boolean }) => update(d => {
    const id = ORDER_BOOK_NEXT.importId;
    if (d.imports.applied.includes(id)) {
      d.imports.history.unshift({ id: id + "-repeat", at: now(d), summary: "27 rows matched existing identifiers · 0 applied · duplicates skipped" });
      log(d, "Stock & Specification", "import", `Repeat import ${id} skipped — already applied, no duplicates created`);
      d.toast = "Already applied — 27 rows matched, nothing duplicated";
      d.imports.previewOpen = false;
      return;
    }
    const parts: string[] = [];
    if (sel.added) ORDER_BOOK_NEXT.added.forEach((a, i) => {
      if (d.stock.some(v => v.id === a.id)) return;
      d.stock.push({ id: a.id, model: a.model, variant: a.variant, range: a.model === "Master" ? "Master" : "Trafic", status: "incoming", vin: null, svo: a.svo, reg: "", colour: "White", gearbox: "Manual", power: "", location: "Inbound", customer: null, jobRef: null, eta: a.eta,
        costs: [{ label: "Base vehicle", amount: a.cost }, { label: "Preparation (PDI, valet)", amount: 500 }], rebate: null, specStatus: "missing", notes: "Added by order book " + id, folderUrl: "" });
      if (i === 1) parts.push("2 added");
    });
    if (sel.eta) { ORDER_BOOK_NEXT.etaChanges.forEach(c => { const v = d.stock.find(x => x.id === c.id); if (v) v.eta = c.to; }); parts.push("3 ETA changes"); }
    if (sel.missing) ORDER_BOOK_NEXT.missing.forEach(mid => {
      const v = d.stock.find(x => x.id === mid); if (v) v.reviewFlag = "Missing from latest file · review required";
      if (!d.tasks.some(t => t.id === "TK-V019")) d.tasks.unshift({ id: "TK-V019", title: `Reconcile ${mid} — missing from latest order book`, owner: "p-jack", due: "Today", priority: "High", dept: "Sales", status: "open", record: mid, story: "D", kind: "task" });
      parts.push(`${mid} flagged`);
    });
    d.imports.applied.push(id); d.imports.previewOpen = false;
    d.imports.history.unshift({ id, at: now(d), summary: `27 rows · ${parts.join(" · ")}` });
    log(d, ME, "import", `Applied sample order book ${id}: ${parts.join(", ")}. V019 kept for review — not sold.`, "V019", true);
    d.toast = "Import applied — V019 flagged for review, not sold";
  }),
  resolveStock: (vid: string, reason: string) => update(d => {
    const v = d.stock.find(x => x.id === vid)!; v.reviewFlag = null; d.decisions["sc-" + vid] = "approved";
    d.corrections.unshift({ id: "SC-" + seq++, vehicle: vid, reason, at: now(d) });
    log(d, ME, "person", `${vid} kept as tracked incoming — ${reason}`, vid);
  }, `${vid} kept as incoming, history recorded`),
  confirmSale: (vid: string, amount: number, buyer: string) => update(d => {
    const v = d.stock.find(x => x.id === vid)!; v.status = "sold"; v.sold = { amount, buyer, date: "2026-10-19", checklist: { "Registration date": false, Warranty: false, "Documents signed": false, "Transfer to DMS (simulated)": false } };
    log(d, ME, "person", `Confirmed sale of ${vid} to ${cname(buyer)} for ${eur(amount)} (with evidence)`, vid);
  }, `${vid} marked sold — confirmed`),
  restoreSold: (vid: string, reason: string) => update(d => {
    const v = d.stock.find(x => x.id === vid)!; v.status = "available"; delete v.sold;
    d.corrections.unshift({ id: "SC-" + seq++, vehicle: vid, reason: "Restored to active: " + reason, at: now(d) });
    log(d, ME, "person", `Restored ${vid} to active stock — ${reason}`, vid);
  }, `${vid} restored to active — reversible history kept`),
  toggleChecklist: (vid: string, key: string) => update(d => { const v = d.stock.find(x => x.id === vid)!; if (v.sold) v.sold.checklist[key] = !v.sold.checklist[key]; }),
  editVehicle: (vid: string, patch: Partial<Vehicle>) => update(d => { Object.assign(d.stock.find(x => x.id === vid)!, patch); log(d, ME, "person", `Edited ${vid} details`, vid); }, "Vehicle saved"),
  editCost: (vid: string, idx: number, amount: number) => update(d => { const v = d.stock.find(x => x.id === vid)!; v.costs[idx].amount = amount; }),
  stockCheck: (results: StockCheck["results"]) => update(d => {
    d.stockChecks.unshift({ id: "SCK-" + seq++, at: now(d), by: "Gavin Tuohy", results });
    const nf = Object.values(results).filter(r => r === "not found").length;
    log(d, "Gavin Tuohy", "person", `Physical stock check recorded — ${Object.keys(results).length} vehicles, ${nf} not found (nothing deleted or sold)`, "stock");
  }, "Stock-check session saved"),
  attachSample: (vid: string) => update(d => {
    const v = d.stock.find(x => x.id === vid)!;
    if (d.docs.some(x => x.vehicle === vid && x.status !== "superseded")) return;
    d.docs.unshift({ id: "D-" + vid + "-s", vehicle: vid, title: `${v.model} ${v.variant} — specification (illustrative sample)`, type: "Specification sheet", scope: "VIN-specific", language: "English", version: "v1 · sample", source: "Illustrative sample — not manufacturer specifications", match: v.vin ? `Demo VIN ${v.vin} matches` : `Matched on ${v.svo} — VIN not yet issued`, status: "review" });
    v.specStatus = "review";
    log(d, "Stock & Specification", "agent", `Attached illustrative sample spec to ${vid} — awaiting review`, vid);
  }, "Sample specification attached — review it to approve"),
  approveSpec: (docId: string) => update(d => {
    const doc = d.docs.find(x => x.id === docId)!; doc.status = "approved";
    const v = d.stock.find(x => x.id === doc.vehicle); if (v) v.specStatus = "approved";
    log(d, "Jack Kelly", "person", `Reviewed and approved specification for ${doc.vehicle}`, doc.vehicle ?? undefined);
  }, "Specification approved for this vehicle"),

  /* Sales */
  editLine: (qid: string, lid: string, patch: { label?: string; amount?: number }) => update(d => {
    const q = d.quotes.find(x => x.id === qid)!; const l = q.lines.find(x => x.id === lid)!; Object.assign(l, patch);
    if (patch.amount !== undefined) bumpQuote(d, qid, `${l.label} → ${eur(l.amount)}`);
  }),
  addLine: (qid: string, group: "options" | "delivery") => update(d => { const q = d.quotes.find(x => x.id === qid)!; q.lines.push({ id: "l" + seq++, label: group === "options" ? "New option" : "Delivery extra", amount: 0, group }); bumpQuote(d, qid, "line added"); }),
  removeLine: (qid: string, lid: string) => update(d => { const q = d.quotes.find(x => x.id === qid)!; q.lines = q.lines.filter(l => l.id !== lid); bumpQuote(d, qid, "line removed"); }),
  setDiscount: (qid: string, v: number) => update(d => { d.quotes.find(x => x.id === qid)!.discount = v; bumpQuote(d, qid, `discount → ${eur(v)}`); }),
  setTradeIn: (qid: string, patch: Partial<Quote["tradeIn"]>) => update(d => { Object.assign(d.quotes.find(x => x.id === qid)!.tradeIn, patch); }),
  setFinance: (qid: string, patch: Partial<Quote["finance"]>) => update(d => { Object.assign(d.quotes.find(x => x.id === qid)!.finance, patch); }),
  approveDiscount: (qid: string) => update(d => {
    const m = d.quoteMeta[qid] ?? (d.quoteMeta[qid] = { version: 1, discountApproval: null, history: [] });
    m.discountApproval = { version: m.version, at: now(d) }; m.history.unshift(`v${m.version} discount approved by Anthony Reynolds · ${now(d)}`);
    log(d, ME, "person", `Approved ${qid} discount on version v${m.version}`, qid);
    d.tasks.forEach(t => { if (t.record === qid && d.stock.find(v => v.id === d.quotes.find(q => q.id === qid)?.vehicle)?.specStatus === "approved") t.status = "done"; });
  }, "Discount approved — bound to this version"),
  rejectDiscount: (qid: string) => update(d => { log(d, ME, "person", `Returned ${qid} discount to Jack Kelly for changes`, qid); d.decisions["dq-" + qid] = "rejected"; }, "Returned for changes"),
  followUpTask: (qid: string) => update(d => {
    if (d.tasks.some(t => t.id === "TK-FU-" + qid)) return;
    d.tasks.unshift({ id: "TK-FU-" + qid, title: `${qid} — follow up with ${cname(d.quotes.find(q => q.id === qid)?.customer)}`, owner: "p-jack", due: "Wed 21 Oct", priority: "Medium", dept: "Sales", status: "open", record: qid, story: "E", kind: "task" });
    log(d, "Sales Assistant", "agent", `Created follow-up task for ${qid} (nothing sent)`, qid);
  }, "Follow-up task created — nothing sent"),

  /* Handover + CVRT */
  receivePart: (jobId: string) => update(d => {
    const j = d.jobs.find(x => x.id === jobId)!; if (!j.partBlocker) return;
    j.partBlocker.received = true; j.status = "queued"; j.plannedStart = "11:30";
    log(d, "Darren O'Brien", "person", `Received ${j.partBlocker.part} for ${jobId} — repair rescheduled 11:30`, jobId);
  }, "Part received — repair can resume. Test result unchanged."),
  completeRepair: (jobId: string) => update(d => {
    const j = d.jobs.find(x => x.id === jobId)!; j.status = "awaiting_qc"; j.stoppedElapsed = j.budgetMin; j.plannedStart = undefined;
    log(d, "Jonathan Keenan", "person", `${jobId} repair complete — awaiting quality check. Retest still required.`, jobId);
  }, "Repair complete — retest can now be scheduled"),
  scheduleRetest: (testId: string) => update(d => {
    const t = d.cvrt.find(x => x.id === testId)!; t.status = "awaiting_retest"; d.retest[testId] = { scheduled: true }; t.time = "14:45";
    log(d, "Elizabeth Reynolds", "person", `Scheduled retest ${testId} at 14:45`, t.vehicle);
  }, "Retest scheduled — result not yet recorded"),
  recordResult: (testId: string, result: "pass" | "fail") => update(d => {
    const t = d.cvrt.find(x => x.id === testId)!; t.result = result; t.status = result === "pass" ? "completed" : "awaiting_repair"; t.evidence = `Retest sheet ${testId} (sample) · reviewed by Elizabeth Reynolds`;
    log(d, "Elizabeth Reynolds", "person", `Recorded and reviewed ${testId} retest: ${result.toUpperCase()}`, t.vehicle, result === "fail");
  }, "Test outcome recorded by a person — not by an agent"),
  setGate: (vid: string, key: keyof Gates, val: boolean) => update(d => {
    d.gates[vid][key] = val;
    const label = { documents: "Documents checked", accounts: "Accounts clearance recorded (demo review)", handedOver: "Physical handover recorded", dms: "DMS transfer marked (simulated)" }[key];
    log(d, key === "accounts" ? "Caroline Glynn" : key === "documents" ? "Jack Kelly" : ME, "person", `${vid}: ${val ? label : label + " — reversed"}`, vid);
  }, "Gate updated"),
  decide: (id: string, v: "approved" | "rejected", text: string) => update(d => { d.decisions[id] = v; log(d, ME, "person", text, id.split("-").slice(1).join("-")); }, v === "approved" ? "Approved locally — nothing sent" : "Rejected"),

  /* Finance */
  prepareExport: (ids: string[]) => update(d => {
    ids.forEach(id => { if (!d.invoiceExports.includes(id)) d.invoiceExports.push(id); });
    log(d, "Finance Assistant", "agent", `Prepared invoice export for ${ids.join(", ")} — sample file, not posted to accounting`, "finance");
    d.runs.unshift({ id: "R-" + seq++, agent: "finance", at: now(d), status: "Simulated export prepared", inputs: ids, outputs: ["invoice-export-sample.csv"] });
  }, "Prepared in demo — not posted to accounting"),
  draftFollowUp: (rid: string) => update(d => {
    const r = RECEIVABLES.find(x => x.id === rid)!;
    d.followUps[rid] = `Hi ${company(r.customer)?.contact.split(" ")[0]}, a quick note that ${rid} for ${eur(r.amount)} was due on ${fmtDate(r.due)}. Could you let us know when we can expect payment? Thanks, Caroline`;
    log(d, "Finance Assistant", "agent", `Drafted follow-up for ${rid} — not sent`, rid);
  }, "Reminder drafted — not sent"),

  /* Work */
  toggleTask: (id: string) => update(d => { const t = d.tasks.find(x => x.id === id)!; t.status = t.status === "open" ? "done" : "open"; log(d, ME, "person", `${t.status === "done" ? "Completed" : "Reopened"} task: ${t.title}`, t.record); }),
  capture: (t: Omit<Task, "id" | "status">) => update(d => { d.tasks.unshift({ ...t, id: "TK-" + seq++, status: "open" }); log(d, ME, "person", `Captured ${t.kind === "improvement" ? "improvement request" : "task"}: ${t.title}`, t.record); }, "Captured"),

  /* Meeting */
  toggleSection: (id: string) => update(d => { const s = d.meeting.sections.find(x => x.id === id)!; s.enabled = !s.enabled; }),
  saveSections: (sections: State["meeting"]["sections"], notes: Record<string, string>) => update(d => { d.meeting.sections = sections; d.meeting.notes = notes; log(d, ME, "person", "Updated morning meeting sections", "meeting"); }, "Meeting sections saved"),
  meetingTech: (i: number) => update(d => { d.meeting.techIdx = i; }),
  refreshMeeting: () => update(d => { d.meeting.refreshedAt = d.clock; }, "Refreshed from shared records"),
  toggleBoard: (k: string) => update(d => { d.meeting.board[k] = !d.meeting.board[k]; }),

  /* Agents */
  runAgent: (agentId: string) => update(d => {
    const dd = derive(d);
    const a = AGENTS.find(x => x.id === agentId)!;
    const R: Record<string, { inputs: string[]; outputs: string[]; status: Run["status"] }> = {
      briefing: { inputs: ["Jobs", "Friday clocking", "Stock", "CVRT", "Finance"], outputs: [`Friday unallocated ${hrs(dd.fri.unallocated)}`, `${dd.gaps.length} live gaps · ${dd.budgetFlags.length} budget warnings`, `${eur(dd.blockedNet)} blocked on write-up`], status: "Draft prepared" },
      watchdog: { inputs: ["Live clocking", "Attendance", "Job budgets"], outputs: dd.gaps.map(g => `${pname(g.id)} unallocated ${dur(g.gapMin ?? 0)}`).concat(dd.budgetFlags.map(f => `${f.j.id} at ${Math.round(f.pct)}% of budget`)), status: "Needs review" },
      jobcard: { inputs: dd.blocked.map(j => j.id), outputs: dd.blocked.map(j => `${j.id} draft — ${(JOB_CARD_FACTS[j.id]?.questions.length ?? 0)} question(s)`), status: "Needs review" },
      stockspec: { inputs: ["Stock", "Documents", "Order book"], outputs: [`${dd.missingSpec.length} active vehicles without an approved spec`, d.imports.applied.length ? "Latest order book already applied" : "Order book diff ready: 2 added · 3 ETA · 1 missing"], status: "Draft prepared" },
      sales: { inputs: ["Q-1042", "V024"], outputs: [`Q-1042 ${eur(quoteTotals(d.quotes[0]).net)} net`, quoteGates(d, d.quotes[0]).ready ? "Ready for customer" : "Gates open: " + [!quoteGates(d, d.quotes[0]).discountOk && "discount", !quoteGates(d, d.quotes[0]).specOk && "specification"].filter(Boolean).join(", ")], status: "Needs review" },
      finance: { inputs: ["Completed jobs", "Sample Sage snapshot"], outputs: [`${eur(dd.readyNet)} invoice-ready`, `${eur(dd.blockedNet)} blocked`, `${eur(dd.overdueTotal)} overdue`], status: "Draft prepared" },
      handover: { inputs: ["V008 gates"], outputs: handoverGates(d, "V008").list.filter(g => !g.ok).map(g => `${g.label} — ${pname(g.owner)}`), status: "Needs review" },
    };
    const r = R[agentId];
    d.runs.unshift({ id: "R-" + seq++, agent: agentId, at: now(d), status: r.status, inputs: r.inputs, outputs: r.outputs.length ? r.outputs : ["Nothing to flag"] });
    log(d, a.name, "agent", `Sample run: ${r.outputs[0] ?? "nothing to flag"}`, agentId);
  }, "Sample run recorded locally — nothing sent externally"),
  approveRun: (id: string) => update(d => { const r = d.runs.find(x => x.id === id)!; r.status = "Approved locally"; log(d, ME, "person", `Approved run ${id} locally`); }, "Approved locally"),
  setRule: (k: keyof State["rules"], v: number | boolean) => update(d => { (d.rules as Record<string, number | boolean>)[k] = v; }),
};

function defaultCard(jobId: string): JobCard {
  const facts = JOB_CARD_FACTS[jobId];
  return { rows: [], surcharge: 0, loaded: false, answers: {}, techConfirmed: false, approved: false,
    narrative: facts ? facts.supported.join(". ") + "." : "", version: 1, approvedVersion: null, sourceFile: "" };
}
function ensureCard(d: State, jobId: string): JobCard {
  if (!d.jobcards[jobId]) d.jobcards[jobId] = defaultCard(jobId);
  return d.jobcards[jobId];
}
const cardCache = new Map<string, JobCard>();
export const cardFor = (s: State, jobId: string): JobCard => s.jobcards[jobId] ?? (cardCache.get(jobId) ?? (cardCache.set(jobId, defaultCard(jobId)), cardCache.get(jobId)!));

function bumpQuote(d: State, qid: string, what: string) {
  const m = d.quoteMeta[qid] ?? (d.quoteMeta[qid] = { version: 1, discountApproval: null, history: [] });
  const wasApproved = m.discountApproval?.version === m.version;
  m.version++; m.history.unshift(`v${m.version}: ${what} · ${now(d)}`);
  if (wasApproved) { log(d, "Pulse", "workflow", `${qid} edited after approval — v${m.version - 1} approval no longer applies`, qid, true); d.toast = "Edit invalidated the previous approval — review required"; }
}

export function checkSlot(s: State, jobId: string, tech: string, start: number): string | null {
  const p = person(tech);
  const job = s.jobs.find(j => j.id === jobId);
  if (!p || !job) return "Unknown technician or job";
  const att = ATTENDANCE[tech];
  if (att) return `${p.name} is ${att === "absent" ? "absent" : "on approved training"} today`;
  if (job.workType === "Auto-electrical" && p.role !== "Auto-electrician") return `${job.workType} work needs an auto-electrician`;
  if (p.role.startsWith("Apprentice") && job.budgetMin > 120) return "Apprentices take jobs up to 2h unsupervised in this demo";
  const end = start + job.budgetMin;
  if (start < DAY_START || end > DAY_END + 60) return "Outside the roster (08:00–16:30, up to 1h overtime)";
  if (start < s.clock - 5) return `Can't schedule in the past (now ${hhmm(s.clock)})`;
  const clash = blocksFor(s, tech).find(b => b.job.id !== jobId && start < b.to && end > b.from);
  if (clash) return `Overlaps ${clash.job.id} (${hhmm(clash.from)}–${hhmm(clash.to)})`;
  return null;
}

export { RATE, DISCOUNT_THRESHOLD, AGENTS, ORDER_BOOK_NEXT, RECEIVABLES, SERVICE_VEHICLES, JOB_CARD_FACTS };
