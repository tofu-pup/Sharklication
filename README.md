# Sharklication

A local-first underwater multiplication game for Lily, guided by **Gobfrey**, our friendly illustrated whale-shark mascot. Built with React, TypeScript and Vite, using the supplied whale-shark artwork. No account, backend, ads, analytics, remote fonts or runtime photo hotlinks.

## Run locally

Requires Node.js 24 and npm.

```powershell
npm ci
npm run dev
```

Open the address Vite prints, followed by `/Sharklication/`. For the installable/offline production version:

```powershell
npm run build
npm run preview
```

Open `http://localhost:4173/Sharklication/`. Development mode does not install a service worker. Use HTTPS on a real host; localhost is also considered secure for local testing. An iPad connecting to an unsecured LAN IP is not the same as secure localhost and may not support installation/offline APIs.

## What works

- Welcome, sanctuary, three daily activities, daily checklist, skippable discovery reveal, shark album/details, extra practice, parent settings and learning summary.
- Reef Trail: six accurate missing-multiple sequences; Feeding Time: three equal-group puzzles with an alternate array view; Discovery Dive: ten primary mixed-recall questions with an in-app number pad.
- The three activity cards are today's checklist, without a large start/continue banner. An unfinished card starts/resumes its daily activity; a finished card is ticked and disabled until **all three** daily stars are earned. Then each of those same cards extends with its ocean habitat and a **Do more to grow your habitat** action for extra practice of that type. There are no duplicate aquarium cards, separate Free Swim screen or navigation item; old `#practice` links land on My ocean. Question selection is automatic; focus tables remain in Parent port. My ocean and Shark album use original illustrated navigation icons.
- Feeding Time uses original cartoon SVG sharks and fish: exactly one shark per group and one fish per item, including the row/array view. The array scrolls sideways within its own panel on narrow screens so twelve fish remain recognisable without overflowing the page. The pictures illustrate equal-group maths, not real species or instructions to feed wildlife.
- Gobfrey introduces the ocean, reassures players after mistakes, helps with strategies and celebrates effort and discoveries. The name was chosen by the owner, inspired by Gobfrey Whale Shark; no Jellycat artwork or affiliation is claimed. His illustrated portrait is distinct from the real whale-shark photograph in the collection.
- After all three daily tasks are complete, each card reveals an **empty bonus aquarium**: **Reef Trail's coral reef**, **Feeding Time's seagrass meadow**, and **Discovery Dive's kelp forest**. Empty scenes invite the child to finish a full bonus set (6 Reef Trail, 3 Feeding Time or 10 Discovery Dive puzzles, plus any queued corrections) to welcome one funny-named neighbour. Daily tasks and partial bonus sets add no animals; hints and retries are welcome. Each arrival is celebrated with enlarged original artwork and its saved name. Habitat-specific pools include giant coral, sponges, jellyfish, lobsters, turtles, seahorses, rays and other playful illustrated animals, shuffled before repeating. All neighbours stay together in one expanding, scrollable aquarium: no 12-friend rollover or population cap. These decorative cartoons are not scientific species exhibits and never alter mastery, daily stars, streak qualification or collectible rewards.
- Wrong answers show relationship-based hints. After two misses, a worked equation and assisted reconstruction avoid an endless guessing loop. Up to three delayed corrections are inserted after two intervening questions when possible. Helped completion earns task progress, not independent success.
- A shared saved daily pool uses a varied first-day starter mix, then introduces at most three new commutative fact pairs on later dates. This first-day exception was explicitly approved during playtesting and recorded in the PRD; it never marks starter facts as mastered. Available facts rotate before repeating and identical consecutive answers are avoided when possible. Both orientations retain separate assessment records. Selection initially weights due/weak, focus and familiar pools at 60/25/15, constrained by variety and redistributing empty pools. Initial focus is 2, 5 and 10. Parents can immediately enable any table from 1–12; automatic broadening is optional.
- Recall reviews are scheduled 1, 3, 7 and 14 days after independent successes on distinct dates. Secure requires independent successful recall on three dates and the latest two assessed primary recall attempts independently correct. Mistakes/assistance in a primary recall assessment return the fact to Practising. Visual puzzle success never establishes recall.
- Complete all three activities, in any order, to qualify a date and grant exactly one previously uncollected shark. Extra practice does not qualify a day or earn another daily shark. Once all sharks are found, completed days receive an Ocean Explorer celebration badge.
- Versioned IndexedDB persistence saves every submitted answer, hint, checkpoint, settings change and reward. A task's completion and its reward are written in the same transaction. Duplicate submissions are guarded and another tab's revision cannot silently overwrite a newer save.
- Production service-worker precaching supports offline daily practice, UI, logo, all starter photos and facts. Offline readiness is checked against actual cached resources. Online updates are checked on launch, foreground/reconnect and every five visible minutes, then applied automatically away from active questions and parent settings.
- Correct answers celebrate for about 1.8 seconds (3.6 seconds for supported answers), then advance automatically after the answer is saved. **Next discovery** can continue immediately; **Pause auto-next** allows unlimited reading time. Hidden/background pages do not advance; returning gives a fresh feedback interval. Navigation cancels pending progression. Failed advances show a save error and require explicit retry, not an automatic retry loop. Saved resolved questions resume safely, and stale timers cannot skip questions.
- On tablets and larger screens, the question/pictures and answer controls sit in separate columns. The question area scrolls independently for large fish groups; on phones it occupies a consistent-height area above the controls. The input, keypad and submit button retain their positions through question changes and feedback, including supported/correct answers. Gobfrey's help and reef sit below on tablets and alongside on wide screens.
- Gentle ocean motion, smooth screen/question entrances and touch feedback bring the app to life. Fish swim and plants sway in each growing habitat; per-habitat motion buttons were removed at the owner's request. System/Parent port reduced-motion preferences still disable all animations and transitions. Correct answers receive varied encouragement, a brief star-and-bubble burst and a cheering guide; activity stars and daily discoveries have reveal animations. Mistakes have no punitive effects and sound remains optional.

