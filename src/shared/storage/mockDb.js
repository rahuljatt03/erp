/**
 * Generic, localStorage-backed collection store.
 *
 * This is the ONE place that knows data is currently mocked. Every module's
 * service builds on `createCollection`, so when a real backend arrives we only
 * rewrite the module services (to call `fetch`) — components and hooks, which
 * depend on the async service interface, stay untouched.
 *
 * Reusable for every future module: products, inventory, BOM, production, etc.
 *
 * @template {{ id: string }} T
 * @typedef {object} Collection
 * @property {() => T[]} getAll
 * @property {(id: string) => T | undefined} getById
 * @property {(item: T) => T} insert
 * @property {(id: string, patch: Partial<T>) => T} update
 * @property {(id: string) => void} remove
 */

const STORAGE_NAMESPACE = 'erp';

/**
 * @template {{ id: string }} T
 * @param {string} name unique collection name (becomes the storage key)
 * @param {T[]} [seed] initial records used the first time the app runs
 * @returns {Collection<T>}
 */
export function createCollection(name, seed = []) {
  const storageKey = `${STORAGE_NAMESPACE}:${name}`;

  function read() {
    const raw = safeGet(storageKey);
    if (raw !== null) {
      try {
        return JSON.parse(raw);
      } catch {
        // Corrupt payload — fall through and re-seed.
      }
    }
    write(seed);
    return [...seed];
  }

  function write(items) {
    safeSet(storageKey, JSON.stringify(items));
  }

  return {
    getAll() {
      return read();
    },

    getById(id) {
      return read().find((item) => item.id === id);
    },

    insert(item) {
      const items = read();
      items.push(item);
      write(items);
      return item;
    },

    update(id, patch) {
      const items = read();
      const index = items.findIndex((item) => item.id === id);
      if (index === -1) {
        throw new Error(`[${name}] record not found: ${id}`);
      }
      const updated = { ...items[index], ...patch, id };
      items[index] = updated;
      write(items);
      return updated;
    },

    remove(id) {
      const items = read().filter((item) => item.id !== id);
      write(items);
    },
  };
}

/** localStorage can throw (private mode, quota). Degrade gracefully. */
function safeGet(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSet(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Ignore — data simply won't persist across reloads in this environment.
  }
}
