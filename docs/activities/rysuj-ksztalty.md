# Rysuj Kształty

## 1. Overview

| Item | Value |
|---|---|
| Display name | Rysuj Kształty |
| Internal ID | `rysuj-ksztalty` (entry in [`js/activities.js`](../../js/activities.js)) |
| Description | Tracing practice: follow a dotted guide (line, circle, zigzag, cross, wave, spiral) with a finger and a soft coloured line appears along the guide. |
| Category | Drawing (tracing) |
| Interaction type | Trace/drag along a path; keyboard alternative: arrows, Enter or Space move the pen forward |
| CSS prefix | `rk-` |
| Source | [`js/rysuj-ksztalty.js`](../../js/rysuj-ksztalty.js), styles in [`css/style.css`](../../css/style.css) (section after `/* Gdzie jest Piłka? */`, selectors `.rk-*`) |
| Status | Implemented; enabled by default (no `defaultOff`). Listed 31st in the README Activities list. |

## 2. Business purpose

The activity gives a child a forgiving first experience of following a line, which is a pre-writing movement, without the pressure of exactness: the line only grows where the finger stays near the guide, and nothing negative happens otherwise. It complements the free finger painting of [Malowanie Światłem](malowanie-swiatlem.md) (glowing colours that fade away) with a guided task. The six shapes progress roughly from simple to harder (straight line to spiral).

## 3. Activity flow

