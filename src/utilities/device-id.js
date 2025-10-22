// src/utilities/device-id.js
// Production-ready device ID generator for screen-based web apps.
// - Stable across reboots
// - Regenerated only if localStorage is cleared
// - Uses SHA-256 of a browser fingerprint + random suffix
// - Graceful fallbacks when crypto APIs are unavailable

const STORAGE_KEY = 'screen.deviceId';
const LEGACY_STORAGE_KEY = 'tv.deviceId';

let cachedId = null;
let pending = null; // dedupe concurrent calls

function safeLocalStorageGet(key) {
    try {
        return localStorage.getItem(key);
    } catch (_) {
        return null;
    }
}

function safeLocalStorageSet(key, value) {
    try {
        localStorage.setItem(key, value);
        return true;
    } catch (_) {
        return false;
    }
}

function safeLocalStorageRemove(key) {
    try {
        localStorage.removeItem(key);
        return true;
    } catch (_) {
        return false;
    }
}

function getFingerprintString() {
    try {
        const ua = (typeof navigator !== 'undefined' && navigator.userAgent) || '';
        const lang = (typeof navigator !== 'undefined' && navigator.language) || '';
        const plat = (typeof navigator !== 'undefined' && navigator.platform) || '';
        const tz = (typeof Intl !== 'undefined' && Intl.DateTimeFormat && Intl.DateTimeFormat().resolvedOptions().timeZone) || '';
        const sw = (typeof screen !== 'undefined' && screen.width) || 0;
        const sh = (typeof screen !== 'undefined' && screen.height) || 0;
        const sc = (typeof screen !== 'undefined' && screen.colorDepth) || 0;
        return [ua, lang, plat, tz, sw, sh, sc].join('|');
    } catch (_) {
        return 'unknown';
    }
}

function toHex(buffer) {
    const bytes = buffer instanceof ArrayBuffer ? new Uint8Array(buffer) : buffer;
    let out = '';
    for (let i = 0; i < bytes.length; i++) {
        out += bytes[i].toString(16).padStart(2, '0');
    }
    return out;
}

function encodeUTF8(str) {
    if (typeof TextEncoder !== 'undefined') {
        return new TextEncoder().encode(str);
    }
    // Fallback for very old engines
    const s = unescape(encodeURIComponent(str));
    const arr = new Uint8Array(s.length);
    for (let i = 0; i < s.length; i++) arr[i] = s.charCodeAt(i);
    return arr;
}

async function sha256Hex(input) {
    try {
        if (typeof crypto !== 'undefined' && crypto.subtle && crypto.subtle.digest) {
            const data = encodeUTF8(input);
            const hash = await crypto.subtle.digest('SHA-256', data);
            return toHex(hash);
        }
    } catch (_) {
        // fall through to fallback
    }
    // Fallback: non-crypto simple hash (deterministic, weaker)
    let h1 = 0x811c9dc5;
    const data = encodeUTF8(input);
    for (let i = 0; i < data.length; i++) {
        h1 ^= data[i];
        h1 += (h1 << 1) + (h1 << 4) + (h1 << 7) + (h1 << 8) + (h1 << 24);
        h1 >>>= 0;
    }
    return h1.toString(16).padStart(64, '0');
}

function randomHex(nBytes) {
    const arr = new Uint8Array(nBytes);
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
        crypto.getRandomValues(arr);
    } else {
        for (let i = 0; i < nBytes; i++) arr[i] = Math.floor(Math.random() * 256);
    }
    return toHex(arr);
}

async function computeId() {
    const fp = getFingerprintString();
    const hash = await sha256Hex(fp); // 64 hex chars
    const first16 = hash.slice(0, 16);
    const suffix = randomHex(4); // 4 bytes => 8 hex chars
    return `fp-${first16}-${suffix}`;
}

export async function getDeviceId(options = {}) {
    const { persist = false } = options;
    if (cachedId) return cachedId;

    // Dedupe concurrent calls
    if (pending) return pending;

    // Migration: move legacy key to new key once
    const legacy = safeLocalStorageGet(LEGACY_STORAGE_KEY);
    if (legacy && !safeLocalStorageGet(STORAGE_KEY)) {
        safeLocalStorageSet(STORAGE_KEY, legacy);
        safeLocalStorageRemove(LEGACY_STORAGE_KEY);
    }

    const fromStorage = safeLocalStorageGet(STORAGE_KEY);
    if (fromStorage) {
        cachedId = fromStorage;
        return cachedId;
    }

    pending = (async () => {
        try {
            const id = await computeId();
            // Only persist when explicitly requested
            if (persist) {
                safeLocalStorageSet(STORAGE_KEY, id);
            }
            cachedId = id; // cache in-memory for this session
            return id;
        } catch (e) {
            // Graceful fallback
            const fallback = `fp-${randomHex(8)}-${randomHex(4)}`;
            cachedId = fallback;
            return fallback;
        } finally {
            pending = null;
        }
    })();

    return pending;
}

export function persistDeviceId(id) {
    if (!id) return false;
    const ok = safeLocalStorageSet(STORAGE_KEY, id);
    if (ok) cachedId = id;
    return ok;
}

export default getDeviceId;
