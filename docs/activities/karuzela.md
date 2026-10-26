# Karuzela

## 1. Overview

| Item | Value |
|---|---|
| Display name | Karuzela |
| Activity ID | `karuzela` (`js/activities.js`) |
| Description | A pastel merry-go-round with a striped roof, bunting and four random animals. It turns in place when touched. |
| Category | Open-ended play, cause and effect, calm observation |
| Interaction type | Tap (start/stop), drag around the carousel (turn by hand), tap an animal |
| Status | Implemented; enabled in the menu by default (no `defaultOff`) |

Source: [`js/karuzela.js`](../../js/karuzela.js), CSS prefix `kz-` in [`css/style.css`](../../css/style.css), registry entry in [`js/activities.js`](../../js/activities.js), script tag in [`index.html`](../../index.html). Introduced by issue #96 / PR [#159](https://github.com/BielinskiLukasz/child-page/pull/159).

## 2. Business purpose

- Offers a slow, predictable "ride" the child can start and stop, and a manual way to turn it, giving a direct cause-and-effect loop without any goal.
- The motion is deliberately gentle: one full turn takes 18 s, speed changes are eased over 2-3 s, and the direction never reverses.
- Complements the other playground scenes ([Zjeżdżalnia](zjezdzalnia.md), [Huśtawka](hustawka.md)) with a continuous rotating motion rather than a single triggered action.

## 3. Activity flow

