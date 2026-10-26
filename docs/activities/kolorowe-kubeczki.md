# Kolorowe Kubeczki

## 1. Overview

| Item | Value |
|---|---|
| Display name | Kolorowe Kubeczki |
| Internal ID | `kubeczki` (entry in [`js/activities.js`](../../js/activities.js)) |
| Description | Three pastel cups and six soft balls (two per colour). The child drags each ball into the cup of the same colour; colours also differ by a pattern (plain, dots, stripes). |
| Category | Sorting / matching by colour |
| Interaction type | Drag (pointer events); keyboard alternative (select a ball, then activate a cup) |
| Status | Implemented; enabled by default in the menu |
| Source | [`js/kubeczki.js`](../../js/kubeczki.js), CSS block `/* Kolorowe Kubeczki */` in [`css/style.css`](../../css/style.css) (prefix `kc`) |

## 2. Business purpose

A colour-matching game with a small, fixed workload (six balls, three cups) and no wrong-answer feedback: a ball put in a cup of another colour floats back. Each colour is also marked with a pattern on both the cup and its balls, so the activity does not rely on colour vision alone. The colour set changes between launches. It complements the size-based sorting of [Duże i Małe](duze-i-male.md) and the shape-based [Kolorowe Kształty](kolorowe-ksztalty.md).

## 3. Activity flow

