/**
 * Jobs API
 * 
 * API endpoints for video generation jobs.
 */

import { apiClient } from './client';
import {
    CreateJobRequest,
    CreateJobResponse,
    GetJobResponse,
    GetJobStatusResponse,
    GetJobsRequest,
    GetJobsResponse,
    CancelJobResponse,
    RetryJobResponse,
    EstimateJobRequest,
    EstimateJobResponse,
} from '@lensio/types';

export const jobsApi = {
    /**
     * Create a new generation job
     */
    async create(data: CreateJobRequest) {
        return apiClient.post<CreateJobResponse>('/jobs', data as any);
    },

    /**
     * Get job by ID
     */
    async getById(jobId: string) {
        return apiClient.get<GetJobResponse>(`/jobs/${jobId}`);
    },

    /**
     * Get job status (lightweight endpoint for polling)
     */
    async getStatus(jobId: string) {
        return apiClient.get<GetJobStatusResponse>(`/jobs/${jobId}/status`);
    },

    /**
     * List user's jobs with filters
     */
    async list(params?: GetJobsRequest) {
        const searchParams = new URLSearchParams();
        if (params?.limit) searchParams.set('limit', params.limit.toString());
        if (params?.cursor) searchParams.set('cursor', params.cursor);
        if (params?.status) searchParams.set('status', params.status);
        if (params?.nicheId) searchParams.set('nicheId', params.nicheId);
        if (params?.platform) searchParams.set('platform', params.platform);
        if (params?.dateFrom) searchParams.set('dateFrom', params.dateFrom);
        if (params?.dateTo) searchParams.set('dateTo', params.dateTo);

        const query = searchParams.toString();
        return apiClient.get<GetJobsResponse>(`/jobs${query ? `?${query}` : ''}`);
    },

    /**
     * Cancel a queued or processing job
     */
    async cancel(jobId: string) {
        return apiClient.post<CancelJobResponse>(`/jobs/${jobId}/cancel`);
    },

    /**
     * Retry a failed job
     */
    async retry(jobId: string) {
        return apiClient.post<RetryJobResponse>(`/jobs/${jobId}/retry`);
    },

    /**
     * Get cost estimate for a job before creation
     */
    async estimate(data: EstimateJobRequest) {
        return apiClient.post<EstimateJobResponse>('/jobs/estimate', data as any);
    },
};
