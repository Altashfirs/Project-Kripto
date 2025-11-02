
import React, { useState } from 'react';
import LoginPage from './components/LoginPage';
import MainApp from './components/MainApp';

const App: React.FC = () => {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
    const [username, setUsername] = useState<string>('');

    const handleLoginSuccess = (user: string) => {
        setUsername(user);
        setIsAuthenticated(true);
    };

    const handleLogout = () => {
        setUsername('');
        setIsAuthenticated(false);
    };

    return (
        <div className="min-h-screen bg-primary">
            {isAuthenticated ? (
                <MainApp username={username} onLogout={handleLogout} />
            ) : (
                <LoginPage onLoginSuccess={handleLoginSuccess} />
            )}
        </div>
    );
};

export default App;
