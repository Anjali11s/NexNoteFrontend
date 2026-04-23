import { PenSquareIcon, Trash2Icon, PinIcon } from "lucide-react";
import { useNavigate } from "react-router"; 
import { formatDate } from "../lib/utils";
import api from "../lib/axios";
import toast from "react-hot-toast";
import { useState, useEffect } from "react";
import { queueAction, cacheNotes, getCachedNotes } from "../lib/offlineStorage";
import { onOnline, onOffline, isOnline } from "../lib/syncService";

const NoteCard = ({ note, setNotes }) => {
  const [isPinned, setIsPinned] = useState(note.isPinned || false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const navigate = useNavigate();

  // Use centralized event system
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

  const handleDelete = async (e, id) => {
    e.preventDefault();
    e.stopPropagation();

    if (!window.confirm("Are you sure you want to delete this note?")) return;

    if (isOffline) {
      await queueAction({
        type: 'DELETE_NOTE',
        noteId: id
      });
      
      setNotes((prev) => prev.filter((note) => note._id !== id));
      
      const cached = await getCachedNotes();
      const updatedCache = cached.filter(n => n._id !== id);
      await cacheNotes(updatedCache);
      
      toast.success("Note will be deleted when back online", {
        icon: '📱'
      });
      return;
    }

    try {
      await api.delete(`/notes/${id}`);
      setNotes((prev) => prev.filter((note) => note._id !== id));
      toast.success("Note deleted successfully");
    } catch (error) {
      console.log("Error in handleDelete", error);
      toast.error("Failed to delete note");
    }
  };

  const handlePin = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    const newPinState = !isPinned;
    setIsPinned(newPinState);
    
    if (isOffline) {
      await queueAction({
        type: 'PIN_NOTE',
        noteId: note._id,
        isPinned: newPinState
      });
      
      setNotes((prev) => {
        const updated = prev.map(n => 
          n._id === note._id ? { ...n, isPinned: newPinState } : n
        );
        return updated.sort((a, b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0));
      });
      
      toast.success(newPinState ? "Pinned! (Will sync online)" : "Unpinned! (Will sync online)", {
        icon: '📱'
      });
      return;
    }
    
    try {
      await api.patch(`/notes/${note._id}/pin`, { isPinned: newPinState });
      toast.success(newPinState ? "Note pinned!" : "Note unpinned");
      
      setNotes((prev) => {
        const updated = prev.map(n => 
          n._id === note._id ? { ...n, isPinned: newPinState } : n
        );
        return updated.sort((a, b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0));
      });
    } catch (error) {
      console.error("Pin error:", error);
      setIsPinned(!newPinState);
      if (error.response?.status === 404) {
        toast.error("Pin feature not available on server yet");
      } else {
        toast.error("Failed to pin note");
      }
    }
  };

  const handleEdit = (e) => {
    e.preventDefault();
    e.stopPropagation();
    navigate(`/note/${note._id}/edit`);
  };

  const handleView = () => {
    navigate(`/note/${note._id}`);
  };

  return (
    <div className="group block bg-white dark:bg-stone-800 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 border border-amber-200/50 dark:border-stone-700 overflow-hidden hover:-translate-y-1 cursor-pointer relative">
      <div className="h-2 bg-gradient-to-r from-amber-500 to-orange-500"></div>
      
      {note.isOffline && (
        <div className="absolute top-2 right-2 bg-yellow-500 text-white text-xs px-2 py-0.5 rounded-full z-10">
          Pending Sync
        </div>
      )}
      
      <div onClick={handleView} className="p-5">
        <div className="flex items-start justify-between mb-3">
          <h3 className="text-xl font-bold text-stone-800 dark:text-stone-200 group-hover:text-amber-700 dark:group-hover:text-amber-400 transition-colors line-clamp-1 flex-1">
            {note.title}
          </h3>
          <div className="flex items-center gap-1 ml-2">
            <button
              onClick={handlePin}
              className="p-1.5 rounded-lg hover:bg-amber-50 dark:hover:bg-stone-700 transition-all"
              aria-label="Pin note"
            >
              <PinIcon className={`size-3.5 ${isPinned ? "fill-amber-500 text-amber-500" : "text-stone-400"}`} />
            </button>
          </div>
        </div>
        
        <p className="text-stone-600 dark:text-stone-400 line-clamp-3 mb-4 leading-relaxed">
          {note.content?.replace(/<[^>]*>/g, '') || note.content}
        </p>
        
        {note.tags && note.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {note.tags.slice(0, 3).map(tag => (
              <span key={tag} className="text-xs px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-full font-medium">
                #{tag}
              </span>
            ))}
            {note.tags.length > 3 && (
              <span className="text-xs px-2 py-0.5 text-stone-500 dark:text-stone-400 font-medium">
                +{note.tags.length - 3}
              </span>
            )}
          </div>
        )}
        
        <div className="flex items-center justify-between pt-3 border-t border-amber-100 dark:border-stone-700">
          <span className="text-xs text-stone-400 dark:text-stone-500 font-medium">
            {formatDate(new Date(note.createdAt))}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={handleEdit}
              className="p-1.5 rounded-lg text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-all"
              aria-label="Edit note"
            >
              <PenSquareIcon className="size-4" />
            </button>
            <button
              className="p-1.5 rounded-lg text-red-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
              onClick={(e) => handleDelete(e, note._id)}
              aria-label="Delete note"
            >
              <Trash2Icon className="size-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NoteCard;