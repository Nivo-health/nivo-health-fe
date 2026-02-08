import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Patient, Visit } from '../types';
import {
  useCreatePatient,
  usePatientSearch,
} from '../queries/patients.queries';
import { useCreateVisit, useVisitsList } from '../queries/visits.queries';
import { useCurrentClinic } from '../queries/clinic.queries';
import { useFiltersStore } from '../stores/filters.store';
import {
  validatePhoneNumber,
  formatPhoneInput,
} from '../utils/phoneValidation';
import {
  extractValidationErrors,
  getErrorMessage,
  hasValidationErrors,
} from '../utils/errorHandler';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DatePicker } from '@/components/ui/date-picker';
import { Card } from '@/components/ui/card';
import { Dialog } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { toast } from '@/components/ui/toast';

export default function VisitsScreen() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Date filter - default to today
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const today = new Date();
    return today.toISOString().split('T')[0]; // YYYY-MM-DD format
  });

  // Doctor filter
  const [selectedDoctorFilter, setSelectedDoctorFilter] = useState<string>('');

  const [page, setPage] = useState(1);
  const pageSize = 20;

  const selectedVisitStatus = useFiltersStore((state) => state.visitStatus);
  const setSelectedVisitStatus = useFiltersStore(
    (state) => state.setVisitStatus,
  );

  // Modal states
  const [step, setStep] = useState<'mobile' | 'patient-form'>('mobile');
  const [mobileNumber, setMobileNumber] = useState('');
  const [foundPatient, setFoundPatient] = useState<Patient | null>(null);
  const [newPatient, setNewPatient] = useState({
    name: '',
    mobile: '',
    age: '',
    gender: '' as 'M' | 'F' | '',
  });
  const [visitReason, setVisitReason] = useState('');
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('');
  const [doctorError, setDoctorError] = useState<string>('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data: clinic } = useCurrentClinic();
  const clinicDoctors = clinic?.doctors || [];
  const createPatientMutation = useCreatePatient();
  const createVisitMutation = useCreateVisit();
  const patientSearchQuery = usePatientSearch(mobileNumber);
  const searching = patientSearchQuery.isFetching;

  const visitStatus =
    selectedVisitStatus && selectedVisitStatus !== 'ALL'
      ? (selectedVisitStatus as
          | 'WAITING'
          | 'IN_PROGRESS'
          | 'COMPLETED'
          | 'CANCELLED')
      : undefined;

  const doctorId =
    selectedDoctorFilter && selectedDoctorFilter !== 'all'
      ? selectedDoctorFilter
      : undefined;

  const { data: visitsResult, isLoading: loading } = useVisitsList({
    page,
    pageSize,
    date: selectedDate,
    visitStatus,
    doctorId,
  });

  const visits = visitsResult?.visits || [];
  const totalCount = visitsResult?.count || 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const filteredVisits = useMemo(() => {
    if (!searchQuery.trim()) return visits;
    const query = searchQuery.toLowerCase();
    return visits.filter((visit) => {
      const patient = visit.patient;
      if (!patient) return false;
      const nameMatch = patient.name?.toLowerCase().includes(query);
      const mobileMatch = patient.mobile?.includes(query);
      const reasonMatch = visit.visit_reason?.toLowerCase().includes(query);
      return nameMatch || mobileMatch || reasonMatch;
    });
  }, [searchQuery, visits]);

  const handleCreateVisit = () => {
    setIsModalOpen(true);
    setStep('mobile');
    setMobileNumber('');
    setFoundPatient(null);
    setNewPatient({ name: '', mobile: '', age: '', gender: '' });
    setVisitReason('');
    setErrors({});
    setDoctorError('');
    // Auto-select doctor if only one is available
    if (clinicDoctors.length === 1) {
      setSelectedDoctorId(clinicDoctors[0].id);
    } else if (clinicDoctors.length > 1) {
      setSelectedDoctorId(''); // Reset to allow user to choose
    }
  };

  const handleVisitClick = (visit: Visit) => {
    navigate(`/visit/${visit.id}`);
  };

  const handleSearchPatient = async () => {
    const phoneValidation = validatePhoneNumber(mobileNumber);
    if (!phoneValidation.isValid) {
      setErrors({
        mobile: phoneValidation.error || 'Please enter a valid mobile number',
      });
      return;
    }

    try {
      setErrors({});

      console.log('🔍 Searching for patient with mobile:', mobileNumber);
      const result = await patientSearchQuery.refetch();
      const searchResults = result.data || [];

      if (searchResults.length > 0) {
        // Patient found - use the first match
        const patient = searchResults[0];
        console.log('✅ Patient found:', patient);
        setFoundPatient(patient);
        setNewPatient({
          name: patient.name,
          mobile: patient.mobile,
          age: patient.age?.toString() || '',
          gender: patient.gender || '',
        });
        setStep('patient-form');
      } else {
        // Patient not found - show form to create
        console.log('❌ Patient not found, showing create form');
        setFoundPatient(null);
        setNewPatient({
          name: '',
          mobile: mobileNumber,
          age: '',
          gender: '',
        });
        setStep('patient-form');
      }
    } catch (error) {
      console.error('❌ Error searching patient:', error);
      toast.add({
        type: 'error',
        title: 'Failed to search patient',
      });
    }
  };

  const validatePatientForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!newPatient.name.trim()) {
      newErrors.name = 'Name is required';
    }
    const phoneValidation = validatePhoneNumber(newPatient.mobile);
    if (!phoneValidation.isValid) {
      newErrors.mobile =
        phoneValidation.error || 'Please enter a valid mobile number';
    }
    if (!newPatient.gender) {
      newErrors.gender = 'Gender is required';
    }
    if (
      newPatient.age &&
      (isNaN(Number(newPatient.age)) || Number(newPatient.age) < 0)
    ) {
      newErrors.age = 'Age must be a valid number';
    }
    if (clinicDoctors.length > 1 && !selectedDoctorId) {
      setDoctorError('Please select a doctor');
    } else {
      setDoctorError('');
    }
    setErrors(newErrors);
    const hasFieldErrors = Object.keys(newErrors).length === 0;
    const hasDoctorError = clinicDoctors.length > 1 ? !selectedDoctorId : false;
    return hasFieldErrors && !hasDoctorError;
  };

  const handleCreateVisitSubmit = async () => {
    if (step === 'mobile') {
      await handleSearchPatient();
      return;
    }

    // Step: patient-form - validate and create visit
    if (!validatePatientForm()) {
      return;
    }

    try {
      let patientId: string;

      if (foundPatient) {
        // Use existing patient
        patientId = foundPatient.id;
        console.log('✅ Using existing patient:', patientId);
      } else {
        // Create new patient
        console.log('🔄 Creating new patient...');
        const patient = await createPatientMutation.mutateAsync({
          name: newPatient.name.trim(),
          mobile: newPatient.mobile.trim(),
          age: newPatient.age ? Number(newPatient.age) : undefined,
          gender: newPatient.gender as 'M' | 'F',
        });
        patientId = patient.id;
        console.log('✅ Patient created:', patientId);
      }

      // Create visit
      console.log('🔄 Creating visit...');
      const visit = await createVisitMutation.mutateAsync({
        patientId,
        visitReason: visitReason.trim() || 'General consultation',
        status: 'waiting',
        doctorId: selectedDoctorId || undefined,
      });

      console.log('✅ Visit created:', visit.id);
      toast.add({
        type: 'success',
        title: 'Visit created successfully!',
      });
      setIsModalOpen(false);

      // Reload visits and navigate
      navigate(`/visit/${visit.id}`);
    } catch (error: any) {
      console.error('❌ Failed to create visit:', error);

      // Extract validation errors if present
      if (hasValidationErrors(error)) {
        const validationErrors = extractValidationErrors(error);
        setErrors((prevErrors) => ({
          ...prevErrors,
          ...validationErrors,
        }));

        // Also set doctor error if present
        if (validationErrors.doctor || validationErrors.doctor_id) {
          setDoctorError(
            validationErrors.doctor || validationErrors.doctor_id || '',
          );
        }

        // Show general error message
        toast.add({
          type: 'error',
          title: getErrorMessage(error),
        });
      } else {
        // Show general error message
        toast.add({
          type: 'error',
          title: getErrorMessage(error),
        });
      }
    }
  };

  const getStatusColor = (status: string) => {
    const s = status.toLowerCase();
    if (s === 'waiting' || s === 'waiting')
      return 'bg-yellow-100 text-yellow-800';
    if (s === 'in_progress' || s === 'in_progress')
      return 'bg-blue-100 text-blue-800';
    if (s === 'completed' || s === 'completed')
      return 'bg-green-100 text-green-800';
    return 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (status: string) => {
    const s = status.toLowerCase();
    if (s === 'waiting' || s === 'waiting') return 'Waiting';
    if (s === 'in_progress' || s === 'in_progress') return 'In Progress';
    if (s === 'completed' || s === 'completed') return 'Completed';
    return status;
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading visits...</div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gray-50 overflow-x-hidden">
      <div className="max-w-7xl mx-auto px-3 md:px-6 py-4 md:py-6">
        {/* Header - Compact on Mobile */}
        <div className="mb-4 md:mb-6">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex-1 min-w-0">
              <h1 className="text-xl md:text-3xl font-bold text-teal-900">
                Visits
              </h1>
              <p className="text-xs md:text-base text-gray-600 mt-1">
                {filteredVisits.length}{' '}
                {filteredVisits.length === 1 ? 'visit' : 'visits'}
                {searchQuery && ` found`}
              </p>
            </div>
            <Button
              onClick={handleCreateVisit}
              className="shrink-0 text-sm md:text-base px-3 md:px-4"
              size="sm"
            >
              + Create
            </Button>
          </div>
        </div>

        {/* Filters - Compact on Mobile */}
        <div className="mb-4 md:mb-6 flex flex-col sm:flex-row gap-2 md:gap-4">
          <div className="flex-1">
            <Input
              type="text"
              placeholder="Search by name, mobile, or reason..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="sm:w-40 md:w-48">
            <DatePicker
              value={selectedDate}
              onChange={(value) => {
                setSelectedDate(value);
                setPage(1);
              }}
              placeholder="Select date"
              className="w-full text-sm"
            />
          </div>
          {clinicDoctors.length > 0 && (
            <div className="flex flex-col items-start gap-2 sm:w-48 md:w-56">
              <Select.Root
                value={selectedDoctorFilter || undefined}
                onValueChange={(value) => {
                  setSelectedDoctorFilter(value === 'all' ? '' : value || '');
                  setPage(1);
                }}
              >
                <Select.Trigger className="w-full text-sm">
                  <Select.Value placeholder="All Doctors" />
                </Select.Trigger>

                <Select.Popup>
                  <Select.Item value="all">All Doctors</Select.Item>

                  {clinicDoctors.map((doc) => (
                    <Select.Item key={doc.id} value={doc.id}>
                      {doc.name}
                    </Select.Item>
                  ))}
                </Select.Popup>
              </Select.Root>
            </div>
          )}

          {/* Visit Status Filter */}
          <div className="flex flex-col items-start gap-2 sm:w-48 md:w-56">
            <Select.Root
              value={selectedVisitStatus || undefined}
              onValueChange={(value) => {
                setSelectedVisitStatus(value || 'ALL');
                setPage(1);
              }}
            >
              <Select.Trigger className="w-full text-sm">
                <Select.Value placeholder="All Statuses" />
              </Select.Trigger>

              <Select.Popup>
                <Select.Item value="ALL">All Statuses</Select.Item>
                <Select.Item value="WAITING">Waiting</Select.Item>
                <Select.Item value="IN_PROGRESS">In Progress</Select.Item>
                <Select.Item value="COMPLETED">Completed</Select.Item>
                <Select.Item value="CANCELLED">Cancelled</Select.Item>
              </Select.Popup>
            </Select.Root>
          </div>
        </div>

        <div className="mb-4 flex items-center justify-between gap-2">
          <div className="text-xs md:text-sm text-gray-600">
            Page {page} of {totalPages}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
            >
              Prev
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
            >
              Next
            </Button>
          </div>
        </div>

        {filteredVisits.length > 0 ? (
          <div className="grid gap-3">
            {filteredVisits.map((visit) => (
              <Card.Root
                key={visit.id}
                className="border-teal-200 hover:border-teal-300 hover:shadow-md transition-all cursor-pointer"
                onClick={() => handleVisitClick(visit)}
              >
                <Card.Panel className="p-3 md:p-5">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 md:gap-4 flex-1 min-w-0">
                      {/* Avatar */}
                      <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-teal-500 to-teal-600 rounded-full flex items-center justify-center text-white font-bold text-base md:text-lg shrink-0">
                        {visit.patient?.name?.charAt(0).toUpperCase() || '?'}
                      </div>

                      {/* Column-based layout for desktop */}
                      <div className="flex-1 min-w-0 grid grid-cols-1 md:grid-cols-[minmax(150px,1fr)_minmax(120px,auto)_minmax(140px,auto)] gap-2 md:gap-4 items-center">
                        {/* Name Column */}
                        <div className="min-w-0">
                          <h3 className="text-lg font-semibold text-gray-900 truncate">
                            {visit.patient?.name || 'Unknown Patient'}
                          </h3>
                        </div>

                        {/* Mobile Column */}
                        <div className="min-w-0">
                          {visit.patient?.mobile ? (
                            <span className="text-sm text-gray-600 whitespace-nowrap">
                              📱 {visit.patient.mobile}
                            </span>
                          ) : (
                            <span className="text-sm text-gray-400">—</span>
                          )}
                        </div>

                        {/* Token Column */}
                        <div className="min-w-0">
                          {visit?.token_number ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-teal-100 text-teal-800 font-semibold text-sm whitespace-nowrap">
                              <span>🎫</span>
                              <span>Token: {visit.token_number}</span>
                            </span>
                          ) : (
                            <span className="text-sm text-gray-400">—</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div className="shrink-0">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(visit.visit_status || visit.status)}`}
                      >
                        {getStatusLabel(visit.visit_status || visit.status)}
                      </span>
                    </div>
                  </div>
                </Card.Panel>
              </Card.Root>
            ))}
          </div>
        ) : (
          <Card.Root className="border-teal-200">
            <Card.Panel className="p-12 text-center">
              <div className="text-gray-500">
                {searchQuery ? (
                  <>
                    <p className="text-lg font-medium mb-2">No visits found</p>
                    <p className="text-sm">Try a different search term</p>
                  </>
                ) : (
                  <>
                    <p className="text-lg font-medium mb-2">No visits yet</p>
                    <p className="text-sm mb-4">
                      Get started by creating a new visit
                    </p>
                    <Button onClick={handleCreateVisit}>+ Create Visit</Button>
                  </>
                )}
              </div>
            </Card.Panel>
          </Card.Root>
        )}
      </div>

      {/* Create Visit Modal */}
      <Dialog.Root open={isModalOpen} onOpenChange={setIsModalOpen}>
        <Dialog.Popup>
          <Dialog.Header>
            <Dialog.Title>
              {step === 'mobile' ? 'Search Patient' : 'Create Visit'}
            </Dialog.Title>
          </Dialog.Header>

          <Dialog.Panel>
            {step === 'mobile' ? (
              <div className="space-y-5">
                <div className="flex flex-col items-start gap-2">
                  <Label htmlFor="mobile">Mobile *</Label>
                  <Input
                    id="mobile"
                    type="tel"
                    value={mobileNumber}
                    placeholder="Enter mobile number (e.g., +91 9876543210)"
                    autoFocus
                    onChange={(e) => {
                      setMobileNumber(formatPhoneInput(e.target.value));
                      setErrors({});
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && mobileNumber.trim()) {
                        handleSearchPatient();
                      }
                    }}
                  />
                  {errors.mobile && (
                    <p className="text-sm text-red-500">{errors.mobile}</p>
                  )}
                </div>

                <p className="text-sm text-muted-foreground">
                  Enter the patient's mobile number to search. If the patient
                  exists, we’ll use their information. Otherwise, you’ll be
                  asked to enter their details.
                </p>
              </div>
            ) : (
              <div className="space-y-5">
                {foundPatient && (
                  <div className="rounded-md border p-3 text-sm text-green-600">
                    ✓ Patient found in database
                    <div className="font-medium">
                      {foundPatient.name} • {foundPatient.mobile}
                    </div>
                  </div>
                )}

                <div className="flex flex-col items-start gap-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={newPatient.name}
                    placeholder="Enter patient name"
                    disabled={!!foundPatient}
                    autoFocus={!foundPatient}
                    onChange={(e) =>
                      setNewPatient({ ...newPatient, name: e.target.value })
                    }
                  />
                  {errors.name && (
                    <p className="text-sm text-red-500">{errors.name}</p>
                  )}
                </div>

                <div className="flex flex-col items-start gap-2">
                  <Label htmlFor="patient-mobile">Mobile *</Label>
                  <Input
                    id="patient-mobile"
                    type="tel"
                    value={newPatient.mobile}
                    placeholder="Enter mobile number (e.g., +91 9876543210)"
                    disabled={!!foundPatient}
                    onChange={(e) =>
                      setNewPatient({
                        ...newPatient,
                        mobile: formatPhoneInput(e.target.value),
                      })
                    }
                  />
                  {errors.mobile && (
                    <p className="text-sm text-red-500">{errors.mobile}</p>
                  )}
                </div>

                <div className="flex flex-col items-start gap-2">
                  <Label htmlFor="age">Age</Label>
                  <Input
                    id="age"
                    type="number"
                    min="0"
                    value={newPatient.age}
                    placeholder="Enter age (optional)"
                    onChange={(e) =>
                      setNewPatient({ ...newPatient, age: e.target.value })
                    }
                  />
                  {errors.age && (
                    <p className="text-sm text-red-500">{errors.age}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Gender *</Label>
                  <div className="flex gap-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="gender"
                        value="M"
                        checked={newPatient.gender === 'M'}
                        disabled={!!foundPatient}
                        onChange={(e) =>
                          setNewPatient({
                            ...newPatient,
                            gender: e.target.value as 'M' | 'F',
                          })
                        }
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
                        disabled={!!foundPatient}
                        onChange={(e) =>
                          setNewPatient({
                            ...newPatient,
                            gender: e.target.value as 'M' | 'F',
                          })
                        }
                        className="mr-2"
                      />
                      Female
                    </label>
                  </div>

                  {errors.gender && (
                    <p className="text-sm text-red-500">{errors.gender}</p>
                  )}
                </div>

                <div className="flex flex-col items-start gap-2">
                  <Label htmlFor="reason">Visit Reason</Label>
                  <Input
                    id="reason"
                    value={visitReason}
                    placeholder="e.g., General consultation, Follow-up"
                    onChange={(e) => setVisitReason(e.target.value)}
                  />
                </div>

                {clinicDoctors.length > 1 && (
                  <div className="flex flex-col items-start gap-2">
                    <Label>Select Doctor *</Label>
                    <Select.Root
                      value={selectedDoctorId}
                      onValueChange={(value) => {
                        if (value) {
                          setSelectedDoctorId(value);
                          setDoctorError('');
                        }
                      }}
                    >
                      <Select.Trigger className="w-full">
                        <Select.Value placeholder="Select doctor" />
                      </Select.Trigger>
                      <Select.Popup>
                        {clinicDoctors.map((doc) => (
                          <Select.Item key={doc.id} value={doc.id}>
                            {doc.name}
                          </Select.Item>
                        ))}
                      </Select.Popup>
                    </Select.Root>

                    {doctorError && (
                      <p className="text-sm text-red-500">{doctorError}</p>
                    )}
                  </div>
                )}
              </div>
            )}
          </Dialog.Panel>

          <Dialog.Footer>
            <Button
              variant="outline"
              onClick={() => {
                if (step === 'patient-form') {
                  setStep('mobile');
                  setErrors({});
                } else {
                  setIsModalOpen(false);
                }
              }}
            >
              {step === 'mobile' ? 'Cancel' : 'Back'}
            </Button>

            <Button
              onClick={() => {
                step === 'mobile'
                  ? handleSearchPatient()
                  : handleCreateVisitSubmit();
              }}
              disabled={searching}
            >
              {searching
                ? 'Searching...'
                : step === 'mobile'
                  ? 'Search'
                  : 'Create Visit'}
            </Button>
          </Dialog.Footer>
        </Dialog.Popup>
      </Dialog.Root>
    </div>
  );
}
