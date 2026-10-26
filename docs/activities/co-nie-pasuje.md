# Co nie Pasuje?

> Documents the current implementation on `main`. Shared platform behaviour (no sound, global reduced-motion rule, menu configuration, playtime, absence of automated tests, analytics status) is described in [README.md](README.md#shared-platform-behaviour) and is not repeated here.

## 1. Overview

| Property | Value |
|---|---|
| Display name | Co nie Pasuje? |
| Activity ID | `co-nie-pasuje` (`js/activities.js`) |
| Description | Three large pictures: two of one kind (for example two fruits) and one different (for example a car). Touching the odd one makes it glow and bounce while the other two fade slightly, then the next set fades in. Touching a matching picture only wobbles it. |
| Category | Sorting / matching (odd one out) |
| Interaction type | Tap |
| Status | Implemented; enabled by default in the menu |
| Source | [`js/co-nie-pasuje.js`](../../js/co-nie-pasuje.js), CSS prefix `cn-` in [`css/style.css`](../../css/style.css) |

## 2. Business purpose

The activity offers a simple categorisation game (find the picture that does not belong) without wrong-answer feedback. A matching picture only wobbles, the odd one gives a reward-free glow, so the child can try freely. It complements the counting and pattern activities with a visual-classification task.

## 3. Activity flow

1. The child opens the tile; the first set fades in (0.9 s).
2. Three pictures are shown in a row (landscape) or a column (portrait). The odd picture is at a random position.
3. The child touches a picture.
   - A matching picture wobbles once (0.7 s) and nothing else changes; the child can keep trying.
   - The odd picture glows and bounces (0.9 s); the two others dim to about 55% opacity.
4. The glow lasts 3 s, then the scene fades out (0.9 s) and a new set fades in (0.9 s).
5. There is no end screen; the activity continues with new sets. The child leaves with the Back button.

## 4. Rules and behavior

| Rule | Value |
|---|---|
| Pictures per set | 3 (2 of one category, 1 odd) |
| Sets | 10 fixed sets (`SETS`) |
| Pictures | 12 in 4 categories of 3 (`PICS`) |
| Wobble (matching) | 0.7 s (`WOBBLE`), rotation up to 7 degrees, decaying |
| Bounce (odd) | 0.9 s (`BOUNCE`), up to 16 units high |
| Glow | 3 s (`GLOW`), 0.5 s ramps; the other two pictures dim by up to 0.45 opacity |
| Fade between sets | 0.9 s out and 0.9 s in (`FADE`) |
| Touch handling | accepted only in phase `play`; ignored during glow, fade out and fade in |
| Odd position | random among the 3 slots |

Categories (`PICS`): 0 fruit (Jabłko, Gruszka, Banan), 1 vehicles (Samochód, Łódka, Samolot), 2 animals (Kotek, Kaczuszka, Rybka), 3 toys (Piłka, Klocek, Latawiec).

The 10 sets (`[category, picture, picture]` for the matching pair, `[category, picture]` for the odd one): fruit pairs (Jabłko+Gruszka, Gruszka+Banan, Jabłko+Banan), vehicle pairs (Samochód+Łódka, Łódka+Samolot), animal pairs (Kotek+Kaczuszka, Kaczuszka+Rybka, Kotek+Rybka) and toy pairs (Piłka+Klocek, Klocek+Latawiec), each with an odd picture from another category. Example: `[[0,0,1],[1,0]]` is Jabłko and Gruszka with Samochód as the odd one.

A correct touch is final for the set: after the odd picture is touched, further touches are ignored until the next set is shown. No score is kept.

## 5. Educational and developmental benefits

**Intended design benefits**: visual perception and categorisation (shape, kind of object), attention, calm cause and effect, independent play without text.

**Directly observable behavior**
- Meaning is carried by silhouettes and pictures, not by colour alone (stated in the source header).
- A wrong guess has no negative signal; only a small wobble.
- The set changes only after the odd picture is found.

**Requires professional or research-based validation**
- Whether children learn categories or improve attention through this activity.
- Whether pairings such as Kaczuszka and Rybka (both animals) and Łódka and Latawiec (different categories) are unambiguous for a young child.

## 6. Accessibility and usability

- **Input:** touch, mouse, stylus and keyboard (each picture is a `<button>` with an `aria-label` of its Polish name, for example "Jabłko"); 4px focus outline; `touch-action: manipulation`.
- **Target size:** `--cn-s` is `min(28vw, 56dvh, 260px)` in landscape and `min(56vw, 22dvh, 260px)` when the viewport is not wider than tall; `min-width`/`min-height` 72px.
- **Orientation:** row in landscape, column in portrait (`@media (max-aspect-ratio: 1/1)`); the board is fluid (no fixed aspect ratio).
- **Colour:** each picture has a distinctive silhouette; the glow is a pale yellow circle behind the picture.
- **Reading:** none required.
- **Sound:** none.
- **Reduced motion:** state changes (glow, dimming, fades) are driven by a `requestAnimationFrame` loop, so they still run under the global CSS rule. In addition the code reads `prefers-reduced-motion` once at mount (`noMotion`): when set, the wobble and bounce movement is omitted (the timing still runs, so touches are ignored for the same durations), leaving glow, dimming and fades.
- **Limitations:** the correct choice is not announced to assistive technology; the dimming of the others is visual only.

## 7. Risks and limitations

- Only 10 fixed sets, so repetition appears after a short while (never twice in a row).
- Some pairs may be ambiguous in a child's mind (for example a boat and a fish both relate to water; a kite and an aeroplane both fly); the design intends category by object type but this is not validated.
- Touches are ignored for about 3 s plus fades after the odd picture is found, which may feel unresponsive to a child tapping repeatedly.
- No ending; the activity loops with new sets.
- Privacy: nothing is stored or transmitted.

## 8. Configuration

No external configuration; constants live in `js/co-nie-pasuje.js`.

| Name | Purpose | Type | Default | Changeable without code change? |
|---|---|---|---|---|
| `WOBBLE`, `BOUNCE` | Matching-picture wobble and odd-picture bounce (s) | numbers | 0.7, 0.9 | No |
| `GLOW` | Time the glow shows before the next set (s) | number | 3 | No |
| `FADE` | Set fade out and fade in (s each) | number | 0.9 | No |
| `MAXDT` | Frame cap (s) | number | 0.05 | No |
| `PICS` | 12 pictures by category | nested array of `{label, svg}` | 4 x 3 | No |
| `SETS` | The 10 sets | array | see section 4 | No |

## 9. Assets

No external asset files. All 12 pictures are inline SVG strings in `js/co-nie-pasuje.js` (100x100 viewBox, shared `STROKE` attributes and a shared glow circle `GLOWC`). No fonts, images or audio.

## 10. Randomization and variants

- **What is random:** the next set (`pick()` uses `Math.random()` over the 10 sets) and the slot of the odd picture (`Math.floor(Math.random() * 3)`).
- **Immediate repetition:** the next set is re-drawn until it differs from the current one (`do ... while (n === cur)`), so the same set never appears twice in a row. Across sets, repeats are allowed and there is no cycle through all sets. The odd slot can repeat.
- **Does not use `Rand`:** the shared helper `js/random.js` is not used here.
- **Persistence:** none; each visit starts with a random set (the very first set is also random).

## 11. Progression and difficulty

None. All sets are equivalent; no levels; nothing is persisted.

## 12. Completion and feedback

- **Completion:** touching the odd picture ends the set.
- **Success feedback:** the odd picture glows and bounces; the other two dim.
- **Incorrect touch:** the touched matching picture wobbles; no other change.
- **After completion:** the next set fades in automatically after about 3.9 s (3 s glow plus 0.9 s fade out, then 0.9 s fade in). No sound.

## 13. Analytics and metrics

This activity reports to the shared on-device module `js/analytics.js` (`window.Analytics`) through the app shell only: `js/app.js` records the activity start and end, and the module counts touches inside the stage. The activity file itself calls no `Analytics` function. Recorded for it: starts, active time, replays (re-opening in the same session), quick exits (within 10 s) and touches. It is open-ended, so no completion, level or exit-before-completion is defined for it. Data stays on the device as anonymous daily aggregates; see [README.md](README.md#analytics-status).

## 14. Technical implementation

- **Entry point:** IIFE in [`js/co-nie-pasuje.js`](../../js/co-nie-pasuje.js) overriding `mount` for `co-nie-pasuje`.
- **Rendering:** DOM and SVG: a `.cn` root with a `.cn-row` containing three `<button class="cn-btn">` each with an SVG.
- **State:** `phase` (`in`, `play`, `glow`, `out`), `fade`, `glow`, `dim`, `cur` (current set), `oddIdx`, per item `{odd, t}`.
- **Animation:** single `requestAnimationFrame` loop `frame()` with capped dt, stops when idle and while the tab is hidden; `wake()` restarts it.
- **Events:** `click` on each button; `visibilitychange`.
- **Cleanup:** removes the listener, cancels the frame and removes the root.
- **Shared helpers:** none.

## 15. Responsive layout and coordinate system

- The row is a flexbox centred in a container padded 56px at the top (Back button) plus safe areas.
- Size variable `--cn-s` (see section 6) is applied to the three buttons; each picture is a 100x100 SVG scaled to the button.
- Landscape: `flex-direction: row`, `gap: 4vw`. Viewport not wider than tall: column, `gap: 3dvh`, smaller `--cn-s`.
- There is no resize listener; the layout is CSS only. There is no shared coordinate system between pictures.

## 16. Error and edge-case handling

- **Rapid input:** touches are ignored outside the `play` phase; repeated touches on matching pictures simply restart the wobble.
- **Backgrounding:** loop cancelled while hidden and restarted on return.
- **Resize/orientation:** CSS only.
- **Leaving during animation:** cleanup cancels the frame.
- **Unhandled:** the reduced-motion preference is read once at mount.

## 17. Testing

There are no automated tests. Manual scenarios to perform:

- [ ] A set appears after the fade-in with two matching pictures and one odd picture.
- [ ] Touch a matching picture repeatedly: only a wobble; nothing else changes.
- [ ] Touch the odd picture: it glows and bounces, the others dim, and a new set fades in after about 4 s.
- [ ] Touch pictures during the glow and fades: nothing happens.
- [ ] Play 20 or more sets: the same set never appears twice in a row; the odd picture's slot varies.
- [ ] Check each of the 12 pictures renders correctly and is recognisable.
- [ ] Portrait and landscape; rotate between sets; small phone (320x568) and large tablet.
- [ ] Touch, mouse and keyboard (Tab, Enter, Space).
- [ ] Switch tab during the glow and return.
- [ ] Reduced motion on at launch: no wobble or bounce, glow, dimming and fades still shown.
- [ ] Browsers required by the README: Chrome desktop, Chrome Android, Safari iPhone/iPad.

PR [#80](https://github.com/BielinskiLukasz/child-page/pull/80) reports only `node --check`; it states that there was no browser in the sandbox and that manual tests (browsers, orientation, reduced motion) were pending.

## 18. Known limitations and open issues

**Confirmed**
- Only 10 sets and 12 pictures.
- No automated tests; manual tests were pending in PR #80.
- Reduced-motion preference is read once at mount.

**Requires verification**
- Whether all pairings are unambiguous for the target age.
- Layout of three 72px+ pictures in very short landscape viewports (for example 640x360).

No open GitHub issue is specific to this activity.

## 19. Planned improvements

None currently planned.

## 20. Related activities and reusable components

- Same scene pattern (single rAF loop, glow, wait, cross-fade): [Policz Razem](policz-razem.md), [Ścieżka](sciezka.md), [Wzorki](wzorki.md).
- Related theme (finding what differs): [Cienie](cienie.md) (matching shadows).
- Shared helpers `js/random.js` and `js/animals.js` are not used.

## 21. Change history

- Issue [#60](https://github.com/BielinskiLukasz/child-page/issues/60) / PR [#80](https://github.com/BielinskiLukasz/child-page/pull/80): activity added.
