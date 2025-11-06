import React, { useState } from 'react';
import TextEncryption from './TextEncryption';
import FileEncryption from './FileEncryption';
import ImageSteganography from './ImageSteganography';
import DataVault from './DataVault';
import Button from './Button';

interface MainAppProps {
    username: string;
    onLogout: () => void;
}

type Tab = 'vault' | 'text' | 'file' | 'steganography';

const MainApp: React.FC<MainAppProps> = ({ username, onLogout }) => {
    const [activeTab, setActiveTab] = useState<Tab>('vault');

    const renderContent = () => {
        switch (activeTab) {
            case 'vault':
                return <DataVault username={username} />;
            case 'text':
                return <TextEncryption />;
            case 'file':
                return <FileEncryption />;
            case 'steganography':
                return <ImageSteganography />;
            default:
                return null;
        }
    };

    const tabStyle = (tab: Tab) => activeTab === tab
        ? 'border-accent text-accent'
        : 'border-transparent text-text-secondary hover:text-text-primary hover:border-border-color';

    return (
        <div className="container mx-auto p-4 sm:p-6 lg:p-8">
            <header className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-white">CipherCom Terminal</h1>
                    <p className="text-text-secondary">Operator <span className="text-accent">{username}</span> online.</p>
                </div>
                <Button onClick={onLogout} variant="secondary">Logout</Button>
            </header>

            <div className="border-b border-border-color mb-8">
                <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                    <button onClick={() => setActiveTab('vault')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${tabStyle('vault')}`}>
                        Dead Drop
                    </button>
                    <button onClick={() => setActiveTab('text')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${tabStyle('text')}`}>
                        Encrypted Channel
                    </button>
                    <button onClick={() => setActiveTab('file')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${tabStyle('file')}`}>
                        File Obfuscation
                    </button>
                    <button onClick={() => setActiveTab('steganography')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${tabStyle('steganography')}`}>
                        Steganography Protocol
                    </button>
                </nav>
            </div>

            <main>
                {renderContent()}
            </main>

            <footer className="text-center mt-12 text-text-secondary text-sm">
                <p>CipherCom simulation. Cryptographic implementations are for demonstration purposes only and are not secure for real-world use.</p>
            </footer>
        </div>
    );
};

export default MainApp;