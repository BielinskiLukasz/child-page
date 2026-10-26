# Zwierzątka na Farmie

Platform-wide behaviour (no sound, reduced motion, menu configuration, playtime limit, absence of automated tests, privacy) is described in [README.md](README.md#shared-platform-behaviour); this document only records what is specific to this activity.

## 1. Overview

| Item | Value |
|---|---|
| Display name | Zwierzątka na Farmie |
| Activity ID | `farma` (registry entry in [`js/activities.js`](../../js/activities.js)) |
| Description | A pastel farm with a barn and five random animals. Touching an animal makes it react slowly; touching the barn opens its door so that a round face peeks out. |
| Category | Cause and effect; exploratory; open-ended play |
| Interaction type | Tap (touch, mouse, keyboard) |
| Status | Implemented; enabled in the menu by default |
| Source | [`js/farma.js`](../../js/farma.js), styles with prefix `fm-` in [`css/style.css`](../../css/style.css), script tag in [`index.html`](../../index.html) |

## 2. Business purpose

- Offers a gentle "touch an animal and see how it reacts" toy where every animal has its own small movement (sheep sways, cow nods its head, hen flaps, cat swishes its tail).
- Variety: the five animals are drawn at random from 11, so the farm differs between launches.
- Complements [Mały Pociąg](maly-pociag.md) and [Dobranoc](dobranoc.md), which also use the shared animal family, but with farm-themed reactions and a barn that can be opened.
- Described in the README Activities list as item 12.

## 3. Activity flow

1. The child opens the tile; the farm is built and an animation loop starts.
2. Initially displayed: a pale sky with sun, hills, a fence, a barn on the left and five animals. All animals breathe slowly and blink every few seconds.
3. Interactions: tap an animal or the barn.
4. Response: the animal reacts for 2.6 s (taps meanwhile are ignored); the barn door opens, a face peeks out and the door closes over 4.6 s.
5. There is no completion state.
6. Everything returns to idle by itself and can be tapped again.
7. Restart: leave and re-open for a new random selection and arrangement.
8. Exit: Back button or browser Back.

## 4. Rules and behavior

| Rule | Detail |
|---|---|
| Animal reaction | `REACT = 2.6` s, eased with `sin(pi * p)` (smooth in and out). A tap on an animal that is already reacting is ignored. |
| Barn | `BARN = 4.6` s. Door opens during the first 25 %, the face rises between 20 % and 40 %, stays until 60 %, goes down by 75 %, and the door closes from 75 % to 100 %. Door scaling is `1 - 0.88 * door` horizontally; the face rises 26 board units. Taps during the sequence are ignored. |
| Reaction per animal | Sheep: rotates up to 4 degrees back and forth. Cow: head rotates up to 12 degrees. Hen: hops up to 3 units and wings flap up to 14 degrees. Cat: tail swishes up to 22 degrees. Shared-family animals (dog, pig, rabbit, mouse, frog, bear, fox): rotate up to 4 degrees and hop up to 2 units. |
| Idle | Breathing: vertical scale `1 + 0.018 * sin(1.3 * t + phase)` (random phase). Blinking: the first blink after 2 to 5 s, then every 3 to 6 s, lasting 0.18 s. Cow and barn have no breathing or blinking (the cow's SVG has no `fm-body` or `fm-eyes` group). |
| Peeking face | A generic round cream face with eyes and a mouth, not one of the five animals on screen. |
| Sound | None. |

## 5. Educational and developmental benefits

**Intended design benefits**

- Cause and effect with different results for different animals.
- Noticing and naming animals (labels are Polish names).
- Calm observation of slow movement.

**Directly observable behavior**

- Each animal reacts in its own way after touch; the barn door opens and closes slowly.
- Taps on empty space do nothing; no failure or score.

**Requires professional or research-based validation**

- Any claim about animal recognition or vocabulary. Nothing in the code can establish it.

## 6. Accessibility and usability

- **Input:** all 6 interactive elements are native `<button>`s using the `click` event; touch, mouse and keyboard (Tab, Enter, Space) work.
- **Labels (Polish):** hand-drawn animals "Owieczka", "Krowa", "Kura", "Kotek"; barn "Stodoła"; shared animals use the name from `js/animals.js`. There is no state announcement.
- **Target sizes:** buttons are square, `min-width/min-height: 56px`; widths are 16 to 30 % of the board for animals and 32 % for the barn (see section 15).
- **Layout:** 4:3 board fitted into the viewport (with padding for the Back button and safe areas); works in portrait and landscape (a smaller board in portrait).
- **Colour:** nothing depends on colour.
- **Reduced motion:** all idle and reaction movement is driven by one `requestAnimationFrame` loop and `transform`s, so it survives the global reduced-motion rule.
- **Touch:** `touch-action: manipulation`.
- **Reading:** not required. A young child can use it independently.
- **Limitation:** animal sizes do not follow real-world size (see section 18).

## 7. Risks and limitations

- A loop that runs continuously (breathing and blinking), even when nothing was touched; on slow devices this is constant work (requires verification).
- Animal sizes depend on the slot, not on the animal, so a small animal can appear larger than a big one.
- The five hit areas can overlap slightly (see section 18).
- No ending; relies on the global playtime limit.
- No privacy concerns; nothing is stored.

## 8. Configuration

No external configuration. Constants in [`js/farma.js`](../../js/farma.js):

| Constant | Purpose | Value |
|---|---|---|
| `REACT` | Animal reaction duration | 2.6 s |
| `BARN` | Barn sequence duration | 4.6 s |
| `MAXDT` | Frame time cap | 0.05 s |
| `HAND` | Hand-drawn animals | sheep, cow, hen, cat |
| `SHARED` | Animals drawn by `Animals.head` | dog, pig, rabbit, mouse, frog, bear, fox |
| `BARN_POS` | Barn left, top, width (percent of board) | 3, 14, 32 |
| `SLOTS` | Animal slots (left, top, width in percent) | (38,36,30), (79,36,18), (4,58,26), (64,66,20), (40,74,16) |

Fallback: none; `window.Animals` is required for the shared animals and `window.Rand` for the selection, and neither is checked for being absent.

## 9. Assets

No external asset files. Hand-drawn animals (`SVG.sheep`, `SVG.cow`, `SVG.hen`, `SVG.cat`), the barn (`SVG.barn`) and the backdrop (`BACKDROP`: sky, sun, hills, fence, `viewBox="0 0 400 300"`) are inline SVG strings in the JavaScript. The seven shared animals come from `Animals.head(id, { body: true, eyesClass: 'fm-eyes' })` in [`js/animals.js`](../../js/animals.js), scaled by 1.2. No images, fonts or audio.

## 10. Randomization and variants

- `window.Rand.pick(HAND.concat(SHARED), 5)` selects **5 unique animals from 11** ([`js/random.js`](../../js/random.js)): 462 possible sets. The returned order assigns the animals to the five slots, so the arrangement is random too (first animal gets the largest slot).
- The barn and backdrop are fixed.
- Random breathing phase and blink timing per animal.
- Nothing is stored; there is no guard against the same selection on consecutive launches.

## 11. Progression and difficulty

None. There are no levels or persistence.

## 12. Completion and feedback

There is no completion state and no failure. Feedback is the animal's own reaction, or the barn door and the peeking face. No sound; nothing starts automatically except the idle breathing and blinking.

## 13. Analytics and metrics

On `main` this activity emits **no analytics events** (see [Analytics status](README.md#analytics-status)); usage metrics are only proposed in open PR [#172](https://github.com/BielinskiLukasz/child-page/pull/172).

| Event | Emitted today |
|---|---|
| `activity_start`, `activity_end`, `activity_complete`, `activity_restart`, `interaction`, `level_start`, `level_complete` | No (none are implemented) |

All metrics (starts, active time, average active time per start, completions, completion rate, replays, exit-before-completion, highest level, interactions) are **not supported**.

*Not implemented, for planning only:* active time and interactions (animal and barn taps; the variant could be the animal id) are the meaningful measures; there is no completion or level. No personally identifiable information would be needed.

## 14. Technical implementation

- **Entry point:** `mount(container)` in [`js/farma.js`](../../js/farma.js); sets `container.style.display = 'block'` (not restored; `app.js` empties the stage on exit). The cleanup function removes the `visibilitychange` listener, cancels the frame and removes the scene.
- **Rendering:** a `div.fm-board` with the backdrop SVG and 6 absolutely positioned `<button>`s (barn plus 5 animals), each containing an SVG; percent-based `left`, `top`, `width`. Fixed DOM; nothing is added or removed after mount.
- **State:** per figure `t` (reaction time, -1 when idle), breathing phase, blink timer, references to its SVG parts.
- **Loop:** `frame()` with `dt` capped at 0.05 s sets `transform`s on the SVG groups (`transform-origin` set from JavaScript). It re-requests itself on every frame while the tab is visible (it does not stop when idle); it is cancelled when the tab is hidden and restarted by `wake()`.
- **Events:** `click` on each button; `visibilitychange`.
- **Shared code:** `Rand.pick`, `Animals.head`, `Animals.byId`, `Animals.eyes`.
- **Persistence and analytics:** none.

## 15. Responsive layout and coordinate system

- The board is 4:3, width `min(100%, (100dvh - safe areas - 64px) * 4 / 3)`. Buttons are positioned in percent of the board (left, top, width) and are square (`aspect-ratio: 1`), so their height is `width * 4/3` of the board height in percent terms.
- The backdrop is an SVG with `preserveAspectRatio="none"` in the same 4:3 box, so it aligns with the buttons.
- Each figure SVG uses `viewBox="0 0 100 100"`; the reaction animations use SVG units (for example a 26-unit rise of the barn face).
- Portrait and landscape share one layout; the 56 px minimum size can make buttons larger than their percentage on narrow boards.

## 16. Error and edge-case handling

| Case | Behaviour |
|---|---|
| Tap during a reaction | Ignored. |
| Tab hidden | Loop cancelled; restarted on return with `last = 0`, so no catch-up. |
| Resize / orientation | CSS only. |
| Pool smaller than 5 | Not applicable (11 animals available). |
| Leaving mid-reaction | Cleanup cancels the frame. |
| `window.Animals` / `window.Rand` missing | Not handled. |

## 17. Testing

No automated tests exist. Manual scenarios (none are claimed as done):

- [ ] Normal: open the activity; five animals and the barn are visible; animals breathe and blink; tap each animal; it reacts for about 2.6 s.
- [ ] Tap an animal repeatedly during its reaction; extra taps are ignored and nothing breaks.
- [ ] Barn: tap the barn; the door opens, a face peeks out and the door closes over about 4.6 s; extra taps are ignored.
- [ ] Incorrect interaction: tap the sky, hills and fence; nothing happens.
- [ ] Restart/randomization: re-open the activity about 15 times; the five animals and their positions vary; no duplicate animal in one scene; all 11 animals can appear.
- [ ] Progression: confirm that there is none.
- [ ] Portrait and landscape; rotate on a running reaction.
- [ ] Hit areas: tap the overlapping edges of neighbouring animals (see section 18) and confirm which one reacts.
- [ ] Small screens: every animal is at least 56 px and reachable.
- [ ] Touch and mouse; keyboard (Tab through all 6 buttons, Enter/Space activates, focus ring visible).
- [ ] Background/foreground: switch tab during a reaction; it continues without a jump.
- [ ] Reduced motion: idle movement and reactions still play.
- [ ] Browsers: Chrome desktop, Chrome Android, Safari iPhone/iPad.

PR [#42](https://github.com/BielinskiLukasz/child-page/pull/42) reports a Node run of the loop against a DOM stub and lists manual browser tests as pending. PR [#137](https://github.com/BielinskiLukasz/child-page/pull/137) lists the fifth slot on narrow portrait screens and the visual fit of larger animals as pending manual checks.

## 18. Known limitations and open issues

**Confirmed**

- Animal size is determined by the slot, not by the animal: the first random animal always gets the widest slot (30 % of the board), the last the narrowest (16 %), so a mouse can be drawn larger than a dog. Item 5 of open issue [#167](https://github.com/BielinskiLukasz/child-page/issues/167) asks for size classes; fix in open PR [#173](https://github.com/BielinskiLukasz/child-page/pull/173) (not merged).
- The peeking face in the barn is a generic cream face, not one of the displayed animals (`A.barn.who` is set but never read).
- The cow neither breathes nor blinks (its SVG lacks the `fm-body` and `fm-eyes` groups).
- Hit boxes of the slots overlap (computed from `SLOTS`): slot 1 (38, 36, 30) and slot 4 (64, 66, 20) overlap by 4 % x 10 % of the board; slot 1 and slot 5 (40, 74, 16) by 16 % x 2 %. The later button in DOM order is on top. The visible artwork may not fill the boxes (requires verification).
- The animation loop never idles while the activity is open.
- No automated tests.

**Requires verification**

- The fifth slot on narrow portrait screens (pending manual check in PR #137).
- Constant frame work on low-end devices.

## 19. Planned improvements

Size classes for the animals are proposed in open issue [#167](https://github.com/BielinskiLukasz/child-page/issues/167) / PR [#173](https://github.com/BielinskiLukasz/child-page/pull/173). Otherwise `None currently planned`.

## 20. Related activities and reusable components

- Other activities with the shared animal family: [Mały Pociąg](maly-pociag.md), [Dobranoc](dobranoc.md), [Zabawa w Chowanego](zabawa-w-chowanego.md), [Cienie](cienie.md), [Buźki](buzki.md), [Autobusik](autobusik.md).
- Shared helpers: [`js/animals.js`](../../js/animals.js) (`Animals.head`, `Animals.byId`, `Animals.eyes`) and [`js/random.js`](../../js/random.js) (`Rand.pick`).

## 21. Change history

- Issue [#32](https://github.com/BielinskiLukasz/child-page/issues/32) / PR [#42](https://github.com/BielinskiLukasz/child-page/pull/42): initial activity (sheep, cow, hen, cat and barn).
- Issue [#66](https://github.com/BielinskiLukasz/child-page/issues/66) / PR [#68](https://github.com/BielinskiLukasz/child-page/pull/68): the barn door's X is part of the door group, so it scales with the door.
- Issue [#113](https://github.com/BielinskiLukasz/child-page/issues/113) / PR [#137](https://github.com/BielinskiLukasz/child-page/pull/137): five random animals from a wider pool (shared family added); the pool was later widened to 11 (commit `a312c6d`).
- Open: issue [#167](https://github.com/BielinskiLukasz/child-page/issues/167) / PR [#173](https://github.com/BielinskiLukasz/child-page/pull/173): animal size classes.
