# Betoniarka

Platform-wide behaviour (no sound, reduced motion, menu configuration, playtime limit, absence of automated tests, privacy) is described in [README.md](README.md#shared-platform-behaviour) and is not repeated here.

## 1. Overview

| Item | Value |
|---|---|
| Display name | Betoniarka |
| Activity ID | `betoniarka` (registry entry in [`js/activities.js`](../../js/activities.js), lazy-loaded via `src` on its registry entry) |
| Description | The child fills a cement mixer with sand, water and stones, watches the drum turn and pours the mix into moulds. |
| Category | Cause and effect; mixing and pouring; open-ended play; calming |
| Interaction type | Tap or drag a bucket onto the drum; tap or drag the chute lever; tap a mould to choose it; keyboard alternative |
| Status | Implemented; enabled in the menu by default (appended last, no `defaultOff`) |
| Source | [`js/betoniarka.js`](../../js/betoniarka.js), styles with prefix `bk-` in [`css/style.css`](../../css/style.css) |

## 2. Business purpose

- A small cause-and-effect game with a happy ending; issue [#260](https://github.com/BielinskiLukasz/child-page/issues/260), part of the construction-site request of 2026-11-02.
- Differs from [Mieszanie Kolorów](mieszanie-kolorow.md) by its theme (a vehicle with a turning drum) and by the goal of pouring the mix into moulds.

## 3. Activity flow

1. The child opens the tile and sees a yellow cement mixer truck, three buckets (sand, water, stones) and three moulds (house, star, heart); the first mould is highlighted.
2. Tapping a bucket, or dragging it onto the drum, tips it: the bucket tilts toward the drum for 0.6 s and pellets fall into the drum. The drum content rises and its colour blends toward the ingredients added.
3. While the drum holds anything it turns; the speed has 3 levels (1-2, 3-4 and 5 or more ingredients).
4. From the third ingredient the mix is ready: the drum gets a soft glow and a round chute lever appears.
5. Tapping or dragging the lever lowers the chute (0.3 s) and the mix pours into the chosen mould for 2 s; the chute then rises again. The mould shows the finished shape in the mix colour.
6. Adding ingredients in any order or amount is fine. After all three moulds are filled the truck gives a small wobble; 4 s after the last pour the moulds empty (0.5 s fade) and a new round starts.
7. Open-ended. Exit: Back button or browser Back.

## 4. Rules and behavior

| Rule | Detail |
|---|---|
| Ingredients | Sand, water, stones (different shapes and colours, buckets 72-100 px). Up to 8 count toward the level; more are accepted and change nothing. |
| Tip | 0.6 s; the ingredient lands in the drum at 0.8 of the animation. A dragged bucket released away from the drum glides back in 0.5 s. |
| Colour | Drum content colour tweens over 0.5 s to the average of the added ingredient colours. |
| Drum | Rotation speed 90, 180 or 320 degrees per second for 1-2, 3-4 and 5+ ingredients; speed is smoothed. |
| Ready | At least 3 ingredients; soft glow and lever visible. With fewer the lever is hidden and nothing pours. |
| Pour | Chute down 0.3 s, fill 2 s, chute up 0.3 s. During a pour the buckets are ignored. The mould is the highlighted one, else the first free one; the colour is the blend at the start of the pour. |
| Round end | When all three moulds are done: truck wobble 1.2 s, moulds empty at 4 s. |
| Failure, score, text, sound | None. |

## 5. Educational and developmental benefits

**Intended design benefits**

- Cause and effect (ingredients, turning, pouring); choosing a target; colour blending.

**Directly observable behavior**

- The drum fills, changes colour and turns faster; the mould fills with the same colour and shows its shape.

**Requires professional or research-based validation**

- Any claim about learning or developmental benefits; nothing in the code can establish it.

## 6. Accessibility and usability

- **Input:** pointer events (touch, mouse, stylus). Buckets 72-100 px, moulds 64-96 px, lever at least 56 px.
- **Keyboard:** 1, 2, 3 add sand, water, stones; Left/Right choose a mould; Enter pours; Tab reaches every button (4 px focus ring, Enter/Space activates).
- **Labels (Polish):** scene "Betoniarka. Klawisze 1, 2 i 3 dodają piasek, wodę i kamienie, Enter wylewa beton."; buckets "Piasek", "Woda", "Kamienie"; moulds "Forma domek/gwiazda/serce"; lever "Dźwignia rynny". The SVG scene is decorative.
- **Non-colour cues:** bucket shapes, mould outlines and shapes, the ring around the chosen mould and the glow.
- **Reduced motion:** every state is set from JavaScript (one rAF loop); nothing exists only in a CSS keyframe.
- **Text:** none on screen.

## 7. Risks and limitations

- Visual quality has not been checked on a device (sections 17 and 18).
- On very small landscape screens the truck is small.

## 8. Configuration

No external configuration. Constants at the top of [`js/betoniarka.js`](../../js/betoniarka.js): `TIP_S` (0.6), `CHUTE_S` (0.3), `FILL_S` (2), `DONE_S` (4), `FADE_S`, `BACK_S`, `WOBBLE_S`, `READY_N` (3), `MAX_N` (8), `SPEEDS` and the ingredient colours `COL`.

## 9. Assets

No external asset files. The truck, buckets and moulds are inline SVG created by `js/betoniarka.js`; the menu icon is inline SVG in `js/activities.js`.

## 10. Randomization and variants

None.

## 11. Progression and difficulty

None; nothing persists.

## 12. Completion and feedback

A round is complete when all three moulds are filled (truck wobble, then the moulds empty). Feedback: tilt and falling pellets, colour blend, drum speed and glow, the stream and the finished shape. No failure state and no sound. Open-ended.

## 13. Analytics and metrics

Reports to `window.Analytics`: `track('interaction', { variant })` with variant `sand`, `water`, `stones` (each tip) or `pour` (each pour start), and `complete()` when the third mould is filled. Calls are wrapped so nothing changes if `window.Analytics` is missing. The activity is not in the module's `COMPLETABLE` list. Data stays on the device; see [README.md](README.md#analytics-status).

## 14. Technical implementation

- **Entry point:** `mount(container)` in [`js/betoniarka.js`](../../js/betoniarka.js) overrides `mount` of the `betoniarka` entry; returns a cleanup function. Lazy-loaded via `src`.
- **Rendering:** `div.bk > svg.bk-svg (truck group, stream, pellets) + button.bk-bucket x3 + button.bk-mould x3 + button.bk-lever`; the SVG `viewBox` equals the stage pixel size.
- **State:** ingredient counts, drum content level and colour (tweens), rotation angle and speed, chute angle, per-mould state (empty, filling, done), phase (idle, pour, done).
- **Loop:** one `requestAnimationFrame` loop, `dt` capped at 0.05 s, cancelled while the tab is hidden and restarted on `visibilitychange`; stops when the drum is empty and nothing animates. Cleanup cancels it and removes listeners and DOM.
- **Persistence:** none.

## 15. Responsive layout and coordinate system

Pixels recomputed in `layout()` on `resize` and `orientationchange`. Portrait or square: buckets in a top row, truck in the middle, moulds in a bottom row. Wide screens (width above 1.3 x height): buckets in a left column, moulds in a right column, truck in the middle. The truck scales to its box (320 x 568 to 1920 x 1080).

## 16. Error and edge-case handling

| Case | Behaviour |
|---|---|
| Empty drum or fewer than 3 ingredients | Lever hidden; Enter does nothing. |
| Bucket dropped away from the drum | Glides back in 0.5 s. |
| Bucket tapped during a pour | Ignored. |
| Many ingredients | Level capped at 8. |
| Chosen mould already filled | The first free mould is used. |
| Resize / orientation | Layout recomputed; state kept. |
| Leaving mid-round | Cleanup cancels the frame, removes listeners and DOM. |
| `window.Analytics` missing | Calls are skipped. |

## 17. Testing

No automated tests exist. Manual scenarios (none are claimed as done):

- [ ] Tap each bucket; the 0.6 s tip plays and the drum starts to turn.
- [ ] Add 1-2, 3-4 and 5+ ingredients; the speed rises in three steps and the colour blends.
- [ ] At 3 ingredients the glow and lever appear; the lever pours into the chosen mould in 2 s.
- [ ] Fill all three moulds; the truck wobbles and the moulds empty after 4 s.
- [ ] Keyboard: 1-3, Left/Right, Enter.
- [ ] Rotate the device; leave and reopen ten times quickly; reduced motion; 320 x 568, 568 x 320, 1920 x 1080.

The PR for issue [#260](https://github.com/BielinskiLukasz/child-page/issues/260) reports a Node simulation with a stub DOM; no visual check was possible.

## 18. Known limitations and open issues

**Confirmed**

- No automated tests.

**Requires verification**

- Look and feel of the truck, stream and moulds, and the layout on real devices.

## 19. Planned improvements

None currently planned.

## 20. Related activities and reusable components

- [Mieszanie Kolorów](mieszanie-kolorow.md), [Koparka](koparka.md), [Plac Budowy](plac-budowy.md), [Koparka na Budowie](koparka-na-budowie.md).
- No shared component is used besides `window.Analytics`.

## 21. Change history

- Issue [#260](https://github.com/BielinskiLukasz/child-page/issues/260): initial activity.
