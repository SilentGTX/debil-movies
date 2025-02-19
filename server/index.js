// server/index.js

const express = require('express');
const axios = require('axios');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');
const cheerio = require('cheerio');


dotenv.config();

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
    origin: 'http://localhost:5173', // Update if frontend is hosted elsewhere
    credentials: true,
}));

// Search movies route
app.get('/api/search', async (req, res) => {
    const name = req.query.name;
    if (!name) {
        console.error('Query parameter "name" is required.');
        return res.status(400).json({ error: 'Query parameter "name" is required.' });
    }

    const tmdbApiKey = process.env.TMDB_API_KEY;
    if (!tmdbApiKey) {
        console.error('TMDB API key not configured.');
        return res.status(500).json({ error: 'TMDB API key not configured.' });
    }

    const tmdbApiUrl = `https://api.themoviedb.org/3/search/multi?api_key=${tmdbApiKey}&query=${encodeURIComponent(name)}&include_adult=false&language=en-US&page=1`;

    try {
        const { data } = await axios.get(tmdbApiUrl);
        const movies = data.results;
        res.json({ movies });
    } catch (error) {
        console.error('Error fetching movie data:', error.message);
        res.status(500).json({ error: 'Failed to fetch movies from TMDB.' });
    }
});

// Play movie or TV series route
app.post('/api/play', async (req, res) => {
    const { mediaData } = req.body;

    if (!mediaData.id || !mediaData.type) {
        console.error('Movie ID and Movie Type are required.');
        return res.status(400).json({ error: 'Movie ID and Movie Type are required.' });
    }

    // For TV episodes, ensure season and episode are provided
    if (mediaData.type === 'tv' && (typeof mediaData.season !== 'number' || typeof mediaData.episode !== 'number')) {
        console.error('Season and Episode numbers are required for TV series.');
        return res.status(400).json({ error: 'Season and Episode numbers are required for TV series.' });
    }

    console.log(`Received play request for ${mediaData.type} ID: ${mediaData.id}${mediaData.type === 'tv' ? `, Season: ${mediaData.season}, Episode: ${mediaData.episode}` : ''}`);

    const tmdbApiKey = process.env.TMDB_API_KEY;
    if (!tmdbApiKey) {
        console.error('TMDB API key not configured.');
        return res.status(500).json({ error: 'TMDB API key not configured.' });
    }


    try {
        // Fetch movie, TV show, or TV episode details from TMDB
        let externalIdsUrl = `https://api.themoviedb.org/3/${mediaData.type}/${mediaData.id}/external_ids?api_key=${tmdbApiKey}`;

        // Fetch the external IDs to get the IMDb ID
        console.log(externalIdsUrl);
        const externalIdsResponse = await axios.get(externalIdsUrl);

        const { imdb_id } = externalIdsResponse.data;

        if (!imdb_id) {
            console.error('IMDb ID not found for the requested media.');
            return res.status(500).json({ error: 'IMDb ID not found for the requested media.' });
        }


        const kodiUrl = process.env.KODI_URL;
        const kodiUser = process.env.KODI_USER;
        const kodiPassword = process.env.KODI_PASSWORD;

        if (!kodiUrl || !kodiUser || !kodiPassword) {
            console.error('Kodi configuration not set.');
            return res.status(500).json({ error: 'Kodi configuration not set.' });
        }

        const meta = {
            "tmdb": mediaData.id,
            "title": mediaData.episodeName,
            "season": mediaData.season,
            "tvshowtitle": mediaData.name,
            "episode": mediaData.episode,
            "imdb": imdb_id
        };

        const movieUrl1 = "plugin://plugin.video.umbrella/?action=play&title=Venom&year=2005&imdb=tt0428251&tmdb=7182";

        const movieUrl = `plugin://plugin.video.umbrella/?action=play&title=${encodeURIComponent(
            meta.title
        )}&imdb=${encodeURIComponent(
            meta.imdb
        )}&tmdb=${encodeURIComponent(
            meta.tmdb
        )}&meta=${encodeURIComponent(
            JSON.stringify(meta)
        )}`;

        const showUrl = `plugin://plugin.video.umbrella/?action=play_Item&title=${encodeURIComponent(
            meta.title
        )}&imdb=${encodeURIComponent(
            meta.imdb
        )}&tmdb=${encodeURIComponent(
            meta.tmdb
        )}&tvshowtitle=${encodeURIComponent(
            meta.tvshowtitle
        )}&season=${encodeURIComponent(
            meta.season
        )}&episode=${encodeURIComponent(
            meta.episode
        )}&meta=${encodeURIComponent(
            JSON.stringify(meta)
        )}`;


        const playUrl = mediaData.type === 'tv' ? showUrl : movieUrl;

        console.log(`Constructed Playback URL: ${playUrl}`);

        // Kodi JSON-RPC request
        const kodiRequest = {
            "jsonrpc": "2.0",
            "method": "Player.Open",
            "params": {
                "item": {
                    "file": playUrl
                }
            },
            "id": 1
        }


        // Send the JSON-RPC request to Kodi
        const response = await axios.post(kodiUrl, kodiRequest, {
            auth: {
                username: kodiUser,
                password: kodiPassword
            },
            headers: { 'Content-Type': 'application/json' },
        });

        if (response.data.error) {
            console.error(`Kodi API error: ${response.data.error}`);
            return res.status(500).json({ error: 'Kodi API error.' });
        }

        res.json({ message: 'Playback started on Kodi.' });
    } catch (error) {
        console.error(`Error processing play request: ${error.message}`);
        if (error.response) {
            console.error(`Response data: ${JSON.stringify(error.response.data)}`);
        }
        res.status(500).json({ error: 'Failed to process play request.' });
    }
});

