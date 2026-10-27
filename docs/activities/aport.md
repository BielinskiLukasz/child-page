# Aport

Platform-wide behaviour (no sound, reduced motion, menu configuration, playtime limit, absence of automated tests, privacy) is described in [README.md](README.md#shared-platform-behaviour) and is not repeated here.

## 1. Overview

| Item | Value |
|---|---|
| Display name | Aport |
| Activity ID | `aport` (registry entry in [`js/activities.js`](../../js/activities.js)) |
| Description | A park where the child drags and throws a ball and a dog of a random breed fetches it, brings it back, sits and wags. |
| Category | Cause and effect; open-ended play; calming |
| Interaction type | Drag and release (touch, mouse), tap, keyboard alternative |
| Status | Implemented; enabled in the menu by default (appended last, no `defaultOff`) |
| Source | [`js/aport.js`](../../js/aport.js), shared drawings in [`js/dogs.js`](../../js/dogs.js), styles with prefix `ap-` in [`css/style.css`](../../css/style.css) |

## 2. Business purpose

- A dog activity with a play-with-the-dog mechanic (throw and fetch), different from washing ([Myjnia](myjnia.md), [Psia Myjnia](psia-myjnia.md)) and racing ([Wyścig Piesków](wyscig-pieskow.md)); issue [#178](https://github.com/BielinskiLukasz/child-page/issues/178).
- Uses the shared dog drawings of [Rasy Piesków](rasy-pieskow.md) (`window.Dogs`, issue [#175](https://github.com/BielinskiLukasz/child-page/issues/175)).
- Gives a parent the Polish breed name, shown small under the dog.

## 3. Activity flow

1. The child opens the tile; a dog of a random breed (not the one of the previous launch) sits at its starting spot with a ball resting next to it on the grass.
2. Initially displayed: a sky strip with a sun, clouds and two trees above a green grass area; the dog briefly wags (calm face).
3. Interactions: drag the ball and release it anywhere on the grass; tap the dog; keyboard alternative in section 6.
4. Response: the ball lands at the release point after a 0.8 s arc; the dog runs to it on a curved path, picks it up (about 0.35 s or longer after a very short throw), brings it back to its starting spot, drops it beside itself, sits and wags for 2.5 s.
5. A new throw while the dog is running redirects it smoothly; tapping the dog switches to another random breed with a small sparkle.
6. After 3 completed fetches the dog does a happy spin (0.9 s) and a heart rises; nothing counts or shows the number.
7. There is no end and no restart step. Exit: Back button or browser Back.

## 4. Rules and behavior

| Rule | Detail |
|---|---|
| Throw | The ball follows the finger while dragged (lifted 10 px). On release it hops in a 0.8 s arc (height `min(130 px, 30% of the grass height)`) and lies at the release point, clamped to at least 28 px from the grass sides, 46 px from its top and 10 px from its bottom. A tap without dragging throws in place. |
| Dog speed | Planned per throw from the round-trip length `L` (dog to ball to start): total time `T = clamp(1.6 + L / (0.3 W), 3.6, 5.2)` s, speed `1.1 L / (T - 1.4)`, never above 0.6 W per second (`W` = grass width); acceleration is 2.5 times the speed per second, the speed slews towards a new plan at most 0.25 W per second squared. |
| Path | The heading is the direction to the target rotated by up to 0.55 rad (random side, reversed on the way back), fading to zero near the target; the velocity is slew-limited so the path is smooth. |
| Redirect | A throw while the dog is running changes only its target; its velocity is kept. The ball can be picked up again from the grass until the dog has grabbed it. |
| Pick-up and return | The dog stops at the ball with its mouth at it; the ball lifts to its mouth (0.35 s, extended up to 2.4 s after a very short throw so that a fetch takes about 3.6 s), then the dog returns, drops the ball beside its starting spot (0.3 s) and sits and wags. |
| Fetch time | In a Node simulation with a stub DOM, an undisturbed fetch took 3.6-5.4 s at 320 x 440, 544 x 244, 1000 x 600 and 1920 x 1080 grass sizes; the peak speed stayed below 0.6 W per second (0.57 at 320 px wide portrait). |
| Breed switch | Tapping the dog picks another breed from `Dogs.LIST` (never the current one) and shows 8 sparkles for 0.6 s; the breed keeps its position and state. |
| Reward | Every 3rd completed fetch: happy spin, hop and a heart rising for 2.2 s. The count restarts at 0 and is never shown. |
| Faces | Only `dg-calm` and `dg-happy`; no angry or sad face exists. |
| Failure, score | None; nothing is scored or stored. |
| Sound | None. |

## 5. Educational and developmental benefits

**Intended design benefits**

- Cause and effect (a throw sends the dog to the ball) and dragging and releasing with a finger.
- Noticing different dog breeds.

**Directly observable behavior**

- The dog goes where the ball lands and brings it back.

**Requires professional or research-based validation**

- Any claim about fine-motor, coordination or social benefits; nothing in the code can establish it.

## 6. Accessibility and usability

- **Input:** pointer events (touch, mouse, stylus). The ball and the dog are native `<button>` elements.
- **Keyboard:** Tab to the ball (visible 4 px focus ring and a dashed ring on the grass), arrow keys move the ring in steps of 6% of the grass, Enter or Space throws the ball to the ring (it travels there in the same 0.8 s arc); Tab to the dog, Enter or Space changes the breed.
- **Labels (Polish):** the ball ("Piłka. Przeciągnij i puść, aby rzucić. Strzałki przesuwają kółko, Enter lub spacja rzuca.") and the dog ("Piesek: Labrador. Dotknij lub naciśnij Enter, aby zmienić rasę."); the SVG is decorative.
- **Target sizes:** the ball button is 56 x 56 px; the dog button is at least 56 px wide and high (dog width `min(30% of the grass width, 41% of its height, 170 px)`).
- **Layout:** the grass starts below the Back button and fills the rest of the screen, portrait and landscape from 320 x 568 to 1920 x 1080.
- **Reduced motion:** all movement, wagging, sparkles and the heart are driven from JavaScript, so they behave the same; no state exists only in a CSS keyframe.
- **Text:** none except the small parent-facing breed name.

## 7. Risks and limitations

- Visual quality (dog size, arc, sparkle, heart) has not been checked on a device (sections 17 and 18).
- On a narrow portrait screen the 0.6 W per second speed cap can make the farthest throws take slightly longer than the planned time.
- No ending; relies on the global playtime limit.

## 8. Configuration

No external configuration. Constants at the top of [`js/aport.js`](../../js/aport.js): `FLY_S` (0.8), `GRAB_S` (0.35), `DROP_S` (0.3), `SPIN_S` (0.9), `HEART_S` (2.2), `WAG_S` (2.5), `SPARK_S` (0.6), `SPARKS` (8), `SPEED_CAP` (0.6), `HOME` (0.25, 0.76), `KEY_STEP` (0.06), `FETCHES_FOR_REWARD` (3). Changing them needs a code edit.

## 9. Assets

No external asset files. The dog is inline SVG built by `Dogs.draw(id)`; ball, heart, sky and the menu icon are inline SVG.

## 10. Randomization and variants

- Breed: uniformly from the 8 in `Dogs.LIST`; the first breed of a launch differs from the last one shown (module variable `lastBreed`); a tap picks any other breed.
- The side of the curved path is random per leg.

## 11. Progression and difficulty

None; there are no levels and nothing persists.

## 12. Completion and feedback

A fetch is complete when the dog is back at its starting spot. Feedback: happy face, tail wag, and every 3rd fetch a spin and a heart. No failure state. The activity is open-ended.

## 13. Analytics and metrics

This activity reports to the shared on-device module `js/analytics.js` (`window.Analytics`). `js/app.js` records the activity start and end and the module counts touches in the stage; `js/aport.js` additionally calls `Analytics.track('interaction', { variant: breedId })` on each throw (pointer or keyboard) and on each dog tap, and `Analytics.complete()` when a fetch is completed. All calls are wrapped so that nothing changes if `window.Analytics` is missing. The activity is not in the module's `COMPLETABLE` list (it repeats endlessly), so exit-before-completion is not defined for it. Data stays on the device as anonymous daily aggregates; see [README.md](README.md#analytics-status).

## 14. Technical implementation

- **Entry point:** `mount(container)` in [`js/aport.js`](../../js/aport.js) overrides `mount` of the `aport` entry; returns a cleanup function.
- **Rendering:** `div.ap > svg.ap-sky + div.ap-grass > shadow, button.ap-dog (art + name), ring, button.ap-ball, sparkle layer, heart`.
- **State:** dog (fractional position, velocity in px/s, phase `sit`, `run`, `grab`, `back` or `spin`, facing, plan), ball (fractional position, mode `lying`, `drag`, `fly`, `carried` or `drop`), keyboard ring, sparkle and heart timers.
- **Loop:** one `requestAnimationFrame` loop with `dt` capped at 0.05 s, guarded by `!raf`, cancelled while the tab is hidden and restarted on `visibilitychange`; it stops when the dog sits after its wag and nothing else moves, and restarts on the next interaction; cleanup cancels it and removes listeners and DOM.
- **Persistence:** none. **Analytics:** section 13.

## 15. Responsive layout and coordinate system

- `.ap` is fixed full-screen; the grass starts at `max(24%, safe area + 64px)` from the top and fills the rest.
- Dog and ball positions are fractions (0-1) of the grass width and height; pixel positions are recomputed on `resize` and `orientationchange`, and the ball is clamped again, so rotation never moves the ball outside the grass.
- The resting ball is placed relative to the dog's starting spot and recomputed at every layout.

## 16. Error and edge-case handling

| Case | Behaviour |
|---|---|
| Release outside the grass | The ball is clamped to the nearest grass point. |
| Drag cancelled by the system | The ball stays where it was lifted. |
| Ball while the dog holds it or spins | Not interactive. |
| Leaving mid-fetch | Cleanup cancels the frame, removes listeners and the DOM. Ten quick open/close cycles leave no loop running. |
| Tab hidden | Loop cancelled and restarted on return; the `dt` cap prevents a jump. |
| Resize / orientation | Positions re-computed from fractions. |
| `window.Analytics` missing | Calls are skipped. |
| `window.Dogs` missing | Not handled. |

## 17. Testing

No automated tests exist. Manual scenarios (none are claimed as done):

- [ ] Drag the ball, release, the dog fetches it in 3-6 s and sits and wags.
- [ ] Throw again while the dog runs; it turns smoothly without jumping.
- [ ] Release the ball outside the grass (above, at the edges); it lands on the nearest grass point.
- [ ] Tap the dog several times; the breed always changes and a sparkle shows.
- [ ] Three fetches in a row: spin and heart, no counter.
- [ ] Rotate the device with the ball far from the dog; the ball stays on the grass.
- [ ] Keyboard: Tab, arrows, Enter/Space for the ball and the dog.
- [ ] Leave and reopen ten times quickly.
- [ ] Small screens (320 x 568) and 1920 x 1080, portrait and landscape.
- [ ] Reduced motion: movement, wagging, sparkles and heart still work.
- [ ] Browsers: Chrome desktop, Chrome Android, Safari iPhone/iPad.

The PR for issue [#178](https://github.com/BielinskiLukasz/child-page/issues/178) reports a Node simulation with a stub DOM; no visual check was possible.

## 18. Known limitations and open issues

**Confirmed**

- No automated tests.

**Requires verification**

- Look and feel of the arc, sparkles and heart, and the dog size on real devices.

## 19. Planned improvements

None currently planned.

## 20. Related activities and reusable components

- [Psia Myjnia](psia-myjnia.md), [Wyścig Piesków](wyscig-pieskow.md), [Myjnia](myjnia.md), [Rasy Piesków](rasy-pieskow.md).
- Shared component: [`js/dogs.js`](../../js/dogs.js) (`Dogs.LIST`, `Dogs.draw`).

## 21. Change history

- Issue [#178](https://github.com/BielinskiLukasz/child-page/issues/178): initial activity.
