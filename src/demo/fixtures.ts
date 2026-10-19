/* ─────────────────────────────────────────────────────────────────────────
   Reynolds Commercials — canonical demo fixtures.

   One typed source of truth. Every screen derives its numbers from the store
   (store.ts) that is seeded from here; no screen keeps its own copy of a
   customer, vehicle, job, quote or total.

   Real, verified public facts: company name, address, website, the seven
   management/team roles and their public business emails. Everything else —
   jobs, balances, staff performance, customers, documents — is a fictional
   demo scenario. Snapshot: Monday 19 October 2026, 10:00 Europe/Dublin.
   ───────────────────────────────────────────────────────────────────────── */

export const COMPANY = {
  name: "Reynolds Commercials",
  address: "Tones Road, Walderstown, Athlone, Co. Westmeath, N37 EH24",
  website: "reynoldscommercials.ie",
  timezone: "Europe/Dublin",
  currency: "EUR",
  founded: "1993",
  founder: "Paul Reynolds",
  about:
    "Family business founded by Paul Reynolds in 1993. Renault Trucks dealership, SIMI member and RSA-authorised CVRT centre. New and used commercial vehicles, servicing, repairs, genuine parts and fleet support.",
  legal: "Not verified — left unset",
};

/** Minutes since midnight at the demo snapshot. */
export const SNAPSHOT_MIN = 10 * 60;
export const SNAPSHOT_DATE = "Monday 19 October 2026";
export const RATE = 80; // €/hour — illustrative assumption, not a company rate
export const DISCOUNT_THRESHOLD = 250; // configurable demo policy

export const SOURCES = {
  assetminder: "Sample AssetMinder export",
  sage: "Sample Sage snapshot",
  bizimply: "Sample Bizimply report",
  renault: "Sample Renault order book",
} as const;

/* ---- people ------------------------------------------------------------ */
export type PersonKind = "support" | "technician";
export interface Person {
  id: string;
  name: string;
  fullName?: string;
  role: string;
  dept: string;
  kind: PersonKind;
  email: string;
  verified: boolean;
  initials: string;
  tint: string;
}

const P = (id: string, name: string, role: string, dept: string, kind: PersonKind, email: string, verified: boolean, initials: string, tint: string, fullName?: string): Person =>
  ({ id, name, role, dept, kind, email, verified, initials, tint, fullName });

export const STAFF: Person[] = [
  // Seven verified management / team contacts — part of the 15 support roles.
  P("p-paul", "Paul Reynolds", "Managing Director", "Management", "support", "paul@reynoldscommercials.ie", true, "PR", "#2034AB"),
  P("p-anthony", "Anthony Reynolds", "Operations Manager", "Management", "support", "anthony@reynoldscommercials.ie", true, "AR", "#6C8CFF"),
  P("p-caroline", "Caroline Glynn", "Financial Controller", "Accounts", "support", "caroline@reynoldscommercials.ie", true, "CG", "#7fd8a4"),
  P("p-darren", "Darren O'Brien", "Parts Manager", "Parts", "support", "darren@reynoldscommercials.ie", true, "DO", "#f0994b"),
  P("p-jonathan", "Jonathan Keenan", "Service Manager", "Workshop", "support", "jonathan@reynoldscommercials.ie", true, "JK", "#6ad0f0"),
  P("p-elizabeth", "Elizabeth Reynolds", "CVRT Manager", "CVRT", "support", "elizabeth@reynoldscommercials.ie", true, "ER", "#c8b4f0"),
  P("p-jack", "Jack Kelly", "LCV Sales Executive", "Sales", "support", "jack@reynoldscommercials.ie", true, "JaK", "#e6c78a"),
  // Eight fictional support staff.
  P("p-s1", "Órla Hughes", "Accounts assistant", "Accounts", "support", "orla.hughes@example.com", false, "OH", "#9fd6f0"),
  P("p-s2", "Declan Furey", "Parts counter", "Parts", "support", "declan.furey@example.com", false, "DF", "#f0c04b"),
  P("p-s3", "Sinéad Lavelle", "Service advisor", "Workshop", "support", "sinead.lavelle@example.com", false, "SL", "#5fe0a8"),
  P("p-s4", "Kevin Mannion", "Service advisor", "Workshop", "support", "kevin.mannion@example.com", false, "KM", "#e2a08c"),
  P("p-s5", "Aoibhinn Daly", "Warranty administrator", "Workshop", "support", "aoibhinn.daly@example.com", false, "AD", "#c8b4f0"),
  P("p-s6", "Gavin Tuohy", "Sales administrator", "Sales", "support", "gavin.tuohy@example.com", false, "GT", "#9fd6f0"),
  P("p-s7", "Michelle Nerney", "CVRT administrator", "CVRT", "support", "michelle.nerney@example.com", false, "MN", "#7fd8a4"),
  P("p-s8", "Brian Costello", "Reception", "Management", "support", "brian.costello@example.com", false, "BC", "#e6c78a"),
  // Fifteen technicians. Billy is named in the call; his jobs and figures are fictional.
  P("t-billy", "Billy", "HGV technician", "Workshop", "technician", "billy@example.com", false, "BE", "#6C8CFF", "Billy Elliott"),
  P("t-sean", "Seán Doyle", "HGV technician", "Workshop", "technician", "sean.doyle@example.com", false, "SD", "#6ad0f0"),
  P("t-rachel", "Rachel Byrne", "Auto-electrician", "Workshop", "technician", "rachel.byrne@example.com", false, "RB", "#5fe0a8"),
  P("t-conor", "Conor Keane", "LCV technician", "Workshop", "technician", "conor.keane@example.com", false, "CK", "#f0c04b"),
  P("t-mark", "Mark Timlin", "HGV technician", "Workshop", "technician", "mark.timlin@example.com", false, "MT", "#e2a08c"),
  P("t-padraig", "Padraig Shaw", "LCV technician", "Workshop", "technician", "padraig.shaw@example.com", false, "PS", "#c8b4f0"),
  P("t-dylan", "Dylan Forde", "CVRT tester", "Workshop", "technician", "dylan.forde@example.com", false, "DyF", "#9fd6f0"),
  P("t-robbie", "Robbie Naughton", "HGV technician", "Workshop", "technician", "robbie.naughton@example.com", false, "RN", "#6ad0f0"),
  P("t-cian", "Cian Molloy", "Apprentice technician", "Workshop", "technician", "cian.molloy@example.com", false, "CM", "#f0994b"),
  P("t-eoin", "Eoin Gaffney", "LCV technician", "Workshop", "technician", "eoin.gaffney@example.com", false, "EG", "#7fd8a4"),
  P("t-shane", "Shane Carthy", "HGV technician", "Workshop", "technician", "shane.carthy@example.com", false, "SC", "#e6c78a"),
  P("t-luke", "Luke Hanley", "Trailer technician", "Workshop", "technician", "luke.hanley@example.com", false, "LH", "#c8b4f0"),
  P("t-ronan", "Ronan Keville", "HGV technician", "Workshop", "technician", "ronan.keville@example.com", false, "RK", "#9fd6f0"),
  P("t-fionn", "Fionn Barrett", "Auto-electrician", "Workshop", "technician", "fionn.barrett@example.com", false, "FB", "#5fe0a8"),
  P("t-alan", "Alan Prendergast", "Apprentice technician", "Workshop", "technician", "alan.prendergast@example.com", false, "AP", "#6ad0f0"),
];

