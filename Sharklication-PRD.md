# Sharklication — Product Requirements & Copilot Build Brief

Version 1.1 · 20 October 2026 · Owner: J-K · Primary player: Lily, almost 10

## 1. Agent instruction

Build a working, polished web game from this specification, not a static mockup. Make reasonable implementation choices within this scope. Deliver runnable source, automated checks, deployment instructions, and an honest list of anything incomplete. Do not implement accounts or a backend in v1. Prioritize correct maths, durable progress, enjoyable practice, and iPad usability over extra features.

## 2. Product purpose

Sharklication helps Lily develop multiplication understanding and independent recall so she can progress to division and more advanced maths. She completes short underwater expeditions and collects real and imaginary sharks. She knows many shark species: respect that expertise with a broad, interesting collection, accurate information, and recognizable species.

Success means she willingly returns, completes meaningful practice, and recalls previously difficult facts on later days. Rewards and time spent alone are not evidence of learning.

## 3. Agreed requirements and implementation defaults

Agreed: name Sharklication; quirky, fun underwater world; whale shark logo mascot; real species use genuine photographs; fantasy sharks use drawings; three daily activity types; all three required to advance a daily streak; personal iPad PWA first; future multi-user sign-in possible.

Defaults proposed by this PRD: English UI; multiplication factors 1–10 initially, optional 11–12; no countdown; roughly 5–8 minutes per daily set; GitHub Pages deployment; local progress; no automatic streak freezes in v1. Keep content and numeric defaults configurable without redesigning the app. The learning algorithm is a practical starting heuristic, not a validated assessment instrument.

## 4. Scope

### Required for v1

- Home sanctuary showing collected sharks and today's three-task checklist.
- Reef Trail: skip counting and missing multiples.
- Feeding Time: equal groups, arrays, and visual multiplication puzzles.
- Discovery Dive: mixed multiplication recall with adaptive review.
- Daily completion, streak, collection rewards, and optional extra practice.
- Shark collection album and species detail pages.
- Offline-capable, installable iPad PWA with local persistence.
- Lightweight parent settings, progress summary, backup export/import.
- Responsive, touch-friendly design with accessible motion and sound controls.

### Later

Google sign-in, parent-owned accounts with child profiles, cross-device syncing, broader maths and division activities, additional habitats and sharks. No public profiles, social features, chat, payments, ads, or leaderboards in v1.

## 5. Main experience

First launch: welcome Lily, introduce the whale shark guide, offer an optional brief practice sample, then open the sanctuary. Do not require a test or account. Let a parent select focus tables; otherwise start with a gentle mixture from 2, 5, and 10 and unlock broader coverage as she succeeds. A parent can immediately enable harder tables.

Daily return: show three clearly labeled destinations, current completion, streak, next discovery, and a prominent Continue button. Resume unfinished work after closing the app. The child can choose activity order. Finishing one task fills one of three daily stars. Only finishing all three completes the day, advances the streak once, and grants the daily shark discovery. Provide a satisfying, skippable celebration.

Owner-directed refinement: the three activity cards are the day's checklist. Remove the large start/continue hero banner. Unfinished cards start/resume their daily set; completed cards are ticked and cannot be replayed until all three daily activities are complete. Only then extend those same cards with a habitat and "Do more to grow your habitat" action for extra practice of that type. No separate growing-reef section or duplicate aquarium cards. Remove the separate Free Swim screen/navigation and its chooser. Automatically select suitable questions without a child-facing weak/mixed/table menu. Parent focus-table controls remain available. Use illustrated My ocean/Shark album icons.

After a correct answer, show encouraging feedback then advance automatically, including task completion. Allow immediate continuation and pausing automatic progression for reading/accessibility. Do not advance hidden pages or after a failed save; cancel stale timers when leaving/changing questions.

Wrong answers: keep tone neutral and encouraging; offer a useful hint and another attempt. Never remove sharks, points, or task progress. Completing corrections counts toward task completion; hinted answers do not count as independent recall.

## 6. Activities

