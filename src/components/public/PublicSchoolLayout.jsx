import React from 'react';
import ModernSchoolHeader from './ModernSchoolHeader';
import MountCarmelFooter from './MountCarmelFooter';

const PublicSchoolLayout = ({ children, school, settings, alias }) => {
  return (
    <div className="min-h-screen flex flex-col bg-white font-sans">
      <ModernSchoolHeader school={school} settings={settings} alias={alias} />
      <main className="flex-grow">
        {children}
      </main>
      <MountCarmelFooter school={school} settings={settings} alias={alias} />
    </div>
  );
};

export default PublicSchoolLayout;
