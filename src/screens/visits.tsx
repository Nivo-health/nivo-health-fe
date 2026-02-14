import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { DatePicker } from '@/components/ui/date-picker';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { DataTable } from '@/components/ui/table-ui';
import { toast } from '@/components/ui/toast';
import CreateVisitModal from '@/components/visits/modals/create-visit-modal';
import { cn } from '@/lib/utils';
import { useCurrentClinic } from '@/queries/clinic.queries';
import {
  useCreatePatient,
  usePatientSearchLazy,
} from '@/queries/patients.queries';
import { useCreateVisit, useVisitsList } from '@/queries/visits.queries';
import { useFiltersStore } from '@/stores/filters.store';
import type { Patient, Visit, VISIT_STATUS } from '@/types';
import {
  extractValidationErrors,
  getErrorMessage,
  hasValidationErrors,
} from '@/utils/error-handler';
import {
  formatPhoneForAPI,
  validatePhoneNumber,
} from '@/utils/phone-validation';
import { ColumnDef } from '@tanstack/react-table';
import dayjs from 'dayjs';
import ClipboardList from 'lucide-react/dist/esm/icons/clipboard-list';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const STATUS_LABEL = {
  WAITING: 'Waiting',
  IN_PROGRESS: 'In progress',
  COMPLETED: 'Completed',
} as const;

const Lable = ({ status }: { status: keyof typeof VISIT_STATUS }) => {
  return (
    <span
      className={cn(`px-2 py-1 rounded-full text-xs font-normal text-white`, {
        'bg-yellow-500': status === 'WAITING',
        'bg-primary': status === 'IN_PROGRESS',
        'bg-red-800': status === 'COMPLETED',
      })}
    >
      {STATUS_LABEL[status]}
    </span>
  );
};

export const appointmentColumns: ColumnDef<Visit>[] = [
  {
    accessorKey: 'patient.name',
    header: 'Name',
    size: 200,
    cell: ({ getValue }) => (
      <span className="block truncate capitalize">
        {getValue<string>() || '-'}
      </span>
    ),
  },
  {
    accessorKey: 'patient.mobile',
    header: 'Mobile',
    size: 150,
    cell: ({ getValue }) => (
      <span className="block truncate">{getValue<string>() || '-'}</span>
    ),
  },
  {
    accessorKey: 'token_number',
    header: 'Token',
    size: 180,
    cell: ({ getValue }) => (
      <span className="truncate capitalize px-2 py-1 rounded-md bg-primary text-white">
        {getValue<string>() || '-'}
      </span>
    ),
  },
  {
    accessorKey: 'visit_status',
    header: 'Status',
    size: 180,
    cell: ({ row: { original } }) => {
      const { visit_status } = original;
      return <Lable status={visit_status!} />;
    },
  },
];