/** Monday attendance (from the sample Bizimply report). Reasons are never stored. */
export type Attendance = "present" | "absent" | "training";
export const ATTENDANCE: Record<string, Attendance> = {
  "t-cian": "absent",
  "t-luke": "absent",
  "t-alan": "training",
};

/* ---- companies (fictional demo customers + suppliers) -------------------- */
export interface Company {
  id: string;
  name: string;
  kind: "customer" | "supplier";
  type: string;
  contact: string;
  email: string;
}
export const COMPANIES: Company[] = [
  { id: "c-galway", name: "Galway Haulage", kind: "customer", type: "Fleet operator", contact: "Fergus Lally", email: "transport@example.com" },
  { id: "c-mayo", name: "Mayo Logistics", kind: "customer", type: "Courier company", contact: "Paula Jennings", email: "ops@example.com" },
  { id: "c-midlands", name: "Midlands Parcel Services", kind: "customer", type: "Courier company", contact: "Noel Grehan", email: "fleet@example.com" },
  { id: "c-westway", name: "Westway Electrical", kind: "customer", type: "Trade", contact: "Mags Donlon", email: "mags@example.com" },
  { id: "c-shannon", name: "Shannon Cold Chain", kind: "customer", type: "Fleet operator", contact: "Tadhg Ryan", email: "transport@example.com" },
  { id: "c-corrib", name: "Corrib Plant Hire", kind: "customer", type: "Fleet operator", contact: "Alan Finnerty", email: "accounts@example.com" },
  { id: "c-tuam", name: "Tuam Builders Providers", kind: "customer", type: "Trade", contact: "Mary Burke", email: "office@example.com" },
  { id: "c-boyle", name: "Boyle Agri Contracts", kind: "customer", type: "Agri", contact: "Seán Óg Regan", email: "seanog@example.com" },
  { id: "s-renault", name: "Renault Trucks (manufacturer)", kind: "supplier", type: "Manufacturer · Renault Genuine Parts", contact: "—", email: "—" },
  { id: "s-cvparts", name: "Midland CV Factors", kind: "supplier", type: "Parts factor (fictional)", contact: "Order desk", email: "orders@example.com" },
];

/* ---- customer-owned service vehicles ----------------------------------- */
export interface ServiceVehicle { id: string; reg: string; model: string; kind: string; customer: string }
const SV = (id: string, reg: string, model: string, kind: string, customer: string): ServiceVehicle => ({ id, reg, model, kind, customer });
export const SERVICE_VEHICLES: ServiceVehicle[] = [
  SV("C101", "181-G-4471", "Renault T480", "Tractor unit", "c-galway"),
  SV("C102", "191-LH-5530", "Renault D Wide", "Fridge rigid", "c-shannon"),
  SV("C103", "192-MO-882", "Renault Master", "Panel van", "c-mayo"),
  SV("C104", "201-G-1187", "Renault Trafic", "Van", "c-corrib"),
  SV("C105", "182-G-3302", "Renault T460", "Tractor unit", "c-galway"),
  SV("C106", "201-LH-772", "Renault D18", "Rigid", "c-shannon"),
  SV("C107", "211-MO-4410", "Renault Master", "Panel van", "c-mayo"),
  SV("C108", "202-G-6611", "Renault Master", "Tipper", "c-corrib"),
  SV("C109", "191-G-2018", "Renault Trafic", "Van", "c-tuam"),
  SV("C110", "221-LH-3390", "Renault D Wide", "Fridge rigid", "c-shannon"),
  SV("C111", "172-RN-505", "Renault Master", "Tail-lift box", "c-boyle"),
  SV("C112", "201-G-8840", "Renault T480", "Tractor unit", "c-galway"),
  SV("C113", "191-G-7720", "Renault T460", "Tractor unit", "c-galway"),
  SV("C114", "182-MO-1162", "Renault D14", "Rigid", "c-mayo"),
  SV("C115", "212-G-4407", "Renault Trafic", "Crew van", "c-corrib"),
  SV("C116", "171-G-9931", "Renault Master", "Dropside", "c-tuam"),
  SV("C117", "192-LH-2251", "Renault D18", "Rigid", "c-shannon"),
  SV("C118", "201-G-3318", "Renault Master", "Luton box", "c-tuam"),
  SV("C119", "211-G-6604", "Renault T460", "Tractor unit", "c-galway"),
  SV("C120", "221-MO-117", "Renault Master", "Panel van", "c-mayo"),
  SV("C121", "202-RN-880", "Renault Master", "Panel van", "c-boyle"),
  SV("C122", "181-LH-4419", "Renault D Wide", "Fridge rigid", "c-shannon"),
  SV("C123", "191-G-5502", "Renault T480", "Tractor unit", "c-galway"),
  SV("C124", "201-MO-2290", "Renault Master", "Panel van", "c-mayo"),
  SV("C125", "182-RN-337", "Renault D14", "Tipper", "c-boyle"),
  SV("C126", "211-LH-6681", "Renault D18", "Rigid", "c-shannon"),
  SV("C127", "171-G-3376", "Renault T460", "Tractor unit", "c-galway"),
  SV("C128", "192-G-1101", "Renault Trafic", "Van", "c-corrib"),
  SV("C129", "201-G-7745", "Renault Master", "Dropside", "c-tuam"),
  SV("C130", "212-G-1250", "Renault Trafic", "Van", "c-tuam"),
  SV("C131", "201-LH-3307", "Renault D18", "Rigid", "c-shannon"),
  SV("C132", "191-G-6618", "Renault T480", "Tractor unit", "c-galway"),
  SV("C133", "202-RN-2214", "Renault Master", "Tipper", "c-boyle"),
  SV("C134", "181-G-4033", "Renault Trafic", "Van", "c-corrib"),
  SV("C135", "211-MO-882", "Renault Master", "Panel van", "c-mayo"),
  SV("C136", "201-WH-1712", "Renault Master", "Panel van", "c-midlands"),
];

