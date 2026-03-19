import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageSquare, Edit, Link as LinkIcon, Send, History, Settings, BarChart3, Bot, Blocks, Zap, Brain, Building2, Shield, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import api from '@/lib/api';
import { useLocation, useNavigate } from 'react-router-dom';
import DashboardLayout from "@/components/DashboardLayout";

// Import Sub-components
import WhatsAppAccounts from './WhatsAppAccounts';
import WhatsAppTemplates from './WhatsAppTemplates';
import WhatsAppAssignments from './WhatsAppAssignments';
import WhatsAppSender from './WhatsAppSender';
import WhatsAppLogs from './WhatsAppLogs';
import WhatsAppBillingDashboard from './WhatsAppBillingDashboard';
import WhatsAppModules from './WhatsAppModules';
import WhatsAppAI from './WhatsAppAI';
import PlatformConfig from './PlatformConfig';
import OrgUsageOverview from './OrgUsageOverview';

const WhatsAppManager = () => {
  const { toast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("accounts");
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch Accounts (Centralized State)
  const fetchAccounts = async () => {
    setLoading(true);
    try {
      console.log('[WhatsAppManager] Fetching accounts...');
      const res = await api.get('/whatsapp-manager/accounts');
      console.log('[WhatsAppManager] Accounts response:', res.data);
      if (res.data.success) {
        setAccounts(res.data.data);
        console.log('[WhatsAppManager] Accounts loaded:', res.data.data?.length || 0);
      }
    } catch (error) {
      console.error("[WhatsAppManager] Failed to fetch accounts", error);
      // Don't show toast here to avoid spamming if sub-components also fetch
    } finally {
      setLoading(false);
    }
  };

  // Initial Fetch
  useEffect(() => {
    fetchAccounts();
  }, []);

  // Sync tab with URL
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    if (tab) setActiveTab(tab);
  }, [location]);

  const handleTabChange = (value) => {
    setActiveTab(value);
    navigate(`?tab=${value}`, { replace: true });
  };

  // Callback when accounts are updated in the Accounts tab
  const handleAccountsUpdate = (updatedAccounts) => {
    setAccounts(updatedAccounts);
  };

  return (
    <DashboardLayout>
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-2 text-green-700 dark:text-green-500">
            <MessageSquare className="h-6 w-6 sm:h-8 sm:w-8 flex-shrink-0" />
            <span className="truncate">WhatsApp Manager</span>
          </h1>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base hidden sm:block">
            AI-Powered WhatsApp Business Manager - Modules, Automation, Chatbots & More
          </p>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <Button variant="outline" onClick={fetchAccounts} disabled={loading} size="sm" className="sm:size-default">
            <Settings className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Refresh Data</span>
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4">
        <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
          <TabsList className="bg-green-50 dark:bg-green-900/20 p-1 inline-flex w-max sm:flex sm:flex-wrap sm:w-auto h-auto gap-1">
            {/* 🔒 Platform Admin Features (Master Admin Only) */}
            <TabsTrigger value="platform-config" className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 data-[state=active]:text-red-700 data-[state=active]:shadow-sm bg-red-50 dark:bg-red-900/20 text-xs sm:text-sm whitespace-nowrap">
              <Shield className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" /> <span className="hidden sm:inline">Platform Config</span><span className="sm:hidden">Config</span>
            </TabsTrigger>
            <TabsTrigger value="org-usage" className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 data-[state=active]:text-red-700 data-[state=active]:shadow-sm bg-red-50 dark:bg-red-900/20 text-xs sm:text-sm whitespace-nowrap">
              <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" /> <span className="hidden sm:inline">Org Usage</span><span className="sm:hidden">Usage</span>
            </TabsTrigger>
            
            {/* Core Features */}
            <TabsTrigger value="accounts" className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 data-[state=active]:text-green-700 data-[state=active]:shadow-sm text-xs sm:text-sm whitespace-nowrap">
              <Settings className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" /> Accounts
            </TabsTrigger>
            <TabsTrigger value="templates" className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 data-[state=active]:text-green-700 data-[state=active]:shadow-sm text-xs sm:text-sm whitespace-nowrap">
              <Edit className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" /> Templates
            </TabsTrigger>
            <TabsTrigger value="send" className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 data-[state=active]:text-green-700 data-[state=active]:shadow-sm text-xs sm:text-sm whitespace-nowrap">
              <Send className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" /> <span className="hidden sm:inline">Send Message</span><span className="sm:hidden">Send</span>
            </TabsTrigger>
            <TabsTrigger value="logs" className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 data-[state=active]:text-green-700 data-[state=active]:shadow-sm text-xs sm:text-sm whitespace-nowrap">
              <History className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" /> Logs
            </TabsTrigger>
            
            {/* AI & Advanced Features */}
            <TabsTrigger value="ai" className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 data-[state=active]:text-purple-700 data-[state=active]:shadow-sm bg-purple-50 dark:bg-purple-900/20 text-xs sm:text-sm whitespace-nowrap">
              <Bot className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" /> <span className="hidden sm:inline">AI Chatbot</span><span className="sm:hidden">AI</span>
            </TabsTrigger>
            <TabsTrigger value="modules" className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 data-[state=active]:text-blue-700 data-[state=active]:shadow-sm bg-blue-50 dark:bg-blue-900/20 text-xs sm:text-sm whitespace-nowrap">
              <Blocks className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" /> Modules
            </TabsTrigger>
            
            {/* Admin Features */}
            <TabsTrigger value="assignments" className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 data-[state=active]:text-green-700 data-[state=active]:shadow-sm text-xs sm:text-sm whitespace-nowrap">
              <Building2 className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" /> <span className="hidden sm:inline">Branch Assign</span><span className="sm:hidden">Assign</span>
            </TabsTrigger>
            <TabsTrigger value="billing" className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 data-[state=active]:text-green-700 data-[state=active]:shadow-sm text-xs sm:text-sm whitespace-nowrap">
              <BarChart3 className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" /> Billing
            </TabsTrigger>
          </TabsList>
        </div>

        {/* 🔒 Platform Config Tab (Master Admin Only) */}
        <TabsContent value="platform-config" className="space-y-4">
          <PlatformConfig />
        </TabsContent>

        {/* 🔒 Org Usage Overview (Master Admin Only) */}
        <TabsContent value="org-usage" className="space-y-4">
          <OrgUsageOverview />
        </TabsContent>

        <TabsContent value="accounts" className="space-y-4">
          <WhatsAppAccounts onAccountsChange={handleAccountsUpdate} />
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <WhatsAppTemplates accounts={accounts} />
        </TabsContent>

        <TabsContent value="assignments" className="space-y-4">
          <WhatsAppAssignments accounts={accounts} />
        </TabsContent>

        <TabsContent value="send" className="space-y-4">
          <WhatsAppSender accounts={accounts} />
        </TabsContent>

        <TabsContent value="logs" className="space-y-4">
          <WhatsAppLogs />
        </TabsContent>

        <TabsContent value="billing" className="space-y-4">
          <WhatsAppBillingDashboard />
        </TabsContent>

        {/* NEW: AI Chatbot Tab */}
        <TabsContent value="ai" className="space-y-4">
          <WhatsAppAI />
        </TabsContent>

        {/* NEW: Modules Tab */}
        <TabsContent value="modules" className="space-y-4">
          <WhatsAppModules />
        </TabsContent>
      </Tabs>
    </div>
    </DashboardLayout>
  );
};

export default WhatsAppManager;
