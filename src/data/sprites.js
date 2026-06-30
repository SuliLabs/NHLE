// Local sprite resolver. Icons live at <userData>/SPR/img/<Name>.png after the
// bundled SPR.zip is unpacked. The pack uses a few different filename schemes:
//   • plain furniture / money / critters …… <iName>.png            (FtrCucumberHorse)
//   • remakeable furniture …………………………… <iName>_Remake_<body>_<pattern>.png (FtrBabybed_Remake_0_0)
//   • clothing / accessories with variants … <iName><variation>.png (AccessoryGlassBirthday0)
//
// Rather than probe disk with 404s, we load the full list of basenames once and
// pick the right one. Icons are served via the custom "spr://" scheme (a plain
// file:// <img> is blocked from the dev http://localhost origin).

let SPRITES_DIR = null;
let AVAILABLE = null;   // Set<string> of basenames (no .png), or null until loaded

export function setSpritesDir(dir) {
  SPRITES_DIR = dir || null;
  try { if (dir) localStorage.setItem('nhle.spritesDir', dir); } catch {}
}

export function getSpritesDir() {
  if (SPRITES_DIR) return SPRITES_DIR;
  try { SPRITES_DIR = localStorage.getItem('nhle.spritesDir') || null; } catch {}
  return SPRITES_DIR;
}

// Pull the filename index from the main process. Call once after the user opts
// into images and before the editor renders.
export async function loadSpriteIndex() {
  try {
    const res = await window.sysbot?.sprites?.names?.();
    if (res?.ok && Array.isArray(res.data)) AVAILABLE = new Set(res.data);
  } catch { /* leave AVAILABLE null → fall back to onError probing */ }
  return AVAILABLE;
}

function sprUrl(name) {
  return `spr://img/${encodeURIComponent(name)}.png`;
}

// Ordered candidate basenames for an item icon, covering every naming scheme.
// `variation` = body type (0-7) / clothing variant; `pattern` = remake pattern.
export function spriteCandidates(internal, variation, pattern) {
  if (!internal || !getSpritesDir()) return [];
  const v = (variation != null && variation >= 0) ? variation : 0;
  const p = (pattern   != null && pattern   >= 0) ? pattern   : 0;
  const tries = [
    `${internal}_Remake_${v}_${p}`,  // exact remake (body + pattern)
    `${internal}_Remake_${v}_0`,     // remake body, default pattern
    `${internal}_Remake_0_0`,        // remake default (list view, no variant)
    `${internal}${v}`,               // clothing/accessory variant
    `${internal}0`,                  // generic variant 0
    internal,                        // plain
  ];
  const uniq = [...new Set(tries)];
  if (AVAILABLE) {
    const hit = uniq.find(n => AVAILABLE.has(n));
    return hit ? [sprUrl(hit)] : [];   // exactly one URL, no wasted requests
  }
  return uniq.map(sprUrl);             // index not loaded → let <img> onError probe
}
