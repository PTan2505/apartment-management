# Tasks

## 1. Labelling

- [x] 1.1 Rebuild `rent`, `electricity` and `water` labels from the line's own kind, quantity and period. They read the figures, so the label cannot drift from them.
- [x] 1.2 Show `serviceFee` and `charge` exactly as stored. That text is what a PERSON wrote — the owner's own catalogue name, or their sentence about a broken window — and rewording it would be rewriting their words, most likely into the language they already used.
- [x] 1.3 Match the four `deposit` phrases individually: charged at move-in, topped up at renewal, handed back at renewal, kept at cancellation. Collapsing them loses a real distinction — one of them is a NEGATIVE amount, and "Tiền cọc" over a negative figure explains nothing.
- [x] 1.4 Match EXACTLY and only on `deposit` lines. A prefix match would eventually catch an owner-written charge starting with the same word; a `charge` line reading "Deposit returned to Mr Nam by hand" is the owner's sentence and stays untouched.
- [x] 1.5 Fall through to the stored text for anything unrecognised. The failure then reads as English on a Vietnamese screen — today's behaviour — rather than a confident wrong label.

## 2. Using it

- [x] 2.1 The invoice detail's charge table uses the labels.
- [x] 2.2 Leave the quantity-and-rate column alone; it renders from numeric fields and is already language-neutral.
- [x] 2.3 Typecheck and build.

## 3. Verification

- [x] 3.1 A monthly invoice: rent, electricity and water read in Vietnamese, carrying the same quantity and period as the stored text did.
- [x] 3.2 **The figures are untouched** — the amounts and the total are identical to what the API returned.
- [x] 3.3 A move-in invoice: the deposit line names the deposit and its months.
- [x] 3.4 A cancellation that keeps part of a deposit: that line is named as an amount kept. FOUND HERE: it is a `charge` line, not a `deposit` one — the kind is a proxy for who wrote the text and this is where the proxy fails.
- [x] 3.5 A renewal that hands part of a deposit back: named as a return, and the negative figure has an explanation beside it.
- [x] 3.6 An ad-hoc charge the owner wrote: shown exactly as typed, not reworded.
- [x] 3.7 A service fee: shown under the owner's own catalogue name.
- [x] 3.8 **An unrecognised deposit phrase falls through to its stored text** rather than being mislabelled — checked by feeding one that does not match.
- [x] 3.9 **Nothing stored changed**: the API returns the same descriptions it did before.
- [x] 3.10 On the screen at phone width.
- [x] 3.11 Remove the verification data.
