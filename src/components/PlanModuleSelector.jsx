import React, { useState, useEffect } from 'react';
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/components/ui/use-toast";
import { ALL_MODULES } from '@/config/modules';
import { planModuleManager } from '@/services/planModuleManager';
import { Loader2, Save } from 'lucide-react';

const PlanModuleSelector = ({ planId, onSave }) => {
    const { toast } = useToast();
    const [selectedModules, setSelectedModules] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadModules();
    }, [planId]);

    const loadModules = async () => {
        setLoading(true);
        const { modules } = await planModuleManager.getPlanWithModules(planId);
        setSelectedModules(modules.map(m => m.id));
        setLoading(false);
    };

    const handleToggle = (moduleId) => {
        setSelectedModules(prev => 
            prev.includes(moduleId) 
                ? prev.filter(id => id !== moduleId)
                : [...prev, moduleId]
        );
    };

    const handleSave = async () => {
        setSaving(true);
        const res = await planModuleManager.updatePlanModules(planId, selectedModules);
        setSaving(false);

        if (res.success) {
            toast({ title: "Modules Updated", description: "Plan modules have been synced successfully." });
            if (onSave) onSave();
        } else {
            toast({ variant: "destructive", title: "Update Failed", description: res.error });
        }
    };

    if (loading) return <div className="p-4 flex justify-center"><Loader2 className="animate-spin" /></div>;

    // Group by category
    const categories = [...new Set(ALL_MODULES.map(m => m.category))];

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Included Modules</h3>
                <Button size="sm" onClick={handleSave} disabled={saving}>
                    {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Save Changes
                </Button>
            </div>
            
            <ScrollArea className="h-[400px] pr-4 border rounded-md p-4">
                <div className="space-y-6">
                    {categories.map(cat => (
                        <div key={cat} className="space-y-3">
                            <h4 className="font-semibold text-sm uppercase text-muted-foreground tracking-wider border-b pb-1">{cat.replace('_', ' ')}</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {ALL_MODULES.filter(m => m.category === cat).map(module => (
                                    <div key={module.id} className="flex items-start space-x-2">
                                        <Checkbox 
                                            id={`mod-${module.id}`} 
                                            checked={selectedModules.includes(module.id)}
                                            onCheckedChange={() => handleToggle(module.id)}
                                        />
                                        <div className="grid gap-1.5 leading-none">
                                            <Label htmlFor={`mod-${module.id}`} className="cursor-pointer font-medium">
                                                {module.name}
                                            </Label>
                                            <p className="text-xs text-muted-foreground">
                                                Slug: {module.slug}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </ScrollArea>
        </div>
    );
};

export default PlanModuleSelector;
