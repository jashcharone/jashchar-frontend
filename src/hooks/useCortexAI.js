/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * USE CORTEX AI HOOK
 * ═══════════════════════════════════════════════════════════════════════════════
 * React hook for accessing Cortex AI Analytics features
 * 
 * AI Providers:
 * - Claude (Anthropic) → Analytics & Insights
 * - OpenAI GPT → Chat Assistant (JashBot)
 * - Google Vision → Document OCR
 */

import { useState, useCallback } from 'react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import apiClient from '@/lib/apiClient';

/**
 * Hook for Cortex AI Analytics
 * @returns {Object} AI analytics functions and state
 */
export const useCortexAI = () => {
    const { user, currentSessionId, organizationId, token } = useAuth();
    const { selectedBranch } = useBranch();
    
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Get headers with context
    const getHeaders = useCallback(() => ({
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'x-organization-id': organizationId,
        'x-branch-id': selectedBranch?.id,
        'x-session-id': currentSessionId
    }), [token, organizationId, selectedBranch, currentSessionId]);

    // ═══════════════════════════════════════════════════════════════════════════════
    // AI PROVIDER STATUS
    // ═══════════════════════════════════════════════════════════════════════════════

    /**
     * Check status of all AI providers
     * @returns {Object} Provider status
     */
    const getAIStatus = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            
            const response = await apiClient.get('/api/cortex-ai/status', {
                headers: getHeaders()
            });
            
            return response.data?.data || null;
        } catch (err) {
            console.error('[useCortexAI] Status error:', err);
            setError(err.message);
            return null;
        } finally {
            setLoading(false);
        }
    }, [getHeaders]);

    // ═══════════════════════════════════════════════════════════════════════════════
    // CLAUDE ANALYTICS - SCHOOL INSIGHTS
    // ═══════════════════════════════════════════════════════════════════════════════

    /**
     * Generate comprehensive school insights using Claude
     * @param {Object} data - School data
     * @param {number} data.totalStudents - Total students count
     * @param {number} data.totalStaff - Total staff count
     * @param {number} data.avgAttendance - Average attendance percentage
     * @param {number} data.feeCollectionRate - Fee collection rate percentage
     * @param {number} data.pendingFees - Pending fees amount
     * @param {number} data.passPercentage - Pass percentage
     * @param {number} data.lowAttendanceCount - Students with low attendance
     * @param {number} data.feeDefaultersCount - Fee defaulters count
     * @returns {Object} AI-generated insights
     */
    const getSchoolInsights = useCallback(async (data) => {
        try {
            setLoading(true);
            setError(null);
            
            const response = await apiClient.post('/api/cortex-ai/analytics/school', 
                { data },
                { headers: getHeaders() }
            );
            
            return response.data?.data || null;
        } catch (err) {
            console.error('[useCortexAI] School insights error:', err);
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [getHeaders]);

    // ═══════════════════════════════════════════════════════════════════════════════
    // CLAUDE ANALYTICS - STUDENT PREDICTION
    // ═══════════════════════════════════════════════════════════════════════════════

    /**
     * Predict student future performance using Claude
     * @param {Object} studentData - Student data
     * @param {string} studentData.name - Student name
     * @param {string} studentData.class - Class
     * @param {string} studentData.section - Section
     * @param {number} studentData.attendanceRate - Attendance rate
     * @param {number[]} studentData.examScores - Last exam scores
     * @param {number} studentData.averageScore - Average score
     * @param {string} studentData.feeStatus - Fee payment status
     * @param {number} studentData.parentEngagement - Parent engagement score (0-10)
     * @param {string} studentData.behaviorNotes - Behavior notes
     * @param {string[]} studentData.activities - Extracurricular activities
     * @returns {Object} Student prediction
     */
    const predictStudent = useCallback(async (studentData) => {
        try {
            setLoading(true);
            setError(null);
            
            const response = await apiClient.post('/api/cortex-ai/analytics/student',
                { studentData },
                { headers: getHeaders() }
            );
            
            return response.data?.data || null;
        } catch (err) {
            console.error('[useCortexAI] Student prediction error:', err);
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [getHeaders]);

    // ═══════════════════════════════════════════════════════════════════════════════
    // CLAUDE ANALYTICS - FEE ANALYSIS
    // ═══════════════════════════════════════════════════════════════════════════════

    /**
     * Analyze fee patterns and predict defaults using Claude
     * @param {Object} feeData - Fee collection data
     * @param {number} feeData.monthlyTarget - Monthly collection target
     * @param {number} feeData.collected - Amount collected this month
     * @param {number} feeData.pending - Pending amount
     * @param {number} feeData.defaultersCount - Number of defaulters
     * @param {number} feeData.avgDelay - Average payment delay in days
     * @param {Object} feeData.paymentMethods - Payment methods breakdown
     * @param {Object} feeData.classWiseCollection - Class-wise collection
     * @returns {Object} Fee analysis with predictions
     */
    const analyzeFees = useCallback(async (feeData) => {
        try {
            setLoading(true);
            setError(null);
            
            const response = await apiClient.post('/api/cortex-ai/analytics/fees',
                { feeData },
                { headers: getHeaders() }
            );
            
            return response.data?.data || null;
        } catch (err) {
            console.error('[useCortexAI] Fee analysis error:', err);
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [getHeaders]);

    // ═══════════════════════════════════════════════════════════════════════════════
    // CLAUDE ANALYTICS - ATTENDANCE ANALYSIS
    // ═══════════════════════════════════════════════════════════════════════════════

    /**
     * Analyze attendance patterns using Claude
     * @param {Object} attendanceData - Attendance data
     * @param {number} attendanceData.overallRate - Overall attendance rate
     * @param {number} attendanceData.belowThreshold - Students below 75%
     * @param {Object} attendanceData.classWise - Class-wise attendance
     * @param {Object} attendanceData.dayWise - Day-wise patterns
     * @param {Array} attendanceData.monthTrend - Monthly trend data
     * @returns {Object} Attendance insights
     */
    const analyzeAttendance = useCallback(async (attendanceData) => {
        try {
            setLoading(true);
            setError(null);
            
            const response = await apiClient.post('/api/cortex-ai/analytics/attendance',
                { attendanceData },
                { headers: getHeaders() }
            );
            
            return response.data?.data || null;
        } catch (err) {
            console.error('[useCortexAI] Attendance analysis error:', err);
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [getHeaders]);

    // ═══════════════════════════════════════════════════════════════════════════════
    // CLAUDE - NATURAL LANGUAGE QUERY
    // ═══════════════════════════════════════════════════════════════════════════════

    /**
     * Ask natural language questions about school data
     * @param {string} question - User's question
     * @param {Object} context - Optional context data
     * @returns {Object} AI answer
     */
    const askQuestion = useCallback(async (question, context = {}) => {
        try {
            setLoading(true);
            setError(null);
            
            const response = await apiClient.post('/api/cortex-ai/query',
                { question, context },
                { headers: getHeaders() }
            );
            
            return response.data?.data || null;
        } catch (err) {
            console.error('[useCortexAI] Query error:', err);
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [getHeaders]);

    // ═══════════════════════════════════════════════════════════════════════════════
    // COMPREHENSIVE ANALYSIS
    // ═══════════════════════════════════════════════════════════════════════════════

    /**
     * Run comprehensive analysis (school + fees + attendance) in one call
     * @param {Object} data - All data for analysis
     * @param {Object} data.schoolData - School data
     * @param {Object} data.feeData - Fee data
     * @param {Object} data.attendanceData - Attendance data
     * @returns {Object} Comprehensive analysis results
     */
    const runComprehensiveAnalysis = useCallback(async ({ schoolData, feeData, attendanceData }) => {
        try {
            setLoading(true);
            setError(null);
            
            const response = await apiClient.post('/api/cortex-ai/analytics/comprehensive',
                { schoolData, feeData, attendanceData },
                { headers: getHeaders() }
            );
            
            return response.data?.data || null;
        } catch (err) {
            console.error('[useCortexAI] Comprehensive analysis error:', err);
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [getHeaders]);

    // ═══════════════════════════════════════════════════════════════════════════════
    // OPENAI CHAT (JashBot)
    // ═══════════════════════════════════════════════════════════════════════════════

    /**
     * Chat with AI assistant (JashBot) using OpenAI
     * @param {string} message - User message
     * @param {Array} context - Previous conversation context
     * @returns {Object} AI response
     */
    const chatWithAI = useCallback(async (message, context = []) => {
        try {
            setLoading(true);
            setError(null);
            
            const response = await apiClient.post('/api/ai/chat',
                { message, context },
                { headers: getHeaders() }
            );
            
            return response.data?.data || null;
        } catch (err) {
            console.error('[useCortexAI] Chat error:', err);
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [getHeaders]);

    // ═══════════════════════════════════════════════════════════════════════════════
    // GOOGLE VISION OCR
    // ═══════════════════════════════════════════════════════════════════════════════

    /**
     * Process document using Google Vision OCR
     * @param {File} file - Image file to process
     * @param {Object} options - OCR options
     * @param {string} options.engine - OCR engine ('tesseract' or 'google_vision')
     * @param {string[]} options.languages - Languages to detect
     * @returns {Object} OCR results
     */
    const processDocument = useCallback(async (file, options = {}) => {
        try {
            setLoading(true);
            setError(null);
            
            const formData = new FormData();
            formData.append('file', file);
            formData.append('options', JSON.stringify(options));
            
            const response = await apiClient.post('/api/ocr/process', formData, {
                headers: {
                    ...getHeaders(),
                    'Content-Type': 'multipart/form-data'
                }
            });
            
            return response.data?.data || null;
        } catch (err) {
            console.error('[useCortexAI] OCR error:', err);
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [getHeaders]);

    // ═══════════════════════════════════════════════════════════════════════════════
    // RETURN HOOK VALUES
    // ═══════════════════════════════════════════════════════════════════════════════

    return {
        // State
        loading,
        error,
        
        // Status
        getAIStatus,
        
        // Claude Analytics
        getSchoolInsights,
        predictStudent,
        analyzeFees,
        analyzeAttendance,
        askQuestion,
        runComprehensiveAnalysis,
        
        // OpenAI Chat
        chatWithAI,
        
        // Google Vision OCR
        processDocument
    };
};

export default useCortexAI;
