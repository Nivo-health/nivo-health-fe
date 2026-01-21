import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from './utils/toast';
import AppLayout from './components/layout/AppLayout';
import HomeScreen from './screens/HomeScreen';
import AllPatientsScreen from './screens/AllPatientsScreen';
import PatientSearchScreen from './screens/PatientSearchScreen';
import VisitContextScreen from './screens/VisitContextScreen';
import ConsultationScreen from './screens/ConsultationScreen';
import PrescriptionScreen from './screens/PrescriptionScreen';
import PrintPreviewScreen from './screens/PrintPreviewScreen';
import StatsScreen from './screens/StatsScreen';
import SettingsScreen from './screens/SettingsScreen';

function App() {
  return (
    <BrowserRouter>
      <AppLayout>
        <Routes>
          <Route path="/" element={<HomeScreen />} />
          <Route path="/patients" element={<AllPatientsScreen />} />
          <Route path="/patient-search" element={<PatientSearchScreen />} />
          <Route path="/visit/:visitId" element={<VisitContextScreen />} />
          <Route path="/consultation/:visitId" element={<ConsultationScreen />} />
          <Route path="/prescription/:visitId" element={<PrescriptionScreen />} />
          <Route path="/print-preview/:visitId" element={<PrintPreviewScreen />} />
          <Route path="/stats" element={<StatsScreen />} />
          <Route path="/settings" element={<SettingsScreen />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <Toaster />
      </AppLayout>
    </BrowserRouter>
  );
}

export default App;
