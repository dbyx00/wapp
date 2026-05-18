# App Creation Specification

## Purpose

Define the behavior of the `createApp` operation, including its event-driven progress reporting and return contract.

## Requirements

### Requirement: Event-Driven Progress

`createApp` MUST accept an optional `onEvent` callback in `CreateAppOptions`. When provided, the callback MUST receive an `AppEvent` for every step: `validating`, `resolving-browser`, `resolving-name`, `downloading-icon`, `creating-shortcut`, `registering`, and `created`.

#### Scenario: Full creation with events

- GIVEN a valid URL and optional name/browser
- WHEN `createApp` is called with `onEvent`
- THEN `onEvent` SHALL receive each step event in sequence
- AND the final `created` event SHALL contain the `AppEntry` in `data`

#### Scenario: Browser resolution failure

- GIVEN an invalid or missing browser executable
- WHEN `createApp` resolves the browser
- THEN `onEvent` SHALL receive `resolving-browser` with `status: 'error'` and an `error` message
- AND `createApp` SHALL reject with the same error

### Requirement: Return Value

`createApp` MUST return `Promise<AppEntry>`. The resolved `AppEntry` MUST include `name`, `url`, `browser`, `iconPath`, `shortcutPath`, and `createdAt`.

#### Scenario: Successful creation returns entry

- GIVEN valid inputs
- WHEN `createApp` completes
- THEN it SHALL resolve to the registered `AppEntry`

### Requirement: Backward Compatibility

When `onEvent` is omitted, `createApp` MUST preserve existing CLI behavior: it MAY log to console and MUST still return `Promise<AppEntry>`.

#### Scenario: CLI adapter unchanged

- GIVEN the CLI invokes `createApp` without `onEvent`
- WHEN the operation succeeds
- THEN console output SHALL remain identical to pre-refactor behavior
- AND the CLI SHALL receive the resolved `AppEntry`

### Requirement: Registry Duplication Guard

`createApp` MUST reject if an app with the same name already exists, emitting an error event if `onEvent` is provided.

#### Scenario: Duplicate name

- GIVEN an app named "Test" already exists
- WHEN `createApp` is called with name "Test"
- THEN it SHALL emit a `registering` event with `status: 'error'`
- AND reject with `App "Test" already exists`
