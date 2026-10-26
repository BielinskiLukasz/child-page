# Myjnia

## 1. Overview

| Item | Value |
|---|---|
| Display name | Myjnia |
| Internal ID | `myjnia` (entry in [`js/activities.js`](../../js/activities.js)) |
| Description | A muddy vehicle or animal stands in a car wash with soft foam clouds. Dragging a finger over it scrubs the mud away and releases soap bubbles; when it is clean it glows softly and a new muddy one fades in. |
| Category | Cause and effect / open-ended play (scrubbing) |
| Interaction type | Drag / scrub (pointer events); keyboard alternative (arrow keys move a brush, Enter or Space scrubs along a zig-zag) |
| Status | Implemented; enabled by default in the menu |
| Source | [`js/myjnia.js`](../../js/myjnia.js), CSS block `/* Myjnia */` in [`css/style.css`](../../css/style.css) (prefix `mj`) |

## 2. Business purpose

A scrubbing game with an immediate, visible effect: the child's gesture removes mud and produces bubbles, and the clean drawing underneath appears. It has no targets or rules to learn, so it suits the youngest users, and the soft bubbles and glow give a calm reward. The variety of six vehicles, six colours and six animals (in a repeating pattern of two vehicles and one animal) keeps replay interesting. The animals are drawn in the activity's own style; the dog appears more often than the others. A related animal-only washing activity is [Kąpiel Zwierzątek](kapiel-zwierzatek.md).

## 3. Activity flow

