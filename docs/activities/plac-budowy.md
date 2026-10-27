# Plac Budowy

Platform-wide behaviour (no sound, reduced motion, menu configuration, playtime limit, absence of automated tests, privacy) is described in [README.md](README.md#shared-platform-behaviour) and is not repeated here.

## 1. Overview

| Item | Value |
|---|---|
| Display name | Plac Budowy |
| Activity ID | `plac` (registry entry in [`js/activities.js`](../../js/activities.js)) |
| Description | A building site with four machines (crane, concrete mixer, roller, dump truck). Tapping a machine plays its job; each different machine used builds one more stage of a small house. |
| Category | Cause and effect; open-ended play; calming |
| Interaction type | Tap (or press) a machine; keyboard alternative |
| Status | Implemented; enabled in the menu by default (appended last, no `defaultOff`) |
| Source | [`js/plac.js`](../../js/plac.js), styles with prefix `pb-` in [`css/style.css`](../../css/style.css) |

## 2. Business purpose

- A cause-and-effect scene where several things can be tried in any order; issue [#184](https://github.com/BielinskiLukasz/child-page/issues/184).
- Differs from [Koparka](koparka.md) (precise control of one arm) and [Wieża z Klocków](wieza-z-klockow.md) (stacking) by giving four independent machines that each contribute to a shared result.

## 3. Activity flow

1. The child opens the tile; a sky and an empty building plot are shown above four large machine buttons.
2. The child taps any machine; it performs a short job (crane lifts a beam, mixer turns and pours, roller flattens a road strip, dump truck tips sand).
3. The first time each different machine has done its effect (at 40% of its animation) the house grows one stage: foundation, walls, roof, finished house with a flag. The order of machines does not matter.
4. Machines can be used again at any time; each use plays the next of three variants.
5. When all four machines have been used the house glows for 3 s while a child and a dog wave; after 4 s the site resets with a new house colour and the child can start again.
6. Exit: Back button or browser Back.

## 4. Rules and behavior

| Rule | Detail |
|---|---|
| Stage | Equals the number of different machines used (0-4); repeating a machine never changes it. |
| Animation length | Crane 1.8 s, mixer 1.6 s, roller 1.8 s, dump truck 1.7 s (half of that under reduced motion). |
| Variants | Use number modulo 3 selects the variant (crane: reach, lift height, beam colour, sway; mixer: turns and direction, concrete colour; roller: run length, shake, road colour; truck: tilt, sand colour and heap size). |
| Restart | Operating a machine that is working restarts it; the old pose is blended into the new one over 0.2 s. |
| Finish | Glow 3 s, waving figures for 4 s, then reset (house colour changes to a different one); stage groups fade in and out over 0.5 s. |
| Failure, score | None; nothing is scored or stored. Machines never leave their picture. |
| Text, faces, sound | Machine names only as screen-reader labels; the figures smile; no sound. |

## 5. Educational and developmental benefits

**Intended design benefits**

- Cause and effect (a machine acts, the house grows); free exploration in any order.

**Directly observable behavior**

- Each tap gives an immediate animation; the house visibly gains one stage per new machine.

**Requires professional or research-based validation**

- Any claim about learning or developmental benefits; nothing in the code can establish it.

## 6. Accessibility and usability

- **Input:** tap, click or stylus on a machine button; the whole button is the target (at least 72 x 58 px, normally 130-230 px wide).
- **Keyboard:** arrow keys move focus between the four machines, Enter or Space operates the focused one; visible 4 px focus ring.
- **Labels (Polish):** "Dźwig", "Betoniarka", "Walec", "Wywrotka" plus "Enter lub spacja uruchamia maszynę."; the SVG pictures are decorative.
- **Layout:** portrait 2 x 2 grid below the house, landscape one row of four.
- **Reduced motion:** all movement is driven from JavaScript (one rAF loop), so every state is reached; durations halve and waving is replaced by a still pose.
- **Text:** none visible.

## 7. Risks and limitations

- Visual quality of the machine animations has not been checked on a device (sections 17-18).
- No ending of the open-ended play; relies on the global playtime limit.

## 8. Configuration

No external configuration. Constants at the top of [`js/plac.js`](../../js/plac.js): `HOUSE_COLORS`, `GLOW_S` (3), `RESET_S` (4), `BLEND_S` (0.2), `GROW_S` (0.5), `EFFECT_AT` (0.4), `DUR` and the per-machine colour lists. Changing them needs a code edit.

## 9. Assets

No external asset files. Machines and the house are inline SVG created by `js/plac.js`; the menu icon is inline SVG in `js/activities.js`.

## 10. Randomization and variants

Three fixed variants per machine in rotation. After a finished house the new colour is chosen at random from the other four of five wall/roof colour pairs.

## 11. Progression and difficulty

None; there are no levels and nothing persists.

## 12. Completion and feedback

The house is finished when all four machines have been used; feedback is the glow and waving figures, then an automatic reset. No failure state. The activity is open-ended.

## 13. Analytics and metrics

This activity reports to the shared on-device module `js/analytics.js` (`window.Analytics`). `js/app.js` records the activity start and end and the module counts touches; `js/plac.js` additionally calls `Analytics.track('interaction', { variant })` with `variant` one of `crane`, `mixer`, `roller`, `truck` each time a machine is operated. `Analytics.complete()` is not called: the activity is open-ended (the site resets by itself), so exit-before-completion is not defined for it. All calls are wrapped so that nothing changes if `window.Analytics` is missing. See [README.md](README.md#analytics-status).

## 14. Technical implementation

- **Entry point:** `mount(container)` in [`js/plac.js`](../../js/plac.js) overrides `mount` of the `plac` entry; returns a cleanup function.
- **Rendering:** `div.pb > div.pb-sky + svg.pb-house + four button.pb-m (each with an svg.pb-msvg, viewBox 100 x 80)`.
- **State:** per machine a run time, variant, use count and a pose array blended from the previous pose; per site the set of used machines, a phase (`build`, `glow`, `reset`) and the house colour index.
- **Loop:** one `requestAnimationFrame` loop with `dt` capped at 0.05 s, cancelled while the tab is hidden, restarted on `visibilitychange` and input, stopped when idle; cleanup cancels it and removes listeners and DOM.
- **Persistence:** none. **Analytics:** section 13.

## 15. Responsive layout and coordinate system

- `layout()` runs on `resize` and `orientationchange`. Buttons are 0.8 times as tall as wide, at most 230 px wide and at most 46% (portrait) or 42% (landscape) of the height in total; the house (aspect 4:3) fills the space above, at most 700 px wide.

## 16. Error and edge-case handling

| Case | Behaviour |
|---|---|
| Machine operated while working | Restarts with a 0.2 s blend. |
| Machine operated after the house is finished | Animates, but is not counted until the site has reset. |
| Resize / orientation | Layout recomputed. |
| Leaving mid-round | Cleanup cancels the frame, removes listeners and the DOM. |
| Tab hidden | Loop cancelled and restarted on return; the `dt` cap prevents a jump. |
| `window.Analytics` missing | Calls are skipped. |

## 17. Testing

No automated tests exist. Manual scenarios (none are claimed as done):

- [ ] Operate each machine; the animation matches the description and stays inside its picture.
- [ ] Use machines in different orders; the house grows one stage per new machine.
- [ ] Repeat a machine; variants change and the stage does not.
- [ ] Finish the house; glow 3 s, waving, reset after about 4 s with a new colour.
- [ ] Keyboard: arrows and Enter/Space.
- [ ] 320 x 568, 568 x 320 and 1920 x 1080; reduced motion; leave and reopen ten times quickly.

The PR for issue [#184](https://github.com/BielinskiLukasz/child-page/issues/184) reports a Node simulation with a stub DOM.

## 18. Known limitations and open issues

**Confirmed**

- No automated tests.

**Requires verification**

- Look and feel of the machine animations and the layout on real devices.

## 19. Planned improvements

None currently planned.

## 20. Related activities and reusable components

- [Koparka](koparka.md), [Wieża z Klocków](wieza-z-klockow.md).
- No shared component is used besides `window.Analytics`.

## 21. Change history

- Issue [#184](https://github.com/BielinskiLukasz/child-page/issues/184): initial activity.
