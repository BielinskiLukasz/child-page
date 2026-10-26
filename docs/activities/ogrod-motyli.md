# Ogród Motyli

## 1. Overview

| Property | Value |
|---|---|
| Display name | Ogród Motyli |
| Activity ID | `motyle` (`js/activities.js`) |
| Description | A garden of five swaying flowers. Touching a flower makes the butterfly fly slowly to it along a smooth curve; if left alone it flies to another flower by itself. |
| Category | Open-ended play, observation, cause and effect |
| Interaction type | Tap a flower (five large buttons) |
| Status | Implemented. Enabled by default in the menu (no `defaultOff` flag). |
| Source | [`js/motyle.js`](../../js/motyle.js), CSS classes `.m-*` in [`css/style.css`](../../css/style.css) |

## 2. Business purpose

A very simple, forgiving activity for the youngest child: five big targets, every tap does something visible and gentle, and nothing can be wrong. The butterfly's flight is deliberately slow and smooth, even when the child taps another flower in mid-flight, so the scene stays calm. Since issue #112 the flower colours and the butterfly's colouring vary per launch.

## 3. Activity flow

1. The child opens the tile (hash `#motyle`); the scene is built with five flowers and a butterfly resting on the first flower (top left).
2. A pale cream-to-green background shows the five flowers with different petal counts.
3. The child can tap any flower.
4. The tapped flower sways for 2.2 s and the butterfly flies to it along a curved path; the curve bends one way and the other on alternating flights.
5. There is no completion state.
6. After arriving the butterfly rests; if no flower is tapped for 10-15 s it flies to a different flower by itself.
7. A new colour combination appears on the next launch.
8. The child leaves with the Back button (see [shared behaviour](README.md#shared-platform-behaviour)).

## 4. Rules and behavior

| Rule | Value |
|---|---|
| Flowers | 5 at fixed positions (fractions of the play square): (0.22, 0.24) 6 petals, (0.74, 0.22) 8, (0.48, 0.50) 5, (0.22, 0.70) 7, (0.76, 0.68) 6 |
| Tap on the flower the butterfly is on or heading to | The flower sways but no flight starts; the idle timer restarts |
| Tap on another flower | Butterfly redirects immediately, keeping its position and velocity; the pull direction is rotated by `TURN` = 0.55 rad, with the sign alternating on each flight (`dir = -dir`) |
| Flight model | Damped spring toward the target: `OMEGA` = 2.2 (critically damped, so no overshoot in the straight case); integration step capped at 0.05 s |
| Arrival | Distance below 0.006 and speed below 0.03 (in play-square fractions); position snapped to the flower |
| Idle flight | After 10-15 s at rest (`IDLE_MIN` 10, `IDLE_MAX` 15) it flies to a random other flower; hidden time is not counted |
| Sway | 2200 ms (`SWAY_MS`), rotation `7 deg` (`SWAY_AMP`) damped sine with two oscillations, around a point 150 % below the flower |
| Wings | Wing scale `0.6 + 0.4 * cos(phase)`; phase speed 4.5 pi rad/s in flight (2.25 flaps/s), 1.8 pi rad/s at rest (0.9 flaps/s) |
| Tilt | Butterfly rotated by velocity, clamped to +/-15 deg |
| Failure / scoring | None |

All motion is JavaScript-driven in one `requestAnimationFrame` loop, so it is **not** affected by the global reduced-motion CSS rule (see [shared behaviour](README.md#shared-platform-behaviour)); there is no slower variant for users who prefer reduced motion.

## 5. Educational and developmental benefits

**Intended design benefits**

- Cause and effect (touch a flower, the butterfly comes).
- Calm visual tracking of a smoothly moving object.
- Recognising that flowers differ in shape (petal count 5, 6, 7, 8) as well as colour.

**Directly observable behavior**

- The butterfly always moves smoothly, even when redirected.
- Flowers have different petal counts, so they stay distinguishable even if colours look alike.

**Requires professional or research-based validation**

- Any effect on attention, tracking or development. None is measured or claimed.

## 6. Accessibility and usability

- **Input:** pointer (`pointerdown`) and **keyboard**: the flowers are real `<button>` elements (`aria-label` "Kwiatek 1" to "Kwiatek 5"); Enter/Space fires `click` with `detail === 0`, which is handled. A focus outline is defined.
- **Screen readers:** flower buttons are labelled by number only; the butterfly is `aria-hidden`.
- **Targets:** each flower is 22 % of the play square wide and at least 72 px. The butterfly is not a target (`pointer-events: none`).
- **Layout:** the play square is `min(94vw, 100dvh - 110px)` with a 60 px top margin, centred; portrait and landscape both work, with smaller flowers (but not under 72 px) on short screens.
- **Colour:** colours are decorative; petal count provides a non-colour cue. Pastel petals on a pale background have modest contrast; PR [#138](https://github.com/BielinskiLukasz/child-page/pull/138) asked a reviewer to check it.
- **Sound:** none. **Reading:** not required. Independent use by a young child is possible.
- **Motion:** slow; no flashing. Not reduced under the OS setting (see section 4).

## 7. Risks and limitations

- Some colour sets put similar pastel colours on neighbouring flowers; the petal counts help but are subtle (5-8).
- No ending; the butterfly continues to fly by itself every 10-15 s, which can run for as long as the playtime limit allows.
- Reduced-motion users still see the full flight and wing animation.
- On short landscape screens the play square shrinks, so flowers may sit close together (requires verification in a browser).
- No personal data is involved.

## 8. Configuration

No external configuration. Constants in [`js/motyle.js`](../../js/motyle.js).

| Name | Purpose | Value |
|---|---|---|
| `OMEGA` | Spring stiffness of the flight | 2.2 |
| `TURN` | Rotation of the pull vector (curve) | 0.55 rad |
| `SWAY_MS`, `SWAY_AMP` | Flower sway length and amplitude | 2200 ms, 7 deg |
| `IDLE_MIN`, `IDLE_MAX` | Rest before an automatic flight | 10 s, 15 s |
| `FLOWERS` | Position and petal count per flower | 5 entries |
| `FLOWER_SETS` | Petal and core colour pairs per flower | 6 sets |
| `BUTTERFLY_SETS` | Upper and lower wing colours | 6 sets |

There is no validation; the five-entry layout is assumed by all colour sets.

## 9. Assets

No external assets. Flowers and the butterfly are inline SVG built at runtime (`flowerSvg`, `butterflySvg`); the background is a CSS gradient. The menu icon is inline SVG in [`js/activities.js`](../../js/activities.js). No fonts, audio or images.

## 10. Randomization and variants

| What | When | Pool | Rule |
|---|---|---|---|
| Flower colour set | Each mount | 6 sets of 5 petal/core pairs | `Rand.pickOne(FLOWER_SETS, 'motyle-flowers')`: never the same set as the previous launch in the same page session |
| Butterfly colouring | Each mount | 6 wing colour pairs | `Rand.pickOne(BUTTERFLY_SETS, 'motyle-butterfly')`, chosen independently of the flowers, no immediate repeat |
| Automatic flight target | Every 10-15 s of rest | The other 4 flowers | Uniform; the idle delay is also random |
| Flight curve side | Each flight | 2 | Alternates, not random |

The first flower the butterfly sits on is always flower 1. Choices are in memory only, so after a page reload the same set can come again. The helper is called as the global `Rand` (no `window.` and no fallback), so [`js/random.js`](../../js/random.js) must be loaded first, which `index.html` ensures.

## 11. Progression and difficulty

None. Nothing is persisted.

## 12. Completion and feedback

No formal completion state. Feedback is the sway of the touched flower and the butterfly flight. No sound, no celebration.

## 13. Analytics and metrics

This activity reports to the shared on-device module `js/analytics.js` (`window.Analytics`) through the app shell only: `js/app.js` records the activity start and end, and the module counts touches inside the stage. The activity file itself calls no `Analytics` function. Recorded for it: starts, active time, replays (re-opening in the same session), quick exits (within 10 s) and touches. It is open-ended, so no completion, level or exit-before-completion is defined for it. Data stays on the device as anonymous daily aggregates; see [README.md](README.md#analytics-status).

## 14. Technical implementation

- **Entry point:** `mount(container)` in [`js/motyle.js`](../../js/motyle.js).
- **Rendering:** DOM and SVG. `div.m-scene` contains `div.m-box` (the play square) with five `button.m-flower` (each wrapping an SVG) and one `div.m-butterfly`.
- **State:** butterfly position `px, py` and velocity `vx, vy` in play-square fractions, `rest` (target flower index), `flying`, `dir`, `idle`, per-flower `swayT`.
- **Loop:** one `requestAnimationFrame` loop (`frame`) updates the flight, wing scale (SVG `transform` attribute folding toward the body axis), tilt, sway and idle timer; it stops while the tab is hidden and restarts on return (`last` reset, so the butterfly does not jump).
- **Events:** `pointerdown` and `click` (keyboard only, `detail === 0`) per flower; `visibilitychange`.
- **Cleanup:** cancels the frame, removes listeners and the scene.
- **Dependencies:** [`js/random.js`](../../js/random.js).

## 15. Responsive layout and coordinate system

Flowers and the butterfly share one coordinate space: fractions (0-1) of the square `.m-box`, which is `min(94vw, 100dvh - 110px)` wide, square (`aspect-ratio: 1`), centred with a 60 px top margin. Flowers are placed with percent `left`/`top` (centred with `translate(-50%, -50%)`), and the butterfly with percent `left`/`top` of the same box, so both stay aligned in any size or orientation. A flower is 22 % of the square (minimum 72 px); the butterfly is 13 % (minimum 48 px) and the sway is applied to the SVG inside the button, so the hit area does not move.

## 16. Error and edge-case handling

| Case | Behaviour |
|---|---|
| Missing assets | Not applicable |
| Missing `Rand` | `ReferenceError` at mount; no fallback (unlike [Magiczny Ogród](magiczny-ogrod.md)) |
| Resize / rotation | Everything is fractional, so layout follows |
| Backgrounding | Loop stops; idle time is not counted; on return no jump |
| Rapid or repeated taps | Redirects smoothly with kept velocity; repeated taps on the same flower only sway it |
| Touch cancellation | `pointerdown` only, nothing left pending |
| Leaving during flight | Frame cancelled |

## 17. Testing

No automated tests exist (see [shared behaviour](README.md#shared-platform-behaviour)). PR [#138](https://github.com/BielinskiLukasz/child-page/pull/138) reports `node --check js/motyle.js` only, with no browser in the sandbox, and asks to review contrast of the colour sets.

Manual scenarios (all unchecked):

- [ ] Normal: tap each of the five flowers; the butterfly flies to each one smoothly and the flower sways.
- [ ] Redirect: tap a second flower mid-flight; no sudden jump, direction changes smoothly.
- [ ] Tap the flower the butterfly is on: it sways, nothing else happens.
- [ ] Idle: wait 10-15 s; the butterfly flies to another flower by itself.
- [ ] Completion: none; confirm no end state.
- [ ] Randomization: reopen about 7 times; the flower colour set and butterfly colouring change and no set repeats twice in a row.
- [ ] Contrast: each of the 6 flower sets and 6 butterflies is visible on the background.
- [ ] Progression: none expected.
- [ ] Portrait and landscape (including 640x360): five flowers visible, at least 72 px, no overlap with the butterfly's resting place.
- [ ] Touch, mouse, keyboard (Tab, Enter, Space).
- [ ] Background/foreground: switch away for 30 s; the butterfly resumes without a jump or an immediate idle flight.
- [ ] Reduced motion: confirm the butterfly still flies (it is JavaScript-driven).
- [ ] Browsers: Chrome desktop, Chrome Android, Safari iPhone/iPad.

## 18. Known limitations and open issues

**Confirmed**

- Motion is not reduced for `prefers-reduced-motion`.
- Colour sets may combine similar pastels on neighbouring flowers; only the petal count (5-8) is a non-colour cue.
- Flowers have only a number as accessible name.
- `Rand` is used without a fallback.

**Requires verification**

- Contrast of all colour sets on the background (PR #138).
- Flower spacing on short landscape screens.

No open GitHub issue is specific to this activity.

## 19. Planned improvements

None currently planned.

## 20. Related activities and reusable components

- Similar calm scenes: [Magiczny Ogród](magiczny-ogrod.md), [Akwarium Artura](akwarium-artura.md), [Latawiec](latawiec.md) (smooth spring flight).
- Shared helper: [`js/random.js`](../../js/random.js) (`Rand.pickOne`). It does not use `js/animals.js`.

## 21. Change history

- Issue [#7](https://github.com/BielinskiLukasz/child-page/issues/7) / PR [#14](https://github.com/BielinskiLukasz/child-page/pull/14): initial activity; later fixes made flowers keyboard-activatable and folded the butterfly's wings toward the body axis.
- Issue [#21](https://github.com/BielinskiLukasz/child-page/issues/21): app review polish.
- Issue [#112](https://github.com/BielinskiLukasz/child-page/issues/112) / PR [#138](https://github.com/BielinskiLukasz/child-page/pull/138): random flower and butterfly colour sets.
