import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Zap, RefreshCw } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const GenerateTemplateRank = () => {
    const { templateId } = useParams();
    const { user } = useAuth();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [template, setTemplate] = useState(null);
    const [ranks, setRanks] = useState([]);

    const fetchTemplateAndRanks = useCallback(async () => {
        if (!templateId || !user) return;
        setLoading(true);
        try {
            const { data: templateData, error: templateError } = await supabase
                .from('cbse_marksheet_templates')
                .select('name')
                .eq('id', templateId)
                .single();

            if (templateError) throw templateError;
            setTemplate(templateData);

            const { data: ranksData, error: ranksError } = await supabase
                .from('cbse_template_ranks')
                .select('*, students:student_profiles(full_name, school_code)')
                .eq('template_id', templateId)
                .order('rank', { ascending: true });

            if (ranksError) throw ranksError;
            setRanks(ranksData || []);
        } catch (error) {
            toast({ title: 'Error fetching data', description: error.message, variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    }, [templateId, user, toast]);

    useEffect(() => {
        fetchTemplateAndRanks();
    }, [fetchTemplateAndRanks]);

    const handleGenerateRank = async () => {
        setGenerating(true);
        try {
            const { error } = await supabase.rpc('generate_template_wise_rank', { p_template_id: templateId });
            if (error) throw error;
            toast({ title: 'Success', description: 'Ranks have been generated successfully.' });
            fetchTemplateAndRanks();
        } catch (error) {
            toast({ title: 'Error generating ranks', description: error.message, variant: 'destructive' });
        } finally {
            setGenerating(false);
        }
    };

    return (
        <DashboardLayout>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Template Wise Rank</CardTitle>
                        <p className="text-sm text-muted-foreground">For template: {template?.name || 'Loading...'}</p>
                    </div>
                    <Button onClick={handleGenerateRank} disabled={generating}>
                        {generating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Zap className="mr-2 h-4 w-4" />}
                        {ranks.length > 0 ? 'Regenerate Ranks' : 'Generate Ranks'}
                    </Button>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex justify-center items-center h-64">
                            <Loader2 className="h-8 w-8 animate-spin" />
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Rank</TableHead>
                                    <TableHead>Admission No</TableHead>
                                    <TableHead>Student Name</TableHead>
                                    <TableHead>Grand Total</TableHead>
                                    <TableHead>Percentage</TableHead>
                                    <TableHead>Grade</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {ranks.length > 0 ? (
                                    ranks.map(rank => (
                                        <TableRow key={rank.id}>
                                            <TableCell className="font-bold">{rank.rank}</TableCell>
                                            <TableCell>{rank.students?.school_code}</TableCell>
                                            <TableCell>{rank.students?.full_name}</TableCell>
                                            <TableCell>{rank.grand_total}</TableCell>
                                            <TableCell>{rank.percentage}%</TableCell>
                                            <TableCell>{rank.grade}</TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center h-24">
                                            No ranks generated yet. Click "Generate Ranks" to start.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </DashboardLayout>
    );
};

export default GenerateTemplateRank;
