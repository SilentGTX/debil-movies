export interface Movie {
    backdrop_path: string | null;
    id: number;
    title: string;
    original_title: string;
    overview: string;
    poster_path: string | null;
    media_type: 'movie';
    adult: boolean;
    original_language: string;
    genre_ids: number[];
    popularity: number;
    release_date: string;
    video?: boolean;
    vote_average: number;
    vote_count: number;
    first_air_date: number;
    name: string;
    torrentUrl: string;

}

export interface TVShow {
    backdrop_path: string | null;
    id: number;
    name: string;
    original_name: string;
    overview: string;
    poster_path: string | null;
    media_type: 'tv';
    adult: boolean;
    original_language: string;
    genre_ids: number[];
    popularity: number;
    first_air_date: string;
    vote_average: number;
    vote_count: number;
    title: string;
    release_date: string;
    torrentUrl: string;
}



export type Media = Movie | TVShow;
