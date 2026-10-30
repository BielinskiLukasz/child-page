# Dobranoc

Platform-wide behaviour (no sound, reduced motion, menu configuration, playtime limit, absence of automated tests, privacy) is described in [README.md](README.md#shared-platform-behaviour); this document only records what is specific to this activity.

## 1. Overview

| Item | Value |
|---|---|
| Display name | Dobranoc |
| Activity ID | `dobranoc` (registry entry in [`js/activities.js`](../../js/activities.js)) |
| Description | A house at dusk: the child dims or relights four windows and tucks three random animals in or wakes them; when every light is off and every animal sleeps, stars and a sleeping moon fade in. |
| Category | Calming; cause and effect |
| Interaction type | Tap (touch, mouse, keyboard) |
| Status | Implemented; enabled in the menu by default |
| Source | [`js/dobranoc.js`](../../js/dobranoc.js), styles with prefix `db-` in [`css/style.css`](../../css/style.css), lazy-loaded via `src`/`deps` on its registry entry in [`js/activities.js`](../../js/activities.js) |

## 2. Business purpose

- A bedtime-themed, quiet activity: the only "goal" is a peaceful scene in which everything is switched off and asleep.
- All changes are reversible, so the child can play with the toggles endlessly with no wrong action.
- Complements the other calming/night activities ([Dzień i Noc](dzien-i-noc.md), [Nocne Niebo](nocne-niebo.md)) by adding a hands-on "put everything to bed" interaction.
- Described in the README Activities list as item 9.

## 3. Activity flow

1. The child opens the tile; the scene is built and painted once.
2. Initially displayed: a house with **four lit windows** and three **awake** animals in front of it, on a dusk-coloured sky.
3. Interactions: tap a window (dim or relight it) or tap an animal (tuck it in or wake it).
4. Response: the window fades over 1.5 s; the animal closes its eyes and a blanket fades in over 1.2 s.
5. Completion-like state: when all 4 lights are off and all 3 animals sleep, the "night" layer (stars and a sleeping moon) fades in over 4 s.
6. After that nothing happens automatically; any change reverses the state (the layer fades out over 2 s).
7. Restart: toggle things back, or leave and re-open (new random animals).
8. Exit: Back button or browser Back.

## 4. Rules and behavior

| Rule | Detail |
|---|---|
| Windows | 4 buttons (`WINDOWS`) at board positions (140,165), (260,165), (140,235), (260,235); size 64 units. Each toggles between lit (target 1) and dim (target 0); fade time `LIGHT_S = 1.5` s. |
| Animals | 3 buttons in fixed slots (52,238), (200,240), (348,238); size 72 units. Each toggles between awake (0) and asleep (1); fade time `SLEEP_S = 1.2` s with smoothstep easing; the open eyes fade out, the closed-eye arcs and a blanket fade in (the blanket also slides 10 units). |
| Night layer | Target is 1 only if every window target is 0 and every animal target is 1; otherwise 0. Fade in `GLOW_IN_S = 4` s, out `GLOW_OUT_S = 2` s, smoothstep. The layer holds a translucent blue overlay (opacity 0.38), 10 stars (radius 1.4 to 2.2 units) and a sleeping crescent moon. |
| Reversibility | A toggle mid-fade reverses from the current value, not from the end. |
| Automatic actions | None: only the child's taps change anything. |
| Labels | Polish `aria-label`s are updated on each toggle ("Okno N – zgaś światło" / "zapal światło"; "<animal> – obudź" / "połóż spać"). |
| Sound | None. |

## 5. Educational and developmental benefits

**Intended design benefits**

- Cause and effect (a tap changes light and sleep state).
- A calm routine-themed play ("everything goes to sleep").
- Noticing a whole-scene goal made of several parts (all windows and all animals).

**Directly observable behavior**

- Every change is slow and reversible; the night layer appears only after every part is switched.
- No failure, score or text.

**Requires professional or research-based validation**

- Any effect on bedtime routines or sleep. Nothing in the code can establish it.

## 6. Accessibility and usability

- **Input:** all 7 interactive elements are native `<button>`s using the `click` event, so touch, mouse and keyboard (Tab, Enter, Space) work.
- **Target sizes:** windows are 16 % of the board width and animals 18 %, each with `min-width/min-height: 48px`. On a 4:3 board that is 64 and 72 board units; at a board width of 320 px a window is 51 px.
- **Layout:** the board is 4:3 (`aspect-ratio`), fitted into the viewport with top padding for the Back button; works in portrait and landscape.
- **State cues:** a lit window is yellow, a dim one is blue-grey (colour/brightness only; the mullions and frame are always visible); a sleeping animal shows closed-eye arcs and a coloured blanket (a shape cue besides colour). The ARIA labels announce the action, but the buttons have no `aria-pressed` state.
- **Reduced motion:** fades are driven by one `requestAnimationFrame` loop (not CSS transitions), so they still run under the global reduced-motion rule.
- **Touch:** `touch-action: manipulation`, tap highlight removed.
- **Reading:** not required. A young child can use it independently.
- **Limitation:** hit areas of the middle animal and the two lower windows overlap slightly (see section 18).

## 7. Risks and limitations

- The scene is dark and low-contrast by design (calming); the lit/dim difference of windows is subtle against the dusk house on some screens (requires verification).
- Relies on slow fades; with everything done there is no further activity, and the child must undo something to continue.
- No privacy concerns; nothing is stored.

## 8. Configuration

No external configuration; constants at the top of [`js/dobranoc.js`](../../js/dobranoc.js).

| Constant | Purpose | Value |
|---|---|---|
| `LIGHT_S` | Window fade time | 1.5 s |
| `SLEEP_S` | Animal fade time | 1.2 s |
| `GLOW_IN_S`, `GLOW_OUT_S` | Night layer fade in / out | 4 s, 2 s |
| `WINDOWS` | Window centres in the 400x300 board | 4 positions |
| `WIN`, `ANI` | Button sizes in board units | 64, 72 |
| `SLOTS` | Animal slot positions and blanket colours (`#b9b3e0`, `#f7a8c9`, `#a9c9ef`) | 3 slots |
| `STARS` | Star positions and radii | 10 stars |

Fallback: none needed; the only dependency is `window.Animals`, which is not checked for being absent.

## 9. Assets

No external asset files. The house, sky gradient, windows, stars and moon are inline SVG (`sceneryHtml`, `windowSvg`, `glowSvg`); the animals are drawn by `window.Animals.head()` with `noEyes` plus the activity's own eyes and a body ellipse in the animal's fur colour (`js/animals.js`). No audio, images or fonts. The gradient id `db-sky` is defined in the inline SVG.

## 10. Randomization and variants

- On every launch `window.Animals.pick(3)` selects **3 unique animals** of the shared 13 and assigns them to the three fixed slots in the picked order. No `distinct` option, so similar silhouettes may appear together.
- Nothing is stored; there is no immediate-repetition guard between launches.
- Blanket colours, windows and stars are fixed.

## 11. Progression and difficulty

None. There are no levels and nothing is persisted.

## 12. Completion and feedback

- There is no formal completion state; the nearest equivalent is the "night" state (all lights off and all animals asleep), shown by the fading-in overlay with stars and a sleeping moon.
- No failure, score or sound. Any tap afterwards simply turns part of the scene back on, and the night layer fades out.
- No next round starts automatically.

## 13. Analytics and metrics

This activity reports to the shared on-device module `js/analytics.js` (`window.Analytics`) through the app shell only: `js/app.js` records the activity start and end, and the module counts touches inside the stage. The activity file itself calls no `Analytics` function. Recorded for it: starts, active time, replays (re-opening in the same session), quick exits (within 10 s) and touches. It is open-ended, so no completion, level or exit-before-completion is defined for it. Data stays on the device as anonymous daily aggregates; see [README.md](README.md#analytics-status).

## 14. Technical implementation

- **Entry point:** `mount(container)` in [`js/dobranoc.js`](../../js/dobranoc.js); the cleanup function cancels the frame, removes the `visibilitychange` and button listeners and removes the root element.
- **Rendering:** a `div.db-board` containing an SVG scene (`preserveAspectRatio="none"` inside a fixed 4:3 board), an SVG night layer in `.db-glow-wrap`, and 7 absolutely positioned buttons (percent-based `left`, `top`, `width`).
- **State:** `items[]` with `v` (progress 0 to 1), `t` (target 0 or 1), speed, `paint()` and `label()`; plus `glow` and `glowT`.
- **Loop:** `step()` moves each `v` towards `t` by `speed * dt` (`dt` capped at 0.05 s) and repaints; the loop stops itself when nothing is changing and is restarted by `kick()` on every tap. `visibilitychange` only resets the time base.
- **Events:** `click` on each button.
- **Shared code:** `Animals.pick`, `Animals.head`, `Animals.eyes`, `Animals.eyeColor`.
- **Persistence and analytics:** none.

## 15. Responsive layout and coordinate system

- The board is a fixed 400x300 coordinate system. Button positions are percentages (`x / 4`, `y / 3`, `size / 4`) of the board and are centred with `translate(-50%, -50%)`, so they always line up with the SVG scenery, which is stretched with the board.
- Board width is `min(100%, (100dvh - safe areas - 64px) * 4 / 3)`; the container has padding for the safe areas and 56 px at the top for the Back button.
- Portrait and landscape use the same layout (a smaller board in portrait).

## 16. Error and edge-case handling

| Case | Behaviour |
|---|---|
| Rapid repeated taps | Each tap flips the target; the progress reverses smoothly from where it is. |
| Tab hidden | The browser pauses `requestAnimationFrame`; `onVis` resets the time base so the hidden gap is not replayed. |
| Resize / orientation | Percent-based layout adjusts automatically; no JavaScript is needed. |
| Leaving mid-fade | Cleanup cancels the pending frame. |
| `window.Animals` missing | Not handled. |

## 17. Testing

No automated tests exist. Manual scenarios (none are claimed as done):

- [ ] Normal: open the activity; four windows lit, three animals awake; tap each window; it dims over about 1.5 s; tap again; it relights.
- [ ] Tap each animal; it closes its eyes and a blanket appears; tap again; it wakes.
- [ ] Completion state: switch all 4 lights off and put all 3 animals to bed; stars and the moon fade in over about 4 s.
- [ ] Reversal: from the night state, wake one animal; the night layer fades out in about 2 s.
- [ ] Toggle quickly mid-fade; the animation reverses smoothly with no jump.
- [ ] Incorrect interaction: tap the house and sky (nothing happens).
- [ ] Restart/randomization: re-open the activity about 10 times; the three animals vary; none repeats within a scene.
- [ ] Progression: confirm that there is none.
- [ ] Portrait and landscape; rotate during a fade.
- [ ] Touch and mouse; keyboard (Tab to each of the 7 buttons, Enter/Space toggles, focus ring visible).
- [ ] Overlap: tap the strip between the lower windows and the middle animal; confirm which one reacts (see section 18).
- [ ] Background/foreground: switch tab mid-fade; the animation continues without a jump.
- [ ] Reduced motion: the fades still run.
- [ ] Browsers: Chrome desktop, Chrome Android, Safari iPhone/iPad.

PR [#43](https://github.com/BielinskiLukasz/child-page/pull/43) reports a Node run against a DOM stub with a fake `requestAnimationFrame` (all 7 buttons present, tapping everything brings the glow to 1.0 within 4 s, undoing one light fades it to 0 and the loop stops, cleanup empties the container) and states that manual tests on devices were not possible. PR [#68](https://github.com/BielinskiLukasz/child-page/pull/68) lists the moon crescent as needing device checks.

## 18. Known limitations and open issues

**Confirmed (from the constants)**

- Hit boxes overlap: the middle animal spans x 164 to 236 and y 204 to 276 board units, while the lower windows span x 108 to 172 and x 228 to 292, y 203 to 267, so there are strips about 8 units wide where a tap lands on the animal (later in DOM order) instead of the window. The visible artwork inside the boxes may not overlap (requires verification).
- Buttons have no `aria-pressed`; state is only conveyed in the changing label.
- No automated tests.

**Requires verification**

- Contrast of the lit versus dim window state on real devices.
- The moon crescent after the fix in #68 (listed as pending a device check there).

## 19. Planned improvements

`None currently planned`.

## 20. Related activities and reusable components

- Night/calm activities: [Dzień i Noc](dzien-i-noc.md), [Nocne Niebo](nocne-niebo.md).
- Activities using the same animal family: [Mały Pociąg](maly-pociag.md), [Zwierzątka na Farmie](zwierzatka-na-farmie.md), [Zabawa w Chowanego](zabawa-w-chowanego.md), [Cienie](cienie.md), [Buźki](buzki.md).
- Shared helper: [`js/animals.js`](../../js/animals.js). The activity does not use `js/random.js` directly (only through `Animals.pick`).

## 21. Change history

- Issue [#34](https://github.com/BielinskiLukasz/child-page/issues/34) / PR [#43](https://github.com/BielinskiLukasz/child-page/pull/43): initial activity.
- Issue [#66](https://github.com/BielinskiLukasz/child-page/issues/66) / PR [#68](https://github.com/BielinskiLukasz/child-page/pull/68): moon redrawn as a single crescent path.
- Issue [#113](https://github.com/BielinskiLukasz/child-page/issues/113) / PR [#137](https://github.com/BielinskiLukasz/child-page/pull/137): the three animals are drawn at random from the shared family.
