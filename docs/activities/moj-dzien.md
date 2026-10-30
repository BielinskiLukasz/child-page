# Mój Dzień

Platform-wide behaviour (no sound, reduced motion, menu configuration, playtime limit, absence of automated tests, privacy) is described in [README.md](README.md#shared-platform-behaviour) and is not repeated here.

## 1. Overview

| Item | Value |
|---|---|
| Display name | Mój Dzień |
| Activity ID | `mojdzien` (registry entry in [`js/activities.js`](../../js/activities.js), appended last) |
| Description | Four tiles (a sun, a bowl, a ball and a moon) each play a 6 s scene of one random animal's day: waking up, eating, playing, sleeping. |
| Category | Daily routine; cause and effect |
| Interaction type | Tap (touch, mouse, keyboard) |
| Status | Implemented; enabled in the menu by default |
| Source | [`js/mojdzien.js`](../../js/mojdzien.js), styles with prefix `md-` in [`css/style.css`](../../css/style.css), lazy-loaded via `src`/`deps` on its registry entry in [`js/activities.js`](../../js/activities.js) |
| Issue | [#220](https://github.com/BielinskiLukasz/child-page/issues/220) |

## 2. Business purpose

- Shows the order of a day (morning, meal, play, night) in pictures, without clock numbers or text; Dobranoc covers only the evening.
- Calm and without failure: tiles can be touched in any order.

## 3. Activity flow

1. The activity opens with a calm animal in daylight and four tiles in a row at the bottom.
2. Touching a tile starts that scene (6 s); the sky blends to the time of day over 1 s.
3. Touching any tile during a scene restarts or replaces it; only one scene runs at a time.
4. A scene counts as seen as soon as it is started (a scene cut short still counts); the finale follows when the scene playing after all four were seen reaches its end; the final frame stays until the next touch.
5. When all four have been seen, the tiles glow for 3 s and the animal waves; then a different animal and a new set begin.

## 4. Rules and behavior

| Scene | Tile picture | What happens |
|---|---|---|
| Morning | sun | Animal asleep in bed, opens its eyes, sits up, stretches with raised arms, yawns; the sun rises. |
| Meal | bowl | Animal leans to the bowl and eats; the food gets lower. |
| Play | ball | A ball bounces and the animal hops side to side after it. |
| Night | moon | Sun sets, moon and stars fade in, the animal closes its eyes, is covered by a blanket and "z" signs rise. |

- Scene length `DUR = 6` s, finale `FINALE = 3` s, pose blend between scenes 0.35 s, sky blend 1 s.
- Sky colours (top, bottom): morning `#b9dff5/#ffe0bd`, meal `#9fd3f3/#e4f3fb`, play `#a9d9f0/#fff0c4`, night `#2f3b78/#6f66ae`.
- "Seen" means the scene was started, so a scene cut short by another touch still counts; the finale starts when a scene plays to its end after all four have been seen. The set resets at the finale.

## 5. Educational and developmental benefits

- Sequence of a day, linked to familiar actions (waking, eating, playing, sleeping); no scoring.

## 6. Accessibility and usability

- Tiles are native buttons (at least 72 px; four in a row from 320 px width); Tab to a tile, Enter/Space plays it. Polish `aria-label`s: Rano, Posiłek, Zabawa, Noc.
- Meaning is carried by four different pictures (not colour); focus ring is a white outline plus a purple halo.

## 7. Risks and limitations

- Poses are drawn from the shared animal heads with simple arms; scene art was verified only with a stub DOM, not in a real browser.

## 8. Configuration

None; constants at the top of `js/mojdzien.js`.

## 9. Assets

All drawn inline in SVG; the animal head comes from `window.Animals`. No sound, no images.

## 10. Randomization and variants

One random animal per launch (`Animals.pick(1)`), never the same as the previous one; a new animal after each full set.

## 11. Progression and difficulty

None.

## 12. Completion and feedback

When the fourth distinct scene ends: glow on all tiles for 3 s (box-shadow and 5% scale, driven from the rAF loop) and the animal waves; then a new set starts.

## 13. Analytics and metrics

`track('interaction', { variant })` on every scene start (variant `morning`, `meal`, `play`, `night`); `complete()` when a set of four has been seen.

## 14. Technical implementation

- One SVG scene (200x150, `meet`) plus a tile row. Every pose is a pure function of scene time (`pose(kind, t)`) painted from one capped-dt rAF loop, so reduced motion does not disable anything; the loop stops when the scene is held.
- Sky gradient, glow and pose blending are interpolated in JS. `mount` returns a cleanup that cancels rAF and removes listeners and DOM.

## 15. Responsive layout and coordinate system

`.md` is fixed full screen with 56 px reserved at the top for Back; the sky fills the remaining height and the tile row (max 424 px, 320 px when the height is under 420 px) sits at the bottom. State lives in JS, so rotation and resizing keep it.

## 16. Error and edge-case handling

Fast repeated touches restart the scene without stacking; a hidden tab restarts the rAF clock (dt capped at 50 ms); multi-touch is just several clicks; analytics errors are swallowed.

## 17. Testing

Manual scenarios:

1. Open the tile: four tiles, a standing animal.
2. Touch each tile once: scene runs about 6 s, sky changes; final frame stays.
3. Touch a tile three times quickly: it restarts, nothing duplicates.
4. See all four: tiles glow 3 s, the animal waves, then a new animal.
5. Tab to a tile and press Enter / Space.
6. Rotate the device mid-scene: nothing resets.
7. Enable reduced motion: scenes still play.

A node stub-DOM simulation covered: restart, completion count (one per set), glow on and off, cleanup and no NaN in painted values.

## 18. Known limitations and open issues

Not checked on real devices.

## 19. Planned improvements

None.

## 20. Related activities and reusable components

[Dobranoc](dobranoc.md), [Dzień i Noc](dzien-i-noc.md); `window.Animals`, `window.Analytics`.

## 21. Change history

Added by issue #220.
