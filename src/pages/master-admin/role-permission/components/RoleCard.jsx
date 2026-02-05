// 🧬 Permission DNA - Role Card Component
// Modern card-based role selector with user count and quick actions

import React from 'react';
import { motion } from 'framer-motion';
import { Lock, Users, Trash2, Edit, Crown, Shield, GraduationCap, Calculator, BookOpen, Phone, UserCog, Briefcase } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

// Role Icons mapping
const ROLE_ICONS = {
  'super admin': Crown,
  'admin': Shield,
  'principal': GraduationCap,
  'accountant': Calculator,
  'teacher': BookOpen,
  'librarian': BookOpen,
  'receptionist': Phone,
  'parent': Users,
  'student': GraduationCap,
  'default': UserCog
};

// Role Colors mapping
const ROLE_COLORS = {
  'super admin': 'from-purple-500 to-indigo-600',
  'admin': 'from-blue-500 to-cyan-600',
  'principal': 'from-emerald-500 to-teal-600',
  'accountant': 'from-amber-500 to-orange-600',
  'teacher': 'from-rose-500 to-pink-600',
  'librarian': 'from-violet-500 to-purple-600',
  'receptionist': 'from-sky-500 to-blue-600',
  'parent': 'from-green-500 to-emerald-600',
  'student': 'from-cyan-500 to-blue-600',
  'default': 'from-slate-500 to-gray-600'
};

const RoleCard = ({ 
  role, 
  isSelected, 
  onClick, 
  onDelete, 
  userCount = 0,
  permissionCount = 0,
  isLoading = false 
}) => {
  const normalizedName = role.name.toLowerCase().trim();
  const IconComponent = ROLE_ICONS[normalizedName] || ROLE_ICONS['default'];
  const colorClass = ROLE_COLORS[normalizedName] || ROLE_COLORS['default'];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2 }}
      onClick={onClick}
      className={cn(
        "relative cursor-pointer rounded-xl p-4 transition-all duration-300",
        "border-2 group",
        isSelected 
          ? "border-primary bg-primary/5 shadow-lg shadow-primary/20" 
          : "border-border/50 hover:border-primary/30 hover:bg-accent/50"
      )}
    >
      {/* Selection Indicator */}
      {isSelected && (
        <motion.div
          layoutId="selectedRole"
          className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary/10 to-primary/5"
          initial={false}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
        />
      )}

      <div className="relative z-10 flex items-start gap-3">
        {/* Icon with Gradient Background */}
        <div className={cn(
          "flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center",
          "bg-gradient-to-br shadow-lg",
          colorClass
        )}>
          <IconComponent className="w-6 h-6 text-white" />
        </div>

        {/* Role Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-sm truncate">{role.name}</h3>
            {role.is_system && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Lock className="w-3 h-3 text-blue-500" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>System Role</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            {role.is_virtual && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-amber-50 text-amber-600 border-amber-200">
                New
              </Badge>
            )}
          </div>

          {/* Stats Row */}
          <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              <span>{userCount} users</span>
            </div>
            <div className="flex items-center gap-1">
              <Shield className="w-3 h-3" />
              <span>{permissionCount} perms</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        {!role.is_system && !role.is_virtual && (
          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive hover:bg-destructive/10"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete?.(role.id);
                    }}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Delete Role</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        )}
      </div>

      {/* Permission Progress Bar */}
      <div className="mt-3 relative z-10">
        <div className="h-1.5 bg-muted/50 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min((permissionCount / 50) * 100, 100)}%` }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className={cn(
              "h-full rounded-full bg-gradient-to-r",
              colorClass
            )}
          />
        </div>
      </div>
    </motion.div>
  );
};

export default RoleCard;
