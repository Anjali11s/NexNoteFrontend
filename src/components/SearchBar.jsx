import { SearchIcon, XIcon, WifiOffIcon } from "lucide-react";
import { useState } from "react";
import { isOnline } from "../lib/syncService";

const SearchBar = ({ onSearch, initialValue = "" }) => {
  const [query, setQuery] = useState(initialValue);
  const isOffline = !isOnline();

  const handleClear = () => {
    setQuery("");
    onSearch("");
  };

  const handleChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    onSearch(value);
  };

  return (
    <div className="relative flex-1">
      <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-amber-500 dark:text-amber-400" />
      <input
        type="text"
        placeholder={isOffline ? "Offline - searching cached notes..." : "Search notes by title or content..."}
        value={query}
        onChange={handleChange}
        className="w-full pl-12 pr-12 py-3 rounded-xl border-2 border-amber-200 dark:border-stone-600 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/20 outline-none transition-all bg-white dark:bg-stone-800 text-stone-800 dark:text-white placeholder:text-stone-400 dark:placeholder:text-stone-500 font-medium"
      />
      {query && (
        <button
          onClick={handleClear}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 dark:text-stone-500 dark:hover:text-stone-300 transition-colors"
          aria-label="Clear search"
        >
          <XIcon className="size-4" />
        </button>
      )}
      {isOffline && (
        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-yellow-500 dark:text-yellow-400">
          <WifiOffIcon className="size-4" />
        </div>
      )}
    </div>
  );
};

export default SearchBar;