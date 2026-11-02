/* What PulseLogic (the generated shell) reads from the demo store: live inbox
   card text, tab counts, the demo clock, the Home rail, KPI values, the
   assistant's answers and vehicle search. Every number comes from the store or
   yard.ts so Home, the Yard, Workshop, Parts, Finance and the assistant agree. */
import { COMPANIES, SERVICE_VEHICLES } from "./fixtures";
import { A, approvals, cname, derive, dur, elapsed, eur, getState, handoverGates, hhmm, pname, subscribe, type State } from "./store";
import { go } from "./nav";
import {
  ANPR_EVENTS, BLOCKED, COMMS, KEYLOOP, NOTICES, STATUS, TODAY_ISO, YESTERDAY,
  attentionLine, attentionList, commStatus, commsCounts, commsFor, dayOf, findAnyVehicleKey, fmtWhen, hhmmOf, identityOf,
  inspectionCounts, noticeDays, noticeState, normReg, openVehicle, partsOverview, searchVehicles, vehicleByKey, workshopOverview,
  yardCounts, yardVehicles, type YardVehicle,
} from "./yard";

export { subscribe, getState };

export function demoClock(): { h: number; m: number } {
  const c = getState().clock;
  return { h: Math.floor(c / 60), m: c % 60 };
}

/* ── navigation from chat actions and inbox cards ────────────────────── */
type DrawerKind = "vehicle" | "job" | "company" | "quote";
const isDrawer = (k: string): k is DrawerKind => k === "vehicle" || k === "job" || k === "company" || k === "quote";
/** Target form: [page, section, kind, id]. Page "Vehicle" opens that vehicle's page; kind "focus" sets the focused vehicle. */
export function runTarget(t: string[] | undefined): void {
  if (!t || !t.length) return;
  const [page, sec, kind, id] = t;
  if (page === "Vehicle" && id) { openVehicle(id); return; }
  go(page, sec);
  if (kind && id) {
    if (kind === "focus") A.focus("vehicle", id);
    else if (isDrawer(kind)) A.open(kind, id);
  }
}

/* ── small text helpers ──────────────────────────────────────────────── */
const first = (n: string) => n.split(" ")[0];
const DAY_LONG: Record<string, string> = { Mon: "Monday", Tue: "Tuesday", Wed: "Wednesday", Thu: "Thursday", Fri: "Friday", Sat: "Saturday", Sun: "Sunday" };
const MONTH_LONG = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const longDay = (t: string) => t.replace(/^(Mon|Tue|Wed|Thu|Fri|Sat|Sun)\b/, m => DAY_LONG[m] ?? m);
const lc1 = (t: string) => (/^[A-Z][a-z]/.test(t) ? t.charAt(0).toLowerCase() + t.slice(1) : t);
const an = (w: string) => (/^[aeiou]/i.test(w) ? "an " : "a ") + w;
const partShort = (p: string) => lc1(p.replace(/ \(.*\)/, "").split(",")[0]);
const etaWords = (t: string) => (t.startsWith("Today") ? t.replace(/^Today /, "today at ") : longDay(t));
const whenWords = (t: string) => {
  const time = t.slice(-5);
  return t.startsWith("Today") ? `today at ${time}` : `on ${longDay(t.split(" ")[0])} at ${time}`;
};
const addDays = (iso: string, n: number) => { const d = new Date(iso + "T00:00:00"); d.setDate(d.getDate() + n); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };
const dayLabel = (iso: string) => { const d = new Date(iso + "T00:00:00"); return `${["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][d.getDay()]} ${d.getDate()} ${MONTH_LONG[d.getMonth()].slice(0, 3)}`; };
const longDate = (iso: string) => { const d = new Date(iso + "T00:00:00"); return `${d.getDate()} ${MONTH_LONG[d.getMonth()]}`; };
const nTimes = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;
const word = (n: number) => ["no", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"][n] ?? String(n);
const cap = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);
const soft = (t: string) => t.replace(/^(Today|Tomorrow|Yesterday)\b/, m => m.toLowerCase());
const gateWord = (l: string) => (l.startsWith("CVRT") ? l : lc1(l));

/* ── inbox cards on Home ─────────────────────────────────────────────── */
export interface InboxOv {
  title?: string; why?: string; detail?: string; age?: string; hidden?: boolean;
  fields?: { k: string; v: string }[]; history?: { when: string; text: string }[];
}

