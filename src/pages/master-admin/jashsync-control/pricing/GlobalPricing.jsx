import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Save, RefreshCw, AlertCircle } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

/**
 * GlobalPricing - Set default message rates for all schools
 * Master Admin can set base rates, bulk rates, min/max limits
 */
const GlobalPricing = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  
  // Default pricing configuration
  const [pricing, setPricing] = useState([
    { type: 'text', label: 'Text Message', basePrice: 0.10, bulkPrice: 0.08, minPrice: 0.05, maxPrice: 0.50 },
    { type: 'image', label: 'Image', basePrice: 0.20, bulkPrice: 0.15, minPrice: 0.10, maxPrice: 1.00 },
    { type: 'document', label: 'Document', basePrice: 0.20, bulkPrice: 0.15, minPrice: 0.10, maxPrice: 1.00 },
    { type: 'voice_note', label: 'Voice Note', basePrice: 0.15, bulkPrice: 0.12, minPrice: 0.08, maxPrice: 0.75 },
    { type: 'video', label: 'Video', basePrice: 0.30, bulkPrice: 0.25, minPrice: 0.15, maxPrice: 1.50 },
    { type: 'broadcast', label: 'Broadcast (per recipient)', basePrice: 0.05, bulkPrice: 0.04, minPrice: 0.02, maxPrice: 0.25 },
    { type: 'channel', label: 'Channel Message', basePrice: 0.02, bulkPrice: 0.015, minPrice: 0.01, maxPrice: 0.10 },
    { type: 'ai_generated', label: 'AI Generated Message', basePrice: 0.25, bulkPrice: 0.20, minPrice: 0.15, maxPrice: 1.00 },
  ]);

  const [bulkThreshold, setBulkThreshold] = useState(10000);

  const handlePriceChange = (index, field, value) => {
    const newPricing = [...pricing];
    newPricing[index][field] = parseFloat(value) || 0;
    setPricing(newPricing);
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      // API call will go here
      // await api.put('/master/jashsync/pricing/global', { pricing, bulkThreshold });
      
      toast({
        title: "Pricing Updated",
        description: "Global pricing has been saved successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update pricing.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white">Global Pricing Configuration</h2>
          <p className="text-gray-400">Set default message rates for all schools</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="border-gray-600">
            <RefreshCw className="w-4 h-4 mr-2" />
            Reset to Default
          </Button>
          <Button onClick={handleSave} disabled={loading} className="bg-green-600 hover:bg-green-700">
            <Save className="w-4 h-4 mr-2" />
            Save Changes
          </Button>
        </div>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mb-6 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-blue-400 mt-0.5" />
        <div>
          <p className="text-sm text-blue-400 font-medium">How Pricing Works</p>
          <p className="text-sm text-gray-400 mt-1">
            These are the <strong>default rates</strong> applied to new schools. You can set <strong>custom rates per school</strong> in the Schools tab.
            Schools using more than {bulkThreshold.toLocaleString()} messages/month get the bulk rate automatically.
          </p>
        </div>
      </div>

      {/* Bulk Threshold */}
      <Card className="bg-gray-800/50 border-gray-700/50 mb-6">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-white">Bulk Discount Threshold</Label>
              <p className="text-sm text-gray-400">Schools sending more than this many messages/month get bulk rates</p>
            </div>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                value={bulkThreshold}
                onChange={(e) => setBulkThreshold(parseInt(e.target.value) || 0)}
                className="w-32 bg-gray-700 border-gray-600 text-white"
              />
              <span className="text-gray-400">messages</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pricing Table */}
      <Card className="bg-gray-800/50 border-gray-700/50">
        <CardHeader>
          <CardTitle className="text-white">Message Rates (INR)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Message Type</th>
                  <th className="text-center py-3 px-4 text-gray-400 font-medium">Base Rate (₹)</th>
                  <th className="text-center py-3 px-4 text-gray-400 font-medium">Bulk Rate (₹)</th>
                  <th className="text-center py-3 px-4 text-gray-400 font-medium">Min Allowed (₹)</th>
                  <th className="text-center py-3 px-4 text-gray-400 font-medium">Max Allowed (₹)</th>
                </tr>
              </thead>
              <tbody>
                {pricing.map((item, idx) => (
                  <tr key={item.type} className="border-b border-gray-700/50 hover:bg-gray-700/30">
                    <td className="py-3 px-4">
                      <span className="text-white font-medium">{item.label}</span>
                      <Badge variant="outline" className="ml-2 text-xs">{item.type}</Badge>
                    </td>
                    <td className="py-3 px-4">
                      <Input
                        type="number"
                        step="0.01"
                        value={item.basePrice}
                        onChange={(e) => handlePriceChange(idx, 'basePrice', e.target.value)}
                        className="w-24 mx-auto bg-gray-700 border-gray-600 text-white text-center"
                      />
                    </td>
                    <td className="py-3 px-4">
                      <Input
                        type="number"
                        step="0.01"
                        value={item.bulkPrice}
                        onChange={(e) => handlePriceChange(idx, 'bulkPrice', e.target.value)}
                        className="w-24 mx-auto bg-gray-700 border-gray-600 text-white text-center"
                      />
                    </td>
                    <td className="py-3 px-4">
                      <Input
                        type="number"
                        step="0.01"
                        value={item.minPrice}
                        onChange={(e) => handlePriceChange(idx, 'minPrice', e.target.value)}
                        className="w-24 mx-auto bg-gray-700 border-gray-600 text-white text-center"
                      />
                    </td>
                    <td className="py-3 px-4">
                      <Input
                        type="number"
                        step="0.01"
                        value={item.maxPrice}
                        onChange={(e) => handlePriceChange(idx, 'maxPrice', e.target.value)}
                        className="w-24 mx-auto bg-gray-700 border-gray-600 text-white text-center"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <p className="text-sm text-gray-500 mt-4 text-center">
        Changes will apply to all schools using default pricing. Schools with custom pricing will not be affected.
      </p>
    </div>
  );
};

export default GlobalPricing;
