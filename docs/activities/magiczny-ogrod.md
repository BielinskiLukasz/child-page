# Magiczny Ogród

## 1. Overview

| Property | Value |
|---|---|
| Display name | Magiczny Ogród |
| Activity ID | `ogrod` (`js/activities.js`) |
| Description | A meadow with a random weather and time of day. Touching the lawn grows a flower or a mushroom from a seed; touching the drifting cloud gently clears the garden. |
| Category | Open-ended play, cause and effect |
| Interaction type | Tap on the lawn and on the cloud (keyboard Enter/Space also supported) |
| Status | Implemented. Enabled by default in the menu (no `defaultOff` flag). |
| Source | [`js/ogrod.js`](../../js/ogrod.js), CSS classes `.garden`, `.g-*` in [`css/style.css`](../../css/style.css) |

## 2. Business purpose

A small "plant and watch it grow" scene where each touch produces a pleasant, slowly unfolding result and the whole garden can be wiped with one touch, so the child can start again at any time without anything being "lost". It complements the quieter observation scenes ([Dzień i Noc](dzien-i-noc.md), [Akwarium Artura](akwarium-artura.md)) by letting the child place objects where they want. Since issue #109 the weather and time of day vary per launch, so the same garden does not look identical every visit.

## 3. Activity flow