## Collection and photo rights

**Current unlockable catalog: 26 real species and 12 fantasy sharks (38 total).**

Real species: whale shark (*Rhincodon typus*), epaulette shark (*Hemiscyllium ocellatum*), blacktip reef shark (*Carcharhinus melanopterus*), whitetip reef shark (*Triaenodon obesus*), bonnethead (*Sphyrna tiburo*) and leopard shark (*Triakis semifasciata*).

Twenty additional species: great white shark, tiger shark, bull shark, great hammerhead, scalloped hammerhead, smooth hammerhead, shortfin mako, blue shark, basking shark, sand tiger shark, nurse shark, lemon shark, sandbar shark, dusky shark, grey reef shark, blacktip shark, zebra shark, tawny nurse shark, spotted wobbegong and Port Jackson shark. The grey reef shark replaces the initially considered spinner shark because the reviewed spinner sources were illustrations or stranded/dead specimens, not suitable living-animal photographs.

Every real entry has a genuine local WebP photograph, scientific name, approximate size, habitat, two independently written description paragraphs, **15 interesting facts**, a Florida Museum reference, and source-specific attribution/license or public-domain links. Facts cover identification, habitat, food, movement and young; original profiles were consulted on 20 October 2026 and the twenty additional profiles on 21 October 2026. The white shark and shortfin mako include supplementary NOAA references. The zebra shark also links to the Australian Museum for its current scientific name, *Stegostoma tigrinum* (older sources use *S. fasciatum*). Dated conservation ratings from older profiles are not repeated as current facts. Images and their file-specific license/species descriptions were reviewed by the coding agent, including visual comparison of diagnostic features. This is **not** a claim of a human taxonomist's certification. No AI wildlife images or substitutions are used.

All 12 fantasy entries use original SVG illustrations, explicit Fantasy badges, imaginary habitats/sizes, two story paragraphs and **eight invented curiosities each**, rather than scientific claims. Fantasy art shares a cartoon silhouette with distinct colors and symbols. The owner-supplied logo is mascot art, not a species photograph; its original authorship/license has not been independently established.

See [ASSET-CREDITS.md](ASSET-CREDITS.md), the in-app Credits screen and each unlocked shark's detail page. Photographs retain their individual Creative Commons licenses or public-domain status, including share-alike for applicable resized adaptations. This does not automatically relicense application code.

### Repeatable asset preparation

No assets are fetched from Wikimedia at game runtime. All display images are checked in under `public/sharks`.

