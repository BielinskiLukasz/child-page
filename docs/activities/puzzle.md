# Puzzle

## 1. Overview

| Item | Value |
|---|---|
| Display name | Puzzle |
| Internal ID | `puzzle` (entry in [`js/activities.js`](../../js/activities.js)) |
| Description | A simple picture is cut into big pieces that wait in a tray next to or below a dashed outline. The child drags each piece to its place; the grid grows from 2x2 up to 4x4 as pictures are finished. |
| Category | Matching / spatial (jigsaw) |
| Interaction type | Drag (pointer events); keyboard alternative (select a piece, then activate a place) |
| Status | Implemented; enabled by default in the menu |
| Source | [`js/puzzle.js`](../../js/puzzle.js), pictures in [`js/puzzle-pictures.js`](../../js/puzzle-pictures.js), CSS block `/* Puzzle */` in [`css/style.css`](../../css/style.css) (prefix `pz`) |

## 2. Business purpose

The only activity with graded difficulty: it starts with four large pieces and, after every five finished pictures, adds more pieces. It provides a goal-directed task (complete a picture) while keeping the "no wrong answers" model of the other drag activities: a piece released away from its place simply drifts back. The 25 different pictures keep replay interesting. It complements [Koraliki](koraliki.md) and the sorting activities with a task where every piece has exactly one correct position.

## 3. Activity flow

