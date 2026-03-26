import React, { useState, useEffect } from 'react';
import { formatDate } from '@/utils/dateUtils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Loader2, Link as LinkIcon, Trash2 } from "lucide-react";
import api from '@/lib/api';
import { useToast } from "@/components/ui/use-toast";

const WhatsAppAssignments = ({ accounts = [] }) => {
  const { toast } = useToast();
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  
  // Assign Form
  const [assignData, setAssignData] = useState({
    branch_id: '',
    template_id: '',
    branch_id: '' // Optional
  });

  // Helper lists
  const [schools, setSchools] = useState([]);
  const [templates, setTemplates] = useState([]);

  const fetchAssignments = async () => {
    setLoading(true);
    try {
      const res = await api.get('/whatsapp-manager/assignments');
      if (res.data.success) setAssignments(res.data.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchHelpers = async () => {
    // Fetch schools and templates for dropdowns
    try {
      // Fetch Schools (Assuming endpoint exists, otherwise need to find correct one)
      // Usually /schools or /admin/schools
      const schoolsRes = await api.get('/schools'); 
      if (schoolsRes.data.success) setSchools(schoolsRes.data.data);
      
      // Fetch all templates from all accounts
      // Ideally we filter by account first in UI, but for now fetch all
      let allTemplates = [];
      for (const acc of accounts) {
         try {
             const tplRes = await api.get(`/whatsapp-manager/accounts/${acc.id}/templates`);
             if (tplRes.data.success) {
                 allTemplates = [...allTemplates, ...tplRes.data.data];
             }
         } catch (e) {}
      }
      setTemplates(allTemplates);

    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    fetchAssignments();
  }, []);

  useEffect(() => {
      if(isAssignOpen) {
          fetchHelpers();
      }
  }, [isAssignOpen, accounts]);

  const handleAssign = async () => {
    try {
      const res = await api.post('/whatsapp-manager/assignments', assignData);
      if (res.data.success) {
        toast({ title: "Success", description: "Template assigned." });
        setIsAssignOpen(false);
        fetchAssignments();
      }
    } catch (error) {
      toast({ title: "Error", description: "Assignment failed", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={isAssignOpen} onOpenChange={setIsAssignOpen}>
          <DialogTrigger asChild>
            <Button><LinkIcon className="mr-2 h-4 w-4" /> Assign Template</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Assign Template to School</DialogTitle>
              <DialogDescription>Allow a school to use a specific WhatsApp template.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Select Template</Label>
                <select 
                  className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={assignData.template_id}
                  onChange={e => setAssignData({...assignData, template_id: e.target.value})}
                >
                  <option value="">Select Template</option>
                  {templates.map(t => <option key={t.id} value={t.id}>{t.name} ({t.language})</option>)}
                </select>
              </div>
              <div className="grid gap-2">
                <Label>Select School</Label>
                <select 
                  className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={assignData.branch_id}
                  onChange={e => setAssignData({...assignData, branch_id: e.target.value})}
                >
                  <option value="">Select School</option>
                  {schools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleAssign}>Assign</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Template</TableHead>
                <TableHead>School</TableHead>
                <TableHead>Assigned At</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                 <TableRow><TableCell colSpan={4} className="text-center py-8"><Loader2 className="animate-spin mx-auto" /></TableCell></TableRow>
              ) : assignments.length === 0 ? (
                 <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">No assignments found.</TableCell></TableRow>
              ) : (
                assignments.map(a => (
                  <TableRow key={a.id}>
                    <TableCell className="font-medium">
                      {a.whatsapp_templates?.name} <Badge variant="outline" className="ml-2">{a.whatsapp_templates?.language}</Badge>
                    </TableCell>
                    <TableCell>{a.schools?.name}</TableCell>
                    <TableCell>{formatDate(a.assigned_at)}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm"><Trash2 className="h-4 w-4 text-red-500" /></Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default WhatsAppAssignments;
