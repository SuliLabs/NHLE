// All addresses are heap-relative (use peek/poke), unless marked [MAIN] (use peekMain/pokeMain)
// Drop-on-map constants (heap-relative)  [? unverified for 3.0.2]
export const MAP_ACTIVATE     = 0xB12F28C0;  // = 0xB127A8C0 + 0xD8000
export const SAVE_FILE_BUFFER = 0x9B0EB0;
export const MAP_SLOT_COUNT   = 96;          // = 0x600 / 16 items in the left layer active zone
//
// Verification status for ACNH 3.0.3
//   ✓ CONFIRMED: address validated by reading expected value from live Switch
//   ? UNVERIFIED: address from ACNHPokerCore/community; needs in-game confirmation
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
  Collision:       0x02219120,   // ✓ CONFIRMED 3.0.3: reads B95BF800 (CollisionEnable)
  ActorCollision:  0x0221965C,   // ✓ CONFIRMED 3.0.3: reads 1E2E1000 (ActorCollisionEnable)
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

// Build 8-byte poke value for an item slot
// Layout in memory: [id_low, id_high, variation, 0x00, cnt_b0, cnt_b1, cnt_b2, cnt_b3]
// count is human-facing (1 = 1 item); stored as (count-1) per ACNH 3.0.3 encoding
export function buildItemBytes(itemId, count = 1, variation = 0) {
  const id = itemId.replace(/^0x/i, '').padStart(4, '0').toUpperCase();
  const idField = id.slice(2) + id.slice(0, 2) +
                  variation.toString(16).padStart(2, '0').toUpperCase() + '00';
  const cnt = flipHex(Math.max(0, count - 1).toString(16).padStart(8, '0'));
  return '0x' + idField + cnt;
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

export const TURNIP_DAYS = ['Mon AM','Mon PM','Tue AM','Tue PM','Wed AM','Wed PM','Thu AM','Thu PM','Fri AM','Fri PM','Sat AM','Sat PM'];

export const AIRPORT_COLORS = ['Yellow','Blue','Orange','Green','Red','Purple'];
