// All addresses are heap-relative (use peek/poke), unless marked [MAIN] (use peekMain/pokeMain)
// Drop-on-map constants (heap-relative)  [? unverified for 3.0.2]
export const MAP_ACTIVATE     = 0xB12F28C0;  // = 0xB127A8C0 + 0xD8000
export const SAVE_FILE_BUFFER = 0x9B0EB0;
export const MAP_SLOT_COUNT   = 96;          // = 0x600 / 16 items in the left layer active zone
//
// Verification status for ACNH 3.0.3
//   ✓ CONFIRMED: address validated by reading expected value from live Switch
//   ? UNVERIFIED: address from community research; needs in-game confirmation
//   ✗ WRONG: confirmed incorrect — address shifted in 3.0.3, correct value unknown
// Count encoding: item count stored as (quantity - 1). 1 item = 0, 2 items = 1, etc.

export const ADDR = {
  // Inventory: slots 1-20 start here, each slot = 8 bytes  [✓ CONFIRMED 3.0.3]
  ItemSlotBase:    0xB29BB758,
  // Inventory: slots 21-40 start here                       [✓ CONFIRMED 3.0.3]
  ItemSlot21Base:  0xB29BB758 - 0xB8,  // = 0xB29BB6A0

  // Home storage (closet, 512 slots)                       [✓ CONFIRMED 3.0.3]
  HomeStorageBase: 0xB040C7C0,

  // Recycling box (20 slots)                               [✓ CONFIRMED 3.0.3 — in-game verified]
  RecyclingBase:   0xB1BC40D0,

  // Villagers (10 slots, each VillagerSize bytes)           [~ tentative 3.0.3 — +0x200000 shift]
  VillagerBase:    0xB124B4E0,
  VillagerSize:    0x13230,

  // Map                                                     [✓ CONFIRMED 3.0.3]
  MapBase:         0xB147A8C0,
  AirportColor:    0xB147A8C0 + 0x3468C0,

  // Turnips                                                 [✓ CONFIRMED 3.0.3]
  TurnipBuyPrice:  0xB16DBB30,   // u32 LE
  TurnipSellBase:  0xB16DBB30 + 0xC,  // 12 u32 values (Mon-Sat AM/PM)

  // Weather                                                 [✓ CONFIRMED 3.0.3]
  WeatherSeed:     0xB122EAD8,   // u32

  // Coordinates                                             [? unverified]
  Coordinate:      0x3E7B1288,   // float32 x,y,z

  // Players (Player1 = ItemSlotBase)
  PlayerOffset:    0x131F70,

  // [MAIN] Collision & time — use pokeMain
  // ✗ Collision/ActorCollision: the read value matches 3.0.2, but writing the
  //   2.x patch CRASHES the game on 3.0.3 — NOT a working cheat, kept out of the UI.
  Collision:       0x02219120,   // reads B95BF800 but patch crashes on 3.0.3
  ActorCollision:  0x0221965C,   // reads 1E2E1000 but patch crashes on 3.0.3
  FreezeTime:      0x00981B28,   // ✓ CONFIRMED 3.0.3: reads F9203260 (unfreezeTime)

  // [MAIN] Speed — use pokeMain    [✗ WRONG: 2.x address is beyond the 3.0.3 NSO; needs re-scan]
  MaxWalkSpeed:    0x0BFB4F34,   // 2.x addr ~191MB into NSO; 3.0.3 NSO ends ~0x6C80000 — see docs/OFFSETS.md
  JumpDistance:    0x0BFB4F34 + 0x630,
  DiveTime:        0x0BFB4F34 + 0xCC0,
  SwimSpeed:       0x0BFB4F34 + 0x11D0,
  DiveSpeed:       0x0BFB4F34 + 0x1320,

  // [MAIN] Shop                                            [✗ WRONG: address shifted in 3.0.3]
  Shop:            0x01B063E0,   // 2.x value — needs re-scan for 3.0.3

  // Dodo code                                              [? unverified]
  DodoCode:        0xAC1B164,
};

// Speed values (bytes to write with pokeMain)
export const SPEED = {
  x1:   '0000A03F',
  x2:   '00002040',
  x3:   '00007040',
  x5:   '0000C840',
  x100: '0000FA42',
};

export const PHYSICS = {
  collisionOff: '12800000',
  collisionOn:  'B95BF800',
  actorColOff:  '1E3E1000',
  actorColOn:   '1E2E1000',
  freezeTime:   'D503201F',
  unfreezeTime: 'F9203260',
  shopOpen:     '52800020',
  shopNormal:   '2A1F03E0',
  jumpFar:      '0000AF43',
  jumpDefault:  '00000C42',
  diveInfinite: 'FFFFFFFF',
  diveDefault:  '000000DC',
  swimFast:     '00000040',
  swimDefault:  '1F85EB3E',
};

// Calculate address for inventory slot (1-indexed).
// Uses runtime-discovered base if set (via memory scan), falls back to hardcoded address.
export function getSlotAddress(slot, overrideBase) {
  const base = overrideBase ?? ADDR.ItemSlotBase;
  if (slot <= 20) return base + (slot - 1) * 8;
  return (base - 0xB8) + (slot - 21) * 8;  // slot21base = base - Slot21Offset(0xB8)
}

