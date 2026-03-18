/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * TRANSPORT COMMUNICATION HUB — Day 22
 * Centralized broadcast/targeted messaging for transport stakeholders
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import React, { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    MessageSquare, Send, Users, Bus, Route, Clock,
    Loader2, Plus, Eye, Megaphone, Mail, Search,
    CheckCircle, ChevronDown, ChevronUp
} from 'lucide-react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import api from '@/services/api';
import { toast } from 'sonner';
import { formatDateTime } from '@/utils/dateUtils';

const MESSAGE_TEMPLATES = [
    { id: 'delay', subject: 'Bus Delay Notice', message: 'Dear Parents, the bus on [Route] is delayed by approximately [X] minutes due to [reason]. We apologize for the inconvenience.' },
    { id: 'holiday', subject: 'Holiday Notice - No Transport', message: 'Dear Parents, please note that transport will NOT be operational on [Date] due to [Holiday]. Regular service resumes on [Date].' },
    { id: 'route_change', subject: 'Route Change Notification', message: 'Dear Parents, there is a temporary route change for [Route]. The new route will be via [Details]. This is effective from [Date].' },
    { id: 'emergency', subject: '⚠️ Emergency Notice', message: 'Dear Parents, due to [Emergency], transport has been suspended. Please arrange alternative transport for your child. We will update you shortly.' },
    { id: 'general', subject: 'Transport Announcement', message: '' },
];

const TARGET_TYPES = [
    { value: 'all_parents', label: 'All Transport Parents', icon: Users },
    { value: 'route_parents', label: 'Route-specific Parents', icon: Route },
    { value: 'all_drivers', label: 'All Drivers', icon: Bus },
    { value: 'custom', label: 'Custom Recipients', icon: Mail },
];

