# Pizza

Status: implemented

- Issue: [#215](https://github.com/BielinskiLukasz/child-page/issues/215)
- Activity id: `pizza`
- CSS prefix: `pi-`

Platform-wide behaviour (no sound, reduced motion, menu configuration, playtime limit, absence of automated tests, privacy) is described in [README.md](README.md#shared-platform-behaviour) and is not repeated here.

## 1. Overview

| Item | Value |
|---|---|
| Display name | Pizza |
| Activity ID | `pizza` (registry entry in [`js/activities.js`](../../js/activities.js)) |
| Description | The child rolls out dough, spreads sauce, drags on toppings and bakes the pizza; a friendly animal eats it. |
| Category | Free creative play; multi-step; drag and drop |
| Interaction type | Dragging (touch, mouse) with a keyboard alternative for every action |
| Status | Implemented; disabled in the menu by default (`defaultOff: true`), a parent enables it in Settings |
| Source | [`js/pizza.js`](../../js/pizza.js), styles with prefix `pi-` in [`css/style.css`](../../css/style.css) |

## 2. Business purpose

- The first activity about free creation with several steps; the building activities (Zbuduj Rakietę, Wieża) have fixed parts. Issue [#215](https://github.com/BielinskiLukasz/child-page/issues/215).
- There is no correct pizza: every combination is accepted and "tastes good".

## 3. Activity flow

1. **Dough:** a dough ball sits on a round board. Dragging a finger over it flattens it into a round base.
2. **Sauce:** dragging over the base paints red sauce; at 80% coverage the rest fades in (0.5 s).
3. **Toppings:** a tray of six toppings (tomato, cheese, mushroom, olive, pepper, pineapple, 64 px each) appears. Each is dragged onto the pizza, as often as wanted, up to 12 in total.
4. **Oven:** after the third topping a 72 px oven button appears. Touching it slides the pizza into a glowing oven for 2 s.
5. **Eating:** a random animal customer smiles and eats the pizza over 3 s (a wedge disappears clockwise); the serving counts as a completion.
6. **Next:** 4 s after the last bite a new dough ball starts; the customer is always a different animal than the previous one.
7. Exit: Back button or browser Back.

## 4. Rules and behavior

| Rule | Detail |
|---|---|
| Dough | Progress is the smaller of "dragged distance / 40% of the screen width" and "time spent moving / 3 s", so it needs at least about 3 s of dragging; the dough eases to the value. Keyboard: 8 steps with arrows or Enter/Space. |
| Sauce | Brush radius 16 units (of a 200-unit board); coverage is measured on a 24 x 24 grid over the sauce disc; 80% finishes and fades in the rest. Keyboard brush radius 24. |
| Toppings | Drop centre inside the base radius places it (pop 0.35 s, one spin in 1.6 s); outside it the picture glides back to the tray in 0.5 s. The 13th drop returns to the tray and the tray looks faded with a dashed outline. |
| Oven button | Shown while there are at least 3 toppings (and the phase is "toppings"); 72 px. |
| Oven | 2 s: 0.4 s slide in, glow, 0.4 s out. |
| Customer | `window.Animals.pick(2)`; the first that is not the last customer (kept per page session). |
| Failure, score | None; nothing is stored. |
| Text | None on screen; Polish screen-reader labels only. |

## 5. Educational and developmental benefits

**Intended design benefits:** sequencing (dough, sauce, toppings, oven), creative choice, fine motor control (dragging, spreading), cause and effect.

**Directly observable behavior:** every step has a clear visible result and a friendly end.

**Requires professional or research-based validation:** any effect on sequencing or food vocabulary.

## 6. Accessibility and usability

- Input: touch, mouse, keyboard. The board is focusable (Tab): arrows or Enter/Space roll the dough; in the sauce stage arrows move a dashed brush ring and paint, Enter/Space paints at the ring. Tray toppings and the oven are buttons: Enter/Space on a topping places it on the next of 12 fixed spots, Enter/Space on the oven bakes.
- Targets: toppings 64 px, oven 72 px; the board starts 64 px from the top (portrait) or 72 px from the left (landscape) so the fixed Back button is never covered.
- Colour is not the only cue: toppings differ by shape; the sauce is shown by coverage as it is painted; the full tray is faded with a dashed outline.
- Reduced motion: all motion is driven from JS; under reduced motion the pop, the spin and the chewing bob are skipped but every stage, the oven and the eating still happen.
- Only the first pointer is used; a second finger is ignored.

## 7. Risks and limitations

- Tested only with stub-DOM simulations in this environment (no browser), see section 17.
- Toppings may overlap and hide each other; the last placed is on top.
- "Screen" for the dough is the width of the activity area.

## 8. Configuration

No external configuration. Constants at the top of `js/pizza.js`: `DOUGH_NEED_W` (0.4), `DOUGH_TIME` (3), `SAUCE_GOAL` (0.8), `MAX_TOP` (12), `MIN_TOP_OVEN` (3), `OVEN_S` (2), `EAT_S` (3), `WAIT_S` (4), `BACK_S` (0.5) and the `KINDS` list.

## 9. Assets

No asset files: toppings, oven, board and dough are inline SVG in `js/pizza.js`; customers come from `window.Animals`; the menu icon is in `js/activities.js`.

## 10. Randomization and variants

The customer (random, never the same as the last one) and the rotation of each placed topping. Nothing persists.

## 11. Progression and difficulty

None; every round is the same.

## 12. Completion and feedback

Each served pizza (the end of the 3 s eating) is a completion. Feedback: dough flattening, sauce painting, a pop and spin per topping, a fly-back for a rejected drop, the oven glow, the smiling customer.

## 13. Analytics and metrics

Reports to `window.Analytics` (see [README.md](README.md#analytics-status)):

- `track('interaction', { variant: '<topping id>' })` for each topping placement (tomato, cheese, mushroom, olive, pepper, pineapple), drag or keyboard.
- `track('interaction', { variant: 'oven' })` for each oven touch.
- `complete()` once per served pizza.

Calls are wrapped in try/catch; nothing is stored by the activity.

## 14. Technical implementation

- **Entry point:** `mount(container)` overrides `mount` of the `pizza` entry; the root is attached with `container.appendChild` before layout; it returns a cleanup function that cancels the rAF loop, any drag ghost and the listeners.
- **Rendering:** `div.pi > div.pi-wrap` with `div.pi-board` (one SVG, viewBox 200 x 200: board, oven backdrop, pizza group with dough, sauce and toppings), `div.pi-cust`, `div.pi-tray` (six buttons) and `button.pi-oven`. SVG sizing uses `.stage .pi-svg`. Eating is an SVG mask with a growing black wedge.
- **State:** dough progress, sauce circles and a coverage grid, and topping positions are all in board units, so layout changes never lose them. Phases: dough, sauce, top, oven, eat, wait.
- **Drag:** a fixed-position ghost follows the pointer from a tray button; the release point decides place or fly-back.
- **Loop:** one rAF loop with capped dt, paused while the tab is hidden and stopped when idle.

## 15. Responsive layout and coordinate system

`layout()` runs on mount, resize and orientation change and only sets sizes and positions: portrait puts the board on top and the tray (3 x 2) with the oven button under it; landscape puts the board on the left (from 72 px) and the tray with the oven under it on the right. Works from 320 px wide down to 568 x 320.

## 16. Error and edge-case handling

- Rotation or resize in any state: positions are recomputed, the state is in board units.
- Tab hidden and shown: the loop pauses and resumes; an active drag is cancelled and its ghost removed.
- Very fast repeated touches: the oven is ignored outside the toppings phase; the 12 limit is checked at every placement; the sauce dot count grows only by moves of at least a few pixels.
- Two fingers: the second pointer is ignored while one drag is active.

## 17. Testing

Manual scenarios:

1. Drag over the dough quickly: it does not finish in under about 3 s of dragging; keep dragging back and forth for 3 s and it finishes round.
2. Paint sauce: coverage grows; at about 80% the rest fades in and the tray appears.
3. Drag each topping onto the pizza; a topping dropped outside returns to the tray in 0.5 s.
4. Place 12 toppings; a 13th drag returns and the tray looks faded.
5. With 2 toppings the oven is not visible; after the third it appears; touch it: glow for 2 s, then the animal smiles and eats over 3 s.
6. Wait 4 s: a new dough ball and (next time) a different customer.
7. Rotate the device at every stage: nothing is lost, the Back button is never covered.
8. Keyboard only: Tab to the board, roll the dough, move the brush ring over the base, Tab to toppings and the oven.
9. Touch with two fingers: the second is ignored.

A Node stub-DOM simulation (fast and slow dough, sauce coverage, toppings, outside drops, 12 limit, oven, completion, restart, keyboard path, three viewports, reduced motion, cleanup) was run during development; there is no automated test suite in the repository.

## 18. Known limitations and open issues

No renderer was available to the author; the look of the pictures and the layout at 320 px and 568x320 need a check on a real device. The "4 s after the eating" interval is read from the issue as measured from the end of the eating.

## 19. Planned improvements

None agreed; scoring and cooking states are out of scope.

## 20. Related activities and reusable components

Other multi-step activities: [Zbuduj Rakietę](zbuduj-rakiete.md), [Zakupy](zakupy.md). Reuses `window.Animals` and `window.Analytics`.

## 21. Change history

- Implemented from issue [#215](https://github.com/BielinskiLukasz/child-page/issues/215).
