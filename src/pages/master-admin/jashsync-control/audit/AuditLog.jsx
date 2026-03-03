import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Search, Filter, User, Calendar, Settings, 
  CreditCard, AlertTriangle, Eye, Download 
} from "lucide-react";

/**
 * AuditLog - View all admin actions on JashSync
 */
const AuditLog = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');

  // Mock audit data
  const auditLogs = [
    { 
      id: '1', 
      action: 'pricing_updated', 
      description: 'Updated custom pricing for ABC International School',
      admin: 'master@jashchar.com',
      target: 'ABC International School',
      timestamp: '10-03-2026 14:30',
      type: 'pricing'
    },
    { 
      id: '2', 
      action: 'trial_extended', 
      description: 'Extended trial by 15 days',
      admin: 'master@jashchar.com',
      target: 'Green Valley Academy',
      timestamp: '10-03-2026 12:15',
      type: 'trial'
    },
    { 
      id: '3', 
      action: 'manual_credit', 
      description: 'Manual wallet credit of ₹5000',
      admin: 'master@jashchar.com',
      target: 'XYZ Public School',
      timestamp: '09-03-2026 18:45',
      type: 'wallet'
    },
    { 
      id: '4', 
      action: 'school_blocked', 
      description: 'JashSync blocked due to policy violation',
      admin: 'master@jashchar.com',
      target: 'Little Stars',
      timestamp: '08-03-2026 10:00',
      type: 'access'
    },
    { 
      id: '5', 
      action: 'global_pricing_changed', 
      description: 'Changed global SMS rate from ₹0.12 to ₹0.10',
      admin: 'master@jashchar.com',
      target: 'Global Settings',
      timestamp: '05-03-2026 09:30',
      type: 'pricing'
    },
    { 
      id: '6', 
      action: 'package_created', 
      description: 'Created new recharge package "Enterprise Plus"',
      admin: 'master@jashchar.com',
      target: 'Recharge Packages',
      timestamp: '01-03-2026 16:20',
      type: 'settings'
    },
  ];

  const typeConfig = {
    pricing: { label: 'Pricing', color: 'bg-blue-500/20 text-blue-400', icon: CreditCard },
    trial: { label: 'Trial', color: 'bg-purple-500/20 text-purple-400', icon: Calendar },
    wallet: { label: 'Wallet', color: 'bg-green-500/20 text-green-400', icon: CreditCard },
    access: { label: 'Access', color: 'bg-red-500/20 text-red-400', icon: AlertTriangle },
    settings: { label: 'Settings', color: 'bg-orange-500/20 text-orange-400', icon: Settings },
  };

  const filteredLogs = auditLogs.filter(log => {
    const matchesSearch = log.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          log.target.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterType === 'all' || log.type === filterType;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white">Audit Log</h2>
          <p className="text-gray-400">Track all administrative actions</p>
        </div>
        <Button variant="outline" className="border-gray-600">
          <Download className="w-4 h-4 mr-2" />
          Export Log
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search actions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-gray-800 border-gray-700 text-white"
          />
        </div>
        <div className="flex gap-2">
          {['all', 'pricing', 'trial', 'wallet', 'access', 'settings'].map((type) => (
            <Button
              key={type}
              variant={filterType === type ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterType(type)}
              className={filterType === type ? 'bg-purple-600' : 'border-gray-600'}
            >
              {type === 'all' ? 'All' : typeConfig[type]?.label || type}
            </Button>
          ))}
        </div>
      </div>

      {/* Audit Log List */}
      <Card className="bg-gray-800/50 border-gray-700/50">
        <CardContent className="p-0">
          <div className="divide-y divide-gray-700/50">
            {filteredLogs.map((log) => {
              const TypeIcon = typeConfig[log.type]?.icon || Settings;
              return (
                <div key={log.id} className="p-4 hover:bg-gray-700/30 transition-colors">
                  <div className="flex items-start gap-4">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${typeConfig[log.type]?.color}`}>
                      <TypeIcon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-white">{log.description}</span>
                        <Badge className={typeConfig[log.type]?.color}>
                          {typeConfig[log.type]?.label}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-400">
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {log.admin}
                        </span>
                        <span>→</span>
                        <span>{log.target}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-400">{log.timestamp}</p>
                      <Button variant="ghost" size="sm" className="mt-1">
                        <Eye className="w-4 h-4 mr-1" />
                        Details
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="mt-4 flex justify-between items-center">
        <p className="text-sm text-gray-500">Showing {filteredLogs.length} actions</p>
        <Button variant="outline" className="border-gray-600">
          Load More
        </Button>
      </div>
    </div>
  );
};

export default AuditLog;
