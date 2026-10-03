# Bleed Control — testing guide

Read this before changing the app. It's the third module in the same family as Charge the Line and Patient Contact, and it follows the same testing rules.

## Run the tests

You need [Node.js](https://nodejs.org) 18 or newer. No install step needed.

```
node tests/run_all.js          # everything — a few seconds
node tests/run_all.js quick    # syntax, balance, lesson, drills, record, fuzz
for i in 1 2 3 4 5; do node tests/run_all.js | tail -1; done    # before every release
```

**Optional real-browser check** (actually taps the tourniquet diagram on phone-sized screens):

```
pip install playwright && playwright install chromium
python3 tests/browser_check.py
```

## What the suite checks

| Section | What it proves |
|---|---|
| `syntax` | The script compiles; the trademark notice and "not affiliated" statement are present; the app's name doesn't use the trademarked phrase |
| `balance` | The right answer is neither usually the longest nor usually the shortest, across the lesson checks and scenario decisions |
| `lesson` | All 12 slides work; first-try-right scores 100, first-try-wrong scores 0; you can't skip a slide without answering its check |
| `stations` | Every skill station (arm and leg tourniquets, near-joint wounds, second tourniquet, packing, pressure) scores 100 when done right, and catches mistakes like a tourniquet on the elbow or skipping the time |
| `scenarios` | All four scenarios survive with a perfect score on every tier |
| `human` | Every scenario and variant survives at human pace (one tap about every 1.2 seconds, 2–3 second reactions) |
| `wrong` | Wrong decisions are survivable but cost points |
| `slow` | Scores fall as response time grows, and **no bleeding control at all is fatal** |
| `drills` | All drills score correctly; 300 generated sets are well-formed |
| `record` | Results save, and the CSV export works |
| `smooth` | Buttons and diagrams aren't rebuilt while you wait; answer choices keep their positions; "Talk to them" visibly responds; skip-ahead appears only when everything's done, and still charges the blood lost during the skipped time |
| `fuzz` | Random actions in every scenario never crash or produce impossible blood-loss values |

Verified to catch planted bugs: a station that accepts a tourniquet on the joint, direct pressure that does nothing, and a removed trademark notice all fail loudly.

## Content rules

1. **Follow the official course's principles; write everything in our own words.** The ACS course materials are copyrighted. The structure (lecture, then skills) and the core principles (safety first; Alert, find the Bleeding, Compress; tourniquet 2–3 inches above the wound and never on a joint; pack and press) are what we model. Never copy slides, images, or text.
2. **Don't use "Stop the Bleed" as our name.** STOP THE BLEED® is a registered trademark of the U.S. Department of Defense, licensed to the American College of Surgeons. We may *refer* to the official course and send people to it. The `syntax` check enforces both the notice and the name.
3. **Practice, not certification.** Never imply this app certifies anyone. The certificate comes only from the official course.
4. **Run any medical content change past a current instructor** before release.

## Engineering rules

0. **Never rebuild buttons on a timer.** Version 0.2 rebuilt every button four times a second to refresh the blood-loss numbers. A real finger tap takes about a quarter-second from touch to release, so taps that straddled a rebuild vanished: "Talk to them" registered 0 of 6 real taps, and the packing choices reshuffled while you read them. Automated clicks are instant, so every test passed. The fix: `setHTML()` only touches the page when the content actually changes, answer order is shuffled once per phase (`ST.ord`), and changing numbers live in text, not buttons. The `smooth` section and the slow-tap checks in `browser_check.py` (press, wait 0.26 s, release) guard this. In 3 idle seconds, version 0.2 destroyed 108 buttons; every app now destroys 0.


1. **Test at human speed.** The human-pace bot found a real-world problem that the instant bot never could.
2. **Bots use the same controls a person does.** Prefer the app's own handlers over editing state.
3. **Don't let answer length give anything away.** Run `balance` after writing any question.
4. **Outcomes should teach.** Blood loss is scored, so speed matters in the score the way it matters in real life.
5. **Run the suite several times.** Random variants make bugs intermittent.

## How it's organized (one file: `index.html`)

- `LESSON`: the 12 slides, with points, art, and knowledge checks.
- **Stations** (`stationOpen`, `stAct`, `stZone`, `stTick`): tourniquet, packing, and pressure. Used on their own in Practice and inside scenarios as "your hands."
- `SCN`: the scenarios (briefing, victims, checklist steps); `VARIANTS` randomizes each run; `rateOf()` turns interventions into bleeding rates; `DEC` holds the decisions.
- `DRILLS`, the pocket reference, About, and progress/CSV.

## Milestone 1 checks (added October 2026)

Foundation fixes: fonts served from this site, screen wake lock, finger-sized buttons. The `syntax` section (the hub: the plain list) now also proves:
- Fonts self-hosted in `fonts/`, no Google reference, every file in the cache list.
- Screen wake lock: requested when a lesson, station, or scenario starts, released at home or on the result screen.
- Browser check: any visible button under 44 px tall fails the screen; the slow-tap test scrolls to the button first, as a person would.

## Milestone 3 checks (added October 2026)

- Shared core: `preconnect-core.js` is loaded before the app script, listed in the service worker's cache, and its header hash matches its body (edit it, re-stamp with the hub's `node tests/core_hash.js`, copy to every repo).
- Spacing: 1, 3, 7, 14, 30 days after each clear at 70+; a miss resets; overdue reads as due.
- Debrief body: compare line (best, last time, new best), metrics table, what cost points, lesson chips, steps table.
- Scenario, station and lesson results all build through `pcDebriefBody` (covered by the existing record and smooth tests).

## Milestone 4 checks (added October 2026)

- Settings sheet present and wired to the shared key; browser check opens it from home.

## Milestone 5 part one checks (added October 2026)

- The existing `lesson` and `drills` sections now exercise the shared core engines through this module's wrappers; nothing was relaxed.

## Milestone 7 checks (added October 2026)

- `drill` section: with a session on, ten starts of each scenario give the standard patient, the bar reads "Up: Jo", and the saved lesson is stamped with who, instructor and night. Removing `pcDrillStamp` from `record()` in a scratch copy fails this check.
- Browser check: with a session in storage the picker opens on load and the bar shows after a pick.

## Milestone 6 checks (added October 2026)

- `drill` section: a penalty plays the bad tone and buzzes, the result screen chimes.

## Milestone 9 checks (added October 2026)

- `?drill=threat` on load opens that drill; an unknown id is ignored. Browser check adds a daily-link row.

## Milestone 10 checks (added October 2026)

- Browser check: landscape, Daylight and landscape-settings rows.

## Instructor mode checks (added October 3, 2026)

- `drill`: with instructor mode on and the garage scenario active, the Instructor button shows; opening the sheet pauses the clock; the ambulance inject pushes `S.eta` by 120 s; the slipped-tourniquet inject makes a controlled victim bleed again (`rateOf` > 0); injects whose guard fails are rendered disabled; Freeze holds the clock after the sheet closes and Resume releases it; the finished run carries `inst:1`.
- Browser check: an `instructor` row at 320 and 390 px (store `{inst:true}`, start the garage scenario, tap the Instructor button, check overflow and button sizes).
