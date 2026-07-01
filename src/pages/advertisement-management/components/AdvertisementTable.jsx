import React from 'react';

const formatEngagement = (secs) => {
  if (!secs || secs === 0) return '—';
  if (secs < 60) return `${secs}s`;
  return `${Math.floor(secs / 60)}m ${secs % 60}s`;
};

const AdvertisementTable = ({ advertisements, loading, onEdit, onDelete, onToggleStatus, onPreview }) => {
  if (loading) {
    return (
      <div className="bg-card border border-border rounded-xl p-8 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (advertisements?.length === 0) {
    return (
      <div className="bg-card border border-border rounded-xl p-12 text-center">
        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="mx-auto text-muted-foreground mb-4">
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <path d="M3 9h18" />
        </svg>
        <p className="text-muted-foreground font-medium">No advertisements yet</p>
        <p className="text-sm text-muted-foreground mt-1">Click "Add Advertisement" to create your first one</p>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="p-4 border-b border-border">
        <h2 className="font-semibold text-foreground">All Advertisements ({advertisements?.length})</h2>
      </div>
      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Preview</th>
              <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Title</th>
              <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Duration</th>
              <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Views</th>
              <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Skips</th>
              <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Skip Rate</th>
              <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Avg. Engagement</th>
              <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Status</th>
              <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {advertisements?.map((ad) => {
              const views = ad?.view_count || 0;
              const skips = ad?.skip_count || 0;
              const skipRate = views > 0 ? Math.round((skips / views) * 100) : null;
              const avgEngagement = ad?.engagement_count > 0
                ? Math.round((ad?.total_engagement_time || 0) / ad?.engagement_count)
                : null;
              return (
                <tr key={ad?.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <div
                      className="w-16 h-10 rounded-lg overflow-hidden flex items-center justify-center cursor-pointer"
                      style={{ background: ad?.bgColor || ad?.bg_color || '#c0392b' }}
                      onClick={() => onPreview(ad)}
                    >
                      {(ad?.imageUrl || ad?.image_url) ? (
                        <img src={ad?.imageUrl || ad?.image_url} alt={ad?.title} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-white text-xs font-bold">AD</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-foreground text-sm">{ad?.title}</p>
                    {ad?.description && <p className="text-xs text-muted-foreground truncate max-w-xs">{ad?.description}</p>}
                  </td>
                  <td className="px-4 py-3 text-sm text-foreground">{ad?.duration || 10}s</td>
                  <td className="px-4 py-3 text-sm text-foreground font-medium">{views?.toLocaleString()}</td>
                  <td className="px-4 py-3 text-sm text-foreground">{skips?.toLocaleString()}</td>
                  <td className="px-4 py-3">
                    {skipRate !== null ? (
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        skipRate > 60 ? 'bg-red-100 text-red-700' :
                        skipRate > 30 ? 'bg-yellow-100 text-yellow-700': 'bg-green-100 text-green-700'
                      }`}>
                        {skipRate}%
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-foreground">
                    {formatEngagement(avgEngagement)}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => onToggleStatus(ad?.id, ad?.isActive)}
                      className={`px-2 py-1 rounded-full text-xs font-medium transition-colors ${
                        ad?.isActive
                          ? 'bg-green-100 text-green-700 hover:bg-green-200' :'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {ad?.isActive ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onPreview(ad)}
                        className="p-1.5 rounded-lg hover:bg-blue-100 text-blue-600 transition-colors"
                        title="Preview"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      </button>
                      <button
                        onClick={() => onEdit(ad)}
                        className="p-1.5 rounded-lg hover:bg-yellow-100 text-yellow-600 transition-colors"
                        title="Edit"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => onDelete(ad?.id)}
                        className="p-1.5 rounded-lg hover:bg-red-100 text-red-600 transition-colors"
                        title="Delete"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                          <path d="M10 11v6" />
                          <path d="M14 11v6" />
                          <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {/* Mobile Cards */}
      <div className="md:hidden divide-y divide-border">
        {advertisements?.map((ad) => {
          const views = ad?.view_count || 0;
          const skips = ad?.skip_count || 0;
          const skipRate = views > 0 ? Math.round((skips / views) * 100) : null;
          const avgEngagement = ad?.engagement_count > 0
            ? Math.round((ad?.total_engagement_time || 0) / ad?.engagement_count)
            : null;
          return (
            <div key={ad?.id} className="p-4 flex gap-3">
              <div
                className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center cursor-pointer"
                style={{ background: ad?.bgColor || ad?.bg_color || '#c0392b' }}
                onClick={() => onPreview(ad)}
              >
                {(ad?.imageUrl || ad?.image_url) ? (
                  <img src={ad?.imageUrl || ad?.image_url} alt={ad?.title} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-white text-xs font-bold">AD</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-medium text-foreground text-sm truncate">{ad?.title}</p>
                  <button
                    onClick={() => onToggleStatus(ad?.id, ad?.isActive)}
                    className={`px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${
                      ad?.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {ad?.isActive ? 'Active' : 'Inactive'}
                  </button>
                </div>
                <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1">
                  <span className="text-xs text-muted-foreground">{ad?.duration || 10}s</span>
                  <span className="text-xs text-muted-foreground">{views} views</span>
                  <span className="text-xs text-muted-foreground">{skips} skips</span>
                  {skipRate !== null && (
                    <span className={`text-xs font-medium ${
                      skipRate > 60 ? 'text-red-600' : skipRate > 30 ? 'text-yellow-600' : 'text-green-600'
                    }`}>{skipRate}% skip rate</span>
                  )}
                  {avgEngagement !== null && (
                    <span className="text-xs text-purple-600">⏱ {formatEngagement(avgEngagement)} avg</span>
                  )}
                </div>
                <div className="flex gap-2 mt-2">
                  <button onClick={() => onEdit(ad)} className="text-xs text-yellow-600 hover:underline">Edit</button>
                  <button onClick={() => onDelete(ad?.id)} className="text-xs text-red-600 hover:underline">Delete</button>
                  <button onClick={() => onPreview(ad)} className="text-xs text-blue-600 hover:underline">Preview</button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AdvertisementTable;
