// ACNH 3.0.3 memory map + item encoding used by NHLE.
// Addresses are heap-relative (peek/poke) unless marked [MAIN] (peekMain/pokeMain).
//
// Verification status:
//   ✓ CONFIRMED — validated by reading the expected value from a live Switch
//   ~ tentative — plausible but not yet confirmed in-game
//   ✗ wrong     — known incorrect on 3.0.3 (kept out of the UI)
// Count encoding: item count is stored as (quantity − 1): 1 item → 0, 2 → 1, …

export const ADDR = {
  // Pocket inventory — 40 slots of 8 bytes (slots 1–20 here, 21–40 just before)
  ItemSlotBase:    0xB29BB758,            // ✓ CONFIRMED 3.0.3
  ItemSlot21Base:  0xB29BB758 - 0xB8,     // ✓ = 0xB29BB6A0
  PlayerOffset:    0x131F70,              // ✓ Player 2 = ItemSlotBase + 0x131F70

  HomeStorageBase: 0xB040C7C0,            // ✓ CONFIRMED — closet (512 slots)
  RecyclingBase:   0xB1BC40D0,            // ✓ CONFIRMED — recycling box (20 slots)

  TurnipBuyPrice:  0xB16DBB30,            // ✓ CONFIRMED — u32 LE
  TurnipSellBase:  0xB16DBB30 + 0xC,      // ✓ 12 u32 values (Mon–Sat AM/PM)
  WeatherSeed:     0xB122EAD8,            // ✓ CONFIRMED — u32

  // [MAIN] time — use pokeMain
  FreezeTime:      0x00981B28,            // ✓ CONFIRMED — reads F9203260 (unfreezeTime)
  // ✗ Collision: read matches 2.x, but the patch CRASHES the game on 3.0.3 — kept out of the UI.
  Collision:       0x02219120,
  ActorCollision:  0x0221965C,
};

// Byte patterns written with pokeMain.
export const PHYSICS = {
  freezeTime:   'D503201F',
  unfreezeTime: 'F9203260',
};

// Address of inventory slot (1-indexed). Uses a runtime-discovered base when set.
export function getSlotAddress(slot, overrideBase) {
  const base = overrideBase ?? ADDR.ItemSlotBase;
  if (slot <= 20) return base + (slot - 1) * 8;
  return (base - 0xB8) + (slot - 21) * 8;
}

// ── Full ACNH item struct (8 bytes) ───────────────────────────────────────────
//  [0..1] ItemId  u16 LE
//  [2]    SystemParam     : rotation(bits0-1) | buried 0x04 | dropped 0x20
//  [3]    AdditionalParam : wrap type(bits0-1) | paper(bits2-5) | showItem 0x40
//  [4..7] FreeParam u32, by kind:
//           stackable → Count (stored as count−1 on 3.0.3)
//           variable  → BodyType(bits0-2) | PatternChoice(bits5+)
//           tool      → UseCount / durability (u16 at [6..7])
export const WRAP_PAPERS = ['Yellow','Pink','Orange','LightGreen','Green','Mint','LightBlue','Purple','Navy','Blue','White','Red','Gold','Brown','Gray','Black'];

export function buildItem(id, opts = {}) {
  const { count = 1, variation = 0, pattern = 0, durability = null,
          wrap = false, paper = 0, buried = false, rotation = 0, kind = 'stackable' } = opts;
  const idn = (parseInt(String(id).replace(/^0x/i, ''), 16) || 0) & 0xFFFF;
  const sys = ((rotation & 3) | (buried ? 0x04 : 0)) & 0xFF;
  const add = (wrap ? (1 | ((paper & 0xF) << 2)) : 0) & 0xFF;   // type 1 = WrappingPaper
  let free;
  if (kind === 'tool' && durability != null) free = (durability & 0xFFFF) << 16;
  else if (kind === 'variable')              free = (variation & 7) | ((pattern & 0x7FF) << 5);
  else                                        free = Math.max(0, (count | 0) - 1) & 0xFFFFFFFF;
  free >>>= 0;
  const b = [idn & 0xFF, (idn >> 8) & 0xFF, sys, add,
             free & 0xFF, (free >> 8) & 0xFF, (free >> 16) & 0xFF, (free >> 24) & 0xFF];
  return '0x' + b.map(x => x.toString(16).padStart(2, '0').toUpperCase()).join('');
}

// Decode 8 bytes (16 hex chars, memory order) into all candidate fields;
// the caller picks count/variation/durability based on the item's kind.
export function decodeItem(hex) {
  if (!hex || hex.length < 16) return null;
  const by = i => parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  const id = ((by(1) << 8) | by(0)) & 0xFFFF;
  const itemId = id.toString(16).toUpperCase().padStart(4, '0');
  const sys = by(2), add = by(3);
  const free = ((by(7) << 24) | (by(6) << 16) | (by(5) << 8) | by(4)) >>> 0;
  const empty = itemId === 'FFFE';
  return {
    itemId, raw: free,
    rotation: sys & 3, buried: !!(sys & 0x04), dropped: !!(sys & 0x20),
    wrap: (add & 3) !== 0, paper: (add >> 2) & 0xF,
    count: empty ? 0 : (free & 0xFFFF) + 1,
    variation: free & 7,
    pattern: (free >> 5) & 0x7FF,
    durability: (free >> 16) & 0xFFFF,
  };
}

// Items with colour/style variations are customizable; everything else is stackable.
export function itemKind(idUpper, varSet) {
  return (varSet && varSet.has(idUpper)) ? 'variable' : 'stackable';
}

// ── Island / character name (live reads, ✓ verified on 3.0.3) ─────────────────
// Both names sit just before the player-1 inventory base, stored as UTF-16 LE
// (up to 10 chars). Offsets verified in-game by reading known values:
//   island name    @ ItemSlotBase − 0x2BA5C   (e.g. "rerrewoof")
//   character name @ ItemSlotBase − 0x2BA40   (= island + 0x1C, e.g. "Luna")
export const ISLAND_NAME_OFFSET    = 0x2BA5C;
export const CHARACTER_NAME_OFFSET = 0x2BA40;
export function islandNameAddr(base)    { return (base ?? ADDR.ItemSlotBase) - ISLAND_NAME_OFFSET; }
export function characterNameAddr(base) { return (base ?? ADDR.ItemSlotBase) - CHARACTER_NAME_OFFSET; }

// Decode a UTF-16 LE hex string (memory order) into text, stopping at NUL.
export function decodeUtf16le(hex, maxChars = 10) {
  let s = '';
  for (let i = 0; i < maxChars; i++) {
    const lo = parseInt(hex.slice(i * 4, i * 4 + 2), 16);
    const hi = parseInt(hex.slice(i * 4 + 2, i * 4 + 4), 16);
    if (isNaN(lo) || isNaN(hi)) break;
    const code = lo | (hi << 8);
    if (code === 0) break;
    s += String.fromCharCode(code);
  }
  return s;
}

// Accept only a clean, printable name (so an unreadable value shows "—", not garbage).
export function isCleanName(s) {
  if (!s || s.length === 0 || s.length > 10) return false;
  for (const ch of s) {
    const c = ch.codePointAt(0);
    if (c < 0x20) return false;                  // control chars
    if (c >= 0x7f && c <= 0xa0) return false;     // C1 / nbsp junk
    if (c === 0xfffd) return false;               // replacement char
  }
  return true;
}