1. Search Wikimedia Commons using the exact scientific name. Inspect the individual file's description, original source, license, and species identification; corroborate diagnostic features with a trusted species reference. Prefer live animals without distressing imagery.
2. Accept only public domain, CC0, CC BY or CC BY-SA. Do not accept noncommercial, no-derivatives, fair-use-only, ambiguous rights or generic unidentified shark photos.
3. Add a reviewed source to the allow-list in `scripts/prepare-assets.mjs` and its catalog data in `src/data/sharks.json` (new entries do not require UI code changes). Do not label unreviewed content as verified. The script verifies that the expected license still matches, uses a descriptive User-Agent, sequential requests and bounded 429/503 backoff, and fails on unexpected responses.
4. Run:

   ```powershell
   npm run assets
   npm run credits
   npm run build
   ```

5. Visually inspect the local resized output. Check file-specific rights/credits, identification and factual claims; exclude anything uncertain. Check in the photograph, manifest entry and raw Commons API evidence together. The script records file URL, creator, rights evidence, access date, modification notice, dimensions and SHA-256.

Preparing assets again downloads the allow-listed originals and regenerates optimized files/icons; it is not required to run or deploy the game. `npm run assets -- --missing` preserves existing manifest entries and downloads only missing species, without regenerating icons. With a system proxy on Node 24, use `node --use-env-proxy scripts\prepare-assets.mjs --missing`. Current photos total approximately 1.92 MiB; the supplied logo is about 1.44 MiB. All 26 photographs are precached for offline access. As the catalog grows, switch to lazy per-unlocked-image caching before adding hundreds of photographs.

The top-left home link uses the separately supplied transparent wordmark. Its source is preserved at `assets/header-logo-source.png`; `npm run logo` removes transparent outer margins and generates `public/sharklication-header.webp` at 1200 x 258 px (about 77 KiB), with no redesign. It is displayed smaller for a sharp, compact header and cached offline.

The help sidebar uses the owner's supplied teacher Gobfrey (glasses and pencil). Its source is retained at `assets/gobfrey-teacher-source.png`; `npm run teacher` produces a transparent 640 x 338 px WebP (about 54 KiB), trimming empty margins without redesign. It is hosted locally, precached and included in offline readiness checks.

## iPad installation and offline use

1. Visit the deployed HTTPS address in Safari.
2. Choose **Share → Add to Home Screen**.
3. Open the installed app online once and wait for **Offline ready**.
4. Turn off the network and verify all activities and an unlocked shark's photograph.

The readiness label is not shown merely because the browser reports itself online/offline; the production worker must be active and required document, script, style, logo and photo assets must be cached. Parent port has an offline retry/check control. On a failed download, practice and saving remain available online; no wildlife photograph is replaced with invented imagery. Free device space, reconnect and reload between activities to retry installation.

The installed app checks for newer versions when opened, brought to the foreground, reconnected, and every five minutes while visible and online. It downloads in the background, then reloads automatically on a safe screen, after progress has loaded and writes have finished. Questions and Parent port (including unsaved settings/import previews) are never deliberately interrupted; return to My ocean to apply a waiting update. Save errors block automatic reload. Applying an update reloads the page, not the IndexedDB save.

iOS can suspend background apps, so no website can guarantee an update while closed, suspended or offline. Open it online to check. The original first release used an update prompt: that one-time transition may still require accepting its prompt or reopening the app before this automatic behavior is installed.

Home Screen icons use the exact owner-supplied artwork from `assets/app-icon-source.png`, resized without cropping or redesign. `npm run icons` regenerates opaque, optimized PNGs: 180 px for iPhone/new installs (about 21 KiB), 167/152 px for iPads, and 192/512 px PWA icons. iOS supplies rounded corners. Existing installed icons may stay cached; to change one, **export a backup first**, then remove/re-add the Home Screen shortcut if necessary. Safari and an installed app may not share every storage context: restore the backup if needed. Cached shark descriptions and photo attribution work offline; external source/license pages need internet access.

## Backup and restore

In **Parent port**, export a versioned JSON backup. Keep it somewhere safe; browser storage is not a permanent backup and may be cleared or evicted. Never commit player backups to GitHub.

