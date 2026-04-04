// ═══════════════════════════════════════════════════════════════════════════════
// JASHCHAR ERP - ATTENDANCE MODULE GUARD
// ═══════════════════════════════════════════════════════════════════════════════
// Wraps attendance pages to block access when module is disabled for the branch
// If user navigates directly to a URL of a disabled module → Shows "Module Not Enabled"
// Prevents bypass of sidebar filtering
// ═══════════════════════════════════════════════════════════════════════════════

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useBranchAttendanceModules } from '@/hooks/useBranchAttendanceModules';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, ArrowLeft, Lock, Shield } from 'lucide-react';

/**
 * AttendanceModuleGuard
 * 
 * @param {string} moduleCode - The module_code from attendance_module_types table
 * @param {React.ReactNode} children - The page component to render if module is enabled
 * 
 * Usage in App.jsx:
 * <AttendanceModuleGuard moduleCode="face_recognition">
 *   <SmartStudentLiveFace />
 * </AttendanceModuleGuard>
 */
const AttendanceModuleGuard = ({ moduleCode, children }) => {
    const navigate = useNavigate();
    const { isModuleEnabled, hasConfig, loading } = useBranchAttendanceModules();
    
    // While loading config, show nothing (prevents flash)
    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
        );
    }
    
    // If no config exists (legacy branch), allow all modules
    if (!hasConfig) {
        return children;
    }
    
    // Check if the module is enabled for this branch
    if (isModuleEnabled(moduleCode)) {
        return children;
    }
    
    // Module is disabled - show blocked page
    return (
        <div className="flex items-center justify-center min-h-[60vh] p-4">
            <Card className="max-w-md w-full border-orange-200 bg-orange-50/50">
                <CardContent className="p-8 text-center space-y-4">
                    <div className="flex justify-center">
                        <div className="p-4 rounded-full bg-orange-100">
                            <Lock className="h-10 w-10 text-orange-600" />
                        </div>
                    </div>
                    
                    <h2 className="text-xl font-bold text-orange-800">
                        Module Not Enabled
                    </h2>
                    
                    <p className="text-orange-700 text-sm">
                        This attendance module has not been enabled for your branch.
                        Please contact your administrator to enable this feature.
                    </p>
                    
                    <div className="flex items-center justify-center gap-2 text-xs text-orange-500 bg-orange-100 rounded-lg p-2">
                        <Shield className="h-3.5 w-3.5" />
                        <span>Module: <code className="font-mono">{moduleCode}</code></span>
                    </div>
                    
                    <Button 
                        onClick={() => navigate(-1)} 
                        variant="outline"
                        className="mt-4"
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Go Back
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
};

export default AttendanceModuleGuard;
