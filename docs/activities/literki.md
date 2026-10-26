# Literki

> Documents the current implementation on `main`. Shared platform behaviour (no sound, global reduced-motion rule, menu configuration, playtime, absence of automated tests, analytics status) is described in [README.md](README.md#shared-platform-behaviour) and is not repeated here.

## 1. Overview

| Property | Value |
|---|---|
| Display name | Literki |
| Activity ID | `literki` (`js/activities.js`) |
| Description | One big letter (capital and small, for example "Aa") on a soft card with a drawn picture of something that starts with it. Touching the picture wiggles it and shows its Polish word for about 3 s; touching the letter makes it glow; arrows or a swipe move to the next or previous letter. |
| Category | Exploratory (letters) |
| Interaction type | Tap and swipe |
| Status | Implemented; enabled by default in the menu |
| Source | [`js/literki.js`](../../js/literki.js), data [`js/literki-data.js`](../../js/literki-data.js), CSS prefix `lt-` in [`css/style.css`](../../css/style.css) |

## 2. Business purpose

A parent-and-child letter picture book: the child sees large letters with friendly pictures, and the parent can read the word shown under the picture. It is the only activity in the application that introduces the Polish alphabet. There are no scores or wrong answers.

## 3. Activity flow

1. The child opens the tile; the first letter of a random order is shown at once (no fade-in).
2. The card shows the letter (for example "Aa") and a picture (for example an arbuz for A).
3. The child can touch the picture, touch the letter, press an arrow, or swipe the card horizontally.
4. Picture: it wiggles (0.8 s) and its word appears below it for about 3 s, then fades out (0.5 s).
5. Letter: it glows softly for 1 s.
6. Arrow or swipe: the card slides out and the next (or previous) letter slides in (0.5 s in total). The picture shown is a random one of the letter's pictures.
7. After the last letter of a round, going forward starts a new random round. Nothing changes on its own; there is no completion state.
8. The child leaves with the Back button.

## 4. Rules and behavior

| Rule | Value |
|---|---|
| Letters | 32 (Polish alphabet): A Ą B C Ć D E Ę F G H I J K L Ł M N Ń O Ó P R S Ś T U W Y Z Ź Ż |
| Pictures per letter | 2 (64 pictures in total) |
| Slide | 0.5 s (`SLIDE_S`); card fades out for the first half and in for the second half; the letter is swapped at the midpoint; slide offset 60 px |
| Wiggle | 0.8 s (`WIGGLE_S`), up to 7 degrees |
| Word display | visible 3 s (`WORD_S`) after 0.25 s fade-in, 0.5 s fade-out (`WORD_FADE_S`) |
| Glow | 1 s (`GLOW_S`), `drop-shadow` up to 22 px |
| Swipe | horizontal movement over 60 px between `pointerdown` and `pointerup` on the card; left goes next, right goes previous |
| Input during a slide | ignored (`go()` returns while a slide is running); picture and letter touches are still accepted |
| Order | all 32 letters once per round in random order, then a new random round |

Words with a flag `c: 1` do not start with the letter (there is no suitable native word); they are shown as "<word> · <letter> w słowie" ("letter in the word"). The 10 flagged pictures are: Ą (ząb, wąż), Ć (kość), Ę (gęś, ręka), Ń (słoń, koń), Ó (żółw), Y (mydło, tygrys). Ą, Ę, Ń and Y therefore have only such words; Ć and Ó have one normal word each (ćma, ósemka).

Going back from the first letter of a round wraps to the last letter of the same round order.

## 5. Educational and developmental benefits

**Intended design benefits**: early exposure to letter shapes and to the words that start with them (with a parent reading the word), visual perception, calm independent exploration.

**Directly observable behavior**
- The letter is large (110-220px), shown as capital and small; the word is small and meant for the parent.
- The child controls the pace; nothing changes by itself.
- The word is shown only after touching the picture.

**Requires professional or research-based validation**
- Whether the activity helps letter recognition or reading readiness.
- Whether words with the "w słowie" notation (letter inside the word) are understandable for a parent and not confusing.

## 6. Accessibility and usability

- **Input:** touch, mouse, stylus (buttons plus pointer-event swipe) and keyboard (Tab, Enter, Space on the arrows, letter and picture buttons; there are no arrow-key shortcuts). 4px focus outlines.
- **Target size:** arrows 60 x 60px; letter button at least 96px (font size `clamp(110px, 30vmin, 220px)`); picture button `clamp(96px, 30vmin, 200px)` square.
- **Orientation:** the card is a row in landscape and a column in portrait (`@media (orientation: portrait)`); the card is at most 720 x 520px.
- **Colour:** letters are lilac on a white card; pictures are recognisable by shape.
- **Reading:** reading is not required for the child; the word text is for a parent. It has `aria-live="polite"`, and the letter and picture have labels ("Litera A", "Obrazek: arbuz").
- **Sound:** none; the activity does not pronounce letters or words.
- **Reduced motion:** all motion is driven by a `requestAnimationFrame` loop, so it still runs under the global CSS rule. In addition the code reads `prefers-reduced-motion` on every frame: when set, the slide is replaced by a fade without the 60px offset and the wiggle is skipped.
- **Limitations:** swipes starting on a button may also trigger its click if the pointer ends on the same button (see section 18); text is in Polish only.

## 7. Risks and limitations

- No audio, so the child cannot hear a letter unless a parent reads it.
- The "w słowie" words (for example ząb for Ą) may confuse a parent who expects the word to start with the letter.
- Letter shapes depend on the system font (`font-family: inherit`); some fonts draw "ą", "ę" or "ń" differently.
- Accidental swipes can change the letter while the child intends to tap.
- Privacy: nothing is stored or transmitted.

## 8. Configuration

No runtime configuration; the letters and pictures are data in [`js/literki-data.js`](../../js/literki-data.js) and timings are constants in `js/literki.js`.

| Name | Purpose | Type | Default | Location | Changeable without code change? | Fallback |
|---|---|---|---|---|---|---|
| `window.LiterkiData` | Letters: `{u, l, pics: [{w, c?, svg}]}` | array | 32 letters | `js/literki-data.js` | Data edit only (no UI) | `[]` if missing (see section 16) |
| `SLIDE_S`, `WIGGLE_S`, `WORD_S`, `WORD_FADE_S`, `GLOW_S` | Timings (s) | numbers | 0.5, 0.8, 3, 0.5, 1 | `js/literki.js` | No | None |
| Swipe threshold | Minimum horizontal distance | number | 60 px | `sup()` | No | None |

## 9. Assets

No external image files. The 64 pictures are inline SVG strings in `js/literki-data.js` (100x100 viewBox, the app's own style), one `w` (Polish word) per picture and an optional `c` flag. The file is about 24 KB and is loaded by a script tag before `js/literki.js`. The arrow icons are inline SVG in `js/literki.js`.

## 10. Randomization and variants

- **Letter order:** `Rand.shuffle(LETTERS)` at launch and again at the start of each new round; each letter appears once per round. When a new round starts, its first letter is never the letter just shown (the first element is rotated to the end if equal).
- **Picture:** `Rand.pickOne(L.pics, 'literki-' + L.l)` on each showing; with 2 pictures per letter, the picture differs from the last one shown for that letter within the page session (the memory is in-process and per letter).
- **Pool sizes:** 32 letters; 2 pictures per letter.
- **Persistence:** none; a new order on every launch.

## 11. Progression and difficulty

None. The child moves freely forwards and backwards; the order is random, not progressive. Nothing is persisted.

## 12. Completion and feedback

There is no completion state and no failure. Feedback: wiggle and word for the picture, glow for the letter, slide for navigation. No sound. When a round ends, the next forward step simply starts a new random round.

## 13. Analytics and metrics

On `main` this activity emits **no analytics events**; see [Analytics status](README.md#analytics-status) and open PR [#172](https://github.com/BielinskiLukasz/child-page/pull/172).

Not implemented (for planning only): as an open-ended browsing activity, the meaningful signals would be `activity_start` / `activity_end` (active time) and an `interaction` count (picture touches, letter touches, letter changes). No completion rate, because the activity has no end. No personal data is needed.

## 14. Technical implementation

- **Entry point:** IIFE in [`js/literki.js`](../../js/literki.js) overriding `mount` for `literki` (via `forEach` over `window.ACTIVITIES`); it reads `window.LiterkiData`.
- **Rendering:** DOM: `.lt-field` with two arrow buttons and `.lt-card` containing the letter button (`.lt-letter`, text "Aa"), the picture button (`.lt-pic`, an SVG) and `.lt-word`. `show(i)` rewrites the texts and the SVG.
- **State:** `order` (shuffled letters), `idx`, and timers `slide`, `wiggle`, `wordT`, `glow`.
- **Animation:** one `requestAnimationFrame` loop `frame()` with capped dt (0.05 s), started by `start()` and stopped when idle or hidden.
- **Events:** `click` on arrows, picture and letter; `pointerdown`, `pointerup`, `pointercancel` on the card for the swipe; `visibilitychange`.
- **Randomization:** [`js/random.js`](../../js/random.js) (`shuffle`, `pickOne`).
- **Cleanup:** cancels the frame, removes the `visibilitychange` listener and the root.

## 15. Responsive layout and coordinate system

- `.lt-field` is absolutely positioned with 64px at the top (Back button) and safe-area insets, a flex row with arrows on each side of the card.
- The card is `flex: 1 1 auto`, `max-width: 720px`, `max-height: 520px`; landscape is a row (letter, picture), portrait a column.
- Sizes use `vmin` clamps (letter 110-220px, picture 96-200px, word 1.1-1.6rem).
- Letters and picture SVGs are scaled by CSS; there is no board coordinate space.
- No resize handler is needed (CSS only).

## 16. Error and edge-case handling

- **Quick repeated arrow touches:** ignored while a slide is running (one letter per slide).
- **Touch cancel:** `pointercancel` clears the swipe start.
- **Backgrounding:** loop stopped while hidden and restarted on return.
- **Reduced motion:** read every frame.
- **Missing data:** if `js/literki-data.js` fails to load, `LETTERS` is `[]` and `show(0)` would fail (`order[idx]` undefined, causing a script error at mount). This is not handled.
- **Unhandled:** a swipe that starts and ends on the same button also triggers that button's click (see section 18).

## 17. Testing

There are no automated tests. Manual scenarios to perform:

- [ ] Open the activity: a letter with a picture is shown; the word is hidden.
- [ ] Touch the picture: wiggle and a word below for about 3 s, then fade; the word for a flagged picture shows "letter w słowie".
- [ ] Touch the letter: soft glow for about 1 s.
- [ ] Use the next and previous arrows through all 32 letters of one round and wrap past the end; the first letter of the new round is not the last letter shown.
- [ ] Swipe left and right over 60 px on the card; short movements do nothing.
- [ ] Double-tap an arrow quickly: only one letter change.
- [ ] Leave and re-enter: the order is different; the letters Ą, Ę, Ń, Y show words flagged with "w słowie".
- [ ] See both pictures of several letters by revisiting them; the picture alternates.
- [ ] Portrait and landscape; very small phone; large tablet.
- [ ] Touch, mouse and keyboard (Tab, Enter, Space).
- [ ] Switch tab while the word is shown and return.
- [ ] Reduced motion on: no wiggle, slide becomes a fade.
- [ ] Browsers required by the README: Chrome desktop, Chrome Android, Safari iPhone/iPad.

PR [#86](https://github.com/BielinskiLukasz/child-page/pull/86) reports `node --check` and a Node stub-DOM run (stepping through letters with wrap-around, quick double tap on an arrow advancing one letter, word displayed about 3 s, glow); it lists touch, swipe and Safari checks as untested. PR [#142](https://github.com/BielinskiLukasz/child-page/pull/142) reports that all 64 SVGs parse as XML and that a Node script confirms 32 letters, at least 2 pictures each, and that every non-flagged word starts with its letter; no browser test.

## 18. Known limitations and open issues

**Confirmed**
- No automated tests; device checks were pending in the PR descriptions.
- Each letter has exactly 2 pictures; Ą, Ę, Ń and Y have only words that contain, not start with, the letter.
- No audio.
- No handling when `LiterkiData` is missing.
- Swipe is bound to `pointerdown`/`pointerup` on the whole card, so a drag that starts and ends on the same button may both swipe and trigger the button (code reading; behaviour in browsers not verified).

**Requires verification**
- Whether horizontal swipes are ever stolen by the browser (`touch-action: manipulation` allows panning).
- Appearance of the letters in the fonts available on each device.

Open issue [#167](https://github.com/BielinskiLukasz/child-page/issues/167) (item 6) asks for at least 2 pictures per letter and 3 where a good Polish word exists, with a random picture on each showing.

## 19. Planned improvements

- Issue [#167](https://github.com/BielinskiLukasz/child-page/issues/167), item 6: more pictures per letter (3 where a good word exists); the random choice on each showing is already implemented.

## 20. Related activities and reusable components

- Shared helper: [`js/random.js`](../../js/random.js) (`shuffle`, `pickOne`). `js/animals.js` is not used.
- Data file: [`js/literki-data.js`](../../js/literki-data.js) (used only by this activity).
- Another browse-and-touch activity with no score: [Co nie Pasuje?](co-nie-pasuje.md) (different mechanics, no shared code).

## 21. Change history

- Issue [#63](https://github.com/BielinskiLukasz/child-page/issues/63) / PR [#86](https://github.com/BielinskiLukasz/child-page/pull/86): activity added (12 letters).
- Issue [#118](https://github.com/BielinskiLukasz/child-page/issues/118) / PR [#142](https://github.com/BielinskiLukasz/child-page/pull/142): full Polish alphabet, random order and random pictures.
- Open issue [#167](https://github.com/BielinskiLukasz/child-page/issues/167): visual and playability fixes batch, including more Literki pictures.
