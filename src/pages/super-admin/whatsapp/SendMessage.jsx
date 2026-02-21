/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * SEND MESSAGE - Super Admin
 * Send WhatsApp messages to students, parents, staff
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Send, MessageSquare, Users, Phone, FileText, Search, CheckCircle2 } from "lucide-react";
import api from '@/lib/api';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';

const SendMessage = () => {
  const { toast } = useToast();
  const { currentSessionId } = useAuth();
  const { selectedBranch } = useBranch();
  
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [recipients, setRecipients] = useState([]);
  const [selectedRecipients, setSelectedRecipients] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [recipientType, setRecipientType] = useState('student_parent');
  const [customPhone, setCustomPhone] = useState('');
  const [customName, setCustomName] = useState('');
  const [variables, setVariables] = useState({});
  const [previewMessage, setPreviewMessage] = useState('');

  useEffect(() => {
    fetchTemplates();
  }, []);

  useEffect(() => {
    if (selectedTemplate) {
      updatePreview();
    }
  }, [selectedTemplate, variables]);

  const fetchTemplates = async () => {
    try {
      const res = await api.get('/whatsapp/templates');
      if (res.data.success) {
        setTemplates(res.data.all || []);
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
    }
  };

  const searchRecipients = async () => {
    if (!searchQuery || searchQuery.length < 2) return;
    
    setLoading(true);
    try {
      let endpoint = '';
      if (recipientType === 'student_parent') {
        endpoint = `/students?search=${searchQuery}&branch_id=${selectedBranch?.id}&session_id=${currentSessionId}`;
      } else if (recipientType === 'staff') {
        endpoint = `/staff?search=${searchQuery}&branch_id=${selectedBranch?.id}`;
      }
      
      const res = await api.get(endpoint);
      if (res.data.success || res.data.data) {
        setRecipients(res.data.data || res.data.students || []);
      }
    } catch (error) {
      console.error('Error searching:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTemplateSelect = (templateSlug) => {
    const template = templates.find(t => t.template_slug === templateSlug);
    setSelectedTemplate(template);
    
    // Initialize variables
    if (template?.variables) {
      const vars = {};
      template.variables.forEach(v => {
        vars[v] = '';
      });
      setVariables(vars);
    }
  };

  const updatePreview = () => {
    if (!selectedTemplate) return;
    
    let message = selectedTemplate.body_content || '';
    
    // Replace variables
    Object.entries(variables).forEach(([key, value]) => {
      message = message.replace(new RegExp(`{{${key}}}`, 'g'), value || `{{${key}}}`);
    });
    
    setPreviewMessage(message);
  };

  const toggleRecipient = (recipient) => {
    const exists = selectedRecipients.find(r => r.id === recipient.id);
    if (exists) {
      setSelectedRecipients(prev => prev.filter(r => r.id !== recipient.id));
    } else {
      // Add with phone number
      const phone = recipient.father_mobile || recipient.mother_mobile || recipient.guardian_mobile || recipient.phone || recipient.mobile;
      setSelectedRecipients(prev => [...prev, {
        id: recipient.id,
        name: recipient.full_name || recipient.student_name || recipient.first_name,
        phone: phone,
        type: recipientType
      }]);
    }
  };

  const handleSend = async () => {
    if (!selectedTemplate) {
      toast({ title: "Select a template", variant: "destructive" });
      return;
    }

    const allRecipients = [...selectedRecipients];
    
    // Add custom phone if entered
    if (customPhone) {
      allRecipients.push({
        phone: customPhone,
        name: customName || 'User',
        type: 'custom'
      });
    }

    if (allRecipients.length === 0) {
      toast({ title: "Select at least one recipient", variant: "destructive" });
      return;
    }

    setSending(true);
    try {
      if (allRecipients.length === 1) {
        // Single message
        const res = await api.post('/whatsapp/send', {
          template_slug: selectedTemplate.template_slug,
          recipient_phone: allRecipients[0].phone,
          recipient_name: allRecipients[0].name,
          recipient_type: allRecipients[0].type,
          recipient_id: allRecipients[0].id,
          variables,
          session_id: currentSessionId
        });
        
        if (res.data.success) {
          toast({
            title: "✅ Message Sent!",
            description: `Message sent to ${allRecipients[0].name}`
          });
          // Reset
          setSelectedRecipients([]);
          setCustomPhone('');
          setCustomName('');
        } else {
          throw new Error(res.data.error);
        }
      } else {
        // Bulk send
        const res = await api.post('/whatsapp/send-bulk', {
          template_slug: selectedTemplate.template_slug,
          recipients: allRecipients.map(r => ({
            phone: r.phone,
            name: r.name,
            type: r.type,
            id: r.id,
            variables
          })),
          session_id: currentSessionId
        });
        
        if (res.data.success) {
          toast({
            title: "✅ Bulk Messages Sent!",
            description: `Sent: ${res.data.sent}, Failed: ${res.data.failed}`
          });
          setSelectedRecipients([]);
        }
      }
    } catch (error) {
      toast({
        title: "❌ Send Failed",
        description: error.response?.data?.error || error.message,
        variant: "destructive"
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Template Selection */}
      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Select Template
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Select onValueChange={handleTemplateSelect}>
            <SelectTrigger>
              <SelectValue placeholder="Choose a template" />
            </SelectTrigger>
            <SelectContent>
              {templates.map(t => (
                <SelectItem key={t.id} value={t.template_slug}>
                  <div className="flex flex-col">
                    <span>{t.template_name}</span>
                    <span className="text-xs text-muted-foreground">{t.category}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {selectedTemplate && (
            <div className="space-y-4 mt-4">
              <div>
                <Badge variant="outline">{selectedTemplate.category}</Badge>
                <Badge variant="secondary" className="ml-2">{selectedTemplate.language}</Badge>
              </div>

              {/* Variables */}
              {selectedTemplate.variables?.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Variables</Label>
                  {selectedTemplate.variables.map(v => (
                    <div key={v}>
                      <Label className="text-xs text-muted-foreground">{v}</Label>
                      <Input
                        value={variables[v] || ''}
                        onChange={(e) => setVariables(prev => ({ ...prev, [v]: e.target.value }))}
                        placeholder={`Enter ${v}`}
                        className="mt-1"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recipients Selection */}
      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Select Recipients
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Recipient Type */}
          <div>
            <Label>Recipient Type</Label>
            <Select value={recipientType} onValueChange={setRecipientType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="student_parent">Students/Parents</SelectItem>
                <SelectItem value="staff">Staff</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Search */}
          <div className="flex gap-2">
            <Input
              placeholder="Search by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && searchRecipients()}
            />
            <Button variant="outline" onClick={searchRecipients} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            </Button>
          </div>

          {/* Search Results */}
          <div className="max-h-48 overflow-y-auto space-y-2">
            {recipients.map(r => {
              const phone = r.father_mobile || r.mother_mobile || r.guardian_mobile || r.phone || r.mobile;
              const isSelected = selectedRecipients.find(sr => sr.id === r.id);
              return (
                <div
                  key={r.id}
                  onClick={() => toggleRecipient(r)}
                  className={`p-2 rounded border cursor-pointer transition-colors ${
                    isSelected ? 'bg-green-50 border-green-300' : 'hover:bg-muted'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">
                        {r.full_name || r.student_name || r.first_name}
                      </p>
                      <p className="text-xs text-muted-foreground">{phone || 'No phone'}</p>
                    </div>
                    {isSelected && <CheckCircle2 className="h-4 w-4 text-green-600" />}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Custom Phone */}
          <div className="border-t pt-4">
            <Label>Or Enter Phone Manually</Label>
            <Input
              placeholder="+91 9876543210"
              value={customPhone}
              onChange={(e) => setCustomPhone(e.target.value)}
              className="mt-1"
            />
            <Input
              placeholder="Recipient Name"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              className="mt-2"
            />
          </div>

          {/* Selected Count */}
          <div className="flex flex-wrap gap-1">
            {selectedRecipients.map(r => (
              <Badge key={r.id} variant="secondary" className="text-xs">
                {r.name}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Preview & Send */}
      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Message Preview
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Phone Preview */}
          <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl p-4 max-w-xs mx-auto">
            <div className="bg-[#075E54] text-white rounded-t-lg p-2 text-center text-sm font-medium">
              WhatsApp Preview
            </div>
            <div className="bg-[#ECE5DD] dark:bg-[#1f2c33] p-3 min-h-[200px] rounded-b-lg">
              {previewMessage ? (
                <div className="bg-white dark:bg-[#202c33] rounded-lg p-3 shadow-sm max-w-[90%] ml-auto">
                  <p className="text-sm whitespace-pre-wrap">{previewMessage}</p>
                  <p className="text-xs text-gray-500 text-right mt-1">
                    {new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              ) : (
                <p className="text-center text-gray-500 text-sm pt-12">
                  Select a template to see preview
                </p>
              )}
            </div>
          </div>

          <div className="mt-4 text-center text-sm text-muted-foreground">
            Recipients: {selectedRecipients.length + (customPhone ? 1 : 0)}
          </div>
        </CardContent>
        <CardFooter>
          <Button 
            className="w-full bg-green-600 hover:bg-green-700" 
            onClick={handleSend}
            disabled={sending || !selectedTemplate || (selectedRecipients.length === 0 && !customPhone)}
          >
            {sending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Send className="h-4 w-4 mr-2" />
            )}
            Send Message{selectedRecipients.length + (customPhone ? 1 : 0) > 1 ? 's' : ''}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default SendMessage;
