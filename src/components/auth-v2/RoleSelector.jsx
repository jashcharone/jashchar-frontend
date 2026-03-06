/**
 * ROLE SELECTOR COMPONENT
 * ═══════════════════════════════════════════════════════════════════════════════
 * Role selection screen after OTP verification
 * 
 * Features:
 * - Visual role cards with icons
 * - Organization/Branch context
 * - Primary role highlighting
 * - Student list under parent role
 * 
 * Created: March 5, 2026
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import React, { useState, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
    User, Users, GraduationCap, BookOpen, Building2, 
    Shield, ArrowRight, Loader2, Star, Check
} from 'lucide-react';
import { selectRole } from '@/services/unifiedAuthV2Service';

// Role type icons and colors
const ROLE_CONFIG = {
    parent: {
        icon: Users,
        label: 'ಪೋಷಕರು (Parent)',
        color: 'bg-purple-500',
        bgLight: 'bg-purple-50',
        borderColor: 'border-purple-300',
        description: 'ಮಕ್ಕಳ ವಿವರಗಳು, ಫೀಸ್, ಅಟೆಂಡೆನ್ಸ್ ನೋಡಿ'
    },
    student: {
        icon: GraduationCap,
        label: 'ವಿದ್ಯಾರ್ಥಿ (Student)',
        color: 'bg-green-500',
        bgLight: 'bg-green-50',
        borderColor: 'border-green-300',
        description: 'ನಿಮ್ಮ ತರಗತಿ, ಹೋಮ್‌ವರ್ಕ್, ಫಲಿತಾಂಶ ನೋಡಿ'
    },
    teacher: {
        icon: BookOpen,
        label: 'ಶಿಕ್ಷಕ (Teacher)',
        color: 'bg-blue-500',
        bgLight: 'bg-blue-50',
        borderColor: 'border-blue-300',
        description: 'ತರಗತಿಗಳು, ಅಟೆಂಡೆನ್ಸ್, ಮಾರ್ಕ್ಸ್ ನಿರ್ವಹಿಸಿ'
    },
    staff: {
        icon: User,
        label: 'ಸಿಬ್ಬಂದಿ (Staff)',
        color: 'bg-orange-500',
        bgLight: 'bg-orange-50',
        borderColor: 'border-orange-300',
        description: 'ಕಚೇರಿ ಕೆಲಸಗಳು, ವರದಿಗಳು'
    },
    admin: {
        icon: Shield,
        label: 'ಆಡ್ಮಿನ್ (Admin)',
        color: 'bg-red-500',
        bgLight: 'bg-red-50',
        borderColor: 'border-red-300',
        description: 'ಸಂಪೂರ್ಣ ಶಾಲೆಯ ನಿರ್ವಹಣೆ'
    }
};

const RoleSelector = ({
    user,
    roles,
    onRoleSelected,
    primaryColor = '#3b82f6'
}) => {
    const [selectedRole, setSelectedRole] = useState(null);
    const [loading, setLoading] = useState(false);
    
    // Group roles by type
    const groupedRoles = useMemo(() => {
        const groups = {};
        
        roles.forEach(role => {
            const type = role.role_type;
            if (!groups[type]) {
                groups[type] = [];
            }
            groups[type].push(role);
        });
        
        return groups;
    }, [roles]);
    
    // Get role types present
    const roleTypes = Object.keys(groupedRoles);
    
    // Handle role selection
    const handleSelectRole = (role) => {
        setSelectedRole(role);
    };
    
    // Continue with selected role
    const handleContinue = async () => {
        if (!selectedRole) return;
        
        setLoading(true);
        
        try {
            // Store selected role
            await selectRole(selectedRole);
            
            // Notify parent
            onRoleSelected(selectedRole);
        } catch (error) {
            console.error('Role selection error:', error);
        } finally {
            setLoading(false);
        }
    };
    
    // Get display name for entity
    const getEntityName = (role) => {
        if (role.entity_type === 'student') {
            // Would need to fetch student name - for now show entity_id
            return `Student ID: ${role.entity_id}`;
        }
        return role.organizations?.name || role.branches?.name || '';
    };
    
    // Check if only one role - auto-select
    React.useEffect(() => {
        if (roles.length === 1) {
            handleSelectRole(roles[0]);
        }
    }, [roles]);
    
    return (
        <Card className="w-full max-w-lg mx-auto shadow-xl border-0">
            <CardHeader className="text-center pb-2">
                <div className="text-5xl mb-2">👋</div>
                
                <CardTitle className="text-2xl font-bold">
                    ಸ್ವಾಗತ, {user?.full_name || 'User'}!
                </CardTitle>
                <CardDescription className="text-base">
                    {roleTypes.length > 1 
                        ? 'ನಿಮಗೆ ಹಲವು roles ಇವೆ. ಯಾವುದಾಗಿ ಲಾಗಿನ್ ಆಗಬೇಕು?'
                        : 'ನಿಮ್ಮ ಖಾತೆಗೆ ಸ್ವಾಗತ'}
                </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
                {/* Role Cards */}
                {roleTypes.map(roleType => {
                    const config = ROLE_CONFIG[roleType] || ROLE_CONFIG.staff;
                    const Icon = config.icon;
                    const rolesOfType = groupedRoles[roleType];
                    
                    return (
                        <div key={roleType} className="space-y-2">
                            {/* Role Type Header */}
                            {rolesOfType.length > 1 && (
                                <div className="flex items-center gap-2 px-2">
                                    <Icon className="h-4 w-4 text-gray-500" />
                                    <span className="text-sm font-medium text-gray-600">
                                        {config.label}
                                    </span>
                                </div>
                            )}
                            
                            {/* Role Cards */}
                            {rolesOfType.map(role => (
                                <button
                                    key={role.id}
                                    onClick={() => handleSelectRole(role)}
                                    className={`w-full p-4 rounded-xl border-2 transition-all text-left
                                        ${selectedRole?.id === role.id
                                            ? `${config.borderColor} ${config.bgLight} ring-2 ring-offset-2`
                                            : 'border-gray-200 hover:border-gray-300 bg-white hover:bg-gray-50'
                                        }`}
                                >
                                    <div className="flex items-start gap-4">
                                        {/* Role Icon */}
                                        <div className={`p-3 rounded-xl ${config.color} text-white`}>
                                            <Icon className="h-6 w-6" />
                                        </div>
                                        
                                        {/* Role Details */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className="font-semibold text-gray-900">
                                                    {config.label}
                                                </span>
                                                {role.is_primary && (
                                                    <Badge variant="secondary" className="text-xs">
                                                        <Star className="h-3 w-3 mr-1" />
                                                        Primary
                                                    </Badge>
                                                )}
                                            </div>
                                            
                                            {/* Organization/Branch */}
                                            {role.organizations && (
                                                <div className="flex items-center gap-1 text-sm text-gray-600 mt-1">
                                                    <Building2 className="h-3 w-3" />
                                                    <span>{role.organizations.name}</span>
                                                    {role.branches && (
                                                        <>
                                                            <span className="mx-1">•</span>
                                                            <span>{role.branches.name}</span>
                                                        </>
                                                    )}
                                                </div>
                                            )}
                                            
                                            <p className="text-xs text-gray-500 mt-1">
                                                {config.description}
                                            </p>
                                        </div>
                                        
                                        {/* Selection Indicator */}
                                        {selectedRole?.id === role.id && (
                                            <div className={`p-1 rounded-full ${config.color}`}>
                                                <Check className="h-4 w-4 text-white" />
                                            </div>
                                        )}
                                    </div>
                                </button>
                            ))}
                        </div>
                    );
                })}
                
                {/* No Roles Message */}
                {roles.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                        <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                        <p>ನಿಮಗೆ ಯಾವುದೇ role assign ಆಗಿಲ್ಲ.</p>
                        <p className="text-sm">ದಯವಿಟ್ಟು ಶಾಲೆಯ admin ಅನ್ನು ಸಂಪರ್ಕಿಸಿ.</p>
                    </div>
                )}
                
                {/* Continue Button */}
                {roles.length > 0 && (
                    <Button
                        onClick={handleContinue}
                        className="w-full h-12 text-lg font-semibold mt-4"
                        style={{ backgroundColor: primaryColor }}
                        disabled={loading || !selectedRole}
                    >
                        {loading ? (
                            <>
                                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                ಲೋಡ್ ಆಗುತ್ತಿದೆ...
                            </>
                        ) : (
                            <>
                                ಮುಂದುವರಿಸಿ
                                <ArrowRight className="ml-2 h-5 w-5" />
                            </>
                        )}
                    </Button>
                )}
            </CardContent>
        </Card>
    );
};

export default RoleSelector;
