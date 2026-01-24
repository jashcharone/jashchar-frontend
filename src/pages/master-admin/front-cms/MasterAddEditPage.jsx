import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import AddEditPage from '@/pages/super-admin/front-cms/AddEditPage';

// Wrapper to ensure masterAdminMode is respected if not auto-detected
const MasterAddEditPage = (props) => {
    return <AddEditPage {...props} />;
};

export default MasterAddEditPage;