1. The child opens the tile (hash `#ogrod`); `mount` builds the garden as DOM nodes.
2. A random combination of weather (sunny, cloudy, rain, breeze) and time (day, night) is shown: sky, lawn (bottom 45 % of the screen) and a small cloud drifting across the sky.
3. The child can tap the lawn or the cloud.
4. A tap on the lawn plants a seed at that point; the seed fades, a stem grows, leaves pop out and the bloom opens (about 4 s). A tap on the cloud makes all plants fade out.
5. There is no completion state; the garden is open-ended.
6. After a clear, the lawn can be planted again immediately after about 0.9 s.
7. A new weather is chosen only on the next launch.
8. The child leaves with the Back button (see [shared behaviour](README.md#shared-platform-behaviour)).

## 4. Rules and behavior

| Rule | Value |
|---|---|
| Plant kinds | 7 (`KINDS`): four flowers (four-petal, tulip, daisy, round pom-pom) and three mushrooms (spotted, flat wide cap, tall pointed cap); kind chosen uniformly at random per tap |
| Plant colours | Flowers: 6 pastels (`PASTELS`); mushrooms: 5 cap colours (`CAPS`); colour chosen at random |
| Plant size | Scale `--s` random 0.8-1.2; box `60 x 100` units times `1.4 * s`, i.e. about 67-101 px wide and 112-168 px tall (height is capped at 30 vh) |
| Anchor | Plant is bottom-centred on the tap point; position stored in percent of the garden |
| Max live plants | 20 (`MAX_PLANTS`); planting a 21st fades the oldest |
| Max fading nodes | 6 (`MAX_FADING`); beyond that, nodes are removed immediately instead of fading |
| Fade | `FADE_MS` = 900 ms, then the node is removed by a `setTimeout` (never by `transitionend`) |
| Growth timeline | Seed shown 0-3.6 s; stem grows 0.5-2.5 s; leaves pop 1.8-3.0 s; bloom pops 2.6-4.2 s (CSS keyframes) |
| Cloud | Drifts left to right in 80 s, linear, infinite (CSS); width `clamp(120px, 26vw, 240px)` plus 12 px padding as extra tap area; at 12 % height |
| Cloud tap | All live plants fade; planting is locked for 900 ms (`locked`) |
| Taps on the sky | Ignored (the plant layer and sky do not take input) |
| Keyboard | Lawn and cloud are `role="button"` with `tabindex="0"`; Enter/Space plants at a random spot (x 10-90 %, y 60-96 %) or clears the garden |
| Weather layers | See table below |

| Weather | Layers |
|---|---|
| sunny | Sun orb (a pale moon-like orb at night) |
| breeze | Orb plus 4 white wind streaks crossing in 7 s |
| cloudy | Two cloud banks |
| rain | Two cloud banks plus 26 rain drops falling in 1.1 s (linear, infinite) |
| night (any weather) | 14 twinkling stars (4 s cycle), dark blue sky and lawn, white glow around plants |

Decorative layers have `pointer-events: none`.

Reduced motion: the global rule disables CSS animations and transitions. For this activity that means plants appear fully grown at once (the final state is defined in the base CSS and the seed is hidden by a dedicated rule), clearing removes plants instantly (the removal timer still runs), the cloud stays still at the left edge but is still tappable, rain drops (which start above the screen) are not visible, wind streaks stay still at the left edge and stars do not twinkle. This is derived from reading the CSS and should be confirmed in a browser (see section 17).

## 5. Educational and developmental benefits

**Intended design benefits**

- Cause and effect (touch, plant appears and grows).
- Calm observation of slow growth and weather.
- Freedom to place objects where the child chooses; recognising flowers vs mushrooms.

**Directly observable behavior**

- Each tap yields one of 7 plant shapes in a random colour, at the tap position.
- A single cloud tap clears everything and the child can start again.

**Requires professional or research-based validation**

- Any effect on attention, creativity or development. None is measured or claimed.

## 6. Accessibility and usability

- **Input:** pointer (touch, mouse, stylus) and **keyboard** (Tab to lawn or cloud, Enter or Space). A visible focus outline is defined for the lawn and cloud.
- **Screen readers:** garden `role="group"` with `aria-label="Ogród z kwiatami"`; lawn labelled "Trawnik – posadź roślinę", cloud "Chmurka". Plants and weather are not announced.
- **Orientation:** the garden fills the viewport; plants are positioned in percent so they stay on the lawn after rotation. In short landscape the 30 vh height cap shrinks plants.
- **Targets:** the whole lawn (bottom 45 %) is one target. The cloud is at least about 144 px wide (120 px plus padding) and moves slowly (80 s per crossing).
- **Colour:** meaning does not depend on colour. Contrast is not a requirement for the decorative scene.
- **Sound:** none. **Reading:** not required. Independent use by a young child is possible.
- **Motion intensity:** slow; rain and wind are continuous but gentle (see section 7).
- **Limitations:** a child who taps on the sky gets no response; the cloud is the only way to clear.

## 7. Risks and limitations

- Continuous rain and wind animation run for as long as the activity is open.
- Cloud tap clears all plants, which may surprise a child who wanted to keep them (the cloud is drawn as a decoration, not a button).
- Up to 20 plants of up to 168 px height can crowd the lawn; they overlap freely.
- Rain drops share a fixed delay pattern (drops start with a regular `0.37 s` step) and night stars are placed by a fixed formula (see section 18).
- No personal data is involved.

## 8. Configuration

No external configuration. Constants in [`js/ogrod.js`](../../js/ogrod.js); styling and timings in [`css/style.css`](../../css/style.css).

| Name | Purpose | Value | Location |
|---|---|---|---|
| `MAX_PLANTS` | Live plants | 20 | `js/ogrod.js` |
| `MAX_FADING` | Simultaneously fading plants | 6 | `js/ogrod.js` |
| `FADE_MS` | Fade-out time and lock after a clear | 900 ms | `js/ogrod.js` and `.g-plant` transition in CSS (must be kept in sync by hand) |
| `PASTELS`, `CAPS` | Flower / mushroom colours | 6 / 5 | `js/ogrod.js` |
| `KINDS` | Plant shapes | 7 | `js/ogrod.js` |
| `WEATHERS` x times | Scene combinations | 4 x 2 = 8 | `js/ogrod.js` (`COMBOS`) |
| Growth keyframes (`g-seed`, `g-grow`, `g-pop`), `g-drift` 80 s, `g-fall` 1.1 s, `g-gust` 7 s, `g-twinkle` 4 s | Animation timings | see section 4 | `css/style.css` |

## 9. Assets

No external assets. Plants, cloud and weather elements are inline SVG strings built in `js/ogrod.js` and CSS-drawn shapes (stars, drops, wind streaks, sun/moon orb, cloud banks). The menu icon is inline SVG in [`js/activities.js`](../../js/activities.js). No fonts, audio or images.

## 10. Randomization and variants

| What | When | Pool | Rule |
|---|---|---|---|
| Weather and time of day | Each mount | 8 combinations (`COMBOS`) | `Rand.pickOne(COMBOS, 'ogrod-weather')`: never the same as the previous launch in the same page session; falls back to a plain random pick if `window.Rand` is missing; not stored |
| Plant kind | Each tap | 7 | Uniform (`Math.random`), repetition allowed |
| Plant colour | Each tap | 6 (flowers) or 5 (mushrooms) | Uniform, repetition allowed |
| Plant scale | Each tap | 0.8-1.2 | Uniform |
| Keyboard planting position | Each key press | x 10-90 %, y 60-96 % | Uniform |

The pool is never empty. Choices are in memory only.

## 11. Progression and difficulty

No progression, levels or persistence.

## 12. Completion and feedback

No formal completion state. Feedback: the seed appears, grows into a plant in about 4 s; clearing fades all plants out in 0.9 s. No sound, no celebration, no scoring. Planting is possible again after the 0.9 s lock.

## 13. Analytics and metrics

This activity reports to the shared on-device module `js/analytics.js` (`window.Analytics`) through the app shell only: `js/app.js` records the activity start and end, and the module counts touches inside the stage. The activity file itself calls no `Analytics` function. Recorded for it: starts, active time, replays (re-opening in the same session), quick exits (within 10 s) and touches. It is open-ended, so no completion, level or exit-before-completion is defined for it. Data stays on the device as anonymous daily aggregates; see [README.md](README.md#analytics-status).

## 14. Technical implementation

- **Entry point:** `mount(container)` in [`js/ogrod.js`](../../js/ogrod.js).
- **Rendering:** DOM. A `div.garden` contains `.g-sky`, a weather layer `.g-wx` (from `weatherHtml`), the lawn, a plant layer and the cloud. Each plant is a `div.g-plant` with an inline SVG.
- **Animation:** CSS keyframes and a transition; no JavaScript animation loop. Removal and the planting lock are driven by `setTimeout` (collected in `timers`).
- **State:** closure variables `live` (plants, oldest first), `fading`, `locked`, `timers`.
- **Events:** `pointerdown` and `keydown` on lawn and cloud; `visibilitychange` toggles `.paused` to pause CSS animations while the tab is hidden.
- **Randomization:** `Rand.pickOne` for weather, `Math.random` elsewhere.
- **Cleanup:** removes listeners, clears timers and removes the garden node.
- **Dependencies:** [`js/random.js`](../../js/random.js) (optional).

## 15. Responsive layout and coordinate system

The garden is `position: fixed; inset: 0`. Sky is the top 55 %, lawn the bottom 45 % (`inset: 55% 0 0 0`). Plants are positioned with `left`/`top` in percent of the garden, so after a resize or rotation they keep their relative position on the lawn. The cloud is positioned at 12 % height and moves with a `translateX` from -120 % of its width to `100vw + 20px`. Night stars are placed in percent (x 4-95 %, y 3-42 %); the sun/moon orb is at 9 % from the right and 8 % from the top. Plants are bottom-anchored with `translate(-50%, -100%)`. There is no aspect-ratio correction beyond the 30 vh height cap.

## 16. Error and edge-case handling

| Case | Behaviour |
|---|---|
| Missing assets | Not applicable |
| Missing `Rand` | Falls back to `Math.random` for the weather choice (no "no repeat") |
| Resize / rotation | Percent positions keep plants on the lawn |
| Rapid taps | Capped at 20 live plants; excess oldest plants fade or are removed |
| Tap during a clear | Ignored for 900 ms (`locked`) |
| Backgrounding | CSS animations are paused (`.paused`); planting and fade timers keep running |
| Cleanup during fade | Timers are cleared and the garden node removed |
| Touch on the sky | Ignored |

## 17. Testing

No automated tests exist (see [shared behaviour](README.md#shared-platform-behaviour)). PR [#133](https://github.com/BielinskiLukasz/child-page/pull/133) is the random-weather change; no test report was found in it.

Manual scenarios (all unchecked):

- [ ] Normal: tap the lawn several times; plants grow in about 4 s at the tapped spots.
- [ ] All 7 plant kinds appear after many taps; none is cut off at screen edges when tapping near them.
- [ ] Completion: not applicable; confirm there is no end state.
- [ ] Tap the cloud: all plants fade within 1 s; taps during that second do nothing; planting works afterwards.
- [ ] Incorrect interaction: tap the sky or between plants; nothing breaks.
- [ ] Rapid taps: plant more than 20; the oldest fade away and the page stays responsive.
- [ ] Restart: reopen the activity repeatedly; weather and time vary and are not identical twice in a row (8 combinations: 4 weathers x day/night).
- [ ] Progression: confirm nothing changes over time (none expected).
- [ ] Portrait and landscape: rotate with plants on the lawn; plants stay on the lawn and the weather fills the screen.
- [ ] Touch: finger taps on lawn and cloud. [ ] Mouse: clicks. [ ] Keyboard: Tab, Enter and Space on lawn and cloud.
- [ ] Background/foreground: switch tab during rain and return; animations resume.
- [ ] Reduced motion: enable the OS setting; plants appear fully grown, cloud and rain behave as described in section 4 (verify the cloud remains reachable and the clear still works).
- [ ] Browsers: Chrome desktop, Chrome Android, Safari iPhone/iPad.

## 18. Known limitations and open issues

**Confirmed**

- Night stars are placed by a fixed formula (`left = 4 + (s*37) % 92`, `top = 3 + (s*23) % 40`), so they form visible patterns and look the same on every launch; they do not match the stars in Dzień i Noc.
- Rain drops are evenly spaced with a regular delay step and uniform speed, which can produce visible synchronised waves.
- `FADE_MS` in JavaScript and the 0.9 s opacity transition in CSS are separate constants.
- The cloud is the only way to clear the garden and looks like decoration.

Both star and rain defects are listed in open issue [#167](https://github.com/BielinskiLukasz/child-page/issues/167) (items 1 and 2).

**Requires verification**

- Reduced-motion appearance described in section 4 (static cloud at the left edge, no visible rain).
- Overlap and crowding of plants on small screens.

## 19. Planned improvements

- Random night-star placement with varied sizes and more natural rain (random start times and speeds): [#167](https://github.com/BielinskiLukasz/child-page/issues/167), items 1 and 2 (open).

## 20. Related activities and reusable components

- [Deszczyk i Tęcza](deszczyk-i-tecza.md) (rain look referenced by #167), [Dzień i Noc](dzien-i-noc.md) (stars), [Ogród Motyli](ogrod-motyli.md) (garden theme), [Akwarium Artura](akwarium-artura.md).
- Shared helper: [`js/random.js`](../../js/random.js) (`Rand.pickOne`). It does not use `js/animals.js`.

## 21. Change history

- Issue [#4](https://github.com/BielinskiLukasz/child-page/issues/4) / PR [#11](https://github.com/BielinskiLukasz/child-page/pull/11): initial activity (the core `js/ogrod.js` was added in a follow-up commit after review; percent-positioned plants and keyboard activation were added at a human request).
- Issue [#21](https://github.com/BielinskiLukasz/child-page/issues/21): app review polish.
- Issue [#109](https://github.com/BielinskiLukasz/child-page/issues/109) / PR [#133](https://github.com/BielinskiLukasz/child-page/pull/133): random weather and day/night.
