# Od Jajka do…

Status: implemented

- Issue: [#214](https://github.com/BielinskiLukasz/child-page/issues/214)
- Activity id: `odjajka`
- CSS prefix: `oj-`

Platform-wide behaviour (no sound, reduced motion, menu configuration, playtime limit, absence of automated tests, privacy) is described in [README.md](README.md#shared-platform-behaviour) and is not repeated here.

## 1. Overview

| Item | Value |
|---|---|
| Display name | Od Jajka do… |
| Activity ID | `odjajka` (registry entry in [`js/activities.js`](../../js/activities.js)) |
| Description | A touch-driven life-cycle story: one big picture changes stage by stage (egg to chick to hen, egg to caterpillar to cocoon to butterfly, seed to sprout to flower to apple tree). |
| Category | Observation; cause and effect; calming |
| Interaction type | Tap (touch, mouse), keyboard alternative |
| Status | Implemented; enabled in the menu by default (appended last, no `defaultOff`) |
| Source | [`js/odjajka.js`](../../js/odjajka.js), styles with prefix `oj-` in [`css/style.css`](../../css/style.css) |

## 2. Business purpose

- A story-over-time activity: the child's touch moves a small living thing through change, unlike [Dzień i Noc](dzien-i-noc.md) which only changes the sky; issue [#214](https://github.com/BielinskiLukasz/child-page/issues/214).
- Nothing can go wrong: no wrong steps, no negative states, no text.

## 3. Activity flow

1. The child opens the tile; one of the three cycles is shown at its first stage (egg, egg on a leaf or seed).
2. Initially displayed: a pastel picture that only sways slowly, and a row of four dots under it (right of it in landscape); the first dot is marked as current.
3. Touching the picture moves to the next stage with a 1.5 s cross-fade and grow-in and a small happy wiggle. Touching a dot of an already reached stage jumps to that stage; dots of stages not reached yet are inactive.
4. At the fourth (last) stage the picture glows for 3 s and a little bunny waves; the picture no longer advances.
5. After 7 s (3 s glow + 4 s) the picture fades out (0.6 s) and the next cycle fades in at its first stage.
6. Cycles come in a shuffled order, each once before any repeats; the first cycle of a launch differs from the first one of the previous launch. There is no end; exit with the Back button or browser Back.

## 4. Rules and behavior

| Rule | Detail |
|---|---|
| Cycles | `chick`, `butterfly`, `flower`; 4 stages each, drawn as inline SVG groups in one pastel style. |
| Advance | A click on `.oj-pic` at stage 1-3 moves one stage on. At stage 4 it does nothing. Nothing advances by itself within a cycle. |
| Morph | Each stage group fades in/out over 1.5 s (opacity) and grows from 92% to 100%. Rapid touches simply continue the fades. |
| Wiggle | 0.7 s rotate/scale of the picture button, restarted on each advance or jump. |
| Sway | The picture rotates between -1.5 and +1.5 degrees (with a 1.5% scale) every 3 s, alternating, all the time. |
| Dots | Four 56 px buttons with a 28 px visible dot. Current = larger with a ring; reached = solid; not reached = dashed outline and disabled. |
| Finale | On entering stage 4 (by touch or by dot): glow 3 s, bunny waving until the next cycle, fade-out starts at 6.4 s, next cycle at 7 s. Jumping back to an earlier stage cancels the finale. |
| Order | `window.Rand.shuffle` of the 3 cycles; a new shuffle after the third, never starting with the cycle just shown; a fallback to an unshuffled list when `Rand` is missing. |

## 5. Educational and developmental benefits

**Intended design benefits:** calm observation of change over time, cause and effect (touch moves the story), a first sense of sequence (stage dots).

**Directly observable behavior:** every touch moves exactly one stage; the dots show how far the story has come; the order of cycles is shuffled.

**Requires professional or research-based validation:** any effect on understanding of life cycles or of sequence.

## 6. Accessibility and usability

- Input: touch, mouse, keyboard. The picture and the dots are real `<button>` elements: Tab to the picture and Enter/Space advances; Tab to a reached dot and Enter/Space jumps. Focus is shown with a 4 px outline.
- The picture button fills the area between the Back button and the dots (at least 70% of a 320x568 or 568x320 screen; the drawing itself is a square of at least 50%); dot targets are 56 px.
- Layout: portrait = picture above, dots in a row below; landscape = picture in the middle, dots in a column on the right; the top-left 56 px Back button is never covered (picture starts 64 px from the top in portrait and 72 px from the left in landscape).
- Colour is not the only cue: the current dot is larger with a ring, reached dots are solid, others dashed; the stage itself is carried by the picture.
- Reduced motion: the global rule removes all animations and transitions, so stages switch instantly; the stage, glow and bunny states are defined in base CSS classes and are all still reached; sway and wiggle simply do not play. Nothing flashes and nothing turns faster than 1.5 degrees per 3 s (the bunny's arm swings once per second).
- No reading is required; a young child can use it independently.

## 7. Risks and limitations

- Very low risk: slow motion, soft colours, no failure.
- A child who keeps touching reaches the finale in three touches, so the story can be short; the finale then runs on its own.

## 8. Configuration

No external configuration. Tunable constants at the top of `js/odjajka.js`: `FIN_GLOW` (3000 ms), `FIN_NEXT` (7000 ms), `FADE_OUT` (600 ms), `WIGGLE` (700 ms). Stage fade (1.5 s), sway (3 s) and glow timing are in the `oj-` rules in `css/style.css`.

## 9. Assets

No asset files: everything (three cycles with four stages each, the bunny helper, the glow) is inline SVG built in `js/odjajka.js` on a 300x300 viewBox, plus the menu icon in `js/activities.js`.

## 10. Randomization and variants

The order of the three cycles (see section 4); no other randomness. Nothing persists between launches except the remembered first cycle of the previous launch (page session only, in memory).

## 11. Progression and difficulty

None: four stages per cycle, no levels.

## 12. Completion and feedback

A cycle is complete when its last stage is shown. Feedback: a soft glow and a waving bunny; then the next cycle fades in automatically. No failure and no score.

## 13. Analytics and metrics

Reports to the shared on-device module `js/analytics.js` (`window.Analytics`), see [README.md](README.md#analytics-status). `js/app.js` records start and end and the module counts touches in the stage; `js/odjajka.js` additionally calls:

- `Analytics.track('interaction', { variant: '<cycle>-<stage>' })` on each advance by touching the picture (variant e.g. `chick-2` = the stage reached, 1-4; cycles `chick`, `butterfly`, `flower`). Jumps via the dots are not reported.
- `Analytics.complete()` once per cycle when its last stage is first reached (a jump back and forward in the same cycle does not report it again).

Calls are wrapped in try/catch and skipped when `window.Analytics` is missing. Nothing is stored by the activity.

## 14. Technical implementation

- **Entry point:** `mount(container)` in [`js/odjajka.js`](../../js/odjajka.js) overrides `mount` of the `odjajka` entry; the root is attached with `container.appendChild(root)` before anything else; returns a cleanup function.
- **Rendering:** `div.oj > button.oj-pic (svg.oj-svg with background, glow, 4 × g.oj-st, bunny) + div.oj-dots > 4 × button.oj-dot`. The SVG is rebuilt per cycle by `build()`.
- **State:** `cur`, `reached`, `done` (completion already reported), the shuffled `order` and index, and a list of pending timers.
- **Animation:** CSS transitions and keyframes only; classes `oj-fin`, `oj-glow-on`, `oj-help`, `oj-out` on the root drive the finale. Timers use `setTimeout`.
- **Cleanup:** clears every timer and removes the root; no document-level listeners exist.
- **Persistence:** none.

## 15. Responsive layout and coordinate system

Pure CSS: the picture button and the dots are placed with `position: absolute` and an `@media (orientation: landscape)` rule; the SVG scales into the button with `preserveAspectRatio` meet (viewBox 300x300, CSS `.stage .oj-svg` so the global 120 px SVG rule does not apply). Because state lives in the closure and no pixel values are computed, rotation or resize never loses it.

## 16. Error and edge-case handling

| Case | Behaviour |
|---|---|
| Rotation / resize | CSS only; the stage and pending finale continue. |
| Tab hidden and shown | Timers keep running; the finale simply continues or has completed. |
| Very fast repeated touches | Each touch advances one stage at most up to stage 4; later touches do nothing. |
| Two fingers | Each tap is a normal click; extra taps at stage 4 are ignored. |
| Dot of a stage not reached | Disabled. |
| Jump away during the finale | Timers are cancelled, glow and bunny removed. |
| `window.Rand` or `window.Analytics` missing | Unshuffled order / calls skipped. |

## 17. Testing

No automated tests exist. Manual scenarios (none are claimed as done):

- [ ] Launch several times: the first cycle varies; three cycles in a row show each once.
- [ ] Touch the picture: it changes in 1.5 s with a small wiggle; four touches are never needed (3 touches reach the last stage).
- [ ] Do nothing: nothing advances; the picture sways slowly.
- [ ] Touch dots: reached dots jump, unreached dots do nothing; the current dot is clearly larger.
- [ ] At the last stage: 3 s glow, bunny waves, after 7 s the next cycle fades in.
- [ ] Jump back during the finale: the glow stops and the cycle stays.
- [ ] Keyboard: Tab, Enter/Space on the picture and on the dots.
- [ ] Rotate in the middle of a morph and during the finale; the Back button is never covered at 320x568 and 568x320.
- [ ] Enable reduced motion: stages switch without animation, the finale glow and bunny still appear.
- [ ] Hide the tab at the last stage and return.
- [ ] Check in Statystyki that advances and completions are counted.

## 18. Known limitations and open issues

**Requires verification:** appearance of the drawings and the 1.5 s cross-fade on real devices (no renderer was available while building).

## 19. Planned improvements

None currently planned.

## 20. Related activities and reusable components

[Dzień i Noc](dzien-i-noc.md) (change over time without a story), [Magiczny Ogród](magiczny-ogrod.md) (growth by touch). Uses the shared `window.Rand` ([`js/random.js`](../../js/random.js)) and `window.Analytics`.

## 21. Change history

- [#214](https://github.com/BielinskiLukasz/child-page/issues/214) initial implementation.
