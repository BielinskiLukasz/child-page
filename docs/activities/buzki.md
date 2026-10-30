# Buźki

## 1. Overview

| Item | Value |
|---|---|
| Display name | Buźki |
| Internal ID | `buzki` (entry in [`js/activities.js`](../../js/activities.js)) |
| Description | A big friendly face and a small random animal copy the same calm expression; touching the face, eyes, cheeks or mouth changes or animates it. |
| Category | Cause and effect, open-ended play (calm observation) |
| Interaction type | Tap (touch, mouse, keyboard activation of buttons) |
| CSS prefix | `bz-` |
| Source | [`js/buzki.js`](../../js/buzki.js), styles in [`css/style.css`](../../css/style.css) (section `/* Buźki */`) |
| Status | Implemented; enabled by default (no `defaultOff`). Listed 28th in the README Activities list. |

## 2. Business purpose

Buźki lets a young child explore facial expressions in a safe, slow and wordless way: one touch changes the whole face, small touch zones trigger a single gentle reaction. It supports the application's aim of calm, failure-free cause-and-effect play. It deliberately has no angry, sad or crying faces and no red, so every state is pleasant. It differs from the drag-based activities by being purely tap-driven, and the animal companion changes on every launch.

## 3. Activity flow

1. The child opens the activity from the menu (`#buzki`).
2. A large round yellow face shows the first expression (happy: open eyes, wide smile). A small animal head (random, see section 10) sits in a corner and shows the same expression.
3. The child can tap: the face or the animal (cycle the expression), the eyes (slow blink), either cheek (pink glow) or the mouth (smile or yawn).
4. The face and the animal respond together over about 1 s (expression change) or 1.5 s (eyes, cheeks, mouth effects).
5. There is no completion state and no goal. Every response returns to the current expression.
6. Nothing is restarted explicitly; re-opening the activity resets the face to the happy expression and picks a new animal.
7. About every 5 s, when nothing else is happening, the face blinks once by itself (0.8 s).
8. The child leaves with the Back button (see [shared behaviour](README.md#shared-platform-behaviour)).

## 4. Rules and behavior

Expressions (parameters in `EXPR`; eye radii `ex`/`ey`, mouth half-width `mw`, smile depth `ms`, mouth opening `mo`):

| Order | Expression | Eyes (`ex` x `ey`) | Mouth (`mw`, `ms`, `mo`) |
|---|---|---|---|
| 1 | happy | 6.5 x 8 | 22, 8, 3 |
| 2 | sleepy | 7 x 3.2 | 8, -1, 3 |
| 3 | surprised | 9 x 12 | 9, -8, 16 |
| 4 | calm | 7 x 1.3 (closed) | 14, 5, 0.6 |

The cycle is happy -> sleepy -> surprised -> calm -> happy, started from happy.

| Touch zone | Action | Duration |
|---|---|---|
| Whole face or whole animal (`bz-all`) | next expression | `CHANGE_S = 1` s ease (0.4 s under reduced motion) |
| Eyes (`bz-eyes`) | slow blink, eyes close to 8% of the height | `EFFECT_S = 1.5` s |
| Left or right cheek | cheek colour opacity rises from 0.3 to 0.9 | 1.5 s |
| Mouth | gentle smile (`mw 20, ms 8, mo 2`), or a yawn (`mw 12, ms 0, mo 16`) when the current expression is sleepy; strength 0.85 | 1.5 s |
| Automatic idle blink | one blink when nothing is changing | every `IDLE_BLINK_S = 5` s, lasts `BLINK_S = 0.8` s |

- **Input lock:** while an expression change or an effect is running (`busy()`), taps on any zone are ignored (no queueing).
- **Slow yawn:** while changing to *sleepy* (and not in reduced motion) the mouth opens and then closes (`+12` opening, `+4` width, `bump` curve).
- **Animal copy:** the same eye, cheek and mouth shapes are drawn over the animal head at the same relative positions, scaled by `k = min(0.85, max(0.62, 48 / (top * 2.5)))` where `top` is the animal's ear height.
- **No failure:** there are no wrong actions, scores or timers other than the idle blink.

## 5. Educational and developmental benefits

**Intended design benefits** (not measured)

- Early exposure to basic facial expressions in a calm context.
- Cause and effect: a touch produces a visible, gentle response.
- Independent, low-pressure play.

**Directly observable behavior**

- Four expressions that differ in eye and mouth shape rather than colour.
- Distinct reactions for eyes, cheeks and mouth.
- The animal always mirrors the face.

**Requires professional or research-based validation**

- Any effect on emotional understanding or development. The code makes no such measurement.

## 6. Accessibility and usability

- **Input:** all touch zones are real `<button>` elements with `aria-label`s (`Buźka: zmień minę`, `Oczy`, `Lewy policzek`, `Prawy policzek`, `Buzia`, `<animal>: zmień minę`), so touch, mouse and keyboard (Tab then Enter/Space) work. Focus ring: 4 px `#8f7fd1`.
- **Target sizes:** hit areas are percentages of the face size `F`: eyes 64% x 26%, each cheek 24% x 20%, mouth 40% x 22%, whole face 100% x 100%; the animal is at least 64 px wide. In portrait `F = min(fw * 0.94, fh * 0.66)`; in landscape `F = min(fh * 0.98, fw * 0.6)`. For example, for a 640 x 360 landscape window with no safe-area insets, `F` is about 278 px, giving cheek zones of about 67 x 56 px (a calculation from the formulas, not a measurement). On smaller faces the cheek zones become smaller than 56 px (they reach 56 x 56 px only when `F` is at least about 280 px).
- **Orientation:** the layout is recomputed on `resize` and `orientationchange` (portrait: animal in the bottom-right corner; landscape: animal to the right of the face).
- **Colour:** expressions are told apart by shape; the pink cheek glow is an additional cue only.
- **Sound:** none. **Reading:** not required.
- **Reduced motion:** expression changes and effects are driven from the rAF loop, so they are not disabled by the global CSS rule; under `prefers-reduced-motion` the change is shortened to 0.4 s and the yawn bump is skipped. Effects (blink, cheek glow, mouth) and the idle blink still run.
- **Touch behaviour:** `.bz` uses `touch-action: manipulation`; text selection disabled.
- **Independent use:** a young child can use it without reading; adult supervision is not required by the design.

## 7. Risks and limitations

- The idle blink every 5 s and the animated mouth are the only unprompted motion; both are slow.
- Cheek hit areas can fall below 56 px on small screens (see section 6).
- The companion animal can partly overlap the face on very small portrait fields (see section 15); `Requires verification`.
- Touches during a change or effect are silently ignored, which may look unresponsive to a child who taps repeatedly.
- No personal data is collected.

## 8. Configuration

There is no external configuration; constants inside [`js/buzki.js`](../../js/buzki.js):

| Name | Purpose | Type | Default |
|---|---|---|---|
| `EXPR` | Four expression parameter sets | array of objects | see section 4 |
| `SMILE`, `YAWN` | Mouth shapes for the mouth effect | objects | `{20, 8, 2}`, `{12, 0, 16}` |
| `CHANGE_S` | Expression change time | s | `1` |
| `EFFECT_S` | Eyes, cheeks, mouth effect time | s | `1.5` |
| `BLINK_S` | Idle blink time | s | `0.8` |
| `IDLE_BLINK_S` | Pause before an idle blink | s | `5` |
| `EYE`, `MOUTH` | Colours | CSS colours | `#5b5675`, `#8a6a8f` |

These cannot be changed without editing the file; there is no fallback because nothing is read from outside.

## 9. Assets

No external asset files. The face is an inline SVG (circle `#ffe9a8` with a highlight stroke, eyes, cheeks, mouth) built in `headSvg`; the animal head comes from `Animals.head(id, { bare: true })` in [`js/animals.js`](../../js/animals.js) (shape only, without eyes, nose or mouth). The panda uses white eyes (`Animals.eyeColor`). The menu icon is inline SVG in `js/activities.js`.

## 10. Randomization and variants

- **What is random:** the companion animal, `Animals.pick(1)[0]`, chosen once per launch from the 13 shared animals (Miś, Króliczek, Kotek, Piesek, Myszka, Świnka, Lisek, Lew, Słoń, Panda, Żabka, Sowa, Koala).
- **Repetition:** `Animals.pick` uses `Rand.shuffle` and is independent per launch, so the same animal can appear on consecutive launches (no repeat prevention here; `Not implemented`).
- **Persistence:** none; the animal does not change while the activity is open.
- The face, expression order and timings are not random.

## 11. Progression and difficulty

None. There are no levels, and nothing is stored between launches. The expression always starts at happy.

## 12. Completion and feedback

There is no formal completion state. The feedback for each touch is the visual response described in section 4; there is no score, sound, celebration or failure message. The interaction cycle is simply touch -> response -> idle.

## 13. Analytics and metrics

This activity reports to the shared on-device module `js/analytics.js` (`window.Analytics`) through the app shell only: `js/app.js` records the activity start and end, and the module counts touches inside the stage. The activity file itself calls no `Analytics` function. Recorded for it: starts, active time, replays (re-opening in the same session), quick exits (within 10 s) and touches. It is open-ended, so no completion, level or exit-before-completion is defined for it. Data stays on the device as anonymous daily aggregates; see [README.md](README.md#analytics-status).

## 14. Technical implementation

- **Entry point:** `mount(container)` in [`js/buzki.js`](../../js/buzki.js), registered by replacing the `mount` of the `buzki` registry entry; returns a cleanup function. The script is lazy-loaded via `src`/`deps` on its registry entry in js/activities.js.
- **State:** closure variables `cur` (expression index), `from` (parameters at the start of a change), `changeT`, `fx` (running effect `{type, t, d}`), `idleBlink`, `idleTimer`.
- **Rendering:** fixed DOM: `.bz-field` containing `.bz-face` and `.bz-cat`, each with one inline SVG and transparent buttons on top. `paint()` writes `rx`/`ry` of the eye ellipses, cheek opacity and the mouth path `d` on both heads each frame.
- **Animation:** one `requestAnimationFrame` loop (`frame`, `dt` capped at 50 ms). When nothing animates the loop stops and `armIdle` sets a 5 s `setTimeout` to wake it for the next idle blink. The loop and timer are cancelled while the tab is hidden and resumed on `visibilitychange`.
- **Events:** `click` on the buttons; `resize`/`orientationchange` for `layout`.
- **Randomization:** `Animals.pick(1)` ([`js/animals.js`](../../js/animals.js)).
- **Persistence and analytics:** none.
- **Cleanup:** cancels the frame, clears the timer, removes three window/document listeners and the board.

## 15. Responsive layout and coordinate system

- `.bz-field` is inset 64 px from the top (plus safe area) and 12 px elsewhere.
- Coordinates are CSS pixels inside the field; the face is positioned with `transform: translate`.
- **Portrait** (`fh >= fw`): face `F = min(fw * 0.94, fh * 0.66)` at the top; animal `C = max(64, min(fw * 0.4, fh - F - 12, 130))` in the bottom-right corner.
- **Landscape:** face `F = min(fh * 0.98, fw * 0.6)`; animal `C = max(64, min(F * 0.45, 130))` to the right of the face (16 px gap), at the bottom.
- Face and animal SVGs use a `0 0 100 100` viewBox; hit areas are percentages of the box, so they scale together. Eyes, cheeks and mouth on the animal are the same SVG parts laid over the animal head.
- Because `C` is floored at 64 px, in a very short portrait field the animal may overlap the face; `Requires verification`.

## 16. Error and edge-case handling

| Case | Behaviour |
|---|---|
| Missing assets | Not applicable. |
| Rapid repeated taps | Ignored while an expression change or effect runs. |
| Resize/orientation change | `layout` repositions; animation state is kept. |
| Tab hidden | `frame` returns without scheduling; the idle timer is cleared; resumes on return. |
| Leaving mid-animation | Cleanup cancels the loop and timer. |
| Unsupported `matchMedia` | `reduced()` returns `false`. |
| Touch cancellation | Not relevant: only `click` is used. |

## 17. Testing

**Automated tests:** none (see [shared behaviour](README.md#shared-platform-behaviour)). PR [#79](https://github.com/BielinskiLukasz/child-page/pull/79) reports `node --check` and a stub-DOM run; this documentation does not re-verify it.

**Manual scenarios (not yet recorded as performed):**

- [ ] Normal: tap the face repeatedly (waiting for each change) and confirm the order happy, sleepy, surprised, calm, happy; the animal mirrors every change.
- [ ] Zones: tap eyes (blink), both cheeks (pink glow), mouth in happy (smile) and in sleepy (yawn).
- [ ] Incorrect interaction: tap during a change; the extra tap is ignored; tap the area between zones.
- [ ] Restart: leave and re-open; the face is happy again.
- [ ] Randomization: open the activity several times and note that the companion animal varies, including the panda (white eyes).
- [ ] Idle: wait without touching for more than 5 s and watch one slow blink.
- [ ] Progression/completion: confirm there is no end state, score or level.
- [ ] Portrait and landscape: face and animal fully visible; rotate while an effect runs; check small phones (320 x 568, 568 x 320).
- [ ] Touch and mouse: tap with a finger; click; Tab and press Enter/Space on each zone.
- [ ] Background/foreground: hide the tab mid-change and return.
- [ ] Reduced motion: with the OS setting on, the change is quicker and the yawn animation is absent.
- [ ] Browsers: Chrome desktop, Chrome Android, Safari iPhone/iPad.

## 18. Known limitations and open issues

**Confirmed**

- No automated tests. Analytics is covered in section 13.
- The animal companion is not prevented from repeating between launches.
- Taps during a running change are dropped rather than queued.

**Requires verification**

- Cheek hit-area size on small screens; face/animal overlap on very short portrait fields.

## 19. Planned improvements

None currently planned (no open issue targets this activity).

## 20. Related activities and reusable components

- Other activities with a random animal and gentle touch response: [Kąpiel Zwierzątek](kapiel-zwierzatek.md).
- Shared helpers actually used: [`js/animals.js`](../../js/animals.js) (`Animals.pick`, `Animals.head`, `Animals.eyeColor`). `Rand` is used indirectly through `Animals.pick`.
- Other activities that draw animals from the shared family: [Cienie](cienie.md).

## 21. Change history

- [#54](https://github.com/BielinskiLukasz/child-page/issues/54) / PR [#79](https://github.com/BielinskiLukasz/child-page/pull/79): activity added (originally with a fixed cat companion).
- Commit "Buźki: stop rAF loop when idle, wake via timer for idle blink" (review suggestion, merged with PR #79).
- [#113](https://github.com/BielinskiLukasz/child-page/issues/113) / PR [#137](https://github.com/BielinskiLukasz/child-page/pull/137): random animal companion from the shared family.
