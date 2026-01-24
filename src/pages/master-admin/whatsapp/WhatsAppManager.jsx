import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageSquare, Edit, Link as LinkIcon, Send, History, Settings, BarChart3 } from "lucide-react";
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
      const res = await api.get('/whatsapp-manager/accounts');
      if (res.data.success) {
        setAccounts(res.data.data);
      }
    } catch (error) {
      console.error("Failed to fetch accounts", error);
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
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2 text-green-700 dark:text-green-500">
            <MessageSquare className="h-8 w-8" />
            WhatsApp Manager
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage WhatsApp Business Accounts, Templates, Assignments, and Campaigns.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchAccounts} disabled={loading}>
            <Settings className="h-4 w-4 mr-2" />
            Refresh Data
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4">
        <TabsList className="bg-green-50 dark:bg-green-900/20 p-1 flex flex-wrap h-auto">
          <TabsTrigger value="accounts" className="data-[state=active]:bg-white data-[state=active]:text-green-700 data-[state=active]:shadow-sm">
            <Settings className="h-4 w-4 mr-2" /> Accounts
          </TabsTrigger>
          <TabsTrigger value="templates" className="data-[state=active]:bg-white data-[state=active]:text-green-700 data-[state=active]:shadow-sm">
            <Edit className="h-4 w-4 mr-2" /> Templates
          </TabsTrigger>
          <TabsTrigger value="assignments" className="data-[state=active]:bg-white data-[state=active]:text-green-700 data-[state=active]:shadow-sm">
            <LinkIcon className="h-4 w-4 mr-2" /> Assignments
          </TabsTrigger>
          <TabsTrigger value="send" className="data-[state=active]:bg-white data-[state=active]:text-green-700 data-[state=active]:shadow-sm">
            <Send className="h-4 w-4 mr-2" /> Send Message
          </TabsTrigger>
          <TabsTrigger value="logs" className="data-[state=active]:bg-white data-[state=active]:text-green-700 data-[state=active]:shadow-sm">
            <History className="h-4 w-4 mr-2" /> Logs
          </TabsTrigger>
          <TabsTrigger value="billing" className="data-[state=active]:bg-white data-[state=active]:text-green-700 data-[state=active]:shadow-sm">
            <BarChart3 className="h-4 w-4 mr-2" /> Usage & Billing
          </TabsTrigger>
        </TabsList>

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
      </Tabs>
    </div>
    </DashboardLayout>
  );
};

export default WhatsAppManager;
