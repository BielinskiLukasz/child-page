# Wywrotka

Platform-wide behaviour (no sound, reduced motion, menu configuration, playtime limit, absence of automated tests, privacy) is described in [README.md](README.md#shared-platform-behaviour) and is not repeated here.

## 1. Overview

| Item | Value |
|---|---|
| Display name | Wywrotka |
| Activity ID | `wywrotka` (registry entry in [`js/activities.js`](../../js/activities.js), lazy-loaded via `src` on its registry entry) |
| Description | The child drives a toy dump truck round a looping road, loads stones from a pile and tips them out at a dumping spot. |
| Category | Control skill; cause and effect; carrying things from one place to another; open-ended play; calming |
| Interaction type | Hold a pedal button to drive; tap stones to load them; tap the tip button to tip; keyboard alternative |
| Status | Implemented; enabled in the menu by default (appended last, no `defaultOff`) |
| Source | [`js/wywrotka.js`](../../js/wywrotka.js), styles with prefix `wt-` in [`css/style.css`](../../css/style.css) |

## 2. Business purpose

- A load-and-haul activity; issue [#259](https://github.com/BielinskiLukasz/child-page/issues/259), part of the construction-site request of 2026-11-02.
- Differs from [Koparka](koparka.md) and [Koparka na Budowie](koparka-na-budowie.md) (digging) by the mechanic: the child carries a load from one place to another and tips it out.

## 3. Activity flow

1. The child opens the tile; a yellow dump truck stands at the loading spot in front of a sand pile with five stones (two orange cones mark it). Ahead on the loop a yellow-striped patch with a barrier marks the dumping spot.
2. Drive: holding the round pedal button at the bottom right makes the truck drive to the right; releasing it brings the truck to a stop in 0.5 s. The road is a loop two screen widths long, so driving on always comes back to the loading spot.
3. Load: tapping a stone (each is a target of at least 56 px) throws it in a 0.4 s arc into the bed, if the truck is close enough. A stone tapped while the truck is too far away just hops and stays in the pile. A new stone grows back once the truck has driven away from the pile.
4. Dump: when the rear of the truck is on the striped patch and the truck stands still, the round tip button at the bottom left lights up; tapping it tilts the bed 35 degrees for 1.2 s and the stones slide out one by one into a growing heap.
5. After three loads the heap becomes a green little hill with a flag in a soft glow; after 5 s it shrinks away and a new round begins.
6. Open-ended: the rounds repeat. Exit: Back button or browser Back.

## 4. Rules and behavior

| Rule | Detail |
|---|---|
| Road | A loop of `2 x screen width`; the loading spot is at 25% and the dumping spot at 75% of it. The ground is gently wavy (height `min(3.5% of height, 18 px)`) and the truck tilts with it (at most 8 degrees). |
| Drive | While the pedal (or the right arrow) is held the speed ramps up in 0.5 s to the maximum of 30% of the screen width per second; on release it falls linearly to 0 in 0.5 s (spec: within 0.6 s). The truck cannot drive while the bed is tipping. |
| Pile | Five stones in two rows (3 + 2), spaced at least 56 px apart (`max(56 px, 28% of truck width)`), each a target of that size. |
| Loading | A tapped stone flies in a 0.4 s arc to the next free bed slot (the bed holds five). It lands in the bed if it is within `0.28 truck widths + 0.6 stone spacings` of the bed centre; otherwise it hops and stays (nothing is lost or counted). A tap during tipping or with a full bed is ignored. |
| Pile refill | A stone that was loaded grows back (0.4 s) when the truck is more than 0.45 screen widths from the pile. |
| Tip | Enabled only when the truck stands (speed below 3% of maximum), the rear of the bed is within 0.5 truck widths of the marked patch, the bed holds at least one stone, all thrown stones have landed and no hill is showing. The bed rises in 0.4 s to 35 degrees, holds 0.4 s and lowers in 0.4 s (1.2 s); stones slide to the rear one after another (the first leaves at 0.3 s, then every 0.1 s) and fall 0.4 s into the heap. |
| Heap | Grows with every stone that lands (`dumped / 15` of full height, smoothed). |
| Load count | A tip that released at least one stone counts as a load. At the third load the heap is set to full height, turns green (hill) and a flag with a soft glow grows on top. |
| Hill | Shown 5 s; then the heap, flag and glow fade over 0.9 s, the counters reset and a new round starts. |
| Failure, score | None; nothing is scored or stored. |
| Text, faces, sound | None. |

## 5. Educational and developmental benefits

**Intended design benefits**

- Controlling speed with a hold-and-release pedal; cause and effect (load, haul, tip); carrying things from one place to another.

**Directly observable behavior**

- The truck speeds up and stops smoothly, stones fly into the bed, the bed tips and the stones slide out and form a heap and finally a hill.

**Requires professional or research-based validation**

- Any claim about learning or developmental benefits; nothing in the code can establish it.

## 6. Accessibility and usability

- **Input:** pointer events; the pedal and the tip button are 64 px (at least 56 px) round buttons at the bottom corners; stones are targets of at least 56 x 56 px.
- **Keyboard:** the right arrow drives (hold to keep driving); Space loads the nearest stone, or tips when the tip button is enabled; Tab reaches the stones (Enter or Space loads that stone) and the tip button (visible 4 px focus ring).
- **Labels (Polish):** scene "Wywrotka. Strzałka w prawo jedzie, spacja ładuje i wysypuje."; pedal "Jedź (przytrzymaj)" (not in the Tab order, the arrow key replaces it); stone "Kamień – załaduj"; tip button "Wysyp" (`aria-disabled` while it is not available); the SVG is decorative.
- **Non-colour cues:** the striped patch and barrier mark the dump spot, cones and the pile mark the loading spot; the tip button is dimmed when unavailable.
- **Reduced motion:** all movement and every end state is set from JavaScript (one rAF loop); no state exists only in a CSS keyframe or transition.
- **Text:** none.

## 7. Risks and limitations

- Visual quality (truck, bed tilt, stones, heap, hill) has not been checked on a device (sections 17 and 18).
- The truck only drives forward; the child circles the loop to return to a spot.
- The tip spot is about one truck width long; a very quick tap-and-release of the pedal needs a few tries on a small screen.
- No ending; relies on the global playtime limit.

## 8. Configuration

No external configuration. Constants at the top of [`js/wywrotka.js`](../../js/wywrotka.js): `SPEED` (0.3), `ACCEL_S`, `STOP_S` (0.5), `ARC_S` (0.4), `TIP_S` (1.2), `TIP_DEG` (35), `LOADS` (3), `HILL_S` (5), `CLEAR_S`, `STONES`, `SLOTS`, `LOAD_AT`, `DUMP_AT`, `TILT_MAX`. Changing them needs a code edit.

## 9. Assets

No external asset files. Everything (sky, hills, ground, pile, cones, truck, stones, heap, flag) is inline SVG created by `js/wywrotka.js`; the menu icon is inline SVG in `js/activities.js`.

## 10. Randomization and variants

None; the stone colours are fixed per pile position.

## 11. Progression and difficulty

None; there are no levels and nothing persists.

## 12. Completion and feedback

A round is complete at the third load (the heap turns into a hill with a flag). Feedback: the arc, tilt, sliding stones, growing heap and the hill with a soft glow. No failure state and no sound. The activity is open-ended.

## 13. Analytics and metrics

This activity reports to the shared on-device module `js/analytics.js` (`window.Analytics`). `js/app.js` records the activity start and end and the module counts touches in the stage; `js/wywrotka.js` additionally calls `Analytics.track('interaction', { variant })` with variant `drive` (a pedal press or the first right-arrow press), `load` (a stone tap that is accepted, including a hop) or `tip`, and `Analytics.complete()` when the third load turns the heap into a hill. All calls are wrapped so that nothing changes if `window.Analytics` is missing. The activity is not in the module's `COMPLETABLE` list (it repeats endlessly), so exit-before-completion is not defined for it. Data stays on the device as anonymous daily aggregates; see [README.md](README.md#analytics-status).

## 14. Technical implementation

- **Entry point:** `mount(container)` in [`js/wywrotka.js`](../../js/wywrotka.js) overrides `mount` of the `wywrotka` entry; returns a cleanup function. The script is lazy-loaded via `src` on its registry entry in `js/activities.js`.
- **Rendering:** `div.wt > svg.wt-svg (far layer at half speed, ground shifted by the position within one period, dumping patch, heap, flag, pile with stones, truck with tilting bed, flying stones) + five div.wt-hit stone targets + button.wt-tip + button.wt-pedal`. The truck stays at 40% of the width; the road objects are placed from their distance (wrapped to the loop) to the truck.
- **State:** road position and speed, tilt, pile stones, bed slots, flying stones, tip time, heap level, load count, hill timers.
- **Loop:** one `requestAnimationFrame` loop with `dt` capped at 0.05 s, guarded by `!raf`, cancelled while the tab is hidden and restarted on `visibilitychange`; it stops when nothing moves (truck, tip, flights, heap, pile, hill) and restarts on input; cleanup cancels it and removes listeners and DOM.
- **Persistence:** none. **Analytics:** section 13.

## 15. Responsive layout and coordinate system

- `.wt` is fixed full-screen; all positions are pixels recomputed in `layout()` on `resize` and `orientationchange` (the truck position is rescaled with the loop length). The ground line is at 68% of the height; the truck width is `min(30% of width, 42% of height)` clamped to 90-300 px (320 x 568 to 1920 x 1080). The pile stands on the far ground, raised by the truck height so the truck never hides it.

## 16. Error and edge-case handling

| Case | Behaviour |
|---|---|
| Stone tapped with the truck too far | It hops and stays; nothing is lost or counted. |
| Bed full (five stones) | Further stone taps are ignored. |
| Tip pressed where it is not available | Ignored; the button is dimmed. |
| Tip with a partly loaded bed | Allowed; counts as a load. |
| Pedal released outside the button, cancelled touch, window blur | The truck stops (pointer capture, `pointercancel`, `lostpointercapture` and blur release the pedal). |
| Resize / orientation | Layout and scene rebuilt; positions rescaled; flying stones recreated. |
| Leaving mid-round | Cleanup cancels the frame, removes listeners and the DOM. |
| Tab hidden | Loop cancelled and restarted on return; the `dt` cap prevents a jump. |
| `window.Analytics` missing | Calls are skipped. |

## 17. Testing

No automated tests exist. Manual scenarios (none are claimed as done):

- [ ] Hold the pedal; the truck speeds up to about 30% of the width per second; release; it stops within 0.6 s.
- [ ] Tap all five stones with the truck at the pile; they arc into the bed; a sixth cannot be loaded.
- [ ] Drive away from the pile and tap a stone when the truck is far; it hops back.
- [ ] Drive to the striped patch, stop, tip; the bed tilts 35 degrees for 1.2 s and the heap grows.
- [ ] Three loads make a hill with a flag; after 5 s a new round starts.
- [ ] Keyboard: right arrow drives, Space loads and tips, Tab to the stones and the tip button.
- [ ] Rotate the device mid-round; leave and reopen ten times quickly; reduced motion.
- [ ] Small screens (320 x 568, 568 x 320) and 1920 x 1080.

The PR for issue [#259](https://github.com/BielinskiLukasz/child-page/issues/259) reports a Node simulation with a stub DOM (speed cap and stop time, loading, tip angle and duration, three loads with the hill and `complete()`, cleanup, no `NaN` in attributes) at three viewport sizes; no visual check was possible.

## 18. Known limitations and open issues

**Confirmed**

- No automated tests.

**Requires verification**

- Look and feel of the truck, the tipping bed and the hill, and the layout on real devices.

## 19. Planned improvements

None currently planned. Sibling construction-site activities are tracked in issues [#260](https://github.com/BielinskiLukasz/child-page/issues/260) to [#262](https://github.com/BielinskiLukasz/child-page/issues/262).

## 20. Related activities and reusable components

- [Koparka](koparka.md), [Koparka na Budowie](koparka-na-budowie.md), [Plac Budowy](plac-budowy.md), [Traktor](traktor.md), [Autobusik](autobusik.md).
- No shared component is used besides `window.Analytics`.

## 21. Change history

- Issue [#259](https://github.com/BielinskiLukasz/child-page/issues/259): initial activity.
