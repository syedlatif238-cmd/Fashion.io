import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import StyleAdviser from './features/StyleAdviser';
import Chat from './features/Chat';
import LoginPage from './features/Login';
import Collection from './features/Collection';
import OutfitGenerator from './features/OutfitGenerator';
import ImageCustomizer from './features/ImageCustomizer';
import { CameraIcon, ChatBubbleIcon, BookmarkIcon, SparklesIcon, EditIcon } from './components/icons';
import { Spinner } from './components/Spinner';

type Tab = 'adviser' | 'chat' | 'collection' | 'generator' | 'customizer';

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
      className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium rounded-t-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 focus:ring-offset-stone-900 ${
        activeTab === tabName
          ? 'bg-stone-800/80 text-orange-400 border-b-2 border-orange-500 shadow-[0_-4px_15px_-3px_rgba(249,115,22,0.1)]'
          : 'text-stone-400 hover:bg-stone-800/50 hover:text-yellow-200'
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
        return <StyleAdviser user={currentUser} />;
      case 'chat':
        // By using the user's ID as a key, we ensure the Chat component
        // unmounts and remounts with a fresh state when the user changes.
        return <Chat key={currentUser.id} />;
      case 'collection':
        return <Collection key={currentUser.id} user={currentUser} />;
      case 'generator':
        return <OutfitGenerator />;
      case 'customizer':
        return <ImageCustomizer />;
      default:
        return <StyleAdviser user={currentUser} />;
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
        <div className="w-full max-w-5xl mx-auto mb-6">
          <nav aria-label="Main navigation">
            <div className="flex bg-stone-900/50 backdrop-blur-sm border border-stone-800 rounded-lg p-1">
              <TabButton tabName="adviser" label="Style Adviser" icon={<CameraIcon />} />
              <TabButton tabName="chat" label="Chat Stylist" icon={<ChatBubbleIcon />} />
              <TabButton tabName="collection" label="Collection" icon={<BookmarkIcon />} />
              <TabButton tabName="generator" label="Outfit Generator" icon={<SparklesIcon />} />
              <TabButton tabName="customizer" label="AI Image Editor" icon={<EditIcon />} />
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
    <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-stone-900 via-stone-950 to-stone-950">
      <Header user={currentUser} onLogout={handleLogout} />
      <main className="flex-grow container mx-auto p-4 md:px-8 md:pb-8 flex flex-col">
        {renderAppContent()}
      </main>
    </div>
  );
};

export default App;