| Activity | Default daily size | Interaction and progression | Completion |
| --- | --- | --- | --- |
| Reef Trail | 6 prompts | Tap or enter the next multiple, fill gaps, then start midway through a sequence. Example: 18, 24, __, 36. Explicitly connect the third jump of 6 to 3 × 6 = 18. | Resolve all prompts, with hints allowed. |
| Feeding Time | 3 puzzles | Show equal groups and arrays. Example: 4 sharks receive 6 fish each; arrange/count groups and connect to 4 × 6 = 24. Include equivalent arrangements and simple known-fact strategies. | Resolve all puzzles; show the matching equation. |
| Discovery Dive | 10 primary questions | Enter answers to mixed multiplication facts using a large in-app number pad. Retry missed facts after intervening questions. Choices are a hint, not the default. | Answer all primary questions and work through required corrections. |

Puzzle counts are defaults, not a speed target. Keep daily work bounded: allow at most 3 delayed correction questions in the mixed dive. If a fact remains difficult after two attempts, show a worked visual explanation, then an assisted reconstruction. Mark it for future review; do not trap Lily in an endless retry loop. Allow pause and resume at any point. Avoid asking her to drag dozens of fish; provide tap controls and an accessible alternative to dragging.

Strategy hints should teach relationships, for example 7 × 8 = (5 × 8) + (2 × 8) = 40 + 16, or 6 × 4 = double 3 × 4. Check every example programmatically. Missing-factor puzzles may be included as a bridge to division, but a full division mode is later scope.

## 7. Learning and review engine

- Track individual facts separately from task completion and collection progress.
- Generate valid integer questions from enabled tables; avoid accidental ambiguity and malformed sequences.
- Use most questions for enabled focus facts and due reviews, plus easier familiar facts. Initial weighting: 60% due/weak, 25% current focus, 15% familiar; redistribute when a pool is empty.
- Introduce at most 3 unseen fact pairs per daily set by default after the first practice day. Owner-approved adjustment during implementation: the first day uses a varied mix from the enabled starter tables instead of repeating only three pairs. This exposure does not imply mastery. Rotate available facts before repeating and avoid consecutive identical answers when alternatives exist. Treat a × b and b × a as related for coverage, but record performance for each orientation.
- Track first-attempt correctness, hints, corrections, date, and activity type. Skip-counting success must not automatically establish independent multiplication recall.
- Suggested review intervals after independent successful recall: 1, 3, 7, then 14 days. An incorrect or assisted response marks the fact for the next session and, when practical, after 2–4 intervening questions in the current session.
- Label a fact Secure after independent correct recall in the mixed dive on at least 3 distinct days with the latest two assessed attempts independently correct. Errors move it back to Practising. Use child-friendly labels New / Practising / Secure and explain the heuristic in parent settings.
- Do not infer mastery from speed alone. Response times can be retained locally for future tuning but are not required in v1.
- Allow extra practice targeted to weak facts, any enabled table, or a mixed set. Do not allow a missed day or shark reward to alter maths assessment.
- Extra practice is reached directly from each completed daily activity card, without a separate picker. Adaptation chooses review/focus questions automatically; parents configure enabled tables.

Parent summary: show coverage by table, facts needing review, independent first-attempt accuracy with sample counts, and completed practice days. Distinguish assisted completion from independent answers. No claims that an app score proves school-level mastery.

## 8. Daily checklist and streak rules

The daily streak is explicitly retained. A day qualifies only when Reef Trail, Feeding Time, and Discovery Dive are all complete for that date.

- Store date keys in a configured home timezone, initially Europe/Oslo, using calendar dates rather than elapsed 24-hour periods or UTC dates.
- On today's first full completion: extend a run completed yesterday, otherwise begin at 1. Update longest streak. Repeated completions cannot extend it again.
- Partial completion persists but does not qualify the day or grant its daily reward.
- If yesterday qualified and today is incomplete, display the existing streak with 'Complete today to keep it going.' If yesterday did not qualify, an older run is no longer current. Preserve longest streak and all collection progress.
- At midnight, start a new checklist. Keep the prior day's partial record. Answers are credited to the date they are submitted; show a gentle day-change notice and restart the activity for the new day. Never silently transfer yesterday's completion into today.
- Do not add streak freezes or rest-day passes without a future product decision. Missing a day never deletes sharks or lifetime achievements.
- Persist task completion and reward issuance atomically. Refreshing, double tapping, importing, or reopening cannot duplicate the daily reward.
- Offline clock changes cannot be fully prevented without a server; handle backward dates without destructive resets and document that limitation. No intrusive anti-cheat system.

