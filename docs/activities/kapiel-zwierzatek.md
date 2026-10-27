# Kąpiel Zwierzątek

## 1. Overview

| Item | Value |
|---|---|
| Display name | Kąpiel Zwierzątek |
| Internal ID | `kapiel` (entry in [`js/activities.js`](../../js/activities.js)) |
| Description | An animal spa in three gentle finger-drag stages: scrub off the mud, wash off the foam with a shower, then towel-dry the damp animal until the fur is fluffy. |
| Category | Cause and effect, open-ended play (gentle care) |
| Interaction type | Drag (rubbing); keyboard alternative: arrow keys and Enter/Space |
| CSS prefix | `kp-` |
| Source | [`js/kapiel.js`](../../js/kapiel.js), styles in [`css/style.css`](../../css/style.css) (section `/* Kąpiel Zwierzątek */`) |
| Status | Implemented; enabled by default (appended last in the menu, no `defaultOff`). Listed 46th in the README Activities list. |

## 2. Business purpose

The activity offers a calm caring task with a clear, satisfying result: a muddy animal becomes clean, dry and fluffy and gets a small accessory. Rubbing with a finger is a very natural gesture for young children, nothing can go wrong and there is no text, score or failure. It differs from [Buźki](buzki.md) and [Cienie](cienie.md), which also use the shared animal family, by being a sequential three-stage task driven by continuous dragging.

## 3. Activity flow