/* ---- dealership stock -----------------------------------------------------
   status: available | reserved | preparation | incoming | sold
   VINs are clearly fictional demo identifiers (prefixed DEMO). Technical
   values are sample data, not authoritative Renault specifications. */
export type StockStatus = "available" | "reserved" | "preparation" | "incoming" | "sold";
export type SpecStatus = "approved" | "missing" | "review";
export interface CostLine { label: string; amount: number }
export interface Vehicle {
  id: string;
  model: string;
  variant: string;
  range: "Master" | "Trafic" | "Trucks" | "Used & trade-in";
  status: StockStatus;
  vin: string | null;
  svo: string;
  reg: string;
  colour: string;
  gearbox: string;
  power: string;
  location: string;
  customer: string | null;
  promisedTo?: string | null;
  jobRef: string | null;
  eta?: string;
  receivedDaysAgo?: number;
  costs: CostLine[];
  rebate: { amount: number; includedInStanding: boolean } | null;
  specStatus: SpecStatus;
  notes: string;
  folderUrl: string;
  sold?: { amount: number; buyer: string; date: string; checklist: Record<string, boolean> };
  reviewFlag?: string | null;
}

const vin = (n: number) => "DEMO" + String(9000000 + n * 7919).slice(0, 7) + "RC" + String(n).padStart(4, "0");

