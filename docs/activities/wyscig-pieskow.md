# Wyścig Piesków

Platform-wide behaviour (no sound, reduced motion, menu configuration, playtime limit, absence of automated tests, privacy) is described in [README.md](README.md#shared-platform-behaviour) and is not repeated here.

## 1. Overview

| Item | Value |
|---|---|
| Display name | Wyścig Piesków |
| Activity ID | `wyscig` (registry entry in [`js/activities.js`](../../js/activities.js)) |
| Description | A friendly race of four dogs of different random breeds: the child cheers them on with taps, they all finish together, wag their tails under confetti, and a new race starts. |
| Category | Cause and effect; open-ended play; calming |
| Interaction type | Tap (touch, mouse), keyboard alternative |
| Status | Implemented; enabled in the menu by default (appended last, no `defaultOff`) |
| Source | [`js/wyscig.js`](../../js/wyscig.js), shared drawings in [`js/dogs.js`](../../js/dogs.js), styles with prefix `wp-` in [`css/style.css`](../../css/style.css) |

## 2. Business purpose

- A dog activity with a different mechanic from washing ([Myjnia](myjnia.md), [Psia Myjnia](psia-myjnia.md)): cheering a runner along a track (issue [#177](https://github.com/BielinskiLukasz/child-page/issues/177)).
- Uses the shared dog drawings of [Rasy Piesków](rasy-pieskow.md) (`window.Dogs`, issue [#175](https://github.com/BielinskiLukasz/child-page/issues/175)).
- Gives a parent the Polish breed names, shown small under each dog.

## 3. Activity flow

1. The child opens the tile; four different random breeds are placed in four lanes in random order and start running at their own base speeds.
2. Initially displayed: a green track with four lanes, a chequered finish strip at the right end of each, and the dogs at the left.
3. Interactions: tap a dog (or focus it with Tab and press Enter/Space).
4. Response: the dog gets a smooth speed boost of about 1 s with a dust puff behind it.
5. Each dog that reaches the finish smiles and wags its tail; its name stays visible.
6. When all four are in, confetti falls for about 4 s.
7. The field fades out (0.7 s) and a new race with a new set of breeds fades in. Restart is automatic; there is no menu or button.
8. Exit: Back button or browser Back.

## 4. Rules and behavior

| Rule | Detail |
|---|---|
| Lanes and breeds | 4 lanes, each at least 60 px tall; 4 different breeds from `Dogs.LIST`, random order; a new race never has the same set of breeds as the previous one. |
| Base speed | Per dog `1 / T` track fractions per second with `T` random in 25-35 s; dogs keep running untouched. |
| Boost | A tap raises the boost target by +0.4, capped at +0.6, for 1 s after the last tap; the boost factor follows its target at 1.2 per second (no jump). |
| Slew limit | The speed changes by at most 0.02 track fractions per second squared. |
| Never decided | From the moment the leader passes 50% of the track each dog's speed is blended towards the speed that would finish at the group's mean remaining time (full blend at 90%). Once a dog has finished, the others are guaranteed a speed that finishes them within 2.5 s. In a Node simulation of 15 races the gap between the first and last dog was about 0.03-0.13 s. |
| Running legs | While a dog runs its four legs swing about the hips as a trot (diagonal pairs alternate). Step rate = speed x 70 per second (about 2-3 steps/s at base speed, never above 5), so a boost speeds the legs up and back down smoothly. The body bobs up by at most 3% of the dog height. Swing angle is 18-40 degrees depending on leg length, so short-legged breeds (Jamnik, Corgi, Buldog) keep their legs attached and visible. |
| Reduced motion (legs) | Step rate is halved and the bob is switched off; the legs still alternate. |
| Finish | The dog stays at the finish, smiles (`dg-happy`), wags its tail at 2.2 Hz (+/-26 degrees). The running legs ease out to standing within 0.35 s of finishing (the wag and smile begin at once). Tapping a finished dog only makes it wag more for 0.8 s. |
| Reward | Confetti: pool of 36 pieces, about 2.2 s fall each, staggered over 4 s. |
| Faces | Only `dg-calm` and `dg-happy`; no angry or sad face exists. |
| Failure, score | None; nothing is scored or stored. |
| Sound | None. |

## 5. Educational and developmental benefits

**Intended design benefits**

- Cause and effect (a tap speeds the dog up) and gentle tapping.
- Noticing different dog breeds and sizes.

**Directly observable behavior**

- Tapped dogs visibly speed up for about a second; all dogs finish together.

**Requires professional or research-based validation**

- Any claim about breed recognition, counting or turn-taking; nothing in the code can establish it.

## 6. Accessibility and usability

- **Input:** pointer events (touch, mouse, stylus; each dog is a native `<button>`); keyboard: Tab moves between the four dogs (visible 4 px focus ring), Enter/Space cheers the focused dog.
- **Labels (Polish):** each dog button has an `aria-label` with the breed ("Piesek: Labrador. Dotknij lub naciśnij Enter, aby zachęcić do biegu."); the SVG is decorative.
- **Target sizes:** a dog button is at least 56 px high (dog plus name line) and normally much larger.
- **Layout:** four lanes below the Back button, portrait and landscape from 320 x 568 to 1920 x 1080.
- **Colour:** the finish is shown by the position at the strip, the happy mouth and the tail wag, not by colour alone.
- **Reduced motion:** all movement is driven from JavaScript, so positions, smiles, wagging and confetti behave the same; the running legs alternate at half rate without the body bob; no state exists only in a CSS keyframe.
- **Text:** none except the small parent-facing breed names.

## 7. Risks and limitations

- Visual quality (dog size in lanes, dust puff, confetti) has not been checked on a device (sections 17 and 18).
- A race lasts about 25-35 s; a child who does not tap simply watches.
- No ending; relies on the global playtime limit.

## 8. Configuration

No external configuration. Constants in [`js/wyscig.js`](../../js/wyscig.js): `LANES` (4), `T_MIN`/`T_MAX` (25/35), `BOOST_ADD` (0.4), `BOOST_MAX` (0.6), `BOOST_S` (1), `BOOST_SLEW` (1.2), `ACC` (0.02), `BLEND_FROM`/`BLEND_TO` (0.5/0.9), `END_GAP_S` (2.5), `CONFETTI` (36), `CONFETTI_S` (4), `FALL_S` (2.2), `PUFFS` (12 per lane), `PUFF_S`, `SWAP_S` (0.7), `WAG_HZ` (2.2), `STEPS_PER_SPEED` (70), `STEPS_MAX` (5), `RUN_IN_S`/`RUN_OUT_S` (0.3/0.35), `BOB` (0.03). Changing them needs a code edit.

## 9. Assets

No external asset files. Dogs are inline SVG built by `Dogs.draw(id)`; the menu icon is an inline SVG in `js/activities.js`.

## 10. Randomization and variants

- Breeds: 4 of 8, uniformly, random lane order; the set differs from the previous race (module variable `lastSet`, so also across launches).
- Base time per dog: uniform 25-35 s.
- Confetti positions, drift and rotation are random.

## 11. Progression and difficulty

None; there are no levels and nothing persists.

## 12. Completion and feedback

A race is complete when all four dogs have finished. Feedback: happy mouth, tail wag, confetti. No failure state. The next race starts automatically.

## 13. Analytics and metrics

This activity reports to the shared on-device module `js/analytics.js` (`window.Analytics`). `js/app.js` records the activity start and end and the module counts touches in the stage; `js/wyscig.js` additionally calls `Analytics.track('interaction', { variant: breedId })` on each cheer (tap or keyboard Enter/Space) and `Analytics.complete()` when all four dogs have finished. All calls are wrapped so that nothing changes if `window.Analytics` is missing. Recorded: starts, active time, replays, quick exits, touches, breed variants and the number of finished races. The activity is not in the module's `COMPLETABLE` list (it repeats endlessly), so exit-before-completion is not defined for it. Data stays on the device as anonymous daily aggregates; see [README.md](README.md#analytics-status).

## 14. Technical implementation

- **Entry point:** `mount(container)` in [`js/wyscig.js`](../../js/wyscig.js) overrides `mount` of the `wyscig` entry; returns a cleanup function.
- **Rendering:** `div.wp > div.wp-field > 4 x div.wp-lane (finish strip, puff layer, button.wp-dog > art + name) + confetti layer`.
- **State:** phase (`run`, `party`, `out`, `in`), per-dog progress fraction `p`, speed `v`, base speed, boost factor/target/timer, finished flag; puff and confetti pools.
- **Loop:** one `requestAnimationFrame` loop with `dt` capped at 0.05 s, guarded by `!raf`, cancelled while the tab is hidden and restarted on `visibilitychange`; cleanup cancels it and removes listeners and DOM.
- **Legs:** `setupLegs` wraps each leg (rect + foot) of the shared `dg-legs` group in its own `<g>` once per race; `poseLegs` runs in the same frame loop and sets one `rotate` per leg and one `translateY` on the art element (no per-frame DOM creation, no CSS animation). A run factor eases the swing in/out; the gait phase keeps accumulating across tab-hidden gaps (capped `dt`), so there is no jump.
- **Persistence:** none. **Analytics:** section 13.

## 15. Responsive layout and coordinate system

- `.wp` is fixed full-screen; `.wp-field` is inset below the Back button (64 px plus safe area) with 12 px margins.
- Lane height is `max(60, field height / 4)`; the dog (plus an 18 px name line) fits inside it and is at most 130 px high and at most 34% of the track width, 6:5 aspect.
- Progress is a fraction (0-1) of `trackW - dogWidth`; the pixel position is recomputed on `resize` and `orientationchange`, so rotation never makes a dog jump.

## 16. Error and edge-case handling

| Case | Behaviour |
|---|---|
| Leaving mid-race | Cleanup cancels the frame, removes listeners and the DOM. Ten quick open/close cycles leave no loop running. |
| Tap on a finished dog | Only a bigger wag for 0.8 s. |
| Many taps | The boost target is capped at +60%. |
| Tap during fade between races | Ignored. |
| Tab hidden | Loop cancelled and restarted on return; the `dt` cap prevents a jump. |
| Resize / orientation | Lanes re-laid out; progress fractions unchanged. |
| `window.Analytics` missing | Calls are skipped. |
| `window.Dogs` missing | Not handled. |

## 17. Testing

No automated tests exist. Manual scenarios (none are claimed as done):

- [ ] A race lasts 25-35 s with no taps and all four dogs finish within 3 s of each other.
- [ ] Tapping a dog speeds it up smoothly for about a second; repeated taps do not make it jump or stop.
- [ ] Legs alternate while running, faster during a boost, stand within 0.4 s at the finish; Jamnik/Corgi/Buldog legs stay attached; landscape 568 x 320 legs stay inside the lane.
- [ ] Confetti for about 4 s, then a new race with a different set of breeds.
- [ ] Rotate the device mid-race; the dogs keep their relative positions.
- [ ] Keyboard: Tab to a dog, Enter/Space cheers it.
- [ ] Leave mid-race and reopen ten times quickly.
- [ ] Small screens (320 x 568) and 1920 x 1080, portrait and landscape.
- [ ] Reduced motion: movement, smiles, wagging and confetti still work.
- [ ] Browsers: Chrome desktop, Chrome Android, Safari iPhone/iPad.

The PR for issue [#177](https://github.com/BielinskiLukasz/child-page/issues/177) reports a Node simulation with a stub DOM; no visual check was possible.

## 18. Known limitations and open issues

**Confirmed**

- No automated tests.
- On screens where four 60 px lanes do not fit (field shorter than 240 px) the lower lanes are clipped.

**Requires verification**

- Look and feel of the dust puff, confetti and dog size on real devices.

## 19. Planned improvements

None currently planned.

## 20. Related activities and reusable components

- [Psia Myjnia](psia-myjnia.md), [Myjnia](myjnia.md), [Rasy Piesków](rasy-pieskow.md).
- Shared component: [`js/dogs.js`](../../js/dogs.js) (`Dogs.LIST`, `Dogs.draw`).

## 21. Change history

- Issue [#177](https://github.com/BielinskiLukasz/child-page/issues/177): initial activity.
- Issue [#205](https://github.com/BielinskiLukasz/child-page/issues/205): running legs animation and body bob.
