# Latawiec

## 1. Overview

| Item | Value |
|---|---|
| Display name | Latawiec |
| Activity ID | `latawiec` (`js/activities.js`) |
| Description | A pastel sky with a hill, a random animal holding the kite string, a randomly designed kite (six shapes) with a ribbon tail of 5 bows and three clouds. The kite follows the child's finger softly. |
| Category | Open-ended play, cause and effect, coordination |
| Interaction type | Touch/drag in the sky (follow), tap the animal |
| Status | Implemented; enabled in the menu by default (no `defaultOff`) |

Source: [`js/latawiec.js`](../../js/latawiec.js), CSS prefix `lw-` in [`css/style.css`](../../css/style.css), registry entry in [`js/activities.js`](../../js/activities.js), script tag in [`index.html`](../../index.html). Introduced by issue #99 / PR [#162](https://github.com/BielinskiLukasz/child-page/pull/162).

## 2. Business purpose

- Gives direct, continuous control: the kite goes where the finger goes, but always with a soft lag and a speed limit, so it never jumps.
- When the finger is lifted the kite does not stop abruptly; it drifts and settles into a slow figure-eight, so the scene stays alive without input.
- It is the only scene in the playground group ([Karuzela](karuzela.md), [Zjeżdżalnia](zjezdzalnia.md), [Huśtawka](hustawka.md)) that tracks a finger position continuously.

## 3. Activity flow

