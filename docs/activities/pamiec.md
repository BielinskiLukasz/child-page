# Pamięć

## 1. Overview

| Item | Value |
|---|---|
| Display name | Pamięć |
| Internal ID | `pamiec` (entry in [`js/activities.js`](../../js/activities.js)) |
| Description | A gentle memory game of large picture cards: turn over two cards at a time and find the matching pairs. |
| Category | Memory (matching) |
| Interaction type | Tap |
| CSS prefix | `pm-` |
| Source | [`js/pamiec.js`](../../js/pamiec.js), styles in [`css/style.css`](../../css/style.css) (section `/* Pamięć */`) |
| Status | Implemented; enabled by default (no `defaultOff`). Listed 29th in the README Activities list. |

## 2. Business purpose

Pamięć is the classic find-the-pair card game adapted for a very young child: it starts with only three pairs, never punishes a miss and adds a pair after every completed game up to ten pairs. It is the one activity that explicitly grows in difficulty, and it complements the purely open-ended activities with a short goal-oriented game. The game state is kept in memory only, so each visit begins gently again.

## 3. Activity flow

1. The child opens the activity (`#pamiec`); `deal()` creates game 1: 6 face-down cards (3 pairs).
2. All cards show the same lilac back with a dotted border and a small pattern.
3. The child taps a card; it turns over in about 0.6 s and shows a picture.
4. The child taps a second card. When both are fully open the game compares them.
5. **Match:** both cards glow and stay open. **No match:** after 1.5 s both cards turn back (0.6 s) with no shake, colour or message.
6. When every pair is found, all cards glow for about 3 s. About 7 s after the last match the cards turn back, fade softly while a new deal is made (0.8 s) and the next game starts with one more pair.
7. After 10 pairs (20 cards) the next games stay at 20 cards.
8. The child leaves with the Back button (see [shared behaviour](README.md#shared-platform-behaviour)); leaving resets the progression.

## 4. Rules and behavior

| Rule | Value (source) |
|---|---|
| Cards in game `n` (n = 0, 1, 2, ...) | `2 * min(MAX_PAIRS, START_PAIRS + n)` = 6, 8, 10, ... 20 (`START_PAIRS = 3`, `MAX_PAIRS = 10`) |
| Flip time | `FLIP_S = 0.6` s (0.36 s under reduced motion) |
| Mismatch wait | `BACK_AFTER_S = 1.5` s counted from when both cards are fully open |
| Completion glow | `GLOW_S = 3` s (ramps over 0.5 s), card glow on matched cards |
| Next game | `NEXT_AT_S = 7` s after the last match, then cards close and `SHUFFLE_S = 0.8` s shuffle fade |
| Valid touch | only in phase `play`; the card must be face down and not mid-flip; at most 2 cards open at once |
| Invalid touch | open or matched card, a card mid-flip, a third card, any touch outside phase `play` -> ignored silently |
| Comparison | by picture key; two different cards of the same key are a pair |

A matched card stays face up (`matched = true`) with a glow (`drop-shadow` `#ffe08a`). Two cards touched almost at once are safe because the comparison only starts when both are fully open (`f === 1`).

## 5. Educational and developmental benefits

**Intended design benefits** (not measured)

- Visual memory and attention (remembering where a picture was).
- Matching identical pictures.
- Patience: a miss simply resets, with no penalty.

**Directly observable behavior**

- The number of cards grows with each completed game up to 20.
- Misses give no negative feedback; matches give a glow.
- Pictures are all different in shape and colour within a game.

**Requires professional or research-based validation**

- Whether the 6 to 20 card progression suits the target age or improves memory. Nothing in the repository measures it.

## 6. Accessibility and usability

- **Input:** cards are `<button>` elements, so touch, mouse and keyboard (Tab, Enter/Space) work; `aria-pressed` and `aria-label` (`Karta (zakryta)` when face down, `Karta: <Polish name>` when face up, for example `Karta: kotek`) reflect the state. Because all face-down cards share one label, a screen-reader user cannot tell cards apart before turning them (inherent to the game).
- **Target size:** card size `C = clamp(best * 0.92, 56, 170)` px, minimum 56 px (`min-width/min-height: 56px` in CSS); the layout picks the column count that gives the largest square cards.
- **Orientation:** layout is recomputed on `resize` and `orientationchange`; game state is kept.
- **Colour:** pictures differ in shape as well as colour (a pear, a boat, a house...); no colour-only distinction is needed.
- **Sound:** none. **Reading:** not required.
- **Reduced motion:** the flip, glow and shuffle are driven by the rAF loop. Under `prefers-reduced-motion` cards cross-fade instead of flipping (no horizontal scale) and the flip is 0.36 s; glow and shuffle fade still run.
- **Touch behaviour:** `touch-action: manipulation`, text selection disabled, tap highlight removed.
- **Focus:** 4 px outline `#8f7fd1` on focused cards.
- **Limitations:** 20-card games have small cards on small screens (see section 15); a child must remember positions, which can be frustrating without hints (there are none).

## 7. Risks and limitations

- Difficulty can rise quickly: the 8th game already has 20 cards; `Requires verification` with the target age group.
- The game has no hint, undo or reduce-difficulty option; progression resets only by leaving the activity.
- On small screens the 20-card grid has cards close to the 56 px minimum.
- The same pictures can reappear in consecutive games (independent random draws).
- While two mismatched cards are open (1.5 s) and turning back (0.6 s) further taps are ignored; a child may tap and see nothing happen.
- No personal data is collected.

## 8. Configuration

There is no external configuration; constants inside [`js/pamiec.js`](../../js/pamiec.js):

| Name | Purpose | Type | Default |
|---|---|---|---|
| `START_PAIRS` | Pairs in the first game | number | `3` |
| `MAX_PAIRS` | Maximum pairs | number | `10` |
| `FLIP_S` | Flip time | s | `0.6` |
| `BACK_AFTER_S` | Wait before mismatched cards turn back | s | `1.5` |
| `GLOW_S` | Completion glow | s | `3` |
| `NEXT_AT_S` | Completion to next game | s | `7` |
| `SHUFFLE_S` | Shuffle fade | s | `0.8` |
| `P` / `POOL` | Picture definitions and key list | object / array | 14 pictures |
| Card size limits | `56` to `170` px, factor `0.92` | px | `layout` |

No fallback exists because nothing is read from outside. `MAX_PAIRS` must not exceed the pool size (14), otherwise `Rand.pick` would return fewer unique pictures.

## 9. Assets

No external files. All pictures are inline SVG strings in the `P` object (100 x 100 viewBox, rounded white card face): kotek (cat), rybka (fish), kwiatek (flower), ptaszek (bird), gruszka (pear), chmurka (cloud), serduszko (heart), gwiazdka (star), słoneczko (sun), księżyc (moon), jabłko (apple), balonik (balloon), łódka (boat), domek (house) = 14. The card back (`BACK`) is one shared SVG (lilac, dotted border, centre dot and four small dots). The menu icon is inline SVG in `js/activities.js`.

## 10. Randomization and variants

- **Per game:** `Rand.pick(POOL, n)` selects `n` unique pictures (n = number of pairs); each is duplicated and the 2n cards are ordered with `Rand.shuffle`.
- **Pool size:** 14. Since the maximum is 10 pairs, a game never uses more than 10 of the 14 pictures.
- **Repetition:** pictures can repeat across games; no previous-game exclusion (`Not implemented`). Within a game each picture appears exactly twice.
- **Persistence:** none; every launch starts at 6 cards.
- **Empty/invalid pool:** not applicable (constant pool).

## 11. Progression and difficulty

- **Initial level:** 3 pairs (6 cards).
- **Trigger:** a completed game (`round++` in the shuffle phase).
- **Levels:** game `n` has `min(10, 3 + n)` pairs: 3, 4, 5, 6, 7, 8, 9, 10, 10, 10, ...
- **Maximum:** 10 pairs (20 cards), repeated afterwards.
- **Reset:** leaving the activity discards `round`; nothing is persisted.
- **Layout by count:** grid is computed (see section 15); no fixed table of rows and columns.

## 12. Completion and feedback

- **Completion:** all cards matched.
- **Success feedback:** matched pairs glow and stay open; at the end every card glows for 3 s.
- **Failure feedback:** none; mismatched cards turn back after 1.5 s without shake, red colour or message.
- **After completion:** the cards close, fade and a new deal starts automatically.
- **Sound:** none.

## 13. Analytics and metrics

This activity reports to the shared on-device module `js/analytics.js` (`window.Analytics`). `js/app.js` records the activity start and end and the module counts touches inside the stage; `js/pamiec.js` calls `levelStart(n)` when a deck is dealt (n = number of cards) and `levelComplete(n)` plus `complete(n)` when all pairs are found. Recorded: starts, active time, replays, quick exits, touches, completions (a completion is all pairs found), exits before completion and the highest card count reached. Data stays on the device as anonymous daily aggregates; see [README.md](README.md#analytics-status).

## 14. Technical implementation

- **Entry point:** `mount(container)` in [`js/pamiec.js`](../../js/pamiec.js) replaces the `mount` of the `pamiec` registry entry and returns a cleanup function.
- **State:** `round` (game number), `deck`, `cards` (objects with flip value `f`, target `t`, `matched`, glow `g`, opacity `op`), `sel` (currently open unmatched cards), `phase` (`play`, `turnback`, `glow`, `close`, `shuffle`), `phaseT`, `backT`, `glow`, `shuf`.
- **Rendering:** each card is a `<button class="pm-card">` with two spans (back and front, each an SVG). The buttons are rebuilt for every game in `deal()`. Position and flip are applied as `transform: translate(...) scaleX(...)`; the picture is swapped at the half-way point; under reduced motion front and back cross-fade by opacity instead.
- **Animation:** one rAF loop (`frame`, `dt` capped at 50 ms) that continues only while something is changing and is cancelled when the tab is hidden, restarted by `start()` and `visibilitychange`.
- **Randomization:** [`js/random.js`](../../js/random.js) (`Rand.pick`, `Rand.shuffle`).
- **Persistence:** none. **Analytics:** `Analytics.levelStart` / `levelComplete` / `complete`.
- **Cleanup:** cancels the frame and removes the `resize`, `orientationchange`, `visibilitychange` listeners and the board.

## 15. Responsive layout and coordinate system

- `.pm-field` is inset 64 px from the top (plus safe area) and 12 px elsewhere.
- `layout()` tries every column count `k` from 1 to the card count, with `rows = ceil(n / k)`, and keeps the one that maximises the square size `min(fw / k, fh / rows)`. Card size `C = clamp(best * 0.92, 56, 170)` is exposed as the CSS variable `--pm-c`.
- Gaps are spread evenly; an incomplete last row is centred. Positions (card centres) are in field pixels and applied as `translate(x - C/2, y - C/2)`.
- Cards share one pixel coordinate space; there is no scaling of an artwork board.
- PR [#149](https://github.com/BielinskiLukasz/child-page/pull/149) reports computed 20-card sizes of 68 px on a 296 x 400 field in both orientations and 75 px on a 568 x 252 field. These were numerical checks in the PR, not device tests, and the PR asked for a device review.

## 16. Error and edge-case handling

| Case | Behaviour |
|---|---|
| Missing assets | Not applicable. |
| Rapid taps | Third and mid-flip taps ignored; simultaneous taps on two cards are safe. |
| Resize/orientation change | `layout` re-flows cards; flip and match state is kept. |
| Tab hidden | Loop cancelled and restarted on return; timers use the capped frame step, so a long absence does not skip the sequence. |
| Leaving mid-game | Cleanup cancels the frame; nothing is stored. |
| Insufficient unique items | Not applicable: 14 pictures against at most 10 pairs. |
| Unsupported `matchMedia` | `reduced()` returns `false`. |
| Touch cancellation | Not relevant: only `click` is used. |

## 17. Testing

**Automated tests:** none (see [shared behaviour](README.md#shared-platform-behaviour)). PR [#149](https://github.com/BielinskiLukasz/child-page/pull/149) reports `node --check` and numeric layout checks for 6 to 20 cards; PR [#84](https://github.com/BielinskiLukasz/child-page/pull/84) states there was no browser in the sandbox. Neither is re-verified here.

**Manual scenarios (not yet recorded as performed):**

- [ ] Normal: start a game, flip two matching cards (they stay open and glow) and two different cards (they turn back after about 1.5 s).
- [ ] Incorrect interaction: tap an open card, a third card while two are open, and cards during the turn-back; all are ignored.
- [ ] Completion: find every pair; confirm the 3 s glow, the closing, the shuffle fade and a new game with one more pair.
- [ ] Progression: play until the 8th game (20 cards) and confirm the count stays at 20.
- [ ] Randomization: confirm pictures and positions differ between games and launches; each picture appears exactly twice.
- [ ] Restart: leave and re-open; the game starts again with 6 cards.
- [ ] Portrait and landscape: check 6, 12 and 20 cards at 320 x 568, 568 x 320 and a tablet; cards at least 56 px and fully visible; rotate mid-game.
- [ ] Touch: tap with a finger; try to tap two cards at the same moment.
- [ ] Mouse and keyboard: click; Tab and Enter/Space.
- [ ] Background/foreground: hide the tab during the mismatch wait and during the glow.
- [ ] Reduced motion: cards cross-fade instead of turning.
- [ ] Browsers: Chrome desktop, Chrome Android, Safari iPhone/iPad.

## 18. Known limitations and open issues

**Confirmed**

- No automated tests. Analytics is covered in section 13.
- Pictures can repeat across consecutive games; there is no hint or reduced-difficulty option.
- All face-down cards share one `aria-label`.

**Requires verification**

- Card legibility and touch comfort for the 20-card game on small phones.
- Whether the difficulty increase after each game suits the target age.

## 19. Planned improvements

None currently planned (no open issue targets this activity).

## 20. Related activities and reusable components

- Another matching activity (by silhouette instead of picture): [Cienie](cienie.md).
- Shared helper: [`js/random.js`](../../js/random.js) (`Rand.pick`, `Rand.shuffle`). It does not use `js/animals.js`.

## 21. Change history

- [#58](https://github.com/BielinskiLukasz/child-page/issues/58) / PR [#84](https://github.com/BielinskiLukasz/child-page/pull/84): activity added with 6 cards and three fixed picture sets.
- [#125](https://github.com/BielinskiLukasz/child-page/issues/125) / PR [#149](https://github.com/BielinskiLukasz/child-page/pull/149): pool of 14 pictures and progression from 6 to 20 cards.
