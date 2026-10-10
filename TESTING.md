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
| `teach` | A wrong action is never refused (Max, October 7, 2026): handing off pressure before 911 (−5 once), the bystander on the crash's life threat (−10), packing or a tourniquet on the scalp cut (−3 each, once), each with a feedback line that says what is right |
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

## 0.14.0 checks (October 8, 2026, Kit check)
- `drills`: the kit check scores 100 right and 0 wrong; 400 generated sets across the four drills are well-formed; every kit-check run has eight distinct questions, and its "belongs", "does not belong" and "what is missing" keys agree with the test's own reading of what a kit holds (not the app's tables); the right answer is neither the longest nor the shortest more than 45% of the time; the fixed questions cover the trainer tourniquet, dates, restocking and where kits are found, with no claim about a law; the lesson, the packing station, the reference and "Which technique?" agree on the neck (pack and press, never wrapped, never across the windpipe) and the 3-minute hemostatic hold.
- Browser check: the kit check played to the end at 320 and 390 px with real taps on the answer text, recorded at 100.

## 0.15.0 checks (October 8, 2026, one-handed self-tourniquet)
- `stations`: a clean run scores 100 instantly and at human pace; calling 911 first, walking for help, gripping with the hurt hand, letting go of the rod and waiting instead of calling are each allowed, cost points and still finish; the "to confirm" note shows, calling first really happens (the last step becomes "tell the dispatcher the time"), and the station is on the home list and in `STN`.
- `smooth`: the station's choices are not rebuilt or reshuffled while waiting.
- Browser check: the station played to the end at 320 and 390 px with real taps on the arm diagram and the buttons.

## 0.16.0 checks (October 8, 2026, talk a bystander through it)
- `stations`: seven clear instructions in order score 100 instantly and at human pace; a vague line, an out-of-order line, "let go" before the lock and "loosen it" each cost a mistake and the run still finishes; the bystander does exactly what you say (can't find the cut, puts it over the cut, lets go and it unwinds a step); the clear instruction is not usually the longest or the shortest.
- `smooth`: the coach choices are not rebuilt or reshuffled while waiting.
- Browser check: the station played to the end at 320 and 390 px with real taps.

## 0.17.0 checks (October 8, 2026, "It's just a little cut on her leg")
- `vein`: every layout scores 100 at human pace; the first decision is about the amount (a puddle the size of a dinner plate) over the size of the hole; A: pressure slows it and a raised leg controls it; B: pressure and a raised leg don't hold a vein below the knee, the radio says so, and the tourniquet goes above the knee; C: she stands (pressure off, bleeding faster), sitting her down and pressing again fixes it, and 40 s on her feet costs 5; a bandage instead of pressure is allowed, costs 5 once and says why; the skip-ahead button appears once only waiting is left (proved to fail without the handoff card's `ems` flag); Linda answers the blood-thinner question; the debrief says "her blood" and links to Patient Contact's fall call; the instructor's stand-up inject; the three decisions' balance. The vein scenario also runs in `scenarios`, `human`, `wrong`, `slow`, the Drill Night standard-patient check and `fuzz`.
- Browser check: layouts A and C at 390 px and B at 320 px played to the end with real taps (decisions by their visible text, the tourniquet on the diagram, the skip button), each to a 100; A checks the link to the fall call.

## 0.18.0 checks (October 8, 2026, the bike crash)
- `bike`: every layout on every tier scores 100 at human pace; "can you even use that on him?" has the child-size answer and Max's small-child line marked to confirm; telling him it won't hurt is allowed (he pulls away, 3 once) and the step still wants the truth; Chaos's thin arm takes more turns; layout C: his mom faints, laying her down and the neighbor holding Eli fix it free, and leaving it 40 s costs 5; skip-ahead stops the moment she faints and stays hidden until someone has Eli (proved to fail without the stop); sending her inside really happens and "hold him still" calls her back; the faint inject only in this scenario; the debrief; the two decisions' balance. Also in `scenarios`, `human`, `wrong`, `slow`, the Drill Night check and `fuzz`.
- Browser check: layouts A and C at 390 px and B at 320 px played to the end with real taps; the kitchen scenario's result screen at 320 px; every full run now measures overflow on its own result screen.

