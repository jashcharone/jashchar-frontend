import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, RefreshCw, Plus, Eye, Trash2, Copy, FileText, MessageSquare, Image, Video, FileCheck, Phone, ExternalLink, Send } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import api from '@/lib/api';

// Template categories
const CATEGORIES = [
  { value: 'MARKETING', label: 'Marketing', description: 'Promotions, offers, announcements' },
  { value: 'UTILITY', label: 'Utility', description: 'Order updates, reminders, alerts' },
  { value: 'AUTHENTICATION', label: 'Authentication', description: 'OTP, verification codes' }
];

// Languages
const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'en_US', name: 'English (US)' },
  { code: 'en_GB', name: 'English (UK)' },
  { code: 'hi', name: 'Hindi' },
  { code: 'kn', name: 'Kannada' },
  { code: 'ta', name: 'Tamil' },
  { code: 'te', name: 'Telugu' },
  { code: 'mr', name: 'Marathi' },
  { code: 'gu', name: 'Gujarati' },
  { code: 'bn', name: 'Bengali' }
];

// Pre-built template examples
const TEMPLATE_EXAMPLES = [
  {
    name: 'login_otp',
    category: 'UTILITY',
    header: 'Verification Code',
    body: 'Dear {{1}},\n\nYour Jashchar ERP verification code is: {{2}}\n\nThis code expires in 5 minutes. Never share this code with anyone.',
    footer: 'Jashchar ERP - Secure Login',
    variables: ['User Name', 'OTP Code']
  },
  {
    name: 'password_reset',
    category: 'UTILITY',
    header: 'Password Reset',
    body: 'Dear {{1}},\n\nWe received a password reset request for your account.\n\nYour OTP is: {{2}}\n\nIf you did not request this, please ignore this message.',
    footer: 'Jashchar ERP - Security',
    variables: ['User Name', 'OTP Code']
  },
  {
    name: 'fee_reminder',
    category: 'UTILITY',
    header: 'Fee Reminder',
    body: 'Dear {{1}},\n\nThis is a reminder that the fee of Rs.{{2}} for {{3}} is due on {{4}}.\n\nPlease pay on time to avoid late charges.\n\nThank you,\n{{5}}',
    footer: 'Jashchar Institution',
    variables: ['Parent Name', 'Amount', 'Term', 'Due Date', 'School Name']
  },
  {
    name: 'exam_result',
    category: 'UTILITY',
    header: 'Exam Result',
    body: 'Dear {{1}},\n\nExam results for {{2}} are now available.\n\nStudent: {{3}}\nClass: {{4}}\nPercentage: {{5}} percent\n\nView detailed report on our portal.',
    footer: 'Jashchar Institution',
    variables: ['Parent Name', 'Exam Name', 'Student Name', 'Class', 'Percentage']
  },
  {
    name: 'attendance_alert',
    category: 'UTILITY',
    header: 'Attendance Alert',
    body: 'Dear {{1}},\n\nYour child {{2}} was marked {{3}} today ({{4}}).\n\nIf this is incorrect, please contact the school office.',
    footer: 'Jashchar Institution',
    variables: ['Parent Name', 'Student Name', 'Status (Absent/Late)', 'Date']
  },
  {
    name: 'admission_confirm',
    category: 'UTILITY',
    header: 'Admission Confirmed',
    body: 'Dear {{1}},\n\nCongratulations! Admission for {{2}} to {{3}} has been confirmed.\n\nAdmission No: {{4}}\nAcademic Year: {{5}}\n\nWelcome to our institution!',
    footer: 'Jashchar Institution',
    variables: ['Parent Name', 'Student Name', 'Class', 'Admission No', 'Year']
  },
  {
    name: 'ptm_reminder',
    category: 'UTILITY',
    header: 'Parent Teacher Meeting',
    body: 'Dear {{1}},\n\nYou are invited to the Parent-Teacher Meeting.\n\nDate: {{2}}\nTime: {{3}}\nVenue: {{4}}\n\nPlease confirm your attendance.',
    footer: 'Jashchar Institution',
    variables: ['Parent Name', 'Date', 'Time', 'Venue']
  },
  {
    name: 'holiday_notice',
    category: 'MARKETING',
    header: 'Holiday Notice',
    body: 'Dear Parents,\n\nPlease note that the school will remain closed on {{1}} for {{2}}.\n\nClasses will resume on {{3}}.\n\nHappy Holidays!',
    footer: 'Jashchar Institution',
    variables: ['Date', 'Occasion', 'Resume Date']
  }
];

