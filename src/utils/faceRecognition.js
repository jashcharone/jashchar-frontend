/**
 * Face Recognition Utility using face-api.js
 * Real AI-powered face detection and recognition
 */

import * as faceapi from 'face-api.js';

// Model loading state
let modelsLoaded = false;
let loadingPromise = null;

// CDN URL for face-api models (faster than local)
const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model';

/**
 * Load all required face-api.js models
 * Models: TinyFaceDetector, FaceLandmark68, FaceRecognition
 */
export const loadFaceModels = async (onProgress) => {
    if (modelsLoaded) {
        console.log('[FaceAI] Models already loaded');
        return true;
    }

    if (loadingPromise) {
        return loadingPromise;
    }

    loadingPromise = (async () => {
        try {
            console.log('[FaceAI] Loading face recognition models...');
            onProgress?.('Loading face detection model...');

            // Load TinyFaceDetector - fast and lightweight
            await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
            console.log('[FaceAI] ✅ TinyFaceDetector loaded');
            onProgress?.('Loading face landmark model...');

            // Load FaceLandmark68 - for facial features
            await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
            console.log('[FaceAI] ✅ FaceLandmark68 loaded');
            onProgress?.('Loading face recognition model...');

            // Load FaceRecognitionNet - for face embeddings
            await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);
            console.log('[FaceAI] ✅ FaceRecognition loaded');
            onProgress?.('Loading face expression model...');

            // Optional: Load expression model
            await faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL);
            console.log('[FaceAI] ✅ FaceExpression loaded');

            modelsLoaded = true;
            onProgress?.('All models loaded!');
            console.log('[FaceAI] ✅ All models loaded successfully');
            return true;
        } catch (error) {
            console.error('[FaceAI] ❌ Error loading models:', error);
            loadingPromise = null;
            throw error;
        }
    })();

    return loadingPromise;
};

/**
 * Check if models are loaded
 */
export const areModelsLoaded = () => modelsLoaded;

/**
 * Detect faces in an image/video element
 * @param {HTMLImageElement|HTMLVideoElement|HTMLCanvasElement} input
 * @returns {Promise<Array>} Array of face detections with descriptors
 */
export const detectFaces = async (input) => {
    if (!modelsLoaded) {
        throw new Error('Face models not loaded. Call loadFaceModels() first.');
    }

    const options = new faceapi.TinyFaceDetectorOptions({
        inputSize: 416,
        scoreThreshold: 0.5
    });

    const detections = await faceapi
        .detectAllFaces(input, options)
        .withFaceLandmarks()
        .withFaceDescriptors()
        .withFaceExpressions();

    return detections;
};

/**
 * Detect single face (best match)
 * @param {HTMLImageElement|HTMLVideoElement|HTMLCanvasElement} input
 * @returns {Promise<Object|null>} Single face detection or null
 */
export const detectSingleFace = async (input) => {
    if (!modelsLoaded) {
        throw new Error('Face models not loaded. Call loadFaceModels() first.');
    }

    const options = new faceapi.TinyFaceDetectorOptions({
        inputSize: 416,
        scoreThreshold: 0.5
    });

    const detection = await faceapi
        .detectSingleFace(input, options)
        .withFaceLandmarks()
        .withFaceDescriptor()
        .withFaceExpressions();

    return detection || null;
};

/**
 * Get face descriptor (128-dimensional vector) for face matching
 * @param {HTMLImageElement|HTMLVideoElement|HTMLCanvasElement} input
 * @returns {Promise<Float32Array|null>} Face descriptor array
 */
export const getFaceDescriptor = async (input) => {
    const detection = await detectSingleFace(input);
    return detection?.descriptor || null;
};

/**
 * Compare two face descriptors
 * @param {Float32Array} descriptor1 
 * @param {Float32Array} descriptor2 
 * @returns {number} Euclidean distance (lower = more similar, <0.6 = same person)
 */
export const compareFaces = (descriptor1, descriptor2) => {
    if (!descriptor1 || !descriptor2) return Infinity;
    return faceapi.euclideanDistance(descriptor1, descriptor2);
};

