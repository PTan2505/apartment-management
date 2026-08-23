## Purpose

The outward-facing half of taking money: configuring a payment provider, creating something a tenant can pay, being told when they have paid it, and checking that against the provider rather than assuming the message arrived.

## Requirements

### Requirement: The gateway is configured as a whole or not at all

The system SHALL read the gateway's credentials — a client identifier, an API key and a checksum key — from the environment, and SHALL treat them as one setting rather than three.

Where none is present, the system SHALL start normally and report that online payment is unavailable. An owner who does not take payments online must not be prevented from running the system.

Where some but not all are present, the system SHALL refuse to start. A client identifier without a checksum key would let the system create payment requests whose confirmations it cannot verify — which is worse than being unable to create them, because it looks like it is working.

The checksum key SHALL NOT appear in any response, log or error message.

#### Scenario: Fully configured

- **WHEN** all three credentials are present
- **THEN** the system starts and online payment is available

#### Scenario: Not configured

- **WHEN** none of the credentials is present
- **THEN** the system starts, and a request to pay a bill reports that online payment is not configured

#### Scenario: Partially configured

- **WHEN** some but not all of the credentials are present
- **THEN** the system refuses to start, naming which are missing

#### Scenario: Credentials do not leak

- **WHEN** a gateway call fails and the error is reported
- **THEN** neither the API key nor the checksum key appears in the response or the log

### Requirement: A payment request identifies itself by the payment it belongs to

Each payment request sent to the gateway SHALL carry a numeric reference unique to the payment record it was created for, so that a confirmation arriving later resolves to exactly one attempt.

The reference SHALL NOT be the invoice's identifier. A bill whose payment link expires and is replaced would then reuse a reference the gateway has already seen, and the two attempts would be indistinguishable.

The request SHALL be signed with the checksum key before it is sent, and the amount requested SHALL be the invoice's total.

#### Scenario: Each attempt gets its own reference

- **WHEN** two payment attempts are created for the same invoice
- **THEN** each carries a different reference

#### Scenario: A confirmation resolves to one attempt

- **WHEN** a confirmation arrives carrying a reference
- **THEN** it identifies exactly one payment record

#### Scenario: The amount requested is the amount owed

- **WHEN** a payment is created for an invoice
- **THEN** the amount sent to the gateway is that invoice's total

### Requirement: A confirmation is verified before it is believed

The system SHALL accept confirmations from the gateway at a public endpoint, and SHALL verify each one's signature against the checksum key **before reading anything else from it**. Without that, anyone able to reach the endpoint could mark any bill paid.

A confirmation whose signature does not verify SHALL be recorded and ignored. It SHALL NOT settle anything, and the response SHALL NOT indicate why it was rejected.

A confirmation reporting an amount that differs from the invoice's total SHALL be recorded and ignored. Otherwise a tenant transferring a token sum would settle a bill for any amount.

A confirmation naming a reference the system does not recognise SHALL be recorded and ignored.

**The same confirmation delivered more than once SHALL have the effect of being delivered once.** Gateways retry, and applying a payment twice reports money that arrived once as having arrived twice.

The system SHALL store the confirmation as it was received, before interpretation. What the gateway actually sends is the one thing that cannot be established in advance, and the first discrepancy is far cheaper to diagnose from the original than from what a parser made of it.

#### Scenario: A valid confirmation settles the payment

- **WHEN** a correctly signed confirmation arrives for a pending payment, reporting the invoice's total
- **THEN** the payment succeeds and the invoice reports itself as paid

#### Scenario: A forged confirmation

- **WHEN** a confirmation arrives whose signature does not verify
- **THEN** nothing is settled, no payment changes state, and the response does not say the signature was wrong

#### Scenario: A confirmation for the wrong amount

- **WHEN** a correctly signed confirmation reports an amount other than the invoice's total
- **THEN** nothing is settled and the discrepancy is recorded

#### Scenario: A confirmation for an unknown reference

- **WHEN** a correctly signed confirmation names a reference no payment carries
- **THEN** nothing is settled and it is recorded

#### Scenario: The same confirmation twice

- **WHEN** a confirmation that has already been applied arrives again
- **THEN** the payment is unchanged, no second payment is created, and the response is a success

#### Scenario: The payload is kept

