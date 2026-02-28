import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import { getApiBaseUrl } from '@/utils/platform';
import { 
  Sparkles, TrendingUp, TrendingDown, AlertTriangle, 
  CheckCircle2, ArrowRight, RefreshCw, Lightbulb,
  Users, GraduationCap, Wallet, Calendar, Clock,
  Bell, ChevronRight, AlertCircle, Info, Target
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

// ============================================================================
// INSIGHT CARD COMPONENT
// ============================================================================
const InsightCard = ({ insight, onClick }) => {
  const typeConfig = {
    warning: {
      bgGradient: 'from-amber-500/10 via-orange-500/10 to-yellow-500/10',
      borderColor: 'border-amber-500/30',
      iconBg: 'bg-amber-500/20',
      iconColor: 'text-amber-500',
      textColor: 'text-amber-600 dark:text-amber-400',
    },
    alert: {
      bgGradient: 'from-red-500/10 via-rose-500/10 to-pink-500/10',
      borderColor: 'border-red-500/30',
      iconBg: 'bg-red-500/20',
      iconColor: 'text-red-500',
      textColor: 'text-red-600 dark:text-red-400',
    },
    success: {
      bgGradient: 'from-green-500/10 via-emerald-500/10 to-teal-500/10',
      borderColor: 'border-green-500/30',
      iconBg: 'bg-green-500/20',
      iconColor: 'text-green-500',
      textColor: 'text-green-600 dark:text-green-400',
    },
    info: {
      bgGradient: 'from-blue-500/10 via-cyan-500/10 to-sky-500/10',
      borderColor: 'border-blue-500/30',
      iconBg: 'bg-blue-500/20',
      iconColor: 'text-blue-500',
      textColor: 'text-blue-600 dark:text-blue-400',
    }
  };

  const config = typeConfig[insight.type] || typeConfig.info;

  const getCategoryIcon = (category) => {
    const icons = {
      fees: Wallet,
      attendance: Calendar,
      students: GraduationCap,
      staff: Users,
      tasks: Clock,
      transport: Target
    };
    return icons[category] || Info;
  };

  const CategoryIcon = getCategoryIcon(insight.category);

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left p-4 rounded-2xl transition-all duration-300",
        "bg-gradient-to-br backdrop-blur-sm border",
        "hover:scale-[1.02] hover:shadow-lg cursor-pointer group",
        config.bgGradient,
        config.borderColor
      )}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className={cn(
          "flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center text-2xl",
          config.iconBg
        )}>
          <span>{insight.icon}</span>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className={cn("font-semibold text-sm", config.textColor)}>
              {insight.title}
            </h4>
            {insight.priority === 'high' && (
              <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                HIGH
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground line-clamp-2">
            {insight.message}
          </p>
          
          {/* Action Button */}
          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center gap-1.5">
              <CategoryIcon className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-[11px] text-muted-foreground capitalize">{insight.category}</span>
            </div>
            <span className={cn(
              "text-xs font-medium flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity",
              config.textColor
            )}>
              {insight.action}
              <ArrowRight className="h-3 w-3" />
            </span>
          </div>

          {/* Trend indicator if available */}
          {insight.trend !== null && insight.trend !== undefined && (
            <div className="flex items-center gap-1 mt-2">
              {insight.trend > 0 ? (
                <TrendingUp className="h-3.5 w-3.5 text-green-500" />
              ) : (
                <TrendingDown className="h-3.5 w-3.5 text-red-500" />
              )}
              <span className={cn(
                "text-xs font-medium",
                insight.trend > 0 ? "text-green-500" : "text-red-500"
              )}>
                {Math.abs(insight.trend)}%
              </span>
            </div>
          )}
        </div>
      </div>
    </button>
  );
};

