import React from 'react';
import { OutfitRating } from '../services/geminiService';
import { Spinner } from './Spinner';

interface RatingDisplayProps {
    rating: OutfitRating | null;
    isLoading: boolean;
    error: string;
}

const ScoreCircle: React.FC<{ score: number }> = ({ score }) => {
    const percentage = score * 10;
    const circumference = 2 * Math.PI * 45; // r = 45
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    const getColor = (s: number) => {
        if (s >= 8) return 'text-green-400';
        if (s >= 5) return 'text-yellow-400';
        return 'text-red-400';
    }

    return (
        <div className="relative h-32 w-32 flex items-center justify-center">
            <svg className="absolute" width="128" height="128" viewBox="0 0 100 100">
                <circle
                    cx="50"
                    cy="50"
                    r="45"
                    strokeWidth="10"
                    className="stroke-current text-gray-700"
                    fill="transparent"
                />
                <circle
                    cx="50"
                    cy="50"
                    r="45"
                    strokeWidth="10"
                    strokeLinecap="round"
                    className={`stroke-current ${getColor(score)} transition-all duration-1000 ease-out`}
                    fill="transparent"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    transform="rotate(-90 50 50)"
                />
            </svg>
            <span className={`text-3xl font-bold ${getColor(score)}`}>{score.toFixed(1)}</span>
        </div>
    )
}

export const RatingDisplay: React.FC<RatingDisplayProps> = ({ rating, isLoading, error }) => {
    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-full p-8">
                <Spinner />
                <p className="mt-4 text-gray-400">Your stylist is rating your look...</p>
            </div>
        );
    }

    if (error && !rating) {
        return <p className="text-red-400 text-sm text-center p-8">{error}</p>;
    }
    
    if (!rating) {
        return null;
    }

    return (
        <div className="flex flex-col gap-6 text-white animate-fade-in">
            <div className="text-center p-6 bg-gray-900/50 rounded-xl">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-400 mb-2">Overall Score</h3>
                <div className="flex justify-center">
                    <ScoreCircle score={rating.overallScore} />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="bg-gray-900/50 rounded-xl p-6">
                    <h4 className="font-bold text-lg mb-2">Outfit Analysis ({rating.outfitAnalysis.score.toFixed(1)}/10)</h4>
                    <p className="text-gray-300 text-sm">{rating.outfitAnalysis.comments}</p>
                 </div>
                 {rating.facialAnalysis.score > 0 && (
                     <div className="bg-gray-900/50 rounded-xl p-6">
                        <h4 className="font-bold text-lg mb-2">Facial Analysis ({rating.facialAnalysis.score.toFixed(1)}/10)</h4>
                        <p className="text-gray-300 text-sm">{rating.facialAnalysis.comments}</p>
                     </div>
                 )}
            </div>

            <div className="bg-gradient-to-r from-sky-500/20 to-indigo-500/20 rounded-xl p-6 border border-sky-500/50">
                <h4 className="font-bold text-lg mb-2">Stylist's Summary</h4>
                <p className="text-gray-200">{rating.summary}</p>
            </div>
        </div>
    );
};