1. The child opens the tile; `mount(container)` builds the scene and starts the loop immediately.
2. The kite hovers in a slow figure-eight near the upper middle of the sky; three clouds sit in the sky and the animal stands on the hill.
3. The child can touch or drag anywhere in the scene (except on the animal), or tap the animal. Keyboard users can move the kite with the arrow keys.
4. While a finger is down the kite follows it on a damped spring, the tail follows the kite's earlier path, and clouds the kite touches puff aside. Tapping the animal makes it wave.
5. There is no completion state.
6. When the finger is lifted, the kite drifts on and settles into the figure-eight around its position within about 4 s.
7. A new scene with a new animal is created each time the activity is opened.
8. The child leaves with the Back button (see [shared platform behaviour](README.md#shared-platform-behaviour)).

## 4. Rules and behavior

| Rule | Detail |
|---|---|
| Steering | Only the first pointer steers (`pid`); a second finger is ignored while the first is down. Pressing on the animal button does not steer. |
| Target clamping | The finger target is clamped to the kite bounds x 28-372, y 36-140 board units (`KX0`, `KX1`, `KY0`, `KY1`). The kite therefore stays in the upper part of the board. |
| Motion | Damped spring: `v += (SK * (target - pos) - SD * v) * dt` with `SK` = 6 and `SD` = 4.4; speed capped at `VMAX` = 110 board units per second; position clamped to the bounds (velocity zeroed at the walls). |
| Release | The hover centre is set to the position plus half the velocity (clamped so the figure-eight fits); the figure-eight amplitude fades in smoothly over `SETTLE` = 4 s. |
| Figure-eight | x amplitude `HA` = 26, y amplitude `HB` = 11 units, period 10 s (`HW` = 2π/10). |
| Tilt | The kite rotates with horizontal speed (up to 18 degrees) plus a slow 3 degree wobble, smoothed. |
| Tail | 5 bows, bow i samples the kite's position history at lag `i * 0.22` s (`LAG`), offset i * 15 units below the kite, plus a small sinusoidal wave; all points are clamped inside the board (8-unit margin). History is kept for `BOWS * LAG + 0.5` s. |
| String | A quadratic curve from the animal's right paw (about (51, 221)) to the kite, with the control point sagging 20 units below the midpoint. |
| Clouds | Three clouds at (84, 52, scale 1), (236, 38, 0.85), (334, 92, 1.05). When the kite centre is closer than `46 * scale` units, the cloud moves 46 units sideways (away from the kite, clamped to x 40-360) and swells by about 10% for 1.2 s. It returns once the kite is more than 100 units away horizontally from the cloud's home position. |
| Animal | Tap: waves for `WAVE_T` = 1.6 s. |
| Keyboard | On the kite button, ArrowLeft/Right move the hover centre by 50 units and ArrowUp/Down by 35 units (clamped); ignored while a pointer drag is active. |

No sound, scoring or failure state.

## 5. Educational and developmental benefits

**Intended design benefits**

- Cause and effect and hand-eye coordination: the kite follows the finger.
- Calm observation: the tail, string and clouds respond slowly.

**Directly observable behavior**

- Movement is rate-limited and smoothed, so fast finger movement does not produce fast kite movement.
- After release the kite settles into a slow figure-eight.
- Clouds step aside when the kite touches them.

**Requires professional or research-based validation**

- Any effect on motor control, tracking or attention is not established by the code and is not claimed.

## 6. Accessibility and usability

- **Input:** pointer events (touch, mouse, stylus) on the whole scene; one finger only. Keyboard: the kite button (`aria-label` "Latawiec – strzałki przesuwają latawiec") accepts arrow keys; Enter/Space have no effect. The animal button supports click, Enter and Space.
- **Targets:** the whole sky is a touch area; the kite button is `max(56, 56k)` px square and follows the kite; the animal button is `max(56, 60k)` x `max(56, 64k)` px.
- **Labels:** the animal button is labelled "<name> – pomachaj"; the SVG scene is `aria-hidden`.
- **Focus:** `:focus-visible` outline 4px `#8f7fd1` on both buttons.
- **Orientation:** the board keeps its 400:300 ratio and is sized `min(100%, (100dvh - safe areas - 64px) * 400/300)`, so it works in portrait (smaller) and landscape.
- **Colour:** the kite and bows use several colours (the kite's colour set is random) but nothing depends on colour.
- **Reduced motion:** motion is driven by a `requestAnimationFrame` loop and is not disabled by the global rule; there is no separate reduced-motion variant (motion is slow and speed-capped).
- **Reading:** none required; suitable for a young child to use independently.
- **Limitations:** the scene sets `touch-action: none`; the keyboard only moves the kite in steps and has no way to "drag".

## 7. Risks and limitations

- The loop never stops while the activity is open (it re-requests a frame every time, unlike Zjeżdżalnia and Huśtawka), so it continuously uses CPU on slow devices; it is paused only while the tab is hidden.
- A child may drag over the whole screen quickly; this is safe because the speed is capped.
- The kite area is limited to the upper part of the board (y up to 140 of 300 units).
- Visual check in a real browser is not documented.

## 8. Configuration

No external configuration; constants live in [`js/latawiec.js`](../../js/latawiec.js) and require a code change. Nothing is stored; no fallback logic.

| Constant | Value | Purpose |
|---|---|---|
| `BW` x `BH` | 400 x 300 | Board units |
| `KX0`, `KX1`, `KY0`, `KY1` | 28, 372, 36, 140 | Kite centre bounds |
| `VMAX`, `SK`, `SD` | 110 units/s, 6, 4.4 | Speed cap, spring stiffness, damping |
| `HA`, `HB`, `HW`, `SETTLE` | 26, 11, 2π/10, 4 s | Figure-eight amplitudes, angular speed, settle time |
| `BOWS`, `LAG` | 5, 0.22 s | Tail bows and lag per bow |
| `AX`, `AY`, `AS` | 70, 234, 0.9 | Animal feet position and scale |
| `CLOUDS` | 3 entries | Cloud x, y, scale |
| `BOW_COLS` | 5 colours | Bow colours |
| `WAVE_T`, `MAX_DT` | 1.6 s, 0.05 s | Wave length, frame time cap |

## 9. Assets

No external asset files. The sky, sun, clouds, hills, grass, animal, string, tail, bows and kite are inline SVG produced by `scene()`; the animal uses `Animals.head(id, { body: true })`. The menu icon is inline SVG in `js/activities.js`. No fonts, audio or images.

## 10. Randomization and variants

- One animal per `mount` from `Animals.pick(1)[0]` (13 animals, uniform; see [`js/animals.js`](../../js/animals.js), [`js/random.js`](../../js/random.js)). Not persisted; the same animal can repeat.
- One kite per `mount`, built from three independent random picks with `Rand.pickOne` (keys `latawiec-design`, `latawiec-colours`, `latawiec-pattern`; the same pick is not repeated twice in a row within one page session): six designs (diamond, dragon, airplane, butterfly, star, heart) x five colour sets (`PALETTES`) x four patterns (`plain`, `quarters`, `stripes`, `dots`; the second or third colour of the set is laid over the main one and clipped to the kite outline). Not persisted. Tail, physics and touch targets do not depend on the design.

## 11. Progression and difficulty

No progression or levels. Nothing persists between sessions.

## 12. Completion and feedback

- No completion state; open-ended.
- Feedback is visual only: the kite, tail, string, clouds and the animal's wave.
- No failure; no sound; the loop runs continuously.

## 13. Analytics and metrics

This activity reports to the shared on-device module `js/analytics.js` (`window.Analytics`) through the app shell only: `js/app.js` records the activity start and end, and the module counts touches inside the stage. The activity file itself calls no `Analytics` function. Recorded for it: starts, active time, replays (re-opening in the same session), quick exits (within 10 s) and touches. It is open-ended, so no completion, level or exit-before-completion is defined for it. Data stays on the device as anonymous daily aggregates; see [README.md](README.md#analytics-status).

## 14. Technical implementation

- **Entry point:** `mount(container)` assigned to the registry entry `latawiec`; returns a cleanup function.
- **Rendering:** one SVG (`viewBox 0 0 400 300`, `preserveAspectRatio="none"`) inside `.lw-board`, updated every frame through attributes (`transform`, path `d`); two transparent `<button>`s (animal and kite) sit on top for accessibility and focus.
- **Kite look:** `DESIGNS`, `PALETTES`, `PATTERNS` and `kiteSvg(design, palette, pattern)` build the kite group inside `scene(def, kite)`; picked once in `mount`.
- **State:** kite `x, y, vx, vy, tilt`; hover centre `cx, cy`, phase `th`, `tFree`; `dragging`, `pid`, target `tx, ty`; `hist[]` position history; per-cloud `{ ox, side, away, pulse }`.
- **Animation:** one `requestAnimationFrame` loop (`frame`/`paint`) with capped dt. It starts in `mount`, continues forever and is cancelled only while `document.hidden`.
- **Events:** `pointerdown`/`pointermove`/`pointerup`/`pointercancel` on the root element (pointer coordinates converted with `getBoundingClientRect` to board units); `click` on the animal; `keydown` on the kite button; `resize`/`orientationchange` call `layout()`.
- **Cleanup:** cancels the frame, removes window/document listeners and removes the root node (root listeners go with the node).
- **Dependencies:** `window.Animals`. No persistence or analytics integration. See [shared platform behaviour](README.md#shared-platform-behaviour).

## 15. Responsive layout and coordinate system

- Board 400 x 300 units, scale `k = board.clientWidth / 400`; everything (scene, kite, tail, string, clouds) lives in the one SVG space, so scaling needs no recomputation.
- Pointer positions are converted to board units with the current `getBoundingClientRect` and clamped to the kite bounds, so the kite stays fully on screen after orientation change.
- The animal button is placed from board units (`AX`, `AY`) times `k`; the kite button follows the kite at `max(56, 56k)` px.
- Tail points are clamped to 8 units inside the board edges.

## 16. Error and edge-case handling

- Resize/orientation change: `layout()` repositions the buttons; kite state is in board units and is unaffected.
- Backgrounding: the loop is cancelled while hidden and restarted with a fresh `last`; dt capped at 0.05 s.
- Touch cancellation: `pointercancel` is treated like release (kite drifts on and settles).
- Second finger: ignored while a pointer is active; arrow keys are ignored during a drag.
- Pointer leaves the board: the target is clamped to the bounds.
- Missing assets / empty pools: not applicable (inline SVG, 13 animals).
- Pointer capture is not used, so if a pointer is released outside the window the `pointerup` may not arrive on the root (see section 18).

## 17. Testing

No automated tests exist (see [shared platform behaviour](README.md#shared-platform-behaviour)). PR [#162](https://github.com/BielinskiLukasz/child-page/pull/162) reports `node --check` and a node stub-DOM simulation covering hover, drag speed cap, off-screen drag, multi-pointer (second finger ignored), release settling, fast zigzag drag and cloud puff/return, and states it was not checked in a real browser or on a device.

Manual scenarios (all unchecked):

- [ ] Normal: touch and drag across the sky; the kite follows with a soft lag, never jumping, and the tail waves along its earlier path.
- [ ] Fast drag across the full width; the kite's speed stays capped.
- [ ] Release: lift the finger; the kite drifts and settles into a slow figure-eight within about 4 s.
- [ ] Touch in the lower part of the screen; the kite stays in the upper area.
- [ ] Cloud: steer the kite into each cloud; the cloud puffs aside and returns after the kite leaves.
- [ ] Tap the animal; it waves for about 1.6 s and the kite is not steered.
- [ ] Completion: confirm there is no end state.
- [ ] Incorrect interaction: use two fingers; the second is ignored.
- [ ] Restart: leave with Back and re-enter; a fresh scene, usually with a different animal.
- [ ] Randomization: enter several times; the animal and the kite (shape, colours, pattern) vary.
- [ ] Progression: confirm there is none.
- [ ] Portrait and landscape on phone and tablet; rotate while the kite is flying; the kite remains fully visible.
- [ ] Touch and mouse; keyboard: Tab to the kite button and use the arrow keys; Tab to the animal and press Enter.
- [ ] Release the pointer outside the browser window or board; the kite should not remain stuck in follow mode.
- [ ] Background the tab and return; no jump.
- [ ] Browsers: Chrome desktop, Chrome Android, Safari iPhone/iPad.
- [ ] Reduced motion enabled in the OS: the kite still flies.

## 18. Known limitations and open issues

**Confirmed**

- No automated tests; no documented real-device verification.
- The kite design (six shapes, five colour sets, four patterns) is random per start and not stored; the former single-design limitation is fixed on `main` (issue [#167](https://github.com/BielinskiLukasz/child-page/issues/167), PR [#173](https://github.com/BielinskiLukasz/child-page/pull/173)).
- The kite's clip path uses the fixed id `lw-kclip`; this is harmless because only one Latawiec scene is mounted at a time.
- The animation loop never idles.

**Requires verification**

- `setPointerCapture` is not used; whether a pointer released outside the window leaves the kite in follow mode (`dragging` stays true until a `pointerup`/`pointercancel` is delivered to the root) has not been tested.

## 19. Planned improvements

None currently planned (the random kite design from issue [#167](https://github.com/BielinskiLukasz/child-page/issues/167) is done, see section 21).

## 20. Related activities and reusable components

- Similar scenes: [Karuzela](karuzela.md), [Zjeżdżalnia](zjezdzalnia.md), [Huśtawka](hustawka.md); [Wiatraczki](wiatraczki.md) also reacts to a sliding finger.
- Shared helper: [`js/animals.js`](../../js/animals.js) (`Animals.pick`, `Animals.head`), which uses [`js/random.js`](../../js/random.js).
- Reference for the damped-spring follow: the "smooth redirect" convention used by other vehicle activities (not linked here because those documents are separate).

## 21. Change history

- Issue #99, PR [#162](https://github.com/BielinskiLukasz/child-page/pull/162): activity added (commit b13a2e7).
- Issue [#167](https://github.com/BielinskiLukasz/child-page/issues/167) / PR [#173](https://github.com/BielinskiLukasz/child-page/pull/173): random kite per launch (six designs, five colour sets, four patterns); tail, physics and targets unchanged.
