import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Input, Modal, DateFilter } from '../components/ui';
import { Card, CardContent } from '../components/ui/Card';
import { patientService } from '../services/patientService';
import { visitService } from '../services/visitService';
import type { Patient } from '../types';

export default function AllPatientsScreen() {
  const navigate = useNavigate();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState(() => {
    // Default to today's date in YYYY-MM-DD format
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newPatient, setNewPatient] = useState({
    name: '',
    mobile: '',
    age: '',
    gender: '' as 'M' | 'F' | '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    loadPatients();
  }, []);

  useEffect(() => {
    const filterPatients = async () => {
      let filtered = [...patients];

      // Apply search filter
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase();
        filtered = filtered.filter(
          (patient) =>
            patient.name.toLowerCase().includes(query) ||
            patient.mobile.includes(searchQuery)
        );
      }

      // Apply date filter - show patients who have visits on the selected date
      if (selectedDate) {
        const filteredByDate: Patient[] = [];
        for (const patient of filtered) {
          const visits = await visitService.getByPatientId(patient.id);
          const hasVisitOnDate = visits.some((visit) => {
            const visitDate = new Date(visit.date).toISOString().split('T')[0];
            return visitDate === selectedDate;
          });
          if (hasVisitOnDate) {
            filteredByDate.push(patient);
          }
        }
        filtered = filteredByDate;
      }

      setFilteredPatients(filtered);
    };

    filterPatients();
  }, [searchQuery, selectedDate, patients]);

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

  const handleStartVisit = async (e: React.MouseEvent, patient: Patient) => {
    e.stopPropagation(); // Prevent card click
    try {
      const visit = await visitService.create({ 
        patientId: patient.id,
        status: 'waiting'
      });
      navigate(`/visit/${visit.id}`);
    } catch (error) {
      console.error('Failed to create visit:', error);
    }
  };

  const handleAddNewPatient = () => {
    setIsModalOpen(true);
    setNewPatient({ name: '', mobile: '', age: '', gender: '' });
    setErrors({});
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!newPatient.name.trim()) {
      newErrors.name = 'Name is required';
    }
    if (!newPatient.mobile.trim()) {
      newErrors.mobile = 'Mobile is required';
    } else if (!/^\d{10}$/.test(newPatient.mobile)) {
      newErrors.mobile = 'Mobile must be 10 digits';
    }
    if (newPatient.age && (isNaN(Number(newPatient.age)) || Number(newPatient.age) < 0)) {
      newErrors.age = 'Age must be a valid number';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSavePatient = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      const patient = await patientService.create({
        name: newPatient.name.trim(),
        mobile: newPatient.mobile.trim(),
        age: newPatient.age ? Number(newPatient.age) : undefined,
        gender: newPatient.gender || undefined,
      });

      // Create visit for new patient with waiting status
      const visit = await visitService.create({ 
        patientId: patient.id,
        status: 'waiting'
      });
      setIsModalOpen(false);
      navigate(`/visit/${visit.id}`);
    } catch (error) {
      console.error('Failed to create patient:', error);
    }
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
          <Button onClick={handleAddNewPatient} className="w-full sm:w-auto">
            + Add New Patient
          </Button>
        </div>

        <Card className="border-teal-200 mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <Input
                type="text"
                placeholder="Search patients by name or mobile..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1"
              />
              <div className="md:w-48">
                <DateFilter
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {filteredPatients.length > 0 ? (
          <div className="grid gap-4">
            {filteredPatients.map((patient) => (
              <Card
                key={patient.id}
                className="border-teal-200 hover:border-teal-300 hover:shadow-md transition-all cursor-pointer"
                // onClick={() => handlePatientClick(patient)}
              > 
                <CardContent className="p-4 md:p-6">
                  <div className="flex items-center md:items-start justify-between gap-3 md:gap-4">
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
                    <div className="flex items-center justify-center gap-2 shrink-0">
                      <Button
                        onClick={(e) => handleStartVisit(e, patient)}
                        size="sm"
                        className="shrink-0 w-full sm:w-auto"
                      >
                        Start Visit
                      </Button>
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
                        onClick={() => navigate('/visits')}
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
                    <Button onClick={() => navigate('/visits')}>
                      + Add New Patient
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <Modal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        title="Add New Patient"
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSavePatient}>Save Patient</Button>
          </>
        }
      >
        <div className="space-y-5">
          <Input
            label="Name *"
            value={newPatient.name}
            onChange={(e) => setNewPatient({ ...newPatient, name: e.target.value })}
            error={errors.name}
            placeholder="Enter patient name"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSavePatient();
              }
            }}
          />
          <Input
            label="Mobile *"
            type="tel"
            value={newPatient.mobile}
            onChange={(e) => setNewPatient({ ...newPatient, mobile: e.target.value })}
            error={errors.mobile}
            placeholder="Enter 10-digit mobile number"
            maxLength={10}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSavePatient();
              }
            }}
          />
          <Input
            label="Age"
            type="number"
            value={newPatient.age}
            onChange={(e) => setNewPatient({ ...newPatient, age: e.target.value })}
            error={errors.age}
            placeholder="Enter age (optional)"
            min="0"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSavePatient();
              }
            }}
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Gender (optional)
            </label>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="gender"
                  value="M"
                  checked={newPatient.gender === 'M'}
                  onChange={(e) => setNewPatient({ ...newPatient, gender: e.target.value as 'M' | 'F' })}
                  className="mr-2"
                />
                Male
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="gender"
                  value="F"
                  checked={newPatient.gender === 'F'}
                  onChange={(e) => setNewPatient({ ...newPatient, gender: e.target.value as 'M' | 'F' })}
                  className="mr-2"
                />
                Female
              </label>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