/** Live overrides for the Home inbox cards (keys match ITEMS in data.js). */
export function inboxOverrides(): Record<string, InboxOv> {
  const s = getState();
  const d = derive(s);
  const out: Record<string, InboxOv> = {};

  const v8 = vehicleByKey(s, "V008");
  const g8 = handoverGates(s, "V008");
  const open8 = g8.list.filter(g => !g.ok);
  out.v008 = {
    hidden: g8.ready || !v8,
    title: `V008 (${v8?.reg ?? "222-G-1984"}) handover blocked, failed CVRT`,
    why: `${v8?.customer ?? "Kelly Logistics"}'s used van cannot be released. Open gates: ${open8.map(g => g.label.toLowerCase()).join(", ") || "none"}.`,
    detail: `${g8.test ? `CVRT ${g8.test.id} ${g8.test.result === "pass" ? "passed" : "failed"}. ` : ""}${open8.map(g => `${g.label}: ${g.detail}`).join(". ")}. A repair finishing does not pass the test: the retest is a separate, reviewed outcome.`,
    fields: [{ k: "Provider", v: "handover.gates" }, { k: "Vehicle", v: v8?.reg ?? "V008" }, { k: "Repair", v: g8.job?.id ?? "JOB-1046" }, { k: "Customer", v: v8?.customer ?? "" }],
  };

  const mu = vehicleByKey(s, "C139");
  const mc = COMMS.find(c => c.id === "M-1034");
  const claim = mc?.extracted?.find(e => e.field === "Claim")?.value;
  const collect = mc?.extracted?.find(e => e.field === "Collection")?.value;
  out.murphy = {
    hidden: !mu || mu.status !== "accounts_hold",
    title: `${mu?.reg ?? "231-D-8812"} on accounts hold: ${eur(mu?.balance ?? 0)} outstanding`,
    why: mc ? `${first(mc.from)} ${mc.channel === "Email" ? "emailed" : "messaged"} at ${mc.at}. ${claim ?? "Says payment was sent"}${collect ? `. Release asked for ${collect.toLowerCase()}` : ""}.` : "Release is held until accounts approve.",
    detail: `${mu?.blocker ?? ""} Pulse cannot mark a payment received; Caroline Glynn approves the release in Keyloop.`,
    fields: [{ k: "Provider", v: "finance.holds" }, { k: "Vehicle", v: mu?.reg ?? "" }, { k: "Customer", v: mu?.customer ?? "" }, { k: "Outstanding", v: eur(mu?.balance ?? 0) }],
  };

  const em = COMMS.find(c => c.id === "M-1037");
  const sug = em?.suggestions?.[0];
  const sugReg = sug ? identityOf(s, sug.key).reg : "";
  out.ecu = {
    hidden: !em || commStatus(s, em) !== "review",
    title: `ECU message needs review: probably ${sugReg}`,
    why: em && sug ? `“${em.text}” Pulse is ${sug.confidence}% sure which vehicle this is and wants a person to confirm.` : "",
    detail: sug ? `${sug.why}. Confirming attaches the message to the vehicle timeline and its job.` : "",
    fields: [{ k: "Provider", v: "comms.triage" }, { k: "Source", v: em ? `${em.channel}, ${em.source}` : "" }, { k: "Suggested", v: sugReg }, { k: "Confidence", v: `${sug?.confidence ?? 0}%` }],
  };

  const ue = ANPR_EVENTS.find(e => e.id === "ANPR-0951");
  out.unknown = {
    hidden: !ue || !!s.yard.anpr[ue.id],
    title: `Unknown vehicle at the gate, plate read at ${ue?.confidence ?? 84}%`,
    why: ue ? `ANPR read ${ue.read} at ${ue.at} but could not match it to a vehicle or customer. It is held in the gate holding bay.` : "",
    detail: ue?.suggestion ? `The closest known vehicle is ${ue.suggestion.why}. Review the read, match it to a vehicle, or create a new vehicle record.` : "",
    fields: [{ k: "Provider", v: "yard.anpr" }, { k: "Read", v: ue?.read ?? "" }, { k: "Confidence", v: `${ue?.confidence ?? 0}%` }, { k: "Camera", v: ue?.camera ?? "" }],
  };

  const nt = NOTICES.find(n => n.id === "N-3301");
  const nreg = nt ? identityOf(s, nt.vehicle) : null;
  out.doyle = {
    hidden: !nt || noticeState(s, nt).stage !== "new",
    title: nt && nreg ? `Renault notice: ${nreg.reg} ${nt.kind.toLowerCase()} due ${longDate(nt.due)}` : "",
    why: nt && nreg ? `${cname(nreg.customerId)}. Pulse found the customer and contact and drafted a ${nt.channel} reminder for your approval.` : "",
    detail: "Customer identified, contact details found, previous channel identified. Nothing is sent until you approve it.",
    fields: [{ k: "Provider", v: "inspections.notices" }, { k: "Vehicle", v: nreg?.reg ?? "" }, { k: "Customer", v: nreg ? cname(nreg.customerId) : "" }, { k: "Due", v: nt ? longDate(nt.due) : "" }],
  };

  out.gaps = {
    hidden: d.gaps.length === 0,
    title: d.gaps.length === 1 ? "One technician present but unallocated" : `${nTimes(d.gaps.length, "technician", "technicians")} present but unallocated`,
    why: d.gaps.map(g => `${pname(g.id)} since ${g.since} (${dur(g.gapMin ?? 0)})`).join(" · ") + ". None is on an approved break.",
    fields: d.gaps.map(g => ({ k: pname(g.id), v: `idle ${dur(g.gapMin ?? 0)}` })).concat([{ k: "Source", v: "Keyloop clocking" }]),
  };

  const billy = s.jobs.find(j => j.id === "JOB-1042");
  if (billy) {
    const bPct = (elapsed(billy, s.clock) / billy.budgetMin) * 100;
    const bv = identityOf(s, billy.vehicle);
    const pb = billy.partBlocker && !billy.partBlocker.received ? billy.partBlocker : null;
    out.billy = {
      hidden: bPct < s.rules.warn || billy.status !== "in_progress",
      title: `${first(pname(billy.tech))}'s ${billy.id} at ${elapsed(billy, s.clock)} of ${billy.budgetMin} minutes`,
      why: `${bv.reg} (${cname(billy.customer)}) is at ${bPct.toFixed(1)}% of its time budget${pb ? ` and the ${partShort(pb.part).toUpperCase() === pb.part ? pb.part : partShort(pb.part)} is still on order (${pb.po}, ETA ${pb.eta})` : ""}. Warning fires at ${s.rules.warn}%.`,
      fields: [{ k: "Provider", v: "workshop.watchdog" }, { k: "Job", v: billy.id }, { k: "Consumed", v: `${elapsed(billy, s.clock)} / ${billy.budgetMin} min` }, { k: "Part", v: pb ? `${partShort(pb.part)} · ${pb.po}` : "none" }],
    };
  }

  const firstBlocked = d.blocked[0];
  out.writeups = {
    hidden: d.blocked.length === 0,
    title: `${d.blocked.length} completed job${d.blocked.length === 1 ? "" : "s"} await write-up review`,
    why: `${eur(d.blockedNet)} net is waiting on technician confirmation and service approval. ${eur(d.readyNet)} across ${d.ready.length} jobs is already ready to invoice.`,
    detail: `${firstBlocked ? `${firstBlocked.id} (${eur(firstBlocked.net ?? 0)}) is the one to start on. ` : ""}Unconfirmed items are shown as questions, not customer narrative.`,
    fields: [{ k: "Provider", v: "workshop.jobcards" }, { k: "Blocked", v: `${eur(d.blockedNet)} · ${nTimes(d.blocked.length, "job", "jobs")}` }, { k: "Ready", v: `${eur(d.readyNet)} · ${nTimes(d.ready.length, "job", "jobs")}` }],
  };

  const q = s.quotes.find(x => x.id === "Q-1042");
  const qm = s.quoteMeta["Q-1042"];
  out.discount = { hidden: !q || (!!qm?.discountApproval && qm.discountApproval.version === qm.version) || q.discount <= 250 };

  const passed = d.cvrt.done.filter(t => t.result === "pass");
  const retest = d.cvrt.retest[0];
  const names = passed.map(t => cname(t.customer));
  out.cvrtok = {
    title: `${cap(word(passed.length))} CVRT test${passed.length === 1 ? "" : "s"} passed this morning`,
    why: names.length ? `${names.join(" and ")} ${names.length === 1 ? "vehicle" : "vehicles"} passed first time.` : "No results recorded yet.",
    detail: `Results were recorded and reviewed by the CVRT team. ${nTimes(d.cvrt.scheduled.length, "booking remains", "bookings remain")} today${retest ? `, including the ${cname(retest.customer)} retest at ${retest.time}` : ""}. Snapshot ${hhmm(s.clock)}.`,
    fields: [{ k: "Provider", v: "cvrt.results" }, { k: "Passed", v: passed.map(t => t.id).join(", ") }, { k: "Remaining", v: `${d.cvrt.scheduled.length} bookings` }],
  };
  return out;
}

export function tabCount(page: string, sec: string): string {
  const s = getState();
  const d = derive(s);
  const n = (x: number) => (x ? String(x) : "");
  if (page === "Work" && sec === "approvals") return n(approvals(s, d).length);
  if (page === "Work" && sec === "tasks") return n(s.tasks.filter(t => t.status === "open").length);
  if (page === "Workshop" && sec === "live") return n(d.gaps.length + d.budgetFlags.length);
  if (page === "Workshop" && sec === "jobcards") return n(d.blocked.length);
  if (page === "Workshop" && sec === "planner") return n(d.hopper.length);
  if (page === "Workshop" && sec === "parts") return n(partsOverview(s).open.length);
  if (page === "Yard" && sec === "live") return n(yardCounts(s).blockedN);
  if (page === "Yard" && sec === "anpr") return n(yardCounts(s).unknownN);
  if (page === "Comms" && sec === "inbox") return n(commsCounts(s).review + commsCounts(s).unmatched);
  if (page === "Inspections" && sec === "notices") return n(inspectionCounts(s).new);
  if (page === "Stock" && sec === "exceptions") return n(d.active.filter(v => v.reviewFlag).length + d.missingSpec.length);
  if (page === "CVRT" && sec === "repairs") return n(d.cvrt.repair.length + d.cvrt.retest.length);
  if (page === "Finance" && sec === "readiness") return n(d.blocked.length);
  if (page === "Sales" && sec === "handovers") return n(Object.keys(s.gates).filter(id => !handoverGates(s, id).ready).length);
  return "";
}

