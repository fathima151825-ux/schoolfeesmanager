import React from "react";
import { BrowserRouter, Routes as RouterRoutes, Route } from "react-router-dom";
import ScrollToTop from "components/ScrollToTop";
import ErrorBoundary from "components/ErrorBoundary";
import NotFound from "pages/NotFound";
import FeePayment from './pages/fee-payment';
import AdminDashboard from './pages/admin-dashboard';
import StudentDetailManagement from './pages/student-detail-management';
import AdminLogin from './pages/admin-login';
import StudentListManagement from './pages/student-list-management';
import PaymentHistory from './pages/payment-history';
import ParentDashboard from './pages/parent-dashboard';
import ReportsAndBackup from './pages/reports-and-backup';
import PaymentManagement from './pages/payment-management';
import ParentLogin from './pages/parent-login';
import QuickCashPayment from './pages/quick-cash-payment';
import PaymentSuccess from './pages/payment-success';
import PaymentFailure from './pages/payment-failure';
import ProtectedRoute from './components/ui/ProtectedRoute';
import AdvertisementSplash from './pages/advertisement-splash';
import AdvertisementManagement from './pages/advertisement-management';
import SuperAdminLogin from './pages/superadmin-login';
import SuperAdminDashboard from './pages/superadmin-dashboard';
import FeeStructureManagement from './pages/fee-structure-management';
import AcademicYearManagement from './pages/academic-year-management';
import { AcademicYearProvider } from './contexts/AcademicYearContext';

const Routes = () => {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <ScrollToTop />
        <AcademicYearProvider>
          <RouterRoutes>
            <Route path="/" element={<ParentLogin />} />
            <Route path="/fee-payment" element={<FeePayment />} />
            <Route path="/admin-dashboard" element={<AdminDashboard />} />
            <Route path="/student-detail-management" element={<StudentDetailManagement />} />
            <Route path="/admin-login" element={<AdminLogin />} />
            <Route path="/student-list-management" element={<StudentListManagement />} />
            <Route path="/payment-history" element={<PaymentHistory />} />
            <Route path="/parent-dashboard" element={<ParentDashboard />} />
            <Route path="/reports-and-backup" element={<ReportsAndBackup />} />
            <Route 
              path="/payment-management" 
              element={
                <ProtectedRoute requiredRole="admin">
                  <PaymentManagement />
                </ProtectedRoute>
              } 
            />
            <Route path="/quick-cash-payment" element={<QuickCashPayment />} />
            <Route path="/parent-login" element={<ParentLogin />} />
            <Route path="/payment-success" element={<PaymentSuccess />} />
            <Route path="/payment-failure" element={<PaymentFailure />} />
            <Route path="/advertisement-splash" element={<AdvertisementSplash />} />
            <Route path="/advertisement-management" element={<AdvertisementManagement />} />
            <Route path="/superadmin-login" element={<SuperAdminLogin />} />
            <Route 
              path="/superadmin-dashboard" 
              element={
                <ProtectedRoute requiredRole="superadmin">
                  <SuperAdminDashboard />
                </ProtectedRoute>
              } 
            />
            <Route path="/fee-structure-management" element={<FeeStructureManagement />} />
            <Route path="/academic-year-management" element={<AcademicYearManagement />} />
            <Route path="*" element={<NotFound />} />
          </RouterRoutes>
        </AcademicYearProvider>
      </ErrorBoundary>
    </BrowserRouter>
  );
};

export default Routes;
