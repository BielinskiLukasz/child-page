# Zegar z Kukułką

## 1. Overview

| Item | Value |
|---|---|
| Display name | Zegar z Kukułką |
| Activity ID | `kukulka` (`js/activities.js`) |
| Description | A wooden cuckoo clock on a pastel wall with a clock face (two hands), a swinging pendulum and three little doors; a bird, a mouse and a bear come out of the doors when touched. |
| Category | Open-ended play, cause and effect, exploratory |
| Interaction type | Tap (doors, hands, pendulum) |
| Status | Implemented; enabled in the menu by default (no `defaultOff`) |

Source: [`js/kukulka.js`](../../js/kukulka.js), CSS prefix `kk-` in [`css/style.css`](../../css/style.css), registry entry in [`js/activities.js`](../../js/activities.js) (lazy-loaded via `src`/`deps` on its registry entry in js/activities.js). Introduced by issue #101 / PR [#166](https://github.com/BielinskiLukasz/child-page/pull/166). Note that the file name is `zegar-z-kukulka.md` but the activity ID and script are `kukulka`.

## 2. Business purpose

- A small "surprise" scene: three separate things to touch, each with a clear, slow response (a door opens and a character waves; the hands turn; the pendulum swings wider).
- Characters are told apart by shape (bird: beak and tuft; mouse: big round ears, thin tail and pointed snout; bear: small ears), not by colour alone.
- Differs from the playground scenes ([Karuzela](karuzela.md), [Zjeżdżalnia](zjezdzalnia.md), [Huśtawka](hustawka.md)) by having several independent touch targets that can run at the same time.

## 3. Activity flow

