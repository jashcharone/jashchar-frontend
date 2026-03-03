import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Minus, RefreshCw, AlertTriangle, Wallet } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

/**
 * AllWallets - View and manage all school wallets
 */
const AllWallets = () => {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');

  // Mock wallet data
  const wallets = [
    { id: '1', school: 'ABC International School', balance: 2450, status: 'healthy', lastRecharge: '01-03-2026' },
    { id: '2', school: 'XYZ Public School', balance: 5120, status: 'healthy', lastRecharge: '28-02-2026' },
    { id: '3', school: 'Green Valley Academy', balance: 0, status: 'trial', lastRecharge: '-' },
    { id: '4', school: 'Sunrise School', balance: 45, status: 'low', lastRecharge: '25-02-2026' },
    { id: '5', school: 'Little Stars', balance: 0, status: 'empty', lastRecharge: '15-02-2026' },
    { id: '6', school: 'Royal Academy', balance: 890, status: 'healthy', lastRecharge: '20-02-2026' },
  ];

  const statusConfig = {
    healthy: { label: 'Healthy', color: 'text-green-400 bg-green-500/20' },
    low: { label: 'Low Balance', color: 'text-orange-400 bg-orange-500/20' },
    empty: { label: 'Empty', color: 'text-red-400 bg-red-500/20' },
    trial: { label: 'Trial', color: 'text-blue-400 bg-blue-500/20' },
  };

  const handleManualCredit = (wallet) => {
    toast({
      title: "Manual Credit",
      description: `Opening credit dialog for ${wallet.school}`,
    });
  };

  const filteredWallets = wallets.filter(w => 
    w.school.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalBalance = wallets.reduce((sum, w) => sum + w.balance, 0);
  const lowBalanceCount = wallets.filter(w => w.status === 'low' || w.status === 'empty').length;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white">School Wallets</h2>
          <p className="text-gray-400">View and manage wallet balances</p>
        </div>
        <div className="flex gap-4">
          <div className="text-right">
            <p className="text-xs text-gray-400">Total Balance</p>
            <p className="text-lg font-bold text-green-400">₹{totalBalance.toLocaleString()}</p>
          </div>
          {lowBalanceCount > 0 && (
            <div className="text-right">
              <p className="text-xs text-gray-400">Low Balance</p>
              <p className="text-lg font-bold text-red-400">{lowBalanceCount} schools</p>
            </div>
          )}
        </div>
      </div>

      {/* Low Balance Alert */}
      {lowBalanceCount > 0 && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-6 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-400" />
          <div>
            <p className="text-sm text-red-400 font-medium">{lowBalanceCount} schools have low or empty balance</p>
            <p className="text-sm text-gray-400">These schools may not be able to send messages</p>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          placeholder="Search schools..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 bg-gray-800 border-gray-700 text-white max-w-md"
        />
      </div>

      {/* Wallets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredWallets.map((wallet) => (
          <Card key={wallet.id} className={`bg-gray-800/50 border-gray-700/50 ${
            wallet.status === 'low' || wallet.status === 'empty' ? 'border-red-500/30' : ''
          }`}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-white">{wallet.school}</h3>
                  <Badge className={statusConfig[wallet.status]?.color}>
                    {statusConfig[wallet.status]?.label}
                  </Badge>
                </div>
                <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                  <Wallet className="w-5 h-5 text-purple-400" />
                </div>
              </div>

              <div className="mb-4">
                <p className="text-3xl font-bold text-white">
                  ₹{wallet.balance.toLocaleString()}
                </p>
                <p className="text-sm text-gray-400">Last recharge: {wallet.lastRecharge}</p>
              </div>

              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  onClick={() => handleManualCredit(wallet)}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Credit
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="flex-1 border-gray-600"
                >
                  <Minus className="w-4 h-4 mr-1" />
                  Debit
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default AllWallets;
