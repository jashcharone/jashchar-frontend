// ═══════════════════════════════════════════════════════════════════════════
// JASHCHAR ERP - Responsive Stats Grid Component
// A reusable component for dashboard stat cards that auto-adjusts to all screen sizes
// Supports: 320px Mobile S to 4K Ultra-wide (2560px+)
// ═══════════════════════════════════════════════════════════════════════════

import React from 'react';
import { cn } from '@/lib/utils';
import { useResponsive, useGridColumns } from '@/hooks/useResponsive';
import { motion } from 'framer-motion';

/**
 * Responsive Stats Grid - Automatically adjusts columns based on screen size
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - Stat cards to render
 * @param {string} props.className - Additional classes
 * @param {Object} props.columns - Override column counts { xs: 1, sm: 2, md: 2, lg: 4, xl: 5 }
 * @param {string} props.gap - Gap size: 'sm' | 'md' | 'lg' (default: 'md')
 * @param {boolean} props.animate - Enable entrance animations (default: true)
 * @param {string} props.variant - Grid variant: 'auto' | 'fixed' (default: 'auto')
 */
export function ResponsiveStatsGrid({ 
  children, 
  className,
  columns,
  gap = 'md',
  animate = true,
  variant = 'auto',
}) {
  const { breakpoint, is4K, isUltraWide } = useResponsive();
  const gridColumns = useGridColumns(columns);
  
  // Gap size mapping
  const gapClass = {
    sm: 'gap-2 sm:gap-3',
    md: 'gap-3 sm:gap-4 lg:gap-5 3xl:gap-6',
    lg: 'gap-4 sm:gap-5 lg:gap-6 3xl:gap-8',
  }[gap];
  
  // For fixed variant, use CSS grid with fixed columns
  // For auto variant, use grid-auto-fit for fluid columns
  const gridClass = variant === 'fixed' 
    ? `grid-stats-${gridColumns}`
    : 'grid-auto-fit';
  
  // Container animation
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      },
    },
  };

  const Wrapper = animate ? motion.div : 'div';
  const wrapperProps = animate ? {
    variants: containerVariants,
    initial: 'hidden',
    animate: 'show',
  } : {};

  return (
    <Wrapper
      className={cn(
        'grid w-full',
        variant === 'auto' && 'grid-auto-fit',
        variant === 'fixed' && `grid-cols-1 xs:grid-cols-1 sm:grid-cols-2 md:grid-cols-2 tablet:grid-cols-3 lg:grid-cols-${Math.min(gridColumns, 4)} xl:grid-cols-${Math.min(gridColumns, 5)} 3xl:grid-cols-${Math.min(gridColumns, 6)}`,
        gapClass,
        className
      )}
      {...wrapperProps}
    >
      {children}
    </Wrapper>
  );
}

/**
 * Stat Card - Individual stat card with responsive styling
 * 
 * @param {Object} props
 * @param {string} props.title - Stat title/label
 * @param {string|number} props.value - Main stat value
 * @param {React.ReactNode} props.icon - Icon component
 * @param {string} props.iconBg - Icon background color class
 * @param {string} props.iconColor - Icon color class
 * @param {string} props.trend - Trend text (e.g., "+12%")
 * @param {boolean} props.trendUp - Trend direction (true = up/green, false = down/red)
 * @param {string} props.subtitle - Optional subtitle text
 * @param {Function} props.onClick - Click handler
 * @param {string} props.className - Additional classes
 */
