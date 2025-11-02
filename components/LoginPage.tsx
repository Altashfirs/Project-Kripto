import React, { useState } from 'react';
import { BrowserProvider, ethers, Eip1193Provider } from 'ethers';
import Button from './Button';
import Card from './Card';
import Input from './Input';
import { scryptMock } from '../services/cryptoService';
import { User } from '../types';

declare global {
    interface Window {
        ethereum?: Eip1193Provider;
    }
}

interface LoginPageProps {
    onLoginSuccess: (username: string) => void;
}

// Simple in-memory "database" for Scrypt users
const initialDb: User[] = [];

const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    
    // State for login method selection
    const [activeMethod, setActiveMethod] = useState<'web3' | 'scrypt'>('web3');

    // State for Scrypt login/registration
    const [usersDb, setUsersDb] = useState<User[]>(initialDb);
    const [scryptMode, setScryptMode] = useState<'login' | 'register'>('login');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const SALT = "static-salt-for-demo-purposes"; // In a real app, this should be unique per user

    const clearForm = (clearUsername = true) => {
        setError('');
        setSuccessMessage('');
        if (clearUsername) {
            setUsername('');
        }
        setPassword('');
    };
    
    // --- Web3 Login Handler ---
    const handleWeb3Login = async () => {
        setError('');
        setIsLoading(true);

        if (typeof window.ethereum === 'undefined') {
            setError('Please install MetaMask to use this login method.');
            setIsLoading(false);
            return;
        }

        try {
            const provider = new BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            const address = await signer.getAddress();
            const nonce = new Date().getTime();
            const messageToSign = `Welcome to Kripto-Suite!\n\nPlease sign this message to confirm your identity.\n\nNonce: ${nonce}`;
            const signature = await signer.signMessage(messageToSign);
            const recoveredAddress = ethers.verifyMessage(messageToSign, signature);

            if (recoveredAddress.toLowerCase() === address.toLowerCase()) {
                const shortAddress = `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
                onLoginSuccess(shortAddress);
            } else {
                setError('Signature verification failed. Please try again.');
            }
        } catch (err: any) {
            if (err.code === 4001) {
                setError('You rejected the request in MetaMask.');
            } else {
                setError(err.message || 'An unexpected error occurred with MetaMask.');
            }
        } finally {
            setIsLoading(false);
        }
    };
    
    // --- Scrypt Login/Register Handler ---
    const handleScryptSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');
        setIsLoading(true);

        if (!username || !password) {
            setError('Username and password are required.');
            setIsLoading(false);
            return;
        }

        try {
            if (scryptMode === 'register') {
                if (usersDb.find(u => u.username === username)) {
                    throw new Error('Username already exists.');
                }
                const scryptHash = await scryptMock(password, SALT);
                const newUser = { username, scryptHash };
                setUsersDb([...usersDb, newUser]);
                
                // Switch to login mode with a success message
                setSuccessMessage('Registration successful! Please log in.');
                setScryptMode('login');
                setPassword(''); // Clear password field for security

            } else { // Login mode
                const user = usersDb.find(u => u.username === username);
                if (!user) {
                    throw new Error('User not found. Please register first.');
                }
                const scryptHash = await scryptMock(password, SALT);
                if (scryptHash !== user.scryptHash) {
                    throw new Error('Incorrect password.');
                }
                onLoginSuccess(username);
            }
        } catch (err: any) {
            setError(err.message || 'An error occurred.');
        } finally {
            setIsLoading(false);
        }
    };
    
    const tabStyle = (active: boolean) => active ? 'border-accent text-accent' : 'border-transparent text-text-secondary hover:text-text-primary hover:border-border-color';

    return (
        <div className="flex items-center justify-center min-h-screen p-4">
            <Card title="Welcome to Kripto-Suite" description="Choose your preferred method to authenticate.">
                 <div className="border-b border-border-color">
                    <nav className="-mb-px flex space-x-6 px-6" aria-label="Tabs">
                        <button onClick={() => { setActiveMethod('web3'); clearForm(); }} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${tabStyle(activeMethod === 'web3')}`}>
                            Web3 Login (Recommended)
                        </button>
                        <button onClick={() => { setActiveMethod('scrypt'); clearForm(); }} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${tabStyle(activeMethod === 'scrypt')}`}>
                            Classic Login (Scrypt)
                        </button>
                    </nav>
                </div>

                {/* Web3 Login Content */}
                {activeMethod === 'web3' && (
                    <div className="p-6 text-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-16 w-16 text-accent mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-1.026.977-2.243.977-3.631C20 11.22 16.418 8 12 8S4 11.22 4 15.222c0 1.388.332 2.605.977 3.631m13.06-1.132L15.171 17m2.828 2.828L18 17m-8.686 2.828L9.171 17M6 15.222V15c0-1.657 1.343-3 3-3s3 1.343 3 3v.222" />
                        </svg>
                        <p className="text-text-secondary mb-6">
                            Instead of a password, you'll use your wallet to prove you're you. Your private keys never leave your wallet.
                        </p>
                        {error && <p className="text-red-400 text-sm mb-4 bg-red-900/20 p-3 rounded-md">{error}</p>}
                        <Button onClick={handleWeb3Login} disabled={isLoading} className="w-full">
                            {isLoading ? 'Waiting for Signature...' : 'Login with MetaMask'}
                        </Button>
                    </div>
                )}
                
                {/* Scrypt Login Content */}
                {activeMethod === 'scrypt' && (
                    <form onSubmit={handleScryptSubmit} className="p-6 space-y-4">
                        <div className="flex justify-center rounded-md bg-primary border border-border-color p-1">
                            <button type="button" onClick={() => { setScryptMode('login'); clearForm(); }} className={`px-4 py-1.5 w-full text-sm font-medium rounded-md ${scryptMode === 'login' ? 'bg-accent text-white' : 'text-text-secondary'}`}>Login</button>
                            <button type="button" onClick={() => { setScryptMode('register'); clearForm(); }} className={`px-4 py-1.5 w-full text-sm font-medium rounded-md ${scryptMode === 'register' ? 'bg-accent text-white' : 'text-text-secondary'}`}>Register</button>
                        </div>
                        {successMessage && <p className="text-green-400 text-sm bg-green-900/20 p-3 rounded-md">{successMessage}</p>}
                        <Input id="username" label="Username" type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Enter your username" required />
                        <Input id="password" label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter your password" required />
                        {error && <p className="text-red-400 text-sm">{error}</p>}
                        <Button type="submit" disabled={isLoading} className="w-full">
                            {isLoading ? 'Processing...' : (scryptMode === 'login' ? 'Login' : 'Register')}
                        </Button>
                    </form>
                )}
            </Card>
        </div>
    );
};

export default LoginPage;