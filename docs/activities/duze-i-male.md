# Duże i Małe

## 1. Overview

| Item | Value |
|---|---|
| Display name | Duże i Małe |
| Internal ID | `duze-i-male` (entry in [`js/activities.js`](../../js/activities.js)) |
| Description | A big house and a small house are shown, with two big and two small animals waiting at the bottom. The child drags (or selects) each big animal to the big house and each small animal to the small house. |
| Category | Sorting / matching by size |
| Interaction type | Drag (pointer events); keyboard alternative (select an animal, then activate a house) |
| Status | Implemented; enabled by default in the menu |
| Source | [`js/duze-i-male.js`](../../js/duze-i-male.js), CSS block `/* Duże i Małe */` in [`css/style.css`](../../css/style.css) (prefix `dm`) |

## 2. Business purpose

Introduces the concept of size (big and small) with a single, easily seen rule: big goes with big, small with small. Unlike the colour or shape sorting activities ([Kolorowe Kubeczki](kolorowe-kubeczki.md), [Kolorowe Kształty](kolorowe-ksztalty.md)), the cue is size only, which is shown by the animals and the houses at the same time. It uses a "no wrong answers" model: an animal put in the wrong place gently floats back. Rounds repeat with different animals, so the activity can be replayed without becoming identical.

## 3. Activity flow

