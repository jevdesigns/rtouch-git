# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]
- Initial scaffolding and Beta 2 features

## [v2.0.0] - 2025-12-12

### Added
- Hybrid architecture: React frontend + Express backend proxy for Home Assistant Supervisor ingress.
- Glassmorphism UI with Tailwind CSS and modern design tooling (Framer Motion, Headless UI).
- Drag & drop interaction powered by `@dnd-kit` and a custom long-press hook for edit controls.
- Device integrations: Sony receiver, Alarm panel, Lutron Caseta, Ecobee thermostat (tiles + modals).
- Auto-detection of Home Assistant entities and local persistence to simplify setup.
- Deployment improvements: `deploy.bat` with `robocopy` and SHA256 verification (`tools/verify_deploy.ps1`).
- Webhook endpoint with HMAC-SHA256 verification (`/webhook`) and CI publish workflow.

### Changed
- Added editor and formatting configs: `.editorconfig`, ESLint, Prettier.
- CI: GitHub Actions workflows to build and publish the client artifact.

### Security
- Webhook secrets and supervisor tokens are not stored in the repository. Use `.env.example` and GitHub/HA Secrets.

### Notes
- This release prepares the project for Home Assistant addon publishing and GitHub releases.
