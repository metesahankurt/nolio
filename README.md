<div align="center">
  <picture>
    <source srcset=".github/assets/nolio-logo-white.png" media="(prefers-color-scheme: dark)">
    <source srcset=".github/assets/nolio-logo-black.png" media="(prefers-color-scheme: light)">
    <img src=".github/assets/nolio-logo-black.png" alt="Nolio" width="120" height="120">
  </picture>

  <h1>Nolio</h1>
</div>

Encrypted local-first notes app built with Next.js, Tauri, TypeScript, and pnpm workspaces.

[![CI Status](https://github.com/metesahankurt/nolio/actions/workflows/ci.yml/badge.svg)](https://github.com/metesahankurt/nolio/actions/workflows/ci.yml)
[![Release](https://github.com/metesahankurt/nolio/actions/workflows/release.yml/badge.svg)](https://github.com/metesahankurt/nolio/actions/workflows/release.yml)
[![Version](https://img.shields.io/github/v/release/metesahankurt/nolio?label=Version&color=orange)](https://github.com/metesahankurt/nolio/releases/latest)

## What This App Does

- Local encrypted note vault with a master password
- Rich text editor powered by BlockNote
- Web storage through IndexedDB
- Native desktop storage through encrypted SQLite records
- Backup, restore, password change, auto-lock, and multilingual UI
- Desktop builds for macOS, Windows, and Linux through GitHub Actions

## Project Structure

```txt
apps/
  web/        Next.js web app
  native/     Tauri desktop app
packages/
  core/       Notes UI, vault logic, crypto, stores, and services
  ui/         Shared UI components and styles
  i18n/       Translation messages
```

## Development

```bash
pnpm install
pnpm web dev
```

Native app:

```bash
pnpm --filter native tauri dev
```

Quality checks:

```bash
pnpm check
pnpm typecheck
pnpm --filter native build
```

## Releases

The repository is configured for Release Please and desktop artifact builds:

- `.github/workflows/ci.yml` validates pull requests with check, typecheck, and build.
- `.github/workflows/release.yml` creates releases from conventional commits on `master`.
- `.github/workflows/build-desktop.yml` attaches macOS, Windows, and Linux Tauri installers to the release.

Repository settings to verify on GitHub:

- Actions permissions: allow GitHub Actions to create and approve pull requests.
- Pull request merge strategy: squash merge is recommended for clean Release Please history.
- Default branch: `master`.

## Repository

GitHub: <https://github.com/metesahankurt/nolio>
