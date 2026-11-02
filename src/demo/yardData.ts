/* ─────────────────────────────────────────────────────────────────────────
   Reynolds Commercials — yard model fixtures.

   Architecture shown to the user:
     KEYLOOP = background engine / system of record
     PULSE   = the live, intelligent operational layer on top of it

   This file holds the facts that are NOT already in fixtures.ts: which
   vehicles are physically on site, where, why, and the messages, ANPR reads
   and Renault notices around them. Jobs, technicians, parts blockers,
   receivables and CVRT bookings stay in fixtures.ts and are read live from the
   store, so a change in one module shows in every other.

   Snapshot: Monday 19 October 2026, 10:00 Europe/Dublin (same as fixtures.ts).
   All names, balances and registrations are fictional demo data.
   ───────────────────────────────────────────────────────────────────────── */

export const NOW_ISO = "2026-10-19T10:00";
export const TODAY_ISO = "2026-10-19";

export type Channel = "WhatsApp" | "Email" | "Keyloop" | "ANPR" | "Phone" | "Renault" | "Workshop" | "Pulse";

/** Primary status of a vehicle in the yard. One status per vehicle. */
export type YardStatus = "workshop" | "waiting_parts" | "waiting_approval" | "accounts_hold" | "cvrt_issue" | "ready" | "unknown";

export interface LastUpdate { who: string; channel: Channel; minsAgo: number; text: string }

export interface YardRow {
  /** Service vehicle id (C101), stock id (V008) or unknown id (U001). */
  key: string;
  status: YardStatus;
  location: string;
  /** ANPR entry time, local, no timezone. */
  arrived: string;
  /** Stays on site tonight. */
  overnight: boolean;
  job: string | null;
  /** Past (already invoiced) job reference for vehicles with no live job. */
  pastJob?: string;
  promised: string | null;
  /** Why the vehicle is here, in a phrase that completes "arrived for ...". */
  reason: string;
  done: string[];
  todo: string[];
  /** Plain-English main blocker, null when nothing is in the way. */
  blocker: string | null;
  accounts: "clear" | "hold" | "review";
  balance?: number;
  customerUpdated: string | null;
  last: LastUpdate;
  /** True when management should look at it today (feeds the MD "needs attention" list). */
  attention?: boolean;
  /** Free-text hand-off note shown on the vehicle page. */
  note?: string;
}

const R = (key: string, status: YardStatus, location: string, arrived: string, o: Partial<YardRow> & Pick<YardRow, "reason" | "last">): YardRow => ({
  key, status, location, arrived, overnight: false, job: null, promised: null, done: [], todo: [], blocker: null, accounts: "clear", customerUpdated: null, ...o,
});
const L = (who: string, channel: Channel, minsAgo: number, text: string): LastUpdate => ({ who, channel, minsAgo, text });

/* Counts the Yard page must show (asserted in tools/check): 42 on site, 8 arrived today, 11 ready,
   7 blocked (parts 4 + accounts 2 + CVRT 1), 16 overnight, 2 unknown. */
