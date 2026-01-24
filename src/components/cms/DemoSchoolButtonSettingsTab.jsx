import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';

const DemoSchoolButtonSettingsTab = ({ settings, onUpdate }) => {
  return (
    <div className="space-y-4 p-4 border rounded-lg bg-slate-50 mt-6">
        <div className="flex items-center justify-between">
            <div>
                <h4 className="font-medium text-sm uppercase text-slate-600">Demo School Button</h4>
                <p className="text-xs text-muted-foreground">Show a direct link to a demo school portal on the homepage.</p>
            </div>
            <div className="flex items-center space-x-2">
                <Label htmlFor="demo-enabled" className="text-xs cursor-pointer">Enabled</Label>
                <Switch 
                    id="demo-enabled"
                    checked={settings.demo_school_enabled !== false} 
                    onCheckedChange={(c) => onUpdate('demo_school_enabled', c)} 
                />
            </div>
        </div>
        
        {settings.demo_school_enabled !== false && (
            <div className="grid gap-4 pt-4 animate-in fade-in slide-in-from-top-2 duration-200 border-t mt-2">
                <div className="grid gap-2">
                    <Label htmlFor="demo-label">Button Label</Label>
                    <Input 
                        id="demo-label"
                        value={settings.demo_school_label || ''} 
                        onChange={(e) => onUpdate('demo_school_label', e.target.value)} 
                        placeholder="Demo School" 
                    />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="demo-url">Target URL / Path</Label>
                    <Input 
                        id="demo-url"
                        value={settings.demo_school_url || ''} 
                        onChange={(e) => onUpdate('demo_school_url', e.target.value)} 
                        placeholder="/jashchar-cbse" 
                    />
                    <p className="text-[10px] text-muted-foreground">Example: <span className="font-mono">/jashchar-cbse</span> or <span className="font-mono">https://demo.school.com</span></p>
                </div>
                <div className="flex items-center space-x-2">
                    <Switch 
                        id="demo-new-tab"
                        checked={settings.demo_school_open_in_new_tab || false} 
                        onCheckedChange={(c) => onUpdate('demo_school_open_in_new_tab', c)} 
                    />
                    <Label htmlFor="demo-new-tab" className="font-normal text-sm cursor-pointer">Open in new tab</Label>
                </div>
            </div>
        )}
    </div>
  );
};

export default DemoSchoolButtonSettingsTab;
