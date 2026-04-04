// ═══════════════════════════════════════════════════════════════════════════════
// JASHCHAR ERP - BRANCH ATTENDANCE MODULES HOOK
// ═══════════════════════════════════════════════════════════════════════════════
// This hook fetches which attendance modules are enabled for the current branch
// Master Admin configures this via: /master-admin/system-settings/branch-attendance-config
//
// HOW IT WORKS:
// 1. Each sidebar item has a `moduleCode` property (set in sidebarConfig.js)
// 2. This hook fetches enabled module_codes from branch_attendance_config DB table
// 3. Sidebar.jsx calls isModuleEnabled(moduleCode) to show/hide items
// 4. One module_code can control MULTIPLE sidebar items (e.g., face_recognition → Student + Staff Live Face)
// 5. Section headers auto-hide when all items beneath are hidden
// ═══════════════════════════════════════════════════════════════════════════════

import { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useBranch } from '@/contexts/BranchContext';

// ═══════════════════════════════════════════════════════════════════════════════
// MODULE CODE → PATHS MAPPING (One module can enable multiple paths)
// Each module_code maps to ALL sidebar paths it controls
// Paths MUST match routeRegistry.js SUPER_ADMIN section exactly
// ═══════════════════════════════════════════════════════════════════════════════
export const ATTENDANCE_MODULE_PATHS = {
    // ─── BASIC TIER (Manual Attendance) ─────────────────────────────────
    'manual_student': [
        '/super-admin/attendance/student-attendance',
    ],
    'manual_staff': [
        '/super-admin/attendance/staff-attendance',
    ],
    'attendance_by_date': [
        '/super-admin/attendance/attendance-by-date',
    ],
    'leave_management': [
        '/super-admin/attendance/approve-student-leave',
    ],
    'basic_report': [
        '/super-admin/attendance/attendance-report',
        '/super-admin/attendance/staff-attendance-report',
    ],
    'holiday_management': [],

    // ─── STANDARD TIER (QR + RFID) ─────────────────────────────────────
    'qr_attendance': [
        '/super-admin/attendance/smart/student/qr-code',
        '/super-admin/attendance/smart/staff/qr-code',
        '/super-admin/attendance/qr-generator',
    ],
    'qr_generator': [
        '/super-admin/attendance/smart/student/qr-code',
        '/super-admin/attendance/smart/staff/qr-code',
        '/super-admin/attendance/qr-generator',
    ],
    'rfid_attendance': [
        '/super-admin/attendance/smart/student/cards',
        '/super-admin/attendance/smart/staff/cards',
        '/super-admin/attendance/card-management',
    ],
    'card_management': [
        '/super-admin/attendance/smart/student/cards',
        '/super-admin/attendance/smart/staff/cards',
        '/super-admin/attendance/card-management',
    ],
    'bulk_import': [],
    'sms_alerts': [],
    'parent_app': [],

    // ─── PREMIUM TIER (Biometric + Face Recognition) ───────────────────
    'biometric_finger': [],
    'face_recognition': [
        '/super-admin/attendance/smart/student/live-face',
        '/super-admin/attendance/smart/staff/live-face',
        '/super-admin/attendance/live-face-attendance',
        '/super-admin/attendance/face-dashboard',
        '/super-admin/attendance/heatmap',
        '/super-admin/attendance/late-arrivals',
        '/super-admin/attendance/unknown-faces',
        '/super-admin/attendance/reports',
    ],
    'face_registration': [
        '/super-admin/attendance/smart/student/face-registration',
        '/super-admin/attendance/smart/staff/face-registration',
        '/super-admin/attendance/face-registration',
    ],
    'live_dashboard': [
        '/super-admin/attendance/live-dashboard',
    ],
    'device_management': [
        '/super-admin/attendance/smart/student/devices',
        '/super-admin/attendance/smart/staff/devices',
        '/super-admin/attendance/device-management',
    ],
    'automation_rules': [
        '/super-admin/attendance/rules',
    ],
    'shift_management': [],
    'whatsapp_alerts': [],
    'advanced_report': [
        '/super-admin/attendance/smart/student/analytics',
        '/super-admin/attendance/smart/staff/analytics',
        '/super-admin/attendance/analytics',
    ],

    // ─── ENTERPRISE TIER (GPS + AI + IoT) ──────────────────────────────
    'geo_fence': [
        '/super-admin/attendance/geo-fence',
    ],
    'gps_tracking': [],
    'smart_classroom': [],
    'period_wise': [],
    'ai_cameras': [
        '/super-admin/attendance/ai-camera-management',
        '/super-admin/attendance/faiss-index-management',
    ],
    'voice_recognition': [],
    'wearable_devices': [
        '/super-admin/attendance/wearable-devices',
    ],
    'iot_sensors': [],
    'proxy_detection': [
        '/super-admin/attendance/spoof-alerts',
    ],
    'attention_tracking': [],
    'api_integration': [],
    'custom_reports': [],
};

