# Wieża z Klocków

## 1. Overview

| Item | Value |
|---|---|
| Display name | Wieża z Klocków |
| Internal ID | `wieza` (entry in [`js/activities.js`](../../js/activities.js)) |
| Description | 5 to 9 soft pastel blocks wait at the bottom (portrait) or on one side (landscape). The child drags them onto a tower base in any order; each settles on top with a tiny sway, and the tower can never fall. |
| Category | Open-ended play / coordination (building) |
| Interaction type | Drag (pointer events); keyboard alternative (select a block, then activate the tower) |
| Status | Implemented; enabled by default in the menu |
| Source | [`js/wieza.js`](../../js/wieza.js), CSS block `/* Wieża z Klocków */` in [`css/style.css`](../../css/style.css) (prefix `wk`) |

## 2. Business purpose

A gentle building game designed so that failure is impossible: blocks are stacked in any order, the tower never collapses, and a block released elsewhere just drifts back. This gives the child the satisfaction of building without the frustration of a falling tower, which a physical block tower can cause. It is the least rule-bound of the drag activities (no correct order, no matching), which distinguishes it from [Puzzle](puzzle.md) and the sorting activities ([Duże i Małe](duze-i-male.md), [Kolorowe Kubeczki](kolorowe-kubeczki.md)). The number and colours of the blocks vary on every launch.

## 3. Activity flow

