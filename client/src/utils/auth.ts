export const getAccessToken = (): string | null => {
    return localStorage.getItem('real_debrid_access_token');
};

export const getRefreshToken = (): string | null => {
    return localStorage.getItem('real_debrid_refresh_token');
};
