# AZ-900 Trainer

## 1. What it is

AZ-900 Trainer is a local-first Vue 3 study app for the Microsoft Azure Fundamentals (AZ-900) exam: an
original question bank drilled in 10-question **Rounds** (Practice, Sprint, Review) that earn **XP**,
**Streaks** and **Levels**, plus a full timed exam simulation and weak-area analytics.

> Unofficial study aid. Not affiliated with or endorsed by Microsoft. All questions are original,
> written from the public AZ-900 study guide objectives.

The question bank was authored against **AZ-900 skills measured as of July 20, 2026**. Both lines are
shown in the app's footer on every page.

## 2. Features

- **Rounds** — Practice, Sprint and Review each draw up to 10 Questions (never-answered first, then
  least-recently-answered), answered one per screen, ended by a results page. Rounds are never resumed.
- **XP, Streak, Level** — a correct Answer earns 10 XP, +2 per consecutive correct Answer in the Round
  (capped at +10), +5 in a Sprint; exam Answers earn a flat 10. XP is stamped on each Answer when it is
  written (see [ADR-0005](docs/adr/0005-xp-is-stamped-on-each-answer.md)). Levels need 150 XP, then 50
  more each level. Best Streak and Level are read off the Answer log, never stored.
- **Sprint** — every Question runs against a 20-second Shot clock. A timeout records an incorrect Answer
  with whatever was picked, possibly nothing (see
  [ADR-0004](docs/adr/0004-sprint-timeout-is-an-incorrect-answer.md)).
- **Feedback timing** — Practice Rounds reveal after each Answer (default) or only on the results page.
  Sprint and Review always reveal. Remembered per device with the Domain chip, outside the progress file.
- **Weak areas** — a Topic is flagged weak once it has at least 4 Answers and accuracy below 70%; tapping a
  weak area starts a Practice Round on that Topic. That is the only way to a Topic Pool.
- **Review deck** — the Questions whose latest Answer was incorrect; one correct Answer clears each
  ([ADR-0001](docs/adr/0001-review-deck-is-binary-membership-not-spaced-repetition.md)).
- **Exam simulation** — unchanged 40-question, 45:00 exam with an Estimated score against the 700 pass
  line, reached from the strip under the mode cards; its score history lives on the exam setup screen.
- **Export / import / reset** — from the data row at the bottom of the dashboard. Preferences are not
  included and not reset.

## 3. Getting started

```sh
npm install
npm run dev
npm run test:unit -- --run
npm run build
```

`npm run dev` starts the Vite dev server. `npm run test:unit -- --run` runs the full Vitest suite once
(without watch mode). `npm run build` type-checks with `vue-tsc` and produces a production build.

## 4. How your data is stored

All progress lives in the browser's `localStorage`, under a single key
(`az900-trainer/progress/v1`) that is private to `src/repository/LocalStorageRepository.ts` — no other
module touches `localStorage` directly. This means progress does not follow you across devices or
browsers, and clearing site data erases it. "Export progress" and "Import progress" (see above) are the
safety net: export before clearing site data or switching browsers, then import to restore. See
[ADR-0002](docs/adr/0002-local-first-storage-behind-a-repository-seam.md) for why storage was built this
way.

Per-device preferences (Feedback timing, Domain chip) live under a second key,
`az900-trainer/preferences/v1`, also private to `LocalStorageRepository`. They are not exported and not
cleared by reset.

## 5. Editing the question bank

Questions live in `src/data/questions/`, one file per domain
(`cloud-concepts.ts`, `architecture-services.ts`, `management-governance.ts`), aggregated by
`src/data/questions/index.ts` (which also exports `STUDY_GUIDE_VERSION`, shown in the footer).

The structural validation suite in `src/data/__tests__/question-bank.spec.ts` enforces:

- at least 90 questions total, with an exact domain split of 25 / 34 / 31 across
  cloud-concepts / architecture-services / management-governance;
