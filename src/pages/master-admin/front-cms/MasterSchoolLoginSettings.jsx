import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import SchoolLoginSettingsTab from '@/components/front-cms-editor/SchoolLoginSettingsTab';
import { supabase } from '@/lib/supabaseClient';

const MasterSchoolLoginSettings = () => {
    const navigate = useNavigate();
    const [selectedSchool, setSelectedSchool] = useState('');
    const [schoolName, setSchoolName] = useState('');
    
    useEffect(() => {
        const branchId = sessionStorage.getItem('ma_target_branch_id');
        if (branchId) {
            setSelectedSchool(branchId);
            fetchSchoolDetails(branchId);
        }
    }, []);

    const fetchSchoolDetails = async (id) => {
        try {
            const { data, error } = await supabase
                .from('schools')
                .select('name')
                .eq('id', id)
                .single();
            
            if (data) {
                setSchoolName(data.name);
            }
        } catch (error) {
            console.error('Error fetching school details:', error);
        }
    };

    return (
        <DashboardLayout>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold">School Login Page Customizer</h1>
                    {schoolName && (
                        <p className="text-slate-500 mt-1">
                            Configuring for: <span className="font-semibold text-blue-600">{schoolName}</span>
                        </p>
                    )}
                </div>
            </div>
            
            {selectedSchool ? (
                <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
                    <SchoolLoginSettingsTab branchId={selectedSchool} />
                </div>
            ) : (
                <Card>
                    <CardContent className="py-12 text-center text-muted-foreground flex flex-col items-center gap-4">
                        <p>Please select a school to configure its login page.</p>
                        <Button onClick={() => navigate('/master-admin/front-cms')}>
                            Select School
                        </Button>
                    </CardContent>
                </Card>
            )}
        </DashboardLayout>
    );
};

export default MasterSchoolLoginSettings;
