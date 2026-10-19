/* Demo data and pure helpers for the Pulse prototype (Reynolds Commercials). */

const INK="var(--ink)", BODY="var(--body)", DIM="var(--dim)", FAINT="var(--faint)";
const LIME="var(--accent)", GREEN="var(--ok)", AMBER="var(--warn)", RED="var(--bad)", NEUTRAL="var(--neutral)";
const MONO="var(--mono)";

const ICONS = {
  navHome:"M12 3.2 3.6 9.1v10a1.5 1.5 0 0 0 1.5 1.5h13.8a1.5 1.5 0 0 0 1.5-1.5v-10L12 3.2Z M8.9 13.1h2l1-2.6 1.5 5 1.1-2.4h1.6",
  navAgents:"M12 2.4v2.3 M12 2.4a.9.9 0 1 0 0-.02 M8.2 6.5h7.6A2.2 2.2 0 0 1 18 8.7v5.1a2.2 2.2 0 0 1-2.2 2.2H8.2A2.2 2.2 0 0 1 6 13.8V8.7a2.2 2.2 0 0 1 2.2-2.2Z M9.9 10.6v1.4 M14.1 10.6v1.4 M6 10h-1.9 M18 10h1.9 M9.2 18.6h5.6 M9.2 21.2h5.6",
  navDash:"M4 5.6h7.2v5.1H4V5.6Z M13.6 5.6H20v8.6h-6.4V5.6Z M4 13.1h7.2v5.3H4v-5.3Z M13.6 16.6H20v1.8h-6.4v-1.8Z",
  navWork:"M9.4 4.4h5.2a1.4 1.4 0 0 1 1.4 1.4v1.1h2.4A1.6 1.6 0 0 1 20 8.5v9.1a1.6 1.6 0 0 1-1.6 1.6H5.6A1.6 1.6 0 0 1 4 17.6V8.5a1.6 1.6 0 0 1 1.6-1.6H8V5.8a1.4 1.4 0 0 1 1.4-1.4Z M8 6.9h8 M9.6 13.3l1.8 1.8 3.4-3.6",
  navRecords:"M12 3.6c3.9 0 7 1.1 7 2.5S15.9 8.6 12 8.6 5 7.5 5 6.1 8.1 3.6 12 3.6Z M5 6.1v5.7c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5V6.1 M5 11.8v5.7c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5v-5.7",
  navActivity:"M4.6 4.6h14.8A1.6 1.6 0 0 1 21 6.2v11.6a1.6 1.6 0 0 1-1.6 1.6H4.6A1.6 1.6 0 0 1 3 17.8V6.2a1.6 1.6 0 0 1 1.6-1.6Z M6 12.4h2.2l1.5-4.1 2.3 8 1.9-5.4 1.2 1.5H18",
  navAdmin:"M12 2.9 5 5.6v5.9c0 4 2.8 7.1 7 8.6 4.2-1.5 7-4.6 7-8.6V5.6L12 2.9Z M12 8.6a2 2 0 1 1 0 4 2 2 0 0 1 0-4Z M8.8 16.3a3.6 3.6 0 0 1 6.4 0",
  helios:"M21 11.5a8.4 8.4 0 0 1-9 8.4 9.9 9.9 0 0 1-4-.8L3 21l1.9-4.9A8.3 8.3 0 0 1 4 11.5 8.4 8.4 0 0 1 12 3a8.4 8.4 0 0 1 9 8.5Z M8 12h1.6l1.2-2.6 1.6 5 1.4-2.4H16",
  inbox:"M3 13h4l1.5 3h7l1.5-3h4 M3 13l2.4-7A2 2 0 0 1 7.3 4.6h9.4a2 2 0 0 1 1.9 1.4L21 13v4.4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V13Z",
  work:"M6 4.6h12a1.6 1.6 0 0 1 1.6 1.6v12.2A1.6 1.6 0 0 1 18 20H6a1.6 1.6 0 0 1-1.6-1.6V6.2A1.6 1.6 0 0 1 6 4.6Z M8.4 10.4l1.9 1.9 3.9-3.9 M8.4 15.6h7.2",
  approvals:"M12 3.6 19.5 6v6.1c0 4-3.1 6.9-7.5 8.3-4.4-1.4-7.5-4.3-7.5-8.3V6L12 3.6Z M9.2 12.2l2 2 3.6-3.7",
  insights:"M4.5 19.5V13 M9.7 19.5V7.5 M14.9 19.5v-8 M20 19.5V5",
  people:"M12 12.5a3.6 3.6 0 1 0 0-7.2 3.6 3.6 0 0 0 0 7.2Z M5 20.2c.9-3.1 3.6-4.9 7-4.9s6.1 1.8 7 4.9",
  orgs:"M4.5 20V6.4A1.4 1.4 0 0 1 5.9 5h6.2a1.4 1.4 0 0 1 1.4 1.4V20 M13.5 10.5h4.6A1.4 1.4 0 0 1 19.5 12v8 M3 20h18 M7.5 8.5h2.5 M7.5 12h2.5 M7.5 15.5h2.5",
  teams:"M9 12a3.2 3.2 0 1 0 0-6.4A3.2 3.2 0 0 0 9 12Z M16.5 12.5a2.6 2.6 0 1 0 0-5.2 2.6 2.6 0 0 0 0 5.2Z M2.6 19.6c.8-2.8 3.2-4.4 6.4-4.4s5.6 1.6 6.4 4.4 M17 15.4c2.2.4 3.7 1.8 4.3 4.2",
  locations:"M12 21s6.5-5.6 6.5-11a6.5 6.5 0 1 0-13 0C5.5 15.4 12 21 12 21Z M12 12.8a2.6 2.6 0 1 0 0-5.2 2.6 2.6 0 0 0 0 5.2Z",
  visits:"M8 4v3 M16 4v3 M4.5 9.5h15 M6.4 6h11.2A1.9 1.9 0 0 1 19.5 8v10a1.9 1.9 0 0 1-1.9 1.9H6.4A1.9 1.9 0 0 1 4.5 18V8A1.9 1.9 0 0 1 6.4 6Z M9 13.5l1.6 1.6 3.4-3.4",
  autos:"M18.5 8.5A5 5 0 0 0 8.9 7.3 3.8 3.8 0 0 0 6 14.6 M8 17.5l3.2 3.2 M11.2 20.7l3.2-3.2 M11.2 20.7V9.6",
  health:"M3 12.5h3.4l2-5 3 10 2.2-5H21",
  modules:"M6.6 4.4h10.8a2.2 2.2 0 0 1 2.2 2.2v10.8a2.2 2.2 0 0 1-2.2 2.2H6.6a2.2 2.2 0 0 1-2.2-2.2V6.6a2.2 2.2 0 0 1 2.2-2.2Z M4.4 9.6h15.2 M9.6 19.6V9.6",
  agents:"M8.5 3.6h7A2.4 2.4 0 0 1 17.9 6v5.6a2.4 2.4 0 0 1-2.4 2.4h-7A2.4 2.4 0 0 1 6.1 11.6V6a2.4 2.4 0 0 1 2.4-2.4Z M9.6 8.2h.01 M14.4 8.2h.01 M12 14v2.6 M7.6 20.4h8.8 M12 16.6c-2.4 0-4.4 1.7-4.4 3.8h8.8c0-2.1-2-3.8-4.4-3.8Z",
  dash:"M4.4 4.4h6v6h-6v-6Z M13.6 4.4h6v3.6h-6V4.4Z M13.6 11.6h6v8h-6v-8Z M4.4 14h6v5.6h-6V14Z",
  files:"M5 7.2a1.8 1.8 0 0 1 1.8-1.8h3l1.8 2.2h5.6A1.8 1.8 0 0 1 19 9.4v7.4a1.8 1.8 0 0 1-1.8 1.8H6.8A1.8 1.8 0 0 1 5 16.8V7.2Z",
  pulseLine:"M2.5 12.5h3.6l2.1-6.4 3.2 12.2 2.6-8.4 1.8 2.6h5.7",
  records:"M6.4 3.6h7.4l4.2 4.2v12.6H6.4V3.6Z M13.4 3.8v4.2h4.2 M9 12.4h6 M9 16h4",
  tree:"M4.5 6h5 M4.5 12h5 M4.5 18h5 M12.5 6h7 M12.5 12h7 M12.5 18h7",
  graph:"M7 7.4a2.4 2.4 0 1 0 0-4.8 2.4 2.4 0 0 0 0 4.8Z M17.6 10.4a2.4 2.4 0 1 0 0-4.8 2.4 2.4 0 0 0 0 4.8Z M9.4 21.4a2.4 2.4 0 1 0 0-4.8 2.4 2.4 0 0 0 0 4.8Z M8.6 6.4l7.6 2.6 M15.8 11.4l-5.6 5.2",
  bell:"M6 8.5a6 6 0 0 1 12 0c0 6.5 2.6 8.5 2.6 8.5H3.4S6 15 6 8.5Z M10.3 20.5a1.94 1.94 0 0 0 3.4 0"
};

/* Ontology stays first and is never removed (PulseLogic enforces this too). */
const REC_SECTIONS = [
  {id:"ontology", label:"Ontology", blurb:"How every record connects: entities, predicates and the paths between them."},
  {id:"files", label:"Files", blurb:"Documents, contracts and certificates — indexed where Helios can read them."},
  {id:"contacts", label:"Contacts", blurb:"Every person the business deals with, staff and external."}
];

const CONTACTS = [
  ["Anthony Reynolds","Operations Manager","anthony@reynoldscommercials.ie","Reynolds Commercials","staff","#6C8CFF"],
  ["Jonathan Keenan","Service Manager","jonathan@reynoldscommercials.ie","Reynolds Commercials","staff","#6ad0f0"],
  ["Darren O'Brien","Parts Manager","darren@reynoldscommercials.ie","Reynolds Commercials","staff","#f0994b"],
  ["Caroline Glynn","Financial Controller","caroline@reynoldscommercials.ie","Reynolds Commercials","staff","#7fd8a4"],
  ["Elizabeth Reynolds","CVRT Manager","elizabeth@reynoldscommercials.ie","Reynolds Commercials","staff","#c8b4f0"],
  ["Jack Kelly","LCV Sales Executive","jack@reynoldscommercials.ie","Reynolds Commercials","staff","#e6c78a"],
  ["Fergus Lally","Transport manager","accounts@example.com","Galway Haulage","customer","#9fd6f0"],
  ["Noel Grehan","Fleet manager","fleet@example.com","Midlands Parcel Services","watch","#e2a08c"],
  ["Mags Donlon","Owner","mags@example.com","Westway Electrical","customer","#a8e0c0"]
];

const FILE_TREE = [
  {type:"folder", id:"f-spec", name:"Specifications", depth:0},
  {type:"file", id:"fl-1", name:"V024 — Master chassis cab spec (sample).pdf", depth:1, parent:"f-spec", indexed:true,
   path:"Specifications / V024", title:"V024 — Renault Master chassis cab (sample)",
   facts:[["TYPE","PDF · 3 pages"],["SOURCE","Illustrative sample"],["INDEXED","All 3 pages"],["OWNER","Jack Kelly"]],
   body:["Illustrative sample — not manufacturer specifications. Matched to V024 by the demo VIN.",
     "A VIN-specific sheet is kept separate from a generic model sheet; do not treat one as the other.",
     "Six active vehicles still lack an approved spec, including V024's incoming cohort. This sample demonstrates the attach-and-match flow."],
   links:[["V024","vehicle"],["Q-1042","quote"],["Stock & Specification","agent"]]},
  {type:"file", id:"fl-2", name:"Renault order book — 19 Oct (sample).xlsx", depth:1, parent:"f-spec", indexed:true,
   path:"Specifications / Order book", title:"Renault order book — 19 Oct (sample)",
   facts:[["TYPE","XLSX · 27 rows"],["SOURCE","Sample Renault order book"],["INDEXED","Diff only"],["OWNER","Jack Kelly"]],
   body:["Latest weekly file: 27 rows. Against the previous 26 ids it adds 2, changes 3 ETAs and drops V019.",
     "A missing row is never treated as a sale. V019 stays tracked incoming with a review flag and an owned reconciliation task."],
   links:[["V019","vehicle"],["Weekly order book reconciliation","workflow"]]},
  {type:"folder", id:"f-jobs", name:"Job cards", depth:0},
  {type:"file", id:"fl-3", name:"JOB-1041 — job card (sample).pdf", depth:1, parent:"f-jobs", indexed:true,
   path:"Job cards / JOB-1041", title:"JOB-1041 — service + front brake inspection",
   facts:[["TYPE","PDF · 2 pages"],["VALUE","€780 net"],["INDEXED","Both pages"],["OWNER","Conor Keane"]],
   body:["Notes: oil + oil filter changed; front pads inspected, no replacement; wipers not checked.",
     "The draft describes only supported work. Pads and wipers are shown as questions, not customer narrative.",
     "€780 net = 4h labour at €80 + €460 parts, from the fixed job record — not generated from prose."],
   links:[["JOB-1041","job"],["Shannon Cold Chain","org"],["Job Card Assistant","agent"]]},
  {type:"folder", id:"f-sales", name:"Quote packs", depth:0},
  {type:"file", id:"fl-4", name:"Q-1042 — customer pack (draft).pdf", depth:1, parent:"f-sales", indexed:true,
   path:"Quote packs / Q-1042", title:"Q-1042 — Westway Electrical (draft)",
   facts:[["TYPE","PDF · 3 tabs"],["VALUE","€34,000 net"],["INDEXED","All tabs"],["OWNER","Jack Kelly"]],
   body:["Dealsheet, manufacturer/new-customer sheet and a SIMI draft slot, from one deal record.",
     "Previews with a draft watermark while the discount approval and specification are open.",
     "Internal standing cost, contribution and any lender notes never appear in the customer pack."],
   links:[["Q-1042","quote"],["V024","vehicle"],["Westway Electrical","org"]]},
  {type:"folder", id:"f-hr", name:"Source reports", depth:0},
  {type:"file", id:"fl-5", name:"Friday clocking — 16 Oct (sample).xlsx", depth:1, parent:"f-hr", indexed:false,
   path:"Source reports / AssetMinder", title:"Friday clocking — 16 Oct (sample)",
   facts:[["TYPE","XLSX · 15 rows"],["SOURCE","Sample AssetMinder export"],["INDEXED","Not indexed"],["OWNER","Jonathan Keenan"]],
   body:["120.0 paid hours: 94.0 job-allocated, 7.5 breaks, 5.5 internal, 13.0 unallocated.",
     "Allocation rate 83.6% = 94 ÷ (120 − 7.5). The 13.0 unallocated hours are a €1,040 billing equivalent at the demo rate — to investigate, not confirmed lost revenue."],
   links:[["Workshop","area"],["Ops Watchdog","agent"]]},
  {type:"file", id:"fl-6", name:"Attendance — 19 Oct (sample).pdf", depth:1, parent:"f-hr", indexed:false,
   path:"Source reports / Bizimply", title:"Attendance — 19 Oct (sample)",
   facts:[["TYPE","PDF · 2 pages"],["SOURCE","Sample Bizimply report"],["INDEXED","Not indexed"],["OWNER","—"]],
   body:["Attendance only — kept distinct from workshop job clocking. Shows presence, absence and training.",
     "Only operational availability carries into the morning meeting; no pay, private absence reasons or HR profile fields."],
   links:[["Workshop","area"],["Morning meeting","workflow"]]}
];