/** Live values for the Dashboard KPI band (keys match KPI_DEFS in data.js). */
export function kpiOverrides(): Record<string, { value: string; delta: string; hint?: string }> {
  const s = getState();
  const d = derive(s);
  const c = yardCounts(s);
  const w = workshopOverview(s);
  const p = partsOverview(s);
  return {
    yardOnSite: { value: String(c.onSite), delta: `${c.arrivedToday} arrived today`, hint: `${c.overnightN} overnight` },
    yardReady: { value: String(c.readyN), delta: "collection today", hint: "cleared to leave" },
    yardBlocked: { value: String(c.blockedN), delta: "need attention", hint: `${c.parts.length} parts · ${c.accounts.length} accounts · ${c.cvrt.length} CVRT` },
    waitingParts: { value: String(p.open.length), delta: "jobs", hint: `${p.lostHours.toFixed(1)} h capacity lost` },
    utilisation: { value: `${w.utilisation}%`, delta: `${w.activeTechs} active`, hint: "on a job right now" },
    invoiceReady: { value: eur(w.readyNet), delta: nTimes(w.readyToInvoice, "job", "jobs"), hint: "completed, not invoiced" },
    allocation: { value: (d.allocationRate * 100).toFixed(1) + "%", delta: "Friday", hint: "job ÷ (paid − breaks)" },
    unallocated: { value: d.fri.unallocated.toFixed(1) + " h", delta: eur(d.fri.unallocated * 80) + " equiv", hint: "Friday · investigate" },
    openJobs: { value: String(w.openJobs), delta: `${d.queued.length} queued`, hint: `${d.hopper.length} unassigned` },
    writeupBlocked: { value: eur(d.blockedNet), delta: nTimes(d.blocked.length, "job", "jobs"), hint: "needs confirmation" },
    activeStock: { value: String(d.active.length), delta: `${d.incoming.length} incoming`, hint: `${d.onSite.length} on site` },
    overdue: { value: eur(d.overdueTotal), delta: nTimes(d.overdue.length, "invoice", "invoices"), hint: `of ${eur(d.receivables)} outstanding` },
    cvrt: { value: String(s.cvrt.length), delta: `${d.cvrt.repair.length} awaiting repair`, hint: "bookings" },
  };
}

/* ── Home: subline, pill, rail, activity ─────────────────────────────── */
export function homeSubline(): string {
  const c = yardCounts(getState());
  return `${c.onSite} vehicles on site, ${c.blockedN} need attention, ${c.readyN} ready to leave. Ask about any vehicle, job or part.`;
}

type Tone = "ok" | "warn" | "bad" | "acc" | undefined;
export interface RailRow { title: string; sub: string; tag: string; tone: Tone; open: () => void }
export interface RailTile { label: string; value: string; tone: Tone; open: () => void }
export interface RailData {
  yard: { tiles: RailTile[]; blockers: RailRow[]; open: () => void };
  parts: { summary: string; rows: RailRow[]; open: () => void };
  inspect: { summary: string; rows: RailRow[]; open: () => void };
  brief: { lines: { k: string; v: string }[]; open: () => void };
}

export function railData(): RailData {
  const s = getState();
  const c = yardCounts(s);
  const d = derive(s);
  const w = workshopOverview(s);
  const p = partsOverview(s);
  const ic = inspectionCounts(s);
  const openYard = () => go("Yard", "live");

  const blockers = attentionList(s).slice(0, 4).map((v): RailRow => {
    const line = attentionLine(v);
    return { title: `${v.reg} · ${v.customer}`, sub: line.sub, tag: line.head, tone: STATUS[v.status].tone, open: () => openVehicle(v.key) };
  });

  const jobsByEta = [...p.open].sort((a, b) => etaSort(a.partBlocker?.eta ?? "") - etaSort(b.partBlocker?.eta ?? ""));
  const today = jobsByEta.filter(j => (j.partBlocker?.eta ?? "").startsWith("Today"));
  const shown = (today.length ? today : jobsByEta).slice(0, 4);
  const partRows = shown.map((j): RailRow => {
    const pb = j.partBlocker!;
    return { title: `${identityOf(s, j.vehicle).reg} · ${partShort(pb.part)}`, sub: `${pb.po} · ${pb.supplier} · ${pname(pb.owner)}`, tag: pb.eta.replace(/^Today /, "Today "), tone: pb.stalled ? "warn" : undefined, open: () => openVehicle(j.vehicle) };
  });

  const awaiting = NOTICES.map(n => ({ n, st: noticeState(s, n) })).filter(x => x.st.stage === "awaiting").sort((a, b) => a.n.due.localeCompare(b.n.due));
  const inspRows = awaiting.slice(0, 4).map(({ n }): RailRow => {
    const id = identityOf(s, n.vehicle);
    const days = noticeDays(n);
    return { title: `${id.reg} · ${cname(id.customerId)}`, sub: `${n.kind} due ${longDate(n.due)}`, tag: days < 0 ? "OVERDUE" : days === 0 ? "TODAY" : `${days}d`, tone: days < 0 ? "bad" : days <= 6 ? "warn" : undefined, open: () => { A.focus("vehicle", n.vehicle); go("Inspections", "notices"); } };
  });

  const topBlock = attentionList(s)[0];
  return {
    yard: {
      tiles: [
        { label: "On site", value: String(c.onSite), tone: undefined, open: openYard },
        { label: "Attention", value: String(c.blockedN), tone: c.blockedN ? "bad" : "ok", open: openYard },
        { label: "Ready", value: String(c.readyN), tone: "ok", open: openYard },
        { label: "Overnight", value: String(c.overnightN), tone: undefined, open: () => go("Yard", "overnight") },
      ],
      blockers, open: openYard,
    },
    parts: { summary: `${nTimes(p.open.length, "job", "jobs")} waiting for parts, ${today.length} due today. ${p.lostHours.toFixed(1)} h of capacity lost.`, rows: partRows, open: () => go("Workshop", "parts") },
    inspect: { summary: `${nTimes(ic.awaiting, "notice", "notices")} awaiting a reply${ic.overdue ? `, ${ic.overdue} overdue` : ""}. ${ic.new} new from Renault.`, rows: inspRows, open: () => go("Inspections", "notices") },
    brief: {
      lines: [
        { k: "Friday", v: `${YESTERDAY.jobsCompleted} jobs completed · ${YESTERDAY.arrived} arrived · ${YESTERDAY.departed} departed` },
        { k: "Today", v: `${w.openJobs} open jobs · ${w.waitingParts} waiting parts · ${c.atRisk.length} promised today at risk` },
        { k: "Workshop", v: `${w.utilisation}% utilisation · ${nTimes(d.gaps.length, "technician", "technicians")} unallocated · ${eur(w.readyNet)} ready to invoice` },
        { k: "Priority", v: topBlock ? `${topBlock.reg} (${topBlock.customer}): ${attentionLine(topBlock).head.toLowerCase()}` : "Nothing blocked" },
      ],
      open: () => go("Dashboard", "brief"),
    },
  };
}
const etaSort = (eta: string): number => {
  const m = /(\d{1,2}):(\d{2})$/.exec(eta);
  const t = m ? +m[1] * 60 + +m[2] : 0;
  const dayRank = eta.startsWith("Today") ? 0 : /^(Mon|Tue|Wed|Thu|Fri|Sat|Sun)/.test(eta) ? (parseInt(/(\d{1,2}) [A-Z][a-z]{2}/.exec(eta)?.[1] ?? "99", 10) - 19) : 50;
  return dayRank * 1440 + t;
};