1. The child opens the activity (`#wieza`); a set of 5 to 9 blocks is generated and laid out.
2. A flat base is shown (centred in the upper area in portrait, in the left half in landscape); the blocks wait in a grid of three columns at the bottom or in the right half.
3. The child drags a block. It follows the pointer and cannot leave the visible screen.
4. Released over or near the tower column and above the base, the block glides to the top of the stack, is centred, and the whole tower sways for about 1.2 s.
5. Released elsewhere, the block drifts back to its waiting place; it can be picked up again.
6. When all blocks are stacked the top block glows for 3 s.
7. At 7 s after completion all blocks drift back to their starting places and the tower can be built again with the same blocks.
8. The child leaves with the Back button (see [README.md](README.md#shared-platform-behaviour)).

## 4. Rules and behavior

| Rule | Value (from `js/wieza.js`) |
|---|---|
| Block count | 5 to 9 (`MIN_BLOCKS`, `MAX_BLOCKS`), chosen once per launch |
| Order of stacking | Any: blocks are added to the stack in the order they are dropped |
| Accept area | Block centre within `max(1.8 * Ut, 0.7 * tw)` horizontally of the tower axis and above the base (`y < by + 2`), where `Ut` is the stacked unit and `tw` the base width |
| Wrong drop | Block glides back to its waiting place |
| Placed blocks | Disabled (not draggable); scaled by `sc = Ut / U` and centred on the tower axis |
| Sway | `SWAY_S = 1.2` s, amplitude `SWAY_DEG = 2` degrees, damped (`exp(-t / 0.45)`), period 0.8 s, rigid rotation of the whole stack about the base; not applied with reduced motion |
| Glide duration | `min(1500, 700 + distance * 0.8)` ms; 300 ms with reduced motion; 200 ms for re-layout glides |
| Glow | `GLOW_S = 3000` ms on the top block only |
| Reset | `RESET_S = 7000` ms after completion |
| Failure | None; the tower cannot fall and nothing is ever lost |
| Sound | None ([shared behaviour](README.md#shared-platform-behaviour)) |

- Keyboard: Enter or Space (a `click` with `detail === 0`) on a block selects it (`aria-pressed`, outline); activating the "Wieża" button stacks it. Placed blocks leave the tab order.
- Block geometry (width x height in block units): 9 shapes from 0.8 x 0.8 up to 1.6 x 0.8; two are "daszek" (roof, triangle) shapes. Any block can be placed under or over any other (including roofs in the middle of the stack).

## 5. Educational and developmental benefits

**Intended design benefits** (design intent, not measured):
- Hand-eye coordination and controlled dragging.
- Free constructive play without a wrong order.
- Cause and effect (a block placed makes the tower sway slightly).

**Directly observable behavior:**
- Blocks settle centred on the stack regardless of where they were dropped.
- The tower only sways a little and always recovers.
- When complete, only the top block glows.
- No scores, timers or error messages.

**Requires professional or research-based validation:** any claim about motor skill, spatial reasoning or developmental effect.

## 6. Accessibility and usability

- **Input:** pointer events (touch, mouse, stylus) with pointer capture and `touch-action: none`; keyboard alternative as above with a 4 px outline (`#8f7fd1`).
- **Screen readers:** blocks are labelled "Klocek: <colour> <shape> (Enter lub spacja, potem wybierz wieżę)", for example "różowy kwadrat"; the tower button is labelled "Wieża"; `aria-pressed` marks the selection. The stack order is not announced.
- **Target size:** the block unit `U` is floored at 70 px (maximum 84 px) so that every waiting block is at least 56 px wide and high (smallest block 0.8 units = 56 px). Stacked blocks are scaled to fit the tower height and may be smaller (section 18).
- **Orientation:** portrait places the waiting grid at the bottom, landscape in the right half with the tower in the left half; recomputed on `resize` and `orientationchange`.
- **Colour:** colours are decorative; blocks also differ by shape and size, but no decision depends on colour.
- **Reduced motion:** movement and glow are driven by a `requestAnimationFrame` loop with inline styles, so they still run under the global CSS rule; with `prefers-reduced-motion` the sway is skipped and glides shorten to 300 ms.
- **Reading:** none required.
- **Limitations:** the tower area is a single large invisible button; the blocks' vertical order is only visual.

## 7. Risks and limitations

- On short screens, stacked blocks shrink to fit the whole tower; PR [#78](https://github.com/BielinskiLukasz/child-page/pull/78) noted about 47 px on a 360x640 landscape phone and asked for a human check.
- With 9 blocks (three rows) in short landscape the waiting area may be tight; PR [#148](https://github.com/BielinskiLukasz/child-page/pull/148) asked the reviewer to check it.
- Slight sway of the stack may be noticeable; it is limited to 2 degrees and 1.2 s and is skipped with reduced motion.
- No privacy concerns; nothing stored or sent.

## 8. Configuration

No external configuration; constants are inside [`js/wieza.js`](../../js/wieza.js).

| Name | Purpose | Type | Default | Location |
|---|---|---|---|---|
| `SHAPES` | 9 block shapes (noun, width, height in units, `rect` or `roof`) | array | 9 entries | top of IIFE |
| `PALETTE` | 10 pastel colours with Polish names | array | 10 entries | top of IIFE |
| `MIN_BLOCKS`, `MAX_BLOCKS` | Range of the random block count | numbers | 5, 9 | top of IIFE |
| `GLOW_S` | Top-block glow duration | ms | 3000 | top of IIFE |
| `RESET_S` | Time from completion to the blocks returning | ms | 7000 | top of IIFE |
| `SWAY_S`, `SWAY_DEG` | Sway duration (s) and amplitude (degrees) | numbers | 1.2, 2 | top of IIFE |
| Layout numbers | `U` clamp 70-84, waiting grid 3 columns, base height 12 px, `Ut <= 1.25 * U` | numbers | see `layout()` | `layout()` |

No fallback for invalid values because nothing is read from outside.

## 9. Assets

No external files. Blocks are inline SVG (`blockSvg`): a rounded square (`rect`) or a rounded triangle (`roof`) with a small highlight, stretched to the block's width and height (`preserveAspectRatio="none"`, `vector-effect: non-scaling-stroke`). The base is a CSS rounded bar (`#d9c9ea`), the background a CSS gradient (`#f3eefb` to `#fdf0d5`). The menu icon is inline SVG in `js/activities.js`. No fonts, images or audio.

## 10. Randomization and variants

| What | How | Pool |
|---|---|---|
| Number of blocks | `5 + floor(Math.random() * 5)` once per launch | 5 to 9 |
| Shapes | `Rand.pick(SHAPES, n)`: unique shapes | 9 shapes |
| Colours | `Rand.pick(PALETTE, n)`: unique colours, so no colour repeats within a tower | 10 colours |

- Block set persists for the visit (reset only returns the blocks to their waiting places; it does not reshuffle or change them). A new set is generated each time the activity is opened. Nothing is stored.
- The waiting positions follow the block order (`i % 3`, `floor(i / 3)`); they are not shuffled.
- Pools are fixed arrays; `n` never exceeds the pool sizes (9 shapes, 10 colours).

## 11. Progression and difficulty

None. Only the random block count (5 to 9) differs between launches; it does not grow within a visit. Nothing is persisted.

## 12. Completion and feedback

- Completion: all blocks stacked and idle (`stack.length === BLOCKS.length`).
- Feedback: the top block glows (yellow drop-shadow `#ffe08a`, eased in about 400 ms) for 3 s. Each placement shows a small sway of the tower.
- Failure: none. No sound.
- After 7 s the blocks glide back to their waiting places and play can repeat.

## 13. Analytics and metrics

This activity reports to the shared on-device module `js/analytics.js` (`window.Analytics`) through the app shell only: `js/app.js` records the activity start and end, and the module counts touches inside the stage. The activity file itself calls no `Analytics` function. Recorded for it: starts, active time, replays (re-opening in the same session), quick exits (within 10 s) and touches. It is open-ended, so no completion, level or exit-before-completion is defined for it. Data stays on the device as anonymous daily aggregates; see [README.md](README.md#analytics-status).

## 14. Technical implementation

- **Entry point:** `mount(container)` in [`js/wieza.js`](../../js/wieza.js), replacing `mount` of the `wieza` registry entry; returns `cleanup`.
- **Rendering:** DOM: `div.wk > div.wk-field` with a `div.wk-base`, one `button.wk-tower` (invisible tower area) and one `button.wk-block` per block, each with inline SVG. Elements are moved with `transform: translate() rotate() scale()`.
- **State:** `BLOCKS` (from `makeBlocks()`), `stack` (ordered placed blocks), per block `{ b, i, W, H, x, y, hx/hy (home), tx/ty (stack target), s (scale), mode, placed }`; `swayT`, `doneActive`, `doneT`, `glow`.
- **Stacking:** `stackTargets()` computes each stacked block's centre from the base upwards (`top -= h`), so the stack is always contiguous and centred.
- **Events:** `pointerdown/move/up/cancel`, `lostpointercapture` per block; `click` on blocks (keyboard) and on the tower; `resize`, `orientationchange`, `visibilitychange`.
- **Animation:** one `frame()` loop (dt capped at 50 ms), smoothstep glides; sway applied in `place()` by rotating placed blocks' positions about the base; stops when idle; paused while hidden.
- **Dependencies:** [`js/random.js`](../../js/random.js) (`Rand.pick`). **Persistence:** none. **Analytics:** none from the activity itself (reported by `js/app.js`).
- **Cleanup:** cancels the frame, removes the three listeners and the board.

## 15. Responsive layout and coordinate system

- `.wk` is fixed full-screen; `.wk-field` is inset by the safe-area variables plus 64 px at the top and 12 px elsewhere. All coordinates are CSS pixels relative to the field.
- Portrait (`fh >= fw`): waiting grid across the full width at the bottom (`rows = ceil(n / 3)`), `U = clamp(min(fw / 3 / 1.7, 0.13 fh), 70, 84)`; the tower area is everything above it (`th0 = wy0 - 8`).
- Landscape: the waiting grid fills the right half, vertically centred, `U = clamp(min(fw / 2 / 3 / 1.7, fh / rows / 1.2), 70, 84)`; the tower area is the left half.
- The stacked unit `Ut = min(1.25 U, (th0 - 12 - 4) / totalU)` where `totalU` is the sum of the block heights, so the whole tower always fits; `sc = Ut / U` scales placed blocks. The base is centred in the tower area (`bx`), `by` is just above the base; the tower button spans `1.2 * tw` wide (`tw = max(2.2 * Ut, 80)`).
- Blocks, base and tower area share the field's pixel space; resize and rotation re-run `layout()` and cancel active drags.

## 16. Error and edge-case handling

| Case | Handling |
|---|---|
| Missing assets | N/A (inline SVG); `Rand` is required and not guarded |
| Resize / rotation | `layout()` re-run; active drag cancelled and block sent home; placed blocks follow the new targets |
| Backgrounding | Loop paused while hidden; completion timers advance only while visible |
| Multi-touch | Each block tracks its own pointer; a second pointer on the same block is ignored |
| Pointer cancel / lost capture | Treated as release |
| Same block snapped twice | `snap` returns early if the block is already placed or in the stack |
| Dragging outside the screen | Centre clamped to the visible window |
| Right mouse button | Ignored |
| Not enough height | `Ut` shrinks so the tower fits; stacked blocks can become smaller than 56 px (section 18) |
| Leaving mid-animation | `cleanup` cancels the frame |

## 17. Testing

No automated tests exist ([README.md](README.md#shared-platform-behaviour)). PR [#78](https://github.com/BielinskiLukasz/child-page/pull/78) reports `node --check` and a stub-DOM run of the keyboard flow (stack all blocks, glow, reset, three times); PR [#148](https://github.com/BielinskiLukasz/child-page/pull/148) reports `node --check` and a node harness over 2000 launches (counts only 5 to 9, colours always unique), without a visual check. The scripts are not in the repository. Manual checklist (not yet performed):

- [ ] Normal: drag a block onto the tower; it settles on top, centred, and the tower sways briefly.
- [ ] Stack blocks in different orders; the tower is always contiguous and never falls.
- [ ] Incorrect interaction: release a block far from the tower; it drifts back and can be picked up again.
- [ ] Completion: stack all blocks; only the top glows for about 3 s; after about 7 s all blocks return.
- [ ] Restart: leave and reopen several times; the block count (5 to 9), shapes and colours change and no colour repeats within a tower.
- [ ] Progression: confirm that nothing changes between rounds.
- [ ] Portrait (about 360x640): waiting grid at the bottom, with 9 blocks (three rows) still fully visible; tower fits above.
- [ ] Landscape (about 640x360): tower left, waiting blocks right; with 9 blocks check that nothing overlaps and measure the stacked block size (PR #78 reported about 47 px on a short screen).
- [ ] Rotate the device mid-drag and with a partly built tower.
- [ ] Touch: two fingers dragging two blocks; mouse: left-button drag.
- [ ] Keyboard: Tab to a block, Enter selects, Enter on "Wieża" stacks it.
- [ ] Reduced motion on: no sway, short glides, glow still shown.
- [ ] Background the tab during the glow and return.
- [ ] Browsers: Chrome desktop, Chrome Android, Safari iPhone/iPad.

## 18. Known limitations and open issues

**Confirmed (from code reading):**
- No automated tests.
- Stacked blocks are scaled down to fit the tower and can become smaller than the 56 px target size on short screens (acknowledged in PR #78).
- Any block can go anywhere in the stack, including roof shapes in the middle (no stability logic by design).
- The set of blocks is fixed for the whole visit.
- The shape pool (9) is not reduced for tower height; a stack of nine blocks has total height 7.8 units at most.

**Requires verification:**
- Fit of three waiting rows with 9 blocks in short landscape (PR #148 reviewer focus).
- Appearance of stretched shapes (`preserveAspectRatio="none"`) for the widest block (1.6 x 0.8).

No open GitHub issue concerns this activity.

## 19. Planned improvements

None currently planned (no open issue).

## 20. Related activities and reusable components

- Other drag activities: [Koraliki](koraliki.md), [Duże i Małe](duze-i-male.md), [Kolorowe Kubeczki](kolorowe-kubeczki.md), [Puzzle](puzzle.md).
- Shared helper used: [`js/random.js`](../../js/random.js) (`Rand.pick`). [`js/animals.js`](../../js/animals.js) is **not** used.

## 21. Change history

- [#53](https://github.com/BielinskiLukasz/child-page/issues/53) / [PR #78](https://github.com/BielinskiLukasz/child-page/pull/78): activity introduced (6 blocks); block unit floored at 70 px after review (commit `127b990`).
- [#123](https://github.com/BielinskiLukasz/child-page/issues/123) / [PR #148](https://github.com/BielinskiLukasz/child-page/pull/148): random block count (5 to 9) and unique colours per launch.
