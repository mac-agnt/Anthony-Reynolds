/* Bridge between the demo modules and PulseLogic's navigation. PulseLogic
   registers its navigator on construction; modules call go(page, section). */
type Navigator = (page: string, section?: string) => void;
let nav: Navigator = () => {};
export const setNavigator = (fn: Navigator) => { nav = fn; };
export const go = (page: string, section?: string) => nav(page, section);

/* Top-bar pages for every module the demo owns. Ids are the section keys. */
export const MODULE_TABS: Record<string, [string, string][]> = {
  Workshop: [["overview", "Overview"], ["live", "Live Board"], ["planner", "Planner"], ["clocking", "Clocking"], ["jobcards", "Job Cards"], ["parts", "Parts & Blockers"], ["breakdown", "Breakdown"]],
  Stock: [["overview", "Overview"], ["instock", "In Stock"], ["orderbook", "Order Book"], ["specs", "Specifications"], ["exceptions", "Exceptions"]],
  Sales: [["pipeline", "Pipeline"], ["quote", "Quote Builder"], ["customers", "Customers"], ["handovers", "Handovers"], ["documents", "Documents"]],
  CVRT: [["overview", "Overview"], ["bookings", "Bookings"], ["results", "Results"], ["repairs", "Repair Handovers"]],
  Finance: [["overview", "Overview"], ["readiness", "Invoice Readiness"], ["receivables", "Receivables"]],
  Dashboard: [["executive", "Executive"], ["workshop", "Workshop"], ["salesstock", "Sales & Stock"], ["handover", "Handover Performance"]],
  Agents: [["directory", "Directory"], ["runs", "Runs"], ["controls", "Controls"]],
  Work: [["tasks", "Tasks"], ["approvals", "Approvals"], ["workflows", "Workflows"], ["schedules", "Schedules"], ["meeting", "Morning Meeting"]],
  Activity: [["all", "Everything"], ["people", "People"], ["agents", "Agents"], ["attention", "Needs Attention"]],
  Settings: [["organisation", "Organisation"], ["teams", "Teams & Permissions"], ["systems", "Systems"], ["integrations", "Integrations"], ["governance", "Governance"], ["ai", "AI Controls"], ["experience", "Experience"]],
};

/* Theme switching lives in PulseLogic state; it registers a setter here. */
let themeSetter: (id: string) => void = () => {};
let themeGetter: () => string = () => "reynolds";
export const setThemeBridge = (set: (id: string) => void, get: () => string) => { themeSetter = set; themeGetter = get; };
export const setTheme = (id: string) => themeSetter(id);
export const getTheme = () => themeGetter();
