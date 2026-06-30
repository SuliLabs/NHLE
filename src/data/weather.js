// ACNH weather engine — faithful JS port of MeteoNook's algorithm
// (Treeki/MeteoNook, AGPL-3.0). Given the island weather seed it reproduces
// the game's weather, shooting stars, rainbows and auroras, and can search for
// a seed that yields a chosen weather on a chosen date.
import {
  EASTER_DAYS, EASTER_MONTHS, AUGUST_SUNDAYS,
  FISH_CON_JAN, FISH_CON_APR, FISH_CON_JUL, FISH_CON_OCT,
  INSECT_CON_JUN_N, INSECT_CON_JUL_N, INSECT_CON_AUG_N, INSECT_CON_SEP_N,
  INSECT_CON_JAN_S, INSECT_CON_FEB_S, INSECT_CON_NOV_S, INSECT_CON_DEC_S,
  RATE_LOOKUP_N, RATE_LOOKUP_S, RATE_MAPS, PATTERNS,
} from './weatherTables.js';

// Weather enum
export const W = { Clear: 0, Sunny: 1, Cloudy: 2, RainClouds: 3, Rain: 4, HeavyRain: 5 };
export const WEATHER_NAME = ['Clear', 'Sunny', 'Cloudy', 'Rain clouds', 'Rain', 'Heavy rain'];
// Hemisphere
export const HEMI = { Northern: 0, Southern: 1 };
// Pattern kinds
const K = { Fine: 0, Cloud: 1, Rain: 2, FineCloud: 3, CloudFine: 4, FineRain: 5, CloudRain: 6, RainCloud: 7, Commun: 8, EventDay: 9 };
// Special weather level
const SP = { None: 0, Rainbow: 1, Aurora: 2 };
const SNOW = { None: 0, Low: 1, Full: 2 };

/* ── 32-bit RNG (Random in lib.rs) ──────────────────────────────────── */
const mul32 = (a, b) => Math.imul(a, b) >>> 0;

class Random {
  constructor() { this.a = this.b = this.c = this.d = 0; }
  static withState(a, b, c, d) { const r = new Random(); r.a = a >>> 0; r.b = b >>> 0; r.c = c >>> 0; r.d = d >>> 0; return r; }
  static withSeed(seed) { const r = new Random(); r.init(seed >>> 0); return r; }
  init(seed) {
    seed = seed >>> 0;
    const m = 0x6c078965;
    this.a = (mul32(seed ^ (seed >>> 30), m) + 1) >>> 0;
    this.b = (mul32(this.a ^ (this.a >>> 30), m) + 2) >>> 0;
    this.c = (mul32(this.b ^ (this.b >>> 30), m) + 3) >>> 0;
    this.d = (mul32(this.c ^ (this.c >>> 30), m) + 4) >>> 0;
  }
  roll() {
    const n = (this.a ^ ((this.a << 11) >>> 0)) >>> 0;
    this.a = this.b; this.b = this.c; this.c = this.d;
    this.d = (((n ^ (n >>> 8)) >>> 0) ^ (this.d ^ (this.d >>> 19))) >>> 0;
    return this.d;
  }
  // limits used here are always small, so double math is exact
  rollMax(limit) { return Math.floor((this.roll() * limit) / 4294967296); }
}

/* ── seed helpers ───────────────────────────────────────────────────── */
function computeSeedYMD(base, ym, mm, dm, y, m, d) {
  const yy = mul32(ym, y), mmm = mul32(mm, m), dd = mul32(dm, d);
  return ((((base | 0x80000000) >>> 0) + yy + mmm + dd) >>> 0);
}
function computeSeedYMDH(base, ym, mm, dm, hm, y, m, d, h) {
  return ((computeSeedYMD(base, ym, mm, dm, y, m, d) + mul32(hm, h)) >>> 0);
}

