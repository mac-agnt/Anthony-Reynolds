/* ─────────────────────────────────────────────────────────────────────────
   Reynolds Commercials — canonical demo fixture store.

   One typed source of truth. Every screen derives its numbers from here through
   the selectors at the bottom; no screen keeps its own copy of a customer,
   vehicle, job, quote or total. All operational figures are fictional demo
   scenarios (see CLAUDE brief §1). Real company facts (name, address, roles,
   emails) are marked and kept apart from the invented operating data.

   Demo snapshot is frozen at Monday 19 October 2026, 10:00 Europe/Dublin.
   ───────────────────────────────────────────────────────────────────────── */

/* ---- company (verified public facts) ------------------------------------ */
export const COMPANY = {
  name: "Reynolds Commercials",
  legalNote: "Legal entity and registration not verified — left unset",
  address: "Tones Road, Walderstown, Athlone, Co. Westmeath, N37 EH24",
  website: "reynoldscommercials.ie",
  timezone: "Europe/Dublin",
  currency: "EUR",
  founded: "1993",
  about: "Family commercial-vehicle business. Renault Trucks dealership, SIMI member and RSA-authorised CVRT centre. New and used commercials, servicing, repairs, genuine parts and fleet support.",
  logoUrl: "/reynolds-logo.png"
};

/* The demo clock. Frozen; one explicit simulation control may advance it. */
export const DEMO_CLOCK = {
  iso: "2026-10-19T10:00:00+01:00",
  date: new Date("2026-10-19T10:00:00+01:00"),
  label: "Mon 19 Oct 2026 · 10:00",
  short: "Demo snapshot · 10:00",
  day: "Monday 19 October"
};

export const SOURCES = {
  assetminder: "Sample AssetMinder export",
  sage: "Sample Sage snapshot",
  bizimply: "Sample Bizimply report",
  renault: "Sample Renault order book"
};

/* The charge rate is an explicit assumption, not a company rate. */
export const RATE = 80; // €/hour, illustrative
export const DISCOUNT_APPROVAL_THRESHOLD = 250; // configurable demo policy

/* ---- people -------------------------------------------------------------- */
/* role: management | parts | sales | cvrt | accounts | service | technician | support
   verified: true  = real public role + public business email (display only)
             false = fictional demo employee (example.com address)
   onDemo: a featured scenario person. */
