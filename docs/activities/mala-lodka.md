# Mała Łódka

## 1. Overview

| Property | Value |
|---|---|
| Display name | Mała Łódka |
| Internal ID | `lodka` (entry in [`js/activities.js`](../../js/activities.js)); source file `js/lodka.js`, CSS prefix `ld-` |
| Description | A small sailboat with a bear and a rabbit aboard floats along a calm river with soft waves, a little jetty and three ducks. |
| Category | Open-ended play, cause and effect |
| Interaction type | Tap / click (real buttons, so Enter and Space also work) |
| Status | Implemented; enabled by default in the menu (no `defaultOff`) |

## 2. Business purpose

Mała Łódka is the river member of the vehicle group. It repeats the "start, slow down, go to a destination" pattern of [Autobusik](autobusik.md) with a single destination (the jetty), plus gentle side interactions (ducks that nod and send out a ripple ring, animals that wave). The boat starts moored, so the child sees a calm still scene first and chooses when to set sail. Nothing can go wrong: the boat never moves backwards and there is no score.

## 3. Activity flow

1. The child opens the activity (`#lodka`); `mount` builds the scene and starts one `requestAnimationFrame` loop.
2. The boat starts **moored** at the jetty on the right of the river. Sun, clouds, two moving wave bands, a river bank, three ducks and the bear and rabbit aboard are visible.
3. The child can touch the boat hull, the jetty, a duck or an animal aboard.
4. Touching the boat sets sail (2.2 s ramp) or, if it is sailing, slows it to a halt where it is (2.2 s). Touching the jetty makes the boat sail on and glide in to moor there; touching a duck makes it nod and a ripple ring spread; touching an animal makes it wave.
5. There is no formal completion state.
6. The boat keeps looping (leaves on the right, re-enters from the left) until the child stops it or moors it.
7. The activity never resets by itself; there is nothing to randomise (see section 10).
8. The child leaves with Back (see [shared platform behaviour](README.md#shared-platform-behaviour)).

## 4. Rules and behavior

| Rule | Value |
|---|---|
| Loop time at cruise speed | `CROSS_S = 26` s (`V = 1/26` loop fractions per second); the boat crosses the visible width in about 15 s or more |
| Start / slow-down ramp | `RAMP_S = 2.2` s (smoothstep) |
| Gliding into the mooring | braking starts when the remaining distance `D <= 1.5·v`; duration `T = 2·D/v` (about 3 s at cruise speed) |
| Boat bob | `BOB = 3` px each way (6 px peak-to-peak), period 3.4 s; tilt up to 1.2 deg |
| Duck nod | `NOD_S = 2.2` s (rotation up to 12 deg, dip of 4 px) |
| Animal wave | `WAVE_S = 2.4` s (rotation up to 14 deg) |
| Ripple ring | `RING_S = 2.6` s; pool `MAX_RINGS = 6`; the oldest ring is recycled when all are in use |
| Frame step cap | `MAX_DT = 0.05` s |
| Ducks | 3, at `DUCK_POS = [[0.18, 0.74], [0.5, 0.85], [0.8, 0.76]]` (fractions of width and height); the middle duck is mirrored |
| Animals | 2 (bear, rabbit), at 20 % and 50 % of the boat width |

Details:

- **Boat touch** (`onBoat`): if the boat is stopped or is in a slow-down, it sets sail; otherwise (sailing or gliding to the jetty) it slows to a halt where it is and cancels any mooring request.
- **Jetty touch** (`onJetty`): ignored when already moored and still. Otherwise `target` is set (the last intent counts); a stopped boat starts sailing; a slowing boat accelerates again. If the jetty is too close to brake gently (`D < 1.25·v`) the `skip` flag makes the boat go round once (until `D > 0.9`) before mooring.
- **Never backwards:** braking uses a polynomial profile whose distance equals the remaining distance, and speed is clamped at 0.
- **Moored boat touched:** it sets sail again.
- **Ducks:** each duck keeps a small idle bob (2 px, period 3.8 s); touching starts a nod and a ring at the duck.
- **Reduced motion:** all motion is JS-driven; see section 6. **Sound:** none.

## 5. Educational and developmental benefits

**Intended design benefits** (from the activity design, not measured):

- Cause and effect: touch to sail, stop, moor, make a duck nod.
- Calm observation of slow, smooth movement on water.
- Independent play without failure.

**Directly observable behavior:**

- Ramps and gliding are slow (2.2 s, about 3 s); waves and bob are small (6 px peak-to-peak).
- Ducks and animals respond to touch with short, soft reactions.
- The boat can be stopped anywhere and always sails forwards.

**Requires professional or research-based validation:** any effect on attention or fine motor skills. Not currently documented.

## 6. Accessibility and usability

- **Input.** `pointerdown` (touch, mouse, stylus) and `click` with `event.detail === 0` for keyboard activation. The hull, the jetty, the animals and the ducks are real `<button>` elements with Polish `aria-label`s, reachable with Tab and activated with Enter or Space.
- **Touch handling.** `.ld` uses `touch-action: none`; no drag gesture. The boat container has `pointer-events: none` so only the hull and the animals (inside it) capture touches.
- **Target sizes.** Duck buttons `DS = clamp(0.11·H, 56, 76)` px square (fixed to at least 56 px in review, commit `3aa7cb3`); animals `AS = clamp(0.24·bw, 56, 72)` px; hull is the lower half of the boat (96 % of its width, 50 % of its height); jetty height at least 56 px.
- **Orientation.** Layout recomputed on `resize`/`orientationchange`; the moored boat is always fully on screen (`cm = max(bw/2, jetty x - 0.4·bw)`).
- **Colour.** Nothing depends on colour alone.
- **Reduced motion.** Boat, waves (background position), ducks, animals and rings are updated by the rAF loop through inline styles, so the global CSS rule does not stop them. The wave bands scroll continuously (`ph = clock·9` px/s). The motion is slow, but it is not reduced for users who asked for reduced motion.
- **Sound:** none. **Reading:** not required.
- **Limitations:** on very short screens the two animal buttons (centres 0.3·bw apart) overlap by a few pixels (reported as an optional review suggestion on PR [#132](https://github.com/BielinskiLukasz/child-page/pull/132) and not applied).

## 7. Risks and limitations

- **Accidental interactions:** the hull button covers the lower half of the boat and the animal buttons sit on top of it; touches on the animals never move the boat.
- **Unclear ending:** the activity never ends.
- **Hidden state:** a jetty touch just after the boat has passed makes the boat sail a whole loop (up to about 26 s) before mooring.
- **Visual stimulation:** two scrolling wave bands run continuously, even when the boat is moored.
- **Performance:** one always-running rAF loop with a handful of nodes.
- **Privacy:** nothing is stored.

## 8. Configuration

No external configuration; constants in [`js/lodka.js`](../../js/lodka.js).

| Name | Purpose | Type | Default |
|---|---|---|---|
| `CROSS_S` | Seconds per loop at cruise speed | number | 26 |
| `V` | Cruise speed (loop fractions/s) | number | `1 / CROSS_S` |
| `RAMP_S` | Start / slow-down ramp (s) | number | 2.2 |
| `NOD_S`, `WAVE_S`, `RING_S` | Duck nod, animal wave, ring durations (s) | number | 2.2, 2.4, 2.6 |
| `MAX_RINGS` | Ripple ring pool size | number | 6 |
| `MAX_DT` | Frame step cap (s) | number | 0.05 |
| `VB_W`, `VB_H` | Boat viewBox size | number | 200, 160 |
| `BOB` | Boat bob amplitude (px) | number | 3 |
| `AN_X` | Animal centres across the boat width | array | `[0.2, 0.5]` |
| `KINDS`, `NAMES` | Animals aboard and their labels | arrays | `['bear','rabbit']`, `['Miś','Króliczek']` |
| `DUCK_POS` | Duck positions (fractions of the scene) | array | 3 entries |

There is no fallback because there is no external input.

## 9. Assets

No external asset files. The boat, ducks, jetty and the two animals are inline SVG strings (the animals are drawn locally by `animalSvg`, not from `js/animals.js`); the two wave bands are generated data-URL SVGs (`waveUrl`) used as repeating backgrounds; the sky, sun, clouds, water, bank and rings are CSS (`.ld-*` rules in [`css/style.css`](../../css/style.css)). No audio, fonts or data files. One dead element exists in `jettySvg()` (a circle with radius 0).

## 10. Randomization and variants

None. The scene, the two animals (bear and rabbit) and the three duck positions are fixed on every launch.

## 11. Progression and difficulty

None. No levels, no difficulty and nothing persists between sessions. The boat starts moored on every launch.

## 12. Completion and feedback

No formal completion state. Feedback is visual only: sailing, slowing, gliding to the jetty and mooring, duck nods, expanding ripple rings, waving animals, the continuous boat bob and wave scrolling. No sound, no celebration, no automatic restart.

## 13. Analytics and metrics

This activity reports to the shared on-device module `js/analytics.js` (`window.Analytics`) through the app shell only: `js/app.js` records the activity start and end, and the module counts touches inside the stage. The activity file itself calls no `Analytics` function. Recorded for it: starts, active time, replays (re-opening in the same session), quick exits (within 10 s) and touches. It is open-ended, so no completion, level or exit-before-completion is defined for it. Data stays on the device as anonymous daily aggregates; see [README.md](README.md#analytics-status).

## 14. Technical implementation

- **Entry point:** `mount(container)` in [`js/lodka.js`](../../js/lodka.js), assigned to the `lodka` registry entry; lazy-loaded via `src`/`deps` on its registry entry in js/activities.js. No shared helper is used.
- **Rendering:** DOM + inline SVG; the boat, ducks and rings are positioned with inline `transform`; wave bands are `<div>`s with repeating SVG background images whose `background-position-x` is updated each frame.
- **State:** closures. Boat: `f` (loop fraction), `v`, `ramp`, `brake`, `target`, `skip`, `moored`. Ducks: `nod`; animals: `wave`; rings: `t`, `age` (pool of 6).
- **Animation:** one rAF loop `frame` with a capped dt, paused while hidden and restarted on `visibilitychange`.
- **Events:** `bind()` registers `pointerdown` and keyboard `click`; resize/orientation call `layout()` (a brake in progress is dropped and the boat re-accelerates from its current speed, no snap).
- **Cleanup:** cancels the rAF, removes listeners and the scene.
- **Persistence/config/analytics:** none.

## 15. Responsive layout and coordinate system

- The scene is `position: fixed; inset: 0`; `W`/`H` come from `clientWidth`/`clientHeight`.
- **Units:** CSS pixels for placement; boat position is the loop fraction `f` over a path `L = W + bw` (boat left = `f·L - bw`), so speed and mooring stay valid after resizing. Boat width `bw = min(clamp(0.42·W, 200, 300), 0.55·H)`; waterline `wl = 0.56·H`.
- **Jetty and mooring:** the jetty is `jw = clamp(0.28·W, 100, 220)` wide at the right edge; mooring fraction `fm = (cm + bw/2)/L`.
- **Ducks and rings:** ducks use fractions of the scene; rings are placed at the touched duck.
- Tested sizes: Not currently documented.

## 16. Error and edge-case handling

- **Backgrounding:** the loop pauses while hidden and resumes without a jump.
- **Resize during gliding:** the brake is re-planned from the current speed.
- **Rapid input:** repeated jetty touches are ignored once `target` is set; duck and animal reactions ignore touches while already running; touching the duck while all six rings are in use recycles the oldest ring.
- **Jetty too close:** handled by `skip`.
- **Touch cancel / missing assets / invalid config:** not applicable.
- **Unhandled:** no fallback without `requestAnimationFrame`.

## 17. Testing

No automated tests exist for this activity (see [shared platform behaviour](README.md#shared-platform-behaviour)). PR [#132](https://github.com/BielinskiLukasz/child-page/pull/132) reports `node --check` and a stub-DOM simulation in node (start moored, sail, monotonic motion, halt, resume, glide to the jetty and moor at the exact spot, bob range 6 px, ring cap of 6), and asks for a device check in portrait and landscape and after rotation.

Manual checklist (not yet performed):

- [ ] Normal: open Mała Łódka; the boat is moored at the jetty; touch the hull; it sets sail gently and crosses the width in about 15 s or more.
- [ ] Touch the sailing boat; it slows to a halt where it is; touch again; it sails on.
- [ ] Touch the jetty while sailing; the boat glides in and moors without reversing.
- [ ] Touch the jetty just after the boat has passed; it moors on the next loop.
- [ ] Touch the jetty while moored; nothing happens.
- [ ] Touch each duck (nod and a ripple ring); tap one duck rapidly more than six times; no ring is stuck.
- [ ] Touch the bear and the rabbit (wave).
- [ ] Incorrect interaction: touch water, sky and bank; nothing happens.
- [ ] Completion: confirm there is no completion state.
- [ ] Restart: leave and re-enter; the boat is moored again.
- [ ] Randomization and progression: confirm that nothing varies between visits and nothing persists.
- [ ] Portrait and landscape: rotate while sailing, gliding and moored; the boat stays on screen and the moored boat is not cut off by the jetty.
- [ ] Short landscape screen: check that the animal buttons do not interfere with each other.
- [ ] Touch, mouse and keyboard (Tab through the jetty, hull, animals and ducks; Enter/Space).
- [ ] Background the tab while sailing; return without a jump.
- [ ] Reduced motion enabled: boat, waves and ducks still move.
- [ ] Browsers: Chrome desktop, Chrome Android, Safari iPhone/iPad.

## 18. Known limitations and open issues

**Confirmed**

- No automated tests. Analytics is covered in section 13.
- The motion ignores the reduced-motion preference by design.
- On very short screens the two animal buttons overlap by a few pixels (review suggestion on PR #132, not applied).
- A dead element (zero-radius circle) remains in `jettySvg()`.
- The animals are drawn locally rather than from `js/animals.js`.

**Requires verification**

- Appearance of the jetty and boat overlap on different aspect ratios (flagged as a manual check in the PR).
- Frame rate on slow devices.

No open issue specifically concerns Mała Łódka; the metrics (#164), visual fixes (#167) and documentation (#168) issues are all merged or in review.

## 19. Planned improvements

None currently planned for this activity.

## 20. Related activities and reusable components

- Similar: [Autobusik](autobusik.md) (same loop-fraction and brake model), [Traktor](traktor.md), [Rakieta](rakieta.md), [Łódź Podwodna](lodz-podwodna.md), [Kolejka Linowa](kolejka-linowa.md), [Balon](balon.md).
- Shared helpers: none used (`js/random.js` and `js/animals.js` are not referenced).
- Shared pattern: rAF loop with a capped dt; position as a loop fraction.

## 21. Change history

- [#88](https://github.com/BielinskiLukasz/child-page/issues/88) / PR [#132](https://github.com/BielinskiLukasz/child-page/pull/132): Mała Łódka activity added; the review's blocking finding (duck targets under 56 px tall) was fixed in commit `3aa7cb3`.
