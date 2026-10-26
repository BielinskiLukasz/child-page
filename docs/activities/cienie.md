# Cienie

## 1. Overview

| Item | Value |
|---|---|
| Display name | Cienie |
| Internal ID | `cienie` (entry in [`js/activities.js`](../../js/activities.js)) |
| Description | Three grey animal shadows on top and the three matching coloured animals below; the child drags each animal onto its own shadow. |
| Category | Matching (shape/silhouette matching) |
| Interaction type | Drag and drop (pointer events); keyboard alternative: select an animal, then select a shadow |
| CSS prefix | `ci-` |
| Source | [`js/cienie.js`](../../js/cienie.js), styles in [`css/style.css`](../../css/style.css) (section `/* Cienie */`) |
| Status | Implemented; enabled by default in the menu (no `defaultOff`). Listed 27th in the README Activities list. |

## 2. Business purpose

Cienie gives the child a calm matching task that relies on silhouette shape rather than on reading or colour: the shadows are all one grey, so the only cue is the outline. It reuses the layout approach of [Kolorowe Kształty](kolorowe-ksztalty.md) (PR #83) but with recognisable animals, and it stays consistent with the application's no-failure principle: a wrong drop simply floats back, with no message, shake, red colour or sound.

## 3. Activity flow

1. The child opens the activity from the menu (hash route `#cienie`); `mount` builds the board and picks the first set of animals at random.
2. Three grey shadows are shown in a row at the top; the three coloured animals are shown in a row at the bottom in a mixed order (no animal starts directly under its own shadow).
3. The child presses an animal and drags it. The animal follows the finger or pointer and is clamped so its centre stays inside the visible screen.
4. On release within 0.75 x the animal size (`S * 0.75`) of its own shadow, the animal glides into the shadow and stays there with a soft glow; the shadow dims to 30% opacity. On release anywhere else, the animal glides back to its home slot.
5. When all three animals are placed, the whole picture glows (about 3 s).
6. About 7 s after the third animal settled, the board fades out (0.6 s), a new set of three animals is loaded and the board fades back in (0.6 s).
7. The loop repeats indefinitely; there is no separate restart control. Leaving and re-opening the activity starts a fresh random set.
8. The child leaves with the Back button (see [shared behaviour](README.md#shared-platform-behaviour)).

## 4. Rules and behavior

| Rule | Value (source) |
|---|---|
| Shadows per round | 3, evenly spread at `fw * (i + 0.5) / 3`, vertical position `S / 2 + 4` (`layout`) |
| Animal size `S` | `max(64, min(140, fw / 3.6, fh * 0.3))` px |
| Snap distance | animal centre closer than `S * 0.75` to its own shadow centre (`up`) |
| Wrong drop | `sendHome`: glides back to the home slot; no feedback |
| Home slot | `fw * (slot + 0.5) / 3`, `y = max(fh - S/2 - 4, S * 1.6)` |
| Glide duration | `min(1400, 700 + distance * 0.8)` ms; 300 ms under reduced motion; 200 ms for a re-layout glide |
| Placed animal | `placed = true`, button disabled and `tabIndex = -1`, cannot be moved again in the round |
| Completion glow | `GLOW_S = 3000` ms |
| Next round | `NEXT_S = 7000` ms after all three are placed; fade `FADE_S = 600` ms each way |
| Input lock | pointer-down ignored while a round change is fading (`fadeDir !== 0`) |
| Multi-touch | each animal tracks its own `pointerId`, so several animals can be dragged at once |
| Mouse buttons | pointer-down with `button > 0` is ignored |
| Resize during a drag | the drag is cancelled and the animal returns home (`layout` -> `cancelDrag`) |

Timing values use the capped frame step (`dt` capped at 50 ms), so on a very slow device the sequence takes longer in wall-clock time.

Keyboard: `Enter`/`Space` on an animal button selects it (`aria-pressed`, outline `ci-selected`); activating a shadow button then snaps the animal if it is the right one, otherwise sends it home. Selecting a selected animal deselects it.

## 5. Educational and developmental benefits

**Intended design benefits** (from the code comments and README, not measured):

- Visual perception of silhouettes and shape discrimination.
- Hand-eye coordination through dragging.
- Calm, failure-free practice with immediate soft feedback.

**Directly observable behavior**

- Shadows are drawn in one colour (`#c4c0d4`) with no inner detail, so only the outline identifies the animal.
- The three animals in a round always have different silhouettes (see section 10).
- Correct placement fills the shadow with the animal and adds a glow; wrong placement only returns the animal.

**Requires professional or research-based validation**

- Any claim about developmental benefit or learning effect. Nothing in the repository measures it.

## 6. Accessibility and usability

- **Input:** touch, mouse and stylus via Pointer Events (pointer capture); keyboard via the select-then-place flow above. The animal buttons have `aria-label` such as `kotek (Enter lub spacja, potem wybierz cień)`; the shadow buttons have `Cień: <name>`.
- **Target size:** animals and shadows are at least 64 x 64 px (`min-width/min-height: 64px`, size `S` up to 140 px).
- **Orientation:** the field fills the screen below the Back button (top offset `64px` plus safe area); layout is recomputed on `resize` and `orientationchange` and works in portrait and landscape.
- **Colour:** matching does not depend on colour (the shadows are grey and identical in colour); the coloured fill is only the reward.
- **Sound:** none (the application is silent).
- **Reading:** not required.
- **Reduced motion:** the glide, glow and fade are driven by one `requestAnimationFrame` loop that sets styles from JavaScript, so they are not removed by the global CSS rule. Under `prefers-reduced-motion` only the glide time is shortened to 300 ms (`reduced()`); the glow and fades still run.
- **Focus:** a 4 px outline (`#8f7fd1`) marks focused or selected items.
- **Touch behaviour:** `.ci`, `.ci-item` use `touch-action: none` so dragging is not turned into scrolling; text selection is disabled.
- **Limitations:** a child needs enough motor control to drag; the keyboard path needs two actions per match.

## 7. Risks and limitations

- Whether every pair of silhouettes from different groups is easy to tell apart for a young child at the smallest size is not established in the repository (`Requires verification` on real devices).
- Fills of grey versus soft colours rely on low-saturation pastels; contrast of the grey shadow against the pale background (`#f3eefb` to `#e2f3dc` gradient) is low by design.
- A child may drag an animal around for a long time; there is no timeout or hint.
- The activity loops indefinitely with new rounds; there is no natural end other than leaving.
- No personal data is collected or stored.

## 8. Configuration

There is no external configuration; all values are constants inside [`js/cienie.js`](../../js/cienie.js). Tunable constants:

| Name | Purpose | Type | Default | Location |
|---|---|---|---|---|
| `SHADOW` | Shadow fill colour | CSS colour | `#c4c0d4` | top of IIFE |
| `GLOW_S` | Duration of the completion glow | ms | `3000` | top of IIFE |
| `NEXT_S` | Time from completion to the next round | ms | `7000` | top of IIFE |
| `FADE_S` | Fade time of a round change | ms | `600` | top of IIFE |
| `EXTRA` | Three hand-drawn animals (bird, fish, turtle) | array | 3 entries | top of IIFE |
| size formula | `S` between 64 and 140 px | px | see section 4 | `layout` |
| snap factor | Snap radius as a multiple of `S` | number | `0.75` | `up` |

The sets per round (3) are fixed by the DOM that `mount` builds. Invalid or missing values have no fallback because nothing is read from outside.

## 9. Assets

No external asset files. Everything is inline SVG generated in JavaScript:

- 13 animals from the shared family (`Animals.head`, see [`js/animals.js`](../../js/animals.js)), drawn with a small body (`body: true`); the shadow variant passes `shadow: '#c4c0d4'`.
- 3 hand-drawn full-body animals (bird `ptak`, fish `rybka`, turtle `żółw`) in `EXTRA`, drawn in a 100 x 100 box with placeholder `@@` replaced by the fill colour.
- Menu icon: inline SVG in the registry entry in `js/activities.js`.

No fonts, images or audio. No unused assets found.

## 10. Randomization and variants

- **Pool:** 16 entries: the 13 shared animals plus bird, fish and turtle. Entries are grouped by silhouette group (`sil`): the shared family has 10 groups (for example `round` = bear, panda, koala; `point` = cat, fox), the extras add `bird`, `fish`, `turtle` (13 groups in total).
- **Selection (`nextSet`):** the pool is shuffled with `Rand.shuffle`; entries are taken in order, skipping any whose group is already in the set, until 3 are chosen. So a set never contains two animals of one silhouette group.
- **No immediate repeat:** the loop repeats until the set (compared by sorted ids) differs from the previous round's set. The same single animal may still appear in consecutive rounds, only the identical trio is excluded.
- **Mixing:** `rotation()` randomly returns slots `[1, 2, 0]` or `[2, 0, 1]`, so no animal starts under its own shadow.
- **First round:** a fresh random set on every launch; nothing is stored.
- **Terminating:** there are always at least 13 groups, so a 3-element set is always available; there is no empty-pool handling because the pool is a constant.

## 11. Progression and difficulty

No progression: every round has three animals with a fixed layout and no change of difficulty. Nothing persists between rounds or sessions.

## 12. Completion and feedback

- **Completion:** all three animals placed (`items.every(placed && mode === 'idle')`).
- **Feedback for a correct drop:** glide, the shadow dims to 30% opacity, the animal gets a soft glow (`drop-shadow` in the animal's own colour).
- **Feedback for a wrong drop:** the animal glides back; nothing else.
- **Celebration:** a warm radial glow (`.ci-glow`) over the whole board for about 3 s, plus extra glow on the animals.
- **Afterwards:** a new round fades in automatically; no input is needed.
- **Sound:** none.

## 13. Analytics and metrics

This activity reports to the shared on-device module `js/analytics.js` (`window.Analytics`) through the app shell only: `js/app.js` records the activity start and end, and the module counts touches inside the stage. The activity file itself calls no `Analytics` function. Recorded for it: starts, active time, replays (re-opening in the same session), quick exits (within 10 s) and touches. It is open-ended, so no completion, level or exit-before-completion is defined for it. Data stays on the device as anonymous daily aggregates; see [README.md](README.md#analytics-status).

## 14. Technical implementation

- **Entry point:** `mount(container)` in [`js/cienie.js`](../../js/cienie.js) replaces the `mount` of the registry entry whose `id === 'cienie'`; it returns a `cleanup` function. Script tag order in `index.html`: `cienie.js` is loaded before `app.js`.
- **State:** closure variables in `mount` (`set`, `slots`, `items`, `shadows`, `selected`, timers `doneT`, `fade`, `fadeDir`); per-animal state objects hold position, glide data and mode (`idle`, `drag`, `glide`).
- **Rendering:** a fixed DOM of three shadow `<button>` elements and three animal `<button>` elements inside `.ci-field`, each holding one inline SVG; positions are set through `transform: translate(...)`. A `.ci-glow` div carries the completion glow.
- **Animation:** a single capped-step (`dt <= 50 ms`) `requestAnimationFrame` loop `frame`; it runs only while something is moving (glide, glow, fade, completion timer) and is restarted by `start()`; it is cancelled when `document.hidden` and restarted on `visibilitychange`.
- **Events:** `pointerdown`/`pointermove`/`pointerup`/`pointercancel`/`lostpointercapture` on each animal; `click` with `detail === 0` (keyboard activation) selects; `click` on shadows places the selected animal; `resize` and `orientationchange` re-run `layout`.
- **Randomization:** `Rand.shuffle` from [`js/random.js`](../../js/random.js) and `Animals.LIST`/`Animals.head`.
- **Persistence:** none.
- **Cleanup:** cancels the animation frame, removes the `resize`, `orientationchange` and `visibilitychange` listeners and removes the board from the DOM.
- **Dependencies:** `window.Animals`, `window.Rand` (both loaded before the activity scripts).

## 15. Responsive layout and coordinate system

- The board `.ci` is `position: fixed; inset: 0`; the playing field `.ci-field` is inset 64 px from the top (plus `--safe-t`) and 12 px on the other sides (plus safe-area insets).
- All positions are measured in CSS pixels relative to the field (`fw` x `fh`, read from `getBoundingClientRect` in `layout`). Shadows, home slots and dragged animals share this one pixel coordinate space; there is no viewBox scaling of the layout.
- Item size `S` scales with the width and height of the field (section 4); each animal's SVG uses a `0 0 100 100` viewBox.
- Home slots sit in a row at the bottom; the shadows sit in a row at the top. In a very short landscape field the home row y is at least `S * 1.6`, keeping the animals below the shadows.
- During a drag the centre is clamped inside the window (`window.innerWidth/innerHeight`), so an animal cannot be lost off-screen.

## 16. Error and edge-case handling

| Case | Behaviour |
|---|---|
| Missing assets | Not applicable (no external assets). |
| Empty pool / too few groups | Not applicable; the pool is constant and has 13 silhouette groups. |
| Resize or orientation change | `layout` recomputes positions; a dragged animal is cancelled and sent home; gliding animals restart a 200 ms glide to the new target. |
| Tab hidden | The frame loop is cancelled and resumes on `visibilitychange`. |
| Rapid or multi-touch input | Each animal handles its own pointer; a placed animal cannot be grabbed; input is ignored during the round fade. |
| Touch cancellation | `pointercancel` and `lostpointercapture` end the drag like a release (snap or send home). |
| Synthetic or unsupported pointer capture | `setPointerCapture` and `releasePointerCapture` are wrapped in `try/catch`. |
| Unsupported `matchMedia` | `reduced()` falls back to `false`. |

## 17. Testing

**Automated tests:** none exist (see [shared behaviour](README.md#shared-platform-behaviour)). PR [#83](https://github.com/BielinskiLukasz/child-page/pull/83) reports `node --check` and a stubbed run; this documentation does not re-verify it.

**Manual scenarios (not yet recorded as performed):**

- [ ] Normal: drag each of the three animals onto its own shadow; each glides in and fills the shadow.
- [ ] Completion: after the third animal, the glow appears for about 3 s and a new set fades in about 7 s after the last placement.
- [ ] Incorrect interaction: drop an animal on a wrong shadow and on empty space; it floats back with no message.
- [ ] Restart/replay: play several rounds in a row; leave and re-open the activity to get a fresh set.
- [ ] Randomization: over many rounds check that no round shows two animals with a similar outline (for example cat and fox) and that the same trio never appears twice in a row.
- [ ] Progression: confirm that nothing changes in difficulty between rounds.
- [ ] Portrait: 320 x 568 up to a tablet; all six items visible, at least 64 px.
- [ ] Landscape: 568 x 320 and 1920 x 1080; shadows stay above the animals; rotate during a drag and during the glow.
- [ ] Touch: drag with one finger; try two fingers on two animals; try to drag a placed animal.
- [ ] Mouse: click-drag, right-click (ignored), keyboard Tab/Enter/Space select-and-place flow.
- [ ] Background/foreground: switch tabs during the 7 s timer and during a glide; the sequence resumes without a jump.
- [ ] Browsers: Chrome desktop, Chrome Android, Safari iPhone/iPad (as required by the README).
- [ ] Reduced motion: enable the OS setting and confirm the glide is shorter and the activity still completes.

## 18. Known limitations and open issues

**Confirmed**

- No automated tests.
- Analytics is covered in section 13.
- The keyboard flow is the only non-pointer path; there is no arrow-key dragging.

**Requires verification**

- Visual distinguishability of all silhouette groups at the smallest size (64 px).
- Behaviour of the animation timers on very slow devices (they scale with the capped frame step).

## 19. Planned improvements

None currently planned. (No open issue targets this activity; issue [#168](https://github.com/BielinskiLukasz/child-page/issues/168) is this documentation task.)

## 20. Related activities and reusable components

- Similar drag-and-match layout: [Kolorowe Kształty](kolorowe-ksztalty.md) (PR #83 says Cienie uses the same proven layout); another matching game: [Pamięć](pamiec.md).
- Shared helpers: [`js/random.js`](../../js/random.js) (`Rand.shuffle`) and [`js/animals.js`](../../js/animals.js) (`Animals.LIST`, `Animals.head`, with the `shadow` option used only here and in [Kąpiel Zwierzątek](kapiel-zwierzatek.md)).
- Other activities that draw animals from the shared family: Buźki ([buzki.md](buzki.md)), Kąpiel Zwierzątek.

## 21. Change history

- [#57](https://github.com/BielinskiLukasz/child-page/issues/57) / PR [#83](https://github.com/BielinskiLukasz/child-page/pull/83): activity added (originally with the CSS prefix `cn-`; commit "give Cienie its own ci- CSS prefix" renamed it after a review found a collision).
- [#113](https://github.com/BielinskiLukasz/child-page/issues/113) / PR [#137](https://github.com/BielinskiLukasz/child-page/pull/137): random animal pool from the shared family, silhouette groups, no repeated trio.
