# Web UI Specification

## Purpose

Define the HTTP API, SSE streaming contract, and frontend views for the browser-based WApp manager.

## Requirements

### Requirement: API Endpoints

The system MUST expose a Hono HTTP server with the following endpoints:
- `GET /api/apps` → return all registered apps
- `POST /api/apps` → initiate app creation and return an SSE stream of `AppEvent`s, concluding with the created `AppEntry`
- `DELETE /api/apps/:name` → initiate app removal and return an SSE stream of `AppEvent`s, concluding with the removed `AppEntry`

#### Scenario: List apps

- GIVEN the server is running and apps exist
- WHEN a client sends `GET /api/apps`
- THEN the server SHALL return `200 OK` with a JSON array of `AppEntry` objects

#### Scenario: Create app via SSE

- GIVEN the server is running
- WHEN a client sends `POST /api/apps` with `{ url, name?, browser? }`
- THEN the server SHALL return `200` with `Content-Type: text/event-stream`
- AND the stream SHALL emit creation step events in order
- AND the final event SHALL contain the created `AppEntry`

#### Scenario: Remove app via SSE

- GIVEN the server is running and an app exists
- WHEN a client sends `DELETE /api/apps/:name`
- THEN the server SHALL return an SSE stream of removal step events
- AND the final event SHALL contain the removed `AppEntry`

#### Scenario: App not found on removal

- GIVEN the server is running
- WHEN a client sends `DELETE /api/apps/nonexistent`
- THEN the stream SHALL emit a `finding-app` event with `status: 'error'`
- AND the stream SHALL end

### Requirement: SSE Contract

SSE streams MUST use `text/event-stream` format. Each event MUST be a valid JSON object with `event` and `data` fields. The stream MUST close after the final result or error event.

#### Scenario: Malformed client request

- GIVEN a `POST /api/apps` with an invalid URL
- THEN the first event MAY be an error event, or the server MAY return `400 Bad Request` before the stream begins

### Requirement: Security and Binding

The server MUST bind to `127.0.0.1` only. The server MUST NOT listen on `0.0.0.0` or any external interface.

#### Scenario: External access blocked

- GIVEN the server is started
- WHEN inspected for listening addresses
- THEN it SHALL report `127.0.0.1` only

### Requirement: Frontend Views

The frontend MUST provide three views: List (all apps), Create (form with live progress), and Remove (confirmation with progress). The frontend MUST consume SSE streams to render step progress for create and remove operations.

#### Scenario: Create view progress

- GIVEN the user submits the create form
- WHEN the SSE stream emits step events
- THEN the UI SHALL display each step name and status in real time

### Requirement: Static File Serving

The server MUST serve the Vite-built frontend from `dist/public/` and MUST serve icons from `%APPDATA%/WApp/icons/` via a static route.

### Requirement: CLI Integration

The `wapp web` command MUST start the server, serve static files, and open the default system browser. If port `3000` is unavailable, the system SHOULD auto-increment or display a clear error.

#### Scenario: Port conflict

- GIVEN port `3000` is in use
- WHEN `wapp web` executes
- THEN the system SHALL either bind to `3001` (or next free port) and log the actual URL, or exit with a clear error message