// ═══════════════════════════════════════════════════════════════════════════════
// REVERSE MAPPING: Path → Module Codes (a path can be enabled by multiple modules)
// Built automatically from ATTENDANCE_MODULE_PATHS
// ═══════════════════════════════════════════════════════════════════════════════
export const PATH_TO_ATTENDANCE_MODULE = (() => {
    const map = {};
    for (const [moduleCode, paths] of Object.entries(ATTENDANCE_MODULE_PATHS)) {
        for (const path of paths) {
            if (!map[path]) map[path] = [];
            map[path].push(moduleCode);
        }
    }
    return map;
})();

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION HEADER → MODULE CODES MAPPING
// Defines which module codes make a section header visible
// Section headers show only if at least one module in their group is enabled
// ═══════════════════════════════════════════════════════════════════════════════
export const SECTION_HEADER_MODULES = {
    '#att-student': ['manual_student', 'attendance_by_date', 'leave_management', 'basic_report'],
    '#att-smart-student': ['face_recognition', 'face_registration', 'qr_attendance', 'rfid_attendance', 'device_management', 'advanced_report'],
    '#att-staff': ['manual_staff', 'basic_report'],
    '#att-smart-staff': ['face_recognition', 'face_registration', 'qr_attendance', 'rfid_attendance', 'device_management', 'advanced_report'],
    '#att-ai-system': ['face_recognition', 'ai_cameras', 'proxy_detection', 'live_dashboard'],
    '#att-settings': ['face_recognition', 'automation_rules', 'wearable_devices', 'geo_fence', 'advanced_report'],
};

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
    const isModuleEnabled = useCallback((moduleCode) => {
        // If no config exists (empty array), allow all (legacy behavior)
        if (enabledModules.length === 0) return true;
        return enabledModules.includes(moduleCode);
    }, [enabledModules]);

    // Check if a sidebar path is enabled
    // A path is enabled if ANY of its associated module codes are enabled
    const isPathEnabled = useCallback((path) => {
        // If no config exists, allow all
        if (enabledModules.length === 0) return true;

        // Section headers: check if any module in that section is enabled
        if (path?.startsWith('#')) {
            const sectionModules = SECTION_HEADER_MODULES[path];
            if (!sectionModules) return true;
            return sectionModules.some(code => enabledModules.includes(code));
        }
        
        const moduleCodes = PATH_TO_ATTENDANCE_MODULE[path];
        if (!moduleCodes || moduleCodes.length === 0) {
            return true; // Path not in attendance module mapping → always show
        }
        
        // Path is enabled if ANY associated module is enabled
        return moduleCodes.some(code => enabledModules.includes(code));
    }, [enabledModules]);

    // Get list of enabled paths (for filtering sidebar)
    const enabledPaths = useMemo(() => {
        if (enabledModules.length === 0) return null; // null means no filtering
        
        const paths = new Set();
        enabledModules.forEach(code => {
            const modulePaths = ATTENDANCE_MODULE_PATHS[code] || [];
            modulePaths.forEach(p => paths.add(p));
        });
        return [...paths];
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
