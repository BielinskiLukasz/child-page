# Naklejki

Status: implemented

- Issue: [#221](https://github.com/BielinskiLukasz/child-page/issues/221)
- Activity id: `naklejki`
- CSS prefix: `st-`

Platform-wide behaviour (no sound, reduced motion, menu configuration, playtime limit, absence of automated tests, privacy) is described in [README.md](README.md#shared-platform-behaviour) and is not repeated here.

## 1. Overview

| Item | Value |
|---|---|
| Display name | Naklejki |
| Activity ID | `naklejki` (registry entry in [`js/activities.js`](../../js/activities.js)) |
| Description | Twelve stickers are dragged from a tray and placed freely on a meadow, sea or sky scene; each placed sticker moves gently. |
| Category | Free creative play; dragging; calming |
| Interaction type | Drag and drop (touch, mouse) with a keyboard alternative |
| Status | Implemented; enabled in the menu by default (appended last, no `defaultOff`) |
| Source | [`js/naklejki.js`](../../js/naklejki.js), styles with prefix `st-` in [`css/style.css`](../../css/style.css) |

## 2. Business purpose

- The first activity with free placing and no target: every other dragging activity has a goal. Issue [#221](https://github.com/BielinskiLukasz/child-page/issues/221).
- The picture is always nice: nothing can be wrong, scored, saved or erased by accident.

## 3. Activity flow

1. A scene (meadow, sea or sky, chosen at random) fills most of the screen; below it (portrait) or to its right (landscape) is a tray of twelve stickers, each 64 px (96 px once placed in the scene).
2. The child drags a sticker onto the scene and lets go. It appears with a short pop and then keeps a gentle loop (sway, float, twinkle, ...).
3. The same sticker can be placed again and again, up to 20 stickers on the scene. When 20 are placed the tray fades and gets a dashed outline, and further drops simply return to the tray.
4. Dragging a placed sticker moves it; letting go on the tray removes it; tapping it makes it wiggle once.
5. The round button at the top right (56 px) starts a new scene: stickers fade out and the background cross-fades to the next one over 0.8 s.
6. Exit: Back button or browser Back.

## 4. Rules and behavior

| Rule | Detail |
|---|---|
| Stickers | sun, flower, fish, cloud, bird, house, tree, boat, star, butterfly, heart, balloon (same tray for every scene). |
| Limit | 20 stickers on the scene; a drop above the limit returns to the tray. |
| Drop outside the scene | The sticker flies back to the tray (new) or to its old place (placed) in 0.26 s. |
| Tap | A tap (under 6 px of movement) on a placed sticker wiggles it once; a tap on a tray sticker does nothing. |
| Scene order | The three backgrounds are shuffled; each is shown once before any repeats, and the first scene of a new launch differs from the last one shown in the same page session. |
| New scene | Stickers fade for 0.8 s while the next background cross-fades in, then the stickers are removed. The button is ignored while this runs. |
| Failure, score | None; nothing is stored. |
| Text | None on screen; Polish screen-reader labels only. |

## 5. Educational and developmental benefits

**Intended design benefits:** creative composition, cause and effect (place, it comes alive), fine motor control of drag and drop, early naming of everyday pictures.

**Directly observable behavior:** every placed sticker moves in its own gentle way; the child can build any picture.

**Requires professional or research-based validation:** any effect on creativity or vocabulary.

## 6. Accessibility and usability

- Input: touch, mouse, keyboard. Tray stickers and placed stickers are buttons (Tab). On a tray sticker Enter/Space places it in the centre of the scene and moves the focus to it; on a placed sticker arrows move it (5% of the free range per press), Enter/Space wiggles it and Delete/Backspace removes it.
- Targets: tray stickers are 64 px and placed stickers 96 px, the new-scene button 56 px; the scene starts 72 px below the top so the fixed Back button is never covered.
- Colour is not the only cue: every sticker has its own shape; the "full" state is shown by a faded tray with a dashed outline.
- Reduced motion: the loops and the pop are CSS animations that the global rule disables; every state (placed, removed, new scene) is still reached through timers and base styles. Every loop is 1.4 s or longer (nothing flashes; the sun turns once per 14 s).
- Only the first pointer drags; a second finger is ignored.

## 7. Risks and limitations

- Tested only with stub-DOM simulations in this environment (no browser), see section 17.
- Placed stickers can overlap or stack exactly (keyboard placement always uses the centre); the last placed is on top.
- Pictures are simple inline SVG and not checked on real devices.

## 8. Configuration

No external configuration. Constants at the top of `js/naklejki.js`: `SIZE` (96, placed sticker), `MAX` (20), `FADE_MS` (800), `TAP_PX` (6), `STEP` (0.05), `RETURN_MS` (260) and the `KINDS` list (picture, Polish label, loop motion).

## 9. Assets

No asset files: stickers are inline SVG in `js/naklejki.js`, backgrounds are CSS gradients, the menu icon is in `js/activities.js`.

## 10. Randomization and variants

The first scene and the scene order (shuffled, each once per cycle, no repeat across the cycle boundary); the animation delay of every placed sticker so the loops are out of step. Nothing persists.

## 11. Progression and difficulty

None.

## 12. Completion and feedback

No completion; the activity stays open-ended. Feedback: a pop on placing, a wiggle on touching, a fly-back when a drop is not accepted.

## 13. Analytics and metrics

Reports to `window.Analytics` (see [README.md](README.md#analytics-status)):

- `track('interaction', { variant: '<sticker id>' })` for each placement from the tray (drag-drop or keyboard); moving, wiggling, removing and new scenes are not reported.
- No `complete()`.

Calls are wrapped in try/catch; nothing is stored by the activity.

## 14. Technical implementation

- **Entry point:** `mount(container)` overrides `mount` of the `naklejki` entry; the root is attached with `container.appendChild` before anything is measured; it returns a cleanup function that removes listeners and timers.
- **Rendering:** `div.st > div.st-scene (two background layers + div.st-items)`, `div.st-tray` of twelve buttons, `button.st-new`. Placed stickers are `button.st-item` with three nested spans (pop, wiggle, loop) so the animations do not fight. SVG sizing uses `.stage .st-svg`.
- **Model:** each sticker is `{kind, fx, fy}` with `fx, fy` in 0..1 of the free range (`left = (100% - 96px) * fx`), so no resize code is needed.
- **Drag:** a pointerdown on a sticker arms a drag; after 6 px a fixed-position ghost copy follows the pointer (the placed original is hidden); on release the ghost centre decides: scene = place/move, tray = remove, elsewhere = fly back.

## 15. Responsive layout and coordinate system

Pure CSS: portrait puts the tray (4 x 3 grid, 270 px wide) under the scene, landscape (aspect ratio 1:1 or wider) puts it at the right. Positions are fractions of the scene, so rotation keeps every sticker visible and in place relative to the scene.

## 16. Error and edge-case handling

- Rotation or resize: layout is CSS only; a drag in progress is judged at release with fresh measurements.
- Tab hidden and shown: CSS animations pause by themselves; timers are short (0.8 s).
- Very fast repeated touches: the new-scene button and new drags are ignored while a scene change runs; the 20 limit is checked at every placement.
- Two fingers: the second pointer is ignored; `pointercancel` restores a hidden sticker.

## 17. Testing

Manual scenarios:

1. Drag each of the twelve tray stickers onto the scene; each pops and starts its loop.
2. Place the same sticker five times; place 20 in total, then try a 21st: it returns to the tray and the tray looks faded.
3. Drop a sticker on the tray: it returns. Drag a placed sticker to the tray: it disappears (the tray is no longer faded).
4. Tap a placed sticker: one wiggle.
5. Press the round button six times, waiting 1 s between presses: all three backgrounds appear once in each group of three; the stickers are gone.
6. Rotate the device with stickers placed: all stay in view.
7. Keyboard: Tab to a tray sticker, Enter (placed in the centre, focus moves to it), arrows move it, Delete removes it.
8. Touch with two fingers: the second is ignored.

A Node stub-DOM simulation (drops, second pointer, tray return, the 20 limit, removal, wiggle, keyboard, scene order, cleanup) was run during development; there is no automated test suite in the repository.

## 18. Known limitations and open issues

No renderer was available to the author; the look of the pictures and the layout at 320 px and 568x320 need a check on a real device.

## 19. Planned improvements

None agreed; erasing, saving and scoring are out of scope.

## 20. Related activities and reusable components

Other free-drag activities: [Kolorowe Kształty](kolorowe-ksztalty.md), [Ubierz Misia](ubierz-misia.md). Reuses `window.Rand` and `window.Analytics`.

## 21. Change history

- Implemented from issue [#221](https://github.com/BielinskiLukasz/child-page/issues/221).
