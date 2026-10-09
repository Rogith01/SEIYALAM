import React from "react";
import {
  BrowserRouter,
  HashRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";

import { useAuth } from "./context/AuthContext";

// AUTH
import Login from "./pages/auth/login";
import FounderLogin from "./pages/founder/FounderLogin";

// FOUNDER
import FounderDashboard from "./pages/founder/FounderDashboard";
import FounderCompanies from "./pages/founder/FounderCompanies";
import FounderCompanyDetails from "./pages/founder/FounderCompanyDetails";
import FounderUsers from "./pages/founder/FounderUsers";
import FounderSettings from "./pages/founder/FounderSettings";

// ADMIN
import AdminDashboard from "./pages/admin/AdminDashboard";
import ServiceRequests from "./pages/admin/ServiceRequests";
import WorkOrders from "./pages/admin/WorkOrders";
import Workers from "./pages/admin/Workers";
import Customers from "./pages/admin/Customers";
import Reports from "./pages/admin/Reports";
import Notifications from "./pages/admin/Notifications";
import AuditLogs from "./pages/admin/AuditLogs";
import Skills from "./pages/admin/Skills";
import WorkerDetails from "./pages/admin/WorkerDetails";
import Settings from "./pages/admin/Settings";
import AdminSupport from "./pages/admin/AdminSupport";
import AdminLayout from "./layouts/AdminLayout";

// WORKER
import WorkerLayout from "./layouts/WorkerLayout";
import WorkerDashboard from "./pages/worker/WorkerDashboard";
import WorkerWorkOrders from "./pages/worker/WorkerWorkOrders";
import WorkerWorkOrderDetails from "./pages/worker/WorkerWorkOrderDetails";
import WorkerNotifications from "./pages/worker/WorkerNotifications";
import WorkerProfile from "./pages/worker/WorkerProfile";
import WorkerSupport from "./pages/worker/WorkerSupport";

// CUSTOMER
import CustomerLayout from "./layouts/CustomerLayout";
import CustomerDashboard from "./pages/customer/CustomerDashboard";
import CustomerServiceRequests from "./pages/customer/CustomerServiceRequests";
import CustomerServiceRequestDetails from "./pages/customer/CustomerServiceRequestDetails";
import CustomerWorkOrders from "./pages/customer/CustomerWorkOrders";
import CustomerWorkOrderDetails from "./pages/customer/CustomerWorkOrderDetails";
import CustomerNotifications from "./pages/customer/CustomerNotifications";
import CustomerProfile from "./pages/customer/CustomerProfile";
import CustomerSupport from "./pages/customer/CustomerSupport";

/*
 * Electron detection:
 * - Packaged Electron: file://
 * - Electron development: localhost:5173
 *
 * Note: localhost:5173 in a regular browser also matches.
 * We can make this more precise with an Electron preload flag later.
 */
const isElectron =
  window.location.protocol === "file:" ||
  (
    ["localhost", "127.0.0.1"].includes(window.location.hostname) &&
    window.location.port === "5173"
  );

const Router = isElectron ? HashRouter : BrowserRouter;

/*
 * DESKTOP ADMIN-ONLY GUARD
 */

function DesktopAdminGuard({ children }) {
  const { user, isAuthenticated, logout } = useAuth();
  const location = useLocation();
  const [blockedRole, setBlockedRole] = React.useState("");

  const role = String(user?.role || "")
    .trim()
    .toLowerCase();

  const isAdmin = role === "admin";

  React.useEffect(() => {
    if (isElectron && isAuthenticated && user && !isAdmin) {
      setBlockedRole(role || "non-admin");
      logout();
    }
  }, [isAuthenticated, user, isAdmin, role, logout]);

  // Website access remains unchanged.
  if (!isElectron) {
    return children;
  }

  // Show a clear message after a non-admin login attempt.
  if (blockedRole) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 p-6">
        <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-8 text-center text-white shadow-xl">
          <div className="mb-4 text-5xl">🔒</div>

          <h1 className="mb-3 text-2xl font-bold">
            Admin Access Only
          </h1>

          <p className="mb-4 text-slate-300">
            SEIYALAM Desktop is designed for Admin accounts only.
          </p>

          <p className="mb-6 text-sm text-slate-400">
            You signed in with a {blockedRole} account.
            Please use the correct Admin account and password.
            Workers and Customers can use the SEIYALAM website
            or the supported mobile app.
          </p>

          <button
            onClick={() => setBlockedRole("")}
            className="w-full rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700"
          >
            Back to Admin Login
          </button>
        </div>
      </div>
    );
  }

  if (location.pathname === "/login") {
    return children;
  }

  if (!isAuthenticated || !user || !isAdmin) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function App() {
  return (
    <Router>
      <DesktopAdminGuard>
        <Routes>
          {/* AUTH */}
          <Route path="/login" element={<Login />} />
          <Route path="/founder/login" element={<FounderLogin />} />

          {/* FOUNDER */}
          <Route
            path="/founder/dashboard"
            element={<FounderDashboard />}
          />
          <Route
            path="/founder/companies"
            element={<FounderCompanies />}
          />
          <Route
            path="/founder/companies/:companyId"
            element={<FounderCompanyDetails />}
          />
          <Route
            path="/founder/users"
            element={<FounderUsers />}
          />
          <Route
            path="/founder/settings"
            element={<FounderSettings />}
          />

          {/* ADMIN */}
          <Route
            path="/admin/dashboard"
            element={
              <AdminLayout>
                <AdminDashboard />
              </AdminLayout>
            }
          />
          <Route
            path="/admin/service-requests"
            element={
              <AdminLayout>
                <ServiceRequests />
              </AdminLayout>
            }
          />
          <Route
            path="/admin/work-orders"
            element={
              <AdminLayout>
                <WorkOrders />
              </AdminLayout>
            }
          />
          <Route
            path="/admin/workers"
            element={
              <AdminLayout>
                <Workers />
              </AdminLayout>
            }
          />
          <Route
            path="/admin/workers/:id"
            element={
              <AdminLayout>
                <WorkerDetails />
              </AdminLayout>
            }
          />
          <Route
            path="/admin/customers"
            element={
              <AdminLayout>
                <Customers />
              </AdminLayout>
            }
          />
          <Route
            path="/admin/reports"
            element={
              <AdminLayout>
                <Reports />
              </AdminLayout>
            }
          />
          <Route
            path="/admin/notifications"
            element={
              <AdminLayout>
                <Notifications />
              </AdminLayout>
            }
          />
          <Route
            path="/admin/audit-logs"
            element={
              <AdminLayout>
                <AuditLogs />
              </AdminLayout>
            }
          />
          <Route
            path="/admin/skills"
            element={
              <AdminLayout>
                <Skills />
              </AdminLayout>
            }
          />
          <Route
            path="/admin/settings"
            element={
              <AdminLayout>
                <Settings />
              </AdminLayout>
            }
          />
          <Route
            path="/admin/support"
            element={
              <AdminLayout>
                <AdminSupport />
              </AdminLayout>
            }
          />

          {/* WORKER */}
          <Route
            path="/worker/dashboard"
            element={
              <WorkerLayout>
                <WorkerDashboard />
              </WorkerLayout>
            }
          />
          <Route
            path="/worker/work-orders"
            element={
              <WorkerLayout>
                <WorkerWorkOrders />
              </WorkerLayout>
            }
          />
          <Route
            path="/worker/work-orders/:id"
            element={
              <WorkerLayout>
                <WorkerWorkOrderDetails />
              </WorkerLayout>
            }
          />
          <Route
            path="/worker/notifications"
            element={
              <WorkerLayout>
                <WorkerNotifications />
              </WorkerLayout>
            }
          />
          <Route
            path="/worker/profile"
            element={
              <WorkerLayout>
                <WorkerProfile />
              </WorkerLayout>
            }
          />
          <Route
            path="/worker/support"
            element={
              <WorkerLayout>
                <WorkerSupport />
              </WorkerLayout>
            }
          />

          {/* CUSTOMER */}
          <Route
            path="/customer/dashboard"
            element={
              <CustomerLayout>
                <CustomerDashboard />
              </CustomerLayout>
            }
          />
          <Route
            path="/customer/service-requests"
            element={
              <CustomerLayout>
                <CustomerServiceRequests />
              </CustomerLayout>
            }
          />
          <Route
            path="/customer/service-requests/:id"
            element={
              <CustomerLayout>
                <CustomerServiceRequestDetails />
              </CustomerLayout>
            }
          />
          <Route
            path="/customer/work-orders"
            element={
              <CustomerLayout>
                <CustomerWorkOrders />
              </CustomerLayout>
            }
          />
          <Route
            path="/customer/work-orders/:id"
            element={
              <CustomerLayout>
                <CustomerWorkOrderDetails />
              </CustomerLayout>
            }
          />
          <Route
            path="/customer/notifications"
            element={
              <CustomerLayout>
                <CustomerNotifications />
              </CustomerLayout>
            }
          />
          <Route
            path="/customer/profile"
            element={
              <CustomerLayout>
                <CustomerProfile />
              </CustomerLayout>
            }
          />
          <Route
            path="/customer/support"
            element={
              <CustomerLayout>
                <CustomerSupport />
              </CustomerLayout>
            }
          />

          {/* DEFAULT */}
          <Route
            path="/"
            element={<Navigate to="/login" replace />}
          />
          <Route
            path="*"
            element={<Navigate to="/login" replace />}
          />
        </Routes>
      </DesktopAdminGuard>
    </Router>
  );
}

export default App;
