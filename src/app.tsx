import AppLayout from '@/components/layout/app-layout';
import ProtectedRoute from '@/components/protected-route';
import { useAuthStore } from '@/stores/auth.store';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import AllPatientsScreen from './screens/all-patients';
import AppointmentsScreen from './screens/appointments';
import ConsultationScreen from './screens/consultation';
import HomeScreen from './screens/dashboard';
import DoctorScheduleSettingsScreen from './screens/doctor-schedule-settings';
import LoginScreen from './screens/login';
import PatientDetailsScreen from './screens/patient-details';
import PrescriptionScreen from './screens/prescription';
import PrintPreviewScreen from './screens/print-preview';
import SettingsScreen from './screens/settings';
import VisitContextScreen from './screens/visit-context';
import VisitsScreen from './screens/visits';

function App() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  return (
    <BrowserRouter>
      <Routes>
        {/* Public route */}
        <Route
          path="/login"
          element={
            isAuthenticated ? <Navigate to="/" replace /> : <LoginScreen />
          }
        />

        {/* Protected routes */}
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <AppLayout>
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
              </AppLayout>
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