export interface FeedRow { who: string; what: string; event: string; when: string; tone: "ok" | "warn" | "bad" | "neutral" }
/** The Home "Activity" widget: yard-flavoured, from the same records. */
export function homeActivity(): FeedRow[] {
  const s = getState();
  const c = yardCounts(s);
  const billy = s.jobs.find(j => j.id === "JOB-1042");
  const bv = billy ? identityOf(s, billy.vehicle) : null;
  const hold = c.accounts[0];
  const v8 = vehicleByKey(s, "V008");
  const anpr = ANPR_EVENTS.find(e => e.id === "ANPR-0943");
  const anprV = anpr?.key ? identityOf(s, anpr.key) : null;
  const ecu = COMMS.find(m => m.id === "M-1043");
  const rows: FeedRow[] = [];
  if (billy && bv) rows.push({ who: "Operations Watchdog", what: `flagged ${billy.id} (${bv.reg}) at ${elapsed(billy, s.clock)}/${billy.budgetMin} minutes`, event: "workshop.budget.warn", when: "5m", tone: "warn" });
  rows.push({ who: "Gate 1 camera", what: `could not match a plate: ${ANPR_EVENTS[0].read} read at ${ANPR_EVENTS[0].confidence}%`, event: "yard.anpr.unmatched", when: "9m", tone: "bad" });
  if (anpr && anprV) rows.push({ who: "ANPR", what: `matched ${anprV.reg} to ${cname(anprV.customerId)} and ${anpr.booking?.job ?? "its booking"}`, event: "yard.anpr.matched", when: "17m", tone: "ok" });
  if (ecu) rows.push({ who: "Communication Triage", what: `attached ${first(ecu.from)}'s WhatsApp to ${identityOf(s, ecu.vehicle ?? "").reg} and ${ecu.job ?? "the job"}`, event: "comms.matched", when: "17m", tone: "ok" });
  if (hold) rows.push({ who: "Yard Monitor", what: `held ${hold.reg}: ${eur(hold.balance)} outstanding`, event: "finance.hold", when: "1h", tone: "bad" });
  if (v8) rows.push({ who: "Handover Coordinator", what: `held ${v8.reg} release, gates still open`, event: "handover.blocked", when: "40m", tone: "bad" });
  rows.push({ who: "Keyloop", what: `synced ${KEYLOOP.recordsToday.toLocaleString("en-IE")} records today`, event: "keyloop.sync", when: `${KEYLOOP.lastSyncMinsAgo}m`, tone: "neutral" });
  return rows.slice(0, 6);
}

/** "My work" tasks on Home, from the store so Work and Home agree. */
export function homeTasks(): { id: string; title: string; due: string; who: string; queue: string[]; subject: string; priority: string; late?: boolean }[] {
  const s = getState();
  return s.tasks.filter(t => t.status === "open").map(t => {
    const mine = t.owner === "p-anthony" || t.priority === "High";
    const initials = pname(t.owner).split(" ").map(x => x.charAt(0)).join("").slice(0, 2).toUpperCase();
    return { id: t.id, title: t.title, due: t.due, who: initials, queue: mine ? ["mine", "team"] : ["team"], subject: t.record, priority: t.priority === "High" ? "high" : "normal", late: false };
  });
}

/** CVRT widget rows on Home. */
export function cvrtWidget(): { title: string; when: string; tone: "ok" | "warn" | "bad" }[] {
  const s = getState();
  return [...s.cvrt].sort((a, b) => a.time.localeCompare(b.time)).slice(0, 4).map(t => {
    const id = identityOf(s, t.vehicle);
    const res = t.result === "pass" ? "passed" : t.status === "scheduled" ? "booked" : t.status === "awaiting_retest" ? "retest" : "failed";
    return { title: `CVRT · ${id.reg} · ${cname(t.customer)}`, when: `${t.time} · ${res}`, tone: t.result === "pass" ? "ok" : t.status === "scheduled" ? "ok" : "warn" };
  });
}

/* ── search: registrations, customers, jobs ──────────────────────────── */
export interface VehicleHit { key: string; title: string; meta: string; hint: string }
export function searchVehicleHits(q: string, limit = 6): VehicleHit[] {
  const s = getState();
  const n = normReg(q);
  if (!n) return [];
  const on = searchVehicles(s, q).sort((a, b) => {
    const ea = normReg(a.reg) === n ? 0 : 1, eb = normReg(b.reg) === n ? 0 : 1;
    return ea - eb || STATUS[a.status].order - STATUS[b.status].order || a.reg.localeCompare(b.reg);
  });
  const hits: VehicleHit[] = on.map(v => ({
    key: v.key, title: v.reg,
    meta: `${v.model} · ${v.customer}${v.jobId ? ` · ${v.jobId}` : ""} · ${STATUS[v.status].label}`,
    hint: STATUS[v.status].short.toUpperCase(),
  }));
  const onKeys = new Set(on.map(v => v.key));
  const t = q.trim().toLowerCase();
  SERVICE_VEHICLES.filter(sv => !onKeys.has(sv.id) && sv.customer && (normReg(sv.reg).includes(n) || cname(sv.customer).toLowerCase().includes(t)) && !yardVehicles(s).some(y => y.key === sv.id))
    .forEach(sv => hits.push({ key: sv.id, title: sv.reg, meta: `${sv.model} · ${cname(sv.customer)} · not on site`, hint: "OFF SITE" }));
  return hits.slice(0, limit);
}

/* ── assistant ───────────────────────────────────────────────────────── */
type ChatAction = [string, 0 | 1, string[]?];
export interface LiveAnswer { tool: string; effect: "read" | "write"; text: string; cols?: string[]; rows?: string[][]; actions: ChatAction[] }

const updatedLine = (s: State, v: YardVehicle): string => {
  const cu = s.yard.customerUpdates[v.key];
  if (cu) return `${v.customer} was updated just now by Anthony (WhatsApp).`;
  const t = v.row.customerUpdated;
  if (!t) return `${v.customer} has not been updated yet.`;
  const [when] = t.split(" · ");
  return `${v.customer === "Unmatched" ? "The customer" : "The customer"} was updated ${whenWords(when)}.`;
};
const financeLine = (v: YardVehicle): string =>
  v.accounts === "hold" ? `Accounts has a hold: ${eur(v.balance)} is outstanding, so the vehicle cannot be released until accounts approve.`
    : v.accounts === "review" ? "Accounts clearance is still to be recorded before handover." : "There are no finance holds.";
const blockWord = (v: YardVehicle): string => {
  switch (v.status) {
    case "waiting_parts": return v.part ? `${partShort(v.part.part)} due ${soft(v.part.eta)}` : "waiting for a part";
    case "accounts_hold": return `${eur(v.balance)} on accounts hold`;
    case "cvrt_issue": return "failed CVRT, retest and accounts clearance open";
    case "waiting_approval": return "customer approval outstanding";
    case "unknown": return "not matched to a customer or job";
    default: return v.blocker ? lc1(v.blocker).replace(/\.$/, "") : "on track";
  }
};
const ownerOf = (v: YardVehicle): string => {
  if (v.part) return pname(v.part.owner);
  if (v.status === "accounts_hold") return pname("p-caroline");
  if (v.status === "cvrt_issue") return pname("p-elizabeth");
  if (v.status === "waiting_approval") return "Service desk";
  if (v.status === "unknown") return "Unassigned";
  return v.tech ? pname(v.tech) : "Unassigned";
};
const etaOf = (v: YardVehicle) => v.part?.eta ?? (v.promised ? fmtWhen(v.promised) : "Not set");
const vehicleRow = (v: YardVehicle): string[] => [`${v.reg} · ${v.customer}`, STATUS[v.status].short, blockWord(v), etaOf(v)];
const VEH_COLS = ["Vehicle", "Status", "Blocker", "ETA"];
const openAction = (v: YardVehicle): ChatAction => [`Open ${v.reg}`, 1, ["Vehicle", "view", "vehicle", v.key]];

function sources(v: YardVehicle): string {
  const parts = ["Keyloop"];
  if (v.row.last.channel === "WhatsApp" || v.row.customerUpdated?.includes("WhatsApp")) parts.push("WhatsApp");
  if (v.row.last.channel === "Email" || v.row.customerUpdated?.includes("Email")) parts.push("email");
  if (v.status === "unknown" || v.row.last.channel === "ANPR") parts.push("ANPR");
  if (v.part) parts.push("parts");
  if (v.status === "accounts_hold") parts.push("finance");
  if (v.status === "cvrt_issue") parts.push("CVRT");
  return parts.join(" + ");
}