export function StatCard({ 
  title, 
  value, 
  icon: Icon, 
  iconBg = 'bg-primary/10',
  iconColor = 'text-primary',
  trend,
  trendUp = true,
  subtitle,
  onClick,
  className,
}) {
  const { isMobile, isMobileS } = useResponsive();
  
  // Item animation
  const itemVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.95 },
    show: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 24,
      },
    },
  };

  return (
    <motion.div
      variants={itemVariants}
      className={cn(
        // Base card styles
        'relative flex items-center rounded-xl border border-border/50 bg-card p-fluid-sm sm:p-fluid-md',
        'shadow-sm hover:shadow-md transition-all duration-200',
        // Responsive adjustments
        isMobileS ? 'flex-col text-center gap-2' : 'gap-3 sm:gap-4',
        // Interactive
        onClick && 'cursor-pointer hover:bg-accent/5 active:scale-[0.98]',
        className
      )}
      onClick={onClick}
      whileHover={onClick ? { y: -2 } : undefined}
      whileTap={onClick ? { scale: 0.98 } : undefined}
    >
      {/* Icon */}
      {Icon && (
        <div 
          className={cn(
            'flex items-center justify-center rounded-lg shrink-0',
            'w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14',
            iconBg
          )}
        >
          <Icon className={cn(
            'w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7',
            iconColor
          )} />
        </div>
      )}
      
      {/* Content */}
      <div className={cn('flex-1 min-w-0', isMobileS && 'w-full')}>
        {/* Title */}
        <p className="text-fluid-xs sm:text-fluid-sm text-muted-foreground font-medium truncate">
          {title}
        </p>
        
        {/* Value + Trend */}
        <div className={cn(
          'flex items-baseline',
          isMobileS ? 'justify-center gap-2' : 'gap-2'
        )}>
          <span className="text-fluid-xl sm:text-fluid-2xl lg:text-fluid-3xl font-bold text-foreground tabular-nums">
            {value}
          </span>
          {trend && (
            <span className={cn(
              'text-fluid-xs font-medium',
              trendUp ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
            )}>
              {trendUp ? '↑' : '↓'} {trend}
            </span>
          )}
        </div>
        
        {/* Subtitle */}
        {subtitle && (
          <p className="text-fluid-xs text-muted-foreground/80 mt-0.5 truncate">
            {subtitle}
          </p>
        )}
      </div>
    </motion.div>
  );
}

/**
 * Mini Stat Card - Compact stat for dense layouts
 */
export function MiniStatCard({ 
  title, 
  value, 
  icon: Icon,
  iconColor = 'text-primary',
  onClick,
  className,
}) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, scale: 0.9 },
        show: { opacity: 1, scale: 1 },
      }}
      className={cn(
        'flex items-center gap-2 p-2 sm:p-3 rounded-lg border border-border/30 bg-card/50',
        'hover:bg-card transition-colors',
        onClick && 'cursor-pointer',
        className
      )}
      onClick={onClick}
    >
      {Icon && <Icon className={cn('w-4 h-4 shrink-0', iconColor)} />}
      <span className="text-xs sm:text-sm text-muted-foreground truncate">{title}</span>
      <span className="text-sm sm:text-base font-semibold text-foreground ml-auto tabular-nums">
        {value}
      </span>
    </motion.div>
  );
}

/**
 * Stats Row - Horizontal row of stats for quick info display
 */
export function StatsRow({ children, className }) {
  const { isMobile } = useResponsive();
  
  return (
    <div className={cn(
      'flex flex-wrap items-center',
      isMobile ? 'gap-2' : 'gap-4 sm:gap-6',
      className
    )}>
      {children}
    </div>
  );
}

/**
 * Stat Badge - Inline stat badge for headers
 */
export function StatBadge({ label, value, color = 'primary', className }) {
  const colorClasses = {
    primary: 'bg-primary/10 text-primary',
    success: 'bg-green-500/10 text-green-600 dark:text-green-400',
    warning: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400',
    danger: 'bg-red-500/10 text-red-600 dark:text-red-400',
    info: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  };
  
  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs sm:text-sm font-medium',
      colorClasses[color],
      className
    )}>
      <span className="text-muted-foreground">{label}:</span>
      <span className="font-semibold tabular-nums">{value}</span>
    </span>
  );
}

export default ResponsiveStatsGrid;
