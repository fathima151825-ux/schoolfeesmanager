import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import AdminSidebarNavigation from '../../components/ui/AdminSidebarNavigation';
import BrandHeader from '../../components/ui/BrandHeader';
import ReportFilters from './components/ReportFilters';
import ReportTypeCard from './components/ReportTypeCard';
import BackupManagement from './components/BackupManagement';
import ReportPreviewModal from './components/ReportPreviewModal';
import QuickStats from './components/QuickStats';
import Icon from '../../components/AppIcon';
import { useAcademicYear } from '../../contexts/AcademicYearContext';
import { getPaymentStatsByMode } from '../../services/paymentService';

const ReportsAndBackup = () => {
  const { currentAcademicYear, academicYears, loading: yearLoading } = useAcademicYear();
  const [paymentModeStats, setPaymentModeStats] = useState({
    cash: { total: 0, count: 0, percentage: 0 },
    upi: { total: 0, count: 0, percentage: 0 },
    online: { total: 0, count: 0, percentage: 0 }
  });
  const [statsLoading, setStatsLoading] = useState(false);

  const [filters, setFilters] = useState({
    academicYearId: '',
    fromDate: '',
    toDate: '',
    class: 'all',
    section: 'all',
    paymentStatus: 'all',
    term: 'all',
    paymentMethod: 'all'
  });

  const [previewModal, setPreviewModal] = useState({
    isOpen: false,
    reportType: '',
    data: []
  });

  // Set default filter to current academic year when context loads
  useEffect(() => {
    if (!yearLoading && currentAcademicYear?.id) {
      setFilters(prev => ({ ...prev, academicYearId: currentAcademicYear?.id }));
      loadPaymentStats(currentAcademicYear?.id);
    }
  }, [yearLoading, currentAcademicYear?.id]);

  const loadPaymentStats = async (yearId) => {
    if (!yearId) return;
    setStatsLoading(true);
    try {
      const stats = await getPaymentStatsByMode(yearId);
      const total = (stats?.cashTotal || 0) + (stats?.upiTotal || 0) + (stats?.onlineTotal || 0);
      setPaymentModeStats({
        cash: {
          total: stats?.cashTotal || 0,
          count: stats?.cashCount || 0,
          percentage: total > 0 ? Math.round(((stats?.cashTotal || 0) / total) * 100) : 0
        },
        upi: {
          total: stats?.upiTotal || 0,
          count: stats?.upiCount || 0,
          percentage: total > 0 ? Math.round(((stats?.upiTotal || 0) / total) * 100) : 0
        },
        online: {
          total: stats?.onlineTotal || 0,
          count: stats?.onlineCount || 0,
          percentage: total > 0 ? Math.round(((stats?.onlineTotal || 0) / total) * 100) : 0
        }
      });
    } catch (err) {
      console.error('Failed to load payment stats:', err);
    } finally {
      setStatsLoading(false);
    }
  };

  const quickStats = {
    totalCollection: 0,
    pendingAmount: 0,
    pendingStudents: 0,
    onlinePayments: 0,
    onlineCount: 0,
    cashPayments: 0,
    cashCount: 0
  };

  const reportTypes = [
    {
      title: "Payment Collection Report",
      description: "Comprehensive report of all fee collections with payment method breakdown and term-wise analysis",
      icon: "Receipt",
      stats: [{ label: "Total Records", value: "—" }, { label: "Collection", value: "—" }]
    },
    {
      title: "Cash Collection Report",
      description: "Cash-only payment report for cash ledger reconciliation. Excludes UPI and online payments.",
      icon: "Banknote",
      stats: [{ label: "Cash Records", value: "—" }, { label: "Cash Total", value: "—" }]
    },
    {
      title: "UPI Collection Report",
      description: "UPI and digital payment report for bank/UPI ledger reconciliation. Includes UTR numbers.",
      icon: "Smartphone",
      stats: [{ label: "UPI Records", value: "—" }, { label: "UPI Total", value: "—" }]
    },
    {
      title: "Outstanding Balance Report",
      description: "Detailed list of students with pending fee payments including overdue amounts and due dates",
      icon: "AlertCircle",
      stats: [{ label: "Pending Students", value: "—" }, { label: "Outstanding", value: "—" }]
    },
    {
      title: "Student Fee Structure Report",
      description: "Complete fee structure breakdown by class, section, and academic year with category-wise details",
      icon: "Users",
      stats: [{ label: "Total Students", value: "—" }, { label: "Classes", value: "—" }]
    },
    {
      title: "Term-wise Collection Report",
      description: "Term-based collection analysis showing Term 1, Term 2, and Term 3 payment status and trends",
      icon: "Calendar",
      stats: [{ label: "Terms", value: "3" }, { label: "Avg Collection", value: "—" }]
    },
    {
      title: "Payment Method Analysis",
      description: "Comparative analysis of Cash, UPI, and online payment methods with reconciliation data",
      icon: "CreditCard",
      stats: [{ label: "UPI", value: "—" }, { label: "Cash", value: "—" }]
    },
    {
      title: "Class-wise Collection Report",
      description: "Class and section-wise fee collection summary with completion percentage and pending amounts",
      icon: "GraduationCap",
      stats: [{ label: "Classes", value: "—" }, { label: "Sections", value: "—" }]
    }
  ];

  const backups = [];

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    if (key === 'academicYearId' && value) {
      loadPaymentStats(value);
    }
  };

  const handleResetFilters = () => {
    setFilters({
      academicYearId: currentAcademicYear?.id || '',
      fromDate: '',
      toDate: '',
      class: 'all',
      section: 'all',
      paymentStatus: 'all',
      term: 'all',
      paymentMethod: 'all'
    });
    if (currentAcademicYear?.id) loadPaymentStats(currentAcademicYear?.id);
  };

  const handleGenerateReport = () => {
    console.log('Generating report with filters:', filters);
  };

  const handlePreview = (reportType) => {
    setPreviewModal({ isOpen: true, reportType, data: [] });
  };

  const handleExportExcel = (reportType) => {
    console.log('Exporting to Excel:', reportType);
  };

  const handleExportPDF = (reportType) => {
    console.log('Exporting to PDF:', reportType);
  };

  const handleDownloadBackup = (backupId) => {
    console.log('Downloading backup:', backupId);
  };

  const handleTriggerBackup = () => {
    console.log('Triggering manual backup');
  };

  // Build academic year options from context
  const academicYearOptions = academicYears?.map(y => ({
    value: y?.id,
    label: `${y?.yearName || y?.year_name}${(y?.isCurrent || y?.is_current) ? ' (Current)' : ''}`
  })) || [];

  const selectedYearName = academicYears?.find(y => y?.id === filters?.academicYearId)?.yearName
    || academicYears?.find(y => y?.id === filters?.academicYearId)?.year_name
    || currentAcademicYear?.yearName || currentAcademicYear?.year_name || '—';

  return (
    <>
      <Helmet>
        <title>Reports & Backup - SSVM Fees App</title>
        <meta name="description" content="Generate comprehensive financial reports and manage data backups for school fee management system" />
      </Helmet>
      <div className="min-h-screen bg-background">
        <AdminSidebarNavigation />
        <div className="lg:ml-64">
          <BrandHeader variant="admin" />
          <main className="p-4 md:p-6 lg:p-8 pb-20 lg:pb-8">
            <div className="max-w-7xl mx-auto space-y-6 md:space-y-8">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h1 className="text-2xl md:text-3xl lg:text-4xl font-heading font-bold text-foreground mb-2">
                    Reports & Backup
                  </h1>
                  <div className="flex items-center gap-2">
                    <p className="text-sm md:text-base text-muted-foreground font-caption">
                      Generate comprehensive financial reports and manage data backups
                    </p>
                    {!yearLoading && currentAcademicYear && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
                        {currentAcademicYear?.yearName || currentAcademicYear?.year_name}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <QuickStats stats={quickStats} />

              {/* Cash vs UPI Breakdown */}
              <div className="bg-card rounded-lg border border-border p-4 md:p-6">
                <div className="flex items-center justify-between gap-2 mb-4">
                  <div className="flex items-center gap-2">
                    <Icon name="BarChart3" size={20} className="text-primary" />
                    <h2 className="text-base md:text-lg font-heading font-semibold text-foreground">
                      Payment Mode Breakdown
                    </h2>
                  </div>
                  <span className="text-xs text-muted-foreground">{selectedYearName}</span>
                </div>
                {statsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Icon name="Loader2" size={24} className="animate-spin text-primary" />
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Cash */}
                    <div className="bg-success/5 border border-success/20 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 rounded-lg bg-success/10 flex items-center justify-center">
                          <Icon name="Banknote" size={16} className="text-success" />
                        </div>
                        <span className="text-sm font-semibold text-foreground">Cash Ledger</span>
                      </div>
                      <p className="text-xl font-bold text-success">
                        ₹{(paymentModeStats?.cash?.total / 100000)?.toFixed(2)} L
                      </p>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-xs text-muted-foreground">{paymentModeStats?.cash?.count} transactions</span>
                        <span className="text-xs font-medium text-success">{paymentModeStats?.cash?.percentage}%</span>
                      </div>
                      <div className="mt-2 h-1.5 bg-success/10 rounded-full">
                        <div className="h-full bg-success rounded-full" style={{ width: `${paymentModeStats?.cash?.percentage}%` }} />
                      </div>
                    </div>

                    {/* UPI */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                          <Icon name="Smartphone" size={16} className="text-blue-600" />
                        </div>
                        <span className="text-sm font-semibold text-foreground">Bank / UPI Ledger</span>
                      </div>
                      <p className="text-xl font-bold text-blue-700">
                        ₹{(paymentModeStats?.upi?.total / 100000)?.toFixed(2)} L
                      </p>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-xs text-muted-foreground">{paymentModeStats?.upi?.count} transactions</span>
                        <span className="text-xs font-medium text-blue-600">{paymentModeStats?.upi?.percentage}%</span>
                      </div>
                      <div className="mt-2 h-1.5 bg-blue-100 rounded-full">
                        <div className="h-full bg-blue-500 rounded-full" style={{ width: `${paymentModeStats?.upi?.percentage}%` }} />
                      </div>
                    </div>

                    {/* Combined Total */}
                    <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Icon name="TrendingUp" size={16} className="text-primary" />
                        </div>
                        <span className="text-sm font-semibold text-foreground">Combined Total</span>
                      </div>
                      <p className="text-xl font-bold text-primary">
                        ₹{((paymentModeStats?.cash?.total + paymentModeStats?.upi?.total + paymentModeStats?.online?.total) / 100000)?.toFixed(2)} L
                      </p>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-xs text-muted-foreground">
                          {paymentModeStats?.cash?.count + paymentModeStats?.upi?.count + paymentModeStats?.online?.count} total transactions
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <ReportFilters
                filters={filters}
                academicYearOptions={academicYearOptions}
                onFilterChange={handleFilterChange}
                onGenerate={handleGenerateReport}
                onReset={handleResetFilters}
              />

              <div>
                <h2 className="text-xl md:text-2xl font-heading font-semibold text-foreground mb-4">
                  Available Reports
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {reportTypes?.map((report, index) => (
                    <ReportTypeCard
                      key={index}
                      {...report}
                      onPreview={() => handlePreview(report?.title)}
                      onExportExcel={() => handleExportExcel(report?.title)}
                      onExportPDF={() => handleExportPDF(report?.title)}
                    />
                  ))}
                </div>
              </div>

              <BackupManagement
                backups={backups}
                onDownload={handleDownloadBackup}
                onTriggerBackup={handleTriggerBackup}
                lastBackupDate={null}
              />
            </div>
          </main>
        </div>
      </div>

      <ReportPreviewModal
        isOpen={previewModal?.isOpen}
        reportType={previewModal?.reportType}
        data={previewModal?.data}
        reportData={previewModal?.data}
        onClose={() => setPreviewModal({ isOpen: false, reportType: '', data: [] })}
      />
    </>
  );
};

export default ReportsAndBackup;