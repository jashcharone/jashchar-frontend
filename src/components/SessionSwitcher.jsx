import React, { useEffect } from 'react';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const SessionSwitcher = () => {
  const { currentSessionId, switchSession, sessionList, loading } = useSupabaseAuth();

  // Filter to show only active sessions as per requirement
  const activeSessions = sessionList?.filter(s => s.is_active) || [];
  const sessionsToShow = activeSessions.length > 0 ? activeSessions : sessionList;

  // Ensure the current session is one of the visible sessions
  useEffect(() => {
    if (!loading && sessionsToShow && sessionsToShow.length > 0 && currentSessionId) {
      const isCurrentInList = sessionsToShow.some(s => s.id === currentSessionId);
      if (!isCurrentInList) {
        switchSession(sessionsToShow[0].id);
      }
    }
  }, [loading, sessionsToShow, currentSessionId, switchSession]);

  if (loading) {
    return <div className="text-sm text-muted-foreground">Loading...</div>;
  }

  if (!sessionsToShow || sessionsToShow.length === 0) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium hidden md:inline-block text-muted-foreground">
          Session:
        </span>
        <Select disabled>
          <SelectTrigger className="w-[180px] h-9">
            <SelectValue placeholder="No Active Session" />
          </SelectTrigger>
        </Select>
      </div>
    );
  }

  const handleValueChange = (value) => {
    switchSession(value);
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-medium hidden md:inline-block text-muted-foreground">
        Session:
      </span>
      <Select 
        value={currentSessionId ? currentSessionId.toString() : ''} 
        onValueChange={handleValueChange}
      >
        <SelectTrigger className="w-[180px] h-9">
          <SelectValue placeholder="Select Session" />
        </SelectTrigger>
        <SelectContent>
          {sessionsToShow.map((session) => (
            <SelectItem key={session.id} value={session.id.toString()}>
              {session.name} {session.is_active ? '(Active)' : ''}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default SessionSwitcher;
