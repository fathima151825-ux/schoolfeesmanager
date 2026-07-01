import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import AdminSidebarNavigation from '../../components/ui/AdminSidebarNavigation';
import BrandHeader from '../../components/ui/BrandHeader';
import MetricCard from './components/MetricCard';
import QuickActionCard from './components/QuickActionCard';
import NotificationAlert from './components/NotificationAlert';
import ActivityItem from './components/ActivityItem';
import ChartCard from './components/ChartCard';
import { useAcademicYear } from '../../contexts/AcademicYearContext';
import { getPaymentStatistics, getRecentPayments } from '../../services/paymentService';
import useRealtimeSubscription from '../../hooks/useRealtimeSubscription';

const AdminDashboard = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [statistics, setStatistics] = useState({
    totalStudents: 0,
    totalPending: 0,
    totalCollected: 0
  });
  const [recentActivities, setRecentActivities] = useState([]);
  const [realtimeIndicator, setRealtimeIndicator] = useState(false);

  const { currentAcademicYear, loading: yearLoading } = useAcademicYear();

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!yearLoading && currentAcademicYear?.id) {
      loadDashboardData();
    }
  }, [currentAcademicYear?.id, yearLoading]);

  useRealtimeSubscription(
    [
      { table: 'payments' },
      { table: 'students' }
    ],
    (payload) => {
      setRealtimeIndicator(true);
      setTimeout(() => setRealtimeIndicator(false), 2000);
      if (currentAcademicYear?.id) loadDashboardData();
    },
    [currentAcademicYear?.id]
  );

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      if (currentAcademicYear?.id) {
        const stats = await getPaymentStatistics(currentAcademicYear?.id);
        setStatistics(stats);

        const payments = await getRecentPayments(6, currentAcademicYear?.id);
        const activities = payments?.map(payment => ({
          type: 'payment',
          title: `${payment?.paymentMethod === 'online' ? 'Online' : payment?.paymentMethod === 'cash' ? 'Cash' : 'Cheque'} Payment Received`,
          description: `${payment?.students?.name} (${payment?.students?.admissionNumber}) - ${payment?.feeCategories?.name}`,
          timestamp: new Date(payment.paymentDate)?.toLocaleString('en-IN'),
          amount: payment?.amount,
          status: payment?.paymentStatus === 'completed' ? 'success' : 'info'
        }));
        setRecentActivities(activities);
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const currentYearLabel = currentAcademicYear
    ? (currentAcademicYear?.yearName || currentAcademicYear?.year_name)
    : 'Loading...';

  const metricsData = [
    {
      title: "Total Students",
      value: loading ? "..." : statistics?.totalStudents?.toString(),
      subtitle: "Active enrollments",
      icon: "Users",
      variant: "primary",
      trend: "up",
      trendValue: ""
    },
    {
      title: "Pending Payments",
      value: loading ? "..." : `₹${(statistics?.totalPending / 100000)?.toFixed(2)}L`,
      subtitle: "Outstanding fees",
      icon: "AlertCircle",
      variant: "warning",
      trend: "down",
      trendValue: ""
    },
    {
      title: "Collected This Year",
      value: loading ? "..." : `₹${(statistics?.totalCollected / 100000)?.toFixed(2)}L`,
      subtitle: "Total collection",
      icon: "TrendingUp",
      variant: "success",
      trend: "up",
      trendValue: ""
    },
    {
      title: "Due Date Alerts",
      value: "—",
      subtitle: "Within 15 days",
      icon: "Calendar",
      variant: "danger",
      trend: "up",
      trendValue: ""
    }
  ];

  const quickActions = [
    {
      title: "Student Management",
      description: "View and manage complete student list with filtering options",
      icon: "Users",
      actionLabel: "View Students",
      actionPath: "/student-list-management",
      variant: "primary"
    },
    {
      title: "Payment Entry",
      description: "Record cash payments and generate receipts for offline transactions",
      icon: "CreditCard",
      actionLabel: "Enter Payment",
      actionPath: "/payment-management",
      variant: "success"
    },
    {
      title: "Generate Reports",
      description: "Export payment reports and download backup files",
      icon: "FileText",
      actionLabel: "View Reports",
      actionPath: "/reports-and-backup",
      variant: "default"
    },
    {
      title: "Academic Years",
      description: "Manage academic years and set the current active year",
      icon: "CalendarDays",
      actionLabel: "Manage Years",
      actionPath: "/academic-year-management",
      variant: "warning"
    }
  ];

  const notifications = [];
  const paymentStatusData = [];
  const monthlyCollectionData = [];
  const chartColors = { pie: ["#059669", "#F59E0B", "#DC2626"], bar: ["#C41E3A"] };

  return (
    <>
      <Helmet>
        <title>Admin Dashboard - SSVM Fees App</title>
        <meta name="description" content="Comprehensive financial oversight and student management dashboard for school administrators" />
      </Helmet>
      <div className="min-h-screen bg-background">
        <AdminSidebarNavigation />
        
        <div className="lg:ml-64 min-h-screen">
          <BrandHeader variant="admin" />
          
          <main className="p-4 md:p-6 lg:p-8 pb-24 lg:pb-8">
            <div className="max-w-7xl mx-auto space-y-6 md:space-y-8">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h1 className="text-2xl md:text-3xl lg:text-4xl font-heading font-bold text-foreground mb-2">
                    Admin Dashboard
                  </h1>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                      {currentYearLabel}
                    </span>
                    <p className="text-sm text-muted-foreground">
                      {currentTime?.toLocaleDateString('en-IN', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all duration-500 ${realtimeIndicator ? 'bg-success/20 text-success' : 'bg-muted text-muted-foreground'}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${realtimeIndicator ? 'bg-success animate-pulse' : 'bg-muted-foreground'}`}></span>
                    {realtimeIndicator ? 'Updating...' : 'Live'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                {metricsData?.map((metric, index) => (
                  <MetricCard key={index} {...metric} />
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                <ChartCard
                  title="Payment Status Distribution"
                  type="pie"
                  data={paymentStatusData}
                  colors={chartColors?.pie}
                  height={300}
                />
                <ChartCard
                  title="Monthly Collection Trends"
                  type="bar"
                  data={monthlyCollectionData}
                  colors={chartColors?.bar}
                  height={300}
                />
              </div>

              <div>
                <h2 className="text-xl md:text-2xl font-heading font-semibold text-foreground mb-4">
                  Quick Actions
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                  {quickActions?.map((action, index) => (
                    <QuickActionCard key={index} {...action} />
                  ))}
                </div>
              </div>

              <div>
                <h2 className="text-xl md:text-2xl font-heading font-semibold text-foreground mb-4">
                  Notifications & Alerts
                </h2>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  {notifications?.map((notification, index) => (
                    <NotificationAlert key={index} {...notification} />
                  ))}
                </div>
              </div>

              <div>
                <h2 className="text-xl md:text-2xl font-heading font-semibold text-foreground mb-4">
                  Recent Activity
                </h2>
                {loading ? (
                  <div className="bg-card border border-border rounded-xl p-8 text-center">
                    <p className="text-muted-foreground">Loading recent activities...</p>
                  </div>
                ) : recentActivities?.length === 0 ? (
                  <div className="bg-card border border-border rounded-xl p-8 text-center">
                    <p className="text-muted-foreground">No recent activities</p>
                  </div>
                ) : (
                  <div className="bg-card border border-border rounded-xl divide-y divide-border">
                    {recentActivities?.map((activity, index) => (
                      <ActivityItem key={index} {...activity} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </main>
        </div>
      </div>
    </>
  );
};

export default AdminDashboard;