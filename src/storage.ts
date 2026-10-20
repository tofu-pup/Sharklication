import { createInitialSave, type SaveEnvelope } from "./domain";
import { migrateSave, validateBackup } from "./validation";

export interface ProgressStorage {
  load(): Promise<SaveEnvelope>;
  save(data: SaveEnvelope, expectedRevision: number): Promise<SaveEnvelope>;
}
const DATABASE = "sharklication";
function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE, 1);
    request.onupgradeneeded = () => request.result.createObjectStore("progress");
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Cannot open device storage."));
    request.onblocked = () => reject(new Error("Another Sharklication tab is blocking storage. Close it and retry."));
  });
}
export const storage: ProgressStorage = {
  async load() {
    const db = await openDatabase();
    try {
      const value = await new Promise<unknown>((resolve, reject) => {
        const tx = db.transaction("progress", "readonly");
        const request = tx.objectStore("progress").get("current");
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error ?? new Error("Cannot read saved progress."));
      });
      return value === undefined ? createInitialSave() : migrateSave(value);
    } finally { db.close(); }
  },
  async save(data, expectedRevision) {
    const saved = validateBackup({ ...data, revision: expectedRevision + 1 });
    const db = await openDatabase();
    try {
      return await new Promise<SaveEnvelope>((resolve, reject) => {
        const tx = db.transaction("progress", "readwrite");
        const store = tx.objectStore("progress");
        const read = store.get("current");
        let failure = "";
        read.onsuccess = () => {
          try {
            const current: unknown = read.result;
            if (current !== undefined && migrateSave(current).revision !== expectedRevision) {
              failure = "Progress changed in another tab. Reload to continue safely; this answer was not saved.";
              tx.abort();
            } else store.put(saved, "current");
          } catch (error) {
            failure = error instanceof Error ? error.message : "Existing storage could not be validated.";
            tx.abort();
          }
        };
        tx.oncomplete = () => resolve(saved);
        tx.onerror = () => reject(tx.error ?? new Error("Progress could not be saved. Export a backup and free device storage."));
        tx.onabort = () => reject(new Error(failure || "Saving was interrupted. Your previous progress is safe. Try again or export a backup."));
      });
    } finally { db.close(); }
  },
};