export const STAFF = [
  // 7 verified management / team contacts (part of the 15 support roles)
  {id:"p-paul", name:"Paul Reynolds", role:"Managing Director", dept:"Management", kind:"support", email:"paul@reynoldscommercials.ie", verified:true, initials:"PR", tint:"#2034AB"},
  {id:"p-anthony", name:"Anthony Reynolds", role:"Operations Manager", dept:"Management", kind:"support", email:"anthony@reynoldscommercials.ie", verified:true, initials:"AR", tint:"#6C8CFF", isUser:true},
  {id:"p-caroline", name:"Caroline Glynn", role:"Financial Controller", dept:"Accounts", kind:"support", email:"caroline@reynoldscommercials.ie", verified:true, initials:"CG", tint:"#7fd8a4"},
  {id:"p-darren", name:"Darren O'Brien", role:"Parts Manager", dept:"Parts", kind:"support", email:"darren@reynoldscommercials.ie", verified:true, initials:"DO", tint:"#f0994b"},
  {id:"p-jonathan", name:"Jonathan Keenan", role:"Service Manager", dept:"Workshop", kind:"support", email:"jonathan@reynoldscommercials.ie", verified:true, initials:"JK", tint:"#6ad0f0"},
  {id:"p-elizabeth", name:"Elizabeth Reynolds", role:"CVRT Manager", dept:"CVRT", kind:"support", email:"elizabeth@reynoldscommercials.ie", verified:true, initials:"ER", tint:"#c8b4f0"},
  {id:"p-jack", name:"Jack Kelly", role:"LCV Sales Executive", dept:"Sales", kind:"support", email:"jack@reynoldscommercials.ie", verified:true, initials:"JaK", tint:"#e6c78a"},
  // 8 more fictional support staff
  {id:"p-s1", name:"Órla Hughes", role:"Accounts assistant", dept:"Accounts", kind:"support", email:"orla.hughes@example.com", verified:false, initials:"OH", tint:"#9fd6f0"},
  {id:"p-s2", name:"Declan Furey", role:"Parts counter", dept:"Parts", kind:"support", email:"declan.furey@example.com", verified:false, initials:"DF", tint:"#f0c04b"},
  {id:"p-s3", name:"Sinéad Lavelle", role:"Service advisor", dept:"Workshop", kind:"support", email:"sinead.lavelle@example.com", verified:false, initials:"SL", tint:"#5fe0a8"},
  {id:"p-s4", name:"Kevin Mannion", role:"Service advisor", dept:"Workshop", kind:"support", email:"kevin.mannion@example.com", verified:false, initials:"KM", tint:"#e2a08c"},
  {id:"p-s5", name:"Aoibhinn Daly", role:"Warranty administrator", dept:"Workshop", kind:"support", email:"aoibhinn.daly@example.com", verified:false, initials:"AD", tint:"#c8b4f0"},
  {id:"p-s6", name:"Gavin Tuohy", role:"Sales administrator", dept:"Sales", kind:"support", email:"gavin.tuohy@example.com", verified:false, initials:"GT", tint:"#9fd6f0"},
  {id:"p-s7", name:"Michelle Nerney", role:"CVRT administrator", dept:"CVRT", kind:"support", email:"michelle.nerney@example.com", verified:false, initials:"MN", tint:"#7fd8a4"},
  {id:"p-s8", name:"Brian Costello", role:"Reception", dept:"Management", kind:"support", email:"brian.costello@example.com", verified:false, initials:"BC", tint:"#e6c78a"},
  // 15 technicians — featured first
  {id:"t-billy", name:"Billy", fullName:"Billy Elliott", role:"HGV technician", dept:"Workshop", kind:"technician", email:"billy@example.com", verified:false, initials:"BE", tint:"#6C8CFF", onDemo:true},
  {id:"t-sean", name:"Seán Doyle", role:"HGV technician", dept:"Workshop", kind:"technician", email:"sean.doyle@example.com", verified:false, initials:"SD", tint:"#6ad0f0", onDemo:true},
  {id:"t-rachel", name:"Rachel Byrne", role:"Auto-electrician", dept:"Workshop", kind:"technician", email:"rachel.byrne@example.com", verified:false, initials:"RB", tint:"#5fe0a8", onDemo:true},
  {id:"t-conor", name:"Conor Keane", role:"LCV technician", dept:"Workshop", kind:"technician", email:"conor.keane@example.com", verified:false, initials:"CK", tint:"#f0c04b"},
  {id:"t-5", name:"Mark Timlin", role:"HGV technician", dept:"Workshop", kind:"technician", email:"mark.timlin@example.com", verified:false, initials:"MT", tint:"#e2a08c"},
  {id:"t-6", name:"Padraig Shaw", role:"LCV technician", dept:"Workshop", kind:"technician", email:"padraig.shaw@example.com", verified:false, initials:"PS", tint:"#c8b4f0"},
  {id:"t-7", name:"Dylan Forde", role:"CVRT tester", dept:"Workshop", kind:"technician", email:"dylan.forde@example.com", verified:false, initials:"DyF", tint:"#9fd6f0"},
  {id:"t-8", name:"Robbie Naughton", role:"HGV technician", dept:"Workshop", kind:"technician", email:"robbie.naughton@example.com", verified:false, initials:"RN", tint:"#6ad0f0"},
  {id:"t-9", name:"Cian Molloy", role:"Apprentice technician", dept:"Workshop", kind:"technician", email:"cian.molloy@example.com", verified:false, initials:"CM", tint:"#f0994b"},
  {id:"t-10", name:"Eoin Gaffney", role:"LCV technician", dept:"Workshop", kind:"technician", email:"eoin.gaffney@example.com", verified:false, initials:"EG", tint:"#7fd8a4"},
  {id:"t-11", name:"Shane Carthy", role:"HGV technician", dept:"Workshop", kind:"technician", email:"shane.carthy@example.com", verified:false, initials:"SC", tint:"#e6c78a"},
  {id:"t-12", name:"Luke Hanley", role:"Trailer technician", dept:"Workshop", kind:"technician", email:"luke.hanley@example.com", verified:false, initials:"LH", tint:"#c8b4f0"},
  {id:"t-13", name:"Ronan Keville", role:"HGV technician", dept:"Workshop", kind:"technician", email:"ronan.keville@example.com", verified:false, initials:"RK", tint:"#9fd6f0"},
  {id:"t-14", name:"Fionn Barrett", role:"Auto-electrician", dept:"Workshop", kind:"technician", email:"fionn.barrett@example.com", verified:false, initials:"FB", tint:"#5fe0a8"},
  {id:"t-15", name:"Alan Prendergast", role:"Apprentice technician", dept:"Workshop", kind:"technician", email:"alan.prendergast@example.com", verified:false, initials:"AP", tint:"#6ad0f0"}
];

export const staffById = (id) => STAFF.find(s => s.id === id) || null;

