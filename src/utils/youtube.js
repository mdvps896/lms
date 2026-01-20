/**
 * Extract YouTube video ID from various URL formats
 * Supports:
 * - https://www.youtube.com/watch?v=VIDEO_ID
 * - https://youtu.be/VIDEO_ID
 * - https://www.youtube.com/embed/VIDEO_ID
 * - https://m.youtube.com/watch?v=VIDEO_ID
 */
export function extractYouTubeVideoId(url) {
    if (!url) return null;

    // Remove any whitespace
    url = url.trim();

    // Pattern 1: youtube.com/watch?v=VIDEO_ID
    let match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    if (match) return match[1];

    // Pattern 2: youtube.com/embed/VIDEO_ID
    match = url.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/);
    if (match) return match[1];

    // Pattern 3: Just the video ID
    if (/^[a-zA-Z0-9_-]{11}$/.test(url)) {
        return url;
    }

    return null;
}

/**
 * Convert any YouTube URL to embed URL
 */
export function getYouTubeEmbedUrl(url) {
    const videoId = extractYouTubeVideoId(url);
    if (!videoId) return null;

    return `https://www.youtube.com/embed/${videoId}`;
}

/**
 * Check if URL is a YouTube URL
 */
export function isYouTubeUrl(url) {
    if (!url) return false;
    return /(?:youtube\.com|youtu\.be)/.test(url);
}
