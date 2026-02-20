/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * ORG WHATSAPP CONFIG - Super Admin
 * Configure organization's own WhatsApp provider (subscription required)
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { 
  Loader2, Save, TestTube, Settings, Shield, Phone, Building2, 
  Globe, Webhook, AlertCircle, CheckCircle2, Info
} from "lucide-react";
import api from '@/lib/api';
import { Separator } from "@/components/ui/separator";

const OrgWhatsAppConfig = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [activating, setActivating] = useState(false);
  const [testPhone, setTestPhone] = useState('');
  const [hasOwnConfig, setHasOwnConfig] = useState(false);
  
  const [config, setConfig] = useState({
    provider: 'meta_cloud',
    api_key: '',
    api_secret: '',
    access_token: '',
    phone_number_id: '',
    business_phone: '',
    business_name: '',
    webhook_url: '',
    webhook_verify_token: '',
    is_active: false,
    subscription_plan: 'standard',
    subscription_start_date: '',
    subscription_end_date: '',
    monthly_message_limit: 5000
  });

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const res = await api.get('/whatsapp/org/config');
      if (res.data.success && res.data.data) {
        setConfig(prev => ({ ...prev, ...res.data.data }));
        setHasOwnConfig(true);
      }
    } catch (error) {
      console.error('Error fetching org config:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await api.post('/whatsapp/org/config', config);
      if (res.data.success) {
        toast({
          title: "✅ Configuration Saved",
          description: "Your WhatsApp configuration has been saved",
        });
        setHasOwnConfig(true);
        fetchConfig();
      }
    } catch (error) {
      toast({
        title: "❌ Save Failed",
        description: error.response?.data?.error || error.message,
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleActivate = async () => {
    setActivating(true);
    try {
      const endpoint = config.is_active ? '/whatsapp/org/config/deactivate' : '/whatsapp/org/config/activate';
      const res = await api.post(endpoint);
      
      if (res.data.success) {
        toast({
          title: config.is_active ? "Switched to Platform Config" : "✅ Own Config Activated!",
          description: config.is_active 
            ? "Messages will now be sent via platform WhatsApp" 
            : "Messages will now be sent via your own WhatsApp",
        });
        fetchConfig();
      }
    } catch (error) {
      toast({
        title: "❌ Action Failed",
        description: error.response?.data?.error || error.message,
        variant: "destructive"
      });
    } finally {
      setActivating(false);
    }
  };

  const handleTestMessage = async () => {
    if (!testPhone) {
      toast({
        title: "Phone Required",
        description: "Enter a phone number to send test message",
        variant: "destructive"
      });
      return;
    }

    setTesting(true);
    try {
      const res = await api.post('/whatsapp/test', { 
        phone: testPhone,
        message: `🔔 Test from Your Organization\n\n✅ WhatsApp integration working!\n\n📅 ${new Date().toLocaleString('en-IN')}`
      });
      
      if (res.data.success) {
        toast({
          title: "✅ Test Sent!",
          description: `Sent via: ${res.data.sentVia} (${res.data.provider})`,
        });
      } else {
        throw new Error(res.data.error);
      }
    } catch (error) {
      toast({
        title: "❌ Test Failed",
        description: error.response?.data?.error || error.message,
        variant: "destructive"
      });
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-green-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Info Alert */}
      <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-900/20">
        <Info className="h-4 w-4 text-blue-600" />
        <AlertTitle className="text-blue-700">Own WhatsApp Configuration</AlertTitle>
        <AlertDescription className="text-blue-600">
          Configure your organization's own WhatsApp Business API. When active, messages will be sent via your account instead of platform default.
          This requires a WhatsApp Business subscription.
        </AlertDescription>
      </Alert>

      {/* Current Status */}
      <Card className={config.is_active ? "border-green-300 bg-green-50/50" : "border-orange-200 bg-orange-50/50"}>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {config.is_active ? (
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              ) : (
                <AlertCircle className="h-8 w-8 text-orange-500" />
              )}
              <div>
                <h3 className="font-semibold">
                  {config.is_active ? "Using Your Own Configuration" : "Using Platform Default"}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {config.is_active 
                    ? "Messages are sent via your WhatsApp Business account" 
                    : "Messages are sent via Jashchar platform WhatsApp"}
                </p>
              </div>
            </div>
            {hasOwnConfig && (
              <Button 
                variant={config.is_active ? "outline" : "default"}
                onClick={handleActivate}
                disabled={activating}
                className={config.is_active ? "" : "bg-green-600 hover:bg-green-700"}
              >
                {activating ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : null}
                {config.is_active ? "Switch to Platform" : "Activate My Config"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Provider Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Provider Settings
            </CardTitle>
            <CardDescription>
              Configure your WhatsApp Business API provider
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Provider</Label>
              <Select 
                value={config.provider} 
                onValueChange={(v) => setConfig(prev => ({ ...prev, provider: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="meta_cloud">Meta Cloud API (Official)</SelectItem>
                  <SelectItem value="twilio">Twilio WhatsApp</SelectItem>
                  <SelectItem value="gupshup">Gupshup</SelectItem>
                  <SelectItem value="wati">WATI</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator />

            <div className="space-y-2">
              <Label>API Key / Business Account ID</Label>
              <Input 
                value={config.api_key || ''} 
                onChange={(e) => setConfig(prev => ({ ...prev, api_key: e.target.value }))}
                placeholder="Enter API key or WABA ID"
              />
            </div>

            <div className="space-y-2">
              <Label>API Secret / App Secret</Label>
              <Input 
                type="password"
                value={config.api_secret || ''} 
                onChange={(e) => setConfig(prev => ({ ...prev, api_secret: e.target.value }))}
                placeholder="Leave blank to keep existing"
              />
            </div>

            <div className="space-y-2">
              <Label>Access Token</Label>
              <Input 
                type="password"
                value={config.access_token || ''} 
                onChange={(e) => setConfig(prev => ({ ...prev, access_token: e.target.value }))}
                placeholder="Leave blank to keep existing"
              />
            </div>

            <div className="space-y-2">
              <Label>Phone Number ID (Meta)</Label>
              <Input 
                value={config.phone_number_id || ''} 
                onChange={(e) => setConfig(prev => ({ ...prev, phone_number_id: e.target.value }))}
                placeholder="Phone number ID"
              />
            </div>
          </CardContent>
        </Card>

        {/* Business Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Business Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Business Name</Label>
              <Input 
                value={config.business_name || ''} 
                onChange={(e) => setConfig(prev => ({ ...prev, business_name: e.target.value }))}
                placeholder="Your School/College Name"
              />
            </div>

            <div className="space-y-2">
              <Label>Business Phone Number</Label>
              <Input 
                value={config.business_phone || ''} 
                onChange={(e) => setConfig(prev => ({ ...prev, business_phone: e.target.value }))}
                placeholder="+91 9876543210"
              />
            </div>

            <Separator />

            <div className="space-y-2">
              <Label>Webhook URL (Optional)</Label>
              <Input 
                value={config.webhook_url || ''} 
                onChange={(e) => setConfig(prev => ({ ...prev, webhook_url: e.target.value }))}
                placeholder="https://yourapi.com/webhook"
              />
            </div>

            <div className="space-y-2">
              <Label>Monthly Message Limit</Label>
              <Input 
                type="number"
                value={config.monthly_message_limit || 5000} 
                onChange={(e) => setConfig(prev => ({ ...prev, monthly_message_limit: parseInt(e.target.value) }))}
              />
            </div>
          </CardContent>
        </Card>

        {/* Test Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TestTube className="h-5 w-5" />
              Test Configuration
            </CardTitle>
            <CardDescription>
              Send a test message to verify setup
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Test Phone Number</Label>
              <Input 
                value={testPhone}
                onChange={(e) => setTestPhone(e.target.value)}
                placeholder="+91 9876543210"
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              variant="outline" 
              onClick={handleTestMessage}
              disabled={testing}
              className="flex-1"
            >
              {testing ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <TestTube className="h-4 w-4 mr-2" />
              )}
              Send Test Message
            </Button>
          </CardFooter>
        </Card>
      </div>

      {/* Save Button */}
      <div className="flex justify-end gap-4">
        <Button onClick={handleSave} disabled={saving} className="bg-green-600 hover:bg-green-700">
          {saving ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Save Configuration
        </Button>
      </div>
    </div>
  );
};

export default OrgWhatsAppConfig;
