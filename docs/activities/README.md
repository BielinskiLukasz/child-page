# Activity documentation

One document per activity of *Spokojny Świat Artura*, describing the **current implementation on `main`** (planned work is kept apart under "Known limitations" and "Planned improvements" in each document). New documents start from [ACTIVITY_TEMPLATE.md](ACTIVITY_TEMPLATE.md). The product overview lives in the [project README](../../README.md).

*Documents were last brought in line with `main` at commit `4f83f9e` (includes PR #172 usage metrics and PR #173 visual fixes); when `main` changes an activity, update its document.*

## Shared platform behaviour

These facts apply to every activity; the activity documents link here instead of repeating them and only note deviations.

- **Loading and mounting.** `index.html` loads `js/activities.js` (the registry `window.ACTIVITIES`, each entry `{ id, name, icon, mount }`), the shared helpers, one script per activity, then `js/app.js`. An activity script replaces the placeholder `mount(container)` of its registry entry; `mount` returns an optional cleanup function. See [`js/activities.js`](../../js/activities.js) and [`js/app.js`](../../js/app.js).
- **Navigation.** URL hash routing (`#<id>`); the Back button returns to the menu (browser Back also works). `app.js` calls the activity's cleanup function and empties the stage on every exit.
- **Menu configuration.** [`js/menu-config.js`](../../js/menu-config.js) stores the enabled activities and their order in `localStorage` (key `swa.menu`); a parent edits it in the gated Settings. Disabled activities cannot be opened by any route. An entry can ship disabled with `defaultOff: true` (currently only Wiatraczki).
- **Playtime limit.** [`js/playtime.js`](../../js/playtime.js) counts visible activity time against a parent-set daily limit (default 20 minutes) and replaces the running activity with a "later" screen when time is up. Stored locally as `{ limit, used, day }` (`swa.playtime`).
- **No sound.** The application has no audio code or audio assets; activities are silent.
- **Reduced motion.** [`css/style.css`](../../css/style.css) has a global `prefers-reduced-motion: reduce` rule that disables CSS animations and transitions. Activities that depend on motion for state changes drive them from a `requestAnimationFrame` loop instead; each document says which approach it uses.
- **Shared helpers.** [`js/random.js`](../../js/random.js) (`window.Rand`: `shuffle`, `pick`, `pickOne`; in-memory only) and [`js/animals.js`](../../js/animals.js) (`window.Animals`: the 13-animal SVG family with `head` and `pick`).
- **Offline/PWA.** [`sw.js`](../../sw.js) is network-first with cache fallback; no version bump is needed on deployment.
- **Automated tests.** The repository has **no automated test suite** (no unit, component, integration, end-to-end, visual or accessibility tests) and the only CI workflow ([`.github/workflows/pages.yml`](../../.github/workflows/pages.yml)) deploys to GitHub Pages. Each activity's "Testing" section therefore lists manual scenarios only. The README requires manual tests on Chrome desktop, Chrome Android and Safari iPhone/iPad.
- **Privacy.** No backend, cookies, ads, third-party requests or personal data. Only the playtime and menu settings above are stored, locally.

### Analytics status

On `main` the application has an on-device usage-metrics module, `js/analytics.js` (`window.Analytics`), introduced by issue [#164](https://github.com/BielinskiLukasz/child-page/issues/164) and merged in pull request [#172](https://github.com/BielinskiLukasz/child-page/pull/172). It is the single place that writes analytics storage (`localStorage` key `swa.stats`: anonymous daily aggregates for 90 days plus all-time totals; no network, no per-event history, no personal data). `js/app.js` reports every activity start and end, and the module counts touches inside the stage, so **all 49 activities** get starts, active time, replays, quick exits (within 10 s) and touches without any code of their own. Only seven activities call the module themselves: **Puzzle**, **Pamięć**, **Kolorowe Kształty** and **Policz Razem** report levels (`levelStart`, `levelComplete`) and completions (`complete`), **Literki** reports the letter shown and touched (`track('interaction', { variant })`), and **Psia Myjnia** reports the breed touched (`track('interaction', { variant })`) and each clean dog (`complete`) while staying open-ended, and **Wyścig Piesków** reports the breed cheered (`track('interaction', { variant })`) and each finished race (`complete`) while staying open-ended. Completion, exit-before-completion and highest level are defined only for the four completable activities; every other activity is open-ended. The data is shown and exported (JSON) only in the parent-gated Settings under **Statystyki**, where it can also be reset. The "Analytics and metrics" section of each activity document states what is recorded for that activity.

## Activity index

Documentation status: **Complete** = all 21 sections written from the current source; sections that could not be verified from code say `Not currently documented`. Order follows the menu default.

| # | Activity | ID | Description | Status |
|---|---|---|---|---|
| 1 | [Akwarium Artura](akwarium-artura.md) | `akwarium` | A calm canvas aquarium where touching the water drops food that 2-8 uniquely shaped and coloured fish swim to eat, and touching a fish makes it blow bubbles. | Complete |
| 2 | [Magiczny Ogród](magiczny-ogrod.md) | `ogrod` | A meadow with random weather and time of day where touching the lawn grows a flower or mushroom and touching the drifting cloud gently clears the garden. | Complete |
| 3 | [Nocne Niebo](nocne-niebo.md) | `niebo` | Glowing stars in a night sky that the child taps to connect into one of 10 shapes, shown in random order with a gentle glow and a Dalej button when complete. | Complete |
| 4 | [Dzień i Noc](dzien-i-noc.md) | `dzien-i-noc` | A calm sky where touching the sun or moon slowly switches between day and night, with drifting clouds, a daytime bird flock and an occasional night satellite or plane. | Complete |
| 5 | [Ogród Motyli](ogrod-motyli.md) | `motyle` | A garden of five swaying flowers where touching a flower sends a butterfly flying slowly to it along a smooth curve, with random flower and butterfly colours each visit. | Complete |
| 6 | [Malowanie Światłem](malowanie-swiatlem.md) | `malowanie` | A dark canvas where touching and dragging paints soft glowing coloured marks that drift and fade away after a few seconds. | Complete |
| 7 | [Mały Pociąg](maly-pociag.md) | `pociag` | A little train with three random animal wagons that the child starts, stops, sends to the station or makes nod. | Complete |
| 8 | [Bańki Mydlane](banki-mydlane.md) | `banki` | Touching the screen blows soft bubbles that float up, split when touched and fade away over one of six painted backgrounds. | Complete |
| 9 | [Dobranoc](dobranoc.md) | `dobranoc` | A house at dusk where the child dims windows and tucks three random animals in, until stars and a sleeping moon appear. | Complete |
| 10 | [Deszczyk i Tęcza](deszczyk-i-tecza.md) | `deszczyk` | Three clouds that rain gently when touched, with rippling puddles and a soft rainbow after enough rain. | Complete |
| 11 | [Kolorowe Kształty](kolorowe-ksztalty.md) | `ksztalty` | Drag soft coloured shapes onto matching dashed outlines, growing from 2x2 to 3x3 pieces with fresh random shapes and colours. | Complete |
| 12 | [Zwierzątka na Farmie](zwierzatka-na-farmie.md) | `farma` | A pastel farm with a barn and five random animals that react slowly when touched, and a barn door that opens to show a peeking face. | Complete |
| 13 | [Policz Razem](policz-razem.md) | `policz-razem` | A counting activity where rounds of 1 to 10 friendly objects are touched one by one, adding a dot to a counting row and showing the numeral. | Complete |
| 14 | [Ubierz Misia](ubierz-misia.md) | `ubierz-misia` | A teddy bear is dressed for the weather chosen in the window (sun, rain or snow) by dragging or selecting six clothes, with a happy hop for fitting items and a head tilt otherwise. | Complete |
| 15 | [Przeciwieństwa](przeciwienstwa.md) | `przeciwienstwa` | Four big objects drawn from a pool of 12 slowly change into their opposite (open and closed, empty and full, day and night) when touched and change back when touched again. | Complete |
| 16 | [Co nie Pasuje?](co-nie-pasuje.md) | `co-nie-pasuje` | Three large pictures, two of one kind and one odd; touching the odd one makes it glow and bounce before the next set appears, while the others only wobble. | Complete |
| 17 | [Literki](literki.md) | `literki` | One big Polish letter on a card with a picture of a word that starts with it, with arrows or a swipe to move through all 32 letters in random order. | Complete |
| 18 | [Ścieżka](sciezka.md) | `sciezka` | The child drags a finger along a wide curvy path and a small figure slowly follows it forward to a flower or house, then the next path appears. | Complete |
| 19 | [Wzorki](wzorki.md) | `wzorki` | A string of four beads shows a repeating pattern and the child chooses which of two beads continues it, over three beads, before a new pattern appears. | Complete |
| 20 | [Zabawa w chowanego](zabawa-w-chowanego.md) | `chowany` | A garden of four hiding places where tapping a cover slowly reveals an animal or a flower, and the animals move to new places after everything has been opened. | Complete |
| 21 | [Koraliki](koraliki.md) | `koraliki` | Eight big pastel beads in different shapes are dragged from a bowl onto a string to make a necklace that glows softly when complete. | Complete |
| 22 | [Duże i Małe](duze-i-male.md) | `duze-i-male` | A big and a small house with two big and two small animals to drag to the house of matching size, with new animals and a soft glow after every round. | Complete |
| 23 | [Kolorowe Kubeczki](kolorowe-kubeczki.md) | `kubeczki` | Three pastel cups and six balls to drag into the cup of the same colour and pattern, with a random colour set each time the activity opens. | Complete |
| 24 | [Puzzle](puzzle.md) | `puzzle` | A simple picture cut into big pieces to drag into an outline, with 25 random pictures and a grid that grows from 2x2 to 4x4 after every five finished puzzles. | Complete |
| 25 | [Wieża z Klocków](wieza-z-klockow.md) | `wieza` | Soft pastel blocks of 5 to 9 random shapes and colours are dragged onto a tower base in any order, and the tower can never fall. | Complete |
| 26 | [Myjnia](myjnia.md) | `myjnia` | A muddy vehicle or animal in a car wash is scrubbed clean with a finger while soap bubbles float up, followed by a soft glow and a new muddy item. | Complete |
| 27 | [Cienie](cienie.md) | `cienie` | Drag three coloured animals onto their matching grey silhouettes, with a soft glow when all are placed and a new random set afterwards. | Complete |
| 28 | [Buźki](buzki.md) | `buzki` | A big friendly face and a small random animal copy calm expressions (happy, sleepy, surprised, calm) that the child cycles by touch, with blink, cheek-glow and smile/yawn touch zones. | Complete |
| 29 | [Pamięć](pamiec.md) | `pamiec` | A calm memory card game starting with three pairs of large picture cards and adding a pair after each completed game, up to ten pairs. | Complete |
| 30 | [Gdzie jest Piłka?](gdzie-jest-pilka.md) | `pilka` | A ball, a box on a table and a little bunny: the child taps four marked places or drags the ball to see it in, on, under or next to the box while the bunny reacts. | Complete |
| 31 | [Rysuj Kształty](rysuj-ksztalty.md) | `rysuj-ksztalty` | Trace a dotted guide (line, circle, zigzag, cross, wave, spiral) with a finger to draw a soft, gently changing coloured line, then move on to the next shape. | Complete |
| 32 | [Mały Samolot](maly-samolot.md) | `samolot` | A slow little propeller plane with an animal pilot: tap to take off or land, tap a cloud to circle it, tap the pilot to wave, with random plane, airport, weather and pilot each launch. | Complete |
| 33 | [Traktor](traktor.md) | `traktor` | A tractor with a random animal driver drives a serpentine loop over a three-row field, planting sprouts that grow into flowers and carrots. | Complete |
| 34 | [Autobusik](autobusik.md) | `autobusik` | A little bus loops along a village road with three stops where waiting random animals hop aboard when the bus stops. | Complete |
| 35 | [Rakieta](rakieta.md) | `rakieta` | A rocket with a random animal astronaut flies a slow loop through a starry sky and can visit three planets, with a random sky arrangement per launch. | Complete |
| 36 | [Mała Łódka](mala-lodka.md) | `lodka` | A small sailboat with a bear and a rabbit sails a calm river, moors at a jetty and reacts to nodding ducks and waving animals. | Complete |
| 37 | [Łódź Podwodna](lodz-podwodna.md) | `podwodna` | A yellow submarine with a bear in its window swims or rests on the sand among four fish and rising bubbles. | Complete |
| 38 | [Kolejka Linowa](kolejka-linowa.md) | `kolejka` | A cable-car gondola with a bear and a rabbit shuttles between a valley and a peak station, pausing at each with the door open. | Complete |
| 39 | [Balon](balon.md) | `balon` | A hot-air balloon with a bear and a rabbit rises slowly from a meadow or floats back down under drifting, touchable clouds. | Complete |
| 40 | [Karuzela](karuzela.md) | `karuzela` | A pastel merry-go-round with four random animals that the child starts, stops or turns by hand while the animals hop or wave. | Complete |
| 41 | [Zjeżdżalnia](zjezdzalnia.md) | `zjezdzalnia` | A playground with a ladder, slide and mat where three random animals queue, climb, slide down and walk back when touched. | Complete |
| 42 | [Huśtawka](hustawka.md) | `hustawka` | A garden swing with a random animal that the child pushes gently, with a tree and slowly falling leaves at higher swings. | Complete |
| 43 | [Latawiec](latawiec.md) | `latawiec` | A sky scene where a kite follows the child's finger with a soft lag, a ribbon tail, three clouds and a random animal holding the string. | Complete |
| 44 | [Zegar z Kukułką](zegar-z-kukulka.md) | `kukulka` | A wooden cuckoo clock with three doors where a bird, a mouse and a bear peek out, plus turnable clock hands and a swinging pendulum. | Complete |
| 45 | [Wiatraczki](wiatraczki.md) | `wiatraczki` | A meadow with nine different pinwheels that spin when tapped or swept by a finger gust, with a swaying windsock (disabled in the menu by default). | Complete |
| 46 | [Kąpiel Zwierzątek](kapiel-zwierzatek.md) | `kapiel` | A spa for a random animal in three gentle finger-drag stages (scrub mud, shower off foam, towel-dry), ending with a small accessory and a glow. | Complete |
| 47 | [Rasy Piesków](rasy-pieskow.md) | `rasy` | A gallery of eight dog breeds drawn at their relative sizes with Polish names; touching a dog makes it smile, wag its tail and flutter its ears. | Complete |
| 48 | [Psia Myjnia](psia-myjnia.md) | `psiamyjnia` | A dog-only car wash: a muddy dog of a random breed is scrubbed clean with a finger, shakes, glows and shows its Polish name; the next breed arrives about 4 s later. | Complete |
| 49 | [Wyścig Piesków](wyscig-pieskow.md) | `wyscig` | A friendly race of four random dog breeds: the child cheers dogs with taps for a short speed boost, all four finish together, wag, and confetti starts the next race. | Complete |

Template for new activities: [ACTIVITY_TEMPLATE.md](ACTIVITY_TEMPLATE.md).
