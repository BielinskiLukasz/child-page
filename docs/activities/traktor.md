# Traktor

## 1. Overview

| Property | Value |
|---|---|
| Display name | Traktor |
| Internal ID | `traktor` (entry in [`js/activities.js`](../../js/activities.js)) |
| Description | A little tractor with a random animal driver drives a closed serpentine loop over a three-row field and leaves sprouts that grow into flowers and carrots. |
| Category | Open-ended play, cause and effect, observation |
| Interaction type | Tap / click (also Enter and Space on the tractor, barn and driver) |
| Status | Implemented; enabled by default in the menu (no `defaultOff`) |

## 2. Business purpose

Traktor is one of the "vehicle" activities (Traktor, Autobusik, Rakieta, Mała Łódka, Łódź Podwodna, Kolejka Linowa, Balon) that give a young child a slow, predictable machine to start and stop by touch. Its particular contribution is a visible consequence of the child's action: the longer the tractor drives, the more of the field fills with growing plants, and when the field is full it quietly resets. The activity has no goal, score or time pressure; touching the barn, a plant or the driver adds small, harmless reactions.

## 3. Activity flow

1. The child opens the activity from the menu (`#traktor`); `mount` builds the scene and starts one `requestAnimationFrame` loop.
2. The scene shows a sky, a sun, a barn at the top left, a field with three furrows and the tractor parked at the left end of the first row. The field is empty (all 36 plant nodes are hidden). One of six animal drivers sits in the cab.
3. The child can touch the tractor, the barn, the driver (in the cab window) and any visible plant.
4. Touching the tractor starts it (2 s smooth acceleration) or, when it is moving, slows it to a halt (2 s). While driving it plants a sprout at each slot it crosses on a row; each sprout grows over 3 s. Touching the barn makes the tractor drive to the start position and park. Touching the driver makes the animal wave for 2.4 s. Touching a grown or growing plant makes it wiggle for 1.2 s.
5. There is no formal completion state. When all 36 plants are fully grown the field waits 1.5 s, fades all plants out over 3 s and starts again empty. No message is shown.
6. The cycle repeats for as long as the tractor keeps driving.
7. There is no restart control; the field restarts by itself (see above) and leaving and re-entering the activity builds a new scene with a new random driver.
8. The child leaves with the Back button (or browser Back); see [shared platform behaviour](README.md#shared-platform-behaviour).

## 4. Rules and behavior

| Rule | Value |
|---|---|
| Time to cross the visible width at cruise speed | `CROSS_S = 12` s (speed `V = W / 12` px/s, scaled with the scene width) |
| Start / stop ramp | `RAMP_S = 2` s, smoothstep (`sm`) easing; the tractor never reverses |
| Max frame step | `MAX_DT = 0.05` s |
| Route | One closed loop of 4 straight pieces and 4 U-turns over rows 1, 2, 3, 2 (then back to row 1); each U-turn is a half-ellipse sampled with `TURN_N = 24` segments of constant arc length |
| Plant slots | `SLOTS = 12` per row, 3 rows = 36 plants |
| Growth | `GROW_S = 3` s (smoothstep) |
| Plant wiggle | `WIG_S = 1.2` s, rotation `sin(2πk)·10°·(1−k)` |
| Driver wave | `WAVE_S = 2.4` s, arm rotation up to about -70° with a small oscillation |
| Field reset | `FULL_WAIT_S = 1.5` s after all plants are fully grown, then `FADE_S = 3` s fade of the plant layer |
| Wheel rotation | Driven by the odometer (`odo / 15` rad), rear wheel factor 0.8, front wheel 1.2 |

Rules in detail:

- **Tractor touch.** `onTractor` clears the parked flag and starts a ramp toward `V` (if stopped) or toward 0 (if moving or driving to the barn, `plan` set). Touches on the driver button are ignored by the tractor handler (guard on `.tk-dr`).
- **Barn touch.** `goBarn` computes the remaining distance `D` to the loop start and drives there along a cubic Hermite curve with duration `T = max(2.5, 1.2·D/V)` (capped so the initial speed is never exceeded in a way that would reverse); if the tractor is already within 1 px and slow it parks at once. When parked, a barn touch does nothing.
- **Planting.** `crossings` plants every unplanted slot passed on a row piece during a frame. It does nothing while the field is waiting to reset or fading. A planted slot is not replanted until the reset.
- **Plant kinds.** Slot kind is `(slot + row) mod 3`: 0 pink flower, 1 yellow flower, 2 carrot. A flower scales from 0.3 to 1 and its head fades in; a carrot's stem and leaves stay fixed (head opacity fades in over the first 20 % of growth) and the orange root scales down from the stem anchor (`CAR_TOP = 30`).
- **Wiggle** only starts on a plant that exists (`age >= 0`) and is not already wiggling.
- **Reduced motion.** Everything moves from the rAF loop and JS-set attributes (transform, opacity), so the activity animates fully under the global reduced-motion rule; see section 6.
- **Sound:** none.

## 5. Educational and developmental benefits

**Intended design benefits** (from the activity design, not measured):

- Cause and effect: touching the tractor starts and stops it; driving produces plants.
- Calm observation of slow, smooth motion and of growth.
- Simple independent play with large targets.

**Directly observable behavior:**

- The tractor takes 2 s to start or stop and crosses the screen in 12 s, so changes are gradual.
- Plants appear only where the tractor has just driven and take 3 s to grow.
- Every touch has a small, immediate, non-failing reaction (wiggle, wave, drive to the barn).

**Requires professional or research-based validation:** any claim about effects on attention, understanding of cause and effect or fine motor development. Not currently documented.

## 6. Accessibility and usability

- **Input.** Pointer events (`pointerdown`, touch, mouse and stylus) with `preventDefault`/`stopPropagation`, plus a `click` handler that only acts when `event.detail === 0` (keyboard activation). The tractor is a `div` with `role="button"` and `tabindex="0"` and also handles Enter and Space on `keydown`; the barn and the driver are real `<button>` elements. Plants are `aria-hidden` and are not keyboard reachable.
- **Touch handling.** `.tk` sets `touch-action: none` and disables text selection; there is no drag gesture.
- **Target sizes.** Plant hit boxes `.tk-pl` are 56 x 56 px; barn and driver have `min-width`/`min-height: 56px`; the tractor is `min(rh·1.6, 0.3·W, 230)` px wide. Plant hit boxes overlap on narrow screens (12 slots per row); a touch then goes to the topmost plant, which only wiggles (PR [#103](https://github.com/BielinskiLukasz/child-page/pull/103) notes this).
- **Orientation.** Layout is recomputed on `resize` and `orientationchange` (section 15).
- **Colour.** Plant kinds differ in shape (carrot vs. round flower) and colour; no information depends on colour alone.
- **Sound.** None; see [shared platform behaviour](README.md#shared-platform-behaviour).
- **Reduced motion.** The activity's own motion is not affected by the global rule because it uses a rAF loop and JS-set SVG attributes, not CSS animations or transitions. The scene therefore keeps moving for a user who asked for reduced motion; the motion is slow (2 s ramps, 12 s per width).
- **Focus.** `.tk-barn`, `.tk-tr`, `.tk-dr` have a 4 px focus outline.
- **Reading.** No reading required; accessible names (`aria-label`) are in Polish.
- **Limitations.** Plants cannot be reached by keyboard; the scene is not announced when plants grow.

## 7. Risks and limitations

- **Motion:** continuous slow motion; no flashing or rapid animation. The plant layer fade is 3 s.
- **Unclear ending:** the activity never ends; the field resets silently, which a child may not notice.
- **Overlapping plant targets** on narrow viewports (see section 6).
- **Performance:** one rAF loop running at all times (including while the tractor is parked), 36 pooled plant nodes and per-frame attribute updates for plants that are growing; no throttling on slow devices beyond the `MAX_DT` cap.
- **Privacy:** nothing is stored and no personal data is used.

## 8. Configuration

The activity has no external configuration; everything is a constant in [`js/traktor.js`](../../js/traktor.js). Values cannot be changed without editing the file.

| Name | Purpose | Type | Default | Location |
|---|---|---|---|---|
| `CROSS_S` | Seconds to cross the width at cruise speed | number | 12 | top of IIFE |
| `RAMP_S` | Start/stop ramp duration (s) | number | 2 | top of IIFE |
| `MAX_DT` | Frame step cap (s) | number | 0.05 | top of IIFE |
| `SLOTS` | Plant slots per row | number | 12 | top of IIFE |
| `GROW_S` | Plant growth duration (s) | number | 3 | top of IIFE |
| `WIG_S` | Wiggle duration (s) | number | 1.2 | top of IIFE |
| `WAVE_S` | Driver wave duration (s) | number | 2.4 | top of IIFE |
| `FULL_WAIT_S` | Pause after the field is full (s) | number | 1.5 | top of IIFE |
| `FADE_S` | Field fade-out duration (s) | number | 3 | top of IIFE |
| `TURN_N` | Segments per U-turn table | number | 24 | top of IIFE |
| `DRIVERS` | Driver animal drawings (6) | array of `{arm, svg}` | 6 entries | `DRIVERS` |
| `CAR_TOP` | Carrot stem anchor y (viewBox units) | number | 30 | `CAR_TOP` |

There is no fallback handling for invalid values because there is no external input. The enabled state and position in the menu are configured in the Settings (see [shared platform behaviour](README.md#shared-platform-behaviour)).

## 9. Assets

No external asset files. Everything is inline SVG generated in JS (`tractorSvg`, `barnSvg`, `plantSvg`, the six `DRIVERS` heads) and CSS (`.tk-*` rules in [`css/style.css`](../../css/style.css): sky gradient, sun, field gradient, furrows). The menu icon is inline SVG in `js/activities.js`. No fonts, audio, images or data files. No unused assets found.

## 10. Randomization and variants

- **What:** the driver animal, chosen once per `mount` with `Rand.pickOne(DRIVERS, 'traktor')`.
- **Pool:** 6 drawings (according to PR [#153](https://github.com/BielinskiLukasz/child-page/pull/153): bear, bunny, cat, pig, dog, mouse). The pool is local to the file and does not use `js/animals.js`.
- **Repetition:** `pickOne` never returns the item it returned last time for the key `traktor` in the same page session (pools of 2 or more). The memory is in memory only and is lost on reload.
- **Everything else is deterministic:** the route, plant slots and plant kinds are fixed.
- An empty pool would return `undefined` (not possible with the constant pool).

## 11. Progression and difficulty

No progression, levels or difficulty. The only state that accumulates is the number of planted slots, which resets when the field is full. Nothing persists between sessions.

## 12. Completion and feedback

There is no formal completion state, success criterion or failure. Feedback is visual only:

- The tractor accelerates, brakes and its wheels turn with the distance driven.
- Sprouts appear behind the tractor and grow; a touched plant wiggles; the driver waves; the barn touch drives the tractor home.
- A full field fades out and the field starts again automatically. No celebration, no sound.

## 13. Analytics and metrics

On `main` this activity emits **no analytics events** (see [Analytics status](README.md#analytics-status)); PR [#172](https://github.com/BielinskiLukasz/child-page/pull/172) is open and not merged.

| Event | Emitted today |
|---|---|
| `activity_start`, `activity_end`, `activity_complete`, `activity_restart`, `interaction`, `level_start`, `level_complete` | No |

All metrics (starts, active time, average active time per start, completions, completion rate, replays, exit-before-completion, highest level, interactions) are **not supported**. Not implemented, for planning only: for this open-ended activity the meaningful events would be active time, and `interaction` counts (tractor start/stop, barn, plant, driver) with no completion rate (the field reset is not a completion). No identifying data should be collected.

## 14. Technical implementation

- **Entry point:** `mount(container)` in [`js/traktor.js`](../../js/traktor.js), assigned to the `traktor` registry entry; loaded from `index.html` before `js/app.js`. Other sources: `js/random.js` (`Rand.pickOne`), `.tk-*` CSS rules in `css/style.css`, README entry 33.
- **Rendering:** DOM + inline SVG. 36 plant nodes are created once and shown/hidden with `visibility`; tractor and plants are positioned with inline `left/top` and `transform`.
- **State:** closure variables: `s` (arc-length position on the loop), `v` (speed), `ramp` (start/stop easing), `plan` (Hermite drive to the barn), `parked`, per-plant `age`/`wig`, `waveT`, `fullT`/`fadeT`.
- **Animation:** one `requestAnimationFrame` loop `frame(now)` with dt capped at 0.05 s; it is cancelled when `document.hidden` and restarted on `visibilitychange` (resetting `last`, so there is no time jump).
- **Path:** `layout()` builds `pieces` (rows and turns) and `pointAt(q)` returns the position and horizontal direction (the tractor is mirrored with `scale(nx, 1)` through the turn).
- **Events:** `bind()` registers `pointerdown` and keyboard `click`; resize/orientation call `layout()`; the keyboard handler covers Enter/Space on the tractor.
- **Cleanup:** the function returned by `mount` cancels the rAF, removes all listeners and the scene node.
- **Persistence/config:** none. **Analytics integration:** none.

## 15. Responsive layout and coordinate system

- The scene is `position: fixed; inset: 0` and measures `clientWidth`/`clientHeight` (fallback `window.innerWidth/innerHeight`).
- **Units:** CSS pixels. Row height `rh = min((H - fieldTop - 8) / 2.85, 0.28·W)`; `fieldTop` is about `0.3·H`, adjusted between `0.2·H` and `H - 2.85·rh - 6`; row centres are at `fieldTop + rh·(i + 0.5)`. Plant size `ps = max(26, min(0.5·rh, 1.6·W/12))`. The loop runs between `xl = tw/2 + rx + 6` and `xr = W - xl` with U-turn radius `rx = 0.35·rh`.
- **Shared space:** tractor, plants, furrows and barn are all positioned in the same pixel space from the same `rowY`/`slotX` values. The tractor's wheels contact the row line at `rh·0.3` below the row centre.
- **Resize/rotation:** `layout()` keeps the tractor's position as a fraction of the loop (`s / Ltot`), rescales the speed to the new width and re-places the plants. A drive to the barn in progress is re-planned.
- **Viewport coverage:** tested sizes are Not currently documented.

## 16. Error and edge-case handling

- **Missing assets / invalid config:** not applicable (no external assets or config).
- **Backgrounding:** the rAF loop stops while the tab is hidden and resumes without a time jump.
- **Long frames:** dt is capped at 0.05 s.
- **Rapid input:** tractor taps just re-target the ramp (a tap during a stop ramp restarts the movement from the current speed); wave and wiggle ignore taps while already running.
- **Touch cancel:** only `pointerdown` is used, so cancellation is not relevant.
- **Orientation change:** handled by `layout()`.
- **Unhandled:** browsers without `requestAnimationFrame` are not handled (no fallback).

## 17. Testing

No automated tests exist for this activity (see [shared platform behaviour](README.md#shared-platform-behaviour)). PR [#103](https://github.com/BielinskiLukasz/child-page/pull/103) reports `node --check` and a stubbed-DOM simulation (fill, fade, restart in 90 s and parking at the barn) and states that the manual device check in portrait and landscape was still pending; PR [#153](https://github.com/BielinskiLukasz/child-page/pull/153) reports `node --check` and that the SVGs parse as XML.

Manual checklist (not yet performed):

- [ ] Normal: open Traktor; the tractor is parked and the field is empty; touch it, it accelerates smoothly and crosses the width in about 12 s.
- [ ] Sprouts appear behind the tractor on all three rows and grow into pink flowers, yellow flowers and carrots within about 3 s.
- [ ] Touch the tractor while driving: it slows down over about 2 s and stops; touch again to restart.
- [ ] Completion: let it drive until all 36 plants are grown; after about 1.5 s the plants fade and the field restarts empty.
- [ ] Incorrect interaction: touch empty field, sky and unplanted slots; nothing breaks. Touch the barn while parked; nothing happens.
- [ ] Touch the barn while driving: the tractor drives to the start and parks without reversing abruptly.
- [ ] Touch a plant (wiggle once), the driver (wave) and the driver while the tractor drives.
- [ ] Restart: leave and re-enter; the driver is different from the previous visit (repeat several times).
- [ ] Randomization: open the activity 10 times and note that all six drivers appear and the same one never appears twice in a row.
- [ ] Progression: confirm that nothing changes between rounds and nothing persists after a reload.
- [ ] Portrait and landscape: rotate during driving; the tractor stays on the loop, plants stay on the furrows, nothing is cut off.
- [ ] Touch (phone/tablet) and mouse (desktop); keyboard: Tab to the tractor, barn and driver; Enter and Space work.
- [ ] Background the tab or lock the screen while driving, return: no jump and no double speed.
- [ ] Reduced motion enabled in the OS: the tractor and plants still move and the grown plants are fully visible.
- [ ] Browsers: Chrome desktop, Chrome Android, Safari iPhone/iPad.

## 18. Known limitations and open issues

**Confirmed**

- No automated tests; no analytics on `main`.
- Plants cannot be reached with the keyboard.
- The activity's motion ignores the reduced-motion preference by design (it is rAF-driven).
- Plant hit boxes (56 px) overlap on narrow screens.

**Requires verification**

- Visual layout on very small or very wide viewports.
- Frame rate on slow devices.

No open issue specifically concerns Traktor (open issues: [#164](https://github.com/BielinskiLukasz/child-page/issues/164) metrics, [#167](https://github.com/BielinskiLukasz/child-page/issues/167) visual behaviour fixes, [#168](https://github.com/BielinskiLukasz/child-page/issues/168) documentation).

## 19. Planned improvements

None currently planned for this activity (see the open issues listed above for cross-cutting work).

## 20. Related activities and reusable components

- Similar vehicle activities: [Autobusik](autobusik.md), [Rakieta](rakieta.md), [Mała Łódka](mala-lodka.md), [Łódź Podwodna](lodz-podwodna.md), [Kolejka Linowa](kolejka-linowa.md), [Balon](balon.md).
- Shared helper used: [`js/random.js`](../../js/random.js) (`Rand.pickOne`). `js/animals.js` is not used (drivers are drawn locally).
- Shared pattern: a rAF loop with a capped dt, restarted on `visibilitychange`, so motion survives the global reduced-motion rule.

## 21. Change history

- [#91](https://github.com/BielinskiLukasz/child-page/issues/91) / PR [#103](https://github.com/BielinskiLukasz/child-page/pull/103): Traktor activity added.
- [#129](https://github.com/BielinskiLukasz/child-page/issues/129) / PR [#153](https://github.com/BielinskiLukasz/child-page/pull/153): random animal driver (6) and carrot root growing from its stem.
- [#113](https://github.com/BielinskiLukasz/child-page/issues/113) / PR [#137](https://github.com/BielinskiLukasz/child-page/pull/137): random animal pools for seven activities (listed in the PR title as touching Traktor).
