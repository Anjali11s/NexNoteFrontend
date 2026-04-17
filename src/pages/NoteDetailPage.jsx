// src/pages/NoteDetailPage.jsx
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import api from "../lib/axios";
import toast from "react-hot-toast";
import { ArrowLeftIcon, LoaderIcon, Trash2Icon, SaveIcon, Edit2Icon, EyeIcon } from "lucide-react";
import TagInput from "../components/TagInput";

const NoteDetailPage = () => {
  const [note, setNote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const [isEditing, setIsEditing] = useState(false);

  const navigate = useNavigate();
  const { id } = useParams();

  useEffect(() => {
    const fetchNote = async () => {
      try {
        const res = await api.get(`/notes/${id}`);
        setNote(res.data);
        updateCounts(res.data.content);
        // Check if we're in edit mode based on URL
        setIsEditing(window.location.pathname.includes('/edit'));
      } catch (error) {
        toast.error("Failed to fetch the note");
        navigate("/");
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
    try {
      await api.put(`/notes/${id}`, note);
      toast.success("Note updated successfully");
      setIsEditing(false);
      // Refresh note data
      const res = await api.get(`/notes/${id}`);
      setNote(res.data);
    } catch (error) {
      toast.error("Failed to update note");
    } finally {
      setSaving(false);
    }
  };

  const toggleEdit = () => {
    setIsEditing(!isEditing);
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
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-400 transition-all font-medium"
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
                      {saving ? "Saving..." : "Save Changes"}
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

// Add formatDate function if not imported
const formatDate = (date) => {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

export default NoteDetailPage;