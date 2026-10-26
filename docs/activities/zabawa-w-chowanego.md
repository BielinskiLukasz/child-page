# Zabawa w chowanego

## 1. Overview

| Item | Value |
|---|---|
| Display name | Zabawa w chowanego |
| Internal ID | `chowany` (entry in [`js/activities.js`](../../js/activities.js)) |
| Description | A garden with four hiding places (krzak, pudło, drzewo, beczka). Touching a place slowly lifts its cover and shows what hides there: an animal peeking out, or a flower when the place is empty. |
| Category | Observation / cause and effect (peek-a-boo style) |
| Interaction type | Tap (button `click`) |
| Status | Implemented; enabled by default in the menu (no `defaultOff`) |
| Source | [`js/chowany.js`](../../js/chowany.js), CSS block `/* Zabawa w chowanego */` in [`css/style.css`](../../css/style.css) (prefix `hd`) |

## 2. Business purpose

Based on the issue and the code, the activity offers a slow, predictable "where is it hiding?" game: the child lifts covers one at a time and sees what is behind. Nothing can be answered wrongly, nothing is timed against the child and nothing is scored. It complements the drag-based sorting activities (for example [Koraliki](koraliki.md)) with the simplest possible interaction, a single tap, and complements the other animal activities by using the shared animal family with a hide-and-reveal mechanic. The set of animals changes on every launch, so repeated play shows different characters.

## 3. Activity flow

