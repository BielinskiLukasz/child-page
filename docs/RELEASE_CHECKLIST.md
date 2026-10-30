# Release checklist

Manual test checklist and release steps for *Spokojny Świat Artura*. Copy this file's tables into the release pull request or an issue and fill in the result per device. Record **Pass**, **Fail** or **n/a** and notes (device, OS and browser version, date, tester).

**Release:** v____  **Tester:** ____  **Date:** ____

## Manual tests per device

Run the same list on each of: **Chrome desktop**, **Chrome Android**, **Safari iPhone/iPad**.

| # | Check | Chrome desktop | Chrome Android | Safari iPhone/iPad | Notes |
|---|---|---|---|---|---|
| 1 | Install as PWA (Add to Home Screen / install) | Pass / Fail | Pass / Fail | Pass / Fail | |
| 2 | Open from the home icon (standalone, no browser bar) | Pass / Fail | Pass / Fail | Pass / Fail | |
| 3 | Airplane mode: launch the menu offline | Pass / Fail | Pass / Fail | Pass / Fail | |
| 4 | Airplane mode: open at least five different activities | Pass / Fail | Pass / Fail | Pass / Fail | |
| 5 | Portrait and landscape rotation in the menu and in at least three activities (state kept, nothing cut off) | Pass / Fail | Pass / Fail | Pass / Fail | |
| 6 | Parent gate: wrong sum is refused, right sum opens Settings | Pass / Fail | Pass / Fail | Pass / Fail | |
| 7 | Settings: hide and show activities | Pass / Fail | Pass / Fail | Pass / Fail | |
| 8 | Settings: reorder activities; "Przywróć domyślne" | Pass / Fail | Pass / Fail | Pass / Fail | |
| 9 | Settings: favourites ("Ulubione" section in the menu) | Pass / Fail | Pass / Fail | Pass / Fail | |
| 10 | Settings: daily time limit and timer reset | Pass / Fail | Pass / Fail | Pass / Fail | |
| 11 | Settings: statistics view, export (download or copy) and reset | Pass / Fail | Pass / Fail | Pass / Fail | |
| 12 | Settings: "Wersja" line shows the released version; menu and activities show no version | Pass / Fail | Pass / Fail | Pass / Fail | |
| 13 | Time-up screen appears when the limit is reached and the menu stays reachable after reset | Pass / Fail | Pass / Fail | Pass / Fail | |
| 14 | Reduced motion (OS setting on): activities still reach their end states, nothing flickers | Pass / Fail | Pass / Fail | Pass / Fail | |

## Release steps

- [ ] All open pull requests intended for the release are merged.
- [ ] CI is green on `main` (checks and Pages deploy).
- [ ] The manual test table above is filled in and signed off (no unresolved Fail).
- [ ] `js/version.js` and the `CHANGELOG.md` heading match the release version; the README version line is updated.
- [ ] The `CHANGELOG.md` date `YYYY-MM-DD` is replaced with the release date and the entry is moved out of "Unreleased" if needed.
- [ ] Tag `v1.0.0` is created on the release commit and pushed.
- [ ] A GitHub Release for `v1.0.0` is published with the notes copied from the changelog entry.
- [ ] The live site (<https://bielinskilukasz.github.io/child-page/>) opens and shows the new version in Settings.

Later releases follow the same steps with a new version number; update `CHANGELOG.md` and `js/version.js` every time.
