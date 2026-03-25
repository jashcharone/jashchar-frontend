// ═══════════════════════════════════════════════════════════════════════════════════════════════════
// JASHCHAR ERP - FACE RECOGNITION WEBSOCKET HOOK (Day 18)
// Real-time face recognition via WebSocket connection to Python AI Engine
// ═══════════════════════════════════════════════════════════════════════════════════════════════════

import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * WebSocket hook for real-time face recognition
 * 
 * @param {Object} options Configuration options
 * @param {string} options.branchId - Branch ID for recognition
 * @param {string} options.clientId - Client identifier (camera name)
 * @param {boolean} options.autoConnect - Auto-connect on mount (default: false)
 * @param {number} options.reconnectInterval - Reconnection interval in ms (default: 3000)
 * @param {number} options.maxReconnectAttempts - Max reconnection attempts (default: 5)
 * @param {Function} options.onResult - Callback for recognition results
 * @param {Function} options.onError - Callback for errors
 * @param {Function} options.onConnect - Callback when connected
 * @param {Function} options.onDisconnect - Callback when disconnected
 * 
 * @returns {Object} WebSocket controls and state
 */
export const useFaceRecognitionWebSocket = ({
    branchId,
    clientId = 'web_client',
    autoConnect = false,
    reconnectInterval = 3000,
    maxReconnectAttempts = 5,
    onResult,
    onError,
    onConnect,
    onDisconnect
} = {}) => {
    // State
    const [isConnected, setIsConnected] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);
    const [lastResult, setLastResult] = useState(null);
    const [lastError, setLastError] = useState(null);
    const [stats, setStats] = useState({
        framesSent: 0,
        facesDetected: 0,
        facesRecognized: 0,
        avgProcessTime: 0,
        totalProcessTime: 0
    });
    
    // Refs
    const wsRef = useRef(null);
    const reconnectAttemptsRef = useRef(0);
    const reconnectTimeoutRef = useRef(null);
    const processingRef = useRef(false);
    
    // Callback refs — always up-to-date without causing connect() to recreate
    const onResultRef = useRef(onResult);
    const onErrorRef = useRef(onError);
    const onConnectRef = useRef(onConnect);
    const onDisconnectRef = useRef(onDisconnect);
    onResultRef.current = onResult;
    onErrorRef.current = onError;
    onConnectRef.current = onConnect;
    onDisconnectRef.current = onDisconnect;
    
    // Get WebSocket URL
    const getWsUrl = useCallback(() => {
        // AI Engine WebSocket endpoint
        const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const aiEngineHost = import.meta.env.VITE_AI_ENGINE_WS_URL || 'localhost:8501';
        return `${wsProtocol}//${aiEngineHost}/ws/recognize/${branchId}?client_id=${clientId}`;
    }, [branchId, clientId]);
    
    // Connect to WebSocket
    const connect = useCallback(() => {
        if (!branchId) {
            console.error('❌ Branch ID required for WebSocket connection');
            return;
        }
        
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            console.log('⚠️ WebSocket already connected');
            return;
        }
        
        setIsConnecting(true);
        setLastError(null);
        
        try {
            const url = getWsUrl();
            console.log(`🔌 Connecting to WebSocket: ${url}`);
            
            wsRef.current = new WebSocket(url);
            
            wsRef.current.onopen = () => {
                console.log('✅ WebSocket connected');
                setIsConnected(true);
                setIsConnecting(false);
                reconnectAttemptsRef.current = 0;
                
                if (onConnectRef.current) {
                    onConnectRef.current();
                }
            };
            
            wsRef.current.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    processingRef.current = false;
                    setLastResult(data);
                    
                    // Update stats
                    if (data.success) {
                        setStats(prev => {
                            const newFramesSent = prev.framesSent + 1;
                            const newFacesDetected = prev.facesDetected + (data.face_count || 0);
                            const newFacesRecognized = prev.facesRecognized + (data.recognized_count || 0);
                            const newTotalProcessTime = prev.totalProcessTime + (data.process_time_ms || 0);
                            
                            return {
                                framesSent: newFramesSent,
                                facesDetected: newFacesDetected,
                                facesRecognized: newFacesRecognized,
                                totalProcessTime: newTotalProcessTime,
                                avgProcessTime: newTotalProcessTime / newFramesSent
                            };
                        });
                    }
                    
                    if (onResultRef.current) {
                        onResultRef.current(data);
                    }
                } catch (e) {
                    console.error('❌ Failed to parse WebSocket message:', e);
                }
            };
            
            wsRef.current.onerror = (error) => {
                console.error('❌ WebSocket error:', error);
                setLastError('WebSocket connection error');
                processingRef.current = false;
                
                if (onErrorRef.current) {
                    onErrorRef.current(error);
                }
            };
            
            wsRef.current.onclose = (event) => {
                console.log(`🔌 WebSocket closed: ${event.code} ${event.reason}`);
                setIsConnected(false);
                setIsConnecting(false);
                processingRef.current = false;
                
                if (onDisconnectRef.current) {
                    onDisconnectRef.current(event);
                }
                
                // Auto-reconnect logic
                if (reconnectAttemptsRef.current < maxReconnectAttempts) {
                    reconnectAttemptsRef.current++;
                    console.log(`🔄 Reconnecting... Attempt ${reconnectAttemptsRef.current}/${maxReconnectAttempts}`);
                    
                    reconnectTimeoutRef.current = setTimeout(() => {
                        connect();
                    }, reconnectInterval);
                } else {
                    console.error('❌ Max reconnection attempts reached');
                    setLastError('Connection lost. Max reconnection attempts reached.');
                }
            };
        } catch (error) {
            console.error('❌ Failed to create WebSocket:', error);
            setIsConnecting(false);
            setLastError(error.message);
        }
    }, [branchId, clientId, getWsUrl, maxReconnectAttempts, reconnectInterval]);
    
    // Disconnect from WebSocket
    const disconnect = useCallback(() => {
        // Clear reconnect timeout
        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
            reconnectTimeoutRef.current = null;
        }
        
        // Reset reconnect attempts to prevent auto-reconnect
        reconnectAttemptsRef.current = maxReconnectAttempts;
        
        if (wsRef.current) {
            console.log('🔌 Disconnecting WebSocket...');
            console.trace('disconnect() called from:');
            wsRef.current.close(1000, 'Client disconnect');
            wsRef.current = null;
        }
        
        setIsConnected(false);
        setIsConnecting(false);
        processingRef.current = false;
    }, [maxReconnectAttempts]);
    
    // Send frame for recognition
    const sendFrame = useCallback((base64Image, threshold = 0.5, classId = null) => {
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
            console.warn('⚠️ WebSocket not connected');
            return false;
        }
        
        if (processingRef.current) {
            // Skip frame if still processing previous
            return false;
        }
        
        processingRef.current = true;
        
        try {
            const msg = {
                image: base64Image,
                threshold
            };
            if (classId) msg.class_id = classId;
            
            const payload = JSON.stringify(msg);
            
            wsRef.current.send(payload);
            return true;
        } catch (error) {
            console.error('❌ Failed to send frame:', error);
            processingRef.current = false;
            return false;
        }
    }, []);
    
    // Reset stats
    const resetStats = useCallback(() => {
        setStats({
            framesSent: 0,
            facesDetected: 0,
            facesRecognized: 0,
            avgProcessTime: 0,
            totalProcessTime: 0
        });
    }, []);
    
    // Auto-connect on mount if enabled — only re-run when branchId/autoConnect changes,
    // NOT when connect/disconnect callbacks recreate (they are stable now)
    useEffect(() => {
        if (autoConnect && branchId) {
            connect();
        }
        
        // Cleanup on unmount only
        return () => {
            if (wsRef.current) {
                wsRef.current.close(1000, 'Component unmount');
                wsRef.current = null;
            }
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
            }
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [autoConnect, branchId]);
    
    return {
        // State
        isConnected,
        isConnecting,
        lastResult,
        lastError,
        stats,
        
        // Actions
        connect,
        disconnect,
        sendFrame,
        resetStats,
        
        // Computed
        isReady: isConnected && !processingRef.current
    };
};


