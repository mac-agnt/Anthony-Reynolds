import { useEffect, type ReactNode } from "react";
import { Btn, Portal } from "../ui";
import type { Channel, Tone } from "../yard";

export const Dot = ({ tone }: { tone?: Tone }) => <i className={"v-dot " + (tone ?? "")} aria-hidden />;

const ABBR: Record<Channel, string> = { WhatsApp: "WA", Email: "EM", Keyloop: "KL", ANPR: "AN", Phone: "PH", Renault: "RT", Workshop: "WS", Pulse: "PU" };
export const ChannelBadge = ({ c }: { c: Channel }) => <span className={"v-ch " + (c === "Pulse" ? "pulse" : "")} title={c}>{ABBR[c]}</span>;

export function StatusPill({ label, tone, sub }: { label: string; tone: Tone | "dim"; sub?: string }) {
  return (
    <div className={"v-status " + (tone ?? "acc")} role="status" aria-label={`Status ${label}`}>
      <span className="v-status-eyebrow">Status</span>
      <b>{label}</b>
      {sub && <span className="v-status-sub">{sub}</span>}
    </div>
  );
}

/** Small confirmation dialog. Rendered through the portal so theme tokens apply. */
export function Confirm({ title, body, confirm, danger, onConfirm, onCancel }: { title: string; body: ReactNode; confirm: string; danger?: boolean; onConfirm: () => void; onCancel: () => void }) {
  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.key === "Escape") onCancel(); };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [onCancel]);
  return (
    <Portal>
      <div className="d-modal-scrim" onClick={onCancel}>
        <div className="d-modal v-confirm" role="alertdialog" aria-label={title} onClick={e => e.stopPropagation()}>
          <div className="v-confirm-body">
            <div className="d-eyebrow">Confirm</div>
            <h3>{title}</h3>
            <div className="d-muted">{body}</div>
          </div>
          <div className="v-confirm-foot">
            <Btn kind="ghost" onClick={onCancel}>Cancel</Btn>
            <Btn kind={danger ? "danger" : "primary"} onClick={onConfirm} autoFocus>{confirm}</Btn>
          </div>
        </div>
      </div>
    </Portal>
  );
}

export const DayHead = ({ day }: { day: string }) => {
  const d = new Date(day + "T00:00:00");
  const diff = Math.round((d.getTime() - new Date("2026-10-19T00:00:00").getTime()) / 86400000);
  const label = d.toLocaleDateString("en-IE", { weekday: "long", day: "numeric", month: "long" });
  return <div className="v-day">{diff === 0 ? "Today" : diff === -1 ? "Yesterday" : ""}{diff === 0 || diff === -1 ? ", " : ""}{label}</div>;
};
