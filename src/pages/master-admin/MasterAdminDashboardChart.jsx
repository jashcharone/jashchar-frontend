import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Bar } from 'react-chartjs-2';
import { supabase } from '@/lib/customSupabaseClient';

const MasterAdminDashboardChart = () => {
  const [chartData, setChartData] = useState({ labels: [], datasets: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      // Example: Fetch school count per plan
      const { data, error } = await supabase
        .from('schools')
        .select('plan, count:count(*)')
        .group('plan');
      if (error) return;
      const labels = data.map(d => d.plan || 'Unknown');
      const counts = data.map(d => d.count);
      setChartData({
        labels,
        datasets: [{
          label: 'Schools per Plan',
          data: counts,
          backgroundColor: 'rgba(54, 162, 235, 0.6)',
        }],
      });
      setLoading(false);
    };
    fetchStats();
  }, []);

  return (
    <Card className="w-full max-w-2xl mx-auto mt-8">
      <CardHeader>
        <CardTitle>Schools by Plan (Live)</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? <div>Loading...</div> : <Bar data={chartData} />}
      </CardContent>
    </Card>
  );
};

export default MasterAdminDashboardChart;
