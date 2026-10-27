# Koparka

Platform-wide behaviour (no sound, reduced motion, menu configuration, playtime limit, absence of automated tests, privacy) is described in [README.md](README.md#shared-platform-behaviour) and is not repeated here.

## 1. Overview

| Item | Value |
|---|---|
| Display name | Koparka |
| Activity ID | `koparka` (registry entry in [`js/activities.js`](../../js/activities.js)) |
| Description | The child drives an excavator with a finger: the arm scoops sand from a pile and tips it into a dump truck. The arm follows smoothly and cannot break. |
| Category | Control skill; cause and effect; open-ended play; calming |
| Interaction type | Finger/mouse drag anywhere on the screen, keyboard alternative |
| Status | Implemented; enabled in the menu by default (appended last, no `defaultOff`) |
| Source | [`js/koparka.js`](../../js/koparka.js), styles with prefix `kg-` in [`css/style.css`](../../css/style.css) |

## 2. Business purpose

- A precise-movement activity with a multi-part arm and a safe, failure-free model; issue [#182](https://github.com/BielinskiLukasz/child-page/issues/182).
- Differs from the other vehicle activities ([Traktor](traktor.md), [Autobusik](autobusik.md)) by direct control of an arm with three joints and a scoop-lift-drop sequence.

## 3. Activity flow

1. The child opens the tile; an excavator (base, boom, arm, bucket) rests on the left, a sand pile lies in the middle and a dump truck waits on the right.
2. Interactions: the child drags a finger anywhere; the bucket glides to the finger.
3. Dragging the bucket through the sand fills it (sand grows in the bucket and the pile sinks). The bucket then carries the sand with its opening tilted up.
4. Releasing over the truck bed (generous zone around it, white outline while dragging over it) moves the bucket above the bed, tips it for 0.9 s and the sand falls into the truck.
5. After 3 scoops the truck wobbles (0.6 s), drives off to the right (1.3 s) and an empty truck of another colour drives in (1.5 s, about 4 s in all); the pile refills gently in the meantime.
6. Releasing anywhere else lowers the bucket to a rest pose by the base; carried sand stays in the bucket. The rounds repeat without end. Exit: Back button or browser Back.

## 4. Rules and behavior

| Rule | Detail |
|---|---|
| Follow | The bucket moves toward the finger with a damped glide (rate 9 per second), capped at 60% of the screen width per second. |
| Arm | Two links (boom 0.36, arm 0.30 of the scene width) solved by inverse kinematics, elbow up; the arm end is always computed from the elbow, so the parts stay connected. |
| Working area | The bucket stays inside the scene, above the ground, in front of the base and between a minimum and a maximum distance from the boom foot (0.14 and 0.97 x 0.66 of the scene width); a finger outside the area is clamped to it. |
| Scoop | Moving the bucket (while the finger is down or a key was just used) through the pile for 0.17 scene widths fills it; the pile drops by 0.12 of its height per scoop and never below 0.64, then refills during the truck swap. |
| Tip | The bucket glides to the point above the bed (at most 1.4 s), rotates to 115 degrees, sand drops for about 0.5 s, the load in the truck grows by a third. |
| Truck swap | After 3 scoops: wobble, exit, new truck, entry, settle (total about 4 s); tipping is not accepted until the truck has settled. |
| Elsewhere | A release that is not over the truck, or a cancelled drag, lowers the bucket to rest; nothing breaks or fails. |
| Failure, score | None; nothing is scored or stored. |
| Text, faces, sound | None. |

## 5. Educational and developmental benefits

**Intended design benefits**

- Fine control of movement and of a following object; cause and effect (scoop, carry, tip).

**Directly observable behavior**

- The bucket follows the finger smoothly and the arm bends so it stays connected; sand moves from the pile to the truck.

**Requires professional or research-based validation**

- Any claim about learning or developmental benefits; nothing in the code can establish it.

## 6. Accessibility and usability

- **Input:** pointer events on the whole stage (touch, mouse, stylus), so the touch area is the full screen; the bucket does not have to be grabbed.
- **Keyboard:** Tab to the bucket (a 56 px or larger button follows it, visible 4 px focus ring); arrow keys move it by 3.5% of the scene width per press; Enter or Space starts a scoop when the bucket is in the sand (it fills in 0.6 s) and tips it when it is full and over the truck bed.
- **Label (Polish):** "Koparka. Strzałki ruszają łyżką, Enter lub spacja nabiera piasek albo wysypuje go na ciężarówkę."; the SVG is decorative.
- **Non-colour cues:** the bed outline while a full bucket is over the truck; sand shape and pile height show the state.
- **Reduced motion:** all movement is driven from JavaScript (one rAF loop), so it behaves the same under `prefers-reduced-motion`; no end state exists only in a CSS keyframe.
- **Text:** none.

## 7. Risks and limitations

- Visual quality (arm proportions, bucket shape, falling sand, truck wobble) has not been checked on a device (sections 17 and 18).
- The excavator is small on a narrow portrait screen (the scene is as wide as the screen).
- No ending; relies on the global playtime limit.

## 8. Configuration

No external configuration. Constants at the top of [`js/koparka.js`](../../js/koparka.js): `SPEED` (0.6), `FOLLOW` (9), `DIG_LEN` (0.17), `SCOOP_DROP` (0.12), `SCOOPS_PER_TRUCK` (3), `KEY_SCOOP_S` (0.6), `POUR_S` (0.9), `BACK_S` (0.35), `WOBBLE_S`, `OUT_S`, `GAP_S`, `IN_S`, `SETTLE_S`, `REFILL_S`, the bucket angles and `TRUCK_COLORS`. Changing them needs a code edit.

## 9. Assets

No external asset files. Everything (sky, ground, pile, truck, excavator, sand) is inline SVG created by `js/koparka.js`; the menu icon is inline SVG in `js/activities.js`.

## 10. Randomization and variants

None. Trucks cycle through three colours in a fixed order; falling sand grains have a small random sideways spread.

## 11. Progression and difficulty

None; there are no levels and nothing persists.

## 12. Completion and feedback

A truck is full after 3 tipped scoops. Feedback: sand in the bucket and the truck, a falling stream, a wobble and a new truck. No failure state. The activity is open-ended.

## 13. Analytics and metrics

This activity reports to the shared on-device module `js/analytics.js` (`window.Analytics`). `js/app.js` records the activity start and end and the module counts touches in the stage; `js/koparka.js` additionally calls `Analytics.track('interaction', { variant: 'scoop' })` when a scoop is filled, `Analytics.track('interaction', { variant: 'tip' })` when a full bucket is tipped and `Analytics.complete()` when a truck is full. All calls are wrapped so that nothing changes if `window.Analytics` is missing. The activity is not in the module's `COMPLETABLE` list (it repeats endlessly), so exit-before-completion is not defined for it. Data stays on the device as anonymous daily aggregates; see [README.md](README.md#analytics-status).

## 14. Technical implementation

- **Entry point:** `mount(container)` in [`js/koparka.js`](../../js/koparka.js) overrides `mount` of the `koparka` entry; returns a cleanup function.
- **Rendering:** `div.kg > svg.kg-svg (sky and ground, pile, truck, excavator and bucket, sand grains) + button.kg-bucket`; the SVG `viewBox` equals the pixel size of the stage and its elements are updated every frame.
- **State:** bucket position `T` glides toward the aim point `G`; scoop progress, a filled flag, a tip phase (`goto`, `pour`, `back`) and a truck phase (`wait`, `wobble`, `out`, `gap`, `in`, `settle`).
- **Loop:** one `requestAnimationFrame` loop with `dt` capped at 0.05 s, guarded by `!raf`, cancelled while the tab is hidden and restarted on `visibilitychange`; it stops when nothing moves and restarts on input; cleanup cancels it and removes listeners and DOM.
- **Persistence:** none. **Analytics:** section 13.

## 15. Responsive layout and coordinate system

- `.kg` is fixed full-screen; all positions are pixels recomputed in `layout()` on `resize` and `orientationchange`. The scene width is `min(width, 1.4 x height)`, centred; every size is a fraction of it, so the arm geometry keeps its proportions in portrait and landscape (320 x 568 to 1920 x 1080).
- The ground line is at `min(76% of the height, 50% of the height + 0.45 x scene width)`.

## 16. Error and edge-case handling

| Case | Behaviour |
|---|---|
| Finger outside the working area | The aim point is clamped to the nearest reachable point. |
| Very fast finger | The bucket speed is capped at 60% of the screen width per second. |
| Release elsewhere / cancelled drag | The bucket lowers to rest; carried sand stays. |
| Release over the truck while it is driving | Treated as elsewhere; the bucket rests with its sand. |
| Pile low | Never below 0.64 of its height, and it refills during every truck swap. |
| Resize / orientation | Layout recomputed; the bucket position is re-clamped. |
| Leaving mid-round | Cleanup cancels the frame, removes listeners and the DOM. |
| Tab hidden | Loop cancelled and restarted on return; the `dt` cap prevents a jump. |
| `window.Analytics` missing | Calls are skipped. |

## 17. Testing

No automated tests exist. Manual scenarios (none are claimed as done):

- [ ] Drag through the sand; sand grows in the bucket and the pile sinks.
- [ ] Release over the truck; the bucket moves above the bed, tips and the load grows.
- [ ] After 3 scoops the truck wobbles, leaves and an empty one arrives in about 4 s; the pile is full again.
- [ ] Release elsewhere; the bucket lowers to rest.
- [ ] Drag to the screen corners; the arm stays connected and the bucket stays in the working area.
- [ ] Keyboard: Tab to the bucket, arrows, Enter/Space over the sand and over the truck.
- [ ] Rotate the device mid-round.
- [ ] Leave and reopen ten times quickly.
- [ ] Small screens (320 x 568, 568 x 320) and 1920 x 1080; reduced motion.

The PR for issue [#182](https://github.com/BielinskiLukasz/child-page/issues/182) reports a Node simulation with a stub DOM (arm connectivity, clamping, speed cap, three scoops and the truck swap, ten open/close cycles); no visual check was possible.

## 18. Known limitations and open issues

**Confirmed**

- No automated tests.

**Requires verification**

- Look and feel of the arm, bucket and falling sand, and the layout on real devices.

## 19. Planned improvements

None currently planned. A separate issue covers a construction-site scene with several machines.

## 20. Related activities and reusable components

- [Traktor](traktor.md), [Autobusik](autobusik.md), [Myjnia](myjnia.md).
- No shared component is used besides `window.Analytics`.

## 21. Change history

- Issue [#182](https://github.com/BielinskiLukasz/child-page/issues/182): initial activity.
