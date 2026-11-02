# Koparka na Budowie

Platform-wide behaviour (no sound, reduced motion, menu configuration, playtime limit, absence of automated tests, privacy) is described in [README.md](README.md#shared-platform-behaviour) and is not repeated here.

## 1. Overview

| Item | Value |
|---|---|
| Display name | Koparka na Budowie |
| Activity ID | `koparka-jezdna` (registry entry in [`js/activities.js`](../../js/activities.js), lazy-loaded via `src` on its registry entry) |
| Description | The child drives a toy excavator along a building site that is two screens wide and digs holes and sand piles with it. |
| Category | Control skill; cause and effect; open-ended play; calming |
| Interaction type | Finger/mouse drag or hold on the ground to drive; tap the excavator or the dig button to dig; keyboard alternative |
| Status | Implemented; enabled in the menu by default (appended last, no `defaultOff`) |
| Source | [`js/koparka-jezdna.js`](../../js/koparka-jezdna.js), styles with prefix `ej-` in [`css/style.css`](../../css/style.css) |

## 2. Business purpose

- A free-driving vehicle activity with a simple dig action and a gentle, failure-free model; issue [#258](https://github.com/BielinskiLukasz/child-page/issues/258), part of the construction-site request of 2026-11-02.
- Differs from [Koparka](koparka.md), where the vehicle stands still and only the arm is controlled: here the whole machine moves and the child chooses where to dig.

## 3. Activity flow

1. The child opens the tile; a yellow excavator stands on the left of a sunny site with three sand piles, three small hills and three dig spots marked with soft orange cones. The camera follows the machine; the site is two screens wide.
2. Drive: the child touches or holds a finger on the ground and the excavator drives toward that point with a smooth, speed-limited motion and turns to face the direction of travel. Releasing lets it coast to a stop in well under half a second.
3. Dig: tapping the excavator or the round dig button plays a 1.2 s dig: the arm dips in front of the machine, the bucket scoops and rises with sand, and the sand falls beside the hole.
4. Digging at a cone makes a hole that grows for 1 s (the cone disappears) and a small mound of spoil next to it. Digging anywhere else grows or adds a sand mound; holes and piles stay until the activity is closed.
5. After all three holes are dug a small flower with a soft glow grows from each. Six seconds later the three spots move to new places and the site resets (holes and flowers disappear); piles and mounds stay.
6. Open-ended: the rounds repeat. Exit: Back button or browser Back.

## 4. Rules and behavior

| Rule | Detail |
|---|---|
| Drive | Target speed is proportional to the distance to the touch point (gain 2.5 per second), capped at 35% of the screen width per second; speed is smoothed (rate 8 per second). |
| Stop | On release (or key release) the speed decays at rate 12 per second, so the machine is practically still after 0.5 s. |
| Site | Two screen widths wide (`WW = 2 x width`); the machine stays between 0.55 machine widths from both ends; the camera follows with damping and never shows beyond the site. |
| Hills | Three cosine hills (centres at 0.30, 0.64 and 0.92 of the site; height `min(6% of height, 4% of width)`). Standing on a hill reduces the target speed by up to 30%; the machine is tilted to follow the ground slope, clamped to 10 degrees. The speed never drops below 70%, so it cannot get stuck. |
| Dig | 1.2 s; the arm is a two-link boom and stick plus bucket driven by keyframes (dip at 0.28, scoop at 0.42, rise at 0.62, tip at 0.82). The machine pauses while digging and a second dig request during a dig is ignored. The dig point is 1.04 machine widths in front of the machine. |
| Hole | Digging within 0.45 machine widths of a cone turns the cone into a hole that grows for 1 s (starting when the bucket reaches the ground) and a spoil mound that grows for 0.5 s once the sand lands. |
| Piles | Three starting piles (0.17, 0.50, 0.84 of the site). Digging beside an existing pile makes it grow (up to 1.5 x); digging elsewhere adds a new mound; at most 8 extra mounds exist (the oldest is reused). |
| Flowers | When all three holes are fully grown, a flower (0.8 s growth, soft glow, no sound) appears at each hole; after 6 s the spots are re-picked. |
| Reset | Three of six candidate slots (0.08, 0.26, 0.42, 0.60, 0.74, 0.93, plus a small random shift) are chosen so that the set differs from the previous one; cones pop in over 0.4 s. |
| Failure, score | None; nothing is scored or stored. |
| Text, faces, sound | None. |

## 5. Educational and developmental benefits

**Intended design benefits**

- Steering a vehicle toward a goal; cause and effect (dig, hole, flower); free exploration of a larger space.

**Directly observable behavior**

- The machine follows the finger smoothly, tilts over hills, digs holes at cones and leaves piles; flowers grow after three holes.

**Requires professional or research-based validation**

- Any claim about learning or developmental benefits; nothing in the code can establish it.

## 6. Accessibility and usability

- **Input:** pointer events on the whole stage (touch, mouse, stylus); the dig button is 64 px (at least 56 px) at the bottom right; the excavator itself is a tap target of at least 56 x 56 px that follows the machine.
- **Keyboard:** left/right arrows drive (hold to keep driving); Space or Enter digs; Tab reaches the excavator button and the dig button (visible 4 px focus ring).
- **Labels (Polish):** scene "Koparka na Budowie. Strzałki jeżdżą koparką, spacja kopie."; excavator "Koparka – kopie dziurę"; dig button "Kop"; the SVG is decorative.
- **Non-colour cues:** cones, hole shape and mound size show the state; the dig animation shows when digging happens.
- **Reduced motion:** all movement and every end state is set from JavaScript (one rAF loop); no state exists only in a CSS keyframe or transition, so the activity behaves the same under `prefers-reduced-motion`.
- **Text:** none.

## 7. Risks and limitations

- Visual quality (machine proportions, arm, falling sand, flowers) has not been checked on a device (sections 17 and 18).
- On a narrow portrait screen the machine is about 83 px wide at 320 px.
- Dig spots on a hill slope are drawn at ground height but flat.
- No ending; relies on the global playtime limit.

## 8. Configuration

No external configuration. Constants at the top of [`js/koparka-jezdna.js`](../../js/koparka-jezdna.js): `SPEED` (0.35), `FOLLOW` (2.5), `ACCEL` (8), `STOP_RATE` (12), `FLIP_RATE`, `DIG_S` (1.2), `HOLE_S` (1), `MOUND_S`, `FLOWER_S` (0.8), `RESET_S` (6), `CONE_S`, `HOLES` (3), `MAX_MOUNDS` (8), `TILT_MAX` (10), `BUMP_SLOW` (0.3), `BUMPS`, `PILES`, `SLOTS`, `REACH` and the arm `KEYS`. Changing them needs a code edit.

## 9. Assets

No external asset files. Everything (sky, hills, ground, piles, cones, holes, flowers, excavator) is inline SVG created by `js/koparka-jezdna.js`; the menu icon is inline SVG in `js/activities.js`.

## 10. Randomization and variants

Which three of six slots hold the dig spots (and a small shift of each) is random and changes after every flower round; flower colours are fixed per spot index. `Math.random` is used directly.

## 11. Progression and difficulty

None; there are no levels and nothing persists.

## 12. Completion and feedback

A round is complete when three holes have been dug (a flower grows from each). Feedback: the dig animation, hole and mound growth, flowers with a soft glow. No failure state and no sound. The activity is open-ended.

## 13. Analytics and metrics

This activity reports to the shared on-device module `js/analytics.js` (`window.Analytics`). `js/app.js` records the activity start and end and the module counts touches in the stage; `js/koparka-jezdna.js` additionally calls `Analytics.track('interaction', { variant })` with variant `drive` (a drive touch or the first arrow key press), `hole` (a dig that opens a spot) or `dig` (any other dig), and `Analytics.complete()` when the three holes are dug and the flowers appear. All calls are wrapped so that nothing changes if `window.Analytics` is missing. The activity is not in the module's `COMPLETABLE` list (it repeats endlessly), so exit-before-completion is not defined for it. Data stays on the device as anonymous daily aggregates; see [README.md](README.md#analytics-status).

## 14. Technical implementation

- **Entry point:** `mount(container)` in [`js/koparka-jezdna.js`](../../js/koparka-jezdna.js) overrides `mount` of the `koparka-jezdna` entry; returns a cleanup function. The script is lazy-loaded via `src` on its registry entry in `js/activities.js`.
- **Rendering:** `div.ej > svg.ej-svg (far layer with sun, clouds and hills at half camera speed; world layer with ground, piles, spot groups, excavator, falling sand) + div.ej-hit + button.ej-dig`; the SVG `viewBox` equals the pixel size of the stage; the world layer is translated by the camera.
- **State:** machine position, speed, facing (eased through zero to turn), camera, tilt, dig time, spots (cone, hole, spoil mound, flower), mounds, reset timer.
- **Loop:** one `requestAnimationFrame` loop with `dt` capped at 0.05 s, guarded by `!raf`, cancelled while the tab is hidden and restarted on `visibilitychange`; it stops when nothing moves (speed, facing, camera, tilt, dig, growth and reset timer all settled) and restarts on input; cleanup cancels it and removes listeners and DOM.
- **Persistence:** none. **Analytics:** section 13.

## 15. Responsive layout and coordinate system

- `.ej` is fixed full-screen; all positions are pixels recomputed in `layout()` on `resize` and `orientationchange`, and the machine and camera positions are rescaled with the site width. The site is `2 x width` wide, the flat ground line at 72% of the height and the machine width `min(26% of width, 40% of height)` clamped to 72-280 px (320 x 568 to 1920 x 1080).

## 16. Error and edge-case handling

| Case | Behaviour |
|---|---|
| Touch far away or outside the site | The machine drives toward it at the capped speed and stops at the site end. |
| Release or cancelled touch | The machine coasts to a stop. |
| Dig during a dig | Ignored. |
| Dig at a site end | The dig point may fall outside the site; the mound is clamped inside it. |
| Hill | Slows the machine slightly and tilts it up to 10 degrees; it cannot get stuck. |
| Many digs | At most 8 extra mounds; the oldest is reused. |
| Resize / orientation | Layout and scene rebuilt; positions rescaled. |
| Leaving mid-round | Cleanup cancels the frame, removes listeners and the DOM. |
| Tab hidden / window blur | Loop cancelled and restarted on return; the `dt` cap prevents a jump; held arrow keys are released on blur. |
| `window.Analytics` missing | Calls are skipped. |

## 17. Testing

No automated tests exist. Manual scenarios (none are claimed as done):

- [ ] Hold a finger on the ground; the machine follows and turns; release; it stops within half a second.
- [ ] Drive over a hill; it slows slightly, tilts and carries on.
- [ ] Drive to both site ends; the camera follows and the machine stays inside.
- [ ] Tap the excavator and the dig button; the 1.2 s dig plays; digging at a cone makes a hole.
- [ ] Dig three holes; flowers appear; six seconds later the spots move.
- [ ] Keyboard: arrows to drive, Space to dig, Tab to the buttons.
- [ ] Rotate the device mid-round.
- [ ] Leave and reopen ten times quickly.
- [ ] Small screens (320 x 568, 568 x 320) and 1920 x 1080; reduced motion.

The PR for issue [#258](https://github.com/BielinskiLukasz/child-page/issues/258) reports a Node simulation with a stub DOM (speed cap and stop time, hill tilt and speed, holes at all spots, flowers and reset, ten open/close cycles, no `NaN` in attributes); no visual check was possible.

## 18. Known limitations and open issues

**Confirmed**

- No automated tests.

**Requires verification**

- Look and feel of the machine, arm, sand and flowers, and the layout on real devices.

## 19. Planned improvements

None currently planned. Sibling construction-site activities are tracked in issues [#259](https://github.com/BielinskiLukasz/child-page/issues/259) to [#262](https://github.com/BielinskiLukasz/child-page/issues/262).

## 20. Related activities and reusable components

- [Koparka](koparka.md), [Plac Budowy](plac-budowy.md), [Traktor](traktor.md), [Autobusik](autobusik.md).
- No shared component is used besides `window.Analytics`.

## 21. Change history

- Issue [#258](https://github.com/BielinskiLukasz/child-page/issues/258): initial activity.
