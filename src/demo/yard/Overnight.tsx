import { useEffect, useRef, useState } from "react";
import { A, eur, hhmm, pname, useDemo } from "../store";
import { Btn, Card, CLink, Chip, Empty, Head, JLink, Page, Plate } from "../ui";
import { KeyloopBadge } from "../keyloop";
import { fmtWhen, openVehicle, overnightSummaryText, techName, yardCounts, type YardVehicle } from "../yard";
import { AcctChip, StatusPill, toneCls } from "./shared";

const BUCKETS: { name: string; tone: "acc" | "warn" | "bad" }[] = [
  { name: "Workshop", tone: "acc" }, { name: "Waiting parts", tone: "warn" }, { name: "Accounts hold", tone: "bad" },
  { name: "Awaiting customer", tone: "warn" }, { name: "CVRT repair", tone: "bad" }, { name: "Unknown", tone: "bad" },
];

/** Who owns the next move on an overnight vehicle, and what that move is. */
function nextOwner(v: YardVehicle): { who: string; what: string } {
  switch (v.status) {
    case "waiting_parts": return { who: v.part ? pname(v.part.owner) : "Parts desk", what: `Chase ${v.part ? v.part.part.replace(/ \(.*\)/, "") : "the part"} (${v.part?.po ?? "PO"})` };
    case "accounts_hold": return { who: pname("p-caroline"), what: `Approve release or collect ${eur(v.balance)}` };
    case "waiting_approval": return { who: v.last.who, what: "Get the customer's approval for the extra work" };
    case "cvrt_issue": return { who: v.tech ? techName(v.tech) : "Workshop", what: "Fit the caliper, then book the retest" };
    case "unknown": return { who: "Brian Costello", what: "Find out whose vehicle it is" };
    default: return { who: v.tech ? techName(v.tech) : "Workshop", what: v.row.todo[0] ?? "Finish the job" };
  }
}

function Row({ v }: { v: YardVehicle }) {
  const o = nextOwner(v);
  const open = () => openVehicle(v.key);
  return (
    <article className={"y-nrow " + toneCls(v.status === "workshop" ? "acc" : v.status === "waiting_parts" || v.status === "waiting_approval" ? "warn" : "bad")} onClick={open} tabIndex={0} role="link" aria-label={`${v.reg}. Open vehicle page`}
      onKeyDown={e => { if (e.target === e.currentTarget && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); open(); } }}>
      <i className="y-bar" aria-hidden />
      <div className="y-c" style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: "flex-start" }}>
        <Plate reg={v.reg} />
        <span className="y-sec">{v.model}</span>
        <span className="y-sec">{v.customerId ? <CLink id={v.customerId} /> : <span style={{ color: "var(--bad)" }}>Unmatched</span>}</span>
      </div>
      <div className="y-c">
        <span className="y-l">Situation</span>
        <div className="d-row" style={{ gap: 8, marginBottom: 4 }}><StatusPill status={v.status} />{v.job && <JLink id={v.job.id} />}</div>
        <div style={{ color: "var(--body)" }}>{v.blocker ?? `Here for ${v.row.reason}.`}</div>
      </div>
      <div className="y-c">
        <span className="y-l">Next action owner</span>
        <b style={{ fontWeight: 600 }}>{o.who}</b>
        <div className="d-muted">{o.what}</div>
      </div>
      <div className="y-c">
        <span className="y-l">Expected release</span>
        <b style={{ fontWeight: 600 }}>{v.promised ? fmtWhen(v.promised, true) : "Not set"}</b>
        <div className="d-row" style={{ gap: 6, marginTop: 3 }}><AcctChip v={v} />{v.part && <span className="d-muted">Part {v.part.eta}</span>}</div>
      </div>
    </article>
  );
}

