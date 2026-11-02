/* Shared pieces for Communications and Inspections: the mobile detail sheet,
   channel marks and message ordering. Styles live in comms.css. */
import "./comms.css";
import { useEffect, useState, type ReactNode } from "react";
import { Btn, Portal } from "./ui";
import type { Comm } from "./yard";

/** True below the width where list and detail stack into list then full-screen sheet. */
export function useIsMobile(max = 860): boolean {
  const q = `(max-width:${max}px)`;
  const [m, setM] = useState(() => typeof window !== "undefined" && window.matchMedia(q).matches);
  useEffect(() => {
    const mq = window.matchMedia(q);
    const f = () => setM(mq.matches);
    f();
    mq.addEventListener("change", f);
    return () => mq.removeEventListener("change", f);
  }, [q]);
  return m;
}

/** Full-screen detail sheet used on phones. Rendered in the themed portal. */
export function Sheet({ title, onClose, children }: { title: ReactNode; onClose: () => void; children: ReactNode }) {
  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [onClose]);
  return (
    <Portal>
      <div className="c-sheet" role="dialog" aria-label="Detail">
        <div className="c-sheet-bar">
          <Btn sm kind="ghost" onClick={onClose} aria-label="Back to list">Back</Btn>
          <div className="d-grow c-sheet-title">{title}</div>
        </div>
        <div className="c-sheet-body">{children}</div>
      </div>
    </Portal>
  );
}

export type Group = "WhatsApp" | "Email" | "Renault" | "Keyloop" | "Phone";
export const GROUPS: Group[] = ["WhatsApp", "Email", "Renault", "Keyloop", "Phone"];
export const MARK: Record<Group, string> = { WhatsApp: "WA", Email: "@", Renault: "RT", Keyloop: "KL", Phone: "Tel" };
export const groupOf = (c: Comm): Group =>
  c.source.includes("Renault") ? "Renault" : c.channel === "Email" ? "Email" : c.channel === "Keyloop" ? "Keyloop" : c.channel === "Phone" ? "Phone" : "WhatsApp";
export const ChMark = ({ g, label }: { g: Group; label?: string }) => <span className="c-mark" title={label ?? g} aria-label={label ?? g}>{MARK[g]}</span>;
export const timeLabel = (c: Comm) => (c.day === "Today" ? c.at : `Fri ${c.at}`);
const key = (c: Comm) => (c.day === "Today" ? "1" : "0") + c.at;
export const sortComms = (list: Comm[]): Comm[] => [...list].sort((a, b) => key(b).localeCompare(key(a)));
export const firstName = (name: string) => name.split(" ")[0];