/**
 * Check if two faces match (same person)
 * @param {Float32Array} descriptor1 
 * @param {Float32Array} descriptor2 
 * @param {number} threshold - Match threshold (default 0.6)
 * @returns {boolean} True if faces match
 */
export const facesMatch = (descriptor1, descriptor2, threshold = 0.6) => {
    const distance = compareFaces(descriptor1, descriptor2);
    return distance < threshold;
};

/**
 * Find best matching face from a list of known faces
 * @param {Float32Array} unknownDescriptor - Face to identify
 * @param {Array<{id: string, descriptor: Float32Array}>} knownFaces - Array of known faces
 * @param {number} threshold - Match threshold
 * @returns {{match: Object|null, distance: number}} Best match or null
 */
export const findBestMatch = (unknownDescriptor, knownFaces, threshold = 0.6) => {
    if (!unknownDescriptor || !knownFaces?.length) {
        return { match: null, distance: Infinity };
    }

    let bestMatch = null;
    let bestDistance = Infinity;

    for (const known of knownFaces) {
        if (!known.descriptor) continue;

        // Convert from string/array back to Float32Array if needed
        const knownDesc = known.descriptor instanceof Float32Array 
            ? known.descriptor 
            : new Float32Array(JSON.parse(known.descriptor));

        const distance = compareFaces(unknownDescriptor, knownDesc);
        
        if (distance < bestDistance) {
            bestDistance = distance;
            bestMatch = known;
        }
    }

    if (bestDistance < threshold) {
        return { match: bestMatch, distance: bestDistance, confidence: 1 - bestDistance };
    }

    return { match: null, distance: bestDistance, confidence: 0 };
};

/**
 * Convert descriptor to JSON string for database storage
 * @param {Float32Array} descriptor 
 * @returns {string} JSON string
 */
export const descriptorToString = (descriptor) => {
    if (!descriptor) return null;
    return JSON.stringify(Array.from(descriptor));
};

/**
 * Convert JSON string back to Float32Array
 * @param {string} str 
 * @returns {Float32Array} Descriptor array
 */
export const stringToDescriptor = (str) => {
    if (!str) return null;
    try {
        return new Float32Array(JSON.parse(str));
    } catch {
        return null;
    }
};

/**
 * Draw face detection box on canvas
 * @param {HTMLCanvasElement} canvas 
 * @param {Object} detection 
 * @param {string} label 
 */
export const drawFaceBox = (canvas, detection, label = '') => {
    const ctx = canvas.getContext('2d');
    const box = detection.detection.box;

    ctx.strokeStyle = '#00ff00';
    ctx.lineWidth = 3;
    ctx.strokeRect(box.x, box.y, box.width, box.height);

    if (label) {
        ctx.fillStyle = '#00ff00';
        ctx.font = '16px Arial';
        ctx.fillText(label, box.x, box.y - 10);
    }
};

/**
 * Analyze face quality for registration
 * @param {Object} detection 
 * @returns {{score: number, issues: string[]}}
 */
export const analyzeFaceQuality = (detection) => {
    const issues = [];
    let score = 1.0;

    if (!detection) {
        return { score: 0, issues: ['No face detected'] };
    }

    const { detection: det, landmarks, expressions } = detection;

    // Check detection confidence
    if (det.score < 0.7) {
        issues.push('Low detection confidence');
        score -= 0.2;
    }

    // Check face size (should be at least 100x100 pixels)
    const box = det.box;
    if (box.width < 100 || box.height < 100) {
        issues.push('Face too small - move closer');
        score -= 0.3;
    }

    // Check if face is centered (rough check)
    // Ideally the face should be in the middle third of the frame

    // Check expression (neutral is best for registration)
    if (expressions) {
        const neutralScore = expressions.neutral || 0;
        if (neutralScore < 0.5) {
            issues.push('Keep a neutral expression');
            score -= 0.1;
        }
    }

    return {
        score: Math.max(0, Math.min(1, score)),
        issues,
        isGood: score >= 0.7
    };
};

export default {
    loadFaceModels,
    areModelsLoaded,
    detectFaces,
    detectSingleFace,
    getFaceDescriptor,
    compareFaces,
    facesMatch,
    findBestMatch,
    descriptorToString,
    stringToDescriptor,
    drawFaceBox,
    analyzeFaceQuality
};
