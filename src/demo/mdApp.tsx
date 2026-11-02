/* Paul / MD phone view. A self-contained, phone-first management app: four
   numbers, the vehicles that need attention, and one tap to the story of any
   vehicle. It reads the same live store as the Yard, so it moves when the rest
   of the product moves. It deliberately does not expose the planner, sales,
   finance or settings. */
import { useEffect, useRef, useState, type ReactNode } from "react";
import "./md.css";
import { company, eur, hhmm, pname, useDemo, type State } from "./store";
import { SNAPSHOT_DATE } from "./fixtures";
import { Plate } from "./ui";
import { KeyloopBadge } from "./keyloop";
import { STATUS, attentionLine, attentionList, fmtEntered, fmtWhen, overnightSummaryText, searchVehicles, vehicleByKey, yardCounts, yardVehicles, type Tone, type YardVehicle } from "./yard";

type Tab = "home" | "ready" | "night" | "search";
type Theme = "light" | "reynolds";
const THEME_KEY = "md-theme";

function initialTheme(): Theme {
  try {
    const t = window.localStorage.getItem(THEME_KEY);
    if (t === "light" || t === "reynolds") return t;
  } catch { /* storage can be unavailable in private windows */ }
  return window.matchMedia?.("(prefers-color-scheme: light)").matches ? "light" : "reynolds";
}

const tone = (t: Tone) => "t-" + (t ?? "none");
const cap = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);
const plain = (t: string) => t.replace(/\s*\([^)]*\)/g, "");

/* Overnight groups in the order management reads them. */
const NIGHT_ORDER = ["Workshop", "Waiting parts", "Accounts hold", "Awaiting customer", "CVRT repair", "Unknown"];

export function MdApp({ standalone = false }: { standalone?: boolean }) {
  const s = useDemo();
  const [tab, setTab] = useState<Tab>("home");
  const [veh, setVeh] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const [theme, setTheme] = useState<Theme>(initialTheme);
  const scroll = useRef<HTMLDivElement>(null);
  const attn = useRef<HTMLElement>(null);

  useEffect(() => { if (scroll.current) scroll.current.scrollTop = 0; }, [tab, veh]);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2600);
    return () => clearTimeout(t);
  }, [toast]);
  useEffect(() => {
    if (!standalone) return;
    // Let the app use the notch and home-bar areas on a real phone.
    const meta = document.querySelector<HTMLMetaElement>('meta[name="viewport"]');
    const prev = meta?.content ?? null;
    if (meta && !meta.content.includes("viewport-fit")) meta.content = meta.content + ", viewport-fit=cover";
    document.title = "Reynolds, MD view";
    return () => { if (meta && prev !== null) meta.content = prev; };
  }, [standalone]);

  const flipTheme = () => {
    const next: Theme = theme === "light" ? "reynolds" : "light";
    setTheme(next);
    try { window.localStorage.setItem(THEME_KEY, next); } catch { /* ignore */ }
  };
  const c = yardCounts(s);
  const open = (key: string) => setVeh(key);
  const pick = (t: Tab) => { setTab(t); setVeh(null); };
  const vehicle = veh ? vehicleByKey(s, veh) : undefined;

  const app = (
    <div className={"m-app" + (standalone ? " m-standalone" : "")}>
      <div className="m-scroll" ref={scroll}>
        {veh ? (
          <VehicleScreen s={s} v={vehicle} onBack={() => setVeh(null)} say={setToast} />
        ) : tab === "home" ? (
          <Home s={s} c={c} open={open} go={pick} attn={attn} onSearchAll={() => { setQ(""); pick("search"); }}
            top={standalone ? <button className="m-theme" onClick={flipTheme}>{theme === "light" ? "Dark" : "Light"}</button> : null} />
        ) : tab === "ready" ? (
          <Ready c={c} open={open} />
        ) : tab === "night" ? (
          <Night s={s} c={c} open={open} />
        ) : (
          <Search s={s} q={q} setQ={setQ} open={open} />
        )}
      </div>
      {toast && <div className="m-toast" role="status" aria-live="polite">{toast}</div>}
      <nav className="m-nav" aria-label="Sections">
        {([["home", "Home", c.blockedN], ["ready", "Ready", c.readyN], ["night", "Overnight", c.overnightN], ["search", "Search", null]] as [Tab, string, number | null][]).map(([k, l, n]) => (
          <button key={k} className={tab === k && !veh ? "on" : ""} aria-current={tab === k && !veh ? "page" : undefined} onClick={() => pick(k)}>
            <span>{l}</span><i aria-hidden={n === null || undefined} style={n === null ? { visibility: "hidden" } : undefined}>{n ?? 0}</i>
          </button>
        ))}
      </nav>
    </div>
  );
  return standalone ? <div className="m-stand" data-theme={theme}>{app}</div> : app;
}