export const YARD_ROWS: YardRow[] = [
  /* ── Waiting for parts (4) ───────────────────────────────────────────── */
  R("C101", "waiting_parts", "Bay 2", "2026-10-16T08:43", {
    overnight: true, job: "JOB-1042", promised: "2026-10-22T17:00", attention: true,
    reason: "an engine fault investigation",
    done: ["Fault codes read and logged", "Wiring and connectors checked", "ECU fault diagnosed by Billy", "All work possible without the part completed"],
    todo: ["Fit replacement ECU", "Programme ECU and clear fault codes", "Road test", "Final inspection and wash"],
    blocker: "ECU on order from Renault Parts (PO-8821). Work cannot continue until it arrives.",
    customerUpdated: "Fri 16 Oct 16:22 · WhatsApp (Darren)",
    last: L("Darren", "WhatsApp", 17, "ECU ordered from Poland, should be here Thursday."),
  }),
  R("C122", "waiting_parts", "Bay 5", "2026-10-15T14:20", {
    overnight: true, job: "JOB-1047", promised: "2026-10-20T09:00",
    reason: "an alternator fault on the fridge unit supply",
    done: ["Charging system tested, alternator failed load test", "Old alternator removed"],
    todo: ["Fit 150A alternator", "Charging test", "Fridge unit function check"],
    blocker: "Alternator 150A due from Midland CV Factors at 14:00 today.",
    customerUpdated: "Fri 16 Oct 16:40 · WhatsApp (Sinéad)",
    last: L("Darren", "WhatsApp", 52, "Alternator on the 14:00 van from Midland CV, PO-8822"),
  }),
  R("C104", "waiting_parts", "Bay 7", "2026-10-16T09:30", {
    overnight: true, job: "JOB-1048", promised: "2026-10-20T12:00",
    reason: "a CVRT fail repair (damaged N/S headlamp)",
    done: ["Failed CVRT on headlamp aim and damage (T-304)", "Repair job opened and part ordered"],
    todo: ["Fit N/S headlamp unit", "Aim and check", "Book CVRT retest"],
    blocker: "Headlamp unit N/S due Tuesday 09:00 from Renault Genuine Parts (PO-8824). Retest cannot be booked until it is fitted.",
    customerUpdated: "Fri 16 Oct 16:50 · Email (Michelle)",
    last: L("Michelle", "Email", 190, "Retest to be rebooked once headlamp is fitted"),
  }),
  R("C108", "waiting_parts", "Main yard · Row B", "2026-10-19T07:42", {
    overnight: true, job: "JOB-1050", promised: "2026-10-21T17:00",
    reason: "a slipping clutch under load",
    done: ["Road test with driver, slip confirmed", "Clutch kit ordered at 08:20"],
    todo: ["Assign technician", "Drop gearbox and replace clutch", "Road test"],
    blocker: "Clutch kit due Wednesday 09:00 from Midland CV Factors (PO-8826). Job cannot be scheduled until it arrives.",
    customerUpdated: "Today 08:35 · Phone (Declan)",
    last: L("Darren", "Keyloop", 100, "PO-8826 raised for clutch kit"),
  }),

  /* ── Accounts hold (2) ───────────────────────────────────────────────── */
  R("C139", "accounts_hold", "Main yard · Row A", "2026-10-16T11:05", {
    overnight: true, job: "JOB-1075", promised: "2026-10-19T16:00", attention: true,
    reason: "air suspension replacement and an inspection",
    done: ["Air bags replaced front and rear", "Inspection completed", "Road tested", "Invoice-ready in Keyloop"],
    todo: ["Accounts approval to release", "Wash and keys"],
    blocker: "Release blocked: €4,820 outstanding on INV-2062 (14 days overdue). Accounts approval required.",
    accounts: "hold", balance: 4820,
    customerUpdated: "Today 08:50 · Email (Caroline)",
    last: L("Tom Murphy", "Email", 66, "Payment sent this morning, please release 231-D-8812"),
  }),
  R("C128", "accounts_hold", "Main yard · Row A", "2026-10-15T15:10", {
    overnight: true, job: "JOB-1045", promised: "2026-10-20T09:00",
    reason: "an exhaust repair",
    done: ["Exhaust section replaced", "Leak check and road test"],
    todo: ["Accounts approval to release", "Wash and keys"],
    blocker: "Release blocked: Corrib Plant Hire has €4,800 overdue on INV-2041 (17 days). Accounts approval required.",
    accounts: "hold", balance: 4800,
    customerUpdated: "Fri 16 Oct 17:05 · Email (Órla)",
    last: L("Órla", "Keyloop", 230, "Account flagged on hold, 17 days overdue"),
  }),

  /* ── CVRT issue (1) ──────────────────────────────────────────────────── */
  R("V008", "cvrt_issue", "Bay 6", "2026-10-14T08:20", {
    overnight: true, job: "JOB-1046", promised: "2026-10-20T12:00", attention: true,
    reason: "used-van preparation before handover to Kelly Logistics",
    done: ["CVRT test T-303 recorded: FAIL, rear O/S brake imbalance", "Seized rear caliper found", "Repair JOB-1046 opened, caliper ordered"],
    todo: ["Fit rear O/S brake caliper", "Bleed and balance brakes", "Retest (separate, reviewed outcome)", "Accounts clearance", "Handover"],
    blocker: "CVRT failed on rear brake imbalance. Caliper (PO-8817) due 11:30. Retest and accounts clearance still outstanding.",
    accounts: "review",
    customerUpdated: "Fri 16 Oct 15:30 · WhatsApp (Jack)",
    last: L("Elizabeth", "Keyloop", 30, "T-303 FAIL recorded: rear O/S brake imbalance"),
    note: "A repair finishing does not pass the test. The retest is a separate, reviewed outcome.",
  }),

  /* ── Waiting for approval (2) ────────────────────────────────────────── */
  R("C109", "waiting_approval", "Main yard · Row B", "2026-10-19T08:20", {
    overnight: true, job: "JOB-1051", promised: "2026-10-21T12:00",
    reason: "CVRT preparation (brakes and lights)",
    done: ["Brake and lights inspection", "Front discs below minimum, extra work quoted"],
    todo: ["Customer approval of extra brake work (€1,180)", "Fit discs and pads", "Lights check", "CVRT test"],
    blocker: "Extra brake work quoted at €1,180. Waiting for Tuam Builders Providers to approve.",
    customerUpdated: "Today 09:20 · Phone (Kevin)",
    last: L("Kevin", "Phone", 40, "Quote read to Mary Burke, she will confirm after speaking to the owner"),
  }),
  R("C111", "waiting_approval", "Main yard · Row B", "2026-10-19T09:05", {
    overnight: true, job: "JOB-1053", promised: "2026-10-21T17:00",
    reason: "a tail-lift that will not raise",
    done: ["Diagnosed failed lift ram", "Quote prepared"],
    todo: ["Customer approval of ram replacement (€1,640)", "Order ram", "Fit and test"],
    blocker: "Tail-lift ram replacement quoted at €1,640. Waiting for Boyle Agri Contracts to approve.",
    customerUpdated: "Today 09:40 · WhatsApp (Kevin)",
    last: L("Kevin", "WhatsApp", 20, "Quote sent to Seán Óg, no reply yet"),
  }),

  /* ── Unknown (2) ─────────────────────────────────────────────────────── */
  R("U001", "unknown", "Gate · holding bay", "2026-10-19T09:51", {
    reason: "an unrecorded visit",
    blocker: "Registration read at 84% confidence. Not matched to a vehicle or customer.",
    last: L("ANPR", "ANPR", 9, "Registration read as 192-D-3417 (84% confidence)"),
    attention: false,
  }),
  R("U002", "unknown", "Main yard · Row C", "2026-10-16T17:48", {
    overnight: true,
    reason: "an after-hours drop-off",
    blocker: "Left in the yard after close on Friday. No booking, customer or Keyloop record found.",
    last: L("ANPR", "ANPR", 4090, "Read 08-WH-1203 (97%) but no vehicle record exists"),
  }),

  /* ── Workshop (20) ───────────────────────────────────────────────────── */
  R("C106", "workshop", "Bay 1", "2026-10-16T13:00", { job: "JOB-1060", promised: "2026-10-19T13:00", reason: "an oil service and filters", done: ["Vehicle booked in", "Oil and filters in progress"], todo: ["Test and sign off"], last: L("Conor", "Keyloop", 50, "Clocked on JOB-1060"), customerUpdated: "Fri 16 Oct 13:20 · WhatsApp (Sinéad)" }),
  R("C114", "workshop", "Bay 4", "2026-10-16T10:10", { overnight: true, job: "JOB-1062", promised: "2026-10-20T10:00", reason: "a rear axle brake overhaul", done: ["Rear axle stripped", "Pads and drums issued from stores"], todo: ["Refit and adjust", "Brake roller test"], last: L("Edgar", "Keyloop", 150, "Clocked on JOB-1062"), customerUpdated: "Fri 16 Oct 10:30 · Email (Kevin)" }),
  R("C115", "workshop", "Bay 8", "2026-10-16T14:30", { job: "JOB-1063", promised: "2026-10-19T16:30", reason: "a timing belt replacement", done: ["Timing kit issued", "Belt removal started"], todo: ["Fit and time", "Run and check"], last: L("Gennadiy", "Keyloop", 60, "Clocked on JOB-1063"), customerUpdated: "Fri 16 Oct 14:50 · Email (Órla)" }),
  R("C116", "workshop", "CVRT Lane 1", "2026-10-16T15:40", { job: "JOB-1069", promised: "2026-10-19T14:00", reason: "CVRT preparation before an 11:30 test", done: ["Brakes and lights prepared"], todo: ["CVRT test 11:30 (T-306)"], last: L("Dylan", "Keyloop", 30, "Clocked on JOB-1069"), customerUpdated: "Fri 16 Oct 15:55 · Phone (Michelle)" }),
  R("C117", "workshop", "Bay 3", "2026-10-16T09:50", { job: "JOB-1064", promised: "2026-10-19T15:00", reason: "a DPF regeneration fault", done: ["Fault codes read", "Forced regeneration attempted"], todo: ["Confirm regen completed", "Road test"], last: L("Ron", "Keyloop", 120, "Clocked on JOB-1064"), customerUpdated: "Fri 16 Oct 10:15 · WhatsApp (Sinéad)", attention: false }),
  R("C118", "workshop", "Bay 9", "2026-10-16T12:15", { job: "JOB-1065", promised: "2026-10-19T16:00", reason: "a suspension airbag replacement", done: ["Airbags reserved and issued"], todo: ["Fit and leak test"], last: L("JJ", "Keyloop", 40, "Clocked on JOB-1065"), customerUpdated: "Fri 16 Oct 12:30 · Phone (Michelle)" }),
  R("C119", "workshop", "Bay 10", "2026-10-16T08:55", { overnight: true, job: "JOB-1066", promised: "2026-10-19T16:00", reason: "a gearbox oil leak", done: ["Gearbox drained and output housing stripped", "Seal kit ordered at 08:40"], todo: ["Fit output seal kit", "Refill and leak test"], last: L("Darren", "Keyloop", 80, "PO-8830 raised for output seal kit"), customerUpdated: "Fri 16 Oct 09:10 · Phone (Kevin)" }),
  R("C120", "workshop", "Bay 11", "2026-10-19T07:55", { job: "JOB-1067", promised: "2026-10-19T11:30", reason: "wheel alignment and tyres", done: ["Tyres off", "Alignment in progress"], todo: ["Balance and refit"], last: L("Ronan", "Keyloop", 30, "Clocked on JOB-1067"), customerUpdated: "Today 07:58 · Phone (Reception)" }),
  R("C121", "workshop", "Bay 12", "2026-10-16T16:20", { overnight: true, job: "JOB-1068", promised: "2026-10-20T12:00", reason: "a reversing camera install", done: ["Camera kit issued", "Cab trim removed"], todo: ["Wire and mount camera", "Test display"], last: L("Fionn", "Keyloop", 55, "Clocked on JOB-1068"), customerUpdated: "Fri 16 Oct 16:35 · WhatsApp (Sinéad)" }),
  R("C123", "workshop", "QC Bay", "2026-10-16T08:30", { job: "JOB-1070", promised: "2026-10-19T12:00", reason: "a full service and CVRT preparation", done: ["Service completed", "CVRT prep completed"], todo: ["Quality check", "Wash"], last: L("Ron", "Keyloop", 25, "JOB-1070 moved to quality check"), customerUpdated: "Fri 16 Oct 08:50 · Phone (Kevin)" }),
  R("C124", "workshop", "QC Bay", "2026-10-16T11:40", { job: "JOB-1071", promised: "2026-10-19T12:30", reason: "front brake pads and discs", done: ["Pads and discs replaced"], todo: ["Quality check", "Wash"], last: L("JJ", "Keyloop", 20, "JOB-1071 moved to quality check"), customerUpdated: "Fri 16 Oct 11:55 · Email (Órla)" }),
  R("C125", "workshop", "QC Bay", "2026-10-16T09:20", { job: "JOB-1072", promised: "2026-10-19T13:00", reason: "a steering box replacement", done: ["Steering box replaced", "Alignment checked"], todo: ["Quality check", "Wash"], last: L("Shane", "Keyloop", 35, "JOB-1072 moved to quality check"), customerUpdated: "Fri 16 Oct 09:40 · Phone (Kevin)" }),
  R("C102", "workshop", "Main yard · Row D", "2026-10-16T08:10", { overnight: true, job: "JOB-1041", promised: "2026-10-20T10:00", reason: "a service and front brake inspection", done: ["Oil and filter changed", "Front brakes inspected, within limits"], todo: ["Technician confirms the write-up", "Service manager approves", "Invoice"], blocker: "Job-card write-up awaiting Conor's confirmation (two questions open).", last: L("Job Card Assistant", "Pulse", 50, "Draft prepared, two questions for Conor"), customerUpdated: "Fri 16 Oct 14:00 · WhatsApp (Sinéad)" }),
  R("C129", "workshop", "Main yard · Row D", "2026-10-16T10:50", { overnight: true, job: "JOB-1049", promised: "2026-10-20T10:00", reason: "an intermittent electrical fault", done: ["Fault traced to corroded cab earth strap", "Strap cleaned and re-terminated, tested OK"], todo: ["Technician confirms the write-up", "Invoice"], blocker: "Job-card write-up awaiting Rob's confirmation (one question open).", last: L("Job Card Assistant", "Pulse", 75, "Draft prepared, one question for the technician"), customerUpdated: "Fri 16 Oct 11:10 · Phone (Michelle)" }),
  R("C107", "workshop", "CVRT Lane 1", "2026-10-16T09:35", { job: "JOB-1073", promised: "2026-10-19T14:00", reason: "a brake repair before CVRT retest", done: ["Rear N/S brake pipe replaced", "System bled, pedal firm"], todo: ["Retest at 11:00 (T-305)", "Write-up confirmation"], blocker: "Job-card write-up awaiting confirmation. CVRT retest at 11:00.", last: L("Elizabeth", "Keyloop", 90, "Retest T-305 booked for 11:00"), customerUpdated: "Fri 16 Oct 16:00 · Email (Michelle)" }),
  R("C103", "workshop", "Main yard · Row B", "2026-10-16T15:00", { job: "JOB-1043", promised: "2026-10-19T14:00", reason: "a scheduled service and brake check", done: ["Booked in"], todo: ["Service and brake check (Billy, 10:15)"], last: L("Kevin", "Keyloop", 2760, "Job booked in for Monday"), customerUpdated: "Fri 16 Oct 15:10 · Email (Kevin)" }),
  R("C110", "workshop", "Bay 13", "2026-10-16T14:10", { overnight: true, job: "JOB-1052", promised: "2026-10-21T10:00", reason: "a fridge unit electrical fault", done: ["Fault isolated to control module", "Module ordered"], todo: ["Assign auto-electrician", "Fit module on arrival", "Fridge unit test"], blocker: "Fridge control module due Tuesday 12:00 (PO-8829). Diagnosis can start now.", last: L("Darren", "Keyloop", 2700, "PO-8829 raised for fridge control module"), customerUpdated: "Fri 16 Oct 16:10 · WhatsApp (Sinéad)" }),
  R("C112", "workshop", "Main yard · Row B", "2026-10-19T08:10", { job: "JOB-1054", promised: "2026-10-19T15:00", reason: "an air leak diagnosis", done: ["Booked in at gate"], todo: ["Air leak diagnosis (Seán, 11:00)"], last: L("Kevin", "Keyloop", 110, "JOB-1054 booked in, Seán at 11:00"), customerUpdated: "Today 08:15 · Phone (Kevin)" }),
  R("C130", "workshop", "CVRT Lane 2", "2026-10-19T08:48", { promised: "2026-10-19T13:00", reason: "a CVRT test at 12:00", todo: ["CVRT test 12:00 (T-307)"], last: L("Michelle", "Keyloop", 70, "T-307 booked for Lane 2 at 12:00"), customerUpdated: "Today 08:50 · Phone (Michelle)", pastJob: "JOB-1030" }),
  R("C137", "workshop", "Bay 3 (booked)", "2026-10-19T09:43", { job: "JOB-1084", promised: "2026-10-20T12:00", reason: "a 13-week inspection", done: ["Matched at gate by ANPR", "Existing Keyloop booking JOB-1084 found"], todo: ["13-week inspection (Rachel, 10:30)", "Report to customer"], last: L("ANPR", "ANPR", 17, "241-D-1821 matched to Kelly Logistics and JOB-1084"), customerUpdated: "Today 09:44 · WhatsApp (auto, arrival notice)" }),

  /* ── Ready to leave (11) ─────────────────────────────────────────────── */
  R("C126", "ready", "Main yard · Row E", "2026-10-16T08:05", { job: "JOB-1040", promised: "2026-10-19T12:00", reason: "an oil service", done: ["Service complete", "Invoice-ready in Keyloop"], todo: ["Driver collection"], last: L("Ronan", "Keyloop", 190, "JOB-1040 completed"), customerUpdated: "Today 07:30 · WhatsApp (collection from 12:00)" }),
  R("C127", "ready", "Main yard · Row E", "2026-10-15T16:00", { job: "JOB-1044", promised: "2026-10-19T14:00", reason: "a clutch replacement", done: ["Clutch replaced", "Road tested", "Invoice-ready in Keyloop"], todo: ["Driver collection"], last: L("Edgar", "Keyloop", 240, "JOB-1044 completed"), customerUpdated: "Today 08:00 · Phone (Kevin)" }),
  R("C140", "ready", "Main yard · Row E", "2026-10-15T10:25", { job: "JOB-1074", promised: "2026-10-19T13:00", reason: "a clutch and brake overhaul with full service", done: ["Overhaul complete", "Road tested", "Invoice-ready in Keyloop"], todo: ["Driver collection"], last: L("Edgar", "Keyloop", 300, "JOB-1074 completed"), customerUpdated: "Today 07:45 · WhatsApp (Darren)" }),
  R("C141", "ready", "Main yard · Row F", "2026-10-15T13:45", { job: "JOB-1076", promised: "2026-10-19T11:00", reason: "a gearbox reseal and clutch adjustment", done: ["Reseal complete", "Road tested", "Invoice-ready in Keyloop"], todo: ["Driver collection"], last: L("Shane", "Keyloop", 330, "JOB-1076 completed"), customerUpdated: "Today 07:50 · WhatsApp (Darren)" }),
  R("C142", "ready", "Main yard · Row F", "2026-10-16T07:55", { job: "JOB-1077", promised: "2026-10-19T15:00", reason: "a turbo replacement", done: ["Turbo replaced", "Boost test passed", "Invoice-ready in Keyloop"], todo: ["Driver collection"], last: L("Ronan", "Keyloop", 270, "JOB-1077 completed"), customerUpdated: "Today 08:10 · Phone (Kevin)" }),
  R("C143", "ready", "Main yard · Row F", "2026-10-15T11:30", { job: "JOB-1078", promised: "2026-10-19T12:30", reason: "brake chambers and a full service", done: ["Chambers replaced", "Full service done", "Invoice-ready in Keyloop"], todo: ["Driver collection"], last: L("Fionn", "Keyloop", 210, "JOB-1078 completed"), customerUpdated: "Today 08:20 · WhatsApp (Jack)" }),
  R("C105", "ready", "Main yard · Row G", "2026-10-16T17:10", { pastJob: "JOB-1035", promised: "2026-10-19T11:00", reason: "a CVRT test", done: ["CVRT test T-301 passed at 08:30"], todo: ["Driver collection"], last: L("Elizabeth", "Keyloop", 85, "T-301 PASS recorded and reviewed"), customerUpdated: "Today 08:45 · Phone (Reception)" }),
  R("C131", "ready", "Main yard · Row G", "2026-10-16T17:25", { pastJob: "JOB-1036", promised: "2026-10-19T11:30", reason: "a CVRT test", done: ["CVRT test T-302 passed at 09:00"], todo: ["Driver collection"], last: L("Elizabeth", "Keyloop", 60, "T-302 PASS recorded and reviewed"), customerUpdated: "Today 09:15 · WhatsApp (Reception)" }),
  R("C144", "ready", "Main yard · Row G", "2026-10-16T08:35", { pastJob: "JOB-1031", promised: "2026-10-19T14:00", reason: "a 13-week inspection", done: ["Inspection complete", "Invoiced Friday (INV-2201)"], todo: ["Driver collection 14:00"], last: L("Mark Doyle", "WhatsApp", 100, "Driver will collect after lunch"), customerUpdated: "Today 08:20 · WhatsApp (Darren)" }),
  R("C145", "ready", "Main yard · Row H", "2026-10-16T09:05", { pastJob: "JOB-1032", promised: "2026-10-19T16:00", reason: "a brake service", done: ["Service complete", "Invoiced Friday (INV-2203)"], todo: ["Driver collection 16:00"], last: L("Declan Flynn", "WhatsApp", 140, "Collection booked for 16:00"), customerUpdated: "Today 07:40 · WhatsApp (Darren)" }),
  R("C146", "ready", "Main yard · Row H", "2026-10-16T10:20", { pastJob: "JOB-1033", promised: "2026-10-19T15:00", reason: "a tacho and lighting repair", done: ["Repair complete", "Invoiced Friday (INV-2204)"], todo: ["Driver collection 15:00"], last: L("Tom Murphy", "Email", 200, "Collection booked for 15:00"), customerUpdated: "Today 08:05 · Email (Caroline)" }),
];