/* ── calendar ───────────────────────────────────────────────────────── */
const MONTH_LEN = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
export function getMonthLength(y, m) { return ((y & 3) === 0 && m === 2) ? 29 : MONTH_LEN[m - 1]; }
function getNextDay(y, m, d) {
  d += 1;
  if (d > getMonthLength(y, m)) { d = 1; m += 1; if (m > 12) { m = 1; y += 1; } }
  return [y, m, d];
}
function normaliseLate(y, m, d, h) { return h < 5 ? getNextDay(y, m, d) : [y, m, d]; }
export function fromLinearHour(lh) { return lh < 5 ? 19 + lh : lh - 5; }
export function toLinearHour(h) { return h >= 19 ? h - 19 : h + 5; }

/* ── special (event) days → forced EventDay pattern ─────────────────── */
function isSpecialDay(hemi, y, m, d) {
  if (y >= 2000 && y <= 2060) {
    const i = y - 2000;
    if (y === 2020 && m === EASTER_MONTHS[i] && d === EASTER_DAYS[i]) return true; // Easter (2020 only)
    if (m === 1 && d === FISH_CON_JAN[i]) return true;
    if (m === 4 && d === FISH_CON_APR[i]) return true;
    if (m === 7 && d === FISH_CON_JUL[i]) return true;
    if (m === 10 && d === FISH_CON_OCT[i]) return true;
    if (hemi === HEMI.Northern) {
      if (m === 6 && d === INSECT_CON_JUN_N[i]) return true;
      if (m === 7 && d === INSECT_CON_JUL_N[i]) return true;
      if (m === 8 && d === INSECT_CON_AUG_N[i]) return true;
      if (m === 9 && d === INSECT_CON_SEP_N[i]) return true;
    } else {
      if (m === 1 && d === INSECT_CON_JAN_S[i]) return true;
      if (m === 2 && d === INSECT_CON_FEB_S[i]) return true;
      if (m === 11 && d === INSECT_CON_NOV_S[i]) return true;
      if (m === 12 && d === INSECT_CON_DEC_S[i]) return true;
    }
    if (m === 8 && (((d - 1) % 7) + 1) === AUGUST_SUNDAYS[i]) return true; // fireworks
  }
  if (m === 12 && d === 31) return true; // countdown
  return false;
}

/* ── seasonal levels ────────────────────────────────────────────────── */
export function getSnowLevel(hemi, m, d) {
  if (hemi === HEMI.Northern) {
    if (m === 11 && d >= 26) return SNOW.Low;
    if (m === 12 && d <= 10) return SNOW.Low;
    if (m === 12) return SNOW.Full;
    if (m === 1) return SNOW.Full;
    if (m === 2 && d <= 24) return SNOW.Full;
  } else {
    if (m === 5 && d >= 26) return SNOW.Low;
    if (m === 6 && d <= 10) return SNOW.Low;
    if (m === 6) return SNOW.Full;
    if (m === 7) return SNOW.Full;
    if (m === 8 && d <= 24) return SNOW.Full;
  }
  return SNOW.None;
}
export function getSpWeatherLevel(hemi, m, d) {
  if (hemi === HEMI.Northern) {
    if (m === 12 && d >= 11) return SP.Aurora;
    if (m === 1) return SP.Aurora;
    if (m === 2 && d <= 24) return SP.Aurora;
    if (m === 2 && d >= 25) return SP.Rainbow;
    if (m >= 3 && m <= 10) return SP.Rainbow;
    if (m === 11 && d <= 25) return SP.Rainbow;
  } else {
    if (m === 6 && d >= 11) return SP.Aurora;
    if (m === 7) return SP.Aurora;
    if (m === 8 && d <= 24) return SP.Aurora;
    if (m === 8 && d >= 25) return SP.Rainbow;
    if (m >= 9 && m <= 12) return SP.Rainbow;
    if (m >= 1 && m <= 4) return SP.Rainbow;
    if (m === 5 && d <= 25) return SP.Rainbow;
  }
  return SP.None;
}

