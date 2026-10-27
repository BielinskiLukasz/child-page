# Ubierz Misia

> Documents the current implementation on `main`. Shared platform behaviour (no sound, global reduced-motion rule, menu configuration, playtime, absence of automated tests, analytics status) is described in [README.md](README.md#shared-platform-behaviour) and is not repeated here.

## 1. Overview

| Property | Value |
|---|---|
| Display name | Ubierz Misia |
| Activity ID | `ubierz-misia` (`js/activities.js`) |
| Description | A teddy bear stands in a room with a window. The child changes the weather in the window (sun, rain, snow) and dresses the bear with six clothes. A fitting item gives a happy hop and glow; any other item gives a small head tilt. |
| Category | Sorting / matching (open-ended, no wrong answers) |
| Interaction type | Drag and drop, with a tap-to-select alternative; tap on the window |
| Status | Implemented; enabled by default in the menu |
| Source | [`js/ubierz-misia.js`](../../js/ubierz-misia.js), CSS prefix `um-` in [`css/style.css`](../../css/style.css) |

## 2. Business purpose

The activity lets a child play with the idea that clothes belong to weather, without testing the child. Every item is accepted for every weather; the only difference is the bear's reaction. It complements the open-ended scenes by adding a drag-and-drop interaction with a gentle, non-judging response.

## 3. Activity flow

1. The child opens the tile; the scene appears immediately (no fade-in): a bear in a room, a window with sunshine on the left, six clothes in two columns on the right.
2. The child can touch the window to change the weather (sun to rain to snow to sun).
3. The child dresses the bear in one of two ways: drag an item onto the bear, or tap an item (it is highlighted) and then tap the bear.
4. The item glides onto the bear. When it arrives, the bear reacts: a happy hop with a soft glow (2 s) if the item fits the current weather, otherwise a small neutral head tilt (1.4 s).
5. Tapping a worn item takes it off and it glides back to its place on the right.
6. There is no completion state. The child leaves with the Back button.

## 4. Rules and behavior

| Item (`id`) | Polish label | Fits weather | Worn position (x, y units) | Home slot (x, y) |
|---|---|---|---|---|
| `sunhat` | kapelusz słoneczny | sun (0) | 165, 110 | 288, 70 |
| `umbrella` | parasol | rain (1) | 222, 184 | 356, 70 |
| `scarf` | szalik | snow (2) | 165, 184 | 288, 150 |
| `boots` | kalosze | rain (1) | 165, 241 | 356, 150 |
| `warmhat` | ciepła czapka | snow (2) | 165, 112 | 288, 230 |
| `sunglasses` | okulary przeciwsłoneczne | sun (0) | 165, 144 | 356, 230 |

- **Weather:** `target` cycles 0, 1, 2 (sun, rain, snow) on each tap of the window; each weather layer eases in or out over 3 s (`WEATHER_S`). Rain has 10 falling streaks and snow 10 flakes (fixed pools); particles are not animated under reduced motion.
- **Reaction rule:** when a worn item finishes gliding onto the bear, its `fits` value is compared with the current weather `target` (not the partially faded display). Equal gives `happy` (2000 ms, `HAPPY_MS`: glow plus two 6-unit hops), otherwise `neutral` (1400 ms, `NEUTRAL_MS`: 5-degree tilt around the feet pivot at 165, 258).
- **Drop zone:** the bear rectangle x 95-235, y 100-275 expanded by 18 units. Dropping elsewhere glides the item home.
- **Glide time:** `min(1200, 600 + distance_px * 0.8)` ms; 300 ms when reduced motion is requested.
- **Dragging:** only unworn items can be dragged; the item centre is clamped to the visible screen.
- **Hat exclusivity:** `wear()` is meant to send the other hat home when a hat is put on (it compares the worn `wx`/`wy` of two items). See section 18: the two hats have different `wy`, so the check never matches today.
- **No wrong answers:** every item can be worn in any weather, any number of items can be worn together, and nothing is scored or stored.

## 5. Educational and developmental benefits

**Intended design benefits**: connecting weather with fitting clothes, hand-eye coordination through dragging, cause and effect (weather, clothes, bear reaction), calm independent play.

**Directly observable behavior**
- The bear always reacts to a worn item, differently for fitting and non-fitting items, but never negatively (no angry or sad expression exists).
- The window visibly changes sky, ground and particles.
- A keyboard or tap-tap alternative to dragging exists.

**Requires professional or research-based validation**
- Whether children learn which clothes suit which weather from this activity.
- Whether the difference between hop and tilt is noticeable to young children.

## 6. Accessibility and usability

- **Input:** touch, mouse and stylus via pointer events on the items (`touch-action: none` on items so dragging does not scroll); `touch-action: manipulation` on the window and bear buttons. Keyboard: items are buttons (`aria-pressed`, label ends with "Enter lub spacja, potem wybierz misia"), the bear is a button ("Miś (wybierz ubranie, potem miś)") and the window is a button ("Okno: zmień pogodę"), all with a 4px focus outline.
- **Target size:** items are `max(56px, 15% of the board width)` square; the window and bear buttons cover the drawn window (33% x 40% of the board) and the bear (35% x 58%).
- **Orientation:** one 4:3 board scaled to fit; portrait just gives a smaller board.
- **Colour:** the item drawings differ in shape (hat, umbrella, scarf, boots, hat, glasses); weather is conveyed by the picture (sun, drops, flakes), not by colour alone. Fit is not shown by colour.
- **Reading:** none; labels are for assistive technology.
- **Sound:** none.
- **Reduced motion:** all motion is driven by a `requestAnimationFrame` loop and the code reads `prefers-reduced-motion` itself (`reduced()`): under reduced motion rain and snow stay still, the happy hop and tilt are dropped (only the glow remains for the happy reaction; neutral shows no movement), and glides last 300 ms. Weather colour cross-fades (3 s) still run.
- **Limitations:** the current weather and which items are worn are not announced to assistive technology; the window label does not name the current weather.

## 7. Risks and limitations

- Multi-touch: up to six items can be dragged at once (each tracks its own pointer); the PR reports a multi-pointer test in a stub only.
- Items can overlap on the bear (no layering rules besides the hat check) and both hats can currently be worn together (section 18).
- An item dropped over the bear always counts as worn, even if the child only meant to move it.
- No ending; the activity can be played indefinitely.
- Privacy: nothing is stored or transmitted.

## 8. Configuration

No external configuration; constants live in `js/ubierz-misia.js`.

| Name | Purpose | Type | Default | Changeable without code change? |
|---|---|---|---|---|
| `ITEMS` | Clothes: id, label, `fits`, worn position, SVG art | array | 6 entries | No |
| `HOME_X`, `HOME_Y` | Home slots (units) | arrays | [288, 356], [70, 150, 230] | No |
| `BEAR_RECT`, margin 18 | Drop zone (units) | object | x 95-235, y 100-275 | No |
| `BX`, `PIVOT_Y` | Bear centre x and tilt pivot | numbers | 165, 258 | No |
| `WEATHER_S` | Weather change duration (s) | number | 3 | No |
| `HAPPY_MS`, `NEUTRAL_MS` | Reaction durations (ms) | numbers | 2000, 1400 | No |
| `SKY`, `GROUND` | Colours per weather (sun, rain, snow) | RGB arrays | see source | No |

There is no fallback for invalid values; the constants are not user-editable.

## 9. Assets

No external asset files. The room, window, bear, six items (`ITEMS[].art`, 100x100 viewBox each) and weather particles are inline SVG built in `js/ubierz-misia.js`. A single CSS rule enlarges worn boots (`.um-item[data-id='boots'].um-worn svg { transform: scale(1.4) }`, added so the boots fit the bear's feet, PR #155). The expression `def.art.replace('', '')` in the code has no effect.

## 10. Randomization and variants

Nothing is randomized. The weather always starts as sun and cycles in a fixed order; items always start in the same home slots.

## 11. Progression and difficulty

No progression, levels or difficulty. State (weather, worn items) is not persisted; each launch starts with sun and no clothes worn.

## 12. Completion and feedback

There is no completion state and no failure. Feedback: item selection outline, glide of the item, bear reaction (happy hop and glow, or head tilt), weather transition. No sound.

## 13. Analytics and metrics

This activity reports to the shared on-device module `js/analytics.js` (`window.Analytics`) through the app shell only: `js/app.js` records the activity start and end, and the module counts touches inside the stage. The activity file itself calls no `Analytics` function. Recorded for it: starts, active time, replays (re-opening in the same session), quick exits (within 10 s) and touches. It is open-ended, so no completion, level or exit-before-completion is defined for it. Data stays on the device as anonymous daily aggregates; see [README.md](README.md#analytics-status).

## 14. Technical implementation

- **Entry point:** IIFE in [`js/ubierz-misia.js`](../../js/ubierz-misia.js) overriding `mount` for `ubierz-misia`.
- **Rendering:** one SVG (400x300 viewBox, `preserveAspectRatio="none"`) for room, window, bear and weather; two transparent hit buttons (window, bear) and six item `<button>` elements positioned over it with CSS `transform: translate(...)`.
- **State:** `target` and `wts[3]` (weather weights), `pose` and `react` (bear reaction), per item `{x, y, worn, mode ('idle' | 'drag' | 'glide'), pending, ...}`, `selected`.
- **Events:** pointer events (`pointerdown`, `pointermove`, `pointerup`, `pointercancel`, `lostpointercapture`) with pointer capture on each item; `click` for select, take off, wear (via bear) and weather; `resize`, `orientationchange`, `visibilitychange`.
- **Animation:** one `requestAnimationFrame` loop with capped dt (50 ms) that runs only while something moves and stops while the tab is hidden.
- **Coordinates:** all positions are stored in board units and converted with `k = boardWidth / 400`.
- **Cleanup:** cancels the frame, removes the window listeners and removes the root.
- **Shared helpers:** none (`Rand` and `Animals` are not used).

## 15. Responsive layout and coordinate system

- Board: `aspect-ratio: 4 / 3`, `width: min(100%, (100dvh - safe areas - 64px) * 4 / 3)`, inside a container with 56px top padding and safe-area insets.
- Coordinate space: 400 x 300 units for the SVG and for item positions; `layout()` measures the board and recomputes `k` and the item size `S = max(56, 0.15 * width)` on mount, resize and orientation change.
- On resize any item being dragged is cancelled and glides home; idle items are re-placed (worn items follow the bear).
- Hit areas for the window and bear are percentages of the board, so they stay aligned with the drawing.
- Drag is clamped so an item centre stays inside the viewport.

## 16. Error and edge-case handling

- **Resize or orientation during a drag:** the drag is cancelled and the item returns home.
- **Pointer cancel / lost capture:** handled as release (`up`).
- **Rapid input:** a short suppression (60 ms) prevents the click after a drag from also selecting the item; extra pointers on an item already being dragged are ignored; secondary mouse buttons are ignored.
- **Backgrounding:** the loop is cancelled while hidden and restarted on return.
- **Synthetic pointers:** `setPointerCapture` is wrapped in `try/catch`.
- **Unhandled:** the hat exclusivity check (section 18); no handling of an unexpected missing `ACTIVITIES` entry beyond skipping the override.

## 17. Testing

There are no automated tests. Manual scenarios to perform:

- [ ] Tap the window repeatedly: sun, rain, snow, sun, each fading over about 3 s.
- [ ] Drag each item onto the bear: it glides on; a fitting item (see table in section 4) gives hop and glow, a non-fitting one a tilt.
- [ ] Change the weather while an item is gliding and check which reaction occurs on arrival.
- [ ] Tap an item, then tap the bear: same result as dragging; tap the item again to deselect.
- [ ] Drop an item away from the bear: it returns home. Tap a worn item: it returns home.
- [ ] Wear both hats at once and confirm what is shown (see section 18).
- [ ] Reload or leave and re-enter: weather is sun and nothing is worn.
- [ ] Portrait and landscape, and rotate while dragging.
- [ ] Touch (phone/tablet, including two fingers on two items), mouse and keyboard (Tab, Enter, Space).
- [ ] Switch tab during a reaction and return.
- [ ] Reduced motion on: rain and snow static, no hop or tilt, glow still shown for fitting items.
- [ ] Browsers required by the README: Chrome desktop, Chrome Android, Safari iPhone/iPad.

PR [#73](https://github.com/BielinskiLukasz/child-page/pull/73) reports `node --check` and a Node stub-DOM run (drag onto bear, take-off, six-item multi-pointer run, cleanup leaves no nodes); it lists the manual device tests as pending. PR [#155](https://github.com/BielinskiLukasz/child-page/pull/155) reports that the boots fix was verified by reasoning from the geometry only.

## 18. Known limitations and open issues

**Confirmed (from the code)**
- Hat exclusivity does not work: `wear()` returns another item only when both `wx` and `wy` are equal, but `sunhat` has `wy: 110` and `warmhat` has `wy: 112`, so both hats can be worn at the same time and overlap. The commit that added the check ("wearing a hat returns the other hat home") intended otherwise.
- No automated tests; manual tests were pending when the PRs were opened.
- Weather and worn state are not announced to assistive technology.

**Requires verification**
- Visual overlap of several worn items (umbrella, scarf, boots, glasses) on small boards.
- Behaviour with several simultaneous touches on real devices.

No open GitHub issue is specific to this activity.

## 19. Planned improvements

None currently planned.

## 20. Related activities and reusable components

- Similar drag-and-select interaction with a keyboard alternative: [Cienie](cienie.md).
- Weather/sky scenes: [Deszczyk i Tęcza](deszczyk-i-tecza.md), [Dzień i Noc](dzien-i-noc.md) (thematic only; no shared code).
- No shared helpers are used (`js/random.js` and `js/animals.js` are not referenced).

## 21. Change history

- Issue [#61](https://github.com/BielinskiLukasz/child-page/issues/61) / PR [#73](https://github.com/BielinskiLukasz/child-page/pull/73): activity added.
- Review follow-up on PR #73: wearing a hat returns the other hat home (not effective, see section 18).
- Issue [#130](https://github.com/BielinskiLukasz/child-page/issues/130) / PR [#155](https://github.com/BielinskiLukasz/child-page/pull/155): bear boots fit the feet.
