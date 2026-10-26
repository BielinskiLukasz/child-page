# Nocne Niebo

## 1. Overview

| Property | Value |
|---|---|
| Display name | Nocne Niebo |
| Activity ID | `niebo` (`js/activities.js`) |
| Description | Glowing stars in a night sky. Touching every star connects them into a simple shape (a "constellation"); when all stars are lit the shape glows and a "Dalej" button leads to the next shape. |
| Category | Observation, drawing-like connecting, cause and effect |
| Interaction type | Tap (click) on star buttons, then tap "Dalej" |
| Status | Implemented. Enabled by default in the menu (no `defaultOff` flag). |
| Source | [`js/niebo.js`](../../js/niebo.js), CSS classes `.night`, `.n-*` in [`css/style.css`](../../css/style.css) |

## 2. Business purpose

A gentle "connect the dots" activity without numbers, errors or scores: each touched star lights up and the lines appear by themselves. It gives the child a small, achievable goal (light all stars) with a clear and calm payoff (the shape glows, a short praise message appears), and teaches by example that a set of points forms a recognisable picture (a car, a bear, a house...). It differs from [Rysuj Kształty](rysuj-ksztalty.md) and [Ścieżka](sciezka.md) in that nothing has to be traced; each star is a single tap. Since issue #110 there are 10 shapes shown in random order.

## 3. Activity flow

