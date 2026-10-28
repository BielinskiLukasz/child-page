# Rozmiar

Status: implemented

- Issue: [#222](https://github.com/BielinskiLukasz/child-page/issues/222)
- Activity id: `rozmiar`
- CSS prefix: `rz-`

Platform-wide behaviour (no sound, reduced motion, menu configuration, playtime limit, absence of automated tests, privacy) is described in [README.md](README.md#shared-platform-behaviour) and is not repeated here.

## 1. Overview

| Item | Value |
|---|---|
| Display name | Rozmiar |
| Activity ID | `rozmiar` (registry entry in [`js/activities.js`](../../js/activities.js)) |
| Description | Five nesting cups (or matryoshka dolls) of clearly different sizes lie scattered on a table; the child drags each into a bigger one until all five form one stack. |
| Category | Size comparison; dragging; calming |
| Interaction type | Drag (touch, mouse) with a keyboard alternative |
| Status | Implemented; enabled in the menu by default (appended last, no `defaultOff`) |
| Source | [`js/rozmiar.js`](../../js/rozmiar.js), styles with prefix `rz-` in [`css/style.css`](../../css/style.css) |

## 2. Business purpose

- The first activity that orders by size; [Duże i Małe](duze-i-male.md) only splits into big and small. Issue [#222](https://github.com/BielinskiLukasz/child-page/issues/222).
- No counting numbers, wrong-order messages or scores.

## 3. Activity flow

1. Five items of one set (cups or dolls in one colour scheme) lie scattered on the table in random order; the biggest carries an animal head.
2. The child drags an item onto a bigger one. It slides inside with a soft squash ("click", 0.45 s) and sits snugly in the middle, a little higher than the item below.
3. Dropping an item on a smaller one makes it drift back to where it came from in 0.5 s. Dropping it on the empty table leaves it there.
4. A nested item can be dragged again: it lifts out together with what is inside it (the smallest comes out alone), and drifts back if dropped on a smaller item. A stack is dragged by its biggest item.
5. When all five are one stack it glows for 3 s and the animal waves; then the items fade out (0.5 s) and a new random set fades in scattered on the table (0.6 s).
6. Exit: Back button or browser Back.

## 4. Rules and behavior

| Rule | Detail |
|---|---|
| Sizes | Heights 56, 72, 92, 117, 150 px (ratio 1.28, i.e. at least 25% from item to item), scaled up together on bigger screens (never below 56 px). Width is 0.76 of the height. |
| Sets | 12 sets (6 cups, 6 dolls, each with its own colours) via `Rand.pickOne`, so the same set never comes twice in a row. The animal is random from `Animals.pick`. |
| Scatter | Random order and jitter in rows (three rows of 2, 2, 1 in portrait; one row in landscape); no overlaps at 320x568 or 568x320. |
| Nesting | The dragged item (with its contents) may be dropped on any bigger item whose box contains the dragged item's centre; the nearest such item wins. Items already inside the target are merged in size order, so a stack is always sorted. |
| Wrong order | A drop whose centre is over a smaller item (and no bigger one) drifts back in 0.5 s; nothing is reported. |
| Lift out | Touching a nested item and moving it takes it, with everything inside it, out of its container. A tap without moving (under 6 px) changes nothing. |
| Finale | All five nested: glow 3 s with a waving animal (0.7 waves per second), then 0.5 s fade-out and 0.6 s fade-in of a new set. Touches are ignored during the finale. |
| Failure, score | None; nothing is stored. |
| Text | None on screen; only Polish screen-reader labels ("Kubek 2 z 5", "Matrioszka 3 z 5"). |

## 5. Educational and developmental benefits

**Intended design benefits:** comparing and ordering by size, fitting things into one another, fine motor control of dragging.

**Directly observable behavior:** only a smaller item can go inside a bigger one; a finished stack is always ordered by size.

**Requires professional or research-based validation:** any effect on understanding of size or seriation.

## 6. Accessibility and usability

- Input: touch, mouse, keyboard. Every item is a `<button>` (Tab). Enter/Space selects it (solid outline, `aria-pressed`); arrows (or Tab to another item and Enter/Space) choose the target, shown with a dashed outline; Enter/Space on the selected item nests it. For a nested item the first target is "table", which lifts it out beside its container. Escape cancels.
- All items are at least 56 px; the field starts 64 px below the top so the Back button is never covered.
- Colour is not the only cue: sizes differ in height, the selected item is outlined solid and the target dashed.
- Reduced motion: all movement, the finale and the wave run from one `requestAnimationFrame` loop (not CSS), so every state is reached; nothing is faster than 0.7 waves per second and nothing flashes.
- Only the first pointer drags; a second finger is ignored.

## 7. Risks and limitations

- A big item cannot be nested by tapping alone on a touch screen; dragging is needed (the keyboard path exists).
- The animal head sticks out above the biggest item; its touch area counts as that item.

## 8. Configuration

No external configuration. Constants at the top of `js/rozmiar.js`: `RATIO` (1.28), `BASE_H` (56), `GLOW_MS` (3000), `OUT_MS`, `IN_MS`, `DRIFT_MS` (500), `NEST_MS` (450), `MOVE_PX` (6), and the `SETS` list.

## 9. Assets

No asset files: items are inline SVG (cup or doll, built by `itemSvg`), the animal head comes from `window.Animals`, and the menu icon is in `js/activities.js`.

## 10. Randomization and variants

Set (kind and colours) with no immediate repeat, animal, order and jitter of the scatter. Nothing persists.

## 11. Progression and difficulty

None: always five items.

## 12. Completion and feedback

Completed when all five items are in one stack. Feedback: glow, waving animal, then a new set. No failure.

## 13. Analytics and metrics

Reports to `window.Analytics` (see [README.md](README.md#analytics-status)):

- `track('interaction', { variant: 's<n>' })` for each nest (touch or keyboard), where `s1`-`s5` is the size of the item that was moved (1 = smallest). Lifts, drifts and taps are not reported.
- `complete()` once per finished stack.

Calls are wrapped in try/catch; nothing is stored by the activity.

## 14. Technical implementation

- **Entry point:** `mount(container)` overrides `mount` of the `rozmiar` entry; the root is attached with `container.appendChild` before layout; returns a cleanup function.
- **Model:** each item has `inside` / `inner` links (a chain sorted by size) and, for chain roots, a fractional anchor (`fax`, `fay`) on the field; rest positions are computed by `computeTargets`, and `settle(ms)` glides items there.
- **Rendering:** `div.rz > div.rz-field > 5 × button.rz-item (svg.rz-svg, optional span.rz-head)`; SVG sizing uses `.stage .rz-svg`.
- **Loop:** one capped-dt rAF loop for glides, the squash, the finale phases (`pre`, `glow`, `out`, `in`) and the wave; it stops when idle and pauses when the tab is hidden.
- **Cleanup:** cancels rAF and removes the listeners and the root.

## 15. Responsive layout and coordinate system

Positions are stored as fractions of the field, so rotation or resize (`layout()` on `resize` / `orientationchange`) keeps all state; sizes scale with `k` (1 to 1.4). A drag in progress is cancelled (the item drifts back) on resize or when the tab is hidden.

## 16. Error and edge-case handling

- Second pointer ignored while one is dragging; `pointercancel` drifts the item back.
- Items are clamped inside the field; the dragged item keeps its position relative to the finger.
- A missing `Analytics` or `Animals` is tolerated.

## 17. Testing

Manual scenarios:

1. Drag item 1 into item 2: it slides in with a soft squash and sits centred.
2. Drag item 4 onto item 1: it drifts back in about 0.5 s.
3. Nest 1 into 2, then drag 2 (with 1 inside) into 3, then lift 1 out by dragging it away.
4. Nest all five: glow 3 s, the animal waves, then a different set appears scattered.
5. Rotate the device mid-stack: the stack stays together.
6. Keyboard: Tab to item 1, Enter, arrows to choose the target, Enter; select a nested item and choose "table" to lift it out.
7. With the system "reduce motion" setting on, every step above still works.

A throwaway Node stub-DOM simulation (fake rAF, pointer events on the item buttons) was used to check the size ratio, the absence of overlaps at five viewports, wrong-order drift back, merged stacks, completion and the keyboard path; it is not part of the repository.

## 18. Known limitations and open issues

None known.

## 19. Planned improvements

None.

## 20. Related activities and reusable components

- [Duże i Małe](duze-i-male.md) (size), [Wieża z Klocków](wieza-z-klockow.md) (dragging onto a target).
- Uses `window.Animals`, `window.Rand` and `window.Analytics`.

## 21. Change history

- Initial implementation ([#222](https://github.com/BielinskiLukasz/child-page/issues/222)).