1. The child opens the tile; `mount(container)` builds the scene and starts the loop immediately.
2. The clock shows the hands at about 10:10, the pendulum swings at its normal amplitude, and the three doors (top, left, right) are closed.
3. The child can touch a door, the clock face (hands), or the pendulum.
4. Door: opens (1 s), the character rises (0.6 s), waves twice (1.8 s), sinks (0.6 s), the door closes (1 s): 5 s in total. Hands: the minute hand turns 90 degrees slowly. Pendulum: swings wider for 4 s.
5. There is no completion state.
6. After a door sequence ends the door can be touched again; hands and pendulum can be touched at any time.
7. A new scene starts each time the activity is opened; there is nothing to restart.
8. The child leaves with the Back button (see [shared platform behaviour](README.md#shared-platform-behaviour)).

## 4. Rules and behavior

| Element | Behaviour |
|---|---|
| Doors | Top (bird) at board (200, 62), left (mouse) at (50, 196), right (bear) at (350, 196). Timeline per door: open 1 s (`T_OPEN`), character out 0.6 s (`T_OUT`), wave 1.8 s (`T_WAVE`, two waves), back in 0.6 s (`T_IN`), close 1 s (`T_CLOSE`); total `T_ALL` = 5 s. The door leaf is scaled horizontally to 8% about its hinge (left hinge for top and left doors, right hinge for the bear door). |
| Busy door | Touching a door that is already running does nothing (no restart). Different doors run independently and can be open at the same time. |
| Character | Slides from y = 100 to y = `UP` = 56 of the door box (44 units) with smoothstep easing, so the roughly 43-unit body fills the 56-unit opening with its top at y = 13, below the upper edge at y = 8; shown only while it is out. It is clipped by a rectangle that ends at y = 60 of the 72-unit door box, so it appears to emerge from the opening. |
| Minute hand | Each touch adds 90 degrees to the target (`minTarget`); touches queue (no limit). Motion is slew-limited: acceleration `HAND_ACC` = 45 degrees/s^2, maximum `HAND_MAX` = 30 degrees/s, with deceleration so it arrives smoothly; it never moves backwards. |
| Hour hand | Follows at 1/12 of the minute hand's rotation. Start angles: minute 60, hour 305 degrees clockwise from 12 (about 10:10). |
| Pendulum | Period `PERIOD` = 2.4 s; normal amplitude `AMP0` = 11 degrees. A touch sets the target to `AMP1` = 24 degrees for `BOOST_T` = 4 s, then back to 11; amplitude eases with rate `AMP_EASE` = 1.6 per second. |

- No sound, scoring, failure or time-of-day logic: the clock does not show the real time and does not strike.
- Touching a character above a door does not trigger anything; only the door box is a button (noted in PR [#166](https://github.com/BielinskiLukasz/child-page/pull/166)).

## 5. Educational and developmental benefits

**Intended design benefits**

- Cause and effect across three different controls.
- Calm observation of slow, regular motion (pendulum, hands) and of a short "peek-a-boo" sequence.
- Telling characters apart by shape.

**Directly observable behavior**

- Doors, hands and pendulum respond to a touch with slow, eased movement and cannot be restarted or broken by repeated touches.
- The hour hand moves with the minute hand, in the correct 1:12 ratio.

**Requires professional or research-based validation**

- The clock does not teach reading time (it does not show or ask for a time). Any benefit for time understanding, attention or development is not established by the code and is not claimed.

## 6. Accessibility and usability

- **Input:** `click` on `<button>` elements, so touch, mouse, stylus and keyboard (Tab, Enter/Space) all work. No gestures or multi-touch.
- **Targets:** door buttons `max(64, 72k)` px square; hands button `max(56, 92k)` px circle over the clock face; pendulum button `max(56, 96k)` x `max(56, 76k)` px centred at (200, 240).
- **Labels:** "Górne drzwiczki – otwórz", "Lewe drzwiczki – otwórz", "Prawe drzwiczki – otwórz", "Wskazówki – przekręć", "Wahadło – pchnij"; the scene SVG is `aria-hidden`.
- **Focus:** `:focus-visible` outline 4px `#8f7fd1`.
- **Orientation:** the board keeps its 400:300 ratio and is sized `min(100%, (100dvh - safe areas - 64px) * 400/300)`; works in portrait (smaller) and landscape.
- **Colour:** doors have different leaf colours but the three characters differ by shape.
- **Reduced motion:** all motion is driven by a `requestAnimationFrame` loop and is therefore not disabled by the global `prefers-reduced-motion` rule; there is no separate reduced-motion variant (the motion is slow and bounded). Note the pendulum swings continuously even without touch.
- **Reading:** none required; usable independently by a young child (door labels are for assistive technology only).
- **Limitation:** the tiny clock tick marks have no numerals, and nothing communicates the time to assistive technology.

## 7. Risks and limitations

- Continuous gentle motion: the pendulum always swings and the loop never stops while the activity is open.
- The hands target can accumulate many queued quarter turns if the child taps repeatedly; the hand keeps turning slowly (max 30 degrees/s) until it catches up.
- Characters rise only until fully visible in the opening (`UP` = 56); the top of a bird or mouse stays below the door's upper edge (fixed on `main`, issue [#167](https://github.com/BielinskiLukasz/child-page/issues/167), PR [#173](https://github.com/BielinskiLukasz/child-page/pull/173)).
- Visual check in a real browser is not documented.

## 8. Configuration

No external configuration; constants live in [`js/kukulka.js`](../../js/kukulka.js) and require a code change. Nothing is stored; no fallback logic.

| Constant | Value | Purpose |
|---|---|---|
| `BW` x `BH` | 400 x 300 | Board units |
| `FX`, `FY`, `FR` | 200, 150, 46 | Clock face centre and radius |
| `PX`, `PY`, `PL` | 200, 204, 58 | Pendulum pivot and rod length |
| `PERIOD` | 2.4 s | Pendulum period |
| `AMP0`, `AMP1`, `BOOST_T`, `AMP_EASE` | 11, 24 degrees, 4 s, 1.6 per s | Pendulum amplitudes, boost time, easing |
| `HAND_ACC`, `HAND_MAX` | 45 deg/s^2, 30 deg/s | Minute hand slew limits |
| `MIN0`, `HOUR0` | 60, 305 degrees | Starting hand angles |
| `T_OPEN`, `T_OUT`, `T_WAVE`, `T_IN`, `T_CLOSE` | 1, 0.6, 1.8, 0.6, 1 s | Door timeline (total 5 s) |
| `UP` | 56 | Feet height of an emerged character in door units (rest position is 100) |
| `DOOR_MIN` | 64 px | Minimum door button size |
| `DOORS` | 3 entries | Door id, position, label, character, leaf colour, hinge side |
| `MAX_DT` | 0.05 s | Frame time cap |

## 9. Assets

No external asset files. The wall, clock case, face, hands, pendulum, doors and the three characters are inline SVG generated by `scene()`, `doorSvg()` and `characterSvg()`. This activity does not use [`js/animals.js`](../../js/animals.js). The menu icon is inline SVG in `js/activities.js`. No fonts, audio or images.

## 10. Randomization and variants

Nothing is randomized. The doors, characters and starting hand positions are fixed; every visit is identical. There are no variants.

## 11. Progression and difficulty

No progression or levels. The hand and pendulum state is transient and not stored.

## 12. Completion and feedback

- No completion state; open-ended.
- Feedback is visual only: door leaf, character slide, wave, hand rotation, pendulum amplitude.
- No failure or retry; touching a busy door is silently ignored. No sound. Nothing starts automatically except the pendulum swing.

## 13. Analytics and metrics

This activity reports to the shared on-device module `js/analytics.js` (`window.Analytics`) through the app shell only: `js/app.js` records the activity start and end, and the module counts touches inside the stage. The activity file itself calls no `Analytics` function. Recorded for it: starts, active time, replays (re-opening in the same session), quick exits (within 10 s) and touches. It is open-ended, so no completion, level or exit-before-completion is defined for it. Data stays on the device as anonymous daily aggregates; see [README.md](README.md#analytics-status).

## 14. Technical implementation

- **Entry point:** `mount(container)` assigned to the registry entry `kukulka`; returns a cleanup function.
- **Rendering:** one background SVG (`viewBox 0 0 400 300`) with the wall, case, face, hands (`.kk-hour`, `.kk-min`) and pendulum (`.kk-pend`); three door buttons each containing a 72 x 72 SVG (frame, character group `.kk-ch`, leaf `.kk-leaf`); two transparent buttons for the hands and the pendulum.
- **State:** `doors[]` (each with a timer `t`, -1 when idle), `minCur`/`minTarget`/`minVel`, `amp`/`ampTarget`/`boost`/`phase`.
- **Animation:** one `requestAnimationFrame` loop (`frame`/`paint`) with capped dt that runs for the whole time the activity is mounted (never idles) and is cancelled while `document.hidden`.
- **Events:** `click` on the door, hands and pendulum buttons; `resize`/`orientationchange` call `layout()`.
- **Cleanup:** cancels the frame, removes the window/document listeners and removes the root node.
- **Dependencies:** none other than the registry. No persistence or analytics integration. See [shared platform behaviour](README.md#shared-platform-behaviour).

## 15. Responsive layout and coordinate system

- Board 400 x 300 units, scale `k = board.clientWidth / 400`.
- The background SVG, the hand angles and the pendulum rotation use board units directly; the buttons are placed with `place(el, cx, cy, w, h)` from board centres times `k`, with minimum pixel sizes (64 px doors, 56 px others).
- Door SVGs use their own 72-unit viewBox with `overflow: visible`, so characters can extend outside the door box.
- Portrait and landscape use the same aspect-ratio rule; `layout()` re-runs on resize and orientation change.

## 16. Error and edge-case handling

- Resize/orientation change: `layout()` repositions buttons; door timelines and hand state continue.
- Backgrounding: the loop is cancelled while hidden and restarted with a fresh `last`; dt capped at 0.05 s.
- Rapid repeated input: a busy door ignores touches; repeated hand touches queue extra 90 degree steps; repeated pendulum touches restart the 4 s boost.
- Interrupted animation: not applicable (sequences cannot be interrupted).
- Missing assets / empty pools: not applicable (inline SVG).
- The clip path ids (`kk-clip-0..2`) are unique per door within one mount; if the activity were mounted twice the ids would repeat (not reachable in the app).

## 17. Testing

No automated tests exist (see [shared platform behaviour](README.md#shared-platform-behaviour)). PR [#166](https://github.com/BielinskiLukasz/child-page/pull/166) reports `node --check` and a stub-DOM simulation that verified the door timeline (leaf scale, character slide, no restart on a second touch), the hands (+90 degrees, at most 30 degrees/s, no backward motion) and the pendulum (11 to about 24 to 11 degrees), and states that no browser was available.

Manual scenarios (all unchecked):

- [ ] Normal: touch each door in turn; it opens in about 1 s, the character rises, waves twice, sinks and the door closes; the whole sequence takes about 5 s.
- [ ] Touch all three doors quickly; they run at the same time.
- [ ] Incorrect interaction: touch a door that is already open or moving; nothing restarts. Touch the character above a door; nothing happens.
- [ ] Hands: touch the face; the minute hand turns 90 degrees slowly and the hour hand follows; tap several times quickly and check that the hand never moves backwards or faster than about 30 degrees/s.
- [ ] Pendulum: touch it; the swing widens for about 4 s and eases back.
- [ ] Completion: confirm there is no end state.
- [ ] Restart: leave with Back and re-enter; doors are closed and the hands are at the start position (about 10:10).
- [ ] Randomization: confirm nothing varies between visits.
- [ ] Progression: confirm there is none.
- [ ] Portrait and landscape on phone and tablet; rotate during a door sequence; targets remain at least 56 px (doors 64 px).
- [ ] Touch and mouse; keyboard Tab and Enter/Space on all five buttons.
- [ ] Background the tab during a door sequence and return; the sequence continues without a jump.
- [ ] Browsers: Chrome desktop, Chrome Android, Safari iPhone/iPad.
- [ ] Reduced motion enabled in the OS: doors, hands and pendulum still move.

## 18. Known limitations and open issues

**Confirmed**

- No automated tests; no documented real-device verification.
- Only the door box is touchable; touching the character does nothing.
- The animation loop never idles.

**Requires verification**

- How the characters look at the clip edge on real devices (clip at y = 60 of 72 units).

## 19. Planned improvements

None currently planned.

## 20. Related activities and reusable components

- Similar multi-target scenes: [Karuzela](karuzela.md), [Huśtawka](hustawka.md) (pendulum motion), [Wiatraczki](wiatraczki.md).
- Shared components: none; `js/animals.js` and `js/random.js` are not used.

## 21. Change history

- Issue #101, PR [#166](https://github.com/BielinskiLukasz/child-page/pull/166): activity added (commit 519a854).
- Issue [#167](https://github.com/BielinskiLukasz/child-page/issues/167) / PR [#173](https://github.com/BielinskiLukasz/child-page/pull/173): fixed on `main`; the emerging character rises only to `UP` = 56 so it is fully visible in the opening.
