
import React, { useState } from 'react';
import { BrowserProvider, ethers, Eip1193Provider } from 'ethers';
import { scryptMock } from '../services/cryptoService';
import { supabase } from '../services/supabaseClient';

declare global {
    interface Window {
        ethereum?: Eip1193Provider;
    }
}

interface LoginPageProps {
    onLoginSuccess: (username: string) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    
    const [scryptMode, setScryptMode] = useState<'login' | 'register'>('login');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const SALT = "agency-static-salt-alpha-one";

    // --- Web3 Login Handler ---
    const handleWeb3Login = async () => {
        setError('');
        setIsLoading(true);

        if (typeof window.ethereum === 'undefined') {
            setError('ACCESS DENIED: No digital identity wallet detected.');
            setIsLoading(false);
            return;
        }

        try {
            const provider = new BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            const address = await signer.getAddress();
            const nonce = new Date().getTime();
            const messageToSign = `AGENCY ACCESS REQUEST\n\nIDENTITY VERIFICATION REQUIRED.\n\nTIMESTAMP: ${nonce}`;
            const signature = await signer.signMessage(messageToSign);
            const recoveredAddress = ethers.verifyMessage(messageToSign, signature);

            if (recoveredAddress.toLowerCase() === address.toLowerCase()) {
                const shortAddress = `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
                onLoginSuccess(shortAddress);
            } else {
                setError('VERIFICATION FAILED: Invalid biometric signature.');
            }
        } catch (err: any) {
            setError(err.code === 4001 ? 'ACCESS DENIED: User rejected signature.' : 'SYSTEM ERROR: Connection terminated.');
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

        if (!supabase) {
            setError('CONNECTION ERROR: Mainframe database unreachable.');
            setIsLoading(false);
            return;
        }

        if (!username || !password) {
            setError('INPUT ERROR: Credentials incomplete.');
            setIsLoading(false);
            return;
        }

        try {
            if (scryptMode === 'register') {
                const { data: existingUser, error: selectError } = await supabase
                    .from('users')
                    .select('username')
                    .eq('username', username)
                    .single();

                if (selectError && selectError.code !== 'PGRST116') throw selectError;
                if (existingUser) throw new Error('IDENTITY CONFLICT: Badge number already active.');

                const scryptHash = await scryptMock(password, SALT);
                
                const { error: insertError } = await supabase
                    .from('users')
                    .insert([{ username, encrypted_hash: scryptHash }]);
                
                if (insertError) throw insertError;

                setSuccessMessage('CLEARANCE GRANTED: Identity registered. Proceed to login.');
                setScryptMode('login');
                setPassword('');

            } else { 
                const { data: user, error: selectError } = await supabase
                    .from('users')
                    .select('encrypted_hash')
                    .eq('username', username)
                    .single();

                if (selectError || !user) throw new Error('ACCESS DENIED: Agent identity not found.');
                
                const storedHash = user.encrypted_hash;
                const scryptHashToCompare = await scryptMock(password, SALT);

                if (storedHash !== scryptHashToCompare) throw new Error('ACCESS DENIED: Invalid credentials.');
                
                onLoginSuccess(username);
            }
        } catch (err: any) {
            setError(err.message || 'SYSTEM ERROR: Unknown exception.');
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-agency-black bg-grid-pattern bg-[length:40px_40px]">
            <div className="w-full max-w-md bg-agency-gray border border-agency-border shadow-[0_0_15px_rgba(0,0,0,0.7)] relative overflow-hidden">
                {/* Top decorative bar */}
                <div className="h-1 bg-terminal-green w-full animate-pulse"></div>
                
                <div className="p-8">
                    <div className="text-center mb-10">
                        <div className="inline-block border-2 border-white p-2 mb-4 rounded-full">
                            <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="square" strokeLinejoin="miter" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                        </div>
                        <h1 className="text-3xl font-bold text-white tracking-widest mb-1">C.I.A.</h1>
                        <p className="text-xs text-muted-text uppercase tracking-[0.2em]">Central Intelligence Archive</p>
                        <p className="text-[10px] text-terminal-amber mt-2">SECURE TERMINAL // AUTHORIZED PERSONNEL ONLY</p>
                    </div>

                    {error && (
                        <div className="mb-6 p-3 bg-red-900/20 border-l-4 border-alert-red text-red-400 text-xs font-mono">
                            <span className="font-bold">ERROR:</span> {error}
                        </div>
                    )}
                     {successMessage && (
                        <div className="mb-6 p-3 bg-green-900/20 border-l-4 border-terminal-green text-terminal-green text-xs font-mono">
                            <span className="font-bold">SUCCESS:</span> {successMessage}
                        </div>
                    )}

                    <form onSubmit={handleScryptSubmit} className="space-y-5">
                        <div className="relative group">
                            <label className="text-[10px] uppercase text-muted-text absolute -top-2 left-2 bg-agency-gray px-1 group-focus-within:text-terminal-green transition-colors">Agent ID</label>
                            <input 
                                type="text" 
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full bg-agency-black border border-agency-border text-white px-4 py-3 focus:outline-none focus:border-terminal-green transition-colors font-mono placeholder-gray-700"
                                placeholder="ENTER ID"
                            />
                        </div>
                        <div className="relative group">
                            <label className="text-[10px] uppercase text-muted-text absolute -top-2 left-2 bg-agency-gray px-1 group-focus-within:text-terminal-green transition-colors">Passcode</label>
                            <input 
                                type="password" 
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-agency-black border border-agency-border text-white px-4 py-3 focus:outline-none focus:border-terminal-green transition-colors font-mono placeholder-gray-700"
                                placeholder="••••••••"
                            />
                        </div>

                        <div className="flex gap-3 pt-2">
                             <button type="button" onClick={() => handleScryptSubmit({ preventDefault: () => {} } as any)} className="flex-1 bg-white text-black font-bold py-2 hover:bg-gray-200 transition-colors uppercase text-sm tracking-wider">
                                {scryptMode === 'login' ? 'Authenticate' : 'Register ID'}
                            </button>
                            <button type="button" onClick={() => setScryptMode(scryptMode === 'login' ? 'register' : 'login')} className="px-3 border border-agency-border text-muted-text hover:text-white hover:border-white transition-colors text-xs uppercase">
                                {scryptMode === 'login' ? 'New Agent?' : 'Cancel'}
                            </button>
                        </div>
                    </form>

                    <div className="mt-8 pt-6 border-t border-agency-border text-center">
                        <p className="text-xs text-muted-text mb-3">- OR ALTERNATIVE AUTH -</p>
                        <button onClick={handleWeb3Login} disabled={isLoading} className="w-full border border-terminal-amber/50 text-terminal-amber py-2 hover:bg-terminal-amber/10 transition-colors uppercase text-xs tracking-wider flex items-center justify-center gap-2">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" /></svg>
                            Biometric / Wallet Access
                        </button>
                    </div>
                </div>
                
                {/* Footer status bar */}
                <div className="bg-agency-black px-4 py-2 flex justify-between text-[9px] text-muted-text font-mono border-t border-agency-border">
                    <span>SYS_STATUS: ONLINE</span>
                    <span>ENCRYPTION: AES-256</span>
                    <span>V.2.0.4</span>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
