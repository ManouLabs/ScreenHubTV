// Utilities for persisting the device ID locally

const DEVICE_ID_STORAGE_KEY = 'screen.device_id';

/**
 * Persist the assigned device ID to localStorage (best-effort).
 * Returns the same id for chaining.
 *
 * @param {string} id
 * @returns {string}
 */
export function persistDeviceId(id) {
    try {
        if (typeof window !== 'undefined' && window.localStorage && id) {
            window.localStorage.setItem(DEVICE_ID_STORAGE_KEY, String(id));
        }
    } catch (_) {
        // ignore storage errors (private mode, quotas, etc.)
    }
    return id;
}

/**
 * Read the persisted device ID if available; returns null if not found.
 * Not required by onboarding, but useful elsewhere.
 */
export function readPersistedDeviceId() {
    try {
        if (typeof window !== 'undefined' && window.localStorage) {
            return window.localStorage.getItem(DEVICE_ID_STORAGE_KEY);
        }
    } catch (_) {
        // ignore
    }
    return null;
}