1. The child opens the activity (`#puzzle`); the first picture of a shuffled order is shown with a 2x2 grid.
2. A dashed outline frame is shown; the pieces wait in a tray below it (portrait) or beside it (landscape), in random places.
3. The child drags a piece. Released within half a piece size of its own place, it glides in and stays (no longer draggable); otherwise it drifts back to the tray.
4. When all pieces are placed (and idle) the finished picture glows for 3 s.
5. After 7 s in total the picture cross-fades out (0.7 s), the next picture with the next grid size is built, and it fades in (0.7 s).
6. After five finished pictures the grid grows (see section 11). The cycle continues indefinitely.
7. Rotating the device only re-lays-out the current puzzle: pieces keep their state and the grid shape (tall or wide) is not changed.
8. The child leaves with the Back button (see [README.md](README.md#shared-platform-behaviour)); progress is lost.

## 4. Rules and behavior

| Rule | Value (from `js/puzzle.js`) |
|---|---|
| Grids | `[2,2]`, `[2,3]`, `[3,3]`, `[3,4]`, `[4,4]` as [short side, long side]; the long side follows the long axis of the screen |
| Pieces per picture | 4, 6, 9, 12, 16 |
| Grid advance | `PER_GRID = 5` finished pictures per step; 4x4 stays after that |
| Snap rule | Piece centre within `0.5 * P` of its own place centre (`Math.hypot`), where `P` is the piece size |
| Wrong drop | Piece glides back to its tray cell |
| Piece size `P` | Largest value from `MAX_P = 170` down to `MIN_P = 56` px at which frame and tray fit |
| Glide duration | `min(1500, 700 + distance * 0.8)` ms; 300 ms with reduced motion; 200 ms for re-layout glides |
| Glow / next | `GLOW_S = 3000` ms glow; `NEXT_S = 7000` ms until fade-out begins; `FADE_S = 700` ms each way |
| Tray gap | `GAP = 14` px between frame and tray |
| Input during fades | `down()` and `onSlot()` ignore input while a fade is running |
| Sound | None ([shared behaviour](README.md#shared-platform-behaviour)) |

- Pieces show a unit square of a centred crop of the 200x200 picture, so non-square grids show part of the picture. Only the outer corners of the whole picture are rounded (20 px) so that placed pieces look connected.
- Keyboard: Enter or Space (a `click` with `detail === 0`) on a piece selects it (`aria-pressed`, outline); activating a place ("Miejsce N" buttons) places it if correct, otherwise sends it back. Placed pieces are disabled and leave the tab order.

## 5. Educational and developmental benefits

**Intended design benefits** (design intent, not measured):
- Visual perception and spatial reasoning (finding where a piece belongs).
- Hand-eye coordination through dragging.
- Gradual challenge through the growing grid.

**Directly observable behavior:**
- A piece is accepted only at its own position.
- The finished picture glows and then changes to a different picture.
- The number of pieces rises after every five pictures, up to 16.
- No scores, timers or error messages.

**Requires professional or research-based validation:** any claim about spatial or cognitive development, and the suitability of the grid steps for a given age.

## 6. Accessibility and usability

- **Input:** pointer events (touch, mouse, stylus) with pointer capture and `touch-action: none`; keyboard alternative as above with a 4 px inset outline (`#8f7fd1`).
- **Screen readers:** places are labelled "Miejsce N" and pieces "Kawałek obrazka N (Enter lub spacja, potem wybierz miejsce)"; the picture content itself is not described (SVG `aria-hidden`).
- **Target size:** pieces are 56 to 170 px; when even 56 px does not fit, tray cells overlap slightly.
- **Orientation:** portrait places the tray below the frame, landscape beside it. A non-square grid is drawn tall (for example 2 columns x 3 rows) or wide (3 x 2) at random for each puzzle, whatever the screen orientation; rotating the device keeps the grid of the current puzzle.
- **Colour:** pictures are colourful but a piece's correct place is found by image content, not colour alone.
- **Reduced motion:** glides, fades and glow are driven by a `requestAnimationFrame` loop with inline styles, so they still run under the global CSS rule; glides shorten to 300 ms.
- **Reading:** none required. Whether a young child can solve 3x4 or 4x4 independently is not documented.
- **Limitations:** a 4x4 puzzle on a small phone uses pieces near 56 px; screen readers cannot tell which place a piece belongs to.

## 7. Risks and limitations

- Difficulty can rise to 16 pieces; there is no way to lower it again except leaving and reopening (which restarts at 2x2).
- Rotating the device mid-puzzle no longer restarts the picture (fixed on `main` via issue [#167](https://github.com/BielinskiLukasz/child-page/issues/167) / PR [#173](https://github.com/BielinskiLukasz/child-page/pull/173)): the grid keeps its shape and only the layout is recomputed.
- Pictures are simple drawings that may be hard to recognise when cut into 16 pieces (requires verification).
- No privacy concerns; nothing stored or sent.

## 8. Configuration

No external configuration; constants are inside [`js/puzzle.js`](../../js/puzzle.js) and the pictures in [`js/puzzle-pictures.js`](../../js/puzzle-pictures.js).

| Name | Purpose | Type | Default | Location |
|---|---|---|---|---|
| `GRIDS` | Grid sizes by stage ([short, long]) | array | 5 entries | `js/puzzle.js` |
| `PER_GRID` | Pictures per grid stage | number | 5 | `js/puzzle.js` |
| `MIN_P`, `MAX_P` | Piece size range | px | 56, 170 | `js/puzzle.js` |
| `GAP` | Space between frame and tray | px | 14 | `js/puzzle.js` |
| `GLOW_S`, `NEXT_S`, `FADE_S` | Glow, time to next picture, fade | ms | 3000, 7000, 700 | `js/puzzle.js` |
| `window.PuzzlePictures` | Array of 25 SVG inner-markup strings on a 200x200 canvas | array | 25 entries | `js/puzzle-pictures.js` |

If `window.PuzzlePictures` is missing, `PICTURES` falls back to an empty array; the activity then has no picture to show (not handled further, see section 16).

## 9. Assets

- [`js/puzzle-pictures.js`](../../js/puzzle-pictures.js): 25 simple hand-drawn SVG scenes on a 200x200 canvas (house, fish, flower, apple, balloons, smiling sun, cat, rabbit, bear, duck, ladybug, butterfly, snail, car, sailboat, tree, ice cream, cupcake, rocket, umbrella, kite, snowman, turtle, mushroom, owl). Subjects sit around the centre (about 36 to 164) because non-square grids show a centred crop. It must be loaded before `js/puzzle.js` (it is, in [`index.html`](../../index.html)). Licence/source: Not currently documented (drawn in the repository).
- Background: CSS gradient (`#f6f0fb` to `#e3f1ea`); outline frame: CSS dashed border (`#b9b3e0`) on a translucent white fill.
- No raster images, fonts or audio. The menu icon is inline SVG in `js/activities.js`.

## 10. Randomization and variants

| What | How | Pool |
|---|---|---|
| Picture order | `makeOrder`: `Rand.shuffle` of the 25 picture indices; when all are used a new shuffle is made and, if its first picture equals the last one shown, the first and last entries are swapped | 25 pictures |
| Tray positions of pieces | `Rand.shuffle` of the cell indices at every `build()` | `N!` for `N` pieces |

- No picture repeats until all 25 have been shown; none repeats across the cycle boundary.
- The order and progress live only in the mounted activity: reopening restarts with a fresh shuffle and the 2x2 grid. Nothing is stored.
- With an empty picture list `makeOrder` returns an empty array (see section 16).

## 11. Progression and difficulty

| Finished pictures (`done`) | Grid [short x long] | Pieces |
|---|---|---|
| 0-4 | 2 x 2 | 4 |
| 5-9 | 2 x 3 | 6 |
| 10-14 | 3 x 3 | 9 |
| 15-19 | 3 x 4 | 12 |
| 20 and more | 4 x 4 | 16 |

- Trigger: every completed picture increments `done`; the stage is `floor(done / 5)` capped at the last entry.
- Maximum: 4x4, which stays indefinitely.
- Reset: every launch starts at 2x2. Persistence: none.

## 12. Completion and feedback

- Completion: all pieces placed and idle.
- Feedback: a soft yellow drop-shadow glow (`#ffe08a`) on the placed pieces for 3 s, then a cross-fade to the next picture.
- Failure: none; a missed drop returns the piece. No sound.
- The next picture starts automatically (7 s after completion).

## 13. Analytics and metrics

This activity reports to the shared on-device module `js/analytics.js` (`window.Analytics`). `js/app.js` records the activity start and end and the module counts touches inside the stage; `js/puzzle.js` calls `levelStart(N)` when a picture is built (N = number of pieces) and `levelComplete(N)` plus `complete(N)` when all pieces are placed. Recorded: starts, active time, replays, quick exits, touches, completions (a completion is a finished picture), exits before completion and the highest piece count reached. Data stays on the device as anonymous daily aggregates; see [README.md](README.md#analytics-status).

## 14. Technical implementation

- **Entry point:** `mount(container)` in [`js/puzzle.js`](../../js/puzzle.js), replacing `mount` of the `puzzle` registry entry; returns `cleanup`.
- **Rendering:** DOM: `div.pz > div.pz-field > div.pz-frame` plus, per round, `N` `button.pz-slot` (invisible targets, used for keyboard) and `N` `button.pz-piece` each containing an SVG whose `viewBox` selects its square of the picture (`pieceSvg`). Elements are moved with `transform: translate()`.
- **State:** `order`, `oi`, `pic` (picture), `done` (finished count), `cw`/`ch`/`N` (grid), `flipGrid` (random tall/wide choice per puzzle), `portrait`, `P`, `fx`/`fy` (frame origin), per piece `{ i, cell, x, y, hx/hy (tray), tx/ty (place), mode, placed }`, `doneActive`, `doneT`, `glow`, `fade`/`fadeDir`.
- **Layout:** `build()` creates slots and pieces for the current picture and grid; `fit()` searches the largest `P` where frame and tray fit; `layout()` positions everything.
- **Events:** `pointerdown/move/up/cancel`, `lostpointercapture` per piece; `click` on pieces (keyboard) and slots; `resize`, `orientationchange` (both only re-layout), `visibilitychange`.
- **Animation:** one loop `frame_()` (dt capped at 50 ms), smoothstep glides; stops when idle; paused while hidden.
- **Dependencies:** `window.PuzzlePictures`, [`js/random.js`](../../js/random.js) (`Rand.shuffle`). **Persistence:** none. **Analytics:** `Analytics.levelStart` / `levelComplete` / `complete`.
- **Cleanup:** cancels the frame, removes the three listeners and the board.

## 15. Responsive layout and coordinate system

- `.pz` is fixed full-screen; `.pz-field` is inset by the safe-area variables plus 64 px at the top and 12 px elsewhere. All coordinates are CSS pixels relative to the field.
- The frame is `cw * P` by `ch * P`; slot `i` sits at column `i % cw`, row `floor(i / cw)`; the piece's target centre is `(fx + (col + 0.5) * P, fy + (row + 0.5) * P)`. Tray cells are in a grid of `tc` columns by `tr` rows; if the tray does not fit its cells overlap by a smaller step (`sx`, `sy`).
- Portrait: tray below the frame (falls back to beside); landscape: tray beside (falls back to below). The frame and tray are centred as one group.
- Picture coordinates: pieces use `viewBox` of the 200x200 picture with `preserveAspectRatio="none"`; for non-square grids the crop is `200` by `200 * short / long` (centred), so each cell shows a unit square of the crop.
- Grid shape: `GRIDS` holds `[short, long]` sizes; `build()` sets `tall = portrait !== flipGrid` (`flipGrid` is re-drawn at random, 50 %, for every new picture) and uses `cols = short, rows = long` when tall, the reverse when wide. Orientation change only runs `layout()`; there is no round restart any more.
- If nothing fits at 56 px the tray cells overlap; the layout then continues to render, but pieces could be harder to separate (requires verification on small screens).

## 16. Error and edge-case handling

| Case | Handling |
|---|---|
| Missing pictures file | `PICTURES` is `[]`; `pieceSvg` would use an undefined picture (no guard; requires verification) |
| Resize / rotation | Re-layout only (grid shape kept); active drag cancelled and piece sent home |
| Backgrounding | Loop paused while hidden; completion timers advance only while visible |
| Multi-touch | Each piece tracks its own pointer; a second pointer on the same piece is ignored |
| Pointer cancel / lost capture | Treated as release |
| Dragging outside the screen | Centre clamped to the visible window |
| Input during fade between pictures | Ignored |
| Right mouse button | Ignored |
| Not enough room | Pieces shrink to 56 px, then tray cells overlap |
| Leaving mid-animation | `cleanup` cancels the frame; progress lost |

## 17. Testing

No automated tests exist ([README.md](README.md#shared-platform-behaviour)). PR [#77](https://github.com/BielinskiLukasz/child-page/pull/77) reports `node --check` and a stub-DOM run of the keyboard flow (4 rounds through all 3 original pictures and the wrap-around); PR [#147](https://github.com/BielinskiLukasz/child-page/pull/147) reports a Node stub-DOM run of 27 rounds solved via keyboard (piece counts per stage, all first 25 pictures distinct, no repeat at the reshuffle boundary, tray pieces inside the field at six viewport sizes), XML parsing of all 25 SVGs and `node --check`, and states that nothing was verified visually. The scripts are not in the repository. Manual checklist (not yet performed):

- [ ] Normal: drag a piece near its place; it glides in and stays.
- [ ] Incorrect interaction: release a piece far from its place and on another place; it drifts back.
- [ ] Completion: finish a 2x2 picture; the glow lasts about 3 s and the next picture cross-fades in after about 7 s.
- [ ] Restart: leave and reopen; the grid is back at 2x2 and the picture order is new.
- [ ] Randomization: tray order differs between pictures; no picture repeats within 25 pictures.
- [ ] Progression: after 5 pictures the grid is 2x3, after 10 3x3, after 15 3x4, after 20 4x4 and stays.
- [ ] Portrait (about 360x640): tray below, 4x4 pieces at least 56 px and not overlapping.
- [ ] Landscape (about 640x360): tray beside; frame and tray fully visible.
- [ ] Rotate the device mid-puzzle on a 2x3 or 3x4 grid; the picture and placed pieces stay, the layout adapts and nothing is stuck.
- [ ] Touch: two fingers dragging two pieces; mouse: left-button drag.
- [ ] Keyboard: Tab to a piece, Enter selects, Enter on "Miejsce N" places it.
- [ ] Reduced motion on: glides short, fades and glow still shown.
- [ ] Background the tab during the glow and return.
- [ ] Browsers: Chrome desktop, Chrome Android, Safari iPhone/iPad.
- [ ] Review all 25 pictures at 2x2 and 4x4 for recognisability.

## 18. Known limitations and open issues

**Confirmed (from code reading):**
- No automated tests.
- No way to choose or lower the difficulty during a visit; progress is lost when leaving.
- No guard for a missing `window.PuzzlePictures`.
- Picture licence/source is not documented.

**Requires verification:**
- Recognisability of the pictures when cut into 12 or 16 pieces.
- Tray overlap behaviour on very small screens.

No open GitHub issue concerns this activity.

## 19. Planned improvements

None currently planned (no open issue).

## 20. Related activities and reusable components

- Other drag-to-target activities: [Koraliki](koraliki.md), [Duże i Małe](duze-i-male.md), [Kolorowe Kubeczki](kolorowe-kubeczki.md), [Wieża z Klocków](wieza-z-klockow.md).
- Shared helper used: [`js/random.js`](../../js/random.js) (`Rand.shuffle`). [`js/animals.js`](../../js/animals.js) is **not** used.
- Data module: [`js/puzzle-pictures.js`](../../js/puzzle-pictures.js).

## 21. Change history

- [#51](https://github.com/BielinskiLukasz/child-page/issues/51) / [PR #77](https://github.com/BielinskiLukasz/child-page/pull/77): activity introduced (3 pictures, 2x2).
- [#122](https://github.com/BielinskiLukasz/child-page/issues/122) / [PR #147](https://github.com/BielinskiLukasz/child-page/pull/147): 25 pictures in random order and a progressive grid from 2x2 to 4x4.
- [#167](https://github.com/BielinskiLukasz/child-page/issues/167) / [PR #173](https://github.com/BielinskiLukasz/child-page/pull/173): non-square grids are drawn tall or wide at random per puzzle; rotating the device no longer restarts the picture.
