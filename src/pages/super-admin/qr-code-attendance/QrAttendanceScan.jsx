import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { QrCode, Camera, CheckCircle2, XCircle, Settings, AlertCircle } from 'lucide-react';

const QrAttendanceScan = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [scanning, setScanning] = useState(false);
  const [settings, setSettings] = useState(null);
  const [recentScans, setRecentScans] = useState([]);

  const branchId = user?.profile?.branch_id;

  useEffect(() => {
    const fetchSettings = async () => {
      if (!branchId) return;

      const { data, error } = await supabase
        .from('qr_code_settings')
        .select('*')
        .eq('branch_id', branchId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching settings:', error);
      } else {
        setSettings(data);
      }
    };

    fetchSettings();
  }, [branchId]);

  const handleStartScanning = () => {
    toast({
      title: 'ðŸš§ Feature Coming Soon',
      description: 'QR Code scanning functionality will be available in the next update!'
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">QR Code Attendance</h1>
            <p className="text-muted-foreground mt-2">Scan student QR codes to mark attendance</p>
          </div>
          <Button variant="outline" onClick={() => navigate('/school-owner/qr-code-attendance/setting')}>
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </Button>
        </div>

        {!settings ? (
          <Card className="border-yellow-500">
            <CardHeader>
              <div className="flex items-center gap-3">
                <AlertCircle className="h-8 w-8 text-yellow-500" />
                <div>
                  <CardTitle>QR Code Attendance Not Configured</CardTitle>
                  <CardDescription>Please configure QR code settings before scanning</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Button onClick={() => navigate('/school-owner/qr-code-attendance/setting')}>
                <Settings className="mr-2 h-4 w-4" />
                Configure Settings
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {/* Scanner Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Camera className="h-5 w-5" />
                  QR Code Scanner
                </CardTitle>
                <CardDescription>Position QR code within the frame to scan</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="aspect-square bg-muted rounded-lg flex items-center justify-center border-2 border-dashed">
                  {scanning ? (
                    <div className="text-center">
                      <Camera className="h-16 w-16 mx-auto mb-4 text-primary animate-pulse" />
                      <p className="text-sm text-muted-foreground">Scanning for QR codes...</p>
                    </div>
                  ) : (
                    <div className="text-center">
                      <QrCode className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">Click start to begin scanning</p>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <span className="text-sm text-muted-foreground">Auto Attendance</span>
                    <Badge variant={settings.auto_attendance ? 'default' : 'secondary'}>
                      {settings.auto_attendance ? 'Enabled' : 'Disabled'}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <span className="text-sm text-muted-foreground">Selected Camera</span>
                    <span className="text-sm font-medium">{settings.selected_camera || 'Default'}</span>
                  </div>
                </div>

                <Button 
                  onClick={handleStartScanning} 
                  className="w-full"
                  size="lg"
                >
                  <Camera className="mr-2 h-5 w-5" />
                  {scanning ? 'Stop Scanning' : 'Start Scanning'}
                </Button>
              </CardContent>
            </Card>

            {/* Recent Scans Card */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Scans</CardTitle>
                <CardDescription>Latest attendance records from QR scanning</CardDescription>
              </CardHeader>
              <CardContent>
                {recentScans.length === 0 ? (
                  <div className="text-center py-10">
                    <QrCode className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Scans Yet</h3>
                    <p className="text-sm text-muted-foreground">
                      Start scanning QR codes to see attendance records here
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recentScans.map((scan, index) => (
                      <div key={index} className="flex items-center justify-between p-3 rounded-lg border">
                        <div className="flex items-center gap-3">
                          {scan.status === 'success' ? (
                            <CheckCircle2 className="h-5 w-5 text-green-500" />
                          ) : (
                            <XCircle className="h-5 w-5 text-red-500" />
                          )}
                          <div>
                            <p className="font-medium">{scan.studentName}</p>
                            <p className="text-xs text-muted-foreground">{scan.time}</p>
                          </div>
                        </div>
                        <Badge variant={scan.status === 'success' ? 'default' : 'destructive'}>
                          {scan.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Instructions Card */}
        <Card>
          <CardHeader>
            <CardTitle>How to Use QR Code Attendance</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="space-y-2 list-decimal list-inside text-sm text-muted-foreground">
              <li>Ensure QR code settings are configured properly</li>
              <li>Click "Start Scanning" to activate the camera</li>
              <li>Position the student's QR code within the camera frame</li>
              <li>The system will automatically detect and mark attendance</li>
              <li>View recent scans in the right panel</li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default QrAttendanceScan;
