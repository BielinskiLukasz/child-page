# Mieszanie Kolorów

Platform-wide behaviour (no sound, reduced motion, menu configuration, playtime limit, absence of automated tests, privacy) is described in [README.md](README.md#shared-platform-behaviour) and is not repeated here.

## 1. Overview

| Item | Value |
|---|---|
| Display name | Mieszanie Kolorów |
| Activity ID | `mieszanie` (registry entry in [`js/activities.js`](../../js/activities.js)) |
| Description | Red, yellow and blue paint blobs are dragged into a big pot; two different colours blend into a new one. |
| Category | Cause and effect; combining; open-ended play; calming |
| Interaction type | Drag and drop (touch, mouse), keyboard alternative |
| Status | Implemented; enabled in the menu by default (appended last, no `defaultOff`) |
| Source | [`js/mieszanie.js`](../../js/mieszanie.js), styles with prefix `mx-` in [`css/style.css`](../../css/style.css) |
| Issue | [#211](https://github.com/BielinskiLukasz/child-page/issues/211) |

## 2. Business purpose

- The first activity where the child combines things to make something new; colour otherwise appears only in sorting ([Kolorowe Kubeczki](kolorowe-kubeczki.md)).
- Every mix is a happy surprise: no wrong answers, no failure.

## 3. Activity flow

1. The child opens the tile and sees a big glass pot on a warm background and a wooden shelf with three paint blobs.
2. Drag a blob over the pot (the pot gets a white outline) and release: it flies in (0.25 s) with a soft splash ring.
3. The first blob colours the pot. A second **different** blob blends the pot colour over 1.5 s into the mix.
4. The result blob (same pattern as the mix) rises above the pot and glows for 3 s; then the pot empties over 1 s and the next round starts.
5. When all three different mixes have been made once, a friendly animal in the matching colour sits beside the pot for that 3 s glow (fox, frog or bunny), and the set starts counting again.
6. Every new mixed colour is remembered: a blob in that colour appears on a second shelf (below the pot row in portrait, a column at the right edge in landscape) and can be dragged into the pot like the three basic ones. The shelf keeps the last 4 created colours; the oldest is replaced. Mixing any two different blobs gives a colour (the average of the two) with its own white mark; the three basic pairs give orange, green and purple. Memory lives only while the activity is open.
7. The rounds repeat without end. Exit: Back button or browser Back.

## 4. Rules and behavior

| Rule | Detail |
|---|---|
| Blobs | Red (1 dot), yellow (2 dots), blue (3 dots), each at least 72 px; the shelf blob reappears (fade 0.5 s) after a drop, so each can be used any number of times. |
| Mixes | red + yellow = orange (stripes), yellow + blue = green (zigzag), red + blue = purple (ring). |
| Same colour twice | The pot just stays that colour with a small glow (1 s); no result, no `complete()`. A different colour dropped afterwards mixes with it. |
| Drop target | The pot plus a 16 px margin and the space above its opening. A blob released elsewhere, or while the pot is mixing, glowing or emptying, drifts back in 0.5 s. |
| Saved colours | Up to 4 (`SAVED_MAX`), 56-64 px, newest last; a colour already on a shelf or within 24 (summed RGB difference) of one is not added again. Mixed colours get one of six white marks (square, triangle, diamond, cross, wave, smile) so colour is not the only cue. |
| Animal | Appears only when the three different mixes have each been made since the start or since the last animal. |
| Failure, score | None; nothing is scored or stored. No text on screen. |
| Sound | None. |

## 5. Educational and developmental benefits

**Intended design benefits**

- Cause and effect and drag-and-drop with a finger.
- Noticing that colours combine into new ones.

**Directly observable behavior**

- Two different blobs always produce the matching colour and pattern, and a mix is never wrong.

**Requires professional or research-based validation**

- Any claim about learning or developmental benefits; nothing in the code can establish it.

## 6. Accessibility and usability

- Blobs are `button`s with Polish `aria-label`s; Tab moves between them and Enter or Space drops the focused blob into the pot (keyboard alternative to dragging).
- Colour is never the only cue: dots on the basic blobs, and stripes, zigzag or ring on the mixes and animals.
- Targets: blobs 72-100 px; the pot is at least 30% of the screen width.
- Reduced motion: every state is driven by one rAF loop, so all states are reached; motion is slow (no turn faster than one per second, no flashing).

## 7. Risks and limitations

- Rendering was not checked in a real browser by the implementing agent (only syntax and a stub-DOM simulation); see section 17.
- On a 568x320 screen the result blob rises close to the top edge (not over the Back button).

## 8. Configuration

None. Texts are only the Polish `aria-label`s.

## 9. Assets

Everything is inline SVG (blobs, pot, three animals) drawn in `js/mieszanie.js`; the menu icon is in `js/activities.js`.

## 10. Randomization and variants

None; the mixes are deterministic (the three basic pairs are fixed, every other pair gives the average colour).

## 11. Progression and difficulty

None.

## 12. Completion and feedback

Each finished mix is a completion (`complete()`); feedback is the colour blend, a glowing result blob and, after a full set, an animal. The activity never ends by itself.

## 13. Analytics and metrics

`js/app.js` records start and end and the module counts touches. `js/mieszanie.js` additionally calls `window.Analytics.track('interaction', { variant })` on each drop accepted by the pot (a blob released over the pot while it is mixing, glowing or emptying just drifts back and is not counted) with the blob colour (`red`, `yellow`, `blue`, `orange`, `green`, `purple`, or `mixed` for any other) and `complete()` for each mix. Nothing else is stored; the saved colours are not persisted.

## 14. Technical implementation

- **Entry point:** `mount(container)` in [`js/mieszanie.js`](../../js/mieszanie.js) overrides `mount` of the `mieszanie` entry; returns a cleanup function (listeners, rAF, root).
- **Rendering:** `div.mx > shelf + glow + pot svg + result blob + animal + splash + button.mx-blob per basic and saved colour`; the root is attached with `container.appendChild(root)` before layout.
- **State:** pot phase `open`, `mix`, `glow`, `empty`; numeric tweens for the fill level and the liquid colour (kept as `[r,g,b]`, never re-parsed from strings); blob modes `home`, `drag`, `back`, `fly`.
- **Loop:** one capped-dt (0.05 s) rAF loop, stopped when idle and while the page is hidden.

## 15. Responsive layout and coordinate system

- `.mx` is fixed full-screen; positions are pixels recomputed in `layout()` on `resize` and `orientationchange`; the pot state, level and colour are kept.
- Saved blobs are 56-64 px: a row above the shelf when the height is at least 400 px, otherwise a column at the right edge (the basic blobs and the pot are centred in the remaining width).
- Blob size is 72 px when the height is under 400 px, otherwise `min(width / 3.6, 100)` (at least 80). Pot width is `min(50% of the width, available height x 1.18)`, never below 31% of the width where height allows.

## 16. Error and edge-case handling

| Case | Behaviour |
|---|---|
| Rotation or resize | Layout recomputed; the pot colour, level and phase are kept. |
| Tab hidden and shown | The loop pauses and resumes; timers are time-stepped, not wall-clock. |
| Very fast repeated touches | Drops are handled in order; a drop while the pot is busy drifts back. |
| Two fingers | The second pointer is ignored while one blob is dragged. |
| Analytics missing or failing | Ignored. |

## 17. Testing

No automated tests exist. Manual scenarios (none are claimed as done):

- [ ] Drag red then yellow into the pot: it turns orange over 1.5 s, an orange striped blob glows for 3 s, the pot empties over 1 s.
- [ ] Repeat for yellow + blue (green) and red + blue (purple), then check that an animal appears beside the pot during the third glow.
- [ ] Drop red twice: the pot stays red with a small glow and no result appears.
- [ ] Release a blob next to the pot: it returns in 0.5 s.
- [ ] Tab to a blob and press Enter or Space: it is dropped into the pot.
- [ ] Make several mixes and check the new colours appear on the second shelf, can be dragged into the pot, and the fifth new colour replaces the oldest.
- [ ] After a keyboard drop, focus stays on the blob (Tab is not needed again).
- [ ] Rotate the device in the middle of a mix and check nothing is lost; hide and show the tab.
- [ ] With reduced motion enabled, check that all states are still reached.

## 18. Known limitations and open issues

**Confirmed**

- No automated tests; the stub-DOM simulation used during development is not part of the repository.

**Unverified**

- Visual appearance on real devices.

## 19. Planned improvements

None currently planned.

## 20. Related activities and reusable components

- [Kolorowe Kubeczki](kolorowe-kubeczki.md) (colour sorting).

## 21. Change history

- Issue [#211](https://github.com/BielinskiLukasz/child-page/issues/211): initial activity.
- PR #243 review follow-up: remembered mixed colours (second shelf), keyboard focus kept after a drop, metrics only for accepted drops.
