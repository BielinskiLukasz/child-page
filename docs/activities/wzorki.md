# Wzorki

> Documents the current implementation on `main`. Shared platform behaviour (no sound, global reduced-motion rule, menu configuration, playtime, absence of automated tests, analytics status) is described in [README.md](README.md#shared-platform-behaviour) and is not repeated here.

## 1. Overview

| Property | Value |
|---|---|
| Display name | Wzorki |
| Activity ID | `wzorki` (`js/activities.js`) |
| Description | A string of beads shows four beads of a simple repeating pattern and an empty slot. Two large beads below are offered; touching the one that continues the pattern glides it into the slot, the other only wobbles. After three correct beads the whole string glows and a new pattern appears. |
| Category | Matching / pattern continuation |
| Interaction type | Tap |
| Status | Implemented; enabled by default in the menu |
| Source | [`js/wzorki.js`](../../js/wzorki.js), CSS prefix `wz-` in [`css/style.css`](../../css/style.css) |

## 2. Business purpose

The activity introduces simple patterns (such as ABAB or AABB) by asking the child to say what comes next, with a free retry on a wrong choice. It is the application's pattern-recognition activity; beads differ by shape and inner mark as well as colour, so the pattern can be followed without relying on colour.

## 3. Activity flow

1. The child opens the tile; the string fades in (0.9 s) with four beads placed and a dashed empty slot after them.
2. After a 0.5 s fade, two large choice beads appear at the bottom.
3. The child touches a choice.
   - Correct: the bead glides (0.8 s, with a small arc) from the choice into the slot, grows or shrinks to the string size and glows; two new choices appear for the next slot.
   - Other: that choice wobbles gently (0.55 s) and stays available.
4. After three correct beads (7 beads on the string) the whole string glows for 2 s.
5. About 4 s later the scene fades out (0.9 s) and a new pattern fades in (0.9 s).
6. There is no end screen; the activity continues with new patterns. The child leaves with the Back button.

## 4. Rules and behavior

| Rule | Value |
|---|---|
| String length | 7 beads (`N`), of which 4 are given (`GIVEN`) and 3 to be placed |
| Bead types | 4 (`TYPES`): Różowe kółko (pink circle with a white dot), Niebieski kwadrat (blue rounded square with two bars), Żółta gwiazdka (yellow star), Zielony romb (green diamond with a white diamond) |
| Pattern sets | 12 (`PATTERNS`), see below |
| Choices | 2 per slot: the correct bead and one different type, chosen at random from the 3 other types |
| Correct side | Random left or right; the same side is never used three times in a row |
| Correct touch | Bead glides 0.8 s (`GLIDE`); glows for 1.4 s decay |
| Wrong touch | Wobble 0.55 s (`WOB`), rotation up to 9 degrees; no change otherwise; unlimited retries |
| Touches accepted | only in phase `play`, once the choices have finished fading in; ignored during glide, glow, fade |
| Completion glow | 2 s (`GLOW`), 0.5 s ramps |
| Wait | 4 s (`WAIT`) |
| Fade | 0.9 s out and 0.9 s in (`FADE`) |

The 12 pattern sets (symbols are bead types repeated across the 7 positions): ABAB, AABAAB, ABCABC, ABBABB, AABB, ABCC, ABCD, AABC, ABBC, ABAC, AAAB, ABCB (as listed in the code, `[0,1]`, `[0,0,1]`, `[0,1,2]`, `[0,1,1]`, `[0,0,1,1]`, `[0,1,2,2]`, `[0,1,2,3]`, `[0,0,1,2]`, `[0,1,1,2]`, `[0,1,0,2]`, `[0,0,0,1]`, `[0,1,2,1]`). The symbols 0 to 3 are always the same bead types (pink circle, blue square, yellow star, green diamond) in every set.

A wrong choice is never a failure; it only wobbles and the right bead remains available.

## 5. Educational and developmental benefits

**Intended design benefits**: noticing repetition and sequence (patterns), visual discrimination of shapes, anticipation ("what comes next"), calm trial and error.

**Directly observable behavior**
- The first four beads of the pattern are shown; the three remaining slots are filled one at a time.
- The two options always differ in both shape and colour.
- A wrong choice does not change the state, so the child can retry.

**Requires professional or research-based validation**
- Whether the activity helps pattern recognition or mathematical readiness.
- Whether four given beads make every pattern unambiguous to a child (for example AAAB with four beads).

## 6. Accessibility and usability

- **Input:** touch, mouse, stylus, keyboard (the two choices are `<button>` elements with a descriptive `aria-label`, for example "Żółta gwiazdka"); 4px focus outline; `touch-action: manipulation`.
- **Target size:** choice buttons are `max(56, min(H * 0.26, W * 0.3, 132))` px square, so at least 56px.
- **Bead size:** string beads are up to 110px; at least 56px in the two-row layout.
- **Orientation:** the layout is computed in pixels for the current field size: a single row of 7 beads when each bead can be at least 62px, otherwise two rows (4 and 3 beads). Choices are always at the bottom, one each side of the centre.
- **Colour:** bead types differ by shape and inner mark as well as colour (stated in the source).
- **Reading:** none required.
- **Sound:** none.
- **Reduced motion:** the glide, wobble, glow and fades are drawn by a `requestAnimationFrame` loop rather than CSS, so they still run under the global rule. The activity does not read `prefers-reduced-motion`.
- **Limitations:** the pattern itself (which beads are on the string) is not described to assistive technology (the string SVG is `aria-hidden`); only the two choices are labelled.

## 7. Risks and limitations

- Some patterns may be ambiguous with only four given beads (for example AAAB or ABAC can be read in more than one way); the intended continuation is fixed by the pattern, which may differ from a child's reading. This is a design property, not a defect in the code.
- The correct choice can appear on either side; the choice buttons are hidden during the fade between rounds, so touches there do nothing.
- No ending; patterns keep coming (the cycle of 12 repeats).
- Privacy: nothing is stored or transmitted.

## 8. Configuration

No external configuration; constants live in `js/wzorki.js`.

| Name | Purpose | Type | Default | Changeable without code change? |
|---|---|---|---|---|
| `N` | Beads on the string | number | 7 | No |
| `GIVEN` | Beads shown at the start | number | 4 | No |
| `GLIDE`, `WOB` | Glide and wobble durations (s) | numbers | 0.8, 0.55 | No |
| `GLOW`, `WAIT`, `FADE` | Completion glow, wait, fade (s) | numbers | 2, 4, 0.9 | No |
| `MAXDT` | Frame cap (s) | number | 0.05 | No |
| `TYPES` | The four bead types (label and SVG) | array | 4 | No |
| `PATTERNS` | The 12 pattern sets | array | see section 4 | No |

## 9. Assets

No external asset files. The four bead drawings are inline SVG strings in `js/wzorki.js` (100x100 viewBox; the star polygon is generated). The string, slot ring, beads, glows and choices are created with `createElementNS`. No fonts or audio.

## 10. Randomization and variants

- **Pattern order:** at launch, and again after every 12 rounds, the indices 0 to 11 are shuffled with `Rand.shuffle`; each pattern set is used once per block of 12 before any repeats. When a new block starts, if its first set equals the last set of the previous block, the first and last entries are swapped, so there are no back-to-back repeats at block boundaries (PR #145 reports a simulation over 36 rounds).
- **Wrong option:** `other = (correct + 1 + floor(random * 3)) % 4`, so it is always a different type; chosen with `Math.random`.
- **Side:** random left/right; after two identical sides in a row the next one is forced to the opposite side (history of the last 3).
- **Persistence:** none; every launch has a fresh order.

## 11. Progression and difficulty

No levels or difficulty changes. Within a round, the child places three beads (the 5th, 6th and 7th). The set of patterns includes simple ones (ABAB) and longer or less regular ones (ABCD, ABAC), but the order is random, not graded. Nothing is persisted.

## 12. Completion and feedback

- **Per bead:** correct bead glides in and glows; wrong choice wobbles.
- **Round completion:** all 7 beads placed; the whole string glows for 2 s.
- **After completion:** the choices are disabled, then a new pattern fades in automatically after the wait and fade. No sound, no scoring.

## 13. Analytics and metrics

On `main` this activity emits **no analytics events**; see [Analytics status](README.md#analytics-status) and open PR [#172](https://github.com/BielinskiLukasz/child-page/pull/172).

Not implemented (for planning only): meaningful signals would be `activity_start` / `activity_end` (active time), an `interaction` count (choice touches, optionally with a correct or wobble flag) and `level_complete` per finished pattern (completed strings). Because the activity loops indefinitely, an overall completion rate would not be meaningful; prefer active time and the number of completed strings. No personal data is needed.

## 14. Technical implementation

- **Entry point:** IIFE in [`js/wzorki.js`](../../js/wzorki.js) overriding `mount` for `wzorki`.
- **Rendering:** one `.wz-field` containing an SVG (`.wz-svg`: two polylines for the string, a dashed ring for the empty slot and 7 bead groups) and two `<button class="wz-btn">` choices, each with its own SVG. `layout()` computes pixel positions for the current field size, `render()` applies them.
- **State:** `phase` (`in`, `play`, `glide`, `glow`, `wait`, `out`), `filled`, `seq` (7 symbols), `correct`, `other`, `side`, `glide`, `wob`, `glow` values.
- **Animation:** a single `requestAnimationFrame` loop `frame()` with capped dt, stopped when idle or hidden; `wake()` restarts it.
- **Randomization:** [`js/random.js`](../../js/random.js) (`Rand.shuffle`) for the pattern order; `Math.random` for the option and side.
- **Events:** `click` on the choices; `resize`, `orientationchange`, `visibilitychange`.
- **Cleanup:** removes the listeners, cancels the frame and removes the root.

## 15. Responsive layout and coordinate system

- `.wz-field` is absolutely positioned: top = safe-area + 56px, bottom = safe-area + 8px, left and right = safe-area + 8px.
- The string SVG has a `viewBox` equal to the field's pixel size (`0 0 W H`), so bead positions are in field pixels and the choice buttons (positioned with `left`/`top` in px) share the same space. Beads are scaled by `S / 100 * 0.9`.
- Choice size `cs = max(56, min(H * 0.26, W * 0.3, 132))`; top area height `H - cs - 40`; choices centred with an offset of `cs * 0.78` either side of the centre line.
- Bead size: `S1 = min((W - 24) / 7.6, topH * 0.6, 110)`; if `S1 >= 62` the string is one row, otherwise two rows of 4 and 3 with `S = max(56, min((W - 24) / 4.5, (topH - 8) / 2.5, 110))`. A glide goes from the choice position to the slot with a small arc (`S * 0.25`).
- `onResize` recomputes layout and re-renders; the current state is kept.

## 16. Error and edge-case handling

- **Rapid input:** touches are ignored unless the phase is `play` and the choices are fully faded in; repeated wrong touches only restart the wobble.
- **Resize/orientation change:** layout recomputed immediately; positions are reapplied, including mid-glide.
- **Backgrounding:** loop cancelled while hidden and restarted on return.
- **Zero-size field:** `layout()` returns without changes if the field has no size.
- **Leaving during an animation:** cleanup cancels the frame.
- **Unhandled:** no handling of a missing `Rand` helper (not an issue with the shipped files); reduced-motion preference is not read.

## 17. Testing

There are no automated tests. Manual scenarios to perform:

- [ ] A string of four beads and an empty slot appears, followed by two choices.
- [ ] Touch the correct bead: it glides into the slot with a glow and the next two choices appear.
- [ ] Touch the other bead: it wobbles and nothing else changes; touch it repeatedly.
- [ ] Complete the string (3 beads): glow for about 2 s, then a new pattern about 4 s later.
- [ ] Play 24 or more rounds: each pattern appears once per block of 12 and no pattern appears twice in a row.
- [ ] Check the correct side varies and is never on the same side three times in a row.
- [ ] For each of the 12 patterns, confirm that the continued beads follow the pattern.
- [ ] Narrow portrait (for example 320x568): the string wraps to two rows, beads and choices are at least 56px and do not overlap.
- [ ] Landscape (for example 640x360 and 1920x1080): one row and a visible, reachable choice row.
- [ ] Rotate the device mid-round: the string and choices re-layout and the state is kept.
- [ ] Touch, mouse and keyboard (Tab, Enter, Space).
- [ ] Switch tab during a glide and return.
- [ ] Reduced motion on: glide and wobble still run.
- [ ] Browsers required by the README: Chrome desktop, Chrome Android, Safari iPhone/iPad.

PR [#74](https://github.com/BielinskiLukasz/child-page/pull/74) reports a Node stub-DOM run over five rounds (wrong and correct taps, glow, automatic new round, cleanup) and lists manual device tests, in particular the narrow portrait two-row layout and orientation change, as pending. PR [#145](https://github.com/BielinskiLukasz/child-page/pull/145) reports `node --check` and a Node simulation of the order logic over 36 rounds (each block of 12 is a full permutation, no back-to-back repeats); no browser test.

## 18. Known limitations and open issues

**Confirmed**
- No automated tests; manual device tests were pending in the PR descriptions.
- Only 12 pattern sets and 4 bead types; bead symbols are fixed per index (the same shape always plays "A").
- Reduced-motion preference is not read; the pattern is not described to assistive technology.

**Requires verification**
- Whether every pattern is unambiguous for a child with only four given beads.
- Appearance of the two-row layout on narrow screens and on orientation change (flagged as pending in PR #74).

No open GitHub issue is specific to this activity.

## 19. Planned improvements

None currently planned.

## 20. Related activities and reusable components

- Shared helper: [`js/random.js`](../../js/random.js) (`Rand.shuffle`). `js/animals.js` is not used.
- Same scene pattern (single rAF loop, glow, wait, cross-fade): [Policz Razem](policz-razem.md), [Co nie Pasuje?](co-nie-pasuje.md), [Ścieżka](sciezka.md).
- Related theme (beads): [Koraliki](koraliki.md).

## 21. Change history

- Issue [#50](https://github.com/BielinskiLukasz/child-page/issues/50) / PR [#74](https://github.com/BielinskiLukasz/child-page/pull/74): activity added.
- Issue [#119](https://github.com/BielinskiLukasz/child-page/issues/119) / PR [#145](https://github.com/BielinskiLukasz/child-page/pull/145): 12 pattern sets in random order per launch.
