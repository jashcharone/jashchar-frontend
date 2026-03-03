import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Search, Save, RefreshCw, School, Check } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

/**
 * SchoolPricing - Set custom message rates per school
 * Master Admin can override default rates for specific schools
 */
const SchoolPricing = () => {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSchool, setSelectedSchool] = useState(null);
  const [loading, setLoading] = useState(false);

  // Mock school data
  const schools = [
    { id: '1', name: 'ABC International School', status: 'active', hasCustomPricing: true },
    { id: '2', name: 'XYZ Public School', status: 'active', hasCustomPricing: false },
    { id: '3', name: 'Green Valley Academy', status: 'trial', hasCustomPricing: false },
    { id: '4', name: 'Sunrise School', status: 'low_balance', hasCustomPricing: true },
    { id: '5', name: 'Little Stars', status: 'blocked', hasCustomPricing: false },
  ];

  // Custom pricing for selected school
  const [customPricing, setCustomPricing] = useState([
    { type: 'text', label: 'Text Message', defaultPrice: 0.10, customPrice: 0.08, useCustom: true },
    { type: 'image', label: 'Image', defaultPrice: 0.20, customPrice: 0.15, useCustom: true },
    { type: 'document', label: 'Document', defaultPrice: 0.20, customPrice: 0.15, useCustom: true },
    { type: 'voice_note', label: 'Voice Note', defaultPrice: 0.15, customPrice: 0.12, useCustom: false },
    { type: 'broadcast', label: 'Broadcast', defaultPrice: 0.05, customPrice: 0.04, useCustom: true },
    { type: 'channel', label: 'Channel', defaultPrice: 0.02, customPrice: 0.02, useCustom: false },
    { type: 'ai_generated', label: 'AI Message', defaultPrice: 0.25, customPrice: 0.20, useCustom: true },
  ]);

  const handleSchoolSelect = (school) => {
    setSelectedSchool(school);
    // In real implementation, fetch school's custom pricing
  };

  const handleCustomPriceToggle = (index, value) => {
    const newPricing = [...customPricing];
    newPricing[index].useCustom = value;
    setCustomPricing(newPricing);
  };

  const handleCustomPriceChange = (index, value) => {
    const newPricing = [...customPricing];
    newPricing[index].customPrice = parseFloat(value) || 0;
    setCustomPricing(newPricing);
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      // API call will go here
      toast({
        title: "Custom Pricing Saved",
        description: `Pricing updated for ${selectedSchool?.name}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save custom pricing.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const statusColors = {
    active: 'bg-green-500',
    trial: 'bg-blue-500',
    low_balance: 'bg-orange-500',
    blocked: 'bg-red-500'
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-white mb-6">Per-School Custom Pricing</h2>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* School List */}
        <Card className="bg-gray-800/50 border-gray-700/50 lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-lg">Select School</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Search */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search schools..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-gray-700 border-gray-600 text-white"
              />
            </div>

            {/* School List */}
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {schools
                .filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()))
                .map((school) => (
                  <button
                    key={school.id}
                    onClick={() => handleSchoolSelect(school)}
                    className={`w-full p-3 rounded-lg text-left flex items-center justify-between transition-all ${
                      selectedSchool?.id === school.id
                        ? 'bg-purple-500/20 border border-purple-500/50'
                        : 'bg-gray-700/30 hover:bg-gray-700/50 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${statusColors[school.status]}`} />
                      <span className="text-white text-sm">{school.name}</span>
                    </div>
                    {school.hasCustomPricing && (
                      <Badge variant="outline" className="text-xs text-yellow-400 border-yellow-400/50">
                        Custom
                      </Badge>
                    )}
                  </button>
                ))}
            </div>
          </CardContent>
        </Card>

        {/* Pricing Editor */}
        <Card className="bg-gray-800/50 border-gray-700/50 lg:col-span-2">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-white text-lg">
              {selectedSchool ? selectedSchool.name : 'Select a school'}
            </CardTitle>
            {selectedSchool && (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="border-gray-600">
                  <RefreshCw className="w-4 h-4 mr-1" />
                  Reset
                </Button>
                <Button size="sm" onClick={handleSave} disabled={loading} className="bg-green-600 hover:bg-green-700">
                  <Save className="w-4 h-4 mr-1" />
                  Save
                </Button>
              </div>
            )}
          </CardHeader>
          <CardContent>
            {selectedSchool ? (
              <div className="space-y-3">
                {customPricing.map((item, idx) => (
                  <div key={item.type} className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg">
                    <div className="flex items-center gap-4">
                      <Switch
                        checked={item.useCustom}
                        onCheckedChange={(value) => handleCustomPriceToggle(idx, value)}
                      />
                      <div>
                        <span className="text-white text-sm font-medium">{item.label}</span>
                        <p className="text-xs text-gray-400">Default: ₹{item.defaultPrice}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {item.useCustom ? (
                        <>
                          <span className="text-gray-400">₹</span>
                          <Input
                            type="number"
                            step="0.01"
                            value={item.customPrice}
                            onChange={(e) => handleCustomPriceChange(idx, e.target.value)}
                            className="w-24 bg-gray-700 border-gray-600 text-white text-center"
                          />
                        </>
                      ) : (
                        <span className="text-gray-400 text-sm">Using default (₹{item.defaultPrice})</span>
                      )}
                    </div>
                  </div>
                ))}

                {/* Discount Summary */}
                <div className="mt-4 p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                  <p className="text-green-400 font-medium">Discount Summary</p>
                  <p className="text-sm text-gray-400 mt-1">
                    This school has ~20% discount compared to default pricing
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <School className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">Select a school to configure custom pricing</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SchoolPricing;
