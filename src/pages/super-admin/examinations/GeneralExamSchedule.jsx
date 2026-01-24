import React from 'react';
import DashboardLayout from '@/components/DashboardLayout';

const GeneralExamSchedule = () => {
    return (
        <DashboardLayout>
            <div className="p-6 text-center">
                <h1 className="text-2xl font-bold text-gray-800 mb-2">General Exam Schedule</h1>
                <p className="text-gray-500">View and manage exam schedules for non-CBSE examinations.</p>
                <div className="mt-8 p-8 border-2 border-dashed rounded-lg bg-gray-50">
                    <p>Module placeholder. Implementation pending.</p>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default GeneralExamSchedule;
