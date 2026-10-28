# Nalej Wody

Status: implemented

- Issue: [#218](https://github.com/BielinskiLukasz/child-page/issues/218)
- Activity id: `nalej`
- CSS prefix: `nw-`

Platform-wide behaviour (no sound, reduced motion, menu configuration, playtime limit, absence of automated tests, privacy) is described in [README.md](README.md#shared-platform-behaviour) and is not repeated here.

## 1. Overview

| Item | Value |
|---|---|
| Display name | Nalej Wody |
| Activity ID | `nalej` (registry entry in [`js/activities.js`](../../js/activities.js)) |
| Description | A jug is dragged sideways and tilts to pour a thin stream into glasses of three different heights; bigger glasses fill more slowly. |
| Category | Volume and flow; dragging; calming |
| Interaction type | Drag and hold (touch, mouse) with a keyboard alternative |
| Status | Implemented; enabled in the menu by default (appended last, no `defaultOff`) |
| Source | [`js/nalej.js`](../../js/nalej.js), styles with prefix `nw-` in [`css/style.css`](../../css/style.css) |

## 2. Business purpose

- The first activity that shows volume and flow over time; [Policz Razem](policz-razem.md) only counts objects. Issue [#218](https://github.com/BielinskiLukasz/child-page/issues/218).
- No text, wrong answers, scores or spilling mess.

## 3. Activity flow

1. A jug (96 px wide or more) hangs in the top row, a small pitcher stands at the right edge, and three glasses of different heights and colours stand on the table.
2. The child holds the jug and drags it sideways. The jug turns to face the direction of travel. While it is held with its spout over the opening of a glass that is not full, it tilts (up to 40 degrees) and a thin stream falls into the glass; the water rises.
3. Moving the jug away, releasing it, filling the glass or emptying the jug stops the stream at once; water never lands outside a glass.
4. Over the pitcher the jug refills by itself (no holding needed); the jug shows its water with a level line and tick marks, and the pitcher gets a dashed outline when the jug is nearly empty.
5. A full glass sparkles with four stars for 2 s.
6. When all three glasses are full they glow and a small animal toasts for 3 s (the jug fades out); the glasses then empty over 2 s and come back with new random heights and colours.
7. Exit: Back button or browser Back.

## 4. Rules and behavior

| Rule | Detail |
|---|---|
| Fill rate | Percent of the glass height per second: 25 (smallest glass), 15 (medium), 10 (tallest). A glass fills in 4 s, 6.7 s and 10 s. |
| Sizes | The three heights are `big` (0.90-1.00 of the maximum height), then each next one is 0.68-0.75 of the previous (so every glass is at least 25% shorter than the next taller one, ratio at least 1.33). The three colours come from a pool of 8 and are always distinct. Order on the table is random. |
| Pouring | Needs the jug held (pointer down, or Enter/Space held), the spout within 34% of the glass width of the glass centre, the glass not full, water in the jug and the tilt past 55% of its maximum. |
| Jug water | The jug drains 6% per second of pouring (about 16 s of pouring per fill) and refills 60% per second over the pitcher. |
| Pitcher | At the right edge; the jug refills whenever its centre is within the pitcher. Over the pitcher the jug never pours. |
| Facing | The spout points the way the jug last moved (changes only while the jug is level, a turn takes 0.5 s). |
| Finale | All three full: glow and a toasting animal for 3 s, 2 s of emptying, then 0.6 s fade-in of a new set; the jug is refilled. Touches are ignored in between. |
| Failure, score | None; nothing is stored. |
| Text | None on screen; only a Polish screen-reader label on the jug. |

## 5. Educational and developmental benefits

**Intended design benefits:** seeing that bigger containers take longer to fill, cause and effect (hold, tilt, flow), fine motor control of a slow horizontal drag.

**Directly observable behavior:** three glasses fill at different, fixed speeds; the water level always rises smoothly.

**Requires professional or research-based validation:** any effect on understanding of volume or time.

## 6. Accessibility and usability

- Input: touch, mouse, keyboard. The jug is a `<button>` (Tab). Arrow Left/Right move it (260 px per second while held); Enter or Space pours while held down.
- The jug is at least 96 px wide; the field starts 64 px below the top so the Back button is never covered, also when the jug is tilted.
- Colour is not the only cue: the glasses differ in height, the full state shows stars and a rising water level, the jug level has a line and tick marks, a nearly empty jug is signalled by a dashed pitcher outline.
- Reduced motion: all movement is driven from one `requestAnimationFrame` loop (no CSS animation), so every state is reached; the jug never turns faster than 0.8 turn per second and nothing flashes (sparkles pulse at 0.8 Hz).
- Only the first pointer drags; a second finger is ignored.

## 7. Risks and limitations

- Dragging across a glass while holding pours into it for as long as the spout is over it, as the issue requires; a child may start several short pours.
- The jug cannot pour into a glass from outside the screen edge: the jug is turned so that its spout always reaches every glass.
- Tested only with stub-DOM simulations in this environment (no browser), see section 17.

## 8. Configuration

No external configuration. Constants at the top of `js/nalej.js`: `RATE` (0.25, 0.15, 0.10), `DRAIN` (0.06), `REFILL` (0.6), `TILT_MAX` (40 degrees), `KEY_SPEED` (260), `SPARK_S` (2), `TOAST_S` (3), `EMPTY_S` (2), `START_GAP` (400 ms) and the `COLORS` list.

## 9. Assets

No asset files: jug, pitcher, glasses, stream and stars are inline SVG built in `js/nalej.js`; the animal head comes from `window.Animals`; the menu icon is in `js/activities.js`.

## 10. Randomization and variants

Glass heights, order on the table and colours (new each set); the animal for the toast. Nothing persists.

## 11. Progression and difficulty

None: always three glasses.

## 12. Completion and feedback

Completed when all three glasses are full. Feedback: sparkles per glass, then glow, a toasting animal and new glasses. No failure.

## 13. Analytics and metrics

Reports to `window.Analytics` (see [README.md](README.md#analytics-status)):

- `track('interaction', { variant: 'small' | 'medium' | 'large' })` at each pour start (the stream begins), where the variant is the rank of the glass by height; at least 400 ms pass between two starts into the same glass.
- `track('interaction', { variant: '<size>-full' })` for each filled glass.
- `complete()` once per full set.

Calls are wrapped in try/catch; nothing is stored by the activity.

## 14. Technical implementation

- **Entry point:** `mount(container)` overrides `mount` of the `nalej` entry; the root is attached with `container.appendChild` before layout; returns a cleanup function that removes listeners and the rAF.
- **Rendering:** `div.nw > div.nw-field > svg.nw-svg` (glasses, pitcher, stream, rebuilt by `build()` on layout), `button.nw-jug` (SVG with a water group counter-rotated so the water stays level), `div.nw-toast`. SVG sizing uses `.stage .nw-jsvg` / `.stage .nw-tsvg`.
- **Model:** jug position is a fraction `fx` of its travel range, facing `dir` with an eased turn `f`; the spout (pivot) is at `X + f * 42 s`. Glasses keep a relative height, colour, level and sparkle timer, so resize and rotation keep all state.
- **Loop:** one capped-dt (50 ms) rAF loop; it stops when nothing changes and restarts on input or when the tab becomes visible.

## 15. Responsive layout and coordinate system

Field = viewport minus 64 px at the top and 12 px elsewhere (plus safe areas). Scale `s` = min(width / 320, height / 300) limited to 1-1.35. Maximum glass height = min(42% of the field height, 50% of its width, height minus 156 px - 78 s), at least 60 px; glasses sit in three equal slots on the ground line; the spout row is as high as the maximum glass allows (70 px minimum from the field top). Works from 320 px wide down to 568 x 320 in both orientations; rotation re-runs `layout()` without losing state.

## 16. Error and edge-case handling

- Resize/rotation: layout is recomputed, levels, jug position and sparkles are kept.
- Tab hidden: held pointer and keys are released and the loop stops; it restarts when visible.
- Fast repeated touches: only one pointer is tracked; pour starts are throttled per glass.
- Second finger: ignored; `pointercancel` and lost capture release the jug.
- Finale: input is ignored and held state is cleared when the toast starts.

## 17. Testing

No automated tests in the repository. Done in this environment: `node --check`, and a node stub-DOM simulation (fake rAF, pointer events on the jug) at 296x244, 296x492 and 544x320 that measured fill times (4.0 s, 6.9 s, 10.1 s), refilling at the pitcher, the three pour/full events, `complete()` and the new set after the finale. Manual scenarios to run in a browser:

1. Drag the jug over each glass and hold: the jug tilts, a stream falls, the water rises at the rates in section 4; release: the stream stops.
2. Hold over a full glass: no tilt and no stream.
3. Pour until the jug is empty: the stream stops; the pitcher gets a dashed outline; drag over the pitcher: the level line rises.
4. Fill all three: glow, toasting animal 3 s, glasses empty over 2 s, new heights (at least 25% apart) and colours.
5. Keyboard: Tab to the jug, arrows move it, hold Enter/Space to pour.
6. Rotate the device mid-pour and mid-finale; hide and show the tab; touch with two fingers.
7. Reduced motion on: every state is still reached.

## 18. Known limitations and open issues

- Visual check in a real browser is still needed (no renderer here).
- The jug can pour into a glass it merely passes over while held.

## 19. Planned improvements

None agreed.

## 20. Related activities and reusable components

[Rozmiar](rozmiar.md) (size ordering), [Policz Razem](policz-razem.md). Uses `window.Rand`, `window.Animals` and `window.Analytics`; nothing shared was added.

## 21. Change history

- Initial implementation ([#218](https://github.com/BielinskiLukasz/child-page/issues/218)).
