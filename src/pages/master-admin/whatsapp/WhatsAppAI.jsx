import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
    Bot, Brain, Zap, MessageSquare, Plus, Edit, Trash2, Loader2, 
    Sparkles, Play, Pause, Settings, Tag, Clock, Bell, GitBranch,
    HelpCircle, BookOpen, Send, Search, Filter, RefreshCw, Save,
    ChevronRight, User, CheckCircle, XCircle, AlertCircle
} from "lucide-react";
import api from '@/lib/api';
import { useToast } from "@/components/ui/use-toast";

const WhatsAppAI = () => {
    const { toast } = useToast();
    const [activeTab, setActiveTab] = useState("knowledge");
    const [loading, setLoading] = useState(false);
    
    // Knowledge Base State
    const [knowledgeEntries, setKnowledgeEntries] = useState([]);
    const [isKnowledgeDialogOpen, setIsKnowledgeDialogOpen] = useState(false);
    const [editingKnowledge, setEditingKnowledge] = useState(null);
    const [knowledgeForm, setKnowledgeForm] = useState({
        category: '', question: '', answer: '', keywords: '', priority: 0
    });
    
    // Automation Rules State
    const [automationRules, setAutomationRules] = useState([]);
    const [isAutomationDialogOpen, setIsAutomationDialogOpen] = useState(false);
    const [editingRule, setEditingRule] = useState(null);
    const [ruleForm, setRuleForm] = useState({
        name: '', description: '', trigger_type: 'keyword', trigger_config: {}, action_type: 'send_message', action_config: {}, priority: 0
    });
    
    // Quick Replies State
    const [quickReplies, setQuickReplies] = useState([]);
    const [isQuickReplyDialogOpen, setIsQuickReplyDialogOpen] = useState(false);
    const [quickReplyForm, setQuickReplyForm] = useState({
        title: '', content: '', category: '', shortcut: ''
    });
    
    // AI Conversations State
    const [conversations, setConversations] = useState([]);
    const [selectedConversation, setSelectedConversation] = useState(null);
    const [conversationMessages, setConversationMessages] = useState([]);

    // Categories for Knowledge Base
    const knowledgeCategories = [
        'Admission', 'Fees', 'Exams', 'Attendance', 'Transport', 
        'Hostel', 'Library', 'Events', 'General', 'Other'
    ];

    // Trigger Types
    const triggerTypes = [
        { value: 'keyword', label: 'Keyword Match', icon: Tag },
        { value: 'time', label: 'Time Based', icon: Clock },
        { value: 'event', label: 'System Event', icon: Bell },
        { value: 'condition', label: 'Condition', icon: GitBranch }
    ];

    // Action Types
    const actionTypes = [
        { value: 'send_message', label: 'Send Message', icon: MessageSquare },
        { value: 'send_template', label: 'Send Template', icon: Send },
        { value: 'assign_agent', label: 'Assign to Agent', icon: User },
        { value: 'api_call', label: 'API Call', icon: Zap }
    ];

    // ═══════════════════════════════════════════════════════════════════════════
    // FETCH DATA
    // ═══════════════════════════════════════════════════════════════════════════

    const fetchKnowledgeBase = async () => {
        setLoading(true);
        try {
            const res = await api.get('/whatsapp-manager/knowledge-base');
            if (res.data.success) setKnowledgeEntries(res.data.data);
        } catch (error) {
            console.error('Failed to fetch knowledge base:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchAutomationRules = async () => {
        try {
            const res = await api.get('/whatsapp-manager/automation-rules');
            if (res.data.success) setAutomationRules(res.data.data);
        } catch (error) {
            console.error('Failed to fetch automation rules:', error);
        }
    };

    const fetchQuickReplies = async () => {
        try {
            const res = await api.get('/whatsapp-manager/quick-replies');
            if (res.data.success) setQuickReplies(res.data.data);
        } catch (error) {
            console.error('Failed to fetch quick replies:', error);
        }
    };

    const fetchConversations = async () => {
        try {
            const res = await api.get('/whatsapp-manager/ai-conversations');
            if (res.data.success) setConversations(res.data.data);
        } catch (error) {
            console.error('Failed to fetch conversations:', error);
        }
    };

    const fetchConversationMessages = async (conversationId) => {
        try {
            const res = await api.get(`/whatsapp-manager/ai-conversations/${conversationId}/messages`);
            if (res.data.success) setConversationMessages(res.data.data);
        } catch (error) {
            console.error('Failed to fetch messages:', error);
        }
    };

    useEffect(() => {
        fetchKnowledgeBase();
        fetchAutomationRules();
        fetchQuickReplies();
        fetchConversations();
    }, []);

    useEffect(() => {
        if (selectedConversation) {
            fetchConversationMessages(selectedConversation.id);
        }
    }, [selectedConversation]);

    // ═══════════════════════════════════════════════════════════════════════════
    // KNOWLEDGE BASE CRUD
    // ═══════════════════════════════════════════════════════════════════════════

    const handleSaveKnowledge = async () => {
        try {
            const payload = {
                ...knowledgeForm,
                keywords: knowledgeForm.keywords.split(',').map(k => k.trim()).filter(k => k)
            };
            
            if (editingKnowledge) {
                await api.put(`/whatsapp-manager/knowledge-base/${editingKnowledge.id}`, payload);
                toast({ title: "Success", description: "Knowledge entry updated" });
            } else {
                await api.post('/whatsapp-manager/knowledge-base', payload);
                toast({ title: "Success", description: "Knowledge entry added" });
            }
            setIsKnowledgeDialogOpen(false);
            setEditingKnowledge(null);
            setKnowledgeForm({ category: '', question: '', answer: '', keywords: '', priority: 0 });
            fetchKnowledgeBase();
        } catch (error) {
            toast({ title: "Error", description: "Failed to save", variant: "destructive" });
        }
    };

    const handleDeleteKnowledge = async (id) => {
        if (!confirm('Delete this knowledge entry?')) return;
        try {
            await api.delete(`/whatsapp-manager/knowledge-base/${id}`);
            toast({ title: "Success", description: "Entry deleted" });
            fetchKnowledgeBase();
        } catch (error) {
            toast({ title: "Error", description: "Failed to delete", variant: "destructive" });
        }
    };

    // ═══════════════════════════════════════════════════════════════════════════
    // AUTOMATION RULES CRUD
    // ═══════════════════════════════════════════════════════════════════════════

    const handleSaveRule = async () => {
        try {
            if (editingRule) {
                await api.put(`/whatsapp-manager/automation-rules/${editingRule.id}`, ruleForm);
                toast({ title: "Success", description: "Rule updated" });
            } else {
                await api.post('/whatsapp-manager/automation-rules', ruleForm);
                toast({ title: "Success", description: "Rule created" });
            }
            setIsAutomationDialogOpen(false);
            setEditingRule(null);
            setRuleForm({ name: '', description: '', trigger_type: 'keyword', trigger_config: {}, action_type: 'send_message', action_config: {}, priority: 0 });
            fetchAutomationRules();
        } catch (error) {
            toast({ title: "Error", description: "Failed to save", variant: "destructive" });
        }
    };

    const handleToggleRule = async (rule) => {
        try {
            await api.put(`/whatsapp-manager/automation-rules/${rule.id}/toggle`, { is_active: !rule.is_active });
            fetchAutomationRules();
        } catch (error) {
            toast({ title: "Error", description: "Failed to toggle rule", variant: "destructive" });
        }
    };

    const handleDeleteRule = async (id) => {
        if (!confirm('Delete this automation rule?')) return;
        try {
            await api.delete(`/whatsapp-manager/automation-rules/${id}`);
            toast({ title: "Success", description: "Rule deleted" });
            fetchAutomationRules();
        } catch (error) {
            toast({ title: "Error", description: "Failed to delete", variant: "destructive" });
        }
    };

    // ═══════════════════════════════════════════════════════════════════════════
    // QUICK REPLIES CRUD
    // ═══════════════════════════════════════════════════════════════════════════

    const handleSaveQuickReply = async () => {
        try {
            await api.post('/whatsapp-manager/quick-replies', quickReplyForm);
            toast({ title: "Success", description: "Quick reply created" });
            setIsQuickReplyDialogOpen(false);
            setQuickReplyForm({ title: '', content: '', category: '', shortcut: '' });
            fetchQuickReplies();
        } catch (error) {
            toast({ title: "Error", description: "Failed to save", variant: "destructive" });
        }
    };

    const handleDeleteQuickReply = async (id) => {
        if (!confirm('Delete this quick reply?')) return;
        try {
            await api.delete(`/whatsapp-manager/quick-replies/${id}`);
            fetchQuickReplies();
        } catch (error) {
            toast({ title: "Error", description: "Failed to delete", variant: "destructive" });
        }
    };

    // ═══════════════════════════════════════════════════════════════════════════
    // RENDER
    // ═══════════════════════════════════════════════════════════════════════════

    return (
        <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-purple-100">Knowledge Base</p>
                                <h3 className="text-3xl font-bold">{knowledgeEntries.length}</h3>
                            </div>
                            <Brain className="h-10 w-10 opacity-80" />
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-amber-500 to-amber-600 text-white">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-amber-100">Automation Rules</p>
                                <h3 className="text-3xl font-bold">{automationRules.length}</h3>
                            </div>
                            <Zap className="h-10 w-10 opacity-80" />
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-green-100">Quick Replies</p>
                                <h3 className="text-3xl font-bold">{quickReplies.length}</h3>
                            </div>
                            <MessageSquare className="h-10 w-10 opacity-80" />
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-blue-100">AI Conversations</p>
                                <h3 className="text-3xl font-bold">{conversations.length}</h3>
                            </div>
                            <Bot className="h-10 w-10 opacity-80" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="bg-purple-50 dark:bg-purple-900/20">
                    <TabsTrigger value="knowledge" className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800">
                        <Brain className="h-4 w-4 mr-2" /> Knowledge Base
                    </TabsTrigger>
                    <TabsTrigger value="automation" className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800">
                        <Zap className="h-4 w-4 mr-2" /> Automation Rules
                    </TabsTrigger>
                    <TabsTrigger value="quick-replies" className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800">
                        <MessageSquare className="h-4 w-4 mr-2" /> Quick Replies
                    </TabsTrigger>
                    <TabsTrigger value="conversations" className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800">
                        <Bot className="h-4 w-4 mr-2" /> AI Conversations
                    </TabsTrigger>
                </TabsList>

                {/* ═══════════════════ KNOWLEDGE BASE TAB ═══════════════════ */}
                <TabsContent value="knowledge" className="space-y-4">
                    <div className="flex justify-between items-center">
                        <div>
                            <h2 className="text-xl font-semibold flex items-center gap-2">
                                <Brain className="h-6 w-6 text-purple-600" />
                                AI Knowledge Base
                            </h2>
                            <p className="text-muted-foreground text-sm">Train your AI chatbot with Q&A pairs</p>
                        </div>
                        <Button onClick={() => { setEditingKnowledge(null); setKnowledgeForm({ category: '', question: '', answer: '', keywords: '', priority: 0 }); setIsKnowledgeDialogOpen(true); }}>
                            <Plus className="h-4 w-4 mr-2" /> Add Q&A
                        </Button>
                    </div>

                    <Card>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Category</TableHead>
                                        <TableHead>Question</TableHead>
                                        <TableHead>Answer</TableHead>
                                        <TableHead>Keywords</TableHead>
                                        <TableHead>Usage</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {knowledgeEntries.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                                                <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                                <p>No knowledge entries yet</p>
                                                <p className="text-sm">Add Q&A pairs to train your AI chatbot</p>
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        knowledgeEntries.map(entry => (
                                            <TableRow key={entry.id}>
                                                <TableCell>
                                                    <Badge variant="outline">{entry.category}</Badge>
                                                </TableCell>
                                                <TableCell className="max-w-xs truncate font-medium">{entry.question}</TableCell>
                                                <TableCell className="max-w-xs truncate text-muted-foreground">{entry.answer}</TableCell>
                                                <TableCell>
                                                    <div className="flex gap-1 flex-wrap">
                                                        {entry.keywords?.slice(0, 3).map((kw, i) => (
                                                            <Badge key={i} variant="secondary" className="text-xs">{kw}</Badge>
                                                        ))}
                                                        {entry.keywords?.length > 3 && <Badge variant="secondary" className="text-xs">+{entry.keywords.length - 3}</Badge>}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className="bg-green-50 text-green-700">{entry.usage_count || 0}</Badge>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button variant="ghost" size="sm" onClick={() => { setEditingKnowledge(entry); setKnowledgeForm({ ...entry, keywords: entry.keywords?.join(', ') || '' }); setIsKnowledgeDialogOpen(true); }}>
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                    <Button variant="ghost" size="sm" className="text-red-600" onClick={() => handleDeleteKnowledge(entry.id)}>
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* ═══════════════════ AUTOMATION RULES TAB ═══════════════════ */}
                <TabsContent value="automation" className="space-y-4">
                    <div className="flex justify-between items-center">
                        <div>
                            <h2 className="text-xl font-semibold flex items-center gap-2">
                                <Zap className="h-6 w-6 text-amber-600" />
                                Automation Rules
                            </h2>
                            <p className="text-muted-foreground text-sm">Automate responses based on triggers</p>
                        </div>
                        <Button onClick={() => { setEditingRule(null); setRuleForm({ name: '', description: '', trigger_type: 'keyword', trigger_config: {}, action_type: 'send_message', action_config: {}, priority: 0 }); setIsAutomationDialogOpen(true); }}>
                            <Plus className="h-4 w-4 mr-2" /> Add Rule
                        </Button>
                    </div>

                    <div className="grid gap-4">
                        {automationRules.length === 0 ? (
                            <Card>
                                <CardContent className="py-10 text-center text-muted-foreground">
                                    <Zap className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                    <p>No automation rules yet</p>
                                    <p className="text-sm">Create rules to automate WhatsApp responses</p>
                                </CardContent>
                            </Card>
                        ) : (
                            automationRules.map(rule => (
                                <Card key={rule.id} className={`transition-opacity ${!rule.is_active ? 'opacity-60' : ''}`}>
                                    <CardContent className="p-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className={`p-2 rounded-lg ${rule.is_active ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-500'}`}>
                                                    <Zap className="h-5 w-5" />
                                                </div>
                                                <div>
                                                    <h4 className="font-semibold flex items-center gap-2">
                                                        {rule.name}
                                                        {rule.is_active ? (
                                                            <Badge className="bg-green-100 text-green-700"><CheckCircle className="h-3 w-3 mr-1" /> Active</Badge>
                                                        ) : (
                                                            <Badge variant="secondary"><XCircle className="h-3 w-3 mr-1" /> Inactive</Badge>
                                                        )}
                                                    </h4>
                                                    <p className="text-sm text-muted-foreground">{rule.description}</p>
                                                    <div className="flex gap-2 mt-2">
                                                        <Badge variant="outline">
                                                            <Tag className="h-3 w-3 mr-1" />
                                                            {triggerTypes.find(t => t.value === rule.trigger_type)?.label || rule.trigger_type}
                                                        </Badge>
                                                        <ChevronRight className="h-4 w-4 text-gray-400" />
                                                        <Badge variant="outline">
                                                            <MessageSquare className="h-3 w-3 mr-1" />
                                                            {actionTypes.find(a => a.value === rule.action_type)?.label || rule.action_type}
                                                        </Badge>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Badge variant="secondary">Run: {rule.run_count || 0}</Badge>
                                                <Switch checked={rule.is_active} onCheckedChange={() => handleToggleRule(rule)} />
                                                <Button variant="ghost" size="sm" onClick={() => { setEditingRule(rule); setRuleForm(rule); setIsAutomationDialogOpen(true); }}>
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="sm" className="text-red-600" onClick={() => handleDeleteRule(rule.id)}>
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))
                        )}
                    </div>
                </TabsContent>

                {/* ═══════════════════ QUICK REPLIES TAB ═══════════════════ */}
                <TabsContent value="quick-replies" className="space-y-4">
                    <div className="flex justify-between items-center">
                        <div>
                            <h2 className="text-xl font-semibold flex items-center gap-2">
                                <MessageSquare className="h-6 w-6 text-green-600" />
                                Quick Replies
                            </h2>
                            <p className="text-muted-foreground text-sm">Pre-saved response templates for quick messaging</p>
                        </div>
                        <Button onClick={() => setIsQuickReplyDialogOpen(true)}>
                            <Plus className="h-4 w-4 mr-2" /> Add Quick Reply
                        </Button>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {quickReplies.map(reply => (
                            <Card key={reply.id} className="hover:shadow-md transition-shadow">
                                <CardHeader className="pb-2">
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="text-base">{reply.title}</CardTitle>
                                        <Badge variant="outline">{reply.category || 'General'}</Badge>
                                    </div>
                                    {reply.shortcut && (
                                        <code className="text-xs text-muted-foreground bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">/{reply.shortcut}</code>
                                    )}
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-muted-foreground line-clamp-3">{reply.content}</p>
                                </CardContent>
                                <CardFooter className="pt-0 flex justify-between">
                                    <Badge variant="secondary" className="text-xs">Used: {reply.usage_count || 0}</Badge>
                                    <Button variant="ghost" size="sm" className="text-red-600" onClick={() => handleDeleteQuickReply(reply.id)}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </CardFooter>
                            </Card>
                        ))}
                        
                        {quickReplies.length === 0 && (
                            <Card className="col-span-full">
                                <CardContent className="py-10 text-center text-muted-foreground">
                                    <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                    <p>No quick replies yet</p>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </TabsContent>

                {/* ═══════════════════ AI CONVERSATIONS TAB ═══════════════════ */}
                <TabsContent value="conversations" className="space-y-4">
                    <div className="flex justify-between items-center">
                        <div>
                            <h2 className="text-xl font-semibold flex items-center gap-2">
                                <Bot className="h-6 w-6 text-blue-600" />
                                AI Conversations
                            </h2>
                            <p className="text-muted-foreground text-sm">Monitor AI chatbot conversations</p>
                        </div>
                        <Button variant="outline" onClick={fetchConversations}>
                            <RefreshCw className="h-4 w-4 mr-2" /> Refresh
                        </Button>
                    </div>

                    <div className="grid md:grid-cols-3 gap-6">
                        {/* Conversation List */}
                        <Card className="md:col-span-1">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-base">Recent Conversations</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ScrollArea className="h-[500px]">
                                    {conversations.length === 0 ? (
                                        <div className="text-center py-10 text-muted-foreground">
                                            <Bot className="h-10 w-10 mx-auto mb-2 opacity-50" />
                                            <p className="text-sm">No conversations yet</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            {conversations.map(conv => (
                                                <div
                                                    key={conv.id}
                                                    className={`p-3 rounded-lg cursor-pointer transition-colors ${
                                                        selectedConversation?.id === conv.id 
                                                            ? 'bg-blue-100 dark:bg-blue-900 border-2 border-blue-500' 
                                                            : 'bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700'
                                                    }`}
                                                    onClick={() => setSelectedConversation(conv)}
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <span className="font-medium">{conv.contact_name || conv.phone_number}</span>
                                                        <Badge variant={conv.status === 'active' ? 'default' : 'secondary'} className="text-xs">
                                                            {conv.status}
                                                        </Badge>
                                                    </div>
                                                    <div className="text-xs text-muted-foreground mt-1">
                                                        {conv.total_messages} messages
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </ScrollArea>
                            </CardContent>
                        </Card>

                        {/* Conversation Messages */}
                        <Card className="md:col-span-2">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-base">
                                    {selectedConversation ? `Chat with ${selectedConversation.contact_name || selectedConversation.phone_number}` : 'Select a conversation'}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ScrollArea className="h-[500px]">
                                    {!selectedConversation ? (
                                        <div className="flex items-center justify-center h-full text-muted-foreground">
                                            <div className="text-center">
                                                <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                                <p>Select a conversation to view messages</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {conversationMessages.map(msg => (
                                                <div key={msg.id} className={`flex ${msg.sender_type === 'user' ? 'justify-start' : 'justify-end'}`}>
                                                    <div className={`max-w-[80%] p-3 rounded-lg ${
                                                        msg.sender_type === 'user' 
                                                            ? 'bg-gray-100 dark:bg-gray-800' 
                                                            : msg.sender_type === 'ai'
                                                                ? 'bg-purple-100 dark:bg-purple-900 text-purple-900 dark:text-purple-100'
                                                                : 'bg-green-100 dark:bg-green-900 text-green-900 dark:text-green-100'
                                                    }`}>
                                                        <div className="flex items-center gap-2 mb-1">
                                                            {msg.sender_type === 'ai' && <Bot className="h-4 w-4" />}
                                                            {msg.sender_type === 'user' && <User className="h-4 w-4" />}
                                                            <span className="text-xs font-medium capitalize">{msg.sender_type}</span>
                                                            {msg.ai_confidence && (
                                                                <Badge variant="secondary" className="text-xs">
                                                                    {Math.round(msg.ai_confidence * 100)}% confident
                                                                </Badge>
                                                            )}
                                                        </div>
                                                        <p className="text-sm">{msg.content}</p>
                                                        {msg.intent_detected && (
                                                            <div className="mt-2">
                                                                <Badge variant="outline" className="text-xs">
                                                                    <Sparkles className="h-3 w-3 mr-1" />
                                                                    Intent: {msg.intent_detected}
                                                                </Badge>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </ScrollArea>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
            </Tabs>

            {/* ═══════════════════ KNOWLEDGE DIALOG ═══════════════════ */}
            <Dialog open={isKnowledgeDialogOpen} onOpenChange={setIsKnowledgeDialogOpen}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Brain className="h-5 w-5 text-purple-600" />
                            {editingKnowledge ? 'Edit Knowledge Entry' : 'Add Knowledge Entry'}
                        </DialogTitle>
                        <DialogDescription>Train your AI with Q&A pairs</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label>Category *</Label>
                            <Select value={knowledgeForm.category} onValueChange={v => setKnowledgeForm({ ...knowledgeForm, category: v })}>
                                <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                                <SelectContent>
                                    {knowledgeCategories.map(cat => (
                                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2">
                            <Label>Question *</Label>
                            <Textarea 
                                value={knowledgeForm.question} 
                                onChange={e => setKnowledgeForm({ ...knowledgeForm, question: e.target.value })} 
                                placeholder="What is the admission process?"
                                rows={2}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label>Answer *</Label>
                            <Textarea 
                                value={knowledgeForm.answer} 
                                onChange={e => setKnowledgeForm({ ...knowledgeForm, answer: e.target.value })} 
                                placeholder="The admission process involves..."
                                rows={4}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label>Keywords (comma separated)</Label>
                            <Input 
                                value={knowledgeForm.keywords} 
                                onChange={e => setKnowledgeForm({ ...knowledgeForm, keywords: e.target.value })} 
                                placeholder="admission, apply, enroll, join"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label>Priority (higher = more important)</Label>
                            <Input 
                                type="number" 
                                value={knowledgeForm.priority} 
                                onChange={e => setKnowledgeForm({ ...knowledgeForm, priority: parseInt(e.target.value) || 0 })} 
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsKnowledgeDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleSaveKnowledge}>
                            <Save className="h-4 w-4 mr-2" /> Save
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ═══════════════════ AUTOMATION DIALOG ═══════════════════ */}
            <Dialog open={isAutomationDialogOpen} onOpenChange={setIsAutomationDialogOpen}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Zap className="h-5 w-5 text-amber-600" />
                            {editingRule ? 'Edit Automation Rule' : 'Create Automation Rule'}
                        </DialogTitle>
                        <DialogDescription>Automate WhatsApp responses</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label>Rule Name *</Label>
                            <Input value={ruleForm.name} onChange={e => setRuleForm({ ...ruleForm, name: e.target.value })} placeholder="Welcome Message" />
                        </div>
                        <div className="grid gap-2">
                            <Label>Description</Label>
                            <Textarea value={ruleForm.description} onChange={e => setRuleForm({ ...ruleForm, description: e.target.value })} placeholder="Sends welcome message to new contacts" rows={2} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label>Trigger Type *</Label>
                                <Select value={ruleForm.trigger_type} onValueChange={v => setRuleForm({ ...ruleForm, trigger_type: v })}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {triggerTypes.map(t => (
                                            <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-2">
                                <Label>Action Type *</Label>
                                <Select value={ruleForm.action_type} onValueChange={v => setRuleForm({ ...ruleForm, action_type: v })}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {actionTypes.map(a => (
                                            <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        {ruleForm.trigger_type === 'keyword' && (
                            <div className="grid gap-2">
                                <Label>Keywords (comma separated)</Label>
                                <Input 
                                    value={ruleForm.trigger_config?.keywords || ''} 
                                    onChange={e => setRuleForm({ ...ruleForm, trigger_config: { ...ruleForm.trigger_config, keywords: e.target.value } })} 
                                    placeholder="hi, hello, hey"
                                />
                            </div>
                        )}
                        {ruleForm.action_type === 'send_message' && (
                            <div className="grid gap-2">
                                <Label>Message Content</Label>
                                <Textarea 
                                    value={ruleForm.action_config?.message || ''} 
                                    onChange={e => setRuleForm({ ...ruleForm, action_config: { ...ruleForm.action_config, message: e.target.value } })} 
                                    placeholder="Hello! Welcome to our school..."
                                    rows={3}
                                />
                            </div>
                        )}
                        <div className="grid gap-2">
                            <Label>Priority</Label>
                            <Input type="number" value={ruleForm.priority} onChange={e => setRuleForm({ ...ruleForm, priority: parseInt(e.target.value) || 0 })} />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAutomationDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleSaveRule}>
                            <Save className="h-4 w-4 mr-2" /> Save Rule
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ═══════════════════ QUICK REPLY DIALOG ═══════════════════ */}
            <Dialog open={isQuickReplyDialogOpen} onOpenChange={setIsQuickReplyDialogOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <MessageSquare className="h-5 w-5 text-green-600" />
                            Add Quick Reply
                        </DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label>Title *</Label>
                            <Input value={quickReplyForm.title} onChange={e => setQuickReplyForm({ ...quickReplyForm, title: e.target.value })} placeholder="Fee Structure" />
                        </div>
                        <div className="grid gap-2">
                            <Label>Content *</Label>
                            <Textarea value={quickReplyForm.content} onChange={e => setQuickReplyForm({ ...quickReplyForm, content: e.target.value })} placeholder="Our fee structure is..." rows={4} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label>Category</Label>
                                <Input value={quickReplyForm.category} onChange={e => setQuickReplyForm({ ...quickReplyForm, category: e.target.value })} placeholder="Fees" />
                            </div>
                            <div className="grid gap-2">
                                <Label>Shortcut</Label>
                                <Input value={quickReplyForm.shortcut} onChange={e => setQuickReplyForm({ ...quickReplyForm, shortcut: e.target.value })} placeholder="fees" />
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsQuickReplyDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleSaveQuickReply}>
                            <Save className="h-4 w-4 mr-2" /> Save
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default WhatsAppAI;
