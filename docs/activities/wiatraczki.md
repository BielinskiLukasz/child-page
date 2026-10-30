# Wiatraczki

## 1. Overview

| Item | Value |
|---|---|
| Display name | Wiatraczki |
| Activity ID | `wiatraczki` (`js/activities.js`) |
| Description | A pastel meadow with nine pinwheels of different colours, heights and centre shapes, grass and a windsock. Touching a pinwheel spins it; sliding a finger across the meadow makes a soft gust. |
| Category | Open-ended play, cause and effect, exploratory |
| Interaction type | Tap (pinwheels), slide/swipe (gust) |
| Status | Implemented; **disabled in the menu by default** (`defaultOff: true`). A parent enables it in the gated Settings; see [shared platform behaviour](README.md#shared-platform-behaviour). |

Source: [`js/wiatraczki.js`](../../js/wiatraczki.js), CSS prefix `wi-` in [`css/style.css`](../../css/style.css), registry entry in [`js/activities.js`](../../js/activities.js) (lazy-loaded via `src`/`deps` on its registry entry in js/activities.js). Introduced by issue #100 / PR [#170](https://github.com/BielinskiLukasz/child-page/pull/170).

## 2. Business purpose

- A pure cause-and-effect scene with two ways to act: a precise touch on one pinwheel, and a sweeping gesture that sets several pinwheels spinning as a wave.
- Every pinwheel has its own colour and centre shape, so they are distinguishable without relying on colour alone.
- Complements [Karuzela](karuzela.md) (also a rotation that the child starts and stops) and [Latawiec](latawiec.md) (also reacts to a finger moving across the scene).
- It ships disabled by default; the reason is not documented in the code or PR description (`Not currently documented`).

## 3. Activity flow

1. A parent enables the activity in Settings; the child opens the tile; `mount(container)` builds the scene. The loop is not running yet.
2. All nine pinwheels are at rest; the windsock hangs down and the grass is still.
3. The child can tap a pinwheel or slide a finger over the meadow.
4. A tapped pinwheel spins up and rests after about 6 s. A sliding finger spins pinwheels near its path (nearer ones stronger and sooner), and the windsock and grass lean in the direction of the slide.
5. There is no completion state.
6. Everything settles by itself; the loop stops when all motion has ended.
7. A new scene starts each time the activity is opened.
8. The child leaves with the Back button.

## 4. Rules and behavior

| Rule | Detail |
|---|---|
| Per-pinwheel state | `level` (0..1, the spin it is heading for) and `omega` (actual speed). `level` decays linearly at `DECAY` = 0.7 / 6 per second; `omega` eases toward `level` with rate 2.4 per second. Speed in turns per second = `OMAX` (1) x `omega`, never negative and never above 1. |
| Tap on a resting pinwheel | `level` = `TOUCH_LVL` = 0.7; it rests again after about 6 s (plus easing). |
| Tap on a spinning pinwheel (`level` or `omega` above 0.05) | `level` += `PUSH` = 0.12, capped at 1. |
| Gust | While a pointer is pressed and moving, the path since the last move is sampled every `STEP` = 10 units (at most 40 samples per event). A pinwheel within `RADIUS` = 90 units of a sample gets a candidate level `GUST_MAX` x (1 - d/90) with `GUST_MAX` = 0.55 (so at most 0.55). Candidates below 0.04, or not above the current or already pending level, are ignored. The kick is applied after a delay of d / `WAVE_V` seconds (`WAVE_V` = 200 units/s) and only raises `level` to a maximum, never adds. |
| Wind | Every move sets `wind` to at least 0.85; it decays linearly over `WIND_T` = 5 s. `dir` is the sign of the last horizontal movement. A smoothed signed wind `sg` follows `dir * wind` (rate 2.5 per s). |
| Windsock | Rotates by `-sg * 75` degrees about its pole top (28, 40), plus a flutter of up to 4 degrees. |
| Grass | The grass layer is skewed by `sg * 8` plus a small oscillation (up to 3 degrees). |
| Pinwheels | Head positions (x, y) and stem lengths: (100, 62, 52), (215, 56, 58), (330, 66, 50), (125, 142, 46), (240, 148, 44), (355, 138, 48), (100, 222, 50), (215, 216, 54), (330, 226, 48). Each head has four blades (two coloured, two white) of radius about 25 units. |
| Colours / centre shapes | Pink, yellow, blue, purple, mint, peach, green, lilac, turquoise; centres: circle, square, triangle, diamond, star, hexagon, plus, droplet, pentagon. |

No sound, scoring, failure or retry. Pinwheel spin direction is always clockwise (angle only increases).

## 5. Educational and developmental benefits

**Intended design benefits**

- Cause and effect between a touch or a sliding gesture and the response.
- Calm observation of slowly spinning shapes and a wave of motion.
- Distinguishing shapes and colours (each pinwheel is unique).

**Directly observable behavior**

- Spin speed is capped at one turn per second and changes smoothly.
- Gust strength depends on distance, with a delay proportional to distance, producing a wave effect.
- The windsock and grass follow the last gust direction and settle.

**Requires professional or research-based validation**

- Any effect on fine motor skills, attention or colour/shape learning is not established by the code and is not claimed.

## 6. Accessibility and usability

- **Input:** pointer events on the whole scene for gusts (touch, mouse, stylus; first pointer only); `click` on nine `<button>`s for taps, so keyboard (Tab, Enter/Space) works for taps. The sliding gust has no keyboard equivalent.
- **Targets:** each pinwheel button is `max(56, 50k)` px square, centred on the head; the nearest pinwheel centres are 80-115 board units apart (PR [#170](https://github.com/BielinskiLukasz/child-page/pull/170) reports a minimum centre distance of 58 px at the narrowest layout, k = 0.8).
- **Labels:** each button has `aria-label` such as "Wiatraczek 1 – różowy, zakręć" (colour name in Polish); the scene SVG is `aria-hidden`.
- **Focus:** `:focus-visible` outline 4px `#8f7fd1`.
- **Orientation:** the board keeps its 400:300 ratio and is sized `min(100%, (100dvh - safe areas - 64px) * 400/300)`; works in portrait (smaller) and landscape.
- **Colour:** each pinwheel also has a unique centre shape; no task depends on colour.
- **Reduced motion:** motion is driven by a `requestAnimationFrame` loop and is not disabled by the global rule. A one-turn-per-second spin is the maximum; there is no separate reduced-motion variant.
- **Reading:** none required; a young child can use it independently.
- **Limitations:** `touch-action: none` on the scene; the gust cannot be triggered from the keyboard.

## 7. Risks and limitations

- Rotating blades with white and coloured quarters at up to one turn per second could look flickery on some displays; the speed cap is deliberate. No flashing is implemented.
- Ten or so quick sliding gestures keep many pinwheels spinning; the cap prevents growth beyond 1 turn/s but several spinning at once increases visual motion.
- On a 320 px wide portrait screen the targets are close (see section 6); not verified on a real device.
- Disabled by default, so children will not see it unless a parent enables it.

## 8. Configuration

No external configuration; constants live in [`js/wiatraczki.js`](../../js/wiatraczki.js) and require a code change. The only runtime-configurable aspect is whether the activity is enabled in the menu (menu-config, stored in `localStorage`; default off through `defaultOff`). Nothing else is stored.

| Constant | Value | Purpose |
|---|---|---|
| `BW` x `BH` | 400 x 300 | Board units |
| `OMAX` | 1 turn/s | Maximum spin |
| `TOUCH_LVL` | 0.7 | Level after a tap on a resting pinwheel |
| `PUSH` | 0.12 | Level added by a tap on a spinning pinwheel |
| `DECAY` | 0.7 / 6 per s | Level decay (a single tap rests in about 6 s) |
| `GUST_MAX`, `RADIUS`, `WAVE_V` | 0.55, 90 units, 200 units/s | Gust strength, reach, wave speed |
| `STEP` | 10 units | Sampling step along the finger path |
| `WIND_T` | 5 s | Wind decay time |
| `COLS`, `NAMES`, `CENTRES`, `PW` | 9 entries each | Colours, Polish colour names, centre shapes, head positions and stem lengths |
| `SOCK_X`, `SOCK_Y` | 28, 40 | Windsock pole top |
| `MAX_DT` | 0.05 s | Frame time cap |

## 9. Assets

No external asset files. Sky, hills, windsock, grass, stems and pinwheels are inline SVG built by `scene()`; each pinwheel's centre shape is a small inline path. This activity does not use [`js/animals.js`](../../js/animals.js). The menu icon is inline SVG in `js/activities.js`. No fonts, audio or images.

## 10. Randomization and variants

Nothing is randomized: colours, centre shapes, positions and stem lengths are fixed, and the same scene appears on every visit.

## 11. Progression and difficulty

No progression or levels. Spin state is transient and not stored.

## 12. Completion and feedback

- No completion state; open-ended.
- Feedback is visual only: spinning pinwheels, wave-like start, windsock and grass motion.
- No failure; no sound; the loop stops by itself when all motion has ended.

## 13. Analytics and metrics

This activity reports to the shared on-device module `js/analytics.js` (`window.Analytics`) through the app shell only: `js/app.js` records the activity start and end, and the module counts touches inside the stage. The activity file itself calls no `Analytics` function. Recorded for it: starts, active time, replays (re-opening in the same session), quick exits (within 10 s) and touches. It is open-ended, so no completion, level or exit-before-completion is defined for it. Data stays on the device as anonymous daily aggregates; see [README.md](README.md#analytics-status).

## 14. Technical implementation

- **Entry point:** `mount(container)` assigned to the registry entry `wiatraczki`; returns a cleanup function.
- **Rendering:** one SVG (`viewBox 0 0 400 300`) inside `.wi-board` with groups `.wi-spin` (one per pinwheel, rotated each frame), `.wi-sock` and `.wi-grass`; nine transparent buttons overlay the heads for taps and accessibility.
- **State:** per pinwheel `{ ang, omega, level, pendAt, pendLvl }`; global `time`, `wind`, `dir`, `sg`; pointer `pid`, `px`, `py`.
- **Animation:** one `requestAnimationFrame` loop (`frame`/`paint`) with capped dt, started by `start()` on a tap or gust and stopped when `active()` is false and no pointer is held; paused while `document.hidden` and resumed only if still active.
- **Events:** `pointerdown`/`pointermove`/`pointerup`/`pointercancel` on the root (coordinates via `getBoundingClientRect`), `click` on pinwheel buttons, `resize`/`orientationchange` call `layout()`.
- **Cleanup:** cancels the frame, removes window/document listeners and removes the root node.
- **Dependencies:** none other than the registry. No persistence or analytics integration. See [shared platform behaviour](README.md#shared-platform-behaviour).

## 15. Responsive layout and coordinate system

- Board 400 x 300 units, scale `k = board.clientWidth / 400`; the scene, pinwheels and gesture sampling all use board units, so the gust radius scales with the board.
- Pointer positions are converted to board units with the current bounding rectangle.
- Pinwheel buttons are placed at head position times `k` with a minimum size of 56 px.
- The grass is skewed about the bottom edge of the board (`translate(0 300) skewX(...) translate(0 -300)`).
- All pinwheels stay inside the board in any orientation (only the board scales).

## 16. Error and edge-case handling

- Resize/orientation change: `layout()` repositions the buttons; pinwheel state continues.
- Backgrounding: loop cancelled while hidden; restarted only if there is still motion; dt capped at 0.05 s.
- Rapid repeated input: levels only ever rise to a maximum (gust) or by a small capped push (tap), so speed stays at or below 1 turn/s; the number of samples per move event is capped at 40.
- Touch cancellation: `pointercancel` ends the gesture like release.
- Second finger: ignored while a pointer is active.
- Pointer capture is not used, so a gesture that leaves the board continues to be tracked only while events reach the root (see section 18).
- Missing assets / empty pools: not applicable (inline SVG).

## 17. Testing

No automated tests exist (see [shared platform behaviour](README.md#shared-platform-behaviour)). PR [#170](https://github.com/BielinskiLukasz/child-page/pull/170) reports `node --check` and a node stub-DOM simulation (single tap peak 0.57 turn/s, rest after about 6.3 s, repeated taps maximum 0.85, gust reaches near pinwheels and not far ones, loop stops once idle, windsock returns to 0) and states it was not checked in a real browser or on a device.

Manual scenarios (all unchecked):

- [ ] Enable Wiatraczki in the parent-gated Settings; confirm the tile appears and the activity opens. With it disabled, confirm the tile is absent.
- [ ] Normal: tap a pinwheel; it spins up smoothly (at most one turn per second) and rests after about 6 s.
- [ ] Tap a spinning pinwheel; it speeds up slightly, never above one turn per second.
- [ ] Gust: slide a finger slowly across several pinwheels; nearer ones spin more strongly and a little earlier; far ones (more than about 90 units away) do not move.
- [ ] Slide left-to-right, then right-to-left; the windsock and grass lean in the direction of the last slide and settle within about 5 s.
- [ ] Fast back-and-forth sliding; spin speed stays within the cap and nothing flickers.
- [ ] Completion: confirm there is no end state and the loop stops when everything is still (check CPU).
- [ ] Incorrect interaction: tap the sky or grass; nothing happens (only sliding creates a gust).
- [ ] Restart: leave with Back and re-enter; all pinwheels are at rest.
- [ ] Randomization: confirm the scene is identical on each visit.
- [ ] Progression: confirm there is none.
- [ ] Portrait and landscape on phone and tablet, including a 320 px wide portrait screen; targets stay at least 56 px and do not overlap.
- [ ] Touch and mouse; keyboard Tab and Enter/Space on each pinwheel.
- [ ] Background the tab while pinwheels spin and return.
- [ ] Browsers: Chrome desktop, Chrome Android, Safari iPhone/iPad.
- [ ] Reduced motion enabled in the OS: pinwheels still spin.

## 18. Known limitations and open issues

**Confirmed**

- No automated tests; no documented real-device verification.
- Disabled by default; the reason is not documented.
- The gust gesture has no keyboard alternative.
- Pointer capture is not used on the scene, so `pointerup` outside the browser window may not be received.

**Requires verification**

- Whether a gesture released outside the window leaves the loop running until the next pointer event (`pid` stays set until a `pointerup`/`pointercancel` reaches the root).
- Visual comfort of white-and-coloured blades at the maximum speed on real displays.

No open GitHub issue targets this activity.

## 19. Planned improvements

None currently planned.

## 20. Related activities and reusable components

- Similar scenes: [Latawiec](latawiec.md) (finger-following), [Karuzela](karuzela.md) (touch-started rotation), [Zegar z Kukułką](zegar-z-kukulka.md) (several independent touch targets).
- Shared components: none specific; `js/animals.js` and `js/random.js` are not used. It follows the common pattern of one capped-dt `requestAnimationFrame` loop paused on `visibilitychange`.
- Menu default-off behaviour: `defaultOff` in [`js/activities.js`](../../js/activities.js) and [`js/menu-config.js`](../../js/menu-config.js).

## 21. Change history

- Issue #100, PR [#170](https://github.com/BielinskiLukasz/child-page/pull/170): activity added (commit 58b0fb0), shipped with `defaultOff: true`.
