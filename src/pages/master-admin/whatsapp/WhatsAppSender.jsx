import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, Send, Phone } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import api from '@/lib/api';
import WhatsAppMobilePreview from './WhatsAppMobilePreview';

const WhatsAppSender = ({ accounts = [] }) => {
    const { toast } = useToast();
    const [selectedAccount, setSelectedAccount] = useState(null);
    const [templates, setTemplates] = useState([]);
    const [loadingTemplates, setLoadingTemplates] = useState(false);
    const [sending, setSending] = useState(false);

    // Debug: Log accounts prop
    useEffect(() => {
        console.log('[WhatsAppSender] Received accounts prop:', accounts);
    }, [accounts]);

    // Form State
    const [selectedTemplate, setSelectedTemplate] = useState(null);
    const [phoneNumber, setPhoneNumber] = useState('');
    const [variables, setVariables] = useState({}); 

    // Fetch templates when account changes
    useEffect(() => {
        if (selectedAccount) {
            fetchTemplates(selectedAccount);
        } else {
            setTemplates([]);
            setSelectedTemplate(null);
        }
    }, [selectedAccount]);

    const fetchTemplates = async (accountId) => {
        setLoadingTemplates(true);
        try {
            console.log('[WhatsApp] Fetching templates for account:', accountId);
            const res = await api.get(`/whatsapp-manager/accounts/${accountId}/templates`);
            console.log('[WhatsApp] Templates response:', res.data);
            if (res.data.success) {
                // Filter approved only
                const approved = res.data.data.filter(t => t.status === 'APPROVED');
                console.log('[WhatsApp] Approved templates:', approved.length);
                setTemplates(approved);
            }
        } catch (error) {
            console.error('[WhatsApp] Error fetching templates:', error);
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to fetch templates.' });
        } finally {
            setLoadingTemplates(false);
        }
    };

    const handleTemplateChange = (templateId) => {
        const template = templates.find(t => t.id === templateId);
        setSelectedTemplate(template);
        setVariables({});
    };

    const handleSend = async () => {
        if (!selectedAccount || !selectedTemplate || !phoneNumber) {
            toast({ variant: 'destructive', title: 'Error', description: 'Please fill all fields.' });
            return;
        }

        setSending(true);
        try {
            // Format variables for Meta API
            // Meta expects components array. 
            // For simplicity, we will assume body variables are {{1}}, {{2}} etc.
            // And we construct a simple body component.
            // Real implementation needs to parse components structure from template.
            
            const componentBody = [];
            Object.keys(variables).forEach(key => {
                componentBody.push({
                    type: 'text',
                    text: variables[key]
                });
            });

            // Use template_slug (lowercase_underscored) for Meta API, not display name
            const payload = {
                account_id: selectedAccount,
                template_name: selectedTemplate.slug || selectedTemplate.template_slug || selectedTemplate.name.toLowerCase().replace(/\s+/g, '_'),
                language_code: selectedTemplate.language,
                recipient_phone: phoneNumber,
                variables: componentBody.length > 0 ? [
                    {
                        type: 'body',
                        parameters: componentBody
                    }
                ] : []
            };

            console.log('[WhatsApp] Sending test message with payload:', payload);
            const res = await api.post('/whatsapp-manager/test-send', payload);

            if (res.data.success) {
                toast({ title: 'Success', description: 'Message sent successfully.' });
            }
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: error.response?.data?.message || 'Failed to send message' });
        } finally {
            setSending(false);
        }
    };

    // Helper to extract variable placeholders from text
    const getVariableCount = (text) => {
        if (!text) return 0;
        const matches = text.match(/{{\d+}}/g);
        return matches ? new Set(matches).size : 0;
    };

    const renderVariableInputs = () => {
        if (!selectedTemplate) return null;
        
        // Find body component
        const bodyComponent = selectedTemplate.components?.find(c => c.type === 'BODY');
        if (!bodyComponent || !bodyComponent.text) return null;

        const text = bodyComponent.text;
        const matches = text.match(/{{\d+}}/g);
        if (!matches) return null;
        
        const uniqueVars = [...new Set(matches)].sort();
        
        return (
            <div className="space-y-3 mt-4 border p-4 rounded-lg bg-slate-50 dark:bg-slate-900">
                <Label className="text-sm font-semibold text-slate-600">Template Variables</Label>
                {uniqueVars.map((v) => {
                    const key = v.replace(/[{}]/g, '');
                    return (
                        <div key={key} className="grid gap-1">
                            <Label className="text-xs">Variable {key} ({v})</Label>
                            <Input 
                                placeholder={`Value for ${v}`}
                                value={variables[key] || ''}
                                onChange={(e) => setVariables({...variables, [key]: e.target.value})}
                            />
                        </div>
                    );
                })}
            </div>
        );
    };

    // Preview Logic
    const getPreviewBody = () => {
        if (!selectedTemplate) return '';
        const bodyComponent = selectedTemplate.components?.find(c => c.type === 'BODY');
        if (!bodyComponent) return '';

        let body = bodyComponent.text || '';
        Object.keys(variables).forEach(key => {
            body = body.replace(new RegExp(`{{${key}}}`, 'g'), variables[key] || `{{${key}}}`);
        });
        return body;
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
            {/* Left Column: Configuration */}
            <div className="lg:col-span-2 space-y-6">
                <Card className="border-t-4 border-t-green-500 shadow-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Send className="w-5 h-5 text-green-600" />
                            Test Sender
                        </CardTitle>
                        <CardDescription>Send test messages to verify templates.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        
                        {/* 0. Select Account */}
                        <div className="space-y-2">
                            <Label>Select WABA Account ({accounts.length} available)</Label>
                            <select 
                                className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                                value={selectedAccount || ""}
                                onChange={(e) => {
                                    console.log('[WhatsAppSender] Account selected:', e.target.value);
                                    setSelectedAccount(e.target.value);
                                }}
                            >
                                <option value="">Choose an account</option>
                                {accounts.map((acc) => (
                                    <option key={acc.id} value={acc.id}>
                                        {acc.name} ({acc.waba_id})
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* 1. Select Template */}
                        <div className="space-y-2">
                            <Label>Select Template ({templates.length} available)</Label>
                            <select 
                                className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-50"
                                value={selectedTemplate?.id || ""}
                                disabled={!selectedAccount || loadingTemplates}
                                onChange={(e) => {
                                    const templateId = e.target.value;
                                    console.log('[WhatsAppSender] Template selected:', templateId);
                                    handleTemplateChange(templateId);
                                }}
                            >
                                <option value="">{loadingTemplates ? "Loading templates..." : "Choose a template"}</option>
                                {templates.map((t) => (
                                    <option key={t.id} value={t.id}>
                                        {t.name} ({t.language})
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* 2. Variable Inputs */}
                        {renderVariableInputs()}

                        {/* 3. Recipient Details */}
                        <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                            <Label>Phone Number</Label>
                            <div className="flex gap-2">
                                <div className="flex items-center justify-center px-3 border rounded-md bg-slate-100 text-slate-500 text-sm font-medium">
                                    +91
                                </div>
                                <Input 
                                    placeholder="9876543210" 
                                    value={phoneNumber}
                                    onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                                />
                            </div>
                            <p className="text-xs text-muted-foreground">Enter 10-digit mobile number without country code.</p>
                        </div>

                        <div className="pt-4">
                            <Button 
                                className="w-full bg-green-600 hover:bg-green-700 text-white h-12 text-lg shadow-md transition-all hover:shadow-lg"
                                onClick={handleSend}
                                disabled={sending || !selectedTemplate || !phoneNumber}
                            >
                                {sending ? (
                                    <>
                                        <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Sending...
                                    </>
                                ) : (
                                    <>
                                        <Send className="w-5 h-5 mr-2" /> Send Test Message
                                    </>
                                )}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Right Column: Preview */}
            <div className="lg:col-span-1">
                <div className="sticky top-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-lg">Live Preview</h3>
                        <span className="text-xs text-muted-foreground">Updates as you type</span>
                    </div>
                    <div className="flex justify-center">
                        <WhatsAppMobilePreview 
                            body={getPreviewBody()}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WhatsAppSender;
