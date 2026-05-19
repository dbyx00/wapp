# Release Automation Specification

## Purpose

Define CI/CD pipeline that builds, signs, and publishes WApp artifacts to GitHub Releases.

## Requirements

### Requirement: CI Trigger

The workflow MUST trigger on pushes to version tags matching `v*`.

#### Scenario: Tag push starts build

- GIVEN a git tag `v0.2.0` is pushed
- WHEN GitHub Actions processes the event
- THEN the release workflow starts within 60 seconds

### Requirement: Build Outputs

The workflow MUST produce three artifacts: `wapp.exe`, `WApp-Setup-{version}.exe`, and `WApp-{version}.msix`.

#### Scenario: All artifacts present

- GIVEN the workflow runs successfully
- WHEN the build job completes
- THEN all three artifacts are uploaded as workflow artifacts

#### Scenario: Build failure blocks release

- GIVEN esbuild or SEA build fails
- WHEN the workflow reaches the build step
- THEN the job fails and no release is created

### Requirement: OSS Code Signing

The workflow SHOULD submit `wapp.exe` to SignPath Foundation for signing before attaching it to the release.

#### Scenario: SignPath signs the binary

- GIVEN SignPath Foundation account is configured
- WHEN the signing step runs
- THEN the released `wapp.exe` carries a valid CA-trusted signature

#### Scenario: SignPath unavailable

- GIVEN SignPath service is unreachable
- WHEN the signing step times out
- THEN the workflow SHOULD proceed with an unsigned binary and a warning annotation

### Requirement: GitHub Release Publication

The workflow MUST create a GitHub Release with the tag name, auto-generated release notes, and all three artifacts attached.

#### Scenario: Release created with assets

- GIVEN the build and optional signing succeed
- WHEN the publish step runs
- THEN a Release exists with `wapp.exe`, installer, and `.msix` available for download

#### Scenario: Duplicate release blocked

- GIVEN a Release for `v0.2.0` already exists
- WHEN the workflow tries to create it again
- THEN the publish step fails with a clear error message
