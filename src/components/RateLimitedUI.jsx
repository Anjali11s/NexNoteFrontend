import { AlertTriangleIcon, ClockIcon } from "lucide-react";

const RateLimitedUI = () => {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-950/30 dark:to-orange-950/30 border-l-4 border-red-500 rounded-xl shadow-lg overflow-hidden animate-in fade-in slide-in-from-top-5 duration-300">
        <div className="flex items-center p-6">
          {/* Icon */}
          <div className="flex-shrink-0">
            <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-full animate-pulse">
              <AlertTriangleIcon className="size-6 text-red-600 dark:text-red-400" />
            </div>
          </div>

          {/* Content */}
          <div className="ml-4 flex-1">
            <h3 className="text-lg font-bold text-red-700 dark:text-red-400">
              Rate Limit Reached
            </h3>
            <p className="text-stone-600 dark:text-stone-400 mt-1">
              You've made too many requests in a short period. Please wait a moment before trying again.
            </p>
            <div className="flex items-center gap-2 mt-3 text-sm text-red-600 dark:text-red-400">
              <ClockIcon className="size-4 animate-pulse" />
              <span className="font-medium">Please wait a few seconds</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RateLimitedUI;