/* ── HOME ───────────────────────────────────────────────────────────── */
function Home({ s, c, open, go, attn, onSearchAll, top }: {
  s: State; c: ReturnType<typeof yardCounts>; open: (k: string) => void; go: (t: Tab) => void; attn: React.RefObject<HTMLElement>; onSearchAll: () => void; top: ReactNode;
}) {
  const list = attentionList(s);
  const figs: { n: number; l: string; t: Tone; on: () => void }[] = [
    { n: c.onSite, l: "vehicles on site", t: undefined, on: onSearchAll },
    { n: c.blockedN, l: "need attention", t: c.blockedN ? "bad" : "ok", on: () => attn.current?.scrollIntoView({ block: "start" }) },
    { n: c.readyN, l: "ready for collection", t: "ok", on: () => go("ready") },
    { n: c.overnightN, l: "staying overnight", t: undefined, on: () => go("night") },
  ];
  return (
    <>
      <header className="m-head">
        <div className="m-top"><span className="m-eyebrow">Reynolds Commercials</span>{top}</div>
        <h1 className="m-brand">REYNOLDS</h1>
        <div className="m-when"><b>{SNAPSHOT_DATE}</b><span>{hhmm(s.clock)}</span></div>
      </header>
      <section className="m-figs" aria-label="Yard today">
        {figs.map(f => (
          <button key={f.l} className={"m-fig " + tone(f.t)} onClick={f.on}>
            <b>{f.n}</b><span>{f.l}</span>
          </button>
        ))}
      </section>
      <section className="m-sec" ref={attn} aria-labelledby="m-attn-h">
        <h2 id="m-attn-h" className="m-h2">Needs attention <i>{list.length}</i></h2>
        {list.length === 0 && <p className="m-empty">Nothing is blocked. Every vehicle on site is moving.</p>}
        <div className="m-cards">
          {list.map(v => <AttnCard key={v.key} v={v} open={open} />)}
        </div>
      </section>
      <div className="m-foot"><KeyloopBadge /></div>
    </>
  );
}

function AttnCard({ v, open }: { v: YardVehicle; open: (k: string) => void }) {
  const l = attentionLine(v);
  const st = STATUS[v.status];
  return (
    <button className={"m-card " + tone(st.tone)} onClick={() => open(v.key)} aria-label={`${v.reg}, ${v.customer}, ${l.head}`}>
      <span className="m-card-top"><Plate reg={v.reg} /><span className="m-eta">{v.promised ? <>Leaves <b>{fmtWhen(v.promised)}</b></> : "No date set"}</span></span>
      <span className="m-cust">{v.customer}</span>
      <span className="m-status">{l.head}</span>
      <span className="m-line">{l.sub}</span>
      {v.blocker && <span className="m-reason">{v.blocker}</span>}
    </button>
  );
}

