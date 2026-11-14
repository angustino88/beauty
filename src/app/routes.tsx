import { lazy } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { FullscreenLayout } from "@/components/layout/FullscreenLayout";
import PrivateRoute from "@/components/routing/PrivateRoute";
import PermissionRoute from "@/components/routing/PermissionRoute";

// Auth
const SsoLoginPage = lazy(() => import("@/features/auth/pages/SsoLoginPage"));
const AuthRedirectPage = lazy(
  () => import("@/features/auth/pages/AuthRedirectPage"),
);

// Error pages
const NotFound = lazy(() => import("@/pages/errors/NotFound"));
const ServerError = lazy(() => import("@/pages/errors/ServerError"));
const AccessDenied = lazy(() => import("@/pages/errors/AccessDenied"));

// Protected pages
const Dashboard = lazy(() => import("@/features/dashboard/pages/Dashboard"));
const InteractiveDashboard = lazy(
  () => import("@/features/interactive-dashboard/pages/InteractiveDashboard"),
);
const BookingCalendar = lazy(
  () => import("@/features/booking/pages/BookingCalendar"),
);
const MyBookings = lazy(() => import("@/features/booking/pages/MyBookings"));

// Spaces: Room, Station, Bench, Mapping
const Room = lazy(() => import("@/features/spaces/room/pages/Room"));
const Station = lazy(() => import("@/features/spaces/station/pages/Station"));
const Bench = lazy(() => import("@/features/spaces/bench/pages/Bench"));
const Mapping = lazy(() => import("@/features/spaces/mapping/pages/Mapping"));
const License = lazy(
  () => import("@/features/lab-equipment/license/pages/License"),
);

// Equipment Categories (Unified direct OpenAPI architecture)
const ComputingPage = lazy(() => import("@/features/lab-equipment/pages/ComputingPage"));
const DisplayPage = lazy(() => import("@/features/lab-equipment/pages/DisplayPage"));
const DebuggingPage = lazy(() => import("@/features/lab-equipment/pages/DebuggingPage"));
const NetworkingPage = lazy(() => import("@/features/lab-equipment/pages/NetworkingPage"));
const PowerPage = lazy(() => import("@/features/lab-equipment/pages/PowerPage"));
const AccessoryPage = lazy(() => import("@/features/lab-equipment/pages/AccessoryPage"));
const SamplePage = lazy(() => import("@/features/lab-equipment/pages/SamplePage"));
const FurniturePage = lazy(() => import("@/features/lab-equipment/pages/FurniturePage"));
const InstrumentPage = lazy(() => import("@/features/lab-equipment/pages/InstrumentPage"));
const LaboratoryPage = lazy(() => import("@/features/lab-equipment/pages/LaboratoryPage"));
const MechanicalPage = lazy(() => import("@/features/lab-equipment/pages/MechanicalPage"));
const OtherPage = lazy(() => import("@/features/lab-equipment/pages/OtherPage"));

// Analytics & Monitoring
const LabAnalytics = lazy(
  () => import("@/features/lab-analytics/pages/LabAnalytics"),
);
const LabMonitoring = lazy(
  () => import("@/features/lab-monitoring/pages/LabMonitoring"),
);
const SupportTickets = lazy(
  () => import("@/features/lab-support/pages/SupportTickets"),
);
const SupportTicketDetail = lazy(
  () => import("@/features/lab-support/pages/SupportTicketDetail"),
);
const Leaderboard = lazy(
  () => import("@/features/leaderboard/pages/Leaderboard"),
);

// Finance & Procurement
const PurchasesPage = lazy(
  () => import("@/features/purchase/pages/PurchasesPage"),
);
const ExpensesPage = lazy(
  () => import("@/features/expense/pages/ExpensesPage"),
);
const FinanceReportPage = lazy(
  () => import("@/features/finance/pages/FinanceReportPage"),
);

const COORDINATOR_AND_ADMIN = ["lab-coordinator", "admin"];

