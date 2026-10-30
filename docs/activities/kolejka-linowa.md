# Kolejka Linowa

## 1. Overview

| Property | Value |
|---|---|
| Display name | Kolejka Linowa |
| Internal ID | `kolejka` (entry in [`js/activities.js`](../../js/activities.js)); source file `js/kolejka.js`, CSS prefix `kl-` |
| Description | A small gondola with a bear and a rabbit glides along a cable between a valley station and a peak station on a pastel mountain with three pine trees and drifting clouds. |
| Category | Open-ended play, cause and effect |
| Interaction type | Tap / click (real buttons, so Enter and Space also work) |
| Status | Implemented; enabled by default in the menu (no `defaultOff`) |

## 2. Business purpose

Kolejka Linowa is the mountain member of the vehicle group. Unlike the looping vehicles it travels back and forth on a straight line with two stations, which gives a clear "from here to there" structure: the child can send the gondola to either station, where a door opens, or let it shuttle on its own with a 3 s pause at each end. All speed changes are smooth, the gondola can never leave the cable, and nothing can go wrong.

## 3. Activity flow

1. The child opens the activity (`#kolejka`); `mount` builds the scene and starts one `requestAnimationFrame` loop.
2. The scene shows a mountain with a snow cap, a valley station at the lower left (at 20 % of the width) and a peak station at the upper right (80 %), a cable between them, three pine trees on the grass, three clouds drifting slowly, and the gondola waiting at the **valley station** with the door closed.
3. The child can touch the gondola hull, a station, the bear or the rabbit in the windows, or a tree.
4. Touching the gondola while it waits starts it (2 s ramp) towards the other station; it pauses 3 s at each station (the door opens, then closes before departure) and keeps shuttling. Touching it while it moves brakes it to a halt on the cable, where it sways gently; touching it again continues in the same direction. Touching a station sends the gondola there (braking first if it is heading away) and it waits with the door open. Touching an animal makes it wave (2.6 s). Touching a tree makes it sway once (2 s).
5. There is no formal completion state.
6. The shuttle continues until the child stops it or sends it to a station.
7. The activity does not reset itself and nothing is randomised (section 10).
8. The child leaves with Back (see [shared platform behaviour](README.md#shared-platform-behaviour)).

## 4. Rules and behavior

| Rule | Value |
|---|---|
| Cruise speed | `VC = 1/12` cable fractions per second; a full trip takes about 13.5 to 14 s including the ramps |
| Acceleration ramp | `RAMP = 2` s (smoothstep) |
| Braking | the gondola brakes over a distance of at most one second of travel (`D = min(v·1.0, remaining)`), duration `T = 2·D/v` (about 2 s at cruise speed); it also brakes automatically before the end station |
| Pause at a station while shuttling | `DWELL = 3` s |
| Door open / close | `DOOR_S = 1.2` s |
| Door hold after touching the current station | `HOLD_S = 1.5` s |
| Sway while stopped on the cable | `SWAY_MAX = 3.2` deg, period 4.5 s; amplitude eases in and out at 2 deg/s |
| Animal wave | `WAVE_S = 2.6` s |
| Tree sway | `TREE_S = 2` s (7 deg decaying, 1.5 cycles) |
| Frame step cap | `MAX_DT = 0.05` s |
| Clouds | 3, crossing the scene in 150, 120 and 180 s respectively |

Details:

- **Position model.** The position is a fraction `p` of the cable (0 = valley station, 1 = peak station), so the gondola always stays on the cable and keeps its relative place after a resize or rotation. It never reverses in the middle of a trip.
- **Gondola touch** (`onCar`): while moving it stops (`brakeStop`) and cancels any destination and the shuttle mode; while a delayed departure is waiting for the door it cancels it; during a station pause it ends the shuttle and leaves the door open; otherwise it starts the shuttle (`loop = true`), leaving a station in the direction of the other one or continuing in the current direction from the cable.
- **Station touch** (`onStation`): when the gondola is already at that station, the door opens for 1.5 s and closes and nothing else changes; otherwise the gondola goes there; if it is moving towards it, it continues; if away from it, it first brakes and then returns; if the door is open it closes first and then departs. Touching a station while the gondola is already slowing down keeps the slow-down and carries on to the destination.
- **At arrival** the door opens; when in shuttle mode the pause starts (`dwellT`), the door closes during the last 1.2 s of the 3 s pause and the gondola departs towards the other station.
- **Animals:** a touch is ignored while that animal is already waving. **Trees:** a touch is ignored while that tree is already swaying.
- **Reduced motion:** all motion is JS-driven; see section 6. **Sound:** none.

## 5. Educational and developmental benefits

**Intended design benefits** (from the activity design, not measured):

- Cause and effect: touching the gondola or a station changes its movement.
- Calm observation of slow, predictable movement between two places.
- Understanding "from one place to another" through two clearly marked stations.

**Directly observable behavior:**

- The gondola changes speed only through 2 s ramps and brakes smoothly.
- The door opens and closes visibly (1.2 s) at the stations.
- Animals wave and trees sway on touch.

**Requires professional or research-based validation:** any effect on attention, spatial understanding or planning. Not currently documented.

## 6. Accessibility and usability

- **Input.** `pointerdown` (touch, mouse, stylus) and `click` with `event.detail === 0` for keyboard activation. The hull, the two stations, both animals and the three trees are real `<button>` elements with Polish `aria-label`s and can be reached with Tab and activated with Enter or Space.
- **Touch handling.** `.kl` uses `touch-action: none`; no drag gesture. The gondola container has `pointer-events: none`; only the hull and the animal buttons capture touches.
- **Target sizes.** Gondola width `g = clamp(0.22·min(W, H), 136, 190)` px; the hull covers 132/160 x 108/150 of the gondola; animal buttons 56 x 56 px; stations `1.5·g` wide; trees `tw = clamp(0.1·min(W, H), 56, 96)` px wide, spaced at least `tw + 4` px apart.
- **Orientation.** Layout recomputed on `resize`/`orientationchange`.
- **Colour.** Nothing depends on colour alone; the two stations differ in position (and the labels in `aria-label`).
- **Reduced motion.** The gondola, door, sway, waves, tree sways and clouds are driven by the rAF loop and keep running under the global reduced-motion rule. No CSS animations are used by this activity. The motion is slow, but it is not reduced for users who asked for reduced motion.
- **Sound:** none. **Reading:** not required.
- **Limitations:** the animals' windows and the hull overlap (animals sit on top of the hull button); station and gondola can overlap at the stations, where the hull is the target above the station button (z-index 8 vs 5).

## 7. Risks and limitations

- **Accidental interactions:** at a station the gondola covers part of the station, so a touch there may hit the gondola instead of the station; the effect (start or stop) is harmless.
- **Unclear ending:** the activity never ends.
- **Visual stimulation:** low; the sway is at most 3.2 degrees and slow.
- **Performance:** one always-running rAF loop; the SVG scene is redrawn only on resize.
- **Privacy:** nothing is stored.

## 8. Configuration

No external configuration; constants in [`js/kolejka.js`](../../js/kolejka.js).

| Name | Purpose | Type | Default |
|---|---|---|---|
| `VC` | Cruise speed (cable fractions/s) | number | `1/12` |
| `RAMP` | Time to get up to speed (s) | number | 2 |
| `DWELL` | Pause at a station while shuttling (s) | number | 3 |
| `DOOR_S` | Door open/close time (s) | number | 1.2 |
| `HOLD_S` | Door hold after touching the current station (s) | number | 1.5 |
| `SWAY_MAX` | Sway amplitude while stopped on the cable (deg) | number | 3.2 |
| `MAX_DT` | Frame step cap (s) | number | 0.05 |
| `WAVE_S`, `TREE_S` | Animal wave and tree sway durations (s) | number | 2.6, 2 |
| `cloudU`, `cloudSpd`, `cloudY` | Cloud start positions, speeds (per s), heights | arrays | 3 entries each |

There is no fallback because there is no external input.

## 9. Assets

No external asset files. The gondola (with the bear and rabbit), the stations, trees and clouds are inline SVG strings in the JS file; the mountain, snow cap, hills and cable are SVG paths whose geometry is computed in `layout()`; the sky gradient is CSS (`.kl-*` rules in [`css/style.css`](../../css/style.css)). The two animals are drawn locally by `animalSvg`, not from `js/animals.js`. No audio, fonts or data files. No unused assets found.

## 10. Randomization and variants

None. The scene, animals (bear and rabbit), tree positions and cloud positions are the same on every launch.

## 11. Progression and difficulty

None. No levels or difficulty, and nothing persists between sessions. The gondola starts waiting at the valley station on every launch.

## 12. Completion and feedback

No formal completion state. Feedback is visual only: smooth speed changes, the door opening and closing at stations, the gentle sway when stopped on the cable, waving animals and swaying trees. No sound, no celebration, no automatic restart.

## 13. Analytics and metrics

This activity reports to the shared on-device module `js/analytics.js` (`window.Analytics`) through the app shell only: `js/app.js` records the activity start and end, and the module counts touches inside the stage. The activity file itself calls no `Analytics` function. Recorded for it: starts, active time, replays (re-opening in the same session), quick exits (within 10 s) and touches. It is open-ended, so no completion, level or exit-before-completion is defined for it. Data stays on the device as anonymous daily aggregates; see [README.md](README.md#analytics-status).

## 14. Technical implementation

- **Entry point:** `mount(container)` in [`js/kolejka.js`](../../js/kolejka.js), assigned to the `kolejka` registry entry; lazy-loaded via `src`/`deps` on its registry entry in js/activities.js. No shared helper is used.
- **Rendering:** DOM + inline SVG. The land and cable are full-scene SVG overlays; stations, trees and the gondola are positioned with inline `transform`; the door is an SVG rectangle scaled horizontally.
- **State:** closures: `p` (cable fraction), `dir`, `v`, `ramp`, `plan` (braking), `loop`, `dest`, `dwellActive`/`dwellT`, `door`/`doorTarget`, `pulse`, `goAfterDoor`, `swayAmp`, `waves[]`, `tsT[]`.
- **Control functions:** `startMove`, `depart`, `brakeStop`, `finishPlan`, `arrive`, `onCar`, `onStation`.
- **Animation:** one rAF loop `frame` with a capped dt; paused while hidden and restarted on `visibilitychange`.
- **Events:** `bind()` registers `pointerdown` and keyboard `click`; resize/orientation call `layout()`.
- **Cleanup:** cancels the rAF, removes listeners and the scene.
- **Persistence/config/analytics:** none.

## 15. Responsive layout and coordinate system

- The scene is `position: fixed; inset: 0`; `W`/`H` come from `clientWidth`/`clientHeight`.
- **Units:** CSS pixels. All SVG overlays use a `viewBox` of `0 0 W H` (1 unit = 1 px), so the land, the cable and the HTML elements share one coordinate space. The gondola is `cx = xv + p·(xp - xv)`, `cy = ya + p·(yb - ya)`, i.e. along the cable line from the valley station `(xv, ya)` to the peak station `(xp, yb)`.
- **Layout rules:** `xv = max(0.75·g + 8, 0.2·W)`; `xp = min(W - 0.75·g - 8, 0.8·W)`; the ground occupies the bottom 13 % of the height; the peak station is at `max(34, 0.09·H) + 0.25·g`; the mountain summit is placed just above the peak station.
- **Trees:** at 50 %, 73 % and 93 % of the width, pushed apart so the hit boxes never overlap.
- Tested sizes: Not currently documented.

## 16. Error and edge-case handling

- **Backgrounding:** the loop pauses while hidden and resumes without a jump.
- **Resize:** the gondola keeps its cable fraction and everything is recomputed.
- **Rapid input:** the state transitions in `onCar`/`onStation` handle repeated touches (PR [#157](https://github.com/BielinskiLukasz/child-page/pull/157) reports 30 rapid touches in a simulation); animal and tree reactions ignore touches while running.
- **Edge of the cable:** `p` is clamped to [0, 1] and braking starts automatically before the end stations.
- **Touch cancel / missing assets / invalid config:** not applicable.
- **Unhandled:** no fallback without `requestAnimationFrame`.

## 17. Testing

No automated tests exist for this activity (see [shared platform behaviour](README.md#shared-platform-behaviour)). PR [#157](https://github.com/BielinskiLukasz/child-page/pull/157) reports a node run against a stub DOM covering trip time, monotonic motion, stop and sway amplitude, restart, station touches (docked, from mid-cable, reversing), 30 rapid touches and cleanup, and asks for a device check of the portrait and landscape layout.

Manual checklist (not yet performed):

- [ ] Normal: open Kolejka Linowa; the gondola waits at the valley station with the door closed; touch it; it glides up to the peak station in about 14 s.
- [ ] At the peak station the door opens for about 3 s, closes, and the gondola travels back; the shuttle continues.
- [ ] Touch the moving gondola; it stops on the cable in about 2 s and sways gently; touch again; it continues in the same direction.
- [ ] Touch the opposite station while the gondola moves away from it; the gondola brakes and turns back to that station.
- [ ] Touch the station where the gondola is waiting; the door opens for about 1.5 s and closes.
- [ ] Touch the bear and the rabbit (waves) and each tree (one sway); repeat quickly; nothing stacks.
- [ ] Incorrect interaction: touch the mountain, clouds and sky; nothing happens.
- [ ] Completion: confirm there is no completion state.
- [ ] Restart: leave and re-enter; the gondola waits at the valley station again.
- [ ] Randomization and progression: confirm that nothing varies and nothing persists.
- [ ] Portrait and landscape: rotate while the gondola moves and while it waits; the gondola stays on the cable and the stations and trees are fully visible and do not overlap.
- [ ] Touch, mouse and keyboard (Tab through stations, gondola, animals and trees; Enter/Space).
- [ ] Background the tab during a trip; return without a jump.
- [ ] Reduced motion enabled: the gondola, door and clouds still move.
- [ ] Browsers: Chrome desktop, Chrome Android, Safari iPhone/iPad.

## 18. Known limitations and open issues

**Confirmed**

- No automated tests. Analytics is covered in section 13.
- The motion ignores the reduced-motion preference by design.
- The two animals are drawn locally rather than from `js/animals.js`.

**Requires verification**

- Overlap of the gondola and the station buttons at the stations (which element receives the touch) on different viewports.
- Layout on very short or very narrow viewports (geometry is computed from `min(W, H)` and the ground height).
- Frame rate on slow devices.

No open issue specifically concerns Kolejka Linowa; the metrics (#164), visual fixes (#167) and documentation (#168) issues are all merged or in review.

## 19. Planned improvements

None currently planned for this activity.

## 20. Related activities and reusable components

- Similar: [Mała Łódka](mala-lodka.md) and [Autobusik](autobusik.md) (stop at a place), [Traktor](traktor.md), [Rakieta](rakieta.md), [Łódź Podwodna](lodz-podwodna.md), [Balon](balon.md).
- Shared helpers: none used (`js/random.js` and `js/animals.js` are not referenced).
- Shared pattern: rAF loop with a capped dt; position stored as a fraction so it survives resizing.

## 21. Change history

- [#94](https://github.com/BielinskiLukasz/child-page/issues/94) / PR [#157](https://github.com/BielinskiLukasz/child-page/pull/157): Kolejka Linowa activity added (single commit `6db0e60`, no later changes to `js/kolejka.js`).