## 0.19.0 checks (October 8, 2026, the farm auger)
- `auger`: every layout on every tier scores 100 at human pace; reaching into the running auger is a never (−30), the machine keeps running and "Check the scene" shuts it down; layout C: pressure can't reach the wound (a refusal that costs nothing and says why) and the tourniquet goes above the elbow; layout B: the hand before control costs 5, straight on ice costs 3; the tractor inject: "stop him" fixes it free, 30 s ignored costs 5; the debrief (machine off first, never reverse it, any amputation gets a tourniquet, the part never delays care, never in direct contact with ice); the never label and nothing graphic. Also in `scenarios`, `human`, `wrong`, `slow`, the Drill Night check and `fuzz`.
- Browser check: layouts A and C at 390 px and B at 320 px played to the end with real taps.

## 0.20.0 checks (October 8, 2026, hunting season)
- `hunt`: every layout on every tier scores 100 at human pace; the vague 911 location really adds ten minutes; pulling the arrow is allowed, costs 10 and makes the bleeding worse; layout C: the tourniquet loosens about ten minutes in, the skip button hides, the second tourniquet opens at "above the first" and stops it free; skip-ahead stops the moment it loosens, and a minute without the second one costs 5; ten minutes on the frozen ground costs 3; the signal and dark injects; sending Tyler to the road brings them five minutes sooner; the debrief. Also in `scenarios`, `human`, `wrong`, `slow`, the Drill Night check and `fuzz`.
- Browser check: layouts A and C at 390 px and B at 320 px played to the end with real taps (C checks two tourniquets on).

## 0.21.0 checks (October 8, 2026, the fireworks festival)
- `fwk`: every layout on every tier scores 100 at human pace; the neck: a tourniquet on Ava's neck, a bandage wrapped around it and the card's "wrap it around her neck" are each −30, once, and nothing goes on; packing Ava's neck: "base of the neck", the wrong "wrap it" option costs 30, the hold says never across the windpipe; the one tourniquet on Rosa costs 10, then Greg can't get one and pressure completes his step; one hemostatic gauze; several bystanders, each told where; layout C's second tube (skip stops and hides, "everyone back" fixes it free) and layout B's parent (30 s ignored costs 5); leaving Ava untouched costs her blood loss over 20 % and the debrief lists every patient; the two instructor injects; nothing graphic and one right answer per card. Also in `scenarios`, `human`, `wrong`, `slow`, the Drill Night check and `fuzz`.
- Browser check: layouts A and C at 390 px and B at 320 px played to the end with real taps (patient switching, bystanders, the tourniquet on the diagram, packing the neck).

## Offline helper (final sweep milestone 1, October 10, 2026)
- `syntax`: the page and the shared core are network-first with a short wait (`NET_WAIT` ≤ 4 s, `Promise.race`), only 2xx answers are saved, installs use `cache:'reload'`, index.html is cached once. Proven in a browser (scratch): the first launch after a deploy runs the new page with the new core; a hanging network shows the saved page in under 4 s; a 404 serves the saved page.

## Saved data (final sweep milestone 1, October 10, 2026)
- CSV: a name typed as `=HYPERLINK(...)` (and `-2+3`, `+1`, `@SUM(1)`) exports with a leading apostrophe; every cell quoted.
- Wrong-shape saved data (`[]`, `5`, `{"runs":5}`, a null run) loads as an empty record and a new run still saves.
- `tests/fixtures/`: saved data from every older format of this module, loaded on every run: home/progress render, the CSV exports, a new run is added and no field is lost or list shrunk. Proven to fail (scratch): removing the `load()` normalizing fails the wrong-shape check.
