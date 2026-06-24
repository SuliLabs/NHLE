<div align="center">

# 🍃 NHLE — New Horizons Live Editor

**A cross-platform live memory editor for _Animal Crossing: New Horizons_ 3.0.3**, driven over [sys-botbase](https://github.com/olliz0r/sys-botbase).

Edit your inventory, drop items, tweak turnip prices, freeze time, change walk speed and more — **live, while the game is running**, with no save-file injection.

[![Build & Release](https://github.com/SuliLabs/NHLE/actions/workflows/release.yml/badge.svg)](https://github.com/SuliLabs/NHLE/actions/workflows/release.yml)
![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20Linux-blue)
![ACNH](https://img.shields.io/badge/ACNH-3.0.3-green)
![License](https://img.shields.io/badge/license-GPL--3.0-orange)

</div>

---

## What is this?

NHLE is a spiritual re-implementation of [ACNHPokerCore](https://github.com/Berichan/ACNHPoker), rebuilt from the ground up for **ACNH 3.0.3** and made **cross-platform**. ACNHPokerCore is a Windows-only C# WinForms tool; NHLE is an [Electron](https://www.electronjs.org/) + [React](https://react.dev/) app, so the same codebase ships native releases for **Windows and Linux**.

It talks directly to your Switch over TCP using the sys-botbase `peek`/`poke` protocol — nothing is written to your save file, all edits happen in live RAM.

> ⚠️ **Use at your own risk.** Memory editing can corrupt your island or get your save into a bad state. Back up your save before using. Never use online. This project is for offline, single-player experimentation and research.

## Features

| Module | What it does |
|---|---|
| **Inventory** | Read and overwrite all 40 pocket slots. Item picker with names, quantities, and variations. |
| **Drop** | Spawn items onto the ground around your character. |
| **Turnips** | Read and set buy price + the 12 weekly sell prices (Mon AM → Sat PM). |
| **Cheats** | Toggle collision, freeze time, walk/animation speed and other `[MAIN]`-region hacks. |
| **Misc** | Weather seed, coordinates, and other one-off values. |
| **Memory editor** | Raw hex peek/poke at any heap, MAIN or absolute address. |
| **Controller** | Send button presses and stick input remotely. |
| **Screen** | Live `pixelPeek` viewport of the Switch screen. |
| **Console** | Send raw sys-botbase commands and inspect responses. |

All ACNH memory offsets are calibrated for **version 3.0.3** — see [`docs/OFFSETS.md`](docs/OFFSETS.md) for the full map and how each was found.

## Requirements

- A Nintendo Switch running **custom firmware** (Atmosphère) with **[sys-botbase](https://github.com/olliz0r/sys-botbase) 2.4+** installed.
- Switch and computer on the **same network**; you'll need the Switch's IP address.
- _Animal Crossing: New Horizons_ **3.0.3**.

> sys-botbase accepts **one TCP connection at a time** — close other tools (e.g. NXAPI, sys-botbase clients) before connecting.

## Install

### Download a release (recommended)

Grab the latest build for your OS from the [**Releases**](https://github.com/SuliLabs/NHLE/releases) page:

| OS | File |
|---|---|
| Windows | `NHLE-x.y.z-win-x64.exe` (installer) or `…portable.exe` |
| Linux | `NHLE-x.y.z-linux-x64.AppImage` or `.deb` |

On Linux, make the AppImage executable first: `chmod +x NHLE-*.AppImage`.

### Build from source

```bash
git clone https://github.com/SuliLabs/NHLE.git
cd nhle
npm install

# Run in development (hot reload)
npm run dev

# Package a release for your current OS
npm run dist          # current platform
npm run dist:win      # Windows (.exe nsis + portable)
npm run dist:linux    # Linux (.AppImage + .deb)
```

Built installers land in `release/`.

> **Note on shared folders:** `npm install` performs atomic renames that fail on some network/virtual shared filesystems (e.g. VirtualBox `vboxsf`). If install fails with `ENOENT … rename`, copy the project to a native local path first.

## Usage

1. Boot ACNH 3.0.3 on your CFW Switch with sys-botbase running.
2. Launch NHLE.
3. Enter your Switch's **IP address** (port defaults to `6000`) and click **Connect**.
4. Pick a module from the sidebar and start editing.

## Project layout

```
nhle/
├── electron/             # Electron main process
│   ├── main.js           #   window + IPC handlers
│   ├── preload.js        #   contextBridge → window.sysbot
│   └── sysbotClient.js   #   TCP sys-botbase client (peek/poke/...)
├── src/
│   ├── App.jsx           # shell: sidebar tabs + connection bar
│   ├── components/       # one component per module
│   └── data/
│       ├── acnh.js       # 3.0.3 memory offsets + item encode/decode
│       └── *.csv         # item / recipe / variation databases
├── docs/
│   └── OFFSETS.md        # the 3.0.3 memory map and how it was found
├── .github/workflows/    # CI: build win+linux, publish releases
└── package.json          # electron-builder config (win + linux targets)
```

## How releases are built

Pushing a `vX.Y.Z` tag triggers [`.github/workflows/release.yml`](.github/workflows/release.yml), which builds on both `windows-latest` and `ubuntu-latest` runners and attaches the installers to a GitHub Release automatically.

```bash
npm version patch      # bumps version + commits + tags
git push --follow-tags
```

## Credits

- **[ACNHPokerCore](https://github.com/Berichan/ACNHPoker)** by Berichan — the original tool and offset research this project builds on.
- **[sys-botbase](https://github.com/olliz0r/sys-botbase)** by olliz0r — the on-console memory access server.
- ACNH 3.0.3 offset research documented in [`docs/OFFSETS.md`](docs/OFFSETS.md).

## License

[GPL-3.0](LICENSE) — same family as the projects this builds on.

---

<div align="center">
<sub>Not affiliated with Nintendo. Animal Crossing is a trademark of Nintendo. For offline, single-player, educational use only.</sub>
</div>
