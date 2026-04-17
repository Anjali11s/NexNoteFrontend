// src/pages/HomePage.jsx
import { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import RateLimitedUI from "../components/RateLimitedUI";
import SearchBar from "../components/SearchBar";
import SortDropdown from "../components/SortDropdown";
import StatsCard from "../components/StatsCard";
import api from "../lib/axios";
import toast from "react-hot-toast";
import NoteCard from "../components/NoteCard";
import NotesNotFound from "../components/NotesNotFound";
import { SparklesIcon } from "lucide-react";

const HomePage = () => {
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("newest");

  useEffect(() => {
    const fetchNotes = async () => {
      try {
        const res = await api.get("/notes");
        setNotes(res.data);
        setIsRateLimited(false);
      } catch (error) {
        if (error.response?.status === 429) {
          setIsRateLimited(true);
        } else {
          toast.error("Failed to load notes");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchNotes();
  }, []);

  // Filter notes based on search
  const filteredNotes = notes.filter(note => 
    note.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    note.content?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Sort notes
const getSortedNotes = () => {
  const sorted = [...filteredNotes];
  
  // First, separate pinned and unpinned notes
  const pinnedNotes = sorted.filter(note => note.isPinned === true);
  const unpinnedNotes = sorted.filter(note => note.isPinned !== true);
  
  // Sort pinned notes by pin date (most recently pinned first)
  // Note: You'll need to add a pinnedAt field to track pin order
  const sortedPinned = pinnedNotes.sort((a, b) => {
    // If you have pinnedAt field, use that
    if (a.pinnedAt && b.pinnedAt) {
      return new Date(b.pinnedAt) - new Date(a.pinnedAt);
    }
    // Otherwise sort by updatedAt (most recently updated/pinned first)
    return new Date(b.updatedAt) - new Date(a.updatedAt);
  });
  
  // Sort unpinned notes based on selected sort option
  let sortedUnpinned = [...unpinnedNotes];
  switch (sortBy) {
    case "newest":
      sortedUnpinned = sortedUnpinned.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      break;
    case "oldest":
      sortedUnpinned = sortedUnpinned.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      break;
    case "az":
      sortedUnpinned = sortedUnpinned.sort((a, b) => a.title?.localeCompare(b.title));
      break;
    case "za":
      sortedUnpinned = sortedUnpinned.sort((a, b) => b.title?.localeCompare(a.title));
      break;
    default:
      sortedUnpinned = sortedUnpinned.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }
  
  // Combine pinned notes at top, then unpinned
  return [...sortedPinned, ...sortedUnpinned];
};

  const sortedNotes = getSortedNotes();

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

      {isRateLimited && <RateLimitedUI />}

      <div className="max-w-7xl mx-auto p-4 md:p-6 mt-4">
        {loading && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-amber-200 border-t-amber-600 rounded-full animate-spin"></div>
            </div>
            <p className="mt-4 text-amber-700 dark:text-amber-400 font-semibold">Loading your notes...</p>
          </div>
        )}

        {!loading && notes.length > 0 && !isRateLimited && (
          <>
            <StatsCard notes={notes} />
            
            <div className="flex flex-col sm:flex-row gap-4 mb-8">
              <SearchBar onSearch={setSearchQuery} />
              <SortDropdown onSort={setSortBy} currentSort={sortBy} />
            </div>

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
                  <div className="hidden md:flex items-center gap-2 text-amber-600 dark:text-amber-400">
                    <SparklesIcon className="size-5" />
                    <span className="text-sm font-semibold">Stay organized</span>
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