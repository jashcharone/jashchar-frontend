import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const SEODetail = ({ data, onChange }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">SEO Detail</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label>Meta Title</Label>
          <Input 
            value={data.meta_title || ''} 
            onChange={(e) => onChange('meta_title', e.target.value)} 
            placeholder="Enter meta title"
          />
        </div>
        <div>
          <Label>Meta Keyword</Label>
          <Input 
            value={data.meta_keyword || ''} 
            onChange={(e) => onChange('meta_keyword', e.target.value)} 
            placeholder="Enter meta keywords"
          />
        </div>
        <div>
          <Label>Meta Description</Label>
          <Textarea 
            value={data.meta_description || ''} 
            onChange={(e) => onChange('meta_description', e.target.value)} 
            placeholder="Enter meta description"
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default SEODetail;