/* ---- customers / companies (fictional demo) ------------------------------ */
export const CUSTOMERS = [
  {id:"c-galway", name:"Galway Haulage", kind:"customer", type:"Fleet operator", contact:"Fergus Lally", email:"accounts@example.com", vehicles:8},
  {id:"c-mayo", name:"Mayo Logistics", kind:"customer", type:"Courier company", contact:"Paula Jennings", email:"ops@example.com", vehicles:11},
  {id:"c-midlands", name:"Midlands Parcel Services", kind:"customer", type:"Courier company", contact:"Noel Grehan", email:"fleet@example.com", vehicles:6},
  {id:"c-westway", name:"Westway Electrical", kind:"customer", type:"Trade", contact:"Mags Donlon", email:"mags@example.com", vehicles:2},
  {id:"c-shannon", name:"Shannon Cold Chain", kind:"customer", type:"Fleet operator", contact:"Tadhg Ryan", email:"transport@example.com", vehicles:14},
  {id:"c-corrib", name:"Corrib Plant Hire", kind:"customer", type:"Fleet operator", contact:"Alan Finnerty", email:"accounts@example.com", vehicles:9},
  {id:"c-tuam", name:"Tuam Builders Providers", kind:"customer", type:"Trade", contact:"Mary Burke", email:"office@example.com", vehicles:4},
  {id:"c-boyle", name:"Boyle Agri Contracts", kind:"customer", type:"Agri", contact:"Seán Óg Regan", email:"seanog@example.com", vehicles:5},
  // suppliers
  {id:"s-renault", name:"Renault Trucks Ireland", kind:"supplier", type:"Manufacturer", contact:"—", email:"—", vehicles:0},
  {id:"s-parts", name:"CV Parts Direct", kind:"supplier", type:"Parts factor", contact:"Order desk", email:"orders@example.com", vehicles:0}
];
export const custById = (id) => CUSTOMERS.find(c => c.id === id) || null;

/* ---- vehicles -----------------------------------------------------------
   Two kinds: dealership STOCK (for sale) and customer-owned SERVICE vehicles
   (in the workshop / CVRT). standingCost lines are reused by the deal workings.
   VINs are clearly fictional demo identifiers. Specs are sample data. */

/* Customer-owned service vehicles referenced by jobs/CVRT. */
export const SERVICE_VEHICLES = [
  {id:"C101", reg:"181-G-4471", make:"Renault", model:"T480", kind:"HGV tractor unit", customer:"c-galway"},
  {id:"C102", reg:"192-MO-882", make:"Renault", model:"Master", kind:"LCV panel van", customer:"c-mayo"},
  {id:"C103", reg:"201-C-1180", make:"Renault", model:"D18", kind:"Rigid truck", customer:"c-shannon"},
  {id:"C104", reg:"211-G-903", make:"Renault", model:"Trafic", kind:"LCV van", customer:"c-corrib"},
  {id:"V008", reg:"171-WH-2290", make:"Renault", model:"Master", kind:"Used LCV van", customer:"c-midlands", stockId:"V008"}
];
export const svById = (id) => SERVICE_VEHICLES.find(v => v.id === id) || null;

/* Dealership stock. status: available | reserved | preparation | incoming | sold
   specStatus: approved | missing | pending
   id doubles as the SVO/stock identifier. */
