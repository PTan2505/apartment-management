## Purpose

Lets a caller search for a Vietnamese address and resolve the chosen one into the parts this system records, without knowing which provider answers, how its data is shaped, or which of its options must be set to get current administrative units.

## ADDED Requirements

### Requirement: Owner can search for an address

The system SHALL allow an authenticated `owner` to search for a Vietnamese address by free text, returning candidate places. Each candidate SHALL carry a description suitable for showing to a person and an identifier that can be used to resolve it.

A candidate SHALL NOT carry the address broken into parts. Searching offers choices; only resolving a chosen one produces the values a building records.

The search SHALL return an empty set of candidates rather than an error when nothing matches, because finding nothing is an ordinary outcome of typing.

The caller MAY supply an opaque token grouping a sequence of searches with the resolution that follows, so a provider that bills by session is not billed per keystroke.

#### Scenario: Searching returns candidates

- **WHEN** an authenticated owner searches for an address by text
- **THEN** the system responds with HTTP 200 and candidate places, each carrying a description and an identifier

#### Scenario: A candidate does not carry address parts

- **WHEN** an authenticated owner searches for an address
- **THEN** each candidate carries only a description and an identifier, not the address broken into fields

#### Scenario: Nothing matches

- **WHEN** an authenticated owner searches for text no place matches
- **THEN** the system responds with HTTP 200 and no candidates, rather than an error

#### Scenario: Empty search text

- **WHEN** an authenticated owner searches with no text
- **THEN** the system responds with HTTP 400 and does not call the provider

### Requirement: Owner can resolve a chosen address

The system SHALL allow an authenticated `owner` to resolve a candidate identifier into the parts a building records: a street line, a ward, a city, and a country.

The street line SHALL combine the house number and street where the provider supplies them, and SHALL be empty where it supplies neither — a place identified only by its ward has no street.

The resolved values SHALL be returned in this system's own shape and vocabulary. No field name, tier, or structure belonging to the provider SHALL appear in the response.

The identifier that was resolved SHALL be returned alongside, so a caller can record which place the values came from.

An identifier the provider does not recognise SHALL produce HTTP 404.

#### Scenario: Resolving produces the recorded parts

- **WHEN** an authenticated owner resolves a candidate identifier
- **THEN** the system responds with HTTP 200 and a street line, ward, city, and country

#### Scenario: The street line combines house number and street

- **WHEN** a resolved place has both a house number and a street
- **THEN** the street line contains both

#### Scenario: A place with no street

- **WHEN** a resolved place identifies only an administrative area and has no street
- **THEN** the street line is empty and the ward, city, and country are still returned

#### Scenario: The resolved identifier is returned

- **WHEN** an authenticated owner resolves a candidate identifier
- **THEN** the response carries that identifier, so the caller can record which place the address came from

#### Scenario: An unrecognised identifier

- **WHEN** an authenticated owner resolves an identifier the provider does not recognise
- **THEN** the system responds with HTTP 404

#### Scenario: The provider's shape is not exposed

- **WHEN** any response is returned from either endpoint
- **THEN** it uses this system's own field names, and carries no field, tier, or structure named by the provider

### Requirement: Resolved administrative units are current and unprefixed

The system SHALL request administrative units as they stand after the 2025 reform, which merged wards and abolished the district tier. A resolved address SHALL therefore report the merged ward, and SHALL NOT report a district under any name.

Ward and city SHALL be reported without their administrative prefix — the unit's name alone, as buildings record it. Reporting a prefixed form would create a second spelling of every place already recorded, and the location filter would then offer both.

Removing a prefix SHALL NOT alter a name that merely begins with the same letters, so a name is shortened only where the leading word is genuinely the unit's designation.

#### Scenario: Post-reform units are reported

- **WHEN** an authenticated owner resolves an address in an area affected by the 2025 boundary merger
- **THEN** the ward reported is the merged one rather than the ward that preceded it

#### Scenario: No district is reported

- **WHEN** an authenticated owner resolves any address
- **THEN** the response carries no district, under that or any other name

#### Scenario: A ward prefix is removed

- **WHEN** the provider names a ward with its administrative prefix, such as a `phường` or a `xã`
- **THEN** the ward is reported as the name alone

#### Scenario: A city prefix is removed

- **WHEN** the provider names a city or province with its administrative prefix
- **THEN** the city is reported as the name alone

#### Scenario: A resolved value matches how buildings record it

- **WHEN** a resolved ward or city is used to create a building and that building is then found by the location filter
- **THEN** the value matches, because it is stored in the same form as values already recorded

### Requirement: Address lookup is optional and its failures are contained

Address lookup SHALL be optional. When no provider key is configured the rest of the system SHALL start and run normally, and the two address endpoints SHALL report that lookup is not configured rather than failing obscurely.

When the provider cannot be reached, answers too slowly, or rejects the system's credentials, the endpoints SHALL report that address lookup is unavailable, in the standard error shape, distinguishing it from the caller having asked for something invalid. A provider outage SHALL NOT be reported as though the caller were at fault.

The provider key SHALL never appear in a response, an error, or a log.

#### Scenario: No key configured

- **WHEN** an authenticated owner uses either address endpoint and no provider key is configured
- **THEN** the system reports that address lookup is not configured, in the standard error shape

#### Scenario: The rest of the system is unaffected

- **WHEN** the system runs with no provider key configured
- **THEN** every other endpoint behaves normally and the system starts

#### Scenario: The provider is unreachable

- **WHEN** the provider cannot be reached or does not answer in time
- **THEN** the system reports that address lookup is unavailable, distinguishing it from an invalid request

#### Scenario: The provider rejects the credentials

- **WHEN** the provider rejects the system's key
- **THEN** the system reports that address lookup is unavailable, and does not report the caller as unauthenticated

#### Scenario: The key is never disclosed

- **WHEN** any response or error is produced by either endpoint
- **THEN** it contains no part of the provider key

### Requirement: Address endpoints require an authenticated owner

The system SHALL reject any address lookup request that is unauthenticated or made by a user whose role is not `owner`, so the configured provider key cannot be used through this system by anyone else.

#### Scenario: Unauthenticated request

- **WHEN** a request to either address endpoint has no valid access token
- **THEN** the system responds with HTTP 401 and does not call the provider

#### Scenario: Authenticated non-owner request

- **WHEN** a request to either address endpoint carries a valid access token for a user whose role is not `owner`
- **THEN** the system responds with HTTP 403 and does not call the provider
