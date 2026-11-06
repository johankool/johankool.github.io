// The zone's records kept in this browser (IndexedDB), with the change token they're up to date with,
// so a later visit shows them right away and only fetches what changed since. That matters most for
// the owner, whose private zone holds all their matches.
//
// Entries are per Apple ID and zone, and all of them go when signing out. Without IndexedDB (private
// browsing, blocked storage) the page works as before, loading everything each time.

const databaseName = "tournament-cache";
const storeName = "zones";

let opening;

function open() {
  opening ??= new Promise((resolve, reject) => {
    const request = indexedDB.open(databaseName, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(storeName);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  return opening;
}

function transaction(mode, work) {
  return open().then((db) => new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, mode);
    const request = work(tx.objectStore(storeName));
    tx.oncomplete = () => resolve(request?.result);
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  }));
}

/** `{ records, changeToken }` for the key, or null. */
export async function readZone(key) {
  try {
    return (await transaction("readonly", (store) => store.get(key))) ?? null;
  } catch {
    return null;
  }
}

export async function writeZone(key, { records, changeToken }) {
  try {
    await transaction("readwrite", (store) => store.put({ records, changeToken, savedAt: Date.now() }, key));
  } catch {
    // Not cached: the next visit loads everything again.
  }
}

export async function removeZone(key) {
  try {
    await transaction("readwrite", (store) => store.delete(key));
  } catch {
    // Nothing to remove.
  }
}

/** Forgets everything, e.g. when signing out on a shared computer. */
export async function clearAll() {
  try {
    await transaction("readwrite", (store) => store.clear());
  } catch {
    // Nothing to clear.
  }
}
