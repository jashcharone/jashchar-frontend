import React from 'react';
import { errorLoggerService } from '@/services/errorLoggerService';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, Bug, ChevronDown, ChevronUp, Copy, Check } from 'lucide-react';

class GlobalErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      errorId: null,
      errorMessage: '',
      errorStack: '',
      showDetails: false,
      copied: false
    };
  }

  static getDerivedStateFromError(error) {
    return { 
      hasError: true,
      errorMessage: error?.message || 'Unknown error',
      errorStack: error?.stack || ''
    };
  }

  componentDidCatch(error, errorInfo) {
    // Generate unique error ID
    const errorId = `ERR-${Date.now().toString(36).toUpperCase()}`;
    this.setState({ errorId });

    // Log the error to Queries Finder
    errorLoggerService.logError(error, errorInfo, {
      type: 'UI_CRASH',
      dashboard: this.getDashboardFromURL(),
      module: this.getModuleFromURL(),
      errorId: errorId
    });
  }

  getDashboardFromURL = () => {
    const path = window.location.pathname;
    if (path.includes('/master-admin')) return 'master_admin';
    if (path.includes('/school')) return 'school_admin';
    if (path.includes('/staff')) return 'staff';
    if (path.includes('/student')) return 'student';
    if (path.includes('/parent')) return 'parent';
    return 'public';
  };

  getModuleFromURL = () => {
    const path = window.location.pathname;
    const parts = path.split('/').filter(Boolean);
    return parts.length >= 2 ? parts.slice(1).join('/') : 'root';
  };

  handleReload = () => {
    window.location.reload();
  };

  handleReportIssue = () => {
    // Build query params to pass error info to Queries Finder
    const params = new URLSearchParams({
      errorId: this.state.errorId || '',
      from: 'error-boundary',
      page: window.location.pathname
    });
    window.location.href = `/master-admin/queries-finder?${params.toString()}`;
  };

  handleCopyError = () => {
    const errorDetails = `Error ID: ${this.state.errorId}\nPage: ${window.location.href}\nMessage: ${this.state.errorMessage}\n\nStack Trace:\n${this.state.errorStack}`;
    navigator.clipboard.writeText(errorDetails);
    this.setState({ copied: true });
    setTimeout(() => this.setState({ copied: false }), 2000);
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4">
          <div className="max-w-lg w-full bg-gray-800/90 backdrop-blur-sm rounded-2xl shadow-2xl border border-gray-700 overflow-hidden">
            {/* Header with gradient */}
            <div className="bg-gradient-to-r from-red-600 to-orange-600 p-6 text-center">
              <div className="mx-auto bg-white/20 w-16 h-16 rounded-full flex items-center justify-center mb-4 animate-pulse">
                <AlertTriangle className="h-8 w-8 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-white">
                Something went wrong
              </h1>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              <p className="text-gray-300 text-center">
                We've automatically logged this issue. Click <b className="text-cyan-400">Report Issue</b> to view details and help us fix it faster.
              </p>

              {/* Error ID Badge */}
              <div className="flex justify-center">
                <div className="bg-gray-900/50 border border-gray-600 rounded-lg px-4 py-2 flex items-center gap-2">
                  <span className="text-gray-400 text-sm">Error ID:</span>
                  <span className="font-mono font-bold text-cyan-400">{this.state.errorId || 'LOGGING...'}</span>
                  <button 
                    onClick={this.handleCopyError}
                    className="ml-2 text-gray-400 hover:text-white transition-colors"
                    title="Copy error details"
                  >
                    {this.state.copied ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Expandable Error Details */}
              <div className="border border-gray-700 rounded-lg overflow-hidden">
                <button
                  onClick={() => this.setState({ showDetails: !this.state.showDetails })}
                  className="w-full flex items-center justify-between p-3 bg-gray-900/50 hover:bg-gray-900/70 transition-colors text-gray-300"
                >
                  <span className="text-sm font-medium">Technical Details</span>
                  {this.state.showDetails ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>
                {this.state.showDetails && (
                  <div className="p-3 bg-gray-900/30 text-xs font-mono text-red-400 max-h-40 overflow-auto">
                    <div className="mb-2 text-gray-400">Page: {window.location.pathname}</div>
                    <div className="mb-2 text-orange-400">{this.state.errorMessage}</div>
                    <pre className="whitespace-pre-wrap break-all text-gray-500">
                      {this.state.errorStack?.split('\n').slice(0, 8).join('\n')}
                    </pre>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-3 pt-2">
                <Button 
                  onClick={this.handleReportIssue} 
                  className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold"
                >
                  <Bug className="mr-2 h-4 w-4" />
                  Report Issue to Admin
                </Button>
                <div className="grid grid-cols-2 gap-3">
                  <Button onClick={this.handleReload} variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-700">
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Reload
                  </Button>
                  <Button variant="outline" onClick={() => window.history.back()} className="border-gray-600 text-gray-300 hover:bg-gray-700">
                    Go Back
                  </Button>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-gray-700 p-3 text-center">
              <p className="text-xs text-gray-500">
                This error has been automatically sent to the engineering team.
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default GlobalErrorBoundary;

