# Event-Driven Core Specification

## Purpose

Define the typed event system that exposes granular progress and error information for every domain operation.

## Requirements

### Requirement: AppEvent Type

The system MUST define an `AppEvent` interface covering create, list, and remove operations.

Each event object MUST contain:
- `step`: string identifying the operation step
- `status`: `'start' | 'success' | 'error' | 'warning'`
- `data`: operation-specific payload
- `error?`: string message when `status` is `'error'`

#### Scenario: Create event sequence

- GIVEN a valid URL and browser
- WHEN `createApp` executes with `onEvent` provided
- THEN the system SHALL emit `validating` (start→success), `resolving-browser` (start→success), `resolving-name` (start→success), `downloading-icon` (start→success), `creating-shortcut` (start→success), `registering` (start→success), and `created` (success) events in order

#### Scenario: Remove event sequence

- GIVEN an existing app name
- WHEN `removeApp` executes with `onEvent` provided
- THEN the system SHALL emit `finding-app` (start→success), `deleting-shortcut` (start→success), `deleting-icon` (start→success), `updating-registry` (start→success), and `removed` (success) events in order

#### Scenario: List event sequence

- GIVEN a populated registry
- WHEN `listApps` executes with `onEvent` provided
- THEN the system SHALL emit `reading-registry` (start→success) and `listed` (success) events

### Requirement: OnEvent Callback Contract

The system MUST accept an optional `OnEvent` callback for `createApp`, `removeApp`, and `listApps`.

When provided, the callback MUST receive every `AppEvent` emitted during the operation.
When omitted, the system MUST NOT require the callback and MUST preserve existing behavior.

#### Scenario: Optional callback omitted

- GIVEN `createApp` is invoked without `onEvent`
- WHEN the operation completes
- THEN the system SHALL behave identically to pre-refactor behavior

#### Scenario: Error event propagation

- GIVEN `createApp` with `onEvent` provided
- WHEN a step fails (e.g., browser not found)
- THEN the system SHALL emit an `error` status event for that step with a descriptive `error` string
- AND the operation SHALL reject with the same error

### Requirement: Event Granularity

The system MUST emit a `start` event before each step begins and a `success`, `error`, or `warning` event when the step completes. No operation step MAY be omitted from event coverage.

#### Scenario: Every step is reported

- GIVEN any domain operation
- WHEN the operation executes with `onEvent`
- THEN every logical step SHALL have a corresponding `start` event
- AND every logical step SHALL have a corresponding completion event
