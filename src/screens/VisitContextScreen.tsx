import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { patientService } from '../services/patientService';
import { visitService } from '../services/visitService';
import { prescriptionService } from '../services/prescriptionService';
import { toast } from '../utils/toast';
import type { Patient, Visit } from '../types';

export default function VisitContextScreen() {
  const { visitId } = useParams<{ visitId: string }>();
  const navigate = useNavigate();
  const [visit, setVisit] = useState<Visit | null>(null);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [visitHistory, setVisitHistory] = useState<Visit[]>([]);
  const [historyPrescriptionCounts, setHistoryPrescriptionCounts] = useState<Record<string, number>>({});
  const [whatsappEnabled, setWhatsappEnabled] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      if (!visitId) {
        navigate('/visits');
        return;
      }

      const currentVisit = await visitService.getById(visitId);
      if (!currentVisit) {
        navigate('/visits');
        return;
      }

      setVisit(currentVisit);
      const patientData = await patientService.getById(currentVisit.patientId);
      setPatient(patientData);

      // Load visit history
      const history = await visitService.getByPatientId(currentVisit.patientId);
      setVisitHistory(history);

      // For history visits that have a prescription, load medicine counts
      const entries = await Promise.all(
        history
          .filter((h) => h.prescription_id)
          .map(async (h) => {
            try {
              const prescription = await prescriptionService.getById(h.prescription_id!);
              if (!prescription) return null;
              return [h.id, prescription.medicines.length] as const;
            } catch {
              return null;
            }
          })
      );

      const counts: Record<string, number> = {};
      for (const entry of entries) {
        if (entry) {
          const [id, count] = entry;
          counts[id] = count;
        }
      }
      setHistoryPrescriptionCounts(counts);
    };

    loadData();
  }, [visitId, navigate]);

  const handleConsultClick = () => {
    if (visit) {
      navigate(`/consultation/${visit.id}`);
    }
  };

  const handleStartConsultation = async () => {
    if (!visit) return;
    
    try {
      const updatedVisit = await visitService.updateStatus(visit.id, 'in_progress');
      if (updatedVisit) {
        setVisit(updatedVisit);
        navigate(`/consultation/${visit.id}`);
      } else {
        toast.error('Failed to start consultation. Please try again.');
      }
    } catch (error: any) {
      console.error('Failed to start consultation:', error);
      toast.error(error?.message || 'Failed to start consultation. Please try again.');
    }
  };

  const handleWhatsAppToggle = () => {
    setWhatsappEnabled(!whatsappEnabled);
    if (!whatsappEnabled) {
      toast.success('WhatsApp notifications enabled', 'Prescription will be sent on WhatsApp when saved');
    }
  };

  const handleViewOldPrescription = (oldVisit: Visit) => {
    // Always navigate to print preview for that visit;
    // PrintPreviewScreen will load the prescription via prescription_id if available.
    navigate(`/print-preview/${oldVisit.id}`);
  };

  if (!visit || !patient) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  const visitDate = new Date(visit.date).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });


  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gray-50 overflow-x-hidden">
      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Patient Header */}
        <Card className="mb-6 border-teal-200">
          <CardHeader className="bg-gradient-to-r from-teal-50 to-white border-b border-teal-100">
            <div className="flex items-center justify-between">
            <CardTitle className="text-2xl text-teal-900">{patient.name}</CardTitle>
              <div className="flex items-center gap-2">
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  visit.status === 'waiting' 
                    ? 'bg-yellow-100 text-yellow-800'
                    : visit.status === 'in_progress'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-green-100 text-green-800'
                }`}>
                  {visit.status === 'waiting' 
                    ? 'Waiting'
                    : visit.status === 'in_progress'
                    ? 'In Progress'
                    : 'Completed'}
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-teal-600 font-medium">Age:</span>
                <span className="font-semibold text-gray-900">{patient.age || 'N/A'}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-teal-600 font-medium">Gender:</span>
                <span className="font-semibold text-gray-900">
                  {patient.gender === 'M' ? 'Male' : patient.gender === 'F' ? 'Female' : 'N/A'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-teal-600 font-medium">Mobile:</span>
                <span className="font-semibold text-gray-900">{patient.mobile}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-teal-600 font-medium">Date:</span>
                <span className="font-semibold text-gray-900">{visitDate}</span>
              </div>
            </div>
          </CardContent>
        </Card>

                  {/* Primary Actions */}
          <div className="mb-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="whatsapp"
                  checked={whatsappEnabled}
                  onChange={handleWhatsAppToggle}
                  className="w-4 h-4 text-teal-600 border-teal-300 rounded focus:ring-teal-500"
                />
                <label htmlFor="whatsapp" className="text-sm font-medium text-gray-700">
                  Send prescription on WhatsApp
                </label>
              </div>
                {visit.status === 'waiting' ? (
                  <Button
                    onClick={handleStartConsultation}
                    size="lg"
                    className="w-full"
                    autoFocus
                  >
                    Start Consultation
                  </Button>
                ) : (
                <Button
                  onClick={handleConsultClick}
                  size="lg"
                  className="w-full"
                  autoFocus
                >
                  Consult & Write Prescription
                </Button>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Visit History */}
        <div>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Visit History</CardTitle>
              </CardHeader>
              <CardContent>
                {visitHistory.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {visitHistory.map((historyVisit) => (
                      <div
                        key={historyVisit.id}
                        className={`p-3 rounded-lg border transition-colors ${
                          historyVisit.id === visit.id
                            ? 'bg-teal-50 border-teal-300 shadow-sm'
                            : 'bg-white border-teal-200 hover:bg-teal-50 cursor-pointer'
                        }`}
                        onClick={() => {
                          // Make all non-current history cards clickable, regardless of local prescription field
                          if (historyVisit.id !== visit.id) {
                            handleViewOldPrescription(historyVisit);
                          }
                        }}
                      >
                        <div className="text-sm font-medium text-gray-900">
                          {new Date(historyVisit.date).toLocaleDateString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </div>
                        <div className="text-xs text-gray-600 mt-1">
                        {historyVisit.status === 'waiting' 
                          ? 'Waiting'
                          : historyVisit.status === 'in_progress'
                          ? 'In Progress'
                          : 'Completed'}
                          {historyVisit.prescription_id && (
                            <>
                              {' • Prescription'}
                              {historyPrescriptionCounts[historyVisit.id] !== undefined &&
                                ` • ${historyPrescriptionCounts[historyVisit.id]} medicine(s)`}
                            </>
                          )}
                        </div>
                        {historyVisit.id === visit.id && (
                          <div className="text-xs text-teal-700 mt-1 font-semibold">Current Visit</div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-gray-500">No previous visits</div>
                )}
              </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
