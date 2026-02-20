/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PLATFORM WHATSAPP CONFIG - Master Admin Only
 * Configure Jashchar's default WhatsApp provider settings
 * This is used as fallback for organizations without their own subscription
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Save, TestTube, Settings, Shield, Phone, Building2, Globe, Webhook, CreditCard } from "lucide-react";
import api from '@/lib/api';
import { Separator } from "@/components/ui/separator";

const PlatformConfig = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testPhone, setTestPhone] = useState('');
  
  const [config, setConfig] = useState({
    provider: 'meta_cloud',
    api_key: '',
    api_secret: '',
    access_token: '',
    phone_number_id: '',
    business_phone: '',
    business_name: 'Jashchar ERP',
    webhook_url: '',
    webhook_verify_token: '',
    is_active: true,
    monthly_message_limit: 10000,
    cost_per_message: 0.50
  });

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const res = await api.get('/whatsapp/platform/config');
      if (res.data.success && res.data.data) {
        setConfig(prev => ({ ...prev, ...res.data.data }));
      }
    } catch (error) {
      console.error('Error fetching platform config:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await api.post('/whatsapp/platform/config', config);
      if (res.data.success) {
        toast({
          title: "✅ Configuration Saved",
          description: "Platform WhatsApp configuration has been updated",
        });
        fetchConfig(); // Refresh to get masked values
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
        message: `🔔 Test message from Jashchar ERP Platform\n\n✅ WhatsApp integration is configured correctly!\n\n📅 ${new Date().toLocaleString('en-IN')}`
      });
      
      if (res.data.success) {
        toast({
          title: "✅ Test Message Sent!",
          description: `Message sent via ${res.data.provider} (${res.data.sentVia})`,
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
      {/* Header Info Card */}
      <Card className="border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-400">
            <Shield className="h-5 w-5" />
            Platform Default Configuration
          </CardTitle>
          <CardDescription>
            This configuration is used as the default WhatsApp provider for all organizations.
            Organizations can override this with their own subscription.
          </CardDescription>
        </CardHeader>
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
              Select and configure the WhatsApp provider
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
                placeholder="Enter API secret (leave blank to keep existing)"
              />
            </div>

            <div className="space-y-2">
              <Label>Access Token</Label>
              <Input 
                type="password"
                value={config.access_token || ''} 
                onChange={(e) => setConfig(prev => ({ ...prev, access_token: e.target.value }))}
                placeholder="Enter access token (leave blank to keep existing)"
              />
            </div>

            <div className="space-y-2">
              <Label>Phone Number ID (Meta Cloud)</Label>
              <Input 
                value={config.phone_number_id || ''} 
                onChange={(e) => setConfig(prev => ({ ...prev, phone_number_id: e.target.value }))}
                placeholder="Phone number ID from Meta"
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
                placeholder="Jashchar ERP"
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
              <Label>Webhook URL</Label>
              <Input 
                value={config.webhook_url || ''} 
                onChange={(e) => setConfig(prev => ({ ...prev, webhook_url: e.target.value }))}
                placeholder="https://api.jashcharerp.com/api/whatsapp/webhook"
              />
            </div>

            <div className="space-y-2">
              <Label>Webhook Verify Token</Label>
              <Input 
                value={config.webhook_verify_token || ''} 
                onChange={(e) => setConfig(prev => ({ ...prev, webhook_verify_token: e.target.value }))}
                placeholder="your-verify-token"
              />
            </div>
          </CardContent>
        </Card>

        {/* Usage Limits & Billing */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Usage & Billing
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Monthly Message Limit</Label>
              <Input 
                type="number"
                value={config.monthly_message_limit || 10000} 
                onChange={(e) => setConfig(prev => ({ ...prev, monthly_message_limit: parseInt(e.target.value) }))}
              />
              <p className="text-xs text-muted-foreground">
                Platform-wide limit for all organizations using platform config
              </p>
            </div>

            <div className="space-y-2">
              <Label>Cost Per Message (₹)</Label>
              <Input 
                type="number"
                step="0.01"
                value={config.cost_per_message || 0.50} 
                onChange={(e) => setConfig(prev => ({ ...prev, cost_per_message: parseFloat(e.target.value) }))}
              />
              <p className="text-xs text-muted-foreground">
                Cost charged to organizations per message sent
              </p>
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div>
                <Label>Platform Configuration Active</Label>
                <p className="text-xs text-muted-foreground">
                  Enable/disable platform WhatsApp for all organizations
                </p>
              </div>
              <Switch 
                checked={config.is_active}
                onCheckedChange={(v) => setConfig(prev => ({ ...prev, is_active: v }))}
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
              Send a test message to verify the configuration
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
          <CardFooter className="flex gap-2">
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
              Send Test
            </Button>
          </CardFooter>
        </Card>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} className="bg-green-600 hover:bg-green-700">
          {saving ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Save Platform Configuration
        </Button>
      </div>
    </div>
  );
};

export default PlatformConfig;
