/* What PulseLogic (the generated shell) reads from the demo store: live inbox
   card text, tab counts and the demo clock. Keeps Home and the top bar in step
   with actions taken inside the modules. */
import { approvals, derive, dur, elapsed, eur, getState, handoverGates, hhmm, subscribe } from "./store";

export { subscribe, getState };

export function demoClock(): { h: number; m: number } {
  const c = getState().clock;
  return { h: Math.floor(c / 60), m: c % 60 };
}

/** Live overrides for the Home inbox cards (keys match ITEMS in data.js). */
export function inboxOverrides(): Record<string, { title?: string; why?: string; hidden?: boolean }> {
  const s = getState();
  const d = derive(s);
  const v8 = handoverGates(s, "V008");
  const billy = s.jobs.find(j => j.id === "JOB-1042")!;
  const bPct = (elapsed(billy, s.clock) / billy.budgetMin) * 100;
  const q = s.quotes.find(x => x.id === "Q-1042")!;
  const qm = s.quoteMeta["Q-1042"];
  return {
    v008: { hidden: v8.ready, why: `Open gates: ${v8.list.filter(g => !g.ok).map(g => g.label.toLowerCase()).join(", ") || "none"}.` },
    gaps: {
      hidden: d.gaps.length === 0,
      title: d.gaps.length === 1 ? "One technician present but unallocated" : `${d.gaps.length} technicians present but unallocated`,
      why: d.gaps.map(g => `${g.id === "t-sean" ? "Seán Doyle" : g.id === "t-rachel" ? "Rachel Byrne" : g.id} since ${g.since} (${dur(g.gapMin ?? 0)})`).join(" · ") + ". Neither is on an approved break.",
    },
    billy: { hidden: bPct < s.rules.warn || billy.status !== "in_progress", title: `Billy's JOB-1042 at ${elapsed(billy, s.clock)} of ${billy.budgetMin} minutes` },
    writeups: {
      hidden: d.blocked.length === 0,
      title: `${d.blocked.length} completed job${d.blocked.length === 1 ? "" : "s"} await write-up review`,
      why: `${eur(d.blockedNet)} net is waiting on technician confirmation and service approval. ${eur(d.readyNet)} across ${d.ready.length} jobs is already invoice-ready.`,
    },
    discount: { hidden: !!qm?.discountApproval && qm.discountApproval.version === qm.version || q.discount <= 250 },
    cvrtok: { why: `${d.cvrt.done.filter(t => t.result === "pass").length} passed so far today · ${d.cvrt.scheduled.length} still scheduled. Snapshot ${hhmm(s.clock)}.` },
  };
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
  return {
    allocation: { value: (d.allocationRate * 100).toFixed(1) + "%", delta: "Friday", hint: "job ÷ (paid − breaks)" },
    unallocated: { value: d.fri.unallocated.toFixed(1) + " h", delta: eur(d.fri.unallocated * 80) + " equiv", hint: "Friday · investigate" },
    openJobs: { value: String(d.open.length), delta: `${d.queued.length} queued`, hint: `${d.hopper.length} unassigned` },
    invoiceReady: { value: eur(d.readyNet), delta: `${d.ready.length} jobs`, hint: `of ${eur(d.completedNet)} completed` },
    writeupBlocked: { value: eur(d.blockedNet), delta: `${d.blocked.length} jobs`, hint: "needs confirmation" },
    activeStock: { value: String(d.active.length), delta: `${d.incoming.length} incoming`, hint: `${d.onSite.length} on site` },
    overdue: { value: eur(d.overdueTotal), delta: `${d.overdue.length} invoices`, hint: `of ${eur(d.receivables)} outstanding` },
    cvrt: { value: String(s.cvrt.length), delta: `${d.cvrt.repair.length} awaiting repair`, hint: "bookings" },
  };
}

