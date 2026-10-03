BLEED CONTROL — HOSTING
Upload these together: index.html, manifest.json, sw.js, icon-192.png, icon-512.png
(Part of Preconnect — the home page lives in the root repository.)
(plus the tests folder and TESTING.md — optional; they don't affect the app).

On the same GitHub account (charge-the-line):
 1. github.com -> "+" -> New repository -> name it bleed-control -> Public -> Create
 2. "uploading an existing file" -> drag in everything from this folder -> Commit changes
    (do this from a computer so the tests folder uploads intact)
 3. Settings -> Pages -> Deploy from a branch -> main, / (root) -> Save
 4. Live in a minute or two at https://charge-the-line.github.io/bleed-control/

Releasing an update: change APP_VERSION in index.html AND the CACHE name in sw.js together.