/* ── patterns ───────────────────────────────────────────────────────── */
function patternKind(p) {
  if (p <= 6) return K.Fine;
  if (p <= 9) return K.Cloud;
  if (p <= 15) return K.Rain;
  if (p <= 18) return K.FineCloud;
  if (p <= 21) return K.CloudFine;
  if (p <= 25) return K.FineRain;
  if (p <= 28) return K.CloudRain;
  if (p <= 31) return K.RainCloud;
  if (p === 32) return K.Commun;
  return K.EventDay;
}
export function getWeather(hour, pattern) { return PATTERNS[pattern][hour]; }

export function getPattern(hemi, seed, y, m, d) {
  if (isSpecialDay(hemi, y, m, d)) return 33; // EventDay00
  const s = computeSeedYMD(seed, 0x2000000, 0x200000, 0x10000, y, m, d);
  const rng = Random.withSeed(s);
  rng.roll(); rng.roll();
  const rateSet = (hemi === HEMI.Northern ? RATE_LOOKUP_N : RATE_LOOKUP_S)[m - 1][d - 1];
  return RATE_MAPS[rateSet][rng.rollMax(100)];
}

function getRainbowInfo(hemi, seed, y, m, d, pattern) {
  if (getSpWeatherLevel(hemi, m, d) === SP.Rainbow) {
    const k = patternKind(pattern);
    if (k === K.CloudFine || k === K.FineRain) {
      const s = computeSeedYMD(seed, 0x1000000, 0x40000, 0x1000, y, m, d);
      const rng = Random.withSeed(s);
      rng.roll(); rng.roll();
      const count = (rng.roll() & 1) === 0 ? 1 : 2;
      for (let h = 7; h <= 17; h++) {
        const a = PATTERNS[pattern][h], b = PATTERNS[pattern][h + 1];
        if ((a === W.Rain || a === W.HeavyRain) && (b === W.Clear || b === W.Sunny))
          return { count, hour: h + 1 };
      }
    }
  }
  return { count: 0, hour: 0 };
}
function isAuroraPattern(hemi, m, d, pattern) {
  if (getSpWeatherLevel(hemi, m, d) === SP.Aurora)
    return pattern === 1 || pattern === 3 || pattern === 5; // Fine01/03/05
  return false;
}

/* ── shooting stars ─────────────────────────────────────────────────── */
function canHaveShootingStars(hour, pattern) {
  if (hour >= 19 || hour < 4) return pattern === 0 || pattern === 2 || pattern === 4 || pattern === 6;
  return false;
}
// returns {count, seconds:[...]} or null
function queryStarsInternal(seedBase, minute, pattern) {
  const rng = Random.withSeed((seedBase + minute * 0x100) >>> 0);
  let starCount;
  if (pattern === 0) { // Fine00 heavy shower
    if (rng.rollMax(100) >= 50) return null;
    starCount = rng.rollMax(100) < 50 ? 8 : 5;
  } else if (pattern === 2 || pattern === 4 || pattern === 6) { // light shower
    const chance = (minute & 1) === 0 ? 2 : 4;
    if (rng.rollMax(60) >= chance) return null;
    starCount = 5;
  } else return null;

  let field = 0n;
  let remaining = starCount;
  while (remaining > 0) {
    const bit = 1n << BigInt(rng.rollMax(60));
    if ((field & bit) === 0n) { field |= bit; remaining -= 1; }
  }
  const seconds = [];
  for (let s = 0; s < 60; s++) if ((field & (1n << BigInt(s))) !== 0n) seconds.push(s);
  return { count: starCount, seconds };
}
function collectStars(seed, y, m, d, pattern) {
  const nights = [];
  for (let lh = 0; lh < 9; lh++) {
    const hour = fromLinearHour(lh);
    if (!canHaveShootingStars(hour, pattern)) continue;
    const [ny, nm, nd] = normaliseLate(y, m, d, hour);
    const hourSeed = computeSeedYMDH(seed, 0x20000, 0x2000, 0x100, 0x10000, ny, nm, nd, hour);
    for (let minute = 0; minute < 60; minute++) {
      const r = queryStarsInternal(hourSeed, minute, pattern);
      if (r) nights.push({ hour, minute, count: r.count, seconds: r.seconds });
    }
  }
  return nights;
}

