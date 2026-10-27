# Psia Myjnia

Platform-wide behaviour (no sound, reduced motion, menu configuration, playtime limit, absence of automated tests, privacy) is described in [README.md](README.md#shared-platform-behaviour) and is not repeated here.

## 1. Overview

| Item | Value |
|---|---|
| Display name | Psia Myjnia |
| Activity ID | `psiamyjnia` (registry entry in [`js/activities.js`](../../js/activities.js)) |
| Description | A car wash only for dogs: a muddy dog of a random breed stands in the wash, the child scrubs the mud away with a finger, the dog shakes, smiles and glows, and the next breed arrives about 4 s later. |
| Category | Cause and effect; open-ended play; calming |
| Interaction type | Finger drag (touch, mouse), keyboard alternative |
| Status | Implemented; enabled in the menu by default (appended last, no `defaultOff`) |
| Source | [`js/psiamyjnia.js`](../../js/psiamyjnia.js), shared drawings in [`js/dogs.js`](../../js/dogs.js), styles with prefix `pj-` in [`css/style.css`](../../css/style.css) |

## 2. Business purpose

- Washing dogs in [Myjnia](myjnia.md) is the child's favourite game; this version keeps the scrubbing and makes every dog a different breed (issue [#176](https://github.com/BielinskiLukasz/child-page/issues/176)).
- Uses the shared dog drawings of [Rasy Piesków](rasy-pieskow.md) (`window.Dogs`, issue [#175](https://github.com/BielinskiLukasz/child-page/issues/175)) and adds a happy shake as the reward.
- Gives a parent the Polish breed name for a few seconds after each wash.

## 3. Activity flow

1. The child opens the tile; a random breed is chosen and its mud mask is painted (the box stays hidden until the silhouette image has loaded).
2. Initially displayed: a muddy dog (calm face) on a pale blue wash background with foam patches.
3. Interactions: drag a finger or mouse over the dog; or focus the dog and use the arrow keys and Enter/Space.
4. Response: mud is erased along the drag path and soap bubbles rise from it.
5. At about 90% clean (`DONE_AT = 0.9`) the rest of the mud fades (1.2 s), the dog turns happy, shakes for 1 s with droplets, glows for about 3 s and its Polish breed name appears small underneath for 3 s.
6. About 4 s after being clean (`NEXT_AT_S = 4`) the dog fades out (0.7 s) and the next breed fades in (0.7 s), muddy again.
7. Restart: automatic; there is no menu or button.
8. Exit: Back button or browser Back.

## 4. Rules and behavior

| Rule | Detail |
|---|---|
| Breeds | The 8 breeds of `Dogs.LIST`; the next one is chosen at random from all breeds except the previous one (module variable `lastId`, so also across launches). |
| Scrubbing | Brush width at least 56 CSS px; erased with `destination-out` on the mud canvas; strokes between pointer positions are interpolated. |
| Completion | Alpha of the mud canvas sampled on a 48 x 40 copy every 0.12 s while dirty; done when at most 10% of the starting mud remains. |
| Reward | Shake: rotation up to 6 degrees at 3 Hz fading out over 1 s (tail wags with it); 14 droplets; glow 3 s (drop-shadow); breed name visible for 3 s. |
| Faces | Only `dg-calm` and `dg-happy`; no angry or sad face exists. |
| Bubbles | Pool of 28 reusable elements, one at most every 0.09 s, 1.8 s life. |
| Failure, score | None; nothing is scored or stored. |
| Sound | None. |

## 5. Educational and developmental benefits

**Intended design benefits**

- Cause and effect and fine motor control (finger drag).
- Noticing different dog breeds (silhouette, colour, ears, tail).

**Directly observable behavior**

- Mud disappears where the finger passes; the dog is happy and shakes when clean.
- A new breed arrives each time; the Polish name is shown briefly.

**Requires professional or research-based validation**

- Any claim about breed recognition or vocabulary; nothing in the code can establish it.

## 6. Accessibility and usability

- **Input:** pointer events (touch, mouse, stylus; several pointers each keep their own stroke); keyboard: the dog box is focusable (`tabindex="0"`, visible 4 px focus ring), arrow keys move the brush (step 7% of the box), Enter/Space advance it along a zig-zag path (rows 12% apart).
- **Labels (Polish):** the box has an `aria-label` with the breed ("Brudny piesek: Labrador. Strzałki przesuwają szczotkę, Enter lub spacja szoruje dalej."); the SVG is `aria-hidden`.
- **Target sizes:** the dog box is at least 120 px wide and normally fills the available area; the brush is at least 56 px.
- **Layout:** one centred 6:5 box, portrait and landscape from 320 x 568 to 1920 x 1080 (max width 680 px).
- **Colour:** completion is also shown by the happy mouth and the shake, not only by colour.
- **Reduced motion:** all end states are set from JavaScript (mud hidden, happy mouth, glow, name); only the shake and tail wag are skipped.
- **Text:** none except the small parent-facing breed name.

## 7. Risks and limitations

- Breed recognisability and the look of the mud on every breed have not been checked on a device (sections 17 and 18).
- The mud silhouette comes from an SVG data-URL image; if the image never loads the dog stays hidden.
- No ending; relies on the global playtime limit.

## 8. Configuration

No external configuration. Constants in [`js/psiamyjnia.js`](../../js/psiamyjnia.js): `LW`/`LH` (480 x 400 mask), `MAX_BUBBLES` (28), `BUBBLE_S`, `SPAWN_GAP_S`, `DROPS` (14), `DONE_AT` (0.9), `FADE_MUD_S` (1.2), `SHAKE_S` (1), `SHAKE_DEG` (6), `SHAKE_HZ` (3), `GLOW_S` (3), `NAME_S` (3), `NEXT_AT_S` (4), `SWAP_S` (0.7). Changing them needs a code edit.

## 9. Assets

No external asset files. Dogs are inline SVG built by `Dogs.draw(id)`; the same markup is loaded as an `Image` (cached per breed in `IMG_CACHE`) to paint the mud silhouette. The menu icon is an inline SVG in `js/activities.js`.

## 10. Randomization and variants

- Breed: 8 values, uniform, never equal to the previous breed (filter of `Dogs.LIST` by `lastId`).
- Mud blotches: 46 random circles per dog.
- Droplet directions and bubble positions are random.

## 11. Progression and difficulty

None; there are no levels and nothing persists.

## 12. Completion and feedback

Each dog has a completion (about 90% clean). Feedback: the rest of the mud fades, happy mouth, shake with droplets, glow, breed name. No failure state. The next dog starts automatically.

## 13. Analytics and metrics

This activity reports to the shared on-device module `js/analytics.js` (`window.Analytics`). `js/app.js` records the activity start and end and the module counts touches in the stage; `js/psiamyjnia.js` additionally calls `Analytics.track('interaction', { variant: breedId })` on each touch start and each keyboard Enter/Space, and `Analytics.complete()` when a dog is clean. All calls are wrapped so that nothing changes if `window.Analytics` is missing. Recorded: starts, active time, replays, quick exits, touches, the breed variants and the number of completed dogs. The activity is not in the module's `COMPLETABLE` list (it repeats endlessly), so exit-before-completion is not defined for it. Data stays on the device as anonymous daily aggregates; see [README.md](README.md#analytics-status).

## 14. Technical implementation

- **Entry point:** `mount(container)` in [`js/psiamyjnia.js`](../../js/psiamyjnia.js) overrides `mount` of the `psiamyjnia` entry; returns a cleanup function.
- **Rendering:** `div.pj > div.pj-field > (foam, div.pj-box, div.pj-name)`; the box holds the clean dog SVG, the mud `<canvas>`, the keyboard brush marker and the bubble and droplet layers.
- **State:** phase (`wait`, `in`, `play`, `done`, `out`), phase timer, box opacity, brush position, per-pointer last position, bubble and droplet pools.
- **Loop:** one `requestAnimationFrame` loop with `dt` capped at 0.05 s; it requests the next frame only while something is animating, guards the trailing request with `!raf`, is cancelled while the tab is hidden and restarted on `visibilitychange`.
- **Mud:** the dog image is drawn on the canvas, filled with mud colour using `source-in`, then blotched with `source-atop`.
- **Persistence:** none. **Analytics:** section 13.

## 15. Responsive layout and coordinate system

- `.pj` is fixed full-screen; `.pj-field` is inset below the Back button (64 px plus safe area) with 12 px margins.
- The box width is `min(96% of field width, (field height - 28) x 6/5, 680)` px at a 6:5 aspect, recomputed on `resize` and `orientationchange`.
- The mud mask uses logical coordinates (480 x 400) and pointer positions are converted from the box rectangle, so the cleaned area survives resize and rotation. Bubbles and droplets are positioned in percent of the box.

## 16. Error and edge-case handling

| Case | Behaviour |
|---|---|
| Leaving mid-wash | Cleanup cancels the frame, removes listeners and the DOM; a pending image callback is ignored (token check). Ten quick open/close cycles leave no loop running. |
| Two-finger touch | Each pointer id keeps its own last position; strokes are independent. |
| Pointer during fade out or loading | Ignored. |
| Tab hidden | Loop cancelled and restarted on return; the `dt` cap prevents a jump. |
| Resize / orientation | Box re-laid out; mask unchanged. |
| `window.Analytics` missing | Calls are skipped. |
| `window.Dogs` missing | Not handled. |

## 17. Testing

No automated tests exist. Manual scenarios (none are claimed as done):

- [ ] Scrub a dog clean with a finger; it shakes, glows and shows its name for about 3 s; the next breed arrives about 4 s later.
- [ ] Eight launches or washes in a row never show the same breed twice in a row.
- [ ] Rotate the device mid-wash; cleaned areas stay clean.
- [ ] Two fingers at once.
- [ ] Keyboard: Tab to the dog, arrows and Enter/Space finish the wash.
- [ ] Leave mid-wash and reopen ten times quickly.
- [ ] Small screens (320 x 568) and 1920 x 1080, portrait and landscape.
- [ ] Reduced motion: no shake, but the happy mouth, glow and name appear and the mud is gone.
- [ ] Browsers: Chrome desktop, Chrome Android, Safari iPhone/iPad.

PR for issue [#176](https://github.com/BielinskiLukasz/child-page/issues/176) reports a Node simulation with stub DOM and canvas; no visual check was possible.

## 18. Known limitations and open issues

**Confirmed**

- No automated tests.

**Requires verification**

- Appearance of the mud silhouette on each breed and rendering of the SVG data-URL image in Safari.

## 19. Planned improvements

None currently planned.

## 20. Related activities and reusable components

- [Myjnia](myjnia.md) (vehicles and animals, same scrubbing mechanic), [Kąpiel Zwierzątek](kapiel-zwierzatek.md), [Rasy Piesków](rasy-pieskow.md).
- Shared component: [`js/dogs.js`](../../js/dogs.js) (`Dogs.LIST`, `Dogs.draw`).

## 21. Change history

- Issue [#176](https://github.com/BielinskiLukasz/child-page/issues/176): initial activity.
