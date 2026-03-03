import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  MessageSquare, Users, Radio, Bell, Image, Settings, Zap, Brain, 
  Wallet, Shield, BarChart3, Bot, Send, Hash, Volume2, Lock,
  MessageCircle, Megaphone, FolderOpen, Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { useLocation, useNavigate } from 'react-router-dom';
import DashboardLayout from "@/components/DashboardLayout";
import api from '@/services/api';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';

// Import Sub-modules
import { ChatList, ChatWindow, NewChatModal } from './chats';
import { ChannelList, ChannelWindow, CreateChannelModal } from './channels';
import { BroadcastList, BroadcastComposer, BroadcastDetail } from './broadcast';
import { NotificationHub, NotificationSettings } from './notifications';
import { MediaVault, MediaUploader, MediaViewer } from './media';
import { WalletDashboard, RechargeModal, TransactionHistory } from './wallet';
import { AIAssistPanel, TranslateModal, SummarizeView } from './ai';
import { AutomationDashboard, CreateRuleModal, ScheduledMessages } from './automation';
import { PrivacySettings, BlockedUsers, OnlineStatusControl } from './privacy';
import { AdminDashboard, ModerationPanel, PermissionsManager, AnalyticsView } from './admin';

// Day 22-23: Real-time notification components
import NotificationBadge from '@/components/jashsync/NotificationBadge';
import NotificationToast from '@/components/jashsync/NotificationToast';

/**
 * JashSync — The Brain-Connected Messenger
 * WhatsApp × Slack × AI = JashSync
 * 
 * Core Modules:
 * 1. Chats - Direct messaging (Parent, Teacher, Staff)
 * 2. Channels - Class channels, Announcements, Departments
 * 3. Broadcast - Bulk messaging, Fee reminders, Alerts
 * 4. Notifications - Priority inbox, AI filtered
 * 5. Media Vault - Centralized media storage
 * 6. Wallet - Message credits, Recharge
 * 7. AI Assist - Smart replies, Summarize, Translate
 * 8. Automation - Auto-replies, Triggers
 * 9. Privacy - Online status, Read receipts control
 * 10. Admin - Moderation, Permissions
 */

