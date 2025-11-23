import React, { useState, FormEvent } from 'react';
import { User } from '../App';
import { Spinner } from '../components/Spinner';

interface LoginPageProps {
    onLogin: (user: User) => void;
}

interface RegisteredUser {
    email: string;
    password: string; // In a real app, this would be a hash
}

type AuthMode = 'signin' | 'signup';

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
    // Form state
    const [email, setEmail] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    
    // UI/Flow state
    const [authMode, setAuthMode] = useState<AuthMode>('signin');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string>('');

    // --- LocalStorage Helpers ---
    const getRegisteredUsers = (): RegisteredUser[] => {
        try {
            const users = localStorage.getItem('fashio-ai-registered-users');
            return users ? JSON.parse(users) : [];
        } catch {
            return [];
        }
    };
    
    const addRegisteredUser = (newUser: RegisteredUser) => {
        const users = getRegisteredUsers();
        if (!users.some(u => u.email === newUser.email)) {
            users.push(newUser);
            localStorage.setItem('fashio-ai-registered-users', JSON.stringify(users));
        }
    };

    // --- Form Handlers ---
    const handleFormSubmit = (e: FormEvent) => {
        e.preventDefault();
        if (!email || !password) {
            setError('Please enter both email and password.');
            return;
        }
        
        setIsLoading(true);
        setError('');

        // Simulate network delay
        setTimeout(() => {
            if (authMode === 'signin') {
                handleSignIn();
            } else {
                handleSignUp();
            }
        }, 1000);
    };
    
    const handleSignIn = () => {
        const registeredUsers = getRegisteredUsers();
        const existingUser = registeredUsers.find(u => u.email === email);
        
        if (!existingUser) {
            setError("No account found with this email. Please sign up.");
            setIsLoading(false);
        } else if (existingUser.password === password) {
            onLogin({ id: email, email: email });
        } else {
            setError('Invalid password. Please try again.');
            setIsLoading(false);
        }
    };

    const handleSignUp = () => {
        const registeredUsers = getRegisteredUsers();
        const existingUser = registeredUsers.find(u => u.email === email);

        if (existingUser) {
             setError("Account already exists. Please sign in.");
             setIsLoading(false);
        } else {
             addRegisteredUser({ email, password });
             onLogin({ id: email, email: email });
        }
    };

    return (
        <div className="min-h-[80vh] flex items-center justify-center p-4">
            <div className="bg-stone-900/40 backdrop-blur-md border border-stone-800 rounded-2xl shadow-2xl p-8 w-full max-w-md">
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white via-yellow-200 to-orange-500 mb-2">Fashio.AI</h1>
                    <p className="text-stone-400">Your AI Personal Stylist</p>
                </div>

                <div className="flex p-1 bg-stone-800/50 rounded-lg mb-6 border border-stone-700">
                    <button
                        className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${authMode === 'signin' ? 'bg-orange-500 text-white shadow-lg' : 'text-stone-400 hover:text-white'}`}
                        onClick={() => { setAuthMode('signin'); setError(''); }}
                        disabled={isLoading}
                    >
                        Sign In
                    </button>
                    <button
                        className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${authMode === 'signup' ? 'bg-orange-500 text-white shadow-lg' : 'text-stone-400 hover:text-white'}`}
                        onClick={() => { setAuthMode('signup'); setError(''); }}
                        disabled={isLoading}
                    >
                        Sign Up
                    </button>
                </div>

                <form onSubmit={handleFormSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-stone-300 mb-1">Email</label>
                        <input
                            type="email"
                            className="w-full px-4 py-2 bg-stone-900/60 border border-stone-700 rounded-lg focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 outline-none text-white transition-all placeholder-stone-600"
                            placeholder="you@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            disabled={isLoading}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-stone-300 mb-1">Password</label>
                        <input
                            type="password"
                            className="w-full px-4 py-2 bg-stone-900/60 border border-stone-700 rounded-lg focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 outline-none text-white transition-all placeholder-stone-600"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            disabled={isLoading}
                        />
                    </div>

                    {error && <p className="text-red-400 text-sm bg-red-900/20 p-2 rounded border border-red-900/30">{error}</p>}

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-3 px-4 bg-gradient-to-r from-orange-600 to-yellow-600 hover:from-orange-500 hover:to-yellow-500 text-white font-bold rounded-lg shadow-lg shadow-orange-900/20 transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed mt-4"
                    >
                        {isLoading ? <Spinner size="sm" /> : (authMode === 'signin' ? 'Sign In' : 'Create Account')}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default LoginPage;