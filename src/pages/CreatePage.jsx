// src/pages/CreatePage.jsx
import { ArrowLeftIcon } from "lucide-react";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { Link, useNavigate } from "react-router";
import Confetti from "react-confetti";
import api from "../lib/axios";
import TagInput from "../components/TagInput";

const CreatePage = () => {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);

  const navigate = useNavigate();

  // Update counts
  useEffect(() => {
    const words = content.trim().split(/\s+/).filter(Boolean).length;
    setWordCount(words);
    setCharCount(content.length);
  }, [content]);

  // Auto-save draft
  useEffect(() => {
    // Load draft on mount
    const draft = localStorage.getItem("note_draft");
    if (draft && !title && !content && !tags.length) {
      const shouldLoad = window.confirm("You have a saved draft. Load it?");
      if (shouldLoad) {
        const { title: savedTitle, content: savedContent, tags: savedTags } = JSON.parse(draft);
        setTitle(savedTitle || "");
        setContent(savedContent || "");
        setTags(savedTags || []);
      }
    }
  }, []);

  // Save draft
  useEffect(() => {
    if (title || content || tags.length) {
      const timer = setTimeout(() => {
        localStorage.setItem("note_draft", JSON.stringify({ title, content, tags }));
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [title, content, tags]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title.trim() || !content.trim()) {
      toast.error("Title and content are required");
      return;
    }

    setLoading(true);
    try {
      await api.post("/notes", { title, content, tags });
      
      // Clear draft
      localStorage.removeItem("note_draft");
      
      // Show confetti
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);
      
      toast.success("Note created successfully!");
      navigate("/");
    } catch (error) {
      console.log("Error creating note", error);
      if (error.response?.status === 429) {
        toast.error("Slow down! You're creating notes too fast", {
          duration: 4000,
          icon: "💀",
        });
      } else {
        toast.error("Failed to create note");
      }
    } finally {
      setLoading(false);
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSubmit(e);
      }
    };
    
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [title, content, tags]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-stone-100 dark:from-stone-900 dark:via-stone-800 dark:to-stone-900 transition-colors duration-300">
      {showConfetti && <Confetti />}
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Link to={"/"} className="inline-flex items-center gap-2 text-amber-700 dark:text-amber-400 hover:text-amber-900 dark:hover:text-amber-300 mb-6 transition-colors group">
            <ArrowLeftIcon className="size-5 group-hover:-translate-x-1 transition-transform" />
            Back to Notes
          </Link>

          <div className="bg-white/80 dark:bg-stone-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-amber-200/50 dark:border-stone-700/50 overflow-hidden">
            <div className="bg-gradient-to-r from-amber-600 to-orange-600 px-6 py-4">
              <h2 className="text-2xl font-bold text-white">
                Create New Note
              </h2>
              <p className="text-amber-100 text-sm mt-1">Capture your thoughts</p>
            </div>
            
            <div className="p-6">
              <form onSubmit={handleSubmit}>
                <div className="mb-5">
                  <label className="block text-sm font-semibold text-stone-700 dark:text-stone-300 mb-2">
                    Title
                  </label>
                  <input
                    type="text"
                    placeholder="Give your note a catchy title..."
                    className="w-full px-4 py-3 rounded-xl border-2 border-amber-200 dark:border-stone-600 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/20 outline-none transition-all bg-amber-50/30 dark:bg-stone-700/30 dark:text-white"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>

                <div className="mb-5">
                  <label className="block text-sm font-semibold text-stone-700 dark:text-stone-300 mb-2">
                    Tags
                  </label>
                  <TagInput tags={tags} onTagsChange={setTags} />
                </div>

                <div className="mb-5">
                  <label className="block text-sm font-semibold text-stone-700 dark:text-stone-300 mb-2">
                    Content
                  </label>
                  <textarea
                    placeholder="Write your thoughts here..."
                    rows="8"
                    className="w-full px-4 py-3 rounded-xl border-2 border-amber-200 dark:border-stone-600 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/20 outline-none transition-all bg-amber-50/30 dark:bg-stone-700/30 dark:text-white resize-none"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                  />
                  <div className="flex justify-between text-xs text-stone-400 dark:text-stone-500 mt-2">
                    <span>{wordCount} {wordCount === 1 ? 'word' : 'words'}</span>
                    <span>{charCount} characters</span>
                  </div>
                </div>

                <div className="flex justify-end gap-3">
                  <Link
                    to="/"
                    className="px-6 py-2.5 rounded-xl border-2 border-stone-300 dark:border-stone-600 text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700 transition-all font-medium"
                  >
                    Cancel
                  </Link>
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-medium shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
                    disabled={loading}
                  >
                    {loading ? "Creating..." : "✨ Create Note"}
                  </button>
                </div>
                
                <div className="mt-4 text-xs text-center text-stone-400 dark:text-stone-500">
                  💡 Tip: Press Ctrl+S (or Cmd+S) to save
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreatePage;