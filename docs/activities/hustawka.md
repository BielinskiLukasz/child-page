# Huśtawka

## 1. Overview

| Item | Value |
|---|---|
| Display name | Huśtawka |
| Activity ID | `hustawka` (`js/activities.js`) |
| Description | A pastel garden with a big tree, grass and a swing hanging from a branch with a random animal sitting on it. Touching the swing or the animal pushes it gently. |
| Category | Open-ended play, cause and effect, calm observation |
| Interaction type | Tap (swing seat, animal, tree) |
| Status | Implemented; enabled in the menu by default (no `defaultOff`) |

Source: [`js/hustawka.js`](../../js/hustawka.js), CSS prefix `hs-` in [`css/style.css`](../../css/style.css), registry entry in [`js/activities.js`](../../js/activities.js) (lazy-loaded via `src`/`deps` on its registry entry in js/activities.js). Introduced by issue #98 / PR [#161](https://github.com/BielinskiLukasz/child-page/pull/161).

## 2. Business purpose

- A very simple cause-and-effect scene: each touch gives one small push, and repeated touches build up a slightly higher swing that settles by itself.
- The swing follows a slow pendulum (one swing takes 3.6 s), never jerks and is capped at 35 degrees, which keeps the motion calm.
- Complements [Karuzela](karuzela.md) and [Zjeżdżalnia](zjezdzalnia.md) in the playground group; it is the only one of the three whose motion decays by itself.

## 3. Activity flow

