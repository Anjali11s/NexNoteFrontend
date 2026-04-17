// src/components/SortDropdown.jsx
import { ArrowUpDownIcon } from "lucide-react";
import { useState } from "react";

const SortDropdown = ({ onSort, currentSort = "newest" }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selected, setSelected] = useState(currentSort);

  const options = [
    { value: "newest", label: "Newest First" },
    { value: "oldest", label: "Oldest First" },
    { value: "az", label: "A to Z" },
    { value: "za", label: "Z to A" },
  ];

  const handleSelect = (option) => {
    setSelected(option.value);
    onSort(option.value);
    setIsOpen(false);
  };

  const getSelectedLabel = () => {
    return options.find(opt => opt.value === selected)?.label || "Sort";
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-3 rounded-xl bg-white dark:bg-stone-800 border-2 border-amber-200 dark:border-stone-600 hover:border-amber-400 dark:hover:border-amber-500 transition-all"
      >
        <ArrowUpDownIcon className="size-4 text-amber-600 dark:text-amber-400" />
        <span className="text-sm font-semibold text-stone-700 dark:text-stone-300 hidden sm:inline">
          {getSelectedLabel()}
        </span>
      </button>
      
      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-stone-800 rounded-xl shadow-lg border border-amber-200 dark:border-stone-700 z-20 overflow-hidden">
            {options.map(option => (
              <button
                key={option.value}
                onClick={() => handleSelect(option)}
                className={`w-full text-left px-4 py-2.5 text-sm font-medium hover:bg-amber-50 dark:hover:bg-stone-700 transition-colors ${
                  selected === option.value 
                    ? "bg-amber-100 dark:bg-stone-700 text-amber-700 dark:text-amber-400" 
                    : "text-stone-700 dark:text-stone-300"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default SortDropdown;