1. The child opens the tile; `mount(container)` builds the scene and starts the animation loop.
2. The carousel stands at rest, with four randomly chosen animals on seats and gently swaying bunting.
3. The child can touch the carousel body, drag around it, or touch an animal.
4. Tap on the carousel: it eases up to full speed over 2 s. Tap while it turns (or coasts): it eases to a stop over 3 s. Dragging turns it with the finger. Tapping an animal makes it hop or wave once.
5. There is no completion state; the activity is open-ended.
6. Nothing ends or resets; the cycle (rest, turn, stop) can repeat indefinitely.
7. Re-entering the activity creates a new scene with a new random animal selection.
8. The child leaves with the Back button (see [shared platform behaviour](README.md#shared-platform-behaviour)).

## 4. Rules and behavior

| Interaction | Behaviour |
|---|---|
| Tap on the carousel body (`.kz-hull`) at rest | Ramp to full speed `WMAX` = 2π/18 rad/s over `T_UP` = 2 s (smoothstep easing), then keeps turning. |
| Tap while ramping up or coasting | Ramp down to rest over `T_DOWN` = 3 s. Tap during a ramp-down starts a new ramp-up from the current speed. |
| Drag (pointer moves 10 px or more from the press point) | Mode `drag`: the turn angle follows the finger; per frame it never advances faster than `WMAX`; if the finger gets more than 0.6 rad ahead the grip is shifted. |
| Release after a drag | Forward momentum only: speed = clamp(estimated speed, 0, `WMAX`); decays exponentially with `COAST_TAU` = 0.9 s; below 0.003 rad/s it rests. A reverse drag leaves it at rest. |
| Tap on an animal | A reaction of `REACT_S` = 1.8 s: seats 0 and 2 hop up to `HOP` = 8 px; seats 1 and 3 raise a paw (rotation up to about 40 degrees). Ignored while that animal is already reacting. Rotation is unaffected. |
| Pointer cancel | Ends the gesture; if dragging, speed is set to 0 and the carousel rests. |

- Angle `th` grows in one direction only. Seats sit on an ellipse (x = sin, depth = cos) and always stay upright.
- Drag sensitivity: `angleDelta` converts horizontal finger movement to angle; touching in the front half (below the orbit centre) turns forward, in the back half the sign flips; a dead zone keeps the factor at least 0.5 in magnitude.
- Seat bobbing: up to `BOB` = 4 px up or down (8 px range), scaled by current speed, with a per-seat phase.
- Perspective: seat scale = 0.92 + 0.12 cos(angle); front seats (cos > 0) get a higher z-index (5 vs 3).
- Bunting: 9 flags rock by up to 5 degrees with a 6 s period, independent of the ride.
- No sound, no scoring, no failure state. See also [shared platform behaviour](README.md#shared-platform-behaviour).

## 5. Educational and developmental benefits

**Intended design benefits**

- Cause and effect: touching the carousel starts and stops it.
- Calm visual observation of slow, regular motion.
- Hand-eye coordination through dragging.

**Directly observable behavior**

- A tap changes speed smoothly (2 s up, 3 s down) rather than instantly.
- A drag follows the finger but cannot exceed full speed or reverse.
- Animals respond to touch without disturbing the ride.

**Requires professional or research-based validation**

- Any effect on attention, calm or development is not established by the code and is not claimed.

## 6. Accessibility and usability

- **Input:** touch, mouse and stylus via pointer events (`pointerdown/move/up/cancel` with pointer capture on the scene). Keyboard: the carousel body and each animal are `<button>` elements; Enter/Space produce a `click` with `detail === 0`, which toggles the ride or triggers the animal reaction. Dragging has no keyboard equivalent.
- **Targets:** seats are `max(56, 68 * k)` px square (`k` = board scale); the carousel body button covers 340 x 250 board units.
- **Labels:** the body button has `aria-label` "Karuzela – uruchom lub zatrzymaj"; each seat has "<animal name> na karuzeli"; decorative SVG is `aria-hidden`.
- **Focus:** `:focus-visible` outline 4px `#8f7fd1`.
- **Orientation:** works in portrait and landscape; the board is rescaled on `resize` and `orientationchange`.
- **Colour:** meaning is not carried by colour; animals are distinguished by shape and name.
- **Reduced motion:** the ride is driven by a `requestAnimationFrame` loop, so it keeps working under the global `prefers-reduced-motion` rule (which only disables CSS animation/transition). The activity therefore does not reduce its motion for users with that setting; the speed is already slow.
- **Reading:** none required; a young child can use it independently.
- **Limitations:** the scene sets `touch-action: none` and `user-select: none`, so the scene cannot be scrolled or zoomed by touch; no screen-reader description of the current rotation state.

## 7. Risks and limitations

- Continuous motion: the carousel can turn indefinitely once started (there is no auto-stop). Speed is low (18 s per turn) and there is no flashing.
- A drag that starts on an animal turns the carousel; only a short tap triggers the animal reaction (accidental drag vs tap threshold is 10 px).
- On very small or very wide-and-short screens seats are at least 56 px, so they can overlap when the board is scaled down (`k` is clamped at 0.3). Not verified on real devices.
- Visual check in a real browser is not documented (see section 17).

## 8. Configuration

The activity has no external configuration; the constants are inside [`js/karuzela.js`](../../js/karuzela.js) and cannot be changed without editing code. Nothing is read from storage; there is no fallback logic.

| Constant | Value | Purpose |
|---|---|---|
| `WMAX` | 2π/18 rad/s | Full speed (one turn in 18 s) |
| `T_UP` / `T_DOWN` | 2 s / 3 s | Time to reach full speed / to stop |
| `COAST_TAU` | 0.9 s | Momentum decay after a drag |
| `BOB` | 4 px | Seat bob amplitude (8 px range) |
| `HOP`, `REACT_S` | 8 px, 1.8 s | Animal reaction height and length |
| `MAX_DT` | 0.05 s | Frame time cap |
| `BW` x `BH` | 400 x 300 | Board units |
| `CX`, `ORB_R`, `ORB_Y`, `ORB_D` | 200, 118, 214, 20 | Orbit centre x, radius, feet baseline y, depth amplitude |
| `N`, `SEAT` | 4, 68 | Seat count; seat box in board units |

## 9. Assets

No external asset files. Everything is inline SVG generated in `mount` (background, roof with 8 alternating stripes, platform, pole, bunting) and animal heads from [`js/animals.js`](../../js/animals.js) (`Animals.head(id, { body: true })`). The menu icon is inline SVG in `js/activities.js`. No fonts, audio or images.

## 10. Randomization and variants

- On every `mount`, `Animals.pick(4, { distinct: true })` selects 4 unique animals from the 13-animal pool, preferring one per silhouette group (falls back to plain unique picks if there are too few groups). See [`js/animals.js`](../../js/animals.js) and [`js/random.js`](../../js/random.js) (`Rand.shuffle`).
- The pick is not stored; each visit gets a new selection and the same animal can recur between visits (no cross-visit repetition prevention).
- Seat order and positions are fixed (90 degrees apart); paws are attached to odd seats only.
- Nothing else is random.

## 11. Progression and difficulty

No progression, levels or difficulty. Nothing persists between sessions.

## 12. Completion and feedback

- No completion state; open-ended.
- Feedback is visual only: smooth speed changes, animal hop or wave, bobbing, swaying bunting.
- No failure or retry; no sound; nothing starts automatically.

## 13. Analytics and metrics

This activity reports to the shared on-device module `js/analytics.js` (`window.Analytics`) through the app shell only: `js/app.js` records the activity start and end, and the module counts touches inside the stage. The activity file itself calls no `Analytics` function. Recorded for it: starts, active time, replays (re-opening in the same session), quick exits (within 10 s) and touches. It is open-ended, so no completion, level or exit-before-completion is defined for it. Data stays on the device as anonymous daily aggregates; see [README.md](README.md#analytics-status).

## 14. Technical implementation

- **Entry point:** `mount(container)` in an IIFE; assigned to the registry entry whose `id === 'karuzela'`. Returns a cleanup function.
- **Rendering:** DOM plus several SVG layers inside `div.kz`: `.kz-bg` (hill and grass, sized in pixels), `.kz-flags`, `.kz-base`, `.kz-hull` button, four `.kz-seat` buttons, `.kz-top` (pole and roof, above seats).
- **State:** closure variables: `th` (angle), `om` (angular speed), `mode` (`rest | ramp | coast | drag`), ramp parameters, `react[4]`, bunting phase `ph`.
- **Animation:** one `requestAnimationFrame` loop (`frame`) with capped dt, updating transforms in `place()` each frame. It is cancelled while `document.hidden` and restarted on `visibilitychange`.
- **Events:** pointer events on the scene and `pointerdown` on the hull and seats (`down(e, src)`); `click` with `detail === 0` for keyboard activation; `resize`/`orientationchange` call `layout()`.
- **Cleanup:** cancels the frame, removes all listeners (including window/document ones) and removes the scene node.
- **Dependencies:** `window.Animals`, and `window.Rand` indirectly. No persistence, no analytics integration. See [shared platform behaviour](README.md#shared-platform-behaviour).

## 15. Responsive layout and coordinate system

- Logical board 400 x 300 units; scale `k = max(0.3, min(W/400, 0.9*H/300))`; board centred horizontally (`ox`) and slightly above centre vertically (`oy`).
- Base, roof/pole (`.kz-top`) and flags SVGs are positioned and sized in pixels from the board; seats are positioned with `transform: translate(...)` computed from the orbit in board units times `k`, anchored by the animal's feet (`FEET` = 83/86 of the seat box).
- The hill and grass background uses a pixel viewBox (`0 0 W H`), with the grass band as the bottom 12% of the height.
- Portrait and landscape both use the same fit rule; `layout()` is re-run on resize and orientation change, and the next frame redraws.

## 16. Error and edge-case handling

- Resize/orientation change: `layout()` recomputes everything; a ride in progress continues.
- Backgrounding: the loop stops and restarts on return with a fresh `last`, so the large time gap is not applied.
- Frame hitches: dt capped at 0.05 s.
- Touch cancellation: ends the gesture and rests the carousel if dragging.
- Multiple fingers: only the first pointer is tracked (`g` is set while a gesture is active; other `pointerdown` events are ignored).
- Repeated taps: toggling uses the current speed as the ramp start, so there are no jumps.
- Missing assets / empty pools: not applicable (inline SVG; `Animals.pick` always has 13 animals). `Animals.head` returns an empty string for an unknown id (not reachable here).
- `setPointerCapture` failures are caught and ignored.

## 17. Testing

No automated tests exist (see [shared platform behaviour](README.md#shared-platform-behaviour)). PR [#159](https://github.com/BielinskiLukasz/child-page/pull/159) reports `node --check` and a stub-DOM simulation at 800x500 and 360x640 (period 18.0 s, ramp/stop, reverse drag settles at rest, animal reaction) and states it was not checked in a real browser.

Manual scenarios (all unchecked):

- [ ] Normal: tap the carousel; it reaches steady speed in about 2 s and one turn takes about 18 s.
- [ ] Stop: tap again; it stops smoothly over about 3 s and never reverses.
- [ ] Tap an animal while turning: seats 1 and 3 wave a paw, seats 2 and 4 hop; the rotation does not change.
- [ ] Completion: confirm there is no end state and the ride can run for several minutes.
- [ ] Incorrect interaction: drag in the opposite direction; the carousel does not reverse and rests after release.
- [ ] Drag fast across the carousel; it never exceeds full speed and coasts to a stop in about 3 s.
- [ ] Restart: leave with Back and re-enter; scene is at rest with (usually) different animals.
- [ ] Randomization: enter several times; four different animals each time, no duplicates within a scene.
- [ ] Progression: confirm there is none and nothing persists after reloading.
- [ ] Portrait and landscape on a phone and a tablet; rotate while turning; seats stay at least 56 px and the scene stays on screen.
- [ ] Touch: single-finger tap and drag; a second finger is ignored.
- [ ] Mouse: click, drag, hover cursor.
- [ ] Keyboard: Tab to the carousel and animals, Enter/Space toggles the ride or the reaction.
- [ ] Background the tab while turning and return; no jump in angle.
- [ ] Browsers: Chrome desktop, Chrome Android, Safari iPhone/iPad.
- [ ] Reduced motion enabled in the OS: the carousel still turns and animals still react.

## 18. Known limitations and open issues

**Confirmed**

- No automated tests; no documented real-device verification.
- Issue [#167](https://github.com/BielinskiLukasz/child-page/issues/167) (open) requests that animals are drawn lower the closer they are to the front of the carousel (6-10% of animal height); this is not in `main`. The current code only varies scale (0.92 to 1.04) with depth.
- No keyboard way to turn the carousel by hand.
- Touching the carousel never auto-stops it.

**Requires verification**

- Seat overlap and drag feel on very small portrait screens and on real touch devices.

## 19. Planned improvements

- Depth-dependent vertical offset of the animals: issue [#167](https://github.com/BielinskiLukasz/child-page/issues/167), pull request [#173](https://github.com/BielinskiLukasz/child-page/pull/173) (open).

## 20. Related activities and reusable components

- Other playground scenes: [Zjeżdżalnia](zjezdzalnia.md), [Huśtawka](hustawka.md), [Latawiec](latawiec.md), [Wiatraczki](wiatraczki.md) (also a rotating, touch-started motion).
- Shared helpers: [`js/animals.js`](../../js/animals.js) (`Animals.pick`, `Animals.head`), which uses [`js/random.js`](../../js/random.js).
- The single `requestAnimationFrame` loop with capped dt and `visibilitychange` restart is the common pattern for these scenes.

## 21. Change history

- Issue #96, PR [#159](https://github.com/BielinskiLukasz/child-page/pull/159): activity added (commit 69c94ef).
- Issue [#167](https://github.com/BielinskiLukasz/child-page/issues/167) / PR [#173](https://github.com/BielinskiLukasz/child-page/pull/173): open visual improvements, not on `main`.
