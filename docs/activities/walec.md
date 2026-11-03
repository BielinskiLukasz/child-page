# Walec

Platform-wide behaviour (no sound, reduced motion, menu configuration, playtime limit, absence of automated tests, privacy) is described in [README.md](README.md#shared-platform-behaviour) and is not repeated here.

## 1. Overview

| Item | Value |
|---|---|
| Display name | Walec |
| Activity ID | `walec` (registry entry in [`js/activities.js`](../../js/activities.js), lazy-loaded via `src` on its registry entry) |
| Description | The child drives a road roller over a bumpy road of 12 segments and watches it become smooth asphalt. |
| Category | Control skill; cause and effect; open-ended play; calming |
| Interaction type | Finger/mouse drag or hold to drive left or right; keyboard alternative |
| Status | Implemented; enabled in the menu by default (appended last, no `defaultOff`) |
| Source | [`js/walec.js`](../../js/walec.js), styles with prefix `wc-` in [`css/style.css`](../../css/style.css) |

## 2. Business purpose

- A smoothing activity in the construction-site set; issue [#262](https://github.com/BielinskiLukasz/child-page/issues/262), part of the construction-site request of 2026-11-02.
- Differs from [Ślady na Piasku](slady-na-piasku.md), where the child draws tracks: here a pass of the vehicle changes the surface it drives over.

## 3. Activity flow

1. The child opens the tile; a yellow road roller stands at the left end of a bumpy dirt road of 12 segments under a sunny sky.
2. Drive: the child touches or holds a finger on the screen and the roller drives toward that point, or uses the Left/Right arrows. Its drum rotates in step with the movement and it turns to face the direction of travel.
3. Each time the roller drives over a segment it flattens it one step: bumps shrink to half, and on the second pass to flat. The change is animated and the colour turns from dirt to asphalt, with a dotted line on flat parts.
4. When all 12 segments are flat a gold star appears at the end of the road and a little car (or a bunny on a bike) drives along the road for 4 s.
5. The road then becomes bumpy again with a new random bump pattern and the round repeats. Exit: Back button or browser Back.

## 4. Rules and behavior

| Rule | Detail |
|---|---|
| Drive | Target speed is proportional to the distance to the touch point (gain 3 per second), capped at 40% of the screen width per second; speed is smoothed (rate 8 per second, stop rate 12). The roller stays between the two ends of the road. |
| Passes | A pass is entering a segment (roller centre inside it); the segment re-arms once the roller centre is 1.5 segments away. Bump level goes 1 -> 0.5 -> 0 over two passes, eased at rate 5 per second. |
| Bumps | 6-10 segments (random) get a big hump at a random position and width; the other segments get a small lump (30-45% of the big one). Humps stay inside their segment. |
| Roller bob | The roller rises with the highest bump under it, at most 6 px, smoothed; it never collides or stops. |
| Drum | Rotation is the distance driven divided by the drum radius, so it matches the movement in both directions. |
| Round end | When all segments are flat and settled: star, then car or bunny on a bike for 4 s, then a new pattern (bumps grow back with easing). |
| Failure, score | None; nothing is scored or stored. |
| Text, faces, sound | None. |

## 5. Educational and developmental benefits

**Intended design benefits**

- Steering a vehicle along a path; cause and effect (a pass changes the road).

**Directly observable behavior**

- The roller follows the finger, the road flattens in two steps per segment, a car or bunny drives by at the end.

**Requires professional or research-based validation**

- Any claim about learning or developmental benefits; nothing in the code can establish it.

## 6. Accessibility and usability

- **Input:** pointer events on the whole stage (touch, mouse, stylus), so the target is the full screen (well above 56 px).
- **Keyboard:** Left/Right arrows drive (hold to keep driving).
- **Labels (Polish):** scene "Walec. Strzałki jeżdżą walcem."; the SVG is decorative.
- **Non-colour cues:** bump height and the dotted line show which segments are flat, not only colour.
- **Reduced motion:** all movement and every end state is set from JavaScript (one rAF loop); no state exists only in a CSS keyframe or transition.
- **Text:** none.

## 7. Risks and limitations

- Visual quality (roller drawing, bump shapes, car and bunny) has not been checked on a device (sections 17 and 18).
- On a 320 px wide screen a segment is about 23 px wide and the bumps are small (about 16 px).

## 8. Configuration

No external configuration. Constants at the top of [`js/walec.js`](../../js/walec.js): `SEGS` (12), `SPEED` (0.4), `FOLLOW` (3), `ACCEL` (8), `STOP_RATE` (12), `LEVEL_RATE` (5), `BOB_MAX` (6), `CAR_S` (4) and `STEPS`. Changing them needs a code edit.

## 9. Assets

No external asset files. Everything (sky, road, roller, star, car, bunny and bike) is inline SVG created by `js/walec.js`; the menu icon is inline SVG in `js/activities.js`.

## 10. Randomization and variants

Which 6-10 segments get a big bump, and the position and width of every bump, are random per round; the car or the bunny on a bike is chosen at random per round. `Math.random` is used directly.

## 11. Progression and difficulty

None; there are no levels and nothing persists.

## 12. Completion and feedback

A round is complete when all 12 segments are flat. Feedback: smooth flattening, the star, the car or bunny driving by. No failure state and no sound. The activity is open-ended.

## 13. Analytics and metrics

This activity reports to the shared on-device module `js/analytics.js` (`window.Analytics`). `js/app.js` records the activity start and end and the module counts touches in the stage; `js/walec.js` additionally calls `Analytics.track('interaction', { variant })` with variant `drive` (a drive touch or the first arrow key press) or `flatten` (a segment flattened one step), and `Analytics.complete()` when the whole road is flat. All calls are wrapped so that nothing changes if `window.Analytics` is missing. The activity is not in the module's `COMPLETABLE` list (it repeats endlessly). Data stays on the device as anonymous daily aggregates; see [README.md](README.md#analytics-status).

## 14. Technical implementation

- **Entry point:** `mount(container)` in [`js/walec.js`](../../js/walec.js) overrides `mount` of the `walec` entry; returns a cleanup function. The script is lazy-loaded via `src` on its registry entry in `js/activities.js`.
- **Rendering:** `div.wc > svg.wc-svg` with sky, grass, 12 road segment paths (rebuilt only while a bump level changes), 12 dotted lines, the star, the car group and the roller group; the SVG `viewBox` equals the pixel size of the stage.
- **State:** roller position, speed, facing, bob, drum angles, per-segment step, level and bump shape, round phase (`play` or `car`).
- **Loop:** one `requestAnimationFrame` loop with `dt` capped at 0.05 s, cancelled while the tab is hidden and restarted on `visibilitychange`; it stops when nothing moves and restarts on input; cleanup cancels it and removes listeners and DOM.
- **Persistence:** none. **Analytics:** section 13.

## 15. Responsive layout and coordinate system

- `.wc` is fixed full-screen; positions are pixels recomputed in `layout()` on `resize` and `orientationchange`; the roller keeps its place as a fraction of the road. The road spans 6%-94% of the width at 62% of the height; the roller is `min(30% of width, 42% of height)` wide, clamped to 72-240 px (320 x 568 to 1920 x 1080).

## 16. Error and edge-case handling

| Case | Behaviour |
|---|---|
| Touch outside the road | The roller drives toward it and stops at the road end. |
| Release or cancelled touch | The roller coasts to a stop. |
| Both arrows held | No movement. |
| Resize / orientation | Layout rebuilt; roller position and bump state kept. |
| Leaving mid-round | Cleanup cancels the frame, removes listeners and the DOM. |
| Tab hidden / window blur | Loop cancelled and restarted on return; the `dt` cap prevents a jump; held arrow keys are released on blur. |
| `window.Analytics` missing | Calls are skipped. |

## 17. Testing

No automated tests exist. Manual scenarios (none are claimed as done):

- [ ] Hold a finger; the roller follows in both directions, the drum turns with it.
- [ ] Drive over every segment twice; each flattens in two smooth steps.
- [ ] After the last segment: star, car or bunny for 4 s, then a new bumpy road.
- [ ] Keyboard: Left/Right arrows.
- [ ] Rotate the device mid-round; leave and reopen ten times quickly.
- [ ] Small screens (320 x 568, 568 x 320) and 1920 x 1080; reduced motion.

The PR for issue [#262](https://github.com/BielinskiLukasz/child-page/issues/262) reports a Node simulation with a stub DOM; no visual check was possible.

## 18. Known limitations and open issues

**Confirmed**

- No automated tests.

**Requires verification**

- Look and feel of the roller, bumps, car and bunny, and the layout on real devices.

## 19. Planned improvements

None currently planned. Sibling construction-site activities are tracked in issues [#258](https://github.com/BielinskiLukasz/child-page/issues/258) to [#261](https://github.com/BielinskiLukasz/child-page/issues/261).

## 20. Related activities and reusable components

- [Koparka na Budowie](koparka-na-budowie.md), [Plac Budowy](plac-budowy.md), [Ślady na Piasku](slady-na-piasku.md), [Traktor](traktor.md).
- No shared component is used besides `window.Analytics`.

## 21. Change history

- Issue [#262](https://github.com/BielinskiLukasz/child-page/issues/262): initial activity.
