// 🧬 Permission DNA - Permission Chip Component
// Modern toggle chips for View/Add/Edit/Delete permissions

import React from 'react';
import { motion } from 'framer-motion';
import { Eye, Plus, Pencil, Trash2, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const PERMISSION_CONFIG = {
  view: {
    icon: Eye,
    label: 'View',
    shortLabel: 'V',
    enabledColor: 'bg-blue-500 text-white border-blue-500',
    disabledColor: 'bg-blue-50 text-blue-400 border-blue-200 hover:bg-blue-100',
    hoverColor: 'hover:border-blue-400'
  },
  add: {
    icon: Plus,
    label: 'Add',
    shortLabel: 'A',
    enabledColor: 'bg-emerald-500 text-white border-emerald-500',
    disabledColor: 'bg-emerald-50 text-emerald-400 border-emerald-200 hover:bg-emerald-100',
    hoverColor: 'hover:border-emerald-400'
  },
  edit: {
    icon: Pencil,
    label: 'Edit',
    shortLabel: 'E',
    enabledColor: 'bg-amber-500 text-white border-amber-500',
    disabledColor: 'bg-amber-50 text-amber-400 border-amber-200 hover:bg-amber-100',
    hoverColor: 'hover:border-amber-400'
  },
  delete: {
    icon: Trash2,
    label: 'Delete',
    shortLabel: 'D',
    enabledColor: 'bg-rose-500 text-white border-rose-500',
    disabledColor: 'bg-rose-50 text-rose-400 border-rose-200 hover:bg-rose-100',
    hoverColor: 'hover:border-rose-400'
  }
};

const PermissionChip = ({ 
  action, 
  enabled, 
  onChange, 
  size = 'sm',
  showLabel = false,
  disabled = false 
}) => {
  const config = PERMISSION_CONFIG[action];
  if (!config) return null;

  const IconComponent = config.icon;
  
  const sizeClasses = {
    xs: 'w-6 h-6 text-[10px]',
    sm: 'w-7 h-7 text-xs',
    md: 'w-8 h-8 text-sm',
    lg: 'w-10 h-10 text-base'
  };

  const iconSizes = {
    xs: 'w-3 h-3',
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };

  return (
    <TooltipProvider>
      <Tooltip delayDuration={300}>
        <TooltipTrigger asChild>
          <motion.button
            whileHover={{ scale: disabled ? 1 : 1.1 }}
            whileTap={{ scale: disabled ? 1 : 0.95 }}
            onClick={() => !disabled && onChange?.(!enabled)}
            disabled={disabled}
            className={cn(
              "rounded-lg border-2 flex items-center justify-center transition-all duration-200",
              "focus:outline-none focus:ring-2 focus:ring-offset-1",
              sizeClasses[size],
              enabled ? config.enabledColor : config.disabledColor,
              !enabled && config.hoverColor,
              disabled && "opacity-50 cursor-not-allowed"
            )}
          >
            {showLabel ? (
              <span className="font-medium">{config.shortLabel}</span>
            ) : (
              <IconComponent className={iconSizes[size]} />
            )}
          </motion.button>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs">
          <p>{enabled ? `Disable ${config.label}` : `Enable ${config.label}`}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

// Grouped Permission Chips
export const PermissionChipGroup = ({ 
  permissions = {}, 
  onChange, 
  size = 'sm',
  showLabels = false,
  disabled = false 
}) => {
  return (
    <div className="flex items-center gap-1">
      {['view', 'add', 'edit', 'delete'].map(action => (
        <PermissionChip
          key={action}
          action={action}
          enabled={permissions[action] || false}
          onChange={(checked) => onChange?.(action, checked)}
          size={size}
          showLabel={showLabels}
          disabled={disabled}
        />
      ))}
    </div>
  );
};

export default PermissionChip;
