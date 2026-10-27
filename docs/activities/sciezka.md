# Ścieżka

> Documents the current implementation on `main`. Shared platform behaviour (no sound, global reduced-motion rule, menu configuration, playtime, absence of automated tests, analytics status) is described in [README.md](README.md#shared-platform-behaviour) and is not repeated here.

## 1. Overview

| Property | Value |
|---|---|
| Display name | Ścieżka |
| Activity ID | `sciezka` (`js/activities.js`) |
| Description | A wide curvy path on a meadow. The child drags a finger along the path and a small figure (snail, car, ladybird or bee) follows slowly to a goal (flower or house). If the finger leaves the path or lifts, the figure waits. |
| Category | Coordination (tracing a path) |
| Interaction type | Drag along a path; keyboard alternative (arrows, Enter, Space) |
| Status | Implemented; enabled by default in the menu |
| Source | [`js/sciezka.js`](../../js/sciezka.js), CSS prefix `sc-` in [`css/style.css`](../../css/style.css) |

## 2. Business purpose

A forgiving tracing activity: the path is wide (68 units), the figure only moves forward at a gentle capped speed, and leaving the path costs nothing. It trains following a line with a finger without any failure state, and complements the free-form drawing activities with a guided path.

## 3. Activity flow

1. The child opens the tile; the first path (landscape or portrait, depending on the screen) is drawn immediately with the snail at the start and a pink flower at the goal.
2. The child puts a finger on the path (or a mouse button down) near the figure's side of the path and drags along it.
3. The figure moves along the path toward the finger at a capped speed (the whole path takes about 7 s) and leaves a pink trail behind it.
4. If the finger moves off the path or lifts, the figure stops and waits; touching the path again continues.
5. At the goal a soft glow shows for 3 s (0.6 s ramps). About 4 s later the scene fades out (0.9 s) and the next path with another figure and goal fades in (0.9 s).
6. The four paths repeat in a fixed cycle: snail to pink flower, car to house, ladybird to daisy, bee to blue flower, then again.
7. There is no end screen. The child leaves with the Back button.

## 4. Rules and behavior

| Rule | Value |
|---|---|
| Path width drawn | 68 units (`PATH_W`), plus a 10-unit edge |
| Touch tolerance | `PATH_W / 2 + 24` = 58 units from the path centreline (`TOL`) |
| Forward window | A touch only counts if its nearest path point lies between the figure's position and half the path ahead (`WINDOW = 0.5` of the length) |
| Speed | Path length divided by `CROSS` = 7 s, so about 7 s for the whole path regardless of size |
| Backwards movement | Never: the target is `max(p, nearest)`; the figure does not return |
| Starting a drag | Must begin within tolerance of the allowed path stretch; otherwise ignored (no capture) |
| Finger off path / lifted | Target set to the current position; the figure stops |
| Keyboard step | Each arrow key, Enter or Space advances the target by 7% (`KEY_STEP`) of the path length; movement stays at the capped speed |
| Glow at goal | 3 s (`GLOW`) |
| Wait | 4 s (`WAIT`) |
| Fade | 0.9 s out, 0.9 s in (`FADE`) |
| Input while changing scene | ignored (phase other than `play`) |

Paths are defined as 8, 8, 6 and 7 control points in a landscape unit square and sampled by a Catmull-Rom spline into a dense polyline (16 steps per segment). Portrait uses the same shape rotated a quarter turn. The figure faces the direction of travel (it flips horizontally when the local direction is clearly left or right).

The pairs (`FIGURES`, `GOALS`, `LABELS`): Ślimaczek and pink flower; Samochodzik and house; Biedronka (coral, not red) and yellow daisy; Pszczółka and blue flower.

## 5. Educational and developmental benefits

**Intended design benefits**: hand-eye coordination and fine motor control while tracing, attention to a moving figure, calm cause and effect, perseverance without penalty.

**Directly observable behavior**
- The figure follows only while the finger is on the path, and only forward.
- The path width is 68 units, with an extra 24 units of tolerance.
- A pink trail fills along the path behind the figure.

**Requires professional or research-based validation**
- Whether tracing the path improves fine motor skills.
- Whether the 7 s crossing time is appropriate for different children.

## 6. Accessibility and usability

- **Input:** touch, mouse, stylus (pointer events with capture); keyboard: the board is focusable (`tabindex="0"`, `role="application"`) and responds to arrow keys, Enter and Space. The board's label says "Ścieżka: przeciągnij palcem po ścieżce albo naciskaj strzałki, Enter lub spację". Focus outline 4px.
- **`touch-action: none`** on the board so dragging does not scroll the page.
- **Target size:** the path is a large band (68 units of a 400-unit-wide board, about 17% of the board width).
- **Orientation:** a 4:3 board in landscape and a 3:4 board in portrait; the path shape is rotated for portrait.
- **Colour:** the path is a light band on green; the figure's direction and the trail give non-colour cues; goals differ in shape (flower, house).
- **Reading:** none.
- **Sound:** none.
- **Reduced motion:** the figure and the fades are driven by a `requestAnimationFrame` loop rather than CSS, so they still run under the global rule. The activity does not read `prefers-reduced-motion`; the figure's speed is the same.
- **Limitations:** progress along the path is not announced to assistive technology (the board only has a static label and a `data-figure` attribute); a drag requires a pointing device that can follow a curve.

## 7. Risks and limitations

- Tracing a curve is demanding for the youngest children; there is no automatic assist other than the wide tolerance and the keyboard alternative.
- The same four paths are always shown in the same order, so the activity repeats after four rounds.
- Rotating the device during play rebuilds the scene and cancels any active drag (section 16).
- No ending; the cycle continues indefinitely.
- Privacy: nothing is stored or transmitted.

## 8. Configuration

No external configuration; constants live in `js/sciezka.js`.

| Name | Purpose | Type | Default | Changeable without code change? |
|---|---|---|---|---|
| `PATH_W` | Path width (units) | number | 68 | No |
| `TOL` | Touch tolerance (units) | number | 58 | No |
| `WINDOW` | Forward window (fraction of path) | number | 0.5 | No |
| `KEY_STEP` | Keyboard step (fraction of path) | number | 0.07 | No |
| `CROSS` | Seconds to cross the path at full speed | number | 7 | No |
| `GLOW`, `WAIT`, `FADE` | Goal glow, wait and fade (s) | numbers | 3, 4, 0.9 | No |
| `PATHS` | Four control-point lists | array | see source | No |
| `FIGURES`, `GOALS`, `LABELS` | Inline SVG figures, goals and names | arrays | 4 each | No |

## 9. Assets

No external asset files. The figures and goals are inline SVG strings in `js/sciezka.js` (drawn around the origin and translated and scaled by 0.85 at runtime); the meadow, sun, path, trail and glow are generated SVG elements. No fonts or audio.

## 10. Randomization and variants

Nothing is randomized. The four paths cycle in a fixed order starting with path 1 on every launch (`si % 4`). The figure and goal are tied to the path index.

## 11. Progression and difficulty

No levels or difficulty changes; the four paths differ in shape only. The cycle repeats and nothing is persisted.

## 12. Completion and feedback

- **Completion:** the figure reaches the goal (arc length at the end of the path).
- **Feedback:** the pink trail along the path, the figure's movement, a soft yellow glow around the goal for 3 s.
- **Failure/retry:** none; leaving the path just pauses the figure.
- **After completion:** the next path loads automatically after the wait; no sound.

## 13. Analytics and metrics

This activity reports to the shared on-device module `js/analytics.js` (`window.Analytics`) through the app shell only: `js/app.js` records the activity start and end, and the module counts touches inside the stage. The activity file itself calls no `Analytics` function. Recorded for it: starts, active time, replays (re-opening in the same session), quick exits (within 10 s) and touches. It is open-ended, so no completion, level or exit-before-completion is defined for it. Data stays on the device as anonymous daily aggregates; see [README.md](README.md#analytics-status).

## 14. Technical implementation

- **Entry point:** IIFE in [`js/sciezka.js`](../../js/sciezka.js) overriding `mount` for `sciezka`.
- **Rendering:** DOM and SVG: a `.sc-board` (focusable) rebuilt by `build()` with one SVG (path layers, trail, glow, goal, figure).
- **Geometry:** `geometry()` maps control points to board units (400x300 landscape, 300x400 portrait), `sample()` builds a Catmull-Rom polyline with cumulative lengths, `at()` returns a position at an arc length (binary search), `nearest()` returns the arc length of the nearest path point within `TOL` inside a range.
- **State:** `p` (current arc length), `target`, `phase` (`play`, `glow`, `wait`, `out`, `in`), `pid` (active pointer), `si` (path index).
- **Animation:** one `requestAnimationFrame` loop `frame()` with capped dt; moves `p` toward `target` at `len / CROSS`; stops when idle or hidden.
- **Events:** pointer events on the board with pointer capture, `keydown`, `visibilitychange`, `resize`, `orientationchange`.
- **Cleanup:** removes the listeners, cancels the frame and removes the root.
- **Shared helpers:** none (`Rand` and `Animals` are not used).

## 15. Responsive layout and coordinate system

- Board: landscape `aspect-ratio: 4 / 3`; portrait (`.portrait`, set when the container is taller than wide) `aspect-ratio: 3 / 4`; width `min(100%, (100dvh - safe areas - 64px) * ratio)`, with 56px top padding.
- SVG `viewBox` is `0 0 400 300` (landscape) or `0 0 300 400` (portrait), so path, trail, goal, figure and glow share one coordinate space. Pointer coordinates are converted with `toBoard()` using the board's bounding rectangle.
- Portrait mapping: `x = p[1] * W`, `y = (1 - p[0]) * H` of the landscape control points.
- Orientation change: `onResize` rebuilds the scene only when the orientation flips, keeping the progress fraction of the current path.

## 16. Error and edge-case handling

- **Finger leaves the path or lifts:** the target is reset to the current position; the figure waits.
- **Pointer cancel / lost capture:** same as release.
- **Orientation change during a drag:** `build(true)` resets the pointer id, so the drag is dropped and the child must touch again; during the glow it also resets the glow.
- **Backgrounding:** loop cancelled while hidden and restarted on return.
- **Second finger:** only the first pointer is tracked (`pid`).
- **Unhandled:** the reduced-motion preference is not used; no handling for a missing `ACTIVITIES` entry other than skipping the override.

## 17. Testing

There are no automated tests. Manual scenarios to perform:

- [ ] Drag along path 1 from start to goal: the figure follows, the trail fills, the glow shows at the goal, and path 2 appears about 4 s later.
- [ ] Start a drag away from the path: nothing moves.
- [ ] Drag off the path mid-way and lift: the figure waits; touching the path ahead of it continues.
- [ ] Try to drag backwards: the figure does not go back.
- [ ] Try to jump to the far end of the path: the figure still moves at the capped speed and only a touch within the first half of the remaining path counts.
- [ ] Keyboard: Tab to the board; arrows, Enter or Space move the figure in steps of about 7%.
- [ ] Play through all four paths and confirm the figure and goal pairs and that the cycle repeats.
- [ ] Portrait and landscape; rotate mid-path (progress kept, drag dropped).
- [ ] Touch (phone and tablet), mouse and stylus.
- [ ] Switch tab during a drag and return.
- [ ] Reduced motion on: the figure still moves and fades still run.
- [ ] Browsers required by the README: Chrome desktop, Chrome Android, Safari iPhone/iPad.

PR [#69](https://github.com/BielinskiLukasz/child-page/pull/69) reports `node --check`, a Node check that all four paths in both orientations have at least 83 units of centre clearance (no self-overlap, inside the board), and a stub-DOM run (off-path drag leaves the figure waiting, keyboard movement at the capped speed, goal reached in about 7 s, next path loads); it lists manual tests (touch/mouse/stylus, rotation, reduced motion, playtime wind-down, offline) as pending.

## 18. Known limitations and open issues

**Confirmed**
- No automated tests; manual device tests were pending in PR #69.
- Fixed path order and no randomization.
- Rotation during the glow resets the glow and any drag.
- Progress is not announced to assistive technology.

**Requires verification**
- Whether the 58-unit tolerance is comfortable for small fingers on phone-sized boards.
- Behaviour of the first-half forward window if a child lifts and re-starts far ahead.

No open GitHub issue is specific to this activity.

## 19. Planned improvements

None currently planned.

## 20. Related activities and reusable components

- Same scene pattern (single rAF loop, glow, wait, cross-fade): [Policz Razem](policz-razem.md), [Co nie Pasuje?](co-nie-pasuje.md), [Wzorki](wzorki.md).
- Related interaction (following a shape with a finger): [Rysuj Kształty](rysuj-ksztalty.md).
- Shared helpers `js/random.js` and `js/animals.js` are not used.

## 21. Change history

- Issue [#48](https://github.com/BielinskiLukasz/child-page/issues/48) / PR [#69](https://github.com/BielinskiLukasz/child-page/pull/69): activity added.
