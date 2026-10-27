# Zakupy

Platform-wide behaviour (no sound, reduced motion, menu configuration, playtime limit, absence of automated tests, privacy) is described in [README.md](README.md#shared-platform-behaviour) and is not repeated here.

## 1. Overview

| Item | Value |
|---|---|
| Display name | Zakupy |
| Activity ID | `zakupy` (registry entry in [`js/activities.js`](../../js/activities.js)) |
| Description | A role-play shop: the child takes products (several units of each on the shelves, 22 kinds in total) into a big basket, brings it to the counter and drags each item across a barcode scanner; a numeral counts the scanned items and a receipt lists each product with a count. |
| Category | Role play; dragging; counting |
| Interaction type | Drag (and tap / press) with a keyboard alternative |
| Status | Implemented; enabled in the menu by default (appended last, no `defaultOff`) |
| Source | [`js/zakupy.js`](../../js/zakupy.js), styles with prefix `zk-` in [`css/style.css`](../../css/style.css) |

## 2. Business purpose

- A shopping role play that combines dragging with counting, without payments or reading; issue [#185](https://github.com/BielinskiLukasz/child-page/issues/185).
- Related: [Policz Razem](policz-razem.md) (counting).

## 3. Activity flow

1. A shop with six shelf slots (each shows 2-4 units of one product), a big basket, a register button and a shop owner (random animal) is shown; a shopping list of pictures (1-5, kinds that are on the shelves) and the numeral `0` are at the top.
2. The child drags a product onto the basket: one unit leaves the shelf and goes into the basket (its picture, at least 40 px wide, shows in the pile). A product can be taken any number of times; a slot whose last unit was taken stays empty for 2 s and is then restocked with 2-4 fresh units.
3. Dragging the basket into the shop area, tapping it or pressing the register button brings the basket to the counter. Basket items come first; list products that were not picked are added until the counter has as many items as the list.
4. Each counter item is dragged across the scanner (or activated with Enter/Space). The scanner flashes a green line and the numeral rises by 1; the item lands in the bag row.
5. When everything is scanned a receipt (a picture and a count numeral such as `x3` per distinct product) slides out of the scanner and the owner smiles. About 4 s after that the counter fades out and a new list starts with a different random set of products on the shelves.
6. Exit: Back button or browser Back.

## 4. Rules and behavior

| Rule | Detail |
|---|---|
| Rounds | List length is round 1 = 1 item, round 2 = 2 ... round 5 = 5, then it starts again from 1; the count restarts on every launch. |
| List | Distinct products drawn at random; a new list never equals the previous one. |
| Shelves | Six slots, each a random kind from a pool of 22 (fruit, vegetables, bread, milk, cheese, eggs, juice, fish, sweets, a toy duck ...); each round a different set than the previous one. Each slot shows 2-4 units; taking one removes one unit; an emptied slot is restocked after 2 s with a new batch of the same kind. |
| Basket | At most 15 items (the same kind any number of times); a further product just glides back and stays on the shelf. The pile shows 8-12 items at once (rows overlap at most about a quarter); further items are stacked on top and a count numeral appears above 8 items. |
| Counter items | Basket items plus missing list products up to the list length. The counter shows 5 items at a time; for a bigger basket the next wave appears after the previous one is scanned. Any product is accepted; the same product several times counts normally. |
| Scanning | Crossing or dropping an item on the scanner zone scans it once; a fast drag is walked in ~8 px steps so the scanner is never skipped. An unscanned item released elsewhere glides back to the belt in 0.4 s. |
| Finish | Receipt slides out in 0.9 s (at least twice the former area, up to three columns of picture + `xN` rows so 15 items fit); owner smile; the next list starts 4 s after the receipt appears. |
| Failure, score | None; nothing is scored or stored. |
| Text, faces, sound | Only the counter numeral (and Polish screen-reader labels); the owner never shows an angry or sad face; no sound. |

## 5. Educational and developmental benefits

**Intended design benefits**

- Dragging with a goal; one-to-one counting with a numeral that rises with each item; everyday role play.

**Directly observable behavior**

- The numeral increases by 1 per scanned item; the list grows gradually.

**Requires professional or research-based validation**

- Any claim about learning or developmental benefits; nothing in the code can establish it.

## 6. Accessibility and usability

- **Input:** pointer drags; shelf slots are at least 64 px (the dragged unit at least 64 px), counter items, basket and register at least 56 px.
- **Keyboard:** arrows move focus between the visible products (and basket, register) or counter items; Enter or Space puts a product in the basket, presses the register or scans an item; visible 4 px focus ring.
- **Labels (Polish):** Polish product names (for example "Jabłko", "Chleb", "Mleko", "Jajka", "Ryba"), "Koszyk", "Kasa" with instructions; the pictures are decorative.
- **Non-colour cues:** the basket gets a glowing outline when a product is over it; scanned items are dimmed and move to the bag row.
- **Layout:** shelves 3 x 2 or 6 x 1, whichever gives larger products; the basket is 1.4 x its former width and its pile reserves room above the bottom band; works from 320 x 568 to 1920 x 1080 in both orientations (nothing clipped, Back button not covered).
- **Reduced motion:** all movement is driven from JavaScript (one rAF loop), so every state is reached.
- **Text:** numerals only (counter, basket count above 8 items, `xN` on the receipt).

## 7. Risks and limitations

- Look and feel on real devices has not been checked (sections 17-18).
- An item scanned by a fast drag that ends away from the scanner still counts as scanned.

## 8. Configuration

No external configuration. Constants at the top of [`js/zakupy.js`](../../js/zakupy.js): `SCAN_FLASH_S` (0.45), `BACK_S` (0.4), `TO_S` (0.6), `RECEIPT_S` (0.9), `DONE_S` (4), `MAX_ROUND` (5, counter wave size), `MAX_BASKET` (15), `SHELF_N` (6), `RESTOCK_S` (2), plus the `PRODUCTS` list (22 kinds). Changing them needs a code edit.

## 9. Assets

No external asset files. Products, basket, register, receipt and the owner (via [`js/animals.js`](../../js/animals.js)) are inline SVG; the menu icon is inline SVG in `js/activities.js`.

## 10. Randomization and variants

Six random kinds on the shelves per round (never the same set twice in a row), 2-4 random units per slot, a list of distinct kinds drawn from the shelf kinds, a random owner animal per round.

## 11. Progression and difficulty

List length grows from 1 to 5 over five rounds and then repeats from 1; nothing persists.

## 12. Completion and feedback

A round is complete when every counter item has been scanned; feedback is the receipt, the owner's smile and an automatic new list. No failure state. The activity is open-ended.

## 13. Analytics and metrics

This activity reports to the shared on-device module `js/analytics.js` (`window.Analytics`). `js/app.js` records the activity start and end and the module counts touches; `js/zakupy.js` additionally calls `Analytics.track('interaction', { variant })` with `variant` the product id (22 kinds, for example `apple`, `bread`, `eggs`) for each product put in the basket and each scan, and `Analytics.complete()` when a list is fully scanned. The activity stays open-ended (a new list starts by itself). All calls are wrapped so that nothing changes if `window.Analytics` is missing. See [README.md](README.md#analytics-status).

## 14. Technical implementation

- **Entry point:** `mount(container)` in [`js/zakupy.js`](../../js/zakupy.js) overrides `mount` of the `zakupy` entry; returns a cleanup function.
- **Rendering:** `div.zk` with a wall, floor, top strip (list pictures and numeral), shelf planks, a counter scene (belt, bag row, scanner), a receipt, the owner, six `button.zk-prod` shelf slots (each with up to four unit pictures) with a floating `div.zk-ghost` each for the dragged unit, `button.zk-basket`, `button.zk-reg` and five `button.zk-item`.
- **State:** phase (`fadein`, `shop`, `to`, `scan`, `wave`, `finish`, `receipt`, `out`), round number, list, basket, queued counter items, per-kind scan tally, scanned count, per-slot stock / restock timer and per-item mode.
- **Loop:** one `requestAnimationFrame` loop with `dt` capped at 0.05 s, cancelled while the tab is hidden, restarted on `visibilitychange` and input, stopped when idle; cleanup cancels it and removes listeners and DOM.
- **Persistence:** none. **Analytics:** section 13.

## 15. Responsive layout and coordinate system

- `layout()` runs on `resize` and `orientationchange`. The top strip is 12% of the height (48-64 px), a bottom band holds the basket, register and owner, and the shelf grid and counter scene share the space between. The scanner is at least as wide as five counter items.

## 16. Error and edge-case handling

| Case | Behaviour |
|---|---|
| Checkout with an empty basket | The list products appear on the counter. |
| Basket full (15) | Further products glide back; the shelf keeps its units. |
| Last unit taken | The slot is disabled for 2 s, then restocked; one take removes exactly one unit (a unit in flight cannot be taken again). |
| Same product several times | Counted normally; the receipt shows one row with `xN`. |
| Resize / orientation | Layout recomputed; items keep their state. |
| Leaving mid-round | Cleanup cancels the frame, removes listeners and the DOM. |
| Tab hidden | Loop cancelled and restarted on return; the `dt` cap prevents a jump. |
| `window.Analytics` missing | Calls are skipped. |

## 17. Testing

No automated tests exist. Manual scenarios (none are claimed as done):

- [ ] Drag products to the basket: one unit leaves the shelf, the pile grows (8+ items individually visible), an emptied slot refills after 2 s; fill 15 items and try a 16th.
- [ ] Tap the basket, drag it into the shop and press the register; each brings the items to the counter.
- [ ] Drag every item across the scanner: green flash, numeral +1, receipt, owner smile, new list after about 4 s.
- [ ] Play five rounds: list lengths 1 to 5, then 1 again.
- [ ] Keyboard: arrows, Enter and Space.
- [ ] 320 x 568, 568 x 320 and 1920 x 1080; reduced motion; leave and reopen ten times quickly.

The PR for issue [#185](https://github.com/BielinskiLukasz/child-page/issues/185) reports a Node simulation with a stub DOM.

## 18. Known limitations and open issues

**Confirmed**

- No automated tests.

**Requires verification**

- Look and feel and drag comfort on real devices.

## 19. Planned improvements

None currently planned.

## 20. Related activities and reusable components

- [Policz Razem](policz-razem.md); uses `window.Animals` and `window.Analytics`.

## 21. Change history

- Issue [#185](https://github.com/BielinskiLukasz/child-page/issues/185): initial activity.
- Issue [#209](https://github.com/BielinskiLukasz/child-page/issues/209): bigger basket (15 items), shelf units with restocking, 22 product kinds, bigger receipt with counts.
