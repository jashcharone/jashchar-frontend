import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

const StatCard = ({ title, value, icon: Icon, change, changeType, index }) => {
  const isPositive = changeType === 'increase';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="bg-card/80 backdrop-blur-sm p-4 sm:p-6 rounded-[24px] sm:rounded-[32px] shadow-lg hover:shadow-xl transition-shadow duration-300 border"
    >
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <div className="p-2 sm:p-3 bg-primary/10 rounded-lg">
          <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
        </div>
        {change && (
          <div className={cn('flex items-center text-sm font-semibold', isPositive ? 'text-green-500' : 'text-red-500')}>
            {isPositive ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
            <span>{change}</span>
          </div>
        )}
      </div>
      <div>
        <p className="text-sm font-medium text-muted-foreground mb-1">{title}</p>
        <p className="text-xl sm:text-3xl font-bold text-foreground">{value}</p>
      </div>
    </motion.div>
  );
};

export default StatCard;