1. The child opens the activity (`#myjnia`); the first item (always a vehicle) is built and shown covered with mud.
2. The item stands in a 5:3 box in the middle of the screen on a light-blue background with three foam clouds.
3. The child drags a finger (or mouse) over the item. Mud is erased along the whole path, and soap bubbles rise from the touch point.
4. When about 90% of the mud is gone, the remaining mud fades (1.2 s) and the item glows softly for 3 s; six extra bubbles float up.
5. At 7 s after reaching 90% the item fades out (0.7 s), a new muddy item is built and fades in (0.7 s).
6. The sequence continues indefinitely: vehicle, vehicle, animal, vehicle, vehicle, animal, ...
7. The child leaves with the Back button (see [README.md](README.md#shared-platform-behaviour)).

## 4. Rules and behavior

| Rule | Value (from `js/myjnia.js`) |
|---|---|
| Item sequence | Item `n` (0-based) is an animal when `n % 3 === 2`, otherwise a vehicle: V V A V V A ... |
| Vehicles | 6 types (samochód, autobus, ciężarówka, furgonetka, traktor, kamper) x 6 body colours |
| Animals | 6 (słoń, świnka, krowa, hipopotam, piesek, owieczka), each with its own colours |
| Mud mask | Canvas with logical size `LW x LH = 480 x 288` (5:3), mud drawn on the item's silhouette in `#b99a7a` with 46 random darker/lighter blotches |
| Brush | Round-cap stroke, at least 44 CSS px wide (`brushLogical = max(44, 0.11 * boxW)` converted to logical units) |
| Completion threshold | `DONE_AT = 0.9`: remaining mud at most 10% of the starting mud, measured every 0.12 s while the mask has changed |
| Mud fade | `FADE_MUD_S = 1.2` s (immediate with reduced motion) |
| Glow | `GLOW_S = 3` s, with 0.5 s ease in and out |
| Next item | `NEXT_AT_S = 7` s after completion, with `SWAP_S = 0.7` s fade out and 0.7 s fade in |
| Bubbles | Pool of `MAX_BUBBLES = 28`; at most one spawn every `SPAWN_GAP_S = 0.09` s while scrubbing; life `BUBBLE_S = 1.8` s; radius 2-4.5% of the box width; rise 18% of the box height; fade out |
| Input | `pointerdown`/`move` erase in phases `play` and `done`; ignored while swapping |
| Failure | None; mud never returns while the item is on screen |
| Sound | None ([shared behaviour](README.md#shared-platform-behaviour)) |

- Keyboard: the box is focusable (`tabindex="0"`, `role="application"`, label such as "Brudny pojazd: autobus. Strzałki przesuwają szczotkę, Enter lub spacja szoruje dalej."). Arrow keys move the brush by 0.07 of the box (limits 0.04-0.96 horizontally, 0.06-0.94 vertically) and scrub; Enter/Space moves it one step along a zig-zag, going down 0.12 at each edge and wrapping to the top. A ring shows the brush position while the box has focus.
- Several pointers can scrub at the same time (each has its own stroke state).

## 5. Educational and developmental benefits

**Intended design benefits** (design intent, not measured):
- Cause and effect (a gesture changes the picture).
- Gross and fine motor coordination through scrubbing.
- Recognition of vehicles and animals.

**Directly observable behavior:**
- Mud disappears exactly where the finger passes and stays gone.
- Bubbles appear while scrubbing; a clean item glows and is replaced by a new one.
- No scores, timers or error messages.

**Requires professional or research-based validation:** any claim about motor development or learning.

## 6. Accessibility and usability

- **Input:** pointer events (touch, mouse, stylus) with pointer capture on the box and `touch-action: none`; keyboard alternative as above with a 4 px focus ring (`#8f7fd1`).
- **Screen readers:** the box has a Polish `aria-label` naming the current item (vehicle or animal); progress and completion are not announced.
- **Target size:** the whole box is the interaction area (width `max(120, min(0.96 * field width, 0.9 * field height * 5/3, 680))` px); the brush is at least 44 px wide.
- **Orientation:** the box scales with the field in both orientations; the canvas is in logical coordinates, so cleaned areas are kept on resize or rotation.
- **Colour:** mud and drawings are decorative; nothing depends on colour.
- **Reduced motion:** the mud fade, glow, bubbles and item swap are driven by a `requestAnimationFrame` loop with inline styles, so they still run under the global CSS rule; with `prefers-reduced-motion` the mud disappears immediately (no 1.2 s fade). The brush is not slowed.
- **Reading:** none required.
- **Limitations:** the glow and the bubbles carry no non-visual cue; there is no sound.

## 7. Risks and limitations

- The canvas coverage measure (`getImageData` on a 48x29 downscale) and the 90% threshold depend on real canvas behaviour; PR [#82](https://github.com/BielinskiLukasz/child-page/pull/82) says they were not checked in a real browser.
- Very small leftover mud patches are ignored once 90% is reached (by design).
- Bubble spawning is limited to 28 simultaneous bubbles and every 90 ms, so continuous scrubbing is bounded in cost.
- Mud blotches are re-randomised for each item, so appearance varies (not a risk).
- No privacy concerns; nothing stored or sent.

## 8. Configuration

No external configuration; constants are inside [`js/myjnia.js`](../../js/myjnia.js).

| Name | Purpose | Type | Default | Location |
|---|---|---|---|---|
| `LW`, `LH` | Logical size of the mud mask | px | 480, 288 | top of IIFE |
| `VB` | Width of the vehicle drawing viewBox (200 x 120) | number | 200 | top of IIFE |
| `MAX_BUBBLES`, `BUBBLE_S`, `SPAWN_GAP_S` | Bubble pool size, life, spawn spacing | number, s, s | 28, 1.8, 0.09 | top of IIFE |
| `DONE_AT` | Fraction of mud removed to finish | number | 0.9 | top of IIFE |
| `FADE_MUD_S`, `GLOW_S`, `NEXT_AT_S`, `SWAP_S` | Mud fade, glow, time to next item, swap fade (s) | numbers | 1.2, 3, 7, 0.7 | top of IIFE |
| `DOG_WEIGHT` | Selection weight of the dog (others are 1) | number | 3 | before `pickAnimal` |
| `COLOURS` | 6 vehicle body colours | array | 6 entries | top of IIFE |
| `VEHICLES`, `ANIMALS` | Drawings as arrays of `{ d (path), fill }` | arrays | 6 + 6 entries | top of IIFE |

No fallback for invalid values because nothing is read from outside.

## 9. Assets

No external files. All vehicles and animals are inline SVG path data (`VEHICLES`, `ANIMALS`), used both for the clean SVG layer (`svgFor`) and, via `Path2D`, for the mud silhouette drawn on the canvas. Foam clouds and the background are CSS (radial gradient, linear gradient `#d8ecfb` to `#cfe3ee`). The menu icon is inline SVG in `js/activities.js`. This activity does **not** use the shared animal drawings of [`js/animals.js`](../../js/animals.js). No fonts, images or audio.

## 10. Randomization and variants

| What | How | Pool |
|---|---|---|
| Vehicle type | `Rand.pickOne(VEHICLES, 'myjnia-vehicle')`: never the same as the previous vehicle | 6 |
| Vehicle colour | `Rand.pickOne(COLOURS, 'myjnia-colour')`: never the same as the previous colour | 6 |
| Animal | `pickAnimal()`: weighted choice, dog weight 3 and others 1, excluding the animal shown previously | 6 |
| Mud blotches | `Math.random` positions and shades, 46 blotches per item | - |

- The no-repeat memory (`Rand`'s last pick, and `lastAnimal`) lives for the page session, so it also applies across re-opening the activity; it is reset by a page reload.
- Because the dog is excluded right after it appears, its long-run share is about 30% (about 2.1 times each other animal) rather than a flat 3/8, as PR [#165](https://github.com/BielinskiLukasz/child-page/pull/165) notes; the dog never appears twice in a row.
- The V V A pattern is fixed (animals every third item); only the contents vary. Nothing is stored.
- Pools are fixed arrays, so empty pools cannot occur.

## 11. Progression and difficulty

None. The only recurring structure is the V V A pattern; nothing becomes harder, and nothing persists between sessions.

## 12. Completion and feedback

- Completion: at least 90% of the mud removed.
- Feedback: remaining mud fades, the item glows softly (yellow drop-shadow `#ffe08a`) for 3 s and six extra bubbles float up.
- After 7 s the next item replaces it automatically.
- Failure: none. No sound.

## 13. Analytics and metrics

This activity reports to the shared on-device module `js/analytics.js` (`window.Analytics`) through the app shell only: `js/app.js` records the activity start and end, and the module counts touches inside the stage. The activity file itself calls no `Analytics` function. Recorded for it: starts, active time, replays (re-opening in the same session), quick exits (within 10 s) and touches. It is open-ended, so no completion, level or exit-before-completion is defined for it. Data stays on the device as anonymous daily aggregates; see [README.md](README.md#analytics-status).

## 14. Technical implementation

- **Entry point:** `mount(container)` in [`js/myjnia.js`](../../js/myjnia.js), replacing `mount` of the `myjnia` registry entry; returns `cleanup`.
- **Rendering:** DOM: `div.mj > div.mj-field` with three `div.mj-foam` clouds and `div.mj-box` containing `div.mj-clean` (the clean SVG), `canvas.mj-mud` (480 x 288), `div.mj-brush` (keyboard ring) and `div.mj-bubbles` (28 pooled `div.mj-bub`).
- **Mud mask:** `drawMud()` fills the item's paths in `#b99a7a` on the canvas, adds blotches with `source-atop`, and records `baseline` (sum of alpha on a 48 x 29 downscale). `erase()` strokes with `destination-out`. `remaining()` re-measures the downscale.
- **State:** `item` (label, shapes, `animal`), `seq` (item counter), `phase` (`play`, `done`, `swap`), `phaseT`, `mudOp`, `glow`, `boxOp`, `swapDir`, `pointers` (last point per pointer), `kx`/`ky`/`kdir` (keyboard brush), `bubbles`.
- **Events:** `pointerdown/move/up/cancel`, `lostpointercapture`, `keydown`, `focus`, `blur` on the box; `resize`, `orientationchange`, `visibilitychange`.
- **Animation:** one `frame()` loop (dt capped at 0.05 s) that stops when idle; paused while hidden. The coverage check runs every 0.12 s only when the mask changed.
- **Randomization:** `Rand.pickOne` and the local weighted `pickAnimal()`.
- **Dependencies:** [`js/random.js`](../../js/random.js). **Persistence:** none. **Analytics:** none from the activity itself (reported by `js/app.js`).
- **Cleanup:** cancels the frame and removes the window/document listeners and the board.

## 15. Responsive layout and coordinate system

- `.mj` is fixed full-screen; `.mj-field` is a flex container inset by the safe-area variables plus 64 px at the top and 12 px elsewhere; the box is centred.
- The box is 5:3: width `max(120, min(0.96 * fw, 0.9 * fh * 5/3, 680))`, height `0.6 * width`.
- Coordinates: the mud canvas has fixed logical size 480 x 288 and is stretched to the box by CSS; pointer positions are converted with `toLogical()` (client coordinates relative to the box, scaled to 480 x 288). The vehicle and animal drawings use a 200 x 120 viewBox and are drawn onto the canvas with scale `480 / 200`, so the clean SVG layer and the mud silhouette share one coordinate space. Bubbles and the keyboard brush use percentages of the box.
- Resize or rotation only changes the box size and the brush width; the canvas contents are kept, so cleaned areas stay in place.

## 16. Error and edge-case handling

| Case | Handling |
|---|---|
| Missing assets | N/A (inline SVG); `Rand` is required and not guarded |
| Resize / rotation | `layout()`; canvas unaffected (logical coordinates) |
| Backgrounding | Loop paused while hidden; timers advance only while visible |
| Multi-touch | One stroke per pointer id (`pointers`) |
| Pointer cancel / lost capture | Stroke ended (`up`) |
| Fast drags | Continuous round-cap stroke from the previous point, so no gaps |
| Input while swapping | `down` and `move` ignored; `pointers` is cleared when the swap begins; keyboard moves the brush but does not erase |
| Canvas read-back unavailable | Not handled (`getImageData` is assumed to work; requires verification) |
| Leaving mid-animation | `cleanup` cancels the frame |

## 17. Testing

No automated tests exist ([README.md](README.md#shared-platform-behaviour)). PR [#82](https://github.com/BielinskiLukasz/child-page/pull/82) reports `node --check` and a stub-DOM/stub-canvas run (multi-point drag, keyboard zig-zag, done phase, swap and return to play) and states that real canvas pixels were not verified; PR [#150](https://github.com/BielinskiLukasz/child-page/pull/150) reports a node harness checking the V V A pattern over 60 items, 18 distinct labels/colours over 300 picks and that all generated SVGs parse as XML; PR [#165](https://github.com/BielinskiLukasz/child-page/pull/165) reports 60,000 simulated picks with no consecutive dogs and all animals appearing. These scripts are not in the repository. Manual checklist (not yet performed):

- [ ] Normal: drag a finger over the first item; mud disappears where touched, bubbles rise, and the clean drawing shows.
- [ ] Fast drags leave no gaps; two fingers scrub at once.
- [ ] Completion: scrub until about 90% clean; the rest of the mud fades, the item glows for about 3 s, and after about 7 s a new muddy item fades in.
- [ ] Sequence: items follow vehicle, vehicle, animal, vehicle, vehicle, animal; vehicle types and colours do not repeat consecutively.
- [ ] Randomization: over many animals the dog appears most often (about 30%) and never twice in a row.
- [ ] Restart: leave and reopen; the sequence starts again with a vehicle.
- [ ] Progression: confirm that nothing changes with time.
- [ ] Portrait (about 360x640): the box fills about 96% of the width; the brush is at least 44 px.
- [ ] Landscape (about 640x360): the box fits the height; rotate mid-wash and check that cleaned areas stay in place.
- [ ] Touch and mouse: scrub with both; right button has no special effect.
- [ ] Keyboard: Tab to the box, arrow keys move the visible brush ring and scrub; Enter/Space follows the zig-zag; focus ring visible.
- [ ] Reduced motion on: the mud vanishes at once at 90%; bubbles and glow still appear.
- [ ] Background the tab during the glow and return.
- [ ] Verify the 90% threshold feels right on a phone and in Safari (canvas read-back).
- [ ] Browsers: Chrome desktop, Chrome Android, Safari iPhone/iPad.

## 18. Known limitations and open issues

**Confirmed (from code reading):**
- No automated tests.
- The animals are drawn separately from the shared animal family, so their style differs from activities that use `js/animals.js`.
- The no-repeat memory (`Rand` last picks and `lastAnimal`) lasts across re-opening during a page session.
- The dog's effective share (about 30%) is lower than a flat weight-3 selection would give (3/8).
- In the comment block of `frame()`, a stale remark refers to `setVehicle`, which is now `setItem` (documentation debt, no behavioural effect).

**Requires verification:**
- Behaviour of the coverage measure on real devices and browsers (PR #82).
- Visual quality of the tractor, sheep and other drawings added in PR #150.

No open GitHub issue concerns this activity (issues #124 and #163 are closed).

## 19. Planned improvements

None currently planned (no open issue).

## 20. Related activities and reusable components

- Related washing activity: [Kąpiel Zwierzątek](kapiel-zwierzatek.md) (animal-only scrub, rinse and dry; issue [#169](https://github.com/BielinskiLukasz/child-page/issues/169)).
- Other activities with a "glow then next round" cycle: [Koraliki](koraliki.md), [Puzzle](puzzle.md), [Wieża z Klocków](wieza-z-klockow.md).
- Shared helper used: [`js/random.js`](../../js/random.js) (`Rand.pickOne`). [`js/animals.js`](../../js/animals.js) is **not** used.

## 21. Change history

- [#56](https://github.com/BielinskiLukasz/child-page/issues/56) / [PR #82](https://github.com/BielinskiLukasz/child-page/pull/82): activity introduced (3 vehicles).
- [#124](https://github.com/BielinskiLukasz/child-page/issues/124) / [PR #150](https://github.com/BielinskiLukasz/child-page/pull/150): 6 vehicle types, 6 colours, 6 animals and the V V A sequence.
- [#163](https://github.com/BielinskiLukasz/child-page/issues/163) / [PR #165](https://github.com/BielinskiLukasz/child-page/pull/165): the dog appears more often (weight 3), never twice in a row.
