const fetch = require('node-fetch'); // For HTTP requests
const cheerio = require('cheerio'); // For HTML parsing

// Function to simulate scraping a website for magnet links
async function scrapeTorrentSite(url) {
    try {
        console.log(`Fetching page: ${url}`);
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

        const html = await response.text(); // Get HTML content
        const $ = cheerio.load(html); // Load HTML into Cheerio

        // Extract all magnet links
        const magnetLinks = [];
        $('a[href^="magnet:?xt=urn:btih:"]').each((_, element) => {
            const magnetLink = $(element).attr('href');
            magnetLinks.push(magnetLink);
        });

        console.log(`Found ${magnetLinks.length} magnet links:`);
        console.log(magnetLinks);

        return magnetLinks;
    } catch (error) {
        console.error(`Error scraping site: ${error.message}`);
    }
}

// Function to simulate passing magnet links to Real-Debrid API
async function addToRealDebrid(magnetLink, apiKey) {
    const realDebridUrl = 'https://api.real-debrid.com/rest/1.0/torrents/addMagnet';

    try {
        console.log(`Sending magnet link to Real-Debrid: ${magnetLink}`);
        const response = await fetch(realDebridUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                magnet: magnetLink, // Magnet link to resolve
            }),
        });

        if (!response.ok) throw new Error(`Real-Debrid API error! Status: ${response.status}`);
        const data = await response.json();

        console.log(`Real-Debrid response:`, data);
        return data;
    } catch (error) {
        console.error(`Error sending magnet link to Real-Debrid: ${error.message}`);
    }
}

// Simulate the scraper and Real-Debrid API flow
(async function simulate() {
    const torrentSiteUrl = 'https://bitsearch.to/search?q=Naruto+Shippuden+-+001&sort=size';
    const realDebridApiKey = 'HORO4XSGDXKZQHNBZDWBVBCN2JNLR6OIFMXF225E2NEQXMRFM3VQ';

    // Scrape magnet links
    const magnetLinks = await scrapeTorrentSite(torrentSiteUrl);

    // Pass magnet links to Real-Debrid
    if (magnetLinks && magnetLinks.length > 0) {
        for (const magnetLink of magnetLinks) {
            await addToRealDebrid(magnetLink, realDebridApiKey);
        }
    }
})();