1. The child opens the activity (`#duze-i-male`); `setRound()` and `layout()` run immediately.
2. A big house and a small house (in two different colours) stand side by side on the ground; four animals (two big, two small, of two animal types) wait in a row at the bottom in random order.
3. The child drags an animal. While dragging it follows the pointer and cannot leave the visible screen.
4. Released over its matching house, the animal glides into the house area and glows softly; released elsewhere (or over the other house) it glides back to its waiting place.
5. Placed animals stay in the house, are disabled (no longer draggable), and glow.
6. When all four are placed and idle, both houses glow (2 s); after 4 s the scene fades out (0.7 s), a new round with other animals is set up and fades in (0.7 s).
7. The cycle continues indefinitely; the houses keep the same colours for the whole visit.
8. The child leaves with the Back button (see [README.md](README.md#shared-platform-behaviour)).

## 4. Rules and behavior

| Rule | Value (from `js/duze-i-male.js`) |
|---|---|
| Items per round | 4 animals: 2 big (size `B`) and 2 small (size `B / 2`); two animal types, each shown once big and once small |
| Correct target | Big animal -> big house, small animal -> small house (`it.house`) |
| Drop detection | Animal centre inside the house's box plus a 10% padding of the house width; if inside both, the nearer house centre wins |
| Wrong drop | Animal glides back to its resting spot |
| Glide duration | `min(1800, 800 + distance)` ms; 300 ms with reduced motion; 200 ms for re-layout glides |
| Glow | `GLOW_S = 2000` ms of house glow; `NEXT_S = 4000` ms until the next round; fade `FADE_MS = 700` ms each way |
| Input during fade or glow phases | New drags are ignored unless `phase === 'play'` and the animal is not already placed |
| Sound | None ([shared behaviour](README.md#shared-platform-behaviour)) |

- Keyboard: Enter or Space on an animal (a `click` with `detail === 0`) selects it (`aria-pressed`, outline); activating a house then places it (correct house) or sends it home (wrong house).
- Placed animals are `disabled` and removed from the tab order (`tabIndex = -1`).
- The two animals of one pair sit left and right inside the house (offset `min(0.5 * size, 0.28 * house width)`).

## 5. Educational and developmental benefits

**Intended design benefits** (design intent, not measured):
- Comparing and sorting by size (big and small).
- Hand-eye coordination through dragging.
- Recognising animals and houses.

**Directly observable behavior:**
- The animal only stays when it is dropped at the matching house; otherwise it returns.
- Both houses glow when the round is complete, then a new set of animals appears.
- No scores, timers or error messages.

**Requires professional or research-based validation:** any claim that the activity teaches size concepts or has a developmental effect.

## 6. Accessibility and usability

- **Input:** pointer events (touch, mouse, stylus) with pointer capture and `touch-action: none`; keyboard alternative as above with a 4 px focus/selection outline (`#8f7fd1`).
- **Screen readers:** animals have Polish labels such as "Duży miś (Enter lub spacja, potem wybierz domek)"; houses are labelled "Duży domek" and "Mały domek"; `aria-pressed` shows the selection.
- **Target size:** big animals 96 to 180 px; small animals half of that (48 to 90 px); CSS minimum 48 px. Small animals therefore are 48 px on small screens, below the 56 px used by several other activities.
- **Orientation:** layout is computed in pixels from the field size (section 15) and re-run on `resize` and `orientationchange`; an active drag is cancelled and the animal returns home.
- **Size cue:** size, not colour, defines the correct house; house colours are decorative (two different colours per launch). Size is the only distinguishing cue, so a child who cannot judge relative size has no other hint.
- **Reduced motion:** glides, fades and glows are driven by a `requestAnimationFrame` loop with inline styles, so they still run under the global CSS rule; glides shorten to 300 ms. Fade between rounds still plays.
- **Reading:** none required; independent use is intended.

## 7. Risks and limitations

- Small animals can be as small as 48 px; accidental misses are possible for small fingers (no penalty, they just return).
- The sorting rule is not announced or demonstrated; a child learns it by trying.
- Two different house colours but identical shapes: the houses differ only in size and colour (not a risk, but the house colour has no meaning).
- PR [#75](https://github.com/BielinskiLukasz/child-page/pull/75) asked for close attention to small-landscape layouts such as 640x360.
- No privacy concerns; nothing stored or sent.

## 8. Configuration

No external configuration; constants are inside [`js/duze-i-male.js`](../../js/duze-i-male.js).

| Name | Purpose | Type | Default | Location |
|---|---|---|---|---|
| `TYPES` | 8 animal drawings: id, Polish label, glow colour, SVG art (bear, rabbit, cat, duck, pig, mouse, frog, dog) | array | 8 entries | top of IIFE |
| `HOUSE_COLOURS` | 6 wall/roof/door/glow colour sets | array | 6 entries | top of IIFE |
| `GLOW_S` | Round-complete glow duration | ms | 2000 | top of IIFE |
| `NEXT_S` | Time from completion to the next round (fade starts) | ms | 4000 | top of IIFE |
| `FADE_MS` | Fade out and in duration | ms | 700 | top of IIFE |
| Layout numbers | Big size `B = clamp(min(0.28 fw, 0.2 fh), 96, 180)`, small `B / 2`, big house width `max(60, min(0.5 fw, ground))`, small house half of that, gap 6% of width | numbers | see `layout()` | `layout()` |

No fallback for invalid values because nothing is read from outside.

## 9. Assets

No external asset files. Animals (`TYPES[].art`) and houses (`houseSvg`) are inline SVG strings drawn in the activity's own style; this activity does **not** use the shared animal family `js/animals.js`. Backgrounds are CSS gradients (`.dm` `#e6f2fb` to `#e2f3dc`; `.dm-glow` a radial yellow gradient). The menu icon is inline SVG in `js/activities.js`. No fonts, images or audio.

## 10. Randomization and variants

| What | How | Pool |
|---|---|---|
| House colours | `Rand.pick(HOUSE_COLOURS, 2)`: two unique sets, first for the big house | 6 sets (30 ordered combinations) |
| Animal order for the visit | `Rand.shuffle` of the 8 animal types, once per launch | 8 types |
| Animals per round | Round `r` uses `pool[2r % 8]` and `pool[(2r+1) % 8]` | 4 rounds cover all 8 types, then the cycle repeats in the same order |
| Position of the four animals in the bottom row | `Rand.shuffle(order)` at every round | 4! orders |

- Immediate repetition: within the 4-round cycle no type repeats; the same two animals do not appear in consecutive rounds. The house colours are fixed for the visit.
- Nothing is stored; every time the activity is opened a new shuffle and colour pair are chosen (a fresh `mount`).
- There are no empty or invalid pools (fixed arrays).

## 11. Progression and difficulty

None. Every round has two big and two small animals; only the animal types change. Nothing is persisted.

## 12. Completion and feedback

- Completion: all four animals placed in their matching houses.
- Feedback: individual animals glow when placed; both houses plus a background radial glow when the round is complete.
- Failure: none; a wrong drop returns the animal. No sound.
- After about 4 s the next round starts automatically with a fade.

## 13. Analytics and metrics

This activity reports to the shared on-device module `js/analytics.js` (`window.Analytics`) through the app shell only: `js/app.js` records the activity start and end, and the module counts touches inside the stage. The activity file itself calls no `Analytics` function. Recorded for it: starts, active time, replays (re-opening in the same session), quick exits (within 10 s) and touches. It is open-ended, so no completion, level or exit-before-completion is defined for it. Data stays on the device as anonymous daily aggregates; see [README.md](README.md#analytics-status).

## 14. Technical implementation

- **Entry point:** `mount(container)` in [`js/duze-i-male.js`](../../js/duze-i-male.js), replacing `mount` of the `duze-i-male` registry entry; returns `cleanup`.
- **Rendering:** DOM: `div.dm > div.dm-glow + div.dm-field`; the field holds 2 `button.dm-house` and 4 `button.dm-animal`, each with an inline SVG. Elements are moved with `transform: translate()`.
- **State:** per animal `{ big, k, type, x, y, hx/hy (home), tx/ty (target in house), sz, house, mode ('idle' | 'drag' | 'glide'), placed, glow }`; globals `round`, `pool`, `order`, `phase` (`play`, `out`, `in`), `doneT`, `doneGlow`, `fade`.
- **Events:** `pointerdown/move/up/cancel`, `lostpointercapture` per animal; `click` on animals (keyboard) and houses; `resize`, `orientationchange`, `visibilitychange`.
- **Animation:** one `frame()` loop (dt capped at 50 ms), smoothstep glides, which stops when idle and is restarted by `start()`; paused while the tab is hidden.
- **Randomization:** `window.Rand.pick` / `Rand.shuffle` (see section 10); `setRound()` assigns types and labels, `shuffleRest()` reshuffles the bottom row.
- **Dependencies:** [`js/random.js`](../../js/random.js). **Persistence:** none. **Analytics:** none from the activity itself (reported by `js/app.js`).
- **Cleanup:** cancels the frame, removes the three listeners and removes the board.

## 15. Responsive layout and coordinate system

- `.dm` is fixed full-screen; `.dm-field` is inset by the safe-area variables plus 64 px at the top and 12 px elsewhere. All positions are CSS pixels relative to the field.
- `layout()`: `B = max(96, min(180, min(0.28 fw, 0.2 fh)))`, `Sm = B / 2`; `ground = fh - 4 - B - 14` (the houses stand above the resting row); big house width `Hb = max(60, min(0.5 fw, ground))`, small house `Hb / 2`; the two houses are centred as a group with a gap of 6% of the width.
- The resting row is centred; gap between animals `clamp((0.96 fw - sum) / 3, 4, 28)`.
- Houses are square buttons whose SVG scales with them; animals and houses share the field's pixel coordinate space, so the drop test compares the animal centre with the house box directly.
- Resize or rotation recomputes everything; positions of placed animals are recomputed from their target positions.
- On very small fields the minimum sizes (96 px big animals, 60 px big house) take precedence over fitting, so content could overflow (requires verification).

## 16. Error and edge-case handling

| Case | Handling |
|---|---|
| Missing assets | N/A (inline SVG); `Rand` is required and not guarded |
| Resize / rotation | `layout()` re-run; active drag cancelled and animal sent home |
| Backgrounding | Loop paused while hidden; completion timer only advances while visible |
| Multi-touch | Each animal tracks its own pointer; a second pointer on the same animal is ignored |
| Pointer cancel / lost capture | Treated as release (`up`) |
| Drop on the wrong house or between houses | Animal returns home |
| Dragging a placed animal | Not possible (button disabled) |
| Input during glow/fade | `down()` ignores input unless `phase === 'play'`; `onHouse` also checks the phase |
| Dragging outside the screen | Centre clamped to the visible window |
| Right mouse button | Ignored |
| Leaving mid-animation | `cleanup` cancels the frame |

## 17. Testing

No automated tests exist ([README.md](README.md#shared-platform-behaviour)). PR [#75](https://github.com/BielinskiLukasz/child-page/pull/75) reports `node --check` only and lists browser tests as pending; PR [#144](https://github.com/BielinskiLukasz/child-page/pull/144) reports `node --check`, a pool-size/unique-id check (8 animals, 6 colour sets) and that the new SVGs parse as XML, with no visual check. Manual checklist (not yet performed):

- [ ] Normal: drag a big animal to the big house; it settles inside and glows.
- [ ] Drag a small animal to the small house; same result.
- [ ] Incorrect interaction: drop a big animal on the small house, and an animal on empty ground; it floats back each time.
- [ ] Completion: place all four; both houses glow, and after about 4 s a new round with different animals fades in.
- [ ] Restart: leave and reopen; house colours and animals differ (at least sometimes).
- [ ] Randomization: over four rounds the animal types do not repeat; the bottom-row order changes each round; two house colours always differ.
- [ ] Progression: confirm no difficulty change.
- [ ] Portrait (about 360x640): all items visible, small animals at least 48 px.
- [ ] Landscape (about 640x360): houses and the waiting row do not overlap or overflow.
- [ ] Touch: drag two animals at once with two fingers; rotate the device mid-drag.
- [ ] Mouse: left-button drag works; right button does nothing.
- [ ] Keyboard: Tab to an animal, Enter selects, Enter on a house places or returns it.
- [ ] Reduced motion on: glides are short, fades still run.
- [ ] Background the tab during the glow and return.
- [ ] Browsers: Chrome desktop, Chrome Android, Safari iPhone/iPad.

## 18. Known limitations and open issues

**Confirmed (from code reading):**
- No automated tests.
- Small animals can be only 48 px, smaller than the 56 px used elsewhere.
- Animals and houses are drawn separately from the shared animal family, so the style differs from `js/animals.js` activities.
- Animal type order repeats identically after four rounds.

**Requires verification:**
- Layout on small landscape screens such as 640x360 (flagged in PR #75).
- Visual quality of the animal drawings added in PR #144 (no visual check was reported).

No open GitHub issue concerns this activity.

## 19. Planned improvements

None currently planned (no open issue).

## 20. Related activities and reusable components

- Sorting/matching with the same "glow then new round" pattern: [Kolorowe Kubeczki](kolorowe-kubeczki.md), [Kolorowe Kształty](kolorowe-ksztalty.md), [Koraliki](koraliki.md).
- Shared helper used: [`js/random.js`](../../js/random.js) (`Rand.pick`, `Rand.shuffle`). [`js/animals.js`](../../js/animals.js) is **not** used.

## 21. Change history

- [#49](https://github.com/BielinskiLukasz/child-page/issues/49) / [PR #75](https://github.com/BielinskiLukasz/child-page/pull/75): activity introduced.
- [#120](https://github.com/BielinskiLukasz/child-page/issues/120) / [PR #144](https://github.com/BielinskiLukasz/child-page/pull/144): random animals (pool of 8) and house colours (6 sets); later `Rand.shuffle` for the animal row (commit `6d5e22d`).