function mkStock(): Vehicle[] {
  const out: Vehicle[] = [];
  const base = (o: Partial<Vehicle> & Pick<Vehicle, "id" | "model" | "variant" | "status">, n: number, cost: number, prep = 450): Vehicle => ({
    range: o.model === "Master" ? "Master" : o.model === "Trafic" ? "Trafic" : "Trucks",
    vin: vin(n),
    svo: "SVO-" + (40100 + n),
    reg: "",
    colour: "White",
    gearbox: "Manual",
    power: "",
    location: "Main yard",
    customer: null,
    jobRef: null,
    costs: [
      { label: "Base vehicle", amount: cost },
      { label: "Preparation (PDI, valet)", amount: prep },
    ],
    rebate: null,
    specStatus: "approved",
    notes: "",
    folderUrl: "",
    ...o,
  });
  // 10 available
  const avail: [string, string, string, number, string, string, string][] = [
    ["V001", "Master", "LH35 panel van", 28500, "Manual", "135 hp", "White"],
    ["V002", "Master", "LH35 crew van", 31200, "Manual", "150 hp", "Grey"],
    ["V003", "Trafic", "SL30 van", 26900, "Manual", "130 hp", "White"],
    ["V004", "Trafic", "LL30 van", 27400, "Auto", "150 hp", "Silver"],
    ["V005", "D18", "Rigid 4x2", 64800, "Auto", "280 hp", "White"],
    ["V006", "Master", "Single-cab tipper", 36200, "Manual", "165 hp", "White"],
    ["V007", "Trafic", "SL28 van", 25900, "Manual", "110 hp", "Blue"],
    ["V009", "Master", "Luton box", 38900, "Manual", "165 hp", "White"],
    ["V010", "D14", "Rigid 4x2", 58600, "Auto", "240 hp", "White"],
    ["V011", "Trafic", "Crew van", 29100, "Manual", "130 hp", "Grey"],
  ];
  avail.forEach(([id, model, variant, cost, gb, pw, col], i) =>
    out.push(base({ id, model, variant, status: "available", gearbox: gb, power: pw, colour: col, receivedDaysAgo: 12 + i * 9, location: i % 3 === 1 ? "Front line" : "Main yard", reg: "" }, i + 1, cost)));
  // 5 reserved
  out.push(base({ id: "V012", model: "Master", variant: "LH35 panel van", status: "reserved", customer: "c-galway", receivedDaysAgo: 21, notes: "Deposit taken" }, 12, 29800));
  out.push(base({ id: "V013", model: "D18", variant: "Rigid 4x2 curtain", status: "reserved", customer: "c-shannon", receivedDaysAgo: 18, notes: "Body build complete" }, 13, 66400));
  out.push(base({ id: "V014", model: "Trafic", variant: "SL30 van", status: "reserved", customer: "c-tuam", receivedDaysAgo: 9, notes: "Awaiting finance documents" }, 14, 27200));
  out.push(base({ id: "V015", model: "Master", variant: "Dropside", status: "reserved", customer: "c-corrib", receivedDaysAgo: 30, notes: "Quote Q-1038 open" }, 15, 35600));
  out.push({
    ...base({ id: "V008", model: "Master", variant: "Used panel van (2017)", status: "reserved", customer: "c-midlands", jobRef: "JOB-1046", reg: "171-WH-2290", receivedDaysAgo: 26, notes: "Used van — handover blocked by failed CVRT and open repair" }, 8, 11800, 600),
    range: "Used & trade-in",
    vin: vin(8),
  });
  // 3 in preparation
  out.push(base({ id: "V016", model: "Master", variant: "LH35 panel van", status: "preparation", jobRef: "JOB-1055", receivedDaysAgo: 4, notes: "PDI booked today" }, 16, 28800, 600));
  out.push(base({ id: "V017", model: "Trafic", variant: "LL30 van", status: "preparation", receivedDaysAgo: 3, notes: "Valet and racking" }, 17, 26600, 600));
  out.push(base({ id: "V018", model: "D18", variant: "Rigid 4x2", status: "preparation", receivedDaysAgo: 5, notes: "Tail-lift fit" }, 18, 63200, 900));
  // 8 incoming — V019 promised to a customer, V024 has no spec (Q-1042)
  out.push(base({ id: "V019", model: "Master", variant: "Chassis cab", status: "incoming", vin: null, eta: "2026-10-24", promisedTo: "c-mayo", notes: "Promised to Mayo Logistics for 28 Oct delivery", svo: "SVO-40119" }, 19, 27500));
  out.push(base({ id: "V020", model: "Trafic", variant: "SL30 van", status: "incoming", eta: "2026-10-27", specStatus: "missing" }, 20, 26700));
  out.push(base({ id: "V021", model: "Master", variant: "Luton box", status: "incoming", eta: "2026-11-03", specStatus: "missing" }, 21, 38400));
  out.push(base({ id: "V022", model: "D18", variant: "Rigid 4x2", status: "incoming", eta: "2026-11-05", specStatus: "missing" }, 22, 64200));
  out.push(base({ id: "V023", model: "Master", variant: "Single-cab tipper", status: "incoming", eta: "2026-10-30" }, 23, 36600));
  out.push({
    ...base({ id: "V024", model: "Master", variant: "Chassis cab", status: "incoming", eta: "2026-10-20", specStatus: "missing", notes: "Due 20 Oct — no approved specification sheet", colour: "White", gearbox: "Manual", power: "150 hp" }, 24, 26500, 500),
    costs: [
      { label: "Base vehicle", amount: 26500 },
      { label: "Body / conversion", amount: 2000 },
      { label: "Preparation", amount: 500 },
    ],
  });
  out.push(base({ id: "V025", model: "Trafic", variant: "Crew van", status: "incoming", eta: "2026-11-10", specStatus: "missing" }, 25, 29400));
  out.push(base({ id: "V026", model: "D14", variant: "Rigid 4x2", status: "incoming", eta: "2026-11-12", specStatus: "missing" }, 26, 58200));
  // 4 confirmed sold — kept out of active totals
  const sold: [string, string, string, number, string, string][] = [
    ["V027", "Master", "LH35 panel van", 33400, "c-tuam", "2026-10-09"],
    ["V028", "Trafic", "SL30 van", 30100, "c-corrib", "2026-10-12"],
    ["V029", "D18", "Rigid 4x2", 71800, "c-shannon", "2026-10-14"],
    ["V030", "Master", "Dropside", 39200, "c-boyle", "2026-10-16"],
  ];
  sold.forEach(([id, model, variant, amount, buyer, date], i) =>
    out.push({
      ...base({ id, model, variant, status: "sold", reg: "262-WH-" + (101 + i) }, 27 + i, amount - 4200),
      sold: { amount, buyer, date, checklist: { "Registration date": true, Warranty: true, "Documents signed": i !== 1, "Transfer to DMS (simulated)": false } },
    }));
  return out;
}
export const STOCK: Vehicle[] = mkStock();

/** Next sample order book: two new incoming units, three ETA changes, V019 absent. */
export const ORDER_BOOK_NEXT = {
  importId: "RNL-OB-2026-10-19",
  file: "renault-order-book-19-oct.xlsx (sample)",
  previousFile: "renault-order-book-12-oct.xlsx (sample)",
  previousDate: "Mon 12 Oct",
  date: "Mon 19 Oct",
  rows: 27,
  added: [
    { id: "V031", model: "Master", variant: "LH35 panel van", eta: "2026-11-18", svo: "SVO-40131", cost: 28900 },
    { id: "V032", model: "Trafic", variant: "LL30 crew van", eta: "2026-11-20", svo: "SVO-40132", cost: 29800 },
  ],
  etaChanges: [
    { id: "V020", from: "2026-10-27", to: "2026-11-04" },
    { id: "V022", from: "2026-11-05", to: "2026-10-29" },
    { id: "V025", from: "2026-11-10", to: "2026-11-24" },
  ],
  missing: ["V019"],
};