/** Jobs already invoiced; shown on the vehicle page, not counted as workshop work. */
export interface PastJob { id: string; vehicle: string; customer: string; complaint: string; tech: string; net: number; invoice: string; doneAt: string }
export const PAST_JOBS: PastJob[] = [
  { id: "JOB-1035", vehicle: "C105", customer: "c-galway", complaint: "CVRT test", tech: "t-dylan", net: 0, invoice: "n/a", doneAt: "2026-10-19T08:30" },
  { id: "JOB-1036", vehicle: "C131", customer: "c-shannon", complaint: "CVRT test", tech: "t-dylan", net: 0, invoice: "n/a", doneAt: "2026-10-19T09:00" },
  { id: "JOB-1030", vehicle: "C130", customer: "c-tuam", complaint: "CVRT test booking", tech: "t-dylan", net: 0, invoice: "n/a", doneAt: "2026-10-19T08:48" },
  { id: "JOB-1031", vehicle: "C144", customer: "c-doyle", complaint: "13-week inspection", tech: "t-robbie", net: 640, invoice: "INV-2201", doneAt: "2026-10-16T15:20" },
  { id: "JOB-1032", vehicle: "C145", customer: "c-flynn", complaint: "Brake service", tech: "t-mark", net: 1180, invoice: "INV-2203", doneAt: "2026-10-16T16:05" },
  { id: "JOB-1033", vehicle: "C146", customer: "c-murphy", complaint: "Tacho and lighting repair", tech: "t-fionn", net: 860, invoice: "INV-2204", doneAt: "2026-10-16T16:40" },
];