function storyText(s: State, v: YardVehicle): string {
  const j = v.job;
  const techFirst = v.tech ? first(pname(v.tech)) : null;
  const bits: string[] = [];
  switch (v.status) {
    case "waiting_parts": {
      const p = v.part;
      if (p) {
        bits.push(`${v.reg} is waiting on ${an(partShort(p.part))}.`);
        bits.push(`${first(pname(p.owner))} ordered it ${p.orderedAt ? whenWords(p.orderedAt) : "this morning"} (${p.po}).`);
        bits.push(`Supplier ETA is ${etaWords(p.eta)}.`);
        if (v.row.done.some(x => /without the part/i.test(x)) && techFirst) bits.push(`${techFirst} has completed all work possible without the part.`);
        else if (!techFirst) bits.push("No technician is assigned yet and the job cannot be scheduled until it arrives.");
        else bits.push(p.stalled ? `Work cannot continue until it arrives (${techFirst} is assigned).` : `${p.impact ?? "Other work can continue"}.`);
      } else bits.push(`${v.reg} is waiting on a part.`);
      bits.push(updatedLine(s, v));
      bits.push(financeLine(v));
      if (v.promised) bits.push(`Assuming the part arrives on time, estimated collection is ${fmtWhen(v.promised, true)}.`);
      break;
    }
    case "accounts_hold": {
      bits.push(`${v.reg} (${v.customer}) is on accounts hold.`);
      bits.push(`${eur(v.balance)} is outstanding, so it cannot be released until accounts approve.`);
      if (j) bits.push(`${j.id} is finished${j.invoice === "ready" ? " and ready to invoice in Keyloop" : ""}.`);
      const c = commsFor(s, v.key).sort((a, b) => (a.day + a.at < b.day + b.at ? 1 : -1))[0];
      const claim = c?.extracted?.find(e => e.field === "Claim")?.value;
      if (c) bits.push(`Latest message: ${first(c.from)} by ${c.channel.toLowerCase()} at ${c.at}${claim ? `. ${claim}` : ""}.`);
      bits.push(updatedLine(s, v));
      if (v.promised) bits.push(`Collection is expected ${fmtWhen(v.promised, true).toLowerCase()} once accounts clear it.`);
      break;
    }
    case "cvrt_issue": {
      const h = handoverGates(s, v.key);
      const open = h.list.filter(g => !g.ok);
      bits.push(`${v.reg} (${v.key}) is the used van reserved for ${v.customer}, and it cannot be released yet.`);
      if (h.test) bits.push(`CVRT ${h.test.id} ${h.test.result === "pass" ? "passed" : "failed on a rear brake imbalance"}.`);
      const p = v.part ?? h.job?.partBlocker;
      if (p && !p.received) bits.push(`${first(pname(p.owner))} ordered ${an(partShort(p.part))} ${p.orderedAt ? whenWords(p.orderedAt) : ""} (${p.po}), due ${etaWords(p.eta)}.`.replace("  ", " "));
      bits.push(open.length ? `${cap(word(open.length))} release gate${open.length === 1 ? " is" : "s are"} open: ${open.map(g => gateWord(g.label)).join(", ")}. A repair finishing does not pass the test.` : "All release gates are clear.");
      bits.push(updatedLine(s, v));
      if (v.promised) bits.push(`Planned release is ${soft(fmtWhen(v.promised, true))}, if the repair is done and the retest passes.`);
      break;
    }
    case "waiting_approval":
      bits.push(`${v.reg} is waiting for ${v.customer} to approve extra work.`);
      bits.push(v.blocker ?? "");
      bits.push(updatedLine(s, v));
      bits.push(financeLine(v));
      if (v.promised) bits.push(`Once approved, estimated completion is ${fmtWhen(v.promised, true)}.`);
      break;
    case "unknown":
      bits.push(`${v.reg} is not matched to a customer or job.`);
      bits.push(v.blocker ?? "");
      bits.push(v.key === "U001" ? "The closest known vehicle is 192-D-3411 (Murphy Transport). A person needs to confirm the match." : "Nobody has claimed it yet.");
      break;
    case "ready":
      bits.push(`${v.reg} (${v.customer}) is ready to leave from ${v.location}.`);
      bits.push(`${v.row.done.slice(0, 2).join(". ")}.`);
      bits.push(updatedLine(s, v));
      bits.push(financeLine(v));
      if (v.promised) bits.push(`Collection is ${fmtWhen(v.promised, true).toLowerCase()}.`);
      break;
    default: {
      bits.push(`${v.reg} (${v.customer}) is in the workshop at ${v.location} for ${v.row.reason}.`);
      if (j && techFirst) bits.push(`${techFirst} is on ${j.id}${j.status === "in_progress" ? ` (${elapsed(j, s.clock)} of ${j.budgetMin} minutes)` : ""}.`);
      else if (v.past) bits.push(`${v.past.id} is booked for ${first(pname(v.past.tech))}.`);
      if (v.blocker) bits.push(`${v.blocker.replace(/\.$/, "")}.`);
      bits.push(updatedLine(s, v));
      bits.push(financeLine(v));
      if (v.promised) bits.push(`Due out ${fmtWhen(v.promised, true).toLowerCase()}.`);
    }
  }
  return bits.filter(Boolean).join(" ");
}

function storyRows(s: State, v: YardVehicle): string[][] {
  if (v.status === "cvrt_issue") {
    return handoverGates(s, v.key).list.map(g => [g.label, pname(g.owner), g.ok ? "clear" : g.detail]);
  }
  const rows: string[][] = [];
  const j = v.job;
  rows.push(["Keyloop job", `${v.jobId ?? "None"}${j ? ` · ${lc1(j.complaint)}` : ""}`, v.tech ? pname(v.tech) : "Unassigned", j ? j.status.replace(/_/g, " ") : v.status === "ready" ? "complete" : "none"]);
  if (v.part) rows.push(["Part", `${partShort(v.part.part)} · ${v.part.po} · ${v.part.supplier}`, pname(v.part.owner), v.part.eta]);
  rows.push(["Customer", v.customer, v.row.customerUpdated?.match(/\((.+)\)/)?.[1] ?? "—", v.row.customerUpdated?.split(" · ")[0] ?? "not updated"]);
  rows.push(["Accounts", v.accounts === "hold" ? `${eur(v.balance)} outstanding` : v.accounts === "review" ? "Clearance outstanding" : "No holds", pname("p-caroline"), v.accounts === "clear" ? "clear" : v.accounts]);
  if (v.promised) rows.push(["Leaves", fmtWhen(v.promised, true), "—", STATUS[v.status].short]);
  return rows;
}

function storyActions(v: YardVehicle): ChatAction[] {
  const second: ChatAction =
    v.status === "waiting_parts" ? ["Open parts and blockers", 0, ["Workshop", "parts"]]
      : v.status === "accounts_hold" ? ["Open receivables", 0, ["Finance", "receivables"]]
        : v.status === "cvrt_issue" ? ["Open the repair handover", 0, ["CVRT", "repairs"]]
          : v.status === "unknown" ? ["Review at the gate", 0, ["Yard", "anpr", "focus", v.key]]
            : ["Open the yard", 0, ["Yard", "live"]];
  return [openAction(v), second];
}

