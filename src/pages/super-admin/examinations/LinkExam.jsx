import React from 'react';
import DashboardLayout from '@/components/DashboardLayout';

const LinkExam = () => {
    return (
        <DashboardLayout>
            <div className="text-center p-8">
                <h1 className="text-2xl font-bold mb-4">Link Exam</h1>
                <p>This feature is a placeholder. You can request its implementation in your next prompt.</p>
                <p className="text-sm text-muted-foreground mt-2">Example: Link multiple exams together for cumulative result calculation.</p>
            </div>
        </DashboardLayout>
    );
};

export default LinkExam;
