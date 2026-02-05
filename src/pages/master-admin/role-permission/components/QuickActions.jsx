// 🧬 Permission DNA - Quick Actions Component
// AI-powered quick action buttons and templates

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, Copy, RefreshCw, Shield, ShieldOff, 
  Wand2, Zap, Lock, Unlock, Eye, EyeOff,
  CheckCircle, XCircle, RotateCcw
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

// Role Templates
const ROLE_TEMPLATES = {
  'Super Admin': {
    description: 'Full access to all modules',
    modules: 'all',
    permissions: { view: true, add: true, edit: true, delete: true }
  },
  'Admin': {
    description: 'Full access to all modules',
    modules: 'all',
    permissions: { view: true, add: true, edit: true, delete: true }
  },
  'Principal': {
    description: 'Full access for school management',
    modules: 'all',
    permissions: { view: true, add: true, edit: true, delete: true }
  },
  'Teacher': {
    description: 'Access to academic modules',
    modules: ['academics', 'homework', 'examination', 'lesson_plan', 'student_information', 'communicate', 'download_center', 'attendance'],
    permissions: { view: true, add: true, edit: true, delete: false }
  },
  'Accountant': {
    description: 'Access to financial modules',
    modules: ['fees_collection', 'income', 'expenses', 'student_information'],
    permissions: { view: true, add: true, edit: true, delete: false }
  },
  'Librarian': {
    description: 'Access to library management',
    modules: ['library', 'student_information'],
    permissions: { view: true, add: true, edit: true, delete: true }
  },
  'Receptionist': {
    description: 'Access to front office operations',
    modules: ['front_office', 'student_information', 'communicate'],
    permissions: { view: true, add: true, edit: true, delete: false }
  },
  'Parent': {
    description: 'View-only access to student data',
    modules: ['student_information', 'fees_collection', 'homework', 'examination', 'communicate'],
    permissions: { view: true, add: false, edit: false, delete: false }
  },
  'Student': {
    description: 'View-only access to own data',
    modules: ['student_information', 'homework', 'examination', 'lesson_plan', 'download_center', 'communicate'],
    permissions: { view: true, add: false, edit: false, delete: false }
  }
};

const QuickActions = ({ 
  selectedRole,
  onApplyTemplate,
  onSelectAll,
  onDeselectAll,
  onViewOnly,
  onReset,
  hasChanges = false
}) => {
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  const handleApplyTemplate = (templateKey) => {
    const template = ROLE_TEMPLATES[templateKey];
    if (template) {
      setSelectedTemplate({ key: templateKey, ...template });
      setTemplateDialogOpen(true);
    }
  };

  const confirmApplyTemplate = () => {
    if (selectedTemplate) {
      onApplyTemplate?.(selectedTemplate);
      setTemplateDialogOpen(false);
      setSelectedTemplate(null);
    }
  };

  return (
    <div className="space-y-3">
      {/* Primary Actions */}
      <div className="flex flex-wrap gap-2">
        {/* AI Magic Button */}
        <Button
          variant="default"
          size="sm"
          className="bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700"
          onClick={() => {
            const roleName = selectedRole?.name;
            if (roleName && ROLE_TEMPLATES[roleName]) {
              handleApplyTemplate(roleName);
            }
          }}
          disabled={!selectedRole}
        >
          <Sparkles className="w-4 h-4 mr-2" />
          Apply Smart Template
        </Button>

        {/* Template Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <Copy className="w-4 h-4 mr-2" />
              Templates
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuLabel>Role Templates</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {Object.entries(ROLE_TEMPLATES).map(([key, template]) => (
              <DropdownMenuItem 
                key={key}
                onClick={() => handleApplyTemplate(key)}
              >
                <div className="flex flex-col">
                  <span className="font-medium">{key}</span>
                  <span className="text-xs text-muted-foreground">{template.description}</span>
                </div>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Reset Button */}
        {hasChanges && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <Button 
              variant="outline" 
              size="sm"
              className="text-amber-600 border-amber-200 hover:bg-amber-50"
              onClick={onReset}
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset Changes
            </Button>
          </motion.div>
        )}
      </div>

      {/* Quick Toggle Buttons */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant="ghost"
          size="sm"
          className="text-emerald-600 hover:bg-emerald-50"
          onClick={() => onSelectAll?.()}
        >
          <CheckCircle className="w-4 h-4 mr-1" />
          Select All
        </Button>

        <Button
          variant="ghost"
          size="sm"
          className="text-rose-600 hover:bg-rose-50"
          onClick={() => onDeselectAll?.()}
        >
          <XCircle className="w-4 h-4 mr-1" />
          Clear All
        </Button>

        <Button
          variant="ghost"
          size="sm"
          className="text-blue-600 hover:bg-blue-50"
          onClick={() => onViewOnly?.()}
        >
          <Eye className="w-4 h-4 mr-1" />
          View Only
        </Button>
      </div>

      {/* Template Confirmation Dialog */}
      <Dialog open={templateDialogOpen} onOpenChange={setTemplateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wand2 className="w-5 h-5 text-purple-500" />
              Apply Template: {selectedTemplate?.key}
            </DialogTitle>
            <DialogDescription>
              {selectedTemplate?.description}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <div className="rounded-lg bg-muted p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Modules Access</span>
                <Badge variant="secondary">
                  {selectedTemplate?.modules === 'all' 
                    ? 'All Modules' 
                    : `${selectedTemplate?.modules?.length || 0} Modules`}
                </Badge>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "w-4 h-4 rounded",
                    selectedTemplate?.permissions?.view ? "bg-blue-500" : "bg-muted"
                  )} />
                  <span className="text-xs">View</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "w-4 h-4 rounded",
                    selectedTemplate?.permissions?.add ? "bg-emerald-500" : "bg-muted"
                  )} />
                  <span className="text-xs">Add</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "w-4 h-4 rounded",
                    selectedTemplate?.permissions?.edit ? "bg-amber-500" : "bg-muted"
                  )} />
                  <span className="text-xs">Edit</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "w-4 h-4 rounded",
                    selectedTemplate?.permissions?.delete ? "bg-rose-500" : "bg-muted"
                  )} />
                  <span className="text-xs">Delete</span>
                </div>
              </div>

              {selectedTemplate?.modules !== 'all' && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {selectedTemplate?.modules?.map(m => (
                    <Badge key={m} variant="outline" className="text-xs">
                      {m.replace(/_/g, ' ')}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setTemplateDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={confirmApplyTemplate}
              className="bg-gradient-to-r from-purple-500 to-indigo-600"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Apply Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default QuickActions;