function vehicleStory(s: State, v: YardVehicle, siblings: YardVehicle[] = [], intro = ""): LiveAnswer {
  const head = siblings.length > 1 ? `${intro}${cap(storyText(s, v))}` : cap(storyText(s, v));
  if (siblings.length > 1) {
    return {
      tool: `vehicle_story · ${sources(v)}`, effect: "read", text: head,
      cols: VEH_COLS, rows: siblings.map(vehicleRow), actions: storyActions(v),
    };
  }
  return { tool: `vehicle_story · ${sources(v)}`, effect: "read", text: head, cols: ["Area", "Detail", "Owner", "State"], rows: storyRows(s, v), actions: storyActions(v) };
}

function offSiteStory(s: State, key: string): LiveAnswer {
  const id = identityOf(s, key);
  const n = NOTICES.find(x => x.vehicle === key);
  const stock = s.stock.find(x => x.id === key);
  if (n) {
    const st = noticeState(s, n);
    const stage = st.stage === "new" ? "Pulse has found the customer and drafted a reminder; it needs your approval before it is sent."
      : st.stage === "awaiting" ? `The customer was contacted${n.contactedAt ? ` ${fmtWhen(n.contactedAt)}` : ""} and has not replied.`
        : st.stage === "booked" ? `It is booked in for ${st.bookedFor ? fmtWhen(st.bookedFor) : "a slot"}.` : "The customer has been contacted.";
    return {
      tool: "vehicle_story · Keyloop + Renault + WhatsApp", effect: "read",
      text: `${id.reg} (${cname(id.customerId)}) is not on site. Renault sent a ${n.kind.toLowerCase()} notice due ${longDate(n.due)}. ${stage} No parts or finance holds are open.`,
      cols: ["Area", "Detail", "Owner", "State"],
      rows: [["Renault notice", `${n.kind} · due ${longDate(n.due)}`, "Renault Trucks Ireland", st.stage], ["Customer", cname(id.customerId), "Service desk", n.channel]],
      actions: [["Open Inspections", 1, ["Inspections", "notices", "focus", key]]],
    };
  }
  if (stock) {
    return {
      tool: "vehicle_story · Keyloop + stock", effect: "read",
      text: `${id.reg} (${stock.id}) is dealer stock: ${id.model}, status ${stock.status}${stock.customer ? `, promised to ${cname(stock.customer)}` : ""}. It is not in the service yard.`,
      cols: ["Area", "Detail", "Owner", "State"], rows: [["Stock", `${id.model} · ${stock.location}`, "Sales", stock.status], ["Spec", stock.specStatus, "Sales", stock.specStatus]],
      actions: [["Open vehicle stock", 1, ["Stock", "instock"]]],
    };
  }
  return { tool: "vehicle_story · Keyloop", effect: "read", text: `${id.reg} (${cname(id.customerId)}) is not on site and has no open job.`, actions: [["Open the yard", 1, ["Yard", "live"]]] };
}

function waitingPartsAnswer(s: State): LiveAnswer {
  const p = partsOverview(s);
  const c = yardCounts(s);
  const jobs = [...p.open].sort((a, b) => etaSort(a.partBlocker?.eta ?? "") - etaSort(b.partBlocker?.eta ?? ""));
  const rest = p.open.length - c.parts.length;
  return {
    tool: "parts_blockers · Keyloop + WhatsApp + suppliers", effect: "read",
    text: `${cap(word(p.open.length))} jobs are currently waiting for parts. ${cap(word(c.parts.length))} vehicles in the yard cannot progress until their part arrives (${c.parts.map(v => v.reg).join(", ")}); the other ${word(rest)} can carry on with other work or are held by another gate. Estimated lost workshop capacity today: ${p.lostHours.toFixed(1)} hours. Darren owns the orders; the next arrival is ${jobs[0] ? `${an(partShort(jobs[0].partBlocker!.part))} for ${identityOf(s, jobs[0].vehicle).reg}, due ${etaWords(jobs[0].partBlocker!.eta)}` : "none"}.`,
    cols: ["Vehicle", "Part", "PO / supplier", "ETA"],
    rows: jobs.map(j => [`${identityOf(s, j.vehicle).reg} · ${cname(j.customer)}`, cap(partShort(j.partBlocker!.part)), `${j.partBlocker!.po} · ${j.partBlocker!.supplier}`, j.partBlocker!.eta]),
    actions: [["Open parts and blockers", 1, ["Workshop", "parts"]], ...(c.parts[0] ? [openAction(c.parts[0]).slice(0, 3) as ChatAction] : [])],
  };
}

function capacityAnswer(s: State): LiveAnswer {
  const d = derive(s);
  const w = workshopOverview(s);
  const yv = yardVehicles(s);
  const startable = d.hopper.filter(j => {
    const v = yv.find(x => x.jobId === j.id);
    return !(j.partBlocker && j.partBlocker.stalled) && v?.status !== "waiting_approval";
  });
  const stalledTech = s.jobs.filter(j => j.status === "in_progress" && j.partBlocker && !j.partBlocker.received && j.partBlocker.stalled && j.tech);
  const rows: string[][] = d.gaps.map(g => [pname(g.id), "Unallocated", `since ${g.since} (${dur(g.gapMin ?? 0)})`, g.next ? `${g.next.id} at ${g.next.plannedStart}` : "Hopper job"]);
  stalledTech.forEach(j => rows.push([pname(j.tech), "On a stalled job", `${j.id} at ${elapsed(j, s.clock)}/${j.budgetMin} min`, d.tn.find(t => t.id === j.tech)?.next ? `Next: ${d.tn.find(t => t.id === j.tech)!.next!.id} at ${d.tn.find(t => t.id === j.tech)!.next!.plannedStart}` : "No next job"]));
  const names = d.gaps.map(g => `${pname(g.id)} (${g.gapMin ?? 0} min since ${g.since})`);
  return {
    tool: "workshop_capacity · Keyloop clocking + attendance", effect: "read",
    text: `${cap(word(d.gaps.length))} technician${d.gaps.length === 1 ? " has" : "s have"} spare capacity right now: ${names.join(" and ") || "nobody"}. Utilisation is ${w.utilisation}% across ${w.activeTechs} active technicians. ${stalledTech.map(j => `${first(pname(j.tech))} has done all he can on ${j.id} until the ${partShort(j.partBlocker!.part)} arrives, so he moves on next.`).join(" ")} ${startable.length ? `Of the ${word(d.hopper.length)} unassigned jobs, ${startable.map(j => j.id).join(" and ")} can start now (${startable.map(j => lc1(j.complaint)).join("; ")}).` : "No unassigned job can start right now."}`.trim(),
    cols: ["Technician", "State", "Detail", "Next"], rows,
    actions: [["Open the live board", 1, ["Workshop", "live"]], ["Open the planner", 0, ["Workshop", "planner"]]],
  };
}

function tomorrowList(s: State): YardVehicle[] {
  const tom = addDays(TODAY_ISO, 1);
  return yardVehicles(s).filter(v => v.status !== "ready" && v.promised && dayOf(v.promised) === tom).sort((a, b) => (a.promised ?? "").localeCompare(b.promised ?? ""));
}
const isAtRisk = (v: YardVehicle) => BLOCKED.includes(v.status) || v.status === "waiting_approval" || v.status === "unknown";

function leaveTomorrowAnswer(s: State): LiveAnswer {
  const list = tomorrowList(s);
  const risk = list.filter(isAtRisk);
  const ok = list.filter(v => !isAtRisk(v));
  const tom = dayLabel(addDays(TODAY_ISO, 1));
  return {
    tool: "yard_forecast · Keyloop + parts + accounts", effect: "read",
    text: list.length ? `${cap(word(list.length))} vehicles are promised for tomorrow (${tom}). ${cap(word(ok.length))} look on track${ok.length ? ` (${ok.map(v => v.reg).join(", ")})` : ""}. ${cap(word(risk.length))} ${risk.length === 1 ? "is" : "are"} at risk: ${risk.map(v => `${v.reg} (${blockWord(v)})`).join("; ") || "none"}.` : `No vehicle is promised for ${tom}.`,
    cols: ["Vehicle", "Promised", "Status", "Blocker"],
    rows: list.map(v => [`${v.reg} · ${v.customer}`, fmtWhen(v.promised), STATUS[v.status].short, blockWord(v)]),
    actions: [["Open the yard", 1, ["Yard", "live"]], ["Open the overnight report", 0, ["Yard", "overnight"]]],
  };
}

