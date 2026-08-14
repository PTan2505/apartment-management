## ADDED Requirements

### Requirement: Standardized paginated response shape
The system SHALL return a consistent paginated shape from every list endpoint, containing a `data` array of items and a `meta` object reporting the current page, the page size, the total number of items matching the request, and the total number of pages. List endpoints SHALL accept optional `page` and `pageSize` parameters, SHALL apply documented defaults when either is absent, and SHALL reject values outside the permitted range rather than silently clamping them.

#### Scenario: Default paging when no parameters are supplied
- **WHEN** a client requests a list endpoint without paging parameters
- **THEN** the system responds with the first page using the default page size, and reports that page number and size in `meta`

#### Scenario: Explicit page and page size
- **WHEN** a client requests a specific page and page size
- **THEN** the response contains at most that many items, drawn from that page of the result set, and `meta` echoes the requested values

#### Scenario: Total reflects the full matching set
- **WHEN** a client requests one page of a result set spanning several pages
- **THEN** `meta` reports the total number of matching items and the total number of pages, not just the count returned on this page

#### Scenario: Page beyond the end of the results
- **WHEN** a client requests a page number past the last page of results
- **THEN** the system responds with HTTP 200, an empty `data` array, and `meta` still reporting the true totals

#### Scenario: Page size above the permitted maximum
- **WHEN** a client requests a page size larger than the maximum the system permits
- **THEN** the system responds with HTTP 400 rather than returning an unbounded response

#### Scenario: Invalid paging values
- **WHEN** a client requests a page or page size that is zero, negative, or not a number
- **THEN** the system responds with HTTP 400 identifying the invalid parameter

#### Scenario: Paging combines with filters
- **WHEN** a client requests a page of a list endpoint while also applying that endpoint's filters
- **THEN** the returned items and the totals in `meta` describe only the filtered set
