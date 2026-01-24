import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Loader2, Save } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const LinkExamModal = ({ isOpen, onClose, group, branchId }) => {
    const { toast } = useToast();
    const [exams, setExams] = useState([]);
    const [links, setLinks] = useState({}); // { exam_id: { checked, weightage } }
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (isOpen && group) {
            fetchExamsAndLinks();
        }
    }, [isOpen, group]);

    const fetchExamsAndLinks = async () => {
        setLoading(true);
        // Fetch all exams in this group
        const { data: examList, error: examError } = await supabase
            .from('exams')
            .select('id, name')
            .eq('exam_group_id', group.id);

        if (examError) {
            toast({ variant: 'destructive', title: 'Error fetching exams', description: examError.message });
            setLoading(false);
            return;
        }

        // Fetch existing links for this group
        const { data: existingLinks, error: linkError } = await supabase
            .from('exam_links')
            .select('*')
            .eq('exam_group_id', group.id);

        if (linkError) {
            toast({ variant: 'destructive', title: 'Error fetching links', description: linkError.message });
        }

        setExams(examList || []);

        const linkMap = {};
        // Initialize with defaults
        examList.forEach(e => {
            linkMap[e.id] = { checked: false, weightage: '' };
        });
        
        // Apply existing
        if (existingLinks) {
            existingLinks.forEach(l => {
                linkMap[l.exam_id] = { checked: true, weightage: l.weightage };
            });
        }
        setLinks(linkMap);
        setLoading(false);
    };

    const handleCheckChange = (examId, checked) => {
        setLinks(prev => ({
            ...prev,
            [examId]: { ...prev[examId], checked }
        }));
    };

    const handleWeightageChange = (examId, value) => {
        setLinks(prev => ({
            ...prev,
            [examId]: { ...prev[examId], weightage: value }
        }));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            // First delete all for this group
            await supabase.from('exam_links').delete().eq('exam_group_id', group.id);

            const inserts = exams
                .filter(e => links[e.id]?.checked)
                .map(e => ({
                    exam_group_id: group.id,
                    exam_id: e.id,
                    weightage: links[e.id].weightage || 0
                }));

            if (inserts.length > 0) {
                const { error } = await supabase.from('exam_links').insert(inserts);
                if (error) throw error;
            }

            toast({ title: 'Exam links saved successfully' });
            onClose();
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error saving links', description: error.message });
        } finally {
            setSaving(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Link Exams: {group?.name}</DialogTitle>
                </DialogHeader>
                
                <div className="py-4">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[50px]">Link</TableHead>
                                <TableHead>Exam Name</TableHead>
                                <TableHead>Weightage (%)</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow><TableCell colSpan={3} className="text-center py-4"><Loader2 className="animate-spin mx-auto"/></TableCell></TableRow>
                            ) : exams.length === 0 ? (
                                <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground">No exams found in this group.</TableCell></TableRow>
                            ) : (
                                exams.map(exam => (
                                    <TableRow key={exam.id}>
                                        <TableCell>
                                            <Checkbox 
                                                checked={links[exam.id]?.checked || false} 
                                                onCheckedChange={(c) => handleCheckChange(exam.id, c)}
                                            />
                                        </TableCell>
                                        <TableCell>{exam.name}</TableCell>
                                        <TableCell>
                                            <Input 
                                                type="number" 
                                                disabled={!links[exam.id]?.checked}
                                                value={links[exam.id]?.weightage || ''}
                                                onChange={(e) => handleWeightageChange(exam.id, e.target.value)}
                                                placeholder="100"
                                                className="w-24"
                                            />
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => setLinks({})}>Reset Link Exam</Button>
                    <Button onClick={handleSave} disabled={saving}>
                        {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>} Save
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default LinkExamModal;
