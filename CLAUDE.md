# Preconnect: project briefing for Claude

You're picking up an established project. This file is the memory of a long build conversation. Read it fully before doing anything, then read `TESTING.md` in this repo.

## Who you're working with

**Max**, the owner and sole decision-maker. Paid firefighter (Monitor Township Fire Department, Bay County, Michigan), Stop the Bleed instructor for about two years, and going through AHA BLS Instructor training (instructor course November 7, 2026). Works a demanding full-time job, so development time is limited and precious.

**How Max likes to work:**
- Treat him as a well-briefed colleague. Skip backstory; get to substance.
- Structured, actionable answers with clear takeaways. Short and plain beats long and technical.
- **He's not a developer.** When something needs him to do something (GitHub settings, DNS, testing on his phone), give click-by-click steps, one stage at a time, and say how he'll know it worked.
- Mobile-first: he tests on his phone (iPhone). Everything must work beautifully on a phone.
- Minimize accounts and passwords.
- He tests hands-on and reports real friction ("this feels clunky"). Take those reports seriously: they have found the most important bugs. Reproduce them the way a person uses a phone, not the way a bot does.

## What Preconnect is

A free, independent training platform for fire and EMS skills, made in Bay County, Michigan. **"Ready before the call."** (A preconnect is the hoseline hooked up and ready before the call, so it flows the moment you need it.) **It is currently Max's personal project.** Don't describe it as a nonprofit or connect it to any organization; he may later move it to the 501(c)(3) Firefighters Association he founded, but that's undecided.

The name "Preconnect" was chosen after conflict checks. "Tailboard" was rejected because Fire Engineering's "Tailboard Talk" podcast already uses it; "Jumpseat" belongs to an established fire-training brand; "First Due" is an existing fire-software company.

| Module | Repo | Address | What it is |
|---|---|---|---|
| Home page (hub) | `charge-the-line.github.io` | `/` | Tiles for every module, combined training record (CSV), backup/restore, privacy, feedback |
| Charge the Line | `charge-the-line` | `/charge-the-line/` | Pump panel simulator for Engine 10-2, 10 scenarios including 5 "Real Saves" |
| Patient Contact | `patient-contact` | `/patient-contact/` | Medical first responder calls: 8 calls, cardiac monitor, randomized patients, drills, instructor mode |
| Bleed Control | `bleed-control` | `/bleed-control/` | Bleeding control modeled on the ACS Stop the Bleed® course: lesson, skill stations, scenarios |
| BLS Ready | `bls-ready` | `/bls-ready/` | BLS modeled on the AHA BLS Provider course, 2025 guidelines: lesson, timed skill stations, team scenarios, exam practice |

All live under the GitHub account **`charge-the-line`** at **https://charge-the-line.github.io/**. Each module's address is the home address plus its folder.

## Architecture (all apps)

