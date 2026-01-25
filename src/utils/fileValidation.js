/**
 * File Validation Utility
 * Validates file uploads against system settings stored in system_settings table
 * 
 * Usage:
 * import { validateFile, validateImage, validateVideo, getFileTypeSettings } from '@/utils/fileValidation';
 * 
 * const validation = await validateFile(file);
 * if (!validation.valid) {
 *   toast({ variant: 'destructive', title: validation.error });
 *   return;
 * }
 */

import { supabase } from '@/lib/customSupabaseClient';

// Cache for settings to avoid repeated DB calls
let settingsCache = {
  file: null,
  image: null,
  video: null,
  lastFetch: 0
};

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes cache

// Default settings (fallback if no settings in DB)
const DEFAULT_SETTINGS = {
  file: {
    allowed_extensions: 'pdf, zip, doc, docx, xls, xlsx, ppt, pptx, txt, csv, odt, ods, odp, rtf, 7z, rar, tar, gz, mp3, wav, ogg, flac, apk, accdb, mdb, html, xml, json',
    allowed_mime_types: 'application/pdf, application/zip, application/x-zip-compressed, application/msword, application/vnd.openxmlformats-officedocument.wordprocessingml.document, application/vnd.ms-excel, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-powerpoint, application/vnd.openxmlformats-officedocument.presentationml.presentation, text/plain, text/csv, application/vnd.oasis.opendocument.text, application/vnd.oasis.opendocument.spreadsheet, application/vnd.oasis.opendocument.presentation, application/rtf, application/x-7z-compressed, application/x-rar-compressed, application/x-tar, application/gzip, audio/mpeg, audio/wav, audio/ogg, audio/flac, application/vnd.android.package-archive, application/msaccess, text/html, application/xml, application/json',
    upload_size_bytes: 104857600 // 100 MB
  },
  image: {
    allowed_extensions: 'jpg, jpeg, png, gif, bmp, svg, webp, ico, jfif, jpe, tiff, tif',
    allowed_mime_types: 'image/jpeg, image/png, image/gif, image/bmp, image/svg+xml, image/webp, image/x-icon, image/tiff',
    upload_size_bytes: 10485760 // 10 MB
  },
  video: {
    allowed_extensions: 'mp4, webm, ogg, avi, mov, wmv, flv, mkv, 3gp, m4v',
    allowed_mime_types: 'video/mp4, video/webm, video/ogg, video/x-msvideo, video/quicktime, video/x-ms-wmv, video/x-flv, video/x-matroska, video/3gpp, video/x-m4v',
    upload_size_bytes: 524288000 // 500 MB
  }
};

/**
 * Fetch file type settings from database
 */
export const getFileTypeSettings = async (forceRefresh = false) => {
  const now = Date.now();
  
  // Return cached if valid
  if (!forceRefresh && settingsCache.file && (now - settingsCache.lastFetch < CACHE_TTL)) {
    return {
      file: settingsCache.file,
      image: settingsCache.image,
      video: settingsCache.video
    };
  }

  try {
    const { data, error } = await supabase
      .from('system_settings')
      .select('key, value')
      .in('key', ['file_type_settings', 'image_type_settings', 'video_type_settings']);

    if (error) throw error;

    // Parse settings
    const settings = { ...DEFAULT_SETTINGS };
    
    if (data) {
      data.forEach(row => {
        const parsed = typeof row.value === 'string' ? JSON.parse(row.value) : row.value;
        if (row.key === 'file_type_settings') settings.file = { ...DEFAULT_SETTINGS.file, ...parsed };
        if (row.key === 'image_type_settings') settings.image = { ...DEFAULT_SETTINGS.image, ...parsed };
        if (row.key === 'video_type_settings') settings.video = { ...DEFAULT_SETTINGS.video, ...parsed };
      });
    }

    // Update cache
    settingsCache = {
      file: settings.file,
      image: settings.image,
      video: settings.video,
      lastFetch: now
    };

    return settings;
  } catch (error) {
    console.error('Error fetching file type settings:', error);
    return DEFAULT_SETTINGS;
  }
};

/**
 * Parse extension string to array
 */
const parseExtensions = (extString) => {
  return extString
    .split(',')
    .map(ext => ext.trim().toLowerCase())
    .filter(ext => ext.length > 0);
};

/**
 * Parse MIME type string to array
 */
const parseMimeTypes = (mimeString) => {
  return mimeString
    .split(',')
    .map(mime => mime.trim().toLowerCase())
    .filter(mime => mime.length > 0);
};

/**
 * Get file extension from filename
 */
const getFileExtension = (filename) => {
  const parts = filename.split('.');
  return parts.length > 1 ? parts.pop().toLowerCase() : '';
};

/**
 * Format bytes to human readable
 */
