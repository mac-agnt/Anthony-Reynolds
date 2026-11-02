/* Keyloop visibility: Keyloop is the background engine and system of record,
   Pulse is the live layer on top. Shared by the vehicle page, Records,
   Settings → Integrations and the Yard. Demo representation of the intended
   integration, not a claim that every Keyloop API is available. */
import { A, hhmm, useDemo } from "./store";
import { KEYLOOP } from "./yardData";
import { Btn, Card, Chip } from "./ui";

/** Small "SOURCE KEYLOOP · SYNCED 2 mins ago" tag for records. */
export function KeyloopBadge({ mins = KEYLOOP.lastSyncMinsAgo, label = "SOURCE" }: { mins?: number; label?: string }) {
  return (
    <span className="kl-badge" title="This record is read from Keyloop, the system of record, and synced into Pulse.">
      <i aria-hidden />
      <b>{label}</b> Keyloop <span className="kl-sep">·</span> <span>Synced {mins <= 0 ? "just now" : `${mins} min${mins === 1 ? "" : "s"} ago`}</span>
    </span>
  );
}

export function KeyloopPanel({ compact }: { compact?: boolean }) {
  const s = useDemo();
  const last = hhmm(s.clock - KEYLOOP.lastSyncMinsAgo);
  return (
    <Card title="Keyloop" aside={<Chip tone="ok">Connected</Chip>} className="kl-panel">
      <div className="d-muted" style={{ marginBottom: 10 }}>{KEYLOOP.product} is the system of record. Pulse reads it, joins it to WhatsApp, email, ANPR, Renault notices and the workshop floor, and writes status changes back.</div>
      <div className="d-grid d-g3" style={{ marginBottom: 12 }}>
        <div><div className="d-eyebrow">Last sync</div><div style={{ fontSize: 20, fontWeight: 600 }}>{last}</div></div>
        <div><div className="d-eyebrow">Records synced today</div><div style={{ fontSize: 20, fontWeight: 600 }}>{KEYLOOP.recordsToday.toLocaleString("en-IE")}</div></div>
        <div className="d-row" style={{ justifyContent: "flex-end" }}><Btn sm onClick={A.keyloopSync}>Sync now</Btn></div>
      </div>
      <div className="kl-grid">
        {KEYLOOP.entities.map(e => (
          <div key={e.name} className="kl-ent">
            <div className="d-eyebrow">{e.name}</div>
            <div className="n">{e.count.toLocaleString("en-IE")}</div>
            <div className="d-row" style={{ gap: 6 }}><Chip tone="ok">{e.state}</Chip>{!compact && <span className="d-faint" style={{ fontSize: 10.5 }}>{e.direction}</span>}</div>
          </div>
        ))}
      </div>
      {!compact && <>
        <div className="d-divider" />
        <div className="d-eyebrow" style={{ marginBottom: 8 }}>Two-way sync</div>
        <div className="d-grid d-g2">
          {KEYLOOP.twoWay.map(t => (
            <div key={t.text} className="kl-flow"><b>{t.from}</b><span aria-hidden>→</span><b>{t.to}</b><div className="d-muted">{t.text}</div></div>
          ))}
        </div>
        <div className="d-divider" />
        <div className="d-eyebrow" style={{ marginBottom: 6 }}>Sync log</div>
        <div className="d-list">
          {s.yard.keyloopLog.slice(0, 6).map((l, i) => (
            <div key={i} className="d-li"><span className="d-mono d-faint" style={{ width: 42 }}>{l.at}</span><Chip tone={l.dir === "Pulse to Keyloop" ? "acc" : undefined}>{l.dir}</Chip><span className="d-grow d-muted">{l.text}</span></div>
          ))}
        </div>
        <div style={{ marginTop: 10 }} className="d-note"><span>{KEYLOOP.note}</span></div>
      </>}
    </Card>
  );
}