// ============================================================================
// MAIN SMART INSIGHTS COMPONENT
// ============================================================================
const SmartInsights = () => {
  const navigate = useNavigate();
  const { session, currentSessionId } = useAuth();
  const { selectedBranch } = useBranch();
  
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Get access token from session
  const accessToken = session?.access_token;

  const fetchInsights = useCallback(async () => {
    console.log('[SmartInsights] Checking prerequisites:', { 
      branchId: selectedBranch?.id, 
      hasToken: !!accessToken,
      sessionId: currentSessionId 
    });
    
    if (!selectedBranch?.id || !accessToken) {
      console.log('[SmartInsights] Missing prerequisites, skipping fetch');
      setLoading(false);
      return;
    }

    try {
      setIsRefreshing(true);
      const apiUrl = getApiBaseUrl();
      const response = await fetch(
        `${apiUrl}/api/dashboard/smart-insights?branchId=${selectedBranch.id}&sessionId=${currentSessionId}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'x-branch-id': selectedBranch.id,
            'x-session-id': currentSessionId,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch insights');
      }

      const data = await response.json();
      setInsights(data.insights || []);
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      console.error('[SmartInsights] Error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [selectedBranch?.id, accessToken, currentSessionId]);

  useEffect(() => {
    fetchInsights();
    // Refresh insights every 5 minutes
    const interval = setInterval(fetchInsights, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchInsights]);

  const handleInsightClick = (insight) => {
    if (insight.actionUrl) {
      navigate(insight.actionUrl);
    }
  };

  // Don't render if no branch selected
  if (!selectedBranch?.id) {
    return null;
  }

  // Loading state
  if (loading) {
    return (
      <Card className="relative overflow-hidden border-0 shadow-xl bg-card/80 backdrop-blur-xl rounded-3xl">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-violet-500 via-purple-500 to-pink-500" />
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="h-5 w-5 text-primary animate-pulse" />
            Smart Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-4 rounded-2xl bg-muted/30">
                <div className="flex items-start gap-3">
                  <Skeleton className="h-12 w-12 rounded-xl" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-3/4" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <Card className="relative overflow-hidden border-0 shadow-xl bg-card/80 backdrop-blur-xl rounded-3xl">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 via-rose-500 to-pink-500" />
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <AlertCircle className="h-5 w-5 text-red-500" />
            Smart Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <p className="text-muted-foreground text-sm mb-3">Unable to load insights</p>
            <Button variant="outline" size="sm" onClick={fetchInsights}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // No insights available
  if (insights.length === 0) {
    return (
      <Card className="relative overflow-hidden border-0 shadow-xl bg-card/80 backdrop-blur-xl rounded-3xl">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500" />
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            Smart Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/10 flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-green-500" />
            </div>
            <h3 className="font-semibold text-lg mb-1">All Clear! 🎉</h3>
            <p className="text-muted-foreground text-sm">
              No urgent insights right now. Everything is running smoothly.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Render insights
  const highPriorityInsights = insights.filter(i => i.priority === 'high');
  const otherInsights = insights.filter(i => i.priority !== 'high');

  return (
    <Card className="relative overflow-hidden border-0 shadow-xl bg-card/80 backdrop-blur-xl rounded-3xl">
      {/* Animated top border */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-violet-500 via-purple-500 to-pink-500" />
      
      {/* Glow effect */}
      <div className="absolute -top-20 -right-20 w-40 h-40 bg-purple-500/10 rounded-full blur-3xl" />
      <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl" />

      <CardHeader className="pb-2 relative">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600">
              <Lightbulb className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                Smart Insights
                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-[10px]">
                  AI
                </Badge>
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                {insights.length} actionable insight{insights.length !== 1 ? 's' : ''} for today
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {lastUpdated && (
              <span className="text-[10px] text-muted-foreground">
                Updated {lastUpdated.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8" 
              onClick={fetchInsights}
              disabled={isRefreshing}
            >
              <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="relative">
        {/* High priority section */}
        {highPriorityInsights.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              <span className="text-xs font-semibold text-red-500 uppercase tracking-wide">
                Requires Attention
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {highPriorityInsights.map((insight) => (
                <InsightCard
                  key={insight.id}
                  insight={insight}
                  onClick={() => handleInsightClick(insight)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Other insights */}
        {otherInsights.length > 0 && (
          <div>
            {highPriorityInsights.length > 0 && (
              <div className="flex items-center gap-2 mb-3">
                <Bell className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Other Insights
                </span>
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {otherInsights.map((insight) => (
                <InsightCard
                  key={insight.id}
                  insight={insight}
                  onClick={() => handleInsightClick(insight)}
                />
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SmartInsights;