/* ---- workshop jobs ------------------------------------------------------- */
export type JobStatus = "queued" | "in_progress" | "awaiting_parts" | "awaiting_qc" | "completed";
export type WorkType = "General workshop" | "CVRT preparation" | "Auto-electrical";
export interface Job {
  id: string;
  status: JobStatus;
  tech: string | null;
  customer: string;
  vehicle: string; // service vehicle id or stock id
  complaint: string;
  workType: WorkType;
  budgetMin: number;
  start?: string; // clock-on time today (in-progress)
  stoppedElapsed?: number; // minutes when work stopped (parts/QC/completed)
  plannedStart?: string; // scheduled start (queued, assigned)
  hopper?: boolean;
  net?: number;
  invoice?: "ready" | "blocked";
  partBlocker?: { part: string; eta: string; owner: string; supplier: string; received: boolean };
  notes?: string;
  blockers?: string;
}
const J = (o: Job): Job => o;
export const JOBS: Job[] = [
  // Billy's live job + his next
  J({ id: "JOB-1042", status: "in_progress", tech: "t-billy", customer: "c-galway", vehicle: "C101", complaint: "Brake warning investigation — findings not yet confirmed", workType: "General workshop", budgetMin: 120, start: "08:15" }),
  J({ id: "JOB-1043", status: "queued", tech: "t-billy", customer: "c-mayo", vehicle: "C103", complaint: "Scheduled service + brake check", workType: "General workshop", budgetMin: 90, plannedStart: "10:15" }),
  // Four unassigned hopper cards
  J({ id: "JOB-1050", status: "queued", hopper: true, tech: null, customer: "c-corrib", vehicle: "C108", complaint: "Clutch slipping under load", workType: "General workshop", budgetMin: 150 }),
  J({ id: "JOB-1051", status: "queued", hopper: true, tech: null, customer: "c-tuam", vehicle: "C109", complaint: "CVRT preparation — brakes and lights", workType: "CVRT preparation", budgetMin: 120 }),
  J({ id: "JOB-1052", status: "queued", hopper: true, tech: null, customer: "c-shannon", vehicle: "C110", complaint: "Fridge unit electrical fault", workType: "Auto-electrical", budgetMin: 180, blockers: "Fridge body supplier wiring diagram requested" }),
  J({ id: "JOB-1053", status: "queued", hopper: true, tech: null, customer: "c-boyle", vehicle: "C111", complaint: "Tail-lift not raising", workType: "General workshop", budgetMin: 120 }),
  // Three more future assignments (queued total = 8)
  J({ id: "JOB-1054", status: "queued", tech: "t-sean", customer: "c-galway", vehicle: "C112", complaint: "Air leak diagnosis", workType: "General workshop", budgetMin: 90, plannedStart: "11:00" }),
  J({ id: "JOB-1055", status: "queued", tech: "t-conor", customer: "c-westway", vehicle: "V016", complaint: "Pre-delivery inspection", workType: "General workshop", budgetMin: 120, plannedStart: "13:00" }),
  J({ id: "JOB-1056", status: "queued", tech: "t-rachel", customer: "c-galway", vehicle: "C113", complaint: "Trailer lighting fault", workType: "Auto-electrical", budgetMin: 90, plannedStart: "12:00" }),
  // Nine more in progress (10 total)
  J({ id: "JOB-1060", status: "in_progress", tech: "t-conor", customer: "c-shannon", vehicle: "C106", complaint: "Oil service + filters", workType: "General workshop", budgetMin: 120, start: "09:10" }),
  J({ id: "JOB-1062", status: "in_progress", tech: "t-mark", customer: "c-mayo", vehicle: "C114", complaint: "Brake overhaul, rear axle", workType: "General workshop", budgetMin: 240, start: "07:30" }),
  J({ id: "JOB-1063", status: "in_progress", tech: "t-padraig", customer: "c-corrib", vehicle: "C115", complaint: "Timing belt replacement", workType: "General workshop", budgetMin: 210, start: "09:00" }),
  J({ id: "JOB-1069", status: "in_progress", tech: "t-dylan", customer: "c-tuam", vehicle: "C116", complaint: "CVRT preparation before 11:30 test", workType: "CVRT preparation", budgetMin: 90, start: "09:30" }),
  J({ id: "JOB-1064", status: "in_progress", tech: "t-robbie", customer: "c-shannon", vehicle: "C117", complaint: "DPF regeneration fault", workType: "General workshop", budgetMin: 180, start: "08:00" }),
  J({ id: "JOB-1065", status: "in_progress", tech: "t-eoin", customer: "c-tuam", vehicle: "C118", complaint: "Suspension airbag replacement", workType: "General workshop", budgetMin: 150, start: "09:20" }),
  J({ id: "JOB-1066", status: "in_progress", tech: "t-shane", customer: "c-galway", vehicle: "C119", complaint: "Gearbox oil leak", workType: "General workshop", budgetMin: 120, start: "08:32" }),
  J({ id: "JOB-1067", status: "in_progress", tech: "t-ronan", customer: "c-mayo", vehicle: "C120", complaint: "Wheel alignment + tyres", workType: "General workshop", budgetMin: 90, start: "09:30" }),
  J({ id: "JOB-1068", status: "in_progress", tech: "t-fionn", customer: "c-boyle", vehicle: "C121", complaint: "Reversing camera install", workType: "Auto-electrical", budgetMin: 120, start: "09:05" }),
  // Three awaiting parts — JOB-1046 is the V008 CVRT repair
  J({ id: "JOB-1046", status: "awaiting_parts", tech: "t-conor", customer: "c-midlands", vehicle: "V008", complaint: "Rear brake caliper seized — CVRT fail repair", workType: "CVRT preparation", budgetMin: 150, stoppedElapsed: 45,
    partBlocker: { part: "Brake caliper, rear O/S", eta: "11:30", owner: "p-darren", supplier: "Renault Genuine Parts", received: false } }),
  J({ id: "JOB-1047", status: "awaiting_parts", tech: "t-mark", customer: "c-shannon", vehicle: "C122", complaint: "Alternator replacement", workType: "Auto-electrical", budgetMin: 120, stoppedElapsed: 30,
    partBlocker: { part: "Alternator 150A", eta: "14:00", owner: "p-darren", supplier: "Midland CV Factors", received: false } }),
  J({ id: "JOB-1048", status: "awaiting_parts", tech: "t-padraig", customer: "c-corrib", vehicle: "C104", complaint: "Headlamp unit replacement — CVRT fail repair", workType: "CVRT preparation", budgetMin: 90, stoppedElapsed: 20,
    partBlocker: { part: "Headlamp unit, N/S", eta: "Tomorrow 09:00", owner: "p-darren", supplier: "Renault Genuine Parts", received: false } }),
  // Three awaiting quality check
  J({ id: "JOB-1070", status: "awaiting_qc", tech: "t-robbie", customer: "c-galway", vehicle: "C123", complaint: "Full service + CVRT prep", workType: "CVRT preparation", budgetMin: 180, stoppedElapsed: 175 }),
  J({ id: "JOB-1071", status: "awaiting_qc", tech: "t-eoin", customer: "c-mayo", vehicle: "C124", complaint: "Brake pads + discs, front", workType: "General workshop", budgetMin: 120, stoppedElapsed: 118 }),
  J({ id: "JOB-1072", status: "awaiting_qc", tech: "t-shane", customer: "c-boyle", vehicle: "C125", complaint: "Steering box replacement", workType: "General workshop", budgetMin: 210, stoppedElapsed: 205 }),
  // Six completed, awaiting invoicing: 650 + 780 + 940 + 520 + 450 + 500 = €3,840
  J({ id: "JOB-1040", status: "completed", invoice: "ready", net: 650, tech: "t-ronan", customer: "c-shannon", vehicle: "C126", complaint: "Oil service", workType: "General workshop", budgetMin: 90, stoppedElapsed: 88 }),
  J({ id: "JOB-1041", status: "completed", invoice: "blocked", net: 780, tech: "t-conor", customer: "c-shannon", vehicle: "C102", complaint: "Service + front brake inspection", workType: "General workshop", budgetMin: 240, stoppedElapsed: 240,
    notes: "Oil + oil filter changed. Front pads inspected; no replacement needed. Wipers not checked." }),
  J({ id: "JOB-1044", status: "completed", invoice: "ready", net: 940, tech: "t-mark", customer: "c-galway", vehicle: "C127", complaint: "Clutch replacement", workType: "General workshop", budgetMin: 300, stoppedElapsed: 290 }),
  J({ id: "JOB-1045", status: "completed", invoice: "ready", net: 520, tech: "t-padraig", customer: "c-corrib", vehicle: "C128", complaint: "Exhaust repair", workType: "General workshop", budgetMin: 90, stoppedElapsed: 85 }),
  J({ id: "JOB-1049", status: "completed", invoice: "blocked", net: 450, tech: "t-robbie", customer: "c-tuam", vehicle: "C129", complaint: "Electrical diagnosis", workType: "Auto-electrical", budgetMin: 60, stoppedElapsed: 62,
    notes: "Traced intermittent fault to corroded earth strap behind cab. Cleaned + re-terminated. Tested OK." }),
  J({ id: "JOB-1073", status: "completed", invoice: "blocked", net: 500, tech: "t-eoin", customer: "c-mayo", vehicle: "C107", complaint: "Brake repair before retest", workType: "CVRT preparation", budgetMin: 60, stoppedElapsed: 58,
    notes: "Rear brake pipe replaced N/S. Bled system. Pedal firm." }),
];

