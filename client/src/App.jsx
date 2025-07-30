import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";

// Components
import Navbar from "./components/layout/Navbar";
import Footer from "./components/layout/Footer";
import DashboardLayout from "./components/layout/DashboardLayout";
import ThemeProvider from "./contexts/ThemeContext";

// Pages
import Home from "./pages/Home";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import Dashboard from "./pages/dashboard/Dashboard";
import Profile from "./pages/profile/Profile";
import Accounts from "./pages/accounts/Accounts";
import Loans from "./pages/loans/Loans";
import LoanApplication from "./pages/loans/LoanApplication";
import LoanDetails from "./pages/loans/LoanDetails";
import Savings from "./pages/savings/Savings";
import Transactions from "./pages/transactions/Transactions";
import Groups from "./pages/groups/Groups";
import Investments from "./pages/investments/Investments";
import AdminDashboard from "./pages/admin/AdminDashboard";
import UserManagement from "./pages/admin/UserManagement";
import KYCVerification from "./pages/admin/KYCVerification";
import Reports from "./pages/admin/Reports";
import Settings from "./pages/admin/Settings";

// Context
import { AuthProvider, useAuth } from "./contexts/AuthContext";

// Conditional Footer Component
const ConditionalFooter = () => {
  const location = useLocation();
  const isDashboardArea = [
    "/dashboard",
    "/accounts",
    "/loans",
    "/savings",
    "/investments",
    "/profile",
    "/transactions",
    "/groups",
  ].some((path) => location.pathname.startsWith(path));

  return isDashboardArea ? null : <Footer />;
};

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ height: "100vh" }}
      >
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <div className="App">
            <Navbar />
            <main className="flex-grow-1">
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

                {/* Protected Routes */}
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <DashboardLayout>
                        <Dashboard />
                      </DashboardLayout>
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/accounts"
                  element={
                    <ProtectedRoute>
                      <DashboardLayout>
                        <Accounts />
                      </DashboardLayout>
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/profile"
                  element={
                    <ProtectedRoute>
                      <DashboardLayout>
                        <Profile />
                      </DashboardLayout>
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/loans"
                  element={
                    <ProtectedRoute>
                      <DashboardLayout>
                        <Loans />
                      </DashboardLayout>
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/loans/apply"
                  element={
                    <ProtectedRoute allowedRoles={["borrower", "member"]}>
                      <DashboardLayout>
                        <LoanApplication />
                      </DashboardLayout>
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/loans/:id"
                  element={
                    <ProtectedRoute>
                      <DashboardLayout>
                        <LoanDetails />
                      </DashboardLayout>
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/savings"
                  element={
                    <ProtectedRoute>
                      <DashboardLayout>
                        <Savings />
                      </DashboardLayout>
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/transactions"
                  element={
                    <ProtectedRoute>
                      <DashboardLayout>
                        <Transactions />
                      </DashboardLayout>
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/groups"
                  element={
                    <ProtectedRoute>
                      <DashboardLayout>
                        <Groups />
                      </DashboardLayout>
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/investments"
                  element={
                    <ProtectedRoute>
                      <DashboardLayout>
                        <Investments />
                      </DashboardLayout>
                    </ProtectedRoute>
                  }
                />

                {/* Admin Routes */}
                <Route
                  path="/admin"
                  element={
                    <ProtectedRoute allowedRoles={["admin"]}>
                      <AdminDashboard />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/admin/users"
                  element={
                    <ProtectedRoute allowedRoles={["admin"]}>
                      <UserManagement />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/admin/kyc"
                  element={
                    <ProtectedRoute allowedRoles={["admin", "loan_officer"]}>
                      <KYCVerification />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/admin/reports"
                  element={
                    <ProtectedRoute allowedRoles={["admin", "loan_officer"]}>
                      <Reports />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/admin/settings"
                  element={
                    <ProtectedRoute allowedRoles={["admin"]}>
                      <Settings />
                    </ProtectedRoute>
                  }
                />
              </Routes>
            </main>
            <ConditionalFooter />
            <ToastContainer
              position="top-right"
              autoClose={5000}
              hideProgressBar={false}
              newestOnTop={false}
              closeOnClick
              rtl={false}
              pauseOnFocusLoss
              draggable
              pauseOnHover
            />
          </div>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
