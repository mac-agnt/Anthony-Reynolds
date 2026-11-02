/* Vehicle Command Centre: "What's the story with that vehicle?" in one screen.
   Header, plain-English story, the ten answers, then twelve sections. Works for
   a yard vehicle, a service vehicle that is not on site, or a stock id. Every
   value is derived from yard.ts and the store, so it cannot disagree with the
   Yard, Workshop, Parts, Finance or the MD view. */
import "./vehicle.css";
import { useEffect, useMemo, useRef, useState } from "react";
import { A, company, eur, getState, pname, useDemo, type State } from "./store";
import { SERVICE_VEHICLES } from "./fixtures";
import { Btn, Card, Chip, CLink, JLink, Page, Plate } from "./ui";
import { KeyloopBadge } from "./keyloop";
import { go } from "./nav";
import { ANPR_EVENTS, STATUS, attentionLine, commsFor, findAnyVehicleKey, fmtEntered, fmtWhen } from "./yard";
import { Confirm, ChannelBadge, Dot, StatusPill } from "./vehicle/bits";
import { activityAll, answers, searchAll, storyLines, subjectOf, timelineAll, yardOrder, type Subject } from "./vehicle/model";
import { CustomerTab, KeyloopTab, OverviewTab, ReleasePanel, UnmatchedPanel, WorkshopTab, type TabProps } from "./vehicle/tabsA";
import { ActivityTab, CommsTab, CvrtTab, DocumentsTab, FinanceTab, JobCardsTab, PartsTab, TimelineTab, docsAll, partRows } from "./vehicle/tabsB";

const TABS: [string, string][] = [
  ["overview", "OVERVIEW"], ["customer", "CUSTOMER"], ["keyloop", "KEYLOOP"], ["workshop", "WORKSHOP"], ["jobcards", "JOB CARDS"], ["parts", "PARTS"],
  ["cvrt", "CVRT"], ["comms", "COMMUNICATIONS"], ["documents", "DOCUMENTS"], ["finance", "FINANCE"], ["activity", "ACTIVITY"], ["timeline", "TIMELINE"],
];

/* ── search ──────────────────────────────────────────────────────────── */
function VehicleSearch({ s, onPick }: { s: State; onPick: (key: string) => void }) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [hi, setHi] = useState(0);
  const hits = useMemo(() => searchAll(s, q).slice(0, 8), [s, q]);
  const pick = (key: string) => { onPick(key); setQ(""); setOpen(false); (document.activeElement as HTMLElement | null)?.blur(); };
  return (
    <div className="v-search">
      <input className="d-input v-search-in" type="search" role="combobox" aria-expanded={open && !!q.trim()} aria-controls="v-search-list" aria-label="Search a vehicle by registration or customer"
        placeholder="Search registration or customer, for example 181-G-4471" autoComplete="off" spellCheck={false} value={q}
        onChange={e => { setQ(e.target.value); setOpen(true); setHi(0); }} onFocus={() => setOpen(true)} onBlur={() => setOpen(false)}
        onKeyDown={e => {
          if (e.key === "ArrowDown") { e.preventDefault(); setHi(h => Math.min(h + 1, hits.length - 1)); }
          else if (e.key === "ArrowUp") { e.preventDefault(); setHi(h => Math.max(h - 1, 0)); }
          else if (e.key === "Enter" && hits[hi]) pick(hits[hi].key);
          else if (e.key === "Escape") { setQ(""); setOpen(false); }
        }} />
      {open && q.trim() && (
        <ul className="v-search-list" id="v-search-list" role="listbox" onMouseDown={e => e.preventDefault()}>
          {hits.length ? hits.map((h, i) => (
            <li key={h.key} role="option" aria-selected={i === hi} className={i === hi ? "on" : ""} onMouseEnter={() => setHi(i)} onClick={() => pick(h.key)}>
              <Plate reg={h.reg} /><span className="v-sr-model">{h.model}</span><span className="v-sr-cust">{h.customer}</span><Chip tone={h.tone}>{h.status}</Chip>
            </li>)) : <li className="none">No vehicle matches "{q}".</li>}
        </ul>
      )}
    </div>
  );
}