const WhatsAppTemplates = ({ accounts = [] }) => {
  const { toast } = useToast();
  const [selectedAccount, setSelectedAccount] = useState('');
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  
  // Create Template Dialog
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [activeTab, setActiveTab] = useState('custom');
  
  // Template Form
  const [templateForm, setTemplateForm] = useState({
    name: '',
    category: 'UTILITY',
    language: 'en',
    headerType: 'none', // none, text, image, video, document
    headerText: '',
    headerMediaUrl: '',
    body: '',
    footer: '',
    buttonType: 'none', // none, call, url, quick_reply
    buttons: []
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

  const handleCreateTemplate = async () => {
    if (!selectedAccount) {
      toast({ title: "Error", description: "Please select an account", variant: "destructive" });
      return;
    }
    if (!templateForm.name || !templateForm.body) {
      toast({ title: "Error", description: "Name and Body are required", variant: "destructive" });
      return;
    }
    
    // Validate name format (lowercase, underscore only)
    const nameRegex = /^[a-z][a-z0-9_]*$/;
    if (!nameRegex.test(templateForm.name)) {
      toast({ title: "Error", description: "Template name must be lowercase with underscores only (e.g., fee_reminder)", variant: "destructive" });
      return;
    }

    setCreating(true);
    try {
      // Build components array for Meta API
      const components = [];
      
      // Header component
      if (templateForm.headerType === 'text' && templateForm.headerText) {
        components.push({
          type: 'HEADER',
          format: 'TEXT',
          text: templateForm.headerText
        });
      } else if (['image', 'video', 'document'].includes(templateForm.headerType)) {
        components.push({
          type: 'HEADER',
          format: templateForm.headerType.toUpperCase(),
          example: { header_handle: [templateForm.headerMediaUrl || 'https://example.com/sample.jpg'] }
        });
      }
      
      // Body component (required)
      const bodyComponent = {
        type: 'BODY',
        text: templateForm.body
      };
      
      // Extract variables from body {{1}}, {{2}}, etc.
      const variableMatches = templateForm.body.match(/\{\{(\d+)\}\}/g);
      if (variableMatches) {
        const uniqueVars = [...new Set(variableMatches)];
        bodyComponent.example = {
          body_text: [uniqueVars.map((_, i) => `Sample ${i + 1}`)]
        };
      }
      components.push(bodyComponent);
      
      // Footer component
      if (templateForm.footer) {
        components.push({
          type: 'FOOTER',
          text: templateForm.footer
        });
      }
      
      // Buttons
      if (templateForm.buttonType !== 'none' && templateForm.buttons.length > 0) {
        const buttonComponent = {
          type: 'BUTTONS',
          buttons: templateForm.buttons.map(btn => {
            if (btn.type === 'PHONE_NUMBER') {
              return { type: 'PHONE_NUMBER', text: btn.text, phone_number: btn.value };
            } else if (btn.type === 'URL') {
              return { type: 'URL', text: btn.text, url: btn.value };
            } else {
              return { type: 'QUICK_REPLY', text: btn.text };
            }
          })
        };
        components.push(buttonComponent);
      }

      const payload = {
        name: templateForm.name,
        category: templateForm.category,
        language: templateForm.language,
        components
      };

      const res = await api.post(`/whatsapp-manager/accounts/${selectedAccount}/templates/create`, payload);
      
      if (res.data.success) {
        toast({ title: "Success! 🎉", description: "Template submitted to Meta for approval. It may take 1-24 hours." });
        setIsCreateOpen(false);
        resetForm();
        // Sync to get latest status
        setTimeout(() => handleSync(), 2000);
      }
    } catch (error) {
      console.error('Template creation error:', error);
      const errorMsg = error.response?.data?.message || error.response?.data?.error?.message || 'Failed to create template';
      toast({ title: "Error", description: errorMsg, variant: "destructive" });
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
      headerMediaUrl: '',
      body: '',
      footer: '',
      buttonType: 'none',
      buttons: []
    });
    setActiveTab('custom');
  };

  const useExample = (example) => {
    setTemplateForm({
      ...templateForm,
      name: example.name,
      category: example.category,
      headerType: 'text',
      headerText: example.header,
      body: example.body,
      footer: example.footer
    });
    setActiveTab('custom');
    toast({ title: "Template Loaded", description: "Customize and submit!" });
  };

  const addButton = () => {
    if (templateForm.buttons.length >= 3) {
      toast({ title: "Limit Reached", description: "Maximum 3 buttons allowed", variant: "destructive" });
      return;
    }
    setTemplateForm({
      ...templateForm,
      buttons: [...templateForm.buttons, { type: 'QUICK_REPLY', text: '', value: '' }]
    });
  };

  const updateButton = (index, field, value) => {
    const newButtons = [...templateForm.buttons];
    newButtons[index][field] = value;
    setTemplateForm({ ...templateForm, buttons: newButtons });
  };

  const removeButton = (index) => {
    setTemplateForm({
      ...templateForm,
      buttons: templateForm.buttons.filter((_, i) => i !== index)
    });
  };

  const handleDeleteTemplate = async (templateId) => {
    if (!confirm('Are you sure you want to delete this template?')) return;
    try {
      await api.delete(`/whatsapp-manager/templates/${templateId}`);
      toast({ title: "Deleted", description: "Template removed from local database." });
      fetchTemplates();
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete", variant: "destructive" });
    }
  };

  const handlePreview = (template) => {
    setPreviewTemplate(template);
    setIsPreviewOpen(true);
  };

  useEffect(() => {
    if (selectedAccount) fetchTemplates();
  }, [selectedAccount]);

  const getStatusColor = (status) => {
    switch (status?.toUpperCase()) {
      case 'APPROVED': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'PENDING': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'REJECTED': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  return (
    <div className="space-y-4">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <Label>Account:</Label>
          <select 
            className="flex h-10 items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring w-[200px]"
            value={selectedAccount}
            onChange={(e) => setSelectedAccount(e.target.value)}
          >
            {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
          </select>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleSync} disabled={syncing || !selectedAccount}>
            {syncing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
            Sync from Meta
          </Button>
          <Button onClick={() => setIsCreateOpen(true)} disabled={!selectedAccount} className="bg-green-600 hover:bg-green-700">
            <Plus className="mr-2 h-4 w-4" />
            Create Template
          </Button>
        </div>
      </div>

      {/* Info Card */}
      <Card className="bg-blue-500/10 border-blue-500/30">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <FileText className="h-5 w-5 text-blue-400 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-blue-400">About WhatsApp Templates</p>
              <p className="text-xs text-muted-foreground mt-1">
                Templates must be approved by Meta before use. Approval takes 1-24 hours. 
                Use variables like {'{{1}}'}, {'{{2}}'} for dynamic content.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Templates Table */}
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
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <Loader2 className="animate-spin mx-auto" />
                  </TableCell>
                </TableRow>
              ) : templates.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-2 opacity-30" />
                    <p>No templates found</p>
                    <p className="text-xs mt-1">Click "Create Template" to add one, or "Sync from Meta" to import existing templates.</p>
                  </TableCell>
                </TableRow>
              ) : (
                templates.map(t => (
                  <TableRow key={t.id}>
                    <TableCell className="font-medium">{t.template_name}</TableCell>
                    <TableCell>{t.language}</TableCell>
                    <TableCell><Badge variant="outline">{t.category}</Badge></TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(t.approval_status)}>{t.approval_status}</Badge>
                    </TableCell>
                    <TableCell>{new Date(t.updated_at).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handlePreview(t)} title="Preview">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteTemplate(t.id)} title="Delete" className="text-red-400 hover:text-red-300">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create Template Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-green-500" />
              Create WhatsApp Template
            </DialogTitle>
            <DialogDescription>
              Templates are sent to Meta for approval. Use variables like {'{{1}}'}, {'{{2}}'} for dynamic content.
            </DialogDescription>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="examples">📋 Pre-built Templates</TabsTrigger>
              <TabsTrigger value="custom">✏️ Custom Template</TabsTrigger>
            </TabsList>

            {/* Examples Tab */}
            <TabsContent value="examples" className="mt-4">
              <ScrollArea className="h-[400px] pr-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {TEMPLATE_EXAMPLES.map((ex, idx) => (
                    <Card key={idx} className="hover:border-green-500/50 cursor-pointer transition-colors" onClick={() => useExample(ex)}>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <FileCheck className="h-4 w-4 text-green-500" />
                          {ex.name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </CardTitle>
                        <CardDescription className="text-xs">{ex.category}</CardDescription>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <p className="text-xs text-muted-foreground line-clamp-3">{ex.body.substring(0, 100)}...</p>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {ex.variables.map((v, i) => (
                            <Badge key={i} variant="outline" className="text-xs">{`{{${i + 1}}} = ${v}`}</Badge>
                          ))}
                        </div>
                        <Button size="sm" className="mt-3 w-full" variant="outline">
                          <Copy className="h-3 w-3 mr-1" /> Use This Template
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>

            {/* Custom Template Tab */}
            <TabsContent value="custom" className="mt-4">
              <ScrollArea className="h-[400px] pr-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left: Form */}
                  <div className="space-y-4">
                    {/* Basic Info */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-xs">Template Name *</Label>
                        <Input 
                          placeholder="e.g., fee_reminder"
                          value={templateForm.name}
                          onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_') })}
                          className="mt-1"
                        />
                        <p className="text-xs text-muted-foreground mt-1">Lowercase with underscores</p>
                      </div>
                      <div>
                        <Label className="text-xs">Category *</Label>
                        <Select value={templateForm.category} onValueChange={(v) => setTemplateForm({ ...templateForm, category: v })}>
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {CATEGORIES.map(c => (
                              <SelectItem key={c.value} value={c.value}>
                                <span>{c.label}</span>
                              </SelectItem>
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

                    {/* Header */}
                    <div>
                      <Label className="text-xs">Header (Optional)</Label>
                      <Select value={templateForm.headerType} onValueChange={(v) => setTemplateForm({ ...templateForm, headerType: v })}>
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No Header</SelectItem>
                          <SelectItem value="text">Text</SelectItem>
                          <SelectItem value="image">Image</SelectItem>
                          <SelectItem value="video">Video</SelectItem>
                          <SelectItem value="document">Document</SelectItem>
                        </SelectContent>
                      </Select>
                      {templateForm.headerType === 'text' && (
                        <Input 
                          placeholder="Header text (max 60 chars)"
                          maxLength={60}
                          value={templateForm.headerText}
                          onChange={(e) => setTemplateForm({ ...templateForm, headerText: e.target.value })}
                          className="mt-2"
                        />
                      )}
                    </div>

                    {/* Body */}
                    <div>
                      <Label className="text-xs">Message Body * (max 1024 chars)</Label>
                      <Textarea 
                        placeholder="Hello {{1}},

Your fee of ₹{{2}} is due on {{3}}.

Thank you!"
                        rows={6}
                        maxLength={1024}
                        value={templateForm.body}
                        onChange={(e) => setTemplateForm({ ...templateForm, body: e.target.value })}
                        className="mt-1 font-mono text-sm"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        {templateForm.body.length}/1024 | Use {'{{1}}'}, {'{{2}}'}, etc. for variables
                      </p>
                    </div>

                    {/* Footer */}
                    <div>
                      <Label className="text-xs">Footer (Optional, max 60 chars)</Label>
                      <Input 
                        placeholder="Jashchar Institution"
                        maxLength={60}
                        value={templateForm.footer}
                        onChange={(e) => setTemplateForm({ ...templateForm, footer: e.target.value })}
                        className="mt-1"
                      />
                    </div>

                    {/* Buttons */}
                    <div>
                      <div className="flex justify-between items-center">
                        <Label className="text-xs">Buttons (Optional, max 3)</Label>
                        <Button type="button" variant="outline" size="sm" onClick={addButton}>
                          <Plus className="h-3 w-3 mr-1" /> Add Button
                        </Button>
                      </div>
                      {templateForm.buttons.map((btn, idx) => (
                        <div key={idx} className="flex gap-2 mt-2 items-center">
                          <Select value={btn.type} onValueChange={(v) => updateButton(idx, 'type', v)}>
                            <SelectTrigger className="w-[120px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="QUICK_REPLY">Quick Reply</SelectItem>
                              <SelectItem value="PHONE_NUMBER">Call</SelectItem>
                              <SelectItem value="URL">URL</SelectItem>
                            </SelectContent>
                          </Select>
                          <Input 
                            placeholder="Button text"
                            value={btn.text}
                            onChange={(e) => updateButton(idx, 'text', e.target.value)}
                            className="flex-1"
                          />
                          {btn.type !== 'QUICK_REPLY' && (
                            <Input 
                              placeholder={btn.type === 'PHONE_NUMBER' ? '+91...' : 'https://...'}
                              value={btn.value}
                              onChange={(e) => updateButton(idx, 'value', e.target.value)}
                              className="flex-1"
                            />
                          )}
                          <Button variant="ghost" size="icon" onClick={() => removeButton(idx)} className="text-red-400">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Right: Preview */}
                  <div>
                    <Label className="text-xs mb-2 block">Preview</Label>
                    <div className="bg-gradient-to-br from-green-900/20 to-green-800/10 rounded-lg p-4 border border-green-500/20">
                      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-[280px] mx-auto overflow-hidden">
                        {/* Header */}
                        {templateForm.headerType === 'text' && templateForm.headerText && (
                          <div className="bg-gray-100 dark:bg-gray-700 px-3 py-2 font-semibold text-sm">
                            {templateForm.headerText}
                          </div>
                        )}
                        {templateForm.headerType === 'image' && (
                          <div className="bg-gray-200 dark:bg-gray-600 h-32 flex items-center justify-center">
                            <Image className="h-8 w-8 text-gray-400" />
                          </div>
                        )}
                        {templateForm.headerType === 'video' && (
                          <div className="bg-gray-200 dark:bg-gray-600 h-32 flex items-center justify-center">
                            <Video className="h-8 w-8 text-gray-400" />
                          </div>
                        )}
                        
                        {/* Body */}
                        <div className="px-3 py-2 text-sm whitespace-pre-wrap">
                          {templateForm.body || 'Your message will appear here...'}
                        </div>
                        
                        {/* Footer */}
                        {templateForm.footer && (
                          <div className="px-3 pb-2 text-xs text-gray-500">
                            {templateForm.footer}
                          </div>
                        )}
                        
                        {/* Buttons */}
                        {templateForm.buttons.length > 0 && (
                          <div className="border-t divide-y">
                            {templateForm.buttons.map((btn, idx) => (
                              <div key={idx} className="px-3 py-2 text-center text-blue-500 text-sm flex items-center justify-center gap-1">
                                {btn.type === 'PHONE_NUMBER' && <Phone className="h-3 w-3" />}
                                {btn.type === 'URL' && <ExternalLink className="h-3 w-3" />}
                                {btn.text || `Button ${idx + 1}`}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      
                      {/* Variables Legend */}
                      {templateForm.body && templateForm.body.match(/\{\{\d+\}\}/g) && (
                        <div className="mt-4 text-xs text-muted-foreground">
                          <p className="font-medium mb-1">Variables:</p>
                          {[...new Set(templateForm.body.match(/\{\{\d+\}\}/g))].map((v, i) => (
                            <span key={i} className="inline-block mr-2">{v} = Dynamic value</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>

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
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Submit to Meta
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-green-500" />
              Template Preview
            </DialogTitle>
          </DialogHeader>
          {previewTemplate && (
            <div className="space-y-4">
              {/* Status & Info Row */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{previewTemplate.template_name}</p>
                  <p className="text-xs text-muted-foreground">{previewTemplate.category} • {previewTemplate.language}</p>
                </div>
                <Badge className={getStatusColor(previewTemplate.approval_status)}>{previewTemplate.approval_status}</Badge>
              </div>

              {/* WhatsApp Style Preview */}
              <div className="bg-[#0b141a] rounded-lg p-4">
                <div className="bg-[#1f2c34] rounded-lg p-3 max-w-[280px] ml-auto">
                  {/* Header */}
                  {previewTemplate.header_content && (
                    <div className="font-semibold text-white text-sm mb-2 border-b border-gray-600 pb-2">
                      {previewTemplate.header_content}
                    </div>
                  )}
                  
                  {/* Body */}
                  {previewTemplate.body_content && (
                    <div className="text-white text-sm whitespace-pre-wrap leading-relaxed">
                      {previewTemplate.body_content}
                    </div>
                  )}
                  
                  {/* Footer */}
                  {previewTemplate.footer_content && (
                    <div className="text-gray-400 text-xs mt-2 pt-2 border-t border-gray-600">
                      {previewTemplate.footer_content}
                    </div>
                  )}

                  {/* Buttons */}
                  {previewTemplate.buttons && previewTemplate.buttons.length > 0 && (
                    <div className="mt-3 pt-2 border-t border-gray-600 space-y-1">
                      {previewTemplate.buttons.map((btn, idx) => (
                        <div key={idx} className="text-center text-blue-400 text-sm py-1 hover:underline cursor-pointer">
                          {btn.type === 'URL' && <ExternalLink className="inline h-3 w-3 mr-1" />}
                          {btn.type === 'PHONE_NUMBER' && <Phone className="inline h-3 w-3 mr-1" />}
                          {btn.text}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Timestamp */}
                  <div className="text-right text-gray-500 text-[10px] mt-2">
                    {new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>

              {/* Variables Info */}
              {previewTemplate.components?.find(c => c.type === 'BODY')?.text?.includes('{{') && (
                <div className="bg-muted/50 rounded-lg p-3">
                  <Label className="text-xs text-muted-foreground">Variables Used</Label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {(previewTemplate.components.find(c => c.type === 'BODY')?.text?.match(/\{\{\d+\}\}/g) || []).map((v, i) => (
                      <Badge key={i} variant="outline" className="text-xs">{v}</Badge>
                    ))}
                  </div>
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
