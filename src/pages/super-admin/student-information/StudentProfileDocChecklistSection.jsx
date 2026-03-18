import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useBranch } from '@/contexts/BranchContext';
import { getApiBaseUrl } from '@/utils/platform';
import {
  ClipboardCheck, CheckCircle2, XCircle, Shield, Loader2, AlertCircle
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

const _apiBase = getApiBaseUrl();
const BASE_URL = _apiBase ? `${_apiBase}/api` : '/api';

export default function StudentProfileDocChecklistSection({ studentId }) {
  const { selectedBranch } = useBranch();
  const [data, setData] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!studentId || !selectedBranch?.id) return;
    setLoading(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      const res = await fetch(`${BASE_URL}/document-checklist/student/${studentId}`, {
        headers: {
          'Authorization': `Bearer ${session?.session?.access_token}`,
          'x-branch-id': selectedBranch?.id,
        },
      });
      const json = await res.json();
      if (json.success) {
        setData(json.data || []);
        setStats(json.stats);
      }
    } catch (err) {
      console.error('Error fetching doc checklist:', err);
    } finally {
      setLoading(false);
    }
  }, [studentId, selectedBranch]);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin mr-2" /> Loading checklist...
      </div>
    );
  }

  if (data.length === 0) return null; // No checklist configured, show nothing

  return (
    <div className="mb-6 pb-6 border-b">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <ClipboardCheck className="h-5 w-5 text-primary" />
          <h4 className="font-semibold">Document Checklist Compliance</h4>
        </div>
        {stats && (
          <Badge variant={stats.completionPercent === 100 ? 'default' : 'destructive'}>
            {stats.completionPercent}% Complete
          </Badge>
        )}
      </div>
      {stats && (
        <div className="mb-4">
          <Progress value={stats.completionPercent} className="h-2" />
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>{stats.submittedRequired} of {stats.totalRequired} required docs submitted</span>
            <span>{stats.verified} verified</span>
          </div>
        </div>
      )}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {data.map(item => (
          <div
            key={item.id}
            className={`flex items-center gap-2 p-3 rounded-lg border text-sm transition-colors ${
              item.is_submitted
                ? item.is_verified
                  ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800'
                  : 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800'
                : item.is_required
                  ? 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800'
                  : 'bg-muted/30 border-border'
            }`}
          >
            {item.is_submitted ? (
              item.is_verified ? (
                <Shield className="h-4 w-4 text-emerald-600 shrink-0" />
              ) : (
                <CheckCircle2 className="h-4 w-4 text-blue-600 shrink-0" />
              )
            ) : item.is_required ? (
              <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
            ) : (
              <XCircle className="h-4 w-4 text-muted-foreground shrink-0" />
            )}
            <span className="font-medium truncate flex-1">{item.document_name}</span>
            {item.is_required && !item.is_submitted && (
              <Badge variant="destructive" className="text-[10px] px-1 py-0">Required</Badge>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
