import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Search, Settings, Eye, AlertTriangle, Check, X, 
  MoreVertical, School, Calendar, MessageSquare 
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

/**
 * AllSchools - View and manage all schools' JashSync status
 */
const AllSchools = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  // Mock school data
  const schools = [
    { id: '1', name: 'ABC International School', status: 'active', wallet: 2450, thisMonth: 15234, rateType: 'custom', trialEnd: null },
    { id: '2', name: 'XYZ Public School', status: 'active', wallet: 5120, thisMonth: 8456, rateType: 'default', trialEnd: null },
    { id: '3', name: 'Green Valley Academy', status: 'trial', wallet: 0, thisMonth: 3245, rateType: 'default', trialEnd: '15-04-2026' },
    { id: '4', name: 'Sunrise School', status: 'low_balance', wallet: 45, thisMonth: 12890, rateType: 'custom', trialEnd: null },
    { id: '5', name: 'Little Stars', status: 'blocked', wallet: 0, thisMonth: 0, rateType: 'default', trialEnd: null },
    { id: '6', name: 'Royal Academy', status: 'disabled', wallet: 890, thisMonth: 0, rateType: 'custom', trialEnd: null },
  ];

  const statusConfig = {
    active: { label: 'Active', color: 'bg-green-500', textColor: 'text-green-400' },
    trial: { label: 'Trial', color: 'bg-blue-500', textColor: 'text-blue-400' },
    low_balance: { label: 'Low Balance', color: 'bg-orange-500', textColor: 'text-orange-400' },
    blocked: { label: 'Blocked', color: 'bg-red-500', textColor: 'text-red-400' },
    disabled: { label: 'Disabled', color: 'bg-gray-500', textColor: 'text-gray-400' },
  };

  const filteredSchools = schools.filter(school => {
    const matchesSearch = school.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterStatus === 'all' || school.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white">All Schools</h2>
          <p className="text-gray-400">Manage JashSync status for all schools</p>
        </div>
        <Button variant="outline" className="border-gray-600">
          Export CSV
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search schools..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-gray-800 border-gray-700 text-white"
          />
        </div>
        <div className="flex gap-2">
          {['all', 'active', 'trial', 'low_balance', 'blocked', 'disabled'].map((status) => (
            <Button
              key={status}
              variant={filterStatus === status ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterStatus(status)}
              className={filterStatus === status ? 'bg-purple-600' : 'border-gray-600'}
            >
              {status === 'all' ? 'All' : statusConfig[status]?.label || status}
            </Button>
          ))}
        </div>
      </div>

      {/* Schools Table */}
      <Card className="bg-gray-800/50 border-gray-700/50">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left py-4 px-4 text-gray-400 font-medium">School</th>
                  <th className="text-center py-4 px-4 text-gray-400 font-medium">Status</th>
                  <th className="text-right py-4 px-4 text-gray-400 font-medium">Wallet</th>
                  <th className="text-right py-4 px-4 text-gray-400 font-medium">This Month</th>
                  <th className="text-center py-4 px-4 text-gray-400 font-medium">Rate Type</th>
                  <th className="text-center py-4 px-4 text-gray-400 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredSchools.map((school) => (
                  <tr key={school.id} className="border-b border-gray-700/50 hover:bg-gray-700/30">
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                          <School className="w-5 h-5 text-purple-400" />
                        </div>
                        <div>
                          <span className="text-white font-medium">{school.name}</span>
                          {school.trialEnd && (
                            <p className="text-xs text-gray-400">Trial ends: {school.trialEnd}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <Badge className={`${statusConfig[school.status]?.color} text-white`}>
                        {statusConfig[school.status]?.label}
                      </Badge>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <span className={school.wallet < 100 ? 'text-red-400' : 'text-white'}>
                        ₹{school.wallet.toLocaleString()}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <span className="text-white">{school.thisMonth.toLocaleString()}</span>
                      <span className="text-gray-400 text-sm"> msgs</span>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <Badge variant={school.rateType === 'custom' ? 'default' : 'outline'}>
                        {school.rateType === 'custom' ? 'Custom' : 'Default'}
                      </Badge>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-gray-800 border-gray-700">
                          <DropdownMenuItem className="text-gray-300 hover:text-white">
                            <Eye className="w-4 h-4 mr-2" /> View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-gray-300 hover:text-white">
                            <Settings className="w-4 h-4 mr-2" /> Custom Pricing
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-gray-300 hover:text-white">
                            <Calendar className="w-4 h-4 mr-2" /> Extend Trial
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-red-400 hover:text-red-300">
                            <X className="w-4 h-4 mr-2" /> Disable JashSync
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <p className="text-sm text-gray-500 mt-4 text-center">
        Showing {filteredSchools.length} of {schools.length} schools
      </p>
    </div>
  );
};

export default AllSchools;
