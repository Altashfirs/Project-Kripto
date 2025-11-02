
import React, { useState, useEffect } from 'react';
import type { User } from '../types';
import { scryptMock } from '../services/cryptoService';
import Button from './Button';
import Input from './Input';
import Card from './Card';

interface LoginPageProps {
    onLoginSuccess: (username: string) => void;
}

// In a real app, this user data would come from a secure backend.
const MOCK_USER_DB: { [key: string]: User } = {};
const SALT = "a-very-secure-static-salt-for-demo"; // A static salt for this demo.

const initializeMockUser = async () => {
    const hash = await scryptMock('password123', SALT);
    MOCK_USER_DB['user'] = {
        username: 'user',
        scryptHash: hash,
    };
};

const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isInitialized, setIsInitialized] = useState(false);

    useEffect(() => {
        initializeMockUser().then(() => setIsInitialized(true));
    }, []);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!isInitialized) {
            setError('Database is initializing, please wait...');
            return;
        }

        const user = MOCK_USER_DB[username];
        if (!user) {
            setError('Invalid username or password.');
            return;
        }

        const passwordHash = await scryptMock(password, SALT);
        if (passwordHash === user.scryptHash) {
            onLoginSuccess(username);
        } else {
            setError('Invalid username or password.');
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen p-4">
            <Card title="Kripto-Suite Login" description="Login using a simulated Scrypt password hash.">
                <div className="p-6">
                    <div className='text-center mb-4'>
                        <p className="text-text-secondary">Demo credentials:</p>
                        <p className="text-text-primary font-mono">user / password123</p>
                    </div>
                    <form onSubmit={handleLogin} className="space-y-4">
                        <Input
                            id="username"
                            label="Username"
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="Enter your username"
                        />
                        <Input
                            id="password"
                            label="Password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter your password"
                        />
                        {error && <p className="text-red-400 text-sm">{error}</p>}
                        <Button type="submit" className="w-full">
                            {isInitialized ? 'Login' : 'Initializing...'}
                        </Button>
                    </form>
                </div>
            </Card>
        </div>
    );
};

export default LoginPage;
