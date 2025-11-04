import React from 'react';
import TextEncryption from './TextEncryption';
import FileEncryption from './FileEncryption';
import ImageSteganography from './ImageSteganography';
import DataVault from './DataVault';
import Button from './Button';

interface MainAppProps {
    username: string;
    onLogout: () => void;
}

const MainApp: React.FC<MainAppProps> = ({ username, onLogout }) => {
    return (
        <div className="container mx-auto p-4 sm:p-6 lg:p-8">
            <header className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-white">Kripto-Suite</h1>
                    <p className="text-text-secondary">Welcome, {username}!</p>
                </div>
                <Button onClick={onLogout} variant="secondary">Logout</Button>
            </header>

            <main className="space-y-8">
                <DataVault username={username} />
                <TextEncryption />
                <FileEncryption />
                <ImageSteganography />
            </main>

            <footer className="text-center mt-12 text-text-secondary text-sm">
                <p>Built for educational purposes. Cryptographic implementations are mocks and not secure.</p>
            </footer>
        </div>
    );
};

export default MainApp;