- an exact per-topic distribution across the eleven official Topics;
- unique, domain-prefixed IDs (`cc-###`, `arch-###`, `gov-###`);
- no duplicate stems;
- every Question's Topic belongs to its Domain;
- `single` Questions have exactly 4 options and 1 correct answer;
- `multi` Questions have at least 4 options, 2–3 correct answers, fewer correct than total options, and
  a stem stating "Select two"/"Select three" matching the correct count;
- unique option IDs (`a`–`e`) with every `correct` entry pointing to a real option;
- every option's explanation is at least 20 characters;
- any `learnMore` link points only to `learn.microsoft.com`;
- the per-domain `examQuestions` counts declared on `DOMAINS` in `src/data/types.ts` sum to 40.

New content gets a new ID — Question IDs are never reused for materially different content, because
Answers reference a Question's ID forever and a reused ID would corrupt historical analytics. Retire or
reword a question by giving it a fresh ID, not by rewriting an existing one in place. See
[ADR-0003](docs/adr/0003-dual-id-scheme-content-vs-runtime.md).

Run the suite after any edit:

```sh
npm run test:unit -- --run src/data
```

## 6. Adding Supabase

v1 ships with no backend — see
[ADR-0002](docs/adr/0002-local-first-storage-behind-a-repository-seam.md) — but the storage layer sits
behind a single `StudyRepository` interface (`src/repository/StudyRepository.ts`) specifically so a
Supabase adapter can be dropped in later without a data migration. To add one:

1. **Create a Supabase project** and note its project URL and anon key.
2. **Create `sessions` and `answers` tables** mirroring the shapes in `src/domain/entities.ts`:
   - `sessions`: `id` (uuid, primary key), `mode` (text: `exam` | `practice` | `sprint` | `review`),
     `status` (text: `in-progress` | `completed` | `expired`), `started_at` (timestamptz), `ended_at`
     (timestamptz, nullable), `exam` (jsonb, nullable — holds `{ deadline, questionIds, selections }`
     for exam Sessions).
   - `answers`: `id` (uuid, primary key), `session_id` (uuid, references `sessions.id`), `question_id`
     (text), `selected` (text[]), `correct` (boolean), `submitted_at` (timestamptz), `xp` (integer,
     nullable).
   All runtime IDs are already `crypto.randomUUID()` and all timestamps are already ISO-8601 UTC
   strings, so no format translation is needed between what the app produces today and these column
   types.
3. **Implement `StudyRepository`** in a new `SupabaseRepository` class (e.g.
   `src/repository/SupabaseRepository.ts`) backed by `@supabase/supabase-js`, implementing
   `getQuestions`, `getSessions`, `getSession`, `saveSession`, `saveAnswers`, `getAnswers`, and
   `replaceAll` against those tables. `getQuestions` can keep returning the static `questionBank` —
   only Sessions and Answers need to move server-side.
4. **Swap the export in `src/repository/index.ts`**, which currently reads:

   ```ts
   export const repository: StudyRepository = new LocalStorageRepository()
   ```

   Either replace `LocalStorageRepository` with `SupabaseRepository` outright, or choose between them at
   startup based on whether `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set, so local
   development without Supabase configured still falls back to local storage. No other file needs to
   change — stores and views only ever depend on the `StudyRepository` interface.
5. **Add authentication** (e.g. Supabase Auth) once the app is multi-user, and add an owner/user column
   to both tables — v1's schema and `StudyRepository` calls assume a single implicit user.
6. **Migrate existing local data**: use "Export progress" before switching repositories to download the
   current `localStorage` data as JSON, then use "Import progress" against the new Supabase-backed
   repository to load it in — `replaceAll` is the same call either way, so previously exported
   Sessions/Answers import cleanly once the swap is made.

## 7. Deliberately out of v1

Sound effects, confetti, daily goals or calendar streaks, Round history list, Topic picker, light theme,
flag-for-review, per-question timing stats, drag-drop/hot-area item types, PWA/offline manifest, spaced
repetition, Supabase sync, question-feedback workflow.
