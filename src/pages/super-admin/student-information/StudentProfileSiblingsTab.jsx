import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useBranch } from '@/contexts/BranchContext';
import { getApiBaseUrl } from '@/utils/platform';
import { useNavigate } from 'react-router-dom';
import {
  Users, Loader2, GraduationCap, User, Link2, ExternalLink
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const _apiBase = getApiBaseUrl();
const BASE_URL = _apiBase ? `${_apiBase}/api` : '/api';

export default function StudentProfileSiblingsTab({ studentId }) {
  const { selectedBranch } = useBranch();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchSiblings = useCallback(async () => {
    if (!studentId || !selectedBranch?.id) return;
    setLoading(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      const res = await fetch(`${BASE_URL}/student-family/${studentId}/siblings`, {
        headers: {
          'Authorization': `Bearer ${session?.session?.access_token}`,
          'x-branch-id': selectedBranch?.id,
        },
      });
      const json = await res.json();
      if (json.success) setData(json.data);
    } catch (err) {
      console.error('Error fetching siblings:', err);
    } finally {
      setLoading(false);
    }
  }, [studentId, selectedBranch]);

  useEffect(() => { fetchSiblings(); }, [fetchSiblings]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading family data...
      </div>
    );
  }

  if (!data || data.totalSiblings === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <User className="h-12 w-12 mx-auto mb-3 opacity-40" />
        <p className="font-medium">No Siblings Found</p>
        <p className="text-sm mt-1">No sibling records linked to this student</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Family Info Header */}
      {data.familyInfo && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-primary/5 border border-primary/10">
          <Link2 className="h-5 w-5 text-primary" />
          <div>
            <p className="font-semibold">{data.familyInfo.family_name || data.familyInfo.parent_name || 'Family Group'}</p>
            <p className="text-sm text-muted-foreground">
              {data.familyInfo.total_siblings || data.totalSiblings + 1} children in this family
              {data.familyInfo.sibling_discount_applied && (
                <Badge variant="outline" className="ml-2 text-xs text-emerald-600">
                  Sibling Discount: {data.familyInfo.discount_percentage}%
                </Badge>
              )}
            </p>
          </div>
        </div>
      )}

      {/* Family Tree Visual */}
      <div className="flex items-center justify-center py-4">
        <div className="flex items-center gap-6 flex-wrap justify-center">
          {/* Current Student */}
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-primary/20 border-3 border-primary flex items-center justify-center mb-2">
              <User className="h-7 w-7 text-primary" />
            </div>
            <Badge className="text-xs">{data.student.full_name}</Badge>
            <span className="text-xs text-muted-foreground">{data.student.class} {data.student.section}</span>
          </div>

          {/* Connection line */}
          {data.siblings.length > 0 && (
            <div className="hidden sm:flex items-center">
              <div className="w-8 h-0.5 bg-primary/30" />
              <Link2 className="h-4 w-4 text-primary/50 mx-1" />
              <div className="w-8 h-0.5 bg-primary/30" />
            </div>
          )}

          {/* Siblings */}
          {data.siblings.map(sib => (
            <div key={sib.id} className="flex flex-col items-center">
              <Avatar className="h-16 w-16 border-2 border-muted mb-2">
                <AvatarImage src={sib.photo_url} />
                <AvatarFallback className="text-lg bg-muted">
                  {(sib.full_name || '?')[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium text-center max-w-[100px] truncate">{sib.full_name}</span>
              <span className="text-xs text-muted-foreground">{sib.classes?.name} {sib.sections?.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Siblings List Cards */}
      <div className="space-y-3">
        {data.siblings.map(sib => (
          <Card key={sib.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4 flex items-center gap-4">
              <Avatar className="h-12 w-12 border">
                <AvatarImage src={sib.photo_url} />
                <AvatarFallback>{(sib.full_name || '?')[0].toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-semibold">{sib.full_name}</p>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <GraduationCap className="h-3.5 w-3.5" />
                  {sib.classes?.name} {sib.sections?.name && `(${sib.sections.name})`}
                  {sib.roll_number && <span>• Roll #{sib.roll_number}</span>}
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(`/super-admin/student-information/profile/${sib.id}`)}
              >
                <ExternalLink className="h-3.5 w-3.5 mr-1" /> View
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