export const STOCK = (() => {
  const mk = (o) => Object.assign({
    specStatus:"approved", reg:"", location:"Main yard", customer:null, jobRef:null,
    gearbox:"Manual", power:"", colour:"White", notes:"", image:null,
    standing:{base:0, body:0, prep:0, rebate:0}, photoUrl:null, specUrl:null, folderUrl:null
  }, o);
  const list = [];
  // 10 available (in stock)
  const avail = [
    ["V001","Master","LCV panel van",28500,"Manual","110 dCi","White"],
    ["V002","Master","LCV crew van",31200,"Manual","130 dCi","Grey"],
    ["V003","Trafic","LCV van",26900,"Manual","110 dCi","White"],
    ["V004","Trafic","LCV van",27400,"Auto","150 dCi","Silver"],
    ["V005","D18","Rigid truck",64800,"Auto","280","White"],
    ["V006","Master","Tipper",36200,"Manual","165 dCi","White"],
    ["V007","Trafic","LCV van",25900,"Manual","110 dCi","Blue"],
    ["V009","Master","Luton box",38900,"Manual","165 dCi","White"],
    ["V010","D14","Rigid truck",58600,"Auto","250","White"],
    ["V011","Trafic","Crew van",29100,"Manual","130 dCi","Grey"]
  ];
  avail.forEach(([id,model,kind,base,gb,pw,col],i) => list.push(mk({
    id, model, kind, status:"available", gearbox:gb, power:pw, colour:col,
    reg:"", location:["Main yard","Front line","Main yard"][i%3],
    standing:{base, body:0, prep:300+(i%3)*100, rebate:0},
    receivedDays: 14+i*8, notes:"Ex-demo "+ (i%2? "" : "low mileage")
  })));
  // 5 reserved
  const reserved = [
    ["V012","Master","LCV panel van",29800,"c-galway","JOB-"],
    ["V013","D18","Rigid truck",66400,"c-shannon",null],
    ["V014","Trafic","LCV van",27200,"c-tuam",null],
    ["V015","Master","Dropside",35600,"c-corrib",null],
    ["V008","Master","Used LCV van",0,"c-midlands","JOB-1046"]
  ];
  reserved.forEach(([id,model,kind,base,cust,job]) => list.push(mk({
    id, model, kind, status:"reserved", customer:cust, jobRef:job,
    standing:{base, body:0, prep:450, rebate:0}, receivedDays:9,
    notes: id==="V008" ? "Used van — handover blocked by failed CVRT and open repair" : "Deposit taken"
  })));
  // 3 in preparation
  [["V016","Master","LCV panel van",28800],["V017","Trafic","LCV van",26600],["V018","D18","Rigid truck",63200]]
    .forEach(([id,model,kind,base]) => list.push(mk({
      id, model, kind, status:"preparation", standing:{base, body:0, prep:600, rebate:0}, receivedDays:4,
      notes:"PDI and valet in progress"
    })));
  // 8 incoming — V019 (customer-promised), V024 (Q-1042, no spec), + 6
  list.push(mk({id:"V019", model:"Master", kind:"Chassis cab", status:"incoming", eta:"2026-10-24", promisedCustomer:"c-mayo", standing:{base:27500, body:1800, prep:500, rebate:0}, specStatus:"approved", svo:"RNL-ORD-5581", notes:"Promised to Mayo Logistics — delivery date committed"}));
  list.push(mk({id:"V024", model:"Master", kind:"Chassis cab", status:"incoming", eta:"2026-10-20", standing:{base:26500, body:2000, prep:500, rebate:0}, specStatus:"missing", svo:"RNL-ORD-5590", notes:"Due 20 Oct — no approved specification sheet"}));
  [["V020","Trafic","LCV van",26700,"2026-10-27"],
   ["V021","Master","Luton box",38400,"2026-11-03"],
   ["V022","D18","Rigid truck",64200,"2026-11-05"],
   ["V023","Master","Tipper",36600,"2026-10-30"],
   ["V025","Trafic","Crew van",29400,"2026-11-10"],
   ["V026","D14","Rigid truck",58200,"2026-11-12"]]
    .forEach(([id,model,kind,base,eta],i) => list.push(mk({
      id, model, kind, status:"incoming", eta, svo:"RNL-ORD-"+(5600+i),
      standing:{base, body:0, prep:500, rebate:0},
      specStatus: (id==="V025"||id==="V026") ? "missing" : "approved",
      notes:"On the Renault order book"
    })));
  // 4 confirmed sold (archive)
  [["V101","Master","LCV panel van",30200,"c-tuam","2026-10-09"],
   ["V102","Trafic","LCV van",27600,"c-corrib","2026-10-12"],
   ["V103","D18","Rigid truck",67100,"c-shannon","2026-10-14"],
   ["V104","Master","Dropside",35900,"c-boyle","2026-10-16"]]
    .forEach(([id,model,kind,sale,buyer,date]) => list.push(mk({
      id, model, kind, status:"sold", soldAmount:sale, buyer, soldDate:date,
      standing:{base:sale-1200, body:0, prep:500, rebate:0},
      checklist:{registration:true, warranty:true, documents:true, dmsTransfer:false}
    })));
  // model range grouping
  list.forEach(v => {
    v.range = /T\d|D1[48]|Rigid|truck|Tipper|chassis|Chassis/.test(v.model+v.kind)
      ? (/Trafic/.test(v.model) ? "Trafic" : /Master/.test(v.model) ? "Master" : "Trucks")
      : (/Master/.test(v.model) ? "Master" : /Trafic/.test(v.model) ? "Trafic" : "Used & trade-in");
    v.standingTotal = v.standing.base + v.standing.body + v.standing.prep - v.standing.rebate;
  });
  return list;
})();
export const stockById = (id) => STOCK.find(v => v.id === id) || null;

/* ---- workshop jobs ------------------------------------------------------
   status: queued | in_progress | awaiting_parts | awaiting_qc | completed
   hopper:true  = one of the 4 unassigned hopper cards (still queued)
   completed jobs carry invoice state: ready | blocked (write-up) */