## 9. Shark collection and rewards

Daily completion earns one previously uncollected shark while entries remain. Use a persisted shuffled reward order with a curated appealing starter pool. Make the first few discoveries include a whale shark and an interesting lesser-known species; mix fantasy discoveries into the sequence. Reveal rewards only after qualifying completion. Display a progress preview without pressuring a purchase or long session.

Target launch collection: 40 real species and 12 clearly imaginary sharks. This is a bounded launch target, not a claim to include all shark species. Build a data-driven catalog so hundreds can be added without code changes. Cover a mix of familiar and less familiar species, such as whale, basking, megamouth, goblin, frilled, cookiecutter, epaulette, zebra, angel, sawsharks, and hammerheads. Resolve broad group names to specific verified species in the actual catalog.

Real species cards MUST use genuine, correctly identified photographs with suitable reuse rights. Never substitute AI-generated photorealistic sharks, drawings, or another species. Download permitted assets into the project rather than relying on hotlinks. Record photographer, source URL, license, attribution requirements, and verification source. Include common and scientific names, 2–3 short verified facts, habitat, and approximate adult size with units and qualification. Do not invent facts to fill the catalog. Avoid conservation claims unless sourced and dated.

Owner-directed content expansion: retain detailed child-friendly descriptions and provide substantially more learning material on every detail page. The current 26 real species each have two substantial description paragraphs and 15 independently written sourced facts; each of the 12 fantasy sharks has eight explicitly imaginary curiosities, never presented as science. The twenty added species have local licensed or public-domain living-animal photographs and individual attribution. Existing v1 discovery order, collected sharks and progress remain intact; append the twenty new IDs without reshuffling old saves. The broader 40-real-species launch target remains incomplete.

Fantasy cards MUST use illustrations with an explicit Fantasy badge and playful invented descriptions clearly separated from scientific facts. Real cards get a Real species badge. Visual distinction must work without relying on color alone. Cartoon mascots and the logo are allowed outside documentary species imagery.

If a correctly licensed photograph is unavailable, keep that entry out of the unlockable pool; show an honest neutral placeholder only in a development catalog. Report missing assets and reduced launch counts. Never represent a placeholder build as meeting the full catalog target.

Owner-selected replacement for a shell economy: once all three tasks are complete, each existing activity card reveals an empty bonus aquarium: coral reef for Reef Trail, seagrass meadow for Feeding Time, kelp forest for Discovery Dive. Daily questions never add animals. An empty scene invites the child to finish a full extra-practice set of that activity; completing the entire set (including queued corrections) adds exactly one neighbour. Hints and retries are welcome. Celebrate the arrival with an enlarged illustration and a funny name, stable across reload/backup. Include a varied habitat-appropriate pool, including giant coral, sponges, jellyfish and lobsters as well as swimmers. Never prefill empty scenes with decorative animal coral/sponges. Keep every earned neighbour together in an expanding, scrollable aquarium, without a population cap or 12-resident rollover. Randomize each day's ecosystem with stable layouts across reloads, gently swimming animals and swaying plants. A new home-date starts empty scenes; previous learning and completion records remain saved. Old v1 saves remain valid, with no guessed retroactive animal awards. Remove per-habitat "Pause reef motion" links; retain system and Parent port reduced-motion controls. This is decorative engagement, not proof of recall and never required for the daily streak. Sharks cannot be lost. When the collection is complete, daily completion earns a celebration badge rather than duplicate sharks.

## 10. Art direction and interface

Quirky, joyful underwater expedition world suitable for a shark-savvy ten-year-old, not a toddler UI. Ocean turquoise and navy, coral and warm yellow accents; chunky readable headings; expressive guide; bubbles, seaweed, tiny unexpected creatures. Make the sanctuary feel inhabited, with restrained ambient movement. Maths screens are calmer and high contrast; answer controls remain visually dominant.

The approved direction uses a cartoon whale shark logo: rounded broad head and distinctive pale spots, not a hammerhead. Supplied logo asset is separate from this document; request it if absent. Do not fabricate an approval of a replacement. A text wordmark is an acceptable temporary implementation asset, clearly disclosed.

