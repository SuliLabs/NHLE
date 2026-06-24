# ACNH 3.0.3 — Memory Offset Map

Memory offset research for **Animal Crossing: New Horizons v3.0.3** on
Nintendo Switch, accessed remotely through
[sys-botbase 2.4+](https://github.com/olliz0r/sys-botbase).

All offsets used by NHLE live in [`../src/data/acnh.js`](../src/data/acnh.js).
This document explains what each one holds and how it was verified.

> Reference baseline: [ACNHPokerCore](https://github.com/Berichan/ACNHPoker)
> (offsets for ACNH 2.x).

---

## Table of contents

- [Environment](#environment)
- [Item format in memory](#item-format-in-memory)
- [Confirmed offsets — 3.0.3](#confirmed-offsets--303)
- [Tentative / pending offsets](#tentative--pending-offsets)
- [The +0x200000 shift](#the-0x200000-shift)
- [NSO layout in 3.0.3](#nso-layout-in-303)
- [sys-botbase protocol](#sys-botbase-protocol)
- [Known item IDs](#known-item-ids)

---

## Environment

| Parameter | Value |
|---|---|
| Game | Animal Crossing: New Horizons **3.0.3** |
| Hardware | Nintendo Switch (HAC-001) |
| CFW | Atmosphère + sys-botbase 2.41 |
| Default port | `6000` |
| HeapBase (absolute) | `0x00000001C5600000` |
| MainNsoBase (absolute) | `0x0000004663806000` |

> `peek`/`poke` addresses are **heap-relative**. Addresses marked `[MAIN]`
> are relative to the NSO and use `peekMain`/`pokeMain`.

---

## Item format in memory

Each inventory item is **8 bytes, little-endian**:

```
Offset  Bytes  Meaning
 0x00    2     Item ID (LE)            e.g. 0x0A40 → bytes 40 0A
 0x02    1     Variation / color       0x00 = default
 0x03    1     Always 0x00
 0x04    4     Count (LE, 0-indexed)   1 item → 00 00 00 00
```

### Count encoding — critical difference vs 2.x

ACNH **3.0.3** stores quantity as `quantity − 1`:

| Items | Bytes in memory |
|:---:|---|
| 1 | `00 00 00 00` |
| 2 | `01 00 00 00` |
| 10 | `09 00 00 00` |
| 99 | `62 00 00 00` |

### Empty slot

```
FE FF 00 00 00 00 00 00   (Item ID = 0xFFFE)
```

### Example — 5 weeds (ID 0x0A40)

```
40 0A 00 00 04 00 00 00
│        │  └── count = 4 (= 5−1, LE)
│        └── variation 0x00
└── ID 0x0A40 (LE)
```

Poke string: `0x400A000004000000`

> **Furniture caveat:** items with a non-zero variation (`var ≠ 0`) may
> show non-zero bytes in the count field that aren't a real quantity.
> Only stackable resources (branches, stones, iron, etc.) reliably use
> the count−1 encoding.

---

## Confirmed offsets — 3.0.3

Verified by reading the expected value live, or by poking and observing
the change in-game.

### Pocket inventory (heap-relative)

| Constant | Address | Verification |
|---|---|---|
| `ItemSlotBase` | `0xB29BB758` | ✓ read + written live — weeds in slots 1–3 confirmed in-game |
| `ItemSlot21Base` | `0xB29BB6A0` (`ItemSlotBase − 0xB8`) | ✓ layout confirmed |
| `PlayerOffset` | `0x131F70` | ✓ Player 2 = `ItemSlotBase + 0x131F70`, FFFE slots observed |

```
heap + 0xB29BB6A0  →  slot 21 ┐
                   ...         │  slots 21–40 (8 bytes each)
heap + 0xB29BB738  →  slot 40 ┘
heap + 0xB29BB750  →  FF FF FF FF FF FF FF FF   ← sentinel
heap + 0xB29BB758  →  slot 1  ┐
                   ...         │  slots 1–20 (8 bytes each)
heap + 0xB29BB7F0  →  slot 20 ┘
```

### Home storage (heap-relative)

| Constant | Address | Verification |
|---|---|---|
| `HomeStorageBase` | `0xB040C7C0` | ✓ 512/512 FFFE slots in first 4 KB — P1 closet |

> In 2.x this was `ItemSlotBase + 0xC4`; in 3.0.3 that offset points at
> struct metadata, not the closet.

### Recycling box (heap-relative) — 20 slots

| Constant | Address | Verification |
|---|---|---|
| `RecyclingBase` | `0xB1BC40D0` | ✓ 17/20 slots verified in-game, exact contents matched |

Verified contents (Resident Services recycling box):

```
Slot  Item                          Count
 1    Cardboard box (0x0E58)          1
 2–5  Branch (0x09C4)                 1 each
 6    Iron nuggets (0x09CF)           3   ← bytes 4-7 = 02 00 00 00
 7-8  Cardboard box (0x0E58)          1
 9    Nursery sapling (0x0AEA)        1
10    Cardboard box (0x0E58)          1
11    Stone (0x09C6)                  1
12    Branch (0x09C4)                 1
13    Utility sink (0x0FBA)           1   var≠0
14    Elephant slide (0x0056)         1   var≠0
15-17 Cardboard box (0x0E58)          1
18-20 (empty, FFFE)
```

### Turnips (heap-relative)

| Constant | Address | Verification |
|---|---|---|
| `TurnipBuyPrice` | `0xB16DBB30` | ✓ reads `63 00 00 00` = 99 bells (this week's buy price) |
| `TurnipSellBase` | `0xB16DBB3C` (`+0xC`) | ✓ 12 × uint32 LE (Mon AM → Sat PM) |

```
+0x00  uint32  buy price
+0x04  uint32  padding
+0x08  uint32  padding
+0x0C  uint32  sell Mon AM
+0x10  uint32  sell Mon PM
 ...    (12 values, ending Sat PM at +0x38)
```

### Map item array (heap-relative)

| Constant | Address | Verification |
|---|---|---|
| `MapBase` | `0xB147A8C0` | ✓ continuous array of FFFE slots — placed-item storage |

### Weather

| Constant | Address | Verification |
|---|---|---|
| `WeatherSeed` | `0xB122EAD8` | ✓ reads `90 53 19 68 46 00 00 00` |

### Physics & time `[MAIN]`

| Constant | MAIN address | Value read | Status |
|---|---|---|---|
| `Collision` | `0x02219120` | `B9 5B F8 00` | ✓ confirmed |
| `ActorCollision` | `0x0221965C` | `1E 2E 10 00` | ✓ confirmed |
| `FreezeTime` | `0x00981B28` | `F9 20 32 60` | ✓ confirmed |

Poke values:

```
Player collision   OFF=0x12800000   ON=0xB95BF800
Actor collision    OFF=0x1E3E1000   ON=0x1E2E1000
Time              FREEZE=0xD503201F  UNFREEZE=0xF9203260
```

### Struct sizes (unchanged from 2.x)

| Constant | Value |
|---|---|
| `VillagerSize` | `0x13230` |
| Villager house size | `0x12E8` |

---

## Tentative / pending offsets

| Constant | Address | Observed | Status |
|---|---|---|---|
| `VillagerBase` | `0xB124B4E0` | non-zero struct data | ~ +0x200000 shift, struct unverified |
| Villager house base | `0xB16CD0E0` | `02000000 02000000 …` | ~ struct unverified |
| `StaminaAddress` | `0xB9963A00` | `00000000 00000000 FFFFFFFF` | ~ needs in-game check |
| Reaction wheel | `0xB29CE40C` (`ItemSlotBase + 0x12CB4`) | possible 8 reaction IDs | ~ needs in-game check |
| `MaxWalkSpeed` `[MAIN]` | — | — | ✗ 2.x addr is beyond the 3.0.3 NSO |
| Read time `[MAIN]` | — | — | ✗ 2.x addr is beyond the 3.0.3 NSO |
| Shop `[MAIN]` | — | — | ✗ address shifted, unknown |

---

## The +0x200000 shift

The 2.x → 3.0.3 offset for `TurnipBuyPrice` is exactly **+0x200000**.
The same shift, applied to other 2.x heap offsets, lands on valid data:

| Constant | 2.x address | 3.0.3 address | Status |
|---|---|---|---|
| `TurnipBuyPrice` | `0xB14DBB30` | `0xB16DBB30` | ✓ confirmed |
| `RecyclingBase` | `0xB19C40D0` | `0xB1BC40D0` | ✓ in-game verified |
| `MapBase` | `0xB127A8C0` | `0xB147A8C0` | ✓ confirmed |
| `VillagerBase` | `0xB104B4E0` | `0xB124B4E0` | ~ tentative |
| Villager house | `0xB14CD0E0` | `0xB16CD0E0` | ~ tentative |
| `StaminaAddress` | `0xB9763A00` | `0xB9963A00` | ~ tentative |

This shift applies to **heap** offsets. It does **not** apply to NSO
(`[MAIN]`) addresses — the code segment was re-laid-out, see below.

---

## NSO layout in 3.0.3

The ACNH 3.0.3 NSO has multiple segments (code + rodata + data) with
zero-filled gaps between them. Total span ≈ `main+0x0` → `main+0x6C80000`
(~108 MB), versus ~191 MB in 2.x.

```
main+0x0000000 → DATA
main+0x4580000 → zero gap
main+0x4600000 → DATA
 ...            (alternating segments)
main+0x6780000 → DATA
main+0x6C80000 → zero (apparent end of NSO)
```

> The 2.x speed/time addresses (`MaxWalkSpeed=0x0BFB4F34`,
> read-time=`0x0BD92B00`) sit **beyond** the 3.0.3 NSO and must be
> re-scanned within `0x0–0x6C80000`. They are the main known gaps.

---

## sys-botbase protocol

sys-botbase accepts **one TCP connection at a time**.

### Read

```
peek         0xHEAP_OFFSET SIZE\r\n   → hex ASCII + \n
peekMain     0xMAIN_OFFSET SIZE\r\n   → hex ASCII + \n  (NSO-relative)
peekAbsolute 0xABS_ADDR    SIZE\r\n   → hex ASCII + \n  (absolute)
```

### Write

```
poke     0xHEAP_OFFSET 0xDATA\r\n   → no response
pokeMain 0xMAIN_OFFSET 0xDATA\r\n   → no response
```

> `0x` prefix is required on **both** the address and the data, and there
> is **no** size parameter on pokes. Omitting `0x` makes the poke fail
> silently.

Example — drop 5 weeds into slot 1:

```
poke 0xB29BB758 0x400A000004000000
```

---

## Known item IDs

Identified by cross-referencing memory with visible in-game contents.

| ID hex | Name | Notes |
|---|---|---|
| `0x0056` | Elephant slide | furniture, var=color |
| `0x09C4` | Branch | stackable |
| `0x09C6` | Stone | stackable |
| `0x09CF` | Iron nuggets | stackable |
| `0x0A40` | Weeds | stackable — used for poke tests |
| `0x0AEA` | Nursery sapling | — |
| `0x0E58` | Cardboard box | stackable |
| `0x0FBA` | Utility sink | furniture, var=color |

The full item / recipe / variation tables live in
[`../src/data/items.csv`](../src/data/items.csv),
`recipes.csv`, and `variations.csv`.
