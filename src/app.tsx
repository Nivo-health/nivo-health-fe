import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from '@/components/layout/app-layout';
import ProtectedRoute from '@/components/protected-route';
import { useAuthStore } from '@/stores/auth.store';

const LoginScreen = lazy(() => import('@/screens/login'));
const HomeScreen = lazy(() => import('@/screens/dashboard'));
const AllPatientsScreen = lazy(() => import('@/screens/all-patients'));
const PatientDetailsScreen = lazy(() => import('@/screens/patient-details'));
const VisitsScreen = lazy(() => import('@/screens/visits'));
const VisitContextScreen = lazy(() => import('@/screens/visit-context'));
const ConsultationScreen = lazy(() => import('@/screens/consultation'));
const PrescriptionScreen = lazy(() => import('@/screens/prescription'));
const PrintPreviewScreen = lazy(() => import('@/screens/print-preview'));
const SettingsScreen = lazy(() => import('@/screens/settings'));
const AppointmentsScreen = lazy(() => import('@/screens/appointments'));
const DoctorScheduleSettingsScreen = lazy(
  () => import('@/screens/doctor-schedule-settings'),
);

function RouteLoader() {
  return (
    <div className="min-h-[calc(100vh-4rem)] bg-background flex items-center justify-center">
      <div className="text-muted-foreground">Loading...</div>
    </div>
  );
}

function App() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  return (
    <BrowserRouter>
      <Routes>
        {/* Public route */}
        <Route
          path="/login"
          element={
            isAuthenticated ? (
              <Navigate to="/" replace />
            ) : (
              <Suspense fallback={<RouteLoader />}>
                <LoginScreen />
              </Suspense>
            )
          }
        />

        {/* Protected routes */}
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <AppLayout>
                <Suspense fallback={<RouteLoader />}>
                  <Routes>
                    <Route path="/" element={<HomeScreen />} />
                    <Route path="/patients" element={<AllPatientsScreen />} />
                    <Route
                      path="/patient/:patientId"
                      element={<PatientDetailsScreen />}
                    />
                    <Route path="/visits" element={<VisitsScreen />} />
                    <Route
                      path="/appointments"
                      element={<AppointmentsScreen />}
                    />
                    <Route
                      path="/visit/:visitId"
                      element={<VisitContextScreen />}
                    />
                    <Route
                      path="/consultation/:visitId"
                      element={<ConsultationScreen />}
                    />
                    <Route
                      path="/prescription/:visitId"
                      element={<PrescriptionScreen />}
                    />
                    <Route
                      path="/print-preview/:visitId"
                      element={<PrintPreviewScreen />}
                    />
                    <Route path="/settings" element={<SettingsScreen />} />
                    <Route
                      path="/doctor-schedule"
                      element={<DoctorScheduleSettingsScreen />}
                    />
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </Suspense>
              </AppLayout>
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
