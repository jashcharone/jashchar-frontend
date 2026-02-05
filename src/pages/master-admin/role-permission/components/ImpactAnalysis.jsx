// 🧬 Permission DNA - Impact Analysis Component
// Shows real-time impact of permission changes

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, AlertTriangle, CheckCircle, Info, ArrowRight, Shield, Building2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

const ImpactAnalysis = ({ 
  roleName,
  userCount = 0,
  branchCount = 1,
  changedPermissions = [],
  isVisible = true 
}) => {
  const hasChanges = changedPermissions.length > 0;
  
  // Calculate impact severity
  const getSeverity = () => {
    if (changedPermissions.some(c => c.action === 'delete')) return 'high';
    if (changedPermissions.some(c => c.action === 'edit')) return 'medium';
    return 'low';
  };

  const severity = getSeverity();
  
  const severityConfig = {
    high: {
      color: 'text-rose-500',
      bgColor: 'bg-rose-50',
      borderColor: 'border-rose-200',
      icon: AlertTriangle,
      label: 'High Impact'
    },
    medium: {
      color: 'text-amber-500',
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-200',
      icon: Info,
      label: 'Medium Impact'
    },
    low: {
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-50',
      borderColor: 'border-emerald-200',
      icon: CheckCircle,
      label: 'Low Impact'
    }
  };

  const config = severityConfig[severity];
  const IconComponent = config.icon;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 20, height: 0 }}
          animate={{ opacity: 1, y: 0, height: 'auto' }}
          exit={{ opacity: 0, y: 20, height: 0 }}
          transition={{ duration: 0.3 }}
          className={cn(
            "rounded-xl border-2 p-4",
            config.bgColor,
            config.borderColor
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <IconComponent className={cn("w-5 h-5", config.color)} />
              <span className={cn("font-semibold", config.color)}>{config.label}</span>
            </div>
            {hasChanges && (
              <Badge variant="secondary" className="text-xs">
                {changedPermissions.length} changes pending
              </Badge>
            )}
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-4 mb-4">
            {/* Users Affected */}
            <div className="text-center p-3 bg-white/50 rounded-lg">
              <Users className="w-6 h-6 mx-auto mb-1 text-muted-foreground" />
              <div className="text-2xl font-bold">{userCount}</div>
              <div className="text-xs text-muted-foreground">Users Affected</div>
            </div>

            {/* Branches */}
            <div className="text-center p-3 bg-white/50 rounded-lg">
              <Building2 className="w-6 h-6 mx-auto mb-1 text-muted-foreground" />
              <div className="text-2xl font-bold">{branchCount}</div>
              <div className="text-xs text-muted-foreground">Branches</div>
            </div>

            {/* Role */}
            <div className="text-center p-3 bg-white/50 rounded-lg">
              <Shield className="w-6 h-6 mx-auto mb-1 text-muted-foreground" />
              <div className="text-sm font-bold truncate">{roleName || 'No Role'}</div>
              <div className="text-xs text-muted-foreground">Selected Role</div>
            </div>
          </div>

          {/* Permission Changes List */}
          {hasChanges && (
            <div className="space-y-2">
              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Permission Changes
              </h4>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {changedPermissions.slice(0, 5).map((change, index) => (
                  <motion.div
                    key={`${change.module}-${change.action}`}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center gap-2 text-sm p-2 bg-white/50 rounded-md"
                  >
                    <span className="flex-1 truncate font-medium">{change.module}</span>
                    <ArrowRight className="w-3 h-3 text-muted-foreground" />
                    <Badge 
                      variant={change.enabled ? "default" : "secondary"}
                      className={cn(
                        "text-xs capitalize",
                        change.enabled ? "bg-emerald-500" : "bg-rose-500 text-white"
                      )}
                    >
                      {change.action} {change.enabled ? 'ON' : 'OFF'}
                    </Badge>
                  </motion.div>
                ))}
                {changedPermissions.length > 5 && (
                  <div className="text-xs text-center text-muted-foreground py-1">
                    +{changedPermissions.length - 5} more changes
                  </div>
                )}
              </div>
            </div>
          )}

          {/* No Changes State */}
          {!hasChanges && (
            <div className="text-center py-4 text-muted-foreground">
              <CheckCircle className="w-8 h-8 mx-auto mb-2 text-emerald-400" />
              <p className="text-sm">No pending changes</p>
              <p className="text-xs">Modify permissions to see impact analysis</p>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ImpactAnalysis;
