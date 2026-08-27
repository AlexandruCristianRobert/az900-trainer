# AZ-900 Trainer

## 1. What it is

AZ-900 Trainer is a local-first Vue 3 study app for the Microsoft Azure Fundamentals (AZ-900) exam: an
original question bank, practiced through a timed exam simulation, per-domain/per-topic practice with
instant feedback, a review deck of previously missed questions, and weak-area analytics.

> Unofficial study aid. Not affiliated with or endorsed by Microsoft. All questions are original,
> written from the public AZ-900 study guide objectives.

The question bank was authored against **AZ-900 skills measured as of July 20, 2026**. Both lines are
shown in the app's footer on every page.

## 2. Features

- **Exam simulation** — a fixed 40-question, 45:00 timed exam (domain split 12/15/13, sampled
  least-recently-answered-first per domain, no repeats within a session). Results show an **Estimated
  score** (`round(1000 × correct / 40)`) against the 700 pass line, always captioned as an estimate
  since Microsoft's real scaled-scoring model is unpublished.
- **Practice by domain/topic** — filter Questions by Domain or Topic, submit one at a time, and see
  instant grading with a per-option explanation for every choice.
- **Review deck** — the set of Questions whose latest Answer (in any mode) was incorrect. Membership is
  binary, not spaced repetition: one correct Answer removes a Question, one incorrect Answer readds it.
  See [ADR-0001](docs/adr/0001-review-deck-is-binary-membership-not-spaced-repetition.md).
- **Weak-area analytics** — a Topic is flagged weak once it has at least 4 submitted Answers and
  accuracy below 70%; with fewer than 4 Answers a Topic shows "not enough data" rather than a verdict.
- **Export / import / reset** — from the dashboard's data section: "Export progress" downloads all
  Sessions and Answers as JSON, "Import progress" replaces current data from a chosen file, and "Reset
  all progress" clears Sessions and Answers (never Questions) after a confirm step.

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
   - `sessions`: `id` (uuid, primary key), `mode` (text: `exam` | `practice` | `review`), `status`
     (text: `in-progress` | `completed` | `expired`), `started_at` (timestamptz), `ended_at`
     (timestamptz, nullable), `exam` (jsonb, nullable — holds `{ deadline, questionIds, selections }`
     for exam Sessions).
   - `answers`: `id` (uuid, primary key), `session_id` (uuid, references `sessions.id`), `question_id`
     (text), `selected` (text[]), `correct` (boolean), `submitted_at` (timestamptz).
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

flag-for-review, per-question timing stats, drag-drop/hot-area item types, PWA/offline manifest, spaced
repetition, Supabase sync, question-feedback workflow.
