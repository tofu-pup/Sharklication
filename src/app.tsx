import { useEffect, useRef, useState } from "react";
import { useRegisterSW } from "virtual:pwa-register/react";
import {
  ACTIVITY_IDS, ACTIVITY_INFO, advance, catalogEntry, createInitialSave, currentQuestion,
  effectiveTables, getRun, hintFor, isDayComplete, localDateKey, markHint, sequenceFor,
  solvedToday, startActivity, startExtra, streakForDays, submitAnswer, summary, workedFor,
  type ActivityId, type SaveEnvelope, type TaskRun,
} from "./domain";
import { CATALOG, type Shark } from "./catalog";
import { storage } from "./storage";
import { parseBackup } from "./validation";
import { SharkArt } from "./shark-art";
import { checkOfflineReady } from "./offline";
import { canApplyUpdate, watchForControllerChange, watchForUpdates } from "./updates";
import { FeedingGroups } from "./feeding-art";
import { NavIcon } from "./nav-icon";
import { GrowingReef } from "./growing-reef";
import { SUCCESS_DELAY, SUPPORTED_SUCCESS_DELAY, useAutoAdvance } from "./use-auto-advance";

const asset = (path: string) => `${import.meta.env.BASE_URL}${path}`;
type Screen = "home" | "collection" | "parents" | "credits" | "play" | "celebrate";
const screenFromHash = (): Screen => {
  const route = location.hash.slice(1);
  return ["collection", "parents", "credits"].includes(route) ? route as Screen : "home";
};
function errorMessage(error: unknown): string { return error instanceof Error ? error.message : "Something went wrong. Please try again."; }
function playChime() {
  const context = new AudioContext();
  const gain = context.createGain();
  gain.gain.setValueAtTime(.07, context.currentTime);
  gain.gain.exponentialRampToValueAtTime(.001, context.currentTime + .45);
  gain.connect(context.destination);
  [523.25, 659.25, 783.99].forEach((frequency, i) => {
    const oscillator = context.createOscillator();
    oscillator.frequency.value = frequency;
    oscillator.connect(gain);
    oscillator.start(context.currentTime + i * .09);
    oscillator.stop(context.currentTime + .45);
  });
  setTimeout(() => { void context.close(); }, 650);
}