- **One self-contained `index.html` per app.** No framework, no build step, no server, no dependencies. Plain HTML, CSS, and JavaScript. Keep it that way unless Max decides otherwise.
- **Progressive web app:** `manifest.json`, icons, and `sw.js` for offline use and Add to Home Screen.
- **Saved data lives in the browser (`localStorage`),** one key per app: `e102-pump-trainer` (Charge the Line), `patient-contact`, `bleed-control`, `bls-ready`, plus `preconnect` (hub profile) and `preconnect-stats` (statistics opt-out). All apps share one web address, so the hub can read every module's data. **There is no backend and no accounts.**
- **Deployment:** GitHub Pages from the `main` branch root of each repo. Committing to `main` deploys within a minute or two.
- **Versioning, required on every release:** bump `APP_VERSION` in `index.html` **and** `CACHE` in `sw.js` together. Charge the Line also shows the version as text on its intro and menu, Patient Contact on its intro; **those literals must be bumped too**, and since Milestone 1 the `syntax` checks fail if they don't match `APP_VERSION`. Forgetting means phones keep running the old version.
- **Fonts are self-hosted** in each repo's `fonts/` folder (Atkinson Hyperlegible + Saira Condensed in every app since Milestone 4; Charge the Line dropped Barlow then). SIL Open Font License; files from Fontsource 5.3.0, `@font-face` with `font-display:swap` in a `<style>` block where the Google link used to be. **Never link Google Fonts again:** offline the type fell back to a system font, and every page made a request to Google that the Privacy page didn't mention. Every suite checks that no page references Google and that each font file exists and is in the service worker's `CORE` list.
- **Screen wake lock.** Every module has `keepAwake(on)` next to `APP_VERSION`: `true` when an activity starts (Charge the Line and Patient Contact: `brief-go`; Bleed Control: `stationOpen`, `scStart`, `lessonStart`; BLS Ready: `runStart`, `lessonStart`, `quizStart`), `false` at the menu, home, or result screen (`showMenu`, `finish`, `showHome`, `showDone`). It re-acquires when the tab becomes visible again. Tests stub `navigator.wakeLock` with a synchronous thenable and check one request and one release.
- **Finger-sized controls.** Every `button` is at least 48 px tall (one rule in the font `<style>` block). The browser checks now fail on any visible button under 44 px (`SMALL` in `browser_check.py`). Charge the Line and Patient Contact also have a text floor: 15 px for anything read as a sentence, 13 px for captions (gauge numerals inside SVG are exempt).
- **Install coaching** (hub only): `installHint()` shows a one-time card to people using Preconnect in a browser tab. iPhone gets the Share → Add to Home Screen steps; Chrome gets a real Install button when the browser fires `beforeinstallprompt`. Never shown when already installed; dismissed = `localStorage 'preconnect-install' = 'no'`.
- **Look v2, "Station" (Milestone 2, chosen by Max from three mockups; on every app since Milestone 4).** Near-black background, condensed uppercase section labels with a rule (`.sec`), a 4 px accent bar down the left of every card (`.card`, `.scen`), solid uppercase condensed buttons (`.go`), square chips (`.chip`, `.chip.dim`), big condensed numerals (`.num`), segmented progress (`.seg`). Debriefs and the training record use report-style tables (`.pc-table`, direction B). Tokens live in `:root`: `--bg --deck --deck2 --line --ink --soft` plus the module accent `--acc` and `--acc-ink`. **Accents never change:** Charge the Line `#f0b323`, Patient Contact `#ff7a1a`, Bleed Control `#e5383b`, BLS Ready `#3b8bff`, hub orange `#ff7a1a`. Since Milestone 4 the shared look CSS lives in the core (`PC_LOOK_CSS`, injected by `pcInstallCSS()` from the `<head>` tag), so an app's own `<style>` can override it on purpose and nothing is copied by hand. Each app keeps only its tokens and its own components.
- **Motion means something, nothing decorates:** a score counts up on the result screen (`countUp`, about 0.6 s, stamps `data-final` immediately), progress segments fill when a screen opens (`.seg i.on`), a feedback line slides in and stays (`.in`), a pulse only ever fires once. The phone's Reduce Motion setting, or Motion = Off in Settings, stops all of it (`html[data-motion="off"]`), and tests check both rules exist.
- **One settings sheet, one key.** `localStorage 'preconnect-settings'` = `{sound:'off'|'on', haptics:'on'|'off', text:'normal'|'large', contrast:'normal'|'high', motion:'auto'|'off'}` (defaults listed first). The statistics switch in the sheet is the Privacy page's `preconnect-stats` key, not a copy. `applySettings()` writes `data-text`, `data-contrast`, `data-motion` onto `<html>` at boot; `html[data-text="large"] body{zoom:1.12}` and the high-contrast token override do the rest. **Every module must honor it:** haptics only through `haptic(ms)` or `pcBuzz(name)`, sound only through `pcCue`/`pcFx`/`pcMetro` or, in Patient Contact, when `settings().sound==='on'`. An app that caches a setting (Patient Contact's `SOUND`) sets `window.onPreconnectSettings = s => …`; the core calls it after every change from the sheet. The hub's sheet also holds the name and organization (moved off the home page) and the backup, restore, and CSV buttons sit under "More".
- **The shared core (Milestone 3): `preconnect-core.js`, one file copied byte-for-byte into every repo,** loaded by a `<script src="preconnect-core.js">` tag in `<head>`, right after `<title>` (so its CSS lands before the app's own styles). Plain script, no build step: its top-level functions are globals the app calls. It carries the settings code (`settings`, `setSetting`, `applySettings`, `settingsRender`, `settingsBind`, `motionOK`, `countUp`, `haptic`), **due-again spacing** (`pcSpacing(runs)` → `{status:'never'|'ok'|'due'|'missed', level, dueIn}`; 1, 3, 7, 14, 30 days after each clear at 70+, a miss resets), `pcBestPrev(runs)` (best and last score from earlier runs), and **Debrief 2.0** (`pcDebriefBody({score, compare, kicker, metrics, feedback, lessons, steps, extra, clean})` renders the body of every result screen: a compare line against your best and last time, a metrics table, "What cost points", "Learn from it" chips with `data-k` for the app's guide cards, and a steps table; `pcInstallCSS()` injects the styles it needs), and since Milestone 5 the **lesson engine** (`pcLessonStart({slides, ov, box, label, point, art, onDone, onQuit})` → state; `pcLessonAct(S, dataset)` handles `data-l` actions ans/next/prev/tv/quit; a slide is `{t, pts[], q, o:[[text,'good'|'bad']…], why}`; the check must be answered to move on; retry allowed; first-try-right counts) and the **quiz engine** (`pcQuizStart({name, qs:[{q,a,d[],why}], kind, id, why, note, menuAction, menuLabel, onDone, onQuit})`; `pcQuizAct(S, dataset)` handles `data-q` quit/ans/next and returns false for anything else, so the app handles its own actions first; options are shuffled once with `pcShuf`), and since Milestone 7 **Drill Night** (`pcDrill()` → the live session or null, from `localStorage 'preconnect-drill'` = `{on, inst, org, roster[], who, start}`; `pcDrillStart(inst, roster, org)`, `pcDrillEnd()` keeps the roster, `pcDrillWho(name)` switches or adds a person; `pcDrillStamp(run)` adds `who:[name]`, `inst` and `night` (the session's start time) to a run object before it is saved; `pcDrillBar()`, `pcDrillPick()`, `pcDrillAct()`, `pcDrillBind()` run the bar and the picker, which every page carries as `<div id="pc-drill" class="pc-drillbar hidden" data-hub="../">` right after `<body>` and `<div class="overlay hidden" id="pc-drillov"><div class="box" id="pc-drillbox"></div></div>`; a module calls `pcDrillBind()` at boot, which also opens the picker when a session is on and nobody is up yet). Since Milestone 6 it also carries **sound and haptics**: `pcCue(name)` plays a short synthesized cue (tick, good, bad, done, breathe, warn) through one lazily created AudioContext, `pcBuzz(name)` vibrates a pattern, `pcFx(name)` does both, `pcMetro(bpm)` runs a metronome scheduled on the audio clock (`pcMetro(0)` stops it; `pcMetroState()` for tests), all gated by `settings().sound` / `settings().haptics`; the first pointerdown on any page resumes the audio context (iOS needs a gesture); `setSetting()` previews a cue or a buzz when a switch is turned on; the lesson and quiz engines cue right and wrong answers. Apps call `pcFx('bad')` where they take points, `pcCue('good')` on good feedback, `pcFx('done')` on a result screen. It never defines `$` or `esc`.
  - **Editing it:** change the copy in the hub repo, run `node tests/core_hash.js` there to re-stamp the header hash, then copy the file to the other four repos. Every suite's `syntax` section fails if the header hash doesn't match the body, if the tag or the service-worker cache entry is missing, and the hub's suite also fails if any sibling repo checked out next to it holds a different copy. The test mocks prepend the core to the app script with one `new Function`.
  - **Using it:** the hub's Today view shows "Due for review" cards from `pcSpacing` over every module's records; BLS Ready's home chips turn to Due or Again; every module's result screen (Charge the Line `finish`, Patient Contact `finish`, Bleed Control `scFinish`/`practice`/`lessonDone`, BLS Ready `runFinish`) builds its body with `pcDebriefBody` and counts the score up with `countUp`. Charge the Line still keeps its own `scen.level` spacing for now; unify when its progress screen moves to the core.
- **Drill Night (Milestone 7).** One instructor runs a room from the hub: set up (instructor, group, roster), then every module shows the purple bar with who is up. Runs are credited to that person (`who`), the instructor (`inst`) and the night (`night`), so the hub's board and the night's CSV come straight from `records()`. While a session is on, Charge the Line pins layout A and turns the Instructor button on, Patient Contact uses standard patients and turns instructor mode on, Bleed Control uses the same patient for everyone (`STD_V`), BLS Ready just credits runs. "Nobody, just practicing" credits the phone's own name as before. Names never go into statistics; the only events are `hub/drill-night-start`, `-end` and `-csv`.
- **The hub is a "Today" view** (`today()`): pick up where you left off (the most recent record across modules, with a Continue link), this week's count, and a tile per module showing distinct activities done out of its total (totals come from the `L` name table, so a new activity added to `L` changes the total automatically), the last tier used, and a Ready chip when complete. A phone with no records sees "Start with a ten-minute lesson" instead.

### Shared-domain rules (every app shares one address)
1. Each app lives in its own folder and registers its own `sw.js`.
2. Each offline helper deletes **only its own** old caches: `k.startsWith('<slug>-v')`. An earlier version deleted every app's caches whenever one app updated.
3. The hub's offline helper handles **only root files** and leaves every folder alone. Its `ownFile` rule is tested.
4. **Offline helpers never cache statistics requests** (goatcounter.com, zgo.at). Each count is unique; caching them would bloat phones forever and lose counts.

### Anonymous statistics (GoatCounter)
- Dashboard: **https://preconnect.goatcounter.com** (Max's account). Free for non-commercial use.
- Every app has the same snippet: `<script data-pca>` in `<head>`, which defines `window.PCA`. Apps call it through a guarded helper `pca('begin'|'end'|'abandon'|'ev', …)`.
- Events are paths like `bls/start/adult`, `bls/finish/adult/recall/attempt-2/score-90-100`, `bc/quit/garage/step-3`, `error/bls/<message>`. Starting something new, leaving the page, or tapping quit records a **quit with the exact step**. Full dictionary in the hub repo's `ANALYTICS.md`.
- **Privacy rules, enforced by tests:** never send names, organizations, crew names, or typed text. Scores only as coarse bands. The Privacy page's switch (`preconnect-stats` = `off`) stops everything, on every module, on that device. `tests/platform_check.py` in the hub repo types a name into the app and fails if it ever appears in an event.
- The snippet uses `<script data-pca>` (with an attribute) on purpose: the test harnesses find the app's main code by the first plain `<script>` tag.

## Rules learned the hard way (all apps)

Each of these cost a real bug. Don't relearn them.

1. **Two clocks.** Simulation time can run faster than real life. **Anything that measures the person (breath timing, reaction times, pause lengths, compression rate) must use real seconds.** Breaths timed on game time once never counted.
2. **Test the way a finger works, not a bot.** Instant automated clicks miss whole classes of bugs. Every suite plays at human pace (about 1.2 seconds per tap, 2–3 second reactions), and the browser checks use **slow taps** (press, wait 0.26 s, release) and **real taps on buttons found by their visible text.**
3. **Never rebuild buttons on a timer.** Bleed Control once rebuilt every button four times a second; real taps that straddled a rebuild vanished ("Talk to them" registered 0 of 6 taps). Build a screen once and update text and colors in place (`setHTML()` only touches the page when content changes). Shuffle answer order **once**, never on re-render. Every app now rebuilds **zero** buttons while idle; keep it that way.
4. **Momentum taps.** After a step changes, ignore taps for about half a second and dim the new buttons (`.cool`). Overshoot at a steady rhythm (extra compressions after #30) slips past a timer, so mirror the real motion: BLS Ready shows a "30 ✓ — stop, move to the airway" panel where the PUSH pad was, and the breath button sits lower.
5. **Feedback must stay on screen.** A penalty that appears and vanishes as the step advances is worse than none. Keep a persistent "what just happened" line (Bleed Control `g-now`, BLS Ready `run-now`).
6. **Answer length can't give the answer away, in either direction.** The writer's habit (Claude's habit, specifically) is to make the right answer the longest and most explained. It happened in **every** module, and the first fix overcorrected into "right answer is shortest." Each suite's `balance` check limits both to 45%. Run it after writing any question, and shuffle answer order on screen.
7. **Never verify an answer against its own key.** Recalculate independently (drill math, APGAR sums, oxygen durations).
8. **Bots must use the controls a person uses.** A missing "Gate −" button went unnoticed because the bot set valve positions directly.
9. **Escape quotes in HTML attributes.** A button labeled `Tap and shout: "Are you okay?"` broke its data attribute, and the step could never be completed by tapping.
10. **Startup order:** load saved settings in the boot section at the bottom. Earlier, `load()` fails silently and settings stop being remembered.
11. **Randomness makes bugs intermittent.** Run each suite several times before release (`for i in 1 2 3 4 5; do node tests/run_all.js | tail -1; done`). An intermittent failure is usually a real bug in one random variant; it found one.
12. **Prove a test can fail.** For important checks, plant the bug in a scratch copy and confirm the suite catches it.
13. **Every overlay has a way back.** A briefing, card, sheet, drill, or station always offers Back, Close, Quit, or Stop and go back, so nobody is trapped into starting something. Max found Charge the Line's briefing with only "Start mission" (fixed in 2.5.1). The one deliberate exception: a decision point, which must be answered.

## Content and legal rules

- **Write everything in your own words.** Official course materials (ACS Stop the Bleed, AHA BLS) are copyrighted. Model the structure and the published science, never their slides, videos, exam questions, or skills-test checklists.
- **Trademarks:** STOP THE BLEED® (U.S. Department of Defense, licensed to ACS) and American Heart Association, BLS Provider, Heartsaver (AHA). Our names stay "Bleed Control" and "BLS Ready." Refer to the official courses and say we're not affiliated. The test suites check the notices.
- **Practice, not certification.** Never imply the platform certifies anyone.
- **Medical content follows current guidelines with protocol caveats.** Bay County MCA (medical control) review is **still pending** for Patient Contact; keep agency and hospital names generic until approved ("Medic 1," "East Side Hospital," "Regional Medical Center").
- **Real Saves** (Charge the Line) follow published accounts with sources cited. Unpublished specifics are modeled and labeled as such.

## How to work in this repo

1. Before changing anything: `node tests/run_all.js`. It should be all green.
2. Make the change. Keep the single-file architecture.
3. Add or update tests for what you changed, especially anything a real person would feel.
4. Run the suite several times; run `python3 tests/browser_check.py` too if Playwright is available.
5. Bump `APP_VERSION` and `sw.js` `CACHE` together (plus the intro/menu version text in Charge the Line and Patient Contact).
6. Commit with a plain-English message. Then tell Max in plain language **what changed, and exactly how to check it on his phone.** After a deploy, he may need to refresh once.
7. If you change a module's saved-data format, activity IDs, or add an activity, the **hub** needs updating too: its name table (`L` in the hub's `index.html`) and its test fixture.

## Status and open items (as of October 2026)

**Rollout to the Preconnect structure:** Steps 1–3 done (Charge the Line in its own repo; modules updated; the hub is live at the site root, confirmed October 3, 2026). **Steps 4–6 pending:**
- **Step 4:** Max backs up his progress (hub → "Back up to a file").
- **Step 5:** custom domain. Max has the name; he'll add GitHub Pages DNS records (A: 185.199.108.153, .109, .110, .111; `www` CNAME → `charge-the-line.github.io`), set the custom domain on the root repo, then Enforce HTTPS. Project repos follow automatically. **Afterward, update the two `og:` URLs at the top of the hub's `index.html` to the new domain.**
- **Step 6:** restore progress on the new domain; reinstall the home-screen icon.

**Pending from Max:**
- **A feedback email address:** set `FEEDBACK_TO` in the hub's `feedback.html`. Until then, "Send" uses the phone's share sheet.
- Turning statistics off on his own devices (Privacy page switch).

**Backlog, in rough priority:**
1. **Phase 2: shared core.** Every app carries its own copy of the decision cards, lessons, drills, progress/CSV, instructor tools, and the test harness. Extract a shared file once the next module starts. That's also when Charge the Line should get what the others have: randomized scenarios, drills, instructor mode.
2. Medical review: Bay County MCA (Patient Contact); Max's review of BLS Ready against his 2025 instructor materials; Max's review of Bleed Control against the course as he teaches it. Ask ACS whether they'd endorse Bleed Control or allow the name.
3. Patient Contact next calls: pediatric breathing (asthma/croup), carbon monoxide, cold-water hypothermia.
4. Charge the Line: tappable panel photo map (needs photos of Engine 10-2's panel), "find the control" quiz, apparatus profiles for other departments.
5. **Phase 3** (when departments adopt it or grants fund it): accounts, instructor and department dashboards, cross-device sync, one app store listing.

**Grants context:** Bay Area Community Foundation (development) and FEMA AFG (deployment). A **90-day pilot with before-and-after data** is the core of every application. The statistics are designed for it: score bands at attempt 1 vs. attempt 5 show learning.

## Roadmap and guardrails (decided by Max on October 3, 2026, after the Phase 0 audit)

The Phase 0 audit walked every module on a 390 px screen. Findings that drove the plan: two generations of UI (Charge the Line and Patient Contact open on a text wall and a menu overlay; Bleed Control and BLS Ready on a clean home list), Charge the Line's 30 px valve buttons and 7 px gauge labels, fonts loading from Google, no wake lock, thin debriefs in Charge the Line and Patient Contact, "not yet" progress lists, almost no motion or sound, no accessibility work.

**Milestones, in order.** Each ends with something Max tests on his phone, then he gives the go-ahead for the next. Say roughly how big the next one is before starting it.
1. **Foundation fixes — done October 3, 2026** (this release): self-hosted fonts, wake lock, 48 px buttons and a text floor, install coaching, Privacy page updated.
2. **Look v2 on the hub and BLS Ready — done October 3, 2026:** Station direction (A) with report-style tables (B), design tokens, module accent colors, meaningful motion, one settings sheet (sound, haptics, text size, contrast, motion, statistics), the hub "Today" view. Hub 1.3.0, BLS Ready 0.6.0.
3. **Shared core step 1 + Debrief 2.0 — done October 3, 2026:** `preconnect-core.js` byte-identical in every repo (hash header, drift tests), carrying settings, due-again spacing, best/last comparison and the Debrief 2.0 body used by every module's result screen; Due for review cards on the hub, Due/Again chips in BLS Ready. Hub 1.4.0, Charge the Line 2.6.0, Patient Contact 0.16.0, Bleed Control 0.6.0, BLS Ready 0.7.0. Still to come in later core steps: shared records format, lessons/decisions/drills engine, instructor mode, test harness.
4. **Look v2 on the other three modules, plus first-run cards — done October 3, 2026:** Charge the Line, Patient Contact and Bleed Control carry the Station tokens, accent-bar lists, uppercase primary buttons and the settings sheet; Charge the Line moved to Atkinson + Saira; Patient Contact's sound switch is the shared setting. The two intro text walls became short first-run cards (under 120 words, tested) with the full text under "How to play". Hub 1.4.1, Charge the Line 2.7.0, Patient Contact 0.17.0, Bleed Control 0.7.0, BLS Ready 0.7.1, core 1.1.0.
5. **Shared engine step 2, part one — done October 3, 2026:** the core (1.2.0) carries the lesson engine (`pcLessonStart/Render/Act`: slides with a check question each, retry allowed, first-try-right scores) and the quiz engine (`pcQuizStart/Q/Act`: shuffled options, a "why" line, score and debrief); BLS Ready's lesson and exam practice and Bleed Control's lesson and drills run on them with no visible change. **Charge the Line caught up:** a 12-slide pump lesson, four quick drills (friction loss, pump discharge pressure, find the control, hydrant math) with computed answer keys, the existing Pump math typing drill under the same menu, and a new `extra[]` record list the hub reads. Hub 1.5.0, Charge the Line 2.8.0, Patient Contact 0.17.1, Bleed Control 0.8.0, BLS Ready 0.8.0. **Part two — done October 3, 2026 (Charge the Line 2.9.0, hub 1.5.1):** the five regular scenarios have three named layouts each (`VARIANTS`: hose length, nozzle, hydrant strength, relay lay length), picked at random per run or pinned to A with the menu's "Layouts: standard" switch; the Real Saves never vary. Instructor mode (menu switch, saved) adds a floating Instructor button during a scenario with live injects (burst length, governor dropout, another engine on the main, fouled strainer, tank gauge drop) and a freeze; injects reuse the Chaos fault code, which now recovers on every tier. The progress screen is two tables (scenarios with layouts seen; lesson, drills, pump math) and the CSV carries the lesson and drill rows. The hub shows a run's layout in the Patient column and "· instructor" in Mode.
6. **Sound and haptics pack — done October 3, 2026 (core 1.4.0; hub 1.7.0, Charge the Line 2.11.0, Patient Contact 0.19.0, Bleed Control 0.10.0, BLS Ready 0.11.0):** short synthesized cues in the core, no audio files, behind the shared switches (sound off by default, haptics on). Every module: a bad tone and a buzz on a penalty, a good tone on a right answer or a good step, a chime on every result screen; lessons and quizzes get it through the core engines. BLS Ready: a drift-free 110/min metronome during Guided compressions and a breathe cue when the breath window opens. Turning a switch on previews it. 7. **Drill Night mode for every module — done October 3, 2026 (core 1.3.0; hub 1.6.0, Charge the Line 2.10.0, Patient Contact 0.18.0, Bleed Control 0.9.0, BLS Ready 0.9.0):** the hub starts a session (instructor, group, roster), every page shows a purple Drill Night bar with who is up and a picker to switch or add a name, every saved run is stamped with that person, the instructor and the night, patients and hose layouts stay standard, instructor injects are on, and the hub's board lists the roster with bests and tonight's runs with a CSV of the night. Names stay on the phone; statistics count only that a session started or ended. 8. Depth packs (new calls, scenarios, Real Saves). **BLS Ready depth pack — done October 3, 2026 (BLS Ready 0.10.0, hub 1.6.1):** a Special situations lesson slide (drowning, pregnancy, opioids, AED pads over patches and devices), a Child CPR two-rescuer station (carotid or femoral, about 2 inches, 15:2, and rescue breathing when the pulse returns), two scenarios (Pulled from the pool: breaths first and a dry chest for the AED; Not breathing in the crib: an infant with a pulse, rescue breaths every 2–3 seconds, then CPR when the pulse falls under 60 with poor perfusion), twelve more exam questions (36 in the bank, 15 asked), a Special situations drill, and pocket-reference lines. Readiness counts 19 activities. Charge the Line and Patient Contact depth packs are still open. 9. Progression and a 60-second daily drill from the hub. 10. Accessibility, daylight high-contrast mode, landscape.
Max's likely picks after 1: 2, then 3, then either Charge the Line catch-up or Drill Night. Anything needing a server, accounts, or paid services is proposed separately and never built without his say-so.

**Guardrails from Max for later milestones:**
- Real Saves about mass-casualty events (for example the marathon bombing) or any school scenario: survivor- and rescuer-centered, no graphic detail, no focus on attackers, published sources only. **Run the content past Max before building.**
- New Patient Contact calls stay subject to the pending MCA review: generic names, and flag every protocol assumption.
- **BLS content is not frozen** (Max, October 3, 2026: "BLS doesn't need to stay frozen"). New BLS Ready content may be built any time, in our own words against the published 2025 guidelines; Max will still compare it with the official course after his instructor class on November 7, 2026, and anything AHA teaches differently gets adjusted then.
- Share cards never include names or personal history by default.
- Max will supply photos of Engine 10-2's pump panel for the photo map; tell him exactly which shots are needed when that milestone starts.
- Keep the non-negotiables: guideline accuracy, privacy (no names in statistics, the opt-out), trademarks and own-words content, offline-first, no accounts, mobile-first. Test like a finger. Keep every suite green and add tests for anything a person would feel.

---

# This repo: Bleed Control (`bleed-control` → `/bleed-control/`)

**Current version: 0.10.0.** Modeled as closely as possible on the **ACS Stop the Bleed® course**, which Max has taught for about two years: a lecture with slides, then hands-on tourniquet and wound-packing practice. All content is in our own words.

## Look (Milestone 4)
Station tokens (`--acc:#e5383b`, white accent ink), accent-bar activity cards, uppercase `.go` buttons, gear `#h-set` on the home header opening the shared settings sheet. Section labels come from the core's `.sec`.

## Structure
- **Lesson** (`LESSON`, 12 slides in course order): why it matters (bleeding death in 3–5 minutes), safety, the ABCs (Alert, find the Bleeding, Compress), recognizing life-threatening bleeding, direct pressure, tourniquet (2–3 inches above the wound, never on a joint; go above the joint if needed; tighten until bleeding stops, lock, write the time; a second one above the first if needed; never loosen), wound packing (junctional wounds: groin, armpit, neck), until help arrives, kits.
- **Skill stations** (`stationOpen`, `stAct`, `stZone`, `stTick`): tourniquet arm/leg (tap zones on a limb diagram; near-joint wounds; second tourniquet), wound packing (pressure first, pack without lapses, hold), direct pressure (add cloth on top, never lift or swap). Practice stations have a "Stop and go back" button; inside scenarios they don't.
- **Scenarios** (`SCN`, `VARIANTS`): kitchen glass (kit or no kit), table-saw thigh (sometimes a second tourniquet), glass door (groin or armpit: pack, not tourniquet), two-car crash at night (traffic safety, triage, a bystander holds pressure). **Blood-loss physics:** `rateOf()` with pressure factors (`PRESF`), volume 5 L, death at 55%. **Blood lost beyond 20% costs score points.**
- **UX:** a "Now / Next" line (`g-now`) shows the conversation and the next step; a skip-ahead-to-the-ambulance button appears once only waiting is left, and still charges the blood lost during skipped time; the debrief lists every step with its time.
- Drills (life-threatening or not, which technique, tourniquet placement), pocket reference, progress/CSV. Since Milestone 5 the lesson and the drills run on the core's engines (`lessonStart/lessonAct` and `drillStart/drillAct` are thin wrappers; drill elements are `dr-*`, actions `data-d`).

## Sound and haptics (Milestone 6)
`ding` plays `pcFx('bad')`; `showDone` plays `pcFx('done')`; the lesson and drills cue through the core engines.

## Drill Night (Milestone 7)
With a session on, `scStart` merges `STD_V[id]` over the random variant (tourniquet available, wound mid-forearm, one tourniquet, groin wound), so everyone in the room gets the same patient, and `record()` wraps every run in `pcDrillStamp`. `pcDrillBind()` runs at boot.

## Smoothness (see TESTING.md, rule 0)
v0.2 rebuilt every button four times a second, so real taps vanished. `setHTML()` updates only on change; answer order is shuffled once per phase (`ST.ord`). The `smooth` tests and the browser slow-tap checks guard this.

## Tests
`node tests/run_all.js` (71 checks): includes trademark and name checks, balance, lesson, every station and variant, human pace, wrong answers, slow response and a fatal no-control run, drills, records, smoothness, fuzz. `python3 tests/browser_check.py` adds real-tap station runs and slow-tap tests.

## Repo housekeeping (done October 3, 2026)
When this repo was created, the test files were uploaded flat at the root. On October 3, 2026 (approved by Max) they were moved into `tests/` with `git mv`, so `node tests/run_all.js` works in place as TESTING.md describes. Nothing left to clean up here.

## Open questions for Max (as the instructor)
Does the lesson match the course as he teaches it? Packing: does his version teach a minimum hold time (such as 3 minutes), beyond "until help takes over"? Improvised tourniquets: we teach "don't; use firm pressure." Does that match? Also worth asking ACS (stopthebleed@facs.org) about endorsement or use of the name.
