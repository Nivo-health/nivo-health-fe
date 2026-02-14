import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usePatient } from '../queries/patients.queries';
import { useVisitsByPatient } from '../queries/visits.queries';
import type { Visit } from '../types';
import { Card } from '@/components/ui/card';
import { toast } from '@/components/ui/toast';
import dayjs from 'dayjs';

export default function PatientDetailsScreen() {
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();
  const {
    data: patient,
    isLoading: patientLoading,
    isError: patientError,
  } = usePatient(patientId || '');
  const { data: visitHistory = [], isLoading: visitsLoading } =
    useVisitsByPatient(patientId || '', 50);

  useEffect(() => {
    if (!patientId) {
      navigate('/patients');
      return;
    }
    if (!patientLoading && !patient) {
      toast.add({
        title: patientError
          ? 'Failed to load patient data'
          : 'Patient not found',
        type: 'error',
      });
      navigate('/patients');
    }
  }, [patientId, patientLoading, patient, patientError, navigate]);

  const handleViewVisit = (visit: Visit) => {
    navigate(`/visit/${visit.id}`);
  };

  if (patientLoading || visitsLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!patient) {
    return null;
  }

  return (
    <div className="h-screen bg-background overflow-x-hidden">
      <div className="max-w-7xl mx-auto px-6 py-6 flex flex-col gap-3">
        {/* Patient Header */}
        <Card.Root className="overflow-hidden border-primary/10 ">
          <Card.Header
            className="relative border border-b flex items-center justify-between px-4 py-3 border-b-primary/10 border-x-0 border-t-0"
            style={{
              background: 'var(--gradient-header)',
            }}
          >
            <Card.Title className="text-sm font-medium text-muted-foreground">
              {patient.name}
            </Card.Title>
          </Card.Header>
          <Card.Panel>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-teal-600 font-medium">Age:</span>
                <span className="font-semibold text-gray-900">
                  {patient.age !== undefined && patient.age !== null
                    ? patient.age
                    : 'N/A'}
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
                <span className="text-teal-600 font-medium">Joined:</span>
                <span className="font-semibold text-gray-900">
                  {patient.createdAt
                    ? dayjs(patient.createdAt).format('DD MMM YYYY')
                    : 'N/A'}
                </span>
              </div>
            </div>
          </Card.Panel>
        </Card.Root>

        {/* Visit History */}
        <Card.Root className="overflow-hidden border-primary/10 ">
          <Card.Header
            className="relative border border-b flex items-center justify-between px-4 py-3 border-b-primary/10 border-x-0 border-t-0"
            style={{
              background: 'var(--gradient-header)',
            }}
          >
            <Card.Title className="text-sm font-medium text-muted-foreground">
              Visit History
            </Card.Title>
          </Card.Header>
          <Card.Panel>
            {visitHistory.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {visitHistory.map((visit) => (
                  <button
                    key={visit.id}
                    type="button"
                    className="p-3 rounded-lg border bg-white border-teal-300 hover:bg-teal-50 cursor-pointer transition-colors"
                    onClick={() => handleViewVisit(visit)}
                  >
                    <div className="text-sm font-medium text-gray-900">
                      {dayjs(visit.date).format('DD MMM YYYY')}
                    </div>
                    <div className="text-xs text-gray-600 mt-1">
                      {visit.visit_status === 'WAITING' ||
                      visit.status === 'waiting'
                        ? 'Waiting'
                        : visit.visit_status === 'IN_PROGRESS' ||
                            visit.status === 'in_progress'
                          ? 'In Progress'
                          : 'Completed'}
                      {visit.prescription &&
                        ` • ${visit.prescription.medicines.length} medicine(s)`}
                    </div>
                    {visit.visit_reason && (
                      <div className="text-xs text-gray-500 mt-1">
                        {visit.visit_reason}
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
  );
}