export function OvernightReport() {
  const s = useDemo();
  const c = yardCounts(s);
  const [only, setOnly] = useState<string | null>(null);
  const [busy, setBusy] = useState(-1);
  const [copied, setCopied] = useState(false);
  const [sent, setSent] = useState<string | null>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const counts = BUCKETS.map(b => ({ ...b, n: c.bucket[b.name]?.length ?? 0 }));
  const total = counts.reduce((t, b) => t + b.n, 0) || 1;
  const fresh = overnightSummaryText(s);
  const saved = s.yard.overnightSummary;

  const STEPS = ["Reading the yard from Keyloop and ANPR", "Checking parts, accounts and CVRT gates", "Writing the summary"];
  const generate = () => {
    if (busy >= 0) return;
    setBusy(0); setSent(null); setCopied(false);
    timers.current.push(setTimeout(() => setBusy(1), 450), setTimeout(() => setBusy(2), 900), setTimeout(() => { A.overnightSummary(overnightSummaryText(s)); setBusy(-1); }, 1350));
  };
  const copy = async () => {
    if (!saved) return;
    try { await navigator.clipboard.writeText(saved); setCopied(true); timers.current.push(setTimeout(() => setCopied(false), 1800)); }
    catch { A.toast("Copy is blocked in this browser. Select the text instead."); }
  };
  const send = () => { setSent(hhmm(s.clock)); A.toast("Sent to Anthony and Paul (simulated, nothing leaves the demo)"); };

  return (
    <Page>
      <Head title="Overnight report" sub="Monday 19 October 2026, evening. Every vehicle Pulse expects to remain in the yard tonight, with who owns the next move.">
        <KeyloopBadge />
      </Head>

      <Card>
        <div className="y-hero">
          <div className="y-big">{c.overnightN}<small>vehicles remaining on site tonight</small></div>
          <div>
            <div className="y-prop" role="img" aria-label={counts.map(b => `${b.name} ${b.n}`).join(", ")}>
              {counts.filter(b => b.n).map(b => <span key={b.name} className={toneCls(b.tone)} style={{ flexGrow: b.n }} title={`${b.name} ${b.n}`} />)}
            </div>
            <div className="y-segs">
              {counts.map(b => (
                <button key={b.name} className={`y-seg2 ${toneCls(b.tone)} ${only === b.name ? "on" : ""} ${b.n ? "" : "zero"}`} onClick={() => setOnly(o => (o === b.name ? null : b.name))} aria-pressed={only === b.name}>
                  <div className="n">{b.n}</div><div className="k">{b.name}</div>
                </button>
              ))}
            </div>
            <div className="d-muted" style={{ marginTop: 8, fontSize: 12 }}>{only ? <>Showing {only.toLowerCase()} only. <button className="d-link" onClick={() => setOnly(null)}>Show all {c.overnightN}</button></> : `${Math.round((c.bucket["Waiting parts"]?.length ?? 0) / total * 100)}% of tonight's vehicles are held by parts. Select a segment to filter the list.`}</div>
          </div>
        </div>
      </Card>

      <Card title="Management summary" className="y-sum" aside={saved ? <Btn sm kind="ghost" onClick={generate} disabled={busy >= 0}>Regenerate</Btn> : undefined}>
        {busy >= 0 ? (
          <div className="y-load" role="status">
            {STEPS.map((x, i) => <div key={x} className={i < busy ? "done" : i === busy ? "on" : ""}>{i < busy ? "Done: " : i === busy ? "Now: " : "Next: "}{x}</div>)}
          </div>
        ) : saved ? (
          <>
            <p className="y-sum-body" style={{ margin: "0 0 12px" }}>{saved}</p>
            {saved !== fresh && <div style={{ marginBottom: 12 }}><Chip tone="warn">The yard has changed since this was written. Regenerate to update.</Chip></div>}
            <div className="d-row">
              <Btn onClick={copy}>{copied ? "Copied" : "Copy"}</Btn>
              <Btn kind="primary" onClick={send} disabled={!!sent}>{sent ? `Sent at ${sent}` : "Send to Anthony and Paul"}</Btn>
              <span className="d-muted" style={{ fontSize: 12 }}>Written by Yard Monitor from live yard data. Sending is simulated.</span>
            </div>
          </>
        ) : (
          <div className="y-sum-empty">
            <p>No summary yet. Pulse writes one from tonight's yard: counts, the main constraint, and what needs management in the morning.</p>
            <Btn kind="primary" className="y-gen" onClick={generate}>Generate management summary</Btn>
          </div>
        )}
      </Card>

      <div className="y-nlist" style={{ marginTop: 14 }}>
        {counts.filter(b => !only || b.name === only).map(b => {
          const rows = (c.bucket[b.name] ?? []).slice().sort((a, z) => (a.promised ?? "9").localeCompare(z.promised ?? "9"));
          if (!rows.length) return only ? <Empty key={b.name}>Nothing in {b.name.toLowerCase()} tonight.</Empty> : null;
          return (
            <div key={b.name} className="d-grid" style={{ gap: 6 }}>
              <div className={"y-group " + toneCls(b.tone)}><b>{b.name}</b> {rows.length} <em>{OVERNIGHT_BUCKET_NOTE[b.name]}</em></div>
              {rows.map(v => <Row key={v.key} v={v} />)}
            </div>
          );
        })}
      </div>
    </Page>
  );
}

const OVERNIGHT_BUCKET_NOTE: Record<string, string> = {
  Workshop: "work continues tomorrow", "Waiting parts": "stalled until the part arrives", "Accounts hold": "cannot be released without accounts",
  "Awaiting customer": "waiting on approval", "CVRT repair": "failed test, repair and retest outstanding", Unknown: "no customer or record",
};
