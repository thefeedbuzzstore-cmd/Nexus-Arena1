import axios from 'axios';
import { Game, Deal } from '../types';

// Separate instances for different APIs
const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
});

// FreeToGame API proxy via Vercel serverless function
const gameApi = axios.create({
  baseURL: '/api/games',
  timeout: 15000,
  headers: {
    'Accept': 'application/json',
  }
});

// Add error interceptor for better debugging
api.interceptors.response.use(
  response => response,
  error => {
    const message = error.response?.data?.error || error.message || 'API request failed';
    console.error('[API Error]', error.config?.url, message);
    return Promise.reject(error);
  }
);

gameApi.interceptors.response.use(
  response => response,
  error => {
    const message = error.response?.data?.error || error.message || 'FreeToGame API request failed';
    console.error('[FreeToGame Error]', error.config?.url, message);
    return Promise.reject(error);
  }
);

export const gameService = {
  getGames: async (params?: any) => {
    try {
      console.log('[GameService] Fetching games from FreeToGame API');
      // Fetch via Vercel API proxy
      const res = await gameApi.get<Game[]>('', { params: { path: 'games', ...params } });
      console.log('[GameService] Successfully fetched', res.data?.length || 0, 'games');
      return res.data || [];
    } catch (error) {
      console.error('[GameService] Failed to fetch games:', error);
      return [];
    }
  },
  
  getGameDetails: async (id: string | number) => {
    try {
      console.log('[GameService] Fetching game details for id:', id);
      // Fetch via Vercel API proxy
      const res = await gameApi.get<Game>('', { params: { path: 'game', id } });
      console.log('[GameService] Successfully fetched game details');
      return res.data;
    } catch (error) {
      console.error('[GameService] Failed to fetch game details:', error);
      throw error;
    }
  },
  
  getDeals: async (params?: any) => {
    try {
      console.log('[GameService] Fetching deals');
      // Fetch via Vercel API proxy
      const res = await gameApi.get<Deal[]>('', { params: { path: 'filter', ...params } });
      console.log('[GameService] Successfully fetched', res.data?.length || 0, 'deals');
      return res.data || [];
    } catch (error) {
      console.error('[GameService] Failed to fetch deals:', error);
      return [];
    }
  },
  
  summarizeGame: async (gameTitle: string, description: string) => {
    try {
      const res = await api.post<{ summary: string }>('/ai/summarize', { gameTitle, description });
      return res.data;
    } catch (error) {
      console.error('[GameService] AI summarization failed:', error);
      return { summary: description || 'Game description unavailable' };
    }
  },
  
  recommendGames: async (favoriteGames: string[], allGames: string[]) => {
    try {
      const res = await api.post<{ recommendation: string }>('/ai/recommend', { favoriteGames, allGames });
      return res.data;
    } catch (error) {
      console.error('[GameService] AI recommendation failed:', error);
      return { recommendation: 'Unable to generate recommendations at this time. Try again later.' };
    }
  },
  
  trackClick: async (gameId: string, platform: string, userId?: string) => {
    try {
      const res = await api.post('/analytics/click', { gameId, platform, userId });
      return res.data;
    } catch (error) {
      console.error('[GameService] Click tracking failed:', error);
      // Don't throw - analytics failures shouldn't break UX
    }
  },
  
  trackView: async (gameId: string) => {
    try {
      const res = await api.post('/analytics/view', { gameId });
      return res.data;
    } catch (error) {
      console.error('[GameService] View tracking failed:', error);
      // Don't throw - analytics failures shouldn't break UX
    }
  },
};
