import "./yard.css";
import { LiveYard } from "./yard/Live";
import { AnprEvents } from "./yard/Anpr";
import { OvernightReport } from "./yard/Overnight";

export const YARD_PAGES: Record<string, () => JSX.Element> = { live: LiveYard, anpr: AnprEvents, overnight: OvernightReport };