export const JOBS = (() => {
  const j = [];
  const add = (o) => j.push(Object.assign({workType:"General workshop", budgetMin:120, elapsedMin:0}, o));
  // Billy's live story job
  add({id:"JOB-1042", status:"in_progress", tech:"t-billy", vehicle:"C101", customer:"c-galway",
    complaint:"Brake warning investigation", workType:"General workshop",
    budgetMin:120, elapsedMin:105, start:"08:15", nextJob:"JOB-1043"});
  // Billy's next
  add({id:"JOB-1043", status:"queued", tech:"t-billy", vehicle:"C102", customer:"c-mayo",
    complaint:"Scheduled service + brake check", budgetMin:90, plannedStart:"10:15"});
  // 4 unassigned hopper cards (queued)
  add({id:"JOB-1050", status:"queued", hopper:true, tech:null, vehicle:"C104", customer:"c-corrib", complaint:"Clutch slipping under load", budgetMin:150, workType:"General workshop"});
  add({id:"JOB-1051", status:"queued", hopper:true, tech:null, vehicle:null, customer:"c-tuam", complaint:"CVRT preparation — brakes + lights", budgetMin:120, workType:"CVRT preparation"});
  add({id:"JOB-1052", status:"queued", hopper:true, tech:null, vehicle:null, customer:"c-shannon", complaint:"Fridge unit electrical fault", budgetMin:180, workType:"Auto-electrical"});
  add({id:"JOB-1053", status:"queued", hopper:true, tech:null, vehicle:null, customer:"c-boyle", complaint:"Tail-lift not raising", budgetMin:120, workType:"General workshop"});
  // 2 more future-assigned queued (total queued = 8: 4 hopper + 4 future incl JOB-1043)
  add({id:"JOB-1054", status:"queued", tech:"t-sean", vehicle:null, customer:"c-galway", complaint:"Air leak diagnosis", budgetMin:90, plannedStart:"11:00"});
  add({id:"JOB-1055", status:"queued", tech:"t-conor", vehicle:null, customer:"c-westway", complaint:"Pre-delivery inspection", budgetMin:120, plannedStart:"13:00"});
  // 10 in progress (incl JOB-1042 above => 9 more)
  const ip = [
    ["JOB-1060","t-sean","c-shannon","Oil service + filters",120,70],
    ["JOB-1061","t-rachel","c-galway","Lighting board rewire",180,95,"Auto-electrical"],
    ["JOB-1062","t-5","c-mayo","Brake overhaul rear axle",240,150],
    ["JOB-1063","t-6","c-corrib","Timing belt replacement",210,60],
    ["JOB-1064","t-8","c-shannon","DPF regeneration fault",180,120],
    ["JOB-1065","t-10","c-tuam","Suspension airbag replace",150,40],
    ["JOB-1066","t-11","c-galway","Gearbox oil leak",120,88],
    ["JOB-1067","t-13","c-mayo","Wheel alignment + tyres",90,30],
    ["JOB-1068","t-14","c-boyle","Reversing camera install",120,55,"Auto-electrical"]
  ];
  ip.forEach(([id,tech,cust,comp,bud,el,wt]) => add({id, status:"in_progress", tech, customer:cust, complaint:comp, budgetMin:bud, elapsedMin:el, workType:wt||"General workshop", start:"08:30"}));
  // 3 awaiting parts (incl JOB-1046 for V008)
  add({id:"JOB-1046", status:"awaiting_parts", tech:"t-conor", vehicle:"V008", customer:"c-midlands",
    complaint:"Rear brake caliper seized — CVRT repair", budgetMin:150, elapsedMin:45,
    partBlocker:{part:"Brake caliper, rear O/S", eta:"11:30", owner:"p-darren"}, workType:"CVRT preparation"});
  add({id:"JOB-1047", status:"awaiting_parts", tech:"t-5", customer:"c-shannon", complaint:"Alternator replacement", budgetMin:120, elapsedMin:30, partBlocker:{part:"Alternator 150A", eta:"14:00", owner:"p-darren"}});
  add({id:"JOB-1048", status:"awaiting_parts", tech:"t-6", customer:"c-corrib", complaint:"Water pump replacement", budgetMin:150, elapsedMin:50, partBlocker:{part:"Water pump kit", eta:"Tomorrow 09:00", owner:"p-darren"}});
  // 3 awaiting quality check
  add({id:"JOB-1070", status:"awaiting_qc", tech:"t-8", customer:"c-galway", complaint:"Full service + CVRT prep", budgetMin:180, elapsedMin:175});
  add({id:"JOB-1071", status:"awaiting_qc", tech:"t-10", customer:"c-mayo", complaint:"Brake pad + disc replacement", budgetMin:120, elapsedMin:118});
  add({id:"JOB-1072", status:"awaiting_qc", tech:"t-11", customer:"c-boyle", complaint:"Steering box replacement", budgetMin:210, elapsedMin:205});
  // 6 completed awaiting invoicing — net values 650,780,940,520,450,500 = 3840
  // invoice-ready initial: 650+940+520 = 2110 ; write-up blocked: 780+450+500 = 1730
  add({id:"JOB-1040", status:"completed", invoice:"ready", net:650, tech:"t-13", customer:"c-shannon", complaint:"Oil service", budgetMin:90, elapsedMin:88});
  add({id:"JOB-1041", status:"completed", invoice:"blocked", net:780, tech:"t-conor", customer:"c-shannon", vehicle:"C102sc",
    complaint:"Service + front brake inspection", budgetMin:240, elapsedMin:240,
    labourHours:4, partsNet:460,
    notes:"Oil + oil filter changed. Front pads inspected; no replacement needed. Wipers not checked.",
    supported:["Oil + oil filter replacement","Front brake pad inspection"],
    unconfirmed:["Were front pads replaced? (notes say inspected, not replaced)","Were wipers checked?"]});
  add({id:"JOB-1044", status:"completed", invoice:"ready", net:940, tech:"t-5", customer:"c-galway", complaint:"Clutch replacement", budgetMin:300, elapsedMin:290});
  add({id:"JOB-1045", status:"completed", invoice:"ready", net:520, tech:"t-6", customer:"c-corrib", complaint:"Exhaust repair", budgetMin:90, elapsedMin:85});
  add({id:"JOB-1049", status:"completed", invoice:"blocked", net:450, tech:"t-8", customer:"c-tuam", complaint:"Electrical diagnosis", budgetMin:60, elapsedMin:62});
  add({id:"JOB-1073", status:"completed", invoice:"blocked", net:500, tech:"t-10", customer:"c-mayo", complaint:"Tyre + tracking", budgetMin:60, elapsedMin:58});
  return j;
})();
export const jobById = (id) => JOBS.find(x => x.id === id) || null;

