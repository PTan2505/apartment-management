# Tasks

## 1. Capture the baseline

- [x] 1.1 Before touching anything, generate invoices covering the cases that matter — a full month, a month a lease began partway through, a month a tenancy ended in, and a lease carrying service fees — and record every charge, every line and every total. This is what "no amount changes" is measured against. **Captured**: full month 3,375,000; mid-month start 1,929,838; tenancy ending mid-month 2,136,291; with a service fee 3,575,000.
- [x] 1.2 Record the current duplicate behaviour: a second invoice for a lease and month is refused, and a voided one frees the month again.

## 2. Kind and issue date

- [x] 2.1 Add an invoice kind to `schema.prisma` carrying all four values from the start — move-in, monthly, final, overdue — so the next change adds no enum migration.
- [x] 2.2 Add the issue date as its own column rather than deriving it from `createdAt`. The two coincide today and are not the same fact: one is a record-keeping timestamp, the other is a business date that must be settable.
- [x] 2.3 Backfill every existing invoice as monthly, issued on the date it was created — which is what each of them is.
- [x] 2.4 Narrow the partial unique index to monthly invoices. Do **not** add the kind to the key: one move-in per lease and one final per tenancy are not month-shaped rules and will need their own guards.
- [x] 2.5 Apply the migration and run `prisma generate`.

## 3. Generation

- [x] 3.1 Record the kind as monthly at generation. Do not accept it as input — the kind is decided by which operation issued the invoice.
- [x] 3.2 Accept an optional issue date, defaulting to the moment of creation.
- [x] 3.3 Report both fields wherever an invoice is returned. Check every return site rather than assuming the shared include covers them.
- [x] 3.4 Leave the charge calculation untouched.
- [x] 3.5 Run `tsc --noEmit`.

## 4. Verification against the running API

- [x] 4.1 **Regenerate the task 1.1 invoices from the same inputs and compare every charge, line and total.** Equal to the currency unit. Compare each charge individually, not only the totals — three wrong charges can sum to a right total. **Result**: all four reproduced every charge, line, period and meter reading exactly.
- [x] 4.2 A generated invoice reports its kind as monthly.
- [x] 4.3 A generated invoice reports an issue date, and it defaults to now when not supplied.
- [x] 4.4 Supplying an issue date records it, while the invoice still covers the month asked for — the late-billing case.
- [x] 4.5 A second monthly invoice for the same lease and month is still refused with 409.
- [x] 4.6 Voiding an invoice still frees its month for a replacement.
- [x] 4.7 Two leases occupying one room in the same month can each still be invoiced.
- [x] 4.8 Confirm generation does not accept a kind as input.
- [x] 4.9 Confirm the revenue report and the electricity chain are unchanged and needed no edit.
- [x] 4.10 Remove the verification data, leaving the database as it was found.