To restore, choose a JSON file, review its player/shark/attempt counts, and explicitly confirm replacing current progress. The game does not silently merge two saves. Export the existing save first if it matters. Validation checks schema version, dates, timezone, numeric bounds, table settings, checkpoints, attempt IDs, correct arithmetic, catalog IDs, reward uniqueness and consistency before any replacement transaction. Invalid or unsupported imports leave existing progress untouched. Reset also requires explicit confirmation.

The first released save schema is version 1. `migrateSave` preserves v1 data and appends newly introduced catalog IDs without disturbing the persisted discovery order. The sampling-version-2 migration repairs untouched questions from the first playtest build; answered, hinted, correction and completed questions, attempts, rewards and checkpoints are preserved. Unknown schema versions are rejected rather than guessed or reset. Future shape changes belong in explicit migrations there, with fixture tests; database upgrades belong in `storage.ts`. No pre-release scaffold save format is treated as a released migration contract.

Extra practice retains its v1 checkpoint shape; its existing question activity identifies Reef Trail, Feeding Time or Discovery Dive. The backward-compatible optional `bonusCompletions` ledger records each completed extra run's ID, activity, home-date key and completion time, atomically with the final checkpoint. Duplicate advancement cannot award another friend. Old v1 backups remain valid; no animals are guessed retroactively from old daily answers or completed extra checkpoints. A paused extra set resumes when the same type is selected, including after reload. Only one extra set is retained: selecting a different type replaces that checkpoint, but preserves all submitted attempts, earned neighbours and daily progress. Extra sets never earn daily stars or shark rewards; visual practice does not count as independent recall.

## Dates, streaks and assumptions

- Default home timezone is **Europe/Oslo**. All date keys are calendar dates in that timezone; DST never becomes an elapsed-24-hour rule.
- Today qualifies once only after all three tasks finish. Yesterday's current streak remains visible while today is incomplete. A missed date breaks the current streak, not the longest streak, collection or previous work.
- Answers are credited on submission. Crossing midnight while playing returns to today's fresh checklist with a notice; the earlier partial checkpoint stays on its own date.
- Offline clock changes cannot be reliably prevented without a server. Backward dates do not erase records or duplicate an already-issued date's reward; future dates do not extend today's streak.
- The first discoveries are curated (whale shark, epaulette shark, then Coral Comet); remaining entries use a persisted shuffle.
- Saved daily questions remain stable if parent focus settings change mid-day. New settings apply to new daily plans/extra-practice runs.
- Aquarium populations come from the saved bonus completion ledger, filtered by activity and home-date key. Each home date, explorer creation timestamp, activity and neighbour index seeds deterministic appearance, funny names and positions: different daily ecosystems, stable neighbours across reloads and backup restore. A new day starts empty aquariums without deleting earlier records or learning progress. Earlier days are not browsable; reefs do not model predator/prey or ecological realism. There is no game-imposed animal cap, but normal device storage and the existing 15 MB/100,000-attempt backup limits still apply.
- Parent port is intentionally lightweight, not a PIN/security boundary. No child account or personal-data transmission is implemented.
- Use a single active tab for the smoothest experience. A conflicting write from another tab is refused with a reload instruction, not silently merged.
- Independent accuracy reports unhinted first-attempt primary recall attempts with numerator/denominator. All other submissions are shown separately as supported/non-recall work. These heuristics are not validated educational assessment or proof of school-level mastery.

## GitHub Pages deployment

The app is configured for the case-sensitive repository subpath **`/Sharklication/`** in `vite.config.ts`, manifest start URL/scope, generated service worker and asset references. Hash navigation allows refreshing the album/settings without a static-host 404.

1. In this repository's **Settings → Pages**, select **GitHub Actions** as the build source.
2. Merge the app onto `main`, or run the workflow manually on `main`.
3. `.github/workflows/pages.yml` installs from the lockfile, runs unit/integration tests, builds/typechecks, runs Chromium browser tests, then uploads and deploys `dist`.
4. Read the actual deployed address from the successful deployment environment and verify it. The first release was deployed and HTTP-verified at **https://tofu-pup.github.io/Sharklication/**. Every subsequent release still needs its own successful workflow and live verification.

Pull requests run verification without publishing. The workflow uses only repository-scoped Pages/OIDC permissions at deployment time; there are no frontend credentials or provider keys.

If the repository name or hosting path changes, update `base`, manifest `start_url` and `scope`, and Workbox `navigateFallback` together, then rerun offline/subpath browser tests. Do not publish a dev server or source directory in place of `dist`.

