import "./demo.css";
import { Component, type ReactNode } from "react";
import { WORKSHOP } from "./workshop";
import { STOCK_PAGES } from "./stock";
import { SALES_PAGES } from "./sales";
import { CVRT_PAGES, DASH_PAGES, FINANCE_PAGES } from "./ops";
import { WORK_PAGES } from "./work";
import { ActivityPage, AiControls, Companies, Runs, SettingsPage, Vehicles } from "./more";
import { YARD_PAGES } from "./yardPages";
import { COMMS_PAGES } from "./commsPages";
import { INSPECTION_PAGES } from "./inspectPages";
import { VEHICLE_PAGES } from "./vehiclePage";
import { MD_PAGES } from "./mdPages";
import { BriefPage } from "./briefPage";
import { HelpersPage } from "./helpers";
import { EntityDrawer, Toast } from "./ui";

class Boundary extends Component<{ children: ReactNode; k: string }, { err: string | null }> {
  state = { err: null as string | null };
  static getDerivedStateFromError(e: Error) { return { err: e.message }; }
  componentDidUpdate(p: { k: string }) { if (p.k !== this.props.k && this.state.err) this.setState({ err: null }); }
  render() { return this.state.err ? <div className="d-page"><div className="d-flag bad" data-demo-error>This page hit an error: {this.state.err}</div></div> : this.props.children; }
}

export default function DemoRoot(props: { page: string; section: string }) {
  return <Boundary k={props.page + props.section}><DemoPage {...props} /></Boundary>;
}

function DemoPage({ page, section }: { page: string; section: string }) {
  const map: Record<string, Record<string, () => JSX.Element>> = {
    Workshop: WORKSHOP, Stock: STOCK_PAGES, Sales: SALES_PAGES, CVRT: CVRT_PAGES, Finance: FINANCE_PAGES, Dashboard: { brief: BriefPage, ...DASH_PAGES }, Work: WORK_PAGES,
    Yard: YARD_PAGES, Comms: COMMS_PAGES, Inspections: INSPECTION_PAGES, Vehicle: VEHICLE_PAGES, MD: MD_PAGES,
    Agents: { helpers: HelpersPage, runs: Runs, controls: AiControls }, Records: { companies: Companies, vehicles: Vehicles },
  };
  if (page === "Activity") return <ActivityPage tab={section} />;
  if (page === "Settings") return <SettingsPage tab={section} />;
  const C = map[page]?.[section] ?? Object.values(map[page] ?? {})[0];
  return C ? <C key={page + section} /> : null;
}

export function DemoOverlays() {
  return <><EntityDrawer /><Toast /></>;
}
