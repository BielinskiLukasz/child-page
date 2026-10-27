# Rasy Piesków

Platform-wide behaviour (no sound, reduced motion, menu configuration, playtime limit, absence of automated tests, privacy) is described in [README.md](README.md#shared-platform-behaviour); this document only records what is specific to this activity.

## 1. Overview

| Item | Value |
|---|---|
| Display name | Rasy Piesków |
| Activity ID | `rasy` (registry entry in [`js/activities.js`](../../js/activities.js)) |
| Description | A gallery of eight dog breeds drawn in one style at their relative sizes, each with its Polish name underneath. Touching a dog makes it happy for a moment. |
| Category | Cause and effect; observation; open-ended play |
| Interaction type | Tap (touch, mouse, keyboard) |
| Status | Implemented; enabled in the menu by default (appended last, no `defaultOff`) |
| Source | [`js/rasy.js`](../../js/rasy.js) (gallery), [`js/dogs.js`](../../js/dogs.js) (shared drawings, `window.Dogs`), styles with prefixes `rp-` and `dg-` in [`css/style.css`](../../css/style.css), script tags in [`index.html`](../../index.html) |

## 2. Business purpose

- Introduces the foundation of the dog theme from issue [#175](https://github.com/BielinskiLukasz/child-page/issues/175): one shared set of breed drawings (`window.Dogs`) that later dog activities can reuse, plus a small gallery that hosts the menu tile, Settings entry and README entry.
- Lets the child look at and name familiar breeds (Labrador, Jamnik, Husky, Pudel, Owczarek, Buldog, Corgi, Dalmatyńczyk) and see that small, medium and large breeds differ in size.
- Complements the animal activities built on [`js/animals.js`](../../js/animals.js), such as [Zwierzątka na Farmie](zwierzatka-na-farmie.md), with a single-theme, breed-specific view.
- Described in the README Activities list as item 47.

## 3. Activity flow

1. The child opens the tile; the grid of eight dogs is built.
2. Initially displayed: eight dogs with calm mouths, each with its breed name below, on a pale green background.
3. Interactions: tap a dog, or focus it with Tab and press Enter/Space.
4. Response: the tapped dog is happy for 2.5 s (smiling open mouth, tail wag, ear flutter, soft glow), then returns to calm. Tapping a happy dog restarts its 2.5 s.
5. There is no completion state.
6. Everything returns to idle by itself and can be touched again.
7. Restart: nothing to restart; the layout and breeds are fixed.
8. Exit: Back button or browser Back.

## 4. Rules and behavior

| Rule | Detail |
|---|---|
| Happy time | `HAPPY_S = 2.5` s per dog; each dog has its own timer `t` (-1 when idle). |
| Wag | Tail rotates up to `WAG_DEG = 16` degrees at `WAG_HZ = 2.2` Hz; ears rotate up to `EAR_DEG = 5` degrees at half that frequency. Both are scaled by `sin(pi * t / HAPPY_S)` so the motion eases in and out. |
| Faces | Only `dg-calm` (closed smile) and `dg-happy` (open smile with tongue); no angry or sad face exists. |
| Size classes | `Dogs.SCALE`: small 0.78, medium 0.89, large 1. Small: Jamnik, Pudel, Corgi. Medium: Labrador, Husky, Buldog. Large: Owczarek, Dalmatyńczyk. |
| Order | Fixed: Labrador, Jamnik, Husky, Pudel, Owczarek, Buldog, Corgi, Dalmatyńczyk. |
| Failure, score | None; nothing is scored or stored. |
| Sound | None. |

## 5. Educational and developmental benefits

**Intended design benefits**

- Cause and effect (touch, the dog reacts).
- Noticing and naming dog breeds (Polish labels).
- Comparing sizes: small, medium and large breeds are drawn at different scales.

**Directly observable behavior**

- Each touched dog smiles, wags its tail and flutters its ears for 2.5 s.
- Every dog has a visible Polish name and a distinct colour and silhouette (ear shape, tail shape, markings).

**Requires professional or research-based validation**

- Any claim about breed recognition or vocabulary. Nothing in the code can establish it, and recognisability of the drawings has not been checked on a device.

## 6. Accessibility and usability

- **Input:** each dog is a native `<button>` using the `click` event; touch, mouse and keyboard (Tab, Enter, Space) work. Focus ring: 4 px outline.
- **Labels (Polish):** each button has `aria-label` set to the breed name; the SVG itself is `aria-hidden`. There is no state announcement for the happy state.
- **Target sizes:** `.rp-dog` has `min-width/min-height: 56px` and fills its grid cell.
- **Layout:** 2 columns x 4 rows in portrait, 4 columns x 2 rows in landscape (`@media (orientation: landscape)`).
- **Colour:** the breed name is always shown as text; the happy state is also shown by the mouth shape, not only by the glow.
- **Reduced motion:** the happy mouth and glow are set from JavaScript (class `rp-on`, `display` attributes), so they still show; only the tail and ear wag is skipped when `prefers-reduced-motion: reduce` matches.
- **Touch:** `touch-action: manipulation`.
- **Reading:** not required (names are a parent-facing aid). A young child can use it independently.

## 7. Risks and limitations

- Breed recognisability and the size of the smallest drawings (Pudel, Jamnik at 320 x 568) have not been checked on a device (see sections 17 and 18).
- Breeds are stylised cartoons, not accurate depictions.
- No ending; relies on the global playtime limit.
- No privacy concerns; nothing is stored.

## 8. Configuration

No external configuration. Constants in [`js/rasy.js`](../../js/rasy.js): `HAPPY_S` (2.5 s), `WAG_HZ` (2.2), `WAG_DEG` (16), `EAR_DEG` (5), and a frame time cap of 0.05 s in `frame()`. Breed data lives in `DEFS` and `ORDER` in [`js/dogs.js`](../../js/dogs.js): per breed the name, size class, body length/height, leg height, head radius, snout, colours, ear type (`floppy`, `point`, `fold`, `puff`), tail type (`thick`, `curl`, `pom`, `stub`, `bushy`) and decoration (`spots`, `mask`, `saddle`, `none`). `Dogs.SCALE` holds the size-class scales.

Fallback: `Dogs.byId` returns the first breed (Labrador) for an unknown id. `window.Dogs` is required by `rasy.js` and is not checked for being absent.

## 9. Assets

No external asset files. Every dog is an inline SVG string built by `Dogs.draw(id, opts)` (`viewBox="0 0 120 100"`, facing right, feet on y = 92). The menu icon is an inline SVG in [`js/activities.js`](../../js/activities.js). No images, fonts or audio.

## 10. Randomization and variants

Nothing is randomized: the eight breeds and their order are fixed.

## 11. Progression and difficulty

None. There are no levels or persistence.

## 12. Completion and feedback

There is no completion state and no failure. Feedback is the dog's own happy reaction (smile, wag, flutter, glow); nothing starts automatically.

## 13. Analytics and metrics

This activity reports to the shared on-device module `js/analytics.js` (`window.Analytics`) through the app shell only: `js/app.js` records the activity start and end, and the module counts touches inside the stage. The activity file calls no `Analytics` function. Recorded for it: starts, active time, replays, quick exits (within 10 s) and touches. It is open-ended, so no completion, level or exit-before-completion is defined. Data stays on the device as anonymous daily aggregates; see [README.md](README.md#analytics-status).

## 14. Technical implementation

- **Entry point:** `mount(container)` in [`js/rasy.js`](../../js/rasy.js) overrides `mount` of the `rasy` entry in `window.ACTIVITIES`; it sets `container.style.display = 'block'` and returns a cleanup function that sets `alive = false`, cancels the frame, removes the `visibilitychange` listener and removes the scene.
- **Rendering:** `div.rp > div.rp-grid` with one `div.rp-cell` per breed containing a `button.rp-dog` (the SVG) and a `div.rp-name`. Fixed DOM after mount.
- **State:** per dog `t`, references to the calm/happy mouths, tail and ears, and their pivots (`data-px`, `data-py`).
- **Loop:** one `requestAnimationFrame` loop with `dt` capped at 0.05 s; it requests the next frame only while a dog is happy (`busy`), so it idles otherwise, guarded with `!raf` against double loops; it is cancelled while the tab is hidden and restarted on return.
- **Drawing:** `Dogs.draw` composes tail, legs, body, head and ears groups (classes `dg-tail`, `dg-legs`, `dg-body`, `dg-head`, `dg-ears`) so activities can animate parts; the size-class scale is applied around the feet.
- **Persistence:** none. **Analytics:** through the app shell only (section 13).

## 15. Responsive layout and coordinate system

- `.rp` is fixed full-screen; `.rp-grid` is inset below the Back button (`64px` plus safe area) with 12 px side margins and an 8 px gap, in a 2 x 4 (portrait) or 4 x 2 (landscape) grid.
- Each SVG fills its button (`width/height: 100%`, `overflow: visible`) and keeps its `viewBox="0 0 120 100"`, so a dog scales with its cell; the size-class scale is part of the drawing.
- The orientation switch is CSS only.

## 16. Error and edge-case handling

| Case | Behaviour |
|---|---|
| Tap on a happy dog | Restarts its 2.5 s timer. |
| Tap on several dogs | Each has its own timer; one loop drives all. |
| Tab hidden | Loop cancelled and restarted on return; the `dt` cap prevents a jump. |
| Resize / orientation | CSS only. |
| Leaving mid-reaction | Cleanup cancels the frame. |
| Unknown breed id in `Dogs.byId` / `Dogs.draw` | Falls back to the first breed. |
| `window.Dogs` missing | Not handled. |

## 17. Testing

No automated tests exist. Manual scenarios (none are claimed as done):

- [ ] Normal: open the activity; eight dogs with names are visible; tap each; it smiles, wags and flutters for about 2.5 s.
- [ ] Tap one dog repeatedly and several dogs quickly; nothing breaks.
- [ ] Breed recognisability: each breed is distinguishable by silhouette and colour.
- [ ] Sizes: small breeds look smaller than medium, medium smaller than large.
- [ ] Small screens (320 x 568): Pudel and Jamnik are at least 56 px and reachable.
- [ ] Portrait and landscape; rotate during a reaction.
- [ ] Touch and mouse; keyboard (Tab through eight buttons, Enter/Space activates, focus ring visible).
- [ ] Background/foreground: switch tab during a reaction.
- [ ] Reduced motion: smile and glow show, no wag.
- [ ] Browsers: Chrome desktop, Chrome Android, Safari iPhone/iPad.

PR [#180](https://github.com/BielinskiLukasz/child-page/pull/180) reports a Node check that all eight breeds contain every part class and that an unknown id falls back to the Labrador; the visual checks are pending.

## 18. Known limitations and open issues

**Confirmed**

- No automated tests.
- The activity only shows breeds; the shared `window.Dogs` is not yet used by another activity.

**Requires verification**

- Breed recognisability and the on-screen size of the smallest dogs (Pudel about 45 px tall, Jamnik) at 320 x 568, and landscape layout (pending manual check on PR #180).

## 19. Planned improvements

Not currently documented; issue [#175](https://github.com/BielinskiLukasz/child-page/issues/175) describes `window.Dogs` as the shared foundation for future dog activities.

## 20. Related activities and reusable components

- Other activities with a shared character family: [Zwierzątka na Farmie](zwierzatka-na-farmie.md), [Kąpiel Zwierzątek](kapiel-zwierzatek.md), [Buźki](buzki.md).
- Shared component: [`js/dogs.js`](../../js/dogs.js) (`Dogs.LIST`, `Dogs.SCALE`, `Dogs.byId`, `Dogs.draw`).

## 21. Change history

- Issue [#175](https://github.com/BielinskiLukasz/child-page/issues/175) / PR [#180](https://github.com/BielinskiLukasz/child-page/pull/180): initial activity and shared dog drawings.