/** Fixed sample job-card records behind the draft values. Not generated from prose. */
export const JOB_CARD_FACTS: Record<string, { labourHours: number; partsNet: number; supported: string[]; questions: { q: string; options: string[] }[] }> = {
  "JOB-1041": {
    labourHours: 4, partsNet: 460,
    supported: ["Engine oil and oil filter replaced", "Front brake pads inspected — within limits, no replacement needed"],
    questions: [
      { q: "Were the front pads replaced?", options: ["No — inspected only", "Yes — replaced"] },
      { q: "Were the wipers checked?", options: ["Not checked — leave off the job card", "Checked — OK"] },
    ],
  },
  "JOB-1049": {
    labourHours: 2.5, partsNet: 250,
    supported: ["Intermittent electrical fault traced to corroded cab earth strap", "Earth strap cleaned and re-terminated; system tested"],
    questions: [{ q: "Was a new earth strap fitted or the existing one re-used?", options: ["Existing strap re-terminated", "New strap fitted"] }],
  },
  "JOB-1073": {
    labourHours: 2, partsNet: 340,
    supported: ["Rear N/S brake pipe replaced", "Brake system bled; pedal checked"],
    questions: [{ q: "Was a brake efficiency check recorded?", options: ["Yes — roller test passed", "No — retest will confirm"] }],
  },
};

/** Sample job-card import for the estimator (V02). OEM / Haynes columns are local examples. */
export const SAMPLE_OPERATIONS = [
  { op: "Engine oil and filter — replace", note: "15W-40, 9.5 L", oem: 0.8, haynes: 1.0 },
  { op: "Front brake pads — inspect", note: "Measure and record", oem: 0.4, haynes: 0.5 },
  { op: "Front brake pads — replace (if required)", note: "Axle set", oem: 1.6, haynes: 1.8 },
  { op: "Air filter — replace", note: "", oem: 0.3, haynes: 0.4 },
  { op: "General service inspection", note: "Lights, tyres, fluids", oem: 1.0, haynes: 1.2 },
];