/* ─────────────────────────── ANPR ─────────────────────────── */
export type AnprOutcome = "matched" | "no_booking" | "unknown" | "unmatched" | "exit";
export interface AnprEvent {
  id: string;
  /** Local time and day label. */
  at: string; day: "Today" | "Fri 16 Oct";
  direction: "in" | "out";
  /** Registration as read by the camera. */
  read: string;
  confidence: number;
  camera: string;
  outcome: AnprOutcome;
  /** Yard row key when matched. */
  key: string | null;
  /** Keyloop booking, if any. */
  booking?: { job: string; reason: string; assigned: string };
  note?: string;
  /** For the 84% unknown: the closest known vehicle. */
  suggestion?: { key: string; why: string; confidence: number };
}
export const ANPR_EVENTS: AnprEvent[] = [
  { id: "ANPR-0951", at: "09:51", day: "Today", direction: "in", read: "192-D-3417", confidence: 84, camera: "Gate 1 · inbound", outcome: "unknown", key: "U001",
    note: "One character low-confidence (3411 vs 3417). No booking on this read.",
    suggestion: { key: "C147", why: "192-D-3411 · Murphy Transport · Renault Trucks C Range", confidence: 84 } },
  { id: "ANPR-0943", at: "09:43", day: "Today", direction: "in", read: "241-D-1821", confidence: 99, camera: "Gate 1 · inbound", outcome: "matched", key: "C137",
    booking: { job: "JOB-1084", reason: "13-week inspection", assigned: "Workshop Bay 3 · Rachel · 10:30" } },
  { id: "ANPR-0905", at: "09:05", day: "Today", direction: "in", read: "172-RN-505", confidence: 98, camera: "Gate 1 · inbound", outcome: "no_booking", key: "C111",
    booking: { job: "JOB-1053", reason: "Tail-lift not raising (walk-in)", assigned: "Main yard · Row B" }, note: "Walk-in. Service desk opened JOB-1053 after arrival." },
  { id: "ANPR-0848", at: "08:48", day: "Today", direction: "in", read: "212-G-1250", confidence: 97, camera: "Gate 2 · CVRT", outcome: "matched", key: "C130",
    booking: { job: "T-307", reason: "CVRT test 12:00", assigned: "CVRT Lane 2" } },
  { id: "ANPR-0820", at: "08:20", day: "Today", direction: "in", read: "191-G-2018", confidence: 99, camera: "Gate 1 · inbound", outcome: "matched", key: "C109",
    booking: { job: "JOB-1051", reason: "CVRT preparation", assigned: "Main yard · Row B" } },
  { id: "ANPR-0810", at: "08:10", day: "Today", direction: "in", read: "201-G-8840", confidence: 96, camera: "Gate 1 · inbound", outcome: "matched", key: "C112",
    booking: { job: "JOB-1054", reason: "Air leak diagnosis", assigned: "Seán · 11:00" } },
  { id: "ANPR-0755", at: "07:55", day: "Today", direction: "in", read: "221-MO-117", confidence: 99, camera: "Gate 1 · inbound", outcome: "matched", key: "C120",
    booking: { job: "JOB-1067", reason: "Wheel alignment and tyres", assigned: "Bay 11 · Ronan" } },
  { id: "ANPR-0742", at: "07:42", day: "Today", direction: "in", read: "202-G-6611", confidence: 95, camera: "Gate 1 · inbound", outcome: "matched", key: "C108",
    booking: { job: "JOB-1050", reason: "Clutch slipping under load", assigned: "Awaiting technician" } },
  { id: "ANPR-0835", at: "08:35", day: "Today", direction: "out", read: "192-D-9901", confidence: 99, camera: "Gate 1 · outbound", outcome: "exit", key: null, note: "Doyle Transport collection. Release approved by accounts." },
  { id: "ANPR-0802", at: "08:02", day: "Today", direction: "out", read: "181-LH-6620", confidence: 98, camera: "Gate 1 · outbound", outcome: "exit", key: null, note: "Shannon Cold Chain collection." },
  { id: "ANPR-1748", at: "17:48", day: "Fri 16 Oct", direction: "in", read: "08-WH-1203", confidence: 97, camera: "Gate 1 · inbound (after hours)", outcome: "unmatched", key: "U002",
    note: "Read cleanly but no vehicle record exists in Keyloop." },
];

