// ═══════════════════════════════════════════════════════════════════════════════
// JASHCHAR ERP - BRANCH ATTENDANCE MODULES HOOK
// ═══════════════════════════════════════════════════════════════════════════════
// This hook fetches which attendance modules are enabled for the current branch
// Master Admin configures this via: /master-admin/system-settings/branch-attendance-config
// ═══════════════════════════════════════════════════════════════════════════════

import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useBranch } from '@/contexts/BranchContext';

// ═══════════════════════════════════════════════════════════════════════════════
// MODULE CODE → SIDEBAR PATH MAPPING
// Maps database module_code values to frontend sidebar paths
// These paths MUST match what's in routeRegistry.js SUPER_ADMIN section
// ═══════════════════════════════════════════════════════════════════════════════
export const ATTENDANCE_MODULE_TO_PATH = {
    // Basic Tier - Core attendance (paths MUST match sidebarConfig.js / routeRegistry.js)
    'manual_student': '/super-admin/attendance/student-attendance',
    'manual_staff': '/super-admin/attendance/staff-attendance',
    'attendance_by_date': '/super-admin/attendance/attendance-by-date',
    'leave_management': '/super-admin/attendance/approve-student-leave',
    'basic_report': '/super-admin/attendance/attendance-report',
    'holiday_management': '/super-admin/holidays',
    
    // Standard Tier - QR & Cards
    'qr_attendance': '/super-admin/qr-attendance/scan',
    'qr_generator': '/super-admin/attendance/qr-generator',
    'rfid_attendance': '/super-admin/attendance/card-management',
    'card_management': '/super-admin/attendance/card-management',
    'bulk_import': '/super-admin/attendance/bulk-import',
    'sms_alerts': '/super-admin/attendance/sms-alerts',
    'parent_notifications': '/super-admin/attendance/notifications',
    
    // Premium Tier - Biometric & Face
    'fingerprint': '/super-admin/attendance/biometric',
    'biometric_finger': '/super-admin/attendance/biometric',
    'face_recognition': '/super-admin/attendance/face-registration',
    'face_registration': '/super-admin/attendance/face-registration',
    'live_face_attendance': '/super-admin/attendance/live-face-attendance',
    'live_dashboard': '/super-admin/attendance/live-dashboard',
    'device_management': '/super-admin/attendance/device-management',
    'automation_rules': '/super-admin/attendance/rules',
    'shift_management': '/super-admin/attendance/shift-management',
    'whatsapp_alerts': '/super-admin/whatsapp',
    'advanced_analytics': '/super-admin/attendance/analytics',
    'advanced_report': '/super-admin/attendance/analytics',
    
    // Enterprise Tier - GPS, Wearables & AI
    'wearable_devices': '/super-admin/attendance/wearable-devices',
    'geo_fence': '/super-admin/attendance/geo-fence',
    'gps_tracking': '/super-admin/attendance/gps-tracking',
    'smart_classroom': '/super-admin/attendance/smart-classroom',
    'period_attendance': '/super-admin/attendance/period-wise',
    'period_wise': '/super-admin/attendance/period-wise',
    'ai_camera': '/super-admin/attendance/ai-camera',
    'ai_cameras': '/super-admin/attendance/ai-camera',
    'voice_recognition': '/super-admin/attendance/voice-recognition',
    'wearable_devices': '/super-admin/attendance/wearable-devices',
    'iot_sensors': '/super-admin/attendance/iot-sensors',
    'proxy_detection': '/super-admin/attendance/proxy-detection',
    'attention_tracking': '/super-admin/attendance/attention-tracking',
    'external_api': '/super-admin/attendance/api-integration',
    'api_integration': '/super-admin/attendance/api-integration',
    'custom_reports': '/super-admin/attendance/custom-reports'
};

// Reverse mapping: Path → Module Code (for checking if a path is enabled)
export const PATH_TO_ATTENDANCE_MODULE = Object.fromEntries(
    Object.entries(ATTENDANCE_MODULE_TO_PATH).map(([code, path]) => [path, code])
);

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN HOOK
// ═══════════════════════════════════════════════════════════════════════════════
export const useBranchAttendanceModules = () => {
    const { selectedBranch } = useBranch();
    const [enabledModules, setEnabledModules] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchEnabledModules = async () => {
            if (!selectedBranch?.id) {
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                
                const { data, error: fetchError } = await supabase
                    .from('branch_attendance_config')
                    .select('module_code, is_enabled')
                    .eq('branch_id', selectedBranch.id)
                    .eq('is_enabled', true);

                if (fetchError) {
                    // If table doesn't exist or other error, allow all modules (legacy behavior)
                    console.warn('[useBranchAttendanceModules] Error fetching config, allowing all modules:', fetchError.message);
                    setEnabledModules([]);
                    setError(null);
                } else {
                    const codes = data?.map(d => d.module_code) || [];
                    setEnabledModules(codes);
                    console.log('[useBranchAttendanceModules] Enabled modules for branch', selectedBranch.id, ':', codes);
                }
            } catch (err) {
                console.error('[useBranchAttendanceModules] Exception:', err);
                setError(err);
            } finally {
                setLoading(false);
            }
        };

        fetchEnabledModules();
    }, [selectedBranch?.id]);

    // Check if a specific module code is enabled
    const isModuleEnabled = useMemo(() => {
        return (moduleCode) => {
            // If no config exists (empty array), allow all (legacy behavior)
            if (enabledModules.length === 0) return true;
            return enabledModules.includes(moduleCode);
        };
    }, [enabledModules]);

    // Check if a sidebar path is enabled
    const isPathEnabled = useMemo(() => {
        return (path) => {
            // If no config exists, allow all
            if (enabledModules.length === 0) {
                console.log('[isPathEnabled] No config found, allowing:', path);
                return true;
            }
            
            const moduleCode = PATH_TO_ATTENDANCE_MODULE[path];
            if (!moduleCode) {
                console.log('[isPathEnabled] Path not in attendance mapping, allowing:', path);
                return true; // Path not in attendance modules, allow it
            }
            
            const isEnabled = enabledModules.includes(moduleCode);
            console.log(`[isPathEnabled] ${path} -> ${moduleCode} -> ${isEnabled ? '✅ SHOW' : '❌ HIDE'}`);
            return isEnabled;
        };
    }, [enabledModules]);

    // Get list of enabled paths (for filtering sidebar)
    const enabledPaths = useMemo(() => {
        if (enabledModules.length === 0) return null; // null means no filtering
        
        return enabledModules
            .map(code => ATTENDANCE_MODULE_TO_PATH[code])
            .filter(Boolean);
    }, [enabledModules]);

    return {
        enabledModules,
        enabledPaths,
        isModuleEnabled,
        isPathEnabled,
        loading,
        error,
        hasConfig: enabledModules.length > 0
    };
};

export default useBranchAttendanceModules;
