import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Plane, LogOut, User as UserIcon, LayoutDashboard, ChevronDown } from 'lucide-react';
import LoginModal from './LoginModal';

export default function Navbar() {
  const { user, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <nav className="bg-black border-b border-zinc-800 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <Link to="/" className="flex-shrink-0 flex items-center gap-2">
              <div className="bg-white p-1.5 rounded-md">
                <Plane className="h-5 w-5 text-black" />
              </div>
              <span className="font-bold text-xl text-white tracking-tight">Sansnsea</span>
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            {user ? (
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="flex items-center gap-2 hover:opacity-80 transition-opacity focus:outline-none"
                >
                  {user.photoURL ? (
                    <img src={user.photoURL} alt={user.displayName || 'User'} className="h-8 w-8 rounded-full border border-zinc-800" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                      <UserIcon className="h-4 w-4 text-zinc-400" />
                    </div>
                  )}
                  <ChevronDown className="h-4 w-4 text-zinc-400" />
                </button>

                {isMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-zinc-950 border border-zinc-800 rounded-lg shadow-2xl py-1 z-50 overflow-hidden">
                    <div className="px-4 py-3 border-b border-zinc-800 bg-zinc-900/50">
                      <p className="text-sm font-medium text-white truncate">{user.displayName || 'User'}</p>
                      <p className="text-xs text-zinc-400 truncate mt-0.5">{user.email}</p>
                    </div>
                    <div className="py-1">
                      {user.role === 'admin' && (
                        <Link
                          to="/admin"
                          className="flex items-center px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-900 hover:text-white transition-colors"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          <LayoutDashboard className="h-4 w-4 mr-2" />
                          Admin Dashboard
                        </Link>
                      )}
                      <Link
                        to="/dashboard"
                        className="flex items-center px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-900 hover:text-white transition-colors"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <UserIcon className="h-4 w-4 mr-2" />
                        My Bookings
                      </Link>
                    </div>
                    <div className="border-t border-zinc-800 py-1">
                      <button
                        onClick={() => { logout(); setIsMenuOpen(false); }}
                        className="flex items-center w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-zinc-900 hover:text-red-300 transition-colors"
                      >
                        <LogOut className="h-4 w-4 mr-2" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => setIsLoginModalOpen(true)}
                className="inline-flex items-center justify-center px-4 py-2 border border-zinc-800 rounded-md shadow-sm text-sm font-medium text-white bg-black hover:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-zinc-500 transition-colors"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </div>
      
      <LoginModal 
        isOpen={isLoginModalOpen} 
        onClose={() => setIsLoginModalOpen(false)} 
      />
    </nav>
  );
}
