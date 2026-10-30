# Mały Pociąg

Platform-wide behaviour (no sound, reduced motion, menu configuration, playtime limit, absence of automated tests, privacy) is described in [README.md](README.md#shared-platform-behaviour); this document only records what is specific to this activity.

## 1. Overview

| Item | Value |
|---|---|
| Display name | Mały Pociąg |
| Activity ID | `pociag` (registry entry in [`js/activities.js`](../../js/activities.js)) |
| Description | A little train with three random animals in its wagons runs along a track; the child starts and stops it, sends it to the station, or makes an animal nod. |
| Category | Cause and effect; open-ended play; observation |
| Interaction type | Tap (touch, mouse, or Enter/Space on the focusable elements) |
| Status | Implemented; enabled in the menu by default (no `defaultOff`) |
| Source | [`js/pociag.js`](../../js/pociag.js), styles with prefix `tp-` in [`css/style.css`](../../css/style.css), lazy-loaded via `src`/`deps` on its registry entry in [`js/activities.js`](../../js/activities.js) |

## 2. Business purpose

- Offers a slow, predictable cause-and-effect toy: one tap on the train makes it ease into motion, the next tap eases it to a stop, so the child sees the result of their own action.
- Complements the other vehicle activities (for example [Autobusik](autobusik.md) and [Traktor](traktor.md)) with a train that runs on a looping track and has a stopping point (the station).
- The three wagon animals come from the shared animal family, so the scene looks different on each launch.
- Described in the README Activities list as item 7.

## 3. Activity flow

1. The child opens the tile; `mount()` builds the scene and starts a `requestAnimationFrame` loop.
2. Initially displayed: sky, sun, hills, a track, a station in the centre, and the train **parked** in the centre of the screen (in front of the station), with three random animals in three coloured wagons. A little steam puff is released every 2.4 s even while parked.
3. Interactions: tap the train (start/stop), tap the station (go to the station and stop there), tap an animal in a wagon (nod).
4. Response: the train ramps its speed over 2 s; a station tap plans a smooth stop at the station; an animal nods for 1.8 s.
5. There is no completion state.
6. Nothing ends or resets; the cycle repeats as long as the child plays.
7. Restart: leave and re-open the activity; a new random trio of animals is drawn and the train is parked again.
8. Exit: the Back button (or browser Back); `app.js` calls the cleanup function returned by `mount`.

## 4. Rules and behavior

| Rule | Detail |
|---|---|
| Train tap | If the train is moving (cruising, accelerating or on its way to the station) it ramps down to 0 over `RAMP_S = 2` s; otherwise it ramps up to cruise speed over 2 s. Smoothstep easing, no sudden speed changes. |
| Cruise speed | `CROSS_S = 22` s per full loop (`V = 1/22` loop fractions per second). The loop length is the screen width plus the train width, so the train leaves on the right and re-enters on the left. |
| Station tap | Only has an effect while the train is not parked. It plans a cubic Hermite curve from the current speed to a standstill at the station position (train centred on screen). Duration `T = max(2.5 s, 1.2 * D / V)`, capped at `2.85 * D / v` so the train never reverses; if that would mean braking in under 2.5 s the train drives one more lap. |
| Station tap on a stopped, non-parked train | Because "not parked" is all that is checked, a train that was stopped by a train tap away from the station starts moving and drives to the station. |
| Station tap on a parked train | Ignored. |
| Train tap during a station approach | Cancels the plan and ramps to a stop from the current speed. |
| Animal tap | Nod lasting `NOD_S = 1.8` s (rotation up to 14 degrees, vertical offset up to 3 board units); a tap on an animal that is already nodding is ignored. Animal taps do not toggle the train. |
| Wheels | The five wheels rotate according to the distance travelled (`odo`). |
| Steam | Pool bounded by `MAX_PUFFS = 5`; each puff lives `PUFF_S = 3.2` s; one puff every 1.1 s while moving and every 2.4 s while stopped. |
| Time step | Capped at `MAX_DT = 0.05` s; the loop stops while the tab is hidden and restarts on `visibilitychange`. |
| Sound | None. |

## 5. Educational and developmental benefits

**Intended design benefits**

- Cause and effect (tap, train responds).
- Calm observation of slow, smooth motion.
- Early hand-eye coordination through tapping targets of different sizes.

**Directly observable behavior**

- Every state change is eased over about 2 s; there are no abrupt starts or stops, and the train never moves backwards.
- No wrong action exists, no score and no text.

**Requires professional or research-based validation**

- Any claim about the effect of the activity on attention, language or other development. Nothing in the code can establish this.

## 6. Accessibility and usability

- **Input:** pointer events (touch, mouse, stylus) on `pointerdown`; the train (`role="button"`, `tabindex="0"`) reacts to Enter/Space; the station and the animal hit areas are native `<button>` elements that react to keyboard-generated clicks (`click` with `detail === 0`).
- **Labels (Polish):** train "Pociąg – ruszaj lub zatrzymaj", station "Stacja – zatrzymaj pociąg na stacji", animals "<name> w wagonie". The scene is a `role="group"` labelled "Mały pociąg".
- **Target sizes:** the animal buttons are 22 % of the train width by 66 % of its height with `min-width/min-height: 48px`; the train is `min(80 % of width, 560 px, 160 % of height)` wide; the station is 60 % of the train width.
- **Orientation:** layout is recomputed on `resize` and `orientationchange`; the track sits at 72 % of the height.
- **Colour:** no meaning depends on colour; wagon colours are decorative.
- **Reduced motion:** all motion (movement, wheels, nodding, steam) is driven by the `requestAnimationFrame` loop, not CSS animations, so it still plays under the global `prefers-reduced-motion` rule.
- **Touch:** `touch-action: none` and `user-select: none` on the scene.
- **Reading:** not required. A young child can use it independently.
- **Limitations:** the animal buttons overlay the train; a press on an animal nods it and does not start the train.

## 7. Risks and limitations

- Continuous gentle motion of the whole scene (the train crossing the screen) and a repeating steam puff, including while parked.
- The activity has no ending; it relies on the global playtime limit.
- An accidental tap on the train area stops or starts the train (no confirmation, which is intentional).
- On small screens the wagon animals become small; the touch area keeps a 48 px minimum.
- No privacy concerns: nothing is stored, no network calls.

## 8. Configuration

There is no external configuration; everything is a constant at the top of [`js/pociag.js`](../../js/pociag.js). Changing them requires editing the code.

| Constant | Purpose | Value |
|---|---|---|
| `CROSS_S` | Seconds for a full loop at cruise speed | 22 |
| `V` | Cruise speed (loop fractions per second) | `1 / CROSS_S` |
| `RAMP_S` | Duration of start and stop ramps | 2 s |
| `MAX_DT` | Frame time cap | 0.05 s |
| `MAX_PUFFS`, `PUFF_S` | Steam pool size and lifetime | 5, 3.2 s |
| `NOD_S` | Animal nod duration | 1.8 s |
| Wagon colours | `#f7a8c9`, `#a9d6f2`, `#ffd98a` (inline in `trainSvg`) | fixed |

Fallback for missing or invalid values: Not applicable (no external values). The only dependency is `window.Animals` (loaded before the activity script); there is no check for it being absent.

## 9. Assets

No external asset files. Everything is inline SVG and CSS: the train, wheels and station (`trainSvg`, `stationSvg`), the hills (`hillsSvg`), and the sun, ground and track (CSS). The wagon animals are heads from `window.Animals.head()` ([`js/animals.js`](../../js/animals.js)). The activity tile icon is an inline SVG in `js/activities.js`. No audio, fonts or images.

## 10. Randomization and variants

- On every launch `window.Animals.pick(3)` selects three **unique** animals from the shared family of 13 (no `distinct` option, so similar silhouettes can occur together). The selection is not stored and there is no immediate-repetition guard between launches.
- Nothing else is random except the horizontal drift of each steam puff (6 to 12 units).
- Layout, wagon colours and animal positions in the train (wagon 1, 2, 3) are fixed.

## 11. Progression and difficulty

None. There are no levels, scores or persistence; the train always starts parked in the centre.

## 12. Completion and feedback

There is no formal completion state and no failure. Feedback is purely the train's movement, wheel rotation, steam and the nodding animal. After a station stop the train simply waits until tapped again. No sound.

## 13. Analytics and metrics

This activity reports to the shared on-device module `js/analytics.js` (`window.Analytics`) through the app shell only: `js/app.js` records the activity start and end, and the module counts touches inside the stage. The activity file itself calls no `Analytics` function. Recorded for it: starts, active time, replays (re-opening in the same session), quick exits (within 10 s) and touches. It is open-ended, so no completion, level or exit-before-completion is defined for it. Data stays on the device as anonymous daily aggregates; see [README.md](README.md#analytics-status).

## 14. Technical implementation

- **Entry point:** `mount(container)` in [`js/pociag.js`](../../js/pociag.js) replaces the `mount` of the `pociag` registry entry; it returns a cleanup function that cancels the frame request, removes all listeners and removes the scene.
- **Rendering:** DOM plus inline SVG. The train is one `div` moved with a CSS `transform` each frame; wheels and animals are SVG groups whose `transform` attribute is set from JavaScript; steam puffs are pooled `div`s released above the chimney (at 91% of the train width).
- **State:** `f` (train position as a fraction of the loop; 0 = just off the left edge, 1 = just off the right edge), `v` (speed), `ramp`, `plan` (station approach), `parked`, `odo` (distance for the wheels), `nods[]`, `puffs[]`.
- **Layout:** `layout()` sets CSS variables `--tw`, `--th`, `--ty`; loop length `L = W + tw`; the station position is `fs = (tw + (W - tw) / 2) / L`. Because speed and positions are fractions of the loop, resizing or rotating keeps them valid; a moving station plan is re-planned from the current speed.
- **Events:** `pointerdown` (with `preventDefault`) plus `click` for keyboard activation (`detail === 0`); `keydown` Enter/Space on the train; `resize`, `orientationchange`, `visibilitychange`.
- **Randomization:** `Animals.pick(3)`.
- **Persistence and analytics:** none.

## 15. Responsive layout and coordinate system

- The scene is `position: fixed; inset: 0`; the track is at `0.72 * H`; the train is `tw = min(0.8 * W, 560, 1.6 * H)` wide and `th = tw / 4` high.
- The train SVG uses `viewBox="0 0 400 100"` (three wagons 92 wide at x = 4, 104, 204; locomotive from x = 304 to 386, drawn facing right: the tall cab block at x 304 to 350 sits at the back next to the carriages, the boiler at x 326 to 386, the chimney at x 356 to 372 and the headlight at x 360 at the front). Animal heads are centred in each wagon. The station SVG is `viewBox="0 0 200 120"`.
- Moving elements use pixels (translate in px); the train position uses loop fractions, so changing the screen size does not move the stopping point away from the station.
- Portrait and landscape both work; no aspect-ratio-specific layout exists. Extremely wide, low screens are limited by the `1.6 * H` rule.

## 16. Error and edge-case handling

| Case | Behaviour |
|---|---|
| Resize / orientation change | `layout()` recomputes; a parked train is re-centred, a moving train continues, an active station approach is re-planned. |
| Tab hidden | Frame loop cancelled; restarted on return with a fresh time base, so time spent hidden is not replayed. |
| Rapid taps | Each tap restarts a ramp from the current speed; no abrupt change. |
| Station tap exactly at the station | Snaps to parked when the remaining distance is under 0.002 and the speed under 5 % of cruise. |
| Missing `window.Animals` | Not handled (script would throw on mount). |
| Touch cancel | Not specifically handled; taps are handled on `pointerdown`, so there is nothing to cancel. |
| Leaving the activity | Cleanup removes listeners and cancels the loop. |

## 17. Testing

No automated tests exist. Manual scenarios to run (none are claimed as done):

- [ ] Normal: open the activity; the train is parked in the centre; tap it; it eases into motion within about 2 s and leaves at the right edge and re-enters on the left.
- [ ] Tap the train again while moving; it eases to a halt without moving backwards.
- [ ] Station: tap the station while moving; the train slows smoothly and stops centred on the station; tap the station again while parked (nothing happens).
- [ ] Station tap just after the train passed the station (it should drive another lap rather than brake abruptly).
- [ ] Incorrect interaction: tap empty sky or ground; nothing happens.
- [ ] Animals: tap each animal; it nods once; tap it again while nodding (ignored); the train does not start.
- [ ] Restart: leave and re-open the activity repeatedly; the animals vary and the train is parked each time.
- [ ] Randomization: over about 20 launches, check that all 13 animals can appear and that no duplicates occur within a train.
- [ ] Progression: confirm that there is none (nothing changes over time).
- [ ] Portrait and landscape: layout, train size, station placement and animal buttons; rotate during travel and during a station approach.
- [ ] Touch (Chrome Android, Safari iPhone/iPad): tap accuracy on animals, no scrolling or zooming.
- [ ] Mouse (desktop): clicks work; right button also triggers (no button filter).
- [ ] Keyboard: Tab to the train, station and animals; Enter/Space activate them; focus outline visible.
- [ ] Background/foreground: switch tab during travel; on return, motion continues smoothly with no jump.
- [ ] Reduced motion: enable the OS setting; the train, wheels, steam and nodding still move.
- [ ] Browsers: Chrome desktop, Chrome Android, Safari iPhone/iPad (as required by the README).

PR [#39](https://github.com/BielinskiLukasz/child-page/pull/39) reports a Node run against a DOM stub (train starts parked, ramps up, never moves backwards while stopping, station stop lands exactly on the station) and lists manual device tests as pending.

## 18. Known limitations and open issues

**Confirmed**

- Steam is released continuously even while the train is parked.
- No keyboard or screen-reader state: the train button does not announce whether it is moving.
- The animal pool allows visually similar animals in the same train (no `distinct`).
- No automated tests.

**Requires verification**

- Behaviour of the animal hit areas versus the train area on very small screens (48 px minimum).
- Visual fit of larger animals (Słoń trunk, Lew mane) in the wagons; PR [#137](https://github.com/BielinskiLukasz/child-page/pull/137) lists it as a pending manual check.

## 19. Planned improvements

None currently planned. (The locomotive direction fix is done, see issue [#167](https://github.com/BielinskiLukasz/child-page/issues/167) / PR [#173](https://github.com/BielinskiLukasz/child-page/pull/173).)

## 20. Related activities and reusable components

- Other vehicle activities: [Autobusik](autobusik.md), [Traktor](traktor.md), [Kolejka Linowa](kolejka-linowa.md), [Mały Samolot](maly-samolot.md).
- Shared animals: [`js/animals.js`](../../js/animals.js) (`Animals.pick`, `Animals.head`); the same family is used by [Dobranoc](dobranoc.md), [Zwierzątka na Farmie](zwierzatka-na-farmie.md), [Zabawa w Chowanego](zabawa-w-chowanego.md), [Cienie](cienie.md) and [Buźki](buzki.md).
- The rAF loop pattern (capped time step, restarts on `visibilitychange`) is shared with several other activities.

## 21. Change history

- Issue [#30](https://github.com/BielinskiLukasz/child-page/issues/30) / PR [#39](https://github.com/BielinskiLukasz/child-page/pull/39): initial activity (including reviewer-suggested refinements).
- Issue [#113](https://github.com/BielinskiLukasz/child-page/issues/113) / PR [#137](https://github.com/BielinskiLukasz/child-page/pull/137): wagon animals drawn at random from the shared animal family.
- Issue [#167](https://github.com/BielinskiLukasz/child-page/issues/167) / PR [#173](https://github.com/BielinskiLukasz/child-page/pull/173): fixed on `main`; the locomotive now faces the direction of travel (chimney and headlight at the front, steam puffs released above the chimney at 91% of the train width).
