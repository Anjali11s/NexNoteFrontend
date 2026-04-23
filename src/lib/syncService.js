import api from './axios';
import { getPendingActions, removePendingAction, setLastSync, getCachedNotes, cacheNotes } from './offlineStorage';
import toast from 'react-hot-toast';

let isSyncing = false;
let isListenerInitialized = false;
let onlineCallbacks = [];
let offlineCallbacks = [];

// Track mapping between offline IDs and real IDs
const idMapping = new Map();

// Process all pending actions in order
export const syncPendingActions = async () => {
  if (isSyncing) {
    console.log('Sync already in progress, skipping...');
    return;
  }
  
  if (!navigator.onLine) {
    console.log('Offline, skipping sync');
    return;
  }
  
  isSyncing = true;
  
  try {
    const pendingActions = await getPendingActions();
    
    if (pendingActions.length === 0) {
      isSyncing = false;
      return;
    }
    
    console.log(`📡 Syncing ${pendingActions.length} pending actions...`);
    
    // First, process CREATE actions to get real IDs
    const createActions = pendingActions.filter(a => a.type === 'CREATE_NOTE');
    const otherActions = pendingActions.filter(a => a.type !== 'CREATE_NOTE');
    
    // Process all CREATE actions first
    for (const action of createActions) {
      try {
        console.log(`📝 Creating note: "${action.data.title}"`);
        const response = await api.post('/notes', action.data);
        console.log(`✅ Created note with real ID: ${response.data._id}`);
        
        // Store the mapping from offline ID to real ID
        idMapping.set(action.tempId, response.data._id);
        
        // Update local cache: replace offline note with real note
        const cachedNotes = await getCachedNotes();
        const updatedCache = cachedNotes.map(note => {
          if (note._id === action.tempId) {
            return { ...response.data, isOffline: false };
          }
          return note;
        });
        await cacheNotes(updatedCache);
        
        // Remove the CREATE action from queue
        await removePendingAction(action.id);
        
      } catch (error) {
        console.error(`❌ Failed to create note:`, error);
        // Keep the action for retry
      }
    }
    
    // Now process UPDATE, DELETE, PIN actions with ID mapping
    for (const action of otherActions) {
      try {
        // Check if this action uses an offline ID that now has a real mapping
        let realId = action.noteId;
        
        // If the noteId is an offline ID and we have a mapping, use the real ID
        if (action.noteId && action.noteId.startsWith('offline_') && idMapping.has(action.noteId)) {
          realId = idMapping.get(action.noteId);
          console.log(`🔄 Mapping offline ID ${action.noteId} to real ID ${realId}`);
        }
        
        switch (action.type) {
          case 'UPDATE_NOTE':
            console.log(`📝 Updating note: ${realId}`);
            await api.put(`/notes/${realId}`, action.data);
            console.log(`✅ Updated note: ${realId}`);
            
            // Update local cache with the updated note
            const cachedNotes = await getCachedNotes();
            const updatedCache = cachedNotes.map(note => {
              if (note._id === action.noteId || note._id === realId) {
                return { ...note, ...action.data, updatedAt: new Date().toISOString(), isOffline: false };
              }
              return note;
            });
            await cacheNotes(updatedCache);
            break;
            
          case 'DELETE_NOTE':
            console.log(`🗑️ Deleting note: ${realId}`);
            await api.delete(`/notes/${realId}`);
            console.log(`✅ Deleted note: ${realId}`);
            
            // Remove from cache
            const allNotes = await getCachedNotes();
            const filteredNotes = allNotes.filter(n => n._id !== action.noteId && n._id !== realId);
            await cacheNotes(filteredNotes);
            break;
            
          case 'PIN_NOTE':
            console.log(`📌 Pinning note: ${realId}`);
            await api.patch(`/notes/${realId}/pin`, { isPinned: action.isPinned });
            console.log(`✅ Pinned note: ${realId}`);
            break;
        }
        
        // Remove the action from queue
        await removePendingAction(action.id);
        
      } catch (error) {
        console.error(`❌ Failed to sync action ${action.id}:`, error);
        
        // If it's a 404 and we have a mapping, try with the real ID
        if (error.response?.status === 404 && action.noteId && idMapping.has(action.noteId)) {
          console.log(`⚠️ 404 with offline ID, will retry with real ID on next sync`);
        }
        // Don't remove on error, will retry next time
      }
    }
    
    await setLastSync();
    console.log('✅ Sync completed!');
    
    // Clear the ID mapping after successful sync
    idMapping.clear();
    
    // Notify listeners
    onlineCallbacks.forEach(cb => cb('sync_completed'));
    
    // Trigger refresh of notes
    window.dispatchEvent(new Event('refreshNotes'));
    
  } finally {
    isSyncing = false;
  }
};

// Subscribe to online/offline events
export const onOnline = (callback) => {
  onlineCallbacks.push(callback);
  return () => {
    onlineCallbacks = onlineCallbacks.filter(cb => cb !== callback);
  };
};

export const onOffline = (callback) => {
  offlineCallbacks.push(callback);
  return () => {
    offlineCallbacks = offlineCallbacks.filter(cb => cb !== callback);
  };
};

// Get current online status
export const isOnline = () => navigator.onLine;

// Initialize sync listener (ONLY ONCE)
export const initSyncListener = () => {
  if (isListenerInitialized) {
    console.log('Sync listener already initialized, skipping...');
    return;
  }
  
  isListenerInitialized = true;
  console.log('Initializing sync listener...');
  
  const handleOnline = async () => {
    console.log('🌐 Back online! Syncing...');
    toast.success('Back online! Syncing your notes...', {
      duration: 2000,
    });
    
    await syncPendingActions();
    
    // Notify all UI listeners
    onlineCallbacks.forEach(cb => cb('online'));
    
    window.dispatchEvent(new Event('refreshNotes'));
  };
  
  const handleOffline = () => {
    console.log('📡 Offline mode activated');
    toast.error('Offline mode - Changes will sync when online', {
      duration: 2000,
      icon: '📱',
    });
    
    // Notify all UI listeners
    offlineCallbacks.forEach(cb => cb());
  };
  
  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);
  
  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
    isListenerInitialized = false;
  };
};