const ONTO_NODES = [
  ["Organisation","entity",500,300,1,"Customers and suppliers. Balances arrive from the ledger through the record spine."],
  ["Person","entity",300,190,1,"One entity for staff and external contacts, scoped by role rather than split in two."],
  ["Location","entity",700,190,1,"Multi-branch as a business concept: locations plus the location permission scope."],
  ["Team","entity",250,430,1,"Teams are records, so the team scope on a grant resolves against them."],
  ["Task","entity",690,430,1,"Work, whatever it is attached to. Queues are one permission-filtered query."],
  ["Approval","entity",850,320,0,"A request and its steps. Each decision is written as the person who made it."],
  ["Invoice","ledger",390,95,0,"Read through the spine — the wholesale ledger stays the source of truth."],
  ["Order","ledger",620,95,0,"Purchase and sales orders, linked to the organisation that raised them."],
  ["Visit","module",860,470,0,"Contributed by site-visits, with its own table, predicate and tools."],
  ["File","entity",140,300,0,"Documents against any record. Indexed pages are what Helios can read."],
  ["works at","predicate",395,240,0,"Person → Organisation."],
  ["located at","predicate",605,240,0,"Organisation → Location."],
  ["member of","predicate",360,370,0,"Person → Team."],
  ["relates to","predicate",600,370,0,"Task → anything."],
  ["attached to","predicate",140,372,0,"File → anything."]
];

const ONTO_EDGES = [
  [500,300,300,190],[500,300,700,190],[500,300,250,430],[500,300,690,430],
  [500,300,850,320],[500,300,390,95],[500,300,620,95],[500,300,140,300],
  [300,190,250,430],[700,190,860,470],[690,430,850,320],[690,430,860,470],
  [300,190,140,300],[390,95,620,95]
];

const REC_TEMPLATES = [
  ["Field sheet","Records","Labelled fields in a grid — the default for a person, organisation or location.",
   "M5 5.5h14v13H5v-13Z M5 10h14 M12 10v8.5","grid"],
  ["Contact card","Records","A portrait, key fields and every linked record in one compact panel.",
   "M12 11.5a3.4 3.4 0 1 0 0-6.8 3.4 3.4 0 0 0 0 6.8Z M5.5 19c.8-3 3.3-4.7 6.5-4.7s5.7 1.7 6.5 4.7","card"],
  ["Directory","Records","A sortable table of many records at once, built for lists.",
   "M4.5 6.5h15 M4.5 12h15 M4.5 17.5h15 M4.5 6.5h.01 M4.5 12h.01 M4.5 17.5h.01","rows"],
  ["Timeline","Case work","Ordered events with who did what and when. Good for a case or a claim.",
   "M12 3.5v17 M12 7.5h6 M12 13h-6 M12 18h6","timeline"],
  ["Kanban board","Case work","Cards in columns by status. For anything that moves through stages.",
   "M5 5h4.5v14H5V5Z M9.75 5h4.5v9h-4.5V5Z M14.5 5H19v6h-4.5V5Z","kanban"],
  ["Checklist","Case work","Ticked steps in order, with an owner and a due date on each.",
   "M5 6.5h2l1.4 1.4L11 5.5 M5 12.5h2l1.4 1.4 2.6-2.4 M5 18.5h2l1.4 1.4 2.6-2.4 M15 6.5h4 M15 12.5h4 M15 18.5h4","checklist"],
  ["Ledger","Finance","Rows and running totals. For anything with amounts and dates.",
   "M4 6h16 M4 12h16 M4 18h16 M9 3.5v17","ledger"],
  ["Invoice","Finance","Line items, totals and a status — built to be sent, not just stored.",
   "M7 3.5h10v17H7v-17Z M9.5 8h5 M9.5 11.5h5 M9.5 15h3","invoice"],
  ["Document","Notes","Long-form text with linked records pulled out down the side.",
   "M7 3.5h7l5 5v12H7v-17Z M14 3.7v5h5 M10 13h6 M10 16.5h4","document"],
  ["Gallery","Notes","A wall of images and files with a caption on each — for a site or a job.",
   "M4.5 6h6v6h-6V6Z M13.5 6h6v6h-6V6Z M4.5 14h6v4h-6v-4Z M13.5 14h6v4h-6v-4Z","gallery"],
  ["Map & locations","Ops","A pinboard of places, with the record's fields beside each pin.",
   "M12 21s6.5-5.6 6.5-11a6.5 6.5 0 1 0-13 0C5.5 15.4 12 21 12 21Z M12 12.8a2.6 2.6 0 1 0 0-5.2 2.6 2.6 0 0 0 0 5.2Z","map"],
  ["Schedule","Ops","A calendar of bookings against this record, with recurring rules.",
   "M8 4v3 M16 4v3 M4.5 9.5h15 M6.4 6h11.2A1.9 1.9 0 0 1 19.5 8v10a1.9 1.9 0 0 1-1.9 1.9H6.4A1.9 1.9 0 0 1 4.5 18V8A1.9 1.9 0 0 1 6.4 6Z","schedule"]
];
const REC_TEMPLATE_CATS = ["All","Records","Case work","Finance","Notes","Ops"];

/* ---- admin hub ---- */
/* ---- admin hub: 13 settings areas in five groups ---- */
const PEOPLE = [
  ["Anthony Reynolds","Operations Manager","anthony@reynoldscommercials.ie","Athlone","active","Admin","2 min ago"],
  ["Jonathan Keenan","Service Manager","jonathan@reynoldscommercials.ie","Athlone","active","Manager","12 min ago"],
  ["Caroline Glynn","Financial Controller","caroline@reynoldscommercials.ie","Athlone","active","Manager","34 min ago"],
  ["Darren O'Brien","Parts Manager","darren@reynoldscommercials.ie","Athlone","active","Manager","1 h ago"],
  ["Jack Kelly","LCV Sales Executive","jack@reynoldscommercials.ie","Athlone","active","Standard","3 h ago"],
  ["Billy Elliott","HGV technician","billy@example.com","Athlone","active","Standard","Clocked 08:15"]
];
const ROLE_LEVELS = ["Admin","Manager","Standard","External"];
const PERM_KEYS = [["view","View records"],["edit","Edit records"],["approve","Approve payments"]];
const GRANT_DEFS = [
  ["view","View records","Read anything in scope"],
  ["edit","Edit records","Create and change records"],
  ["approve","Approve decisions","Say yes to parked work"],
  ["pay","Release payments","Send money out"],
  ["export","Export data","Download and share out"],
  ["agents","Manage agents","Create and grant agents"],
  ["settings","Change settings","Modules, roles, integrations"],
  ["audit","Read the audit log","Every action, everyone"]
];
const ROLE_SCOPES = ["All records","Their location","Assigned only"];
const DEFAULT_PERMS = {Admin:{view:true,edit:true,approve:true}, Manager:{view:true,edit:true,approve:true},
  Standard:{view:true,edit:true,approve:false}, External:{view:true,edit:false,approve:false}};
const INTEGRATIONS = [
  {name:"Keyloop", blurb:"The intended future workshop and accounting core. Planned for the start of December 2026. Product, modules, consent and partner access are all to confirm.", tint:"#2034AB", status:"planned", statusKind:"off",
   glyph:"M6 10V8a6 6 0 0 1 12 0v2 M5 10h14v9H5v-9Z M12 13v3",
   lastSync:"Planned — December 2026", usage:"Sample mappings only", auth:"Partner review", scopes:[]},
  {name:"AssetMinder", blurb:"Current workshop source. Sample export only in the demo — which reports and identifiers remain available during migration is still open.", tint:"#6ad0f0", status:"read only", statusKind:"warn",
   glyph:"M4 7.2a1.8 1.8 0 0 1 1.8-1.8h3l1.8 2.2h5.6A1.8 1.8 0 0 1 19 9.4v7.4H5V7.2Z",
   lastSync:"Sample export", usage:"Jobs, clocking, job cards", auth:"Access to confirm", scopes:["Read"]},
  {name:"Sage", blurb:"Current accounts, version unknown. Legacy sample snapshot — which historical balances to retain after Keyloop is still open.", tint:"#00d639", status:"read only", statusKind:"warn",
   glyph:"M4 8 12 4.5 20 8 12 11.5 4 8Z M4 13 12 16.5 20 13 M4 18 12 21.5 20 18",
   lastSync:"Sample snapshot", usage:"Receivables, balances", auth:"Access to confirm", scopes:["Read"]},
  {name:"Bizimply", blurb:"Attendance, leave and HR information. Kept distinct from workshop job clocking. Which approved fields can be accessed is unconfirmed.", tint:"#5fe0a8", status:"read only", statusKind:"warn",
   glyph:"M8 4v3 M16 4v3 M4.5 9.5h15 M6.4 6h11.2A1.9 1.9 0 0 1 19.5 8v10a1.9 1.9 0 0 1-1.9 1.9H6.4A1.9 1.9 0 0 1 4.5 18V8A1.9 1.9 0 0 1 6.4 6Z",
   lastSync:"Sample report", usage:"Availability only", auth:"API access unconfirmed", scopes:["Read"]},
  {name:"Renault order book", blurb:"Weekly spreadsheet imported with a before/after diff. File format, stable IDs and delivery method are to confirm.", tint:"#f0994b", status:"read only", statusKind:"warn",
   glyph:"M4 6h16 M4 12h16 M4 18h16 M9 3.5v17",
   lastSync:"Today 09:00", usage:"Local sample import", auth:"Access to confirm", scopes:["Read"]},
  {name:"Renault portal / Bodybuilder", blurb:"Manual specification retrieval. Sample attached document only — the authorised download route and identifier matching are unverified.", tint:"#f0803a", status:"not connected", statusKind:"off",
   glyph:"M7 3.5h7l5 5v12H7v-17Z M14 3.7v5h5 M10 13h6 M10 16.5h4",
   lastSync:"—", usage:"Sample attachment", auth:"Access unverified", scopes:[]},
  {name:"SharePoint", blurb:"A folder-link field is visible on the stock edit form. Reference links only — no connected account. Storage, permissions and approved access to confirm.", tint:"#038387", status:"not connected", statusKind:"off",
   glyph:"M6.5 8.5h11a1.5 1.5 0 0 1 1.5 1.5v8H5v-8a1.5 1.5 0 0 1 1.5-1.5Z M9 8.5V6a3 3 0 0 1 6 0v2.5",
   lastSync:"—", usage:"Reference links only", auth:"Access to confirm", scopes:[]}
];

/* Background catalogue. Each entry is pure CSS so a tile is the real thing at
   thumbnail size, not a picture of it. */
const BG_DEFS = [
  {id:"bloom", name:"Bloom", cat:"Signature",
   css:"background:radial-gradient(60% 48% at 50% 34%, var(--accent-faint), transparent 72%), radial-gradient(44% 38% at 16% 84%, rgba(255,255,255,.05), transparent 70%)",
   thumb:"background:radial-gradient(62% 58% at 46% 34%, var(--accent-soft), transparent 74%), radial-gradient(50% 46% at 82% 84%, rgba(255,255,255,.08), transparent 72%), var(--surface-2)"},
  {id:"mist", name:"Mist", cat:"Signature",
   css:"background:radial-gradient(52% 44% at 24% 22%, rgba(255,255,255,.07), transparent 70%), radial-gradient(56% 46% at 80% 76%, rgba(255,255,255,.05), transparent 72%)",
   thumb:"background:radial-gradient(58% 52% at 24% 22%, rgba(255,255,255,.16), transparent 72%), radial-gradient(60% 54% at 82% 78%, rgba(255,255,255,.10), transparent 74%), var(--surface-2)"},
  {id:"grid", name:"Grid", cat:"Signature",
   css:"background-image:linear-gradient(var(--border) 1px, transparent 1px),linear-gradient(90deg, var(--border) 1px, transparent 1px);background-size:56px 56px;mask-image:radial-gradient(62% 56% at 50% 46%, #000, transparent 78%);-webkit-mask-image:radial-gradient(62% 56% at 50% 46%, #000, transparent 78%)",
   thumb:"background-color:var(--surface-2);background-image:linear-gradient(var(--border-strong) 1px, transparent 1px),linear-gradient(90deg, var(--border-strong) 1px, transparent 1px);background-size:14px 14px"},
  {id:"none", name:"None", cat:"Signature", css:"", thumb:"background:var(--surface-2)"},

  {id:"aurora", name:"Aurora", cat:"Gradient",
   css:"background:radial-gradient(70% 52% at 18% 8%, var(--bloom-a), transparent 66%), radial-gradient(64% 48% at 84% 22%, var(--bloom-b), transparent 68%), radial-gradient(70% 60% at 50% 104%, var(--bloom-c), transparent 70%);filter:blur(24px)",
   thumb:"background:radial-gradient(72% 60% at 16% 6%, var(--bloom-a), transparent 68%), radial-gradient(66% 54% at 86% 24%, var(--bloom-b), transparent 70%), radial-gradient(74% 66% at 50% 108%, var(--bloom-c), transparent 72%), var(--surface-2)"},
  {id:"horizon", name:"Horizon", cat:"Gradient",
   css:"background:linear-gradient(180deg, transparent 0%, var(--accent-faint) 58%, transparent 100%), radial-gradient(90% 40% at 50% 72%, var(--accent-soft), transparent 70%)",
   thumb:"background:linear-gradient(180deg, var(--surface-2) 0%, var(--accent-faint) 58%, var(--surface-2) 100%), radial-gradient(90% 44% at 50% 74%, var(--accent-soft), transparent 70%)"},
  {id:"dusk", name:"Dusk", cat:"Gradient",
   css:"background:linear-gradient(200deg, var(--bloom-c) -10%, transparent 46%), linear-gradient(20deg, var(--bloom-b) -10%, transparent 52%);opacity:.5",
   thumb:"background:linear-gradient(200deg, var(--bloom-c) -12%, transparent 48%), linear-gradient(20deg, var(--bloom-b) -12%, transparent 54%), var(--surface-2)"},
  {id:"ember", name:"Ember", cat:"Gradient",
   css:"background:radial-gradient(60% 70% at 84% 96%, var(--bloom-a), transparent 64%), radial-gradient(50% 60% at 10% 96%, var(--bloom-c), transparent 66%)",
   thumb:"background:radial-gradient(64% 76% at 84% 100%, var(--bloom-a), transparent 66%), radial-gradient(54% 66% at 8% 100%, var(--bloom-c), transparent 68%), var(--surface-2)"},

  {id:"mesh", name:"Mesh", cat:"Abstract",
   css:"background-image:radial-gradient(var(--border-strong) 1px, transparent 1px);background-size:22px 22px;mask-image:radial-gradient(70% 62% at 50% 46%, #000, transparent 76%);-webkit-mask-image:radial-gradient(70% 62% at 50% 46%, #000, transparent 76%)",
   thumb:"background-color:var(--surface-2);background-image:radial-gradient(var(--border-strong) 1px, transparent 1px);background-size:8px 8px"},
  {id:"contour", name:"Contour", cat:"Abstract",
   css:"background:repeating-radial-gradient(circle at 30% 110%, transparent 0 22px, var(--border) 22px 23px);mask-image:radial-gradient(80% 70% at 40% 80%, #000, transparent 78%);-webkit-mask-image:radial-gradient(80% 70% at 40% 80%, #000, transparent 78%)",
   thumb:"background:repeating-radial-gradient(circle at 26% 116%, var(--surface-2) 0 9px, var(--border-strong) 9px 10px)"},
  {id:"weave", name:"Weave", cat:"Abstract",
   css:"background:repeating-linear-gradient(48deg, transparent 0 16px, var(--border) 16px 17px), repeating-linear-gradient(-48deg, transparent 0 16px, var(--border) 16px 17px);opacity:.7",
   thumb:"background-color:var(--surface-2);background-image:repeating-linear-gradient(48deg, transparent 0 7px, var(--border-strong) 7px 8px), repeating-linear-gradient(-48deg, transparent 0 7px, var(--border-strong) 7px 8px)"},
  {id:"halo", name:"Halo", cat:"Abstract",
   css:"background:repeating-radial-gradient(circle at 50% 50%, transparent 0 46px, var(--accent-line) 46px 47px);mask-image:radial-gradient(60% 60% at 50% 50%, #000, transparent 72%);-webkit-mask-image:radial-gradient(60% 60% at 50% 50%, #000, transparent 72%)",
   thumb:"background:repeating-radial-gradient(circle at 50% 50%, var(--surface-2) 0 11px, var(--accent-line) 11px 12px)"},
  {id:"drift", name:"Drift", cat:"Abstract",
   css:"background:conic-gradient(from 210deg at 32% 38%, var(--bloom-b), transparent 38%), conic-gradient(from 20deg at 76% 70%, var(--bloom-a), transparent 34%);filter:blur(30px);opacity:.6",
   thumb:"background:conic-gradient(from 210deg at 32% 38%, var(--bloom-b), transparent 38%), conic-gradient(from 20deg at 76% 70%, var(--bloom-a), transparent 34%), var(--surface-2)"},
  {id:"scan", name:"Scanlines", cat:"Abstract",
   css:"background:repeating-linear-gradient(0deg, var(--border) 0 1px, transparent 1px 7px);mask-image:linear-gradient(180deg, #000, transparent 88%);-webkit-mask-image:linear-gradient(180deg, #000, transparent 88%)",
   thumb:"background-color:var(--surface-2);background-image:repeating-linear-gradient(0deg, var(--border-strong) 0 1px, transparent 1px 5px)"}
];