/* ── READY ──────────────────────────────────────────────────────────── */
function Ready({ c, open }: { c: ReturnType<typeof yardCounts>; open: (k: string) => void }) {
  const list = [...c.ready].sort((a, b) => (a.promised ?? "z").localeCompare(b.promised ?? "z"));
  return (
    <>
      <header className="m-head m-sub">
        <span className="m-eyebrow">Ready for collection</span>
        <h1 className="m-big">{list.length} <small>vehicles</small></h1>
        <p className="m-note">Finished, clear of accounts and waiting for the driver. Earliest collection first.</p>
      </header>
      <section className="m-sec">
        {list.length === 0 && <p className="m-empty">No vehicle is ready to leave right now.</p>}
        <div className="m-list">
          {list.map(v => (
            <button key={v.key} className="m-row t-ok" onClick={() => open(v.key)}>
              <span className="m-row-main"><Plate reg={v.reg} /><span className="m-cust">{v.customer}</span><span className="m-line">{v.model}</span></span>
              <span className="m-row-right"><small>Collection</small><b>{v.promised ? fmtWhen(v.promised) : "Any time"}</b></span>
            </button>
          ))}
        </div>
      </section>
    </>
  );
}

/* ── OVERNIGHT ──────────────────────────────────────────────────────── */
function Night({ s, c, open }: { s: State; c: ReturnType<typeof yardCounts>; open: (k: string) => void }) {
  const groups = NIGHT_ORDER.map(k => [k, c.bucket[k] ?? []] as [string, YardVehicle[]]).filter(([, l]) => l.length);
  const tones: Record<string, Tone> = { Workshop: "acc", "Waiting parts": "warn", "Accounts hold": "bad", "Awaiting customer": "warn", "CVRT repair": "bad", Unknown: "bad" };
  return (
    <>
      <header className="m-head m-sub">
        <span className="m-eyebrow">Staying overnight</span>
        <h1 className="m-big">{c.overnightN} <small>vehicles</small></h1>
        <p className="m-note">{s.yard.overnightSummary ?? overnightSummaryText(s)}</p>
      </header>
      {groups.map(([k, list]) => (
        <section key={k} className="m-sec">
          <h2 className={"m-h2 " + tone(tones[k])}>{k} <i>{list.length}</i></h2>
          <div className="m-list">
            {list.map(v => (
              <button key={v.key} className={"m-row " + tone(STATUS[v.status].tone)} onClick={() => open(v.key)}>
                <span className="m-row-main"><Plate reg={v.reg} /><span className="m-cust">{v.customer}</span><span className="m-line">{v.blocker ?? `${v.model}, ${v.location}`}</span></span>
                <span className="m-row-right"><small>Leaves</small><b>{v.promised ? fmtWhen(v.promised) : "Not set"}</b></span>
              </button>
            ))}
          </div>
        </section>
      ))}
    </>
  );
}

/* ── SEARCH ─────────────────────────────────────────────────────────── */
function Search({ s, q, setQ, open }: { s: State; q: string; setQ: (v: string) => void; open: (k: string) => void }) {
  const all = yardVehicles(s).sort((a, b) => STATUS[a.status].order - STATUS[b.status].order || a.reg.localeCompare(b.reg));
  const list = q.trim() ? searchVehicles(s, q) : all;
  return (
    <>
      <header className="m-head m-sub">
        <span className="m-eyebrow">Find a vehicle</span>
        <label className="m-search">
          <span className="m-sr">Registration</span>
          <input type="search" inputMode="search" autoCapitalize="characters" autoCorrect="off" spellCheck={false} value={q} onChange={e => setQ(e.target.value)}
            placeholder="Registration, e.g. 181-G-4471" />
        </label>
        <p className="m-note">{q.trim() ? `${list.length} ${list.length === 1 ? "match" : "matches"}` : `All ${all.length} vehicles on site, most urgent first`}</p>
      </header>
      <section className="m-sec">
        {list.length === 0 && <p className="m-empty">No vehicle on site matches that registration.</p>}
        <div className="m-list">
          {list.map(v => (
            <button key={v.key} className={"m-row " + tone(STATUS[v.status].tone)} onClick={() => open(v.key)}>
              <span className="m-row-main"><Plate reg={v.reg} /><span className="m-cust">{v.customer}</span><span className="m-line">{v.model}</span></span>
              <span className="m-row-right"><span className={"m-pill " + tone(STATUS[v.status].tone)}>{STATUS[v.status].short}</span></span>
            </button>
          ))}
        </div>
      </section>
    </>
  );
}

