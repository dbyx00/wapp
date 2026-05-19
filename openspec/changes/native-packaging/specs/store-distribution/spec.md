# Store Distribution Specification

## Purpose

Define MSIX packaging and Microsoft Store submission to deliver WApp without SmartScreen warnings.

## Requirements

### Requirement: MSIX Package Creation

The system MUST produce a `.msix` file containing `wapp.exe`, `public/`, and a valid `AppxManifest.xml`.

#### Scenario: MSIX contains all required files

- GIVEN the build pipeline runs
- WHEN `makeappx` completes
- THEN the `.msix` includes the executable, assets, and manifest

#### Scenario: MSIX install from Store

- GIVEN the app is published to the Microsoft Store
- WHEN a user clicks "Install" in the Store app
- THEN the app installs silently without SmartScreen

### Requirement: Store Signing

The `.msix` MUST be submitted to the Microsoft Store and signed with a Microsoft certificate. Sideloading unsigned MSIX packages MUST NOT be supported.

#### Scenario: Unsigned MSIX blocked

- GIVEN an unsigned `.msix` file
- WHEN a user attempts to install it on a non-developer machine
- THEN Windows blocks the installation

### Requirement: Manifest Identity

The `AppxManifest.xml` MUST declare the same `Name`, `Publisher`, and `Version` as `src/config/app.ts`.

#### Scenario: Manifest matches app identity

- GIVEN `src/config/app.ts` version is `0.2.0`
- WHEN the MSIX manifest is generated
- THEN the manifest version equals `0.2.0.0`

### Requirement: Zero SmartScreen

A Store-signed MSIX MUST NOT trigger Windows SmartScreen on installation or first launch.

#### Scenario: First-time user installs from Store

- GIVEN a user who has never installed WApp
- WHEN they install from the Microsoft Store
- THEN no "Windows protected your PC" dialog appears
