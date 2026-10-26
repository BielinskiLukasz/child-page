# Przeciwieństwa

> Documents the current implementation on `main`. Shared platform behaviour (no sound, global reduced-motion rule, menu configuration, playtime, absence of automated tests, analytics status) is described in [README.md](README.md#shared-platform-behaviour) and is not repeated here.

## 1. Overview

| Property | Value |
|---|---|
| Display name | Przeciwieństwa |
| Activity ID | `przeciwienstwa` (`js/activities.js`) |
| Description | Four big objects in a 2x2 grid, drawn at random from a pool of 12. Touching one slowly changes it into its opposite (closed to open, empty to full, low to high, off to on, ...); touching it again changes it back. When all four are in their second state the scene glows softly. |
| Category | Cause and effect / exploratory (opposites) |
| Interaction type | Tap |
| Status | Implemented; enabled by default in the menu |
| Source | [`js/przeciwienstwa.js`](../../js/przeciwienstwa.js), CSS prefix `pw-` in [`css/style.css`](../../css/style.css) |

## 2. Business purpose

The activity lets a child discover opposites by changing an object and changing it back, with no wrong answers and no words required. It adds a reversible cause-and-effect interaction to the application and, with a pool of 12 pairs, shows different objects on each launch.

## 3. Activity flow

1. The child opens the tile; four objects are shown in a 2x2 grid, each in its first state (for example a closed door, an empty cup).
2. The child touches an object.
3. The object changes slowly (1.5 s) to its second state, and a small sparkle fades in and up over about 1.6 s.
4. Touching the same object again changes it back. A touch during an ongoing change is ignored.
5. When all four objects are in the second state, a soft glow fades in over the whole scene (2 s); changing any object back fades the glow out (1.5 s).
6. There is no formal end. The child leaves with the Back button; re-entering draws a new set of four.

## 4. Rules and behavior

| Rule | Value |
|---|---|
| Objects on screen | 4, unique, from a pool of 12 (`Rand.pick(OBJECTS, 4)`) |
| Change duration | 1.5 s (`CHANGE_S`), linear step eased with a smoothstep |
| Sparkle | 1.6 s (`SPARK_S`) |
| Glow | in 2 s (`GLOW_IN_S`), out 1.5 s (`GLOW_OUT_S`) |
| Touch during a change | ignored until that object has finished changing; other objects can be touched meanwhile |
| Glow condition | all four objects have target state 1 (evaluated at each touch, so the glow starts fading the moment one is flipped back) |
| Frame cap | 0.05 s |

The 12 pairs (first state / second state) and card background colour:

| Object | First state | Second state | Background |
|---|---|---|---|
| Drzwi | zamknięte | otwarte | `#e6e0f7` |
| Kubek | pusty | pełny | `#dff1fb` |
| Balon | nisko | wysoko | `#fdf0d5` |
| Lampa | wyłączona | włączona | `#e3f1d9` |
| Piłka | duża | mała | `#fde3e3` |
| Ołówek | długi | krótki | `#fff3cf` |
| Termometr | zimny | gorący | `#e4ecfb` |
| Niebo | dzień | noc | `#dceefb` |
| Kwiat | zamknięty | otwarty | `#f3e6fa` |
| Drzewo | gruby | cienki | `#e3f1d9` |
| Kropki | mało | dużo | `#fde9d3` |
| Chmura | sucho | mokro | `#e1e8f5` |

Each object has its own `paint(svg, e)` function that draws the intermediate state for `e` between 0 and 1 (for example the door panel narrows, the cup liquid rises 56 units, the balloon rises 32 units, the ball shrinks from radius 34 to 12, the pencil body shrinks from 58 to 28, the tree trunk thins from 30 to 10). Nothing is scored or stored.

## 5. Educational and developmental benefits

**Intended design benefits**: noticing and naming contrasts (open/closed, big/small, hot/cold, day/night), cause and effect, patience (changes are slow), calm exploration.

**Directly observable behavior**
- Every object has exactly two states and a visible, continuous transition between them.
- Each change is reversible and has no penalty.
- The accessible label of every object names its current state (for example "Kubek: pusty – dotknij, aby zmienić").

**Requires professional or research-based validation**
- Whether the activity helps a child learn or name opposites.
- Whether the 1.5 s transition suits a given child.

## 6. Accessibility and usability

- **Input:** touch, mouse, stylus, keyboard (each object is a `<button>`); focus outline 4px. `touch-action: manipulation`. The container is a `role="group"` labelled "Przeciwieństwa".
- **Target size:** each button fills one grid cell of a square board whose side is `min(100% , 100dvh - safe areas - 72px)`, with a 3vmin gap and `min-width`/`min-height` 64px; on a 320x568 phone the cell is about 150px.
- **Orientation:** the board is square and centred, so portrait and landscape both use the full available short side.
- **State is not shown by colour alone:** each pair changes shape or position (door angle, cup level, balloon height, ball size, pencil length, trunk width, number of dots, flower size) except Termometr and Niebo, which also change colour (mercury colour; sky colour with sun/moon), where shape also changes (mercury level; sun versus moon).
- **Reading:** none required.
- **Sound:** none.
- **Reduced motion:** the changes are driven by a `requestAnimationFrame` loop (not CSS transitions), so they run under the global rule. In addition the code reads `prefers-reduced-motion` once at mount: when set, each button holds two stacked static drawings (first and second state) that cross-fade instead of animating the shape. The setting is not re-read if it changes while the activity is open.
- **Limitations:** the glow state (all four changed) is not announced; the sparkle is decorative only.

## 7. Risks and limitations

- Slow transitions may feel unresponsive to a child who taps repeatedly (the second tap is ignored until the change ends).
- A few pairs depend on colour in addition to shape (Termometr, Niebo), though not on colour alone.
- Some pairs (Kropki, Chmura) use relative words ("mało/dużo", "sucho/mokro") that rely on the child's understanding of the picture only; no text is shown.
- No ending: the activity continues indefinitely.
- Privacy: nothing is stored or transmitted.

## 8. Configuration

No external configuration; constants live in `js/przeciwienstwa.js`.

| Name | Purpose | Type | Default | Changeable without code change? |
|---|---|---|---|---|
| `CHANGE_S` | Duration of one state change (s) | number | 1.5 | No |
| `SPARK_S` | Sparkle duration (s) | number | 1.6 | No |
| `GLOW_IN_S`, `GLOW_OUT_S` | Glow fade in and out (s) | numbers | 2, 1.5 | No |
| `OBJECTS` | Pool of pairs: `name`, `off`, `on`, `bg`, `build`, `paint` | array | 12 entries | No |
| Number of objects | Argument of `Rand.pick(OBJECTS, 4)` | number | 4 | No |

## 9. Assets

No external asset files. All 12 drawings are inline SVG strings produced by each object's `build()` (100x100 viewBox); the sparkle is a shared snippet (`sparkSvg()`). The cup uses a per-view `clipPath` id (`pw-cup-clip-<n>`) so the two stacked drawings used under reduced motion do not clash.

## 10. Randomization and variants

- **What is random:** which 4 of the 12 objects appear and their order, chosen with `Rand.pick(OBJECTS, 4)` (Fisher-Yates shuffle, first four) when the activity is opened.
- **Uniqueness:** the four are always different. There is no memory across launches, so consecutive launches can repeat objects (including all four, with probability 1/495 for an identical set, ignoring order).
- **Persistence:** the set is kept only for the current visit; leaving and re-entering draws again.
- **Empty or small pools:** `Rand.pick` returns the whole shuffled pool when fewer than four are available; the pool is a constant of 12, so not applicable.

## 11. Progression and difficulty

None. All pairs are equivalent; there are no levels. Nothing is persisted.

## 12. Completion and feedback

- **Completion:** informal. When all four are in the second state the whole scene glows (radial warm light, up to 0.75 alpha, 2 s fade in).
- **Feedback per touch:** sparkle above the object and the change itself; the accessible label changes.
- **Failure/retry:** none; any touch is valid and reversible.
- **After completion:** nothing else happens; the child may keep changing objects. No round restart, no sound.

## 13. Analytics and metrics

This activity reports to the shared on-device module `js/analytics.js` (`window.Analytics`) through the app shell only: `js/app.js` records the activity start and end, and the module counts touches inside the stage. The activity file itself calls no `Analytics` function. Recorded for it: starts, active time, replays (re-opening in the same session), quick exits (within 10 s) and touches. It is open-ended, so no completion, level or exit-before-completion is defined for it. Data stays on the device as anonymous daily aggregates; see [README.md](README.md#analytics-status).

## 14. Technical implementation

- **Entry point:** IIFE in [`js/przeciwienstwa.js`](../../js/przeciwienstwa.js) overriding `mount` for `przeciwienstwa`.
- **Rendering:** DOM and SVG. A `.pw` root holds a `.pw-board` (CSS grid, 2 columns) with four `<button class="pw-btn">` (each one SVG, or two SVGs under reduced motion) and a `.pw-glow` overlay div.
- **State:** per item `{v (display value 0..1), t (target 0 or 1), spark}` plus `glow` and `glowT`.
- **Animation:** one `requestAnimationFrame` loop `step()` with capped dt; `toward()` moves each value linearly and `smooth()` eases it; the loop stops when nothing is changing. `visibilitychange` only resets the time base (rAF itself pauses in a hidden tab).
- **Events:** `click` per button; `visibilitychange`.
- **Randomization:** `Rand.pick` from [`js/random.js`](../../js/random.js).
- **Cleanup:** cancels the frame, removes the listeners and the root.

## 15. Responsive layout and coordinate system

- Board: a square, `aspect-ratio: 1`, `width: min(100%, 100dvh - safe areas - 72px)`, two equal grid columns with a `3vmin` gap, centred in a container padded by 56px at the top.
- Each object is drawn in its own 100x100 viewBox scaled to the button (`padding: 6%`); no shared coordinate space between objects.
- Layout is CSS-only; no resize listener. Under reduced motion the second drawing is absolutely positioned (inset 6%, size 88%) over the first.

## 16. Error and edge-case handling

- **Rapid input:** a touch while that object is still changing is ignored; other objects stay responsive.
- **Backgrounding:** the time base is reset on `visibilitychange`, so no large jump.
- **Resize/orientation:** CSS-only.
- **Leaving during animation:** cleanup cancels the frame.
- **Unhandled:** the reduced-motion setting is read once at mount; changing it during play has no effect until the activity is reopened.

## 17. Testing

There are no automated tests. Manual scenarios to perform:

- [ ] Touch each of the four objects: it changes slowly to the second state with a sparkle; touch again to revert.
- [ ] Touch an object during its change: nothing extra happens.
- [ ] Put all four in the second state: the glow appears; revert one and the glow fades out.
- [ ] Launch the activity several times: the four objects differ between launches, and never contain duplicates in one launch.
- [ ] Check all 12 objects at least once for correct drawing at e=0, mid-change and e=1 (including Termometr colour, Niebo sun/moon, Kropki fading in order).
- [ ] Portrait and landscape; very small phone (for example 320x568): 2x2 grid fits and targets are comfortable.
- [ ] Touch, mouse and keyboard (Tab, Enter, Space); screen reader label reflects the state.
- [ ] Switch tab during a change and return.
- [ ] Reduced motion on at launch: states cross-fade between two drawings.
- [ ] Browsers required by the README: Chrome desktop, Chrome Android, Safari iPhone/iPad.

PR [#71](https://github.com/BielinskiLukasz/child-page/pull/71) reports `node --check` and a Node stub-DOM run (touch during a change ignored, glow in and out, cleanup leaves no nodes, normal and reduced-motion modes) and lists manual checks as pending. PR [#143](https://github.com/BielinskiLukasz/child-page/pull/143) reports a stub check that the pool has 12 entries and every `build()` SVG is valid XML; no browser test was done.

## 18. Known limitations and open issues

**Confirmed**
- No automated tests; manual device checks were pending in the PR descriptions.
- Reduced-motion preference is read only once at mount.
- No announcement of the all-four glow to assistive technology.

**Requires verification**
- Appearance of all 12 drawings on small screens, and of the 2x2 layout at small sizes (PR #71 asked for a manual look).

No open GitHub issue is specific to this activity.

## 19. Planned improvements

None currently planned.

## 20. Related activities and reusable components

- Shared helper: [`js/random.js`](../../js/random.js) (`Rand.pick`). `js/animals.js` is not used.
- Thematically related (no shared code): [Dzień i Noc](dzien-i-noc.md) (day and night), [Duże i Małe](duze-i-male.md) (big and small).

## 21. Change history

- Issue [#64](https://github.com/BielinskiLukasz/child-page/issues/64) / PR [#71](https://github.com/BielinskiLukasz/child-page/pull/71): activity added with review follow-ups (unique cup clip ids, symmetric reduced-motion layers).
- Issue [#117](https://github.com/BielinskiLukasz/child-page/issues/117) / PR [#143](https://github.com/BielinskiLukasz/child-page/pull/143): pool of 12 pairs, four random per launch.
