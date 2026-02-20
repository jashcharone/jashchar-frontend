/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * WHATSAPP DASHBOARD - Super Admin (School Owner)
 * Main WhatsApp management dashboard for organizations
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  MessageSquare, Send, History, Settings, BarChart3, FileText, 
  Phone, CheckCircle2, XCircle, Clock, Loader2, TrendingUp, Building2
} from "lucide-react";
import api from '@/lib/api';

// Import Sub-components
import SendMessage from './SendMessage';
import MessageLogs from './MessageLogs';
import UsageStats from './UsageStats';
import OrgWhatsAppConfig from './OrgWhatsAppConfig';
import TemplatesList from './TemplatesList';

const WhatsAppDashboard = () => {
  const { toast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);

  useEffect(() => {
    fetchDashboard();
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

  const fetchDashboard = async () => {
    try {
      const res = await api.get('/whatsapp/dashboard');
      if (res.data.success) {
        setDashboardData(res.data.data);
      }
    } catch (error) {
      console.error('Error fetching dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, icon: Icon, color, subtext }) => (
    <Card className={`bg-gradient-to-br ${color}`}>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm opacity-80">{title}</p>
            <h3 className="text-2xl font-bold">{value}</h3>
            {subtext && <p className="text-xs opacity-70 mt-1">{subtext}</p>}
          </div>
          <Icon className="h-8 w-8 opacity-70" />
        </div>
      </CardContent>
    </Card>
  );

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2 text-green-700 dark:text-green-500">
              <MessageSquare className="h-8 w-8" />
              WhatsApp Manager
            </h1>
            <p className="text-muted-foreground mt-1">
              Send WhatsApp messages to students, parents, and staff
            </p>
          </div>
          {dashboardData && (
            <Badge 
              variant={dashboardData.is_org_config_active ? "default" : "secondary"}
              className={dashboardData.is_org_config_active ? "bg-blue-500" : ""}
            >
              {dashboardData.is_org_config_active ? "Using Own Config" : "Using Platform Config"}
            </Badge>
          )}
        </div>

        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4">
          <TabsList className="bg-green-50 dark:bg-green-900/20 p-1 flex flex-wrap h-auto gap-1">
            <TabsTrigger value="dashboard" className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 data-[state=active]:text-green-700">
              <BarChart3 className="h-4 w-4 mr-2" /> Dashboard
            </TabsTrigger>
            <TabsTrigger value="send" className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 data-[state=active]:text-green-700">
              <Send className="h-4 w-4 mr-2" /> Send Message
            </TabsTrigger>
            <TabsTrigger value="templates" className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 data-[state=active]:text-green-700">
              <FileText className="h-4 w-4 mr-2" /> Templates
            </TabsTrigger>
            <TabsTrigger value="logs" className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 data-[state=active]:text-green-700">
              <History className="h-4 w-4 mr-2" /> Message Logs
            </TabsTrigger>
            <TabsTrigger value="usage" className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 data-[state=active]:text-green-700">
              <TrendingUp className="h-4 w-4 mr-2" /> Usage & Billing
            </TabsTrigger>
            <TabsTrigger value="config" className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 data-[state=active]:text-blue-700 bg-blue-50 dark:bg-blue-900/20">
              <Settings className="h-4 w-4 mr-2" /> My Config
            </TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            {loading ? (
              <div className="flex items-center justify-center h-48">
                <Loader2 className="h-8 w-8 animate-spin text-green-600" />
              </div>
            ) : dashboardData ? (
              <>
                {/* Config Info */}
                <Card className="border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-green-700">
                      <Phone className="h-5 w-5" />
                      WhatsApp Configuration
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Provider</p>
                        <p className="font-medium capitalize">{dashboardData.provider?.replace('_', ' ')}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Business Phone</p>
                        <p className="font-medium">{dashboardData.business_phone || 'Not configured'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Config Source</p>
                        <Badge variant={dashboardData.config_source === 'organization' ? 'default' : 'secondary'}>
                          {dashboardData.config_source === 'organization' ? 'Own Configuration' : 'Platform Default'}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Today's Stats */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Today's Activity</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <StatCard
                      title="Total Sent"
                      value={dashboardData.today?.total || 0}
                      icon={MessageSquare}
                      color="from-blue-50 to-blue-100 dark:from-blue-900/30 text-blue-700 dark:text-blue-300"
                    />
                    <StatCard
                      title="Sent"
                      value={dashboardData.today?.sent || 0}
                      icon={Clock}
                      color="from-yellow-50 to-yellow-100 dark:from-yellow-900/30 text-yellow-700 dark:text-yellow-300"
                    />
                    <StatCard
                      title="Delivered"
                      value={dashboardData.today?.delivered || 0}
                      icon={CheckCircle2}
                      color="from-green-50 to-green-100 dark:from-green-900/30 text-green-700 dark:text-green-300"
                    />
                    <StatCard
                      title="Failed"
                      value={dashboardData.today?.failed || 0}
                      icon={XCircle}
                      color="from-red-50 to-red-100 dark:from-red-900/30 text-red-700 dark:text-red-300"
                    />
                  </div>
                </div>

                {/* This Month Stats */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">This Month</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <StatCard
                      title="Messages Sent"
                      value={dashboardData.this_month?.messages || 0}
                      icon={Send}
                      color="from-purple-50 to-purple-100 dark:from-purple-900/30 text-purple-700 dark:text-purple-300"
                    />
                    <StatCard
                      title="Delivered"
                      value={dashboardData.this_month?.delivered || 0}
                      icon={CheckCircle2}
                      color="from-emerald-50 to-emerald-100 dark:from-emerald-900/30 text-emerald-700 dark:text-emerald-300"
                    />
                    <StatCard
                      title="Failed"
                      value={dashboardData.this_month?.failed || 0}
                      icon={XCircle}
                      color="from-rose-50 to-rose-100 dark:from-rose-900/30 text-rose-700 dark:text-rose-300"
                    />
                    <StatCard
                      title="Total Cost"
                      value={`₹${(dashboardData.this_month?.cost || 0).toFixed(2)}`}
                      icon={BarChart3}
                      color="from-indigo-50 to-indigo-100 dark:from-indigo-900/30 text-indigo-700 dark:text-indigo-300"
                    />
                  </div>
                </div>

                {/* Templates Available */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Available Templates</CardTitle>
                    <CardDescription>
                      {dashboardData.templates_available} message templates ready to use
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button variant="outline" onClick={() => handleTabChange('templates')}>
                      <FileText className="h-4 w-4 mr-2" />
                      View All Templates
                    </Button>
                  </CardContent>
                </Card>

                {/* Quick Actions */}
                <div className="flex flex-wrap gap-4">
                  <Button onClick={() => handleTabChange('send')} className="bg-green-600 hover:bg-green-700">
                    <Send className="h-4 w-4 mr-2" />
                    Send New Message
                  </Button>
                  <Button variant="outline" onClick={() => handleTabChange('logs')}>
                    <History className="h-4 w-4 mr-2" />
                    View All Logs
                  </Button>
                  <Button variant="outline" onClick={fetchDashboard}>
                    <Loader2 className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                </div>
              </>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">
                    WhatsApp is not configured yet. Contact Master Admin or configure your own.
                  </p>
                  <Button className="mt-4" onClick={() => handleTabChange('config')}>
                    Configure WhatsApp
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Send Message Tab */}
          <TabsContent value="send" className="space-y-4">
            <SendMessage />
          </TabsContent>

          {/* Templates Tab */}
          <TabsContent value="templates" className="space-y-4">
            <TemplatesList />
          </TabsContent>

          {/* Logs Tab */}
          <TabsContent value="logs" className="space-y-4">
            <MessageLogs />
          </TabsContent>

          {/* Usage Tab */}
          <TabsContent value="usage" className="space-y-4">
            <UsageStats />
          </TabsContent>

          {/* Config Tab */}
          <TabsContent value="config" className="space-y-4">
            <OrgWhatsAppConfig />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default WhatsAppDashboard;
