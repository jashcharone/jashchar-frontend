import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, RefreshCw } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import api from '@/lib/api';

const WhatsAppTemplates = ({ accounts = [] }) => {
  const { toast } = useToast();
  const [selectedAccount, setSelectedAccount] = useState('');
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);

  // Set default account
  useEffect(() => {
      if (accounts.length > 0 && !selectedAccount) {
          setSelectedAccount(accounts[0].id);
      }
  }, [accounts]);

  const fetchTemplates = async () => {
    if (!selectedAccount) return;
    setLoading(true);
    try {
      const res = await api.get(`/whatsapp-manager/accounts/${selectedAccount}/templates`);
      if (res.data.success) setTemplates(res.data.data);
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to fetch templates.' });
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    if (!selectedAccount) return;
    setSyncing(true);
    try {
      const res = await api.post(`/whatsapp-manager/accounts/${selectedAccount}/templates/sync`);
      if (res.data.success) {
        toast({ title: "Synced", description: `Synced ${res.data.count} templates.` });
        fetchTemplates();
      }
    } catch (error) {
      toast({ title: "Error", description: "Sync failed", variant: "destructive" });
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    if (selectedAccount) fetchTemplates();
  }, [selectedAccount]);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Label>Select Account:</Label>
          <select 
            className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 w-[200px]"
            value={selectedAccount}
            onChange={(e) => setSelectedAccount(e.target.value)}
          >
            {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
          </select>
        </div>
        <Button onClick={handleSync} disabled={syncing || !selectedAccount}>
          {syncing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
          Sync from Meta
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Template Name</TableHead>
                <TableHead>Language</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Updated</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                 <TableRow><TableCell colSpan={5} className="text-center py-8"><Loader2 className="animate-spin mx-auto" /></TableCell></TableRow>
              ) : templates.length === 0 ? (
                 <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No templates found. Try syncing.</TableCell></TableRow>
              ) : (
                templates.map(t => (
                  <TableRow key={t.id}>
                    <TableCell className="font-medium">{t.name}</TableCell>
                    <TableCell>{t.language}</TableCell>
                    <TableCell><Badge variant="outline">{t.category}</Badge></TableCell>
                    <TableCell>
                      <Badge variant={t.status === 'APPROVED' ? 'default' : 'secondary'}>{t.status}</Badge>
                    </TableCell>
                    <TableCell>{new Date(t.updated_at).toLocaleDateString()}</TableCell>
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

export default WhatsAppTemplates;
