import { useMemo, useState, type KeyboardEvent } from "react";
import { hhmm, useDemo } from "../store";
import { Btn, CLink, Avatar, Empty, Head, JLink, Page, Plate, Seg } from "../ui";
import { KeyloopBadge } from "../keyloop";
import {
  BLOCKED, FILTERS, STATUS, agoText, applyFilter, fmtEntered, fmtWhen, normReg, openVehicle, techName, yardCounts,
  type YardFilter, type YardVehicle,
} from "../yard";
import { AcctChip, L, StatusPill, isNarrow, toneCls } from "./shared";

type Flt = YardFilter | "blocked";
type View = "board" | "cards";

const FILTER_LIST: [Flt, string][] = [...(FILTERS.slice(0, 4) as [Flt, string][]), ["blocked", "Blocked"], ...(FILTERS.slice(4) as [Flt, string][])];

const runFilter = (list: YardVehicle[], f: Flt) => (f === "blocked" ? list.filter(v => BLOCKED.includes(v.status)) : applyFilter(list, f));

const GROUPS: { id: string; label: string; note: string; tone: "bad" | "warn" | "acc" | "ok"; has: (v: YardVehicle) => boolean }[] = [
  { id: "blocked", label: "Blocked", note: "cannot leave until resolved", tone: "bad", has: v => BLOCKED.includes(v.status) },
  { id: "decision", label: "Needs a decision", note: "waiting on a customer or an identification", tone: "warn", has: v => v.status === "waiting_approval" || v.status === "unknown" },
  { id: "workshop", label: "In the workshop", note: "work in progress", tone: "acc", has: v => v.status === "workshop" },
  { id: "ready", label: "Ready to leave", note: "cleared for collection", tone: "ok", has: v => v.status === "ready" },
];

const sortVehicles = (a: YardVehicle, b: YardVehicle) =>
  STATUS[a.status].order - STATUS[b.status].order || (a.promised ?? "9").localeCompare(b.promised ?? "9") || a.reg.localeCompare(b.reg);

function matches(v: YardVehicle, q: string): boolean {
  const t = q.trim().toLowerCase();
  if (!t) return true;
  const n = normReg(q);
  return (n.length > 0 && normReg(v.reg).includes(n)) || v.customer.toLowerCase().includes(t) || (v.jobId ?? "").toLowerCase().includes(t) || v.model.toLowerCase().includes(t);
}

function Row({ v }: { v: YardVehicle }) {
  const tone = STATUS[v.status].tone;
  const open = () => openVehicle(v.key);
  const onKey = (e: KeyboardEvent<HTMLElement>) => { if (e.target === e.currentTarget && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); open(); } };
  const hasPart = !!v.part;
  return (
    <article className={"y-row " + toneCls(tone)} onClick={open} onKeyDown={onKey} tabIndex={0} role="link" aria-label={`${v.reg}, ${STATUS[v.status].label}. Open vehicle page`}>
      <i className="y-bar" aria-hidden />
      <div className="y-c y-status"><StatusPill status={v.status} /></div>
      <div className="y-c y-veh"><Plate reg={v.reg} /><span className="y-sec y-trunc" title={v.model}>{v.model}</span></div>
      <div className="y-c y-cust">
        <span className="y-pri y-trunc">{v.customerId ? <CLink id={v.customerId} /> : <span style={{ color: "var(--bad)" }}>Unmatched</span>}</span>
        <span className="y-sec"><L>Arrived</L>{fmtEntered(v.arrived)}</span>
      </div>
      <div className="y-c y-job">
        <span className="y-pri"><L>Job</L>{v.job ? <JLink id={v.job.id} /> : v.jobId ?? <span className="y-faint">No job</span>}</span>
        <span className="y-sec y-trunc" title={v.location}><L>Location</L>{v.location}</span>
      </div>
      <div className="y-c y-tech"><L>Technician</L>{v.tech ? <span className="av"><Avatar id={v.tech} size={20} />{techName(v.tech)}</span> : <span className="y-faint">Unassigned</span>}</div>
      <div className={"y-c y-block " + (v.blocker ? "" : "none")} title={v.blocker ?? undefined}><L>Main blocker</L>{v.blocker ?? "None"}</div>
      <div className={"y-c y-eta " + (hasPart ? "" : "none")}><L>Parts ETA</L>{hasPart ? <b style={{ fontWeight: 500 }}>{v.part!.eta}</b> : <span className="y-faint">None</span>}</div>
      <div className="y-c y-prom">
        <span className="y-pri"><L>Promised</L>{v.promised ? fmtWhen(v.promised) : <span className="y-faint">Not set</span>}</span>
        <span className="y-sec"><L>Accounts</L><AcctChip v={v} /></span>
      </div>
      <div className="y-c y-last" title={v.last.text}>
        <L>Last update</L>
        <span className="y-pri y-trunc">{v.last.who} · {v.last.channel}</span>
        <span className="y-sec">{agoText(v.last.minsAgo)}</span>
        <span className="y-qt">{v.last.text}</span>
      </div>
    </article>
  );
}