const THEMES = [
  {id:"reynolds", label:"Reynolds", group:"Dark", bg:"#0a0c12", surface:"#13161f", ink:"#f3f5f8", accent:"#6C8CFF"},
  {id:"dark", label:"Dark", group:"Dark", bg:"#0b0c0b", surface:"#1a1c19", ink:"#f2f3ef", accent:"#c8f04b"},
  {id:"indigo", label:"Indigo", group:"Dark", bg:"#0a0b13", surface:"#1a1b26", ink:"#f0f1fa", accent:"#8b93ff"},
  {id:"slate", label:"Slate", group:"Dark", bg:"#100e0c", surface:"#211c17", ink:"#f4f0ea", accent:"#e8a14a"},
  {id:"plum", label:"Plum", group:"Dark", bg:"#100a10", surface:"#20151f", ink:"#f6eef4", accent:"#f077b0"},
  {id:"ember", label:"Ember", group:"Dark", bg:"#0b0b0b", surface:"#1c1714", ink:"#f7f3ef", accent:"#f4561a"},
  {id:"harbour", label:"Harbour", group:"Dark", bg:"#0b0e10", surface:"#13171a", ink:"#f3f5f4", accent:"#5ee79a"},
  {id:"cargo", label:"Cargo", group:"Dark", bg:"#0a0a0a", surface:"#1a1c1a", ink:"#f2f5f2", accent:"#4ade80"},
  {id:"ocean", label:"Ocean", group:"Dark", bg:"#080e12", surface:"#141f25", ink:"#eaf4f8", accent:"#4fd4d0"},
  {id:"graphite", label:"Graphite", group:"Dark", bg:"#111112", surface:"#212124", ink:"#f4f4f5", accent:"#f4f4f5"},
  {id:"light", label:"Cream", group:"Light", bg:"#f4f2ed", surface:"#ffffff", ink:"#16181c", accent:"#0071e3"},
  {id:"warm", label:"Warm paper", group:"Light", bg:"#faf5ec", surface:"#fffdf9", ink:"#2a2016", accent:"#c9683f"},
  {id:"mist", label:"Mist", group:"Light", bg:"#eef1f4", surface:"#ffffff", ink:"#141e20", accent:"#0e9f6e"},
  {id:"sand", label:"Sand", group:"Light", bg:"#f6f1e6", surface:"#fffdf7", ink:"#221d12", accent:"#7d5fd6"}
];

const ADMIN_ICONS = {
  people:"M12 12.5a3.6 3.6 0 1 0 0-7.2 3.6 3.6 0 0 0 0 7.2Z M5 20.2c.9-3.1 3.6-4.9 7-4.9s6.1 1.8 7 4.9",
  teams:"M9 12a3.2 3.2 0 1 0 0-6.4A3.2 3.2 0 0 0 9 12Z M16.5 12.5a2.6 2.6 0 1 0 0-5.2 2.6 2.6 0 0 0 0 5.2Z M2.6 19.6c.8-2.8 3.2-4.4 6.4-4.4s5.6 1.6 6.4 4.4 M17 15.4c2.2.4 3.7 1.8 4.3 4.2",
  structure:"M4.5 20V6.4A1.4 1.4 0 0 1 5.9 5h6.2a1.4 1.4 0 0 1 1.4 1.4V20 M13.5 10.5h4.6A1.4 1.4 0 0 1 19.5 12v8 M3 20h18 M7.5 8.5h2.5 M7.5 12h2.5",
  shield:"M12 3.6 19.5 6v6.1c0 4-3.1 6.9-7.5 8.3-4.4-1.4-7.5-4.3-7.5-8.3V6L12 3.6Z M9.2 12.2l2 2 3.6-3.7",
  agent:"M2 12h4l2.5-6 3.5 12 3-8 2 2h5",
  flow:"M18.5 8.5A5 5 0 0 0 8.9 7.3 3.8 3.8 0 0 0 6 14.6 M8 17.5l3.2 3.2 M11.2 20.7l3.2-3.2 M11.2 20.7V9.6",
  plug:"M9 3.5v5 M15 3.5v5 M6.5 8.5h11v3a5.5 5.5 0 0 1-11 0v-3Z M12 17v3.5",
  modules:"M6.6 4.4h10.8a2.2 2.2 0 0 1 2.2 2.2v10.8a2.2 2.2 0 0 1-2.2 2.2H6.6a2.2 2.2 0 0 1-2.2-2.2V6.6a2.2 2.2 0 0 1 2.2-2.2Z M4.4 9.6h15.2 M9.6 19.6V9.6",
  health:"M3 12.5h3.4l2-5 3 10 2.2-5H21",
  lock:"M6.5 10.5h11a1.5 1.5 0 0 1 1.5 1.5v7a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 5 19v-7a1.5 1.5 0 0 1 1.5-1.5Z M8.5 10.5V7.5a3.5 3.5 0 0 1 7 0v3",
  audit:"M8 3.5h8l3.5 3.5v13a1.5 1.5 0 0 1-1.5 1.5H6a1.5 1.5 0 0 1-1.5-1.5V5A1.5 1.5 0 0 1 6 3.5h2Z M9 12h6 M9 16h4",
  brand:"M12 3.5 14.6 9l6.4.6-4.8 4.2 1.4 6.2-5.6-3.3-5.6 3.3 1.4-6.2L3 9.6 9.4 9 12 3.5Z",
  bell:"M6 8.5a6 6 0 0 1 12 0c0 6.5 2.6 8.5 2.6 8.5H3.4S6 15 6 8.5Z M10.3 20.5a1.94 1.94 0 0 0 3.4 0",
  data:"M4.5 7.5c0-1.7 3.4-3 7.5-3s7.5 1.3 7.5 3-3.4 3-7.5 3-7.5-1.3-7.5-3Z M4.5 7.5v9c0 1.7 3.4 3 7.5 3s7.5-1.3 7.5-3v-9 M4.5 12c0 1.7 3.4 3 7.5 3s7.5-1.3 7.5-3"
};

const ADMIN_CARDS = [
  {id:"people", group:"ORGANISATION", title:"People & access", icon:"people", tint:"#6ad0f0",
   blurb:"Invite, suspend and offboard the people who use Pulse.",
   tags:["48 people","6 teams","3 locations"], badge:"3 waiting", badgeKind:"warn",
   footer:"Last login checked 4 minutes ago", action:"Review 3 invites",
   listLabel:"WHAT YOU CONTROL HERE",
   rows:[["Add, invite or remove employees","",""],["Create teams and departments","6 teams"],["Assign managers","4 reporting lines"],
     ["Set locations","Athlone workshop · Sales yard · CVRT"],["Suspend accounts","2 suspended"],["View last login","48 people tracked"]]},
  {id:"teams", group:"ORGANISATION", title:"Roles & permissions", icon:"shield", tint:"var(--accent)",
   blurb:"Permission templates, and exactly what each person can reach.",
   tags:["4 roles","64 permissions","3 scopes"],
   heroLabel:"THE QUESTION THIS ANSWERS", heroAction:"Show me what someone can access",
   heroText:"Pick a person and see every record, action and export they can reach — resolved through their grants, not guessed from the menus.",
   footer:"Preview Pulse as another user", action:"Open preview",
   listLabel:"WHAT YOU CONTROL HERE",
   rows:[["Create permission templates","4 in use"],["View, edit, export and delete access","per permission"],
     ["Restrict by team, location or record owner","3 scopes"],["Set approval limits","€10,000 threshold"],["Preview Pulse as another user",""]]},
  {id:"structure", group:"ORGANISATION", title:"Company structure", icon:"structure", tint:"#f0c04b",
   blurb:"Who reports to whom, where they work and when.",
   tags:["3 locations","Europe/Dublin","EUR"],
   listLabel:"WHAT YOU CONTROL HERE",
   rows:[["Company details","Reynolds Commercials"],["Departments","5"],["Teams","6"],["Locations","3"],
     ["Reporting lines","4"],["Working hours","08:00–17:30, Mon–Fri"],["Holidays","Irish public holidays"],
     ["Default currency and timezone","EUR · Europe/Dublin"]]},

  {id:"agents", group:"CONTROL", title:"Agents & AI controls", icon:"agent", tint:"var(--accent)",
   blurb:"What agents may read, what they may do, and where they must stop.",
   tags:["7 agents","318 actions today","€0.62 spent"],
   heroLabel:"GLOBAL CONTROL", heroAction:"Pause every agent",
   heroText:"One switch stops every agent immediately. Anything mid-run finishes its current step and then holds.",
   footer:"Write and external tools always need a yes", action:"Review limits",
   listLabel:"WHAT YOU CONTROL HERE",
   rows:[["Create approved agent roles","7 approved"],["Control which data agents can read","by permission"],
     ["Control which actions agents can take","read · write · external"],["Set approval requirements","all write tools", true],
     ["Set spending and usage limits","€40/month cap"],["Manage agent memory and retention","90 days"]]},
  {id:"wf", group:"CONTROL", title:"Workflow controls", icon:"flow", tint:"#9d8cf5",
   blurb:"The guardrails, not the builder — that lives under Work.",
   tags:["Managers only","2 approval rules","Retry twice"],
   footer:"Building workflows happens in Work", action:"Open Work",
   listLabel:"WHAT YOU CONTROL HERE",
   rows:[["Who can create workflows","Managers only"],["Maximum autonomy","proposes, never sends", true],
     ["Approval rules","2 configured"],["Failure handling","retry twice, then notify"],
     ["Usage limits","500 runs/day"],["Global pause","all workflows", true],["Default notification settings","inbox only"]]},
  {id:"notif", group:"CONTROL", title:"Notifications", icon:"bell", tint:"#f0994b",
   blurb:"Which events reach people, on which channel, and when not to.",
   tags:["Inbox","Inbox","Quiet 19:00–07:00"],
   listLabel:"WHAT YOU CONTROL HERE",
   rows:[["Which events trigger notifications","14 of 21 events"],["Email","", true],["Inbox","", true],
     ["Mobile push","", false],["In-app","", true],["Escalation rules","after 4 hours unread"],
     ["Quiet hours","19:00–07:00"],["Daily and weekly summaries","07:00 daily"]]},

  {id:"integrations", group:"SYSTEMS", title:"Integrations", icon:"plug", tint:"#6ad0f0",
   blurb:"Email, accounting, CRM and messaging — and which way data flows.",
   tags:["6 connected","1 disconnected","2 read-only"], badge:"Keyloop planned", badgeKind:"warn",
   footer:"SharePoint not connected · access to confirm", action:"Reconnect",
   listLabel:"CONNECTIONS",
   rows:[["AssetMinder","read and write"],["Keyloop","disconnected"],["Sage","read only"],["Bizimply","read and write"],
     ["Renault order book","write only"],["Renault portal","write only"],["SharePoint","not connected"]]},
  {id:"modules", group:"SYSTEMS", title:"Modules & configuration", icon:"modules", tint:"#f0c04b",
   blurb:"Turn modules on, and make Pulse speak the business's own words.",
   tags:["3 installed","1 available","2 renamed terms"],
   heroLabel:"TERMINOLOGY", heroAction:"Edit terminology",
   heroText:"Organisation reads as Merchant, and Task reads as Job, everywhere in the interface — including what Helios says back to you.",
   listLabel:"WHAT YOU CONTROL HERE",
   rows:[["Enable or disable modules","3 installed"],["Rename business terminology","2 overridden"],
     ["Create custom fields","9 fields"],["Configure statuses","6 sets"],["Edit record types","7 types"],
     ["Set required information","per record type"],["Manage form layouts","4 layouts"]]},
  {id:"health", group:"SYSTEMS", title:"Data health", icon:"health", tint:"#e2705c",
   blurb:"What is wrong with the data, how bad it is, and the fix.",
   tags:["7 issue types","231 records affected"], badge:"74 duplicates", badgeKind:"bad",
   footer:"Last scanned 12 minutes ago", action:"Fix 3 automatically",
   listLabel:"ISSUES FOUND",
   trend:[312,289,274,256,248,241,231],
   bySeverity:[["High","137",RED],["Medium","59",AMBER],["Low","35",DIM]],
   issues:[["Duplicate records","74","high","Merge on matching name and VAT number","Fix automatically"],
     ["Missing required fields","62","high","4 organisations have no billing email","Fix automatically"],
     ["Failed imports","18","medium","Re-run the 14 August Sage batch","Retry"],
     ["Out-of-date information","41","medium","Not touched in over 18 months","Review"],
     ["Broken connections","1","high","Renault portal access unverified","Reconnect"],
     ["Unmatched records","23","low","Invoices with no organisation attached","Review"],
     ["Records needing review","12","low","Flagged by an agent as inconsistent","Review"]],
   rows:[]},

  {id:"security", group:"GOVERNANCE", title:"Security", icon:"lock", tint:"#8fa6ff",
   blurb:"Sign-in, sessions, devices and the keys that reach the API.",
   tags:["SSO on","2FA enforced","3 API keys"], badge:"2 advisories", badgeKind:"warn",
   footer:"2 security recommendations open", action:"Review",
   listLabel:"WHAT YOU CONTROL HERE",
   rows:[["Single sign-on","Google Workspace", true],["Two-factor authentication","enforced", true],
     ["Login policies","30-day session"],["Active sessions","51"],["Approved devices","44"],
     ["IP restrictions","off", false],["Security alerts","on", true],["API keys","3 active"],
     ["Data retention rules","7 years"]]},
  {id:"audit", group:"GOVERNANCE", title:"Audit log", icon:"audit", tint:"#9d8cf5",
   blurb:"A locked history of who changed what. Searchable, exportable, never editable.",
   tags:["Append-only","7-year retention"],
   footer:"Nobody can edit or delete entries", action:"Export",
   listLabel:"WHAT IS RECORDED",
   rows:[["Permission changes","41 this month"],["Employee access","118"],["Data exports","9"],
     ["Integration changes","6"],["Agent actions","2,140"],["Deleted records","3"],["Admin changes","27"]]},
  {id:"datamgmt", group:"GOVERNANCE", title:"Data management", icon:"data", tint:"#5fe0a8",
   blurb:"Import, export, restore and — carefully — delete.",
   tags:["Backup 02:00","30-day restore"],
   footer:"Last backup completed 02:00 today", action:"Run backup",
   listLabel:"WHAT YOU CONTROL HERE",
   rows:[["Import data","CSV, Sage, Bizimply"],["Export data","full or per module"],["Backup status","healthy · 02:00 daily"],
     ["Restore previous versions","30 days available"],["Merge records","74 candidates"],
     ["Data retention","7 years"],["Delete company data","requires two admins"]]},

  {id:"brand", group:"EXPERIENCE", title:"Branding", icon:"brand", tint:"var(--accent)",
   blurb:"Logo, accent colour, templates and how agents appear.",
   tags:["Lime accent","2 templates"],
   listLabel:"WHAT YOU CONTROL HERE",
   rows:[["Company logo","kilbride-mark.svg"],["Pulse accent colour","oklch(0.86 0.19 118)"],
     ["Email templates","3"],["Document templates","2"],["Agent appearance","12 faces · 6 shells"],
     ["Customer-facing portal branding","on", true]]},
  {id:"appearance", group:"EXPERIENCE", title:"Appearance & themes", icon:"brand", tint:"#6ad0f0",
   blurb:"Pick a light or dark theme for how Pulse looks to you.",
   tags:["8 themes","4 dark","4 light"],
   listLabel:"THEMES", rows:[]}
];

