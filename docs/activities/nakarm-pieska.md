# Nakarm Pieska

Platform-wide behaviour (no sound, reduced motion, menu configuration, playtime limit, absence of automated tests, privacy) is described in [README.md](README.md#shared-platform-behaviour) and is not repeated here.

## 1. Overview

| Item | Value |
|---|---|
| Display name | Nakarm Pieska |
| Activity ID | `nakarm` (registry entry in [`js/activities.js`](../../js/activities.js)) |
| Description | A hungry dog of a random breed is fed by dragging a bone, dog food or water to it; a carrot is gently refused. |
| Category | Cause and effect; open-ended play; calming |
| Interaction type | Drag and drop (touch, mouse), keyboard alternative |
| Status | Implemented; enabled in the menu by default (appended last, no `defaultOff`) |
| Source | [`js/nakarm.js`](../../js/nakarm.js), shared drawings in [`js/dogs.js`](../../js/dogs.js), styles with prefix `nk-` in [`css/style.css`](../../css/style.css) |

## 2. Business purpose

- A dog activity with a caring, drag-and-drop mechanic and no wrong answers, different from washing ([Myjnia](myjnia.md), [Psia Myjnia](psia-myjnia.md)), racing ([Wyścig Piesków](wyscig-pieskow.md)) and fetching ([Aport](aport.md)); issue [#179](https://github.com/BielinskiLukasz/child-page/issues/179).
- Uses the shared dog drawings of [Rasy Piesków](rasy-pieskow.md) (`window.Dogs`, issue [#175](https://github.com/BielinskiLukasz/child-page/issues/175)).
- Gives a parent the Polish breed name, shown small under the dog.

## 3. Activity flow

1. The child opens the tile; a dog of a random breed (not the one of the previous launch) sits next to an empty bowl.
2. Initially displayed: a sky strip, a green yard with the dog and bowl, and a wooden table at the bottom with four pictures: bone, bowl of dog food, bowl of water, carrot.
3. Interactions: drag an item to the dog or the bowl; keyboard alternative in section 6.
4. Response: a dog-friendly item flies to the bowl or mouth (0.3 s) and is eaten (1.5 s chew), then a heart rises and the dog wags (1 s). The carrot makes the dog shake its head (0.9 s) and drifts back to the table in 0.5 s.
5. After 3 different items: the dog yawns (1 s), lies down with a soft glow (3 s), walks off to the left (0.5 s); a new breed walks in (0.7 s) and the items fade back onto the table (0.5 s).
6. The rounds repeat without end. Exit: Back button or browser Back.

## 4. Rules and behavior

| Rule | Detail |
|---|---|
| Items | Bone, food bowl and water are dog-friendly; the carrot is not. Each friendly item can be given once per round; it disappears when eaten and returns with the next round. |
| Drop target | The dog (button plus 12 px margin, including its name) or the empty bowl (plus 14 px margin). While a dragged item is over a target and the dog is waiting, both get a white 5 px outline and a yellow glow. |
| Drift back | An item dropped elsewhere, while the dog is busy, or the carrot, glides back to its table slot in 0.5 s (smoothstep). |
| Dog busy | The dog only accepts items while waiting; during chewing, wagging, shaking, yawning, lying and the breed change an item dropped on it simply drifts back. |
| Round | 3 different friendly items (all three) fill the dog. The count is never shown. |
| Faces | Only `dg-calm` and `dg-happy` (happy mouth shown while chewing and yawning); no angry or sad face exists. |
| Failure, score | None; nothing is scored or stored. |
| Sound | None. |

## 5. Educational and developmental benefits

**Intended design benefits**

- Cause and effect (an item given to the dog is eaten) and dragging and dropping with a finger.
- Matching pictures of food to a dog; noticing different dog breeds.

**Directly observable behavior**

- Friendly items are eaten, the carrot is refused, with feedback in both cases and no negative expression.

**Requires professional or research-based validation**

- Any claim about learning or developmental benefits; nothing in the code can establish it.

## 6. Accessibility and usability

- **Input:** pointer events (touch, mouse, stylus). The items are native `<button>` elements.
- **Keyboard:** Tab to an item (visible 4 px focus ring), Enter or Space gives it to the dog (it flies from the bowl; the carrot drifts back after a head shake).
- **Labels (Polish):** each item ("Kość. Przeciągnij do pieska lub naciśnij Enter, aby go poczęstować.", ...) and the dog ("Piesek: Labrador."); the SVG is decorative.
- **Target sizes:** items are `clamp(60, min(W/4.6, 17% of H), 100)` px square; the bowl is at least 64 x 56 px; the drop zone is larger than the drawing.
- **Layout:** the yard starts 56 px from the top (below the Back button); the table height is the item size plus 40 px; portrait and landscape from 320 x 568 to 1920 x 1080 (at 568 x 320 items are 60 px).
- **Non-colour cues:** the outline around the dog and bowl; items differ by shape, not only colour.
- **Reduced motion:** all movement is driven from JavaScript (one rAF loop), so it behaves the same; the glow, lying pose and positions are set from state, not from a CSS keyframe.
- **Text:** none except the small parent-facing breed name.

## 7. Risks and limitations

- Visual quality (dog size, head tilt and shake, glow, heart) has not been checked on a device (sections 17 and 18).
- The head movements pivot around an approximate head centre derived from the ear pivot of the shared drawing; on some breeds it may look slightly off.
- No ending; relies on the global playtime limit.

## 8. Configuration

No external configuration. Constants at the top of [`js/nakarm.js`](../../js/nakarm.js): `CHEW_S` (1.5), `WAG_S` (1.0), `SHAKE_S` (0.9), `YAWN_S` (1.0), `LIE_S` (3.0), `OUT_S` (0.5), `IN_S` (0.7), `BACK_S` (0.5), `FLY_S` (0.3), `FADE_S` (0.5), `ROUND_ITEMS` (3), `YARD_TOP` (56) and the `KINDS` list of items. Changing them needs a code edit.

## 9. Assets

No external asset files. The dog is inline SVG built by `Dogs.draw(id)`; items, bowl, heart, sky and the menu icon are inline SVG.

## 10. Randomization and variants

- Breed: uniformly from the 8 in `Dogs.LIST`; the first breed of a launch differs from the last one shown (module variable `lastBreed`) and each new breed differs from the previous one.
- Items are always the same four, in a fixed order.

## 11. Progression and difficulty

None; there are no levels and nothing persists.

## 12. Completion and feedback

A round is complete when the dog has eaten 3 different items. Feedback: happy chew, heart, tail wag; a head shake for the carrot; yawn, lying with a soft glow and a new breed at the end. No failure state. The activity is open-ended.

## 13. Analytics and metrics

This activity reports to the shared on-device module `js/analytics.js` (`window.Analytics`). `js/app.js` records the activity start and end and the module counts touches in the stage; `js/nakarm.js` additionally calls `Analytics.track('interaction', { variant: breedId })` on each give attempt (an item dropped on the dog or bowl, or given by keyboard) and `Analytics.complete()` when the dog is full. All calls are wrapped so that nothing changes if `window.Analytics` is missing. The activity is not in the module's `COMPLETABLE` list (it repeats endlessly), so exit-before-completion is not defined for it. Data stays on the device as anonymous daily aggregates; see [README.md](README.md#analytics-status).

## 14. Technical implementation

- **Entry point:** `mount(container)` in [`js/nakarm.js`](../../js/nakarm.js) overrides `mount` of the `nakarm` entry; returns a cleanup function.
- **Rendering:** `div.nk > svg.nk-sky + yard + table + glow + button.nk-dog (art + name) + bowl + heart + four button.nk-item`.
- **State:** dog phase `wait`, `eat`, `wag`, `shake`, `yawn`, `lie`, `out` or `in` with a phase timer; items with mode `home`, `drag`, `back`, `fly` or `gone`.
- **Loop:** one `requestAnimationFrame` loop with `dt` capped at 0.05 s, guarded by `!raf`, cancelled while the tab is hidden and restarted on `visibilitychange`; it stops when the dog waits and nothing else moves, and restarts on the next interaction; cleanup cancels it and removes listeners and DOM.
- **Persistence:** none. **Analytics:** section 13.

## 15. Responsive layout and coordinate system

- `.nk` is fixed full-screen; all positions are pixels inside it, recomputed in `layout()` on `resize` and `orientationchange` (items at rest return to their slots; the dog group is centred).
- Dog width is `min(52% of the width, (yard height - 42) x 1.2, 220 px)`; the dog and the bowl sit on the same baseline at the bottom of the yard.

## 16. Error and edge-case handling

| Case | Behaviour |
|---|---|
| Drop in the middle of nowhere | The item drifts back to the table in 0.5 s. |
| Drag cancelled by the system | The item drifts back. |
| Item given while the dog is busy | It drifts back and is still available. |
| Leaving mid-round | Cleanup cancels the frame, removes listeners and the DOM. |
| Tab hidden | Loop cancelled and restarted on return; the `dt` cap prevents a jump. |
| Resize / orientation | Layout recomputed; resting items return to their slots. |
| `window.Analytics` missing | Calls are skipped. |
| `window.Dogs` missing | Not handled. |

## 17. Testing

No automated tests exist. Manual scenarios (none are claimed as done):

- [ ] Drag the bone, food and water to the dog and to the bowl; each is eaten (1.5 s), a heart and wag follow.
- [ ] Drag the carrot to the dog; it shakes its head and the carrot returns in 0.5 s.
- [ ] Drop an item in empty space; it returns smoothly.
- [ ] After the third item: yawn, lying with a glow (3 s), a new breed (never the same), items back.
- [ ] The outline shows while dragging over the dog or bowl.
- [ ] Keyboard: Tab to each item, Enter/Space.
- [ ] Rotate the device mid-round.
- [ ] Leave and reopen ten times quickly.
- [ ] Small screens (320 x 568, 568 x 320) and 1920 x 1080.
- [ ] Reduced motion: eating, glow and the breed change still work.

The PR for issue [#179](https://github.com/BielinskiLukasz/child-page/issues/179) reports a Node simulation with a stub DOM; no visual check was possible.

## 18. Known limitations and open issues

**Confirmed**

- No automated tests.

**Requires verification**

- Look and feel of the head tilt and shake, glow and heart, and the layout on real devices.

## 19. Planned improvements

None currently planned.

## 20. Related activities and reusable components

- [Aport](aport.md), [Psia Myjnia](psia-myjnia.md), [Wyścig Piesków](wyscig-pieskow.md), [Myjnia](myjnia.md), [Rasy Piesków](rasy-pieskow.md).
- Shared component: [`js/dogs.js`](../../js/dogs.js) (`Dogs.LIST`, `Dogs.draw`).

## 21. Change history

- Issue [#179](https://github.com/BielinskiLukasz/child-page/issues/179): initial activity.
