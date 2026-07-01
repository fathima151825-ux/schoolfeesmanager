import React from 'react';

const StatCard = ({ label, value, subValue, icon, color }) => (
  <div className="bg-card rounded-xl border border-border p-4 flex items-center gap-4">
    <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${color}`}>
      {icon}
    </div>
    <div>
      <p className="text-2xl font-bold text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
      {subValue && <p className="text-xs text-muted-foreground/70 mt-0.5">{subValue}</p>}
    </div>
  </div>
);

const AdvertisementStats = ({ total, active, totalViews, totalSkips, totalEngagementTime, engagementCount }) => {
  const skipRate = totalViews > 0
    ? Math.round((totalSkips / totalViews) * 100)
    : 0;

  const avgEngagementSec = engagementCount > 0
    ? Math.round(totalEngagementTime / engagementCount)
    : 0;

  const formatEngagement = (secs) => {
    if (secs === 0) return '0s';
    if (secs < 60) return `${secs}s`;
    return `${Math.floor(secs / 60)}m ${secs % 60}s`;
  };

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
      <StatCard
        label="Total Ads"
        value={total}
        subValue=""
        color="bg-blue-100 text-blue-600"
        icon={
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <path d="M3 9h18" />
          </svg>
        }
      />
      <StatCard
        label="Active Ads"
        value={active}
        subValue=""
        color="bg-green-100 text-green-600"
        icon={
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        }
      />
      <StatCard
        label="Total Views"
        value={totalViews?.toLocaleString()}
        subValue="Impressions"
        color="bg-yellow-100 text-yellow-600"
        icon={
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        }
      />
      <StatCard
        label="Total Skips"
        value={totalSkips?.toLocaleString()}
        subValue={`Skip Rate: ${skipRate}%`}
        color="bg-orange-100 text-orange-600"
        icon={
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="5 4 15 12 5 20 5 4" />
            <line x1="19" y1="5" x2="19" y2="19" />
          </svg>
        }
      />
      <StatCard
        label="Skip Rate"
        value={`${skipRate}%`}
        subValue={totalViews > 0 ? `${totalViews - totalSkips} completed` : 'No data'}
        color={skipRate > 50 ? 'bg-red-100 text-red-600' : 'bg-teal-100 text-teal-600'}
        icon={
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        }
      />
      <StatCard
        label="Avg. Engagement"
        value={formatEngagement(avgEngagementSec)}
        subValue={engagementCount > 0 ? `${engagementCount} sessions` : 'No data'}
        color="bg-purple-100 text-purple-600"
        icon={
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
        }
      />
    </div>
  );
};

export default AdvertisementStats;
