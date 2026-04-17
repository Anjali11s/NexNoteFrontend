// src/components/TagInput.jsx
import { XIcon, PlusIcon } from "lucide-react";
import { useState } from "react";

const TagInput = ({ tags = [], onTagsChange, placeholder = "Add a tag..." }) => {
  const [input, setInput] = useState("");

  const addTag = () => {
    const trimmed = input.trim().toLowerCase();
    if (trimmed && !tags.includes(trimmed) && tags.length < 10) {
      onTagsChange([...tags, trimmed]);
      setInput("");
    }
  };

  const removeTag = (tagToRemove) => {
    onTagsChange(tags.filter(tag => tag !== tagToRemove));
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  };

  return (
    <div>
      <div className="flex gap-2 mb-3 flex-wrap">
        {tags.map(tag => (
          <span
            key={tag}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-amber-100 to-orange-100 text-amber-800 rounded-full text-sm font-medium shadow-sm"
          >
            #{tag}
            <button
              onClick={() => removeTag(tag)}
              className="hover:text-red-500 transition-colors"
            >
              <XIcon className="size-3" />
            </button>
          </span>
        ))}
        {tags.length === 0 && (
          <span className="text-sm text-stone-400 italic">No tags added yet</span>
        )}
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          placeholder={placeholder}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          className="flex-1 px-4 py-2.5 rounded-xl border-2 border-amber-200 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/20 outline-none transition-all bg-amber-50/30"
        />
        <button
          onClick={addTag}
          disabled={!input.trim() || tags.length >= 10}
          className="px-4 py-2.5 rounded-xl bg-amber-100 text-amber-700 hover:bg-amber-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <PlusIcon className="size-5" />
        </button>
      </div>
      {tags.length >= 10 && (
        <p className="text-xs text-red-500 mt-2">Maximum 10 tags per note</p>
      )}
    </div>
  );
};

export default TagInput;