/* ─────────────────────────── communications ─────────────────────────── */
export type CommStatus = "auto" | "review" | "unmatched";
export type CommType = "Parts update" | "Customer message" | "Job update" | "Accounts" | "Inspection notice" | "Supplier" | "Question" | "Release request";
export interface Comm {
  id: string;
  day: "Today" | "Fri 16 Oct";
  at: string;
  channel: Channel;
  /** WhatsApp group or mailbox. */
  source: string;
  from: string;
  /** Email subject, if any. */
  subject?: string;
  text: string;
  type: CommType;
  status: CommStatus;
  /** Resolved links (set for auto-matched). */
  vehicle?: string | null;
  customer?: string | null;
  job?: string | null;
  part?: string | null;
  employee?: string | null;
  confidence?: number;
  /** What Pulse extracted from the text. */
  extracted?: { field: string; value: string }[];
  /** For review: best guesses. */
  suggestions?: { key: string; confidence: number; why: string }[];
}
export const COMMS: Comm[] = [
  { id: "M-1043", day: "Today", at: "09:43", channel: "WhatsApp", source: "Parts group", from: "Darren O'Brien", text: "181G4471 ECU ordered from Poland, should be here Thursday.", type: "Parts update", status: "auto",
    vehicle: "C101", customer: "c-flynn", job: "JOB-1042", part: "ECU (engine control unit)", employee: "p-darren", confidence: 99,
    extracted: [{ field: "Vehicle", value: "181-G-4471" }, { field: "Type", value: "Parts update" }, { field: "Part", value: "ECU" }, { field: "Status", value: "Ordered" }, { field: "ETA", value: "Thursday" }, { field: "Source", value: "WhatsApp" }, { field: "Sender", value: "Darren" }] },
  { id: "M-1041", day: "Today", at: "09:41", channel: "WhatsApp", source: "Workshop group", from: "Billy Murphy", text: "ECU job - done all I can without the part. Will go onto the Mayo service when Darren confirms the ETA.", type: "Job update", status: "review",
    customer: "c-flynn", job: "JOB-1042", employee: "t-billy", confidence: 78, suggestions: [{ key: "C101", confidence: 92, why: "Billy is clocked on JOB-1042 and the only open ECU part is on this vehicle" }] },
  { id: "M-1037", day: "Today", at: "09:37", channel: "WhatsApp", source: "Parts group", from: "Declan Furey", text: "ECU for the Flynn truck should arrive Thursday.", type: "Parts update", status: "review",
    customer: "c-flynn", part: "ECU (engine control unit)", employee: "p-s2", confidence: 92,
    suggestions: [{ key: "C101", confidence: 92, why: "Flynn has three vehicles; only 181-G-4471 has an ECU on order (PO-8821)" }, { key: "C140", confidence: 6, why: "201-D-5530 is also Flynn but has no open part" }] },
  { id: "M-1034", day: "Today", at: "09:34", channel: "Email", source: "accounts@", from: "Tom Murphy (Murphy Transport)", subject: "Release of 231-D-8812", text: "Payment of the overdue balance went out this morning. Please release 231-D-8812 for collection at 16:00.", type: "Release request", status: "auto",
    vehicle: "C139", customer: "c-murphy", job: "JOB-1075", confidence: 97,
    extracted: [{ field: "Vehicle", value: "231-D-8812" }, { field: "Type", value: "Release request" }, { field: "Claim", value: "Payment sent, not yet seen in Keyloop" }, { field: "Collection", value: "Today 16:00" }] },
  { id: "M-1029", day: "Today", at: "09:29", channel: "WhatsApp", source: "Workshop group", from: "Conor Keane", text: "Kelly caliper still not here. Is it the 11:30 van?", type: "Question", status: "review",
    customer: "c-kelly", part: "Brake caliper, rear O/S", employee: "t-conor", confidence: 88,
    suggestions: [{ key: "V008", confidence: 88, why: "Conor is on JOB-1046; Kelly's only open caliper is PO-8817 (due 11:30)" }, { key: "C143", confidence: 7, why: "202-D-1547 is Kelly but its job is complete" }] },
  { id: "M-1022", day: "Today", at: "09:22", channel: "Email", source: "Renault Trucks notices", from: "Renault Trucks Ireland", subject: "Periodic inspection due: 191-D-2811", text: "13-week periodic inspection is due on 18 November for 191-D-2811. Please arrange with the customer.", type: "Inspection notice", status: "auto",
    vehicle: "C150", customer: "c-doyle", confidence: 100,
    extracted: [{ field: "Vehicle", value: "191-D-2811" }, { field: "Type", value: "Inspection notice" }, { field: "Due", value: "18 November" }, { field: "Customer", value: "Doyle Transport" }] },
  { id: "M-1018", day: "Today", at: "09:18", channel: "WhatsApp", source: "Yard group", from: "Brian Costello", text: "Whose is the white Master in row C with the flat tyre? It came in Friday night.", type: "Question", status: "unmatched", confidence: 0 },
  { id: "M-1014", day: "Today", at: "09:14", channel: "WhatsApp", source: "Workshop group", from: "Rachel Byrne", text: "Kelly's C range in bay 3 at half ten, anyone holding the manifold gauge?", type: "Job update", status: "auto",
    vehicle: "C137", customer: "c-kelly", job: "JOB-1084", employee: "t-rachel", confidence: 90,
    extracted: [{ field: "Vehicle", value: "241-D-1821" }, { field: "Job", value: "JOB-1084" }, { field: "Technician", value: "Rachel" }, { field: "Slot", value: "Bay 3 · 10:30" }] },
  { id: "M-1009", day: "Today", at: "09:09", channel: "WhatsApp", source: "Service desk", from: "Kevin Mannion", text: "Tuam quote 1180 for 191G2018 brakes, Mary says she'll ring the owner back.", type: "Customer message", status: "auto",
    vehicle: "C109", customer: "c-tuam", job: "JOB-1051", employee: "p-s4", confidence: 98,
    extracted: [{ field: "Vehicle", value: "191-G-2018" }, { field: "Type", value: "Awaiting customer approval" }, { field: "Amount", value: "€1,180" }, { field: "Owner", value: "Kevin" }] },
  { id: "M-1002", day: "Today", at: "09:02", channel: "WhatsApp", source: "Parts group", from: "Darren O'Brien", text: "Midland CV van at 2pm with the alternator for the Shannon fridge rigid", type: "Parts update", status: "review",
    customer: "c-shannon", part: "Alternator 150A", employee: "p-darren", confidence: 84,
    suggestions: [{ key: "C122", confidence: 84, why: "Shannon's 181-LH-4419 is waiting on alternator PO-8822 (Midland CV Factors)" }, { key: "C102", confidence: 9, why: "191-LH-5530 is also Shannon but is in write-up review" }] },
  { id: "M-0958", day: "Today", at: "08:58", channel: "Keyloop", source: "Keyloop sync", from: "Keyloop", text: "JOB-1084 created by service desk for 241-D-1821 (Kelly Logistics). 13-week inspection, Workshop Bay 3.", type: "Job update", status: "auto",
    vehicle: "C137", customer: "c-kelly", job: "JOB-1084", confidence: 100,
    extracted: [{ field: "Source", value: "Keyloop · 2 min sync" }, { field: "Job", value: "JOB-1084" }, { field: "Booked", value: "Bay 3, Rachel, 10:30" }] },
  { id: "M-0947", day: "Today", at: "08:47", channel: "WhatsApp", source: "Parts group", from: "Declan Furey", text: "Fridge module for 221LH3390 ordered, Tuesday midday", type: "Parts update", status: "auto",
    vehicle: "C110", customer: "c-shannon", job: "JOB-1052", part: "Fridge unit control module", employee: "p-s2", confidence: 96,
    extracted: [{ field: "Vehicle", value: "221-LH-3390" }, { field: "Part", value: "Fridge control module" }, { field: "Status", value: "Ordered" }, { field: "ETA", value: "Tuesday 12:00" }] },
  { id: "M-0921", day: "Today", at: "08:21", channel: "Email", source: "kevin@", from: "Alan Finnerty (Corrib Plant Hire)", subject: "Tipper 202-G-6611", text: "Can you confirm when the clutch will be done on the tipper? We have a job Thursday.", type: "Customer message", status: "auto",
    vehicle: "C108", customer: "c-corrib", job: "JOB-1050", confidence: 99,
    extracted: [{ field: "Vehicle", value: "202-G-6611" }, { field: "Type", value: "Customer asks for ETA" }, { field: "Needs reply", value: "Yes · Kevin" }] },
  { id: "M-0903", day: "Today", at: "09:03", channel: "Phone", source: "Reception log", from: "Brian Costello", text: "Caller for the grey Trafic, said it was left at the gate Friday evening. No name.", type: "Question", status: "unmatched", confidence: 0 },
  { id: "M-1651", day: "Fri 16 Oct", at: "16:22", channel: "WhatsApp", source: "Customer thread", from: "Darren O'Brien", text: "Declan, ECU fault confirmed on the T High. Part ordered today. I'll confirm the ETA Monday.", type: "Customer message", status: "auto",
    vehicle: "C101", customer: "c-flynn", job: "JOB-1042", employee: "p-darren", confidence: 99,
    extracted: [{ field: "Vehicle", value: "181-G-4471" }, { field: "Type", value: "Customer updated" }, { field: "Channel", value: "WhatsApp" }, { field: "Sender", value: "Darren" }] },
  { id: "M-1542", day: "Fri 16 Oct", at: "15:42", channel: "Keyloop", source: "Keyloop sync", from: "Keyloop", text: "PO-8821 raised by Darren O'Brien: ECU for 181-G-4471, supplier Renault Parts.", type: "Parts update", status: "auto",
    vehicle: "C101", customer: "c-flynn", job: "JOB-1042", part: "ECU (engine control unit)", employee: "p-darren", confidence: 100,
    extracted: [{ field: "PO", value: "PO-8821" }, { field: "Supplier", value: "Renault Parts" }, { field: "Status", value: "Ordered" }] },
];

/* ─────────────────────────── Renault inspection notices ─────────────────────────── */
export type NoticeStage = "new" | "contacted" | "awaiting" | "booked";
export interface Notice {
  id: string;
  vehicle: string;
  /** Notice type from Renault. */
  kind: "13-week inspection" | "Periodic inspection" | "Service due";
  due: string;
  received: string;
  stage: NoticeStage;
  /** Last channel used with this customer (identified from history). */
  channel: "WhatsApp" | "Email" | "Phone";
  contactedAt?: string;
  repliedAt?: string;
  bookedFor?: string;
  reply?: string;
}
export const NOTICES: Notice[] = [
  { id: "N-3301", vehicle: "C150", kind: "13-week inspection", due: "2026-11-18", received: "2026-10-19T09:22", stage: "new", channel: "WhatsApp" },
  { id: "N-3302", vehicle: "C151", kind: "13-week inspection", due: "2026-11-06", received: "2026-10-19T09:22", stage: "new", channel: "Email" },
  { id: "N-3303", vehicle: "C152", kind: "Periodic inspection", due: "2026-11-12", received: "2026-10-19T09:23", stage: "new", channel: "WhatsApp" },
  { id: "N-3290", vehicle: "C153", kind: "13-week inspection", due: "2026-10-23", received: "2026-10-12T09:10", stage: "awaiting", channel: "Phone", contactedAt: "2026-10-14T11:05" },
  { id: "N-3291", vehicle: "C154", kind: "13-week inspection", due: "2026-10-25", received: "2026-10-12T09:10", stage: "awaiting", channel: "WhatsApp", contactedAt: "2026-10-14T11:06" },
  { id: "N-3284", vehicle: "C155", kind: "Periodic inspection", due: "2026-10-30", received: "2026-10-09T08:40", stage: "awaiting", channel: "WhatsApp", contactedAt: "2026-10-12T09:15" },
  { id: "N-3285", vehicle: "C156", kind: "13-week inspection", due: "2026-11-03", received: "2026-10-09T08:40", stage: "awaiting", channel: "Email", contactedAt: "2026-10-12T09:16" },
  { id: "N-3277", vehicle: "C157", kind: "Service due", due: "2026-11-09", received: "2026-10-07T10:30", stage: "contacted", channel: "Email", contactedAt: "2026-10-19T08:31" },
  { id: "N-3270", vehicle: "C158", kind: "13-week inspection", due: "2026-11-14", received: "2026-10-05T10:02", stage: "awaiting", channel: "Phone", contactedAt: "2026-10-12T09:18" },
  { id: "N-3295", vehicle: "C159", kind: "13-week inspection", due: "2026-10-27", received: "2026-10-13T09:00", stage: "contacted", channel: "WhatsApp", contactedAt: "2026-10-19T08:30" },
  { id: "N-3262", vehicle: "C160", kind: "13-week inspection", due: "2026-10-22", received: "2026-10-02T09:12", stage: "booked", channel: "WhatsApp", contactedAt: "2026-10-05T09:00", repliedAt: "2026-10-05T14:20", bookedFor: "2026-10-22T08:30", reply: "Yes please, Thursday morning" },
  { id: "N-3258", vehicle: "C161", kind: "Periodic inspection", due: "2026-11-05", received: "2026-10-01T09:05", stage: "booked", channel: "Email", contactedAt: "2026-10-05T09:01", repliedAt: "2026-10-06T10:00", bookedFor: "2026-11-04T08:00", reply: "Book it in, thanks" },
  { id: "N-3244", vehicle: "C147", kind: "13-week inspection", due: "2026-10-16", received: "2026-09-25T09:00", stage: "awaiting", channel: "Email", contactedAt: "2026-09-29T09:10" },
];