/* ---- technician day states (Monday live) --------------------------------
   15 techs: 10 on-job + 2 present/unallocated + 2 absent + 1 training = 15 */
export const TECH_DAY = {
  onJob: ["t-billy","t-sean","t-rachel","t-5","t-6","t-8","t-10","t-11","t-13","t-14"],
  unallocated: [
    {id:"t-conor", since:"09:25"},   // Seán in story? brief: Seán 09:25, Rachel 09:42 — but Rachel is on-job here.
    {id:"t-15", since:"09:42"}
  ],
  absent: ["t-9","t-12"],
  training: ["t-7"]
};
/* Story A names Seán unallocated since 09:25 and Rachel since 09:42; keep a
   dedicated gap list for the live board so the story reconciles. */
export const LIVE_GAPS = [
  {id:"t-sean", since:"09:25", mins:35},
  {id:"t-rachel", since:"09:42", mins:18}
];

/* ---- Friday 16 Oct labour reconciliation (whole day) --------------------
   paid 120.0 = job 94.0 + breaks 7.5 + internal 5.5 + unallocated 13.0
   allocation rate = 94 / (120 - 7.5) = 83.6% */
export const FRIDAY = {
  date: "Fri 16 Oct",
  paid: 120.0, job: 94.0, breaks: 7.5, internal: 5.5, unallocated: 13.0,
  get allocationRate() { return this.job / (this.paid - this.breaks); }, // 0.836
  billingEquivalent: 13.0 * RATE // €1,040 illustrative
};

/* ---- CVRT today: 12 = 7 scheduled + 2 awaiting repair + 1 retest + 2 done */
export const CVRT = [
  {id:"T-301", vehicle:"C101", customer:"c-galway", time:"08:30", tester:"t-7", status:"completed", result:"pass"},
  {id:"T-302", vehicle:"C103", customer:"c-shannon", time:"09:00", tester:"t-7", status:"completed", result:"pass"},
  {id:"T-303", vehicle:"V008", customer:"c-midlands", time:"09:30", tester:"t-7", status:"awaiting_repair", result:"fail", repairJob:"JOB-1046", failItems:["Rear O/S brake imbalance","Brake pipe corrosion"]},
  {id:"T-304", vehicle:"C104", customer:"c-corrib", time:"10:30", tester:"t-7", status:"awaiting_repair", result:"fail", repairJob:"JOB-1048", failItems:["Headlamp aim"]},
  {id:"T-305", vehicle:"C102", customer:"c-mayo", time:"11:00", tester:"t-7", status:"awaiting_retest", result:"pending", note:"Repaired, retest due"},
  {id:"T-306", vehicle:null, customer:"c-tuam", time:"11:30", tester:"t-7", status:"scheduled"},
  {id:"T-307", vehicle:null, customer:"c-shannon", time:"12:00", tester:"t-7", status:"scheduled"},
  {id:"T-308", vehicle:null, customer:"c-galway", time:"13:00", tester:"t-7", status:"scheduled"},
  {id:"T-309", vehicle:null, customer:"c-boyle", time:"13:30", tester:"t-7", status:"scheduled"},
  {id:"T-310", vehicle:null, customer:"c-corrib", time:"14:00", tester:"t-7", status:"scheduled"},
  {id:"T-311", vehicle:null, customer:"c-mayo", time:"14:30", tester:"t-7", status:"scheduled"},
  {id:"T-312", vehicle:null, customer:"c-midlands", time:"15:00", tester:"t-7", status:"scheduled"}
];

