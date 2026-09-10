# XP is stamped on each Answer, not derived and not kept as a running total

XP could have been a pure derivation of the Answer log (like every other analytic, per ADR-0002), a mutable running total next to the log (as the design mockup does), or a separate ledger of XP events. We store the XP an Answer earned on that Answer, at submission time. Total XP, Level and best Streak are then sums and scans over the log, so the Answer log stays the single source of truth and import, reset and a future synced backend need nothing new. What we gain over pure derivation is that earned XP never changes retroactively: retuning the formula affects future Answers only, and retiring a Question keeps the XP its Answers earned. We rejected running totals because a legacy progress file would import with a full Answer log and zero XP, two tiles contradicting each other on one screen. We rejected the ledger because nothing today awards XP for anything other than an Answer; if that changes, a ledger supersedes this.

## Consequences

- Answers from before this decision carry no XP field and count as zero; there is no backfill.
- The XP formula lives with the code that writes Answers, not with the code that reads them.
- Best Streak and Level are never stored.