1. The child opens the activity (`#rysuj-ksztalty`); shape 1 (a horizontal line) is loaded.
2. A square pale board shows a dotted guide and a pen ring (44 px circle) at the start of the guide with an arrow showing the direction.
3. The child touches near the pen ring (within 52 px) and drags along the guide.
4. A thick soft line in gently changing colours appears along the guide as long as the finger stays within about 40 px of the guide and moves forward.
5. If the child lifts the finger, the line stays; touching near the end of the line continues from there.
6. When the whole guide is traced (all strokes), the board glows for about 3 s.
7. About 7 s after completion the board fades out (0.8 s), the next shape loads and fades in (0.8 s). After the spiral the cycle returns to the line.
8. The child leaves with the Back button (see [shared behaviour](README.md#shared-platform-behaviour)).

## 4. Rules and behavior

Shapes (unit-square coordinates, `y` down), always in this order:

| # | Label (`aria`) | Strokes | Definition |
|---|---|---|---|
| 1 | linia | 1 | horizontal line from (0.1, 0.5) to (0.9, 0.5) |
| 2 | kółko | 1 | circle, centre (0.5, 0.5), radius 0.38, 72 segments, starting at the top and running clockwise |
| 3 | zygzak | 1 | 6 points: (0.1, 0.72), (0.26, 0.28), (0.42, 0.72), (0.58, 0.28), (0.74, 0.72), (0.9, 0.28) |
| 4 | krzyżyk | 2 | vertical (0.5, 0.1) to (0.5, 0.9), then horizontal (0.1, 0.5) to (0.9, 0.5) |
| 5 | fala | 1 | sine wave, 2 periods, amplitude 0.2, x from 0.08 to 0.92, 60 segments |
| 6 | spirala | 1 | outward spiral, 2 turns, radius 0.05 to 0.42, 140 segments, starting at the top, clockwise |

Tracing rules (constants at the top of the file):

| Rule | Value |
|---|---|
| Start/continue touch distance (`START_PX`) | the finger must start within 52 px of the pen |
| Distance from the guide (`NEAR_PX`) | the finger must be within 40 px of the guide to extend the line |
| Direction | only points ahead of the current progress count; movement against the direction, or far from the guide, does not extend the line (no feedback) |
| Reach per update (`MAX_JUMP`) | up to 0.35 of the total shape length ahead of the current progress |
| Fast drags | the finger's path between two events is walked in steps of about 8 px, so quick movements still follow the guide |
| Line width | `max(14, B * 0.05)` px where `B` is the board size |
| Colour | five pastel colours (`PALETTE`) interpolated along the whole shape length |
| Multi-stroke | the cross has 2 strokes; when the first is complete the pen jumps to the start of the second |
| Completion glow / next shape | `GLOW_S = 3` s; `NEXT_AT_S = 7` s; `FADE_S = 0.8` s each way |
| Keyboard step | `STEP = 0.03` of the total length per key press |

Input is ignored during the glow and fade phases (`phase !== 'play'`).

## 5. Educational and developmental benefits

**Intended design benefits** (from the README and code comments, not measured)

- Practice in following a line with a finger (hand-eye coordination, pre-writing movements).
- Concentration on a simple, repeatable task.
- Familiarity with basic shapes and curves.

**Directly observable behavior**

- The line is drawn only along the guide, so the result always looks neat.
- Movement away from the guide just does nothing; there is no error state.
- Shapes grow in complexity from a line to a spiral.

**Requires professional or research-based validation**

- Any link to later handwriting ability or fine-motor development. The activity makes no measurement.

## 6. Accessibility and usability

- **Input:** touch, mouse and stylus via pointer events with pointer capture; only the primary pointer draws at a time (`drawing` holds one pointer id). Keyboard: the board is focusable (`tabindex="0"`, `role="application"`) and ArrowRight, ArrowDown, Enter and Space advance the pen along the guide; ArrowLeft and ArrowUp are not handled. The `aria-label` names the shape, for example `Rysowanie po kropkach: kółko. Strzałki, Enter lub spacja prowadzą pisak wzdłuż linii.`
- **Target size:** the pen ring is 44 x 44 px (CSS), but the finger may start within 52 px of the pen, so the effective start area is larger; the line is at least 14 px wide.
- **Orientation:** the board is a square of side `B = max(160, min(fieldWidth, fieldHeight, 720))`, centred; layout is recomputed on `resize` and `orientationchange` and the drawn progress is redrawn.
- **Colour:** the guide is dotted lilac on a pale board; the drawn colour is not needed to understand the task. The arrow at the pen shows the direction.
- **Sound:** none. **Reading:** not required.
- **Reduced motion:** the glow and fades are driven by the rAF loop and so still run under `prefers-reduced-motion`; they are soft opacity and glow changes (no fast movement).
- **Touch behaviour:** `touch-action: none` on the board prevents scrolling while drawing.
- **Focus:** 4 px box-shadow `#8f7fd1` on the focused board.
- **Limitations:** a child needs to start near the pen; precise tracing of the spiral and zigzag may be hard for the youngest users (`Requires verification`).

## 7. Risks and limitations

- Tracing requires some fine motor control; the spiral (140 segments, 2 turns) may be frustrating.
- A finger covering the guide can hide the path; the dotted guide is thin (`stroke-width 0.012` of the board).
- If a child draws far from the guide nothing appears and no hint is given.
- The order of shapes is fixed and always starts with the line.
- No personal data is collected; the drawing is not saved.

## 8. Configuration

No external configuration; constants in [`js/rysuj-ksztalty.js`](../../js/rysuj-ksztalty.js):

| Name | Purpose | Type | Default |
|---|---|---|---|
| `NEAR_PX` | Maximum finger distance from the guide | px | `40` |
| `START_PX` | Maximum distance from the pen to start | px | `52` |
| `MAX_JUMP` | Reach ahead, fraction of shape length | number | `0.35` |
| `STEP` | Keyboard step, fraction of shape length | number | `0.03` |
| `GLOW_S`, `NEXT_AT_S`, `FADE_S` | Completion timing | s | `3`, `7`, `0.8` |
| `PALETTE` | Five RGB colours | array | pink, yellow, green, blue, lilac |
| `SHAPES` | Shape definitions (order is the sequence) | array | 6 shapes |
| Board size | 160 to 720 px | px | `layout` |
| Device pixel ratio | capped at 2 | number | `layout` |

No fallback exists because nothing is read from outside.

## 9. Assets

No external asset files. The guide is an inline SVG (`viewBox 0 0 1 1`, `preserveAspectRatio="none"`) with dotted round-capped paths (`#a99cc4`); the drawing is a 2D `<canvas>`; the pen is a CSS-styled `div`. The menu icon is inline SVG in `js/activities.js`. No unused assets.

## 10. Randomization and variants

Nothing is randomized: the six shapes always appear in the same order (line, circle, zigzag, cross, wave, spiral, then the line again) and a launch always starts with the line. The colour of the line depends only on the position along the shape.

## 11. Progression and difficulty

- There is no adaptive difficulty. The sequence of shapes is fixed and loops (`load(idx + 1)` with wrap-around).
- The shapes are roughly ordered from easy to hard, but the code does not define difficulty levels.
- Progress is not stored; every launch starts with the line.

## 12. Completion and feedback

- **Completion:** the last stroke reaches its end (`complete()`).
- **Feedback during play:** the line grows with the finger; the pen ring moves to the end of the line.
- **Feedback on completion:** the board glows (`drop-shadow` in `#ffe08a`) for about 3 s.
- **Afterwards:** the next shape fades in automatically after the fade-out.
- **Failure feedback:** none (movement off the guide is simply ignored).
- **Sound:** none.

## 13. Analytics and metrics

On `main` this activity emits **no** analytics events; see [Analytics status](README.md#analytics-status). No metric is supported.

*Not implemented, for planning only:* `activity_complete` (or `level_complete`) per traced shape, with the shape label as a non-personal property, plus active time and an `interaction` count would be meaningful. Because shapes loop endlessly, the best signals are active time and shapes completed per visit; a completion rate would be of limited use. No data that could identify a child should be collected.

## 14. Technical implementation

- **Entry point:** `mount(container)` in [`js/rysuj-ksztalty.js`](../../js/rysuj-ksztalty.js), registered on the `rysuj-ksztalty` entry; returns a cleanup function.
- **State:** `idx` (shape index), `shape` (prepared with cumulative arc lengths per stroke), `cur` (current stroke), `s` (progress as arc length in unit coordinates), `drawing` (active pointer id), `phase` (`play`, `done`, `out`, `in`), `glow`, `op`.
- **Rendering:** a board `div` holding an SVG guide, a `<canvas>` for the line and the pen `div`. The canvas has a backing size of `B * dpr`; progress is redrawn from `s` and `cur` in `redraw()`, so resize and rotation keep the drawing relative to the guide.
- **Drawing:** done directly in the pointer handlers (`advanceTo`), using short segments of 5 px coloured by `colorAt`. The rAF loop only runs the glow and fade phases and stops when idle.
- **Events:** `pointerdown`, `pointermove`, `pointerup`, `pointercancel`, `lostpointercapture` and `keydown` on the board; `resize`/`orientationchange`; `visibilitychange`.
- **Randomization:** none. **Persistence/analytics:** none.
- **Cleanup:** cancels the frame, removes window/document listeners and the root element.

## 15. Responsive layout and coordinate system

- The field is the screen minus 64 px at the top and 12 px on the other sides (plus safe areas); the board is a centred square of side `B` (160 to 720 px).
- Coordinates: shapes, progress and the guide use the unit square (0 to 1) on both axes; the SVG guide uses `viewBox 0 0 1 1` with `preserveAspectRatio="none"`, the canvas draws at `x * B`, `y * B`, and the pen is placed with percentages. All three share one coordinate space. Pointer positions are converted to unit coordinates through the board rectangle.
- Thresholds (`NEAR_PX`, `START_PX`, line width) are in CSS pixels, so tolerance does not shrink on small boards.
- A past bug where the guide appeared squeezed into the top-left 120 px (global `.stage svg` rule overriding `.rk-guide`) was fixed by prefixing the selector with `.stage` (PR [#155](https://github.com/BielinskiLukasz/child-page/pull/155)).

## 16. Error and edge-case handling

| Case | Behaviour |
|---|---|
| Missing assets | Not applicable. |
| Resize/orientation change | `layout` resizes the canvas and `redraw` rebuilds the line from the stored progress. |
| Fast drag between events | Interpolated in steps of about 8 px. |
| Finger far from the guide or moving backwards | Ignored. |
| Second finger while drawing | Ignored (`drawing !== null`). |
| Touch cancel / lost capture | Ends the stroke; progress is kept; the child can continue near the end of the line. |
| Input during glow/fade | Ignored. |
| Tab hidden | Loop cancelled and restarted; timers use the capped frame step. |
| Canvas unsupported | Not handled (`getContext('2d')` result is used without a check); `Requires verification` on very old browsers. |

## 17. Testing

**Automated tests:** none (see [shared behaviour](README.md#shared-platform-behaviour)). PR [#87](https://github.com/BielinskiLukasz/child-page/pull/87) describes the design and PR [#155](https://github.com/BielinskiLukasz/child-page/pull/155) the layout fix; this document does not re-verify them.

**Manual scenarios (not yet recorded as performed):**

- [ ] Normal: trace the line starting at the pen; the coloured line follows the finger.
- [ ] Completion: finish the shape; the glow lasts about 3 s and the next shape fades in about 7 s after completion.
- [ ] Incorrect interaction: start far from the pen (nothing happens); drag far from the guide or backwards (the line does not extend); lift and continue from the end.
- [ ] Each shape: complete all six (line, circle, zigzag, cross with two strokes, wave, spiral) and confirm the order and the return to the line.
- [ ] Fast drag: swipe quickly along the shape; the line still follows.
- [ ] Restart/randomization: leave and re-open; the line is first again (no randomization).
- [ ] Progression: confirm there is no difficulty change besides the shape order.
- [ ] Portrait and landscape: 320 x 568, 568 x 320, tablet; rotate mid-shape and confirm the drawing stays on the guide.
- [ ] Touch and mouse: finger and mouse drag; Tab to the board and use ArrowRight/ArrowDown/Enter/Space.
- [ ] Background/foreground: hide the tab during the glow.
- [ ] Reduced motion: glow and fades still occur but are soft.
- [ ] Browsers: Chrome desktop, Chrome Android, Safari iPhone/iPad.

## 18. Known limitations and open issues

**Confirmed**

- No automated tests; no analytics on `main`.
- Fixed order, no randomization, no way to choose a shape.
- ArrowLeft/ArrowUp do nothing; there is no way to undo or erase.
- `getContext('2d')` is not checked.

**Requires verification**

- Tracing difficulty of the zigzag and spiral for the youngest children on small phones.

## 19. Planned improvements

None currently planned (no open issue targets this activity).

## 20. Related activities and reusable components

- Related: [Malowanie Światłem](malowanie-swiatlem.md) (free painting with a finger; its line fades away, whereas here the line stays on the guide).
- Shared helpers: none used; the activity uses neither `Rand` nor `Animals`.
- The pattern "state in unit-square coordinates, redraw on resize" is local to this file.

## 21. Change history

- [#65](https://github.com/BielinskiLukasz/child-page/issues/65) / PR [#87](https://github.com/BielinskiLukasz/child-page/pull/87): activity added.
- Merge commits "wider spiral ring pitch" (review suggestion, spiral radius 0.05 to 0.42).
- [#130](https://github.com/BielinskiLukasz/child-page/issues/130) / PR [#155](https://github.com/BielinskiLukasz/child-page/pull/155): guide layout fix (`.stage .rk-guide`).
