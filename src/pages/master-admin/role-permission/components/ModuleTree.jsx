// 🧬 Permission DNA - Module Tree Component
// Collapsible tree view with modern toggle switches

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Folder, FolderOpen, FileText, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import PermissionChip from './PermissionChip';

const ModuleTree = ({ 
  modules, 
  permissions, 
  onPermissionChange, 
  onToggleAll,
  searchQuery = '' 
}) => {
  const [expandedModules, setExpandedModules] = useState(new Set());

  const toggleExpand = (slug) => {
    setExpandedModules(prev => {
      const next = new Set(prev);
      if (next.has(slug)) {
        next.delete(slug);
      } else {
        next.add(slug);
      }
      return next;
    });
  };

  const expandAll = () => {
    setExpandedModules(new Set(modules.map(m => m.slug)));
  };

  const collapseAll = () => {
    setExpandedModules(new Set());
  };

  // Filter modules based on search
  const filteredModules = searchQuery 
    ? modules.filter(m => 
        m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.subModules?.some(sub => sub.label.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : modules;

  // Calculate permission counts
  const getModulePermCount = (moduleSlug, subModules) => {
    let count = 0;
    const perms = permissions[moduleSlug];
    if (perms) {
      count += Object.values(perms).filter(Boolean).length;
    }
    subModules?.forEach(sub => {
      const subPerms = permissions[sub.fullSlug];
      if (subPerms) {
        count += Object.values(subPerms).filter(Boolean).length;
      }
    });
    return count;
  };

  const hasAllPermissions = (moduleSlug, subModules) => {
    const perms = permissions[moduleSlug] || {};
    const mainHasAll = ['view', 'add', 'edit', 'delete'].every(a => perms[a]);
    
    if (!subModules?.length) return mainHasAll;
    
    const subsHaveAll = subModules.every(sub => {
      const subPerms = permissions[sub.fullSlug] || {};
      return ['view', 'add', 'edit', 'delete'].every(a => subPerms[a]);
    });
    
    return mainHasAll && subsHaveAll;
  };

  return (
    <div className="space-y-2">
      {/* Quick Actions */}
      <div className="flex items-center justify-between mb-4 px-2">
        <div className="flex gap-2">
          <button
            onClick={expandAll}
            className="text-xs text-primary hover:underline"
          >
            Expand All
          </button>
          <span className="text-muted-foreground">|</span>
          <button
            onClick={collapseAll}
            className="text-xs text-primary hover:underline"
          >
            Collapse All
          </button>
        </div>
        <Badge variant="secondary" className="text-xs">
          {filteredModules.length} Modules
        </Badge>
      </div>

      {/* Module List */}
      <div className="space-y-1">
        {filteredModules.map((module, index) => {
          const isExpanded = expandedModules.has(module.slug);
          const hasSubModules = module.subModules && module.subModules.length > 0;
          const permCount = getModulePermCount(module.slug, module.subModules);
          const allEnabled = hasAllPermissions(module.slug, module.subModules);

          return (
            <motion.div
              key={module.slug}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.03 }}
              className="rounded-lg border border-border/50 overflow-hidden bg-card"
            >
              {/* Module Header */}
              <div 
                className={cn(
                  "flex items-center gap-3 p-3 transition-colors",
                  "hover:bg-accent/50 cursor-pointer",
                  isExpanded && hasSubModules && "border-b border-border/30"
                )}
              >
                {/* Expand/Collapse Toggle */}
                {hasSubModules ? (
                  <button
                    onClick={() => toggleExpand(module.slug)}
                    className="p-1 hover:bg-accent rounded-md transition-colors"
                  >
                    <motion.div
                      animate={{ rotate: isExpanded ? 90 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </motion.div>
                  </button>
                ) : (
                  <div className="w-6" />
                )}

                {/* Module Icon */}
                <div className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center",
                  allEnabled ? "bg-emerald-100 text-emerald-600" : "bg-muted text-muted-foreground"
                )}>
                  {isExpanded ? <FolderOpen className="w-4 h-4" /> : <Folder className="w-4 h-4" />}
                </div>

                {/* Module Name */}
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{module.name}</span>
                    {hasSubModules && (
                      <Badge variant="outline" className="text-[10px] px-1.5">
                        {module.subModules.length} sub
                      </Badge>
                    )}
                  </div>
                  {permCount > 0 && (
                    <span className="text-xs text-muted-foreground">
                      {permCount} permissions enabled
                    </span>
                  )}
                </div>

                {/* Permission Chips */}
                <div className="flex items-center gap-1">
                  {['view', 'add', 'edit', 'delete'].map(action => (
                    <PermissionChip
                      key={action}
                      action={action}
                      enabled={permissions[module.slug]?.[action] || false}
                      onChange={(checked) => onPermissionChange(module.slug, action, checked)}
                      size="sm"
                    />
                  ))}
                </div>

                {/* Master Toggle */}
                <div className="flex items-center gap-2 ml-2 pl-2 border-l border-border/50">
                  <Switch
                    checked={allEnabled}
                    onCheckedChange={(checked) => onToggleAll(module, checked)}
                    className="data-[state=checked]:bg-emerald-500"
                  />
                  <span className="text-xs text-muted-foreground w-6">All</span>
                </div>
              </div>

              {/* Sub-Modules */}
              <AnimatePresence>
                {isExpanded && hasSubModules && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="bg-muted/30"
                  >
                    {module.subModules.map((sub, subIndex) => {
                      const subPerms = permissions[sub.fullSlug] || {};
                      const subAllEnabled = ['view', 'add', 'edit', 'delete'].every(a => subPerms[a]);
                      
                      return (
                        <motion.div
                          key={sub.fullSlug}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: subIndex * 0.05 }}
                          className={cn(
                            "flex items-center gap-3 p-3 pl-12",
                            "border-b border-border/20 last:border-b-0",
                            "hover:bg-accent/30 transition-colors"
                          )}
                        >
                          {/* Sub-module connector */}
                          <div className="flex items-center gap-2">
                            <div className="w-4 border-t border-l border-border/50 h-4 rounded-bl" />
                            <FileText className="w-4 h-4 text-muted-foreground" />
                          </div>

                          {/* Sub-module Name */}
                          <span className="flex-1 text-sm text-muted-foreground">
                            {sub.label}
                          </span>

                          {/* Sub-module Permissions */}
                          <div className="flex items-center gap-1">
                            {['view', 'add', 'edit', 'delete'].map(action => (
                              <PermissionChip
                                key={action}
                                action={action}
                                enabled={subPerms[action] || false}
                                onChange={(checked) => onPermissionChange(sub.fullSlug, action, checked)}
                                size="xs"
                              />
                            ))}
                          </div>

                          {/* Sub-module Toggle All */}
                          <div className="flex items-center gap-2 ml-2 pl-2 border-l border-border/30">
                            <Switch
                              checked={subAllEnabled}
                              onCheckedChange={(checked) => {
                                ['view', 'add', 'edit', 'delete'].forEach(action => {
                                  onPermissionChange(sub.fullSlug, action, checked);
                                });
                              }}
                              className="data-[state=checked]:bg-emerald-500 scale-90"
                            />
                          </div>
                        </motion.div>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredModules.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <Folder className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No modules found</p>
          {searchQuery && (
            <p className="text-sm mt-1">Try a different search term</p>
          )}
        </div>
      )}
    </div>
  );
};

export default ModuleTree;
