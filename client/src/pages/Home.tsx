// client/src/pages/Home.tsx
import React from 'react';

const Home: React.FC = () => {
    const handleRealDebridLogin = () => {
        // Redirect the user to Real-Debrid's authorization endpoint
        const clientId = 'X245A4XAIBGVM'; // Replace with your Real-Debrid Client ID
        const redirectUri = encodeURIComponent('http://localhost:3000/auth/real-debrid/callback'); // Your callback URI
        const state = 'kur'; // Generate a random state value for security
        const realDebridAuthUrl = `https://api.real-debrid.com/oauth/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&state=${state}`;

        // Redirect the user to Real-Debrid's authorization page
        window.location.href = realDebridAuthUrl;
    };

    return (
        <div>
            <h1>Kodi Searcher App</h1>
            <button onClick={handleRealDebridLogin}>
                Connect with Real-Debrid
            </button>
            {/* Rest of your home page */}
        </div>
    );
};

export default Home;
