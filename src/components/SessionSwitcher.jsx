import React from 'react';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from '@/lib/utils';

const SessionSwitcher = () => {
  const { currentSessionId, switchSession, sessionList, loading } = useSupabaseAuth();

  // ✅ Show ALL sessions (both active & inactive) so user can switch freely
  const sessionsToShow = sessionList || [];
  
  // Get current session to check if active
  const currentSession = sessionsToShow.find(s => s.id?.toString() === currentSessionId?.toString());
  const isCurrentActive = currentSession?.is_active;

  if (loading) {
    return <div className="text-sm text-muted-foreground">Loading...</div>;
  }

  if (!sessionsToShow || sessionsToShow.length === 0) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">
          Session:
        </span>
        <Select disabled>
          <SelectTrigger className="w-auto min-w-[120px] h-8 text-xs">
            <SelectValue placeholder="No Session" />
          </SelectTrigger>
        </Select>
      </div>
    );
  }

  const handleValueChange = (value) => {
    switchSession(value);
  };

  return (
    <div className="flex items-center gap-1.5">
      <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">
        Session:
      </span>
      {/* Green dot indicator for active session */}
      <span className={cn(
        "h-2 w-2 rounded-full shrink-0",
        isCurrentActive ? "bg-green-500" : "bg-gray-400"
      )} />
      <Select 
        value={currentSessionId ? currentSessionId.toString() : ''} 
        onValueChange={handleValueChange}
      >
        <SelectTrigger className={cn(
          "h-8 border-0 bg-transparent hover:bg-muted/50 focus:ring-0 focus:ring-offset-0 px-2",
          // Auto width with min/max constraints
          "w-auto min-w-[90px] max-w-[150px]",
          // Smaller text when active label is shown
          isCurrentActive ? "text-xs" : "text-sm"
        )}>
          <SelectValue placeholder="Select">
            {currentSession && (
              <span className="whitespace-nowrap truncate">
                {currentSession.name}
                {isCurrentActive && (
                  <span className="text-[10px] text-green-600 ml-1">(Active)</span>
                )}
              </span>
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {sessionsToShow.map((session) => (
            <SelectItem key={session.id} value={session.id.toString()}>
              <span className="flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full shrink-0 ${session.is_active ? 'bg-green-500' : 'bg-gray-400'}`} />
                <span className="whitespace-nowrap">{session.name}</span>
                {session.is_active && <span className="text-[10px] text-green-600">(Active)</span>}
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default SessionSwitcher;