function inspectionsAnswer(s: State): LiveAnswer {
  const ic = inspectionCounts(s);
  const rows = NOTICES.map(n => ({ n, st: noticeState(s, n) })).filter(x => x.st.stage === "awaiting").sort((a, b) => a.n.due.localeCompare(b.n.due));
  const customers = new Set(rows.map(r => identityOf(s, r.n.vehicle).customerId));
  const over = rows.filter(r => noticeDays(r.n) < 0);
  return {
    tool: "inspection_notices · Renault + WhatsApp + email", effect: "read",
    text: `${cap(word(ic.awaiting))} inspection notices are awaiting a customer reply, across ${word(customers.size)} customers. ${over.length ? `${cap(word(over.length))} ${over.length === 1 ? "is" : "are"} already overdue: ${over.map(r => `${identityOf(s, r.n.vehicle).reg} (${cname(identityOf(s, r.n.vehicle).customerId)}, due ${longDate(r.n.due)})`).join(", ")}. ` : ""}${cap(word(ic.new))} new Renault notices need a reminder approved. Pulse has drafted the follow-ups, and nothing is sent without your approval.`,
    cols: ["Customer", "Vehicle", "Due", "Last contact"],
    rows: rows.map(({ n }) => { const id = identityOf(s, n.vehicle); return [cname(id.customerId), id.reg, longDate(n.due), n.contactedAt ? `${n.channel}, ${fmtWhen(n.contactedAt)}` : n.channel]; }),
    actions: [["Open Inspections", 1, ["Inspections", "notices"]], ["Open Sent and Replies", 0, ["Inspections", "replies"]]],
  };
}

function accountsHoldAnswer(s: State): LiveAnswer {
  const c = yardCounts(s);
  const list = c.accounts;
  const total = list.reduce((t, v) => t + v.balance, 0);
  const detail = list.map(v => {
    const cm = commsFor(s, v.key).find(x => x.extracted?.some(e => e.field === "Claim"));
    const claim = cm?.extracted?.find(e => e.field === "Claim")?.value;
    return `${v.reg} (${v.customer}, ${eur(v.balance)})${cm ? `: ${first(cm.from)} wrote at ${cm.at}, ${lc1(claim ?? "asking for release")}` : ""}`;
  });
  const review = yardVehicles(s).filter(v => v.accounts === "review" && v.status !== "accounts_hold");
  return {
    tool: "accounts_holds · Keyloop + email", effect: "read",
    text: list.length ? `${cap(word(list.length))} vehicles are on accounts hold, ${eur(total)} outstanding between them. ${detail.join(". ")}.${review.length ? ` ${review.map(v => v.reg).join(", ")} also needs accounts clearance before handover but is not on a debt hold.` : ""} Caroline Glynn approves any release.` : "No vehicle is on accounts hold.",
    cols: ["Vehicle", "Customer", "Balance", "Promised"],
    rows: list.map(v => [v.reg, v.customer, eur(v.balance), v.promised ? fmtWhen(v.promised) : "Not set"]),
    actions: [["Open receivables", 1, ["Finance", "receivables"]], ...(list[0] ? [openAction(list[0])] : [])],
  };
}

function stoppingAnswer(s: State): LiveAnswer {
  const c = yardCounts(s);
  const list = attentionList(s);
  return {
    tool: "yard_blockers · Keyloop + parts + accounts + CVRT", effect: "read",
    text: `${cap(word(c.blockedN))} of ${c.onSite} vehicles are blocked: ${c.parts.length} waiting for parts, ${c.accounts.length} on accounts hold and ${c.cvrt.length} with a failed CVRT. ${cap(word(c.approval.length))} more are waiting for the customer to approve extra work and ${word(c.unknownN)} are unidentified. Parts are the biggest single constraint. ${cap(word(c.readyN))} vehicles are ready to leave now.`,
    cols: ["Vehicle", "Blocker", "Owner", "Clears"],
    rows: list.map(v => [`${v.reg} · ${v.customer}`, attentionLine(v).head, ownerOf(v), etaOf(v)]),
    actions: [["Open the yard", 1, ["Yard", "live"]], ["Open parts and blockers", 0, ["Workshop", "parts"]]],
  };
}

function risksAnswer(s: State): LiveAnswer {
  const tom = addDays(TODAY_ISO, 1);
  const midday = `${tom}T12:00`;
  const early = tomorrowList(s).filter(v => (v.promised ?? "") <= midday);
  const riskEarly = early.filter(isAtRisk);
  const p = partsOverview(s);
  const tomLabel = dayLabel(tom);
  const partsTom = p.open.filter(j => (j.partBlocker?.eta ?? "").startsWith(tomLabel));
  const approval = yardCounts(s).approval;
  const rows: string[][] = riskEarly.map(v => ["Promised by midday, blocked", `${v.reg} · ${v.customer}`, blockWord(v), ownerOf(v)]);
  partsTom.forEach(j => { if (!riskEarly.some(v => v.jobId === j.id)) rows.push(["Part due tomorrow", `${identityOf(s, j.vehicle).reg} · ${cname(j.customer)}`, `${partShort(j.partBlocker!.part)} ${j.partBlocker!.eta}`, pname(j.partBlocker!.owner)]); });
  approval.forEach(v => rows.push(["Waiting for the customer", `${v.reg} · ${v.customer}`, blockWord(v), ownerOf(v)]));
  const un = yardCounts(s).unknown;
  un.forEach(v => rows.push(["Unidentified vehicle", v.reg, blockWord(v), ownerOf(v)]));
  const d = derive(s);
  return {
    tool: "risk_forecast · Keyloop + parts + workshop planner", effect: "read",
    text: `${cap(word(early.length))} vehicles are promised before midday tomorrow and ${word(riskEarly.length)} of them ${riskEarly.length === 1 ? "is" : "are"} still blocked${riskEarly.length ? ` (${riskEarly.map(v => v.reg).join(", ")})` : ""}. ${cap(word(partsTom.length))} part${partsTom.length === 1 ? " is" : "s are"} due tomorrow morning, ${word(approval.length)} customers still need to approve extra work and ${word(un.length)} unidentified vehicles have no owner. ${d.gaps.length ? `${cap(word(d.gaps.length))} technicians are unallocated today, so there is capacity to catch up if parts arrive on time.` : ""}`.trim(),
    cols: ["Risk", "Vehicle", "Detail", "Owner"], rows,
    actions: [["Open the overnight report", 1, ["Yard", "overnight"]], ["Open the planner", 0, ["Workshop", "planner"]]],
  };
}

function customerHit(s: State, q: string): YardVehicle[] {
  const t = q.toLowerCase();
  const co = COMPANIES.filter(c => c.kind === "customer" && t.includes(c.name.split(" ")[0].toLowerCase()) && c.name.split(" ")[0].length >= 4);
  if (!co.length) return [];
  return yardVehicles(s).filter(v => co.some(c => c.id === v.customerId));
}

function pickFocus(list: YardVehicle[]): YardVehicle {
  return [...list].sort((a, b) => STATUS[a.status].order - STATUS[b.status].order || a.reg.localeCompare(b.reg))[0];
}

