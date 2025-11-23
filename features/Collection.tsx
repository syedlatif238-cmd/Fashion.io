import React, { useState, useEffect } from 'react';
import { User } from '../App';
import { TrashIcon } from '../components/icons';

// This type should be consistent with the one in StyleAdviser
interface SavedOutfit {
    id: string;
    image: string; // original item
    prompt: string; // user question
    advice: string;
    savedAt: string;
    generatedImage?: string | null;
}

interface CollectionProps {
    user: User;
}

const Collection: React.FC<CollectionProps> = ({ user }) => {
    const [collection, setCollection] = useState<SavedOutfit[]>([]);
    const storageKey = `fashio-ai-collection-${user.id}`;

    useEffect(() => {
        try {
            const storedCollection = localStorage.getItem(storageKey);
            if (storedCollection) {
                setCollection(JSON.parse(storedCollection));
            }
        } catch (error) {
            console.error("Failed to load collection from localStorage", error);
        }
    }, [storageKey]);

    const handleDeleteOutfit = (outfitId: string) => {
        const updatedCollection = collection.filter(outfit => outfit.id !== outfitId);
        setCollection(updatedCollection);
        try {
            localStorage.setItem(storageKey, JSON.stringify(updatedCollection));
        } catch (error) {
            console.error("Failed to save updated collection to localStorage", error);
            // Optionally, show an error to the user
        }
    };

    if (collection.length === 0) {
        return (
            <div className="text-center text-stone-400 py-20 max-w-2xl mx-auto flex flex-col items-center">
                <div className="w-20 h-20 bg-stone-900/50 rounded-full flex items-center justify-center mb-6 border border-stone-800">
                    <span className="text-4xl">🧥</span>
                </div>
                <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-200 to-yellow-100 mb-3">Your Collection is Empty</h2>
                <p>Go to the <span className="font-semibold text-orange-400">Style Adviser</span>, get some advice, and save your favorite outfits to see them here!</p>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto">
            <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white via-yellow-200 to-orange-500 mb-8 px-2 tracking-tight">My Saved Outfits</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {collection.sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime()).map((outfit) => (
                    <div 
                        key={outfit.id} 
                        className="bg-stone-900/40 rounded-2xl overflow-hidden backdrop-blur-md border border-stone-800 flex flex-col group transition-all duration-300 ease-in-out shadow-lg hover:shadow-2xl hover:shadow-orange-500/10 hover:border-orange-500/40 hover:-translate-y-1"
                    >
                        <div className="aspect-square bg-stone-900/50 overflow-hidden relative border-b border-stone-800">
                           <img 
                                src={outfit.generatedImage || outfit.image} 
                                alt={outfit.generatedImage ? "Generated outfit" : "Saved outfit item"}
                                className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-500 ease-out"
                            />
                             {outfit.generatedImage && (
                                <span className="absolute top-3 left-3 bg-gradient-to-r from-orange-600 to-yellow-600 text-white text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded shadow-lg">Visualized</span>
                            )}
                        </div>
                        <div className="p-6 flex flex-col flex-grow">
                            <div className="mb-4 flex-grow min-h-[120px]">
                                <div className="mb-4">
                                    <strong className="text-yellow-100 font-semibold block mb-1 text-xs uppercase tracking-wide opacity-80">Your Question</strong>
                                    <p className="text-sm text-stone-300 italic">"{outfit.prompt}"</p>
                                </div>
                                <div>
                                    <strong className="text-yellow-100 font-semibold block mb-1 text-xs uppercase tracking-wide opacity-80">AI Advice</strong>
                                    <p className="text-sm text-stone-400 line-clamp-3 leading-relaxed">{outfit.advice}</p>
                                </div>
                            </div>
                            <div className="flex justify-between items-center mt-auto pt-4 border-t border-stone-700/30">
                               <p className="text-xs text-stone-600 font-medium">Saved on {new Date(outfit.savedAt).toLocaleDateString()}</p>
                                <button
                                    onClick={() => handleDeleteOutfit(outfit.id)}
                                    className="p-2 text-stone-500 hover:text-red-400 hover:bg-red-950/30 rounded-full transition-colors"
                                    aria-label="Delete outfit"
                                >
                                    <TrashIcon />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Collection;