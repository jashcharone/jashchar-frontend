/**
 * AI Chatbot Component
 * Intelligent assistant for School ERP
 */
import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import api from '@/lib/api';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import {
  MessageCircle, Send, X, Minimize2, Maximize2, Bot, User,
  Calendar, IndianRupee, FileText, UserPlus, GraduationCap,
  Loader2, Sparkles, HelpCircle, Shield, Building, CreditCard, 
  Package, GitBranch
} from 'lucide-react';

// Message Component
const ChatMessage = ({ message, isBot }) => (
  <div className={`flex gap-3 ${isBot ? '' : 'flex-row-reverse'}`}>
    <Avatar className="h-8 w-8 shrink-0">
      {isBot ? (
        <>
          <AvatarImage src="/jashbot-avatar.png" />
          <AvatarFallback className="bg-primary text-primary-foreground">
            <Bot className="h-4 w-4" />
          </AvatarFallback>
        </>
      ) : (
        <AvatarFallback className="bg-secondary">
          <User className="h-4 w-4" />
        </AvatarFallback>
      )}
    </Avatar>
    <div
      className={`max-w-[80%] rounded-lg px-4 py-2 ${
        isBot
          ? 'bg-muted text-foreground'
          : 'bg-primary text-primary-foreground'
      }`}
    >
      <div className="text-sm whitespace-pre-wrap prose prose-sm dark:prose-invert max-w-none">
        {message.content}
      </div>
      <div className={`text-xs mt-1 ${isBot ? 'text-muted-foreground' : 'text-primary-foreground/70'}`}>
        {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </div>
    </div>
  </div>
);

// Quick Action Button
const QuickAction = ({ icon: Icon, title, onClick }) => (
  <Button
    variant="outline"
    size="sm"
    onClick={onClick}
    className="flex items-center gap-2 h-auto py-2 px-3 text-left"
  >
    <Icon className="h-4 w-4 shrink-0 text-primary" />
    <span className="text-xs">{title}</span>
  </Button>
);

// Data Response Card
const DataResponseCard = ({ data }) => {
  if (!data) return null;

  return (
    <Card className="bg-primary/5 border-primary/20">
      <CardHeader className="py-3 px-4">
        <CardTitle className="text-sm flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          {data.title}
        </CardTitle>
      </CardHeader>
      <CardContent className="py-2 px-4">
        {data.data && (
          <div className="grid grid-cols-2 gap-2 mb-2">
            {Object.entries(data.data).map(([key, value]) => (
              <div key={key} className="text-sm">
                <span className="text-muted-foreground capitalize">{key.replace(/_/g, ' ')}: </span>
                <span className="font-medium">{value}</span>
              </div>
            ))}
          </div>
        )}
        <p className="text-sm text-muted-foreground">{data.message}</p>
      </CardContent>
    </Card>
  );
};

const AIChatbot = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      role: 'assistant',
      content: `Hello! 👋 I'm JashBot, your intelligent School ERP assistant.\n\nI can help you with:\n• 🔐 Master Admin features\n• 🎓 Student management\n• 💰 Fee collection queries\n• 📊 Attendance tracking\n• 📝 Exam management\n• 📦 Module Registry\n• And much more!\n\nTry asking: "Master Admin enu kelsa madutte?" (What does Master Admin do?)`,
      timestamp: new Date().toISOString()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const scrollAreaRef = useRef(null);
  const inputRef = useRef(null);

  // Fetch suggestions on mount (only when authenticated)
  useEffect(() => {
    // Skip fetching if user is not authenticated
    if (!user) return;
    
    const fetchSuggestions = async () => {
      try {
        const response = await api.get('/ai/suggestions');
        if (response.data.success) {
          setSuggestions(response.data.data);
        }
      } catch (error) {
        // Silently ignore auth errors on public pages
        if (error?.response?.status !== 401) {
          console.error('Error fetching suggestions:', error);
        }
      }
    };
    fetchSuggestions();
  }, [user]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && !isMinimized && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen, isMinimized]);

  // Handle send message
  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = {
      id: Date.now(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // First try smart query for data-based responses
      const smartQueryRes = await api.post('/ai/smart-query', { query: input });
      
      if (smartQueryRes.data.success && smartQueryRes.data.data.type === 'data') {
        const dataResponse = smartQueryRes.data.data;
        setMessages(prev => [
          ...prev,
          {
            id: Date.now() + 1,
            role: 'assistant',
            content: dataResponse.message,
            dataCard: dataResponse,
            timestamp: new Date().toISOString()
          }
        ]);
      } else {
        // Use AI chat for general queries
        const context = messages.slice(-10).map(m => ({
          role: m.role === 'assistant' ? 'assistant' : 'user',
          content: m.content
        }));

        const response = await api.post('/ai/chat', {
          message: input,
          context
        });

        if (response.data.success) {
          setMessages(prev => [
            ...prev,
            {
              id: Date.now() + 1,
              role: 'assistant',
              content: response.data.data.message,
              timestamp: response.data.data.timestamp
            }
          ]);
        }
      }
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [
        ...prev,
        {
          id: Date.now() + 1,
          role: 'assistant',
          content: "I'm sorry, I encountered an error. Please try again.",
          timestamp: new Date().toISOString()
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle quick action click
  const handleQuickAction = (query) => {
    setInput(query);
    setTimeout(() => {
      handleSend();
    }, 100);
  };

  // Handle key press
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Icon map for suggestions
  const iconMap = {
    Calendar: Calendar,
    IndianRupee: IndianRupee,
    FileText: FileText,
    UserPlus: UserPlus,
    GraduationCap: GraduationCap,
    MessageCircle: MessageCircle,
    // Master Admin icons
    Shield: Shield,
    Building: Building,
    CreditCard: CreditCard,
    Package: Package,
    GitBranch: GitBranch
  };

  // Don't show chatbot for unauthenticated users (public pages)
  if (!user) {
    console.log('[AIChatbot] No user, hiding chatbot');
    return null;
  }

  console.log('[AIChatbot] User authenticated, showing chatbot button');

  // Floating Button (when closed)
  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-24 h-16 w-16 rounded-full shadow-2xl z-[9999] bg-blue-600 hover:bg-blue-700 border-4 border-white"
        size="icon"
        title="Open AI Chatbot"
      >
        <MessageCircle className="h-8 w-8 text-white" />
        <span className="absolute -top-1 -right-1 h-5 w-5 bg-green-500 rounded-full animate-pulse border-2 border-white" />
      </Button>
    );
  }

  // Minimized State
  if (isMinimized) {
    return (
      <div className="fixed bottom-6 right-24 z-[9999]">
        <Card className="w-72 shadow-xl">
          <CardHeader className="py-3 px-4 flex flex-row items-center justify-between bg-primary text-primary-foreground rounded-t-lg">
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              <span className="font-semibold">JashBot</span>
            </div>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-primary-foreground hover:bg-primary-foreground/20"
                onClick={() => setIsMinimized(false)}
              >
                <Maximize2 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-primary-foreground hover:bg-primary-foreground/20"
                onClick={() => setIsOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // Full Chat Window
  return (
    <div className="fixed bottom-6 right-24 z-[9999]">
      <Card className="w-96 h-[600px] shadow-2xl flex flex-col">
        {/* Header */}
        <CardHeader className="py-3 px-4 flex flex-row items-center justify-between bg-primary text-primary-foreground rounded-t-lg shrink-0">
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-primary-foreground text-primary">
                <Bot className="h-4 w-4" />
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold text-sm">JashBot</h3>
              <p className="text-xs text-primary-foreground/70">AI Assistant • Online</p>
            </div>
          </div>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-primary-foreground hover:bg-primary-foreground/20"
              onClick={() => setIsMinimized(true)}
            >
              <Minimize2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-primary-foreground hover:bg-primary-foreground/20"
              onClick={() => setIsOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        {/* Messages Area */}
        <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
          <div className="space-y-4">
            {messages.map((message) => (
              <div key={message.id}>
                <ChatMessage
                  message={message}
                  isBot={message.role === 'assistant'}
                />
                {message.dataCard && (
                  <div className="mt-2 ml-11">
                    <DataResponseCard data={message.dataCard} />
                  </div>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    <Bot className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="bg-muted rounded-lg px-4 py-3">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Quick Actions */}
        {messages.length <= 2 && suggestions.length > 0 && (
          <div className="px-4 py-2 border-t bg-muted/30 shrink-0">
            <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
              <HelpCircle className="h-3 w-3" />
              Quick actions:
            </p>
            <div className="flex flex-wrap gap-2">
              {suggestions.slice(0, 4).map((suggestion) => {
                const Icon = iconMap[suggestion.icon] || MessageCircle;
                return (
                  <QuickAction
                    key={suggestion.id}
                    icon={Icon}
                    title={suggestion.title}
                    onClick={() => handleQuickAction(suggestion.query)}
                  />
                );
              })}
            </div>
          </div>
        )}

        {/* Input Area */}
        <div className="p-4 border-t shrink-0">
          <div className="flex gap-2">
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              disabled={isLoading}
              className="flex-1"
            />
            <Button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              size="icon"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground text-center mt-2">
            Powered by AI • Ask anything about School ERP
          </p>
        </div>
      </Card>
    </div>
  );
};

export default AIChatbot;
