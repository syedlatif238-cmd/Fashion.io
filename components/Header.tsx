import React from 'react';
import { User } from '../App';

interface HeaderProps {
  user: User | null;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({ user, onLogout }) => {
  return (
    <header className="bg-stone-900/40 backdrop-blur-md border-b border-white/5 sticky top-0 z-20">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white via-yellow-200 to-orange-500 drop-shadow-sm tracking-tight">
          Fashio.AI
        </h1>
        {user && (
          <div className="flex items-center gap-4">
            <span className="text-sm text-stone-300 hidden sm:block">Welcome, <span className="text-yellow-100">{user.email}</span></span>
            <button
              onClick={onLogout}
              className="px-4 py-2 text-sm font-medium text-stone-300 bg-stone-800/50 border border-stone-700 rounded-lg hover:bg-orange-950/30 hover:text-orange-200 hover:border-orange-500/30 transition-all duration-300"
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </header>
  );
};