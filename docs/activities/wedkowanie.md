# Wędkowanie

Status: implemented

- Issue: [#219](https://github.com/BielinskiLukasz/child-page/issues/219)
- Planned activity id: `wedkowanie`
- Planned CSS prefix: `wd-`

Platform-wide behaviour (no sound, reduced motion, menu configuration, playtime limit, absence of automated tests, privacy) is described in [README.md](README.md#shared-platform-behaviour) and is not repeated here.

## 1. Overview

| Item | Value |
|---|---|
| Display name | Wędkowanie |
| Activity ID | `wedkowanie` (registry entry in [`js/activities.js`](../../js/activities.js), appended last) |
| Description | An animal fisher on a jetty: holding a finger lowers a hook into a pond, releasing pulls it up with a catch (fish, boot, star or bottle) that goes into a bucket. |
| Category | Cause and effect; hold and release; calming |
| Interaction type | Press and hold anywhere, keyboard alternative |
| Status | Implemented; enabled in the menu by default (no `defaultOff`) |
| Source | [`js/wedkowanie.js`](../../js/wedkowanie.js), styles with prefix `wd-` in [`css/style.css`](../../css/style.css) |

## 2. Business purpose

- A hold-and-release mechanic; no other activity uses it ([Akwarium Artura](akwarium-artura.md) and [Łódź Podwodna](lodz-podwodna.md) are touch-to-watch scenes); issue [#219](https://github.com/BielinskiLukasz/child-page/issues/219).

## 3. Activity flow

1. The child opens the tile: a jetty on the left with a random animal fisher and a red bucket, a pond with six slowly swimming fish and toys.
2. Holding a finger anywhere lowers the hook; releasing pulls it up.
3. While the hook is down, a swimmer within 56 px latches on. If nothing latched, the nearest swimmer of an allowed kind is drawn to the hook when the finger is released, so every pull-up brings one catch.
4. The catch swings on the hook; at the surface it flies into the bucket in 1.5 s and a new swimmer enters from an edge.
5. After five catches the fisher hops (0.8 s), the bucket glows for 3 s, the bucket empties and the pond is refilled with a new random set. The play repeats without end. Exit: Back button or browser Back.

## 4. Rules and behavior

| Rule | Detail |
|---|---|
| Hook speed | 25% of the pond depth per second down and up; maximum depth 90%. |
| Latch | Any swimmer within 56 px of the hook while it is down and the finger is held. |
| Catch kinds | Fish (random colour), boot, star, bottle with a small heart; the kind that was caught twice in a row is skipped (not latched, not pulled) so no kind appears three times in a row. |
| Swimmers | Six at a time, at most 15% of the screen width per second (0.05-0.12 used), at least three kinds present; leaving swimmers are replaced by random new ones. |
| Set | Five catches in the bucket: hop, 3 s glow, new pond (old swimmers fade out and re-roll). |
| Failure, score | None; nothing is scored or stored. |
| Text, sound | None. |

## 5. Educational and developmental benefits

**Intended design benefits**

- Holding and letting go on purpose; cause and effect of a held touch.

**Directly observable behavior**

- The hook goes down while the finger stays down and up when it is released; each pull-up shows one picture that ends in the bucket.

**Requires professional or research-based validation**

- Any claim about learning or developmental benefits.

## 6. Accessibility and usability

- **Input:** pointer events on the whole stage; the touch area is the full screen. A second pointer is ignored while the first is down.
- **Keyboard:** Tab to the rod button (at least 56 px, visible focus ring); Enter or Space held lowers the hook, released raises it (key repeat ignored; losing focus releases).
- **Label (Polish):** "Wędka. Przytrzymaj Enter lub spację, żeby opuścić haczyk, puść, żeby go podciągnąć."; the SVG is decorative.
- **Non-colour cues:** all four catch kinds differ by shape; colour is only decoration on fish.
- The Back button area (top-left) is above the pond and the bucket.

## 7. Risks and limitations

- No renderer was available while writing the code: layout was checked by arithmetic and a scripted simulation, not by looking at it on a device.

## 8. Configuration

None; nothing is stored.

## 9. Assets

All pictures are inline SVG drawn in code (the fisher is a random head from `window.Animals`, bear, rabbit, cat or dog).

## 10. Randomization and variants

Random fisher animal per launch; random kind, colour, direction, speed and depth of each swimmer; the same catch kind never occurs three times in a row.

## 11. Progression and difficulty

None.

## 12. Completion and feedback

A set of five catches: fisher hop and bucket glow (3 s, a smooth fade, no flashing), then a new pond.

## 13. Analytics and metrics

- `track('interaction', { variant })` once per lowering, when the finger is released, with the catch kind (`fish`, `boot`, `star`, `bottle`) as variant.
- `complete()` when the fifth catch reaches the bucket. Nothing is stored beyond the shared module's aggregates.

## 14. Technical implementation

One SVG scene updated every frame by a single capped-dt `requestAnimationFrame` loop (paused while the tab is hidden); everything is set from JS, so reduced motion does not hide any state. The root is attached with `container.appendChild(root)` before `layout()`; the returned cleanup removes the listeners, the loop and the root.

## 15. Responsive layout and coordinate system

The pond starts at 40% of the height; unit sizes derive from min(width, 1.4 x height); the hook column sits right of the fisher; the jetty and bucket are on the left. Rotation re-runs `layout()` and keeps all state.

## 16. Error and edge-case handling

Rotation or resize, hidden tab, very fast repeated taps (every release still brings one catch), second finger (ignored), pointer cancel (treated as release), blur during a key hold (released).

## 17. Testing

No automated tests in the repository. Manual scenarios:

1. Hold on the pond: the hook sinks about 25% of the pond depth per second and stops at 90%; release: it rises at the same speed.
2. Hold until a swimmer is within 56 px: it hangs on the hook and swings.
3. Tap very briefly: the release still brings one catch.
4. Pull up five catches: the fisher hops, the bucket glows about 3 s, the bucket empties, a new pond appears.
5. Watch ten catches: no kind three times in a row.
6. Keyboard: Tab to the rod, hold Enter/Space, release.
7. Rotate in the middle of a pull-up: the scene keeps its state.
8. Put a second finger down while holding: nothing breaks.

## 18. Known limitations and open issues

- A swimmer drawn to the hook on release moves faster than the normal swim speed (a short 0.5 s glide).

## 19. Planned improvements

None.

## 20. Related activities and reusable components

[Akwarium Artura](akwarium-artura.md), [Łódź Podwodna](lodz-podwodna.md); `window.Animals`.

## 21. Change history

- Implemented for issue [#219](https://github.com/BielinskiLukasz/child-page/issues/219).
