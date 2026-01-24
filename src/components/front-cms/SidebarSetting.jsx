import React from 'react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const SidebarSetting = ({ enabled, onChange }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Sidebar Setting</CardTitle>
      </CardHeader>
      <CardContent className="flex items-center justify-between">
        <Label htmlFor="sidebar-mode">Sidebar</Label>
        <Switch 
          id="sidebar-mode" 
          checked={enabled} 
          onCheckedChange={onChange} 
        />
      </CardContent>
    </Card>
  );
};

export default SidebarSetting;