const ADMIN_GROUPS = [
  ["ORGANISATION", "repeat(3,1fr)"],
  ["CONTROL", "repeat(3,1fr)"],
  ["SYSTEMS", "repeat(3,1fr)"],
  ["GOVERNANCE", "repeat(3,1fr)"],
  ["EXPERIENCE", "repeat(3,1fr)"]
];

/* ---- activity feeds ---- */
const SRC_TINT = {AssetMinder:"#6ad0f0", Pulse:"var(--accent)", Sage:"#8fa6ff", Bizimply:"#5fe0a8",
  Renault:"#f0994b", Agent:"var(--accent)"};
const SRC_ABBR = {AssetMinder:"AM", Pulse:"PL", Sage:"SG", Bizimply:"BZ", Renault:"RN", Agent:"AI"};

const DATA_EVENTS = [
  ["Sample order book imported","Latest Renault file flagged V019 missing from the latest file — queued for reconciliation, not marked sold.","Sample Renault order book","V019","Renault","completed"],
  ["Job card loaded","Sample inspection sheet loaded against JOB-1041 for estimate review.","Sample AssetMinder export","JOB-1041","AssetMinder","completed"],
  ["Spec sheet attached","Illustrative Renault specification matched to V024 by demo VIN.","Sample Renault portal","V024","Renault","completed"],
  ["Clocking imported","Friday's clocking export loaded: 120.0 paid hours across 15 technicians.","Sample AssetMinder export","15 technicians","AssetMinder","completed"],
  ["Invoice snapshot read","Receivables snapshot shows €18,000 outstanding, €10,800 overdue.","Sample Sage snapshot","Finance","Sage","completed"],
  ["Attendance read","Two technicians present and unallocated since this morning.","Sample Bizimply report","Workshop","Bizimply","completed"],
  ["Quote created","Q-1042 drafted for V024 — €34,000 net, awaiting discount approval.","Jack Kelly","Westway Electrical","Pulse","completed"],
  ["CVRT result recorded","V008 failed on rear brake imbalance — repair job JOB-1046 opened.","Elizabeth Reynolds","Midlands Parcel Services","Pulse","completed"],
  ["Keyloop","Planned for December — not connected. No sync performed.","Keyloop","Planned","Pulse","failed"]
];

const PEOPLE_EVENTS = [
  ["Jonathan reviewed a labour gap","Friday's 13.0 unallocated hours opened for review.","Jonathan Keenan","Workshop","Pulse","completed"],
  ["Anthony captured a request","Flag ETA changes against promised delivery dates, linked to V019.","Anthony Reynolds","V019","Pulse","completed"],
  ["Conor confirmed job work","JOB-1041 — oil + filter and front pad inspection confirmed.","Conor Keane","Shannon Cold Chain","Pulse","completed"],
  ["Darren chased a part","Rear caliper for V008 due 11:30.","Darren O'Brien","Midlands Parcel Services","Pulse","completed"],
  ["Jack prepared a quote pack","Q-1042 customer pack previewed with draft watermark.","Jack Kelly","Westway Electrical","Pulse","completed"],
  ["Elizabeth scheduled a retest","C102 repaired, retest booked.","Elizabeth Reynolds","Mayo Logistics","Pulse","completed"],
  ["Discount approval requested","Q-1042 €500 discount above the demo threshold — waiting on Anthony.","Jack Kelly","Westway Electrical","Pulse","awaiting"],
  ["Write-up review requested","JOB-1041 draft needs service sign-off before invoicing.","Jonathan Keenan","Shannon Cold Chain","Pulse","awaiting"]
];

const AI_EVENTS = [
  ["Ops Watchdog flagged JOB-1042","Billy's job at 105 of 120 minutes — warning at 85% of budget.","Ops Watchdog","Galway Haulage","Agent","working"],
  ["Job Card Assistant prepared JOB-1041 draft","Supported work only; two unconfirmed items raised as questions.","Job Card Assistant","Shannon Cold Chain","Agent","awaiting"],
  ["Stock & Specification prepared an import diff","2 added, 3 ETA changes, V019 missing — no sale created.","Stock & Specification","V019","Agent","working"],
  ["Briefing drafted the morning brief","Friday gap, Billy's job, write-ups and V008 — two need you.","Briefing","Anthony Reynolds","Agent","completed"],
  ["Sales Assistant prefilled Q-1042","Discount flagged for approval; follow-up task created.","Sales Assistant","Westway Electrical","Agent","awaiting"],
  ["Handover Coordinator checked V008","Repair, retest and accounts gates still open — handover blocked.","Handover Coordinator","Midlands Parcel Services","Agent","working"],
  ["Finance Assistant summarised readiness","€2,110 invoice-ready; €1,730 blocked on write-up.","Finance Assistant","Finance","Agent","working"],
  ["Ops Watchdog flagged two gaps","Two technicians present and unallocated this morning.","Ops Watchdog","Workshop","Agent","working"]
];

const STREAM_DEFS = [
  {id:"data", title:"New data", sub:"Information entering Pulse", pool:DATA_EVENTS, every:3200,
   tint:"#6ad0f0", icon:"M4.5 7.5c0-1.7 3.4-3 7.5-3s7.5 1.3 7.5 3-3.4 3-7.5 3-7.5-1.3-7.5-3Z M4.5 7.5v9c0 1.7 3.4 3 7.5 3s7.5-1.3 7.5-3v-9 M4.5 12c0 1.7 3.4 3 7.5 3s7.5-1.3 7.5-3"},
  {id:"people", title:"Employee activity", sub:"Decisions people made", pool:PEOPLE_EVENTS, every:6400,
   tint:"#f0c04b", icon:"M12 12.5a3.6 3.6 0 1 0 0-7.2 3.6 3.6 0 0 0 0 7.2Z M5 20.2c.9-3.1 3.6-4.9 7-4.9s6.1 1.8 7 4.9"},
  {id:"ai", title:"AI activity", sub:"Agents at work", pool:AI_EVENTS, every:4600,
   tint:"var(--accent)", icon:"M2 12h4l2.5-6 3.5 12 3-8 2 2h5"}
];

const NAV = [
  {label:"Home", icon:"helios", page:"Home"},
  {label:"Agents", icon:"navAgents", page:"Agents"},
  {label:"Dashboard", icon:"navDash", page:"Dashboard", dot:true},
  {label:"Work", icon:"navWork", page:"Work"},
  {label:"Records", icon:"navRecords", page:"Records"},
  {label:"Activity", icon:"pulseLine", page:"Activity", dot:true}
];

/* Inbox items follow the real InboxItem shape: what happened, why it matters, what I can do. */
const ITEMS = {
  v008:{kind:"Alert", importance:"critical", icon:ICONS.health, age:"40m",
    title:"V008 handover blocked — failed CVRT",
    why:"A reserved used van for Midlands Parcel Services failed its test. Repair, retest and accounts clearance are still open.",
    detail:"CVRT failed on rear brake imbalance. Repair JOB-1046 is waiting on a rear caliper (sample ETA 11:30). A repair finishing does not pass the test — the retest is a separate, reviewed outcome. Each release gate has a named owner.",
    actionLabel:"Open V008", secondaryLabel:"View gates", group:"Alerts",
    fields:[{k:"Provider",v:"handover.gates"},{k:"Vehicle",v:"V008"},{k:"Repair",v:"JOB-1046"},{k:"Customer",v:"Midlands Parcel Services"}],
    history:[{when:"Today 09:30",text:"CVRT recorded a fail"},{when:"Today 09:35",text:"Repair JOB-1046 opened, part on order"}]},
  gaps:{kind:"Alert", importance:"high", icon:ICONS.autos, age:"35m",
    title:"Two technicians present but unallocated",
    why:"Seán Doyle has had no job clocking since 09:25, Rachel Byrne since 09:42. Both are present, neither is on an approved break.",
    detail:"The live board surfaces this while the day is still recoverable. Reviewing opens the underlying clock evidence and a reason editor; it does not change the raw clocking.",
    actionLabel:"Open Live Board", secondaryLabel:"Record a reason", group:"Alerts",
    fields:[{k:"Provider",v:"workshop.liveboard"},{k:"Seán Doyle",v:"idle 35 min"},{k:"Rachel Byrne",v:"idle 18 min"},{k:"Source",v:"Sample AssetMinder export"}],
    history:[{when:"Today 09:25",text:"Seán clocked off his last job"},{when:"Today 09:42",text:"Rachel clocked off her last job"}]},
  billy:{kind:"Alert", importance:"high", icon:ICONS.work, age:"10m",
    title:"Billy's JOB-1042 at 105 of 120 minutes",
    why:"Galway Haulage brake investigation is at 87.5% of its approved time budget. Warning fires at 85% consumed.",
    detail:"This is elapsed time against budget, not physical completion. Next up is JOB-1043 for Mayo Logistics at 10:15. You can review the budget or move the next job, with a reason.",
    actionLabel:"Open Live Board", secondaryLabel:"Move next job", group:"Alerts",
    fields:[{k:"Provider",v:"workshop.watchdog"},{k:"Job",v:"JOB-1042"},{k:"Consumed",v:"105 / 120 min"},{k:"Next",v:"JOB-1043 · 10:15"}],
    history:[{when:"Today 08:15",text:"Billy clocked on"},{when:"Today 10:00",text:"Ops Watchdog flagged 85% of budget"}]},
  writeups:{kind:"Task", importance:"high", icon:ICONS.approvals, age:"2h",
    title:"3 completed jobs await write-up review",
    why:"€1,730 net is ready to invoice once the technician confirms the work and the service manager approves.",
    detail:"JOB-1041 (€780) is the one to start on — oil and filter plus a front-pad inspection are supported by the notes; pads and wipers are not. Unconfirmed items are shown as questions, not customer narrative.",
    actionLabel:"Open Job Cards", secondaryLabel:"Open Approvals", group:"Work",
    fields:[{k:"Provider",v:"workshop.jobcards"},{k:"Blocked",v:"€1,730 · 3 jobs"},{k:"Ready",v:"€2,110 · 3 jobs"},{k:"Start with",v:"JOB-1041"}],
    history:[{when:"Today 09:10",text:"Job Card Assistant prepared the JOB-1041 draft"},{when:"Today 09:12",text:"Flagged for technician confirmation"}]},
  discount:{kind:"Approval", importance:"high", icon:ICONS.approvals, age:"1h",
    title:"Q-1042 — €500 discount needs your approval",
    why:"Raised by Jack Kelly for Westway Electrical. The €500 discount is above the €250 demo threshold, so it routed to you.",
    detail:"Quote is €34,000 net on V024. Missing approved specification and this pending discount both stop it reaching Ready for customer. The customer pack previews with a draft watermark until then.",
    actionLabel:"Review Q-1042", secondaryLabel:"Request changes", group:"Approvals",
    fields:[{k:"Provider",v:"sales.approvals"},{k:"Requested by",v:"Jack Kelly"},{k:"Quote",v:"Q-1042 · €34,000"},{k:"Discount",v:"€500"}],
    history:[{when:"Today 08:50",text:"Jack Kelly raised the quote"},{when:"Today 08:50",text:"Routed to Anthony Reynolds — over threshold"}]}
};
const ORDER = ["v008","gaps","billy","writeups","discount"];

