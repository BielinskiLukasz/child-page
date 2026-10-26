# Balon

## 1. Overview

| Property | Value |
|---|---|
| Display name | Balon |
| Internal ID | `balon` (entry in [`js/activities.js`](../../js/activities.js)); source file `js/balon.js`, CSS prefix `bn-` |
| Description | A hot-air balloon with a bear and a rabbit in the basket rests on a meadow under a pastel sky with four drifting clouds; touching it makes it rise slowly or float back down. |
| Category | Open-ended play, cause and effect, observation |
| Interaction type | Tap / click (real buttons, so Enter and Space also work) |
| Status | Implemented; enabled by default in the menu (no `defaultOff`) |

## 2. Business purpose

Balon is the vertical, "up and down" member of the vehicle group and the calmest of them: a single large object with a single main action (rise or descend) plus small side reactions (clouds that make way, animals that wave). It has no stations, loops or targets to reach. Its speed changes are limited by a maximum acceleration, so the balloon never jerks, which suits a very slow, gentle moment of play. Nothing can go wrong and nothing is scored.

## 3. Activity flow

1. The child opens the activity (`#balon`); `mount` builds the scene and starts one `requestAnimationFrame` loop.
2. The scene shows a pastel sky with four clouds drifting slowly, a meadow at the bottom and the balloon resting on the meadow in the middle of the screen.
3. The child can touch the balloon, a cloud, or the bear or the rabbit in the basket.
4. Touching the balloon on the ground makes it rise slowly while drifting gently sideways; a soft glow pulses under it while it climbs. Touching it in the air makes it float back down; touching it again reverses it smoothly. Touching a cloud makes it drift aside by about one cloud width and return over 8 s. Touching an animal makes it wave (2.8 s).
5. There is no formal completion state. At the top the balloon stays in the air (still swaying) until it is touched; on the meadow it stays put.
6. The child can repeat any of this as often as they like.
7. Nothing is randomised and the scene does not restart by itself.
8. The child leaves with Back (see [shared platform behaviour](README.md#shared-platform-behaviour)).

## 4. Rules and behavior

| Rule | Value |
|---|---|
| Cruise climb / descent speed | `VA = 1/15` altitude fractions per second (the top third takes at least about 12 s; a full climb about 15 s plus the eased ends) |
| Maximum change of speed | `ACC = 0.04` per second (full speed in about 1.7 s) |
| Slow-down zone | the last `EASE = 12 %` of the way up or down |
| Creep speed | `VMIN = 0.006` so that the end of the way is actually reached |
| Sideways drift cycle | `DRIFT_T = 40` s; amplitude `ampX = min(0.28·W, W/2 - bw/2 - 12)` px; fades in over the first 30 % of altitude |
| Tilt | up to 3 deg with the drift |
| Glow | pulses at `GLOW_HZ = 0.7` per second while rising; fades in or out over 1.2 s |
| Cloud drift | `CLOUD_T = 8` s, displacement `cloudW·sin²(π t / 8)` (about one cloud width and back) towards the middle of the screen |
| Animal wave | `WAVE_S = 2.8` s |
| Clouds | 4, crossing the scene in 170, 130, 200 and 150 s |
| Frame step cap | `MAX_DT = 0.05` s |

Details:

- **Altitude model.** Altitude is a fraction `a` (0 = on the meadow, 1 = top; top position `yTop = max(24, 0.05·H)`), and the speed `v` moves toward a target speed only by `ACC` per second. Modes: `ground`, `up`, `down`.
- **Balloon touch** (`onBalloon`): on the meadow it starts rising; otherwise it toggles between `up` and `down`. A rapid sequence of touches only reverses the speed smoothly. At the top the balloon stays in mode `up` with zero speed; the next touch makes it descend. When it reaches the ground in mode `down` it switches to `ground`.
- **Cloud touch** (`onCloud`): ignored while that cloud is already moving; it drifts towards the middle of the screen (where there is room).
- **Animals:** a touch is ignored while that animal is already waving.
- **Drift phase** `ph` advances whenever the balloon is above the ground and is not reset between lifts, so the sideways position at lift-off depends on earlier flights (noted in PR [#158](https://github.com/BielinskiLukasz/child-page/pull/158)).
- **Reduced motion:** all motion is JS-driven; see section 6. **Sound:** none.

## 5. Educational and developmental benefits

**Intended design benefits** (from the activity design, not measured):

- Cause and effect: touching the balloon makes it rise or descend.
- Calm observation of very slow, smooth movement.
- Gentle interaction with several parts of one scene.

**Directly observable behavior:**

- The balloon reaches the upper third in about 12 s or more and takes about 15 s or more to come down.
- Acceleration is limited, so a rapid series of touches never produces jerks.
- Clouds move away from the touch and come back; animals wave; a glow shows that the balloon is rising.

**Requires professional or research-based validation:** any claim about relaxation, attention or other developmental effects. Not currently documented.

## 6. Accessibility and usability

- **Input.** `pointerdown` (touch, mouse, stylus) and `click` with `event.detail === 0` for keyboard activation. The hull, the two animals and the four clouds are real `<button>` elements with Polish `aria-label`s (`Balon – wznieś się lub opuść`, `Miś w koszu`, `Króliczek w koszu`, `Chmurka`) and can be reached with Tab and activated with Enter or Space.
- **Touch handling.** `.bn` uses `touch-action: none`; no drag gesture. The balloon container has `pointer-events: none`; only the hull (180/200 x 268/280 of the balloon) and the animal buttons capture touches.
- **Target sizes.** The balloon is `bh = max(216, min(380, 0.52·H, 1.1·W))` px tall (about 154 to 271 px wide); animal buttons are 56 x 56 px; clouds are `cloudW = clamp(0.22·W, 120, 220)` px wide and half as tall.
- **Orientation.** Layout recomputed on `resize`/`orientationchange`; the balloon is clamped inside the screen horizontally.
- **Colour.** Nothing depends on colour alone.
- **Reduced motion.** The balloon, clouds, glow and waves are driven by the rAF loop and keep running under the global reduced-motion rule. No CSS animations are used by this activity. The motion is very slow, but it is not reduced for users who asked for reduced motion.
- **Sound:** none. **Reading:** not required.
- **Limitations:** a cloud behind the balloon is covered by the hull button and cannot be touched there; animals sit on top of the hull button.

## 7. Risks and limitations

- **Accidental interactions:** the hull covers nearly the whole balloon, so a touch anywhere on it toggles rise and descent (harmless).
- **Slow response:** because speed changes by at most 0.04 per second, a child may think a touch near the top or bottom has no effect for the first second.
- **Unclear ending:** the activity never ends; at the top the balloon stays up.
- **Visual stimulation:** low; the glow pulses at 0.7 Hz (below 1 Hz) at no more than about 0.85 opacity.
- **Performance:** one always-running rAF loop; scene updates are small.
- **Privacy:** nothing is stored.

## 8. Configuration

No external configuration; constants in [`js/balon.js`](../../js/balon.js).

| Name | Purpose | Type | Default |
|---|---|---|---|
| `VA` | Cruise climb/descent speed (altitude fractions/s) | number | `1/15` |
| `ACC` | Maximum speed change per second | number | 0.04 |
| `EASE` | Slow-down zone at each end | number | 0.12 |
| `VMIN` | Creep speed | number | 0.006 |
| `DRIFT_T` | Sideways drift cycle (s) | number | 40 |
| `GLOW_HZ` | Glow pulses per second | number | 0.7 |
| `CLOUD_T` | Cloud drift-and-return time (s) | number | 8 |
| `WAVE_S` | Animal wave duration (s) | number | 2.8 |
| `MAX_DT` | Frame step cap (s) | number | 0.05 |
| `cloudU`, `cloudSpd`, `cloudY` | Cloud start positions, speeds (per s), heights | arrays | 4 entries each |

There is no fallback because there is no external input.

## 9. Assets

No external asset files. The balloon with its basket and the bear and rabbit, and the clouds are inline SVG strings in the JS file; the meadow (hill and grass rectangles) is an SVG overlay sized in `layout()`; the sky gradient is CSS (`.bn-*` rules in [`css/style.css`](../../css/style.css)). The animals are drawn locally by `animalSvg`, not from `js/animals.js` (the PR notes that the shared module was not on `main` at the time). No audio, fonts or data files. No unused assets found.

## 10. Randomization and variants

None. The scene, the two animals and the cloud positions and speeds are the same on every launch.

## 11. Progression and difficulty

None. No levels or difficulty, and nothing persists between sessions. The balloon starts on the meadow on every launch.

## 12. Completion and feedback

No formal completion state. Feedback is visual only: the rise and descent, the sideways drift and slight tilt, the pulsing glow while rising, clouds making way and waving animals. No sound, no celebration, no automatic restart.

## 13. Analytics and metrics

On `main` this activity emits **no analytics events** (see [Analytics status](README.md#analytics-status)); PR [#172](https://github.com/BielinskiLukasz/child-page/pull/172) is open and not merged.

| Event | Emitted today |
|---|---|
| `activity_start`, `activity_end`, `activity_complete`, `activity_restart`, `interaction`, `level_start`, `level_complete` | No |

All metrics are **not supported**. Not implemented, for planning only: active time and `interaction` counts (balloon, cloud, animal), with no completion rate (reaching the top is not a completion). No identifying data should be collected.

## 14. Technical implementation

- **Entry point:** `mount(container)` in [`js/balon.js`](../../js/balon.js), assigned to the `balon` registry entry; loaded before `js/app.js`. No shared helper is used.
- **Rendering:** DOM + inline SVG. The meadow is an SVG overlay with a `viewBox` of `0 0 W H`; the balloon and clouds are positioned with inline `transform`; the glow is an SVG group whose opacity is set per frame.
- **State:** closures: `a` (altitude), `v`, `mode` (`ground`/`up`/`down`), `ph` (drift phase), `glowAmt`/`gp`, `waves[]`, `cloudU[]`, `cloudT[]`, `cloudDir[]`.
- **Animation:** one rAF loop `frame` with a capped dt; paused while hidden and restarted on `visibilitychange`.
- **Events:** `bind()` registers `pointerdown` and keyboard `click`; resize/orientation call `layout()`.
- **Cleanup:** cancels the rAF, removes listeners and the scene.
- **Persistence/config/analytics:** none.

## 15. Responsive layout and coordinate system

- The scene is `position: fixed; inset: 0`; `W`/`H` come from `clientWidth`/`clientHeight`.
- **Units:** CSS pixels. The balloon's top is `y = yGround + (yTop - yGround)·a`, where `yGround = gy + 0.55·gh - bh` seats the basket on the meadow (`gh = 0.13·H`, `gy = H - gh`). Horizontal centre `x0 = W/2` plus the drift, clamped to `[bw/2 + 4, W - bw/2 - 4]`. Clouds move as a fraction `cloudU` of `W + cloudW`.
- **Balloon geometry:** the balloon SVG has a 200 x 280 viewBox; the hull and animal buttons are positioned with the factor `s = bh / 280`.
- Tested sizes: Not currently documented (PR [#158](https://github.com/BielinskiLukasz/child-page/pull/158) reports a stub simulation at five viewports from 640x360 to 1920x1080).

## 16. Error and edge-case handling

- **Backgrounding:** the loop pauses while hidden and resumes without a jump.
- **Resize:** altitude is a fraction, so the balloon keeps its relative height; horizontal position is clamped.
- **Rapid input:** repeated balloon touches only reverse the speed within the acceleration limit (PR #158 reports 20 rapid taps staying smooth); cloud and animal reactions ignore touches while running.
- **Short screens:** `yTop` is limited so it never lies below the ground position.
- **Touch cancel / missing assets / invalid config:** not applicable.
- **Unhandled:** no fallback without `requestAnimationFrame`.

## 17. Testing

No automated tests exist for this activity (see [shared platform behaviour](README.md#shared-platform-behaviour)). PR [#158](https://github.com/BielinskiLukasz/child-page/pull/158) reports `node --check`, SVG strings parsed as XML, and a stub-DOM simulation at five viewports (640x360 to 1920x1080, portrait and landscape): the top third reached in 12 to 15 s, descent at least 15 s, balloon always inside the screen, glow at most 0.85 opacity at 0.7 Hz, 20 rapid taps staying smooth, cloud shift about one cloud width; it asks for a visual check on a device.

Manual checklist (not yet performed):

- [ ] Normal: open Balon; the balloon rests on the meadow; touch it; it rises very slowly, drifts sideways and a soft glow pulses beneath it.
- [ ] Wait until it reaches the top; it stays in the air and sways; touch it; it floats back down and settles on the meadow; touch again; it lifts.
- [ ] Touch the balloon several times quickly while rising and while descending; the movement reverses smoothly without jerks.
- [ ] Touch each of the four clouds; it moves aside by about its width and returns after about 8 s; touching it while moving does nothing.
- [ ] Touch the bear and the rabbit (a wave of about 2.8 s) on the ground and in the air.
- [ ] Incorrect interaction: touch the sky and the meadow; nothing happens.
- [ ] Completion: confirm there is no completion state.
- [ ] Restart: leave and re-enter; the balloon is on the meadow again.
- [ ] Randomization and progression: confirm that nothing varies and nothing persists.
- [ ] Portrait and landscape: rotate while on the ground, rising and at the top; the balloon stays fully on screen and the basket rests on the meadow.
- [ ] Short landscape screen (about 640x360): the balloon can still be touched and clouds are reachable.
- [ ] Touch, mouse and keyboard (Tab through the balloon, animals and clouds; Enter/Space).
- [ ] Background the tab during a climb; return without a jump.
- [ ] Reduced motion enabled: the balloon, clouds and glow still move.
- [ ] Browsers: Chrome desktop, Chrome Android, Safari iPhone/iPad.

## 18. Known limitations and open issues

**Confirmed**

- No automated tests; no analytics on `main`.
- The motion ignores the reduced-motion preference by design.
- The drift phase is not reset between flights (the lift-off position varies).
- A cloud that is behind the balloon cannot be touched there (the hull button is above it).
- The animals are drawn locally rather than from `js/animals.js`.

**Requires verification**

- Whether the very slow start (acceleration limited to 0.04 per second) is clear enough for a child that the touch worked.
- Layout on very short or very wide viewports.
- Frame rate on slow devices.

No open issue specifically concerns Balon (open: [#164](https://github.com/BielinskiLukasz/child-page/issues/164), [#167](https://github.com/BielinskiLukasz/child-page/issues/167), [#168](https://github.com/BielinskiLukasz/child-page/issues/168)).

## 19. Planned improvements

None currently planned for this activity.

## 20. Related activities and reusable components

- Similar: [Kolejka Linowa](kolejka-linowa.md) (same cloud, animal-wave and meadow drawing), [Łódź Podwodna](lodz-podwodna.md) (vertical movement), [Rakieta](rakieta.md), [Traktor](traktor.md), [Autobusik](autobusik.md), [Mała Łódka](mala-lodka.md).
- Shared helpers: none used (`js/random.js` and `js/animals.js` are not referenced).
- Shared pattern: rAF loop with a capped dt.

## 21. Change history

- [#89](https://github.com/BielinskiLukasz/child-page/issues/89) / PR [#158](https://github.com/BielinskiLukasz/child-page/pull/158): Balon activity added (single commit `991e7a7`, no later changes to `js/balon.js`).
