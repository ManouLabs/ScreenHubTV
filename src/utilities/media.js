// Reusable media helper utilities

export const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'];
export const videoExtensions = ['mp4', 'avi', 'mov', 'wmv', 'flv', 'mkv', 'webm'];

export function getExtension(path) {
    if (!path) return '';
    try {
        const base = typeof window !== 'undefined' && window.location?.origin ? window.location.origin : 'http://localhost';
        const url = new URL(path, base);
        const clean = url.pathname.split('?')[0];
        return clean.split('.').pop()?.toLowerCase() || '';
    } catch {
        const clean = String(path).split('?')[0];
        return clean.split('.').pop()?.toLowerCase() || '';
    }
}

export function getMediaUrl(media) {
    if (!media) return '';
    if (typeof media === 'string') return media;
    if (typeof media === 'object' && media.url) return media.url;
    return '';
}

export function getMediaName(media) {
    if (!media) return '';
    if (typeof media === 'string') return media.split('/').pop() || '';
    if (typeof media === 'object' && media.original_name) return media.original_name;
    return '';
}

export function getMediaMime(media) {
    if (!media) return '';
    if (typeof media === 'object' && media.mime_type) return media.mime_type;
    return '';
}

export function isImageMedia(media) {
    const mime = getMediaMime(media);
    if (mime) return mime.startsWith('image/');
    const url = getMediaUrl(media);
    return imageExtensions.includes(getExtension(url));
}

export function isVideoMedia(media) {
    const mime = getMediaMime(media);
    if (mime) return mime.startsWith('video/');
    const url = getMediaUrl(media);
    return videoExtensions.includes(getExtension(url));
}

// Return a friendly type label for a MIME string.
export function getMimeTypeName(mime) {
    if (!mime || typeof mime !== 'string') return '';
    const typeMap = {
        'image/jpeg': 'JPEG Image',
        'image/jpg': 'JPG Image',
        'image/png': 'PNG Image',
        'image/bmp': 'BMP Image',
        'image/gif': 'GIF Image',
        'image/webp': 'WebP Image',
        'video/mp4': 'MP4 Video',
        'video/avi': 'AVI Video',
        'video/mov': 'MOV Video',
        'video/wmv': 'WMV Video',
        'video/flv': 'FLV Video',
        'video/mkv': 'MKV Video',
        'video/webm': 'WebM Video'
    };
    return typeMap[mime] || (mime.includes('/') ? mime.split('/')[1].toUpperCase() : mime);
}

// Format bytes to a human-friendly string
export function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    if (!bytes || isNaN(bytes)) return '';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
