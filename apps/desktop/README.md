# Desktop App

Desktop app for Hubble.md (TypeScript + Electron).

## Prerequisites

Install:

- [Node.js](https://nodejs.org/en/download)
- [pnpm](https://pnpm.io/installation)
- macOS desktop builds: Xcode Command Line Tools via `xcode-select --install`

## Development

From repo root:

```sh
pnpm install
pnpm dev:desktop
```

For Chrome DevTools MCP access:

```sh
pnpm dev:desktop:debug
```

The debug command exposes the Electron renderer over Chrome DevTools Protocol at `http://127.0.0.1:${HUBBLE_DESKTOP_DEBUG_PORT:-9222}`.

## Build

From repo root:

```sh
pnpm build:desktop
pnpm bundle:desktop
```

`bundle:desktop` creates macOS release artifacts under `apps/desktop/release/`.

### Windows

From `apps/desktop` on a Windows machine (or any machine; `electron-builder`
generates the `.ico` from `assets/icon.png` automatically):

```sh
pnpm bundle:win
```

This produces an NSIS installer and a portable `.exe` under
`apps/desktop/release/`. CI builds these on every push to a `claude/**` branch
and on demand via the **Desktop Build (Windows)** workflow, uploading the
`.exe` as a downloadable run artifact — no release or code signing required.

## Start Claude

When a folder is open, the toolbar's terminal button (also **File → Start
Claude in Folder**) opens a terminal scoped to that folder and runs the
`claude` CLI, giving the agent direct access to your notes. The `claude` CLI
must be installed and on your `PATH`.

## Distribution

macOS and Windows are supported. Production updates use GitHub Releases on
`bholmesdev/hubble.md`, tagged `desktop-v*`. A release should include:

- macOS: `latest-mac.yml`, the generated `.zip`, and the `.dmg`
- Windows: `latest.yml`, the NSIS installer `.exe`, and its `.blockmap`

Auto-update is currently wired for macOS only; Windows users update by
downloading the latest installer.