The game's whale-shark mascot is **Gobfrey**, the owner's chosen name inspired by Gobfrey Whale Shark. Use the owner-supplied illustrations, not third-party toy artwork. Gobfrey communicates as a warm, reassuring companion for children: introduce adventures, suggest strategies, welcome mistakes as learning and celebrate effort without pressure. He is an illustrated guide, separate from real-species collection photographs. The latest supplied transparent wordmark is the top-left home link. Feeding Time uses friendly original cartoon sharks and fish to make every equal group visually countable.

Use the supplied teacher Gobfrey illustration (glasses and pencil), optimized locally, in the "A little help from Gobfrey" sidebars.

Screens: welcome, sanctuary/daily checklist with extra-practice actions and growing reefs, each of 3 activities, daily celebration/reveal, collection grid, shark detail, parent settings/summary. Support portrait and landscape iPads plus narrower phones and desktop. No hover-only interactions. Avoid long text during play. Use encouraging specific feedback and restrained sound, off by default, with persistent mute and reduced-motion options. Honor system reduced-motion settings.

## 11. Technical design

Recommended default: React + TypeScript + Vite, static build, PWA manifest and service worker, IndexedDB persistence behind a storage interface. Choose maintained compatible package versions at implementation time. No server needed for v1; GitHub Pages serves the app while JavaScript handles interaction and local progress. Configure the repository subpath correctly for assets, manifest, service-worker scope, and navigation. Use hash routing or a tested static-host navigation strategy.

Keep learning logic, reward logic, dates, and persistence separate from UI components. Use versioned schemas and migrations. A future authenticated cloud adapter should replace/extend local storage without rewriting activities. A future backend such as Supabase can provide auth and per-user data while static hosting remains possible; neither provider integration nor keys belong in v1.

Suggested records:

- Profile: local ID, display name, createdAt, homeTimezone, enabled tables, settings.
- FactProgress: factors, independent attempts/correct answers, assisted attempts, recent assessed outcomes, successful distinct dates, next review, learning state.
- Attempt: ID, timestamp, local date, fact/puzzle ID, activity, submitted answer, correctness, hint usage, first attempt/assisted status.
- DailyProgress: date key, activity checkpoints and completion flags, completedAt, reward ID.
- Collection: catalog shark ID, unlockedAt, source reward ID.
- Catalog: stable ID, real/fantasy discriminator, names, content, image path, provenance/license, verification references.
- SaveEnvelope: schemaVersion, profile, progress, attempts, collection, reward order, settings.

Store streak source records and derive current/longest streak consistently; cache only with validation. Use stable attempt IDs to avoid duplicate submissions. Never expose secrets in client code or commit personal progress to GitHub.

## 12. PWA, persistence, and recovery

- HTTPS-hosted installable app with name, suitable app icons, standalone display, launch URL, and theme colors. Give concise Safari Share → Add to Home Screen instructions; do not depend on a browser install prompt.
- After initial online preparation, all three daily activities, saved progress, logo/UI, and unlocked shark details/photos must work offline. Precache the modest UI/content set; queue/cache collection images with an explicit 'Offline ready' state only after required assets are cached. If storage is insufficient, preserve progress, explain the asset limitation, and offer retry.
- Download/caching failure must not block maths practice or replace a wildlife photo with invented imagery.
- Cache versioning and app updates must preserve IndexedDB saves. Offer updates between activities rather than forcibly reloading an active question.
- Progress must survive reload and standalone app restart in the supported context. Browser storage can be cleared or evicted; do not promise permanent backup. Do not assume Safari and the installed app share all storage contexts; include backup/restore guidance.
- Parent export produces a versioned JSON backup. Import validates structure, bounds, catalog IDs, and schema compatibility before replacing data. Show a preview and request confirmation before replacing existing progress. Invalid import leaves current data untouched. Reset requires explicit confirmation.
- No external analytics, sign-in, advertising, or personal-data transmission in v1. All player data remains on device except parent-initiated export. Self-host permitted assets/fonts.

## 13. Accessibility and performance

Aim for WCAG 2.2 AA: semantic controls, keyboard support, visible focus, readable contrast, screen-reader equation labels, and non-color progress indicators. Touch controls at least 44 × 44 CSS pixels, comfortable spacing, legible text. Avoid flashes and unavoidable timers. Keep animations light on iPad; compress photographic assets and avoid huge initial image downloads. Lazy-load locked species images and prioritize offline availability for unlocked content. Show loading/error/retry states without losing answers.

