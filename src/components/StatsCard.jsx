// src/components/StatsCard.jsx
import { FileTextIcon, CalendarIcon, TagIcon, TrendingUpIcon } from "lucide-react";

const StatsCard = ({ notes }) => {
  const totalNotes = notes.length;
  const totalWords = notes.reduce((sum, note) => 
    sum + (note.content?.split(/\s+/).filter(Boolean).length || 0), 0);
  const uniqueTags = [...new Set(notes.flatMap(note => note.tags || []))];
  
  // Calculate average note length
  const avgLength = totalNotes > 0 ? Math.round(totalWords / totalNotes) : 0;

  const stats = [
    {
      icon: FileTextIcon,
      value: totalNotes,
      label: "Total Notes",
      color: "from-amber-500 to-orange-500",
    },
    {
      icon: CalendarIcon,
      value: totalWords,
      label: "Total Words",
      color: "from-orange-500 to-red-500",
    },
    {
      icon: TagIcon,
      value: uniqueTags.length,
      label: "Unique Tags",
      color: "from-amber-600 to-amber-500",
    },
    {
      icon: TrendingUpIcon,
      value: avgLength,
      label: "Avg Words/Note",
      color: "from-stone-500 to-amber-500",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      {stats.map((stat, index) => (
        <div
          key={index}
          className="relative overflow-hidden bg-white dark:bg-stone-800 rounded-xl border border-amber-200 dark:border-stone-700 p-4 shadow-sm hover:shadow-md transition-all"
        >
          <div className={`absolute top-0 left-0 h-1 w-full bg-gradient-to-r ${stat.color}`} />
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg bg-gradient-to-br ${stat.color} bg-opacity-10`}>
              <stat.icon className="size-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-stone-800 dark:text-white">
                {stat.value}
              </p>
              <p className="text-sm font-semibold text-stone-600 dark:text-stone-400">
                {stat.label}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default StatsCard;