/* ── full-day forecast + classification ─────────────────────────────── */
export function forecastDay(hemi, seed, y, m, d) {
  const pattern = getPattern(hemi, seed, y, m, d);
  const kind = patternKind(pattern);
  const weather = PATTERNS[pattern];
  const snow = getSnowLevel(hemi, m, d) !== SNOW.None;
  const rainbow = getRainbowInfo(hemi, seed, y, m, d, pattern);
  const aurora = isAuroraPattern(hemi, m, d, pattern);
  const isShower = pattern === 0 || pattern === 2 || pattern === 4 || pattern === 6;
  const hasHeavy = weather.includes(W.HeavyRain);
  const rains = kind === K.Rain || kind === K.CloudRain || kind === K.RainCloud;

  let event = null;
  if (aurora) event = 'aurora';
  else if (rainbow.count > 0) event = 'rainbow';
  else if (isShower) event = 'shower';

  return {
    pattern, kind, weather, snow, rainbow, aurora, isShower, hasHeavy, rains,
    event,
    stars: isShower ? collectStars(seed, y, m, d, pattern) : [],
  };
}

/* ── target matching ────────────────────────────────────────────────── */
export const TARGETS = [
  { id: 'shower',    label: '★ Shooting stars', emoji: '🌠' },
  { id: 'rainbow',   label: 'Rainbow',          emoji: '🌈' },
  { id: 'aurora',    label: 'Aurora',           emoji: '🌌' },
  { id: 'sunny',     label: 'Sunny / clear',    emoji: '☀️' },
  { id: 'cloudy',    label: 'Cloudy',           emoji: '☁️' },
  { id: 'rain',      label: 'Rain',             emoji: '🌧️' },
  { id: 'heavyrain', label: 'Heavy rain',       emoji: '⛈️' },
  { id: 'snow',      label: 'Snow',             emoji: '❄️' },
];

function matches(info, target) {
  switch (target) {
    case 'shower':    return info.isShower;
    case 'rainbow':   return info.event === 'rainbow';
    case 'aurora':    return info.event === 'aurora';
    case 'sunny':     return info.kind === K.Fine;
    case 'cloudy':    return info.kind === K.Cloud;
    case 'rain':      return info.rains && !info.snow;
    case 'heavyrain': return info.hasHeavy && !info.snow;
    case 'snow':      return info.rains && info.snow;
    default:          return false;
  }
}

// Reasons a target is impossible on a given date regardless of seed.
// Returns a short code ('special'|'aurora'|'rainbow'|'snow') or null — the UI
// translates it (i18n key feas_<code>).
export function targetFeasibility(hemi, y, m, d, target) {
  if (isSpecialDay(hemi, y, m, d)) return 'special';
  const sp = getSpWeatherLevel(hemi, m, d);
  if (target === 'aurora'  && sp !== SP.Aurora)  return 'aurora';
  if (target === 'rainbow' && sp !== SP.Rainbow) return 'rainbow';
  if (target === 'snow'    && getSnowLevel(hemi, m, d) === SNOW.None) return 'snow';
  return null;
}

/**
 * Search for a seed that produces `target` weather on the given date.
 * Random sampling; returns { seed, info } or null. onProgress(tried,max).
 */
export function findSeed(hemi, y, m, d, target, { maxTries = 3_000_000, sample = true } = {}) {
  let seed = (Math.random() * 4294967296) >>> 0;
  for (let i = 0; i < maxTries; i++) {
    const s = sample ? ((Math.random() * 4294967296) >>> 0) : ((seed + i) >>> 0);
    const info = forecastDay(hemi, s, y, m, d);
    if (matches(info, target)) return { seed: s, info };
  }
  return null;
}