/* ── VEHICLE: six questions ─────────────────────────────────────────── */
interface QA { q: string; a: string; sub?: string; t?: Tone }

function sixQuestions(s: State, v: YardVehicle): QA[] {
  const part = v.part;
  const test = s.cvrt.find(x => x.vehicle === v.key && x.result === "fail");
  const why: QA = { q: "Why is it here?", a: cap(v.row.reason), sub: `Arrived ${fmtEntered(v.arrived)}` };

  const who: QA = (() => {
    if (v.status === "unknown") return { q: "Who is working on it?", a: "Nobody yet", sub: "No booking or customer is attached", t: "warn" as Tone };
    if (v.status === "accounts_hold") return { q: "Who is working on it?", a: "Caroline Glynn", sub: `Accounts. ${v.tech ? `${pname(v.tech)} finished the work` : "Work is finished"}` };
    if (v.tech) return { q: "Who is working on it?", a: pname(v.tech), sub: part ? `${pname(part.owner)} is chasing the part` : v.jobId ?? undefined };
    if (part) return { q: "Who is working on it?", a: pname(part.owner), sub: "Chasing the part. No technician assigned yet", t: "warn" as Tone };
    if (v.status === "waiting_approval") return { q: "Who is working on it?", a: "Service desk", sub: "Waiting on the customer to approve" };
    return { q: "Who is working on it?", a: "Nobody assigned", sub: undefined, t: "warn" as Tone };
  })();

  const wrong: QA = (() => {
    switch (v.status) {
      case "waiting_parts": return { q: "What's wrong?", a: `${part ? plain(part.part) : "A part"} has not arrived`, sub: part ? `${part.supplier}, ${part.po ?? "on order"}` : undefined, t: "warn" as Tone };
      case "accounts_hold": return { q: "What's wrong?", a: `${eur(v.balance)} overdue on the account`, sub: "Release is held until accounts approve", t: "bad" as Tone };
      case "cvrt_issue": return { q: "What's wrong?", a: test?.failItems?.length ? `CVRT failed: ${test.failItems[0].toLowerCase()}` : "CVRT failed", sub: test ? `Test ${test.id}` : undefined, t: "bad" as Tone };
      case "waiting_approval": return { q: "What's wrong?", a: "Extra work found and quoted", sub: "Waiting for the customer to say yes", t: "warn" as Tone };
      case "unknown": return { q: "What's wrong?", a: "Not recognised", sub: "Plate not matched to a vehicle or customer", t: "bad" as Tone };
      case "ready": return { q: "What's wrong?", a: "Nothing", sub: "Work is finished", t: "ok" as Tone };
      default: return { q: "What's wrong?", a: v.blocker ? "Small admin item open" : "Nothing", sub: v.blocker ?? "Work is in progress", t: v.blocker ? "warn" as Tone : "ok" as Tone };
    }
  })();

  const block: QA = (() => {
    const q = "What's blocking it?";
    if (!v.blocker) return { q, a: "Nothing in the way", t: "ok" as Tone };
    switch (v.status) {
      case "waiting_parts": return { q, a: part ? `${plain(part.part)}, due ${part.eta}` : "A part on order", sub: part?.impact ?? v.blocker, t: "warn" as Tone };
      case "accounts_hold": return { q, a: "Accounts approval", sub: v.blocker, t: "bad" as Tone };
      case "cvrt_issue": return { q, a: "Retest and accounts clearance", sub: v.blocker, t: "bad" as Tone };
      case "waiting_approval": return { q, a: "The customer's yes", sub: v.blocker, t: "warn" as Tone };
      case "unknown": return { q, a: "A person to identify it", sub: v.blocker, t: "bad" as Tone };
      default: return { q, a: "A small admin item", sub: v.blocker, t: "warn" as Tone };
    }
  })();

  const leaves: QA = (() => {
    if (v.status === "ready") return { q: "When will it leave?", a: v.promised ? `Collection ${fmtWhen(v.promised)}` : "Ready now", sub: "Ready to go", t: "ok" as Tone };
    if (!v.promised) return { q: "When will it leave?", a: "No date promised", t: "warn" as Tone };
    return { q: "When will it leave?", a: fmtWhen(v.promised, true), sub: v.atRisk ? "At risk of missing this" : part ? `If the part arrives ${part.eta}` : undefined, t: v.atRisk ? "bad" as Tone : undefined };
  })();

  const owes: QA = v.accounts === "hold"
    ? { q: "Does the customer owe money?", a: `Yes, ${eur(v.balance)}`, sub: "Accounts approval needed before release", t: "bad" }
    : v.accounts === "review"
      ? { q: "Does the customer owe money?", a: "Not cleared yet", sub: "Accounts clearance still to be recorded", t: "warn" }
      : { q: "Does the customer owe money?", a: "No", sub: "Account is clear", t: "ok" };
  return [why, who, wrong, block, leaves, owes];
}

