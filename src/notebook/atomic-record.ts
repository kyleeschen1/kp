/** A validated IndexedDB record. The whole read/change/write is one transaction,
 * so two editors cannot both commit against the same previous revision. */
export async function openAtomicRecord<T>(database: string, parse: (value: unknown) => T, seed: T, storeName = 'workspace', key = 'documents') {
  const db = await new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(database, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(storeName);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    request.onblocked = () => reject(new Error('Storage is open in an incompatible tab. Close that tab and retry.'));
  });
  let closed = false;
  const close = () => { if (!closed) { closed = true; db.close(); } };
  db.onversionchange = close;
  const write = (change: (current: unknown) => T) => new Promise<void>((resolve, reject) => {
    if (closed) { reject(new Error('Storage is closed.')); return; }
    const tx = db.transaction(storeName, 'readwrite'), store = tx.objectStore(storeName), request = store.get(key);
    let failure: unknown;
    request.onsuccess = () => { try { store.put(parse(change(request.result)), key); } catch (error) { failure = error; tx.abort(); } };
    tx.oncomplete = () => resolve();
    tx.onabort = () => reject(failure ?? tx.error ?? new Error('Save aborted.'));
    tx.onerror = () => { failure ??= tx.error; };
  });
  try { await write(value => value === undefined ? seed : parse(value)); } catch (error) { close(); throw error; }
  return {
    read: () => new Promise<T>((resolve, reject) => {
      if (closed) { reject(new Error('Storage is closed.')); return; }
      const request = db.transaction(storeName, 'readonly').objectStore(storeName).get(key);
      request.onsuccess = () => { try { resolve(parse(request.result)); } catch (error) { reject(error); } };
      request.onerror = () => reject(request.error);
    }),
    change: (change: (current: T) => T) => write(value => change(parse(value))), close
  };
}