// Fetch TV Show Details including Seasons and Episodes
app.get('/api/tv/:id', async (req, res) => {
    const tvId = req.params.id;
    if (!tvId) {
        console.error('TV Show ID is required.');
        return res.status(400).json({ error: 'TV Show ID is required.' });
    }

    const tmdbApiKey = process.env.TMDB_API_KEY;
    if (!tmdbApiKey) {
        console.error('TMDB API key not configured.');
        return res.status(500).json({ error: 'TMDB API key not configured.' });
    }

    const tmdbApiUrl = `https://api.themoviedb.org/3/tv/${tvId}?api_key=${tmdbApiKey}&language=en-US&append_to_response=seasons`;

    try {
        const { data } = await axios.get(tmdbApiUrl);

        // Fetch episodes for each season
        const seasonsWithEpisodes = await Promise.all(
            data.seasons.map(async (season) => {
                const seasonUrl = `https://api.themoviedb.org/3/tv/${tvId}/season/${season.season_number}?api_key=${tmdbApiKey}&language=en-US`;
                try {
                    const seasonData = await axios.get(seasonUrl);
                    return {
                        ...season,
                        episodes: seasonData.data.episodes,
                    };
                } catch (err) {
                    console.error(`Failed to fetch episodes for Season ${season.season_number}:`, err.message);
                    return {
                        ...season,
                        episodes: [],
                    };
                }
            })
        );

        data.seasons = seasonsWithEpisodes;
        res.json(data);
    } catch (error) {
        console.error('Error fetching TV show details:', error.message);
        res.status(500).json({ error: 'Failed to fetch TV show details from TMDB.' });
    }
});


// Handle Real-Debrid OAuth 2.0 callback
app.get('/auth/real-debrid/callback', async (req, res) => {
    const { code, state } = req.query;

    // Debug: Ensure the "code" parameter is present
    if (!code) {
        console.error('Authorization code not provided.');
        return res.status(400).json({ error: 'Authorization code not provided.' });
    }

    try {
        const clientId = process.env.REAL_DEBRID_CLIENT_ID;
        const clientSecret = process.env.REAL_DEBRID_CLIENT_SECRET;
        const redirectUri = 'http://localhost:3000/auth/real-debrid/callback';

        // Debug: Ensure all parameters are present
        if (!clientId || !clientSecret) {
            console.error('Client ID or Client Secret missing.');
            return res.status(500).json({ error: 'Client ID or Client Secret missing.' });
        }


        console.log('Parameters sent to Real-Debrid token endpoint:', {
            client_id: clientId,
            client_secret: clientSecret,
            code: code,
            grant_type: 'authorization_code',
            redirect_uri: redirectUri,
        });

        // Exchange authorization code for access token
        const tokenResponse = await axios.post('https://api.real-debrid.com/oauth/v2/token', null, {
            params: {
                client_id: clientId,
                client_secret: clientSecret,
                code: code,
                grant_type: 'authorization_code',
                redirect_uri: redirectUri,
            },
        });

        const { access_token, refresh_token, expires_in } = tokenResponse.data;

        console.log('Access token received:', access_token);

        res.json({
            message: 'Real-Debrid authorization successful!',
            access_token,
            refresh_token,
            expires_in,
        });
    } catch (error) {
        // Debug: Log detailed error information
        console.error('Error exchanging code for access token:', error.response?.data || error.message);

        // Return error response to the client
        res.status(500).json({ error: 'Failed to exchange code for access token.' });
    }
});


app.get('/scrape', async (req, res) => {
    const { url } = req.query;
    if (!url) {
        return res.status(400).send('Missing URL');
    }

    try {
        console.log(`Scraping URL: ${url}`);
        const response = await axios.get(url);
        const html = response.data;
        const $ = cheerio.load(html);

        // Extract the first magnet link
        const firstMagnetLink = $('a[href^="magnet:?xt=urn:btih:"]').first().attr('href');
        if (!firstMagnetLink) {
            return res.status(404).send({ message: 'No magnet link found' });
        }

        console.log(`First Magnet Link: ${firstMagnetLink}`);
        res.send({ magnetLink: firstMagnetLink });
    } catch (error) {
        console.error('Error scraping:', error.message);
        res.status(500).send({ error: 'Failed to scrape magnet link' });
    }
});


// Serve static files only in production
if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, '../client/build')));

    // Catchall handler to serve React's index.html for unknown routes
    app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, '../client/build', 'index.html'));
    });
}

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});
