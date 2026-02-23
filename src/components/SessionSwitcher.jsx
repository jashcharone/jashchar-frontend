import React from 'react';
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

  // ✅ Show ALL sessions (both active & inactive) so user can switch freely
  const sessionsToShow = sessionList || [];

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
              <span className="flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full ${session.is_active ? 'bg-green-500' : 'bg-gray-400'}`} />
                {session.name} {session.is_active ? '(Active)' : ''}
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default SessionSwitcher;