const JashSyncMain = () => {
  const { toast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, organizationId, currentSessionId } = useAuth();
  const { selectedBranch } = useBranch();
  
  const [activeTab, setActiveTab] = useState("chats");
  const [walletData, setWalletData] = useState(null);
  const [trialStatus, setTrialStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedChat, setSelectedChat] = useState(null);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [showCreateChannelModal, setShowCreateChannelModal] = useState(false);
  const [selectedBroadcast, setSelectedBroadcast] = useState(null);
  const [broadcastView, setBroadcastView] = useState('list'); // 'list', 'compose', 'detail'
  const [showNotificationSettings, setShowNotificationSettings] = useState(false);
  const [showMediaUploader, setShowMediaUploader] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [showMediaViewer, setShowMediaViewer] = useState(false);
  const [mediaList, setMediaList] = useState([]);
  const [showRechargeModal, setShowRechargeModal] = useState(false);
  const [showTransactionHistory, setShowTransactionHistory] = useState(false);
  const [selectedRechargePackage, setSelectedRechargePackage] = useState(null);
  const [showTranslateModal, setShowTranslateModal] = useState(false);
  const [showSummarizeView, setShowSummarizeView] = useState(false);
  const [aiInputText, setAiInputText] = useState('');
  const [automationView, setAutomationView] = useState('dashboard'); // 'dashboard', 'scheduled'
  const [showCreateRuleModal, setShowCreateRuleModal] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [showBlockedUsers, setShowBlockedUsers] = useState(false);
  const [showOnlineStatusControl, setShowOnlineStatusControl] = useState(false);
  const [showModerationPanel, setShowModerationPanel] = useState(false);
  const [showPermissionsManager, setShowPermissionsManager] = useState(false);
  const [showAnalyticsView, setShowAnalyticsView] = useState(false);
  const [stats, setStats] = useState({
    totalConversations: 0,
    unreadMessages: 0,
    todaySent: 0,
    channelCount: 0
  });

  // Tab configuration
  const tabs = [
    { id: 'chats', label: 'Chats', icon: MessageCircle, badge: stats.unreadMessages || null },
    { id: 'channels', label: 'Channels', icon: Hash },
    { id: 'broadcast', label: 'Broadcast', icon: Megaphone },
    { id: 'notifications', label: 'Alerts', icon: Bell },
    { id: 'media', label: 'Media', icon: FolderOpen },
    { id: 'wallet', label: 'Wallet', icon: Wallet },
    { id: 'ai', label: 'AI Assist', icon: Sparkles, badgeText: 'AI', badgeColor: 'purple' },
    { id: 'automation', label: 'Automation', icon: Zap },
    { id: 'privacy', label: 'Privacy', icon: Lock },
    { id: 'admin', label: 'Admin', icon: Settings },
  ];

  // Fetch initial data
  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true);
      try {
        // Fetch wallet/trial status
        // const walletRes = await api.get('/jashsync/wallet');
        // setWalletData(walletRes.data.data);
        
        // Fetch trial status
        // const trialRes = await api.get('/jashsync/trial/status');
        // setTrialStatus(trialRes.data.data);
        
        // Temporarily using mock data
        setWalletData({
          balance: 2450.50,
          messagesLeft: 24505,
          currency: 'INR'
        });
        
        setTrialStatus({
          isActive: false,
          daysLeft: 0,
          messagesRemaining: 0
        });
        
        setStats({
          totalConversations: 45,
          unreadMessages: 12,
          todaySent: 156,
          channelCount: 8
        });
        
      } catch (error) {
        console.error('Failed to fetch JashSync data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchInitialData();
  }, [organizationId, selectedBranch?.id]);

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
    navigate(`/super-admin/jashsync?tab=${tab}`, { replace: true });
  };

  // Placeholder component for modules not yet implemented
  const ComingSoonModule = ({ title, description, icon: Icon }) => (
    <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-8">
      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center mb-6 animate-pulse">
        <Icon className="w-10 h-10 text-purple-400" />
      </div>
      <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{title}</h3>
      <p className="text-gray-500 dark:text-gray-400 max-w-md mb-6">{description}</p>
      <Badge variant="outline" className="text-purple-600 dark:text-purple-400 border-purple-300 dark:border-purple-400/50">
        Coming Soon — Day 7+
      </Badge>
    </div>
  );

  return (
    <DashboardLayout>
      <div className="jashsync-container">
        {/* Header */}
        <div className="jashsync-header sticky top-0 z-10">
          <div className="max-w-[1800px] mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              {/* Logo & Title */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
                  <Brain className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    JashSync
                    <Badge variant="outline" className="text-xs text-purple-600 dark:text-purple-400 border-purple-300 dark:border-purple-400/50">
                      BETA
                    </Badge>
                  </h1>
                  <p className="text-xs text-gray-500 dark:text-gray-400">The Brain-Connected Messenger</p>
                </div>
              </div>

              {/* Wallet Status */}
              <div className="flex items-center gap-4">
                {/* Notification Badge - Day 22-23 */}
                <NotificationBadge 
                  variant="icon"
                  onSettingsClick={() => setShowNotificationSettings(true)}
                />
                
                {/* Trial/Wallet Badge */}
                {trialStatus?.isActive ? (
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/30">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-sm text-green-400">
                      Trial: {trialStatus.daysLeft} days left
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 px-4 py-2 rounded-xl jashsync-wallet">
                    <div className="text-right">
                      <p className="text-xs text-gray-500 dark:text-gray-400">Wallet Balance</p>
                      <p className="text-lg font-bold text-gray-900 dark:text-white">
                        ₹{walletData?.balance?.toLocaleString() || '0'}
                      </p>
                    </div>
                    <div className="w-px h-8 bg-gray-200 dark:bg-gray-700" />
                    <div className="text-right">
                      <p className="text-xs text-gray-500 dark:text-gray-400">Messages Left</p>
                      <p className="text-lg font-bold text-purple-600 dark:text-purple-400">
                        ~{walletData?.messagesLeft?.toLocaleString() || '0'}
                      </p>
                    </div>
                    <Button size="sm" className="ml-2 bg-purple-600 hover:bg-purple-700">
                      <Wallet className="w-4 h-4 mr-1" />
                      Recharge
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-[1800px] mx-auto px-4 py-4">
          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
            {/* Tab Navigation */}
            <TabsList className="w-full flex flex-wrap justify-start gap-1 jashsync-tabs p-1 rounded-xl mb-4">
              {tabs.map((tab) => (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-blue-600 data-[state=active]:text-white text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-all"
                >
                  <tab.icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                  {tab.badge && (
                    <Badge className="ml-1 bg-red-500 text-white text-xs px-1.5 py-0">
                      {tab.badge}
                    </Badge>
                  )}
                  {tab.badgeText && (
                    <Badge 
                      variant="outline" 
                      className={`ml-1 text-xs ${tab.badgeColor === 'purple' ? 'text-purple-400 border-purple-400/50' : ''}`}
                    >
                      {tab.badgeText}
                    </Badge>
                  )}
                </TabsTrigger>
              ))}
            </TabsList>

            {/* Tab Contents */}
            <div className="jashsync-card min-h-[600px]">
              {/* Chats */}
              <TabsContent value="chats" className="m-0 h-[calc(100vh-280px)]">
                <div className="flex h-full">
                  {/* Chat List - Left Panel */}
                  <ChatList 
                    onSelectChat={setSelectedChat}
                    selectedChatId={selectedChat?.id}
                    onNewChat={() => setShowNewChatModal(true)}
                    className="w-80 lg:w-96 shrink-0"
                  />
                  
                  {/* Chat Window - Right Panel */}
                  <ChatWindow 
                    conversation={selectedChat}
                    onBack={() => setSelectedChat(null)}
                    className="flex-1"
                  />
                </div>
              </TabsContent>

              {/* Channels */}
              <TabsContent value="channels" className="m-0 h-[calc(100vh-280px)]">
                <div className="flex h-full">
                  {/* Channel List - Left Panel */}
                  <ChannelList 
                    onSelectChannel={setSelectedChannel}
                    selectedChannelId={selectedChannel?.id}
                    onCreateChannel={() => setShowCreateChannelModal(true)}
                    className="w-80 lg:w-96 shrink-0"
                  />
                  
                  {/* Channel Window - Right Panel */}
                  <ChannelWindow 
                    channel={selectedChannel}
                    onBack={() => setSelectedChannel(null)}
                    className="flex-1"
                  />
                </div>
              </TabsContent>

              {/* Broadcast */}
              <TabsContent value="broadcast" className="m-0 h-[calc(100vh-280px)]">
                <div className="flex h-full">
                  {broadcastView === 'list' && (
                    <>
                      {/* Broadcast List */}
                      <BroadcastList 
                        onCreateBroadcast={() => setBroadcastView('compose')}
                        onSelectBroadcast={(b) => {
                          setSelectedBroadcast(b);
                          setBroadcastView('detail');
                        }}
                        selectedBroadcastId={selectedBroadcast?.id}
                        className="w-full lg:w-[450px] shrink-0"
                      />
                      
                      {/* Detail Panel (desktop) */}
                      <div className="hidden lg:flex flex-1">
                        <BroadcastDetail 
                          broadcast={selectedBroadcast}
                          onBack={() => setSelectedBroadcast(null)}
                          className="flex-1"
                        />
                      </div>
                    </>
                  )}
                  
                  {broadcastView === 'compose' && (
                    <BroadcastComposer 
                      onBack={() => setBroadcastView('list')}
                      onSave={() => {
                        setBroadcastView('list');
                        setSelectedBroadcast(null);
                      }}
                      className="w-full"
                    />
                  )}
                  
                  {broadcastView === 'detail' && (
                    <BroadcastDetail 
                      broadcast={selectedBroadcast}
                      onBack={() => setBroadcastView('list')}
                      className="w-full lg:hidden"
                    />
                  )}
                </div>
              </TabsContent>

              {/* Notifications */}
              <TabsContent value="notifications" className="m-0 h-[calc(100vh-280px)]">
                <NotificationHub 
                  onOpenSettings={() => setShowNotificationSettings(true)}
                  className="h-full"
                />
              </TabsContent>

              {/* Media */}
              <TabsContent value="media" className="m-0 h-[calc(100vh-280px)]">
                <MediaVault 
                  onUpload={() => setShowMediaUploader(true)}
                  onViewMedia={(media) => {
                    setSelectedMedia(media);
                    setShowMediaViewer(true);
                  }}
                  className="h-full"
                />
              </TabsContent>

              {/* Wallet */}
              <TabsContent value="wallet" className="m-0 h-[calc(100vh-280px)]">
                <WalletDashboard 
                  onRecharge={(pkg) => {
                    setSelectedRechargePackage(pkg || null);
                    setShowRechargeModal(true);
                  }}
                  onViewHistory={() => setShowTransactionHistory(true)}
                  className="h-full"
                />
              </TabsContent>

              {/* AI Assist */}
              <TabsContent value="ai" className="m-0 h-[calc(100vh-280px)]">
                <AIAssistPanel 
                  currentMessage={aiInputText}
                  onTranslate={() => setShowTranslateModal(true)}
                  onSummarize={() => setShowSummarizeView(true)}
                  onInsertReply={(text) => {
                    setAiInputText(text);
                    toast({ title: "Reply Ready", description: "Go to Chats tab to send" });
                  }}
                />
              </TabsContent>

              {/* Automation */}
              <TabsContent value="automation" className="m-0 h-[calc(100vh-280px)]">
                {automationView === 'dashboard' && (
                  <AutomationDashboard 
                    onCreateRule={() => {
                      setEditingRule(null);
                      setShowCreateRuleModal(true);
                    }}
                    onEditRule={(rule) => {
                      setEditingRule(rule);
                      setShowCreateRuleModal(true);
                    }}
                    onViewScheduled={() => setAutomationView('scheduled')}
                    className="h-full"
                  />
                )}
                {automationView === 'scheduled' && (
                  <ScheduledMessages 
                    onBack={() => setAutomationView('dashboard')}
                    onScheduleNew={() => setShowCreateRuleModal(true)}
                  />
                )}
              </TabsContent>

              {/* Privacy */}
              <TabsContent value="privacy" className="m-0 h-[calc(100vh-280px)]">
                <PrivacySettings 
                  onViewBlocked={() => setShowBlockedUsers(true)}
                  onViewOnlineStatus={() => setShowOnlineStatusControl(true)}
                  className="h-full"
                />
              </TabsContent>

              {/* Admin */}
              <TabsContent value="admin" className="m-0 h-[calc(100vh-280px)]">
                <AdminDashboard 
                  onViewModeration={() => setShowModerationPanel(true)}
                  onViewPermissions={() => setShowPermissionsManager(true)}
                  onViewAnalytics={() => setShowAnalyticsView(true)}
                  className="h-full"
                />
              </TabsContent>
            </div>
          </Tabs>
        </div>
        
        {/* New Chat Modal */}
        <NewChatModal 
          isOpen={showNewChatModal}
          onClose={() => setShowNewChatModal(false)}
          onChatCreated={(chat) => {
            setSelectedChat(chat);
            setShowNewChatModal(false);
          }}
        />
        
        {/* Create Channel Modal */}
        <CreateChannelModal 
          isOpen={showCreateChannelModal}
          onClose={() => setShowCreateChannelModal(false)}
          onChannelCreated={(channel) => {
            setSelectedChannel(channel);
            setShowCreateChannelModal(false);
          }}
        />
        
        {/* Notification Settings Modal */}
        <NotificationSettings 
          open={showNotificationSettings}
          onOpenChange={setShowNotificationSettings}
        />
        
        {/* Media Uploader Modal */}
        <MediaUploader 
          open={showMediaUploader}
          onOpenChange={setShowMediaUploader}
          onUploadComplete={() => {
            // Refresh media list if needed
          }}
        />
        
        {/* Media Viewer Modal */}
        <MediaViewer 
          media={selectedMedia}
          open={showMediaViewer}
          onOpenChange={setShowMediaViewer}
          allMedia={mediaList}
          onNavigate={(media) => setSelectedMedia(media)}
          onDelete={(id) => {
            setMediaList(prev => prev.filter(m => m.id !== id));
            setShowMediaViewer(false);
          }}
        />
        
        {/* Recharge Modal */}
        <RechargeModal 
          open={showRechargeModal}
          onOpenChange={setShowRechargeModal}
          selectedPackage={selectedRechargePackage}
          onSuccess={() => {
            // Refresh wallet data
            setSelectedRechargePackage(null);
          }}
        />
        
        {/* Transaction History Modal */}
        <TransactionHistory 
          open={showTransactionHistory}
          onOpenChange={setShowTransactionHistory}
        />
        
        {/* Translate Modal */}
        <TranslateModal 
          open={showTranslateModal}
          onOpenChange={setShowTranslateModal}
          initialText={aiInputText}
          onTranslated={(text) => {
            setAiInputText(text);
            toast({ title: "Translation Ready", description: "Text has been translated" });
          }}
        />
        
        {/* Summarize View Modal */}
        <SummarizeView 
          open={showSummarizeView}
          onOpenChange={setShowSummarizeView}
          conversation={selectedChat}
          messages={[]}
        />
        
        {/* Create/Edit Automation Rule Modal */}
        <CreateRuleModal 
          open={showCreateRuleModal}
          onOpenChange={setShowCreateRuleModal}
          editRule={editingRule}
          onRuleCreated={(rule) => {
            toast({ title: "Success", description: `Rule "${rule.name}" has been ${editingRule ? 'updated' : 'created'}` });
            setShowCreateRuleModal(false);
            setEditingRule(null);
          }}
        />
        
        {/* Blocked Users Modal */}
        <BlockedUsers 
          open={showBlockedUsers}
          onOpenChange={setShowBlockedUsers}
        />
        
        {/* Online Status Control Modal */}
        <OnlineStatusControl 
          open={showOnlineStatusControl}
          onOpenChange={setShowOnlineStatusControl}
        />
        
        {/* Moderation Panel Modal */}
        <ModerationPanel 
          open={showModerationPanel}
          onOpenChange={setShowModerationPanel}
        />
        
        {/* Permissions Manager Modal */}
        <PermissionsManager 
          open={showPermissionsManager}
          onOpenChange={setShowPermissionsManager}
        />
        
        {/* Analytics View Modal */}
        <AnalyticsView 
          open={showAnalyticsView}
          onOpenChange={setShowAnalyticsView}
        />
      </div>
      
      {/* Real-time Notification Toast - Day 22-23 */}
      <NotificationToast />
    </DashboardLayout>
  );
};

export default JashSyncMain;
