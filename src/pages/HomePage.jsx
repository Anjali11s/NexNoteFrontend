// frontend/src/pages/HomePage.jsx
import { useState, useEffect, useRef } from "react"; // Add useRef
import Navbar from "../components/Navbar";
import RateLimitedUI from "../components/RateLimitedUI";
import SearchBar from "../components/SearchBar";
import SortDropdown from "../components/SortDropdown";
import StatsCard from "../components/StatsCard";
import api from "../lib/axios";
import toast from "react-hot-toast";
import NoteCard from "../components/NoteCard";
import NotesNotFound from "../components/NotesNotFound";
import { SparklesIcon, WifiOffIcon, CloudSyncIcon } from "lucide-react";
import { cacheNotes, getCachedNotes, getLastSync, getPendingCount } from "../lib/offlineStorage";
import { syncPendingActions, initSyncListener } from "../lib/syncService";

const HomePage = () => {
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [lastSync, setLastSync] = useState(null);
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  
  // CRITICAL FIX: Track if initial sync was done
  const initialSyncDone = useRef(false);

  // Initialize sync listener once when app loads
  useEffect(() => {
    initSyncListener();
  }, []);

  // Fetch pending count periodically
  useEffect(() => {
    const updatePendingCount = async () => {
      const count = await getPendingCount();
      setPendingCount(count);
    };
    
    updatePendingCount();
    const interval = setInterval(updatePendingCount, 5000);
    return () => clearInterval(interval);
  }, []);

  // Main fetch function - offline-first!
  const fetchNotes = async (forceRefresh = false) => {
    setLoading(true);
    
    // STEP 1: Show cached notes instantly (even if we'll fetch fresh later)
    if (!forceRefresh) {
      const cached = await getCachedNotes();
      if (cached.length > 0) {
        setNotes(cached);
        setLoading(false);
      }
    }
    
    // STEP 2: If offline, don't try to fetch from server
    if (!navigator.onLine) {
      setLoading(false);
      return;
    }
    
    // STEP 3: Fetch fresh data from server
    try {
      const res = await api.get("/notes");
      setNotes(res.data);
      await cacheNotes(res.data);
      setIsRateLimited(false);
      
      const syncTime = await getLastSync();
      setLastSync(syncTime);
    } catch (error) {
      if (error.response?.status === 429) {
        setIsRateLimited(true);
      } else if (error.isOffline) {
        setIsOffline(true);
      } else {
        toast.error("Failed to load notes");
      }
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchNotes();
    
    // CRITICAL FIX: Only sync once on initial load
    const doInitialSync = async () => {
      if (!initialSyncDone.current && navigator.onLine) {
        initialSyncDone.current = true;
        await syncPendingActions();
        await fetchNotes(true);
      }
    };
    
    doInitialSync();
    
    // Listen for online/offline events
    const handleOnline = () => {
      setIsOffline(false);
      fetchNotes(true);
    };
    
    const handleOffline = () => {
      setIsOffline(true);
    };
    
    const handleRefresh = () => {
      fetchNotes(true);
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('refreshNotes', handleRefresh);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('refreshNotes', handleRefresh);
    };
  }, []);

  // Manual sync button handler
  const handleManualSync = async () => {
    if (!navigator.onLine) {
      toast.error("Cannot sync while offline");
      return;
    }
    
    if (isSyncing) {
      toast.error("Sync already in progress");
      return;
    }
    
    setIsSyncing(true);
    await syncPendingActions();
    await fetchNotes(true);
    setIsSyncing(false);
    
    const count = await getPendingCount();
    setPendingCount(count);
  };

  // Filter and sort notes (same as before)
  const filteredNotes = notes.filter(note => 
    note.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    note.content?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getSortedNotes = () => {
    const sorted = [...filteredNotes];
    
    return sorted.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      
      if (a.isPinned && b.isPinned) {
        const aDate = a.pinnedAt || a.updatedAt;
        const bDate = b.pinnedAt || b.updatedAt;
        return new Date(bDate) - new Date(aDate);
      }
      
      switch (sortBy) {
        case "newest":
          return new Date(b.createdAt) - new Date(a.createdAt);
        case "oldest":
          return new Date(a.createdAt) - new Date(b.createdAt);
        case "az":
          return a.title?.localeCompare(b.title);
        case "za":
          return b.title?.localeCompare(a.title);
        default:
          return new Date(b.createdAt) - new Date(a.createdAt);
      }
    });
  };

  const sortedNotes = getSortedNotes();
  const pinnedCount = notes.filter(n => n.isPinned).length;

  const handleExport = () => {
    const dataStr = JSON.stringify(notes, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `nexnote-backup-${new Date().toISOString().slice(0,19)}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    toast.success("Notes exported successfully!");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-stone-100 dark:from-stone-900 dark:via-stone-800 dark:to-stone-900 transition-colors duration-300">
      <Navbar onExport={notes.length > 0 ? handleExport : null} />

      {/* Offline Banner */}
      {isOffline && (
        <div className="bg-yellow-500 text-white text-center py-2 px-4 text-sm font-medium flex items-center justify-center gap-2">
          <WifiOffIcon className="size-4" />
          You're offline. Changes will sync when connection returns.
          {pendingCount > 0 && (
            <span className="ml-2 bg-yellow-600 px-2 py-0.5 rounded-full text-xs">
              {pendingCount} pending
            </span>
          )}
        </div>
      )}

      {/* Sync Status Bar */}
      {!isOffline && (
        <div className="max-w-7xl mx-auto px-4 pt-2">
          <div className="flex justify-between items-center text-xs text-stone-400 dark:text-stone-500">
            <div className="flex items-center gap-2">
              {lastSync && (
                <span>Last synced: {new Date(lastSync).toLocaleTimeString()}</span>
              )}
              {pendingCount > 0 && (
                <span className="text-amber-600">
                  • {pendingCount} pending changes
                </span>
              )}
            </div>
            <button
              onClick={handleManualSync}
              disabled={isSyncing || !navigator.onLine}
              className="flex items-center gap-1 hover:text-amber-600 transition-colors"
            >
              <CloudSyncIcon className={`size-3 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Syncing...' : 'Sync now'}</span>
            </button>
          </div>
        </div>
      )}

      {isRateLimited && <RateLimitedUI />}

      <div className="max-w-7xl mx-auto p-4 md:p-6 mt-4">
        {loading && notes.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-amber-200 border-t-amber-600 rounded-full animate-spin"></div>
            </div>
            <p className="mt-4 text-amber-700 dark:text-amber-400 font-semibold">
              {isOffline ? "Loading cached notes..." : "Loading your notes..."}
            </p>
          </div>
        )}

        {!loading && notes.length > 0 && !isRateLimited && (
          <>
            <StatsCard notes={notes} />
            
            <div className="flex flex-col sm:flex-row gap-4 mb-8">
              <SearchBar onSearch={setSearchQuery} />
              <SortDropdown onSort={setSortBy} currentSort={sortBy} />
            </div>

            {pinnedCount > 0 && (
              <div className="flex items-center gap-2 mb-4 text-amber-600 dark:text-amber-400">
                <SparklesIcon className="size-4 fill-amber-500" />
                <span className="text-sm font-semibold">Pinned ({pinnedCount})</span>
              </div>
            )}

            {sortedNotes.length === 0 && searchQuery && (
              <div className="text-center py-12">
                <p className="text-stone-600 dark:text-stone-400 font-medium">
                  No notes matching "{searchQuery}"
                </p>
              </div>
            )}

            {sortedNotes.length > 0 && (
              <>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-stone-800 dark:text-white">
                      {searchQuery ? "Search Results" : "Your Notes"}
                    </h2>
                    <p className="text-stone-600 dark:text-stone-400 font-medium mt-1">
                      {sortedNotes.length} {sortedNotes.length === 1 ? 'note' : 'notes'} found
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {sortedNotes.map((note) => (
                    <NoteCard key={note._id} note={note} setNotes={setNotes} />
                  ))}
                </div>
              </>
            )}
          </>
        )}

        {!loading && notes.length === 0 && !isRateLimited && <NotesNotFound />}
      </div>
    </div>
  );
};

export default HomePage;