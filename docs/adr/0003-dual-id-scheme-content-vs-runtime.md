# Dual ID scheme: human-readable IDs for content, UUIDs for runtime entities

Questions carry stable, human-readable IDs (`cc-001`, `arch-014`, `gov-031`) while runtime entities (Session, Answer) use `crypto.randomUUID()`. Two schemes in one codebase looks inconsistent, but they serve different masters: Questions are hand-edited content whose IDs are referenced by Answers forever and must be greppable and reviewable in a diff; Sessions and Answers are machine-generated data that must merge safely into a future synced backend (ADR-0002).

Because content is editable while Answers are immutable, an Answer may reference a Question that was reworded out of existence. Analytics skip such dangling Answers and the review deck drops them — never crash, never count ghosts.

## Consequences

- Deleting or renaming a Question silently sheds its historical Answers from analytics; acceptable at this scale, and preferable to freezing bad content.
- Question IDs are never reused for different content — a materially changed question gets a new ID.
