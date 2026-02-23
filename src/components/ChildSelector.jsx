/**
 * ChildSelector - Reusable child selector for parent pages
 * Shows a dropdown to select which child's data to view
 */
import React from 'react';
import { useParentChild } from '@/contexts/ParentChildContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Users, GraduationCap, Loader2 } from 'lucide-react';

const ChildSelector = ({ className = '' }) => {
  const { children, selectedChild, selectChild, loading } = useParentChild();

  if (loading) {
    return (
      <div className={`flex items-center gap-2 text-muted-foreground ${className}`}>
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm">Loading children...</span>
      </div>
    );
  }

  if (!children || children.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="p-4 flex items-center gap-3 text-muted-foreground">
          <Users className="h-5 w-5" />
          <span>No children linked to your account. Contact school administration.</span>
        </CardContent>
      </Card>
    );
  }

  // If only one child, show info card instead of dropdown
  if (children.length === 1) {
    const child = children[0];
    return (
      <Card className={`bg-primary/5 border-primary/20 ${className}`}>
        <CardContent className="p-3 flex items-center gap-3">
          <div className="p-2 rounded-full bg-primary/10">
            <GraduationCap className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="font-semibold text-sm">{child.full_name || `${child.first_name} ${child.last_name}`}</p>
            <p className="text-xs text-muted-foreground">
              {child.class_name || 'Class'} {child.section_name ? `(${child.section_name})` : ''} 
              {child.roll_number ? ` • Roll: ${child.roll_number}` : ''}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Multiple children - show selector
  return (
    <Card className={`bg-primary/5 border-primary/20 ${className}`}>
      <CardContent className="p-3 flex items-center gap-3">
        <div className="p-2 rounded-full bg-primary/10">
          <GraduationCap className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1">
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Select Child</label>
          <Select
            value={selectedChild?.id || ''}
            onValueChange={(val) => {
              const child = children.find(c => c.id === val);
              if (child) selectChild(child);
            }}
          >
            <SelectTrigger className="h-8 text-sm">
              <SelectValue placeholder="Select a child" />
            </SelectTrigger>
            <SelectContent>
              {children.map(child => (
                <SelectItem key={child.id} value={child.id}>
                  {child.full_name || `${child.first_name} ${child.last_name}`} — {child.class_name || 'Class'} {child.section_name ? `(${child.section_name})` : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
};

export default ChildSelector;
