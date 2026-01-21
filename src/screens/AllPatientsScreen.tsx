import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Input } from '../components/ui';
import { Card, CardContent } from '../components/ui/Card';
import { patientService } from '../services/patientService';
import { visitService } from '../services/visitService';
import type { Patient } from '../types';

export default function AllPatientsScreen() {
  const navigate = useNavigate();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPatients();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredPatients(patients);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = patients.filter(
        (patient) =>
          patient.name.toLowerCase().includes(query) ||
          patient.mobile.includes(searchQuery)
      );
      setFilteredPatients(filtered);
    }
  }, [searchQuery, patients]);

  const loadPatients = async () => {
    try {
      setLoading(true);
      const allPatients = await patientService.getAll();
      setPatients(allPatients);
      setFilteredPatients(allPatients);
      console.log('Loaded patients:', allPatients.length);
    } catch (error) {
      console.error('Failed to load patients:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePatientClick = async (patient: Patient) => {
    // Get or create active visit
    let visit = await visitService.getActiveByPatientId(patient.id);
    if (!visit) {
      visit = await visitService.create({ patientId: patient.id });
    }
    navigate(`/visit/${visit.id}`);
  };

  const maskMobile = (mobile: string): string => {
    if (mobile.length <= 4) return mobile;
    return '****' + mobile.slice(-4);
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading patients...</div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gray-50 overflow-x-hidden">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-teal-900">All Patients</h1>
            <p className="text-gray-600 mt-1">
              {filteredPatients.length} {filteredPatients.length === 1 ? 'patient' : 'patients'}
              {searchQuery && ` found`}
            </p>
          </div>
          <Button onClick={() => navigate('/patient-search')} className="w-full sm:w-auto">
            + Add New Patient
          </Button>
        </div>

        <Card className="border-teal-200 mb-6">
          <CardContent className="pt-6">
            <Input
              type="text"
              placeholder="Search patients by name or mobile..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full"
            />
          </CardContent>
        </Card>

        {filteredPatients.length > 0 ? (
          <div className="grid gap-4">
            {filteredPatients.map((patient) => (
              <Card
                key={patient.id}
                className="border-teal-200 hover:border-teal-300 hover:shadow-md transition-all cursor-pointer"
                onClick={() => handlePatientClick(patient)}
              > 
                <CardContent className="p-4 md:p-6">
                  <div className="flex items-start justify-between gap-3 md:gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 md:gap-4">
                        <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-teal-500 to-teal-600 rounded-full flex items-center justify-center text-white font-bold text-base md:text-lg flex-shrink-0">
                          {patient.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-lg font-semibold text-gray-900 truncate">
                            {patient.name}
                          </h3>
                          <div className="mt-1 text-sm text-gray-600 flex flex-wrap gap-x-4 gap-y-1">
                            <span className="whitespace-nowrap">📱 {maskMobile(patient.mobile)}</span>
                            {patient.age && <span className="whitespace-nowrap">👤 Age: {patient.age}</span>}
                            {patient.gender && (
                              <span className="whitespace-nowrap">
                                {patient.gender === 'M' ? '♂' : '♀'} {patient.gender === 'M' ? 'Male' : 'Female'}
                              </span>
                            )}
                            <span className="whitespace-nowrap">📅 Joined: {formatDate(patient.createdAt)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <svg
                        className="w-5 h-5 text-teal-600"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="border-teal-200">
            <CardContent className="p-12 text-center">
              <div className="text-gray-500">
                {searchQuery ? (
                  <>
                    <p className="text-lg font-medium mb-2">No patients found</p>
                    <p className="text-sm">
                      Try a different search term or{' '}
                      <button
                        onClick={() => navigate('/patient-search')}
                        className="text-teal-600 hover:text-teal-700 underline"
                      >
                        add a new patient
                      </button>
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-lg font-medium mb-2">No patients yet</p>
                    <p className="text-sm mb-4">
                      Get started by adding your first patient
                    </p>
                    <Button onClick={() => navigate('/patient-search')}>
                      + Add New Patient
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
