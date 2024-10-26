import axios from 'axios';

const API_BASE_URL = 'http://127.0.0.1:5000/api';

export const fetchRssFeeds = () => {
    return axios.get(`${API_BASE_URL}/rss_feeds`);
};

export const fetchYoutubeVideos = () => {
    return axios.get(`${API_BASE_URL}/youtube_videos`);
};

export const fetchGiphyGifs = () => {
    return axios.get(`${API_BASE_URL}/giphy_gifs`);
};
