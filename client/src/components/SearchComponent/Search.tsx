// src/components/Search/Search.tsx

import React, { useState, useCallback, memo, useEffect } from 'react';
import { search, play, seriesDetails } from '../../services/api';
import { Media, Movie, TVShow } from '../../types/Media';
import { TVShowDetails } from '../../types/TVShowDetails';
import './Search.css';
import { IconButton } from '@mui/material';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import KeyboardArrowLeftIcon from '@mui/icons-material/KeyboardArrowLeft';

// Constants
const ITEMS_PER_PAGE = 3; // Show 3 items per row

// Memoized Carousel Component
const Carousel = memo(
    ({
        title,
        items,
        page,
        setPage,
        totalPages,
        onItemClick,
    }: {
        title: string;
        items: (Movie | TVShow)[];
        page: number;
        setPage: React.Dispatch<React.SetStateAction<number>>;
        totalPages: number;
        onItemClick: (item: Media) => void;
        itemType: 'movie' | 'tv';
    }) => {
        return (
            <div className="media-section">
                <h2 className="section-title">{title}</h2>
                <div className="carousel">
                    <IconButton
                        className="prev-arrow"
                        onClick={() => setPage((prev) => Math.max(prev - 1, 0))}
                        disabled={page === 0}
                        aria-label="previous"
                        sx={{
                            '&:hover': {
                                backgroundColor: 'rgb(233, 0, 0)',
                            },
                        }}
                    >
                        <KeyboardArrowLeftIcon sx={{ color: 'white' }} />
                    </IconButton>
                    <div className="carousel-wrapper">
                        <div
                            className="carousel-items"
                            style={{
                                transform: `translateX(-${page * 100}%)`,
                                transition: 'transform 0.5s ease-in-out',
                            }}
                        >
                            {items.map((item) => (
                                <div
                                    key={item.id}
                                    className="media-item"
                                    onClick={() => onItemClick(item)}
                                >
                                    <img
                                        src={
                                            item.poster_path
                                                ? `https://image.tmdb.org/t/p/w200${item.poster_path}`
                                                : 'https://via.placeholder.com/200x300?text=No+Image'
                                        }
                                        alt={item.title || item.name}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                    <IconButton
                        className="next-arrow"
                        onClick={() =>
                            setPage((prev) => Math.min(prev + 1, totalPages - 1))
                        }
                        disabled={page >= totalPages - 1}
                        aria-label="next"
                        sx={{
                            '&:hover': {
                                backgroundColor: 'rgb(233, 0, 0)',
                            },
                        }}
                    >
                        <KeyboardArrowRightIcon sx={{ color: 'white' }} />
                    </IconButton>
                </div>
                <div className="pagination-indicators">
                    {Array.from({ length: totalPages }).map((_, index) => (
                        <span
                            key={index}
                            className={`indicator ${page === index ? 'active' : ''}`}
                            onClick={() => setPage(index)}
                        ></span>
                    ))}
                </div>
            </div>
        );
    }
);

const Search: React.FC = () => {
    const [mediaName, setMediaName] = useState('');
    const [movies, setMovies] = useState<Movie[]>([]);
    const [tvShows, setTvShows] = useState<TVShow[]>([]);
    const [moviePage, setMoviePage] = useState(0);
    const [tvPage, setTvPage] = useState(0);
    const [loading, setLoading] = useState(false);
    const [loadingDetails, setLoadingDetails] = useState(false); // New state for loading details
    const [error, setError] = useState<string | null>(null);
    const [selectedMedia, setSelectedMedia] = useState<Media | null>(null);
    const [tvShowDetails, setTVShowDetails] = useState<TVShowDetails | null>(null); // New state for TV show details
    const [playingMediaId, setPlayingMediaId] = useState<number | null>(null);
    const [selectedSeason, setSelectedSeason] = useState<number | null>(null);
    const [selectedEpisode, setSelectedEpisode] = useState<number | null>(null); // Define selectedEpisode


    // Handle Search Submission
    const handleSearch = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        if (!mediaName.trim()) return;

        setLoading(true);
        setError(null);
        try {
            const results: Media[] = await search(mediaName);
            const filteredMovies = results.filter(
                (item) => item.media_type === 'movie'
            ) as Movie[];
            const filteredTVShows = results.filter(
                (item) => item.media_type === 'tv'
            ) as TVShow[];

            setMovies(filteredMovies);
            setTvShows(filteredTVShows);

            if (results.length === 0) {
                setError('No results found.');
            } else {
                // Reset pages to first page on new search
                setMoviePage(0);
                setTvPage(0);
            }
        } catch (err) {
            setError(
                typeof err === 'string'
                    ? err
                    : 'An unexpected error occurred.'
            );
        } finally {
            setLoading(false);
        }
    }, [mediaName]);

    // Handle Play Action
    const handlePlay = useCallback(async (mediaData: {
        name: string,
        id: number,
        season: number,
        episode: number,
        episodeName: string,
        type: string
    }) => {
        if (playingMediaId !== null) return;

        setPlayingMediaId(mediaData.id);
        setError(null);

        try {
            await play(mediaData);
            alert('Select torrent on Kodi');
        } catch (err) {
            setError(
                typeof err === 'string'
                    ? err
                    : 'An unexpected error occurred.'
            );
        } finally {
            setPlayingMediaId(null);
        }
    }, [playingMediaId]);


    // Open Modal with Selected Media
    const openModal = useCallback((media: Media) => {
        setSelectedMedia(media);
    }, []);

    // Close Modal
    const closeModal = useCallback(() => {
        setSelectedMedia(null);
        setTVShowDetails(null); // Clear TV show details when closing modal
    }, []);

    // Fetch TV Show Details when a TV show is selected
    useEffect(() => {
        const fetchDetails = async () => {
            if (selectedMedia && selectedMedia.media_type === 'tv') {
                setLoadingDetails(true);
                try {
                    const details = await seriesDetails(selectedMedia.id);
                    setTVShowDetails(details);
                } catch (err) {
                    setError('Failed to fetch TV show details.');
                } finally {
                    setLoadingDetails(false);
                }
            }
        };

        fetchDetails();
    }, [selectedMedia]);

    const totalMoviePages = Math.ceil(movies.length / ITEMS_PER_PAGE);
    const totalTVPages = Math.ceil(tvShows.length / ITEMS_PER_PAGE);

    const [expandedSeason, setExpandedSeason] = useState<number | null>(null); // Track expanded season

    const toggleSeason = (seasonNumber: number) => {
        setExpandedSeason(expandedSeason === seasonNumber ? null : seasonNumber);
    };

    return (
        <div className="search-container">
            <form onSubmit={handleSearch} className="search-form">
                <input
                    type="text"
                    value={mediaName}
                    onChange={(e) => setMediaName(e.target.value)}
                    placeholder="Enter movie or TV show name"
                    required
                />
                <button type="submit" disabled={loading}>
                    {loading ? 'Searching...' : 'Search'}
                </button>
            </form>

            {error && <p className="error-message">{error}</p>}

            {/* Movies Section */}
            {movies.length > 0 && (
                <Carousel
                    title="Movies"
                    items={movies}
                    page={moviePage}
                    setPage={setMoviePage}
                    totalPages={totalMoviePages}
                    onItemClick={openModal}
                    itemType="movie"
                />
            )}

            {/* TV Shows Section */}
            {tvShows.length > 0 && (
                <Carousel
                    title="TV Shows"
                    items={tvShows}
                    page={tvPage}
                    setPage={setTvPage}
                    totalPages={totalTVPages}
                    onItemClick={openModal}
                    itemType="tv"
                />
            )}

            {/* Loading Indicators within Sections */}
            {loading && (
                <div className="loading-overlay">
                    <div className="spinner"></div>
                </div>
            )}

            {/* Modal for Selected Media */}
            {selectedMedia && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div className="modal-view" onClick={(e) => e.stopPropagation()}>
                        <button className="modal-close" onClick={closeModal}>
                            &times;
                        </button>
                        <div
                            className="modal-header"
                            style={{
                                backgroundImage: `url(https://image.tmdb.org/t/p/original${selectedMedia.backdrop_path || selectedMedia.poster_path})`,
                                backgroundSize: 'cover',
                                backgroundPosition: 'center',
                            }}
                        >
                            <div className="modal-header-overlay">
                                <h1 className="modal-title">{selectedMedia.title || selectedMedia.name}</h1>
                                <div className="modal-tags">
                                    {selectedMedia.release_date || selectedMedia.first_air_date ? (
                                        <span>{(selectedMedia.release_date || selectedMedia.first_air_date).split('-')[0]}</span>
                                    ) : null}
                                    <span>{selectedMedia.media_type === 'tv' ? 'Season' : 'Movie'}</span>
                                </div>
                            </div>
                        </div>
                        <div className="modal-body">
                            <p className="modal-overview">
                                {selectedMedia.overview || 'No description available.'}
                            </p>

                            {/* Season Selector */}
                            {selectedMedia.media_type === 'tv' && tvShowDetails && (
                                <div className="season-selector">
                                    <div className="season-tabs">
                                        {tvShowDetails.seasons.map((season) => (
                                            <button
                                                key={season.id}
                                                className={`season-tab ${selectedSeason === season.season_number ? 'active' : ''}`}
                                                onClick={() => setSelectedSeason(season.season_number)}
                                            >
                                                Season {season.season_number}
                                            </button>
                                        ))}
                                    </div>

                                    {/* Episodes List */}
                                    {selectedSeason !== null && (
                                        <div className="episodes-list">
                                            <h4>Episodes</h4>
                                            <div className="episode-grid">
                                                {tvShowDetails.seasons
                                                    .find((season) => season.season_number === selectedSeason)
                                                    ?.episodes?.map((episode) => (
                                                        <div
                                                            key={episode.id}
                                                            onClick={() => {
                                                                setSelectedEpisode(episode.episode_number); // Set selected episode
                                                                handlePlay({
                                                                    id: selectedMedia.id,
                                                                    name: selectedMedia.name,
                                                                    season: selectedSeason,
                                                                    episode: episode.episode_number,
                                                                    episodeName: episode.name,
                                                                    type: 'tv',
                                                                });
                                                            }}
                                                            className={`episode-item ${playingMediaId === selectedMedia.id &&
                                                                selectedSeason === episode.season &&
                                                                selectedEpisode === episode.episode_number
                                                                ? 'active'
                                                                : ''
                                                                }`}
                                                        >
                                                            <span className="episode-number">
                                                                Eps {episode.episode_number}:
                                                            </span>
                                                            <span className="episode-title">{episode.name}</span>
                                                        </div>
                                                    ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                            {selectedMedia.media_type === 'movie' && (
                                <button className="modal-action-button" onClick={() => handlePlay({
                                    id: selectedMedia.id,
                                    name: selectedMedia.title || selectedMedia.name, // Ensure correct title is sent
                                    season: 0,
                                    episode: 0,
                                    episodeName: '',
                                    type: 'movie',
                                })}>
                                    Get Started
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Search;