// Flip hex string bytes to little-endian (4 or 8 char input)
export function flipHex(hex) {
  hex = hex.padStart(8, '0');
  return hex[6]+hex[7] + hex[4]+hex[5] + hex[2]+hex[3] + hex[0]+hex[1];
}

// Build 32-char (16-byte) floor item left-layer entry
// itemId4: 4-char hex item ID, quantity: 1-99
export function buildDropLeft(itemId4, quantity) {
  const id = itemId4.padStart(4, '0').toUpperCase();
  const idF = id.slice(2) + id.slice(0, 2);  // swap bytes
  const cnt = Math.max(0, quantity - 1).toString(16).padStart(8, '0').toUpperCase();
  const cntF = cnt.slice(6) + cnt.slice(4, 6) + cnt.slice(2, 4) + cnt.slice(0, 2);
  return idF + '0000' + cntF + 'FDFF0000' + idF + '0001';
}

// Build 32-char (16-byte) floor item right-layer entry
export function buildDropRight(itemId4) {
  const id = itemId4.padStart(4, '0').toUpperCase();
  const idF = id.slice(2) + id.slice(0, 2);
  return 'FDFF0000' + idF + '0100' + 'FDFF0000' + idF + '0101';
}

// Legacy 8-byte builder kept for callers that only need id+count.
// Prefer buildItem() which encodes the full ACNH item struct.
export function buildItemBytes(itemId, count = 1, variation = 0) {
  return buildItem(itemId, { count, variation, kind: variation ? 'variable' : 'stackable' });
}

// ── Full ACNH item struct (8 bytes), per NHSE Item.cs ─────────────────
//  [0..1] ItemId  u16 LE
//  [2]    SystemParam : rotation(bits0-1), buried 0x04, dropped 0x20
//  [3]    AdditionalParam : wrap type(bits0-1) + paper(bits2-5) + showItem 0x40
//  [4..7] FreeParam u32, interpreted by kind:
//           stackable → Count (stored as count-1 on 3.0.3)
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

// Decode 8 bytes (16 hex chars, memory order) into all candidate fields.
// The caller picks count/variation/durability based on the item's kind.
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

// Heuristic kind: items with colour/style variations are customizable;
// everything else defaults to stackable (tools use the durability field).
export function itemKind(idUpper, varSet) {
  return (varSet && varSet.has(idUpper)) ? 'variable' : 'stackable';
}

// Parse items CSV (format: "id ; iName ; eng ; jpn ; ...")
export function parseItemsCSV(text) {
  const lines = text.split('\n').slice(1); // skip header
  const items = [];
  for (const line of lines) {
    const parts = line.split(' ; ');
    if (parts.length < 3) continue;
    const id  = parts[0].trim();
    const eng = parts[2].trim();
    if (id && eng) items.push({ id, eng, internal: parts[1]?.trim() });
  }
  return items;
}

export function parseRecipesCSV(text) {
  const lines = text.split('\n').slice(1);
  const items = [];
  for (const line of lines) {
    const parts = line.split(' ; ');
    if (parts.length < 3) continue;
    const id  = parts[0].trim();
    const eng = parts[2].trim();
    if (id && eng) items.push({ id, eng, internal: parts[1]?.trim() });
  }
  return items;
}

// Returns a Set of item IDs that have color/style variations
export function parseVariationsCSV(text) {
  const lines = text.split('\n').slice(1);
  const ids = new Set();
  for (const line of lines) {
    const id = line.split(' ; ')[0]?.trim();
    if (id) ids.add(id.toUpperCase());
  }
  return ids;
}

// ── Island / character name (live, self-validating reads) ────────────────────
// The town/island name sits 0x2BA60 bytes before the player-1 inventory base
// (InventoryNameOffset from community research; +0x200000 shift already baked
// into the confirmed 3.0.3 base). It is stored as UTF-16 LE, up to 10 chars.
export const ISLAND_NAME_OFFSET = 0x2BA60;
export function islandNameAddr(base) { return (base ?? ADDR.ItemSlotBase) - ISLAND_NAME_OFFSET; }

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

// Accept only a clean, printable name (so an unverified read shows "—", not garbage).
export function isCleanName(s) {
  if (!s || s.length === 0 || s.length > 10) return false;
  for (const ch of s) {
    const c = ch.codePointAt(0);
    if (c < 0x20) return false;                 // control chars
    if (c >= 0x7f && c <= 0xa0) return false;    // C1 / nbsp junk
    if (c === 0xfffd) return false;              // replacement char
  }
  return true;
}

export const TURNIP_DAYS = ['Mon AM','Mon PM','Tue AM','Tue PM','Wed AM','Wed PM','Thu AM','Thu PM','Fri AM','Fri PM','Sat AM','Sat PM'];

export const AIRPORT_COLORS = ['Yellow','Blue','Orange','Green','Red','Purple'];
