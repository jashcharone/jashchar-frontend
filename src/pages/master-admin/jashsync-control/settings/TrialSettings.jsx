import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Save, Calendar, Gift, AlertTriangle } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

/**
 * TrialSettings - Configure global trial settings
 */
const TrialSettings = () => {
  const { toast } = useToast();

  const [settings, setSettings] = useState({
    trialDays: 60,
    trialMessagesLimit: 10000,
    autoBlockAfterTrial: true,
    reminderBeforeExpiry: 7,
    extendTrialAllowed: true,
    maxExtensionDays: 30,
    freeMessagesPerMonth: 0,
    requireCardBeforeTrial: false,
  });

  const handleSave = () => {
    toast({
      title: "Settings Saved",
      description: "Trial settings have been updated successfully.",
    });
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white">Trial Settings</h2>
          <p className="text-gray-400">Configure free trial for new schools</p>
        </div>
        <Button onClick={handleSave} className="bg-purple-600 hover:bg-purple-700">
          <Save className="w-4 h-4 mr-2" />
          Save Settings
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Trial Duration */}
        <Card className="bg-gray-800/50 border-gray-700/50">
          <CardHeader>
            <CardTitle className="text-lg text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-purple-400" />
              Trial Duration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-gray-300">Trial Period (Days)</Label>
              <Input
                type="number"
                value={settings.trialDays}
                onChange={(e) => setSettings({ ...settings, trialDays: parseInt(e.target.value) })}
                className="bg-gray-900 border-gray-600 text-white mt-1"
              />
              <p className="text-xs text-gray-500 mt-1">Currently: 2 months free trial</p>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="text-gray-300">Allow Trial Extension</Label>
                <p className="text-xs text-gray-500">Master Admin can extend trial</p>
              </div>
              <Switch 
                checked={settings.extendTrialAllowed}
                onCheckedChange={(v) => setSettings({ ...settings, extendTrialAllowed: v })}
              />
            </div>

            {settings.extendTrialAllowed && (
              <div>
                <Label className="text-gray-300">Max Extension Days</Label>
                <Input
                  type="number"
                  value={settings.maxExtensionDays}
                  onChange={(e) => setSettings({ ...settings, maxExtensionDays: parseInt(e.target.value) })}
                  className="bg-gray-900 border-gray-600 text-white mt-1"
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Usage Limits */}
        <Card className="bg-gray-800/50 border-gray-700/50">
          <CardHeader>
            <CardTitle className="text-lg text-white flex items-center gap-2">
              <Gift className="w-5 h-5 text-green-400" />
              Usage Limits
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-gray-300">Trial Messages Limit</Label>
              <Input
                type="number"
                value={settings.trialMessagesLimit}
                onChange={(e) => setSettings({ ...settings, trialMessagesLimit: parseInt(e.target.value) })}
                className="bg-gray-900 border-gray-600 text-white mt-1"
              />
              <p className="text-xs text-gray-500 mt-1">Max messages during trial (0 = unlimited)</p>
            </div>

            <div>
              <Label className="text-gray-300">Free Messages Per Month (After Trial)</Label>
              <Input
                type="number"
                value={settings.freeMessagesPerMonth}
                onChange={(e) => setSettings({ ...settings, freeMessagesPerMonth: parseInt(e.target.value) })}
                className="bg-gray-900 border-gray-600 text-white mt-1"
              />
              <p className="text-xs text-gray-500 mt-1">Completely FREE messages (0 = no free)</p>
            </div>
          </CardContent>
        </Card>

        {/* Expiry Behavior */}
        <Card className="bg-gray-800/50 border-gray-700/50">
          <CardHeader>
            <CardTitle className="text-lg text-white flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-400" />
              Expiry Behavior
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-gray-300">Auto-Block After Trial</Label>
                <p className="text-xs text-gray-500">Block messaging if no recharge</p>
              </div>
              <Switch 
                checked={settings.autoBlockAfterTrial}
                onCheckedChange={(v) => setSettings({ ...settings, autoBlockAfterTrial: v })}
              />
            </div>

            <div>
              <Label className="text-gray-300">Send Reminder Before Expiry (Days)</Label>
              <Input
                type="number"
                value={settings.reminderBeforeExpiry}
                onChange={(e) => setSettings({ ...settings, reminderBeforeExpiry: parseInt(e.target.value) })}
                className="bg-gray-900 border-gray-600 text-white mt-1"
              />
              <p className="text-xs text-gray-500 mt-1">Remind school admins before trial ends</p>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="text-gray-300">Require Payment Method</Label>
                <p className="text-xs text-gray-500">Require card before starting trial</p>
              </div>
              <Switch 
                checked={settings.requireCardBeforeTrial}
                onCheckedChange={(v) => setSettings({ ...settings, requireCardBeforeTrial: v })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Summary */}
        <Card className="bg-gray-800/50 border-gray-700/50">
          <CardHeader>
            <CardTitle className="text-lg text-white">Current Trial Terms</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Trial Period</span>
                <span className="text-white">{settings.trialDays} days</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Messages Limit</span>
                <span className="text-white">{settings.trialMessagesLimit.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Extension Allowed</span>
                <span className="text-white">{settings.extendTrialAllowed ? `Yes (up to ${settings.maxExtensionDays} days)` : 'No'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">After Trial</span>
                <span className="text-white">{settings.autoBlockAfterTrial ? 'Auto-Block' : 'Grace Period'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Reminder</span>
                <span className="text-white">{settings.reminderBeforeExpiry} days before</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TrialSettings;
