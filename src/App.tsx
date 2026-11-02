import { useEffect, useState } from "react";
import { LogicHost } from "./runtime/logic";
import PulseLogic from "./logic/PulseLogic";
import AppShell from "./views/AppShell";
import { MdApp } from "./demo/mdApp";

/* ── Backgrounds: change these per client ──────────────────────────────────
   Any CSS colour works (#hex, rgb(), oklch()). One colour each; the shading
   is worked out for you. */
const config = {
  /** Abstract background behind the Dashboard's KPI band. Hidden in the light theme. */
  dashboardBackdrop: "#2034AB",
  /** Show the Dashboard background at all. */
  kpiBackdropOn: true,
  /** Wash behind the Records hero (Files and Contacts) and the New record dialog.
      Leave as "" to use the current theme's own gradient. */
  recordsBackdrop: "",
};

/** Standalone MD phone route: exactly "#md" (the shell's own MD page lives at "#md/home"). */
const isMdHash = (h: string) => /^#\/?md\/?$/i.test(h);

export default function App() {
  const [md, setMd] = useState(() => isMdHash(window.location.hash));
  useEffect(() => {
    // Read the hash from the event: the shell may already have rewritten location.hash by now.
    const on = (e: HashChangeEvent) => setMd(isMdHash(new URL(e.newURL).hash));
    window.addEventListener("hashchange", on);
    return () => window.removeEventListener("hashchange", on);
  }, []);
  useEffect(() => { if (md && window.location.hash !== "#md") history.replaceState(null, "", "#md"); }, [md]);
  if (md) return <MdApp standalone />;
  return <LogicHost logic={PulseLogic} view={AppShell} props={config} />;
}
