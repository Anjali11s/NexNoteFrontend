// src/components/NotesNotFound.jsx
import { NotebookIcon, SparklesIcon } from "lucide-react";
import { Link } from "react-router";

const NotesNotFound = () => {
  return (
    <div className="flex flex-col items-center justify-center py-16 md:py-24 space-y-6 max-w-md mx-auto text-center">
      {/* Animated Icon */}
      <div className="relative">
        <div className="absolute inset-0 bg-amber-300 rounded-full blur-xl opacity-20 animate-pulse"></div>
        <div className="relative bg-gradient-to-br from-amber-100 to-orange-100 dark:from-stone-800 dark:to-stone-700 rounded-full p-8 shadow-lg">
          <NotebookIcon className="size-12 text-amber-600 dark:text-amber-400" />
        </div>
      </div>

      {/* Heading */}
      <h3 className="text-3xl font-bold text-stone-800 dark:text-stone-200">No notes yet</h3>

      {/* Description */}
      <p className="text-stone-500 dark:text-stone-400 leading-relaxed">
        Ready to organize your thoughts? Create your first note to get started on your journey.
      </p>

      {/* CTA Button */}
      <Link
        to="/create"
        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-medium shadow-lg hover:shadow-xl transition-all"
      >
        <SparklesIcon className="size-5" />
        Create Your First Note
      </Link>
    </div>
  );
};

export default NotesNotFound;