/* ─────────────────────────── Keyloop integration (demo representation) ─────────────────────────── */
export const KEYLOOP = {
  product: "Keyloop DMS",
  role: "System of record (background engine)",
  recordsToday: 14284,
  /** Minutes before the snapshot that the last sync completed. */
  lastSyncMinsAgo: 2,
  entities: [
    { name: "Customers", count: 1186, state: "Synced", direction: "Keyloop → Pulse" },
    { name: "Vehicles", count: 3402, state: "Synced", direction: "Keyloop → Pulse" },
    { name: "Jobs", count: 5120, state: "Synced", direction: "Two-way" },
    { name: "Parts", count: 2418, state: "Synced", direction: "Keyloop → Pulse" },
    { name: "Invoices", count: 1396, state: "Synced", direction: "Keyloop → Pulse" },
    { name: "Sales", count: 762, state: "Synced", direction: "Keyloop → Pulse" },
  ],
  twoWay: [
    { from: "Pulse", to: "Keyloop", text: "Workshop status changed in Pulse updates the Keyloop job status" },
    { from: "Keyloop", to: "Pulse", text: "A new Keyloop job is available in Pulse within the next sync" },
  ],
  note: "Demo representation of the intended integration architecture. Endpoint availability depends on the Keyloop APIs Reynolds is licensed for.",
};

