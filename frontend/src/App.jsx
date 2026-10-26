import { Routes, Route, useLocation, Navigate, Link } from "react-router-dom";
import { useEffect } from "react";
import { Compass } from "lucide-react";
import Navbar, { homePathFor } from "./components/Navbar";
import Footer from "./components/Footer";
import AppShell from "./components/AppShell";
import ProtectedRoute from "./components/ProtectedRoute";
import useAuthStore from "./context/authStore";

import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import NewApplication from "./pages/NewApplication";
import Applications from "./pages/Applications";
import ApplicationDetail from "./pages/ApplicationDetail";
import Assistant from "./pages/Assistant";
import Payment from "./pages/Payment";
import PaymentHistory from "./pages/PaymentHistory";
import Certificate from "./pages/Certificate";
import VerifyCertificate from "./pages/VerifyCertificate";
import Notifications from "./pages/Notifications";
import Profile from "./pages/Profile";
import CorrectionResubmit from "./pages/CorrectionResubmit";
import OfficerQueue from "./pages/OfficerQueue";
import OfficerReview from "./pages/OfficerReview";
import OfficerHistory from "./pages/OfficerHistory";
import OfficerSearch from "./pages/OfficerSearch";
import OfficerReports from "./pages/OfficerReports";
import AdminUsers from "./pages/AdminUsers";
import AdminAnalytics from "./pages/AdminAnalytics";
import AdminLogs from "./pages/AdminLogs";
import AdminSettings from "./pages/AdminSettings";

// Redirect already-logged-in users away from auth pages
function AuthGuard({ children }) {
  const { user } = useAuthStore();
  if (user) return <Navigate to={homePathFor(user)} replace />;
  return children;
}

function PublicLayout({ children }) {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) {
      document.querySelector(hash)?.scrollIntoView({ behavior: "smooth" });
    } else {
      window.scrollTo(0, 0);
    }
  }, [pathname, hash]);

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}

function NotFound() {
  return (
    <div className="mx-auto flex max-w-lg flex-col items-center px-6 py-24 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-100 text-primary-600">
        <Compass className="h-8 w-8" />
      </div>
      <p className="mt-6 text-sm font-bold uppercase tracking-widest text-primary-600">Error 404</p>
      <h1 className="mt-2 text-3xl font-extrabold">Page not found</h1>
      <p className="mt-2 text-slate-500">The page you are looking for doesn’t exist or has moved.</p>
      <Link to="/" className="btn-primary mt-8">Back to home</Link>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      {/* Public pages with Navbar/Footer */}
      <Route
        path="/"
        element={
          <PublicLayout>
            <Landing />
          </PublicLayout>
        }
      />
      <Route
        path="/login"
        element={
          <AuthGuard>
            <Login />
          </AuthGuard>
        }
      />
      <Route
        path="/register"
        element={
          <AuthGuard>
            <Register />
          </AuthGuard>
        }
      />

      {/* Public certificate verifier */}
      <Route
        path="/certificates/verify/:certificateNumber"
        element={
          <PublicLayout>
            <VerifyCertificate />
          </PublicLayout>
        }
      />

      {/* Applicant Portal — sidebar layout */}
      <Route
        element={
          <ProtectedRoute roles={["applicant"]}>
            <AppShell />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/applications" element={<Applications />} />
        <Route path="/applications/new" element={<NewApplication />} />
        <Route path="/applications/:id" element={<ApplicationDetail />} />
        <Route path="/applications/:id/correct" element={<CorrectionResubmit />} />
        <Route path="/assistant" element={<Assistant />} />
        <Route path="/payment/:applicationId" element={<Payment />} />
        <Route path="/payments" element={<PaymentHistory />} />
        <Route path="/certificate/:applicationId" element={<Certificate />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/profile" element={<Profile />} />
      </Route>

      {/* Officer protected routes */}
      <Route
        element={
          <ProtectedRoute roles={["officer", "admin"]}>
            <AppShell />
          </ProtectedRoute>
        }
      >
        <Route path="/officer" element={<OfficerQueue />} />
        <Route path="/officer/applications/:id" element={<OfficerReview />} />
        <Route path="/officer/history" element={<OfficerHistory />} />
        <Route path="/officer/search" element={<OfficerSearch />} />
        <Route path="/officer/reports" element={<OfficerReports />} />
        <Route path="/officer/profile" element={<Profile />} />
      </Route>

      {/* Admin protected routes */}
      <Route
        element={
          <ProtectedRoute roles={["admin"]}>
            <AppShell />
          </ProtectedRoute>
        }
      >
        <Route path="/admin" element={<AdminUsers />} />
        <Route path="/admin/analytics" element={<AdminAnalytics />} />
        <Route path="/admin/logs" element={<AdminLogs />} />
        <Route path="/admin/settings" element={<AdminSettings />} />
        <Route path="/admin/profile" element={<Profile />} />
      </Route>

      <Route
        path="*"
        element={
          <PublicLayout>
            <NotFound />
          </PublicLayout>
        }
      />
    </Routes>
  );
}