export function App() {
  const [save, setSave] = useState<SaveEnvelope>();
  const current = useRef<SaveEnvelope | undefined>(undefined);
  const [screen, setScreen] = useState<Screen>(screenFromHash);
  const [active, setActive] = useState<{ activity: ActivityId; date: string; extra: boolean }>();
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const locked = useRef(false);
  const [now, setNow] = useState(() => new Date());
  const [selected, setSelected] = useState<Shark>();
  const [offline, setOffline] = useState(false);
  const [online, setOnline] = useState(navigator.onLine);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [startupFailed, setStartupFailed] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration>();
  const [reloadPending, setReloadPending] = useState(false);
  const applyingUpdate = useRef(false);
  const { updateServiceWorker } = useRegisterSW({
    onRegisteredSW(_url, registration) { setRegistration(registration); },
    onOfflineReady() { void refreshOffline(); },
    onNeedRefresh() { setUpdateAvailable(true); },
    onNeedReload() { setReloadPending(true); },
    onRegisterError(error) { setNotice(`Offline setup did not finish: ${errorMessage(error)}. Practice and saving still work online.`); },
  });
  useEffect(() => {
    if ("serviceWorker" in navigator) return watchForControllerChange(navigator.serviceWorker, () => {
      setUpdateAvailable(true);
      setReloadPending(true);
    });
  }, []);
  useEffect(() => {
    if (reloadPending && canApplyUpdate(screen, busy, !!save, error)) location.reload();
  }, [reloadPending, screen, busy, save, error]);
  useEffect(() => {
    if (registration) return watchForUpdates(registration, (error) => {
      setNotice(`Couldn't check for a new version: ${errorMessage(error)}. Your current game and progress remain available; we'll check again when you reconnect or reopen it.`);
    });
  }, [registration]);
  useEffect(() => {
    if (!updateAvailable || applyingUpdate.current || !canApplyUpdate(screen, busy, !!save, error)) return;
    applyingUpdate.current = true;
    void updateServiceWorker(true).catch((error) => {
      applyingUpdate.current = false;
      setNotice(`The new version couldn't be activated: ${errorMessage(error)}. Reopen the game online to retry; your saved progress is safe.`);
    });
  }, [updateAvailable, screen, busy, save, error, updateServiceWorker]);
  async function refreshOffline() {
    try { setOffline(await checkOfflineReady()); }
    catch (error) { setOffline(false); setNotice(`Could not check offline assets: ${errorMessage(error)}`); }
  }
  async function load() {
    setError(""); setStartupFailed(false);
    try {
      const loaded = await storage.load();
      current.current = loaded; setSave(loaded);
    } catch (error) { setError(errorMessage(error)); setStartupFailed(true); }
  }
  useEffect(() => { void load(); void refreshOffline(); }, []);
  useEffect(() => {
    const tick = () => { setNow(new Date()); };
    const network = () => { setOnline(navigator.onLine); void refreshOffline(); };
    const hash = () => { setScreen(screenFromHash()); setSelected(undefined); };
    const interval = setInterval(() => { tick(); void refreshOffline(); }, 15_000);
    window.addEventListener("focus", tick);
    window.addEventListener("online", network); window.addEventListener("offline", network);
    window.addEventListener("hashchange", hash);
    return () => {
      clearInterval(interval); window.removeEventListener("focus", tick);
      window.removeEventListener("online", network); window.removeEventListener("offline", network);
      window.removeEventListener("hashchange", hash);
    };
  }, []);
  useEffect(() => { heading.current?.focus(); }, [screen, selected]);
  const date = save ? localDateKey(now, save.settings.homeTimezone) : "";
  useEffect(() => {
    if (active && active.date !== date && date) {
      setNotice("A new calendar day has begun (or the clock changed). Your earlier work is safe. Start a fresh expedition for today.");
      setActive(undefined); setScreen("home");
    }
  }, [date, active]);
  async function persist(change: (value: SaveEnvelope) => SaveEnvelope): Promise<SaveEnvelope | undefined> {
    if (!current.current || locked.current) return;
    locked.current = true; setBusy(true); setError("");
    try {
      const previous = current.current;
      const next = change(previous);
      if (next === previous) return previous;
      const saved = await storage.save(next, previous.revision);
      current.current = saved; setSave(saved);
      return saved;
    } catch (error) { setError(errorMessage(error)); return undefined; }
    finally { locked.current = false; setBusy(false); }
  }
  function go(target: Screen) {
    setSelected(undefined);
    if (["play", "celebrate"].includes(target)) { setScreen(target); return; }
    history.replaceState(null, "", `#${target}`);
    setScreen(target);
  }
  async function begin(activity: ActivityId, extra = false) {
    const today = localDateKey(new Date(), current.current!.settings.homeTimezone);
    const result = await persist((s) => {
      if (!extra) return startActivity(s, today, activity, crypto.randomUUID());
      const paused = getRun(s, today, activity, true);
      return paused && !paused.complete ? s : startExtra(s, today, "mixed", crypto.randomUUID(), Math.random, activity);
    });
    if (result) {
      setActive({ activity, date: today, extra });
      setNow(new Date()); go("play");
    }
  }
  function dayChanged(): boolean {
    if (!active || active.date === localDateKey(new Date(), current.current!.settings.homeTimezone)) return false;
    setNow(new Date()); setActive(undefined); go("home");
    setNotice("The day changed. Your previous progress is safe; today's checklist is ready.");
    return true;
  }
  async function answer(questionId: string, value: number) {
    if (!active || dayChanged()) return false;
    const before = currentQuestion(getRun(current.current!, active.date, active.activity, active.extra)!);
    const result = await persist((s) => submitAnswer(s, active.date, active.activity, questionId, value, new Date(), active.extra));
    if (result && before && value === before.a * before.b && result.settings.soundEnabled) {
      try { playChime(); } catch (error) { setNotice(`Sound is unavailable: ${errorMessage(error)}`); }
    }
    return !!result;
  }
  async function next(questionId: string) {
    if (!active || dayChanged()) return;
    const wasComplete = isDayComplete(current.current!.days[active.date]);
    const result = await persist((s) => advance(s, active.date, active.activity, new Date(), active.extra, questionId));
    if (result && !active.extra && !wasComplete && isDayComplete(result.days[active.date])) go("celebrate");
  }
  async function hint() {
    if (!active || dayChanged()) return;
    await persist((s) => markHint(s, active.date, active.activity, active.extra));
  }
  if (!save) return <main className="loading"><img src={asset("sharklication-logo.png")} alt="Sharklication" /><h1>{startupFailed ? "Your progress needs a little help" : "Opening your ocean…"}</h1>{error && <p role="alert">{error}</p>}{startupFailed && <><p>No progress has been replaced. Check that Safari allows website storage, then try again.</p><button className="button primary" onClick={() => void load()}>Try again</button></>}</main>;
  const today = save.days[date];
  const streak = streakForDays(save.days, date);
  const doneCount = ACTIVITY_IDS.filter((a) => today?.tasks[a]?.complete).length;
  const run = active && getRun(save, active.date, active.activity, active.extra);
  const reduceMotion = save.settings.reducedMotion;
  const solved = solvedToday(save, date);
  const reefSeed = `${save.profile.createdAt}:${date}`;
  return <div className={`app ${reduceMotion ? "reduce-motion" : ""}`}>
    <a className="skip-link" href="#main" onClick={(event) => { event.preventDefault(); document.getElementById("main")?.focus(); }}>Skip to content</a>
    <header className="site-header">
      <a href="#home" className="brand" onClick={(event) => { event.preventDefault(); go("home"); }} aria-label="Sharklication home"><img src={asset("sharklication-header.webp")} width="600" height="129" alt="Sharklication" /></a>
      <nav aria-label="Main navigation">
        <button className={screen === "home" || screen === "play" ? "nav-item active" : "nav-item"} onClick={() => go("home")}><NavIcon kind="ocean" /> My ocean</button>
        <button className={screen === "collection" ? "nav-item active" : "nav-item"} onClick={() => go("collection")}><NavIcon kind="album" /> Shark album</button>
      </nav>
      <button className="profile-pill" onClick={() => go("parents")} aria-label="Open parent settings"><span aria-hidden="true">⚙</span><span>Parent port</span></button>
    </header>
    <div className="connection-bar"><span><i className={offline ? "status-dot ready" : "status-dot"} />{offline ? "Offline ready" : import.meta.env.DEV ? "Development · offline requires a production build" : online ? "Preparing your ocean" : "Offline · cached content only"}</span><span>Just you, the ocean, and a little maths.</span></div>
    <main id="main" key={`${screen}-${selected?.id ?? ""}`} className={screen === "play" ? undefined : "scene-enter"} tabIndex={-1}>
      {error && <div className="message error" role="alert"><strong>Not saved yet.</strong> {error} <button onClick={() => setError("")}>Dismiss</button></div>}
      {notice && <div className="message" role="status">{notice} <button onClick={() => setNotice("")}>Dismiss</button></div>}
      {updateAvailable && <div className="message" role="status">{screen === "play" ? "A new version has downloaded. It will open automatically when you return to your ocean; this question won't be interrupted." : screen === "parents" ? "A new version is ready. Finish any settings or backup changes, then return to My ocean to update automatically." : error ? "A new version is waiting. Resolve the save error before updating." : "Opening the latest version… Your saved progress stays safe."}</div>}
      {!save.profile.welcomed ? <section className="welcome">
        <span className="eyebrow">YOUR UNDERWATER ADVENTURE STARTS HERE</span>
        <h1 ref={heading} tabIndex={-1}>Hey {save.profile.name},<br />there's an ocean waiting.</h1>
        <img src={asset("sharklication-logo.png")} alt="The approved Sharklication whale-shark mascot and colorful wordmark" />
        <p>I'm Gobfrey, your whale-shark guide! Come meet curious sharks and discover clever patterns with me. We'll practise a little each day, at your own pace.</p>
        <p className="muted">No timer. No lost treasures. Just a whale of a good time.</p>
        <button className="button primary" disabled={busy} onClick={() => void persist((s) => ({ ...s, profile: { ...s.profile, welcomed: true } }))}>Let's explore <span aria-hidden="true">→</span></button>
      </section> : <>
        {screen === "home" && <>
          <section className="hero">
            <div className="hero-copy">
              <span className="eyebrow"><span className="little-wave">≈</span> {save.profile.name.toUpperCase()}'S LITTLE CORNER OF THE OCEAN</span>
              <h1 ref={heading} tabIndex={-1}>Small steps.<br /><em>Big discoveries.</em></h1>
              <p>Gobfrey here! Your reef is calling, {save.profile.name}.<br className="desktop-break" /> Let's discover something together.</p>
              <button className="button primary" disabled={busy} onClick={() => doneCount === 3 ? document.getElementById("expedition-heading")?.focus() : void begin(ACTIVITY_IDS.find((a) => !today?.tasks[a]?.complete)!)}>{doneCount === 3 ? "Try some extra practice" : doneCount > 0 || today ? "Continue my expedition" : "Start today's expedition"} <span aria-hidden="true">→</span></button>
              <span className="hero-caption">At your pace. About 5–8 minutes. A new friend awaits.</span>
            </div>
            <div className="hero-ocean" aria-hidden="true">
              <span className="bubble b1" /><span className="bubble b2" /><span className="bubble b3" /><span className="bubble b4" />
              <span className="hero-sticker">OH, FIN-TASTIC! <span>✦</span></span>
              <img src={asset("sharklication-logo.png")} alt="" />
            </div>
          </section>
          <section className="stats-strip" aria-label="Your expedition progress">
            <div><span className="stat-icon amber" aria-hidden="true">☀</span><span><strong>{streak.current} day{streak.current === 1 ? "" : "s"}</strong><small>{streak.current && doneCount < 3 ? "Complete today to keep it going" : "Your daily streak"}</small></span></div>
            <div><span className="stat-icon turquoise" aria-hidden="true">★</span><span><strong>{doneCount} of 3 stars</strong><small>Today's expedition</small></span></div>
            <div><span className="stat-icon lavender" aria-hidden="true">♧</span><span><strong>{save.collection.length} shark{save.collection.length === 1 ? "" : "s"} found</strong><small>A growing ocean of friends</small></span></div>
          </section>
          <section className="expedition">
            <div className="section-heading"><div><span className="eyebrow">A LITTLE EACH DAY GOES A LONG WAY</span><h2 id="expedition-heading" tabIndex={-1}>Today's expedition <span className="date-tag">{new Intl.DateTimeFormat("en", { day: "numeric", month: "short", timeZone: save.settings.homeTimezone }).format(now)}</span></h2></div><span className="stars" aria-label={`${doneCount} of 3 daily stars`}>{ACTIVITY_IDS.map((a) => <span key={a} className={today?.tasks[a]?.complete ? "earned" : ""}>★</span>)}</span></div>
            <p className="section-intro">Pick an adventure. We'll choose the questions for you. Finish all three to discover a shark, then try extra practice. Every solved puzzle grows that adventure's reef!</p>
            <div className="activity-grid">{ACTIVITY_IDS.map((id, i) => {
              const info = ACTIVITY_INFO[id], task = today?.tasks[id];
              return <button key={id} className={`activity-card ${id} ${task?.complete ? "complete" : ""}`} disabled={busy} onClick={() => void begin(id, !!task?.complete)}>
                <div className="activity-art" aria-hidden="true"><span className="art-orbit" /><span className="art-emoji">{info.icon}</span><span className="art-spark">✦</span><span className="art-number">0{i + 1}</span></div>
                <div className="activity-body"><span className="activity-tag">{info.tag}</span><h3>{info.title}</h3><p>{info.subtitle}</p><div className="activity-meta"><span>{task?.complete ? "✓ Daily star earned" : task ? `${task.index} of ${task.questions.length} resolved` : info.minutes}</span><span aria-hidden="true">{task?.complete ? "★" : "✧"}</span></div><span className="activity-action">{task?.complete ? "Try some extra practice" : task ? "Continue" : "Let's go"} <span aria-hidden="true">→</span></span></div>
              </button>;
            })}</div>
          </section>
          <section className="daily-reefs" aria-labelledby="reefs-heading">
            <div className="section-heading"><div><span className="eyebrow">A LITTLE WORLD YOU HELP GROW</span><h2 id="reefs-heading">Today's growing reefs</h2></div></div>
            <p className="section-intro">Gobfrey says: “One solved puzzle, one new reef friend!” A different little ecosystem awaits each day. Helped answers count too. Every 12 friends starts another reef; your daily total keeps growing.</p>
            <div className="reef-grid">{ACTIVITY_IDS.map((activity) => <section className="reef-panel" key={activity}><h3>{ACTIVITY_INFO[activity].title}</h3><GrowingReef solved={solved[activity]} activity={activity} seed={reefSeed} /></section>)}</div>
          </section>
          <section className="ocean-bottom">
            <div className="discovery-note"><span className="round-mystery" aria-hidden="true">{doneCount === 3 ? "✦" : "?"}</span><div><span className="eyebrow">JUST BEYOND THE REEF</span><h3>{doneCount === 3 ? "You made a discovery!" : "Someone new is waiting…"}</h3><p>{doneCount === 3 ? "Today's treasure is safe in your album." : `${3 - doneCount} more ${3 - doneCount === 1 ? "adventure" : "adventures"} to meet your next ocean friend.`}</p><button className="text-button" onClick={() => doneCount === 3 ? go("celebrate") : go("collection")}>{doneCount === 3 ? "See today's discovery" : "Peek at my shark album"} →</button></div></div>
            <div className="guide-note"><GobfreyPortrait /><blockquote>“A wrong answer is just<br />a new place to explore.”<cite>— Gobfrey, your whale-shark guide</cite></blockquote></div>
          </section>
          {save.collection.length > 0 && <section className="section"><div className="section-heading"><h2>At home in your ocean</h2><button className="text-button" onClick={() => go("collection")}>Meet everyone →</button></div><div className="sanctuary-friends">{save.collection.slice(-4).map((entry) => {
            const shark = catalogEntry(entry.sharkId)!;
            return <button key={shark.id} className="friend" onClick={() => { setSelected(shark); go("collection"); setSelected(shark); }}><SharkImage shark={shark} /><strong>{shark.name}</strong><small>{shark.kind === "real" ? "Real species" : "Fantasy"}</small></button>;
          })}</div></section>}
        </>}
        {screen === "play" && run && active && <Play key={run.id} run={run} activity={active.activity} extra={active.extra} busy={busy} hasError={!!error} solved={solved[active.activity]} reefSeed={reefSeed} onHint={hint} onSubmit={answer} onNext={next} onHome={() => go("home")} headingRef={heading} />}
        {screen === "collection" && <section className="section album">
          {selected ? <SharkDetail shark={selected} back={() => setSelected(undefined)} headingRef={heading} /> : <>
            <span className="eyebrow">YOUR OCEAN, ONE FRIEND AT A TIME</span><h1 ref={heading} tabIndex={-1}>The shark album<span className="heading-dot">.</span></h1><p className="section-intro">{save.collection.length} of {CATALOG.length} discovered. Every friend stays with you, even if you miss a day.</p>
            <div className="catalog-notice">Starter collection: {CATALOG.filter((s) => s.kind === "real").length} photographed real species + {CATALOG.filter((s) => s.kind === "fantasy").length} illustrated fantasy sharks. More verified species are still being prepared.</div>
            <div className="collection-grid">{CATALOG.map((shark) => {
              const collected = save.collection.some((c) => c.sharkId === shark.id);
              return <button key={shark.id} disabled={!collected} className={`shark-card ${collected ? "" : "locked"}`} onClick={() => setSelected(shark)}>
                {collected ? <SharkImage shark={shark} /> : <div className="locked-art" aria-hidden="true">?</div>}
                <span className={`badge ${shark.kind}`}>{shark.kind === "real" ? "◉ Real species" : "✦ Fantasy"}</span><h3>{collected ? shark.name : "A mystery friend"}</h3><small>{collected ? "Meet this shark →" : "Complete a daily expedition to discover"}</small>
              </button>;
            })}</div>
          </>}
        </section>}
        {screen === "celebrate" && <section className="celebration section">
          <span className="eyebrow">THREE STARS. ONE BRILLIANT EXPLORER.</span><div className="celebration-stars" aria-hidden="true">★ ★ ★</div><h1 ref={heading} tabIndex={-1}>Fin-tastic work, {save.profile.name}!</h1><p>Gobfrey says: “You kept exploring and finished all three adventures! Let's meet your new ocean friend.” Your treasure is already saved.</p>
          {today?.rewardId && catalogEntry(today.rewardId) ? <div className="reward-reveal"><SharkImage shark={catalogEntry(today.rewardId)!} /><span className={`badge ${catalogEntry(today.rewardId)!.kind}`}>{catalogEntry(today.rewardId)!.kind === "real" ? "◉ Real species" : "✦ Fantasy"}</span><h2>{catalogEntry(today.rewardId)!.name}</h2><p>A new friend for your ocean.</p></div> : <div className="reward-reveal"><span className="big-symbol" aria-hidden="true">🏅</span><h2>Ocean Explorer badge</h2><p>Your collection is complete. Keep exploring for the joy of learning.</p></div>}
          <div className="button-row"><button className="button primary" onClick={() => go("collection")}>Open my album →</button><button className="button soft" onClick={() => go("home")}>Back to my ocean</button></div>
        </section>}
        {screen === "parents" && <Parents save={save} date={date} busy={busy} persist={persist} headingRef={heading} setError={setError} refreshOffline={refreshOffline} offline={offline} />}
        {screen === "credits" && <section className="section credits"><span className="eyebrow">REAL SHARKS. REAL PHOTOGRAPHERS.</span><h1 ref={heading} tabIndex={-1}>Our ocean owes a thank-you.</h1><p>Gobfrey is our illustrated whale-shark mascot and friendly guide, not a wildlife photograph or a collectible species. The mascot, header logo and Home Screen artwork were supplied by the owner. Fantasy SVG illustrations are original artwork for Sharklication, not wildlife photographs.</p>{CATALOG.filter((s) => s.photo).map((s) => <article key={s.id}><h2>{s.name}</h2><Attribution shark={s} /><p>Species facts: <a href={s.references[0]} target="_blank" rel="noreferrer">Florida Museum species profile ↗</a></p></article>)}<p>Photos, credits and facts are included locally. External source links need an internet connection.</p></section>}
      </>}
    </main>
    <footer><span><span aria-hidden="true">≈</span> Little practice. Lasting discoveries.</span><div><button onClick={() => go("credits")}>Photo credits</button><button onClick={() => go("parents")}>Grown-up stuff</button><span>Made for curious minds & big fins.</span></div></footer>
  </div>;
}

