# Latarka

Platform-wide behaviour (no sound, reduced motion, menu configuration, playtime limit, absence of automated tests, privacy) is described in [README.md](README.md#shared-platform-behaviour) and is not repeated here.

## 1. Overview

| Item | Value |
|---|---|
| Display name | Latarka |
| Activity ID | `latarka` (registry entry in [`js/activities.js`](../../js/activities.js)) |
| Description | A dark pastel room is explored with a torch: a soft beam follows the finger and reveals three hidden animals and three hidden toys. |
| Category | Control skill; cause and effect; discovery; calming |
| Interaction type | Finger/mouse drag or tap anywhere, keyboard alternative |
| Status | Implemented; enabled in the menu by default (appended last, no `defaultOff`) |
| Source | [`js/latarka.js`](../../js/latarka.js), styles with prefix `fl-` in [`css/style.css`](../../css/style.css) |

## 2. Business purpose

- Revealing hidden things by moving a light; issue [#212](https://github.com/BielinskiLukasz/child-page/issues/212).
- Differs from [Chowany](zabawa-w-chowanego.md) (taps on hiding places) and [Malowanie Światłem](malowanie-swiatlem.md) (only draws) by discovery with a moving light.

## 3. Activity flow

1. The child opens the tile; a dark room (about 85% dim) shows only a soft round beam in the middle.
2. Touching or dragging moves the beam with a soft lag. Crossing the screen takes at least 1.6 s.
3. An animal or toy that is more than half inside the beam fades in (0.45 s). An animal waves (a small tilt), a toy bounces once (1.2 s).
4. A revealed item stays visible while lit and fades out 2 s after the light has left it (0.6 s fade).
5. When all six were revealed at least once, the room lights up slowly (3 s), then darkens again (1.5 s) with a new random arrangement. There is no end. Exit: Back button or browser Back.

## 4. Rules and behavior

| Rule | Detail |
|---|---|
| Darkness | Overlay alpha 0.85 outside the beam, transparent inside 45% of the radius, full darkness at the radius. |
| Beam | Radius `max(90 px, 18% of the shorter side)`; damped follow (rate 6/s) with speed capped at width / 1.6 s. |
| Items | 3 random animals (`Animals.pick(3)`) and 3 of 6 toys (ball, block, car, drum, star, boat), at random places below the Back button row, spaced at least 1.25 item sizes apart when room allows. Item size `clamp(17% of the shorter side, 64, 110)` px. |
| Layout | New on every launch and every new room, never identical to the previous layout in this page session. |
| Reveal | 25 sample points of the item disc; more than half inside the beam lights it. |
| Action | One wave / bounce each time an item is lit from dark. |
| Failure, score | None; nothing is scored or stored. No text; the room is decorative. |

## 5. Educational and developmental benefits

**Intended design benefits**

- Smooth control of a following object; cause and effect (light reveals); object permanence in a playful setting.

**Directly observable behavior**

- The beam follows the finger smoothly; items appear when lit and fade later.

**Requires professional or research-based validation**

- Any claim about learning or developmental benefits; nothing in the code can establish it.

## 6. Accessibility and usability

- **Input:** pointer events on the whole room (touch, mouse, stylus); a second finger is ignored. A mouse moves the beam on hover.
- **Keyboard:** Tab focuses the room (visible focus ring); arrows move the beam by 8% of the width; Enter or Space reveals what is under the beam.
- **Labels (Polish):** "Latarka. Strzałki przesuwają światło, Enter lub spacja pokazuje to, co jest w świetle."; items are decorative.
- **Non-colour cues:** meaning is carried by the pictures (animal faces, toy shapes); colour is not needed.
- **Reduced motion:** all motion (beam, fades, wave, bounce, glow) comes from one JavaScript loop, so every state is reached; nothing is faster than 2 tilts per second, no flashing.
- **Text:** none. Items are 64 px or larger.

## 7. Risks and limitations

- Look and feel (beam softness, darkness level, toy drawings) has not been checked on a device.
- The loop runs until the child leaves or the tab is hidden.

## 8. Configuration

No external configuration. Constants at the top of [`js/latarka.js`](../../js/latarka.js): `DIM`, `FOLLOW`, `CROSS_S`, `LIGHT_S`, `HOLD_S`, `FADE_S`, `GLOW_S`, `DARKEN_S`, `ACT_S`, `KEY_STEP`, `SAMPLES` and the `TOYS` table.

## 9. Assets

No external asset files. Animals come from `window.Animals`; toys are inline SVG in `js/latarka.js`; the menu icon is inline SVG in `js/activities.js`.

## 10. Randomization and variants

Animals via `Animals.pick(3)`, toys shuffled from 6, positions random with a spacing rule. The layout key of the previous room is remembered for this page session only, so two rooms in a row are never identical.

## 11. Progression and difficulty

None; there are no levels and nothing persists.

## 12. Completion and feedback

Feedback: fade-in, wave or bounce, and the room glow. Completion: all six items revealed at least once in a room; the room lights up for 3 s and a new one follows. Open-ended.

## 13. Analytics and metrics

Reports to `js/analytics.js` (`window.Analytics`). Beam moves are not reported. `track('interaction', { variant })` is called on the first reveal of each item in a room, with the item id (animal id or toy id) as variant. `complete()` is called once for each fully lit room. All calls are wrapped so nothing changes if `window.Analytics` is missing. Data stays on the device; see [README.md](README.md#analytics-status).

## 14. Technical implementation

- **Entry point:** `mount(container)` in [`js/latarka.js`](../../js/latarka.js) overrides `mount` of the `latarka` entry; returns a cleanup function that cancels the frame and removes listeners and DOM.
- **Rendering:** `div.fl > div.fl-dark (two radial gradients driven by CSS variables --fl-x, --fl-y, --fl-r, --fl-a) + div.fl-items > div.fl-item`.
- **State:** beam and aim points, item list (fraction position, lit level, hold timer, revealed flag, action timer), phase (`play`, `glow`, `darken`).
- **Loop:** one `requestAnimationFrame` loop with `dt` capped at 0.05 s, cancelled while the tab is hidden and restarted on `visibilitychange`.
- **Persistence:** none. **Analytics:** section 13.

## 15. Responsive layout and coordinate system

- `.fl` is fixed full-screen. Items keep fractional positions inside the area below the Back button row, so rotation and resize keep state (beam and aim points are rescaled). Beam radius and item size follow the shorter side.
- Works from 320 px wide down to 568 x 320, portrait and landscape.

## 16. Error and edge-case handling

| Case | Behaviour |
|---|---|
| Resize / orientation | Layout recomputed; the beam and items keep their state. |
| Tab hidden | Loop cancelled and restarted on return; the `dt` cap prevents a jump. |
| Fast repeated touches | The aim point changes; the beam speed stays capped. |
| Two fingers | The second pointer is ignored. |
| Beam stays over an item | It stays lit. |
| Leaving mid-room | Cleanup cancels the frame, removes listeners and the DOM. |
| `window.Analytics` missing | Calls are skipped. |

## 17. Testing

No automated tests exist. Manual scenarios (none are claimed as done):

- [ ] Drag across the room; the beam lags softly and crossing takes at least 1.5 s.
- [ ] Move the beam over an item until it is half covered; it fades in, waves or bounces once.
- [ ] Move the light away; the item stays 2 s and then fades.
- [ ] Reveal all six; the room lights up for 3 s and a new arrangement follows.
- [ ] Reopen several times; the layouts differ.
- [ ] Keyboard: Tab, arrows (8% steps), Enter/Space.
- [ ] Rotate mid-room; use two fingers; hide and show the tab.
- [ ] 320 x 568, 568 x 320, reduced motion.

The PR for issue [#212](https://github.com/BielinskiLukasz/child-page/issues/212) reports a Node simulation with a stub DOM (six items, all reveal events, one `complete()`, new room); no visual check was possible.

## 18. Known limitations and open issues

**Confirmed**

- No automated tests.

**Requires verification**

- Look and feel on real devices.

## 19. Planned improvements

None currently planned.

## 20. Related activities and reusable components

- [Chowany](zabawa-w-chowanego.md), [Malowanie Światłem](malowanie-swiatlem.md), [Cienie](cienie.md).
- Uses `window.Animals`, `window.Rand` and `window.Analytics`.

## 21. Change history

- Issue [#212](https://github.com/BielinskiLukasz/child-page/issues/212): initial activity.
