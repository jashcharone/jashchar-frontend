import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  School, Users, MessageSquare, TrendingUp, AlertTriangle, 
  DollarSign, Activity, Clock 
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

/**
 * GlobalDashboard - Overview of all JashSync activity across all schools
 */
const GlobalDashboard = ({ stats = {}, loading }) => {
  // Ensure all stats have default values to prevent NaN
  const safeStats = {
    totalSchools: stats.totalSchools || 0,
    activeSchools: stats.activeSchools || 0,
    trialSchools: stats.trialSchools || 0,
    lowBalanceSchools: stats.lowBalanceSchools || 0,
    todayMessages: stats.todayMessages || 0,
    totalMessages: stats.totalMessages || 0,
    monthRevenue: stats.monthRevenue || 0,
    totalRevenue: stats.totalRevenue || 0
  };

  const statCards = [
    {
      title: 'Total Schools',
      value: safeStats.totalSchools,
      icon: School,
      color: 'blue',
      change: '+5 this month'
    },
    {
      title: 'Active Schools',
      value: safeStats.activeSchools,
      subtitle: `${safeStats.trialSchools} on trial`,
      icon: Activity,
      color: 'green'
    },
    {
      title: 'Low Balance',
      value: safeStats.lowBalanceSchools,
      icon: AlertTriangle,
      color: 'red',
      alert: true
    },
    {
      title: 'Today Messages',
      value: safeStats.todayMessages.toLocaleString(),
      icon: MessageSquare,
      color: 'purple',
      change: '+12% from yesterday'
    },
    {
      title: 'Total Messages',
      value: `${(safeStats.totalMessages / 1000000).toFixed(1)}M`,
      icon: MessageSquare,
      color: 'indigo'
    },
    {
      title: 'This Month Revenue',
      value: `₹${(safeStats.monthRevenue / 1000).toFixed(0)}K`,
      icon: DollarSign,
      color: 'green',
      change: '+18% from last month'
    },
    {
      title: 'Total Revenue',
      value: `₹${(safeStats.totalRevenue / 100000).toFixed(1)}L`,
      icon: TrendingUp,
      color: 'emerald'
    },
    {
      title: 'Avg Messages/School',
      value: safeStats.activeSchools > 0 ? Math.round(safeStats.todayMessages / safeStats.activeSchools) : 0,
      subtitle: 'per day',
      icon: Users,
      color: 'cyan'
    }
  ];

  const colorClasses = {
    blue: 'from-blue-500/20 to-blue-600/20 text-blue-400',
    green: 'from-green-500/20 to-green-600/20 text-green-400',
    red: 'from-red-500/20 to-red-600/20 text-red-400',
    purple: 'from-purple-500/20 to-purple-600/20 text-purple-400',
    indigo: 'from-indigo-500/20 to-indigo-600/20 text-indigo-400',
    emerald: 'from-emerald-500/20 to-emerald-600/20 text-emerald-400',
    cyan: 'from-cyan-500/20 to-cyan-600/20 text-cyan-400'
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white">Global Dashboard</h2>
          <p className="text-gray-400">Overview of JashSync across all schools</p>
        </div>
        <Badge variant="outline" className="text-gray-400">
          Last updated: Just now
        </Badge>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((stat, idx) => (
          <Card 
            key={idx} 
            className={`bg-gradient-to-br ${colorClasses[stat.color]} border-gray-700/50 ${stat.alert ? 'animate-pulse' : ''}`}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-400">{stat.title}</p>
                  <p className="text-2xl font-bold text-white mt-1">{stat.value}</p>
                  {stat.subtitle && (
                    <p className="text-xs text-gray-400 mt-1">{stat.subtitle}</p>
                  )}
                  {stat.change && (
                    <p className="text-xs text-green-400 mt-1">{stat.change}</p>
                  )}
                </div>
                <div className={`w-10 h-10 rounded-lg bg-gray-800/50 flex items-center justify-center`}>
                  <stat.icon className={`w-5 h-5 ${stat.alert ? 'text-red-400' : 'text-gray-400'}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'View Low Balance Schools', icon: AlertTriangle, color: 'red' },
          { label: 'Update Global Pricing', icon: DollarSign, color: 'green' },
          { label: 'Manage Trial Settings', icon: Clock, color: 'purple' },
          { label: 'Export Reports', icon: TrendingUp, color: 'blue' }
        ].map((action, idx) => (
          <button
            key={idx}
            className="p-4 bg-gray-800/50 border border-gray-700/50 rounded-xl hover:bg-gray-700/50 transition-all flex items-center gap-3 text-left"
          >
            <action.icon className={`w-5 h-5 text-${action.color}-400`} />
            <span className="text-sm text-gray-300">{action.label}</span>
          </button>
        ))}
      </div>

      {/* Recent Activity */}
      <h3 className="text-lg font-semibold text-white mb-4 mt-8">Recent Activity</h3>
      <div className="bg-gray-800/30 rounded-xl border border-gray-700/50 divide-y divide-gray-700/50">
        {[
          { action: 'ABC School recharged wallet', amount: '₹2,000', time: '5 mins ago' },
          { action: 'XYZ College low balance alert', amount: '₹45', time: '15 mins ago' },
          { action: 'New school activated JashSync', amount: 'Trial', time: '1 hour ago' },
          { action: 'Global pricing updated', amount: 'Text: ₹0.10', time: '2 hours ago' },
        ].map((item, idx) => (
          <div key={idx} className="p-4 flex items-center justify-between">
            <span className="text-gray-300">{item.action}</span>
            <div className="flex items-center gap-4">
              <Badge variant="outline">{item.amount}</Badge>
              <span className="text-sm text-gray-500">{item.time}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default GlobalDashboard;
