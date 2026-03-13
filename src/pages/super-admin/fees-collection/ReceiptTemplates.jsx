/**
 * Receipt Templates Gallery Page
 * ===============================
 * Browse, preview, and apply receipt templates for the current branch
 */

import React, { useState, useEffect, Suspense } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CheckCircle2, Eye, Loader2, Palette } from 'lucide-react';
import { getAllTemplates, getTemplate, TEMPLATE_CATEGORIES, DEFAULT_TEMPLATE_KEY } from './receipt-templates/templateRegistry';
import { sampleReceiptData } from './receipt-templates/sampleReceiptData';

const ReceiptTemplates = () => {
  const { organizationId } = useAuth();
  const { selectedBranch } = useBranch();
  const { toast } = useToast();

  const [selectedCategory, setSelectedCategory] = useState('all');
  const [activeTemplateKey, setActiveTemplateKey] = useState(DEFAULT_TEMPLATE_KEY);
  const [previewTemplate, setPreviewTemplate] = useState(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const templates = getAllTemplates();

  // Load current branch's active template
  useEffect(() => {
    const fetchBranchTemplate = async () => {
      if (!selectedBranch?.id || !organizationId) return;
      setLoading(true);
      const { data } = await supabase
        .from('branch_receipt_settings')
        .select('template_key')
        .eq('branch_id', selectedBranch.id)
        .eq('organization_id', organizationId)
        .maybeSingle();
      
      if (data?.template_key) {
        setActiveTemplateKey(data.template_key);
      }
      setLoading(false);
    };
    fetchBranchTemplate();
  }, [selectedBranch?.id, organizationId]);

  // Apply template to current branch
  const handleApplyTemplate = async (templateKey) => {
    if (!selectedBranch?.id || !organizationId) {
      toast({ title: 'Error', description: 'Branch not selected', variant: 'destructive' });
      return;
    }

    setSaving(true);

    const { error } = await supabase
      .from('branch_receipt_settings')
      .upsert({
        branch_id: selectedBranch.id,
        organization_id: organizationId,
        template_key: templateKey,
        updated_at: new Date().toISOString()
      }, { onConflict: 'branch_id,organization_id' });

    if (error) {
      toast({ title: 'Error', description: 'Failed to apply template: ' + error.message, variant: 'destructive' });
    } else {
      setActiveTemplateKey(templateKey);
      toast({ title: 'Success', description: 'Receipt template updated successfully!' });
    }

    setSaving(false);
    setPreviewTemplate(null);
  };

  // Filter templates by category
  const filteredTemplates = selectedCategory === 'all' 
    ? templates 
    : templates.filter(t => t.category === selectedCategory);

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Palette className="text-blue-600" size={28} />
              Receipt Templates
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              Choose a receipt template for <strong>{selectedBranch?.branch_name || 'your branch'}</strong>
            </p>
          </div>
          <div className="text-right">
            <Badge variant="outline" className="text-sm px-3 py-1">
              Active: {templates.find(t => t.key === activeTemplateKey)?.name || 'Classic Blue'}
            </Badge>
          </div>
        </div>

        {/* Category Filter */}
        <div className="flex gap-2 flex-wrap">
          {TEMPLATE_CATEGORIES.map(cat => (
            <Button
              key={cat.key}
              variant={selectedCategory === cat.key ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(cat.key)}
            >
              {cat.icon} {cat.label}
            </Button>
          ))}
        </div>

        {/* Templates Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="animate-spin mr-2" size={20} />
            <span className="text-gray-500">Loading templates...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTemplates.map(template => {
              const isActive = template.key === activeTemplateKey;
              return (
                <Card 
                  key={template.key} 
                  className={`relative transition-all hover:shadow-lg ${isActive ? 'ring-2 ring-blue-500 shadow-md' : ''}`}
                >
                  {isActive && (
                    <div className="absolute -top-2 -right-2 bg-blue-600 text-white rounded-full p-1 z-10">
                      <CheckCircle2 size={18} />
                    </div>
                  )}
                  
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center justify-between">
                      <span>{template.name}</span>
                      <Badge variant="secondary" className="text-xs capitalize">
                        {template.category}
                      </Badge>
                    </CardTitle>
                  </CardHeader>

                  <CardContent>
                    {/* Mini preview area */}
                    <div 
                      className="bg-gray-50 border rounded-lg mb-3 overflow-hidden flex items-center justify-center"
                      style={{ height: '140px' }}
                    >
                      <div style={{ transform: 'scale(0.35)', transformOrigin: 'center center' }}>
                        <Suspense fallback={<div className="text-gray-400 text-sm">Loading...</div>}>
                          {(() => {
                            const TemplateComp = getTemplate(template.key);
                            return TemplateComp ? (
                              <TemplateComp receiptData={sampleReceiptData} copyType="STUDENT COPY" />
                            ) : null;
                          })()}
                        </Suspense>
                      </div>
                    </div>

                    <p className="text-xs text-gray-500 mb-3">{template.description}</p>

                    {/* Color scheme dots */}
                    {template.colorScheme && (
                      <div className="flex gap-1 mb-3">
                        {Object.entries(template.colorScheme).map(([name, color]) => (
                          <div
                            key={name}
                            title={name}
                            className="w-5 h-5 rounded-full border border-gray-200"
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                    )}

                    {/* Features */}
                    <div className="flex flex-wrap gap-1 mb-3">
                      {template.features?.slice(0, 3).map(f => (
                        <Badge key={f} variant="outline" className="text-[10px]">
                          {f.replace(/_/g, ' ')}
                        </Badge>
                      ))}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1"
                        onClick={() => setPreviewTemplate(template)}
                      >
                        <Eye size={14} className="mr-1" /> Preview
                      </Button>
                      {isActive ? (
                        <Button size="sm" className="flex-1" disabled>
                          <CheckCircle2 size={14} className="mr-1" /> Active
                        </Button>
                      ) : (
                        <Button 
                          size="sm" 
                          className="flex-1"
                          onClick={() => handleApplyTemplate(template.key)}
                          disabled={saving}
                        >
                          {saving ? <Loader2 size={14} className="mr-1 animate-spin" /> : null}
                          Apply
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {filteredTemplates.length === 0 && !loading && (
          <div className="text-center py-20 text-gray-500">
            <p>No templates in this category yet.</p>
            <p className="text-sm mt-1">More templates coming soon!</p>
          </div>
        )}

        {/* Full Preview Dialog */}
        <Dialog open={!!previewTemplate} onOpenChange={() => setPreviewTemplate(null)}>
          <DialogContent className="max-w-[95vw] w-auto max-h-[90vh] overflow-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center justify-between">
                <span>Preview: {previewTemplate?.name}</span>
                <div className="flex gap-2">
                  {previewTemplate?.key !== activeTemplateKey && (
                    <Button 
                      size="sm" 
                      onClick={() => handleApplyTemplate(previewTemplate.key)}
                      disabled={saving}
                    >
                      {saving ? <Loader2 size={14} className="mr-1 animate-spin" /> : null}
                      Apply This Template
                    </Button>
                  )}
                </div>
              </DialogTitle>
            </DialogHeader>
            <div className="flex justify-center py-4">
              {previewTemplate && (
                <Suspense fallback={<div className="text-gray-400">Loading template...</div>}>
                  {(() => {
                    const TemplateComp = getTemplate(previewTemplate.key);
                    return TemplateComp ? (
                      <div className="space-y-4">
                        {['OFFICE COPY', 'STUDENT COPY', 'BANK COPY'].map(copyType => (
                          <div key={copyType}>
                            <TemplateComp receiptData={sampleReceiptData} copyType={copyType} />
                          </div>
                        ))}
                      </div>
                    ) : null;
                  })()}
                </Suspense>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default ReceiptTemplates;
