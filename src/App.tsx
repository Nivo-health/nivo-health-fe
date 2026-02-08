import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from '@/components/layout/AppLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import LoginScreen from '@/screens/Login';
import HomeScreen from '@/screens/Dashboard';
import AllPatientsScreen from '@/screens/AllPatients';
import PatientDetailsScreen from '@/screens/PatientDetails';
import VisitsScreen from '@/screens/Visits';
import VisitContextScreen from '@/screens/VisitContext';
import ConsultationScreen from '@/screens/Consultation';
import PrescriptionScreen from '@/screens/Prescription';
import PrintPreviewScreen from '@/screens/PrintPreview';
import SettingsScreen from '@/screens/Settings';
import AppointmentsScreen from '@/screens/Appointments';
import { useAuthStore } from '@/stores/auth.store';
import DoctorScheduleSettingsScreen from './screens/DoctorScheduleSettings';

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
                    path="/doc-settings"
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
