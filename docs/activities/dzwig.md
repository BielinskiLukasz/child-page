# Dźwig

Platform-wide behaviour (no sound, reduced motion, menu configuration, playtime limit, absence of automated tests, privacy) is described in [README.md](README.md#shared-platform-behaviour) and is not repeated here.

## 1. Overview

| Item | Value |
|---|---|
| Display name | Dźwig |
| Activity ID | `dzwig` (registry entry in [`js/activities.js`](../../js/activities.js), lazy-loaded via `src` on its registry entry) |
| Description | The child moves a tower-crane hook with a finger, lifts bricks and stacks six of them into a little house. |
| Category | Cause and effect; hand-eye coordination; open-ended play; calming |
| Interaction type | Drag anywhere to move the trolley and hook; lift the finger to release; keyboard alternative |
| Status | Implemented; enabled in the menu by default (appended last, no `defaultOff`) |
| Source | [`js/dzwig.js`](../../js/dzwig.js), styles with prefix `dg-` in [`css/style.css`](../../css/style.css) (the shared dog drawings in `js/dogs.js` also use `dg-` class names, none of which this activity reuses) |

## 2. Business purpose

- A calm lifting-and-stacking game with a happy ending; issue [#261](https://github.com/BielinskiLukasz/child-page/issues/261), part of the construction-site request of 2026-11-02.
- Differs from [Wieża z Klocków](wieza-z-klockow.md) by the crane mechanic (trolley, hook, lowering, swing) and from [Plac Budowy](plac-budowy.md) and [Koparka](koparka.md) by player-controlled lifting.

## 3. Activity flow

1. The child opens the tile and sees a tower crane on the left, a pile of six bricks (red, blue, yellow) on the ground and a dashed 3-2-1 outline of the build area.
2. A horizontal finger drag moves the trolley along the jib (damped); a vertical drag lowers or raises the hook within the working area.
3. When the hook touches a free brick it hooks it automatically and lifts it; the brick swings gently (at most 8 degrees) and settles within about 1 s.
4. Lifting the finger over the build area drops the brick into the nearest free supported slot (snap in 0.4 s); lifting it elsewhere lowers the brick gently to the ground, where it can be hooked again.
5. With all six placed the stack gets a roof and a soft glow. After 5 s the bricks glide back to the pile (0.8 s) and the roof fades.
6. Open-ended. Exit: Back button or browser Back.

## 4. Rules and behavior

| Rule | Detail |
|---|---|
| Control | Relative finger drag: trolley x and hook length targets follow the finger 1:1; both are damped. Limits: trolley along the jib, hook between the jib and the ground. |
| Hook | A brick is hooked when the hook tip touches its top and no brick lies on it. A released brick cannot be re-hooked until the hook has moved about 0.8 brick widths away. |
| Swing | Damped pendulum driven by the trolley acceleration, clamped to 8 degrees, damped to rest in about 1 s. |
| Slots | 3 bottom, 2 middle, 1 top; a middle or top slot is offered only when both slots below it are taken. The nearest eligible slot to the released brick is used. |
| Release elsewhere | The brick lowers to the ground (0.3-1.2 s by height) or onto a brick below it. |
| Completion | Six placed: roof and glow (0.5 s fade-in), return after 5 s. |
| Failure, score, text, sound | None. Bricks never topple. |

## 5. Educational and developmental benefits

**Intended design benefits**

- Cause and effect (drag, lift, release); two-axis control; planning where a brick goes; counting to six.

**Directly observable behavior**

- The hook follows the finger with damping, bricks hang from it and swing slightly, and the stack gets a roof.

**Requires professional or research-based validation**

- Any claim about learning or developmental benefits; nothing in the code can establish it.

## 6. Accessibility and usability

- **Input:** pointer events (touch, mouse, stylus) anywhere on the stage. Bricks are 56-90 px wide and at least 56 px tall.
- **Keyboard:** arrows move the trolley and hook (340 px/s); Space grabs the nearest brick within reach or releases the held one.
- **Labels (Polish):** scene "Dźwig. Strzałki przesuwają wózek i hak, spacja chwyta lub puszcza klocek." The SVG scene is decorative.
- **Non-colour cues:** each colour has its own brick pattern (lines, dots, diagonals).
- **Reduced motion:** every state is set from JavaScript (one rAF loop); nothing exists only in a CSS keyframe.
- **Text:** none on screen.

## 7. Risks and limitations

- Visual quality has not been checked on a device (sections 17 and 18).
- On very small landscape screens the stack and roof leave little room below the jib.

## 8. Configuration

No external configuration. Constants at the top of [`js/dzwig.js`](../../js/dzwig.js): `SNAP_S` (0.4), `DONE_S` (5), `BACK_S`, `ROOF_S`, `MAX_SWING` (8), `SWING_K`, `SWING_C`, `SWING_COUP`, `KEY_V`.

## 9. Assets

No external asset files. Crane, bricks and roof are inline SVG created by `js/dzwig.js`; the menu icon is inline SVG in `js/activities.js`.

## 10. Randomization and variants

None. Brick colours repeat red, blue, yellow.

## 11. Progression and difficulty

None; nothing persists.

## 12. Completion and feedback

A house is complete when the sixth brick is placed (roof and glow, then the bricks return). Feedback: hook swing, snap, roof and glow. No failure state and no sound. Open-ended.

## 13. Analytics and metrics

Reports to `window.Analytics`: `track('interaction', { variant })` with variant `hook` (each brick hooked) or `place` (each brick placed), and `complete()` when the sixth brick is placed. Calls are wrapped so nothing changes if `window.Analytics` is missing. The activity is not in the module's `COMPLETABLE` list. Data stays on the device; see [README.md](README.md#analytics-status).

## 14. Technical implementation

- **Entry point:** `mount(container)` in [`js/dzwig.js`](../../js/dzwig.js) overrides `mount` of the `dzwig` entry; returns a cleanup function. Lazy-loaded via `src`.
- **Rendering:** `div.dg-root > svg.dg-scene` with mast, jib, slots, six brick groups, roof, cable, trolley and hook; the `viewBox` equals the stage pixel size.
- **State:** trolley and hook length (target and damped value), swing angle and velocity, per-brick state (pile, held, lower, ground, snap, placed, return), phase (idle, done, back).
- **Loop:** one `requestAnimationFrame` loop, `dt` capped at 0.05 s, cancelled while the tab is hidden and restarted on `visibilitychange`; stops when nothing moves. Cleanup cancels it and removes listeners and DOM.
- **Persistence:** none.

## 15. Responsive layout and coordinate system

Pixels recomputed in `layout()` on `resize` and `orientationchange`. Brick width is `(W - 36) / 5` clamped to 56-90 px so that the pile (2 columns), the build area (3 columns) and the mast fit at 320 px; brick height is at least 56 px. The jib spans the top, the ground the bottom. State is kept on resize.

## 16. Error and edge-case handling

| Case | Behaviour |
|---|---|
| Release over the build area | Nearest free supported slot. |
| Release elsewhere | Lowers to the ground or onto a brick below. |
| Hook touches a brick with another on top | Ignored; only free tops are hooked. |
| Fast drag | The hook path is sampled at three points per frame so a brick is not skipped. |
| Resize / orientation | Layout recomputed; state kept. |
| Leaving mid-round | Cleanup cancels the frame, removes listeners and DOM. |
| `window.Analytics` missing | Calls are skipped. |

## 17. Testing

No automated tests exist. Manual scenarios (none are claimed as done):

- [ ] Drag to a brick; it hooks itself, lifts and swings by at most 8 degrees, settling in about 1 s.
- [ ] Lift the finger over the build area; the brick snaps into the nearest free slot in 0.4 s; middle and top slots are offered only when supported.
- [ ] Lift the finger elsewhere; the brick lowers gently to the ground and can be hooked again.
- [ ] Place all six; roof and glow appear and after 5 s the bricks return.
- [ ] Keyboard: arrows and Space.
- [ ] Rotate the device; leave and reopen ten times quickly; reduced motion; 320 x 568, 568 x 320, 1920 x 1080.

The PR for issue [#261](https://github.com/BielinskiLukasz/child-page/issues/261) reports a Node simulation with a stub DOM; no visual check was possible.

## 18. Known limitations and open issues

**Confirmed**

- No automated tests.

**Requires verification**

- Look and feel of the crane and the swing, and the layout on real devices.

## 19. Planned improvements

None currently planned.

## 20. Related activities and reusable components

- [Wieża z Klocków](wieza-z-klockow.md), [Koparka](koparka.md), [Plac Budowy](plac-budowy.md), [Koparka na Budowie](koparka-na-budowie.md).
- No shared component is used besides `window.Analytics`.

## 21. Change history

- Issue [#261](https://github.com/BielinskiLukasz/child-page/issues/261): initial activity.
