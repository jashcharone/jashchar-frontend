import React, { useState, useEffect } from 'react';
import { 
    FileText, Sparkles, Copy, Check, RefreshCw, Loader2,
    MessageSquare, Clock, Users, AlertCircle, ChevronDown,
    ListChecks, Target, Lightbulb, Hash, Calendar, TrendingUp,
    Download, Share2, BookOpen, Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { useToast } from '@/components/ui/use-toast';
import api from "@/services/api";

/**
 * SummarizeView - AI-powered conversation summarization
 * Generates summaries, action items, key points
 */
const SummarizeView = ({ 
    open, 
    onOpenChange,
    conversation = null,
    messages = []
}) => {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [summaryType, setSummaryType] = useState('brief');
    const [summary, setSummary] = useState(null);
    const [copied, setCopied] = useState(false);
    const [activeTab, setActiveTab] = useState('summary');
    
    // Summary types
    const summaryTypes = [
        { id: 'brief', label: 'Brief', description: '2-3 sentences' },
        { id: 'detailed', label: 'Detailed', description: 'Full overview' },
        { id: 'action-items', label: 'Action Items', description: 'Tasks & To-dos' },
        { id: 'key-points', label: 'Key Points', description: 'Bullet points' },
    ];
    
    // Generate summary
    const generateSummary = async () => {
        if (messages.length === 0) {
            toast({ title: "Error", description: 'No messages to summarize', variant: "destructive" });
            return;
        }
        
        setLoading(true);
        try {
            // Simulate AI processing
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Mock summary data
            const mockSummary = {
                brief: "This conversation discussed fee payment deadlines and student admission procedures. Key decisions were made regarding the upcoming parent-teacher meeting schedule.",
                
                detailed: `The conversation primarily focused on three main topics:

1. **Fee Payment Updates**: The administration reminded about the upcoming fee payment deadline on March 15th. Late fees will be applicable after this date. Payment can be made through UPI, bank transfer, or at the school office.

2. **Student Admission Queries**: Several questions were raised about the admission process for the new academic year. Documents required include birth certificate, previous school records, and address proof.

3. **Parent-Teacher Meeting**: The PTM has been scheduled for March 20th. All parents are requested to attend with their children's progress cards. Timing will be 10 AM to 4 PM.`,
                
                actionItems: [
                    { id: 1, task: "Complete fee payment before March 15th", priority: 'high', assignee: 'Parents' },
                    { id: 2, task: "Submit admission documents to office", priority: 'medium', assignee: 'New Admissions' },
                    { id: 3, task: "Prepare for PTM on March 20th", priority: 'medium', assignee: 'Teachers' },
                    { id: 4, task: "Update attendance records", priority: 'low', assignee: 'Class Teachers' },
                    { id: 5, task: "Send reminder SMS to pending fee parents", priority: 'high', assignee: 'Admin' },
                ],
                
                keyPoints: [
                    "Fee deadline: March 15, 2026",
                    "Late fee: ₹100 per day after deadline",
                    "PTM scheduled: March 20, 2026",
                    "PTM timing: 10 AM - 4 PM",
                    "New admissions open until March 30",
                    "Required documents: Birth certificate, TC, Address proof",
                    "Online payment enabled via UPI & Bank Transfer",
                ],
                
                stats: {
                    totalMessages: messages.length || 45,
                    participants: 12,
                    duration: '3 days',
                    topics: 3,
                    sentiment: 'positive',
                    urgentItems: 2
                },
                
                topics: [
                    { name: 'Fee Payment', messages: 18, percentage: 40 },
                    { name: 'Admissions', messages: 15, percentage: 33 },
                    { name: 'PTM', messages: 12, percentage: 27 },
                ],
                
                timeline: [
                    { date: 'Feb 28', event: 'Conversation started', type: 'start' },
                    { date: 'Mar 1', event: 'Fee reminder sent', type: 'important' },
                    { date: 'Mar 2', event: 'PTM date confirmed', type: 'decision' },
                ]
            };
            
            setSummary(mockSummary);
            
        } catch (error) {
            console.error('Summarization failed:', error);
            toast({ title: "Error", description: 'Failed to generate summary', variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };
    
    // Copy to clipboard
    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        toast({ title: "Copied", description: 'Summary copied to clipboard' });
        setTimeout(() => setCopied(false), 2000);
    };
    
    // Export summary
    const exportSummary = () => {
        if (!summary) return;
        
        const content = `
CONVERSATION SUMMARY
====================
Generated: ${new Date().toLocaleString()}
Conversation: ${conversation?.name || 'Unknown'}

BRIEF SUMMARY
-------------
${summary.brief}

KEY POINTS
----------
${summary.keyPoints.map((p, i) => `${i + 1}. ${p}`).join('\n')}

ACTION ITEMS
------------
${summary.actionItems.map((a, i) => `${i + 1}. [${a.priority.toUpperCase()}] ${a.task} - ${a.assignee}`).join('\n')}

STATISTICS
----------
- Total Messages: ${summary.stats.totalMessages}
- Participants: ${summary.stats.participants}
- Duration: ${summary.stats.duration}
- Topics Discussed: ${summary.stats.topics}
`;
        
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `summary-${Date.now()}.txt`;
        a.click();
        URL.revokeObjectURL(url);
        
        toast({ title: "Exported", description: 'Summary downloaded' });
    };
    
    // Reset on close
    useEffect(() => {
        if (!open) {
            setSummary(null);
            setActiveTab('summary');
        }
    }, [open]);
    
    // Get priority color
    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'high': return 'text-red-400 bg-red-500/20 border-red-500/30';
            case 'medium': return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30';
            case 'low': return 'text-green-400 bg-green-500/20 border-green-500/30';
            default: return 'text-gray-400 bg-gray-500/20 border-gray-500/30';
        }
    };
    
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 max-w-2xl p-0 max-h-[90vh]">
                {/* Header */}
                <DialogHeader className="p-4 pb-2 border-b border-gray-200 dark:border-gray-700/50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                            <FileText className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <DialogTitle className="text-gray-900 dark:text-white">
                                Conversation Summary
                            </DialogTitle>
                            <DialogDescription>
                                AI-generated insights from {messages.length || 'N/A'} messages
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>
                
                <ScrollArea className="flex-1 max-h-[calc(90vh-180px)]">
                    <div className="p-4 space-y-4">
                        {/* Summary Type Selection */}
                        {!summary && (
                            <Card className="bg-gray-100/50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm text-gray-900 dark:text-white">Generate Summary</CardTitle>
                                    <CardDescription className="text-xs">
                                        Choose the type of summary you need
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-2 gap-2">
                                        {summaryTypes.map((type) => (
                                            <Button
                                                key={type.id}
                                                variant={summaryType === type.id ? "default" : "outline"}
                                                onClick={() => setSummaryType(type.id)}
                                                className={cn(
                                                    "flex-col h-auto py-3",
                                                    summaryType === type.id 
                                                        ? "bg-green-600 hover:bg-green-700" 
                                                        : "border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800"
                                                )}
                                            >
                                                <span className="font-medium">{type.label}</span>
                                                <span className="text-xs opacity-70">{type.description}</span>
                                            </Button>
                                        ))}
                                    </div>
                                    
                                    <Button 
                                        onClick={generateSummary}
                                        disabled={loading}
                                        className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                                    >
                                        {loading ? (
                                            <>
                                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                Analyzing conversation...
                                            </>
                                        ) : (
                                            <>
                                                <Sparkles className="w-4 h-4 mr-2" />
                                                Generate Summary
                                            </>
                                        )}
                                    </Button>
                                    
                                    {loading && (
                                        <div className="space-y-2">
                                            <div className="flex justify-between text-xs text-gray-400">
                                                <span>Processing messages...</span>
                                                <span>Please wait</span>
                                            </div>
                                            <Progress value={66} className="h-1" />
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        )}
                        
                        {/* Summary Results */}
                        {summary && (
                            <>
                                {/* Stats Cards */}
                                <div className="grid grid-cols-3 gap-3">
                                    <Card className="bg-gray-100/50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700">
                                        <CardContent className="p-3 text-center">
                                            <MessageSquare className="w-5 h-5 mx-auto mb-1 text-blue-400" />
                                            <p className="text-lg font-bold text-gray-900 dark:text-white">{summary.stats.totalMessages}</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">Messages</p>
                                        </CardContent>
                                    </Card>
                                    <Card className="bg-gray-100/50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700">
                                        <CardContent className="p-3 text-center">
                                            <Users className="w-5 h-5 mx-auto mb-1 text-green-400" />
                                            <p className="text-lg font-bold text-gray-900 dark:text-white">{summary.stats.participants}</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">Participants</p>
                                        </CardContent>
                                    </Card>
                                    <Card className="bg-gray-100/50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700">
                                        <CardContent className="p-3 text-center">
                                            <Clock className="w-5 h-5 mx-auto mb-1 text-orange-400" />
                                            <p className="text-lg font-bold text-gray-900 dark:text-white">{summary.stats.duration}</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">Duration</p>
                                        </CardContent>
                                    </Card>
                                </div>
                                
                                {/* Tabs */}
                                <Tabs value={activeTab} onValueChange={setActiveTab}>
                                    <TabsList className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                                        <TabsTrigger value="summary" className="flex-1 data-[state=active]:bg-gray-200 dark:data-[state=active]:bg-gray-700">
                                            <BookOpen className="w-4 h-4 mr-2" />
                                            Summary
                                        </TabsTrigger>
                                        <TabsTrigger value="actions" className="flex-1 data-[state=active]:bg-gray-200 dark:data-[state=active]:bg-gray-700">
                                            <ListChecks className="w-4 h-4 mr-2" />
                                            Actions
                                        </TabsTrigger>
                                        <TabsTrigger value="insights" className="flex-1 data-[state=active]:bg-gray-200 dark:data-[state=active]:bg-gray-700">
                                            <Lightbulb className="w-4 h-4 mr-2" />
                                            Insights
                                        </TabsTrigger>
                                    </TabsList>
                                    
                                    {/* Summary Tab */}
                                    <TabsContent value="summary" className="mt-4 space-y-4">
                                        {/* Brief Summary */}
                                        <Card className="bg-gray-100/50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700">
                                            <CardHeader className="pb-2">
                                                <div className="flex items-center justify-between">
                                                    <CardTitle className="text-sm text-gray-900 dark:text-white flex items-center gap-2">
                                                        <Zap className="w-4 h-4 text-yellow-400" />
                                                        Quick Summary
                                                    </CardTitle>
                                                    <Button 
                                                        size="sm" 
                                                        variant="ghost"
                                                        onClick={() => copyToClipboard(summary.brief)}
                                                        className="h-7"
                                                    >
                                                        {copied ? (
                                                            <Check className="w-3 h-3 text-green-400" />
                                                        ) : (
                                                            <Copy className="w-3 h-3" />
                                                        )}
                                                    </Button>
                                                </div>
                                            </CardHeader>
                                            <CardContent>
                                                <p className="text-sm text-gray-700 dark:text-gray-300">{summary.brief}</p>
                                            </CardContent>
                                        </Card>
                                        
                                        {/* Detailed Summary */}
                                        <Card className="bg-gray-100/50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700">
                                            <CardHeader className="pb-2">
                                                <CardTitle className="text-sm text-gray-900 dark:text-white">Detailed Overview</CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line">
                                                    {summary.detailed}
                                                </div>
                                            </CardContent>
                                        </Card>
                                        
                                        {/* Key Points */}
                                        <Card className="bg-gray-100/50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700">
                                            <CardHeader className="pb-2">
                                                <CardTitle className="text-sm text-gray-900 dark:text-white flex items-center gap-2">
                                                    <Target className="w-4 h-4 text-blue-400" />
                                                    Key Points
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <ul className="space-y-2">
                                                    {summary.keyPoints.map((point, index) => (
                                                        <li 
                                                            key={index} 
                                                            className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300"
                                                        >
                                                            <span className="w-5 h-5 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center text-xs flex-shrink-0 mt-0.5">
                                                                {index + 1}
                                                            </span>
                                                            {point}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </CardContent>
                                        </Card>
                                    </TabsContent>
                                    
                                    {/* Actions Tab */}
                                    <TabsContent value="actions" className="mt-4 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                                                Action Items ({summary.actionItems.length})
                                            </h4>
                                            <Badge variant="outline" className="text-red-400 border-red-400/50">
                                                {summary.stats.urgentItems} urgent
                                            </Badge>
                                        </div>
                                        
                                        {summary.actionItems.map((item) => (
                                            <Card 
                                                key={item.id} 
                                                className={cn(
                                                    "bg-gray-100/50 dark:bg-gray-800/50 border",
                                                    getPriorityColor(item.priority)
                                                )}
                                            >
                                                <CardContent className="p-3">
                                                    <div className="flex items-start justify-between">
                                                        <div className="flex-1">
                                                            <p className="text-sm text-gray-900 dark:text-white font-medium">{item.task}</p>
                                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                                Assigned to: {item.assignee}
                                                            </p>
                                                        </div>
                                                        <Badge 
                                                            variant="outline" 
                                                            className={cn("text-xs", getPriorityColor(item.priority))}
                                                        >
                                                            {item.priority}
                                                        </Badge>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </TabsContent>
                                    
                                    {/* Insights Tab */}
                                    <TabsContent value="insights" className="mt-4 space-y-4">
                                        {/* Topics Distribution */}
                                        <Card className="bg-gray-100/50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700">
                                            <CardHeader className="pb-2">
                                                <CardTitle className="text-sm text-gray-900 dark:text-white flex items-center gap-2">
                                                    <Hash className="w-4 h-4 text-purple-400" />
                                                    Topics Discussed
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent className="space-y-3">
                                                {summary.topics.map((topic, index) => (
                                                    <div key={index}>
                                                        <div className="flex items-center justify-between mb-1">
                                                            <span className="text-sm text-gray-700 dark:text-gray-300">{topic.name}</span>
                                                            <span className="text-xs text-gray-500">
                                                                {topic.messages} msgs ({topic.percentage}%)
                                                            </span>
                                                        </div>
                                                        <Progress value={topic.percentage} className="h-2" />
                                                    </div>
                                                ))}
                                            </CardContent>
                                        </Card>
                                        
                                        {/* Timeline */}
                                        <Card className="bg-gray-100/50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700">
                                            <CardHeader className="pb-2">
                                                <CardTitle className="text-sm text-gray-900 dark:text-white flex items-center gap-2">
                                                    <Calendar className="w-4 h-4 text-orange-400" />
                                                    Timeline
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="relative pl-4 border-l border-gray-300 dark:border-gray-600 space-y-4">
                                                    {summary.timeline.map((event, index) => (
                                                        <div key={index} className="relative">
                                                            <div className={cn(
                                                                "absolute -left-[21px] w-4 h-4 rounded-full",
                                                                event.type === 'important' ? 'bg-red-500' :
                                                                event.type === 'decision' ? 'bg-green-500' :
                                                                'bg-blue-500'
                                                            )} />
                                                            <div>
                                                                <p className="text-xs text-gray-500">{event.date}</p>
                                                                <p className="text-sm text-gray-700 dark:text-gray-300">{event.event}</p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </CardContent>
                                        </Card>
                                        
                                        {/* Sentiment */}
                                        <Card className="bg-gray-100/50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700">
                                            <CardContent className="p-3">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <TrendingUp className="w-4 h-4 text-green-400" />
                                                        <span className="text-sm text-gray-700 dark:text-gray-300">Overall Sentiment</span>
                                                    </div>
                                                    <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                                                        {summary.stats.sentiment}
                                                    </Badge>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </TabsContent>
                                </Tabs>
                            </>
                        )}
                    </div>
                </ScrollArea>
                
                {/* Footer */}
                <div className="p-4 border-t border-gray-200 dark:border-gray-700/50 flex justify-between">
                    <Button variant="outline" onClick={() => onOpenChange(false)} className="border-gray-200 dark:border-gray-700">
                        Close
                    </Button>
                    <div className="flex gap-2">
                        {summary && (
                            <>
                                <Button 
                                    variant="outline" 
                                    onClick={() => setSummary(null)}
                                    className="border-gray-200 dark:border-gray-700"
                                >
                                    <RefreshCw className="w-4 h-4 mr-2" />
                                    Regenerate
                                </Button>
                                <Button 
                                    onClick={exportSummary}
                                    className="bg-green-600 hover:bg-green-700"
                                >
                                    <Download className="w-4 h-4 mr-2" />
                                    Export
                                </Button>
                            </>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default SummarizeView;
