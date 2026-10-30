# ADR 0001: Lazy-load activity scripts from the registry

- Status: Proposed
- Date: 2026-10-30

## Context

`index.html` loads every activity as its own `<script>` (about 80 tags, about 1.2 MB of JavaScript in total) before `js/app.js`. Each `js/<name>.js` overrides `mount` on its entry in `window.ACTIVITIES`.

- Every launch downloads (or revalidates) and parses all activities, although a child opens one at a time. Each new activity adds roughly 15-25 KB of parse cost, so startup cost grows linearly with the activity count.
- The same activity is listed in three places: `js/activities.js`, a script tag in `index.html`, and the docs rows that `tools/check.py` keeps in sync.
- `sw.js` derives its precache list by scanning `index.html`, so `index.html` is the de-facto asset manifest.
- A script that throws while loading, or a load-order mistake, can break the whole app and not only its own activity.
- `sw.js` swallows per-file fetch failures during install (`.catch(function () {})`), so a flaky first install can leave a partly cached app that fails offline.

Constraints that stay: no build step, plain scripts, no network use beyond fetching the app's own files, network-first service worker, offline use after first load.

## Options

| Option | Pros | Cons |
|---|---|---|
| **A. Lazy-load per activity.** Each `activities.js` entry gains `src: 'js/<name>.js'`; `app.js` injects the script on first open, then calls `mount`. | Smallest change, no tooling, fixes startup cost and load-order coupling, keeps the plug-in contract. | Short first-open delay online; the service worker must precache from the registry. |
| B. ES modules with a generated manifest. | Cleanest isolation. | Needs a build or generator and a rewrite of about 70 files; against the no-build-step approach. |
| C. Keep eager loading. | No work. | Cost keeps growing with every activity. |

## Decision

Adopt **option A**.

1. `js/activities.js` becomes the single registry: every entry has `src` (the activity script) and optionally `deps` (shared scripts such as `js/dogs.js`, `js/random.js`, `js/literki-data.js`, `js/puzzle-pictures.js`) that load before it.
2. `app.js` loads `deps` then `src` on first open (each URL at most once, concurrent opens share one promise), then calls `mount` on the activity entry the script has overridden. While loading it shows a plain, calm placeholder; a failed load shows a friendly message and leaves Back working. Unmount must still run for an activity whose load did not finish.
3. `index.html` keeps only the core scripts (`analytics`, `menu-config`, `playtime`, `stats-ui`, `settings-io`, `version`, `activities`, `app`).
4. `sw.js` precaches the core scripts found in `index.html` **plus every `src`/`deps` URL listed in `js/activities.js`**, so offline behaviour is unchanged. Install fails (and is retried by the browser) if a precached file cannot be fetched, instead of silently caching a partial app.
5. `tools/check.py` is updated: every activity has an existing `src`, no `js/*.js` file is orphaned, `app.js` stays last among the core tags, and the existing id, docs, count and prefix rules keep working.

## Consequences

- Startup parses only the core, and its cost no longer grows with the activity count.
- Adding an activity touches `activities.js`, its own JS file, CSS and docs; `index.html` is no longer edited, which removes a frequent merge-conflict file.
- Activity scripts must not depend on the load order of other activity scripts; shared code goes in `deps`.
- Activities that read `window.ACTIVITIES` entries of others (if any) need review during migration.
- The change is behaviour-preserving for users and can be rolled out in steps (see below).

## Rollout

1. Foundation: loader in `app.js`, registry `src`/`deps`, service worker and `check.py` changes, with a small number of activities migrated.
2. Migrate the remaining activities in batches of mechanical changes (move the script tag into the entry).
3. Remove the activity script tags from `index.html` once all are migrated.
4. Manual check on the release checklist: first open online, open offline after install, Back during loading, reduced motion.

## Out of scope

Splitting `css/style.css` per activity, and ES modules (revisit only if a build step is ever accepted).