export default function VisitsScreen() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [selectedDate, setSelectedDate] = useState<string>(() =>
    dayjs().format('YYYY-MM-DD'),
  );

  const [selectedDoctorFilter, setSelectedDoctorFilter] = useState<string>('');

  const [page, setPage] = useState(1);
  const pageSize = 20;

  const selectedVisitStatus = useFiltersStore((state) => state.visitStatus);
  const setSelectedVisitStatus = useFiltersStore(
    (state) => state.setVisitStatus,
  );

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
  const patientSearchMutation = usePatientSearchLazy();
  const searching = patientSearchMutation.isPending;

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

      const searchResults = await patientSearchMutation.mutateAsync({
        query: mobileNumber,
        limit: 20,
      });

      if (searchResults.length > 0) {
        // Patient found - use the first match
        const patient = searchResults[0];
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
      } else {
        // Create new patient
        const patient = await createPatientMutation.mutateAsync({
          name: newPatient.name.trim(),
          mobile: formatPhoneForAPI(newPatient.mobile),
          age: newPatient.age ? Number(newPatient.age) : undefined,
          gender: newPatient.gender as 'M' | 'F',
        });
        patientId = patient.id;
      }

      // Create visit
      const visit = await createVisitMutation.mutateAsync({
        patientId,
        visitReason: visitReason.trim() || 'General consultation',
        status: 'waiting',
        doctorId: selectedDoctorId || undefined,
      });

      toast.add({
        type: 'success',
        title: 'Visit created successfully!',
      });
      setIsModalOpen(false);

      // Reload visits and navigate
      navigate(`/visit/${visit.id}`);
    } catch (error: any) {
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

  if (loading) {
    return (
      <div className="h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Loading visits...</div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-background overflow-x-hidden md:pb-0 pb-24">
      <div className="max-w-7xl mx-auto px-3 md:px-6 py-4 md:py-6">
        {/* Header - Compact on Mobile */}
        <div className="mb-4 md:mb-3">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex-1 min-w-0">
              <h6 className="text-sm md:text-sm font-medium text-foreground flex items-center gap-2">
                <ClipboardList className="size-4" /> Queue
              </h6>
            </div>
            <Button onClick={handleCreateVisit} size="sm">
              + Create
            </Button>
          </div>
        </div>

        {/* Filters - Compact on Mobile */}
        <div className="mb-3 flex flex-col sm:flex-row gap-2 md:gap-4">
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
        {loading ? (
          <div className="h-96 bg-background flex items-center justify-center">
            <div className="text-muted-foreground">Loading...</div>
          </div>
        ) : (
          <>
            {filteredVisits.length > 0 ? (
              <>
                <div className="md:block hidden">
                  <DataTable
                    data={filteredVisits}
                    columns={appointmentColumns}
                  />
                </div>

                <div className="grid gap-3 md:hidden">
                  {filteredVisits.map((visit) => (
                    <Card.Root
                      key={visit.id}
                      className="border-neutral-200 transition-all md:border-0"
                    >
                      <Card.Panel className="p-3">
                        <button
                          type="button"
                          onClick={() => handleVisitClick(visit)}
                          className="w-full text-left"
                        >
                          <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3 md:gap-4 flex-1 min-w-0">
                              <div className="flex-1 min-w-0 grid grid-cols-1 md:grid-cols-[minmax(150px,1fr)_minmax(120px,auto)_minmax(140px,auto)] gap-2 md:gap-4 items-center">
                                <div className="min-w-0 flex">
                                  <h3 className="text-base text-gray-900 truncate flex-1">
                                    {visit.patient?.name || 'Unknown Patient'}
                                  </h3>
                                  <div className="min-w-0">
                                    {visit?.token_number ? (
                                      <span className="truncate capitalize bg-primary text-white px-2 py-1 rounded-full text-xs font-normal">
                                        Token: {visit.token_number}
                                      </span>
                                    ) : (
                                      <span className="text-sm text-muted-foreground">
                                        —
                                      </span>
                                    )}
                                  </div>
                                </div>

                                <div className="min-w-0 flex justify-between">
                                  {visit.patient?.mobile ? (
                                    <span className="text-sm text-muted-foreground whitespace-nowrap">
                                      Mobile: {visit.patient.mobile}
                                    </span>
                                  ) : (
                                    <span className="text-sm text-muted-foreground">
                                      —
                                    </span>
                                  )}
                                  <Lable status={visit.visit_status!} />
                                </div>
                              </div>
                            </div>
                          </div>
                        </button>
                      </Card.Panel>
                    </Card.Root>
                  ))}
                </div>
              </>
            ) : (
              <Card.Root className="border-teal-200">
                <Card.Panel className="p-12 text-center">
                  <div className="text-gray-500">
                    <p className="text-lg font-medium mb-2">No visits found</p>
                  </div>
                </Card.Panel>
              </Card.Root>
            )}
          </>
        )}
      </div>

      <CreateVisitModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        step={step}
        onStepChange={setStep}
        mobileNumber={mobileNumber}
        onMobileNumberChange={setMobileNumber}
        foundPatient={foundPatient}
        newPatient={newPatient}
        onNewPatientChange={setNewPatient}
        visitReason={visitReason}
        onVisitReasonChange={setVisitReason}
        clinicDoctors={clinicDoctors}
        selectedDoctorId={selectedDoctorId}
        onSelectedDoctorIdChange={(value) => {
          setSelectedDoctorId(value);
          setDoctorError('');
        }}
        doctorError={doctorError}
        errors={errors}
        onErrorsChange={setErrors}
        onSearchPatient={handleSearchPatient}
        onCreateVisit={handleCreateVisitSubmit}
        searching={searching}
      />
    </div>
  );
}
