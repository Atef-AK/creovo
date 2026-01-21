/**
 * Supported platforms
 */
export enum Platform {
    TIKTOK = 'tiktok',
    YOUTUBE_SHORTS = 'youtube_shorts',
    INSTAGRAM_REELS = 'instagram_reels',
    INSTAGRAM_STORIES = 'instagram_stories',
}

/**
 * Platform specifications
 */
export interface PlatformSpec {
    platform: Platform;
    name: string;

    // Video specifications
    aspectRatio: '9:16' | '16:9' | '1:1';
    resolution: {
        width: number;
        height: number;
    };

    // Duration limits
    duration: {
        min: number;
        max: number;
        optimal: number;
    };

    // Frame rate
    fps: number;

    // Encoding
    codec: 'h264' | 'h265';
    bitrate: string;

    // Audio
    audio: {
        codec: 'aac';
        bitrate: string;
        sampleRate: number;
    };

    // Text safe zones (pixels from edge)
    safeZone: {
        top: number;
        bottom: number;
        left: number;
        right: number;
    };

    // Caption/hashtag limits
    maxCaptionLength: number;
    maxHashtags: number;
    hashtagStyle: 'in_caption' | 'in_comments' | 'hidden';
}

/**
 * Default platform specifications
 */
export const PLATFORM_SPECS: Record<Platform, PlatformSpec> = {
    [Platform.TIKTOK]: {
        platform: Platform.TIKTOK,
        name: 'TikTok',
        aspectRatio: '9:16',
        resolution: { width: 1080, height: 1920 },
        duration: { min: 15, max: 180, optimal: 30 },
        fps: 30,
        codec: 'h264',
        bitrate: '8M',
        audio: { codec: 'aac', bitrate: '128k', sampleRate: 44100 },
        safeZone: { top: 150, bottom: 200, left: 40, right: 40 },
        maxCaptionLength: 2200,
        maxHashtags: 5,
        hashtagStyle: 'in_caption',
    },
    [Platform.YOUTUBE_SHORTS]: {
        platform: Platform.YOUTUBE_SHORTS,
        name: 'YouTube Shorts',
        aspectRatio: '9:16',
        resolution: { width: 1080, height: 1920 },
        duration: { min: 15, max: 60, optimal: 45 },
        fps: 30,
        codec: 'h264',
        bitrate: '10M',
        audio: { codec: 'aac', bitrate: '192k', sampleRate: 48000 },
        safeZone: { top: 120, bottom: 180, left: 40, right: 40 },
        maxCaptionLength: 100,
        maxHashtags: 3,
        hashtagStyle: 'in_caption',
    },
    [Platform.INSTAGRAM_REELS]: {
        platform: Platform.INSTAGRAM_REELS,
        name: 'Instagram Reels',
        aspectRatio: '9:16',
        resolution: { width: 1080, height: 1920 },
        duration: { min: 15, max: 90, optimal: 30 },
        fps: 30,
        codec: 'h264',
        bitrate: '8M',
        audio: { codec: 'aac', bitrate: '128k', sampleRate: 44100 },
        safeZone: { top: 180, bottom: 200, left: 40, right: 40 },
        maxCaptionLength: 2200,
        maxHashtags: 10,
        hashtagStyle: 'in_caption',
    },
    [Platform.INSTAGRAM_STORIES]: {
        platform: Platform.INSTAGRAM_STORIES,
        name: 'Instagram Stories',
        aspectRatio: '9:16',
        resolution: { width: 1080, height: 1920 },
        duration: { min: 1, max: 15, optimal: 15 },
        fps: 30,
        codec: 'h264',
        bitrate: '6M',
        audio: { codec: 'aac', bitrate: '128k', sampleRate: 44100 },
        safeZone: { top: 250, bottom: 150, left: 40, right: 40 },
        maxCaptionLength: 0,
        maxHashtags: 3,
        hashtagStyle: 'hidden',
    },
};

/**
 * Get platform spec by key
 */
export function getPlatformSpec(platform: Platform): PlatformSpec {
    return PLATFORM_SPECS[platform];
}

/**
 * Validate video against platform spec
 */
export interface PlatformValidationResult {
    valid: boolean;
    errors: string[];
    warnings: string[];
}