/* ---- sales quote Q-1042 (and pipeline) ---------------------------------- */
export const QUOTES = [
  {id:"Q-1042", customer:"c-westway", owner:"p-jack", vehicle:"V024", stage:"Approval",
   lines:{vehicle:32500, options:1250, delivery:750}, discount:500,
   get subtotal(){ return this.lines.vehicle + this.lines.options + this.lines.delivery; }, // 34500
   get net(){ return this.subtotal - this.discount; }, // 34000
   tradeIn:null, finance:null,
   approvals:{discount:"pending", spec:"pending"},
   warranty:"Renault 2-year commercial warranty",
   note:"Net sample pricing; tax not calculated"},
  {id:"Q-1038", customer:"c-corrib", owner:"p-jack", vehicle:"V015", stage:"Quoted", lines:{vehicle:35600,options:0,delivery:500}, discount:0, get subtotal(){return 36100}, get net(){return 36100}},
  {id:"Q-1040", customer:"c-tuam", owner:"p-jack", vehicle:"V014", stage:"Reserved", lines:{vehicle:27200,options:800,delivery:500}, discount:0, get subtotal(){return 28500}, get net(){return 28500}},
  {id:"Q-1035", customer:"c-shannon", owner:"p-jack", vehicle:"V013", stage:"Won", lines:{vehicle:66400,options:0,delivery:600}, discount:600, get subtotal(){return 67000}, get net(){return 66400}},
  {id:"Q-1041", customer:"c-boyle", owner:"p-jack", vehicle:null, stage:"Enquiry", lines:{vehicle:0,options:0,delivery:0}, discount:0, get subtotal(){return 0}, get net(){return 0}}
];
export const quoteById = (id) => QUOTES.find(q => q.id === id) || null;

/* ---- finance (fictional illustrative balances) --------------------------
   due relative to demo date 19 Oct. overdue 3 = 10,800 ; all 4 = 18,000 */
export const RECEIVABLES = [
  {id:"INV-2041", customer:"c-corrib", amount:4800, due:"2026-10-02", daysOverdue:17},
  {id:"INV-2047", customer:"c-boyle", amount:3600, due:"2026-10-09", daysOverdue:10},
  {id:"INV-2052", customer:"c-tuam", amount:2400, due:"2026-10-16", daysOverdue:3},
  {id:"INV-2058", customer:"c-galway", amount:7200, due:"2026-10-30", daysOverdue:0}
];

/* ---- improvement requests / tasks (Story threads + §5.10) --------------- */
export const TASKS = [
  {id:"TK-1", title:"Flag ETA changes against promised delivery dates", owner:"p-anthony", kind:"improvement", status:"open", due:"This week", record:"V019", dept:"Vehicle Stock", story:"D"},
  {id:"TK-2", title:"Reconcile V019 — missing from latest order book", owner:"p-jack", kind:"task", status:"open", due:"Today", record:"V019", dept:"Sales", story:"D"},
  {id:"TK-3", title:"Confirm JOB-1041 work before invoicing", owner:"t-conor", kind:"task", status:"open", due:"Today", record:"JOB-1041", dept:"Workshop", story:"C"},
  {id:"TK-4", title:"V008 — chase rear caliper, ETA 11:30", owner:"p-darren", kind:"task", status:"open", due:"Today", record:"V008", dept:"Parts", story:"F"},
  {id:"TK-5", title:"Q-1042 — discount + specification review", owner:"p-anthony", kind:"approval", status:"open", due:"Today", record:"Q-1042", dept:"Sales", story:"E"},
  {id:"TK-6", title:"Investigate Friday's 13.0 unallocated hours", owner:"p-jonathan", kind:"task", status:"open", due:"Today", record:"FRIDAY", dept:"Workshop", story:"A"},
  {id:"TK-7", title:"Attach approved spec sheets — 6 vehicles missing", owner:"p-jack", kind:"improvement", status:"open", due:"This week", record:"V024", dept:"Vehicle Stock", story:"E"}
];

