import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import DashboardLayout from '@/components/DashboardLayout';
import { useToast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';

const BillingAudit = () => {
    const { toast } = useToast();
    const [audits, setAudits] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAudits = async () => {
            setLoading(true);
            
            // 1. Fetch Audits (Raw IDs)
            const { data: auditData, error: auditError } = await supabase
                .from('billing_audit')
                .select('id, created_at, action_type, description, branch_id, performed_by')
                .order('created_at', { ascending: false });
            
            if (auditError) {
                toast({ variant: 'destructive', title: 'Failed to fetch billing audit', description: auditError.message });
                setLoading(false);
                return;
            }

            // 2. Extract IDs
            const branchIds = [...new Set(auditData.map(a => a.branch_id).filter(Boolean))];
            const userIds = [...new Set(auditData.map(a => a.performed_by).filter(Boolean))];

            // 3. Fetch Related Data Manually (Fallback for missing FKs)
            let schoolsMap = {};
            let usersMap = {};

            if (branchIds.length > 0) {
                const { data: schools } = await supabase.from('schools').select('id, name').in('id', branchIds);
                schools?.forEach(s => schoolsMap[s.id] = s);
            }

            if (userIds.length > 0) {
                const { data: users } = await supabase.from('users').select('id, email').in('id', userIds);
                users?.forEach(u => usersMap[u.id] = u);
            }

            // 4. Map Data
            const enrichedAudits = auditData.map(audit => ({
                ...audit,
                school: schoolsMap[audit.branch_id] || { name: 'Unknown' },
                performer: usersMap[audit.performed_by] || { email: 'System' }
            }));

            setAudits(enrichedAudits);
            setLoading(false);
        };
        fetchAudits();
    }, [toast]);

    return (
        <DashboardLayout>
             <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Billing Audit Log</h1>
            </div>
             <div className="bg-card p-6 rounded-xl shadow-lg border">
                <h2 className="text-xl font-semibold mb-4">Audit Trail</h2>
                 {loading ? (
                    <div className="text-center py-10"><Loader2 className="mx-auto h-8 w-8 animate-spin" /></div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs uppercase bg-muted/50"><tr className="border-b">
                                <th className="px-6 py-3">Date</th>
                                <th className="px-6 py-3">School</th>
                                <th className="px-6 py-3">Action</th>
                                <th className="px-6 py-3">Description</th>
                                <th className="px-6 py-3">Performed By</th>
                            </tr></thead>
                            <tbody>
                                {audits.map((audit) => (
                                    <tr key={audit.id} className="bg-card border-b hover:bg-muted/50">
                                        <td className="px-6 py-4">{new Date(audit.created_at).toLocaleString()}</td>
                                        <td className="px-6 py-4">{audit.school?.name || 'N/A'}</td>
                                        <td className="px-6 py-4 font-medium">{audit.action_type}</td>
                                        <td className="px-6 py-4">{audit.description}</td>
                                        <td className="px-6 py-4">{audit.performer?.email || 'System'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
};
export default BillingAudit;
