## ADDED Requirements

### Requirement: The shell knows which role is signed in

The application shell SHALL build its navigation from the destinations the
signed-in role may reach, and SHALL show which role the person is signed in as
beside their name.

A person covering specific buildings SHALL be able to see which, from the shell,
without going to a screen that lists them.

#### Scenario: The navigation matches the role

- **WHEN** any account signs in
- **THEN** the navigation lists only the destinations that role may reach

#### Scenario: Knowing who you are signed in as

- **WHEN** a manager reads the shell
- **THEN** it names them, says they are a manager, and says which buildings they cover
