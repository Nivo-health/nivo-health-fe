import { useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import type { Visit } from '../types';
import { usePatient } from '../queries/patients.queries';
import {
  useVisit,
  useVisitsByPatient,
  useUpdateVisitStatus,
} from '../queries/visits.queries';
import { usePrescriptionsByIds } from '../queries/prescriptions.queries';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from '@/components/ui/toast';

export default function VisitContextScreen() {
  const { visitId } = useParams<{ visitId: string }>();
  const navigate = useNavigate();
  const [whatsappEnabled, setWhatsappEnabled] = useState(true);
  const updateVisitStatusMutation = useUpdateVisitStatus();
  const { data: visit } = useVisit(visitId || '');
  const { data: patient } = usePatient(visit?.patientId || '');
  const { data: visitHistory = [] } = useVisitsByPatient(
    visit?.patientId || '',
    50,
  );

  const historyWithPrescription = useMemo(
    () => visitHistory.filter((h) => h.prescription_id),
    [visitHistory],
  );
  const prescriptionIds = useMemo(
    () => historyWithPrescription.map((h) => h.prescription_id!),
    [historyWithPrescription],
  );
  const prescriptionQueries = usePrescriptionsByIds(prescriptionIds);

  const historyPrescriptionCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    historyWithPrescription.forEach((h, index) => {
      const data = prescriptionQueries[index]?.data;
      if (data) {
        counts[h.id] = data.medicines.length;
      }
    });
    return counts;
  }, [historyWithPrescription, prescriptionQueries]);

  const handleConsultClick = () => {
    if (visit) {
      navigate(`/consultation/${visit.id}`);
    }
  };

  const handleStartConsultation = async () => {
    if (!visit) return;

    try {
      const updatedVisit = await updateVisitStatusMutation.mutateAsync({
        id: visit.id,
        status: 'in_progress',
      });
      if (updatedVisit) {
        navigate(`/consultation/${visit.id}`);
      } else {
        toast.add({
          type: 'error',
          title: 'Failed to start consultation. Please try again.',
        });
      }
    } catch (error: any) {
      toast.add({
        type: 'error',
        title:
          error?.message || 'Failed to start consultation. Please try again.',
      });
    }
  };

  const handleWhatsAppToggle = (checked: boolean) => {
    setWhatsappEnabled(checked);
    if (checked) {
      toast.add({
        type: 'success',
        title: 'WhatsApp notifications enabled',
        description: 'Prescription will be sent on WhatsApp when saved',
      });
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

  const visitDate = dayjs(visit.date).format('DD MMMM YYYY');

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gray-50 overflow-x-hidden">
      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Patient Header */}
        <Card.Root className="mb-6 border-teal-200">
          <Card.Header className="bg-linear-to-r from-teal-50 to-white border-b border-teal-100">
            <div className="flex items-center justify-between">
              <Card.Title className="text-2xl text-teal-900">
                {patient.name}
              </Card.Title>
              <div className="flex items-center gap-2">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    visit.status === 'waiting'
                      ? 'bg-yellow-100 text-yellow-800'
                      : visit.status === 'in_progress'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-green-100 text-green-800'
                  }`}
                >
                  {visit.status === 'waiting'
                    ? 'Waiting'
                    : visit.status === 'in_progress'
                      ? 'In Progress'
                      : 'Completed'}
                </span>
              </div>
            </div>
          </Card.Header>
          <Card.Panel className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-teal-600 font-medium">Age:</span>
                <span className="font-semibold text-gray-900">
                  {patient.age || 'N/A'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-teal-600 font-medium">Gender:</span>
                <span className="font-semibold text-gray-900">
                  {patient.gender === 'M'
                    ? 'Male'
                    : patient.gender === 'F'
                      ? 'Female'
                      : 'N/A'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-teal-600 font-medium">Mobile:</span>
                <span className="font-semibold text-gray-900">
                  {patient.mobile}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-teal-600 font-medium">Date:</span>
                <span className="font-semibold text-gray-900">{visitDate}</span>
              </div>
            </div>
          </Card.Panel>
        </Card.Root>

        {/* Primary Actions */}
        <div className="mb-6">
          <Card.Root>
            <Card.Header>
              <Card.Title className="text-lg">Actions</Card.Title>
            </Card.Header>
            <Card.Panel className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox.Root
                  id="whatsapp"
                  checked={whatsappEnabled}
                  onCheckedChange={handleWhatsAppToggle}
                />
                <label
                  htmlFor="whatsapp"
                  className="text-sm font-medium text-gray-700"
                >
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
            </Card.Panel>
          </Card.Root>
        </div>

        {/* Visit History */}
        <div>
          <Card.Root>
            <Card.Header>
              <Card.Title className="text-lg">Visit History</Card.Title>
            </Card.Header>
            <Card.Panel>
              {visitHistory.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {visitHistory.map((historyVisit) => (
                    <button
                      key={historyVisit.id}
                      type="button"
                      className={`p-3 rounded-lg border transition-colors text-left ${
                        historyVisit.id === visit.id
                          ? 'bg-teal-50 border-teal-300 shadow-sm'
                          : 'bg-white border-teal-200 hover:bg-teal-50 cursor-pointer'
                      }`}
                      disabled={historyVisit.id === visit.id}
                      onClick={() => handleViewOldPrescription(historyVisit)}
                    >
                      <div className="text-sm font-medium text-gray-900">
                        {dayjs(historyVisit.date).format('DD MMM YYYY')}
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
                            {historyPrescriptionCounts[historyVisit.id] !==
                              undefined &&
                              ` • ${historyPrescriptionCounts[historyVisit.id]} medicine(s)`}
                          </>
                        )}
                      </div>
                      {historyVisit.id === visit.id && (
                        <div className="text-xs text-teal-700 mt-1 font-semibold">
                          Current Visit
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-gray-500">No previous visits</div>
              )}
            </Card.Panel>
          </Card.Root>
        </div>
      </div>
    </div>
  );
}
