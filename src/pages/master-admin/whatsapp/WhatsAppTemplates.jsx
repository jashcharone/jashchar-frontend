import React, { useState, useEffect, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, RefreshCw, Plus, Eye, Trash2, FileText, MessageSquare, Send, CheckCircle, Clock, XCircle, Search, Download } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import api from '@/lib/api';

// Template categories
const CATEGORIES = [
  { value: 'MARKETING', label: 'Marketing', color: 'bg-purple-500/20 text-purple-400' },
  { value: 'UTILITY', label: 'Utility', color: 'bg-blue-500/20 text-blue-400' },
  { value: 'AUTHENTICATION', label: 'Authentication', color: 'bg-orange-500/20 text-orange-400' }
];

// Languages
const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'en_US', name: 'English (US)' },
  { code: 'hi', name: 'Hindi' },
  { code: 'kn', name: 'Kannada' },
  { code: 'ta', name: 'Tamil' },
  { code: 'te', name: 'Telugu' },
  { code: 'mr', name: 'Marathi' }
];

const WhatsAppTemplates = ({ accounts = [] }) => {
  const { toast } = useToast();
  const [selectedAccount, setSelectedAccount] = useState('');
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  
  // Create Template Dialog
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  
  // Template Form
  const [templateForm, setTemplateForm] = useState({
    name: '',
    category: 'UTILITY',
    language: 'en',
    headerType: 'none',
    headerText: '',
    body: '',
    footer: ''
  });

  // Preview Dialog
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState(null);

  // Set default account
  useEffect(() => {
    if (accounts.length > 0 && !selectedAccount) {
      setSelectedAccount(accounts[0].id);
    }
  }, [accounts]);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/whatsapp-manager/accounts/${selectedAccount || 'all'}/templates`);
      if (res.data.success) {
        setTemplates(res.data.data || []);
      }
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to fetch templates.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, [selectedAccount]);

  // Filter templates
  const filteredTemplates = useMemo(() => {
    return templates.filter(t => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesName = t.template_name?.toLowerCase().includes(query);
        const matchesBody = t.body_content?.toLowerCase().includes(query);
        if (!matchesName && !matchesBody) return false;
      }
      if (statusFilter !== 'ALL' && t.approval_status !== statusFilter) return false;
      if (categoryFilter !== 'ALL' && t.category !== categoryFilter) return false;
      return true;
    });
  }, [templates, searchQuery, statusFilter, categoryFilter]);

  // Stats
  const stats = useMemo(() => {
    const approved = templates.filter(t => t.approval_status === 'APPROVED').length;
    const pending = templates.filter(t => t.approval_status === 'PENDING').length;
    const rejected = templates.filter(t => t.approval_status === 'REJECTED').length;
    return { total: templates.length, approved, pending, rejected };
  }, [templates]);

  const handleSync = async () => {
    if (!selectedAccount) return;
    setSyncing(true);
    try {
      const res = await api.post(`/whatsapp-manager/accounts/${selectedAccount}/templates/sync`);
      if (res.data.success) {
        toast({ title: "✅ Synced", description: `Synced ${res.data.count || 0} templates from Meta.` });
        fetchTemplates();
      }
    } catch (error) {
      toast({ title: "Error", description: "Sync failed", variant: "destructive" });
    } finally {
      setSyncing(false);
    }
  };

  const handleCreateTemplate = async () => {
    if (!templateForm.name || !templateForm.body) {
      toast({ title: "Error", description: "Name and Body are required", variant: "destructive" });
      return;
    }
    
    const nameRegex = /^[a-z][a-z0-9_]*$/;
    if (!nameRegex.test(templateForm.name)) {
      toast({ title: "Error", description: "Template name must be lowercase with underscores only", variant: "destructive" });
      return;
    }

    setCreating(true);
    try {
      const components = [];
      
      if (templateForm.headerType === 'text' && templateForm.headerText) {
        components.push({ type: 'HEADER', format: 'TEXT', text: templateForm.headerText });
      }
      
      const bodyComponent = { type: 'BODY', text: templateForm.body };
      const variableMatches = templateForm.body.match(/\{\{(\d+)\}\}/g);
      if (variableMatches) {
        const uniqueVars = [...new Set(variableMatches)];
        bodyComponent.example = { body_text: [uniqueVars.map((_, i) => `Sample ${i + 1}`)] };
      }
      components.push(bodyComponent);
      
      if (templateForm.footer) {
        components.push({ type: 'FOOTER', text: templateForm.footer });
      }

      const payload = {
        name: templateForm.name,
        category: templateForm.category,
        language: templateForm.language,
        components
      };

      const accountId = selectedAccount || accounts[0]?.id;
      const res = await api.post(`/whatsapp-manager/accounts/${accountId}/templates/create`, payload);
      
      if (res.data.success) {
        toast({ title: "Success! 🎉", description: "Template created successfully." });
        setIsCreateOpen(false);
        resetForm();
        fetchTemplates();
      }
    } catch (error) {
      console.error('Template creation error:', error);
      toast({ title: "Error", description: error.response?.data?.message || 'Failed to create template', variant: "destructive" });
    } finally {
      setCreating(false);
    }
  };

  const resetForm = () => {
    setTemplateForm({
      name: '',
      category: 'UTILITY',
      language: 'en',
      headerType: 'none',
      headerText: '',
      body: '',
      footer: ''
    });
  };

  const handleDeleteTemplate = async (templateId) => {
    if (!confirm('Are you sure you want to delete this template?')) return;
    try {
      await api.delete(`/whatsapp-manager/templates/${templateId}`);
      toast({ title: "Deleted", description: "Template removed." });
      fetchTemplates();
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete", variant: "destructive" });
    }
  };

  const handlePreview = (template) => {
    setPreviewTemplate(template);
    setIsPreviewOpen(true);
  };

  const getStatusIcon = (status) => {
    switch (status?.toUpperCase()) {
      case 'APPROVED': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'PENDING': return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'REJECTED': return <XCircle className="h-4 w-4 text-red-500" />;
      default: return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toUpperCase()) {
      case 'APPROVED': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'PENDING': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'REJECTED': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getCategoryColor = (category) => {
    const cat = CATEGORIES.find(c => c.value === category);
    return cat?.color || 'bg-gray-500/20 text-gray-400';
  };

  return (
    <div className="space-y-4">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Total Templates</p>
                <p className="text-2xl font-bold text-blue-400">{stats.total}</p>
              </div>
              <FileText className="h-8 w-8 text-blue-500/50" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20 cursor-pointer hover:border-green-500/40 transition-colors" onClick={() => setStatusFilter(statusFilter === 'APPROVED' ? 'ALL' : 'APPROVED')}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Approved</p>
                <p className="text-2xl font-bold text-green-400">{stats.approved}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500/50" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/5 border-yellow-500/20 cursor-pointer hover:border-yellow-500/40 transition-colors" onClick={() => setStatusFilter(statusFilter === 'PENDING' ? 'ALL' : 'PENDING')}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold text-yellow-400">{stats.pending}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-500/50" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-red-500/10 to-red-600/5 border-red-500/20 cursor-pointer hover:border-red-500/40 transition-colors" onClick={() => setStatusFilter(statusFilter === 'REJECTED' ? 'ALL' : 'REJECTED')}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Rejected</p>
                <p className="text-2xl font-bold text-red-400">{stats.rejected}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-500/50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters & Actions */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        {/* Search & Filters */}
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          <div className="relative flex-1 lg:flex-none lg:w-[300px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search templates..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          
          <select 
            className="h-10 px-3 rounded-md border border-input bg-background text-sm"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="ALL">All Status</option>
            <option value="APPROVED">✅ Approved</option>
            <option value="PENDING">⏳ Pending</option>
            <option value="REJECTED">❌ Rejected</option>
          </select>
          
          <select 
            className="h-10 px-3 rounded-md border border-input bg-background text-sm"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="ALL">All Categories</option>
            <option value="UTILITY">📦 Utility</option>
            <option value="MARKETING">📢 Marketing</option>
            <option value="AUTHENTICATION">🔐 Auth</option>
          </select>
        </div>
        
        {/* Actions */}
        <div className="flex gap-2 w-full lg:w-auto">
          <Button variant="outline" size="sm" onClick={fetchTemplates} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={handleSync} disabled={syncing || !selectedAccount}>
            {syncing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
            Sync Meta
          </Button>
          <Button size="sm" onClick={() => setIsCreateOpen(true)} className="bg-green-600 hover:bg-green-700">
            <Plus className="h-4 w-4 mr-2" />
            Create
          </Button>
        </div>
      </div>

      {/* Templates Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-[50px]">#</TableHead>
                  <TableHead className="min-w-[200px]">Template Name</TableHead>
                  <TableHead className="min-w-[300px]">Body Content</TableHead>
                  <TableHead className="w-[100px]">Category</TableHead>
                  <TableHead className="w-[80px]">Lang</TableHead>
                  <TableHead className="w-[100px]">Status</TableHead>
                  <TableHead className="w-[100px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-green-500" />
                      <p className="text-sm text-muted-foreground">Loading templates...</p>
                    </TableCell>
                  </TableRow>
                ) : filteredTemplates.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                      <FileText className="h-12 w-12 mx-auto mb-3 opacity-30" />
                      <p className="font-medium">No templates found</p>
                      <p className="text-xs mt-1">
                        {searchQuery || statusFilter !== 'ALL' || categoryFilter !== 'ALL' 
                          ? 'Try adjusting your filters' 
                          : 'Click "Create" to add your first template'}
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTemplates.map((t, idx) => (
                    <TableRow key={t.id} className="hover:bg-muted/30 transition-colors">
                      <TableCell className="text-muted-foreground text-xs">{idx + 1}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(t.approval_status)}
                          <div>
                            <p className="font-medium text-sm">{t.template_name}</p>
                            {t.template_slug && t.template_slug !== t.template_name && (
                              <p className="text-xs text-muted-foreground font-mono">{t.template_slug}</p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="text-xs text-muted-foreground line-clamp-2 max-w-[300px]">
                          {t.body_content || '—'}
                        </p>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={getCategoryColor(t.category)}>
                          {t.category || '—'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs uppercase">{t.language || 'en'}</span>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(t.approval_status)}>
                          {t.approval_status || 'LOCAL'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => handlePreview(t)} title="Preview">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteTemplate(t.id)} title="Delete" className="text-red-400 hover:text-red-300 hover:bg-red-500/10">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          
          {/* Footer */}
          {filteredTemplates.length > 0 && (
            <div className="px-4 py-3 border-t bg-muted/30 flex justify-between items-center text-xs text-muted-foreground">
              <span>Showing {filteredTemplates.length} of {templates.length} templates</span>
              <span>
                {statusFilter !== 'ALL' && <Badge variant="outline" className="mr-2">{statusFilter}</Badge>}
                {categoryFilter !== 'ALL' && <Badge variant="outline">{categoryFilter}</Badge>}
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Template Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-green-500" />
              Create WhatsApp Template
            </DialogTitle>
            <DialogDescription>
              Create a new template. Use {'{{1}}'}, {'{{2}}'} for dynamic variables.
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="h-[500px] pr-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
              {/* Left: Form */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs">Template Name *</Label>
                    <Input 
                      placeholder="e.g., fee_reminder"
                      value={templateForm.name}
                      onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_') })}
                      className="mt-1"
                    />
                    <p className="text-xs text-muted-foreground mt-1">lowercase_with_underscores</p>
                  </div>
                  <div>
                    <Label className="text-xs">Category *</Label>
                    <Select value={templateForm.category} onValueChange={(v) => setTemplateForm({ ...templateForm, category: v })}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map(c => (
                          <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label className="text-xs">Language</Label>
                  <Select value={templateForm.language} onValueChange={(v) => setTemplateForm({ ...templateForm, language: v })}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {LANGUAGES.map(l => (
                        <SelectItem key={l.code} value={l.code}>{l.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-xs">Header (Optional)</Label>
                  <Select value={templateForm.headerType} onValueChange={(v) => setTemplateForm({ ...templateForm, headerType: v })}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Header</SelectItem>
                      <SelectItem value="text">Text Header</SelectItem>
                    </SelectContent>
                  </Select>
                  {templateForm.headerType === 'text' && (
                    <Input 
                      placeholder="Header text"
                      maxLength={60}
                      value={templateForm.headerText}
                      onChange={(e) => setTemplateForm({ ...templateForm, headerText: e.target.value })}
                      className="mt-2"
                    />
                  )}
                </div>

                <div>
                  <Label className="text-xs">Message Body * (max 1024 chars)</Label>
                  <Textarea 
                    placeholder={`Hello {{1}},\n\nYour fee of ₹{{2}} is due on {{3}}.\n\nThank you!`}
                    rows={8}
                    maxLength={1024}
                    value={templateForm.body}
                    onChange={(e) => setTemplateForm({ ...templateForm, body: e.target.value })}
                    className="mt-1 font-mono text-sm"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {templateForm.body.length}/1024 characters
                  </p>
                </div>

                <div>
                  <Label className="text-xs">Footer (Optional)</Label>
                  <Input 
                    placeholder="Jashchar Institution"
                    maxLength={60}
                    value={templateForm.footer}
                    onChange={(e) => setTemplateForm({ ...templateForm, footer: e.target.value })}
                    className="mt-1"
                  />
                </div>
              </div>

              {/* Right: Preview */}
              <div>
                <Label className="text-xs mb-2 block">Live Preview</Label>
                <div className="bg-gradient-to-br from-green-900/20 to-green-800/10 rounded-lg p-4 border border-green-500/20">
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-[280px] mx-auto overflow-hidden">
                    {templateForm.headerType === 'text' && templateForm.headerText && (
                      <div className="bg-gray-100 dark:bg-gray-700 px-3 py-2 font-semibold text-sm border-b">
                        {templateForm.headerText}
                      </div>
                    )}
                    
                    <div className="px-3 py-3 text-sm whitespace-pre-wrap min-h-[100px]">
                      {templateForm.body || 'Your message will appear here...'}
                    </div>
                    
                    {templateForm.footer && (
                      <div className="px-3 pb-2 text-xs text-gray-500 border-t pt-2">
                        {templateForm.footer}
                      </div>
                    )}
                  </div>
                  
                  {templateForm.body && templateForm.body.match(/\{\{\d+\}\}/g) && (
                    <div className="mt-4 text-xs text-muted-foreground">
                      <p className="font-medium mb-1">Variables detected:</p>
                      <div className="flex flex-wrap gap-1">
                        {[...new Set(templateForm.body.match(/\{\{\d+\}\}/g))].map((v, i) => (
                          <Badge key={i} variant="outline" className="text-xs">{v}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </ScrollArea>

          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => { setIsCreateOpen(false); resetForm(); }}>
              Cancel
            </Button>
            <Button 
              onClick={handleCreateTemplate} 
              disabled={creating || !templateForm.name || !templateForm.body}
              className="bg-green-600 hover:bg-green-700"
            >
              {creating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Create Template
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-green-500" />
              Template Preview
            </DialogTitle>
          </DialogHeader>
          {previewTemplate && (
            <div className="space-y-4">
              {/* Info */}
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div>
                  <p className="font-medium">{previewTemplate.template_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {previewTemplate.category} • {previewTemplate.language?.toUpperCase() || 'EN'}
                  </p>
                </div>
                <Badge className={getStatusColor(previewTemplate.approval_status)}>
                  {previewTemplate.approval_status || 'LOCAL'}
                </Badge>
              </div>

              {/* WhatsApp Style Preview */}
              <div className="bg-[#0b141a] rounded-lg p-4">
                <div className="bg-[#1f2c34] rounded-lg p-3 max-w-[280px] ml-auto">
                  {previewTemplate.header_content && (
                    <div className="font-semibold text-white text-sm mb-2 border-b border-gray-600 pb-2">
                      {previewTemplate.header_content}
                    </div>
                  )}
                  
                  <div className="text-white text-sm whitespace-pre-wrap leading-relaxed">
                    {previewTemplate.body_content || 'No body content'}
                  </div>
                  
                  {previewTemplate.footer_content && (
                    <div className="text-gray-400 text-xs mt-2 pt-2 border-t border-gray-600">
                      {previewTemplate.footer_content}
                    </div>
                  )}
                  
                  <div className="text-right text-[10px] text-gray-500 mt-2">
                    {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} ✓✓
                  </div>
                </div>
              </div>

              {/* Variables */}
              {previewTemplate.body_content?.match(/\{\{\d+\}\}/g) && (
                <div className="p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
                  <p className="text-xs font-medium text-blue-400 mb-2">Variables in this template:</p>
                  <div className="flex flex-wrap gap-1">
                    {[...new Set(previewTemplate.body_content.match(/\{\{\d+\}\}/g))].map((v, i) => (
                      <Badge key={i} variant="outline" className="text-xs">{v} = Dynamic value {i + 1}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Meta Info */}
              {previewTemplate.whatsapp_template_id && (
                <div className="text-xs text-muted-foreground">
                  <span className="font-medium">Meta Template ID:</span> {previewTemplate.whatsapp_template_id}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WhatsAppTemplates;
