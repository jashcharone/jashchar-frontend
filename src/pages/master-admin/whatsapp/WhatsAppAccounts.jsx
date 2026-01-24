import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Loader2, Plus, Trash2 } from "lucide-react";
import api from '@/lib/api';
import { useToast } from "@/components/ui/use-toast";

const WhatsAppAccounts = ({ onAccountsChange }) => {
  const { toast } = useToast();
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    waba_id: '',
    name: '',
    app_id: '',
    app_secret: '',
    access_token: ''
  });

  const fetchAccounts = async () => {
    setLoading(true);
    try {
      const res = await api.get('/whatsapp-manager/accounts');
      if (res.data.success) {
        setAccounts(res.data.data);
        if (onAccountsChange) onAccountsChange(res.data.data);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch WABA accounts",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const handleCreate = async () => {
    try {
      const res = await api.post('/whatsapp-manager/accounts', formData);
      if (res.data.success) {
        toast({ title: "Success", description: "Account added successfully" });
        setIsAddDialogOpen(false);
        fetchAccounts();
        setFormData({ waba_id: '', name: '', app_id: '', app_secret: '', access_token: '' });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to add account",
        variant: "destructive"
      });
    }
  };

  const handleDelete = async (id) => {
      if(!confirm("Are you sure? This will delete the account and all associated data.")) return;
      try {
          const res = await api.delete(`/whatsapp-manager/accounts/${id}`);
          if (res.data.success) {
              toast({ title: "Success", description: "Account deleted" });
              fetchAccounts();
          }
      } catch (error) {
          toast({ title: "Error", description: "Failed to delete", variant: "destructive" });
      }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" /> Add WABA Account</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add WhatsApp Business Account</DialogTitle>
              <DialogDescription>Enter the credentials from Meta Business Manager.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Account Name</Label>
                <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. Main School Account" />
              </div>
              <div className="grid gap-2">
                <Label>WABA ID</Label>
                <Input value={formData.waba_id} onChange={e => setFormData({...formData, waba_id: e.target.value})} placeholder="Meta WABA ID" />
              </div>
              <div className="grid gap-2">
                <Label>App ID</Label>
                <Input value={formData.app_id} onChange={e => setFormData({...formData, app_id: e.target.value})} />
              </div>
              <div className="grid gap-2">
                <Label>App Secret</Label>
                <Input type="password" value={formData.app_secret} onChange={e => setFormData({...formData, app_secret: e.target.value})} />
              </div>
              <div className="grid gap-2">
                <Label>System User Access Token</Label>
                <Input type="password" value={formData.access_token} onChange={e => setFormData({...formData, access_token: e.target.value})} />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleCreate}>Save Account</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Connected Accounts</CardTitle>
          <CardDescription>List of all configured WhatsApp Business Accounts.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>WABA ID</TableHead>
                <TableHead>App ID</TableHead>
                <TableHead>Created At</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                  </TableCell>
                </TableRow>
              ) : accounts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    No accounts found. Add one to get started.
                  </TableCell>
                </TableRow>
              ) : (
                accounts.map((acc) => (
                  <TableRow key={acc.id}>
                    <TableCell className="font-medium">{acc.name}</TableCell>
                    <TableCell>{acc.waba_id}</TableCell>
                    <TableCell>{acc.app_id}</TableCell>
                    <TableCell>{new Date(acc.created_at).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(acc.id)}>
                          <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
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

export default WhatsAppAccounts;
