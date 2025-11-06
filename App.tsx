import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import StyleAdviser from './features/StyleAdviser';
import Chat from './features/Chat';
import LoginPage from './features/Login';
import { CameraIcon, ChatBubbleIcon } from './components/icons';
import { Spinner } from './components/Spinner';

type Tab = 'adviser' | 'chat';

export interface User {
  id: string;
  email: string;
}

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<Tab>('adviser');

  useEffect(() => {
    // Check for a logged-in user in localStorage
    try {
      const storedUser = localStorage.getItem('fashio-ai-user');
      if (storedUser) {
        setCurrentUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error("Failed to parse user from localStorage", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleLogin = (user: User) => {
    localStorage.setItem('fashio-ai-user', JSON.stringify(user));
    setCurrentUser(user);
  };

  const handleLogout = () => {
    localStorage.removeItem('fashio-ai-user');
    setCurrentUser(null);
    // Reset to the main tab for the next user
    setActiveTab('adviser');
  };

  const TabButton: React.FC<{ tabName: Tab; label: string; icon: React.ReactNode }> = ({ tabName, label, icon }) => (
    <button
      onClick={() => setActiveTab(tabName)}
      className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium rounded-t-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-900 ${
        activeTab === tabName
          ? 'bg-gray-800/70 text-white border-b-2 border-purple-500'
          : 'text-gray-400 hover:bg-gray-800/50 hover:text-white'
      }`}
      aria-current={activeTab === tabName}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );

  const renderTabContent = () => {
    if (!currentUser) return null; // Should not happen if logic is correct
    switch (activeTab) {
      case 'adviser':
        return <StyleAdviser />;
      case 'chat':
        // By using the user's ID as a key, we ensure the Chat component
        // unmounts and remounts with a fresh state when the user changes.
        return <Chat key={currentUser.id} />;
      default:
        return <StyleAdviser />;
    }
  };

  const renderAppContent = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center h-full">
            <Spinner size="lg" />
        </div>
      );
    }

    if (!currentUser) {
      return <LoginPage onLogin={handleLogin} />;
    }

    return (
      <>
        {/* Tab Navigation */}
        <div className="w-full max-w-4xl mx-auto mb-6">
          <nav aria-label="Main navigation">
            <div className="flex bg-gray-900/50 backdrop-blur-sm border border-gray-700 rounded-lg p-1">
              <TabButton tabName="adviser" label="Style Adviser" icon={<CameraIcon />} />
              <TabButton tabName="chat" label="Chat Stylist" icon={<ChatBubbleIcon />} />
            </div>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="flex-grow">
          {renderTabContent()}
        </div>
      </>
    );
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col">
      <Header user={currentUser} onLogout={handleLogout} />
      <main className="flex-grow container mx-auto p-4 md:px-8 md:pb-8 flex flex-col">
        {renderAppContent()}
      </main>
    </div>
  );
};

export default App;