## 14. Acceptance tests

1. Complete activities in any order; 1 or 2 do not qualify the day, 3 qualify once and grant exactly one shark.
2. Reload mid-task and restart the installed app: submitted work, settings, collection, and checkpoints persist.
3. Wrong answers trigger accurate hints/corrections, allow completion, and never count as independent success or remove rewards.
4. Across simulated dates, review scheduling and Secure criteria work; sequence questions do not falsely establish direct recall.
5. Yesterday/today completion, a missed day, DST, timezone boundaries, midnight during play, repeated submissions, and backward clock changes produce documented streak behavior without duplicated rewards.
6. With network disabled after offline readiness, complete a daily set and view unlocked species photos and facts. Verify actual iPad standalone behavior manually where available.
7. Under a GitHub Pages repository subpath, fresh load, refresh, routing, assets, installation paths, and service-worker scope work.
8. Import/export round trip preserves progress; corrupt or unsupported backups leave data intact; migration and app updates preserve saves.
9. Every unlockable real species has a genuine matching licensed photo, attribution, scientific name, and fact references. Every fantasy entry is illustrated and labeled.
10. Collection reveal and reward survive interrupted writes, refresh, repeated completion, and an exhausted catalog without duplication or data loss.
11. Touch, keyboard, portrait/landscape, reduced motion, sound settings, and accessible answer entry work. Confirm no horizontal overflow on typical iPad sizes.
12. No backend credentials, player save files, ads, trackers, or live-account dependencies in the public repo.

Use unit tests for pure learning, date/streak, reward, validation and migration logic; integration tests for persistence and daily completion; browser tests for critical flows. Inject clock/randomness for reproducible tests. Report manual iPad checks as pending if no physical device is available. Run type checking, production build, and appropriate automated tests; fix failures before handoff.

## 15. Implementation sequence and delivery

1. Scaffold static app, data types, storage, date utilities, and test harness.
2. Implement one complete daily loop across all 3 activities, persistence, streak, and reward with a small verified catalog.
3. Add adaptive review, parent settings, progress summary, backup/import, and failure handling.
4. Expand and verify collection assets; apply polished underwater visuals and supplied whale-shark logo.
5. Complete offline/install experience, accessibility, tests, deployment workflow, and README.

Deliver source in the GitHub repository, this PRD, README with local commands and Pages configuration, asset credits, content provenance, automated tests, and deployment workflow. Explain versioned saves and future account integration boundaries. Summarize implemented features, exact catalog counts, tests run/results, remaining gaps, and required manual device checks. Prepare deployment configuration; do not claim a live URL or successful deployment until verified.

## 16. Reference material

These sources informed the approach, not a guarantee of this game's learning outcomes:

- NCETM, whole-school times-table approach: https://www.ncetm.org.uk/features/whole-school-approach-to-learning-times-tables/
- NCETM, multiplication and division mastery materials: https://www.ncetm.org.uk/teaching-for-mastery/mastery-materials/primary-mastery-professional-development/multiplication-and-division/
- GitHub Pages overview: https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages
- Future backend example, Supabase row-level security: https://supabase.com/docs/guides/database/postgres/row-level-security

## 17. Suggested Copilot kickoff prompt

Read Sharklication-PRD.md and implement v1 in this repository. Start by inspecting existing files and instructions. Follow the implementation sequence, deliver a working end-to-end game, and make reasonable choices without expanding scope. Use genuine licensed photographs for real species and labeled illustrations for fantasy sharks. Keep v1 static and local-first, installable and offline-capable on iPad, with all three daily tasks required for a streak day. Verify maths, persistence, streak boundaries, reward idempotency, and repository-subpath deployment. Run the required checks and report exact results and remaining gaps. Do not replace functionality with static mockups or claim missing assets or untested device behavior are complete.

## 18. Free shark photograph sourcing — required agent workflow

Use Wikimedia Commons as the primary source and NOAA as a secondary source. Free-to-view is not sufficient: each individual asset must have verified reuse rights. This workflow supplements section 9 and is required for launch assets.

### Sources and license policy