/* ---- morning meeting: 9 configurable sections, 5 enabled by default ------ */
export const MEETING_SECTIONS = [
  {id:"greeting", label:"Greeting", enabled:true},
  {id:"events", label:"Events", enabled:true},
  {id:"downtime", label:"Downtime", enabled:false},
  {id:"updates", label:"Updates", enabled:false},
  {id:"readiness", label:"Readiness", enabled:true},
  {id:"preview", label:"Preview", enabled:true},
  {id:"photos", label:"Photos", enabled:true},
  {id:"focus", label:"Focus", enabled:false},
  {id:"board3s", label:"3S Board", enabled:false}
];

/* ---- seven agents (§10) -------------------------------------------------- */
export const RC_AGENTS = [
  {id:"briefing", name:"Briefing", purpose:"Compiles cross-business status with links to evidence; drafts the morning meeting and executive briefing.", limit:"Draft only"},
  {id:"watchdog", name:"Ops Watchdog", purpose:"Flags unallocated technicians, approaching budgets, overdue blockers and stale source data.", limit:"Flag only", rules:"Gap >15 min · warn 85% budget · over 100%"},
  {id:"jobcard", name:"Job Card Assistant", purpose:"Turns verified notes into readable descriptions, shows missing facts, prepares a review.", limit:"Cannot approve its own draft"},
  {id:"stockspec", name:"Stock & Specification", purpose:"Prepares import diffs, flags missing VINs/documents, matches sample attachments.", limit:"Missing rows never create sales"},
  {id:"sales", name:"Sales Assistant", purpose:"Prefills quotes and draft document packs, highlights discounts needing approval, creates follow-ups.", limit:"Cannot approve discounts or send"},
  {id:"finance", name:"Finance Assistant", purpose:"Summarises invoice readiness and imported balances, drafts reminders, points to missing evidence.", limit:"Never posts or marks paid"},
  {id:"handover", name:"Handover Coordinator", purpose:"Combines sales, workshop, parts, test, document and accounts gates; explains next owner/action.", limit:"Cannot certify roadworthiness"}
];

/* ─────────────────────────────────────────────────────────────────────────
   SELECTORS — every total derives from the arrays above.
   ───────────────────────────────────────────────────────────────────────── */
export const sel = {
  staffCount: () => STAFF.length,                                   // 30
  techs: () => STAFF.filter(s => s.kind === "technician"),          // 15
  support: () => STAFF.filter(s => s.kind === "support"),           // 15

  openJobs: () => JOBS.filter(j => j.status !== "completed"),       // 24
  byStatus: (s) => JOBS.filter(j => j.status === s),
  queued: () => JOBS.filter(j => j.status === "queued"),            // 8
  hopper: () => JOBS.filter(j => j.hopper),                         // 4
  inProgress: () => JOBS.filter(j => j.status === "in_progress"),   // 10
  awaitingParts: () => JOBS.filter(j => j.status === "awaiting_parts"), // 3
  awaitingQc: () => JOBS.filter(j => j.status === "awaiting_qc"),   // 3
  completed: () => JOBS.filter(j => j.status === "completed"),      // 6
  invoiceReady: () => JOBS.filter(j => j.status === "completed" && j.invoice === "ready"),
  invoiceBlocked: () => JOBS.filter(j => j.status === "completed" && j.invoice === "blocked"),
  completedNet: () => sel.completed().reduce((a,j) => a + (j.net||0), 0),       // 3840
  invoiceReadyNet: () => sel.invoiceReady().reduce((a,j) => a + (j.net||0), 0), // 2110
  invoiceBlockedNet: () => sel.invoiceBlocked().reduce((a,j) => a + (j.net||0), 0), // 1730

  activeStock: () => STOCK.filter(v => v.status !== "sold"),        // 26
  soldStock: () => STOCK.filter(v => v.status === "sold"),          // 4
  inStock: () => STOCK.filter(v => ["available","reserved","preparation"].includes(v.status)), // 18
  available: () => STOCK.filter(v => v.status === "available"),     // 10
  reserved: () => STOCK.filter(v => v.status === "reserved"),       // 5
  preparation: () => STOCK.filter(v => v.status === "preparation"), // 3
  incoming: () => STOCK.filter(v => v.status === "incoming"),       // 8
  missingSpec: () => sel.activeStock().filter(v => v.specStatus === "missing"), // 6
  stockStandingTotal: () => sel.activeStock().reduce((a,v) => a + (v.standingTotal||0), 0),

  cvrtByStatus: (s) => CVRT.filter(t => t.status === s),            // 7/2/1/2

  receivablesTotal: () => RECEIVABLES.reduce((a,r) => a + r.amount, 0),       // 18000
  overdue: () => RECEIVABLES.filter(r => r.daysOverdue > 0),
  overdueTotal: () => sel.overdue().reduce((a,r) => a + r.amount, 0),         // 10800

  fmtEur: (n) => "€" + Math.round(n).toLocaleString("en-IE"),
  pct: (n) => (n*100).toFixed(1) + "%"
};
