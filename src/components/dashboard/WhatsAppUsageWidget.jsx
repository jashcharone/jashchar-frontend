import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { MessageSquare, AlertTriangle, CheckCircle } from "lucide-react";
import api from '@/lib/api';

const WhatsAppUsageWidget = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get('/whatsapp-manager/usage/summary');
        if (res.data.success) {
          setData(res.data.data);
        }
      } catch (err) {
        // Silently fail - widget will hide if no data (WhatsApp may not be configured for this user)
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div className="h-full flex items-center justify-center p-4"><div className="animate-spin h-6 w-6 border-2 border-green-500 rounded-full border-t-transparent"></div></div>;
  if (error || !data) return null; // Hide if error or no data

  const percentage = data.remaining_quota > 0 
    ? Math.min(100, (data.billing_period_usage / (data.billing_period_usage + data.remaining_quota)) * 100)
    : 100;

  return (
    <Card className="h-full border-l-4 border-l-green-500 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
          <span className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-green-600" />
            WhatsApp Usage
          </span>
          {data.warning && <Badge variant="destructive" className="text-[10px] h-5">Low Quota</Badge>}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{data.billing_period_usage}</div>
        <p className="text-xs text-muted-foreground mb-4">
          Messages sent this month
        </p>
        
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span>Quota Used</span>
            <span className={data.warning ? "text-red-500 font-bold" : "text-green-600"}>
              {Math.round(percentage)}%
            </span>
          </div>
          <Progress value={percentage} className="h-2" indicatorClassName={data.warning ? "bg-red-500" : "bg-green-500"} />
          <div className="flex justify-between text-[10px] text-muted-foreground">
            <span>Remaining: {data.remaining_quota}</span>
            <span>Total Sent: {data.total_messages}</span>
          </div>
        </div>

        {data.last_message_date && (
            <div className="mt-4 pt-2 border-t text-[10px] text-muted-foreground flex items-center gap-1">
                <CheckCircle className="h-3 w-3" />
                Last sent: {new Date(data.last_message_date).toLocaleDateString()}
            </div>
        )}
      </CardContent>
    </Card>
  );
};

export default WhatsAppUsageWidget;
