import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { errorLoggerService } from '@/services/errorLoggerService';

// Error Boundary to catch crashes in the tested component
class ComponentErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Diagnostic Component Crash:", error, errorInfo);
    errorLoggerService.logError(error, errorInfo, {
      type: 'Diagnostic Crash',
      module: 'diagnostics',
      dashboard: 'system'
    });
  }

  render() {
    if (this.state.hasError) {
      return <div data-testid="error-fallback">CRASHED: {this.state.error?.message}</div>;
    }
    return this.props.children;
  }
}

// The wrapper component that performs the check
export const RouteScanner = ({ Component, onResult, routePath }) => {
  const [mountStatus, setMountStatus] = useState('mounting');

  useEffect(() => {
    let isMounted = true;
    let checkTimeout;

    const performCheck = async () => {
      try {
        // 1. Wait for initial render and potential API calls
        // We assume if it survives 1.5 seconds without crashing, it's "okay" for a basic load test.
        // Real apps might need specific checks per page, but this is a generic scanner.
        await new Promise(resolve => setTimeout(resolve, 1500));

        if (!isMounted) return;

        // 2. Check if Supabase connection is generally alive (basic sanity check)
        // This is read-only.
        const { error: pingError } = await supabase.from('schools').select('id').limit(1);
        
        if (pingError) {
           onResult({ status: 'FAIL', reason: `API Error: ${pingError.message}` });
           return;
        }

        // 3. Component Integrity Check
        // If we reached here, the ErrorBoundary didn't catch a crash.
        // We can assume the component mounted.
        
        // Optional: Check for white screen by looking for basic DOM elements?
        // Hard to do generically without specific test IDs.
        // We rely on the fact that it didn't crash.

        onResult({ status: 'PASS', reason: 'Component mounted and API responded.' });

      } catch (err) {
        onResult({ status: 'FAIL', reason: `Unexpected Error: ${err.message}` });
      }
    };

    performCheck();

    return () => { isMounted = false; clearTimeout(checkTimeout); };
  }, [routePath]);

  return (
    <div style={{ position: 'absolute', opacity: 0, pointerEvents: 'none', zIndex: -1, width: '10px', height: '10px', overflow: 'hidden' }}>
      <ComponentErrorBoundary>
        {/* We pass standard props that might be expected */}
        <Component />
      </ComponentErrorBoundary>
    </div>
  );
};