1. The child opens the activity (`#kapiel`); a random animal appears covered in brown mud (stage 1).
2. The child drags a finger over the animal. The mud is erased where the finger passes and soap bubbles rise from the finger.
3. When about 90% of the mud is gone, the rest fades by itself (0.5 s).
4. Stage 2: the animal is covered in white foam (fades in over 0.7 s). Dragging moves a shower stream that washes the foam off; droplets fall.
5. Stage 3: the animal is damp (slightly darker, with droplets) (fades in over 0.7 s). Dragging rubs it dry; a soft fur-coloured halo grows as it dries (the fur gets fluffy).
6. When the third stage is cleaned, a random accessory (bow, party hat, crown, flower, bow tie or star) fades in and the animal glows for about 3 s.
7. About 7 s after the third stage finished, the animal fades out (0.7 s), a new random animal fades in (0.7 s) and stage 1 starts again.
8. The child leaves with the Back button (see [shared behaviour](README.md#shared-platform-behaviour)).

## 4. Rules and behavior

| Rule | Value (constant) |
|---|---|
| Stages (internal `stage`) | 0 mud, 1 foam, 2 damp |
| Stage completion | `DONE_AT = 0.9`: the share of the stage layer removed (measured on a 32 x 42 downscaled copy of the layer) |
| Check frequency | every 0.12 s while the layer has changed |
| Rest fade | `REST_S = 0.5` s (instant under reduced motion) |
| Next layer fade-in | `IN_S = 0.7` s |
| Completion glow | `GLOW_S = 3` s; accessory fade-in `IN_S = 0.7` s |
| New animal | `NEXT_AT_S = 7` s after the last stage; `SWAP_S = 0.7` s fade out and in |
| Brush width (fraction of the animal box width) | `BRUSH = [0.11, 0.2, 0.17]`, never less than 44 CSS px |
| Bubbles/droplets | at most `MAX_BUBBLES = 28` pooled DOM nodes, life `BUBBLE_S = 1.6` s, one spawn per `SPAWN_GAP_S = 0.09` s |
| Stage 1 | rising bubbles (radius 0.03 to 0.07 of the stage width); a shower stream (`kp-shower`) is not shown |
| Stage 2 | shower stream from the top edge to the finger, falling droplets (radius 0.012 to 0.022); 6 extra bubbles when a stage ends |
| Stage 3 | the halo opacity equals the cleaned fraction; set to 1 when the stage ends |
| Input accepted | only in phase `play`; several pointers can rub at once |

The layer for each stage is a canvas of 256 x 336 logical pixels, clipped to the animal's silhouette: mud `#b99a7a` (46 random dirt blobs), foam `#ffffff` (46 bubbles with outlines), damp `#7c8fb8` at 38% opacity (70 small droplets). Erasing uses `destination-out` strokes. The blobs are placed with `Math.random`, so the pattern is different each time.

Keyboard: the animal box is focusable (`role="application"`); when focused a brush ring appears. Arrow keys move the brush by 0.07 of the box (position clamped to x 0.06 to 0.94, y 0.05 to 0.95) and erase along the move; Enter or Space advance the brush in a zig-zag (horizontal steps, 0.1 down at each edge, wrapping at the bottom).

## 5. Educational and developmental benefits

**Intended design benefits** (not measured)

- Practice of controlled, continuous finger movement (rubbing) and hand-eye coordination.
- Understanding a sequence of care steps (dirty, soapy, wet, dry).
- Cause and effect with immediate visual feedback.
- Calm, independent play.

**Directly observable behavior**

- Each stage visibly changes as the child rubs; the next stage starts automatically.
- The final state includes a glow and an accessory; nothing can fail.

**Requires professional or research-based validation**

- Any effect on motor skills, hygiene knowledge or emotional development.

## 6. Accessibility and usability

- **Input:** touch, mouse and stylus via pointer events with pointer capture; keyboard as described in section 4. The box has an `aria-label` that includes the animal name (`Zwierzątko do kąpieli: <name>. Strzałki przesuwają szczotkę, Enter lub spacja myje dalej.`).
- **Target size:** the whole animal (height up to 640 px, at least 160 px) is the touch surface; brush at least 44 CSS px wide.
- **Orientation:** the animal box is recomputed on `resize` and `orientationchange` (`h = clamp(min(fieldHeight * 0.96, fieldWidth * 0.96 * 84/64, 640), >= 160)`, width `h * 64/84`); progress is kept because stage layers use logical coordinates.
- **Colour:** progress is shown by the layer disappearing, not by colour alone; the three covers differ in texture (blobs, foam bubbles, droplets).
- **Sound:** none. **Reading:** not required (no text on screen).
- **Reduced motion:** all effects are driven by the rAF loop; under `prefers-reduced-motion` only the 0.5 s rest fade becomes instant (the remaining layer disappears at once). The 0.7 s fade-ins, bubbles and glow still run.
- **Touch behaviour:** `touch-action: none` on the box, text selection disabled.
- **Focus:** 4 px box-shadow `#8f7fd1` on the focused box.
- **Limitations:** keyboard completion needs many key presses; the layers are drawn with random blobs, so a child may see small untouched patches that the 90% rule leaves to fade.

## 7. Risks and limitations

- The activity has a fixed small animal with a rubbing gesture; very small hands on large tablets must cover a large area (brush width scales with the animal, up to 0.2 of the box width).
- Stage 2 shows a vertical stream and falling droplets while dragging, and stage 3 shows tiny droplets; motion is slow but continuous while touching.
- The accessory and animal are random; some accessories may look odd on some animals (`Requires verification`).
- A child may rub very quickly across the screen; the 90% threshold is checked every 0.12 s, so stages can end soon after fast scrubbing.
- No personal data is collected; nothing is stored.

## 8. Configuration

No external configuration; constants in [`js/kapiel.js`](../../js/kapiel.js):

| Name | Purpose | Type | Default |
|---|---|---|---|
| `LW`, `LH` | Logical size of the stage mask | px | `256`, `336` |
| `VX, VY, VW, VH` | Animal viewBox | numbers | `-32, -42, 64, 84` |
| `MAX_BUBBLES` | Pooled bubble/droplet nodes | number | `28` |
| `BUBBLE_S`, `SPAWN_GAP_S` | Bubble life and spawn spacing | s | `1.6`, `0.09` |
| `DONE_AT` | Cleaned share that ends a stage | 0 to 1 | `0.9` |
| `REST_S`, `IN_S` | Rest fade and fade-in times | s | `0.5`, `0.7` |
| `GLOW_S`, `NEXT_AT_S`, `SWAP_S` | Completion glow, time to the next animal, swap fade | s | `3`, `7`, `0.7` |
| `BRUSH` | Brush width per stage | fractions | `[0.11, 0.2, 0.17]` |
| `ACCESSORIES` | Six accessories (kokardka, czapeczka, korona, kwiatek, muszka, gwiazdka) | array | 6 entries |

No fallback because nothing is read from outside.

## 9. Assets

No external asset files. The animal comes from [`js/animals.js`](../../js/animals.js) (`Animals.head(id, { body: true })`, drawn in a 64 x 84 viewBox with a small ground shadow). Mud, foam and damp covers are made from a silhouette SVG data URL loaded into an `Image` (`silhouette()`, cached in `SIL_CACHE` by animal id and colour) and drawn into the canvas with random blobs. The halo uses the same silhouette in the fur colour. Accessories are inline SVG strings. The menu icon is inline SVG in `js/activities.js`.

## 10. Randomization and variants

- **Animal:** `Rand.pickOne(Animals.LIST, 'kapiel-animal')`: one of 13 animals (Miś, Króliczek, Kotek, Piesek, Myszka, Świnka, Lisek, Lew, Słoń, Panda, Żabka, Sowa, Koala), never the same as the previous pick for this key within the page session.
- **Accessory:** `Rand.pickOne(ACCESSORIES, 'kapiel-acc')`: one of 6, chosen when each animal is set up and not the same as the previous one.
- **Layer pattern:** random blob positions and sizes for each stage layer.
- **When:** the first animal at launch, then a new animal after each completed animal.
- **Persistence:** none.

## 11. Progression and difficulty

No levels. Each animal always goes through the same three stages; the brush gets wider in stage 2 (0.2) and slightly narrower in stage 3 (0.17). Nothing is stored.

## 12. Completion and feedback

- **Stage completion:** at 90% cleaned the rest fades and the next cover fades in.
- **Final completion:** after stage 3 the accessory appears, the animal glows (`drop-shadow` `#ffe08a`) for about 3 s and a new animal replaces it about 7 s after the third stage finished.
- **Feedback during play:** bubbles, shower stream and droplets follow the finger; fur halo grows in stage 3.
- **Failure feedback:** none.
- **Sound:** none.

## 13. Analytics and metrics

This activity reports to the shared on-device module `js/analytics.js` (`window.Analytics`) through the app shell only: `js/app.js` records the activity start and end, and the module counts touches inside the stage. The activity file itself calls no `Analytics` function. Recorded for it: starts, active time, replays (re-opening in the same session), quick exits (within 10 s) and touches. It is open-ended, so no completion, level or exit-before-completion is defined for it. Data stays on the device as anonymous daily aggregates; see [README.md](README.md#analytics-status).

## 14. Technical implementation

- **Entry point:** `mount(container)` in [`js/kapiel.js`](../../js/kapiel.js), registered on the `kapiel` entry; returns a cleanup function. Loaded just before `app.js` in `index.html`.
- **State:** `animal`, `stage`, `phase` (`wait`, `play`, `rest`, `in`, `done`, `swap`), `baseline` (opaque pixel sum of the fresh layer), `pointers` (active drags), `dirty`, `token` (guards against stale async image loads), bubble pool `bubbles[28]`.
- **Rendering:** a `.kp-box` with an animal SVG, a blurred halo (`kp-halo`), the mask `<canvas class="kp-layer">`, an accessory layer, the shower, a keyboard brush ring and the bubble layer. The progress check draws the layer into a 32 x 42 canvas (`willReadFrequently`) and sums alpha.
- **Animation:** one rAF loop (`frame`, `dt` capped at 50 ms); `if (busy && !raf)` keeps a single loop when an image callback restarts it synchronously (fix in commit `c8b1d37`). The loop stops when idle and is cancelled when the tab is hidden.
- **Randomization:** `Rand.pickOne` ([`js/random.js`](../../js/random.js)) and `Animals.LIST`.
- **Persistence/analytics:** none.
- **Cleanup:** sets `alive = false` (so late image callbacks do nothing), cancels the frame, removes the window and document listeners and the board.

## 15. Responsive layout and coordinate system

- Field: the screen minus 64 px at the top and 12 px elsewhere (plus safe areas), centred flex container.
- The animal box has a fixed aspect `64 : 84`; all internal layers (animal SVG, halo, canvas, accessory) fill the box (`inset: 0`).
- Mask and pointer coordinates use the logical 256 x 336 space (`toLogical` maps client coordinates through the box rectangle), so the same progress is valid at every size and orientation. Bubbles use fractions of the box (`x / LW`, `y / LH`, percentages in CSS).
- Brush radius is converted from CSS pixels to logical units so it is always at least 44 CSS px wide.
- The animal is scaled to fit, so on wide landscape screens it occupies the central part of the field.

## 16. Error and edge-case handling

| Case | Behaviour |
|---|---|
| Image not loaded (async) | Phase `wait` until the silhouette image fires `load`; cached images run the callback synchronously. |
| Image load error | Not handled: there is no `error` listener, so the activity would stay in `wait` (the loop keeps running). Practically unlikely for a data-URL SVG; `Requires verification`. |
| Stale callback after the animal changed or the activity was left | Ignored (`token` and `alive` checks). |
| Resize/orientation change | `layout` rescales the box; mask progress is kept. |
| Tab hidden | Loop cancelled and restarted on return. |
| Multi-touch | Each pointer rubs independently. |
| Touch cancel / lost capture | Pointer removed; progress kept. |
| Rapid input | The progress check runs every 0.12 s while changes occur. |
| Unsupported `matchMedia` | `reduced()` returns `false`. |

## 17. Testing

**Automated tests:** none (see [shared behaviour](README.md#shared-platform-behaviour)). PR [#171](https://github.com/BielinskiLukasz/child-page/pull/171) reports `node --check` and a stub-DOM simulation (pointer drag and keyboard-only runs, with and without reduced motion) completing all three stages; it is not re-verified here.

**Manual scenarios (not yet recorded as performed):**

- [ ] Normal: scrub the mud, shower off the foam and towel-dry; each stage ends after most of the cover is gone.
- [ ] Completion: after stage 3 the accessory appears, the animal glows for about 3 s and a new animal fades in after about 7 s.
- [ ] Incorrect interaction: rub outside the animal, tap without dragging, leave a small patch untouched (the rest fades).
- [ ] Restart/replay: complete several animals; the animal and accessory change and the same animal does not repeat twice in a row.
- [ ] Randomization: check that all 13 animals and 6 accessories can appear and look acceptable.
- [ ] Progression: confirm there is no level change besides the three stages.
- [ ] Portrait and landscape: 320 x 568 up to 1920 x 1080; rotate in the middle of stage 2 and confirm the progress is kept.
- [ ] Touch: single finger and two fingers; mouse drag.
- [ ] Keyboard: Tab to the animal, use the arrow keys and Enter/Space to finish all three stages.
- [ ] Background/foreground: hide the tab during a stage and during the glow.
- [ ] Reduced motion: the rest fade becomes instant; effects still work.
- [ ] Performance: on a low-end device check that dragging stays smooth.
- [ ] Browsers: Chrome desktop, Chrome Android, Safari iPhone/iPad.

## 18. Known limitations and open issues

**Confirmed**

- No automated tests. Analytics is covered in section 13.
- No error handling for silhouette image load failure (section 16).
- Keyboard play needs many key presses.
- The final animal swap overrides phase `wait` with `swap`, so input may open at the end of the fade even if the new layer image has not finished loading (practically only on the very first load of an animal colour).

**Requires verification**

- Appearance of every accessory on every animal.
- Performance of canvas erasing and `getImageData` checks on low-end devices.

## 19. Planned improvements

None currently planned (no open issue targets this activity).

## 20. Related activities and reusable components

- Other activities using the shared animal family: [Buźki](buzki.md), [Cienie](cienie.md) (also uses the `shadow` option of `Animals.head`).
- Shared helpers: [`js/random.js`](../../js/random.js) (`Rand.pickOne`) and [`js/animals.js`](../../js/animals.js) (`Animals.LIST`, `Animals.head`).
- Another activity with a washing theme: [Myjnia](myjnia.md) (not compared in detail here).

## 21. Change history

- [#169](https://github.com/BielinskiLukasz/child-page/issues/169) / PR [#171](https://github.com/BielinskiLukasz/child-page/pull/171): activity added.
- Commit `c8b1d37`: keep a single rAF chain in `frame()` when a cached silhouette callback restarts it (review suggestion).