/* ── header ──────────────────────────────────────────────────────────── */
function Header({ s, sub }: { s: State; sub: Subject }) {
  const v = sub.v;
  const co = company(sub.id.customerId);
  let label: string, tone: Parameters<typeof StatusPill>[0]["tone"], pillSub: string | undefined;
  if (v) {
    label = STATUS[v.status].label; tone = STATUS[v.status].tone;
    pillSub = v.status === "ready" ? (v.promised ? `Collection ${fmtWhen(v.promised)}` : "Driver collection")
      : ["waiting_parts", "accounts_hold", "cvrt_issue"].includes(v.status) ? attentionLine(v).sub
      : v.status === "unknown" ? "Not matched to a customer" : v.status === "waiting_approval" ? "Customer approval needed"
      : v.job ? (v.job.status === "in_progress" ? `${v.job.id} in progress` : v.job.status === "queued" ? `${v.job.id} booked${v.job.plannedStart ? `, starts ${v.job.plannedStart}` : ""}` : v.job.status === "awaiting_qc" ? `${v.job.id} awaiting quality check` : `${v.job.id}, ${v.job.status.replace("_", " ")}`) : "No live job";
    if (v.status === "cvrt_issue") pillSub = v.row.note ? "Failed, rear brake imbalance" : pillSub;
  } else if (sub.stock) { label = "IN STOCK"; tone = "dim"; pillSub = `Dealership stock, ${sub.stock.status}${sub.stock.status === "incoming" ? `, ETA ${sub.stock.eta ?? "tbc"}` : ""}`; }
  else { label = "NOT ON SITE"; tone = "dim"; pillSub = sub.notice ? `${sub.notice.kind} due ${fmtWhen(sub.notice.due)}` : sub.past[0] ? `Last job ${sub.past[0].id}` : undefined; }
  const cells: { k: string; v: React.ReactNode }[] = v ? [
    { k: v.status === "ready" ? "Ready to leave" : "Promised", v: v.promised ? fmtWhen(v.promised, true) : "Not set" },
    { k: "Arrived", v: fmtEntered(v.arrived) },
    { k: "Location", v: v.location },
    { k: "Job", v: v.jobId ? <JLink id={v.jobId} /> : "None" },
    { k: "Technician", v: v.tech ? pname(v.tech) : "Unassigned" },
    { k: "Accounts", v: v.unresolved ? "Not applicable" : v.accounts === "hold" ? <Chip tone="bad">{eur(v.balance)} on hold</Chip> : v.accounts === "review" ? <Chip tone="warn">Clearance open</Chip> : <Chip tone="ok">Clear</Chip> },
  ] : [
    { k: sub.notice ? "Inspection due" : "Status", v: sub.notice ? fmtWhen(sub.notice.due, true) : sub.stock ? sub.stock.status : "Not on site" },
    { k: "Location", v: sub.stock?.location ?? "Not at Reynolds" },
    { k: "Last job", v: sub.past[0] ? <JLink id={sub.past[0].id} /> : sub.jobs[0] ? <JLink id={sub.jobs[0].id} /> : "None" },
    { k: "Fleet type", v: sub.sv?.kind ?? sub.stock?.range ?? "Commercial vehicle" },
  ];
  return (
    <section className="v-header" aria-label="Vehicle summary">
      <div className="v-head-top">
        <div className="v-head-id">
          <div className="v-plate-xl"><Plate reg={sub.id.reg} /></div>
          <div className="d-grow">
            <h1 className="v-model">{sub.id.model}{sub.sv && sub.sv.kind !== "Unknown" && !sub.id.model.toLowerCase().includes(sub.sv.kind.toLowerCase()) ? <span className="v-kind">{sub.sv.kind}</span> : null}</h1>
            <div className="v-cust">{sub.id.customerId ? <><CLink id={sub.id.customerId} />{co?.account && <span className="d-faint"> {co.account}</span>}</> : <span className="v-nocust">No customer matched</span>}</div>
            <div className="v-src-line">{v?.unresolved ? <Chip tone="bad">No Keyloop record yet</Chip> : <KeyloopBadge />}</div>
          </div>
        </div>
        <StatusPill label={label} tone={tone} sub={pillSub} />
      </div>
      <div className="v-meta">
        {cells.map(c => <div key={c.k}><div className="d-eyebrow">{c.k}</div><div className="v-meta-v">{c.v}</div></div>)}
      </div>
    </section>
  );
}

const BOOT_HASH = typeof window === "undefined" ? "" : window.location.hash;
let bootUsed = false;

