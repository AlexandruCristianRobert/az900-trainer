# Local-first storage behind a repository seam (no Supabase in v1)

The original request named "Vue and Supabase if necessary." v1 ships with no backend: all study data persists in localStorage through a single async `StudyRepository` interface with exactly one implementation (`LocalStorageRepository`). A backend requires account creation and project keys before the app is usable at all, while a fundamentals-exam study app is single-user and must work the moment it loads; cross-device sync is the only real loss.

The seam is kept honest so a Supabase adapter can be added without data migration pain:

- No code outside `LocalStorageRepository` touches localStorage; the storage key is private to that module.
- All runtime entity IDs are `crypto.randomUUID()` — no autoincrement, no timestamp keys.
- All timestamps are ISO-8601 UTC strings.
- Analytics are pure derivations of the Answer log — nothing denormalized to storage that a server would have to reconcile.

The README's "Adding Supabase" section records the concrete swap steps.

## Consequences

- Progress does not follow the user across devices/browsers in v1, and clearing site data erases it.
- Adding Supabase means implementing `StudyRepository` against tables mirroring Session/Answer, plus auth — no changes to stores or views.
