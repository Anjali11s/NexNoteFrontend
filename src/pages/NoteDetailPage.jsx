import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import api from "../lib/axios";
import toast from "react-hot-toast";
import { ArrowLeftIcon, Trash2Icon, SaveIcon, Edit2Icon, EyeIcon, WifiOffIcon } from "lucide-react";
import TagInput from "../components/TagInput";
import { queueAction, getCachedNotes, cacheNotes } from "../lib/offlineStorage";
import { onOnline, onOffline, isOnline } from "../lib/syncService";

const NoteDetailPage = () => {
  const [note, setNote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  const navigate = useNavigate();
  const { id } = useParams();

  // Listen for online/offline events
  useEffect(() => {
    const unsubscribeOnline = onOnline(() => {
      setIsOffline(false);
    });
    
    const unsubscribeOffline = onOffline(() => {
      setIsOffline(true);
    });
    
    return () => {
      unsubscribeOnline();
      unsubscribeOffline();
    };
  }, []);

  // Fetch note 
  useEffect(() => {
    const fetchNote = async () => {
      try {
        // First, always check cache regardless of online status
        const cachedNotes = await getCachedNotes();
        const cachedNote = cachedNotes.find(n => n._id === id);
        
        // If we have it in cache, show it immediately
        if (cachedNote) {
          setNote(cachedNote);
          updateCounts(cachedNote.content);
          setLoading(false);
        }
        
        // If online AND it's a real MongoDB ID (not offline_), try to fetch fresh
        if (isOnline() && !id.startsWith('offline_')) {
          try {
            const res = await api.get(`/notes/${id}`);
            setNote(res.data);
            updateCounts(res.data.content);
            
            // Update cache with fresh data
            const updatedCache = cachedNotes.map(n => 
              n._id === id ? res.data : n
            );
            await cacheNotes(updatedCache);
          } catch (apiError) {
            console.log("API fetch failed, using cached version");
          }
        }
        
        // Check if we're in edit mode based on URL
        setIsEditing(window.location.pathname.includes('/edit'));
      } catch (error) {
        console.error("Error fetching note:", error);
        
        // Last resort: try to find in cache again
        const cachedNotes = await getCachedNotes();
        const cachedNote = cachedNotes.find(n => n._id === id);
        if (cachedNote) {
          setNote(cachedNote);
          updateCounts(cachedNote.content);
          toast.error("Using cached version", { icon: '📱' });
        } else {
          toast.error("Failed to fetch the note");
          navigate("/");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchNote();
  }, [id, navigate]);

  const updateCounts = (content) => {
    const words = content?.trim().split(/\s+/).filter(Boolean).length || 0;
    setWordCount(words);
    setCharCount(content?.length || 0);
  };

  const handleContentChange = (e) => {
    const newContent = e.target.value;
    setNote({ ...note, content: newContent });
    updateCounts(newContent);
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this note?")) return;

    if (isOffline) {
      await queueAction({
        type: 'DELETE_NOTE',
        noteId: id
      });
      
      // Update cache
      const cached = await getCachedNotes();
      const updatedCache = cached.filter(n => n._id !== id);
      await cacheNotes(updatedCache);
      
      toast.success("Note will be deleted when back online", { icon: '📱' });
      navigate("/");
      return;
    }

    try {
      await api.delete(`/notes/${id}`);
      toast.success("Note deleted");
      navigate("/");
    } catch (error) {
      toast.error("Failed to delete note");
    }
  };

  const handleSave = async () => {
    if (!note.title.trim() || !note.content.trim()) {
      toast.error("Please add a title or content");
      return;
    }

    setSaving(true);
    
    // OFFLINE MODE: Update local cache and queue the edit
    if (isOffline) {
      try {
        const updatedNote = {
          ...note,
          updatedAt: new Date().toISOString(),
          isOffline: true
        };
        
        // Queue the update action for later sync
        await queueAction({
          type: 'UPDATE_NOTE',
          noteId: id,  // This could be offline_123 or real MongoDB ID
          data: { 
            title: updatedNote.title, 
            content: updatedNote.content, 
            tags: updatedNote.tags 
          }
        });
        
        // Update local cache
        const cachedNotes = await getCachedNotes();
        const noteIndex = cachedNotes.findIndex(n => n._id === id);
        
        if (noteIndex !== -1) {
          cachedNotes[noteIndex] = updatedNote;
          await cacheNotes(cachedNotes);
        } else {
          cachedNotes.push(updatedNote);
          await cacheNotes(cachedNotes);
        }
        
        setNote(updatedNote);
        
        toast.success("Changes saved offline! Will sync when online.", { 
          icon: '📱',
          duration: 3000
        });
        
        setIsEditing(false);
      } catch (error) {
        console.error("Error saving offline:", error);
        toast.error("Failed to save changes offline");
      } finally {
        setSaving(false);
      }
      return;
    }
    
    // ONLINE MODE: Normal flow
    try {
      await api.put(`/notes/${id}`, note);
      toast.success("Note updated successfully");
      setIsEditing(false);
      // Refresh note data
      const res = await api.get(`/notes/${id}`);
      setNote(res.data);
    } catch (error) {
      if (error.isOffline) {
        setIsOffline(true);
        setTimeout(() => {
          handleSave();
        }, 100);
      } else {
        toast.error("Failed to update note");
      }
    } finally {
      setSaving(false);
    }
  };

  const toggleEdit = () => {
    setIsEditing(true);
  };

  // Keyboard shortcut for save
  useEffect(() => {
    const handleKeyPress = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's' && note && isEditing) {
        e.preventDefault();
        handleSave();
      }
    };
    
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [note, isEditing]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-stone-100 dark:from-stone-900 dark:via-stone-800 dark:to-stone-900 flex items-center justify-center">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-amber-200 border-t-amber-600 rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  if (!note) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-stone-100 dark:from-stone-900 dark:via-stone-800 dark:to-stone-900 transition-colors duration-300">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          {/* Offline Banner */}
          {isOffline && (
            <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl flex items-center gap-2 text-yellow-700 dark:text-yellow-400">
              <WifiOffIcon className="size-4" />
              <span className="text-sm">Offline mode - Changes will sync when online</span>
            </div>
          )}

          <div className="flex items-center justify-between mb-6">
            <Link to="/" className="inline-flex items-center gap-2 text-amber-700 dark:text-amber-400 hover:text-amber-900 dark:hover:text-amber-300 transition-colors group">
              <ArrowLeftIcon className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
              Back to Notes
            </Link>
            <div className="flex items-center gap-3">
              {!isEditing && (
                <button
                  onClick={toggleEdit}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-amber-300 dark:border-amber-600 text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-all font-medium"
                >
                  <Edit2Icon className="h-5 w-5" />
                  Edit Note
                </button>
              )}
              <button
                onClick={handleDelete}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all font-medium"
              >
                <Trash2Icon className="h-5 w-5" />
                Delete Note
              </button>
            </div>
          </div>

          <div className="bg-white/80 dark:bg-stone-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-amber-200/50 dark:border-stone-700/50 overflow-hidden">
            <div className="bg-gradient-to-r from-amber-600 to-orange-600 px-6 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white">
                    {isEditing ? "Edit Note" : "View Note"}
                  </h2>
                  <p className="text-amber-100 text-sm mt-1">
                    {isEditing ? "Make your changes below" : "Reading your note"}
                  </p>
                </div>
                {isEditing && (
                  <div className="flex items-center gap-2 text-white/80 text-sm">
                    <EyeIcon className="size-4" />
                    <span>Editing mode</span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="p-6">
              {note.isOffline && !isEditing && (
                <div className="mb-4 p-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg text-xs text-yellow-700 dark:text-yellow-400 text-center">
                  ⏳ This note is pending sync and may not be saved on the server yet
                </div>
              )}
              
              {isEditing ? (
                // EDIT MODE
                <>
                  <div className="mb-5">
                    <label className="block text-sm font-semibold text-stone-700 dark:text-stone-300 mb-2">
                      Title
                    </label>
                    <input
                      type="text"
                      placeholder="Note title"
                      className="w-full px-4 py-3 rounded-xl border-2 border-amber-200 dark:border-stone-600 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/20 outline-none transition-all bg-amber-50/30 dark:bg-stone-700/30 dark:text-white text-lg font-medium"
                      value={note.title}
                      onChange={(e) => setNote({ ...note, title: e.target.value })}
                    />
                  </div>

                  <div className="mb-5">
                    <label className="block text-sm font-semibold text-stone-700 dark:text-stone-300 mb-2">
                      Tags
                    </label>
                    <TagInput 
                      tags={note.tags || []} 
                      onTagsChange={(newTags) => setNote({ ...note, tags: newTags })}
                    />
                  </div>

                  <div className="mb-6">
                    <label className="block text-sm font-semibold text-stone-700 dark:text-stone-300 mb-2">
                      Content
                    </label>
                    <textarea
                      placeholder="Write your note here..."
                      rows="10"
                      className="w-full px-4 py-3 rounded-xl border-2 border-amber-200 dark:border-stone-600 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/20 outline-none transition-all bg-amber-50/30 dark:bg-stone-700/30 dark:text-white resize-none"
                      value={note.content}
                      onChange={handleContentChange}
                    />
                    <div className="flex justify-between text-xs text-stone-400 dark:text-stone-500 mt-2">
                      <span>{wordCount} {wordCount === 1 ? 'word' : 'words'}</span>
                      <span>{charCount} characters</span>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3">
                    <button
                      onClick={() => setIsEditing(false)}
                      className="px-6 py-2.5 rounded-xl border-2 border-stone-300 dark:border-stone-600 text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700 transition-all font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-medium shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
                      disabled={saving}
                      onClick={handleSave}
                    >
                      <SaveIcon className="h-5 w-5" />
                      {saving ? "Saving..." : (isOffline ? "Save Offline" : "Save Changes")}
                    </button>
                  </div>
                </>
              ) : (
                // VIEW MODE - Read only
                <>
                  <div className="mb-5">
                    <h1 className="text-3xl font-bold text-stone-800 dark:text-white mb-2">
                      {note.title}
                    </h1>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {note.tags && note.tags.map(tag => (
                        <span key={tag} className="text-xs px-2 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-full font-medium">
                          #{tag}
                        </span>
                      ))}
                    </div>
                    <div className="text-sm text-stone-500 dark:text-stone-400 mb-4">
                      Created: {formatDate(new Date(note.createdAt))}
                      {note.updatedAt !== note.createdAt && ` • Updated: ${formatDate(new Date(note.updatedAt))}`}
                    </div>
                  </div>

                  <div className="mb-6">
                    <div className="prose prose-amber dark:prose-invert max-w-none">
                      <div className="whitespace-pre-wrap text-stone-700 dark:text-stone-300 leading-relaxed">
                        {note.content}
                      </div>
                    </div>
                    <div className="flex justify-between text-xs text-stone-400 dark:text-stone-500 mt-4 pt-3 border-t border-amber-100 dark:border-stone-700">
                      <span>{wordCount} {wordCount === 1 ? 'word' : 'words'}</span>
                      <span>{charCount} characters</span>
                    </div>
                  </div>
                </>
              )}
              
              {isEditing && (
                <div className="mt-4 text-xs text-center text-stone-400 dark:text-stone-500">
                  💡 Tip: Press Ctrl+S (or Cmd+S) to save
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Format date function
const formatDate = (date) => {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

export default NoteDetailPage;