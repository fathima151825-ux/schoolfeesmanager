import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const formatEngagement = (secs) => {
  if (!secs || secs === 0) return '0s';
  if (secs < 60) return `${secs}s`;
  return `${Math.floor(secs / 60)}m ${secs % 60}s`;
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload?.length) {
    return (
      <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
        <p className="font-medium text-foreground text-sm mb-2 truncate max-w-[160px]">{label}</p>
        {payload?.map((entry, i) => (
          <div key={i} className="flex items-center gap-2 text-xs">
            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: entry?.color }} />
            <span className="text-muted-foreground">{entry?.name}:</span>
            <span className="font-medium text-foreground">
              {entry?.name === 'Avg. Engagement (s)' ? formatEngagement(entry?.value) : entry?.value}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const AdAnalyticsChart = ({ advertisements }) => {
  if (!advertisements || advertisements?.length === 0) return null;

  const hasData = advertisements?.some(ad => (ad?.view_count || 0) > 0);
  if (!hasData) {
    return (
      <div className="bg-card border border-border rounded-xl p-6 mb-6">
        <h3 className="font-semibold text-foreground mb-1">Analytics Overview</h3>
        <p className="text-sm text-muted-foreground mb-4">Per-advertisement performance metrics</p>
        <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
          <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mb-3 opacity-40">
            <line x1="18" y1="20" x2="18" y2="10" />
            <line x1="12" y1="20" x2="12" y2="4" />
            <line x1="6" y1="20" x2="6" y2="14" />
          </svg>
          <p className="text-sm">No analytics data yet</p>
          <p className="text-xs mt-1 opacity-70">Data will appear after parents view advertisements</p>
        </div>
      </div>
    );
  }

  const chartData = advertisements?.map(ad => ({
    name: ad?.title?.length > 14 ? ad?.title?.substring(0, 14) + '…' : ad?.title,
    fullName: ad?.title,
    Views: ad?.view_count || 0,
    Skips: ad?.skip_count || 0,
    Completed: Math.max(0, (ad?.view_count || 0) - (ad?.skip_count || 0)),
    'Avg. Engagement (s)': ad?.engagement_count > 0
      ? Math.round((ad?.total_engagement_time || 0) / ad?.engagement_count)
      : 0
  }));

  return (
    <div className="bg-card border border-border rounded-xl p-6 mb-6">
      <h3 className="font-semibold text-foreground mb-1">Analytics Overview</h3>
      <p className="text-sm text-muted-foreground mb-6">Per-advertisement performance metrics</p>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Views vs Skips Chart */}
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">Views &amp; Skips</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData} margin={{ top: 4, right: 8, left: -16, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="Views" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Skips" fill="#f97316" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Completed" fill="#22c55e" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Avg Engagement Time Chart */}
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">Avg. Engagement Time (seconds)</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData} margin={{ top: 4, right: 8, left: -16, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="Avg. Engagement (s)" fill="#a855f7" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Per-ad skip rate mini table */}
      <div className="mt-6 border-t border-border pt-4">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">Skip Rate per Advertisement</p>
        <div className="space-y-2">
          {advertisements?.map(ad => {
            const views = ad?.view_count || 0;
            const skips = ad?.skip_count || 0;
            const skipRate = views > 0 ? Math.round((skips / views) * 100) : 0;
            const barColor = skipRate > 60 ? '#ef4444' : skipRate > 30 ? '#f59e0b' : '#22c55e';
            return (
              <div key={ad?.id} className="flex items-center gap-3">
                <p className="text-xs text-foreground w-32 truncate flex-shrink-0">{ad?.title}</p>
                <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${skipRate}%`, background: barColor }}
                  />
                </div>
                <span className="text-xs font-medium w-10 text-right" style={{ color: barColor }}>
                  {views > 0 ? `${skipRate}%` : '—'}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AdAnalyticsChart;