/* ── page ────────────────────────────────────────────────────────────── */
function VehicleView() {
  const s = useDemo();
  const key = s.focus.vehicle ?? "C101";
  const tab = TABS.some(t => t[0] === s.focus.vehicleTab) ? s.focus.vehicleTab : "overview";
  const sub = useMemo(() => subjectOf(s, key), [s, key]);
  const [pending, setPending] = useState<"release" | "clearance" | "match" | null>(null);
  const composeRef = useRef<HTMLDivElement>(null);
  const tabsRef = useRef<HTMLDivElement>(null);

  const setTab = (t: string) => A.focus("vehicleTab", t);
  const startDraft = () => {
    setTab("comms");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setTimeout(() => document.getElementById("v-compose")?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "center" }), 80);
  };

  /* keep the deep link in step with the vehicle shown; reset the tab when leaving */
  useEffect(() => {
    const h = "#vehicle/" + sub.id.reg.toLowerCase();
    if (window.location.hash !== h) history.replaceState(null, "", h);
  }, [sub.id.reg]);
  useEffect(() => () => { A.focus("vehicleTab", "overview"); }, []);
  /* ids (stock V012, service C150) are valid deep links too. The shell rewrites the hash for
     unknown values before this runs, so read the boot hash and the event's newURL instead. */
  useEffect(() => {
    const apply = (hash: string) => {
      const m = /^#\/?vehicle\/(.+)$/i.exec(hash);
      if (!m) return;
      const seg = decodeURIComponent(m[1]), st = getState(), n = seg.toLowerCase();
      const k = SERVICE_VEHICLES.find(x => x.id.toLowerCase() === n)?.id ?? st.stock.find(x => x.id.toLowerCase() === n)?.id ?? findAnyVehicleKey(st, seg);
      if (k && k !== st.focus.vehicle) A.focus("vehicle", k);
    };
    if (!bootUsed) { bootUsed = true; apply(BOOT_HASH); }
    const on = (e: HashChangeEvent) => apply(new URL(e.newURL).hash);
    window.addEventListener("hashchange", on);
    return () => window.removeEventListener("hashchange", on);
  }, []);
  useEffect(() => {
    const box = tabsRef.current, on = box?.querySelector<HTMLElement>('[aria-selected="true"]');
    if (box && on) box.scrollLeft = on.offsetLeft - (box.clientWidth - on.offsetWidth) / 2;
  }, [tab]);

  const order = useMemo(() => yardOrder(s), [s]);
  const idx = order.findIndex(x => x.key === key);
  const step = (d: number) => { const n = order[idx + d]; if (n) A.focus("vehicle", n.key); };

  const tl = useMemo(() => timelineAll(s, sub), [s, sub]);
  const act = useMemo(() => activityAll(s, sub, tl), [s, sub, tl]);
  const docs = useMemo(() => docsAll(s, sub), [s, sub]);
  const story = storyLines(s, sub);
  const ans = answers(s, sub);
  const openParts = partRows(s, sub).open.filter(p => !p.received).length;
  const channels = [...new Set(tl.map(e => e.channel))];
  const v = sub.v;
  const liveJob = sub.jobs[0];

  const badge = (t: string): { n: string | number; tone?: "warn" | "bad" } | null => {
    switch (t) {
      case "jobcards": return sub.jobs.length + sub.past.length ? { n: sub.jobs.length + sub.past.length } : null;
      case "parts": return openParts ? { n: openParts, tone: "warn" } : null;
      case "cvrt": return sub.cvrt.length ? { n: sub.cvrt.length, tone: sub.cvrt.some(c => c.result === "fail") ? "bad" : undefined } : null;
      case "comms": { const n = commsFor(s, key).length; return n ? { n } : null; }
      case "documents": return docs.length ? { n: docs.length } : null;
      case "finance": return v?.accounts === "hold" ? { n: "!", tone: "bad" } : null;
      case "timeline": return tl.length ? { n: tl.length } : null;
      case "activity": return act.length ? { n: act.length } : null;
      default: return null;
    }
  };

  const props: TabProps = { s, sub, setTab, startDraft, docCount: docs.length };
  const onClear = (k: "release" | "clearance") => setPending(k);
  const showRelease = !!v && tab !== "finance" && (v.accounts === "hold" || (!!s.gates[key] && v.status !== "ready") || s.yard.released.includes(key));

  return (
    <Page>
      <div className="v-root">
        <div className="v-bar">
          <VehicleSearch s={s} onPick={k => A.focus("vehicle", k)} />
          <div className="v-nav" role="group" aria-label="Move through the yard">
            <Btn sm kind="ghost" disabled={idx <= 0} onClick={() => step(-1)} aria-label="Previous vehicle">Previous</Btn>
            <span className="d-muted v-count">{idx >= 0 ? `${idx + 1} of ${order.length}` : "Not in yard list"}{s.focus.yardFilter && s.focus.yardFilter !== "all" ? ", filtered" : ""}</span>
            <Btn sm kind="ghost" disabled={idx < 0 || idx >= order.length - 1} onClick={() => step(1)} aria-label="Next vehicle">Next</Btn>
          </div>
        </div>

        <Header s={s} sub={sub} />

        {showRelease && <ReleasePanel s={s} sub={sub} onClear={onClear} />}
        <UnmatchedPanel sub={sub} onMatch={() => setPending("match")} />

        <div className="v-top">
          <Card className="v-story" title="What's the story with this vehicle?" aside={<Chip tone="acc">Live summary</Chip>}>
            <p className="v-story-p">{story.join(" ")}</p>
            <div className="v-story-foot"><span className="d-eyebrow">Built from</span>{channels.length ? channels.map(c => <span className="v-src" key={c}><ChannelBadge c={c} />{c}</span>) : <span className="d-faint">No activity yet</span>}</div>
          </Card>
          <Card className="v-answers" title="The ten questions" aside={<span className="d-muted">Answered at a glance</span>}>
            <div className="v-ans">{ans.map((a, i) => (
              <div className="v-a" key={a.q}><Dot tone={a.tone} /><div><div className="v-q">{i + 1}. {a.q}</div><div className="v-av">{a.a}</div></div></div>))}</div>
          </Card>
        </div>

        <div className="v-tabs" role="tablist" aria-label="Vehicle sections" ref={tabsRef}>
          {TABS.map(([k, l]) => { const b = badge(k); return (
            <button key={k} role="tab" aria-selected={tab === k} className={tab === k ? "on" : ""} onClick={() => setTab(k)}>{l}{b && <i className={"v-badge " + (b.tone ?? "")}>{b.n}</i>}</button>); })}
        </div>

        <div className="v-pane" role="tabpanel" key={key + tab}>
          {tab === "overview" && <OverviewTab {...props} />}
          {tab === "customer" && <CustomerTab {...props} />}
          {tab === "keyloop" && <KeyloopTab {...props} />}
          {tab === "workshop" && <WorkshopTab {...props} />}
          {tab === "jobcards" && <JobCardsTab {...props} />}
          {tab === "parts" && <PartsTab {...props} />}
          {tab === "cvrt" && <CvrtTab {...props} />}
          {tab === "comms" && <CommsTab {...props} composeRef={composeRef} />}
          {tab === "documents" && <DocumentsTab {...props} />}
          {tab === "finance" && <FinanceTab {...props} onClear={onClear} />}
          {tab === "activity" && <ActivityTab {...props} />}
          {tab === "timeline" && <TimelineTab {...props} />}
        </div>

        <div className="v-actions" role="toolbar" aria-label="Vehicle actions">
          <Btn kind="primary" disabled={!sub.id.customerId} onClick={startDraft}>Update customer</Btn>
          <Btn disabled={!liveJob} onClick={() => liveJob && A.open("job", liveJob.id)} title={liveJob ? undefined : "No live job on this vehicle"}>Open job</Btn>
          <span title="Demo"><Btn disabled>Open in Keyloop</Btn></span>
          <Btn kind="ghost" onClick={() => go("Yard", "live")}>Back to yard</Btn>
        </div>
      </div>

      {pending === "release" && v && (
        <Confirm title={`Approve release of ${v.reg}?`} confirm="Approve release" onCancel={() => setPending(null)}
          body={<>This records Caroline Glynn's approval for the {eur(v.balance)} hold. No payment is moved and nothing is posted to Keyloop in this demo. The vehicle moves to Ready to leave.</>}
          onConfirm={() => { A.releaseHold(key); setPending(null); }} />
      )}
      {pending === "match" && v?.anprId && (() => {
        const ev = ANPR_EVENTS.find(e => e.id === v.anprId), sug = ev?.suggestion;
        const target = sug ? SERVICE_VEHICLES.find(x => x.id === sug.key) : undefined;
        return ev && sug && target ? (
          <Confirm title={`Match this read to ${target.reg}?`} confirm="Match vehicle" onCancel={() => setPending(null)}
            body={<>ANPR read {ev.read} at {ev.confidence}% confidence will be attached to {target.reg}. The vehicle is added to the yard under that customer.</>}
            onConfirm={() => { A.anprMatch(ev.id, sug.key); setPending(null); }} />
        ) : null;
      })()}
      {pending === "clearance" && v && (
        <Confirm title={`Record accounts clearance for ${v.reg}?`} confirm="Record clearance" onCancel={() => setPending(null)}
          body={<>This marks only the accounts gate as clear. The repair and CVRT retest gates stay open until they are done.</>}
          onConfirm={() => { A.setGate(key, "accounts", true); setPending(null); }} />
      )}
    </Page>
  );
}

export const VEHICLE_PAGES: Record<string, () => JSX.Element> = { view: VehicleView };