const ANSWERS = {
  workshop:{tool:"workshop_clocking", effect:"read",
    text:"Friday had 13.0 unallocated workshop hours — a €1,040 billing equivalent at the demo €80/hour rate, not confirmed lost revenue. Today two technicians are present but unallocated (Seán since 09:25, Rachel since 09:42), and Billy's Galway Haulage job has used 105 of 120 minutes.",
    cols:["Bucket","Hours","Share"],
    rows:[["Job-allocated","94.0","78%"],["Approved breaks","7.5","6%"],["Internal work","5.5","5%"],["Unallocated — review","13.0","11%"]],
    actions:[["Open Workshop → Clocking",0],["Open the two live gaps",0]]},
  v008:{tool:"vehicle_timeline", effect:"read",
    text:"V008 is a reserved used Master van for Midlands Parcel Services. Its CVRT failed on rear brake imbalance, so repair JOB-1046 is open and waiting on a rear caliper with a sample ETA of 11:30. Handover is blocked: the repair, the retest and accounts clearance are each separate gates. A repair finishing does not pass the test.",
    cols:["Gate","Owner","State"],
    rows:[["Parts (caliper)","Darren O'Brien","ETA 11:30"],["Repair readiness","Jonathan Keenan","blocked"],["Retest","Elizabeth Reynolds","after repair"],["Accounts clearance","Caroline Glynn","pending"]],
    actions:[["Open V008 record",0],["Open the repair handover",0]]},
  meeting:{tool:"morning_meeting", effect:"read",
    text:"Today's meeting reads the same records as the rest of Pulse. Five sections are enabled: Greeting, Events, Readiness, Preview and Photos. Billy's current Galway Haulage job and next Mayo Logistics job come straight from the planner — nothing retyped. Today's absence and the breakdown rota are included.",
    cols:["Section","State"],
    rows:[["Greeting","enabled"],["Events","enabled"],["Readiness","enabled · 3 columns"],["Preview","enabled · 15 technicians"],["Photos","enabled"]],
    actions:[["Open the morning meeting",0],["Edit sections",0]]},
  quote:{tool:"quote_builder", effect:"read",
    text:"V024 is an incoming Renault Master chassis cab due 20 October with no approved specification sheet yet. Q-1042 for Westway Electrical totals €34,000 net: €32,500 vehicle + €1,250 options + €750 delivery, less a €500 discount. Two gates are open — the €500 discount needs your approval (demo policy above €250) and the specification needs attaching before it can reach Ready for customer.",
    cols:["Line","Amount"],
    rows:[["Vehicle","€32,500"],["Options","€1,250"],["Delivery / prep","€750"],["Discount","−€500"],["Net quote","€34,000"]],
    actions:[["Open Q-1042",0],["Attach a sample spec to V024",0]]},
  fallback:{tool:"pulse_search", effect:"read",
    text:"This is a demo preview with sample responses. I answer from the seeded Reynolds records — workshop jobs, vehicle stock, sales, CVRT, parts and finance — and link to the exact record. Nothing is sent externally, and Keyloop is planned, not connected.",
    actions:[["Show me today's priorities",0]]}
};

// Turns a plain-English filter name into a full dashboard area — the "primitive
// vibe-coding" bit: no real backend, just a seeded generator so the same phrase
// always produces the same numbers, with direction and vocabulary nudged by
// keywords in the text (expansion/growth trends up, risk/issue trends down, a
// region/cost/people/ops/customer word picks which metrics show).
function synthesizeCustomArea(name){
  const trimmed = (name || "").trim();
  if (!trimmed) return null;
  let seed = 0;
  for (let i = 0; i < trimmed.length; i++) seed = (seed * 31 + trimmed.charCodeAt(i)) >>> 0;
  const rnd = (n) => (((seed >>> (n % 24)) ^ (seed << ((n * 7) % 13))) >>> 0) % 997 / 997;
  const low = trimmed.toLowerCase();
  const has = (...words) => words.some(w => low.indexOf(w) > -1);
  const growth = has("expansion","growth","launch","scale","pilot","new site","open","opening","grow");
  const risk = has("risk","issue","delay","problem","complaint","fault","incident","churn","decline");
  const dir = risk ? -1 : (growth ? 1 : (rnd(2) > 0.45 ? 1 : -1));

  let vocab = "generic";
  if (has("scotland","ireland","wales","england","region","dublin","belfast","cork","galway","london","glasgow","edinburgh"))
    vocab = "region";
  else if (has("cost","spend","budget","saving","margin")) vocab = "cost";
  else if (has("staff","hiring","team","recruit","headcount")) vocab = "people";
  else if (has("supplier","stock","inventory","warehouse","fleet")) vocab = "ops";
  else if (has("customer","client","retention","account")) vocab = "customer";

  const V = {
    region:   {labels:["New enquiries","Orders won","Revenue","Site coverage"], unit:"EUR — 30 DAYS"},
    cost:     {labels:["Spend","Cost per job","Savings found","Budget used"], unit:"EUR — 30 DAYS"},
    people:   {labels:["Headcount","Open roles","Time to hire","Retention"], unit:"PEOPLE"},
    ops:      {labels:["Stock cover","Lead time","Stockouts","Reorders raised"], unit:"DAYS"},
    customer: {labels:["Active accounts","Repeat rate","Churn","NPS"], unit:"ACCOUNTS"},
    generic:  {labels:["Volume","Rate","Cost","Coverage"], unit:"ACTIVITY — 30 DAYS"}
  }[vocab];

  const months = ["Sep","Oct","Nov","Dec","Jan","Feb","Mar","Apr","May","Jun","Jul","Aug"];
  let v0 = 40 + Math.floor(rnd(1) * 220);
  const chart = months.map((m, i) => {
    v0 = Math.max(8, Math.round(v0 * (1 + dir * (0.03 + rnd(i + 3) * 0.07))));
    return [m, v0, String(v0)];
  });
  const metrics = V.labels.map((label, i) => {
    const val = 20 + Math.floor(rnd(i + 5) * 400);
    const pct = 2 + Math.round(rnd(i + 9) * 18);
    const up = dir > 0 ? rnd(i + 12) > 0.25 : rnd(i + 12) > 0.7;
    const bars = [0,1,2,3,4,5,6,7,8].map(k => 0.3 + rnd(i * 3 + k) * 0.7);
    return [label, i === 1 ? pct + "%" : String(val), (up ? "+" : "\u2212") + pct + (i === 1 ? "pt" : "%"), up ? "up" : "down", "vs last month", bars];
  });
  const capName = trimmed.replace(/\b\w/g, c => c.toUpperCase());
  const split = [
    [capName + " \u2014 direct", String(Math.round(v0 * 0.5)), "48%", 1],
    ["Existing pipeline", String(Math.round(v0 * 0.3)), "31%", 0],
    ["Everything else", String(Math.round(v0 * 0.2)), "21%", 0]
  ];
  const table = [1,2,3].map(w => [capName + " \u2014 week " + w, String(20 + Math.floor(rnd(20 + w) * 200)),
    (dir > 0 ? "+" : "\u2212") + (3 + Math.floor(rnd(23 + w) * 14)) + "%", "Auto-tagged from records mentioning \u201c" + low + "\u201d"]);
  table.push(["Everything else", String(20 + Math.floor(rnd(30) * 200)), "\u2014", "Baseline"]);
  return {
    id: trimmed, label: capName, color: "var(--accent)", owner: "CUSTOM FILTER",
    description: "Generated from \u201c" + trimmed + "\u201d \u2014 a plain-English filter, not a registered metric set. Refine it and Pulse will tighten this up.",
    kind: "columns", chartTitle: capName + " over time", chartUnit: V.unit,
    chart, splitTitle: "Where \u201c" + low + "\u201d shows up", split,
    tableCols: ["Item","Value","Change","Note"], table,
    metrics, legend: [capName, "Pipeline", "Other"]
  };
}

function pickAnswer(q){
  const s = q.toLowerCase();
  if (/v008|handover|cvrt|test fail|midlands|story with v/.test(s)) return ANSWERS.v008;
  if (/quote|v024|westway|deal|discount/.test(s)) return ANSWERS.quote;
  if (/meeting|morning|presentation|brief/.test(s)) return ANSWERS.meeting;
  if (/workshop|losing|time|gap|unallocated|labour|clock|billy|budget/.test(s)) return ANSWERS.workshop;
  return ANSWERS.fallback;
}

const ORGS = [
  ["Corrib Plant Hire","Customer","€4,800","17 days","overdue"],
  ["Boyle Agri Contracts","Customer","€3,600","10 days","overdue"],
  ["Tuam Builders Providers","Customer","€2,400","3 days","watch"],
  ["Galway Haulage","Customer","€7,200","due 30 Oct","active"],
  ["Renault Trucks Ireland","Supplier","—","—","active"],
  ["CV Parts Direct","Supplier","—","—","active"]
];
const TEAMS = [
  ["Workshop","15 members","Jonathan Keenan","job allocation, clocking"],
  ["Parts","3 members","Darren O'Brien","parts, blockers"],
  ["Sales","3 members","Jack Kelly","quotes, handovers"],
  ["CVRT","2 members","Elizabeth Reynolds","test results, retests"],
  ["Accounts","3 members","Caroline Glynn","invoice readiness"],
  ["Management","2 members","Anthony Reynolds","all permissions"]
];
const LOCATIONS = [
  ["Athlone — workshop","Tones Road, Walderstown, Athlone","22 staff","active"],
  ["Athlone — CVRT centre","Tones Road, Walderstown, Athlone","4 staff","active"],
  ["Sales & stock yard","Tones Road, Walderstown, Athlone","4 staff","active"]
];

const AGENT_DEFS = [
  {id:"briefing", name:"Briefing", shape:"crown-pebble", tint:"#1b2430", state:"complete", role:"Reads the whole business every morning and drafts the morning meeting and an executive briefing",
   when:"08:02", preview:"two things need you. the rest is covered.",
   thread:[
     {kind:"stamp", text:"Today 08:00"},
     {kind:"routine", text:"Ran routine", routine:"Morning meeting prep"},
     {kind:"agent", text:"morning briefing:", lines:[
       {k:"Labour", v:"Friday had 13.0 unallocated hours · €1,040 equivalent (not confirmed lost revenue)"},
       {k:"Live", v:"two technicians unallocated · Billy at 105/120 minutes"},
       {k:"Invoicing", v:"€3,840 completed · €1,730 blocked on write-up · V008 handover blocked"}]},
     {kind:"agent", text:"two things need you today: the Q-1042 discount, and whether to move Billy's next job. everything else is covered."},
     {kind:"user", text:"prepare the morning meeting"},
     {kind:"agent", text:"done — five sections enabled, Billy's current and next jobs pulled straight from the planner. nothing retyped. i've drafted it; it waits for you to present."}
   ]},
  {id:"watchdog", name:"Ops Watchdog", shape:"shield", tint:"#2b1b1e", state:"attention", role:"Flags unallocated technicians, approaching budgets, overdue blockers and stale source data",
   when:"10:00", preview:"billy at 105/120 minutes. two technicians idle.",
   thread:[
     {kind:"stamp", text:"Today 10:00"},
     {kind:"agent", text:"JOB-1042 (Billy, Galway Haulage) is at 105 of 120 minutes — 87.5% of the approved budget. this is elapsed time against budget, not physical completion."},
     {kind:"agent", text:"also two technicians present and unallocated: Seán since 09:25, Rachel since 09:42. neither is on an approved break. breaks, leave and training are excluded from this."},
     {kind:"user", text:"what are the rules"},
     {kind:"agent", text:"configurable demo assumptions: gap over 15 minutes, warn at 85% of budget, over-budget above 100%. i won't treat stale data as proof anyone is idle."}
   ]},
  {id:"jobcard", name:"Job Card Assistant", shape:"executive-capsule", tint:"#2a2118", state:"waiting", role:"Turns verified notes into readable descriptions, shows missing facts and prepares a review",
   when:"09:12", preview:"JOB-1041 draft ready. two questions raised.",
   thread:[
     {kind:"stamp", text:"Today 09:10"},
     {kind:"routine", text:"Ran routine", routine:"Job card draft"},
     {kind:"agent", text:"JOB-1041 notes: “Oil + oil filter changed. Front pads inspected; no replacement needed. Wipers not checked.” i've drafted only the supported work: oil/filter replacement and front-pad inspection."},
     {kind:"agent", text:"two questions, kept out of the customer narrative: were the pads replaced? were the wipers checked? i can't invent measurements, parts or performed work, and i can't approve my own draft."},
     {kind:"user", text:"conor confirmed, pads not replaced, wipers n/a"},
     {kind:"agent", text:"updated. once the service manager approves, JOB-1041 moves to invoice-ready — €780 net, from the fixed job record, not generated from prose."}
   ]},
  {id:"stockspec", name:"Stock & Specification", shape:"control-cube", tint:"#16241f", state:"working", role:"Prepares import diffs, flags missing VINs and documents, matches sample attachments",
   when:"09:00", preview:"V019 missing from the latest file. not a sale.",
   thread:[
     {kind:"stamp", text:"Today 09:00"},
     {kind:"agent", text:"compared the order book: previous 26 ids against the latest 27-row file. 2 added, 3 ETA changes, and V019 absent. a missing row never becomes Sold automatically."},
     {kind:"agent", text:"V019 was promised to Mayo Logistics, so i've kept it tracked incoming with a review flag and raised a reconciliation task for Jack. six active vehicles still lack an approved spec, including V024."},
     {kind:"user", text:"attach a sample spec to v024"},
     {kind:"agent", text:"attached an illustrative sample, labelled “not manufacturer specifications”, matched by the demo VIN. no actual Renault portal access is available."}
   ]},
  {id:"sales", name:"Sales Assistant", shape:"low-dome", tint:"#241b2e", state:"waiting", role:"Prefills quotes and draft document packs, highlights discounts needing approval and creates follow-ups",
   when:"08:50", preview:"Q-1042 ready. discount needs your yes.",
   thread:[
     {kind:"stamp", text:"Today 08:50"},
     {kind:"agent", text:"Q-1042 for Westway Electrical on V024: €32,500 vehicle + €1,250 options + €750 delivery, less €500 discount = €34,000 net. the €500 discount is above the €250 demo threshold, so it needs your approval."},
     {kind:"agent", text:"i've prepared the customer pack — Dealsheet, manufacturer/new-customer sheet and a SIMI draft slot — from one deal record. it previews with a draft watermark while the spec and discount are open. i can't approve discounts or send anything."}
   ]},
  {id:"finance", name:"Finance Assistant", shape:"offset-pebble", tint:"#191c1f", state:"working", role:"Summarises invoice readiness and imported balances, drafts reminders and points to missing evidence",
   when:"Today", preview:"€2,110 ready · €1,730 blocked · €10,800 overdue.",
   thread:[
     {kind:"stamp", text:"Today 09:30"},
     {kind:"agent", text:"six completed jobs total €3,840 net. €2,110 is invoice-ready across 3 jobs; €1,730 is blocked on write-up across 3. receivables are €18,000 outstanding, €10,800 overdue across 3 invoices."},
     {kind:"agent", text:"i never post an invoice, change a ledger or mark a payment received. invoice-ready is not invoiced revenue, and these are imported balances, not tax or net figures."}
   ]},
  {id:"handover", name:"Handover Coordinator", shape:"rim-capsule", tint:"#2b1b1e", state:"attention", role:"Combines sales, workshop, parts, test, document and accounts gates and explains the next owner",
   when:"09:35", preview:"V008 blocked: repair, retest, accounts.",
   thread:[
     {kind:"stamp", text:"Today 09:35"},
     {kind:"agent", text:"V008 for Midlands Parcel Services can't leave. failed CVRT, open repair JOB-1046 waiting on a rear caliper (ETA 11:30), retest not done, accounts not cleared. each gate has an owner."},
     {kind:"agent", text:"a parts receipt can unblock the repair; a completed repair can enable retest scheduling. neither alone passes the test or releases the van. i can't certify roadworthiness or override a gate."}
   ]}
];

