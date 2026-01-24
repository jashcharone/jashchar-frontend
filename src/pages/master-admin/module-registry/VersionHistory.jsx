/**
 * VERSION HISTORY PAGE
 * View and rollback module versions
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  History,
  Clock,
  RotateCcw,
  Eye,
  Loader2,
  RefreshCw,
  Calendar,
  User,
  FileCode,
  ChevronDown,
  ChevronRight,
  CheckCircle,
  AlertCircle,
  Code
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import moduleRegistryApiService from '@/services/moduleRegistryApiService';
import DashboardLayout from '@/components/DashboardLayout';

const VersionHistory = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [versions, setVersions] = useState([]);
  const [expandedVersion, setExpandedVersion] = useState(null);
  const [rollingBack, setRollingBack] = useState(null);
  const [creatingSnapshot, setCreatingSnapshot] = useState(false);

  useEffect(() => {
    loadVersions();
  }, []);

  const loadVersions = async () => {
    try {
      setLoading(true);
      const res = await moduleRegistryApiService.getVersionHistory();
      setVersions(res.data || []);
    } catch (error) {
      console.error('Error loading versions:', error);
      toast({ title: 'Failed to load Versions', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSnapshot = async () => {
    const summary = prompt('Enter a name for this snapshot:');
    if (!summary) return;

    try {
      setCreatingSnapshot(true);
      await moduleRegistryApiService.createSnapshot(summary);
      toast({ title: 'Snapshot saved successfully!' });
      loadVersions();
    } catch (error) {
      toast({ title: 'Failed to save snapshot', variant: 'destructive' });
    } finally {
      setCreatingSnapshot(false);
    }
  };

  const handleRollback = async (versionId, versionNumber) => {
    if (!confirm(`Rollback to Version ${versionNumber}?\n\nThis will revert all modules to that version.`)) {
      return;
    }

    try {
      setRollingBack(versionId);
      await moduleRegistryApiService.rollbackToVersion(versionId);
      toast({ title: `Rolled back to Version ${versionNumber} successfully!` });
      loadVersions();
    } catch (error) {
      toast({ title: 'Rollback failed', variant: 'destructive' });
    } finally {
      setRollingBack(null);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[70vh]">
          <Loader2 className="w-12 h-12 animate-spin text-indigo-600 dark:text-indigo-400 mb-4" />
          <p className="text-gray-500 animate-pulse font-medium">Fetching Timeline...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
    <div className="min-h-screen bg-slate-50/50 dark:bg-black/20 p-6 md:p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <button
               onClick={() => navigate('/master-admin/module-registry')}
               className="flex items-center gap-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white mb-2 transition-colors"
            >
               <ArrowLeft className="w-4 h-4" />
               <span>Back to Registry</span>
            </button>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <History className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
              Version Timeline
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1 max-w-2xl">
              Track global state changes, module definitions, and revert mishaps.
            </p>
          </div>
          
          <button
            onClick={handleCreateSnapshot}
            disabled={creatingSnapshot}
            className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-500/20 hover:bg-indigo-700 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2 font-medium disabled:opacity-70 disabled:hover:scale-100"
          >
            {creatingSnapshot ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <FileCode className="w-5 h-5" />
            )}
            New Snapshot
          </button>
        </div>

        {/* Warning Box */}
        <div className="bg-amber-50/80 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/30 rounded-xl p-5 backdrop-blur-sm">
           <div className="flex gap-4">
              <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg h-fit text-amber-600 dark:text-amber-500">
                 <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                 <h3 className="font-semibold text-amber-900 dark:text-amber-200">Production Impact Warning</h3>
                 <p className="text-amber-800 dark:text-amber-400 mt-1 text-sm leading-relaxed">
                    Rolling back to a previous version will revert <strong>ALL module definitions</strong> to that point in time. 
                    This is a destructive action for any changes made after the selected version.
                    You will need to re-sync plans and schools after a rollback.
                 </p>
              </div>
           </div>
        </div>

        {/* Version Timeline */}
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800">
          <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50 flex justify-between items-center rounded-t-xl">
             <div className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-300">
                <Clock className="w-4 h-4" />
                <span>Timeline Activity</span>
             </div>
             <div className="text-xs bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded text-gray-600 dark:text-gray-300">
                {versions.length} Checkpoints
             </div>
          </div>

          <div className="p-6 md:p-8">
             {versions.length === 0 ? (
                <div className="py-16 text-center">
                   <div className="bg-gray-100 dark:bg-gray-800 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                      <History className="w-8 h-8 text-gray-400" />
                   </div>
                   <h3 className="text-lg font-medium text-gray-900 dark:text-white">No history record</h3>
                   <p className="text-gray-500 dark:text-gray-400 mt-1">Start by creating a manual snapshot or editing a module.</p>
                </div>
             ) : (
                <div className="relative pl-8 space-y-8">
                   {/* Vertical Line */}
                   <div className="absolute left-3 top-2 bottom-2 w-0.5 bg-gray-200 dark:bg-gray-800"></div>

                   {versions.map((version, index) => (
                      <div key={version.id} className="relative group">
                         {/* Dot */}
                         <div className={`absolute -left-[29px] top-1.5 w-6 h-6 rounded-full border-4 flex items-center justify-center bg-white dark:bg-gray-900 z-10 
                            ${index === 0 ? 'border-indigo-500 shadow-[0_0_0_4px_rgba(99,102,241,0.2)]' : 'border-gray-300 dark:border-gray-600'}`}>
                            {index === 0 && <div className="w-2 h-2 rounded-full bg-indigo-600"></div>}
                         </div>

                         <div className="bg-white dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700/50 p-5 hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors shadow-sm">
                            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                               <div>
                                  <div className="flex items-center gap-3">
                                     <span className="text-lg font-bold text-gray-900 dark:text-white">
                                        Version {version.version_number}
                                     </span>
                                     {index === 0 && (
                                        <span className="px-2 py-0.5 text-xs font-semibold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-full border border-green-200 dark:border-green-800">
                                           Current
                                        </span>
                                     )}
                                     {version.is_system_snapshot && (
                                        <span className="px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 rounded-full border border-gray-200 dark:border-gray-700">
                                           Auto-Generated
                                        </span>
                                     )}
                                  </div>
                                  
                                  <p className="text-gray-600 dark:text-gray-300 mt-1 font-medium">
                                     {version.summary || 'No description provided'}
                                  </p>
                                  
                                  <div className="flex items-center gap-4 mt-3 text-xs text-gray-500 dark:text-gray-400">
                                     <div className="flex items-center gap-1.5">
                                        <Calendar className="w-3.5 h-3.5" />
                                        {formatDate(version.created_at)}
                                     </div>
                                     <div className="flex items-center gap-1.5">
                                        <User className="w-3.5 h-3.5" />
                                        {version.created_by_name || 'System User'}
                                     </div>
                                     <div className="flex items-center gap-1.5">
                                        <Code className="w-3.5 h-3.5" />
                                        {version.module_count || 0} Modules
                                     </div>
                                  </div>
                               </div>

                               <div className="flex items-center gap-2">
                                  <button
                                     onClick={() => setExpandedVersion(expandedVersion === version.id ? null : version.id)}
                                     className="px-3 py-1.5 text-sm bg-gray-50 text-gray-600 rounded-lg border border-gray-200 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700 dark:hover:bg-gray-700 transition-colors"
                                  >
                                     {expandedVersion === version.id ? 'Hide Data' : 'View Data'}
                                  </button>
                                  
                                  {index !== 0 && (
                                     <button
                                        onClick={() => handleRollback(version.id, version.version_number)}
                                        disabled={rollingBack}
                                        className="px-3 py-1.5 text-sm bg-red-50 text-red-600 rounded-lg border border-red-200 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:border-red-900/30 dark:hover:bg-red-900/30 transition-colors flex items-center gap-1.5"
                                     >
                                        {rollingBack === version.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5" />}
                                        Rollback
                                     </button>
                                  )}
                               </div>
                            </div>

                            {/* Expanded Data View */}
                            {expandedVersion === version.id && (
                               <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700/50">
                                  <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Snapshot Data</h4>
                                  <div className="bg-slate-900 rounded-lg p-4 overflow-x-auto">
                                     <pre className="text-xs text-blue-300 font-mono">
                                        {JSON.stringify(version.usage_stats || version.snapshot_data || {}, null, 2)}
                                     </pre>
                                  </div>
                               </div>
                            )}
                         </div>
                      </div>
                   ))}
                </div>
             )}
          </div>
        </div>
      </div>
    </div>
    </DashboardLayout>
  );
};

export default VersionHistory;
