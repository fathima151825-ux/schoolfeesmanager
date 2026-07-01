import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import AdminSidebarNavigation from '../../components/ui/AdminSidebarNavigation';
import BrandHeader from '../../components/ui/BrandHeader';
import AdvertisementUploadForm from './components/AdvertisementUploadForm';
import AdvertisementTable from './components/AdvertisementTable';
import AdvertisementPreviewModal from './components/AdvertisementPreviewModal';
import AdvertisementStats from './components/AdvertisementStats';
import AdAnalyticsChart from './components/AdAnalyticsChart';
import {
  getAdvertisements,
  createAdvertisement,
  updateAdvertisement,
  deleteAdvertisement,
  toggleAdvertisementStatus
} from '../../services/advertisementService';

const AdvertisementManagement = () => {
  const [advertisements, setAdvertisements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [previewAd, setPreviewAd] = useState(null);
  const [editingAd, setEditingAd] = useState(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    loadAdvertisements();
  }, []);

  const loadAdvertisements = async () => {
    try {
      setLoading(true);
      const data = await getAdvertisements();
      setAdvertisements(data || []);
    } catch (err) {
      showMessage('Failed to load advertisements', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (text, type = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 3500);
  };

  const handleSave = async (formData) => {
    try {
      setSaving(true);
      if (editingAd) {
        await updateAdvertisement(editingAd?.id, formData);
        showMessage('Advertisement updated successfully');
      } else {
        await createAdvertisement(formData);
        showMessage('Advertisement created successfully');
      }
      setShowUploadForm(false);
      setEditingAd(null);
      loadAdvertisements();
    } catch (err) {
      showMessage(err?.message || 'Failed to save advertisement', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (ad) => {
    setEditingAd(ad);
    setShowUploadForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this advertisement?')) return;
    try {
      await deleteAdvertisement(id);
      showMessage('Advertisement deleted successfully');
      loadAdvertisements();
    } catch {
      showMessage('Failed to delete advertisement', 'error');
    }
  };

  const handleToggleStatus = async (id, currentStatus) => {
    try {
      await toggleAdvertisementStatus(id, !currentStatus);
      showMessage(!currentStatus ? 'Advertisement activated' : 'Advertisement deactivated');
      loadAdvertisements();
    } catch {
      showMessage('Failed to update status', 'error');
    }
  };

  const filteredAds = advertisements?.filter(a => {
    if (activeTab === 'active') return a?.isActive;
    if (activeTab === 'inactive') return !a?.isActive;
    return true;
  });

  const activeCount = advertisements?.filter(a => a?.isActive)?.length;
  const totalViews = advertisements?.reduce((sum, a) => sum + (a?.view_count || 0), 0);
  const totalSkips = advertisements?.reduce((sum, a) => sum + (a?.skip_count || 0), 0);
  const totalEngagementTime = advertisements?.reduce((sum, a) => sum + (a?.total_engagement_time || 0), 0);
  const engagementCount = advertisements?.reduce((sum, a) => sum + (a?.engagement_count || 0), 0);

  return (
    <div className="min-h-screen bg-background flex">
      <Helmet>
        <title>Advertisement Management - SSVM Admin</title>
      </Helmet>
      <AdminSidebarNavigation />
      <div className="flex-1 flex flex-col min-w-0 lg:ml-64">
        <BrandHeader />
        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-auto">

          {/* Page Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Advertisement Management</h1>
              <p className="text-muted-foreground text-sm mt-1">Manage splash screen ads shown to parents after login</p>
            </div>
            <button
              onClick={() => { setEditingAd(null); setShowUploadForm(true); }}
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-xl font-semibold hover:bg-primary/90 transition-colors shadow-sm"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Add Advertisement
            </button>
          </div>

          {/* Toast Message */}
          {message && (
            <div className={`mb-5 flex items-center gap-3 p-4 rounded-xl text-sm font-medium border ${
              message?.type === 'error' ?'bg-red-50 text-red-700 border-red-200' :'bg-green-50 text-green-700 border-green-200'
            }`}>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                {message?.type === 'error'
                  ? <><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></>
                  : <><polyline points="20 6 9 17 4 12" /></>}
              </svg>
              {message?.text}
            </div>
          )}

          {/* Stats Overview */}
          <AdvertisementStats
            total={advertisements?.length}
            active={activeCount}
            totalViews={totalViews}
            totalSkips={totalSkips}
            totalEngagementTime={totalEngagementTime}
            engagementCount={engagementCount}
          />

          {/* Analytics Charts */}
          <AdAnalyticsChart advertisements={advertisements} />

          {/* Upload / Edit Form */}
          {showUploadForm && (
            <div className="mb-6">
              <AdvertisementUploadForm
                editingAd={editingAd}
                onSave={handleSave}
                onCancel={() => { setShowUploadForm(false); setEditingAd(null); }}
                saving={saving}
              />
            </div>
          )}

          {/* Filter Tabs + Table */}
          <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
            {/* Tab Bar */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <div className="flex items-center gap-1 bg-muted rounded-xl p-1">
                {[{ id: 'all', label: `All (${advertisements?.length})` }, { id: 'active', label: `Active (${activeCount})` }, { id: 'inactive', label: `Inactive (${advertisements?.length - activeCount})` }]?.map(tab => (
                  <button
                    key={tab?.id}
                    onClick={() => setActiveTab(tab?.id)}
                    className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      activeTab === tab?.id
                        ? 'bg-card text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {tab?.label}
                  </button>
                ))}
              </div>
              <button
                onClick={loadAdvertisements}
                className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                title="Refresh"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="23 4 23 10 17 10" />
                  <polyline points="1 20 1 14 7 14" />
                  <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                </svg>
              </button>
            </div>

            {/* Table Content */}
            <AdvertisementTable
              advertisements={filteredAds}
              loading={loading}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onToggleStatus={handleToggleStatus}
              onPreview={setPreviewAd}
            />
          </div>

          {/* Admin Info */}
          <div className="mt-6 p-4 bg-muted/30 rounded-xl border border-border">
            <div className="flex items-start gap-3">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary mt-0.5 flex-shrink-0">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <div>
                <p className="text-sm font-semibold text-foreground">How Advertisements Work</p>
                <p className="text-xs text-muted-foreground mt-1">Active advertisements are shown to parents on the splash screen after login. The countdown timer runs for 10 seconds before auto-redirecting to the parent dashboard. Analytics data (views, skips, engagement time) is tracked automatically.</p>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Preview Modal */}
      {previewAd && (
        <AdvertisementPreviewModal
          ad={previewAd}
          onClose={() => setPreviewAd(null)}
        />
      )}
    </div>
  );
};

export default AdvertisementManagement;