const KPI_DEFS = {
  allocation:{label:"Labour allocation", value:"83.6%", delta:"Friday", dir:"down", hint:"job time ÷ paid less breaks", hero:true},
  unallocated:{label:"Unallocated — review", value:"13.0 h", delta:"€1,040 equiv", dir:"down", hint:"Friday · investigate"},
  openJobs:{label:"Open workshop jobs", value:"24", delta:"8 queued", dir:"up", hint:"live today"},
  invoiceReady:{label:"Invoice-ready", value:"€2,110", delta:"3 jobs", dir:"up", hint:"of €3,840 completed"},
  writeupBlocked:{label:"Write-up blocked", value:"€1,730", delta:"3 jobs", dir:"down", hint:"needs confirmation"},
  activeStock:{label:"Active stock", value:"26", delta:"8 incoming", dir:"up", hint:"18 on site"},
  overdue:{label:"Overdue debt", value:"€10,800", delta:"3 invoices", dir:"down", hint:"of €18,000 outstanding"},
  cvrt:{label:"CVRT today", value:"12", delta:"2 awaiting repair", dir:"up", hint:"bookings"}
};

const ASPECT_DEFS = [
  {id:"sales", label:"Sales", color:"var(--accent)", owner:"JACK KELLY", description:"Counter, trade accounts and quotes out the door.",
   kind:"columns", chartTitle:"Revenue by month", chartUnit:"EUR",
   chart:[["Sep",288,"€0k"],["Oct",301,"€0k"],["Nov",352,"€0k"],["Dec",376,"€0k"],["Jan",268,"€0k"],["Feb",294,"€0k"],["Mar",318,"€0k"],["Apr",341,"€0k"],["May",362,"€0k"],["Jun",384,"€0k"],["Jul",398,"€0k"],["Aug",413,"€0k"]],
   splitTitle:"Where it came from",
   split:[["Trade counter","€214.6k","72%",1],["Contract accounts","€156.8k","53%",0],["Online orders","€41.4k","18%",0]],
   tableCols:["Account","Revenue","Change","Owner"],
   table:[["Galway Haulage","€48,210","+12.4%","Jack Kelly"],["Mayo Logistics","€28,410","−18.2%","Caroline Glynn"],["Midlands Parcel Services","€21,860","+4.1%","Jack Kelly"],["Corrib Plant Hire","€18,240","+9.6%","Jonathan Keenan"]],
   metrics:[["Revenue","€412,800","+6.2%","up","30 days",[.4,.55,.44,.62,.5,.7,.6,.78,1]],
     ["Orders","318","+22","up","30 days",[.5,.6,.44,.7,.55,.75,.62,.8,.9]],
     ["Average order","€1,298","+1.8%","up","vs last month",[.6,.58,.62,.6,.66,.64,.7,.68,.74]],
     ["Quotes won","41%","−3pt","down","conversion",[.7,.66,.7,.6,.62,.55,.58,.5,.48]]]},
  {id:"development", label:"Development", color:"#9fd6f0", owner:"JONATHAN KEENAN", description:"Modules shipped into the client build and what they contributed.",
   kind:"rows", rows:[["approval routing","412 runs",412],["overdue reminder","308 runs",308],["visit escalation","286 runs",286],["xero sync","198 runs",198],["briefing job","80 runs",80]], chartTitle:"Runs by automation", chartUnit:"RUNS · 30 DAYS",
   chart:[["Sep",620,"620"],["Oct",684,"684"],["Nov",712,"712"],["Dec",760,"760"],["Jan",802,"802"],["Feb",864,"864"],["Mar",918,"918"],["Apr",986,"986"],["May",1042,"1042"],["Jun",1128,"1128"],["Jul",1204,"1204"],["Aug",1284,"1284"]],
   splitTitle:"Runs by module",
   split:[["core","1,042","81%",1],["site-visits","198","15%",0],["ui-showcase","44","4%",0]],
   tableCols:["Module","Version","Contributions","State"],
   table:[["core","0.1.0","31 routes · 21 events","always installed"],["site-visits","1.0.0","1 entity · 2 tools","installed"],["ui-showcase","0.1.0","3 pages","installed"],["wholesale","—","6 entities · 9 tools","available"]],
   metrics:[["Modules live","3","+1","up","this quarter",[.2,.2,.4,.4,.4,.6,.6,.6,1]],
     ["Helios tools","11","+2","up","registered",[.4,.44,.5,.5,.6,.6,.7,.8,.9]],
     ["Automation runs","1,284","+9%","up","30 days",[.5,.55,.6,.58,.66,.7,.72,.8,.86]],
     ["Failure rate","0.9%","−0.4pt","up","of all runs",[.8,.74,.7,.62,.6,.5,.44,.4,.32]]]},
  {id:"marketing", label:"Marketing", color:"#e6c78a", owner:"CAROLINE GLYNN", description:"Reach, enquiries and what turned into an account.",
   kind:"funnel", funnel:[["Enquiries","184","—",184],["Quoted","96","52% of enquiries",96],["Won","39","41% of quotes",39],["Repeat order","12","31% of wins",12]], chartTitle:"Enquiry to repeat order", chartUnit:"CONVERSION",
   chart:[["Sep",96,"96"],["Oct",104,"104"],["Nov",88,"88"],["Dec",112,"112"],["Jan",124,"124"],["Feb",118,"118"],["Mar",136,"136"],["Apr",142,"142"],["May",151,"151"],["Jun",164,"164"],["Jul",172,"172"],["Aug",184,"184"]],
   splitTitle:"Where they came from",
   split:[["Referral","78","42%",1],["Search","61","33%",0],["Trade shows","29","16%",0],["Direct","16","9%",0]],
   tableCols:["Channel","Enquiries","Change","Cost each"],
   table:[["Referral","78","+18.2%","€0.00"],["Search","61","+9.4%","€24.60"],["Trade shows","29","−6.1%","€41.20"],["Direct","16","+2.0%","€0.00"]],
   metrics:[["Enquiries","184","+31","up","30 days",[.3,.4,.36,.5,.46,.6,.58,.7,.86]],
     ["New accounts","12","+4","up","opened",[.2,.3,.24,.4,.36,.5,.44,.6,.7]],
     ["Cost per enquiry","€18.40","−€2.10","up","blended",[.8,.76,.7,.66,.6,.56,.5,.46,.4]],
     ["Repeat rate","68%","+3pt","up","ordering again",[.5,.54,.58,.56,.62,.64,.66,.7,.74]]]},
  {id:"operations", label:"Operations", color:"#dcded6", owner:"BILLY ELLIOTT", description:"Installers, vans, site visits and the work queue.",
   kind:"stacked", legend:["Athlone workshop","Sales & stock","CVRT centre"], stacked:[["Sep",[34,28,9]],["Oct",[36,30,9]],["Nov",[39,32,10]],["Dec",[37,31,10]],["Jan",[32,27,8]],["Feb",[35,29,9]],["Mar",[40,33,10]],["Apr",[43,35,11]],["May",[46,37,12]],["Jun",[49,39,12]],["Jul",[52,42,13]],["Aug",[64,48,14]]], chartTitle:"Jobs completed by month", chartUnit:"JOBS",
   chart:[["Sep",88,"88"],["Oct",94,"94"],["Nov",102,"102"],["Dec",96,"96"],["Jan",84,"84"],["Feb",91,"91"],["Mar",104,"104"],["Apr",112,"112"],["May",118,"118"],["Jun",121,"121"],["Jul",124,"124"],["Aug",126,"126"]],
   splitTitle:"By location",
   split:[["Athlone workshop","64","51%",1],["Sales & stock","48","38%",0],["CVRT centre","14","11%",0]],
   tableCols:["Installer","Jobs","On time","Location"],
   table:[["Billy Elliott","41","94%","Sales yard"],["Jonathan Keenan","34","88%","Athlone workshop"],["Jack Kelly","28","96%","Athlone workshop"],["Unassigned","4","—","Sales yard"]],
   metrics:[["Jobs completed","126","+4","up","30 days",[.5,.6,.5,.66,.6,.7,.66,.76,.84]],
     ["Overdue tasks","11","+3","down","past due",[.3,.36,.3,.44,.4,.5,.56,.7,.85]],
     ["Visits completed","38","+11%","up","30 days",[.4,.5,.6,.5,.66,.6,.72,.8,.9]],
     ["Installer hours","84%","−2pt","down","billable",[.8,.78,.8,.76,.78,.74,.76,.72,.7]]]},
  {id:"finance", label:"Finance", color:"#7fd8a4", owner:"CAROLINE GLYNN", description:"Cash in, debt ageing and margin after cost.",
   kind:"area", chartTitle:"Cash collected by month", chartUnit:"EUR",
   chart:[["Sep",252,"€0k"],["Oct",268,"€0k"],["Nov",296,"€0k"],["Dec",318,"€0k"],["Jan",246,"€0k"],["Feb",264,"€0k"],["Mar",288,"€0k"],["Apr",306,"€0k"],["May",324,"€0k"],["Jun",342,"€0k"],["Jul",358,"€0k"],["Aug",368,"€0k"]],
   splitTitle:"Debt by age",
   split:[["0–30 days","€184.2k","61%",1],["31–60 days","€82.4k","27%",0],["61–90 days","€28.6k","9%",0],["90 days plus","€12.6k","4%",0]],
   tableCols:["Account","Balance","Change","Oldest"],
   table:[["Mayo Logistics","€28,410","+42.0%","74 days"],["Midlands Parcel Services","€9,240","+11.2%","63 days"],["Corrib Plant Hire","€3,560","−4.4%","61 days"],["Boyle Agri Contracts","€1,180","−22.0%","8 days"]],
   metrics:[["Cash collected","€368,140","+4.1%","up","30 days",[.5,.56,.5,.62,.58,.68,.66,.74,.8]],
     ["Overdue debt","€41,200","+€8,410","down","60 days plus",[.3,.34,.4,.38,.46,.5,.6,.7,.84]],
     ["Gross margin","31.4%","−0.6pt","down","vs last month",[.7,.72,.7,.68,.68,.66,.64,.62,.6]],
     ["Days to pay","38","+6","down","weighted",[.4,.44,.42,.5,.52,.6,.62,.7,.76]]]},
  {id:"support", label:"Support", color:"#e2705c", owner:"JACK KELLY", description:"Callbacks, warranty work and what came back twice.",
   kind:"dots", target:12, targetLabel:"Target: 12 callbacks a month or fewer", chartTitle:"Callbacks by month", chartUnit:"COUNT",
   chart:[["Sep",18,"18"],["Oct",16,"16"],["Nov",21,"21"],["Dec",19,"19"],["Jan",24,"24"],["Feb",22,"22"],["Mar",17,"17"],["Apr",15,"15"],["May",14,"14"],["Jun",12,"12"],["Jul",9,"9"],["Aug",7,"7"]],
   splitTitle:"By cause",
   split:[["Install fault","3","43%",1],["Part failure","2","29%",0],["User error","2","28%",0]],
   tableCols:["Site","Callbacks","First-visit fix","Cost"],
   table:[["Tuam Builders Providers","2","50%","€840"],["Galway Haulage","2","100%","€410"],["Midlands Parcel Services","2","100%","€1,240"],["Shannon Cold Chain","1","100%","€650"]],
   metrics:[["Open callbacks","7","−2","up","live",[.6,.58,.54,.5,.48,.44,.4,.38,.34]],
     ["First-visit fix","82%","+4pt","up","of callbacks",[.5,.54,.56,.6,.6,.66,.7,.74,.8]],
     ["Warranty cost","€3,140","−€420","up","30 days",[.7,.66,.62,.6,.54,.5,.46,.44,.4]],
     ["Repeat faults","3","−1","up","same site",[.5,.5,.46,.4,.4,.36,.3,.3,.26]]]}
];

const FILTER_GROUPS = [
  {title:"AREA", items:["Sales","Development","Marketing","Operations","Finance","Support"]},
  {title:"SPINE", items:["Location","Team","Person","Organisation","Module"]},
  {title:"TIME", items:["This week","This month","This quarter","Year to date"]}
];

