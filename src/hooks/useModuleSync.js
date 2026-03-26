import { useEffect, useState } from 'react';
import { moduleInitializationService } from '@/services/moduleInitializationService';

export const useModuleSync = () => {
    const [status, setStatus] = useState({ synced: false, loading: true });

    useEffect(() => {
        const run = async () => {
            await moduleInitializationService.initializeModuleSync();
            setStatus({ synced: true, loading: false });
        };
        run();
    }, []);

    return status;
};
