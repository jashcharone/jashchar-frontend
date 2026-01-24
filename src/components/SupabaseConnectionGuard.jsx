import React, { useEffect, useState } from 'react';
import { isSupabaseReady } from '@/lib/supabaseClient';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

/**
 * A wrapper component that checks if Supabase is configured correctly.
 * If not, it displays a friendly error message instead of rendering the children.
 * Use this to wrap pages that require Supabase data.
 */
const SupabaseConnectionGuard = ({ children }) => {
    const [isReady, setIsReady] = useState(true);

    useEffect(() => {
        if (!isSupabaseReady()) {
            setIsReady(false);
        }
    }, []);

    if (!isReady) {
        return (
            <div className="p-6">
                <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Configuration Error</AlertTitle>
                    <AlertDescription>
                        The application is not connected to the database. 
                        Please check your <strong>VITE_SUPABASE_URL</strong> environment variable.
                    </AlertDescription>
                </Alert>
            </div>
        );
    }

    return <>{children}</>;
};

export default SupabaseConnectionGuard;
