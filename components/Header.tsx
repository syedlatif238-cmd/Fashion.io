import React from 'react';
import { User } from '../App';

interface HeaderProps {
  user: User | null;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({ user, onLogout }) => {
  return (
    <header className="bg-gray-900/50 backdrop-blur-sm border-b border-gray-700/50 sticky top-0 z-10">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">
          Fashio.AI
        </h1>
        {user && (
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-300 hidden sm:block">Welcome, {user.email}</span>
            <button
              onClick={onLogout}
              className="px-4 py-2 text-sm font-medium text-white bg-gray-700/50 border border-gray-600 rounded-lg hover:bg-gray-700 transition-colors"
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