/* ─────────────────────────── Yesterday (Fri 16 Oct) for the morning brief ─────────────────────────── */
export const YESTERDAY = { jobsCompleted: 27, arrived: 11, departed: 9 };

/** Last known Keyloop vehicle record id and sync age per vehicle (derived in yard.ts). */
export const SYNC_MIN_AGO: Record<string, number> = { C101: 2, V008: 2, C139: 2 };

/** Parts already issued from stores to live jobs (shown on Parts and the vehicle page). */
export const RESERVED_PARTS = [
  { part: "Brake pads, rear axle set", job: "JOB-1062", qty: 2, supplier: "Renault Genuine Parts", status: "Issued" },
  { part: "Timing belt kit", job: "JOB-1063", qty: 1, supplier: "Renault Genuine Parts", status: "Issued" },
  { part: "Airbag, rear suspension", job: "JOB-1065", qty: 2, supplier: "Midland CV Factors", status: "Reserved" },
  { part: "Reversing camera kit", job: "JOB-1068", qty: 1, supplier: "Midland CV Factors", status: "Reserved" },
];

/** Recently received purchase orders (history for the Parts page). */
export const RECEIVED_POS = [
  { po: "PO-8801", part: "Rear air bag x2", supplier: "Renault Parts", job: "JOB-1075", vehicle: "C139", received: "Fri 16 Oct 11:20", owner: "p-darren" },
  { po: "PO-8806", part: "Turbo charger", supplier: "Renault Parts", job: "JOB-1077", vehicle: "C142", received: "Fri 16 Oct 14:05", owner: "p-darren" },
  { po: "PO-8809", part: "Exhaust section", supplier: "Midland CV Factors", job: "JOB-1045", vehicle: "C128", received: "Fri 16 Oct 15:30", owner: "p-s2" },
];

/** Hand-written story beats for the vehicles that carry the demo. */
export interface StoryEvent { at: string; channel: Channel; who: string; text: string; kind: "arrival" | "job" | "workshop" | "parts" | "comms" | "cvrt" | "finance" | "ai" }
export const HERO_EVENTS: Record<string, StoryEvent[]> = {
  C101: [
    { at: "2026-10-16T08:43", channel: "ANPR", who: "Gate 1 camera", text: "181-G-4471 read at 99%. Matched to Flynn Road Freight and an open booking.", kind: "arrival" },
    { at: "2026-10-16T09:12", channel: "Keyloop", who: "Kevin Mannion", text: "JOB-1042 opened: engine fault warning, budget 120 min.", kind: "job" },
    { at: "2026-10-16T11:30", channel: "Workshop", who: "Billy Murphy", text: "Clocked on. Fault codes read and logged; wiring and connectors checked.", kind: "workshop" },
    { at: "2026-10-16T14:40", channel: "Workshop", who: "Billy Murphy", text: "Diagnosis complete: ECU fault. Replacement unit required.", kind: "workshop" },
    { at: "2026-10-16T15:42", channel: "Keyloop", who: "Darren O'Brien", text: "PO-8821 raised with Renault Parts for the replacement ECU.", kind: "parts" },
    { at: "2026-10-16T16:22", channel: "WhatsApp", who: "Darren O'Brien", text: "Flynn Road Freight updated: ECU fault confirmed, part ordered, ETA to follow Monday.", kind: "comms" },
    { at: "2026-10-19T08:15", channel: "Workshop", who: "Billy Murphy", text: "Clocked on JOB-1042 to finish work possible without the part.", kind: "workshop" },
    { at: "2026-10-19T09:43", channel: "WhatsApp", who: "Darren O'Brien", text: "ECU ordered from Poland, should be here Thursday. Pulse attached it to 181-G-4471, JOB-1042 and PO-8821.", kind: "parts" },
    { at: "2026-10-19T09:55", channel: "Pulse", who: "Operations Watchdog", text: "JOB-1042 at 105 of 120 minutes (87.5% of time budget). Part blocker noted.", kind: "ai" },
  ],
  V008: [
    { at: "2026-10-14T08:20", channel: "ANPR", who: "Gate 1 camera", text: "222-G-1984 read at 98%. Used Master van moved from the forecourt for preparation.", kind: "arrival" },
    { at: "2026-10-16T15:30", channel: "WhatsApp", who: "Jack Kelly", text: "Kelly Logistics told the van is reserved and will be ready once tested.", kind: "comms" },
    { at: "2026-10-19T09:30", channel: "Keyloop", who: "Elizabeth Reynolds", text: "CVRT T-303 recorded: FAIL, rear O/S brake imbalance.", kind: "cvrt" },
    { at: "2026-10-19T09:35", channel: "Keyloop", who: "Darren O'Brien", text: "Repair JOB-1046 opened; rear caliper ordered (PO-8817), due 11:30.", kind: "parts" },
    { at: "2026-10-19T09:40", channel: "Pulse", who: "Handover Coordinator", text: "Handover blocked: repair, retest and accounts clearance are each separate gates.", kind: "ai" },
  ],
  C139: [
    { at: "2026-10-16T11:05", channel: "ANPR", who: "Gate 1 camera", text: "231-D-8812 read at 97%. Matched to Murphy Transport and JOB-1075.", kind: "arrival" },
    { at: "2026-10-16T16:15", channel: "Keyloop", who: "Ron", text: "JOB-1075 completed and marked invoice-ready (€3,760).", kind: "workshop" },
    { at: "2026-10-19T08:50", channel: "Email", who: "Caroline Glynn", text: "Murphy Transport told the vehicle is on hold pending the overdue balance.", kind: "finance" },
    { at: "2026-10-19T09:34", channel: "Email", who: "Tom Murphy", text: "Customer says payment sent this morning and asks for release at 16:00. Not yet visible in Keyloop.", kind: "finance" },
    { at: "2026-10-19T09:40", channel: "Pulse", who: "Invoice Readiness", text: "Release held: €4,820 outstanding on INV-2062. Accounts approval required.", kind: "ai" },
  ],
  C137: [
    { at: "2026-10-19T08:58", channel: "Keyloop", who: "Kevin Mannion", text: "JOB-1084 created for the 13-week inspection, Bay 3.", kind: "job" },
    { at: "2026-10-19T09:43", channel: "ANPR", who: "Gate 1 camera", text: "241-D-1821 read at 99%. Matched to Kelly Logistics and JOB-1084. Arrival message sent.", kind: "arrival" },
  ],
};
