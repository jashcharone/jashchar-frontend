import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Save, Plus, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import DashboardLayout from '@/components/DashboardLayout';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const DomainSettings = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [instruction, setInstruction] = useState(`• You'll need to setup a DNS record to point to your store on our server. DNS records can be setup through your domain registrars control panel. Since every registrar has a different setup, contact them for assistance if you're unsure.\n• DNS changes may take up to 48-72 hours to take effect, although it's normally a lot faster than that. You will receive a reply when your custom domain has been activated. Please allow 1-2 business days for this process to complete.`);
  const [status, setStatus] = useState(true);
  const [dnsEnabled, setDnsEnabled] = useState(true);
  const [dnsRecords, setDnsRecords] = useState([
    { id: 1, type: 'CNAME Records', host: 'www', value: 'www.jashwik.in/ssvkschool' },
    { id: 2, type: 'A Records', host: '@', value: '2a02:4780:11:1842:0:1f3a:8ca6:2' }
  ]);

  // Load settings from system_settings table if available
  useEffect(() => {
      const fetchSettings = async () => {
          const { data } = await supabase
            .from('system_settings')
            .select('setting_value')
            .eq('setting_key', 'custom_domain_config')
            .maybeSingle();
          
          if (data?.setting_value) {
              setInstruction(data.setting_value.instruction || instruction);
              setStatus(data.setting_value.status ?? true);
              setDnsEnabled(data.setting_value.dnsEnabled ?? true);
              if(data.setting_value.dnsRecords) setDnsRecords(data.setting_value.dnsRecords);
          }
      };
      fetchSettings();
  }, []);

  const handleSave = async () => {
      setLoading(true);
      const config = {
          instruction,
          status,
          dnsEnabled,
          dnsRecords
      };

      const { error } = await supabase
        .from('system_settings')
        .upsert({ 
            setting_key: 'custom_domain_config', 
            setting_value: config 
        }, { onConflict: 'setting_key' });

      if (error) {
          toast({ variant: "destructive", title: "Error", description: error.message });
      } else {
          toast({ title: "Saved", description: "Domain settings updated successfully." });
      }
      setLoading(false);
  };

  return (
    <DashboardLayout>
    <div className="p-6 space-y-6 bg-background min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center bg-card p-4 rounded-lg shadow-sm border border-border">
        <div className="flex items-center gap-2">
          <Link to="/master-admin/custom-domain">
            <Button variant="ghost" size="icon"><ArrowLeft size={20} /></Button>
          </Link>
          <h1 className="text-xl font-bold text-foreground">Custom Domain Instruction</h1>
        </div>
        <Link to="/master-admin/custom-domain">
          <Button variant="outline">
             Custom Domain
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader className="border-b bg-muted/50">
          <CardTitle className="text-base font-medium text-foreground">Custom Domain Settings Instruction</CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-8">
          
          {/* Instruction Section */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            <div className="md:col-span-3">
              <Label className="text-base font-medium">Title <span className="text-red-500">*</span></Label>
            </div>
            <div className="md:col-span-9">
              <Input defaultValue="Custom Domain Settings Instruction" />
            </div>

            <div className="md:col-span-3">
              <Label className="text-base font-medium">Instruction</Label>
            </div>
            <div className="md:col-span-9">
              {/* Simple Textarea simulating the editor in the screenshot */}
              <div className="border rounded-md">
                <div className="bg-gray-100 p-2 border-b flex gap-2">
                   <Button variant="ghost" size="sm" className="h-6 w-6 p-0 font-bold">B</Button>
                   <Button variant="ghost" size="sm" className="h-6 w-6 p-0 italic">I</Button>
                   <Button variant="ghost" size="sm" className="h-6 w-6 p-0 underline">U</Button>
                </div>
                <Textarea 
                  className="min-h-[150px] border-0 focus-visible:ring-0 resize-y" 
                  value={instruction}
                  onChange={(e) => setInstruction(e.target.value)}
                />
              </div>
            </div>

            <div className="md:col-span-3">
              <Label className="text-base font-medium">Status</Label>
            </div>
            <div className="md:col-span-9">
              <Switch checked={status} onCheckedChange={setStatus} />
            </div>
          </div>

          <div className="border-t pt-8">
            <h3 className="text-lg font-bold text-orange-400 mb-6 flex items-center gap-2">
              <span className="w-1 h-6 bg-orange-400 rounded-full"></span>
              DNS Settings
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-6">
              <div className="md:col-span-3">
                <Label className="text-base font-medium">DNS Settings Enable</Label>
              </div>
              <div className="md:col-span-9">
                <Switch checked={dnsEnabled} onCheckedChange={setDnsEnabled} />
              </div>

              <div className="md:col-span-3">
                <Label className="text-base font-medium">Title</Label>
              </div>
              <div className="md:col-span-9">
                <Input defaultValue="Configure your DNS records" />
              </div>
            </div>

            {/* DNS Records Table */}
            <div className="space-y-4">
              <Label className="text-base font-medium">DNS records</Label>
              <div className="border rounded-md overflow-hidden">
                <Table>
                  <TableHeader className="bg-gray-100">
                    <TableRow>
                      <TableHead className="w-[200px]">Type</TableHead>
                      <TableHead>Host <span className="text-red-500">*</span></TableHead>
                      <TableHead>Value <span className="text-red-500">*</span></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dnsRecords.map((record, index) => (
                      <TableRow key={record.id}>
                        <TableCell className="font-medium bg-gray-50">{record.type}</TableCell>
                        <TableCell>
                          <Input 
                            value={record.host} 
                            onChange={(e) => {
                                const newRecords = [...dnsRecords];
                                newRecords[index].host = e.target.value;
                                setDnsRecords(newRecords);
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Input 
                            value={record.value} 
                            onChange={(e) => {
                                const newRecords = [...dnsRecords];
                                newRecords[index].value = e.target.value;
                                setDnsRecords(newRecords);
                            }}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>

          <div className="flex justify-center pt-4">
            <Button className="bg-slate-900 hover:bg-slate-800 text-white px-8" onClick={handleSave} disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />} 
              Save
            </Button>
          </div>

        </CardContent>
      </Card>
    </div>
    </DashboardLayout>
  );
};

export default DomainSettings;