/** Deterministic sample answers for the four demo prompts, built from live records. */
export function liveAnswer(q: string): null | { tool: string; effect: string; text: string; cols?: string[]; rows?: string[][]; actions: unknown[] } {
  const s = getState();
  const d = derive(s);
  const t = q.toLowerCase();
  if (/v008|handover|story with v/.test(t)) {
    const h = handoverGates(s, "V008");
    const open = h.list.filter(g => !g.ok);
    return { tool: "vehicle_timeline", effect: "read",
      text: `V008 is a reserved used Renault Master for Midlands Parcel Services. ${h.test?.status === "completed" && h.test.result === "pass" ? "Its CVRT retest has been recorded as a pass." : "Its CVRT failed on a rear brake imbalance, so repair JOB-1046 is open."} ${open.length ? `Handover is blocked by ${open.length} gate${open.length > 1 ? "s" : ""}: ${open.map(g => g.label.toLowerCase()).join(", ")}. A repair finishing never passes the test on its own.` : "All release gates are clear — the physical handover can be recorded."}`,
      cols: ["Gate", "Owner", "State"], rows: h.list.map(g => [g.label, g.owner === "p-darren" ? "Darren O'Brien" : g.owner === "p-jonathan" ? "Jonathan Keenan" : g.owner === "p-elizabeth" ? "Elizabeth Reynolds" : g.owner === "p-jack" ? "Jack Kelly" : "Caroline Glynn", g.ok ? "clear" : g.detail]),
      actions: [["Open V008 record", 1, ["Sales", "handovers", "vehicle", "V008"]], ["Open the repair handover", 0, ["CVRT", "repairs"]]] };
  }
  if (/quote|v024|westway|discount/.test(t)) {
    const qq = s.quotes.find(x => x.id === "Q-1042")!;
    const net = qq.lines.reduce((a, l) => a + l.amount, 0) - qq.discount;
    const v = s.stock.find(x => x.id === "V024")!;
    const m = s.quoteMeta["Q-1042"];
    const discOk = qq.discount <= 250 || m?.discountApproval?.version === m?.version;
    return { tool: "quote_builder", effect: "read",
      text: `V024 is an incoming Renault Master chassis cab due 20 October${v.specStatus === "approved" ? " with an approved specification" : " with no approved specification sheet yet"}. Q-1042 for Westway Electrical is ${eur(net)} net after a ${eur(qq.discount)} discount. ${discOk && v.specStatus === "approved" ? "Both gates are clear — it's ready for the customer." : `Still open: ${[!discOk && "discount approval (demo policy above €250)", v.specStatus !== "approved" && "specification"].filter(Boolean).join(" and ")}.`}`,
      cols: ["Line", "Amount"], rows: [...qq.lines.map(l => [l.label, eur(l.amount)]), ["Discount", "−" + eur(qq.discount)], ["Net quote", eur(net)]],
      actions: [["Open Q-1042", 1, ["Sales", "quote"]], ["Attach a sample spec to V024", 0, ["Stock", "specs"]]] };
  }
  if (/meeting|morning|presentation/.test(t)) {
    const en = s.meeting.sections.filter(x => x.enabled);
    const b = s.jobs.find(j => j.tech === "t-billy" && j.status === "queued" && j.plannedStart);
    return { tool: "morning_meeting", effect: "read",
      text: `Today's meeting reads the same records as the rest of Pulse. ${en.length} of 9 sections are enabled: ${en.map(x => x.label).join(", ")}. Billy's current Galway Haulage job and his next job${b ? ` (${b.id} at ${b.plannedStart})` : ""} come straight from the planner — nothing retyped. Today's absences and the breakdown rota are included; no debts, pay or absence reasons.`,
      cols: ["Section", "State"], rows: s.meeting.sections.map(x => [x.label, x.enabled ? "enabled" : "hidden"]),
      actions: [["Open the morning meeting", 1, ["Work", "meeting"]], ["Open the planner", 0, ["Workshop", "planner"]]] };
  }
  if (/workshop|losing|time|gap|unallocated|labour|clock|billy|budget/.test(t)) {
    const billy = s.jobs.find(j => j.id === "JOB-1042")!;
    return { tool: "workshop_clocking", effect: "read",
      text: `Friday had ${d.fri.unallocated.toFixed(1)} unallocated workshop hours — a ${eur(d.fri.unallocated * 80)} billing equivalent at the demo €80/hour rate, not confirmed lost revenue. ${d.gaps.length ? `Right now ${d.gaps.length} technician${d.gaps.length > 1 ? "s are" : " is"} present but unallocated (${d.gaps.map(g => `${g.id === "t-sean" ? "Seán" : "Rachel"} since ${g.since}`).join(", ")}).` : "No live gaps right now."} Billy's Galway Haulage job has used ${elapsed(billy, s.clock)} of ${billy.budgetMin} minutes.`,
      cols: ["Friday bucket", "Hours"], rows: [["Job-allocated", d.fri.job.toFixed(1)], ["Approved breaks", d.fri.breaks.toFixed(1)], ["Internal work", d.fri.internal.toFixed(1)], ...(d.fri.explained ? [["Reviewed, explained", d.fri.explained.toFixed(1)]] : []), ["Unallocated — review", d.fri.unallocated.toFixed(1)]],
      actions: [["Open Workshop → Clocking", 1, ["Workshop", "clocking"]], ["Open the live gaps", 0, ["Workshop", "live"]]] };
  }
  return null;
}
