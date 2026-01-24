import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import DashboardLayout from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const AddIncome = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [incomeHeads, setIncomeHeads] = useState([]);
  
  const [formData, setFormData] = useState({
    income_head_id: '',
    name: '',
    invoice_no: '',
    date: new Date().toISOString().split('T')[0],
    amount: '',
    description: '',
    documents: null // For future file upload implementation
  });

  useEffect(() => {
    if (user?.user_metadata?.branch_id) {
      fetchIncomeHeads();
    }
  }, [user]);

  const fetchIncomeHeads = async () => {
    try {
      const { data, error } = await supabase
        .from('income_heads')
        .select('id, name')
        .eq('branch_id', user.user_metadata.branch_id);
      
      if (error) throw error;
      setIncomeHeads(data || []);
    } catch (error) {
      console.error('Error fetching income heads:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (value) => {
    setFormData(prev => ({ ...prev, income_head_id: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.income_head_id || !formData.name || !formData.date || !formData.amount) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase
        .from('income')
        .insert([{
          branch_id: user.user_metadata.branch_id,
          income_head_id: formData.income_head_id,
          name: formData.name,
          invoice_no: formData.invoice_no,
          date: formData.date,
          amount: parseFloat(formData.amount),
          description: formData.description,
        }]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Income added successfully.",
      });
      navigate('/school-owner/finance/income');
    } catch (error) {
      console.error('Error adding income:', error);
      toast({
        title: "Error",
        description: "Failed to add income.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6">
        <Button 
          variant="ghost" 
          className="mb-4 pl-0 hover:pl-0 hover:bg-transparent"
          onClick={() => navigate('/school-owner/finance/income')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Income List
        </Button>
        
        <div className="bg-card rounded-lg shadow border border-border p-6 max-w-2xl">
          <h1 className="text-2xl font-bold mb-6">Add Income</h1>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="income_head_id">Income Head *</Label>
                <Select value={formData.income_head_id} onValueChange={handleSelectChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Income Head" />
                  </SelectTrigger>
                  <SelectContent>
                    {incomeHeads.map((head) => (
                      <SelectItem key={head.id} value={head.id}>
                        {head.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="e.g. Donation"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="invoice_no">Invoice Number</Label>
                <Input
                  id="invoice_no"
                  name="invoice_no"
                  value={formData.invoice_no}
                  onChange={handleInputChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="date">Date *</Label>
                <Input
                  id="date"
                  name="date"
                  type="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount">Amount *</Label>
                <Input
                  id="amount"
                  name="amount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.amount}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={3}
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Saving...' : 'Save Income'}
            </Button>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AddIncome;
