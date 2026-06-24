# Contributing to NHLE

Thanks for your interest in improving NHLE! This project is a community
re-implementation of ACNHPokerCore for ACNH 3.0.3, and contributions —
especially **new or corrected memory offsets** — are very welcome.

## Getting started

```bash
git clone https://github.com/SuliLabs/NHLE.git
cd nhle
npm install
npm run dev
```

`npm run dev` starts Vite with hot reload and launches Electron pointed at it.

> If `npm install` fails with `ENOENT … rename` on a VirtualBox/network
> shared folder, copy the repo to a native local path first — those
> filesystems don't support the atomic renames npm uses.

## Project structure

| Path | Purpose |
|---|---|
| `electron/sysbotClient.js` | TCP client implementing the sys-botbase protocol. |
| `electron/main.js` | Electron main process + IPC bridge. |
| `electron/preload.js` | Exposes `window.sysbot.*` to the renderer. |
| `src/data/acnh.js` | **All ACNH 3.0.3 memory offsets** and item encode/decode helpers. |
| `src/components/` | One React component per UI module. |
| `docs/OFFSETS.md` | Documents every offset and how it was discovered. |

## Contributing offsets

This is the highest-value contribution. When you find or correct an address:

1. Add/update it in `src/data/acnh.js` with a comment noting its
   verification status (`✓ confirmed`, `~ tentative`, `✗ wrong`).
2. Document it in `docs/OFFSETS.md`: the address, what it holds, and
   **how you verified it** (what you read/wrote and what changed in-game).
3. Note the ACNH version you tested against (this project targets 3.0.3).

### Verification standard

An offset is **confirmed** only when a live read returns the expected
value *or* a poke produces the expected visible change in-game. Anything
based purely on a version-shift hypothesis is **tentative** — label it so.

## Code style

- Match the surrounding code: 2-space indent, no semicolon-golfing, keep
  comments where they explain *why* (e.g. the count−1 encoding quirk).
- Keep all memory addresses in `src/data/acnh.js`, never inline in components.
- Heap-relative addresses use `peek`/`poke`; NSO addresses are marked
  `[MAIN]` and use `peekMain`/`pokeMain`.

## Pull requests

- One logical change per PR.
- Describe what you tested and on which ACNH version.
- For offset changes, include the before/after memory bytes if you have them.

## Safety & scope

NHLE is for **offline, single-player** memory editing and research.
Please don't add features aimed at online/multiplayer abuse. Edits that
can brick a save should warn the user clearly in the UI.
