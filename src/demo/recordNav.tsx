/* Small shared helpers for the Finance, Sales, Records and Work modules. */
import { A, useDemo, vehicleLabel, type State } from "./store";
import { openVehicle } from "./yard";
import { Plate } from "./ui";

/** Open a vehicle the same way VLink does: yard and customer vehicles go to the Vehicle page, other dealership stock to the drawer. */
export function openRecord(s: State, key: string) {
  const stock = s.stock.find(v => v.id === key);
  if (stock && key !== "V008") A.open("vehicle", key);
  else { A.close(); openVehicle(key); }
}

/** Sample P&L figures for the Finance overview. One place, clearly demo values: Keyloop holds the real figures. */
export const SAMPLE_PL = { period: "October to date", revenue: 386400, grossMargin: 0.231 };

/** Invoice-ready jobs where the customer's PO number has not been captured yet (sample exception). */
export const MISSING_PO: Record<string, string> = { "JOB-1076": "Doyle Transport needs its PO number on every invoice" };

/** Irish plate badge that opens the vehicle, so the registration is shown once and is clickable. */
export const PlateLink = ({ s, id, reg }: { s: State; id: string; reg: string }) => (
  <button className="d-link" style={{ lineHeight: 0 }} aria-label={`Open ${reg}`} onClick={e => { e.stopPropagation(); openRecord(s, id); }}><Plate reg={reg} /></button>
);

/** Vehicle link that reads as the registration for any vehicle that has one (V008 is 222-G-1984), the stock id otherwise. */
export function RegLink({ id }: { id: string }) {
  const s = useDemo();
  const l = vehicleLabel(s, id);
  return <button className="d-link" onClick={e => { e.stopPropagation(); openRecord(s, id); }}>{l.stock && id !== "V008" ? id : l.reg}</button>;
}
