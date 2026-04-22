import { openDB } from 'idb';

// Database configuration
const DB_NAME = 'NexNoteDB';
const DB_VERSION = 1;

// Initialize database - creates tables (called "stores" in IndexedDB)
export const initDB = async () => {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Store 1: 'notes' - caches all user notes for offline reading
      // Think of this as a local copy of your MongoDB notes collection
      if (!db.objectStoreNames.contains('notes')) {
        const noteStore = db.createObjectStore('notes', { keyPath: '_id' });
        noteStore.createIndex('updatedAt', 'updatedAt');
      }
      
      // Store 2: 'pendingActions' - queues operations done while offline
      // Examples: "create note X", "delete note Y", "update note Z"
      if (!db.objectStoreNames.contains('pendingActions')) {
        const actionStore = db.createObjectStore('pendingActions', { 
          keyPath: 'id', 
          autoIncrement: true 
        });
        actionStore.createIndex('type', 'type');
        actionStore.createIndex('timestamp', 'timestamp');
      }
      
      // Store 3: 'syncStatus' - tracks last sync time
      // Simple key-value store: { key: 'lastSync', value: '2024-01-01T00:00:00Z' }
      if (!db.objectStoreNames.contains('syncStatus')) {
        db.createObjectStore('syncStatus', { keyPath: 'key' });
      }
    },
  });
};

// Save notes to local cache
// Called after successful API fetch
export const cacheNotes = async (notes) => {
  const db = await initDB();
  const tx = db.transaction('notes', 'readwrite');
  
  // Clear old cache first (avoid stale data)
  await tx.objectStore('notes').clear();
  
  // Save each note individually
  for (const note of notes) {
    await tx.objectStore('notes').put(note);
  }
  
  await tx.done;
};

// Get cached notes for offline display
// Returns notes sorted by most recent first
export const getCachedNotes = async () => {
  const db = await initDB();
  const notes = await db.getAllFromIndex('notes', 'updatedAt');
  return notes.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
};

// Queue an action for later sync
// Called when user does something while offline
export const queueAction = async (action) => {
  const db = await initDB();
  const pendingStore = db.transaction('pendingActions', 'readwrite').objectStore('pendingActions');
  
  await pendingStore.add({
    ...action,
    timestamp: new Date().toISOString(),
    synced: false
  });
};

// Get all pending actions (to sync when back online)
export const getPendingActions = async () => {
  const db = await initDB();
  return db.getAllFromIndex('pendingActions', 'timestamp');
};

// Remove action after successful sync
export const removePendingAction = async (actionId) => {
  const db = await initDB();
  await db.delete('pendingActions', actionId);
};

// Record successful sync time
export const setLastSync = async () => {
  const db = await initDB();
  await db.put('syncStatus', { key: 'lastSync', value: new Date().toISOString() });
};

// Get last sync time (for UI display)
export const getLastSync = async () => {
  const db = await initDB();
  const result = await db.get('syncStatus', 'lastSync');
  return result?.value || null;
};

// Clear all offline data (on logout)
export const clearOfflineData = async () => {
  const db = await initDB();
  await db.clear('notes');
  await db.clear('pendingActions');
  await db.clear('syncStatus');
};

// Get count of pending actions (for badge)
export const getPendingCount = async () => {
  const actions = await getPendingActions();
  return actions.length;
};