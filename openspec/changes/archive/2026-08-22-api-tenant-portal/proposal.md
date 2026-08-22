## Why

A tenant has no way to see their own bill. Everything this system records about what they owe — the meter readings, the rate applied, the days prorated, the service fees — is visible only to the owner, who reads the total down the phone or sends a photograph. The tenant cannot check the arithmetic they are being asked to trust, and cannot see what they still owe from earlier months.

Every account in the system belongs to an owner. A tenant is a `customer` record with no password and no login, deliberately: giving each of them an account to manage is a burden on the owner, and a password is one more thing for someone to forget.

This is also the prerequisite for online payment. A tenant cannot pay a bill they cannot see, and a payment gateway needs somewhere to send them.

## What Changes

**A link, not an account**

- **Add a portal access token**: a long random string the owner generates for a tenant and sends them once. Opening the link shows their bills. There is nothing to register, nothing to remember, and nothing to reset.
- The token is stored **hashed**, exactly as a refresh token is. A leak of the database does not leak anyone's link.
- The owner can **regenerate** a link, which kills the previous one immediately, and **revoke** one outright.
- A token belongs to a **person**, not a tenancy, so it survives a renewal and still works after a move-out — which matters, because the final bill is issued at the moment the tenancy closes.

**A public surface, for the first time**

- **Add unauthenticated endpoints** under a portal prefix. Every other endpoint in this system sits behind an owner's access token; these are the first that do not, and they are scoped so that a token grants sight of one person's bills and nothing else.
- A token that is unknown, revoked, or malformed SHALL be answered identically. Distinguishing them tells a prober which of their guesses was once real.

**What a tenant can see**

- Every invoice of a tenancy they currently occupy, with its charges itemised — the readings, the rates, the days.
- **Unpaid** invoices of tenancies they have left. They still owe those.
- Not the new bills of a room they have moved out of.

Deliberately out of scope:

- **Paying.** The gateway, its QR codes and its webhooks are the change that follows. This one is the surface it will sit on, landed and verified on its own so that a fault later is unambiguously in one or the other.
- **Rate limiting.** The token's own entropy is the defence, which makes its strength a requirement here rather than an implementation detail.
- Any tenant-initiated action at all: no messages, no requests, no corrections. Reading only.

## Capabilities

### New Capabilities

- `tenant-portal`: a tenant sees their own bills through a link the owner issues, with no account and no password; the owner issues, regenerates and revokes those links.

### Modified Capabilities

None.

## Impact

**Database.** One table, holding a hashed token per tenant.

**Code.** A new module. The first router mounted outside the authentication middleware, and the first response shape written for someone other than the owner.

**Behaviour that changes.** Nothing existing. Every current endpoint keeps its guard and its shape.

**Security.** This is the change that puts a door in the wall. Its verification is therefore about what cannot be reached: an unknown token, a revoked token, another tenant's invoices, and an owner-only field appearing in a tenant's response.

**Downstream.** The payment change adds a way to pay the invoices this displays.
