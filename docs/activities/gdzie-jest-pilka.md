# Gdzie jest Piłka?

## 1. Overview

| Item | Value |
|---|---|
| Display name | Gdzie jest Piłka? |
| Internal ID | `pilka` (entry in [`js/activities.js`](../../js/activities.js)) |
| Description | A ball, an open box on a table and a small bunny; the child moves the ball to four marked places (in, on, under, next to the box) and the bunny reacts. |
| Category | Exploratory (spatial concepts), cause and effect |
| Interaction type | Tap on a spot, or drag the ball; keyboard: Enter/Space on the ball |
| CSS prefix | `pk-` |
| Source | [`js/pilka.js`](../../js/pilka.js), styles in [`css/style.css`](../../css/style.css) (section `/* Gdzie jest Piłka? */`) |
| Status | Implemented; enabled by default (no `defaultOff`). Listed 30th in the README Activities list. |

## 2. Business purpose

The activity introduces the position words in, on, under and next to through pictures only: the child sees the ball in four places relative to a box and a table, without any text. It is open-ended and failure-free (nothing is right or wrong), and it differs from the other activities by being about spatial relations rather than matching or counting. The bunny gives a small friendly reaction after each move.

## 3. Activity flow

1. The child opens the activity (`#pilka`); one of six layouts is chosen at random (see section 10).
2. A 4:3 scene shows a wall, a table, an open cardboard box standing on the table, the pink ball on its start spot, four dashed marker circles with small symbols and the bunny near one edge.
3. The child can tap a marker (the ball moves there) or press the ball and drag it (on release it moves to the nearest marker).
4. The ball glides to the target; when it arrives, the bunny plays a reaction for about 2 s.
5. There is no completion state. Nothing happens by itself; the animation loop stops when idle.
6. Re-opening the activity chooses another layout (never the same as the previous launch).
7. The child leaves with the Back button (see [shared behaviour](README.md#shared-platform-behaviour)).

## 4. Rules and behavior

Spots (scene units, scene 400 x 300; `cx` is the box centre of the chosen layout):

| Spot id | Polish label (aria) | Position | Symbol | Bunny reaction (2 s) |
|---|---|---|---|---|
| `in` | w pudełku | `(cx, 128)` | box with a dot inside | head tilts towards the box (14 deg) and body shifts 3 px |
| `on` | na pudełku | `(cx, 56)` | dot above a box | hops (up to 12 px, two hops) |
| `under` | pod stołem | `(cx, 240)` | dot below a line | crouches (4 px down, `scaleY` 0.92) and head tilts down (-16 deg) |
| `next` | obok pudełka | `(cx + side * 120, 156)` | dot beside a box | waves (arm rotates up to 30 deg, 3 cycles) |

Other rules:

- **Move:** the ball follows a critically damped spring (`OMEGA = 3.4`) towards the target, integrated in steps of at most 8 ms. Touching another spot mid-flight only changes the target, so the motion stays smooth. Arrival is declared when the distance is below 0.4 units and the speed below 1.5.
- **Drag:** pointer capture; the ball position is clamped to x 34..366 and y 34..280 scene units. On release `goTo(nearest spot)` runs, so the ball never stays between spots.
- **Same spot:** tapping the spot the ball is already on, or releasing the ball nearest to it, counts as an arrival, so the bunny reacts again.
- **During a drag:** taps on spots are ignored (`goTo` returns while a drag is active).
- **Bunny placement:** at `(34, 240)` when `cx >= 200`, otherwise at `(366, 240)`; the bunny does not receive input (`pointer-events: none`).
- **Reduced motion:** the ball does not glide; it fades out in 0.15 s, jumps to the target and fades in over 0.15 s (`FADE_S`); the bunny's reaction movement is skipped, although the 2 s reaction state still runs.
- Nothing is scored; there are no wrong places.

## 5. Educational and developmental benefits

**Intended design benefits** (not measured)

- Understanding positional concepts (in, on, under, next to) through pictures.
- Hand-eye coordination (drag) and cause and effect (tap, ball moves, bunny reacts).
- Calm independent exploration.

**Directly observable behavior**

- Each of the four places has its own marker symbol and its own bunny reaction.
- The same four places are available in every layout; only the box position, the side of "next to", the colours and the start place change.

**Requires professional or research-based validation**

- Whether the activity improves understanding of spatial words. The activity contains no spoken or written words, so any link to language learning would depend on the parent.

## 6. Accessibility and usability

- **Input:** touch, mouse and stylus (pointer events); the four spots are `<button>`s with `aria-label` `Miejsce: <label>`; the ball is a button labelled `Piłka (Enter lub spacja: następne miejsce; przeciągnij na miejsce)`. Enter/Space on the ball (click with `detail === 0`) moves it to the next spot in the order in, on, under, next.
- **Target size:** spots 18% of the scene width and the ball 17.5%, each at least 56 x 56 px. Spot centres are 72 scene units apart for in/on, so markers do not overlap.
- **Orientation:** the scene keeps a 4:3 aspect (`w = max(240, min(fieldWidth, fieldHeight * 4/3))`) and is centred; it works in portrait and landscape, but on a narrow portrait screen it is small (width roughly the screen width).
- **Colour:** each spot has a different symbol, so place meaning does not depend on colour.
- **Sound:** none. **Reading:** not required (no text in the scene).
- **Reduced motion:** see section 4; motion is JS-driven, so the global CSS rule does not affect it.
- **Touch behaviour:** the ball has `touch-action: none` (dragging); the rest uses `touch-action: manipulation`.
- **Focus:** 4 px outline `#8f7fd1` on the spots and the ball.
- **Limitations:** the ball can be moved with the keyboard only in a fixed cycle; the bunny reactions are not announced to assistive technology.

## 7. Risks and limitations

- The scene is a fixed small picture on narrow phones in portrait (the 4:3 scene is limited by width), so touch targets are near the 56 px minimum.
- The symbols in the dashed markers are abstract; a child may not link them to the words on their own (words are for the parent to say).
- Without any goal the activity may hold attention only briefly.
- No personal data is collected.

## 8. Configuration

No external configuration; constants in [`js/pilka.js`](../../js/pilka.js):

| Name | Purpose | Type | Default |
|---|---|---|---|
| `W`, `H` | Scene units | numbers | `400`, `300` |
| `LAYOUTS` | Six layouts (`cx`, `side`, `start`, `wall`, `top`, `leg`, `floor`) | array | see section 10 |
| `LABELS` | Polish labels of the spots | object | in/on/under/next |
| `OMEGA` | Spring stiffness (about 1.5 s to settle) | rad/s | `3.4` |
| `REACT_S` | Bunny reaction length | s | `2` |
| `FADE_S` | Reduced-motion fade half-time | s | `0.15` |
| `STROKE` | Marker colour | CSS colour | `#8f7fd1` |

No fallback for invalid values (nothing is read from outside). If `window.Rand` were missing, `LAYOUTS[0]` is used.

## 9. Assets

No external asset files. The scene (`sceneFor`), ball (`BALL`), bunny (`BUNNY`, 64 x 68 viewBox) and marker symbols (`SYMBOLS`) are inline SVG strings built in JavaScript. The background colours come from the chosen layout. The bunny is hand-drawn in this file, not the shared `Animals` family. The menu icon is inline SVG in `js/activities.js`. No unused assets.

## 10. Randomization and variants

- **What is random:** one of six predefined layouts per launch: `Rand.pickOne(LAYOUTS, 'pilka')`, which never returns the layout used on the previous launch in the same page session (pools of 2 or more).
- **Layouts:**

| # | `cx` | `side` (next to) | Ball starts at | Notes |
|---|---|---|---|---|
| 1 | 200 | +1 (right) | in | |
| 2 | 200 | -1 (left) | on | |
| 3 | 150 | +1 | next | |
| 4 | 250 | -1 | under | |
| 5 | 175 | +1 | under | |
| 6 | 225 | -1 | in | |

  Each layout has its own wall, table top, table leg and floor colours. The bunny stands on the left when `cx >= 200`, otherwise on the right.
- **Persistence:** none; the "last pick" memory of `Rand` lasts only for the page session.
- **Within a session:** the layout does not change while the activity is open.

## 11. Progression and difficulty

None. There are no levels and nothing is stored.

## 12. Completion and feedback

No formal completion state. Feedback is the ball's movement and the bunny's 2 s reaction on arrival. There is no score, sound or failure feedback. The interaction cycle is: choose a place -> ball moves -> bunny reacts -> idle.

## 13. Analytics and metrics

On `main` this activity emits **no** analytics events; see [Analytics status](README.md#analytics-status). No metric is supported.

*Not implemented, for planning only:* because it is open-ended, active time and a count of interactions (optionally by spot) would be the meaningful signals; a completion rate and `level_*` events do not apply. No data that could identify a child should be collected.

## 14. Technical implementation

- **Entry point:** `mount(container)` in [`js/pilka.js`](../../js/pilka.js), registered on the `pilka` entry; returns a cleanup function.
- **State:** `spot` (current spot index), ball position `x, y` and velocity `vx, vy`, target `tx, ty`, flags `moving`, `dragPid`, `react` (`{t, type}`), `fade` (reduced-motion cross-fade) and opacity `op`.
- **Rendering:** a `.pk-board` div sized in pixels holds a background SVG, four spot buttons, the bunny and the ball button, all positioned with percentages of the 400 x 300 scene (`pct(x, y)`). The bunny's parts (`pk-all`, `pk-head`, `pk-arm`) are animated through inline CSS `transform`.
- **Animation:** one rAF loop (`frame`, `dt` capped at 50 ms) that continues only while the ball is moving or the bunny reacts, and is cancelled when the tab is hidden and restarted on return.
- **Events:** `click` on spots; `pointerdown`/`pointermove`/`pointerup`/`pointercancel`/`lostpointercapture` and `click` (keyboard) on the ball; `resize`/`orientationchange`.
- **Randomization:** `Rand.pickOne` ([`js/random.js`](../../js/random.js)).
- **Persistence/analytics:** none.
- **Cleanup:** cancels the frame, removes the three listeners and the board.

## 15. Responsive layout and coordinate system

- Scene coordinate system: 400 x 300 units (`W`, `H`), SVG `viewBox 0 0 400 300` with `preserveAspectRatio="xMidYMid meet"`. Spots, ball and bunny are HTML elements placed with `left/top` percentages of the board, so they stay locked to the artwork at every size.
- The board size is `w = max(240, min(fieldWidth, fieldHeight * 400/300))` by `w * 3/4`; the field is the screen minus 64 px at the top and 12 px on the other sides (plus safe areas).
- Pointer positions are converted with `toScene` (client rect to scene units), so dragging works at any scale.
- Ball/spot sizes are percentages of the board width with a 56 px minimum.
- If the field is narrower than 240 px the board is wider than the field (the `.pk` container clips overflow); `Requires verification`.

## 16. Error and edge-case handling

| Case | Behaviour |
|---|---|
| Missing assets | Not applicable. |
| Missing `Rand` | Falls back to the first layout. |
| Redirect during a glide | Smoothly redirected (spring keeps velocity). |
| Drag started during a glide or reaction | Glide stops, the reaction is cancelled, the ball is picked up. |
| Resize/orientation change | `layout` resizes the board; scene units keep positions consistent. |
| Tab hidden | Loop cancelled and restarted. |
| Pointer cancel / lost capture | Treated as release: the ball goes to the nearest spot. |
| Second pointer on the ball during a drag | Ignored (`dragPid !== null`). |
| Mouse buttons other than the primary | Ignored on pointer down. |
| Unsupported `matchMedia` | `reduced()` is `false`. |

## 17. Testing

**Automated tests:** none (see [shared behaviour](README.md#shared-platform-behaviour)). PR [#85](https://github.com/BielinskiLukasz/child-page/pull/85) reports a stub run checking per-frame step size after a redirect; PR [#152](https://github.com/BielinskiLukasz/child-page/pull/152) reports a numeric check of the layouts. These are not re-verified here.

**Manual scenarios (not yet recorded as performed):**

- [ ] Normal: tap each of the four markers and confirm the ball moves there and the bunny reacts as listed in section 4.
- [ ] Redirect: tap another marker while the ball is moving; the motion stays smooth.
- [ ] Drag: drag the ball between markers and onto empty space; it settles on the nearest marker; drag off the edge of the scene.
- [ ] Incorrect interaction: tap the ball, the bunny and the empty scene; nothing breaks.
- [ ] Restart/randomization: re-open the activity at least 6 times; layouts vary and the same one never appears twice in a row; the bunny and the "next to" marker are on sensible sides.
- [ ] Completion/progression: confirm there is no end state or level.
- [ ] Portrait and landscape: 320 x 568, 568 x 320, tablet; markers and ball at least 56 px; rotate while the ball is moving.
- [ ] Touch and mouse: finger drag, mouse drag, keyboard Enter/Space on the ball and Tab through markers.
- [ ] Background/foreground: hide the tab during a glide and return.
- [ ] Reduced motion: the ball fades instead of gliding.
- [ ] Browsers: Chrome desktop, Chrome Android, Safari iPhone/iPad.

## 18. Known limitations and open issues

**Confirmed**

- No automated tests; no analytics on `main`.
- Tapping the current spot replays the bunny reaction (no "already here" state).
- Bunny reactions are not exposed to assistive technology.

**Requires verification**

- Usability of the 4:3 scene on narrow portrait phones.
- Overlap between the bunny and the "next to" marker in some layouts (PR [#152](https://github.com/BielinskiLukasz/child-page/pull/152) reports a numeric check that the bunny stays outside the spots).

## 19. Planned improvements

None currently planned (no open issue targets this activity).

## 20. Related activities and reusable components

- Shared helper: [`js/random.js`](../../js/random.js) (`Rand.pickOne`). It does not use `js/animals.js`.
- No related activity documents are linked: the spring-style motion is implemented locally in this file.

## 21. Change history

- [#59](https://github.com/BielinskiLukasz/child-page/issues/59) / PR [#85](https://github.com/BielinskiLukasz/child-page/pull/85): activity added.
- [#126](https://github.com/BielinskiLukasz/child-page/issues/126) / PR [#152](https://github.com/BielinskiLukasz/child-page/pull/152): six random layouts per launch.
