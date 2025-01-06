// client/src/services/api.ts

import axios from 'axios';
import { Media } from '../types/Media';
import { TVShowDetails } from '../types/TVShowDetails';

/**
 * Searches for movies based on the provided name.
 * @param name - The name of the movie to search for.
 * @returns A promise that resolves to an array of Media objects.
 */
export const search = async (name: string): Promise<Media[]> => {
    try {
        const response = await axios.get('http://localhost:3000/api/search', {
            params: { name },
        });
        return response.data.movies;
    } catch (error: any) {
        console.error('Error searching movies:', error);
        throw error.response?.data?.error || 'An unexpected error occurred.';
    }
};

/**
 * Initiates playback of a movie via Real-Debrid.
 * @param movieId - The ID of the movie to play.
 * @returns A promise that resolves to the download URL and filename.
 */
export const play = async (
    mediaData: {
        id: number,
        name: string,
        season: number,
        episode: number,
        episodeName: string
        type: string
    }

): Promise<any> => {
    const response = await axios.post('http://localhost:3000/api/play', {
        mediaData
    });
    return response.data;
};

/**
 * Initiates Real-Debrid authentication.
 */
export const seriesDetails = async (tvId: number): Promise<TVShowDetails> => {
    const response = await axios.get(`http://localhost:3000/api/tv/${tvId}`);
    return response.data;
};
/**
 * Resolves a link via Real-Debrid.
 * @param url - The magnet or hoster URL to resolve.
 * @returns A promise that resolves to the download URL and filename.
 */
export const resolveLink = async (url: string): Promise<{ download: string; filename: string }> => {
    try {
        const response = await axios.get('http://localhost:3000/api/resolve-link', {
            params: { url },
            // The access token should be sent automatically if stored appropriately
        });
        return response.data;
    } catch (error: any) {
        console.error('Error resolving link:', error);
        throw error.response?.data?.error || 'Failed to resolve link.';
    }
};
