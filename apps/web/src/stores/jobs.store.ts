/**
 * Jobs Store using Zustand
 * 
 * Manages video generation job state with real-time updates.
 */

import { create } from 'zustand';
import { Job, JobStatus } from '@lensio/types';

interface JobFilters {
    status?: JobStatus;
    platform?: string;
    nicheId?: string;
    dateFrom?: string;
    dateTo?: string;
}

interface JobsState {
    // State
    jobs: Job[];
    currentJob: Job | null;
    isLoading: boolean;
    error: string | null;
    filters: JobFilters;

    // Pagination
    hasMore: boolean;
    cursor: string | null;

    // Actions
    setJobs: (jobs: Job[]) => void;
    addJob: (job: Job) => void;
    updateJob: (jobId: string, updates: Partial<Job>) => void;
    removeJob: (jobId: string) => void;
    setCurrentJob: (job: Job | null) => void;
    setLoading: (loading: boolean) => void;
    setError: (error: string | null) => void;
    setFilters: (filters: JobFilters) => void;
    setPagination: (hasMore: boolean, cursor: string | null) => void;
    reset: () => void;

    // Computed
    getActiveJobs: () => Job[];
    getCompletedJobs: () => Job[];
    getFailedJobs: () => Job[];
    getJobById: (id: string) => Job | undefined;
}

const initialState = {
    jobs: [],
    currentJob: null,
    isLoading: false,
    error: null,
    filters: {},
    hasMore: false,
    cursor: null,
};

export const useJobsStore = create<JobsState>()((set, get) => ({
    ...initialState,

    setJobs: (jobs) => set({ jobs }),

    addJob: (job) => set((state) => ({
        jobs: [job, ...state.jobs]
    })),

    updateJob: (jobId, updates) => set((state) => ({
        jobs: state.jobs.map((job) =>
            job.id === jobId ? { ...job, ...updates } : job
        ),
        currentJob: state.currentJob?.id === jobId
            ? { ...state.currentJob, ...updates }
            : state.currentJob,
    })),

    removeJob: (jobId) => set((state) => ({
        jobs: state.jobs.filter((job) => job.id !== jobId),
        currentJob: state.currentJob?.id === jobId ? null : state.currentJob,
    })),

    setCurrentJob: (currentJob) => set({ currentJob }),

    setLoading: (isLoading) => set({ isLoading }),

    setError: (error) => set({ error }),

    setFilters: (filters) => set({ filters }),

    setPagination: (hasMore, cursor) => set({ hasMore, cursor }),

    reset: () => set(initialState),

    // Computed
    getActiveJobs: () => {
        const activeStatuses = [
            JobStatus.PENDING,
            JobStatus.QUEUED,
            JobStatus.PROCESSING,
            JobStatus.IDEA_GENERATION,
            JobStatus.SCRIPT_GENERATION,
            JobStatus.SCENE_BREAKDOWN,
            JobStatus.IMAGE_GENERATION,
            JobStatus.VIDEO_GENERATION,
            JobStatus.AUDIO_SELECTION,
            JobStatus.TEXT_OVERLAY,
            JobStatus.VIDEO_ASSEMBLY,
            JobStatus.PLATFORM_FORMATTING,
            JobStatus.EXPORTING,
        ];
        return get().jobs.filter((job) => activeStatuses.includes(job.status));
    },

    getCompletedJobs: () =>
        get().jobs.filter((job) => job.status === JobStatus.COMPLETED),

    getFailedJobs: () =>
        get().jobs.filter((job) =>
            job.status === JobStatus.FAILED || job.status === JobStatus.PARTIAL
        ),

    getJobById: (id) =>
        get().jobs.find((job) => job.id === id),
}));
