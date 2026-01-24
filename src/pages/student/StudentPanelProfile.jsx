import React from 'react';
import StudentProfile from '@/pages/super-admin/student-information/StudentProfile';

const StudentPanelProfile = () => {
    // This component is a simple wrapper that reuses StudentProfile.
    // The StudentProfile component now contains logic to differentiate
    // between a school owner viewing a profile and a student viewing their own.
    return <StudentProfile />;
};

export default StudentPanelProfile;
