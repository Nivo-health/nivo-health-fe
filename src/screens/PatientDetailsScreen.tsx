import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '../components/ui/Card';
import { patientService } from '../services/patientService';
import { visitService } from '../services/visitService';
import { toast } from '../utils/toast';
import type { Patient, Visit } from '../types';

export default function PatientDetailsScreen() {
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [visitHistory, setVisitHistory] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      if (!patientId) {
        navigate('/patients');
        return;
      }

      try {
        setLoading(true);
        const patientData = await patientService.getById(patientId);
        if (!patientData) {
          toast.error('Patient not found');
          navigate('/patients');
          return;
        }

        setPatient(patientData);

        // Load visit history
        const history = await visitService.getByPatientId(patientId);
        setVisitHistory(history);
      } catch (error) {
        console.error('Failed to load patient data:', error);
        toast.error('Failed to load patient data');
        navigate('/patients');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [patientId, navigate]);

  const handleViewVisit = (visit: Visit) => {
    navigate(`/visit/${visit.id}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (!patient) {
    return null;
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gray-50 overflow-x-hidden">
      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Patient Header */}
        <Card className="mb-6 border-teal-200">
          <CardHeader className="bg-gradient-to-r from-teal-50 to-white border-b border-teal-100">
            <CardTitle className="text-2xl text-teal-900">
              {patient.name}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
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
                    ? new Date(patient.createdAt).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })
                    : 'N/A'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Visit History */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Visit History</CardTitle>
            </CardHeader>
            <CardContent>
              {visitHistory.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {visitHistory.map((visit) => (
                    <div
                      key={visit.id}
                      className="p-3 rounded-lg border bg-white border-teal-200 hover:bg-teal-50 cursor-pointer transition-colors"
                      onClick={() => handleViewVisit(visit)}
                    >
                      <div className="text-sm font-medium text-gray-900">
                        {new Date(visit.date).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
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
