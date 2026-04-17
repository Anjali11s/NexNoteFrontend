// src/components/Navbar.jsx
import React from 'react'
import { Link, useNavigate } from 'react-router'
import { PlusIcon, SparklesIcon, DownloadIcon, LogOutIcon } from 'lucide-react'
import ThemeToggle from './ThemeToggle'
import { useAuth } from "../context/AuthContext";
import toast from 'react-hot-toast';

const Navbar = ({ onExport }) => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
      logout();
      navigate("/login");
      toast.success("Logged out successfully");
    };
    
    return (
        <header className="sticky top-0 z-50 bg-white/90 dark:bg-stone-900/90 backdrop-blur-md border-b border-amber-200 dark:border-stone-700 shadow-sm">
            <div className="mx-auto max-w-7xl px-4 py-3 md:py-4">
                <div className="flex items-center justify-between gap-4">
                    <Link to="/" className="group flex items-center gap-2 shrink-0">
                        <div className="p-2 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 shadow-md group-hover:shadow-lg transition-all">
                            <SparklesIcon className="size-5 text-white" />
                        </div>
                        <h1 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-amber-700 via-orange-600 to-amber-700 dark:from-amber-400 dark:via-orange-400 dark:to-amber-400 bg-clip-text text-transparent tracking-tight group-hover:scale-105 transition-transform">
                            NexNote
                        </h1>
                    </Link>

                    <div className="flex items-center gap-2">
                        {/* User Info Section */}
                        {user && (
                            <div className="flex items-center gap-3 mr-2">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 flex items-center justify-center shadow-md">
                                        <span className="text-white text-sm font-bold">
                                            {user?.name?.charAt(0).toUpperCase()}
                                        </span>
                                    </div>
                                    <span className="text-sm font-semibold text-stone-700 dark:text-stone-300 hidden md:inline">
                                        {user?.name}
                                    </span>
                                </div>
                                <button
                                    onClick={handleLogout}
                                    className="p-2 rounded-xl hover:bg-amber-100 dark:hover:bg-stone-700 transition-all"
                                    aria-label="Logout"
                                >
                                    <LogOutIcon className="size-5 text-stone-700 dark:text-stone-300" />
                                </button>
                            </div>
                        )}

                        {onExport && (
                            <button
                                onClick={onExport}
                                className="p-2 rounded-xl bg-white dark:bg-stone-800 border-2 border-amber-200 dark:border-stone-600 hover:border-amber-400 dark:hover:border-amber-500 transition-all"
                                aria-label="Export notes"
                            >
                                <DownloadIcon className="size-5 text-stone-700 dark:text-stone-300" />
                            </button>
                        )}
                        
                        <ThemeToggle />
                        
                        <Link 
                            to="/create" 
                            className="group flex items-center gap-2 px-3 md:px-5 py-2 md:py-2.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white rounded-xl font-bold shadow-md hover:shadow-lg hover:scale-105 active:scale-95 transition-all duration-200"
                        >
                            <PlusIcon className="size-4 md:size-5 group-hover:rotate-90 transition-transform duration-300" />
                            <span className="text-sm md:text-base hidden sm:inline">New Note</span>
                        </Link>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Navbar;