import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from '@/components/layout/AppLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import LoginScreen from '@/screens/LoginScreen';
import HomeScreen from '@/screens/HomeScreen';
import AllPatientsScreen from '@/screens/AllPatientsScreen';
import PatientDetailsScreen from '@/screens/PatientDetailsScreen';
import VisitsScreen from '@/screens/VisitsScreen';
import VisitContextScreen from '@/screens/VisitContextScreen';
import ConsultationScreen from '@/screens/ConsultationScreen';
import PrescriptionScreen from '@/screens/PrescriptionScreen';
import PrintPreviewScreen from '@/screens/PrintPreviewScreen';
import SettingsScreen from '@/screens/SettingsScreen';
import AppointmentsScreen from '@/screens/AppointmentsScreen';
import { useAuthStore } from '@/stores/auth.store';

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
