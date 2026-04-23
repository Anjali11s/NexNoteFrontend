import { NotebookIcon, SparklesIcon, WifiOffIcon } from "lucide-react";
import { Link } from "react-router";
import { isOnline } from "../lib/syncService";

const NotesNotFound = () => {
  const isOffline = !isOnline();
  
  return (
    <div className="flex flex-col items-center justify-center py-16 md:py-24 space-y-6 max-w-md mx-auto text-center">
      {/* Animated Icon */}
      <div className="relative">
        <div className="absolute inset-0 bg-amber-300 rounded-full blur-xl opacity-20 animate-pulse"></div>
        <div className="relative bg-gradient-to-br from-amber-100 to-orange-100 dark:from-stone-800 dark:to-stone-700 rounded-full p-8 shadow-lg">
          {isOffline ? (
            <WifiOffIcon className="size-12 text-amber-600 dark:text-amber-400" />
          ) : (
            <NotebookIcon className="size-12 text-amber-600 dark:text-amber-400" />
          )}
        </div>
      </div>

      {/* Heading */}
      <h3 className="text-3xl font-bold text-stone-800 dark:text-stone-200">
        {isOffline ? "No offline notes" : "No notes yet"}
      </h3>

      {/* Description */}
      <p className="text-stone-500 dark:text-stone-400 leading-relaxed">
        {isOffline 
          ? "You're offline. Connect to the internet to create and sync your notes." 
          : "Ready to organize your thoughts? Create your first note to get started on your journey."}
      </p>

      {/* CTA Button - Only show when online */}
      {!isOffline && (
        <Link
          to="/create"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-medium shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
        >
          <SparklesIcon className="size-5" />
          Create Your First Note
        </Link>
      )}
      
      {/* Offline message */}
      {isOffline && (
        <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl">
          <p className="text-sm text-yellow-700 dark:text-yellow-400">
            Go online to create new notes
          </p>
        </div>
      )}
    </div>
  );
};

export default NotesNotFound;