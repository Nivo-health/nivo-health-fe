import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Input,
  Button,
  Modal,
  DatePicker,
  Select,
  SelectItem,
} from '../components/ui_old';
import { Card, CardContent } from '../components/ui_old/Card';
import { patientService } from '../services/patientService';
import { visitService } from '../services/visitService';
import { toast } from '../utils/toast';
import type { Patient, Visit, ClinicDoctor } from '../types';
import { clinicService } from '../services/clinicService';
import {
  validatePhoneNumber,
  formatPhoneInput,
} from '../utils/phoneValidation';
import {
  extractValidationErrors,
  getErrorMessage,
  hasValidationErrors,
} from '../utils/errorHandler';

export default function VisitsScreen() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [visits, setVisits] = useState<Visit[]>([]);
  const [filteredVisits, setFilteredVisits] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Date filter - default to today
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const today = new Date();
    return today.toISOString().split('T')[0]; // YYYY-MM-DD format
  });

  // Doctor filter
  const [selectedDoctorFilter, setSelectedDoctorFilter] = useState<string>('');

  // Visit status filter - default to WAITING
  const [selectedVisitStatus, setSelectedVisitStatus] =
    useState<string>('WAITING');

  // Modal states
  const [step, setStep] = useState<'mobile' | 'patient-form'>('mobile');
  const [mobileNumber, setMobileNumber] = useState('');
  const [searching, setSearching] = useState(false);
  const [foundPatient, setFoundPatient] = useState<Patient | null>(null);
  const [newPatient, setNewPatient] = useState({
    name: '',
    mobile: '',
    age: '',
    gender: '' as 'M' | 'F' | '',
  });
  const [visitReason, setVisitReason] = useState('');
  const [doctors, setDoctors] = useState<ClinicDoctor[]>([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('');
  const [doctorError, setDoctorError] = useState<string>('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load all visits when filters change
  useEffect(() => {
    loadVisits();
  }, [selectedDate, selectedDoctorFilter, selectedVisitStatus]);

  // Load doctors once on mount
  useEffect(() => {
    const loadDoctors = async () => {
      try {
        const clinic = await clinicService.getCurrentClinic();
        const clinicDoctors = clinic?.doctors || [];
        setDoctors(clinicDoctors);
        if (clinicDoctors.length === 1) {
          setSelectedDoctorId(clinicDoctors[0].id);
        }
      } catch (error) {
        console.error('❌ Failed to load doctors from clinic:', error);
      }
    };

    loadDoctors();
  }, []);

  // Filter visits based on search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredVisits(visits);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = visits.filter((visit) => {
      const patient = visit.patient;
      if (!patient) return false;

      const nameMatch = patient.name?.toLowerCase().includes(query);
      const mobileMatch = patient.mobile?.includes(query);
      const reasonMatch = visit.visit_reason?.toLowerCase().includes(query);

      return nameMatch || mobileMatch || reasonMatch;
    });

    setFilteredVisits(filtered);
  }, [searchQuery, visits]);

  const loadVisits = async () => {
    try {
      setLoading(true);
      console.log('🔄 Loading visits with filters:', {
        date: selectedDate,
        doctorId: selectedDoctorFilter,
        visitStatus: selectedVisitStatus,
      });

      const visitStatus = selectedVisitStatus
        ? (selectedVisitStatus as
            | 'WAITING'
            | 'IN_PROGRESS'
            | 'COMPLETED'
            | 'CANCELLED')
        : undefined;

      // Handle "all" value for doctor filter
      const doctorId =
        selectedDoctorFilter && selectedDoctorFilter !== 'all'
          ? selectedDoctorFilter
          : undefined;

      const result = await visitService.getAllVisits(
        1,
        50,
        selectedDate,
        visitStatus,
        doctorId,
      );

      console.log('📊 Visits loaded:', result.visits.length);
      setVisits(result.visits);
      setFilteredVisits(result.visits);
    } catch (error) {
      console.error('❌ Failed to load visits:', error);
      toast.error('Failed to load visits');
    } finally {
      setLoading(false);
    }
  };

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
    if (doctors.length === 1) {
      setSelectedDoctorId(doctors[0].id);
    } else if (doctors.length > 1) {
      setSelectedDoctorId(''); // Reset to allow user to choose
    }
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
      setSearching(true);
      setErrors({});

      console.log('🔍 Searching for patient with mobile:', mobileNumber);
      const searchResults = await patientService.search(mobileNumber);

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
      toast.error('Failed to search patient');
    } finally {
      setSearching(false);
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
    if (doctors.length > 1 && !selectedDoctorId) {
      setDoctorError('Please select a doctor');
    } else {
      setDoctorError('');
    }
    setErrors(newErrors);
    const hasFieldErrors = Object.keys(newErrors).length === 0;
    const hasDoctorError = doctors.length > 1 ? !selectedDoctorId : false;
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
        const patient = await patientService.create({
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
      const visit = await visitService.create({
        patientId,
        visitReason: visitReason.trim() || 'General consultation',
        status: 'waiting',
        doctorId: selectedDoctorId || undefined,
      });

      console.log('✅ Visit created:', visit.id);
      toast.success('Visit created successfully!');
      setIsModalOpen(false);

      // Reload visits and navigate
      await loadVisits();
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
        toast.error(getErrorMessage(error));
      } else {
        // Show general error message
        toast.error(getErrorMessage(error));
      }
    }
  };

  const handleVisitClick = (visit: Visit) => {
    navigate(`/visit/${visit.id}`);
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
              className="flex-shrink-0 text-sm md:text-base px-3 md:px-4"
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
              className="w-full text-sm md:text-base"
            />
          </div>
          <div className="sm:w-40 md:w-48">
            <DatePicker
              value={selectedDate}
              onChange={(value) => setSelectedDate(value)}
              placeholder="Select date"
              className="w-full text-sm"
            />
          </div>

          {/* Doctor Filter */}
          {doctors.length > 0 && (
            <div className="sm:w-48 md:w-56">
              <Select
                value={selectedDoctorFilter || undefined}
                onValueChange={(value) => setSelectedDoctorFilter(value || '')}
                placeholder="All Doctors"
                className="w-full text-sm"
              >
                <SelectItem value="all">All Doctors</SelectItem>
                {doctors.map((doc) => (
                  <SelectItem key={doc.id} value={doc.id}>
                    {doc.name}
                  </SelectItem>
                ))}
              </Select>
            </div>
          )}

          {/* Visit Status Filter */}
          <div className="sm:w-48 md:w-56">
            <Select
              value={selectedVisitStatus}
              onValueChange={(value) => setSelectedVisitStatus(value)}
              placeholder="All Statuses"
              className="w-full text-sm"
            >
              <SelectItem value="WAITING">Waiting</SelectItem>
              <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
              <SelectItem value="COMPLETED">Completed</SelectItem>
              <SelectItem value="CANCELLED">Cancelled</SelectItem>
            </Select>
          </div>
        </div>

        {filteredVisits.length > 0 ? (
          <div className="grid gap-3">
            {filteredVisits.map((visit) => (
              <Card
                key={visit.id}
                className="border-teal-200 hover:border-teal-300 hover:shadow-md transition-all cursor-pointer"
                onClick={() => handleVisitClick(visit)}
              >
                <CardContent className="p-3 md:p-5">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 md:gap-4 flex-1 min-w-0">
                      {/* Avatar */}
                      <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-teal-500 to-teal-600 rounded-full flex items-center justify-center text-white font-bold text-base md:text-lg flex-shrink-0">
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
                    <div className="flex-shrink-0">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(visit.visit_status || visit.status)}`}
                      >
                        {getStatusLabel(visit.visit_status || visit.status)}
                      </span>
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
            </CardContent>
          </Card>
        )}
      </div>

      {/* Create Visit Modal */}
      <Modal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        title={
          step === 'mobile'
            ? 'Create Visit'
            : foundPatient
              ? 'Create Visit - Patient Found'
              : 'Create Visit - New Patient'
        }
        size="lg"
        footer={
          <>
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
            <Button onClick={handleCreateVisitSubmit} disabled={searching}>
              {searching
                ? 'Searching...'
                : step === 'mobile'
                  ? 'Search'
                  : 'Create Visit'}
            </Button>
          </>
        }
      >
        <div className="space-y-5">
          {step === 'mobile' ? (
            <>
              <Input
                label="Mobile Number *"
                type="tel"
                value={mobileNumber}
                onChange={(e) => {
                  setMobileNumber(formatPhoneInput(e.target.value));
                  setErrors({});
                }}
                error={errors.mobile}
                placeholder="Enter mobile number (e.g., +91 9876543210)"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && mobileNumber.trim()) {
                    handleSearchPatient();
                  }
                }}
              />
              <p className="text-sm text-gray-600">
                Enter the patient's mobile number to search. If the patient
                exists, we'll use their information. Otherwise, you'll be asked
                to enter their details.
              </p>
            </>
          ) : (
            <>
              {foundPatient && (
                <div className="p-3 bg-teal-50 border border-teal-200 rounded-lg mb-4">
                  <p className="text-sm text-teal-800 font-medium">
                    ✓ Patient found in database
                  </p>
                  <p className="text-xs text-teal-600 mt-1">
                    {foundPatient.name} • {foundPatient.mobile}
                  </p>
                </div>
              )}

              <Input
                label="Name *"
                value={newPatient.name}
                onChange={(e) =>
                  setNewPatient({ ...newPatient, name: e.target.value })
                }
                error={errors.name}
                placeholder="Enter patient name"
                disabled={!!foundPatient}
                autoFocus={!foundPatient}
              />

              <Input
                label="Mobile *"
                type="tel"
                value={newPatient.mobile}
                onChange={(e) =>
                  setNewPatient({
                    ...newPatient,
                    mobile: formatPhoneInput(e.target.value),
                  })
                }
                error={errors.mobile}
                placeholder="Enter mobile number (e.g., +91 9876543210)"
                disabled={!!foundPatient}
              />

              <Input
                label="Age"
                type="number"
                value={newPatient.age}
                onChange={(e) =>
                  setNewPatient({ ...newPatient, age: e.target.value })
                }
                error={errors.age}
                placeholder="Enter age (optional)"
                min="0"
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Gender *
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="gender"
                      value="M"
                      checked={newPatient.gender === 'M'}
                      onChange={(e) =>
                        setNewPatient({
                          ...newPatient,
                          gender: e.target.value as 'M' | 'F',
                        })
                      }
                      className="mr-2"
                      disabled={!!foundPatient}
                    />
                    Male
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="gender"
                      value="F"
                      checked={newPatient.gender === 'F'}
                      onChange={(e) =>
                        setNewPatient({
                          ...newPatient,
                          gender: e.target.value as 'M' | 'F',
                        })
                      }
                      className="mr-2"
                      disabled={!!foundPatient}
                    />
                    Female
                  </label>
                </div>
                {errors.gender && (
                  <p className="mt-1 text-sm text-red-600">{errors.gender}</p>
                )}
              </div>

              <Input
                label="Visit Reason (Optional)"
                value={visitReason}
                onChange={(e) => setVisitReason(e.target.value)}
                placeholder="e.g., General consultation, Follow-up, etc."
              />

              {/* Doctor Selection - Only show if more than one doctor */}
              {doctors.length > 1 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Doctor *
                  </label>
                  <Select
                    value={selectedDoctorId || undefined}
                    onValueChange={(value) => {
                      setSelectedDoctorId(value || '');
                      setDoctorError('');
                    }}
                    placeholder="Select doctor"
                    className="w-full"
                  >
                    {doctors.map((doc) => (
                      <SelectItem key={doc.id} value={doc.id}>
                        {doc.name}
                      </SelectItem>
                    ))}
                  </Select>
                  {doctorError && (
                    <p className="mt-1 text-sm text-red-600">{doctorError}</p>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </Modal>
    </div>
  );
}