1. The child opens the activity from the menu (`#chowany`); `mount` builds the scene and starts the animation loop immediately.
2. Four closed hiding places are shown on a sky-to-grass gradient. Three hide an animal, one hides a flower (not visible while closed).
3. The child taps a place. The cover slides up and fades (about 1.5 s) and the animal (or flower) is revealed; the animal then makes one small hop (0.7 s).
4. Tapping an open place closes it again (about 1.5 s). Taps on a place that is currently moving are ignored.
5. Completion: when every one of the four places has been opened at least once (and nothing is moving), all four glow warmly for 2 s, then all covers close slowly.
6. After the covers have closed, the animals fade out and back in (0.9 s) and reappear in a new arrangement. The child can start opening places again straight away.
7. There is no end: the cycle repeats indefinitely. While all places are closed and nothing has been touched for 7 s, two places quietly swap their occupants with a short fade.
8. The child leaves with the Back button (see [README.md](README.md#shared-platform-behaviour)).

## 4. Rules and behavior

| Rule | Value (from `js/chowany.js`) |
|---|---|
| Hiding places | 4: krzak (bush), pudło (box), drzewo (tree), beczka (barrel) |
| Occupants | Exactly 3 animals and 1 flower at any time |
| Cover open/close duration | `MOVE_S = 1.5` s (0.75 s when reduced motion is requested) |
| Cover motion | Moves up by 38% of its height (`translateY(-38 * u %)`) and fades to 40% opacity; with reduced motion it does not move and fades to 0% opacity |
| Hop after opening | `HOP_S = 0.7` s, peak 7% of the box height; skipped with reduced motion |
| Completion glow | `GLOW_S = 2` s, yellow drop-shadow (`#ffe08a`, 6-20 px blur) on all places, eased with time constant 0.4 s |
| Rearrangement fade | `FADE_S = 0.9` s; arrangement is changed at the half-way point |
| Idle swap | After `SWAP_IDLE_S = 7` s with all covers closed and no animation running |
| Input while moving | A tap on a moving place, or any tap during the glow and closing phases, is ignored (`toggle`) |
| Wrong answers | None; there is no failure, scoring or timer |

- The tree's animal is shifted 26% to the right (`ox: 26`) so it peeks from behind the trunk and foliage; the other places use 0.
- Opening state is tracked per place (`opened`) and reset when the round rearranges.
- Sound: none ([shared behaviour](README.md#shared-platform-behaviour)).

## 5. Educational and developmental benefits

**Intended design benefits** (stated by the code comments and the README, not measured):
- Cause and effect: a touch produces a visible, slow result.
- Object permanence style play and calm observation of animals.
- Simple, independent tapping with no wrong action.

**Directly observable behavior:**
- Each tap reveals one occupant; the reveal is slow and ends with a single small hop.
- All places opened leads to a gentle glow and a new arrangement.
- No timers, scores or failure messages are shown.

**Requires professional or research-based validation:** any claim about attention, memory or developmental effect. The repository contains no evidence for such claims.

## 6. Accessibility and usability

- **Input:** touch and mouse via `click` on native `<button>` elements; keyboard works through the native button behaviour (Tab, Enter/Space) with a visible `:focus-visible` outline (4px `#8f7fd1`). Stylus is treated as a pointer click.
- **Screen readers:** each place has `aria-label="Kryjówka: <name>"` and an `aria-expanded` state that follows opening and closing. The occupant itself is not announced (its SVG is `aria-hidden`).
- **Target size:** square buttons `--hd-s` between 64 and 200 px (CSS `min-width/min-height: 64px`); computed in `layout()` from the field size.
- **Orientation:** portrait (height >= width) uses a 2x2 grid, landscape a single row of four; layout is recomputed on `resize` and `orientationchange`.
- **Reduced motion:** the global rule disables CSS animations and transitions ([README.md](README.md#shared-platform-behaviour)), but this activity's motion is driven from a `requestAnimationFrame` loop with inline styles, so it still works. With `prefers-reduced-motion: reduce` it switches to a gentler variant: covers fade instead of sliding, no hop, 0.75 s opening time. The completion glow is still shown.
- **Colour:** not used for any decision; places are distinguished by shape.
- **Reading:** no reading required. A young child can use it independently.
- **Limitations:** the only text is the (non-visible) aria labels, which are in Polish. Occupants are not announced to assistive technology.

## 7. Risks and limitations

- The activity has no formal ending; the cycle repeats until the child leaves (the playtime limit in [README.md](README.md#shared-platform-behaviour) still applies).
- The unrequested idle swap (every 7 s with nothing touched) changes what is behind a closed cover; it is visible only as a short fade of the animal layer behind the covers, but it could be surprising if a child expects a fixed hiding place.
- Opening a place during an idle swap fade shows the swapped occupant appearing while the cover is open (see section 16).
- Soft glow uses `drop-shadow` filters on four elements for 2 s; this may be costly on very slow devices (requires verification).
- No privacy concerns: nothing is stored and nothing is sent.

## 8. Configuration

The activity has no external configuration; everything is a constant in [`js/chowany.js`](../../js/chowany.js). Tunable constants (all numbers, change only by editing the file):

| Name | Purpose | Type | Default | Location |
|---|---|---|---|---|
| `MOVE_S` | Open/close duration (seconds) | number | 1.5 | top of IIFE |
| `GLOW_S` | Completion glow duration (s) | number | 2 | top of IIFE |
| `HOP_S` | Hop after opening (s) | number | 0.7 | top of IIFE |
| `SWAP_IDLE_S` | Idle time before an idle swap (s) | number | 7 | top of IIFE |
| `FADE_S` | Fade out/in used by swap and rearrangement (s) | number | 0.9 | top of IIFE |
| `PLACES` | Four places: label, horizontal offset `ox`, cover SVG | array | see code | top of IIFE |
| Layout numbers | Max size 200, min size 64, 0.92 scale factor, 0.4 extra row for the animal head room | numbers | see `layout()` | `layout()` |

There is no fallback for invalid values because no value is read from outside.

## 9. Assets

No external asset files. Everything is inline SVG built from string constants: the four cover drawings (`PLACES[].cover`), the flower (`FLOWER`) and the animal figure (`animalSvg`: a body ellipse in the animal's fur colour plus `Animals.head(id)` from [`js/animals.js`](../../js/animals.js), scaled 1.3). The background is a CSS gradient (`.hd`, `#d9eefb` to `#e8f5dc` to `#cfe8b8`). The menu icon is inline SVG in `js/activities.js` (green bush with rabbit ears and a yellow sun). No fonts, audio or images.

## 10. Randomization and variants

| What | How | Pool |
|---|---|---|
| Four animals for the launch | `Animals.pick(4)` (unique) | 13 animals in the shared family |
| Which place is empty | `Math.floor(Math.random() * 4)` | 4 places |
| Which 3 of the 4 chosen animals are out | `Rand.pick([0,1,2,3], 3)` | 4 indices |
| New arrangement after a round | `arrangement(old)`; repeated until it differs from the previous arrangement | - |
| Idle swap | One random pair from the pairs whose occupants differ | at most 6 pairs |

- Choice of the four animals persists until the activity is left; it is re-chosen every time it is opened. Nothing is stored.
- Because exactly one animal is "waiting" at any time, over a number of rounds every chosen animal appears.
- The idle swap does nothing if no pair differs (cannot happen with 3 animals and 1 flower; guard `if (!pairs.length) return`).

## 11. Progression and difficulty

No progression, levels or difficulty. Behaviour is identical for every round and nothing is persisted.

## 12. Completion and feedback

- Completion is informal: all four places opened at least once. Feedback is a 2 s yellow glow around all places, then slow closing and a fade to a new arrangement. No sound, text or score.
- There are no failure states; any tap is valid, and taps during movement are ignored silently.
- A new round starts automatically after the rearrangement fade.

## 13. Analytics and metrics

This activity reports to the shared on-device module `js/analytics.js` (`window.Analytics`) through the app shell only: `js/app.js` records the activity start and end, and the module counts touches inside the stage. The activity file itself calls no `Analytics` function. Recorded for it: starts, active time, replays (re-opening in the same session), quick exits (within 10 s) and touches. It is open-ended, so no completion, level or exit-before-completion is defined for it. Data stays on the device as anonymous daily aggregates; see [README.md](README.md#analytics-status).

## 14. Technical implementation

- **Entry point:** `mount(container)` in [`js/chowany.js`](../../js/chowany.js), registered by replacing `mount` of the `chowany` entry. It returns `cleanup`.
- **Rendering:** DOM: `div.hd > div.hd-field > 4 x button.hd-spot`. Each button holds an inline-SVG flower, an animal container and a cover SVG (class `hd-cov`). Buttons are positioned by `transform: translate()` in `layout()`.
- **State:** per-place object `{ o (current openness 0..1), t (target 0/1), opened, hop, op, shown }`; global `occ` (occupant per place: animal index 0-3 or -1 for the flower), `phase` (`play`, `glow`, `close`), `phaseT`, `idleT`, `glow`, `fadeJob`.
- **Animation:** one `frame()` loop with dt capped to 0.05 s. `o` moves linearly towards `t` and is shaped with `smooth` (smoothstep) in `paintSpot`. The loop requests the next frame only while the page is visible.
- **Phases:** `play` -> (all opened) `glow` (2 s) -> `close` (all targets 0; when nothing moves, start a fade job that applies `arrangement(old)` at 50%) -> `play`.
- **Events:** `click` on each button; `resize`, `orientationchange` and `visibilitychange` on window/document.
- **Dependencies:** `window.Animals` (`pick`, `head`) and `window.Rand` (`pick`).
- **Persistence:** none. **Analytics:** none from the activity itself (reported by `js/app.js`).
- **Cleanup:** cancels the animation frame, removes the three listeners and removes the board.

## 15. Responsive layout and coordinate system

- `.hd` fills the viewport (`position: fixed; inset: 0`); `.hd-field` is inset by the safe-area variables plus 64 px at the top (room for the Back button) and 12 px on the other sides.
- `layout()` reads the field size: portrait (`fh >= fw`) gives `cols = 2, rows = 2`, otherwise `cols = 4, rows = 1`. Size `S = max(64, min(200, fw/cols*0.92, fh/(rows+0.4)*0.92))`, stored in CSS variable `--hd-s`. Rows are centred vertically with an extra 0.4*S on top for the animal that appears above the cover.
- Each cover/animal/flower SVG uses `viewBox="0 0 100 100"` and fills its button, so artwork scales with `S`. Hop and cover movement use percentages of the button height, so they scale too.
- Orientation change and resize call `layout()`; there is no other scaling logic.
- Very small fields are clamped to 64 px; the grid may overflow the field in that case (requires verification).

## 16. Error and edge-case handling

| Case | Handling |
|---|---|
| Missing assets | N/A (inline SVG). If `window.Animals`/`window.Rand` were missing the mount would throw (no guard). |
| Resize / rotation | `layout()` re-run; animation state is unaffected. |
| Backgrounding | The loop stops while `document.hidden` and restarts on return; dt is capped so nothing jumps. |
| Rapid taps | Ignored while a place is moving or while the phase is not `play`. |
| Tap during idle-swap fade | Allowed; the swap is applied at the 50% point even if that place was just opened (the occupant changes behind the lifted cover). |
| Unsupported `matchMedia` | `reduced()` falls back to normal motion. |
| Touch cancel | Uses `click`, so a cancelled touch simply produces no tap. |
| Leaving mid-animation | `cleanup` cancels the frame; all state is local to `mount`. |

## 17. Testing

No automated tests exist for this activity or the repository ([README.md](README.md#shared-platform-behaviour)). Manual checklist (not yet performed unless noted):

- [ ] Normal: tap a place; the cover rises over about 1.5 s and the animal or flower appears, with one small hop.
- [ ] Tap an open place; it closes; taps while it is moving are ignored.
- [ ] Completion: open all four places once; they glow for about 2 s, close, and the animals appear in a different arrangement.
- [ ] Incorrect interaction: tap rapidly on several places, tap during glow and closing; nothing breaks and no failure feedback appears.
- [ ] Restart: leave and reopen; new random set of four animals and arrangement.
- [ ] Randomization: over several rounds the arrangement never equals the previous one; exactly one place shows a flower.
- [ ] Idle swap: leave all places closed for about 7 s; two occupants swap with a short fade when opened afterwards.
- [ ] Progression: confirm that no difficulty change occurs.
- [ ] Portrait: 2x2 grid, all four places fully visible, buttons at least 64 px.
- [ ] Landscape: one row of four; rotate while a cover is open and check nothing is cut off.
- [ ] Touch (iPhone/iPad, Android): taps register once; no zoom or scroll.
- [ ] Mouse (desktop): click works; keyboard Tab/Enter opens and closes places with a visible focus ring.
- [ ] Reduced motion (OS setting on): covers fade instead of sliding, no hop, glow still shown.
- [ ] Background/foreground: switch tabs mid-opening and return; the animation continues without a jump.
- [ ] Browsers: Chrome desktop, Chrome Android, Safari iPhone/iPad (the README's required set).

PR [#81](https://github.com/BielinskiLukasz/child-page/pull/81) is the introducing pull request; this document did not independently verify its test claims.

## 18. Known limitations and open issues

**Confirmed (from code reading):**
- No automated tests.
- Idle swap or rearrangement can change an occupant behind an already lifted cover if the child opens a place during the fade (section 16).
- Occupants are not exposed to assistive technology; only the places have labels.
- No open GitHub issue references this activity.

**Requires verification:**
- Layout on very small viewports (below the 64 px minimum cell).
- Rendering cost of the glow filters on slow devices.

## 19. Planned improvements

None currently planned (no open issue).

## 20. Related activities and reusable components

- Shared helpers: [`js/animals.js`](../../js/animals.js) (`Animals.pick`, `Animals.head`) and [`js/random.js`](../../js/random.js) (`Rand.pick`).
- Other activities that draw their animals from the shared family: [Zwierzątka na Farmie](zwierzatka-na-farmie.md) and [Kąpiel Zwierzątek](kapiel-zwierzatek.md).
- Rearranging after completion follows the same "soft glow then new round" pattern as [Koraliki](koraliki.md) and [Duże i Małe](duze-i-male.md).

## 21. Change history

- [#55](https://github.com/BielinskiLukasz/child-page/issues/55) / [PR #81](https://github.com/BielinskiLukasz/child-page/pull/81): activity introduced.
- [#113](https://github.com/BielinskiLukasz/child-page/issues/113): random animal pool via the shared helpers (commit `dae142c`).
