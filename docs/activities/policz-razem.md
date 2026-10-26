# Policz Razem

> Documents the current implementation on `main`. Shared platform behaviour (no sound, global reduced-motion rule, menu configuration, playtime, absence of automated tests, analytics status) is described in [README.md](README.md#shared-platform-behaviour) and is not repeated here.

## 1. Overview

| Property | Value |
|---|---|
| Display name | Policz Razem |
| Activity ID | `policz-razem` (`js/activities.js`) |
| Description | A counting scene: round 1 shows one friendly object, round 2 shows two, up to ten. Touching an object makes it bounce once, adds a dot to a counting row and shows the numeral for the count so far. |
| Category | Counting |
| Interaction type | Tap (single touch or click) |
| Status | Implemented; enabled by default in the menu (no `defaultOff`) |
| Source | [`js/policz-razem.js`](../../js/policz-razem.js), CSS prefix `pr-` in [`css/style.css`](../../css/style.css) |

## 2. Business purpose

The activity gives a young child a simple way to connect touching one object at a time with a growing number and with a row of dots, using pictures instead of text. It is the only activity on `main` whose central idea is one-to-one counting; most others are open-ended play or matching. Difficulty grows gently inside the activity (1 to 10 objects) without any scoring.

## 3. Activity flow

1. The child opens the tile (hash `#policz-razem`); `mount` builds round 1 immediately (no fade-in on launch).
2. One object of a randomly chosen kind (apple, duck, flower or fish) stands on a meadow scene. An empty counting row of 10 outlined circles is at the bottom left; the numeral area at the bottom right is empty.
3. The child touches an object.
4. The object bounces once, the next dot in the row fills in, and the numeral crossfades to the new count.
5. When every object has been touched once, the group glows for about 2 s. This is the completion state of a round.
6. About 4 s after the glow, the scene fades out (0.9 s) and the next round fades in (0.9 s) with one more object and, usually, another kind.
7. After round 10 the sequence restarts at round 1 with a new kind. There is no end screen and no manual restart; leaving and re-entering the activity always restarts at round 1.
8. The child leaves with the Back button (see the shared platform document).

## 4. Rules and behavior

| Rule | Value |
|---|---|
| Rounds | 10 (`ROUNDS`); round number is `si % 10 + 1` |
| Objects per round | Equal to the round number (1 to 10) |
| Kinds | 4: Jabłko, Kaczuszka, Kwiatek, Rybka (`KINDS`); one kind per round |
| Touching an uncounted object | Counts it, bounces it (0.7 s), fills a dot (0.4 s), crossfades the numeral (0.5 s) |
| Touching an already counted object | Only bounces again; the count does not change |
| Touches accepted in phases | `play`, `glow`, `wait` (so bouncing is still possible during the glow and the 4 s wait) |
| Touches ignored in phases | `out`, `in` (while the scene is fading) |
| Completion glow | 2 s (`GLOW`), 0.5 s ramps in and out |
| Wait before next round | 4 s (`WAIT`) |
| Cross-fade between rounds | 0.9 s out and 0.9 s in (`FADE`) |
| Frame time cap | 0.05 s (`MAXDT`) |

There are no wrong answers: the only possible actions are to touch an object (counted or not) or to do nothing. The activity never advances by itself while the child has not counted all objects. Nothing is scored, stored or announced.

Object layout per count (`ROWS`, objects per grid row): 1:[1], 2:[2], 3:[3], 4:[2,2], 5:[3,2], 6:[3,3], 7:[4,3], 8:[4,4], 9:[3,3,3], 10:[4,3,3]. Object width is 21% of the board for counts 1-3, 19% for 4-6 and 16% for 7-10; rows are centred in the top 80% of the board, above the counting row, so objects sit on a grid and cannot overlap.

## 5. Educational and developmental benefits

**Intended design benefits** (from the design comments and README): one-to-one counting, linking a count to a numeral, calm cause and effect, and independent play without text.

**Directly observable behavior**
- Each touch changes exactly one thing: one dot fills and the numeral moves to the next value.
- The numeral shown always equals the number of objects touched so far.
- The number of objects grows by one per round up to ten.
- Completion is shown with a soft glow rather than a score.

**Requires professional or research-based validation**
- Whether the activity improves counting skills or number understanding.
- Whether 10 objects and the 4-6 s between rounds are suitable for a given child.

## 6. Accessibility and usability

- **Input:** touch, mouse and stylus via `click` on `<button>` elements; objects are keyboard-focusable (Tab, Enter or Space) and have a visible 4px focus outline (`.pr-btn:focus-visible`). Each button has an `aria-label` such as "Jabłko 3". `touch-action: manipulation` is set on the buttons.
- **Target size:** 21% / 19% / 16% of the board width with `min-width` and `min-height` of 56px, so even on a narrow phone each target is at least 56 x 56px.
- **Orientation:** the board is a fixed 4:3 box that scales to the available width or height, so portrait and landscape both work; in portrait the board is simply smaller.
- **Colour:** the four kinds differ in silhouette as well as colour. Counting is carried by the number of dots and the numeral, not by colour.
- **Reading:** the numerals 1-10 are the only text. Object labels are only for assistive technology.
- **Sound:** none.
- **Motion:** gentle: a 10-unit bounce and fades. See "Reduced motion" below.
- **Reduced motion:** every change is driven from one `requestAnimationFrame` loop, not CSS animation or transition, so bounce, dot fill, numeral crossfade, glow and scene fades still run when the global `prefers-reduced-motion` rule is active. The activity does not read the media query and has no reduced variant.
- **Limitations:** the numeral and dots are not exposed to assistive technology (the SVG row is `aria-hidden`); the count is not announced.

## 7. Risks and limitations

- Ten objects on a very small screen are close to the 56px minimum target size (confirmed from CSS; see section 15).
- Round 1 offers a single object, so a child may touch it, wait and see the next round fade in without any further action; this is intended.
- No explicit ending: the sequence loops indefinitely (1 to 10 and again).
- Rapid repeated touches on the same object restart its bounce; there is no debounce (harmless).
- Privacy: no data leaves the device and nothing is stored.

## 8. Configuration

The activity has no external configuration; all tunable values are constants inside `js/policz-razem.js` and require a code change.

| Name | Purpose | Type | Default | Location | Changeable without code change? | Fallback |
|---|---|---|---|---|---|---|
| `ROUNDS` | Number of rounds before the sequence restarts | number | 10 | top of IIFE | No | None; also sizes the counting row |
| `BOUNCE` | Object bounce duration (s) | number | 0.7 | same | No | None |
| `DOT` | Dot fill duration (s) | number | 0.4 | same | No | None |
| `NUM` | Numeral crossfade duration (s) | number | 0.5 | same | No | None |
| `GLOW` | Completion glow duration (s) | number | 2 | same | No | None |
| `WAIT` | Pause after glow before the next round (s) | number | 4 | same | No | None |
| `FADE` | Scene fade out and in (s each) | number | 0.9 | same | No | None |
| `MAXDT` | Maximum frame step (s) | number | 0.05 | same | No | None |
| `KINDS` | Pool of object kinds | array of `{label, svg}` | 4 entries | same | No | None |
| `ROWS`, `layout()` | Grid rows and object size per count | object / function | see section 4 | same | No | None |

## 9. Assets

No external asset files. Everything is inline SVG in `js/policz-razem.js`: four object drawings (`KINDS[].svg`, 100x100 viewBox each with a soft ground shadow), a shared glow circle (`GLOWC`), a scenery backdrop (`BACKDROP`, 400x300 sky, hills and ground) and the counting row, which is generated in `build()`. No fonts are loaded; the numeral uses the page font at `font-size` 96 in the 400x300 coordinate space.

## 10. Randomization and variants

- **What is random:** only the object kind, via `Rand.pickOne(KINDS, 'policz-razem')` once per round.
- **Pool size:** 4 kinds.
- **Repetition:** `Rand.pickOne` never returns the kind used last time for the same key within the current page session, so two consecutive rounds never use the same kind. The memory is in-process only and is not stored.
- **Not random:** the object count (strictly 1 to 10), grid layout and object positions are fixed per count.
- **Empty pool:** not applicable (the pool is a constant of 4).

## 11. Progression and difficulty

Difficulty is the number of objects: round `n` shows `n` objects (1 to 10). The step is automatic after each completed round; there are no levels, scores or choice of difficulty. After round 10 the sequence wraps to round 1. Progress is not persisted: every launch starts at round 1.

## 12. Completion and feedback

- **Completion:** a round is complete when every object has been touched at least once.
- **Feedback during play:** per-object bounce, dot fill and numeral crossfade.
- **Completion feedback:** a soft yellow glow behind the objects for 2 s, then the numeral and dots remain visible for about 4 s.
- **Failure/retry:** none; no input is invalid.
- **After completion:** the next round starts automatically after the wait and fade; there is no completion screen and no sound.

## 13. Analytics and metrics

This activity reports to the shared on-device module `js/analytics.js` (`window.Analytics`). `js/app.js` records the activity start and end and the module counts touches inside the stage; `js/policz-razem.js` calls `levelStart(n)` when a round starts (n = number of objects) and `levelComplete(count)` plus `complete(count)` when the last object is counted. Recorded: starts, active time, replays, quick exits, touches, completions (a completion is a counted round), exits before completion and the highest count reached. Data stays on the device as anonymous daily aggregates; see [README.md](README.md#analytics-status).

## 14. Technical implementation

- **Entry point:** an IIFE in [`js/policz-razem.js`](../../js/policz-razem.js) that replaces `mount` of the registry entry whose `id` is `policz-razem`; the script tag is in `index.html` before `js/app.js`.
- **Rendering:** DOM plus SVG. One `.pr` root with a `.pr-board` (backdrop SVG and `.pr-layer`). Per round, `build()` recreates the layer: one counting-row SVG (10 outline circles, 10 dot circles, two stacked numeral `<text>` elements for the crossfade) and up to 10 `<button class="pr-btn">` elements each holding an SVG.
- **State machine:** variable `phase` is `play`, `glow`, `wait`, `out` or `in`. Counters: `count`, `shown`, `prevShown`, per object `{counted, t}`, per dot `{t, on}`.
- **Animation:** a single `requestAnimationFrame` loop (`frame`) with capped `dt`. It stops when idle (`busy` false), pauses while `document.hidden` and is restarted by `wake()` on touch or on `visibilitychange`.
- **Events:** `click` on each object button; `visibilitychange` on `document`.
- **Randomization:** `Rand.pickOne` from [`js/random.js`](../../js/random.js).
- **Persistence:** none. **Analytics:** `Analytics.levelStart` / `levelComplete` / `complete`.
- **Cleanup:** the returned function removes the `visibilitychange` listener, cancels the pending frame and removes the root element.

## 15. Responsive layout and coordinate system

- The board is `aspect-ratio: 4 / 3` with `width: min(100%, (100dvh - safe areas - 64px) * 4 / 3)`, centred in a container padded by 56px at the top (room for the Back button) and 8px elsewhere, plus safe-area insets.
- The backdrop and counting row are SVGs with `viewBox="0 0 400 300"` and `preserveAspectRatio="none"`; since the board keeps 4:3 they are not distorted.
- Objects are absolutely positioned buttons using percentages of the board (`left %`, `top %`, `width %`, from `layout()`), with `min-width`/`min-height` 56px; height equals width (`aspect-ratio: 1`).
- Counting row circles sit at `cy = 262` with `cx = 20 + i * 26` (units of the 400x300 space); the numeral is at x 340, y 276.
- Resize and orientation change are handled by CSS alone (percentages); there is no resize listener. On very small boards the 56px minimum may exceed the percentage width (16% of a 300px board is 48px), in which case targets are slightly larger than the drawing grid assumes.

## 16. Error and edge-case handling

- **Missing assets:** not applicable (inline SVG).
- **Rapid input:** repeated touches only restart the bounce; counting an object twice is impossible. Touches during the `out`/`in` fade are ignored.
- **Backgrounding:** the loop is cancelled while the tab is hidden and resumes (with `last` reset, so no large time jump) when visible.
- **Resize/orientation:** CSS-only, see section 15.
- **Touch cancellation:** not applicable; the activity uses `click` only.
- **Leaving during an animation:** cleanup cancels the frame and removes the DOM.
- **Unhandled:** no explicit handling of an empty `KINDS` or missing `Rand` (neither occurs with the shipped files).

## 17. Testing

There are no automated tests; see [the shared note](README.md#shared-platform-behaviour). Manual scenarios to perform (none of them are recorded as done in this document):

- [ ] Normal play: round 1 shows 1 object; touching it fills the first dot and shows "1".
- [ ] Round 2 to 10: the object count equals the round number and the numeral equals the objects touched.
- [ ] Completion: after the last object, the glow appears for about 2 s, then the next round fades in about 4 s later.
- [ ] Incorrect/repeat interaction: touching a counted object only bounces it; the count and dots do not change.
- [ ] Touching during the fade between rounds does nothing.
- [ ] Restart: after round 10 the next round has 1 object; leaving and re-entering the activity starts at 1.
- [ ] Randomization: over several rounds all four kinds appear and the same kind never appears twice in a row.
- [ ] Round 10 on a small phone (for example 320x568) in portrait: all 10 objects are visible, do not overlap and are easy to touch.
- [ ] Portrait and landscape, and rotation while a round is in progress.
- [ ] Touch (phone/tablet), mouse and keyboard (Tab, Enter, Space).
- [ ] Switch tab or app during the glow and return: the scene continues without jumping.
- [ ] Reduced motion enabled in the OS: bounce, dots and fades still work.
- [ ] Browsers required by the project README: Chrome desktop, Chrome Android, Safari iPhone/iPad.

Evidence in the repository history: PR [#67](https://github.com/BielinskiLukasz/child-page/pull/67) reports a Node DOM-stub run (double taps, scene cycle) and PR [#140](https://github.com/BielinskiLukasz/child-page/pull/140) reports a Node check that the layout for 1 to 10 has the right object count, stays inside the board and does not overlap. Both state that no real-browser test was done.

## 18. Known limitations and open issues

**Confirmed**
- No automated tests; manual device checks were reported as pending in the PR descriptions.
- The numeral and dot row are not announced to assistive technology.
- `KINDS` contains no-op elements (for example zero-radius circles in the flower drawing); harmless.

**Requires verification**
- Whether round 10 targets remain comfortable on 320px-wide screens (PR #140 asked for a manual check).
- Exact appearance when the board is narrower than about 350px, where the 56px minimum exceeds the 16% width.

No open GitHub issue is specific to this activity.

## 19. Planned improvements

None currently planned.

## 20. Related activities and reusable components

- Shared helper: [`js/random.js`](../../js/random.js) (`Rand.pickOne`). `js/animals.js` is not used.
- Same scene pattern (single rAF loop, glow, wait, cross-fade to next scene, nothing stored): [Co nie Pasuje?](co-nie-pasuje.md), [Ścieżka](sciezka.md), [Wzorki](wzorki.md).

## 21. Change history

- Issue [#46](https://github.com/BielinskiLukasz/child-page/issues/46) / PR [#67](https://github.com/BielinskiLukasz/child-page/pull/67): activity added.
- Commit "allow bounce-only touches during glow/wait" (review suggestion on that work).
- Issue [#116](https://github.com/BielinskiLukasz/child-page/issues/116) / PR [#140](https://github.com/BielinskiLukasz/child-page/pull/140): counting 1 to 10 in progressive rounds with random kind.
