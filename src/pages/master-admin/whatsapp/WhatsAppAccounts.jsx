import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Loader2, Plus, Trash2, Pencil, Eye, EyeOff, Key, CheckCircle, AlertCircle, Calendar, Building2 } from "lucide-react";
import api from '@/lib/api';
import { useToast } from "@/components/ui/use-toast";

// Date formatter helper
const formatDate = (dateString) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
};

const WhatsAppAccounts = ({ onAccountsChange }) => {
  const { toast } = useToast();
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);
  const [showToken, setShowToken] = useState(false);
  const [showAppSecret, setShowAppSecret] = useState(false);
  const [showAddToken, setShowAddToken] = useState(false);
  const [showAddSecret, setShowAddSecret] = useState(false);
  
  const [formData, setFormData] = useState({
    waba_id: '',
    name: '',
    app_id: '',
    app_secret: '',
    access_token: ''
  });

  const [errors, setErrors] = useState({});

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

  const validateForm = (isEdit = false) => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Account name is required';
    if (!formData.waba_id.trim()) newErrors.waba_id = 'WABA ID is required';
    if (!formData.app_id.trim()) newErrors.app_id = 'App ID is required';
    if (!isEdit) {
      if (!formData.app_secret.trim()) newErrors.app_secret = 'App Secret is required';
      if (!formData.access_token.trim()) newErrors.access_token = 'Access Token is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const resetForm = () => {
    setFormData({ waba_id: '', name: '', app_id: '', app_secret: '', access_token: '' });
    setErrors({});
    setShowAddToken(false);
    setShowAddSecret(false);
    setShowToken(false);
    setShowAppSecret(false);
  };

  const handleCreate = async () => {
    if (!validateForm()) return;
    setSaving(true);
    try {
      const res = await api.post('/whatsapp-manager/accounts', formData);
      if (res.data.success) {
        toast({ title: "✅ Success", description: "WABA Account added successfully" });
        setIsAddDialogOpen(false);
        fetchAccounts();
        resetForm();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to add account",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, name) => {
      if(!confirm(`Are you sure you want to delete "${name}"? This will delete the account and all associated data.`)) return;
      try {
          const res = await api.delete(`/whatsapp-manager/accounts/${id}`);
          if (res.data.success) {
              toast({ title: "✅ Deleted", description: `Account "${name}" deleted successfully` });
              fetchAccounts();
          }
      } catch (error) {
          toast({ title: "Error", description: "Failed to delete account", variant: "destructive" });
      }
  }

  const handleEdit = (account) => {
    setEditingAccount(account);
    setFormData({
      waba_id: account.waba_id || '',
      name: account.name || '',
      app_id: account.app_id || '',
      app_secret: '', // Don't show existing secret
      access_token: '' // Don't show existing token
    });
    setShowToken(false);
    setShowAppSecret(false);
    setIsEditDialogOpen(true);
  };

  const handleUpdate = async () => {
    if (!editingAccount) return;
    if (!validateForm(true)) return;
    setSaving(true);
    try {
      // Only send fields that have values
      const updateData = {};
      if (formData.name) updateData.name = formData.name;
      if (formData.waba_id) updateData.waba_id = formData.waba_id;
      if (formData.app_id) updateData.app_id = formData.app_id;
      if (formData.app_secret) updateData.app_secret = formData.app_secret;
      if (formData.access_token) updateData.access_token = formData.access_token;

      const res = await api.put(`/whatsapp-manager/accounts/${editingAccount.id}`, updateData);
      if (res.data.success) {
        toast({ 
          title: "✅ Success", 
          description: "Account updated successfully" 
        });
        setIsEditDialogOpen(false);
        setEditingAccount(null);
        fetchAccounts();
        resetForm();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to update account",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const closeEditDialog = () => {
    setIsEditDialogOpen(false);
    setEditingAccount(null);
    resetForm();
  };

  const closeAddDialog = () => {
    setIsAddDialogOpen(false);
    resetForm();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={isAddDialogOpen} onOpenChange={(open) => { if (!open) closeAddDialog(); else setIsAddDialogOpen(true); }}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" /> Add WABA Account</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-green-500" />
                Add WhatsApp Business Account
              </DialogTitle>
              <DialogDescription>Enter the credentials from Meta Business Manager.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Account Name *</Label>
                <Input 
                  value={formData.name} 
                  onChange={e => setFormData({...formData, name: e.target.value})} 
                  placeholder="e.g. Main School Account"
                  className={errors.name ? 'border-red-500' : ''}
                />
                {errors.name && <p className="text-xs text-red-500 flex items-center gap-1"><AlertCircle className="h-3 w-3" /> {errors.name}</p>}
              </div>
              <div className="grid gap-2">
                <Label>WABA ID *</Label>
                <Input 
                  value={formData.waba_id} 
                  onChange={e => setFormData({...formData, waba_id: e.target.value})} 
                  placeholder="e.g. 1601971690935598"
                  className={errors.waba_id ? 'border-red-500' : ''}
                />
                {errors.waba_id && <p className="text-xs text-red-500 flex items-center gap-1"><AlertCircle className="h-3 w-3" /> {errors.waba_id}</p>}
              </div>
              <div className="grid gap-2">
                <Label>App ID *</Label>
                <Input 
                  value={formData.app_id} 
                  onChange={e => setFormData({...formData, app_id: e.target.value})} 
                  placeholder="e.g. 839516729069584"
                  className={errors.app_id ? 'border-red-500' : ''}
                />
                {errors.app_id && <p className="text-xs text-red-500 flex items-center gap-1"><AlertCircle className="h-3 w-3" /> {errors.app_id}</p>}
              </div>
              <div className="grid gap-2">
                <Label>App Secret *</Label>
                <div className="relative">
                  <Input 
                    type={showAddSecret ? "text" : "password"} 
                    value={formData.app_secret} 
                    onChange={e => setFormData({...formData, app_secret: e.target.value})}
                    placeholder="Enter app secret from Meta"
                    className={errors.app_secret ? 'border-red-500 pr-10' : 'pr-10'}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                    onClick={() => setShowAddSecret(!showAddSecret)}
                  >
                    {showAddSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                {errors.app_secret && <p className="text-xs text-red-500 flex items-center gap-1"><AlertCircle className="h-3 w-3" /> {errors.app_secret}</p>}
              </div>
              <div className="grid gap-2">
                <Label className="flex items-center gap-2">
                  <Key className="h-4 w-4 text-yellow-500" />
                  System User Access Token *
                </Label>
                <div className="relative">
                  <Input 
                    type={showAddToken ? "text" : "password"} 
                    value={formData.access_token} 
                    onChange={e => setFormData({...formData, access_token: e.target.value})}
                    placeholder="Paste permanent token here"
                    className={errors.access_token ? 'border-red-500 pr-10' : 'pr-10'}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                    onClick={() => setShowAddToken(!showAddToken)}
                  >
                    {showAddToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                {errors.access_token && <p className="text-xs text-red-500 flex items-center gap-1"><AlertCircle className="h-3 w-3" /> {errors.access_token}</p>}
                {formData.access_token && !errors.access_token && (
                  <p className="text-xs text-green-500 flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" /> Token provided
                  </p>
                )}
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={closeAddDialog}>Cancel</Button>
              <Button onClick={handleCreate} disabled={saving} className="bg-green-600 hover:bg-green-700">
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                Add Account
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Connected Accounts</CardTitle>
          <CardDescription>List of all configured WhatsApp Business Accounts.</CardDescription>
        </CardHeader>
        <CardContent className="p-0 sm:p-6">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="whitespace-nowrap">Name</TableHead>
                  <TableHead className="whitespace-nowrap hidden sm:table-cell">WABA ID</TableHead>
                  <TableHead className="whitespace-nowrap hidden md:table-cell">App ID</TableHead>
                  <TableHead className="hidden lg:table-cell">
                    <span className="flex items-center gap-1 whitespace-nowrap">
                      <Calendar className="h-4 w-4" /> Created At
                    </span>
                  </TableHead>
                  <TableHead className="text-right whitespace-nowrap">Actions</TableHead>
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
                      <TableCell className="font-medium whitespace-nowrap">{acc.name}</TableCell>
                      <TableCell className="font-mono text-xs sm:text-sm hidden sm:table-cell">{acc.waba_id}</TableCell>
                      <TableCell className="font-mono text-xs sm:text-sm hidden md:table-cell">{acc.app_id}</TableCell>
                      <TableCell className="hidden lg:table-cell">{formatDate(acc.created_at)}</TableCell>
                      <TableCell className="text-right space-x-1">
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(acc)} title="Edit Account">
                            <Pencil className="h-4 w-4 text-blue-500" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(acc.id, acc.name)} title="Delete Account">
                            <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Edit Account Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={closeEditDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="h-5 w-5 text-blue-500" />
              Edit WhatsApp Business Account
            </DialogTitle>
            <DialogDescription>
              Update account details. Leave token/secret empty to keep existing values.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Account Name</Label>
              <Input 
                value={formData.name} 
                onChange={e => setFormData({...formData, name: e.target.value})} 
                placeholder="e.g. Main School Account" 
              />
            </div>
            <div className="grid gap-2">
              <Label>WABA ID</Label>
              <Input 
                value={formData.waba_id} 
                onChange={e => setFormData({...formData, waba_id: e.target.value})} 
                placeholder="Meta WABA ID" 
              />
            </div>
            <div className="grid gap-2">
              <Label>App ID</Label>
              <Input 
                value={formData.app_id} 
                onChange={e => setFormData({...formData, app_id: e.target.value})} 
              />
            </div>
            <div className="grid gap-2">
              <Label className="flex items-center gap-2">
                App Secret
                <span className="text-xs text-muted-foreground">(Leave empty to keep existing)</span>
              </Label>
              <div className="relative">
                <Input 
                  type={showAppSecret ? "text" : "password"}
                  value={formData.app_secret} 
                  onChange={e => setFormData({...formData, app_secret: e.target.value})} 
                  placeholder="Enter new app secret (optional)"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                  onClick={() => setShowAppSecret(!showAppSecret)}
                >
                  {showAppSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <div className="grid gap-2">
              <Label className="flex items-center gap-2">
                <Key className="h-4 w-4 text-yellow-500" />
                System User Access Token
                <span className="text-xs text-muted-foreground">(Leave empty to keep existing)</span>
              </Label>
              <div className="relative">
                <Input 
                  type={showToken ? "text" : "password"}
                  value={formData.access_token} 
                  onChange={e => setFormData({...formData, access_token: e.target.value})} 
                  placeholder="Paste new permanent token here (optional)"
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                  onClick={() => setShowToken(!showToken)}
                >
                  {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              {formData.access_token && (
                <p className="text-xs text-green-500 flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" /> New token will be saved
                </p>
              )}
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={closeEditDialog}>Cancel</Button>
            <Button onClick={handleUpdate} disabled={saving} className="bg-blue-600 hover:bg-blue-700">
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
              Update Account
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WhatsAppAccounts;
