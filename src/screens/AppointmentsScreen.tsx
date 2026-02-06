import { useState, useEffect } from 'react';
import { appointmentService } from '../services/appointmentService';
import { patientService } from '../services/patientService';
import { toast } from '../utils/toast';
import type { Appointment, ClinicDoctor, Patient } from '../types';
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

export default function AppointmentsScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [filteredAppointments, setFilteredAppointments] = useState<
    Appointment[]
  >([]);
  const [loading, setLoading] = useState(true);

  // Date filter - default to today
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const today = new Date();
    return today.toISOString().split('T')[0]; // YYYY-MM-DD format
  });

  // Doctor filter
  const [selectedDoctorFilter, setSelectedDoctorFilter] = useState<string>('');

  // Doctors list
  const [doctors, setDoctors] = useState<ClinicDoctor[]>([]);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [step, setStep] = useState<'mobile' | 'patient-form'>('mobile');
  const [mobileNumber, setMobileNumber] = useState('');
  const [searching, setSearching] = useState(false);
  const [foundPatient, setFoundPatient] = useState<Patient | null>(null);
  const [newPatient, setNewPatient] = useState({
    name: '',
    mobile: '',
    gender: '' as 'M' | 'F' | '',
  });
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('');
  const [doctorError, setDoctorError] = useState<string>('');
  const [appointmentDateTime, setAppointmentDateTime] = useState<string>('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load doctors once on mount
  useEffect(() => {
    const loadDoctors = async () => {
      try {
        const clinic = await clinicService.getCurrentClinic();
        const clinicDoctors = clinic?.doctors || [];
        setDoctors(clinicDoctors);
      } catch (error) {
        console.error('❌ Failed to load doctors from clinic:', error);
      }
    };

    loadDoctors();
  }, []);

  // Load all appointments when filters change
  useEffect(() => {
    loadAppointments();
  }, [selectedDate, selectedDoctorFilter]);

  // Filter appointments based on search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredAppointments(appointments);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = appointments.filter((appointment) => {
      const nameMatch = appointment.name?.toLowerCase().includes(query);
      const mobileMatch = appointment.mobile_number?.includes(query);

      return nameMatch || mobileMatch;
    });

    setFilteredAppointments(filtered);
  }, [searchQuery, appointments]);

  const loadAppointments = async () => {
    try {
      setLoading(true);
      console.log('🔄 Loading appointments with filters:', {
        date: selectedDate,
        doctorId: selectedDoctorFilter,
      });

      // Handle "all" value for doctor filter
      const doctorId =
        selectedDoctorFilter && selectedDoctorFilter !== 'all'
          ? selectedDoctorFilter
          : undefined;

      const result = await appointmentService.getAllAppointments(
        1,
        50,
        selectedDate,
        doctorId,
      );

      console.log('📊 Appointments loaded:', result.appointments.length);
      setAppointments(result.appointments);
      setFilteredAppointments(result.appointments);
    } catch (error) {
      console.error('❌ Failed to load appointments:', error);
      toast.error('Failed to load appointments');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAppointment = () => {
    setIsModalOpen(true);
    setStep('mobile');
    setMobileNumber('');
    setFoundPatient(null);
    setNewPatient({ name: '', mobile: '', gender: '' });
    setAppointmentDateTime('');
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
        // Patient found - use the first match and prefill form data
        const patient = searchResults[0];
        console.log('✅ Patient found:', patient);
        setFoundPatient(patient);
        // Prefill all patient data from search result
        setNewPatient({
          name: patient.name || '',
          mobile: patient.mobile || mobileNumber,
          gender: patient.gender || '',
        });
        setStep('patient-form');
      } else {
        // Patient not found - show form to enter details manually
        console.log('❌ Patient not found, showing form to enter details');
        setFoundPatient(null);
        setNewPatient({
          name: '',
          mobile: mobileNumber,
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
    if (!appointmentDateTime) {
      newErrors.appointmentDateTime = 'Appointment date and time is required';
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

  const handleCreateAppointmentSubmit = async () => {
    if (step === 'mobile') {
      await handleSearchPatient();
      return;
    }

    // Step: patient-form - validate and create appointment
    if (!validatePatientForm()) {
      return;
    }

    try {
      // Map gender to API format
      const gender = newPatient.gender === 'M' ? 'MALE' : 'FEMALE';

      // Get doctor ID (use selected or first doctor if only one)
      const doctorId =
        selectedDoctorId || (doctors.length === 1 ? doctors[0].id : '');

      if (!doctorId) {
        toast.error('Please select a doctor');
        return;
      }

      // Convert datetime-local format to ISO format
      const isoDateTime = appointmentDateTime
        ? new Date(appointmentDateTime).toISOString()
        : '';

      if (!isoDateTime) {
        toast.error('Invalid appointment date/time');
        return;
      }

      // Create appointment directly (no patient creation needed)
      // The appointment API accepts patient details (name, mobile_number, gender) directly
      console.log('🔄 Creating appointment...');
      const appointment = await appointmentService.create({
        name: newPatient.name.trim(),
        mobile_number: newPatient.mobile.trim(),
        gender: gender,
        doctor_id: doctorId,
        appointment_date_time: isoDateTime,
        appointment_status: 'WAITING',
        source: 'PHONE',
      });

      console.log('✅ Appointment created:', appointment.id);
      toast.success('Appointment created successfully!');
      setIsModalOpen(false);

      // Reload appointments
      await loadAppointments();
    } catch (error: any) {
      console.error('❌ Failed to create appointment:', error);

      // Extract validation errors if present
      if (hasValidationErrors(error)) {
        const validationErrors = extractValidationErrors(error);

        // Set form field errors
        setErrors((prevErrors) => ({
          ...prevErrors,
          ...validationErrors,
        }));

        // Also set doctor error if present (for doctor select field)
        if (validationErrors.doctor) {
          setDoctorError(validationErrors.doctor);
        }

        // Show general error message
        toast.error(getErrorMessage(error));
      } else {
        // Show general error message
        toast.error(getErrorMessage(error));
      }
    }
  };

  const handleMarkCheckIn = async (
    appointmentId: string,
    e: React.MouseEvent,
  ) => {
    e.stopPropagation(); // Prevent card click
    try {
      const updated = await appointmentService.updateStatus(
        appointmentId,
        'CHECKED_IN',
      );
      if (updated) {
        toast.success('Appointment marked as checked in');
        await loadAppointments(); // Reload to refresh the list
      } else {
        toast.error('Failed to mark check in');
      }
    } catch (error: any) {
      console.error('❌ Failed to mark check in:', error);
      toast.error(error?.message || 'Failed to mark check in');
    }
  };

  const formatDateTime = (dateTime: string) => {
    try {
      const date = new Date(dateTime);
      return date.toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateTime;
    }
  };

  const getStatusColor = (status: string) => {
    const s = status.toLowerCase();
    if (s === 'waiting') return 'bg-yellow-100 text-yellow-800';
    if (s === 'checked_in') return 'bg-teal-100 text-teal-800';
    if (s === 'no_show') return 'bg-red-100 text-red-800';
    return 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (status: string) => {
    const s = status.toLowerCase();
    if (s === 'waiting') return 'Waiting';
    if (s === 'checked_in') return 'Checked In';
    if (s === 'no_show') return 'No Show';
    return status;
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading appointments...</div>
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
                Appointments
              </h1>
              <p className="text-xs md:text-base text-gray-600 mt-1">
                {filteredAppointments.length}{' '}
                {filteredAppointments.length === 1
                  ? 'appointment'
                  : 'appointments'}
                {searchQuery && ` found`}
              </p>
            </div>
            <Button
              onClick={handleCreateAppointment}
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
              placeholder="Search by name or mobile..."
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
        </div>

        {filteredAppointments.length > 0 ? (
          <div className="grid gap-3">
            {filteredAppointments.map((appointment) => (
              <Card
                key={appointment.id}
                className="border-teal-200 hover:border-teal-400 hover:shadow-lg transition-all"
              >
                <CardContent className="p-3 md:p-5">
                  <div className="flex items-center md:items-start gap-3 md:gap-4">
                    {/* Avatar */}
                    <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-teal-500 to-teal-600 rounded-full flex items-center justify-center text-white font-bold text-base md:text-lg flex-shrink-0">
                      {appointment.name?.charAt(0).toUpperCase() || '?'}
                    </div>

                    {/* Main Content */}
                    <div className="flex-1 min-w-0">
                      {/* Mobile View - Stacked */}
                      <div className="md:hidden space-y-2">
                        {/* Name and Status Row */}
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="text-base font-semibold text-gray-900 truncate flex-1">
                            {appointment.name || 'Unknown'}
                          </h3>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-semibold flex-shrink-0 ${getStatusColor(appointment.appointment_status)}`}
                          >
                            {getStatusLabel(appointment.appointment_status)}
                          </span>
                        </div>

                        {/* Mobile Number */}
                        {appointment.mobile_number && (
                          <div className="text-sm text-gray-600">
                            📱 {appointment.mobile_number}
                          </div>
                        )}

                        {/* Doctor */}
                        {appointment.doctor && (
                          <div className="text-sm text-gray-600">
                            👨‍⚕️ {appointment.doctor.name}
                          </div>
                        )}

                        {/* Appointment Time */}
                        {appointment.appointment_date_time && (
                          <div className="text-sm text-gray-600">
                            🕐{' '}
                            {formatDateTime(appointment.appointment_date_time)}
                          </div>
                        )}

                        {/* Check In Button - Mobile */}
                        {appointment.appointment_status === 'WAITING' && (
                          <div className="pt-1">
                            <Button
                              size="sm"
                              onClick={(e) =>
                                handleMarkCheckIn(appointment.id, e)
                              }
                              className="w-full"
                            >
                              Mark Check In
                            </Button>
                          </div>
                        )}
                      </div>

                      {/* Desktop View - Column-based layout */}
                      <div className="hidden md:flex items-center gap-4 w-full">
                        <div className="flex-1 min-w-0 grid grid-cols-[minmax(150px,1fr)_minmax(120px,auto)_minmax(180px,auto)_minmax(200px,auto)] gap-4 items-center">
                          {/* Name Column */}
                          <div className="min-w-0">
                            <h3 className="text-lg font-semibold text-gray-900 truncate">
                              {appointment.name || 'Unknown'}
                            </h3>
                          </div>

                          {/* Mobile Column */}
                          <div className="min-w-0">
                            {appointment.mobile_number ? (
                              <span className="text-sm text-gray-600 whitespace-nowrap">
                                📱 {appointment.mobile_number}
                              </span>
                            ) : (
                              <span className="text-sm text-gray-400">—</span>
                            )}
                          </div>

                          {/* Doctor Column */}
                          <div className="min-w-0">
                            {appointment.doctor ? (
                              <span className="text-sm text-gray-600 whitespace-nowrap">
                                👨‍⚕️ {appointment.doctor.name}
                              </span>
                            ) : (
                              <span className="text-sm text-gray-400">—</span>
                            )}
                          </div>

                          {/* Appointment Time Column */}
                          <div className="min-w-0">
                            {appointment.appointment_date_time ? (
                              <span className="text-sm text-gray-600 whitespace-nowrap">
                                🕐{' '}
                                {formatDateTime(
                                  appointment.appointment_date_time,
                                )}
                              </span>
                            ) : (
                              <span className="text-sm text-gray-400">—</span>
                            )}
                          </div>
                        </div>

                        {/* Status Badge and Check In Button - Desktop */}
                        <div className="flex items-center gap-3 flex-shrink-0">
                          <span
                            className={`px-3 py-1.5 rounded-full text-xs font-semibold ${getStatusColor(appointment.appointment_status)}`}
                          >
                            {getStatusLabel(appointment.appointment_status)}
                          </span>
                          {appointment.appointment_status === 'WAITING' && (
                            <Button
                              size="sm"
                              onClick={(e) =>
                                handleMarkCheckIn(appointment.id, e)
                              }
                              className="whitespace-nowrap"
                            >
                              Mark Check In
                            </Button>
                          )}
                        </div>
                      </div>
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
                    <p className="text-lg font-medium mb-2">
                      No appointments found
                    </p>
                    <p className="text-sm">Try a different search term</p>
                  </>
                ) : (
                  <>
                    <p className="text-lg font-medium mb-2">
                      No appointments yet
                    </p>
                    <p className="text-sm">Appointments will appear here</p>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Create Appointment Modal */}
      <Modal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        title={
          step === 'mobile'
            ? 'Create Appointment'
            : foundPatient
              ? 'Create Appointment - Patient Found'
              : 'Create Appointment - New Patient'
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
            <Button
              onClick={handleCreateAppointmentSubmit}
              disabled={searching}
            >
              {searching
                ? 'Searching...'
                : step === 'mobile'
                  ? 'Search'
                  : 'Create Appointment'}
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
                    error={doctorError}
                  >
                    {doctors.map((doc) => (
                      <SelectItem key={doc.id} value={doc.id}>
                        {doc.name}
                      </SelectItem>
                    ))}
                  </Select>
                </div>
              )}

              {/* Appointment Date/Time */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Appointment Date & Time *
                </label>
                <input
                  type="datetime-local"
                  value={appointmentDateTime}
                  onChange={(e) => {
                    setAppointmentDateTime(e.target.value);
                    setErrors({ ...errors, appointmentDateTime: '' });
                  }}
                  className={`flex h-10 w-full rounded-md border bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
                    errors.appointmentDateTime
                      ? 'border-red-500 focus-visible:ring-red-500'
                      : 'border-teal-300 focus-visible:ring-teal-500'
                  }`}
                  min={new Date().toISOString().slice(0, 16)}
                />
                {errors.appointmentDateTime && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.appointmentDateTime}
                  </p>
                )}
              </div>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
}
