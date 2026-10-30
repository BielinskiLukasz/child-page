# Rasy Piesków

Platform-wide behaviour (no sound, reduced motion, menu configuration, playtime limit, absence of automated tests, privacy) is described in [README.md](README.md#shared-platform-behaviour); this document only records what is specific to this activity.

## 1. Overview

| Item | Value |
|---|---|
| Display name | Rasy Piesków |
| Activity ID | `rasy` (registry entry in [`js/activities.js`](../../js/activities.js)) |
| Description | One dog at a time, drawn large with its Polish breed name underneath; arrows, swipe or arrow keys move between the eight breeds. The dog is alive (blink, wag, idle actions) and a touch triggers one of six gentle actions. |
| Category | Cause and effect; observation; open-ended play |
| Interaction type | Tap, horizontal swipe, arrow buttons, keyboard |
| Status | Implemented; enabled in the menu by default (appended last, no `defaultOff`) |
| Source | [`js/rasy.js`](../../js/rasy.js) (activity), [`js/dogs.js`](../../js/dogs.js) (shared drawings, `window.Dogs`), styles with prefixes `rp-` and `dg-` in [`css/style.css`](../../css/style.css), lazy-loaded via `src`/`deps` on its registry entry in js/activities.js |

## 2. Business purpose

- Introduces the foundation of the dog theme from issue [#175](https://github.com/BielinskiLukasz/child-page/issues/175): one shared set of breed drawings (`window.Dogs`) that later dog activities can reuse, plus an activity that hosts the menu tile, Settings entry and README entry.
- Lets the child look at and name familiar breeds (Labrador, Jamnik, Husky, Pudel, Owczarek, Buldog, Corgi, Dalmatyńczyk), one at a time.
- Complements the animal activities built on [`js/animals.js`](../../js/animals.js), such as [Zwierzątka na Farmie](zwierzatka-na-farmie.md), with a single-theme, breed-specific view.
- Issue [#204](https://github.com/BielinskiLukasz/child-page/issues/204) turned the gallery into a one-dog-at-a-time activity so the child meets each breed in turn and sees it do fun things.
- Described in the README Activities list as item 47.

## 3. Activity flow

1. The child opens the tile; the eight breeds are shuffled (`Rand.shuffle`) and the first one is shown, drawn large on a soft green background.
2. Initially displayed: one calm dog (blinking, tail wagging gently), its breed name under it, a large arrow button at each side (bottom corners in portrait, vertically centred at the sides in landscape).
3. Interactions: tap the dog (or focus it and press Enter/Space); tap an arrow, swipe horizontally, or press the Left/Right arrow key.
4. Response to a touch: one 2.5 s action chosen at random, never the same twice in a row: wag and smile, jump on the spot, spin around, bark ("Hau!" bubble, no sound), roll over, sit and give a paw. Touches during that action are ignored.
5. Navigation: the next/previous dog of the shuffled cycle fades in over 0.5 s while the old one fades out; the first and last wrap around, so every breed is seen once before any repeats.
6. There is no completion state.
7. Restart: leaving and re-opening reshuffles; nothing is stored.
8. Exit: Back button or browser Back.

## 4. Rules and behavior

| Rule | Detail |
|---|---|
| Dog size | Drawn with `Dogs.draw(id, { scale: 1 })` (size-class scales are not applied), filling the area between the Back button and the arrows; the visible dog is about 45-65% of the shorter screen side from 568 x 320 up. |
| Order | `order = Rand.shuffle(Dogs.LIST)` per launch, start at index 0; arrows wrap around. |
| Touch actions | `TOUCH` = wag, jump, spin, bark, roll, paw; `Rand.pickOne(TOUCH, 'rasy-touch')` (never the same twice in a row). Each lasts `ACT_S = 2.5` s; the happy face and glow (`rp-on`) show for all of them; touches during an action are ignored. |
| Action motions | wag: tail up to 18 degrees at 2.2 Hz; jump: one 16-unit hop; spin: one turn (mirror flip) in 2.1 s; bark: head up and a "Hau!" bubble; roll: 360 degrees eased over 2.1 s (peak below 260 degrees/s); paw: sits (rotation about the rear feet, front legs kept upright) and lifts the near front paw. |
| Idle life | Blink every 3-5 s (0.16 s); gentle tail wag; every 8-12 s one idle action (`look` back or up, `sniff`, `scratch`, `sit`), calm face, picked with `Rand.pickOne(IDLE, 'rasy-idle')`. A touch during an idle action replaces it (pose values ease at about 6 per second, so there is no jump). |
| Swipe | Horizontal move of at least 50 px that is more than 1.5 times the vertical move navigates; the click that follows a swipe is ignored, so a swipe never starts an action. |
| Navigation during an action | The old dog is reset to its neutral pose at once and fades out. |
| Faces | Only `dg-calm` and `dg-happy`; no angry or sad face. |
| Failure, score | None; nothing is scored or stored. |
| Sound | None. |

## 5. Educational and developmental benefits

**Intended design benefits**

- Cause and effect (touch, the dog reacts).
- Noticing and naming dog breeds (Polish labels).

**Directly observable behavior**

- A touched dog plays one 2.5 s action and looks happy.
- Every dog has a visible Polish name and a distinct colour and silhouette (ear shape, tail shape, markings).

**Requires professional or research-based validation**

- Any claim about breed recognition or vocabulary. Nothing in the code can establish it, and recognisability of the drawings has not been checked on a device.

## 6. Accessibility and usability

- **Input:** the dog and the two arrows are native `<button>`s using `click`; touch, mouse and keyboard (Tab, Enter, Space, Left/Right arrow keys) work, swipe uses pointer events. Focus ring: 4 px outline.
- **Labels (Polish):** the dog button has `aria-label` set to the breed name; the arrows are "Poprzedni" and "Następny"; SVG and bubble are `aria-hidden`. There is no state announcement.
- **Target sizes:** arrows are 64 x 64 px; the dog button fills the dog area.
- **Layout:** portrait: dog area below the Back button, arrows in the bottom corners; landscape: dog area between the side arrows (`@media (orientation: landscape)`). The same DOM is kept on rotation, so the dog and its state persist.
- **Colour:** the breed name is always shown as text; the happy state is also shown by the mouth shape, not only by the glow.
- **Reduced motion:** a touch only shows the smile and glow for 2.5 s (class `rp-on`, `display` attributes set from JavaScript); the idle life is just the blink (no wag, no idle actions, no bubble). Navigation works; the CSS fade is disabled by the global rule so the dogs swap instantly.
- **Touch:** `touch-action: none` on the scene (so swipes are delivered), `manipulation` on the buttons.
- **Reading:** not required (names are a parent-facing aid). A young child can use it independently.

## 7. Risks and limitations

- Breed recognisability and the size of the smallest drawings (Pudel, Jamnik at 320 x 568) have not been checked on a device (see sections 17 and 18).
- Breeds are stylised cartoons, not accurate depictions.
- No ending; relies on the global playtime limit.
- No privacy concerns; nothing is stored.

## 8. Configuration

No external configuration. Constants in [`js/rasy.js`](../../js/rasy.js): `ACT_S` (2.5 s touch action), `FADE_MS` (500), `SWIPE_PX` (50), the action lists `TOUCH` / `IDLE` with `IDLE_DUR`, the sit pivot `RX, RY`, and a frame time cap of 0.05 s in `frame()`; `pose(kind, t, dir)` is the pure table of action motions. Breed data lives in `DEFS` and `ORDER` in [`js/dogs.js`](../../js/dogs.js): per breed the name, size class, body length/height, leg height, head radius, snout, colours, ear type (`floppy`, `point`, `fold`, `puff`), tail type (`thick`, `curl`, `pom`, `stub`, `bushy`) and decoration (`spots`, `mask`, `saddle`, `none`). `Dogs.SCALE` (size-class scales) is not applied here.

Fallback: `Dogs.byId` returns the first breed (Labrador) for an unknown id. `window.Dogs` is required by `rasy.js` and is not checked for being absent.

## 9. Assets

No external asset files. Every dog is an inline SVG string built by `Dogs.draw(id, opts)` (`viewBox="0 0 120 100"`, facing right, feet on y = 92). The menu icon is an inline SVG in [`js/activities.js`](../../js/activities.js). No images, fonts or audio.

## 10. Randomization and variants

Per launch the breed order is a random shuffle of all eight breeds (each once per cycle, the same cycle repeats on wrap-around). Touch actions and idle actions are picked at random, never the same twice in a row.

## 11. Progression and difficulty

None. There are no levels or persistence.

## 12. Completion and feedback

There is no completion state and no failure. Feedback is the dog's own reaction; nothing starts by itself except the gentle idle life.

## 13. Analytics and metrics

This activity reports to `window.Analytics` (`js/analytics.js`): every dog touch that starts an action and every navigation (arrow, swipe, key) is `track('interaction', { variant: <breed id> })` (for navigation the breed shown after the move). It is open-ended, so there is no `complete`, level or exit-before-completion. Start, active time, replays, quick exits and touches are also recorded by the app shell. Data stays on the device as anonymous daily aggregates; see [README.md](README.md#analytics-status).

## 14. Technical implementation

- **Entry point:** `mount(container)` in [`js/rasy.js`](../../js/rasy.js) overrides `mount` of the `rasy` entry in `window.ACTIVITIES`; it sets `container.style.display = 'block'` and returns a cleanup function that sets `alive = false`, cancels the frame, removes the `visibilitychange` listener and removes the scene.
- **Rendering:** `div.rp > div.rp-wrap > div.rp-view` (one per visible dog: `button.rp-dog` with the SVG and a "Hau!" `span.rp-bubble`, plus `div.rp-name`) and two `button.rp-arrow`. `makeView` regroups the SVG parts: `all > [fl (front legs, with the near paw group), rot (everything else; head and ears inside `headg`, near rear leg group)]`, so each can be posed separately without changing `js/dogs.js`.
- **State:** per view `act` (kind, t, dur, touch), blink and idle timers and eased pose values `C` (sit, paw, rear leg, head tilt, head flip); `cur` is the only view updated.
- **Loop:** one `requestAnimationFrame` loop with `dt` capped at 0.05 s, running while the tab is visible and restarted on `visibilitychange`.
- **Drawing:** `Dogs.draw(id, { scale: 1 })`; part classes `dg-tail`, `dg-legs`, `dg-head`, `dg-ears`, `dg-calm`/`dg-happy`; the eye is the `circle[r="2"]` in the head.
- **Persistence:** none. **Analytics:** through the app shell only (section 13).

## 15. Responsive layout and coordinate system

- `.rp` is fixed full-screen; `.rp-wrap` is inset below the Back button (64 px plus safe area) and above the arrows in portrait, and between the 88 px side insets in landscape. Each `.rp-view` is stacked in it and centres the dog (aspect ratio 6:5, height 100%) over its name.
- The SVG fills the button and keeps its `viewBox="0 0 120 100"`; the orientation switch is CSS only.

## 16. Error and edge-case handling

| Case | Behaviour |
|---|---|
| Tap during a touch action | Ignored until it ends (no restart, no extra metric). |
| Tap during an idle action | The touch action replaces it smoothly. |
| Swipe | Navigates; the click after it is ignored. |
| Navigation during an action | The old dog is reset and fades out; the new one starts calm. |
| Quick repeated navigation | Each outgoing dog is removed 0.5 s after it leaves; timers are cleared in cleanup. |
| Tab hidden | Loop cancelled and restarted on return; the `dt` cap prevents a jump. |
| Resize / orientation | CSS only; dog and state kept. |
| `window.Dogs` / `window.Rand` missing | Not handled (both load before `app.js`). |

## 17. Testing

No automated tests exist. Manual scenarios (none are claimed as done):

- [ ] One dog is visible, large (about half of the shorter side or more), with its Polish name under it; each launch starts with a random breed and the eight breeds come in a random order, each once before any repeat.
- [ ] Arrows (Poprzedni / Następny), swipe left/right and the Left/Right keys move between dogs with a 0.5 s fade; the first/last wrap around.
- [ ] A swipe that starts on the dog never triggers an action.
- [ ] Tap the dog many times: six different actions occur, never the same twice in a row; taps during an action are ignored; every action lasts about 2.5 s and is gentle.
- [ ] Wait 30 s untouched: the dog blinks every 3-5 s, wags, and every 8-12 s does an idle action (look, sniff, scratch, sit).
- [ ] Navigate while an action is playing: the old dog fades in a neutral pose, the new one is calm.
- [ ] Sit / paw: the front legs reach the ground and nothing detaches in any breed (check the Jamnik and the Husky).
- [ ] Portrait and landscape down to 568 x 320 and 320 px wide; rotate during an action.
- [ ] Reduced motion: touch gives smile and glow only, blink continues, navigation works.
- [ ] Keyboard: Tab to the dog and arrows, Enter/Space activates; focus ring visible.
- [ ] Browsers: Chrome desktop, Chrome Android, Safari iPhone/iPad.
- [ ] Metrics (Settings > Statystyki): touches and navigation count as interactions per breed.

The implementation (issue [#204](https://github.com/BielinskiLukasz/child-page/issues/204)) was checked with a stub-DOM run in Node (shuffle/wrap order, one touch per action, ignored touches, no NaN transforms, cleanup); the visual checks are pending.

## 18. Known limitations and open issues

**Confirmed**

- No automated tests.

**Requires verification**

- Visual quality of the idle and touch actions on a device (sit and paw pose in every breed, the "Hau!" bubble position) and the on-screen size of the dog at 320 x 568 and 568 x 320.

## 19. Planned improvements

Not currently documented; issue [#175](https://github.com/BielinskiLukasz/child-page/issues/175) describes `window.Dogs` as the shared foundation for future dog activities.

## 20. Related activities and reusable components

- Other activities with a shared character family: [Zwierzątka na Farmie](zwierzatka-na-farmie.md), [Kąpiel Zwierzątek](kapiel-zwierzatek.md), [Buźki](buzki.md).
- Shared component: [`js/dogs.js`](../../js/dogs.js) (`Dogs.LIST`, `Dogs.SCALE`, `Dogs.byId`, `Dogs.draw`).

## 21. Change history

- Issue [#175](https://github.com/BielinskiLukasz/child-page/issues/175) / PR [#180](https://github.com/BielinskiLukasz/child-page/pull/180): initial activity and shared dog drawings.
- Issue [#204](https://github.com/BielinskiLukasz/child-page/issues/204): one dog at a time with navigation, idle life and six touch actions; metrics added.