const TransportCommunication = () => {
    const { user, organizationId } = useAuth();
    const { selectedBranch } = useBranch();
    const branchId = selectedBranch?.id || user?.profile?.branch_id;

    const [messages, setMessages] = useState([]);
    const [routes, setRoutes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('history');
    const [sending, setSending] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedId, setExpandedId] = useState(null);

    // Compose form
    const [form, setForm] = useState({
        target_type: 'all_parents',
        route_id: '',
        subject: '',
        message: '',
        message_type: 'announcement',
        template_id: ''
    });

    // Fetch data
    const fetchData = useCallback(async () => {
        if (!branchId) return;
        setLoading(true);
        try {
            const [msgRes, routeRes] = await Promise.all([
                api.get('/transport/communications', { params: { branchId, organizationId } }),
                api.get('/transport/routes', { params: { branchId, organizationId } })
            ]);
            setMessages(msgRes.data?.data || []);
            setRoutes(routeRes.data?.data || []);
        } catch (err) {
            console.error('Fetch error:', err);
        } finally { setLoading(false); }
    }, [branchId, organizationId]);

    useEffect(() => { fetchData(); }, [fetchData]);

    // Apply template
    const applyTemplate = (templateId) => {
        const tpl = MESSAGE_TEMPLATES.find(t => t.id === templateId);
        if (tpl) {
            setForm(p => ({ ...p, template_id: templateId, subject: tpl.subject, message: tpl.message }));
        }
    };

    // Send message
    const handleSend = async () => {
        if (!form.subject.trim()) return toast.error('Subject required');
        if (!form.message.trim()) return toast.error('Message required');
        if (form.target_type === 'route_parents' && !form.route_id) return toast.error('Select a route');

        setSending(true);
        try {
            await api.post('/transport/communications', {
                ...form,
                branch_id: branchId,
                organization_id: organizationId
            });
            toast.success('Message sent successfully!');
            setActiveTab('history');
            setForm({ target_type: 'all_parents', route_id: '', subject: '', message: '', message_type: 'announcement', template_id: '' });
            fetchData();
        } catch { toast.error('Failed to send'); }
        finally { setSending(false); }
    };

    // Filter messages
    const filtered = messages.filter(m => {
        if (!searchTerm) return true;
        const term = searchTerm.toLowerCase();
        return m.subject?.toLowerCase().includes(term) || m.message?.toLowerCase().includes(term);
    });

    // Stats
    const totalSent = messages.length;
    const thisMonth = messages.filter(m => {
        const d = new Date(m.created_at);
        const now = new Date();
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length;

    return (
        <DashboardLayout>
            <div className="p-6 space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between flex-wrap gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <MessageSquare className="h-6 w-6 text-blue-600" />
                            Transport Communication Hub
                        </h1>
                        <p className="text-sm text-gray-500 mt-1">Broadcast & targeted messaging for transport stakeholders</p>
                    </div>
                    <Button onClick={() => setActiveTab(activeTab === 'compose' ? 'history' : 'compose')}>
                        {activeTab === 'compose' ? <Eye className="h-4 w-4 mr-1" /> : <Plus className="h-4 w-4 mr-1" />}
                        {activeTab === 'compose' ? 'View History' : 'New Message'}
                    </Button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {[
                        { label: 'Total Messages', value: totalSent, icon: Mail, color: 'text-blue-600 bg-blue-50' },
                        { label: 'This Month', value: thisMonth, icon: Clock, color: 'text-green-600 bg-green-50' },
                        { label: 'Templates', value: MESSAGE_TEMPLATES.length, icon: Megaphone, color: 'text-purple-600 bg-purple-50' },
                    ].map((s, i) => (
                        <Card key={i}>
                            <CardContent className="pt-4 flex items-center gap-3">
                                <div className={`p-2 rounded-lg ${s.color}`}><s.icon className="h-5 w-5" /></div>
                                <div>
                                    <p className="text-2xl font-bold">{s.value}</p>
                                    <p className="text-xs text-gray-500">{s.label}</p>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* ═══════ COMPOSE ═══════ */}
                {activeTab === 'compose' && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Send className="h-5 w-5" /> Compose Message
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-5">
                            {/* Template Quick Select */}
                            <div>
                                <Label>Quick Templates</Label>
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {MESSAGE_TEMPLATES.map(t => (
                                        <Button key={t.id} size="sm"
                                            variant={form.template_id === t.id ? 'default' : 'outline'}
                                            onClick={() => applyTemplate(t.id)}
                                        >
                                            {t.id === 'delay' ? '⏰' : t.id === 'holiday' ? '🏖️' :
                                             t.id === 'route_change' ? '🔄' : t.id === 'emergency' ? '⚠️' : '📢'}
                                            {' '}{t.subject.substring(0, 20)}
                                        </Button>
                                    ))}
                                </div>
                            </div>

                            {/* Target Audience */}
                            <div>
                                <Label>Send To</Label>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
                                    {TARGET_TYPES.map(t => (
                                        <button key={t.value}
                                            className={`p-3 rounded-lg border text-sm font-medium flex items-center gap-2 transition ${
                                                form.target_type === t.value
                                                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                                                    : 'border-gray-200 hover:bg-gray-50'
                                            }`}
                                            onClick={() => setForm(p => ({ ...p, target_type: t.value }))}
                                        >
                                            <t.icon className="h-4 w-4" /> {t.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Route selector if route_parents */}
                            {form.target_type === 'route_parents' && (
                                <div>
                                    <Label>Select Route</Label>
                                    <select className="w-full mt-1 rounded-md border border-gray-300 p-2 text-sm"
                                        value={form.route_id}
                                        onChange={e => setForm(p => ({ ...p, route_id: e.target.value }))}
                                    >
                                        <option value="">Select Route</option>
                                        {routes.map(r => (
                                            <option key={r.id} value={r.id}>{r.route_title || r.route_name}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {/* Subject */}
                            <div>
                                <Label>Subject *</Label>
                                <Input className="mt-1" placeholder="Message subject..."
                                    value={form.subject}
                                    onChange={e => setForm(p => ({ ...p, subject: e.target.value }))}
                                />
                            </div>

                            {/* Message Body */}
                            <div>
                                <Label>Message *</Label>
                                <Textarea className="mt-1" rows={5}
                                    placeholder="Type your message here... Use [brackets] for placeholders."
                                    value={form.message}
                                    onChange={e => setForm(p => ({ ...p, message: e.target.value }))}
                                />
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3 justify-end">
                                <Button variant="outline" onClick={() => setActiveTab('history')}>Cancel</Button>
                                <Button onClick={handleSend} disabled={sending}>
                                    {sending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Send className="h-4 w-4 mr-1" />}
                                    Send Message
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* ═══════ MESSAGE HISTORY ═══════ */}
                {activeTab === 'history' && (
                    <>
                        <div className="relative max-w-xs">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input className="pl-9" placeholder="Search messages..."
                                value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                            />
                        </div>

                        {loading ? (
                            <div className="flex justify-center py-12">
                                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                            </div>
                        ) : filtered.length === 0 ? (
                            <Card className="p-12 text-center">
                                <MessageSquare className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                                <p className="text-gray-500">No messages sent yet</p>
                            </Card>
                        ) : (
                            <div className="space-y-3">
                                {filtered.map(msg => {
                                    const isExpanded = expandedId === msg.id;
                                    const targetLabel = TARGET_TYPES.find(t => t.value === msg.target_type)?.label || msg.target_type;
                                    return (
                                        <Card key={msg.id} className="shadow-sm">
                                            <CardContent className="py-4">
                                                <div className="flex items-center justify-between cursor-pointer"
                                                    onClick={() => setExpandedId(isExpanded ? null : msg.id)}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-2 rounded-lg bg-blue-50">
                                                            <Send className="h-4 w-4 text-blue-600" />
                                                        </div>
                                                        <div>
                                                            <h4 className="font-bold text-sm">{msg.subject}</h4>
                                                            <p className="text-xs text-gray-500">
                                                                To: {targetLabel} • {formatDateTime(msg.created_at)}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Badge variant="outline" className="text-xs">
                                                            {msg.message_type || 'announcement'}
                                                        </Badge>
                                                        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                                    </div>
                                                </div>
                                                {isExpanded && (
                                                    <div className="mt-3 pt-3 border-t">
                                                        <p className="text-sm text-gray-700 whitespace-pre-wrap">{msg.message}</p>
                                                    </div>
                                                )}
                                            </CardContent>
                                        </Card>
                                    );
                                })}
                            </div>
                        )}
                    </>
                )}
            </div>
        </DashboardLayout>
    );
};

export default TransportCommunication;