export default function AppRoutes() {
  return (
    <Routes>
      {/* Auth */}
      <Route path="/login" element={<SsoLoginPage />} />
      <Route path="/auth/redirect" element={<AuthRedirectPage />} />
      <Route path="/about" element={<AuthRedirectPage />} />

      {/* Error pages */}
      <Route path="/404" element={<NotFound />} />
      <Route path="/500" element={<ServerError />} />
      <Route path="/403" element={<AccessDenied />} />

      {/* All private pages share the AppLayout shell */}
      <Route
        element={
          <PrivateRoute>
            <AppLayout />
          </PrivateRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        {/* Dashboard */}
        <Route path="/dashboard" element={<Dashboard />} />

        {/* Booking */}
        <Route path="/booking-calendar" element={<BookingCalendar />} />
        <Route path="/my-bookings" element={<MyBookings />} />

        {/* Spaces: Room, Station, Bench, Mapping (coordinator + admin only) */}
        <Route
          path="/spaces"
          element={
            <PermissionRoute groups={COORDINATOR_AND_ADMIN}>
              <Mapping />
            </PermissionRoute>
          }
        />
        <Route
          path="/spaces/mapping"
          element={
            <PermissionRoute groups={COORDINATOR_AND_ADMIN}>
              <Mapping />
            </PermissionRoute>
          }
        />
        <Route
          path="/spaces/room"
          element={
            <PermissionRoute groups={COORDINATOR_AND_ADMIN}>
              <Room />
            </PermissionRoute>
          }
        />
        <Route
          path="/spaces/station"
          element={
            <PermissionRoute groups={COORDINATOR_AND_ADMIN}>
              <Station />
            </PermissionRoute>
          }
        />
        <Route
          path="/spaces/bench"
          element={
            <PermissionRoute groups={COORDINATOR_AND_ADMIN}>
              <Bench />
            </PermissionRoute>
          }
        />

        {/* Backward-compatible spaces redirects */}
        <Route path="/lab-equipment" element={<Navigate to="/spaces/mapping" replace />} />
        <Route path="/lab-equipment/mapping" element={<Navigate to="/spaces/mapping" replace />} />
        <Route path="/lab-equipment/room" element={<Navigate to="/spaces/room" replace />} />
        <Route path="/lab-equipment/rack" element={<Navigate to="/spaces/station" replace />} />
        <Route path="/lab-equipment/station" element={<Navigate to="/spaces/station" replace />} />
        <Route path="/lab-equipment/lab-info" element={<Navigate to="/spaces/bench" replace />} />
        <Route path="/lab-equipment/bench" element={<Navigate to="/spaces/bench" replace />} />

        {/* Licenses */}
        <Route
          path="/lab-equipment/license"
          element={
            <PermissionRoute groups={COORDINATOR_AND_ADMIN}>
              <License />
            </PermissionRoute>
          }
        />

        {/* 12 Direct Equipment Categories */}
        <Route
          path="/lab-equipment/computing"
          element={
            <PermissionRoute groups={COORDINATOR_AND_ADMIN}>
              <ComputingPage />
            </PermissionRoute>
          }
        />
        <Route
          path="/lab-equipment/display"
          element={
            <PermissionRoute groups={COORDINATOR_AND_ADMIN}>
              <DisplayPage />
            </PermissionRoute>
          }
        />
        <Route
          path="/lab-equipment/debugging"
          element={
            <PermissionRoute groups={COORDINATOR_AND_ADMIN}>
              <DebuggingPage />
            </PermissionRoute>
          }
        />
        <Route
          path="/lab-equipment/networking"
          element={
            <PermissionRoute groups={COORDINATOR_AND_ADMIN}>
              <NetworkingPage />
            </PermissionRoute>
          }
        />
        <Route
          path="/lab-equipment/power"
          element={
            <PermissionRoute groups={COORDINATOR_AND_ADMIN}>
              <PowerPage />
            </PermissionRoute>
          }
        />
        <Route
          path="/lab-equipment/accessory"
          element={
            <PermissionRoute groups={COORDINATOR_AND_ADMIN}>
              <AccessoryPage />
            </PermissionRoute>
          }
        />
        <Route
          path="/lab-equipment/sample"
          element={
            <PermissionRoute groups={COORDINATOR_AND_ADMIN}>
              <SamplePage />
            </PermissionRoute>
          }
        />
        <Route
          path="/lab-equipment/furniture"
          element={
            <PermissionRoute groups={COORDINATOR_AND_ADMIN}>
              <FurniturePage />
            </PermissionRoute>
          }
        />
        <Route
          path="/lab-equipment/instrument"
          element={
            <PermissionRoute groups={COORDINATOR_AND_ADMIN}>
              <InstrumentPage />
            </PermissionRoute>
          }
        />
        <Route
          path="/lab-equipment/laboratory"
          element={
            <PermissionRoute groups={COORDINATOR_AND_ADMIN}>
              <LaboratoryPage />
            </PermissionRoute>
          }
        />
        <Route
          path="/lab-equipment/mechanical"
          element={
            <PermissionRoute groups={COORDINATOR_AND_ADMIN}>
              <MechanicalPage />
            </PermissionRoute>
          }
        />
        <Route
          path="/lab-equipment/other"
          element={
            <PermissionRoute groups={COORDINATOR_AND_ADMIN}>
              <OtherPage />
            </PermissionRoute>
          }
        />

        {/* Legacy redirect routes */}
        <Route path="/lab-equipment/computer" element={<Navigate to="/lab-equipment/computing" replace />} />
        <Route path="/lab-equipment/monitor" element={<Navigate to="/lab-equipment/display" replace />} />
        <Route path="/lab-equipment/debug-hardware" element={<Navigate to="/lab-equipment/debugging" replace />} />
        <Route path="/lab-equipment/network-interface" element={<Navigate to="/lab-equipment/networking" replace />} />
        <Route path="/lab-equipment/power-supply" element={<Navigate to="/lab-equipment/power" replace />} />
        <Route path="/lab-equipment/accessories" element={<Navigate to="/lab-equipment/accessory" replace />} />

        {/* Analytics + Monitoring */}
        <Route
          path="/lab-analytics"
          element={
            <PermissionRoute groups={COORDINATOR_AND_ADMIN}>
              <LabAnalytics />
            </PermissionRoute>
          }
        />
        <Route
          path="/lab-monitoring"
          element={
            <PermissionRoute groups={COORDINATOR_AND_ADMIN}>
              <LabMonitoring />
            </PermissionRoute>
          }
        />

        {/* Finance & Procurement (coordinator + admin only) */}
        <Route
          path="/purchases"
          element={
            <PermissionRoute groups={COORDINATOR_AND_ADMIN}>
              <PurchasesPage />
            </PermissionRoute>
          }
        />
        <Route path="/procurement" element={<Navigate to="/purchases" replace />} />
        <Route
          path="/expenses"
          element={
            <PermissionRoute groups={COORDINATOR_AND_ADMIN}>
              <ExpensesPage />
            </PermissionRoute>
          }
        />
        <Route
          path="/finance-report"
          element={
            <PermissionRoute groups={COORDINATOR_AND_ADMIN}>
              <FinanceReportPage />
            </PermissionRoute>
          }
        />
        <Route path="/finance" element={<Navigate to="/finance-report" replace />} />

        {/* Support Tickets + Leaderboard */}
        <Route path="/support-tickets" element={<SupportTickets />} />
        <Route path="/support-tickets/:key" element={<SupportTicketDetail />} />
        <Route path="/lab-support" element={<Navigate to="/support-tickets" replace />} />
        <Route path="/leaderboard" element={<Leaderboard />} />
      </Route>

      {/* Fullscreen layout */}
      <Route
        element={
          <PrivateRoute>
            <FullscreenLayout />
          </PrivateRoute>
        }
      >
        <Route path="/dashboard/3d" element={<InteractiveDashboard />} />
        <Route
          path="/dashboard/3d/:roomSlug"
          element={<InteractiveDashboard />}
        />
      </Route>

      {/* Default redirects */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
