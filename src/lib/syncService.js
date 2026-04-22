// frontend/src/lib/syncService.js
import api from './axios';
import { getPendingActions, removePendingAction, setLastSync } from './offlineStorage';
import toast from 'react-hot-toast';

// Flag to prevent multiple simultaneous syncs
let isSyncing = false;

// Process all pending actions in order
export const syncPendingActions = async () => {
  // CRITICAL FIX: Prevent multiple simultaneous syncs
  if (isSyncing) {
    console.log('Sync already in progress, skipping...');
    return;
  }
  
  // Don't sync if offline
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
    
    for (const action of pendingActions) {
      try {
        switch (action.type) {
          case 'CREATE_NOTE':
            await api.post('/notes', action.data);
            console.log(`✅ Synced: "${action.data.title}"`);
            break;
            
          case 'UPDATE_NOTE':
            await api.put(`/notes/${action.noteId}`, action.data);
            break;
            
          case 'DELETE_NOTE':
            await api.delete(`/notes/${action.noteId}`);
            break;
            
          case 'PIN_NOTE':
            await api.patch(`/notes/${action.noteId}/pin`, { isPinned: action.isPinned });
            break;
        }
        
        // Remove successfully synced action
        await removePendingAction(action.id);
      } catch (error) {
        console.error(`Failed to sync action ${action.id}:`, error);
        // Don't remove - will retry next time
      }
    }
    
    await setLastSync();
    console.log('✅ Sync completed!');
    
    // Only show toast if there were actions
    if (pendingActions.length > 0) {
      toast.success(`Synced ${pendingActions.length} item(s)!`);
    }
  } finally {
    isSyncing = false;
  }
};

// Flag to track if listener is already initialized
let isListenerInitialized = false;

// Initialize sync listener (only once!)
export const initSyncListener = () => {
  // CRITICAL FIX: Prevent multiple initializations
  if (isListenerInitialized) {
    console.log('Sync listener already initialized, skipping...');
    return;
  }
  
  isListenerInitialized = true;
  console.log('Initializing sync listener...');
  
  // Listen for online event
  const handleOnline = async () => {
    console.log('🌐 Back online! Syncing...');
    toast.success('Back online! Syncing your notes...', {
      duration: 2000,
    });
    await syncPendingActions();
    // Trigger refresh of notes in UI
    window.dispatchEvent(new Event('refreshNotes'));
  };
  
  const handleOffline = () => {
    console.log('📡 Offline mode activated');
    toast.error('Offline mode - Changes will sync when online', {
      duration: 2000,
      icon: '📱',
    });
  };
  
  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);
  
  // Don't auto-sync on load - let HomePage handle it
  // This prevents duplicate syncs
  
  // Cleanup function (optional, for testing)
  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
    isListenerInitialized = false;
  };
};