/* ---- CVRT today: 7 scheduled + 2 awaiting repair + 1 awaiting retest + 2 completed */
export type CvrtStatus = "scheduled" | "awaiting_repair" | "awaiting_retest" | "completed";
export interface CvrtBooking {
  id: string; vehicle: string; customer: string; time: string; lane: string; owner: string;
  status: CvrtStatus; result?: "pass" | "fail" | null; repairJob?: string; failItems?: string[]; evidence?: string;
}
export const CVRT: CvrtBooking[] = [
  { id: "T-301", vehicle: "C105", customer: "c-galway", time: "08:30", lane: "Lane 1", owner: "p-elizabeth", status: "completed", result: "pass", evidence: "Sample test sheet T-301" },
  { id: "T-302", vehicle: "C131", customer: "c-shannon", time: "09:00", lane: "Lane 1", owner: "p-elizabeth", status: "completed", result: "pass", evidence: "Sample test sheet T-302" },
  { id: "T-303", vehicle: "V008", customer: "c-midlands", time: "09:30", lane: "Lane 2", owner: "p-elizabeth", status: "awaiting_repair", result: "fail", repairJob: "JOB-1046", failItems: ["Rear O/S brake imbalance", "Brake caliper seized"], evidence: "Sample test sheet T-303" },
  { id: "T-304", vehicle: "C104", customer: "c-corrib", time: "08:45", lane: "Lane 2", owner: "p-elizabeth", status: "awaiting_repair", result: "fail", repairJob: "JOB-1048", failItems: ["Headlamp unit damaged, N/S"], evidence: "Sample test sheet T-304" },
  { id: "T-305", vehicle: "C107", customer: "c-mayo", time: "11:00", lane: "Lane 1", owner: "p-elizabeth", status: "awaiting_retest", result: "fail", repairJob: "JOB-1073", failItems: ["Brake pipe corrosion, rear N/S"], evidence: "Sample test sheet T-305 (original fail)" },
  { id: "T-306", vehicle: "C116", customer: "c-tuam", time: "11:30", lane: "Lane 1", owner: "p-s7", status: "scheduled" },
  { id: "T-307", vehicle: "C130", customer: "c-tuam", time: "12:00", lane: "Lane 2", owner: "p-s7", status: "scheduled" },
  { id: "T-308", vehicle: "C132", customer: "c-galway", time: "13:00", lane: "Lane 1", owner: "p-s7", status: "scheduled" },
  { id: "T-309", vehicle: "C133", customer: "c-boyle", time: "13:30", lane: "Lane 2", owner: "p-s7", status: "scheduled" },
  { id: "T-310", vehicle: "C134", customer: "c-corrib", time: "14:00", lane: "Lane 1", owner: "p-s7", status: "scheduled" },
  { id: "T-311", vehicle: "C135", customer: "c-mayo", time: "14:30", lane: "Lane 2", owner: "p-s7", status: "scheduled" },
  { id: "T-312", vehicle: "C136", customer: "c-midlands", time: "15:00", lane: "Lane 1", owner: "p-s7", status: "scheduled" },
];

/* ---- sales -------------------------------------------------------------- */
export interface QuoteLine { id: string; label: string; amount: number; group: "vehicle" | "options" | "delivery" }
export interface Quote {
  id: string; customer: string; owner: string; vehicle: string | null; stage: QuoteStage; date: string;
  lines: QuoteLine[]; discount: number; warranty: string; nextAction: string; due: string;
  tradeIn: { on: boolean; reg: string; model: string; allowance: number; settlement: number };
  finance: { on: boolean; provider: string; deposit: number; financed: number; term: number; repayment: number };
}
export type QuoteStage = "Enquiry" | "Quoted" | "Approval" | "Reserved" | "Won";
export const QUOTES: Quote[] = [
  {
    id: "Q-1042", customer: "c-westway", owner: "p-jack", vehicle: "V024", stage: "Approval", date: "19 Oct 2026",
    lines: [
      { id: "l1", label: "Renault Master chassis cab (V024)", amount: 32500, group: "vehicle" },
      { id: "l2", label: "Tow bar + 13-pin electrics", amount: 650, group: "options" },
      { id: "l3", label: "Reversing camera", amount: 600, group: "options" },
      { id: "l4", label: "Delivery and pre-delivery preparation", amount: 750, group: "delivery" },
    ],
    discount: 500, warranty: "Renault manufacturer warranty (sample description)", nextAction: "Discount approval + specification", due: "Today",
    tradeIn: { on: false, reg: "", model: "", allowance: 0, settlement: 0 },
    finance: { on: false, provider: "", deposit: 0, financed: 0, term: 0, repayment: 0 },
  },
  { id: "Q-1038", customer: "c-corrib", owner: "p-jack", vehicle: "V015", stage: "Quoted", date: "14 Oct 2026",
    lines: [{ id: "l1", label: "Renault Master dropside (V015)", amount: 39800, group: "vehicle" }, { id: "l2", label: "Delivery", amount: 500, group: "delivery" }],
    discount: 0, warranty: "Manufacturer warranty", nextAction: "Follow up on decision", due: "Wed 21 Oct",
    tradeIn: { on: false, reg: "", model: "", allowance: 0, settlement: 0 }, finance: { on: false, provider: "", deposit: 0, financed: 0, term: 0, repayment: 0 } },
  { id: "Q-1040", customer: "c-tuam", owner: "p-jack", vehicle: "V014", stage: "Reserved", date: "8 Oct 2026",
    lines: [{ id: "l1", label: "Renault Trafic SL30 (V014)", amount: 30900, group: "vehicle" }, { id: "l2", label: "Ply-lining", amount: 800, group: "options" }, { id: "l3", label: "Delivery", amount: 500, group: "delivery" }],
    discount: 0, warranty: "Manufacturer warranty", nextAction: "Collect finance documents", due: "Thu 22 Oct",
    tradeIn: { on: false, reg: "", model: "", allowance: 0, settlement: 0 }, finance: { on: false, provider: "", deposit: 0, financed: 0, term: 0, repayment: 0 } },
  { id: "Q-1036", customer: "c-galway", owner: "p-jack", vehicle: "V012", stage: "Reserved", date: "1 Oct 2026",
    lines: [{ id: "l1", label: "Renault Master LH35 (V012)", amount: 33900, group: "vehicle" }, { id: "l2", label: "Delivery", amount: 500, group: "delivery" }],
    discount: 0, warranty: "Manufacturer warranty", nextAction: "Book handover", due: "Fri 23 Oct",
    tradeIn: { on: false, reg: "", model: "", allowance: 0, settlement: 0 }, finance: { on: false, provider: "", deposit: 0, financed: 0, term: 0, repayment: 0 } },
  { id: "Q-1041", customer: "c-boyle", owner: "p-jack", vehicle: null, stage: "Enquiry", date: "17 Oct 2026",
    lines: [], discount: 0, warranty: "", nextAction: "Match a tipper from stock", due: "Tue 20 Oct",
    tradeIn: { on: false, reg: "", model: "", allowance: 0, settlement: 0 }, finance: { on: false, provider: "", deposit: 0, financed: 0, term: 0, repayment: 0 } },
];

