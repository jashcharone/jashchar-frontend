/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * JASHFLOW AI - AI TASK GENERATOR PAGE
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Features:
 * - Natural language → Task (Type or speak in any language)
 * - AI Smart Suggestions based on school context
 * - Team Workload Analysis
 * - Daily Summary Dashboard
 * - Voice-to-Task (Web Speech API)
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Brain, Mic, MicOff, Sparkles, Send, Loader2, 
  Lightbulb, Users, BarChart3, Calendar, Clock,
  AlertTriangle, CheckCircle2, ArrowRight, Zap,
  TrendingUp, Target, RefreshCw, Plus, ChevronRight,
  MessageCircle
} from 'lucide-react';
import { formatDate } from '@/utils/dateUtils';

export default function AITaskGenerator() {
  const navigate = useNavigate();
  const { user, organizationId } = useAuth();
  const { selectedBranch } = useBranch();

  // Natural Language Input
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [parsedTask, setParsedTask] = useState(null);
  const [isListening, setIsListening] = useState(false);

  // AI Suggestions
  const [suggestions, setSuggestions] = useState([]);
  const [suggestionType, setSuggestionType] = useState('general');
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  // Workload
  const [workload, setWorkload] = useState(null);
  const [loadingWorkload, setLoadingWorkload] = useState(false);

  // Daily Summary
  const [dailySummary, setDailySummary] = useState(null);
  const [loadingSummary, setLoadingSummary] = useState(false);

  // Task Plan (Multi-Task Generation)
  const [taskPlan, setTaskPlan] = useState(null);
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  const [creatingTasks, setCreatingTasks] = useState({});

  // Active Tab
  const [activeTab, setActiveTab] = useState('create');

  // AI Query
  const [queryText, setQueryText] = useState('');
  const [queryResult, setQueryResult] = useState(null);
  const [isQuerying, setIsQuerying] = useState(false);
  const [queryHistory, setQueryHistory] = useState([]);

  const basePath = user?.role === 'super_admin' ? 'super-admin' : 'admin';

  // Load data on mount
  useEffect(() => {
    loadDailySummary();
    loadSuggestions();
  }, []);

  // ==========================================
  // NATURAL LANGUAGE PARSING
  // ==========================================

  const handleParseTask = async () => {
    if (!inputText.trim()) return;
    setIsProcessing(true);
    setParsedTask(null);

    try {
      const response = await api.post('/tasks/ai/parse', {
        text: inputText,
        organization_id: organizationId,
        branch_id: selectedBranch?.id
      });

      if (response.data?.success) {
        setParsedTask(response.data);
      }
    } catch (error) {
      console.error('Parse error:', error);
      setParsedTask({ 
        success: false, 
        title: inputText, 
        description: inputText,
        confidence: 0,
        ai_generated: false 
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCreateFromParsed = () => {
    if (!parsedTask) return;
    // Navigate to create task with pre-filled data
    const params = new URLSearchParams();
    if (parsedTask.title) params.set('title', parsedTask.title);
    if (parsedTask.description) params.set('description', parsedTask.description);
    if (parsedTask.due_date) params.set('due_date', parsedTask.due_date);
    if (parsedTask.category_id) params.set('category_id', parsedTask.category_id);
    if (parsedTask.priority_id) params.set('priority_id', parsedTask.priority_id);

    navigate(`/${basePath}/task-management/tasks/create?${params.toString()}`);
  };

  // ==========================================
  // TASK PLAN (MULTI-TASK GENERATION)
  // ==========================================

  const handleGeneratePlan = async () => {
    if (!inputText.trim()) return;
    setIsGeneratingPlan(true);
    setTaskPlan(null);
    setParsedTask(null);

    try {
      const response = await api.post('/tasks/ai/generate-plan', {
        text: inputText,
        organization_id: organizationId,
        branch_id: selectedBranch?.id
      });

      if (response.data?.success) {
        setTaskPlan(response.data);
      }
    } catch (error) {
      console.error('Plan generation error:', error);
    } finally {
      setIsGeneratingPlan(false);
    }
  };

  const handleCreatePlanTask = (task) => {
    const params = new URLSearchParams();
    if (task.title) params.set('title', task.title);
    if (task.description) params.set('description', task.description);
    if (task.due_date) params.set('due_date', task.due_date);
    if (task.category_id) params.set('category_id', task.category_id);
    if (task.priority_id) params.set('priority_id', task.priority_id);
    navigate(`/${basePath}/task-management/tasks/create?${params.toString()}`);
  };

  const handleCreateAllPlanTasks = async () => {
    if (!taskPlan?.tasks?.length) return;
    const results = { success: 0, failed: 0 };

    for (const task of taskPlan.tasks) {
      setCreatingTasks(prev => ({ ...prev, [task.id]: 'creating' }));
      try {
        await api.post('/tasks', {
          title: task.title,
          description: task.description,
          due_date: task.due_date,
          category_id: task.category_id || undefined,
          priority_id: task.priority_id || undefined,
          task_type: task.task_type || 'individual',
          status: 'pending',
          branch_id: selectedBranch?.id,
          organization_id: organizationId
        });
        setCreatingTasks(prev => ({ ...prev, [task.id]: 'done' }));
        results.success++;
      } catch (err) {
        console.error('Create task error:', err);
        setCreatingTasks(prev => ({ ...prev, [task.id]: 'error' }));
        results.failed++;
      }
    }

    if (results.success > 0) {
      loadDailySummary();
    }
  };

  // ==========================================
  // VOICE INPUT
  // ==========================================

  const toggleVoiceInput = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Voice input is not supported in this browser. Please use Chrome.');
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-IN'; // Indian English (also catches Hindi/Kannada romanized)
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInputText(prev => prev ? `${prev} ${transcript}` : transcript);
      setIsListening(false);
    };

    recognition.start();
  };

  // ==========================================
  // AI SUGGESTIONS
  // ==========================================

  const loadSuggestions = useCallback(async (type = suggestionType) => {
    setLoadingSuggestions(true);
    try {
      const response = await api.get('/tasks/ai/suggestions', {
        params: {
          organization_id: organizationId,
          branch_id: selectedBranch?.id,
          type
        }
      });

      if (response.data?.success) {
        setSuggestions(response.data.suggestions || []);
      }
    } catch (error) {
      console.error('Suggestions error:', error);
    } finally {
      setLoadingSuggestions(false);
    }
  }, [organizationId, selectedBranch?.id, suggestionType]);

  const handleSuggestionTypeChange = (type) => {
    setSuggestionType(type);
    loadSuggestions(type);
  };

  const handleCreateFromSuggestion = (suggestion) => {
    const params = new URLSearchParams();
    params.set('title', suggestion.title);
    params.set('description', suggestion.description);
    if (suggestion.suggested_due_date) params.set('due_date', suggestion.suggested_due_date);
    navigate(`/${basePath}/task-management/tasks/create?${params.toString()}`);
  };

  // ==========================================
  // WORKLOAD
  // ==========================================

  const loadWorkload = async () => {
    setLoadingWorkload(true);
    try {
      const response = await api.get('/tasks/ai/workload', {
        params: {
          organization_id: organizationId,
          branch_id: selectedBranch?.id
        }
      });

      if (response.data?.success) {
        setWorkload(response.data);
      }
    } catch (error) {
      console.error('Workload error:', error);
    } finally {
      setLoadingWorkload(false);
    }
  };

  // ==========================================
  // DAILY SUMMARY
  // ==========================================

  const loadDailySummary = async () => {
    setLoadingSummary(true);
    try {
      const response = await api.get('/tasks/ai/daily-summary', {
        params: {
          organization_id: organizationId,
          branch_id: selectedBranch?.id
        }
      });

      if (response.data?.success) {
        setDailySummary(response.data);
      }
    } catch (error) {
      console.error('Summary error:', error);
    } finally {
      setLoadingSummary(false);
    }
  };

  // ==========================================
  // RENDER
  // ==========================================

  const tabs = [
    { id: 'create', label: 'AI Create', icon: Brain },
    { id: 'suggestions', label: 'Smart Suggestions', icon: Lightbulb },
    { id: 'workload', label: 'Team Workload', icon: Users },
    { id: 'ask', label: 'Ask AI', icon: MessageCircle },
  ];

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-blue-600 text-white">
              <Brain className="w-7 h-7" />
            </div>
            JashFlow AI
          </h1>
          <p className="text-muted-foreground mt-1">
            {dailySummary?.greeting || 'Hello'}! AI-powered task intelligence
          </p>
        </div>
      </div>

      {/* Daily Summary Cards */}
      {dailySummary?.summary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <SummaryCard 
            icon={Plus} 
            label="Created Today" 
            value={dailySummary.summary.created_today} 
            color="blue" 
          />
          <SummaryCard 
            icon={CheckCircle2} 
            label="Completed Today" 
            value={dailySummary.summary.completed_today} 
            color="green" 
          />
          <SummaryCard 
            icon={Calendar} 
            label="Due Tomorrow" 
            value={dailySummary.summary.due_tomorrow} 
            color="yellow" 
          />
          <SummaryCard 
            icon={AlertTriangle} 
            label="Overdue" 
            value={dailySummary.summary.overdue} 
            color={dailySummary.summary.overdue > 0 ? 'red' : 'green'} 
          />
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-lg bg-muted/50 w-fit">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id);
              if (tab.id === 'workload' && !workload) loadWorkload();
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all
              ${activeTab === tab.id 
                ? 'bg-background shadow-sm text-foreground' 
                : 'text-muted-foreground hover:text-foreground'}`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'create' && (
        <div className="space-y-6">
          {/* AI Input Box */}
          <Card className="border-2 border-purple-500/20 bg-gradient-to-br from-purple-500/5 to-blue-500/5">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-500" />
                Type or Speak a Task
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Describe your task in any language - English, Kannada, Hindi... AI will understand!
                <br />
                <span className="text-xs">
                  <Send className="w-3 h-3 inline mr-1" />Single task &nbsp;|&nbsp; 
                  <Target className="w-3 h-3 inline mr-1" />Generate full plan with multiple tasks
                </span>
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <textarea
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder='e.g. "Next Friday olage Ramesh sir admission forms collect maadbekku" or "Create urgent task for fee collection follow up"'
                    rows={3}
                    className="w-full rounded-lg border bg-background px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleParseTask();
                      }
                    }}
                  />
                  {isListening && (
                    <div className="absolute top-2 right-2 flex items-center gap-1 text-red-500 animate-pulse">
                      <div className="w-2 h-2 rounded-full bg-red-500" />
                      <span className="text-xs">Listening...</span>
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <button
                    onClick={toggleVoiceInput}
                    className={`p-3 rounded-lg transition-all ${
                      isListening 
                        ? 'bg-red-500 text-white animate-pulse' 
                        : 'bg-muted hover:bg-muted/80 text-foreground'
                    }`}
                    title={isListening ? 'Stop listening' : 'Start voice input'}
                  >
                    {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                  </button>
                  <button
                    onClick={handleParseTask}
                    disabled={!inputText.trim() || isProcessing || isGeneratingPlan}
                    className="p-3 rounded-lg bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    title="Parse single task"
                  >
                    {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                  </button>
                  <button
                    onClick={handleGeneratePlan}
                    disabled={!inputText.trim() || isGeneratingPlan || isProcessing}
                    className="p-3 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    title="Generate task plan (multiple tasks)"
                  >
                    {isGeneratingPlan ? <Loader2 className="w-5 h-5 animate-spin" /> : <Target className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Parsed Task Result */}
              {parsedTask && (
                <div className="rounded-lg border bg-background p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold flex items-center gap-2">
                      <Zap className="w-4 h-4 text-yellow-500" />
                      AI Parsed Task
                    </h3>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      parsedTask.confidence >= 0.8 ? 'bg-green-500/10 text-green-600' :
                      parsedTask.confidence >= 0.5 ? 'bg-yellow-500/10 text-yellow-600' :
                      'bg-red-500/10 text-red-600'
                    }`}>
                      {Math.round((parsedTask.confidence || 0) * 100)}% confidence
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-muted-foreground">Title:</span>
                      <p className="font-medium">{parsedTask.title}</p>
                    </div>
                    {parsedTask.description && parsedTask.description !== parsedTask.title && (
                      <div>
                        <span className="text-muted-foreground">Description:</span>
                        <p>{parsedTask.description}</p>
                      </div>
                    )}
                    {parsedTask.due_date && (
                      <div>
                        <span className="text-muted-foreground">Due Date:</span>
                        <p className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDate(parsedTask.due_date)}
                        </p>
                      </div>
                    )}
                    {parsedTask.assignee_hint && (
                      <div>
                        <span className="text-muted-foreground">Assignee:</span>
                        <p className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {parsedTask.assignee_hint}
                        </p>
                      </div>
                    )}
                    {parsedTask.assigned_user_ids?.length > 0 && (
                      <div>
                        <span className="text-muted-foreground">Matched Staff:</span>
                        <p className="text-green-600">{parsedTask.assigned_user_ids.length} staff matched</p>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={handleCreateFromParsed}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700 text-sm font-medium transition-all"
                    >
                      <Plus className="w-4 h-4" />
                      Create This Task
                    </button>
                    <button
                      onClick={() => { setParsedTask(null); setInputText(''); }}
                      className="px-4 py-2 rounded-lg bg-muted hover:bg-muted/80 text-sm transition-all"
                    >
                      Clear
                    </button>
                  </div>
                </div>
              )}

              {/* Task Plan Result (Multiple Tasks) */}
              {taskPlan && (
                <div className="rounded-lg border-2 border-blue-500/20 bg-gradient-to-br from-blue-500/5 to-purple-500/5 p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold flex items-center gap-2 text-lg">
                        <Target className="w-5 h-5 text-blue-500" />
                        {taskPlan.plan_title}
                      </h3>
                      {taskPlan.plan_description && (
                        <p className="text-sm text-muted-foreground mt-1">{taskPlan.plan_description}</p>
                      )}
                    </div>
                    <span className="text-xs px-3 py-1 rounded-full bg-blue-500/10 text-blue-600 font-medium">
                      {taskPlan.total_tasks} tasks
                    </span>
                  </div>

                  {/* Task Plan Items */}
                  <div className="space-y-2">
                    {taskPlan.tasks.map((task, i) => (
                      <div key={task.id} className={`flex items-start gap-3 p-3 rounded-lg border bg-background transition-all ${
                        creatingTasks[task.id] === 'done' ? 'border-green-500/30 bg-green-500/5' :
                        creatingTasks[task.id] === 'error' ? 'border-red-500/30 bg-red-500/5' :
                        'hover:border-purple-500/30'
                      }`}>
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-0.5">
                          {creatingTasks[task.id] === 'done' ? '✓' : task.order || i + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm">{task.title}</h4>
                          <p className="text-xs text-muted-foreground mt-0.5">{task.description}</p>
                          <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                            {task.due_date && (
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {formatDate(task.due_date)}
                              </span>
                            )}
                            {task.estimated_hours && (
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {task.estimated_hours}h
                              </span>
                            )}
                            {task.assignee_hint && (
                              <span className="flex items-center gap-1">
                                <Users className="w-3 h-3" />
                                {task.assignee_hint}
                              </span>
                            )}
                          </div>
                        </div>
                        {creatingTasks[task.id] === 'creating' ? (
                          <Loader2 className="w-4 h-4 animate-spin text-purple-500 flex-shrink-0" />
                        ) : creatingTasks[task.id] === 'done' ? (
                          <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                        ) : (
                          <button
                            onClick={() => handleCreatePlanTask(task)}
                            className="text-xs px-2 py-1 rounded bg-muted hover:bg-muted/80 flex-shrink-0"
                            title="Create this task individually"
                          >
                            Create
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Create All Button */}
                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={handleCreateAllPlanTasks}
                      disabled={Object.values(creatingTasks).some(s => s === 'creating') || taskPlan.tasks.every(t => creatingTasks[t.id] === 'done')}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-all shadow-lg shadow-purple-500/20"
                    >
                      {Object.values(creatingTasks).some(s => s === 'creating') ? (
                        <><Loader2 className="w-4 h-4 animate-spin" /> Creating...</>
                      ) : taskPlan.tasks.every(t => creatingTasks[t.id] === 'done') ? (
                        <><CheckCircle2 className="w-4 h-4" /> All Created!</>
                      ) : (
                        <><Sparkles className="w-4 h-4" /> Create All {taskPlan.total_tasks} Tasks</>
                      )}
                    </button>
                    <button
                      onClick={() => { setTaskPlan(null); setCreatingTasks({}); setInputText(''); }}
                      className="px-4 py-2 rounded-lg bg-muted hover:bg-muted/80 text-sm transition-all"
                    >
                      Clear
                    </button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Examples */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-muted-foreground">Try these examples</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {[
                  'Create tasks for annual exam preparation',
                  'Prepare for Parent-Teacher Meeting next Saturday',
                  'Fee collection follow up for pending defaulters',
                  'Ramesh sir ge exam papers check maadoke helidru next week olage',
                  'Infrastructure check for lab computers before exam',
                  'Plan school annual day celebration'
                ].map((example, i) => (
                  <button
                    key={i}
                    onClick={() => setInputText(example)}
                    className="text-xs px-3 py-1.5 rounded-full bg-muted hover:bg-muted/80 text-foreground transition-all"
                  >
                    {example}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'suggestions' && (
        <div className="space-y-4">
          {/* Suggestion Type Filters */}
          <div className="flex gap-2 flex-wrap">
            {[
              { id: 'general', label: 'General', icon: Target },
              { id: 'academic', label: 'Academic', icon: Brain },
              { id: 'finance', label: 'Finance', icon: TrendingUp },
            ].map(type => (
              <button
                key={type.id}
                onClick={() => handleSuggestionTypeChange(type.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all
                  ${suggestionType === type.id 
                    ? 'bg-purple-600 text-white' 
                    : 'bg-muted hover:bg-muted/80'}`}
              >
                <type.icon className="w-4 h-4" />
                {type.label}
              </button>
            ))}
            <button
              onClick={() => loadSuggestions()}
              disabled={loadingSuggestions}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted hover:bg-muted/80 text-sm transition-all ml-auto"
            >
              <RefreshCw className={`w-4 h-4 ${loadingSuggestions ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>

          {/* Suggestion Cards */}
          {loadingSuggestions ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
              <span className="ml-3 text-muted-foreground">AI is thinking...</span>
            </div>
          ) : (
            <div className="grid gap-3">
              {suggestions.map((suggestion, i) => (
                <Card key={suggestion.id || i} className="hover:border-purple-500/30 transition-all">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{suggestion.title}</h3>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            suggestion.priority === 'high' ? 'bg-red-500/10 text-red-600' :
                            suggestion.priority === 'medium' ? 'bg-yellow-500/10 text-yellow-600' :
                            'bg-blue-500/10 text-blue-600'
                          }`}>
                            {suggestion.priority}
                          </span>
                          {suggestion.ai_generated && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-600">
                              AI
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{suggestion.description}</p>
                        {suggestion.reason && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Lightbulb className="w-3 h-3" />
                            {suggestion.reason}
                          </p>
                        )}
                        {suggestion.suggested_due_date && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            Suggested deadline: {formatDate(suggestion.suggested_due_date)}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => handleCreateFromSuggestion(suggestion)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-purple-600 text-white hover:bg-purple-700 text-sm whitespace-nowrap transition-all"
                      >
                        <Plus className="w-3 h-3" />
                        Create
                      </button>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {suggestions.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Lightbulb className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>No suggestions available. Click Refresh to generate.</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {activeTab === 'workload' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-500" />
              Team Workload Analysis
            </h2>
            <button
              onClick={loadWorkload}
              disabled={loadingWorkload}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted hover:bg-muted/80 text-sm transition-all"
            >
              <RefreshCw className={`w-4 h-4 ${loadingWorkload ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>

          {loadingWorkload ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
              <span className="ml-3 text-muted-foreground">Analyzing workload...</span>
            </div>
          ) : workload ? (
            <>
              {/* Summary Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <SummaryCard icon={Target} label="Active Tasks" value={workload.summary?.total_active_tasks || 0} color="blue" />
                <SummaryCard icon={Users} label="Team Size" value={workload.summary?.team_size || 0} color="purple" />
                <SummaryCard icon={BarChart3} label="Avg Load" value={workload.summary?.average_load || 0} color="green" />
                <SummaryCard icon={AlertTriangle} label="Overloaded" value={workload.summary?.overloaded_count || 0} color={workload.summary?.overloaded_count > 0 ? 'red' : 'green'} />
              </div>

              {/* Alerts */}
              {workload.alerts?.length > 0 && (
                <div className="space-y-2">
                  {workload.alerts.map((alert, i) => (
                    <div key={i} className={`flex items-center gap-3 p-3 rounded-lg text-sm ${
                      alert.type === 'overloaded' ? 'bg-orange-500/10 text-orange-600' :
                      'bg-red-500/10 text-red-600'
                    }`}>
                      <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                      {alert.message}
                    </div>
                  ))}
                </div>
              )}

              {/* Team Grid */}
              <div className="grid gap-2">
                {(workload.team || []).map((member, i) => (
                  <div key={member.user_id || i} className="flex items-center justify-between p-3 rounded-lg border bg-card">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white text-sm font-bold">
                        {(member.name || '?')[0]}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{member.name}</p>
                        <p className="text-xs text-muted-foreground">{member.designation}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <div className="text-center">
                        <p className="font-bold">{member.total}</p>
                        <p className="text-xs text-muted-foreground">Total</p>
                      </div>
                      <div className="text-center">
                        <p className="font-bold text-blue-500">{member.in_progress}</p>
                        <p className="text-xs text-muted-foreground">Active</p>
                      </div>
                      <div className="text-center">
                        <p className="font-bold text-yellow-500">{member.pending}</p>
                        <p className="text-xs text-muted-foreground">Pending</p>
                      </div>
                      {member.overdue > 0 && (
                        <div className="text-center">
                          <p className="font-bold text-red-500">{member.overdue}</p>
                          <p className="text-xs text-muted-foreground">Overdue</p>
                        </div>
                      )}
                      {/* Workload bar */}
                      <div className="w-20 hidden sm:block">
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all ${
                              member.total > (workload.summary?.average_load || 5) * 1.5 ? 'bg-red-500' :
                              member.total > (workload.summary?.average_load || 5) ? 'bg-yellow-500' :
                              'bg-green-500'
                            }`}
                            style={{ width: `${Math.min(100, (member.total / Math.max(1, (workload.summary?.average_load || 5) * 2)) * 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {(!workload.team || workload.team.length === 0) && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p>No active task assignments found.</p>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Click Refresh to load team workload data</p>
            </div>
          )}
        </div>
      )}

      {/* ==========================================
           ASK AI TAB
           ========================================== */}
      {activeTab === 'ask' && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-purple-500" />
            Ask JashFlow AI
          </h2>
          <p className="text-sm text-muted-foreground">
            Ask questions about your tasks in any language - English, Kannada, Hindi
          </p>

          {/* Quick Questions */}
          <div className="flex flex-wrap gap-2">
            {[
              "What's pending for this week?",
              "Who has the most overdue tasks?",
              "Show completed tasks today",
              "Which category has most tasks?",
              "Team performance summary"
            ].map(q => (
              <button key={q} onClick={() => { setQueryText(q); }} className="px-3 py-1.5 text-xs rounded-full bg-purple-500/10 text-purple-600 hover:bg-purple-500/20 transition-all">
                {q}
              </button>
            ))}
          </div>

          {/* Query Input */}
          <div className="flex gap-2">
            <input
              type="text"
              value={queryText}
              onChange={e => setQueryText(e.target.value)}
              onKeyDown={async (e) => {
                if (e.key === 'Enter' && queryText.trim() && !isQuerying) {
                  setIsQuerying(true);
                  try {
                    const res = await api.post('/tasks/ai/query', {
                      question: queryText,
                      organization_id: organizationId,
                      branch_id: selectedBranch?.id
                    });
                    if (res.data.success) {
                      const result = { question: queryText, ...res.data };
                      setQueryResult(result);
                      setQueryHistory(prev => [result, ...prev].slice(0, 10));
                    }
                  } catch (err) {
                    console.error('Query failed:', err);
                  }
                  setIsQuerying(false);
                }
              }}
              placeholder="E.g., What tasks are overdue? / ಯಾವ tasks pending ಇವೆ?"
              className="flex-1 px-4 py-3 rounded-lg border bg-background text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
            />
            <button
              disabled={!queryText.trim() || isQuerying}
              onClick={async () => {
                if (!queryText.trim()) return;
                setIsQuerying(true);
                try {
                  const res = await api.post('/tasks/ai/query', {
                    question: queryText,
                    organization_id: organizationId,
                    branch_id: selectedBranch?.id
                  });
                  if (res.data.success) {
                    const result = { question: queryText, ...res.data };
                    setQueryResult(result);
                    setQueryHistory(prev => [result, ...prev].slice(0, 10));
                  }
                } catch (err) {
                  console.error('Query failed:', err);
                }
                setIsQuerying(false);
              }}
              className="px-4 py-3 rounded-lg bg-gradient-to-r from-purple-500 to-blue-500 text-white hover:from-purple-600 hover:to-blue-600 disabled:opacity-50 transition-all"
            >
              {isQuerying ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            </button>
          </div>

          {/* Query Result */}
          {queryResult && (
            <Card className="border-purple-500/20 bg-purple-500/5">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start gap-2">
                  <Brain className="w-5 h-5 text-purple-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Q: "{queryResult.question}"</p>
                    <div className="text-sm whitespace-pre-wrap">{queryResult.answer}</div>
                  </div>
                </div>

                {queryResult.insights?.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-purple-500/20">
                    <p className="text-xs font-medium text-purple-600 mb-1">💡 Insights</p>
                    {queryResult.insights.map((insight, i) => (
                      <p key={i} className="text-xs text-muted-foreground">• {insight}</p>
                    ))}
                  </div>
                )}

                {queryResult.suggested_actions?.length > 0 && (
                  <div className="mt-2">
                    <p className="text-xs font-medium text-blue-600 mb-1">🎯 Suggested Actions</p>
                    {queryResult.suggested_actions.map((action, i) => (
                      <p key={i} className="text-xs text-muted-foreground">→ {action}</p>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Query History */}
          {queryHistory.length > 1 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Previous Questions</p>
              {queryHistory.slice(1).map((q, i) => (
                <button key={i} onClick={() => setQueryResult(q)} className="w-full text-left p-2 rounded-lg bg-muted/50 hover:bg-muted text-xs text-muted-foreground transition-all">
                  "{q.question}"
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ==========================================
// HELPER COMPONENTS
// ==========================================

function SummaryCard({ icon: Icon, label, value, color }) {
  const colorMap = {
    blue: 'from-blue-500/10 to-blue-600/5 text-blue-600',
    green: 'from-green-500/10 to-green-600/5 text-green-600',
    yellow: 'from-yellow-500/10 to-yellow-600/5 text-yellow-600',
    red: 'from-red-500/10 to-red-600/5 text-red-600',
    purple: 'from-purple-500/10 to-purple-600/5 text-purple-600',
  };

  return (
    <div className={`rounded-lg bg-gradient-to-br ${colorMap[color] || colorMap.blue} p-4`}>
      <div className="flex items-center justify-between">
        <Icon className="w-5 h-5 opacity-70" />
        <span className="text-2xl font-bold">{value}</span>
      </div>
      <p className="text-xs mt-1 opacity-70">{label}</p>
    </div>
  );
}