export function LiveYard() {
  const s = useDemo();
  const c = yardCounts(s);
  const [filter, setFilter] = useState<Flt>("all");
  const [q, setQ] = useState("");
  const [view, setView] = useState<View>(() => (isNarrow() || window.innerWidth < 900 ? "cards" : "board"));

  const shown = useMemo(() => runFilter(c.all, filter).filter(v => matches(v, q)).sort(sortVehicles), [c.all, filter, q]);
  const groups = GROUPS.map(g => ({ g, rows: shown.filter(g.has) })).filter(x => x.rows.length);
  const pick = (f: Flt) => setFilter(cur => (cur === f && f !== "all" ? "all" : f));

  const tiles: { id: Flt; label: string; n: number; hint: string; tone?: "ok" | "bad" | "warn" }[] = [
    { id: "all", label: "On site", n: c.onSite, hint: "commercial vehicles in the yard now" },
    { id: "arrived", label: "Arrived today", n: c.arrivedToday, hint: "read in by ANPR since the gate opened" },
    { id: "ready", label: "Ready to leave", n: c.readyN, hint: "cleared for collection", tone: "ok" },
    { id: "blocked", label: "Blocked", n: c.blockedN, hint: `${c.parts.length} parts, ${c.accounts.length} accounts, ${c.cvrt.length} CVRT`, tone: "bad" },
    { id: "overnight", label: "Overnight", n: c.overnightN, hint: "staying on site tonight" },
    { id: "unknown", label: "Unknown / unmatched", n: c.unknownN, hint: "no customer or job attached yet", tone: c.unknownN ? "warn" : undefined },
  ];

  return (
    <Page>
      <Head title="Live Yard" sub={<>Monday 19 October, {hhmm(s.clock)}. Every commercial vehicle physically on the Reynolds site, joined to Keyloop, WhatsApp, email, ANPR and the workshop floor.</>}>
        <KeyloopBadge />
        <Seg<View> label="Layout" value={view} options={[["board", "Board"], ["cards", "Cards"]]} onChange={setView} />
      </Head>

      <div className="y-tiles">
        {tiles.map(t => (
          <button key={t.id} className={`y-tile ${toneCls(t.tone)} ${filter === t.id ? "on" : ""}`} onClick={() => pick(t.id)} aria-pressed={filter === t.id}>
            <div className="k">{t.label}</div>
            <div className="n">{t.n}</div>
            <div className="h">{t.hint}</div>
          </button>
        ))}
      </div>

      <div className="y-tools">
        <input className="d-input y-search" type="search" placeholder="Search registration, customer or job" aria-label="Search the yard" value={q} onChange={e => setQ(e.target.value)} />
        <span className="y-count">Showing {shown.length} of {c.onSite}</span>
        {(filter !== "all" || q) && <Btn sm kind="ghost" onClick={() => { setFilter("all"); setQ(""); }}>Clear</Btn>}
      </div>
      <div className="y-chips" role="tablist" aria-label="Filters">
        {FILTER_LIST.map(([f, label]) => (
          <button key={f} role="tab" aria-selected={filter === f} className={"d-chip " + (filter === f ? "on" : "")} onClick={() => setFilter(f)}>{label} <b>{runFilter(c.all, f).length}</b></button>
        ))}
      </div>

      {shown.length === 0 ? <Empty>No vehicles match. Clear the filter or search to see all {c.onSite}.</Empty> : (
        <div className="y-wrap"><div className={"y-list " + view}>
          <div className="y-colhead" aria-hidden>
            <span>Status</span><span>Vehicle</span><span>Customer</span><span>Job, location</span><span>Technician</span><span>Main blocker</span><span>Parts ETA</span><span>Promised</span><span>Last update</span>
          </div>
          {groups.map(({ g, rows }) => (
            <div key={g.id} style={{ display: "contents" }}>
              {groups.length > 1 && <div className={"y-group " + toneCls(g.tone)}><b>{g.label}</b> {rows.length} <em>{g.note}</em></div>}
              {rows.map(v => <Row key={v.key} v={v} />)}
            </div>
          ))}
        </div></div>
      )}
    </Page>
  );
}