/**
 * Helper to capture frame from video element as base64
 * @param {HTMLVideoElement} videoElement - Video element
 * @param {number} quality - JPEG quality (0-1)
 * @returns {string|null} Base64 image data (without prefix)
 */
export const captureVideoFrame = (videoElement, quality = 0.7, maxWidth = 640) => {
    if (!videoElement || videoElement.readyState < 2) {
        return null;
    }
    
    const canvas = document.createElement('canvas');
    const srcW = videoElement.videoWidth;
    const srcH = videoElement.videoHeight;
    
    // Downscale to maxWidth for faster AI processing (640px is optimal for face detection)
    if (srcW > maxWidth) {
        const scale = maxWidth / srcW;
        canvas.width = maxWidth;
        canvas.height = Math.round(srcH * scale);
    } else {
        canvas.width = srcW;
        canvas.height = srcH;
    }
    
    const ctx = canvas.getContext('2d');
    ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
    
    const dataUrl = canvas.toDataURL('image/jpeg', quality);
    // Remove data:image/jpeg;base64, prefix
    return dataUrl.split(',')[1];
};


/**
 * Hook for streaming video frames to WebSocket
 * @param {Object} options Configuration
 * @returns {Object} Streaming controls
 */
export const useFaceRecognitionStream = ({
    videoRef,
    branchId,
    clientId = 'camera',
    fps = 5,
    threshold = 0.5,
    autoStart = false,
    onRecognition
} = {}) => {
    const [isStreaming, setIsStreaming] = useState(false);
    const frameIntervalRef = useRef(null);
    
    const ws = useFaceRecognitionWebSocket({
        branchId,
        clientId,
        autoConnect: autoStart,
        onResult: (result) => {
            if (result.success && result.faces?.length > 0) {
                const recognized = result.faces.filter(f => f.recognized);
                if (recognized.length > 0 && onRecognition) {
                    onRecognition(recognized, result);
                }
            }
        }
    });
    
    // Start streaming
    const startStreaming = useCallback(() => {
        if (!ws.isConnected) {
            ws.connect();
        }
        
        setIsStreaming(true);
        
        // Send frames at specified FPS
        const intervalMs = 1000 / fps;
        frameIntervalRef.current = setInterval(() => {
            if (videoRef.current && ws.isConnected) {
                const frame = captureVideoFrame(videoRef.current);
                if (frame) {
                    ws.sendFrame(frame, threshold);
                }
            }
        }, intervalMs);
    }, [ws, fps, threshold, videoRef]);
    
    // Stop streaming
    const stopStreaming = useCallback(() => {
        setIsStreaming(false);
        
        if (frameIntervalRef.current) {
            clearInterval(frameIntervalRef.current);
            frameIntervalRef.current = null;
        }
    }, []);
    
    // Cleanup
    useEffect(() => {
        return () => {
            stopStreaming();
            ws.disconnect();
        };
    }, [stopStreaming, ws]);
    
    return {
        ...ws,
        isStreaming,
        startStreaming,
        stopStreaming
    };
};

export default useFaceRecognitionWebSocket;