## Architecture and future accounts

| File | Responsibility |
| --- | --- |
| `src/domain.ts` | Pure maths, daily plans, review records, dates/streaks, bounded corrections and idempotent rewards; inject clocks/randomness in tests |
| `src/catalog.ts`, `src/data/sharks.json`, `src/data/asset-manifest.json` | Data-driven species/fantasy content and local photo provenance |
| `src/validation.ts` | Versioned backup validation and migration boundary |
| `src/storage.ts` | `ProgressStorage` interface with transactional IndexedDB implementation and optimistic revision checking |
| `src/app.tsx`, `src/shark-art.tsx`, `src/styles.css` | Responsive screens, accessible number input and original fantasy art |
| `src/growing-reef.tsx`, `src/ocean-friends.ts`, `src/ocean-animal.tsx`, `src/nav-icon.tsx`, `src/use-auto-advance.ts` | Daily seeded aquariums, named animal artwork, illustrated navigation and cancellable feedback progression |
| `src/offline.ts`, `src/updates.ts`, `vite.config.ts` | Cached-asset readiness, foreground/reconnect update checks, safe activation policy and PWA generation |
| `scripts/` | Repeatable photo preparation, credit generation and asset validation |

A future authenticated adapter can implement/extend `ProgressStorage` and introduce parent/child IDs and conflict-resolution policy without moving arithmetic/reward logic into UI components. No Supabase, sign-in, sync, tokens or backend is currently included. Never treat an app-local ID as authenticated authority.

## Checks

```powershell
npm run typecheck
npm test
npm run build
npx playwright install chromium
npm run test:e2e
```

- Unit tests cover all 144 factor orientations for unambiguous missing multiples, valid strategy arithmetic, enabled-table selection, new-pair caps, weighted review, distinct-day Secure criteria, schedule intervals, assisted correction limits, extra-practice isolation, reward exhaustion, duplicate submissions, calendar/DST/clock rules, and backup rejection/round trips. Habitat tests cover empty unlocks, completed-set awards including corrections, atomic persistence failures, legacy backups, stable named neighbours, complete animal pools and populations beyond twelve. Browser tests cover waiting completed cards, all-three unlock, inline habitats, partial bonus resume, full-set celebrations, offline persistence, reduced motion and new-day reset. Timer tests cover feedback duration, busy/pause states, stale callbacks, hidden pages, iOS page lifecycle, cleanup and no implicit retries.
- Integration tests use fake IndexedDB for reload persistence, transaction/revision conflicts and failed-write preservation.
- Playwright runs against the production build at the repository subpath. It covers the complete loop in a chosen order, mid-task reload, reward persistence/idempotency, hints/reconstruction, offline completion and a genuine local photo, manifest paths, restore confirmation, corrupt import protection, midnight behavior, reduced-motion settings, phone/iPad-size overflow checks and absence of remote runtime requests.
- `build` also validates local image checksums, evidence/provenance metadata and output asset files.

### Honest remaining scope

- The PRD launch target is **40 real + 12 fantasy**. This build has **26 real + 12 fantasy**, so **14 more real species still need curated content and licensed/identified photos**. Megamouth, goblin, frilled, cookiecutter, angel and sawsharks are not yet included; do not advertise them as present.
- There is no shell currency or decoration shop. The owner instead selected daily growing reefs; extra practice remains fully available without currency.
- Feeding Time uses accessible equal groups and an array toggle, not a drag-and-drop puzzle or a complete progression curriculum. Fantasy illustrations have shared geometry; bespoke art remains a polish opportunity.
- Browser tests use Chromium with iPad-sized/touch layouts, **not physical iPad Safari or standalone testing**. Actual Safari VoiceOver, touch keyboard/audio behavior, portrait/landscape installation, cold standalone relaunch, storage eviction/quota behavior and app-update transitions still need manual device checks. Passing Chromium does not establish these.
- WCAG 2.2 AA is an aim, not a certification. Semantic controls, focus, keyboard input, minimum control sizes and motion preferences are implemented; a full manual accessibility/contrast review remains pending.
- The first release's hosted HTML, manifest, service worker and a real shark photo were HTTP-verified. Physical iPad behavior is not established by that check.
