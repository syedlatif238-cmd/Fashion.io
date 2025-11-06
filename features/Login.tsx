import React, { useState, FormEvent } from 'react';
import { User } from '../App';
import { Spinner } from '../components/Spinner';

interface LoginPageProps {
    onLogin: (user: User) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
    const [email, setEmail] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string>('');

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        if (!email || !password) {
            setError('Please enter both email and password.');
            return;
        }
        
        setIsLoading(true);
        setError('');

        // Simulate a network request
        setTimeout(() => {
            // In a real app, you would validate credentials against a backend.
            // Here, we'll accept any non-empty credentials.
            console.log(`Simulating login for user: ${email}`);
            
            onLogin({
                id: email, // Use email as a unique ID for this example
                email: email
            });

            setIsLoading(false);
        }, 1000);
    };

    return (
        <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <div className="bg-gray-800/70 border border-gray-700 rounded-2xl p-8 max-w-md w-full backdrop-blur-sm">
                <h2 className="text-3xl font-bold mb-2 text-white">Welcome Back!</h2>
                <p className="text-gray-400 mb-8">Log in to consult your AI Stylist.</p>
                
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Email Address"
                        className="w-full p-3 bg-gray-900/70 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none transition-all"
                        disabled={isLoading}
                        aria-label="Email"
                    />
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Password"
                        className="w-full p-3 bg-gray-900/70 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none transition-all"
                        disabled={isLoading}
                        aria-label="Password"
                    />

                    {error && <p className="text-red-400 text-sm text-left">{error}</p>}
                    
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-3 px-4 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105 duration-300"
                    >
                        {isLoading ? <Spinner size="sm" /> : 'Log In'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default LoginPage;
