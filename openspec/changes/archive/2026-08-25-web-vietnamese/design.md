## Context

See proposal.md — Why. What shapes the approach:

- The tenant portal is already Vietnamese, with strings written inline. There is no translation library anywhere in the project.
- Roughly 11,000 lines of owner-facing frontend across eight features plus layout, components and navigation.
- The domain has a vocabulary the system is careful about: a cancelled tenancy and a finished one are deliberately different; a deposit *held* differs from the deposit *agreed*; a bill *voided* is kept while a cost *removed* is not.
- Comments in the code are English and explain reasoning, not user-facing text.

## Goals / Non-Goals

**Goals:**

- Every owner-facing string in Vietnamese.
- One word per concept, everywhere.
- Revenue figures that can be told apart on sight.

**Non-Goals:**

- A translation library, or a second language.
- Any change to behaviour, layout or logic.
- Translating code comments, or the API's messages.

## Decisions

**Inline strings, no i18n layer.**

An i18n library exists to hold two or more languages. There is one, and nobody has asked for another. Introducing key lookups now would put every string one indirection away from the screen that shows it, make the code harder to read, and buy nothing that is wanted today. The tenant portal already settled this convention by being written inline.

If a second language is ever needed, extracting inline strings is mechanical. Predicting it is not.

**The glossary is fixed before anything is translated.**

The risk in a translation of this size is not mistranslation, it is drift: `hợp đồng` on one screen, `hợp đồng thuê` on another, `hợp đồng cho thuê` on a third. Each is defensible alone; together they make a reader wonder what the difference is.

The words below are decided once and used everywhere:

| Concept | Vietnamese | Note |
|---|---|---|
| Building | Toà nhà | |
| Room | Phòng | |
| Customer / person | Khách | Not "khách hàng" — shorter, and these are tenants rather than buyers |
| Lease / tenancy | Hợp đồng | |
| Occupant | Người ở | Distinct from the person responsible |
| Tenant (responsible) | Người đứng tên | The one who signed |
| Invoice / bill | Hoá đơn | |
| Move-in invoice | Hoá đơn nhận phòng | |
| Monthly invoice | Hoá đơn hàng tháng | |
| Final invoice | Hoá đơn kết thúc | |
| Ad-hoc invoice | Hoá đơn phát sinh | |
| Deposit | Tiền cọc | |
| Deposit held | Cọc đang giữ | Distinct from the deposit agreed |
| Expense / cost | Chi phí | |
| Meter reading | Số điện | |
| Vacancy electricity | Điện phòng trống | |
| Void (an invoice) | Rút hoá đơn | Kept as a record — deliberately not "xoá" |
| Remove (an expense) | Xoá | Gone outright — the contrast with the row above is the point |
| Cancel (a tenancy) | Huỷ hợp đồng | Never took place |
| Move out | Trả phòng | Ended after being lived in |
| Retire (a room) | Ngừng sử dụng | |

**"Rút" for voiding and "xoá" for removing is deliberate.**

A voided invoice is kept as a record; a removed expense is gone. Using one word for both would teach an owner something true in one place and false in the other — the exact confusion the expenses screen already goes out of its way to prevent in English.

**Revenue figures are named by their question, not translated.**

`Settled` translated literally is as opaque as it was. So:

| English | Vietnamese | Why |
|---|---|---|
| Billed | Đã xuất hoá đơn | States the act it counts |
| Settled | Đã thu | Reads as a part of the above |
| Outstanding | Còn nợ | Reads as the other part |
| Received | Tiền thực nhận | "Thực" is what separates it from "đã thu" |
| Net | Còn lại sau chi phí | Says what was subtracted |

`Đã thu` and `Tiền thực nhận` are close enough to need the separation the screen already provides — different sections, each stating what it counts — and the word `thực` carries the distinction in the label itself.

**Nothing else changes in the same pass.**

A translation that also adjusts a layout or a condition produces a broken screen with two candidate causes. Every edit here replaces a string.

## Risks / Trade-offs

**A string is missed and one English label survives** → Caught by reading every screen at the end rather than by trusting the sweep, since a missed string is invisible to a typecheck.

**`Đã thu` and `Tiền thực nhận` are still close** → They are, and no pair of Vietnamese words makes an accrual/cash distinction self-evident. The separation is carried by the layout — which already puts them in different sections with an explanatory line — and the labels reinforce rather than replace it.

**Inline strings make a future second language expensive** → Accepted. Extracting them later is mechanical; building the machinery now for a language nobody has asked for is not.

## Migration Plan

None. No data, no API, no behaviour. Rollback is reverting the commit.