const OPS_DEFS = [
  {id:"o1", name:"Weekly management report", kind:"report", owner:"Chief of Staff", ownerKind:"agent", initials:"CS",
   trigger:"Mon, 08:00", triggerKind:"schedule", next:"3 days", last:"Sent to 4 people", status:"healthy", rate:98, on:true,
   what:"Pulls last week's numbers from every area, writes the commentary and sends one page to the management team before Monday's meeting.",
   why:"The meeting used to start with twenty minutes of people reading numbers off their own screens.",
   saved:"6 hours a month",
   steps:[["Trigger","Every Monday at 08:00"],["Find","Last week's metrics across all six areas"],["Check","Flag anything moving more than 10%"],["Draft","Write the one-page commentary"],["Send","Email the management team"],["Update","File the report against the week"]],
   runs:[["Mon 08:00","1m 12s","ok","4 recipients","€0.04"],["Mon 25 Aug 08:00","1m 04s","ok","4 recipients","€0.04"],["Mon 18 Aug 08:00","58s","ok","4 recipients","€0.03"]]},
  {id:"o2", name:"Chase unpaid invoices", kind:"automation", owner:"Finance Agent", ownerKind:"agent", initials:"FA",
   trigger:"Daily, 09:00", triggerKind:"schedule", next:"Tomorrow", last:"3 drafts waiting", status:"approval", rate:94, on:true,
   what:"Finds invoices past 14 days, excludes anything disputed, drafts a reminder in your tone and parks it for the finance manager.",
   why:"Chasing was happening in bursts, so the oldest debt got the least attention.",
   saved:"11 hours a month",
   steps:[["Trigger","Every weekday at 09:00"],["Find","Unpaid invoices older than 14 days"],["Check","Exclude disputed invoices"],["Draft","Create personalised reminders"],["Approval","Finance manager reviews","gate"],["Send","Email the customer"],["Update","Record the activity in Pulse"]],
   runs:[["Today 09:00","42s","partial","3 of 7 drafted","€0.02","4 organisations have no billing email"],["Yesterday 09:00","51s","ok","6 sent","€0.03"],["Mon 09:00","47s","ok","5 sent","€0.03"]]},
  {id:"o3", name:"New enquiry follow-up", kind:"automation", owner:"Sales Agent", ownerKind:"agent", initials:"SA",
   trigger:"New lead created", triggerKind:"event", next:"Event-based", last:"11 followed up today", status:"healthy", rate:99, on:true,
   what:"Answers a new enquiry within minutes, asks the two questions the counter always needs, and creates the quote task.",
   why:"Enquiries arriving after 5pm were sitting until the next morning.",
   saved:"14 hours a month",
   steps:[["Trigger","A lead is created in Pulse"],["Find","Match against existing organisations"],["Draft","Write the first reply"],["Send","Email the enquiry"],["Update","Create a quote task for the counter"]],
   runs:[["Today 16:20","6s","ok","1 lead","€0.01"],["Today 15:02","7s","ok","1 lead","€0.01"],["Today 11:48","6s","ok","1 lead","€0.01"]]},
  {id:"o4", name:"Certificate renewal reminder", kind:"routine", owner:"Operations", ownerKind:"person", initials:"TW",
   trigger:"60 days before expiry", triggerKind:"event", next:"14:20", last:"Failed — missing contact", status:"failed", rate:71, on:true,
   what:"Watches every technician certificate and insurance document, and gives sixty days' notice before one lapses.",
   why:"A lapsed certificate stopped two jobs last year.",
   saved:"3 hours a month",
   steps:[["Trigger","60 days before a document expires"],["Find","The owner of the certificate"],["Check","Has a renewal already been booked?"],["Send","Notify the owner and Operations"],["Update","Create the renewal task"]],
   runs:[["Today 14:20","3s","failed","0 of 2","€0.00","No contact on file for CVRT centre"],["Yesterday 14:20","4s","failed","0 of 1","€0.00","No contact on file for CVRT centre"],["Fri 14:20","5s","ok","1 notified","€0.01"]]},
  {id:"o5", name:"Morning briefing", kind:"routine", owner:"Briefing Agent", ownerKind:"agent", initials:"BR",
   trigger:"Weekdays, 07:00", triggerKind:"schedule", next:"Tomorrow", last:"Delivered 07:02", status:"healthy", rate:100, on:true,
   what:"Reads the whole business overnight and tells you the two things that actually need you.",
   why:"You were opening six screens before your first coffee.",
   saved:"9 hours a month",
   steps:[["Trigger","Every weekday at 07:00"],["Find","Overnight changes across cash, work and approvals"],["Check","Drop anything already handled"],["Draft","Write the briefing"],["Send","Post to Home and Inbox"]],
   runs:[["Today 07:00","22s","ok","1 briefing","€0.02"],["Yesterday 07:00","19s","ok","1 briefing","€0.02"],["Mon 07:00","24s","ok","1 briefing","€0.02"]]},
  {id:"o6", name:"Weekly stock check", kind:"task", owner:"Stock Watch", ownerKind:"agent", initials:"SW",
   trigger:"Thursdays, 09:00", triggerKind:"schedule", next:"Thu 09:00", last:"2 lines flagged", status:"healthy", rate:96, on:true,
   what:"Compares reorder points against what the week's jobs need and raises the purchase order lines.",
   why:"Two jobs were rescheduled in June for parts nobody had ordered.",
   saved:"5 hours a month",
   steps:[["Trigger","Every Thursday at 09:00"],["Find","Lines below reorder point"],["Check","What this week's jobs need"],["Approval","Buyer confirms the order","gate"],["Update","Raise the purchase order"]],
   runs:[["Thu 09:00","31s","ok","2 lines","€0.02"],["Thu 21 Aug 09:00","28s","ok","1 line","€0.02"]]},
  {id:"o7", name:"Spec sheet retrieval (Renault portal)", kind:"automation", owner:"Stock & Specification", ownerKind:"agent", initials:"SS",
   trigger:"On incoming vehicle", triggerKind:"event", next:"Paused", last:"Portal access unverified", status:"failed", rate:62, on:false,
   what:"Would pull the VIN-specific specification from the Renault portal and attach it to the stock record.",
   why:"Copying a VIN, logging in, downloading and pasting a link is manual and error-prone.",
   saved:"Proposed — not yet live",
   steps:[["Trigger","A vehicle appears on the order book"],["Find","The matching VIN-specific document"],["Send","Retrieve from the Renault portal","external"],["Check","Match the identifier"],["Update","Attach to the stock record"]],
   runs:[["Today 09:05","—","failed","0 of 6","€0.00","Renault portal access unverified — sample attachment used instead"],["Today 08:05","—","failed","0 of 6","€0.00","Renault portal access unverified"],["Mon 09:05","—","blocked","—","€0.00","Awaiting authorised download route"]]},
  {id:"o8", name:"Weekend on-call handover", kind:"routine", owner:"Chief of Staff", ownerKind:"agent", initials:"CS",
   trigger:"Fri, 16:30", triggerKind:"schedule", next:"Fri 16:30", last:"Sent to 3 people", status:"healthy", rate:97, on:true,
   what:"Writes the weekend handover: open jobs, who is on call, and anything a customer is waiting on.",
   why:"Weekend calls were being answered by whoever picked up, with no context.",
   saved:"4 hours a month",
   steps:[["Trigger","Every Friday at 16:30"],["Find","Open jobs and unanswered customers"],["Draft","Write the handover note"],["Send","Inbox the on-call rota"]],
   runs:[["Fri 16:30","18s","ok","3 recipients","€0.02"],["Fri 15 Aug 16:30","21s","ok","3 recipients","€0.02"]]},
  {id:"o9", name:"Timesheet reminder", kind:"task", owner:"Operations", ownerKind:"person", initials:"TW",
   trigger:"Fri, 15:00", triggerKind:"schedule", next:"Fri 15:00", last:"9 of 12 submitted", status:"approval", rate:88, on:true,
   what:"Nudges anyone who has not filed hours, then sends Operations the list still outstanding.",
   why:"Payroll was chasing the same four people every week.",
   saved:"3 hours a month",
   steps:[["Trigger","Every Friday at 15:00"],["Find","Staff with no hours filed"],["Send","Remind each person"],["Approval","Operations signs off the week","gate"]],
   runs:[["Fri 15:00","12s","partial","9 of 12","€0.01"],["Fri 15 Aug 15:00","11s","ok","12 of 12","€0.01"]]},
  {id:"o10", name:"Overnight backup check", kind:"automation", owner:"Ops Watchdog", ownerKind:"agent", initials:"OW",
   trigger:"Daily, 03:00", triggerKind:"schedule", next:"Tonight", last:"All systems clean", status:"healthy", rate:100, on:true,
   what:"Confirms every nightly backup completed and the restore test passed, and raises an alert if not.",
   why:"A failed backup went unnoticed for eleven days in January.",
   saved:"2 hours a month",
   steps:[["Trigger","Every day at 03:00"],["Check","Every backup job completed"],["Check","Last restore test passed"],["Send","Alert only if something failed"]],
   runs:[["Today 03:00","8s","ok","6 jobs","€0.00"],["Yesterday 03:00","9s","ok","6 jobs","€0.00"]]},
  {id:"o11", name:"Month-end close pack", kind:"report", owner:"Finance Agent", ownerKind:"agent", initials:"FA",
   trigger:"1st, 07:00", triggerKind:"schedule", next:"1 Sep 07:00", last:"Delivered 1 Aug", status:"healthy", rate:95, on:true,
   what:"Assembles the close pack: aged debt, margin by area, cash position and the variance commentary.",
   why:"Close took three days of copying between spreadsheets.",
   saved:"16 hours a month",
   steps:[["Trigger","First of the month at 07:00"],["Find","Last month's ledger and margin data"],["Check","Reconcile against the bank"],["Draft","Write the variance commentary"],["Send","Email the pack to Finance"]],
   runs:[["1 Aug 07:00","3m 42s","ok","1 pack","€0.09"],["1 Jul 07:00","3m 51s","ok","1 pack","€0.09"]]}
];

const OPS_FILTERS = [
  ["all","All"], ["routine","Agent routines"], ["automation","Automations"],
  ["report","Scheduled reports"], ["task","Recurring tasks"], ["approval","Needs approval"], ["failed","Failed"]
];

const WORK_SECTIONS = [
  {id:"tasks", label:"Tasks", blurb:"Everything assigned to you or your team, in one permission-filtered list.",
   views:["All tasks","Due tasks","Review","Done"], filters:["Due date","Any status","Anyone","Any due date"]},
  {id:"approvals", label:"Approvals", blurb:"Requests and their steps. Every decision is written as the person who made it.",
   views:["Awaiting you","Awaiting others","Decided"], filters:["Raised date","Any value","Anyone"]},
  {id:"workflows", label:"Workflows", blurb:"Automations and agent routines — what runs on its own, and who owns it.",
   views:[], filters:[]},
  {id:"schedules", label:"Schedules", blurb:"The team calendar: when recurring work fires and what it costs the week.",
   views:[], filters:[]}
];

const WORK_TASKS = [
  {id:"w1", title:"Reconcile V019 — missing from latest order book", status:"In progress", priority:"High", who:"JaK",
   due:"Due today", late:false, client:"Mayo Logistics", day:"Today", mins:"20 mins", view:"Due tasks"},
  {id:"w2", title:"Confirm JOB-1041 work before invoicing", status:"In progress", priority:"High", who:"CK",
   due:"Due today", late:false, client:"Shannon Cold Chain", day:"Today", mins:"15 mins", view:"Due tasks"},
  {id:"w3", title:"Q-1042 — discount + specification review", status:"Review", priority:"High", who:"AR",
   due:"Due 12:00", late:false, client:"Westway Electrical", day:"Today", mins:"15 mins", view:"Review"},
  {id:"w4", title:"V008 — chase rear caliper (ETA 11:30)", status:"In progress", priority:"High", who:"DO",
   due:"Due 11:30", late:false, client:"Midlands Parcel Services", day:"Today", mins:"Mins", view:"Due tasks"},
  {id:"w5", title:"Investigate Friday's 13.0 unallocated hours", status:"Not started", priority:"Medium", who:"JK",
   due:"Today", late:false, client:"Workshop", day:"Today", mins:"30 mins", view:"All tasks"},
  {id:"w6", title:"Flag ETA changes against promised delivery dates", status:"Not started", priority:"Medium", who:"AR",
   due:"This week", late:false, client:"Improvement request", day:"Any day", mins:"Scope", view:"All tasks"}
];

const WORKFLOWS = [
  {name:"Completed job → invoice readiness", state:"live", trigger:"event · job.completed",
   actions:[["jobcard.review","read"],["approvals.route","write"]], lastRun:"Today 09:12",
   result:"3 ready · 3 blocked", resultKind:"warn", runSummary:"ready €2,110 · blocked €1,730",
   runs:["ok","ok","partial","ok","ok","ok","partial","ok","ok","ok","ok","ok","partial","ok"]},
  {name:"Discount approval over €250", state:"live", trigger:"event · quote.discount",
   actions:[["approvals.route","read"],["notify.inbox","write"]], lastRun:"Today 08:50",
   result:"ok · Q-1042 routed", resultKind:"ok", runSummary:"routed to Anthony",
   runs:["ok","ok","ok","ok","ok","ok","ok","ok","ok","ok","ok","ok","ok","ok"]},
  {name:"Failed test → retest", state:"live", trigger:"event · cvrt.result.fail",
   actions:[["repair.open","write"],["notify.inbox","write"]], lastRun:"Today 09:30",
   result:"ok · V008 repair opened", resultKind:"ok", runSummary:"gates held open",
   runs:["idle","ok","ok","ok","ok","ok","ok","ok","idle","ok","ok","ok","ok","ok"]},
  {name:"Weekly order book reconciliation", state:"live", trigger:"schedule · weekly",
   actions:[["import.diff","read"],["tasks.create","write"]], lastRun:"Today 09:00",
   result:"V019 flagged — review required", resultKind:"warn", runSummary:"2 added · 3 ETA · 1 missing",
   runs:["ok","ok","ok","ok","ok","ok","ok","ok","ok","ok","ok","ok","partial","partial"]}
];

const SCHEDULES = [
  {id:"s1", name:"Morning meeting prep", cadence:"Every weekday · 07:00", next:"Tomorrow 07:00", owner:"Briefing", on:true, day:1},
  {id:"s2", name:"Ops Watchdog sweep", cadence:"Every 15 min", next:"10:15", owner:"Ops Watchdog", on:true, day:1},
  {id:"s3", name:"Weekly order book import", cadence:"Mondays · 09:00", next:"Done today", owner:"Stock & Specification", on:true, day:0},
  {id:"s4", name:"Invoice readiness summary", cadence:"Daily · 16:00", next:"Today 16:00", owner:"Finance Assistant", on:true, day:3},
  {id:"s5", name:"Keyloop migration (planned)", cadence:"From December 2026", next:"Planned", owner:"—", on:false, day:4}
];

const WIDGET_DEFS = [["inbox","Action inbox"],["work","My work"],["activity","Activity"],["kpi","Today's numbers"],["visits","Site visits"]];
const WORK_WIDGETS = [
  {id:"queue", label:"My queue", value:"8", hint:"assigned to you", icon:"work", queue:"mine"},
  {id:"late", label:"Running late", value:"11", hint:"past their due date", icon:"health", queue:"overdue"},
  {id:"unassigned", label:"Unassigned", value:"1", hint:"nobody owns it yet", icon:"teams", queue:"unassigned"},
  {id:"week", label:"Next 7 days", value:"4", hint:"due this week", icon:"visits", queue:"upcoming"}
];
const PERSONALITIES = ["Straight-talking","Warm","Formal","Dry"];
const ANSWER_STYLES = ["Short answers","Show the working","Ask before acting"];
/* Every context source and every registered tool the agent could be granted —
   the builder shows the whole catalogue, grouped, rather than a sample. */
