import React, { useState } from 'react';
import {
  Bot,
  Search,
  ShoppingCart,
  LogIn,
  UserPlus,
  LogOut,
  User as UserIcon,
  Shield,
  Layers,
  Sparkles,
  CheckCircle2,
  ChevronDown,
  ShoppingBag,
  SlidersHorizontal,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';

interface NavbarProps {
  onOpenAuth: (mode?: 'login' | 'signup') => void;
  activeView: 'catalog' | 'cart' | 'checkpoint' | 'architecture' | 'admin';
  setActiveView: (view: 'catalog' | 'cart' | 'checkpoint' | 'architecture' | 'admin') => void;
  cartCount: number;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onOpenCart?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenAuth,
  activeView,
  setActiveView,
  cartCount,
  searchQuery,
  setSearchQuery,
  onOpenCart,
}) => {
  const { user, isAuthenticated, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md border-b border-neutral-200 dark:border-neutral-800 shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="h-16 flex items-center justify-between gap-4">
          {/* Brand Logo & Name */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveView('catalog')}
              className="flex items-center gap-2.5 text-left cursor-pointer group"
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-600 to-indigo-600 flex items-center justify-center text-white shadow-xs group-hover:scale-105 transition">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-sm text-neutral-900 dark:text-white tracking-tight">
                    Agentic Commerce
                  </span>
                  <span className="bg-sky-500/10 text-sky-600 dark:text-sky-400 text-[10px] font-semibold px-1.5 py-0.2 rounded border border-sky-500/20">
                    Phase 1
                  </span>
                </div>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400 hidden sm:block">
                  Auth & Product Catalog
                </p>
              </div>
            </button>
          </div>

          {/* Search Bar */}
          <div className="flex-1 max-w-md hidden md:block">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-neutral-400" />
              <input
                type="text"
                placeholder="Search products by name, tag, or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs bg-neutral-100 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-hidden focus:ring-2 focus:ring-sky-500 transition"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2 text-[10px] text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 bg-neutral-200 dark:bg-neutral-700 rounded px-1.5 py-0.5 cursor-pointer"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Navigation Views & Actions */}
          <div className="flex items-center gap-2">
            {/* View Switcher Pills */}
            <div className="hidden lg:flex items-center p-1 bg-neutral-100 dark:bg-neutral-800/80 rounded-xl text-xs font-medium border border-neutral-200/60 dark:border-neutral-700/60">
              <button
                onClick={() => setActiveView('catalog')}
                className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                  activeView === 'catalog'
                    ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-2xs font-semibold'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                <ShoppingBag className="w-3.5 h-3.5 text-sky-500" />
                Catalog
              </button>
              <button
                onClick={() => setActiveView('cart')}
                className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                  activeView === 'cart'
                    ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-2xs font-semibold'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                <ShoppingCart className="w-3.5 h-3.5 text-amber-500" />
                Cart
                {cartCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-sky-500 text-white text-[10px] font-bold">
                    {cartCount}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveView('admin')}
                className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                  activeView === 'admin'
                    ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-2xs font-semibold'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                <Shield className="w-3.5 h-3.5 text-purple-600" />
                Admin Analytics
                {user?.role === 'admin' && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                )}
              </button>
            </div>

            {/* Cart Button */}
            <button
              onClick={onOpenCart}
              className="relative p-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200 transition cursor-pointer flex items-center justify-center"
              title="Shopping Cart"
            >
              <ShoppingCart className="w-4 h-4" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-sky-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-scale-in">
                  {cartCount}
                </span>
              )}
            </button>

            {/* Authentication Buttons / User Profile */}
            {isAuthenticated && user ? (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 p-1.5 pr-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 border border-neutral-200 dark:border-neutral-700 transition cursor-pointer text-left"
                >
                  <div className="w-7 h-7 rounded-lg bg-sky-600 text-white flex items-center justify-center text-xs font-bold">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="hidden sm:block">
                    <div className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 line-clamp-1">
                      {user.name}
                    </div>
                    <div className="text-[10px] text-neutral-500 dark:text-neutral-400 flex items-center gap-1">
                      {user.role === 'admin' ? (
                        <span className="text-amber-500 font-medium">Admin</span>
                      ) : (
                        <span>Customer</span>
                      )}
                    </div>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-neutral-400" />
                </button>

                {/* Dropdown Menu */}
                {showUserMenu && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setShowUserMenu(false)}
                    />
                    <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-neutral-900 rounded-xl shadow-xl border border-neutral-200 dark:border-neutral-800 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150 text-xs">
                      <div className="px-3 py-2 border-b border-neutral-100 dark:border-neutral-800">
                        <p className="font-semibold text-neutral-900 dark:text-neutral-100">{user.name}</p>
                        <p className="text-[11px] text-neutral-500 dark:text-neutral-400 truncate">{user.email}</p>
                        <span className="inline-block mt-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300">
                          Role: {user.role}
                        </span>
                      </div>

                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          setActiveView('admin');
                        }}
                        className="w-full text-left px-3 py-2 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition cursor-pointer flex items-center gap-2"
                      >
                        <Shield className="w-3.5 h-3.5 text-purple-600" />
                        Admin Analytics Dashboard
                      </button>

                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          logout();
                        }}
                        className="w-full text-left px-3 py-2 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition cursor-pointer flex items-center gap-2 border-t border-neutral-100 dark:border-neutral-800 mt-1"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        Log Out
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => onOpenAuth('login')}
                  className="px-3 py-1.5 text-xs font-medium text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer flex items-center gap-1"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  Sign In
                </button>
                <button
                  onClick={() => onOpenAuth('signup')}
                  className="px-3 py-1.5 text-xs font-medium text-white bg-sky-600 hover:bg-sky-500 rounded-lg shadow-xs transition cursor-pointer flex items-center gap-1"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  Sign Up
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Search Bar */}
        <div className="pb-3 md:hidden">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-neutral-400" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 text-xs bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-neutral-100 placeholder-neutral-400"
            />
          </div>
        </div>

        {/* Mobile View Switcher */}
        <div className="grid grid-cols-3 gap-1.5 pb-2 lg:hidden text-xs font-medium">
          <button
            onClick={() => setActiveView('catalog')}
            className={`py-1.5 rounded-lg text-center transition cursor-pointer ${
              activeView === 'catalog'
                ? 'bg-sky-500/10 text-sky-600 dark:text-sky-400 font-semibold'
                : 'text-neutral-600 dark:text-neutral-400'
            }`}
          >
            Catalog
          </button>
          <button
            onClick={() => setActiveView('cart')}
            className={`py-1.5 rounded-lg text-center transition cursor-pointer ${
              activeView === 'cart'
                ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 font-semibold'
                : 'text-neutral-600 dark:text-neutral-400'
            }`}
          >
            Cart ({cartCount})
          </button>
          <button
            onClick={() => setActiveView('admin')}
            className={`py-1.5 rounded-lg text-center transition cursor-pointer ${
              activeView === 'admin'
                ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 font-semibold'
                : 'text-neutral-600 dark:text-neutral-400'
            }`}
          >
            Admin
          </button>
        </div>
      </div>
    </header>
  );
};