1. The child opens the tile; `mount(container)` builds the scene.
2. The swing hangs at rest from the tree branch with one random animal on it.
3. The child can touch the swing seat, the animal, or the tree.
4. Seat or animal: one push (the animal also waves). Tree: the crown sways once.
5. There is no completion state; the swing returns to rest by itself about 14-15 s after the last push.
6. The child can push again at any time, also while it is swinging.
7. A new scene and a new random animal are created each time the activity is opened.
8. The child leaves with the Back button (see [shared platform behaviour](README.md#shared-platform-behaviour)).

## 4. Rules and behavior

| Rule | Detail |
|---|---|
| Push (seat or animal click) | `target` amplitude increases by `STEP` = 8 degrees, capped at `MAX_AMP` = 35 degrees. A push from complete rest resets the phase to 0, so the swing starts from the centre. |
| Amplitude | `target` drains at `DRAIN` = 2.7 degrees per second; the real amplitude `amp` eases toward it with rate `EASE` = 2 per second, so changes are smooth. |
| Swing angle | `theta = amp * sin(phase)`, `phase` advances by `OMEGA` = 2π / 3.6 per second (period `PERIOD` = 3.6 s). |
| Rest | When `amp < 0.08` and `target <= 0`: `amp`, `theta` and `phase` are zeroed and the loop stops when nothing else is animating. |
| Wave | A push through the animal sets a wave timer of `WAVE_T` = 1.6 s (raised paw moves up to 22 units and wiggles). A push through the seat does not wave. |
| Tree | Click on the tree button: the crown rotates up to 2.2 degrees about (93, 160) over `SWAY_T` = 2.6 s. Does not affect the swing. |
| Leaves | While `amp > LEAF_AMP` = 20 degrees, a pooled leaf is released at most every `LEAF_GAP` = 0.9 s, with at most `MAX_LEAVES` = 6 visible at once. Each leaf falls for 5-7 s with a sideways sway and rotation, fades in over 0.6 s and out over the last 1.2 s, then is hidden and reused. |

- No sound, scoring or failure state.
- Pushes made quickly are all accepted (no rate limit); the amplitude cap prevents runaway motion.

## 5. Educational and developmental benefits

**Intended design benefits**

- Cause and effect: a touch gives a push that visibly lasts and fades.
- Calm observation of a slow pendulum and drifting leaves.

**Directly observable behavior**

- Several pushes in a row make the swing swing a bit higher (maximum 35 degrees).
- Without pushes the swing slowly settles to rest.
- Leaves appear only at larger amplitudes.

**Requires professional or research-based validation**

- Any effect on rhythm perception, attention or calm is not established by the code and is not claimed.

## 6. Accessibility and usability

- **Input:** `click` on `<button>` elements, so touch, mouse, stylus and keyboard (Tab, Enter/Space) work. No gestures.
- **Targets:** seat button `max(56, 100k)` x `max(56, 50k)` px; animal button `max(56, 60k)` x `max(56, 80k)` px; the tree button covers about 176 x 248 board units.
- **Labels:** "Huśtawka – pchnij" (seat), "<animal name> – pchnij i pomachaj", "Drzewo – pokołysz"; decorative SVG is `aria-hidden`.
- **Focus:** `:focus-visible` outline 4px `#8f7fd1`.
- **Orientation:** the board has a fixed 400:300 aspect ratio, sized `min(100%, (100dvh - safe areas - 64px) * 400/300)`; works in portrait (smaller) and landscape.
- **Colour:** meaning is not carried by colour.
- **Reduced motion:** the swing, leaves, wave and sway are driven by a `requestAnimationFrame` loop and therefore continue under the global `prefers-reduced-motion` rule; the activity has no separate reduced-motion variant (motion is slow and amplitude-limited).
- **Reading:** none required; a young child can use it independently.
- **Limitation:** the tree is a large invisible button over the left half of the scene, so a tap anywhere over the tree (including its crown and trunk) sways it; there is no visual hint that it is touchable.

## 7. Risks and limitations

- Leaves have a fixed 18 px size (not scaled with the board).
- The ropes are a separate SVG layer (`.hs-ropes`) drawn from JavaScript each frame; their tops stay at fixed points on the branch and only the lower ends move with the seat.
- Visual check in a real browser is not documented.
- Random leaf placement uses `Math.random` and is not reproducible; this has no functional effect.

## 8. Configuration

No external configuration; constants live in [`js/hustawka.js`](../../js/hustawka.js) and require a code change. Nothing is stored; no fallback logic.

| Constant | Value | Purpose |
|---|---|---|
| `BW` x `BH` | 400 x 300 | Board units |
| `PX`, `PY`, `ROPE`, `ROPE_X` | 260, 112, 118, 26 | Pivot position, rope length and horizontal rope offset from the pivot (units) |
| `PERIOD` | 3.6 s | Swing period |
| `MAX_AMP`, `STEP` | 35, 8 degrees | Maximum amplitude, increment per push |
| `DRAIN`, `EASE` | 2.7 degrees/s, 2 per s | Target decay, amplitude easing rate |
| `LEAF_AMP`, `MAX_LEAVES`, `LEAF_GAP` | 20 degrees, 6, 0.9 s | Leaf threshold, pool size, spawn gap |
| `SWAY_T`, `WAVE_T` | 2.6 s, 1.6 s | Tree sway and wave durations |
| `MAX_DT` | 0.05 s | Frame time cap |
| `LEAF_COLS` | 6 colours | One fixed colour per pooled leaf |

## 9. Assets

No external asset files. Background (sky, cloud, hills, grass, tree trunk, branch), tree crown, seat SVG, rope SVG and leaves are inline SVG built in `scene()`, `crown()`, `swingSvg()`, the `.hs-ropes` markup in `mount()` and `leafSvg()`. The animal is built from `Animals.head(id, { body: true })` in `figure()`. The menu icon is inline SVG in `js/activities.js`. No fonts, audio or images.

## 10. Randomization and variants

- One animal is chosen with `Animals.pick(1)[0]` on every `mount` (13 animals, uniform; see [`js/animals.js`](../../js/animals.js) and [`js/random.js`](../../js/random.js)). Not persisted; the same animal can come up twice in a row.
- Leaf parameters are random per leaf: start x 40-160, start y 70-120, duration 5-7 s, drift 10-36, sway 8-16, rotation 40-120 degrees. The pool has 6 elements, each with a fixed colour.
- Nothing else is random.

## 11. Progression and difficulty

No progression or levels. The amplitude is a transient state only and is not stored.

## 12. Completion and feedback

- No completion state; open-ended.
- Feedback is visual only: swing motion, wave, tree sway, falling leaves.
- No failure; no sound; nothing starts automatically.

## 13. Analytics and metrics

This activity reports to the shared on-device module `js/analytics.js` (`window.Analytics`) through the app shell only: `js/app.js` records the activity start and end, and the module counts touches inside the stage. The activity file itself calls no `Analytics` function. Recorded for it: starts, active time, replays (re-opening in the same session), quick exits (within 10 s) and touches. It is open-ended, so no completion, level or exit-before-completion is defined for it. Data stays on the device as anonymous daily aggregates; see [README.md](README.md#analytics-status).

## 14. Technical implementation

- **Entry point:** `mount(container)` assigned to the registry entry `hustawka`; returns a cleanup function.
- **Rendering:** `.hs-board` with a background SVG (`viewBox 0 0 400 300`, including the crown group `.hs-crown`), a tree button, six pooled leaf spans and a fixed rope layer `.hs-ropes` (two lines `.hs-rl`/`.hs-rr` and two knobs at x = 260 +/- 26, y = 115) and one `.hs-swing` wrapper (seat SVG, seat button, animal button) that is rotated by CSS `transform: rotate()` about its top centre. In `paint()` the lower rope ends are set to the rotated seat positions (same pivot and angle), so the rope tops never move.
- **State:** `amp`, `target`, `phase`, `theta`, `swayT`, `waveT`, `sinceLeaf`, `leaves[]`.
- **Animation:** one `requestAnimationFrame` loop (`frame`/`paint`), capped dt, stops itself when idle and is restarted by `start()` on a touch; paused while the tab is hidden.
- **Events:** `click` on the seat, animal and tree buttons; `resize`/`orientationchange` call `layout()`.
- **Cleanup:** cancels the frame, removes the window/document listeners and removes the root node.
- **Dependencies:** `window.Animals`. No persistence or analytics integration. See [shared platform behaviour](README.md#shared-platform-behaviour).

## 15. Responsive layout and coordinate system

- Board 400 x 300 units, scale `k = board.clientWidth / 400`.
- The swing wrapper is `max(56, 100k)` px wide, centred on the pivot (260, 112) units, and `(118 + 12) * k` px high; the seat SVG inside is 100 units wide.
- The animal button is anchored to the seat position (bottom at `ROPE * k + 6k`), the seat button is centred on the seat line.
- Leaves are positioned in board units times `k` in the board's pixel space; their 18 px size is not scaled.
- The tree button spans x 12-188, y 14-262 units, matching the drawn tree.
- On resize or orientation change `layout()` recomputes sizes; the swing continues from its current angle.

## 16. Error and edge-case handling

- Resize/orientation change: handled by `layout()`; motion state is kept.
- Backgrounding: loop paused while hidden and resumed with a fresh `last`; dt capped at 0.05 s.
- Rapid repeated pushes: bounded by the 35 degree cap; leaves are bounded by the 6-element pool.
- Push at rest: the phase is reset to 0 so the swing starts smoothly from the centre.
- Missing assets / empty pools: not applicable (inline SVG).
- Unsupported features: none specific; uses CSS transforms, SVG and `requestAnimationFrame`.

## 17. Testing

No automated tests exist (see [shared platform behaviour](README.md#shared-platform-behaviour)). PR [#161](https://github.com/BielinskiLukasz/child-page/pull/161) reports `node --check` and a stub-DOM simulation (12 pushes: maximum 34.1 degrees, at most 6 leaves, at most 1 degree per frame, back to rest and loop stopped about 14 s after the last push) and states that no browser was available.

Manual scenarios (all unchecked):

- [ ] Normal: touch the seat once; the swing moves slowly, with one swing taking about 3.6 s, and settles after about 14-15 s.
- [ ] Touch the animal; it waves and the swing is pushed.
- [ ] Repeated pushes: tap about 6 times quickly; the swing rises but not above about 35 degrees and leaves begin to fall.
- [ ] Touch the tree; the crown sways once and the swing is unaffected.
- [ ] Completion: confirm there is no end state; the swing returns to rest on its own.
- [ ] Incorrect interaction: tap the sky or grass; nothing happens.
- [ ] Restart: leave with Back and re-enter; the swing is at rest, usually with a different animal.
- [ ] Randomization: enter several times; the animal varies; falling leaves differ in path.
- [ ] Progression: confirm there is none.
- [ ] Portrait and landscape; rotate while swinging; the scene stays on screen and the swing continues.
- [ ] Highest amplitude: the rope tops stay on the branch and only the lower ends move with the seat.
- [ ] Touch and mouse; keyboard Tab and Enter/Space on seat, animal and tree.
- [ ] Background the tab while swinging and return; no jump.
- [ ] Browsers: Chrome desktop, Chrome Android, Safari iPhone/iPad.
- [ ] Reduced motion enabled in the OS: the swing and leaves still move.

## 18. Known limitations and open issues

**Confirmed**

- No automated tests; no documented real-device verification.
- Leaf size is fixed at 18 px.

**Requires verification**

- Appearance of the rope/branch attachment at the highest amplitude on real devices (fixed rope tops are implemented, but no real-device check is documented).

## 19. Planned improvements

None currently planned (no open issue).

## 20. Related activities and reusable components

- Similar scenes: [Karuzela](karuzela.md), [Zjeżdżalnia](zjezdzalnia.md), [Latawiec](latawiec.md).
- Shared helper: [`js/animals.js`](../../js/animals.js) (`Animals.pick`, `Animals.head`), which uses [`js/random.js`](../../js/random.js). The animal sprite builder `figure()` is duplicated in `zjezdzalnia.js` and `hustawka.js`.

## 21. Change history

- Issue #98, PR [#161](https://github.com/BielinskiLukasz/child-page/pull/161): activity added (commit ad2ff47).
- Issue [#167](https://github.com/BielinskiLukasz/child-page/issues/167) (closed) / PR [#173](https://github.com/BielinskiLukasz/child-page/pull/173) (merged): ropes anchored at fixed points on the branch with only the lower end moving (`ROPE_X`, `.hs-ropes`).
