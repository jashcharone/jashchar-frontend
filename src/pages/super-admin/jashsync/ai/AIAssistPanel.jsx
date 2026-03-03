import React, { useState, useEffect } from 'react';
import { 
    Sparkles, Wand2, MessageSquare, Languages, FileText, Copy, Check,
    RefreshCw, ChevronRight, Zap, Brain, Lightbulb, Edit3, Send,
    ThumbsUp, ThumbsDown, Loader2, Star, Settings, ArrowRight,
    Globe, BookOpen, PenTool, Mic, Volume2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useToast } from '@/components/ui/use-toast';
import api from "@/services/api";

/**
 * AIAssistPanel - AI-powered messaging assistant
 * Smart replies, message rewriting, tone adjustment
 */
const AIAssistPanel = ({ 
    onTranslate,
    onSummarize,
    currentMessage = '',
    conversationContext = [],
    onInsertReply
}) => {
    const { toast } = useToast();
    const [activeFeature, setActiveFeature] = useState('smart-reply');
    const [inputText, setInputText] = useState(currentMessage);
    const [outputText, setOutputText] = useState('');
    const [loading, setLoading] = useState(false);
    const [copied, setCopied] = useState(false);
    const [selectedTone, setSelectedTone] = useState('professional');
    const [selectedLength, setSelectedLength] = useState('medium');
    const [smartReplies, setSmartReplies] = useState([]);
    const [rewriteHistory, setRewriteHistory] = useState([]);
    const [aiCreditsUsed, setAiCreditsUsed] = useState(0);
    
    // AI Features
    const features = [
        { 
            id: 'smart-reply', 
            label: 'Smart Reply', 
            icon: Lightbulb, 
            description: 'AI-suggested responses',
            credits: 1
        },
        { 
            id: 'rewrite', 
            label: 'Rewrite', 
            icon: PenTool, 
            description: 'Improve your message',
            credits: 2
        },
        { 
            id: 'tone', 
            label: 'Tone Adjust', 
            icon: Wand2, 
            description: 'Change message tone',
            credits: 2
        },
        { 
            id: 'expand', 
            label: 'Expand', 
            icon: Edit3, 
            description: 'Make it longer',
            credits: 1
        },
        { 
            id: 'shorten', 
            label: 'Shorten', 
            icon: Zap, 
            description: 'Make it concise',
            credits: 1
        },
    ];
    
    // Tone options
    const toneOptions = [
        { id: 'professional', label: 'Professional', emoji: '👔' },
        { id: 'friendly', label: 'Friendly', emoji: '😊' },
        { id: 'formal', label: 'Formal', emoji: '📋' },
        { id: 'casual', label: 'Casual', emoji: '💬' },
        { id: 'empathetic', label: 'Empathetic', emoji: '🤗' },
        { id: 'urgent', label: 'Urgent', emoji: '⚡' },
    ];
    
    // Length options
    const lengthOptions = [
        { id: 'short', label: 'Short', description: '1-2 sentences' },
        { id: 'medium', label: 'Medium', description: '3-4 sentences' },
        { id: 'long', label: 'Detailed', description: '5+ sentences' },
    ];
    
    // Update input when currentMessage changes
    useEffect(() => {
        if (currentMessage) {
            setInputText(currentMessage);
        }
    }, [currentMessage]);
    
    // Generate smart replies based on context
    const generateSmartReplies = async () => {
        setLoading(true);
        try {
            // Simulate AI processing
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            // Mock smart replies based on context
            const mockReplies = [
                {
                    id: 1,
                    text: "Thank you for the update. I'll review this and get back to you shortly.",
                    tone: 'professional',
                    confidence: 95
                },
                {
                    id: 2,
                    text: "Got it! Let me check and confirm.",
                    tone: 'casual',
                    confidence: 88
                },
                {
                    id: 3,
                    text: "I appreciate you sharing this information. Could you please provide more details?",
                    tone: 'formal',
                    confidence: 82
                },
                {
                    id: 4,
                    text: "Thanks! I'll look into it right away. 👍",
                    tone: 'friendly',
                    confidence: 78
                }
            ];
            
            setSmartReplies(mockReplies);
            setAiCreditsUsed(prev => prev + 1);
            
        } catch (error) {
            console.error('Failed to generate smart replies:', error);
            toast({ title: "Error", description: 'Failed to generate replies', variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };
    
    // Rewrite message
    const rewriteMessage = async () => {
        if (!inputText.trim()) {
            toast({ title: "Error", description: 'Please enter a message to rewrite', variant: "destructive" });
            return;
        }
        
        setLoading(true);
        try {
            await new Promise(resolve => setTimeout(resolve, 1200));
            
            // Mock rewrite based on feature
            let rewritten = '';
            
            switch (activeFeature) {
                case 'rewrite':
                    rewritten = improveText(inputText);
                    break;
                case 'tone':
                    rewritten = changeTone(inputText, selectedTone);
                    break;
                case 'expand':
                    rewritten = expandText(inputText);
                    break;
                case 'shorten':
                    rewritten = shortenText(inputText);
                    break;
                default:
                    rewritten = inputText;
            }
            
            setOutputText(rewritten);
            setRewriteHistory(prev => [{
                original: inputText,
                rewritten,
                feature: activeFeature,
                timestamp: new Date()
            }, ...prev.slice(0, 9)]);
            
            setAiCreditsUsed(prev => prev + 2);
            
        } catch (error) {
            console.error('Failed to rewrite message:', error);
            toast({ title: "Error", description: 'Failed to process message', variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };
    
    // Mock text transformation functions
    const improveText = (text) => {
        // Simulate grammar and clarity improvements
        const improvements = [
            { from: /\bi\b/g, to: 'I' },
            { from: /\bu\b/gi, to: 'you' },
            { from: /\bur\b/gi, to: 'your' },
            { from: /\bpls\b/gi, to: 'please' },
            { from: /\bthx\b/gi, to: 'thank you' },
        ];
        
        let improved = text;
        improvements.forEach(({ from, to }) => {
            improved = improved.replace(from, to);
        });
        
        // Capitalize first letter
        improved = improved.charAt(0).toUpperCase() + improved.slice(1);
        
        // Ensure proper ending
        if (!/[.!?]$/.test(improved)) {
            improved += '.';
        }
        
        return improved;
    };
    
    const changeTone = (text, tone) => {
        const toneTemplates = {
            professional: `I would like to inform you that ${text.toLowerCase()}`,
            friendly: `Hey! Just wanted to let you know - ${text.toLowerCase()} 😊`,
            formal: `Please be advised that ${text.toLowerCase()}`,
            casual: `So basically, ${text.toLowerCase()}`,
            empathetic: `I understand, and ${text.toLowerCase()}`,
            urgent: `⚠️ IMPORTANT: ${text.toUpperCase()}`
        };
        
        return toneTemplates[tone] || text;
    };
    
    const expandText = (text) => {
        return `${text} I wanted to provide you with more context on this matter. Please feel free to reach out if you have any questions or need further clarification. I'm happy to discuss this in more detail at your convenience.`;
    };
    
    const shortenText = (text) => {
        // Take first sentence or first 50 chars
        const firstSentence = text.split(/[.!?]/)[0];
        return firstSentence.length > 50 ? firstSentence.substring(0, 50) + '...' : firstSentence + '.';
    };
    
    // Copy to clipboard
    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        toast({ title: "Copied", description: 'Text copied to clipboard' });
        setTimeout(() => setCopied(false), 2000);
    };
    
    // Use reply
    const useReply = (text) => {
        onInsertReply?.(text);
        toast({ title: "Success", description: 'Reply inserted' });
    };
    
    return (
        <div className="h-full flex flex-col bg-white dark:bg-gray-900">
            {/* Header */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700/50">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                            <Brain className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">AI Assistant</h2>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Powered by JashSync AI</p>
                        </div>
                    </div>
                    <Badge variant="outline" className="text-purple-400 border-purple-400/50">
                        <Sparkles className="w-3 h-3 mr-1" />
                        {aiCreditsUsed} credits used
                    </Badge>
                </div>
                
                {/* Quick Actions */}
                <div className="flex gap-2">
                    <Button 
                        variant="outline" 
                        size="sm"
                        onClick={onTranslate}
                        className="flex-1 border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800"
                    >
                        <Languages className="w-4 h-4 mr-2" />
                        Translate
                    </Button>
                    <Button 
                        variant="outline" 
                        size="sm"
                        onClick={onSummarize}
                        className="flex-1 border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800"
                    >
                        <FileText className="w-4 h-4 mr-2" />
                        Summarize
                    </Button>
                </div>
            </div>
            
            {/* Feature Tabs */}
            <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700/50">
                <ScrollArea className="w-full" orientation="horizontal">
                    <div className="flex gap-2">
                        {features.map((feature) => {
                            const Icon = feature.icon;
                            return (
                                <Button
                                    key={feature.id}
                                    variant={activeFeature === feature.id ? "default" : "ghost"}
                                    size="sm"
                                    onClick={() => setActiveFeature(feature.id)}
                                    className={cn(
                                        "flex-shrink-0",
                                        activeFeature === feature.id 
                                            ? "bg-purple-600 hover:bg-purple-700" 
                                            : "hover:bg-gray-100 dark:hover:bg-gray-800"
                                    )}
                                >
                                    <Icon className="w-4 h-4 mr-1" />
                                    {feature.label}
                                </Button>
                            );
                        })}
                    </div>
                </ScrollArea>
            </div>
            
            {/* Content Area */}
            <ScrollArea className="flex-1 p-4">
                {activeFeature === 'smart-reply' ? (
                    /* Smart Reply Feature */
                    <div className="space-y-4">
                        <Card className="bg-gray-100/50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm text-gray-900 dark:text-white flex items-center gap-2">
                                    <Lightbulb className="w-4 h-4 text-yellow-400" />
                                    Smart Reply Suggestions
                                </CardTitle>
                                <CardDescription className="text-xs">
                                    AI-generated responses based on conversation context
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Button 
                                    onClick={generateSmartReplies}
                                    disabled={loading}
                                    className="w-full bg-purple-600 hover:bg-purple-700 mb-4"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            Generating...
                                        </>
                                    ) : (
                                        <>
                                            <Sparkles className="w-4 h-4 mr-2" />
                                            Generate Smart Replies
                                        </>
                                    )}
                                </Button>
                                
                                {smartReplies.length > 0 && (
                                    <div className="space-y-3">
                                        {smartReplies.map((reply) => (
                                            <div 
                                                key={reply.id}
                                                className="p-3 rounded-lg bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 hover:border-purple-500/50 transition-colors group"
                                            >
                                                <p className="text-sm text-gray-700 dark:text-gray-200 mb-2">{reply.text}</p>
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <Badge variant="outline" className="text-xs">
                                                            {reply.tone}
                                                        </Badge>
                                                        <span className="text-xs text-gray-500">
                                                            {reply.confidence}% match
                                                        </span>
                                                    </div>
                                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <Button 
                                                            size="sm" 
                                                            variant="ghost"
                                                            onClick={() => copyToClipboard(reply.text)}
                                                            className="h-7 w-7 p-0"
                                                        >
                                                            <Copy className="w-3 h-3" />
                                                        </Button>
                                                        <Button 
                                                            size="sm"
                                                            onClick={() => useReply(reply.text)}
                                                            className="h-7 bg-purple-600 hover:bg-purple-700"
                                                        >
                                                            <Send className="w-3 h-3 mr-1" />
                                                            Use
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                
                                {smartReplies.length === 0 && !loading && (
                                    <div className="text-center py-6 text-gray-500 dark:text-gray-500">
                                        <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                        <p className="text-sm">Click generate to get AI suggestions</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                ) : (
                    /* Rewrite Features */
                    <div className="space-y-4">
                        {/* Input */}
                        <div>
                            <Label className="text-sm text-gray-500 dark:text-gray-400 mb-2 block">
                                Your Message
                            </Label>
                            <Textarea
                                value={inputText}
                                onChange={(e) => setInputText(e.target.value)}
                                placeholder="Enter or paste your message here..."
                                className="bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 min-h-[100px] text-gray-900 dark:text-white"
                            />
                        </div>
                        
                        {/* Tone Selection (for tone feature) */}
                        {activeFeature === 'tone' && (
                            <div>
                                <Label className="text-sm text-gray-500 dark:text-gray-400 mb-2 block">
                                    Select Tone
                                </Label>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                    {toneOptions.map((tone) => (
                                        <Button
                                            key={tone.id}
                                            variant={selectedTone === tone.id ? "default" : "outline"}
                                            size="sm"
                                            onClick={() => setSelectedTone(tone.id)}
                                            className={cn(
                                                "justify-start",
                                                selectedTone === tone.id 
                                                    ? "bg-purple-600" 
                                                    : "border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800"
                                            )}
                                        >
                                            <span className="mr-2">{tone.emoji}</span>
                                            {tone.label}
                                        </Button>
                                    ))}
                                </div>
                            </div>
                        )}
                        
                        {/* Process Button */}
                        <Button 
                            onClick={rewriteMessage}
                            disabled={loading || !inputText.trim()}
                            className="w-full bg-purple-600 hover:bg-purple-700"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Processing...
                                </>
                            ) : (
                                <>
                                    <Wand2 className="w-4 h-4 mr-2" />
                                    {activeFeature === 'rewrite' && 'Improve Message'}
                                    {activeFeature === 'tone' && 'Change Tone'}
                                    {activeFeature === 'expand' && 'Expand Message'}
                                    {activeFeature === 'shorten' && 'Shorten Message'}
                                </>
                            )}
                        </Button>
                        
                        {/* Output */}
                        {outputText && (
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <Label className="text-sm text-gray-500 dark:text-gray-400">
                                        AI Result
                                    </Label>
                                    <div className="flex gap-1">
                                        <Button 
                                            size="sm" 
                                            variant="ghost"
                                            onClick={() => copyToClipboard(outputText)}
                                            className="h-7"
                                        >
                                            {copied ? (
                                                <Check className="w-3 h-3 text-green-400" />
                                            ) : (
                                                <Copy className="w-3 h-3" />
                                            )}
                                        </Button>
                                        <Button 
                                            size="sm"
                                            onClick={() => useReply(outputText)}
                                            className="h-7 bg-purple-600 hover:bg-purple-700"
                                        >
                                            <Send className="w-3 h-3 mr-1" />
                                            Use This
                                        </Button>
                                    </div>
                                </div>
                                <div className="p-3 rounded-lg bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/30">
                                    <p className="text-sm text-gray-700 dark:text-gray-200">{outputText}</p>
                                </div>
                            </div>
                        )}
                        
                        {/* Feedback */}
                        {outputText && (
                            <div className="flex items-center justify-center gap-4 pt-2">
                                <span className="text-xs text-gray-500">Was this helpful?</span>
                                <div className="flex gap-2">
                                    <Button size="sm" variant="ghost" className="h-7 hover:text-green-400">
                                        <ThumbsUp className="w-3 h-3" />
                                    </Button>
                                    <Button size="sm" variant="ghost" className="h-7 hover:text-red-400">
                                        <ThumbsDown className="w-3 h-3" />
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
                
                {/* Rewrite History */}
                {rewriteHistory.length > 0 && activeFeature !== 'smart-reply' && (
                    <div className="mt-6">
                        <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">Recent Rewrites</h4>
                        <div className="space-y-2">
                            {rewriteHistory.slice(0, 3).map((item, index) => (
                                <div 
                                    key={index}
                                    className="p-2 rounded-lg bg-gray-100/50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700/50 text-xs"
                                >
                                    <div className="flex items-center justify-between mb-1">
                                        <Badge variant="outline" className="text-[10px]">
                                            {item.feature}
                                        </Badge>
                                        <span className="text-gray-500">
                                            {new Date(item.timestamp).toLocaleTimeString()}
                                        </span>
                                    </div>
                                    <p className="text-gray-500 dark:text-gray-400 truncate">{item.rewritten}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </ScrollArea>
            
            {/* Footer Tips */}
            <div className="p-3 border-t border-gray-200 dark:border-gray-700/50 bg-gray-100/30 dark:bg-gray-800/30">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Sparkles className="w-3 h-3 text-purple-400" />
                    <span>Tip: AI suggestions improve with more conversation context</span>
                </div>
            </div>
        </div>
    );
};

export default AIAssistPanel;
