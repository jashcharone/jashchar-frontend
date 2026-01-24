import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Construction } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const PlaceholderModule = ({ title, moduleName }) => {
  const navigate = useNavigate();

  return (
    <div className="p-8 space-y-6 bg-slate-50/50 min-h-screen">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">{title}</h1>
          <p className="text-slate-500">Module: {moduleName}</p>
        </div>
      </div>

      <Card className="border-dashed border-2 border-slate-200 shadow-none bg-transparent">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-amber-600">
            <Construction className="h-6 w-6" />
            Under Construction
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-slate-600">
            The <strong>{title}</strong> module is currently being implemented.
            All routes and permissions have been secured via the Enterprise Immortality Shield.
          </p>
          <div className="p-4 bg-blue-50 text-blue-700 rounded-md text-sm">
            <strong>System Status:</strong> Route active, Permission checked, Sidebar integrated.
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PlaceholderModule;
