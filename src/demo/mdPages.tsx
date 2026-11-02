import "./md.css";
import { A, useDemo } from "./store";
import { Btn, Card, Head, Page } from "./ui";
import { MdApp } from "./mdApp";
import { KEYLOOP } from "./yardData";
import { vehicleByKey, yardCounts } from "./yard";

/* Presenter page inside the shell: the same MdApp, in a phone frame, with the
   few controls needed to show it is live. */
function MdPresenter() {
  const s = useDemo();
  const c = yardCounts(s);
  const held = vehicleByKey(s, "C139");
  const ecu = vehicleByKey(s, "C101");
  const released = s.yard.released.includes("C139");
  const ecuIn = !!s.jobs.find(j => j.id === "JOB-1042")?.partBlocker?.received;
  return (
    <Page>
      <Head title="MD mobile view" sub="What Paul sees on his phone: four numbers, the vehicles that need him, and the story behind any registration." />
      <div className="m-present">
        <div className="m-phone" aria-label="Phone preview of the MD view">
          <div className="m-notch" aria-hidden />
          <MdApp />
        </div>
        <div className="m-side">
          <Card title="This is what Paul sees on his phone">
            <p className="d-muted" style={{ margin: "0 0 10px" }}>
              It is not the whole product. There is no workshop planner, sales, finance or settings. Paul sees {c.onSite} vehicles on site, {c.blockedN} that need attention,
              {" "}{c.readyN} ready for collection and {c.overnightN} staying overnight. Tap a vehicle and the six questions he would otherwise phone someone to ask are answered at the top.
            </p>
            <div className="d-row">
              <a className="d-btn primary" href="#md" target="_blank" rel="noopener noreferrer">Open full screen</a>
              <span className="d-faint">Opens #md in a new tab, sized for a phone</span>
            </div>
          </Card>
          <Card title="Why it works">
            <ul>
              <li>Reads the same live store as the Yard, Workshop and Finance, so the numbers cannot disagree.</li>
              <li>{KEYLOOP.product} stays the system of record. Pulse adds WhatsApp, email, ANPR and workshop activity on top.</li>
              <li>Large type and big touch targets, readable at arm's length, light and dark.</li>
            </ul>
          </Card>
          <Card title="Watch it change">
            <p className="d-muted" style={{ margin: "0 0 10px" }}>Act somewhere else in the product and the phone follows.</p>
            <div className="d-row">
              <Btn sm disabled={released} onClick={() => A.releaseHold("C139")}>{released ? "Hold released" : `Accounts release ${held?.reg ?? "231-D-8812"}`}</Btn>
              <Btn sm disabled={ecuIn} onClick={() => A.receivePart("JOB-1042")}>{ecuIn ? "ECU received" : `Darren receives the ECU for ${ecu?.reg ?? "181-G-4471"}`}</Btn>
              <Btn sm kind="ghost" onClick={A.reset}>Reset demo</Btn>
            </div>
          </Card>
        </div>
      </div>
    </Page>
  );
}

export const MD_PAGES: Record<string, () => JSX.Element> = { home: MdPresenter };