- **WHEN** any confirmation is received, valid or not
- **THEN** the payload is stored as it arrived

#### Scenario: The endpoint is public

- **WHEN** a confirmation arrives without any access token
- **THEN** it is processed on the strength of its signature alone

### Requirement: A lost confirmation is caught when a tenant returns to the bill

Confirmations get lost — a deployment, a network fault, a retry budget spent. Where a tenant returns to a bill whose attempt the system still holds as waiting, the system SHALL ask the gateway what became of it before offering to start again.

Where the gateway reports it as **paid**, the system SHALL settle it and SHALL tell the tenant the bill is already paid. It SHALL NOT ask them to pay a second time.

This is a deliberate departure from how the owner's reconciliation behaves, which reports a disagreement and changes nothing. The reading is the same reading; what differs is the cost of not acting on it. An owner asking whether anything is wrong can be told, and will look into it. A tenant asking to pay cannot usefully be told "possibly nothing is wrong" — not acting takes their money twice.

The system MAY trust this answer without a signature, unlike a confirmation. A confirmation is inbound and anyone on the internet can post one, so its signature is the only thing distinguishing the gateway from an attacker. This is outbound: the system opened the connection, to a host it named, over TLS, with its own credentials. Nobody else can be at the other end of it.

Where the gateway reports the attempt as cancelled or expired, or has no record of it, the system SHALL record what became of it. **These are the only circumstances under which an attempt reaches either of those states** — a confirmation only ever reports success.

#### Scenario: A confirmation that never arrived

- **WHEN** a tenant returns to a bill the gateway reports as paid, and no confirmation was ever received for it
- **THEN** the payment is settled, the invoice reports itself as paid, and the tenant is told so rather than being asked to pay again

#### Scenario: An abandoned attempt is recorded as abandoned

- **WHEN** a tenant returns to a bill whose attempt the gateway reports as cancelled or expired
- **THEN** the attempt is recorded in that state and is never reconsidered

#### Scenario: An attempt the gateway has forgotten

- **WHEN** a tenant returns to a bill whose attempt the gateway has no record of
- **THEN** the attempt is closed rather than reused, because a code the gateway does not know cannot be paid

### Requirement: Owner can reconcile a payment against the gateway

The system SHALL allow an authenticated `owner` to ask the gateway what state it holds for a payment, and SHALL **report a disagreement rather than resolving it**.

Confirmations are lost — a deployment, a network fault, a retry budget exhausted. A system that only ever learns by being told cannot notice that it was not told, so there has to be a way to ask.

Reporting rather than resolving is deliberate for the first version: an automatic correction driven by a single reading is a way to turn one wrong answer into a wrong record, and the owner is better placed to judge which side is wrong.

#### Scenario: The two agree

- **WHEN** an authenticated owner reconciles a payment the gateway also reports as paid
- **THEN** the response reports agreement

#### Scenario: The gateway says paid and the system does not

- **WHEN** an authenticated owner reconciles a payment the gateway reports as paid but the system holds as pending
- **THEN** the response reports the disagreement and the payment is unchanged

#### Scenario: The gateway does not know the payment

- **WHEN** an authenticated owner reconciles a payment the gateway has no record of
- **THEN** the response says so rather than failing

#### Scenario: Reconciling requires an authenticated owner

- **WHEN** a reconciliation is requested without an access token whose role is `owner`
- **THEN** the system responds with HTTP 401 or 403

### Requirement: The gateway's failures do not become the system's

A gateway that is unreachable, slow or returning errors SHALL NOT leave a payment in a state that misrepresents what happened, and SHALL NOT prevent an owner recording a payment by any other means.

A payment record SHALL NOT be created as pending unless the gateway accepted the request. A pending payment for a request that was never made would be counted as an attempt in progress and would wait forever.

#### Scenario: The gateway rejects the request

- **WHEN** the gateway refuses a payment request
- **THEN** no pending payment is left behind and the tenant is told the attempt failed

#### Scenario: The gateway is unreachable

- **WHEN** the gateway cannot be reached
- **THEN** no pending payment is left behind

#### Scenario: Cash still works

- **WHEN** the gateway is unavailable
- **THEN** an authenticated owner can still record a payment in cash, by transfer, or from the deposit
