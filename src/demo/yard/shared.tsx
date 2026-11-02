import { useEffect, useState } from "react";
import { eur } from "../store";
import { Chip } from "../ui";
import { STATUS, type Tone, type YardStatus, type YardVehicle } from "../yard";

export const toneCls = (t: Tone) => "t-" + (t ?? "n");

/** Very obvious status: coloured pill with a dot. The row also carries a left bar in the same tone. */
export const StatusPill = ({ status }: { status: YardStatus }) => {
  const st = STATUS[status];
  return <span className={"y-pill " + toneCls(st.tone)}><i aria-hidden />{st.label}</span>;
};

export const AcctChip = ({ v }: { v: Pick<YardVehicle, "accounts" | "balance"> }) =>
  v.accounts === "hold" ? <Chip tone="bad">Hold {eur(v.balance)}</Chip>
    : v.accounts === "review" ? <Chip tone="warn">Review</Chip>
    : <Chip tone="ok">Clear</Chip>;

export const L = ({ children }: { children: string }) => <span className="y-l">{children}</span>;

/** True when the user asked the OS for less motion. */
export function useReducedMotion(): boolean {
  const [r, setR] = useState(() => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  useEffect(() => {
    const m = window.matchMedia("(prefers-reduced-motion: reduce)");
    const h = () => setR(m.matches);
    m.addEventListener("change", h);
    return () => m.removeEventListener("change", h);
  }, []);
  return r;
}

export const isNarrow = () => window.matchMedia("(max-width: 720px)").matches;