/* ---- receivables (imported total balances, fictional customers) ---------- */
export interface Receivable { id: string; customer: string; amount: number; due: string; owner: string }
export const RECEIVABLES: Receivable[] = [
  { id: "INV-2041", customer: "c-corrib", amount: 4800, due: "2026-10-02", owner: "p-caroline" },
  { id: "INV-2047", customer: "c-boyle", amount: 3600, due: "2026-10-09", owner: "p-caroline" },
  { id: "INV-2052", customer: "c-tuam", amount: 2400, due: "2026-10-16", owner: "p-s1" },
  { id: "INV-2058", customer: "c-shannon", amount: 7200, due: "2026-10-30", owner: "p-s1" },
];

/* ---- morning meeting sections: nine configurable, five enabled by default */
export const MEETING_SECTIONS = [
  { id: "greeting", label: "Greeting", enabled: true, observed: true },
  { id: "events", label: "Events", enabled: true, observed: true },
  { id: "downtime", label: "Downtime", enabled: false, observed: false },
  { id: "updates", label: "Updates", enabled: false, observed: false },
  { id: "readiness", label: "Readiness", enabled: true, observed: true },
  { id: "preview", label: "Preview", enabled: true, observed: true },
  { id: "photos", label: "Photos", enabled: true, observed: true },
  { id: "focus", label: "Focus", enabled: false, observed: false },
  { id: "board3s", label: "3S Board", enabled: false, observed: true },
];

export const SAFETY = { lastIncident: "2026-08-28", note: "Seeded demo date — not a company record" };
export const ON_CALL = { thisWeek: "t-shane", nextWeek: "t-robbie", van: "Breakdown van BRK-1" };

/* ---- agents (§10) --------------------------------------------------------- */
export const AGENTS = [
  { id: "briefing", name: "Briefing", purpose: "Compiles cross-business status with links to evidence; drafts the morning meeting and an executive briefing.", sources: ["Jobs", "Clocking", "Stock", "CVRT", "Finance"], limit: "Drafts only. Never claims an external action happened." },
  { id: "watchdog", name: "Ops Watchdog", purpose: "Flags present-but-unallocated technicians, approaching budgets, overdue blockers and stale source data.", sources: ["Clocking", "Attendance", "Jobs"], limit: "Flags only. Excludes breaks, leave and training." },
  { id: "jobcard", name: "Job Card Assistant", purpose: "Turns verified notes into readable descriptions, shows missing facts and prepares a review.", sources: ["Job notes", "Job record"], limit: "Cannot invent work, parts or measurements. Cannot approve its own draft." },
  { id: "stockspec", name: "Stock & Specification", purpose: "Prepares import diffs, flags missing VINs/documents and matches sample attachments.", sources: ["Order book", "Stock", "Documents"], limit: "Missing rows never create sales. No Renault portal access." },
  { id: "sales", name: "Sales Assistant", purpose: "Prefills quotes and draft document packs, highlights discounts needing approval and creates follow-up tasks.", sources: ["Quotes", "Stock", "Customers"], limit: "Cannot approve discounts, invent options or send messages." },
  { id: "finance", name: "Finance Assistant", purpose: "Summarises invoice readiness and imported balances, drafts reminders and points to missing evidence.", sources: ["Completed jobs", "Receivables"], limit: "Never posts invoices, changes a ledger or marks payment received." },
  { id: "handover", name: "Handover Coordinator", purpose: "Combines sales, workshop, parts, test, document and accounts gates and explains the next owner and action.", sources: ["Handovers", "Jobs", "CVRT", "Parts"], limit: "Cannot certify roadworthiness or override an unresolved gate." },
];

/* ---- Friday 16 Oct clocking (complete day) -------------------------------
   paid 120.0 = job 94.0 + breaks 7.5 + internal 5.5 + unallocated 13.0
   Every technician attended 08:00–16:00 (8.0 h, break 12:30–13:00). */
export const FRIDAY_UNALLOC: Record<string, number> = {
  "t-billy": 2.0, "t-sean": 1.5, "t-rachel": 1.5, "t-conor": 1.25, "t-mark": 1.0, "t-padraig": 1.0, "t-dylan": 1.0,
  "t-robbie": 0.75, "t-cian": 0.75, "t-eoin": 0.75, "t-shane": 0.5, "t-luke": 0.5, "t-ronan": 0.5, "t-fionn": 0, "t-alan": 0,
};
export const FRIDAY_INTERNAL: Record<string, number> = {
  "t-billy": 0.5, "t-sean": 0.5, "t-rachel": 0.5, "t-conor": 0.5, "t-mark": 0.5, "t-padraig": 0.5, "t-dylan": 0.5,
  "t-robbie": 0.5, "t-cian": 0.5, "t-eoin": 0.5, "t-shane": 0.5, "t-luke": 0, "t-ronan": 0, "t-fionn": 0, "t-alan": 0,
};
