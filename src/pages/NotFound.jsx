import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { errorLoggerService } from '@/services/errorLoggerService';
import { FileQuestion } from 'lucide-react';

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // Log 404 Error to Queries Finder
    errorLoggerService.logError(
      new Error(`Page Not Found: ${location.pathname}`),
      { componentStack: 'Router -> NotFound' },
      { 
        type: 'UI', 
        dashboard: 'unknown', 
        module: 'routing' 
      }
    );
  }, [location]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <div className="text-center max-w-md">
        <div className="bg-orange-100 dark:bg-orange-900/30 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
          <FileQuestion className="h-10 w-10 text-orange-600 dark:text-orange-400" />
        </div>
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">404</h1>
        <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-4">Page Not Found</h2>
        <p className="text-muted-foreground mb-8">
          The page you are looking for <code>{location.pathname}</code> does not exist or has been moved.
          <br/>
          <span className="text-xs text-red-500 mt-2 block">(This error has been logged automatically)</span>
        </p>
        <div className="flex gap-4 justify-center">
          <Button onClick={() => navigate(-1)} variant="outline">
            Go Back
          </Button>
          <Button onClick={() => navigate('/')}>
            Go Home
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
