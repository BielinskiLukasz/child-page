# Zbuduj Rakietę

Platform-wide behaviour (no sound, reduced motion, menu configuration, playtime limit, absence of automated tests, privacy) is described in [README.md](README.md#shared-platform-behaviour) and is not repeated here.

## 1. Overview

| Item | Value |
|---|---|
| Display name | Zbuduj Rakietę |
| Activity ID | `zbuduj` (registry entry in [`js/activities.js`](../../js/activities.js)) |
| Description | The child assembles a rocket from four parts (three variants each), launches it with a 3-2-1 countdown and watches it fly and land on the Moon, where an astronaut waves. |
| Category | Build and reward; choice; cause and effect; calming |
| Interaction type | Drag and drop, tap on the launch button, keyboard alternative |
| Status | Implemented; enabled in the menu by default (appended last, no `defaultOff`) |
| Source | [`js/zbuduj.js`](../../js/zbuduj.js), styles with prefix `zr-` in [`css/style.css`](../../css/style.css) |

## 2. Business purpose

- A build-and-reward activity: assemble first, then launch; issue [#183](https://github.com/BielinskiLukasz/child-page/issues/183).
- Differs from [Rakieta](rakieta.md), which is only free flight with a ready-made rocket.

## 3. Activity flow

1. The child opens the tile; an empty rocket outline with four dashed slots (nose, body, fins, engine) stands on a sky background and a tray holds 12 part pictures in a random order.
2. Interactions: the child drags a part onto its slot (a glowing outline appears when the part is over its slot); it snaps in with a soft pop and stays in the tray so it can be swapped for another variant.
3. When all four slots are full a large glowing launch button appears beside the rocket.
4. Tapping launch hides the tray and moves the rocket to the launch pad; the numerals 3, 2, 1 appear one second each.
5. The rocket flies up for 9 s through the sky, which darkens into a starry night, the stars drift down and the Moon surface slides into view.
6. The rocket lands on the Moon in 2 s; an astronaut appears next to it and waves for 4 s.
7. The scene fades out and a new empty assembly with a reshuffled tray fades in. Exit: Back button or browser Back.

## 4. Rules and behavior

| Rule | Detail |
|---|---|
| Slots | Nose, body, fins, engine; each has 3 variants differing in shape and colour. A part's picture is its slot's rectangle of the rocket, so it looks the same in the tray and on the rocket. |
| Drop | A release inside the part's own slot rectangle (plus 20 px margin) snaps it in; any other release drifts it back to the tray in 0.5 s. |
| Same slot twice | The new part replaces the earlier one. |
| Launch | Enabled only when all four slots are full. |
| Flight | The rocket in flight is the same element as the assembled one, so it uses exactly the chosen parts. |
| Timing | Count 3 x 1 s, flight 9 s, landing 2 s (11 s from the end of the count to touchdown), astronaut 4 s, fade 0.5 s each way. |
| Reduced motion | Count 3 x 0.5 s, flight 1.2 s, landing 0.4 s; the astronaut only raises an arm. |
| Failure, score | None; nothing is scored or stored. |
| Text, faces, sound | Only the numerals of the countdown; the astronaut smiles; no sound. |

## 5. Educational and developmental benefits

**Intended design benefits**

- Choice and decision (which part), matching a part to a place, cause and effect (build, then launch).

**Directly observable behavior**

- Parts snap into their slots and the flown rocket shows the chosen parts.

**Requires professional or research-based validation**

- Any claim about learning or developmental benefits; nothing in the code can establish it.

## 6. Accessibility and usability

- **Touch targets:** tray parts are 72 px or larger (76 px at 320 x 568, up to 120 px on large screens, picture fills the whole button); the launch button is 72-104 px.
- **Input:** pointer events (touch, mouse, stylus) with pointer capture; the tray buttons have `touch-action: none`.
- **Keyboard:** Tab through the 12 parts (random order) and the launch button; Enter or Space on a part places it in its slot; Enter on the launch button launches.
- **Labels (Polish):** parts "Część rakiety: dziób 1. Przeciągnij na rakietę lub naciśnij Enter."; launch "Start rakiety. Naciśnij Enter, aby wystrzelić rakietę na Księżyc."; the SVGs are decorative.
- **Non-colour cues:** a thicker outline on the slot under a dragged part; dashed outlines mark empty slots; parts differ in shape as well as colour.
- **Reduced motion:** every visual is driven from JavaScript (one rAF loop), so all states are reached under `prefers-reduced-motion`; no end state exists only in a CSS keyframe.
- **Text:** only the countdown numerals.

## 7. Risks and limitations

- Visual quality (part drawings, the flight scene, the astronaut) has not been checked on a device (sections 17 and 18).
- The rocket is small on a 320 x 568 screen (about 240 px tall).
- No ending; relies on the global playtime limit.

## 8. Configuration

No external configuration. Constants at the top of [`js/zbuduj.js`](../../js/zbuduj.js): `COUNT_S` (1), `FLY_S` (9), `LAND_S` (2), `ASTRO_S` (4), `FADE_S` (0.5), `BACK_S` (0.5), the reduced-motion `RM_*` values, `SLOT_PAD` (20), `SLOTS` and `PARTS` (the drawings). Changing them needs a code edit.

## 9. Assets

No external asset files. Everything (parts, rocket, flame, sky, stars, Moon, ground, astronaut) is inline SVG or CSS created by `js/zbuduj.js`; the menu icon is inline SVG in `js/activities.js`.

## 10. Randomization and variants

The 12 tray parts are shuffled (`Rand.shuffle` when available) at the start of every round; stars are placed randomly on each open. The rocket variants are chosen by the child.

## 11. Progression and difficulty

None; there are no levels and nothing persists.

## 12. Completion and feedback

A round completes when the rocket has landed. Feedback: glowing slot, snap pop, glowing launch button, countdown, flame, landing and the waving astronaut. No failure state. The activity is open-ended.

## 13. Analytics and metrics

This activity reports to the shared on-device module `js/analytics.js` (`window.Analytics`). `js/app.js` records the activity start and end and the module counts touches in the stage; `js/zbuduj.js` additionally calls `Analytics.track('interaction', { variant })` for each placed part (`n1`-`n3` nose, `b1`-`b3` body, `f1`-`f3` fins, `e1`-`e3` engine) and for the launch (`launch`), and `Analytics.complete()` when the rocket has landed. All calls are wrapped so that nothing changes if `window.Analytics` is missing. The activity is not in the module's `COMPLETABLE` list (it repeats endlessly), so exit-before-completion is not defined for it. Data stays on the device as anonymous daily aggregates; see [README.md](README.md#analytics-status).

## 14. Technical implementation

- **Entry point:** `mount(container)` in [`js/zbuduj.js`](../../js/zbuduj.js) overrides `mount` of the `zbuduj` entry; returns a cleanup function.
- **Rendering:** `div.zr` with sky, night overlay, star layer, Moon, ground, tray panel, the rocket (one SVG with a flame, four part groups and four dashed slot outlines), the astronaut, the launch button, the countdown numeral, a fade veil and the 12 part buttons.
- **State:** phase (`build`, `count`, `fly`, `land`, `astro`, `fadeout`, `fadein`) with a phase timer `t`; `chosen` part index per slot; per-part pop animation; part buttons in modes `home`, `drag`, `back`, `fly`. `render()` derives every position from the phase, so resizing at any time is safe.
- **Loop:** one `requestAnimationFrame` loop with `dt` capped at 0.05 s, guarded by `!raf`, cancelled while the tab is hidden and restarted on `visibilitychange`; it stops when idle (building with nothing moving) and restarts on input; cleanup cancels it and removes listeners and DOM.
- **Persistence:** none. **Analytics:** section 13.

## 15. Responsive layout and coordinate system

- `.zr` is fixed full-screen. Landscape (width above 1.05 x height): the tray is 3 columns x 4 rows on the right and the rocket sits in the remaining area; portrait: 4 columns x 3 rows below the rocket. The top 56 px stay free for the Back button. Part size is 72-120 px, the rocket scale is 0.4-1.8 and is limited so the launch button fits beside the rocket.
- Rocket units are 120 x 240; slot rectangles are computed from the rocket's current scale and position, so they follow a resize or rotation and the assembled parts are kept.

## 16. Error and edge-case handling

| Case | Behaviour |
|---|---|
| Wrong slot or release elsewhere | The part drifts back to the tray in 0.5 s; nothing is recorded. |
| Same slot twice | The earlier part is replaced. |
| Launch before all slots are full | The button is hidden and disabled. |
| Resize / orientation | Layout recomputed; chosen parts and the phase are kept. |
| Leaving mid-round | Cleanup cancels the frame, removes listeners and the DOM. |
| Tab hidden | Loop cancelled and restarted on return; the `dt` cap prevents a jump. |
| `window.Analytics` missing | Calls are skipped. |

## 17. Testing

No automated tests exist. Manual scenarios (none are claimed as done):

- [ ] Drag each of the 12 parts to its slot; it snaps in. Drag one to a wrong slot and to the sky; it drifts back.
- [ ] Place a second variant in a filled slot; it replaces the first.
- [ ] Fill all four slots; the launch button appears and glows.
- [ ] Launch; count 3-2-1, flight of about 9 s, landing, waving astronaut, then a new empty assembly with a reshuffled tray.
- [ ] The flown rocket has the chosen parts.
- [ ] Keyboard: Tab, Enter on parts and on the launch button.
- [ ] Rotate the device in the building and flight phases.
- [ ] Leave and reopen ten times quickly.
- [ ] Small screens (320 x 568, 568 x 320) and 1920 x 1080; reduced motion.
- [ ] Regression (#208, parts and rocket invisible): at 320 x 568, 390 x 844 and 568 x 320 drop a part on its slot; it is visible on the rocket in its own shape and colour (a second variant replaces it). A wrong drop stays visible while drifting back and ends in its tray spot. Launch right after the last part; the rocket is visible during the count, the whole flight and landing, and the astronaut appears. Repeat with reduced motion and with a rotation in each phase.

The PR for issue [#183](https://github.com/BielinskiLukasz/child-page/issues/183) reports a Node simulation with a stub DOM (placement, wrong drops, launch, the full timeline, reset, reduced motion, cleanup); no visual check was possible.

## 18. Known limitations and open issues

**Confirmed**

- No automated tests.

**Requires verification**

- Look and feel of the part drawings, the flight scene and the astronaut, and the layout on real devices.

## 19. Planned improvements

None currently planned.

## 20. Related activities and reusable components

- [Rakieta](rakieta.md), [Koparka](koparka.md).
- Uses `window.Rand.shuffle` and `window.Analytics`.

## 21. Change history

- Issue [#183](https://github.com/BielinskiLukasz/child-page/issues/183): initial activity.
- Issue [#208](https://github.com/BielinskiLukasz/child-page/issues/208): placed parts and the rocket were invisible because the part groups in the rocket SVG were never filled; they are now filled on placement.
