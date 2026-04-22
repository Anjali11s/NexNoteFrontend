import api from './axios';
import { getPendingActions, removePendingAction, setLastSync } from './offlineStorage';
import toast from 'react-hot-toast';

// Process all pending actions in order
// Actions are processed sequentially to maintain order
export const syncPendingActions = async () => {
  const pendingActions = await getPendingActions();
  
  if (pendingActions.length === 0) return;
  
  console.log(`📡 Syncing ${pendingActions.length} pending actions...`);
  
  for (const action of pendingActions) {
    try {
      switch (action.type) {
        case 'CREATE_NOTE':
          await api.post('/notes', action.data);
          toast.success(`✅ Synced: "${action.data.title}"`);
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
};

// Initialize sync listener
// This runs once when app starts
export const initSyncListener = () => {
  // Listen for online event (browser API)
  window.addEventListener('online', async () => {
    console.log('🌐 Back online! Syncing...');
    toast.success('Back online! Syncing your notes...', {
      duration: 3000,
    });
    await syncPendingActions();
    // Trigger refresh of notes in UI
    window.dispatchEvent(new Event('refreshNotes'));
  });
  
  // Optional: Listen for offline to show warning
  window.addEventListener('offline', () => {
    console.log('📡 Offline mode activated');
    toast.error('Offline mode - Changes will sync when online', {
      duration: 3000,
      icon: '📱',
    });
  });
  
  // Also sync when page loads (if coming back online)
  if (navigator.onLine) {
    syncPendingActions();
  }
};