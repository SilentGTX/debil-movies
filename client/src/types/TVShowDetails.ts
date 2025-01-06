// src/types/TVShowDetails.ts

export interface Episode {
    id: number;
    name: string;
    episode_number: number;
    air_date: string;
    overview: string;
    // Add other fields as needed
}

export interface Season {
    id: number;
    name: string;
    season_number: number;
    episode_count: number;
    episodes?: Episode[];
    // Add other fields as needed
}

export interface TVShowDetails {
    id: number;
    name: string;
    overview: string;
    first_air_date: string;
    poster_path: string | null;
    seasons: Season[];
    // Add other fields as needed
}