function VehicleScreen({ s, v, onBack, say }: { s: State; v: YardVehicle | undefined; onBack: () => void; say: (t: string) => void }) {
  if (!v) return (
    <><header className="m-head m-sub"><button className="m-back" onClick={onBack}>Back</button></header><p className="m-empty">That vehicle is no longer on site.</p></>
  );
  const st = STATUS[v.status];
  const l = (v.status === "waiting_parts" || v.status === "accounts_hold" || v.status === "cvrt_issue") ? attentionLine(v) : null;
  const co = company(v.customerId);
  const banner = l ? l.head : st.label;
  const bannerSub = l ? l.sub : v.status === "ready" ? (v.promised ? `Collection ${fmtWhen(v.promised)}` : "Ready for collection") : v.status === "workshop" ? "Work in progress" : v.status === "waiting_approval" ? "Waiting for the customer" : "Needs a person to identify it";
  const qa = sixQuestions(s, v);
  const call = () => say(co ? `Calling ${co.contact} at ${co.name} on ${co.phone ?? "the number on file"} (simulated)` : "No customer on file to call");
  const ask = () => say(`Question about ${v.reg} sent to Anthony Reynolds (simulated)`);
  return (
    <>
      <header className="m-head m-sub">
        <button className="m-back" onClick={onBack}>Back</button>
        <div className="m-plate-big"><Plate reg={v.reg} /></div>
        <h1 className="m-vtitle">{v.customer}</h1>
        <p className="m-note">{v.model}{v.job ? `, ${v.job.id}` : ""}</p>
      </header>
      <div className={"m-banner " + tone(st.tone)} role="status">
        <b>{banner}</b><span>{bannerSub}</span>
      </div>
      <dl className="m-qa">
        {qa.map(x => (
          <div key={x.q} className={"m-q " + tone(x.t)}>
            <dt>{x.q}</dt>
            <dd><b>{x.a}</b>{x.sub && <span>{x.sub}</span>}</dd>
          </div>
        ))}
      </dl>
      <div className="m-actions">
        <button className="m-btn primary" onClick={call} disabled={!co}>Call customer</button>
        <button className="m-btn" onClick={ask}>Ask Anthony</button>
      </div>
      <div className="m-foot"><KeyloopBadge /></div>
    </>
  );
}