- Wikimedia Commons: https://commons.wikimedia.org/ — search using the exact scientific species name as well as common names. Inspect the individual File page; licenses vary per file. Prefer CC0/public-domain or CC BY photographs. CC BY-SA is acceptable when its attribution and share-alike requirements for adaptations are followed; do not imply that using one photo automatically changes the app code license.
- NOAA Fisheries and NOAA Digital Photo Collections: https://www.fisheries.noaa.gov/photo-gallery and https://www.noaa.gov/noaa-collections/collections/photo-library — prefer clearly identified NOAA-created public-domain material. NOAA pages can include third-party work: verify the individual credit and rights rather than assuming everything on a .gov site is free.
- Do not scrape Google Images or use arbitrary aquarium, newspaper, stock-site, social-media, or research-paper photos without a suitable explicit license. Exclude noncommercial-only, no-derivatives, fair-use-only, and unclear-rights assets from the v1 sourcing policy so future public use remains straightforward.

### Acquisition and verification

1. Build a candidate catalog containing stable ID, common name and scientific name. Search by scientific name first for obscure species.
2. Use Commons file pages or its documented API to discover candidates and retrieve file metadata. Respect the provider's current API/access rules; use a descriptive User-Agent where supported, modest concurrency, retries and backoff. Do this during asset preparation, not at app runtime. No API key or external image search is needed during gameplay.
3. Verify that the image is an actual photograph, depicts the exact species, and has a credible identification. Check file description and original source; corroborate questionable identification with a trusted species reference. Reject generic “shark” labels, AI images and mismatched species. Favor clear live-animal photos; avoid distressing fishing, injury or dissection imagery for this child-facing game.
4. Inspect the asset-specific rights. Record the exact license name/version, license URL, creator/required credit, original source and file page. Preserve any required notices and indicate modifications. Do not fabricate metadata or infer a license from the surrounding website.
5. Download the authorized image into the repository, with a stable local filename. Keep a reasonably sized source or reproducible acquisition record; produce optimized local WebP/JPEG display sizes without obscuring diagnostic species features. Record cropping/resizing/re-encoding and satisfy any adaptation obligations.
6. Record review status and provenance in a checked-in asset manifest. Minimum fields: sharkId, scientificName, localPath, sourcePageUrl, originalFileUrl, creator, creditLine, licenseId, licenseUrl, rightsEvidence, accessedDate, modifications, identificationReference, verificationStatus. Record verified pixel dimensions and file checksum where practical.
7. Generate ASSET-CREDITS.md from the manifest and show accessible photo attribution on the shark detail page, including photographer, source link, license name/link and modification notice. Include a Credits screen. Keep attribution text available offline; external links may require a connection.
8. Add validation that fails if an unlockable real species lacks a local photo, verified status or required provenance/license metadata. Test that the local asset resolves under the GitHub Pages repository subpath. Do not treat a populated metadata field as proof that manual identification/license review happened.
9. If no suitable image can be verified, omit the species from the unlockable pool and report it as missing. Start with a smaller verified catalog and expand toward 40 real species; never fill gaps with another species or generated wildlife.

Provide a repeatable asset preparation script or documented procedure. Avoid downloading a huge collection at first launch. Bundle a small starter image set, cache unlocked images for offline use, and expose offline readiness honestly. Host all permitted display images locally rather than hotlinking providers.

Fantasy sharks remain original illustrations, explicitly labeled Fantasy. The approved cartoon whale shark logo is a mascot, not a documentary species photograph.

### Source policy references

- Commons reuse guidance: https://commons.wikimedia.org/wiki/Commons:Reusing_content_outside_Wikimedia
- Commons license guidance: https://commons.wikimedia.org/wiki/Commons:Reusing_content_outside_Wikimedia/licenses
- Wikimedia access policy: https://www.mediawiki.org/wiki/Wikimedia_APIs/Access_policy
- NOAA Fisheries rights policy: https://www.fisheries.noaa.gov/website-policies-and-disclaimers

### Additional Copilot kickoff instruction

Source real-shark photographs primarily from Wikimedia Commons, with verified NOAA public-domain photos as a backup. Follow section 18: inspect each file's exact license and species identification, download permitted assets into the project, maintain the provenance manifest, generate credits, and show attribution in the app. Never substitute AI wildlife photos or unlicensed search results. Report the exact number of fully verified species and any image gaps.