1. The child opens the activity (`#kubeczki`); a random colour/pattern combination is picked and the scene is laid out.
2. Three cups stand in a row at the top; six balls (two per colour) wait in the bottom area in shuffled places (one row of six, or two rows of three on narrow screens).
3. The child drags a ball. It follows the pointer and cannot leave the visible screen.
4. Released over its own cup the ball glides into the cup (smaller); released elsewhere or over another cup it floats back to its waiting place.
5. When all six balls are in their cups (and nothing moves) the three cups glow for 2 s.
6. After 4 s the balls drift out of the cups to the bottom area in a new order.
7. The activity then continues with the same colours; there is no end.
8. The child leaves with the Back button (see [README.md](README.md#shared-platform-behaviour)).

## 4. Rules and behavior

| Rule | Value (from `js/kubeczki.js`) |
|---|---|
| Cups | 3, each with a colour name, colour, glow colour and a pattern (`plain`, `dots`, `stripes`) |
| Balls | 6: ball `k` belongs to cup `k % 3` (two per cup) |
| Accept area | Ball centre within `0.5 * C` horizontally and vertically of the cup centre (a square `C x C`) and the ball's own cup |
| Wrong drop | Ball glides home; no message |
| Placed balls | Disabled (not draggable); scaled to `min(1, 0.42 * C / B)` and nested left/right in the cup (offset `0.18 * C`) |
| Glide duration | `min(1600, 800 + distance * 0.9)` ms; 300 ms with reduced motion; 200 ms for re-layout glides |
| Glow | `GLOW_S = 2000` ms on the cups |
| Reset | `RESET_S = 4000` ms after completion: new shuffle of home slots (must differ from the previous), balls leave the cups |
| Sound | None ([shared behaviour](README.md#shared-platform-behaviour)) |

- Keyboard: Enter or Space (a `click` with `detail === 0`) on a ball selects it (`aria-pressed`, outline); activating a cup then places it (own cup) or sends it home (other cup). Placed balls leave the tab order.

## 5. Educational and developmental benefits

**Intended design benefits** (design intent, not measured):
- Matching and sorting by colour, supported by pattern as a second cue.
- Hand-eye coordination through dragging.
- Calm repeatable play with immediate, gentle feedback.

**Directly observable behavior:**
- A ball stays only in a cup of its own colour and pattern.
- Cups glow when all balls are sorted, then the balls drift back out in a new order.
- No scores, timers or error messages.

**Requires professional or research-based validation:** any claim about colour learning or developmental effect.

## 6. Accessibility and usability

- **Input:** pointer events (touch, mouse, stylus) with pointer capture and `touch-action: none`; keyboard alternative as above with a 4 px outline (`#8f7fd1`).
- **Screen readers:** cups are labelled "Kubeczek <colour>" and balls "Piłeczka <colour> (Enter lub spacja, potem wybierz kubeczek)"; `aria-pressed` marks the selected ball.
- **Non-colour cue:** every colour has a distinct pattern (plain, dots, stripes), always three distinct colours and three distinct patterns in each of the eight combinations.
- **Contrast:** soft pastel colours with a white translucent outline; contrast against the background (`#f6f0fb` to `#e3f1ea`) is low by design and has not been measured (requires verification).
- **Target size:** balls `B` between 64 and 120 px (CSS minimum 64 px); cups up to 190 px (minimum 72 px).
- **Orientation:** one row of six balls when `fw / 6 >= 84`, otherwise two rows of three; recomputed on `resize` and `orientationchange`.
- **Reduced motion:** all motion and glow are driven by a `requestAnimationFrame` loop with inline styles, so they still run under the global CSS rule; glides shorten to 300 ms.
- **Reading:** none required.

## 7. Risks and limitations

- Reliance on colour is mitigated by patterns, but the patterns are subtle (white 75% opacity marks on pastel fills).
- Some colour names occur in different combinations (for example both pink and blue appear in several sets); within one launch they are always distinct.
- No privacy concerns; nothing stored or sent.
- PR [#76](https://github.com/BielinskiLukasz/child-page/pull/76) listed layout at 360x640 portrait/landscape (balls at least 64 px) and Safari checks as not yet done.

## 8. Configuration

No external configuration; constants are inside [`js/kubeczki.js`](../../js/kubeczki.js).

| Name | Purpose | Type | Default | Location |
|---|---|---|---|---|
| `COMBOS` | Eight predefined sets of three cups (label, colour, glow colour, pattern) | array | 8 entries | top of IIFE (built by `combo()`) |
| `GLOW_S` | Cup glow duration | ms | 2000 | top of IIFE |
| `RESET_S` | Time from completion to the balls drifting out | ms | 4000 | top of IIFE |
| Layout numbers | `B` clamp 64-120, `C` clamp 72-190, per-row breakpoint `fw / 6 >= 84` | numbers | see `layout()` | `layout()` |

No fallback for invalid values because nothing is read from outside.

## 9. Assets

No external files. Cups (`cupSvg`) and balls (`ballSvg`) are inline SVG generated from the chosen combination, with pattern overlays drawn in white. The background is a CSS gradient. The menu icon is inline SVG in `js/activities.js`. No fonts, images or audio.

## 10. Randomization and variants

| What | How | Pool |
|---|---|---|
| Colour/pattern combination | `Rand.pickOne(COMBOS, 'kubeczki')`: never the same combination as the previous pick of this key in the same page session | 8 combinations |
| Waiting slot of each ball | `shuffled(6)` at mount; reshuffled (must differ from the previous order) at every reset | 6! orders |

- The combination is chosen once per `mount`, so it persists during a visit and changes (never repeating the previous one) when the activity is re-opened in the same page session. After a page reload the "last pick" memory is lost.
- Nothing is stored. The pool is a fixed array, so empty/invalid pools cannot occur.
- Ball `k` always belongs to cup `k % 3`; only the waiting positions vary.

## 11. Progression and difficulty

None. Every round has three cups and six balls; nothing persists between sessions.

## 12. Completion and feedback

- Completion: all six balls placed and idle.
- Feedback: a coloured drop-shadow glow on the three cups for 2 s (eased in about 400 ms). Individual placement is shown by the ball gliding into the cup and shrinking.
- Failure: none; a wrong drop returns the ball. No sound.
- After 4 s the balls leave the cups in a new order and play continues automatically.

## 13. Analytics and metrics

Nothing is emitted on `main`; see [README.md](README.md#analytics-status). None of `activity_start`, `activity_end`, `activity_complete`, `activity_restart`, `interaction`, `level_start`, `level_complete` is emitted for this activity, and no metric is supported. On-device metrics are proposed in open PR [#172](https://github.com/BielinskiLukasz/child-page/pull/172).

Not implemented, planning note only: active time, the number of balls placed (`interaction`) and sorted rounds (a completed round could be an `activity_complete`) would be meaningful; the number of wrong drops could be counted but is not an error measure. No personal data would be needed.

## 14. Technical implementation

- **Entry point:** `mount(container)` in [`js/kubeczki.js`](../../js/kubeczki.js), replacing `mount` of the `kubeczki` registry entry; returns `cleanup`.
- **Rendering:** DOM: `div.kc > div.kc-field` with 3 `button.kc-cup` and 6 `button.kc-ball`, each containing an inline SVG. Elements are moved with `transform: translate() scale()`.
- **State:** per ball `{ cup, slot, x, y, s (scale), hx/hy (home), tx/ty/ts (target), nest, mode, pid, placed }`; per cup `{ c, x, y, count, glow }`; globals `order`, `selected`, `doneActive`, `doneT`.
- **Events:** `pointerdown/move/up/cancel`, `lostpointercapture` per ball; `click` on balls (keyboard) and cups; `resize`, `orientationchange`, `visibilitychange`.
- **Animation:** one `frame()` loop (dt capped at 50 ms), smoothstep glides, restarted by `start()` and stopped when nothing is moving; paused while hidden.
- **Randomization:** `Rand.pickOne` for the combination, local `shuffled()` for the ball slots (uses `Math.random` directly).
- **Dependencies:** [`js/random.js`](../../js/random.js). **Persistence:** none. **Analytics:** none.
- **Cleanup:** cancels the frame, removes the three listeners and removes the board.

## 15. Responsive layout and coordinate system

- `.kc` is fixed full-screen; `.kc-field` is inset by the safe-area variables plus 64 px at the top and 12 px elsewhere. All coordinates are CSS pixels relative to the field (`fw` x `fh`).
- Cups: centred at `x = fw * (i + 0.5) / 3`, `y = C / 2 + 6` (top of the field). Balls rest at the bottom: one row of six (`x = fw * (col + 0.5) / 6`) or two rows of three, `hy = fh - B/2 - 6 - (rows - 1 - row) * (B + 8)`.
- `B = max(64, min(120, fw / per * 0.86, fh * (0.3 or 0.2)))`, `C = max(72, min(fw / 3 * 0.86, fh - rows * (B + 10) - 24, 190))`; both are exposed as CSS variables `--kc-b` and `--kc-c`.
- Cups, balls and drop areas share the field's pixel space; a ball's scale (placed state) is a transform and does not change its layout box.
- Resize or rotation re-runs `layout()`; dragged balls go home, glides continue to the new targets.
- On very short screens the minimum sizes (64 px balls, 72 px cups) take precedence over fitting (requires verification).

## 16. Error and edge-case handling

| Case | Handling |
|---|---|
| Missing assets | N/A (inline SVG); `Rand` is required and not guarded |
| Resize / rotation | `layout()` re-run; active drag cancelled and ball sent home |
| Backgrounding | Loop paused while hidden; completion timers advance only while visible |
| Multi-touch | Each ball tracks its own pointer; a second pointer on the same ball is ignored |
| Pointer cancel / lost capture | Treated as release |
| Wrong cup or empty area | Ball returns home |
| Dragging outside the screen | Centre clamped to the visible window |
| Right mouse button | Ignored |
| Drag during the post-completion drift-out | Allowed, the balls are not yet placed; the drift-out can be interrupted by dragging (requires verification of the visual result) |
| Leaving mid-animation | `cleanup` cancels the frame |

## 17. Testing

No automated tests exist ([README.md](README.md#shared-platform-behaviour)). PR [#76](https://github.com/BielinskiLukasz/child-page/pull/76) reports `node --check` and a stub-DOM run of the keyboard flow (all six balls placed, glow, auto-reset to a new order); PR [#146](https://github.com/BielinskiLukasz/child-page/pull/146) reports `node --check` and a check that all eight combinations have three distinct colours and patterns, with no browser available. Manual checklist (not yet performed):

- [ ] Normal: drag a ball into the cup of its colour; it shrinks into the cup.
- [ ] Incorrect interaction: drag a ball to another cup and to empty ground; it floats back each time.
- [ ] Completion: all six sorted; the cups glow for about 2 s and the balls drift out in a new order after about 4 s.
- [ ] Restart: leave and reopen several times; the colour/pattern combination changes and does not repeat consecutively.
- [ ] Patterns: in every combination the three cups and their balls are told apart by pattern as well as colour.
- [ ] Progression: confirm that nothing changes between rounds.
- [ ] Portrait (about 360x640): two rows of three balls, all at least 64 px, no overlap with the cups.
- [ ] Landscape (about 640x360): one row of six, no overlap.
- [ ] Touch: drag two balls at once with two fingers; rotate mid-drag.
- [ ] Mouse: left-button drag works; right button does nothing.
- [ ] Keyboard: Tab to a ball, Enter selects, Enter on a cup places or returns it.
- [ ] Reduced motion on: glides are short, glow still shown.
- [ ] Background the tab during the glow and return.
- [ ] Browsers: Chrome desktop, Chrome Android, Safari iPhone/iPad.

## 18. Known limitations and open issues

**Confirmed (from code reading):**
- No automated tests.
- The accept area is a square around the cup centre, not the cup outline.
- `Rand.pickOne` memory only lasts for the current page session.
- The waiting-slot shuffle uses its own `Math.random` code rather than `Rand.shuffle`.

**Requires verification:**
- Pastel contrast and pattern visibility on low-quality screens.
- Layout on short landscape screens.

No open GitHub issue concerns this activity.

## 19. Planned improvements

None currently planned (no open issue).

## 20. Related activities and reusable components

- Sorting activities: [Duże i Małe](duze-i-male.md), [Kolorowe Kształty](kolorowe-ksztalty.md), [Koraliki](koraliki.md).
- Shared helper used: [`js/random.js`](../../js/random.js) (`Rand.pickOne`). [`js/animals.js`](../../js/animals.js) is **not** used.

## 21. Change history

- [#47](https://github.com/BielinskiLukasz/child-page/issues/47) / [PR #76](https://github.com/BielinskiLukasz/child-page/pull/76): activity introduced.
- [#121](https://github.com/BielinskiLukasz/child-page/issues/121) / [PR #146](https://github.com/BielinskiLukasz/child-page/pull/146): random colour and pattern combinations (8 sets).
