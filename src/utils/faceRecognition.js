/**
 * Face Recognition Utility using face-api.js
 * Real AI-powered face detection and recognition
 */

import * as faceapi from 'face-api.js';

// Model loading state
let modelsLoaded = false;
let loadingPromise = null;

// CDN URL for face-api models - MUST match face-api.js@0.22.2 (justadudewhohacks)
const MODEL_URL = 'https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js@0.22.2/weights';

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

    // Try multiple input sizes and thresholds for robustness
    // Larger inputSize works better for webcam, smaller for passport photos
    const attempts = [
        { inputSize: 512, scoreThreshold: 0.3 },
        { inputSize: 416, scoreThreshold: 0.2 },
        { inputSize: 320, scoreThreshold: 0.15 },
        { inputSize: 224, scoreThreshold: 0.1 },
        { inputSize: 160, scoreThreshold: 0.1 },
    ];

    for (const { inputSize, scoreThreshold } of attempts) {
        try {
            const options = new faceapi.TinyFaceDetectorOptions({ inputSize, scoreThreshold });
            const detection = await faceapi
                .detectSingleFace(input, options)
                .withFaceLandmarks()
                .withFaceDescriptor()
                .withFaceExpressions();

            if (detection) {
                console.log(`[FaceAI] Face detected with inputSize=${inputSize}, score=${detection.detection.score}`);
                return detection;
            }
        } catch (err) {
            console.warn(`[FaceAI] Detection attempt failed (inputSize=${inputSize}):`, err.message);
        }
    }

    return null;
};

/**
 * Detect ALL faces in frame with descriptors - for multi-face attendance
 * @param {HTMLImageElement|HTMLVideoElement|HTMLCanvasElement} input
 * @returns {Promise<Array>} Array of face detections with descriptors
 */
export const detectAllFacesWithDescriptors = async (input) => {
    if (!modelsLoaded) {
        throw new Error('Face models not loaded. Call loadFaceModels() first.');
    }

    const options = new faceapi.TinyFaceDetectorOptions({
        inputSize: 512,  // Higher resolution for multiple faces
        scoreThreshold: 0.4  // Lower threshold to catch more faces
    });

    const detections = await faceapi
        .detectAllFaces(input, options)
        .withFaceLandmarks()
        .withFaceDescriptors()
        .withFaceExpressions();

    return detections || [];
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
    
    // Ensure both are Float32Array
    const arr1 = ensureFloat32Array(descriptor1);
    const arr2 = ensureFloat32Array(descriptor2);
    
    if (!arr1 || !arr2) return Infinity;
    
    // Dimension mismatch (e.g. 128D browser vs 512D ArcFace) — incompatible, skip silently
    if (arr1.length !== arr2.length) return Infinity;
    
    // Standard face-api.js uses 128D, ArcFace uses 512D
    if (arr1.length !== 128 && arr1.length !== 512) {
        return Infinity;
    }
    
    return faceapi.euclideanDistance(arr1, arr2);
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
 * Ensure value is a valid Float32Array with 128 elements
 * Handles: Float32Array, Array, Object with numbered keys, JSON string
 */
const ensureFloat32Array = (value) => {
    if (!value) return null;
    
    // Already Float32Array
    if (value instanceof Float32Array) {
        return value;
    }
    
    // String - parse as JSON
    if (typeof value === 'string') {
        try {
            const parsed = JSON.parse(value);
            return new Float32Array(Array.isArray(parsed) ? parsed : Object.values(parsed));
        } catch {
            return null;
        }
    }
    
    // Array
    if (Array.isArray(value)) {
        return new Float32Array(value);
    }
    
    // Object with numbered keys (0, 1, 2, ...)
    if (typeof value === 'object') {
        const values = Object.values(value);
        if (values.length > 0 && typeof values[0] === 'number') {
            return new Float32Array(values);
        }
    }
    
    return null;
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

    // Ensure unknown descriptor is valid
    const unknownDesc = ensureFloat32Array(unknownDescriptor);
    if (!unknownDesc || unknownDesc.length !== 128) {
        console.warn('[FaceAI] Invalid unknown descriptor');
        return { match: null, distance: Infinity };
    }

    let bestMatch = null;
    let bestDistance = Infinity;

    for (const known of knownFaces) {
        if (!known.descriptor) continue;

        // Convert from any format to Float32Array
        const knownDesc = ensureFloat32Array(known.descriptor);
        
        if (!knownDesc || knownDesc.length !== 128) {
            console.warn('[FaceAI] Skipping invalid stored descriptor for:', known.student_id || known.id);
            continue;
        }

        const distance = faceapi.euclideanDistance(unknownDesc, knownDesc);
        
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

    // Check detection confidence - only penalize very low scores
    if (det.score < 0.15) {
        issues.push('Low detection confidence');
        score -= 0.1;
    }

    // Check face size (should be at least 40x40 pixels)
    const box = det.box;
    if (box.width < 40 || box.height < 40) {
        issues.push('Face too small - move closer');
        score -= 0.15;
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
        isGood: score >= 0.3
    };
};

export default {
    loadFaceModels,
    areModelsLoaded,
    detectFaces,
    detectSingleFace,
    detectAllFacesWithDescriptors,
    getFaceDescriptor,
    compareFaces,
    facesMatch,
    findBestMatch,
    descriptorToString,
    stringToDescriptor,
    drawFaceBox,
    analyzeFaceQuality
};
