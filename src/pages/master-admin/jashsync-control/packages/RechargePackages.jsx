import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Plus, Edit, Trash2, Star, Package } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

/**
 * RechargePackages - Manage recharge packages
 */
const RechargePackages = () => {
  const { toast } = useToast();
  const [packages, setPackages] = useState([
    { id: '1', name: 'Starter', amount: 500, messages: 5000, bonus: 0, isActive: true, isPopular: false },
    { id: '2', name: 'Basic', amount: 1000, messages: 10000, bonus: 500, isActive: true, isPopular: false },
    { id: '3', name: 'Popular', amount: 2000, messages: 20000, bonus: 2000, isActive: true, isPopular: true },
    { id: '4', name: 'Business', amount: 5000, messages: 55000, bonus: 5000, isActive: true, isPopular: false },
    { id: '5', name: 'Enterprise', amount: 10000, messages: 115000, bonus: 15000, isActive: true, isPopular: false },
  ]);

  const [editingPackage, setEditingPackage] = useState(null);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white">Recharge Packages</h2>
          <p className="text-gray-400">Manage available recharge options for schools</p>
        </div>
        <Button className="bg-purple-600 hover:bg-purple-700">
          <Plus className="w-4 h-4 mr-2" />
          Add Package
        </Button>
      </div>

      {/* Packages Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {packages.map((pkg) => (
          <Card 
            key={pkg.id} 
            className={`bg-gray-800/50 border-gray-700/50 ${
              pkg.isPopular ? 'border-purple-500/50 ring-1 ring-purple-500/30' : ''
            } ${!pkg.isActive ? 'opacity-50' : ''}`}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-white">{pkg.name}</h3>
                    {pkg.isPopular && (
                      <Badge className="bg-purple-600">
                        <Star className="w-3 h-3 mr-1" />
                        Popular
                      </Badge>
                    )}
                  </div>
                  <Badge variant={pkg.isActive ? 'default' : 'secondary'}>
                    {pkg.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <Edit className="w-4 h-4 text-gray-400" />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </Button>
                </div>
              </div>

              <div className="text-center py-4">
                <p className="text-4xl font-bold text-white">₹{pkg.amount.toLocaleString()}</p>
                <p className="text-lg text-gray-400 mt-1">{pkg.messages.toLocaleString()} messages</p>
                {pkg.bonus > 0 && (
                  <p className="text-sm text-green-400 mt-1">+{pkg.bonus.toLocaleString()} bonus</p>
                )}
              </div>

              <div className="pt-4 border-t border-gray-700 flex items-center justify-between">
                <span className="text-sm text-gray-400">Show to schools</span>
                <Switch checked={pkg.isActive} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pricing Note */}
      <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
        <p className="text-sm text-blue-400">
          <strong>Note:</strong> The messages count shown here is based on the average message rate (₹0.10/msg). 
          Actual messages will vary based on each school's custom pricing.
        </p>
      </div>
    </div>
  );
};

export default RechargePackages;
