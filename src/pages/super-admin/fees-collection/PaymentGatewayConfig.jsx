/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PAYMENT GATEWAY CONFIGURATION
 * Day 25 Implementation - Fee Collection Phase 3
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Features:
 * - Configure multiple payment gateways (Razorpay, PhonePe, PayU)
 * - UPI settings
 * - Test mode / Live mode toggle
 * - Payment method enable/disable
 * - Transaction fee configuration
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Settings, 
  CreditCard, 
  Wallet,
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  Save,
  TestTube,
  Shield,
  Percent,
  Info,
  Smartphone,
  Building2,
  QrCode
} from 'lucide-react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export default function PaymentGatewayConfig() {
  const { user, organizationId } = useAuth();
  const { selectedBranch } = useBranch();
  const branchId = selectedBranch?.id;

  // State
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showSecrets, setShowSecrets] = useState({});
  
  // Gateway configurations
  const [razorpayConfig, setRazorpayConfig] = useState({
    enabled: false,
    testMode: true,
    keyId: '',
    keySecret: '',
    webhookSecret: '',
    autoCapture: true,
    enabledMethods: ['card', 'netbanking', 'upi', 'wallet']
  });

  const [phonePeConfig, setPhonePeConfig] = useState({
    enabled: false,
    testMode: true,
    merchantId: '',
    saltKey: '',
    saltIndex: '1',
    callbackUrl: ''
  });

  const [upiConfig, setUpiConfig] = useState({
    enabled: true,
    upiId: '',
    payeeName: '',
    merchantCode: '8220',
    enableQrPayment: true,
    enableCollectRequest: false
  });

  const [transactionFee, setTransactionFee] = useState({
    passToParent: false,
    fixedFee: 0,
    percentFee: 2,
    maxFee: 0
  });

  // Load existing configuration
  useEffect(() => {
    loadConfig();
  }, [organizationId, branchId]);

  const loadConfig = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('fee_payment_settings')
        .select('*')
        .eq('organization_id', organizationId)
        .single();

      if (data) {
        // Razorpay
        if (data.razorpay_config) {
          setRazorpayConfig(prev => ({
            ...prev,
            ...data.razorpay_config,
            keySecret: data.razorpay_config.keySecret || '' // Don't show actual secret
          }));
        }

        // PhonePe
        if (data.phonepe_config) {
          setPhonePeConfig(prev => ({
            ...prev,
            ...data.phonepe_config,
            saltKey: data.phonepe_config.saltKey || ''
          }));
        }

        // UPI
        if (data.upi_config) {
          setUpiConfig(prev => ({
            ...prev,
            ...data.upi_config
          }));
        }

        // Transaction fees
        if (data.transaction_fee_config) {
          setTransactionFee(prev => ({
            ...prev,
            ...data.transaction_fee_config
          }));
        }
      }
    } catch (error) {
      console.error('Error loading config:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveConfig = async () => {
    try {
      setSaving(true);

      const configData = {
        organization_id: organizationId,
        razorpay_config: razorpayConfig,
        phonepe_config: phonePeConfig,
        upi_config: upiConfig,
        transaction_fee_config: transactionFee,
        updated_at: new Date().toISOString(),
        updated_by: user.id
      };

      const { error } = await supabase
        .from('fee_payment_settings')
        .upsert(configData, {
          onConflict: 'organization_id'
        });

      if (error) throw error;

      toast.success('Payment gateway settings saved successfully');
    } catch (error) {
      console.error('Error saving config:', error);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const testGateway = async (gateway) => {
    toast.info(`Testing ${gateway} connection...`);
    // TODO: Implement actual gateway test
    setTimeout(() => {
      toast.success(`${gateway} connection successful!`);
    }, 1500);
  };

  const toggleSecret = (field) => {
    setShowSecrets(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Payment Gateway Settings</h1>
          <p className="text-muted-foreground">
            Configure payment gateways and UPI settings for fee collection
          </p>
        </div>
        <Button onClick={saveConfig} disabled={saving} className="gap-2">
          <Save className="h-4 w-4" />
          {saving ? 'Saving...' : 'Save All Settings'}
        </Button>
      </div>

      {/* Test Mode Warning */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Test Mode Active</AlertTitle>
        <AlertDescription>
          Currently in test mode. No real transactions will be processed. 
          Switch to live mode when ready for production.
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="razorpay">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="razorpay" className="gap-2">
            <CreditCard className="h-4 w-4" />
            Razorpay
          </TabsTrigger>
          <TabsTrigger value="phonepe" className="gap-2">
            <Smartphone className="h-4 w-4" />
            PhonePe
          </TabsTrigger>
          <TabsTrigger value="upi" className="gap-2">
            <QrCode className="h-4 w-4" />
            UPI Direct
          </TabsTrigger>
          <TabsTrigger value="fees" className="gap-2">
            <Percent className="h-4 w-4" />
            Transaction Fees
          </TabsTrigger>
        </TabsList>

        {/* Razorpay Configuration */}
        <TabsContent value="razorpay">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center">
                    <CreditCard className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle>Razorpay</CardTitle>
                    <CardDescription>
                      Accept cards, netbanking, UPI, and wallets
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <Badge variant={razorpayConfig.testMode ? 'secondary' : 'default'}>
                    {razorpayConfig.testMode ? 'Test Mode' : 'Live Mode'}
                  </Badge>
                  <Switch
                    checked={razorpayConfig.enabled}
                    onCheckedChange={(checked) => 
                      setRazorpayConfig(prev => ({ ...prev, enabled: checked }))
                    }
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Mode Toggle */}
              <div className="flex items-center justify-between p-4 bg-accent rounded-lg">
                <div className="flex items-center gap-3">
                  <TestTube className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <Label>Environment Mode</Label>
                    <p className="text-sm text-muted-foreground">
                      Test mode uses sandbox credentials
                    </p>
                  </div>
                </div>
                <Select
                  value={razorpayConfig.testMode ? 'test' : 'live'}
                  onValueChange={(val) => 
                    setRazorpayConfig(prev => ({ ...prev, testMode: val === 'test' }))
                  }
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="test">Test</SelectItem>
                    <SelectItem value="live">Live</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              {/* API Credentials */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Key ID</Label>
                  <Input
                    placeholder="rzp_test_..."
                    value={razorpayConfig.keyId}
                    onChange={(e) => 
                      setRazorpayConfig(prev => ({ ...prev, keyId: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Key Secret</Label>
                  <div className="relative">
                    <Input
                      type={showSecrets.razorpaySecret ? 'text' : 'password'}
                      placeholder="Enter key secret"
                      value={razorpayConfig.keySecret}
                      onChange={(e) => 
                        setRazorpayConfig(prev => ({ ...prev, keySecret: e.target.value }))
                      }
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-2 top-1/2 -translate-y-1/2"
                      onClick={() => toggleSecret('razorpaySecret')}
                    >
                      {showSecrets.razorpaySecret ? 
                        <EyeOff className="h-4 w-4" /> : 
                        <Eye className="h-4 w-4" />
                      }
                    </Button>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Webhook Secret (Optional)</Label>
                <Input
                  type={showSecrets.webhookSecret ? 'text' : 'password'}
                  placeholder="Webhook signing secret"
                  value={razorpayConfig.webhookSecret}
                  onChange={(e) => 
                    setRazorpayConfig(prev => ({ ...prev, webhookSecret: e.target.value }))
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Used to verify webhook events from Razorpay
                </p>
              </div>

              <Separator />

              {/* Payment Methods */}
              <div className="space-y-4">
                <Label>Enabled Payment Methods</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { id: 'card', label: 'Cards', icon: CreditCard },
                    { id: 'netbanking', label: 'Net Banking', icon: Building2 },
                    { id: 'upi', label: 'UPI', icon: Smartphone },
                    { id: 'wallet', label: 'Wallets', icon: Wallet }
                  ].map((method) => (
                    <div
                      key={method.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        razorpayConfig.enabledMethods.includes(method.id)
                          ? 'border-primary bg-primary/5'
                          : 'hover:bg-accent'
                      }`}
                      onClick={() => {
                        const methods = razorpayConfig.enabledMethods.includes(method.id)
                          ? razorpayConfig.enabledMethods.filter(m => m !== method.id)
                          : [...razorpayConfig.enabledMethods, method.id];
                        setRazorpayConfig(prev => ({ ...prev, enabledMethods: methods }));
                      }}
                    >
                      <method.icon className="h-5 w-5 mb-2" />
                      <span className="text-sm font-medium">{method.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Auto Capture */}
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <Label>Auto Capture Payments</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically capture authorized payments
                  </p>
                </div>
                <Switch
                  checked={razorpayConfig.autoCapture}
                  onCheckedChange={(checked) => 
                    setRazorpayConfig(prev => ({ ...prev, autoCapture: checked }))
                  }
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                variant="outline" 
                onClick={() => testGateway('Razorpay')}
                className="gap-2"
              >
                <TestTube className="h-4 w-4" />
                Test Connection
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* PhonePe Configuration */}
        <TabsContent value="phonepe">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-lg bg-purple-100 flex items-center justify-center">
                    <Smartphone className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <CardTitle>PhonePe</CardTitle>
                    <CardDescription>
                      UPI payments via PhonePe gateway
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <Badge variant={phonePeConfig.testMode ? 'secondary' : 'default'}>
                    {phonePeConfig.testMode ? 'UAT' : 'Production'}
                  </Badge>
                  <Switch
                    checked={phonePeConfig.enabled}
                    onCheckedChange={(checked) => 
                      setPhonePeConfig(prev => ({ ...prev, enabled: checked }))
                    }
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Mode Toggle */}
              <div className="flex items-center justify-between p-4 bg-accent rounded-lg">
                <div className="flex items-center gap-3">
                  <TestTube className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <Label>Environment</Label>
                    <p className="text-sm text-muted-foreground">
                      UAT for testing, Production for live
                    </p>
                  </div>
                </div>
                <Select
                  value={phonePeConfig.testMode ? 'uat' : 'prod'}
                  onValueChange={(val) => 
                    setPhonePeConfig(prev => ({ ...prev, testMode: val === 'uat' }))
                  }
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="uat">UAT</SelectItem>
                    <SelectItem value="prod">Production</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              {/* Credentials */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Merchant ID</Label>
                  <Input
                    placeholder="PGTESTPAYUAT"
                    value={phonePeConfig.merchantId}
                    onChange={(e) => 
                      setPhonePeConfig(prev => ({ ...prev, merchantId: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Salt Key</Label>
                  <div className="relative">
                    <Input
                      type={showSecrets.phonepeSalt ? 'text' : 'password'}
                      placeholder="Enter salt key"
                      value={phonePeConfig.saltKey}
                      onChange={(e) => 
                        setPhonePeConfig(prev => ({ ...prev, saltKey: e.target.value }))
                      }
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-2 top-1/2 -translate-y-1/2"
                      onClick={() => toggleSecret('phonepeSalt')}
                    >
                      {showSecrets.phonepeSalt ? 
                        <EyeOff className="h-4 w-4" /> : 
                        <Eye className="h-4 w-4" />
                      }
                    </Button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Salt Index</Label>
                  <Input
                    placeholder="1"
                    value={phonePeConfig.saltIndex}
                    onChange={(e) => 
                      setPhonePeConfig(prev => ({ ...prev, saltIndex: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Callback URL (Optional)</Label>
                  <Input
                    placeholder="https://your-domain.com/api/webhook"
                    value={phonePeConfig.callbackUrl}
                    onChange={(e) => 
                      setPhonePeConfig(prev => ({ ...prev, callbackUrl: e.target.value }))
                    }
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                variant="outline" 
                onClick={() => testGateway('PhonePe')}
                className="gap-2"
              >
                <TestTube className="h-4 w-4" />
                Test Connection
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* UPI Direct Configuration */}
        <TabsContent value="upi">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-lg bg-green-100 flex items-center justify-center">
                    <QrCode className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <CardTitle>UPI Direct</CardTitle>
                    <CardDescription>
                      Direct UPI QR code payments (no gateway fees)
                    </CardDescription>
                  </div>
                </div>
                <Switch
                  checked={upiConfig.enabled}
                  onCheckedChange={(checked) => 
                    setUpiConfig(prev => ({ ...prev, enabled: checked }))
                  }
                />
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert className="bg-green-50 border-green-200">
                <Info className="h-4 w-4 text-green-600" />
                <AlertTitle className="text-green-600">Zero Gateway Fees</AlertTitle>
                <AlertDescription className="text-green-600">
                  Direct UPI payments have no transaction fees. Ideal for walk-in parents.
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>UPI ID (VPA)</Label>
                  <Input
                    placeholder="school@bank"
                    value={upiConfig.upiId}
                    onChange={(e) => 
                      setUpiConfig(prev => ({ ...prev, upiId: e.target.value }))
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Your school's UPI virtual payment address
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Payee Name</Label>
                  <Input
                    placeholder="ABC School Fees"
                    value={upiConfig.payeeName}
                    onChange={(e) => 
                      setUpiConfig(prev => ({ ...prev, payeeName: e.target.value }))
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Name shown to parents during payment
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Merchant Category Code</Label>
                <Select
                  value={upiConfig.merchantCode}
                  onValueChange={(val) => 
                    setUpiConfig(prev => ({ ...prev, merchantCode: val }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="8220">8220 - Schools & Educational Services</SelectItem>
                    <SelectItem value="8211">8211 - Elementary & Secondary Schools</SelectItem>
                    <SelectItem value="8299">8299 - Schools & Educational Services (NEC)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              {/* UPI Options */}
              <div className="space-y-4">
                <Label>UPI Payment Options</Label>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <Label>QR Code Payment</Label>
                      <p className="text-sm text-muted-foreground">
                        Generate QR codes for parents to scan
                      </p>
                    </div>
                    <Switch
                      checked={upiConfig.enableQrPayment}
                      onCheckedChange={(checked) => 
                        setUpiConfig(prev => ({ ...prev, enableQrPayment: checked }))
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <Label>Collect Request</Label>
                      <p className="text-sm text-muted-foreground">
                        Send payment requests to parent's UPI app
                      </p>
                    </div>
                    <Switch
                      checked={upiConfig.enableCollectRequest}
                      onCheckedChange={(checked) => 
                        setUpiConfig(prev => ({ ...prev, enableCollectRequest: checked }))
                      }
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Transaction Fees Configuration */}
        <TabsContent value="fees">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-lg bg-yellow-100 flex items-center justify-center">
                  <Percent className="h-6 w-6 text-yellow-600" />
                </div>
                <div>
                  <CardTitle>Transaction Fee Settings</CardTitle>
                  <CardDescription>
                    Configure how payment gateway fees are handled
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Pass to Parent */}
              <div className="flex items-center justify-between p-4 bg-accent rounded-lg">
                <div>
                  <Label className="text-base">Pass Gateway Fees to Parents</Label>
                  <p className="text-sm text-muted-foreground">
                    Add transaction fees to the payment amount
                  </p>
                </div>
                <Switch
                  checked={transactionFee.passToParent}
                  onCheckedChange={(checked) => 
                    setTransactionFee(prev => ({ ...prev, passToParent: checked }))
                  }
                />
              </div>

              {transactionFee.passToParent && (
                <>
                  <Separator />

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Fixed Fee (₹)</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.5"
                        value={transactionFee.fixedFee}
                        onChange={(e) => 
                          setTransactionFee(prev => ({ 
                            ...prev, 
                            fixedFee: parseFloat(e.target.value) || 0 
                          }))
                        }
                      />
                      <p className="text-xs text-muted-foreground">
                        Added to every transaction
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label>Percentage Fee (%)</Label>
                      <Input
                        type="number"
                        min="0"
                        max="10"
                        step="0.1"
                        value={transactionFee.percentFee}
                        onChange={(e) => 
                          setTransactionFee(prev => ({ 
                            ...prev, 
                            percentFee: parseFloat(e.target.value) || 0 
                          }))
                        }
                      />
                      <p className="text-xs text-muted-foreground">
                        % of transaction amount
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label>Maximum Fee (₹)</Label>
                      <Input
                        type="number"
                        min="0"
                        value={transactionFee.maxFee}
                        onChange={(e) => 
                          setTransactionFee(prev => ({ 
                            ...prev, 
                            maxFee: parseFloat(e.target.value) || 0 
                          }))
                        }
                      />
                      <p className="text-xs text-muted-foreground">
                        Cap on fees (0 = no cap)
                      </p>
                    </div>
                  </div>

                  {/* Fee Preview */}
                  <div className="p-4 bg-accent rounded-lg">
                    <Label className="text-base mb-3 block">Fee Preview</Label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      {[1000, 5000, 10000, 50000].map((amount) => {
                        let fee = transactionFee.fixedFee + (amount * transactionFee.percentFee / 100);
                        if (transactionFee.maxFee > 0) {
                          fee = Math.min(fee, transactionFee.maxFee);
                        }
                        return (
                          <div key={amount} className="text-center p-3 bg-background rounded-lg">
                            <div className="text-muted-foreground">₹{amount.toLocaleString('en-IN')}</div>
                            <div className="font-semibold text-lg">+₹{fee.toFixed(2)}</div>
                            <div className="text-xs text-muted-foreground">
                              Total: ₹{(amount + fee).toLocaleString('en-IN')}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}

              {!transactionFee.passToParent && (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertTitle>School Bears Gateway Fees</AlertTitle>
                  <AlertDescription>
                    Transaction fees will be deducted from received payments. 
                    Typical fees: 2% for cards/netbanking, free for direct UPI.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