function GobfreyPortrait({ teacher = false }: { teacher?: boolean }) {
  return <img className={`gobfrey-portrait${teacher ? " gobfrey-teacher" : ""}`} src={asset(teacher ? "gobfrey-teacher.webp" : "icon-192.png")} width={teacher ? 640 : 192} height={teacher ? 338 : 192} alt={teacher ? "Gobfrey, your illustrated whale-shark teacher with glasses and a pencil" : "Gobfrey, your friendly illustrated whale-shark guide"} />;
}

function SharkImage({ shark }: { shark: Shark }) {
  const [failed, setFailed] = useState(false);
  if (shark.kind === "fantasy") return <SharkArt shark={shark} />;
  if (!shark.photo || failed) return <div className="photo-unavailable" role="status">Photo unavailable. {shark.name}'s photograph could not load. Reconnect or retry offline preparation in Parent port.</div>;
  return <img src={asset(shark.photo.localPath)} alt={`Photograph of ${shark.name} (${shark.scientificName})`} loading="lazy" onError={() => setFailed(true)} />;
}
function Attribution({ shark }: { shark: Shark }) {
  const photo = shark.photo;
  return photo ? <div className="attribution"><p>Photograph: {photo.creator}. <a href={photo.sourcePageUrl} target="_blank" rel="noreferrer">Original source ↗</a> · <a href={photo.licenseUrl} target="_blank" rel="noreferrer">{photo.licenseId} ↗</a></p><p>{photo.modifications}</p></div> : null;
}
function SharkDetail({ shark, back, headingRef }: { shark: Shark; back: () => void; headingRef: React.RefObject<HTMLHeadingElement | null> }) {
  return <>
    <button className="text-button" onClick={back}>← Back to my album</button>
    <div className="shark-detail">
      <div className="detail-image"><SharkImage shark={shark} /></div>
      <div>
        <span className={`badge ${shark.kind}`}>{shark.kind === "real" ? "◉ Real species" : "✦ Fantasy · imaginary shark"}</span>
        <h1 ref={headingRef} tabIndex={-1}>{shark.name}</h1>
        {shark.scientificName && <p className="scientific">{shark.scientificName}</p>}
        <dl><dt>{shark.kind === "real" ? "Where it lives" : "Make-believe home"}</dt><dd>{shark.habitat}</dd><dt>{shark.kind === "real" ? "Approximate adult size" : "Imaginary size"}</dt><dd>{shark.size}</dd></dl>
      </div>
    </div>
    <section className="shark-story" aria-labelledby="meet-shark">
      <span className="eyebrow">{shark.kind === "real" ? "A CLOSER LOOK AT AN AMAZING ANIMAL" : "A STORY FROM OUR MAKE-BELIEVE OCEAN"}</span>
      <h2 id="meet-shark">Meet {shark.name}</h2>
      {shark.description.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
      <h2>{shark.kind === "real" ? `${shark.facts.length} amazing facts` : `${shark.facts.length} imaginary curiosities`}</h2>
      <ul className="shark-facts">{shark.facts.map((fact, i) => <li key={fact}><span className="fact-number" aria-hidden="true">{i + 1}</span><p>{fact}</p></li>)}</ul>
      {shark.kind === "real" && <p className="wildlife-note">Wild sharks are best admired from a respectful distance. Never chase, touch or feed a wild shark.</p>}
      {shark.references.length > 0 && <div className="fact-sources"><h3>Explore the science</h3><p>Descriptions and facts are written for young explorers, using these species references. Source links need an internet connection.</p>{shark.references.map((reference) => <a key={reference} href={reference} target="_blank" rel="noreferrer">Florida Museum: {shark.name} ↗</a>)}</div>}
    </section>
    <Attribution shark={shark} />
  </>;
}
function Play({ run, activity, extra, busy, hasError, solved, reefSeed, onHint, onSubmit, onNext, onHome, headingRef }: {
  run: TaskRun; activity: ActivityId; extra: boolean; busy: boolean; hasError: boolean; solved: number; reefSeed: string;
  onHint: () => Promise<void>; onSubmit: (id: string, answer: number) => Promise<boolean>;
  onNext: (questionId: string) => Promise<void>; onHome: () => void; headingRef: React.RefObject<HTMLHeadingElement | null>;
}) {
  const [answer, setAnswer] = useState("");
  const [arrayMode, setArrayMode] = useState(false);
  const [autoPaused, setAutoPaused] = useState(false);
  const [manualAttempt, setManualAttempt] = useState<string>();
  const input = useRef<HTMLInputElement>(null);
  const q = currentQuestion(run);
  const autoAttempted = useAutoAdvance(q?.resolved ? q.id : undefined, !busy && !hasError && !autoPaused && manualAttempt !== q?.id,
    q?.hinted || (q?.attempts ?? 0) > 1 ? SUPPORTED_SUCCESS_DELAY : SUCCESS_DELAY,
    (id) => { void onNext(id); });
  useEffect(() => { setAnswer(""); setArrayMode(false); input.current?.focus({ preventScroll: true }); }, [q?.id]);
  useEffect(() => { if (run.complete) headingRef.current?.focus(); }, [run.complete, headingRef]);
  if (run.complete) return <section className="section activity-finished"><span className="big-symbol" aria-hidden="true">★</span><h1 ref={headingRef} tabIndex={-1}>{ACTIVITY_INFO[activity].title} {extra ? "extra practice" : "complete"}!</h1><p>{extra ? "Those facts are part of your learning story. Your reef keeps growing!" : "Your daily star and all your progress are saved."}</p><GrowingReef solved={solved} activity={activity} seed={reefSeed} compact /><button className="button primary" onClick={onHome}>Back to my ocean →</button></section>;
  if (!q) return null;
  const nextAttempted = autoAttempted || manualAttempt === q.id;
  const total = q.a * q.b;
  const prompt = activity === "reef" ? `Count in jumps of ${q.a}. Which number is missing?` : activity === "feeding" ? `${q.a} sharks get ${q.b} fish each. How many fish altogether?` : `${q.a} × ${q.b} = ?`;
  const submit = async () => {
    if (busy) return;
    if (q.resolved) { setManualAttempt(q.id); await onNext(q.id); return; }
    if (answer !== "" && await onSubmit(q.id, Number(answer))) setAnswer("");
  };
  return <section className={`play section play-${activity}`}>
    <div className="play-top"><button className="text-button" onClick={onHome}>← Pause & return</button><span>Progress saves after every answer</span></div>
    <div className="section-heading"><div><span className="eyebrow">{extra ? "EXTRA PRACTICE" : "TODAY'S EXPEDITION"} {q.correction ? "· A LITTLE REVIEW" : ""}</span><h1 ref={headingRef} tabIndex={-1}>{ACTIVITY_INFO[activity].icon} {ACTIVITY_INFO[activity].title}</h1></div><span className="question-counter">{run.index + 1} / {run.questions.length}</span></div>
    <progress value={run.index + (q.resolved ? 1 : 0)} max={run.questions.length} aria-label="Resolved questions" />
    <div className="play-layout"><div className={`question-card ${q.resolved ? "answer-success" : ""}`}>
      {q.resolved && <div className="answer-burst" aria-hidden="true">{Array.from({ length: 10 }, (_, i) => <span key={i} style={{ "--particle": i } as React.CSSProperties}>{i % 3 === 0 ? "★" : "○"}</span>)}</div>}
      <div key={q.id} className="question-content" role="region" aria-label="Question and pictures" tabIndex={0}>
      <h2 className={activity === "dive" ? "equation" : ""} aria-label={activity === "dive" ? `${q.a} times ${q.b} equals what?` : undefined}>{prompt}</h2>
      {activity === "reef" && <><div className="sequence" aria-label={sequenceFor(q).map((n) => n === null ? "missing number" : n).join(", ")}>{sequenceFor(q).map((n, i) => <span key={i} className={n === null ? "missing" : ""}>{n ?? "?"}</span>)}</div><p className="muted">Each jump adds {q.a}. The missing number is jump {q.b}.</p></>}
      {activity === "feeding" && <><FeedingGroups sharks={q.a} fishEach={q.b} array={arrayMode} /><button className="text-button" aria-pressed={arrayMode} onClick={() => setArrayMode(!arrayMode)}>{arrayMode ? "Show equal groups" : "Line them up as an array"} ↔</button><p className="muted">{q.a} groups × {q.b} in each group. The same total as {q.b} × {q.a}.</p></>}
      </div>
      <form className="answer-panel" onSubmit={(event) => { event.preventDefault(); void submit(); }}>
        <label htmlFor="answer">Your answer</label><input ref={input} id="answer" type="text" inputMode="none" autoComplete="off" pattern="[0-9]*" maxLength={3} value={q.resolved ? String(total) : answer} disabled={busy || q.resolved} onChange={(event) => setAnswer(event.target.value.replace(/\D/g, "").slice(0, 3))} aria-describedby="answer-feedback" />
        <fieldset className="number-pad" aria-label="Answer number pad" disabled={busy || q.resolved}>{[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => <button key={n} type="button" onClick={() => setAnswer((s) => (s + n).slice(0, 3))}>{n}</button>)}<button type="button" onClick={() => setAnswer("")} aria-label="Clear answer">Clear</button><button type="button" onClick={() => setAnswer((s) => (s + "0").slice(0, 3))}>0</button><button type="button" onClick={() => setAnswer((s) => s.slice(0, -1))} aria-label="Delete last digit">⌫</button></fieldset>
        <button type="submit" className="button primary check-answer" disabled={busy || (!q.resolved && !answer)}>{busy ? "Saving…" : q.resolved ? "Next discovery →" : "Check my answer"}</button>
        <div id="answer-feedback" role="status" aria-atomic="true" className={`feedback ${q.resolved ? "correct" : ""}`}>{q.resolved ? <><span className="success-star" aria-hidden="true">★</span><strong>{q.hinted || q.attempts > 1 ? "You worked it out!" : ["Fin-tastic thinking!", "You nailed it, explorer!", "That's a brilliant discovery!", "Whale done!", "You're making waves!"][run.index % 5]}</strong><span className="success-equation">{workedFor(q)}</span></> : q.attempts >= 2 ? "Gobfrey says: Let's build it together. Use the worked example below." : q.attempts ? "Not quite yet. Gobfrey has another way to try." : "Gobfrey says: Take your time. You've got room to think."}</div>
        {q.resolved && <div className="auto-next"><p>{busy ? "Saving your next step…" : hasError || nextAttempted ? "Your answer is safe. Retry Next discovery to save your next step." : autoPaused ? "Auto-next paused. Take all the time you need." : "Next question follows automatically after your celebration."}</p>{!nextAttempted && !hasError && <button type="button" className="text-button" disabled={busy} aria-pressed={autoPaused} onClick={() => setAutoPaused(!autoPaused)}>{autoPaused ? "Resume auto-next" : "Pause auto-next"}</button>}</div>}
      </form>
    </div><aside className={`hint-card ${q.resolved ? "guide-cheering" : ""}`} aria-label="Gobfrey's encouragement and hints"><GobfreyPortrait teacher /><h3>{q.resolved ? "Gobfrey says: Whale done!" : "A little help from Gobfrey?"}</h3><p>{q.resolved ? "“You kept thinking, and you found it! Look, a new reef friend!”" : "“No rush, no timer. We can try a different way together.”"}</p>{q.hinted ? <div className="hint-content"><h4>{q.attempts >= 2 ? "Let's put it together" : "Try splitting it"}</h4><p>{q.attempts >= 2 ? workedFor(q) : hintFor(q)}</p>{q.attempts >= 2 && !q.resolved && <button className="button soft" disabled={busy} onClick={() => { setAnswer(String(total)); input.current?.focus(); }}>Build the answer: {total}</button>}<small>Helped answers count for your expedition, not independent recall.</small></div> : <button className="button soft" disabled={busy || q.resolved} onClick={() => void onHint()}>Show me a strategy ✧</button>}<div className="hint-bottom">Mistakes never cost you a shark.</div><GrowingReef solved={solved} activity={activity} seed={reefSeed} compact /></aside></div>
  </section>;
}

type Persist = (change: (value: SaveEnvelope) => SaveEnvelope) => Promise<SaveEnvelope | undefined>;
function Parents({ save, date, busy, persist, headingRef, setError, refreshOffline, offline }: {
  save: SaveEnvelope; date: string; busy: boolean; persist: Persist;
  headingRef: React.RefObject<HTMLHeadingElement | null>; setError: (error: string) => void;
  refreshOffline: () => Promise<void>; offline: boolean;
}) {
  const [pending, setPending] = useState<SaveEnvelope>();
  const [reset, setReset] = useState(false);
  const [fileKey, setFileKey] = useState(0);
  const [name, setName] = useState(save.profile.name);
  const [timezone, setTimezone] = useState(save.settings.homeTimezone);
  const stats = summary(save, date), streak = streakForDays(save.days, date);
  const focus = effectiveTables(save);
  function exportBackup() {
    const blob = new Blob([JSON.stringify(save, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a"); link.href = url; link.download = `sharklication-backup-${date}.json`; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  async function readImport(file?: File) {
    if (!file) return;
    try {
      if (file.size > 15_000_000) throw new Error("Backup must be smaller than 15 MB.");
      setPending(parseBackup(await file.text())); setError("");
    } catch (error) { setPending(undefined); setError(errorMessage(error)); }
    finally { setFileKey((key) => key + 1); }
  }
  return <section className="section parents">
    <span className="eyebrow">A QUIET CORNER FOR GROWN-UPS</span><h1 ref={headingRef} tabIndex={-1}>Parent port</h1><p className="section-intro">Small, thoughtful practice. Progress stays on this device. No accounts, ads or tracking.</p>
    <div className="parent-stats"><div><strong>{stats.samples ? `${Math.round(stats.correct / stats.samples * 100)}%` : "Not yet"}</strong><span>Independent first-attempt accuracy</span><small>{stats.correct} correct / {stats.samples} unhinted mixed-dive attempts</small></div><div><strong>{stats.secure}</strong><span>Secure fact orientations</span><small>{stats.assisted} supported or non-recall submissions</small></div><div><strong>{streak.days}</strong><span>Completed practice days</span><small>Longest streak: {streak.longest} days</small></div></div>
    <div className="parent-grid"><section className="panel"><h2>Make it their ocean</h2><form onSubmit={(event) => { event.preventDefault(); void persist((s) => ({ ...s, profile: { ...s.profile, name: name.trim() }, settings: { ...s.settings, homeTimezone: timezone.trim() } })); }}><label htmlFor="player-name">Explorer name</label><input id="player-name" maxLength={40} required value={name} onChange={(e) => setName(e.target.value)} /><label htmlFor="timezone">Home timezone</label><input id="timezone" required value={timezone} onChange={(e) => setTimezone(e.target.value)} /><small>Use an IANA timezone, such as Europe/Oslo. Changing this affects future date assignments, not earlier records.</small><button className="button soft" disabled={busy || !name.trim()}>Save profile</button></form>
      <h3>Focus tables</h3><p>Start gentle, or enable harder tables now. Existing expeditions keep their saved questions.</p><div className="table-picker settings-tables">{Array.from({ length: 12 }, (_, i) => i + 1).map((table) => <button key={table} aria-pressed={save.settings.enabledTables.includes(table)} disabled={busy || (save.settings.enabledTables.length === 1 && save.settings.enabledTables.includes(table))} onClick={() => void persist((s) => ({ ...s, settings: { ...s.settings, enabledTables: s.settings.enabledTables.includes(table) ? s.settings.enabledTables.filter((t) => t !== table) : [...s.settings.enabledTables, table].sort((a, b) => a - b) } }))}>{table}×</button>)}</div>
      <label className="toggle"><input type="checkbox" checked={save.settings.autoUnlock} disabled={busy} onChange={(e) => void persist((s) => ({ ...s, settings: { ...s.settings, autoUnlock: e.target.checked } }))} />Gently unlock more tables as recall becomes secure</label><p className="muted">Currently practising: {focus.join(", ")}. Each 3 secure fact orientations unlocks the next table.</p>
      <h3>Comfort controls</h3>{(["soundEnabled", "reducedMotion"] as const).map((setting) => <label className="toggle" key={setting}><input type="checkbox" checked={save.settings[setting]} disabled={busy} onChange={(e) => void persist((s) => ({ ...s, settings: { ...s.settings, [setting]: e.target.checked } }))} />{setting === "soundEnabled" ? "Play a gentle success sound (off by default)" : "Reduce motion (system preference is also respected)"}</label>)}
    </section><section className="panel"><h2>A learning snapshot</h2><p>Independent recall is measured only in Discovery Dive, including its extra practice. Patterns, visual puzzles and reef growth do not establish recall.</p><div className="coverage">{focus.map((table) => {
      const facts = Object.entries(save.facts).filter(([key]) => Number(key.split("x")[0]) === table);
      return <div key={table}><strong>{table}×</strong><div><span>{facts.filter(([, f]) => f.state === "Secure").length} secure · {facts.filter(([, f]) => f.state !== "Secure").length} practising</span><meter aria-label={`${table} table coverage`} min={0} max={focus.some((t) => t > 10) ? 12 : 10} value={facts.length} /></div></div>;
    })}</div>
      <h3>Ready for review</h3>{stats.review.length ? <div className="review-facts">{stats.review.slice(0, 24).map(([key, f]) => <span key={key}>{key.replace("x", " × ")} <small>{f.state}</small></span>)}</div> : <p>No due facts recorded yet. This is not an assessment of mastery.</p>}
      <details><summary>How the learning labels work</summary><p><strong>New:</strong> not yet attempted. <strong>Practising:</strong> building understanding or recall. <strong>Secure:</strong> unhinted first-attempt recall on at least 3 distinct dates, with the latest two assessed primary attempts independently correct. Errors or hints in a primary mixed-dive assessment move it back to Practising.</p><p>Successful recall schedules review after 1, 3, 7, then 14 days. Incorrect or helped recall is due the next day, and up to 3 missed facts repeat after intervening questions. This is a practical heuristic, not proof of school-level mastery.</p></details>
    </section></div>
    <div className="parent-grid"><section className="panel"><h2>Keep a spare treasure map</h2><p>Device storage can be cleared or evicted. Export a backup regularly, especially before changing browsers or installing the app.</p><div className="button-row"><button className="button primary" onClick={exportBackup}>Export backup ↓</button><label className="button soft file-label">Choose backup to restore<input key={fileKey} type="file" accept=".json,application/json" disabled={busy} onChange={(e) => void readImport(e.target.files?.[0])} /></label></div>
      {pending && <div className="import-preview"><h3>Check before replacing progress</h3><p>Backup for {pending.profile.name}: {pending.collection.length} sharks, {pending.attempts.length} submitted attempts, {Object.keys(pending.days).length} date records.</p><p>This replaces this device's current progress; it does not merge saves. Export your current backup first.</p><div className="button-row"><button className="button primary" disabled={busy} onClick={async () => { const result = await persist(() => pending); if (result) { setPending(undefined); setName(result.profile.name); setTimezone(result.settings.homeTimezone); } }}>Confirm replacement</button><button className="button soft" onClick={() => setPending(undefined)}>Cancel</button></div></div>}
      <h3>Start a new ocean</h3><p>Reset removes local progress and the collection. It does not delete exported backups.</p>{reset ? <div className="button-row"><button className="button danger" disabled={busy} onClick={async () => { const result = await persist(() => createInitialSave()); if (result) setReset(false); }}>Yes, reset all local progress</button><button className="button soft" onClick={() => setReset(false)}>Keep my ocean</button></div> : <button className="text-button danger-text" onClick={() => setReset(true)}>Reset local progress…</button>}
    </section><section className="panel"><h2>Take your ocean with you</h2><ol><li>Open the HTTPS-hosted game in Safari on iPad.</li><li>Tap Share, then <strong>Add to Home Screen</strong>.</li><li>Open the installed app while online and wait for <strong>Offline ready</strong>.</li><li>Export a backup there too. Safari and standalone storage may differ.</li></ol><p>{offline ? "✓ This browser has the game and all starter photographs cached." : "Offline preparation has not been confirmed yet."}</p><button className="button soft" onClick={async () => {
      try { const reg = await navigator.serviceWorker?.getRegistration(import.meta.env.BASE_URL); await reg?.update(); await refreshOffline(); }
      catch (error) { setError(`Offline preparation could not be retried: ${errorMessage(error)}`); }
    }}>Retry offline check</button><p>Maths works without photo downloads. If offline setup fails, preserve progress, free space, reconnect and reload between activities. No countdowns, automatic streak freezes or penalties for missed days.</p><details><summary>About dates and local storage</summary><p>All answers use the configured home timezone. At midnight an unfinished activity stays on its earlier date, and the new day gets a new checklist. Clock changes cannot be fully prevented offline. Earlier records are never erased; future-dated records don't extend today's streak.</p></details></section></div>
  </section>;
}
