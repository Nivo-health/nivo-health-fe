import { useMemo, useState } from 'react';
import type { ClinicDoctor, Patient } from '../types';
import {
  useCreateAppointment,
  useAppointments,
  useUpdateAppointmentStatus,
} from '../queries/appointments.queries';
import { usePatientSearch } from '../queries/patients.queries';
import { useCurrentClinic } from '../queries/clinic.queries';
import {
  validatePhoneNumber,
  formatPhoneInput,
} from '../utils/phoneValidation';
import {
  extractValidationErrors,
  getErrorMessage,
  hasValidationErrors,
} from '../utils/errorHandler';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/date-picker';
import { Card } from '@/components/ui/card';
import { Dialog } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/toast';
import { Select } from '@/components/ui/select';

export default function AppointmentsScreen() {
  const [searchQuery, setSearchQuery] = useState('');

  // Date filter - default to today
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const today = new Date();
    return today.toISOString().split('T')[0]; // YYYY-MM-DD format
  });

  // Doctor filter
  const [selectedDoctorFilter, setSelectedDoctorFilter] = useState<string>('');

  const [page, setPage] = useState(1);
  const pageSize = 20;

  const { data: clinic } = useCurrentClinic();
  const doctors: ClinicDoctor[] = clinic?.doctors || [];
  const createAppointmentMutation = useCreateAppointment();
  const updateAppointmentStatusMutation = useUpdateAppointmentStatus();

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [step, setStep] = useState<'mobile' | 'patient-form'>('mobile');
  const [mobileNumber, setMobileNumber] = useState('');
  const patientSearchQuery = usePatientSearch(mobileNumber);
  const searching = patientSearchQuery.isFetching;
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

  const doctorId =
    selectedDoctorFilter && selectedDoctorFilter !== 'all'
      ? selectedDoctorFilter
      : undefined;

  const { data: appointmentsResult, isLoading: loading } = useAppointments({
    page,
    pageSize,
    date: selectedDate,
    doctorId,
  });

  const appointments = appointmentsResult?.appointments || [];
  const totalCount = appointmentsResult?.count || 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const filteredAppointments = useMemo(() => {
    if (!searchQuery.trim()) return appointments;
    const query = searchQuery.toLowerCase();
    return appointments.filter((appointment) => {
      const nameMatch = appointment.name?.toLowerCase().includes(query);
      const mobileMatch = appointment.mobile_number?.includes(query);
      return nameMatch || mobileMatch;
    });
  }, [searchQuery, appointments]);

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
      setErrors({});

      console.log('🔍 Searching for patient with mobile:', mobileNumber);
      const result = await patientSearchQuery.refetch();
      const searchResults = result.data || [];

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
      toast.add({
        title: 'Failed to search patient',
        type: 'error',
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
        toast.add({
          title: 'Please select a doctor',
          type: 'error',
        });
        return;
      }

      // Convert datetime-local format to ISO format
      const isoDateTime = appointmentDateTime
        ? new Date(appointmentDateTime).toISOString()
        : '';

      if (!isoDateTime) {
        toast.add({
          title: 'Invalid appointment date/time',
          type: 'error',
        });
        return;
      }

      // Create appointment directly (no patient creation needed)
      // The appointment API accepts patient details (name, mobile_number, gender) directly
      console.log('🔄 Creating appointment...');
      const appointment = await createAppointmentMutation.mutateAsync({
        name: newPatient.name.trim(),
        mobile_number: newPatient.mobile.trim(),
        gender: gender,
        doctor_id: doctorId,
        appointment_date_time: isoDateTime,
        appointment_status: 'WAITING',
        source: 'PHONE',
      });

      console.log('✅ Appointment created:', appointment.id);
      toast.add({
        title: 'Appointment created successfully!',
        type: 'success',
      });
      setIsModalOpen(false);
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
        toast.add({
          title: getErrorMessage(error),
          type: 'error',
        });
      } else {
        // Show general error message
        toast.add({
          title: getErrorMessage(error),
          type: 'error',
        });
      }
    }
  };

  const handleMarkCheckIn = async (
    appointmentId: string,
    e: React.MouseEvent,
  ) => {
    e.stopPropagation();

    await toast.promise(
      updateAppointmentStatusMutation.mutateAsync({
        appointmentId,
        status: 'CHECKED_IN',
      }),
      {
        loading: 'Marking appointment as checked in...',
        success: 'Appointment marked as checked in',
        error: (err: any) => err?.message || 'Failed to mark check in',
      },
    );
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
            <Button onClick={handleCreateAppointment} size="sm">
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
              onChange={(value) => {
                setSelectedDate(value);
                setPage(1);
              }}
              placeholder="Select date"
              className="w-full text-sm"
            />
          </div>
          {doctors.length > 0 && (
            <div className="flex flex-col items-start gap-2 sm:w-48 md:w-56">
              <Select.Root
                value={selectedDoctorFilter || undefined}
                onValueChange={(value) => {
                  setSelectedDoctorFilter(value || '');
                  setPage(1);
                }}
              >
                <Select.Trigger className="w-full text-sm">
                  <Select.Value placeholder="All Doctors" />
                </Select.Trigger>

                <Select.Popup>
                  <Select.Item value="all">All Doctors</Select.Item>

                  {doctors.map((doc) => (
                    <Select.Item key={doc.id} value={doc.id}>
                      {doc.name}
                    </Select.Item>
                  ))}
                </Select.Popup>
              </Select.Root>
            </div>
          )}
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

        {filteredAppointments.length > 0 ? (
          <div className="grid gap-3">
            {filteredAppointments.map((appointment) => (
              <Card.Root
                key={appointment.id}
                className="border-teal-200 hover:border-teal-400 hover:shadow-lg transition-all"
              >
                <Card.Panel className="p-3 md:p-5">
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
                            className={`px-2 py-1 rounded-full text-xs font-semibold shrink-0 ${getStatusColor(appointment.appointment_status)}`}
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
                              disabled={
                                updateAppointmentStatusMutation.isPending
                              }
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
                              disabled={
                                updateAppointmentStatusMutation.isPending
                              }
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
            </Card.Panel>
          </Card.Root>
        )}
      </div>

      {/* Create Appointment Modal */}
      <Dialog.Root
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        // TODO: @sandeep add size
        // size="lg"
      >
        <Dialog.Popup>
          <Dialog.Header>
            <Dialog.Title>
              {step === 'mobile'
                ? 'Create Appointment'
                : foundPatient
                  ? 'Create Appointment - Patient Found'
                  : 'Create Appointment - New Patient'}
            </Dialog.Title>
          </Dialog.Header>
          <Dialog.Panel>
            <div className="space-y-5">
              {step === 'mobile' ? (
                <>
                  <div className="flex flex-col items-start gap-2">
                    <Label htmlFor="mobile">Mobile Number *</Label>
                    <Input
                      id="mobile"
                      type="tel"
                      value={mobileNumber}
                      onChange={(e) => {
                        setMobileNumber(formatPhoneInput(e.target.value));
                        setErrors({});
                      }}
                      // TODO: @sandeep add error
                      // error={errors.mobile}
                      placeholder="Enter mobile number (e.g., +91 9876543210)"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && mobileNumber.trim()) {
                          handleSearchPatient();
                        }
                      }}
                    />
                    <p className="text-sm text-gray-600">
                      Enter the patient's mobile number to search. If the
                      patient exists, we'll use their information. Otherwise,
                      you'll be asked to enter their details.
                    </p>
                  </div>
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

                  <div className="flex flex-col items-start gap-2">
                    <Label htmlFor="name">Name *</Label>
                    <Input
                      id="name"
                      value={newPatient.name}
                      onChange={(e) =>
                        setNewPatient({ ...newPatient, name: e.target.value })
                      }
                      // error={errors.name}
                      placeholder="Enter patient name"
                      disabled={!!foundPatient}
                      autoFocus={!foundPatient}
                    />
                  </div>

                  <div className="flex flex-col items-start gap-2">
                    <Label htmlFor="mobile">Mobile *</Label>
                    <Input
                      id="mobile"
                      type="tel"
                      value={newPatient.mobile}
                      onChange={(e) =>
                        setNewPatient({
                          ...newPatient,
                          mobile: formatPhoneInput(e.target.value),
                        })
                      }
                      // error={errors.mobile}
                      placeholder="Enter mobile number (e.g., +91 9876543210)"
                      disabled={!!foundPatient}
                    />
                  </div>

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
                      <p className="mt-1 text-sm text-red-600">
                        {errors.gender}
                      </p>
                    )}
                  </div>

                  {/* Doctor Selection - Only show if more than one doctor */}
                  {doctors.length > 1 && (
                    <div className="flex flex-col items-start gap-2">
                      <Label>Select Doctor *</Label>

                      <Select.Root
                        value={selectedDoctorId || undefined}
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
                          {doctors.map((doc) => (
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
          </Dialog.Panel>
          <Dialog.Footer>
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
          </Dialog.Footer>
        </Dialog.Popup>
      </Dialog.Root>
    </div>
  );
}
