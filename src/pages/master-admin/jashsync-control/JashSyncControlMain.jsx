import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Brain, LayoutDashboard, DollarSign, School, Wallet, Settings,
  BarChart3, FileText, Package, ShieldCheck, TrendingUp, Users,
  Activity, AlertTriangle, RefreshCw
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { useLocation, useNavigate } from 'react-router-dom';
import DashboardLayout from "@/components/DashboardLayout";
import api from '@/lib/api';

// Import Sub-modules
import GlobalDashboard from './GlobalDashboard';
import GlobalPricing from './pricing/GlobalPricing';
import SchoolPricing from './pricing/SchoolPricing';
import AllSchools from './schools/AllSchools';
import AllWallets from './wallets/AllWallets';
import RechargePackages from './packages/RechargePackages';
import TrialSettings from './settings/TrialSettings';
import AuditLog from './audit/AuditLog';

/**
 * JashSync Control Center — Master Admin Platform
 * 
 * Features:
 * 1. Global Dashboard - Overview of all schools, revenue, messages
 * 2. Pricing Control - Set global rates & per-school custom rates
 * 3. School Management - Enable/disable JashSync, view status
 * 4. Wallet Operations - View wallets, manual credit/debit
 * 5. Package Management - Create/edit recharge packages
 * 6. Trial Settings - Configure trial duration & free messages
 * 7. Analytics - Revenue, usage, trends
 * 8. Audit Log - All admin actions
 */

const JashSyncControlMain = () => {
  const { toast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState("dashboard");
  const [loading, setLoading] = useState(true);
  const [globalStats, setGlobalStats] = useState({
    totalSchools: 0,
    activeSchools: 0,
    trialSchools: 0,
    lowBalanceSchools: 0,
    totalMessages: 0,
    todayMessages: 0,
    monthRevenue: 0,
    totalRevenue: 0
  });

  // Tab configuration
  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'pricing', label: 'Pricing', icon: DollarSign },
    { id: 'schools', label: 'Schools', icon: School },
    { id: 'wallets', label: 'Wallets', icon: Wallet },
    { id: 'packages', label: 'Packages', icon: Package },
    { id: 'trial', label: 'Trial Settings', icon: Settings },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'audit', label: 'Audit Log', icon: FileText },
  ];

  // Fetch global stats
  useEffect(() => {
    const fetchGlobalStats = async () => {
      setLoading(true);
      try {
        // Fetch real data from API
        const response = await api.get('/jashsync/master/dashboard');
        console.log('[JashSync] Dashboard API response:', response.data);
        
        // Map API response to expected format
        const data = response.data || {};
        setGlobalStats({
          totalSchools: data.schools?.total || 0,
          activeSchools: data.schools?.active || 0,
          trialSchools: data.trialSchools || 0,
          lowBalanceSchools: data.schools?.lowBalance || 0,
          totalMessages: data.messaging?.totalMessagesThisMonth || 0,
          todayMessages: data.messaging?.todayMessages || 0,
          monthRevenue: data.messaging?.revenueThisMonth || 0,
          totalRevenue: data.totalRevenue || data.messaging?.totalRevenue || 0
        });
      } catch (error) {
        console.error('Failed to fetch stats:', error);
        toast({
          title: "Error",
          description: "Failed to load dashboard data",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchGlobalStats();
  }, []);

  // Handle tab from URL
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    if (tab && tabs.find(t => t.id === tab)) {
      setActiveTab(tab);
    }
  }, [location.search]);

  // Update URL when tab changes
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    navigate(`/master-admin/jashsync-control?tab=${tab}`, { replace: true });
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        {/* Header */}
        <div className="border-b border-gray-700/50 bg-gray-900/80 backdrop-blur-sm sticky top-0 z-10">
          <div className="max-w-[1800px] mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              {/* Logo & Title */}
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center shadow-lg shadow-orange-500/20">
                  <ShieldCheck className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white flex items-center gap-2">
                    JashSync Command Center
                    <Badge variant="outline" className="text-xs text-orange-400 border-orange-400/50">
                      MASTER ADMIN
                    </Badge>
                  </h1>
                  <p className="text-xs text-gray-400">Control all schools' JashSync settings & billing</p>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="flex items-center gap-6">
                <div className="text-right">
                  <p className="text-xs text-gray-400">Total Revenue</p>
                  <p className="text-lg font-bold text-green-400">₹{globalStats.totalRevenue.toLocaleString()}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-400">Active Schools</p>
                  <p className="text-lg font-bold text-white">{globalStats.activeSchools}</p>
                </div>
                <Button size="sm" variant="outline" className="border-gray-600">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-[1800px] mx-auto px-4 py-4">
          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
            {/* Tab Navigation */}
            <TabsList className="w-full flex flex-wrap justify-start gap-1 bg-gray-800/50 p-1 rounded-xl border border-gray-700/50 mb-4">
              {tabs.map((tab) => (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-red-600 data-[state=active]:text-white text-gray-400 hover:text-white transition-all"
                >
                  <tab.icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </TabsTrigger>
              ))}
            </TabsList>

            {/* Tab Contents */}
            <div className="bg-gray-800/30 rounded-xl border border-gray-700/50 min-h-[600px]">
              {/* Dashboard */}
              <TabsContent value="dashboard" className="m-0">
                <GlobalDashboard stats={globalStats} loading={loading} />
              </TabsContent>

              {/* Pricing */}
              <TabsContent value="pricing" className="m-0">
                <GlobalPricing />
              </TabsContent>

              {/* Schools */}
              <TabsContent value="schools" className="m-0">
                <AllSchools />
              </TabsContent>

              {/* Wallets */}
              <TabsContent value="wallets" className="m-0">
                <AllWallets />
              </TabsContent>

              {/* Packages */}
              <TabsContent value="packages" className="m-0">
                <RechargePackages />
              </TabsContent>

              {/* Trial Settings */}
              <TabsContent value="trial" className="m-0">
                <TrialSettings />
              </TabsContent>

              {/* Analytics */}
              <TabsContent value="analytics" className="m-0">
                <div className="p-6">
                  <h2 className="text-2xl font-bold text-white mb-4">Analytics</h2>
                  <p className="text-gray-400">Coming soon - Day 28-31</p>
                </div>
              </TabsContent>

              {/* Audit Log */}
              <TabsContent value="audit" className="m-0">
                <AuditLog />
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default JashSyncControlMain;