export const formatBytes = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Validate a file (documents, audio, archives, etc.)
 */
export const validateFile = async (file) => {
  const settings = await getFileTypeSettings();
  return validateAgainstSettings(file, settings.file, 'file');
};

/**
 * Validate an image file
 */
export const validateImage = async (file) => {
  const settings = await getFileTypeSettings();
  return validateAgainstSettings(file, settings.image, 'image');
};

/**
 * Validate a video file
 */
export const validateVideo = async (file) => {
  const settings = await getFileTypeSettings();
  return validateAgainstSettings(file, settings.video, 'video');
};

/**
 * Auto-detect file type and validate accordingly
 */
export const validateAnyFile = async (file) => {
  const mimeType = file.type?.toLowerCase() || '';
  
  if (mimeType.startsWith('image/')) {
    return validateImage(file);
  } else if (mimeType.startsWith('video/')) {
    return validateVideo(file);
  } else {
    return validateFile(file);
  }
};

/**
 * Core validation logic
 */
const validateAgainstSettings = (file, settings, type) => {
  const errors = [];
  
  // Get extension and mime type
  const extension = getFileExtension(file.name);
  const mimeType = file.type?.toLowerCase() || '';
  const fileSize = file.size;

  // Parse allowed lists
  const allowedExtensions = parseExtensions(settings.allowed_extensions);
  const allowedMimeTypes = parseMimeTypes(settings.allowed_mime_types);
  const maxSize = settings.upload_size_bytes;

  // Check extension
  if (allowedExtensions.length > 0 && !allowedExtensions.includes(extension)) {
    errors.push(`File extension ".${extension}" is not allowed. Allowed: ${allowedExtensions.slice(0, 10).join(', ')}${allowedExtensions.length > 10 ? '...' : ''}`);
  }

  // Check MIME type (only if we have the mime type)
  if (mimeType && allowedMimeTypes.length > 0 && !allowedMimeTypes.includes(mimeType)) {
    // Check if any allowed MIME type starts with the same prefix
    const mimePrefix = mimeType.split('/')[0];
    const hasMatchingPrefix = allowedMimeTypes.some(allowed => allowed.startsWith(mimePrefix + '/'));
    
    if (!hasMatchingPrefix) {
      errors.push(`File type "${mimeType}" is not allowed for ${type} uploads.`);
    }
  }

  // Check file size
  if (fileSize > maxSize) {
    errors.push(`File size (${formatBytes(fileSize)}) exceeds maximum allowed size (${formatBytes(maxSize)})`);
  }

  return {
    valid: errors.length === 0,
    errors,
    error: errors[0] || null,
    file: {
      name: file.name,
      extension,
      mimeType,
      size: fileSize,
      sizeFormatted: formatBytes(fileSize)
    },
    limits: {
      maxSize,
      maxSizeFormatted: formatBytes(maxSize),
      allowedExtensions,
      allowedMimeTypes
    }
  };
};

/**
 * Get accept string for file input based on settings
 */
export const getAcceptString = async (type = 'all') => {
  const settings = await getFileTypeSettings();
  
  if (type === 'image') {
    const exts = parseExtensions(settings.image.allowed_extensions);
    const mimes = parseMimeTypes(settings.image.allowed_mime_types);
    return [...mimes, ...exts.map(e => `.${e}`)].join(',');
  }
  
  if (type === 'video') {
    const exts = parseExtensions(settings.video.allowed_extensions);
    const mimes = parseMimeTypes(settings.video.allowed_mime_types);
    return [...mimes, ...exts.map(e => `.${e}`)].join(',');
  }
  
  if (type === 'file') {
    const exts = parseExtensions(settings.file.allowed_extensions);
    const mimes = parseMimeTypes(settings.file.allowed_mime_types);
    return [...mimes, ...exts.map(e => `.${e}`)].join(',');
  }
  
  // All types
  const allExts = [
    ...parseExtensions(settings.file.allowed_extensions),
    ...parseExtensions(settings.image.allowed_extensions),
    ...parseExtensions(settings.video.allowed_extensions)
  ];
  const allMimes = [
    ...parseMimeTypes(settings.file.allowed_mime_types),
    ...parseMimeTypes(settings.image.allowed_mime_types),
    ...parseMimeTypes(settings.video.allowed_mime_types)
  ];
  
  return [...new Set([...allMimes, ...allExts.map(e => `.${e}`)])].join(',');
};

/**
 * Clear settings cache (call after updating settings)
 */
export const clearFileSettingsCache = () => {
  settingsCache = {
    file: null,
    image: null,
    video: null,
    lastFetch: 0
  };
};

export default {
  validateFile,
  validateImage,
  validateVideo,
  validateAnyFile,
  getFileTypeSettings,
  getAcceptString,
  formatBytes,
  clearFileSettingsCache
};
