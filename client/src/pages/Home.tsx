import React, { useState } from 'react';
import axios from 'axios';


const Home: React.FC = () => {

    const [torrentUrl, setTorrentUrl] = useState('');


    const scrapeAndAddMagnet = async () => {
        const torrentSiteUrl = 'https://bitsearch.to/search?q=Naruto+Shippuden+-+002&sort=size';
        const realDebridApiKey = 'RGJLMRJEYXFYOSJ76JQ34HEBNRBA6A3BHRJ63OQE47L3DQWNCSSQ';

        try {
            // 1. Scrape the first magnet link
            const response = await axios.get('http://localhost:3000/scrape', {
                params: { url: torrentUrl },
            });

            const magnetLink = response.data.magnetLink;
            if (!magnetLink) {
                console.error('No magnet link found');
                return;
            }

            console.log(`Magnet link: ${magnetLink}`);

            // 2. Add the magnet link to Real-Debrid and get the torrent ID
            const realDebridResponse = await axios.post(
                'https://api.real-debrid.com/rest/1.0/torrents/addMagnet',
                new URLSearchParams({
                    magnet: magnetLink,
                }).toString(),
                {
                    headers: {
                        Authorization: `Bearer ${realDebridApiKey}`,
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                }
            );

            const torrentId = realDebridResponse.data.id;
            console.log(`Real-Debrid Torrent ID: ${torrentId}`);

            if (!torrentId) {
                console.error('Failed to get torrent ID from Real-Debrid');
                return;
            }

            // 3. Select files for the torrent using the ID
            const selectFilesResponse = await axios.post(
                `https://api.real-debrid.com/rest/1.0/torrents/selectFiles/URY6OJPDYMSXQ`,
                new URLSearchParams({
                    files: 'all',
                }).toString(),
                {
                    headers: {
                        Authorization: `Bearer ${realDebridApiKey}`,
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                }
            );
            console.log('Select Files Response:', selectFilesResponse.data);

        } catch (error) {
            console.error('Error:', error.response?.data || error.message);
        }
    };

    return (
        <div >

            <input
                type="text"
                value={torrentUrl}
                onChange={(e) => setTorrentUrl(e.target.value)}
                placeholder="torrent url"
                required

            />

            <button onClick={scrapeAndAddMagnet}>Scrape and Add Magnet</button>
        </div>
    );
};

export default Home;