1. The child opens the tile (hash `#niebo`); the 10 shapes are shuffled and the first one is built.
2. The sky shows faint dim star dots and a faint dashed ghost outline of the shape.
3. The child taps stars in any order.
4. A tapped star lights up; each edge whose two ends are both lit draws itself (0.9 s).
5. When the last star is lit, the interior of the shape glows softly (1.6 s), the lines glow, the message "Brawo, Artur!" fades in and the "Dalej" button becomes active.
6. Tapping "Dalej" fades the sky out (0.8 s), builds the next shape and fades it in. After the 10th shape the order is reshuffled and play continues without end.
7. There is no separate restart; "Dalej" is the only way to move on.
8. The child leaves with the Back button (see [shared behaviour](README.md#shared-platform-behaviour)).

## 4. Rules and behavior

| Rule | Value |
|---|---|
| Number of shapes | 10: samochód (car), miś (bear), domek (house), kot (cat), ryba (fish), drzewo (tree), serce (heart), łódka (boat), gwiazda (star), latawiec (kite) |
| Stars per shape | car 10, bear 8, house 7, cat 8, fish 9, tree 11, heart 8, boat 7, star 10, kite 6 |
| Edges | A closed outline through the first `ring` stars (7-11), plus optional `extra` edges (bear 2, boat 3, kite 2) |
| Valid input | Tap any unlit star, in any order. Re-tapping a lit star does nothing |
| Line drawing | An edge draws (stroke-dashoffset transition, 0.9 s) as soon as both of its stars are lit |
| Success | All stars of the shape lit (`active.every(Boolean)`) |
| Success feedback | `.done` class: polygon fill `rgba(255,233,168,.18)` fading in over 1.6 s, glow on lines; "Brawo, Artur!" message; "Dalej" enabled |
| Next shape | "Dalej" disables itself, fades the sky for `FADE_MS` = 800 ms, builds the next shape, fades in, and input is accepted again 800 ms later (`busy` flag) |
| Order | Every shape once in random order; when used up it is reshuffled and the first of the new round is never the last of the previous round |
| Failure / retry | None; there are no wrong taps |

Reduced motion: state changes are defined in base CSS rules (`.n-line.on` has `stroke-dashoffset: 0`, `.done .n-fill` has the fill colour), so under the global rule the lines and fill simply appear instantly; the star pulse (3.6 s, scale 1.18) and the fade transitions are removed. The 800 ms delays are JavaScript timers and still run.

## 5. Educational and developmental benefits

**Intended design benefits**

- Visual perception and recognition of simple shapes.
- Attention and hand-eye coordination (finding and tapping every star).
- Calm, goal-oriented play with immediate positive feedback.

**Directly observable behavior**

- The ghost outline shows where lines will go; lit stars are brighter and pulse slowly.
- The result is a recognisable shape that fills with a soft glow.
- The child does not need to read; the praise text is short and not required to proceed.

**Requires professional or research-based validation**

- Any effect on visual-spatial skills or shape recognition. None is measured or claimed.

## 6. Accessibility and usability

- **Input:** touch, mouse and stylus via `click`; **keyboard** (Tab to each star, Enter/Space) because stars are real `<button>` elements; "Dalej" is also a button. Focus outlines are defined for stars and "Dalej".
- **Screen readers:** every star has the same label "Gwiazdka" and no lit/unlit state (`aria-pressed` is not used); the message region has `aria-live="polite"`. The shape cannot be identified without sight.
- **Targets:** star buttons are 56 x 56 px (`min-width` and `min-height` 48 px); the visible dot is 22 px. Spacing between stars is small in some shapes: the closest pair is 10 units apart in Domek (12 in Samochód, 14 in Drzewo, 16 in Ryba, 20 or more in the others). On a 300 px sky (320 px wide phone) 10 units are 30 px, so neighbouring 56 px buttons overlap there (computed from the data, see section 18).
- **Sky size:** a square `min(94vw, 100dvh - 76px)`, centred; portrait and landscape both work, with a smaller sky in short landscape.
- **Colour:** lit and unlit stars differ by brightness and glow, not hue alone; the ghost outline is a dashed non-colour cue.
- **Sound:** none. **Reading:** only the praise text, not required. Independent use by a young child is feasible.
- **Motion:** slow pulse and fades only; no flashing.
- **Limitations:** no accessible name distinguishing stars; praise text includes the name "Artur" (it is the product's named user, see README) and is not configurable.

## 7. Risks and limitations

- A child can tap stars at random and complete the shape without understanding the shape (by design: no failure).
- When all stars are lit, "Dalej" is the only progression; a child who does not press it sees a static scene.
- Shapes are small polygons; some (kite, boat) have fewer stars and are easier than others (tree has 11).
- In Domek, Samochód, Drzewo and Ryba some stars are closer together than the 56 px button size on small screens (about 30, 36, 42 and 48 px on a 300 px sky), so a tap can hit the neighbouring star instead of the intended one; the result is harmless (no wrong answers) but can be confusing.
- No personal data is involved.

## 8. Configuration

No external configuration. The shape data is the `SHAPES` array in [`js/niebo.js`](../../js/niebo.js): each entry has `name`, `ring` (number of stars in the closed outline), `extra` (additional edges as index pairs) and `pts` (star coordinates, 0-100 on both axes). New shapes can be added by appending to `SHAPES` without changing logic. Timing constant `FADE_MS` = 800 is in the same file; the line draw time (0.9 s), fill time (1.6 s) and pulse (3.6 s) are in CSS. There is no validation of the data; invalid indices would break the build step.

## 9. Assets

No external assets. The sky background is a CSS radial gradient, the shape is inline SVG (lines and polygon built at runtime) and stars are `<button>` elements with a CSS pseudo-element dot. Menu icon: inline SVG in [`js/activities.js`](../../js/activities.js). No fonts, audio or images.

## 10. Randomization and variants

- **What:** the order of the 10 shapes.
- **When:** at mount, and again whenever the 10 are used up.
- **How:** `Rand.shuffle(SHAPES)` (Fisher-Yates, from [`js/random.js`](../../js/random.js)); every shape appears once per round; if the first shape of a new round equals the last shown, it is rotated to the end.
- **Persistence:** none; every launch starts with a new random order, so a launch may begin with the same shape as the previous launch.
- **Pool:** fixed 10; an empty pool cannot happen.

## 11. Progression and difficulty

No difficulty progression: shapes are served in random order regardless of their star count (6-11). Nothing is stored between sessions.

## 12. Completion and feedback

Completion state exists per shape: all stars lit. Feedback is visual only (glowing lines and interior, message "Brawo, Artur!"). After completion nothing happens automatically; the child presses "Dalej" for the next shape. There is no overall end, no score and no sound.

## 13. Analytics and metrics

On `main` nothing is emitted (see [Analytics status](README.md#analytics-status)); `js/niebo.js` has no analytics calls, so `activity_start`, `activity_end`, `activity_complete`, `activity_restart`, `interaction`, `level_start` and `level_complete` are **not emitted** and no metric is supported.

Not implemented (planning note only): the natural events would be a completion per shape (one shape finished) and active time; "level" events are not applicable because there are no levels, and the infinite loop of shapes means a completion rate for the whole activity would be misleading. Any implementation must stay on-device without personal data ([#164](https://github.com/BielinskiLukasz/child-page/issues/164), PR [#172](https://github.com/BielinskiLukasz/child-page/pull/172) open).

## 14. Technical implementation

- **Entry point:** `mount(container)` in [`js/niebo.js`](../../js/niebo.js).
- **Rendering:** a `div.night` containing `div.n-sky` (square) with an SVG (`viewBox 0 0 100 100`, `preserveAspectRatio="none"`) for ghost lines, glowing lines and the fill polygon, plus `button.n-star` elements positioned in percent. The SVG paths are rebuilt per shape in `build()`.
- **State:** `order`, `index`, `active[]`, `busy`, `timers`.
- **Events:** one delegated `click` listener on the sky (closest `.n-star`), `click` on "Dalej", `visibilitychange` (toggles `.paused`, pausing the CSS pulse).
- **Animation:** CSS transitions on `stroke-dashoffset`, fill and opacity; line length is passed as `--len`.
- **Cleanup:** clears timers, removes listeners and the scene node.
- **Dependencies:** [`js/random.js`](../../js/random.js) (`Rand.shuffle`).

## 15. Responsive layout and coordinate system

Star and line coordinates share one square space of 0-100 units: stars are placed at `left/top` in percent of `.n-sky`, lines in the SVG viewBox 0-100. The sky is a square with side `min(94vw, 100dvh - 76px)` (with a `100vh` fallback), centred with 64 px top padding for the Back button. The "Dalej" button is placed at the bottom-right corner with safe-area insets; the praise text is at the top of the screen. Because the sky is a square, shapes are never distorted by the aspect ratio of the device.

## 16. Error and edge-case handling

| Case | Behaviour |
|---|---|
| Missing `Rand` | `reshuffle()` throws; the activity would not start |
| Resize / rotation | Percent layout; the sky is resized by CSS |
| Tapping during the fade | Ignored (`busy`) |
| Tapping "Dalej" twice | Second tap ignored (`busy`, disabled) |
| Tapping a lit star | No effect |
| Backgrounding | Pulse paused; JS timers continue |
| Leaving during a fade | Timers are cleared |
| Touch cancellation | `click` is used, so a cancelled touch simply does not activate a star |

## 17. Testing

No automated tests exist (see [shared behaviour](README.md#shared-platform-behaviour)). PR [#136](https://github.com/BielinskiLukasz/child-page/pull/136) states that node spacing on short landscape screens was not browser-tested.

Manual scenarios (all unchecked):

- [ ] Normal: open the activity; the first shape's ghost outline and stars appear; tapping a star lights it and draws edges to lit neighbours.
- [ ] Completion: light all stars of a shape in a random order; the interior glows, "Brawo, Artur!" and an active "Dalej" appear.
- [ ] Incorrect interaction: tap the same star repeatedly, tap between stars; nothing breaks.
- [ ] Restart / next: press "Dalej"; the next shape appears after a fade; a double tap on "Dalej" does not skip a shape.
- [ ] Randomization: play 11 shapes; all 10 appear once per round and the first of round two differs from the tenth.
- [ ] Every one of the 10 shapes (car, bear, house, cat, fish, tree, heart, boat, star, kite) completes with all edges drawn and looks recognisable; the bear's two extra edges, the boat's three and the kite's two are drawn.
- [ ] Progression: none expected; confirm.
- [ ] Portrait and landscape (including 320x568 and a short landscape such as 640x360): check that every star of Domek, Samochód, Drzewo and Ryba can be lit deliberately, and note which neighbour is hit when buttons overlap.
- [ ] Touch, mouse and keyboard (Tab, Enter/Space on stars and "Dalej").
- [ ] Background/foreground during a fade; return and continue.
- [ ] Reduced motion: lines and glow appear instantly; "Dalej" still works.
- [ ] Browsers: Chrome desktop, Chrome Android, Safari iPhone/iPad.

## 18. Known limitations and open issues

**Confirmed**

- Closest star pairs (computed from `SHAPES`): Domek 10 units, Samochód 12, Drzewo 14, Ryba 16; with a 56 px button this overlaps below a sky of about 560 px (Domek) to 350 px (Ryba) wide, i.e. on all phones.
- The README describes touching stars "in turn", but the code accepts any order.
- All stars share the label "Gwiazdka"; lit state is not exposed to assistive technology.
- `window.Rand` is required, no fallback.
- The praise text contains a fixed name and is not configurable.

**Requires verification**

- Which star receives the tap where 56 px buttons overlap (later DOM order is likely on top); PR #136 notes that spacing on short landscape screens was not browser-tested.
- Whether all 10 shapes are recognisable to a young child.

No open GitHub issue is specific to this activity.

## 19. Planned improvements

None currently planned.

## 20. Related activities and reusable components

- Similar: [Rysuj Kształty](rysuj-ksztalty.md), [Ścieżka](sciezka.md), [Dzień i Noc](dzien-i-noc.md) (night sky).
- Shared helper: [`js/random.js`](../../js/random.js) (`Rand.shuffle`). It does not use `js/animals.js`.

## 21. Change history

- Issue [#5](https://github.com/BielinskiLukasz/child-page/issues/5) / PR [#12](https://github.com/BielinskiLukasz/child-page/pull/12): initial activity; a later fix drew lines with real path lengths because the first approach did not connect stars.
- Issue [#110](https://github.com/BielinskiLukasz/child-page/issues/110) / PR [#136](https://github.com/BielinskiLukasz/child-page/pull/136): 10 shapes in random order.