function answerForVehicles(s: State, list: YardVehicle[], label: string): LiveAnswer {
  if (list.length === 1) return vehicleStory(s, list[0]);
  const sameCustomer = list.every(v => v.customerId === list[0].customerId);
  const top = pickFocus(list);
  const sorted = [...list].sort((a, b) => STATUS[a.status].order - STATUS[b.status].order);
  const intro = sameCustomer
    ? `${list[0].customer} has ${word(list.length)} vehicles on site and the table lists them all. The one to look at first: `
    : `${cap(word(list.length))} vehicles match “${label}”. The most urgent: `;
  const ans = vehicleStory(s, top, sorted, intro);
  return ans;
}

const REG_RE = /\b\d{2,3}\s?-?\s?[a-z]{1,2}\s?-?\s?\d{1,5}\b/i;

/** Deterministic answers built from live records. Returns null when the question is not about Reynolds data. */
export function liveAnswer(q: string): LiveAnswer | null {
  const s = getState();
  const t = q.toLowerCase().trim();
  if (!t) return null;

  // 1. A specific vehicle, job or registration in the question.
  if (!/quote|discount|westway/.test(t)) {
    const reg = REG_RE.exec(q);
    let key: string | null = reg ? findAnyVehicleKey(s, reg[0]) : null;
    const vkey = /\bv0\d{2}\b/i.exec(q);
    if (!key && vkey) key = vkey[0].toUpperCase();
    const jobId = /\bjob[- ]?\d{4}\b/i.exec(q);
    if (!key && jobId) { const hit = searchVehicles(s, jobId[0].replace(/\s/g, "-")); if (hit.length) key = hit[0].key; }
    if (!key && !/\s/.test(t) && normReg(t).length >= 4) key = findAnyVehicleKey(s, t);
    if (key) {
      const v = vehicleByKey(s, key);
      return v ? vehicleStory(s, v) : offSiteStory(s, key);
    }
  }

  // 2. The nine questions and their loose phrasings.
  if (/risk/.test(t) || (/tomorrow/.test(t) && /morning|workshop/.test(t))) return risksAnswer(s);
  if (/waiting (for )?part|awaiting part|need(ing)? part|parts? (blocker|delay|late)|which parts|vehicles.*parts/.test(t)) return waitingPartsAnswer(s);
  if (/spare capacity|capacity|free technician|available technician|technicians? .*(free|spare|idle)|who.*(free|idle|spare)/.test(t)) return capacityAnswer(s);
  if (/inspection|haven.?t replied|not replied|no reply|replies|notices?/.test(t)) return inspectionsAnswer(s);
  if (/accounts? hold|on hold|owe|owes|outstanding|debtor/.test(t)) return accountsHoldAnswer(s);
  if (/stopping|blocking|blocked|what.*stuck|can.?t leave|cannot leave|leaving the yard|blockers/.test(t)) return stoppingAnswer(s);
  if (/leave tomorrow|leaving tomorrow|go tomorrow|collect(ed)? tomorrow|tomorrow/.test(t)) return leaveTomorrowAnswer(s);

  // 3. Quote, meeting and clocking questions from the workshop and sales modules.
  if (/quote|v024|westway|discount/.test(t)) {
    const qq = s.quotes.find(x => x.id === "Q-1042");
    const v = s.stock.find(x => x.id === "V024");
    if (qq && v) {
      const net = qq.lines.reduce((a, l) => a + l.amount, 0) - qq.discount;
      const m = s.quoteMeta["Q-1042"];
      const discOk = qq.discount <= 250 || m?.discountApproval?.version === m?.version;
      return {
        tool: "quote_builder · Keyloop + stock", effect: "read",
        text: `V024 is an incoming Renault Master chassis cab due 20 October${v.specStatus === "approved" ? " with an approved specification" : " with no approved specification sheet yet"}. Q-1042 for Westway Electrical is ${eur(net)} net after a ${eur(qq.discount)} discount. ${discOk && v.specStatus === "approved" ? "Both gates are clear and it is ready for the customer." : `Still open: ${[!discOk && "discount approval (demo policy above €250)", v.specStatus !== "approved" && "specification"].filter(Boolean).join(" and ")}.`}`,
        cols: ["Line", "Amount"], rows: [...qq.lines.map(l => [l.label, eur(l.amount)]), ["Discount", "−" + eur(qq.discount)], ["Net quote", eur(net)]],
        actions: [["Open Q-1042", 1, ["Sales", "quote"]], ["Attach a sample spec to V024", 0, ["Stock", "specs"]]],
      };
    }
  }
  if (/meeting|presentation|brief|what changed|today/.test(t)) {
    const en = s.meeting.sections.filter(x => x.enabled);
    const c = yardCounts(s);
    return {
      tool: "morning_brief · Keyloop + yard + workshop", effect: "read",
      text: `${c.onSite} vehicles are on site and ${c.blockedN} need attention. The morning meeting reads the same records as the rest of Pulse: ${en.length} of ${s.meeting.sections.length} sections are enabled (${en.map(x => x.label).join(", ")}), and nothing is retyped.`,
      cols: ["Section", "State"], rows: s.meeting.sections.map(x => [x.label, x.enabled ? "enabled" : "hidden"]),
      actions: [["Open the morning brief", 1, ["Dashboard", "brief"]], ["Open the morning meeting", 0, ["Work", "meeting"]]],
    };
  }
  if (/losing|time|gap|unallocated|labour|clock|billy|budget/.test(t)) {
    const d = derive(s);
    const billy = s.jobs.find(j => j.id === "JOB-1042");
    const bv = billy ? identityOf(s, billy.vehicle) : null;
    return {
      tool: "workshop_clocking · Keyloop", effect: "read",
      text: `Friday had ${d.fri.unallocated.toFixed(1)} unallocated workshop hours, a ${eur(d.fri.unallocated * 80)} billing equivalent at the demo €80/hour rate, not confirmed lost revenue. ${d.gaps.length ? `Right now ${d.gaps.length} technician${d.gaps.length > 1 ? "s are" : " is"} present but unallocated (${d.gaps.map(g => `${first(pname(g.id))} since ${g.since}`).join(", ")}).` : "No live gaps right now."}${billy && bv ? ` ${first(pname(billy.tech))}'s ${billy.id} on ${bv.reg} has used ${elapsed(billy, s.clock)} of ${billy.budgetMin} minutes.` : ""}`,
      cols: ["Friday bucket", "Hours"], rows: [["Job-allocated", d.fri.job.toFixed(1)], ["Approved breaks", d.fri.breaks.toFixed(1)], ["Internal work", d.fri.internal.toFixed(1)], ...(d.fri.explained ? [["Reviewed, explained", d.fri.explained.toFixed(1)]] : []), ["Unallocated, review", d.fri.unallocated.toFixed(1)]],
      actions: [["Open Workshop clocking", 1, ["Workshop", "clocking"]], ["Open the live gaps", 0, ["Workshop", "live"]]],
    };
  }

  // 4. A customer, a short registration fragment or a bare name.
  const byCustomer = customerHit(s, q);
  if (byCustomer.length) return answerForVehicles(s, byCustomer, q.trim());
  if (t.split(/\s+/).length <= 3) {
    const found = searchVehicles(s, q);
    if (found.length) return answerForVehicles(s, found, q.trim());
  }
  return null;
}

/** Deep link support: #vehicle/181-g-4471 opens that vehicle's page. */
export function vehicleHash(): string {
  const s = getState();
  return identityOf(s, s.focus.vehicle ?? "C101").reg.toLowerCase();
}
export function focusVehicleFromHash(seg: string | undefined) {
  const key = seg ? findAnyVehicleKey(getState(), seg) : null;
  if (key) A.focus("vehicle", key);
}
