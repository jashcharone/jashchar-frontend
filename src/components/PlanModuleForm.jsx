import React, { useState, useEffect, useMemo } from 'react';
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Loader2, ChevronDown, ChevronRight, Package, Layers } from 'lucide-react';
import api from '@/lib/api';
import { cn } from '@/lib/utils';

/**
 * Enhanced component for selecting modules AND sub-modules for a subscription plan.
 * Shows parent modules with expandable sub-modules.
 */
const PlanModuleForm = ({ selectedModules, onChange }) => {
    const [allModules, setAllModules] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [expandedModules, setExpandedModules] = useState({});

    // Load all modules (parents and children) via API
    const load = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await api.get('/subscriptions/modules/all');
            const data = response.data || [];
            setAllModules(data);
            
            // Debug: Log module structure
            const parents = data.filter(m => !m.parent_id);
            const children = data.filter(m => m.parent_id);
            console.log('[PlanModuleForm] Loaded', data.length, 'modules');
            console.log('[PlanModuleForm] Parents:', parents.length, 'Children:', children.length);
            console.log('[PlanModuleForm] Children details:', children.map(c => ({ name: c.name, parent_id: c.parent_id })));
        } catch (error) {
            console.error("Error fetching modules:", error);
            setError(error.response?.data?.error || error.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
    }, []);

    // Auto-expand modules with children after data loads
    useEffect(() => {
        if (allModules.length > 0) {
            const parents = allModules.filter(m => !m.parent_id);
            const childrenMap = {};
            allModules.filter(m => m.parent_id).forEach(child => {
                if (!childrenMap[child.parent_id]) childrenMap[child.parent_id] = [];
                childrenMap[child.parent_id].push(child);
            });
            
            // Auto-expand parents that have children
            const autoExpand = {};
            parents.forEach(p => {
                if (childrenMap[p.id] && childrenMap[p.id].length > 0) {
                    autoExpand[p.id] = true;
                }
            });
            console.log('[PlanModuleForm] Auto-expanding:', autoExpand);
            setExpandedModules(autoExpand);
        }
    }, [allModules]);

    // Organize modules into parent-children structure
    const moduleTree = useMemo(() => {
        const parents = allModules.filter(m => !m.parent_id);
        const childrenMap = {};
        
        allModules.filter(m => m.parent_id).forEach(child => {
            if (!childrenMap[child.parent_id]) {
                childrenMap[child.parent_id] = [];
            }
            childrenMap[child.parent_id].push(child);
        });

        const tree = parents.map(parent => ({
            ...parent,
            children: (childrenMap[parent.id] || []).sort((a, b) => a.name.localeCompare(b.name))
        }));
        
        // Debug: Log tree structure
        const parentsWithChildren = tree.filter(p => p.children.length > 0);
        console.log('[PlanModuleForm] Module tree built:', tree.length, 'parents');
        console.log('[PlanModuleForm] Parents with children:', parentsWithChildren.map(p => ({ name: p.name, id: p.id, childCount: p.children.length })));
        
        return tree;
    }, [allModules]);

    // Toggle expand/collapse for a parent module
    const toggleExpand = (moduleId) => {
        console.log('[PlanModuleForm] Toggling expand for module:', moduleId);
        setExpandedModules(prev => {
            const newState = {
                ...prev,
                [moduleId]: !prev[moduleId]
            };
            console.log('[PlanModuleForm] Expanded modules:', newState);
            return newState;
        });
    };

    // Handle parent module toggle
    const handleParentToggle = (parent, checked) => {
        const childSlugs = parent.children.map(c => c.slug);
        let newSelection = [...selectedModules];

        if (checked) {
            // Add parent and all children
            if (!newSelection.includes(parent.slug)) {
                newSelection.push(parent.slug);
            }
            childSlugs.forEach(slug => {
                if (!newSelection.includes(slug)) {
                    newSelection.push(slug);
                }
            });
        } else {
            // Remove parent and all children
            newSelection = newSelection.filter(s => s !== parent.slug && !childSlugs.includes(s));
        }

        onChange(newSelection);
    };

    // Handle child module toggle
    const handleChildToggle = (child, parent, checked) => {
        let newSelection = [...selectedModules];

        if (checked) {
            // Add child
            if (!newSelection.includes(child.slug)) {
                newSelection.push(child.slug);
            }
            // Ensure parent is also selected
            if (!newSelection.includes(parent.slug)) {
                newSelection.push(parent.slug);
            }
        } else {
            // Remove child
            newSelection = newSelection.filter(s => s !== child.slug);
            
            // Check if any other children are still selected
            const otherChildrenSelected = parent.children.some(
                c => c.slug !== child.slug && newSelection.includes(c.slug)
            );
            
            // If no children selected, optionally remove parent too
            // (keeping parent for now as it may have its own functionality)
        }

        onChange(newSelection);
    };

    // Check if all children of a parent are selected
    const areAllChildrenSelected = (parent) => {
        if (parent.children.length === 0) return false;
        return parent.children.every(c => selectedModules.includes(c.slug));
    };

    // Check if some (but not all) children are selected
    const areSomeChildrenSelected = (parent) => {
        if (parent.children.length === 0) return false;
        const selectedCount = parent.children.filter(c => selectedModules.includes(c.slug)).length;
        return selectedCount > 0 && selectedCount < parent.children.length;
    };

    // Select all / Deselect all
    const handleSelectAll = () => {
        const allSlugs = allModules.map(m => m.slug);
        onChange(allSlugs);
        // Expand all
        const expandAll = {};
        moduleTree.forEach(m => { expandAll[m.id] = true; });
        setExpandedModules(expandAll);
    };

    const handleDeselectAll = () => {
        onChange([]);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
                <Loader2 className="animate-spin h-5 w-5 mr-2" />
                <span>Loading modules...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center py-4 text-red-500">
                <p>Error: {error}</p>
                <button onClick={load} className="text-blue-500 underline mt-2">Retry</button>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Quick Actions */}
            <div className="flex items-center justify-between pb-4 border-b">
                <div className="text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">{selectedModules.length}</span> modules/sub-modules selected
                </div>
                <div className="flex gap-2">
                    <button 
                        type="button"
                        onClick={handleSelectAll}
                        className="text-sm text-primary hover:underline"
                    >
                        Select All
                    </button>
                    <span className="text-muted-foreground">|</span>
                    <button 
                        type="button"
                        onClick={handleDeselectAll}
                        className="text-sm text-muted-foreground hover:text-foreground hover:underline"
                    >
                        Deselect All
                    </button>
                </div>
            </div>

            {/* Module Tree */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {moduleTree.map(parent => (
                    <div 
                        key={parent.id} 
                        className={cn(
                            "border rounded-lg overflow-hidden",
                            selectedModules.includes(parent.slug) ? "border-primary/50 bg-primary/5" : "border-border"
                        )}
                    >
                        {/* Parent Module Header */}
                        <div 
                            className={cn(
                                "flex items-center gap-2 p-3 cursor-pointer hover:bg-muted/50 transition-colors",
                                selectedModules.includes(parent.slug) && "bg-primary/10"
                            )}
                            onClick={() => parent.children.length > 0 && toggleExpand(parent.id)}
                        >
                            {/* Expand/Collapse Icon */}
                            {parent.children.length > 0 ? (
                                expandedModules[parent.id] ? (
                                    <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                ) : (
                                    <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                )
                            ) : (
                                <div className="w-4" />
                            )}

                            {/* Parent Checkbox */}
                            <Checkbox
                                id={`parent-${parent.id}`}
                                checked={selectedModules.includes(parent.slug)}
                                onCheckedChange={(c) => handleParentToggle(parent, c)}
                                onClick={(e) => e.stopPropagation()}
                                className={cn(
                                    areSomeChildrenSelected(parent) && !areAllChildrenSelected(parent) && "data-[state=unchecked]:bg-primary/30"
                                )}
                            />

                            {/* Module Icon */}
                            <Package className="h-4 w-4 text-primary flex-shrink-0" />

                            {/* Module Name */}
                            <Label 
                                htmlFor={`parent-${parent.id}`}
                                className="cursor-pointer font-medium text-sm flex-1 select-none"
                                onClick={(e) => e.stopPropagation()}
                            >
                                {parent.name}
                            </Label>

                            {/* Child Count Badge */}
                            {parent.children.length > 0 && (
                                <span className="text-xs bg-muted px-2 py-0.5 rounded-full text-muted-foreground">
                                    {parent.children.filter(c => selectedModules.includes(c.slug)).length}/{parent.children.length}
                                </span>
                            )}
                        </div>

                        {/* Children (Sub-modules) */}
                        {parent.children.length > 0 && expandedModules[parent.id] && (
                            <div className="border-t bg-muted/30">
                                <div className="p-2 space-y-1 max-h-60 overflow-y-auto">
                                    {parent.children.map(child => (
                                        <div 
                                            key={child.id}
                                            className={cn(
                                                "flex items-center gap-2 p-2 rounded hover:bg-muted/50 transition-colors",
                                                selectedModules.includes(child.slug) && "bg-primary/10"
                                            )}
                                        >
                                            <Checkbox
                                                id={`child-${child.id}`}
                                                checked={selectedModules.includes(child.slug)}
                                                onCheckedChange={(c) => handleChildToggle(child, parent, c)}
                                            />
                                            <Layers className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                                            <Label 
                                                htmlFor={`child-${child.id}`}
                                                className="cursor-pointer text-sm flex-1 select-none text-muted-foreground hover:text-foreground"
                                            >
                                                {child.name}
                                            </Label>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {moduleTree.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                    No modules found in the system.
                </div>
            )}
        </div>
    );
};

export default PlanModuleForm;
