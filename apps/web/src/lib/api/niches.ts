/**
 * Niches API
 * 
 * API endpoints for content niches.
 */

import { apiClient } from './client';
import {
    GetNichesRequest,
    GetNichesResponse,
    GetNicheResponse,
    PreviewNicheResponse,
} from '@lensio/types';

export const nichesApi = {
    /**
     * Get all available niches
     */
    async list(params?: GetNichesRequest) {
        const searchParams = new URLSearchParams();
        if (params?.limit) searchParams.set('limit', params.limit.toString());
        if (params?.cursor) searchParams.set('cursor', params.cursor);
        if (params?.category) searchParams.set('category', params.category);
        if (params?.platform) searchParams.set('platform', params.platform);
        if (params?.search) searchParams.set('search', params.search);

        const query = searchParams.toString();
        return apiClient.get<GetNichesResponse>(`/niches${query ? `?${query}` : ''}`);
    },

    /**
     * Get niche by ID
     */
    async getById(nicheId: string) {
        return apiClient.get<GetNicheResponse>(`/niches/${nicheId}`);
    },

    /**
     * Preview sample ideas for a niche
     */
    async preview(nicheId: string) {
        return apiClient.get<PreviewNicheResponse>(`/niches/${nicheId}/preview`);
    },
};
