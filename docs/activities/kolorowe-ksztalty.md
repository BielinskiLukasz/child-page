# Kolorowe Kształty

Platform-wide behaviour (no sound, reduced motion, menu configuration, playtime limit, absence of automated tests, privacy) is described in [README.md](README.md#shared-platform-behaviour); this document only records what is specific to this activity.

## 1. Overview

| Item | Value |
|---|---|
| Display name | Kolorowe Kształty |
| Activity ID | `ksztalty` (registry entry in [`js/activities.js`](../../js/activities.js)) |
| Description | Soft coloured shapes are dragged onto matching dashed outlines. Pictures start as 2x2 shapes and become 3x3 after three finished pictures; every picture has fresh random shapes, colours and positions. |
| Category | Matching |
| Interaction type | Drag and drop (touch, mouse, stylus); keyboard alternative (select, then choose outline) |
| Status | Implemented; enabled in the menu by default |
| Source | [`js/ksztalty.js`](../../js/ksztalty.js), styles with prefix `ks-` in [`css/style.css`](../../css/style.css), lazy-loaded via `src`/`deps` on its registry entry in [`js/activities.js`](../../js/activities.js) |

Not to be confused with [Rysuj Kształty](rysuj-ksztalty.md), a separate tracing activity.

## 2. Business purpose

- A shape-matching activity with no wrong answers: a shape released anywhere but on its own outline drifts back, with no negative feedback.
- Practises matching by form (outline and shape have the same form), with colour as an additional but independent attribute.
- Variety through random shapes, colours and positions, and a gentle step up from 4 to 9 pieces, so the activity can be replayed without repeating the same picture.
- Described in the README Activities list as item 11.

## 3. Activity flow

1. The child opens the tile; the first picture (2x2) is built.
2. Initially displayed: a grid of 4 dashed outlines (targets) and a grid of 4 coloured shapes (to drag). In portrait the outline grid is above and the shapes below; in landscape they are side by side (outlines left, shapes right).
3. Interaction: drag a shape onto its matching outline. Keyboard: press Enter/Space on a shape, then activate an outline.
4. Response: released near its own outline (within 0.75 shape sizes), the shape glides in, glows and stays (outline dims to 35 % opacity). Anywhere else, or on another outline, it glides back to its start position.
5. Completion: when all shapes are placed, a soft whole-picture glow fades in.
6. After 4 s the next picture is built automatically (new shapes, colours and positions).
7. After 3 completed pictures the grid becomes 3x3 (9 shapes) for the rest of the visit.
8. Exit: Back button or browser Back. Re-opening starts again at 2x2.

## 4. Rules and behavior

| Rule | Detail |
|---|---|
| Pieces per picture | `g * g`: 4 (g = 2) or 9 (g = 3). |
| Shapes | 9 shapes (`SHAPES`): kółko (circle), kwadrat (square), trójkąt (triangle), gwiazdka (star), serduszko (heart), romb (diamond), sześciokąt (hexagon), owal (oval), krzyżyk (cross). A picture uses `g * g` **different** shapes. |
| Colours | 9 colours (one defined per shape, but used independently): pink `#f7a8c9`, blue `#a8d8f0`, yellow `#ffd98a`, light yellow `#fff0a0`, rose `#f7b0b8`, lilac `#c9b8f2`, green `#bfe6b4`, orange `#ffc9a0`, mint `#a8e0d6`. A picture uses `g * g` **different** colours, randomly paired with the shapes. |
| Placement | The outline for shape *i* is at target-grid cell *i*; the shape *k* starts at a different cell of the shape grid (random permutation with no fixed point, so no shape starts "under" its own outline's slot). |
| Drop test | On release, the distance from the shape centre to its own outline centre must be below `0.75 * S` (S = shape size in px); otherwise the shape returns. Dropping on a different outline does not accept it. |
| Glide | Returning or snapping takes `min(1400, 700 + distance * 0.8)` ms with smoothstep; 300 ms when `prefers-reduced-motion` is set; 200 ms when re-laid out after a resize. |
| Drag limits | The shape centre is clamped inside the visible screen; only the primary pointer button (or touch) starts a drag; one pointer per shape (multi-touch on different shapes works). |
| Placed shapes | Disabled (not draggable or focusable), glow fades in over about 250 ms, outline opacity 0.35. |
| Whole-picture glow | A radial glow over the screen fades in (about 500 ms) when every shape is placed and idle. |
| Next picture | `RETURN_AFTER = 4000` ms after the last shape settles; the timer only advances while the page is visible. |
| Progression | `WIN_AFTER = 3` completed pictures at 2x2, then 3x3. |
| Sound | None. |

## 5. Educational and developmental benefits

**Intended design benefits**

- Visual discrimination and matching of forms.
- Hand-eye coordination through dragging.
- Noticing that colour and form are separate properties (colour is randomly paired with shapes).

**Directly observable behavior**

- A shape only stays where its own outline is; every other release returns it softly.
- Colour is not a reliable cue for the match (random pairing), so form decides.

**Requires professional or research-based validation**

- Any claim about learning shapes or colours. Nothing in the code can establish it.

## 6. Accessibility and usability

- **Input:** pointer events with pointer capture (touch, mouse, stylus), `touch-action: none`. Keyboard: shapes are native buttons; Enter/Space selects (`aria-pressed`, visible selection outline), then Enter/Space on an outline places it there (wrong outline sends the shape home). Tap-to-select is keyboard-only: a plain tap on a shape without dragging returns the shape home.
- **Labels (Polish):** outlines "Miejsce na <shape>", shapes "<shape> (Enter lub spacja, potem wybierz miejsce)".
- **Target sizes:** shape size `S = clamp(min(cell width, cell height) * 0.82, 56, 140)` px, and CSS `min-width/min-height: 56px`.
- **Orientation:** portrait (field height >= width): outlines above, shapes below; landscape: side by side; re-laid out on `resize` and `orientationchange`.
- **Colour:** a match is made by form; outlines carry the same dashed form and colour as their shape. Colour is not required.
- **Reduced motion:** the glides, glow and all state changes run from a `requestAnimationFrame` loop, so they still work under the global rule (the glides are shorter, 300 ms).
- **Reading:** not required; the labels are for assistive technology only.
- **Limitation:** a very small screen can make the grid cells smaller than the 56 px minimum, so shapes may overlap (requires verification).

## 7. Risks and limitations

- Dragging requires some motor control; keyboard alternative exists but a mouse or touch tap-select does not.
- The glow and re-layout every 4 s after completion are the only automatic changes; they replace all shapes at once (DOM is rebuilt).
- No end; relies on the global playtime limit.
- No privacy concerns; nothing is stored.

## 8. Configuration

No external configuration. Constants in [`js/ksztalty.js`](../../js/ksztalty.js):

| Constant | Purpose | Value |
|---|---|---|
| `SHAPES` | Shape definitions (id, Polish label, colour, glow, SVG path) | 9 |
| `COLORS` | Colour list derived from `SHAPES` | 9 |
| `WIN_AFTER` | Completed 2x2 pictures before 3x3 | 3 |
| `RETURN_AFTER` | Delay before the next picture | 4000 ms |
| Drop radius | Fraction of shape size | 0.75 (in `up()`) |
| Shape size limits | `Math.max(56, Math.min(140, ...))` | 56 to 140 px |
| Frame cap | `Math.min(now - last, 50)` | 50 ms |

Fallback: none needed.

## 9. Assets

No external assets. All shapes and outlines are inline SVG (`viewBox="0 0 100 100"`) generated by `shapeSvg()` from path templates (filled with stroke width 12 for shapes; translucent white fill with a dashed 4-wide stroke for outlines). Glow is a CSS radial gradient and `drop-shadow` filter. No images, fonts or audio.

## 10. Randomization and variants

- **Per picture:** `Rand.pick(SHAPES, n)` selects `n` unique shapes; `Rand.pick(COLORS, n)` selects `n` unique colours (`js/random.js`, in memory only); pairing is by position. Outline slots follow the order of the shapes; start slots are a random permutation with no fixed point (re-drawn until none matches).
- **Pool sizes:** 9 shapes and 9 colours; for 3x3 all of each are used (only the pairing and positions vary).
- There is no guard against the same combination appearing in consecutive pictures; nothing is stored between launches.

## 11. Progression and difficulty

- Start: 2x2 (4 pieces). After 3 completed pictures: 3x3 (9 pieces) for the remainder of the visit.
- No further levels; re-opening the activity resets to 2x2 (the counters are in memory only).
- Difficulty changes only through the piece count.

## 12. Completion and feedback

- Completion state: all shapes placed; feedback is a soft glow over the screen, with no text or sound.
- Wrong drops: shapes glide back; no red, shake or message.
- After 4 s the next picture starts automatically; there is no end screen.

## 13. Analytics and metrics

This activity reports to the shared on-device module `js/analytics.js` (`window.Analytics`) through the app shell only: `js/app.js` records the activity start and end, and the module counts touches inside the stage. The activity file itself calls no `Analytics` function. Recorded for it: starts, active time, replays (re-opening in the same session), quick exits (within 10 s) and touches. It is open-ended, so no completion, level or exit-before-completion is defined for it. Data stays on the device as anonymous daily aggregates; see [README.md](README.md#analytics-status).

## 14. Technical implementation

- **Entry point:** `mount(container)` in [`js/ksztalty.js`](../../js/ksztalty.js); it sets `container.style.display = 'block'` and does not restore it (the stage is emptied by `app.js` on exit). The cleanup function cancels the frame, removes the global listeners and removes the board.
- **Rendering:** DOM buttons with inline SVG, moved with `transform: translate`; one `div.ks-glow` overlay; rebuilt for each picture by `newRound()`.
- **State:** `g`, `completed`, `defs[]` (shape, colour, outline), `items[]` (position `x, y`, home `hx, hy`, target `tx, ty`, mode `idle | drag | glide`, `placed`, `glow`), `selected`, `doneT`, `doneGlow`.
- **Loop:** one `requestAnimationFrame` loop (`frame`) that stops when idle and is restarted by `start()` (glide, resize, `visibilitychange`); the time step is capped at 50 ms.
- **Events:** `pointerdown`, `pointermove`, `pointerup`, `pointercancel`, `lostpointercapture` per shape; `click` (keyboard, `detail === 0`) on shapes; `click` on outlines; `resize`, `orientationchange`, `visibilitychange`.
- **Shared code:** `window.Rand` (`pick`, `shuffle`).
- **Persistence:** none. **Analytics:** `Analytics.levelStart` / `levelComplete` / `complete`.

## 15. Responsive layout and coordinate system

- `.ks-field` is positioned below the Back button (top `safe + 64px`, 12 px other margins) and measured in pixels with `getBoundingClientRect`.
- Cell size: `cw = rw / g`, `ch = rh / g`, where the field is split in two regions (top/bottom in portrait, left/right in landscape); items are centred in their cells. Outlines and shapes use the same pixel coordinate space (the `ks-field`), so a shape placed on an outline is exactly on it.
- Re-layout on resize: positions recomputed; active drags are cancelled and sent home; placed shapes stay on their outlines.
- The shape size is recomputed per layout and passed to CSS as `--ks-s`.

## 16. Error and edge-case handling

| Case | Behaviour |
|---|---|
| Release outside any outline or on another outline | The shape glides home. |
| Resize or rotation during a drag | The drag is cancelled safely and the shape is sent home. |
| Pointer cancel or lost capture | Treated as a release (`up`). |
| Multi-touch | Several shapes can be dragged at once; one pointer per shape. |
| Tab hidden | The loop is cancelled; the post-completion timer only counts visible time; restarted on return. |
| Drag off-screen | The shape centre is clamped inside the viewport. |
| Synthetic pointer without capture support | `setPointerCapture` is wrapped in `try/catch`. |
| Selecting a placed shape via keyboard | Ignored (placed shapes are disabled). |

## 17. Testing

No automated tests exist. Manual scenarios (none are claimed as done):

- [ ] Normal: open the activity; 4 shapes and 4 outlines (2x2); drag each shape onto its outline; it glides in and glows.
- [ ] Completion: place all shapes; the screen glows softly; after about 4 s a new picture appears.
- [ ] Incorrect interaction: drop a shape on another outline, on empty space, and near-but-off the outline; it always glides back with no message.
- [ ] Tap a shape without dragging; it returns home.
- [ ] Progression: finish 3 pictures; the 4th has 9 shapes (3x3); re-open the activity; it starts at 2x2 again.
- [ ] Randomization: over several pictures, shapes, colours (all different within a picture) and positions change; no shape starts at its own outline's slot.
- [ ] Restart: leave in the middle of a picture and re-open; a new picture starts.
- [ ] Portrait: outlines above, shapes below; landscape: side by side; rotate during a drag and after placing shapes.
- [ ] Small screens (for example 320x568 and 360x640): shapes are at least 56 px and do not overlap.
- [ ] Touch (Chrome Android, Safari iPhone/iPad), including dragging two shapes at once; mouse (desktop).
- [ ] Keyboard: Tab to a shape, Enter/Space, then Tab to an outline and Enter/Space; wrong outline returns the shape.
- [ ] Background/foreground: switch tab during the glow; the 4 s timer pauses.
- [ ] Reduced motion: glides still occur (shorter).
- [ ] Browsers: Chrome desktop, Chrome Android, Safari iPhone/iPad.

PR [#141](https://github.com/BielinskiLukasz/child-page/pull/141) reports a stub-DOM simulation that dragged every shape onto its outline over 6 pictures (4, 4, 4, 9, 9, 9 items, colours unique per picture) and states that portrait and landscape visuals were not device-tested. PR [#41](https://github.com/BielinskiLukasz/child-page/pull/41) reports a Node DOM-stub check of the original version.

## 18. Known limitations and open issues

**Confirmed**

- Tap-to-select works only from the keyboard; mouse and touch require dragging.
- All shapes are rebuilt (DOM replaced) at the start of each picture; there is no transition between pictures.
- 3x3 is the maximum; there is no further progression.
- `container.style.display` is set and not restored.
- No automated tests.

**Requires verification**

- Overlap of shapes on very small screens when the cell size is below 56 px.
- Visual quality of portrait and landscape layouts on devices (not device-tested in PR #141).

## 19. Planned improvements

`None currently planned`.

## 20. Related activities and reusable components

- Other matching or shape activities: [Rysuj Kształty](rysuj-ksztalty.md), [Wzorki](wzorki.md), [Puzzle](puzzle.md), [Cienie](cienie.md), [Kolorowe Kubeczki](kolorowe-kubeczki.md).
- Shared helper: [`js/random.js`](../../js/random.js) (`Rand.pick`, `Rand.shuffle`). The activity does not use `js/animals.js`.

## 21. Change history

- Issue [#33](https://github.com/BielinskiLukasz/child-page/issues/33) / PR [#41](https://github.com/BielinskiLukasz/child-page/pull/41): initial activity (3 shapes).
- Issue [#66](https://github.com/BielinskiLukasz/child-page/issues/66) / PR [#68](https://github.com/BielinskiLukasz/child-page/pull/68): 9 shapes in two 3x3 grids, stacked in portrait and side by side in landscape.
- Issue [#115](https://github.com/BielinskiLukasz/child-page/issues/115) / PR [#141](https://github.com/BielinskiLukasz/child-page/pull/141): random shapes and colours per picture and 2x2 to 3x3 progression.
