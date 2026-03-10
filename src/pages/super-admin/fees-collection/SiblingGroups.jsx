import React, { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from '@/components/ui/alert-dialog';
import {
  Users2, Search, Loader2, RefreshCw, Plus, Edit, Trash2, Check, X,
  Phone, User, GraduationCap, IndianRupee, Percent, AlertCircle,
  CheckCircle2, Eye, Shield, Zap, UserPlus, Users
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ═══════════════════════════════════════════════════════════════════════════════
// SIBLING GROUPS MANAGEMENT
// Detect and manage sibling groups for automatic fee discounts
// ═══════════════════════════════════════════════════════════════════════════════

const formatCurrency = (amount) => {
  if (!amount && amount !== 0) return '₹0';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

// ─────────────────────────────────────────────────────────────────────────────────
// SIBLING GROUP CARD
// ─────────────────────────────────────────────────────────────────────────────────

const SiblingGroupCard = ({ group, onEdit, onVerify, onDelete }) => {
  return (
    <Card className={cn(
      "hover:shadow-lg transition-all duration-200",
      !group.verified && "border-amber-200 bg-amber-50/30"
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg">{group.family_name}</CardTitle>
              {group.verified ? (
                <Badge variant="default" className="bg-green-500">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Verified
                </Badge>
              ) : (
                <Badge variant="secondary" className="bg-amber-100 text-amber-700">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Pending
                </Badge>
              )}
            </div>
            <CardDescription className="flex items-center gap-2">
              <User className="h-3 w-3" />
              {group.parent_name}
              {group.contact_phone && (
                <>
                  <span className="text-muted-foreground">|</span>
                  <Phone className="h-3 w-3" />
                  {group.contact_phone}
                </>
              )}
            </CardDescription>
          </div>
          {group.auto_detected && (
            <Badge variant="outline" className="text-xs">
              <Zap className="h-3 w-3 mr-1" />
              Auto-detected
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="pb-4">
        <div className="flex gap-4 mb-4">
          <div className="flex-1 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-center">
            <Users className="h-5 w-5 text-blue-600 mx-auto mb-1" />
            <p className="text-xl font-bold text-blue-700">{group.total_siblings}</p>
            <p className="text-xs text-blue-600">Siblings</p>
          </div>
          <div className="flex-1 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg text-center">
            <Percent className="h-5 w-5 text-green-600 mx-auto mb-1" />
            <p className="text-xl font-bold text-green-700">{group.discount_percentage}%</p>
            <p className="text-xs text-green-600">Discount</p>
          </div>
        </div>
        
        {/* Student List */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">Students in Group:</p>
          <div className="max-h-32 overflow-y-auto space-y-1">
            {group.students?.map((student, idx) => (
              <div key={idx} className="flex items-center gap-2 text-sm p-2 bg-gray-50 rounded">
                <GraduationCap className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{student.full_name}</span>
                <span className="text-muted-foreground">({student.school_code})</span>
                {student.class_name && (
                  <Badge variant="outline" className="text-xs ml-auto">{student.class_name}</Badge>
                )}
              </div>
            )) || (
              <p className="text-sm text-muted-foreground italic">No student details loaded</p>
            )}
          </div>
        </div>
      </CardContent>
      <CardFooter className="pt-0 flex gap-2">
        {!group.verified && (
          <Button size="sm" variant="default" className="flex-1" onClick={() => onVerify(group)}>
            <Shield className="h-4 w-4 mr-2" />
            Verify
          </Button>
        )}
        <Button size="sm" variant="outline" className="flex-1" onClick={() => onEdit(group)}>
          <Edit className="h-4 w-4 mr-2" />
          Edit
        </Button>
        <Button size="sm" variant="ghost" className="text-red-500" onClick={() => onDelete(group)}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
};

// ─────────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────────

const SiblingGroups = () => {
  const { user, currentSessionId, organizationId } = useAuth();
  const { selectedBranch } = useBranch();
  const { toast } = useToast();
  
  const branchId = selectedBranch?.id || user?.profile?.branch_id || user?.user_metadata?.branch_id;

  const [loading, setLoading] = useState(true);
  const [detecting, setDetecting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [siblingGroups, setSiblingGroups] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterVerified, setFilterVerified] = useState('all');

  // Dialog states
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);

  // Stats
  const [stats, setStats] = useState({
    totalGroups: 0,
    verifiedGroups: 0,
    pendingGroups: 0,
    totalSiblings: 0,
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // FETCH DATA
  // ─────────────────────────────────────────────────────────────────────────────

  const fetchSiblingGroups = useCallback(async () => {
    if (!branchId) return;
    setLoading(true);
    
    try {
      const { data, error } = await supabase
        .from('sibling_groups')
        .select('*')
        .eq('branch_id', branchId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch student details for each group
      const groupsWithStudents = await Promise.all((data || []).map(async (group) => {
        if (group.student_ids && group.student_ids.length > 0) {
          const { data: students } = await supabase
            .from('student_profiles')
            .select('id, full_name, school_code, class_id, classes!student_profiles_class_id_fkey(name)')
            .in('id', group.student_ids);
          
          return {
            ...group,
            students: students?.map(s => ({
              ...s,
              class_name: s.classes?.name
            })) || []
          };
        }
        return { ...group, students: [] };
      }));

      setSiblingGroups(groupsWithStudents);
      
      // Calculate stats
      const verified = groupsWithStudents.filter(g => g.verified).length;
      const totalSiblings = groupsWithStudents.reduce((sum, g) => sum + (g.total_siblings || 0), 0);
      setStats({
        totalGroups: groupsWithStudents.length,
        verifiedGroups: verified,
        pendingGroups: groupsWithStudents.length - verified,
        totalSiblings,
      });
    } catch (error) {
      console.error('Fetch sibling groups error:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to load sibling groups' });
    }
    setLoading(false);
  }, [branchId, toast]);

  useEffect(() => {
    fetchSiblingGroups();
  }, [fetchSiblingGroups]);

  // ─────────────────────────────────────────────────────────────────────────────
  // AUTO-DETECT SIBLINGS
  // ─────────────────────────────────────────────────────────────────────────────

  const handleAutoDetect = async () => {
    if (!branchId) return;
    setDetecting(true);
    
    try {
      // Get all active students
      const { data: students, error: studError } = await supabase
        .from('student_profiles')
        .select('id, full_name, father_name, mother_name, father_phone, mother_phone, guardian_phone, school_code')
        .eq('branch_id', branchId)
        .eq('status', 'active');

      if (studError) throw studError;

      // Group by phone numbers
      const phoneGroups = {};
      students?.forEach(student => {
        const phones = [
          student.father_phone,
          student.mother_phone,
          student.guardian_phone
        ].filter(p => p && p.length >= 10);

        phones.forEach(phone => {
          const normalized = phone.replace(/\D/g, '').slice(-10);
          if (!phoneGroups[normalized]) {
            phoneGroups[normalized] = {
              phone: normalized,
              parentName: student.father_name || student.mother_name || 'Unknown',
              students: []
            };
          }
          if (!phoneGroups[normalized].students.find(s => s.id === student.id)) {
            phoneGroups[normalized].students.push(student);
          }
        });
      });

      // Filter to only groups with 2+ students
      const siblingCandidates = Object.values(phoneGroups).filter(g => g.students.length >= 2);

      let created = 0;
      for (const candidate of siblingCandidates) {
        // Check if group already exists
        const existingCheck = await supabase
          .from('sibling_groups')
          .select('id')
          .eq('branch_id', branchId)
          .eq('family_identifier', `PHONE_${candidate.phone}`)
          .maybeSingle();

        if (!existingCheck.data) {
          // Calculate discount
          let discount = 0;
          if (candidate.students.length >= 4) discount = 15;
          else if (candidate.students.length >= 3) discount = 10;
          else if (candidate.students.length >= 2) discount = 5;

          const { error: insertError } = await supabase
            .from('sibling_groups')
            .insert({
              family_identifier: `PHONE_${candidate.phone}`,
              family_name: `${candidate.parentName} Family`,
              parent_name: candidate.parentName,
              contact_phone: candidate.phone,
              student_ids: candidate.students.map(s => s.id),
              total_siblings: candidate.students.length,
              discount_percentage: discount,
              auto_detected: true,
              branch_id: branchId,
              organization_id: organizationId,
            });

          if (!insertError) created++;
        }
      }

      toast({
        title: 'Detection Complete',
        description: `Found ${siblingCandidates.length} sibling groups, created ${created} new groups`
      });
      fetchSiblingGroups();
    } catch (error) {
      console.error('Auto-detect error:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to detect siblings' });
    }
    setDetecting(false);
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // HANDLERS
  // ─────────────────────────────────────────────────────────────────────────────

  const handleVerify = async (group) => {
    try {
      const { error } = await supabase
        .from('sibling_groups')
        .update({
          verified: true,
          verified_by: user?.id,
          verified_at: new Date().toISOString(),
          sibling_discount_applied: group.discount_percentage > 0,
          updated_at: new Date().toISOString(),
        })
        .eq('id', group.id);

      if (error) throw error;
      toast({ title: 'Success', description: 'Sibling group verified' });
      fetchSiblingGroups();
    } catch (error) {
      console.error('Verify error:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to verify' });
    }
  };

  const handleEdit = (group) => {
    setSelectedGroup(group);
    setShowEditDialog(true);
  };

  const handleDelete = (group) => {
    setSelectedGroup(group);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!selectedGroup) return;
    
    try {
      const { error } = await supabase
        .from('sibling_groups')
        .delete()
        .eq('id', selectedGroup.id);

      if (error) throw error;
      toast({ title: 'Success', description: 'Sibling group deleted' });
      fetchSiblingGroups();
    } catch (error) {
      console.error('Delete error:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete' });
    }
    setShowDeleteDialog(false);
    setSelectedGroup(null);
  };

  const handleUpdateDiscount = async (groupId, discount) => {
    try {
      const { error } = await supabase
        .from('sibling_groups')
        .update({
          discount_percentage: discount,
          updated_at: new Date().toISOString(),
        })
        .eq('id', groupId);

      if (error) throw error;
      toast({ title: 'Success', description: 'Discount updated' });
      setShowEditDialog(false);
      fetchSiblingGroups();
    } catch (error) {
      console.error('Update error:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to update' });
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // FILTERED DATA
  // ─────────────────────────────────────────────────────────────────────────────

  const filteredGroups = siblingGroups.filter(g => {
    const matchesSearch = 
      g.family_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.parent_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.contact_phone?.includes(searchQuery);
    const matchesFilter = 
      filterVerified === 'all' ||
      (filterVerified === 'verified' && g.verified) ||
      (filterVerified === 'pending' && !g.verified);
    return matchesSearch && matchesFilter;
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-3 text-lg">Loading Sibling Groups...</span>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 p-6">
        {/* ═══════════════════════════════════════════════════════════════════════ */}
        {/* HEADER */}
        {/* ═══════════════════════════════════════════════════════════════════════ */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Users2 className="h-8 w-8 text-primary" />
              Sibling Groups
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage sibling discounts and family groupings
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={fetchSiblingGroups}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button variant="outline" onClick={handleAutoDetect} disabled={detecting}>
              {detecting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Zap className="h-4 w-4 mr-2" />
              )}
              Auto-Detect
            </Button>
            <Button onClick={() => setShowCreateDialog(true)}>
              <UserPlus className="h-4 w-4 mr-2" />
              Create Manual
            </Button>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════════ */}
        {/* STATS */}
        {/* ═══════════════════════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200">
            <CardContent className="p-4 text-center">
              <Users2 className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-blue-700">{stats.totalGroups}</p>
              <p className="text-sm text-blue-600">Total Groups</p>
            </CardContent>
          </Card>
          <Card className="bg-green-50 dark:bg-green-900/20 border-green-200">
            <CardContent className="p-4 text-center">
              <CheckCircle2 className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-green-700">{stats.verifiedGroups}</p>
              <p className="text-sm text-green-600">Verified</p>
            </CardContent>
          </Card>
          <Card className="bg-amber-50 dark:bg-amber-900/20 border-amber-200">
            <CardContent className="p-4 text-center">
              <AlertCircle className="h-8 w-8 text-amber-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-amber-700">{stats.pendingGroups}</p>
              <p className="text-sm text-amber-600">Pending Verification</p>
            </CardContent>
          </Card>
          <Card className="bg-purple-50 dark:bg-purple-900/20 border-purple-200">
            <CardContent className="p-4 text-center">
              <GraduationCap className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-purple-700">{stats.totalSiblings}</p>
              <p className="text-sm text-purple-600">Total Students</p>
            </CardContent>
          </Card>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════════ */}
        {/* FILTERS */}
        {/* ═══════════════════════════════════════════════════════════════════════ */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by family name, parent, or phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2">
                <Button 
                  variant={filterVerified === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterVerified('all')}
                >
                  All
                </Button>
                <Button 
                  variant={filterVerified === 'verified' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterVerified('verified')}
                >
                  Verified
                </Button>
                <Button 
                  variant={filterVerified === 'pending' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterVerified('pending')}
                >
                  Pending
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ═══════════════════════════════════════════════════════════════════════ */}
        {/* GROUPS GRID */}
        {/* ═══════════════════════════════════════════════════════════════════════ */}
        {filteredGroups.length === 0 ? (
          <Card className="p-12 text-center">
            <Users2 className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Sibling Groups Found</h3>
            <p className="text-muted-foreground mb-6">
              {searchQuery ? 'No groups match your search' : 'Click "Auto-Detect" to find siblings automatically'}
            </p>
            <Button onClick={handleAutoDetect} disabled={detecting}>
              <Zap className="h-4 w-4 mr-2" />
              Auto-Detect Siblings
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredGroups.map((group) => (
              <SiblingGroupCard
                key={group.id}
                group={group}
                onEdit={handleEdit}
                onVerify={handleVerify}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════════ */}
        {/* EDIT DIALOG */}
        {/* ═══════════════════════════════════════════════════════════════════════ */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Sibling Group</DialogTitle>
              <DialogDescription>
                Update discount percentage for {selectedGroup?.family_name}
              </DialogDescription>
            </DialogHeader>
            
            {selectedGroup && (
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Discount Percentage</Label>
                  <div className="flex gap-2">
                    {[0, 5, 10, 15, 20, 25].map(percent => (
                      <Button
                        key={percent}
                        variant={selectedGroup.discount_percentage === percent ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setSelectedGroup({ ...selectedGroup, discount_percentage: percent })}
                      >
                        {percent}%
                      </Button>
                    ))}
                  </div>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    {selectedGroup.total_siblings} siblings in this group will receive {selectedGroup.discount_percentage}% discount
                  </p>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                Cancel
              </Button>
              <Button onClick={() => handleUpdateDiscount(selectedGroup?.id, selectedGroup?.discount_percentage)}>
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ═══════════════════════════════════════════════════════════════════════ */}
        {/* DELETE CONFIRMATION */}
        {/* ═══════════════════════════════════════════════════════════════════════ */}
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Sibling Group?</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{selectedGroup?.family_name}"? 
                This will remove the sibling discount for all students in this group.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
};

export default SiblingGroups;