const CONTEXT_DEFS = [
  ["Organisations","records","Accounts, limits, payment behaviour"],
  ["People","records","Contacts and internal staff"],
  ["Files","records","Indexed documents and certificates"],
  ["Tasks","work","Queues, owners, due dates"],
  ["Site visits","work","Bookings, technicians, outcomes"],
  ["Approvals","work","What is waiting on a decision"],
  ["Invoices","money","Issued, paid, past due"],
  ["Quotes","money","Sent, accepted, expired"],
  ["Payments","money","Receipts and allocations"],
  ["Activity log","system","Every event, agent and human"],
  ["Modules","system","What this client has installed"],
  ["Insights","system","Saved metrics and trends"]
];
const CONTEXT_SOURCES = CONTEXT_DEFS.map(c => c[0]);
const SKILL_DEFS = [
  ["Search records","read"],["Summarise activity","read"],["Read invoices","read"],
  ["Read site visits","read"],["Check permissions","read"],
  ["Draft email","write"],["Create task","write"],["Update record","write"],
  ["Schedule visit","write"],["Raise approval","write"],
  ["Send email","external"],["Send Inbox","external"],["Post to Keyloop","external"],["Push to Bizimply","external"]
];
/* The two questions the agent asks back once it knows the job. */
const TRAIN_PHASES = [
  ["Reading the whole ontology", "4,820 records"],
  ["Learning how this business words things", "organisation → merchant"],
  ["Researching the trade-supply domain", "12 sources"],
  ["Writing its own system prompt", "1,240 tokens"]
];
const BRIEF_QUESTIONS = [
  {title:"What should it cover?", sub:"Pick as many as you like — we can refine later.",
   options:[["Calendar","Meetings and what is coming up"],["Email","Unread and actionable inbox items"],
            ["Records","Accounts that moved since yesterday"],["Money","Cash, overdue and anything at risk"],
            ["Something else","Tell me in the next message"]]},
  {title:"When should it land?", sub:"One is enough to start.",
   options:[["Every morning 07:30","Before the yard opens"],["Weekdays 08:00","Monday to Friday only"],
            ["Only when something changes","Event-driven, no noise"],["On demand","When you ask for it"]]}
];
/* The words under a name, keyed to the same state the face lights with. */
const STATE_LABELS = {working:"working", thinking:"thinking", waiting:"waiting on you",
  complete:"up to date", attention:"needs you", idle:"idle"};

const FACE_SHAPES = [
  ["crown-pebble","Crown pebble"],["executive-capsule","Executive capsule"],["shield","Shield"],
  ["glass-visor","Glass visor"],["control-cube","Control cube"],["low-dome","Low dome"],
  ["offset-pebble","Offset pebble"],["rim-capsule","Rim capsule"],["wide-eyed","Wide-eyed"],
  ["precision-brow","Precision brow"],["tall-unit","Tall unit"],["soft-asymmetric","Soft asymmetric"]
];
/* Shell colours only — deliberately desaturated so none of them reads as a
   state. The eyes, rim and dots always carry the state colour. */
const FACE_TINTS = [
  ["#191c1f","Graphite"],["#1b2430","Slate"],["#241b2e","Aubergine"],
  ["#2a2118","Bronze"],["#16241f","Pine"],["#2b1b1e","Oxblood"]
];

/* ---- ontology graph: generation, Dijkstra traversal, canvas render ---- */
const CLUSTERS = [
  ["Organisations", "#c8f04b", 0.00, 0.62, 46],
  ["People",        "#6ad0f0", 0.90, 0.70, 52],
  ["Files",         "#b06cf0", 1.75, 0.66, 58],
  ["Tasks",         "#f0c04b", 2.55, 0.72, 44],
  ["Invoices",      "#f0567f", 3.35, 0.60, 38],
  ["Site visits",   "#5fe0a8", 4.15, 0.70, 40],
  ["Locations",     "#f0803a", 4.95, 0.64, 30],
  ["Approvals",     "#5f7cf0", 5.65, 0.72, 34]
];

function mulberry(seed){
  return function(){
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

/* Hub-and-spoke clusters around a dense phyllotaxis core, in unit space
   (-1..1 on both axes) so the layout is resolution independent. */
const _hexCache = {};
function hexRGB(hex){
  if (_hexCache[hex]) return _hexCache[hex];
  const h = hex.replace("#", "");
  const v = [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
  _hexCache[hex] = v;
  return v;
}


function buildGraph(){
  const rnd = mulberry(20260902);
  const nodes = [], edges = [], adj = [];
  const add = (x, y, z, r, cluster, kind) => {
    nodes.push({x, y, z, r, cluster, kind}); adj.push([]); return nodes.length - 1;
  };
  const link = (a, b) => {
    const dx = nodes[a].x - nodes[b].x, dy = nodes[a].y - nodes[b].y, dz = nodes[a].z - nodes[b].z;
    const w = Math.sqrt(dx * dx + dy * dy + dz * dz) + 0.004;
    const id = edges.length;
    edges.push({a, b, w});
    adj[a].push([b, w, id]); adj[b].push([a, w, id]);
  };

  // the core is a filled sphere on a Fibonacci lattice, not a disc
  const CORE = 880, coreIds = [];
  for (let i = 0; i < CORE; i++){
    const t = (i + 0.5) / CORE;
    const phi = Math.acos(1 - 2 * t);
    const theta = i * 2.39996;
    const shell = 0.16 + 0.28 * Math.pow(rnd(), 0.5);
    const grade = rnd();
    coreIds.push(add(
      Math.sin(phi) * Math.cos(theta) * shell * 1.04,
      Math.cos(phi) * shell * 0.96,
      Math.sin(phi) * Math.sin(theta) * shell,
      grade < 0.06 ? 3.4 + rnd() * 1.4 : grade < 0.3 ? 2.1 + rnd() * 0.7 : 1.0 + rnd() * 0.8, 0, "core"));
  }
  // lattice neighbours plus a mesh of chords, so the sphere reads as a volume
  for (let i = 1; i < coreIds.length; i++){
    link(coreIds[i], coreIds[i - 1]);
    if (i >= 13) link(coreIds[i], coreIds[i - 13]);
    if (i >= 21 && i % 2 === 0) link(coreIds[i], coreIds[i - 21]);
    if (i >= 34 && i % 3 === 0) link(coreIds[i], coreIds[i - 34]);
    if (i >= 55 && i % 4 === 0) link(coreIds[i], coreIds[i - 55]);
    if (i >= 89 && i % 5 === 0) link(coreIds[i], coreIds[i - 89]);
    if (i % 6 === 0) link(coreIds[i], coreIds[Math.floor(rnd() * coreIds.length)]);
  }

  // a mid shell between the nucleus and the lobes: the layer that makes it
  // read as a network rather than a ball with satellites
  const MID = 560, midIds = [];
  for (let i = 0; i < MID; i++){
    const t = (i + 0.5) / MID;
    const phi = Math.acos(1 - 2 * t), theta = i * 2.39996 + 0.7;
    const d = 0.52 + 0.16 * Math.pow(rnd(), 0.6);
    const g2 = rnd();
    midIds.push(add(
      Math.sin(phi) * Math.cos(theta) * d * 1.02,
      Math.cos(phi) * d * 0.96,
      Math.sin(phi) * Math.sin(theta) * d,
      g2 < 0.05 ? 2.6 + rnd() * 1.0 : g2 < 0.3 ? 1.6 + rnd() * 0.6 : 0.8 + rnd() * 0.7, 0, "core"));
  }
  for (let i = 0; i < midIds.length; i++){
    if (i >= 1) link(midIds[i], midIds[i - 1]);
    if (i >= 17) link(midIds[i], midIds[i - 17]);
    if (i >= 29 && i % 2 === 0) link(midIds[i], midIds[i - 29]);
    // radial spokes tying the shell to the nucleus
    if (i % 2 === 0) link(midIds[i], coreIds[Math.floor(rnd() * coreIds.length)]);
    if (i % 9 === 0) link(midIds[i], coreIds[Math.floor(rnd() * coreIds.length)]);
  }

  // clusters ride a sphere: each hub gets its own latitude as well as longitude
  const hubs = [], clusterLeaves = [];
  const onSphere = (lon, lat, d0) => { const d = d0 * 1.22;
    return [Math.cos(lat) * Math.cos(lon) * d * 1.02, Math.sin(lat) * d * 0.96, Math.cos(lat) * Math.sin(lon) * d]; };
  CLUSTERS.forEach((c, ci) => {
    const [, , ang, dist, leaves] = c;
    const lat = (ci % 2 ? 1 : -1) * (0.26 + rnd() * 0.5);
    const wob = 1.06 + rnd() * 0.16;
    const hp = onSphere(ang, lat, dist * wob);
    const hub = add(hp[0], hp[1], hp[2], 5.4, ci, "hub");
    hubs.push(hub);
    const mine = [];
    clusterLeaves.push(mine);
    for (let k = 0; k < 3; k++) link(hub, coreIds[Math.floor(rnd() * coreIds.length)]);
    for (let k = 0; k < 5; k++) link(hub, midIds[Math.floor(rnd() * midIds.length)]);

    const subs = 5 + Math.floor(rnd() * 4);
    const subIds = [];
    for (let s = 0; s < subs; s++){
      const sa = ang + (rnd() - 0.5) * 0.52, sl = lat + (rnd() - 0.5) * 0.3;
      const sd = dist + 0.08 + rnd() * 0.18;
      const sp = onSphere(sa, sl, sd);
      const sub = add(sp[0], sp[1], sp[2], 3.2, ci, "sub");
      subIds.push(sub);
      link(sub, hub);
      if (s > 0 && rnd() < 0.7) link(sub, subIds[s - 1]);
      const fan = Math.floor((leaves * 7.4) / subs);
      const spread = 0.17 + rnd() * 0.2;
      let prev = -1;
      for (let l = 0; l < fan; l++){
        const la = sa + (rnd() - 0.5) * spread * 2 + (rnd() - 0.5) * 0.06;
        const ll = sl + (rnd() - 0.5) * spread * 1.1;
        const ld = sd + 0.03 + Math.pow(rnd(), 0.8) * 0.17;
        const lp = onSphere(la, ll, ld);
        const lg = rnd();
        const leaf = add(lp[0], lp[1], lp[2],
          lg < 0.08 ? 2.8 + rnd() * 1.2 : lg < 0.34 ? 1.8 + rnd() * 0.6 : 1.0 + rnd() * 0.7, ci, "leaf");
        link(leaf, sub);
        mine.push(leaf);
        if (rnd() < 0.14) link(leaf, hub);
        if (prev >= 0 && rnd() < 0.34) link(leaf, prev);
        if (rnd() < 0.16) link(leaf, midIds[Math.floor(rnd() * midIds.length)]);
        prev = leaf;
      }
    }
  });
  // far satellites hanging off the outer leaves
  CLUSTERS.forEach((c, ci) => {
    const [, , ang, dist] = c;
    for (let s = 0; s < 7; s++){
      const sa = ang + (rnd() - 0.5) * 1.5, sl = (rnd() - 0.5) * 1.3;
      const sd = dist + 0.42 + rnd() * 0.22;
      const ap = onSphere(sa, sl, sd);
      const anchor = add(ap[0], ap[1], ap[2], 2.4, ci, "sub");
      link(anchor, hubs[ci]);
      const n = 14 + Math.floor(rnd() * 18);
      for (let l = 0; l < n; l++){
        const la = sa + (rnd() - 0.5) * 0.9, ll = sl + (rnd() - 0.5) * 0.7;
        const ld = sd + 0.02 + Math.pow(rnd(), 0.8) * 0.18;
        const p = onSphere(la, ll, ld);
        const leaf = add(p[0], p[1], p[2], 0.8 + rnd() * 0.9, ci, "leaf");
        link(leaf, anchor);
        clusterLeaves[ci].push(leaf);
      }
    }
  });

  // two hub rings and long chords across the sphere
  hubs.forEach((h, i) => {
    link(h, hubs[(i + 1) % hubs.length]);
    link(h, hubs[(i + 2) % hubs.length]);
    if (i % 3 === 0) link(h, hubs[(i + 4) % hubs.length]);
  });
  // neighbouring clusters share records, so their leaves cross-link
  for (let ci = 0; ci < clusterLeaves.length; ci++){
    const a = clusterLeaves[ci], b = clusterLeaves[(ci + 1) % clusterLeaves.length];
    const n = 26 + Math.floor(rnd() * 16);
    for (let k = 0; k < n; k++){
      link(a[Math.floor(rnd() * a.length)], b[Math.floor(rnd() * b.length)]);
    }
    // and a good number reach right across to the far side
    for (let k = 0; k < 12; k++){
      const far = clusterLeaves[(ci + 3) % clusterLeaves.length];
      link(a[Math.floor(rnd() * a.length)], far[Math.floor(rnd() * far.length)]);
    }
    for (let k = 0; k < 8; k++){
      const far = clusterLeaves[(ci + 4) % clusterLeaves.length];
      link(a[Math.floor(rnd() * a.length)], far[Math.floor(rnd() * far.length)]);
    }
  }

  let minX = 1e9, maxX = -1e9, minY = 1e9, maxY = -1e9, minZ = 1e9, maxZ = -1e9;
  for (const n of nodes){
    if (n.x < minX) minX = n.x; if (n.x > maxX) maxX = n.x;
    if (n.y < minY) minY = n.y; if (n.y > maxY) maxY = n.y;
    if (n.z < minZ) minZ = n.z; if (n.z > maxZ) maxZ = n.z;
  }
  const bounds = {minX, maxX, minY, maxY, cx:(minX + maxX) / 2, cy:(minY + maxY) / 2,
    cz:(minZ + maxZ) / 2, w:maxX - minX, h:maxY - minY, d:maxZ - minZ,
    radius: Math.max(maxX - minX, maxY - minY, maxZ - minZ) / 2,
    reach: nodes.reduce((m, n) => Math.max(m, Math.sqrt(n.x * n.x + n.y * n.y + n.z * n.z)), 0)};
  return {nodes, edges, adj, hubs, coreIds, bounds};
}

export {
  INK,
  BODY,
  DIM,
  FAINT,
  LIME,
  GREEN,
  AMBER,
  RED,
  NEUTRAL,
  MONO,
  ICONS,
  REC_SECTIONS,
  CONTACTS,
  FILE_TREE,
  ONTO_NODES,
  ONTO_EDGES,
  REC_TEMPLATES,
  REC_TEMPLATE_CATS,
  PEOPLE,
  ROLE_LEVELS,
  PERM_KEYS,
  GRANT_DEFS,
  ROLE_SCOPES,
  DEFAULT_PERMS,
  INTEGRATIONS,
  BG_DEFS,
  THEMES,
  ADMIN_ICONS,
  ADMIN_CARDS,
  ADMIN_GROUPS,
  SRC_TINT,
  SRC_ABBR,
  DATA_EVENTS,
  PEOPLE_EVENTS,
  AI_EVENTS,
  STREAM_DEFS,
  NAV,
  ITEMS,
  ORDER,
  ANSWERS,
  synthesizeCustomArea,
  pickAnswer,
  ORGS,
  TEAMS,
  LOCATIONS,
  AGENT_DEFS,
  KPI_DEFS,
  ASPECT_DEFS,
  FILTER_GROUPS,
  OPS_DEFS,
  OPS_FILTERS,
  WORK_SECTIONS,
  WORK_TASKS,
  WORKFLOWS,
  SCHEDULES,
  WIDGET_DEFS,
  WORK_WIDGETS,
  PERSONALITIES,
  ANSWER_STYLES,
  CONTEXT_DEFS,
  CONTEXT_SOURCES,
  SKILL_DEFS,
  TRAIN_PHASES,
  BRIEF_QUESTIONS,
  STATE_LABELS,
  FACE_SHAPES,
  FACE_TINTS,
  CLUSTERS,
  mulberry,
  _hexCache,
  hexRGB,
  buildGraph
};
