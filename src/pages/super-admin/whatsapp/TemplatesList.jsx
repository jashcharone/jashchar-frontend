/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * TEMPLATES LIST - Super Admin
 * View available WhatsApp templates (Platform + Organization)
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { 
  Loader2, FileText, Search, Globe, Building2, Copy, Eye, Plus
} from "lucide-react";
import api from '@/lib/api';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const TemplatesList = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [templates, setTemplates] = useState({ platform: [], organization: [] });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const res = await api.get('/whatsapp/templates');
      if (res.data.success) {
        setTemplates(res.data.data || { platform: [], organization: [] });
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const copySlug = (slug) => {
    navigator.clipboard.writeText(slug);
    toast({
      title: "Copied!",
      description: `Template slug "${slug}" copied to clipboard`
    });
  };

  const getCategoryColor = (category) => {
    const colors = {
      fee: 'bg-green-100 text-green-700',
      attendance: 'bg-blue-100 text-blue-700',
      exam: 'bg-purple-100 text-purple-700',
      notification: 'bg-orange-100 text-orange-700',
      transport: 'bg-cyan-100 text-cyan-700',
      utility: 'bg-gray-100 text-gray-700'
    };
    return colors[category] || colors.utility;
  };

  const filterTemplates = (list) => {
    if (!searchTerm) return list;
    return list.filter(t => 
      t.template_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.template_slug?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.category?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const TemplateCard = ({ template, isPlatform }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              {isPlatform ? (
                <Globe className="h-4 w-4 text-blue-500" />
              ) : (
                <Building2 className="h-4 w-4 text-green-500" />
              )}
              <h4 className="font-semibold">{template.template_name}</h4>
            </div>
            <div className="flex flex-wrap gap-2 mb-3">
              <Badge variant="secondary" className={getCategoryColor(template.category)}>
                {template.category}
              </Badge>
              <Badge variant="outline">{template.language || 'en'}</Badge>
              {template.approval_status && (
                <Badge variant={template.approval_status === 'approved' ? 'default' : 'secondary'}>
                  {template.approval_status}
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground line-clamp-2">
              {template.body_content}
            </p>
            {template.variables?.length > 0 && (
              <div className="mt-2">
                <span className="text-xs text-muted-foreground">Variables: </span>
                {template.variables.map((v, i) => (
                  <Badge key={i} variant="outline" className="text-xs mr-1">
                    {`{{${v}}}`}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="flex gap-2 mt-4">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => { setSelectedTemplate(template); setPreviewOpen(true); }}
          >
            <Eye className="h-3 w-3 mr-1" />
            Preview
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => copySlug(template.template_slug)}
          >
            <Copy className="h-3 w-3 mr-1" />
            Copy Slug
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="h-8 w-8 animate-spin text-green-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search templates..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" onClick={fetchTemplates}>
              <Loader2 className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Templates Tabs */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">
            All ({templates.platform.length + templates.organization.length})
          </TabsTrigger>
          <TabsTrigger value="platform">
            <Globe className="h-4 w-4 mr-2" />
            Platform ({templates.platform.length})
          </TabsTrigger>
          <TabsTrigger value="organization">
            <Building2 className="h-4 w-4 mr-2" />
            Organization ({templates.organization.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {/* Platform Templates */}
          {filterTemplates(templates.platform).length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Globe className="h-5 w-5 text-blue-500" />
                Platform Templates
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filterTemplates(templates.platform).map(t => (
                  <TemplateCard key={t.id} template={t} isPlatform />
                ))}
              </div>
            </div>
          )}

          {/* Organization Templates */}
          {filterTemplates(templates.organization).length > 0 && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Building2 className="h-5 w-5 text-green-500" />
                Organization Templates
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filterTemplates(templates.organization).map(t => (
                  <TemplateCard key={t.id} template={t} isPlatform={false} />
                ))}
              </div>
            </div>
          )}

          {filterTemplates([...templates.platform, ...templates.organization]).length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground">No templates found</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="platform">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filterTemplates(templates.platform).map(t => (
              <TemplateCard key={t.id} template={t} isPlatform />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="organization">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filterTemplates(templates.organization).map(t => (
              <TemplateCard key={t.id} template={t} isPlatform={false} />
            ))}
          </div>
          {templates.organization.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground mb-4">
                  No organization templates yet
                </p>
                <p className="text-sm text-muted-foreground">
                  You can use platform templates or contact support to create custom templates
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{selectedTemplate?.template_name}</DialogTitle>
            <DialogDescription>
              Template Preview
            </DialogDescription>
          </DialogHeader>
          
          {selectedTemplate && (
            <div className="space-y-4">
              {/* Info */}
              <div className="flex flex-wrap gap-2">
                <Badge>{selectedTemplate.category}</Badge>
                <Badge variant="outline">{selectedTemplate.language}</Badge>
                <Badge variant="secondary">
                  {selectedTemplate.organization_id ? 'Organization' : 'Platform'}
                </Badge>
              </div>

              {/* Phone Preview */}
              <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl p-4 max-w-xs mx-auto">
                <div className="bg-[#075E54] text-white rounded-t-lg p-2 text-center text-sm font-medium">
                  WhatsApp
                </div>
                <div className="bg-[#ECE5DD] dark:bg-[#1f2c33] p-3 min-h-[150px] rounded-b-lg">
                  <div className="bg-white dark:bg-[#202c33] rounded-lg p-3 shadow-sm">
                    {selectedTemplate.header_content && (
                      <p className="font-semibold text-sm mb-2">{selectedTemplate.header_content}</p>
                    )}
                    <p className="text-sm whitespace-pre-wrap">{selectedTemplate.body_content}</p>
                    {selectedTemplate.footer_content && (
                      <p className="text-xs text-gray-500 mt-2">{selectedTemplate.footer_content}</p>
                    )}
                    <p className="text-xs text-gray-400 text-right mt-2">
                      {new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              </div>

              {/* Variables */}
              {selectedTemplate.variables?.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2">Variables:</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedTemplate.variables.map((v, i) => (
                      <Badge key={i} variant="outline">{`{{${v}}}`}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Slug */}
              <div className="bg-muted p-3 rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">Template Slug (for API)</p>
                <code className="text-sm">{selectedTemplate.template_slug}</code>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TemplatesList;
